import { App, Modal, Notice, setIcon } from 'obsidian';
import type CortexPlugin from '../main';
import { formatError, errorIcon } from '../services/error-format';
import { confirmModal } from '../services/confirm-modal';

type Action = 'push' | 'pull' | 'both' | 'force-reingest';

/**
 * Unified Sync entry point. Replaces the old fire-and-forget Notice toast
 * triggered by the ribbon icon. Three actions:
 *
 *   - Push:  send vault changes to the knowledge graph
 *   - Pull:  materialize knowledge graph entities + relationships into vault markdown
 *   - Both:  push first, then pull (order doesn't matter to data quality —
 *            arbitrary; push picked first because it's the more common path)
 *
 * Always opens to the picker. The "Sync on startup" preference is NOT
 * mutated here — that's a long-lived setting, not a per-action toggle.
 * Picker shows a read-only line linking to settings.
 */
export class SyncModal extends Modal {
  constructor(app: App, private plugin: CortexPlugin) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass('cortex-sync-modal');
    this.titleEl.setText('Hangarx sync');
    void this.renderPicker();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  // ────────────────────────────────────────────────────────────────────
  // Picker
  // ────────────────────────────────────────────────────────────────────

  // No `await` inside; uses fire-and-forget Promise chains instead.
  // Dropping `async` satisfies @typescript-eslint/require-await.
  private renderPicker(): void {
    const c = this.contentEl;
    c.empty();
    c.addClass('cortex-sync-body');
    this.titleEl.setText('Hangarx sync');

    // ── Connection badge ────────────────────────────────────────────
    const s = this.plugin.settings;
    let host = s.apiUrl;
    try { host = new URL(s.apiUrl).host; } catch { /* malformed apiUrl — fall back to the raw setting */ }
    const badge = c.createDiv({ cls: 'cortex-sync-badge' });
    const dot = badge.createSpan({ cls: 'cortex-sync-badge-dot' });
    dot.addClass(s.connectionMode === 'cloud' ? 'is-cloud' : 'is-local');
    badge.createSpan({
      cls: 'cortex-sync-badge-text',
      text: `${s.connectionMode === 'cloud' ? 'Cloud' : 'Local'} · ${host}`,
    });

    // ── Stat tiles (vault + graph) — render with placeholders, fill async
    const stats = c.createDiv({ cls: 'cortex-sync-stats' });
    const vaultTile = this.statTile(stats, 'file-text', '—', 'Notes in vault');
    const graphTile = this.statTile(stats, 'network', '—', 'Entities in knowledge graph');
    const changesTile = this.statTile(stats, 'history', '—', 'Changed since last sync');

    // ── Mismatch banner — populated by fillStats once it knows the counts.
    //   Empty by default; we slot it in here so its position above the action
    //   cards is stable when (or if) it appears.
    const banner = c.createDiv({ cls: 'cortex-sync-banner is-hidden' });

    // ── Action cards ────────────────────────────────────────────────
    const actions = c.createDiv({ cls: 'cortex-sync-actions' });
    this.actionCard(actions, {
      icon: 'arrow-up',
      title: 'Push vault to knowledge graph',
      description: 'Send your changed notes to the knowledge graph. Skips files that haven\'t changed since last sync.',
      onClick: () => void this.runAction('push'),
    });
    this.actionCard(actions, {
      icon: 'arrow-down',
      title: 'Import knowledge graph into vault',
      description: 'Materialize knowledge graph entities + relationships as markdown so they appear in Obsidian\'s graph view.',
      onClick: () => void this.runAction('pull'),
    });
    this.actionCard(actions, {
      icon: 'refresh-cw',
      title: 'Two-way sync',
      description: 'Push first, then import. Keeps both sides aligned.',
      onClick: () => void this.runAction('both'),
    });
    this.actionCard(actions, {
      icon: 'git-compare',
      title: 'Diff vault ↔ knowledge graph',
      description: 'See what\'s out of sync — local notes missing from the knowledge graph, knowledge graph entities orphaned, files newer than their last sync.',
      onClick: () => {
        this.close();
        // Lazy import keeps the modal-loading cost off the picker render.
        void import('./diff-modal').then(m => new m.DiffModal(this.app, this.plugin).open());
      },
    });
    const forceCard = this.actionCard(actions, {
      icon: 'rotate-cw',
      title: 'Force re-ingest entire vault',
      description: 'Wipes the local sync index and re-pushes every note. Use after the server knowledge graph has been reset (e.g. Docker volume wiped).',
      onClick: () => void this.runAction('force-reingest'),
    });
    forceCard.addClass('cortex-sync-action-danger');

    // ── Auto-sync footer (read-only, link to settings) ─────────────
    const footer = c.createDiv({ cls: 'cortex-sync-footer' });
    footer.createSpan({
      text: `Auto-sync on startup: ${s.syncOnStartup ? 'On' : 'Off'} · `,
    });
    const link = footer.createEl('a', {
      text: 'Change in settings',
      attr: { href: '#' },
    });
    link.addEventListener('click', evt => {
      evt.preventDefault();
      this.close();
      const settingApi = (this.app as unknown as { setting?: { open?: () => void; openTabById?: (id: string) => void } }).setting;
      settingApi?.open?.();
      settingApi?.openTabById?.(this.plugin.manifest.id);
    });

    // ── Async stats fill ────────────────────────────────────────────
    this.fillStats(vaultTile, graphTile, changesTile, banner);
  }

