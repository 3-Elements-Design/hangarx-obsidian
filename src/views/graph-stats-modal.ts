import { App, Modal, Notice, requestUrl, setIcon } from 'obsidian';
import type { CortexClient, GraphStats, GraphRAGStats } from '../cortex-client';
import type CortexPlugin from '../main';
import { formatError, errorIcon } from '../services/error-format';

/** File-structure entity types — used to compute the "semantic content" ratio
 *  for the Insights box. These are pipeline-generated, not LLM-extracted, so
 *  a graph that's >95% these is usually under-extracted. */
const FILE_STRUCTURE_TYPES = new Set(['Note', 'NoteSection', 'Document', 'Chunk', 'File']);

/** How many entity / relationship rows to show before the "show more" expander. */
const TOP_N_VISIBLE = 5;

/**
 * Memory Stats modal — at-a-glance view of the user's knowledge graph with
 * progressive disclosure for the technical bits. Hero numbers + bar charts
 * for type distribution, an Insights section that flags common failure modes
 * (sparse extraction, dominant wikilink relationships, missing rerankers),
 * and click-to-drill rows that prefill the chat panel with starter queries.
 */
export class GraphStatsModal extends Modal {
  private statusPillEl: HTMLElement | null = null;
  private statusPollTimer: number | null = null;

