# HangarX — Agent Memory for Obsidian

**Turn your vault into permanent memory for every AI agent on your machine.**

Claude Desktop, Claude Code, Cursor, Cline, Windsurf — they all forget the moment a session ends. HangarX changes that. Your notes, decisions, and project history become a structured memory layer that *every* MCP-compatible agent can read and write to. One vault, every tool, no copy-pasting context between chats.

> 🤖 Cross-tool memory · 🧠 Multi-hop reasoning · 🔍 Semantic Q&A · 🔒 100% local option

---

## Why this exists

You've already written everything. Your standups, your design docs, your half-finished thoughts. The problem isn't capturing knowledge — it's making it usable by the agents you work with every day.

- **Claude Desktop forgot what you decided last week.** HangarX remembers.
- **Cursor doesn't know your team's conventions.** HangarX answers from your notes.
- **You repeat yourself across every new chat.** HangarX is the source of truth all of them read.

It's not another chat UI bolted onto Obsidian. It's the connective tissue that makes your existing AI tools dramatically more useful.

---

## Quick start — 60 seconds (Cloud)

Cloud mode is the fastest way to try HangarX. Sign-in is OAuth — no key copy-paste.

1. **Install** the plugin from Obsidian's Community Plugins → search **"HangarX"**.
2. Open Settings → **HangarX — Agent Memory** → Mode: **☁️ Cloud (HangarX hosted)**.
3. Click **Sign in with HangarX**. Your browser opens, you approve, and the plugin auto-fills your API key + workspace.
4. Click **Sync vault to memory layer** in the command palette (⌘P) — or wait for the next startup sync.

That's it. Your vault is now searchable, your agents can read it, and you can ask questions from inside Obsidian.

> First sync uploads everything. Subsequent syncs only push files that changed. The `.cortex/` folder, `.obsidian/`, and your templates are excluded by default.

---

## Quick start — Local Docker (private)

<details>
<summary>Run everything on your machine — your notes never leave the laptop.</summary>

1. Install the plugin and switch Mode to **🏠 Local (Docker)**.
2. Click **Save to vault** (writes `docker-compose.cortex.yml` next to your notes).
3. Open a terminal in your vault folder and run:
   ```bash
   GEMINI_API_KEY="your-key" docker compose -f docker-compose.cortex.yml up -d
   ```
4. Switch back to Obsidian — the red status pill turns green when the stack is up.

**Bring your own keys.** Click the **LLM provider keys** section to add Gemini, OpenAI, Anthropic, Moonshot, HuggingFace, OpenRouter, or xAI keys. Re-save the YAML and rerun the docker command after changes.

**Fully offline.** Switch the Embedding provider to **Ollama**, run `ollama pull nomic-embed-text`, and the stack uses no cloud APIs at all.

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/). No source code, no Node.js, no compile step — images are pulled from Docker Hub.

</details>

---

## Connect your AI agents

The Agents section in settings shows every supported harness as a one-click row:

| Agent | Description |
|---|---|
| **Claude Desktop** | Anthropic's desktop chat app |
| **Claude Code** | Anthropic's CLI coding agent |
| **Cursor** | AI-first code editor |
| **Cline** | VS Code autonomous coding extension |
| **Windsurf** | Codeium's agentic IDE |
| **Other MCP-compatible app** | Copy the JSON snippet for Zed, Goose, Codex CLI, or any custom client |

Click **Connect** and HangarX merges its MCP server entry into the client's config file (non-destructively — your other MCP servers are preserved). The `⋯` menu lets you copy the config path, reveal it in Finder/Explorer, copy a JSON snippet for hand-merging, or **Disconnect** to cleanly remove the entry.

After connecting: restart the agent and it'll have these tools available:

