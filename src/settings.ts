import { App, Menu, Notice, Platform, PluginSettingTab, Setting, requestUrl } from 'obsidian';
import type CortexPlugin from './main';
import {
  claudeDesktopConfigPath, claudeCodeConfigPath, cursorConfigPath,
  clineConfigPath, windsurfConfigPath,
  connectClaudeDesktop, connectClaudeCode, connectCursor,
  connectCline, connectWindsurf,
  checkConnection, buildBridgeEntry, disconnectMcpEntry, revealInFileManager,
  type BridgeConfig, type ConnectResult,
} from './services/agent-connect';
import { startSignIn } from './services/oauth-flow';
import { confirmModal } from './services/confirm-modal';
import { ReadmeModal } from './views/readme-modal';

export type ConnectionMode = 'cloud' | 'local';

/** A pluggable agent client we can wire MCP into. Adding a new entry to the
 *  registry in renderAgentConnectCards() is all it takes to surface a row. */
interface AgentHarness {
  /** Stable id, used for restart hints and analytics. */
  id: string;
  /** Display name shown in the row. */
  label: string;
  /** Short description (one line) — what the user gets after connecting. */
  description: string;
  /** Path to the client's MCP config file, or null when not on this platform. */
  configPath: string | null;
  /** Connector that mutates the config file. Returns ConnectResult. */
  connect: () => Promise<ConnectResult>;
}

export const CLOUD_API_URL = 'https://cortex.hangarx.ai';
const LOCAL_API_URL = 'http://localhost:3400';

export type EmbeddingPreset = 'gemini' | 'ollama';

interface EmbeddingPresetConfig {
  provider: string;
  model: string;
}

const EMBEDDING_PRESETS: Record<EmbeddingPreset, EmbeddingPresetConfig> = {
  gemini: { provider: 'gemini', model: 'gemini-embedding-001' },
  ollama: { provider: 'ollama', model: 'nomic-embed-text' },
};

/**
 * Build the docker-compose YAML for the local stack. Includes Postgres+pgvector,
 * FalkorDB, and the cortex-api container. The plugin's API key + connector
 * encryption key are baked in at save-time so users don't have to set env vars.
 */
