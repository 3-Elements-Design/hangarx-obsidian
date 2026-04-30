"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/vault-writer.ts
function dateStamp(ts) {
  const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  return d.toISOString().slice(0, 10);
}
function timeStamp(ts) {
  const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  return d.toISOString().slice(0, 19).replace("T", " ");
}
function sanitize(name) {
  return name.replace(/[/\\:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}
async function ensureFolder(app, folderPath) {
  const normalized = (0, import_obsidian4.normalizePath)(folderPath);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof import_obsidian4.TFolder) return;
  if (existing) return;
  await app.vault.createFolder(normalized);
}
async function uniquePath(app, folder, basename) {
  const base = (0, import_obsidian4.normalizePath)(`${folder}/${basename}`);
  let path = `${base}.md`;
  let i = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = `${base} (${i}).md`;
    i++;
  }
  return path;
}
async function writeSingleAnswerNote(app, folder, question, answer, entities, citations) {
  await ensureFolder(app, folder);
  const title = sanitize(question.slice(0, 60));
  const path = await uniquePath(app, folder, `${dateStamp()} - ${title}`);
  const frontmatter = [
    "---",
    `type: cortex-chat`,
    `question: "${question.replace(/"/g, '\\"')}"`,
    `date: ${timeStamp()}`
  ];
  if (entities?.length) frontmatter.push(`entities: [${entities.map((e) => `"${e}"`).join(", ")}]`);
  frontmatter.push("---", "");
  const body = [
    `> **Q:** ${question}`,
    "",
    answer
  ];
  if (citations?.length) {
    body.push("", "---", "", "## Sources");
    for (const c of citations) {
      if (c.url) body.push(`- [${c.source}](${c.url})`);
      else body.push(`- [[${c.source}]]`);
    }
  }
  await app.vault.create(path, frontmatter.join("\n") + "\n" + body.join("\n") + "\n");
  return path;
}
async function writeConversationNote(app, folder, data) {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || "Untitled Chat");
  const path = await uniquePath(app, folder, `${dateStamp(data.createdAt)} - ${title}`);
  const frontmatter = [
    "---",
    `type: cortex-conversation`,
    `title: "${data.title?.replace(/"/g, '\\"') || "Untitled"}"`,
    `date: ${timeStamp(data.createdAt)}`,
    `turns: ${data.turns.length}`
  ];
  if (data.entities?.length) frontmatter.push(`entities: [${data.entities.map((e) => `"${e}"`).join(", ")}]`);
  frontmatter.push("---", "");
  const body = [];
  for (const t of data.turns) {
    if (t.role === "user") {
      body.push(`## Q: ${t.content}`, "");
    } else {
      body.push(t.content, "");
    }
  }
  if (data.citations?.length) {
    body.push("---", "", "## Sources");
    for (const c of data.citations) {
      if (c.url) body.push(`- [${c.source}](${c.url})`);
      else body.push(`- [[${c.source}]]`);
    }
  }
  await app.vault.create(path, frontmatter.join("\n") + "\n" + body.join("\n") + "\n");
  return path;
}
async function writeMemoryNote(app, folder, data) {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || data.content.slice(0, 50));
  const path = await uniquePath(app, folder, `${dateStamp()} - ${title}`);
  const frontmatter = [
    "---",
    `type: cortex-memory`,
    `date: ${timeStamp()}`,
    `category: ${data.category || "agent_memory"}`,
    `source: ${data.source || "mcp"}`
  ];
  if (data.tags?.length) frontmatter.push(`tags: [${data.tags.join(", ")}]`);
  frontmatter.push("---", "");
  const body = data.content;
  await app.vault.create(path, frontmatter.join("\n") + "\n" + body + "\n");
  return path;
}
var import_obsidian4;
var init_vault_writer = __esm({
  "src/services/vault-writer.ts"() {
    "use strict";
    import_obsidian4 = require("obsidian");
  }
});