  constructor(app: App, private client: CortexClient, private plugin?: CortexPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.titleEl.setText('Knowledge graph stats');
    this.contentEl.empty();
    this.contentEl.addClass('cortex-graph-stats');

    // Mode pill goes above the loading state so the user can see *what they're
    // talking to* even while the stats are still in flight.
    this.renderModePillBar(this.contentEl);

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

  onClose(): void {
    if (this.statusPollTimer != null) {
      window.clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }

  private render(stats: GraphStats, ragStats: GraphRAGStats | null, elapsedMs: number): void {
    const c = this.contentEl;

    // ── Hero stats: 2 big tiles + ratio chip ───────────────────────
    // "Entity types" / "Relationship types" used to live here as their own
    // tiles, but they're dimensions, not magnitudes — they belong as captions
    // on the breakdown sections below. The derived rel-per-entity ratio tells
    // the user whether the graph is sparse (≈1, mostly file structure) or
    // richly connected (3+) at a glance.
    const summary = c.createDiv({ cls: 'cortex-graph-stats-summary' });
    this.renderHeroCard(summary, 'Entities', formatNumber(stats.totalEntities));
    this.renderHeroCard(summary, 'Relationships', formatNumber(stats.totalRelationships));
    const ratio = stats.totalEntities > 0
      ? stats.totalRelationships / stats.totalEntities
      : 0;
    const ratioCard = summary.createDiv({ cls: 'cortex-graph-stats-card cortex-graph-stats-card-ratio' });
    ratioCard.createDiv({ cls: 'cortex-graph-stats-card-value', text: ratio.toFixed(2) });
    ratioCard.createDiv({ cls: 'cortex-graph-stats-card-label', text: 'Relationships per entity' });
    const ratioHint = ratioCard.createDiv({ cls: 'cortex-graph-stats-card-hint' });
    if (ratio < 1.2) {
      ratioCard.addClass('is-warn');
      ratioHint.textContent = 'Sparse — graph is mostly file structure';
    } else if (ratio < 2.5) {
      ratioHint.textContent = 'Moderate connectivity';
    } else {
      ratioCard.addClass('is-good');
      ratioHint.textContent = 'Richly connected';
    }

    // ── Empty-state hint ───────────────────────────────────────────
    if (stats.totalEntities === 0) {
      const hint = c.createDiv({ cls: 'cortex-graph-stats-hint' });
      hint.createEl('p', {
        text: 'The graph is empty. Run "hangarx: Sync vault to knowledge graph" from the command palette and check the devtools console for any ingest errors.',
      });
      this.renderFooter(c, stats, ragStats, elapsedMs);
      return;
    }

    // ── Insights / heads-up ────────────────────────────────────────
    const insights = computeInsights(stats, ragStats);
    if (insights.length > 0) {
      const wrap = c.createDiv({ cls: 'cortex-graph-stats-insights' });
      wrap.createEl('h4', { text: 'Heads up' });
      const list = wrap.createEl('ul');
      for (const i of insights) {
        const li = list.createEl('li');
        li.addClass(`is-${i.severity}`);
        li.createSpan({ cls: 'cortex-graph-stats-insight-icon', text: i.severity === 'warn' ? '⚠' : 'ⓘ' });
        const body = li.createDiv({ cls: 'cortex-graph-stats-insight-body' });
        body.createDiv({ cls: 'cortex-graph-stats-insight-headline', text: i.headline });
        body.createDiv({ cls: 'cortex-graph-stats-insight-detail', text: i.detail });
      }
    }

    // ── Entity types — bar chart ───────────────────────────────────
    if (stats.entityTypes.length > 0) {
      const sorted = stats.entityTypes.slice().sort((a, b) => b.count - a.count);
      const max = sorted[0].count || 1;
      const total = stats.totalEntities || 1;

      const section = c.createDiv({ cls: 'cortex-graph-stats-section' });
      const headerRow = section.createDiv({ cls: 'cortex-graph-stats-section-header' });
      headerRow.createEl('h4', { text: 'What\'s in your graph' });
      headerRow.createSpan({
        cls: 'cortex-graph-stats-section-caption',
        text: `${sorted.length} ${sorted.length === 1 ? 'type' : 'types'}`,
      });

      const bars = section.createDiv({ cls: 'cortex-graph-stats-bars' });
      const visible = sorted.slice(0, TOP_N_VISIBLE);
      const hidden = sorted.slice(TOP_N_VISIBLE);
      for (const et of visible) {
        this.renderBarRow(bars, et.type, et.count, max, total, () => {
          void this.plugin?.askInChat(
            `Show me a few example ${et.type} entities from my notes and what they're connected to.`,
          );
          this.close();
        });
      }
      if (hidden.length > 0) {
        const more = section.createEl('details', { cls: 'cortex-graph-stats-more' });
        more.createEl('summary', { text: `Show ${hidden.length} more` });
        const moreBars = more.createDiv({ cls: 'cortex-graph-stats-bars' });
        for (const et of hidden) {
          this.renderBarRow(moreBars, et.type, et.count, max, total, () => {
            void this.plugin?.askInChat(
              `Show me a few example ${et.type} entities from my notes and what they're connected to.`,
            );
            this.close();
          });
        }
      }
    }

    // ── Relationship types — bar chart ─────────────────────────────
    if (stats.relationshipTypes.length > 0) {
      const sorted = stats.relationshipTypes.slice().sort((a, b) => b.count - a.count);
      const max = sorted[0].count || 1;
      const total = stats.totalRelationships || 1;

      const section = c.createDiv({ cls: 'cortex-graph-stats-section' });
      const headerRow = section.createDiv({ cls: 'cortex-graph-stats-section-header' });
      headerRow.createEl('h4', { text: 'How things connect' });
      headerRow.createSpan({
        cls: 'cortex-graph-stats-section-caption',
        text: `${sorted.length} ${sorted.length === 1 ? 'type' : 'types'}`,
      });

      const bars = section.createDiv({ cls: 'cortex-graph-stats-bars' });
      const visible = sorted.slice(0, TOP_N_VISIBLE);
      const hidden = sorted.slice(TOP_N_VISIBLE);
      for (const rt of visible) {
        this.renderBarRow(bars, rt.type, rt.count, max, total, () => {
          void this.plugin?.askInChat(
            `Show me a few examples of ${rt.type} relationships in my notes — what's connected to what?`,
          );
          this.close();
        });
      }
      if (hidden.length > 0) {
        const more = section.createEl('details', { cls: 'cortex-graph-stats-more' });
        more.createEl('summary', { text: `Show ${hidden.length} more` });
        const moreBars = more.createDiv({ cls: 'cortex-graph-stats-bars' });
        for (const rt of hidden) {
          this.renderBarRow(moreBars, rt.type, rt.count, max, total, () => {
            void this.plugin?.askInChat(
              `Show me a few examples of ${rt.type} relationships in my notes — what's connected to what?`,
            );
            this.close();
          });
        }
      }
    }

    // ── Communities ────────────────────────────────────────────────
    this.renderCommunities(c);

    // ── Technical details (collapsed) ──────────────────────────────
    this.renderTechnicalDetails(c, stats, ragStats);

    // ── Footer ─────────────────────────────────────────────────────
    this.renderFooter(c, stats, ragStats, elapsedMs);
  }

  /**
   * Communities panel. Local single-user stacks ship with auto-detection
   * disabled because Louvain on every ingest is expensive — instead, this
   * is the on-demand surface: click "Detect now", server runs Louvain +
   * LLM summaries, list refreshes with hierarchy + member counts.
   *
   * Cloud installs that already auto-detect see the same list with no
   * extra clicks needed. Either way, "Detect now" is idempotent — re-run
   * any time the graph has shifted enough to warrant new clustering.
   */
  private renderCommunities(parent: HTMLElement): void {
    const wrap = parent.createDiv({ cls: 'cortex-graph-stats-communities' });
    const header = wrap.createDiv({ cls: 'cortex-graph-stats-communities-header' });
    header.createEl('h4', { text: 'Communities' });

    const detectBtn = header.createEl('button', {
      cls: 'cortex-graph-stats-detect-btn',
      text: 'Detect now',
    });

    const desc = wrap.createEl('p', { cls: 'setting-item-description' });
    desc.setText(
      'Topic clusters group densely-connected notes, with an LLM-generated summary per group. ' +
      'Useful for "what topics dominate my vault?" and as retrieval seeds during chat.',
    );

    const listEl = wrap.createDiv({ cls: 'cortex-graph-stats-communities-list' });
    listEl.createEl('p', { cls: 'cortex-graph-stats-loading', text: 'Loading…' });

    const renderList = (communities: Array<import('../cortex-client').CommunitySummary>): void => {
      listEl.empty();
      // A row is only meaningful if it has members AND a name OR member
      // entity hints we can display. Filter out zero-member ghost clusters
      // before deciding whether the section is empty — those happen when
      // detection ran on a sparse graph or a previous run was deleted.
      const meaningful = communities.filter((c) => (c.memberCount ?? 0) > 0);
      if (meaningful.length === 0) {
        const empty = listEl.createDiv({ cls: 'cortex-graph-stats-empty-card' });
        empty.createDiv({
          cls: 'cortex-graph-stats-empty-title',
          text: 'No topic clusters detected yet',
        });
        empty.createDiv({
          cls: 'cortex-graph-stats-empty-body',
          text: communities.length > 0
            ? 'Detection ran but every cluster came back empty. The graph likely has too few entities to form meaningful groups — re-run after more notes have been ingested.'
            : 'Click "Detect now" to run clustering on your current knowledge graph. Detection works best after at least 50 entities have been extracted.',
        });
        return;
      }
      const sorted = [...meaningful].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
      for (const c of sorted.slice(0, 20)) {
        const row = listEl.createDiv({ cls: 'cortex-graph-stats-community-row' });
        const head = row.createDiv({ cls: 'cortex-graph-stats-community-head' });
        // Fallback when the LLM-summary call hasn't given us a name yet:
        // synthesize one from the cluster's top member entities so the
        // user sees real content instead of "Unnamed community".
        const rawMemberNames = (c as unknown as { memberNames?: string | string[] | null }).memberNames;
        const memberHints = parseStringList(rawMemberNames ?? null);
        const fallbackName = memberHints.length > 0
          ? `${memberHints.slice(0, 3).join(', ')}${memberHints.length > 3 ? ` + ${memberHints.length - 3} more` : ''}`
          : `Cluster of ${c.memberCount ?? 0} entities`;
        head.createEl('strong', { text: c.name || fallbackName });
        const meta = head.createSpan({ cls: 'cortex-graph-stats-community-meta' });
        const parts: string[] = [];
        if (typeof c.memberCount === 'number') parts.push(`${c.memberCount} members`);
        // Only show hierarchy level when it's non-zero (sub-cluster) —
        // the user doesn't need to know "L0" means top-level group.
        if (typeof c.level === 'number' && c.level > 0) parts.push(`sub-group · level ${c.level}`);
        if (typeof c.density === 'number' && c.density > 0) parts.push(`density ${c.density.toFixed(2)}`);
        meta.setText(parts.join(' · '));
        if (c.summary && c.summary.trim().length > 0) {
          row.createEl('p', { cls: 'cortex-graph-stats-community-summary', text: c.summary });
        }
        const keywords = parseStringList(c.keywords);
        if (keywords.length > 0) {
          const kwRow = row.createDiv({ cls: 'cortex-graph-stats-community-keywords' });
          for (const kw of keywords.slice(0, 8)) {
            kwRow.createSpan({ cls: 'cortex-graph-stats-community-chip', text: kw });
          }
        }
      }
      if (sorted.length > 20) {
        listEl.createEl('p', {
          cls: 'cortex-graph-stats-empty',
          text: `+${sorted.length - 20} more not shown.`,
        });
      }
    };

    const loadList = async (): Promise<void> => {
      try {
        const communities = await this.client.listCommunities({ limit: 100 });
        renderList(communities);
      } catch (e) {
        listEl.empty();
        const err = listEl.createEl('p', { cls: 'cortex-graph-stats-error' });
        err.setText(`Couldn't load communities: ${(e as Error).message.slice(0, 200)}`);
      }
    };

    detectBtn.addEventListener('click', () => { void (async () => {
      detectBtn.setAttr('disabled', 'true');
      detectBtn.setText('Detecting…');
      listEl.empty();
      listEl.createEl('p', {
        cls: 'cortex-graph-stats-loading',
        text: 'Running louvain + writing LLM summaries — can take 30–90s on large graphs…',
      });
      try {
        const res = await this.client.detectCommunities({ algorithm: 'louvain' });
        new Notice(
          `Detected ${res.communitiesCreated} communities (${res.levels} levels, modularity ${res.modularity.toFixed(2)})`,
          5000,
        );
        await loadList();
      } catch (e) {
        listEl.empty();
        const err = listEl.createEl('p', { cls: 'cortex-graph-stats-error' });
        err.setText(`Detection failed: ${(e as Error).message.slice(0, 200)}`);
      } finally {
        detectBtn.removeAttribute('disabled');
        detectBtn.setText('Detect now');
      }
    })(); });

    void loadList();
  }

  /** One horizontal bar row: name on the left, bar in the middle (sized by
   *  count/max), count + percent on the right. The whole row is clickable. */
  private renderBarRow(
    parent: HTMLElement,
    label: string,
    count: number,
    max: number,
    total: number,
    onClick?: () => void,
  ): void {
    const row = parent.createDiv({ cls: 'cortex-graph-stats-bar-row' });
    if (onClick) {
      row.addClass('is-clickable');
      row.setAttr('tabindex', '0');
      row.setAttr('role', 'button');
      row.setAttr('aria-label', `${label} — ${count.toLocaleString()} (click to ask the chat about it)`);
      row.addEventListener('click', onClick);
      row.addEventListener('keydown', (evt: KeyboardEvent) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          onClick();
        }
      });
    }
    row.createSpan({ cls: 'cortex-graph-stats-bar-label', text: label });
    const track = row.createDiv({ cls: 'cortex-graph-stats-bar-track' });
    const fill = track.createDiv({ cls: 'cortex-graph-stats-bar-fill cortex-progress-bar-fill' });
    const widthPct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
    fill.setCssProps({ '--cortex-progress-pct': `${widthPct}%` });
    const right = row.createDiv({ cls: 'cortex-graph-stats-bar-meta' });
    right.createSpan({ cls: 'cortex-graph-stats-bar-count', text: formatNumber(count) });
    const percent = total > 0 ? (count / total) * 100 : 0;
    right.createSpan({
      cls: 'cortex-graph-stats-bar-percent',
      text: percent < 0.5 ? '<1%' : `${percent.toFixed(0)}%`,
    });
  }

