import { ItemView, WorkspaceLeaf, setIcon, Notice, Platform } from 'obsidian';
import type CortexPlugin from '../main';
import { appendHangarxLogo } from '../assets';

export const ONBOARDING_VIEW_TYPE = 'cortex-onboarding-view';

/**
 * Persistent side-panel onboarding. Replaces the auto-dismissing modal with
 * a checklist that survives reload, lives in the right sidebar, and tracks
 * five milestones:
 *
 *   1. Connect HangarX        (cloud OAuth or local connection)
 *   2. Sync vault              (push notes to the knowledge graph)
 *   3. Run your first query    (smart prompt seeded from the user's vault)
 *   4. Connect external agents (MCP config copy-paste per-agent)
 *   5. Star a query            (save to the conversation library)
 *
 * Why side-panel instead of modal: users routinely navigate AWAY from the
 * onboarding (open settings, paste a config into another app) and back. A
 * modal would force them to re-open it; a side panel just stays put.
 *
 * The user can dismiss the panel via the corner X or the settings flag
 * `onboardingDismissed`. Re-opening is one command away.
 */
export class OnboardingView extends ItemView {
  private pollTimer: number | null = null;
  private bodyEl!: HTMLElement;
  private cache: { hasSyncedAnything: boolean; hasAnyConversation: boolean; hasStarredAnything: boolean } = {
    hasSyncedAnything: false,
    hasAnyConversation: false,
    hasStarredAnything: false,
  };
  private smartPrompts: string[] = [];

  constructor(leaf: WorkspaceLeaf, private plugin: CortexPlugin) {
    super(leaf);
  }

  getViewType(): string { return ONBOARDING_VIEW_TYPE; }
  getDisplayText(): string { return 'HangarX: Get started'; }
  getIcon(): string { return 'rocket'; }

  async onOpen(): Promise<void> {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass('cortex-onboarding-view');

    this.bodyEl = root.createDiv({ cls: 'cortex-onboarding-view-body' });

    // Header — logo + welcome
    const header = this.bodyEl.createDiv({ cls: 'cortex-onboarding-view-header' });
    const logoWrap = header.createDiv({ cls: 'cortex-onboarding-view-logo' });
    appendHangarxLogo(logoWrap);
    header.createDiv({
      cls: 'cortex-onboarding-view-title',
      text: 'Welcome to HangarX',
    });
    header.createDiv({
      cls: 'cortex-onboarding-view-tagline',
      text: 'Your vault becomes a knowledge graph that every AI agent on your machine can query.',
    });

    await this.refreshCache();
    this.smartPrompts = this.buildSmartPrompts();
    this.renderSteps();

    // Live-update while the panel is open. User can sign in via settings,
    // sync via the ribbon, etc., and the checks light up in place.
    this.pollTimer = window.setInterval(() => {
      void this.refreshAndRerender();
    }, 1200);

    // Mark first-shown so main.ts knows not to auto-open again.
    if (!this.plugin.settings.onboardingShownAt) {
      this.plugin.settings.onboardingShownAt = Date.now();
      void this.plugin.saveSettings();
    }
  }

