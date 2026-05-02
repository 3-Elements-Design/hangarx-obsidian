# HangarX for Obsidian

> Ask questions about your vault. Share its knowledge with every AI agent on your machine.

HangarX turns your Obsidian notes into a queryable knowledge graph — then exposes that graph to Claude Desktop, Claude Code, Cursor, Cline, Windsurf, and any other [MCP-compatible](https://modelcontextprotocol.io) agent. Same vault. Every tool. No copy-pasting context between chats.

📖 [Full docs](https://app.hangarx.ai/obsidian) · 🌐 [Dashboard](https://app.hangarx.ai) · 🐛 [Issues](https://github.com/3-Elements-Design/hangarx-obsidian/issues)

---

## Why

You've already written everything: standups, design docs, half-finished thoughts. The bottleneck isn't capturing knowledge — it's making it usable by the agents you use every day.

- **Claude Desktop forgot what you decided last week.** HangarX remembers.
- **Cursor doesn't know your team's conventions.** HangarX answers from your notes.
- **You repeat yourself across every new chat.** HangarX is the one source of truth they all read.

## Who it's for

- **Note-takers** who want a smarter Q&A surface than the built-in search.
- **Agent power users** running 2+ AI tools that should share context.
- **Teams** with a single vault of decisions, runbooks, and architectural notes.
- **Privacy-first users** who want everything to stay on their laptop (Local mode = no cloud, no data leaves your machine).

---

## What it does

| | |
|---|---|
| 💬 **Ask your vault** | Multi-hop chat with citations back to the source notes. Lives in the right sidebar. |
| 🌐 **Native graph integration** | Push chat answers into Obsidian's built-in Graph view — non-matching nodes dim, cited entities stay highlighted. |
| 🔄 **Two-way sync** | Push notes to the graph, pull graph entities back as markdown, or diff the two sides to see what's drifted. |
| 🤖 **MCP bridge** | One-click connect to Claude Desktop, Claude Code, Cursor, Cline, Windsurf — they get tools to query your vault. |
| ✨ **Inline link suggestions** | Ghost-text `[[wikilinks]]` while you type, driven by entity matches in your graph. |
| 🔒 **Local or cloud** | Cloud is one-click OAuth. Local runs everything in Docker on your laptop. |

---

## Install

**Community plugins (recommended).**

1. Settings → **Community plugins → Browse**
2. Search **"HangarX"** → **Install** → **Enable**
3. The first-run onboarding modal walks you through Cloud / Local setup.

<details>
<summary><strong>Other install options</strong></summary>

**BRAT (beta builds).**
Install [BRAT](https://github.com/TfTHacker/obsidian42-brat), then **Add beta plugin** → paste `https://github.com/3-Elements-Design/hangarx-obsidian`.

**Manual.**
Grab `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/3-Elements-Design/hangarx-obsidian/releases) and drop them in `<your-vault>/.obsidian/plugins/hangarx-obsidian/`. Reload Obsidian, enable in Community Plugins.

</details>

---

## Quick start

### Cloud — 60 seconds

Best for trying HangarX out. Sign-in is OAuth, no key copy-paste.

1. Settings → **HangarX → Connection** → Mode: **☁️ Cloud (HangarX hosted)**
2. **Sign in with HangarX** → approve in browser → API key + workspace auto-fill
3. Command palette (⌘P / Ctrl-P) → **HangarX: Sync**
4. Open the **Ask your vault** chat in the right sidebar and ask anything

### Local — fully private

Everything runs in Docker on your machine. Notes never leave the laptop.

1. Settings → **HangarX → Connection** → Mode: **🏠 Local (Docker)**
2. Click **Save Compose to vault** — writes `docker-compose.cortex.yml` next to your notes
3. In a terminal: `docker compose -f docker-compose.cortex.yml up -d`
4. Add at least one LLM key in **LLM provider keys** (Gemini, OpenAI, Anthropic, Kimi, HuggingFace, OpenRouter, xAI, or Ollama for fully offline)
5. Run **HangarX: Sync** from the command palette

> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/). Images are pulled from Docker Hub (`hangarx/cortex-api`) — no source code or Node.js needed.

---

## How it works

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│  Your vault  │  ──►  │  Cortex API  │  ──►  │ Knowledge graph  │
│  (markdown)  │       │  (entity     │       │  FalkorDB +      │
│              │       │  extraction) │       │  pgvector        │
└──────────────┘       └──────────────┘       └──────────────────┘
                              ▲                        ▲
                              │                        │
                       ┌──────┴────────┐       ┌───────┴────────┐
                       │ Obsidian      │       │ External agents│
                       │ chat panel    │       │ (Claude, Cursor│
                       │ + graph view  │       │  Cline, etc.)  │
                       └───────────────┘       └────────────────┘
```

1. **Sync** parses your notes, extracts entities (people, projects, concepts) + relationships, and stores them as a graph alongside vector embeddings.
2. **Ask** runs multi-hop retrieval (graph traversal + semantic search + reranking) over that graph and an LLM composes the answer with citations.
3. **MCP bridge** exposes the same retrieval tools to external agents over a local protocol — they query your vault the same way the in-Obsidian chat does.

---

## Connect external agents

Settings → **Agents** shows every supported harness:

| Agent | One-click |
|---|---|
| Claude Desktop, Claude Code, Cursor, Cline, Windsurf | ✅ |
| Zed, Goose, Codex CLI, custom MCP clients | Copy JSON snippet |

Click **Connect** and HangarX merges its MCP server entry into the agent's config (non-destructively — your other MCP servers stay). Restart the agent and it gets these tools:

| Tool | What the agent can do |
|---|---|
| `cortex_ask` | Natural-language Q&A against your vault |
| `cortex_recall` / `cortex_remember` | Persistent memory across agent sessions |
| `cortex_related` | Find semantically similar notes |
| `cortex_search_entities` | Search by person / project / concept name |
| `cortex_paths` | Trace connections between two ideas |
| `cortex_contradictions` | Find conflicting claims across notes |
| `cortex_suggest_links` | Wikilink suggestions for the current note |
| `cortex_ingest_url` | Pull a URL into the graph |

---

## In-Obsidian features

### Ask your vault

Right-sidebar chat. Multi-hop retrieval with citations. Click an entity chip to open the source note; click a citation to jump to the exact paragraph.

- **Suggested starters** — Catch me up · Trace connections · Surface decisions · Find blind spots
- **Auto-highlight on graph** — toggle the pin on any answer to make every future answer auto-push its cited entities into the Graph view filter
- **Save as note** — drop the answer into `Cortex Chats/`
- **Conversation history** — sessions persist across restarts

### Sync modal

`HangarX: Sync` — one place, five actions:

| Action | What it does |
|---|---|
| **Push** | Vault → graph (changed files only) |
| **Pull** | Graph → vault (entities + relationships as markdown) |
| **Two-way** | Push first, then pull |
| **Diff** | Reconciliation view: vault-only / drifted / graph-only / in-sync |
| **Force re-ingest** | Wipe local sync index and re-push everything |

Push runs are cancellable mid-flight; cancellation propagates to in-flight server workers.

### Inline link suggestions

Type and HangarX shows ghost-text `[[wikilink]]` autocompletes from your graph. **Tab** to accept, **Esc** to dismiss.

---

## Supported LLM providers

Pick any in **Settings → HangarX → LLM provider keys** (BYOK) or in the per-request **LLM (runtime)** panel. Switch on the fly — no container restart.

- 🟦 **Google Gemini** — fast, cheap default
- 🟩 **OpenAI** — GPT-4o, GPT-4.1, o-series
- 🟧 **Anthropic Claude**
- ⬛ **xAI Grok**
- 🟨 **Moonshot Kimi K2.5** — direct
- 🟪 **HuggingFace Inference** — auto-routes Kimi K2.5, Llama 3.3 70B, Qwen 2.5 72B
- 🌐 **OpenRouter** — 200+ models behind one key
- 💻 **Ollama** — fully local (gemma4, llama3.3, qwen2.5, mistral, phi3, …)

---

## Privacy

| | Cloud | Local |
|---|---|---|
| Notes leave your machine | ✓ (sent to HangarX API) | ✗ |
| LLM key required | ✗ (we manage) | ✓ (BYOK) |
| Trained on your data | ✗ | ✗ |
| Revocable | ✓ ([dashboard](https://app.hangarx.ai/settings?tab=api-keys)) | ✓ (delete the container) |

**Excluded by default**: `.cortex/`, `.obsidian/`, `templates/`. Configurable in **What to sync**.
**Attachments**: images, PDFs, and other binaries are ingested by default. Toggle off in **Sync attachments**.

---

## Commands

| Command | Description |
|---|---|
| `HangarX: Ask your vault` | Open the Q&A chat |
| `HangarX: Sync` | Open the multi-purpose sync modal |
| `HangarX: Sync current note` | Push only the active file |
| `HangarX: Diff vault vs knowledge graph` | Open the 4-bucket diff view |
| `HangarX: Pull graph entities into vault` | Materialize entities as markdown |
| `HangarX: Force re-ingest entire vault` | Re-sync everything |
| `HangarX: Connect agents (Claude, Cursor)…` | Jump to the Agents settings panel |
| `HangarX: Knowledge graph stats` | Show graph + memory counts |
| `HangarX: Ingest URL into knowledge graph` | Scrape a URL and add it to the graph |
| `HangarX: Show onboarding` | Reopen the first-run walkthrough |

---

## Troubleshooting

<details>
<summary><strong>"This API key was rejected (401)" in Cloud mode</strong></summary>

Generate a fresh key in the [dashboard](https://app.hangarx.ai/settings?tab=api-keys) and click **Test** on the API Key field. If you signed in via OAuth, **Sign out** then **Sign in with HangarX** again.

</details>

<details>
<summary><strong>"LLM provider API key expired"</strong></summary>

The chat error card surfaces this directly. Open **Settings → HangarX → LLM provider keys**, paste a fresh key in the relevant section. Runtime config updates immediately — no container restart.

</details>

<details>
<summary><strong>HuggingFace 403</strong></summary>

Visit [huggingface.co/settings/inference-providers](https://huggingface.co/settings/inference-providers) and confirm your token has provider access. Paid models (Kimi K2.5 via Novita, Llama 3.3 via Fireworks) need credits — switch to a free serverless model in the runtime panel if not.

</details>

<details>
<summary><strong>Local stack: "Cannot reach http://localhost:3400"</strong></summary>

Make sure Docker Desktop is running and `docker compose ps` shows `cortex-api` as healthy. Check `docker compose logs cortex-api` for startup errors. The most common cause is a missing LLM key — re-save the Compose YAML from settings (it bakes in whichever BYOK keys you've configured) and `docker compose up -d --force-recreate`.

</details>

<details>
<summary><strong>Local stack: embedding dimension mismatch</strong></summary>

You changed embedding providers and existing chunks were embedded with a different model. Run **HangarX: Force re-ingest entire vault**, or wipe the local Postgres volume.

</details>

<details>
<summary><strong>Agent shows "Connected" but doesn't see HangarX tools</strong></summary>

Restart the agent fully. Claude Desktop, Cursor, and Windsurf cache MCP servers and only re-read the config on launch. For Claude Code, start a new session.

</details>

<details>
<summary><strong>"Show on graph" doesn't dim nodes</strong></summary>

Make sure you've synced your vault at least once — dimming requires the cited entities to exist as files. If the graph view was previously corrupted by an older plugin version, the plugin auto-detaches and recreates the leaf — reload Obsidian once.

</details>

<details>
<summary><strong>Sync is slow</strong></summary>

Initial syncs are bound by LLM latency (`O(notes × LLM round-trip)`). Cloud uses our infrastructure; local is bound by your provider. Switch the embedding provider to Ollama for free, fast local embeddings.

</details>

---

## Architecture

For the deep-dive on how entity extraction, multi-hop retrieval, claim graphs, and the MCP bridge actually work, see [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).

## Contributing

Issues and PRs welcome at [github.com/3-Elements-Design/hangarx-obsidian](https://github.com/3-Elements-Design/hangarx-obsidian).

## License

MIT — see [LICENSE](./LICENSE).
