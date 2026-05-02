/**
 * Graph Pull progress modal.
 *
 * Shows a proper progress bar with phase labels while the graph pull
 * runs. Closes automatically on completion with a summary notice.
 */
import { App, Modal, Notice, setIcon } from 'obsidian';
import type { GraphPull, PullProgress, PullResult } from '../services/graph-pull';
import { formatError, errorIcon } from '../services/error-format';

export class GraphPullModal extends Modal {
  private phaseEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private barFill!: HTMLElement;
  private statsEl!: HTMLElement;
  private cancelBtn!: HTMLButtonElement;
  private cancelled = false;

  constructor(
    app: App,
    private graphPull: GraphPull,
    private mode: 'pull' | 'preview' | 'summary' = 'pull',
    private opts: { source?: 'local' | 'cloud'; sourceLabel?: string } = {},
  ) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.modalEl.addClass('cortex-pull-modal');
    const baseTitle =
      this.mode === 'pull' ? 'Pulling Cortex Graph' :
      this.mode === 'preview' ? 'Preview Graph Pull' :
      'Cortex Graph Summary';
    this.titleEl.setText(baseTitle);

    const content = this.contentEl;
    content.empty();

    // Phase indicator
    const phaseRow = content.createEl('div', { cls: 'cortex-pull-phase-row' });
    const phaseIcon = phaseRow.createEl('span', { cls: 'cortex-pull-phase-icon' });
    setIcon(phaseIcon, 'download-cloud');
    this.phaseEl = phaseRow.createEl('span', {
      cls: 'cortex-pull-phase-label',
      text: 'Initializing…',
    });

    // Message
    this.messageEl = content.createEl('div', { cls: 'cortex-pull-message' });

    // Progress bar
    const barWrap = content.createEl('div', { cls: 'cortex-pull-bar-wrap' });
    this.barFill = barWrap.createEl('div', { cls: 'cortex-pull-bar-fill' });

    // Stats area (populated on completion)
    this.statsEl = content.createEl('div', { cls: 'cortex-pull-stats' });

    // Cancel button
    const btnRow = content.createEl('div', { cls: 'cortex-pull-btn-row' });
    this.cancelBtn = btnRow.createEl('button', { text: 'Cancel', cls: 'cortex-pull-cancel' });
    this.cancelBtn.addEventListener('click', () => {
      this.cancelled = true;
      this.close();
    });

