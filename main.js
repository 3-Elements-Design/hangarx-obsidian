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

// src/services/confirm-modal.ts
function confirmModal(app, opts) {
  return new Promise((resolve) => {
    let answered = false;
    const settle = (value) => {
      if (answered) return;
      answered = true;
      resolve(value);
    };
    const modal = new class extends import_obsidian3.Modal {
      onOpen() {
        this.titleEl.setText(opts.title);
        for (const paragraph of opts.body.split(/\n{2,}/)) {
          this.contentEl.createEl("p", { text: paragraph });
        }
        new import_obsidian3.Setting(this.contentEl).addButton((b) => b.setButtonText(opts.cancelText ?? "Cancel").onClick(() => {
          settle(false);
          this.close();
        })).addButton((b) => {
          b.setButtonText(opts.confirmText ?? "Confirm");
          if (opts.destructive) b.setWarning();
          else b.setCta();
          b.onClick(() => {
            settle(true);
            this.close();
          });
        });
      }
      onClose() {
        settle(false);
        this.contentEl.empty();
      }
    }(app);
    modal.open();
  });
}
var import_obsidian3;
var init_confirm_modal = __esm({
  "src/services/confirm-modal.ts"() {
    "use strict";
    import_obsidian3 = require("obsidian");
  }
});

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
  const normalized = (0, import_obsidian5.normalizePath)(folderPath);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof import_obsidian5.TFolder) return;
  if (existing) return;
  await app.vault.createFolder(normalized);
}
function uniquePath(app, folder, basename) {
  const base = (0, import_obsidian5.normalizePath)(`${folder}/${basename}`);
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
  const path = uniquePath(app, folder, `${dateStamp()} - ${title}`);
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
  const path = uniquePath(app, folder, `${dateStamp(data.createdAt)} - ${title}`);
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
  const path = uniquePath(app, folder, `${dateStamp()} - ${title}`);
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
var import_obsidian5;
var init_vault_writer = __esm({
  "src/services/vault-writer.ts"() {
    "use strict";
    import_obsidian5 = require("obsidian");
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
    const req = globalThis.require;
    return typeof req === "function" ? req("http") : null;
  } catch {
    return null;
  }
}
function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var import_obsidian6, McpServer, REQ, BRIDGE_SCRIPT;
var init_mcp_server = __esm({
  "src/services/mcp-server.ts"() {
    "use strict";
    import_obsidian6 = require("obsidian");
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
          const srv = http.createServer((req, res) => {
            this.handleRequest(req, res);
          });
          srv.on("error", (err) => reject(err));
          srv.listen(this.port, "127.0.0.1", () => {
            this.server = srv;
            new import_obsidian6.Notice(`Cortex MCP server listening on 127.0.0.1:${this.port}`);
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
        if (adapter instanceof import_obsidian6.FileSystemAdapter) {
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
      // No top-level await — the awaits live inside the `req.on('end')`
      // callback's IIFE. Dropping `async` satisfies @typescript-eslint/
      // require-await without changing behaviour.
      handleRequest(req, res) {
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
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32001, message: "unauthorized \u2014 invalid or missing bearer token" }
          }));
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
        req.on("end", () => {
          void (async () => {
            let request;
            try {
              request = JSON.parse(body);
            } catch {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }));
              return;
            }
            const reply = await this.dispatch(request);
            if (reply == null) {
              res.writeHead(202);
              res.end();
              return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(reply));
          })();
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
                  serverInfo: { name: "hangarx", version: "0.1.0" },
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
              const params = req.params ?? {};
              const { name, arguments: args } = params;
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
              const callArgs = args && typeof args === "object" && !Array.isArray(args) ? args : {};
              const result = await tool.handler(callArgs);
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
            handler: (args) => {
              const { query, limit } = args;
              return c.recall(query, limit ?? 5);
            }
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
            handler: async (args) => {
              const { content, title, category, tags } = args;
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
            handler: (args) => {
              const { noteName, limit } = args;
              return c.related(noteName, limit ?? 10);
            }
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
            handler: async (args) => {
              const { fromNote, toNote, maxHops } = args;
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
            handler: (args) => {
              const { name, limit } = args;
              return c.searchEntitiesByName(name, limit ?? 10);
            }
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
            handler: (args) => {
              const { limit } = args;
              return c.findContradictions(limit ?? 25);
            }
          },
          {
            name: "cortex_suggest_links",
            description: "For a specific note, suggest other notes/entities the user should consider linking to. Useful when helping the user develop a note further or build out their knowledge graph. Driven by entity-extraction across the vault.",
            inputSchema: {
              type: "object",
              properties: { noteName: { type: "string", description: "Note to suggest links for." } },
              required: ["noteName"]
            },
            handler: (args) => {
              const { noteName } = args;
              return c.suggestLinks(noteName);
            }
          },
          {
            name: "cortex_ask",
            description: "Ask a synthesized natural-language question against the user's knowledge base. Returns a generated answer with citations. Prefer cortex_recall for raw retrieval \u2014 use cortex_ask when the user wants a one-shot summarized answer rather than individual sources.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", description: "Question in natural language." } },
              required: ["query"]
            },
            handler: async (args) => {
              const { query } = args;
              const r = await c.ask(query);
              return {
                answer: r.answer,
                confidence: r.confidence,
                citations: r.citations.map((x) => ({ source: x.source, url: x.url })),
                entities: r.entities.map((x) => ({ name: x.name, type: x.type }))
              };
            }
          },
          // ── Graph introspection (totals + breakdowns for the whole vault) ──
          {
            name: "cortex_stats",
            description: `Return totals and per-type breakdowns for the user's whole knowledge graph: total entity count, total relationship count, top entity types with counts and sample properties, and top relationship types with counts. Use when the user asks "how many notes/entities/relationships do I have?", "what kinds of things are in my graph?", or wants a high-level overview of vault scale and structure. This is a single O(1) query against the graph backend \u2014 far better than enumerating via cortex_search_entities.`,
            inputSchema: {
              type: "object",
              properties: {}
            },
            handler: async () => {
              const stats = await c.getGraphStats();
              return {
                totalEntities: stats.totalEntities,
                totalRelationships: stats.totalRelationships,
                entityTypes: stats.entityTypes.slice(0, 25),
                relationshipTypes: stats.relationshipTypes.slice(0, 25)
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
            handler: async (args) => {
              const { url, title } = args;
              return c.ingestUrl(url, title);
            }
          }
        ];
      }
    };
    REQ = "require";
    BRIDGE_SCRIPT = `#!/usr/bin/env node
// Cortex MCP stdio\u2194HTTP bridge \u2014 auto-generated by the hangarx plugin.
// Do not edit; this file is rewritten on every MCP enable.
'use strict';

const http = ${REQ}('http');
const url = ${REQ}('url');
const readline = ${REQ}('readline');

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
      // Defensive: if the server returned a non-2xx status, the body may
      // not be a valid JSON-RPC envelope. Wrap it in one so the MCP
      // client gets an actionable error instead of a Zod validation
      // explosion. 2xx responses are forwarded as-is.
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        if (trimmed) process.stdout.write(trimmed + '\\n');
        return;
      }
      var msg = 'cortex-api returned HTTP ' + res.statusCode;
      try {
        var parsed = trimmed ? JSON.parse(trimmed) : null;
        if (parsed && parsed.error && typeof parsed.error.message === 'string') {
          msg += ' \u2014 ' + parsed.error.message;
        } else if (parsed && typeof parsed.error === 'string') {
          msg += ' \u2014 ' + parsed.error;
        } else if (trimmed) {
          msg += ' \u2014 ' + trimmed.slice(0, 200);
        }
      } catch (e) {
        if (trimmed) msg += ' \u2014 ' + trimmed.slice(0, 200);
      }
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id == null ? null : request.id,
        error: { code: -32000, message: msg },
      }) + '\\n');
    });
  });
  req.on('error', function (err) {
    if (isNotification) return;
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id == null ? null : request.id,
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

// src/services/conversation-store.ts
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
var FILENAME, MAX_CONVERSATIONS, ConversationStore;
var init_conversation_store = __esm({
  "src/services/conversation-store.ts"() {
    "use strict";
    FILENAME = "conversations.json";
    MAX_CONVERSATIONS = 50;
    ConversationStore = class {
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
  }
});

// src/services/error-format.ts
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
var PATTERNS;
var init_error_format = __esm({
  "src/services/error-format.ts"() {
    "use strict";
    PATTERNS = [
      // LLM-provider-specific patterns. These have to come BEFORE the generic
      // 4xx/5xx patterns because the upstream message bubbles through with the
      // original status (e.g. Gemini "API key expired" arrives as 400).
      {
        match: /HuggingFace denied this request|Inference-Providers access/i,
        kind: "auth",
        headline: "HuggingFace denied this request",
        hint: `Your HF token can't access this inference provider. Either (a) enable provider access at https://huggingface.co/settings/inference-providers and add credits if it's a paid provider (novita / fireworks-ai / together), or (b) switch the model in Settings \u2192 HangarX \u2192 LLM to one with the ":hf-inference" suffix (free serverless tier).`
      },
      {
        match: /api key expired|expired api key|renew the api key/i,
        kind: "auth",
        headline: "LLM provider API key expired",
        hint: "The Gemini/OpenAI/Anthropic key the server is using has expired. Open Settings \u2192 HangarX \u2192 LLM and paste a fresh key, then save."
      },
      {
        match: /api key not valid|invalid api key|incorrect api key/i,
        kind: "auth",
        headline: "LLM provider rejected the API key",
        hint: "The key the server sent isn't valid. Open Settings \u2192 HangarX \u2192 LLM and paste a working key, then save."
      },
      {
        match: /quota.*exceeded|exceeded.*quota|billing|insufficient_quota|resource.?exhausted/i,
        kind: "rate_limit",
        headline: "LLM provider quota exceeded",
        hint: "Your LLM provider account is out of quota or unbilled. Top up the provider account or switch to a different provider in Settings \u2192 HangarX \u2192 LLM."
      },
      {
        match: /high demand|temporarily unavailable|model is overloaded|UNAVAILABLE/i,
        kind: "server",
        headline: "LLM provider temporarily unavailable",
        hint: "The model is overloaded on the provider's side. Wait a minute and retry, or switch model in Settings \u2192 HangarX \u2192 LLM."
      },
      {
        match: /\b(401|UNAUTHORIZED|AUTH_ERROR|INVALID_API_KEY|invalid bearer)\b/i,
        kind: "auth",
        headline: "Authentication failed",
        hint: "Open Settings \u2192 HangarX. In Cloud mode, sign in again or regenerate your API key in the dashboard. In Local mode, your container is running an older build that still requires a key \u2014 re-save the Compose file and rebuild with `docker compose -f docker-compose.cortex.yml up -d --force-recreate`."
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
        match: /\b(503|SERVICE_UNAVAILABLE)\b/i,
        kind: "server",
        headline: "Service temporarily unavailable",
        hint: "The upstream service is overloaded. Wait a moment and retry."
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
  }
});

// src/assets.ts
function appendHangarxLogo(target) {
  target.empty();
  const parsed = new DOMParser().parseFromString(HANGARX_LOGO_SVG, "image/svg+xml");
  const root = parsed.documentElement;
  if (root && root.tagName.toLowerCase() === "svg") {
    target.appendChild(root);
  }
}
var HANGARX_LOGO_SVG;
var init_assets = __esm({
  "src/assets.ts"() {
    "use strict";
    HANGARX_LOGO_SVG = `<svg width="108" height="25" viewBox="0 0 108 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HangarX">
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
  }
});

// src/views/starters-modal.ts
var starters_modal_exports = {};
__export(starters_modal_exports, {
  StartersModal: () => StartersModal
});
var import_obsidian10, StartersModal;
var init_starters_modal = __esm({
  "src/views/starters-modal.ts"() {
    "use strict";
    import_obsidian10 = require("obsidian");
    init_chat_panel();
    StartersModal = class extends import_obsidian10.Modal {
      constructor(app, onPick) {
        super(app);
        this.onPick = onPick;
        this.query = "";
      }
      onOpen() {
        this.modalEl.addClass("cortex-starters-modal");
        this.titleEl.empty();
        const head = this.titleEl.createDiv({ cls: "cortex-starters-head" });
        head.createDiv({ cls: "cortex-starters-title", text: "Starter prompts" });
        head.createDiv({
          cls: "cortex-starters-sub",
          text: "Pick one to fill the chat composer. Type to filter."
        });
        const search = this.contentEl.createDiv({ cls: "cortex-starters-search" });
        const ic = search.createSpan({ cls: "cortex-starters-search-icon" });
        (0, import_obsidian10.setIcon)(ic, "search");
        const input = search.createEl("input", {
          cls: "cortex-starters-search-input",
          attr: { type: "text", placeholder: "Search starters by name, category, or content\u2026" }
        });
        input.addEventListener("input", () => {
          this.query = input.value.trim().toLowerCase();
          this.renderList();
        });
        activeWindow.setTimeout(() => input.focus(), 50);
        this.listEl = this.contentEl.createDiv({ cls: "cortex-starters-list" });
        this.renderList();
      }
      onClose() {
        this.contentEl.empty();
        this.titleEl.empty();
      }
      renderList() {
        this.listEl.empty();
        const q = this.query;
        const filtered = q ? STARTER_CATALOG.filter(
          (p) => p.label.toLowerCase().includes(q) || p.text.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        ) : STARTER_CATALOG;
        if (filtered.length === 0) {
          this.listEl.createDiv({
            cls: "cortex-starters-empty",
            text: `No starters match "${this.query}". Try a different keyword.`
          });
          return;
        }
        const grouped = /* @__PURE__ */ new Map();
        for (const p of filtered) {
          const arr = grouped.get(p.category) ?? [];
          arr.push(p);
          grouped.set(p.category, arr);
        }
        for (const [category, prompts] of grouped) {
          const section = this.listEl.createDiv({ cls: "cortex-starters-section" });
          section.createDiv({ cls: "cortex-starters-section-label", text: category });
          const grid = section.createDiv({ cls: "cortex-starters-grid" });
          for (const p of prompts) {
            const card = grid.createDiv({
              cls: "cortex-starters-card",
              attr: { role: "button", tabindex: "0" }
            });
            const cardIcon = card.createSpan({ cls: "cortex-starters-card-icon" });
            (0, import_obsidian10.setIcon)(cardIcon, p.icon);
            const body = card.createDiv({ cls: "cortex-starters-card-body" });
            body.createDiv({
              cls: "cortex-starters-card-label",
              text: this.highlight(p.label)
            });
            body.createDiv({
              cls: "cortex-starters-card-text",
              text: p.text
            });
            const pick = () => {
              this.onPick(p.text);
              this.close();
            };
            card.addEventListener("click", pick);
            card.addEventListener("keydown", (evt) => {
              if (evt.key === "Enter" || evt.key === " ") {
                evt.preventDefault();
                pick();
              }
            });
          }
        }
      }
      /** Cheap highlight — just the label since text is too long to scan. */
      highlight(s) {
        return s;
      }
    };
  }
});

// src/views/chat-panel.ts
function isSimpleQuery(text) {
  const q = text.trim();
  if (q.length === 0 || q.length > 240) return false;
  const lower = q.toLowerCase();
  const META_VAULT_PATTERNS = [
    /\bin my vault\b/,
    /\bmy vault\b/,
    /\bmy notes\b/,
    /\bmy graph\b/,
    /\bin my graph\b/,
    /\bmy knowledge graph\b/,
    /\beverything\b/,
    /\bsummary of\b/,
    /\bsummarize\b/,
    /\bsummarise\b/,
    /\boverview\b/,
    /\bwhat (?:do you|can you) (?:see|find|know)\b/,
    /\bhow many (?:notes|entities|files)\b/,
    /\bshow me (?:my|all|everything)\b/,
    /\blist my\b/,
    /\bshow (?:my|all)\b/
  ];
  for (const re of META_VAULT_PATTERNS) {
    if (re.test(lower)) return false;
  }
  const COMPLEX_TERMS = [
    "compare",
    "comparison",
    "difference",
    "differs",
    "differ ",
    "analyze",
    "analysis",
    "across",
    "all my",
    "every",
    "each",
    "trend",
    "over time",
    "evolution",
    "evolved",
    "summarize all",
    "summarise all",
    "pull every",
    "find every",
    "how does",
    "how do ",
    "how is ",
    "how are ",
    "why does",
    "why do ",
    "why is ",
    "why are ",
    "walk me through",
    "reasoning behind",
    "connect",
    "connection",
    "relate",
    "relationship between",
    "related to",
    "pattern",
    "theme",
    "top ",
    "most ",
    "group by",
    "sort by",
    "list every",
    "list all",
    "inverse",
    "opposite"
  ];
  for (const term of COMPLEX_TERMS) {
    if (lower.includes(term)) return false;
  }
  const sentences = q.split(/[.?!]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) return false;
  const factPrefixes = /^(what(?: is| are| was| were| does| did)?|who(?: is| was| are)?|where|when|which|show me|find me?|tell me about|give me|list)\b/;
  if (factPrefixes.test(lower)) return true;
  if (q.split(/\s+/).length <= 8 && !/[?]/.test(q)) return true;
  return false;
}
function isGraphEngineCorrupted(leaf) {
  try {
    const view = leaf.view;
    const engine = view?.dataEngine ?? view?.renderer?.engine ?? view?.engine;
    if (!engine) return false;
    const fo = engine.filterOptions;
    if (!fo || typeof fo !== "object") return false;
    return typeof fo.search === "string";
  } catch {
    return false;
  }
}
function findGraphFilterSearchInput(root) {
  const taggedSection = root.querySelector(
    '.graph-control-section[data-section="filter"], .graph-control-section[data-section-id="filter"], .tree-item.graph-control-section.mod-search'
  );
  if (taggedSection) {
    const input = taggedSection.querySelector('input[type="search"], input[type="text"]');
    if (input) return input;
  }
  const byPlaceholder = root.querySelector(
    '.graph-controls input[placeholder*="earch"]'
  );
  if (byPlaceholder) return byPlaceholder;
  const firstSection = root.querySelector(".graph-control-section, .graph-controls");
  return firstSection?.querySelector('input[type="search"], input[type="text"]') ?? null;
}
function toolCallIcon(name) {
  switch (name) {
    case "knowledge_graph_search":
      return "search";
    case "cortex_paths":
      return "route";
    case "cortex_recall":
      return "history";
    case "cortex_remember":
      return "bookmark-plus";
    case "delegate":
      return "git-branch";
    case "web_search":
      return "globe";
    case "web_scrape":
      return "file-text";
    case "get_current_time":
      return "clock";
    case "calculator":
      return "calculator";
    default:
      return "tool";
  }
}
function toolPhasePhrase(name) {
  switch (name) {
    case "knowledge_graph_search":
      return "Querying knowledge graph";
    case "cortex_paths":
      return "Tracing connections";
    case "cortex_recall":
      return "Recalling from memory";
    case "cortex_remember":
      return "Saving to memory";
    case "delegate":
      return "Delegating to sub-agent";
    case "web_search":
      return "Searching the web";
    case "web_scrape":
      return "Reading web page";
    case "get_current_time":
      return "Checking the time";
    case "calculator":
      return "Calculating";
    default:
      return `Using ${name}`;
  }
}
function prettifyToolCallName(name) {
  switch (name) {
    case "knowledge_graph_search":
      return "Searched vault";
    case "cortex_paths":
      return "Traced connections";
    case "cortex_recall":
      return "Recalled from memory";
    case "cortex_remember":
      return "Saved to memory";
    case "delegate":
      return "Delegated to sub-agent";
    case "web_search":
      return "Searched the web";
    case "web_scrape":
      return "Read web page";
    case "get_current_time":
      return "Checked the date";
    case "calculator":
      return "Calculated";
    default:
      return name;
  }
}
function summarizeToolCallArgs(name, args) {
  const get = (k) => typeof args[k] === "string" ? args[k] : null;
  let s = null;
  switch (name) {
    case "knowledge_graph_search":
    case "web_search":
    case "cortex_recall":
      s = get("query");
      break;
    case "cortex_remember":
      s = get("content");
      break;
    case "delegate":
      s = get("goal");
      break;
    case "web_scrape":
      s = get("url");
      break;
    case "cortex_paths": {
      const from = get("from");
      const to = get("to");
      s = from && to ? `${from} \u2192 ${to}` : null;
      break;
    }
    case "calculator":
      s = get("expression");
      break;
  }
  if (!s) return "";
  return s.length > 60 ? `${s.slice(0, 60)}\u2026` : s;
}
function uniqueNames(entities) {
  const set = /* @__PURE__ */ new Set();
  for (const e of entities) {
    if (e.name && e.name.length >= 2) set.add(e.name);
  }
  return Array.from(set).sort();
}
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
function formatToolDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0ms";
  if (ms < 1e3) return `${Math.round(ms)}ms`;
  const s = ms / 1e3;
  if (s < 10) return `${s.toFixed(1)}s`;
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s - m * 60);
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}
function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
var import_obsidian11, DAILY_RITUAL_PROMPTS, STARTER_CATALOG, MAX_ATTACHMENT_CHARS, TEXT_EXTENSIONS, ChatPanel;
var init_chat_panel = __esm({
  "src/views/chat-panel.ts"() {
    "use strict";
    import_obsidian11 = require("obsidian");
    init_conversation_store();
    init_vault_writer();
    init_error_format();
    init_assets();
    DAILY_RITUAL_PROMPTS = [
      {
        icon: "play-circle",
        label: "Resume",
        text: "Pick up where I left off yesterday. What was I working on at end of day, and what should I pick up first this morning? Cite the notes and quote the unfinished thread."
      },
      {
        icon: "clipboard-list",
        label: "Today's brief",
        text: "Generate today's standup: what I shipped yesterday (with note links), what's blocking me, and the top 3 things I should tackle today. Keep it tight."
      },
      {
        icon: "list-checks",
        label: "Open tasks",
        text: "Show every unfinished `- [ ]` task across my vault, grouped by project. Sort by recency within each group. Flag anything overdue or with a due:: date."
      },
      {
        icon: "book-open",
        label: "Summarize vault",
        text: "Give me a high-level summary of my entire vault: the major themes, the projects I work on, the people and entities I mention most, and how recently each area has been active. Treat it like an exec summary of my second brain."
      }
    ];
    STARTER_CATALOG = [
      // Daily
      ...DAILY_RITUAL_PROMPTS.map((p) => ({ ...p, category: "Daily" })),
      // Reviews
      { category: "Reviews", icon: "history", label: "Catch me up", text: "Summarize what I've been working on this week. Group by project, highlight key decisions, and call out anything still open." },
      { category: "Reviews", icon: "calendar", label: "Weekly review", text: "Run a weekly review: what I accomplished, what slipped, what I learned, and the 3 most important things for next week. Use my notes from the last 7 days as evidence." },
      { category: "Reviews", icon: "calendar-days", label: "Monthly review", text: "Run a monthly retrospective. Major themes worked on, decisions made, projects shipped, projects abandoned, and patterns across my notes from the past 30 days." },
      { category: "Reviews", icon: "clock", label: "What's stale", text: "List projects I've mentioned in the last 14 days but haven't touched in 7+ days. For each, surface the last note, who/what is blocking, and the most recent open question." },
      // Knowledge / discovery
      { category: "Knowledge", icon: "sparkles", label: "Top themes", text: "What are the top 5 themes I write about across my entire vault? For each theme, list the most foundational notes and the most recent ones." },
      { category: "Knowledge", icon: "graduation-cap", label: "What I've learned", text: "What have I learned this month? Pull novel concepts, frameworks, or insights I captured in notes \u2014 distinguish between things I actively studied and things I picked up incidentally." },
      { category: "Knowledge", icon: "box", label: "Concepts I use most", text: "Which concepts, frameworks, or mental models do I reference most often across notes? For each, summarize what it means in my own words and where I first introduced it." },
      { category: "Knowledge", icon: "search", label: "Find blind spots", text: "What topics or entities appear frequently across my notes but don't have a dedicated note explaining them? Suggest 3-5 candidates worth writing up as MOC (map-of-content) notes." },
      { category: "Knowledge", icon: "book-open", label: "Reading list mentions", text: "Surface every book, paper, or article I've referenced across my notes. Indicate which ones I've actually read versus only cited." },
      // Tasks
      { category: "Tasks", icon: "list-checks", label: "Tasks by project", text: "Show every unfinished `- [ ]` task across my vault, grouped by project. Sort by recency within each group. Flag anything overdue or with a due:: date." },
      { category: "Tasks", icon: "alert-triangle", label: "Overdue tasks", text: "Find all open tasks across my vault with a due date in the past. Sort by how overdue they are and surface the originating note." },
      { category: "Tasks", icon: "inbox", label: "Process my inbox", text: "Find notes I've created or edited in the last 7 days that don't have any tags, aren't linked from any other note, and aren't in a folder. Suggest a place for each one." },
      // Decisions
      { category: "Decisions", icon: "lightbulb", label: "Surface decisions", text: "What important decisions have I documented in the last month? For each one, give me the decision, the reasoning behind it, and any open questions left unanswered." },
      { category: "Decisions", icon: "help-circle", label: "Open questions", text: 'Find unresolved questions in my notes \u2014 places where I wrote something like "TODO research", "open question", or asked myself a question I never answered. Group by topic.' },
      { category: "Decisions", icon: "refresh-ccw", label: "Changed my mind", text: "Find topics where I've changed my mind over time \u2014 places where my recent notes contradict or revise my earlier ones. Surface the before/after with evidence." },
      // Connections
      { category: "Connections", icon: "route", label: "Trace connections", text: "Find two ideas in my recent notes that seem unrelated but are actually connected through other concepts. Walk me through the path between them." },
      { category: "Connections", icon: "git-merge", label: "Hidden links", text: "Find pairs of notes that should probably reference each other but don't. Suggest links to add and explain why." },
      { category: "Connections", icon: "puzzle", label: "Repeated ideas", text: "Identify ideas, concepts, or quotes that I've restated in multiple notes \u2014 possibly without realizing. Suggest which note should be canonical and which should link." },
      // Writing
      { category: "Writing", icon: "pen-tool", label: "Drafts to revise", text: "List notes I've drafted but haven't come back to revise. Surface anything tagged #draft, marked TODO, or with FIXMEs in the body. Sort by age." },
      { category: "Writing", icon: "expand", label: "Expand an outline", text: "Find an outline-style note in my vault that I haven't fleshed out yet. Walk through what it would take to expand each bullet into full prose, citing supporting notes." },
      { category: "Writing", icon: "feather", label: "Find quotable lines", text: "Surface 5-10 of my most quotable lines from notes I've written this year \u2014 original phrases, not citations from others. Include source note for each." },
      // People
      { category: "People", icon: "users", label: "People I mention", text: "List the people I mention most across my notes. For each, summarize the context I usually mention them in and the last time I wrote about them." },
      { category: "People", icon: "message-square", label: "Conversation log", text: "Pull every note that captures a conversation, meeting, or interview. Group by person/team and surface the key points and any follow-ups I committed to." },
      // Discovery / playful
      { category: "Discovery", icon: "compass", label: "Random walk", text: "Pick a random note from my vault and tell me three other notes I've written that connect to it in non-obvious ways. Show me the path." },
      { category: "Discovery", icon: "sparkle", label: "Surprise me", text: "Surface something interesting I've forgotten \u2014 a note from 6+ months ago that's relevant to what I'm working on now, or an idea I had once and never followed up on." }
    ];
    MAX_ATTACHMENT_CHARS = 1e5;
    TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
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
    ChatPanel = class {
      constructor(app, client, store, settings, host) {
        this.app = app;
        this.client = client;
        this.store = store;
        this.settings = settings;
        this.renderComponent = new import_obsidian11.Component();
        this.historyPopover = null;
        this.hasMessages = false;
        this.currentTurns = [];
        this.currentTitle = "";
        this.currentCreatedAt = 0;
        this.allEntities = [];
        this.allCitations = [];
        this.pendingAttachments = [];
        this.statusPillEl = null;
        this.statusPollTimer = null;
        // Smart "ask the current note" — when on, prepends the active editor's
        // file as context to the next prompt. Toggled via a chip above the
        // composer; auto-updates as the user navigates between notes.
        this.askAboutActiveFile = false;
        this.activeFileChipEl = null;
        this.activeFileWatcher = null;
        this.onOutsideClick = (evt) => {
          if (!this.historyPopover) return;
          const target = evt.target;
          if (this.historyPopover.contains(target) || this.historyBtn.contains(target)) return;
          this.closeHistoryPopover();
        };
        this.host = host;
        this.sessionId = crypto.randomUUID();
      }
      mount() {
        this.renderComponent.load();
        const { titleEl, contentEl } = this.host;
        titleEl.empty();
        const title = titleEl.createDiv({ cls: "cortex-chat-title" });
        title.createSpan({ cls: "cortex-chat-title-text", text: "Ask your vault" });
        this.statusPillEl = title.createSpan({ cls: "cortex-chat-mode-pill" });
        this.renderModePill("checking");
        void this.runModeProbe();
        const actions = title.createDiv({ cls: "cortex-chat-title-actions" });
        this.historyBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "Conversation history" } });
        (0, import_obsidian11.setIcon)(this.historyBtn, "history");
        this.historyBtn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          this.toggleHistoryPopover();
        });
        this.newChatBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "New chat" } });
        (0, import_obsidian11.setIcon)(this.newChatBtn, "plus");
        this.newChatBtn.addEventListener("click", () => this.resetConversation());
        this.exportBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "Export conversation to note" } });
        (0, import_obsidian11.setIcon)(this.exportBtn, "file-down");
        this.exportBtn.addEventListener("click", () => {
          void this.exportConversation();
        });
        this.exportBtn.addClass("is-hidden");
        this.outputEl = contentEl.createDiv({ cls: "cortex-chat-output" });
        this.renderEmptyState();
        const composerWrap = contentEl.createDiv({ cls: "cortex-chat-composer-wrap" });
        this.activeFileChipEl = composerWrap.createDiv({ cls: "cortex-chat-active-file-chip is-hidden" });
        this.attachmentsEl = composerWrap.createDiv({ cls: "cortex-chat-attachments is-empty" });
        const composer = composerWrap.createDiv({ cls: "cortex-chat-composer" });
        this.refreshActiveFileChip();
        const evRef = this.app.workspace.on("active-leaf-change", () => this.refreshActiveFileChip());
        this.renderComponent.register(() => this.app.workspace.offref(evRef));
        this.attachBtn = composer.createEl("button", {
          cls: "cortex-chat-attach",
          attr: { "aria-label": "Attach file (text only, ephemeral)", type: "button" }
        });
        (0, import_obsidian11.setIcon)(this.attachBtn, "paperclip");
        this.fileInputEl = composer.createEl("input", {
          cls: "cortex-chat-file-input cortex-hidden-file-input",
          attr: { type: "file", multiple: "true" }
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
        (0, import_obsidian11.setIcon)(this.askBtn, "arrow-up");
        this.askBtn.addEventListener("click", () => {
          void this.submit();
        });
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
        const hint = composerWrap.createDiv({ cls: "cortex-chat-hint" });
        hint.createSpan({ text: "\u21B5 to send \xB7 \u21E7\u21B5 for newline \xB7 Esc (empty input) for new chat" });
        this.inputEl.addEventListener("input", () => {
          this.autoResize();
          this.askBtn.toggleAttribute("disabled", this.inputEl.value.trim().length === 0);
        });
        this.inputEl.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter" && !evt.shiftKey && !evt.isComposing) {
            evt.preventDefault();
            void this.submit();
          } else if (evt.key === "Escape" && this.inputEl.value.length === 0 && this.hasMessages) {
            evt.preventDefault();
            this.resetConversation();
          }
        });
        this.inputEl.focus();
      }
      /** Called when the host (Modal/ItemView) tears down. Persists, unloads, clears DOM. */
      dispose() {
        activeDocument.removeEventListener("mousedown", this.onOutsideClick, true);
        if (this.statusPollTimer != null) {
          window.clearInterval(this.statusPollTimer);
          this.statusPollTimer = null;
        }
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
        this.host.contentEl.empty();
        this.host.titleEl.empty();
      }
      /** Programmatic prefill — used when activating the panel via a command. */
      prefill(text) {
        if (!this.inputEl) return;
        this.populateInput(text);
      }
      /**
       * Render the "Asking about: <Note>" chip above the composer when there
       * is an active markdown file. Auto-clears the toggle if the user
       * navigates to no-file or a non-markdown surface.
       */
      refreshActiveFileChip() {
        if (!this.activeFileChipEl) return;
        this.activeFileChipEl.empty();
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") {
          this.activeFileChipEl.addClass("is-hidden");
          this.askAboutActiveFile = false;
          return;
        }
        this.activeFileChipEl.removeClass("is-hidden");
        this.activeFileChipEl.toggleClass("is-on", this.askAboutActiveFile);
        const left = this.activeFileChipEl.createDiv({ cls: "cortex-chat-active-file-chip-left" });
        const ic = left.createSpan({ cls: "cortex-chat-active-file-chip-icon" });
        (0, import_obsidian11.setIcon)(ic, this.askAboutActiveFile ? "paperclip" : "file");
        const label = left.createSpan({ cls: "cortex-chat-active-file-chip-label" });
        label.createSpan({
          cls: "cortex-chat-active-file-chip-prefix",
          text: this.askAboutActiveFile ? "Asking about: " : "Use as context: "
        });
        label.createSpan({ cls: "cortex-chat-active-file-chip-name", text: file.basename });
        const toggle = this.activeFileChipEl.createEl("button", {
          cls: "cortex-chat-active-file-chip-toggle",
          attr: { type: "button", "aria-label": this.askAboutActiveFile ? "Stop using this note as context" : "Use this note as context" }
        });
        (0, import_obsidian11.setIcon)(toggle, this.askAboutActiveFile ? "x" : "plus");
        toggle.addEventListener("click", () => {
          this.askAboutActiveFile = !this.askAboutActiveFile;
          this.refreshActiveFileChip();
        });
        left.addEventListener("click", () => {
          this.askAboutActiveFile = !this.askAboutActiveFile;
          this.refreshActiveFileChip();
        });
      }
      /**
       * Build the active-file context block to prepend to the next prompt.
       * Truncates large notes at 2000 chars so we don't blow up the model
       * context. Returns an empty string when the toggle is off.
       */
      async buildActiveFileContext() {
        if (!this.askAboutActiveFile) return "";
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return "";
        try {
          const content = await this.app.vault.cachedRead(file);
          const MAX = 2e3;
          const truncated = content.length > MAX ? content.slice(0, MAX) + "\n\u2026(truncated)" : content;
          return `[Active note: ${file.path}]

${truncated}

---

`;
        } catch {
          return "";
        }
      }
      renderEmptyState() {
        const empty = this.outputEl.createDiv({ cls: "cortex-chat-empty" });
        const logo = empty.createDiv({ cls: "cortex-chat-empty-logo" });
        appendHangarxLogo(logo);
        empty.createEl("h2", { cls: "cortex-chat-empty-title", text: "Ask your vault anything." });
        empty.createEl("p", {
          cls: "cortex-chat-empty-sub",
          text: "Multi-hop search across your notes \u2014 cited, remembered, and shared with every AI agent on your machine."
        });
        const dailyHeader = empty.createDiv({ cls: "cortex-chat-suggestion-section" });
        dailyHeader.createSpan({
          cls: "cortex-chat-suggestion-section-label",
          text: "Daily ritual"
        });
        const dailyGrid = empty.createDiv({ cls: "cortex-chat-suggestions" });
        this.renderSuggestionCards(dailyGrid, DAILY_RITUAL_PROMPTS);
        const moreSection = empty.createDiv({ cls: "cortex-chat-suggestions-more" });
        const browseBtn = moreSection.createEl("button", {
          cls: "cortex-chat-suggestions-toggle",
          attr: { type: "button" }
        });
        const browseIcon = browseBtn.createSpan({ cls: "cortex-chat-suggestions-toggle-icon" });
        (0, import_obsidian11.setIcon)(browseIcon, "sparkles");
        browseBtn.createSpan({ text: "Browse all starters" });
        browseBtn.addEventListener("click", () => {
          void Promise.resolve().then(() => (init_starters_modal(), starters_modal_exports)).then((m) => {
            new m.StartersModal(this.app, (text) => this.populateInput(text)).open();
          });
        });
      }
      renderSuggestionCards(parent, prompts) {
        for (const s of prompts) {
          const card = parent.createDiv({
            cls: "cortex-chat-suggestion",
            attr: { role: "button", tabindex: "0" }
          });
          const ic = card.createSpan({ cls: "cortex-chat-suggestion-icon" });
          (0, import_obsidian11.setIcon)(ic, s.icon);
          const body = card.createDiv({ cls: "cortex-chat-suggestion-body" });
          body.createDiv({ cls: "cortex-chat-suggestion-label", text: s.label });
          body.createDiv({ cls: "cortex-chat-suggestion-text", text: s.text });
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
        this.inputEl.setCssStyles({ height: "auto" });
        this.inputEl.setCssStyles({ height: `${Math.min(this.inputEl.scrollHeight, 200)}px` });
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
        this.exportBtn.addClass("is-hidden");
        this.closeHistoryPopover();
        this.inputEl.focus();
      }
      toggleHistoryPopover() {
        if (this.historyPopover) {
          this.closeHistoryPopover();
          return;
        }
        void this.openHistoryPopover();
      }
      async openHistoryPopover() {
        const parent = this.host.parentEl ?? this.host.contentEl;
        const popover = parent.createDiv({ cls: "cortex-chat-history-popover" });
        this.historyPopover = popover;
        popover.createDiv({ cls: "cortex-chat-history-header", text: "Past conversations" });
        const searchWrap = popover.createDiv({ cls: "cortex-chat-history-search" });
        const searchIcon = searchWrap.createSpan({ cls: "cortex-chat-history-search-icon" });
        (0, import_obsidian11.setIcon)(searchIcon, "search");
        const searchInput = searchWrap.createEl("input", {
          cls: "cortex-chat-history-search-input",
          attr: { type: "text", placeholder: "Search title or message text\u2026" }
        });
        const listEl = popover.createDiv({ cls: "cortex-chat-history-list" });
        listEl.createDiv({ cls: "cortex-chat-history-empty", text: "Loading\u2026" });
        activeWindow.setTimeout(() => {
          activeDocument.addEventListener("mousedown", this.onOutsideClick, true);
        }, 0);
        try {
          const conversations = await this.store.list();
          const render = (q) => {
            listEl.empty();
            const ql = q.trim().toLowerCase();
            const filtered = ql ? conversations.filter(
              (c) => (c.title ?? "").toLowerCase().includes(ql) || c.turns.some((t) => t.content.toLowerCase().includes(ql))
            ) : conversations;
            if (filtered.length === 0) {
              listEl.createDiv({
                cls: "cortex-chat-history-empty",
                text: ql ? `No conversations match "${q}".` : "No past conversations yet."
              });
              return;
            }
            for (const c of filtered) this.renderHistoryRow(listEl, c, ql);
          };
          render("");
          searchInput.addEventListener("input", () => render(searchInput.value));
          activeWindow.setTimeout(() => searchInput.focus(), 80);
        } catch (e) {
          listEl.empty();
          listEl.createDiv({ cls: "cortex-chat-history-empty", text: `Error: ${e.message}` });
        }
      }
      closeHistoryPopover() {
        activeDocument.removeEventListener("mousedown", this.onOutsideClick, true);
        this.historyPopover?.remove();
        this.historyPopover = null;
      }
      renderHistoryRow(parent, c, query = "") {
        const row = parent.createDiv({ cls: "cortex-chat-history-row" });
        if (c.id === this.sessionId) row.addClass("is-active");
        const main = row.createDiv({ cls: "cortex-chat-history-main" });
        main.createDiv({ cls: "cortex-chat-history-title", text: c.title || "(untitled)" });
        const meta = main.createDiv({ cls: "cortex-chat-history-meta" });
        meta.createSpan({ text: relativeTime(c.updatedAt) });
        meta.createSpan({ cls: "cortex-chat-history-dot", text: "\xB7" });
        const turnCount = c.turns.filter((t) => t.role === "user").length;
        meta.createSpan({ text: `${turnCount} message${turnCount === 1 ? "" : "s"}` });
        if (query) {
          const ql = query.toLowerCase();
          if (!(c.title ?? "").toLowerCase().includes(ql)) {
            const hit = c.turns.find((t) => t.content.toLowerCase().includes(ql));
            if (hit) {
              const idx = hit.content.toLowerCase().indexOf(ql);
              const start = Math.max(0, idx - 30);
              const snippet = (start > 0 ? "\u2026" : "") + hit.content.slice(start, start + 120) + (start + 120 < hit.content.length ? "\u2026" : "");
              main.createDiv({ cls: "cortex-chat-history-snippet", text: snippet });
            }
          }
        }
        main.addEventListener("click", () => {
          this.loadConversation(c);
        });
        const del = row.createEl("button", {
          cls: "cortex-chat-history-del",
          attr: { "aria-label": "Delete conversation", title: "Delete conversation" }
        });
        del.textContent = "\u{1F5D1}";
        del.addEventListener("click", (evt) => {
          void (async () => {
            evt.stopPropagation();
            await this.store.delete(c.id);
            row.remove();
            if (c.id === this.sessionId) this.resetConversation();
          })();
        });
      }
      // Synchronous body — no awaits, so we drop `async` to satisfy
      // @typescript-eslint/require-await.
      loadConversation(c) {
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
        const userTurn = this.outputEl.createDiv({ cls: "cortex-chat-turn cortex-chat-user" });
        const userBubble = userTurn.createDiv({ cls: "cortex-chat-bubble" });
        userBubble.createDiv({ cls: "cortex-chat-role", text: "You" });
        userBubble.createDiv({ cls: "cortex-chat-content", text });
        if (attachmentSummary) {
          userBubble.createDiv({
            cls: "cortex-chat-content-attachment",
            text: attachmentSummary
          });
        }
      }
      renderAiTurnFromPayload(answer, payload) {
        const aiTurn = this.outputEl.createDiv({ cls: "cortex-chat-turn cortex-chat-ai" });
        const aiBubble = aiTurn.createDiv({ cls: "cortex-chat-bubble" });
        aiBubble.createDiv({ cls: "cortex-chat-role", text: "HangarX" });
        const bodyEl = aiBubble.createDiv({ cls: "cortex-chat-body" });
        if (payload) void this.renderResponse(bodyEl, payload);
        else bodyEl.createDiv({ cls: "cortex-chat-answer", text: answer });
        this.renderTurnActions(aiBubble, answer, payload);
        this.decorateBubble(aiBubble, answer, Date.now());
      }
      /**
       * Add cross-cutting bubble affordances. Hover timestamp on the role
       * label; drag-out was removed because Obsidian's editor and file tree
       * don't accept arbitrary `text/markdown` / `text/plain` drops from
       * foreign DOM elements — they only respond to internal drag types.
       * The drag started but nothing accepted the drop, leaving a phantom
       * affordance. Use the per-bubble Save-to-note action instead.
       */
      decorateBubble(bubble, _content, createdAt) {
        const roleEl = bubble.querySelector(".cortex-chat-role");
        if (!roleEl) return;
        const refreshTitle = () => {
          roleEl.title = `${relativeTime(createdAt)} \xB7 ${new Date(createdAt).toLocaleString()}`;
        };
        refreshTitle();
        roleEl.addEventListener("mouseenter", refreshTitle);
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
          const aiTurn2 = this.outputEl.createDiv({ cls: "cortex-chat-turn cortex-chat-ai" });
          const aiBubble2 = aiTurn2.createDiv({ cls: "cortex-chat-bubble" });
          aiBubble2.createDiv({ cls: "cortex-chat-role", text: "HangarX" });
          const bodyEl2 = aiBubble2.createDiv({ cls: "cortex-chat-body" });
          const thinkingEl2 = bodyEl2.createDiv({ cls: "cortex-chat-thinking", text: "Ingesting URL\u2026" });
          this.scrollToBottom();
          try {
            const result = await this.client.ingestUrl(query);
            thinkingEl2.remove();
            const msg = `\u2705 Ingested **${query}** into your knowledge graph. ${result.entityCount ? `Extracted ${result.entityCount} entities.` : ""}`;
            const answerEl = bodyEl2.createDiv({ cls: "cortex-chat-answer" });
            await this.safeRenderMarkdown(msg, answerEl);
            this.currentTurns.push({ role: "ai", content: msg });
            this.exportBtn.removeClass("is-hidden");
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
        const aiTurn = this.outputEl.createDiv({ cls: "cortex-chat-turn cortex-chat-ai" });
        const aiBubble = aiTurn.createDiv({ cls: "cortex-chat-bubble" });
        aiBubble.createDiv({ cls: "cortex-chat-role", text: "HangarX" });
        const bodyEl = aiBubble.createDiv({ cls: "cortex-chat-body" });
        const thinkingRow = bodyEl.createDiv({ cls: "cortex-chat-thinking-row" });
        const thinkingEl = thinkingRow.createDiv({ cls: "cortex-chat-thinking", text: "Thinking" });
        const HARD_TIMEOUT_MS = 5 * 60 * 1e3;
        const abortController = new AbortController();
        const timeoutHandle = window.setTimeout(() => {
          abortController.abort();
        }, HARD_TIMEOUT_MS);
        let lastPhase = "Thinking";
        const setPhase = (phase) => {
          if (phase === lastPhase) return;
          lastPhase = phase;
          thinkingEl.classList.add("is-changing");
          window.setTimeout(() => {
            thinkingEl.setText(phase);
            thinkingEl.classList.remove("is-changing");
          }, 130);
        };
        this.scrollToBottom();
        try {
          const [recalled, activeFileContext] = await Promise.all([
            this.client.recall(query, 5).catch(() => []),
            this.buildActiveFileContext()
          ]);
          const recallPrefix = recalled.length > 0 ? `Relevant prior context (from past sessions):
${recalled.map((m) => `- ${m.content}`).join("\n")}

` : "";
          const prefix = activeFileContext + recallPrefix + (recalled.length > 0 ? "Question: " : "");
          const isSimple = isSimpleQuery(promptText);
          const useStream = this.settings.chatAgentMode === "agent" && this.settings.chatStream && !(this.settings.chatAutoFastPath !== false && isSimple);
          if (this.settings.chatAgentMode === "agent" && isSimple && this.settings.chatAutoFastPath !== false) {
            thinkingEl.setText("Thinking\u2026 (fast path \u2014 simple query)");
          }
          let res;
          if (useStream) {
            const liveTrace = bodyEl.createDiv({ cls: "cortex-chat-toolcalls cortex-chat-toolcalls-live" });
            const answerLive = bodyEl.createDiv({ cls: "cortex-chat-answer cortex-chat-answer-streaming" });
            answerLive.addClass("is-hidden");
            let streamedText = "";
            let streamRenderTimer = null;
            const cardForToolCall = /* @__PURE__ */ new Map();
            const pendingSubruns = /* @__PURE__ */ new Map();
            const iterationStart = /* @__PURE__ */ new Map();
            let iterationChipEl = null;
            const streamStart = Date.now();
            res = await this.client.askStream(prefix + promptText, (ev) => {
              if (ev.kind === "iteration") {
                setPhase(ev.iteration === 0 ? "Thinking" : "Reasoning");
                const now = Date.now();
                if (iterationChipEl) {
                  const prevIter = ev.iteration - 1;
                  const prevStart = iterationStart.get(prevIter) ?? streamStart;
                  iterationChipEl.setText(`Step ${prevIter + 1} \xB7 ${formatToolDuration(now - prevStart)}`);
                  iterationChipEl.removeClass("is-running");
                }
                const chip = liveTrace.createDiv({ cls: "cortex-chat-iter-chip is-running" });
                chip.setText(`Step ${ev.iteration + 1} \xB7 running\u2026`);
                iterationChipEl = chip;
                iterationStart.set(ev.iteration, now);
              } else if (ev.kind === "tool-start") {
                setPhase(toolPhasePhrase(ev.name));
                const key = ev.toolCallId ?? `${ev.iteration}:${ev.name}:${cardForToolCall.size}`;
                const details = liveTrace.createEl("details", { cls: "cortex-chat-toolcall is-running" });
                details.setAttribute("open", "");
                const summary = details.createEl("summary");
                const ic = summary.createSpan({ cls: "cortex-chat-toolcall-icon" });
                (0, import_obsidian11.setIcon)(ic, toolCallIcon(ev.name));
                summary.createSpan({ cls: "cortex-chat-toolcall-name", text: prettifyToolCallName(ev.name) });
                const argText = summarizeToolCallArgs(ev.name, ev.args);
                if (argText) summary.createSpan({ cls: "cortex-chat-toolcall-args", text: argText });
                const meta = summary.createSpan({ cls: "cortex-chat-toolcall-meta", text: "Running\u2026" });
                cardForToolCall.set(key, { details, meta });
              } else if (ev.kind === "tool-end") {
                const key = ev.toolCallId ?? `${ev.iteration}:${ev.name}:${cardForToolCall.size - 1}`;
                const card = cardForToolCall.get(key);
                if (card) {
                  card.details.removeClass("is-running");
                  if (!ev.ok) card.details.addClass("is-error");
                  else if (ev.durationMs > 5e3) card.details.addClass("is-slow");
                  card.meta.setText(`${ev.ok ? "" : "\u26A0 "}${formatToolDuration(ev.durationMs)}`);
                  const body = card.details.createDiv({ cls: "cortex-chat-toolcall-body" });
                  const pre = body.createEl("pre");
                  pre.createEl("code", { text: JSON.stringify(ev.ok ? ev.result : ev.error, null, 2) ?? "" });
                  card.details.removeAttribute("open");
                }
              } else if (ev.kind === "subrun-start") {
                setPhase("Delegating to sub-agent");
                const lastCard = Array.from(cardForToolCall.values()).pop();
                const host = lastCard?.details.createDiv({ cls: "cortex-chat-subrun-host" }) ?? liveTrace.createDiv({ cls: "cortex-chat-subrun-host" });
                const details = host.createEl("details", { cls: "cortex-chat-toolcall cortex-chat-subrun is-running" });
                details.setAttribute("open", "");
                const summary = details.createEl("summary");
                const ic = summary.createSpan({ cls: "cortex-chat-toolcall-icon" });
                (0, import_obsidian11.setIcon)(ic, "corner-down-right");
                summary.createSpan({ cls: "cortex-chat-toolcall-name", text: "Sub-agent" });
                const goalSpan = summary.createSpan({ cls: "cortex-chat-toolcall-args" });
                goalSpan.setText(ev.goal.length > 80 ? `${ev.goal.slice(0, 80)}\u2026` : ev.goal);
                const meta = summary.createSpan({ cls: "cortex-chat-toolcall-meta", text: "Running\u2026" });
                pendingSubruns.set(ev.goal, { details, meta });
              } else if (ev.kind === "subrun-end") {
                const card = pendingSubruns.get(ev.goal);
                if (card) {
                  card.details.removeClass("is-running");
                  if (!ev.ok) card.details.addClass("is-error");
                  else if (ev.durationMs > 5e3) card.details.addClass("is-slow");
                  card.meta.setText(`${ev.ok ? "" : "\u26A0 "}${ev.iterations} iter \xB7 ${formatToolDuration(ev.durationMs)}`);
                  const body = card.details.createDiv({ cls: "cortex-chat-toolcall-body cortex-chat-subrun-body" });
                  if (ev.answer) {
                    body.createDiv({ cls: "cortex-chat-subrun-answer", text: ev.answer });
                  }
                  if (ev.childRunId) {
                    const link = body.createEl("a", {
                      cls: "cortex-chat-agent-link",
                      href: this.dashboardRunUrl(ev.childRunId),
                      text: "View sub-run \u2192"
                    });
                    link.setAttribute("target", "_blank");
                    link.setAttribute("rel", "noopener");
                  }
                  if (ev.error) {
                    body.createEl("pre").createEl("code", { text: ev.error });
                  }
                  card.details.removeAttribute("open");
                  pendingSubruns.delete(ev.goal);
                }
              } else if (ev.kind === "text") {
                if (streamedText.length === 0) {
                  thinkingEl.remove();
                  answerLive.removeClass("is-hidden");
                  if (iterationChipEl && iterationChipEl.hasClass("is-running")) {
                    const lastIter = Math.max(...iterationStart.keys(), 0);
                    const start = iterationStart.get(lastIter) ?? streamStart;
                    iterationChipEl.setText(`Step ${lastIter + 1} \xB7 ${formatToolDuration(Date.now() - start)}`);
                    iterationChipEl.removeClass("is-running");
                  }
                }
                streamedText += ev.content;
                if (streamRenderTimer != null) window.clearTimeout(streamRenderTimer);
                streamRenderTimer = window.setTimeout(() => {
                  void this.safeRenderMarkdown(streamedText, answerLive, [], []);
                  answerLive.addClass("cortex-chat-answer-streaming");
                  this.scrollToBottom();
                }, 120);
                this.scrollToBottom();
              } else if (ev.kind === "error") {
                new import_obsidian11.Notice(`Agent error: ${ev.message}`);
              }
            }, {
              skill: this.settings.chatAgentSkill,
              webSearch: this.settings.chatAgentWebSearch,
              signal: abortController.signal,
              // Pass prior turns so multi-turn replies like "yes" make sense.
              // The last turn is the current user message (already pushed
              // before this call) — slice it off because the server adds it
              // via `message`. Cap remaining to last 20 turns to bound cost.
              history: this.currentTurns.slice(0, -1).slice(-20).map((t) => ({
                role: t.role === "user" ? "user" : "assistant",
                content: t.content
              }))
            });
            if (thinkingEl.isConnected) thinkingEl.remove();
            if (streamRenderTimer != null) window.clearTimeout(streamRenderTimer);
            liveTrace.remove();
            answerLive.remove();
            await this.renderResponse(bodyEl, res);
          } else {
            const phrases = ["Thinking", "Searching vault", "Reading context", "Querying knowledge graph", "Generating response"];
            let pIdx = 0;
            const ticker = window.setInterval(() => {
              pIdx = (pIdx + 1) % phrases.length;
              setPhase(phrases[pIdx]);
            }, 1600);
            try {
              res = await this.client.ask(prefix + promptText, this.sessionId);
            } finally {
              window.clearInterval(ticker);
            }
            thinkingEl.remove();
            await this.renderResponse(bodyEl, res);
          }
          if (recalled.length > 0) this.renderRecalledMemories(bodyEl, recalled.length);
          if (res.entities?.length) this.allEntities.push(...res.entities);
          if (res.citations?.length) this.allCitations.push(...res.citations);
          this.renderTurnActions(aiBubble, res.answer, res);
          this.decorateBubble(aiBubble, res.answer, Date.now());
          if (this.settings.autoShowAnswerOnGraph && res.entities?.length) {
            void this.showEntitiesOnGraph(res.entities);
          }
          this.currentTurns.push({ role: "ai", content: res.answer, payload: res });
          this.exportBtn.removeClass("is-hidden");
          void this.persistConversation();
          if (this.settings.autoSaveChatToVault) {
            void this.client.remember(`Q: ${query}
A: ${res.answer.slice(0, 800)}`, "conversation").catch(() => void 0);
          }
        } catch (e) {
          const isAbort = e?.name === "AbortError" || /aborted/i.test(e?.message ?? "");
          if (thinkingRow.isConnected) thinkingRow.remove();
          this.renderErrorCard(
            bodyEl,
            isAbort ? new Error("The server didn't respond within 5 minutes. Try again, or check the cortex-api logs.") : e,
            isAbort ? "Request timed out" : "Couldn't answer your question",
            () => {
              aiTurn.remove();
              this.currentTurns.pop();
              this.inputEl.value = query;
              void this.submit();
            }
          );
        } finally {
          window.clearTimeout(timeoutHandle);
          if (thinkingRow.isConnected) thinkingRow.remove();
          if (this.inputEl.value.trim().length > 0) this.askBtn.removeAttribute("disabled");
          this.scrollToBottom();
        }
      }
      async renderResponse(parent, res) {
        if (res.confidence > 0) {
          const meta = parent.createDiv({ cls: "cortex-chat-meta" });
          const conf = meta.createSpan({ cls: "cortex-chat-pill cortex-chat-pill-confidence" });
          conf.setText(`${Math.round(res.confidence * 100)}% confidence`);
        }
        if (res.toolCalls && res.toolCalls.length > 0) {
          this.renderToolCallTrace(parent, res.toolCalls);
        }
        if (res.runId || res.iterationTokens && res.iterationTokens.length > 0) {
          this.renderAgentRunMeta(parent, res);
        }
        const answerEl = parent.createDiv({ cls: "cortex-chat-answer" });
        const answerText = res.answer?.trim();
        if (answerText) {
          await this.safeRenderMarkdown(answerText, answerEl, res.citations ?? [], res.entities ?? []);
        } else {
          const reason = res.reason ?? "unknown";
          const reasonExplanation = {
            "max-iterations": "The agent ran the maximum number of reasoning steps (probably searching deeply) before producing a final answer.",
            "max-tool-calls": "The agent ran the maximum number of tool calls before producing a final answer.",
            "budget-exceeded": "The agent ran out of wall-clock time before producing a final answer.",
            "repeat-loop": "The agent kept calling the same tool with the same arguments and was stopped to avoid an infinite loop.",
            "aborted": "The request was cancelled.",
            "error": "The agent run errored before producing an answer.",
            "unknown-tool": "The agent tried to call a tool that isn't available."
          };
          const empty = answerEl.createDiv({ cls: "cortex-chat-empty-answer" });
          empty.createDiv({
            cls: "cortex-chat-empty-answer-title",
            text: `No final answer (stop reason: ${reason})`
          });
          empty.createDiv({
            cls: "cortex-chat-empty-answer-hint",
            text: reasonExplanation[reason] ?? "The agent stopped without producing a final answer."
          });
          empty.createDiv({
            cls: "cortex-chat-empty-answer-hint",
            text: "Try a more focused question, or open the run trace below to see what the agent searched for."
          });
        }
        if (res.confidence > 0 && res.confidence < 0.4) {
          this.renderRetrievalDiagnostic(parent, res);
        }
        if (res.entities.length > 0) this.renderEntities(parent, res.entities);
        if (res.documents.length > 0) this.renderDocuments(parent, res.documents);
        if (res.citations.length > 0) this.renderCitations(parent, res.citations);
        if (res.followUps.length > 0) this.renderFollowUps(parent, res.followUps);
        this.linkifyEntities(answerEl, res.entities);
      }
      /**
       * Render a one-line retrieval-source breakdown when confidence is low. The
       * server returns `meta.retrieval = { entities, chunks, communities, ... }`.
       * Reads the same field via the AskResponse `metadata` pass-through. If the
       * server didn't return retrieval counts (older build), this is a no-op.
       */
      /**
       * Render a list of "🔍 Searched vault for X — 4 results, 320ms" cards
       * above the answer when agent mode is on. Each card is a `<details>` so
       * power users can expand to see the raw args + result; everyone else
       * gets a clean one-line summary that signals what the agent actually did.
       */
      renderToolCallTrace(parent, toolCalls) {
        const wrap = parent.createDiv({ cls: "cortex-chat-toolcalls" });
        const groups = [];
        for (const tc of toolCalls) {
          const last = groups[groups.length - 1];
          if (last && last.name === tc.name) last.calls.push(tc);
          else groups.push({ name: tc.name, calls: [tc] });
        }
        const renderRow = (host, tc, opts = {}) => {
          const details = host.createEl("details", { cls: "cortex-chat-toolcall" });
          if (!tc.ok) details.addClass("is-error");
          else if (tc.durationMs > 5e3) details.addClass("is-slow");
          if (opts.compact) details.addClass("is-grouped-child");
          const summary = details.createEl("summary");
          const ic = summary.createSpan({ cls: "cortex-chat-toolcall-icon" });
          (0, import_obsidian11.setIcon)(ic, toolCallIcon(tc.name));
          summary.createSpan({ cls: "cortex-chat-toolcall-name", text: prettifyToolCallName(tc.name) });
          const argText = summarizeToolCallArgs(tc.name, tc.args);
          if (argText) summary.createSpan({ cls: "cortex-chat-toolcall-args", text: argText });
          summary.createSpan({
            cls: "cortex-chat-toolcall-meta",
            text: `${tc.ok ? "" : "\u26A0 "}${formatToolDuration(tc.durationMs)}`
          });
          const body = details.createDiv({ cls: "cortex-chat-toolcall-body" });
          const pre = body.createEl("pre");
          pre.createEl("code", {
            text: JSON.stringify(tc.ok ? tc.result : tc.error, null, 2) ?? ""
          });
        };
        for (const g of groups) {
          if (g.calls.length === 1) {
            renderRow(wrap, g.calls[0]);
            continue;
          }
          const totalMs = g.calls.reduce((s, c) => s + c.durationMs, 0);
          const anyError = g.calls.some((c) => !c.ok);
          const anySlow = g.calls.some((c) => c.durationMs > 5e3);
          const groupHost = wrap.createDiv({ cls: "cortex-chat-toolcall-group" });
          if (anyError) groupHost.addClass("is-error");
          else if (anySlow) groupHost.addClass("is-slow");
          const header = groupHost.createDiv({ cls: "cortex-chat-toolcall-group-header" });
          const ic = header.createSpan({ cls: "cortex-chat-toolcall-icon" });
          (0, import_obsidian11.setIcon)(ic, toolCallIcon(g.name));
          header.createSpan({
            cls: "cortex-chat-toolcall-name",
            text: `${prettifyToolCallName(g.name)} \xD7 ${g.calls.length}`
          });
          header.createSpan({
            cls: "cortex-chat-toolcall-meta",
            text: formatToolDuration(totalMs)
          });
          const childHost = groupHost.createDiv({ cls: "cortex-chat-toolcall-group-children" });
          for (const tc of g.calls) renderRow(childHost, tc, { compact: true });
        }
      }
      /**
       * Compact agent-run metadata strip. Renders just below the tool-call
       * trace when the harness returned a runId or per-iteration tokens.
       * The "View run" link points at the dashboard's replay viewer so the
       * user can drill into a stuck conversation without leaving Obsidian
       * to hand-craft a URL.
       */
      renderAgentRunMeta(parent, res) {
        const wrap = parent.createDiv({ cls: "cortex-chat-agent-meta" });
        if (res.iterationTokens && res.iterationTokens.length > 0) {
          const total = res.tokenUsage?.total ?? res.iterationTokens.reduce((s, it) => s + it.total, 0);
          const tokenChip = wrap.createSpan({ cls: "cortex-chat-agent-chip" });
          tokenChip.setText(`${res.iterationTokens.length} iter \xB7 ${total.toLocaleString()} tokens`);
          tokenChip.setAttribute(
            "title",
            res.iterationTokens.map((it) => `iter ${it.iteration}: ${it.total.toLocaleString()} (in ${it.prompt.toLocaleString()} / out ${it.completion.toLocaleString()})`).join("\n")
          );
        }
        if (res.reason && res.reason !== "completed") {
          const reasonChip = wrap.createSpan({ cls: "cortex-chat-agent-chip cortex-chat-agent-chip-warn" });
          reasonChip.setText(res.reason);
        }
        if (res.runId) {
          const dashUrl = this.dashboardRunUrl(res.runId);
          const link = wrap.createEl("a", {
            cls: "cortex-chat-agent-link",
            href: dashUrl,
            text: "View run \u2192"
          });
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener");
          link.setAttribute("title", `Open run ${res.runId} in the dashboard's replay viewer`);
        }
      }
      /** Resolve the dashboard URL for an agent run. Cloud users land on
       *  https://app.HangarX.com/agents/runs/<id>; self-hosted users get
       *  the API base URL with `/agents/runs/<id>` appended (which won't
       *  always exist, but matches the convention). */
      dashboardRunUrl(runId) {
        const base = this.settings.apiUrl?.trim().replace(/\/$/, "") ?? "";
        if (base.includes("HangarX.ai") || base.includes("HangarX.com") || base.includes("cortex")) {
          return `https://app.HangarX.com/agents/runs/${runId}`;
        }
        return `${base}/agents/runs/${runId}`;
      }
      renderRetrievalDiagnostic(parent, res) {
        const retrieval = res.metadata?.retrieval;
        if (!retrieval) return;
        const wrap = parent.createDiv({ cls: "cortex-chat-retrieval-diag" });
        wrap.createDiv({
          cls: "cortex-chat-retrieval-diag-title",
          text: "Why is confidence low?"
        });
        const counts = wrap.createDiv({ cls: "cortex-chat-retrieval-diag-counts" });
        const entries = [
          ["entities", retrieval.entities ?? 0],
          ["chunks", retrieval.chunks ?? 0],
          ["communities", retrieval.communities ?? 0],
          ["analytics", retrieval.analytics ?? 0],
          ["memories", retrieval.memories ?? 0]
        ];
        for (const [name, count] of entries) {
          const pill = counts.createSpan({ cls: "cortex-chat-retrieval-pill" });
          if (count === 0) pill.addClass("is-empty");
          pill.createSpan({ cls: "cortex-chat-retrieval-pill-name", text: name });
          pill.createSpan({ cls: "cortex-chat-retrieval-pill-count", text: String(count) });
        }
        const hint = wrap.createDiv({ cls: "cortex-chat-retrieval-diag-hint" });
        if ((retrieval.communities ?? 0) === 0 && (retrieval.entities ?? 0) > 0) {
          hint.createSpan({
            text: 'Community-summary retrieval is empty \u2014 broad questions like "themes" need it. '
          });
          const a = hint.createEl("a", {
            cls: "cortex-chat-retrieval-diag-action",
            text: "Rebuild communities + reindex",
            href: "#"
          });
          a.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.app.commands.executeCommandById("hangarx:cortex-1c-rebuild-graph");
          });
        } else if ((retrieval.entities ?? 0) === 0 && (retrieval.chunks ?? 0) === 0) {
          hint.createSpan({
            text: "No graph content matched this query. The vault may not be synced \u2014 try "
          });
          const a = hint.createEl("a", {
            cls: "cortex-chat-retrieval-diag-action",
            text: "Force re-ingest entire vault",
            href: "#"
          });
          a.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.app.commands.executeCommandById("hangarx:cortex-1b-resync-all");
          });
          hint.appendText(".");
        } else {
          hint.createSpan({
            text: "Retrieval found content but the model wasn't confident. Try rephrasing to mention specific entities or note titles."
          });
        }
      }
      renderEntities(parent, entities) {
        const section = this.collapsibleSection(parent, `Entities (${entities.length})`, false);
        const grid = section.createDiv({ cls: "cortex-chat-entities" });
        const byType = /* @__PURE__ */ new Map();
        for (const e of entities) {
          const arr = byType.get(e.type) ?? [];
          arr.push(e);
          byType.set(e.type, arr);
        }
        for (const [type, list] of byType) {
          const group = grid.createDiv({ cls: "cortex-chat-entity-group" });
          group.createDiv({ cls: "cortex-chat-entity-type", text: type });
          const chips = group.createDiv({ cls: "cortex-chat-chips" });
          for (const e of list) {
            const target = this.resolveEntityToFile(e);
            const chip = chips.createEl("a", {
              cls: target ? "cortex-chat-chip is-linked" : "cortex-chat-chip",
              text: prettifyEntityName(e.name),
              href: "#"
            });
            const titleParts = [];
            if (e.description) titleParts.push(e.description);
            if (e.name !== prettifyEntityName(e.name)) titleParts.push(`id: ${e.name}`);
            if (!target) titleParts.push("Not in vault yet \u2014 run a graph pull to materialize.");
            if (titleParts.length) chip.setAttr("title", titleParts.join("\n"));
            chip.addEventListener("click", (evt) => {
              evt.preventDefault();
              if (target) {
                void this.app.workspace.getLeaf(false).openFile(target);
                this.host.onNavigate();
              } else {
                new import_obsidian11.Notice(`"${prettifyEntityName(e.name)}" isn't a file in this vault yet. Pull the graph from settings to materialize it.`);
              }
            });
          }
        }
      }
      /**
       * Try several name variants to find the entity's vault file. The chat
       * returns names in different forms depending on how the entity was
       * extracted; graph-pull writes them as `<name> (<type>).md`. Try the
       * raw name first, then strip any trailing "(Type)" suffix the chat may
       * have appended, then add one if missing — covers both directions.
       */
      resolveEntityToFile(e) {
        const tries = /* @__PURE__ */ new Set();
        if (e.name) tries.add(e.name);
        const stripped = e.name.replace(/\s*\([^)]+\)\s*$/, "").trim();
        if (stripped) tries.add(stripped);
        if (e.type && stripped) tries.add(`${stripped} (${e.type})`);
        for (const name of tries) {
          const f = this.app.metadataCache.getFirstLinkpathDest(name, "");
          if (f) return f;
        }
        return null;
      }
      renderDocuments(parent, documents) {
        const section = this.collapsibleSection(parent, `Documents (${documents.length})`, false);
        const list = section.createDiv({ cls: "cortex-chat-docs" });
        for (const d of documents) {
          const row = list.createDiv({ cls: "cortex-chat-doc" });
          const header = row.createDiv({ cls: "cortex-chat-doc-header" });
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
                void this.app.workspace.getLeaf(false).openFile(file);
                this.host.onNavigate();
              }
            });
          }
          if (typeof d.matchPercent === "number") {
            header.createSpan({ cls: "cortex-chat-pill cortex-chat-pill-match", text: `${d.matchPercent}%` });
          }
          const subParts = [];
          if (d.source) subParts.push(d.source);
          if (d.publishDate) subParts.push(d.publishDate);
          if (subParts.length > 0) row.createDiv({ cls: "cortex-chat-doc-sub", text: subParts.join(" \xB7 ") });
          if (d.snippet) row.createDiv({ cls: "cortex-chat-doc-snippet", text: d.snippet });
        }
      }
      renderCitations(parent, citations) {
        const section = this.collapsibleSection(parent, `Sources (${citations.length})`, false);
        section.addClass("cortex-chat-citations");
        const chips = section.createDiv({ cls: "cortex-chat-chips" });
        for (const c of citations) {
          const target = c.url ? null : this.resolveCitationToFile(c.source);
          const chip = chips.createEl("a", {
            cls: target || c.url ? "cortex-chat-chip is-linked" : "cortex-chat-chip",
            text: prettifyEntityName(c.source),
            href: c.url ?? "#"
          });
          const tooltipParts = [];
          if (c.text) tooltipParts.push(c.text);
          if (c.source !== prettifyEntityName(c.source)) tooltipParts.push(`id: ${c.source}`);
          if (!c.url && !target) tooltipParts.push("Not in vault yet \u2014 pull the graph to materialize.");
          if (tooltipParts.length) chip.setAttr("title", tooltipParts.join("\n"));
          if (c.url) {
            chip.target = "_blank";
            chip.rel = "noopener";
          } else {
            chip.addEventListener("click", (evt) => {
              evt.preventDefault();
              if (target) {
                void this.app.workspace.getLeaf(false).openFile(target);
                this.host.onNavigate();
              } else {
                new import_obsidian11.Notice(`"${prettifyEntityName(c.source)}" isn't a file in this vault yet. Pull the graph from settings to materialize it.`);
              }
            });
          }
        }
      }
      /** Same fuzzy resolution as resolveEntityToFile, for citations which only have a name string. */
      resolveCitationToFile(source) {
        if (!source) return null;
        const tries = /* @__PURE__ */ new Set([source]);
        const stripped = source.replace(/\s*\([^)]+\)\s*$/, "").trim();
        if (stripped) tries.add(stripped);
        for (const name of tries) {
          const f = this.app.metadataCache.getFirstLinkpathDest(name, "");
          if (f) return f;
        }
        return null;
      }
      /**
       * Render markdown into `target` with defensive fallback + post-processing.
       * Obsidian's MarkdownRenderer can throw on rare assistant outputs —
       * top-level `<html>` tags, certain malformed embeds, or anything that
       * resolves to appending a Document node ("Only one element on document
       * allowed"). Rather than killing the whole answer with an error card,
       * sanitize suspicious top-level HTML, retry once, and finally degrade
       * to a preformatted text dump that always renders.
       *
       * After successful render, runs two post-processors:
       *   1. inline citation pills (`[1]` → clickable badge linking to the
       *      matching `citations[0]` entry)
       *   2. code-block toolbar (Copy + Save-to-note buttons over each <pre>)
       */
      async safeRenderMarkdown(text, target, citations = [], entities = []) {
        const tryRender = async (md) => {
          target.empty();
          await import_obsidian11.MarkdownRenderer.render(this.app, md, target, "", this.renderComponent);
        };
        try {
          await tryRender(text);
        } catch (err) {
          console.warn("[Cortex] markdown render failed, retrying with sanitized input:", err);
          try {
            const sanitized = text.replace(/<!doctype[^>]*>/gi, "").replace(/<\/?(html|head|body)\b[^>]*>/gi, "").trim();
            await tryRender(sanitized);
          } catch (err2) {
            console.warn("[Cortex] markdown render failed after sanitize, falling back to plaintext:", err2);
            target.empty();
            target.createEl("pre", { cls: "cortex-chat-answer-plaintext", text });
            return;
          }
        }
        this.addTableOfContents(target);
        if (entities.length > 0) this.highlightEntities(target, entities);
        if (citations.length > 0) this.linkifyCitations(target, citations);
        this.addCodeBlockToolbars(target);
        this.attachWikilinkPreviews(target);
      }
      /**
       * Insert a clickable mini table-of-contents at the top of the answer
       * when the assistant produced 5+ headings. Cheap navigation aid for
       * essay-length responses.
       */
      addTableOfContents(root) {
        const headings = Array.from(root.querySelectorAll("h1, h2, h3"));
        if (headings.length < 5) return;
        const toc = activeDocument.createElement("div");
        toc.className = "cortex-chat-toc";
        const label = toc.createDiv({ cls: "cortex-chat-toc-label", text: "In this answer" });
        const list = toc.createEl("ul", { cls: "cortex-chat-toc-list" });
        headings.forEach((h, i) => {
          const id = `toc-${Date.now()}-${i}`;
          h.id = id;
          const li = list.createEl("li");
          const a = li.createEl("a", { text: h.textContent ?? "", cls: `cortex-chat-toc-${h.tagName.toLowerCase()}` });
          a.href = `#${id}`;
          a.addEventListener("click", (evt) => {
            evt.preventDefault();
            h.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
        root.insertBefore(toc, root.firstChild);
      }
      /**
       * Bold + link the FIRST occurrence of each entity name in the rendered
       * answer. Subsequent mentions stay as plain text so the page doesn't
       * get visually noisy. Skips text inside code/pre/a/citation pills.
       */
      highlightEntities(root, entities) {
        if (entities.length === 0) return;
        const names = [...new Set(entities.map((e) => e.name).filter((n) => n && n.length >= 3))].sort((a, b) => b.length - a.length);
        const pending2 = new Set(names);
        const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          const t = node;
          const parent = t.parentElement;
          if (!parent) continue;
          if (parent.closest("code, pre, a, h1, h2, h3, h4, h5, h6, .cortex-chat-citation-inline")) continue;
          textNodes.push(t);
        }
        for (const t of textNodes) {
          if (pending2.size === 0) break;
          let data = t.data;
          let matched = null;
          for (const name2 of pending2) {
            const idx2 = data.toLowerCase().indexOf(name2.toLowerCase());
            if (idx2 >= 0 && (!matched || idx2 < matched.idx)) matched = { idx: idx2, name: name2 };
          }
          if (!matched) continue;
          const { idx, name } = matched;
          pending2.delete(name);
          const before = data.slice(0, idx);
          const exact = data.slice(idx, idx + name.length);
          const after = data.slice(idx + name.length);
          const frag = activeDocument.createDocumentFragment();
          if (before) frag.appendChild(activeDocument.createTextNode(before));
          const mark = activeDocument.createElement("strong");
          mark.className = "cortex-chat-entity-highlight";
          mark.textContent = exact;
          mark.title = `Entity: ${name}`;
          frag.appendChild(mark);
          if (after) frag.appendChild(activeDocument.createTextNode(after));
          t.replaceWith(frag);
        }
      }
      /**
       * Wire hover previews onto Obsidian internal-link anchors. When the
       * user pauses over an `[[Note]]` reference rendered as a link, fetch
       * the first ~240 chars of the target file and surface them in a
       * lightweight popover. Cleans up on mouseleave / blur.
       */
      attachWikilinkPreviews(root) {
        const links = root.querySelectorAll("a.internal-link");
        links.forEach((el) => {
          const link = el;
          const target = link.getAttribute("href") ?? link.getAttribute("data-href") ?? link.textContent ?? "";
          if (!target) return;
          let popover = null;
          let hoverTimer = null;
          const show = async () => {
            const file = this.app.metadataCache.getFirstLinkpathDest(target.replace(/^\[\[|\]\]$/g, ""), "");
            if (!file) return;
            const content = await this.app.vault.cachedRead(file).catch(() => "");
            if (!content) return;
            popover = activeDocument.createElement("div");
            popover.className = "cortex-chat-wikilink-preview";
            popover.createDiv({ cls: "cortex-chat-wikilink-preview-title", text: file.basename });
            popover.createDiv({ cls: "cortex-chat-wikilink-preview-body", text: content.slice(0, 240) + (content.length > 240 ? "\u2026" : "") });
            const rect = link.getBoundingClientRect();
            popover.style.left = `${rect.left}px`;
            popover.style.top = `${rect.bottom + 6}px`;
            activeDocument.body.appendChild(popover);
          };
          const hide = () => {
            if (hoverTimer !== null) {
              window.clearTimeout(hoverTimer);
              hoverTimer = null;
            }
            if (popover) {
              popover.remove();
              popover = null;
            }
          };
          link.addEventListener("mouseenter", () => {
            hoverTimer = window.setTimeout(() => void show(), 350);
          });
          link.addEventListener("mouseleave", hide);
          link.addEventListener("blur", hide);
        });
      }
      /**
       * Replace `[N]` markers in the rendered answer with clickable citation
       * pills that resolve to `citations[N-1]`. Out-of-range indices are
       * left as plain text so we don't accidentally swallow legitimate
       * `[token]` content (e.g. log timestamps).
       */
      linkifyCitations(root, citations) {
        const re = /\[(\d{1,3})\]/g;
        const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const targets = [];
        let node;
        while (node = walker.nextNode()) {
          const t = node;
          const parent = t.parentElement;
          if (!parent) continue;
          if (parent.closest("code, pre, a")) continue;
          if (re.test(t.data)) targets.push(t);
          re.lastIndex = 0;
        }
        for (const t of targets) {
          const parts = [];
          let lastIdx = 0;
          let m;
          const localRe = /\[(\d{1,3})\]/g;
          while (m = localRe.exec(t.data)) {
            const idx = parseInt(m[1], 10);
            const cite = citations[idx - 1];
            if (!cite) continue;
            if (m.index > lastIdx) parts.push(t.data.slice(lastIdx, m.index));
            const pill = activeDocument.createElement("a");
            pill.className = "cortex-chat-citation-inline";
            pill.textContent = String(idx);
            pill.href = cite.url ?? "#";
            const target = cite.url ? null : this.resolveCitationToFile(cite.source);
            const tipParts = [prettifyEntityName(cite.source)];
            if (cite.text) tipParts.push(cite.text);
            pill.title = tipParts.join("\n");
            if (cite.url) {
              pill.target = "_blank";
              pill.rel = "noopener";
            } else {
              pill.addEventListener("click", (evt) => {
                evt.preventDefault();
                if (target) {
                  void this.app.workspace.getLeaf(false).openFile(target);
                  this.host.onNavigate();
                } else {
                  new import_obsidian11.Notice(`"${prettifyEntityName(cite.source)}" isn't a file in this vault yet.`);
                }
              });
            }
            parts.push(pill);
            lastIdx = localRe.lastIndex;
          }
          if (lastIdx === 0) continue;
          if (lastIdx < t.data.length) parts.push(t.data.slice(lastIdx));
          const frag = activeDocument.createDocumentFragment();
          for (const p of parts) {
            if (typeof p === "string") frag.appendChild(activeDocument.createTextNode(p));
            else frag.appendChild(p);
          }
          t.replaceWith(frag);
        }
      }
      /**
       * Overlay each rendered code block with a small toolbar (Copy +
       * Save-to-note). Hidden by default, fades in on hover.
       */
      addCodeBlockToolbars(root) {
        const blocks = root.querySelectorAll("pre");
        blocks.forEach((pre) => {
          if (pre.classList.contains("cortex-chat-answer-plaintext")) return;
          if (pre.querySelector(":scope > .cortex-code-toolbar")) return;
          const code = pre.querySelector("code");
          const text = (code?.textContent ?? pre.textContent ?? "").trimEnd();
          if (!text) return;
          pre.classList.add("cortex-code-block");
          const toolbar = activeDocument.createElement("div");
          toolbar.className = "cortex-code-toolbar";
          const copyBtn = activeDocument.createElement("button");
          copyBtn.className = "cortex-code-toolbar-btn";
          copyBtn.title = "Copy to clipboard";
          const copyIc = copyBtn.appendChild(activeDocument.createElement("span"));
          (0, import_obsidian11.setIcon)(copyIc, "copy");
          copyBtn.addEventListener("click", async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            try {
              await navigator.clipboard.writeText(text);
              new import_obsidian11.Notice("Copied to clipboard.");
            } catch {
              new import_obsidian11.Notice("Copy failed.");
            }
          });
          const saveBtn = activeDocument.createElement("button");
          saveBtn.className = "cortex-code-toolbar-btn";
          saveBtn.title = "Save to a new note";
          const saveIc = saveBtn.appendChild(activeDocument.createElement("span"));
          (0, import_obsidian11.setIcon)(saveIc, "file-plus");
          saveBtn.addEventListener("click", async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            const lang = code?.className?.match(/language-([\w+-]+)/)?.[1] ?? "";
            const fence = "```";
            const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const fileName = `Code snippet ${stamp}.md`;
            const body = `${fence}${lang}
${text}
${fence}
`;
            try {
              const file = await this.app.vault.create(fileName, body);
              await this.app.workspace.getLeaf(false).openFile(file);
              this.host.onNavigate();
            } catch (e) {
              new import_obsidian11.Notice(`Couldn't save snippet: ${e.message}`);
            }
          });
          toolbar.appendChild(copyBtn);
          toolbar.appendChild(saveBtn);
          pre.appendChild(toolbar);
        });
      }
      renderErrorCard(parent, err, headline, onRetry) {
        const fmt = formatError(err, headline);
        const card = parent.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
        const head = card.createDiv({ cls: "cortex-error-head" });
        const ic = head.createSpan({ cls: "cortex-error-icon" });
        (0, import_obsidian11.setIcon)(ic, errorIcon(fmt.kind));
        head.createSpan({ cls: "cortex-error-headline", text: fmt.headline });
        if (fmt.hint) {
          card.createDiv({ cls: "cortex-error-hint", text: fmt.hint });
        }
        const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
        detailWrap.createEl("summary", { text: "Error details" });
        detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
        const actions = card.createDiv({ cls: "cortex-error-actions" });
        if (onRetry) {
          const retryBtn = actions.createEl("button", { text: "Retry", cls: "mod-cta" });
          retryBtn.addEventListener("click", () => onRetry());
        }
        const copyBtn = actions.createEl("button", { text: "Copy details" });
        copyBtn.addEventListener("click", () => {
          void (async () => {
            const payload = `${fmt.headline}

${fmt.detail}${fmt.hint ? `

Hint: ${fmt.hint}` : ""}`;
            await navigator.clipboard.writeText(payload);
            copyBtn.setText("Copied");
            activeWindow.setTimeout(() => copyBtn.setText("Copy details"), 1400);
          })();
        });
      }
      renderRecalledMemories(parent, count) {
        const note = parent.createDiv({ cls: "cortex-chat-recalled" });
        const ic = note.createSpan({ cls: "cortex-chat-recalled-icon" });
        (0, import_obsidian11.setIcon)(ic, "history");
        note.createSpan({ text: `Used ${count} memor${count === 1 ? "y" : "ies"} from past sessions.` });
      }
      renderFollowUps(parent, followUps) {
        const section = parent.createDiv({ cls: "cortex-chat-section cortex-chat-followups" });
        section.createDiv({ cls: "cortex-chat-section-label", text: "Follow up" });
        const list = section.createDiv({ cls: "cortex-chat-followup-list" });
        for (const q of followUps) {
          const btn = list.createEl("button", { cls: "cortex-chat-followup", text: q });
          btn.addEventListener("click", () => {
            this.populateInput(q);
          });
        }
      }
      async handleAttachedFiles(files) {
        for (const file of files) {
          const ext = (file.name.split(".").pop() || "").toLowerCase();
          if (!TEXT_EXTENSIONS.has(ext)) {
            new import_obsidian11.Notice(`${file.name}: only text files are supported for inline attachment (yet). Use vault sync for ${ext.toUpperCase()} files.`);
            continue;
          }
          if (this.pendingAttachments.some((a) => a.name === file.name)) {
            new import_obsidian11.Notice(`${file.name} is already attached.`);
            continue;
          }
          try {
            let text = await file.text();
            if (text.length > MAX_ATTACHMENT_CHARS) {
              text = text.slice(0, MAX_ATTACHMENT_CHARS) + `

[... truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars]`;
              new import_obsidian11.Notice(`${file.name} truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars`);
            }
            this.pendingAttachments.push({ name: file.name, size: file.size, content: text });
          } catch (e) {
            new import_obsidian11.Notice(`Couldn't read ${file.name}: ${e.message}`);
          }
        }
        this.renderAttachmentChips();
      }
      renderAttachmentChips() {
        this.attachmentsEl.empty();
        if (this.pendingAttachments.length === 0) {
          this.attachmentsEl.addClass("is-empty");
          return;
        }
        this.attachmentsEl.removeClass("is-empty");
        for (const att of this.pendingAttachments) {
          const chip = this.attachmentsEl.createDiv({ cls: "cortex-chat-attachment-chip" });
          const ic = chip.createSpan({ cls: "cortex-chat-attachment-icon" });
          (0, import_obsidian11.setIcon)(ic, "file-text");
          chip.createSpan({ cls: "cortex-chat-attachment-name", text: att.name });
          chip.createSpan({
            cls: "cortex-chat-attachment-size",
            text: formatBytes(att.size)
          });
          const rm = chip.createEl("button", {
            cls: "cortex-chat-attachment-remove",
            attr: { "aria-label": `Remove ${att.name}` }
          });
          (0, import_obsidian11.setIcon)(rm, "x");
          rm.addEventListener("click", () => {
            this.pendingAttachments = this.pendingAttachments.filter((a) => a.name !== att.name);
            this.renderAttachmentChips();
          });
        }
      }
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
      renderTurnActions(bubble, answer, payload) {
        const actions = bubble.createDiv({ cls: "cortex-chat-turn-actions" });
        if (payload?.entities && payload.entities.length > 0) {
          const graphBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Show on graph" } });
          (0, import_obsidian11.setIcon)(graphBtn, "network");
          graphBtn.createSpan({ text: "Show on graph" });
          graphBtn.addEventListener("click", (evt) => {
            if (evt.shiftKey) {
              this.settings.autoShowAnswerOnGraph = !this.settings.autoShowAnswerOnGraph;
              void this.host.saveSettings?.();
              new import_obsidian11.Notice(
                `Auto-highlight on graph ${this.settings.autoShowAnswerOnGraph ? "enabled" : "disabled"} for future answers.`,
                3e3
              );
            }
            void this.showEntitiesOnGraph(payload.entities);
          });
          const autoBtn = actions.createEl("button", {
            cls: "cortex-chat-action-btn cortex-chat-action-toggle",
            attr: { "aria-label": "Auto-highlight every answer on the graph" }
          });
          const refreshAutoBtn = () => {
            autoBtn.empty();
            const on = this.settings.autoShowAnswerOnGraph;
            autoBtn.toggleClass("is-on", on);
            (0, import_obsidian11.setIcon)(autoBtn, on ? "pin" : "pin-off");
            autoBtn.createSpan({ text: on ? "Auto: on" : "Auto: off" });
            autoBtn.title = on ? "Every chat answer auto-highlights cited entities on the graph. Click to turn off." : "Click to auto-highlight cited entities on the graph for every chat answer.";
          };
          refreshAutoBtn();
          autoBtn.addEventListener("click", () => {
            void (async () => {
              this.settings.autoShowAnswerOnGraph = !this.settings.autoShowAnswerOnGraph;
              await this.host.saveSettings?.();
              refreshAutoBtn();
              if (this.settings.autoShowAnswerOnGraph && payload.entities.length > 0) {
                void this.showEntitiesOnGraph(payload.entities);
              }
            })();
          });
        }
        const copyBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Copy answer" } });
        (0, import_obsidian11.setIcon)(copyBtn, "copy");
        copyBtn.createSpan({ text: "Copy" });
        copyBtn.addEventListener("click", () => {
          void (async () => {
            await navigator.clipboard.writeText(answer);
            copyBtn.empty();
            (0, import_obsidian11.setIcon)(copyBtn, "check");
            copyBtn.createSpan({ text: "Copied" });
            activeWindow.setTimeout(() => {
              copyBtn.empty();
              (0, import_obsidian11.setIcon)(copyBtn, "copy");
              copyBtn.createSpan({ text: "Copy" });
            }, 1500);
          })();
        });
        const saveBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Save to note" } });
        (0, import_obsidian11.setIcon)(saveBtn, "file-plus");
        saveBtn.createSpan({ text: "Save to Note" });
        saveBtn.addEventListener("click", () => {
          void (async () => {
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
              (0, import_obsidian11.setIcon)(saveBtn, "check");
              saveBtn.createSpan({ text: "Saved" });
              new import_obsidian11.Notice(`Saved to ${path}`);
              activeWindow.setTimeout(() => {
                saveBtn.empty();
                (0, import_obsidian11.setIcon)(saveBtn, "file-plus");
                saveBtn.createSpan({ text: "Save to Note" });
              }, 2e3);
            } catch (e) {
              new import_obsidian11.Notice(`Save failed: ${e.message}`);
            }
          })();
        });
        const rerunBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Re-run" } });
        (0, import_obsidian11.setIcon)(rerunBtn, "rotate-ccw");
        rerunBtn.createSpan({ text: "Re-run" });
        rerunBtn.addEventListener("click", () => {
          const userTurns = this.currentTurns.filter((t) => t.role === "user");
          const last = userTurns[userTurns.length - 1]?.content;
          if (!last) return;
          this.populateInput(last);
          void this.submit();
        });
        if (payload && (payload.entities?.length || payload.documents?.length || payload.citations?.length)) {
          const evidenceBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Why did you say that" } });
          (0, import_obsidian11.setIcon)(evidenceBtn, "help-circle");
          evidenceBtn.createSpan({ text: "Why?" });
          evidenceBtn.addEventListener("click", () => this.openEvidenceModal(payload));
        }
        if (payload?.iterationTokens && payload.iterationTokens.length > 0) {
          const totalTokens = payload.iterationTokens.reduce(
            (s, t) => s + (typeof t === "number" ? t : t?.total ?? 0),
            0
          );
          const ms = payload.latencyMs;
          const meta = bubble.createDiv({ cls: "cortex-chat-turn-meta" });
          const parts = [];
          if (typeof ms === "number") parts.push(`${(ms / 1e3).toFixed(1)}s`);
          if (totalTokens > 0) parts.push(`${totalTokens.toLocaleString()} tokens`);
          const model = payload.model;
          if (model) parts.push(model);
          meta.setText(parts.join(" \xB7 "));
        }
      }
      /**
       * Open a modal that explains the retrieval evidence behind an answer:
       * which entities matched, which documents were pulled, and which
       * citations the assistant ended up using. Renders existing payload
       * fields — no extra request needed.
       */
      openEvidenceModal(payload) {
        const m = new class extends import_obsidian11.Modal {
          constructor(app) {
            super(app);
          }
          onOpen() {
            this.titleEl.setText("Why did the agent say that?");
            const body = this.contentEl;
            body.addClass("cortex-evidence-modal");
            if (payload.entities?.length) {
              body.createDiv({ cls: "cortex-evidence-section-label", text: `Entities matched (${payload.entities.length})` });
              const ul = body.createEl("ul", { cls: "cortex-evidence-list" });
              for (const e of payload.entities.slice(0, 30)) {
                const li = ul.createEl("li");
                li.createSpan({ cls: "cortex-evidence-name", text: e.name });
                li.createSpan({ cls: "cortex-evidence-type", text: e.type });
                if (typeof e.score === "number") li.createSpan({ cls: "cortex-evidence-score", text: e.score.toFixed(2) });
              }
            }
            if (payload.documents?.length) {
              body.createDiv({ cls: "cortex-evidence-section-label", text: `Documents retrieved (${payload.documents.length})` });
              const ul = body.createEl("ul", { cls: "cortex-evidence-list" });
              for (const d of payload.documents.slice(0, 30)) {
                const li = ul.createEl("li");
                li.createSpan({ cls: "cortex-evidence-name", text: d.title });
                if (d.snippet) li.createDiv({ cls: "cortex-evidence-snippet", text: d.snippet.slice(0, 200) });
                if (typeof d.matchPercent === "number") li.createSpan({ cls: "cortex-evidence-score", text: `${d.matchPercent}%` });
              }
            }
            if (payload.citations?.length) {
              body.createDiv({ cls: "cortex-evidence-section-label", text: `Citations cited (${payload.citations.length})` });
              const ul = body.createEl("ul", { cls: "cortex-evidence-list" });
              for (const c of payload.citations) {
                const li = ul.createEl("li");
                li.createSpan({ cls: "cortex-evidence-name", text: c.source });
                if (c.text) li.createDiv({ cls: "cortex-evidence-snippet", text: c.text.slice(0, 200) });
              }
            }
          }
          onClose() {
            this.contentEl.empty();
          }
        }(this.app);
        m.open();
      }
      /**
       * Push an OR-joined search filter into Obsidian's native Graph view that
       * matches the entities the chat just returned, so the user can see them
       * highlighted in their existing graph instead of a separate panel.
       *
       * Strategy (with graceful fallbacks):
       *   1. Activate or open the core Graph leaf in the main pane.
       *   2. Try the documented-internal path: set `view.engine.options.search`
       *      and call `view.engine.render()`.
       *   3. If that throws (Obsidian renamed/refactored the engine — has happened
       *      between minor versions), fall back to scraping the filter <input>
       *      out of the controls panel and dispatching an `input` event so the
       *      official UI runs the query.
       *   4. Add a tiny "Showing N entities from chat · Clear" pill on top of
       *      the graph leaf so the user knows where the filter came from.
       */
      async showEntitiesOnGraph(entities) {
        const names = uniqueNames(entities);
        if (names.length === 0) {
          new import_obsidian11.Notice("No entities returned in this answer.");
          return;
        }
        const resolvedBasenames = [];
        const unresolvedNames = [];
        for (const n of names) {
          const file = this.app.metadataCache.getFirstLinkpathDest(n, "");
          if (file?.basename) resolvedBasenames.push(file.basename);
          else unresolvedNames.push(n);
        }
        const allTerms = [...resolvedBasenames, ...unresolvedNames];
        if (allTerms.length === 0) {
          new import_obsidian11.Notice("Couldn't resolve any of the cited entities. Run a graph pull first?");
          return;
        }
        const query = allTerms.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(" OR ");
        const matchedCount = resolvedBasenames.length;
        let leaf = this.app.workspace.getLeavesOfType("graph")[0] ?? null;
        if (leaf && isGraphEngineCorrupted(leaf)) {
          leaf.detach();
          leaf = null;
        }
        if (!leaf) {
          const newLeaf = this.app.workspace.getLeaf(false);
          if (!newLeaf) {
            new import_obsidian11.Notice("Couldn't open Obsidian's graph view.");
            return;
          }
          await newLeaf.setViewState({ type: "graph", active: true });
          leaf = newLeaf;
        }
        void this.app.workspace.revealLeaf(leaf);
        this.host.onNavigate();
        const applied = await this.applyGraphFilter(leaf, query);
        if (!applied) {
          new import_obsidian11.Notice("Couldn't apply the graph filter \u2014 query copied to clipboard, paste it into the filters panel.");
          void navigator.clipboard.writeText(query);
          return;
        }
        const preview = allTerms.slice(0, 3).map((t) => `"${t}"`).join(", ");
        const more = allTerms.length > 3 ? ` (+${allTerms.length - 3} more)` : "";
        new import_obsidian11.Notice(`Graph filter set to ${preview}${more}. Non-matching nodes should now be dimmed.`, 4e3);
        this.renderGraphFilterPill(leaf, matchedCount, query, names.length);
      }
      /**
       * Push a search query into Obsidian's graph view. The graph filter dims
       * non-matching nodes when its `engine.options.search` changes AND the
       * engine re-renders. Different Obsidian versions name the engine and the
       * re-render method differently, so we try every known surface and verify
       * by reading the DOM input back.
       *
       * Returns true if at least one path took effect.
       */
      async applyGraphFilter(leaf, query) {
        const sleep = (ms) => new Promise((r) => activeWindow.setTimeout(r, ms));
        const waitFor = async (fn, ms = 2e3) => {
          const start = Date.now();
          while (Date.now() - start < ms) {
            const v = fn();
            if (v) return v;
            await sleep(50);
          }
          return null;
        };
        const view = leaf.view;
        const root = view?.containerEl;
        if (root) {
          const collapsed = root.querySelector(
            ".graph-control-section.is-collapsed > .tree-item-self, .graph-control-section.is-collapsed > .graph-control-section-header, .tree-item.graph-control-section.is-collapsed > .tree-item-self"
          );
          collapsed?.click();
        }
        let engineApplied = false;
        let inputApplied = false;
        if (root) {
          const input = await waitFor(() => findGraphFilterSearchInput(root));
          if (input) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value"
            )?.set;
            if (nativeSetter) nativeSetter.call(input, query);
            else input.value = query;
            input.dispatchEvent(new InputEvent("input", {
              bubbles: true,
              cancelable: true,
              inputType: "insertText",
              data: query
            }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            inputApplied = input.value === query;
          }
        }
        return engineApplied || inputApplied;
      }
      /** Render (or replace) the "Showing N of M entities from chat · Clear" pill on a graph leaf. */
      renderGraphFilterPill(leaf, matched, query, totalCited) {
        const root = leaf.view?.containerEl;
        if (!root) return;
        root.querySelectorAll(".cortex-graph-filter-pill").forEach((el) => el.remove());
        const pill = activeDocument.createElement("div");
        pill.className = "cortex-graph-filter-pill";
        const label = activeDocument.createElement("span");
        label.textContent = matched === totalCited ? `Showing ${matched} ${matched === 1 ? "entity" : "entities"} from chat` : `Showing ${matched} of ${totalCited} entities from chat`;
        pill.appendChild(label);
        if (matched < totalCited) {
          const hint = activeDocument.createElement("span");
          hint.className = "cortex-graph-filter-pill-hint";
          hint.textContent = ` \xB7 ${totalCited - matched} not in vault yet`;
          hint.title = "Run a graph pull from settings to materialize the rest as files.";
          pill.appendChild(hint);
        }
        const clearBtn = activeDocument.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.className = "cortex-graph-filter-pill-clear";
        clearBtn.addEventListener("click", () => {
          void this.applyGraphFilter(leaf, "");
          pill.remove();
        });
        pill.appendChild(clearBtn);
        pill.title = query;
        root.appendChild(pill);
      }
      async exportConversation() {
        if (this.currentTurns.length === 0) {
          new import_obsidian11.Notice("No messages to export.");
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
          new import_obsidian11.Notice(`Conversation exported to ${path}`);
        } catch (e) {
          new import_obsidian11.Notice(`Export failed: ${e.message}`);
        }
      }
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
        const walker = activeDocument.createTreeWalker(container, NodeFilter.SHOW_TEXT);
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
            const matchedName = match[1];
            if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
            const entity = entityMap.get(matchedName.toLowerCase());
            const link = activeDocument.createElement("a");
            link.className = "cortex-chat-inline-link";
            link.textContent = matchedName;
            link.href = "#";
            if (entity?.description) link.title = entity.description;
            link.addEventListener("click", (evt) => {
              evt.preventDefault();
              const target = this.app.metadataCache.getFirstLinkpathDest(matchedName, "");
              if (target) {
                void this.app.workspace.getLeaf(false).openFile(target);
                this.host.onNavigate();
              }
            });
            parts.push(link);
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < text.length) parts.push(text.slice(lastIndex));
          if (parts.length > 1) {
            const frag = activeDocument.createDocumentFragment();
            for (const p of parts) {
              if (typeof p === "string") frag.appendChild(activeDocument.createTextNode(p));
              else frag.appendChild(p);
            }
            textNode.replaceWith(frag);
          }
        }
      }
      /**
       * Render the mode/status pill in the chat title bar. Renders one of three
       * states: checking (gray dot), connected (green dot + mode + host), or
       * unreachable (red dot + mode + "offline"). The pill is also click-to-retry.
       */
      renderModePill(state) {
        if (!this.statusPillEl) return;
        this.statusPillEl.empty();
        this.statusPillEl.removeClass("is-checking", "is-connected", "is-offline");
        this.statusPillEl.addClass(`is-${state}`);
        const mode = this.settings.connectionMode === "local" ? "Local" : "Cloud";
        const host = (() => {
          try {
            return new URL(this.settings.apiUrl).host;
          } catch {
            return this.settings.apiUrl;
          }
        })();
        const dot = this.statusPillEl.createSpan({ cls: "cortex-chat-mode-dot" });
        if (state === "checking") {
          this.statusPillEl.createSpan({ text: `${mode} \xB7 checking\u2026` });
          this.statusPillEl.setAttr("aria-label", `${mode} mode, checking connection`);
          this.statusPillEl.setAttr("title", `${mode} mode (${host}) \u2014 checking\u2026`);
        } else if (state === "connected") {
          this.statusPillEl.createSpan({ text: mode });
          this.statusPillEl.setAttr("aria-label", `${mode} mode, connected to ${host}`);
          this.statusPillEl.setAttr("title", `Connected to ${host}. Click to recheck.`);
        } else {
          this.statusPillEl.createSpan({ text: `${mode} \xB7 offline` });
          this.statusPillEl.setAttr("aria-label", `${mode} mode, cannot reach ${host}`);
          this.statusPillEl.setAttr("title", `Cannot reach ${host}. Click to retry.`);
        }
        this.statusPillEl.onclick = () => {
          void this.runModeProbe();
        };
      }
      /**
       * Probe /health on the configured apiUrl and update the pill. Polls every
       * 30s while the panel is mounted. The poll cadence is intentionally lazy —
       * the goal is "did the stack just go down?" not real-time uptime monitoring.
       */
      async runModeProbe() {
        if (!this.statusPillEl) return;
        this.renderModePill("checking");
        const ok = await this.probeHealth();
        this.renderModePill(ok ? "connected" : "offline");
        if (this.statusPollTimer == null) {
          this.statusPollTimer = window.setInterval(() => {
            void this.runModeProbe();
          }, 3e4);
        }
      }
      async probeHealth() {
        const cleanUrl = (this.settings.apiUrl || "").replace(/\/$/, "");
        if (!cleanUrl) return false;
        try {
          const res = await (0, import_obsidian11.requestUrl)({ url: `${cleanUrl}/health`, method: "GET", throw: false });
          return res.status >= 200 && (res.status < 400 || res.status === 503);
        } catch {
          return false;
        }
      }
    };
  }
});

// src/views/diff-modal.ts
var diff_modal_exports = {};
__export(diff_modal_exports, {
  DiffModal: () => DiffModal
});
var import_obsidian17, PAGE_SIZE, MAX_NAMES_TO_SHOW, DiffModal;
var init_diff_modal = __esm({
  "src/views/diff-modal.ts"() {
    "use strict";
    import_obsidian17 = require("obsidian");
    PAGE_SIZE = 500;
    MAX_NAMES_TO_SHOW = 50;
    DiffModal = class extends import_obsidian17.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.cancelToken = { aborted: false };
      }
      async onOpen() {
        this.modalEl.addClass("cortex-diff-modal");
        this.titleEl.setText("Vault \u2194 graph diff");
        this.bodyEl = this.contentEl.createDiv({ cls: "cortex-diff-body" });
        this.statusEl = this.bodyEl.createDiv({ cls: "cortex-diff-status" });
        this.statusEl.setText("Loading\u2026");
        try {
          const startTime = Date.now();
          const graphNames = await this.fetchAllGraphNoteNames((progress) => {
            if (this.cancelToken.aborted) return;
            this.statusEl.setText(`Fetching graph notes\u2026 ${progress} so far`);
          });
          if (this.cancelToken.aborted) return;
          this.statusEl.setText("Computing diff\u2026");
          const diff = await this.plugin.sync.computeVaultGraphDiff(graphNames);
          if (this.cancelToken.aborted) return;
          const elapsedMs = Date.now() - startTime;
          this.renderDiff(diff, graphNames.size, elapsedMs);
        } catch (e) {
          this.statusEl.empty();
          const err = this.statusEl.createDiv({ cls: "cortex-diff-error" });
          const ic = err.createSpan({ cls: "cortex-diff-error-icon" });
          (0, import_obsidian17.setIcon)(ic, "alert-circle");
          err.createSpan({ text: `Couldn't load diff: ${e.message}` });
        }
      }
      onClose() {
        this.cancelToken.aborted = true;
        this.contentEl.empty();
      }
      /**
       * Paginate through `/v1/graph/entities?type=Note` until exhausted. Each
       * Note entity has a `name` (basename) we use as the diff match key.
       */
      async fetchAllGraphNoteNames(onProgress) {
        const names = /* @__PURE__ */ new Set();
        let offset = 0;
        while (!this.cancelToken.aborted) {
          const page = await this.plugin.client.exportGraphPage({
            entityTypes: ["Note"],
            limit: PAGE_SIZE,
            offset,
            includeRelationships: false
          });
          for (const e of page.entities) {
            if (e.name && typeof e.name === "string") names.add(e.name);
          }
          onProgress(names.size);
          if (page.entities.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }
        return names;
      }
      renderDiff(diff, graphTotal, elapsedMs) {
        this.bodyEl.empty();
        const summary = this.bodyEl.createDiv({ cls: "cortex-diff-summary" });
        this.summaryTile(summary, diff.vaultOnly.length.toLocaleString(), "Vault only", "Need to push");
        this.summaryTile(summary, diff.drifted.length.toLocaleString(), "Drifted", "Local newer than graph");
        this.summaryTile(summary, diff.graphOnly.length.toLocaleString(), "Graph only", "Likely deleted locally");
        this.summaryTile(summary, diff.inSync.length.toLocaleString(), "In sync", "Healthy");
        const meta = this.bodyEl.createDiv({ cls: "cortex-diff-meta" });
        meta.setText(
          `Vault: ${(diff.vaultOnly.length + diff.drifted.length + diff.inSync.length).toLocaleString()} notes  \xB7  Graph: ${graphTotal.toLocaleString()} notes  \xB7  ${elapsedMs}ms`
        );
        if (diff.vaultOnly.length > 0) {
          this.renderBucket({
            title: `Vault only \u2014 needs sync (${diff.vaultOnly.length})`,
            description: "Files exist locally but no matching Note entity in the graph. These haven't been synced yet.",
            names: diff.vaultOnly.map((f) => f.basename),
            files: diff.vaultOnly,
            actionLabel: "Sync these",
            actionIcon: "arrow-up",
            action: () => this.bulkSync(diff.vaultOnly),
            kind: "warning"
          });
        }
        if (diff.drifted.length > 0) {
          this.renderBucket({
            title: `Drifted \u2014 local newer than graph (${diff.drifted.length})`,
            description: "Local file mtime is newer than the last-synced timestamp. The graph likely has stale content.",
            names: diff.drifted.map((f) => f.basename),
            files: diff.drifted,
            actionLabel: "Re-sync these",
            actionIcon: "refresh-cw",
            action: () => this.bulkSync(diff.drifted),
            kind: "warning"
          });
        }
        if (diff.graphOnly.length > 0) {
          this.renderBucket({
            title: `Graph only \u2014 orphaned in graph (${diff.graphOnly.length})`,
            description: "Note entities in the graph with no matching vault file. Usually means the file was deleted locally and the deletion didn't propagate, or the graph was pulled from a different vault.",
            names: diff.graphOnly,
            files: null,
            actionLabel: null,
            actionIcon: null,
            action: null,
            kind: "info"
          });
        }
        if (diff.inSync.length > 0) {
          this.renderBucket({
            title: `In sync (${diff.inSync.length})`,
            description: "Local file matches the graph version. No action needed.",
            names: diff.inSync.map((f) => f.basename),
            files: diff.inSync,
            actionLabel: null,
            actionIcon: null,
            action: null,
            kind: "ok",
            collapsedByDefault: true
          });
        }
        const footer = this.bodyEl.createDiv({ cls: "cortex-diff-footer" });
        const refreshBtn = footer.createEl("button", { text: "Refresh" });
        refreshBtn.addEventListener("click", () => {
          void (async () => {
            this.cancelToken = { aborted: false };
            this.bodyEl.empty();
            this.statusEl = this.bodyEl.createDiv({ cls: "cortex-diff-status", text: "Loading\u2026" });
            await this.onOpen();
          })();
        });
        const closeBtn = footer.createEl("button", { text: "Close", cls: "mod-cta" });
        closeBtn.addEventListener("click", () => this.close());
      }
      summaryTile(parent, value, label, sub) {
        const tile = parent.createDiv({ cls: "cortex-diff-tile" });
        tile.createDiv({ cls: "cortex-diff-tile-value", text: value });
        tile.createDiv({ cls: "cortex-diff-tile-label", text: label });
        tile.createDiv({ cls: "cortex-diff-tile-sub", text: sub });
      }
      renderBucket(opts) {
        const wrap = this.bodyEl.createEl("details", { cls: `cortex-diff-bucket cortex-diff-bucket-${opts.kind}` });
        if (!opts.collapsedByDefault) wrap.setAttr("open", "");
        const summary = wrap.createEl("summary", { cls: "cortex-diff-bucket-summary" });
        summary.createSpan({ cls: "cortex-diff-bucket-title", text: opts.title });
        const body = wrap.createDiv({ cls: "cortex-diff-bucket-body" });
        body.createEl("p", { cls: "cortex-diff-bucket-desc", text: opts.description });
        if (opts.action && opts.actionLabel) {
          const actionRow = body.createDiv({ cls: "cortex-diff-bucket-actions" });
          const btn = actionRow.createEl("button", { cls: "mod-cta cortex-diff-bucket-action" });
          if (opts.actionIcon) {
            const ic = btn.createSpan({ cls: "cortex-diff-bucket-action-icon" });
            (0, import_obsidian17.setIcon)(ic, opts.actionIcon);
          }
          btn.createSpan({ text: opts.actionLabel });
          btn.addEventListener("click", () => void opts.action());
        }
        const list = body.createDiv({ cls: "cortex-diff-bucket-list" });
        const visible = opts.names.slice(0, MAX_NAMES_TO_SHOW);
        for (const name of visible) {
          const row = list.createDiv({ cls: "cortex-diff-bucket-row" });
          const link = row.createEl("a", { text: name, attr: { href: "#" } });
          if (opts.files) {
            const file = opts.files.find((f) => f.basename === name);
            if (file) {
              link.addEventListener("click", (evt) => {
                evt.preventDefault();
                void this.app.workspace.getLeaf(false).openFile(file);
                this.close();
              });
            }
          } else {
            const target = this.app.metadataCache.getFirstLinkpathDest(name, "");
            if (target) {
              link.addEventListener("click", (evt) => {
                evt.preventDefault();
                void this.app.workspace.getLeaf(false).openFile(target);
                this.close();
              });
            } else {
              link.removeAttribute("href");
              link.addClass("cortex-diff-row-unlinked");
            }
          }
        }
        if (opts.names.length > MAX_NAMES_TO_SHOW) {
          list.createDiv({
            cls: "cortex-diff-bucket-more",
            text: `+${opts.names.length - MAX_NAMES_TO_SHOW} more not shown.`
          });
        }
      }
      /**
       * Push each file in series, throttled so we don't spike the LLM provider.
       * Surfaces progress in the status row and a final Notice.
       */
      async bulkSync(files) {
        if (files.length === 0) return;
        const total = files.length;
        let done = 0;
        let failed = 0;
        const oldText = this.statusEl.textContent;
        const update = () => {
          this.statusEl.setText(`Syncing ${done}/${total}${failed > 0 ? ` \xB7 ${failed} failed` : ""}\u2026`);
        };
        update();
        for (const f of files) {
          if (this.cancelToken.aborted) break;
          try {
            await this.plugin.sync.syncOneFile(f);
          } catch (e) {
            console.warn(`[Cortex] Diff bulk sync failed for ${f.path}:`, e);
            failed++;
          }
          done++;
          update();
        }
        new import_obsidian17.Notice(`Diff sync complete \u2014 ${done - failed} pushed, ${failed} failed.`, 4e3);
        this.statusEl.setText(oldText ?? "");
        this.bodyEl.empty();
        this.statusEl = this.bodyEl.createDiv({ cls: "cortex-diff-status", text: "Refreshing\u2026" });
        await this.onOpen();
      }
    };
  }
});

// src/views/sync-modal.ts
var sync_modal_exports = {};
__export(sync_modal_exports, {
  SyncModal: () => SyncModal
});
function relativeTime2(ts) {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 6e4);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
var import_obsidian18, SyncModal;
var init_sync_modal = __esm({
  "src/views/sync-modal.ts"() {
    "use strict";
    import_obsidian18 = require("obsidian");
    init_error_format();
    init_confirm_modal();
    SyncModal = class extends import_obsidian18.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        /** Cached so both stats fills can independently trigger banner re-eval. */
        this.graphEntityCount = null;
      }
      onOpen() {
        this.modalEl.addClass("cortex-sync-modal");
        this.titleEl.setText("Hangarx sync");
        void this.renderPicker();
      }
      onClose() {
        this.contentEl.empty();
      }
      // ────────────────────────────────────────────────────────────────────
      // Picker
      // ────────────────────────────────────────────────────────────────────
      // No `await` inside; uses fire-and-forget Promise chains instead.
      // Dropping `async` satisfies @typescript-eslint/require-await.
      renderPicker() {
        const c = this.contentEl;
        c.empty();
        c.addClass("cortex-sync-body");
        this.titleEl.setText("Hangarx sync");
        const s = this.plugin.settings;
        let host = s.apiUrl;
        try {
          host = new URL(s.apiUrl).host;
        } catch {
        }
        const badge = c.createDiv({ cls: "cortex-sync-badge" });
        const dot = badge.createSpan({ cls: "cortex-sync-badge-dot" });
        dot.addClass(s.connectionMode === "cloud" ? "is-cloud" : "is-local");
        badge.createSpan({
          cls: "cortex-sync-badge-text",
          text: `${s.connectionMode === "cloud" ? "Cloud" : "Local"} \xB7 ${host}`
        });
        const stats = c.createDiv({ cls: "cortex-sync-stats" });
        const vaultTile = this.statTile(stats, "file-text", "\u2014", "Notes in vault");
        const graphTile = this.statTile(stats, "network", "\u2014", "Entities in knowledge graph");
        const changesTile = this.statTile(stats, "history", "\u2014", "Changed since last sync");
        const banner = c.createDiv({ cls: "cortex-sync-banner is-hidden" });
        const actions = c.createDiv({ cls: "cortex-sync-actions" });
        this.actionCard(actions, {
          icon: "arrow-up",
          title: "Push vault to knowledge graph",
          description: "Send your changed notes to the knowledge graph. Skips files that haven't changed since last sync.",
          onClick: () => void this.runAction("push")
        });
        this.actionCard(actions, {
          icon: "arrow-down",
          title: "Import knowledge graph into vault",
          description: "Materialize knowledge graph entities + relationships as markdown so they appear in Obsidian's graph view.",
          onClick: () => void this.runAction("pull")
        });
        this.actionCard(actions, {
          icon: "refresh-cw",
          title: "Two-way sync",
          description: "Push first, then import. Keeps both sides aligned.",
          onClick: () => void this.runAction("both")
        });
        this.actionCard(actions, {
          icon: "git-compare",
          title: "Diff vault \u2194 knowledge graph",
          description: "See what's out of sync \u2014 local notes missing from the knowledge graph, knowledge graph entities orphaned, files newer than their last sync.",
          onClick: () => {
            this.close();
            void Promise.resolve().then(() => (init_diff_modal(), diff_modal_exports)).then((m) => new m.DiffModal(this.app, this.plugin).open());
          }
        });
        const forceCard = this.actionCard(actions, {
          icon: "rotate-cw",
          title: "Force re-ingest entire vault",
          description: "Wipes the local sync index and re-pushes every note. Use after the server knowledge graph has been reset (e.g. Docker volume wiped).",
          onClick: () => void this.runAction("force-reingest")
        });
        forceCard.addClass("cortex-sync-action-danger");
        const footer = c.createDiv({ cls: "cortex-sync-footer" });
        footer.createSpan({
          text: `Auto-sync on startup: ${s.syncOnStartup ? "On" : "Off"} \xB7 `
        });
        const link = footer.createEl("a", {
          text: "Change in settings",
          attr: { href: "#" }
        });
        link.addEventListener("click", (evt) => {
          evt.preventDefault();
          this.close();
          const settingApi = this.app.setting;
          settingApi?.open?.();
          settingApi?.openTabById?.(this.plugin.manifest.id);
        });
        this.fillStats(vaultTile, graphTile, changesTile, banner);
      }
      // Uses `.then().catch()` chains for fire-and-forget; no `await` is
      // necessary, so we drop `async` and the Promise return type to
      // satisfy @typescript-eslint/require-await.
      fillStats(vaultTile, graphTile, changesTile, banner) {
        const fileCount = this.app.vault.getMarkdownFiles().length;
        this.setStatValue(vaultTile, fileCount.toLocaleString());
        let lastSyncedAt = null;
        void this.plugin.sync.getChangesSinceLastSync().then((c) => {
          lastSyncedAt = c.lastSyncedAt;
          const parts = [];
          if (c.added > 0) parts.push(`+${c.added}`);
          if (c.changed > 0) parts.push(`~${c.changed}`);
          if (c.deleted > 0) parts.push(`-${c.deleted}`);
          const headline = parts.length > 0 ? parts.join(" ") : "0";
          this.setStatValue(changesTile, headline);
          const sub = changesTile.querySelector(".cortex-sync-stat-sub");
          if (sub && c.lastSyncedAt) {
            sub.textContent = `Last sync ${relativeTime2(c.lastSyncedAt)}`;
          }
          this.maybeShowMismatchBanner(banner, fileCount, lastSyncedAt);
        }).catch(() => {
          this.setStatValue(changesTile, "\u2014");
        });
        void this.plugin.client.getGraphStats().then((g) => {
          this.setStatValue(graphTile, g.totalEntities.toLocaleString());
          this.graphEntityCount = g.totalEntities;
          this.maybeShowMismatchBanner(banner, fileCount, lastSyncedAt);
        }).catch(() => {
          this.setStatValue(graphTile, "\u2014");
        });
      }
      /**
       * Stale-index detection: a populated vault that's been "synced before" but
       * shows zero entities on the server is the classic "Docker volume got
       * wiped, plugin still thinks files are pushed" mismatch. The fix is to
       * clear the local hash index and re-ingest — surface the option here so
       * the user doesn't have to dig into Cmd-P to find it.
       */
      maybeShowMismatchBanner(banner, fileCount, lastSyncedAt) {
        if (this.graphEntityCount === null) return;
        const hasStaleIndex = lastSyncedAt !== null && this.graphEntityCount === 0 && fileCount >= 50;
        if (!hasStaleIndex) {
          banner.addClass("is-hidden");
          return;
        }
        banner.removeClass("is-hidden");
        banner.empty();
        const ic = banner.createSpan({ cls: "cortex-sync-banner-icon" });
        (0, import_obsidian18.setIcon)(ic, "alert-triangle");
        const text = banner.createSpan();
        text.createEl("strong", { text: "Graph is empty but your vault has notes. " });
        text.createSpan({
          text: `Last sync ${lastSyncedAt ? relativeTime2(lastSyncedAt) : "a while ago"}. The server graph may have been reset (e.g. Docker volume wiped) \u2014 pushing won't repair it because the plugin thinks files are already synced. Use `
        });
        text.createEl("strong", { text: "Force re-ingest" });
        text.createSpan({ text: " below to wipe the local index and re-push every note." });
      }
      // ────────────────────────────────────────────────────────────────────
      // Action dispatch
      // ────────────────────────────────────────────────────────────────────
      async runAction(action) {
        if (!this.preflight()) return;
        if (action === "pull") {
          this.close();
          this.plugin.runGraphPull();
          return;
        }
        if (action === "push") {
          await this.runPush();
          return;
        }
        if (action === "force-reingest") {
          const fileCount = this.app.vault.getMarkdownFiles().length;
          const ok = await confirmModal(this.app, {
            title: `Force-resync ${fileCount} files?`,
            body: `This wipes the local sync index and re-pushes every note into the knowledge graph.

Use after the server graph has been reset (Docker volume wiped, container rebuilt). Your notes themselves aren't touched.`,
            confirmText: "Force resync",
            destructive: true
          });
          if (!ok) return;
          await this.runPush({ forceReingest: true });
          return;
        }
        await this.runPush({ thenPull: true });
      }
      /** Render the in-modal progress UI for a push, then optionally chain a pull.
       *  When forceReingest is set, the local sync index is cleared first so every
       *  file is treated as new and re-pushed. */
      async runPush(opts = {}) {
        const c = this.contentEl;
        c.empty();
        this.titleEl.setText(
          opts.forceReingest ? "HangarX Force Re-ingest" : opts.thenPull ? "HangarX Two-way Sync" : "HangarX Push"
        );
        let inFlight = true;
        this.renderBackBar(c, () => inFlight);
        const phaseRow = c.createDiv({ cls: "cortex-pull-phase-row" });
        const phaseIcon = phaseRow.createSpan({ cls: "cortex-pull-phase-icon" });
        (0, import_obsidian18.setIcon)(phaseIcon, opts.forceReingest ? "rotate-cw" : "arrow-up");
        const phaseEl = phaseRow.createSpan({
          cls: "cortex-pull-phase-label",
          text: opts.forceReingest ? "Clearing local index\u2026" : "Pushing vault\u2026"
        });
        const messageEl = c.createDiv({ cls: "cortex-pull-message" });
        const barWrap = c.createDiv({ cls: "cortex-pull-bar-wrap" });
        const barFill = barWrap.createDiv({ cls: "cortex-pull-bar-fill" });
        const statsEl = c.createDiv({ cls: "cortex-pull-stats" });
        const btnRow = c.createDiv({ cls: "cortex-pull-btn-row" });
        const cancelBtn = btnRow.createEl("button", { cls: "cortex-pull-cancel", text: "Cancel" });
        const abort = new AbortController();
        let lastInFlight = 0;
        let cancelling = false;
        cancelBtn.addEventListener("click", () => {
          abort.abort();
          cancelling = true;
          cancelBtn.setText("Cancelling\u2026");
          cancelBtn.setAttr("disabled", "true");
          phaseEl.setText("Cancelling\u2026");
          messageEl.setText(
            `${lastInFlight} ${lastInFlight === 1 ? "file" : "files"} in flight on the server \u2014 waiting to drain (up to ~30s)\u2026`
          );
        });
        let pushResult = null;
        try {
          if (opts.forceReingest) {
            await this.plugin.sync.clearIndex();
            phaseEl.setText("Re-pushing every note\u2026");
          }
          pushResult = await this.plugin.sync.fullSync({
            signal: abort.signal,
            onProgress: ({ phase, done, total, currentPath }) => {
              lastInFlight = Math.min(6, total - done);
              if (cancelling) return;
              if (total > 0) {
                const pct = Math.min(100, Math.round(done / total * 100));
                barFill.setCssStyles({ width: `${pct}%` });
              }
              const verb = phase === "sync" ? "Syncing" : "Removing";
              const where = currentPath ? ` \xB7 ${currentPath.split("/").pop()}` : "";
              phaseEl.setText(`${verb} ${done} / ${total}`);
              messageEl.setText(where ? where.slice(3) : "");
            }
          });
          barFill.addClass("cortex-pull-bar-done");
          barFill.setCssStyles({ width: "100%" });
          phaseEl.setText("Push complete");
          messageEl.empty();
          inFlight = false;
        } catch (e) {
          inFlight = false;
          this.renderError(c, statsEl, btnRow, cancelBtn, e, () => void this.runPush(opts));
          return;
        }
        if (opts.thenPull) {
          new import_obsidian18.Notice(
            `Push complete \u2014 ${pushResult.synced} synced, ${pushResult.deleted} removed, ${pushResult.skipped} skipped. Starting import\u2026`,
            4e3
          );
          this.close();
          this.plugin.runGraphPull();
          return;
        }
        statsEl.empty();
        const grid = statsEl.createDiv({ cls: "cortex-pull-stat-grid" });
        this.receiptItem(grid, "plus-circle", `${pushResult.synced} synced`, "cortex-pull-stat-create");
        this.receiptItem(grid, "trash-2", `${pushResult.deleted} removed`, "cortex-pull-stat-delete");
        this.receiptItem(grid, "minus-circle", `${pushResult.skipped} skipped (unchanged)`, "cortex-pull-stat-total");
        btnRow.empty();
        const doneBtn = btnRow.createEl("button", {
          text: "Done",
          cls: "mod-cta",
          attr: { type: "button" }
        });
        doneBtn.addEventListener("click", () => this.close());
        const again = btnRow.createEl("button", {
          text: "Run another",
          attr: { type: "button" }
        });
        again.addEventListener("click", () => void this.renderPicker());
      }
      // ────────────────────────────────────────────────────────────────────
      // Helpers
      // ────────────────────────────────────────────────────────────────────
      preflight() {
        const s = this.plugin.settings;
        if (!s.apiKey && s.connectionMode === "cloud") {
          new import_obsidian18.Notice("HangarX: API key is empty. Open settings \u2192 connection.");
          return false;
        }
        if (!s.workspaceId) {
          new import_obsidian18.Notice("HangarX: Workspace ID is empty. Open settings \u2192 connection.");
          return false;
        }
        return true;
      }
      statTile(parent, icon, value, label) {
        const tile = parent.createDiv({ cls: "cortex-sync-stat" });
        const ic = tile.createSpan({ cls: "cortex-sync-stat-icon" });
        (0, import_obsidian18.setIcon)(ic, icon);
        const body = tile.createDiv({ cls: "cortex-sync-stat-body" });
        body.createDiv({ cls: "cortex-sync-stat-value", text: value });
        body.createDiv({ cls: "cortex-sync-stat-label", text: label });
        body.createDiv({ cls: "cortex-sync-stat-sub", text: "" });
        return tile;
      }
      setStatValue(tile, value) {
        const valueEl = tile.querySelector(".cortex-sync-stat-value");
        if (valueEl) valueEl.textContent = value;
      }
      actionCard(parent, opts) {
        const card = parent.createDiv({ cls: "cortex-sync-action", attr: { role: "button", tabindex: "0" } });
        const icWrap = card.createSpan({ cls: "cortex-sync-action-icon" });
        (0, import_obsidian18.setIcon)(icWrap, opts.icon);
        const body = card.createDiv({ cls: "cortex-sync-action-body" });
        body.createDiv({ cls: "cortex-sync-action-title", text: opts.title });
        body.createDiv({ cls: "cortex-sync-action-desc", text: opts.description });
        const chevron = card.createSpan({ cls: "cortex-sync-action-chevron" });
        (0, import_obsidian18.setIcon)(chevron, "chevron-right");
        card.addEventListener("click", opts.onClick);
        card.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter" || evt.key === " ") {
            evt.preventDefault();
            opts.onClick();
          }
        });
        return card;
      }
      /**
       * Subtle "← Back to sync menu" affordance rendered at the top of every
       * non-picker screen. If a run is in flight, asks the user to confirm
       * before bouncing back (the underlying sync will keep running in the
       * background — fullSync persists per-file state as it goes — but the
       * progress UI is gone).
       */
      renderBackBar(parent, isInFlight) {
        const bar = parent.createDiv({ cls: "cortex-sync-backbar" });
        const btn = bar.createEl("button", {
          cls: "cortex-sync-backbtn",
          attr: { type: "button", "aria-label": "Back to sync menu" }
        });
        const ic = btn.createSpan({ cls: "cortex-sync-backbtn-icon" });
        (0, import_obsidian18.setIcon)(ic, "arrow-left");
        btn.createSpan({ text: "Back to sync menu" });
        btn.addEventListener("click", () => {
          if (isInFlight()) {
            void confirmModal(this.app, {
              title: "Sync is still running",
              body: "Going back hides the progress UI but the sync keeps running. Continue?",
              confirmText: "Hide and continue"
            }).then((ok) => {
              if (ok) void this.renderPicker();
            });
            return;
          }
          void this.renderPicker();
        });
      }
      receiptItem(parent, icon, text, cls) {
        const item = parent.createDiv({ cls: `cortex-pull-stat ${cls}` });
        const ic = item.createSpan({ cls: "cortex-pull-stat-icon" });
        (0, import_obsidian18.setIcon)(ic, icon);
        item.createSpan({ text });
      }
      renderError(_rootEl, statsEl, btnRow, _cancelBtn, err, onRetry) {
        const fmt = formatError(err, "Push failed");
        statsEl.empty();
        const card = statsEl.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
        const head = card.createDiv({ cls: "cortex-error-head" });
        const ic = head.createSpan({ cls: "cortex-error-icon" });
        (0, import_obsidian18.setIcon)(ic, errorIcon(fmt.kind));
        head.createSpan({ cls: "cortex-error-headline", text: fmt.headline });
        if (fmt.hint) card.createDiv({ cls: "cortex-error-hint", text: fmt.hint });
        const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
        detailWrap.createEl("summary", { text: "Error details" });
        detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
        btnRow.empty();
        const retry = btnRow.createEl("button", { text: "Retry", cls: "mod-cta" });
        retry.addEventListener("click", onRetry);
        const back = btnRow.createEl("button", { text: "Back" });
        back.addEventListener("click", () => void this.renderPicker());
      }
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CortexPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian20 = require("obsidian");

// src/cortex-client.ts
var import_obsidian = require("obsidian");
function effectiveWorkspaceId(s) {
  if (s.connectionMode === "local") {
    return s.vaultId || s.workspaceId || "";
  }
  return s.workspaceId || "";
}
var CortexClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  async req(path, init = {}) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.settings.apiKey) headers.Authorization = `Bearer ${this.settings.apiKey}`;
    const wsId = effectiveWorkspaceId(this.settings);
    if (wsId) headers["x-workspace-id"] = wsId;
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
   *
   * `fastMode` raises the LLM context cap and harmonizer concurrency at the
   * cost of skipping post-ingest VDB indexing + community detection. Use it
   * for force re-ingest where the user will follow up with a maintenance run
   * (see ChatPanel "Rebuild communities + reindex" command). Regular sync
   * should leave it false so retrieval quality stays consistent.
   */
  async ingestNote(filePath, content, opts = {}) {
    const res = await this.req("/v1/ingest/files/upload-json", {
      method: "POST",
      headers: opts.syncJobId ? { "x-sync-job-id": opts.syncJobId } : void 0,
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype: "text/markdown",
          contentText: content
        },
        workspaceId: effectiveWorkspaceId(this.settings),
        vaultId: this.settings.vaultId,
        sourceType: "md",
        fastMode: opts.fastMode === true
      })
    });
    return res.data;
  }
  /**
   * Upload a binary attachment (image, PDF, audio, video). The backend
   * decodes contentBase64; mimetype drives the right extraction pipeline.
   */
  async ingestBinary(filePath, mimetype, base64, opts = {}) {
    const res = await this.req("/v1/ingest/files/upload-json", {
      method: "POST",
      headers: opts.syncJobId ? { "x-sync-job-id": opts.syncJobId } : void 0,
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype,
          contentBase64: base64
        },
        workspaceId: effectiveWorkspaceId(this.settings),
        vaultId: this.settings.vaultId,
        sourceType: mimetype.split("/")[0] || "file",
        fastMode: false
      })
    });
    return res.data;
  }
  /**
   * Cancel an in-flight sync job. Sets a server-side flag that ingest workers
   * check at chunk boundaries — in-flight files bail out at the next safe
   * point, queued files don't start. Idempotent.
   */
  async cancelSyncJob(jobId) {
    if (!jobId) return;
    await this.req(`/v1/ingest/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
  }
  /**
   * Run community detection (Louvain by default) and persist results. Used
   * after a fastMode re-ingest to populate community-level retrieval which
   * the ingest path skipped. Workspace is taken from settings; the server
   * falls back to the request user's default if no workspace is set.
   */
  async detectCommunities(opts = {}) {
    const body = {
      ...opts,
      ...effectiveWorkspaceId(this.settings) ? { workspaceId: effectiveWorkspaceId(this.settings) } : {}
    };
    const res = await this.req(
      "/v1/graph/communities/detect",
      { method: "POST", body: JSON.stringify(body) }
    );
    return res.data;
  }
  async listCommunities(opts = {}) {
    const params = new URLSearchParams();
    if (effectiveWorkspaceId(this.settings)) params.set("workspaceId", effectiveWorkspaceId(this.settings));
    if (opts.level !== void 0) params.set("level", String(opts.level));
    if (opts.minMembers !== void 0) params.set("minMembers", String(opts.minMembers));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const res = await this.req(
      `/v1/graph/communities?${params.toString()}`
    );
    return res.data?.communities ?? [];
  }
  /**
   * Backfill embeddings on entities that were ingested without them (the
   * structured-entity VDB indexing that fastMode skips). Idempotent — safe to
   * run repeatedly; entities that already have embeddings are skipped.
   */
  async backfillEntityEmbeddings() {
    const res = await this.req("/v1/search/vectors/backfill-entity-embeddings", {
      method: "POST",
      body: JSON.stringify({})
    });
    return res.data;
  }
  async deleteNote(filePath) {
    await this.req("/v1/ingest/documents/by-path/delete", {
      method: "POST",
      body: JSON.stringify({
        filePath,
        workspaceId: effectiveWorkspaceId(this.settings),
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
        workspaceId: effectiveWorkspaceId(this.settings),
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
      workspaceId: effectiveWorkspaceId(this.settings)
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
      workspaceId: effectiveWorkspaceId(this.settings)
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    return (res.data?.entities ?? []).filter((e) => typeof e.name === "string").map((e) => ({ id: e.id, name: e.name, type: e.type }));
  }
  async related(noteName, limit = 10) {
    const params = new URLSearchParams({
      q: noteName,
      type: "Note",
      limit: String(limit),
      workspaceId: effectiveWorkspaceId(this.settings)
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    return (res.data?.entities ?? []).filter(
      (e) => typeof e?.name === "string" && e.name !== noteName
    ).map((e) => ({
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
      workspaceId: effectiveWorkspaceId(this.settings)
    });
    const res = await this.req(
      `/v1/graph/explore/paths?${params.toString()}`
    );
    return (res.data?.paths ?? []).map((p) => {
      const nodes = p.nodes ?? [];
      const edges = p.edges ?? [];
      const steps = edges.map((edge, i) => ({
        fromName: nodes[i]?.label ?? edge.source ?? "",
        fromType: nodes[i]?.type ?? "",
        toName: nodes[i + 1]?.label ?? edge.target ?? "",
        toType: nodes[i + 1]?.type ?? "",
        relType: edge.type ?? ""
      }));
      return { steps, length: typeof p.length === "number" ? p.length : steps.length };
    });
  }
  /** Find contradicting claims across the workspace. */
  async findContradictions(limit = 25) {
    const params = new URLSearchParams({
      workspaceId: effectiveWorkspaceId(this.settings),
      limit: String(limit)
    });
    const res = await this.req(
      `/v1/graph/claims/contradictions?${params.toString()}`
    );
    return (res.data?.contradictions ?? []).map((c) => ({
      conflictType: c.conflictType ?? "direct",
      conflictDescription: c.conflictDescription ?? "",
      confidence: c.confidence ?? 0,
      claim1: {
        id: c.claim1?.id ?? "",
        text: c.claim1?.text ?? "",
        subject: c.claim1?.subject ?? "",
        sourceName: c.claim1?.source?.sourceName ?? c.claim1?.sourceName
      },
      claim2: {
        id: c.claim2?.id ?? "",
        text: c.claim2?.text ?? "",
        subject: c.claim2?.subject ?? "",
        sourceName: c.claim2?.source?.sourceName ?? c.claim2?.sourceName
      }
    }));
  }
  /** Persist a memory item (e.g. user preference) for future chat sessions. */
  async remember(content, source = "conversation") {
    await this.req("/v1/memory/remember", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: effectiveWorkspaceId(this.settings),
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
        workspaceId: effectiveWorkspaceId(this.settings),
        agentId: "hangarx-obsidian",
        query,
        method: "hybrid",
        limit
      })
    });
    return (res.data?.items ?? []).map((m) => ({
      id: m.id,
      content: m.content ?? "",
      source: m.source,
      priority: m.priority,
      createdAt: m.createdAt
    }));
  }
  /**
   * Probe which web-search backend the cortex-api will use for the
   * next `web_search` tool call. Returns the active LLM provider's
   * native search when configured (OpenAI / Anthropic / Gemini), else
   * Perplexity fallback, else `'none'`. Used by the settings page to
   * render an accurate dependency hint.
   */
  async getWebSearchStatus() {
    const res = await this.req("/v1/agent/web-search-status", { method: "GET" });
    return res.data;
  }
  async ask(query, _sessionId) {
    const agentMode = this.settings.chatAgentMode === "agent";
    const enabledTools = agentMode ? [
      "knowledge_graph_search",
      "cortex_paths",
      "cortex_recall",
      // L3 memory (Sprint 7)
      "cortex_remember",
      // L3 memory (Sprint 7)
      "get_current_time",
      ...this.settings.chatAgentWebSearch ? ["web_search", "web_scrape"] : []
    ] : void 0;
    const res = await this.req("/v1/ask/chat/answer", {
      method: "POST",
      body: JSON.stringify({
        message: query,
        workspaceId: effectiveWorkspaceId(this.settings),
        expanded: !agentMode,
        // expanded mode is only meaningful for the legacy RAG path
        ...enabledTools ? { enabledTools } : {}
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
      metadata: { ...res.meta ?? {} },
      ...d.toolCalls ? { toolCalls: d.toolCalls } : {},
      ...d.runId ? { runId: d.runId } : {},
      ...d.iterationTokens ? { iterationTokens: d.iterationTokens } : {},
      ...d.reason ? { reason: d.reason } : {},
      ...d.tokenUsage ? { tokenUsage: d.tokenUsage } : {}
    };
  }
  /**
   * Streaming variant of {@link ask} — targets `/v1/agent/run/stream`
   * directly so the plugin sees per-iteration / per-tool-call events as
   * they happen, not just the final result. Caller passes an `onEvent`
   * callback that fires for every normalized event; the returned promise
   * resolves with the same {@link AskResponse} shape `ask()` returns
   * (built from the terminal `done` event).
   *
   * Why this lives next to `ask()`: the chat panel can pick the path
   * based on the `chatStream` setting without juggling two API surfaces.
   * Rendering paths (entities, documents, citations, follow-ups) work
   * the same on the result either way — this method just adds a live
   * tool-call card stream during the run.
   */
  async askStream(query, onEvent, opts) {
    const url = `${this.settings.apiUrl.replace(/\/$/, "")}/v1/agent/run/stream`;
    const skill = opts?.skill ?? this.settings.chatAgentSkill ?? "obsidian-chat";
    const webSearch = opts?.webSearch ?? this.settings.chatAgentWebSearch;
    const tools = webSearch ? void 0 : ["knowledge_graph_search", "cortex_paths", "cortex_recall", "cortex_remember", "get_current_time"];
    const body = {
      message: query,
      skill,
      surface: "obsidian"
    };
    if (tools) body.tools = tools;
    if (opts?.history && opts.history.length > 0) body.history = opts.history;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
      "x-api-key": this.settings.apiKey
    };
    const streamWsId = effectiveWorkspaceId(this.settings);
    if (streamWsId) headers["x-workspace-id"] = streamWsId;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      // Caller's AbortSignal aborts the streaming fetch — chat panel
      // wires this to the user's Stop button + a 5-min hard timeout.
      signal: opts?.signal
    });
    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(`Stream request failed: HTTP ${response.status} ${text.slice(0, 200)}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answerText = "";
    let finalToolCalls = [];
    let finalRunId;
    let finalIterationTokens;
    let finalTokenUsage;
    let finalReason;
    let finalRetrieval;
    let finalFollowUps = [];
    const liveToolCalls = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        const eventMatch = block.match(/^event: (.+)$/m);
        const dataMatch = block.match(/^data: (.+)$/m);
        if (!eventMatch || !dataMatch) continue;
        const eventName = eventMatch[1].trim();
        let data = {};
        try {
          data = JSON.parse(dataMatch[1]);
        } catch {
          continue;
        }
        switch (eventName) {
          case "agent.iteration":
            onEvent({ kind: "iteration", iteration: data.iteration ?? 0 });
            break;
          case "agent.tool.start":
            onEvent({ kind: "tool-start", name: data.name ?? "", args: data.args ?? {}, iteration: data.iteration ?? 0, toolCallId: data.toolCallId });
            break;
          case "agent.tool.end": {
            const tc = {
              name: data.name ?? "",
              args: data.args ?? {},
              durationMs: data.durationMs ?? 0,
              ok: data.ok ?? false,
              result: data.result,
              error: data.error
            };
            liveToolCalls.push(tc);
            onEvent({ kind: "tool-end", ...tc, iteration: data.iteration ?? 0, toolCallId: data.toolCallId });
            break;
          }
          case "agent.text":
            answerText += data.content ?? "";
            onEvent({ kind: "text", content: data.content ?? "" });
            break;
          case "agent.subrun.start":
            onEvent({
              kind: "subrun-start",
              parentIteration: data.parentIteration ?? 0,
              goal: data.goal ?? "",
              tools: Array.isArray(data.tools) ? data.tools : [],
              childRunId: data.childRunId
            });
            break;
          case "agent.subrun.end":
            onEvent({
              kind: "subrun-end",
              parentIteration: data.parentIteration ?? 0,
              goal: data.goal ?? "",
              childRunId: data.childRunId,
              answer: data.answer ?? "",
              iterations: data.iterations ?? 0,
              durationMs: data.durationMs ?? 0,
              ok: data.ok ?? false,
              reason: data.reason ?? "",
              error: data.error
            });
            break;
          case "agent.done":
            finalRunId = data.runId;
            finalToolCalls = data.toolCalls ?? liveToolCalls;
            finalIterationTokens = data.iterationTokens;
            finalTokenUsage = data.tokenUsage;
            finalReason = data.reason;
            finalRetrieval = data.retrieval;
            if (Array.isArray(data.suggestedFollowUps)) {
              finalFollowUps = data.suggestedFollowUps.filter((s) => typeof s === "string");
            }
            if (typeof data.finalMessage?.content === "string" && data.finalMessage.content.length > 0) {
              answerText = data.finalMessage.content;
            }
            onEvent({ kind: "done", runId: finalRunId, finalMessage: data.finalMessage, toolCalls: finalToolCalls, iterations: data.iterations, tokenUsage: finalTokenUsage, iterationTokens: finalIterationTokens, reason: finalReason, retrieval: finalRetrieval });
            break;
          case "agent.error":
            onEvent({ kind: "error", message: data.message ?? "unknown agent error" });
            break;
        }
      }
    }
    return {
      answer: answerText,
      citations: extractCitations(finalRetrieval),
      entities: extractEntities(finalRetrieval),
      documents: extractDocuments(finalRetrieval),
      confidence: 0,
      followUps: finalFollowUps,
      metadata: finalRetrieval ? { retrieval: finalRetrieval } : {},
      toolCalls: finalToolCalls,
      ...finalRunId ? { runId: finalRunId } : {},
      ...finalIterationTokens ? { iterationTokens: finalIterationTokens } : {},
      ...finalReason ? { reason: finalReason } : {},
      ...finalTokenUsage ? { tokenUsage: finalTokenUsage } : {}
    };
  }
  async suggestLinks(noteName) {
    const res = await this.req("/v1/graph/predict-links", {
      method: "POST",
      body: JSON.stringify({
        entityName: noteName,
        entityType: "Note",
        workspaceId: effectiveWorkspaceId(this.settings)
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
        workspaceId: effectiveWorkspaceId(this.settings)
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
        workspaceId: effectiveWorkspaceId(this.settings)
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
      workspaceId: effectiveWorkspaceId(this.settings)
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
    if (effectiveWorkspaceId(this.settings)) params.set("workspaceId", effectiveWorkspaceId(this.settings));
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
        if (effectiveWorkspaceId(this.settings)) graphParams.set("workspaceId", effectiveWorkspaceId(this.settings));
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
    if (effectiveWorkspaceId(this.settings)) params.set("workspaceId", effectiveWorkspaceId(this.settings));
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
    if (effectiveWorkspaceId(this.settings)) params.set("workspaceId", effectiveWorkspaceId(this.settings));
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
  // ── Runtime LLM config ──────────────────────────────────────────────
  // The cortex-api stores per-org LLM configuration in Postgres (encrypted)
  // and reads from there at request time, so swapping providers/models or
  // updating an API key takes effect immediately — no container restart.
  // Mounted at /v1/ask/config/* (the inner aiConfigRouter has its own /config
  // and /test paths, hence the doubled segment).
  async getLlmConfig() {
    const res = await this.req("/v1/ask/config/config");
    return res.data;
  }
  async updateLlmConfig(input) {
    const res = await this.req("/v1/ask/config/config", {
      method: "PUT",
      body: JSON.stringify(input)
    });
    return res.data;
  }
  async testLlmConfig(input) {
    const res = await this.req(
      "/v1/ask/config/test",
      { method: "POST", body: JSON.stringify(input) }
    );
    return res.data;
  }
  async getLlmModels() {
    const res = await this.req("/v1/ask/config/models");
    return res.data.providers;
  }
  /**
   * List Cortex-originated documents that should be projected into this vault.
   * Returns items the server believes have not yet been delivered (the server
   * tracks acks, so this is idempotent across devices).
   */
  async inboxList() {
    const qs = new URLSearchParams({
      workspaceId: effectiveWorkspaceId(this.settings),
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
        workspaceId: effectiveWorkspaceId(this.settings),
        vaultId: this.settings.vaultId
      })
    });
  }
};
function extractCitations(raw) {
  if (!raw || typeof raw !== "object") return [];
  const env = raw;
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (source, text, filePath, url) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    out.push({ source, text: text ?? "", filePath, url });
  };
  const docsHost = env.documents;
  const recentDocs = Array.isArray(docsHost) ? docsHost : docsHost?.recentDocuments ?? [];
  for (const doc of recentDocs) {
    push(
      doc?.name ?? doc?.filename ?? doc?.title,
      doc?.snippet ?? doc?.summary ?? doc?.description,
      doc?.filePath ?? doc?.path,
      doc?.url ?? doc?.youtubeurl
    );
  }
  for (const ent of env.knowledgeGraph?.entities ?? env.entities ?? []) {
    if (ent?.type === "Note" || ent?.type === "Document") {
      push(ent?.name, ent?.properties?.description, ent?.properties?.filePath);
    }
  }
  return out.slice(0, 10);
}
function extractEntities(raw) {
  if (!raw || typeof raw !== "object") return [];
  const env = raw;
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  const list = env.knowledgeGraph?.entities ?? env.entities ?? [];
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
  const env = raw;
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const docsHost = env.documents;
  const recentList = Array.isArray(docsHost) ? docsHost : docsHost?.recentDocuments ?? [];
  for (const d of recentList) {
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
  const chunks = env.vectorMemory?.relevantChunks ?? env.relevantChunks ?? [];
  for (const c of chunks) {
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
var import_obsidian7 = require("obsidian");

// src/services/agent-connect.ts
var dynRequire = typeof globalThis.require === "function" ? globalThis.require : null;
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
    const err = e;
    if (err?.code !== "ENOENT") {
      return {
        ok: false,
        configPath,
        message: `Couldn't read ${configPath}: ${err?.message ?? String(e)}`
      };
    }
  }
  let mcpServers;
  if (existing.mcpServers && typeof existing.mcpServers === "object" && !Array.isArray(existing.mcpServers)) {
    mcpServers = existing.mcpServers;
  } else {
    mcpServers = {};
    existing.mcpServers = mcpServers;
  }
  if (mcpServers["hangarx-obsidian"]) {
    delete mcpServers["hangarx-obsidian"];
  }
  const prev = mcpServers["hangarx"];
  const updated = !!prev;
  const unchanged = prev && JSON.stringify(prev) === JSON.stringify(entry);
  mcpServers["hangarx"] = entry;
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
      message: `Couldn't write ${configPath}: ${e?.message ?? String(e)}`
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
  return { ok: true, configPath, message, updated, unchanged: !!unchanged };
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
    const err = e;
    if (err?.code === "ENOENT") {
      return { ok: true, configPath, message: "Already disconnected \u2014 no config file.", unchanged: true };
    }
    return { ok: false, configPath, message: `Couldn't read ${configPath}: ${err?.message ?? String(e)}` };
  }
  let parsed;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) {
    return { ok: false, configPath, message: `Config file isn't valid JSON: ${e?.message ?? String(e)}` };
  }
  const mcpServers = parsed.mcpServers && typeof parsed.mcpServers === "object" && !Array.isArray(parsed.mcpServers) ? parsed.mcpServers : null;
  const hadCanonical = !!mcpServers?.["hangarx"];
  const hadLegacy = !!mcpServers?.["hangarx-obsidian"];
  if (!mcpServers || !hadCanonical && !hadLegacy) {
    return { ok: true, configPath, message: "Already disconnected.", unchanged: true };
  }
  delete mcpServers["hangarx"];
  delete mcpServers["hangarx-obsidian"];
  try {
    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  } catch (e) {
    return { ok: false, configPath, message: `Couldn't write ${configPath}: ${e?.message ?? String(e)}` };
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
    const mcp = parsed?.mcpServers;
    const entry = mcp?.["hangarx"] ?? mcp?.["hangarx-obsidian"];
    return { exists: true, connected: !!entry };
  } catch (e) {
    const err = e;
    if (err?.code === "ENOENT") return { exists: false, connected: false };
    return { exists: true, connected: false, reason: err?.message ?? String(e) };
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
    activeWindow.clearTimeout(pending.timer);
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
    const timer = activeWindow.setTimeout(() => {
      if (pending && pending.state === state) {
        pending = null;
        reject(new Error("Sign-in timed out \u2014 close the browser tab and try again."));
      }
    }, options.timeoutMs ?? 5 * 60 * 1e3);
    pending = { state, codeVerifier, options, resolve, reject, timer };
    const opened = window.open(url.toString(), "_blank");
    if (!opened) {
      navigator.clipboard.writeText(url.toString()).catch(() => void 0);
      new import_obsidian2.Notice("Browser blocked the new window. URL copied to clipboard \u2014 paste it in your browser to continue sign-in.", 8e3);
    }
  });
}
async function completeSignIn(params) {
  if (!pending) {
    new import_obsidian2.Notice("Received an OAUTH callback but no sign-in is in progress. Ignoring.", 5e3);
    return;
  }
  const flow = pending;
  pending = null;
  activeWindow.clearTimeout(flow.timer);
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
    activeWindow.clearTimeout(pending.timer);
    pending.reject(new Error("Sign-in cancelled."));
    pending = null;
  }
}

// src/settings.ts
init_confirm_modal();

// src/views/readme-modal.ts
var import_obsidian4 = require("obsidian");

// README.md
var README_default = '<p align="center">\n  <img src="./docs/images/preview.png" alt="HangarX inside Obsidian \u2014 graph view, file explorer, and Ask your vault chat panel side-by-side" width="100%" />\n</p>\n\n# HangarX for Obsidian\n\n> Ask questions about your vault. Share its knowledge with every AI agent on your machine.\n\nHangarX turns your Obsidian notes into a queryable knowledge graph \u2014 then exposes that graph to Claude Desktop, Claude Code, Cursor, Cline, Windsurf, and any other [MCP-compatible](https://modelcontextprotocol.io) agent. Same vault. Every tool. No copy-pasting context between chats.\n\n\u{1F4D6} [Full docs](https://app.hangarx.ai/obsidian#docs) \xB7 \u{1F310} [Dashboard](https://app.hangarx.ai) \xB7 \u{1F41B} [Issues](https://github.com/3-Elements-Design/hangarx-obsidian/issues)\n\n---\n\n## Why\n\nYou\'ve already written everything: standups, design docs, half-finished thoughts. The bottleneck isn\'t capturing knowledge \u2014 it\'s making it usable by the agents you use every day.\n\n- **Claude Desktop forgot what you decided last week.** HangarX remembers.\n- **Cursor doesn\'t know your team\'s conventions.** HangarX answers from your notes.\n- **You repeat yourself across every new chat.** HangarX is the one source of truth they all read.\n\n## Who it\'s for\n\n- **Note-takers** who want a smarter Q&A surface than the built-in search.\n- **Agent power users** running 2+ AI tools that should share context.\n- **Teams** with a single vault of decisions, runbooks, and architectural notes.\n- **Privacy-first users** who want everything to stay on their laptop (Local mode = no cloud, no data leaves your machine).\n\n---\n\n## What it does\n\n| | |\n|---|---|\n| \u{1F4AC} **Ask your vault** | Multi-hop chat with citations back to the source notes. Lives in the right sidebar. |\n| \u{1F310} **Native graph integration** | Push chat answers into Obsidian\'s built-in Graph view \u2014 non-matching nodes dim, cited entities stay highlighted. |\n| \u{1F504} **Two-way sync** | Push notes to the graph, pull graph entities back as markdown, or diff the two sides to see what\'s drifted. |\n| \u{1F916} **MCP bridge** | One-click connect to Claude Desktop, Claude Code, Cursor, Cline, Windsurf \u2014 they get tools to query your vault. |\n| \u2728 **Inline link suggestions** | Ghost-text `[[wikilinks]]` while you type, driven by entity matches in your graph. |\n| \u{1F512} **Local or cloud** | Cloud is one-click OAuth. Local runs everything in Docker on your laptop. |\n\n---\n\n## Install\n\n**Community plugins (recommended).**\n\n1. Settings \u2192 **Community plugins \u2192 Browse**\n2. Search **"HangarX"** \u2192 **Install** \u2192 **Enable**\n3. The first-run onboarding modal walks you through Cloud / Local setup.\n\n<details>\n<summary><strong>Other install options</strong></summary>\n\n**BRAT (beta builds).**\nInstall [BRAT](https://github.com/TfTHacker/obsidian42-brat), then **Add beta plugin** \u2192 paste `https://github.com/3-Elements-Design/hangarx-obsidian`.\n\n**Manual.**\nGrab `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/3-Elements-Design/hangarx-obsidian/releases) and drop them in `<your-vault>/.obsidian/plugins/hangarx-obsidian/`. Reload Obsidian, enable in Community Plugins.\n\n</details>\n\n---\n\n## Quick start\n\n### Cloud \u2014 60 seconds\n\nBest for trying HangarX out. Sign-in is OAuth, no key copy-paste.\n\n1. Settings \u2192 **HangarX \u2192 Connection** \u2192 Mode: **\u2601\uFE0F Cloud (HangarX hosted)**\n2. **Sign in with HangarX** \u2192 approve in browser \u2192 API key + workspace auto-fill\n3. Command palette (\u2318P / Ctrl-P) \u2192 **HangarX: Sync**\n4. Open the **Ask your vault** chat in the right sidebar and ask anything\n\n### Local \u2014 fully private\n\nEverything runs in Docker on your machine. Notes never leave the laptop.\n\n1. Settings \u2192 **HangarX \u2192 Connection** \u2192 Mode: **\u{1F3E0} Local (Docker)**\n2. Click **Save Compose to vault** \u2014 writes `docker-compose.cortex.yml` next to your notes\n3. In a terminal: `docker compose -f docker-compose.cortex.yml up -d`\n4. Add at least one LLM key in **LLM provider keys** (Gemini, OpenAI, Anthropic, Kimi, HuggingFace, OpenRouter, xAI, or Ollama for fully offline)\n5. Run **HangarX: Sync** from the command palette\n\n> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/). Images are pulled from Docker Hub (`hangarx/cortex-api`) \u2014 no source code or Node.js needed.\n\n---\n\n## How it works\n\n```\n\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502  Your vault  \u2502  \u2500\u2500\u25BA  \u2502  Cortex API  \u2502  \u2500\u2500\u25BA  \u2502 Knowledge graph  \u2502\n\u2502  (markdown)  \u2502       \u2502  (entity     \u2502       \u2502  FalkorDB +      \u2502\n\u2502              \u2502       \u2502  extraction) \u2502       \u2502  pgvector        \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                              \u25B2                        \u25B2\n                              \u2502                        \u2502\n                       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n                       \u2502 Obsidian      \u2502       \u2502 External agents\u2502\n                       \u2502 chat panel    \u2502       \u2502 (Claude, Cursor\u2502\n                       \u2502 + graph view  \u2502       \u2502  Cline, etc.)  \u2502\n                       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n```\n\n1. **Sync** parses your notes, extracts entities (people, projects, concepts) + relationships, and stores them as a graph alongside vector embeddings.\n2. **Ask** runs multi-hop retrieval (graph traversal + semantic search + reranking) over that graph and an LLM composes the answer with citations.\n3. **MCP bridge** exposes the same retrieval tools to external agents over a local protocol \u2014 they query your vault the same way the in-Obsidian chat does.\n\n---\n\n## Connect external agents\n\nSettings \u2192 **Agents** shows every supported harness:\n\n| Agent | One-click |\n|---|---|\n| Claude Desktop, Claude Code, Cursor, Cline, Windsurf | \u2705 |\n| Zed, Goose, Codex CLI, custom MCP clients | Copy JSON snippet |\n\nClick **Connect** and HangarX merges its MCP server entry into the agent\'s config (non-destructively \u2014 your other MCP servers stay). Restart the agent and it gets the tools below.\n\n> The same tool set is available to the in-Obsidian chat agent and to every MCP-compatible client. Tool names match what you\'ll see in your AI tool\'s debug panel.\n\n#### Q&A and unified retrieval\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_unified_ask` | Natural-language Q&A grounded in your vault \u2014 citations included |\n| `cortex_chat` | Multi-turn agentic chat with the full tool loop |\n| `cortex_get_context` | Build a hybrid retrieval bundle (entities + chunks + memories) for a query |\n| `cortex_unified_search` | One-shot search across entities, documents, and memories |\n| `cortex_advanced_search` | Hybrid search with date / tag / entity-type filters |\n\n#### Knowledge-graph exploration\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_search_entities` | Find entities by name + optional type (Person, Project, Document, \u2026) |\n| `cortex_list_entities` | Paginated entity listing with type filters |\n| `cortex_get_entity` | Fetch one entity\'s full record (properties, type, description) |\n| `cortex_get_neighbors` | Expand 1\u20133 hops out from an entity to see what\'s connected |\n| `cortex_find_paths` | Shortest path between two entities \u2014 multi-hop graph reasoning |\n| `cortex_explain_entity` | Full profile of one entity in a single call: properties + neighbors + sources |\n| `cortex_get_provenance` | Source documents an entity was extracted from \u2014 the citation tool |\n| `cortex_query_graph` | Run a custom Cypher query (read-only) against the graph |\n| `cortex_get_schema` | Introspect the live graph schema (node types, edge types, properties) |\n| `cortex_get_communities` | Auto-detected entity clusters / topics |\n| `cortex_predict_links` | ML-suggested missing edges between entities |\n| `cortex_point_in_time` | Temporal queries \u2014 graph state as of a given timestamp |\n\n#### Document retrieval\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_search_documents` | Semantic search across your notes |\n| `cortex_summarize_document` | LLM summary of a single document |\n\n#### Memory (cross-session)\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_remember` | Save a fact / preference / decision to persistent memory |\n| `cortex_recall` | Retrieve memories relevant to a query |\n| `cortex_relate` | Find memories semantically related to an entity or topic |\n| `cortex_feedback` | Record agent feedback (helpful / not helpful) for future ranking |\n\n#### Graph health and ops\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_graph_stats` | Totals + per-type breakdowns of entities and relationships |\n| `cortex_find_duplicates` | Find likely duplicate entities by embedding similarity |\n| `cortex_diff_graph` | Compare graph state between two timestamps |\n| `cortex_export_graph` | Export the graph to JSON / GraphML / Cypher |\n| `cortex_file_persistence_status` | Check sync state of files between vault and graph |\n\n#### Ingestion and writes\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_ingest` | Add a single text chunk + metadata to the graph |\n| `cortex_bulk_ingest` | Batch ingest \u2014 efficient for large documents |\n| `cortex_create_document` / `cortex_delete_document` | Document-level lifecycle |\n| `cortex_create_entity` / `cortex_update_entity` / `cortex_delete_entity` | Entity-level lifecycle |\n| `cortex_create_relationship` | Add a typed edge between two entities |\n| `cortex_merge_entities` | Merge a source entity into a target (transfers all relationships) |\n| `cortex_tag_entity` | Lightweight metadata write |\n\n#### Web access\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_web_search` | Search the public web |\n| `cortex_web_scrape` | Fetch + extract content from a URL |\n\n#### Workflows and automation\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_list_workflows` | List your durable workflows |\n| `cortex_run_workflow` | Trigger a workflow run |\n| `cortex_create_workflow` / `cortex_update_workflow` / `cortex_delete_workflow` | Workflow lifecycle |\n| `cortex_list_custom_tools` / `cortex_run_custom_tool` | Discover and call user-defined tools |\n\n#### Live event streams\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_subscribe` / `cortex_subscribe_poll` | Subscribe to graph mutations and poll the queue |\n| `cortex_event_log_subscribe` / `cortex_event_log_poll` / `cortex_event_log_unsubscribe` | Event-log subscription lifecycle |\n\n#### Generative\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_generate_image` | Generate an image from a prompt |\n| `cortex_query_analytics` | Run pre-computed analytics queries (KPIs, rollups) |\n\n> 50+ tools total. Most agents will only use 5\u201310 of them \u2014 the **Q&A**, **exploration**, and **memory** sections cover almost every common workload. The rest are there when you need them.\n\n---\n\n## In-Obsidian features\n\n### Ask your vault\n\nRight-sidebar chat. Multi-hop retrieval with citations. Click an entity chip to open the source note; click a citation to jump to the exact paragraph.\n\n- **Suggested starters** \u2014 Catch me up \xB7 Trace connections \xB7 Surface decisions \xB7 Find blind spots\n- **Auto-highlight on graph** \u2014 toggle the pin on any answer to make every future answer auto-push its cited entities into the Graph view filter\n- **Save as note** \u2014 drop the answer into `Cortex Chats/`\n- **Conversation history** \u2014 sessions persist across restarts\n\n### Sync modal\n\n`HangarX: Sync` \u2014 one place, five actions:\n\n| Action | What it does |\n|---|---|\n| **Push** | Vault \u2192 graph (changed files only) |\n| **Pull** | Graph \u2192 vault (entities + relationships as markdown) |\n| **Two-way** | Push first, then pull |\n| **Diff** | Reconciliation view: vault-only / drifted / graph-only / in-sync |\n| **Force re-ingest** | Wipe local sync index and re-push everything |\n\nPush runs are cancellable mid-flight; cancellation propagates to in-flight server workers.\n\n### Inline link suggestions\n\nType and HangarX shows ghost-text `[[wikilink]]` autocompletes from your graph. **Tab** to accept, **Esc** to dismiss.\n\n---\n\n## Supported LLM providers\n\nPick any in **Settings \u2192 HangarX \u2192 LLM provider keys** (BYOK) or in the per-request **LLM (runtime)** panel. Switch on the fly \u2014 no container restart.\n\n- \u{1F7E6} **Google Gemini** \u2014 fast, cheap default\n- \u{1F7E9} **OpenAI** \u2014 GPT-4o, GPT-4.1, o-series\n- \u{1F7E7} **Anthropic Claude**\n- \u2B1B **xAI Grok**\n- \u{1F7E8} **Moonshot Kimi K2.5** \u2014 direct\n- \u{1F7EA} **HuggingFace Inference** \u2014 auto-routes Kimi K2.5, Llama 3.3 70B, Qwen 2.5 72B\n- \u{1F310} **OpenRouter** \u2014 200+ models behind one key\n- \u{1F4BB} **Ollama** \u2014 fully local (gemma4, llama3.3, qwen2.5, mistral, phi3, \u2026)\n\n---\n\n## Privacy\n\n| | Cloud | Local |\n|---|---|---|\n| Notes leave your machine | \u2713 (sent to HangarX API) | \u2717 |\n| LLM key required | \u2717 (we manage) | \u2713 (BYOK) |\n| Trained on your data | \u2717 | \u2717 |\n| Revocable | \u2713 ([dashboard](https://app.hangarx.ai/settings?tab=api-keys)) | \u2713 (delete the container) |\n\n**Excluded by default**: `.cortex/`, `.obsidian/`, `templates/`. Configurable in **What to sync**.\n**Attachments**: images, PDFs, and other binaries are ingested by default. Toggle off in **Sync attachments**.\n\n---\n\n## Commands\n\n| Command | Description |\n|---|---|\n| `HangarX: Ask your vault` | Open the Q&A chat |\n| `HangarX: Sync` | Open the multi-purpose sync modal |\n| `HangarX: Sync current note` | Push only the active file |\n| `HangarX: Diff vault vs knowledge graph` | Open the 4-bucket diff view |\n| `HangarX: Pull graph entities into vault` | Materialize entities as markdown |\n| `HangarX: Force re-ingest entire vault` | Re-sync everything |\n| `HangarX: Connect agents (Claude, Cursor)\u2026` | Jump to the Agents settings panel |\n| `HangarX: Knowledge graph stats` | Show graph + memory counts |\n| `HangarX: Ingest URL into knowledge graph` | Scrape a URL and add it to the graph |\n| `HangarX: Show onboarding` | Reopen the first-run walkthrough |\n\n---\n\n## Troubleshooting\n\n<details>\n<summary><strong>"This API key was rejected (401)" in Cloud mode</strong></summary>\n\nGenerate a fresh key in the [dashboard](https://app.hangarx.ai/settings?tab=api-keys) and click **Test** on the API Key field. If you signed in via OAuth, **Sign out** then **Sign in with HangarX** again.\n\n</details>\n\n<details>\n<summary><strong>"LLM provider API key expired"</strong></summary>\n\nThe chat error card surfaces this directly. Open **Settings \u2192 HangarX \u2192 LLM provider keys**, paste a fresh key in the relevant section. Runtime config updates immediately \u2014 no container restart.\n\n</details>\n\n<details>\n<summary><strong>HuggingFace 403</strong></summary>\n\nVisit [huggingface.co/settings/inference-providers](https://huggingface.co/settings/inference-providers) and confirm your token has provider access. Paid models (Kimi K2.5 via Novita, Llama 3.3 via Fireworks) need credits \u2014 switch to a free serverless model in the runtime panel if not.\n\n</details>\n\n<details>\n<summary><strong>Local stack: "Cannot reach http://localhost:3400"</strong></summary>\n\nMake sure Docker Desktop is running and `docker compose ps` shows `cortex-api` as healthy. Check `docker compose logs cortex-api` for startup errors. The most common cause is a missing LLM key \u2014 re-save the Compose YAML from settings (it bakes in whichever BYOK keys you\'ve configured) and `docker compose up -d --force-recreate`.\n\n</details>\n\n<details>\n<summary><strong>Local stack: embedding dimension mismatch</strong></summary>\n\nYou changed embedding providers and existing chunks were embedded with a different model. Run **HangarX: Force re-ingest entire vault**, or wipe the local Postgres volume.\n\n</details>\n\n<details>\n<summary><strong>Agent shows "Connected" but doesn\'t see HangarX tools</strong></summary>\n\nRestart the agent fully. Claude Desktop, Cursor, and Windsurf cache MCP servers and only re-read the config on launch. For Claude Code, start a new session.\n\n</details>\n\n<details>\n<summary><strong>"Show on graph" doesn\'t dim nodes</strong></summary>\n\nMake sure you\'ve synced your vault at least once \u2014 dimming requires the cited entities to exist as files. If the graph view was previously corrupted by an older plugin version, the plugin auto-detaches and recreates the leaf \u2014 reload Obsidian once.\n\n</details>\n\n<details>\n<summary><strong>Sync is slow</strong></summary>\n\nInitial syncs are bound by LLM latency (`O(notes \xD7 LLM round-trip)`). Cloud uses our infrastructure; local is bound by your provider. Switch the embedding provider to Ollama for free, fast local embeddings.\n\n</details>\n\n---\n\n## Architecture\n\nFor the deep-dive on how entity extraction, multi-hop retrieval, claim graphs, and the MCP bridge actually work, see [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).\n\n## Contributing\n\nIssues and PRs welcome at [github.com/3-Elements-Design/hangarx-obsidian](https://github.com/3-Elements-Design/hangarx-obsidian).\n\n## License\n\nMIT \u2014 see [LICENSE](./LICENSE).\n';

// src/views/readme-modal.ts
var ReadmeModal = class extends import_obsidian4.Modal {
  constructor(app) {
    super(app);
    this.renderComponent = new import_obsidian4.Component();
  }
  async onOpen() {
    this.modalEl.addClass("cortex-readme-modal");
    this.titleEl.empty();
    const title = this.titleEl.createDiv({ cls: "cortex-readme-title" });
    title.createSpan({ text: "HangarX \u2014 Documentation" });
    const actions = title.createDiv({ cls: "cortex-readme-title-actions" });
    const externalBtn = actions.createEl("button", {
      cls: "cortex-readme-iconbtn",
      attr: { "aria-label": "Open online docs" }
    });
    (0, import_obsidian4.setIcon)(externalBtn, "external-link");
    externalBtn.addEventListener("click", () => {
      window.open("https://app.hangarx.ai/obsidian", "_blank");
    });
    const body = this.contentEl.createDiv({ cls: "cortex-readme-body markdown-rendered" });
    this.renderComponent.load();
    await import_obsidian4.MarkdownRenderer.render(this.app, README_default, body, "", this.renderComponent);
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
  ollama: { provider: "ollama", model: "nomic-embed-text" }
};
function buildDockerCompose(encryptionKey, llmEncryptionKey, embedding = "gemini") {
  const e = EMBEDDING_PRESETS[embedding] ?? EMBEDDING_PRESETS.gemini;
  return `# Cortex GraphRAG \u2014 Local Stack (single-user)
# Start: docker compose -f docker-compose.cortex.yml up -d
# Stop:  docker compose -f docker-compose.cortex.yml down
#
# Auth: disabled for single-user use. The cortex-api port is bound to
# 127.0.0.1 only, so only this machine can reach it. To expose it on the
# LAN, change the bind to 0.0.0.0 AND set LOCAL_API_KEY (the server will
# refuse to start otherwise).
services:
  falkordb:
    image: falkordb/falkordb:latest
    container_name: cortex-falkordb
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${FALKORDB_PORT:-6379}:6379"
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
      - "127.0.0.1:\${POSTGRES_PORT:-5432}:5432"
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
      - "127.0.0.1:\${CORTEX_PORT:-3400}:3400"
    environment:
      LOCAL_AUTH_DISABLED: "true"
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
      COHERE_API_KEY: \${COHERE_API_KEY:-}
      JINA_API_KEY: \${JINA_API_KEY:-}
      PERPLEXITY_API_KEY: \${PERPLEXITY_API_KEY:-}
      TAVILY_API_KEY: \${TAVILY_API_KEY:-}
      OLLAMA_BASE_URL: \${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      MCP_ALLOW_UNAUTHENTICATED: "true"
      BOOTSTRAP_SECRET: cortex-local
      # CORS allowlist \u2014 must include the Obsidian plugin's origins or
      # the SSE streaming chat (and any browser-CORS-respecting fetch
      # from the plugin) will be rejected at preflight. Desktop Obsidian
      # uses app://obsidian.md; mobile uses capacitor://localhost. The
      # localhost entries cover the dashboard at :3000 / :3001.
      CORS_ORIGIN: "http://localhost:3000,http://localhost:3001,app://obsidian.md,capacitor://localhost,http://localhost"
      # Skip per-file Louvain community detection. The single-user Falkor
      # graph times out on this for vaults >1k entities and the resulting
      # communities aren't surfaced anywhere in the plugin UI. Cloud
      # deployments leave this unset and keep auto-detection on.
      DISABLE_AUTO_COMMUNITY_DETECTION: "true"
      CONNECTOR_ENCRYPTION_KEY: "${encryptionKey}"
      LLM_ENCRYPTION_KEY: "${llmEncryptionKey}"
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
  defaultRightPane: "chat",
  showRelatedPane: true,
  inlineSuggestionsEnabled: true,
  autoShowAnswerOnGraph: false,
  chatAgentMode: "agent",
  chatAutoFastPath: true,
  chatAgentWebSearch: false,
  chatAgentSkill: "obsidian-chat",
  chatStream: true,
  mcpEnabled: false,
  mcpPort: 7474,
  mcpToken: "",
  chatExportFolder: "Cortex Chats",
  memoryFolder: "Cortex Memories",
  writeMemoriesToVault: true,
  autoSaveChatToVault: false,
  graphPullFolder: ".cortex/graph",
  graphPullEntityTypes: [],
  graphPullEnrichSourceNotes: false,
  connectorEncryptionKey: "",
  llmEncryptionKey: "",
  llmKeys: {},
  embeddingPreset: "gemini",
  deviceId: "",
  deviceName: ""
};
function defaultDeviceName() {
  if (import_obsidian7.Platform.isMobileApp) return import_obsidian7.Platform.isIosApp ? "iOS" : "Android";
  if (import_obsidian7.Platform.isMacOS) return "Mac";
  if (import_obsidian7.Platform.isWin) return "Windows";
  if (import_obsidian7.Platform.isLinux) return "Linux";
  return "Desktop";
}
var CortexSettingTab = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    /** Surfaced by checkLocalHealth(). */
    this.lastHealthDetail = "";
    /** Per-subsystem health captured from the /health response body. Drives the
     *  Stack Health panel; null when the API is unreachable so the panel can
     *  show "status unknown — API offline" for everything. */
    this.lastHealthSubsystems = null;
    this.lastHealthVersion = null;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const mode = s.connectionMode;
    this.renderSearchBar(containerEl);
    this.renderCommonTasksRow(containerEl, s, mode);
    const connectionStatus = mode === "cloud" ? s.apiKey ? "ok" : "warn" : "ok";
    this.renderSectionHeader(
      containerEl,
      "Connection",
      mode === "cloud" ? `Cloud \xB7 ${s.apiKey ? `signed in${s.workspaceId ? ` \xB7 ws_${s.workspaceId.slice(0, 6)}` : ""}` : "sign-in needed"}` : `Local \xB7 ${s.apiUrl}`,
      connectionStatus
    );
    new import_obsidian7.Setting(containerEl).setName("Where HangarX runs").setDesc("Cloud uses the hosted API. Local runs everything on your machine via Docker.").addDropdown((d) => d.addOption("cloud", "\u2601\uFE0F  cloud (HangarX hosted)").addOption("local", "\u{1F3E0}  Local (docker)").setValue(mode).onChange(async (v) => {
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
    const includedFolderCount = this.plugin.settings.includeFolders.length;
    const syncStatus = mode === "cloud" && !s.apiKey ? "warn" : "ok";
    this.renderSectionHeader(
      containerEl,
      "Sync",
      `${includedFolderCount === 0 ? "all folders" : `${includedFolderCount} folder${includedFolderCount === 1 ? "" : "s"}`} \xB7 attachments ${this.plugin.settings.syncAttachments ? "on" : "off"} \xB7 sync on startup ${this.plugin.settings.syncOnStartup ? "on" : "off"}`,
      syncStatus
    );
    new import_obsidian7.Setting(containerEl).setName("Include folders").setDesc("Comma-separated folder prefixes. Empty = include everything not excluded.").addText((t) => t.setValue(this.plugin.settings.includeFolders.join(",")).onChange(async (v) => {
      this.plugin.settings.includeFolders = v.split(",").map((x) => x.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName("Sync on startup").setDesc("Run a full vault sync when Obsidian launches. Skips files unchanged since the last sync.").addToggle((t) => t.setValue(this.plugin.settings.syncOnStartup).onChange(async (v) => {
      this.plugin.settings.syncOnStartup = v;
      await this.plugin.saveSettings();
      this.display();
    }));
    this.renderAdvanced(containerEl, "Sync \u2014 advanced", (host) => {
      new import_obsidian7.Setting(host).setName("Exclude patterns").setDesc("Comma-separated path prefixes to skip when pushing to HangarX.").addText((t) => t.setValue(this.plugin.settings.excludePatterns.join(",")).onChange(async (v) => {
        this.plugin.settings.excludePatterns = v.split(",").map((x) => x.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      }));
      new import_obsidian7.Setting(host).setName("Sync attachments").setDesc("Ingest images, pdfs, and other binaries referenced by your notes.").addToggle((t) => t.setValue(this.plugin.settings.syncAttachments).onChange(async (v) => {
        this.plugin.settings.syncAttachments = v;
        await this.plugin.saveSettings();
        this.display();
      }));
    });
    this.renderSectionHeader(
      containerEl,
      "Knowledge graph",
      this.plugin.settings.graphPullEnrichSourceNotes ? `pulling to ${this.plugin.settings.graphPullFolder} \xB7 enriching source notes` : `pulling to ${this.plugin.settings.graphPullFolder}`,
      "ok"
    );
    const importDesc = containerEl.createEl("p", { cls: "setting-item-description" });
    importDesc.setText(
      "Pull entities and relationships from your Cortex cloud workspace into your vault as markdown files. Pulled notes appear in Obsidian's native graph view, with [[wikilinks]] for every relationship. Re-running is incremental \u2014 only changed entities are rewritten."
    );
    this.renderAdvanced(containerEl, "Graph import \u2014 advanced", (host) => {
      new import_obsidian7.Setting(host).setName("Graph folder").setDesc("Where pulled entity files live. Folder is excluded from sync to prevent feedback loops.").addText((t) => t.setValue(this.plugin.settings.graphPullFolder).setPlaceholder(".cortex/graph").onChange(async (v) => {
        this.plugin.settings.graphPullFolder = v.trim() || ".cortex/graph";
        await this.plugin.saveSettings();
        this.display();
      }));
      new import_obsidian7.Setting(host).setName("Entity types").setDesc("Comma-separated list of entity types to pull. Leave empty to pull a sensible default set (concept, person, organization, topic, location, event, \u2026).").addText((t) => t.setValue(this.plugin.settings.graphPullEntityTypes.join(", ")).setPlaceholder("Concept, person, topic").onChange(async (v) => {
        this.plugin.settings.graphPullEntityTypes = v.split(",").map((s2) => s2.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      }));
      new import_obsidian7.Setting(host).setName("Enrich source notes").setDesc("Add `cortex_entities` frontmatter to your existing notes that mention pulled entities \u2014 creates bidirectional wikilinks.").addToggle((t) => t.setValue(this.plugin.settings.graphPullEnrichSourceNotes).onChange(async (v) => {
        this.plugin.settings.graphPullEnrichSourceNotes = v;
        await this.plugin.saveSettings();
        this.display();
      }));
    });
    new import_obsidian7.Setting(containerEl).setName("Run import").setDesc("Summary is a fast (~50ms) estimate from graph stats. Preview is a full dry-run that fetches every entity for exact diffs. Pull from cloud writes to disk.").addButton((b) => b.setButtonText("Summary").onClick(() => this.plugin.runGraphPullSummary())).addButton((b) => b.setButtonText("Preview").onClick(() => this.plugin.runGraphPullPreview())).addButton((b) => b.setButtonText("Pull from cloud").setCta().onClick(() => this.plugin.runGraphPull()));
    const agentBits = this.plugin.settings.chatAgentMode === "agent" ? `${this.plugin.settings.chatAgentSkill} \xB7 streaming ${this.plugin.settings.chatStream ? "on" : "off"}${this.plugin.settings.chatAgentWebSearch ? " \xB7 web search on" : ""}` : "single-shot RAG";
    this.renderSectionHeader(
      containerEl,
      "Chat & Agents",
      `${this.plugin.settings.chatAgentMode} \xB7 ${agentBits}`,
      "ok"
    );
    new import_obsidian7.Setting(containerEl).setName("Default right pane").setDesc('Which sidebar auto-opens on startup. "ask your vault" is always-on chat over your knowledge graph; "Related notes" surfaces semantically similar notes for the current file.').addDropdown((d) => d.addOption("chat", "Ask your vault").addOption("related", "Related notes").addOption("none", "None (open manually)").setValue(this.plugin.settings.defaultRightPane).onChange(async (v) => {
      this.plugin.settings.defaultRightPane = v;
      this.plugin.settings.showRelatedPane = v === "related";
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName("Inline link suggestions").setDesc("Show ghost-text [[wikilink]] suggestions while typing \u2014 driven by entity matches in your graph. Tab to accept, esc to dismiss.").addToggle((t) => t.setValue(this.plugin.settings.inlineSuggestionsEnabled).onChange(async (v) => {
      this.plugin.settings.inlineSuggestionsEnabled = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName("Auto-highlight chat answers on graph").setDesc(`After every chat answer, automatically push its cited entities into Obsidian's graph view filter \u2014 non-matching nodes dim, matching ones stay highlighted. Toggle is also accessible from the "show on graph" button on each answer.`).addToggle((t) => t.setValue(this.plugin.settings.autoShowAnswerOnGraph).onChange(async (v) => {
      this.plugin.settings.autoShowAnswerOnGraph = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName("Chat mode").setDesc("RAG (default) is single-shot retrieval \u2014 fastest, simplest. Agent uses the server-side tool-calling harness: the LLM decides which tools to call (knowledge graph search, multi-hop paths, optionally web search), iterates, and synthesizes \u2014 slower but much better on multi-step questions.").addDropdown((d) => d.addOption("rag", "RAG (single-shot, default)").addOption("agent", "Agent (tool-calling, beta)").setValue(this.plugin.settings.chatAgentMode).onChange(async (v) => {
      this.plugin.settings.chatAgentMode = v;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (this.plugin.settings.chatAgentMode === "agent") {
      this.renderAdvanced(
        containerEl,
        "Agent options (beta)",
        (host) => {
          const skillSetting = new import_obsidian7.Setting(host).setName("Agent skill pack").setDesc('Reusable bundle of system prompt + default tools + bounds. "Obsidian chat" is vault-aware with optional web fallback. "vault q&a" stays inside your knowledge graph. "multi-hop" enables sub-agents for hard, decomposable questions.').addDropdown((d) => d.addOption("obsidian-chat", "Obsidian chat (default)").addOption("vault-qa", "Vault q&a (no web)").addOption("multi-hop", "Multi-hop research (sub-agents)").setValue(this.plugin.settings.chatAgentSkill).onChange(async (v) => {
            this.plugin.settings.chatAgentSkill = v;
            await this.plugin.saveSettings();
            this.display();
          }));
          this.renderBetaPill(skillSetting.nameEl);
          const streamSetting = new import_obsidian7.Setting(host).setName("Stream agent responses").setDesc("When on, agent runs stream live \u2014 per-iteration progress, tool-call cards, and the final answer all render as they happen.").addToggle((t) => t.setValue(this.plugin.settings.chatStream).onChange(async (v) => {
            this.plugin.settings.chatStream = v;
            await this.plugin.saveSettings();
          }));
          this.renderBetaPill(streamSetting.nameEl);
          new import_obsidian7.Setting(host).setName("Allow web search in agent chat").setDesc("When on, the agent can call web_search and web_scrape for current external information. Off by default \u2014 privacy-conscious users may not want their chat queries hitting the public web.").addToggle((t) => t.setValue(this.plugin.settings.chatAgentWebSearch).onChange(async (v) => {
            this.plugin.settings.chatAgentWebSearch = v;
            await this.plugin.saveSettings();
            this.display();
          }));
          if (this.plugin.settings.chatAgentWebSearch) {
            const hint = host.createDiv({ cls: "cortex-dep-hint" });
            hint.setText("Checking backend\u2026");
            void this.plugin.client.getWebSearchStatus().then((status) => hint.setText(this.formatWebSearchHint(status))).catch(() => hint.setText("Cannot reach server to confirm web-search backend. Open the dashboard to verify."));
          }
        },
        { open: true }
      );
    }
    this.renderAdvanced(
      containerEl,
      "Runtime LLM (BYOK)",
      (host) => this.renderLlmRuntimeSection(host)
    );
    this.renderSectionHeader(
      containerEl,
      "Power features",
      this.plugin.settings.mcpEnabled ? `local MCP server on :${this.plugin.settings.mcpPort}` : "local MCP server off",
      this.plugin.settings.mcpEnabled ? "ok" : null
    );
    this.renderAdvanced(
      containerEl,
      "MCP server & agent bridges",
      (host) => this.renderAgentsSection(host),
      { open: this.plugin.settings.mcpEnabled }
    );
    new import_obsidian7.Setting(containerEl).setName("Help").setHeading();
    new import_obsidian7.Setting(containerEl).setName("Onboarding").setDesc("Open the persistent Get-started panel \u2014 connect, sync, run a query, connect external agents.").addButton((b) => b.setButtonText("Open onboarding panel").onClick(async () => {
      if (this.plugin.settings.onboardingDismissed) {
        this.plugin.settings.onboardingDismissed = false;
        await this.plugin.saveSettings();
      }
      await this.plugin.activateOnboardingView();
    }));
    new import_obsidian7.Setting(containerEl).setName("Documentation").setDesc("Quick start, agent setup, troubleshooting, and the full plugin guide.").addButton((b) => b.setButtonText("View readme").onClick(() => new ReadmeModal(this.app).open())).addButton((b) => b.setButtonText("Open online").setCta().onClick(() => window.open("https://app.HangarX.ai/obsidian", "_blank")));
  }
  /**
   * Section-header helper. Renders a single h3 followed by a one-line
   * "preview" of the section's current state (e.g. "Cloud · signed in
   * · ws_abc123") so the user can read status without expanding any
   * control.
   *
   * Milestone 3 added the optional `status` arg — `'ok' | 'warn' |
   * 'error'` paints a colored dot before the title. Use `'warn'` for
   * config that's incomplete but won't break things, `'error'` for
   * config that prevents the section from working at all.
   */
  renderSectionHeader(parent, title, preview, status = null) {
    const wrap = parent.createDiv({ cls: "cortex-section-header" });
    const titleRow = wrap.createDiv({ cls: "cortex-section-title-row" });
    if (status) {
      const dot = titleRow.createSpan({ cls: `cortex-section-dot is-${status}` });
      dot.setAttribute("aria-label", `Status: ${status}`);
    }
    titleRow.createSpan({ cls: "cortex-section-title-text", text: title });
    if (preview) {
      wrap.createDiv({ cls: "cortex-section-preview", text: preview });
    }
  }
  /**
   * Wrap an "advanced" cluster of settings inside a collapsed
   * <details> block. Default closed — power users opt in. The label
   * doubles as the disclosure summary so the layout stays clean.
   */
  renderAdvanced(parent, label, body, opts = {}) {
    const details = parent.createEl("details", { cls: "cortex-advanced" });
    if (opts.open) details.setAttribute("open", "");
    const summary = details.createEl("summary", { cls: "cortex-advanced-summary" });
    summary.createSpan({ cls: "cortex-advanced-chevron", text: "\u25B8" });
    summary.createSpan({ cls: "cortex-advanced-label", text: label });
    const host = details.createDiv({ cls: "cortex-advanced-body" });
    body(host);
  }
  /**
   * Add a small "beta" pill next to a setting name. Pure visual signal
   * so users know which features are still hardening.
   */
  renderBetaPill(parent, label = "beta") {
    parent.createSpan({ cls: "cortex-beta-pill", text: label });
  }
  /**
   * Search/filter input at the top of the page. As the user types, any
   * .setting-item, .cortex-advanced, or .cortex-section-header whose
   * combined text doesn't include the query is hidden. Matching
   * controls cause their parent advanced disclosure to auto-expand so
   * the result is actually visible.
   */
  renderSearchBar(containerEl) {
    const wrap = containerEl.createDiv({ cls: "cortex-settings-search" });
    const input = wrap.createEl("input", {
      type: "search",
      attr: { placeholder: "Search settings\u2026", "aria-label": "Search settings" },
      cls: "cortex-settings-search-input"
    });
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const items = containerEl.querySelectorAll(".setting-item");
      const advancedBlocks = containerEl.querySelectorAll(".cortex-advanced");
      items.forEach((el) => {
        if (!q) {
          el.removeClass("is-hidden");
          return;
        }
        el.toggleClass("is-hidden", !el.innerText.toLowerCase().includes(q));
      });
      advancedBlocks.forEach((det) => {
        if (!q) return;
        const hasMatch = Array.from(det.querySelectorAll(".setting-item")).some((item) => !item.classList.contains("is-hidden"));
        if (hasMatch) det.setAttribute("open", "");
      });
    });
  }
  /**
   * "Common tasks" row at the top of the page — direct entry points
   * for the four most common things people open settings to do. Each
   * task scrolls to its anchor section by id; the section h3s carry
   * a `data-anchor` attribute matched here.
   */
  renderCommonTasksRow(containerEl, s, mode) {
    const tasksWrap = containerEl.createDiv({ cls: "cortex-common-tasks" });
    tasksWrap.createDiv({ cls: "cortex-common-tasks-label", text: "Common tasks" });
    const buttons = tasksWrap.createDiv({ cls: "cortex-common-tasks-row" });
    const mkBtn = (label, onClick) => {
      const b = buttons.createEl("button", { cls: "cortex-common-tasks-btn", text: label });
      b.addEventListener("click", (e) => {
        e.preventDefault();
        onClick();
      });
      return b;
    };
    const isAuthed = mode === "cloud" ? !!s.apiKey : true;
    const labelConnect = mode === "cloud" && !isAuthed ? "Sign in" : "Connection";
    const closeSettings = () => {
      const setting = this.plugin.app.setting;
      setting?.close?.();
    };
    const runCommand = (id) => {
      void this.plugin.app.commands.executeCommandById(id);
    };
    mkBtn(labelConnect, () => this.scrollToSection("Connection"));
    mkBtn("Run a sync", () => {
      closeSettings();
      runCommand("hangarx:cortex-1-sync");
    });
    mkBtn("Try a chat", () => {
      closeSettings();
      runCommand("hangarx:cortex-ask");
    });
    mkBtn("Connect agents (MCP)", () => this.scrollToSection("Power features"));
  }
  /** Scroll a section header into view by its title text. Used by the
   *  Common-tasks buttons. Falls back gracefully if the title isn't
   *  found (e.g. during a partial render). */
  scrollToSection(title) {
    const headers = this.containerEl.querySelectorAll(".cortex-section-header h3");
    for (const h of Array.from(headers)) {
      if (h.textContent === title) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        const wrap = h.closest(".cortex-section-header");
        if (wrap) {
          wrap.classList.add("is-flash");
          window.setTimeout(() => wrap.classList.remove("is-flash"), 1200);
        }
        return;
      }
    }
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
        text: "Sign in with hangarx",
        cls: "mod-cta"
      });
      signInBtn.addEventListener("click", () => {
        void this.startInteractiveSignIn(signInBtn, s);
      });
      const dashBtn2 = introActions.createEl("button", { text: "Open dashboard \u2197" });
      dashBtn2.addEventListener("click", () => {
        window.open("https://app.HangarX.ai/settings?tab=api-keys", "_blank");
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
      window.open("https://app.HangarX.ai/settings?tab=api-keys", "_blank");
    });
    const signOutBtn = actions.createEl("button", { text: "Sign out" });
    signOutBtn.addEventListener("click", () => {
      void (async () => {
        s.apiKey = "";
        s.workspaceId = "";
        await this.plugin.saveSettings();
        this.display();
      })();
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
    if (!s.connectorEncryptionKey) {
      s.connectorEncryptionKey = generateEncryptionKey();
      void this.plugin.saveSettings();
    }
    if (!s.llmEncryptionKey) {
      s.llmEncryptionKey = generateEncryptionKey();
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
    const stackHealthWrap = containerEl.createDiv({ cls: "cortex-stack-health-wrap" });
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
      setupCard.toggleClass("is-hidden", ok);
      runningCard.toggleClass("is-hidden", !ok);
      this.renderStackHealthPanel(stackHealthWrap, s, ok);
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
    hero.createDiv({ cls: "cortex-local-hero-title", text: "Set up HangarX in three steps" });
    hero.createDiv({
      cls: "cortex-local-hero-sub",
      text: "HangarX runs Postgres, FalkorDB, and the Cortex API on your machine via Docker. Pulls images from Docker Hub \u2014 no source code needed."
    });
    const configuredKeys = Object.keys(s.llmKeys).filter((k) => !!s.llmKeys[k]);
    const hasKey = configuredKeys.length > 0;
    const step1 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step1.createSpan({ cls: "cortex-local-hero-step-num", text: "1." });
    const step1Body = step1.createDiv({ cls: "cortex-local-hero-step-body" });
    step1Body.createDiv({
      text: hasKey ? `Add an LLM provider key \u2014 \u2713 ${configuredKeys.length} configured` : "Add an LLM provider key",
      cls: "cortex-local-hero-step-label"
    });
    step1Body.createDiv({
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
      if (target.instanceOf(HTMLDetailsElement)) target.open = true;
    });
    const step2 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step2.createSpan({ cls: "cortex-local-hero-step-num", text: "2." });
    const step2Body = step2.createDiv({ cls: "cortex-local-hero-step-body" });
    step2Body.createDiv({ text: "Save docker-compose.cortex.yml to your vault", cls: "cortex-local-hero-step-label" });
    step2Body.createDiv({
      cls: "setting-item-description",
      text: "Bakes your API key + provider keys into the file. Re-save anytime they change."
    });
    const step2Actions = step2Body.createDiv({ cls: "cortex-local-hero-step-actions" });
    const saveBtn = step2Actions.createEl("button", { text: "Save to vault", cls: "mod-cta" });
    saveBtn.addEventListener("click", () => {
      void (async () => {
        try {
          const path = "docker-compose.cortex.yml";
          await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
          saveBtn.setText("\u2713 saved");
          activeWindow.setTimeout(() => saveBtn.setText("Save to vault"), 2e3);
        } catch (e) {
          saveBtn.setText("Failed \u2014 check console");
          console.error("[Cortex] Failed to write compose file:", e);
        }
      })();
    });
    const copyYamlBtn = step2Actions.createEl("button", { text: "Copy YAML" });
    copyYamlBtn.addEventListener("click", () => {
      void (async () => {
        await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
        copyYamlBtn.setText("Copied");
        activeWindow.setTimeout(() => copyYamlBtn.setText("Copy YAML"), 1400);
      })();
    });
    const step3 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step3.createSpan({ cls: "cortex-local-hero-step-num", text: "3." });
    const step3Body = step3.createDiv({ cls: "cortex-local-hero-step-body" });
    step3Body.createDiv({ text: "Run this in your vault folder:", cls: "cortex-local-hero-step-label" });
    const codeWrap = step3Body.createDiv({ cls: "cortex-mcp-code-wrap" });
    const copyCmdBtn = codeWrap.createEl("button", { cls: "cortex-mcp-copy", text: "Copy" });
    copyCmdBtn.addEventListener("click", () => {
      void (async () => {
        await navigator.clipboard.writeText(DOCKER_START_CMD);
        copyCmdBtn.textContent = "Copied";
        copyCmdBtn.addClass("is-copied");
        activeWindow.setTimeout(() => {
          copyCmdBtn.textContent = "Copy";
          copyCmdBtn.removeClass("is-copied");
        }, 1400);
      })();
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
    card.addClass("cortex-success-card");
    card.createDiv({
      text: "\u2713 Local stack running",
      cls: "cortex-settings-card-title"
    });
    card.createDiv({
      text: `Connected to ${s.apiUrl}. Your vault is ready to be searched and indexed by AI agents.`,
      cls: "cortex-settings-card-body"
    });
    card.createDiv({
      text: 'Verify with Cmd/Ctrl+P \u2192 "HangarX: Memory stats". Manage agents under the Agents section below.',
      cls: "cortex-settings-card-footnote"
    });
    if (s.vaultId) {
      const scope = card.createDiv({ cls: "cortex-local-vault-scope" });
      const label = scope.createSpan({ cls: "cortex-local-vault-scope-label" });
      label.setText("Vault scope: ");
      const code = scope.createEl("code", { cls: "cortex-local-vault-scope-id" });
      code.setText(`vault_${s.vaultId.slice(0, 8)}`);
      const hint = scope.createDiv({ cls: "cortex-local-vault-scope-hint" });
      hint.setText(
        "Each vault on this machine gets its own scope so notes from a different vault never leak into your queries. Auto-generated; resetting it creates a fresh, empty graph for this vault."
      );
      const reset = scope.createEl("button", {
        cls: "cortex-local-vault-scope-reset",
        text: "Reset scope"
      });
      reset.addEventListener("click", () => {
        void (async () => {
          const ok = await confirmModal(this.plugin.app, {
            title: "Reset vault scope?",
            body: "A new vaultId will be generated. The existing scoped data on the local server will be orphaned (not deleted, but unreachable from this vault). Use this only when you intentionally want a fresh graph.",
            confirmText: "Reset",
            destructive: true
          });
          if (!ok) return;
          s.vaultId = crypto.randomUUID();
          await this.plugin.saveSettings();
          this.display();
        })();
      });
    }
    return card;
  }
  /**
   * Stack health + recovery commands. Renders one of three states:
   *
   *   1. API reachable, all subsystems ok → minimal "All services healthy"
   *      strip (collapsed by default, expand for details).
   *   2. API reachable but degraded → per-service rows showing which
   *      subsystem is down + tailored recovery commands.
   *   3. API unreachable → "API offline" with restart commands and the
   *      fallback "wipe + restart fresh" nuke option at the bottom.
   *
   * No buttons actually run docker — Obsidian plugins can't shell out from
   * the renderer. Each command has a Copy button + the plugin prepends
   * `cd "<vault path>" && ` so the user can paste-and-run.
   */
  renderStackHealthPanel(parent, s, apiReachable) {
    parent.empty();
    if (s.connectionMode !== "local") return;
    const subs = this.lastHealthSubsystems;
    const someDown = subs ? Object.entries(subs).some(([, v]) => v.status === "down") : !apiReachable;
    const wrap = parent.createEl("details", { cls: "cortex-stack-health" });
    if (!apiReachable || someDown) wrap.setAttr("open", "");
    const summary = wrap.createEl("summary", { cls: "cortex-stack-health-summary" });
    const dot = summary.createSpan({ cls: "cortex-stack-health-dot" });
    if (!apiReachable) dot.addClass("is-offline");
    else if (someDown) dot.addClass("is-degraded");
    else dot.addClass("is-ok");
    if (!apiReachable) {
      summary.createSpan({ text: "Stack health \u2014 API offline" });
    } else if (someDown) {
      const downCount = subs ? Object.values(subs).filter((v) => v.status === "down").length : 0;
      summary.createSpan({ text: `Stack health \u2014 ${downCount} ${downCount === 1 ? "service" : "services"} degraded` });
    } else {
      summary.createSpan({ text: "Stack health \u2014 all services healthy" });
    }
    if (this.lastHealthVersion) {
      summary.createSpan({
        cls: "cortex-stack-health-version",
        text: `cortex-api ${this.lastHealthVersion}`
      });
    }
    const body = wrap.createDiv({ cls: "cortex-stack-health-body" });
    const services = body.createDiv({ cls: "cortex-stack-health-services" });
    const serviceRows = [
      { name: "cortex-api", label: "cortex-api" },
      { name: "falkordb", label: "falkordb (graph)" },
      { name: "postgres", label: "postgres" }
    ];
    for (const svc of serviceRows) {
      const row = services.createDiv({ cls: "cortex-stack-health-service" });
      const icon = row.createSpan({ cls: "cortex-stack-health-service-icon" });
      let statusText = "";
      if (svc.name === "cortex-api") {
        if (apiReachable) {
          icon.addClass("is-ok");
          icon.setText("\u2713");
          statusText = "Responding";
        } else {
          icon.addClass("is-down");
          icon.setText("\u2717");
          statusText = "Not responding";
        }
      } else if (!apiReachable) {
        icon.addClass("is-unknown");
        icon.setText("?");
        statusText = "Unknown (api offline)";
      } else if (subs && subs[svc.name]) {
        const sub = subs[svc.name];
        if (sub.status === "ok") {
          icon.addClass("is-ok");
          icon.setText("\u2713");
          statusText = sub.latencyMs != null ? `Connected \xB7 ${sub.latencyMs}ms` : "Connected";
        } else if (sub.status === "not_configured") {
          icon.addClass("is-skip");
          icon.setText("\u2014");
          statusText = "Not configured (skipped)";
        } else {
          icon.addClass("is-down");
          icon.setText("\u2717");
          statusText = sub.error ? `Down \u2014 ${sub.error}` : "Down (no error reported)";
        }
      } else {
        icon.addClass("is-unknown");
        icon.setText("?");
        statusText = "Unknown";
      }
      row.createSpan({ cls: "cortex-stack-health-service-name", text: svc.label });
      row.createSpan({ cls: "cortex-stack-health-service-status", text: statusText });
    }
    this.renderRecoveryCommands(body, s, apiReachable, someDown);
    const ymlPath = "docker-compose.cortex.yml";
    const ymlExists = !!this.plugin.app.vault.getAbstractFileByPath(ymlPath);
    const actions = body.createDiv({ cls: "cortex-stack-health-actions" });
    if (ymlExists) {
      const adapter = this.plugin.app.vault.adapter;
      const fullYmlPath = adapter.getFullPath?.(ymlPath);
      if (import_obsidian7.Platform.isDesktopApp && fullYmlPath) {
        const logsBtn = actions.createEl("button", { text: "Show recent logs", cls: "mod-cta" });
        logsBtn.addEventListener("click", () => void this.showRecentLogs(logsBtn, body, fullYmlPath));
      }
      const dockerBtn = actions.createEl("button", { text: "Open in docker desktop" });
      dockerBtn.addEventListener("click", () => void this.openDockerDesktop());
      const revealBtn = actions.createEl("button", { text: "Reveal docker-compose.cortex.yml" });
      revealBtn.addEventListener("click", () => {
        if (fullYmlPath) {
          const showInFolder = this.plugin.app.showInFolder;
          if (typeof showInFolder === "function") {
            showInFolder.call(this.plugin.app, fullYmlPath);
          } else {
            new import_obsidian7.Notice(`docker-compose.cortex.yml lives at: ${fullYmlPath}`);
          }
        }
      });
    } else {
      const hint = actions.createDiv({ cls: "cortex-stack-health-yml-hint" });
      hint.createSpan({
        text: 'No docker-compose.cortex.yml in your vault yet \u2014 run "Save to vault" in step 2 above.'
      });
    }
  }
  /**
   * Run `docker compose logs --tail=200 cortex-api` via Node's child_process
   * and render the output below the action row. Desktop-only — mobile Obsidian
   * doesn't expose child_process. The user can still copy the equivalent
   * command from the recovery list and run it manually.
   *
   * Why this matters: when the API is offline, the user is one click away
   * from the *actual error*, not just a list of commands. Most common cases
   * (missing LLM key, Postgres healthcheck failing, image pull issue) are
   * obvious from the last 50 log lines.
   */
  /**
   * Launch Docker Desktop. The `docker-desktop://` URL scheme is flaky:
   * Electron's `window.open` sandbox blocks custom protocols in some
   * Obsidian builds, and the scheme itself is undocumented and changes
   * between Docker Desktop versions. Reliable path is to ask the OS to
   * launch the app, the same way the user would from a launcher:
   *
   *   macOS:   `open -a 'Docker'` (Docker Desktop registers as "Docker.app")
   *   Windows: `start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"`
   *   Linux:   `docker-desktop` (binary), then xdg-open as fallback
   */
  async openDockerDesktop() {
    if (!import_obsidian7.Platform.isDesktopApp) {
      new import_obsidian7.Notice("Docker desktop launch is desktop-only.");
      return;
    }
    const winReq = window.require;
    const cp = winReq?.("child_process");
    if (!cp) {
      new import_obsidian7.Notice("Child_process unavailable. Open docker desktop manually.");
      return;
    }
    try {
      const electron = winReq?.("electron");
      if (electron?.shell?.openExternal) {
        await electron.shell.openExternal("docker-desktop://dashboard/containers").catch(() => {
        });
      }
    } catch {
    }
    const tryLaunch = (cmd, args) => new Promise((resolve) => {
      try {
        const child = cp.spawn(cmd, args, { detached: true, stdio: "ignore" });
        child.on("error", () => resolve(false));
        child.unref();
        activeWindow.setTimeout(() => resolve(true), 200);
      } catch {
        resolve(false);
      }
    });
    if (import_obsidian7.Platform.isMacOS) {
      const ok = await tryLaunch("open", ["-a", "Docker"]);
      if (ok) {
        new import_obsidian7.Notice("Launched docker desktop.");
        return;
      }
      new import_obsidian7.Notice("Couldn't launch docker desktop. Open it manually from applications.");
      return;
    }
    if (import_obsidian7.Platform.isWin) {
      const ok = await tryLaunch("powershell", ["-NoProfile", "-Command", 'Start-Process "Docker Desktop"']) || await tryLaunch("cmd", ["/c", "start", "", "Docker Desktop"]);
      if (ok) {
        new import_obsidian7.Notice("Launched docker desktop.");
        return;
      }
      new import_obsidian7.Notice("Couldn't launch docker desktop. Open it from the start menu.");
      return;
    }
    if (import_obsidian7.Platform.isLinux) {
      const ok = await tryLaunch("docker-desktop", []) || await tryLaunch("xdg-open", ["docker-desktop://dashboard/containers"]);
      if (ok) {
        new import_obsidian7.Notice("Launched docker desktop.");
        return;
      }
      new import_obsidian7.Notice("Couldn't launch Docker Desktop. Run `docker-desktop` from a terminal.");
      return;
    }
    new import_obsidian7.Notice("Unsupported platform for docker desktop launch.");
  }
  async showRecentLogs(btn, body, composeFilePath) {
    btn.setAttr("disabled", "true");
    btn.setText("Loading\u2026");
    body.querySelectorAll(".cortex-stack-health-logs").forEach((el) => el.remove());
    const container = body.createDiv({ cls: "cortex-stack-health-logs" });
    container.createDiv({ cls: "cortex-stack-health-logs-header", text: "docker compose logs --tail=200 cortex-api" });
    const pre = container.createEl("pre", { cls: "cortex-stack-health-logs-pre" });
    const code = pre.createEl("code", { text: "Running\u2026" });
    try {
      const winReq = window.require;
      const cp = winReq?.("child_process");
      const path = winReq?.("path");
      if (!cp || !path) {
        code.setText("Child_process unavailable on this platform \u2014 copy the command above and run it in a terminal.");
        return;
      }
      const cwd = path.dirname(composeFilePath);
      const fileName = path.basename(composeFilePath);
      const stdout = await new Promise((resolve, reject) => {
        cp.execFile(
          "docker",
          ["compose", "-f", fileName, "logs", "--tail=200", "--no-color", "cortex-api"],
          { cwd, timeout: 1e4, maxBuffer: 2 * 1024 * 1024 },
          (err, out, errOut) => {
            if (err && !out && !errOut) return reject(err);
            resolve(out + (errOut ? `
--- stderr ---
${errOut}` : ""));
          }
        );
      });
      code.empty();
      code.setText(stdout.trim() || "(no log output \u2014 is the container running?)");
      pre.scrollTop = pre.scrollHeight;
    } catch (e) {
      const err = e;
      code.empty();
      const msg = err.code === "ENOENT" ? "docker not found on PATH. Make sure Docker Desktop is installed and the `docker` CLI is reachable from your shell." : `Couldn't fetch logs: ${err.message ?? String(e)}`;
      code.setText(msg);
    } finally {
      btn.removeAttribute("disabled");
      btn.setText("Refresh logs");
    }
  }
  /** Render the copy-able command blocks. Top section is the "most likely
   *  to help" command for the current symptom; bottom is the always-shown
   *  reference list of all common commands. */
  renderRecoveryCommands(parent, _s, apiReachable, someDown) {
    const adapter = this.plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath?.() ?? "<your-vault-folder>";
    const yml = "docker-compose.cortex.yml";
    const cdPrefix = `cd "${vaultPath}" && \\
  `;
    const recovery = parent.createDiv({ cls: "cortex-stack-health-recovery" });
    if (!apiReachable || someDown) {
      const headline = !apiReachable ? "API isn't responding. Try the restart command first:" : "A service is degraded. Try a targeted restart:";
      recovery.createDiv({ cls: "cortex-stack-health-recovery-headline", text: headline });
      const primaryCmd = !apiReachable ? `${cdPrefix}docker compose -f ${yml} up -d` : `${cdPrefix}docker compose -f ${yml} restart`;
      this.renderCommandRow(recovery, "Restart the stack", primaryCmd, true);
    }
    const moreWrap = recovery.createEl("details", { cls: "cortex-stack-health-recovery-more" });
    if (!apiReachable || someDown) moreWrap.setAttr("open", "");
    moreWrap.createEl("summary", { text: "More recovery commands" });
    this.renderCommandRow(
      moreWrap,
      "See what's running",
      `${cdPrefix}docker compose -f ${yml} ps`
    );
    this.renderCommandRow(
      moreWrap,
      "Tail recent cortex-api logs",
      `${cdPrefix}docker compose -f ${yml} logs --tail=200 cortex-api`
    );
    this.renderCommandRow(
      moreWrap,
      "Force-recreate (after YAML change)",
      `${cdPrefix}docker compose -f ${yml} up -d --force-recreate`
    );
    this.renderCommandRow(
      moreWrap,
      "Pull the latest image",
      `${cdPrefix}docker compose -f ${yml} pull && \\
  docker compose -f ${yml} up -d`
    );
    this.renderCommandRow(
      moreWrap,
      "Wipe volumes + start fresh (destructive \u2014 graph data is lost)",
      `${cdPrefix}docker compose -f ${yml} down -v && \\
  docker compose -f ${yml} up -d`,
      false,
      true
    );
  }
  /** One labeled command block with a Copy button. `destructive` adds a
   *  warning border so the wipe command stands out from the safe ones. */
  renderCommandRow(parent, label, command, primary = false, destructive = false) {
    const row = parent.createDiv({ cls: "cortex-stack-health-cmd" });
    if (primary) row.addClass("is-primary");
    if (destructive) row.addClass("is-destructive");
    row.createDiv({ cls: "cortex-stack-health-cmd-label", text: label });
    const codeWrap = row.createDiv({ cls: "cortex-stack-health-cmd-codewrap" });
    codeWrap.createEl("pre").createEl("code", { text: command });
    const copyBtn = codeWrap.createEl("button", { cls: "cortex-stack-health-cmd-copy", text: "Copy" });
    copyBtn.addEventListener("click", () => {
      void (async () => {
        await navigator.clipboard.writeText(command);
        copyBtn.setText("Copied");
        activeWindow.setTimeout(() => copyBtn.setText("Copy"), 1400);
      })();
    });
  }
  /**
   * Diagnostic / set-once fields, collapsed by default. Holds:
   *   - Docker Compose file (re-save when provider keys change)
   *   - API URL, Workspace ID, API Key
   *
   * The API key field is shown even in local mode so users can see/edit
   * the cloud key they've saved (preserved across mode switches). Local
   * mode runs auth-disabled and ignores the value at the wire level.
   */
  renderConnectionDetails(parent, s) {
    const wrap = parent.createEl("details", { cls: "cortex-cloud-advanced" });
    wrap.createEl("summary", { text: "Diagnostics & overrides \u2014 compose file, URL, workspace, API key" });
    const body = wrap.createDiv();
    new import_obsidian7.Setting(body).setName("Docker compose file").setDesc("Re-save the YAML when you change provider keys, then run docker compose up -d --force-recreate to apply.").addButton((b) => b.setButtonText("Save to vault").setCta().onClick(async () => {
      const path = "docker-compose.cortex.yml";
      try {
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        b.setButtonText("\u2713 saved");
        new import_obsidian7.Notice(
          `Saved ${path}. If the stack is already running, apply with: docker compose -f ${path} up -d --force-recreate`,
          8e3
        );
        activeWindow.setTimeout(() => b.setButtonText("Save to vault"), 2e3);
      } catch (e) {
        b.setButtonText("Failed");
        console.error("[Cortex] Failed to write compose file:", e);
        activeWindow.setTimeout(() => b.setButtonText("Save to vault"), 2e3);
      }
    })).addButton((b) => b.setButtonText("Copy YAML").onClick(async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      b.setButtonText("Copied");
      activeWindow.setTimeout(() => b.setButtonText("Copy YAML"), 1400);
    }));
    const apiUrlSetting = new import_obsidian7.Setting(body).setName("API URL").setDesc("Defaults to HTTP://localhost:3400 \u2014 only change if you remapped the port.").addText((t) => t.setPlaceholder(LOCAL_API_URL).setValue(s.apiUrl).onChange(async (v) => {
      s.apiUrl = v || LOCAL_API_URL;
      await this.plugin.saveSettings();
    }));
    this.renderRolePill(apiUrlSetting.nameEl, "default ok");
    const workspaceSetting = new import_obsidian7.Setting(body).setName("Workspace ID").setDesc("Auto-generated. Only change if you want multiple isolated graphs in the same postgres.").addText((t) => t.setPlaceholder("Default").setValue(s.workspaceId).onChange(async (v) => {
      s.workspaceId = v.trim() || "default";
      await this.plugin.saveSettings();
    }));
    this.renderRolePill(workspaceSetting.nameEl, "auto");
    const keyStatusRow = new import_obsidian7.Setting(body).setName("Saved cloud API key").setDesc(s.apiKey ? "Preserved across mode switches so you don't have to re-sign-in. Local mode ignores this value." : "Not set. Sign in via Cloud mode to save one \u2014 local mode does not require it.");
    this.renderRolePill(keyStatusRow.nameEl, "ignored in local mode");
    if (s.apiKey) {
      const masked = `${s.apiKey.slice(0, 6)}\u2026${s.apiKey.slice(-4)}`;
      keyStatusRow.controlEl.createSpan({ cls: "cortex-key-masked", text: masked });
      keyStatusRow.addExtraButton((b) => b.setIcon("copy").setTooltip("Copy full key to clipboard").onClick(async () => {
        await navigator.clipboard.writeText(s.apiKey);
        new import_obsidian7.Notice("API key copied.");
      }));
      keyStatusRow.addExtraButton((b) => b.setIcon("trash-2").setTooltip("Forget saved key").onClick(async () => {
        const ok = await confirmModal(this.plugin.app, {
          title: "Forget the saved cloud API key?",
          body: "You'll need to sign in again next time you switch to Cloud mode.",
          confirmText: "Forget key",
          destructive: true
        });
        if (!ok) return;
        s.apiKey = "";
        await this.plugin.saveSettings();
        this.display();
      }));
    }
  }
  /**
   * Tiny inline pill describing a setting's role — distinguishes
   * fields that look mandatory but actually have a working default,
   * are auto-generated, or are inert in the current mode. Visually
   * lighter than the beta pill (neutral muted color) so it reads as
   * informational metadata rather than a warning.
   */
  renderRolePill(parent, label) {
    parent.createSpan({ cls: "cortex-role-pill", text: label });
  }
  /**
   * Render the live web-search-backend status returned from
   * /v1/agent/web-search-status into a human dependency hint.
   * Names the backend explicitly so the user knows what's serving
   * their next web_search call and whether it's likely to work.
   */
  formatWebSearchHint(status) {
    const providerLabel2 = (b) => {
      switch (b) {
        case "openai-native":
          return "OpenAI native web search";
        case "anthropic-native":
          return "Anthropic native web search";
        case "gemini-grounding":
          return "Gemini grounding";
        case "tavily":
          return "Tavily Search";
        case "perplexity":
          return "Perplexity Sonar";
        default:
          return b;
      }
    };
    if (status.backend === "none") {
      return "No web-search backend configured. Configure your active LLM provider with a key (OpenAI, Anthropic, Gemini all have native web search), or set TAVILY_API_KEY (recommended, 1k/month free) or PERPLEXITY_API_KEY on the server.";
    }
    if (!status.configured) {
      const hasFallback = status.tavilyFallback || status.perplexityFallback;
      const fallback = hasFallback ? "" : " No Tavily or Perplexity fallback either \u2014 set TAVILY_API_KEY (recommended) or PERPLEXITY_API_KEY on the server, or add a key for the active provider.";
      return `Would route to ${providerLabel2(status.backend)} but its key is missing on the server.${fallback}`;
    }
    const activeBits = status.activeProvider && status.activeModel ? ` (active model: ${status.activeProvider}/${status.activeModel})` : "";
    if (status.backend === "perplexity") {
      return `Currently routes through Perplexity Sonar${activeBits}. Provider-native search isn't available for the active model \u2014 provide an OpenAI / Anthropic / Gemini key to skip Perplexity.`;
    }
    return `Currently uses ${providerLabel2(status.backend)}${activeBits} \u2014 no extra key needed.`;
  }
  /** Kicks off the OAuth sign-in flow, swapping the button label while it's in flight. */
  async startInteractiveSignIn(signInBtn, s) {
    const original = signInBtn.textContent;
    signInBtn.setText("Opening browser\u2026");
    signInBtn.setAttr("disabled", "true");
    try {
      const result = await startSignIn({
        dashboardUrl: "https://app.HangarX.ai",
        apiUrl: s.apiUrl || CLOUD_API_URL,
        clientId: "hangarx-obsidian",
        redirectUri: "obsidian://hangarx-callback"
      });
      s.apiKey = result.accessToken;
      s.workspaceId = result.workspaceId;
      await this.plugin.saveSettings();
      new import_obsidian7.Notice(`\u2713 Signed in${result.userEmail ? ` as ${result.userEmail}` : ""}. Workspace ready to sync.`, 6e3);
      this.display();
    } catch (e) {
      const msg = e.message || "Sign-in failed";
      new import_obsidian7.Notice(`Sign-in failed: ${msg}`, 8e3);
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
      validateTimer = window.setTimeout(() => {
        void this.validateCloudKey(statusBadge);
      }, 600);
    };
    new import_obsidian7.Setting(parent).setName("API key").setDesc("Org-scoped API key from your hangarx dashboard.").addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder("Ctx_\u2026").setValue(s.apiKey).onChange(async (v) => {
        s.apiKey = v.trim();
        await this.plugin.saveSettings();
        scheduleValidate();
      });
    }).addButton((b) => b.setButtonText("Test").setTooltip("Validate the API key by calling /v1/API-keys/whoami").onClick(() => this.validateCloudKey(statusBadge)));
    new import_obsidian7.Setting(parent).setName("Workspace ID").setDesc("Found in your hangarx workspace settings (settings \u2192 workspaces).").addText((t) => t.setPlaceholder("Ws_\u2026").setValue(s.workspaceId).onChange(async (v) => {
      s.workspaceId = v.trim();
      await this.plugin.saveSettings();
      scheduleValidate();
    }));
    if (s.apiKey) {
      void this.validateCloudKey(statusBadge);
    }
  }
  /**
   * Runtime LLM provider/model picker. Calls /v1/ask/config/* on the cortex-api,
   * which stores per-org config in Postgres (encrypted) and overrides the static
   * env-var defaults at request time. Result: switching providers/models or
   * updating a key takes effect on the next request, no container restart.
   *
   * Distinct from the BYOK section in renderProviderKeysSection — that one bakes
   * keys into the docker-compose YAML for cold-boot. This one is the runtime
   * override that wins at request time, so it's the right place for "switch
   * Gemini → Claude in the middle of a session."
   */
  renderLlmRuntimeSection(parent) {
    new import_obsidian7.Setting(parent).setName("Runtime LLM (advanced)").setHeading();
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Switch chat provider and model on the fly \u2014 no container restart. Stored encrypted on the server and overrides the docker-compose defaults at request time."
    });
    const xref = parent.createEl("p", { cls: "cortex-llm-runtime-xref setting-item-description" });
    xref.appendText("Switching to a provider requires a key configured in ");
    const link = xref.createEl("a", { text: "LLM provider keys", href: "#" });
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const target = parent.querySelector("[data-cortex-keys-anchor]") ?? this.containerEl.querySelector("[data-cortex-keys-anchor]");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target.instanceOf(HTMLDetailsElement)) target.open = true;
    });
    xref.appendText(" above. Providers without a key are greyed out below.");
    const wrap = parent.createDiv({ cls: "cortex-llm-runtime" });
    const status = wrap.createDiv({ cls: "cortex-llm-runtime-status", text: "Loading current config\u2026" });
    const FALLBACK_MODELS = {
      openai: [
        { id: "gpt-4o-mini", label: "gpt-4o-mini" },
        { id: "gpt-4o", label: "gpt-4o" },
        { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
        { id: "o3-mini", label: "o3-mini" }
      ],
      anthropic: [
        { id: "claude-haiku-4-5", label: "claude-haiku-4-5" },
        { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
        { id: "claude-opus-4-7", label: "claude-opus-4-7" }
      ],
      gemini: [
        { id: "gemini-2.5-flash", label: "gemini-2.5-flash" },
        { id: "gemini-2.5-pro", label: "gemini-2.5-pro" },
        { id: "gemini-2.0-flash", label: "gemini-2.0-flash (no thinking)" }
      ],
      grok: [
        { id: "grok-4", label: "grok-4" },
        { id: "grok-3-mini", label: "grok-3-mini" }
      ],
      moonshot: [
        { id: "kimi-k2", label: "kimi-k2" },
        { id: "kimi-k2-turbo", label: "kimi-k2-turbo" }
      ],
      ollama: [
        { id: "gemma4", label: "gemma4 (Google, latest)" },
        { id: "gemma4:4b", label: "gemma4:4b (Google, 4B)" },
        { id: "gemma4:12b", label: "gemma4:12b (Google, 12B)" },
        { id: "gemma4:27b", label: "gemma4:27b (Google, 27B)" },
        { id: "gemma3:4b", label: "gemma3:4b (Google, 4B)" },
        { id: "gemma3:12b", label: "gemma3:12b (Google, 12B)" },
        { id: "gemma3:27b", label: "gemma3:27b (Google, 27B)" },
        { id: "llama3.2", label: "llama3.2" },
        { id: "llama3", label: "llama3 (8B)" },
        { id: "qwen2.5", label: "qwen2.5 (7B)" },
        { id: "mistral", label: "mistral (7B)" },
        { id: "phi3", label: "phi3" },
        { id: "nomic-embed-text", label: "nomic-embed-text (embedding)" }
      ],
      openrouter: [
        { id: "openai/gpt-4o-mini", label: "openai/gpt-4o-mini" },
        { id: "anthropic/claude-sonnet-4-6", label: "anthropic/claude-sonnet-4-6" },
        { id: "google/gemini-2.5-flash", label: "google/gemini-2.5-flash" },
        { id: "meta-llama/llama-3.3-70b-instruct", label: "meta-llama/llama-3.3-70b-instruct" }
      ],
      huggingface: [
        { id: "moonshotai/Kimi-K2.5", label: "Kimi K2.5 (Moonshot)" },
        { id: "moonshotai/Kimi-K2-Instruct-0905", label: "Kimi K2 Instruct 0905 (Moonshot)" },
        { id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B (Meta)" },
        { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B (Alibaba)" }
      ]
    };
    let modelsByProvider = { ...FALLBACK_MODELS };
    let currentProvider = "";
    let currentModel = "";
    const providerSel = { value: "" };
    const modelSel = { value: "" };
    let providerDropdownEl = null;
    const providerSetting = new import_obsidian7.Setting(wrap).setName("Chat provider").setDesc("Which LLM provider runs chat completions. Greyed-out providers need a key configured first.").addDropdown((d) => {
      const s = this.plugin.settings;
      for (const id of ["openai", "anthropic", "gemini", "grok", "moonshot", "huggingface", "ollama", "openrouter"]) {
        const keyField = runtimeProviderKeyField(id);
        const hasKey = keyField === null || !!s.llmKeys[keyField];
        const label = hasKey ? providerLabel(id) : `${providerLabel(id)} \u2014 no key configured`;
        d.addOption(id, label);
      }
      providerDropdownEl = d.selectEl;
      for (const opt of Array.from(providerDropdownEl.options)) {
        const keyField = runtimeProviderKeyField(opt.value);
        const hasKey = keyField === null || !!s.llmKeys[keyField];
        if (!hasKey) opt.disabled = true;
      }
      d.onChange((v) => {
        providerSel.value = v;
        repopulateModels();
      });
    });
    const modelSetting = new import_obsidian7.Setting(wrap).setName("Chat model").setDesc("Specific model from the chosen provider.").addDropdown((d) => {
      d.addOption("", "\u2014 pick a provider first \u2014");
      d.onChange((v) => {
        modelSel.value = v;
      });
    });
    let apiKeyInput = null;
    const keySetting = new import_obsidian7.Setting(wrap).setName("API key").setDesc("Optional. Leave blank to keep the existing key. Required only when switching providers or rotating.").addText((t) => {
      apiKeyInput = t;
      t.inputEl.type = "password";
      t.setPlaceholder("Sk-\u2026 / aiza\u2026 / etc.");
    });
    const buttonRow = wrap.createDiv({ cls: "cortex-llm-runtime-actions" });
    const testBtn = buttonRow.createEl("button", { text: "Test", cls: "cortex-llm-runtime-test" });
    const applyBtn = buttonRow.createEl("button", { text: "Apply", cls: "cortex-llm-runtime-apply mod-cta" });
    const setStatus = (text, kind = "info") => {
      status.removeClass("is-ok");
      status.removeClass("is-err");
      status.removeClass("is-info");
      status.addClass(`is-${kind}`);
      status.setText(text);
    };
    const repopulateModels = () => {
      const dropdown = modelSetting.components[0].selectEl;
      while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
      const list = modelsByProvider[providerSel.value] ?? [];
      if (list.length === 0) {
        const opt = activeDocument.createEl("option");
        opt.value = "";
        opt.text = `\u2014 no models registered for ${providerSel.value} \u2014`;
        dropdown.appendChild(opt);
        modelSel.value = "";
        return;
      }
      for (const m of list) {
        const opt = activeDocument.createEl("option");
        opt.value = m.id;
        opt.text = m.label || m.id;
        dropdown.appendChild(opt);
      }
      const stillValid = list.some((m) => m.id === modelSel.value);
      modelSel.value = stillValid ? modelSel.value : providerSel.value === currentProvider && list.some((m) => m.id === currentModel) ? currentModel : list[0].id;
      dropdown.value = modelSel.value;
    };
    const seedFromConfig = (cfg) => {
      currentProvider = cfg.chatProvider ?? "";
      currentModel = cfg.chatModel ?? "";
      providerSel.value = currentProvider || "gemini";
      modelSel.value = currentModel;
      const pDropdown = providerSetting.components[0].selectEl;
      pDropdown.value = providerSel.value;
      repopulateModels();
      const keyHint = cfg.chatApiKeyMasked ? `Current key: ${cfg.chatApiKeyMasked} \xB7 leave blank to keep` : "No key stored \u2014 required for cloud providers";
      keySetting.setDesc(keyHint);
    };
    void this.plugin.client.getLlmModels().then((reg) => {
      const arr = Array.isArray(reg) ? reg : Object.values(reg);
      for (const p of arr) {
        const serverList = (p.models ?? []).map((m) => {
          const mm = m;
          return {
            id: mm.id,
            label: mm.label || mm.name || mm.id
          };
        });
        const merged = /* @__PURE__ */ new Map();
        for (const m of modelsByProvider[p.id] ?? []) merged.set(m.id, m);
        for (const m of serverList) merged.set(m.id, m);
        if (merged.size > 0) {
          modelsByProvider[p.id] = Array.from(merged.values());
        }
      }
    }).catch((e) => {
      console.warn("[Cortex] Couldn't load model registry, using fallback list:", e);
    }).then(async () => {
      try {
        const cfg = await this.plugin.client.getLlmConfig();
        seedFromConfig(cfg);
        setStatus(`Active: ${cfg.chatProvider ?? "\u2014"} / ${cfg.chatModel ?? "\u2014"}`, "ok");
      } catch (e) {
        seedFromConfig({
          chatProvider: "gemini",
          chatModel: ""
        });
        const msg = e.message;
        if (/→ 500/.test(msg)) {
          setStatus(
            "No runtime override saved yet. Pick a provider + model and click Apply to set one.",
            "info"
          );
        } else {
          setStatus(`Couldn't load runtime config: ${msg}`, "err");
        }
      }
    }).catch((e) => {
      setStatus(`Couldn't load model registry: ${e.message}`, "err");
    });
    testBtn.addEventListener("click", () => {
      void (async () => {
        if (!providerSel.value || !modelSel.value) {
          setStatus("Pick a provider and model first.", "err");
          return;
        }
        const apiKey = apiKeyInput?.getValue?.();
        testBtn.setAttr("disabled", "true");
        testBtn.setText("Testing\u2026");
        try {
          const r = await this.plugin.client.testLlmConfig({
            provider: providerSel.value,
            model: modelSel.value,
            apiKey: apiKey || void 0
          });
          if (r.success) {
            setStatus(`\u2713 ${providerSel.value}/${modelSel.value} reachable${r.latencyMs ? ` (${r.latencyMs}ms)` : ""}`, "ok");
          } else {
            setStatus(`\u2717 Test failed: ${r.message ?? "unknown error"}`, "err");
          }
        } catch (e) {
          setStatus(`\u2717 Test threw: ${e.message}`, "err");
        } finally {
          testBtn.removeAttribute("disabled");
          testBtn.setText("Test");
        }
      })();
    });
    applyBtn.addEventListener("click", () => {
      void (async () => {
        if (!providerSel.value || !modelSel.value) {
          setStatus("Pick a provider and model first.", "err");
          return;
        }
        const apiKey = apiKeyInput?.getValue?.();
        applyBtn.setAttr("disabled", "true");
        applyBtn.setText("Applying\u2026");
        try {
          const cfg = await this.plugin.client.updateLlmConfig({
            chatProvider: providerSel.value,
            chatModel: modelSel.value,
            // Only send the key if the user typed something — otherwise the
            // server keeps whatever's already stored.
            ...apiKey ? { chatApiKey: apiKey, useOwnChatKey: true } : {}
          });
          seedFromConfig(cfg);
          if (apiKeyInput?.setValue) apiKeyInput.setValue("");
          setStatus(`\u2713 Applied: ${cfg.chatProvider}/${cfg.chatModel}`, "ok");
          new import_obsidian7.Notice(`HangarX: switched to ${cfg.chatProvider}/${cfg.chatModel}`);
        } catch (e) {
          setStatus(`\u2717 Apply failed: ${e.message}`, "err");
        } finally {
          applyBtn.removeAttribute("disabled");
          applyBtn.setText("Apply");
        }
      })();
    });
  }
  renderAgentsSection(parent) {
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Make this vault available as a memory + context layer for AI agents on this machine \u2014 Claude Desktop, Claude Code, Cursor, or anything else that speaks MCP. Your notes, decisions, and project history become permanent agent context across sessions."
    });
    new import_obsidian7.Setting(parent).setName("Local agents").setHeading();
    const connectRow = parent.createDiv({ cls: "cortex-agents-connect-row" });
    this.renderAgentConnectCards(connectRow);
    if (this.plugin.settings.connectionMode === "cloud" && this.plugin.settings.apiKey) {
      this.renderCloudAgentsSection(parent);
    }
    new import_obsidian7.Setting(parent).setName("Enable local mcp server").setDesc("Required for the connect buttons above. Binds to 127.0.0.1 only.").addToggle((t) => t.setValue(this.plugin.settings.mcpEnabled).onChange(async (v) => {
      this.plugin.settings.mcpEnabled = v;
      await this.plugin.saveSettings();
      await this.plugin.toggleMcpServer(v);
      this.display();
    }));
    if (!this.plugin.settings.mcpEnabled) {
      parent.createEl("p", {
        cls: "cortex-agents-hint",
        text: "Enable the mcp server to expose memory tools to agents. The server only listens on localhost."
      });
      return;
    }
    const advanced = parent.createEl("details", { cls: "cortex-mcp-advanced" });
    advanced.createEl("summary", { text: "Advanced mcp details (port, token, manual config snippet)" });
    const advBody = advanced.createDiv();
    new import_obsidian7.Setting(advBody).setName("Mcp port").setDesc("Port to bind to (default 7474). Change requires server restart.").addText((t) => t.setValue(String(this.plugin.settings.mcpPort)).onChange(async (v) => {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n > 0 && n < 65536) {
        this.plugin.settings.mcpPort = n;
        await this.plugin.saveSettings();
      }
    }));
    if (this.plugin.settings.mcpToken) {
      const url = `http://127.0.0.1:${this.plugin.settings.mcpPort}`;
      new import_obsidian7.Setting(advBody).setName("Mcp URL").addText((t) => {
        t.inputEl.readOnly = true;
        t.setValue(url);
      });
      new import_obsidian7.Setting(advBody).setName("Mcp token").setDesc("Bearer token required by clients. Keep it secret.").addText((t) => {
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
  "hangarx": {
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
      const codeWrap = example.createDiv({ cls: "cortex-mcp-code-wrap" });
      const copyBtn = codeWrap.createEl("button", {
        cls: "cortex-mcp-copy",
        text: "Copy"
      });
      copyBtn.addEventListener("click", () => {
        void (async () => {
          await navigator.clipboard.writeText(snippet);
          const original = copyBtn.textContent;
          copyBtn.textContent = "Copied";
          copyBtn.addClass("is-copied");
          activeWindow.setTimeout(() => {
            copyBtn.textContent = original;
            copyBtn.removeClass("is-copied");
          }, 1400);
        })();
      });
      codeWrap.createEl("pre").createEl("code", { text: snippet });
    }
  }
  renderAgentConnectCards(parent) {
    parent.empty();
    if (!this.plugin.settings.mcpEnabled || !this.plugin.settings.mcpToken) return;
    if (!import_obsidian7.Platform.isDesktopApp) {
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
        text: "Bridge script not yet generated. Toggle the mcp server off and on to regenerate."
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
    head.createSpan({ cls: "cortex-agent-row-label", text: h.label });
    const status = head.createSpan({ cls: "cortex-agent-row-status", text: "\u2026" });
    main.createSpan({ cls: "cortex-agent-row-desc", text: h.description });
    const actions = row.createDiv({ cls: "cortex-agent-row-actions" });
    const connectBtn = actions.createEl("button", { text: "Connect" });
    void checkConnection(h.configPath).then((s) => {
      if (s.connected) {
        status.setText("\u2713 connected");
        status.addClass("is-connected");
        connectBtn.setText("Reconnect");
      } else if (s.exists) {
        status.setText("Not connected");
      } else {
        status.setText("Not installed");
        status.addClass("is-faint");
      }
    });
    connectBtn.addEventListener("click", () => {
      void (async () => {
        connectBtn.setText("Connecting\u2026");
        connectBtn.setAttr("disabled", "true");
        try {
          const result = await h.connect();
          if (result.ok) {
            status.setText(result.unchanged ? "\u2713 Already connected" : "\u2713 Connected");
            status.addClass("is-connected");
            status.removeClass("is-faint");
            new import_obsidian7.Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
            connectBtn.setText("Reconnect");
          } else {
            status.setText("Failed");
            status.addClass("is-error");
            new import_obsidian7.Notice(`${h.label}: ${result.message}`);
            connectBtn.setText("Retry");
          }
        } finally {
          connectBtn.removeAttribute("disabled");
        }
      })();
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
    const menu = new import_obsidian7.Menu();
    menu.addItem((item) => item.setTitle("Copy config path").setIcon("clipboard").onClick(async () => {
      await navigator.clipboard.writeText(path);
      new import_obsidian7.Notice("Config path copied.");
    }));
    menu.addItem((item) => item.setTitle(this.fileManagerLabel()).setIcon("folder-open").onClick(() => {
      if (!revealInFileManager(path)) {
        new import_obsidian7.Notice("Couldn't open the file manager from this build of Obsidian.");
      }
    }));
    menu.addItem((item) => item.setTitle("Copy mcp snippet").setIcon("code").onClick(async () => {
      const snippet = JSON.stringify(
        { mcpServers: { "hangarx": buildBridgeEntry(bridge) } },
        null,
        2
      );
      await navigator.clipboard.writeText(snippet);
      new import_obsidian7.Notice("Mcp config snippet copied.");
    }));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("Disconnect").setIcon("unplug").setWarning(true).onClick(async () => {
      const result = await disconnectMcpEntry(path);
      if (result.ok) {
        status.setText(result.unchanged ? "Not connected" : "Disconnected");
        status.removeClass("is-connected");
        connectBtn.setText("Connect");
        new import_obsidian7.Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
      } else {
        new import_obsidian7.Notice(`${h.label}: ${result.message}`);
      }
    }));
    menu.showAtMouseEvent(evt);
  }
  /** OS-aware label for the "Reveal in …" menu item. */
  fileManagerLabel() {
    if (import_obsidian7.Platform.isMacOS) return "Reveal in Finder";
    if (import_obsidian7.Platform.isWin) return "Show in Explorer";
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
    main.createSpan({ cls: "cortex-agent-row-label", text: "Other MCP-compatible app" });
    main.createSpan({
      cls: "cortex-agent-row-desc",
      text: "Copy the snippet below into any client that speaks MCP (Zed, Goose, Codex CLI, custom agents)."
    });
    const body = row.createDiv({ cls: "cortex-agent-row-body" });
    const entry = { mcpServers: { "hangarx": buildBridgeEntry(bridge) } };
    const snippet = JSON.stringify(entry, null, 2);
    const codeWrap = body.createDiv({ cls: "cortex-mcp-code-wrap" });
    const copyBtn = codeWrap.createEl("button", { cls: "cortex-mcp-copy", text: "Copy" });
    copyBtn.addEventListener("click", () => {
      void (async () => {
        await navigator.clipboard.writeText(snippet);
        copyBtn.setText("Copied");
        copyBtn.addClass("is-copied");
        activeWindow.setTimeout(() => {
          copyBtn.setText("Copy");
          copyBtn.removeClass("is-copied");
        }, 1400);
      })();
    });
    codeWrap.createEl("pre").createEl("code", { text: snippet });
  }
  /**
   * Cloud agents section. Same vault, accessed remotely from a cloud-side
   * agent (Claude.ai web/mobile, ChatGPT desktop, Cursor on a remote dev
   * box) rather than via the local MCP bridge. The cloud already exposes a
   * public MCP endpoint at cortex.HangarX.ai/mcp; agents authenticate with
   * the same `ctx_…` API key the plugin already has, so we just need to
   * surface the URL + key in copy-pasteable form.
   */
  renderCloudAgentsSection(parent) {
    const apiKey = this.plugin.settings.apiKey;
    const apiUrl = (this.plugin.settings.apiUrl || "https://cortex.hangarx.ai").replace(/\/$/, "");
    const mcpUrl = `${apiUrl}/mcp`;
    const workspaceId = this.plugin.settings.workspaceId;
    new import_obsidian7.Setting(parent).setName("Cloud agents").setHeading();
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Reach the same workspace from agents that don't run on this machine \u2014 Claude.ai web/mobile, ChatGPT desktop, or any agent on a cloud dev box. They authenticate against cortex.HangarX.ai/mcp using your API key."
    });
    const summary = parent.createDiv({ cls: "cortex-cloud-agent-summary" });
    const summaryLeft = summary.createDiv({ cls: "cortex-cloud-agent-summary-fields" });
    summaryLeft.createDiv({ cls: "cortex-cloud-agent-row", text: `URL: ${mcpUrl}` });
    summaryLeft.createDiv({
      cls: "cortex-cloud-agent-row",
      text: `Auth: x-api-key: ${apiKey ? maskKey(apiKey) : "<not configured>"}`
    });
    if (workspaceId) {
      summaryLeft.createDiv({
        cls: "cortex-cloud-agent-row",
        text: `Workspace: x-workspace-id: ${workspaceId}`
      });
    }
    const summaryActions = summary.createDiv({ cls: "cortex-cloud-agent-summary-actions" });
    const copyAllBtn = summaryActions.createEl("button", { text: "Copy URL + key", cls: "mod-cta" });
    copyAllBtn.addEventListener("click", () => {
      void (async () => {
        const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
        if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
        await navigator.clipboard.writeText(lines.join("\n"));
        copyAllBtn.setText("Copied");
        activeWindow.setTimeout(() => copyAllBtn.setText("Copy URL + key"), 1400);
      })();
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
      main.createSpan({ cls: "cortex-agent-row-label", text: c.label });
      main.createSpan({ cls: "cortex-agent-row-desc", text: c.description });
      const actions = row.createDiv({ cls: "cortex-agent-row-actions" });
      const setupBtn = actions.createEl("button", { text: c.openUrl ? "Open & copy" : "Copy creds" });
      setupBtn.addEventListener("click", () => {
        void (async () => {
          const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
          if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
          await navigator.clipboard.writeText(lines.join("\n"));
          if (c.openUrl) window.open(c.openUrl, "_blank");
          setupBtn.setText("Copied");
          activeWindow.setTimeout(() => setupBtn.setText(c.openUrl ? "Open & copy" : "Copy creds"), 1400);
        })();
      });
      const moreBtn = actions.createEl("button", {
        text: "\u22EF",
        attr: { "aria-label": "More actions", title: "More actions" }
      });
      moreBtn.addEventListener("click", (evt) => {
        evt.preventDefault();
        const menu = new import_obsidian7.Menu();
        menu.addItem((item) => item.setTitle("Copy URL only").setIcon("clipboard").onClick(async () => {
          await navigator.clipboard.writeText(mcpUrl);
          new import_obsidian7.Notice("Mcp URL copied.");
        }));
        menu.addItem((item) => item.setTitle("Copy key only").setIcon("clipboard").onClick(async () => {
          await navigator.clipboard.writeText(apiKey);
          new import_obsidian7.Notice("API key copied.");
        }));
        if (workspaceId) {
          menu.addItem((item) => item.setTitle("Copy workspace ID").setIcon("clipboard").onClick(async () => {
            await navigator.clipboard.writeText(workspaceId);
            new import_obsidian7.Notice("Workspace ID copied.");
          }));
        }
        menu.addItem((item) => item.setTitle("Copy curl test").setIcon("terminal").onClick(async () => {
          const curl = `curl -s -X POST -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H 'x-api-key: ${apiKey}'${workspaceId ? ` -H 'x-workspace-id: ${workspaceId}'` : ""} -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' ${mcpUrl}`;
          await navigator.clipboard.writeText(curl);
          new import_obsidian7.Notice("Curl one-liner copied \u2014 paste in any terminal to verify connectivity.");
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
      { id: "xai", label: "xAI (Grok)", placeholder: "xai-\u2026", href: "https://console.x.ai/" },
      // Reranker providers — neither runs chat completions, but configuring
      // either flips on the learned-reranker step in retrieval, which the
      // Memory Stats "Heads up" panel surfaces as the missing piece for
      // higher-quality answers. Cohere is the higher-quality option, Jina
      // has a generous free tier.
      { id: "cohere", label: "Cohere (reranker)", placeholder: "\u2026", href: "https://dashboard.cohere.com/api-keys" },
      { id: "jina", label: "Jina (reranker)", placeholder: "jina_\u2026", href: "https://jina.ai/?sui=apikey" },
      // Web-search backends — used by the agent's `web_search` tool when
      // the active LLM provider doesn't have native web search. Optional;
      // a missing key just disables the tool (graceful fallback).
      // Tavily is preferred (purpose-built for agent loops, 1k/month
      // free with no card); Perplexity stays as the backup.
      { id: "tavily", label: "Tavily (web search, recommended)", placeholder: "tvly-\u2026", href: "https://app.tavily.com/home" },
      { id: "perplexity", label: "Perplexity (web search)", placeholder: "pplx-\u2026", href: "https://www.perplexity.ai/settings/api" }
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
      text: "Bring your own API keys. They're baked into the docker-compose YAML on disk and never sent to HangarX. Cohere and Jina aren't chat LLMs \u2014 they enable the learned reranker for higher-quality retrieval. After adding or changing any key, re-save the Compose file in Connection details to apply."
    });
    new import_obsidian7.Setting(body).setName("Embedding provider").setDesc(
      "Where embedding calls run. Gemini is fastest to start (free tier, rate-limited). Switch to Ollama for unlimited local embeddings once your vault grows \u2014 requires installing Ollama and running `ollama pull nomic-embed-text`."
    ).addDropdown((d) => d.addOption("gemini", "Gemini (cloud, free tier \u2014 rate-limited)").addOption("ollama", "Ollama local (recommended for heavy ingests)").setValue(s.embeddingPreset || "gemini").onChange(async (v) => {
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
    void this.plugin.client.getLlmConfig().then((cfg) => {
      const runtimeProvider = cfg?.chatProvider;
      if (!runtimeProvider) return;
      const targetKeysField = PROVIDERS.find(
        (p) => keysFieldToRuntimeProvider(p.id) === runtimeProvider
      )?.id;
      if (!targetKeysField) return;
      const targetRow = list.querySelector(
        `.cortex-provider-row[data-provider-id="${targetKeysField}"]`
      );
      if (!targetRow) return;
      const summary = targetRow.querySelector(".cortex-provider-row-summary");
      if (!summary) return;
      if (summary.querySelector(".cortex-provider-row-active-chip")) return;
      const chip = createDiv({ cls: "cortex-provider-row-active-chip" });
      chip.setText("Active for chat");
      chip.setAttr("title", `${runtimeProvider}/${cfg.chatModel ?? "\u2014"} is the current runtime override.`);
      const label = summary.querySelector(".cortex-provider-row-label");
      if (label) label.insertAdjacentElement("afterend", chip);
      else summary.appendChild(chip);
    }).catch(() => {
    });
  }
  /**
   * One provider row. Collapsed view: name + status pill. Expanded view:
   * password input, "Get a key" external link, and Test button. Keeps the
   * settings page navigable when most providers aren't configured.
   */
  renderProviderRow(parent, s, p) {
    const row = parent.createEl("details", { cls: "cortex-provider-row" });
    row.setAttr("data-provider-id", p.id);
    if (s.llmKeys[p.id]) row.setAttr("open", "");
    const summary = row.createEl("summary", { cls: "cortex-provider-row-summary" });
    summary.createSpan({ cls: "cortex-provider-row-label", text: p.label });
    const status = summary.createSpan({ cls: "cortex-provider-row-status" });
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
    const setting = new import_obsidian7.Setting(body);
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
        const RUNTIME_PROVIDERS = /* @__PURE__ */ new Set(["gemini", "openai", "anthropic", "moonshot", "openrouter", "xai", "huggingface"]);
        if (RUNTIME_PROVIDERS.has(p.id) && trimmed) {
          this.pushBYOKToRuntime(p.id, trimmed).catch((err) => {
            console.warn("[Cortex] Couldn't push BYOK to runtime config:", err);
          });
        }
      });
    });
    setting.addExtraButton((b) => b.setIcon("external-link").setTooltip("Get a key").onClick(() => window.open(p.href, "_blank")));
    setting.addButton((b) => b.setButtonText("Test").setTooltip("Verify the key by calling the provider through the local cortex-API.").onClick(async () => {
      const key = s.llmKeys[p.id];
      if (!key) {
        new import_obsidian7.Notice(`Enter a ${p.label} key first.`);
        return;
      }
      b.setButtonText("Testing\u2026");
      b.setDisabled(true);
      try {
        const ok = await this.testProviderKey(p.id, key);
        b.setButtonText(ok ? "\u2713 Valid" : "\u2717 Invalid");
        activeWindow.setTimeout(() => b.setButtonText("Test"), 2200);
      } catch (e) {
        b.setButtonText("\u2717 error");
        new import_obsidian7.Notice(`Test failed: ${e.message}`);
        activeWindow.setTimeout(() => b.setButtonText("Test"), 2800);
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
      badgeEl.createSpan({ text: "No API key set yet \u2014 paste one above to connect." });
      return;
    }
    badgeEl.createSpan({ text: "Checking API key\u2026", cls: "cortex-cloud-status-checking" });
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
          badgeEl.createSpan({
            text: "\u2713 API key works (server doesn't expose identity details)",
            cls: "cortex-cloud-status-head"
          });
          if (!s.workspaceId) {
            badgeEl.addClass("is-warn");
            badgeEl.createSpan({
              cls: "cortex-cloud-status-sub",
              text: "\u26A0 Workspace ID is empty \u2014 set it below to enable sync and ask."
            });
          }
        } else {
          badgeEl.addClass("is-invalid");
          badgeEl.createSpan({
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
        badgeEl.createSpan({
          text: `\u2717 ${headline}`,
          cls: "cortex-cloud-status-head"
        });
        if (detail.code || detail.message) {
          badgeEl.createSpan({
            text: `${detail.code ? `[${detail.code}] ` : ""}${detail.message ?? ""}`.trim(),
            cls: "cortex-cloud-status-sub"
          });
        }
      } else if (status >= 500) {
        badgeEl.createSpan({
          text: `\u2717 Server error (${status}) \u2014 try again in a moment.`,
          cls: "cortex-cloud-status-head"
        });
      } else {
        badgeEl.createSpan({
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
    badgeEl.createSpan({ text: headParts.join(" "), cls: "cortex-cloud-status-head" });
    const subParts = [];
    if (info.lastUsedAt) {
      const ago = relativeTimestamp(info.lastUsedAt);
      if (ago) subParts.push(`Last used ${ago}`);
    }
    if (typeof info.totalRequests === "number") {
      subParts.push(`${info.totalRequests.toLocaleString()} requests`);
    }
    if (subParts.length > 0) {
      badgeEl.createSpan({ text: subParts.join(" \xB7 "), cls: "cortex-cloud-status-sub" });
    }
    if (!workspaceId) {
      badgeEl.addClass("is-warn");
      badgeEl.createSpan({
        cls: "cortex-cloud-status-sub",
        text: "\u26A0 Workspace ID is empty \u2014 set it below to enable sync and ask."
      });
    } else if (info.allowedWorkspaceIds && !info.allowedWorkspaceIds.includes(workspaceId)) {
      badgeEl.addClass("is-warn");
      badgeEl.createSpan({
        cls: "cortex-cloud-status-sub",
        text: `\u26A0 This key isn't authorized for workspace ${workspaceId.slice(0, 16)}\u2026`
      });
    }
  }
  /**
   * Smoke-test a provider key via the local cortex-api's `/v1/system/test-provider`
   * endpoint. Falls back to a direct provider call when the endpoint isn't available.
   */
  /**
   * Push a BYOK chat-provider key into the runtime LLM config so the
   * cortex-api uses it for the next request without requiring a compose
   * YAML re-save + container restart. Picks a sensible default model per
   * provider when the runtime config doesn't already have one set.
   *
   * Why this matters: previously the BYOK section wrote only to the
   * docker-compose env var, which meant updating a key required:
   *   1. Save to vault (regenerate YAML with new key)
   *   2. docker compose up -d --force-recreate
   * Three-step UX for what should be one click. By mirroring BYOK changes
   * into the runtime config (Postgres-backed, encrypted, picked up by
   * the model router on every request), the key takes effect immediately.
   */
  async pushBYOKToRuntime(providerId, apiKey) {
    const providerMap = {
      gemini: "gemini",
      openai: "openai",
      anthropic: "anthropic",
      moonshot: "moonshot",
      openrouter: "openrouter",
      xai: "grok",
      huggingface: "huggingface"
    };
    const runtimeProvider = providerMap[providerId];
    if (!runtimeProvider) return;
    const defaultModelByProvider = {
      gemini: "gemini-2.5-flash",
      openai: "gpt-4o-mini",
      anthropic: "claude-haiku-4-5",
      moonshot: "kimi-k2",
      openrouter: "anthropic/claude-sonnet-4-6",
      grok: "grok-4",
      huggingface: "moonshotai/Kimi-K2.5"
    };
    let chatModel;
    try {
      const current = await this.plugin.client.getLlmConfig();
      if (current?.chatProvider === runtimeProvider && current?.chatModel) {
        chatModel = current.chatModel;
      }
    } catch {
    }
    chatModel = chatModel ?? defaultModelByProvider[runtimeProvider];
    await this.plugin.client.updateLlmConfig({
      chatProvider: runtimeProvider,
      chatModel,
      chatApiKey: apiKey,
      useOwnChatKey: true
    });
  }
  async testProviderKey(provider, apiKey) {
    const apiUrl = this.plugin.settings.apiUrl.replace(/\/$/, "");
    try {
      const res = await (0, import_obsidian7.requestUrl)({
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
    const healthResult = await this.probeWithBody(`${cleanUrl}/health`);
    if (healthResult.kind === "ok" || healthResult.kind === "http") {
      const subsystems = readSubsystems(healthResult.body);
      this.lastHealthSubsystems = subsystems;
      this.lastHealthVersion = readVersion(healthResult.body);
      if (healthResult.kind === "ok") {
        this.lastHealthDetail = `Connected to ${cleanUrl}`;
        return true;
      }
      if (healthResult.status === 503) {
        const downCount = subsystems ? Object.values(subsystems).filter((v) => v.status === "down").length : 0;
        this.lastHealthDetail = downCount > 0 ? `Container reachable but ${downCount} ${downCount === 1 ? "service" : "services"} degraded \u2014 see Stack health below.` : "Container reachable but degraded (503). Check Docker logs.";
        return true;
      }
      this.lastHealthDetail = `Container reachable (${healthResult.status} from /health).`;
      return true;
    }
    const rootResult = await this.probeWithBody(cleanUrl);
    if (rootResult.kind !== "network") {
      this.lastHealthSubsystems = null;
      this.lastHealthVersion = null;
      this.lastHealthDetail = `Container reachable at ${cleanUrl} (no /health endpoint).`;
      return true;
    }
    this.lastHealthSubsystems = null;
    this.lastHealthVersion = null;
    this.lastHealthDetail = `Cannot reach ${cleanUrl} \u2014 ${healthResult.error}`;
    return false;
  }
  async probeWithBody(url) {
    try {
      const res = await Promise.race([
        (0, import_obsidian7.requestUrl)({ url, method: "GET", throw: false }),
        new Promise(
          (_, reject) => activeWindow.setTimeout(() => reject(new Error("timeout after 5s")), 5e3)
        )
      ]);
      let body = null;
      try {
        body = res.json;
      } catch {
      }
      if (res.status >= 200 && res.status < 400) return { kind: "ok", status: res.status, body };
      return { kind: "http", status: res.status, body };
    } catch (e) {
      return { kind: "network", error: e.message || "connection refused" };
    }
  }
};
function readSubsystems(body) {
  if (!body || typeof body !== "object") return null;
  const data = body.data;
  if (!data || typeof data !== "object") return null;
  const subs = data.subsystems;
  if (subs && typeof subs === "object") {
    return subs;
  }
  const services = data.services;
  if (services && typeof services === "object") {
    const out = {};
    for (const [k, v] of Object.entries(services)) {
      if (v === "connected") out[k] = { status: "ok" };
      else if (v === "not_configured") out[k] = { status: "not_configured" };
      else out[k] = { status: "down" };
    }
    return out;
  }
  return null;
}
function readVersion(body) {
  if (!body || typeof body !== "object") return null;
  const data = body.data;
  if (!data || typeof data !== "object") return null;
  const v = data.version;
  return typeof v === "string" ? v : null;
}
function providerLabel(id) {
  switch (id) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic (Claude)";
    case "gemini":
      return "Google Gemini";
    case "grok":
      return "xAI (Grok)";
    case "moonshot":
      return "Moonshot (Kimi)";
    case "huggingface":
      return "HuggingFace (HF Inference)";
    case "ollama":
      return "Ollama (local)";
    case "openrouter":
      return "OpenRouter";
    default:
      return id;
  }
}
function runtimeProviderKeyField(runtimeId) {
  switch (runtimeId) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "gemini":
      return "gemini";
    case "grok":
      return "xai";
    case "moonshot":
      return "moonshot";
    case "openrouter":
      return "openrouter";
    case "huggingface":
      return "huggingface";
    case "ollama":
      return null;
    default:
      return null;
  }
}
function keysFieldToRuntimeProvider(keysFieldId) {
  switch (keysFieldId) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "gemini":
      return "gemini";
    case "xai":
      return "grok";
    case "moonshot":
      return "moonshot";
    case "openrouter":
      return "openrouter";
    case "huggingface":
      return "huggingface";
    default:
      return null;
  }
}
function buildDockerComposeWithKeys(s) {
  const base = buildDockerCompose(
    s.connectorEncryptionKey,
    s.llmEncryptionKey,
    s.embeddingPreset || "gemini"
  );
  const pairs = [
    ["GEMINI_API_KEY", s.llmKeys.gemini],
    ["OPENAI_API_KEY", s.llmKeys.openai],
    ["ANTHROPIC_API_KEY", s.llmKeys.anthropic],
    ["MOONSHOT_API_KEY", s.llmKeys.moonshot],
    ["HF_TOKEN", s.llmKeys.huggingface],
    ["OPENROUTER_API_KEY", s.llmKeys.openrouter],
    ["XAI_API_KEY", s.llmKeys.xai],
    ["COHERE_API_KEY", s.llmKeys.cohere],
    ["JINA_API_KEY", s.llmKeys.jina],
    ["PERPLEXITY_API_KEY", s.llmKeys.perplexity],
    ["TAVILY_API_KEY", s.llmKeys.tavily]
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
    const res = await (0, import_obsidian7.requestUrl)({ url, method: "GET", headers, throw: false });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}
async function probeAnthropic(apiKey) {
  try {
    const res = await (0, import_obsidian7.requestUrl)({
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
var import_obsidian8 = require("obsidian");
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
    // `activeWindow.setTimeout` returns DOM-typed `number` (not Node's
    // `Timeout`), so the map values must be number to satisfy strict mode.
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
  /**
   * Cheap (in-memory) walk over the vault + index that returns counts of
   * files changed/added/deleted since the last sync. Drives the SyncModal
   * picker stat row — *no* file content is hashed; we use Obsidian's
   * mtime/size to spot likely changes. Exact result requires a full sync.
   */
  async getChangesSinceLastSync() {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const eligible = all.filter((f) => !this.isExcluded(f.path));
    const known = this.index.files;
    const seen = /* @__PURE__ */ new Set();
    let changed = 0;
    let added = 0;
    let lastSyncedAt = null;
    for (const f of eligible) {
      seen.add(f.path);
      const state = known[f.path];
      if (!state) {
        added++;
        continue;
      }
      if (f.stat.mtime > state.hashedAt) {
        changed++;
      }
      if (state.hashedAt && (!lastSyncedAt || state.hashedAt > lastSyncedAt)) {
        lastSyncedAt = state.hashedAt;
      }
    }
    let deleted = 0;
    for (const path of Object.keys(known)) {
      if (!seen.has(path)) deleted++;
    }
    return { changed, added, deleted, total: eligible.length, lastSyncedAt };
  }
  // ---------- Path filtering ------------------------------------------
  isExcluded(path) {
    const cortexOutputFolders = [
      this.settings.chatExportFolder,
      this.settings.memoryFolder,
      this.settings.graphPullFolder
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
    const syncJobId = crypto.randomUUID();
    if (signal && !signal.aborted) {
      const onAbort = () => {
        this.client.cancelSyncJob(syncJobId).catch(
          (e) => console.warn("[Cortex] cancelSyncJob failed (non-fatal):", e)
        );
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
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
            false,
            {
              fastMode: opts?.fastMode === true,
              syncJobId
            }
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
      return { synced, skipped, deleted: 0, failed, failedPaths, paused: "cancelled", syncJobId };
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
    return { synced, skipped, deleted, failed, failedPaths, syncJobId };
  }
  // ---------- Single-file sync ----------------------------------------
  /**
   * Per-file event handler with debouncing. Triggered from main.ts.
   */
  scheduleFileSync(file) {
    if (!(file instanceof import_obsidian8.TFile) || file.extension !== "md") return;
    if (this.isExcluded(file.path)) return;
    const existing = this.debounceTimers.get(file.path);
    if (existing) activeWindow.clearTimeout(existing);
    const timer = activeWindow.setTimeout(() => {
      this.debounceTimers.delete(file.path);
      void (async () => {
        try {
          await this.syncFile(file);
        } catch (e) {
          console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
        }
      })();
    }, this.settings.autoSyncDebounceMs);
    this.debounceTimers.set(file.path, timer);
  }
  /**
   * Compute a four-bucket diff between this vault and the names of Note
   * entities the cortex graph has materialized. Caller fetches the graph
   * names via the cortex client (paginated `exportGraphPage`); this method
   * does the local walk + set algebra, leaving HTTP and rendering to the
   * caller.
   *
   *   vaultOnly  — markdown files in the vault not represented in the graph
   *   graphOnly  — Note entity names in the graph with no local file
   *   drifted    — present in both, but the local file's mtime is newer
   *                than the last-synced timestamp (likely needs re-sync)
   *   inSync     — present in both, mtime ≤ last hashedAt
   *
   * Match key is the file basename (without `.md`), which is what graph-pull
   * uses for `noteName` on Note entities.
   */
  async computeVaultGraphDiff(graphNoteNames) {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const eligible = all.filter((f) => !this.isExcluded(f.path));
    const vaultOnly = [];
    const drifted = [];
    const inSync = [];
    const matchedGraphNames = /* @__PURE__ */ new Set();
    for (const f of eligible) {
      if (graphNoteNames.has(f.basename)) {
        matchedGraphNames.add(f.basename);
        const state = this.index.files[f.path];
        if (!state) {
          drifted.push(f);
          continue;
        }
        if (f.stat.mtime > state.hashedAt) drifted.push(f);
        else inSync.push(f);
      } else {
        vaultOnly.push(f);
      }
    }
    const graphOnly = [];
    for (const name of graphNoteNames) {
      if (!matchedGraphNames.has(name)) graphOnly.push(name);
    }
    return { vaultOnly, graphOnly, drifted, inSync };
  }
  /**
   * Public single-file sync — for the "Sync current note" command. Bypasses
   * the auto-sync debouncer so the user gets an immediate push. Returns the
   * usual three-way result so the caller can show a Notice based on outcome.
   */
  async syncOneFile(file, opts = {}) {
    return this.syncFile(file, true, opts);
  }
  /**
   * Returns 'synced' | 'unchanged' | 'skipped'. If `persistImmediately` is
   * false, the caller is responsible for calling saveIndex().
   */
  async syncFile(file, persistImmediately = true, opts = {}) {
    await this.loadIndex();
    const content = await this.app.vault.cachedRead(file);
    const body = stripFrontmatter(content).trim();
    if (body.length === 0) return "skipped";
    const hash = await this.hashContent(content);
    const prior = this.getFileState(file.path);
    if (prior && prior.hash === hash) return "unchanged";
    await this.client.ingestNote(file.path, content, {
      fastMode: opts.fastMode === true,
      syncJobId: opts.syncJobId
    });
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
        await this.syncAttachmentsFor(file, content, opts.syncJobId);
      } catch (e) {
        console.warn("[Cortex] attachment sync failed", e);
      }
    }
    if (persistImmediately) await this.saveIndex();
    return "synced";
  }
  async handleDelete(file) {
    if (!(file instanceof import_obsidian8.TFile) || file.extension !== "md") return;
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
    if (!(file instanceof import_obsidian8.TFile) || file.extension !== "md") return;
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
  async syncAttachmentsFor(noteFile, content, syncJobId) {
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
        await this.client.ingestBinary(target.path, mime, base64, { syncJobId });
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
    if (meta instanceof import_obsidian8.TFile) return meta;
    const abs = this.app.vault.getAbstractFileByPath(ref);
    if (abs instanceof import_obsidian8.TFile) return abs;
    const sib = this.app.vault.getAbstractFileByPath(
      (0, import_obsidian8.normalizePath)(`${sourceFile.parent?.path ?? ""}/${ref}`)
    );
    return sib instanceof import_obsidian8.TFile ? sib : null;
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
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    hashes: r.hashes ?? {},
    files: r.files ?? {},
    attachments: r.attachments ?? {},
    vaultId: r.vaultId ?? vaultId,
    lastFullSyncAt: r.lastFullSyncAt
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

// src/main.ts
init_conversation_store();

// src/views/related-view.ts
var import_obsidian9 = require("obsidian");
var RELATED_VIEW_TYPE = "cortex-related-view";
var RelatedView = class extends import_obsidian9.ItemView {
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
    this.listEl = container.createDiv({ cls: "cortex-related-list" });
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refresh())
    );
    await this.refresh();
  }
  async refresh() {
    if (!this.listEl) return;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian9.MarkdownView);
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
    const row = this.listEl.createDiv({ cls: "cortex-related-row" });
    const header = row.createDiv({ cls: "cortex-related-header" });
    const link = header.createEl("a", {
      text: r.noteName,
      cls: `cortex-related-link cortex-source-${r.source}`
    });
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const target = this.app.metadataCache.getFirstLinkpathDest(r.noteName, "");
      if (target) void this.app.workspace.getLeaf(false).openFile(target);
    });
    const sourceBadge = header.createSpan({
      text: r.source,
      cls: `cortex-related-badge cortex-source-${r.source}`
    });
    sourceBadge.setAttr("title", `Match source: ${r.source}`);
    const score = header.createSpan({ text: r.score.toFixed(2), cls: "cortex-related-score" });
    score.setAttr("title", "Relevance score");
    if (r.snippet) row.createEl("p", { text: r.snippet, cls: "cortex-snippet" });
    if (r.entityId) {
      const whyBtn = row.createEl("button", { cls: "cortex-why-btn" });
      const icon = whyBtn.createSpan({ cls: "cortex-why-icon" });
      (0, import_obsidian9.setIcon)(icon, "route");
      whyBtn.createSpan({ text: "Why are these related?" });
      const pathEl = row.createDiv({ cls: "cortex-paths", attr: { "aria-hidden": "true" } });
      pathEl.addClass("is-hidden");
      whyBtn.addEventListener("click", () => {
        void this.togglePath(r, whyBtn, pathEl);
      });
    }
  }
  async togglePath(r, btn, pathEl) {
    const isOpen = !pathEl.classList.contains("is-hidden");
    if (isOpen) {
      pathEl.addClass("is-hidden");
      pathEl.setAttr("aria-hidden", "true");
      return;
    }
    pathEl.removeClass("is-hidden");
    pathEl.setAttr("aria-hidden", "false");
    if (pathEl.dataset.loaded === "1") return;
    pathEl.empty();
    pathEl.createSpan({ text: "Tracing graph paths\u2026", cls: "cortex-loading" });
    try {
      const sourceId = await this.resolveSelfEntityId();
      if (!sourceId || !r.entityId) {
        pathEl.empty();
        pathEl.createSpan({ text: "Cannot resolve graph anchor for this note.", cls: "cortex-error" });
        return;
      }
      const paths = await this.client.findPaths(sourceId, r.entityId, 4);
      pathEl.empty();
      if (paths.length === 0) {
        pathEl.createSpan({ text: "No direct path found in the graph.", cls: "cortex-empty-state" });
      } else {
        for (const p of paths.slice(0, 3)) this.renderPath(pathEl, p);
      }
      pathEl.dataset.loaded = "1";
      btn.addClass("is-open");
    } catch (e) {
      pathEl.empty();
      pathEl.createSpan({ text: `Error: ${e.message}`, cls: "cortex-error" });
    }
  }
  renderPath(parent, path) {
    const wrap = parent.createDiv({ cls: "cortex-path" });
    if (path.steps.length === 0) {
      wrap.createSpan({ text: "Direct match.", cls: "cortex-empty-state" });
      return;
    }
    wrap.createSpan({ text: path.steps[0].fromName, cls: "cortex-path-node" });
    for (const s of path.steps) {
      wrap.createSpan({ text: ` \u2014${humanRel(s.relType)}\u2192 `, cls: "cortex-path-rel" });
      wrap.createSpan({ text: s.toName, cls: "cortex-path-node" });
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

// src/views/chat-view.ts
var import_obsidian12 = require("obsidian");
init_chat_panel();
var CHAT_VIEW_TYPE = "cortex-chat-view";
var ChatView = class extends import_obsidian12.ItemView {
  constructor(leaf, client, store, settings, plugin) {
    super(leaf);
    this.client = client;
    this.store = store;
    this.settings = settings;
    this.plugin = plugin;
    this.panel = null;
  }
  getViewType() {
    return CHAT_VIEW_TYPE;
  }
  getDisplayText() {
    return "HangarX: Ask your vault";
  }
  getIcon() {
    return "message-circle";
  }
  // Obsidian's View.onOpen / onClose accept either sync or Promise
  // returns; nothing here awaits, so we drop `async` to satisfy
  // @typescript-eslint/require-await and return resolved Promises so
  // the override-signature stays Promise<void>.
  onOpen() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cortex-chat-view");
    this.titleHostEl = root.createDiv({ cls: "cortex-chat-view-title" });
    const body = root.createDiv({ cls: "cortex-chat-view-body" });
    this.panel = new ChatPanel(this.app, this.client, this.store, this.settings, {
      titleEl: this.titleHostEl,
      contentEl: body,
      parentEl: root,
      onNavigate: () => {
      },
      saveSettings: () => this.plugin.saveSettings()
    });
    this.panel.mount();
    return Promise.resolve();
  }
  onClose() {
    this.panel?.dispose();
    this.panel = null;
    return Promise.resolve();
  }
  /** Programmatic prefill — used by Memory Stats drill-in actions. */
  prefill(text) {
    this.panel?.prefill(text);
  }
};

// src/views/chat-modal.ts
var import_obsidian13 = require("obsidian");
init_chat_panel();
var ChatModal = class extends import_obsidian13.Modal {
  constructor(app, client, store, settings, plugin) {
    super(app);
    this.client = client;
    this.store = store;
    this.settings = settings;
    this.plugin = plugin;
    this.panel = null;
  }
  onOpen() {
    this.modalEl.addClass("cortex-chat-modal");
    this.panel = new ChatPanel(this.app, this.client, this.store, this.settings, {
      titleEl: this.titleEl,
      contentEl: this.contentEl,
      parentEl: this.contentEl,
      onNavigate: () => this.close(),
      saveSettings: () => this.plugin.saveSettings()
    });
    this.panel.mount();
  }
  onClose() {
    this.panel?.dispose();
    this.panel = null;
  }
};

// src/views/graph-stats-modal.ts
var import_obsidian14 = require("obsidian");
init_error_format();
var FILE_STRUCTURE_TYPES = /* @__PURE__ */ new Set(["Note", "NoteSection", "Document", "Chunk", "File"]);
var TOP_N_VISIBLE = 5;
var GraphStatsModal = class extends import_obsidian14.Modal {
  constructor(app, client, plugin) {
    super(app);
    this.client = client;
    this.plugin = plugin;
    this.statusPillEl = null;
    this.statusPollTimer = null;
  }
  async onOpen() {
    this.titleEl.setText("HangarX: Knowledge graph stats");
    this.contentEl.empty();
    this.contentEl.addClass("cortex-graph-stats");
    this.renderModePillBar(this.contentEl);
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
  onClose() {
    if (this.statusPollTimer != null) {
      window.clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }
  render(stats, ragStats, elapsedMs) {
    const c = this.contentEl;
    const summary = c.createDiv({ cls: "cortex-graph-stats-summary" });
    this.renderHeroCard(summary, "Entities", formatNumber(stats.totalEntities));
    this.renderHeroCard(summary, "Relationships", formatNumber(stats.totalRelationships));
    const ratio = stats.totalEntities > 0 ? stats.totalRelationships / stats.totalEntities : 0;
    const ratioCard = summary.createDiv({ cls: "cortex-graph-stats-card cortex-graph-stats-card-ratio" });
    ratioCard.createDiv({ cls: "cortex-graph-stats-card-value", text: ratio.toFixed(2) });
    ratioCard.createDiv({ cls: "cortex-graph-stats-card-label", text: "Relationships per entity" });
    const ratioHint = ratioCard.createDiv({ cls: "cortex-graph-stats-card-hint" });
    if (ratio < 1.2) {
      ratioCard.addClass("is-warn");
      ratioHint.textContent = "Sparse \u2014 graph is mostly file structure";
    } else if (ratio < 2.5) {
      ratioHint.textContent = "Moderate connectivity";
    } else {
      ratioCard.addClass("is-good");
      ratioHint.textContent = "Richly connected";
    }
    if (stats.totalEntities === 0) {
      const hint = c.createDiv({ cls: "cortex-graph-stats-hint" });
      hint.createEl("p", {
        text: 'The graph is empty. Run "hangarx: Sync vault to knowledge graph" from the command palette and check the devtools console for any ingest errors.'
      });
      this.renderFooter(c, stats, ragStats, elapsedMs);
      return;
    }
    const insights = computeInsights(stats, ragStats);
    if (insights.length > 0) {
      const wrap = c.createDiv({ cls: "cortex-graph-stats-insights" });
      wrap.createEl("h4", { text: "Heads up" });
      const list = wrap.createEl("ul");
      for (const i of insights) {
        const li = list.createEl("li");
        li.addClass(`is-${i.severity}`);
        li.createSpan({ cls: "cortex-graph-stats-insight-icon", text: i.severity === "warn" ? "\u26A0" : "\u24D8" });
        const body = li.createDiv({ cls: "cortex-graph-stats-insight-body" });
        body.createDiv({ cls: "cortex-graph-stats-insight-headline", text: i.headline });
        body.createDiv({ cls: "cortex-graph-stats-insight-detail", text: i.detail });
      }
    }
    if (stats.entityTypes.length > 0) {
      const sorted = stats.entityTypes.slice().sort((a, b) => b.count - a.count);
      const max = sorted[0].count || 1;
      const total = stats.totalEntities || 1;
      const section = c.createDiv({ cls: "cortex-graph-stats-section" });
      const headerRow = section.createDiv({ cls: "cortex-graph-stats-section-header" });
      headerRow.createEl("h4", { text: "What's in your graph" });
      headerRow.createSpan({
        cls: "cortex-graph-stats-section-caption",
        text: `${sorted.length} ${sorted.length === 1 ? "type" : "types"}`
      });
      const bars = section.createDiv({ cls: "cortex-graph-stats-bars" });
      const visible = sorted.slice(0, TOP_N_VISIBLE);
      const hidden = sorted.slice(TOP_N_VISIBLE);
      for (const et of visible) {
        this.renderBarRow(bars, et.type, et.count, max, total, () => {
          void this.plugin?.askInChat(
            `Show me a few example ${et.type} entities from my notes and what they're connected to.`
          );
          this.close();
        });
      }
      if (hidden.length > 0) {
        const more = section.createEl("details", { cls: "cortex-graph-stats-more" });
        more.createEl("summary", { text: `Show ${hidden.length} more` });
        const moreBars = more.createDiv({ cls: "cortex-graph-stats-bars" });
        for (const et of hidden) {
          this.renderBarRow(moreBars, et.type, et.count, max, total, () => {
            void this.plugin?.askInChat(
              `Show me a few example ${et.type} entities from my notes and what they're connected to.`
            );
            this.close();
          });
        }
      }
    }
    if (stats.relationshipTypes.length > 0) {
      const sorted = stats.relationshipTypes.slice().sort((a, b) => b.count - a.count);
      const max = sorted[0].count || 1;
      const total = stats.totalRelationships || 1;
      const section = c.createDiv({ cls: "cortex-graph-stats-section" });
      const headerRow = section.createDiv({ cls: "cortex-graph-stats-section-header" });
      headerRow.createEl("h4", { text: "How things connect" });
      headerRow.createSpan({
        cls: "cortex-graph-stats-section-caption",
        text: `${sorted.length} ${sorted.length === 1 ? "type" : "types"}`
      });
      const bars = section.createDiv({ cls: "cortex-graph-stats-bars" });
      const visible = sorted.slice(0, TOP_N_VISIBLE);
      const hidden = sorted.slice(TOP_N_VISIBLE);
      for (const rt of visible) {
        this.renderBarRow(bars, rt.type, rt.count, max, total, () => {
          void this.plugin?.askInChat(
            `Show me a few examples of ${rt.type} relationships in my notes \u2014 what's connected to what?`
          );
          this.close();
        });
      }
      if (hidden.length > 0) {
        const more = section.createEl("details", { cls: "cortex-graph-stats-more" });
        more.createEl("summary", { text: `Show ${hidden.length} more` });
        const moreBars = more.createDiv({ cls: "cortex-graph-stats-bars" });
        for (const rt of hidden) {
          this.renderBarRow(moreBars, rt.type, rt.count, max, total, () => {
            void this.plugin?.askInChat(
              `Show me a few examples of ${rt.type} relationships in my notes \u2014 what's connected to what?`
            );
            this.close();
          });
        }
      }
    }
    this.renderCommunities(c);
    this.renderTechnicalDetails(c, stats, ragStats);
    this.renderFooter(c, stats, ragStats, elapsedMs);
  }
  /**
   * Communities panel. Local single-user stacks ship with auto-detection
   * disabled because Louvain on every ingest is expensive — instead, this
   * is the on-demand surface: click "Detect now", server runs Louvain +
   * LLM summaries, list refreshes with hierarchy + member counts.
   *
   * Cloud installs that already auto-detect see the same list with no
   * extra clicks needed. Either way, "Detect now" is idempotent — re-run
   * any time the graph has shifted enough to warrant new clustering.
   */
  renderCommunities(parent) {
    const wrap = parent.createDiv({ cls: "cortex-graph-stats-communities" });
    const header = wrap.createDiv({ cls: "cortex-graph-stats-communities-header" });
    header.createEl("h4", { text: "Communities" });
    const detectBtn = header.createEl("button", {
      cls: "cortex-graph-stats-detect-btn",
      text: "Detect now"
    });
    const desc = wrap.createEl("p", { cls: "setting-item-description" });
    desc.setText(
      'Topic clusters group densely-connected notes, with an LLM-generated summary per group. Useful for "what topics dominate my vault?" and as retrieval seeds during chat.'
    );
    const listEl = wrap.createDiv({ cls: "cortex-graph-stats-communities-list" });
    listEl.createEl("p", { cls: "cortex-graph-stats-loading", text: "Loading\u2026" });
    const renderList = (communities) => {
      listEl.empty();
      const meaningful = communities.filter((c) => (c.memberCount ?? 0) > 0);
      if (meaningful.length === 0) {
        const empty = listEl.createDiv({ cls: "cortex-graph-stats-empty-card" });
        empty.createDiv({
          cls: "cortex-graph-stats-empty-title",
          text: "No topic clusters detected yet"
        });
        empty.createDiv({
          cls: "cortex-graph-stats-empty-body",
          text: communities.length > 0 ? "Detection ran but every cluster came back empty. The graph likely has too few entities to form meaningful groups \u2014 re-run after more notes have been ingested." : 'Click "Detect now" to run clustering on your current knowledge graph. Detection works best after at least 50 entities have been extracted.'
        });
        return;
      }
      const sorted = [...meaningful].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
      for (const c of sorted.slice(0, 20)) {
        const row = listEl.createDiv({ cls: "cortex-graph-stats-community-row" });
        const head = row.createDiv({ cls: "cortex-graph-stats-community-head" });
        const rawMemberNames = c.memberNames;
        const memberHints = parseStringList(rawMemberNames ?? null);
        const fallbackName = memberHints.length > 0 ? `${memberHints.slice(0, 3).join(", ")}${memberHints.length > 3 ? ` + ${memberHints.length - 3} more` : ""}` : `Cluster of ${c.memberCount ?? 0} entities`;
        head.createEl("strong", { text: c.name || fallbackName });
        const meta = head.createSpan({ cls: "cortex-graph-stats-community-meta" });
        const parts = [];
        if (typeof c.memberCount === "number") parts.push(`${c.memberCount} members`);
        if (typeof c.level === "number" && c.level > 0) parts.push(`sub-group \xB7 level ${c.level}`);
        if (typeof c.density === "number" && c.density > 0) parts.push(`density ${c.density.toFixed(2)}`);
        meta.setText(parts.join(" \xB7 "));
        if (c.summary && c.summary.trim().length > 0) {
          row.createEl("p", { cls: "cortex-graph-stats-community-summary", text: c.summary });
        }
        const keywords = parseStringList(c.keywords);
        if (keywords.length > 0) {
          const kwRow = row.createDiv({ cls: "cortex-graph-stats-community-keywords" });
          for (const kw of keywords.slice(0, 8)) {
            kwRow.createSpan({ cls: "cortex-graph-stats-community-chip", text: kw });
          }
        }
      }
      if (sorted.length > 20) {
        listEl.createEl("p", {
          cls: "cortex-graph-stats-empty",
          text: `+${sorted.length - 20} more not shown.`
        });
      }
    };
    const loadList = async () => {
      try {
        const communities = await this.client.listCommunities({ limit: 100 });
        renderList(communities);
      } catch (e) {
        listEl.empty();
        const err = listEl.createEl("p", { cls: "cortex-graph-stats-error" });
        err.setText(`Couldn't load communities: ${e.message.slice(0, 200)}`);
      }
    };
    detectBtn.addEventListener("click", () => {
      void (async () => {
        detectBtn.setAttr("disabled", "true");
        detectBtn.setText("Detecting\u2026");
        listEl.empty();
        listEl.createEl("p", {
          cls: "cortex-graph-stats-loading",
          text: "Running louvain + writing LLM summaries \u2014 can take 30\u201390s on large graphs\u2026"
        });
        try {
          const res = await this.client.detectCommunities({ algorithm: "louvain" });
          new import_obsidian14.Notice(
            `Detected ${res.communitiesCreated} communities (${res.levels} levels, modularity ${res.modularity.toFixed(2)})`,
            5e3
          );
          await loadList();
        } catch (e) {
          listEl.empty();
          const err = listEl.createEl("p", { cls: "cortex-graph-stats-error" });
          err.setText(`Detection failed: ${e.message.slice(0, 200)}`);
        } finally {
          detectBtn.removeAttribute("disabled");
          detectBtn.setText("Detect now");
        }
      })();
    });
    void loadList();
  }
  /** One horizontal bar row: name on the left, bar in the middle (sized by
   *  count/max), count + percent on the right. The whole row is clickable. */
  renderBarRow(parent, label, count, max, total, onClick) {
    const row = parent.createDiv({ cls: "cortex-graph-stats-bar-row" });
    if (onClick) {
      row.addClass("is-clickable");
      row.setAttr("tabindex", "0");
      row.setAttr("role", "button");
      row.setAttr("aria-label", `${label} \u2014 ${count.toLocaleString()} (click to ask the chat about it)`);
      row.addEventListener("click", onClick);
      row.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          onClick();
        }
      });
    }
    row.createSpan({ cls: "cortex-graph-stats-bar-label", text: label });
    const track = row.createDiv({ cls: "cortex-graph-stats-bar-track" });
    const fill = track.createDiv({ cls: "cortex-graph-stats-bar-fill cortex-progress-bar-fill" });
    const widthPct = max > 0 ? Math.max(2, Math.round(count / max * 100)) : 0;
    fill.setCssProps({ "--cortex-progress-pct": `${widthPct}%` });
    const right = row.createDiv({ cls: "cortex-graph-stats-bar-meta" });
    right.createSpan({ cls: "cortex-graph-stats-bar-count", text: formatNumber(count) });
    const percent = total > 0 ? count / total * 100 : 0;
    right.createSpan({
      cls: "cortex-graph-stats-bar-percent",
      text: percent < 0.5 ? "<1%" : `${percent.toFixed(0)}%`
    });
  }
  /** Collapsed `<details>` block — sample properties, GraphRAG config (as
   *  toggle chips, not raw JSON), search provider availability. The Save-as-
   *  note flow still includes everything in the markdown report. */
  renderTechnicalDetails(parent, stats, ragStats) {
    const wrap = parent.createEl("details", { cls: "cortex-graph-stats-tech" });
    wrap.createEl("summary", { text: "Show technical details" });
    const body = wrap.createDiv();
    if (stats.entityTypes.length > 0) {
      body.createEl("h5", { text: "Type-specific properties" });
      const table = body.createEl("table", { cls: "cortex-graph-stats-table" });
      const head = table.createEl("thead").createEl("tr");
      head.createEl("th", { text: "Type" });
      head.createEl("th", { text: "Distinguishing properties" });
      const tb = table.createEl("tbody");
      for (const et of stats.entityTypes.slice().sort((a, b) => b.count - a.count)) {
        const distinguishing = (et.sampleProperties ?? []).filter((p) => !isSystemProperty(p));
        const tr = tb.createEl("tr");
        tr.createEl("td", { text: et.type });
        tr.createEl("td", {
          cls: "cortex-graph-stats-props",
          text: distinguishing.length > 0 ? distinguishing.slice(0, 8).join(", ") : "\u2014 (only pipeline metadata)"
        });
      }
    }
    if (ragStats) {
      const flat = flattenRagStats(ragStats);
      const numbers = [];
      const strings = [];
      for (const [k, v] of Object.entries(flat)) {
        if (typeof v === "number") numbers.push([k, v]);
        else if (typeof v === "string") strings.push([k, v]);
      }
      if (numbers.length > 0 || strings.length > 0) {
        body.createEl("h5", { text: "Graphrag orchestrator" });
      }
      if (strings.length > 0) {
        body.createDiv({ cls: "cortex-graph-stats-tech-sublabel", text: "Models / providers" });
        const dl = body.createEl("dl", { cls: "cortex-graph-stats-dl" });
        for (const [k, v] of strings) {
          dl.createEl("dt", { text: humanizeKey(k) });
          dl.createEl("dd", { text: v });
        }
      }
      if (numbers.length > 0) {
        body.createDiv({ cls: "cortex-graph-stats-tech-sublabel", text: "Thresholds & metrics" });
        const dl = body.createEl("dl", { cls: "cortex-graph-stats-dl" });
        for (const [k, v] of numbers) {
          dl.createEl("dt", { text: humanizeKey(k) });
          dl.createEl("dd", { text: formatValue(v) });
        }
      }
    }
  }
  renderFooter(parent, stats, ragStats, elapsedMs) {
    const footer = parent.createDiv({ cls: "cortex-graph-stats-footer" });
    footer.createSpan({
      cls: "cortex-graph-stats-elapsed",
      text: `Fetched in ${elapsedMs}ms`
    });
    const refreshBtn = footer.createEl("button", { text: "Refresh" });
    refreshBtn.addEventListener("click", () => {
      void (async () => {
        this.contentEl.empty();
        await this.onOpen();
      })();
    });
    const copyBtn = footer.createEl("button", { text: "Copy as Markdown" });
    copyBtn.addEventListener("click", () => {
      void (async () => {
        const md = renderAsMarkdown(stats, ragStats);
        await navigator.clipboard.writeText(md);
        copyBtn.setText("Copied");
        activeWindow.setTimeout(() => copyBtn.setText("Copy as Markdown"), 1400);
      })();
    });
    const noteBtn = footer.createEl("button", { text: "Save as note", cls: "mod-cta" });
    noteBtn.addEventListener("click", () => {
      void (async () => {
        const md = renderAsMarkdown(stats, ragStats);
        const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:]/g, "-").slice(0, 19);
        const path = `Cortex/Debug/Graph stats - ${stamp}.md`;
        try {
          const dir = path.split("/").slice(0, -1).join("/");
          if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
            await this.app.vault.createFolder(dir).catch(() => void 0);
          }
          const file = await this.app.vault.create(path, md);
          await this.app.workspace.getLeaf(false).openFile(file);
          this.close();
        } catch (e) {
          new import_obsidian14.Notice(`Couldn't save note: ${e.message}`);
        }
      })();
    });
  }
  renderHeroCard(parent, label, value) {
    const card = parent.createDiv({ cls: "cortex-graph-stats-card" });
    card.createDiv({ cls: "cortex-graph-stats-card-value", text: value });
    card.createDiv({ cls: "cortex-graph-stats-card-label", text: label });
  }
  /** Render the connection-mode pill at the top — same shape as the chat
   *  panel's pill but standalone (modal doesn't share layout). Click to
   *  re-probe; auto-polls every 30s while the modal is open. */
  renderModePillBar(parent) {
    if (!this.plugin) return;
    const bar = parent.createDiv({ cls: "cortex-graph-stats-mode-bar" });
    this.statusPillEl = bar.createSpan({ cls: "cortex-chat-mode-pill" });
    this.renderModePill("checking");
    void this.runModeProbe();
  }
  renderModePill(state) {
    if (!this.statusPillEl || !this.plugin) return;
    const s = this.plugin.settings;
    this.statusPillEl.empty();
    this.statusPillEl.removeClass("is-checking", "is-connected", "is-offline");
    this.statusPillEl.addClass(`is-${state}`);
    const mode = s.connectionMode === "local" ? "Local" : "Cloud";
    const host = (() => {
      try {
        return new URL(s.apiUrl).host;
      } catch {
        return s.apiUrl;
      }
    })();
    this.statusPillEl.createSpan({ cls: "cortex-chat-mode-dot" });
    if (state === "checking") {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 checking\u2026` });
      this.statusPillEl.setAttr("title", `${mode} mode (${host}) \u2014 checking\u2026`);
    } else if (state === "connected") {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 ${host}` });
      this.statusPillEl.setAttr("title", `Connected to ${host}. Click to recheck.`);
    } else {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 offline` });
      this.statusPillEl.setAttr("title", `Cannot reach ${host}. Click to retry.`);
    }
    this.statusPillEl.onclick = () => {
      void this.runModeProbe();
    };
  }
  async runModeProbe() {
    if (!this.statusPillEl || !this.plugin) return;
    this.renderModePill("checking");
    const ok = await this.probeHealth();
    this.renderModePill(ok ? "connected" : "offline");
    if (this.statusPollTimer == null) {
      this.statusPollTimer = window.setInterval(() => {
        void this.runModeProbe();
      }, 3e4);
    }
  }
  async probeHealth() {
    if (!this.plugin) return false;
    const cleanUrl = (this.plugin.settings.apiUrl || "").replace(/\/$/, "");
    if (!cleanUrl) return false;
    try {
      const res = await (0, import_obsidian14.requestUrl)({ url: `${cleanUrl}/health`, method: "GET", throw: false });
      return res.status >= 200 && (res.status < 400 || res.status === 503);
    } catch {
      return false;
    }
  }
  renderError(err) {
    const fmt = formatError(err, "Couldn't load graph stats");
    const card = this.contentEl.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createDiv({ cls: "cortex-error-head" });
    const ic = head.createSpan({ cls: "cortex-error-icon" });
    (0, import_obsidian14.setIcon)(ic, errorIcon(fmt.kind));
    head.createSpan({ cls: "cortex-error-headline", text: fmt.headline });
    if (fmt.hint) card.createDiv({ cls: "cortex-error-hint", text: fmt.hint });
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const actions = card.createDiv({ cls: "cortex-error-actions" });
    if (this.plugin && fmt.kind === "auth") {
      const openSettings = actions.createEl("button", { text: "Open settings" });
      openSettings.addEventListener("click", () => {
        this.close();
        const setting = this.app.setting;
        setting.open();
        setting.openTabById(this.plugin.manifest.id);
      });
    }
    const retry = actions.createEl("button", { text: "Retry", cls: "mod-cta" });
    retry.addEventListener("click", () => {
      void (async () => {
        this.contentEl.empty();
        await this.onOpen();
      })();
    });
  }
};
function computeInsights(stats, ragStats) {
  const out = [];
  const structuredCount = stats.entityTypes.filter((et) => !FILE_STRUCTURE_TYPES.has(et.type)).reduce((sum, et) => sum + et.count, 0);
  const totalEntities = stats.totalEntities;
  if (totalEntities > 100 && structuredCount / totalEntities < 0.05) {
    out.push({
      severity: "warn",
      headline: "Most of your graph is file structure, not concepts",
      detail: `Only ${structuredCount} of ${totalEntities.toLocaleString()} entities are conceptual (Person/Concept/Tag/etc). Run "Force re-ingest" with a stronger LLM to extract more meaningful entities.`
    });
  }
  const totalRel = stats.totalRelationships;
  const wikilink = stats.relationshipTypes.find((rt) => rt.type === "WIKILINK");
  if (totalRel > 100 && wikilink && wikilink.count / totalRel > 0.7) {
    out.push({
      severity: "info",
      headline: "WIKILINK dominates your connections",
      detail: `${Math.round(wikilink.count / totalRel * 100)}% of relationships are wikilinks (file-to-file). The LLM hasn't extracted many semantic relationships \u2014 Force re-ingest may help if you want richer "X relates to Y" queries.`
    });
  }
  const totalQueries = ragStats?.totalQueries ?? 0;
  const cacheHitRate = ragStats?.cacheHitRate ?? -1;
  if (totalQueries >= 50 && cacheHitRate >= 0 && cacheHitRate < 0.1) {
    out.push({
      severity: "info",
      headline: "Query cache rarely hits",
      detail: `Cache hit rate is ${(cacheHitRate * 100).toFixed(1)}% across ${totalQueries.toLocaleString()} queries. Enable or tune the semantic cache for repeat-query speedups.`
    });
  }
  return out;
}
function flattenRagStats(stats) {
  const out = {};
  for (const [k, v] of Object.entries(stats)) {
    if (v == null) continue;
    if (typeof v === "boolean" || typeof v === "number" || typeof v === "string") {
      out[k] = v;
    } else if (typeof v === "object") {
      for (const [k2, v2] of Object.entries(v)) {
        if (typeof v2 === "boolean" || typeof v2 === "number" || typeof v2 === "string") {
          out[k2] = v2;
        }
      }
    }
  }
  return out;
}
var SYSTEM_PROPS = /* @__PURE__ */ new Set([
  "sourceSystem",
  "sourceId",
  "eventTime",
  "ingestTime",
  "temporalSource",
  "temporalConfidence",
  "version",
  "_uploadedAt",
  "createdAt",
  "updatedAt",
  "workspaceId",
  "organizationId",
  "id",
  "embedding",
  "syncJobId"
]);
function isSystemProperty(name) {
  return SYSTEM_PROPS.has(name) || name.startsWith("_");
}
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
  const ratio = stats.totalEntities > 0 ? stats.totalRelationships / stats.totalEntities : 0;
  lines.push(`- **Relationships per entity:** ${ratio.toFixed(2)}`);
  lines.push(`- **Entity types:** ${stats.entityTypes.length}`);
  lines.push(`- **Relationship types:** ${stats.relationshipTypes.length}`);
  lines.push("");
  const insights = computeInsights(stats, ragStats);
  if (insights.length > 0) {
    lines.push(`## Heads up`);
    lines.push("");
    for (const i of insights) {
      lines.push(`- **${i.headline}** \u2014 ${i.detail}`);
    }
    lines.push("");
  }
  if (stats.entityTypes.length > 0) {
    lines.push(`## Entity types`);
    lines.push("");
    lines.push(`| Type | Count | Distinguishing properties |`);
    lines.push(`|---|---:|---|`);
    const sorted = stats.entityTypes.slice().sort((a, b) => b.count - a.count);
    for (const et of sorted) {
      const distinguishing = (et.sampleProperties ?? []).filter((p) => !isSystemProperty(p));
      const props = distinguishing.length > 0 ? distinguishing.slice(0, 8).join(", ") : "\u2014";
      lines.push(`| ${et.type} | ${formatNumber(et.count)} | ${props} |`);
    }
    lines.push("");
  }
  if (stats.relationshipTypes.length > 0) {
    lines.push(`## Relationship types`);
    lines.push("");
    lines.push(`| Type | Count |`);
    lines.push(`|---|---:|`);
    const sorted = stats.relationshipTypes.slice().sort((a, b) => b.count - a.count);
    for (const rt of sorted) {
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
function parseStringList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => typeof s === "string" && s.length > 0);
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((s) => typeof s === "string" && s.length > 0);
    }
  } catch {
  }
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

// src/services/graph-pull.ts
var import_obsidian15 = require("obsidian");
var DEFAULT_SEMANTIC_TYPES = [
  "Concept",
  "Person",
  "Organization",
  "Topic",
  "Location",
  "Event",
  "Product",
  "Technology",
  "Framework",
  "Expert",
  "Document",
  "Brand",
  "Platform",
  "Strategy",
  "Category",
  "Campaign",
  "Patent",
  "Country",
  "Sector",
  "Author"
];
var INDEX_PATH_SUFFIX = "_index.json";
var GraphPull = class {
  constructor(app, client, settings) {
    this.app = app;
    this.client = client;
    this.settings = settings;
    this.index = { hashes: {}, paths: {} };
    this.indexLoaded = false;
  }
  /* ── Index persistence ──────────────────────────────────────────── */
  get indexPath() {
    return (0, import_obsidian15.normalizePath)(`${this.settings.graphPullFolder}/${INDEX_PATH_SUFFIX}`);
  }
  async loadIndex() {
    if (this.indexLoaded) return;
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(this.indexPath)) {
        this.index = JSON.parse(await adapter.read(this.indexPath));
      } else {
        this.index = { hashes: {}, paths: {} };
      }
    } catch {
      this.index = { hashes: {}, paths: {} };
    }
    this.indexLoaded = true;
  }
  async saveIndex() {
    const dir = this.settings.graphPullFolder;
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(dir)) await adapter.mkdir(dir);
    await adapter.write(this.indexPath, JSON.stringify(this.index, null, 2));
  }
  /* ── Hash helper (matches vault-sync.ts) ────────────────────────── */
  async hash(content) {
    const buf = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /* ── Main pull flow ─────────────────────────────────────────────── */
  async pull(onProgress) {
    await this.loadIndex();
    const result = { created: 0, updated: 0, deleted: 0, enriched: 0, errors: [] };
    const typesToPull = this.resolveTypes();
    onProgress?.({ phase: "fetching", message: "Fetching entities from Cortex\u2026", current: 0, total: 0 });
    const { entities, relationships } = await this.fetchAll(typesToPull, onProgress);
    const entityById = /* @__PURE__ */ new Map();
    for (const e of entities) entityById.set(e.id, e);
    const relsByEntity = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      if (!relsByEntity.has(r.from)) relsByEntity.set(r.from, []);
      relsByEntity.get(r.from).push(r);
      if (!relsByEntity.has(r.to)) relsByEntity.set(r.to, []);
      relsByEntity.get(r.to).push(r);
    }
    const seenIds = /* @__PURE__ */ new Set();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      seenIds.add(entity.id);
      if (i % 50 === 0) {
        onProgress?.({
          phase: "writing",
          message: `Writing ${entity.name} (${entity.type})\u2026`,
          current: i,
          total: entities.length
        });
      }
      try {
        const rels = relsByEntity.get(entity.id) ?? [];
        const md = this.entityToMarkdown(entity, rels, entityById);
        const contentHash = await this.hash(md);
        if (this.index.hashes[entity.id] === contentHash) continue;
        const filePath = this.entityFilePath(entity);
        await this.ensureDir(filePath);
        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing && existing instanceof import_obsidian15.TFile) {
          await this.app.vault.modify(existing, md);
          result.updated++;
        } else {
          await this.app.vault.create(filePath, md);
          result.created++;
        }
        this.index.hashes[entity.id] = contentHash;
        this.index.paths[entity.id] = filePath;
      } catch (e) {
        result.errors.push(`${entity.name}: ${e.message}`);
      }
    }
    onProgress?.({ phase: "cleanup", message: "Removing stale entities\u2026", current: 0, total: 0 });
    for (const [id, path] of Object.entries(this.index.paths)) {
      if (seenIds.has(id)) continue;
      try {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) await this.app.fileManager.trashFile(file);
        delete this.index.hashes[id];
        delete this.index.paths[id];
        result.deleted++;
      } catch {
        delete this.index.hashes[id];
        delete this.index.paths[id];
      }
    }
    if (this.settings.graphPullEnrichSourceNotes) {
      onProgress?.({ phase: "enriching", message: "Enriching source notes\u2026", current: 0, total: 0 });
      result.enriched = await this.enrichSourceNotes(entities, relationships, entityById, onProgress);
    }
    this.index.lastPulledAt = Date.now();
    await this.saveIndex();
    onProgress?.({ phase: "done", message: "Done", current: 1, total: 1 });
    return result;
  }
  /* ── Summary (cheap, stats-only) ────────────────────────────────── */
  /**
   * Cheap "tell me what's there" path. Hits /v1/graph/stats (one network
   * round-trip) and compares the per-type entity counts against the size of
   * the local pull index. Doesn't fetch a single entity body — answers in
   * ~50ms even on a 10k-entity graph, vs. ~30s+ for the full preview.
   *
   * Returned counts are estimates: "estNew" assumes any cloud entity not
   * already in our local index is missing locally (ignores rename / id
   * churn), and "estUnchanged" is the local-index intersection. Good enough
   * for the picker so users know whether to bother running the full pull.
   */
  async summary() {
    await this.loadIndex();
    const types = new Set(this.resolveTypes());
    const stats = await this.client.getGraphStats();
    const localByType = /* @__PURE__ */ new Map();
    for (const path of Object.values(this.index.paths)) {
      const m = path.match(/\/([^/]+)\/[^/]+\s\(\1\)\.md$/);
      const t = m?.[1] ?? "Unknown";
      localByType.set(t, (localByType.get(t) ?? 0) + 1);
    }
    const perType = [];
    let cloudTotal = 0;
    let localTotal = 0;
    for (const et of stats.entityTypes ?? []) {
      if (!types.has(et.type)) continue;
      const localCount = localByType.get(et.type) ?? 0;
      const cloudCount = et.count;
      cloudTotal += cloudCount;
      localTotal += localCount;
      perType.push({
        type: et.type,
        cloudCount,
        localCount,
        estNew: Math.max(0, cloudCount - localCount)
      });
    }
    let estStale = 0;
    for (const [t, n] of localByType) {
      const matchesCloud = perType.find((p) => p.type === t)?.cloudCount ?? 0;
      if (n > matchesCloud) estStale += n - matchesCloud;
    }
    return {
      perType: perType.sort((a, b) => b.cloudCount - a.cloudCount),
      cloudTotal,
      localTotal,
      estNew: Math.max(0, cloudTotal - localTotal),
      estUnchanged: Math.min(cloudTotal, localTotal) - estStale,
      estStale
    };
  }
  /* ── Preview (dry run) ──────────────────────────────────────────── */
  async preview(onProgress) {
    await this.loadIndex();
    const typesToPull = this.resolveTypes();
    onProgress?.({ phase: "fetching", message: "Fetching entities\u2026", current: 0, total: 0 });
    const { entities, relationships } = await this.fetchAll(typesToPull, onProgress);
    const entityById = /* @__PURE__ */ new Map();
    for (const e of entities) entityById.set(e.id, e);
    const relsByEntity = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      if (!relsByEntity.has(r.from)) relsByEntity.set(r.from, []);
      relsByEntity.get(r.from).push(r);
      if (!relsByEntity.has(r.to)) relsByEntity.set(r.to, []);
      relsByEntity.get(r.to).push(r);
    }
    const toCreate = [];
    const toUpdate = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const entity of entities) {
      seenIds.add(entity.id);
      const rels = relsByEntity.get(entity.id) ?? [];
      const md = this.entityToMarkdown(entity, rels, entityById);
      const contentHash = await this.hash(md);
      const label = `${entity.name} (${entity.type})`;
      if (!this.index.hashes[entity.id]) {
        toCreate.push(label);
      } else if (this.index.hashes[entity.id] !== contentHash) {
        toUpdate.push(label);
      }
    }
    const toDelete = [];
    for (const [id] of Object.entries(this.index.paths)) {
      if (!seenIds.has(id)) toDelete.push(this.index.paths[id]);
    }
    onProgress?.({ phase: "done", message: "Done", current: 1, total: 1 });
    return { toCreate, toUpdate, toDelete, entityCount: entities.length };
  }
  /* ── Fetch all pages ────────────────────────────────────────────── */
  async fetchAll(entityTypes, onProgress) {
    const allEntities = [];
    const allRelationships = [];
    const batchSize = 500;
    const seenRelKeys = /* @__PURE__ */ new Set();
    for (let t = 0; t < entityTypes.length; t++) {
      const type = entityTypes[t];
      let offset = 0;
      while (true) {
        onProgress?.({
          phase: "fetching",
          message: `Fetching ${type} (${allEntities.length} entities so far)\u2026`,
          current: t,
          total: entityTypes.length
        });
        const page = await this.client.exportGraphPage({
          entityTypes: [type],
          limit: batchSize,
          offset,
          includeRelationships: offset === 0
          // only fetch rels on first page per type
        });
        allEntities.push(...page.entities);
        for (const r of page.relationships) {
          const key = `${r.from}-${r.type}-${r.to}`;
          if (!seenRelKeys.has(key)) {
            seenRelKeys.add(key);
            allRelationships.push(r);
          }
        }
        if (page.entities.length < batchSize) break;
        offset += batchSize;
      }
    }
    return { entities: allEntities, relationships: allRelationships };
  }
  /* ── Type resolution ────────────────────────────────────────────── */
  resolveTypes() {
    if (this.settings.graphPullEntityTypes.length > 0) {
      return this.settings.graphPullEntityTypes;
    }
    return DEFAULT_SEMANTIC_TYPES;
  }
  /* ── Entity → Markdown ──────────────────────────────────────────── */
  entityToMarkdown(entity, relationships, entityById) {
    const lines = [];
    lines.push("---");
    lines.push(`cortex_id: "${entity.id}"`);
    lines.push(`cortex_type: "${entity.type}"`);
    lines.push(`cortex_synced: "${(/* @__PURE__ */ new Date()).toISOString()}"`);
    lines.push("aliases:");
    lines.push(`  - "${this.escapeYaml(entity.name)}"`);
    const relatedNames = this.getRelatedNames(entity, relationships, entityById);
    if (relatedNames.length > 0) {
      lines.push("related:");
      for (const name of relatedNames.slice(0, 20)) {
        lines.push(`  - "[[${this.escapeYaml(name)}]]"`);
      }
    }
    const sourceNotes = this.getSourceNotes(entity, relationships, entityById);
    if (sourceNotes.length > 0) {
      lines.push("mentioned_in:");
      for (const note of sourceNotes) {
        lines.push(`  - "[[${this.escapeYaml(note)}]]"`);
      }
    }
    lines.push("tags:");
    lines.push("  - cortex");
    lines.push(`  - cortex/${entity.type.toLowerCase().replace(/\s+/g, "-")}`);
    lines.push("---");
    lines.push("");
    lines.push(`# ${entity.name}`);
    lines.push("");
    const desc = entity.properties.description;
    if (desc) {
      lines.push(desc);
      lines.push("");
    }
    const grouped = this.groupRelationships(entity, relationships, entityById);
    if (grouped.size > 0) {
      lines.push("## Relationships");
      lines.push("");
      for (const [relType, targets] of grouped) {
        for (const target of targets) {
          lines.push(`- **${this.humanRelType(relType)}** \u2192 [[${target}]]`);
        }
      }
      lines.push("");
    }
    const userProps = this.getUserProperties(entity);
    if (userProps.length > 0) {
      lines.push("## Properties");
      lines.push("");
      for (const [key, value] of userProps) {
        lines.push(`- **${key}**: ${String(value)}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
  /* ── Relationship helpers ───────────────────────────────────────── */
  getRelatedNames(entity, relationships, entityById) {
    const names = /* @__PURE__ */ new Set();
    for (const r of relationships) {
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (other && other.id !== entity.id) {
        names.add(this.entityDisplayName(other));
      }
    }
    return Array.from(names);
  }
  getSourceNotes(entity, relationships, entityById) {
    const notes = [];
    for (const r of relationships) {
      if (r.type !== "MENTIONED_IN" && r.type !== "PART_OF" && r.type !== "DESCRIBED_IN") continue;
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (other && (other.type === "Document" || other.type === "Note")) {
        notes.push(other.name);
      }
    }
    return notes;
  }
  groupRelationships(entity, relationships, entityById) {
    const grouped = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (!other || other.id === entity.id) continue;
      const displayName = this.entityDisplayName(other);
      if (!grouped.has(r.type)) grouped.set(r.type, []);
      const list = grouped.get(r.type);
      if (!list.includes(displayName)) list.push(displayName);
    }
    return grouped;
  }
  /* ── File path helpers ──────────────────────────────────────────── */
  entityFilePath(entity) {
    const safeName = this.sanitizeFilename(entity.name);
    const safeType = this.sanitizeFilename(entity.type);
    return (0, import_obsidian15.normalizePath)(
      `${this.settings.graphPullFolder}/${safeType}/${safeName} (${safeType}).md`
    );
  }
  entityDisplayName(entity) {
    return `${entity.name} (${entity.type})`;
  }
  sanitizeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim().slice(0, 100);
  }
  async ensureDir(filePath) {
    const parts = filePath.split("/");
    parts.pop();
    const dir = parts.join("/");
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(dir)) {
      await adapter.mkdir(dir);
    }
  }
  /* ── Source note enrichment ─────────────────────────────────────── */
  async enrichSourceNotes(_entities, relationships, entityById, onProgress) {
    const noteEntities = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      if (r.type !== "MENTIONED_IN" && r.type !== "PART_OF") continue;
      const entityId = r.from;
      const noteId = r.to;
      const entity = entityById.get(entityId);
      const note = entityById.get(noteId);
      if (!entity || !note) continue;
      if (note.type !== "Document" && note.type !== "Note") continue;
      const filePath = note.properties.filePath ?? note.name;
      if (!noteEntities.has(filePath)) noteEntities.set(filePath, /* @__PURE__ */ new Set());
      noteEntities.get(filePath).add(entity.name);
    }
    let enriched = 0;
    const entries = Array.from(noteEntities.entries());
    for (let i = 0; i < entries.length; i++) {
      const [filePath, entityNames] = entries[i];
      if (i % 20 === 0) {
        onProgress?.({
          phase: "enriching",
          message: `Enriching ${filePath}\u2026`,
          current: i,
          total: entries.length
        });
      }
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof import_obsidian15.TFile)) continue;
      try {
        const content = await this.app.vault.read(file);
        const updated = this.upsertFrontmatter(content, "cortex_entities", Array.from(entityNames).sort());
        if (updated !== content) {
          await this.app.vault.modify(file, updated);
          enriched++;
        }
      } catch {
      }
    }
    return enriched;
  }
  /**
   * Insert or update a single frontmatter key without disturbing the rest
   * of the document. Creates frontmatter if none exists.
   */
  upsertFrontmatter(content, key, values) {
    const yamlValue = values.map((v) => `  - "${this.escapeYaml(v)}"`).join("\n");
    const newBlock = `${key}:
${yamlValue}`;
    if (!content.startsWith("---")) {
      return `---
${newBlock}
---

${content}`;
    }
    const endIdx = content.indexOf("---", 3);
    if (endIdx === -1) return content;
    const fm = content.slice(4, endIdx);
    const after = content.slice(endIdx + 3);
    const keyRegex = new RegExp(`^${key}:.*(?:\\n  - .*)*`, "m");
    if (keyRegex.test(fm)) {
      const updatedFm = fm.replace(keyRegex, newBlock);
      return `---
${updatedFm}---${after}`;
    }
    const trimmedFm = fm.trimEnd();
    return `---
${trimmedFm}
${newBlock}
---${after}`;
  }
  /* ── Formatting helpers ─────────────────────────────────────────── */
  humanRelType(rel) {
    return rel.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }
  escapeYaml(s) {
    return s.replace(/"/g, '\\"');
  }
  getUserProperties(entity) {
    const skip = /* @__PURE__ */ new Set([
      "id",
      "name",
      "type",
      "description",
      "embedding",
      "embeddings",
      "organizationId",
      "workspaceId",
      "createdAt",
      "updatedAt",
      "startLine",
      "endLine",
      "lineCount",
      "sizeBytes",
      "isExported",
      "kind",
      "signature",
      "docstring",
      "language"
    ]);
    return Object.entries(entity.properties).filter(([k, v]) => !skip.has(k) && v !== "" && v != null).slice(0, 15);
  }
};

// src/views/graph-pull-modal.ts
var import_obsidian16 = require("obsidian");
init_error_format();
var GraphPullModal = class extends import_obsidian16.Modal {
  constructor(app, graphPull, mode = "pull", opts = {}) {
    super(app);
    this.graphPull = graphPull;
    this.mode = mode;
    this.opts = opts;
    this.cancelled = false;
  }
  async onOpen() {
    this.modalEl.addClass("cortex-pull-modal");
    const baseTitle = this.mode === "pull" ? "Pulling Cortex graph" : this.mode === "preview" ? "Preview graph pull" : "Cortex graph summary";
    this.titleEl.setText(baseTitle);
    const content = this.contentEl;
    content.empty();
    const phaseRow = content.createDiv({ cls: "cortex-pull-phase-row" });
    const phaseIcon = phaseRow.createSpan({ cls: "cortex-pull-phase-icon" });
    (0, import_obsidian16.setIcon)(phaseIcon, "download-cloud");
    this.phaseEl = phaseRow.createSpan({
      cls: "cortex-pull-phase-label",
      text: "Initializing\u2026"
    });
    this.messageEl = content.createDiv({ cls: "cortex-pull-message" });
    const barWrap = content.createDiv({ cls: "cortex-pull-bar-wrap" });
    this.barFill = barWrap.createDiv({ cls: "cortex-pull-bar-fill" });
    this.statsEl = content.createDiv({ cls: "cortex-pull-stats" });
    const btnRow = content.createDiv({ cls: "cortex-pull-btn-row" });
    this.cancelBtn = btnRow.createEl("button", { text: "Cancel", cls: "cortex-pull-cancel" });
    this.cancelBtn.addEventListener("click", () => {
      this.cancelled = true;
      this.close();
    });
    try {
      if (this.mode === "pull") {
        await this.runPull();
      } else if (this.mode === "preview") {
        await this.runPreview();
      } else {
        await this.runSummary();
      }
    } catch (e) {
      this.showError(e.message);
    }
  }
  async runSummary() {
    this.phaseEl.setText("Fetching graph stats\u2026");
    this.barFill.addClass("cortex-pull-bar-indeterminate");
    const summary = await this.graphPull.summary();
    if (this.cancelled) return;
    this.barFill.removeClass("cortex-pull-bar-indeterminate");
    this.barFill.addClass("cortex-pull-bar-done");
    this.barFill.setCssStyles({ width: "100%" });
    this.phaseEl.setText("Summary");
    this.messageEl.setText("Fast estimate from graph stats \u2014 run preview for exact counts.");
    this.statsEl.empty();
    const grid = this.statsEl.createDiv({ cls: "cortex-pull-stat-grid" });
    this.statItem(grid, "database", `${summary.cloudTotal.toLocaleString()} entities in cloud`, "cortex-pull-stat-total");
    this.statItem(grid, "hard-drive", `${summary.localTotal.toLocaleString()} pulled locally`, "cortex-pull-stat-update");
    this.statItem(grid, "plus-circle", `~${summary.estNew.toLocaleString()} would be new`, "cortex-pull-stat-create");
    this.statItem(grid, "trash-2", `~${summary.estStale.toLocaleString()} likely stale`, "cortex-pull-stat-delete");
    if (summary.perType.length > 0) {
      const section = this.statsEl.createEl("details", { cls: "cortex-pull-stat-details" });
      section.setAttr("open", "");
      section.createEl("summary", { text: `Breakdown by type (${summary.perType.length})` });
      const tbl = section.createEl("table", { cls: "cortex-pull-summary-table" });
      const head = tbl.createEl("thead").createEl("tr");
      for (const h of ["Type", "Cloud", "Local", "~New"]) head.createEl("th", { text: h });
      const body = tbl.createEl("tbody");
      for (const row of summary.perType) {
        const tr = body.createEl("tr");
        tr.createEl("td", { text: row.type });
        tr.createEl("td", { text: row.cloudCount.toLocaleString(), cls: "cortex-pull-summary-num" });
        tr.createEl("td", { text: row.localCount.toLocaleString(), cls: "cortex-pull-summary-num" });
        tr.createEl("td", {
          text: row.estNew > 0 ? `+${row.estNew.toLocaleString()}` : "\u2014",
          cls: `cortex-pull-summary-num ${row.estNew > 0 ? "is-new" : ""}`
        });
      }
    }
    this.cancelBtn.setText("Close");
  }
  async runPull() {
    const result = await this.graphPull.pull((p) => this.onProgress(p));
    if (this.cancelled) return;
    this.showResult(result);
    activeWindow.setTimeout(() => {
      if (!this.cancelled) this.close();
    }, 4e3);
  }
  async runPreview() {
    const preview = await this.graphPull.preview((p) => this.onProgress(p));
    if (this.cancelled) return;
    this.phaseEl.setText("Preview complete");
    this.messageEl.setText("");
    this.barFill.setCssStyles({ width: "100%" });
    this.barFill.addClass("cortex-pull-bar-done");
    this.statsEl.empty();
    this.statsEl.createDiv({ cls: "cortex-pull-stat-header", text: "What would happen:" });
    const grid = this.statsEl.createDiv({ cls: "cortex-pull-stat-grid" });
    this.statItem(grid, "plus-circle", `${preview.toCreate.length} new files`, "cortex-pull-stat-create");
    this.statItem(grid, "edit-3", `${preview.toUpdate.length} updated`, "cortex-pull-stat-update");
    this.statItem(grid, "trash-2", `${preview.toDelete.length} removed`, "cortex-pull-stat-delete");
    this.statItem(grid, "database", `${preview.entityCount} total entities`, "cortex-pull-stat-total");
    if (preview.toCreate.length > 0) {
      const section = this.statsEl.createEl("details", { cls: "cortex-pull-stat-details" });
      section.createEl("summary", { text: `New entities (${preview.toCreate.length})` });
      const list = section.createEl("ul");
      for (const name of preview.toCreate.slice(0, 50)) {
        list.createEl("li", { text: name });
      }
      if (preview.toCreate.length > 50) {
        list.createEl("li", { text: `\u2026 and ${preview.toCreate.length - 50} more`, cls: "cortex-pull-more" });
      }
    }
    this.cancelBtn.setText("Close");
  }
  onProgress(p) {
    if (this.cancelled) return;
    const phaseLabels = {
      fetching: "\u2B07 Fetching",
      writing: "\u270F Writing files",
      enriching: "\u{1F517} Enriching notes",
      cleanup: "\u{1F9F9} Cleaning up",
      done: "\u2713 Done"
    };
    this.phaseEl.setText(phaseLabels[p.phase] ?? p.phase);
    this.messageEl.setText(p.message);
    if (p.total > 0) {
      const pct = Math.min(100, Math.round(p.current / p.total * 100));
      this.barFill.setCssStyles({ width: `${pct}%` });
    } else if (p.phase === "fetching") {
      this.barFill.addClass("cortex-pull-bar-indeterminate");
      this.barFill.setCssStyles({ width: "" });
    }
    if (p.phase === "done") {
      this.barFill.removeClass("cortex-pull-bar-indeterminate");
      this.barFill.addClass("cortex-pull-bar-done");
      this.barFill.setCssStyles({ width: "100%" });
    }
  }
  showResult(result) {
    this.phaseEl.setText("\u2713 pull complete");
    this.messageEl.setText("");
    this.cancelBtn.setText("Close");
    this.statsEl.empty();
    const grid = this.statsEl.createDiv({ cls: "cortex-pull-stat-grid" });
    this.statItem(grid, "plus-circle", `${result.created} created`, "cortex-pull-stat-create");
    this.statItem(grid, "edit-3", `${result.updated} updated`, "cortex-pull-stat-update");
    this.statItem(grid, "trash-2", `${result.deleted} removed`, "cortex-pull-stat-delete");
    if (result.enriched > 0) {
      this.statItem(grid, "link", `${result.enriched} notes enriched`, "cortex-pull-stat-enriched");
    }
    if (result.errors.length > 0) {
      const errSection = this.statsEl.createEl("details", { cls: "cortex-pull-stat-details cortex-pull-errors" });
      errSection.createEl("summary", { text: `${result.errors.length} errors` });
      const list = errSection.createEl("ul");
      for (const err of result.errors.slice(0, 20)) {
        list.createEl("li", { text: err });
      }
    }
    new import_obsidian16.Notice(
      `Cortex graph: ${result.created} created, ${result.updated} updated, ${result.deleted} removed` + (result.enriched > 0 ? `, ${result.enriched} notes enriched` : "")
    );
  }
  showError(rawMessage) {
    const fmt = formatError(rawMessage, "Couldn't pull graph");
    this.phaseEl.setText("Error");
    this.barFill.addClass("cortex-pull-bar-error");
    this.barFill.setCssStyles({ width: "100%" });
    this.messageEl.empty();
    this.messageEl.removeClass("cortex-pull-error-msg");
    this.statsEl.empty();
    const card = this.statsEl.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createDiv({ cls: "cortex-error-head" });
    const ic = head.createSpan({ cls: "cortex-error-icon" });
    (0, import_obsidian16.setIcon)(ic, errorIcon(fmt.kind));
    head.createSpan({ cls: "cortex-error-headline", text: fmt.headline });
    if (fmt.hint) {
      card.createDiv({ cls: "cortex-error-hint", text: fmt.hint });
    }
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const btnRow = card.createDiv({ cls: "cortex-error-actions" });
    const retryBtn = btnRow.createEl("button", { text: "Retry", cls: "mod-cta" });
    retryBtn.addEventListener("click", () => {
      void (async () => {
        this.statsEl.empty();
        this.messageEl.setText("");
        this.barFill.removeClass("cortex-pull-bar-error");
        this.barFill.setCssStyles({ width: "0%" });
        this.phaseEl.setText("Initializing\u2026");
        try {
          if (this.mode === "pull") await this.runPull();
          else await this.runPreview();
        } catch (e) {
          this.showError(e.message);
        }
      })();
    });
    const copyBtn = btnRow.createEl("button", { text: "Copy details" });
    copyBtn.addEventListener("click", () => {
      void (async () => {
        const payload = `${fmt.headline}

${fmt.detail}${fmt.hint ? `

Hint: ${fmt.hint}` : ""}`;
        await navigator.clipboard.writeText(payload);
        copyBtn.setText("Copied");
        activeWindow.setTimeout(() => copyBtn.setText("Copy details"), 1400);
      })();
    });
    this.cancelBtn.setText("Close");
  }
  statItem(parent, icon, text, cls) {
    const item = parent.createDiv({ cls: `cortex-pull-stat ${cls}` });
    const ic = item.createSpan({ cls: "cortex-pull-stat-icon" });
    (0, import_obsidian16.setIcon)(ic, icon);
    item.createSpan({ text });
  }
  onClose() {
    this.cancelled = true;
    this.contentEl.empty();
  }
};

// src/main.ts
init_sync_modal();
init_diff_modal();

// src/views/onboarding-view.ts
var import_obsidian19 = require("obsidian");
init_assets();
var ONBOARDING_VIEW_TYPE = "cortex-onboarding-view";
var OnboardingView = class extends import_obsidian19.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.pollTimer = null;
    this.cache = {
      hasSyncedAnything: false,
      hasAnyConversation: false,
      hasStarredAnything: false
    };
    this.smartPrompts = [];
  }
  getViewType() {
    return ONBOARDING_VIEW_TYPE;
  }
  getDisplayText() {
    return "HangarX: Get started";
  }
  getIcon() {
    return "rocket";
  }
  async onOpen() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cortex-onboarding-view");
    this.bodyEl = root.createDiv({ cls: "cortex-onboarding-view-body" });
    const header = this.bodyEl.createDiv({ cls: "cortex-onboarding-view-header" });
    const logoWrap = header.createDiv({ cls: "cortex-onboarding-view-logo" });
    appendHangarxLogo(logoWrap);
    header.createDiv({
      cls: "cortex-onboarding-view-title",
      text: "Welcome to HangarX"
    });
    header.createDiv({
      cls: "cortex-onboarding-view-tagline",
      text: "Your vault becomes a knowledge graph that every AI agent on your machine can query."
    });
    await this.refreshCache();
    this.smartPrompts = this.buildSmartPrompts();
    this.renderSteps();
    this.pollTimer = window.setInterval(() => {
      void this.refreshAndRerender();
    }, 1200);
    if (!this.plugin.settings.onboardingShownAt) {
      this.plugin.settings.onboardingShownAt = Date.now();
      void this.plugin.saveSettings();
    }
  }
  // Obsidian's View.onClose accepts both sync and Promise-returning
  // overrides; we don't actually await anything so dropping `async`
  // satisfies @typescript-eslint/require-await.
  onClose() {
    if (this.pollTimer != null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.containerEl.empty();
    return Promise.resolve();
  }
  // ── State ─────────────────────────────────────────────────────────────
  getStepState() {
    const s = this.plugin.settings;
    const isCloud = s.connectionMode === "cloud";
    const step1Done = isCloud ? !!(s.apiKey && s.workspaceId) : !!s.workspaceId;
    const step2Done = this.cache.hasSyncedAnything;
    const step3Done = this.cache.hasAnyConversation;
    const step4Done = !!s.mcpEnabled;
    const step5Done = this.cache.hasStarredAnything;
    const completed = [step1Done, step2Done, step3Done, step4Done, step5Done].filter(Boolean).length;
    return { step1Done, step2Done, step3Done, step4Done, step5Done, completed, total: 5 };
  }
  async refreshCache() {
    try {
      const conversations = await this.plugin.conversations.list().catch(() => []);
      this.cache.hasAnyConversation = conversations.length > 0;
      this.cache.hasStarredAnything = conversations.some((c) => c.starred === true);
    } catch {
    }
    try {
      await this.plugin.sync.loadIndex();
      const fileCount = Object.keys(this.plugin.sync.index?.files ?? {}).length;
      this.cache.hasSyncedAnything = fileCount > 0;
    } catch {
    }
  }
  async refreshAndRerender() {
    const before = this.getStepState();
    await this.refreshCache();
    const after = this.getStepState();
    if (before.step1Done !== after.step1Done || before.step2Done !== after.step2Done || before.step3Done !== after.step3Done || before.step4Done !== after.step4Done || before.step5Done !== after.step5Done) {
      this.renderSteps();
    }
  }
  // ── Smart prompt generation (item #2 from the redesign plan) ──────────
  /**
   * Build 3 starter prompts seeded from the user's actual vault — recent
   * note titles, top tags, daily-note presence. Falls back to generic
   * prompts when the vault has no signal yet.
   */
  buildSmartPrompts() {
    const allFiles = this.app.vault.getMarkdownFiles();
    if (allFiles.length === 0) {
      return [
        "What can you do for me?",
        "How does HangarX work?",
        "Show me a list of available tools."
      ];
    }
    const recent = [...allFiles].sort((a, b) => (b.stat.mtime ?? 0) - (a.stat.mtime ?? 0)).slice(0, 3).map((f) => f.basename);
    const tagCounts = /* @__PURE__ */ new Map();
    for (const f of allFiles) {
      const cache = this.app.metadataCache.getFileCache(f);
      const tags = [
        ...cache?.tags ?? [],
        ...(cache?.frontmatter?.tags ?? []).map((t) => ({ tag: t.startsWith("#") ? t : `#${t}` }))
      ];
      for (const t of tags) {
        const tag = t.tag;
        if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
    const prompts = [];
    if (recent[0]) {
      prompts.push(
        `Summarize what I've been working on this week. Start with my most recent notes (e.g. "${recent[0]}") and surface the key projects, decisions, and open questions.`
      );
    } else {
      prompts.push("What was I working on this week?");
    }
    if (topTags[0]) {
      prompts.push(`Show me everything I've written about ${topTags[0]} and how those notes connect to each other.`);
    } else {
      prompts.push("What are the main themes across my notes?");
    }
    prompts.push("Find connections I haven't noticed between unrelated notes.");
    return prompts;
  }
  // ── Render ────────────────────────────────────────────────────────────
  renderSteps() {
    this.bodyEl.querySelectorAll(".cortex-onboarding-view-progress, .cortex-onboarding-view-steps, .cortex-onboarding-view-footer").forEach((el) => el.remove());
    const state = this.getStepState();
    const progress = this.bodyEl.createDiv({ cls: "cortex-onboarding-view-progress" });
    const bar = progress.createDiv({ cls: "cortex-onboarding-view-progress-bar cortex-progress-bar-fill" });
    bar.setCssProps({ "--cortex-progress-pct": `${state.completed / state.total * 100}%` });
    progress.createSpan({
      cls: "cortex-onboarding-view-progress-label",
      text: `${state.completed} of ${state.total} done`
    });
    const steps = this.bodyEl.createDiv({ cls: "cortex-onboarding-view-steps" });
    this.renderStep(steps, {
      done: state.step1Done,
      number: 1,
      title: "Connect HangarX",
      desc: state.step1Done ? `Connected \u2014 running in ${this.plugin.settings.connectionMode === "cloud" ? "Cloud" : "Local"} mode.` : "Pick Cloud (one-click OAuth) or Local (Docker on your machine), then enter the connection details.",
      actionLabel: state.step1Done ? "Open settings" : "Open settings",
      actionIcon: "plug",
      action: () => {
        this.app.setting?.open?.();
        this.app.setting?.openTabById?.("hangarx");
      }
    });
    this.renderStep(steps, {
      done: state.step2Done,
      number: 2,
      title: "Sync your vault",
      desc: state.step2Done ? "Your vault has been synced to the knowledge graph at least once." : "Push your notes to the knowledge graph so HangarX can answer questions about them.",
      actionLabel: state.step2Done ? "Re-sync" : "Sync now",
      actionIcon: "arrow-up",
      action: () => {
        void Promise.resolve().then(() => (init_sync_modal(), sync_modal_exports)).then((m) => new m.SyncModal(this.app, this.plugin).open());
      },
      disabled: !state.step1Done
    });
    this.renderSmartPromptStep(steps, state);
    this.renderMcpStep(steps, state);
    this.renderStep(steps, {
      done: state.step5Done,
      number: 5,
      title: "Star a useful query",
      desc: state.step5Done ? "You've starred at least one conversation \u2014 it's saved in your library for one-click recall." : "When a query produces a useful answer, star it from the chat header. Starred queries become reusable templates.",
      actionLabel: "Open chat",
      actionIcon: "star",
      action: () => {
        void this.plugin.activateChatView();
      },
      disabled: !state.step3Done
    });
    const footer = this.bodyEl.createDiv({ cls: "cortex-onboarding-view-footer" });
    if (state.completed === state.total) {
      const done = footer.createDiv({ cls: "cortex-onboarding-view-done" });
      const ic = done.createSpan({ cls: "cortex-onboarding-view-done-icon" });
      (0, import_obsidian19.setIcon)(ic, "check-circle");
      done.createSpan({ text: "All set \u2014 close this panel anytime." });
    }
    const dismiss = footer.createEl("button", {
      cls: "cortex-onboarding-view-dismiss",
      text: state.completed === state.total ? "Close panel" : "Dismiss for now"
    });
    dismiss.addEventListener("click", () => {
      this.plugin.settings.onboardingDismissed = true;
      void this.plugin.saveSettings();
      this.leaf.detach();
    });
    const help = footer.createEl("a", {
      cls: "cortex-onboarding-view-help",
      attr: { href: "https://app.HangarX.ai/obsidian", target: "_blank", rel: "noopener" },
      text: "Read the docs \u2192"
    });
    help.addEventListener("click", (evt) => evt.stopPropagation());
  }
  // ── Step 3: smart prompts ─────────────────────────────────────────────
  renderSmartPromptStep(parent, state) {
    const row = parent.createDiv({
      cls: "cortex-onboarding-step" + (state.step3Done ? " is-done" : "") + (!state.step2Done ? " is-disabled" : "")
    });
    const status = row.createDiv({ cls: "cortex-onboarding-step-status" });
    if (state.step3Done) {
      const ic = status.createSpan({ cls: "cortex-onboarding-step-check" });
      (0, import_obsidian19.setIcon)(ic, "check");
    } else {
      status.setText("3");
    }
    const body = row.createDiv({ cls: "cortex-onboarding-step-body" });
    body.createDiv({ cls: "cortex-onboarding-step-title", text: "Run your first query" });
    body.createDiv({
      cls: "cortex-onboarding-step-desc",
      text: state.step3Done ? "You've had at least one conversation. Try a starred prompt to keep going." : "Pick one of these prompts \u2014 each is tailored to your actual notes."
    });
    if (!state.step3Done && state.step2Done) {
      const promptList = body.createDiv({ cls: "cortex-onboarding-prompts" });
      for (const prompt of this.smartPrompts) {
        const btn = promptList.createEl("button", { cls: "cortex-onboarding-prompt" });
        const ic = btn.createSpan({ cls: "cortex-onboarding-prompt-icon" });
        (0, import_obsidian19.setIcon)(ic, "sparkles");
        btn.createSpan({ cls: "cortex-onboarding-prompt-text", text: prompt });
        btn.addEventListener("click", () => {
          void this.plugin.askInChat(prompt);
        });
      }
    }
  }
  // ── Step 4: MCP / external agents ─────────────────────────────────────
  renderMcpStep(parent, state) {
    const row = parent.createDiv({
      cls: "cortex-onboarding-step" + (state.step4Done ? " is-done" : "")
    });
    const status = row.createDiv({ cls: "cortex-onboarding-step-status" });
    if (state.step4Done) {
      const ic = status.createSpan({ cls: "cortex-onboarding-step-check" });
      (0, import_obsidian19.setIcon)(ic, "check");
    } else {
      status.setText("4");
    }
    const body = row.createDiv({ cls: "cortex-onboarding-step-body" });
    body.createDiv({ cls: "cortex-onboarding-step-title", text: "Connect external AI agents" });
    body.createDiv({
      cls: "cortex-onboarding-step-desc",
      text: state.step4Done ? `Local MCP server is running on port ${this.plugin.settings.mcpPort}. Use the configs below to connect each agent.` : "Turn on the local MCP server, then copy the right config into your AI agent of choice."
    });
    if (!state.step4Done) {
      const toggleBtn = body.createEl("button", { cls: "cortex-onboarding-mcp-toggle" });
      const ic = toggleBtn.createSpan({ cls: "cortex-onboarding-mcp-toggle-icon" });
      (0, import_obsidian19.setIcon)(ic, "play-circle");
      toggleBtn.createSpan({ text: "Start local MCP server" });
      toggleBtn.addEventListener("click", () => {
        void (async () => {
          await this.plugin.toggleMcpServer(true);
          await this.refreshAndRerender();
        })();
      });
      return;
    }
    const cfg = body.createDiv({ cls: "cortex-onboarding-mcp-configs" });
    const port = this.plugin.settings.mcpPort;
    const token = this.plugin.settings.mcpToken;
    const url = `http://127.0.0.1:${port}/mcp`;
    const claudeDesktopJson = JSON.stringify({
      mcpServers: {
        hangarx: {
          url,
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    }, null, 2);
    const cursorJson = JSON.stringify({
      mcpServers: {
        hangarx: {
          url,
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    }, null, 2);
    const claudeCodeCmd = `claude mcp add hangarx --url ${url} --header "Authorization: Bearer ${token}"`;
    this.renderMcpConfig(cfg, {
      label: "Claude Desktop",
      icon: "message-circle",
      hint: import_obsidian19.Platform.isMacOS ? "Add to ~/Library/Application Support/Claude/claude_desktop_config.json" : import_obsidian19.Platform.isWin ? "Add to %APPDATA%\\Claude\\claude_desktop_config.json" : "Add to ~/.config/Claude/claude_desktop_config.json",
      payload: claudeDesktopJson,
      kind: "json"
    });
    this.renderMcpConfig(cfg, {
      label: "Cursor",
      icon: "terminal",
      hint: "Cursor \u2192 Settings \u2192 MCP \u2192 Add new server",
      payload: cursorJson,
      kind: "json"
    });
    this.renderMcpConfig(cfg, {
      label: "Claude Code (CLI)",
      icon: "terminal-square",
      hint: "Run this in your terminal \u2014 configures the Claude Code CLI to use HangarX as an MCP source.",
      payload: claudeCodeCmd,
      kind: "cmd"
    });
    const stop = cfg.createEl("button", { cls: "cortex-onboarding-mcp-stop", text: "Stop MCP server" });
    stop.addEventListener("click", () => {
      void (async () => {
        await this.plugin.toggleMcpServer(false);
        await this.refreshAndRerender();
      })();
    });
  }
  renderMcpConfig(parent, opts) {
    const wrap = parent.createDiv({ cls: "cortex-onboarding-mcp-config" });
    const head = wrap.createDiv({ cls: "cortex-onboarding-mcp-config-head" });
    const labelWrap = head.createSpan({ cls: "cortex-onboarding-mcp-config-label" });
    const ic = labelWrap.createSpan({ cls: "cortex-onboarding-mcp-config-icon" });
    (0, import_obsidian19.setIcon)(ic, opts.icon);
    labelWrap.createSpan({ text: opts.label });
    const copy = head.createEl("button", { cls: "cortex-onboarding-mcp-config-copy" });
    const cic = copy.createSpan();
    (0, import_obsidian19.setIcon)(cic, "copy");
    copy.createSpan({ text: "Copy" });
    copy.addEventListener("click", () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(opts.payload);
          new import_obsidian19.Notice(`HangarX: ${opts.label} ${opts.kind === "cmd" ? "command" : "config"} copied.`);
        } catch {
          new import_obsidian19.Notice("HangarX: Copy failed \u2014 selecting text instead.");
        }
      })();
    });
    wrap.createDiv({ cls: "cortex-onboarding-mcp-config-hint", text: opts.hint });
    const pre = wrap.createEl("pre", { cls: `cortex-onboarding-mcp-config-payload is-${opts.kind}` });
    pre.setText(opts.payload);
  }
  // ── Generic step row ──────────────────────────────────────────────────
  renderStep(parent, opts) {
    const row = parent.createDiv({
      cls: "cortex-onboarding-step" + (opts.done ? " is-done" : "") + (opts.disabled ? " is-disabled" : "")
    });
    const status = row.createDiv({ cls: "cortex-onboarding-step-status" });
    if (opts.done) {
      const ic = status.createSpan({ cls: "cortex-onboarding-step-check" });
      (0, import_obsidian19.setIcon)(ic, "check");
    } else {
      status.setText(String(opts.number));
    }
    const body = row.createDiv({ cls: "cortex-onboarding-step-body" });
    body.createDiv({ cls: "cortex-onboarding-step-title", text: opts.title });
    body.createDiv({ cls: "cortex-onboarding-step-desc", text: opts.desc });
    if (!opts.disabled) {
      const btn = row.createEl("button", { cls: "cortex-onboarding-step-action" });
      const ic = btn.createSpan({ cls: "cortex-onboarding-step-action-icon" });
      (0, import_obsidian19.setIcon)(ic, opts.actionIcon);
      btn.createSpan({ text: opts.actionLabel });
      btn.addEventListener("click", opts.action);
    }
  }
};

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
    const span = activeDocument.createSpan();
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
  update(_value, tr) {
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
        this.timer = window.setTimeout(() => {
          void this.recompute();
        }, 300);
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
init_confirm_modal();
function makeProgressNotice(headline, onCancel) {
  const notice = new import_obsidian20.Notice(headline, 0);
  const root = notice.messageEl;
  root.addClass("cortex-progress-notice");
  const phaseEl = root.createDiv({ cls: "cortex-progress-phase", text: "" });
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
    const modal = new class extends import_obsidian20.Modal {
      onOpen() {
        this.titleEl.setText(title);
        const input = this.contentEl.createEl("input", {
          cls: "cortex-prompt-input",
          attr: { type: "text", placeholder }
        });
        const btn = this.contentEl.createEl("button", {
          cls: "cortex-prompt-button",
          text: "OK"
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
        activeWindow.setTimeout(() => input.focus(), 50);
      }
      onClose() {
        resolve(null);
        this.contentEl.empty();
      }
    }(app);
    modal.open();
  });
}
var CortexPlugin = class extends import_obsidian20.Plugin {
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
    if (!this.settings.connectorEncryptionKey) {
      this.settings.connectorEncryptionKey = generateEncryptionKey();
      await this.saveSettings();
    }
    if (!this.settings.llmEncryptionKey) {
      this.settings.llmEncryptionKey = generateEncryptionKey();
      await this.saveSettings();
    }
    this.client = new CortexClient(this.settings);
    this.sync = new VaultSync(this.app, this.client, this.settings);
    this.conversations = new ConversationStore(this);
    this.graphPull = new GraphPull(this.app, this.client, this.settings);
    this.mcp = new McpServer(this, this.client, this.settings);
    this.api = buildPublicApi(this.client);
    this.registerEditorExtension(
      inlineSuggestionsExtension(this.client, () => this.settings.inlineSuggestionsEnabled)
    );
    this.registerView(RELATED_VIEW_TYPE, (leaf) => new RelatedView(leaf, this.client));
    this.registerView(
      CHAT_VIEW_TYPE,
      (leaf) => new ChatView(leaf, this.client, this.conversations, this.settings, this)
    );
    this.registerView(ONBOARDING_VIEW_TYPE, (leaf) => new OnboardingView(leaf, this));
    this.registerObsidianProtocolHandler("hangarx-callback", (params) => {
      void completeSignIn(params);
    });
    this.addRibbonIcon("refresh-cw", "HangarX: Sync", () => {
      new SyncModal(this.app, this).open();
    });
    this.addRibbonIcon("bar-chart-3", "HangarX: Knowledge graph stats", () => {
      new GraphStatsModal(this.app, this.client, this).open();
    });
    this.addCommand({
      id: "cortex-1-sync",
      name: "Sync (open modal)",
      callback: () => new SyncModal(this.app, this).open()
    });
    this.addCommand({
      id: "cortex-1-sync-quick",
      name: "Push vault to knowledge graph (no modal)",
      callback: () => this.runFullSyncWithFeedback()
    });
    this.addCommand({
      id: "cortex-sync-current-note",
      name: "Sync current note to knowledge graph",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(import_obsidian20.MarkdownView);
        if (!view?.file) return false;
        if (checking) return true;
        void this.runSyncCurrentNote(view.file);
        return true;
      }
    });
    this.addCommand({
      id: "cortex-vault-graph-diff",
      name: "Diff vault \u2194 graph (what's out of sync)",
      callback: () => new DiffModal(this.app, this).open()
    });
    this.addCommand({
      id: "cortex-show-onboarding",
      name: "Show onboarding panel (Get started)",
      callback: () => this.activateOnboardingView()
    });
    this.addCommand({
      id: "cortex-1b-resync-all",
      name: "Force re-ingest entire vault (after server reset)",
      callback: () => this.runForceResyncWithFeedback()
    });
    this.addCommand({
      id: "cortex-1c-rebuild-graph",
      name: "Rebuild communities + reindex (after fast re-ingest)",
      callback: () => this.runRebuildCommunitiesAndReindex()
    });
    this.addCommand({
      id: "cortex-2-connect-agents",
      name: "Connect agents (Claude, Cursor)\u2026",
      callback: () => {
        const settingApi = this.app.setting;
        settingApi?.open?.();
        settingApi?.openTabById?.(this.manifest.id);
      }
    });
    this.addCommand({
      id: "cortex-3-stats",
      name: "Knowledge graph stats",
      callback: () => new GraphStatsModal(this.app, this.client, this).open()
    });
    this.addCommand({
      id: "cortex-ask",
      name: "Ask your vault (side panel)",
      callback: () => void this.activateChatView()
    });
    this.addCommand({
      id: "cortex-ask-modal",
      name: "Ask your vault (modal)",
      callback: () => new ChatModal(this.app, this.client, this.conversations, this.settings, this).open()
    });
    this.addCommand({
      id: "cortex-related-pane",
      name: "Open related notes pane",
      callback: () => void this.activateRelatedView()
    });
    this.addCommand({
      id: "cortex-graph-pull",
      name: "Import knowledge graph from cloud",
      callback: () => this.runGraphPull()
    });
    this.addCommand({
      id: "cortex-graph-pull-preview",
      name: "Preview knowledge graph import",
      callback: () => this.runGraphPullPreview()
    });
    this.addCommand({
      id: "cortex-graph-pull-summary",
      name: "Knowledge graph summary (fast)",
      callback: () => this.runGraphPullSummary()
    });
    this.addCommand({
      id: "cortex-ingest-url",
      name: "Ingest URL into knowledge graph",
      callback: async () => {
        const url = await promptForText(this.app, "Ingest URL", "Paste a URL to scrape and add to your knowledge graph.");
        if (!url) return;
        const notice = new import_obsidian20.Notice("HangarX: Ingesting URL\u2026", 0);
        try {
          const result = await this.client.ingestUrl(url);
          notice.hide();
          new import_obsidian20.Notice(`\u2705 Ingested! ${result.entityCount ? `${result.entityCount} entities extracted.` : "Processing complete."}`);
        } catch (e) {
          notice.hide();
          new import_obsidian20.Notice(`HangarX ingest failed: ${e.message}`);
        }
      }
    });
    this.addSettingTab(new CortexSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!("extension" in file) || file.extension !== "md") return;
        menu.addItem((item) => {
          item.setTitle("HangarX: Sync to knowledge graph").setIcon("refresh-cw").onClick(() => void this.runSyncCurrentNote(file));
        });
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, _editor, view) => {
        const file = view?.file;
        if (!file || file.extension !== "md") return;
        menu.addItem((item) => {
          item.setTitle("HangarX: Sync this note to knowledge graph").setIcon("refresh-cw").onClick(() => void this.runSyncCurrentNote(file));
        });
      })
    );
    this.app.workspace.onLayoutReady(async () => {
      this.registerEvent(this.app.vault.on("create", (f) => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on("modify", (f) => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on("delete", (f) => this.sync.handleDelete(f)));
      this.registerEvent(this.app.vault.on("rename", (f, old) => this.sync.handleRename(f, old)));
      if (this.settings.syncOnStartup && this.settings.apiKey && this.settings.workspaceId) {
        activeWindow.setTimeout(() => this.sync.fullSync().catch((e) => console.warn("[Cortex] startup sync", e)), 3e3);
      }
      const pane = this.settings.defaultRightPane ?? (this.settings.showRelatedPane ? "related" : "none");
      if (pane === "chat") {
        void this.activateChatView();
      } else if (pane === "related") {
        void this.activateRelatedView();
      }
      if (this.settings.mcpEnabled && this.settings.apiKey && this.settings.workspaceId) {
        activeWindow.setTimeout(() => this.toggleMcpServer(true), 1500);
      }
      if (!this.settings.onboardingShownAt && !this.settings.onboardingDismissed) {
        const isCloud = this.settings.connectionMode === "cloud";
        const looksConnected = isCloud ? !!(this.settings.apiKey && this.settings.workspaceId) : !!this.settings.workspaceId;
        if (!looksConnected) {
          activeWindow.setTimeout(() => void this.activateOnboardingView(), 800);
        } else {
          this.settings.onboardingShownAt = Date.now();
          void this.saveSettings();
        }
      }
    });
  }
  async onunload() {
    cancelSignIn();
    await this.mcp?.stop().catch(() => void 0);
  }
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
    if (this.settings.apiUrl === "https://cortex.HangarX.com") {
      this.settings.apiUrl = "https://cortex.HangarX.ai";
      await this.saveData(this.settings);
    }
    if (this.settings.connectionMode === "self-hosted") {
      this.settings.connectionMode = "local";
      await this.saveData(this.settings);
    }
    if (this.settings.embeddingPreset === "openai") {
      this.settings.embeddingPreset = "gemini";
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
        new import_obsidian20.Notice(`HangarX MCP: failed to start (${e.message})`);
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
      void this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: RELATED_VIEW_TYPE, active: true });
      void this.app.workspace.revealLeaf(leaf);
    }
  }
  /** Open the Graph Pull modal in pull mode. Public so settings buttons + commands share one entry point. */
  runGraphPull() {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, "pull", {
      source: "cloud",
      sourceLabel: new URL(CLOUD_API_URL).host
    }).open();
  }
  /** Open the Graph Pull modal in dry-run mode. */
  runGraphPullPreview() {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, "preview", {
      source: "cloud",
      sourceLabel: new URL(CLOUD_API_URL).host
    }).open();
  }
  /** Open the Graph Pull modal in cheap "summary" mode (one /graph/stats call). */
  runGraphPullSummary() {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, "summary", {
      source: "cloud",
      sourceLabel: new URL(CLOUD_API_URL).host
    }).open();
  }
  /**
   * Graph pull always targets cortex.hangarx.ai with the saved cloud API key
   * + workspace ID, regardless of the plugin's current connection mode. The
   * "import graph into vault" feature is conceptually a cloud-only action —
   * locally there's nothing extra to pull beyond what the user just synced.
   *
   * Returns null after surfacing a Notice if the cloud creds are missing.
   */
  buildCloudGraphPull() {
    if (!this.settings.apiKey) {
      new import_obsidian20.Notice("HangarX: Cloud API key is empty. Open settings \u2192 connection details and sign in or paste a key.");
      return null;
    }
    if (!this.settings.workspaceId) {
      new import_obsidian20.Notice("HangarX: Cloud workspace ID is empty. Open settings \u2192 connection details.");
      return null;
    }
    const cloudSettings = {
      ...this.settings,
      apiUrl: CLOUD_API_URL,
      connectionMode: "cloud"
    };
    const cloudClient = new CortexClient(cloudSettings);
    return new GraphPull(this.app, cloudClient, cloudSettings);
  }
  async activateChatView() {
    const existing = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    if (existing.length > 0) {
      void this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
      void this.app.workspace.revealLeaf(leaf);
    }
  }
  /**
   * Open the persistent onboarding side panel (creating it if needed).
   * Used by both the first-run auto-open and the command palette entry.
   */
  async activateOnboardingView() {
    const existing = this.app.workspace.getLeavesOfType(ONBOARDING_VIEW_TYPE);
    if (existing.length > 0) {
      void this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: ONBOARDING_VIEW_TYPE, active: true });
      void this.app.workspace.revealLeaf(leaf);
    }
  }
  /**
   * Open the chat side panel (creating it if needed) and prefill the composer
   * with a starter query. Used by Memory Stats "drill in" rows so a user can
   * jump from "1,855 Notes" to a sensible exploratory question in one click.
   */
  async askInChat(text) {
    await this.activateChatView();
    activeWindow.setTimeout(() => {
      const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
      const view = leaves[0]?.view;
      view?.prefill(text);
    }, 80);
  }
  /**
   * Wrap fullSync with pre-flight checks + visible error feedback.
   */
  /**
   * Push a single note to the knowledge graph immediately. Bypasses the
   * 2-second auto-sync debounce. Surfaces a Notice so the user knows
   * whether it actually pushed (vs. skipped because the hash matched).
   */
  async runSyncCurrentNote(file) {
    const s = this.settings;
    if (!s.workspaceId) {
      new import_obsidian20.Notice("HangarX: Workspace ID is empty. Open settings \u2192 connection.");
      return;
    }
    const notice = new import_obsidian20.Notice(`HangarX: syncing ${file.basename}\u2026`, 0);
    try {
      const result = await this.sync.syncOneFile(file);
      notice.hide();
      switch (result) {
        case "synced":
          new import_obsidian20.Notice(`\u2713 Synced ${file.basename}`, 3e3);
          break;
        case "unchanged":
          new import_obsidian20.Notice(`${file.basename} is already up to date`, 3e3);
          break;
        case "skipped":
          new import_obsidian20.Notice(`Skipped ${file.basename} (empty or excluded by filters)`, 4e3);
          break;
      }
    } catch (e) {
      notice.hide();
      new import_obsidian20.Notice(`HangarX sync failed for ${file.basename}: ${e.message}`, 6e3);
    }
  }
  async runFullSyncWithFeedback() {
    const s = this.settings;
    if (!s.apiKey) {
      new import_obsidian20.Notice("HangarX: API key is empty. Open settings \u2192 connection.");
      return;
    }
    if (!s.workspaceId) {
      new import_obsidian20.Notice("HangarX: Workspace ID is empty. Open settings \u2192 connection.");
      return;
    }
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new import_obsidian20.Notice("HangarX: vault has no Markdown files to sync.");
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
        new import_obsidian20.Notice(`\u23F9 HangarX sync cancelled \u2014 ${synced} synced, ${skipped} unchanged so far.`, 5e3);
        return;
      }
      const headline = failed > 0 ? `\u26A0\uFE0F HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed, ${failed} FAILED` : `\u2705 HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed`;
      new import_obsidian20.Notice(headline, failed > 0 ? 1e4 : 4e3);
      if (failed > 0) {
        const sample = failedPaths.slice(0, 3).join(", ");
        const more = failedPaths.length > 3 ? ` (+${failedPaths.length - 3} more)` : "";
        new import_obsidian20.Notice(`Failures: ${sample}${more}`, 1e4);
      }
      if (synced === 0 && skipped > 0) {
        try {
          const stats = await this.client.getGraphStats();
          if (stats.totalEntities === 0) {
            new import_obsidian20.Notice(
              `\u26A0\uFE0F Index says ${skipped} files are already synced, but the server graph is empty. Run "Force re-ingest entire vault" from the command palette to re-push everything.`,
              12e3
            );
          }
        } catch {
        }
      } else if (synced === 0 && skipped > 0 && deleted === 0) {
        new import_obsidian20.Notice("Everything was already up to date.");
      }
    } catch (e) {
      progress.notice.hide();
      const msg = e.message || String(e);
      console.error("[Cortex] fullSync failed:", e);
      new import_obsidian20.Notice(`HangarX sync failed: ${truncate(msg, 200)}`, 8e3);
    }
  }
  /**
   * Force-resync: clear the per-file index then run a full sync.
   */
  async runForceResyncWithFeedback() {
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new import_obsidian20.Notice("Hangarx: vault has no Markdown files to sync.");
      return;
    }
    const confirmed = await confirmModal(this.app, {
      title: `Force-resync ${fileCount} files?`,
      body: `This wipes the local sync index and re-pushes every file into the knowledge graph.

Use this after the server-side graph has been reset (e.g. Docker volume wiped). It's safe \u2014 your notes themselves aren't touched.`,
      confirmText: "Force resync",
      destructive: true
    });
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
        signal: abort.signal,
        fastMode: true
      });
      progress.notice.hide();
      const { synced, skipped, deleted, paused } = result;
      if (paused === "cancelled") {
        new import_obsidian20.Notice(`\u23F9 Force-resync cancelled \u2014 ${synced} re-ingested so far.`, 5e3);
        return;
      }
      const noticeText = `\u2705 Force-resync done: ${synced} ingested, ${skipped} skipped, ${deleted} removed.
Click here to rebuild communities + reindex (recommended).`;
      const finishNotice = new import_obsidian20.Notice(noticeText, 12e3);
      finishNotice.messageEl.addClass("cortex-clickable-notice");
      finishNotice.messageEl.addEventListener("click", () => {
        finishNotice.hide();
        void this.runRebuildCommunitiesAndReindex();
      });
    } catch (e) {
      progress.notice.hide();
      const msg = e.message || String(e);
      console.error("[Cortex] forceResync failed:", e);
      new import_obsidian20.Notice(`HangarX force-resync failed: ${truncate(msg, 200)}`, 8e3);
    }
  }
  /**
   * Restore the post-ingest steps fastMode skipped: detect graph communities
   * and backfill embeddings for any structured entities without them. Runs
   * the two endpoints sequentially because community detection depends on
   * having entity embeddings; surfaces failures individually so a partial
   * success still tells the user what worked.
   */
  async runRebuildCommunitiesAndReindex() {
    const progress = new import_obsidian20.Notice("HangarX: rebuilding communities + reindexing\u2026", 0);
    let reindexOk = false;
    let detectOk = false;
    let detectStats = null;
    try {
      await this.client.backfillEntityEmbeddings();
      reindexOk = true;
    } catch (e) {
      console.warn("[Cortex] backfillEntityEmbeddings failed:", e);
    }
    try {
      detectStats = await this.client.detectCommunities();
      detectOk = true;
    } catch (e) {
      console.warn("[Cortex] detectCommunities failed:", e);
    }
    progress.hide();
    if (reindexOk && detectOk && detectStats) {
      new import_obsidian20.Notice(
        `\u2705 Reindex done. ${detectStats.communitiesCreated} communities across ${detectStats.levels} levels.`,
        8e3
      );
    } else if (reindexOk || detectOk) {
      const parts = [];
      parts.push(reindexOk ? "\u2713 Embeddings backfilled" : "\u2717 Backfill failed");
      parts.push(detectOk ? "\u2713 Communities detected" : "\u2717 Community detection failed");
      new import_obsidian20.Notice(`HangarX rebuild partial: ${parts.join(" \xB7 ")} (see console)`, 1e4);
    } else {
      new import_obsidian20.Notice("HangarX rebuild failed \u2014 see console for details.", 8e3);
    }
  }
};
function truncate(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "\u2026";
}
