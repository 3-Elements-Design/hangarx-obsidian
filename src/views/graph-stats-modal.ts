import { App, Modal, Notice, setIcon } from 'obsidian';
import type { CortexClient, GraphStats, GraphRAGStats } from '../cortex-client';
import type CortexPlugin from '../main';
import { formatError, errorIcon } from '../services/error-format';

/**
 * Read-only inspection modal showing graph totals + per-type breakdown +
 * orchestrator stats. Intended for verification and debugging — paired with
 * the "Cortex: Get graph stats" command.
 */
export class GraphStatsModal extends Modal {
  constructor(app: App, private client: CortexClient, private plugin?: CortexPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.titleEl.setText('HangarX: Memory stats');
    this.contentEl.empty();
    this.contentEl.addClass('cortex-graph-stats');

    const status = this.contentEl.createEl('p', {
      cls: 'cortex-graph-stats-status',
      text: 'Loading…',
    });

    try {
      const startedAt = Date.now();
      // Both endpoints in parallel — graphRAG stats are best-effort.
      const [stats, ragStats] = await Promise.all([
        this.client.getGraphStats(),
        this.client.getGraphRAGStats().catch(() => null),
      ]);
      const elapsedMs = Date.now() - startedAt;
      status.remove();
      this.render(stats, ragStats, elapsedMs);
    } catch (e) {
      status.remove();
      this.renderError(e);
    }
  }

