# How HangarX works

HangarX turns your Obsidian vault into a memory layer that AI agents on your machine — Claude Desktop, Claude Code, Cursor, and anything else that speaks MCP — can call into. Your notes, decisions, and project history become permanent context that survives across sessions, tools, and models.

This doc explains the mental model in five minutes.

## The one-line version

> Your **vault** is the source of truth. HangarX builds a queryable **memory graph** from it. Your **agents** call that memory through MCP — locally, on your machine.

## The data flow

```
                           you write notes
                                  │
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │            Obsidian vault (markdown)             │  ← source of truth
        │              your-vault/*.md                      │
        └──────────────────────────────────────────────────┘
                                  │
                                  │  HangarX vault sync
                                  │  (push every changed file)
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │            HangarX backend (cortex-api)           │
        │   ┌──────────┐  ┌──────────┐  ┌─────────────┐    │
        │   │ FalkorDB │  │ pgvector │  │   Postgres  │    │  ← derived
        │   │  graph   │  │ embeddings│  │   metadata  │    │     index
        │   └──────────┘  └──────────┘  └─────────────┘    │
        └──────────────────────────────────────────────────┘
                                  │
                                  │  MCP server (localhost:7474)
                                  │  exposes memory tools to agents
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │   Claude Desktop · Claude Code · Cursor · …      │  ← consumers
        │                                                  │
        │   cortex_recall(query)        cortex_remember()  │
        │   cortex_neighbors(entity)    cortex_paths()     │
        └──────────────────────────────────────────────────┘
```

Three layers, one direction of authority.

## Why "vault is the source of truth" matters

Other memory systems (Mem0, Zep, OpenAI Memory) make their own database the source of truth. The user can read it but can't easily edit it; if the service shuts down, the memory is gone.

HangarX is built differently. **The graph is a derived index** — built from markdown files you already own, in a folder you already control, in a format that's been stable for 30+ years. If HangarX disappears tomorrow:

- Your notes are still there. You wrote them; they're plain text on disk.
- You can rebuild the graph by running the same ingest against any other backend (the data harmonizer is open-source).
- You lose nothing.

That's the deal. **HangarX is replaceable; your vault is forever.**

This shapes every design decision:

- The plugin **never** writes to the graph except through normal vault ingest. Even when an agent calls `cortex_remember`, that memory lands as a markdown file in your vault first; the graph picks it up on the next sync.
- Cloud features (when they exist) **import to the vault**, not directly to the graph.
- The graph rebuilds cleanly from a wiped state. If FalkorDB volume gets corrupted, **`Force re-ingest entire vault`** restores everything from your markdown.

## Where your data lives

| Layer | What it stores | Where physically |
|---|---|---|
| **Vault** | Your markdown notes (canonical) | The Obsidian folder you opened. Plain `.md` files. |
| **HangarX graph** | Entities + relationships extracted from notes | FalkorDB inside the local Docker container, OR cortex.hangarx.ai if you're in cloud mode |
| **Vector chunks** | Embeddings for semantic search | pgvector (Postgres) inside the local Docker container, OR cloud |
| **Agent memories** | Things agents asked to remember (e.g. user preferences) | Saved as markdown files in `Cortex Memories/` in your vault. The graph indexes them like any other note. |
| **Plugin sync state** | Per-file content hashes for incremental sync | `.cortex/index.json` in your vault. Survives Obsidian restarts. |
| **MCP bridge config** | Your agents' connection details | Each agent's own config file (`~/.claude/mcp.json`, etc.). HangarX writes these via the one-click connect buttons. |

**In local mode, no data leaves your machine** unless you've explicitly configured a cloud LLM provider for entity extraction — and even then, only the chunks being processed transit; the resulting graph stays local.

## How agents see your memory

Agents connect through the **Model Context Protocol (MCP)**, an Anthropic-led standard adopted by Claude, OpenAI, Google, and most major coding tools. HangarX runs a local MCP server (default `127.0.0.1:7474`) that exposes a small set of tools any MCP client can call:

