import { ItemView, WorkspaceLeaf, TFile, MarkdownView, setIcon } from 'obsidian';
import type { CortexClient, RelatedNote, GraphPath } from '../cortex-client';

export const RELATED_VIEW_TYPE = 'cortex-related-view';

export class RelatedView extends ItemView {
  private currentFile: TFile | null = null;
  private currentEntityId: string | null = null;
  private listEl: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, private client: CortexClient) {
    super(leaf);
  }

  getViewType(): string { return RELATED_VIEW_TYPE; }
  getDisplayText(): string { return 'Related notes'; }
  getIcon(): string { return 'network'; }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('cortex-related-container');
    container.createEl('h4', { text: 'Related notes' });
    this.listEl = container.createDiv({ cls: 'cortex-related-list' });

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => this.refresh()),
    );
    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.listEl) return;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      this.currentFile = null;
      this.currentEntityId = null;
      this.listEl.empty();
      this.listEl.createEl('p', {
        text: 'Open a note to see related results.',
        cls: 'cortex-empty-state',
      });
      return;
    }
    if (this.currentFile?.path === view.file.path) return;
    this.currentFile = view.file;
    this.currentEntityId = null;

    this.listEl.empty();
    this.listEl.createEl('p', { text: 'Loading…', cls: 'cortex-loading' });

    try {
      const results = await this.client.related(view.file.basename, 10);
      this.listEl.empty();
      if (results.length === 0) {
        this.listEl.createEl('p', { text: 'No related notes found.', cls: 'cortex-empty-state' });
        return;
      }
      for (const r of results) this.renderResult(r);
    } catch (e) {
      this.listEl.empty();
      this.listEl.createEl('p', { text: `Error: ${(e as Error).message}`, cls: 'cortex-error' });
    }
  }

  private renderResult(r: RelatedNote): void {
    if (!this.listEl) return;
    const row = this.listEl.createDiv({ cls: 'cortex-related-row' });

    const header = row.createDiv({ cls: 'cortex-related-header' });
    const link = header.createEl('a', {
      text: r.noteName,
      cls: `cortex-related-link cortex-source-${r.source}`,
    });
    link.addEventListener('click', evt => {
      evt.preventDefault();
      const target = this.app.metadataCache.getFirstLinkpathDest(r.noteName, '');
      if (target) void this.app.workspace.getLeaf(false).openFile(target);
    });

    const sourceBadge = header.createSpan({
      text: r.source,
      cls: `cortex-related-badge cortex-source-${r.source}`,
    });
    sourceBadge.setAttr('title', `Match source: ${r.source}`);

    const score = header.createSpan({ text: r.score.toFixed(2), cls: 'cortex-related-score' });
    score.setAttr('title', 'Relevance score');

    if (r.snippet) row.createEl('p', { text: r.snippet, cls: 'cortex-snippet' });

    if (r.entityId) {
      const whyBtn = row.createEl('button', { cls: 'cortex-why-btn' });
      const icon = whyBtn.createSpan({ cls: 'cortex-why-icon' });
      setIcon(icon, 'route');
      whyBtn.createSpan({ text: 'Why are these related?' });
      const pathEl = row.createDiv({ cls: 'cortex-paths', attr: { 'aria-hidden': 'true' } });
      pathEl.addClass('is-hidden');

      whyBtn.addEventListener('click', () => { void this.togglePath(r, whyBtn, pathEl); });
    }
  }

  private async togglePath(r: RelatedNote, btn: HTMLButtonElement, pathEl: HTMLElement): Promise<void> {
    const isOpen = !pathEl.classList.contains('is-hidden');
    if (isOpen) {
      pathEl.addClass('is-hidden');
      pathEl.setAttr('aria-hidden', 'true');
      return;
    }
    pathEl.removeClass('is-hidden');
    pathEl.setAttr('aria-hidden', 'false');

    if (pathEl.dataset.loaded === '1') return;
    pathEl.empty();
    pathEl.createSpan({ text: 'Tracing graph paths…', cls: 'cortex-loading' });

    try {
      const sourceId = await this.resolveSelfEntityId();
      if (!sourceId || !r.entityId) {
        pathEl.empty();
        pathEl.createSpan({ text: 'Cannot resolve graph anchor for this note.', cls: 'cortex-error' });
        return;
      }
      const paths = await this.client.findPaths(sourceId, r.entityId, 4);
      pathEl.empty();
      if (paths.length === 0) {
        pathEl.createSpan({ text: 'No direct path found in the graph.', cls: 'cortex-empty-state' });
      } else {
        for (const p of paths.slice(0, 3)) this.renderPath(pathEl, p);
      }
      pathEl.dataset.loaded = '1';
      btn.addClass('is-open');
    } catch (e) {
      pathEl.empty();
      pathEl.createSpan({ text: `Error: ${(e as Error).message}`, cls: 'cortex-error' });
    }
  }

  private renderPath(parent: HTMLElement, path: GraphPath): void {
    const wrap = parent.createDiv({ cls: 'cortex-path' });
    if (path.steps.length === 0) {
      wrap.createSpan({ text: 'Direct match.', cls: 'cortex-empty-state' });
      return;
    }
    // Render: [Node] —REL→ [Node] —REL→ [Node]
    wrap.createSpan({ text: path.steps[0].fromName, cls: 'cortex-path-node' });
    for (const s of path.steps) {
      wrap.createSpan({ text: ` —${humanRel(s.relType)}→ `, cls: 'cortex-path-rel' });
      wrap.createSpan({ text: s.toName, cls: 'cortex-path-node' });
    }
  }

  /** Resolve the entity ID for the currently-open note. Cached per refresh. */
  private async resolveSelfEntityId(): Promise<string> {
    if (this.currentEntityId) return this.currentEntityId;
    if (!this.currentFile) return '';
    // Fast path: graph-pulled notes have cortex_id in their frontmatter.
    const fmId = this.app.metadataCache.getFileCache(this.currentFile)?.frontmatter?.cortex_id;
    if (typeof fmId === 'string' && fmId.length > 0) {
      this.currentEntityId = fmId;
      return fmId;
    }
    const name = this.currentFile.basename;
    const hits = await this.client.searchEntitiesByName(name, 5);
    const exact = hits.find(h => h.name === name) ?? hits[0];
    this.currentEntityId = exact?.id ?? '';
    return this.currentEntityId;
  }
}

function humanRel(rel: string): string {
  return rel.replace(/_/g, ' ').toLowerCase();
}
