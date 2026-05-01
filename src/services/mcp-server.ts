import { Notice, Plugin, FileSystemAdapter } from 'obsidian';
import type { CortexClient } from '../cortex-client';
import type { CortexSettings } from '../settings';
import { writeMemoryNote } from './vault-writer';

/**
 * Local MCP server bundled into the plugin. Lets Claude Desktop, Cursor, or any
 * MCP-aware client talk to *this specific vault's graph* without leaving Obsidian.
 *
 * Transport: HTTP + JSON-RPC 2.0 (the streamable-HTTP variant of MCP). Every
 * request POSTs a JSON-RPC envelope; the server replies with a single JSON
 * response. We do not implement SSE streaming — synchronous request/response
 * is sufficient for tool calls.
 *
 * Security: binds to 127.0.0.1 only. A random `mcpToken` is generated on first
 * enable and required in the `Authorization: Bearer <token>` header.
 *
 * Claude Desktop config example (after enabling):
 *
 *   "mcpServers": {
 *     "hangarx-obsidian": {
 *       "url": "http://127.0.0.1:7474",
 *       "headers": { "Authorization": "Bearer <your-mcpToken-from-settings>" }
 *     }
 *   }
 */

// Lazy-load Node's http module via the Electron renderer's `require`. Wrapped
// in a function so non-desktop loads don't crash at import time.
function getHttp(): typeof import('http') | null {
  try {
    // @ts-ignore — Electron exposes Node's require in the renderer for plugins.
    return typeof require !== 'undefined' ? require('http') : null;
  } catch {
    return null;
  }
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: any;
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, any>; required?: string[] };
  handler: (args: any) => Promise<unknown>;
}

export class McpServer {
  private server: import('http').Server | null = null;
  private port = 7474;
  private token = '';
  private tools: ToolDef[] = [];
  private _bridgePath = '';

  constructor(
    private plugin: Plugin,
    private client: CortexClient,
    private settings: CortexSettings,
  ) {}

  /** Absolute filesystem path to the stdio bridge script — set after start(). */
  get bridgePath(): string { return this._bridgePath; }

  /** Start the server. Returns the resolved port + token (token is regenerated if missing). */
  async start(): Promise<{ port: number; token: string; bridgePath: string }> {
    const http = getHttp();
    if (!http) throw new Error('HTTP module not available — MCP server requires desktop Obsidian.');
    if (this.server) await this.stop();

    this.port = this.settings.mcpPort || 7474;
    this.token = this.settings.mcpToken || generateToken();
    this.tools = this.buildTools();

    // Write the stdio↔HTTP bridge so Claude Desktop can spawn it without
    // pulling in mcp-remote (which needs Node 20+ for global File).
    this._bridgePath = await this.writeBridgeScript();

    return new Promise((resolve, reject) => {
      const srv = http.createServer((req, res) => this.handleRequest(req, res));
      srv.on('error', err => reject(err));
      srv.listen(this.port, '127.0.0.1', () => {
        this.server = srv;
        new Notice(`Cortex MCP server listening on 127.0.0.1:${this.port}`);
        resolve({ port: this.port, token: this.token, bridgePath: this._bridgePath });
      });
    });
  }