  /** Collapsed `<details>` block — sample properties, GraphRAG config (as
   *  toggle chips, not raw JSON), search provider availability. The Save-as-
   *  note flow still includes everything in the markdown report. */
  private renderTechnicalDetails(parent: HTMLElement, stats: GraphStats, ragStats: GraphRAGStats | null): void {
    const wrap = parent.createEl('details', { cls: 'cortex-graph-stats-tech' });
    wrap.createEl('summary', { text: 'Show technical details' });
    const body = wrap.createDiv();

    // Sample properties — collapse the system fields, surface only the
    // type-distinguishing ones. If a type has no non-system properties, just
    // show a count of distinct fields so the row isn't empty.
    if (stats.entityTypes.length > 0) {
      body.createEl('h5', { text: 'Type-specific properties' });
      const table = body.createEl('table', { cls: 'cortex-graph-stats-table' });
      const head = table.createEl('thead').createEl('tr');
      head.createEl('th', { text: 'Type' });
      head.createEl('th', { text: 'Distinguishing properties' });
      const tb = table.createEl('tbody');
      for (const et of stats.entityTypes.slice().sort((a, b) => b.count - a.count)) {
        const distinguishing = (et.sampleProperties ?? []).filter(p => !isSystemProperty(p));
        const tr = tb.createEl('tr');
        tr.createEl('td', { text: et.type });
        tr.createEl('td', {
          cls: 'cortex-graph-stats-props',
          text: distinguishing.length > 0
            ? distinguishing.slice(0, 8).join(', ')
            : '— (only pipeline metadata)',
        });
      }
    }

    // GraphRAG orchestrator config: keep only the user-actionable bits
    // (active model / provider / numeric thresholds the user might tune).
    // The boolean feature-flag chip wall ("Corrective Loops", "Raptor",
    // "PPR Expansion", etc.) was removed — those are internal optimization
    // names the user can't toggle and they leaked implementation jargon
    // into a settings UI. If you need to inspect them, use the raw JSON
    // copy below.
    if (ragStats) {
      const flat = flattenRagStats(ragStats);
      const numbers: Array<[string, number]> = [];
      const strings: Array<[string, string]> = [];
      for (const [k, v] of Object.entries(flat)) {
        if (typeof v === 'number') numbers.push([k, v]);
        else if (typeof v === 'string') strings.push([k, v]);
      }
      if (numbers.length > 0 || strings.length > 0) {
        body.createEl('h5', { text: 'Graphrag orchestrator' });
      }
      if (strings.length > 0) {
        body.createDiv({ cls: 'cortex-graph-stats-tech-sublabel', text: 'Models / providers' });
        const dl = body.createEl('dl', { cls: 'cortex-graph-stats-dl' });
        for (const [k, v] of strings) {
          dl.createEl('dt', { text: humanizeKey(k) });
          dl.createEl('dd', { text: v });
        }
      }
      if (numbers.length > 0) {
        body.createDiv({ cls: 'cortex-graph-stats-tech-sublabel', text: 'Thresholds & metrics' });
        const dl = body.createEl('dl', { cls: 'cortex-graph-stats-dl' });
        for (const [k, v] of numbers) {
          dl.createEl('dt', { text: humanizeKey(k) });
          dl.createEl('dd', { text: formatValue(v) });
        }
      }
    }
  }

