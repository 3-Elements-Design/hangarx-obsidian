/**
 * Vault sync — pushes vault content into the Cortex knowledge graph.
 *
 * Single-device, single-purpose. Watches the vault for create/modify/delete/
 * rename events and replays them to the Cortex API. Uses a content-hash index
 * at `.cortex/index.json` to avoid re-pushing unchanged files across restarts.
 *
 * Features intentionally removed (Apr 2026 simplification):
 *   - Multi-device leader election     — Obsidian Sync handles cross-device
 *   - Network policy (cellular/battery) — handled by OS-level data savers
 *   - Versioned snapshots               — git or Obsidian Sync replaces this
 *   - Conflict file surfacing           — niche; users can grep for them
 *   - Inbox ack tracking                — no inbox feature anymore
 */
import { App, Notice, TAbstractFile, TFile, normalizePath } from 'obsidian';
import type { CortexClient } from '../cortex-client';
import type { CortexSettings } from '../settings';

const INDEX_PATH = '.cortex/index.json';

interface FileSyncState {
  hash: string;
  hashedAt: number;
  ingestCount: number;
  lastIngestAt?: number;
}

interface SyncIndex {
  /** Legacy path → hash map. Kept for back-compat with v0.1 indexes. */
  hashes: Record<string, string>;
  /** Rich per-file state, populated going forward. */
  files: Record<string, FileSyncState>;
  /** Set of paths whose attachments we've already synced (path → ingest time). */
  attachments: Record<string, number>;
  vaultId: string;
  lastFullSyncAt?: number;
}

