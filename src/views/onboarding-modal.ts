import { App, Modal, setIcon } from 'obsidian';
import type CortexPlugin from '../main';
import { appendHangarxLogo } from '../assets';

/**
 * First-run onboarding modal. Opens automatically the first time the plugin
 * loads (when `settings.onboardingShownAt` is unset), and is also reachable
 * via a command for users who want to revisit.
 *
 * Three gated steps that auto-detect completion from existing state:
 *   1. Connect — cloud has apiKey+workspaceId, OR local has workspaceId
 *   2. Sync     — at least one entry in vault-sync hash index
 *   3. Ask      — at least one persisted conversation
 *
 * The modal polls its own state every 800ms while open, so as the user
 * completes each step (e.g., signs in via the settings panel without
 * closing the modal), the checks light up live. Once all three are
 * complete, the modal auto-celebrates + closes after a short delay.
 */
export class OnboardingModal extends Modal {
  private pollTimer: number | null = null;
  private autoCloseTimer: number | null = null;
  private bodyEl!: HTMLElement;
  // Cache of step 2 + 3 detection — populated async at open and refreshed
  // on each poll tick.
  private cache: { hasSyncedAnything: boolean; hasAnyConversation: boolean } = {
    hasSyncedAnything: false,
    hasAnyConversation: false,
  };

  constructor(app: App, private plugin: CortexPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.modalEl.addClass('cortex-onboarding-modal');
    this.titleEl.empty();
    const titleWrap = this.titleEl.createDiv({ cls: 'cortex-onboarding-title' });
    const logo = titleWrap.createDiv({ cls: 'cortex-onboarding-logo' });
    appendHangarxLogo(logo);
    titleWrap.createEl('span', { text: 'Welcome to HangarX' });

    this.bodyEl = this.contentEl.createDiv({ cls: 'cortex-onboarding-modal-body' });
    this.bodyEl.createEl('p', {
      cls: 'cortex-onboarding-tagline',
      text: 'Your Obsidian vault becomes a knowledge graph that every AI agent on your machine can query — Claude Desktop, Claude Code, Cursor, Cline, Windsurf. Three steps to set it up.',
    });

    await this.refreshCache();
    this.renderSteps();

    // Live-update while open. The user often steps OUT of the modal (e.g.
    // into settings to sign in) and back; polling here means the check
    // marks update in place without needing to reopen.
    this.pollTimer = window.setInterval(() => {
      void this.refreshAndRerender();
    }, 800);

    this.plugin.settings.onboardingShownAt = Date.now();
    void this.plugin.saveSettings();
  }