  private renderFooter(
    parent: HTMLElement,
    stats: GraphStats,
    ragStats: GraphRAGStats | null,
    elapsedMs: number,
  ): void {
    const footer = parent.createDiv({ cls: 'cortex-graph-stats-footer' });
    footer.createSpan({
      cls: 'cortex-graph-stats-elapsed',
      text: `Fetched in ${elapsedMs}ms`,
    });
    const refreshBtn = footer.createEl('button', { text: 'Refresh' });
    refreshBtn.addEventListener('click', () => { void (async () => {
      this.contentEl.empty();
      await this.onOpen();
    })(); });
    const copyBtn = footer.createEl('button', { text: 'Copy as Markdown' });
    copyBtn.addEventListener('click', () => { void (async () => {
      const md = renderAsMarkdown(stats, ragStats);
      await navigator.clipboard.writeText(md);
      copyBtn.setText('Copied');
      activeWindow.setTimeout(() => copyBtn.setText('Copy as Markdown'), 1400);
    })(); });
    const noteBtn = footer.createEl('button', { text: 'Save as note', cls: 'mod-cta' });
    noteBtn.addEventListener('click', () => { void (async () => {
      const md = renderAsMarkdown(stats, ragStats);
      const stamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
      const path = `Cortex/Debug/Graph stats - ${stamp}.md`;
      try {
        const dir = path.split('/').slice(0, -1).join('/');
        if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
          await this.app.vault.createFolder(dir).catch(() => undefined);
        }
        const file = await this.app.vault.create(path, md);
        await this.app.workspace.getLeaf(false).openFile(file);
        this.close();
      } catch (e) {
        new Notice(`Couldn't save note: ${(e as Error).message}`);
      }
    })(); });
  }

  private renderHeroCard(parent: HTMLElement, label: string, value: string): void {
    const card = parent.createDiv({ cls: 'cortex-graph-stats-card' });
    card.createDiv({ cls: 'cortex-graph-stats-card-value', text: value });
    card.createDiv({ cls: 'cortex-graph-stats-card-label', text: label });
  }

  /** Render the connection-mode pill at the top — same shape as the chat
   *  panel's pill but standalone (modal doesn't share layout). Click to
   *  re-probe; auto-polls every 30s while the modal is open. */
  private renderModePillBar(parent: HTMLElement): void {
    if (!this.plugin) return;
    const bar = parent.createDiv({ cls: 'cortex-graph-stats-mode-bar' });
    this.statusPillEl = bar.createSpan({ cls: 'cortex-chat-mode-pill' });
    this.renderModePill('checking');
    void this.runModeProbe();
  }

  private renderModePill(state: 'checking' | 'connected' | 'offline'): void {
    if (!this.statusPillEl || !this.plugin) return;
    const s = this.plugin.settings;
    this.statusPillEl.empty();
    this.statusPillEl.removeClass('is-checking', 'is-connected', 'is-offline');
    this.statusPillEl.addClass(`is-${state}`);

    const mode = s.connectionMode === 'local' ? 'Local' : 'Cloud';
    const host = (() => {
      try { return new URL(s.apiUrl).host; } catch { return s.apiUrl; }
    })();

    this.statusPillEl.createSpan({ cls: 'cortex-chat-mode-dot' });
    if (state === 'checking') {
      this.statusPillEl.createSpan({ text: `${mode} · checking…` });
      this.statusPillEl.setAttr('title', `${mode} mode (${host}) — checking…`);
    } else if (state === 'connected') {
      this.statusPillEl.createSpan({ text: `${mode} · ${host}` });
      this.statusPillEl.setAttr('title', `Connected to ${host}. Click to recheck.`);
    } else {
      this.statusPillEl.createSpan({ text: `${mode} · offline` });
      this.statusPillEl.setAttr('title', `Cannot reach ${host}. Click to retry.`);
    }
    this.statusPillEl.onclick = () => { void this.runModeProbe(); };
  }

  private async runModeProbe(): Promise<void> {
    if (!this.statusPillEl || !this.plugin) return;
    this.renderModePill('checking');
    const ok = await this.probeHealth();
    this.renderModePill(ok ? 'connected' : 'offline');
    if (this.statusPollTimer == null) {
      // Disclosed periodic network call: hits the user-configured Cortex
      // API's /health endpoint every 30s while this modal is open so the
      // status pill stays accurate. Sends no vault data — just a bare GET.
      // Timer is cleared in onClose.
      this.statusPollTimer = window.setInterval(() => { void this.runModeProbe(); }, 30_000);
    }
  }

  private async probeHealth(): Promise<boolean> {
    if (!this.plugin) return false;
    const cleanUrl = (this.plugin.settings.apiUrl || '').replace(/\/$/, '');
    if (!cleanUrl) return false;
    try {
      const res = await requestUrl({ url: `${cleanUrl}/health`, method: 'GET', throw: false });
      return res.status >= 200 && (res.status < 400 || res.status === 503);
    } catch {
      return false;
    }
  }

  private renderError(err: unknown): void {
    const fmt = formatError(err, 'Couldn\'t load graph stats');

    const card = this.contentEl.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createDiv({ cls: 'cortex-error-head' });
    const ic = head.createSpan({ cls: 'cortex-error-icon' });
    setIcon(ic, errorIcon(fmt.kind));
    head.createSpan({ cls: 'cortex-error-headline', text: fmt.headline });
    if (fmt.hint) card.createDiv({ cls: 'cortex-error-hint', text: fmt.hint });

    const detailWrap = card.createEl('details', { cls: 'cortex-error-detail-wrap' });
    detailWrap.createEl('summary', { text: 'Error details' });
    detailWrap.createEl('pre', { cls: 'cortex-error-detail' })
      .createEl('code', { text: fmt.detail });

    const actions = card.createDiv({ cls: 'cortex-error-actions' });
    if (this.plugin && fmt.kind === 'auth') {
      const openSettings = actions.createEl('button', { text: 'Open settings' });
      openSettings.addEventListener('click', () => {
        this.close();
        const setting = (this.app as unknown as { setting: { open(): void; openTabById(id: string): void } }).setting;
        setting.open();
        setting.openTabById(this.plugin!.manifest.id);
      });
    }
    const retry = actions.createEl('button', { text: 'Retry', cls: 'mod-cta' });
    retry.addEventListener('click', () => { void (async () => {
      this.contentEl.empty();
      await this.onOpen();
    })(); });
  }
}