const ATTACHMENT_RE =
  /!\[\[([^\]|#]+\.(?:png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm))(?:[|#][^\]]*)?\]\]|!\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm))\)/gi;

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export class VaultSync {
  private index: SyncIndex = emptyIndex();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private indexLoaded = false;
  private indexWriteQueue: Promise<void> = Promise.resolve();

  constructor(
    private app: App,
    private client: CortexClient,
    private settings: CortexSettings,
  ) {}

  // ---------- Index I/O ------------------------------------------------

  async loadIndex(): Promise<void> {
    if (this.indexLoaded) return;
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(INDEX_PATH)) {
        const raw = JSON.parse(await adapter.read(INDEX_PATH));
        this.index = mergeIndex(raw, this.settings.vaultId);
      } else {
        this.index = emptyIndex(this.settings.vaultId);
      }
    } catch (e) {
      console.warn('[Cortex] Failed to load sync index, starting fresh:', e);
      this.index = emptyIndex(this.settings.vaultId);
    }
    this.indexLoaded = true;
  }

  /** Serialised so concurrent syncFile calls don't clobber each other. */
  private async saveIndex(): Promise<void> {
    this.indexWriteQueue = this.indexWriteQueue.then(async () => {
      const adapter = this.app.vault.adapter;
      if (!(await adapter.exists('.cortex'))) {
        await adapter.mkdir('.cortex');
      }
      await adapter.write(INDEX_PATH, JSON.stringify(this.index, null, 2));
    }).catch(e => { console.warn('[Cortex] saveIndex failed', e); });
    return this.indexWriteQueue;
  }

  /**
   * Wipe the per-file hash + state index, forcing the next sync to re-push
   * every file. Used when the server-side graph has been reset (e.g. Postgres
   * volume dropped) — the index would otherwise think files are already synced.
   */
  async clearIndex(): Promise<void> {
    await this.loadIndex();
    this.index = emptyIndex(this.settings.vaultId);
    await this.saveIndex();
  }

  /**
   * Cheap (in-memory) walk over the vault + index that returns counts of
   * files changed/added/deleted since the last sync. Drives the SyncModal
   * picker stat row — *no* file content is hashed; we use Obsidian's
   * mtime/size to spot likely changes. Exact result requires a full sync.
   */
  async getChangesSinceLastSync(): Promise<{
    changed: number;
    added: number;
    deleted: number;
    total: number;
    lastSyncedAt: number | null;
  }> {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const eligible = all.filter(f => !this.isExcluded(f.path));

    const known = this.index.files;
    const seen = new Set<string>();

    let changed = 0;
    let added = 0;
    let lastSyncedAt: number | null = null;

    for (const f of eligible) {
      seen.add(f.path);
      const state = known[f.path];
      if (!state) {
        added++;
        continue;
      }
      // mtime is the cheapest fingerprint that catches edits without
      // re-hashing every file. False positives are fine — they just mean
      // the actual sync re-hashes and no-ops on identical content.
      if (f.stat.mtime > state.hashedAt) {
        changed++;
      }
      if (state.hashedAt && (!lastSyncedAt || state.hashedAt > lastSyncedAt)) {
        lastSyncedAt = state.hashedAt;
      }
    }

    let deleted = 0;
    for (const path of Object.keys(known)) {
      if (!seen.has(path)) deleted++;
    }

    return { changed, added, deleted, total: eligible.length, lastSyncedAt };
  }

  // ---------- Path filtering ------------------------------------------

  private isExcluded(path: string): boolean {
    // Always exclude folders Cortex writes to itself, to prevent feedback
    // loops: chat exports, memory snapshots, and pulled graph entities.
    const cortexOutputFolders = [
      this.settings.chatExportFolder,
      this.settings.memoryFolder,
      this.settings.graphPullFolder,
    ].filter((f): f is string => !!f && f.length > 0);
    if (cortexOutputFolders.some(f => path.startsWith(f))) return true;

    if (this.settings.excludePatterns.some(p => p && path.startsWith(p))) return true;
    const includes = this.settings.includeFolders.filter(Boolean);
    if (includes.length > 0 && !includes.some(p => path.startsWith(p))) return true;
    return false;
  }

  // ---------- Hashing -------------------------------------------------

  private async hashContent(content: string): Promise<string> {
    const buf = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hashBytes(bytes: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------- Full sync -----------------------------------------------

  async fullSync(opts?: {
    onProgress?: (p: { phase: 'sync' | 'delete'; done: number; total: number; currentPath?: string }) => void;
    signal?: AbortSignal;
    /** Pass true for force-reingest to use the server's fastMode path (bigger
     *  LLM window, parallel harmonizer batches, skips post-ingest VDB indexing
     *  and community detection). The caller is responsible for triggering the
     *  cleanup pass afterwards via the "Rebuild communities + reindex" command. */
    fastMode?: boolean;
  }): Promise<{ synced: number; skipped: number; deleted: number; failed?: number; failedPaths?: string[]; paused?: string; syncJobId?: string }> {
    await this.loadIndex();

    const all = this.app.vault.getMarkdownFiles();
    const files = all.filter(f => !this.isExcluded(f.path));
    const total = files.length;
    const onProgress = opts?.onProgress;
    const signal = opts?.signal;

    // Per-session cancellation token. Sent on every ingest call as
    // x-sync-job-id; the abort handler below POSTs to /v1/ingest/jobs/<id>
    // /cancel so in-flight server work bails out at the next chunk boundary
    // instead of running to completion after the user clicks Cancel.
    const syncJobId = crypto.randomUUID();
    if (signal && !signal.aborted) {
      const onAbort = (): void => {
        this.client.cancelSyncJob(syncJobId).catch(e =>
          console.warn('[Cortex] cancelSyncJob failed (non-fatal):', e),
        );
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    let synced = 0, skipped = 0, deleted = 0;
    let failed = 0;
    const failedPaths: string[] = [];
    const seenPaths = new Set<string>();

    // Parallelism. Each ingest blocks on server-side LLM extraction (multi-
    // second per file), so sequential iteration scales linearly with file
    // count — a 600-file vault took ~50min sequentially. Six concurrent
    // requests gets us most of the speedup without overwhelming the LLM
    // provider's rate limit. Tunable via SYNC_CONCURRENCY env-like setting
    // if we ever wire one; for now 6 is a safe default.
    const SYNC_CONCURRENCY = 6;
    onProgress?.({ phase: 'sync', done: 0, total });
    let cursor = 0;
    let done = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        // Honour cancellation between files. In-flight requests still
        // complete (cleaner than tearing down a half-written ingest), but
        // no new files get scheduled.
        if (signal?.aborted) return;
        const idx = cursor++;
        if (idx >= files.length) return;
        const file = files[idx];
        seenPaths.add(file.path);
        try {
          const result = await this.syncFile(file, /* persistImmediately */ false, {
            fastMode: opts?.fastMode === true,
            syncJobId,
          });
          if (result === 'synced') synced++;
          else if (result === 'unchanged') skipped++;
        } catch (e) {
          failed++;
          failedPaths.push(file.path);
          console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
        }
        done++;
        onProgress?.({ phase: 'sync', done, total, currentPath: file.path });
      }
    };

    const workerCount = Math.min(SYNC_CONCURRENCY, files.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    // If cancelled mid-sync, skip the delete pass entirely — `seenPaths` is
    // incomplete, so attempting deletions would wipe files that just hadn't
    // been visited yet. Persist what we did sync and bail.
    if (signal?.aborted) {
      this.index.lastFullSyncAt = Date.now();
      await this.saveIndex();
      return { synced, skipped, deleted: 0, failed, failedPaths, paused: 'cancelled', syncJobId };
    }

    // Detect deletions: anything we know about that's no longer in the vault
    // (and isn't excluded by current rules — leave excluded entries alone).
    const known = new Set([
      ...Object.keys(this.index.hashes),
      ...Object.keys(this.index.files),
    ]);
    const deletionCandidates = [...known].filter(p => !seenPaths.has(p) && !this.isExcluded(p));
    onProgress?.({ phase: 'delete', done: 0, total: deletionCandidates.length });
    // Deletions parallelise too — each is a small DB write but still
    // network-bound, so concurrency = throughput.
    const DELETE_CONCURRENCY = 6;
    let dCursor = 0;
    let dDone = 0;
    const deleteWorker = async (): Promise<void> => {
      while (true) {
        if (signal?.aborted) return;
        const idx = dCursor++;
        if (idx >= deletionCandidates.length) return;
        const knownPath = deletionCandidates[idx];
        try {
          await this.client.deleteNote(knownPath);
          delete this.index.hashes[knownPath];
          delete this.index.files[knownPath];
          delete this.index.attachments[knownPath];
          deleted++;
        } catch (e) {
          console.warn(`[Cortex] Delete failed for ${knownPath}:`, e);
        }
        dDone++;
        onProgress?.({ phase: 'delete', done: dDone, total: deletionCandidates.length, currentPath: knownPath });
      }
    };
    if (deletionCandidates.length > 0) {
      await Promise.all(Array.from(
        { length: Math.min(DELETE_CONCURRENCY, deletionCandidates.length) },
        () => deleteWorker(),
      ));
    }

    this.index.lastFullSyncAt = Date.now();
    await this.saveIndex();
    return { synced, skipped, deleted, failed, failedPaths, syncJobId };
  }

  // ---------- Single-file sync ----------------------------------------

  /**
   * Per-file event handler with debouncing. Triggered from main.ts.
   */
  scheduleFileSync(file: TAbstractFile): void {
    if (!(file instanceof TFile) || file.extension !== 'md') return;
    if (this.isExcluded(file.path)) return;

    const existing = this.debounceTimers.get(file.path);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(file.path);
      try {
        await this.syncFile(file);
      } catch (e) {
        console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
      }
    }, this.settings.autoSyncDebounceMs);
    this.debounceTimers.set(file.path, timer);
  }

  /**
   * Compute a four-bucket diff between this vault and the names of Note
   * entities the cortex graph has materialized. Caller fetches the graph
   * names via the cortex client (paginated `exportGraphPage`); this method
   * does the local walk + set algebra, leaving HTTP and rendering to the
   * caller.
   *
   *   vaultOnly  — markdown files in the vault not represented in the graph
   *   graphOnly  — Note entity names in the graph with no local file
   *   drifted    — present in both, but the local file's mtime is newer
   *                than the last-synced timestamp (likely needs re-sync)
   *   inSync     — present in both, mtime ≤ last hashedAt
   *
   * Match key is the file basename (without `.md`), which is what graph-pull
   * uses for `noteName` on Note entities.
   */
  async computeVaultGraphDiff(graphNoteNames: Set<string>): Promise<{
    vaultOnly: TFile[];
    graphOnly: string[];
    drifted: TFile[];
    inSync: TFile[];
  }> {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const eligible = all.filter(f => !this.isExcluded(f.path));

    const vaultOnly: TFile[] = [];
    const drifted: TFile[] = [];
    const inSync: TFile[] = [];
    const matchedGraphNames = new Set<string>();

    for (const f of eligible) {
      if (graphNoteNames.has(f.basename)) {
        matchedGraphNames.add(f.basename);
        const state = this.index.files[f.path];
        // No index entry → never synced from this client. Treat as drifted
        // (the graph has it from another source, but we don't know if the
        // local content matches what was ingested).
        if (!state) {
          drifted.push(f);
          continue;
        }
        if (f.stat.mtime > state.hashedAt) drifted.push(f);
        else inSync.push(f);
      } else {
        vaultOnly.push(f);
      }
    }

    const graphOnly: string[] = [];
    for (const name of graphNoteNames) {
      if (!matchedGraphNames.has(name)) graphOnly.push(name);
    }

    return { vaultOnly, graphOnly, drifted, inSync };
  }

  /**
   * Public single-file sync — for the "Sync current note" command. Bypasses
   * the auto-sync debouncer so the user gets an immediate push. Returns the
   * usual three-way result so the caller can show a Notice based on outcome.
   */
  async syncOneFile(file: TFile, opts: { fastMode?: boolean; syncJobId?: string } = {}): Promise<'synced' | 'unchanged' | 'skipped'> {
    return this.syncFile(file, true, opts);
  }

  /**
   * Returns 'synced' | 'unchanged' | 'skipped'. If `persistImmediately` is
   * false, the caller is responsible for calling saveIndex().
   */
  private async syncFile(
    file: TFile,
    persistImmediately = true,
    opts: { fastMode?: boolean; syncJobId?: string } = {},
  ): Promise<'synced' | 'unchanged' | 'skipped'> {
    await this.loadIndex();

    const content = await this.app.vault.cachedRead(file);
    // Strip frontmatter before the empty-content check — a file with only
    // frontmatter has zero body content, and the API rejects empty contentText.
    const body = stripFrontmatter(content).trim();
    if (body.length === 0) return 'skipped';
    const hash = await this.hashContent(content);

    const prior = this.getFileState(file.path);
    if (prior && prior.hash === hash) return 'unchanged';

    try {
      await this.client.ingestNote(file.path, content, {
        fastMode: opts.fastMode === true,
        syncJobId: opts.syncJobId,
      });
    } catch (e) {
      throw e;
    }

    // Update per-file state
    const now = Date.now();
    const next: FileSyncState = {
      hash,
      hashedAt: now,
      ingestCount: (prior?.ingestCount ?? 0) + 1,
      lastIngestAt: now,
    };
    this.index.files[file.path] = next;
    this.index.hashes[file.path] = hash; // keep legacy mirror

    // Best-effort attachment sync alongside the note
    if (this.settings.syncAttachments) {
      try {
        await this.syncAttachmentsFor(file, content, opts.syncJobId);
      } catch (e) {
        console.warn('[Cortex] attachment sync failed', e);
      }
    }

    if (persistImmediately) await this.saveIndex();
    return 'synced';
  }

  async handleDelete(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile) || file.extension !== 'md') return;
    await this.loadIndex();

    if (!this.index.files[file.path] && !this.index.hashes[file.path]) return;
    try {
      await this.client.deleteNote(file.path);
    } catch (e) {
      console.warn(`[Cortex] Delete failed for ${file.path}:`, e);
      return;
    }
    delete this.index.files[file.path];
    delete this.index.hashes[file.path];
    delete this.index.attachments[file.path];
    await this.saveIndex();
  }

  async handleRename(file: TAbstractFile, oldPath: string): Promise<void> {
    if (!(file instanceof TFile) || file.extension !== 'md') return;
    await this.loadIndex();

    if (this.index.files[oldPath] || this.index.hashes[oldPath]) {
      try { await this.client.deleteNote(oldPath); } catch { /* non-fatal */ }
      delete this.index.files[oldPath];
      delete this.index.hashes[oldPath];
    }
    this.scheduleFileSync(file);
  }

  // ---------- Attachments ---------------------------------------------

  private async syncAttachmentsFor(noteFile: TFile, content: string, syncJobId?: string): Promise<void> {
    const refs = extractAttachmentRefs(content);
    if (refs.length === 0) return;

    for (const ref of refs) {
      const target = this.resolveAttachment(noteFile, ref);
      if (!target) continue;
      if (this.isExcluded(target.path)) continue;

      const stat = await this.app.vault.adapter.stat(target.path);
      if (!stat || stat.size === 0) continue;
      if (stat.size > this.settings.attachmentMaxBytes) {
        console.warn(`[Cortex] skipping ${target.path} — ${stat.size} > attachmentMaxBytes`);
        continue;
      }

      const bytes = await this.app.vault.readBinary(target);
      const hash = await this.hashBytes(bytes);
      const known = this.index.attachments[target.path];
      const fileState = this.index.files[target.path];
      if (known && fileState?.hash === hash) continue;

      const ext = target.extension.toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (!mime) continue;

      const base64 = arrayBufferToBase64(bytes);
      if (base64.length === 0) continue;
      try {
        await this.client.ingestBinary(target.path, mime, base64, { syncJobId });
        this.index.attachments[target.path] = Date.now();
        this.index.files[target.path] = {
          hash,
          hashedAt: Date.now(),
          ingestCount: (fileState?.ingestCount ?? 0) + 1,
          lastIngestAt: Date.now(),
        };
      } catch (e) {
        console.warn(`[Cortex] attachment ingest failed for ${target.path}`, e);
      }
    }
  }

  private resolveAttachment(sourceFile: TFile, ref: string): TFile | null {
    const meta = this.app.metadataCache.getFirstLinkpathDest(ref, sourceFile.path);
    if (meta instanceof TFile) return meta;
    const abs = this.app.vault.getAbstractFileByPath(ref);
    if (abs instanceof TFile) return abs;
    const sib = this.app.vault.getAbstractFileByPath(
      normalizePath(`${sourceFile.parent?.path ?? ''}/${ref}`),
    );
    return sib instanceof TFile ? sib : null;
  }

  // ---------- Misc ----------------------------------------------------

  private getFileState(path: string): FileSyncState | null {
    const rich = this.index.files[path];
    if (rich) return rich;
    const legacy = this.index.hashes[path];
    if (legacy) {
      return { hash: legacy, hashedAt: 0, ingestCount: 0 };
    }
    return null;
  }
}