// src/services/mcp-server.ts
var mcp_server_exports = {};
__export(mcp_server_exports, {
  McpServer: () => McpServer,
  generateToken: () => generateToken
});
function getHttp() {
  try {
    return typeof require !== "undefined" ? require("http") : null;
  } catch {
    return null;
  }
}
function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var import_obsidian5, McpServer, BRIDGE_SCRIPT;
var init_mcp_server = __esm({
  "src/services/mcp-server.ts"() {
    "use strict";
    import_obsidian5 = require("obsidian");
    init_vault_writer();
    McpServer = class {
      constructor(plugin, client, settings) {
        this.plugin = plugin;
        this.client = client;
        this.settings = settings;
        this.server = null;
        this.port = 7474;
        this.token = "";
        this.tools = [];
        this._bridgePath = "";
      }
      /** Absolute filesystem path to the stdio bridge script — set after start(). */
      get bridgePath() {
        return this._bridgePath;
      }
      /** Start the server. Returns the resolved port + token (token is regenerated if missing). */
      async start() {
        const http = getHttp();
        if (!http) throw new Error("HTTP module not available \u2014 MCP server requires desktop Obsidian.");
        if (this.server) await this.stop();
        this.port = this.settings.mcpPort || 7474;
        this.token = this.settings.mcpToken || generateToken();
        this.tools = this.buildTools();
        this._bridgePath = await this.writeBridgeScript();
        return new Promise((resolve, reject) => {
          const srv = http.createServer((req, res) => this.handleRequest(req, res));
          srv.on("error", (err) => reject(err));
          srv.listen(this.port, "127.0.0.1", () => {
            this.server = srv;
            new import_obsidian5.Notice(`Cortex MCP server listening on 127.0.0.1:${this.port}`);
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
      async writeBridgeScript() {
        const adapter = this.plugin.app.vault.adapter;
        const dir = this.plugin.manifest.dir ?? `.obsidian/plugins/${this.plugin.manifest.id}`;
        const relPath = `${dir}/mcp-bridge.cjs`;
        const script = BRIDGE_SCRIPT;
        await adapter.write(relPath, script);
        if (adapter instanceof import_obsidian5.FileSystemAdapter) {
          return adapter.getFullPath(relPath);
        }
        return relPath;
      }
      async stop() {
        if (!this.server) return;
        await new Promise((resolve) => {
          this.server.close(() => resolve());
        });
        this.server = null;
      }
      isRunning() {
        return this.server !== null;
      }
      async handleRequest(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }
        const authHeader = req.headers["authorization"] ?? "";
        const expected = `Bearer ${this.token}`;
        if (authHeader !== expected) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "unauthorized" }));
          return;
        }
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end();
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          let request;
          try {
            request = JSON.parse(body);
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }));
            return;
          }
          const reply = await this.dispatch(request);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(reply));
        });
      }
      async dispatch(req) {
        const id = req.id ?? null;
        try {
          switch (req.method) {
            case "initialize":
              return {
                jsonrpc: "2.0",
                id,
                result: {
                  protocolVersion: "2024-11-05",
                  serverInfo: { name: "hangarx-obsidian", version: "0.1.0" },
                  capabilities: { tools: {} }
                }
              };
            case "notifications/initialized":
              return null;
            case "tools/list":
              return {
                jsonrpc: "2.0",
                id,
                result: {
                  tools: this.tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    inputSchema: t.inputSchema
                  }))
                }
              };
            case "tools/call": {
              const { name, arguments: args } = req.params ?? {};
              const tool = this.tools.find((t) => t.name === name);
              if (!tool) {
                return { jsonrpc: "2.0", id, error: { code: -32601, message: `unknown tool: ${name}` } };
              }
              if (!this.settings.workspaceId) {
                return {
                  jsonrpc: "2.0",
                  id,
                  error: {
                    code: -32e3,
                    message: "HangarX plugin is missing workspaceId in settings. Open Obsidian Settings \u2192 HangarX and fill in Connection."
                  }
                };
              }
              console.log("[Cortex MCP] tools/call", name, "workspaceId=", this.settings.workspaceId.slice(0, 8) + "\u2026", "apiKey=", this.settings.apiKey ? "present" : "none");
              const result = await tool.handler(args ?? {});
              return {
                jsonrpc: "2.0",
                id,
                result: {
                  content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }]
                }
              };
            }
            default:
              return { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${req.method}` } };
          }
        } catch (e) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32e3, message: e.message }
          };
        }
      }
      buildTools() {
        const c = this.client;
        return [
          // ── Memory primitives (the headline tools agents reach for first) ──
          {
            name: "cortex_recall",
            description: "Search the user's personal knowledge base (Obsidian vault) for facts, decisions, or context relevant to a query. Use this BEFORE answering questions about the user's projects, preferences, prior decisions, or domain knowledge \u2014 the user has stored notes and your training data alone is not enough. Returns ranked memory items with source provenance.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "What to search for, in natural language." },
                limit: { type: "number", description: "Max items to return (default 5)." }
              },
              required: ["query"]
            },
            handler: ({ query, limit }) => c.recall(query, limit ?? 5)
          },
          {
            name: "cortex_remember",
            description: "Persist a fact, decision, preference, or insight into the user's knowledge base for future sessions to recall. Use this when the user explicitly asks you to remember something OR when you derive an important conclusion the user will want preserved across sessions (e.g. architectural decisions, user preferences, project commitments). Stored both as a queryable memory and (optionally) as a markdown note in the vault.",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string", description: "The fact or insight to persist. Self-contained sentence; do not rely on conversational context." },
                title: { type: "string", description: "Optional short title for the memory note." },
                category: { type: "string", description: "One of: agent_memory (default), user_fact, decision, insight." },
                tags: { type: "array", items: { type: "string" }, description: "Optional tags for filtering later." }
              },
              required: ["content"]
            },
            handler: async ({ content, title, category, tags }) => {
              await c.remember(content);
              let notePath;
              if (this.settings.writeMemoriesToVault) {
                try {
                  notePath = await writeMemoryNote(this.plugin.app, this.settings.memoryFolder, {
                    content,
                    title,
                    category: category || "agent_memory",
                    tags,
                    source: "mcp"
                  });
                } catch (e) {
                  console.warn("[Cortex MCP] Failed to write memory note:", e);
                }
              }
              return { ok: true, notePath };
            }
          },
          // ── Graph navigation (multi-hop reasoning over the user's notes) ──
          {
            name: "cortex_related",
            description: "Find notes related to a specific note in the user's vault. Use this when you have a concrete note title and want to discover what else the user has linked to or near it. Returns ranked notes with their relationship type (wikilink, embedding similarity, extracted entity).",
            inputSchema: {
              type: "object",
              properties: {
                noteName: { type: "string", description: "Exact note title to find related notes for." },
                limit: { type: "number", description: "Max results (default 10)." }
              },
              required: ["noteName"]
            },
            handler: ({ noteName, limit }) => c.related(noteName, limit ?? 10)
          },
          {
            name: "cortex_paths",
            description: `Trace the shortest paths through the knowledge graph between two notes or entities. Use this to answer "how is A related to B?" \u2014 returns the chain of intermediate concepts/people/projects that connect them. Multi-hop reasoning over the user's graph.`,
            inputSchema: {
              type: "object",
              properties: {
                fromNote: { type: "string", description: "Starting note/entity name." },
                toNote: { type: "string", description: "Destination note/entity name." },
                maxHops: { type: "number", description: "Max graph distance to consider (default 3)." }
              },
              required: ["fromNote", "toNote"]
            },
            handler: async ({ fromNote, toNote, maxHops }) => {
              const [from, to] = await Promise.all([
                c.searchEntitiesByName(fromNote, 5),
                c.searchEntitiesByName(toNote, 5)
              ]);
              const a = from.find((h) => h.name === fromNote) ?? from[0];
              const b = to.find((h) => h.name === toNote) ?? to[0];
              if (!a || !b) return { paths: [], note: "no matching entities found" };
              return c.findPaths(a.id, b.id, maxHops ?? 3);
            }
          },
          {
            name: "cortex_search_entities",
            description: "Search the knowledge graph for entities (people, concepts, projects, organizations, etc.) by name fragment. Use when the user mentions something by partial name and you need to disambiguate or find the canonical entity ID before further queries.",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Partial or full name to search for." },
                limit: { type: "number" }
              },
              required: ["name"]
            },
            handler: ({ name, limit }) => c.searchEntitiesByName(name, limit ?? 10)
          },
          {
            name: "cortex_contradictions",
            description: "List inconsistencies the system has detected across the user's notes \u2014 claims that directly conflict, temporal contradictions, or value mismatches. Use when reviewing a topic to surface what the user may have changed their mind about.",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "number", description: "Max contradictions to return (default 25)." }
              }
            },
            handler: ({ limit }) => c.findContradictions(limit ?? 25)
          },
          {
            name: "cortex_suggest_links",
            description: "For a specific note, suggest other notes/entities the user should consider linking to. Useful when helping the user develop a note further or build out their knowledge graph. Driven by entity-extraction across the vault.",
            inputSchema: {
              type: "object",
              properties: { noteName: { type: "string", description: "Note to suggest links for." } },
              required: ["noteName"]
            },
            handler: ({ noteName }) => c.suggestLinks(noteName)
          },
          {
            name: "cortex_ask",
            description: "Ask a synthesized natural-language question against the user's knowledge base. Returns a generated answer with citations. Prefer cortex_recall for raw retrieval \u2014 use cortex_ask when the user wants a one-shot summarized answer rather than individual sources.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", description: "Question in natural language." } },
              required: ["query"]
            },
            handler: async ({ query }) => {
              const r = await c.ask(query);
              return {
                answer: r.answer,
                confidence: r.confidence,
                citations: r.citations.map((x) => ({ source: x.source, url: x.url })),
                entities: r.entities.map((x) => ({ name: x.name, type: x.type }))
              };
            }
          },
          // ── Ingest (write external sources into the graph) ──
          {
            name: "cortex_ingest_url",
            description: "Scrape a web page and add it to the user's knowledge graph as a new document, with extracted entities and relationships. Use when the user shares a link they want preserved in their notes.",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", description: "The URL to scrape and ingest." },
                title: { type: "string", description: "Optional title override for the document." }
              },
              required: ["url"]
            },
            handler: async ({ url, title }) => {
              return c.ingestUrl(url, title);
            }
          }
        ];
      }
    };
    BRIDGE_SCRIPT = `#!/usr/bin/env node
// Cortex MCP stdio\u2194HTTP bridge \u2014 auto-generated by the hangarx-obsidian plugin.
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
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CortexPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian11 = require("obsidian");

// src/cortex-client.ts
var import_obsidian = require("obsidian");
var CortexClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  async req(path, init = {}) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.settings.apiKey) headers.Authorization = `Bearer ${this.settings.apiKey}`;
    if (this.settings.workspaceId) headers["x-workspace-id"] = this.settings.workspaceId;
    Object.assign(headers, init.headers ?? {});
    const res = await (0, import_obsidian.requestUrl)({
      url: `${this.settings.apiUrl}${path}`,
      method: init.method ?? "GET",
      headers,
      body: init.body,
      throw: false
    });
    if (res.status >= 400) {
      let host = "";
      try {
        host = new URL(this.settings.apiUrl).host;
      } catch {
      }
      throw new Error(`Cortex [${host}] ${path} \u2192 ${res.status}: ${res.text}`);
    }
    return res.json;
  }
  /**
   * Upload a single markdown note via the JSON-body upload endpoint.
   */
  async ingestNote(filePath, content) {
    const res = await this.req("/v1/ingest/files/upload-json", {
      method: "POST",
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype: "text/markdown",
          contentText: content
        },
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
        sourceType: "md",
        fastMode: false
      })
    });
    return res.data;
  }
  /**
   * Upload a binary attachment (image, PDF, audio, video). The backend
   * decodes contentBase64; mimetype drives the right extraction pipeline.
   */
  async ingestBinary(filePath, mimetype, base64) {
    const res = await this.req("/v1/ingest/files/upload-json", {
      method: "POST",
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype,
          contentBase64: base64
        },
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
        sourceType: mimetype.split("/")[0] || "file",
        fastMode: false
      })
    });
    return res.data;
  }
  async deleteNote(filePath) {
    await this.req("/v1/ingest/documents/by-path/delete", {
      method: "POST",
      body: JSON.stringify({
        filePath,
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId
      })
    });
  }
  /**
   * Ingest a URL — scrapes the page and extracts entities into the graph.
   */
  async ingestUrl(url, title) {
    const res = await this.req("/v1/ingest", {
      method: "POST",
      body: JSON.stringify({
        url,
        title,
        workspaceId: this.settings.workspaceId,
        extractEntities: true
      })
    });
    return {
      documentId: res.data?.documentId,
      entityCount: res.data?.entitiesCreated ?? res.data?.entityCount ?? 0
    };
  }
  /**
   * Get a diff of graph changes since a given timestamp.
   */
  async graphDiff(since) {
    const params = new URLSearchParams({
      sinceTimestamp: since,
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(`/v1/graph/diff?${params.toString()}`);
    return {
      added: res.data?.addedEntities ?? [],
      modified: res.data?.modifiedEntities ?? [],
      removed: res.data?.removedEntities ?? []
    };
  }
  /**
   * Search the graph for entities by name fragment. Returns raw entity records
   * (with IDs) — used by the Related view to find the entity ID of the
   * currently-open note (which `related()` filters out).
   */
  async searchEntitiesByName(name, limit = 5) {
    const params = new URLSearchParams({
      q: name,
      type: "Note",
      limit: String(limit),
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    return (res.data?.entities ?? []).map((e) => ({ id: e.id, name: e.name, type: e.type }));
  }
  async related(noteName, limit = 10) {
    const params = new URLSearchParams({
      q: noteName,
      type: "Note",
      limit: String(limit),
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    return (res.data?.entities ?? []).filter((e) => e?.name && e.name !== noteName).map((e) => ({
      noteName: e.name,
      entityId: e.id,
      filePath: e.properties?.filePath,
      score: typeof e.score === "number" ? e.score : typeof e.relevance === "number" ? e.relevance : 0,
      snippet: e.properties?.description,
      source: e.properties?.source === "user" ? "wikilink" : "embedding"
    }));
  }
  /**
   * Find the shortest paths through the graph between two entities — used to
   * explain *why* two notes are related (e.g. "Note A → MENTIONS → X → CITED_IN → Note B").
   */
  async findPaths(fromEntityId, toEntityId, maxHops = 3) {
    const params = new URLSearchParams({
      from: fromEntityId,
      to: toEntityId,
      maxHops: String(maxHops),
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/explore/paths?${params.toString()}`
    );
    return (res.data?.paths ?? []).map((p) => {
      const nodes = p.nodes ?? [];
      const edges = p.edges ?? [];
      const steps = edges.map((edge, i) => ({
        fromName: nodes[i]?.label ?? edge.source,
        fromType: nodes[i]?.type ?? "",
        toName: nodes[i + 1]?.label ?? edge.target,
        toType: nodes[i + 1]?.type ?? "",
        relType: edge.type
      }));
      return { steps, length: typeof p.length === "number" ? p.length : steps.length };
    });
  }
  /** Find contradicting claims across the workspace. */
  async findContradictions(limit = 25) {
    const params = new URLSearchParams({
      workspaceId: this.settings.workspaceId,
      limit: String(limit)
    });
    const res = await this.req(
      `/v1/graph/claims/contradictions?${params.toString()}`
    );
    return (res.data?.contradictions ?? []).map((c) => ({
      conflictType: c.conflictType,
      conflictDescription: c.conflictDescription,
      confidence: c.confidence ?? 0,
      claim1: {
        id: c.claim1?.id,
        text: c.claim1?.text,
        subject: c.claim1?.subject,
        sourceName: c.claim1?.source?.sourceName
      },
      claim2: {
        id: c.claim2?.id,
        text: c.claim2?.text,
        subject: c.claim2?.subject,
        sourceName: c.claim2?.source?.sourceName
      }
    }));
  }
  /** Persist a memory item (e.g. user preference) for future chat sessions. */
  async remember(content, source = "conversation") {
    await this.req("/v1/memory/remember", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: this.settings.workspaceId,
        agentId: "hangarx-obsidian",
        content,
        source,
        priority: "normal"
      })
    });
  }
  /** Retrieve memories relevant to a query — injected into the chat prompt. */
  async recall(query, limit = 5) {
    const res = await this.req("/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: this.settings.workspaceId,
        agentId: "hangarx-obsidian",
        query,
        method: "hybrid",
        limit
      })
    });
    return (res.data?.items ?? []).map((m) => ({
      id: m.id,
      content: m.content,
      source: m.source,
      priority: m.priority,
      createdAt: m.createdAt
    }));
  }
  async ask(query, _sessionId) {
    const res = await this.req("/v1/ask/chat/answer", {
      method: "POST",
      body: JSON.stringify({
        message: query,
        workspaceId: this.settings.workspaceId,
        expanded: true
      })
    });
    const d = res.data;
    return {
      answer: d.answer,
      citations: extractCitations(d.raw),
      entities: extractEntities(d.raw),
      documents: extractDocuments(d.raw),
      confidence: typeof res.meta?.confidence === "number" ? res.meta.confidence : 0,
      followUps: d.suggestedFollowUps ?? [],
      metadata: { ...res.meta ?? {} }
    };
  }
  async suggestLinks(noteName) {
    const res = await this.req("/v1/graph/predict-links", {
      method: "POST",
      body: JSON.stringify({
        entityName: noteName,
        entityType: "Note",
        workspaceId: this.settings.workspaceId
      })
    });
    return res.data?.suggestions ?? [];
  }
  async exportSubgraph(seedNoteName, hops = 1) {
    const res = await this.req("/v1/graph/export", {
      method: "POST",
      body: JSON.stringify({
        seedEntity: seedNoteName,
        seedType: "Note",
        hops,
        workspaceId: this.settings.workspaceId
      })
    });
    return res.data;
  }
  /**
   * Export a subgraph anchored at a known entity ID. More robust than the
   * by-name overload because it skips the server-side name+type lookup that
   * fails when the note was indexed under a non-`Note` type or with a slightly
   * different name (e.g. extracted entity normalisation).
   */
  async exportSubgraphById(seedEntityId, hops = 1) {
    const res = await this.req("/v1/graph/export", {
      method: "POST",
      body: JSON.stringify({
        seedEntityId,
        hops,
        workspaceId: this.settings.workspaceId
      })
    });
    return res.data;
  }
  /**
   * Resolve an Obsidian note to its graph entity ID. Tries strategies in order
   * of specificity so the most reliable signal wins:
   *   1. Exact filePath property match (Note entity created during ingest stores it)
   *   2. Same, but for type=Document (some flows create Document instead of Note)
   *   3. Substring search by basename (for legacy/edge cases)
   * Returns null if the note isn't in the graph yet.
   */
  async resolveEntityId(noteName, filePath) {
    if (filePath) {
      for (const type of ["Note", "Document"]) {
        try {
          const res2 = await this.req(
            "/v1/graph/entities/find",
            {
              method: "POST",
              body: JSON.stringify({
                type,
                properties: { filePath },
                limit: 1
              })
            }
          );
          const hit = res2.data?.entities?.[0];
          if (hit?.id) return hit.id;
        } catch {
        }
      }
    }
    const params = new URLSearchParams({
      q: noteName,
      limit: "5",
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    const list = res.data?.entities ?? [];
    if (list.length === 0) return null;
    const exact = list.find((e) => e.name === noteName);
    return (exact ?? list[0])?.id ?? null;
  }
  /**
   * Paginated workspace-wide entity listing for the pull-sync feature.
   * Uses GET /v1/graph/entities which supports type, limit, offset filtering.
   */
  async exportGraphPage(opts = {}) {
    const limit = opts.limit ?? 500;
    const offset = opts.offset ?? 0;
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    if (opts.entityTypes && opts.entityTypes.length === 1) {
      params.set("type", opts.entityTypes[0]);
    }
    const res = await this.req(`/v1/graph/entities?${params.toString()}`, {
      method: "GET"
    });
    const entities = (res.data?.entities ?? []).map((e) => ({
      id: e.id,
      name: e.name ?? e.properties?.name ?? "Unknown",
      type: e.type ?? e.properties?.type ?? "Entity",
      properties: e.properties ?? {}
    }));
    let relationships = [];
    if (opts.includeRelationships !== false && entities.length > 0) {
      try {
        const graphParams = new URLSearchParams();
        graphParams.set("limit", String(Math.min(limit, 500)));
        if (this.settings.workspaceId) graphParams.set("workspaceId", this.settings.workspaceId);
        if (opts.entityTypes && opts.entityTypes.length === 1) {
          graphParams.set("type", opts.entityTypes[0]);
        }
        const graphRes = await this.req(`/v1/graph?${graphParams.toString()}`, { method: "GET" });
        relationships = (graphRes.links ?? []).map((l) => ({
          from: l.source,
          to: l.target,
          type: l.type,
          properties: l.properties
        }));
      } catch {
      }
    }
    return {
      entities,
      relationships,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Validate the configured API key and return its metadata. The settings
   * panel uses this to show "✓ logged in as <email>" instead of guessing.
   *
   * Throws structured errors the caller can react to:
   *   - status 404  → endpoint missing on this server build (cloud may not
   *                   have shipped /v1/api-keys/whoami yet). Caller should
   *                   fall back to a lighter probe.
   *   - status 401  → key is invalid or expired.
   *   - other       → network / server issue; surface verbatim.
   */
  async getWhoami() {
    const res = await this.req("/v1/api-keys/whoami");
    if (!res.data) {
      throw new Error("whoami returned no data");
    }
    return res.data;
  }
  /**
   * Lightweight auth probe used as a fallback when whoami isn't available.
   * Calls a known authenticated endpoint (graph stats) and reports whether
   * the response indicated success. Doesn't reveal user identity, just
   * "the key works against this server."
   */
  async probeAuth() {
    try {
      await this.getGraphStats();
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Fetch entity types with counts.
   * Uses GET /v1/graph/entity-types endpoint.
   */
  async getEntityTypeCounts() {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    const res = await this.req(`/v1/graph/entity-types?${params.toString()}`, {
      method: "GET"
    });
    return (res.data?.entityTypes ?? []).sort((a, b) => b.count - a.count);
  }
  /**
   * Comprehensive workspace graph stats — totals + per-type breakdown.
   * Backed by GET /v1/graph/stats which reuses the introspection pipeline.
   */
  async getGraphStats() {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    const res = await this.req(`/v1/graph/stats?${params.toString()}`);
    return {
      totalEntities: res.data?.totalEntities ?? 0,
      totalRelationships: res.data?.totalRelationships ?? 0,
      entityTypes: (res.data?.entityTypes ?? []).slice().sort((a, b) => b.count - a.count),
      relationshipTypes: (res.data?.relationshipTypes ?? []).slice().sort((a, b) => b.count - a.count)
    };
  }
  /**
   * GraphRAG orchestrator stats — cache hit rate, query throughput, etc.
   * Optional companion to getGraphStats(); shape varies by orchestrator config.
   * Returns null on 404 (older container builds without the endpoint).
   */
  async getGraphRAGStats() {
    try {
      const res = await this.req("/v1/graph/graphrag/stats");
      return res.data ?? null;
    } catch (e) {
      if (/→ 404/.test(e.message)) return null;
      throw e;
    }
  }
  /**
   * List Cortex-originated documents that should be projected into this vault.
   * Returns items the server believes have not yet been delivered (the server
   * tracks acks, so this is idempotent across devices).
   */
  async inboxList() {
    const qs = new URLSearchParams({
      workspaceId: this.settings.workspaceId,
      vaultId: this.settings.vaultId
    }).toString();
    const res = await this.req(`/v1/inbox/list?${qs}`);
    return res.data?.items ?? [];
  }
  async inboxAck(itemId, vaultPath) {
    await this.req("/v1/inbox/ack", {
      method: "POST",
      body: JSON.stringify({
        itemId,
        vaultPath,
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId
      })
    });
  }
};
function extractCitations(raw) {
  if (!raw || typeof raw !== "object") return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (source, text, filePath, url) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    out.push({ source, text: text ?? "", filePath, url });
  };
  for (const doc of raw.documents?.recentDocuments ?? []) {
    push(
      doc?.name ?? doc?.filename ?? doc?.title,
      doc?.snippet ?? doc?.summary ?? doc?.description,
      doc?.filePath ?? doc?.path,
      doc?.url ?? doc?.youtubeurl
    );
  }
  for (const ent of raw.knowledgeGraph?.entities ?? raw.entities ?? []) {
    if (ent?.type === "Note" || ent?.type === "Document") {
      push(ent?.name, ent?.properties?.description, ent?.properties?.filePath);
    }
  }
  return out.slice(0, 10);
}
function extractEntities(raw) {
  if (!raw || typeof raw !== "object") return [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  const list = raw.knowledgeGraph?.entities ?? raw.entities ?? [];
  for (const e of list) {
    const name = e?.name;
    if (!name) continue;
    const key = `${name}::${e?.type ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      type: e?.type ?? "Entity",
      description: e?.properties?.description ?? e?.description,
      score: typeof e?.score === "number" ? e.score : typeof e?.relevance === "number" ? e.relevance : void 0
    });
  }
  return out.slice(0, 25);
}
function extractDocuments(raw) {
  if (!raw || typeof raw !== "object") return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const recentList = raw.documents?.recentDocuments ?? raw.documents ?? [];
  for (const d of Array.isArray(recentList) ? recentList : []) {
    const title = d?.title ?? d?.name ?? d?.filename;
    if (!title || seen.has(title)) continue;
    seen.add(title);
    const matchRaw = d?.score ?? d?.match ?? d?.relevance;
    out.push({
      title,
      snippet: d?.snippet ?? d?.summary ?? d?.description,
      filePath: d?.filePath ?? d?.path,
      url: d?.url ?? d?.youtubeurl,
      matchPercent: typeof matchRaw === "number" ? Math.round(matchRaw * 100) : void 0,
      publishDate: d?.publishdate ?? d?.publishDate ?? d?.publish_date,
      source: d?.guest ?? d?.author ?? d?.source
    });
  }
  const chunks = raw.vectorMemory?.relevantChunks ?? raw.relevantChunks ?? [];
  for (const c of Array.isArray(chunks) ? chunks : []) {
    const rawTitle = c?.meta_fileName ?? c?.metadata?.documentName ?? c?.metadata?.source ?? c?.metadata?.fileName ?? c?.documentName ?? c?.source ?? c?.title ?? "Vault chunk";
    const title = typeof rawTitle === "string" ? rawTitle.replace(/\.(md|markdown|txt)$/i, "") : rawTitle;
    if (seen.has(title)) continue;
    seen.add(title);
    out.push({
      title,
      snippet: c?.text ?? c?.content ?? c?.snippet,
      filePath: c?.metadata?.filePath ?? c?.filePath,
      matchPercent: typeof c?.score === "number" ? Math.round(c.score * 100) : void 0,
      source: c?.metadata?.source
    });
  }
  return out.slice(0, 10);
}

// src/settings.ts
var import_obsidian6 = require("obsidian");

// src/services/agent-connect.ts
var dynRequire = (() => {
  try {
    return new Function("m", "return require(m)");
  } catch {
    return null;
  }
})();
function nodeFs() {
  return dynRequire("fs").promises;
}
function nodePath() {
  return dynRequire("path");
}
function nodeOs() {
  return dynRequire("os");
}
function isDesktop() {
  try {
    return !!dynRequire && !!nodeOs().homedir;
  } catch {
    return false;
  }
}
function claudeDesktopConfigPath() {
  if (!isDesktop()) return null;
  const path = nodePath();
  const os = nodeOs();
  const home = os.homedir();
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Claude", "claude_desktop_config.json");
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(xdg, "Claude", "claude_desktop_config.json");
}
function claudeCodeConfigPath() {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), ".claude.json");
}
function cursorConfigPath() {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), ".cursor", "mcp.json");
}
function clineConfigPath() {
  if (!isDesktop()) return null;
  const path = nodePath();
  const os = nodeOs();
  const home = os.homedir();
  const platform = process.platform;
  const sub = ["Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"];
  if (platform === "darwin") return path.join(home, "Library", "Application Support", ...sub);
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, ...sub);
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(xdg, ...sub);
}
function windsurfConfigPath() {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), ".codeium", "windsurf", "mcp_config.json");
}
async function upsertMcpEntry(configPath, entry) {
  const fs = nodeFs();
  const path = nodePath();
  let existing = {};
  let fileExisted = false;
  try {
    const raw = await fs.readFile(configPath, "utf8");
    fileExisted = true;
    if (raw.trim()) existing = JSON.parse(raw);
  } catch (e) {
    if (e?.code !== "ENOENT") {
      return {
        ok: false,
        configPath,
        message: `Couldn't read ${configPath}: ${e.message}`
      };
    }
  }
  if (!existing.mcpServers || typeof existing.mcpServers !== "object") {
    existing.mcpServers = {};
  }
  const prev = existing.mcpServers["hangarx-obsidian"];
  const updated = !!prev;
  const unchanged = prev && JSON.stringify(prev) === JSON.stringify(entry);
  existing.mcpServers["hangarx-obsidian"] = entry;
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
  } catch {
  }
  try {
    await fs.writeFile(configPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
  } catch (e) {
    return {
      ok: false,
      configPath,
      message: `Couldn't write ${configPath}: ${e.message}`
    };
  }
  let message;
  if (unchanged) {
    message = "Already connected \u2014 no changes needed.";
  } else if (updated) {
    message = "Updated existing connection in config.";
  } else if (!fileExisted) {
    message = "Created config file and connected.";
  } else {
    message = "Added HangarX to existing config.";
  }
  return { ok: true, configPath, message, updated, unchanged };
}
function bridgeEntry(b) {
  return {
    command: "node",
    args: [b.bridgePath],
    env: {
      CORTEX_MCP_URL: b.url,
      CORTEX_MCP_TOKEN: b.token
    }
  };
}
async function connectClaudeDesktop(b) {
  const p = claudeDesktopConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only \u2014 Claude Desktop config path unavailable on mobile." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectClaudeCode(b) {
  const p = claudeCodeConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectCursor(b) {
  const p = cursorConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectCline(b) {
  const p = clineConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectWindsurf(b) {
  const p = windsurfConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
function buildBridgeEntry(b) {
  return bridgeEntry(b);
}
async function disconnectMcpEntry(configPath) {
  const fs = nodeFs();
  let raw;
  try {
    raw = await fs.readFile(configPath, "utf8");
  } catch (e) {
    if (e?.code === "ENOENT") {
      return { ok: true, configPath, message: "Already disconnected \u2014 no config file.", unchanged: true };
    }
    return { ok: false, configPath, message: `Couldn't read ${configPath}: ${e.message}` };
  }
  let parsed;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) {
    return { ok: false, configPath, message: `Config file isn't valid JSON: ${e.message}` };
  }
  if (!parsed?.mcpServers || !parsed.mcpServers["hangarx-obsidian"]) {
    return { ok: true, configPath, message: "Already disconnected.", unchanged: true };
  }
  delete parsed.mcpServers["hangarx-obsidian"];
  try {
    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  } catch (e) {
    return { ok: false, configPath, message: `Couldn't write ${configPath}: ${e.message}` };
  }
  return { ok: true, configPath, message: "Removed HangarX from config." };
}
function revealInFileManager(configPath) {
  if (!isDesktop()) return false;
  try {
    const { shell } = dynRequire("electron");
    shell.showItemInFolder(configPath);
    return true;
  } catch {
    return false;
  }
}
async function checkConnection(configPath) {
  if (!configPath) return { exists: false, connected: false, reason: "desktop-only" };
  try {
    const fs = nodeFs();
    const raw = await fs.readFile(configPath, "utf8");
    if (!raw.trim()) return { exists: true, connected: false };
    const parsed = JSON.parse(raw);
    const entry = parsed?.mcpServers?.["hangarx-obsidian"];
    return { exists: true, connected: !!entry };
  } catch (e) {
    if (e?.code === "ENOENT") return { exists: false, connected: false };
    return { exists: true, connected: false, reason: e.message };
  }
}

// src/services/oauth-flow.ts
var import_obsidian2 = require("obsidian");
var pending = null;
function randomUrlSafe(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function pkceChallenge(verifier) {
  const buf = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function startSignIn(options) {
  if (pending) {
    pending.reject(new Error("A new sign-in started; previous attempt cancelled."));
    clearTimeout(pending.timer);
    pending = null;
  }
  const state = randomUrlSafe(24);
  const codeVerifier = randomUrlSafe(48);
  const codeChallenge = await pkceChallenge(codeVerifier);
  const url = new URL(`${options.dashboardUrl.replace(/\/$/, "")}/oauth/authorize`);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending && pending.state === state) {
        pending = null;
        reject(new Error("Sign-in timed out \u2014 close the browser tab and try again."));
      }
    }, options.timeoutMs ?? 5 * 60 * 1e3);
    pending = { state, codeVerifier, options, resolve, reject, timer };
    const opened = window.open(url.toString(), "_blank");
    if (!opened) {
      navigator.clipboard.writeText(url.toString()).catch(() => {
      });
      new import_obsidian2.Notice("Browser blocked the new window. URL copied to clipboard \u2014 paste it in your browser to continue sign-in.", 8e3);
    }
  });
}
async function completeSignIn(params) {
  if (!pending) {
    new import_obsidian2.Notice("Received an OAuth callback but no sign-in is in progress. Ignoring.", 5e3);
    return;
  }
  const flow = pending;
  pending = null;
  clearTimeout(flow.timer);
  const errorCode = params.error;
  if (errorCode) {
    flow.reject(new Error(params.error_description || `Sign-in failed: ${errorCode}`));
    return;
  }
  if (params.state !== flow.state) {
    flow.reject(new Error("OAuth state mismatch \u2014 sign-in aborted for security."));
    return;
  }
  const code = params.code;
  if (!code) {
    flow.reject(new Error("Server didn't return an authorization code."));
    return;
  }
  try {
    const apiBase = flow.options.apiUrl.replace(/\/$/, "");
    const res = await (0, import_obsidian2.requestUrl)({
      url: `${apiBase}/v1/oauth/plugin/token`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        code_verifier: flow.codeVerifier,
        client_id: flow.options.clientId,
        redirect_uri: flow.options.redirectUri
      }),
      throw: false
    });
    if (res.status >= 400) {
      const body2 = (() => {
        try {
          return res.json;
        } catch {
          return {};
        }
      })();
      const desc = body2?.error_description || body2?.error || `Server returned ${res.status}`;
      flow.reject(new Error(desc));
      return;
    }
    const body = res.json;
    if (!body.access_token) {
      flow.reject(new Error("Server didn't return an access token."));
      return;
    }
    flow.resolve({
      accessToken: body.access_token,
      workspaceId: body.workspaceId,
      organizationId: body.organizationId,
      userEmail: body.userEmail
    });
  } catch (e) {
    flow.reject(e instanceof Error ? e : new Error(String(e)));
  }
}
function cancelSignIn() {
  if (pending) {
    clearTimeout(pending.timer);
    pending.reject(new Error("Sign-in cancelled."));
    pending = null;
  }
}

// src/views/readme-modal.ts
var import_obsidian3 = require("obsidian");

// README.md
var README_default = "# HangarX \u2014 Agent Memory for Obsidian\n\n**Turn your vault into permanent memory for every AI agent on your machine.**\n\nClaude Desktop, Claude Code, Cursor, Cline, Windsurf \u2014 they all forget the moment a session ends. HangarX changes that. Your notes, decisions, and project history become a structured memory layer that *every* MCP-compatible agent can read and write to. One vault, every tool, no copy-pasting context between chats.\n\n> \u{1F916} Cross-tool memory \xB7 \u{1F9E0} Multi-hop reasoning \xB7 \u{1F50D} Semantic Q&A \xB7 \u{1F512} 100% local option\n\n---\n\n## Why this exists\n\nYou've already written everything. Your standups, your design docs, your half-finished thoughts. The problem isn't capturing knowledge \u2014 it's making it usable by the agents you work with every day.\n\n- **Claude Desktop forgot what you decided last week.** HangarX remembers.\n- **Cursor doesn't know your team's conventions.** HangarX answers from your notes.\n- **You repeat yourself across every new chat.** HangarX is the source of truth all of them read.\n\nIt's not another chat UI bolted onto Obsidian. It's the connective tissue that makes your existing AI tools dramatically more useful.\n\n---\n\n## Quick start \u2014 60 seconds (Cloud)\n\nCloud mode is the fastest way to try HangarX. Sign-in is OAuth \u2014 no key copy-paste.\n\n1. **Install** the plugin from Obsidian's Community Plugins \u2192 search **\"HangarX\"**.\n2. Open Settings \u2192 **HangarX \u2014 Agent Memory** \u2192 Mode: **\u2601\uFE0F Cloud (HangarX hosted)**.\n3. Click **Sign in with HangarX**. Your browser opens, you approve, and the plugin auto-fills your API key + workspace.\n4. Click **Sync vault to memory layer** in the command palette (\u2318P) \u2014 or wait for the next startup sync.\n\nThat's it. Your vault is now searchable, your agents can read it, and you can ask questions from inside Obsidian.\n\n> First sync uploads everything. Subsequent syncs only push files that changed. The `.cortex/` folder, `.obsidian/`, and your templates are excluded by default.\n\n---\n\n## Quick start \u2014 Local Docker (private)\n\n<details>\n<summary>Run everything on your machine \u2014 your notes never leave the laptop.</summary>\n\n1. Install the plugin and switch Mode to **\u{1F3E0} Local (Docker)**.\n2. Click **Save to vault** (writes `docker-compose.cortex.yml` next to your notes).\n3. Open a terminal in your vault folder and run:\n   ```bash\n   GEMINI_API_KEY=\"your-key\" docker compose -f docker-compose.cortex.yml up -d\n   ```\n4. Switch back to Obsidian \u2014 the red status pill turns green when the stack is up.\n\n**Bring your own keys.** Click the **LLM provider keys** section to add Gemini, OpenAI, Anthropic, Moonshot, HuggingFace, OpenRouter, or xAI keys. Re-save the YAML and rerun the docker command after changes.\n\n**Fully offline.** Switch the Embedding provider to **Ollama**, run `ollama pull nomic-embed-text`, and the stack uses no cloud APIs at all.\n\nRequires [Docker Desktop](https://www.docker.com/products/docker-desktop/). No source code, no Node.js, no compile step \u2014 images are pulled from Docker Hub.\n\n</details>\n\n---\n\n## Connect your AI agents\n\nThe Agents section in settings shows every supported harness as a one-click row:\n\n| Agent | Description |\n|---|---|\n| **Claude Desktop** | Anthropic's desktop chat app |\n| **Claude Code** | Anthropic's CLI coding agent |\n| **Cursor** | AI-first code editor |\n| **Cline** | VS Code autonomous coding extension |\n| **Windsurf** | Codeium's agentic IDE |\n| **Other MCP-compatible app** | Copy the JSON snippet for Zed, Goose, Codex CLI, or any custom client |\n\nClick **Connect** and HangarX merges its MCP server entry into the client's config file (non-destructively \u2014 your other MCP servers are preserved). The `\u22EF` menu lets you copy the config path, reveal it in Finder/Explorer, copy a JSON snippet for hand-merging, or **Disconnect** to cleanly remove the entry.\n\nAfter connecting: restart the agent and it'll have these tools available:\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_ask` | Ask a natural-language question against your vault |\n| `cortex_recall` / `cortex_remember` | Persistent memory the agent can store and retrieve across sessions |\n| `cortex_related` | Find notes semantically related to a topic |\n| `cortex_search_entities` | Search by entity name (people, projects, concepts) |\n| `cortex_paths` | Trace connections between two ideas |\n| `cortex_contradictions` | Find conflicting claims across notes |\n| `cortex_suggest_links` | Get wikilink suggestions for the current note |\n| `cortex_ingest_url` | Pull a URL into the knowledge graph |\n\n---\n\n## Inside Obsidian\n\nYou don't *have* to use external agents. The plugin ships with:\n\n- **Ask your vault** (\u2318P) \u2014 chat over your knowledge graph with citations back to source notes.\n- **Related notes pane** \u2014 sidebar showing semantically similar notes (not just backlinks).\n- **Inline link suggestions** \u2014 ghost-text `[[wikilink]]` autocompletes driven by entity matches in your graph; press **Tab** to accept, **Esc** to dismiss.\n- **Memory stats** modal \u2014 see how many notes, entities, and relationships are in your graph.\n\n---\n\n## Privacy & what gets synced\n\n- **Cloud mode**: notes are sent to the HangarX hosted API for entity extraction and embedding. They're stored in your scoped workspace and never used to train models. Revoke access anytime from [app.hangarx.ai](https://app.hangarx.ai/settings?tab=api-keys).\n- **Local mode**: nothing leaves your machine. The Docker stack runs FalkorDB (graph), Postgres + pgvector (embeddings), and the Cortex API. You bring an LLM key (or run Ollama for fully offline).\n- **What's excluded by default**: `.cortex/`, `.obsidian/`, `templates/`. Configure include/exclude lists in **What to sync**.\n- **Attachments**: images, PDFs, and other binaries referenced by your notes are ingested by default. Toggle off in **Sync attachments**.\n\n---\n\n## Commands\n\n| Command | Description |\n|---|---|\n| `HangarX: Sync vault to memory layer` | Push changed files to the graph |\n| `HangarX: Force re-ingest entire vault` | Re-sync everything (use after a server reset) |\n| `HangarX: Connect agents (Claude, Cursor)\u2026` | Jump to the Agents settings panel |\n| `HangarX: Memory stats` | Show graph + memory counts |\n| `HangarX: Ask your vault` | Open the Q&A chat |\n| `HangarX: Ingest URL into knowledge graph` | Scrape a URL and add it to memory |\n\n---\n\n## Troubleshooting\n\n**\"This API key was rejected (401)\" in Cloud mode.**\nGenerate a fresh key in the [dashboard](https://app.hangarx.ai/settings?tab=api-keys) and click Test on the API Key field. If you signed in via OAuth, click **Sign out** then **Sign in with HangarX** again.\n\n**Local stack: \"Cannot reach http://localhost:3400\".**\nMake sure Docker Desktop is running and `docker compose ps` shows the `cortex-api` container as healthy. Check `docker compose logs cortex-api` for startup errors. The most common cause is a missing LLM key \u2014 confirm `GEMINI_API_KEY` (or whichever provider) is set when you ran `up -d`.\n\n**Local stack: embedding dimension mismatch.**\nYou changed embedding providers and the existing chunks were embedded with a different model. Run `HangarX: Force re-ingest entire vault` after recreating the container, or wipe the local Postgres volume.\n\n**Agent shows \"Connected\" but doesn't see HangarX tools.**\nRestart the agent fully \u2014 Claude Desktop, Cursor, and Windsurf cache MCP servers and only re-read the config on launch. For Claude Code, start a new session.\n\n**Sync is slow.**\nInitial syncs are O(notes \xD7 LLM latency). Cloud mode uses our infrastructure; local mode is bound by your LLM provider's throughput. Switch the embedding provider to Ollama for faster, free local embeddings.\n\n---\n\n## Architecture & internals\n\nFor the technical deep-dive \u2014 how entity extraction, multi-hop retrieval, claim graphs, and the MCP bridge actually work \u2014 see [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).\n\n---\n\n## Links\n\n- **Dashboard**: [app.hangarx.ai](https://app.hangarx.ai)\n- **Marketing site**: [hangarx.ai](https://www.hangarx.ai)\n- **Issues / feedback**: open an issue in the [HangarX repo](https://github.com/3-Elements-Design/hangarx-knowledge-graph)\n- **Built by**: [HangarX](https://www.hangarx.ai)\n\n---\n\n## License\n\nMIT.\n";

// src/views/readme-modal.ts
var ReadmeModal = class extends import_obsidian3.Modal {
  constructor(app) {
    super(app);
    this.renderComponent = new import_obsidian3.Component();
  }
  async onOpen() {
    this.modalEl.addClass("cortex-readme-modal");
    this.titleEl.empty();
    const title = this.titleEl.createEl("div", { cls: "cortex-readme-title" });
    title.createEl("span", { text: "HangarX \u2014 Documentation" });
    const actions = title.createEl("div", { cls: "cortex-readme-title-actions" });
    const externalBtn = actions.createEl("button", {
      cls: "cortex-readme-iconbtn",
      attr: { "aria-label": "Open online docs" }
    });
    (0, import_obsidian3.setIcon)(externalBtn, "external-link");
    externalBtn.addEventListener("click", () => {
      window.open("https://app.hangarx.ai/obsidian", "_blank");
    });
    const body = this.contentEl.createDiv({ cls: "cortex-readme-body markdown-rendered" });
    this.renderComponent.load();
    await import_obsidian3.MarkdownRenderer.render(this.app, README_default, body, "", this.renderComponent);
    body.querySelectorAll("a[href]").forEach((el) => {
      const a = el;
      const href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      }
    });
  }
  onClose() {
    this.renderComponent.unload();
    this.contentEl.empty();
  }
};