interface Insight {
  severity: 'warn' | 'info';
  headline: string;
  detail: string;
}

/**
 * Surface common failure modes the user can act on. Order matters — most
 * actionable first. Each insight is a single sentence diagnosis + a single
 * sentence "how to fix"; we deliberately don't link to docs since this UI
 * is offline-capable.
 */
function computeInsights(stats: GraphStats, ragStats: GraphRAGStats | null): Insight[] {
  const out: Insight[] = [];

  // 1. Sparse semantic content — graph is mostly file structure.
  const structuredCount = stats.entityTypes
    .filter(et => !FILE_STRUCTURE_TYPES.has(et.type))
    .reduce((sum, et) => sum + et.count, 0);
  const totalEntities = stats.totalEntities;
  if (totalEntities > 100 && structuredCount / totalEntities < 0.05) {
    out.push({
      severity: 'warn',
      headline: 'Most of your graph is file structure, not concepts',
      detail: `Only ${structuredCount} of ${totalEntities.toLocaleString()} entities are conceptual (Person/Concept/Tag/etc). Run "Force re-ingest" with a stronger LLM to extract more meaningful entities.`,
    });
  }

  // 2. WIKILINK dominates relationships — common when the vault is well-
  //    interlinked but the LLM hasn't extracted semantic relationships.
  const totalRel = stats.totalRelationships;
  const wikilink = stats.relationshipTypes.find(rt => rt.type === 'WIKILINK');
  if (totalRel > 100 && wikilink && wikilink.count / totalRel > 0.7) {
    out.push({
      severity: 'info',
      headline: 'WIKILINK dominates your connections',
      detail: `${Math.round((wikilink.count / totalRel) * 100)}% of relationships are wikilinks (file-to-file). The LLM hasn't extracted many semantic relationships — Force re-ingest may help if you want richer "X relates to Y" queries.`,
    });
  }

  // 3. (intentionally removed) "Reranker not configured" used to surface
  //    here, but cortex-api ships with 4 rerankers (embedding-similarity
  //    fallback, gpt-4o-mini LLM rerank, optional Cohere, optional Jina)
  //    and at least one is always active. Cohere/Jina are quality
  //    upgrades, not requirements — the warning was misleading.
  //
  // 4. (intentionally removed) "Search indices are cold" was shown on
  //    first use but resolved on the next query. Self-correcting <30s
  //    conditions don't belong in a user-facing heads-up panel.

  // 5. Cache hit rate notably low — surfaced when there's been enough query
  //    volume for the number to be meaningful.
  const totalQueries = (ragStats?.totalQueries) ?? 0;
  const cacheHitRate = (ragStats?.cacheHitRate) ?? -1;
  if (totalQueries >= 50 && cacheHitRate >= 0 && cacheHitRate < 0.1) {
    out.push({
      severity: 'info',
      headline: 'Query cache rarely hits',
      detail: `Cache hit rate is ${(cacheHitRate * 100).toFixed(1)}% across ${totalQueries.toLocaleString()} queries. Enable or tune the semantic cache for repeat-query speedups.`,
    });
  }

  return out;
}