  onClose(): void {
    if (this.pollTimer != null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.autoCloseTimer != null) {
      window.clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.contentEl.empty();
  }

  private getState(): {
    step1Done: boolean;
    step2Done: boolean;
    step3Done: boolean;
    allComplete: boolean;
  } {
    const s = this.plugin.settings;
    const isCloud = s.connectionMode === 'cloud';
    const step1Done = isCloud ? !!(s.apiKey && s.workspaceId) : !!s.workspaceId;
    const step2Done = this.cache.hasSyncedAnything;
    const step3Done = this.cache.hasAnyConversation;
    return {
      step1Done,
      step2Done,
      step3Done,
      allComplete: step1Done && step2Done && step3Done,
    };
  }

  private async refreshCache(): Promise<void> {
    try {
      const conversations = await this.plugin.conversations.list().catch(() => []);
      this.cache.hasAnyConversation = conversations.length > 0;
    } catch { /* keep default false */ }
    try {
      await this.plugin.sync.loadIndex();
      const fileCount = Object.keys((this.plugin.sync as any).index?.files ?? {}).length;
      this.cache.hasSyncedAnything = fileCount > 0;
    } catch { /* keep default false */ }
  }

  private async refreshAndRerender(): Promise<void> {
    const before = this.getState();
    await this.refreshCache();
    const after = this.getState();
    // Re-render only when something flipped — avoids DOM churn each tick.
    if (
      before.step1Done !== after.step1Done ||
      before.step2Done !== after.step2Done ||
      before.step3Done !== after.step3Done
    ) {
      this.renderSteps();
    }
    // All-done state: render the celebration + schedule auto-close.
    if (after.allComplete && !this.autoCloseTimer) {
      this.scheduleAutoClose();
    }
  }

  private scheduleAutoClose(): void {
    if (this.autoCloseTimer) return;
    this.autoCloseTimer = window.setTimeout(() => this.close(), 2500);
  }

  private renderSteps(): void {
    // Preserve the tagline, replace everything below it.
    this.bodyEl.querySelectorAll('.cortex-onboarding-modal-steps, .cortex-onboarding-modal-progress, .cortex-onboarding-modal-footer, .cortex-onboarding-modal-celebration').forEach(el => el.remove());

    const state = this.getState();

    // Celebration replaces the steps entirely once everything is done.
    if (state.allComplete) {
      const cel = this.bodyEl.createDiv({ cls: 'cortex-onboarding-modal-celebration' });
      const ic = cel.createSpan({ cls: 'cortex-onboarding-modal-celebration-icon' });
      setIcon(ic, 'check-circle');
      cel.createEl('div', {
        cls: 'cortex-onboarding-modal-celebration-title',
        text: 'You\'re all set.',
      });
      cel.createEl('div', {
        cls: 'cortex-onboarding-modal-celebration-sub',
        text: 'HangarX is connected, your notes are synced, and the chat is ready. Closing this in a moment…',
      });
      return;
    }

    // Progress bar.
    const stepCount = (state.step1Done ? 1 : 0) + (state.step2Done ? 1 : 0) + (state.step3Done ? 1 : 0);
    const progress = this.bodyEl.createDiv({ cls: 'cortex-onboarding-modal-progress' });
    const bar = progress.createDiv({ cls: 'cortex-onboarding-modal-progress-bar' });
    bar.style.width = `${(stepCount / 3) * 100}%`;
    progress.createSpan({
      cls: 'cortex-onboarding-modal-progress-label',
      text: `${stepCount} of 3 done`,
    });

    // Steps.
    const steps = this.bodyEl.createDiv({ cls: 'cortex-onboarding-modal-steps' });

    this.renderStep(steps, {
      done: state.step1Done,
      number: 1,
      title: 'Connect HangarX',
      desc: state.step1Done
        ? `Connected — running in ${this.plugin.settings.connectionMode === 'cloud' ? 'Cloud' : 'Local'} mode.`
        : 'Pick Cloud (one-click OAuth) or Local (Docker on your machine), then enter the connection details.',
      actionLabel: state.step1Done ? 'Settings' : 'Open settings',
      actionIcon: 'plug',
      action: () => {
        (this.app as any).setting?.open?.();
        (this.app as any).setting?.openTabById?.('hangarx');
      },
    });

    this.renderStep(steps, {
      done: state.step2Done,
      number: 2,
      title: 'Sync your first notes',
      desc: state.step2Done
        ? 'Your vault has been synced to the knowledge graph at least once.'
        : 'Push your vault content to the knowledge graph so HangarX can answer questions about it.',
      actionLabel: state.step2Done ? 'Re-sync' : 'Sync now',
      actionIcon: 'arrow-up',
      action: () => {
        void import('./sync-modal').then(m => new m.SyncModal(this.app, this.plugin).open());
      },
      disabled: !state.step1Done,
    });

    this.renderStep(steps, {
      done: state.step3Done,
      number: 3,
      title: 'Try a question',
      desc: state.step3Done
        ? 'You\'ve had at least one conversation. Keep going.'
        : 'Ask a question about your notes — open the chat in the right sidebar and try a starter prompt.',
      actionLabel: 'Open chat',
      actionIcon: 'message-square',
      action: () => {
        // Activate the chat view, optionally prefill the composer.
        void this.plugin.askInChat('What was I working on this week? Highlight key projects, decisions, and open questions.');
        this.close();
      },
      disabled: !state.step2Done,
    });

    // Footer — escape hatch + dismiss.
    const footer = this.bodyEl.createDiv({ cls: 'cortex-onboarding-modal-footer' });
    const skipBtn = footer.createEl('button', { cls: 'cortex-onboarding-modal-skip', text: 'I\'ll come back later' });
    skipBtn.addEventListener('click', () => this.close());
    const help = footer.createEl('a', {
      cls: 'cortex-onboarding-modal-help',
      attr: { href: 'https://app.hangarx.ai/obsidian', target: '_blank', rel: 'noopener' },
      text: 'Read the docs →',
    });
    help.addEventListener('click', evt => evt.stopPropagation());
  }

  private renderStep(parent: HTMLElement, opts: {
    done: boolean;
    number: number;
    title: string;
    desc: string;
    actionLabel: string;
    actionIcon: string;
    action: () => void;
    disabled?: boolean;
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
