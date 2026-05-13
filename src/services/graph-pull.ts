/**
 * Graph Pull service.
 *
 * Pulls entities + relationships from the Cortex cloud graph and
 * materializes them as markdown files in the vault so they appear in
 * Obsidian's native graph view. Supports incremental sync via content
 * hashing (same SHA-256 approach as vault-sync.ts).
 *
 * Entity files live under a configurable folder (default `.cortex/graph/`)
 * organised by type, e.g.:
 *   .cortex/graph/Concept/Machine Learning (Concept).md
 *   .cortex/graph/Person/Jane Doe (Person).md
 *
 * Relationships become [[wikilinks]] inside the entity file, creating
 * edges in Obsidian's graph. Source notes are optionally enriched with
 * `cortex_entities` frontmatter for bidirectional linking.
 */
import { App, TFile, normalizePath } from 'obsidian';
import type { CortexClient, GraphEntity, GraphRelationship } from '../cortex-client';
import type { CortexSettings } from '../settings';

/* ── Types ──────────────────────────────────────────────────────────── */

export interface PullProgress {
  phase: 'fetching' | 'writing' | 'enriching' | 'cleanup' | 'done';
  message: string;
  current: number;
  total: number;
}

export interface PullResult {
  created: number;
  updated: number;
  deleted: number;
  enriched: number;
  errors: string[];
}

interface PullIndex {
  /** entityId → content hash */
  hashes: Record<string, string>;
  /** entityId → vault file path */
  paths: Record<string, string>;
  lastPulledAt?: number;
}

/** Semantic types worth pulling. Everything else (code nodes, signals) is excluded. */
export const DEFAULT_SEMANTIC_TYPES = [
  'Concept', 'Person', 'Organization', 'Topic', 'Location',
  'Event', 'Product', 'Technology', 'Framework', 'Expert',
  'Document', 'Brand', 'Platform', 'Strategy', 'Category',
  'Campaign', 'Patent', 'Country', 'Sector', 'Author',
];

/** Types that are internal / code-level and should never be pulled. */
export const DEFAULT_EXCLUDE_TYPES = [
  'SignalNode', 'Thread', 'Function', 'File', 'Class', 'Method',
  'Interface', 'TypeAlias', 'Variable', 'Enum', 'SynthesisTag',
];

const INDEX_PATH_SUFFIX = '_index.json';

/* ── Service ────────────────────────────────────────────────────────── */

export class GraphPull {
  private index: PullIndex = { hashes: {}, paths: {} };
  private indexLoaded = false;

  constructor(
    private app: App,
    private client: CortexClient,
    private settings: CortexSettings,
  ) {}

  /* ── Index persistence ──────────────────────────────────────────── */

  private get indexPath(): string {
    return normalizePath(`${this.settings.graphPullFolder}/${INDEX_PATH_SUFFIX}`);
  }