  /**
   * Write a self-contained stdio↔HTTP bridge to the plugin's directory.
   * Reads newline-delimited JSON-RPC from stdin, POSTs each message to our
   * local HTTP server with the bearer token, writes responses back to stdout.
   * Uses only Node's built-in `http`/`url` so it works on Node 16+.
   * Returns the absolute filesystem path Claude Desktop should spawn.
   */
  private async writeBridgeScript(): Promise<string> {
    const adapter = this.plugin.app.vault.adapter;
    const dir = this.plugin.manifest.dir ?? `.obsidian/plugins/${this.plugin.manifest.id}`;
    const relPath = `${dir}/mcp-bridge.cjs`;
    const script = BRIDGE_SCRIPT;
    await adapter.write(relPath, script);
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getFullPath(relPath);
    }
    // Mobile (no FileSystemAdapter) — return relative path; MCP isn't supported there anyway.
    return relPath;
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>(resolve => {
      this.server!.close(() => resolve());
    });
    this.server = null;
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  private async handleRequest(
    req: import('http').IncomingMessage,
    res: import('http').ServerResponse,
  ): Promise<void> {
    // CORS for browser-hosted MCP clients during development.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Auth: require Bearer token matching `this.token`.
    const authHeader = req.headers['authorization'] ?? '';
    const expected = `Bearer ${this.token}`;
    if (authHeader !== expected) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      let request: JsonRpcRequest;
      try {
        request = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }));
        return;
      }
      const reply = await this.dispatch(request);
      // JSON-RPC notifications (no `id`) per spec produce no response. The
      // MCP HTTP transport surfaces that as HTTP 202 Accepted with empty
      // body — *not* HTTP 200 with body "null", which trips Claude Desktop's
      // strict response-shape validator and surfaces a wall of invalid_union
      // errors to the user.
      if (reply == null) {
        res.writeHead(202);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reply));
    });
  }

  private async dispatch(req: JsonRpcRequest): Promise<unknown> {
    const id = req.id ?? null;
    try {
      switch (req.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: { name: 'hangarx-obsidian', version: '0.1.0' },
              capabilities: { tools: {} },
            },
          };
        case 'notifications/initialized':
          // No reply for notifications (no id).
          return null;
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: this.tools.map(t => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
              })),
            },
          };
        case 'tools/call': {
          const { name, arguments: args } = req.params ?? {};
          const tool = this.tools.find(t => t.name === name);
          if (!tool) {
            return { jsonrpc: '2.0', id, error: { code: -32601, message: `unknown tool: ${name}` } };
          }
          // Sanity-check settings up-front so the user sees a clear error
          // instead of a downstream "no org resolved" 500. workspaceId is the
          // only universally-required field; apiKey is empty in local mode
          // (the API allows unauthenticated requests when NODE_ENV=development).
          if (!this.settings.workspaceId) {
            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32000,
                message: 'HangarX plugin is missing workspaceId in settings. Open Obsidian Settings → HangarX and fill in Connection.',
              },
            };
          }
          console.log('[Cortex MCP] tools/call', name, 'workspaceId=', this.settings.workspaceId.slice(0, 8) + '…', 'apiKey=', this.settings.apiKey ? 'present' : 'none');
          const result = await tool.handler(args ?? {});
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
            },
          };
        }
        default:
          return { jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${req.method}` } };
      }
    } catch (e) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: (e as Error).message },
      };
    }
  }

  private buildTools(): ToolDef[] {
    const c = this.client;
    return [
      // ── Memory primitives (the headline tools agents reach for first) ──
      {
        name: 'cortex_recall',
        description:
          'Search the user\'s personal knowledge base (Obsidian vault) for facts, decisions, ' +
          'or context relevant to a query. Use this BEFORE answering questions about the user\'s ' +
          'projects, preferences, prior decisions, or domain knowledge — the user has stored notes ' +
          'and your training data alone is not enough. Returns ranked memory items with source provenance.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'What to search for, in natural language.' },
            limit: { type: 'number', description: 'Max items to return (default 5).' },
          },
          required: ['query'],
        },
        handler: ({ query, limit }) => c.recall(query, limit ?? 5),
      },
      {
        name: 'cortex_remember',
        description:
          'Persist a fact, decision, preference, or insight into the user\'s knowledge base for ' +
          'future sessions to recall. Use this when the user explicitly asks you to remember ' +
          'something OR when you derive an important conclusion the user will want preserved across ' +
          'sessions (e.g. architectural decisions, user preferences, project commitments). ' +
          'Stored both as a queryable memory and (optionally) as a markdown note in the vault.',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The fact or insight to persist. Self-contained sentence; do not rely on conversational context.' },
            title: { type: 'string', description: 'Optional short title for the memory note.' },
            category: { type: 'string', description: 'One of: agent_memory (default), user_fact, decision, insight.' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags for filtering later.' },
          },
          required: ['content'],
        },
        handler: async ({ content, title, category, tags }) => {
          // Store in Cortex API memory
          await c.remember(content);
          // Write to vault as a note if enabled
          let notePath: string | undefined;
          if (this.settings.writeMemoriesToVault) {
            try {
              notePath = await writeMemoryNote(this.plugin.app, this.settings.memoryFolder, {
                content,
                title,
                category: category || 'agent_memory',
                tags,
                source: 'mcp',
              });
            } catch (e) {
              console.warn('[Cortex MCP] Failed to write memory note:', e);
            }
          }
          return { ok: true, notePath };
        },
      },
      // ── Graph navigation (multi-hop reasoning over the user's notes) ──
      {
        name: 'cortex_related',
        description:
          'Find notes related to a specific note in the user\'s vault. Use this when you have a ' +
          'concrete note title and want to discover what else the user has linked to or near it. ' +
          'Returns ranked notes with their relationship type (wikilink, embedding similarity, extracted entity).',
        inputSchema: {
          type: 'object',
          properties: {
            noteName: { type: 'string', description: 'Exact note title to find related notes for.' },
            limit: { type: 'number', description: 'Max results (default 10).' },
          },
          required: ['noteName'],
        },
        handler: ({ noteName, limit }) => c.related(noteName, limit ?? 10),
      },
      {
        name: 'cortex_paths',
        description:
          'Trace the shortest paths through the knowledge graph between two notes or entities. ' +
          'Use this to answer "how is A related to B?" — returns the chain of intermediate ' +
          'concepts/people/projects that connect them. Multi-hop reasoning over the user\'s graph.',
        inputSchema: {
          type: 'object',
          properties: {
            fromNote: { type: 'string', description: 'Starting note/entity name.' },
            toNote: { type: 'string', description: 'Destination note/entity name.' },
            maxHops: { type: 'number', description: 'Max graph distance to consider (default 3).' },
          },
          required: ['fromNote', 'toNote'],
        },
        handler: async ({ fromNote, toNote, maxHops }) => {
          const [from, to] = await Promise.all([
            c.searchEntitiesByName(fromNote, 5),
            c.searchEntitiesByName(toNote, 5),
          ]);
          const a = from.find(h => h.name === fromNote) ?? from[0];
          const b = to.find(h => h.name === toNote) ?? to[0];
          if (!a || !b) return { paths: [], note: 'no matching entities found' };
          return c.findPaths(a.id, b.id, maxHops ?? 3);
        },
      },
      {
        name: 'cortex_search_entities',
        description:
          'Search the knowledge graph for entities (people, concepts, projects, organizations, etc.) ' +
          'by name fragment. Use when the user mentions something by partial name and you need to ' +
          'disambiguate or find the canonical entity ID before further queries.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Partial or full name to search for.' },
            limit: { type: 'number' },
          },
          required: ['name'],
        },
        handler: ({ name, limit }) => c.searchEntitiesByName(name, limit ?? 10),
      },
      {
        name: 'cortex_contradictions',
        description:
          'List inconsistencies the system has detected across the user\'s notes — claims that ' +
          'directly conflict, temporal contradictions, or value mismatches. Use when reviewing ' +
          'a topic to surface what the user may have changed their mind about.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max contradictions to return (default 25).' },
          },
        },
        handler: ({ limit }) => c.findContradictions(limit ?? 25),
      },
      {
        name: 'cortex_suggest_links',
        description:
          'For a specific note, suggest other notes/entities the user should consider linking ' +
          'to. Useful when helping the user develop a note further or build out their knowledge ' +
          'graph. Driven by entity-extraction across the vault.',
        inputSchema: {
          type: 'object',
          properties: { noteName: { type: 'string', description: 'Note to suggest links for.' } },
          required: ['noteName'],
        },
        handler: ({ noteName }) => c.suggestLinks(noteName),
      },
      {
        name: 'cortex_ask',
        description:
          'Ask a synthesized natural-language question against the user\'s knowledge base. ' +
          'Returns a generated answer with citations. Prefer cortex_recall for raw retrieval — ' +
          'use cortex_ask when the user wants a one-shot summarized answer rather than ' +
          'individual sources.',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Question in natural language.' } },
          required: ['query'],
        },
        handler: async ({ query }) => {
          const r = await c.ask(query);
          return {
            answer: r.answer,
            confidence: r.confidence,
            citations: r.citations.map(x => ({ source: x.source, url: x.url })),
            entities: r.entities.map(x => ({ name: x.name, type: x.type })),
          };
        },
      },
      // ── Ingest (write external sources into the graph) ──
      {
        name: 'cortex_ingest_url',
        description:
          'Scrape a web page and add it to the user\'s knowledge graph as a new document, ' +
          'with extracted entities and relationships. Use when the user shares a link they ' +
          'want preserved in their notes.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to scrape and ingest.' },
            title: { type: 'string', description: 'Optional title override for the document.' },
          },
          required: ['url'],
        },
        handler: async ({ url, title }) => {
          return c.ingestUrl(url, title);
        },
      },
    ];
  }
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export { generateToken };

/**
 * Self-contained stdio↔HTTP MCP bridge. Written to the plugin directory and
 * spawned by Claude Desktop. Pure Node built-ins (http + readline) — no fetch,
 * no undici, no external deps. Works on Node 16+.
 *
 * Reads newline-delimited JSON-RPC messages from stdin, forwards each to
 * `CORTEX_MCP_URL` with `Authorization: Bearer ${CORTEX_MCP_TOKEN}`, and
 * writes the response back to stdout.
 */
const BRIDGE_SCRIPT = `#!/usr/bin/env node
// Cortex MCP stdio↔HTTP bridge — auto-generated by the hangarx-obsidian plugin.
// Do not edit; this file is rewritten on every MCP enable.
'use strict';

const http = require('http');
const url = require('url');
const readline = require('readline');

const targetUrl = process.env.CORTEX_MCP_URL;
const token = process.env.CORTEX_MCP_TOKEN;

if (!targetUrl || !token) {
  process.stderr.write('cortex-mcp-bridge: CORTEX_MCP_URL and CORTEX_MCP_TOKEN env vars are required\\n');
  process.exit(1);
}

const parsed = url.parse(targetUrl);

function forward(line) {
  let request;
  try { request = JSON.parse(line); } catch (e) { return; }
  const isNotification = request.id === undefined || request.id === null;
  const data = Buffer.from(line, 'utf8');
  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.path || '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Bearer ' + token,
    },
  };
  const req = http.request(opts, function (res) {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function () {
      if (isNotification) return;
      const trimmed = body.trim();
      if (trimmed) process.stdout.write(trimmed + '\\n');
    });
  });
  req.on('error', function (err) {
    if (isNotification) return;
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32000, message: 'bridge: ' + err.message },
    }) + '\\n');
  });
  req.write(data);
  req.end();
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', forward);
rl.on('close', function () { process.exit(0); });
`;