| Tool | What it does | When agents pick it |
|---|---|---|
| `cortex_recall(query)` | Search the user's notes for facts/decisions/context | Before answering questions about the user's projects, preferences, or domain |
| `cortex_remember(content)` | Persist a fact for future sessions | When the user says "remember that…" or the agent derives a long-lived insight |
| `cortex_neighbors(entity)` | Find notes related to a specific entity | Exploring what's near a known concept |
| `cortex_paths(from, to)` | Trace connections between two entities | Multi-hop reasoning ("how is X related to Y?") |
| `cortex_search_entities(name)` | Find an entity by partial name | Disambiguating a reference |
| `cortex_contradictions(topic)` | List inconsistencies in stored claims | Reviewing what the user changed their mind about |
| `cortex_summarize(entity)` | Explain an entity from graph context | High-level overviews |

The MCP server only listens on `localhost`. **No agent on the public internet can reach it.** Each connected agent gets a bearer token; you can rotate it from settings any time.

## What runs where (local mode)

```
your machine
├─ Obsidian (this plugin lives here)
│   └─ vault sync, ribbon, settings, chat modal
│
├─ Docker daemon
│   ├─ cortex-api      (HTTP API, MCP server, ingest pipeline)
│   ├─ cortex-falkordb (graph database)
│   └─ cortex-postgres (pgvector + metadata)
│
└─ Agents (Claude Desktop, Cursor, Claude Code, …)
    └─ talk to localhost:7474 via MCP
```

LLM calls (entity extraction during ingest, embedding generation, optional rerank) happen at whatever provider you configured in **Settings → Connection → LLM provider keys (BYO)**. Default is Gemini; switch to local Ollama for fully-offline operation.

## What stays out of the network

- The vault itself. Always local.
- The graph database (FalkorDB). Always local in local mode.
- The vector index (pgvector). Always local in local mode.
- The MCP server. Localhost-only; never publicly bound.

## What does cross the network

- **Embedding requests** during ingest. Each chunk gets vectorised by your configured provider (Gemini, OpenAI, or local Ollama). Switch to Ollama in BYOK settings to keep these local.
- **LLM extraction calls** during ingest. Note text is sent to the configured chat model to extract entities. Switch to a local model via Ollama to keep these local.
- **Rerank calls** during a chat query. Optional; falls back to fast local cosine similarity.
- **Cloud mode** (if you choose it). The plugin connects to `cortex.hangarx.ai` instead of `localhost:3400`. In that mode the graph + vectors live in our cloud; you trade local-first for zero-Docker convenience.

## The agent loop, in detail

When you ask Claude Desktop "what did I decide about the auth migration last week?":

1. Claude detects this is a question about *your* knowledge, not the model's training data.
2. Claude calls `cortex_recall("auth migration decision")` over MCP to `127.0.0.1:7474`.
3. The MCP server forwards to `localhost:3400/v1/memory/recall`.
4. cortex-api embeds your query, runs vector search across pgvector, looks up adjacent entities in FalkorDB.
5. Returns 5 ranked memory items with content snippets and source filenames.
6. Claude synthesizes an answer grounded in those snippets, citing the source notes.

Sub-second on a warm cache. Works offline if your LLM provider is Ollama.

## Things that won't work how you might expect

A few things people occasionally try that don't fit this architecture:

- **Editing the graph directly.** The graph is derived. Edit notes; the graph follows on the next sync. There's intentionally no UI to add an entity by hand because doing so would create graph state that doesn't match a note, and the next force-resync would erase it.
- **Querying historical graph state.** The graph reflects the *current* vault. If you want "what did I think on March 5?", that's a question for git or Obsidian's version history of the markdown — not a graph feature.
- **Two-way cloud↔local sync.** Cloud and local are alternative backends, not peers. Pick one in **Settings → Connection → Mode**. You can migrate from cloud to local with the import command (or vice versa); you can't run both simultaneously and expect them to merge.

## Where to go from here

| Goal | Open this |
|---|---|
| Connect Claude Desktop / Code / Cursor | Settings → Agents → click "Connect" on the relevant card |
| Verify your graph has data | `Cmd-P` → "Memory stats" |
| Force a clean rebuild | `Cmd-P` → "Force re-ingest entire vault" |
| Fix a 401 / connection issue | Settings → Connection → "Test auth" |
| Switch embedding to fully-offline | Settings → Connection → "LLM provider keys (BYO)" → Embedding provider → Ollama |
| Read what tools the MCP server exposes | `Cmd-P` → "Connect agents" → expand "Advanced MCP details" |

## In one sentence

**You write notes. HangarX builds a queryable memory layer from them. Your agents see your notes as if they had your memory.** Everything else is implementation detail.
