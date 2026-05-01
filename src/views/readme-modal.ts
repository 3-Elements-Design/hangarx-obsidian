import { App, Modal, MarkdownRenderer, Component, setIcon } from 'obsidian';
import readmeContent from '../../README.md';

/**
 * In-app README viewer. The README is bundled at build time via esbuild's
 * text loader (--loader:.md=text), so the markdown ships inside main.js and
 * renders without filesystem access. Lets users read the full plugin guide
 * — quick start, agent setup, troubleshooting — without leaving Obsidian.
 */
export class ReadmeModal extends Modal {
  private renderComponent = new Component();

  constructor(app: App) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.modalEl.addClass('cortex-readme-modal');
    this.titleEl.empty();
    const title = this.titleEl.createEl('div', { cls: 'cortex-readme-title' });
    title.createEl('span', { text: 'HangarX — Documentation' });

    const actions = title.createEl('div', { cls: 'cortex-readme-title-actions' });
    const externalBtn = actions.createEl('button', {
      cls: 'cortex-readme-iconbtn',
      attr: { 'aria-label': 'Open online docs' },
    });
    setIcon(externalBtn, 'external-link');
    externalBtn.addEventListener('click', () => {
      window.open('https://app.hangarx.ai/obsidian', '_blank');
    });

    const body = this.contentEl.createDiv({ cls: 'cortex-readme-body markdown-rendered' });
    this.renderComponent.load();
    await MarkdownRenderer.render(this.app, readmeContent as string, body, '', this.renderComponent);

    body.querySelectorAll('a[href]').forEach(el => {
      const a = el as HTMLAnchorElement;
      const href = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    });
  }

  onClose(): void {
    this.renderComponent.unload();
    this.contentEl.empty();
  }
}
