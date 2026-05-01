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
      OLLAMA_BASE_URL: \${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      MCP_ALLOW_UNAUTHENTICATED: "true"
      BOOTSTRAP_SECRET: cortex-local
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
  excludePatterns: ['.cortex/', '.obsidian/', 'templates/'],
  includeFolders: [],
  syncOnStartup: true,
  autoSyncDebounceMs: 2000,
  syncAttachments: true,
  attachmentMaxBytes: 10 * 1024 * 1024,
  defaultRightPane: 'chat',
  showRelatedPane: true,
  inlineSuggestionsEnabled: true,
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

    /* ── 1. Settings ──────────────────────────────────────────────── */

    containerEl.createEl('h3', { text: 'Settings' });

    new Setting(containerEl)
      .setName('Mode')
      .setDesc('Choose where HangarX runs. Cloud uses the hosted API. Local runs everything on your machine via Docker.')
      .addDropdown(d => d
        .addOption('cloud', '☁️  Cloud (HangarX hosted)')
        .addOption('local', '🏠  Local (Docker)')
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


    /* ── 2. Agents ─────────────────────────────────────────────────── */

    this.renderAgentsSection(containerEl);

    /* ── 2b. LLM (runtime) ─────────────────────────────────────────── */

    this.renderLlmRuntimeSection(containerEl);

    /* ── 3. What to sync ───────────────────────────────────────────── */

    containerEl.createEl('h3', { text: 'What to sync' });

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
      .setName('Exclude patterns')
      .setDesc('Comma-separated path prefixes to skip when pushing to HangarX.')
      .addText(t => t
        .setValue(this.plugin.settings.excludePatterns.join(','))
        .onChange(async v => {
          this.plugin.settings.excludePatterns = v.split(',').map(x => x.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sync attachments')
      .setDesc('Ingest images, PDFs, and other binaries referenced by your notes.')
      .addToggle(t => t
        .setValue(this.plugin.settings.syncAttachments)
        .onChange(async v => { this.plugin.settings.syncAttachments = v; await this.plugin.saveSettings(); }));

    /* ── 4. Sync behavior ─────────────────────────────────────────── */

    containerEl.createEl('h3', { text: 'Sync behavior' });

    new Setting(containerEl)
      .setName('Sync on startup')
      .setDesc('Run a full vault sync when Obsidian launches. Skips files unchanged since the last sync.')
      .addToggle(t => t
        .setValue(this.plugin.settings.syncOnStartup)
        .onChange(async v => { this.plugin.settings.syncOnStartup = v; await this.plugin.saveSettings(); }));

    /* ── 4b. Import cloud graph ───────────────────────────────────── */

    containerEl.createEl('h3', { text: 'Import Cortex graph' });

    const importDesc = containerEl.createEl('p', { cls: 'setting-item-description' });
    importDesc.setText(
      'Pull entities and relationships from your Cortex cloud workspace into your vault as markdown files. ' +
      'Pulled notes appear in Obsidian\'s native graph view, with [[wikilinks]] for every relationship. ' +
      'Re-running is incremental — only changed entities are rewritten.',
    );

    new Setting(containerEl)
      .setName('Graph folder')
      .setDesc('Where pulled entity files live. Folder is excluded from sync to prevent feedback loops.')
      .addText(t => t
        .setValue(this.plugin.settings.graphPullFolder)
        .setPlaceholder('.cortex/graph')
        .onChange(async v => {
          this.plugin.settings.graphPullFolder = v.trim() || '.cortex/graph';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Entity types')
      .setDesc('Comma-separated list of entity types to pull. Leave empty to pull a sensible default set (Concept, Person, Organization, Topic, Location, Event, …).')
      .addText(t => t
        .setValue(this.plugin.settings.graphPullEntityTypes.join(', '))
        .setPlaceholder('Concept, Person, Topic')
        .onChange(async v => {
          this.plugin.settings.graphPullEntityTypes = v
            .split(',').map(s => s.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Enrich source notes')
      .setDesc('Add `cortex_entities` frontmatter to your existing notes that mention pulled entities — creates bidirectional wikilinks.')
      .addToggle(t => t
        .setValue(this.plugin.settings.graphPullEnrichSourceNotes)
        .onChange(async v => {
          this.plugin.settings.graphPullEnrichSourceNotes = v;
          await this.plugin.saveSettings();
        }));

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

    /* ── 5. Interface ─────────────────────────────────────────────── */

    containerEl.createEl('h3', { text: 'Interface' });

    new Setting(containerEl)
      .setName('Default right pane')
      .setDesc('Which sidebar auto-opens on startup. "Ask your vault" is always-on chat over your knowledge graph; "Related notes" surfaces semantically similar notes for the current file.')
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
      .setDesc('Show ghost-text [[wikilink]] suggestions while typing — driven by entity matches in your graph. Tab to accept, Esc to dismiss.')
      .addToggle(t => t
        .setValue(this.plugin.settings.inlineSuggestionsEnabled)
        .onChange(async v => { this.plugin.settings.inlineSuggestionsEnabled = v; await this.plugin.saveSettings(); }));

    /* ── 6. Help ──────────────────────────────────────────────────── */

    containerEl.createEl('h3', { text: 'Help' });

    new Setting(containerEl)
      .setName('Documentation')
      .setDesc('Quick start, agent setup, troubleshooting, and the full plugin guide.')
      .addButton(b => b
        .setButtonText('View README')
        .onClick(() => new ReadmeModal(this.app).open()))
      .addButton(b => b
        .setButtonText('Open online')
        .setCta()
        .onClick(() => window.open('https://app.hangarx.ai/obsidian', '_blank')));
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
        text: 'Sign in with HangarX',
        cls: 'mod-cta',
      });
      signInBtn.addEventListener('click', () => this.startInteractiveSignIn(signInBtn, s));
      const dashBtn = introActions.createEl('button', { text: 'Open dashboard ↗' });
      dashBtn.addEventListener('click', () => {
        window.open('https://app.hangarx.ai/settings?tab=api-keys', '_blank');
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
      window.open('https://app.hangarx.ai/settings?tab=api-keys', '_blank');
    });
    const signOutBtn = actions.createEl('button', { text: 'Sign out' });
    signOutBtn.addEventListener('click', async () => {
      s.apiKey = '';
      s.workspaceId = '';
      await this.plugin.saveSettings();
      this.display();
    });

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
      setupCard.style.display = ok ? 'none' : '';
      runningCard.style.display = ok ? '' : 'none';
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
    hero.createEl('div', { cls: 'cortex-local-hero-title', text: 'Set up HangarX in three steps' });
    hero.createEl('div', {
      cls: 'cortex-local-hero-sub',
      text: 'HangarX runs Postgres, FalkorDB, and the Cortex API on your machine via Docker. ' +
            'Pulls images from Docker Hub — no source code needed.',
    });

    const configuredKeys = (Object.keys(s.llmKeys) as Array<keyof CortexSettings['llmKeys']>)
      .filter(k => !!s.llmKeys[k]);
    const hasKey = configuredKeys.length > 0;

    // 1. Add a provider key — gate that's actually load-bearing.
    const step1 = hero.createDiv({ cls: 'cortex-local-hero-step' });
    step1.createEl('span', { cls: 'cortex-local-hero-step-num', text: '1.' });
    const step1Body = step1.createDiv({ cls: 'cortex-local-hero-step-body' });
    step1Body.createEl('div', {
      text: hasKey
        ? `Add an LLM provider key — ✓ ${configuredKeys.length} configured`
        : 'Add an LLM provider key',
      cls: 'cortex-local-hero-step-label',
    });
    step1Body.createEl('div', {
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
      if (target instanceof HTMLDetailsElement) target.open = true;
    });

    // 2. Save the Compose file.
    const step2 = hero.createDiv({ cls: 'cortex-local-hero-step' });
    step2.createEl('span', { cls: 'cortex-local-hero-step-num', text: '2.' });
    const step2Body = step2.createDiv({ cls: 'cortex-local-hero-step-body' });
    step2Body.createEl('div', { text: 'Save docker-compose.cortex.yml to your vault', cls: 'cortex-local-hero-step-label' });
    step2Body.createEl('div', {
      cls: 'setting-item-description',
      text: 'Bakes your API key + provider keys into the file. Re-save anytime they change.',
    });
    const step2Actions = step2Body.createDiv({ cls: 'cortex-local-hero-step-actions' });
    const saveBtn = step2Actions.createEl('button', { text: 'Save to vault', cls: 'mod-cta' });
    saveBtn.addEventListener('click', async () => {
      try {
        const path = 'docker-compose.cortex.yml';
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        saveBtn.setText('✓ Saved');
        setTimeout(() => saveBtn.setText('Save to vault'), 2000);
      } catch (e) {
        saveBtn.setText('Failed — check console');
        console.error('[Cortex] Failed to write compose file:', e);
      }
    });
    const copyYamlBtn = step2Actions.createEl('button', { text: 'Copy YAML' });
    copyYamlBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      copyYamlBtn.setText('Copied');
      setTimeout(() => copyYamlBtn.setText('Copy YAML'), 1400);
    });

    // 3. Run docker compose.
    const step3 = hero.createDiv({ cls: 'cortex-local-hero-step' });
    step3.createEl('span', { cls: 'cortex-local-hero-step-num', text: '3.' });
    const step3Body = step3.createDiv({ cls: 'cortex-local-hero-step-body' });
    step3Body.createEl('div', { text: 'Run this in your vault folder:', cls: 'cortex-local-hero-step-label' });
    const codeWrap = step3Body.createDiv({ cls: 'cortex-mcp-code-wrap' });
    const copyCmdBtn = codeWrap.createEl('button', { cls: 'cortex-mcp-copy', text: 'Copy' });
    copyCmdBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(DOCKER_START_CMD);
      copyCmdBtn.textContent = 'Copied';
      copyCmdBtn.addClass('is-copied');
      setTimeout(() => {
        copyCmdBtn.textContent = 'Copy';
        copyCmdBtn.removeClass('is-copied');
      }, 1400);
    });
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
    card.style.margin = '8px 0 16px';
    card.style.padding = '14px 16px';
    card.style.borderLeft = '3px solid #22c55e';
    card.style.background = 'rgba(34, 197, 94, 0.08)';
    card.style.borderRadius = '4px';
    card.style.color = 'var(--text-normal)';
    card.createEl('div', {
      text: '✓ Local stack running',
      attr: { style: 'font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--text-normal);' },
    });
    card.createEl('div', {
      text: `Connected to ${s.apiUrl}. Your vault is ready to be searched and indexed by AI agents.`,
      attr: { style: 'font-size: 13px; color: var(--text-normal); opacity: 0.85;' },
    });
    card.createEl('div', {
      text: 'Verify with Cmd/Ctrl+P → "HangarX: Memory stats". Manage agents under the Agents section below.',
      attr: { style: 'font-size: 13px; color: var(--text-normal); opacity: 0.7; margin-top: 6px;' },
    });
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
      const dockerBtn = actions.createEl('button', { text: 'Open in Docker Desktop' });
      dockerBtn.addEventListener('click', () => void this.openDockerDesktop());

      const revealBtn = actions.createEl('button', { text: 'Reveal docker-compose.cortex.yml' });
      revealBtn.addEventListener('click', () => {
        if (fullYmlPath) {
          const showInFolder = (this.plugin.app as unknown as { showInFolder?(p: string): void }).showInFolder;
          if (typeof showInFolder === 'function') {
            showInFolder.call(this.plugin.app, fullYmlPath);
          } else {
            new Notice(`docker-compose.cortex.yml lives at: ${fullYmlPath}`);
          }
        }
      });
    } else {
      const hint = actions.createDiv({ cls: 'cortex-stack-health-yml-hint' });
      hint.createEl('span', {
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
      new Notice('Docker Desktop launch is desktop-only.');
      return;
    }

    const cp = (window as any).require?.('child_process') as
      | typeof import('child_process')
      | undefined;
    if (!cp) {
      new Notice('child_process unavailable. Open Docker Desktop manually.');
      return;
    }

    // Try Electron's shell first — it understands the docker-desktop://
    // URL on systems where it works, and falls back to OS handlers
    // gracefully on systems where it doesn't.
    try {
      const electron = (window as any).require?.('electron') as { shell?: { openExternal?(url: string): Promise<void> } };
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
        setTimeout(() => resolve(true), 200);
      } catch {
        resolve(false);
      }
    });

    if (Platform.isMacOS) {
      const ok = await tryLaunch('open', ['-a', 'Docker']);
      if (ok) {
        new Notice('Launched Docker Desktop.');
        return;
      }
      new Notice('Couldn\'t launch Docker Desktop. Open it manually from Applications.');
      return;
    }

    if (Platform.isWin) {
      // PowerShell `Start-Process` resolves the friendly name via the
      // Start Menu / shell apps, which works regardless of where Docker
      // Desktop is installed.
      const ok = await tryLaunch('powershell', ['-NoProfile', '-Command', 'Start-Process "Docker Desktop"'])
        || await tryLaunch('cmd', ['/c', 'start', '', 'Docker Desktop']);
      if (ok) {
        new Notice('Launched Docker Desktop.');
        return;
      }
      new Notice('Couldn\'t launch Docker Desktop. Open it from the Start menu.');
      return;
    }

    if (Platform.isLinux) {
      const ok = await tryLaunch('docker-desktop', [])
        || await tryLaunch('xdg-open', ['docker-desktop://dashboard/containers']);
      if (ok) {
        new Notice('Launched Docker Desktop.');
        return;
      }
      new Notice('Couldn\'t launch Docker Desktop. Run `docker-desktop` from a terminal.');
      return;
    }

    new Notice('Unsupported platform for Docker Desktop launch.');
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
    container.createEl('div', { cls: 'cortex-stack-health-logs-header', text: 'docker compose logs --tail=200 cortex-api' });
    const pre = container.createEl('pre', { cls: 'cortex-stack-health-logs-pre' });
    const code = pre.createEl('code', { text: 'Running…' });

    try {
      // Lazy require — `child_process` doesn't exist on mobile, and the
      // dynamic import keeps esbuild from complaining about bundling Node
      // builtins for the mobile target.
      const cp = (window as any).require?.('child_process') as
        | typeof import('child_process')
        | undefined;
      const path = (window as any).require?.('path') as typeof import('path') | undefined;
      if (!cp || !path) {
        code.setText('child_process unavailable on this platform — copy the command above and run it in a terminal.');
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
            if (err && !out && !errOut) return reject(err);
            resolve((out as string) + (errOut ? `\n--- stderr ---\n${errOut}` : ''));
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
      recovery.createEl('div', { cls: 'cortex-stack-health-recovery-headline', text: headline });

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
    row.createEl('div', { cls: 'cortex-stack-health-cmd-label', text: label });
    const codeWrap = row.createDiv({ cls: 'cortex-stack-health-cmd-codewrap' });
    codeWrap.createEl('pre').createEl('code', { text: command });
    const copyBtn = codeWrap.createEl('button', { cls: 'cortex-stack-health-cmd-copy', text: 'Copy' });
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(command);
      copyBtn.setText('Copied');
      setTimeout(() => copyBtn.setText('Copy'), 1400);
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
  private renderConnectionDetails(parent: HTMLElement, s: CortexSettings): void {
    const wrap = parent.createEl('details', { cls: 'cortex-cloud-advanced' });
    wrap.createEl('summary', { text: 'Connection details — Compose file, URL, workspace, API key' });
    const body = wrap.createDiv();

    new Setting(body)
      .setName('Docker Compose file')
      .setDesc('Re-save the YAML when you change provider keys, then run docker compose up -d --force-recreate to apply.')
      .addButton(b => b
        .setButtonText('Save to vault')
        .setCta()
        .onClick(async () => {
          const path = 'docker-compose.cortex.yml';
          try {
            await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
            b.setButtonText('✓ Saved');
            new Notice(
              `Saved ${path}. If the stack is already running, apply with: docker compose -f ${path} up -d --force-recreate`,
              8000,
            );
            setTimeout(() => b.setButtonText('Save to vault'), 2000);
          } catch (e) {
            b.setButtonText('Failed');
            console.error('[Cortex] Failed to write compose file:', e);
            setTimeout(() => b.setButtonText('Save to vault'), 2000);
          }
        }))
      .addButton(b => b
        .setButtonText('Copy YAML')
        .onClick(async () => {
          await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
          b.setButtonText('Copied');
          setTimeout(() => b.setButtonText('Copy YAML'), 1400);
        }));

    new Setting(body)
      .setName('API URL')
      .setDesc('Your local HangarX API URL. Defaults to http://localhost:3400 — only change if you remapped the port.')
      .addText(t => t
        .setPlaceholder(LOCAL_API_URL)
        .setValue(s.apiUrl)
        .onChange(async v => { s.apiUrl = v || LOCAL_API_URL; await this.plugin.saveSettings(); }));

    new Setting(body)
      .setName('Workspace ID')
      .setDesc('A namespace for your graph data. Auto-generated; only change if you want multiple isolated graphs.')
      .addText(t => t
        .setPlaceholder('default')
        .setValue(s.workspaceId)
        .onChange(async v => { s.workspaceId = v.trim() || 'default'; await this.plugin.saveSettings(); }));

    new Setting(body)
      .setName('API key')
      .setDesc('Saved cloud API key. Local mode is auth-disabled and ignores this value, but the key is preserved across mode switches so you don\'t have to re-sign-in.')
      .addText(t => {
        t.inputEl.type = 'password';
        t.setPlaceholder('ctx_…')
          .setValue(s.apiKey)
          .onChange(async v => { s.apiKey = v.trim(); await this.plugin.saveSettings(); });
      })
      .addExtraButton(b => b
        .setIcon('eye')
        .setTooltip('Show/hide')
        .onClick(() => {
          const inputs = Array.from(body.querySelectorAll<HTMLInputElement>('input'));
          for (const el of inputs) {
            if (el.placeholder === 'ctx_…' || el.value === s.apiKey) {
              el.type = el.type === 'password' ? 'text' : 'password';
            }
          }
        }))
      .addExtraButton(b => b
        .setIcon('copy')
        .setTooltip('Copy to clipboard')
        .onClick(async () => {
          if (!s.apiKey) { new Notice('No API key saved.'); return; }
          await navigator.clipboard.writeText(s.apiKey);
          new Notice('API key copied.');
        }));
  }

  /** Kicks off the OAuth sign-in flow, swapping the button label while it's in flight. */
  private async startInteractiveSignIn(signInBtn: HTMLButtonElement, s: CortexSettings): Promise<void> {
    const original = signInBtn.textContent;
    signInBtn.setText('Opening browser…');
    signInBtn.setAttr('disabled', 'true');
    try {
      const result = await startSignIn({
        dashboardUrl: 'https://app.hangarx.ai',
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
      validateTimer = window.setTimeout(() => this.validateCloudKey(statusBadge), 600);
    };

    new Setting(parent)
      .setName('API Key')
      .setDesc('Org-scoped API key from your HangarX dashboard.')
      .addText(t => {
        t.inputEl.type = 'password';
        t.setPlaceholder('ctx_…')
          .setValue(s.apiKey)
          .onChange(async v => {
            s.apiKey = v.trim();
            await this.plugin.saveSettings();
            scheduleValidate();
          });
      })
      .addButton(b => b
        .setButtonText('Test')
        .setTooltip('Validate the API key by calling /v1/api-keys/whoami')
        .onClick(() => this.validateCloudKey(statusBadge)));

    new Setting(parent)
      .setName('Workspace ID')
      .setDesc('Found in your HangarX workspace settings (Settings → Workspaces).')
      .addText(t => t
        .setPlaceholder('ws_…')
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
    parent.createEl('h3', { text: 'LLM (runtime)' });
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
    const link = xref.createEl('a', { text: 'LLM provider keys', href: '#' });
    link.addEventListener('click', evt => {
      evt.preventDefault();
      const target = parent.querySelector<HTMLElement>('[data-cortex-keys-anchor]')
        ?? this.containerEl.querySelector<HTMLElement>('[data-cortex-keys-anchor]');
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (target instanceof HTMLDetailsElement) target.open = true;
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
        { id: 'llama3', label: 'llama3 (8B)' },
        { id: 'llama3.2', label: 'llama3.2' },
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
    };

    let modelsByProvider: Record<string, Array<{ id: string; label: string }>> = { ...FALLBACK_MODELS };
    let currentProvider: string = '';
    let currentModel: string = '';
    let currentApiKey: string = '';
    const providerSel = { value: '' };
    const modelSel = { value: '' };

    // Capture the dropdown element so we can re-evaluate which providers are
    // "configured" each time the panel renders (the user may have just added
    // a key in the section above and re-opened settings).
    let providerDropdownEl: HTMLSelectElement | null = null;

    const providerSetting = new Setting(wrap)
      .setName('Chat provider')
      .setDesc('Which LLM provider runs chat completions. Greyed-out providers need a key configured first.')
      .addDropdown(d => {
        const s = this.plugin.settings;
        for (const id of ['openai', 'anthropic', 'gemini', 'grok', 'moonshot', 'ollama', 'openrouter']) {
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
        providerDropdownEl = (d as any).selectEl as HTMLSelectElement;
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

    let apiKeyInput: any = null;
    const keySetting = new Setting(wrap)
      .setName('API key')
      .setDesc('Optional. Leave blank to keep the existing key. Required only when switching providers or rotating.')
      .addText(t => {
        apiKeyInput = t;
        t.inputEl.type = 'password';
        t.setPlaceholder('sk-… / AIza… / etc.');
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
      const dropdown = (modelSetting.components[0] as any).selectEl as HTMLSelectElement;
      while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
      const list = modelsByProvider[providerSel.value] ?? [];
      if (list.length === 0) {
        const opt = document.createElement('option');
        opt.value = ''; opt.text = `— no models registered for ${providerSel.value} —`;
        dropdown.appendChild(opt);
        modelSel.value = '';
        return;
      }
      for (const m of list) {
        const opt = document.createElement('option');
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
      currentApiKey = '';
      providerSel.value = currentProvider || 'gemini';
      modelSel.value = currentModel;
      const pDropdown = (providerSetting.components[0] as any).selectEl as HTMLSelectElement;
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
        const list = (p.models ?? []).map((m: any) => ({
          id: m.id,
          label: m.label || m.name || m.id,
        }));
        // Only overwrite the fallback when the server actually returned models
        // for this provider — otherwise keep the seed so the user has options.
        if (list.length > 0) {
          modelsByProvider[p.id] = list;
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
        } as import('./cortex-client').LlmRuntimeConfig);
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

    testBtn.addEventListener('click', async () => {
      if (!providerSel.value || !modelSel.value) {
        setStatus('Pick a provider and model first.', 'err');
        return;
      }
      const apiKey = apiKeyInput?.getValue?.() as string | undefined;
      testBtn.setAttr('disabled', 'true');
      testBtn.setText('Testing…');
      try {
        const r = await this.plugin.client.testLlmConfig({
          provider: providerSel.value as any,
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
    });

    applyBtn.addEventListener('click', async () => {
      if (!providerSel.value || !modelSel.value) {
        setStatus('Pick a provider and model first.', 'err');
        return;
      }
      const apiKey = apiKeyInput?.getValue?.() as string | undefined;
      applyBtn.setAttr('disabled', 'true');
      applyBtn.setText('Applying…');
      try {
        const cfg = await this.plugin.client.updateLlmConfig({
          chatProvider: providerSel.value as any,
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
    });
  }

  private renderAgentsSection(parent: HTMLElement): void {
    parent.createEl('h3', { text: 'Agents' });
    parent.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Make this vault available as a memory + context layer for AI agents on this machine — Claude Desktop, Claude Code, Cursor, or anything else that speaks MCP. ' +
        'Your notes, decisions, and project history become permanent agent context across sessions.',
    });

    parent.createEl('h4', { text: 'Local agents', cls: 'cortex-agents-subhead' });
    const connectRow = parent.createDiv({ cls: 'cortex-agents-connect-row' });
    this.renderAgentConnectCards(connectRow);

    // Cloud agents — only meaningful when the user is signed into the cloud
    // (the synced graph lives at cortex.hangarx.ai). In Local mode there's no
    // remote endpoint to point cloud agents at, so we suppress the section.
    if (this.plugin.settings.connectionMode === 'cloud' && this.plugin.settings.apiKey) {
      this.renderCloudAgentsSection(parent);
    }

    new Setting(parent)
      .setName('Enable local MCP server')
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
        text: 'Enable the MCP server to expose memory tools to agents. The server only listens on localhost.',
      });
      return;
    }

    // Advanced details — port, token, raw config snippet — folded.
    const advanced = parent.createEl('details', { cls: 'cortex-mcp-advanced' });
    advanced.createEl('summary', { text: 'Advanced MCP details (port, token, manual config snippet)' });
    const advBody = advanced.createDiv();

    new Setting(advBody)
      .setName('MCP port')
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
        .setName('MCP URL')
        .addText(t => { t.inputEl.readOnly = true; t.setValue(url); });

      new Setting(advBody)
        .setName('MCP token')
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
  "hangarx-obsidian": {
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
      const codeWrap = example.createEl('div', { cls: 'cortex-mcp-code-wrap' });
      const copyBtn = codeWrap.createEl('button', {
        cls: 'cortex-mcp-copy',
        text: 'Copy',
      });
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(snippet);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        copyBtn.addClass('is-copied');
        setTimeout(() => {
          copyBtn.textContent = original;
          copyBtn.removeClass('is-copied');
        }, 1400);
      });
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
        text: 'Bridge script not yet generated. Toggle the MCP server off and on to regenerate.',
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
    head.createEl('span', { cls: 'cortex-agent-row-label', text: h.label });
    const status = head.createEl('span', { cls: 'cortex-agent-row-status', text: '…' });
    main.createEl('span', { cls: 'cortex-agent-row-desc', text: h.description });

    const actions = row.createDiv({ cls: 'cortex-agent-row-actions' });
    const connectBtn = actions.createEl('button', { text: 'Connect' });

    void checkConnection(h.configPath).then(s => {
      if (s.connected) {
        status.setText('✓ Connected');
        status.addClass('is-connected');
        connectBtn.setText('Reconnect');
      } else if (s.exists) {
        status.setText('Not connected');
      } else {
        status.setText('Not installed');
        status.addClass('is-faint');
      }
    });

    connectBtn.addEventListener('click', async () => {
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
    });

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
      .setTitle('Copy MCP snippet')
      .setIcon('code')
      .onClick(async () => {
        const snippet = JSON.stringify(
          { mcpServers: { 'hangarx-obsidian': buildBridgeEntry(bridge) } },
          null,
          2,
        );
        await navigator.clipboard.writeText(snippet);
        new Notice('MCP config snippet copied.');
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
    main.createEl('span', { cls: 'cortex-agent-row-label', text: 'Other MCP-compatible app' });
    main.createEl('span', {
      cls: 'cortex-agent-row-desc',
      text: 'Copy the snippet below into any client that speaks MCP (Zed, Goose, Codex CLI, custom agents).',
    });

    const body = row.createDiv({ cls: 'cortex-agent-row-body' });
    const entry = { mcpServers: { 'hangarx-obsidian': buildBridgeEntry(bridge) } };
    const snippet = JSON.stringify(entry, null, 2);

    const codeWrap = body.createDiv({ cls: 'cortex-mcp-code-wrap' });
    const copyBtn = codeWrap.createEl('button', { cls: 'cortex-mcp-copy', text: 'Copy' });
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(snippet);
      copyBtn.setText('Copied');
      copyBtn.addClass('is-copied');
      setTimeout(() => { copyBtn.setText('Copy'); copyBtn.removeClass('is-copied'); }, 1400);
    });
    codeWrap.createEl('pre').createEl('code', { text: snippet });
  }

  /**
   * Cloud agents section. Same vault, accessed remotely from a cloud-side
   * agent (Claude.ai web/mobile, ChatGPT desktop, Cursor on a remote dev
   * box) rather than via the local MCP bridge. The cloud already exposes a
   * public MCP endpoint at cortex.hangarx.ai/mcp; agents authenticate with
   * the same `ctx_…` API key the plugin already has, so we just need to
   * surface the URL + key in copy-pasteable form.
   */
  private renderCloudAgentsSection(parent: HTMLElement): void {
    const apiKey = this.plugin.settings.apiKey;
    const apiUrl = (this.plugin.settings.apiUrl || 'https://cortex.hangarx.ai').replace(/\/$/, '');
    const mcpUrl = `${apiUrl}/mcp`;
    const workspaceId = this.plugin.settings.workspaceId;

    parent.createEl('h4', { text: 'Cloud agents', cls: 'cortex-agents-subhead' });
    parent.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Reach the same workspace from agents that don\'t run on this machine — Claude.ai web/mobile, ChatGPT desktop, ' +
        'or any agent on a cloud dev box. They authenticate against cortex.hangarx.ai/mcp using your API key.',
    });

    // Top-level URL + key card so users can grab credentials in one shot.
    const summary = parent.createDiv({ cls: 'cortex-cloud-agent-summary' });
    const summaryLeft = summary.createDiv({ cls: 'cortex-cloud-agent-summary-fields' });
    summaryLeft.createEl('div', { cls: 'cortex-cloud-agent-row', text: `URL: ${mcpUrl}` });
    summaryLeft.createEl('div', {
      cls: 'cortex-cloud-agent-row',
      text: `Auth: x-api-key: ${apiKey ? maskKey(apiKey) : '<not configured>'}`,
    });
    if (workspaceId) {
      summaryLeft.createEl('div', {
        cls: 'cortex-cloud-agent-row',
        text: `Workspace: x-workspace-id: ${workspaceId}`,
      });
    }
    const summaryActions = summary.createDiv({ cls: 'cortex-cloud-agent-summary-actions' });
    const copyAllBtn = summaryActions.createEl('button', { text: 'Copy URL + key', cls: 'mod-cta' });
    copyAllBtn.addEventListener('click', async () => {
      const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
      if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
      await navigator.clipboard.writeText(lines.join('\n'));
      copyAllBtn.setText('Copied');
      setTimeout(() => copyAllBtn.setText('Copy URL + key'), 1400);
    });

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
      main.createEl('span', { cls: 'cortex-agent-row-label', text: c.label });
      main.createEl('span', { cls: 'cortex-agent-row-desc', text: c.description });

      const actions = row.createDiv({ cls: 'cortex-agent-row-actions' });
      const setupBtn = actions.createEl('button', { text: c.openUrl ? 'Open & copy' : 'Copy creds' });
      setupBtn.addEventListener('click', async () => {
        const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
        if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
        await navigator.clipboard.writeText(lines.join('\n'));
        if (c.openUrl) window.open(c.openUrl, '_blank');
        setupBtn.setText('Copied');
        setTimeout(() => setupBtn.setText(c.openUrl ? 'Open & copy' : 'Copy creds'), 1400);
      });

      const moreBtn = actions.createEl('button', {
        text: '⋯',
        attr: { 'aria-label': 'More actions', title: 'More actions' },
      });
      moreBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        const menu = new Menu();
        menu.addItem(item => item.setTitle('Copy URL only').setIcon('clipboard').onClick(async () => {
          await navigator.clipboard.writeText(mcpUrl);
          new Notice('MCP URL copied.');
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
          new Notice('curl one-liner copied — paste in any terminal to verify connectivity.');
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
      chip.setText('active for chat');
      chip.setAttr('title', `${runtimeProvider}/${cfg.chatModel ?? '—'} is the current runtime override.`);
      // Insert right after the label so it sits beside the provider name,
      // not at the far right next to the masked-key status.
      const label = summary.querySelector<HTMLElement>('.cortex-provider-row-label');
      if (label) label.insertAdjacentElement('afterend', chip);
      else summary.appendChild(chip);
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
    summary.createEl('span', { cls: 'cortex-provider-row-label', text: p.label });
    const status = summary.createEl('span', { cls: 'cortex-provider-row-status' });
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
      });
    });

    setting.addExtraButton(b => b
      .setIcon('external-link')
      .setTooltip('Get a key')
      .onClick(() => window.open(p.href, '_blank')));

    setting.addButton(b => b
      .setButtonText('Test')
      .setTooltip('Verify the key by calling the provider through the local cortex-api.')
      .onClick(async () => {
        const key = s.llmKeys[p.id];
        if (!key) { new Notice(`Enter a ${p.label} key first.`); return; }
        b.setButtonText('Testing…');
        b.setDisabled(true);
        try {
          const ok = await this.testProviderKey(p.id, key);
          b.setButtonText(ok ? '✓ Valid' : '✗ Invalid');
          setTimeout(() => b.setButtonText('Test'), 2200);
        } catch (e) {
          b.setButtonText('✗ Error');
          new Notice(`Test failed: ${(e as Error).message}`);
          setTimeout(() => b.setButtonText('Test'), 2800);
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
      badgeEl.createEl('span', { text: 'No API key set yet — paste one above to connect.' });
      return;
    }

    badgeEl.createEl('span', { text: 'Checking API key…', cls: 'cortex-cloud-status-checking' });
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
          badgeEl.createEl('span', {
            text: '✓ API key works (server doesn\'t expose identity details)',
            cls: 'cortex-cloud-status-head',
          });
          if (!s.workspaceId) {
            badgeEl.addClass('is-warn');
            badgeEl.createEl('span', {
              cls: 'cortex-cloud-status-sub',
              text: '⚠ Workspace ID is empty — set it below to enable sync and ask.',
            });
          }
        } else {
          badgeEl.addClass('is-invalid');
          badgeEl.createEl('span', {
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
          WORKSPACE_NOT_ALLOWED: `This key isn\'t authorised for the workspace ID below. Pick a different workspace, or generate a new key without workspace scoping.`,
          FORBIDDEN: detail.message || 'Key is missing the required permissions.',
        };
        const headline = (detail.code && headlineByCode[detail.code]) || `Server rejected the key (${status}).`;
        badgeEl.createEl('span', {
          text: `✗ ${headline}`,
          cls: 'cortex-cloud-status-head',
        });
        if (detail.code || detail.message) {
          badgeEl.createEl('span', {
            text: `${detail.code ? `[${detail.code}] ` : ''}${detail.message ?? ''}`.trim(),
            cls: 'cortex-cloud-status-sub',
          });
        }
      } else if (status >= 500) {
        badgeEl.createEl('span', {
          text: `✗ Server error (${status}) — try again in a moment.`,
          cls: 'cortex-cloud-status-head',
        });
      } else {
        badgeEl.createEl('span', {
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
    badgeEl.createEl('span', { text: headParts.join(' '), cls: 'cortex-cloud-status-head' });

    const subParts: string[] = [];
    if (info.lastUsedAt) {
      const ago = relativeTimestamp(info.lastUsedAt);
      if (ago) subParts.push(`Last used ${ago}`);
    }
    if (typeof info.totalRequests === 'number') {
      subParts.push(`${info.totalRequests.toLocaleString()} requests`);
    }
    if (subParts.length > 0) {
      badgeEl.createEl('span', { text: subParts.join(' · '), cls: 'cortex-cloud-status-sub' });
    }

    if (!workspaceId) {
      badgeEl.addClass('is-warn');
      badgeEl.createEl('span', {
        cls: 'cortex-cloud-status-sub',
        text: '⚠ Workspace ID is empty — set it below to enable sync and ask.',
      });
    } else if (info.allowedWorkspaceIds && !info.allowedWorkspaceIds.includes(workspaceId)) {
      badgeEl.addClass('is-warn');
      badgeEl.createEl('span', {
        cls: 'cortex-cloud-status-sub',
        text: `⚠ This key isn't authorized for workspace ${workspaceId.slice(0, 16)}…`,
      });
    }
  }

  /**
   * Smoke-test a provider key via the local cortex-api's `/v1/system/test-provider`
   * endpoint. Falls back to a direct provider call when the endpoint isn't available.
   */
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
          setTimeout(() => reject(new Error('timeout after 5s')), 5000),
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
    case 'moonshot':   return 'moonshot';
    case 'openrouter': return 'openrouter';
    case 'ollama':     return null;
    default:           return null;
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
    case 'moonshot':   return 'moonshot';
    case 'openrouter': return 'openrouter';
    default:           return null;
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
    const body = JSON.parse(m[1]);
    return {
      code: body?.error?.code || body?.code,
      message: body?.error?.message || body?.message,
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
