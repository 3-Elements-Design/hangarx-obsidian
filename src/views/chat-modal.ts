import { App, Modal } from 'obsidian';
import type { CortexClient } from '../cortex-client';
import type { CortexSettings } from '../settings';
import type CortexPlugin from '../main';
import { ConversationStore } from '../services/conversation-store';
import { ChatPanel } from './chat-panel';

/**
 * Modal host for the chat UI. The actual chat logic lives in ChatPanel so the
 * same surface can render in a side-pane ItemView (see chat-view.ts) — this
 * class just wires Obsidian's Modal lifecycle through to it.
 */
export class ChatModal extends Modal {
  private panel: ChatPanel | null = null;

  constructor(
    app: App,
    private client: CortexClient,
    private store: ConversationStore,
    private settings: CortexSettings,
    private plugin: CortexPlugin,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass('cortex-chat-modal');
    this.panel = new ChatPanel(this.app, this.client, this.store, this.settings, {
      titleEl: this.titleEl,
      contentEl: this.contentEl,
      parentEl: this.contentEl,
      onNavigate: () => this.close(),
      saveSettings: () => this.plugin.saveSettings(),
    });
    this.panel.mount();
  }

  onClose(): void {
    this.panel?.dispose();
    this.panel = null;
  }
}