    // Run the pull
    try {
      if (this.mode === 'pull') {
        await this.runPull();
      } else if (this.mode === 'preview') {
        await this.runPreview();
      } else {
        await this.runSummary();
      }
    } catch (e) {
      this.showError((e as Error).message);
    }
  }

  private async runSummary(): Promise<void> {
    this.phaseEl.setText('Fetching graph stats…');
    this.barFill.addClass('cortex-pull-bar-indeterminate');
    const summary = await this.graphPull.summary();
    if (this.cancelled) return;

    this.barFill.removeClass('cortex-pull-bar-indeterminate');
    this.barFill.addClass('cortex-pull-bar-done');
    this.barFill.style.width = '100%';
    this.phaseEl.setText('Summary');
    this.messageEl.setText('Fast estimate from graph stats — run Preview for exact counts.');

    this.statsEl.empty();

    const grid = this.statsEl.createEl('div', { cls: 'cortex-pull-stat-grid' });
    this.statItem(grid, 'database', `${summary.cloudTotal.toLocaleString()} entities in cloud`, 'cortex-pull-stat-total');
    this.statItem(grid, 'hard-drive', `${summary.localTotal.toLocaleString()} pulled locally`, 'cortex-pull-stat-update');
    this.statItem(grid, 'plus-circle', `~${summary.estNew.toLocaleString()} would be new`, 'cortex-pull-stat-create');
    this.statItem(grid, 'trash-2', `~${summary.estStale.toLocaleString()} likely stale`, 'cortex-pull-stat-delete');

    if (summary.perType.length > 0) {
      const section = this.statsEl.createEl('details', { cls: 'cortex-pull-stat-details' });
      section.setAttr('open', '');
      section.createEl('summary', { text: `Breakdown by type (${summary.perType.length})` });
      const tbl = section.createEl('table', { cls: 'cortex-pull-summary-table' });
      const head = tbl.createEl('thead').createEl('tr');
      for (const h of ['Type', 'Cloud', 'Local', '~New']) head.createEl('th', { text: h });
      const body = tbl.createEl('tbody');
      for (const row of summary.perType) {
        const tr = body.createEl('tr');
        tr.createEl('td', { text: row.type });
        tr.createEl('td', { text: row.cloudCount.toLocaleString(), cls: 'cortex-pull-summary-num' });
        tr.createEl('td', { text: row.localCount.toLocaleString(), cls: 'cortex-pull-summary-num' });
        tr.createEl('td', {
          text: row.estNew > 0 ? `+${row.estNew.toLocaleString()}` : '—',
          cls: `cortex-pull-summary-num ${row.estNew > 0 ? 'is-new' : ''}`,
        });
      }
    }

    this.cancelBtn.setText('Close');
  }

  private async runPull(): Promise<void> {
    const result = await this.graphPull.pull((p) => this.onProgress(p));
    if (this.cancelled) return;

    this.showResult(result);

    // Auto-close after 4 seconds
    setTimeout(() => {
      if (!this.cancelled) this.close();
    }, 4000);
  }

  private async runPreview(): Promise<void> {
    const preview = await this.graphPull.preview((p) => this.onProgress(p));
    if (this.cancelled) return;

    this.phaseEl.setText('Preview complete');
    this.messageEl.setText('');
    this.barFill.style.width = '100%';
    this.barFill.addClass('cortex-pull-bar-done');

    this.statsEl.empty();
    this.statsEl.createEl('div', { cls: 'cortex-pull-stat-header', text: 'What would happen:' });

    const grid = this.statsEl.createEl('div', { cls: 'cortex-pull-stat-grid' });
    this.statItem(grid, 'plus-circle', `${preview.toCreate.length} new files`, 'cortex-pull-stat-create');
    this.statItem(grid, 'edit-3', `${preview.toUpdate.length} updated`, 'cortex-pull-stat-update');
    this.statItem(grid, 'trash-2', `${preview.toDelete.length} removed`, 'cortex-pull-stat-delete');
    this.statItem(grid, 'database', `${preview.entityCount} total entities`, 'cortex-pull-stat-total');

    if (preview.toCreate.length > 0) {
      const section = this.statsEl.createEl('details', { cls: 'cortex-pull-stat-details' });
      section.createEl('summary', { text: `New entities (${preview.toCreate.length})` });
      const list = section.createEl('ul');
      for (const name of preview.toCreate.slice(0, 50)) {
        list.createEl('li', { text: name });
      }
      if (preview.toCreate.length > 50) {
        list.createEl('li', { text: `… and ${preview.toCreate.length - 50} more`, cls: 'cortex-pull-more' });
      }
    }

    this.cancelBtn.setText('Close');
  }

  private onProgress(p: PullProgress): void {
    if (this.cancelled) return;

    const phaseLabels: Record<string, string> = {
      fetching: '⬇ Fetching',
      writing: '✏ Writing files',
      enriching: '🔗 Enriching notes',
      cleanup: '🧹 Cleaning up',
      done: '✓ Done',
    };
    this.phaseEl.setText(phaseLabels[p.phase] ?? p.phase);
    this.messageEl.setText(p.message);

    if (p.total > 0) {
      const pct = Math.min(100, Math.round((p.current / p.total) * 100));
      this.barFill.style.width = `${pct}%`;
    } else if (p.phase === 'fetching') {
      // Indeterminate — pulse
      this.barFill.addClass('cortex-pull-bar-indeterminate');
      this.barFill.style.width = '';
    }

    if (p.phase === 'done') {
      this.barFill.removeClass('cortex-pull-bar-indeterminate');
      this.barFill.addClass('cortex-pull-bar-done');
      this.barFill.style.width = '100%';
    }
  }

  private showResult(result: PullResult): void {
    this.phaseEl.setText('✓ Pull complete');
    this.messageEl.setText('');
    this.cancelBtn.setText('Close');

    this.statsEl.empty();
    const grid = this.statsEl.createEl('div', { cls: 'cortex-pull-stat-grid' });
    this.statItem(grid, 'plus-circle', `${result.created} created`, 'cortex-pull-stat-create');
    this.statItem(grid, 'edit-3', `${result.updated} updated`, 'cortex-pull-stat-update');
    this.statItem(grid, 'trash-2', `${result.deleted} removed`, 'cortex-pull-stat-delete');
    if (result.enriched > 0) {
      this.statItem(grid, 'link', `${result.enriched} notes enriched`, 'cortex-pull-stat-enriched');
    }

    if (result.errors.length > 0) {
      const errSection = this.statsEl.createEl('details', { cls: 'cortex-pull-stat-details cortex-pull-errors' });
      errSection.createEl('summary', { text: `${result.errors.length} errors` });
      const list = errSection.createEl('ul');
      for (const err of result.errors.slice(0, 20)) {
        list.createEl('li', { text: err });
      }
    }

    new Notice(
      `Cortex graph: ${result.created} created, ${result.updated} updated, ${result.deleted} removed` +
      (result.enriched > 0 ? `, ${result.enriched} notes enriched` : ''),
    );
  }

  private showError(rawMessage: string): void {
    const fmt = formatError(rawMessage, 'Couldn\'t pull graph');
    this.phaseEl.setText('Error');
    this.barFill.addClass('cortex-pull-bar-error');
    this.barFill.style.width = '100%';

    // Replace the message-line + stats area with a structured error card.
    this.messageEl.empty();
    this.messageEl.removeClass('cortex-pull-error-msg');
    this.statsEl.empty();

    const card = this.statsEl.createEl('div', { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl('div', { cls: 'cortex-error-head' });
    const ic = head.createEl('span', { cls: 'cortex-error-icon' });
    setIcon(ic, errorIcon(fmt.kind));
    head.createEl('span', { cls: 'cortex-error-headline', text: fmt.headline });

    if (fmt.hint) {
      card.createEl('div', { cls: 'cortex-error-hint', text: fmt.hint });
    }

    const detailWrap = card.createEl('details', { cls: 'cortex-error-detail-wrap' });
    detailWrap.createEl('summary', { text: 'Error details' });
    detailWrap.createEl('pre', { cls: 'cortex-error-detail' })
      .createEl('code', { text: fmt.detail });

    // Replace the bottom button row: Retry + Copy + Close.
    const btnRow = card.createEl('div', { cls: 'cortex-error-actions' });
    const retryBtn = btnRow.createEl('button', { text: 'Retry', cls: 'mod-cta' });
    retryBtn.addEventListener('click', async () => {
      // Reset modal state and re-run the same pull/preview.
      this.statsEl.empty();
      this.messageEl.setText('');
      this.barFill.removeClass('cortex-pull-bar-error');
      this.barFill.style.width = '0%';
      this.phaseEl.setText('Initializing…');
      try {
        if (this.mode === 'pull') await this.runPull();
        else await this.runPreview();
      } catch (e) {
        this.showError((e as Error).message);
      }
    });

    const copyBtn = btnRow.createEl('button', { text: 'Copy details' });
    copyBtn.addEventListener('click', async () => {
      const payload = `${fmt.headline}\n\n${fmt.detail}${fmt.hint ? `\n\nHint: ${fmt.hint}` : ''}`;
      await navigator.clipboard.writeText(payload);
      copyBtn.setText('Copied');
      setTimeout(() => copyBtn.setText('Copy details'), 1400);
    });

    // The pre-existing Cancel button below now reads "Close".
    this.cancelBtn.setText('Close');
  }

  private statItem(parent: HTMLElement, icon: string, text: string, cls: string): void {
    const item = parent.createEl('div', { cls: `cortex-pull-stat ${cls}` });
    const ic = item.createEl('span', { cls: 'cortex-pull-stat-icon' });
    setIcon(ic, icon);
    item.createEl('span', { text });
  }

  onClose(): void {
    this.cancelled = true;
    this.contentEl.empty();
  }
}
