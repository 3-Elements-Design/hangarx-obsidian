import { Notice, Plugin, MarkdownView, Modal, App } from 'obsidian';
import { CortexClient } from './cortex-client';
import {
  CortexSettings, CortexSettingTab, CLOUD_API_URL, DEFAULT_SETTINGS, defaultDeviceName, generateEncryptionKey,
} from './settings';
import { VaultSync } from './services/vault-sync';
import { ConversationStore } from './services/conversation-store';
import { RelatedView, RELATED_VIEW_TYPE } from './views/related-view';
import { ChatView, CHAT_VIEW_TYPE } from './views/chat-view';
import { ChatModal } from './views/chat-modal';
import { GraphStatsModal } from './views/graph-stats-modal';
import { GraphPull } from './services/graph-pull';
import { GraphPullModal } from './views/graph-pull-modal';
import { SyncModal } from './views/sync-modal';
import { buildPublicApi, CortexPublicApi } from './api';
import { inlineSuggestionsExtension } from './services/inline-suggestions';
import { McpServer, generateToken } from './services/mcp-server';
import { completeSignIn, cancelSignIn } from './services/oauth-flow';

/**
 * A persistent Notice with a progress bar. Keeps the user-supplied headline,
 * appends a phase line ("Syncing 42 / 603…") and a <progress> bar, and exposes
 * an `update(p)` method the long-running task drives from its onProgress hook.
 */
function makeProgressNotice(headline: string, onCancel?: () => void): {
  notice: Notice;
  update: (p: { phase: 'sync' | 'delete'; done: number; total: number; currentPath?: string }) => void;
  setCancelling: () => void;
} {
  const notice = new Notice(headline, 0);
  const root = notice.noticeEl;
  root.addClass('cortex-progress-notice');
  const phaseEl = root.createEl('div', { cls: 'cortex-progress-phase', text: '' });
  const bar = root.createEl('progress', { cls: 'cortex-progress-bar' });
  bar.max = 100;
  bar.value = 0;

  // Cancel button — only added if the caller provides an onCancel handler.
  // Stops accepting new files; in-flight files complete naturally so the
  // graph stays consistent (no half-ingested data).
  let cancelBtn: HTMLButtonElement | null = null;
  if (onCancel) {
    cancelBtn = root.createEl('button', {
      cls: 'cortex-progress-cancel',
      text: 'Cancel',
    });
    cancelBtn.addEventListener('click', evt => {
      evt.preventDefault();
      evt.stopPropagation(); // don't dismiss the Notice
      if (cancelBtn) {
        cancelBtn.setText('Cancelling…');
        cancelBtn.setAttr('disabled', 'true');
      }
      onCancel();
    });
  }

  let lastTick = 0;
  return {
    notice,
    update: ({ phase, done, total, currentPath }) => {
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      bar.max = total || 1;
      bar.value = done;
      // Throttle text updates to ~10/sec — DOM thrash kills sync throughput on large vaults.
      const now = Date.now();
      if (now - lastTick < 100 && done < total) return;
      lastTick = now;
      const verb = phase === 'sync' ? 'Syncing' : 'Removing';
      const where = currentPath ? ` · ${currentPath.split('/').pop()}` : '';
      phaseEl.setText(`${verb} ${done} / ${total} (${pct}%)${where}`);
    },
    setCancelling: () => {
      if (cancelBtn) {
        cancelBtn.setText('Cancelling…');
        cancelBtn.setAttr('disabled', 'true');
      }
    },
  };
}

/** Simple prompt modal that returns a single text value. */
function promptForText(app: App, title: string, placeholder: string): Promise<string | null> {
  return new Promise(resolve => {
    const modal = new (class extends Modal {
      onOpen() {
        this.titleEl.setText(title);
        const input = this.contentEl.createEl('input', {
          cls: 'cortex-prompt-input',
          attr: { type: 'text', placeholder, style: 'width:100%;padding:8px;margin-bottom:8px;' },
        });
        const btn = this.contentEl.createEl('button', {
          text: 'OK',
          attr: { style: 'width:100%;' },
        });
        btn.addEventListener('click', () => { resolve(input.value.trim() || null); this.close(); });
        input.addEventListener('keydown', evt => {
          if (evt.key === 'Enter') { resolve(input.value.trim() || null); this.close(); }
          if (evt.key === 'Escape') { resolve(null); this.close(); }
        });
        setTimeout(() => input.focus(), 50);
      }
      onClose() { resolve(null); this.contentEl.empty(); }
    })(app);
    modal.open();
  });
}

