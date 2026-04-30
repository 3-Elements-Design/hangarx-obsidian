import { App, Modal, Notice, MarkdownRenderer, Component, setIcon } from 'obsidian';
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
  { icon: 'list', label: 'Summarize', text: 'Summarize the key themes across my vault.' },
  { icon: 'link', label: 'Connect ideas', text: 'Find the strongest connections between my notes.' },
  { icon: 'search', label: 'Surface insights', text: 'What patterns might I have missed?' },
  { icon: 'lightbulb', label: 'What’s next?', text: 'Based on my recent notes, what should I explore next?' },
];

/** Per-message attached file. Inline-only — never persisted to the vault graph. */
interface ChatAttachment {
  name: string;
  size: number;
  /** Decoded text content. Truncated to MAX_ATTACHMENT_CHARS for the prompt. */
  content: string;
}

/** Hard cap on inline attachment text. ~100K chars ≈ 25K tokens, fits Gemini
 *  Flash easily; prevents a 5MB log paste from blowing the context window. */
const MAX_ATTACHMENT_CHARS = 100_000;
/** File extensions we treat as plain text. Binaries are politely declined. */
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

export class ChatModal extends Modal {
  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLElement;
  private askBtn!: HTMLButtonElement;
  private newChatBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private historyBtn!: HTMLButtonElement;
  private historyPopover: HTMLElement | null = null;
  private sessionId: string;
  private renderComponent = new Component();
  private hasMessages = false;
  private currentTurns: ChatTurn[] = [];
  private currentTitle = '';
  private currentCreatedAt = 0;
  /** All entities collected across turns, for inline-link post-processing. */
  private allEntities: AskEntity[] = [];
  /** All citations collected across turns, for export. */
  private allCitations: AskCitation[] = [];

  /** Files attached to the next outgoing message. Inline-only — content is
   *  prepended to the prompt at send time and then cleared. Not persisted. */
  private pendingAttachments: ChatAttachment[] = [];
  private attachBtn!: HTMLButtonElement;
  private attachmentsEl!: HTMLElement;
  private fileInputEl!: HTMLInputElement;

  constructor(app: App, private client: CortexClient, private store: ConversationStore, private settings: CortexSettings) {
    super(app);
    this.sessionId = crypto.randomUUID();
  }

  onOpen(): void {
    this.modalEl.addClass('cortex-chat-modal');
    this.titleEl.empty();
    const title = this.titleEl.createEl('div', { cls: 'cortex-chat-title' });
    title.createEl('span', { cls: 'cortex-chat-title-text', text: 'Ask your vault' });
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
    this.exportBtn.style.display = 'none'; // hidden until there are messages

    this.outputEl = this.contentEl.createEl('div', { cls: 'cortex-chat-output' });
    this.renderEmptyState();

    const composerWrap = this.contentEl.createEl('div', { cls: 'cortex-chat-composer-wrap' });
    // Attachment chips render above the composer when files are attached.
    this.attachmentsEl = composerWrap.createEl('div', { cls: 'cortex-chat-attachments is-empty' });
    const composer = composerWrap.createEl('div', { cls: 'cortex-chat-composer' });

    // Paperclip button — adds a file as inline context for the next question.
    this.attachBtn = composer.createEl('button', {
      cls: 'cortex-chat-attach',
      attr: { 'aria-label': 'Attach file (text only, ephemeral)', type: 'button' },
    });
    setIcon(this.attachBtn, 'paperclip');
    // Hidden <input type=file> that the paperclip click triggers.
    this.fileInputEl = composer.createEl('input', {
      cls: 'cortex-chat-file-input',
      attr: { type: 'file', multiple: 'true', style: 'display:none' },
    });
    this.attachBtn.addEventListener('click', () => this.fileInputEl.click());
    this.fileInputEl.addEventListener('change', () => {
      const files = Array.from(this.fileInputEl.files ?? []);
      void this.handleAttachedFiles(files);
      this.fileInputEl.value = ''; // reset so re-selecting same file fires change
    });

    this.inputEl = composer.createEl('textarea', {
      cls: 'cortex-chat-input',
      attr: { rows: '1', placeholder: 'Ask anything about your vault…' },
    });
    this.askBtn = composer.createEl('button', { cls: 'cortex-chat-send', attr: { 'aria-label': 'Send', disabled: 'true' } });
    setIcon(this.askBtn, 'arrow-up');
    this.askBtn.addEventListener('click', () => this.submit());

    // Drag-and-drop on the composer area — same code path as the file picker.
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
    hint.createEl('span', { text: '⌘↵ to send · ⌘N to start a new chat' });

    this.inputEl.addEventListener('input', () => {
      this.autoResize();
      this.askBtn.toggleAttribute('disabled', this.inputEl.value.trim().length === 0);
    });
    this.inputEl.addEventListener('keydown', evt => {
      if (evt.key === 'Enter' && (evt.metaKey || evt.ctrlKey)) {
        evt.preventDefault();
        this.submit();
      } else if (evt.key === 'n' && (evt.metaKey || evt.ctrlKey) && !this.hasMessages === false) {
        evt.preventDefault();
        this.resetConversation();
      }
    });
    this.inputEl.focus();
  }