// src/settings.ts
var CLOUD_API_URL = "https://cortex.hangarx.ai";
var LOCAL_API_URL = "http://localhost:3400";
var EMBEDDING_PRESETS = {
  gemini: { provider: "gemini", model: "gemini-embedding-001" },
  ollama: { provider: "ollama", model: "nomic-embed-text" },
  openai: { provider: "openai", model: "text-embedding-3-small" }
};
function buildDockerCompose(localApiKey, encryptionKey, embedding = "gemini") {
  const e = EMBEDDING_PRESETS[embedding] ?? EMBEDDING_PRESETS.gemini;
  return `# Cortex GraphRAG \u2014 Local Stack
# Start: docker compose -f docker-compose.cortex.yml up -d
# Stop:  docker compose -f docker-compose.cortex.yml down
services:
  falkordb:
    image: falkordb/falkordb:latest
    container_name: cortex-falkordb
    restart: unless-stopped
    ports:
      - "\${FALKORDB_PORT:-6379}:6379"
    volumes:
      - falkordb_data:/data
    # Default MAX_QUEUED_QUERIES is 25 \u2014 bursty ingestion saturates it and the
    # client sees "Max pending queries exceeded". Raise the cap for local use.
    command: ["redis-server", "--loadmodule", "/var/lib/falkordb/bin/falkordb.so", "MAX_QUEUED_QUERIES", "4000"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  postgres:
    image: pgvector/pgvector:pg16
    container_name: cortex-postgres
    restart: unless-stopped
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_USER: cortex
      POSTGRES_PASSWORD: cortex
      POSTGRES_DB: cortex
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cortex -d cortex"]
      interval: 5s
      timeout: 5s
      retries: 10
  cortex-api:
    image: \${CORTEX_IMAGE:-hangarx/cortex-api:latest}
    container_name: cortex-api
    restart: unless-stopped
    ports:
      - "\${CORTEX_PORT:-3400}:3400"
    environment:
      LOCAL_API_KEY: "${localApiKey}"
      PORT: 3400
      GRAPH_STORE_TYPE: falkordb
      VECTOR_STORE_TYPE: pgvector
      FALKORDB_HOST: falkordb
      FALKORDB_PORT: 6379
      DATABASE_URL: postgres://cortex:cortex@postgres:5432/cortex
      AUTO_MIGRATE: "true"
      STORAGE_TYPE: postgres
      ANALYTICS_STORE_TYPE: memory
      LLM_PROVIDER: \${LLM_PROVIDER:-gemini}
      LLM_MODEL: \${LLM_MODEL:-gemini-2.5-flash}
      EMBEDDING_PROVIDER: \${EMBEDDING_PROVIDER:-${e.provider}}
      EMBEDDING_MODEL: \${EMBEDDING_MODEL:-${e.model}}
      GEMINI_API_KEY: \${GEMINI_API_KEY:-}
      OPENAI_API_KEY: \${OPENAI_API_KEY:-}
      ANTHROPIC_API_KEY: \${ANTHROPIC_API_KEY:-}
      MOONSHOT_API_KEY: \${MOONSHOT_API_KEY:-}
      HF_TOKEN: \${HF_TOKEN:-}
      OPENROUTER_API_KEY: \${OPENROUTER_API_KEY:-}
      XAI_API_KEY: \${XAI_API_KEY:-}
      OLLAMA_BASE_URL: \${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      MCP_ALLOW_UNAUTHENTICATED: "true"
      BOOTSTRAP_SECRET: cortex-local
      CONNECTOR_ENCRYPTION_KEY: "${encryptionKey}"
    depends_on:
      falkordb:
        condition: service_healthy
      postgres:
        condition: service_healthy
volumes:
  falkordb_data:
  postgres_data:
`;
}
function generateLocalApiKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `ctx_local_${hex}`;
}
function generateEncryptionKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var DOCKER_START_CMD = `docker compose -f docker-compose.cortex.yml up -d --force-recreate`;
var DEFAULT_SETTINGS = {
  connectionMode: "cloud",
  apiUrl: CLOUD_API_URL,
  apiKey: "",
  workspaceId: "",
  vaultId: "",
  excludePatterns: [".cortex/", ".obsidian/", "templates/"],
  includeFolders: [],
  syncOnStartup: true,
  autoSyncDebounceMs: 2e3,
  syncAttachments: true,
  attachmentMaxBytes: 10 * 1024 * 1024,
  showRelatedPane: true,
  inlineSuggestionsEnabled: true,
  mcpEnabled: false,
  mcpPort: 7474,
  mcpToken: "",
  chatExportFolder: "Cortex Chats",
  memoryFolder: "Cortex Memories",
  writeMemoriesToVault: true,
  autoSaveChatToVault: false,
  connectorEncryptionKey: "",
  llmKeys: {},
  embeddingPreset: "gemini",
  deviceId: "",
  deviceName: "",
  composeOutOfSync: false
};
function defaultDeviceName() {
  if (import_obsidian6.Platform.isMobileApp) return import_obsidian6.Platform.isIosApp ? "iOS" : "Android";
  if (import_obsidian6.Platform.isMacOS) return "Mac";
  if (import_obsidian6.Platform.isWin) return "Windows";
  if (import_obsidian6.Platform.isLinux) return "Linux";
  return "Desktop";
}
var CortexSettingTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    /** Surfaced by checkLocalHealth(). */
    this.lastHealthDetail = "";
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const mode = s.connectionMode;
    containerEl.createEl("h3", { text: "Connection" });
    new import_obsidian6.Setting(containerEl).setName("Mode").setDesc("Choose where HangarX runs. Cloud uses the hosted API. Local runs everything on your machine via Docker.").addDropdown((d) => d.addOption("cloud", "\u2601\uFE0F  Cloud (HangarX hosted)").addOption("local", "\u{1F3E0}  Local (Docker)").setValue(mode).onChange(async (v) => {
      s.connectionMode = v;
      if (v === "cloud") s.apiUrl = CLOUD_API_URL;
      else if (v === "local") s.apiUrl = LOCAL_API_URL;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (mode === "cloud") {
      this.renderCloudConnection(containerEl, s);
    }
    if (mode === "local") {
      this.renderLocalConnection(containerEl, s);
    }
    this.renderAgentsSection(containerEl);
    containerEl.createEl("h3", { text: "What to sync" });
    new import_obsidian6.Setting(containerEl).setName("Include folders").setDesc("Comma-separated folder prefixes. Empty = include everything not excluded.").addText((t) => t.setValue(this.plugin.settings.includeFolders.join(",")).onChange(async (v) => {
      this.plugin.settings.includeFolders = v.split(",").map((x) => x.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
    new import_obsidian6.Setting(containerEl).setName("Exclude patterns").setDesc("Comma-separated path prefixes to skip when pushing to HangarX.").addText((t) => t.setValue(this.plugin.settings.excludePatterns.join(",")).onChange(async (v) => {
      this.plugin.settings.excludePatterns = v.split(",").map((x) => x.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
    new import_obsidian6.Setting(containerEl).setName("Sync attachments").setDesc("Ingest images, PDFs, and other binaries referenced by your notes.").addToggle((t) => t.setValue(this.plugin.settings.syncAttachments).onChange(async (v) => {
      this.plugin.settings.syncAttachments = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Sync behavior" });
    new import_obsidian6.Setting(containerEl).setName("Sync on startup").setDesc("Run a full vault sync when Obsidian launches. Skips files unchanged since the last sync.").addToggle((t) => t.setValue(this.plugin.settings.syncOnStartup).onChange(async (v) => {
      this.plugin.settings.syncOnStartup = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Interface" });
    new import_obsidian6.Setting(containerEl).setName("Show Related pane").setDesc("Auto-open the Related notes sidebar on plugin startup.").addToggle((t) => t.setValue(this.plugin.settings.showRelatedPane).onChange(async (v) => {
      this.plugin.settings.showRelatedPane = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian6.Setting(containerEl).setName("Inline link suggestions").setDesc("Show ghost-text [[wikilink]] suggestions while typing \u2014 driven by entity matches in your graph. Tab to accept, Esc to dismiss.").addToggle((t) => t.setValue(this.plugin.settings.inlineSuggestionsEnabled).onChange(async (v) => {
      this.plugin.settings.inlineSuggestionsEnabled = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Help" });
    new import_obsidian6.Setting(containerEl).setName("Documentation").setDesc("Quick start, agent setup, troubleshooting, and the full plugin guide.").addButton((b) => b.setButtonText("View README").onClick(() => new ReadmeModal(this.app).open())).addButton((b) => b.setButtonText("Open online").setCta().onClick(() => window.open("https://app.hangarx.ai/obsidian", "_blank")));
  }
  /**
   * Headline section: turn this vault into a memory + context layer that any
   * MCP-compatible agent on this machine can call. The local MCP server is
   * the wedge feature; the one-click connect buttons make it 30-second setup.
   */
  /**
   * Cloud-mode connection panel. Two layouts driven by `s.apiKey`:
   *
   *   - Empty:  big sign-in CTA + Open dashboard, with manual paste fields
   *             visible below for users with an existing key.
   *   - Filled: compact one-liner status badge (✓ <email> · ws_<short> · last
   *             used <ago>) + Sign out + Open dashboard. Raw API key /
   *             workspace fields hide under an "Advanced" disclosure so
   *             users aren't staring at credentials they don't need to edit.
   */
  renderCloudConnection(containerEl, s) {
    const isAuthed = !!s.apiKey;
    if (!isAuthed) {
      const intro = containerEl.createDiv({ cls: "cortex-cloud-intro" });
      intro.createEl("p", {
        cls: "setting-item-description",
        text: "Sign in to auto-create an API key and pick your workspace, or paste an existing key below."
      });
      const introActions = intro.createDiv({ cls: "cortex-cloud-intro-actions" });
      const signInBtn = introActions.createEl("button", {
        text: "Sign in with HangarX",
        cls: "mod-cta"
      });
      signInBtn.addEventListener("click", () => this.startInteractiveSignIn(signInBtn, s));
      const dashBtn2 = introActions.createEl("button", { text: "Open dashboard \u2197" });
      dashBtn2.addEventListener("click", () => {
        window.open("https://app.hangarx.ai/settings?tab=api-keys", "_blank");
      });
      const statusBadge2 = intro.createDiv({ cls: "cortex-cloud-status" });
      this.renderCloudCredentialFields(containerEl, s, statusBadge2);
      return;
    }
    const compact = containerEl.createDiv({ cls: "cortex-cloud-compact" });
    const statusBadge = compact.createDiv({ cls: "cortex-cloud-status" });
    void this.validateCloudKey(statusBadge);
    const actions = compact.createDiv({ cls: "cortex-cloud-compact-actions" });
    const dashBtn = actions.createEl("button", { text: "Open dashboard \u2197" });
    dashBtn.addEventListener("click", () => {
      window.open("https://app.hangarx.ai/settings?tab=api-keys", "_blank");
    });
    const signOutBtn = actions.createEl("button", { text: "Sign out" });
    signOutBtn.addEventListener("click", async () => {
      s.apiKey = "";
      s.workspaceId = "";
      await this.plugin.saveSettings();
      this.display();
    });
    const advanced = containerEl.createEl("details", { cls: "cortex-cloud-advanced" });
    advanced.createEl("summary", { text: "Advanced \u2014 API key, workspace ID" });
    const advBody = advanced.createDiv();
    this.renderCloudCredentialFields(advBody, s, statusBadge);
  }
  /**
   * Local-mode connection panel. Two display modes driven by the live health
   * check:
   *   - Stack down → status pill + "Get started" hero (Save YAML + copy
   *     `docker compose up`). The thing the user actually needs.
   *   - Stack up   → compact status pill only. Hero hides.
   *
   * In both cases the BYO provider keys section is visible (it's the gate to
   * a working ingest), and API URL / API Key / Workspace ID collapse under a
   * single Advanced disclosure.
   */
  renderLocalConnection(containerEl, s) {
    if (!s.apiKey || !s.apiKey.startsWith("ctx_local_")) {
      s.apiKey = generateLocalApiKey();
      void this.plugin.saveSettings();
    }
    if (!s.connectorEncryptionKey) {
      s.connectorEncryptionKey = generateEncryptionKey();
      void this.plugin.saveSettings();
    }
    if (!s.workspaceId) {
      s.workspaceId = "default";
      void this.plugin.saveSettings();
    }
    const statusEl = containerEl.createDiv({ cls: "cortex-local-status" });
    const dot = statusEl.createSpan({ cls: "cortex-status-dot" });
    const statusText = statusEl.createSpan({ cls: "cortex-status-text" });
    const retryBtn = statusEl.createEl("button", {
      cls: "cortex-status-retry",
      text: "Retry",
      attr: { "aria-label": "Retry connection check" }
    });
    const setupCard = this.renderLocalSetupCard(containerEl, s);
    const runningCard = this.renderLocalRunningCard(containerEl, s);
    const runCheck = async () => {
      dot.removeClass("cortex-status-ok");
      dot.removeClass("cortex-status-err");
      dot.addClass("cortex-status-checking");
      statusText.textContent = "Checking connection\u2026";
      retryBtn.setAttr("disabled", "true");
      const ok = await this.checkLocalHealth(s.apiUrl);
      dot.removeClass("cortex-status-checking");
      dot.addClass(ok ? "cortex-status-ok" : "cortex-status-err");
      statusText.textContent = this.lastHealthDetail || (ok ? `Connected to ${s.apiUrl}` : `Cannot reach ${s.apiUrl}`);
      retryBtn.removeAttribute("disabled");
      setupCard.style.display = ok ? "none" : "";
      runningCard.style.display = ok ? "" : "none";
    };
    retryBtn.addEventListener("click", () => void runCheck());
    void runCheck();
    this.renderProviderKeysSection(containerEl, s);
    this.renderConnectionDetails(containerEl, s);
  }
  /**
   * Three-step setup card shown when the local stack isn't running. Order
   * matters: provider key first (otherwise the stack starts but can't extract
   * anything), then save the YAML, then run the command. Returns the wrapping
   * element so the caller can hide it once the stack is healthy.
   */
  renderLocalSetupCard(containerEl, s) {
    const hero = containerEl.createDiv({ cls: "cortex-local-hero" });
    hero.createEl("div", { cls: "cortex-local-hero-title", text: "Set up HangarX in three steps" });
    hero.createEl("div", {
      cls: "cortex-local-hero-sub",
      text: "HangarX runs Postgres, FalkorDB, and the Cortex API on your machine via Docker. Pulls images from Docker Hub \u2014 no source code needed."
    });
    const configuredKeys = Object.keys(s.llmKeys).filter((k) => !!s.llmKeys[k]);
    const hasKey = configuredKeys.length > 0;
    const step1 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step1.createEl("span", { cls: "cortex-local-hero-step-num", text: "1." });
    const step1Body = step1.createDiv({ cls: "cortex-local-hero-step-body" });
    step1Body.createEl("div", {
      text: hasKey ? `Add an LLM provider key \u2014 \u2713 ${configuredKeys.length} configured` : "Add an LLM provider key",
      cls: "cortex-local-hero-step-label"
    });
    step1Body.createEl("div", {
      cls: "setting-item-description",
      text: hasKey ? "Used for entity extraction and graph queries. You can add more below." : "Required so HangarX can read your notes. Gemini has a free tier \u2014 fastest to start."
    });
    const step1Actions = step1Body.createDiv({ cls: "cortex-local-hero-step-actions" });
    const jumpToKeysBtn = step1Actions.createEl("button", {
      text: hasKey ? "Manage keys \u2193" : "Add a key \u2193",
      cls: hasKey ? "" : "mod-cta"
    });
    jumpToKeysBtn.addEventListener("click", () => {
      const target = containerEl.querySelector("[data-cortex-keys-anchor]");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target instanceof HTMLDetailsElement) target.open = true;
    });
    const step2 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step2.createEl("span", { cls: "cortex-local-hero-step-num", text: "2." });
    const step2Body = step2.createDiv({ cls: "cortex-local-hero-step-body" });
    step2Body.createEl("div", { text: "Save docker-compose.cortex.yml to your vault", cls: "cortex-local-hero-step-label" });
    step2Body.createEl("div", {
      cls: "setting-item-description",
      text: "Bakes your API key + provider keys into the file. Re-save anytime they change."
    });
    const step2Actions = step2Body.createDiv({ cls: "cortex-local-hero-step-actions" });
    const saveBtn = step2Actions.createEl("button", { text: "Save to vault", cls: "mod-cta" });
    saveBtn.addEventListener("click", async () => {
      try {
        const path = "docker-compose.cortex.yml";
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        saveBtn.setText("\u2713 Saved");
        if (s.composeOutOfSync) {
          s.composeOutOfSync = false;
          await this.plugin.saveSettings();
        }
        setTimeout(() => saveBtn.setText("Save to vault"), 2e3);
      } catch (e) {
        saveBtn.setText("Failed \u2014 check console");
        console.error("[Cortex] Failed to write compose file:", e);
      }
    });
    const copyYamlBtn = step2Actions.createEl("button", { text: "Copy YAML" });
    copyYamlBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      copyYamlBtn.setText("Copied");
      setTimeout(() => copyYamlBtn.setText("Copy YAML"), 1400);
    });
    const step3 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step3.createEl("span", { cls: "cortex-local-hero-step-num", text: "3." });
    const step3Body = step3.createDiv({ cls: "cortex-local-hero-step-body" });
    step3Body.createEl("div", { text: "Run this in your vault folder:", cls: "cortex-local-hero-step-label" });
    const codeWrap = step3Body.createDiv({ cls: "cortex-mcp-code-wrap" });
    const copyCmdBtn = codeWrap.createEl("button", { cls: "cortex-mcp-copy", text: "Copy" });
    copyCmdBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(DOCKER_START_CMD);
      copyCmdBtn.textContent = "Copied";
      copyCmdBtn.addClass("is-copied");
      setTimeout(() => {
        copyCmdBtn.textContent = "Copy";
        copyCmdBtn.removeClass("is-copied");
      }, 1400);
    });
    codeWrap.createEl("pre").createEl("code", { text: DOCKER_START_CMD });
    return hero;
  }
  /**
   * Success card shown when the local stack is reachable. Confirms what's
   * happening and points to the next obvious action so first-time users know
   * they've crossed the finish line.
   */
  renderLocalRunningCard(containerEl, s) {
    const card = containerEl.createDiv({ cls: "cortex-local-running-card" });
    card.style.margin = "8px 0 16px";
    card.style.padding = "14px 16px";
    card.style.borderLeft = "3px solid var(--interactive-success, #22c55e)";
    card.style.background = "var(--background-modifier-success, rgba(34, 197, 94, 0.06))";
    card.style.borderRadius = "4px";
    card.createEl("div", {
      text: "\u2713 Local stack running",
      attr: { style: "font-weight: 600; margin-bottom: 4px;" }
    });
    card.createEl("div", {
      cls: "setting-item-description",
      text: `Connected to ${s.apiUrl}. Your vault is ready to be searched and indexed by AI agents.`
    });
    card.createEl("div", {
      cls: "setting-item-description",
      text: 'Verify with Cmd/Ctrl+P \u2192 "HangarX: Memory stats". Manage agents under the Agents section below.',
      attr: { style: "margin-top: 6px;" }
    });
    return card;
  }
  /**
   * Advanced disclosure: raw API URL / Key / Workspace fields + "How to
   * start" reference. Collapsed by default — most users won't need it after
   * the initial save.
   */
  /**
   * Diagnostic / set-once fields, collapsed by default. Auto-opens when the
   * compose file is out of sync so the rebuild banner is visible. Holds:
   *   - API Key (Copy / Test auth / Regenerate)
   *   - Docker Compose file (Save to vault — for re-saves after key changes)
   *   - API URL, Workspace ID
   */
  renderConnectionDetails(parent, s) {
    const wrap = parent.createEl("details", { cls: "cortex-cloud-advanced" });
    if (s.composeOutOfSync) wrap.setAttr("open", "");
    wrap.createEl("summary", { text: "Connection details \u2014 API key, Compose file, advanced" });
    const body = wrap.createDiv();
    new import_obsidian6.Setting(body).setName("API Key").setDesc("Auto-generated and shared with the Docker container via the compose file. Re-save the YAML if you regenerate.").addText((t) => {
      t.inputEl.type = "password";
      t.inputEl.readOnly = true;
      t.setValue(s.apiKey);
    }).addButton((b) => b.setButtonText("Copy").onClick(async () => {
      await navigator.clipboard.writeText(s.apiKey);
      b.setButtonText("Copied");
      setTimeout(() => b.setButtonText("Copy"), 1400);
    })).addButton((b) => b.setButtonText("Test auth").onClick(async () => {
      b.setButtonText("Testing\u2026");
      b.setDisabled(true);
      try {
        await this.plugin.client.searchEntitiesByName("test", 1);
        b.setButtonText("\u2713 Authenticated");
        setTimeout(() => b.setButtonText("Test auth"), 2e3);
      } catch (e) {
        const msg = e.message;
        b.setButtonText(msg.includes("401") ? "\u2717 401 \u2014 rebuild container" : "\u2717 Failed (see notice)");
        new import_obsidian6.Notice(`Cortex auth test failed: ${msg}`);
        setTimeout(() => b.setButtonText("Test auth"), 4e3);
      } finally {
        b.setDisabled(false);
      }
    })).addButton((b) => b.setButtonText("Regenerate").setWarning().onClick(async () => {
      s.apiKey = generateLocalApiKey();
      s.connectorEncryptionKey = generateEncryptionKey();
      s.composeOutOfSync = true;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (s.composeOutOfSync) {
      const banner = body.createDiv({ cls: "cortex-compose-warning" });
      banner.style.margin = "8px 0 16px";
      banner.style.padding = "12px 14px";
      banner.style.borderLeft = "3px solid var(--text-warning)";
      banner.style.background = "var(--background-modifier-error-hover, rgba(255, 165, 0, 0.08))";
      banner.style.borderRadius = "4px";
      banner.style.fontSize = "13px";
      banner.createEl("strong", { text: "Container is out of sync." });
      banner.createEl("span", {
        text: " The API key has changed since the compose file was last saved. To bring the Docker container in sync:"
      });
      const ol = banner.createEl("ol");
      ol.style.margin = "8px 0 8px 20px";
      ol.style.padding = "0";
      ol.createEl("li", { text: "Click Save to vault below to write the new key into docker-compose.cortex.yml." });
      const li2 = ol.createEl("li");
      li2.appendText("From the vault folder, run: ");
      const cmd = li2.createEl("code", {
        text: "docker compose -f docker-compose.cortex.yml up -d --force-recreate"
      });
      cmd.style.background = "var(--background-secondary)";
      cmd.style.padding = "1px 6px";
      cmd.style.borderRadius = "3px";
      cmd.style.fontSize = "12px";
    }
    new import_obsidian6.Setting(body).setName("Docker Compose file").setDesc("Re-save the YAML here whenever the API key or provider keys change, then run docker compose up --force-recreate to apply.").addButton((b) => b.setButtonText("Save to vault").setCta().onClick(async () => {
      const path = "docker-compose.cortex.yml";
      try {
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        b.setButtonText("\u2713 Saved");
        new import_obsidian6.Notice(
          `Saved ${path}. Restart with: docker compose -f ${path} up -d --force-recreate`,
          8e3
        );
        const wasOutOfSync = s.composeOutOfSync;
        if (wasOutOfSync) {
          s.composeOutOfSync = false;
          await this.plugin.saveSettings();
          setTimeout(() => this.display(), 1200);
        } else {
          setTimeout(() => b.setButtonText("Save to vault"), 2e3);
        }
      } catch (e) {
        b.setButtonText("Failed");
        console.error("[Cortex] Failed to write compose file:", e);
        setTimeout(() => b.setButtonText("Save to vault"), 2e3);
      }
    })).addButton((b) => b.setButtonText("Copy YAML").onClick(async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      b.setButtonText("Copied");
      setTimeout(() => b.setButtonText("Copy YAML"), 1400);
    }));
    new import_obsidian6.Setting(body).setName("API URL").setDesc("Your local HangarX API URL. Defaults to http://localhost:3400 \u2014 only change if you remapped the port.").addText((t) => t.setPlaceholder(LOCAL_API_URL).setValue(s.apiUrl).onChange(async (v) => {
      s.apiUrl = v || LOCAL_API_URL;
      await this.plugin.saveSettings();
    }));
    new import_obsidian6.Setting(body).setName("Workspace ID").setDesc("A namespace for your graph data. Auto-generated; only change if you want multiple isolated graphs.").addText((t) => t.setPlaceholder("default").setValue(s.workspaceId).onChange(async (v) => {
      s.workspaceId = v.trim() || "default";
      await this.plugin.saveSettings();
    }));
  }
  /** Kicks off the OAuth sign-in flow, swapping the button label while it's in flight. */
  async startInteractiveSignIn(signInBtn, s) {
    const original = signInBtn.textContent;
    signInBtn.setText("Opening browser\u2026");
    signInBtn.setAttr("disabled", "true");
    try {
      const result = await startSignIn({
        dashboardUrl: "https://app.hangarx.ai",
        apiUrl: s.apiUrl || CLOUD_API_URL,
        clientId: "hangarx-obsidian",
        redirectUri: "obsidian://hangarx-callback"
      });
      s.apiKey = result.accessToken;
      s.workspaceId = result.workspaceId;
      await this.plugin.saveSettings();
      new import_obsidian6.Notice(`\u2713 Signed in${result.userEmail ? ` as ${result.userEmail}` : ""}. Workspace ready to sync.`, 6e3);
      this.display();
    } catch (e) {
      const msg = e.message || "Sign-in failed";
      new import_obsidian6.Notice(`Sign-in failed: ${msg}`, 8e3);
    } finally {
      signInBtn.setText(original ?? "Sign in with HangarX");
      signInBtn.removeAttribute("disabled");
    }
  }
  /** API key + Workspace ID inputs, shared by pre-auth and Advanced disclosure. */
  renderCloudCredentialFields(parent, s, statusBadge) {
    let validateTimer;
    const scheduleValidate = () => {
      if (validateTimer) window.clearTimeout(validateTimer);
      validateTimer = window.setTimeout(() => this.validateCloudKey(statusBadge), 600);
    };
    new import_obsidian6.Setting(parent).setName("API Key").setDesc("Org-scoped API key from your HangarX dashboard.").addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder("ctx_\u2026").setValue(s.apiKey).onChange(async (v) => {
        s.apiKey = v.trim();
        await this.plugin.saveSettings();
        scheduleValidate();
      });
    }).addButton((b) => b.setButtonText("Test").setTooltip("Validate the API key by calling /v1/api-keys/whoami").onClick(() => this.validateCloudKey(statusBadge)));
    new import_obsidian6.Setting(parent).setName("Workspace ID").setDesc("Found in your HangarX workspace settings (Settings \u2192 Workspaces).").addText((t) => t.setPlaceholder("ws_\u2026").setValue(s.workspaceId).onChange(async (v) => {
      s.workspaceId = v.trim();
      await this.plugin.saveSettings();
      scheduleValidate();
    }));
    if (s.apiKey) {
      void this.validateCloudKey(statusBadge);
    }
  }
  renderAgentsSection(parent) {
    parent.createEl("h3", { text: "Agents" });
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Make this vault available as a memory + context layer for AI agents on this machine \u2014 Claude Desktop, Claude Code, Cursor, or anything else that speaks MCP. Your notes, decisions, and project history become permanent agent context across sessions."
    });
    parent.createEl("h4", { text: "Local agents", cls: "cortex-agents-subhead" });
    const connectRow = parent.createDiv({ cls: "cortex-agents-connect-row" });
    this.renderAgentConnectCards(connectRow);
    if (this.plugin.settings.connectionMode === "cloud" && this.plugin.settings.apiKey) {
      this.renderCloudAgentsSection(parent);
    }
    new import_obsidian6.Setting(parent).setName("Enable local MCP server").setDesc("Required for the connect buttons above. Binds to 127.0.0.1 only.").addToggle((t) => t.setValue(this.plugin.settings.mcpEnabled).onChange(async (v) => {
      this.plugin.settings.mcpEnabled = v;
      await this.plugin.saveSettings();
      await this.plugin.toggleMcpServer(v);
      this.display();
    }));
    if (!this.plugin.settings.mcpEnabled) {
      parent.createEl("p", {
        cls: "cortex-agents-hint",
        text: "Enable the MCP server to expose memory tools to agents. The server only listens on localhost."
      });
      return;
    }
    const advanced = parent.createEl("details", { cls: "cortex-mcp-advanced" });
    advanced.createEl("summary", { text: "Advanced MCP details (port, token, manual config snippet)" });
    const advBody = advanced.createDiv();
    new import_obsidian6.Setting(advBody).setName("MCP port").setDesc("Port to bind to (default 7474). Change requires server restart.").addText((t) => t.setValue(String(this.plugin.settings.mcpPort)).onChange(async (v) => {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n > 0 && n < 65536) {
        this.plugin.settings.mcpPort = n;
        await this.plugin.saveSettings();
      }
    }));
    if (this.plugin.settings.mcpToken) {
      const url = `http://127.0.0.1:${this.plugin.settings.mcpPort}`;
      new import_obsidian6.Setting(advBody).setName("MCP URL").addText((t) => {
        t.inputEl.readOnly = true;
        t.setValue(url);
      });
      new import_obsidian6.Setting(advBody).setName("MCP token").setDesc("Bearer token required by clients. Keep it secret.").addText((t) => {
        t.inputEl.readOnly = true;
        t.inputEl.type = "password";
        t.setValue(this.plugin.settings.mcpToken);
      }).addButton((b) => b.setButtonText("Copy").onClick(async () => {
        await navigator.clipboard.writeText(this.plugin.settings.mcpToken);
      })).addButton((b) => b.setButtonText("Regenerate").onClick(async () => {
        const { generateToken: generateToken2 } = await Promise.resolve().then(() => (init_mcp_server(), mcp_server_exports));
        this.plugin.settings.mcpToken = generateToken2();
        await this.plugin.saveSettings();
        await this.plugin.toggleMcpServer(true);
        this.display();
      }));
      const bridgePath = this.plugin.mcp.bridgePath || `<reload-plugin-to-generate>`;
      const snippet = `"mcpServers": {
  "hangarx-obsidian": {
    "command": "node",
    "args": ["${bridgePath}"],
    "env": {
      "CORTEX_MCP_URL": "${url}",
      "CORTEX_MCP_TOKEN": "${this.plugin.settings.mcpToken}"
    }
  }
}`;
      const example = advBody.createEl("details", { cls: "cortex-mcp-example" });
      example.createEl("summary", { text: "Manual config snippet (for tools without one-click connect)" });
      const codeWrap = example.createEl("div", { cls: "cortex-mcp-code-wrap" });
      const copyBtn = codeWrap.createEl("button", {
        cls: "cortex-mcp-copy",
        text: "Copy"
      });
      copyBtn.addEventListener("click", async () => {
        await navigator.clipboard.writeText(snippet);
        const original = copyBtn.textContent;
        copyBtn.textContent = "Copied";
        copyBtn.addClass("is-copied");
        setTimeout(() => {
          copyBtn.textContent = original;
          copyBtn.removeClass("is-copied");
        }, 1400);
      });
      codeWrap.createEl("pre").createEl("code", { text: snippet });
    }
  }
  renderAgentConnectCards(parent) {
    parent.empty();
    if (!this.plugin.settings.mcpEnabled || !this.plugin.settings.mcpToken) return;
    if (!import_obsidian6.Platform.isDesktopApp) {
      parent.createEl("p", {
        cls: "setting-item-description",
        text: "Agent connectors are desktop-only \u2014 these clients don't run on mobile."
      });
      return;
    }
    const port = this.plugin.settings.mcpPort;
    const token = this.plugin.settings.mcpToken;
    const bridgePath = this.plugin.mcp?.bridgePath;
    if (!bridgePath) {
      parent.createEl("p", {
        cls: "setting-item-description",
        text: "Bridge script not yet generated. Toggle the MCP server off and on to regenerate."
      });
      return;
    }
    const bridge = { bridgePath, url: `http://127.0.0.1:${port}`, token };
    const harnesses = [
      {
        id: "claude-desktop",
        label: "Claude Desktop",
        description: "Anthropic's desktop app.",
        configPath: claudeDesktopConfigPath(),
        connect: () => connectClaudeDesktop(bridge)
      },
      {
        id: "claude-code",
        label: "Claude Code",
        description: "CLI coding agent.",
        configPath: claudeCodeConfigPath(),
        connect: () => connectClaudeCode(bridge)
      },
      {
        id: "cursor",
        label: "Cursor",
        description: "AI-first editor.",
        configPath: cursorConfigPath(),
        connect: () => connectCursor(bridge)
      },
      {
        id: "cline",
        label: "Cline (VS Code)",
        description: "Autonomous coding agent extension.",
        configPath: clineConfigPath(),
        connect: () => connectCline(bridge)
      },
      {
        id: "windsurf",
        label: "Windsurf",
        description: "Codeium's agentic IDE.",
        configPath: windsurfConfigPath(),
        connect: () => connectWindsurf(bridge)
      }
    ];
    const list = parent.createDiv({ cls: "cortex-agents-list" });
    for (const h of harnesses) {
      this.renderAgentRow(list, h, bridge);
    }
    this.renderGenericAgentRow(list, bridge);
  }
  /** One row in the agents list — name, description, status, Connect, kebab. */
  renderAgentRow(parent, h, bridge) {
    const row = parent.createDiv({ cls: "cortex-agent-row" });
    const main = row.createDiv({ cls: "cortex-agent-row-main" });
    const head = main.createDiv({ cls: "cortex-agent-row-head" });
    head.createEl("span", { cls: "cortex-agent-row-label", text: h.label });
    const status = head.createEl("span", { cls: "cortex-agent-row-status", text: "\u2026" });
    main.createEl("span", { cls: "cortex-agent-row-desc", text: h.description });
    const actions = row.createDiv({ cls: "cortex-agent-row-actions" });
    const connectBtn = actions.createEl("button", { text: "Connect" });
    void checkConnection(h.configPath).then((s) => {
      if (s.connected) {
        status.setText("\u2713 Connected");
        status.addClass("is-connected");
        connectBtn.setText("Reconnect");
      } else if (s.exists) {
        status.setText("Not connected");
      } else {
        status.setText("Not installed");
        status.addClass("is-faint");
      }
    });
    connectBtn.addEventListener("click", async () => {
      connectBtn.setText("Connecting\u2026");
      connectBtn.setAttr("disabled", "true");
      try {
        const result = await h.connect();
        if (result.ok) {
          status.setText(result.unchanged ? "\u2713 Already connected" : "\u2713 Connected");
          status.addClass("is-connected");
          status.removeClass("is-faint");
          new import_obsidian6.Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
          connectBtn.setText("Reconnect");
        } else {
          status.setText("Failed");
          status.addClass("is-error");
          new import_obsidian6.Notice(`${h.label}: ${result.message}`);
          connectBtn.setText("Retry");
        }
      } finally {
        connectBtn.removeAttribute("disabled");
      }
    });
    if (h.configPath) {
      const menuBtn = actions.createEl("button", {
        text: "\u22EF",
        attr: { "aria-label": "More actions", title: "More actions" }
      });
      menuBtn.addEventListener("click", (evt) => {
        evt.preventDefault();
        this.openAgentRowMenu(evt, h, bridge, status, connectBtn);
      });
    }
  }
  /** Kebab menu for an agent row: copy path / reveal / show snippet / disconnect. */
  openAgentRowMenu(evt, h, bridge, status, connectBtn) {
    const path = h.configPath;
    if (!path) return;
    const menu = new import_obsidian6.Menu();
    menu.addItem((item) => item.setTitle("Copy config path").setIcon("clipboard").onClick(async () => {
      await navigator.clipboard.writeText(path);
      new import_obsidian6.Notice("Config path copied.");
    }));
    menu.addItem((item) => item.setTitle(this.fileManagerLabel()).setIcon("folder-open").onClick(() => {
      if (!revealInFileManager(path)) {
        new import_obsidian6.Notice("Couldn't open the file manager from this build of Obsidian.");
      }
    }));
    menu.addItem((item) => item.setTitle("Copy MCP snippet").setIcon("code").onClick(async () => {
      const snippet = JSON.stringify(
        { mcpServers: { "hangarx-obsidian": buildBridgeEntry(bridge) } },
        null,
        2
      );
      await navigator.clipboard.writeText(snippet);
      new import_obsidian6.Notice("MCP config snippet copied.");
    }));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("Disconnect").setIcon("unplug").setWarning(true).onClick(async () => {
      const result = await disconnectMcpEntry(path);
      if (result.ok) {
        status.setText(result.unchanged ? "Not connected" : "Disconnected");
        status.removeClass("is-connected");
        connectBtn.setText("Connect");
        new import_obsidian6.Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
      } else {
        new import_obsidian6.Notice(`${h.label}: ${result.message}`);
      }
    }));
    menu.showAtMouseEvent(evt);
  }
  /** OS-aware label for the "Reveal in …" menu item. */
  fileManagerLabel() {
    if (import_obsidian6.Platform.isMacOS) return "Reveal in Finder";
    if (import_obsidian6.Platform.isWin) return "Show in Explorer";
    return "Show in file manager";
  }
  /**
   * Generic row for "any other MCP-compatible app". Expands to show the JSON
   * snippet to paste manually. Covers harnesses we haven't packaged a
   * connector for (Zed, Goose, Codex CLI, anything new).
   */
  renderGenericAgentRow(parent, bridge) {
    const row = parent.createEl("details", { cls: "cortex-agent-row cortex-agent-row-generic" });
    const summary = row.createEl("summary");
    const main = summary.createDiv({ cls: "cortex-agent-row-main" });
    main.createEl("span", { cls: "cortex-agent-row-label", text: "Other MCP-compatible app" });
    main.createEl("span", {
      cls: "cortex-agent-row-desc",
      text: "Copy the snippet below into any client that speaks MCP (Zed, Goose, Codex CLI, custom agents)."
    });
    const body = row.createDiv({ cls: "cortex-agent-row-body" });
    const entry = { mcpServers: { "hangarx-obsidian": buildBridgeEntry(bridge) } };
    const snippet = JSON.stringify(entry, null, 2);
    const codeWrap = body.createDiv({ cls: "cortex-mcp-code-wrap" });
    const copyBtn = codeWrap.createEl("button", { cls: "cortex-mcp-copy", text: "Copy" });
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(snippet);
      copyBtn.setText("Copied");
      copyBtn.addClass("is-copied");
      setTimeout(() => {
        copyBtn.setText("Copy");
        copyBtn.removeClass("is-copied");
      }, 1400);
    });
    codeWrap.createEl("pre").createEl("code", { text: snippet });
  }
  /**
   * Cloud agents section. Same vault, accessed remotely from a cloud-side
   * agent (Claude.ai web/mobile, ChatGPT desktop, Cursor on a remote dev
   * box) rather than via the local MCP bridge. The cloud already exposes a
   * public MCP endpoint at cortex.hangarx.ai/mcp; agents authenticate with
   * the same `ctx_…` API key the plugin already has, so we just need to
   * surface the URL + key in copy-pasteable form.
   */
  renderCloudAgentsSection(parent) {
    const apiKey = this.plugin.settings.apiKey;
    const apiUrl = (this.plugin.settings.apiUrl || "https://cortex.hangarx.ai").replace(/\/$/, "");
    const mcpUrl = `${apiUrl}/mcp`;
    const workspaceId = this.plugin.settings.workspaceId;
    parent.createEl("h4", { text: "Cloud agents", cls: "cortex-agents-subhead" });
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Reach the same workspace from agents that don't run on this machine \u2014 Claude.ai web/mobile, ChatGPT desktop, or any agent on a cloud dev box. They authenticate against cortex.hangarx.ai/mcp using your API key."
    });
    const summary = parent.createDiv({ cls: "cortex-cloud-agent-summary" });
    const summaryLeft = summary.createDiv({ cls: "cortex-cloud-agent-summary-fields" });
    summaryLeft.createEl("div", { cls: "cortex-cloud-agent-row", text: `URL: ${mcpUrl}` });
    summaryLeft.createEl("div", {
      cls: "cortex-cloud-agent-row",
      text: `Auth: x-api-key: ${apiKey ? maskKey(apiKey) : "<not configured>"}`
    });
    if (workspaceId) {
      summaryLeft.createEl("div", {
        cls: "cortex-cloud-agent-row",
        text: `Workspace: x-workspace-id: ${workspaceId}`
      });
    }
    const summaryActions = summary.createDiv({ cls: "cortex-cloud-agent-summary-actions" });
    const copyAllBtn = summaryActions.createEl("button", { text: "Copy URL + key", cls: "mod-cta" });
    copyAllBtn.addEventListener("click", async () => {
      const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
      if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
      await navigator.clipboard.writeText(lines.join("\n"));
      copyAllBtn.setText("Copied");
      setTimeout(() => copyAllBtn.setText("Copy URL + key"), 1400);
    });
    const clients = [
      {
        id: "claude-ai",
        label: "Claude.ai (web / mobile)",
        description: "Add as a Custom Connector under Settings \u2192 Connectors.",
        openUrl: "https://claude.ai/settings/connectors"
      },
      {
        id: "chatgpt-desktop",
        label: "ChatGPT desktop",
        description: "Add as an MCP server in Settings \u2192 Connections (desktop only)."
      },
      {
        id: "cursor-remote",
        label: "Cursor (cloud dev box)",
        description: "Add to ~/.cursor/mcp.json on the remote machine \u2014 same shape as the local connector."
      },
      {
        id: "cloud-other",
        label: "Other cloud-hosted agent",
        description: "Any client that supports remote MCP via HTTP + API key."
      }
    ];
    const list = parent.createDiv({ cls: "cortex-agents-list" });
    for (const c of clients) {
      const row = list.createDiv({ cls: "cortex-agent-row" });
      const main = row.createDiv({ cls: "cortex-agent-row-main" });
      main.createEl("span", { cls: "cortex-agent-row-label", text: c.label });
      main.createEl("span", { cls: "cortex-agent-row-desc", text: c.description });
      const actions = row.createDiv({ cls: "cortex-agent-row-actions" });
      const setupBtn = actions.createEl("button", { text: c.openUrl ? "Open & copy" : "Copy creds" });
      setupBtn.addEventListener("click", async () => {
        const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
        if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
        await navigator.clipboard.writeText(lines.join("\n"));
        if (c.openUrl) window.open(c.openUrl, "_blank");
        setupBtn.setText("Copied");
        setTimeout(() => setupBtn.setText(c.openUrl ? "Open & copy" : "Copy creds"), 1400);
      });
      const moreBtn = actions.createEl("button", {
        text: "\u22EF",
        attr: { "aria-label": "More actions", title: "More actions" }
      });
      moreBtn.addEventListener("click", (evt) => {
        evt.preventDefault();
        const menu = new import_obsidian6.Menu();
        menu.addItem((item) => item.setTitle("Copy URL only").setIcon("clipboard").onClick(async () => {
          await navigator.clipboard.writeText(mcpUrl);
          new import_obsidian6.Notice("MCP URL copied.");
        }));
        menu.addItem((item) => item.setTitle("Copy key only").setIcon("clipboard").onClick(async () => {
          await navigator.clipboard.writeText(apiKey);
          new import_obsidian6.Notice("API key copied.");
        }));
        if (workspaceId) {
          menu.addItem((item) => item.setTitle("Copy workspace ID").setIcon("clipboard").onClick(async () => {
            await navigator.clipboard.writeText(workspaceId);
            new import_obsidian6.Notice("Workspace ID copied.");
          }));
        }
        menu.addItem((item) => item.setTitle("Copy curl test").setIcon("terminal").onClick(async () => {
          const curl = `curl -s -X POST -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H 'x-api-key: ${apiKey}'${workspaceId ? ` -H 'x-workspace-id: ${workspaceId}'` : ""} -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' ${mcpUrl}`;
          await navigator.clipboard.writeText(curl);
          new import_obsidian6.Notice("curl one-liner copied \u2014 paste in any terminal to verify connectivity.");
        }));
        menu.showAtMouseEvent(evt);
      });
    }
  }
  /**
   * BYOK + embedding-provider selection. Local-mode only (cloud users get
   * keys via the HangarX dashboard).
   */
  renderProviderKeysSection(parent, s) {
    const PROVIDERS = [
      { id: "gemini", label: "Gemini (Google AI Studio)", placeholder: "AIza\u2026", href: "https://aistudio.google.com/apikey" },
      { id: "openai", label: "OpenAI", placeholder: "sk-\u2026", href: "https://platform.openai.com/api-keys" },
      { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-\u2026", href: "https://console.anthropic.com/settings/keys" },
      { id: "moonshot", label: "Moonshot (Kimi)", placeholder: "sk-\u2026", href: "https://platform.moonshot.ai/console/api-keys" },
      { id: "huggingface", label: "HuggingFace (HF Inference)", placeholder: "hf_\u2026", href: "https://huggingface.co/settings/tokens" },
      { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-\u2026", href: "https://openrouter.ai/keys" },
      { id: "xai", label: "xAI (Grok)", placeholder: "xai-\u2026", href: "https://console.x.ai/" }
    ];
    const configuredCount = PROVIDERS.filter((p) => !!s.llmKeys[p.id]).length;
    const summaryText = configuredCount === 0 ? "LLM provider keys \u2014 no keys configured yet" : `LLM provider keys \u2014 ${configuredCount} of ${PROVIDERS.length} configured`;
    const wrap = parent.createEl("details", { cls: "cortex-llm-keys" });
    wrap.setAttr("data-cortex-keys-anchor", "");
    if (configuredCount === 0) wrap.setAttr("open", "");
    wrap.createEl("summary", { text: summaryText });
    const body = wrap.createDiv({ cls: "cortex-llm-keys-body" });
    body.createEl("p", {
      cls: "setting-item-description",
      text: "Bring your own API keys. They're baked into the docker-compose YAML on disk and never sent to HangarX. After adding or changing a key, re-save the Compose file in Connection details to apply."
    });
    new import_obsidian6.Setting(body).setName("Embedding provider").setDesc(
      "Where embedding calls run. Gemini is fastest to start (free tier, rate-limited). Switch to Ollama for unlimited local embeddings once your vault grows \u2014 requires installing Ollama and running `ollama pull nomic-embed-text`."
    ).addDropdown((d) => d.addOption("gemini", "Gemini (cloud, free tier \u2014 rate-limited)").addOption("ollama", "Ollama local (recommended for heavy ingests)").addOption("openai", "OpenAI (cloud, paid, fast)").setValue(s.embeddingPreset || "gemini").onChange(async (v) => {
      s.embeddingPreset = v;
      await this.plugin.saveSettings();
    }));
    if ((s.embeddingPreset || "gemini") === "ollama") {
      const hint = body.createDiv({ cls: "cortex-local-note" });
      hint.createEl("p", {
        text: "Ollama setup: install Ollama (https://ollama.com), then run: ollama pull nomic-embed-text. The HangarX container reaches Ollama at host.docker.internal:11434."
      });
    }
    const list = body.createDiv({ cls: "cortex-providers-list" });
    for (const p of PROVIDERS) {
      this.renderProviderRow(list, s, p);
    }
  }
  /**
   * One provider row. Collapsed view: name + status pill. Expanded view:
   * password input, "Get a key" external link, and Test button. Keeps the
   * settings page navigable when most providers aren't configured.
   */
  renderProviderRow(parent, s, p) {
    const row = parent.createEl("details", { cls: "cortex-provider-row" });
    if (s.llmKeys[p.id]) row.setAttr("open", "");
    const summary = row.createEl("summary", { cls: "cortex-provider-row-summary" });
    summary.createEl("span", { cls: "cortex-provider-row-label", text: p.label });
    const status = summary.createEl("span", { cls: "cortex-provider-row-status" });
    const renderStatus = () => {
      const key = s.llmKeys[p.id];
      status.empty();
      status.removeClass("is-configured", "is-empty");
      if (key) {
        status.addClass("is-configured");
        status.setText(`\u2713 ${maskKey(key)}`);
      } else {
        status.addClass("is-empty");
        status.setText("Not configured");
      }
    };
    renderStatus();
    const body = row.createDiv({ cls: "cortex-provider-row-body" });
    const setting = new import_obsidian6.Setting(body);
    setting.addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder(p.placeholder);
      t.setValue(s.llmKeys[p.id] || "");
      t.onChange(async (v) => {
        const trimmed = v.trim();
        if (trimmed) s.llmKeys[p.id] = trimmed;
        else delete s.llmKeys[p.id];
        await this.plugin.saveSettings();
        renderStatus();
      });
    });
    setting.addExtraButton((b) => b.setIcon("external-link").setTooltip("Get a key").onClick(() => window.open(p.href, "_blank")));
    setting.addButton((b) => b.setButtonText("Test").setTooltip("Verify the key by calling the provider through the local cortex-api.").onClick(async () => {
      const key = s.llmKeys[p.id];
      if (!key) {
        new import_obsidian6.Notice(`Enter a ${p.label} key first.`);
        return;
      }
      b.setButtonText("Testing\u2026");
      b.setDisabled(true);
      try {
        const ok = await this.testProviderKey(p.id, key);
        b.setButtonText(ok ? "\u2713 Valid" : "\u2717 Invalid");
        setTimeout(() => b.setButtonText("Test"), 2200);
      } catch (e) {
        b.setButtonText("\u2717 Error");
        new import_obsidian6.Notice(`Test failed: ${e.message}`);
        setTimeout(() => b.setButtonText("Test"), 2800);
      } finally {
        b.setDisabled(false);
      }
    }));
    if (s.llmKeys[p.id]) {
      setting.addButton((b) => b.setButtonText("Remove").setWarning().onClick(async () => {
        delete s.llmKeys[p.id];
        await this.plugin.saveSettings();
        renderStatus();
        this.display();
      }));
    }
  }
  /**
   * Validate the configured cloud API key + workspace by calling whoami.
   * Renders a one-line status badge into the provided element:
   *   ✓ green  — key valid, shows owner email (or key name) + key prefix + last-used hint
   *   ⚠ yellow — key valid but workspace ID is missing/empty
   *   ✗ red    — invalid / network error
   * Empty key short-circuits to a neutral "not yet configured" hint.
   */
  async validateCloudKey(badgeEl) {
    const s = this.plugin.settings;
    badgeEl.empty();
    badgeEl.removeClass("is-valid", "is-invalid", "is-warn");
    if (!s.apiKey) {
      badgeEl.addClass("is-warn");
      badgeEl.createEl("span", { text: "No API key set yet \u2014 paste one above to connect." });
      return;
    }
    badgeEl.createEl("span", { text: "Checking API key\u2026", cls: "cortex-cloud-status-checking" });
    try {
      const info = await this.plugin.client.getWhoami();
      badgeEl.empty();
      this.renderWhoamiSuccess(badgeEl, info, s.workspaceId);
    } catch (e) {
      const msg = e.message || "";
      const status = parseStatusFromErrorMessage(msg);
      if (status === 404) {
        const ok = await this.plugin.client.probeAuth();
        badgeEl.empty();
        if (ok) {
          badgeEl.addClass("is-valid");
          badgeEl.createEl("span", {
            text: "\u2713 API key works (server doesn't expose identity details)",
            cls: "cortex-cloud-status-head"
          });
          if (!s.workspaceId) {
            badgeEl.addClass("is-warn");
            badgeEl.createEl("span", {
              cls: "cortex-cloud-status-sub",
              text: "\u26A0 Workspace ID is empty \u2014 set it below to enable sync and ask."
            });
          }
        } else {
          badgeEl.addClass("is-invalid");
          badgeEl.createEl("span", {
            text: "\u2717 This API key was rejected by the server. Confirm it was copied correctly from the dashboard, or generate a new one.",
            cls: "cortex-cloud-status-head"
          });
        }
        return;
      }
      badgeEl.empty();
      badgeEl.addClass("is-invalid");
      if (status === 401 || status === 403) {
        const detail = parseServerErrorDetail(msg);
        const headlineByCode = {
          INVALID_API_KEY: "This key is invalid or expired \u2014 generate a fresh one in the dashboard.",
          UNAUTHORIZED: "Server didn't recognise the auth header \u2014 make sure you copied the whole key.",
          AUTH_LOCKOUT: "Too many failed attempts from this IP. Wait a few minutes and try again.",
          WORKSPACE_NOT_ALLOWED: `This key isn't authorised for the workspace ID below. Pick a different workspace, or generate a new key without workspace scoping.`,
          FORBIDDEN: detail.message || "Key is missing the required permissions."
        };
        const headline = detail.code && headlineByCode[detail.code] || `Server rejected the key (${status}).`;
        badgeEl.createEl("span", {
          text: `\u2717 ${headline}`,
          cls: "cortex-cloud-status-head"
        });
        if (detail.code || detail.message) {
          badgeEl.createEl("span", {
            text: `${detail.code ? `[${detail.code}] ` : ""}${detail.message ?? ""}`.trim(),
            cls: "cortex-cloud-status-sub"
          });
        }
      } else if (status >= 500) {
        badgeEl.createEl("span", {
          text: `\u2717 Server error (${status}) \u2014 try again in a moment.`,
          cls: "cortex-cloud-status-head"
        });
      } else {
        badgeEl.createEl("span", {
          text: `\u2717 ${msg.slice(0, 240) || "Validation failed"}`,
          cls: "cortex-cloud-status-head"
        });
      }
    }
  }
  /** Render the happy-path identity badge given a successful whoami response. */
  renderWhoamiSuccess(badgeEl, info, workspaceId) {
    badgeEl.addClass("is-valid");
    const headParts = ["\u2713"];
    if (info.email) headParts.push(info.email);
    else if (info.name) headParts.push(info.name);
    else headParts.push("Authenticated");
    if (info.keyPrefix) headParts.push(`(${info.keyPrefix}\u2026)`);
    badgeEl.createEl("span", { text: headParts.join(" "), cls: "cortex-cloud-status-head" });
    const subParts = [];
    if (info.lastUsedAt) {
      const ago = relativeTimestamp(info.lastUsedAt);
      if (ago) subParts.push(`Last used ${ago}`);
    }
    if (typeof info.totalRequests === "number") {
      subParts.push(`${info.totalRequests.toLocaleString()} requests`);
    }
    if (subParts.length > 0) {
      badgeEl.createEl("span", { text: subParts.join(" \xB7 "), cls: "cortex-cloud-status-sub" });
    }
    if (!workspaceId) {
      badgeEl.addClass("is-warn");
      badgeEl.createEl("span", {
        cls: "cortex-cloud-status-sub",
        text: "\u26A0 Workspace ID is empty \u2014 set it below to enable sync and ask."
      });
    } else if (info.allowedWorkspaceIds && !info.allowedWorkspaceIds.includes(workspaceId)) {
      badgeEl.addClass("is-warn");
      badgeEl.createEl("span", {
        cls: "cortex-cloud-status-sub",
        text: `\u26A0 This key isn't authorized for workspace ${workspaceId.slice(0, 16)}\u2026`
      });
    }
  }
  /**
   * Smoke-test a provider key via the local cortex-api's `/v1/system/test-provider`
   * endpoint. Falls back to a direct provider call when the endpoint isn't available.
   */
  async testProviderKey(provider, apiKey) {
    const apiUrl = this.plugin.settings.apiUrl.replace(/\/$/, "");
    try {
      const res = await (0, import_obsidian6.requestUrl)({
        url: `${apiUrl}/v1/system/test-provider`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.plugin.settings.apiKey}`
        },
        body: JSON.stringify({ provider, apiKey }),
        throw: false
      });
      if (res.status >= 200 && res.status < 300) return true;
      if (res.status !== 404) return false;
    } catch {
    }
    return await directProviderProbe(provider, apiKey);
  }
  /**
   * Probe a Cortex API URL and report reachability. Distinguishes:
   *   ok (200) | degraded (503) | reachable-but-non-/health | unreachable
   */
  async checkLocalHealth(url) {
    const cleanUrl = url.replace(/\/$/, "");
    const healthResult = await this.probe(`${cleanUrl}/health`);
    if (healthResult.kind === "ok") {
      this.lastHealthDetail = `Connected to ${cleanUrl}`;
      return true;
    }
    if (healthResult.kind === "http") {
      if (healthResult.status === 503) {
        this.lastHealthDetail = `Container reachable but degraded (503). Check Docker logs.`;
        return true;
      }
      this.lastHealthDetail = `Container reachable (${healthResult.status} from /health).`;
      return true;
    }
    const rootResult = await this.probe(cleanUrl);
    if (rootResult.kind !== "network") {
      this.lastHealthDetail = `Container reachable at ${cleanUrl} (no /health endpoint).`;
      return true;
    }
    this.lastHealthDetail = `Cannot reach ${cleanUrl} \u2014 ${healthResult.error}`;
    return false;
  }
  async probe(url) {
    try {
      const res = await Promise.race([
        (0, import_obsidian6.requestUrl)({ url, method: "GET", throw: false }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("timeout after 5s")), 5e3)
        )
      ]);
      if (res.status >= 200 && res.status < 400) return { kind: "ok", status: res.status };
      return { kind: "http", status: res.status };
    } catch (e) {
      return { kind: "network", error: e.message || "connection refused" };
    }
  }
};
function buildDockerComposeWithKeys(s) {
  const base = buildDockerCompose(s.apiKey, s.connectorEncryptionKey, s.embeddingPreset || "gemini");
  const pairs = [
    ["GEMINI_API_KEY", s.llmKeys.gemini],
    ["OPENAI_API_KEY", s.llmKeys.openai],
    ["ANTHROPIC_API_KEY", s.llmKeys.anthropic],
    ["MOONSHOT_API_KEY", s.llmKeys.moonshot],
    ["HF_TOKEN", s.llmKeys.huggingface],
    ["OPENROUTER_API_KEY", s.llmKeys.openrouter],
    ["XAI_API_KEY", s.llmKeys.xai]
  ];
  let out = base;
  for (const [envName, value] of pairs) {
    if (!value) continue;
    const escaped = envName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped}: )\\$\\{${escaped}:-\\}`, "g");
    out = out.replace(re, `$1"${value.replace(/"/g, '\\"')}"`);
  }
  return out;
}
function restartHint(agentId) {
  switch (agentId) {
    case "claude-desktop":
      return "Restart Claude Desktop to activate.";
    case "claude-code":
      return "Reload Claude Code (or open a new session) to pick up the change.";
    case "cursor":
      return "Restart Cursor to pick up the new MCP server.";
    case "cline":
      return "Reload the VS Code window to refresh Cline's MCP servers.";
    case "windsurf":
      return "Restart Windsurf to pick up the new MCP server.";
    default:
      return "";
  }
}
function parseStatusFromErrorMessage(msg) {
  const m = msg.match(/→ (\d{3}):/);
  return m ? parseInt(m[1], 10) : 0;
}
function parseServerErrorDetail(msg) {
  const m = msg.match(/→ \d{3}: (.*)$/s);
  if (!m) return {};
  try {
    const body = JSON.parse(m[1]);
    return {
      code: body?.error?.code || body?.code,
      message: body?.error?.message || body?.message
    };
  } catch {
    return { message: m[1].slice(0, 240) };
  }
}
function relativeTimestamp(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const ms = Date.now() - t;
  if (ms < 0) return "just now";
  const sec = Math.floor(ms / 1e3);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(month / 12)}y ago`;
}
function maskKey(k) {
  if (!k) return "";
  if (k.length <= 12) return "\xB7".repeat(k.length);
  return `${k.slice(0, 6)}\xB7\xB7\xB7\xB7${k.slice(-4)}`;
}
async function directProviderProbe(provider, apiKey) {
  const headers = { "Authorization": `Bearer ${apiKey}` };
  let url;
  switch (provider) {
    case "gemini":
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      delete headers.Authorization;
      break;
    case "openai":
      url = "https://api.openai.com/v1/models";
      break;
    case "anthropic":
      return await probeAnthropic(apiKey);
    case "moonshot":
      url = "https://api.moonshot.ai/v1/models";
      break;
    case "huggingface":
      url = "https://huggingface.co/api/whoami-v2";
      break;
    case "openrouter":
      url = "https://openrouter.ai/api/v1/models";
      break;
    case "xai":
      url = "https://api.x.ai/v1/models";
      break;
    default:
      return false;
  }
  try {
    const res = await (0, import_obsidian6.requestUrl)({ url, method: "GET", headers, throw: false });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}
async function probeAnthropic(apiKey) {
  try {
    const res = await (0, import_obsidian6.requestUrl)({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }]
      }),
      throw: false
    });
    return res.status === 200 || res.status === 400;
  } catch {
    return false;
  }
}

// src/services/vault-sync.ts
var import_obsidian7 = require("obsidian");
var INDEX_PATH = ".cortex/index.json";
var ATTACHMENT_RE = /!\[\[([^\]|#]+\.(?:png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm))(?:[|#][^\]]*)?\]\]|!\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm))\)/gi;
var MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm"
};
var VaultSync = class {
  constructor(app, client, settings) {
    this.app = app;
    this.client = client;
    this.settings = settings;
    this.index = emptyIndex();
    this.debounceTimers = /* @__PURE__ */ new Map();
    this.indexLoaded = false;
    this.indexWriteQueue = Promise.resolve();
  }
  // ---------- Index I/O ------------------------------------------------
  async loadIndex() {
    if (this.indexLoaded) return;
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(INDEX_PATH)) {
        const raw = JSON.parse(await adapter.read(INDEX_PATH));
        this.index = mergeIndex(raw, this.settings.vaultId);
      } else {
        this.index = emptyIndex(this.settings.vaultId);
      }
    } catch (e) {
      console.warn("[Cortex] Failed to load sync index, starting fresh:", e);
      this.index = emptyIndex(this.settings.vaultId);
    }
    this.indexLoaded = true;
  }
  /** Serialised so concurrent syncFile calls don't clobber each other. */
  async saveIndex() {
    this.indexWriteQueue = this.indexWriteQueue.then(async () => {
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(".cortex")) {
        await adapter.mkdir(".cortex");
      }
      await adapter.write(INDEX_PATH, JSON.stringify(this.index, null, 2));
    }).catch((e) => {
      console.warn("[Cortex] saveIndex failed", e);
    });
    return this.indexWriteQueue;
  }
  /**
   * Wipe the per-file hash + state index, forcing the next sync to re-push
   * every file. Used when the server-side graph has been reset (e.g. Postgres
   * volume dropped) — the index would otherwise think files are already synced.
   */
  async clearIndex() {
    await this.loadIndex();
    this.index = emptyIndex(this.settings.vaultId);
    await this.saveIndex();
  }
  // ---------- Path filtering ------------------------------------------
  isExcluded(path) {
    const cortexOutputFolders = [
      this.settings.chatExportFolder,
      this.settings.memoryFolder
    ].filter((f) => !!f && f.length > 0);
    if (cortexOutputFolders.some((f) => path.startsWith(f))) return true;
    if (this.settings.excludePatterns.some((p) => p && path.startsWith(p))) return true;
    const includes = this.settings.includeFolders.filter(Boolean);
    if (includes.length > 0 && !includes.some((p) => path.startsWith(p))) return true;
    return false;
  }
  // ---------- Hashing -------------------------------------------------
  async hashContent(content) {
    const buf = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async hashBytes(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // ---------- Full sync -----------------------------------------------
  async fullSync(opts) {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const files = all.filter((f) => !this.isExcluded(f.path));
    const total = files.length;
    const onProgress = opts?.onProgress;
    const signal = opts?.signal;
    let synced = 0, skipped = 0, deleted = 0;
    let failed = 0;
    const failedPaths = [];
    const seenPaths = /* @__PURE__ */ new Set();
    const SYNC_CONCURRENCY = 6;
    onProgress?.({ phase: "sync", done: 0, total });
    let cursor = 0;
    let done = 0;
    const worker = async () => {
      while (true) {
        if (signal?.aborted) return;
        const idx = cursor++;
        if (idx >= files.length) return;
        const file = files[idx];
        seenPaths.add(file.path);
        try {
          const result = await this.syncFile(
            file,
            /* persistImmediately */
            false
          );
          if (result === "synced") synced++;
          else if (result === "unchanged") skipped++;
        } catch (e) {
          failed++;
          failedPaths.push(file.path);
          console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
        }
        done++;
        onProgress?.({ phase: "sync", done, total, currentPath: file.path });
      }
    };
    const workerCount = Math.min(SYNC_CONCURRENCY, files.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    if (signal?.aborted) {
      this.index.lastFullSyncAt = Date.now();
      await this.saveIndex();
      return { synced, skipped, deleted: 0, failed, failedPaths, paused: "cancelled" };
    }
    const known = /* @__PURE__ */ new Set([
      ...Object.keys(this.index.hashes),
      ...Object.keys(this.index.files)
    ]);
    const deletionCandidates = [...known].filter((p) => !seenPaths.has(p) && !this.isExcluded(p));
    onProgress?.({ phase: "delete", done: 0, total: deletionCandidates.length });
    const DELETE_CONCURRENCY = 6;
    let dCursor = 0;
    let dDone = 0;
    const deleteWorker = async () => {
      while (true) {
        if (signal?.aborted) return;
        const idx = dCursor++;
        if (idx >= deletionCandidates.length) return;
        const knownPath = deletionCandidates[idx];
        try {
          await this.client.deleteNote(knownPath);
          delete this.index.hashes[knownPath];
          delete this.index.files[knownPath];
          delete this.index.attachments[knownPath];
          deleted++;
        } catch (e) {
          console.warn(`[Cortex] Delete failed for ${knownPath}:`, e);
        }
        dDone++;
        onProgress?.({ phase: "delete", done: dDone, total: deletionCandidates.length, currentPath: knownPath });
      }
    };
    if (deletionCandidates.length > 0) {
      await Promise.all(Array.from(
        { length: Math.min(DELETE_CONCURRENCY, deletionCandidates.length) },
        () => deleteWorker()
      ));
    }
    this.index.lastFullSyncAt = Date.now();
    await this.saveIndex();
    return { synced, skipped, deleted, failed, failedPaths };
  }
  // ---------- Single-file sync ----------------------------------------
  /**
   * Per-file event handler with debouncing. Triggered from main.ts.
   */
  scheduleFileSync(file) {
    if (!(file instanceof import_obsidian7.TFile) || file.extension !== "md") return;
    if (this.isExcluded(file.path)) return;
    const existing = this.debounceTimers.get(file.path);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(file.path);
      try {
        await this.syncFile(file);
      } catch (e) {
        console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
      }
    }, this.settings.autoSyncDebounceMs);
    this.debounceTimers.set(file.path, timer);
  }
  /**
   * Returns 'synced' | 'unchanged' | 'skipped'. If `persistImmediately` is
   * false, the caller is responsible for calling saveIndex().
   */
  async syncFile(file, persistImmediately = true) {
    await this.loadIndex();
    const content = await this.app.vault.cachedRead(file);
    const body = stripFrontmatter(content).trim();
    if (body.length === 0) return "skipped";
    const hash = await this.hashContent(content);
    const prior = this.getFileState(file.path);
    if (prior && prior.hash === hash) return "unchanged";
    try {
      await this.client.ingestNote(file.path, content);
    } catch (e) {
      throw e;
    }
    const now = Date.now();
    const next = {
      hash,
      hashedAt: now,
      ingestCount: (prior?.ingestCount ?? 0) + 1,
      lastIngestAt: now
    };
    this.index.files[file.path] = next;
    this.index.hashes[file.path] = hash;
    if (this.settings.syncAttachments) {
      try {
        await this.syncAttachmentsFor(file, content);
      } catch (e) {
        console.warn("[Cortex] attachment sync failed", e);
      }
    }
    if (persistImmediately) await this.saveIndex();
    return "synced";
  }
  async handleDelete(file) {
    if (!(file instanceof import_obsidian7.TFile) || file.extension !== "md") return;
    await this.loadIndex();
    if (!this.index.files[file.path] && !this.index.hashes[file.path]) return;
    try {
      await this.client.deleteNote(file.path);
    } catch (e) {
      console.warn(`[Cortex] Delete failed for ${file.path}:`, e);
      return;
    }
    delete this.index.files[file.path];
    delete this.index.hashes[file.path];
    delete this.index.attachments[file.path];
    await this.saveIndex();
  }
  async handleRename(file, oldPath) {
    if (!(file instanceof import_obsidian7.TFile) || file.extension !== "md") return;
    await this.loadIndex();
    if (this.index.files[oldPath] || this.index.hashes[oldPath]) {
      try {
        await this.client.deleteNote(oldPath);
      } catch {
      }
      delete this.index.files[oldPath];
      delete this.index.hashes[oldPath];
    }
    this.scheduleFileSync(file);
  }
  // ---------- Attachments ---------------------------------------------
  async syncAttachmentsFor(noteFile, content) {
    const refs = extractAttachmentRefs(content);
    if (refs.length === 0) return;
    for (const ref of refs) {
      const target = this.resolveAttachment(noteFile, ref);
      if (!target) continue;
      if (this.isExcluded(target.path)) continue;
      const stat = await this.app.vault.adapter.stat(target.path);
      if (!stat || stat.size === 0) continue;
      if (stat.size > this.settings.attachmentMaxBytes) {
        console.warn(`[Cortex] skipping ${target.path} \u2014 ${stat.size} > attachmentMaxBytes`);
        continue;
      }
      const bytes = await this.app.vault.readBinary(target);
      const hash = await this.hashBytes(bytes);
      const known = this.index.attachments[target.path];
      const fileState = this.index.files[target.path];
      if (known && fileState?.hash === hash) continue;
      const ext = target.extension.toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (!mime) continue;
      const base64 = arrayBufferToBase64(bytes);
      if (base64.length === 0) continue;
      try {
        await this.client.ingestBinary(target.path, mime, base64);
        this.index.attachments[target.path] = Date.now();
        this.index.files[target.path] = {
          hash,
          hashedAt: Date.now(),
          ingestCount: (fileState?.ingestCount ?? 0) + 1,
          lastIngestAt: Date.now()
        };
      } catch (e) {
        console.warn(`[Cortex] attachment ingest failed for ${target.path}`, e);
      }
    }
  }
  resolveAttachment(sourceFile, ref) {
    const meta = this.app.metadataCache.getFirstLinkpathDest(ref, sourceFile.path);
    if (meta instanceof import_obsidian7.TFile) return meta;
    const abs = this.app.vault.getAbstractFileByPath(ref);
    if (abs instanceof import_obsidian7.TFile) return abs;
    const sib = this.app.vault.getAbstractFileByPath(
      (0, import_obsidian7.normalizePath)(`${sourceFile.parent?.path ?? ""}/${ref}`)
    );
    return sib instanceof import_obsidian7.TFile ? sib : null;
  }
  // ---------- Misc ----------------------------------------------------
  getFileState(path) {
    const rich = this.index.files[path];
    if (rich) return rich;
    const legacy = this.index.hashes[path];
    if (legacy) {
      return { hash: legacy, hashedAt: 0, ingestCount: 0 };
    }
    return null;
  }
};
function stripFrontmatter(content) {
  if (!content.startsWith("---")) return content;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return content;
  const after = content.slice(end + 4);
  return after.startsWith("\n") ? after.slice(1) : after;
}
function emptyIndex(vaultId = "") {
  return {
    hashes: {},
    files: {},
    attachments: {},
    vaultId
  };
}
function mergeIndex(raw, vaultId) {
  return {
    hashes: raw?.hashes ?? {},
    files: raw?.files ?? {},
    attachments: raw?.attachments ?? {},
    vaultId: raw?.vaultId ?? vaultId,
    lastFullSyncAt: raw?.lastFullSyncAt
  };
}
function extractAttachmentRefs(markdown) {
  const refs = [];
  let m;
  ATTACHMENT_RE.lastIndex = 0;
  while ((m = ATTACHMENT_RE.exec(markdown)) !== null) {
    const ref = (m[1] ?? m[2] ?? "").trim();
    if (ref) refs.push(ref);
  }
  return Array.from(new Set(refs));
}
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

// src/services/conversation-store.ts
var FILENAME = "conversations.json";
var MAX_CONVERSATIONS = 50;
var ConversationStore = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.cache = {};
    this.loaded = false;
  }
  get filePath() {
    const dir = this.plugin.manifest.dir ?? `.obsidian/plugins/${this.plugin.manifest.id}`;
    return `${dir}/${FILENAME}`;
  }
  async ensureLoaded() {
    if (this.loaded) return;
    const adapter = this.plugin.app.vault.adapter;
    if (await adapter.exists(this.filePath)) {
      try {
        const raw = await adapter.read(this.filePath);
        this.cache = JSON.parse(raw);
      } catch (e) {
        console.warn("[Cortex] Failed to read conversations:", e);
        this.cache = {};
      }
    }
    this.loaded = true;
  }
  async persist() {
    const adapter = this.plugin.app.vault.adapter;
    await adapter.write(this.filePath, JSON.stringify(this.cache));
  }
  async list() {
    await this.ensureLoaded();
    return Object.values(this.cache).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  async get(id) {
    await this.ensureLoaded();
    return this.cache[id];
  }
  async upsert(conversation) {
    await this.ensureLoaded();
    this.cache[conversation.id] = conversation;
    this.pruneIfNeeded();
    await this.persist();
  }
  async delete(id) {
    await this.ensureLoaded();
    delete this.cache[id];
    await this.persist();
  }
  async clear() {
    await this.ensureLoaded();
    this.cache = {};
    await this.persist();
  }
  pruneIfNeeded() {
    const ids = Object.keys(this.cache);
    if (ids.length <= MAX_CONVERSATIONS) return;
    const sorted = ids.map((id) => ({ id, updatedAt: this.cache[id].updatedAt })).sort((a, b) => a.updatedAt - b.updatedAt);
    const drop = sorted.length - MAX_CONVERSATIONS;
    for (let i = 0; i < drop; i++) delete this.cache[sorted[i].id];
  }
};
function deriveConversationTitle(firstUserMessage) {
  const stripped = firstUserMessage.replace(/\s+/g, " ").trim();
  return stripped.length > 60 ? stripped.slice(0, 57) + "\u2026" : stripped;
}
function relativeTime(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1e3);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(void 0, { month: "short", day: "numeric" });
}

// src/views/related-view.ts
var import_obsidian8 = require("obsidian");
var RELATED_VIEW_TYPE = "cortex-related-view";
var RelatedView = class extends import_obsidian8.ItemView {
  constructor(leaf, client) {
    super(leaf);
    this.client = client;
    this.currentFile = null;
    this.currentEntityId = null;
    this.listEl = null;
  }
  getViewType() {
    return RELATED_VIEW_TYPE;
  }
  getDisplayText() {
    return "HangarX: Related";
  }
  getIcon() {
    return "network";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("cortex-related-container");
    container.createEl("h4", { text: "Related notes" });
    this.listEl = container.createEl("div", { cls: "cortex-related-list" });
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refresh())
    );
    await this.refresh();
  }
  async refresh() {
    if (!this.listEl) return;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian8.MarkdownView);
    if (!view?.file) {
      this.currentFile = null;
      this.currentEntityId = null;
      this.listEl.empty();
      this.listEl.createEl("p", {
        text: "Open a note to see related results.",
        cls: "cortex-empty-state"
      });
      return;
    }
    if (this.currentFile?.path === view.file.path) return;
    this.currentFile = view.file;
    this.currentEntityId = null;
    this.listEl.empty();
    this.listEl.createEl("p", { text: "Loading\u2026", cls: "cortex-loading" });
    try {
      const results = await this.client.related(view.file.basename, 10);
      this.listEl.empty();
      if (results.length === 0) {
        this.listEl.createEl("p", { text: "No related notes found.", cls: "cortex-empty-state" });
        return;
      }
      for (const r of results) this.renderResult(r);
    } catch (e) {
      this.listEl.empty();
      this.listEl.createEl("p", { text: `Error: ${e.message}`, cls: "cortex-error" });
    }
  }
  renderResult(r) {
    if (!this.listEl) return;
    const row = this.listEl.createEl("div", { cls: "cortex-related-row" });
    const header = row.createEl("div", { cls: "cortex-related-header" });
    const link = header.createEl("a", {
      text: r.noteName,
      cls: `cortex-related-link cortex-source-${r.source}`
    });
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const target = this.app.metadataCache.getFirstLinkpathDest(r.noteName, "");
      if (target) this.app.workspace.getLeaf(false).openFile(target);
    });
    const sourceBadge = header.createEl("span", {
      text: r.source,
      cls: `cortex-related-badge cortex-source-${r.source}`
    });
    sourceBadge.setAttr("title", `Match source: ${r.source}`);
    const score = header.createEl("span", { text: r.score.toFixed(2), cls: "cortex-related-score" });
    score.setAttr("title", "Relevance score");
    if (r.snippet) row.createEl("p", { text: r.snippet, cls: "cortex-snippet" });
    if (r.entityId) {
      const whyBtn = row.createEl("button", { cls: "cortex-why-btn" });
      const icon = whyBtn.createEl("span", { cls: "cortex-why-icon" });
      (0, import_obsidian8.setIcon)(icon, "route");
      whyBtn.createEl("span", { text: "Why are these related?" });
      const pathEl = row.createEl("div", { cls: "cortex-paths", attr: { "aria-hidden": "true" } });
      pathEl.style.display = "none";
      whyBtn.addEventListener("click", () => this.togglePath(r, whyBtn, pathEl));
    }
  }
  async togglePath(r, btn, pathEl) {
    const isOpen = pathEl.style.display !== "none";
    if (isOpen) {
      pathEl.style.display = "none";
      pathEl.setAttr("aria-hidden", "true");
      return;
    }
    pathEl.style.display = "";
    pathEl.setAttr("aria-hidden", "false");
    if (pathEl.dataset.loaded === "1") return;
    pathEl.empty();
    pathEl.createEl("span", { text: "Tracing graph paths\u2026", cls: "cortex-loading" });
    try {
      const sourceId = await this.resolveSelfEntityId();
      if (!sourceId || !r.entityId) {
        pathEl.empty();
        pathEl.createEl("span", { text: "Cannot resolve graph anchor for this note.", cls: "cortex-error" });
        return;
      }
      const paths = await this.client.findPaths(sourceId, r.entityId, 4);
      pathEl.empty();
      if (paths.length === 0) {
        pathEl.createEl("span", { text: "No direct path found in the graph.", cls: "cortex-empty-state" });
      } else {
        for (const p of paths.slice(0, 3)) this.renderPath(pathEl, p);
      }
      pathEl.dataset.loaded = "1";
      btn.addClass("is-open");
    } catch (e) {
      pathEl.empty();
      pathEl.createEl("span", { text: `Error: ${e.message}`, cls: "cortex-error" });
    }
  }
  renderPath(parent, path) {
    const wrap = parent.createEl("div", { cls: "cortex-path" });
    if (path.steps.length === 0) {
      wrap.createEl("span", { text: "Direct match.", cls: "cortex-empty-state" });
      return;
    }
    wrap.createEl("span", { text: path.steps[0].fromName, cls: "cortex-path-node" });
    for (const s of path.steps) {
      wrap.createEl("span", { text: ` \u2014${humanRel(s.relType)}\u2192 `, cls: "cortex-path-rel" });
      wrap.createEl("span", { text: s.toName, cls: "cortex-path-node" });
    }
  }
  /** Resolve the entity ID for the currently-open note. Cached per refresh. */
  async resolveSelfEntityId() {
    if (this.currentEntityId) return this.currentEntityId;
    if (!this.currentFile) return "";
    const fmId = this.app.metadataCache.getFileCache(this.currentFile)?.frontmatter?.cortex_id;
    if (typeof fmId === "string" && fmId.length > 0) {
      this.currentEntityId = fmId;
      return fmId;
    }
    const name = this.currentFile.basename;
    const hits = await this.client.searchEntitiesByName(name, 5);
    const exact = hits.find((h) => h.name === name) ?? hits[0];
    this.currentEntityId = exact?.id ?? "";
    return this.currentEntityId;
  }
};
function humanRel(rel) {
  return rel.replace(/_/g, " ").toLowerCase();
}

// src/views/chat-modal.ts
var import_obsidian9 = require("obsidian");
init_vault_writer();

// src/services/error-format.ts
var PATTERNS = [
  {
    match: /\b(401|UNAUTHORIZED|AUTH_ERROR|INVALID_API_KEY|invalid bearer)\b/i,
    kind: "auth",
    headline: "Authentication failed",
    hint: "Open Settings \u2192 HangarX. In Local mode, the plugin's API key must match LOCAL_API_KEY in the running container \u2014 if you just clicked Regenerate, click Save to vault and rebuild the container with `docker compose -f docker-compose.cortex.yml up -d --force-recreate`."
  },
  {
    match: /\b403\b|forbidden|WORKSPACE_NOT_ALLOWED/i,
    kind: "auth",
    headline: "Access denied",
    hint: "Your API key isn't scoped to this workspace. Use a key with access, or switch workspaces."
  },
  {
    match: /\b404\b|NOT_FOUND/i,
    kind: "not_found",
    headline: "Resource not found",
    hint: "The endpoint or entity doesn't exist. If you just synced, give it a few seconds and retry."
  },
  {
    match: /\b429\b|rate.?limit|too many requests/i,
    kind: "rate_limit",
    headline: "Rate limited",
    hint: "HangarX is throttling requests. Wait ~30s and try again."
  },
  {
    match: /\b(5\d\d)\b|INTERNAL|EAI_AGAIN/i,
    kind: "server",
    headline: "HangarX server error",
    hint: "Check the cortex-api logs (`docker logs cortex-api`) for the underlying cause."
  },
  {
    match: /ERR_NAME_NOT_RESOLVED|ENOTFOUND|getaddrinfo/i,
    kind: "network",
    headline: "Hostname not found",
    hint: "The API hostname couldn't be resolved. Check Settings \u2192 Connection \u2192 API URL \u2014 typo, wrong domain (.com vs .ai), or DNS issue. In Local mode the URL should be http://localhost:3400."
  },
  {
    match: /econnrefused|ECONNREFUSED/i,
    kind: "network",
    headline: "Connection refused",
    hint: "Nothing is listening on that port. In Local mode, run `docker compose ps` to confirm containers are up; check the port matches your compose file."
  },
  {
    match: /ERR_INTERNET_DISCONNECTED|ENETUNREACH/i,
    kind: "network",
    headline: "No internet connection",
    hint: "Your network is offline. Reconnect, or switch to Local mode if you have the Docker stack running."
  },
  {
    match: /ERR_CERT|ssl|TLS|certificate/i,
    kind: "network",
    headline: "TLS/certificate error",
    hint: "The server's certificate is invalid or expired. If you trust this host, you may need to update it; otherwise contact the API administrator."
  },
  {
    match: /fetch failed|network error|timeout|aborted|ETIMEDOUT/i,
    kind: "network",
    headline: "Cannot reach HangarX",
    hint: "The API isn't responding. In Local mode, run `docker compose ps` to confirm containers are up. Otherwise check your internet connection."
  },
  {
    match: /\b(400|VALIDATION_ERROR|ZodError|invalid input)\b/i,
    kind: "validation",
    headline: "Invalid request",
    hint: "The request body wasn't accepted. This is usually a plugin bug \u2014 please report."
  },
  {
    match: /aborted|cancelled|user cancelled/i,
    kind: "cancelled",
    headline: "Cancelled"
  }
];
function formatError(err, contextHeadline) {
  const detail = err instanceof Error ? err.message : String(err);
  for (const p of PATTERNS) {
    if (p.match.test(detail)) {
      return {
        kind: p.kind,
        headline: contextHeadline ?? p.headline,
        detail,
        hint: p.hint
      };
    }
  }
  return {
    kind: "unknown",
    headline: contextHeadline ?? "Something went wrong",
    detail
  };
}
function errorIcon(kind) {
  switch (kind) {
    case "auth":
      return "lock";
    case "network":
      return "wifi-off";
    case "not_found":
      return "help-circle";
    case "rate_limit":
      return "timer";
    case "server":
      return "server-crash";
    case "validation":
      return "alert-octagon";
    case "cancelled":
      return "circle-slash";
    default:
      return "alert-triangle";
  }
}

// src/assets.ts
var HANGARX_LOGO_SVG = `<svg width="108" height="25" viewBox="0 0 108 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HangarX">
<path d="M95.0274 17.8333L100.035 12.5374L95.0068 7.2002H97.3972L101.23 11.2597L105.022 7.2002H107.433L102.425 12.5168L107.392 17.8333H105.001L101.209 13.815L97.4178 17.8333H95.0274Z" fill="currentColor"/>
<path d="M88.6416 17.8323V7.57007H89.6719V9.98107C89.8505 9.21175 90.2421 8.60728 90.8465 8.16767C91.451 7.71432 92.1585 7.44643 92.969 7.364C93.3812 7.32279 93.807 7.33653 94.2467 7.40522C94.6863 7.46017 95.1328 7.57007 95.5861 7.73493V8.88891C95.3388 8.77901 94.9748 8.67597 94.4939 8.57981C94.0269 8.48364 93.5941 8.43556 93.1957 8.43556C92.5775 8.43556 92.0417 8.54546 91.5884 8.76527C91.1488 8.98507 90.7847 9.28731 90.4962 9.67197C90.2077 10.0429 89.9948 10.4825 89.8574 10.9908C89.7338 11.4991 89.6719 12.0418 89.6719 12.6187V17.8323H88.6416Z" fill="currentColor"/>
<path d="M86.4764 17.8325V15.5864C86.3253 15.9298 86.1124 16.2458 85.8376 16.5343C85.5628 16.8091 85.24 17.0495 84.8691 17.2555C84.5119 17.4616 84.1204 17.6333 83.6945 17.7707C83.2686 17.8944 82.8359 17.9768 82.3962 18.018C81.7643 18.1004 81.1324 18.0936 80.5004 17.9974C79.8822 17.915 79.319 17.7432 78.8107 17.4822C78.3161 17.2075 77.9177 16.8434 77.6155 16.3901C77.3132 15.9367 77.1621 15.3803 77.1621 14.7209C77.1621 14.0752 77.2995 13.56 77.5742 13.1754C77.8627 12.777 78.2268 12.4748 78.6664 12.2687C79.1198 12.0626 79.6075 11.9252 80.1295 11.8565C80.6653 11.7879 81.1736 11.7535 81.6544 11.7535H85.7552C86.0711 11.7535 86.2635 11.678 86.3322 11.5268C86.4146 11.3757 86.4558 11.1903 86.4558 10.9705C86.4558 10.3935 86.3322 9.94011 86.0849 9.6104C85.8513 9.26696 85.5422 9.00594 85.1576 8.82734C84.7866 8.64875 84.3676 8.53198 83.9005 8.47703C83.4472 8.42208 82.9938 8.3946 82.5405 8.3946C82.252 8.3946 81.8879 8.42894 81.4483 8.49763C81.0087 8.55259 80.5828 8.66249 80.1707 8.82734C79.7723 8.9922 79.4289 9.21887 79.1404 9.50737C78.8519 9.79587 78.7076 10.1805 78.7076 10.6614H77.6773C77.6773 10.0569 77.8147 9.54858 78.0894 9.13645C78.3779 8.71057 78.7557 8.36712 79.2228 8.1061C79.6899 7.84508 80.2119 7.65962 80.7889 7.54972C81.3659 7.42608 81.9498 7.36426 82.5405 7.36426C83.2549 7.36426 83.9143 7.42608 84.5188 7.54972C85.1232 7.65962 85.6453 7.85195 86.0849 8.12671C86.5245 8.40147 86.8679 8.77239 87.1152 9.23948C87.3625 9.70657 87.4861 10.2904 87.4861 10.9911V17.8325H86.4764ZM86.4558 13.7112V12.619H81.6956C81.1049 12.619 80.5897 12.6602 80.1501 12.7426C79.7105 12.8251 79.3464 12.9487 79.0579 13.1136C78.7832 13.2784 78.5771 13.4914 78.4397 13.7524C78.3024 14.0134 78.2337 14.3225 78.2337 14.6797C78.2337 14.9957 78.3092 15.2979 78.4603 15.5864C78.6115 15.8749 78.8244 16.129 79.0992 16.3488C79.3877 16.5686 79.738 16.7472 80.1501 16.8846C80.5622 17.0083 81.0293 17.0769 81.5514 17.0907C82.1284 17.1044 82.7053 17.0426 83.2823 16.9052C83.8731 16.7541 84.402 16.5412 84.8691 16.2664C85.3362 15.9916 85.7208 15.6551 86.0231 15.2567C86.3253 14.8445 86.4764 14.3775 86.4764 13.8554V13.7112H86.4558Z" fill="currentColor"/>
<path d="M65.4754 19.275H66.4852C66.6088 19.6871 66.7943 20.0237 67.0415 20.2847C67.3026 20.5595 67.6117 20.7793 67.9689 20.9442C68.326 21.109 68.7382 21.2258 69.2053 21.2945C69.6724 21.3632 70.1807 21.3975 70.7302 21.3975C71.3758 21.3975 71.9666 21.3014 72.5024 21.109C73.0381 20.9167 73.4984 20.6625 73.883 20.3466C74.2677 20.0306 74.563 19.6597 74.7691 19.2338C74.9889 18.8217 75.0988 18.3889 75.0988 17.9356V15.2361C74.8241 15.7032 74.5081 16.1153 74.1509 16.4725C73.7937 16.8159 73.4091 17.1044 72.9969 17.338C72.5848 17.5715 72.152 17.7432 71.6987 17.8531C71.2591 17.9768 70.8057 18.0386 70.3386 18.0386C69.5006 18.0386 68.745 17.9012 68.0719 17.6265C67.4125 17.3517 66.8423 16.9739 66.3615 16.4931C65.8944 16.0123 65.5304 15.449 65.2694 14.8033C65.0221 14.1576 64.8984 13.4639 64.8984 12.722C64.8984 11.9802 65.0221 11.2864 65.2694 10.6407C65.5304 9.98133 65.8944 9.4112 66.3615 8.93038C66.8423 8.44955 67.4125 8.07176 68.0719 7.797C68.7313 7.50851 69.4663 7.36426 70.2768 7.36426C70.9225 7.36426 71.4995 7.43295 72.0078 7.57033C72.5161 7.69397 72.9626 7.87256 73.3472 8.1061C73.7456 8.33965 74.0822 8.62814 74.357 8.97159C74.6455 9.3013 74.8928 9.67222 75.0988 10.0844V7.57033H76.1292V17.8325C76.1292 18.4645 75.9987 19.0552 75.7376 19.6047C75.4766 20.1542 75.1057 20.6351 74.6249 21.0472C74.1578 21.4593 73.5877 21.789 72.9145 22.0363C72.2413 22.2836 71.4926 22.4141 70.6683 22.4279C70.0089 22.4416 69.377 22.3798 68.7725 22.2424C68.1681 22.1188 67.6254 21.9196 67.1446 21.6448C66.6775 21.3838 66.2928 21.0541 65.9906 20.6557C65.6884 20.2573 65.5166 19.7971 65.4754 19.275ZM65.9288 12.722C65.9288 13.3402 66.0318 13.9104 66.2379 14.4324C66.4577 14.9544 66.7599 15.4078 67.1446 15.7925C67.543 16.1771 68.0169 16.4794 68.5665 16.6992C69.116 16.9052 69.7342 17.0083 70.4211 17.0083C71.108 17.0083 71.7399 16.8846 72.3169 16.6373C72.8939 16.3763 73.3885 16.0397 73.8006 15.6276C74.2127 15.2155 74.5356 14.7484 74.7691 14.2263C75.0027 13.7043 75.1194 13.1823 75.1194 12.6602C75.1194 12.1107 75.0027 11.5681 74.7691 11.0323C74.5356 10.4965 74.2127 10.0226 73.8006 9.61046C73.3885 9.18458 72.8939 8.84801 72.3169 8.60073C71.7399 8.33971 71.108 8.2092 70.4211 8.2092C69.7342 8.2092 69.116 8.33284 68.5665 8.58012C68.0169 8.81366 67.543 9.12277 67.1446 9.50743C66.7599 9.89209 66.4577 10.3523 66.2379 10.8881C66.0318 11.4101 65.9288 11.9802 65.9288 12.5985V12.722Z" fill="currentColor"/>
<path d="M53.5098 17.8331V7.57087H54.5401V9.98187C54.8423 9.4461 55.1995 8.99961 55.6117 8.64243C56.0238 8.28524 56.4703 8.00362 56.9511 7.79755C57.4319 7.59148 57.9471 7.46097 58.4966 7.40602C59.0461 7.35107 59.6025 7.3648 60.1658 7.44723C60.784 7.5434 61.3129 7.71512 61.7525 7.9624C62.1921 8.20968 62.5562 8.51879 62.8447 8.88971C63.1332 9.26063 63.3392 9.70025 63.4629 10.2085C63.6003 10.7031 63.6689 11.2526 63.6689 11.8571V17.8331H62.6386V11.8983C62.6386 11.3351 62.5699 10.8405 62.4325 10.4146C62.3089 9.975 62.1028 9.61095 61.8143 9.32245C61.5258 9.02022 61.148 8.79354 60.6809 8.64243C60.2276 8.47757 59.6643 8.39515 58.9912 8.39515C58.2631 8.39515 57.6243 8.51879 57.0747 8.76607C56.5252 8.99961 56.0581 9.31559 55.6735 9.71398C55.3026 10.1124 55.0209 10.5726 54.8286 11.0946C54.6363 11.6167 54.5401 12.1662 54.5401 12.7432V17.8331H53.5098Z" fill="currentColor"/>
<path d="M51.7782 17.8325V15.5864C51.627 15.9298 51.4141 16.2458 51.1393 16.5343C50.8646 16.8091 50.5417 17.0495 50.1708 17.2555C49.8136 17.4616 49.4221 17.6333 48.9962 17.7707C48.5704 17.8944 48.1376 17.9768 47.698 18.018C47.0661 18.1004 46.4341 18.0936 45.8022 17.9974C45.184 17.915 44.6207 17.7432 44.1124 17.4822C43.6178 17.2075 43.2195 16.8434 42.9172 16.3901C42.615 15.9367 42.4639 15.3803 42.4639 14.7209C42.4639 14.0752 42.6012 13.56 42.876 13.1754C43.1645 12.777 43.5286 12.4748 43.9682 12.2687C44.4215 12.0626 44.9092 11.9252 45.4313 11.8565C45.967 11.7879 46.4753 11.7535 46.9562 11.7535H51.0569C51.3729 11.7535 51.5652 11.678 51.6339 11.5268C51.7163 11.3757 51.7576 11.1903 51.7576 10.9705C51.7576 10.3935 51.6339 9.94011 51.3866 9.6104C51.1531 9.26696 50.844 9.00594 50.4593 8.82734C50.0884 8.64875 49.6694 8.53198 49.2023 8.47703C48.749 8.42208 48.2956 8.3946 47.8423 8.3946C47.5538 8.3946 47.1897 8.42894 46.7501 8.49763C46.3105 8.55259 45.8846 8.66249 45.4725 8.82734C45.0741 8.9922 44.7306 9.21887 44.4421 9.50737C44.1536 9.79587 44.0094 10.1805 44.0094 10.6614H42.979C42.979 10.0569 43.1164 9.54858 43.3912 9.13645C43.6797 8.71057 44.0575 8.36712 44.5246 8.1061C44.9916 7.84508 45.5137 7.65962 46.0907 7.54972C46.6677 7.42608 47.2515 7.36426 47.8423 7.36426C48.5566 7.36426 49.216 7.42608 49.8205 7.54972C50.425 7.65962 50.947 7.85195 51.3866 8.12671C51.8262 8.40147 52.1697 8.77239 52.417 9.23948C52.6643 9.70657 52.7879 10.2904 52.7879 10.9911V17.8325H51.7782ZM51.7576 13.7112V12.619H46.9974C46.4066 12.619 45.8915 12.6602 45.4519 12.7426C45.0122 12.8251 44.6482 12.9487 44.3597 13.1136C44.0849 13.2784 43.8789 13.4914 43.7415 13.7524C43.6041 14.0134 43.5354 14.3225 43.5354 14.6797C43.5354 14.9957 43.611 15.2979 43.7621 15.5864C43.9132 15.8749 44.1262 16.129 44.4009 16.3488C44.6894 16.5686 45.0397 16.7472 45.4519 16.8846C45.864 17.0083 46.3311 17.0769 46.8531 17.0907C47.4301 17.1044 48.0071 17.0426 48.5841 16.9052C49.1748 16.7541 49.7037 16.5412 50.1708 16.2664C50.6379 15.9916 51.0225 15.6551 51.3248 15.2567C51.627 14.8445 51.7782 14.3775 51.7782 13.8554V13.7112H51.7576Z" fill="currentColor"/>
<path d="M29.8008 17.8331V3.98535H30.8929V10.1674H40.743V3.98535H41.8352V17.8331H40.743V11.0947H30.8929V17.8331H29.8008Z" fill="currentColor"/>
<path d="M21.4596 0.706815C21.8103 0.319578 22.2287 0.50116 22.1694 0.706798C21.0788 4.52594 20.1048 7.85098 20.0758 7.95066C19.6441 9.43871 19.6095 10.7833 20.2375 12.2906C20.2889 12.4141 26.1088 24.0506 26.2006 24.2464C26.303 24.4651 25.9225 24.8156 25.4588 24.3149C25.3862 24.2365 13.367 10.491 13.2051 10.3169C13.0433 10.1428 13.1199 10.0913 13.2051 9.99577C13.2904 9.90026 21.251 0.937139 21.4596 0.706815Z" fill="currentColor"/>
<path d="M4.75819 0.706815C4.40743 0.319578 3.98903 0.50116 4.04838 0.706798C5.13893 4.52594 6.11301 7.85098 6.14193 7.95066C6.57365 9.43871 6.6083 10.7833 5.98027 12.2906C5.92883 12.4141 0.108943 24.0506 0.0172195 24.2464C-0.0852556 24.4651 0.295279 24.8156 0.758943 24.3149C0.831594 24.2365 12.8508 10.491 13.0126 10.3169C13.1745 10.1428 13.0979 10.0913 13.0126 9.99577C12.9274 9.90026 4.96682 0.937139 4.75819 0.706815Z" fill="currentColor"/>
</svg>`;

// src/views/chat-modal.ts
var SUGGESTED_PROMPTS = [
  { icon: "list", label: "Summarize", text: "Summarize the key themes across my vault." },
  { icon: "link", label: "Connect ideas", text: "Find the strongest connections between my notes." },
  { icon: "search", label: "Surface insights", text: "What patterns might I have missed?" },
  { icon: "lightbulb", label: "What\u2019s next?", text: "Based on my recent notes, what should I explore next?" }
];
var MAX_ATTACHMENT_CHARS = 1e5;
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  "md",
  "markdown",
  "txt",
  "text",
  "rst",
  "org",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "env",
  "csv",
  "tsv",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "cs",
  "sh",
  "bash",
  "zsh",
  "fish",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "svg",
  "sql",
  "graphql",
  "gql",
  "log"
]);
var ChatModal = class extends import_obsidian9.Modal {
  constructor(app, client, store, settings) {
    super(app);
    this.client = client;
    this.store = store;
    this.settings = settings;
    this.historyPopover = null;
    this.renderComponent = new import_obsidian9.Component();
    this.hasMessages = false;
    this.currentTurns = [];
    this.currentTitle = "";
    this.currentCreatedAt = 0;
    /** All entities collected across turns, for inline-link post-processing. */
    this.allEntities = [];
    /** All citations collected across turns, for export. */
    this.allCitations = [];
    /** Files attached to the next outgoing message. Inline-only — content is
     *  prepended to the prompt at send time and then cleared. Not persisted. */
    this.pendingAttachments = [];
    this.onOutsideClick = (evt) => {
      if (!this.historyPopover) return;
      const target = evt.target;
      if (this.historyPopover.contains(target) || this.historyBtn.contains(target)) return;
      this.closeHistoryPopover();
    };
    this.sessionId = crypto.randomUUID();
  }
  onOpen() {
    this.modalEl.addClass("cortex-chat-modal");
    this.titleEl.empty();
    const title = this.titleEl.createEl("div", { cls: "cortex-chat-title" });
    title.createEl("span", { cls: "cortex-chat-title-text", text: "Ask your vault" });
    const actions = title.createEl("div", { cls: "cortex-chat-title-actions" });
    this.historyBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "Conversation history" } });
    (0, import_obsidian9.setIcon)(this.historyBtn, "history");
    this.historyBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      this.toggleHistoryPopover();
    });
    this.newChatBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "New chat" } });
    (0, import_obsidian9.setIcon)(this.newChatBtn, "plus");
    this.newChatBtn.addEventListener("click", () => this.resetConversation());
    this.exportBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "Export conversation to note" } });
    (0, import_obsidian9.setIcon)(this.exportBtn, "file-down");
    this.exportBtn.addEventListener("click", () => this.exportConversation());
    this.exportBtn.style.display = "none";
    this.outputEl = this.contentEl.createEl("div", { cls: "cortex-chat-output" });
    this.renderEmptyState();
    const composerWrap = this.contentEl.createEl("div", { cls: "cortex-chat-composer-wrap" });
    this.attachmentsEl = composerWrap.createEl("div", { cls: "cortex-chat-attachments is-empty" });
    const composer = composerWrap.createEl("div", { cls: "cortex-chat-composer" });
    this.attachBtn = composer.createEl("button", {
      cls: "cortex-chat-attach",
      attr: { "aria-label": "Attach file (text only, ephemeral)", type: "button" }
    });
    (0, import_obsidian9.setIcon)(this.attachBtn, "paperclip");
    this.fileInputEl = composer.createEl("input", {
      cls: "cortex-chat-file-input",
      attr: { type: "file", multiple: "true", style: "display:none" }
    });
    this.attachBtn.addEventListener("click", () => this.fileInputEl.click());
    this.fileInputEl.addEventListener("change", () => {
      const files = Array.from(this.fileInputEl.files ?? []);
      void this.handleAttachedFiles(files);
      this.fileInputEl.value = "";
    });
    this.inputEl = composer.createEl("textarea", {
      cls: "cortex-chat-input",
      attr: { rows: "1", placeholder: "Ask anything about your vault\u2026" }
    });
    this.askBtn = composer.createEl("button", { cls: "cortex-chat-send", attr: { "aria-label": "Send", disabled: "true" } });
    (0, import_obsidian9.setIcon)(this.askBtn, "arrow-up");
    this.askBtn.addEventListener("click", () => this.submit());
    composerWrap.addEventListener("dragover", (evt) => {
      evt.preventDefault();
      composerWrap.addClass("is-drag-target");
    });
    composerWrap.addEventListener("dragleave", () => composerWrap.removeClass("is-drag-target"));
    composerWrap.addEventListener("drop", (evt) => {
      evt.preventDefault();
      composerWrap.removeClass("is-drag-target");
      const files = Array.from(evt.dataTransfer?.files ?? []);
      if (files.length > 0) void this.handleAttachedFiles(files);
    });
    const hint = composerWrap.createEl("div", { cls: "cortex-chat-hint" });
    hint.createEl("span", { text: "\u2318\u21B5 to send \xB7 \u2318N to start a new chat" });
    this.inputEl.addEventListener("input", () => {
      this.autoResize();
      this.askBtn.toggleAttribute("disabled", this.inputEl.value.trim().length === 0);
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && (evt.metaKey || evt.ctrlKey)) {
        evt.preventDefault();
        this.submit();
      } else if (evt.key === "n" && (evt.metaKey || evt.ctrlKey) && !this.hasMessages === false) {
        evt.preventDefault();
        this.resetConversation();
      }
    });
    this.inputEl.focus();
  }
  renderEmptyState() {
    const empty = this.outputEl.createEl("div", { cls: "cortex-chat-empty" });
    const logo = empty.createEl("div", { cls: "cortex-chat-empty-logo" });
    logo.innerHTML = HANGARX_LOGO_SVG;
    empty.createEl("h2", { cls: "cortex-chat-empty-title", text: "Ask your vault anything" });
    empty.createEl("p", {
      cls: "cortex-chat-empty-sub",
      text: "HangarX searches your knowledge graph and synthesizes an answer with citations."
    });
    const grid = empty.createEl("div", { cls: "cortex-chat-suggestions" });
    for (const s of SUGGESTED_PROMPTS) {
      const card = grid.createEl("div", {
        cls: "cortex-chat-suggestion",
        attr: { role: "button", tabindex: "0" }
      });
      const ic = card.createEl("span", { cls: "cortex-chat-suggestion-icon" });
      (0, import_obsidian9.setIcon)(ic, s.icon);
      const body = card.createEl("div", { cls: "cortex-chat-suggestion-body" });
      body.createEl("div", { cls: "cortex-chat-suggestion-label", text: s.label });
      body.createEl("div", { cls: "cortex-chat-suggestion-text", text: s.text });
      const fill = () => this.populateInput(s.text);
      card.addEventListener("click", fill);
      card.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          fill();
        }
      });
    }
  }
  autoResize() {
    this.inputEl.style.height = "auto";
    this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 200)}px`;
  }
  resetConversation() {
    this.sessionId = crypto.randomUUID();
    this.hasMessages = false;
    this.currentTurns = [];
    this.currentTitle = "";
    this.currentCreatedAt = 0;
    this.allEntities = [];
    this.allCitations = [];
    this.pendingAttachments = [];
    if (this.attachmentsEl) this.renderAttachmentChips();
    this.outputEl.empty();
    this.renderEmptyState();
    this.inputEl.value = "";
    this.autoResize();
    this.askBtn.setAttr("disabled", "true");
    this.exportBtn.style.display = "none";
    this.closeHistoryPopover();
    this.inputEl.focus();
  }
  // ──────────────────────────────────────────
  // History popover
  // ──────────────────────────────────────────
  toggleHistoryPopover() {
    if (this.historyPopover) {
      this.closeHistoryPopover();
      return;
    }
    void this.openHistoryPopover();
  }
  async openHistoryPopover() {
    const popover = this.contentEl.createEl("div", { cls: "cortex-chat-history-popover" });
    this.historyPopover = popover;
    popover.createEl("div", { cls: "cortex-chat-history-header", text: "Past conversations" });
    const listEl = popover.createEl("div", { cls: "cortex-chat-history-list" });
    listEl.createEl("div", { cls: "cortex-chat-history-empty", text: "Loading\u2026" });
    setTimeout(() => {
      document.addEventListener("mousedown", this.onOutsideClick, true);
    }, 0);
    try {
      const conversations = await this.store.list();
      listEl.empty();
      if (conversations.length === 0) {
        listEl.createEl("div", { cls: "cortex-chat-history-empty", text: "No past conversations yet." });
        return;
      }
      for (const c of conversations) this.renderHistoryRow(listEl, c);
    } catch (e) {
      listEl.empty();
      listEl.createEl("div", { cls: "cortex-chat-history-empty", text: `Error: ${e.message}` });
    }
  }
  closeHistoryPopover() {
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    this.historyPopover?.remove();
    this.historyPopover = null;
  }
  renderHistoryRow(parent, c) {
    const row = parent.createEl("div", { cls: "cortex-chat-history-row" });
    if (c.id === this.sessionId) row.addClass("is-active");
    const main = row.createEl("div", { cls: "cortex-chat-history-main" });
    main.createEl("div", { cls: "cortex-chat-history-title", text: c.title || "(untitled)" });
    const meta = main.createEl("div", { cls: "cortex-chat-history-meta" });
    meta.createEl("span", { text: relativeTime(c.updatedAt) });
    meta.createEl("span", { cls: "cortex-chat-history-dot", text: "\xB7" });
    const turnCount = c.turns.filter((t) => t.role === "user").length;
    meta.createEl("span", { text: `${turnCount} message${turnCount === 1 ? "" : "s"}` });
    main.addEventListener("click", () => this.loadConversation(c));
    const del = row.createEl("button", { cls: "cortex-chat-history-del", attr: { "aria-label": "Delete conversation" } });
    (0, import_obsidian9.setIcon)(del, "trash-2");
    del.addEventListener("click", async (evt) => {
      evt.stopPropagation();
      await this.store.delete(c.id);
      row.remove();
      if (c.id === this.sessionId) this.resetConversation();
    });
  }
  async loadConversation(c) {
    this.closeHistoryPopover();
    this.sessionId = c.id;
    this.currentTurns = [...c.turns];
    this.currentTitle = c.title;
    this.currentCreatedAt = c.createdAt;
    this.hasMessages = c.turns.length > 0;
    this.outputEl.empty();
    for (const t of c.turns) {
      if (t.role === "user") this.renderUserTurn(t.content);
      else this.renderAiTurnFromPayload(t.content, t.payload);
    }
    this.scrollToBottom();
    this.inputEl.focus();
  }
  renderUserTurn(text, attachmentSummary) {
    const userTurn = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-user" });
    const userBubble = userTurn.createEl("div", { cls: "cortex-chat-bubble" });
    userBubble.createEl("div", { cls: "cortex-chat-role", text: "You" });
    userBubble.createEl("div", { cls: "cortex-chat-content", text });
    if (attachmentSummary) {
      userBubble.createEl("div", {
        cls: "cortex-chat-content-attachment",
        text: attachmentSummary
      });
    }
  }
  renderAiTurnFromPayload(answer, payload) {
    const aiTurn = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-ai" });
    const aiBubble = aiTurn.createEl("div", { cls: "cortex-chat-bubble" });
    aiBubble.createEl("div", { cls: "cortex-chat-role", text: "HangarX" });
    const bodyEl = aiBubble.createEl("div", { cls: "cortex-chat-body" });
    if (payload) void this.renderResponse(bodyEl, payload);
    else bodyEl.createEl("div", { cls: "cortex-chat-answer", text: answer });
    this.renderTurnActions(aiBubble, answer, payload);
  }
  async persistConversation() {
    if (this.currentTurns.length === 0) return;
    if (this.currentCreatedAt === 0) this.currentCreatedAt = Date.now();
    if (!this.currentTitle) {
      const firstUser = this.currentTurns.find((t) => t.role === "user");
      this.currentTitle = firstUser ? deriveConversationTitle(firstUser.content) : "(untitled)";
    }
    const conversation = {
      id: this.sessionId,
      title: this.currentTitle,
      createdAt: this.currentCreatedAt,
      updatedAt: Date.now(),
      turns: this.currentTurns
    };
    await this.store.upsert(conversation).catch((e) => console.warn("[Cortex] Save chat failed:", e));
  }
  onClose() {
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    if (this.settings.autoSaveChatToVault && this.currentTurns.length > 0) {
      writeConversationNote(this.app, this.settings.chatExportFolder, {
        title: this.currentTitle || "Untitled Chat",
        turns: this.currentTurns.map((t) => ({ role: t.role, content: t.content })),
        entities: this.allEntities.map((e) => e.name),
        citations: this.allCitations,
        createdAt: this.currentCreatedAt || Date.now()
      }).catch((e) => console.warn("[Cortex] Auto-save chat note failed:", e));
    }
    this.renderComponent.unload();
    this.contentEl.empty();
  }
  async submit() {
    const query = this.inputEl.value.trim();
    if (!query) return;
    this.inputEl.value = "";
    this.autoResize();
    this.askBtn.setAttr("disabled", "true");
    this.hasMessages = true;
    const emptyState = this.outputEl.querySelector(".cortex-chat-empty");
    emptyState?.remove();
    const urlRegex = /^https?:\/\/\S+$/i;
    if (urlRegex.test(query)) {
      this.renderUserTurn(query);
      this.currentTurns.push({ role: "user", content: query });
      const aiTurn2 = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-ai" });
      const aiBubble2 = aiTurn2.createEl("div", { cls: "cortex-chat-bubble" });
      aiBubble2.createEl("div", { cls: "cortex-chat-role", text: "HangarX" });
      const bodyEl2 = aiBubble2.createEl("div", { cls: "cortex-chat-body" });
      const thinkingEl2 = bodyEl2.createEl("div", { cls: "cortex-chat-thinking", text: "Ingesting URL\u2026" });
      this.scrollToBottom();
      try {
        const result = await this.client.ingestUrl(query);
        thinkingEl2.remove();
        const msg = `\u2705 Ingested **${query}** into your knowledge graph. ${result.entityCount ? `Extracted ${result.entityCount} entities.` : ""}`;
        const answerEl = bodyEl2.createEl("div", { cls: "cortex-chat-answer" });
        await import_obsidian9.MarkdownRenderer.render(this.app, msg, answerEl, "", this.renderComponent);
        this.currentTurns.push({ role: "ai", content: msg });
        this.exportBtn.style.display = "";
        void this.persistConversation();
      } catch (e) {
        thinkingEl2.remove();
        this.renderErrorCard(bodyEl2, e, "Couldn't ingest URL", () => {
          this.inputEl.value = query;
          void this.submit();
        });
      }
      this.scrollToBottom();
      return;
    }
    const { promptText, displayText, attachmentSummary } = this.buildAugmentedQuery(query);
    this.pendingAttachments = [];
    this.renderAttachmentChips();
    this.renderUserTurn(displayText, attachmentSummary || void 0);
    this.currentTurns.push({ role: "user", content: displayText });
    const aiTurn = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-ai" });
    const aiBubble = aiTurn.createEl("div", { cls: "cortex-chat-bubble" });
    aiBubble.createEl("div", { cls: "cortex-chat-role", text: "HangarX" });
    const bodyEl = aiBubble.createEl("div", { cls: "cortex-chat-body" });
    const thinkingEl = bodyEl.createEl("div", { cls: "cortex-chat-thinking", text: "Thinking\u2026" });
    this.scrollToBottom();
    try {
      const recalled = await this.client.recall(query, 5).catch(() => []);
      const prefix = recalled.length > 0 ? `Relevant prior context (from past sessions):
${recalled.map((m) => `- ${m.content}`).join("\n")}

Question: ` : "";
      const res = await this.client.ask(prefix + promptText, this.sessionId);
      thinkingEl.remove();
      await this.renderResponse(bodyEl, res);
      if (recalled.length > 0) this.renderRecalledMemories(bodyEl, recalled.length);
      if (res.entities?.length) this.allEntities.push(...res.entities);
      if (res.citations?.length) this.allCitations.push(...res.citations);
      this.renderTurnActions(aiBubble, res.answer, res);
      this.currentTurns.push({ role: "ai", content: res.answer, payload: res });
      this.exportBtn.style.display = "";
      void this.persistConversation();
      if (this.settings.autoSaveChatToVault) {
        void this.client.remember(`Q: ${query}
A: ${res.answer.slice(0, 800)}`, "conversation").catch(() => {
        });
      }
    } catch (e) {
      thinkingEl.remove();
      this.renderErrorCard(bodyEl, e, "Couldn't answer your question", () => {
        aiTurn.remove();
        this.currentTurns.pop();
        this.inputEl.value = query;
        void this.submit();
      });
    } finally {
      if (this.inputEl.value.trim().length > 0) this.askBtn.removeAttribute("disabled");
      this.scrollToBottom();
    }
  }
  async renderResponse(parent, res) {
    if (res.confidence > 0) {
      const meta = parent.createEl("div", { cls: "cortex-chat-meta" });
      const conf = meta.createEl("span", { cls: "cortex-chat-pill cortex-chat-pill-confidence" });
      conf.setText(`${Math.round(res.confidence * 100)}% confidence`);
    }
    const answerEl = parent.createEl("div", { cls: "cortex-chat-answer" });
    const answerText = res.answer?.trim() || "_No answer returned._";
    await import_obsidian9.MarkdownRenderer.render(this.app, answerText, answerEl, "", this.renderComponent);
    if (res.entities.length > 0) this.renderEntities(parent, res.entities);
    if (res.documents.length > 0) this.renderDocuments(parent, res.documents);
    if (res.citations.length > 0) this.renderCitations(parent, res.citations);
    if (res.followUps.length > 0) this.renderFollowUps(parent, res.followUps);
    this.linkifyEntities(answerEl, res.entities);
  }
  renderEntities(parent, entities) {
    const section = this.collapsibleSection(parent, `Entities (${entities.length})`, true);
    const grid = section.createEl("div", { cls: "cortex-chat-entities" });
    const byType = /* @__PURE__ */ new Map();
    for (const e of entities) {
      const arr = byType.get(e.type) ?? [];
      arr.push(e);
      byType.set(e.type, arr);
    }
    for (const [type, list] of byType) {
      const group = grid.createEl("div", { cls: "cortex-chat-entity-group" });
      group.createEl("div", { cls: "cortex-chat-entity-type", text: type });
      const chips = group.createEl("div", { cls: "cortex-chat-chips" });
      for (const e of list) {
        const chip = chips.createEl("a", {
          cls: "cortex-chat-chip",
          text: prettifyEntityName(e.name),
          href: "#"
        });
        const titleParts = [];
        if (e.description) titleParts.push(e.description);
        if (e.name !== prettifyEntityName(e.name)) titleParts.push(`id: ${e.name}`);
        if (titleParts.length) chip.setAttr("title", titleParts.join("\n"));
        chip.addEventListener("click", (evt) => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(e.name, "");
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.close();
          }
        });
      }
    }
  }
  renderDocuments(parent, documents) {
    const section = this.collapsibleSection(parent, `Documents (${documents.length})`, true);
    const list = section.createEl("div", { cls: "cortex-chat-docs" });
    for (const d of documents) {
      const row = list.createEl("div", { cls: "cortex-chat-doc" });
      const header = row.createEl("div", { cls: "cortex-chat-doc-header" });
      const titleEl = header.createEl(d.url || d.filePath ? "a" : "span", { cls: "cortex-chat-doc-title", text: d.title });
      if (d.url) {
        titleEl.href = d.url;
        titleEl.target = "_blank";
        titleEl.rel = "noopener";
      } else if (d.filePath) {
        titleEl.href = "#";
        titleEl.addEventListener("click", (evt) => {
          evt.preventDefault();
          const file = this.app.vault.getAbstractFileByPath(d.filePath);
          if (file && "extension" in file) {
            this.app.workspace.getLeaf(false).openFile(file);
            this.close();
          }
        });
      }
      if (typeof d.matchPercent === "number") {
        header.createEl("span", { cls: "cortex-chat-pill cortex-chat-pill-match", text: `${d.matchPercent}%` });
      }
      const subParts = [];
      if (d.source) subParts.push(d.source);
      if (d.publishDate) subParts.push(d.publishDate);
      if (subParts.length > 0) row.createEl("div", { cls: "cortex-chat-doc-sub", text: subParts.join(" \xB7 ") });
      if (d.snippet) row.createEl("div", { cls: "cortex-chat-doc-snippet", text: d.snippet });
    }
  }
  renderCitations(parent, citations) {
    const section = parent.createEl("div", { cls: "cortex-chat-section cortex-chat-citations" });
    section.createEl("div", { cls: "cortex-chat-section-label", text: "Sources" });
    const chips = section.createEl("div", { cls: "cortex-chat-chips" });
    for (const c of citations) {
      const chip = chips.createEl("a", {
        cls: "cortex-chat-chip",
        text: prettifyEntityName(c.source),
        href: c.url ?? "#"
      });
      const tooltipParts = [];
      if (c.text) tooltipParts.push(c.text);
      if (c.source !== prettifyEntityName(c.source)) tooltipParts.push(`id: ${c.source}`);
      if (tooltipParts.length) chip.setAttr("title", tooltipParts.join("\n"));
      if (c.url) {
        chip.target = "_blank";
        chip.rel = "noopener";
      } else {
        chip.addEventListener("click", (evt) => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(c.source, "");
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.close();
          }
        });
      }
    }
  }
  /**
   * Render a structured error card inside an AI bubble (or any container).
   * Reuses the shared error-format utility — same look and behavior as the
   * graph-pull modal, scoped down to fit inline in the chat flow.
   */
  renderErrorCard(parent, err, headline, onRetry) {
    const fmt = formatError(err, headline);
    const card = parent.createEl("div", { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl("div", { cls: "cortex-error-head" });
    const ic = head.createEl("span", { cls: "cortex-error-icon" });
    (0, import_obsidian9.setIcon)(ic, errorIcon(fmt.kind));
    head.createEl("span", { cls: "cortex-error-headline", text: fmt.headline });
    if (fmt.hint) {
      card.createEl("div", { cls: "cortex-error-hint", text: fmt.hint });
    }
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const actions = card.createEl("div", { cls: "cortex-error-actions" });
    if (onRetry) {
      const retryBtn = actions.createEl("button", { text: "Retry", cls: "mod-cta" });
      retryBtn.addEventListener("click", () => onRetry());
    }
    const copyBtn = actions.createEl("button", { text: "Copy details" });
    copyBtn.addEventListener("click", async () => {
      const payload = `${fmt.headline}

${fmt.detail}${fmt.hint ? `

Hint: ${fmt.hint}` : ""}`;
      await navigator.clipboard.writeText(payload);
      copyBtn.setText("Copied");
      setTimeout(() => copyBtn.setText("Copy details"), 1400);
    });
  }
  renderRecalledMemories(parent, count) {
    const note = parent.createEl("div", { cls: "cortex-chat-recalled" });
    const ic = note.createEl("span", { cls: "cortex-chat-recalled-icon" });
    (0, import_obsidian9.setIcon)(ic, "history");
    note.createEl("span", { text: `Used ${count} memor${count === 1 ? "y" : "ies"} from past sessions.` });
  }
  renderFollowUps(parent, followUps) {
    const section = parent.createEl("div", { cls: "cortex-chat-section cortex-chat-followups" });
    section.createEl("div", { cls: "cortex-chat-section-label", text: "Follow up" });
    const list = section.createEl("div", { cls: "cortex-chat-followup-list" });
    for (const q of followUps) {
      const btn = list.createEl("button", { cls: "cortex-chat-followup", text: q });
      btn.addEventListener("click", () => {
        this.populateInput(q);
      });
    }
  }
  /**
   * Programmatically populate the chat input. Mirrors what a real keystroke
   * would do: set value, recompute auto-grow height, refresh the send button
   * enabled state, and focus. Used by follow-up + suggestion card clicks —
   * without this, setting `inputEl.value` directly leaves the send button
   * stuck on `disabled` because the `input` event listener never fires.
   */
  /**
   * Handle one or more files added via the paperclip picker or drag-and-drop.
   * Reads each as text (binaries are politely declined with a Notice), caps
   * size, dedupes by name, and triggers the chip render.
   */
  async handleAttachedFiles(files) {
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        new import_obsidian9.Notice(`${file.name}: only text files are supported for inline attachment (yet). Use vault sync for ${ext.toUpperCase()} files.`);
        continue;
      }
      if (this.pendingAttachments.some((a) => a.name === file.name)) {
        new import_obsidian9.Notice(`${file.name} is already attached.`);
        continue;
      }
      try {
        let text = await file.text();
        if (text.length > MAX_ATTACHMENT_CHARS) {
          text = text.slice(0, MAX_ATTACHMENT_CHARS) + `

[... truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars]`;
          new import_obsidian9.Notice(`${file.name} truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars`);
        }
        this.pendingAttachments.push({ name: file.name, size: file.size, content: text });
      } catch (e) {
        new import_obsidian9.Notice(`Couldn't read ${file.name}: ${e.message}`);
      }
    }
    this.renderAttachmentChips();
  }
  /** Render the row of attachment chips above the composer. */
  renderAttachmentChips() {
    this.attachmentsEl.empty();
    if (this.pendingAttachments.length === 0) {
      this.attachmentsEl.addClass("is-empty");
      return;
    }
    this.attachmentsEl.removeClass("is-empty");
    for (const att of this.pendingAttachments) {
      const chip = this.attachmentsEl.createEl("div", { cls: "cortex-chat-attachment-chip" });
      const ic = chip.createEl("span", { cls: "cortex-chat-attachment-icon" });
      (0, import_obsidian9.setIcon)(ic, "file-text");
      chip.createEl("span", { cls: "cortex-chat-attachment-name", text: att.name });
      chip.createEl("span", {
        cls: "cortex-chat-attachment-size",
        text: formatBytes(att.size)
      });
      const rm = chip.createEl("button", {
        cls: "cortex-chat-attachment-remove",
        attr: { "aria-label": `Remove ${att.name}` }
      });
      (0, import_obsidian9.setIcon)(rm, "x");
      rm.addEventListener("click", () => {
        this.pendingAttachments = this.pendingAttachments.filter((a) => a.name !== att.name);
        this.renderAttachmentChips();
      });
    }
  }
  /**
   * Build the augmented message body — prepends each attachment's content as a
   * fenced block, then the user's actual question. Returns the original
   * question separately so it can be displayed as-is in the chat bubble (not
   * cluttered with the file dump).
   */
  buildAugmentedQuery(query) {
    if (this.pendingAttachments.length === 0) {
      return { promptText: query, displayText: query, attachmentSummary: "" };
    }
    const blocks = ["# Attached files (one-shot context for this question)\n"];
    for (const att of this.pendingAttachments) {
      const ext = (att.name.split(".").pop() || "").toLowerCase();
      blocks.push(`## ${att.name}
\`\`\`${ext}
${att.content}
\`\`\`
`);
    }
    blocks.push(`# User question
${query}`);
    const summary = this.pendingAttachments.length === 1 ? `\u{1F4CE} ${this.pendingAttachments[0].name}` : `\u{1F4CE} ${this.pendingAttachments.length} files attached`;
    return {
      promptText: blocks.join("\n"),
      displayText: query,
      attachmentSummary: summary
    };
  }
  populateInput(text) {
    this.inputEl.value = text;
    this.autoResize();
    if (text.trim().length > 0) this.askBtn.removeAttribute("disabled");
    else this.askBtn.setAttr("disabled", "true");
    this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    this.inputEl.focus();
    const len = this.inputEl.value.length;
    this.inputEl.setSelectionRange(len, len);
  }
  collapsibleSection(parent, label, openByDefault) {
    const wrap = parent.createEl("details", { cls: "cortex-chat-section cortex-chat-collapsible" });
    if (openByDefault) wrap.setAttr("open", "");
    const summary = wrap.createEl("summary", { cls: "cortex-chat-section-label" });
    summary.setText(label);
    return wrap;
  }
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }
  // ──────────────────────────────────────────
  // Turn actions (Copy + Save to Note)
  // ──────────────────────────────────────────
  renderTurnActions(bubble, answer, payload) {
    const actions = bubble.createEl("div", { cls: "cortex-chat-turn-actions" });
    const copyBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Copy answer" } });
    (0, import_obsidian9.setIcon)(copyBtn, "copy");
    copyBtn.createEl("span", { text: "Copy" });
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(answer);
      copyBtn.empty();
      (0, import_obsidian9.setIcon)(copyBtn, "check");
      copyBtn.createEl("span", { text: "Copied" });
      setTimeout(() => {
        copyBtn.empty();
        (0, import_obsidian9.setIcon)(copyBtn, "copy");
        copyBtn.createEl("span", { text: "Copy" });
      }, 1500);
    });
    const saveBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Save to note" } });
    (0, import_obsidian9.setIcon)(saveBtn, "file-plus");
    saveBtn.createEl("span", { text: "Save to Note" });
    saveBtn.addEventListener("click", async () => {
      try {
        const userTurns = this.currentTurns.filter((t) => t.role === "user");
        const question = userTurns.length > 0 ? userTurns[userTurns.length - 1].content : "HangarX Answer";
        const entities = payload?.entities?.map((e) => e.name);
        const citations = payload?.citations;
        const path = await writeSingleAnswerNote(
          this.app,
          this.settings.chatExportFolder,
          question,
          answer,
          entities,
          citations
        );
        saveBtn.empty();
        (0, import_obsidian9.setIcon)(saveBtn, "check");
        saveBtn.createEl("span", { text: "Saved" });
        new import_obsidian9.Notice(`Saved to ${path}`);
        setTimeout(() => {
          saveBtn.empty();
          (0, import_obsidian9.setIcon)(saveBtn, "file-plus");
          saveBtn.createEl("span", { text: "Save to Note" });
        }, 2e3);
      } catch (e) {
        new import_obsidian9.Notice(`Save failed: ${e.message}`);
      }
    });
  }
  // ──────────────────────────────────────────
  // Export full conversation
  // ──────────────────────────────────────────
  async exportConversation() {
    if (this.currentTurns.length === 0) {
      new import_obsidian9.Notice("No messages to export.");
      return;
    }
    try {
      const path = await writeConversationNote(this.app, this.settings.chatExportFolder, {
        title: this.currentTitle || "Untitled Chat",
        turns: this.currentTurns.map((t) => ({ role: t.role, content: t.content })),
        entities: this.allEntities.map((e) => e.name),
        citations: this.allCitations,
        createdAt: this.currentCreatedAt || Date.now()
      });
      new import_obsidian9.Notice(`Conversation exported to ${path}`);
    } catch (e) {
      new import_obsidian9.Notice(`Export failed: ${e.message}`);
    }
  }
  // ──────────────────────────────────────────
  // Inline entity links
  // ──────────────────────────────────────────
  /**
   * Post-process rendered answer HTML: find entity names in text nodes
   * and wrap them in clickable links that open the corresponding vault note.
   */
  linkifyEntities(container, entities) {
    if (!entities?.length) return;
    const entityMap = /* @__PURE__ */ new Map();
    for (const e of entities) {
      if (e.name.length < 3) continue;
      entityMap.set(e.name.toLowerCase(), e);
    }
    if (entityMap.size === 0) return;
    const sorted = [...entityMap.keys()].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.parentElement?.closest("a, code, pre, .cortex-chat-chip")) continue;
      if (regex.test(node.textContent || "")) textNodes.push(node);
      regex.lastIndex = 0;
    }
    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const parts = [];
      let lastIndex = 0;
      regex.lastIndex = 0;
      let match;
      while (match = regex.exec(text)) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const entity = entityMap.get(match[1].toLowerCase());
        const link = document.createElement("a");
        link.className = "cortex-chat-inline-link";
        link.textContent = match[1];
        link.href = "#";
        if (entity?.description) link.title = entity.description;
        link.addEventListener("click", (evt) => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(match[1], "");
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.close();
          }
        });
        parts.push(link);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));
      if (parts.length > 1) {
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (typeof p === "string") frag.appendChild(document.createTextNode(p));
          else frag.appendChild(p);
        }
        textNode.replaceWith(frag);
      }
    }
  }
};
function prettifyEntityName(name) {
  if (!name) return "";
  let s = String(name);
  s = s.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, "");
  if (s.includes("/")) s = s.split("/").filter(Boolean).pop() ?? s;
  s = s.replace(/\.(md|markdown|txt)$/i, "");
  const chatMatch = s.match(/^Cortex_(Chats|Briefs)_(\d{4}-\d{2}-\d{2})(?:_-_(.+))?$/);
  if (chatMatch) {
    const kind = chatMatch[1] === "Chats" ? "Chat" : "Brief";
    const date = chatMatch[2];
    const title = (chatMatch[3] || "").replace(/_/g, " ").trim();
    return title ? `${kind}: ${title} (${date})` : `${kind} ${date}`;
  }
  s = s.replace(/_/g, " ").trim();
  return s || name;
}
function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// src/views/graph-stats-modal.ts
var import_obsidian10 = require("obsidian");
var GraphStatsModal = class extends import_obsidian10.Modal {
  constructor(app, client, plugin) {
    super(app);
    this.client = client;
    this.plugin = plugin;
  }
  async onOpen() {
    this.titleEl.setText("HangarX: Memory stats");
    this.contentEl.empty();
    this.contentEl.addClass("cortex-graph-stats");
    const status = this.contentEl.createEl("p", {
      cls: "cortex-graph-stats-status",
      text: "Loading\u2026"
    });
    try {
      const startedAt = Date.now();
      const [stats, ragStats] = await Promise.all([
        this.client.getGraphStats(),
        this.client.getGraphRAGStats().catch(() => null)
      ]);
      const elapsedMs = Date.now() - startedAt;
      status.remove();
      this.render(stats, ragStats, elapsedMs);
    } catch (e) {
      status.remove();
      this.renderError(e);
    }
  }
  render(stats, ragStats, elapsedMs) {
    const c = this.contentEl;
    const summary = c.createDiv({ cls: "cortex-graph-stats-summary" });
    this.renderCard(summary, "Entities", formatNumber(stats.totalEntities));
    this.renderCard(summary, "Relationships", formatNumber(stats.totalRelationships));
    this.renderCard(summary, "Entity types", String(stats.entityTypes.length));
    this.renderCard(summary, "Relationship types", String(stats.relationshipTypes.length));
    if (stats.totalEntities === 0) {
      const hint = c.createDiv({ cls: "cortex-graph-stats-hint" });
      hint.createEl("p", {
        text: 'The graph is empty. If you expected data here, run "HangarX: Sync vault to memory layer" from the command palette and watch the DevTools console for any ingest errors.'
      });
    }
    if (stats.entityTypes.length > 0) {
      c.createEl("h4", { text: "Entity types" });
      const table = c.createEl("table", { cls: "cortex-graph-stats-table" });
      const head = table.createEl("thead").createEl("tr");
      head.createEl("th", { text: "Type" });
      head.createEl("th", { text: "Count", cls: "num" });
      head.createEl("th", { text: "Sample properties" });
      const body = table.createEl("tbody");
      for (const et of stats.entityTypes) {
        const tr = body.createEl("tr");
        tr.createEl("td", { text: et.type });
        tr.createEl("td", { text: formatNumber(et.count), cls: "num" });
        tr.createEl("td", {
          cls: "cortex-graph-stats-props",
          text: (et.sampleProperties ?? []).slice(0, 8).join(", ") || "\u2014"
        });
      }
    }
    if (stats.relationshipTypes.length > 0) {
      c.createEl("h4", { text: "Relationship types" });
      const table = c.createEl("table", { cls: "cortex-graph-stats-table" });
      const head = table.createEl("thead").createEl("tr");
      head.createEl("th", { text: "Type" });
      head.createEl("th", { text: "Count", cls: "num" });
      const body = table.createEl("tbody");
      for (const rt of stats.relationshipTypes) {
        const tr = body.createEl("tr");
        tr.createEl("td", { text: rt.type });
        tr.createEl("td", { text: formatNumber(rt.count), cls: "num" });
      }
    }
    if (ragStats) {
      c.createEl("h4", { text: "GraphRAG orchestrator" });
      const dl = c.createEl("dl", { cls: "cortex-graph-stats-dl" });
      for (const [k, v] of Object.entries(ragStats)) {
        if (v == null) continue;
        const dt = dl.createEl("dt", { text: humanizeKey(k) });
        const dd = dl.createEl("dd", { text: formatValue(v) });
        if (k === "cacheHitRate" && typeof v === "number" && v < 0.1) dd.addClass("is-warn");
        if (k === "averageLatencyMs" && typeof v === "number" && v > 5e3) dd.addClass("is-warn");
      }
    }
    const footer = c.createDiv({ cls: "cortex-graph-stats-footer" });
    footer.createEl("span", {
      cls: "cortex-graph-stats-elapsed",
      text: `Fetched in ${elapsedMs}ms`
    });
    const refreshBtn = footer.createEl("button", { text: "Refresh" });
    refreshBtn.addEventListener("click", async () => {
      this.contentEl.empty();
      await this.onOpen();
    });
    const copyBtn = footer.createEl("button", { text: "Copy as Markdown" });
    copyBtn.addEventListener("click", async () => {
      const md = renderAsMarkdown(stats, ragStats);
      await navigator.clipboard.writeText(md);
      copyBtn.setText("Copied");
      setTimeout(() => copyBtn.setText("Copy as Markdown"), 1400);
    });
    const noteBtn = footer.createEl("button", { text: "Save as note", cls: "mod-cta" });
    noteBtn.addEventListener("click", async () => {
      const md = renderAsMarkdown(stats, ragStats);
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:]/g, "-").slice(0, 19);
      const path = `Cortex/Debug/Graph stats - ${stamp}.md`;
      try {
        const dir = path.split("/").slice(0, -1).join("/");
        if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
          await this.app.vault.createFolder(dir).catch(() => {
          });
        }
        const file = await this.app.vault.create(path, md);
        await this.app.workspace.getLeaf(false).openFile(file);
        this.close();
      } catch (e) {
        new import_obsidian10.Notice(`Couldn't save note: ${e.message}`);
      }
    });
  }
  renderCard(parent, label, value) {
    const card = parent.createDiv({ cls: "cortex-graph-stats-card" });
    card.createEl("div", { cls: "cortex-graph-stats-card-value", text: value });
    card.createEl("div", { cls: "cortex-graph-stats-card-label", text: label });
  }
  renderError(err) {
    const fmt = formatError(err, "Couldn't load graph stats");
    const s = this.plugin?.settings;
    const isLocalAuth = fmt.kind === "auth" && s?.connectionMode === "local";
    const containerOutOfSync = isLocalAuth && s?.composeOutOfSync === true;
    const card = this.contentEl.createEl("div", { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl("div", { cls: "cortex-error-head" });
    const ic = head.createEl("span", { cls: "cortex-error-icon" });
    (0, import_obsidian10.setIcon)(ic, errorIcon(fmt.kind));
    head.createEl("span", {
      cls: "cortex-error-headline",
      text: containerOutOfSync ? "Container is out of sync" : fmt.headline
    });
    if (containerOutOfSync) {
      card.createEl("div", {
        cls: "cortex-error-hint",
        text: `You regenerated the API key but haven't re-saved the compose file. Click "Open settings" \u2192 Save to vault, then run the rebuild command shown there.`
      });
    } else if (fmt.hint) {
      card.createEl("div", { cls: "cortex-error-hint", text: fmt.hint });
    }
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const actions = card.createEl("div", { cls: "cortex-error-actions" });
    if (this.plugin && (isLocalAuth || fmt.kind === "auth")) {
      const openSettings = actions.createEl("button", { text: "Open settings" });
      openSettings.addEventListener("click", () => {
        this.close();
        const setting = this.app.setting;
        setting.open();
        setting.openTabById(this.plugin.manifest.id);
      });
    }
    const retry = actions.createEl("button", { text: "Retry", cls: "mod-cta" });
    retry.addEventListener("click", async () => {
      this.contentEl.empty();
      await this.onOpen();
    });
  }
};
function formatNumber(n) {
  return n.toLocaleString();
}
function humanizeKey(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
function formatValue(v) {
  if (typeof v === "number") {
    if (v > 0 && v < 1) return `${(v * 100).toFixed(1)}%`;
    return formatNumber(v);
  }
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "yes" : "no";
  return JSON.stringify(v);
}
function renderAsMarkdown(stats, ragStats) {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  const lines = [];
  lines.push(`# HangarX memory stats`);
  lines.push("");
  lines.push(`_Captured ${ts}_`);
  lines.push("");
  lines.push(`- **Entities:** ${formatNumber(stats.totalEntities)}`);
  lines.push(`- **Relationships:** ${formatNumber(stats.totalRelationships)}`);
  lines.push(`- **Entity types:** ${stats.entityTypes.length}`);
  lines.push(`- **Relationship types:** ${stats.relationshipTypes.length}`);
  lines.push("");
  if (stats.entityTypes.length > 0) {
    lines.push(`## Entity types`);
    lines.push("");
    lines.push(`| Type | Count | Sample properties |`);
    lines.push(`|---|---:|---|`);
    for (const et of stats.entityTypes) {
      const props = (et.sampleProperties ?? []).slice(0, 8).join(", ") || "\u2014";
      lines.push(`| ${et.type} | ${formatNumber(et.count)} | ${props} |`);
    }
    lines.push("");
  }
  if (stats.relationshipTypes.length > 0) {
    lines.push(`## Relationship types`);
    lines.push("");
    lines.push(`| Type | Count |`);
    lines.push(`|---|---:|`);
    for (const rt of stats.relationshipTypes) {
      lines.push(`| ${rt.type} | ${formatNumber(rt.count)} |`);
    }
    lines.push("");
  }
  if (ragStats) {
    lines.push(`## GraphRAG orchestrator`);
    lines.push("");
    for (const [k, v] of Object.entries(ragStats)) {
      if (v == null) continue;
      lines.push(`- **${humanizeKey(k)}:** ${formatValue(v)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// src/api.ts
function buildPublicApi(client) {
  return {
    async related(noteName, limit = 10) {
      const items = await client.related(noteName, limit);
      return items.map((r) => ({
        noteName: r.noteName,
        score: r.score,
        snippet: r.snippet,
        source: r.source
      }));
    },
    async ask(query) {
      const res = await client.ask(query);
      return res.answer;
    },
    async askExpanded(query) {
      const res = await client.ask(query);
      return {
        answer: res.answer,
        confidence: res.confidence,
        entities: res.entities.map((e) => ({ name: e.name, type: e.type })),
        documents: res.documents.map((d) => ({ title: d.title, url: d.url, matchPercent: d.matchPercent })),
        citations: res.citations.map((c) => ({ source: c.source, url: c.url })),
        followUps: res.followUps
      };
    },
    async suggestLinks(noteName) {
      const items = await client.suggestLinks(noteName);
      return items.map((s) => ({
        targetNote: s.targetNote,
        reason: s.reason,
        confidence: s.confidence
      }));
    },
    async contradictions(limit = 25) {
      const items = await client.findContradictions(limit);
      return items.map((c) => ({
        conflictType: c.conflictType,
        conflictDescription: c.conflictDescription,
        confidence: c.confidence,
        claim1: { text: c.claim1.text, sourceName: c.claim1.sourceName },
        claim2: { text: c.claim2.text, sourceName: c.claim2.sourceName }
      }));
    },
    async searchEntities(name, limit = 5) {
      return client.searchEntitiesByName(name, limit);
    },
    async pathsBetween(fromNoteName, toNoteName, maxHops = 3) {
      const [fromHits, toHits] = await Promise.all([
        client.searchEntitiesByName(fromNoteName, 5),
        client.searchEntitiesByName(toNoteName, 5)
      ]);
      const from = fromHits.find((h) => h.name === fromNoteName) ?? fromHits[0];
      const to = toHits.find((h) => h.name === toNoteName) ?? toHits[0];
      if (!from || !to) return [];
      const paths = await client.findPaths(from.id, to.id, maxHops);
      return paths.map((p) => ({
        steps: p.steps.map((s) => ({ fromName: s.fromName, toName: s.toName, relType: s.relType })),
        length: p.length
      }));
    },
    async recall(query, limit = 5) {
      const items = await client.recall(query, limit);
      return items.map((m) => ({ id: m.id, content: m.content, createdAt: m.createdAt }));
    },
    async remember(content) {
      await client.remember(content);
    }
  };
}

// src/services/inline-suggestions.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var setSuggestion = import_state.StateEffect.define();
var suggestionField = import_state.StateField.define({
  create: () => null,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setSuggestion)) return e.value;
    if (tr.docChanged && value) {
      return null;
    }
    return value;
  }
});
var GhostWidget = class extends import_view.WidgetType {
  constructor(text) {
    super();
    this.text = text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cortex-inline-ghost";
    span.textContent = this.text;
    return span;
  }
  ignoreEvent() {
    return true;
  }
};
var ghostDecorations = import_state.StateField.define({
  create: () => import_view.Decoration.none,
  update(value, tr) {
    const sug = tr.state.field(suggestionField);
    if (!sug) return import_view.Decoration.none;
    const ghostText = ` \u2192 [[${sug.target}]]`;
    return import_view.Decoration.set([
      import_view.Decoration.widget({ widget: new GhostWidget(ghostText), side: 1 }).range(sug.to)
    ]);
  },
  provide: (f) => import_view.EditorView.decorations.from(f)
});
var TOKEN_RE = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})$/;
var MIN_TOKEN_LEN = 3;
function inlineSuggestionsExtension(client, isEnabled) {
  const cache = /* @__PURE__ */ new Map();
  const isSelfReference = (token, view) => {
    const before = view.state.doc.sliceString(Math.max(0, view.state.selection.main.from - 4), view.state.selection.main.from);
    return before.endsWith("[[" + token);
  };
  const fetcher = import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view;
        this.timer = null;
        this.lastFrom = -1;
      }
      update(u) {
        if (!u.docChanged && !u.selectionSet) return;
        if (!isEnabled()) {
          if (u.state.field(suggestionField, false)) {
            this.view.dispatch({ effects: setSuggestion.of(null) });
          }
          return;
        }
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => this.recompute(), 300);
      }
      destroy() {
        if (this.timer !== null) window.clearTimeout(this.timer);
      }
      async recompute() {
        const view = this.view;
        const sel = view.state.selection.main;
        if (!sel.empty) return this.clear();
        const line = view.state.doc.lineAt(sel.from);
        const before = view.state.doc.sliceString(line.from, sel.from);
        if (/\[\[[^\]]*$/.test(before)) return this.clear();
        const backticks = (before.match(/`/g) || []).length;
        if (backticks % 2 === 1) return this.clear();
        const m = TOKEN_RE.exec(before);
        if (!m) return this.clear();
        const token = m[1];
        if (token.length < MIN_TOKEN_LEN) return this.clear();
        if (isSelfReference(token, view)) return this.clear();
        const tokenStart = line.from + before.length - token.length;
        if (cache.has(token)) {
          const target = cache.get(token);
          if (!target || target === token) return this.clear();
          this.show({ token, target, from: tokenStart, to: tokenStart + token.length });
          return;
        }
        if (this.lastFrom === tokenStart) return;
        this.lastFrom = tokenStart;
        try {
          const hits = await client.searchEntitiesByName(token, 5);
          const exact = hits.find((h) => h.name === token);
          const prefix = hits.find((h) => h.name.toLowerCase().startsWith(token.toLowerCase()) && h.name !== token);
          const best = exact ?? prefix ?? null;
          const target = best?.name ?? null;
          cache.set(token, target);
          if (!target || target === token) return this.clear();
          const nowSel = view.state.selection.main;
          const nowLine = view.state.doc.lineAt(nowSel.from);
          const nowBefore = view.state.doc.sliceString(nowLine.from, nowSel.from);
          const nowMatch = TOKEN_RE.exec(nowBefore);
          if (!nowMatch || nowMatch[1] !== token) return;
          const nowTokenStart = nowLine.from + nowBefore.length - token.length;
          this.show({ token, target, from: nowTokenStart, to: nowTokenStart + token.length });
        } catch {
        }
      }
      show(s) {
        this.view.dispatch({ effects: setSuggestion.of(s) });
      }
      clear() {
        if (this.view.state.field(suggestionField, false)) {
          this.view.dispatch({ effects: setSuggestion.of(null) });
        }
      }
    }
  );
  const suggestionKeymap = import_state.Prec.highest(
    import_view.keymap.of([
      {
        key: "Tab",
        run(view) {
          const sug = view.state.field(suggestionField, false);
          if (!sug) return false;
          view.dispatch({
            changes: { from: sug.from, to: sug.to, insert: `[[${sug.target}]]` },
            selection: { anchor: sug.from + sug.target.length + 4 },
            effects: setSuggestion.of(null)
          });
          return true;
        }
      },
      {
        key: "Escape",
        run(view) {
          const sug = view.state.field(suggestionField, false);
          if (!sug) return false;
          view.dispatch({ effects: setSuggestion.of(null) });
          return true;
        }
      }
    ])
  );
  return [suggestionField, ghostDecorations, fetcher, suggestionKeymap];
}