export default class CortexPlugin extends Plugin {
  settings!: CortexSettings;
  client!: CortexClient;
  sync!: VaultSync;
  conversations!: ConversationStore;
  graphPull!: GraphPull;
  mcp!: McpServer;
  /** Public API surface for Templater / Dataview / other plugins. */
  api!: CortexPublicApi;

  async onload(): Promise<void> {
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
    // Auto-mint server-side encryption keys at boot (not lazily on render of
    // the local panel). These keys go into the docker-compose YAML — empty
    // values cause the cortex-api to throw `LLM_ENCRYPTION_KEY must be set
    // in production` when the runtime LLM config tries to encrypt a stored
    // API key. Generating here ensures the very first compose-save lands
    // valid keys regardless of which settings panel the user visits first.
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

    // Register the inline-suggestion CodeMirror extension.
    this.registerEditorExtension(
      inlineSuggestionsExtension(this.client, () => this.settings.inlineSuggestionsEnabled),
    );

    // Two right-pane views: Chat (always-on Q&A) and Related (per-note
    // semantic neighbors). User picks the default in settings; either can
    // be opened manually via command.
    this.registerView(RELATED_VIEW_TYPE, leaf => new RelatedView(leaf, this.client));
    this.registerView(CHAT_VIEW_TYPE, leaf =>
      new ChatView(leaf, this.client, this.conversations, this.settings),
    );

    // OAuth callback handler. The dashboard's consent page redirects users
    // to obsidian://hangarx-callback?code=…&state=… after they approve;
    // this fires the resolution of any in-flight startSignIn() Promise.
    this.registerObsidianProtocolHandler('hangarx-callback', (params) => {
      void completeSignIn(params);
    });

    // Two ribbon icons — sync and memory stats. Sync opens the unified Sync
    // modal (push, pull, or both); stats opens the read-only Memory Stats
    // dialog so users can verify the graph state at a glance. Chat lives
    // permanently in the right sidebar (no ribbon needed) and Connect agents
    // is a one-time setup task that belongs in settings.
    this.addRibbonIcon('refresh-cw', 'HangarX: Sync', () => {
      new SyncModal(this.app, this).open();
    });
    this.addRibbonIcon('bar-chart-3', 'HangarX: Memory stats', () => {
      new GraphStatsModal(this.app, this.client, this).open();
    });

    // Commands — six total. Numbered prefixes pin the agent-memory trio at
    // the top of Cmd-P → "HangarX" results.
    this.addCommand({
      id: 'cortex-1-sync',
      name: 'Sync (open modal)',
      callback: () => new SyncModal(this.app, this).open(),
    });

    this.addCommand({
      id: 'cortex-1-sync-quick',
      name: 'Push vault to memory layer (no modal)',
      callback: () => this.runFullSyncWithFeedback(),
    });

    this.addCommand({
      id: 'cortex-1b-resync-all',
      name: 'Force re-ingest entire vault (after server reset)',
      callback: () => this.runForceResyncWithFeedback(),
    });

    this.addCommand({
      id: 'cortex-1c-rebuild-graph',
      name: 'Rebuild communities + reindex (after fast re-ingest)',
      callback: () => this.runRebuildCommunitiesAndReindex(),
    });

    this.addCommand({
      id: 'cortex-2-connect-agents',
      name: 'Connect agents (Claude, Cursor)…',
      callback: () => {
        (this.app as any).setting?.open?.();
        (this.app as any).setting?.openTabById?.(this.manifest.id);
      },
    });

    this.addCommand({
      id: 'cortex-3-stats',
      name: 'Memory stats',
      callback: () => new GraphStatsModal(this.app, this.client, this).open(),
    });

    this.addCommand({
      id: 'cortex-ask',
      name: 'Ask your vault (side panel)',
      callback: () => void this.activateChatView(),
    });

    this.addCommand({
      id: 'cortex-ask-modal',
      name: 'Ask your vault (modal)',
      callback: () => new ChatModal(this.app, this.client, this.conversations, this.settings).open(),
    });

    this.addCommand({
      id: 'cortex-related-pane',
      name: 'Open Related notes pane',
      callback: () => void this.activateRelatedView(),
    });

    this.addCommand({
      id: 'cortex-graph-pull',
      name: 'Import Cortex graph from cloud',
      callback: () => this.runGraphPull(),
    });

    this.addCommand({
      id: 'cortex-graph-pull-preview',
      name: 'Preview Cortex graph import',
      callback: () => this.runGraphPullPreview(),
    });

    this.addCommand({
      id: 'cortex-graph-pull-summary',
      name: 'Cortex graph summary (fast)',
      callback: () => this.runGraphPullSummary(),
    });

    this.addCommand({
      id: 'cortex-ingest-url',
      name: 'Ingest URL into knowledge graph',
      callback: async () => {
        const url = await promptForText(this.app, 'Ingest URL', 'Paste a URL to scrape and add to your knowledge graph.');
        if (!url) return;
        const notice = new Notice('HangarX: Ingesting URL…', 0);
        try {
          const result = await this.client.ingestUrl(url);
          notice.hide();
          new Notice(`✅ Ingested! ${result.entityCount ? `${result.entityCount} entities extracted.` : 'Processing complete.'}`);
        } catch (e) {
          notice.hide();
          new Notice(`HangarX ingest failed: ${(e as Error).message}`);
        }
      },
    });

    this.addSettingTab(new CortexSettingTab(this.app, this));

    // Wait for the vault to finish initial scan before wiring file events.
    this.app.workspace.onLayoutReady(async () => {
      this.registerEvent(this.app.vault.on('create', f => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on('modify', f => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on('delete', f => this.sync.handleDelete(f)));
      this.registerEvent(this.app.vault.on('rename', (f, old) => this.sync.handleRename(f, old)));

      if (this.settings.syncOnStartup && this.settings.apiKey && this.settings.workspaceId) {
        // Defer so startup isn't blocked by sync.
        setTimeout(() => this.sync.fullSync().catch(e => console.warn('[Cortex] startup sync', e)), 3000);
      }
      const pane = this.settings.defaultRightPane
        ?? (this.settings.showRelatedPane ? 'related' : 'none');
      if (pane === 'chat') {
        void this.activateChatView();
      } else if (pane === 'related') {
        void this.activateRelatedView();
      }
      if (this.settings.mcpEnabled && this.settings.apiKey && this.settings.workspaceId) {
        setTimeout(() => this.toggleMcpServer(true), 1500);
      }
    });
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(RELATED_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
    cancelSignIn();
    await this.mcp?.stop().catch(() => {});
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
    // One-shot migration: existing installs persisted the old `.com` cloud
    // host before we cut over to `.ai`. Rewrite it on load so users don't
    // have to manually edit the field.
    if (this.settings.apiUrl === 'https://cortex.hangarx.com') {
      this.settings.apiUrl = 'https://cortex.hangarx.ai';
      await this.saveData(this.settings);
    }
    // One-shot migration: 'self-hosted' mode was retired. Anyone with it
    // saved gets bumped to 'local' (the closest fit — both involve the
    // user managing their own API URL). Their apiUrl + apiKey are kept.
    if ((this.settings.connectionMode as string) === 'self-hosted') {
      this.settings.connectionMode = 'local';
      await this.saveData(this.settings);
    }
    // One-shot migration: 'openai' embedding preset was removed because its
    // 1536-d output isn't compatible with the 768-d gemini/ollama models
    // already populated in users' graphs — switching providers without a
    // re-ingest leaves chunks unsearchable. Bump back to gemini.
    if ((this.settings.embeddingPreset as string) === 'openai') {
      this.settings.embeddingPreset = 'gemini';
      await this.saveData(this.settings);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    if (this.client) this.client = new CortexClient(this.settings);
  }

  /**
   * Toggle the local MCP server. Called from settings on enable/disable.
   */
  async toggleMcpServer(enabled: boolean): Promise<void> {
    if (enabled) {
      if (!this.settings.mcpToken) {
        this.settings.mcpToken = generateToken();
        await this.saveSettings();
      }
      try {
        await this.mcp.start();
      } catch (e) {
        new Notice(`HangarX MCP: failed to start (${(e as Error).message})`);
        this.settings.mcpEnabled = false;
        await this.saveSettings();
      }
    } else {
      await this.mcp.stop();
    }
  }

  private async activateRelatedView(): Promise<void> {
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

  /** Open the Graph Pull modal in pull mode. Public so settings buttons + commands share one entry point. */
  runGraphPull(): void {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, 'pull', {
      source: 'cloud',
      sourceLabel: new URL(CLOUD_API_URL).host,
    }).open();
  }

  /** Open the Graph Pull modal in dry-run mode. */
  runGraphPullPreview(): void {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, 'preview', {
      source: 'cloud',
      sourceLabel: new URL(CLOUD_API_URL).host,
    }).open();
  }

  /** Open the Graph Pull modal in cheap "summary" mode (one /graph/stats call). */
  runGraphPullSummary(): void {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, 'summary', {
      source: 'cloud',
      sourceLabel: new URL(CLOUD_API_URL).host,
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
  private buildCloudGraphPull(): GraphPull | null {
    if (!this.settings.apiKey) {
      new Notice('HangarX: Cloud API key is empty. Open Settings → Connection details and sign in or paste a key.');
      return null;
    }
    if (!this.settings.workspaceId) {
      new Notice('HangarX: Cloud workspace ID is empty. Open Settings → Connection details.');
      return null;
    }
    // Spawn an isolated client + GraphPull pointed at cloud, with overrides
    // that take precedence even if the user is currently in Local mode. The
    // plugin keeps the saved cloud apiKey/workspaceId across mode switches
    // (see renderLocalConnection — we no longer wipe them), so this works
    // without requiring the user to flip back to Cloud.
    const cloudSettings: CortexSettings = {
      ...this.settings,
      apiUrl: CLOUD_API_URL,
      connectionMode: 'cloud',
    };
    const cloudClient = new CortexClient(cloudSettings);
    return new GraphPull(this.app, cloudClient, cloudSettings);
  }

  private async activateChatView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  /**
   * Open the chat side panel (creating it if needed) and prefill the composer
   * with a starter query. Used by Memory Stats "drill in" rows so a user can
   * jump from "1,855 Notes" to a sensible exploratory question in one click.
   */
  async askInChat(text: string): Promise<void> {
    await this.activateChatView();
    // setViewState resolves before the panel finishes mounting; defer one tick
    // so panel.prefill can find the populated input element.
    setTimeout(() => {
      const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
      const view = leaves[0]?.view as ChatView | undefined;
      view?.prefill(text);
    }, 80);
  }

  /**
   * Wrap fullSync with pre-flight checks + visible error feedback.
   */
  private async runFullSyncWithFeedback(): Promise<void> {
    const s = this.settings;
    if (!s.apiKey) {
      new Notice('HangarX: API key is empty. Open Settings → Connection.');
      return;
    }
    if (!s.workspaceId) {
      new Notice('HangarX: Workspace ID is empty. Open Settings → Connection.');
      return;
    }
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new Notice('HangarX: vault has no markdown files to sync.');
      return;
    }
    const abort = new AbortController();
    const progress = makeProgressNotice(
      `HangarX: syncing ${fileCount} files…`,
      () => abort.abort(),
    );
    try {
      const result = await this.sync.fullSync({
        onProgress: progress.update,
        signal: abort.signal,
      });
      progress.notice.hide();
      const { synced, skipped, deleted, failed = 0, failedPaths = [], paused } = result;
      if (paused === 'cancelled') {
        new Notice(`⏹ HangarX sync cancelled — ${synced} synced, ${skipped} unchanged so far.`, 5000);
        return;
      }
      const headline = failed > 0
        ? `⚠️ HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed, ${failed} FAILED`
        : `✅ HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed`;
      new Notice(headline, failed > 0 ? 10000 : 4000);
      if (failed > 0) {
        const sample = failedPaths.slice(0, 3).join(', ');
        const more = failedPaths.length > 3 ? ` (+${failedPaths.length - 3} more)` : '';
        new Notice(`Failures: ${sample}${more}`, 10000);
      }

      // Server-state vs index-state divergence: surface when the local index
      // says everything is synced but the server graph is empty.
      if (synced === 0 && skipped > 0) {
        try {
          const stats = await this.client.getGraphStats();
          if (stats.totalEntities === 0) {
            new Notice(
              `⚠️ Index says ${skipped} files are already synced, but the server graph is empty. ` +
              'Run "Force re-ingest entire vault" from the command palette to re-push everything.',
              12000,
            );
          }
        } catch {
          /* stats fetch failed — don't compound */
        }
      } else if (synced === 0 && skipped > 0 && deleted === 0) {
        new Notice('Everything was already up to date.');
      }
    } catch (e) {
      progress.notice.hide();
      const msg = (e as Error).message || String(e);
      console.error('[Cortex] fullSync failed:', e);
      new Notice(`HangarX sync failed: ${truncate(msg, 200)}`, 8000);
    }
  }

  /**
   * Force-resync: clear the per-file index then run a full sync.
   */
  private async runForceResyncWithFeedback(): Promise<void> {
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new Notice('HangarX: vault has no markdown files to sync.');
      return;
    }
    const confirmed = confirm(
      `Force-resync ${fileCount} files into the memory layer?\n\n` +
      `This wipes the local sync index and re-pushes every file. Use this after the server-side graph has been reset (e.g. Docker volume wiped). It's safe — your notes themselves aren't touched.`,
    );
    if (!confirmed) return;
    const abort = new AbortController();
    const progress = makeProgressNotice(
      `HangarX: clearing index + re-pushing ${fileCount} files…`,
      () => abort.abort(),
    );
    try {
      await this.sync.clearIndex();
      const result = await this.sync.fullSync({
        onProgress: progress.update,
        signal: abort.signal,
        fastMode: true,
      });
      progress.notice.hide();
      const { synced, skipped, deleted, paused } = result;
      if (paused === 'cancelled') {
        new Notice(`⏹ Force-resync cancelled — ${synced} re-ingested so far.`, 5000);
        return;
      }
      // Fast mode skipped post-ingest VDB indexing and community detection.
      // Surface the cleanup as a single tappable Notice so the user doesn't
      // forget — without it, vector search and community-aware retrieval
      // stay thinner than usual until the next normal sync runs.
      const noticeText =
        `✅ Force-resync done: ${synced} ingested, ${skipped} skipped, ${deleted} removed.\n` +
        `Click here to rebuild communities + reindex (recommended).`;
      const finishNotice = new Notice(noticeText, 12000);
      finishNotice.noticeEl.addClass('cortex-clickable-notice');
      finishNotice.noticeEl.style.cursor = 'pointer';
      finishNotice.noticeEl.addEventListener('click', () => {
        finishNotice.hide();
        void this.runRebuildCommunitiesAndReindex();
      });
    } catch (e) {
      progress.notice.hide();
      const msg = (e as Error).message || String(e);
      console.error('[Cortex] forceResync failed:', e);
      new Notice(`HangarX force-resync failed: ${truncate(msg, 200)}`, 8000);
    }
  }

  /**
   * Restore the post-ingest steps fastMode skipped: detect graph communities
   * and backfill embeddings for any structured entities without them. Runs
   * the two endpoints sequentially because community detection depends on
   * having entity embeddings; surfaces failures individually so a partial
   * success still tells the user what worked.
   */
  private async runRebuildCommunitiesAndReindex(): Promise<void> {
    const progress = new Notice('HangarX: rebuilding communities + reindexing…', 0);
    let reindexOk = false;
    let detectOk = false;
    let detectStats: { communitiesCreated: number; levels: number } | null = null;
    try {
      await this.client.backfillEntityEmbeddings();
      reindexOk = true;
    } catch (e) {
      console.warn('[Cortex] backfillEntityEmbeddings failed:', e);
    }
    try {
      detectStats = await this.client.detectCommunities();
      detectOk = true;
    } catch (e) {
      console.warn('[Cortex] detectCommunities failed:', e);
    }
    progress.hide();
    if (reindexOk && detectOk && detectStats) {
      new Notice(
        `✅ Reindex done. ${detectStats.communitiesCreated} communities across ${detectStats.levels} levels.`,
        8000,
      );
    } else if (reindexOk || detectOk) {
      const parts: string[] = [];
      parts.push(reindexOk ? '✓ Embeddings backfilled' : '✗ Backfill failed');
      parts.push(detectOk ? '✓ Communities detected' : '✗ Community detection failed');
      new Notice(`HangarX rebuild partial: ${parts.join(' · ')} (see console)`, 10000);
    } else {
      new Notice('HangarX rebuild failed — see console for details.', 8000);
    }
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

// MarkdownView import retained for future commands; suppress unused warning.
void MarkdownView;