  private render(stats: GraphStats, ragStats: GraphRAGStats | null, elapsedMs: number): void {
    const c = this.contentEl;

    // ── Top summary cards ──────────────────────────────────────────
    const summary = c.createDiv({ cls: 'cortex-graph-stats-summary' });
    this.renderCard(summary, 'Entities', formatNumber(stats.totalEntities));
    this.renderCard(summary, 'Relationships', formatNumber(stats.totalRelationships));
    this.renderCard(summary, 'Entity types', String(stats.entityTypes.length));
    this.renderCard(summary, 'Relationship types', String(stats.relationshipTypes.length));

    // ── Empty-state hint ───────────────────────────────────────────
    if (stats.totalEntities === 0) {
      const hint = c.createDiv({ cls: 'cortex-graph-stats-hint' });
      hint.createEl('p', {
        text: 'The graph is empty. If you expected data here, run "HangarX: Sync vault to memory layer" from the command palette and watch the DevTools console for any ingest errors.',
      });
    }

    // ── Entity types table ─────────────────────────────────────────
    if (stats.entityTypes.length > 0) {
      c.createEl('h4', { text: 'Entity types' });
      const table = c.createEl('table', { cls: 'cortex-graph-stats-table' });
      const head = table.createEl('thead').createEl('tr');
      head.createEl('th', { text: 'Type' });
      head.createEl('th', { text: 'Count', cls: 'num' });
      head.createEl('th', { text: 'Sample properties' });
      const body = table.createEl('tbody');
      for (const et of stats.entityTypes) {
        const tr = body.createEl('tr');
        tr.createEl('td', { text: et.type });
        tr.createEl('td', { text: formatNumber(et.count), cls: 'num' });
        tr.createEl('td', {
          cls: 'cortex-graph-stats-props',
          text: (et.sampleProperties ?? []).slice(0, 8).join(', ') || '—',
        });
      }
    }

    // ── Relationship types table ───────────────────────────────────
    if (stats.relationshipTypes.length > 0) {
      c.createEl('h4', { text: 'Relationship types' });
      const table = c.createEl('table', { cls: 'cortex-graph-stats-table' });
      const head = table.createEl('thead').createEl('tr');
      head.createEl('th', { text: 'Type' });
      head.createEl('th', { text: 'Count', cls: 'num' });
      const body = table.createEl('tbody');
      for (const rt of stats.relationshipTypes) {
        const tr = body.createEl('tr');
        tr.createEl('td', { text: rt.type });
        tr.createEl('td', { text: formatNumber(rt.count), cls: 'num' });
      }
    }

    // ── GraphRAG orchestrator stats (optional) ─────────────────────
    if (ragStats) {
      c.createEl('h4', { text: 'GraphRAG orchestrator' });
      const dl = c.createEl('dl', { cls: 'cortex-graph-stats-dl' });
      for (const [k, v] of Object.entries(ragStats)) {
        if (v == null) continue;
        const dt = dl.createEl('dt', { text: humanizeKey(k) });
        const dd = dl.createEl('dd', { text: formatValue(v) });
        // Highlight obviously-bad values (e.g. 0% cache hit, very high latency)
        if (k === 'cacheHitRate' && typeof v === 'number' && v < 0.1) dd.addClass('is-warn');
        if (k === 'averageLatencyMs' && typeof v === 'number' && v > 5000) dd.addClass('is-warn');
        void dt;
      }
    }

    // ── Footer: elapsed + actions ──────────────────────────────────
    const footer = c.createDiv({ cls: 'cortex-graph-stats-footer' });
    footer.createEl('span', {
      cls: 'cortex-graph-stats-elapsed',
      text: `Fetched in ${elapsedMs}ms`,
    });
    const refreshBtn = footer.createEl('button', { text: 'Refresh' });
    refreshBtn.addEventListener('click', async () => {
      this.contentEl.empty();
      await this.onOpen();
    });
    const copyBtn = footer.createEl('button', { text: 'Copy as Markdown' });
    copyBtn.addEventListener('click', async () => {
      const md = renderAsMarkdown(stats, ragStats);
      await navigator.clipboard.writeText(md);
      copyBtn.setText('Copied');
      setTimeout(() => copyBtn.setText('Copy as Markdown'), 1400);
    });
    const noteBtn = footer.createEl('button', { text: 'Save as note', cls: 'mod-cta' });
    noteBtn.addEventListener('click', async () => {
      const md = renderAsMarkdown(stats, ragStats);
      const stamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
      const path = `Cortex/Debug/Graph stats - ${stamp}.md`;
      try {
        // Ensure parent folder exists
        const dir = path.split('/').slice(0, -1).join('/');
        if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
          await this.app.vault.createFolder(dir).catch(() => {});
        }
        const file = await this.app.vault.create(path, md);
        await this.app.workspace.getLeaf(false).openFile(file);
        this.close();
      } catch (e) {
        new Notice(`Couldn't save note: ${(e as Error).message}`);
      }
    });
  }

  private renderCard(parent: HTMLElement, label: string, value: string): void {
    const card = parent.createDiv({ cls: 'cortex-graph-stats-card' });
    card.createEl('div', { cls: 'cortex-graph-stats-card-value', text: value });
    card.createEl('div', { cls: 'cortex-graph-stats-card-label', text: label });
  }

  private renderError(err: unknown): void {
    const fmt = formatError(err, 'Couldn\'t load graph stats');
    const s = this.plugin?.settings;
    const isLocalAuth = fmt.kind === 'auth' && s?.connectionMode === 'local';
    const containerOutOfSync = isLocalAuth && s?.composeOutOfSync === true;

    const card = this.contentEl.createEl('div', { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl('div', { cls: 'cortex-error-head' });
    const ic = head.createEl('span', { cls: 'cortex-error-icon' });
    setIcon(ic, errorIcon(fmt.kind));
    head.createEl('span', {
      cls: 'cortex-error-headline',
      text: containerOutOfSync ? 'Container is out of sync' : fmt.headline,
    });

    if (containerOutOfSync) {
      card.createEl('div', {
        cls: 'cortex-error-hint',
        text: 'You regenerated the API key but haven\'t re-saved the compose file. ' +
              'Click "Open settings" → Save to vault, then run the rebuild command shown there.',
      });
    } else if (fmt.hint) {
      card.createEl('div', { cls: 'cortex-error-hint', text: fmt.hint });
    }

    const detailWrap = card.createEl('details', { cls: 'cortex-error-detail-wrap' });
    detailWrap.createEl('summary', { text: 'Error details' });
    detailWrap.createEl('pre', { cls: 'cortex-error-detail' })
      .createEl('code', { text: fmt.detail });

    const actions = card.createEl('div', { cls: 'cortex-error-actions' });
    if (this.plugin && (isLocalAuth || fmt.kind === 'auth')) {
      const openSettings = actions.createEl('button', { text: 'Open settings' });
      openSettings.addEventListener('click', () => {
        this.close();
        // Obsidian settings API: open the settings tab for this plugin.
        const setting = (this.app as unknown as { setting: { open(): void; openTabById(id: string): void } }).setting;
        setting.open();
        setting.openTabById(this.plugin!.manifest.id);
      });
    }
    const retry = actions.createEl('button', { text: 'Retry', cls: 'mod-cta' });
    retry.addEventListener('click', async () => {
      this.contentEl.empty();
      await this.onOpen();
    });
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function humanizeKey(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}

function formatValue(v: unknown): string {
  if (typeof v === 'number') {
    if (v > 0 && v < 1) return `${(v * 100).toFixed(1)}%`;
    return formatNumber(v);
  }
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return JSON.stringify(v);
}

/** Snapshot the stats as a markdown report — used by Copy + Save as note. */
function renderAsMarkdown(stats: GraphStats, ragStats: GraphRAGStats | null): string {
  const ts = new Date().toISOString();
  const lines: string[] = [];
  lines.push(`# HangarX memory stats`);
  lines.push('');
  lines.push(`_Captured ${ts}_`);
  lines.push('');
  lines.push(`- **Entities:** ${formatNumber(stats.totalEntities)}`);
  lines.push(`- **Relationships:** ${formatNumber(stats.totalRelationships)}`);
  lines.push(`- **Entity types:** ${stats.entityTypes.length}`);
  lines.push(`- **Relationship types:** ${stats.relationshipTypes.length}`);
  lines.push('');
  if (stats.entityTypes.length > 0) {
    lines.push(`## Entity types`);
    lines.push('');
    lines.push(`| Type | Count | Sample properties |`);
    lines.push(`|---|---:|---|`);
    for (const et of stats.entityTypes) {
      const props = (et.sampleProperties ?? []).slice(0, 8).join(', ') || '—';
      lines.push(`| ${et.type} | ${formatNumber(et.count)} | ${props} |`);
    }
    lines.push('');
  }
  if (stats.relationshipTypes.length > 0) {
    lines.push(`## Relationship types`);
    lines.push('');
    lines.push(`| Type | Count |`);
    lines.push(`|---|---:|`);
    for (const rt of stats.relationshipTypes) {
      lines.push(`| ${rt.type} | ${formatNumber(rt.count)} |`);
    }
    lines.push('');
  }
  if (ragStats) {
    lines.push(`## GraphRAG orchestrator`);
    lines.push('');
    for (const [k, v] of Object.entries(ragStats)) {
      if (v == null) continue;
      lines.push(`- **${humanizeKey(k)}:** ${formatValue(v)}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
