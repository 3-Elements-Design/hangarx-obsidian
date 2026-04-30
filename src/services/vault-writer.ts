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

/** Generate a unique note path, appending (2), (3), etc. if needed. */
async function uniquePath(app: App, folder: string, basename: string): Promise<string> {
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
  const path = await uniquePath(app, folder, `${dateStamp()} - ${title}`);

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
  const path = await uniquePath(app, folder, `${dateStamp(data.createdAt)} - ${title}`);

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
 * Write an agent memory as a vault note.
 */
export async function writeMemoryNote(
  app: App,
  folder: string,
  data: MemoryExportData,
): Promise<string> {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || data.content.slice(0, 50));
  const path = await uniquePath(app, folder, `${dateStamp()} - ${title}`);

  const frontmatter = [
    '---',
    `type: cortex-memory`,
    `date: ${timeStamp()}`,
    `category: ${data.category || 'agent_memory'}`,
    `source: ${data.source || 'mcp'}`,
  ];
  if (data.tags?.length) frontmatter.push(`tags: [${data.tags.join(', ')}]`);
  frontmatter.push('---', '');

  const body = data.content;

  await app.vault.create(path, frontmatter.join('\n') + '\n' + body + '\n');
  return path;
}
