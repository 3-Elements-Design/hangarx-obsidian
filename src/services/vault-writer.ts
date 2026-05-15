import { App, TFolder, normalizePath } from 'obsidian';

/**
 * Shared utility for writing structured notes to the vault.
 * Used by chat export, memory write-back, and graph diff export.
 */

// ── Types ────────────────────────────────────────────────────────

export interface ChatExportData {
  title: string;
  turns: { role: 'user' | 'ai'; content: string }[];
  entities?: string[];
  citations?: { source: string; url?: string }[];
  createdAt: number;
}

export interface MemoryExportData {
  content: string;
  title?: string;
  category?: string;
  tags?: string[];
  source?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

function dateStamp(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 10);
}

function timeStamp(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/** Sanitize a string for use as a filename (no slashes, colons, etc.) */
function sanitize(name: string): string {
  return name
    .replace(/[/\\:*?"<>|#^[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

/** Ensure the folder exists, creating it recursively if needed. */
async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof TFolder) return;
  if (existing) return; // it's a file with that name — don't overwrite
  await app.vault.createFolder(normalized);
}

/** Generate a unique note path, appending (2), (3), etc. if needed.
 *  Synchronous — `getAbstractFileByPath` is sync; no awaits needed. */
function uniquePath(app: App, folder: string, basename: string): string {
  const base = normalizePath(`${folder}/${basename}`);
  let path = `${base}.md`;
  let i = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = `${base} (${i}).md`;
    i++;
  }
  return path;
}

// ── Writers ──────────────────────────────────────────────────────

/**
 * Save a single AI answer (one Q&A turn) as a vault note.
 */
export async function writeSingleAnswerNote(
  app: App,
  folder: string,
  question: string,
  answer: string,
  entities?: string[],
  citations?: { source: string; url?: string }[],
): Promise<string> {
  await ensureFolder(app, folder);
  const title = sanitize(question.slice(0, 60));
  const path = uniquePath(app, folder, `${dateStamp()} - ${title}`);

  const frontmatter = [
    '---',
    `type: cortex-chat`,
    `question: "${question.replace(/"/g, '\\"')}"`,
    `date: ${timeStamp()}`,
  ];
  if (entities?.length) frontmatter.push(`entities: [${entities.map(e => `"${e}"`).join(', ')}]`);
  frontmatter.push('---', '');

  const body = [
    `> **Q:** ${question}`,
    '',
    answer,
  ];

  if (citations?.length) {
    body.push('', '---', '', '## Sources');
    for (const c of citations) {
      if (c.url) body.push(`- [${c.source}](${c.url})`);
      else body.push(`- [[${c.source}]]`);
    }
  }

  await app.vault.create(path, frontmatter.join('\n') + '\n' + body.join('\n') + '\n');
  return path;
}

/**
 * Export an entire conversation as a vault note.
 */
export async function writeConversationNote(
  app: App,
  folder: string,
  data: ChatExportData,
): Promise<string> {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || 'Untitled Chat');
  const path = uniquePath(app, folder, `${dateStamp(data.createdAt)} - ${title}`);

  const frontmatter = [
    '---',
    `type: cortex-conversation`,
    `title: "${data.title?.replace(/"/g, '\\"') || 'Untitled'}"`,
    `date: ${timeStamp(data.createdAt)}`,
    `turns: ${data.turns.length}`,
  ];
  if (data.entities?.length) frontmatter.push(`entities: [${data.entities.map(e => `"${e}"`).join(', ')}]`);
  frontmatter.push('---', '');

  const body: string[] = [];
  for (const t of data.turns) {
    if (t.role === 'user') {
      body.push(`## Q: ${t.content}`, '');
    } else {
      body.push(t.content, '');
    }
  }

  if (data.citations?.length) {
    body.push('---', '', '## Sources');
    for (const c of data.citations) {
      if (c.url) body.push(`- [${c.source}](${c.url})`);
      else body.push(`- [[${c.source}]]`);
    }
  }

  await app.vault.create(path, frontmatter.join('\n') + '\n' + body.join('\n') + '\n');
  return path;
}