// =====================================================================
// Helpers (file-scope)
// =====================================================================

/** Strip a leading YAML frontmatter block (`---\n…\n---`). */
function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return content;
  const after = content.slice(end + 4);
  return after.startsWith('\n') ? after.slice(1) : after;
}

function emptyIndex(vaultId = ''): SyncIndex {
  return {
    hashes: {},
    files: {},
    attachments: {},
    vaultId,
  };
}

/** Migrate older index shapes (drops fields from the cut features). */
function mergeIndex(raw: any, vaultId: string): SyncIndex {
  return {
    hashes: raw?.hashes ?? {},
    files: raw?.files ?? {},
    attachments: raw?.attachments ?? {},
    vaultId: raw?.vaultId ?? vaultId,
    lastFullSyncAt: raw?.lastFullSyncAt,
  };
}

function extractAttachmentRefs(markdown: string): string[] {
  const refs: string[] = [];
  let m: RegExpExecArray | null;
  ATTACHMENT_RE.lastIndex = 0;
  while ((m = ATTACHMENT_RE.exec(markdown)) !== null) {
    const ref = (m[1] ?? m[2] ?? '').trim();
    if (ref) refs.push(ref);
  }
  return Array.from(new Set(refs));
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
  }
  return btoa(binary);
}

// Notice import retained for future error-surfacing; not currently used.
void Notice;
