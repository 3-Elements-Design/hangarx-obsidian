import { App, Notice, MarkdownRenderer, Component, setIcon, requestUrl } from 'obsidian';
import type { CortexClient, AskResponse, AskEntity, AskDocument, AskCitation } from '../cortex-client';
import type { CortexSettings } from '../settings';
import {
  ConversationStore,
  ChatConversation,
  ChatTurn,
  deriveConversationTitle,
  relativeTime,
} from '../services/conversation-store';
import { writeSingleAnswerNote, writeConversationNote } from '../services/vault-writer';
import { formatError, errorIcon } from '../services/error-format';
import { HANGARX_LOGO_SVG } from '../assets';

const SUGGESTED_PROMPTS = [
  {
    icon: 'history',
    label: 'Catch me up',
    text: 'Summarize what I\'ve been working on this week. Group by project, highlight key decisions, and call out anything still open.',
  },
  {
    icon: 'route',
    label: 'Trace connections',
    text: 'Find two ideas in my recent notes that seem unrelated but are actually connected through other concepts. Walk me through the path between them.',
  },
  {
    icon: 'lightbulb',
    label: 'Surface decisions',
    text: 'What important decisions have I documented in the last month? For each one, give me the decision, the reasoning behind it, and any open questions left unanswered.',
  },
  {
    icon: 'search',
    label: 'Find blind spots',
    text: 'What topics or entities appear frequently across my notes but don\'t have a dedicated note explaining them? Suggest 3-5 candidates worth writing up as MOC (map-of-content) notes.',
  },
];

interface ChatAttachment {
  name: string;
  size: number;
  content: string;
}

const MAX_ATTACHMENT_CHARS = 100_000;
const TEXT_EXTENSIONS = new Set([
  'md', 'markdown', 'txt', 'text', 'rst', 'org',
  'json', 'yaml', 'yml', 'toml', 'ini', 'env', 'csv', 'tsv',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift',
  'c', 'cc', 'cpp', 'h', 'hpp', 'cs',
  'sh', 'bash', 'zsh', 'fish',
  'html', 'css', 'scss', 'sass', 'less',
  'xml', 'svg',
  'sql', 'graphql', 'gql',
  'log',
]);

/**
 * Host the panel mounts into. Different surfaces (Modal, ItemView) implement
 * this so the same chat UI can render in either.
 *
 *  - `titleEl` / `contentEl`: where the panel renders its DOM.
 *  - `onNavigate`: invoked when the user clicks something that takes them out
 *     of the chat (an entity chip, a citation, an inline link). Modal hosts
 *     close themselves; ItemView hosts no-op so the panel stays mounted.
 *  - `parentEl`: optional element used as the positioning context for the
 *     history popover. Falls back to `contentEl`.
 */
export interface ChatPanelHost {
  titleEl: HTMLElement;
  contentEl: HTMLElement;
  parentEl?: HTMLElement;
  onNavigate: () => void;
}

/**
 * Standalone chat controller — extracted from the original ChatModal so the
 * same UI can be hosted in a Modal *or* a side-pane ItemView.
 *
 * Responsibilities: render empty state + composer, submit questions, render AI
 * responses with entities/documents/citations/follow-ups, persist conversations
 * via ConversationStore, handle inline file attachments and the history
 * popover, and clean up its rendering Component on dispose.
 */
export class ChatPanel {
  private host: ChatPanelHost;
  private renderComponent = new Component();

  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLElement;
  private askBtn!: HTMLButtonElement;
  private newChatBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private historyBtn!: HTMLButtonElement;
  private historyPopover: HTMLElement | null = null;

  private sessionId: string;
  private hasMessages = false;
  private currentTurns: ChatTurn[] = [];
  private currentTitle = '';
  private currentCreatedAt = 0;
  private allEntities: AskEntity[] = [];
  private allCitations: AskCitation[] = [];

  private pendingAttachments: ChatAttachment[] = [];
  private attachBtn!: HTMLButtonElement;
  private attachmentsEl!: HTMLElement;
  private fileInputEl!: HTMLInputElement;

  private statusPillEl: HTMLElement | null = null;
  private statusPollTimer: number | null = null;

  constructor(
    private app: App,
    private client: CortexClient,
    private store: ConversationStore,
    private settings: CortexSettings,
    host: ChatPanelHost,
  ) {
    this.host = host;
    this.sessionId = crypto.randomUUID();
  }

  mount(): void {
    this.renderComponent.load();
    const { titleEl, contentEl } = this.host;

    titleEl.empty();
    const title = titleEl.createEl('div', { cls: 'cortex-chat-title' });
    title.createEl('span', { cls: 'cortex-chat-title-text', text: 'Ask your vault' });
    this.statusPillEl = title.createEl('span', { cls: 'cortex-chat-mode-pill' });
    this.renderModePill('checking');
    void this.runModeProbe();
    const actions = title.createEl('div', { cls: 'cortex-chat-title-actions' });

    this.historyBtn = actions.createEl('button', { cls: 'cortex-chat-iconbtn', attr: { 'aria-label': 'Conversation history' } });
    setIcon(this.historyBtn, 'history');
    this.historyBtn.addEventListener('click', evt => {
      evt.stopPropagation();
      this.toggleHistoryPopover();
    });

    this.newChatBtn = actions.createEl('button', { cls: 'cortex-chat-iconbtn', attr: { 'aria-label': 'New chat' } });
    setIcon(this.newChatBtn, 'plus');
    this.newChatBtn.addEventListener('click', () => this.resetConversation());

    this.exportBtn = actions.createEl('button', { cls: 'cortex-chat-iconbtn', attr: { 'aria-label': 'Export conversation to note' } });
    setIcon(this.exportBtn, 'file-down');
    this.exportBtn.addEventListener('click', () => this.exportConversation());
    this.exportBtn.style.display = 'none';

    this.outputEl = contentEl.createEl('div', { cls: 'cortex-chat-output' });
    this.renderEmptyState();

    const composerWrap = contentEl.createEl('div', { cls: 'cortex-chat-composer-wrap' });
    this.attachmentsEl = composerWrap.createEl('div', { cls: 'cortex-chat-attachments is-empty' });
    const composer = composerWrap.createEl('div', { cls: 'cortex-chat-composer' });

    this.attachBtn = composer.createEl('button', {
      cls: 'cortex-chat-attach',
      attr: { 'aria-label': 'Attach file (text only, ephemeral)', type: 'button' },
    });
    setIcon(this.attachBtn, 'paperclip');
    this.fileInputEl = composer.createEl('input', {
      cls: 'cortex-chat-file-input',
      attr: { type: 'file', multiple: 'true', style: 'display:none' },
    });
    this.attachBtn.addEventListener('click', () => this.fileInputEl.click());
    this.fileInputEl.addEventListener('change', () => {
      const files = Array.from(this.fileInputEl.files ?? []);
      void this.handleAttachedFiles(files);
      this.fileInputEl.value = '';
    });

    this.inputEl = composer.createEl('textarea', {
      cls: 'cortex-chat-input',
      attr: { rows: '1', placeholder: 'Ask anything about your vault…' },
    });
    this.askBtn = composer.createEl('button', { cls: 'cortex-chat-send', attr: { 'aria-label': 'Send', disabled: 'true' } });
    setIcon(this.askBtn, 'arrow-up');
    this.askBtn.addEventListener('click', () => this.submit());

    composerWrap.addEventListener('dragover', evt => {
      evt.preventDefault();
      composerWrap.addClass('is-drag-target');
    });
    composerWrap.addEventListener('dragleave', () => composerWrap.removeClass('is-drag-target'));
    composerWrap.addEventListener('drop', evt => {
      evt.preventDefault();
      composerWrap.removeClass('is-drag-target');
      const files = Array.from(evt.dataTransfer?.files ?? []);
      if (files.length > 0) void this.handleAttachedFiles(files);
    });

    const hint = composerWrap.createEl('div', { cls: 'cortex-chat-hint' });
    hint.createEl('span', { text: '↵ to send · ⇧↵ for newline · Esc (empty input) for new chat' });

    this.inputEl.addEventListener('input', () => {
      this.autoResize();
      this.askBtn.toggleAttribute('disabled', this.inputEl.value.trim().length === 0);
    });
    this.inputEl.addEventListener('keydown', evt => {
      // Enter submits; Shift+Enter falls through to insert a newline.
      // ⌘↵ / Ctrl+↵ kept as a fallback for muscle memory.
      if (evt.key === 'Enter' && !evt.shiftKey && !evt.isComposing) {
        evt.preventDefault();
        this.submit();
      } else if (evt.key === 'Escape' && this.inputEl.value.length === 0 && this.hasMessages) {
        // Single-key new-chat: Esc when the textarea is empty and there's an
        // active conversation. The empty-input guard means users mid-typing
        // aren't surprised — they have to commit to clearing first.
        evt.preventDefault();
        this.resetConversation();
      }
    });
    this.inputEl.focus();
  }