function buildDockerCompose(
  encryptionKey: string,
  llmEncryptionKey: string,
  embedding: EmbeddingPreset = 'gemini',
): string {
  const e = EMBEDDING_PRESETS[embedding] ?? EMBEDDING_PRESETS.gemini;
  return `# Cortex GraphRAG — Local Stack (single-user)
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
    # Default MAX_QUEUED_QUERIES is 25 — bursty ingestion saturates it and the
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
      # CORS allowlist — must include the Obsidian plugin's origins or
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

export function generateEncryptionKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DOCKER_START_CMD = `docker compose -f docker-compose.cortex.yml up -d --force-recreate`;

/**
 * Slim CortexSettings — Apr 2026 simplification removed:
 *   Multi-device coordination (leader/all, conflict detection, device name)
 *   Inbox sync (Cortex → vault polling)
 *   Version history snapshots
 *   Network policy (cellular/battery)
 *   Graph pull (export graph → markdown)
 *   Daily/Weekly briefs (digest service)
 *   Cloud bridge (cloud → local pull)
 *   Vault ID UI (still auto-generated, just not exposed)
 *   Fast mode (rare; hardcoded false)
 *
 * What remains is the agent-memory core: connect to a Cortex backend, sync the
 * vault, expose to MCP-speaking agents, optionally chat with it.
 */
export interface CortexSettings {
  // Connection
  connectionMode: ConnectionMode;
  apiUrl: string;
  apiKey: string;
  workspaceId: string;
  /** Auto-generated on first run; not exposed in UI. */
  vaultId: string;

  // Path filtering for sync
  excludePatterns: string[];
  includeFolders: string[];

  // Sync behavior
  syncOnStartup: boolean;
  /** Internal — debounce window for the sync scheduler. Not exposed. */
  autoSyncDebounceMs: number;

  // Attachment ingest
  syncAttachments: boolean;
  attachmentMaxBytes: number;

  // Interface
  /** Which side-pane (if any) auto-opens at startup. `chat` is the default. */
  defaultRightPane: 'chat' | 'related' | 'none';
  /** Legacy. Kept for one release to migrate users to defaultRightPane. */
  showRelatedPane: boolean;
  inlineSuggestionsEnabled: boolean;
  /** When on, every chat answer auto-pushes its cited entities into
   *  Obsidian's graph view filter — non-matching nodes dim, matching ones
   *  stay highlighted. Off by default; user can toggle from the chat
   *  composer's gear menu or here in settings. */
  autoShowAnswerOnGraph: boolean;
  /** Chat behavior:
   *    'rag'   — single-shot retrieval-augmented generation (legacy, fastest, default)
   *    'agent' — server runs the canonical `runAgent` harness with tool-calling
   *              (knowledge_graph_search, cortex_paths, optionally web_search).
   *              Higher latency, much smarter on multi-step questions. */
  chatAgentMode: 'rag' | 'agent';
  /** When true (default), simple fact-lookup queries skip the agent loop
   *  and route through the single-pass RAG path even when chatAgentMode
   *  is 'agent'. Big perceived-latency win for ~70% of queries. Set to
   *  false to force every query through the agent loop. */
  chatAutoFastPath: boolean;
  /** When chatAgentMode is 'agent', also expose web_search + web_scrape to
   *  the agent. Off by default — privacy-conscious users may not want their
   *  queries hitting Perplexity. */
  chatAgentWebSearch: boolean;
  /** L8 — skill pack the streaming agent uses. The pack supplies the
   *  system prompt, default tool list, and bounds. `obsidian-chat` is the
   *  vault-aware default; `vault-qa` skips the web entirely; `multi-hop`
   *  enables `delegate` for sub-agents on hard questions. */
  chatAgentSkill: 'obsidian-chat' | 'vault-qa' | 'multi-hop';
  /** When on, agent-mode chats use the SSE streaming endpoint
   *  (`/v1/agent/run/stream`) so per-iteration / per-tool-call cards
   *  render live in the chat panel. Off → non-streaming POST that waits
   *  for the full result. Default on for agent mode. */
  chatStream: boolean;
  /** Timestamp of the first time the onboarding modal was opened. Unset
   *  on a fresh install. Used to gate the auto-open on plugin load — the
   *  modal opens once, then the user has to invoke it via the command. */
  onboardingShownAt?: number;
  /**  User explicitly dismissed the persistent onboarding side panel.
   *   Reachable again via the command palette regardless. */
  onboardingDismissed?: boolean;

  // MCP server (the agent-memory wedge)
  mcpEnabled: boolean;
  mcpPort: number;
  mcpToken: string;

  // Chat + memory output folders (used by MCP server's writeMemoryNote and
  // by vault-sync's exclude list to prevent feedback loops).
  chatExportFolder: string;
  memoryFolder: string;
  writeMemoriesToVault: boolean;
  autoSaveChatToVault: boolean;

  // Graph pull — materialize cloud entities/relationships as markdown so they
  // appear in Obsidian's native graph view. Off by default; user opts in.
  graphPullFolder: string;
  /** When non-empty, only these entity types are pulled. Empty = use the
   *  service's DEFAULT_SEMANTIC_TYPES. */
  graphPullEntityTypes: string[];
  /** Add `cortex_entities: [...]` frontmatter to source notes that mention
   *  graph entities — creates wikilinks back into the pulled entity files. */
  graphPullEnrichSourceNotes: boolean;

  // Local Docker stack — generated on first local-mode entry, baked into
  // the compose YAML when saved.
  connectorEncryptionKey: string;

  /**
   * AES-256-GCM key for encrypting BYOK provider keys at rest in the
   * cortex-api's Postgres `llm_configs` table. Auto-generated on first
   * local-mode entry. The cortex-api container refuses /ai endpoints when
   * NODE_ENV=production (the Docker image default) without this set.
   */
  llmEncryptionKey: string;

  // BYOK — embedded into compose YAML at save-time.
  llmKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    moonshot?: string;
    huggingface?: string;
    openrouter?: string;
    xai?: string;
    /** Reranker provider, not a chat LLM — gates the learned-reranker step. */
    cohere?: string;
    /** Reranker provider, not a chat LLM. */
    jina?: string;
    /** Web-search backend used by the agent's `web_search` tool when the
     *  active LLM provider doesn't have native web search (or as a
     *  fallback). Setting this populates `PERPLEXITY_API_KEY` in the
     *  local docker-compose YAML. */
    perplexity?: string;
    /** Agent-optimized web-search backend (preferred over Perplexity for
     *  agent loops — faster, cheaper per call, 1k/month free tier with
     *  no card required). Populates `TAVILY_API_KEY` in the local
     *  docker-compose YAML. */
    tavily?: string;
  };
  embeddingPreset: EmbeddingPreset;

  // Internal device ID — auto-generated on first run; not exposed.
  deviceId: string;
  deviceName: string;
}

export const DEFAULT_SETTINGS: CortexSettings = {
  connectionMode: 'cloud',
  apiUrl: CLOUD_API_URL,
  apiKey: '',
  workspaceId: '',
  vaultId: '',
  excludePatterns: ['.cortex/', 'templates/'],
  includeFolders: [],
  syncOnStartup: true,
  autoSyncDebounceMs: 2000,
  syncAttachments: true,
  attachmentMaxBytes: 10 * 1024 * 1024,
  defaultRightPane: 'chat',
  showRelatedPane: true,
  inlineSuggestionsEnabled: true,
  autoShowAnswerOnGraph: false,
  chatAgentMode: 'agent',
  chatAutoFastPath: true,
  chatAgentWebSearch: false,
  chatAgentSkill: 'obsidian-chat',
  chatStream: true,
  mcpEnabled: false,
  mcpPort: 7474,
  mcpToken: '',
  chatExportFolder: 'Cortex Chats',
  memoryFolder: 'Cortex Memories',
  writeMemoriesToVault: true,
  autoSaveChatToVault: false,
  graphPullFolder: '.cortex/graph',
  graphPullEntityTypes: [],
  graphPullEnrichSourceNotes: false,
  connectorEncryptionKey: '',
  llmEncryptionKey: '',
  llmKeys: {},
  embeddingPreset: 'gemini',
  deviceId: '',
  deviceName: '',
};

export function defaultDeviceName(): string {
  if (Platform.isMobileApp) return Platform.isIosApp ? 'iOS' : 'Android';
  if (Platform.isMacOS) return 'Mac';
  if (Platform.isWin) return 'Windows';
  if (Platform.isLinux) return 'Linux';
  return 'Desktop';
}

export class CortexSettingTab extends PluginSettingTab {
  /** Surfaced by checkLocalHealth(). */
  lastHealthDetail = '';

  /** Per-subsystem health captured from the /health response body. Drives the
   *  Stack Health panel; null when the API is unreachable so the panel can
   *  show "status unknown — API offline" for everything. */
  lastHealthSubsystems: Record<string, { status: 'ok' | 'down' | 'not_configured'; latencyMs?: number; error?: string }> | null = null;
  lastHealthVersion: string | null = null;

  constructor(app: App, private plugin: CortexPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const mode = s.connectionMode;

    /* ──────────────────────────────────────────────────────────────────
       Milestone-1 IA: 5 user-goal sections, top→down by frequency × stakes.
       Order intentionally puts Connection first (highest-stakes) and
       Power features last (rarely visited). Each section header is
       followed by a one-line preview of the section's current state so
       the user can read status without expanding anything.

       Milestone 2 added: search filter at the top, "Common tasks" entry-
       point row, and `<details>` wrapping for advanced clusters via
       renderAdvanced(). Most users land on the page and never expand
       any of those — average visible-control count drops from 32 to ~12.

       Milestone 3 added: status badges per section (✅/⚠/✗), inline
       dependency warnings (e.g. "Allow web search" warns when no key),
       beta pills on every beta thing, and the search input that
       hides non-matching settings live as the user types.
       ────────────────────────────────────────────────────────────────── */

    // Search bar — hides any .setting-item / .cortex-advanced whose
    // name+desc don't match the query. Keeps section headers visible
    // so the user can see which section a remaining match lives in.
    this.renderSearchBar(containerEl);

    // Common tasks row — bridges users who skipped the onboarding modal
    // by giving direct entry points to the four most common goals.
    this.renderCommonTasksRow(containerEl, s, mode);

    /* ── 1. Connection (was "Settings") ──────────────────────────── */

    const connectionStatus: 'ok' | 'warn' | 'error' = mode === 'cloud'
      ? (s.apiKey ? 'ok' : 'warn')
      : 'ok';
    this.renderSectionHeader(containerEl, 'Connection',
      mode === 'cloud'
        ? `Cloud · ${s.apiKey ? `signed in${s.workspaceId ? ` · ws_${s.workspaceId.slice(0, 6)}` : ''}` : 'sign-in needed'}`
        : `Local · ${s.apiUrl}`,
      connectionStatus,
    );

    new Setting(containerEl)
      .setName('Connection mode')
      .setDesc('Cloud uses the hosted API. Local runs everything on your machine via docker.')
      .addDropdown(d => d
        .addOption('cloud', 'Cloud (hosted)')
        .addOption('local', 'Local (docker)')
        .setValue(mode)
        .onChange(async v => {
          s.connectionMode = v as ConnectionMode;
          if (v === 'cloud') s.apiUrl = CLOUD_API_URL;
          else if (v === 'local') s.apiUrl = LOCAL_API_URL;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (mode === 'cloud') {
      this.renderCloudConnection(containerEl, s);
    }

    if (mode === 'local') {
      this.renderLocalConnection(containerEl, s);
    }

    /* ── 2. Sync (merged "What to sync" + "Sync behavior") ────────── */

    const includedFolderCount = this.plugin.settings.includeFolders.length;
    // Sync needs an authenticated connection in cloud mode to actually
    // do anything — surface that as a warn rather than letting the user
    // silently configure folders that won't push.
    const syncStatus: 'ok' | 'warn' = (mode === 'cloud' && !s.apiKey) ? 'warn' : 'ok';
    this.renderSectionHeader(containerEl, 'Sync',
      `${includedFolderCount === 0 ? 'all folders' : `${includedFolderCount} folder${includedFolderCount === 1 ? '' : 's'}`} · attachments ${this.plugin.settings.syncAttachments ? 'on' : 'off'} · sync on startup ${this.plugin.settings.syncOnStartup ? 'on' : 'off'}`,
      syncStatus,
    );

    // Defaults — the two controls 95% of users actually touch.
    new Setting(containerEl)
      .setName('Include folders')
      .setDesc('Comma-separated folder prefixes. Empty = include everything not excluded.')
      .addText(t => t
        .setValue(this.plugin.settings.includeFolders.join(','))
        .onChange(async v => {
          this.plugin.settings.includeFolders = v.split(',').map(x => x.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sync on startup')
      .setDesc('Run a full vault sync when Obsidian launches. Skips files unchanged since the last sync.')
      .addToggle(t => t
        .setValue(this.plugin.settings.syncOnStartup)
        .onChange(async v => { this.plugin.settings.syncOnStartup = v; await this.plugin.saveSettings(); this.display(); }));

    // Advanced — exclude patterns + attachments toggle. Most users
    // don't touch these; collapsed by default.
    this.renderAdvanced(containerEl, 'Sync — advanced', (host) => {
      new Setting(host)
        .setName('Exclude patterns')
        .setDesc('Comma-separated path prefixes to skip when pushing.')
        .addText(t => t
          .setValue(this.plugin.settings.excludePatterns.join(','))
          .onChange(async v => {
            this.plugin.settings.excludePatterns = v.split(',').map(x => x.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          }));

      new Setting(host)
        .setName('Sync attachments')
        .setDesc('Ingest images, pdfs, and other binaries referenced by your notes.')
        .addToggle(t => t
          .setValue(this.plugin.settings.syncAttachments)
          .onChange(async v => { this.plugin.settings.syncAttachments = v; await this.plugin.saveSettings(); this.display(); }));
    });

    /* ── 3. Knowledge graph (was "Import Cortex graph") ──────────── */

    this.renderSectionHeader(containerEl, 'Knowledge graph',
      this.plugin.settings.graphPullEnrichSourceNotes
        ? `pulling to ${this.plugin.settings.graphPullFolder} · enriching source notes`
        : `pulling to ${this.plugin.settings.graphPullFolder}`,
      'ok',
    );

    const importDesc = containerEl.createEl('p', { cls: 'setting-item-description' });
    importDesc.setText(
      'Pull entities and relationships from your Cortex cloud workspace into your vault as markdown files. ' +
      'Pulled notes appear in Obsidian\'s native graph view, with [[wikilinks]] for every relationship. ' +
      'Re-running is incremental — only changed entities are rewritten.',
    );

    // Knowledge-graph configuration is set-once for most users — folder
    // path, entity-type filter, frontmatter enrichment toggle. Hide
    // them under Advanced so the primary "Run import" buttons below
    // are the visual anchor of this section.
    this.renderAdvanced(containerEl, 'Graph import — advanced', (host) => {
      new Setting(host)
        .setName('Graph folder')
        .setDesc('Where pulled entity files live. Folder is excluded from sync to prevent feedback loops.')
        .addText(t => t
          .setValue(this.plugin.settings.graphPullFolder)
          .setPlaceholder('.cortex/graph')
          .onChange(async v => {
            this.plugin.settings.graphPullFolder = v.trim() || '.cortex/graph';
            await this.plugin.saveSettings();
            this.display();
          }));

      new Setting(host)
        .setName('Entity types')
        .setDesc('Comma-separated list of entity types to pull. Leave empty to pull a sensible default set (concept, person, organization, topic, location, event, …).')
        .addText(t => t
          .setValue(this.plugin.settings.graphPullEntityTypes.join(', '))
          .setPlaceholder('Concept, person, topic')
          .onChange(async v => {
            this.plugin.settings.graphPullEntityTypes = v
              .split(',').map(s => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          }));

      new Setting(host)
        .setName('Enrich source notes')
        .setDesc('Add `cortex_entities` frontmatter to your existing notes that mention pulled entities — creates bidirectional wikilinks.')
        .addToggle(t => t
          .setValue(this.plugin.settings.graphPullEnrichSourceNotes)
          .onChange(async v => {
            this.plugin.settings.graphPullEnrichSourceNotes = v;
            await this.plugin.saveSettings();
            this.display();
          }));
    });

    new Setting(containerEl)
      .setName('Run import')
      .setDesc('Summary is a fast (~50ms) estimate from graph stats. Preview is a full dry-run that fetches every entity for exact diffs. Pull from cloud writes to disk.')
      .addButton(b => b
        .setButtonText('Summary')
        .onClick(() => this.plugin.runGraphPullSummary()))
      .addButton(b => b
        .setButtonText('Preview')
        .onClick(() => this.plugin.runGraphPullPreview()))
      .addButton(b => b
        .setButtonText('Pull from cloud')
        .setCta()
        .onClick(() => this.plugin.runGraphPull()));

    /* ── 4. Chat & Agents (was "Interface" + LLM runtime fold-in) ── */

    const agentBits = this.plugin.settings.chatAgentMode === 'agent'
      ? `${this.plugin.settings.chatAgentSkill} · streaming ${this.plugin.settings.chatStream ? 'on' : 'off'}${this.plugin.settings.chatAgentWebSearch ? ' · web search on' : ''}`
      : 'single-shot RAG';
    this.renderSectionHeader(containerEl, 'Chat & Agents',
      `${this.plugin.settings.chatAgentMode} · ${agentBits}`,
      'ok',
    );

    new Setting(containerEl)
      .setName('Default right pane')
      .setDesc('Which sidebar opens at startup — chat over your knowledge graph, or semantically similar notes for the current file.')
      .addDropdown(d => d
        .addOption('chat', 'Ask your vault')
        .addOption('related', 'Related notes')
        .addOption('none', 'None (open manually)')
        .setValue(this.plugin.settings.defaultRightPane)
        .onChange(async v => {
          this.plugin.settings.defaultRightPane = v as 'chat' | 'related' | 'none';
          // Keep the legacy boolean in sync so older code paths still work.
          this.plugin.settings.showRelatedPane = v === 'related';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Inline link suggestions')
      .setDesc('Show ghost-text [[wikilink]] suggestions while typing — driven by entity matches in your graph. Tab to accept, esc to dismiss.')
      .addToggle(t => t
        .setValue(this.plugin.settings.inlineSuggestionsEnabled)
        .onChange(async v => { this.plugin.settings.inlineSuggestionsEnabled = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Auto-highlight chat answers on graph')
      .setDesc('After every chat answer, automatically push its cited entities into Obsidian\'s graph view filter — non-matching nodes dim, matching ones stay highlighted. Toggle is also accessible from the "show on graph" button on each answer.')
      .addToggle(t => t
        .setValue(this.plugin.settings.autoShowAnswerOnGraph)
        .onChange(async v => { this.plugin.settings.autoShowAnswerOnGraph = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Chat mode')
      .setDesc('Single-shot retrieval (default) is fastest and simplest. The agent mode uses the server-side tool-calling harness — the model decides which tools to call (knowledge graph search, multi-hop paths, optionally web search), iterates, and synthesizes — slower but much better on multi-step questions.')
      .addDropdown(d => d
        .addOption('rag', 'Single-shot retrieval (default)')
        .addOption('agent', 'Tool-calling agent (beta)')
        .setValue(this.plugin.settings.chatAgentMode)
        .onChange(async v => {
          this.plugin.settings.chatAgentMode = v as 'rag' | 'agent';
          await this.plugin.saveSettings();
          // Re-render to show/hide the web-search sub-toggle.
          this.display();
        }));

    if (this.plugin.settings.chatAgentMode === 'agent') {
      // Beta pill cluster + agent-mode dependency warnings live inside
      // a labeled "Agent options" block so the three sub-toggles read
      // as one decision, not three peer rows. Auto-open since the user
      // explicitly chose agent mode above.
      this.renderAdvanced(containerEl, 'Agent options (beta)',
        (host) => {
          const skillSetting = new Setting(host)
            .setName('Agent skill pack')
            .setDesc('Reusable bundle of system prompt + default tools + bounds. "Obsidian chat" is vault-aware with optional web fallback. "vault q&a" stays inside your knowledge graph. "multi-hop" enables sub-agents for hard, decomposable questions.')
            .addDropdown(d => d
              .addOption('obsidian-chat', 'Obsidian chat (default)')
              .addOption('vault-qa', 'Vault q&a (no web)')
              .addOption('multi-hop', 'Multi-hop research (sub-agents)')
              .setValue(this.plugin.settings.chatAgentSkill)
              .onChange(async v => {
                this.plugin.settings.chatAgentSkill = v as 'obsidian-chat' | 'vault-qa' | 'multi-hop';
                await this.plugin.saveSettings();
                this.display();
              }));
          this.renderBetaPill(skillSetting.nameEl);

          const streamSetting = new Setting(host)
            .setName('Stream agent responses')
            .setDesc('When on, agent runs stream live — per-iteration progress, tool-call cards, and the final answer all render as they happen.')
            .addToggle(t => t
              .setValue(this.plugin.settings.chatStream)
              .onChange(async v => { this.plugin.settings.chatStream = v; await this.plugin.saveSettings(); }));
          this.renderBetaPill(streamSetting.nameEl);

          new Setting(host)
            .setName('Allow web search in agent chat')
            .setDesc('When on, the agent can call web_search and web_scrape for current external information. Off by default — privacy-conscious users may not want their chat queries hitting the public web.')
            .addToggle(t => t
              .setValue(this.plugin.settings.chatAgentWebSearch)
              .onChange(async v => { this.plugin.settings.chatAgentWebSearch = v; await this.plugin.saveSettings(); this.display(); }));
          // Dynamic dependency hint — Milestone B replaced the
          // hard-wired "needs PERPLEXITY_API_KEY" message with a live
          // probe of the server: the resolver tells us which backend
          // will actually serve the next call (provider-native vs.
          // Perplexity vs. nothing) and whether it's configured.
          if (this.plugin.settings.chatAgentWebSearch) {
            const hint = host.createDiv({ cls: 'cortex-dep-hint' });
            hint.setText('Checking backend…');
            void this.plugin.client.getWebSearchStatus()
              .then((status: import('./cortex-client').WebSearchStatus) =>
                hint.setText(this.formatWebSearchHint(status)))
              .catch(() => hint.setText('Cannot reach server to confirm web-search backend. Open the dashboard to verify.'));
          }
        },
        { open: true },
      );
    }

    // Runtime LLM provider/model picker — chat-adjacent, advanced cluster.
    this.renderAdvanced(containerEl, 'Runtime LLM (BYOK)',
      (host) => this.renderLlmRuntimeSection(host),
    );

    /* ── 5. Power features (was top-level "Agents" / MCP) ──────── */

    this.renderSectionHeader(containerEl, 'Power features',
      this.plugin.settings.mcpEnabled
        ? `local MCP server on :${this.plugin.settings.mcpPort}`
        : 'local MCP server off',
      this.plugin.settings.mcpEnabled ? 'ok' : null,
    );
    // Wrap MCP/agents bridge stuff in an advanced disclosure — power
    // users opt in. Kept open if mcpEnabled is already on so the
    // running server's controls aren't hidden.
    this.renderAdvanced(containerEl, 'MCP server & agent bridges',
      (host) => this.renderAgentsSection(host),
      { open: this.plugin.settings.mcpEnabled },
    );

    /* ── 6. Help ──────────────────────────────────────────────────── */

    new Setting(containerEl).setName("Help").setHeading();

    new Setting(containerEl)
      .setName('Onboarding')
      .setDesc('Open the persistent get-started panel — connect, sync, run a query, connect external agents.')
      .addButton(b => b
        .setButtonText('Open onboarding panel')
        .onClick(async () => {
          // Clear the dismiss flag so the panel re-opens cleanly even if
          // the user previously dismissed it.
          if (this.plugin.settings.onboardingDismissed) {
            this.plugin.settings.onboardingDismissed = false;
            await this.plugin.saveSettings();
          }
          await this.plugin.activateOnboardingView();
        }));

    new Setting(containerEl)
      .setName('Documentation')
      .setDesc('Quick start, agent setup, troubleshooting, and the full plugin guide.')
      .addButton(b => b
        .setButtonText('View readme')
        .onClick(() => new ReadmeModal(this.app).open()))
      .addButton(b => b
        .setButtonText('Open online')
        .setCta()
        .onClick(() => window.open('https://app.HangarX.ai/obsidian', '_blank')));
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
  private renderSectionHeader(
    parent: HTMLElement,
    title: string,
    preview: string,
    status: 'ok' | 'warn' | 'error' | null = null,
  ): void {
    const wrap = parent.createDiv({ cls: 'cortex-section-header' });
    const titleRow = wrap.createDiv({ cls: 'cortex-section-title-row' });
    if (status) {
      const dot = titleRow.createSpan({ cls: `cortex-section-dot is-${status}` });
      dot.setAttribute('aria-label', `Status: ${status}`);
    }
    // Render a plain styled span instead of Obsidian's Setting → setHeading()
    // wrapper. The wrapper introduced enough nested DOM (.setting-item →
    // .setting-item-info → .setting-item-name) with implicit padding /
    // line-heights that the dot couldn't be reliably centered against
    // the visible glyph height. Plain element gives us full control.
    titleRow.createSpan({ cls: 'cortex-section-title-text', text: title });
    if (preview) {
      wrap.createDiv({ cls: 'cortex-section-preview', text: preview });
    }
  }

  /**
   * Wrap an "advanced" cluster of settings inside a collapsed
   * <details> block. Default closed — power users opt in. The label
   * doubles as the disclosure summary so the layout stays clean.
   */
  private renderAdvanced(
    parent: HTMLElement,
    label: string,
    body: (host: HTMLElement) => void,
    opts: { open?: boolean } = {},
  ): void {
    const details = parent.createEl('details', { cls: 'cortex-advanced' });
    if (opts.open) details.setAttribute('open', '');
    const summary = details.createEl('summary', { cls: 'cortex-advanced-summary' });
    summary.createSpan({ cls: 'cortex-advanced-chevron', text: '▸' });
    summary.createSpan({ cls: 'cortex-advanced-label', text: label });
    const host = details.createDiv({ cls: 'cortex-advanced-body' });
    body(host);
  }

  /**
   * Add a small "beta" pill next to a setting name. Pure visual signal
   * so users know which features are still hardening.
   */
  private renderBetaPill(parent: HTMLElement, label = 'beta'): void {
    parent.createSpan({ cls: 'cortex-beta-pill', text: label });
  }

  /**
   * Search/filter input at the top of the page. As the user types, any
   * .setting-item, .cortex-advanced, or .cortex-section-header whose
   * combined text doesn't include the query is hidden. Matching
   * controls cause their parent advanced disclosure to auto-expand so
   * the result is actually visible.
   */
  private renderSearchBar(containerEl: HTMLElement): void {
    const wrap = containerEl.createDiv({ cls: 'cortex-settings-search' });
    const input = wrap.createEl('input', {
      type: 'search',
      attr: { placeholder: 'Search settings…', 'aria-label': 'Search settings' },
      cls: 'cortex-settings-search-input',
    });
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const items = containerEl.querySelectorAll<HTMLElement>('.setting-item');
      const advancedBlocks = containerEl.querySelectorAll<HTMLElement>('.cortex-advanced');
      // First pass: per-item show/hide based on text match. Uses the
      // .is-hidden utility class instead of an inline style so the
      // obsidianmd ESLint plugin's no-style-assignment rule passes.
      items.forEach((el) => {
        if (!q) {
          el.removeClass('is-hidden');
          return;
        }
        el.toggleClass('is-hidden', !el.innerText.toLowerCase().includes(q));
      });
      // Auto-expand any advanced block that contains a matching item.
      advancedBlocks.forEach((det) => {
        if (!q) return;
        const hasMatch = Array.from(det.querySelectorAll<HTMLElement>('.setting-item'))
          .some(item => !item.classList.contains('is-hidden'));
        if (hasMatch) det.setAttribute('open', '');
      });
    });
  }

  /**
   * "Common tasks" row at the top of the page — direct entry points
   * for the four most common things people open settings to do. Each
   * task scrolls to its anchor section by id; the section h3s carry
   * a `data-anchor` attribute matched here.
   */
  private renderCommonTasksRow(
    containerEl: HTMLElement,
    s: CortexSettings,
    mode: ConnectionMode,
  ): void {
    const tasksWrap = containerEl.createDiv({ cls: 'cortex-common-tasks' });
    tasksWrap.createDiv({ cls: 'cortex-common-tasks-label', text: 'Common tasks' });
    const buttons = tasksWrap.createDiv({ cls: 'cortex-common-tasks-row' });

    const mkBtn = (label: string, onClick: () => void): HTMLButtonElement => {
      const b = buttons.createEl('button', { cls: 'cortex-common-tasks-btn', text: label });
      b.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
      return b;
    };

    const isAuthed = mode === 'cloud' ? !!s.apiKey : true;
    const labelConnect = mode === 'cloud' && !isAuthed ? 'Sign in' : 'Connection';

    // Helper — closes the settings modal/tab so the user actually sees
    // the thing they just asked for. Settings runs inside Obsidian's
    // SettingsTab which sits behind a backdrop; without dismissing it
    // the user clicks "Try a chat" and stares at the same settings UI
    // wondering why nothing happened. Cast the SettingTab → its parent
    // Setting modal which has `.close()` from Obsidian's Modal API.
    const closeSettings = () => {
      const setting = (this.plugin.app as unknown as {
        setting: { close?: () => void };
      }).setting;
      setting?.close?.();
    };

    // Run a real command by id. Obsidian command ids are
    // `<plugin-id>:<command-id>` — our plugin id is `hangarx`.
    const runCommand = (id: string) => {
      void (this.plugin.app as unknown as {
        commands: { executeCommandById(id: string): boolean };
      }).commands.executeCommandById(id);
    };

    mkBtn(labelConnect, () => this.scrollToSection('Connection'));
    mkBtn('Run a sync', () => {
      // Open the sync modal so the user can pick scope + see progress,
      // rather than firing a silent background sync.
      closeSettings();
      runCommand('hangarx:cortex-1-sync');
    });
    mkBtn('Try a chat', () => {
      // Open the chat side panel — the most common thing settings
      // visitors actually want next. Closes settings first so the
      // panel becomes visible (otherwise it activates behind the
      // settings modal).
      closeSettings();
      runCommand('hangarx:cortex-ask');
    });
    mkBtn('Connect agents (MCP)', () => this.scrollToSection('Power features'));
  }

  /** Scroll a section header into view by its title text. Used by the
   *  Common-tasks buttons. Falls back gracefully if the title isn't
   *  found (e.g. during a partial render). */
  private scrollToSection(title: string): void {
    const headers = this.containerEl.querySelectorAll<HTMLElement>('.cortex-section-header h3');
    for (const h of Array.from(headers)) {
      if (h.textContent === title) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Brief highlight pulse so the user's eye lands on the right place.
        const wrap = h.closest('.cortex-section-header');
        if (wrap) {
          wrap.classList.add('is-flash');
          window.setTimeout(() => wrap.classList.remove('is-flash'), 1200);
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
  private renderCloudConnection(containerEl: HTMLElement, s: CortexSettings): void {
    const isAuthed = !!s.apiKey;

    if (!isAuthed) {
      // Pre-auth: full intro pane.
      const intro = containerEl.createDiv({ cls: 'cortex-cloud-intro' });
      intro.createEl('p', {
        cls: 'setting-item-description',
        text: 'Sign in to auto-create an API key and pick your workspace, or paste an existing key below.',
      });
      const introActions = intro.createDiv({ cls: 'cortex-cloud-intro-actions' });
      const signInBtn = introActions.createEl('button', {
        text: 'Sign in with hangarx',
        cls: 'mod-cta',
      });
      signInBtn.addEventListener('click', () => { void this.startInteractiveSignIn(signInBtn, s); });
      const dashBtn = introActions.createEl('button', { text: 'Open dashboard ↗' });
      dashBtn.addEventListener('click', () => {
        window.open('https://app.HangarX.ai/settings?tab=api-keys', '_blank');
      });

      // Manual-paste fallback fields stay visible — pre-auth users may already have a key.
      const statusBadge = intro.createDiv({ cls: 'cortex-cloud-status' });
      this.renderCloudCredentialFields(containerEl, s, statusBadge);
      return;
    }

    // Post-auth: compact status row + advanced disclosure.
    const compact = containerEl.createDiv({ cls: 'cortex-cloud-compact' });
    const statusBadge = compact.createDiv({ cls: 'cortex-cloud-status' });
    void this.validateCloudKey(statusBadge);

    const actions = compact.createDiv({ cls: 'cortex-cloud-compact-actions' });
    const dashBtn = actions.createEl('button', { text: 'Open dashboard ↗' });
    dashBtn.addEventListener('click', () => {
      window.open('https://app.HangarX.ai/settings?tab=api-keys', '_blank');
    });
    const signOutBtn = actions.createEl('button', { text: 'Sign out' });
    signOutBtn.addEventListener('click', () => { void (async () => {
      s.apiKey = '';
      s.workspaceId = '';
      await this.plugin.saveSettings();
      this.display();
    })(); });

    const advanced = containerEl.createEl('details', { cls: 'cortex-cloud-advanced' });
    advanced.createEl('summary', { text: 'Advanced — API key, workspace ID' });
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
  private renderLocalConnection(containerEl: HTMLElement, s: CortexSettings): void {
    // Local mode is auth-disabled (server runs with LOCAL_AUTH_DISABLED=true,
    // bound to 127.0.0.1 only — see compose YAML). The saved cloud apiKey is
    // intentionally preserved so a round-trip Cloud → Local → Cloud doesn't
    // lose the user's credentials. The cortex-client tolerates a non-empty
    // apiKey against an auth-disabled server (the server just ignores it).
    if (!s.connectorEncryptionKey) {
      s.connectorEncryptionKey = generateEncryptionKey();
      void this.plugin.saveSettings();
    }
    if (!s.llmEncryptionKey) {
      s.llmEncryptionKey = generateEncryptionKey();
      void this.plugin.saveSettings();
    }
    if (!s.workspaceId) {
      s.workspaceId = 'default';
      void this.plugin.saveSettings();
    }

    // Status pill (red/green) — always at top, always visible.
    const statusEl = containerEl.createDiv({ cls: 'cortex-local-status' });
    const dot = statusEl.createSpan({ cls: 'cortex-status-dot' });
    const statusText = statusEl.createSpan({ cls: 'cortex-status-text' });
    const retryBtn = statusEl.createEl('button', {
      cls: 'cortex-status-retry',
      text: 'Retry',
      attr: { 'aria-label': 'Retry connection check' },
    });

    // Stack health + recovery — re-rendered after every probe. Mounted into
    // a stable wrapper div so runCheck() can swap its contents without
    // disturbing the cards above/below.
    const stackHealthWrap = containerEl.createDiv({ cls: 'cortex-stack-health-wrap' });

    // Setup wizard — visible only when the stack is down. Walks new users
    // through: 1. add a provider key, 2. save Compose file, 3. run command.
    const setupCard = this.renderLocalSetupCard(containerEl, s);

    // Running-state confirmation — visible only when the stack is reachable.
    // Without this, a successful first-run looks identical to a half-finished
    // one, which is the most common confusion for new users.
    const runningCard = this.renderLocalRunningCard(containerEl, s);

    const runCheck = async (): Promise<void> => {
      dot.removeClass('cortex-status-ok');
      dot.removeClass('cortex-status-err');
      dot.addClass('cortex-status-checking');
      statusText.textContent = 'Checking connection…';
      retryBtn.setAttr('disabled', 'true');
      const ok = await this.checkLocalHealth(s.apiUrl);
      dot.removeClass('cortex-status-checking');
      dot.addClass(ok ? 'cortex-status-ok' : 'cortex-status-err');
      statusText.textContent = this.lastHealthDetail ||
        (ok ? `Connected to ${s.apiUrl}` : `Cannot reach ${s.apiUrl}`);
      retryBtn.removeAttribute('disabled');
      setupCard.toggleClass('is-hidden', ok);
      runningCard.toggleClass('is-hidden', !ok);
      // Re-render Stack health from the latest probe response.
      this.renderStackHealthPanel(stackHealthWrap, s, ok);
    };
    retryBtn.addEventListener('click', () => void runCheck());
    void runCheck();

    // Provider keys (BYO) — required to make the stack useful. Always
    // visible; the setup card's "Add a key" jump-link scrolls here.
    this.renderProviderKeysSection(containerEl, s);

    // Connection details — diagnostic surface. Collapsed by default; auto-
    // opens when the compose file is out of sync (banner inside guides the
    // rebuild). Holds the API Key, the (re-)save Compose row, and the truly
    // set-once fields (API URL, Workspace ID).
    this.renderConnectionDetails(containerEl, s);
  }

  /**
   * Three-step setup card shown when the local stack isn't running. Order
   * matters: provider key first (otherwise the stack starts but can't extract
   * anything), then save the YAML, then run the command. Returns the wrapping
   * element so the caller can hide it once the stack is healthy.
   */
  private renderLocalSetupCard(containerEl: HTMLElement, s: CortexSettings): HTMLElement {
    const hero = containerEl.createDiv({ cls: 'cortex-local-hero' });
    hero.createDiv({ cls: 'cortex-local-hero-title', text: 'Set up HangarX in three steps' });
    hero.createDiv({
      cls: 'cortex-local-hero-sub',
      text: 'HangarX runs Postgres, FalkorDB, and the Cortex API on your machine via Docker. ' +
            'Pulls images from Docker Hub — no source code needed.',
    });

    const configuredKeys = (Object.keys(s.llmKeys) as Array<keyof CortexSettings['llmKeys']>)
      .filter(k => !!s.llmKeys[k]);
    const hasKey = configuredKeys.length > 0;

    // 1. Add a provider key — gate that's actually load-bearing.
    const step1 = hero.createDiv({ cls: 'cortex-local-hero-step' });
    step1.createSpan({ cls: 'cortex-local-hero-step-num', text: '1.' });
    const step1Body = step1.createDiv({ cls: 'cortex-local-hero-step-body' });
    step1Body.createDiv({
      text: hasKey
        ? `Add an LLM provider key — ✓ ${configuredKeys.length} configured`
        : 'Add an LLM provider key',
      cls: 'cortex-local-hero-step-label',
    });
    step1Body.createDiv({
      cls: 'setting-item-description',
      text: hasKey
        ? 'Used for entity extraction and graph queries. You can add more below.'
        : 'Required so HangarX can read your notes. Gemini has a free tier — fastest to start.',
    });
    const step1Actions = step1Body.createDiv({ cls: 'cortex-local-hero-step-actions' });
    const jumpToKeysBtn = step1Actions.createEl('button', {
      text: hasKey ? 'Manage keys ↓' : 'Add a key ↓',
      cls: hasKey ? '' : 'mod-cta',
    });
    jumpToKeysBtn.addEventListener('click', () => {
      const target = containerEl.querySelector<HTMLElement>('[data-cortex-keys-anchor]');
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Open the disclosure if the user has any keys (it's already open when none).
      if (target.instanceOf(HTMLDetailsElement)) target.open = true;
    });

    // 2. Save the Compose file.
    const step2 = hero.createDiv({ cls: 'cortex-local-hero-step' });
    step2.createSpan({ cls: 'cortex-local-hero-step-num', text: '2.' });
    const step2Body = step2.createDiv({ cls: 'cortex-local-hero-step-body' });
    step2Body.createDiv({ text: 'Save docker-compose.cortex.yml to your vault', cls: 'cortex-local-hero-step-label' });
    step2Body.createDiv({
      cls: 'setting-item-description',
      text: 'Bakes your API key + provider keys into the file. Re-save anytime they change.',
    });
    const step2Actions = step2Body.createDiv({ cls: 'cortex-local-hero-step-actions' });
    const saveBtn = step2Actions.createEl('button', { text: 'Save to vault', cls: 'mod-cta' });
    saveBtn.addEventListener('click', () => { void (async () => {
      try {
        const path = 'docker-compose.cortex.yml';
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        saveBtn.setText('✓ saved');
        window.setTimeout(() => saveBtn.setText('Save to vault'), 2000);
      } catch (e) {
        saveBtn.setText('Failed — check console');
        console.error('[Cortex] Failed to write compose file:', e);
      }
    })(); });
    const copyYamlBtn = step2Actions.createEl('button', { text: 'Copy YAML' });
    copyYamlBtn.addEventListener('click', () => { void (async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      copyYamlBtn.setText('Copied');
      window.setTimeout(() => copyYamlBtn.setText('Copy YAML'), 1400);
    })(); });

    // 3. Run docker compose.
    const step3 = hero.createDiv({ cls: 'cortex-local-hero-step' });
    step3.createSpan({ cls: 'cortex-local-hero-step-num', text: '3.' });
    const step3Body = step3.createDiv({ cls: 'cortex-local-hero-step-body' });
    step3Body.createDiv({ text: 'Run this in your vault folder:', cls: 'cortex-local-hero-step-label' });
    const codeWrap = step3Body.createDiv({ cls: 'cortex-mcp-code-wrap' });
    const copyCmdBtn = codeWrap.createEl('button', { cls: 'cortex-mcp-copy', text: 'Copy' });
    copyCmdBtn.addEventListener('click', () => { void (async () => {
      await navigator.clipboard.writeText(DOCKER_START_CMD);
      copyCmdBtn.textContent = 'Copied';
      copyCmdBtn.addClass('is-copied');
      window.setTimeout(() => {
        copyCmdBtn.textContent = 'Copy';
        copyCmdBtn.removeClass('is-copied');
      }, 1400);
    })(); });
    codeWrap.createEl('pre').createEl('code', { text: DOCKER_START_CMD });

    return hero;
  }

  /**
   * Success card shown when the local stack is reachable. Confirms what's
   * happening and points to the next obvious action so first-time users know
   * they've crossed the finish line.
   */
  private renderLocalRunningCard(containerEl: HTMLElement, s: CortexSettings): HTMLElement {
    const card = containerEl.createDiv({ cls: 'cortex-local-running-card' });
    card.addClass('cortex-success-card');
    card.createDiv({
      text: '✓ Local stack running',
      cls: 'cortex-settings-card-title',
    });
    card.createDiv({
      text: `Connected to ${s.apiUrl}. Your vault is ready to be searched and indexed by AI agents.`,
      cls: 'cortex-settings-card-body',
    });
    card.createDiv({
      text: 'Verify with Cmd/Ctrl+P → "HangarX: Memory stats". Manage agents under the Agents section below.',
      cls: 'cortex-settings-card-footnote',
    });
    // Per-vault isolation badge — explains how this vault is scoped on
    // the local cortex-api so two vaults on the same machine never share
    // data. The vaultId is used as the workspace identifier on every
    // request; existing Phase 3.5 tenancy filtering does the isolation.
    if (s.vaultId) {
      const scope = card.createDiv({ cls: 'cortex-local-vault-scope' });
      const label = scope.createSpan({ cls: 'cortex-local-vault-scope-label' });
      label.setText('Vault scope: ');
      const code = scope.createEl('code', { cls: 'cortex-local-vault-scope-id' });
      code.setText(`vault_${s.vaultId.slice(0, 8)}`);
      const hint = scope.createDiv({ cls: 'cortex-local-vault-scope-hint' });
      hint.setText(
        'Each vault on this machine gets its own scope so notes from a different vault never leak into your queries. Auto-generated; resetting it creates a fresh, empty graph for this vault.',
      );
      const reset = scope.createEl('button', {
        cls: 'cortex-local-vault-scope-reset',
        text: 'Reset scope',
      });
      reset.addEventListener('click', () => { void (async () => {
        const ok = await confirmModal(this.plugin.app, {
          title: 'Reset vault scope?',
          body: 'A new vaultId will be generated. The existing scoped data on the local server will be orphaned (not deleted, but unreachable from this vault). Use this only when you intentionally want a fresh graph.',
          confirmText: 'Reset',
          destructive: true,
        });
        if (!ok) return;
        s.vaultId = crypto.randomUUID();
        await this.plugin.saveSettings();
        this.display();
      })(); });
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
  private renderStackHealthPanel(
    parent: HTMLElement,
    s: CortexSettings,
    apiReachable: boolean,
  ): void {
    parent.empty();
    if (s.connectionMode !== 'local') return;

    const subs = this.lastHealthSubsystems;
    const someDown = subs
      ? Object.entries(subs).some(([, v]) => v.status === 'down')
      : !apiReachable;

    // When everything's healthy and the API is up, render a quiet collapsed
    // strip — users don't need recovery options to be loud when there's no
    // problem to recover from.
    const wrap = parent.createEl('details', { cls: 'cortex-stack-health' });
    if (!apiReachable || someDown) wrap.setAttr('open', '');
    const summary = wrap.createEl('summary', { cls: 'cortex-stack-health-summary' });
    const dot = summary.createSpan({ cls: 'cortex-stack-health-dot' });
    if (!apiReachable) dot.addClass('is-offline');
    else if (someDown) dot.addClass('is-degraded');
    else dot.addClass('is-ok');
    if (!apiReachable) {
      summary.createSpan({ text: 'Stack health — API offline' });
    } else if (someDown) {
      const downCount = subs
        ? Object.values(subs).filter(v => v.status === 'down').length
        : 0;
      summary.createSpan({ text: `Stack health — ${downCount} ${downCount === 1 ? 'service' : 'services'} degraded` });
    } else {
      summary.createSpan({ text: 'Stack health — all services healthy' });
    }
    if (this.lastHealthVersion) {
      summary.createSpan({
        cls: 'cortex-stack-health-version',
        text: `cortex-api ${this.lastHealthVersion}`,
      });
    }

    const body = wrap.createDiv({ cls: 'cortex-stack-health-body' });

    // Per-service rows.
    const services = body.createDiv({ cls: 'cortex-stack-health-services' });
    // The single-user local stack ships with ANALYTICS_STORE_TYPE=memory, so
    // ClickHouse is intentionally skipped — don't surface it as a "?" row in
    // the health panel where it just looks like a half-broken service. If a
    // user opts back into ClickHouse by editing the compose YAML, the row
    // can be re-added here.
    const serviceRows: Array<{ name: string; label: string }> = [
      { name: 'cortex-api', label: 'cortex-api' },
      { name: 'falkordb', label: 'falkordb (graph)' },
      { name: 'postgres', label: 'postgres' },
    ];
    for (const svc of serviceRows) {
      const row = services.createDiv({ cls: 'cortex-stack-health-service' });
      const icon = row.createSpan({ cls: 'cortex-stack-health-service-icon' });

      let statusText = '';
      if (svc.name === 'cortex-api') {
        if (apiReachable) {
          icon.addClass('is-ok');
          icon.setText('✓');
          statusText = 'Responding';
        } else {
          icon.addClass('is-down');
          icon.setText('✗');
          statusText = 'Not responding';
        }
      } else if (!apiReachable) {
        icon.addClass('is-unknown');
        icon.setText('?');
        statusText = 'Unknown (api offline)';
      } else if (subs && subs[svc.name]) {
        const sub = subs[svc.name];
        if (sub.status === 'ok') {
          icon.addClass('is-ok');
          icon.setText('✓');
          statusText = sub.latencyMs != null ? `Connected · ${sub.latencyMs}ms` : 'Connected';
        } else if (sub.status === 'not_configured') {
          icon.addClass('is-skip');
          icon.setText('—');
          statusText = 'Not configured (skipped)';
        } else {
          icon.addClass('is-down');
          icon.setText('✗');
          statusText = sub.error
            ? `Down — ${sub.error}`
            : 'Down (no error reported)';
        }
      } else {
        icon.addClass('is-unknown');
        icon.setText('?');
        statusText = 'Unknown';
      }
      row.createSpan({ cls: 'cortex-stack-health-service-name', text: svc.label });
      row.createSpan({ cls: 'cortex-stack-health-service-status', text: statusText });
    }

    // Recovery commands. Tailor the *primary* command to the symptom:
    //   - API offline → restart command
    //   - Some subsystem down → restart command
    //   - All ok → no primary, just collapsed reference
    this.renderRecoveryCommands(body, s, apiReachable, someDown);

    // Quick action: reveal the docker-compose YAML in the OS file manager
    // so users can find it without `pwd`-ing through their vault.
    const ymlPath = 'docker-compose.cortex.yml';
    const ymlExists = !!this.plugin.app.vault.getAbstractFileByPath(ymlPath);
    const actions = body.createDiv({ cls: 'cortex-stack-health-actions' });
    if (ymlExists) {
      // "Show recent logs" — runs `docker compose logs --tail=200 cortex-api`
      // via Node's child_process and renders the output in a scrollable code
      // block right inside the panel. Desktop Obsidian only (mobile lacks
      // child_process); on mobile the user can still use the Copy command.
      const adapter = this.plugin.app.vault.adapter as unknown as { getFullPath?(p: string): string };
      const fullYmlPath = adapter.getFullPath?.(ymlPath);
      if (Platform.isDesktopApp && fullYmlPath) {
        const logsBtn = actions.createEl('button', { text: 'Show recent logs', cls: 'mod-cta' });
        logsBtn.addEventListener('click', () => void this.showRecentLogs(logsBtn, body, fullYmlPath));
      }

      // Docker Desktop deep-link. macOS/Windows installs respond to
      // `docker-desktop://` URLs that route to specific UI surfaces.
      // Best-effort — silently no-op on systems without Docker Desktop.
      const dockerBtn = actions.createEl('button', { text: 'Open in docker desktop' });
      dockerBtn.addEventListener('click', () => void this.openDockerDesktop());

      const revealBtn = actions.createEl('button', { text: 'Reveal docker-compose.cortex.yml' });
      revealBtn.addEventListener('click', () => {
        if (fullYmlPath) {
          const appWithReveal = this.plugin.app as unknown as { showInFolder?(p: string): void };
          if (typeof appWithReveal.showInFolder === 'function') {
            appWithReveal.showInFolder(fullYmlPath);
          } else {
            new Notice(`docker-compose.cortex.yml lives at: ${fullYmlPath}`);
          }
        }
      });
    } else {
      const hint = actions.createDiv({ cls: 'cortex-stack-health-yml-hint' });
      hint.createSpan({
        text: 'No docker-compose.cortex.yml in your vault yet — run "Save to vault" in step 2 above.',
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
  private async openDockerDesktop(): Promise<void> {
    if (!Platform.isDesktopApp) {
      new Notice('Docker desktop launch is desktop-only.');
      return;
    }

    const winReq = (window as unknown as { require?: (m: string) => unknown }).require;
    const cp = winReq?.('child_process') as
      | typeof import('child_process')
      | undefined;
    if (!cp) {
      new Notice('Child_process unavailable. Open docker desktop manually.');
      return;
    }

    // Try Electron's shell first — it understands the docker-desktop://
    // URL on systems where it works, and falls back to OS handlers
    // gracefully on systems where it doesn't.
    try {
      const electron = winReq?.('electron') as { shell?: { openExternal?(url: string): Promise<void> } } | undefined;
      if (electron?.shell?.openExternal) {
        await electron.shell.openExternal('docker-desktop://dashboard/containers')
          .catch(() => { /* fall through to native launcher */ });
      }
    } catch { /* fall through */ }

    // Native launchers — the reliable path. Each spawn detaches so
    // Docker Desktop's startup doesn't block on the Obsidian process.
    const tryLaunch = (cmd: string, args: string[]): Promise<boolean> => new Promise(resolve => {
      try {
        const child = cp.spawn(cmd, args, { detached: true, stdio: 'ignore' });
        child.on('error', () => resolve(false));
        child.unref();
        // No "success" event from spawn — assume the OS handler took it.
        // If the binary doesn't exist, the 'error' handler fires within
        // ~50ms; otherwise the launcher is in flight.
        window.setTimeout(() => resolve(true), 200);
      } catch {
        resolve(false);
      }
    });

    if (Platform.isMacOS) {
      const ok = await tryLaunch('open', ['-a', 'Docker']);
      if (ok) {
        new Notice('Launched docker desktop.');
        return;
      }
      new Notice('Couldn\'t launch docker desktop. Open it manually from applications.');
      return;
    }

    if (Platform.isWin) {
      // PowerShell `Start-Process` resolves the friendly name via the
      // Start Menu / shell apps, which works regardless of where Docker
      // Desktop is installed.
      const ok = await tryLaunch('powershell', ['-NoProfile', '-Command', 'Start-Process "Docker Desktop"'])
        || await tryLaunch('cmd', ['/c', 'start', '', 'Docker Desktop']);
      if (ok) {
        new Notice('Launched docker desktop.');
        return;
      }
      new Notice('Couldn\'t launch docker desktop. Open it from the start menu.');
      return;
    }

    if (Platform.isLinux) {
      const ok = await tryLaunch('docker-desktop', [])
        || await tryLaunch('xdg-open', ['docker-desktop://dashboard/containers']);
      if (ok) {
        new Notice('Launched docker desktop.');
        return;
      }
      new Notice('Couldn\'t launch Docker Desktop. Run `docker-desktop` from a terminal.');
      return;
    }

    new Notice('Unsupported platform for docker desktop launch.');
  }

  private async showRecentLogs(
    btn: HTMLButtonElement,
    body: HTMLElement,
    composeFilePath: string,
  ): Promise<void> {
    btn.setAttr('disabled', 'true');
    btn.setText('Loading…');

    // Wipe any prior log block so re-clicking refreshes rather than stacking.
    body.querySelectorAll('.cortex-stack-health-logs').forEach(el => el.remove());

    const container = body.createDiv({ cls: 'cortex-stack-health-logs' });
    container.createDiv({ cls: 'cortex-stack-health-logs-header', text: 'docker compose logs --tail=200 cortex-api' });
    const pre = container.createEl('pre', { cls: 'cortex-stack-health-logs-pre' });
    const code = pre.createEl('code', { text: 'Running…' });

    try {
      // Lazy require — `child_process` doesn't exist on mobile, and the
      // dynamic import keeps esbuild from complaining about bundling Node
      // builtins for the mobile target.
      const winReq = (window as unknown as { require?: (m: string) => unknown }).require;
      const cp = winReq?.('child_process') as
        | typeof import('child_process')
        | undefined;
      const path = winReq?.('path') as typeof import('path') | undefined;
      if (!cp || !path) {
        code.setText('Child_process unavailable on this platform — copy the command above and run it in a terminal.');
        return;
      }

      const cwd = path.dirname(composeFilePath);
      const fileName = path.basename(composeFilePath);

      const stdout = await new Promise<string>((resolve, reject) => {
        cp.execFile(
          'docker',
          ['compose', '-f', fileName, 'logs', '--tail=200', '--no-color', 'cortex-api'],
          { cwd, timeout: 10_000, maxBuffer: 2 * 1024 * 1024 },
          (err, out, errOut) => {
            // `docker compose logs` exits 0 even when there are no containers,
            // so treat any captured stdout/stderr as the body. Only fail on
            // ENOENT (docker not installed) or hard timeouts.
            if (err && !out && !errOut) {
              const reason = err instanceof Error
                ? err
                : new Error(typeof err === 'string' ? err : 'docker compose logs failed');
              return reject(reason);
            }
            resolve((out) + (errOut ? `\n--- stderr ---\n${errOut}` : ''));
          },
        );
      });

      code.empty();
      code.setText(stdout.trim() || '(no log output — is the container running?)');
      pre.scrollTop = pre.scrollHeight;
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      code.empty();
      const msg = err.code === 'ENOENT'
        ? 'docker not found on PATH. Make sure Docker Desktop is installed and the `docker` CLI is reachable from your shell.'
        : `Couldn't fetch logs: ${err.message ?? String(e)}`;
      code.setText(msg);
    } finally {
      btn.removeAttribute('disabled');
      btn.setText('Refresh logs');
    }
  }

  /** Render the copy-able command blocks. Top section is the "most likely
   *  to help" command for the current symptom; bottom is the always-shown
   *  reference list of all common commands. */
  private renderRecoveryCommands(
    parent: HTMLElement,
    _s: CortexSettings,
    apiReachable: boolean,
    someDown: boolean,
  ): void {
    // Path prefix — getBasePath isn't on the public types but is implemented
    // by the FileSystemAdapter on desktop. We use it for the cd helper.
    const adapter = this.plugin.app.vault.adapter as unknown as { getBasePath?(): string };
    const vaultPath = adapter.getBasePath?.() ?? '<your-vault-folder>';
    const yml = 'docker-compose.cortex.yml';
    const cdPrefix = `cd "${vaultPath}" && \\\n  `;

    const recovery = parent.createDiv({ cls: 'cortex-stack-health-recovery' });
    if (!apiReachable || someDown) {
      const headline = !apiReachable
        ? 'API isn\'t responding. Try the restart command first:'
        : 'A service is degraded. Try a targeted restart:';
      recovery.createDiv({ cls: 'cortex-stack-health-recovery-headline', text: headline });

      const primaryCmd = !apiReachable
        ? `${cdPrefix}docker compose -f ${yml} up -d`
        : `${cdPrefix}docker compose -f ${yml} restart`;
      this.renderCommandRow(recovery, 'Restart the stack', primaryCmd, true);
    }

    // Always-show reference commands, collapsed if everything's fine.
    const moreWrap = recovery.createEl('details', { cls: 'cortex-stack-health-recovery-more' });
    if (!apiReachable || someDown) moreWrap.setAttr('open', '');
    moreWrap.createEl('summary', { text: 'More recovery commands' });

    this.renderCommandRow(
      moreWrap,
      'See what\'s running',
      `${cdPrefix}docker compose -f ${yml} ps`,
    );
    this.renderCommandRow(
      moreWrap,
      'Tail recent cortex-api logs',
      `${cdPrefix}docker compose -f ${yml} logs --tail=200 cortex-api`,
    );
    this.renderCommandRow(
      moreWrap,
      'Force-recreate (after YAML change)',
      `${cdPrefix}docker compose -f ${yml} up -d --force-recreate`,
    );
    this.renderCommandRow(
      moreWrap,
      'Pull the latest image',
      `${cdPrefix}docker compose -f ${yml} pull && \\\n  docker compose -f ${yml} up -d`,
    );
    this.renderCommandRow(
      moreWrap,
      'Wipe volumes + start fresh (destructive — graph data is lost)',
      `${cdPrefix}docker compose -f ${yml} down -v && \\\n  docker compose -f ${yml} up -d`,
      false,
      true,
    );
  }

  /** One labeled command block with a Copy button. `destructive` adds a
   *  warning border so the wipe command stands out from the safe ones. */
  private renderCommandRow(
    parent: HTMLElement,
    label: string,
    command: string,
    primary = false,
    destructive = false,
  ): void {
    const row = parent.createDiv({ cls: 'cortex-stack-health-cmd' });
    if (primary) row.addClass('is-primary');
    if (destructive) row.addClass('is-destructive');
    row.createDiv({ cls: 'cortex-stack-health-cmd-label', text: label });
    const codeWrap = row.createDiv({ cls: 'cortex-stack-health-cmd-codewrap' });
    codeWrap.createEl('pre').createEl('code', { text: command });
    const copyBtn = codeWrap.createEl('button', { cls: 'cortex-stack-health-cmd-copy', text: 'Copy' });
    copyBtn.addEventListener('click', () => { void (async () => {
      await navigator.clipboard.writeText(command);
      copyBtn.setText('Copied');
      window.setTimeout(() => copyBtn.setText('Copy'), 1400);
    })(); });
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
  private renderConnectionDetails(parent: HTMLElement, s: CortexSettings): void {
    // Re-labeled from "Connection details" → "Diagnostics & overrides".
    // The original label implied "things you must configure"; the new
    // label correctly signals "things you only touch when something is
    // wrong or non-default". In local mode all three of API URL /
    // Workspace ID / API key have working defaults or auto-generation,
    // so promoting them as primary inputs would mislead first-time
    // users into thinking they need to fill three fields when they
    // need to fill zero.
    const wrap = parent.createEl('details', { cls: 'cortex-cloud-advanced' });
    wrap.createEl('summary', { text: 'Diagnostics & overrides — compose file, URL, workspace, API key' });
    const body = wrap.createDiv();

    new Setting(body)
      .setName('Docker compose file')
      .setDesc('Re-save the YAML when you change provider keys, then run docker compose up -d --force-recreate to apply.')
      .addButton(b => b
        .setButtonText('Save to vault')
        .setCta()
        .onClick(async () => {
          const path = 'docker-compose.cortex.yml';
          try {
            await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
            b.setButtonText('✓ saved');
            new Notice(
              `Saved ${path}. If the stack is already running, apply with: docker compose -f ${path} up -d --force-recreate`,
              8000,
            );
            window.setTimeout(() => { b.setButtonText('Save to vault'); }, 2000);
          } catch (e) {
            b.setButtonText('Failed');
            console.error('[Cortex] Failed to write compose file:', e);
            window.setTimeout(() => { b.setButtonText('Save to vault'); }, 2000);
          }
        }))
      .addButton(b => b
        .setButtonText('Copy YAML')
        .onClick(async () => {
          await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
          b.setButtonText('Copied');
          window.setTimeout(() => { b.setButtonText('Copy YAML'); }, 1400);
        }));

    // API URL — has a working default. Tag with a `[default]` pill so
    // users know they don't need to touch it unless port-remapped.
    const apiUrlSetting = new Setting(body)
      .setName('API URL')
      .setDesc('Defaults to HTTP://localhost:3400 — only change if you remapped the port.')
      .addText(t => t
        .setPlaceholder(LOCAL_API_URL)
        .setValue(s.apiUrl)
        .onChange(async v => { s.apiUrl = v || LOCAL_API_URL; await this.plugin.saveSettings(); }));
    this.renderRolePill(apiUrlSetting.nameEl, 'default ok');

    // Workspace ID — auto-generated. Most users never have a reason to
    // change it; tag with `[auto]` to make the role obvious.
    const workspaceSetting = new Setting(body)
      .setName('Workspace ID')
      .setDesc('Auto-generated. Only change if you want multiple isolated graphs in the same postgres.')
      .addText(t => t
        .setPlaceholder('Default')
        .setValue(s.workspaceId)
        .onChange(async v => { s.workspaceId = v.trim() || 'default'; await this.plugin.saveSettings(); }));
    this.renderRolePill(workspaceSetting.nameEl, 'auto');

    // API key — in local mode the cortex-api binds 127.0.0.1 with
    // LOCAL_AUTH_DISABLED=true, so the key is literally ignored. The
    // only reason to keep it around is to preserve the cloud-mode
    // value across Cloud → Local → Cloud round-trips. Showing an
    // editable input misleads users into thinking they need to paste
    // something. Render as a read-only status line instead, with a
    // copy button for cases where the user actually wants the value.
    const keyStatusRow = new Setting(body)
      .setName('Saved cloud API key')
      .setDesc(s.apiKey
        ? 'Preserved across mode switches so you don\'t have to re-sign-in. Local mode ignores this value.'
        : 'Not set. Sign in via Cloud mode to save one — local mode does not require it.');
    this.renderRolePill(keyStatusRow.nameEl, 'ignored in local mode');
    if (s.apiKey) {
      const masked = `${s.apiKey.slice(0, 6)}…${s.apiKey.slice(-4)}`;
      keyStatusRow.controlEl.createSpan({ cls: 'cortex-key-masked', text: masked });
      keyStatusRow.addExtraButton(b => b
        .setIcon('copy')
        .setTooltip('Copy full key to clipboard')
        .onClick(async () => {
          await navigator.clipboard.writeText(s.apiKey);
          new Notice('API key copied.');
        }));
      keyStatusRow.addExtraButton(b => b
        .setIcon('trash-2')
        .setTooltip('Forget saved key')
        .onClick(async () => {
          const ok = await confirmModal(this.plugin.app, {
            title: 'Forget the saved cloud API key?',
            body: 'You\'ll need to sign in again next time you switch to Cloud mode.',
            confirmText: 'Forget key',
            destructive: true,
          });
          if (!ok) return;
          s.apiKey = '';
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
  private renderRolePill(parent: HTMLElement, label: string): void {
    parent.createSpan({ cls: 'cortex-role-pill', text: label });
  }

  /**
   * Render the live web-search-backend status returned from
   * /v1/agent/web-search-status into a human dependency hint.
   * Names the backend explicitly so the user knows what's serving
   * their next web_search call and whether it's likely to work.
   */
  private formatWebSearchHint(status: import('./cortex-client').WebSearchStatus): string {
    const providerLabel = (b: string): string => {
      switch (b) {
        case 'openai-native':     return 'OpenAI native web search';
        case 'anthropic-native':  return 'Anthropic native web search';
        case 'gemini-grounding':  return 'Gemini grounding';
        case 'tavily':            return 'Tavily Search';
        case 'perplexity':        return 'Perplexity Sonar';
        default:                  return b;
      }
    };
    if (status.backend === 'none') {
      return 'No web-search backend configured. Configure your active LLM provider with a key (OpenAI, Anthropic, Gemini all have native web search), or set TAVILY_API_KEY (recommended, 1k/month free) or PERPLEXITY_API_KEY on the server.';
    }
    if (!status.configured) {
      const hasFallback = status.tavilyFallback || status.perplexityFallback;
      const fallback = hasFallback ? '' : ' No Tavily or Perplexity fallback either — set TAVILY_API_KEY (recommended) or PERPLEXITY_API_KEY on the server, or add a key for the active provider.';
      return `Would route to ${providerLabel(status.backend)} but its key is missing on the server.${fallback}`;
    }
    const activeBits = status.activeProvider && status.activeModel
      ? ` (active model: ${status.activeProvider}/${status.activeModel})`
      : '';
    if (status.backend === 'perplexity') {
      return `Currently routes through Perplexity Sonar${activeBits}. Provider-native search isn't available for the active model — provide an OpenAI / Anthropic / Gemini key to skip Perplexity.`;
    }
    return `Currently uses ${providerLabel(status.backend)}${activeBits} — no extra key needed.`;
  }

  /** Kicks off the OAuth sign-in flow, swapping the button label while it's in flight. */
  private async startInteractiveSignIn(signInBtn: HTMLButtonElement, s: CortexSettings): Promise<void> {
    const original = signInBtn.textContent;
    signInBtn.setText('Opening browser…');
    signInBtn.setAttr('disabled', 'true');
    try {
      const result = await startSignIn({
        dashboardUrl: 'https://app.HangarX.ai',
        apiUrl: s.apiUrl || CLOUD_API_URL,
        clientId: 'hangarx-obsidian',
        redirectUri: 'obsidian://hangarx-callback',
      });
      s.apiKey = result.accessToken;
      s.workspaceId = result.workspaceId;
      await this.plugin.saveSettings();
      new Notice(`✓ Signed in${result.userEmail ? ` as ${result.userEmail}` : ''}. Workspace ready to sync.`, 6000);
      this.display();
    } catch (e) {
      const msg = (e as Error).message || 'Sign-in failed';
      new Notice(`Sign-in failed: ${msg}`, 8000);
    } finally {
      signInBtn.setText(original ?? 'Sign in with HangarX');
      signInBtn.removeAttribute('disabled');
    }
  }

  /** API key + Workspace ID inputs, shared by pre-auth and Advanced disclosure. */
  private renderCloudCredentialFields(parent: HTMLElement, s: CortexSettings, statusBadge: HTMLElement): void {
    let validateTimer: number | undefined;
    const scheduleValidate = () => {
      if (validateTimer) window.clearTimeout(validateTimer);
      validateTimer = window.setTimeout(() => { void this.validateCloudKey(statusBadge); }, 600);
    };

    new Setting(parent)
      .setName('API key')
      .setDesc('Org-scoped API key from your hangarx dashboard.')
      .addText(t => {
        t.inputEl.type = 'password';
        t.setPlaceholder('Ctx_…')
          .setValue(s.apiKey)
          .onChange(async v => {
            s.apiKey = v.trim();
            await this.plugin.saveSettings();
            scheduleValidate();
          });
      })
      .addButton(b => b
        .setButtonText('Test')
        .setTooltip('Validate the API key by calling /v1/API-keys/whoami')
        .onClick(() => this.validateCloudKey(statusBadge)));

    new Setting(parent)
      .setName('Workspace ID')
      .setDesc('Found in your hangarx workspace settings (settings → workspaces).')
      .addText(t => t
        .setPlaceholder('Ws_…')
        .setValue(s.workspaceId)
        .onChange(async v => {
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
  private renderLlmRuntimeSection(parent: HTMLElement): void {
    // Folded into Chat & Agents under the new IA — render as a sub-heading
    // (h4) rather than a top-level h3 so it nests visually under that
    // section's header rather than reading as a peer section.
    new Setting(parent).setName("Runtime model (advanced)").setHeading();
    parent.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Switch chat provider and model on the fly — no container restart. Stored encrypted on the server and overrides the docker-compose defaults at request time.',
    });
    // Make the dependency on LLM provider keys explicit. Without this line
    // the runtime panel reads as a duplicate of the keys panel; the user has
    // no signal that "switching provider here requires a key configured up
    // there." The link scrolls to the keys section's anchor + opens it.
    const xref = parent.createEl('p', { cls: 'cortex-llm-runtime-xref setting-item-description' });
    xref.appendText('Switching to a provider requires a key configured in ');
    const link = xref.createEl('a', { text: 'Provider keys', href: '#' });
    link.addEventListener('click', evt => {
      evt.preventDefault();
      const target = parent.querySelector<HTMLElement>('[data-cortex-keys-anchor]')
        ?? this.containerEl.querySelector<HTMLElement>('[data-cortex-keys-anchor]');
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (target.instanceOf(HTMLDetailsElement)) target.open = true;
    });
    xref.appendText(' above. Providers without a key are greyed out below.');

    const wrap = parent.createDiv({ cls: 'cortex-llm-runtime' });
    const status = wrap.createDiv({ cls: 'cortex-llm-runtime-status', text: 'Loading current config…' });

    // Seed with a sensible default model list per provider. The server's
    // /v1/ask/config/models endpoint should populate this with its registry,
    // but if that call fails or returns an unexpected shape we still have
    // something for the user to pick. Provider routes pass the chosen model
    // name straight through, so even if a model isn't in the server's
    // registry it'll work as long as the upstream LLM accepts it.
    const FALLBACK_MODELS: Record<string, Array<{ id: string; label: string }>> = {
      openai: [
        { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
        { id: 'gpt-4o', label: 'gpt-4o' },
        { id: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
        { id: 'o3-mini', label: 'o3-mini' },
      ],
      anthropic: [
        { id: 'claude-haiku-4-5', label: 'claude-haiku-4-5' },
        { id: 'claude-sonnet-4-6', label: 'claude-sonnet-4-6' },
        { id: 'claude-opus-4-7', label: 'claude-opus-4-7' },
      ],
      gemini: [
        { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
        { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
        { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash (no thinking)' },
      ],
      grok: [
        { id: 'grok-4', label: 'grok-4' },
        { id: 'grok-3-mini', label: 'grok-3-mini' },
      ],
      moonshot: [
        { id: 'kimi-k2', label: 'kimi-k2' },
        { id: 'kimi-k2-turbo', label: 'kimi-k2-turbo' },
      ],
      ollama: [
        { id: 'gemma4', label: 'gemma4 (Google, latest)' },
        { id: 'gemma4:4b', label: 'gemma4:4b (Google, 4B)' },
        { id: 'gemma4:12b', label: 'gemma4:12b (Google, 12B)' },
        { id: 'gemma4:27b', label: 'gemma4:27b (Google, 27B)' },
        { id: 'gemma3:4b', label: 'gemma3:4b (Google, 4B)' },
        { id: 'gemma3:12b', label: 'gemma3:12b (Google, 12B)' },
        { id: 'gemma3:27b', label: 'gemma3:27b (Google, 27B)' },
        { id: 'llama3.2', label: 'llama3.2' },
        { id: 'llama3', label: 'llama3 (8B)' },
        { id: 'qwen2.5', label: 'qwen2.5 (7B)' },
        { id: 'mistral', label: 'mistral (7B)' },
        { id: 'phi3', label: 'phi3' },
        { id: 'nomic-embed-text', label: 'nomic-embed-text (embedding)' },
      ],
      openrouter: [
        { id: 'openai/gpt-4o-mini', label: 'openai/gpt-4o-mini' },
        { id: 'anthropic/claude-sonnet-4-6', label: 'anthropic/claude-sonnet-4-6' },
        { id: 'google/gemini-2.5-flash', label: 'google/gemini-2.5-flash' },
        { id: 'meta-llama/llama-3.3-70b-instruct', label: 'meta-llama/llama-3.3-70b-instruct' },
      ],
      huggingface: [
        { id: 'moonshotai/Kimi-K2.5', label: 'Kimi K2.5 (Moonshot)' },
        { id: 'moonshotai/Kimi-K2-Instruct-0905', label: 'Kimi K2 Instruct 0905 (Moonshot)' },
        { id: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B (Meta)' },
        { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B (Alibaba)' },
      ],
    };

    let modelsByProvider: Record<string, Array<{ id: string; label: string }>> = { ...FALLBACK_MODELS };
    let currentProvider: string = '';
    let currentModel: string = '';
    const providerSel = { value: '' };
    const modelSel = { value: '' };

    // Capture the dropdown element so we can re-evaluate which providers are
    // "configured" each time the panel renders (the user may have just added
    // a key in the section above and re-opened settings).
    let providerDropdownEl: HTMLSelectElement | null = null;

    const providerSetting = new Setting(wrap)
      .setName('Chat provider')
      .setDesc('Which provider runs chat completions. Greyed-out providers need a key configured first.')
      .addDropdown(d => {
        const s = this.plugin.settings;
        for (const id of ['openai', 'anthropic', 'gemini', 'grok', 'moonshot', 'huggingface', 'ollama', 'openrouter']) {
          const keyField = runtimeProviderKeyField(id);
          const hasKey = keyField === null || !!s.llmKeys[keyField];
          const label = hasKey
            ? providerLabel(id)
            : `${providerLabel(id)} — no key configured`;
          d.addOption(id, label);
        }
        // Walk the rendered <option> elements to disable the no-key entries.
        // addOption doesn't expose a per-option disabled flag, so we modify
        // them after the fact via the underlying selectEl.
        providerDropdownEl = (d as unknown as { selectEl: HTMLSelectElement }).selectEl;
        for (const opt of Array.from(providerDropdownEl.options)) {
          const keyField = runtimeProviderKeyField(opt.value);
          const hasKey = keyField === null || !!s.llmKeys[keyField];
          if (!hasKey) opt.disabled = true;
        }
        d.onChange(v => {
          providerSel.value = v;
          repopulateModels();
        });
      });

    const modelSetting = new Setting(wrap)
      .setName('Chat model')
      .setDesc('Specific model from the chosen provider.')
      .addDropdown(d => {
        d.addOption('', '— pick a provider first —');
        d.onChange(v => { modelSel.value = v; });
      });

    // The text-component API surface we use here. Typing as the
    // narrow shape lets the call sites below access getValue/setValue
    // without cast-on-call.
    type TextLike = { getValue?(): string; setValue?(v: string): void };
    let apiKeyInput: TextLike | null = null;
    const keySetting = new Setting(wrap)
      .setName('API key')
      .setDesc('Optional. Leave blank to keep the existing key. Required only when switching providers or rotating.')
      .addText(t => {
        apiKeyInput = t;
        t.inputEl.type = 'password';
        t.setPlaceholder('Sk-… / aiza… / etc.');
      });

    const buttonRow = wrap.createDiv({ cls: 'cortex-llm-runtime-actions' });
    const testBtn = buttonRow.createEl('button', { text: 'Test', cls: 'cortex-llm-runtime-test' });
    const applyBtn = buttonRow.createEl('button', { text: 'Apply', cls: 'cortex-llm-runtime-apply mod-cta' });

    const setStatus = (text: string, kind: 'ok' | 'err' | 'info' = 'info') => {
      status.removeClass('is-ok'); status.removeClass('is-err'); status.removeClass('is-info');
      status.addClass(`is-${kind}`);
      status.setText(text);
    };

    const repopulateModels = () => {
      const dropdown = (modelSetting.components[0] as unknown as { selectEl: HTMLSelectElement }).selectEl;
      while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
      const list = modelsByProvider[providerSel.value] ?? [];
      if (list.length === 0) {
        const opt = activeDocument.createEl('option');
        opt.value = ''; opt.text = `— no models registered for ${providerSel.value} —`;
        dropdown.appendChild(opt);
        modelSel.value = '';
        return;
      }
      for (const m of list) {
        const opt = activeDocument.createEl('option');
        opt.value = m.id; opt.text = m.label || m.id;
        dropdown.appendChild(opt);
      }
      // Preserve current model when switching back to the original provider;
      // otherwise pick the first model in the list.
      const stillValid = list.some(m => m.id === modelSel.value);
      modelSel.value = stillValid ? modelSel.value :
        (providerSel.value === currentProvider && list.some(m => m.id === currentModel)) ? currentModel :
        list[0].id;
      dropdown.value = modelSel.value;
    };

    const seedFromConfig = (cfg: import('./cortex-client').LlmRuntimeConfig) => {
      currentProvider = cfg.chatProvider ?? '';
      currentModel = cfg.chatModel ?? '';
      providerSel.value = currentProvider || 'gemini';
      modelSel.value = currentModel;
      const pDropdown = (providerSetting.components[0] as unknown as { selectEl: HTMLSelectElement }).selectEl;
      pDropdown.value = providerSel.value;
      repopulateModels();
      const keyHint = cfg.chatApiKeyMasked
        ? `Current key: ${cfg.chatApiKeyMasked} · leave blank to keep`
        : 'No key stored — required for cloud providers';
      keySetting.setDesc(keyHint);
    };

    void this.plugin.client.getLlmModels().then(reg => {
      // Server returns either an array of providers or a record keyed by id.
      const arr = Array.isArray(reg) ? reg : Object.values(reg);
      for (const p of arr) {
        // Server `ModelInfo` uses `name`, plugin uses `label`. Accept either.
        const serverList = (p.models ?? []).map((m: unknown) => {
          const mm = m as { id: string; label?: string; name?: string };
          return {
            id: mm.id,
            label: mm.label || mm.name || mm.id,
          };
        });
        // Merge fallback + server entries by id rather than letting the
        // server fully replace the fallback. Server wins on label conflicts
        // (richer metadata like context window in the name), but any model
        // the plugin knows about that the server doesn't list still shows
        // up — handles the common case where the plugin shipped a release
        // that knows about a model the cloud cortex-api hasn't deployed yet.
        const merged = new Map<string, { id: string; label: string }>();
        for (const m of modelsByProvider[p.id] ?? []) merged.set(m.id, m);
        for (const m of serverList) merged.set(m.id, m);
        if (merged.size > 0) {
          modelsByProvider[p.id] = Array.from(merged.values());
        }
      }
    }).catch(e => {
      // Loading the registry failed — log it but keep the fallback list so
      // the dropdowns aren't empty.
      console.warn('[Cortex] Couldn\'t load model registry, using fallback list:', e);
    }).then(async () => {
      try {
        const cfg = await this.plugin.client.getLlmConfig();
        seedFromConfig(cfg);
        setStatus(`Active: ${cfg.chatProvider ?? '—'} / ${cfg.chatModel ?? '—'}`, 'ok');
      } catch (e) {
        // No runtime override stored yet (or the read query failed) — seed
        // with sensible defaults so the user can still pick + Apply. If the
        // server has a real schema problem, Apply will surface it then.
        seedFromConfig({
          chatProvider: 'gemini',
          chatModel: '',
        });
        const msg = (e as Error).message;
        if (/→ 500/.test(msg)) {
          setStatus(
            'No runtime override saved yet. Pick a provider + model and click Apply to set one.',
            'info',
          );
        } else {
          setStatus(`Couldn't load runtime config: ${msg}`, 'err');
        }
      }
    }).catch(e => {
      setStatus(`Couldn't load model registry: ${(e as Error).message}`, 'err');
    });

    testBtn.addEventListener('click', () => { void (async () => {
      if (!providerSel.value || !modelSel.value) {
        setStatus('Pick a provider and model first.', 'err');
        return;
      }
      const apiKey = apiKeyInput?.getValue?.();
      testBtn.setAttr('disabled', 'true');
      testBtn.setText('Testing…');
      try {
        const r = await this.plugin.client.testLlmConfig({
          provider: providerSel.value as import('./cortex-client').LlmProvider,
          model: modelSel.value,
          apiKey: apiKey || undefined,
        });
        if (r.success) {
          setStatus(`✓ ${providerSel.value}/${modelSel.value} reachable${r.latencyMs ? ` (${r.latencyMs}ms)` : ''}`, 'ok');
        } else {
          setStatus(`✗ Test failed: ${r.message ?? 'unknown error'}`, 'err');
        }
      } catch (e) {
        setStatus(`✗ Test threw: ${(e as Error).message}`, 'err');
      } finally {
        testBtn.removeAttribute('disabled');
        testBtn.setText('Test');
      }
    })(); });

    applyBtn.addEventListener('click', () => { void (async () => {
      if (!providerSel.value || !modelSel.value) {
        setStatus('Pick a provider and model first.', 'err');
        return;
      }
      const apiKey = apiKeyInput?.getValue?.();
      applyBtn.setAttr('disabled', 'true');
      applyBtn.setText('Applying…');
      try {
        const cfg = await this.plugin.client.updateLlmConfig({
          chatProvider: providerSel.value as import('./cortex-client').LlmProvider,
          chatModel: modelSel.value,
          // Only send the key if the user typed something — otherwise the
          // server keeps whatever's already stored.
          ...(apiKey ? { chatApiKey: apiKey, useOwnChatKey: true } : {}),
        });
        seedFromConfig(cfg);
        if (apiKeyInput?.setValue) apiKeyInput.setValue('');
        setStatus(`✓ Applied: ${cfg.chatProvider}/${cfg.chatModel}`, 'ok');
        new Notice(`HangarX: switched to ${cfg.chatProvider}/${cfg.chatModel}`);
      } catch (e) {
        setStatus(`✗ Apply failed: ${(e as Error).message}`, 'err');
      } finally {
        applyBtn.removeAttribute('disabled');
        applyBtn.setText('Apply');
      }
    })(); });
  }

  private renderAgentsSection(parent: HTMLElement): void {
    // Folded under the new "Power features" section header — drop the
    // inner h3 to avoid two stacked headers ("Power features" then
    // "Agents"). The descriptive paragraph still anchors the section.
    parent.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Make this vault available as a memory + context layer for AI agents on this machine — Claude Desktop, Claude Code, Cursor, or anything else that speaks MCP. ' +
        'Your notes, decisions, and project history become permanent agent context across sessions.',
    });

    new Setting(parent).setName("Local agents").setHeading();
    const connectRow = parent.createDiv({ cls: 'cortex-agents-connect-row' });
    this.renderAgentConnectCards(connectRow);

    // Cloud agents — only meaningful when the user is signed into the cloud
    // (the synced graph lives at cortex.HangarX.ai). In Local mode there's no
    // remote endpoint to point cloud agents at, so we suppress the section.
    if (this.plugin.settings.connectionMode === 'cloud' && this.plugin.settings.apiKey) {
      this.renderCloudAgentsSection(parent);
    }

    new Setting(parent)
      .setName('Enable local mcp server')
      .setDesc('Required for the connect buttons above. Binds to 127.0.0.1 only.')
      .addToggle(t => t
        .setValue(this.plugin.settings.mcpEnabled)
        .onChange(async v => {
          this.plugin.settings.mcpEnabled = v;
          await this.plugin.saveSettings();
          await this.plugin.toggleMcpServer(v);
          this.display();
        }));

    if (!this.plugin.settings.mcpEnabled) {
      parent.createEl('p', {
        cls: 'cortex-agents-hint',
        text: 'Enable the mcp server to expose memory tools to agents. The server only listens on localhost.',
      });
      return;
    }

    // Advanced details — port, token, raw config snippet — folded.
    const advanced = parent.createEl('details', { cls: 'cortex-mcp-advanced' });
    advanced.createEl('summary', { text: 'Advanced mcp details (port, token, manual config snippet)' });
    const advBody = advanced.createDiv();

    new Setting(advBody)
      .setName('Mcp port')
      .setDesc('Port to bind to (default 7474). Change requires server restart.')
      .addText(t => t
        .setValue(String(this.plugin.settings.mcpPort))
        .onChange(async v => {
          const n = parseInt(v, 10);
          if (Number.isFinite(n) && n > 0 && n < 65536) {
            this.plugin.settings.mcpPort = n;
            await this.plugin.saveSettings();
          }
        }));

    if (this.plugin.settings.mcpToken) {
      const url = `http://127.0.0.1:${this.plugin.settings.mcpPort}`;
      new Setting(advBody)
        .setName('Mcp URL')
        .addText(t => { t.inputEl.readOnly = true; t.setValue(url); });

      new Setting(advBody)
        .setName('Mcp token')
        .setDesc('Bearer token required by clients. Keep it secret.')
        .addText(t => {
          t.inputEl.readOnly = true;
          t.inputEl.type = 'password';
          t.setValue(this.plugin.settings.mcpToken);
        })
        .addButton(b => b
          .setButtonText('Copy')
          .onClick(async () => {
            await navigator.clipboard.writeText(this.plugin.settings.mcpToken);
          }))
        .addButton(b => b
          .setButtonText('Regenerate')
          .onClick(async () => {
            const { generateToken } = await import('./services/mcp-server');
            this.plugin.settings.mcpToken = generateToken();
            await this.plugin.saveSettings();
            await this.plugin.toggleMcpServer(true);
            this.display();
          }));

      const bridgePath = this.plugin.mcp.bridgePath || `<reload-plugin-to-generate>`;
      const snippet =
`"mcpServers": {
  "hangarx": {
    "command": "node",
    "args": ["${bridgePath}"],
    "env": {
      "CORTEX_MCP_URL": "${url}",
      "CORTEX_MCP_TOKEN": "${this.plugin.settings.mcpToken}"
    }
  }
}`;
      const example = advBody.createEl('details', { cls: 'cortex-mcp-example' });
      example.createEl('summary', { text: 'Manual config snippet (for tools without one-click connect)' });
      const codeWrap = example.createDiv({ cls: 'cortex-mcp-code-wrap' });
      const copyBtn = codeWrap.createEl('button', {
        cls: 'cortex-mcp-copy',
        text: 'Copy',
      });
      copyBtn.addEventListener('click', () => { void (async () => {
        await navigator.clipboard.writeText(snippet);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        copyBtn.addClass('is-copied');
        window.setTimeout(() => {
          copyBtn.textContent = original;
          copyBtn.removeClass('is-copied');
        }, 1400);
      })(); });
      codeWrap.createEl('pre').createEl('code', { text: snippet });
    }
  }

  private renderAgentConnectCards(parent: HTMLElement): void {
    parent.empty();
    if (!this.plugin.settings.mcpEnabled || !this.plugin.settings.mcpToken) return;
    if (!Platform.isDesktopApp) {
      parent.createEl('p', {
        cls: 'setting-item-description',
        text: 'Agent connectors are desktop-only — these clients don\'t run on mobile.',
      });
      return;
    }

    const port = this.plugin.settings.mcpPort;
    const token = this.plugin.settings.mcpToken;
    const bridgePath = this.plugin.mcp?.bridgePath;
    if (!bridgePath) {
      parent.createEl('p', {
        cls: 'setting-item-description',
        text: 'Bridge script not yet generated. Toggle the mcp server off and on to regenerate.',
      });
      return;
    }
    const bridge: BridgeConfig = { bridgePath, url: `http://127.0.0.1:${port}`, token };

    // Registry of supported harnesses. Adding a new one here is a 4-line
    // change — no UI patching required. Each entry must produce a config file
    // that follows the standard `mcpServers.<name> = { command, args, env }`
    // shape; clients with bespoke formats use the "Other" row at the bottom.
    const harnesses: AgentHarness[] = [
      {
        id: 'claude-desktop',
        label: 'Claude Desktop',
        description: 'Anthropic\'s desktop app.',
        configPath: claudeDesktopConfigPath(),
        connect: () => connectClaudeDesktop(bridge),
      },
      {
        id: 'claude-code',
        label: 'Claude Code',
        description: 'CLI coding agent.',
        configPath: claudeCodeConfigPath(),
        connect: () => connectClaudeCode(bridge),
      },
      {
        id: 'cursor',
        label: 'Cursor',
        description: 'AI-first editor.',
        configPath: cursorConfigPath(),
        connect: () => connectCursor(bridge),
      },
      {
        id: 'cline',
        label: 'Cline (VS Code)',
        description: 'Autonomous coding agent extension.',
        configPath: clineConfigPath(),
        connect: () => connectCline(bridge),
      },
      {
        id: 'windsurf',
        label: 'Windsurf',
        description: 'Codeium\'s agentic IDE.',
        configPath: windsurfConfigPath(),
        connect: () => connectWindsurf(bridge),
      },
    ];

    const list = parent.createDiv({ cls: 'cortex-agents-list' });
    for (const h of harnesses) {
      this.renderAgentRow(list, h, bridge);
    }

    // "Other" row — any MCP-compatible app. Expand to copyable JSON snippet.
    this.renderGenericAgentRow(list, bridge);
  }

  /** One row in the agents list — name, description, status, Connect, kebab. */
  private renderAgentRow(parent: HTMLElement, h: AgentHarness, bridge: BridgeConfig): void {
    const row = parent.createDiv({ cls: 'cortex-agent-row' });
    const main = row.createDiv({ cls: 'cortex-agent-row-main' });
    const head = main.createDiv({ cls: 'cortex-agent-row-head' });
    head.createSpan({ cls: 'cortex-agent-row-label', text: h.label });
    const status = head.createSpan({ cls: 'cortex-agent-row-status', text: '…' });
    main.createSpan({ cls: 'cortex-agent-row-desc', text: h.description });

    const actions = row.createDiv({ cls: 'cortex-agent-row-actions' });
    const connectBtn = actions.createEl('button', { text: 'Connect' });

    void checkConnection(h.configPath).then(s => {
      if (s.connected) {
        status.setText('✓ connected');
        status.addClass('is-connected');
        connectBtn.setText('Reconnect');
      } else if (s.exists) {
        status.setText('Not connected');
      } else {
        status.setText('Not installed');
        status.addClass('is-faint');
      }
    });

    connectBtn.addEventListener('click', () => { void (async () => {
      connectBtn.setText('Connecting…');
      connectBtn.setAttr('disabled', 'true');
      try {
        const result = await h.connect();
        if (result.ok) {
          status.setText(result.unchanged ? '✓ Already connected' : '✓ Connected');
          status.addClass('is-connected');
          status.removeClass('is-faint');
          new Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
          connectBtn.setText('Reconnect');
        } else {
          status.setText('Failed');
          status.addClass('is-error');
          new Notice(`${h.label}: ${result.message}`);
          connectBtn.setText('Retry');
        }
      } finally {
        connectBtn.removeAttribute('disabled');
      }
    })(); });

    if (h.configPath) {
      const menuBtn = actions.createEl('button', {
        text: '⋯',
        attr: { 'aria-label': 'More actions', title: 'More actions' },
      });
      menuBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        this.openAgentRowMenu(evt, h, bridge, status, connectBtn);
      });
    }
  }

  /** Kebab menu for an agent row: copy path / reveal / show snippet / disconnect. */
  private openAgentRowMenu(
    evt: MouseEvent,
    h: AgentHarness,
    bridge: BridgeConfig,
    status: HTMLElement,
    connectBtn: HTMLButtonElement,
  ): void {
    const path = h.configPath;
    if (!path) return;
    const menu = new Menu();

    menu.addItem(item => item
      .setTitle('Copy config path')
      .setIcon('clipboard')
      .onClick(async () => {
        await navigator.clipboard.writeText(path);
        new Notice('Config path copied.');
      }));

    menu.addItem(item => item
      .setTitle(this.fileManagerLabel())
      .setIcon('folder-open')
      .onClick(() => {
        if (!revealInFileManager(path)) {
          new Notice('Couldn\'t open the file manager from this build of Obsidian.');
        }
      }));

    menu.addItem(item => item
      .setTitle('Copy mcp snippet')
      .setIcon('code')
      .onClick(async () => {
        const snippet = JSON.stringify(
          { mcpServers: { 'hangarx': buildBridgeEntry(bridge) } },
          null,
          2,
        );
        await navigator.clipboard.writeText(snippet);
        new Notice('Mcp config snippet copied.');
      }));

    menu.addSeparator();

    menu.addItem(item => item
      .setTitle('Disconnect')
      .setIcon('unplug')
      .setWarning(true)
      .onClick(async () => {
        const result = await disconnectMcpEntry(path);
        if (result.ok) {
          status.setText(result.unchanged ? 'Not connected' : 'Disconnected');
          status.removeClass('is-connected');
          connectBtn.setText('Connect');
          new Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
        } else {
          new Notice(`${h.label}: ${result.message}`);
        }
      }));

    menu.showAtMouseEvent(evt);
  }

  /** OS-aware label for the "Reveal in …" menu item. */
  private fileManagerLabel(): string {
    if (Platform.isMacOS) return 'Reveal in Finder';
    if (Platform.isWin) return 'Show in Explorer';
    return 'Show in file manager';
  }

  /**
   * Generic row for "any other MCP-compatible app". Expands to show the JSON
   * snippet to paste manually. Covers harnesses we haven't packaged a
   * connector for (Zed, Goose, Codex CLI, anything new).
   */
  private renderGenericAgentRow(parent: HTMLElement, bridge: BridgeConfig): void {
    const row = parent.createEl('details', { cls: 'cortex-agent-row cortex-agent-row-generic' });
    const summary = row.createEl('summary');
    const main = summary.createDiv({ cls: 'cortex-agent-row-main' });
    main.createSpan({ cls: 'cortex-agent-row-label', text: 'Other MCP-compatible app' });
    main.createSpan({
      cls: 'cortex-agent-row-desc',
      text: 'Copy the snippet below into any client that speaks MCP (Zed, Goose, Codex CLI, custom agents).',
    });

    const body = row.createDiv({ cls: 'cortex-agent-row-body' });
    const entry = { mcpServers: { 'hangarx': buildBridgeEntry(bridge) } };
    const snippet = JSON.stringify(entry, null, 2);

    const codeWrap = body.createDiv({ cls: 'cortex-mcp-code-wrap' });
    const copyBtn = codeWrap.createEl('button', { cls: 'cortex-mcp-copy', text: 'Copy' });
    copyBtn.addEventListener('click', () => { void (async () => {
      await navigator.clipboard.writeText(snippet);
      copyBtn.setText('Copied');
      copyBtn.addClass('is-copied');
      window.setTimeout(() => { copyBtn.setText('Copy'); copyBtn.removeClass('is-copied'); }, 1400);
    })(); });
    codeWrap.createEl('pre').createEl('code', { text: snippet });
  }

  /**
   * Cloud agents section. Same vault, accessed remotely from a cloud-side
   * agent (Claude.ai web/mobile, ChatGPT desktop, Cursor on a remote dev
   * box) rather than via the local MCP bridge. The cloud already exposes a
   * public MCP endpoint at cortex.HangarX.ai/mcp; agents authenticate with
   * the same `ctx_…` API key the plugin already has, so we just need to
   * surface the URL + key in copy-pasteable form.
   */
  private renderCloudAgentsSection(parent: HTMLElement): void {
    const apiKey = this.plugin.settings.apiKey;
    const apiUrl = (this.plugin.settings.apiUrl || 'https://cortex.hangarx.ai').replace(/\/$/, '');
    const mcpUrl = `${apiUrl}/mcp`;
    const workspaceId = this.plugin.settings.workspaceId;

    new Setting(parent).setName("Cloud agents").setHeading();
    parent.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Reach the same workspace from agents that don\'t run on this machine — Claude.ai web/mobile, ChatGPT desktop, ' +
        'or any agent on a cloud dev box. They authenticate against cortex.HangarX.ai/mcp using your API key.',
    });

    // Top-level URL + key card so users can grab credentials in one shot.
    const summary = parent.createDiv({ cls: 'cortex-cloud-agent-summary' });
    const summaryLeft = summary.createDiv({ cls: 'cortex-cloud-agent-summary-fields' });
    summaryLeft.createDiv({ cls: 'cortex-cloud-agent-row', text: `URL: ${mcpUrl}` });
    summaryLeft.createDiv({
      cls: 'cortex-cloud-agent-row',
      text: `Auth: x-api-key: ${apiKey ? maskKey(apiKey) : '<not configured>'}`,
    });
    if (workspaceId) {
      summaryLeft.createDiv({
        cls: 'cortex-cloud-agent-row',
        text: `Workspace: x-workspace-id: ${workspaceId}`,
      });
    }
    const summaryActions = summary.createDiv({ cls: 'cortex-cloud-agent-summary-actions' });
    const copyAllBtn = summaryActions.createEl('button', { text: 'Copy URL + key', cls: 'mod-cta' });
    copyAllBtn.addEventListener('click', () => { void (async () => {
      const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
      if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
      await navigator.clipboard.writeText(lines.join('\n'));
      copyAllBtn.setText('Copied');
      window.setTimeout(() => copyAllBtn.setText('Copy URL + key'), 1400);
    })(); });

    // Per-client rows (Claude.ai web, ChatGPT desktop, Other). Each opens
    // the client's MCP-config UI in a new tab and copies the credentials so
    // the user just pastes them into the form.
    const clients: Array<{ id: string; label: string; description: string; openUrl?: string }> = [
      {
        id: 'claude-ai',
        label: 'Claude.ai (web / mobile)',
        description: 'Add as a Custom Connector under Settings → Connectors.',
        openUrl: 'https://claude.ai/settings/connectors',
      },
      {
        id: 'chatgpt-desktop',
        label: 'ChatGPT desktop',
        description: 'Add as an MCP server in Settings → Connections (desktop only).',
      },
      {
        id: 'cursor-remote',
        label: 'Cursor (cloud dev box)',
        description: 'Add to ~/.cursor/mcp.json on the remote machine — same shape as the local connector.',
      },
      {
        id: 'cloud-other',
        label: 'Other cloud-hosted agent',
        description: 'Any client that supports remote MCP via HTTP + API key.',
      },
    ];

    const list = parent.createDiv({ cls: 'cortex-agents-list' });
    for (const c of clients) {
      const row = list.createDiv({ cls: 'cortex-agent-row' });
      const main = row.createDiv({ cls: 'cortex-agent-row-main' });
      main.createSpan({ cls: 'cortex-agent-row-label', text: c.label });
      main.createSpan({ cls: 'cortex-agent-row-desc', text: c.description });

      const actions = row.createDiv({ cls: 'cortex-agent-row-actions' });
      const setupBtn = actions.createEl('button', { text: c.openUrl ? 'Open & copy' : 'Copy creds' });
      setupBtn.addEventListener('click', () => { void (async () => {
        const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
        if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
        await navigator.clipboard.writeText(lines.join('\n'));
        if (c.openUrl) window.open(c.openUrl, '_blank');
        setupBtn.setText('Copied');
        window.setTimeout(() => setupBtn.setText(c.openUrl ? 'Open & copy' : 'Copy creds'), 1400);
      })(); });

      const moreBtn = actions.createEl('button', {
        text: '⋯',
        attr: { 'aria-label': 'More actions', title: 'More actions' },
      });
      moreBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        const menu = new Menu();
        menu.addItem(item => item.setTitle('Copy URL only').setIcon('clipboard').onClick(async () => {
          await navigator.clipboard.writeText(mcpUrl);
          new Notice('Mcp URL copied.');
        }));
        menu.addItem(item => item.setTitle('Copy key only').setIcon('clipboard').onClick(async () => {
          await navigator.clipboard.writeText(apiKey);
          new Notice('API key copied.');
        }));
        if (workspaceId) {
          menu.addItem(item => item.setTitle('Copy workspace ID').setIcon('clipboard').onClick(async () => {
            await navigator.clipboard.writeText(workspaceId);
            new Notice('Workspace ID copied.');
          }));
        }
        menu.addItem(item => item.setTitle('Copy curl test').setIcon('terminal').onClick(async () => {
          const curl = `curl -s -X POST -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H 'x-api-key: ${apiKey}'${workspaceId ? ` -H 'x-workspace-id: ${workspaceId}'` : ''} -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' ${mcpUrl}`;
          await navigator.clipboard.writeText(curl);
          new Notice('Curl one-liner copied — paste in any terminal to verify connectivity.');
        }));
        menu.showAtMouseEvent(evt);
      });
    }
  }

  /**
   * BYOK + embedding-provider selection. Local-mode only (cloud users get
   * keys via the HangarX dashboard).
   */
  private renderProviderKeysSection(parent: HTMLElement, s: CortexSettings): void {
    type ProviderKey = keyof CortexSettings['llmKeys'];
    const PROVIDERS: Array<{ id: ProviderKey; label: string; placeholder: string; href: string }> = [
      { id: 'gemini',      label: 'Gemini (Google AI Studio)',  placeholder: 'AIza…',    href: 'https://aistudio.google.com/apikey' },
      { id: 'openai',      label: 'OpenAI',                     placeholder: 'sk-…',     href: 'https://platform.openai.com/api-keys' },
      { id: 'anthropic',   label: 'Anthropic (Claude)',         placeholder: 'sk-ant-…', href: 'https://console.anthropic.com/settings/keys' },
      { id: 'moonshot',    label: 'Moonshot (Kimi)',            placeholder: 'sk-…',     href: 'https://platform.moonshot.ai/console/api-keys' },
      { id: 'huggingface', label: 'HuggingFace (HF Inference)', placeholder: 'hf_…',     href: 'https://huggingface.co/settings/tokens' },
      { id: 'openrouter',  label: 'OpenRouter',                 placeholder: 'sk-or-…',  href: 'https://openrouter.ai/keys' },
      { id: 'xai',         label: 'xAI (Grok)',                 placeholder: 'xai-…',    href: 'https://console.x.ai/' },
      // Reranker providers — neither runs chat completions, but configuring
      // either flips on the learned-reranker step in retrieval, which the
      // Memory Stats "Heads up" panel surfaces as the missing piece for
      // higher-quality answers. Cohere is the higher-quality option, Jina
      // has a generous free tier.
      { id: 'cohere',      label: 'Cohere (reranker)',          placeholder: '…',        href: 'https://dashboard.cohere.com/api-keys' },
      { id: 'jina',        label: 'Jina (reranker)',            placeholder: 'jina_…',   href: 'https://jina.ai/?sui=apikey' },
      // Web-search backends — used by the agent's `web_search` tool when
      // the active LLM provider doesn't have native web search. Optional;
      // a missing key just disables the tool (graceful fallback).
      // Tavily is preferred (purpose-built for agent loops, 1k/month
      // free with no card); Perplexity stays as the backup.
      { id: 'tavily',      label: 'Tavily (web search, recommended)', placeholder: 'tvly-…', href: 'https://app.tavily.com/home' },
      { id: 'perplexity',  label: 'Perplexity (web search)',    placeholder: 'pplx-…',   href: 'https://www.perplexity.ai/settings/api' },
    ];
    const configuredCount = PROVIDERS.filter(p => !!s.llmKeys[p.id]).length;
    const summaryText = configuredCount === 0
      ? 'LLM provider keys — no keys configured yet'
      : `LLM provider keys — ${configuredCount} of ${PROVIDERS.length} configured`;

    const wrap = parent.createEl('details', { cls: 'cortex-llm-keys' });
    wrap.setAttr('data-cortex-keys-anchor', '');
    if (configuredCount === 0) wrap.setAttr('open', '');
    wrap.createEl('summary', { text: summaryText });
    const body = wrap.createDiv({ cls: 'cortex-llm-keys-body' });
    body.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Bring your own API keys. They\'re baked into the docker-compose YAML on disk and never sent to HangarX. ' +
        'Cohere and Jina aren\'t chat LLMs — they enable the learned reranker for higher-quality retrieval. ' +
        'After adding or changing any key, re-save the Compose file in Connection details to apply.',
    });

    // Embedding provider — gates ingestion; keep prominent at top.
    new Setting(body)
      .setName('Embedding provider')
      .setDesc(
        'Where embedding calls run. Gemini is fastest to start (free tier, rate-limited). ' +
        'Switch to Ollama for unlimited local embeddings once your vault grows — requires installing Ollama and running `ollama pull nomic-embed-text`.',
      )
      .addDropdown(d => d
        .addOption('gemini', 'Gemini (cloud, free tier — rate-limited)')
        .addOption('ollama', 'Ollama local (recommended for heavy ingests)')
        .setValue(s.embeddingPreset || 'gemini')
        .onChange(async v => {
          s.embeddingPreset = v as EmbeddingPreset;
          await this.plugin.saveSettings();
        }));

    if ((s.embeddingPreset || 'gemini') === 'ollama') {
      const hint = body.createDiv({ cls: 'cortex-local-note' });
      hint.createEl('p', {
        text: 'Ollama setup: install Ollama (https://ollama.com), then run: ollama pull nomic-embed-text. ' +
              'The HangarX container reaches Ollama at host.docker.internal:11434.',
      });
    }

    // Compact provider list — each row collapses until clicked.
    const list = body.createDiv({ cls: 'cortex-providers-list' });
    for (const p of PROVIDERS) {
      this.renderProviderRow(list, s, p);
    }

    // Mark the active runtime chat provider with a chip on its summary row.
    // Fetched async so the keys section renders without blocking; the chip
    // shows up a moment later when the runtime config arrives. Silently
    // skips on error — chip is informational, not load-bearing.
    void this.plugin.client.getLlmConfig().then(cfg => {
      const runtimeProvider = cfg?.chatProvider;
      if (!runtimeProvider) return;
      const targetKeysField = (PROVIDERS.find(p =>
        keysFieldToRuntimeProvider(p.id) === runtimeProvider,
      ))?.id;
      if (!targetKeysField) return;
      const targetRow = list.querySelector<HTMLElement>(
        `.cortex-provider-row[data-provider-id="${targetKeysField}"]`,
      );
      if (!targetRow) return;
      const summary = targetRow.querySelector<HTMLElement>('.cortex-provider-row-summary');
      if (!summary) return;
      // Don't double-add if a re-render is in flight.
      if (summary.querySelector('.cortex-provider-row-active-chip')) return;
      const chip = createDiv({ cls: 'cortex-provider-row-active-chip' });
      chip.setText('Active for chat');
      chip.setAttr('title', `${runtimeProvider}/${cfg.chatModel ?? '—'} is the current runtime override.`);
      // Insert right after the label so it sits beside the provider name,
      // not at the far right next to the masked-key status.
      const label = summary.querySelector<HTMLElement>('.cortex-provider-row-label');
      if (label) label.insertAdjacentElement('afterend', chip);
      else summary.appendChild(chip);
      // Marker on the row so the label's flex behavior switches without
      // a :has() selector (Obsidian review bot flags :has() for selector-
      // invalidation cost).
      targetRow.addClass('is-active-chip');
    }).catch(() => { /* runtime config unavailable — chip stays absent. */ });
  }

  /**
   * One provider row. Collapsed view: name + status pill. Expanded view:
   * password input, "Get a key" external link, and Test button. Keeps the
   * settings page navigable when most providers aren't configured.
   */
  private renderProviderRow(
    parent: HTMLElement,
    s: CortexSettings,
    p: { id: keyof CortexSettings['llmKeys']; label: string; placeholder: string; href: string },
  ): void {
    const row = parent.createEl('details', { cls: 'cortex-provider-row' });
    row.setAttr('data-provider-id', p.id);
    if (s.llmKeys[p.id]) row.setAttr('open', ''); // open if user has a key here
    const summary = row.createEl('summary', { cls: 'cortex-provider-row-summary' });
    summary.createSpan({ cls: 'cortex-provider-row-label', text: p.label });
    const status = summary.createSpan({ cls: 'cortex-provider-row-status' });
    const renderStatus = () => {
      const key = s.llmKeys[p.id];
      status.empty();
      status.removeClass('is-configured', 'is-empty');
      if (key) {
        status.addClass('is-configured');
        status.setText(`✓ ${maskKey(key)}`);
      } else {
        status.addClass('is-empty');
        status.setText('Not configured');
      }
    };
    renderStatus();

    const body = row.createDiv({ cls: 'cortex-provider-row-body' });
    const setting = new Setting(body);
    setting.addText(t => {
      t.inputEl.type = 'password';
      t.setPlaceholder(p.placeholder);
      t.setValue(s.llmKeys[p.id] || '');
      t.onChange(async v => {
        const trimmed = v.trim();
        if (trimmed) s.llmKeys[p.id] = trimmed;
        else delete s.llmKeys[p.id];
        await this.plugin.saveSettings();
        renderStatus();
        // Mirror chat-provider keys into the runtime LLM config so they
        // take effect immediately on the running container — no compose
        // YAML re-save, no `docker compose up -d --force-recreate` needed.
        // Cohere/Jina are reranker-only; everything else maps to a runtime
        // provider id.
        const RUNTIME_PROVIDERS = new Set(['gemini', 'openai', 'anthropic', 'moonshot', 'openrouter', 'xai', 'huggingface']);
        if (RUNTIME_PROVIDERS.has(p.id) && trimmed) {
          this.pushBYOKToRuntime(p.id, trimmed).catch(err => {
            console.warn('[Cortex] Couldn\'t push BYOK to runtime config:', err);
          });
        }
      });
    });

    setting.addExtraButton(b => b
      .setIcon('external-link')
      .setTooltip('Get a key')
      .onClick(() => window.open(p.href, '_blank')));

    setting.addButton(b => b
      .setButtonText('Test')
      .setTooltip('Verify the key by calling the provider through the local cortex-API.')
      .onClick(async () => {
        const key = s.llmKeys[p.id];
        if (!key) { new Notice(`Enter a ${p.label} key first.`); return; }
        b.setButtonText('Testing…');
        b.setDisabled(true);
        try {
          const ok = await this.testProviderKey(p.id, key);
          b.setButtonText(ok ? '✓ Valid' : '✗ Invalid');
          window.setTimeout(() => { b.setButtonText('Test'); }, 2200);
        } catch (e) {
          b.setButtonText('✗ error');
          new Notice(`Test failed: ${(e as Error).message}`);
          window.setTimeout(() => { b.setButtonText('Test'); }, 2800);
        } finally {
          b.setDisabled(false);
        }
      }));

    if (s.llmKeys[p.id]) {
      setting.addButton(b => b
        .setButtonText('Remove')
        .setWarning()
        .onClick(async () => {
          delete s.llmKeys[p.id];
          await this.plugin.saveSettings();
          renderStatus();
          // Re-render the input so the cleared value sticks.
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
  private async validateCloudKey(badgeEl: HTMLElement): Promise<void> {
    const s = this.plugin.settings;
    badgeEl.empty();
    badgeEl.removeClass('is-valid', 'is-invalid', 'is-warn');

    if (!s.apiKey) {
      badgeEl.addClass('is-warn');
      badgeEl.createSpan({ text: 'No API key set yet — paste one above to connect.' });
      return;
    }

    badgeEl.createSpan({ text: 'Checking API key…', cls: 'cortex-cloud-status-checking' });
    try {
      const info = await this.plugin.client.getWhoami();
      badgeEl.empty();
      this.renderWhoamiSuccess(badgeEl, info, s.workspaceId);
    } catch (e) {
      const msg = (e as Error).message || '';
      // Distinguish failure modes by parsing the structured error string the
      // CortexClient throws ("Cortex [host] /path → STATUS: body").
      const status = parseStatusFromErrorMessage(msg);
      if (status === 404) {
        // The /v1/api-keys/whoami endpoint isn't deployed on this server yet
        // (cloud may be on an older build). Fall back to a lighter auth probe
        // so we can still confirm the key works without identity details.
        const ok = await this.plugin.client.probeAuth();
        badgeEl.empty();
        if (ok) {
          badgeEl.addClass('is-valid');
          badgeEl.createSpan({
            text: '✓ API key works (server doesn\'t expose identity details)',
            cls: 'cortex-cloud-status-head',
          });
          if (!s.workspaceId) {
            badgeEl.addClass('is-warn');
            badgeEl.createSpan({
              cls: 'cortex-cloud-status-sub',
              text: '⚠ Workspace ID is empty — set it below to enable sync and ask.',
            });
          }
        } else {
          badgeEl.addClass('is-invalid');
          badgeEl.createSpan({
            text: '✗ This API key was rejected by the server. Confirm it was copied correctly from the dashboard, or generate a new one.',
            cls: 'cortex-cloud-status-head',
          });
        }
        return;
      }
      badgeEl.empty();
      badgeEl.addClass('is-invalid');
      if (status === 401 || status === 403) {
        const detail = parseServerErrorDetail(msg);
        const headlineByCode: Record<string, string> = {
          INVALID_API_KEY: 'This key is invalid or expired — generate a fresh one in the dashboard.',
          UNAUTHORIZED: 'Server didn\'t recognise the auth header — make sure you copied the whole key.',
          AUTH_LOCKOUT: 'Too many failed attempts from this IP. Wait a few minutes and try again.',
          WORKSPACE_NOT_ALLOWED: "This key isn't authorised for the workspace ID below. Pick a different workspace, or generate a new key without workspace scoping.",
          FORBIDDEN: detail.message || 'Key is missing the required permissions.',
        };
        const headline = (detail.code && headlineByCode[detail.code]) || `Server rejected the key (${status}).`;
        badgeEl.createSpan({
          text: `✗ ${headline}`,
          cls: 'cortex-cloud-status-head',
        });
        if (detail.code || detail.message) {
          badgeEl.createSpan({
            text: `${detail.code ? `[${detail.code}] ` : ''}${detail.message ?? ''}`.trim(),
            cls: 'cortex-cloud-status-sub',
          });
        }
      } else if (status >= 500) {
        badgeEl.createSpan({
          text: `✗ Server error (${status}) — try again in a moment.`,
          cls: 'cortex-cloud-status-head',
        });
      } else {
        badgeEl.createSpan({
          text: `✗ ${msg.slice(0, 240) || 'Validation failed'}`,
          cls: 'cortex-cloud-status-head',
        });
      }
    }
  }

  /** Render the happy-path identity badge given a successful whoami response. */
  private renderWhoamiSuccess(badgeEl: HTMLElement, info: import('./cortex-client').WhoamiInfo, workspaceId: string): void {
    badgeEl.addClass('is-valid');
    const headParts: string[] = ['✓'];
    if (info.email) headParts.push(info.email);
    else if (info.name) headParts.push(info.name);
    else headParts.push('Authenticated');
    if (info.keyPrefix) headParts.push(`(${info.keyPrefix}…)`);
    badgeEl.createSpan({ text: headParts.join(' '), cls: 'cortex-cloud-status-head' });

    const subParts: string[] = [];
    if (info.lastUsedAt) {
      const ago = relativeTimestamp(info.lastUsedAt);
      if (ago) subParts.push(`Last used ${ago}`);
    }
    if (typeof info.totalRequests === 'number') {
      subParts.push(`${info.totalRequests.toLocaleString()} requests`);
    }
    if (subParts.length > 0) {
      badgeEl.createSpan({ text: subParts.join(' · '), cls: 'cortex-cloud-status-sub' });
    }

    if (!workspaceId) {
      badgeEl.addClass('is-warn');
      badgeEl.createSpan({
        cls: 'cortex-cloud-status-sub',
        text: '⚠ Workspace ID is empty — set it below to enable sync and ask.',
      });
    } else if (info.allowedWorkspaceIds && !info.allowedWorkspaceIds.includes(workspaceId)) {
      badgeEl.addClass('is-warn');
      badgeEl.createSpan({
        cls: 'cortex-cloud-status-sub',
        text: `⚠ This key isn't authorized for workspace ${workspaceId.slice(0, 16)}…`,
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
  private async pushBYOKToRuntime(providerId: string, apiKey: string): Promise<void> {
    // Map BYOK provider IDs (plugin-side) → runtime config provider IDs
    // (server-side). They're mostly the same, but the runtime config uses
    // 'grok' where the plugin uses 'xai'.
    const providerMap: Record<string, 'gemini' | 'openai' | 'anthropic' | 'moonshot' | 'openrouter' | 'grok' | 'huggingface'> = {
      gemini: 'gemini',
      openai: 'openai',
      anthropic: 'anthropic',
      moonshot: 'moonshot',
      openrouter: 'openrouter',
      xai: 'grok',
      huggingface: 'huggingface',
    };
    const runtimeProvider = providerMap[providerId];
    if (!runtimeProvider) return;

    // Pick a sensible default chat model per provider so the runtime
    // config row has both fields populated (server requires provider+model
    // to be valid). The model router's runtime override only kicks in
    // when both are present.
    const defaultModelByProvider: Record<string, string> = {
      gemini: 'gemini-2.5-flash',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-haiku-4-5',
      moonshot: 'kimi-k2',
      openrouter: 'anthropic/claude-sonnet-4-6',
      grok: 'grok-4',
      huggingface: 'moonshotai/Kimi-K2.5',
    };

    // Don't clobber the user's chosen model if they already have one
    // applied via the LLM (runtime) panel. Read the current config first.
    let chatModel: string | undefined;
    try {
      const current = await this.plugin.client.getLlmConfig();
      if (current?.chatProvider === runtimeProvider && current?.chatModel) {
        chatModel = current.chatModel;
      }
    } catch { /* fall through */ }
    chatModel = chatModel ?? defaultModelByProvider[runtimeProvider];

    await this.plugin.client.updateLlmConfig({
      chatProvider: runtimeProvider,
      chatModel,
      chatApiKey: apiKey,
      useOwnChatKey: true,
    });
  }

  private async testProviderKey(provider: string, apiKey: string): Promise<boolean> {
    const apiUrl = this.plugin.settings.apiUrl.replace(/\/$/, '');
    try {
      const res = await requestUrl({
        url: `${apiUrl}/v1/system/test-provider`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.plugin.settings.apiKey}`,
        },
        body: JSON.stringify({ provider, apiKey }),
        throw: false,
      });
      if (res.status >= 200 && res.status < 300) return true;
      if (res.status !== 404) return false;
    } catch {
      // network error — endpoint unreachable; try direct fallback
    }
    return await directProviderProbe(provider, apiKey);
  }

  /**
   * Probe a Cortex API URL and report reachability. Distinguishes:
   *   ok (200) | degraded (503) | reachable-but-non-/health | unreachable
   */
  private async checkLocalHealth(url: string): Promise<boolean> {
    const cleanUrl = url.replace(/\/$/, '');
    // Parse the JSON body so the Stack Health panel can read per-subsystem
    // status. The probe() helper returns the raw status code; we pull the body
    // ourselves with a wrapped requestUrl call.
    const healthResult = await this.probeWithBody(`${cleanUrl}/health`);
    if (healthResult.kind === 'ok' || healthResult.kind === 'http') {
      // Container reachable. Pull subsystem detail if present (newer
      // server builds); fall back to legacy `services` strings if the
      // running container predates the structured subsystems map.
      const subsystems = readSubsystems(healthResult.body);
      this.lastHealthSubsystems = subsystems;
      this.lastHealthVersion = readVersion(healthResult.body);

      if (healthResult.kind === 'ok') {
        this.lastHealthDetail = `Connected to ${cleanUrl}`;
        return true;
      }
      if (healthResult.status === 503) {
        const downCount = subsystems
          ? Object.values(subsystems).filter(v => v.status === 'down').length
          : 0;
        this.lastHealthDetail = downCount > 0
          ? `Container reachable but ${downCount} ${downCount === 1 ? 'service' : 'services'} degraded — see Stack health below.`
          : 'Container reachable but degraded (503). Check Docker logs.';
        return true;
      }
      this.lastHealthDetail = `Container reachable (${healthResult.status} from /health).`;
      return true;
    }
    const rootResult = await this.probeWithBody(cleanUrl);
    if (rootResult.kind !== 'network') {
      this.lastHealthSubsystems = null;
      this.lastHealthVersion = null;
      this.lastHealthDetail = `Container reachable at ${cleanUrl} (no /health endpoint).`;
      return true;
    }
    this.lastHealthSubsystems = null;
    this.lastHealthVersion = null;
    this.lastHealthDetail = `Cannot reach ${cleanUrl} — ${healthResult.error}`;
    return false;
  }

  private async probeWithBody(url: string): Promise<
    | { kind: 'ok'; status: number; body: unknown }
    | { kind: 'http'; status: number; body: unknown }
    | { kind: 'network'; error: string }
  > {
    try {
      const res = await Promise.race([
        requestUrl({ url, method: 'GET', throw: false }),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('timeout after 5s')), 5000),
        ),
      ]);
      let body: unknown = null;
      try { body = res.json; } catch { /* non-JSON; leave null */ }
      if (res.status >= 200 && res.status < 400) return { kind: 'ok', status: res.status, body };
      return { kind: 'http', status: res.status, body };
    } catch (e) {
      return { kind: 'network', error: (e as Error).message || 'connection refused' };
    }
  }
}

/**
 * Pull the structured subsystems map out of /health's JSON. Newer server
 * builds return `data.subsystems = { name: { status, latencyMs?, error? } }`;
 * older builds only have `data.services = { name: 'connected'|'disconnected'|'not_configured' }`,
 * which we adapt to the same shape so the renderer doesn't have to branch.
 */
function readSubsystems(
  body: unknown,
): Record<string, { status: 'ok' | 'down' | 'not_configured'; latencyMs?: number; error?: string }> | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return null;

  const subs = (data as Record<string, unknown>).subsystems;
  if (subs && typeof subs === 'object') {
    return subs as Record<string, { status: 'ok' | 'down' | 'not_configured'; latencyMs?: number; error?: string }>;
  }

  // Legacy fallback: synthesize from the string-based `services` map so older
  // containers still show *something* in the Stack Health panel.
  const services = (data as Record<string, unknown>).services;
  if (services && typeof services === 'object') {
    const out: Record<string, { status: 'ok' | 'down' | 'not_configured' }> = {};
    for (const [k, v] of Object.entries(services as Record<string, unknown>)) {
      if (v === 'connected') out[k] = { status: 'ok' };
      else if (v === 'not_configured') out[k] = { status: 'not_configured' };
      else out[k] = { status: 'down' };
    }
    return out;
  }
  return null;
}

function readVersion(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return null;
  const v = (data as Record<string, unknown>).version;
  return typeof v === 'string' ? v : null;
}

/**
 * Variant of buildDockerCompose() that bakes BYOK provider keys directly into
 * the YAML environment block. Falls back to env-var pass-through (`${VAR:-}`)
 * for any provider the user hasn't configured.
 */
function providerLabel(id: string): string {
  switch (id) {
    case 'openai':     return 'OpenAI';
    case 'anthropic':  return 'Anthropic (Claude)';
    case 'gemini':     return 'Google Gemini';
    case 'grok':       return 'xAI (Grok)';
    case 'moonshot':   return 'Moonshot (Kimi)';
    case 'huggingface': return 'HuggingFace (HF Inference)';
    case 'ollama':     return 'Ollama (local)';
    case 'openrouter': return 'OpenRouter';
    default:           return id;
  }
}

/**
 * Map a runtime-LLM provider id to the corresponding `llmKeys.*` field that
 * stores the provisioned key in the BYOK section. Ollama is local and never
 * needs a key — returning null signals the runtime dropdown to leave it
 * enabled regardless of what's in llmKeys.
 */
function runtimeProviderKeyField(runtimeId: string): keyof CortexSettings['llmKeys'] | null {
  switch (runtimeId) {
    case 'openai':     return 'openai';
    case 'anthropic':  return 'anthropic';
    case 'gemini':     return 'gemini';
    case 'grok':       return 'xai';
    case 'moonshot':    return 'moonshot';
    case 'openrouter':  return 'openrouter';
    case 'huggingface': return 'huggingface';
    case 'ollama':      return null;
    default:            return null;
  }
}

/**
 * Inverse of runtimeProviderKeyField — used by renderProviderKeysSection to
 * decide whether a key row should show the "active for chat" chip. Returns
 * the runtime-LLM provider id whose key lives in `llmKeys.<keysFieldId>`,
 * or null when no runtime maps to it (e.g. cohere/jina are reranker-only).
 */
function keysFieldToRuntimeProvider(keysFieldId: string): string | null {
  switch (keysFieldId) {
    case 'openai':     return 'openai';
    case 'anthropic':  return 'anthropic';
    case 'gemini':     return 'gemini';
    case 'xai':        return 'grok';
    case 'moonshot':    return 'moonshot';
    case 'openrouter':  return 'openrouter';
    case 'huggingface': return 'huggingface';
    default:            return null;
  }
}

function buildDockerComposeWithKeys(s: CortexSettings): string {
  const base = buildDockerCompose(
    s.connectorEncryptionKey,
    s.llmEncryptionKey,
    s.embeddingPreset || 'gemini',
  );
  const pairs: Array<[string, string | undefined]> = [
    ['GEMINI_API_KEY', s.llmKeys.gemini],
    ['OPENAI_API_KEY', s.llmKeys.openai],
    ['ANTHROPIC_API_KEY', s.llmKeys.anthropic],
    ['MOONSHOT_API_KEY', s.llmKeys.moonshot],
    ['HF_TOKEN', s.llmKeys.huggingface],
    ['OPENROUTER_API_KEY', s.llmKeys.openrouter],
    ['XAI_API_KEY', s.llmKeys.xai],
    ['COHERE_API_KEY', s.llmKeys.cohere],
    ['JINA_API_KEY', s.llmKeys.jina],
    ['PERPLEXITY_API_KEY', s.llmKeys.perplexity],
    ['TAVILY_API_KEY', s.llmKeys.tavily],
  ];
  let out = base;
  for (const [envName, value] of pairs) {
    if (!value) continue;
    const escaped = envName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped}: )\\$\\{${escaped}:-\\}`, 'g');
    out = out.replace(re, `$1"${value.replace(/"/g, '\\"')}"`);
  }
  return out;
}

function restartHint(agentId: string): string {
  switch (agentId) {
    case 'claude-desktop': return 'Restart Claude Desktop to activate.';
    case 'claude-code':    return 'Reload Claude Code (or open a new session) to pick up the change.';
    case 'cursor':         return 'Restart Cursor to pick up the new MCP server.';
    case 'cline':          return 'Reload the VS Code window to refresh Cline\'s MCP servers.';
    case 'windsurf':       return 'Restart Windsurf to pick up the new MCP server.';
    default:               return '';
  }
}

/**
 * Parse the HTTP status code out of a CortexClient error message. Errors are
 * formatted as "Cortex [host] /path → STATUS: body"; this finds STATUS so the
 * UI can react differently to 404 (endpoint missing) vs 401 (bad key).
 * Returns 0 if the status can't be extracted.
 */
function parseStatusFromErrorMessage(msg: string): number {
  const m = msg.match(/→ (\d{3}):/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Pull the structured error code + message out of a CortexClient error string.
 * Server responses look like {success:false, error:{code, message}} — we want
 * those fields so the badge can show the real reason ("INVALID_API_KEY") rather
 * than a generic "401/403". Returns blanks when the body isn't JSON.
 */
function parseServerErrorDetail(msg: string): { code?: string; message?: string } {
  const m = msg.match(/→ \d{3}: (.*)$/s);
  if (!m) return {};
  try {
    const body = JSON.parse(m[1]) as { code?: string; message?: string; error?: { code?: string; message?: string } };
    return {
      code: body.error?.code || body.code,
      message: body.error?.message || body.message,
    };
  } catch {
    return { message: m[1].slice(0, 240) };
  }
}

/**
 * Compact relative-time formatter — "2m ago", "3h ago", "5d ago".
 * Returns empty string on parse failure rather than throwing.
 */
function relativeTimestamp(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const ms = Date.now() - t;
  if (ms < 0) return 'just now';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'just now';
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

function maskKey(k: string): string {
  if (!k) return '';
  if (k.length <= 12) return '·'.repeat(k.length);
  return `${k.slice(0, 6)}····${k.slice(-4)}`;
}

async function directProviderProbe(provider: string, apiKey: string): Promise<boolean> {
  const headers: Record<string, string> = { 'Authorization': `Bearer ${apiKey}` };
  let url: string;
  switch (provider) {
    case 'gemini':
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      delete headers.Authorization;
      break;
    case 'openai':      url = 'https://api.openai.com/v1/models'; break;
    case 'anthropic':   return await probeAnthropic(apiKey);
    case 'moonshot':    url = 'https://api.moonshot.ai/v1/models'; break;
    case 'huggingface': url = 'https://huggingface.co/api/whoami-v2'; break;
    case 'openrouter':  url = 'https://openrouter.ai/api/v1/models'; break;
    case 'xai':         url = 'https://api.x.ai/v1/models'; break;
    default: return false;
  }
  try {
    const res = await requestUrl({ url, method: 'GET', headers, throw: false });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

async function probeAnthropic(apiKey: string): Promise<boolean> {
  try {
    const res = await requestUrl({
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      throw: false,
    });
    return res.status === 200 || res.status === 400;
  } catch {
    return false;
  }
}