/**
 * Pull a leading `---...---` YAML block out of the supplied content. Returns
 * the parsed key/value map plus the remaining body. Hand-rolled (rather than
 * a YAML dep) because the surface we need to handle is small: simple
 * `key: value` lines, optional flow-style arrays (`[a, b, c]`). Returns
 * `{ fm: {}, body: content }` unchanged when no leading frontmatter exists.
 *
 * Why this exists: agents calling cortex_remember sometimes include their own
 * YAML frontmatter in the `content` payload (aliases, tags, links, etc.).
 * The old write path naively prepended the plugin's auto-frontmatter and
 * shoved the caller's content directly after — producing two YAML blocks,
 * only the first of which Obsidian's parser recognised. The caller's
 * frontmatter ended up rendered as body text and `aliases` never registered,
 * breaking wikilink resolution.
 */
function extractLeadingFrontmatter(content: string): { fm: Record<string, string>; body: string } {
  // Match: opening ---\n, captured body, closing \n---(\n? to allow trailing
  // newline or EOF). Non-greedy on the captured group so an early closing
  // --- wins over a later one inside the body.
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { fm: {}, body: content };
  const fm: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2];
  }
  return { fm, body: content.slice(match[0].length) };
}

/** Parse flow-style or single-value YAML list into an array of strings.
 *  Handles `[a, b, c]`, `[a]`, and bare values. Quoted strings are unwrapped. */
function parseInlineList(value: string): string[] {
  const flow = value.match(/^\[(.*)\]$/);
  const inner = flow ? flow[1] : value;
  return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

/**
 * Write an agent memory as a vault note.
 *
 * Frontmatter handling: plugin-managed keys (`type`, `date`, `category`,
 * `source`) always win — those identify the file as a cortex memory and
 * shouldn't be redefinable by the caller. Tags from `data.tags` (the MCP
 * arg) AND tags inside the caller's leading frontmatter are unioned.
 * Every other caller-supplied frontmatter key (aliases, custom tags,
 * project, etc.) is preserved verbatim.
 */
export async function writeMemoryNote(
  app: App,
  folder: string,
  data: MemoryExportData,
): Promise<string> {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || data.content.slice(0, 50));
  const path = uniquePath(app, folder, `${dateStamp()} - ${title}`);

  const { fm: callerFm, body: cleanBody } = extractLeadingFrontmatter(data.content);

  // Plugin-managed keys. These override caller's values on conflict — the
  // plugin owns the identity of these files, and "type: cortex-memory" being
  // overridable would mean other surfaces can't reliably distinguish memories
  // from regular notes.
  const autoFm: Record<string, string> = {
    type: 'cortex-memory',
    date: timeStamp(),
    category: data.category || 'agent_memory',
    source: data.source || 'mcp',
  };

  // Caller's frontmatter first, plugin overrides last so plugin keys win.
  const merged: Record<string, string> = { ...callerFm, ...autoFm };

  // Union all tags from both sources, dedupe, write back in flow style.
  // This handles three cases cleanly:
  //   - tags from data.tags only → wrote as flow array
  //   - tags in caller's frontmatter only → preserved
  //   - both → unioned without duplication
  const allTags = new Set<string>();
  if (data.tags?.length) {
    for (const t of data.tags) allTags.add(t);
  }
  if (callerFm.tags) {
    for (const t of parseInlineList(callerFm.tags)) allTags.add(t);
  }
  if (allTags.size > 0) {
    merged.tags = `[${[...allTags].join(', ')}]`;
  } else {
    delete merged.tags;
  }

  const frontmatter: string[] = ['---'];
  for (const [key, value] of Object.entries(merged)) {
    frontmatter.push(`${key}: ${value}`);
  }
  frontmatter.push('---', '');

  await app.vault.create(path, frontmatter.join('\n') + '\n' + cleanBody + '\n');
  return path;
}