  /** Called when the host (Modal/ItemView) tears down. Persists, unloads, clears DOM. */
  dispose(): void {
    document.removeEventListener('mousedown', this.onOutsideClick, true);
    if (this.statusPollTimer != null) {
      window.clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
    if (this.settings.autoSaveChatToVault && this.currentTurns.length > 0) {
      writeConversationNote(this.app, this.settings.chatExportFolder, {
        title: this.currentTitle || 'Untitled Chat',
        turns: this.currentTurns.map(t => ({ role: t.role, content: t.content })),
        entities: this.allEntities.map(e => e.name),
        citations: this.allCitations,
        createdAt: this.currentCreatedAt || Date.now(),
      }).catch(e => console.warn('[Cortex] Auto-save chat note failed:', e));
    }
    this.renderComponent.unload();
    this.host.contentEl.empty();
    this.host.titleEl.empty();
  }

  /** Programmatic prefill — used when activating the panel via a command. */
  prefill(text: string): void {
    if (!this.inputEl) return;
    this.populateInput(text);
  }

  private renderEmptyState(): void {
    const empty = this.outputEl.createEl('div', { cls: 'cortex-chat-empty' });
    const logo = empty.createEl('div', { cls: 'cortex-chat-empty-logo' });
    logo.innerHTML = HANGARX_LOGO_SVG;
    empty.createEl('h2', { cls: 'cortex-chat-empty-title', text: 'Ask your vault anything.' });
    empty.createEl('p', {
      cls: 'cortex-chat-empty-sub',
      text: 'Multi-hop search across your notes — cited, remembered, and shared with every AI agent on your machine.',
    });

    const grid = empty.createEl('div', { cls: 'cortex-chat-suggestions' });
    for (const s of SUGGESTED_PROMPTS) {
      const card = grid.createEl('div', {
        cls: 'cortex-chat-suggestion',
        attr: { role: 'button', tabindex: '0' },
      });
      const ic = card.createEl('span', { cls: 'cortex-chat-suggestion-icon' });
      setIcon(ic, s.icon);
      const body = card.createEl('div', { cls: 'cortex-chat-suggestion-body' });
      body.createEl('div', { cls: 'cortex-chat-suggestion-label', text: s.label });
      body.createEl('div', { cls: 'cortex-chat-suggestion-text', text: s.text });
      const fill = () => this.populateInput(s.text);
      card.addEventListener('click', fill);
      card.addEventListener('keydown', evt => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          fill();
        }
      });
    }

  }


  private autoResize(): void {
    this.inputEl.style.height = 'auto';
    this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 200)}px`;
  }

  private resetConversation(): void {
    this.sessionId = crypto.randomUUID();
    this.hasMessages = false;
    this.currentTurns = [];
    this.currentTitle = '';
    this.currentCreatedAt = 0;
    this.allEntities = [];
    this.allCitations = [];
    this.pendingAttachments = [];
    if (this.attachmentsEl) this.renderAttachmentChips();
    this.outputEl.empty();
    this.renderEmptyState();
    this.inputEl.value = '';
    this.autoResize();
    this.askBtn.setAttr('disabled', 'true');
    this.exportBtn.style.display = 'none';
    this.closeHistoryPopover();
    this.inputEl.focus();
  }

  private toggleHistoryPopover(): void {
    if (this.historyPopover) { this.closeHistoryPopover(); return; }
    void this.openHistoryPopover();
  }

  private async openHistoryPopover(): Promise<void> {
    const parent = this.host.parentEl ?? this.host.contentEl;
    const popover = parent.createEl('div', { cls: 'cortex-chat-history-popover' });
    this.historyPopover = popover;
    popover.createEl('div', { cls: 'cortex-chat-history-header', text: 'Past conversations' });
    const listEl = popover.createEl('div', { cls: 'cortex-chat-history-list' });
    listEl.createEl('div', { cls: 'cortex-chat-history-empty', text: 'Loading…' });

    setTimeout(() => {
      document.addEventListener('mousedown', this.onOutsideClick, true);
    }, 0);

    try {
      const conversations = await this.store.list();
      listEl.empty();
      if (conversations.length === 0) {
        listEl.createEl('div', { cls: 'cortex-chat-history-empty', text: 'No past conversations yet.' });
        return;
      }
      for (const c of conversations) this.renderHistoryRow(listEl, c);
    } catch (e) {
      listEl.empty();
      listEl.createEl('div', { cls: 'cortex-chat-history-empty', text: `Error: ${(e as Error).message}` });
    }
  }

  private onOutsideClick = (evt: MouseEvent): void => {
    if (!this.historyPopover) return;
    const target = evt.target as Node;
    if (this.historyPopover.contains(target) || this.historyBtn.contains(target)) return;
    this.closeHistoryPopover();
  };

  private closeHistoryPopover(): void {
    document.removeEventListener('mousedown', this.onOutsideClick, true);
    this.historyPopover?.remove();
    this.historyPopover = null;
  }

  private renderHistoryRow(parent: HTMLElement, c: ChatConversation): void {
    const row = parent.createEl('div', { cls: 'cortex-chat-history-row' });
    if (c.id === this.sessionId) row.addClass('is-active');

    const main = row.createEl('div', { cls: 'cortex-chat-history-main' });
    main.createEl('div', { cls: 'cortex-chat-history-title', text: c.title || '(untitled)' });
    const meta = main.createEl('div', { cls: 'cortex-chat-history-meta' });
    meta.createEl('span', { text: relativeTime(c.updatedAt) });
    meta.createEl('span', { cls: 'cortex-chat-history-dot', text: '·' });
    const turnCount = c.turns.filter(t => t.role === 'user').length;
    meta.createEl('span', { text: `${turnCount} message${turnCount === 1 ? '' : 's'}` });
    main.addEventListener('click', () => this.loadConversation(c));

    const del = row.createEl('button', { cls: 'cortex-chat-history-del', attr: { 'aria-label': 'Delete conversation' } });
    setIcon(del, 'trash-2');
    del.addEventListener('click', async evt => {
      evt.stopPropagation();
      await this.store.delete(c.id);
      row.remove();
      if (c.id === this.sessionId) this.resetConversation();
    });
  }

  private async loadConversation(c: ChatConversation): Promise<void> {
    this.closeHistoryPopover();
    this.sessionId = c.id;
    this.currentTurns = [...c.turns];
    this.currentTitle = c.title;
    this.currentCreatedAt = c.createdAt;
    this.hasMessages = c.turns.length > 0;

    this.outputEl.empty();
    for (const t of c.turns) {
      if (t.role === 'user') this.renderUserTurn(t.content);
      else this.renderAiTurnFromPayload(t.content, t.payload as AskResponse | undefined);
    }
    this.scrollToBottom();
    this.inputEl.focus();
  }

  private renderUserTurn(text: string, attachmentSummary?: string): void {
    const userTurn = this.outputEl.createEl('div', { cls: 'cortex-chat-turn cortex-chat-user' });
    const userBubble = userTurn.createEl('div', { cls: 'cortex-chat-bubble' });
    userBubble.createEl('div', { cls: 'cortex-chat-role', text: 'You' });
    userBubble.createEl('div', { cls: 'cortex-chat-content', text });
    if (attachmentSummary) {
      userBubble.createEl('div', {
        cls: 'cortex-chat-content-attachment',
        text: attachmentSummary,
      });
    }
  }

  private renderAiTurnFromPayload(answer: string, payload: AskResponse | undefined): void {
    const aiTurn = this.outputEl.createEl('div', { cls: 'cortex-chat-turn cortex-chat-ai' });
    const aiBubble = aiTurn.createEl('div', { cls: 'cortex-chat-bubble' });
    aiBubble.createEl('div', { cls: 'cortex-chat-role', text: 'HangarX' });
    const bodyEl = aiBubble.createEl('div', { cls: 'cortex-chat-body' });
    if (payload) void this.renderResponse(bodyEl, payload);
    else bodyEl.createEl('div', { cls: 'cortex-chat-answer', text: answer });
    this.renderTurnActions(aiBubble, answer, payload);
  }

  private async persistConversation(): Promise<void> {
    if (this.currentTurns.length === 0) return;
    if (this.currentCreatedAt === 0) this.currentCreatedAt = Date.now();
    if (!this.currentTitle) {
      const firstUser = this.currentTurns.find(t => t.role === 'user');
      this.currentTitle = firstUser ? deriveConversationTitle(firstUser.content) : '(untitled)';
    }
    const conversation: ChatConversation = {
      id: this.sessionId,
      title: this.currentTitle,
      createdAt: this.currentCreatedAt,
      updatedAt: Date.now(),
      turns: this.currentTurns,
    };
    await this.store.upsert(conversation).catch(e => console.warn('[Cortex] Save chat failed:', e));
  }

  private async submit(): Promise<void> {
    const query = this.inputEl.value.trim();
    if (!query) return;
    this.inputEl.value = '';
    this.autoResize();
    this.askBtn.setAttr('disabled', 'true');
    this.hasMessages = true;

    const emptyState = this.outputEl.querySelector('.cortex-chat-empty');
    emptyState?.remove();

    const urlRegex = /^https?:\/\/\S+$/i;
    if (urlRegex.test(query)) {
      this.renderUserTurn(query);
      this.currentTurns.push({ role: 'user', content: query });
      const aiTurn = this.outputEl.createEl('div', { cls: 'cortex-chat-turn cortex-chat-ai' });
      const aiBubble = aiTurn.createEl('div', { cls: 'cortex-chat-bubble' });
      aiBubble.createEl('div', { cls: 'cortex-chat-role', text: 'HangarX' });
      const bodyEl = aiBubble.createEl('div', { cls: 'cortex-chat-body' });
      const thinkingEl = bodyEl.createEl('div', { cls: 'cortex-chat-thinking', text: 'Ingesting URL…' });
      this.scrollToBottom();
      try {
        const result = await this.client.ingestUrl(query);
        thinkingEl.remove();
        const msg = `✅ Ingested **${query}** into your knowledge graph. ${result.entityCount ? `Extracted ${result.entityCount} entities.` : ''}`;
        const answerEl = bodyEl.createEl('div', { cls: 'cortex-chat-answer' });
        await MarkdownRenderer.render(this.app, msg, answerEl, '', this.renderComponent);
        this.currentTurns.push({ role: 'ai', content: msg });
        this.exportBtn.style.display = '';
        void this.persistConversation();
      } catch (e) {
        thinkingEl.remove();
        this.renderErrorCard(bodyEl, e, "Couldn't ingest URL", () => {
          this.inputEl.value = query;
          void this.submit();
        });
      }
      this.scrollToBottom();
      return;
    }

    const { promptText, displayText, attachmentSummary } = this.buildAugmentedQuery(query);
    this.pendingAttachments = [];
    this.renderAttachmentChips();

    this.renderUserTurn(displayText, attachmentSummary || undefined);
    this.currentTurns.push({ role: 'user', content: displayText });

    const aiTurn = this.outputEl.createEl('div', { cls: 'cortex-chat-turn cortex-chat-ai' });
    const aiBubble = aiTurn.createEl('div', { cls: 'cortex-chat-bubble' });
    aiBubble.createEl('div', { cls: 'cortex-chat-role', text: 'HangarX' });
    const bodyEl = aiBubble.createEl('div', { cls: 'cortex-chat-body' });
    const thinkingEl = bodyEl.createEl('div', { cls: 'cortex-chat-thinking', text: 'Thinking…' });

    this.scrollToBottom();

    try {
      const recalled = await this.client.recall(query, 5).catch(() => []);
      const prefix = recalled.length > 0
        ? `Relevant prior context (from past sessions):\n${recalled.map(m => `- ${m.content}`).join('\n')}\n\nQuestion: `
        : '';
      const res = await this.client.ask(prefix + promptText, this.sessionId);
      thinkingEl.remove();
      await this.renderResponse(bodyEl, res);
      if (recalled.length > 0) this.renderRecalledMemories(bodyEl, recalled.length);

      if (res.entities?.length) this.allEntities.push(...res.entities);
      if (res.citations?.length) this.allCitations.push(...res.citations);

      this.renderTurnActions(aiBubble, res.answer, res);

      this.currentTurns.push({ role: 'ai', content: res.answer, payload: res });
      this.exportBtn.style.display = '';
      void this.persistConversation();

      if (this.settings.autoSaveChatToVault) {
        void this.client.remember(`Q: ${query}\nA: ${res.answer.slice(0, 800)}`, 'conversation').catch(() => {});
      }
    } catch (e) {
      thinkingEl.remove();
      this.renderErrorCard(bodyEl, e, "Couldn't answer your question", () => {
        aiTurn.remove();
        this.currentTurns.pop();
        this.inputEl.value = query;
        void this.submit();
      });
    } finally {
      if (this.inputEl.value.trim().length > 0) this.askBtn.removeAttribute('disabled');
      this.scrollToBottom();
    }
  }

  private async renderResponse(parent: HTMLElement, res: AskResponse): Promise<void> {
    if (res.confidence > 0) {
      const meta = parent.createEl('div', { cls: 'cortex-chat-meta' });
      const conf = meta.createEl('span', { cls: 'cortex-chat-pill cortex-chat-pill-confidence' });
      conf.setText(`${Math.round(res.confidence * 100)}% confidence`);
    }

    const answerEl = parent.createEl('div', { cls: 'cortex-chat-answer' });
    const answerText = res.answer?.trim() || '_No answer returned._';
    await MarkdownRenderer.render(this.app, answerText, answerEl, '', this.renderComponent);

    // Low-confidence answers are usually empty-retrieval, not LLM refusal.
    // Show the per-source counts inline so users can tell *why* — and prompt
    // the rebuild command when communities/chunks are zero. Threshold is 0.4
    // because the orchestrator's "we don't have data" path lands around 10–30%.
    if (res.confidence > 0 && res.confidence < 0.4) {
      this.renderRetrievalDiagnostic(parent, res);
    }

    if (res.entities.length > 0) this.renderEntities(parent, res.entities);
    if (res.documents.length > 0) this.renderDocuments(parent, res.documents);
    if (res.citations.length > 0) this.renderCitations(parent, res.citations);
    if (res.followUps.length > 0) this.renderFollowUps(parent, res.followUps);

    this.linkifyEntities(answerEl, res.entities);
  }

  /**
   * Render a one-line retrieval-source breakdown when confidence is low. The
   * server returns `meta.retrieval = { entities, chunks, communities, ... }`.
   * Reads the same field via the AskResponse `metadata` pass-through. If the
   * server didn't return retrieval counts (older build), this is a no-op.
   */
  private renderRetrievalDiagnostic(parent: HTMLElement, res: AskResponse): void {
    const retrieval = (res.metadata as Record<string, unknown> | undefined)?.retrieval as
      | { entities?: number; chunks?: number; communities?: number; analytics?: number; memories?: number }
      | undefined;
    if (!retrieval) return;

    const wrap = parent.createEl('div', { cls: 'cortex-chat-retrieval-diag' });
    wrap.createEl('div', {
      cls: 'cortex-chat-retrieval-diag-title',
      text: 'Why is confidence low?',
    });

    const counts = wrap.createEl('div', { cls: 'cortex-chat-retrieval-diag-counts' });
    const entries: Array<[string, number]> = [
      ['entities', retrieval.entities ?? 0],
      ['chunks', retrieval.chunks ?? 0],
      ['communities', retrieval.communities ?? 0],
      ['analytics', retrieval.analytics ?? 0],
      ['memories', retrieval.memories ?? 0],
    ];
    for (const [name, count] of entries) {
      const pill = counts.createEl('span', { cls: 'cortex-chat-retrieval-pill' });
      if (count === 0) pill.addClass('is-empty');
      pill.createEl('span', { cls: 'cortex-chat-retrieval-pill-name', text: name });
      pill.createEl('span', { cls: 'cortex-chat-retrieval-pill-count', text: String(count) });
    }

    // Tailored hint — the most common failure mode is empty communities after
    // a fast-mode reingest. Surface that fix prominently.
    const hint = wrap.createEl('div', { cls: 'cortex-chat-retrieval-diag-hint' });
    if ((retrieval.communities ?? 0) === 0 && (retrieval.entities ?? 0) > 0) {
      hint.createEl('span', {
        text: 'Community-summary retrieval is empty — broad questions like "themes" need it. ',
      });
      const a = hint.createEl('a', {
        cls: 'cortex-chat-retrieval-diag-action',
        text: 'Rebuild communities + reindex',
        href: '#',
      });
      a.addEventListener('click', evt => {
        evt.preventDefault();
        // Trigger the same Cmd-P command via the public command API.
        (this.app as unknown as {
          commands: { executeCommandById(id: string): boolean };
        }).commands.executeCommandById('hangarx-obsidian:cortex-1c-rebuild-graph');
      });
    } else if ((retrieval.entities ?? 0) === 0 && (retrieval.chunks ?? 0) === 0) {
      hint.createEl('span', {
        text: 'No graph content matched this query. The vault may not be synced — try ',
      });
      const a = hint.createEl('a', {
        cls: 'cortex-chat-retrieval-diag-action',
        text: 'Force re-ingest entire vault',
        href: '#',
      });
      a.addEventListener('click', evt => {
        evt.preventDefault();
        (this.app as unknown as {
          commands: { executeCommandById(id: string): boolean };
        }).commands.executeCommandById('hangarx-obsidian:cortex-1b-resync-all');
      });
      hint.appendText('.');
    } else {
      hint.createEl('span', {
        text: 'Retrieval found content but the model wasn\'t confident. Try rephrasing to mention specific entities or note titles.',
      });
    }
  }

  private renderEntities(parent: HTMLElement, entities: AskEntity[]): void {
    // Section is collapsed by default — entities/sources lists are reference
    // detail, not the primary answer. Users expand when they want to drill in.
    const section = this.collapsibleSection(parent, `Entities (${entities.length})`, false);
    const grid = section.createEl('div', { cls: 'cortex-chat-entities' });
    const byType = new Map<string, AskEntity[]>();
    for (const e of entities) {
      const arr = byType.get(e.type) ?? [];
      arr.push(e);
      byType.set(e.type, arr);
    }
    for (const [type, list] of byType) {
      const group = grid.createEl('div', { cls: 'cortex-chat-entity-group' });
      group.createEl('div', { cls: 'cortex-chat-entity-type', text: type });
      const chips = group.createEl('div', { cls: 'cortex-chat-chips' });
      for (const e of list) {
        // Pre-resolve so we know whether to render the chip as a real link
        // (clickable, opens the file) or a non-link badge (file isn't in
        // vault yet — chips that did nothing on click felt broken).
        const target = this.resolveEntityToFile(e);
        const chip = chips.createEl('a', {
          cls: target ? 'cortex-chat-chip is-linked' : 'cortex-chat-chip',
          text: prettifyEntityName(e.name),
          href: '#',
        });
        const titleParts: string[] = [];
        if (e.description) titleParts.push(e.description);
        if (e.name !== prettifyEntityName(e.name)) titleParts.push(`id: ${e.name}`);
        if (!target) titleParts.push('Not in vault yet — run a graph pull to materialize.');
        if (titleParts.length) chip.setAttr('title', titleParts.join('\n'));
        chip.addEventListener('click', evt => {
          evt.preventDefault();
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          } else {
            new Notice(`"${prettifyEntityName(e.name)}" isn't a file in this vault yet. Pull the graph from settings to materialize it.`);
          }
        });
      }
    }
  }

  /**
   * Try several name variants to find the entity's vault file. The chat
   * returns names in different forms depending on how the entity was
   * extracted; graph-pull writes them as `<name> (<type>).md`. Try the
   * raw name first, then strip any trailing "(Type)" suffix the chat may
   * have appended, then add one if missing — covers both directions.
   */
  private resolveEntityToFile(e: AskEntity): import('obsidian').TFile | null {
    const tries = new Set<string>();
    if (e.name) tries.add(e.name);
    // Strip a trailing " (Foo)" if present (chat sometimes embeds the type).
    const stripped = e.name.replace(/\s*\([^)]+\)\s*$/, '').trim();
    if (stripped) tries.add(stripped);
    // Add the type suffix the way graph-pull writes it on disk.
    if (e.type && stripped) tries.add(`${stripped} (${e.type})`);
    for (const name of tries) {
      const f = this.app.metadataCache.getFirstLinkpathDest(name, '');
      if (f) return f;
    }
    return null;
  }

  private renderDocuments(parent: HTMLElement, documents: AskDocument[]): void {
    const section = this.collapsibleSection(parent, `Documents (${documents.length})`, false);
    const list = section.createEl('div', { cls: 'cortex-chat-docs' });
    for (const d of documents) {
      const row = list.createEl('div', { cls: 'cortex-chat-doc' });
      const header = row.createEl('div', { cls: 'cortex-chat-doc-header' });
      const titleEl = header.createEl(d.url || d.filePath ? 'a' : 'span', { cls: 'cortex-chat-doc-title', text: d.title });
      if (d.url) {
        (titleEl as HTMLAnchorElement).href = d.url;
        (titleEl as HTMLAnchorElement).target = '_blank';
        (titleEl as HTMLAnchorElement).rel = 'noopener';
      } else if (d.filePath) {
        (titleEl as HTMLAnchorElement).href = '#';
        titleEl.addEventListener('click', evt => {
          evt.preventDefault();
          const file = this.app.vault.getAbstractFileByPath(d.filePath!);
          if (file && 'extension' in file) {
            this.app.workspace.getLeaf(false).openFile(file as any);
            this.host.onNavigate();
          }
        });
      }
      if (typeof d.matchPercent === 'number') {
        header.createEl('span', { cls: 'cortex-chat-pill cortex-chat-pill-match', text: `${d.matchPercent}%` });
      }
      const subParts: string[] = [];
      if (d.source) subParts.push(d.source);
      if (d.publishDate) subParts.push(d.publishDate);
      if (subParts.length > 0) row.createEl('div', { cls: 'cortex-chat-doc-sub', text: subParts.join(' · ') });
      if (d.snippet) row.createEl('div', { cls: 'cortex-chat-doc-snippet', text: d.snippet });
    }
  }

  private renderCitations(parent: HTMLElement, citations: AskCitation[]): void {
    // Sources panel collapsed by default — same reasoning as Entities/Documents.
    const section = this.collapsibleSection(parent, `Sources (${citations.length})`, false);
    section.addClass('cortex-chat-citations');
    const chips = section.createEl('div', { cls: 'cortex-chat-chips' });
    for (const c of citations) {
      // Pre-resolve so chips with no matching vault file render as muted
      // badges instead of broken-looking links.
      const target = c.url ? null : this.resolveCitationToFile(c.source);
      const chip = chips.createEl('a', {
        cls: target || c.url ? 'cortex-chat-chip is-linked' : 'cortex-chat-chip',
        text: prettifyEntityName(c.source),
        href: c.url ?? '#',
      });
      const tooltipParts: string[] = [];
      if (c.text) tooltipParts.push(c.text);
      if (c.source !== prettifyEntityName(c.source)) tooltipParts.push(`id: ${c.source}`);
      if (!c.url && !target) tooltipParts.push('Not in vault yet — pull the graph to materialize.');
      if (tooltipParts.length) chip.setAttr('title', tooltipParts.join('\n'));
      if (c.url) {
        chip.target = '_blank';
        chip.rel = 'noopener';
      } else {
        chip.addEventListener('click', evt => {
          evt.preventDefault();
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          } else {
            new Notice(`"${prettifyEntityName(c.source)}" isn't a file in this vault yet. Pull the graph from settings to materialize it.`);
          }
        });
      }
    }
  }

  /** Same fuzzy resolution as resolveEntityToFile, for citations which only have a name string. */
  private resolveCitationToFile(source: string): import('obsidian').TFile | null {
    if (!source) return null;
    const tries = new Set<string>([source]);
    const stripped = source.replace(/\s*\([^)]+\)\s*$/, '').trim();
    if (stripped) tries.add(stripped);
    for (const name of tries) {
      const f = this.app.metadataCache.getFirstLinkpathDest(name, '');
      if (f) return f;
    }
    return null;
  }

  private renderErrorCard(parent: HTMLElement, err: unknown, headline: string, onRetry?: () => void): void {
    const fmt = formatError(err, headline);
    const card = parent.createEl('div', { cls: `cortex-error-card cortex-error-${fmt.kind}` });

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

    const actions = card.createEl('div', { cls: 'cortex-error-actions' });
    if (onRetry) {
      const retryBtn = actions.createEl('button', { text: 'Retry', cls: 'mod-cta' });
      retryBtn.addEventListener('click', () => onRetry());
    }
    const copyBtn = actions.createEl('button', { text: 'Copy details' });
    copyBtn.addEventListener('click', async () => {
      const payload = `${fmt.headline}\n\n${fmt.detail}${fmt.hint ? `\n\nHint: ${fmt.hint}` : ''}`;
      await navigator.clipboard.writeText(payload);
      copyBtn.setText('Copied');
      setTimeout(() => copyBtn.setText('Copy details'), 1400);
    });
  }

  private renderRecalledMemories(parent: HTMLElement, count: number): void {
    const note = parent.createEl('div', { cls: 'cortex-chat-recalled' });
    const ic = note.createEl('span', { cls: 'cortex-chat-recalled-icon' });
    setIcon(ic, 'history');
    note.createEl('span', { text: `Used ${count} memor${count === 1 ? 'y' : 'ies'} from past sessions.` });
  }

  private renderFollowUps(parent: HTMLElement, followUps: string[]): void {
    const section = parent.createEl('div', { cls: 'cortex-chat-section cortex-chat-followups' });
    section.createEl('div', { cls: 'cortex-chat-section-label', text: 'Follow up' });
    const list = section.createEl('div', { cls: 'cortex-chat-followup-list' });
    for (const q of followUps) {
      const btn = list.createEl('button', { cls: 'cortex-chat-followup', text: q });
      btn.addEventListener('click', () => {
        this.populateInput(q);
      });
    }
  }

  private async handleAttachedFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        new Notice(`${file.name}: only text files are supported for inline attachment (yet). Use vault sync for ${ext.toUpperCase()} files.`);
        continue;
      }
      if (this.pendingAttachments.some(a => a.name === file.name)) {
        new Notice(`${file.name} is already attached.`);
        continue;
      }
      try {
        let text = await file.text();
        if (text.length > MAX_ATTACHMENT_CHARS) {
          text = text.slice(0, MAX_ATTACHMENT_CHARS) + `\n\n[... truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars]`;
          new Notice(`${file.name} truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars`);
        }
        this.pendingAttachments.push({ name: file.name, size: file.size, content: text });
      } catch (e) {
        new Notice(`Couldn't read ${file.name}: ${(e as Error).message}`);
      }
    }
    this.renderAttachmentChips();
  }

  private renderAttachmentChips(): void {
    this.attachmentsEl.empty();
    if (this.pendingAttachments.length === 0) {
      this.attachmentsEl.addClass('is-empty');
      return;
    }
    this.attachmentsEl.removeClass('is-empty');
    for (const att of this.pendingAttachments) {
      const chip = this.attachmentsEl.createEl('div', { cls: 'cortex-chat-attachment-chip' });
      const ic = chip.createEl('span', { cls: 'cortex-chat-attachment-icon' });
      setIcon(ic, 'file-text');
      chip.createEl('span', { cls: 'cortex-chat-attachment-name', text: att.name });
      chip.createEl('span', {
        cls: 'cortex-chat-attachment-size',
        text: formatBytes(att.size),
      });
      const rm = chip.createEl('button', {
        cls: 'cortex-chat-attachment-remove',
        attr: { 'aria-label': `Remove ${att.name}` },
      });
      setIcon(rm, 'x');
      rm.addEventListener('click', () => {
        this.pendingAttachments = this.pendingAttachments.filter(a => a.name !== att.name);
        this.renderAttachmentChips();
      });
    }
  }

  private buildAugmentedQuery(query: string): { promptText: string; displayText: string; attachmentSummary: string } {
    if (this.pendingAttachments.length === 0) {
      return { promptText: query, displayText: query, attachmentSummary: '' };
    }
    const blocks: string[] = ['# Attached files (one-shot context for this question)\n'];
    for (const att of this.pendingAttachments) {
      const ext = (att.name.split('.').pop() || '').toLowerCase();
      blocks.push(`## ${att.name}\n\`\`\`${ext}\n${att.content}\n\`\`\`\n`);
    }
    blocks.push(`# User question\n${query}`);
    const summary = this.pendingAttachments.length === 1
      ? `📎 ${this.pendingAttachments[0].name}`
      : `📎 ${this.pendingAttachments.length} files attached`;
    return {
      promptText: blocks.join('\n'),
      displayText: query,
      attachmentSummary: summary,
    };
  }

  private populateInput(text: string): void {
    this.inputEl.value = text;
    this.autoResize();
    if (text.trim().length > 0) this.askBtn.removeAttribute('disabled');
    else this.askBtn.setAttr('disabled', 'true');
    this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    this.inputEl.focus();
    const len = this.inputEl.value.length;
    this.inputEl.setSelectionRange(len, len);
  }

  private collapsibleSection(parent: HTMLElement, label: string, openByDefault: boolean): HTMLElement {
    const wrap = parent.createEl('details', { cls: 'cortex-chat-section cortex-chat-collapsible' });
    if (openByDefault) wrap.setAttr('open', '');
    const summary = wrap.createEl('summary', { cls: 'cortex-chat-section-label' });
    summary.setText(label);
    return wrap;
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }

  private renderTurnActions(bubble: HTMLElement, answer: string, payload?: AskResponse): void {
    const actions = bubble.createEl('div', { cls: 'cortex-chat-turn-actions' });

    if (payload?.entities && payload.entities.length > 0) {
      const graphBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Show on graph' } });
      setIcon(graphBtn, 'network');
      graphBtn.createEl('span', { text: 'Show on graph' });
      graphBtn.addEventListener('click', () => void this.showEntitiesOnGraph(payload.entities));
    }

    const copyBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Copy answer' } });
    setIcon(copyBtn, 'copy');
    copyBtn.createEl('span', { text: 'Copy' });
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(answer);
      copyBtn.empty();
      setIcon(copyBtn, 'check');
      copyBtn.createEl('span', { text: 'Copied' });
      setTimeout(() => {
        copyBtn.empty();
        setIcon(copyBtn, 'copy');
        copyBtn.createEl('span', { text: 'Copy' });
      }, 1500);
    });

    const saveBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Save to note' } });
    setIcon(saveBtn, 'file-plus');
    saveBtn.createEl('span', { text: 'Save to Note' });
    saveBtn.addEventListener('click', async () => {
      try {
        const userTurns = this.currentTurns.filter(t => t.role === 'user');
        const question = userTurns.length > 0 ? userTurns[userTurns.length - 1].content : 'HangarX Answer';
        const entities = payload?.entities?.map(e => e.name);
        const citations = payload?.citations;
        const path = await writeSingleAnswerNote(
          this.app,
          this.settings.chatExportFolder,
          question,
          answer,
          entities,
          citations,
        );
        saveBtn.empty();
        setIcon(saveBtn, 'check');
        saveBtn.createEl('span', { text: 'Saved' });
        new Notice(`Saved to ${path}`);
        setTimeout(() => {
          saveBtn.empty();
          setIcon(saveBtn, 'file-plus');
          saveBtn.createEl('span', { text: 'Save to Note' });
        }, 2000);
      } catch (e) {
        new Notice(`Save failed: ${(e as Error).message}`);
      }
    });
  }

  /**
   * Push an OR-joined search filter into Obsidian's native Graph view that
   * matches the entities the chat just returned, so the user can see them
   * highlighted in their existing graph instead of a separate panel.
   *
   * Strategy (with graceful fallbacks):
   *   1. Activate or open the core Graph leaf in the main pane.
   *   2. Try the documented-internal path: set `view.engine.options.search`
   *      and call `view.engine.render()`.
   *   3. If that throws (Obsidian renamed/refactored the engine — has happened
   *      between minor versions), fall back to scraping the filter <input>
   *      out of the controls panel and dispatching an `input` event so the
   *      official UI runs the query.
   *   4. Add a tiny "Showing N entities from chat · Clear" pill on top of
   *      the graph leaf so the user knows where the filter came from.
   */
  private async showEntitiesOnGraph(entities: AskEntity[]): Promise<void> {
    const names = uniqueNames(entities);
    if (names.length === 0) {
      new Notice('No entities returned in this answer.');
      return;
    }

    // Resolve names to actual vault basenames via metadataCache (handles
    // aliases + linkpath normalization). Use bare quoted basenames in the
    // filter — `file:"…"` with parens/Unicode silently fails to match on
    // some Obsidian versions, while plain `"…" OR "…"` reliably hits both
    // filename and content.
    const resolvedBasenames: string[] = [];
    const unresolvedNames: string[] = [];
    for (const n of names) {
      const file = this.app.metadataCache.getFirstLinkpathDest(n, '');
      if (file?.basename) resolvedBasenames.push(file.basename);
      else unresolvedNames.push(n);
    }
    const allTerms = [...resolvedBasenames, ...unresolvedNames];
    if (allTerms.length === 0) {
      new Notice('Couldn\'t resolve any of the cited entities. Run a graph pull first?');
      return;
    }
    const query = allTerms.map(t => `"${t.replace(/"/g, '\\"')}"`).join(' OR ');
    const matchedCount = resolvedBasenames.length;

    // Open / focus the core Graph leaf in the main pane.
    let leaf = this.app.workspace.getLeavesOfType('graph')[0];
    if (!leaf) {
      const newLeaf = this.app.workspace.getLeaf(false);
      if (!newLeaf) {
        new Notice('Couldn\'t open Obsidian\'s graph view.');
        return;
      }
      await newLeaf.setViewState({ type: 'graph', active: true });
      leaf = newLeaf;
    }
    this.app.workspace.revealLeaf(leaf);
    this.host.onNavigate();

    const applied = await this.applyGraphFilter(leaf, query);
    if (!applied) {
      new Notice('Couldn\'t apply the graph filter — query copied to clipboard, paste it into the Filters panel.');
      void navigator.clipboard.writeText(query);
      return;
    }

    this.renderGraphFilterPill(leaf, matchedCount, query, names.length);
  }

  /**
   * Push a search query into Obsidian's graph view. Tries the internal
   * engine first (so the dim/highlight kicks in even when the Filters
   * panel is collapsed), then drives the visible search input as a
   * second pass — that keeps the UI in sync and is the surface Obsidian
   * itself uses, so it's the most stable fallback.
   *
   * Returns true if either path succeeded.
   */
  private async applyGraphFilter(leaf: any, query: string): Promise<boolean> {
    const waitFor = async <T>(fn: () => T | null | undefined, ms = 1500): Promise<T | null> => {
      const start = Date.now();
      while (Date.now() - start < ms) {
        const v = fn();
        if (v) return v;
        await new Promise(r => requestAnimationFrame(() => r(null)));
      }
      return null;
    };
    const setNativeValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc?.set) desc.set.call(el, value);
      else el.value = value;
    };

    const view: any = leaf.view;

    // Engine path. The engine renders even when the Filters panel is
    // collapsed, so this is what actually controls dimming.
    const engine: any = await waitFor(() =>
      view?.dataEngine ?? view?.engine ?? view?.renderer?.engine,
    );
    let engineApplied = false;
    if (engine) {
      try {
        const optsTargets = [engine.options, engine.filterOptions, engine.searchOptions]
          .filter((o: any) => o && typeof o === 'object');
        for (const o of optsTargets) o.search = query;
        if ('searchQuery' in engine) engine.searchQuery = query;
        for (const m of ['updateSearch', 'searchTrigger', 'render', 'requestUpdate', 'onOptionsChange', 'update']) {
          if (typeof engine[m] === 'function') {
            try { engine[m](); } catch { /* swallow */ }
          }
        }
        // Verify by reading back — some option objects are read-only proxies.
        engineApplied = optsTargets.some((o: any) => o.search === query);
      } catch {
        engineApplied = false;
      }
    }

    // Visible-input path. Expand the Filters section first — the search
    // input lives inside it and is removed from the DOM when collapsed.
    const root: HTMLElement | undefined = view?.containerEl;
    let inputApplied = false;
    if (root) {
      const collapsedHeader = root.querySelector<HTMLElement>(
        '.graph-control-section.is-collapsed .tree-item-self, ' +
        '.graph-control-section.is-collapsed > .graph-control-section-header, ' +
        '.tree-item.graph-control-section.is-collapsed .tree-item-self',
      );
      collapsedHeader?.click();

      const input = await waitFor(() =>
        root.querySelector<HTMLInputElement>(
          '.graph-controls input[type="text"], ' +
          '.graph-controls input[type="search"], ' +
          '.graph-control-section input[type="text"], ' +
          '.graph-control-section input[type="search"]',
        ),
      );
      if (input) {
        setNativeValue(input, query);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        inputApplied = true;
      }
    }

    return engineApplied || inputApplied;
  }

  /** Render (or replace) the "Showing N of M entities from chat · Clear" pill on a graph leaf. */
  private renderGraphFilterPill(leaf: any, matched: number, query: string, totalCited: number): void {
    const root = leaf.view?.containerEl as HTMLElement | undefined;
    if (!root) return;
    root.querySelectorAll('.cortex-graph-filter-pill').forEach(el => el.remove());

    const pill = document.createElement('div');
    pill.className = 'cortex-graph-filter-pill';
    const label = document.createElement('span');
    label.textContent = matched === totalCited
      ? `Showing ${matched} ${matched === 1 ? 'entity' : 'entities'} from chat`
      : `Showing ${matched} of ${totalCited} entities from chat`;
    pill.appendChild(label);

    if (matched < totalCited) {
      const hint = document.createElement('span');
      hint.className = 'cortex-graph-filter-pill-hint';
      hint.textContent = ` · ${totalCited - matched} not in vault yet`;
      hint.title = 'Run a graph pull from settings to materialize the rest as files.';
      pill.appendChild(hint);
    }

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.className = 'cortex-graph-filter-pill-clear';
    clearBtn.addEventListener('click', () => {
      void this.applyGraphFilter(leaf, '');
      pill.remove();
    });
    pill.appendChild(clearBtn);

    pill.title = query;
    root.appendChild(pill);
  }

  private async exportConversation(): Promise<void> {
    if (this.currentTurns.length === 0) {
      new Notice('No messages to export.');
      return;
    }
    try {
      const path = await writeConversationNote(this.app, this.settings.chatExportFolder, {
        title: this.currentTitle || 'Untitled Chat',
        turns: this.currentTurns.map(t => ({ role: t.role, content: t.content })),
        entities: this.allEntities.map(e => e.name),
        citations: this.allCitations,
        createdAt: this.currentCreatedAt || Date.now(),
      });
      new Notice(`Conversation exported to ${path}`);
    } catch (e) {
      new Notice(`Export failed: ${(e as Error).message}`);
    }
  }

  private linkifyEntities(container: HTMLElement, entities: AskEntity[]): void {
    if (!entities?.length) return;
    const entityMap = new Map<string, AskEntity>();
    for (const e of entities) {
      if (e.name.length < 3) continue;
      entityMap.set(e.name.toLowerCase(), e);
    }
    if (entityMap.size === 0) return;

    const sorted = [...entityMap.keys()].sort((a, b) => b.length - a.length);
    const escaped = sorted.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (node.parentElement?.closest('a, code, pre, .cortex-chat-chip')) continue;
      if (regex.test(node.textContent || '')) textNodes.push(node);
      regex.lastIndex = 0;
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      const parts: (string | HTMLElement)[] = [];
      let lastIndex = 0;
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text))) {
        // Capture the matched name into a local — the click handler runs
        // long after this loop ends, by which point the shared `match`
        // variable has been advanced (and ultimately set to null when
        // regex.exec returns null), so `match![1]` would throw.
        const matchedName = match[1];
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const entity = entityMap.get(matchedName.toLowerCase());
        const link = document.createElement('a');
        link.className = 'cortex-chat-inline-link';
        link.textContent = matchedName;
        link.href = '#';
        if (entity?.description) link.title = entity.description;
        link.addEventListener('click', evt => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(matchedName, '');
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          }
        });
        parts.push(link);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));

      if (parts.length > 1) {
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (typeof p === 'string') frag.appendChild(document.createTextNode(p));
          else frag.appendChild(p);
        }
        textNode.replaceWith(frag);
      }
    }
  }

  /**
   * Render the mode/status pill in the chat title bar. Renders one of three
   * states: checking (gray dot), connected (green dot + mode + host), or
   * unreachable (red dot + mode + "offline"). The pill is also click-to-retry.
   */
  private renderModePill(state: 'checking' | 'connected' | 'offline'): void {
    if (!this.statusPillEl) return;
    this.statusPillEl.empty();
    this.statusPillEl.removeClass('is-checking', 'is-connected', 'is-offline');
    this.statusPillEl.addClass(`is-${state}`);

    const mode = this.settings.connectionMode === 'local' ? 'Local' : 'Cloud';
    const host = (() => {
      try { return new URL(this.settings.apiUrl).host; } catch { return this.settings.apiUrl; }
    })();

    const dot = this.statusPillEl.createSpan({ cls: 'cortex-chat-mode-dot' });
    void dot;
    if (state === 'checking') {
      this.statusPillEl.createSpan({ text: `${mode} · checking…` });
      this.statusPillEl.setAttr('aria-label', `${mode} mode, checking connection`);
      this.statusPillEl.setAttr('title', `${mode} mode (${host}) — checking…`);
    } else if (state === 'connected') {
      this.statusPillEl.createSpan({ text: mode });
      this.statusPillEl.setAttr('aria-label', `${mode} mode, connected to ${host}`);
      this.statusPillEl.setAttr('title', `Connected to ${host}. Click to recheck.`);
    } else {
      this.statusPillEl.createSpan({ text: `${mode} · offline` });
      this.statusPillEl.setAttr('aria-label', `${mode} mode, cannot reach ${host}`);
      this.statusPillEl.setAttr('title', `Cannot reach ${host}. Click to retry.`);
    }

    // Click anywhere on the pill to force a recheck.
    this.statusPillEl.onclick = () => { void this.runModeProbe(); };
  }

  /**
   * Probe /health on the configured apiUrl and update the pill. Polls every
   * 30s while the panel is mounted. The poll cadence is intentionally lazy —
   * the goal is "did the stack just go down?" not real-time uptime monitoring.
   */
  private async runModeProbe(): Promise<void> {
    if (!this.statusPillEl) return;
    this.renderModePill('checking');
    const ok = await this.probeHealth();
    this.renderModePill(ok ? 'connected' : 'offline');
    if (this.statusPollTimer == null) {
      this.statusPollTimer = window.setInterval(() => { void this.runModeProbe(); }, 30_000);
    }
  }

  private async probeHealth(): Promise<boolean> {
    const cleanUrl = (this.settings.apiUrl || '').replace(/\/$/, '');
    if (!cleanUrl) return false;
    try {
      const res = await requestUrl({ url: `${cleanUrl}/health`, method: 'GET', throw: false });
      // Any 2xx/3xx, plus 503 (degraded but reachable), counts as "stack is up".
      return res.status >= 200 && (res.status < 400 || res.status === 503);
    } catch {
      return false;
    }
  }
}

