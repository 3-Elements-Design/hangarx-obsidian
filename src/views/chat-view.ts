import { ItemView, WorkspaceLeaf } from 'obsidian';
import type { CortexClient } from '../cortex-client';
import type { CortexSettings } from '../settings';
import type CortexPlugin from '../main';
import { ConversationStore } from '../services/conversation-store';
import { ChatPanel } from './chat-panel';

export const CHAT_VIEW_TYPE = 'cortex-chat-view';

/**
 * Side-pane host for the "Ask your vault" chat. Opens in the right sidebar
 * (or wherever the user drags it) and stays mounted across notes — replaces
 * the per-note Related view as the default right pane for users who want
 * always-on Q&A.
 */
export class ChatView extends ItemView {
  private panel: ChatPanel | null = null;
  /** Container for the title row — mounted inside the view's body so the
   *  composer/header layout matches the modal variant. We do not reuse
   *  `containerEl.children[0]` (Obsidian's tab title) because the chat title
   *  carries action buttons. */
  private titleHostEl!: HTMLElement;

  constructor(
    leaf: WorkspaceLeaf,
    private client: CortexClient,
    private store: ConversationStore,
    private settings: CortexSettings,
    private plugin: CortexPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string { return CHAT_VIEW_TYPE; }
  getDisplayText(): string { return 'HangarX: Ask your vault'; }
  getIcon(): string { return 'message-circle'; }

  async onOpen(): Promise<void> {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass('cortex-chat-view');

    this.titleHostEl = root.createDiv({ cls: 'cortex-chat-view-title' });
    const body = root.createDiv({ cls: 'cortex-chat-view-body' });

    this.panel = new ChatPanel(this.app, this.client, this.store, this.settings, {
      titleEl: this.titleHostEl,
      contentEl: body,
      parentEl: root,
      onNavigate: () => {
        // Side panel stays mounted when the user clicks an entity / citation
        // / inline link. Note opens in the main pane.
      },
      saveSettings: () => this.plugin.saveSettings(),
    });
    this.panel.mount();
  }

  async onClose(): Promise<void> {
    this.panel?.dispose();
    this.panel = null;
  }

  /** Programmatic prefill — used by Memory Stats drill-in actions. */
  prefill(text: string): void {
    this.panel?.prefill(text);
  }
}
