import { App, Modal, Notice, TFile, setIcon } from 'obsidian';
import type CortexPlugin from '../main';

const PAGE_SIZE = 500;
const MAX_NAMES_TO_SHOW = 50;

/**
 * Vault ↔ Graph diff modal.
 *
 * Fetches every Note entity from the cortex graph (paginated via
 * exportGraphPage), walks the local vault, and renders four buckets:
 *
 *   1. Vault only        — local file not synced to the graph
 *   2. Graph only        — graph entity has no local file
 *   3. Drifted (both)    — file mtime newer than last sync
 *   4. In sync (both)    — file mtime ≤ last sync
 *
 * Each bucket exposes a primary action where it makes sense:
 *   vaultOnly  → Sync these (force-pushes each file individually, in series)
 *   drifted    → Sync these (same)
 *   graphOnly  → Hide / inspect (no destructive action exposed yet —
 *                deletion-from-graph would need a server-side bulk endpoint)
 *
 * The action buttons honour cancellation via the existing AbortController
 * pattern used elsewhere in the plugin.
 */
export class DiffModal extends Modal {
  private bodyEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private cancelToken: { aborted: boolean } = { aborted: false };

  constructor(app: App, private plugin: CortexPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.modalEl.addClass('cortex-diff-modal');
    this.titleEl.setText('Vault ↔ graph diff');

    this.bodyEl = this.contentEl.createDiv({ cls: 'cortex-diff-body' });
    this.statusEl = this.bodyEl.createDiv({ cls: 'cortex-diff-status' });
    this.statusEl.setText('Loading…');

    try {
      const startTime = Date.now();
      const graphNames = await this.fetchAllGraphNoteNames(progress => {
        if (this.cancelToken.aborted) return;
        this.statusEl.setText(`Fetching graph notes… ${progress} so far`);
      });
      if (this.cancelToken.aborted) return;

      this.statusEl.setText('Computing diff…');
      const diff = await this.plugin.sync.computeVaultGraphDiff(graphNames);
      if (this.cancelToken.aborted) return;

      const elapsedMs = Date.now() - startTime;
      this.renderDiff(diff, graphNames.size, elapsedMs);
    } catch (e) {
      this.statusEl.empty();
      const err = this.statusEl.createDiv({ cls: 'cortex-diff-error' });
      const ic = err.createSpan({ cls: 'cortex-diff-error-icon' });
      setIcon(ic, 'alert-circle');
      err.createSpan({ text: `Couldn't load diff: ${(e as Error).message}` });
    }
  }

  onClose(): void {
    this.cancelToken.aborted = true;
    this.contentEl.empty();
  }