  // Uses `.then().catch()` chains for fire-and-forget; no `await` is
  // necessary, so we drop `async` and the Promise return type to
  // satisfy @typescript-eslint/require-await.
  private fillStats(
    vaultTile: HTMLElement,
    graphTile: HTMLElement,
    changesTile: HTMLElement,
    banner: HTMLElement,
  ): void {
    const fileCount = this.app.vault.getMarkdownFiles().length;
    this.setStatValue(vaultTile, fileCount.toLocaleString());

    let lastSyncedAt: number | null = null;
    void this.plugin.sync.getChangesSinceLastSync().then(c => {
      lastSyncedAt = c.lastSyncedAt;
      const parts: string[] = [];
      if (c.added > 0) parts.push(`+${c.added}`);
      if (c.changed > 0) parts.push(`~${c.changed}`);
      if (c.deleted > 0) parts.push(`-${c.deleted}`);
      const headline = parts.length > 0 ? parts.join(' ') : '0';
      this.setStatValue(changesTile, headline);

      const sub = changesTile.querySelector('.cortex-sync-stat-sub');
      if (sub && c.lastSyncedAt) {
        sub.textContent = `Last sync ${relativeTime(c.lastSyncedAt)}`;
      }
      this.maybeShowMismatchBanner(banner, fileCount, lastSyncedAt);
    }).catch(() => {
      this.setStatValue(changesTile, '—');
    });

    // Graph entity count via getGraphStats. Failure is fine (we just leave the dash).
    void this.plugin.client.getGraphStats().then(g => {
      this.setStatValue(graphTile, g.totalEntities.toLocaleString());
      this.graphEntityCount = g.totalEntities;
      this.maybeShowMismatchBanner(banner, fileCount, lastSyncedAt);
    }).catch(() => {
      this.setStatValue(graphTile, '—');
    });
  }

  /** Cached so both stats fills can independently trigger banner re-eval. */
  private graphEntityCount: number | null = null;