  // Obsidian's View.onClose accepts both sync and Promise-returning
  // overrides; we don't actually await anything so dropping `async`
  // satisfies @typescript-eslint/require-await.
  onClose(): Promise<void> {
    if (this.pollTimer != null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.containerEl.empty();
    return Promise.resolve();
  }

  // ── State ─────────────────────────────────────────────────────────────

  private getStepState(): {
    step1Done: boolean
    step2Done: boolean
    step3Done: boolean
    step4Done: boolean
    step5Done: boolean
    completed: number
    total: number
  } {
    const s = this.plugin.settings;
    const isCloud = s.connectionMode === 'cloud';
    const step1Done = isCloud ? !!(s.apiKey && s.workspaceId) : !!s.workspaceId;
    const step2Done = this.cache.hasSyncedAnything;
    const step3Done = this.cache.hasAnyConversation;
    const step4Done = !!s.mcpEnabled;
    const step5Done = this.cache.hasStarredAnything;
    const completed = [step1Done, step2Done, step3Done, step4Done, step5Done].filter(Boolean).length;
    return { step1Done, step2Done, step3Done, step4Done, step5Done, completed, total: 5 };
  }

  private async refreshCache(): Promise<void> {
    try {
      const conversations = await this.plugin.conversations.list().catch(() => []);
      this.cache.hasAnyConversation = conversations.length > 0;
      this.cache.hasStarredAnything = conversations.some((c) => (c as { starred?: boolean }).starred === true);
    } catch { /* keep defaults */ }
    try {
      await this.plugin.sync.loadIndex();
      const fileCount = Object.keys((this.plugin.sync as unknown as { index?: { files?: Record<string, unknown> } }).index?.files ?? {}).length;
      this.cache.hasSyncedAnything = fileCount > 0;
    } catch { /* keep default */ }
  }

  private async refreshAndRerender(): Promise<void> {
    const before = this.getStepState();
    await this.refreshCache();
    const after = this.getStepState();
    if (
      before.step1Done !== after.step1Done ||
      before.step2Done !== after.step2Done ||
      before.step3Done !== after.step3Done ||
      before.step4Done !== after.step4Done ||
      before.step5Done !== after.step5Done
    ) {
      this.renderSteps();
    }
  }

  // ── Smart prompt generation (item #2 from the redesign plan) ──────────

  /**
   * Build 3 starter prompts seeded from the user's actual vault — recent
   * note titles, top tags, daily-note presence. Falls back to generic
   * prompts when the vault has no signal yet.
   */
  private buildSmartPrompts(): string[] {
    const allFiles = this.app.vault.getMarkdownFiles();
    if (allFiles.length === 0) {
      return [
        'What can you do for me?',
        'How does HangarX work?',
        'Show me a list of available tools.',
      ];
    }

    // Most-recently-modified notes — common starting point for "what was I working on" queries.
    const recent = [...allFiles]
      .sort((a, b) => (b.stat.mtime ?? 0) - (a.stat.mtime ?? 0))
      .slice(0, 3)
      .map((f) => f.basename);

    // Pull top tags from the metadata cache. Fast — Obsidian indexes them already.
    const tagCounts = new Map<string, number>();
    for (const f of allFiles) {
      const cache = this.app.metadataCache.getFileCache(f);
      const tags = [
        ...(cache?.tags ?? []),
        ...((cache?.frontmatter?.tags as string[] | undefined) ?? []).map((t) => ({ tag: t.startsWith('#') ? t : `#${t}` })),
      ];
      for (const t of tags) {
        const tag = (t as { tag?: string }).tag;
        if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([t]) => t);

    const prompts: string[] = [];

    // Prompt 1: tap recency + show the user we know their vault.
    if (recent[0]) {
      prompts.push(
        `Summarize what I've been working on this week. Start with my most recent notes (e.g. "${recent[0]}") and surface the key projects, decisions, and open questions.`,
      );
    } else {
      prompts.push('What was I working on this week?');
    }

    // Prompt 2: top-tag exploration.
    if (topTags[0]) {
      prompts.push(`Show me everything I've written about ${topTags[0]} and how those notes connect to each other.`);
    } else {
      prompts.push('What are the main themes across my notes?');
    }

    // Prompt 3: open-ended discovery — useful when the vault is light.
    prompts.push("Find connections I haven't noticed between unrelated notes.");

    return prompts;
  }

  // ── Render ────────────────────────────────────────────────────────────

  private renderSteps(): void {
    // Replace step content; keep header.
    this.bodyEl.querySelectorAll('.cortex-onboarding-view-progress, .cortex-onboarding-view-steps, .cortex-onboarding-view-footer').forEach((el) => el.remove());

    const state = this.getStepState();

    // Progress bar
    const progress = this.bodyEl.createDiv({ cls: 'cortex-onboarding-view-progress' });
    const bar = progress.createDiv({ cls: 'cortex-onboarding-view-progress-bar cortex-progress-bar-fill' });
    bar.setCssProps({ '--cortex-progress-pct': `${(state.completed / state.total) * 100}%` });
    progress.createSpan({
      cls: 'cortex-onboarding-view-progress-label',
      text: `${state.completed} of ${state.total} done`,
    });

    const steps = this.bodyEl.createDiv({ cls: 'cortex-onboarding-view-steps' });

    // Step 1 — Connect
    this.renderStep(steps, {
      done: state.step1Done,
      number: 1,
      title: 'Connect HangarX',
      desc: state.step1Done
        ? `Connected — running in ${this.plugin.settings.connectionMode === 'cloud' ? 'Cloud' : 'Local'} mode.`
        : 'Pick Cloud (one-click OAuth) or Local (Docker on your machine), then enter the connection details.',
      actionLabel: state.step1Done ? 'Open settings' : 'Open settings',
      actionIcon: 'plug',
      action: () => {
        (this.app as unknown as { setting?: { open?: () => void; openTabById?: (id: string) => void } }).setting?.open?.();
        (this.app as unknown as { setting?: { open?: () => void; openTabById?: (id: string) => void } }).setting?.openTabById?.('hangarx');
      },
    });

    // Step 2 — Sync
    this.renderStep(steps, {
      done: state.step2Done,
      number: 2,
      title: 'Sync your vault',
      desc: state.step2Done
        ? 'Your vault has been synced to the knowledge graph at least once.'
        : 'Push your notes to the knowledge graph so HangarX can answer questions about them.',
      actionLabel: state.step2Done ? 'Re-sync' : 'Sync now',
      actionIcon: 'arrow-up',
      action: () => {
        void import('./sync-modal').then((m) => new m.SyncModal(this.app, this.plugin).open());
      },
      disabled: !state.step1Done,
    });

    // Step 3 — Smart prompts (item #2 from plan)
    this.renderSmartPromptStep(steps, state);

    // Step 4 — MCP / external agents (item #3 from plan)
    this.renderMcpStep(steps, state);

    // Step 5 — Star a query (engagement nudge)
    this.renderStep(steps, {
      done: state.step5Done,
      number: 5,
      title: 'Star a useful query',
      desc: state.step5Done
        ? "You've starred at least one conversation — it's saved in your library for one-click recall."
        : 'When a query produces a useful answer, star it from the chat header. Starred queries become reusable templates.',
      actionLabel: 'Open chat',
      actionIcon: 'star',
      action: () => {
        void this.plugin.activateChatView();
      },
      disabled: !state.step3Done,
    });

    // Footer
    const footer = this.bodyEl.createDiv({ cls: 'cortex-onboarding-view-footer' });
    if (state.completed === state.total) {
      const done = footer.createDiv({ cls: 'cortex-onboarding-view-done' });
      const ic = done.createSpan({ cls: 'cortex-onboarding-view-done-icon' });
      setIcon(ic, 'check-circle');
      done.createSpan({ text: 'All set — close this panel anytime.' });
    }
    const dismiss = footer.createEl('button', {
      cls: 'cortex-onboarding-view-dismiss',
      text: state.completed === state.total ? 'Close panel' : 'Dismiss for now',
    });
    dismiss.addEventListener('click', () => {
      this.plugin.settings.onboardingDismissed = true;
      void this.plugin.saveSettings();
      this.leaf.detach();
    });
    const help = footer.createEl('a', {
      cls: 'cortex-onboarding-view-help',
      attr: { href: 'https://app.HangarX.ai/obsidian', target: '_blank', rel: 'noopener' },
      text: 'Read the docs →',
    });
    help.addEventListener('click', (evt) => evt.stopPropagation());
  }

  // ── Step 3: smart prompts ─────────────────────────────────────────────

  private renderSmartPromptStep(parent: HTMLElement, state: ReturnType<OnboardingView['getStepState']>): void {
    const row = parent.createDiv({
      cls: 'cortex-onboarding-step' +
        (state.step3Done ? ' is-done' : '') +
        (!state.step2Done ? ' is-disabled' : ''),
    });
    const status = row.createDiv({ cls: 'cortex-onboarding-step-status' });
    if (state.step3Done) {
      const ic = status.createSpan({ cls: 'cortex-onboarding-step-check' });
      setIcon(ic, 'check');
    } else {
      status.setText('3');
    }
    const body = row.createDiv({ cls: 'cortex-onboarding-step-body' });
    body.createDiv({ cls: 'cortex-onboarding-step-title', text: 'Run your first query' });
    body.createDiv({
      cls: 'cortex-onboarding-step-desc',
      text: state.step3Done
        ? "You've had at least one conversation. Try a starred prompt to keep going."
        : 'Pick one of these prompts — each is tailored to your actual notes.',
    });

    if (!state.step3Done && state.step2Done) {
      const promptList = body.createDiv({ cls: 'cortex-onboarding-prompts' });
      for (const prompt of this.smartPrompts) {
        const btn = promptList.createEl('button', { cls: 'cortex-onboarding-prompt' });
        const ic = btn.createSpan({ cls: 'cortex-onboarding-prompt-icon' });
        setIcon(ic, 'sparkles');
        btn.createSpan({ cls: 'cortex-onboarding-prompt-text', text: prompt });
        btn.addEventListener('click', () => {
          void this.plugin.askInChat(prompt);
        });
      }
    }
  }

  // ── Step 4: MCP / external agents ─────────────────────────────────────

  private renderMcpStep(parent: HTMLElement, state: ReturnType<OnboardingView['getStepState']>): void {
    const row = parent.createDiv({
      cls: 'cortex-onboarding-step' + (state.step4Done ? ' is-done' : ''),
    });
    const status = row.createDiv({ cls: 'cortex-onboarding-step-status' });
    if (state.step4Done) {
      const ic = status.createSpan({ cls: 'cortex-onboarding-step-check' });
      setIcon(ic, 'check');
    } else {
      status.setText('4');
    }
    const body = row.createDiv({ cls: 'cortex-onboarding-step-body' });
    body.createDiv({ cls: 'cortex-onboarding-step-title', text: 'Connect external AI agents' });
    body.createDiv({
      cls: 'cortex-onboarding-step-desc',
      text: state.step4Done
        ? `Local MCP server is running on port ${this.plugin.settings.mcpPort}. Use the configs below to connect each agent.`
        : 'Turn on the local MCP server, then copy the right config into your AI agent of choice.',
    });

    // Toggle MCP server
    if (!state.step4Done) {
      const toggleBtn = body.createEl('button', { cls: 'cortex-onboarding-mcp-toggle' });
      const ic = toggleBtn.createSpan({ cls: 'cortex-onboarding-mcp-toggle-icon' });
      setIcon(ic, 'play-circle');
      toggleBtn.createSpan({ text: 'Start local MCP server' });
      toggleBtn.addEventListener('click', () => {
        void (async () => {
          await this.plugin.toggleMcpServer(true);
          await this.refreshAndRerender();
        })();
      });
      return;
    }

    // Config blocks for each supported agent
    const cfg = body.createDiv({ cls: 'cortex-onboarding-mcp-configs' });
    const port = this.plugin.settings.mcpPort;
    const token = this.plugin.settings.mcpToken;
    const url = `http://127.0.0.1:${port}/mcp`;

    const claudeDesktopJson = JSON.stringify({
      mcpServers: {
        hangarx: {
          url,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    }, null, 2);

    const cursorJson = JSON.stringify({
      mcpServers: {
        hangarx: {
          url,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    }, null, 2);

    const claudeCodeCmd = `claude mcp add hangarx --url ${url} --header "Authorization: Bearer ${token}"`;

    this.renderMcpConfig(cfg, {
      label: 'Claude Desktop',
      icon: 'message-circle',
      hint: Platform.isMacOS
        ? 'Add to ~/Library/Application Support/Claude/claude_desktop_config.json'
        : Platform.isWin
          ? 'Add to %APPDATA%\\Claude\\claude_desktop_config.json'
          : 'Add to ~/.config/Claude/claude_desktop_config.json',
      payload: claudeDesktopJson,
      kind: 'json',
    });

    this.renderMcpConfig(cfg, {
      label: 'Cursor',
      icon: 'terminal',
      hint: 'Cursor → Settings → MCP → Add new server',
      payload: cursorJson,
      kind: 'json',
    });

    this.renderMcpConfig(cfg, {
      label: 'Claude Code (CLI)',
      icon: 'terminal-square',
      hint: 'Run this in your terminal — configures the Claude Code CLI to use HangarX as an MCP source.',
      payload: claudeCodeCmd,
      kind: 'cmd',
    });

    // Stop server option (advanced)
    const stop = cfg.createEl('button', { cls: 'cortex-onboarding-mcp-stop', text: 'Stop MCP server' });
    stop.addEventListener('click', () => {
      void (async () => {
        await this.plugin.toggleMcpServer(false);
        await this.refreshAndRerender();
      })();
    });
  }

  private renderMcpConfig(parent: HTMLElement, opts: {
    label: string
    icon: string
    hint: string
    payload: string
    kind: 'json' | 'cmd'
  }): void {
    const wrap = parent.createDiv({ cls: 'cortex-onboarding-mcp-config' });
    const head = wrap.createDiv({ cls: 'cortex-onboarding-mcp-config-head' });
    const labelWrap = head.createSpan({ cls: 'cortex-onboarding-mcp-config-label' });
    const ic = labelWrap.createSpan({ cls: 'cortex-onboarding-mcp-config-icon' });
    setIcon(ic, opts.icon);
    labelWrap.createSpan({ text: opts.label });
    const copy = head.createEl('button', { cls: 'cortex-onboarding-mcp-config-copy' });
    const cic = copy.createSpan();
    setIcon(cic, 'copy');
    copy.createSpan({ text: 'Copy' });
    copy.addEventListener('click', () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(opts.payload);
          new Notice(`HangarX: ${opts.label} ${opts.kind === 'cmd' ? 'command' : 'config'} copied.`);
        } catch {
          new Notice('HangarX: Copy failed — selecting text instead.');
        }
      })();
    });
    wrap.createDiv({ cls: 'cortex-onboarding-mcp-config-hint', text: opts.hint });
    const pre = wrap.createEl('pre', { cls: `cortex-onboarding-mcp-config-payload is-${opts.kind}` });
    pre.setText(opts.payload);
  }

  // ── Generic step row ──────────────────────────────────────────────────

  private renderStep(parent: HTMLElement, opts: {
    done: boolean
    number: number
    title: string
    desc: string
    actionLabel: string
    actionIcon: string
    action: () => void
    disabled?: boolean
  }): void {
    const row = parent.createDiv({
      cls: 'cortex-onboarding-step' +
        (opts.done ? ' is-done' : '') +
        (opts.disabled ? ' is-disabled' : ''),
    });
    const status = row.createDiv({ cls: 'cortex-onboarding-step-status' });
    if (opts.done) {
      const ic = status.createSpan({ cls: 'cortex-onboarding-step-check' });
      setIcon(ic, 'check');
    } else {
      status.setText(String(opts.number));
    }
    const body = row.createDiv({ cls: 'cortex-onboarding-step-body' });
    body.createDiv({ cls: 'cortex-onboarding-step-title', text: opts.title });
    body.createDiv({ cls: 'cortex-onboarding-step-desc', text: opts.desc });
    if (!opts.disabled) {
      const btn = row.createEl('button', { cls: 'cortex-onboarding-step-action' });
      const ic = btn.createSpan({ cls: 'cortex-onboarding-step-action-icon' });
      setIcon(ic, opts.actionIcon);
      btn.createSpan({ text: opts.actionLabel });
      btn.addEventListener('click', opts.action);
    }
  }
}