  /**
   * Paginate through `/v1/graph/entities?type=Note` until exhausted. Each
   * Note entity has a `name` (basename) we use as the diff match key.
   */
  private async fetchAllGraphNoteNames(onProgress: (count: number) => void): Promise<Set<string>> {
    const names = new Set<string>();
    let offset = 0;
    while (!this.cancelToken.aborted) {
      const page = await this.plugin.client.exportGraphPage({
        entityTypes: ['Note'],
        limit: PAGE_SIZE,
        offset,
        includeRelationships: false,
      });
      for (const e of page.entities) {
        if (e.name && typeof e.name === 'string') names.add(e.name);
      }
      onProgress(names.size);
      if (page.entities.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    return names;
  }

  private renderDiff(
    diff: { vaultOnly: TFile[]; graphOnly: string[]; drifted: TFile[]; inSync: TFile[] },
    graphTotal: number,
    elapsedMs: number,
  ): void {
    this.bodyEl.empty();

    // Headline numbers — at-a-glance health.
    const summary = this.bodyEl.createDiv({ cls: 'cortex-diff-summary' });
    this.summaryTile(summary, diff.vaultOnly.length.toLocaleString(), 'Vault only', 'Need to push');
    this.summaryTile(summary, diff.drifted.length.toLocaleString(), 'Drifted', 'Local newer than graph');
    this.summaryTile(summary, diff.graphOnly.length.toLocaleString(), 'Graph only', 'Likely deleted locally');
    this.summaryTile(summary, diff.inSync.length.toLocaleString(), 'In sync', 'Healthy');

    const meta = this.bodyEl.createDiv({ cls: 'cortex-diff-meta' });
    meta.setText(
      `Vault: ${(diff.vaultOnly.length + diff.drifted.length + diff.inSync.length).toLocaleString()} notes  ·  ` +
      `Graph: ${graphTotal.toLocaleString()} notes  ·  ${elapsedMs}ms`,
    );

    // ── Bucket sections ───────────────────────────────────────────────
    if (diff.vaultOnly.length > 0) {
      this.renderBucket({
        title: `Vault only — needs sync (${diff.vaultOnly.length})`,
        description: 'Files exist locally but no matching Note entity in the graph. These haven\'t been synced yet.',
        names: diff.vaultOnly.map(f => f.basename),
        files: diff.vaultOnly,
        actionLabel: 'Sync these',
        actionIcon: 'arrow-up',
        action: () => this.bulkSync(diff.vaultOnly),
        kind: 'warning',
      });
    }

    if (diff.drifted.length > 0) {
      this.renderBucket({
        title: `Drifted — local newer than graph (${diff.drifted.length})`,
        description: 'Local file mtime is newer than the last-synced timestamp. The graph likely has stale content.',
        names: diff.drifted.map(f => f.basename),
        files: diff.drifted,
        actionLabel: 'Re-sync these',
        actionIcon: 'refresh-cw',
        action: () => this.bulkSync(diff.drifted),
        kind: 'warning',
      });
    }

    if (diff.graphOnly.length > 0) {
      this.renderBucket({
        title: `Graph only — orphaned in graph (${diff.graphOnly.length})`,
        description: 'Note entities in the graph with no matching vault file. Usually means the file was deleted locally and the deletion didn\'t propagate, or the graph was pulled from a different vault.',
        names: diff.graphOnly,
        files: null,
        actionLabel: null,
        actionIcon: null,
        action: null,
        kind: 'info',
      });
    }

    if (diff.inSync.length > 0) {
      this.renderBucket({
        title: `In sync (${diff.inSync.length})`,
        description: 'Local file matches the graph version. No action needed.',
        names: diff.inSync.map(f => f.basename),
        files: diff.inSync,
        actionLabel: null,
        actionIcon: null,
        action: null,
        kind: 'ok',
        collapsedByDefault: true,
      });
    }

    // Footer — refresh + close.
    const footer = this.bodyEl.createDiv({ cls: 'cortex-diff-footer' });
    const refreshBtn = footer.createEl('button', { text: 'Refresh' });
    refreshBtn.addEventListener('click', () => { void (async () => {
      this.cancelToken = { aborted: false };
      this.bodyEl.empty();
      this.statusEl = this.bodyEl.createDiv({ cls: 'cortex-diff-status', text: 'Loading…' });
      await this.onOpen();
    })(); });
    const closeBtn = footer.createEl('button', { text: 'Close', cls: 'mod-cta' });
    closeBtn.addEventListener('click', () => this.close());
  }

  private summaryTile(parent: HTMLElement, value: string, label: string, sub: string): void {
    const tile = parent.createDiv({ cls: 'cortex-diff-tile' });
    tile.createDiv({ cls: 'cortex-diff-tile-value', text: value });
    tile.createDiv({ cls: 'cortex-diff-tile-label', text: label });
    tile.createDiv({ cls: 'cortex-diff-tile-sub', text: sub });
  }

  private renderBucket(opts: {
    title: string;
    description: string;
    names: string[];
    files: TFile[] | null;
    actionLabel: string | null;
    actionIcon: string | null;
    action: (() => Promise<void>) | null;
    kind: 'ok' | 'warning' | 'info';
    collapsedByDefault?: boolean;
  }): void {
    const wrap = this.bodyEl.createEl('details', { cls: `cortex-diff-bucket cortex-diff-bucket-${opts.kind}` });
    if (!opts.collapsedByDefault) wrap.setAttr('open', '');
    const summary = wrap.createEl('summary', { cls: 'cortex-diff-bucket-summary' });
    summary.createSpan({ cls: 'cortex-diff-bucket-title', text: opts.title });

    const body = wrap.createDiv({ cls: 'cortex-diff-bucket-body' });
    body.createEl('p', { cls: 'cortex-diff-bucket-desc', text: opts.description });

    if (opts.action && opts.actionLabel) {
      const actionRow = body.createDiv({ cls: 'cortex-diff-bucket-actions' });
      const btn = actionRow.createEl('button', { cls: 'mod-cta cortex-diff-bucket-action' });
      if (opts.actionIcon) {
        const ic = btn.createSpan({ cls: 'cortex-diff-bucket-action-icon' });
        setIcon(ic, opts.actionIcon);
      }
      btn.createSpan({ text: opts.actionLabel });
      btn.addEventListener('click', () => void opts.action!());
    }

    const list = body.createDiv({ cls: 'cortex-diff-bucket-list' });
    const visible = opts.names.slice(0, MAX_NAMES_TO_SHOW);
    for (const name of visible) {
      const row = list.createDiv({ cls: 'cortex-diff-bucket-row' });
      // Render as a clickable link when we have the TFile (vaultOnly / drifted / inSync).
      const link = row.createEl('a', { text: name, attr: { href: '#' } });
      if (opts.files) {
        const file = opts.files.find(f => f.basename === name);
        if (file) {
          link.addEventListener('click', evt => {
            evt.preventDefault();
            void this.app.workspace.getLeaf(false).openFile(file);
            this.close();
          });
        }
      } else {
        // graphOnly — no local file to open. Try resolving by name.
        const target = this.app.metadataCache.getFirstLinkpathDest(name, '');
        if (target) {
          link.addEventListener('click', evt => {
            evt.preventDefault();
            void this.app.workspace.getLeaf(false).openFile(target);
            this.close();
          });
        } else {
          link.removeAttribute('href');
          link.addClass('cortex-diff-row-unlinked');
        }
      }
    }
    if (opts.names.length > MAX_NAMES_TO_SHOW) {
      list.createDiv({
        cls: 'cortex-diff-bucket-more',
        text: `+${opts.names.length - MAX_NAMES_TO_SHOW} more not shown.`,
      });
    }
  }

  /**
   * Push each file in series, throttled so we don't spike the LLM provider.
   * Surfaces progress in the status row and a final Notice.
   */
  private async bulkSync(files: TFile[]): Promise<void> {
    if (files.length === 0) return;
    const total = files.length;
    let done = 0;
    let failed = 0;

    // Re-purpose the status row at the top of the body for progress.
    const oldText = this.statusEl.textContent;
    const update = (): void => {
      this.statusEl.setText(`Syncing ${done}/${total}${failed > 0 ? ` · ${failed} failed` : ''}…`);
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

    new Notice(`Diff sync complete — ${done - failed} pushed, ${failed} failed.`, 4000);
    this.statusEl.setText(oldText ?? '');
    // Re-render with fresh state.
    this.bodyEl.empty();
    this.statusEl = this.bodyEl.createDiv({ cls: 'cortex-diff-status', text: 'Refreshing…' });
    await this.onOpen();
  }
}
