import { App, Modal, setIcon } from 'obsidian';
import { STARTER_CATALOG, type StarterPrompt } from './chat-panel';

/**
 * Browse-all-starters modal. Filterable by free-text and grouped by
 * category. Click a row to fill the chat composer (the modal calls back
 * via `onPick` and closes itself). Replaces the inline expand toggle
 * for the secondary tier.
 *
 * Performance: catalog is small (<50 items today). Filter runs in JS on
 * every keystroke without debouncing.
 */
export class StartersModal extends Modal {
  private query = '';
  private listEl!: HTMLElement;

  constructor(app: App, private onPick: (text: string) => void) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass('cortex-starters-modal');
    this.titleEl.empty();

    const head = this.titleEl.createDiv({ cls: 'cortex-starters-head' });
    head.createDiv({ cls: 'cortex-starters-title', text: 'Starter prompts' });
    head.createDiv({
      cls: 'cortex-starters-sub',
      text: 'Pick one to fill the chat composer. Type to filter.',
    });

    const search = this.contentEl.createDiv({ cls: 'cortex-starters-search' });
    const ic = search.createSpan({ cls: 'cortex-starters-search-icon' });
    setIcon(ic, 'search');
    const input = search.createEl('input', {
      cls: 'cortex-starters-search-input',
      attr: { type: 'text', placeholder: 'Search starters by name, category, or content…' },
    });
    input.addEventListener('input', () => {
      this.query = input.value.trim().toLowerCase();
      this.renderList();
    });
    activeWindow.setTimeout(() => input.focus(), 50);

    this.listEl = this.contentEl.createDiv({ cls: 'cortex-starters-list' });
    this.renderList();
  }

  onClose(): void {
    this.contentEl.empty();
    this.titleEl.empty();
  }

  private renderList(): void {
    this.listEl.empty();

    const q = this.query;
    const filtered = q
      ? STARTER_CATALOG.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.text.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        )
      : STARTER_CATALOG;

    if (filtered.length === 0) {
      this.listEl.createDiv({
        cls: 'cortex-starters-empty',
        text: `No starters match "${this.query}". Try a different keyword.`,
      });
      return;
    }

    // Group by category, preserving catalog order.
    const grouped = new Map<StarterPrompt['category'], StarterPrompt[]>();
    for (const p of filtered) {
      const arr = grouped.get(p.category) ?? [];
      arr.push(p);
      grouped.set(p.category, arr);
    }

    for (const [category, prompts] of grouped) {
      const section = this.listEl.createDiv({ cls: 'cortex-starters-section' });
      section.createDiv({ cls: 'cortex-starters-section-label', text: category });
      const grid = section.createDiv({ cls: 'cortex-starters-grid' });
      for (const p of prompts) {
        const card = grid.createDiv({
          cls: 'cortex-starters-card',
          attr: { role: 'button', tabindex: '0' },
        });
        const cardIcon = card.createSpan({ cls: 'cortex-starters-card-icon' });
        setIcon(cardIcon, p.icon);
        const body = card.createDiv({ cls: 'cortex-starters-card-body' });
        body.createDiv({
          cls: 'cortex-starters-card-label',
          text: this.highlight(p.label),
        });
        body.createDiv({
          cls: 'cortex-starters-card-text',
          text: p.text,
        });
        const pick = () => {
          this.onPick(p.text);
          this.close();
        };
        card.addEventListener('click', pick);
        card.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            pick();
          }
        });
      }
    }
  }

  /** Cheap highlight — just the label since text is too long to scan. */
  private highlight(s: string): string {
    return s;
  }
}
