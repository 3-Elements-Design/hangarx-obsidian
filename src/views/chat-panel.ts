import { App, Modal, Notice, MarkdownRenderer, Component, setIcon, requestUrl } from 'obsidian';
import type { CortexClient, AskResponse, AskEntity, AskDocument, AskCitation, AgentStreamEvent } from '../cortex-client';
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
import { appendHangarxLogo } from '../assets';

/**
 * Tier 1 — daily-ritual prompts. These are the "open Obsidian and do this"
 * cards that compress the most-frequent journeys into one click. Surfaced
 * prominently so a returning user can resume work in seconds.
 */
export const DAILY_RITUAL_PROMPTS = [
  {
    icon: 'play-circle',
    label: 'Resume',
    text: 'Pick up where I left off yesterday. What was I working on at end of day, and what should I pick up first this morning? Cite the notes and quote the unfinished thread.',
  },
  {
    icon: 'clipboard-list',
    label: "Today's brief",
    text: 'Generate today\'s standup: what I shipped yesterday (with note links), what\'s blocking me, and the top 3 things I should tackle today. Keep it tight.',
  },
  {
    icon: 'list-checks',
    label: 'Open tasks',
    text: 'Show every unfinished `- [ ]` task across my vault, grouped by project. Sort by recency within each group. Flag anything overdue or with a due:: date.',
  },
  {
    icon: 'book-open',
    label: 'Summarize vault',
    text: 'Give me a high-level summary of my entire vault: the major themes, the projects I work on, the people and entities I mention most, and how recently each area has been active. Treat it like an exec summary of my second brain.',
  },
];

/**
 * Full catalog of starter prompts surfaced in the "More starters" modal.
 * Searchable + categorized. Add new entries here — the modal renders them
 * automatically. Categories are not exclusive; a prompt can belong to one.
 */
export interface StarterPrompt {
  icon: string;
  label: string;
  text: string;
  category: 'Daily' | 'Reviews' | 'Knowledge' | 'Tasks' | 'Decisions' | 'Connections' | 'Writing' | 'People' | 'Discovery';
}