  private renderEmptyState(): void {
    const empty = this.outputEl.createEl('div', { cls: 'cortex-chat-empty' });
    const logo = empty.createEl('div', { cls: 'cortex-chat-empty-logo' });
    logo.innerHTML = HANGARX_LOGO_SVG;
    empty.createEl('h2', { cls: 'cortex-chat-empty-title', text: 'Ask your vault anything' });
    empty.createEl('p', {
      cls: 'cortex-chat-empty-sub',
      text: 'HangarX searches your knowledge graph and synthesizes an answer with citations.',
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

  // ──────────────────────────────────────────
  // History popover
  // ──────────────────────────────────────────

  private toggleHistoryPopover(): void {
    if (this.historyPopover) { this.closeHistoryPopover(); return; }
    void this.openHistoryPopover();
  }

  private async openHistoryPopover(): Promise<void> {
    const popover = this.contentEl.createEl('div', { cls: 'cortex-chat-history-popover' });
    this.historyPopover = popover;
    popover.createEl('div', { cls: 'cortex-chat-history-header', text: 'Past conversations' });
    const listEl = popover.createEl('div', { cls: 'cortex-chat-history-list' });
    listEl.createEl('div', { cls: 'cortex-chat-history-empty', text: 'Loading…' });

    // Close-on-outside-click handler. Defer registration so this very click doesn't trigger it.
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
      // If we deleted the active one, reset.
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
    // Turn actions (Copy + Save)
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

  onClose(): void {
    document.removeEventListener('mousedown', this.onOutsideClick, true);
    // Auto-save conversation as vault note if enabled
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
    this.contentEl.empty();
  }

  private async submit(): Promise<void> {
    const query = this.inputEl.value.trim();
    if (!query) return;
    this.inputEl.value = '';
    this.autoResize();
    this.askBtn.setAttr('disabled', 'true');
    this.hasMessages = true;

    // Clear empty state on first submit.
    const emptyState = this.outputEl.querySelector('.cortex-chat-empty');
    emptyState?.remove();

    // Detect bare URLs — ingest instead of ask
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
        this.renderErrorCard(bodyEl, e, 'Couldn\'t ingest URL', () => {
          // Retry just re-runs submit() with the same query.
          this.inputEl.value = query;
          void this.submit();
        });
      }
      this.scrollToBottom();
      return;
    }

    // Augment the outgoing prompt with any attached files. Display turn shows
    // just the user's question (clean); the LLM receives file contents
    // prepended. Attachments clear after the request kicks off so they're
    // not re-sent on subsequent turns.
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
      // Pull relevant prior memories for context — fire-and-forget if it fails so a
      // recall outage never blocks an answer.
      const recalled = await this.client.recall(query, 5).catch(() => []);
      const prefix = recalled.length > 0
        ? `Relevant prior context (from past sessions):\n${recalled.map(m => `- ${m.content}`).join('\n')}\n\nQuestion: `
        : '';
      const res = await this.client.ask(prefix + promptText, this.sessionId);
      thinkingEl.remove();
      await this.renderResponse(bodyEl, res);
      if (recalled.length > 0) this.renderRecalledMemories(bodyEl, recalled.length);

      // Collect entities & citations for inline links and export
      if (res.entities?.length) this.allEntities.push(...res.entities);
      if (res.citations?.length) this.allCitations.push(...res.citations);

      // Turn actions (Copy + Save to Note)
      this.renderTurnActions(aiBubble, res.answer, res);

      this.currentTurns.push({ role: 'ai', content: res.answer, payload: res });
      this.exportBtn.style.display = '';
      void this.persistConversation();

      // Auto-save Q&A as a memory ONLY if the user opted in. Saving every
      // exchange unconditionally polluted recall() — generic LLM answers
      // started outranking real notes because they were the most recent
      // memory writes. The chat already persists conversations to disk via
      // persistConversation(); the memory layer is for content the user
      // (or an agent) intentionally wants surfaced in future retrievals.
      if (this.settings.autoSaveChatToVault) {
        void this.client.remember(`Q: ${query}\nA: ${res.answer.slice(0, 800)}`, 'conversation').catch(() => {});
      }
    } catch (e) {
      thinkingEl.remove();
      this.renderErrorCard(bodyEl, e, 'Couldn\'t answer your question', () => {
        // Retry: drop the failed AI bubble + the corresponding user turn, then resubmit.
        aiTurn.remove();
        this.currentTurns.pop(); // remove the user turn we just pushed
        this.inputEl.value = query;
        void this.submit();
      });
    } finally {
      // Re-enable only if user typed something new.
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

    if (res.entities.length > 0) this.renderEntities(parent, res.entities);
    if (res.documents.length > 0) this.renderDocuments(parent, res.documents);
    if (res.citations.length > 0) this.renderCitations(parent, res.citations);
    if (res.followUps.length > 0) this.renderFollowUps(parent, res.followUps);

    // Post-process: make entity names in the answer text clickable
    this.linkifyEntities(answerEl, res.entities);
  }

  private renderEntities(parent: HTMLElement, entities: AskEntity[]): void {
    const section = this.collapsibleSection(parent, `Entities (${entities.length})`, true);
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
        const chip = chips.createEl('a', {
          cls: 'cortex-chat-chip',
          text: prettifyEntityName(e.name),
          href: '#',
        });
        // Show the raw identifier in a tooltip so power users can copy it,
        // and surface the description as a longer hint on hover.
        const titleParts: string[] = [];
        if (e.description) titleParts.push(e.description);
        if (e.name !== prettifyEntityName(e.name)) titleParts.push(`id: ${e.name}`);
        if (titleParts.length) chip.setAttr('title', titleParts.join('\n'));
        chip.addEventListener('click', evt => {
          evt.preventDefault();
          // Resolve against the original name — that's what wikilinks use.
          const target = this.app.metadataCache.getFirstLinkpathDest(e.name, '');
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.close();
          }
        });
      }
    }
  }

  private renderDocuments(parent: HTMLElement, documents: AskDocument[]): void {
    const section = this.collapsibleSection(parent, `Documents (${documents.length})`, true);
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
            this.close();
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
    const section = parent.createEl('div', { cls: 'cortex-chat-section cortex-chat-citations' });
    section.createEl('div', { cls: 'cortex-chat-section-label', text: 'Sources' });
    const chips = section.createEl('div', { cls: 'cortex-chat-chips' });
    for (const c of citations) {
      const chip = chips.createEl('a', {
        cls: 'cortex-chat-chip',
        text: prettifyEntityName(c.source),
        href: c.url ?? '#',
      });
      // Tooltip surfaces snippet + raw id (when prettified differs).
      const tooltipParts: string[] = [];
      if (c.text) tooltipParts.push(c.text);
      if (c.source !== prettifyEntityName(c.source)) tooltipParts.push(`id: ${c.source}`);
      if (tooltipParts.length) chip.setAttr('title', tooltipParts.join('\n'));
      if (c.url) {
        chip.target = '_blank';
        chip.rel = 'noopener';
      } else {
        chip.addEventListener('click', evt => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(c.source, '');
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.close();
          }
        });
      }
    }
  }

  /**
   * Render a structured error card inside an AI bubble (or any container).
   * Reuses the shared error-format utility — same look and behavior as the
   * graph-pull modal, scoped down to fit inline in the chat flow.
   */
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

  /**
   * Programmatically populate the chat input. Mirrors what a real keystroke
   * would do: set value, recompute auto-grow height, refresh the send button
   * enabled state, and focus. Used by follow-up + suggestion card clicks —
   * without this, setting `inputEl.value` directly leaves the send button
   * stuck on `disabled` because the `input` event listener never fires.
   */
  /**
   * Handle one or more files added via the paperclip picker or drag-and-drop.
   * Reads each as text (binaries are politely declined with a Notice), caps
   * size, dedupes by name, and triggers the chip render.
   */
  private async handleAttachedFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        new Notice(`${file.name}: only text files are supported for inline attachment (yet). Use vault sync for ${ext.toUpperCase()} files.`);
        continue;
      }
      // Skip duplicates by name (most common: drag-drop the same file twice).
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

  /** Render the row of attachment chips above the composer. */
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

  /**
   * Build the augmented message body — prepends each attachment's content as a
   * fenced block, then the user's actual question. Returns the original
   * question separately so it can be displayed as-is in the chat bubble (not
   * cluttered with the file dump).
   */
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

  // ──────────────────────────────────────────
  // Turn actions (Copy + Save to Note)
  // ──────────────────────────────────────────

  private renderTurnActions(bubble: HTMLElement, answer: string, payload?: AskResponse): void {
    const actions = bubble.createEl('div', { cls: 'cortex-chat-turn-actions' });

    // Copy button
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

    // Save to Note button
    const saveBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Save to note' } });
    setIcon(saveBtn, 'file-plus');
    saveBtn.createEl('span', { text: 'Save to Note' });
    saveBtn.addEventListener('click', async () => {
      try {
        // Find the preceding user question
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

  // ──────────────────────────────────────────
  // Export full conversation
  // ──────────────────────────────────────────

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

  // ──────────────────────────────────────────
  // Inline entity links
  // ──────────────────────────────────────────

  /**
   * Post-process rendered answer HTML: find entity names in text nodes
   * and wrap them in clickable links that open the corresponding vault note.
   */
  private linkifyEntities(container: HTMLElement, entities: AskEntity[]): void {
    if (!entities?.length) return;
    // Build lookup: entity name → file (case-insensitive)
    const entityMap = new Map<string, AskEntity>();
    for (const e of entities) {
      if (e.name.length < 3) continue; // skip tiny names to avoid false matches
      entityMap.set(e.name.toLowerCase(), e);
    }
    if (entityMap.size === 0) return;

    // Build a regex that matches any entity name (longest first to avoid partial matches)
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
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const entity = entityMap.get(match[1].toLowerCase());
        const link = document.createElement('a');
        link.className = 'cortex-chat-inline-link';
        link.textContent = match[1];
        link.href = '#';
        if (entity?.description) link.title = entity.description;
        link.addEventListener('click', evt => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(match![1], '');
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.close();
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
}

/**
 * Prettify entity / source identifiers for display.
 *
 * The graph collects entities with a few different naming conventions:
 *   - User notes:           "2026-04-26 - what is the PARA method"  (already pretty)
 *   - Auto-saved chats:     "<UUID>-Cortex_Chats_<DATE>_-_<TITLE_WITH_UNDERSCORES>"
 *   - Brief exports:        "<UUID>-Cortex_Briefs_Daily_Brief_-_<DATE>"
 *   - Misc auto-generated:  "<UUID>-<KIND>_<TITLE>"
 *
 * The UUID prefixes + underscore-joined titles produce ugly chips that hide
 * the actual content. This helper strips the UUID, removes path-like
 * separators, and turns underscores back into spaces. The original raw name
 * is still the canonical identifier used for click-through resolution.
 */
function prettifyEntityName(name: string | undefined | null): string {
  if (!name) return '';
  let s = String(name);
  // 1. Strip leading UUID prefix (with trailing hyphen).
  s = s.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, '');
  // 2. Strip a leading folder + slash if it leaked through (e.g. "Cortex Memories/foo")
  //    keep the title only. Multi-segment paths → take the last segment.
  if (s.includes('/')) s = s.split('/').filter(Boolean).pop() ?? s;
  // 3. Drop a `.md` suffix (or other common note extensions).
  s = s.replace(/\.(md|markdown|txt)$/i, '');
  // 4. Collapse the auto-export pattern  Cortex_Chats_<DATE>_-_<TITLE>
  //    → "Chat: <title> (<date>)".
  const chatMatch = s.match(/^Cortex_(Chats|Briefs)_(\d{4}-\d{2}-\d{2})(?:_-_(.+))?$/);
  if (chatMatch) {
    const kind = chatMatch[1] === 'Chats' ? 'Chat' : 'Brief';
    const date = chatMatch[2];
    const title = (chatMatch[3] || '').replace(/_/g, ' ').trim();
    return title ? `${kind}: ${title} (${date})` : `${kind} ${date}`;
  }
  // 5. Generic fallback: replace underscores with spaces.
  s = s.replace(/_/g, ' ').trim();
  return s || name;
}

/** Compact human-readable byte count for attachment chips. */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