// src/main.ts
init_mcp_server();
function makeProgressNotice(headline, onCancel) {
  const notice = new import_obsidian11.Notice(headline, 0);
  const root = notice.noticeEl;
  root.addClass("cortex-progress-notice");
  const phaseEl = root.createEl("div", { cls: "cortex-progress-phase", text: "" });
  const bar = root.createEl("progress", { cls: "cortex-progress-bar" });
  bar.max = 100;
  bar.value = 0;
  let cancelBtn = null;
  if (onCancel) {
    cancelBtn = root.createEl("button", {
      cls: "cortex-progress-cancel",
      text: "Cancel"
    });
    cancelBtn.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (cancelBtn) {
        cancelBtn.setText("Cancelling\u2026");
        cancelBtn.setAttr("disabled", "true");
      }
      onCancel();
    });
  }
  let lastTick = 0;
  return {
    notice,
    update: ({ phase, done, total, currentPath }) => {
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      bar.max = total || 1;
      bar.value = done;
      const now = Date.now();
      if (now - lastTick < 100 && done < total) return;
      lastTick = now;
      const verb = phase === "sync" ? "Syncing" : "Removing";
      const where = currentPath ? ` \xB7 ${currentPath.split("/").pop()}` : "";
      phaseEl.setText(`${verb} ${done} / ${total} (${pct}%)${where}`);
    },
    setCancelling: () => {
      if (cancelBtn) {
        cancelBtn.setText("Cancelling\u2026");
        cancelBtn.setAttr("disabled", "true");
      }
    }
  };
}
function promptForText(app, title, placeholder) {
  return new Promise((resolve) => {
    const modal = new class extends import_obsidian11.Modal {
      onOpen() {
        this.titleEl.setText(title);
        const input = this.contentEl.createEl("input", {
          cls: "cortex-prompt-input",
          attr: { type: "text", placeholder, style: "width:100%;padding:8px;margin-bottom:8px;" }
        });
        const btn = this.contentEl.createEl("button", {
          text: "OK",
          attr: { style: "width:100%;" }
        });
        btn.addEventListener("click", () => {
          resolve(input.value.trim() || null);
          this.close();
        });
        input.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter") {
            resolve(input.value.trim() || null);
            this.close();
          }
          if (evt.key === "Escape") {
            resolve(null);
            this.close();
          }
        });
        setTimeout(() => input.focus(), 50);
      }
      onClose() {
        resolve(null);
        this.contentEl.empty();
      }
    }(app);
    modal.open();
  });
}
var CortexPlugin = class extends import_obsidian11.Plugin {
  async onload() {
    await this.loadSettings();
    if (!this.settings.vaultId) {
      this.settings.vaultId = crypto.randomUUID();
      await this.saveSettings();
    }
    if (!this.settings.deviceId) {
      this.settings.deviceId = crypto.randomUUID();
      await this.saveSettings();
    }
    if (!this.settings.deviceName) {
      this.settings.deviceName = defaultDeviceName();
      await this.saveSettings();
    }
    this.client = new CortexClient(this.settings);
    this.sync = new VaultSync(this.app, this.client, this.settings);
    this.conversations = new ConversationStore(this);
    this.mcp = new McpServer(this, this.client, this.settings);
    this.api = buildPublicApi(this.client);
    this.registerEditorExtension(
      inlineSuggestionsExtension(this.client, () => this.settings.inlineSuggestionsEnabled)
    );
    this.registerView(RELATED_VIEW_TYPE, (leaf) => new RelatedView(leaf, this.client));
    this.registerObsidianProtocolHandler("hangarx-callback", (params) => {
      void completeSignIn(params);
    });
    this.addRibbonIcon("refresh-cw", "HangarX: Sync vault to memory layer", () => this.runFullSyncWithFeedback());
    this.addRibbonIcon("plug", "HangarX: Connect agents (Claude, Cursor)", () => {
      this.app.setting?.open?.();
      this.app.setting?.openTabById?.(this.manifest.id);
    });
    this.addRibbonIcon("message-square", "HangarX: Ask your vault", () => {
      new ChatModal(this.app, this.client, this.conversations, this.settings).open();
    });
    this.addCommand({
      id: "cortex-1-sync",
      name: "Sync vault to memory layer",
      callback: () => this.runFullSyncWithFeedback()
    });
    this.addCommand({
      id: "cortex-1b-resync-all",
      name: "Force re-ingest entire vault (after server reset)",
      callback: () => this.runForceResyncWithFeedback()
    });
    this.addCommand({
      id: "cortex-2-connect-agents",
      name: "Connect agents (Claude, Cursor)\u2026",
      callback: () => {
        this.app.setting?.open?.();
        this.app.setting?.openTabById?.(this.manifest.id);
      }
    });
    this.addCommand({
      id: "cortex-3-stats",
      name: "Memory stats",
      callback: () => new GraphStatsModal(this.app, this.client, this).open()
    });
    this.addCommand({
      id: "cortex-ask",
      name: "Ask your vault",
      callback: () => new ChatModal(this.app, this.client, this.conversations, this.settings).open()
    });
    this.addCommand({
      id: "cortex-ingest-url",
      name: "Ingest URL into knowledge graph",
      callback: async () => {
        const url = await promptForText(this.app, "Ingest URL", "Paste a URL to scrape and add to your knowledge graph.");
        if (!url) return;
        const notice = new import_obsidian11.Notice("HangarX: Ingesting URL\u2026", 0);
        try {
          const result = await this.client.ingestUrl(url);
          notice.hide();
          new import_obsidian11.Notice(`\u2705 Ingested! ${result.entityCount ? `${result.entityCount} entities extracted.` : "Processing complete."}`);
        } catch (e) {
          notice.hide();
          new import_obsidian11.Notice(`HangarX ingest failed: ${e.message}`);
        }
      }
    });
    this.addSettingTab(new CortexSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(async () => {
      this.registerEvent(this.app.vault.on("create", (f) => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on("modify", (f) => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on("delete", (f) => this.sync.handleDelete(f)));
      this.registerEvent(this.app.vault.on("rename", (f, old) => this.sync.handleRename(f, old)));
      if (this.settings.syncOnStartup && this.settings.apiKey && this.settings.workspaceId) {
        setTimeout(() => this.sync.fullSync().catch((e) => console.warn("[Cortex] startup sync", e)), 3e3);
      }
      if (this.settings.showRelatedPane) {
        this.activateRelatedView();
      }
      if (this.settings.mcpEnabled && this.settings.apiKey && this.settings.workspaceId) {
        setTimeout(() => this.toggleMcpServer(true), 1500);
      }
    });
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(RELATED_VIEW_TYPE);
    cancelSignIn();
    await this.mcp?.stop().catch(() => {
    });
  }
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
    if (this.settings.apiUrl === "https://cortex.hangarx.com") {
      this.settings.apiUrl = "https://cortex.hangarx.ai";
      await this.saveData(this.settings);
    }
    if (this.settings.connectionMode === "self-hosted") {
      this.settings.connectionMode = "local";
      await this.saveData(this.settings);
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
    if (this.client) this.client = new CortexClient(this.settings);
  }
  /**
   * Toggle the local MCP server. Called from settings on enable/disable.
   */
  async toggleMcpServer(enabled) {
    if (enabled) {
      if (!this.settings.mcpToken) {
        this.settings.mcpToken = generateToken();
        await this.saveSettings();
      }
      try {
        await this.mcp.start();
      } catch (e) {
        new import_obsidian11.Notice(`HangarX MCP: failed to start (${e.message})`);
        this.settings.mcpEnabled = false;
        await this.saveSettings();
      }
    } else {
      await this.mcp.stop();
    }
  }
  async activateRelatedView() {
    const existing = this.app.workspace.getLeavesOfType(RELATED_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: RELATED_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }
  /**
   * Wrap fullSync with pre-flight checks + visible error feedback.
   */
  async runFullSyncWithFeedback() {
    const s = this.settings;
    if (!s.apiKey) {
      new import_obsidian11.Notice("HangarX: API key is empty. Open Settings \u2192 Connection.");
      return;
    }
    if (!s.workspaceId) {
      new import_obsidian11.Notice("HangarX: Workspace ID is empty. Open Settings \u2192 Connection.");
      return;
    }
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new import_obsidian11.Notice("HangarX: vault has no markdown files to sync.");
      return;
    }
    const abort = new AbortController();
    const progress = makeProgressNotice(
      `HangarX: syncing ${fileCount} files\u2026`,
      () => abort.abort()
    );
    try {
      const result = await this.sync.fullSync({
        onProgress: progress.update,
        signal: abort.signal
      });
      progress.notice.hide();
      const { synced, skipped, deleted, failed = 0, failedPaths = [], paused } = result;
      if (paused === "cancelled") {
        new import_obsidian11.Notice(`\u23F9 HangarX sync cancelled \u2014 ${synced} synced, ${skipped} unchanged so far.`, 5e3);
        return;
      }
      const headline = failed > 0 ? `\u26A0\uFE0F HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed, ${failed} FAILED` : `\u2705 HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed`;
      new import_obsidian11.Notice(headline, failed > 0 ? 1e4 : 4e3);
      if (failed > 0) {
        const sample = failedPaths.slice(0, 3).join(", ");
        const more = failedPaths.length > 3 ? ` (+${failedPaths.length - 3} more)` : "";
        new import_obsidian11.Notice(`Failures: ${sample}${more}`, 1e4);
      }
      if (synced === 0 && skipped > 0) {
        try {
          const stats = await this.client.getGraphStats();
          if (stats.totalEntities === 0) {
            new import_obsidian11.Notice(
              `\u26A0\uFE0F Index says ${skipped} files are already synced, but the server graph is empty. Run "Force re-ingest entire vault" from the command palette to re-push everything.`,
              12e3
            );
          }
        } catch {
        }
      } else if (synced === 0 && skipped > 0 && deleted === 0) {
        new import_obsidian11.Notice("Everything was already up to date.");
      }
    } catch (e) {
      progress.notice.hide();
      const msg = e.message || String(e);
      console.error("[Cortex] fullSync failed:", e);
      new import_obsidian11.Notice(`HangarX sync failed: ${truncate(msg, 200)}`, 8e3);
    }
  }
  /**
   * Force-resync: clear the per-file index then run a full sync.
   */
  async runForceResyncWithFeedback() {
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new import_obsidian11.Notice("HangarX: vault has no markdown files to sync.");
      return;
    }
    const confirmed = confirm(
      `Force-resync ${fileCount} files into the memory layer?

This wipes the local sync index and re-pushes every file. Use this after the server-side graph has been reset (e.g. Docker volume wiped). It's safe \u2014 your notes themselves aren't touched.`
    );
    if (!confirmed) return;
    const abort = new AbortController();
    const progress = makeProgressNotice(
      `HangarX: clearing index + re-pushing ${fileCount} files\u2026`,
      () => abort.abort()
    );
    try {
      await this.sync.clearIndex();
      const result = await this.sync.fullSync({
        onProgress: progress.update,
        signal: abort.signal
      });
      progress.notice.hide();
      const { synced, skipped, deleted, paused } = result;
      if (paused === "cancelled") {
        new import_obsidian11.Notice(`\u23F9 Force-resync cancelled \u2014 ${synced} re-ingested so far.`, 5e3);
        return;
      }
      new import_obsidian11.Notice(`\u2705 Force-resync done: ${synced} ingested, ${skipped} skipped, ${deleted} removed`, 8e3);
    } catch (e) {
      progress.notice.hide();
      const msg = e.message || String(e);
      console.error("[Cortex] forceResync failed:", e);
      new import_obsidian11.Notice(`HangarX force-resync failed: ${truncate(msg, 200)}`, 8e3);
    }
  }
};
function truncate(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "\u2026";
}