  /**
   * Stale-index detection: a populated vault that's been "synced before" but
   * shows zero entities on the server is the classic "Docker volume got
   * wiped, plugin still thinks files are pushed" mismatch. The fix is to
   * clear the local hash index and re-ingest — surface the option here so
   * the user doesn't have to dig into Cmd-P to find it.
   */
  private maybeShowMismatchBanner(
    banner: HTMLElement,
    fileCount: number,
    lastSyncedAt: number | null,
  ): void {
    if (this.graphEntityCount === null) return;
    const hasStaleIndex = lastSyncedAt !== null && this.graphEntityCount === 0 && fileCount >= 50;
    if (!hasStaleIndex) {
      banner.addClass('is-hidden');
      return;
    }
    banner.removeClass('is-hidden');
    banner.empty();
    const ic = banner.createSpan({ cls: 'cortex-sync-banner-icon' });
    setIcon(ic, 'alert-triangle');
    const text = banner.createSpan();
    text.createEl('strong', { text: 'Graph is empty but your vault has notes. ' });
    text.createSpan({
      text: `Last sync ${lastSyncedAt ? relativeTime(lastSyncedAt) : 'a while ago'}. ` +
        `The server graph may have been reset (e.g. Docker volume wiped) — pushing won't repair it because the plugin thinks files are already synced. Use `,
    });
    text.createEl('strong', { text: 'Force re-ingest' });
    text.createSpan({ text: ' below to wipe the local index and re-push every note.' });
  }

  // ────────────────────────────────────────────────────────────────────
  // Action dispatch
  // ────────────────────────────────────────────────────────────────────

  private async runAction(action: Action): Promise<void> {
    if (!this.preflight()) return;

    if (action === 'pull') {
      // The pull modal is feature-rich (preview mode, error retry, etc.) —
      // hand off rather than reimplement.
      this.close();
      this.plugin.runGraphPull();
      return;
    }

    if (action === 'push') {
      await this.runPush();
      return;
    }

    if (action === 'force-reingest') {
      const fileCount = this.app.vault.getMarkdownFiles().length;
      const ok = await confirmModal(this.app, {
        title: `Force-resync ${fileCount} files?`,
        body:
          `This wipes the local sync index and re-pushes every note into the knowledge graph.\n\n` +
          `Use after the server graph has been reset (Docker volume wiped, container rebuilt). Your notes themselves aren't touched.`,
        confirmText: 'Force resync',
        destructive: true,
      });
      if (!ok) return;
      await this.runPush({ forceReingest: true });
      return;
    }

    // Both: push first, then pull. Order doesn't affect correctness.
    await this.runPush({ thenPull: true });
  }