| Tool | What the agent can do |
|---|---|
| `cortex_ask` | Ask a natural-language question against your vault |
| `cortex_recall` / `cortex_remember` | Persistent memory the agent can store and retrieve across sessions |
| `cortex_related` | Find notes semantically related to a topic |
| `cortex_search_entities` | Search by entity name (people, projects, concepts) |
| `cortex_paths` | Trace connections between two ideas |
| `cortex_contradictions` | Find conflicting claims across notes |
| `cortex_suggest_links` | Get wikilink suggestions for the current note |
| `cortex_ingest_url` | Pull a URL into the knowledge graph |

---

## Inside Obsidian

You don't *have* to use external agents. The plugin ships with:

- **Ask your vault** (⌘P) — chat over your knowledge graph with citations back to source notes.
- **Related notes pane** — sidebar showing semantically similar notes (not just backlinks).
- **Inline link suggestions** — ghost-text `[[wikilink]]` autocompletes driven by entity matches in your graph; press **Tab** to accept, **Esc** to dismiss.
- **Memory stats** modal — see how many notes, entities, and relationships are in your graph.

---

## Privacy & what gets synced

- **Cloud mode**: notes are sent to the HangarX hosted API for entity extraction and embedding. They're stored in your scoped workspace and never used to train models. Revoke access anytime from [app.hangarx.ai](https://app.hangarx.ai/settings?tab=api-keys).
- **Local mode**: nothing leaves your machine. The Docker stack runs FalkorDB (graph), Postgres + pgvector (embeddings), and the Cortex API. You bring an LLM key (or run Ollama for fully offline).
- **What's excluded by default**: `.cortex/`, `.obsidian/`, `templates/`. Configure include/exclude lists in **What to sync**.
- **Attachments**: images, PDFs, and other binaries referenced by your notes are ingested by default. Toggle off in **Sync attachments**.

---

## Commands

| Command | Description |
|---|---|
| `HangarX: Sync vault to memory layer` | Push changed files to the graph |
| `HangarX: Force re-ingest entire vault` | Re-sync everything (use after a server reset) |
| `HangarX: Connect agents (Claude, Cursor)…` | Jump to the Agents settings panel |
| `HangarX: Memory stats` | Show graph + memory counts |
| `HangarX: Ask your vault` | Open the Q&A chat |
| `HangarX: Ingest URL into knowledge graph` | Scrape a URL and add it to memory |

---

## Troubleshooting

**"This API key was rejected (401)" in Cloud mode.**
Generate a fresh key in the [dashboard](https://app.hangarx.ai/settings?tab=api-keys) and click Test on the API Key field. If you signed in via OAuth, click **Sign out** then **Sign in with HangarX** again.

**Local stack: "Cannot reach http://localhost:3400".**
Make sure Docker Desktop is running and `docker compose ps` shows the `cortex-api` container as healthy. Check `docker compose logs cortex-api` for startup errors. The most common cause is a missing LLM key — confirm `GEMINI_API_KEY` (or whichever provider) is set when you ran `up -d`.

**Local stack: embedding dimension mismatch.**
You changed embedding providers and the existing chunks were embedded with a different model. Run `HangarX: Force re-ingest entire vault` after recreating the container, or wipe the local Postgres volume.

**Agent shows "Connected" but doesn't see HangarX tools.**
Restart the agent fully — Claude Desktop, Cursor, and Windsurf cache MCP servers and only re-read the config on launch. For Claude Code, start a new session.

**Sync is slow.**
Initial syncs are O(notes × LLM latency). Cloud mode uses our infrastructure; local mode is bound by your LLM provider's throughput. Switch the embedding provider to Ollama for faster, free local embeddings.

---

## Architecture & internals

For the technical deep-dive — how entity extraction, multi-hop retrieval, claim graphs, and the MCP bridge actually work — see [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).

---

## Links

- **Dashboard**: [app.hangarx.ai](https://app.hangarx.ai)
- **Marketing site**: [hangarx.ai](https://www.hangarx.ai)
- **Issues / feedback**: open an issue in the [HangarX repo](https://github.com/3-Elements-Design/hangarx-knowledge-graph)
- **Built by**: [HangarX](https://www.hangarx.ai)

---

## License

MIT.
