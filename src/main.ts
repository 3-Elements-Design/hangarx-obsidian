import { Notice, Plugin, MarkdownView, Modal, App } from 'obsidian';
import { CortexClient } from './cortex-client';
import {
  CortexSettings, CortexSettingTab, DEFAULT_SETTINGS, defaultDeviceName,
} from './settings';
import { VaultSync } from './services/vault-sync';
import { ConversationStore } from './services/conversation-store';
import { RelatedView, RELATED_VIEW_TYPE } from './views/related-view';
import { ChatModal } from './views/chat-modal';
import { GraphStatsModal } from './views/graph-stats-modal';
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

    this.client = new CortexClient(this.settings);
    this.sync = new VaultSync(this.app, this.client, this.settings);
    this.conversations = new ConversationStore(this);
    this.mcp = new McpServer(this, this.client, this.settings);
    this.api = buildPublicApi(this.client);

    // Register the inline-suggestion CodeMirror extension.
    this.registerEditorExtension(
      inlineSuggestionsExtension(this.client, () => this.settings.inlineSuggestionsEnabled),
    );

    // Only the Related sidebar view is registered. Subgraph and Contradictions
    // were removed in the Apr 2026 simplification — too tangential to the
    // agent-memory pitch.
    this.registerView(RELATED_VIEW_TYPE, leaf => new RelatedView(leaf, this.client));

    // OAuth callback handler. The dashboard's consent page redirects users
    // to obsidian://hangarx-callback?code=…&state=… after they approve;
    // this fires the resolution of any in-flight startSignIn() Promise.
    this.registerObsidianProtocolHandler('hangarx-callback', (params) => {
      void completeSignIn(params);
    });

    // Three primary ribbon icons — sync, agents, ask.
    this.addRibbonIcon('refresh-cw', 'HangarX: Sync vault to memory layer', () => this.runFullSyncWithFeedback());
    this.addRibbonIcon('plug', 'HangarX: Connect agents (Claude, Cursor)', () => {
      (this.app as any).setting?.open?.();
      (this.app as any).setting?.openTabById?.(this.manifest.id);
    });
    this.addRibbonIcon('message-square', 'HangarX: Ask your vault', () => {
      new ChatModal(this.app, this.client, this.conversations, this.settings).open();
    });

    // Commands — six total. Numbered prefixes pin the agent-memory trio at
    // the top of Cmd-P → "HangarX" results.
    this.addCommand({
      id: 'cortex-1-sync',
      name: 'Sync vault to memory layer',
      callback: () => this.runFullSyncWithFeedback(),
    });

    this.addCommand({
      id: 'cortex-1b-resync-all',
      name: 'Force re-ingest entire vault (after server reset)',
      callback: () => this.runForceResyncWithFeedback(),
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
      name: 'Ask your vault',
      callback: () => new ChatModal(this.app, this.client, this.conversations, this.settings).open(),
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
      if (this.settings.showRelatedPane) {
        this.activateRelatedView();
      }
      if (this.settings.mcpEnabled && this.settings.apiKey && this.settings.workspaceId) {
        setTimeout(() => this.toggleMcpServer(true), 1500);
      }
    });
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(RELATED_VIEW_TYPE);
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
      });
      progress.notice.hide();
      const { synced, skipped, deleted, paused } = result;
      if (paused === 'cancelled') {
        new Notice(`⏹ Force-resync cancelled — ${synced} re-ingested so far.`, 5000);
        return;
      }
      new Notice(`✅ Force-resync done: ${synced} ingested, ${skipped} skipped, ${deleted} removed`, 8000);
    } catch (e) {
      progress.notice.hide();
      const msg = (e as Error).message || String(e);
      console.error('[Cortex] forceResync failed:', e);
      new Notice(`HangarX force-resync failed: ${truncate(msg, 200)}`, 8000);
    }
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

// MarkdownView import retained for future commands; suppress unused warning.
void MarkdownView;