  /** Render the in-modal progress UI for a push, then optionally chain a pull.
   *  When forceReingest is set, the local sync index is cleared first so every
   *  file is treated as new and re-pushed. */
  private async runPush(opts: { thenPull?: boolean; forceReingest?: boolean } = {}): Promise<void> {
    const c = this.contentEl;
    c.empty();
    this.titleEl.setText(
      opts.forceReingest ? 'HangarX Force Re-ingest' :
      opts.thenPull ? 'HangarX Two-way Sync' :
      'HangarX Push',
    );

    let inFlight = true;
    this.renderBackBar(c, () => inFlight);

    const phaseRow = c.createDiv({ cls: 'cortex-pull-phase-row' });
    const phaseIcon = phaseRow.createSpan({ cls: 'cortex-pull-phase-icon' });
    setIcon(phaseIcon, opts.forceReingest ? 'rotate-cw' : 'arrow-up');
    const phaseEl = phaseRow.createSpan({
      cls: 'cortex-pull-phase-label',
      text: opts.forceReingest ? 'Clearing local index…' : 'Pushing vault…',
    });

    const messageEl = c.createDiv({ cls: 'cortex-pull-message' });
    const barWrap = c.createDiv({ cls: 'cortex-pull-bar-wrap' });
    const barFill = barWrap.createDiv({ cls: 'cortex-pull-bar-fill' });
    const statsEl = c.createDiv({ cls: 'cortex-pull-stats' });
    const btnRow = c.createDiv({ cls: 'cortex-pull-btn-row' });
    const cancelBtn = btnRow.createEl('button', { cls: 'cortex-pull-cancel', text: 'Cancel' });

    const abort = new AbortController();
    let lastInFlight = 0;
    let cancelling = false;
    cancelBtn.addEventListener('click', () => {
      abort.abort();
      cancelling = true;
      // The fullSync call hooks the abort signal and POSTs cancel to the
      // server, which trips the in-flight workers' next checkpoint. UI
      // reflects that we're waiting for them to drain (could be ~30s on
      // a chunk currently mid-LLM-call).
      cancelBtn.setText('Cancelling…');
      cancelBtn.setAttr('disabled', 'true');
      phaseEl.setText('Cancelling…');
      messageEl.setText(
        `${lastInFlight} ${lastInFlight === 1 ? 'file' : 'files'} in flight on the server — waiting to drain (up to ~30s)…`,
      );
    });

    let pushResult: { synced: number; deleted: number; skipped: number } | null = null;
    try {
      if (opts.forceReingest) {
        await this.plugin.sync.clearIndex();
        phaseEl.setText('Re-pushing every note…');
      }
      pushResult = await this.plugin.sync.fullSync({
        signal: abort.signal,
        onProgress: ({ phase, done, total, currentPath }) => {
          // Track in-flight count for the cancel-state UI. Concurrency is 6,
          // so up to that many are simultaneously "done minus a moment ago" —
          // exact number isn't surfaced by fullSync, so we approximate.
          lastInFlight = Math.min(6, total - done);
          if (cancelling) return; // freeze the progress UI while draining
          if (total > 0) {
            const pct = Math.min(100, Math.round((done / total) * 100));
            barFill.setCssStyles({ width: `${pct}%` });
          }
          const verb = phase === 'sync' ? 'Syncing' : 'Removing';
          const where = currentPath ? ` · ${currentPath.split('/').pop()}` : '';
          phaseEl.setText(`${verb} ${done} / ${total}`);
          messageEl.setText(where ? where.slice(3) : '');
        },
      });
      barFill.addClass('cortex-pull-bar-done');
      barFill.setCssStyles({ width: '100%' });
      phaseEl.setText('Push complete');
      messageEl.empty();
      inFlight = false;
    } catch (e) {
      inFlight = false;
      this.renderError(c, statsEl, btnRow, cancelBtn, e, () => void this.runPush(opts));
      return;
    }

    if (opts.thenPull) {
      // Chain: clear the modal and hand off to the pull modal. The receipt
      // line summarising the push happens inside the GraphPullModal title
      // bar via sourceLabel; success Notice covers the final summary.
      new Notice(
        `Push complete — ${pushResult.synced} synced, ${pushResult.deleted} removed, ${pushResult.skipped} skipped. Starting import…`,
        4000,
      );
      this.close();
      this.plugin.runGraphPull();
      return;
    }

    // Push-only receipt
    statsEl.empty();
    const grid = statsEl.createDiv({ cls: 'cortex-pull-stat-grid' });
    this.receiptItem(grid, 'plus-circle', `${pushResult.synced} synced`, 'cortex-pull-stat-create');
    this.receiptItem(grid, 'trash-2', `${pushResult.deleted} removed`, 'cortex-pull-stat-delete');
    this.receiptItem(grid, 'minus-circle', `${pushResult.skipped} skipped (unchanged)`, 'cortex-pull-stat-total');

    // Fresh button row — the original cancelBtn still has the abort listener
    // attached, so re-skinning it as "Done" leaves stale handlers. Easier to
    // wipe and rebuild than chase listeners.
    btnRow.empty();
    const doneBtn = btnRow.createEl('button', {
      text: 'Done',
      cls: 'mod-cta',
      attr: { type: 'button' },
    });
    doneBtn.addEventListener('click', () => this.close());
    const again = btnRow.createEl('button', {
      text: 'Run another',
      attr: { type: 'button' },
    });
    again.addEventListener('click', () => void this.renderPicker());
  }

  // ────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────

  private preflight(): boolean {
    const s = this.plugin.settings;
    if (!s.apiKey && s.connectionMode === 'cloud') {
      new Notice('HangarX: API key is empty. Open settings → connection.');
      return false;
    }
    if (!s.workspaceId) {
      new Notice('HangarX: Workspace ID is empty. Open settings → connection.');
      return false;
    }
    return true;
  }