  private async loadIndex(): Promise<void> {
    if (this.indexLoaded) return;
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(this.indexPath)) {
        this.index = JSON.parse(await adapter.read(this.indexPath)) as PullIndex;
      } else {
        this.index = { hashes: {}, paths: {} };
      }
    } catch {
      this.index = { hashes: {}, paths: {} };
    }
    this.indexLoaded = true;
  }

  private async saveIndex(): Promise<void> {
    const dir = this.settings.graphPullFolder;
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
    await adapter.write(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /* ── Hash helper (matches vault-sync.ts) ────────────────────────── */

  private async hash(content: string): Promise<string> {
    const buf = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Main pull flow ─────────────────────────────────────────────── */

  async pull(onProgress?: (p: PullProgress) => void): Promise<PullResult> {
    await this.loadIndex();

    const result: PullResult = { created: 0, updated: 0, deleted: 0, enriched: 0, errors: [] };
    const typesToPull = this.resolveTypes();

    // Phase 1: Fetch all entities + relationships
    onProgress?.({ phase: 'fetching', message: 'Fetching entities from Cortex…', current: 0, total: 0 });
    const { entities, relationships } = await this.fetchAll(typesToPull, onProgress);

    // Build lookup maps
    const entityById = new Map<string, GraphEntity>();
    for (const e of entities) entityById.set(e.id, e);

    const relsByEntity = new Map<string, GraphRelationship[]>();
    for (const r of relationships) {
      if (!relsByEntity.has(r.from)) relsByEntity.set(r.from, []);
      relsByEntity.get(r.from)!.push(r);
      // Also index reverse direction for bidirectional wikilinks
      if (!relsByEntity.has(r.to)) relsByEntity.set(r.to, []);
      relsByEntity.get(r.to)!.push(r);
    }

    // Phase 2: Write entity files
    const seenIds = new Set<string>();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      seenIds.add(entity.id);

      if (i % 50 === 0) {
        onProgress?.({
          phase: 'writing',
          message: `Writing ${entity.name} (${entity.type})…`,
          current: i,
          total: entities.length,
        });
      }

      try {
        const rels = relsByEntity.get(entity.id) ?? [];
        const md = this.entityToMarkdown(entity, rels, entityById);
        const contentHash = await this.hash(md);

        if (this.index.hashes[entity.id] === contentHash) continue; // unchanged

        const filePath = this.entityFilePath(entity);
        await this.ensureDir(filePath);

        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing && existing instanceof TFile) {
          await this.app.vault.modify(existing, md);
          result.updated++;
        } else {
          await this.app.vault.create(filePath, md);
          result.created++;
        }

        this.index.hashes[entity.id] = contentHash;
        this.index.paths[entity.id] = filePath;
      } catch (e) {
        result.errors.push(`${entity.name}: ${(e as Error).message}`);
      }
    }

    // Phase 3: Delete stale entity files
    onProgress?.({ phase: 'cleanup', message: 'Removing stale entities…', current: 0, total: 0 });
    for (const [id, path] of Object.entries(this.index.paths)) {
      if (seenIds.has(id)) continue;
      try {
        const file = this.app.vault.getAbstractFileByPath(path);
        // Use FileManager.trashFile so the user's delete preference
        // (system trash vs Obsidian trash vs permanent) is honoured —
        // Vault.delete bypasses that and the obsidianmd ESLint plugin
        // flags it under `prefer-fileManager-trashFile`.
        if (file) await this.app.fileManager.trashFile(file);
        delete this.index.hashes[id];
        delete this.index.paths[id];
        result.deleted++;
      } catch {
        // File may have been manually deleted — just clean index
        delete this.index.hashes[id];
        delete this.index.paths[id];
      }
    }

    // Phase 4: Enrich source notes with cortex_entities frontmatter
    if (this.settings.graphPullEnrichSourceNotes) {
      onProgress?.({ phase: 'enriching', message: 'Enriching source notes…', current: 0, total: 0 });
      result.enriched = await this.enrichSourceNotes(entities, relationships, entityById, onProgress);
    }

    // Save
    this.index.lastPulledAt = Date.now();
    await this.saveIndex();
    onProgress?.({ phase: 'done', message: 'Done', current: 1, total: 1 });

    return result;
  }

  /* ── Summary (cheap, stats-only) ────────────────────────────────── */

  /**
   * Cheap "tell me what's there" path. Hits /v1/graph/stats (one network
   * round-trip) and compares the per-type entity counts against the size of
   * the local pull index. Doesn't fetch a single entity body — answers in
   * ~50ms even on a 10k-entity graph, vs. ~30s+ for the full preview.
   *
   * Returned counts are estimates: "estNew" assumes any cloud entity not
   * already in our local index is missing locally (ignores rename / id
   * churn), and "estUnchanged" is the local-index intersection. Good enough
   * for the picker so users know whether to bother running the full pull.
   */
  async summary(): Promise<{
    perType: Array<{ type: string; cloudCount: number; localCount: number; estNew: number }>;
    cloudTotal: number;
    localTotal: number;
    estNew: number;
    estUnchanged: number;
    estStale: number;
  }> {
    await this.loadIndex();
    const types = new Set(this.resolveTypes());
    const stats = await this.client.getGraphStats();

    // Local count per type from the saved file paths in the index.
    const localByType = new Map<string, number>();
    for (const path of Object.values(this.index.paths)) {
      const m = path.match(/\/([^/]+)\/[^/]+\s\(\1\)\.md$/);
      const t = m?.[1] ?? 'Unknown';
      localByType.set(t, (localByType.get(t) ?? 0) + 1);
    }

    const perType: Array<{ type: string; cloudCount: number; localCount: number; estNew: number }> = [];
    let cloudTotal = 0;
    let localTotal = 0;

    for (const et of stats.entityTypes ?? []) {
      if (!types.has(et.type)) continue;
      const localCount = localByType.get(et.type) ?? 0;
      const cloudCount = et.count;
      cloudTotal += cloudCount;
      localTotal += localCount;
      perType.push({
        type: et.type,
        cloudCount,
        localCount,
        estNew: Math.max(0, cloudCount - localCount),
      });
    }

    // Stale = local pulls for types/ids the cloud no longer has.
    let estStale = 0;
    for (const [t, n] of localByType) {
      const matchesCloud = perType.find(p => p.type === t)?.cloudCount ?? 0;
      if (n > matchesCloud) estStale += n - matchesCloud;
    }

    return {
      perType: perType.sort((a, b) => b.cloudCount - a.cloudCount),
      cloudTotal,
      localTotal,
      estNew: Math.max(0, cloudTotal - localTotal),
      estUnchanged: Math.min(cloudTotal, localTotal) - estStale,
      estStale,
    };
  }

  /* ── Preview (dry run) ──────────────────────────────────────────── */

  async preview(onProgress?: (p: PullProgress) => void): Promise<{
    toCreate: string[];
    toUpdate: string[];
    toDelete: string[];
    entityCount: number;
  }> {
    await this.loadIndex();
    const typesToPull = this.resolveTypes();

    onProgress?.({ phase: 'fetching', message: 'Fetching entities…', current: 0, total: 0 });
    const { entities, relationships } = await this.fetchAll(typesToPull, onProgress);

    const entityById = new Map<string, GraphEntity>();
    for (const e of entities) entityById.set(e.id, e);
    const relsByEntity = new Map<string, GraphRelationship[]>();
    for (const r of relationships) {
      if (!relsByEntity.has(r.from)) relsByEntity.set(r.from, []);
      relsByEntity.get(r.from)!.push(r);
      if (!relsByEntity.has(r.to)) relsByEntity.set(r.to, []);
      relsByEntity.get(r.to)!.push(r);
    }

    const toCreate: string[] = [];
    const toUpdate: string[] = [];
    const seenIds = new Set<string>();

    for (const entity of entities) {
      seenIds.add(entity.id);
      const rels = relsByEntity.get(entity.id) ?? [];
      const md = this.entityToMarkdown(entity, rels, entityById);
      const contentHash = await this.hash(md);
      const label = `${entity.name} (${entity.type})`;

      if (!this.index.hashes[entity.id]) {
        toCreate.push(label);
      } else if (this.index.hashes[entity.id] !== contentHash) {
        toUpdate.push(label);
      }
    }

    const toDelete: string[] = [];
    for (const [id] of Object.entries(this.index.paths)) {
      if (!seenIds.has(id)) toDelete.push(this.index.paths[id]);
    }

    onProgress?.({ phase: 'done', message: 'Done', current: 1, total: 1 });
    return { toCreate, toUpdate, toDelete, entityCount: entities.length };
  }

  /* ── Fetch all pages ────────────────────────────────────────────── */

  private async fetchAll(
    entityTypes: string[],
    onProgress?: (p: PullProgress) => void,
  ): Promise<{ entities: GraphEntity[]; relationships: GraphRelationship[] }> {
    const allEntities: GraphEntity[] = [];
    const allRelationships: GraphRelationship[] = [];
    const batchSize = 500;
    const seenRelKeys = new Set<string>(); // dedupe relationships across types

    // Fetch per entity type (the backend's GET /entities accepts one type at a time)
    for (let t = 0; t < entityTypes.length; t++) {
      const type = entityTypes[t];
      let offset = 0;

      while (true) {
        onProgress?.({
          phase: 'fetching',
          message: `Fetching ${type} (${allEntities.length} entities so far)…`,
          current: t,
          total: entityTypes.length,
        });

        const page = await this.client.exportGraphPage({
          entityTypes: [type],
          limit: batchSize,
          offset,
          includeRelationships: offset === 0, // only fetch rels on first page per type
        });

        allEntities.push(...page.entities);

        // Dedupe relationships
        for (const r of page.relationships) {
          const key = `${r.from}-${r.type}-${r.to}`;
          if (!seenRelKeys.has(key)) {
            seenRelKeys.add(key);
            allRelationships.push(r);
          }
        }

        if (page.entities.length < batchSize) break;
        offset += batchSize;
      }
    }

    return { entities: allEntities, relationships: allRelationships };
  }

  /* ── Type resolution ────────────────────────────────────────────── */

  private resolveTypes(): string[] {
    // If user specified explicit types, use those
    if (this.settings.graphPullEntityTypes.length > 0) {
      return this.settings.graphPullEntityTypes;
    }
    // Otherwise use the default semantic types
    return DEFAULT_SEMANTIC_TYPES;
  }

  /* ── Entity → Markdown ──────────────────────────────────────────── */

  private entityToMarkdown(
    entity: GraphEntity,
    relationships: GraphRelationship[],
    entityById: Map<string, GraphEntity>,
  ): string {
    const lines: string[] = [];

    // Frontmatter
    lines.push('---');
    lines.push(`cortex_id: "${entity.id}"`);
    lines.push(`cortex_type: "${entity.type}"`);
    lines.push(`cortex_synced: "${new Date().toISOString()}"`);

    // Aliases (entity name without type suffix)
    lines.push('aliases:');
    lines.push(`  - "${this.escapeYaml(entity.name)}"`);

    // Related entities as YAML list
    const relatedNames = this.getRelatedNames(entity, relationships, entityById);
    if (relatedNames.length > 0) {
      lines.push('related:');
      for (const name of relatedNames.slice(0, 20)) {
        lines.push(`  - "[[${this.escapeYaml(name)}]]"`);
      }
    }

    // Source notes (files this entity was mentioned in)
    const sourceNotes = this.getSourceNotes(entity, relationships, entityById);
    if (sourceNotes.length > 0) {
      lines.push('mentioned_in:');
      for (const note of sourceNotes) {
        lines.push(`  - "[[${this.escapeYaml(note)}]]"`);
      }
    }

    lines.push('tags:');
    lines.push('  - cortex');
    lines.push(`  - cortex/${entity.type.toLowerCase().replace(/\s+/g, '-')}`);
    lines.push('---');
    lines.push('');

    // Title
    lines.push(`# ${entity.name}`);
    lines.push('');

    // Description
    const desc = entity.properties.description as string | undefined;
    if (desc) {
      lines.push(desc);
      lines.push('');
    }

    // Relationships section
    const grouped = this.groupRelationships(entity, relationships, entityById);
    if (grouped.size > 0) {
      lines.push('## Relationships');
      lines.push('');
      for (const [relType, targets] of grouped) {
        for (const target of targets) {
          lines.push(`- **${this.humanRelType(relType)}** → [[${target}]]`);
        }
      }
      lines.push('');
    }

    // Properties (filtered — skip internal fields)
    const userProps = this.getUserProperties(entity);
    if (userProps.length > 0) {
      lines.push('## Properties');
      lines.push('');
      for (const [key, value] of userProps) {
        lines.push(`- **${key}**: ${String(value)}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /* ── Relationship helpers ───────────────────────────────────────── */

  private getRelatedNames(
    entity: GraphEntity,
    relationships: GraphRelationship[],
    entityById: Map<string, GraphEntity>,
  ): string[] {
    const names = new Set<string>();
    for (const r of relationships) {
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (other && other.id !== entity.id) {
        names.add(this.entityDisplayName(other));
      }
    }
    return Array.from(names);
  }

  private getSourceNotes(
    entity: GraphEntity,
    relationships: GraphRelationship[],
    entityById: Map<string, GraphEntity>,
  ): string[] {
    const notes: string[] = [];
    for (const r of relationships) {
      if (r.type !== 'MENTIONED_IN' && r.type !== 'PART_OF' && r.type !== 'DESCRIBED_IN') continue;
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (other && (other.type === 'Document' || other.type === 'Note')) {
        notes.push(other.name);
      }
    }
    return notes;
  }

  private groupRelationships(
    entity: GraphEntity,
    relationships: GraphRelationship[],
    entityById: Map<string, GraphEntity>,
  ): Map<string, string[]> {
    const grouped = new Map<string, string[]>();
    for (const r of relationships) {
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (!other || other.id === entity.id) continue;
      const displayName = this.entityDisplayName(other);
      if (!grouped.has(r.type)) grouped.set(r.type, []);
      const list = grouped.get(r.type)!;
      if (!list.includes(displayName)) list.push(displayName);
    }
    return grouped;
  }

  /* ── File path helpers ──────────────────────────────────────────── */

  private entityFilePath(entity: GraphEntity): string {
    const safeName = this.sanitizeFilename(entity.name);
    const safeType = this.sanitizeFilename(entity.type);
    return normalizePath(
      `${this.settings.graphPullFolder}/${safeType}/${safeName} (${safeType}).md`,
    );
  }

  private entityDisplayName(entity: GraphEntity): string {
    return `${entity.name} (${entity.type})`;
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  private async ensureDir(filePath: string): Promise<void> {
    const parts = filePath.split('/');
    parts.pop(); // remove filename
    const dir = parts.join('/');
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(dir))) {
      await adapter.mkdir(dir);
    }
  }

  /* ── Source note enrichment ─────────────────────────────────────── */

  private async enrichSourceNotes(
    _entities: GraphEntity[],
    relationships: GraphRelationship[],
    entityById: Map<string, GraphEntity>,
    onProgress?: (p: PullProgress) => void,
  ): Promise<number> {
    // Build a map: source file path → entities mentioned in it
    const noteEntities = new Map<string, Set<string>>();

    for (const r of relationships) {
      if (r.type !== 'MENTIONED_IN' && r.type !== 'PART_OF') continue;
      const entityId = r.from;
      const noteId = r.to;
      const entity = entityById.get(entityId);
      const note = entityById.get(noteId);

      if (!entity || !note) continue;
      if (note.type !== 'Document' && note.type !== 'Note') continue;

      const filePath = (note.properties.filePath as string) ?? note.name;
      if (!noteEntities.has(filePath)) noteEntities.set(filePath, new Set());
      noteEntities.get(filePath)!.add(entity.name);
    }

    let enriched = 0;
    const entries = Array.from(noteEntities.entries());

    for (let i = 0; i < entries.length; i++) {
      const [filePath, entityNames] = entries[i];

      if (i % 20 === 0) {
        onProgress?.({
          phase: 'enriching',
          message: `Enriching ${filePath}…`,
          current: i,
          total: entries.length,
        });
      }

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) continue;

      try {
        const content = await this.app.vault.read(file);
        const updated = this.upsertFrontmatter(content, 'cortex_entities', Array.from(entityNames).sort());

        if (updated !== content) {
          await this.app.vault.modify(file, updated);
          enriched++;
        }
      } catch {
        // File might be locked or deleted — skip silently
      }
    }

    return enriched;
  }

  /**
   * Insert or update a single frontmatter key without disturbing the rest
   * of the document. Creates frontmatter if none exists.
   */
  private upsertFrontmatter(content: string, key: string, values: string[]): string {
    const yamlValue = values.map(v => `  - "${this.escapeYaml(v)}"`).join('\n');
    const newBlock = `${key}:\n${yamlValue}`;

    if (!content.startsWith('---')) {
      // No frontmatter — add it
      return `---\n${newBlock}\n---\n\n${content}`;
    }

    const endIdx = content.indexOf('---', 3);
    if (endIdx === -1) return content; // malformed

    const fm = content.slice(4, endIdx);
    const after = content.slice(endIdx + 3);

    // Check if key already exists in frontmatter
    const keyRegex = new RegExp(`^${key}:.*(?:\\n  - .*)*`, 'm');
    if (keyRegex.test(fm)) {
      // Replace existing block
      const updatedFm = fm.replace(keyRegex, newBlock);
      return `---\n${updatedFm}---${after}`;
    }

    // Append to frontmatter
    const trimmedFm = fm.trimEnd();
    return `---\n${trimmedFm}\n${newBlock}\n---${after}`;
  }

  /* ── Formatting helpers ─────────────────────────────────────────── */

  private humanRelType(rel: string): string {
    return rel.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

  private escapeYaml(s: string): string {
    return s.replace(/"/g, '\\"');
  }

  private getUserProperties(entity: GraphEntity): [string, unknown][] {
    const skip = new Set([
      'id', 'name', 'type', 'description', 'embedding', 'embeddings',
      'organizationId', 'workspaceId', 'createdAt', 'updatedAt',
      'startLine', 'endLine', 'lineCount', 'sizeBytes', 'isExported',
      'kind', 'signature', 'docstring', 'language',
    ]);
    return Object.entries(entity.properties)
      .filter(([k, v]) => !skip.has(k) && v !== '' && v != null)
      .slice(0, 15);
  }
}
