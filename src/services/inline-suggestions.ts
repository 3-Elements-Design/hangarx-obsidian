import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType, keymap } from '@codemirror/view';
import { StateEffect, StateField, Prec, Extension } from '@codemirror/state';
import type { CortexClient } from '../cortex-client';

/**
 * Inline "Copilot for wikilinks": when the user types a recognizable proper-noun-ish
 * token (e.g. "Sarah", "Project Falcon") that matches an existing graph entity,
 * show ghost text after the token suggesting `[[Entity Name]]`.
 *
 * Tab → accept (replace the typed token with `[[Entity]]`)
 * Esc → dismiss
 *
 * Suggestions are debounced (300ms) and cached by token to avoid hammering the API.
 */

interface Suggestion {
  /** The token the user typed (e.g. "Sarah"). */
  token: string;
  /** Entity name to insert as a wikilink. */
  target: string;
  /** Document position where the token starts. */
  from: number;
  /** Document position where the token ends (also where ghost text is inserted). */
  to: number;
}

const setSuggestion = StateEffect.define<Suggestion | null>();

const suggestionField = StateField.define<Suggestion | null>({
  create: () => null,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setSuggestion)) return e.value;
    // Any document change that isn't from our acceptance dismisses the suggestion.
    if (tr.docChanged && value) {
      // If the change happened at-or-near our suggestion, dismiss to re-evaluate.
      return null;
    }
    return value;
  },
});

class GhostWidget extends WidgetType {
  constructor(private text: string) { super(); }
  toDOM(): HTMLElement {
    // Standalone createSpan (no `activeDocument.` prefix) returns a
    // DETACHED span. The prefixed form would auto-append to the document
    // and throw "Only one element on document allowed."
    const span = createSpan();
    span.className = 'cortex-inline-ghost';
    span.textContent = this.text;
    return span;
  }
  ignoreEvent(): boolean { return true; }
}

const ghostDecorations = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(_value, tr) {
    const sug = tr.state.field(suggestionField);
    if (!sug) return Decoration.none;
    // Render ghost text immediately AFTER the token end, showing what would be appended/wrapped.
    const ghostText = ` → [[${sug.target}]]`;
    return Decoration.set([
      Decoration.widget({ widget: new GhostWidget(ghostText), side: 1 }).range(sug.to),
    ]);
  },
  provide: f => EditorView.decorations.from(f),
});

const TOKEN_RE = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})$/;
const MIN_TOKEN_LEN = 3;

/** Build the editor extension. Pass `enabled` predicate so the user setting can turn it off live. */
export function inlineSuggestionsExtension(
  client: CortexClient,
  isEnabled: () => boolean,
): Extension {
  // Per-token cache of resolved entity names (or empty for "no match").
  const cache = new Map<string, string | null>();

  // Existing-vault names we should never suggest replacement for (e.g. user already typed
  // a note name that matches their own current note). Populated lazily.
  const isSelfReference = (token: string, view: EditorView): boolean => {
    // The text immediately preceding the token might already be `[[`, indicating the user
    // is in a wikilink already. Don't suggest in that case.
    const before = view.state.doc.sliceString(Math.max(0, view.state.selection.main.from - 4), view.state.selection.main.from);
    return before.endsWith('[[' + token);
  };

  const fetcher = ViewPlugin.fromClass(
    class {
      private timer: number | null = null;
      private lastFrom = -1;

      constructor(private view: EditorView) {}

      update(u: ViewUpdate): void {
        if (!u.docChanged && !u.selectionSet) return;
        if (!isEnabled()) {
          if (u.state.field(suggestionField, false)) {
            this.view.dispatch({ effects: setSuggestion.of(null) });
          }
          return;
        }
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => { void this.recompute(); }, 300);
      }

      destroy(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
      }

      private async recompute(): Promise<void> {
        const view = this.view;
        const sel = view.state.selection.main;
        if (!sel.empty) return this.clear();

        // Look at the text on the current line up to the cursor.
        const line = view.state.doc.lineAt(sel.from);
        const before = view.state.doc.sliceString(line.from, sel.from);

        // Skip if user is inside an open wikilink already.
        if (/\[\[[^\]]*$/.test(before)) return this.clear();
        // Skip if cursor is inside a code span / code block (heuristic: odd number of backticks).
        const backticks = (before.match(/`/g) || []).length;
        if (backticks % 2 === 1) return this.clear();

        const m = TOKEN_RE.exec(before);
        if (!m) return this.clear();
        const token = m[1];
        if (token.length < MIN_TOKEN_LEN) return this.clear();
        if (isSelfReference(token, view)) return this.clear();

        const tokenStart = line.from + before.length - token.length;

        // Cache lookup.
        if (cache.has(token)) {
          const target = cache.get(token);
          if (!target || target === token) return this.clear();
          this.show({ token, target, from: tokenStart, to: tokenStart + token.length });
          return;
        }

        // Same range as last lookup? avoid duplicate fetches.
        if (this.lastFrom === tokenStart) return;
        this.lastFrom = tokenStart;

        try {
          const hits = await client.searchEntitiesByName(token, 5);
          // Prefer exact-name match, then prefix match.
          const exact = hits.find(h => h.name === token);
          const prefix = hits.find(h => h.name.toLowerCase().startsWith(token.toLowerCase()) && h.name !== token);
          const best = exact ?? prefix ?? null;
          const target = best?.name ?? null;
          cache.set(token, target);
          if (!target || target === token) return this.clear();

          // Re-check that the cursor is still right after the same token
          // (user may have kept typing during the fetch).
          const nowSel = view.state.selection.main;
          const nowLine = view.state.doc.lineAt(nowSel.from);
          const nowBefore = view.state.doc.sliceString(nowLine.from, nowSel.from);
          const nowMatch = TOKEN_RE.exec(nowBefore);
          if (!nowMatch || nowMatch[1] !== token) return;

          const nowTokenStart = nowLine.from + nowBefore.length - token.length;
          this.show({ token, target, from: nowTokenStart, to: nowTokenStart + token.length });
        } catch {
          // Network/auth failure — silently skip; don't spam notices on every keystroke.
        }
      }

      private show(s: Suggestion): void {
        this.view.dispatch({ effects: setSuggestion.of(s) });
      }

      private clear(): void {
        if (this.view.state.field(suggestionField, false)) {
          this.view.dispatch({ effects: setSuggestion.of(null) });
        }
      }
    },
  );

  // Tab to accept, Esc to dismiss. High precedence so we beat default bindings when active.
  const suggestionKeymap = Prec.highest(
    keymap.of([
      {
        key: 'Tab',
        run(view) {
          const sug = view.state.field(suggestionField, false);
          if (!sug) return false;
          // Replace token with [[target]].
          view.dispatch({
            changes: { from: sug.from, to: sug.to, insert: `[[${sug.target}]]` },
            selection: { anchor: sug.from + sug.target.length + 4 },
            effects: setSuggestion.of(null),
          });
          return true;
        },
      },
      {
        key: 'Escape',
        run(view) {
          const sug = view.state.field(suggestionField, false);
          if (!sug) return false;
          view.dispatch({ effects: setSuggestion.of(null) });
          return true;
        },
      },
    ]),
  );

  return [suggestionField, ghostDecorations, fetcher, suggestionKeymap];
}
