import { App, Modal, Setting } from 'obsidian';

/**
 * Promise-based confirm dialog rendered as an Obsidian Modal.
 *
 * Replaces window.confirm() calls — the obsidianmd ESLint plugin flags
 * those because (a) confirm() can't be styled to match the user's theme
 * and (b) it freezes the renderer thread on some platforms.
 *
 * Resolves to true when the primary CTA is clicked, false on cancel/dismiss.
 *
 *   const ok = await confirmModal(this.app, {
 *     title: 'Force-resync the vault?',
 *     body: 'This wipes the local sync index and re-pushes every file.',
 *     confirmText: 'Force resync',
 *     destructive: true,
 *   })
 */
export interface ConfirmModalOptions {
  title: string
  body: string
  confirmText?: string
  cancelText?: string
  /** Render the confirm button with the destructive (`mod-warning`) style. */
  destructive?: boolean
}

export function confirmModal(app: App, opts: ConfirmModalOptions): Promise<boolean> {
  return new Promise(resolve => {
    let answered = false
    const settle = (value: boolean) => {
      if (answered) return
      answered = true
      resolve(value)
    }

    const modal = new (class extends Modal {
      onOpen(): void {
        this.titleEl.setText(opts.title)
        // Multi-paragraph body: split on `\n\n` so callers can include
        // blank lines without rendering raw newlines.
        for (const paragraph of opts.body.split(/\n{2,}/)) {
          this.contentEl.createEl('p', { text: paragraph })
        }
        new Setting(this.contentEl)
          .addButton(b => b
            .setButtonText(opts.cancelText ?? 'Cancel')
            .onClick(() => { settle(false); this.close() }))
          .addButton(b => {
            b.setButtonText(opts.confirmText ?? 'Confirm')
            if (opts.destructive) b.setWarning()
            else b.setCta()
            b.onClick(() => { settle(true); this.close() })
          })
      }

      onClose(): void {
        // Treat dismissal (esc / click outside) as cancel.
        settle(false)
        this.contentEl.empty()
      }
    })(app)

    modal.open()
  })
}