/** Flatten one level of objects so we can split keys into bool/number/string
 *  buckets. Top-level objects (Evaluator Config, Orchestrator Config) get
 *  inlined; deeper nesting is preserved as a JSON-stringified summary. */
function flattenRagStats(stats: GraphRAGStats): Record<string, boolean | number | string> {
  const out: Record<string, boolean | number | string> = {};
  for (const [k, v] of Object.entries(stats)) {
    if (v == null) continue;
    if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') {
      out[k] = v;
    } else if (typeof v === 'object') {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        if (typeof v2 === 'boolean' || typeof v2 === 'number' || typeof v2 === 'string') {
          out[k2] = v2;
        }
      }
    }
  }
  return out;
}

const SYSTEM_PROPS = new Set([
  'sourceSystem', 'sourceId', 'eventTime', 'ingestTime',
  'temporalSource', 'temporalConfidence', 'version', '_uploadedAt',
  'createdAt', 'updatedAt', 'workspaceId', 'organizationId',
  'id', 'embedding', 'syncJobId',
]);

function isSystemProperty(name: string): boolean {
  return SYSTEM_PROPS.has(name) || name.startsWith('_');
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

/** Snapshot the stats as a markdown report — used by Copy + Save as note.
 *  Includes the technical details that the at-a-glance view collapses, so
 *  saved notes are a self-contained snapshot. */
function renderAsMarkdown(stats: GraphStats, ragStats: GraphRAGStats | null): string {
  const ts = new Date().toISOString();
  const lines: string[] = [];
  lines.push(`# HangarX memory stats`);
  lines.push('');
  lines.push(`_Captured ${ts}_`);
  lines.push('');
  lines.push(`- **Entities:** ${formatNumber(stats.totalEntities)}`);
  lines.push(`- **Relationships:** ${formatNumber(stats.totalRelationships)}`);
  const ratio = stats.totalEntities > 0 ? stats.totalRelationships / stats.totalEntities : 0;
  lines.push(`- **Relationships per entity:** ${ratio.toFixed(2)}`);
  lines.push(`- **Entity types:** ${stats.entityTypes.length}`);
  lines.push(`- **Relationship types:** ${stats.relationshipTypes.length}`);
  lines.push('');

  const insights = computeInsights(stats, ragStats);
  if (insights.length > 0) {
    lines.push(`## Heads up`);
    lines.push('');
    for (const i of insights) {
      lines.push(`- **${i.headline}** — ${i.detail}`);
    }
    lines.push('');
  }

  if (stats.entityTypes.length > 0) {
    lines.push(`## Entity types`);
    lines.push('');
    lines.push(`| Type | Count | Distinguishing properties |`);
    lines.push(`|---|---:|---|`);
    const sorted = stats.entityTypes.slice().sort((a, b) => b.count - a.count);
    for (const et of sorted) {
      const distinguishing = (et.sampleProperties ?? []).filter(p => !isSystemProperty(p));
      const props = distinguishing.length > 0 ? distinguishing.slice(0, 8).join(', ') : '—';
      lines.push(`| ${et.type} | ${formatNumber(et.count)} | ${props} |`);
    }
    lines.push('');
  }
  if (stats.relationshipTypes.length > 0) {
    lines.push(`## Relationship types`);
    lines.push('');
    lines.push(`| Type | Count |`);
    lines.push(`|---|---:|`);
    const sorted = stats.relationshipTypes.slice().sort((a, b) => b.count - a.count);
    for (const rt of sorted) {
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

/** FalkorDB returns array-like properties as JSON-encoded strings (e.g.
 *  `'["foo","bar"]'`) since the underlying graph engine doesn't store
 *  arrays natively. Parse cleanly, dedupe, drop empties. */
function parseStringList(input: string[] | string | undefined | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(s => typeof s === 'string' && s.length > 0);
  try {
    const parsed: unknown = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return (parsed as unknown[]).filter((s): s is string => typeof s === 'string' && s.length > 0);
    }
  } catch {
    // Fall through to comma split
  }
  return input.split(',').map(s => s.trim()).filter(Boolean);
}