/**
 * Dedupe + sort entity names for graph-filter quoting. Uses canonical names
 * (not prettified) because the filter has to match what the entity files are
 * actually named on disk (graph-pull writes them as `<name> (<type>).md`).
 */
function uniqueNames(entities: AskEntity[]): string[] {
  const set = new Set<string>();
  for (const e of entities) {
    if (e.name && e.name.length >= 2) set.add(e.name);
  }
  return Array.from(set).sort();
}

function prettifyEntityName(name: string | undefined | null): string {
  if (!name) return '';
  let s = String(name);
  s = s.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, '');
  if (s.includes('/')) s = s.split('/').filter(Boolean).pop() ?? s;
  s = s.replace(/\.(md|markdown|txt)$/i, '');
  const chatMatch = s.match(/^Cortex_(Chats|Briefs)_(\d{4}-\d{2}-\d{2})(?:_-_(.+))?$/);
  if (chatMatch) {
    const kind = chatMatch[1] === 'Chats' ? 'Chat' : 'Brief';
    const date = chatMatch[2];
    const title = (chatMatch[3] || '').replace(/_/g, ' ').trim();
    return title ? `${kind}: ${title} (${date})` : `${kind} ${date}`;
  }
  s = s.replace(/_/g, ' ').trim();
  return s || name;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