  private statTile(parent: HTMLElement, icon: string, value: string, label: string): HTMLElement {
    const tile = parent.createDiv({ cls: 'cortex-sync-stat' });
    const ic = tile.createSpan({ cls: 'cortex-sync-stat-icon' });
    setIcon(ic, icon);
    const body = tile.createDiv({ cls: 'cortex-sync-stat-body' });
    body.createDiv({ cls: 'cortex-sync-stat-value', text: value });
    body.createDiv({ cls: 'cortex-sync-stat-label', text: label });
    body.createDiv({ cls: 'cortex-sync-stat-sub', text: '' });
    return tile;
  }

  private setStatValue(tile: HTMLElement, value: string): void {
    const valueEl = tile.querySelector('.cortex-sync-stat-value');
    if (valueEl) valueEl.textContent = value;
  }

  private actionCard(
    parent: HTMLElement,
    opts: { icon: string; title: string; description: string; onClick: () => void },
  ): HTMLElement {
    const card = parent.createDiv({ cls: 'cortex-sync-action', attr: { role: 'button', tabindex: '0' } });
    const icWrap = card.createSpan({ cls: 'cortex-sync-action-icon' });
    setIcon(icWrap, opts.icon);
    const body = card.createDiv({ cls: 'cortex-sync-action-body' });
    body.createDiv({ cls: 'cortex-sync-action-title', text: opts.title });
    body.createDiv({ cls: 'cortex-sync-action-desc', text: opts.description });
    const chevron = card.createSpan({ cls: 'cortex-sync-action-chevron' });
    setIcon(chevron, 'chevron-right');
    card.addEventListener('click', opts.onClick);
    card.addEventListener('keydown', evt => {
      if (evt.key === 'Enter' || evt.key === ' ') {
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
  private renderBackBar(parent: HTMLElement, isInFlight: () => boolean): void {
    const bar = parent.createDiv({ cls: 'cortex-sync-backbar' });
    const btn = bar.createEl('button', {
      cls: 'cortex-sync-backbtn',
      attr: { type: 'button', 'aria-label': 'Back to sync menu' },
    });
    const ic = btn.createSpan({ cls: 'cortex-sync-backbtn-icon' });
    setIcon(ic, 'arrow-left');
    btn.createSpan({ text: 'Back to sync menu' });
    btn.addEventListener('click', () => {
      if (isInFlight()) {
        void confirmModal(this.app, {
          title: 'Sync is still running',
          body: 'Going back hides the progress UI but the sync keeps running. Continue?',
          confirmText: 'Hide and continue',
        }).then(ok => {
          if (ok) void this.renderPicker();
        });
        return;
      }
      void this.renderPicker();
    });
  }

  private receiptItem(parent: HTMLElement, icon: string, text: string, cls: string): void {
    const item = parent.createDiv({ cls: `cortex-pull-stat ${cls}` });
    const ic = item.createSpan({ cls: 'cortex-pull-stat-icon' });
    setIcon(ic, icon);
    item.createSpan({ text });
  }

  private renderError(
    _rootEl: HTMLElement,
    statsEl: HTMLElement,
    btnRow: HTMLElement,
    _cancelBtn: HTMLButtonElement,
    err: unknown,
    onRetry: () => void,
  ): void {
    const fmt = formatError(err, 'Push failed');
    statsEl.empty();
    const card = statsEl.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createDiv({ cls: 'cortex-error-head' });
    const ic = head.createSpan({ cls: 'cortex-error-icon' });
    setIcon(ic, errorIcon(fmt.kind));
    head.createSpan({ cls: 'cortex-error-headline', text: fmt.headline });
    if (fmt.hint) card.createDiv({ cls: 'cortex-error-hint', text: fmt.hint });
    const detailWrap = card.createEl('details', { cls: 'cortex-error-detail-wrap' });
    detailWrap.createEl('summary', { text: 'Error details' });
    detailWrap.createEl('pre', { cls: 'cortex-error-detail' }).createEl('code', { text: fmt.detail });

    btnRow.empty();
    const retry = btnRow.createEl('button', { text: 'Retry', cls: 'mod-cta' });
    retry.addEventListener('click', onRetry);
    const back = btnRow.createEl('button', { text: 'Back' });
    back.addEventListener('click', () => void this.renderPicker());
  }
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