export const STARTER_CATALOG: StarterPrompt[] = [
  // Daily
  ...DAILY_RITUAL_PROMPTS.map((p) => ({ ...p, category: 'Daily' as const })),

  // Reviews
  { category: 'Reviews', icon: 'history', label: 'Catch me up', text: 'Summarize what I\'ve been working on this week. Group by project, highlight key decisions, and call out anything still open.' },
  { category: 'Reviews', icon: 'calendar', label: 'Weekly review', text: 'Run a weekly review: what I accomplished, what slipped, what I learned, and the 3 most important things for next week. Use my notes from the last 7 days as evidence.' },
  { category: 'Reviews', icon: 'calendar-days', label: 'Monthly review', text: 'Run a monthly retrospective. Major themes worked on, decisions made, projects shipped, projects abandoned, and patterns across my notes from the past 30 days.' },
  { category: 'Reviews', icon: 'clock', label: "What's stale", text: 'List projects I\'ve mentioned in the last 14 days but haven\'t touched in 7+ days. For each, surface the last note, who/what is blocking, and the most recent open question.' },

  // Knowledge / discovery
  { category: 'Knowledge', icon: 'sparkles', label: 'Top themes', text: 'What are the top 5 themes I write about across my entire vault? For each theme, list the most foundational notes and the most recent ones.' },
  { category: 'Knowledge', icon: 'graduation-cap', label: 'What I\'ve learned', text: 'What have I learned this month? Pull novel concepts, frameworks, or insights I captured in notes — distinguish between things I actively studied and things I picked up incidentally.' },
  { category: 'Knowledge', icon: 'box', label: 'Concepts I use most', text: 'Which concepts, frameworks, or mental models do I reference most often across notes? For each, summarize what it means in my own words and where I first introduced it.' },
  { category: 'Knowledge', icon: 'search', label: 'Find blind spots', text: 'What topics or entities appear frequently across my notes but don\'t have a dedicated note explaining them? Suggest 3-5 candidates worth writing up as MOC (map-of-content) notes.' },
  { category: 'Knowledge', icon: 'book-open', label: 'Reading list mentions', text: 'Surface every book, paper, or article I\'ve referenced across my notes. Indicate which ones I\'ve actually read versus only cited.' },

  // Tasks
  { category: 'Tasks', icon: 'list-checks', label: 'Tasks by project', text: 'Show every unfinished `- [ ]` task across my vault, grouped by project. Sort by recency within each group. Flag anything overdue or with a due:: date.' },
  { category: 'Tasks', icon: 'alert-triangle', label: 'Overdue tasks', text: 'Find all open tasks across my vault with a due date in the past. Sort by how overdue they are and surface the originating note.' },
  { category: 'Tasks', icon: 'inbox', label: 'Process my inbox', text: 'Find notes I\'ve created or edited in the last 7 days that don\'t have any tags, aren\'t linked from any other note, and aren\'t in a folder. Suggest a place for each one.' },

  // Decisions
  { category: 'Decisions', icon: 'lightbulb', label: 'Surface decisions', text: 'What important decisions have I documented in the last month? For each one, give me the decision, the reasoning behind it, and any open questions left unanswered.' },
  { category: 'Decisions', icon: 'help-circle', label: 'Open questions', text: 'Find unresolved questions in my notes — places where I wrote something like "TODO research", "open question", or asked myself a question I never answered. Group by topic.' },
  { category: 'Decisions', icon: 'refresh-ccw', label: 'Changed my mind', text: 'Find topics where I\'ve changed my mind over time — places where my recent notes contradict or revise my earlier ones. Surface the before/after with evidence.' },

  // Connections
  { category: 'Connections', icon: 'route', label: 'Trace connections', text: 'Find two ideas in my recent notes that seem unrelated but are actually connected through other concepts. Walk me through the path between them.' },
  { category: 'Connections', icon: 'git-merge', label: 'Hidden links', text: 'Find pairs of notes that should probably reference each other but don\'t. Suggest links to add and explain why.' },
  { category: 'Connections', icon: 'puzzle', label: 'Repeated ideas', text: 'Identify ideas, concepts, or quotes that I\'ve restated in multiple notes — possibly without realizing. Suggest which note should be canonical and which should link.' },

  // Writing
  { category: 'Writing', icon: 'pen-tool', label: 'Drafts to revise', text: 'List notes I\'ve drafted but haven\'t come back to revise. Surface anything tagged #draft, marked TODO, or with FIXMEs in the body. Sort by age.' },
  { category: 'Writing', icon: 'expand', label: 'Expand an outline', text: 'Find an outline-style note in my vault that I haven\'t fleshed out yet. Walk through what it would take to expand each bullet into full prose, citing supporting notes.' },
  { category: 'Writing', icon: 'feather', label: 'Find quotable lines', text: 'Surface 5-10 of my most quotable lines from notes I\'ve written this year — original phrases, not citations from others. Include source note for each.' },

  // People
  { category: 'People', icon: 'users', label: 'People I mention', text: 'List the people I mention most across my notes. For each, summarize the context I usually mention them in and the last time I wrote about them.' },
  { category: 'People', icon: 'message-square', label: 'Conversation log', text: 'Pull every note that captures a conversation, meeting, or interview. Group by person/team and surface the key points and any follow-ups I committed to.' },

  // Discovery / playful
  { category: 'Discovery', icon: 'compass', label: 'Random walk', text: 'Pick a random note from my vault and tell me three other notes I\'ve written that connect to it in non-obvious ways. Show me the path.' },
  { category: 'Discovery', icon: 'sparkle', label: 'Surprise me', text: 'Surface something interesting I\'ve forgotten — a note from 6+ months ago that\'s relevant to what I\'m working on now, or an idea I had once and never followed up on.' },
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
  /** Callback the panel invokes after mutating `settings` so the plugin can
   *  flush them to disk. Both chat-view and chat-modal wire this to
   *  plugin.saveSettings(). Optional — older host implementations no-op. */
  saveSettings?: () => Promise<void> | void;
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
  private starBtn!: HTMLButtonElement;
  private historyPopover: HTMLElement | null = null;

  private sessionId: string;
  private hasMessages = false;
  private currentTurns: ChatTurn[] = [];
  private currentTitle = '';
  private currentCreatedAt = 0;
  private currentStarred = false;
  private allEntities: AskEntity[] = [];
  private allCitations: AskCitation[] = [];

  private pendingAttachments: ChatAttachment[] = [];
  private attachBtn!: HTMLButtonElement;
  private attachmentsEl!: HTMLElement;
  private fileInputEl!: HTMLInputElement;

  private statusPillEl: HTMLElement | null = null;
  private statusPollTimer: number | null = null;

  // Smart "ask the current note" — when on, prepends the active editor's
  // file as context to the next prompt. Toggled via a chip above the
  // composer; auto-updates as the user navigates between notes.
  private askAboutActiveFile = false;
  private activeFileChipEl: HTMLElement | null = null;
  private activeFileWatcher: { unload: () => void } | null = null;

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
    const title = titleEl.createDiv({ cls: 'cortex-chat-title' });
    title.createSpan({ cls: 'cortex-chat-title-text', text: 'Ask your vault' });
    this.statusPillEl = title.createSpan({ cls: 'cortex-chat-mode-pill' });
    this.renderModePill('checking');
    void this.runModeProbe();
    const actions = title.createDiv({ cls: 'cortex-chat-title-actions' });

    this.historyBtn = actions.createEl('button', { cls: 'cortex-chat-iconbtn', attr: { 'aria-label': 'Conversation history' } });
    setIcon(this.historyBtn, 'history');
    this.historyBtn.addEventListener('click', evt => {
      evt.stopPropagation();
      this.toggleHistoryPopover();
    });

    // Star toggle — flags the current conversation as a useful query.
    // Hidden until the conversation has at least one assistant turn so
    // there's something to star. Persisted via ConversationStore so the
    // history popover + onboarding milestone see it.
    this.starBtn = actions.createEl('button', {
      cls: 'cortex-chat-iconbtn cortex-chat-star',
      attr: { 'aria-label': 'Star this conversation', title: 'Star this conversation' },
    });
    setIcon(this.starBtn, 'star');
    this.starBtn.addEventListener('click', () => { void this.toggleStarred(); });
    this.starBtn.addClass('is-hidden');

    this.newChatBtn = actions.createEl('button', { cls: 'cortex-chat-iconbtn', attr: { 'aria-label': 'New chat' } });
    setIcon(this.newChatBtn, 'plus');
    this.newChatBtn.addEventListener('click', () => this.resetConversation());

    this.exportBtn = actions.createEl('button', { cls: 'cortex-chat-iconbtn', attr: { 'aria-label': 'Export conversation to note' } });
    setIcon(this.exportBtn, 'file-down');
    this.exportBtn.addEventListener('click', () => { void this.exportConversation(); });
    this.exportBtn.addClass('is-hidden');

    this.outputEl = contentEl.createDiv({ cls: 'cortex-chat-output' });
    this.renderEmptyState();

    const composerWrap = contentEl.createDiv({ cls: 'cortex-chat-composer-wrap' });
    this.activeFileChipEl = composerWrap.createDiv({ cls: 'cortex-chat-active-file-chip is-hidden' });
    this.attachmentsEl = composerWrap.createDiv({ cls: 'cortex-chat-attachments is-empty' });
    const composer = composerWrap.createDiv({ cls: 'cortex-chat-composer' });
    this.refreshActiveFileChip();
    // Reflect active-file changes immediately. Wrapped in plugin's event
    // registration so the listener tears down on view close.
    const evRef = this.app.workspace.on('active-leaf-change', () => this.refreshActiveFileChip());
    this.renderComponent.register(() => this.app.workspace.offref(evRef));

    this.attachBtn = composer.createEl('button', {
      cls: 'cortex-chat-attach',
      attr: { 'aria-label': 'Attach file (text only, ephemeral)', type: 'button' },
    });
    setIcon(this.attachBtn, 'paperclip');
    this.fileInputEl = composer.createEl('input', {
      cls: 'cortex-chat-file-input cortex-hidden-file-input',
      attr: { type: 'file', multiple: 'true' },
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
    this.askBtn.addEventListener('click', () => { void this.submit(); });

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

    const hint = composerWrap.createDiv({ cls: 'cortex-chat-hint' });
    hint.createSpan({ text: '↵ to send · ⇧↵ for newline · Esc (empty input) for new chat' });

    this.inputEl.addEventListener('input', () => {
      this.autoResize();
      this.askBtn.toggleAttribute('disabled', this.inputEl.value.trim().length === 0);
    });
    this.inputEl.addEventListener('keydown', evt => {
      // Enter submits; Shift+Enter falls through to insert a newline.
      // ⌘↵ / Ctrl+↵ kept as a fallback for muscle memory.
      if (evt.key === 'Enter' && !evt.shiftKey && !evt.isComposing) {
        evt.preventDefault();
        void this.submit();
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
    activeDocument.removeEventListener('mousedown', this.onOutsideClick, true);
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

  /**
   * Render the "Asking about: <Note>" chip above the composer when there
   * is an active markdown file. Auto-clears the toggle if the user
   * navigates to no-file or a non-markdown surface.
   */
  private refreshActiveFileChip(): void {
    if (!this.activeFileChipEl) return;
    this.activeFileChipEl.empty();
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') {
      this.activeFileChipEl.addClass('is-hidden');
      this.askAboutActiveFile = false;
      return;
    }
    this.activeFileChipEl.removeClass('is-hidden');
    this.activeFileChipEl.toggleClass('is-on', this.askAboutActiveFile);

    const left = this.activeFileChipEl.createDiv({ cls: 'cortex-chat-active-file-chip-left' });
    const ic = left.createSpan({ cls: 'cortex-chat-active-file-chip-icon' });
    setIcon(ic, this.askAboutActiveFile ? 'paperclip' : 'file');
    const label = left.createSpan({ cls: 'cortex-chat-active-file-chip-label' });
    label.createSpan({
      cls: 'cortex-chat-active-file-chip-prefix',
      text: this.askAboutActiveFile ? 'Asking about: ' : 'Use as context: ',
    });
    label.createSpan({ cls: 'cortex-chat-active-file-chip-name', text: file.basename });

    const toggle = this.activeFileChipEl.createEl('button', {
      cls: 'cortex-chat-active-file-chip-toggle',
      attr: { type: 'button', 'aria-label': this.askAboutActiveFile ? 'Stop using this note as context' : 'Use this note as context' },
    });
    setIcon(toggle, this.askAboutActiveFile ? 'x' : 'plus');
    toggle.addEventListener('click', () => {
      this.askAboutActiveFile = !this.askAboutActiveFile;
      this.refreshActiveFileChip();
    });

    // Click the chip body to toggle as well (more discoverable than the +/×).
    left.addEventListener('click', () => {
      this.askAboutActiveFile = !this.askAboutActiveFile;
      this.refreshActiveFileChip();
    });
  }

  /**
   * Build the active-file context block to prepend to the next prompt.
   * Truncates large notes at 2000 chars so we don't blow up the model
   * context. Returns an empty string when the toggle is off.
   */
  private async buildActiveFileContext(): Promise<string> {
    if (!this.askAboutActiveFile) return '';
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') return '';
    try {
      const content = await this.app.vault.cachedRead(file);
      const MAX = 2000;
      const truncated = content.length > MAX ? content.slice(0, MAX) + '\n…(truncated)' : content;
      return `[Active note: ${file.path}]\n\n${truncated}\n\n---\n\n`;
    } catch {
      return '';
    }
  }

  private renderEmptyState(): void {
    const empty = this.outputEl.createDiv({ cls: 'cortex-chat-empty' });
    const logo = empty.createDiv({ cls: 'cortex-chat-empty-logo' });
    appendHangarxLogo(logo);
    empty.createEl('h2', { cls: 'cortex-chat-empty-title', text: 'Ask your vault anything.' });
    empty.createEl('p', {
      cls: 'cortex-chat-empty-sub',
      text: 'Multi-hop search across your notes — cited, remembered, and shared with every AI agent on your machine.',
    });

    // Tier 1 — daily ritual. Always visible.
    const dailyHeader = empty.createDiv({ cls: 'cortex-chat-suggestion-section' });
    dailyHeader.createSpan({
      cls: 'cortex-chat-suggestion-section-label',
      text: 'Daily ritual',
    });
    const dailyGrid = empty.createDiv({ cls: 'cortex-chat-suggestions' });
    this.renderSuggestionCards(dailyGrid, DAILY_RITUAL_PROMPTS);

    // Tier 2 — full catalog. Opens in a searchable modal so the user can
    // scan dozens of starter ideas without cluttering the empty state.
    const moreSection = empty.createDiv({ cls: 'cortex-chat-suggestions-more' });
    const browseBtn = moreSection.createEl('button', {
      cls: 'cortex-chat-suggestions-toggle',
      attr: { type: 'button' },
    });
    const browseIcon = browseBtn.createSpan({ cls: 'cortex-chat-suggestions-toggle-icon' });
    setIcon(browseIcon, 'sparkles');
    browseBtn.createSpan({ text: 'Browse all starters' });
    browseBtn.addEventListener('click', () => {
      void import('./starters-modal').then((m) => {
        new m.StartersModal(this.app, (text) => this.populateInput(text)).open();
      });
    });
  }

  private renderSuggestionCards(
    parent: HTMLElement,
    prompts: ReadonlyArray<{ icon: string; label: string; text: string }>,
  ): void {
    for (const s of prompts) {
      const card = parent.createDiv({
        cls: 'cortex-chat-suggestion',
        attr: { role: 'button', tabindex: '0' },
      });
      const ic = card.createSpan({ cls: 'cortex-chat-suggestion-icon' });
      setIcon(ic, s.icon);
      const body = card.createDiv({ cls: 'cortex-chat-suggestion-body' });
      body.createDiv({ cls: 'cortex-chat-suggestion-label', text: s.label });
      body.createDiv({ cls: 'cortex-chat-suggestion-text', text: s.text });
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
    this.inputEl.setCssStyles({ height: 'auto' });
    this.inputEl.setCssStyles({ height: `${Math.min(this.inputEl.scrollHeight, 200)}px` });
  }

  private resetConversation(): void {
    this.sessionId = crypto.randomUUID();
    this.hasMessages = false;
    this.currentTurns = [];
    this.currentTitle = '';
    this.currentCreatedAt = 0;
    this.currentStarred = false;
    this.allEntities = [];
    this.allCitations = [];
    this.pendingAttachments = [];
    if (this.attachmentsEl) this.renderAttachmentChips();
    this.outputEl.empty();
    this.renderEmptyState();
    this.inputEl.value = '';
    this.autoResize();
    this.refreshStarBtn();
    this.askBtn.setAttr('disabled', 'true');
    this.exportBtn.addClass('is-hidden');
    this.closeHistoryPopover();
    this.inputEl.focus();
  }

  private toggleHistoryPopover(): void {
    if (this.historyPopover) { this.closeHistoryPopover(); return; }
    void this.openHistoryPopover();
  }

  private async openHistoryPopover(): Promise<void> {
    const parent = this.host.parentEl ?? this.host.contentEl;
    const popover = parent.createDiv({ cls: 'cortex-chat-history-popover' });
    this.historyPopover = popover;
    popover.createDiv({ cls: 'cortex-chat-history-header', text: 'Past conversations' });

    // Persistent search across all stored conversations — matches title
    // OR turn content, debounced via the input event (cheap on lists < 1k).
    const searchWrap = popover.createDiv({ cls: 'cortex-chat-history-search' });
    const searchIcon = searchWrap.createSpan({ cls: 'cortex-chat-history-search-icon' });
    setIcon(searchIcon, 'search');
    const searchInput = searchWrap.createEl('input', {
      cls: 'cortex-chat-history-search-input',
      attr: { type: 'text', placeholder: 'Search title or message text…' },
    });

    const listEl = popover.createDiv({ cls: 'cortex-chat-history-list' });
    listEl.createDiv({ cls: 'cortex-chat-history-empty', text: 'Loading…' });

    activeWindow.setTimeout(() => {
      activeDocument.addEventListener('mousedown', this.onOutsideClick, true);
    }, 0);

    try {
      const conversations = await this.store.list();
      const render = (q: string) => {
        listEl.empty();
        const ql = q.trim().toLowerCase();
        const filtered = ql
          ? conversations.filter(
              (c) =>
                (c.title ?? '').toLowerCase().includes(ql) ||
                c.turns.some((t) => t.content.toLowerCase().includes(ql)),
            )
          : conversations;
        if (filtered.length === 0) {
          listEl.createDiv({
            cls: 'cortex-chat-history-empty',
            text: ql ? `No conversations match "${q}".` : 'No past conversations yet.',
          });
          return;
        }
        for (const c of filtered) this.renderHistoryRow(listEl, c, ql);
      };
      render('');
      searchInput.addEventListener('input', () => render(searchInput.value));
      activeWindow.setTimeout(() => searchInput.focus(), 80);
    } catch (e) {
      listEl.empty();
      listEl.createDiv({ cls: 'cortex-chat-history-empty', text: `Error: ${(e as Error).message}` });
    }
  }

  private onOutsideClick = (evt: MouseEvent): void => {
    if (!this.historyPopover) return;
    const target = evt.target as Node;
    if (this.historyPopover.contains(target) || this.historyBtn.contains(target)) return;
    this.closeHistoryPopover();
  };

  private closeHistoryPopover(): void {
    activeDocument.removeEventListener('mousedown', this.onOutsideClick, true);
    this.historyPopover?.remove();
    this.historyPopover = null;
  }

  private renderHistoryRow(parent: HTMLElement, c: ChatConversation, query: string = ''): void {
    const row = parent.createDiv({ cls: 'cortex-chat-history-row' });
    if (c.id === this.sessionId) row.addClass('is-active');

    const main = row.createDiv({ cls: 'cortex-chat-history-main' });
    main.createDiv({ cls: 'cortex-chat-history-title', text: c.title || '(untitled)' });
    const meta = main.createDiv({ cls: 'cortex-chat-history-meta' });
    meta.createSpan({ text: relativeTime(c.updatedAt) });
    meta.createSpan({ cls: 'cortex-chat-history-dot', text: '·' });
    const turnCount = c.turns.filter(t => t.role === 'user').length;
    meta.createSpan({ text: `${turnCount} message${turnCount === 1 ? '' : 's'}` });
    // When a search query produced a hit inside a turn (not the title),
    // surface a 100-char snippet from the matching turn so the user can
    // tell why this conversation matched.
    if (query) {
      const ql = query.toLowerCase();
      if (!(c.title ?? '').toLowerCase().includes(ql)) {
        const hit = c.turns.find((t) => t.content.toLowerCase().includes(ql));
        if (hit) {
          const idx = hit.content.toLowerCase().indexOf(ql);
          const start = Math.max(0, idx - 30);
          const snippet = (start > 0 ? '…' : '') + hit.content.slice(start, start + 120) + (start + 120 < hit.content.length ? '…' : '');
          main.createDiv({ cls: 'cortex-chat-history-snippet', text: snippet });
        }
      }
    }
    main.addEventListener('click', () => { this.loadConversation(c); });

    const del = row.createEl('button', {
      cls: 'cortex-chat-history-del',
      attr: { 'aria-label': 'Delete conversation', title: 'Delete conversation' },
    });
    // Use a Unicode glyph instead of an SVG/lucide icon. Themes were
    // hiding both setIcon() and inline SVG via .svg-icon overrides;
    // a plain text glyph is rendered as a font character and isn't
    // affected by any svg-targeting CSS.
    del.textContent = '🗑';
    del.addEventListener('click', evt => { void (async () => {
      evt.stopPropagation();
      await this.store.delete(c.id);
      row.remove();
      if (c.id === this.sessionId) this.resetConversation();
    })(); });
  }

  // Synchronous body — no awaits, so we drop `async` to satisfy
  // @typescript-eslint/require-await.
  private loadConversation(c: ChatConversation): void {
    this.closeHistoryPopover();
    this.sessionId = c.id;
    this.currentTurns = [...c.turns];
    this.currentTitle = c.title;
    this.currentCreatedAt = c.createdAt;
    this.currentStarred = !!c.starred;
    this.hasMessages = c.turns.length > 0;

    this.outputEl.empty();
    for (const t of c.turns) {
      if (t.role === 'user') this.renderUserTurn(t.content);
      else this.renderAiTurnFromPayload(t.content, t.payload as AskResponse | undefined);
    }
    this.scrollToBottom();
    this.inputEl.focus();
    this.refreshStarBtn();
  }

  private renderUserTurn(text: string, attachmentSummary?: string): void {
    const userTurn = this.outputEl.createDiv({ cls: 'cortex-chat-turn cortex-chat-user' });
    const userBubble = userTurn.createDiv({ cls: 'cortex-chat-bubble' });
    userBubble.createDiv({ cls: 'cortex-chat-role', text: 'You' });
    userBubble.createDiv({ cls: 'cortex-chat-content', text });
    if (attachmentSummary) {
      userBubble.createDiv({
        cls: 'cortex-chat-content-attachment',
        text: attachmentSummary,
      });
    }
  }

  private renderAiTurnFromPayload(answer: string, payload: AskResponse | undefined): void {
    const aiTurn = this.outputEl.createDiv({ cls: 'cortex-chat-turn cortex-chat-ai' });
    const aiBubble = aiTurn.createDiv({ cls: 'cortex-chat-bubble' });
    aiBubble.createDiv({ cls: 'cortex-chat-role', text: 'HangarX' });
    const bodyEl = aiBubble.createDiv({ cls: 'cortex-chat-body' });
    if (payload) void this.renderResponse(bodyEl, payload);
    else bodyEl.createDiv({ cls: 'cortex-chat-answer', text: answer });
    this.renderTurnActions(aiBubble, answer, payload);
    this.decorateBubble(aiBubble, answer, Date.now());
  }

  /**
   * Add cross-cutting bubble affordances. Hover timestamp on the role
   * label; drag-out was removed because Obsidian's editor and file tree
   * don't accept arbitrary `text/markdown` / `text/plain` drops from
   * foreign DOM elements — they only respond to internal drag types.
   * The drag started but nothing accepted the drop, leaving a phantom
   * affordance. Use the per-bubble Save-to-note action instead.
   */
  private decorateBubble(bubble: HTMLElement, _content: string, createdAt: number): void {
    const roleEl = bubble.querySelector<HTMLElement>('.cortex-chat-role');
    if (!roleEl) return;
    const refreshTitle = () => {
      roleEl.title = `${relativeTime(createdAt)} · ${new Date(createdAt).toLocaleString()}`;
    };
    refreshTitle();
    // Refresh once on hover so the relative time is current.
    roleEl.addEventListener('mouseenter', refreshTitle);
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
      starred: this.currentStarred,
    };
    await this.store.upsert(conversation).catch(e => console.warn('[Cortex] Save chat failed:', e));
  }

  /**
   * Toggle the star flag on the current conversation, persist, and
   * update the button visual. Closes the onboarding "star a useful
   * query" milestone the first time it's set.
   */
  private async toggleStarred(): Promise<void> {
    this.currentStarred = !this.currentStarred;
    this.refreshStarBtn();
    await this.persistConversation();
    new Notice(this.currentStarred ? '★ Starred — saved to your library' : 'Star removed');
  }

  /**
   * Show / hide the star button + reflect filled-vs-outline state.
   * Hidden until at least one assistant turn exists (nothing to star).
   */
  private refreshStarBtn(): void {
    if (!this.starBtn) return;
    const hasAiTurn = this.currentTurns.some((t) => t.role === 'ai');
    this.starBtn.toggleClass('is-hidden', !hasAiTurn);
    this.starBtn.toggleClass('is-on', !!this.currentStarred);
    this.starBtn.empty();
    setIcon(this.starBtn, this.currentStarred ? 'star' : 'star');
    this.starBtn.title = this.currentStarred ? 'Remove star' : 'Star this conversation';
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
      const aiTurn = this.outputEl.createDiv({ cls: 'cortex-chat-turn cortex-chat-ai' });
      const aiBubble = aiTurn.createDiv({ cls: 'cortex-chat-bubble' });
      aiBubble.createDiv({ cls: 'cortex-chat-role', text: 'HangarX' });
      const bodyEl = aiBubble.createDiv({ cls: 'cortex-chat-body' });
      const thinkingEl = bodyEl.createDiv({ cls: 'cortex-chat-thinking', text: 'Ingesting URL…' });
      this.scrollToBottom();
      try {
        const result = await this.client.ingestUrl(query);
        thinkingEl.remove();
        const msg = `✅ Ingested **${query}** into your knowledge graph. ${result.entityCount ? `Extracted ${result.entityCount} entities.` : ''}`;
        const answerEl = bodyEl.createDiv({ cls: 'cortex-chat-answer' });
        await this.safeRenderMarkdown(msg, answerEl);
        this.currentTurns.push({ role: 'ai', content: msg });
        this.exportBtn.removeClass('is-hidden');
        this.refreshStarBtn();
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

    const aiTurn = this.outputEl.createDiv({ cls: 'cortex-chat-turn cortex-chat-ai' });
    const aiBubble = aiTurn.createDiv({ cls: 'cortex-chat-bubble' });
    aiBubble.createDiv({ cls: 'cortex-chat-role', text: 'HangarX' });
    const bodyEl = aiBubble.createDiv({ cls: 'cortex-chat-body' });

    // Thinking pill. A 5-minute hard client-side timeout aborts the
    // in-flight request so a frozen server can't hang the UI forever
    // — the resulting AbortError is rendered as a friendly "Request
    // stopped" card with a retry CTA.
    const thinkingRow = bodyEl.createDiv({ cls: 'cortex-chat-thinking-row' });
    const thinkingEl = thinkingRow.createDiv({ cls: 'cortex-chat-thinking', text: 'Thinking' });

    const HARD_TIMEOUT_MS = 5 * 60 * 1000;
    const abortController = new AbortController();
    const timeoutHandle = window.setTimeout(() => {
      abortController.abort();
    }, HARD_TIMEOUT_MS);

    // Phase-label updater. Swaps the text with a quick fade so the
    // user perceives it as movement, not a jolt. Skips no-op updates
    // so every event firing the same phase doesn't trigger a flicker.
    let lastPhase = 'Thinking';
    const setPhase = (phase: string) => {
      if (phase === lastPhase) return;
      lastPhase = phase;
      thinkingEl.classList.add('is-changing');
      window.setTimeout(() => {
        thinkingEl.setText(phase);
        thinkingEl.classList.remove('is-changing');
      }, 130);
    };

    this.scrollToBottom();

    try {
      const [recalled, activeFileContext] = await Promise.all([
        this.client.recall(query, 5).catch(() => []),
        this.buildActiveFileContext(),
      ]);
      const recallPrefix = recalled.length > 0
        ? `Relevant prior context (from past sessions):\n${recalled.map(m => `- ${m.content}`).join('\n')}\n\n`
        : '';
      const prefix = activeFileContext + recallPrefix + (recalled.length > 0 ? 'Question: ' : '');

      // Streaming path: agent mode + chatStream setting on. We mount a
      // live trace container above the answer where each tool-call event
      // gets its own card as it arrives. The legacy non-streaming path
      // still drives the rest of the rendering (entities, documents,
      // citations) since those come from the integrated `/chat/answer`
      // pipeline; the stream endpoint exposes only the agent loop.
      //
      // Fast path: when the user has agent mode on but the query looks
      // like a simple fact lookup, skip the agent loop entirely and
      // route through the single-pass RAG path. The agent loop's
      // 5+ LLM round-trips are pure latency tax for queries that don't
      // need multi-step reasoning. ~70% of queries qualify.
      const isSimple = isSimpleQuery(promptText);
      const useStream =
        this.settings.chatAgentMode === 'agent' &&
        this.settings.chatStream &&
        !(this.settings.chatAutoFastPath !== false && isSimple);
      if (this.settings.chatAgentMode === 'agent' && isSimple && this.settings.chatAutoFastPath !== false) {
        // Surface why we picked the fast path so users can spot when
        // their query is being mis-classified and disable the override.
        thinkingEl.setText('Thinking… (fast path — simple query)');
      }
      let res: AskResponse;
      if (useStream) {
        // Streaming branch keeps the phase pill alive throughout the run
        // and retitles it as harness events arrive — see setPhase below.
        // It only goes away once the first text chunk lands.
        const liveTrace = bodyEl.createDiv({ cls: 'cortex-chat-toolcalls cortex-chat-toolcalls-live' });
        const answerLive = bodyEl.createDiv({ cls: 'cortex-chat-answer cortex-chat-answer-streaming' });
        answerLive.addClass('is-hidden');
        let streamedText = '';
        let streamRenderTimer: number | null = null;
        const cardForToolCall = new Map<string, { details: HTMLDetailsElement; meta: HTMLSpanElement }>();
        // Sub-runs are paired by goal text; the harness fires start/end
        // events back-to-back inside one `delegate` tool call, so a
        // simple FIFO queue keyed on goal works without needing a
        // dedicated subrunId on the wire.
        const pendingSubruns = new Map<string, { details: HTMLDetailsElement; meta: HTMLSpanElement }>();
        // Per-iteration timing — surfaces a small chip before each
        // iteration's tool calls showing how long the previous LLM
        // round-trip took. Lets users see WHERE the time is going
        // ("4s on iteration 2 → switch to a faster driver model").
        const iterationStart = new Map<number, number>();
        let iterationChipEl: HTMLElement | null = null;
        const streamStart = Date.now();
        res = await this.client.askStream(prefix + promptText, (ev: AgentStreamEvent) => {
          if (ev.kind === 'iteration') {
            // First iteration is "Thinking"; later iterations are
            // "Reasoning…" since the agent is now working with tool
            // results from prior steps.
            setPhase(ev.iteration === 0 ? 'Thinking' : 'Reasoning');
            const now = Date.now();
            // Close out the previous iteration's chip with the elapsed
            // time, then open a new one.
            if (iterationChipEl) {
              const prevIter = ev.iteration - 1;
              const prevStart = iterationStart.get(prevIter) ?? streamStart;
              iterationChipEl.setText(`Step ${prevIter + 1} · ${formatToolDuration(now - prevStart)}`);
              iterationChipEl.removeClass('is-running');
            }
            const chip = liveTrace.createDiv({ cls: 'cortex-chat-iter-chip is-running' });
            chip.setText(`Step ${ev.iteration + 1} · running…`);
            iterationChipEl = chip;
            iterationStart.set(ev.iteration, now);
          } else if (ev.kind === 'tool-start') {
            setPhase(toolPhasePhrase(ev.name));
            const key = ev.toolCallId ?? `${ev.iteration}:${ev.name}:${cardForToolCall.size}`;
            const details = liveTrace.createEl('details', { cls: 'cortex-chat-toolcall is-running' });
            details.setAttribute('open', '');
            const summary = details.createEl('summary');
            const ic = summary.createSpan({ cls: 'cortex-chat-toolcall-icon' });
            setIcon(ic, toolCallIcon(ev.name));
            summary.createSpan({ cls: 'cortex-chat-toolcall-name', text: prettifyToolCallName(ev.name) });
            const argText = summarizeToolCallArgs(ev.name, ev.args);
            if (argText) summary.createSpan({ cls: 'cortex-chat-toolcall-args', text: argText });
            const meta = summary.createSpan({ cls: 'cortex-chat-toolcall-meta', text: 'Running…' });
            cardForToolCall.set(key, { details, meta });
          } else if (ev.kind === 'tool-end') {
            const key = ev.toolCallId ?? `${ev.iteration}:${ev.name}:${cardForToolCall.size - 1}`;
            const card = cardForToolCall.get(key);
            if (card) {
              card.details.removeClass('is-running');
              if (!ev.ok) card.details.addClass('is-error');
              else if (ev.durationMs > 5000) card.details.addClass('is-slow');
              card.meta.setText(`${ev.ok ? '' : '⚠ '}${formatToolDuration(ev.durationMs)}`);
              const body = card.details.createDiv({ cls: 'cortex-chat-toolcall-body' });
              const pre = body.createEl('pre');
              pre.createEl('code', { text: JSON.stringify(ev.ok ? ev.result : ev.error, null, 2) ?? '' });
              card.details.removeAttribute('open');
            }
          } else if (ev.kind === 'subrun-start') {
            setPhase('Delegating to sub-agent');
            // Render nested under the most recently opened tool-call
            // card (delegate's). Indent visually so the parent/child
            // relationship is immediately legible.
            const lastCard = Array.from(cardForToolCall.values()).pop();
            const host = lastCard?.details.createDiv({ cls: 'cortex-chat-subrun-host' })
              ?? liveTrace.createDiv({ cls: 'cortex-chat-subrun-host' });
            const details = host.createEl('details', { cls: 'cortex-chat-toolcall cortex-chat-subrun is-running' });
            details.setAttribute('open', '');
            const summary = details.createEl('summary');
            const ic = summary.createSpan({ cls: 'cortex-chat-toolcall-icon' });
            setIcon(ic, 'corner-down-right');
            summary.createSpan({ cls: 'cortex-chat-toolcall-name', text: 'Sub-agent' });
            const goalSpan = summary.createSpan({ cls: 'cortex-chat-toolcall-args' });
            goalSpan.setText(ev.goal.length > 80 ? `${ev.goal.slice(0, 80)}…` : ev.goal);
            const meta = summary.createSpan({ cls: 'cortex-chat-toolcall-meta', text: 'Running…' });
            pendingSubruns.set(ev.goal, { details, meta });
          } else if (ev.kind === 'subrun-end') {
            const card = pendingSubruns.get(ev.goal);
            if (card) {
              card.details.removeClass('is-running');
              if (!ev.ok) card.details.addClass('is-error');
              else if (ev.durationMs > 5000) card.details.addClass('is-slow');
              card.meta.setText(`${ev.ok ? '' : '⚠ '}${ev.iterations} iter · ${formatToolDuration(ev.durationMs)}`);
              const body = card.details.createDiv({ cls: 'cortex-chat-toolcall-body cortex-chat-subrun-body' });
              if (ev.answer) {
                body.createDiv({ cls: 'cortex-chat-subrun-answer', text: ev.answer });
              }
              if (ev.childRunId && this.settings.connectionMode === 'cloud') {
                const link = body.createEl('a', {
                  cls: 'cortex-chat-agent-link',
                  href: this.dashboardRunUrl(ev.childRunId),
                  text: 'View sub-run →',
                });
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener');
              }
              if (ev.error) {
                body.createEl('pre').createEl('code', { text: ev.error });
              }
              card.details.removeAttribute('open');
              pendingSubruns.delete(ev.goal);
            }
          } else if (ev.kind === 'text') {
            // First text chunk → answer is streaming. Drop the phase
            // pill and reveal the live answer pane.
            if (streamedText.length === 0) {
              thinkingEl.remove();
              answerLive.removeClass('is-hidden');
              // Finalize the last iteration chip with its elapsed time.
              if (iterationChipEl && iterationChipEl.hasClass('is-running')) {
                const lastIter = Math.max(...iterationStart.keys(), 0);
                const start = iterationStart.get(lastIter) ?? streamStart;
                iterationChipEl.setText(`Step ${lastIter + 1} · ${formatToolDuration(Date.now() - start)}`);
                iterationChipEl.removeClass('is-running');
              }
            }
            streamedText += ev.content;
            // Progressive markdown render — debounced so we don't pay
            // the parse cost on every 20-token chunk. Citations are
            // empty during the stream (the response payload arrives
            // only at the end), so the post-processor is cheap; once
            // the polished render replaces this on completion, full
            // citation pills materialize in place.
            if (streamRenderTimer != null) window.clearTimeout(streamRenderTimer);
            streamRenderTimer = window.setTimeout(() => {
              void this.safeRenderMarkdown(streamedText, answerLive, [], []);
              answerLive.addClass('cortex-chat-answer-streaming');
              this.scrollToBottom();
            }, 120);
            this.scrollToBottom();
          } else if (ev.kind === 'error') {
            new Notice(`Agent error: ${ev.message}`);
          }
        }, {
          skill: this.settings.chatAgentSkill,
          webSearch: this.settings.chatAgentWebSearch,
          signal: abortController.signal,
          // Pass prior turns so multi-turn replies like "yes" make sense.
          // The last turn is the current user message (already pushed
          // before this call) — slice it off because the server adds it
          // via `message`. Cap remaining to last 20 turns to bound cost.
          history: this.currentTurns
            .slice(0, -1)
            .slice(-20)
            .map((t) => ({
              role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
              content: t.content,
            })),
        });
        // Safety: if the run completed without ever emitting `text`
        // events (some providers send the whole answer in `done`), the
        // pill may still be in the DOM here. Remove it before the
        // polished render replaces everything.
        if (thinkingEl.isConnected) thinkingEl.remove();
        // Replace the streaming placeholders with the polished render
        // pipeline (markdown answer, entity links, follow-ups, etc.).
        if (streamRenderTimer != null) window.clearTimeout(streamRenderTimer);
        liveTrace.remove();
        answerLive.remove();
        await this.renderResponse(bodyEl, res);
      } else {
        // Non-streaming branch — no events to drive the phase, so cycle
        // through a generic phrase list every ~1.6s. Mirrors the kind of
        // multi-stage activity feedback users see in the streaming path.
        const phrases = ['Thinking', 'Searching vault', 'Reading context', 'Querying knowledge graph', 'Generating response'];
        let pIdx = 0;
        const ticker = window.setInterval(() => {
          pIdx = (pIdx + 1) % phrases.length;
          setPhase(phrases[pIdx]);
        }, 1600);
        try {
          res = await this.client.ask(prefix + promptText, this.sessionId);
        } finally {
          window.clearInterval(ticker);
        }
        thinkingEl.remove();
        await this.renderResponse(bodyEl, res);
      }
      if (recalled.length > 0) this.renderRecalledMemories(bodyEl, recalled.length);

      if (res.entities?.length) this.allEntities.push(...res.entities);
      if (res.citations?.length) this.allCitations.push(...res.citations);

      this.renderTurnActions(aiBubble, res.answer, res);
      this.decorateBubble(aiBubble, res.answer, Date.now());

      // Auto-highlight on graph if the user has the persistent toggle on.
      // Fire-and-forget — don't block the chat flow on graph rendering.
      if (this.settings.autoShowAnswerOnGraph && res.entities?.length) {
        void this.showEntitiesOnGraph(res.entities);
      }

      this.currentTurns.push({ role: 'ai', content: res.answer, payload: res });
      this.exportBtn.removeClass('is-hidden');
      this.refreshStarBtn();
      void this.persistConversation();

      if (this.settings.autoSaveChatToVault) {
        void this.client.remember(`Q: ${query}\nA: ${res.answer.slice(0, 800)}`, 'conversation').catch(() => undefined);
      }
    } catch (e) {
      // Distinguish hard-timeout abort from genuine errors. The
      // AbortError fires when the 5-min client-side timeout trips;
      // friendlier messaging + the retry CTA fits either path.
      const isAbort = (e as Error)?.name === 'AbortError'
        || /aborted/i.test((e as Error)?.message ?? '');
      if (thinkingRow.isConnected) thinkingRow.remove();
      this.renderErrorCard(
        bodyEl,
        isAbort ? new Error('The server didn\'t respond within 5 minutes. Try again, or check the cortex-api logs.') : e,
        isAbort ? 'Request timed out' : "Couldn't answer your question",
        () => {
          aiTurn.remove();
          this.currentTurns.pop();
          this.inputEl.value = query;
          void this.submit();
        },
      );
    } finally {
      // Always clear the hard-timeout handle and tear down the pill row
      // so a follow-up turn doesn't inherit a stale spinner. Cleared
      // here (vs. the success/error branches) so every code path is
      // covered, including ones that bubble out via re-entry.
      window.clearTimeout(timeoutHandle);
      if (thinkingRow.isConnected) thinkingRow.remove();
      if (this.inputEl.value.trim().length > 0) this.askBtn.removeAttribute('disabled');
      this.scrollToBottom();
    }
  }

  private async renderResponse(parent: HTMLElement, res: AskResponse): Promise<void> {
    if (res.confidence > 0) {
      const meta = parent.createDiv({ cls: 'cortex-chat-meta' });
      const conf = meta.createSpan({ cls: 'cortex-chat-pill cortex-chat-pill-confidence' });
      conf.setText(`${Math.round(res.confidence * 100)}% confidence`);
    }

    // Agent-mode tool-call trace renders before the answer so users can see
    // what the agent did (and click to verify the underlying data) before
    // they read the synthesized response. Empty in legacy RAG mode.
    if (res.toolCalls && res.toolCalls.length > 0) {
      this.renderToolCallTrace(parent, res.toolCalls);
    }

    // L7/L9 — when the run has a persisted runId, surface a compact
    // metadata strip with token totals + per-iteration breakdown count
    // and a click-through to the dashboard's replay viewer. Only shown
    // for runs that actually went through the harness.
    if (res.runId || (res.iterationTokens && res.iterationTokens.length > 0)) {
      this.renderAgentRunMeta(parent, res);
    }

    const answerEl = parent.createDiv({ cls: 'cortex-chat-answer' });
    const answerText = res.answer?.trim();
    if (answerText) {
      await this.safeRenderMarkdown(answerText, answerEl, res.citations ?? [], res.entities ?? []);
    } else {
      // Render an actionable empty-answer card instead of a near-
      // invisible "_No answer returned._" italic. Names the stop
      // reason ('max-iterations' / 'max-tool-calls' / 'budget-
      // exceeded') so the user knows why the agent stopped, and links
      // to the run detail page for the full trace.
      const reason = res.reason ?? 'unknown';
      const reasonExplanation: Record<string, string> = {
        'max-iterations': 'The agent ran the maximum number of reasoning steps (probably searching deeply) before producing a final answer.',
        'max-tool-calls': 'The agent ran the maximum number of tool calls before producing a final answer.',
        'budget-exceeded': 'The agent ran out of wall-clock time before producing a final answer.',
        'repeat-loop': 'The agent kept calling the same tool with the same arguments and was stopped to avoid an infinite loop.',
        'aborted': 'The request was cancelled.',
        'error': 'The agent run errored before producing an answer.',
        'unknown-tool': 'The agent tried to call a tool that isn\'t available.',
      };
      const empty = answerEl.createDiv({ cls: 'cortex-chat-empty-answer' });
      empty.createDiv({
        cls: 'cortex-chat-empty-answer-title',
        text: `No final answer (stop reason: ${reason})`,
      });
      empty.createDiv({
        cls: 'cortex-chat-empty-answer-hint',
        text: reasonExplanation[reason] ?? 'The agent stopped without producing a final answer.',
      });
      empty.createDiv({
        cls: 'cortex-chat-empty-answer-hint',
        text: 'Try a more focused question, or open the run trace below to see what the agent searched for.',
      });
    }

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
  /**
   * Render a list of "🔍 Searched vault for X — 4 results, 320ms" cards
   * above the answer when agent mode is on. Each card is a `<details>` so
   * power users can expand to see the raw args + result; everyone else
   * gets a clean one-line summary that signals what the agent actually did.
   */
  private renderToolCallTrace(parent: HTMLElement, toolCalls: NonNullable<AskResponse['toolCalls']>): void {
    const wrap = parent.createDiv({ cls: 'cortex-chat-toolcalls' });

    // Group consecutive calls with the same name so a 3x kg_search burst
    // collapses to one header row + 3 child rows. Scanability win on long
    // runs without losing the click-to-expand-per-call behavior.
    type Group = { name: string; calls: typeof toolCalls };
    const groups: Group[] = [];
    for (const tc of toolCalls) {
      const last = groups[groups.length - 1];
      if (last && last.name === tc.name) last.calls.push(tc);
      else groups.push({ name: tc.name, calls: [tc] });
    }

    const renderRow = (
      host: HTMLElement,
      tc: typeof toolCalls[number],
      opts: { compact?: boolean } = {},
    ) => {
      const details = host.createEl('details', { cls: 'cortex-chat-toolcall' });
      if (!tc.ok) details.addClass('is-error');
      else if (tc.durationMs > 5000) details.addClass('is-slow');
      if (opts.compact) details.addClass('is-grouped-child');
      const summary = details.createEl('summary');
      const ic = summary.createSpan({ cls: 'cortex-chat-toolcall-icon' });
      setIcon(ic, toolCallIcon(tc.name));
      // Always render the name + args. Even in grouped-child rows the
      // user wants to see WHICH search produced WHICH duration — hiding
      // the name leaves the row reading like a bare timer.
      summary.createSpan({ cls: 'cortex-chat-toolcall-name', text: prettifyToolCallName(tc.name) });
      const argText = summarizeToolCallArgs(tc.name, tc.args);
      if (argText) summary.createSpan({ cls: 'cortex-chat-toolcall-args', text: argText });
      summary.createSpan({
        cls: 'cortex-chat-toolcall-meta',
        text: `${tc.ok ? '' : '⚠ '}${formatToolDuration(tc.durationMs)}`,
      });
      const body = details.createDiv({ cls: 'cortex-chat-toolcall-body' });
      const pre = body.createEl('pre');
      pre.createEl('code', {
        text: JSON.stringify(tc.ok ? tc.result : tc.error, null, 2) ?? '',
      });
    };

    for (const g of groups) {
      if (g.calls.length === 1) {
        renderRow(wrap, g.calls[0]);
        continue;
      }
      const totalMs = g.calls.reduce((s, c) => s + c.durationMs, 0);
      const anyError = g.calls.some(c => !c.ok);
      const anySlow = g.calls.some(c => c.durationMs > 5000);
      const groupHost = wrap.createDiv({ cls: 'cortex-chat-toolcall-group' });
      if (anyError) groupHost.addClass('is-error');
      else if (anySlow) groupHost.addClass('is-slow');
      const header = groupHost.createDiv({ cls: 'cortex-chat-toolcall-group-header' });
      const ic = header.createSpan({ cls: 'cortex-chat-toolcall-icon' });
      setIcon(ic, toolCallIcon(g.name));
      header.createSpan({
        cls: 'cortex-chat-toolcall-name',
        text: `${prettifyToolCallName(g.name)} × ${g.calls.length}`,
      });
      header.createSpan({
        cls: 'cortex-chat-toolcall-meta',
        text: formatToolDuration(totalMs),
      });
      const childHost = groupHost.createDiv({ cls: 'cortex-chat-toolcall-group-children' });
      for (const tc of g.calls) renderRow(childHost, tc, { compact: true });
    }
  }

  /**
   * Compact agent-run metadata strip. Renders just below the tool-call
   * trace when the harness returned a runId or per-iteration tokens.
   * The "View run" link points at the dashboard's replay viewer so the
   * user can drill into a stuck conversation without leaving Obsidian
   * to hand-craft a URL.
   */
  private renderAgentRunMeta(parent: HTMLElement, res: AskResponse): void {
    const wrap = parent.createDiv({ cls: 'cortex-chat-agent-meta' });
    if (res.iterationTokens && res.iterationTokens.length > 0) {
      const total = res.tokenUsage?.total ?? res.iterationTokens.reduce((s, it) => s + it.total, 0);
      const tokenChip = wrap.createSpan({ cls: 'cortex-chat-agent-chip' });
      tokenChip.setText(`${res.iterationTokens.length} iter · ${total.toLocaleString()} tokens`);
      tokenChip.setAttribute(
        'title',
        res.iterationTokens
          .map(it => `iter ${it.iteration}: ${it.total.toLocaleString()} (in ${it.prompt.toLocaleString()} / out ${it.completion.toLocaleString()})`)
          .join('\n'),
      );
    }
    if (res.reason && res.reason !== 'completed') {
      const reasonChip = wrap.createSpan({ cls: 'cortex-chat-agent-chip cortex-chat-agent-chip-warn' });
      reasonChip.setText(res.reason);
    }
    // "View run" → cloud-only. The replay viewer lives on the hosted
    // dashboard (`app.HangarX.ai/agents/runs/<id>`); local-mode runs
    // have no equivalent UI, so showing the link there leads to a 404.
    // Gate on connectionMode rather than guessing from apiUrl so users
    // self-hosting against the cloud schema (rare) still see it.
    if (res.runId && this.settings.connectionMode === 'cloud') {
      const dashUrl = this.dashboardRunUrl(res.runId);
      const link = wrap.createEl('a', {
        cls: 'cortex-chat-agent-link',
        href: dashUrl,
        text: 'View run →',
      });
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
      link.setAttribute('title', `Open run ${res.runId} in the dashboard's replay viewer`);
    }
  }

  /** Resolve the dashboard URL for an agent run. Cloud users land on
   *  https://app.HangarX.com/agents/runs/<id>; self-hosted users get
   *  the API base URL with `/agents/runs/<id>` appended (which won't
   *  always exist, but matches the convention). */
  private dashboardRunUrl(runId: string): string {
    const base = this.settings.apiUrl?.trim().replace(/\/$/, '') ?? '';
    if (base.includes('HangarX.ai') || base.includes('HangarX.com') || base.includes('cortex')) {
      // Cloud or canonical install — point at the web app domain.
      return `https://app.HangarX.com/agents/runs/${runId}`;
    }
    return `${base}/agents/runs/${runId}`;
  }

  private renderRetrievalDiagnostic(parent: HTMLElement, res: AskResponse): void {
    const retrieval = (res.metadata as Record<string, unknown> | undefined)?.retrieval as
      | { entities?: number; chunks?: number; communities?: number; analytics?: number; memories?: number }
      | undefined;
    if (!retrieval) return;

    const wrap = parent.createDiv({ cls: 'cortex-chat-retrieval-diag' });
    wrap.createDiv({
      cls: 'cortex-chat-retrieval-diag-title',
      text: 'Why is confidence low?',
    });

    const counts = wrap.createDiv({ cls: 'cortex-chat-retrieval-diag-counts' });
    const entries: Array<[string, number]> = [
      ['entities', retrieval.entities ?? 0],
      ['chunks', retrieval.chunks ?? 0],
      ['communities', retrieval.communities ?? 0],
      ['analytics', retrieval.analytics ?? 0],
      ['memories', retrieval.memories ?? 0],
    ];
    for (const [name, count] of entries) {
      const pill = counts.createSpan({ cls: 'cortex-chat-retrieval-pill' });
      if (count === 0) pill.addClass('is-empty');
      pill.createSpan({ cls: 'cortex-chat-retrieval-pill-name', text: name });
      pill.createSpan({ cls: 'cortex-chat-retrieval-pill-count', text: String(count) });
    }

    // Tailored hint — the most common failure mode is empty communities after
    // a fast-mode reingest. Surface that fix prominently.
    const hint = wrap.createDiv({ cls: 'cortex-chat-retrieval-diag-hint' });
    if ((retrieval.communities ?? 0) === 0 && (retrieval.entities ?? 0) > 0) {
      hint.createSpan({
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
        }).commands.executeCommandById('hangarx:cortex-1c-rebuild-graph');
      });
    } else if ((retrieval.entities ?? 0) === 0 && (retrieval.chunks ?? 0) === 0) {
      hint.createSpan({
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
        }).commands.executeCommandById('hangarx:cortex-1b-resync-all');
      });
      hint.appendText('.');
    } else {
      hint.createSpan({
        text: 'Retrieval found content but the model wasn\'t confident. Try rephrasing to mention specific entities or note titles.',
      });
    }
  }

  private renderEntities(parent: HTMLElement, entities: AskEntity[]): void {
    // Section is collapsed by default — entities/sources lists are reference
    // detail, not the primary answer. Users expand when they want to drill in.
    const section = this.collapsibleSection(parent, `Entities (${entities.length})`, false);
    const grid = section.createDiv({ cls: 'cortex-chat-entities' });
    const byType = new Map<string, AskEntity[]>();
    for (const e of entities) {
      const arr = byType.get(e.type) ?? [];
      arr.push(e);
      byType.set(e.type, arr);
    }
    for (const [type, list] of byType) {
      const group = grid.createDiv({ cls: 'cortex-chat-entity-group' });
      group.createDiv({ cls: 'cortex-chat-entity-type', text: type });
      const chips = group.createDiv({ cls: 'cortex-chat-chips' });
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
            void this.app.workspace.getLeaf(false).openFile(target);
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
    const list = section.createDiv({ cls: 'cortex-chat-docs' });
    for (const d of documents) {
      const row = list.createDiv({ cls: 'cortex-chat-doc' });
      const header = row.createDiv({ cls: 'cortex-chat-doc-header' });
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
            void this.app.workspace.getLeaf(false).openFile(file as import('obsidian').TFile);
            this.host.onNavigate();
          }
        });
      }
      if (typeof d.matchPercent === 'number') {
        header.createSpan({ cls: 'cortex-chat-pill cortex-chat-pill-match', text: `${d.matchPercent}%` });
      }
      const subParts: string[] = [];
      if (d.source) subParts.push(d.source);
      if (d.publishDate) subParts.push(d.publishDate);
      if (subParts.length > 0) row.createDiv({ cls: 'cortex-chat-doc-sub', text: subParts.join(' · ') });
      if (d.snippet) row.createDiv({ cls: 'cortex-chat-doc-snippet', text: d.snippet });
    }
  }

  private renderCitations(parent: HTMLElement, citations: AskCitation[]): void {
    // Sources panel collapsed by default — same reasoning as Entities/Documents.
    const section = this.collapsibleSection(parent, `Sources (${citations.length})`, false);
    section.addClass('cortex-chat-citations');
    const chips = section.createDiv({ cls: 'cortex-chat-chips' });
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
            void this.app.workspace.getLeaf(false).openFile(target);
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

  /**
   * Render markdown into `target` with defensive fallback + post-processing.
   * Obsidian's MarkdownRenderer can throw on rare assistant outputs —
   * top-level `<html>` tags, certain malformed embeds, or anything that
   * resolves to appending a Document node ("Only one element on document
   * allowed"). Rather than killing the whole answer with an error card,
   * sanitize suspicious top-level HTML, retry once, and finally degrade
   * to a preformatted text dump that always renders.
   *
   * After successful render, runs two post-processors:
   *   1. inline citation pills (`[1]` → clickable badge linking to the
   *      matching `citations[0]` entry)
   *   2. code-block toolbar (Copy + Save-to-note buttons over each <pre>)
   */
  private async safeRenderMarkdown(
    text: string,
    target: HTMLElement,
    citations: AskCitation[] = [],
    entities: AskEntity[] = [],
  ): Promise<void> {
    const tryRender = async (md: string) => {
      target.empty();
      await MarkdownRenderer.render(this.app, md, target, '', this.renderComponent);
    };
    try {
      await tryRender(text);
    } catch (err) {
      console.warn('[Cortex] markdown render failed, retrying with sanitized input:', err);
      try {
        // Strip the most common offenders: doctype declarations and
        // top-level <html>/<head>/<body> tags. Keep their inner content.
        const sanitized = text
          .replace(/<!doctype[^>]*>/gi, '')
          .replace(/<\/?(html|head|body)\b[^>]*>/gi, '')
          .trim();
        await tryRender(sanitized);
      } catch (err2) {
        console.warn('[Cortex] markdown render failed after sanitize, falling back to plaintext:', err2);
        target.empty();
        target.createEl('pre', { cls: 'cortex-chat-answer-plaintext', text });
        return;
      }
    }
    // Post-process: entity highlight, citations, code toolbar, wikilink
    // hover preview. The previous "In this answer" mini-TOC was removed
    // because it cluttered the chat for essay-length responses without
    // adding much value — Obsidian's editor scroll handles navigation.
    if (entities.length > 0) this.highlightEntities(target, entities);
    if (citations.length > 0) this.linkifyCitations(target, citations);
    this.addCodeBlockToolbars(target);
    this.attachWikilinkPreviews(target);
  }

  /**
   * Bold + link the FIRST occurrence of each entity name in the rendered
   * answer. Subsequent mentions stay as plain text so the page doesn't
   * get visually noisy. Skips text inside code/pre/a/citation pills.
   */
  private highlightEntities(root: HTMLElement, entities: AskEntity[]): void {
    if (entities.length === 0) return;
    // Match longer names first so "Cortex Graph Core" wins over "Cortex".
    const names = [...new Set(entities.map((e) => e.name).filter((n) => n && n.length >= 3))]
      .sort((a, b) => b.length - a.length);
    const pending = new Set(names);
    const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const t = node as Text;
      const parent = t.parentElement;
      if (!parent) continue;
      if (parent.closest('code, pre, a, h1, h2, h3, h4, h5, h6, .cortex-chat-citation-inline')) continue;
      textNodes.push(t);
    }
    for (const t of textNodes) {
      if (pending.size === 0) break;
      let data = t.data;
      let matched: { idx: number; name: string } | null = null;
      for (const name of pending) {
        const idx = data.toLowerCase().indexOf(name.toLowerCase());
        if (idx >= 0 && (!matched || idx < matched.idx)) matched = { idx, name };
      }
      if (!matched) continue;
      const { idx, name } = matched;
      pending.delete(name);
      const before = data.slice(0, idx);
      const exact = data.slice(idx, idx + name.length);
      const after = data.slice(idx + name.length);
      const frag = activeDocument.createDocumentFragment();
      if (before) frag.appendChild(activeDocument.createTextNode(before));
      const mark = activeDocument.createElement('strong');
      mark.className = 'cortex-chat-entity-highlight';
      mark.textContent = exact;
      mark.title = `Entity: ${name}`;
      frag.appendChild(mark);
      if (after) frag.appendChild(activeDocument.createTextNode(after));
      t.replaceWith(frag);
    }
  }

  /**
   * Wire hover previews onto Obsidian internal-link anchors. When the
   * user pauses over an `[[Note]]` reference rendered as a link, fetch
   * the first ~240 chars of the target file and surface them in a
   * lightweight popover. Cleans up on mouseleave / blur.
   */
  private attachWikilinkPreviews(root: HTMLElement): void {
    const links = root.querySelectorAll('a.internal-link');
    links.forEach((el) => {
      const link = el as HTMLAnchorElement;
      const target = link.getAttribute('href') ?? link.getAttribute('data-href') ?? link.textContent ?? '';
      if (!target) return;
      let popover: HTMLElement | null = null;
      let hoverTimer: number | null = null;
      const show = async () => {
        const file = this.app.metadataCache.getFirstLinkpathDest(target.replace(/^\[\[|\]\]$/g, ''), '');
        if (!file) return;
        const content = await this.app.vault.cachedRead(file).catch(() => '');
        if (!content) return;
        popover = activeDocument.createElement('div');
        popover.className = 'cortex-chat-wikilink-preview';
        popover.createDiv({ cls: 'cortex-chat-wikilink-preview-title', text: file.basename });
        popover.createDiv({ cls: 'cortex-chat-wikilink-preview-body', text: content.slice(0, 240) + (content.length > 240 ? '…' : '') });
        const rect = link.getBoundingClientRect();
        popover.style.left = `${rect.left}px`;
        popover.style.top = `${rect.bottom + 6}px`;
        activeDocument.body.appendChild(popover);
      };
      const hide = () => {
        if (hoverTimer !== null) {
          window.clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        if (popover) {
          popover.remove();
          popover = null;
        }
      };
      link.addEventListener('mouseenter', () => {
        hoverTimer = window.setTimeout(() => void show(), 350);
      });
      link.addEventListener('mouseleave', hide);
      link.addEventListener('blur', hide);
    });
  }

  /**
   * Replace `[N]` markers in the rendered answer with clickable citation
   * pills that resolve to `citations[N-1]`. Out-of-range indices are
   * left as plain text so we don't accidentally swallow legitimate
   * `[token]` content (e.g. log timestamps).
   */
  private linkifyCitations(root: HTMLElement, citations: AskCitation[]): void {
    const re = /\[(\d{1,3})\]/g;
    const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const t = node as Text;
      // Skip text inside <code> / <pre> / <a> — we don't want to mangle
      // log lines, code samples, or already-linked content.
      const parent = t.parentElement;
      if (!parent) continue;
      if (parent.closest('code, pre, a')) continue;
      if (re.test(t.data)) targets.push(t);
      re.lastIndex = 0;
    }
    for (const t of targets) {
      const parts: (string | HTMLElement)[] = [];
      let lastIdx = 0;
      let m: RegExpExecArray | null;
      const localRe = /\[(\d{1,3})\]/g;
      while ((m = localRe.exec(t.data))) {
        const idx = parseInt(m[1], 10);
        const cite = citations[idx - 1];
        if (!cite) continue;
        if (m.index > lastIdx) parts.push(t.data.slice(lastIdx, m.index));
        const pill = activeDocument.createElement('a');
        pill.className = 'cortex-chat-citation-inline';
        pill.textContent = String(idx);
        pill.href = cite.url ?? '#';
        const target = cite.url ? null : this.resolveCitationToFile(cite.source);
        const tipParts: string[] = [prettifyEntityName(cite.source)];
        if (cite.text) tipParts.push(cite.text);
        pill.title = tipParts.join('\n');
        if (cite.url) {
          pill.target = '_blank';
          pill.rel = 'noopener';
        } else {
          pill.addEventListener('click', (evt) => {
            evt.preventDefault();
            if (target) {
              void this.app.workspace.getLeaf(false).openFile(target);
              this.host.onNavigate();
            } else {
              new Notice(`"${prettifyEntityName(cite.source)}" isn't a file in this vault yet.`);
            }
          });
        }
        parts.push(pill);
        lastIdx = localRe.lastIndex;
      }
      if (lastIdx === 0) continue; // no replacements
      if (lastIdx < t.data.length) parts.push(t.data.slice(lastIdx));
      const frag = activeDocument.createDocumentFragment();
      for (const p of parts) {
        if (typeof p === 'string') frag.appendChild(activeDocument.createTextNode(p));
        else frag.appendChild(p);
      }
      t.replaceWith(frag);
    }
  }

  /**
   * Overlay each rendered code block with a small toolbar (Copy +
   * Save-to-note). Hidden by default, fades in on hover.
   */
  private addCodeBlockToolbars(root: HTMLElement): void {
    const blocks = root.querySelectorAll('pre');
    blocks.forEach((pre) => {
      // Skip plaintext fallback bubbles — those aren't code, and we don't
      // want a "Save to note" affordance dumping the bad markdown.
      if (pre.classList.contains('cortex-chat-answer-plaintext')) return;
      // Idempotent: don't re-attach if a toolbar is already there.
      if (pre.querySelector(':scope > .cortex-code-toolbar')) return;
      const code = pre.querySelector('code');
      const text = (code?.textContent ?? pre.textContent ?? '').trimEnd();
      if (!text) return;
      // Wrap pre in a positioned container so we can absolute-pin the toolbar
      // without breaking flow layout. (Pre is already a block; we just give
      // it position:relative via class.)
      pre.classList.add('cortex-code-block');
      const toolbar = activeDocument.createElement('div');
      toolbar.className = 'cortex-code-toolbar';
      const copyBtn = activeDocument.createElement('button');
      copyBtn.className = 'cortex-code-toolbar-btn';
      copyBtn.title = 'Copy to clipboard';
      const copyIc = copyBtn.appendChild(activeDocument.createElement('span'));
      setIcon(copyIc, 'copy');
      copyBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        void (async () => {
          try {
            await navigator.clipboard.writeText(text);
            new Notice('Copied to clipboard.');
          } catch {
            new Notice('Copy failed.');
          }
        })();
      });
      const saveBtn = activeDocument.createElement('button');
      saveBtn.className = 'cortex-code-toolbar-btn';
      saveBtn.title = 'Save to a new note';
      const saveIc = saveBtn.appendChild(activeDocument.createElement('span'));
      setIcon(saveIc, 'file-plus');
      saveBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const lang = code?.className?.match(/language-([\w+-]+)/)?.[1] ?? '';
        const fence = '```';
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `Code snippet ${stamp}.md`;
        const body = `${fence}${lang}\n${text}\n${fence}\n`;
        void (async () => {
          try {
            const file = await this.app.vault.create(fileName, body);
            await this.app.workspace.getLeaf(false).openFile(file);
            this.host.onNavigate();
          } catch (e) {
            new Notice(`Couldn't save snippet: ${(e as Error).message}`);
          }
        })();
      });
      toolbar.appendChild(copyBtn);
      toolbar.appendChild(saveBtn);
      pre.appendChild(toolbar);
    });
  }

  private renderErrorCard(parent: HTMLElement, err: unknown, headline: string, onRetry?: () => void): void {
    const fmt = formatError(err, headline);
    const card = parent.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });

    const head = card.createDiv({ cls: 'cortex-error-head' });
    const ic = head.createSpan({ cls: 'cortex-error-icon' });
    setIcon(ic, errorIcon(fmt.kind));
    head.createSpan({ cls: 'cortex-error-headline', text: fmt.headline });

    if (fmt.hint) {
      card.createDiv({ cls: 'cortex-error-hint', text: fmt.hint });
    }

    const detailWrap = card.createEl('details', { cls: 'cortex-error-detail-wrap' });
    detailWrap.createEl('summary', { text: 'Error details' });
    detailWrap.createEl('pre', { cls: 'cortex-error-detail' })
      .createEl('code', { text: fmt.detail });

    const actions = card.createDiv({ cls: 'cortex-error-actions' });
    if (onRetry) {
      const retryBtn = actions.createEl('button', { text: 'Retry', cls: 'mod-cta' });
      retryBtn.addEventListener('click', () => onRetry());
    }
    const copyBtn = actions.createEl('button', { text: 'Copy details' });
    copyBtn.addEventListener('click', () => { void (async () => {
      const payload = `${fmt.headline}\n\n${fmt.detail}${fmt.hint ? `\n\nHint: ${fmt.hint}` : ''}`;
      await navigator.clipboard.writeText(payload);
      copyBtn.setText('Copied');
      activeWindow.setTimeout(() => copyBtn.setText('Copy details'), 1400);
    })(); });
  }

  private renderRecalledMemories(parent: HTMLElement, count: number): void {
    const note = parent.createDiv({ cls: 'cortex-chat-recalled' });
    const ic = note.createSpan({ cls: 'cortex-chat-recalled-icon' });
    setIcon(ic, 'history');
    note.createSpan({ text: `Used ${count} memor${count === 1 ? 'y' : 'ies'} from past sessions.` });
  }

  private renderFollowUps(parent: HTMLElement, followUps: string[]): void {
    const section = parent.createDiv({ cls: 'cortex-chat-section cortex-chat-followups' });
    section.createDiv({ cls: 'cortex-chat-section-label', text: 'Follow up' });
    const list = section.createDiv({ cls: 'cortex-chat-followup-list' });
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
      const chip = this.attachmentsEl.createDiv({ cls: 'cortex-chat-attachment-chip' });
      const ic = chip.createSpan({ cls: 'cortex-chat-attachment-icon' });
      setIcon(ic, 'file-text');
      chip.createSpan({ cls: 'cortex-chat-attachment-name', text: att.name });
      chip.createSpan({
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
    const actions = bubble.createDiv({ cls: 'cortex-chat-turn-actions' });

    if (payload?.entities && payload.entities.length > 0) {
      const graphBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Show on graph' } });
      setIcon(graphBtn, 'network');
      graphBtn.createSpan({ text: 'Show on graph' });
      // Hold-shift on the button to also flip the auto-toggle for future
      // answers, so power users don't have to dig into settings.
      graphBtn.addEventListener('click', evt => {
        if (evt.shiftKey) {
          this.settings.autoShowAnswerOnGraph = !this.settings.autoShowAnswerOnGraph;
          void this.host.saveSettings?.();
          new Notice(
            `Auto-highlight on graph ${this.settings.autoShowAnswerOnGraph ? 'enabled' : 'disabled'} for future answers.`,
            3000,
          );
        }
        void this.showEntitiesOnGraph(payload.entities);
      });

      // Pin/auto toggle inline so the user has visible state, not just a
      // hidden Shift modifier. Filled state = currently auto-applying.
      const autoBtn = actions.createEl('button', {
        cls: 'cortex-chat-action-btn cortex-chat-action-toggle',
        attr: { 'aria-label': 'Auto-highlight every answer on the graph' },
      });
      const refreshAutoBtn = () => {
        autoBtn.empty();
        const on = this.settings.autoShowAnswerOnGraph;
        autoBtn.toggleClass('is-on', on);
        setIcon(autoBtn, on ? 'pin' : 'pin-off');
        autoBtn.createSpan({ text: on ? 'Auto: on' : 'Auto: off' });
        autoBtn.title = on
          ? 'Every chat answer auto-highlights cited entities on the graph. Click to turn off.'
          : 'Click to auto-highlight cited entities on the graph for every chat answer.';
      };
      refreshAutoBtn();
      autoBtn.addEventListener('click', () => { void (async () => {
        this.settings.autoShowAnswerOnGraph = !this.settings.autoShowAnswerOnGraph;
        await this.host.saveSettings?.();
        refreshAutoBtn();
        // If the user just turned it on with an answer already on screen,
        // immediately apply to this answer's entities.
        if (this.settings.autoShowAnswerOnGraph && payload.entities.length > 0) {
          void this.showEntitiesOnGraph(payload.entities);
        }
      })(); });
    }

    const copyBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Copy answer' } });
    setIcon(copyBtn, 'copy');
    copyBtn.createSpan({ text: 'Copy' });
    copyBtn.addEventListener('click', () => { void (async () => {
      await navigator.clipboard.writeText(answer);
      copyBtn.empty();
      setIcon(copyBtn, 'check');
      copyBtn.createSpan({ text: 'Copied' });
      activeWindow.setTimeout(() => {
        copyBtn.empty();
        setIcon(copyBtn, 'copy');
        copyBtn.createSpan({ text: 'Copy' });
      }, 1500);
    })(); });

    const saveBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Save to note' } });
    setIcon(saveBtn, 'file-plus');
    saveBtn.createSpan({ text: 'Save to Note' });
    saveBtn.addEventListener('click', () => { void (async () => {
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
        saveBtn.createSpan({ text: 'Saved' });
        new Notice(`Saved to ${path}`);
        activeWindow.setTimeout(() => {
          saveBtn.empty();
          setIcon(saveBtn, 'file-plus');
          saveBtn.createSpan({ text: 'Save to Note' });
        }, 2000);
      } catch (e) {
        new Notice(`Save failed: ${(e as Error).message}`);
      }
    })(); });

    // Re-run — repeat the most recent user prompt. Useful when the
    // assistant's first answer wasn't quite right and the user wants
    // a second draft without retyping.
    const rerunBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Re-run' } });
    setIcon(rerunBtn, 'rotate-ccw');
    rerunBtn.createSpan({ text: 'Re-run' });
    rerunBtn.addEventListener('click', () => {
      const userTurns = this.currentTurns.filter((t) => t.role === 'user');
      const last = userTurns[userTurns.length - 1]?.content;
      if (!last) return;
      this.populateInput(last);
      void this.submit();
    });

    // Why did you say that? — opens the retrieval-evidence popover with
    // the entities, documents, and citations the agent saw. Skipped when
    // we don't have enough metadata to show anything useful.
    if (payload && (payload.entities?.length || payload.documents?.length || payload.citations?.length)) {
      const evidenceBtn = actions.createEl('button', { cls: 'cortex-chat-action-btn', attr: { 'aria-label': 'Why did you say that' } });
      setIcon(evidenceBtn, 'help-circle');
      evidenceBtn.createSpan({ text: 'Why?' });
      evidenceBtn.addEventListener('click', () => this.openEvidenceModal(payload));
    }

    // Token + latency footer badge. Surfaces gpt model, total tokens
    // burned, and wall-clock latency when the response carries an agent
    // run trace. Renders as a tiny pill below the action row.
    if (payload?.iterationTokens && payload.iterationTokens.length > 0) {
      const totalTokens = payload.iterationTokens.reduce(
        (s, t) => s + (typeof t === 'number' ? t : (t?.total ?? 0)),
        0,
      );
      const ms = (payload as unknown as { latencyMs?: number }).latencyMs;
      const meta = bubble.createDiv({ cls: 'cortex-chat-turn-meta' });
      const parts: string[] = [];
      if (typeof ms === 'number') parts.push(`${(ms / 1000).toFixed(1)}s`);
      if (totalTokens > 0) parts.push(`${totalTokens.toLocaleString()} tokens`);
      const model = (payload as unknown as { model?: string }).model;
      if (model) parts.push(model);
      meta.setText(parts.join(' · '));
    }
  }

  /**
   * Open a modal that explains the retrieval evidence behind an answer:
   * which entities matched, which documents were pulled, and which
   * citations the assistant ended up using. Renders existing payload
   * fields — no extra request needed.
   */
  private openEvidenceModal(payload: AskResponse): void {
    const m = new (class extends Modal {
      constructor(app: App) { super(app); }
      onOpen() {
        this.titleEl.setText('Why did the agent say that?');
        const body = this.contentEl;
        body.addClass('cortex-evidence-modal');
        if (payload.entities?.length) {
          body.createDiv({ cls: 'cortex-evidence-section-label', text: `Entities matched (${payload.entities.length})` });
          const ul = body.createEl('ul', { cls: 'cortex-evidence-list' });
          for (const e of payload.entities.slice(0, 30)) {
            const li = ul.createEl('li');
            li.createSpan({ cls: 'cortex-evidence-name', text: e.name });
            li.createSpan({ cls: 'cortex-evidence-type', text: e.type });
            if (typeof e.score === 'number') li.createSpan({ cls: 'cortex-evidence-score', text: e.score.toFixed(2) });
          }
        }
        if (payload.documents?.length) {
          body.createDiv({ cls: 'cortex-evidence-section-label', text: `Documents retrieved (${payload.documents.length})` });
          const ul = body.createEl('ul', { cls: 'cortex-evidence-list' });
          for (const d of payload.documents.slice(0, 30)) {
            const li = ul.createEl('li');
            li.createSpan({ cls: 'cortex-evidence-name', text: d.title });
            if (d.snippet) li.createDiv({ cls: 'cortex-evidence-snippet', text: d.snippet.slice(0, 200) });
            if (typeof d.matchPercent === 'number') li.createSpan({ cls: 'cortex-evidence-score', text: `${d.matchPercent}%` });
          }
        }
        if (payload.citations?.length) {
          body.createDiv({ cls: 'cortex-evidence-section-label', text: `Citations cited (${payload.citations.length})` });
          const ul = body.createEl('ul', { cls: 'cortex-evidence-list' });
          for (const c of payload.citations) {
            const li = ul.createEl('li');
            li.createSpan({ cls: 'cortex-evidence-name', text: c.source });
            if (c.text) li.createDiv({ cls: 'cortex-evidence-snippet', text: c.text.slice(0, 200) });
          }
        }
      }
      onClose() { this.contentEl.empty(); }
    })(this.app);
    m.open();
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

    // Open / focus the core Graph leaf in the main pane. If a graph leaf
    // already exists AND its engine looks corrupted (filterOptions.search
    // is a string instead of a SearchComponent — happens when an earlier
    // version of this plugin clobbered it directly), detach and recreate
    // it. Otherwise reuse.
    let leaf: import('obsidian').WorkspaceLeaf | null =
      this.app.workspace.getLeavesOfType('graph')[0] ?? null;
    if (leaf && isGraphEngineCorrupted(leaf)) {
      // Detach the broken leaf — its engine is in a state where every
      // render call throws "filterOptions.search.getValue is not a
      // function". Replacement leaf rebuilds the SearchComponent.
      leaf.detach();
      leaf = null;
    }
    if (!leaf) {
      const newLeaf = this.app.workspace.getLeaf(false);
      if (!newLeaf) {
        new Notice('Couldn\'t open Obsidian\'s graph view.');
        return;
      }
      await newLeaf.setViewState({ type: 'graph', active: true });
      leaf = newLeaf;
    }
    void this.app.workspace.revealLeaf(leaf);
    this.host.onNavigate();

    const applied = await this.applyGraphFilter(leaf, query);
    if (!applied) {
      new Notice('Couldn\'t apply the graph filter — query copied to clipboard, paste it into the filters panel.');
      void navigator.clipboard.writeText(query);
      return;
    }

    // Confirmation Notice helps confirm the click landed even if the
    // dimming is subtle (e.g. when most entities aren't yet in the vault).
    // Shows the first couple of terms so the user can compare against the
    // visible filter input.
    const preview = allTerms.slice(0, 3).map(t => `"${t}"`).join(', ');
    const more = allTerms.length > 3 ? ` (+${allTerms.length - 3} more)` : '';
    new Notice(`Graph filter set to ${preview}${more}. Non-matching nodes should now be dimmed.`, 4000);

    this.renderGraphFilterPill(leaf, matchedCount, query, names.length);
  }

  /**
   * Push a search query into Obsidian's graph view. The graph filter dims
   * non-matching nodes when its `engine.options.search` changes AND the
   * engine re-renders. Different Obsidian versions name the engine and the
   * re-render method differently, so we try every known surface and verify
   * by reading the DOM input back.
   *
   * Returns true if at least one path took effect.
   */
  private async applyGraphFilter(leaf: unknown, query: string): Promise<boolean> {
    const sleep = (ms: number) => new Promise(r => activeWindow.setTimeout(r, ms));
    const waitFor = async <T>(fn: () => T | null | undefined, ms = 2000): Promise<T | null> => {
      const start = Date.now();
      while (Date.now() - start < ms) {
        const v = fn();
        if (v) return v;
        await sleep(50);
      }
      return null;
    };

    const view = (leaf as { view?: { containerEl?: HTMLElement } }).view;

    // 1. Expand the Filters section if collapsed — Obsidian's graph view
    //    keeps the filter input in the DOM either way, but expanding gives
    //    the user visible feedback that the query was applied.
    const root: HTMLElement | undefined = view?.containerEl;
    if (root) {
      const collapsed = root.querySelector<HTMLElement>(
        '.graph-control-section.is-collapsed > .tree-item-self, ' +
        '.graph-control-section.is-collapsed > .graph-control-section-header, ' +
        '.tree-item.graph-control-section.is-collapsed > .tree-item-self',
      );
      collapsed?.click();
    }

    // 2. We deliberately do NOT touch engine.options or engine.filterOptions.
    //    On modern Obsidian, those `.search` fields are SearchComponent
    //    objects (or wrappers that the engine expects to call .getValue()
    //    on). Assigning a raw string clobbers the component and causes
    //    every subsequent updateSearch() to throw "…search.getValue is
    //    not a function" — leaving the graph permanently broken until the
    //    leaf is recreated. The DOM-input path below is the surface
    //    Obsidian's own UI uses, and it manages the SearchComponent
    //    correctly via its bound oninput handler.
    let engineApplied = false;

    // 3. DOM path — drive the visible search input. The graph controls
    //    panel has 13+ inputs (one per setting/toggle), so we have to
    //    target the Filters section's search input specifically. Strategy:
    //    walk every section, find the one whose first input has a search
    //    placeholder (Obsidian uses "Search files…" for the filter input).
    let inputApplied = false;
    if (root) {
      const input = await waitFor(() => findGraphFilterSearchInput(root));
      if (input) {
        // Use HTMLInputElement.prototype's native setter directly — the
        // immediate proto doesn't own the `value` setter.
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        if (desc?.set) desc.set.call(input, query);
        else input.value = query;

        // Real InputEvent — Obsidian binds via oninput and some handlers
        // null-check `event.inputType`.
        input.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: query,
        }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        inputApplied = input.value === query;
      }
    }

    return engineApplied || inputApplied;
  }

  /** Render (or replace) the "Showing N of M entities from chat · Clear" pill on a graph leaf. */
  private renderGraphFilterPill(leaf: unknown, matched: number, query: string, totalCited: number): void {
    const root = (leaf as { view?: { containerEl?: HTMLElement } }).view?.containerEl;
    if (!root) return;
    root.querySelectorAll('.cortex-graph-filter-pill').forEach(el => el.remove());

    // Use standard DOM `createElement` here — Obsidian's element-helper
    // extensions (`createDiv` / `createSpan` / `createEl`) are only valid
    // on regular elements. When called on the global Document they
    // resolve to a path that ultimately calls `appendChild(document)`,
    // throwing "Only one element on document allowed." Build the pill
    // detached, then attach to the graph view's container at the end.
    const pill = activeDocument.createElement('div');
    pill.className = 'cortex-graph-filter-pill';
    const label = activeDocument.createElement('span');
    label.textContent = matched === totalCited
      ? `Showing ${matched} ${matched === 1 ? 'entity' : 'entities'} from chat`
      : `Showing ${matched} of ${totalCited} entities from chat`;
    pill.appendChild(label);

    if (matched < totalCited) {
      const hint = activeDocument.createElement('span');
      hint.className = 'cortex-graph-filter-pill-hint';
      hint.textContent = ` · ${totalCited - matched} not in vault yet`;
      hint.title = 'Run a graph pull from settings to materialize the rest as files.';
      pill.appendChild(hint);
    }

    const clearBtn = activeDocument.createElement('button');
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

    const walker = activeDocument.createTreeWalker(container, NodeFilter.SHOW_TEXT);
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
        const link = activeDocument.createElement('a');
        link.className = 'cortex-chat-inline-link';
        link.textContent = matchedName;
        link.href = '#';
        if (entity?.description) link.title = entity.description;
        link.addEventListener('click', evt => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(matchedName, '');
          if (target) {
            void this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          }
        });
        parts.push(link);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));

      if (parts.length > 1) {
        const frag = activeDocument.createDocumentFragment();
        for (const p of parts) {
          if (typeof p === 'string') frag.appendChild(activeDocument.createTextNode(p));
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
/**
 * Detect whether the graph leaf's engine is in the "filterOptions.search
 * has been replaced with a string" state. That happens when an earlier
 * version of this plugin (or any other plugin) wrote a raw string to
 * `engine.filterOptions.search`, clobbering the SearchComponent that
 * Obsidian's `updateSearch()` calls `.getValue()` on. Once corrupted,
 * every render throws and the only fix is to detach the leaf and let
 * Obsidian rebuild the engine from scratch.
 */
/**
 * Heuristic: does this query look like a single-shot fact lookup, or
 * does it need agent-style multi-step reasoning? Short fact-lookup-style
 * queries are routed through the integrated /chat/answer path (one LLM
 * call) instead of the agent loop (5+ LLM calls), saving ~5–10s per
 * query. Conservative — when in doubt, treat as complex and let the
 * agent loop run.
 */
function isSimpleQuery(text: string): boolean {
  const q = text.trim();
  if (q.length === 0 || q.length > 240) return false;
  const lower = q.toLowerCase();

  // Vault-inventory / meta queries need the agent loop (uses list_entities,
  // get_vault_stats, knowledge_graph_search with broad scope). The fast
  // path's GraphRAG retrieval can't enumerate the vault and returns empty
  // for sparse vaults — the LLM then incorrectly says "vault is empty"
  // even though notes exist.
  const META_VAULT_PATTERNS = [
    /\bin my vault\b/,
    /\bmy vault\b/,
    /\bmy notes\b/,
    /\bmy graph\b/,
    /\bin my graph\b/,
    /\bmy knowledge graph\b/,
    /\beverything\b/,
    /\bsummary of\b/,
    /\bsummarize\b/,
    /\bsummarise\b/,
    /\boverview\b/,
    /\bwhat (?:do you|can you) (?:see|find|know)\b/,
    /\bhow many (?:notes|entities|files)\b/,
    /\bshow me (?:my|all|everything)\b/,
    /\blist my\b/,
    /\bshow (?:my|all)\b/,
  ];
  for (const re of META_VAULT_PATTERNS) {
    if (re.test(lower)) return false;
  }

  // Multi-step / analytical signals — bail straight to agent path.
  const COMPLEX_TERMS = [
    'compare', 'comparison', 'difference', 'differs', 'differ ',
    'analyze', 'analysis',
    'across', 'all my', 'every', 'each',
    'trend', 'over time', 'evolution', 'evolved',
    'summarize all', 'summarise all', 'pull every', 'find every',
    'how does', 'how do ', 'how is ', 'how are ',
    'why does', 'why do ', 'why is ', 'why are ',
    'walk me through', 'reasoning behind',
    'connect', 'connection', 'relate', 'relationship between', 'related to',
    'pattern', 'theme', 'top ', 'most ',
    'group by', 'sort by', 'list every', 'list all',
    'inverse', 'opposite',
  ];
  for (const term of COMPLEX_TERMS) {
    if (lower.includes(term)) return false;
  }

  // Multi-clause queries — punctuation that signals chained asks.
  const sentences = q.split(/[.?!]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) return false;

  // Looks like a fact lookup — leading interrogative + short tail.
  const factPrefixes = /^(what(?: is| are| was| were| does| did)?|who(?: is| was| are)?|where|when|which|show me|find me?|tell me about|give me|list)\b/;
  if (factPrefixes.test(lower)) return true;

  // Bare entity / topic — short noun-phrase queries that LLMs handle
  // well in single-shot.
  if (q.split(/\s+/).length <= 8 && !/[?]/.test(q)) return true;

  return false;
}

function isGraphEngineCorrupted(leaf: unknown): boolean {
  try {
    // Obsidian's graph engine internals aren't typed in the public API,
    // so we cast through a structural shape rather than `any`.
    type GraphEngine = { filterOptions?: { search?: unknown } };
    type GraphView = {
      dataEngine?: GraphEngine;
      renderer?: { engine?: GraphEngine };
      engine?: GraphEngine;
    };
    const view = (leaf as { view?: GraphView }).view;
    const engine: GraphEngine | undefined = view?.dataEngine ?? view?.renderer?.engine ?? view?.engine;
    if (!engine) return false;
    const fo = engine.filterOptions;
    if (!fo || typeof fo !== 'object') return false;
    // Healthy: fo.search is either a SearchComponent (object with getValue)
    // or doesn't exist yet. Corrupted: fo.search is a string.
    return typeof fo.search === 'string';
  } catch {
    return false;
  }
}

/**
 * Find the search input that controls graph filtering. The graph controls
 * panel contains 13+ inputs (one per setting), so we can't just grab the
 * first one. Strategy:
 *   1. Try the Filters section by data attribute (most reliable).
 *   2. Fall back to placeholder match — Obsidian labels it "Search files…".
 *   3. Last resort: the first text/search input inside `.graph-controls`,
 *      which has historically been the filter input.
 */
function findGraphFilterSearchInput(root: HTMLElement): HTMLInputElement | null {
  // Modern Obsidian tags the section with data-section-id or data-section
  const taggedSection = root.querySelector<HTMLElement>(
    '.graph-control-section[data-section="filter"], ' +
    '.graph-control-section[data-section-id="filter"], ' +
    '.tree-item.graph-control-section.mod-search',
  );
  if (taggedSection) {
    const input = taggedSection.querySelector<HTMLInputElement>('input[type="search"], input[type="text"]');
    if (input) return input;
  }
  // Placeholder-based — works across most versions
  const byPlaceholder = root.querySelector<HTMLInputElement>(
    '.graph-controls input[placeholder*="earch"]',
  );
  if (byPlaceholder) return byPlaceholder;
  // Last-resort: the first input inside the first section
  const firstSection = root.querySelector<HTMLElement>('.graph-control-section, .graph-controls');
  return firstSection?.querySelector<HTMLInputElement>('input[type="search"], input[type="text"]') ?? null;
}

/** Lucide icon name per tool — matches the chat panel's existing iconography
 *  so the trace cards feel native. Unknown tools fall back to a generic dot. */
function toolCallIcon(name: string): string {
  switch (name) {
    case 'knowledge_graph_search': return 'search';
    case 'cortex_paths':           return 'route';
    case 'cortex_recall':          return 'history';
    case 'cortex_remember':        return 'bookmark-plus';
    case 'delegate':               return 'git-branch';
    case 'web_search':             return 'globe';
    case 'web_scrape':             return 'file-text';
    case 'get_current_time':       return 'clock';
    case 'calculator':             return 'calculator';
    default:                       return 'tool';
  }
}

/** Phase phrase for the streaming "Thinking…" pill while a specific
 *  tool is executing. Kept as a present-progressive verb so the label
 *  reads as live activity ("Querying knowledge graph…") rather than
 *  past-tense like the trace summary ("Searched vault"). */
function toolPhasePhrase(name: string): string {
  switch (name) {
    case 'knowledge_graph_search': return 'Querying knowledge graph';
    case 'cortex_paths':           return 'Tracing connections';
    case 'cortex_recall':          return 'Recalling from memory';
    case 'cortex_remember':        return 'Saving to memory';
    case 'delegate':               return 'Delegating to sub-agent';
    case 'web_search':             return 'Searching the web';
    case 'web_scrape':             return 'Reading web page';
    case 'get_current_time':       return 'Checking the time';
    case 'calculator':             return 'Calculating';
    default:                       return `Using ${name}`;
  }
}

/** Friendlier name for the trace summary line. The internal tool ids are
 *  snake_case which reads as "code" — the trace is user-facing. */
function prettifyToolCallName(name: string): string {
  switch (name) {
    case 'knowledge_graph_search': return 'Searched vault';
    case 'cortex_paths':           return 'Traced connections';
    case 'cortex_recall':          return 'Recalled from memory';
    case 'cortex_remember':        return 'Saved to memory';
    case 'delegate':               return 'Delegated to sub-agent';
    case 'web_search':             return 'Searched the web';
    case 'web_scrape':             return 'Read web page';
    case 'get_current_time':       return 'Checked the date';
    case 'calculator':             return 'Calculated';
    default:                       return name;
  }
}

/** Inline summary of the args a tool was called with, e.g. `"PARA method"`
 *  for a search. Limited to the most informative arg per tool. */
function summarizeToolCallArgs(name: string, args: Record<string, unknown>): string {
  const get = (k: string) => (typeof args[k] === 'string' ? (args[k]) : null);
  let s: string | null = null;
  switch (name) {
    case 'knowledge_graph_search':
    case 'web_search':
    case 'cortex_recall':          s = get('query'); break;
    case 'cortex_remember':        s = get('content'); break;
    case 'delegate':               s = get('goal'); break;
    case 'web_scrape':             s = get('url'); break;
    case 'cortex_paths':           {
      const from = get('from'); const to = get('to');
      s = from && to ? `${from} → ${to}` : null;
      break;
    }
    case 'calculator':             s = get('expression'); break;
  }
  if (!s) return '';
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

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

/** Tool-call duration formatter — sub-second in ms, single-digit seconds in
 *  one decimal place (8.2s), multi-digit seconds with no decimal (12s),
 *  >=60s as `1m 12s`. Tabular-numeric-friendly so columns align in the trace. */
function formatToolDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s - m * 60);
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
