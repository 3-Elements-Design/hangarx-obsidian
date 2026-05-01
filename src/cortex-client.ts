/**
 * Cortex API client. Uses Obsidian's `requestUrl` to bypass CORS on desktop
 * and route through Capacitor on mobile.
 */
import { requestUrl, RequestUrlParam } from 'obsidian';
import type { CortexSettings } from './settings';

export interface RelatedNote {
  noteName: string;
  entityId?: string;
  filePath?: string;
  score: number;
  snippet?: string;
  source: 'wikilink' | 'extracted' | 'embedding' | 'community';
}

export interface PathStep {
  fromName: string;
  fromType: string;
  toName: string;
  toType: string;
  relType: string;
}

export interface GraphPath {
  steps: PathStep[];
  length: number;
}

export interface Contradiction {
  conflictType: 'direct' | 'temporal' | 'value_mismatch';
  conflictDescription: string;
  confidence: number;
  claim1: { id: string; text: string; subject: string; sourceName?: string };
  claim2: { id: string; text: string; subject: string; sourceName?: string };
}

export interface MemoryItem {
  id: string;
  content: string;
  source?: string;
  priority?: string;
  createdAt?: string;
}

export interface AskCitation {
  source: string;
  text: string;
  filePath?: string;
  url?: string;
}

export interface AskEntity {
  name: string;
  type: string;
  description?: string;
  score?: number;
}

export interface AskDocument {
  title: string;
  snippet?: string;
  filePath?: string;
  url?: string;
  matchPercent?: number;
  publishDate?: string;
  source?: string;
}

export interface AskResponse {
  answer: string;
  citations: AskCitation[];
  entities: AskEntity[];
  documents: AskDocument[];
  confidence: number;
  followUps: string[];
  metadata: Record<string, unknown>;
}

export interface SuggestedLink {
  targetNote: string;
  reason: string;
  confidence: number;
  evidenceSnippet?: string;
}

export interface SubgraphExport {
  nodes: { id: string; label: string; type: string; properties: Record<string, unknown> }[];
  edges: { from: string; to: string; type: string; weight?: number }[];
}

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  source?: string;        // 'web-scrape' | 'agent' | 'remember' | 'daily-brief' | ...
  url?: string;
  createdAt: string;      // ISO timestamp
  tags?: string[];
}

export interface IngestResponse {
  fileId: string;
  syncJobId: string;
  status: string;
  recordsProcessed: number;
  entitiesCreated: number;
  relationshipsCreated: number;
  errors: string[];
}

export interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  id?: string;
  from: string;
  to: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface GraphExportPage {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  total?: number;
  exportedAt: string;
}

export interface EntityTypeCount {
  type: string;
  count: number;
}

export interface WhoamiInfo {
  /** 'cloud' for hosted-Cortex keys, 'local' for the Docker-stack short-circuit. */
  mode: 'cloud' | 'local';
  /** Human-readable name of the key (e.g. "HangarX Obsidian Plugin"). */
  name?: string;
  /** Owner's email when known (cloud only). */
  email?: string;
  /** First 12 chars of the raw key — safe to display alongside the masked input. */
  keyPrefix?: string;
  /** API scopes / permissions granted to this key. */
  scopes?: string[];
  /** ISO timestamp of last use, if any. */
  lastUsedAt?: string;
  /** IP last seen using this key. */
  lastUsedIp?: string;
  /** Total request count over the key's lifetime. */
  totalRequests?: number;
  /** Expiration timestamp, null if never. */
  expiresAt?: string | null;
  /** Workspace IDs this key is allowed to use (null = all). */
  allowedWorkspaceIds?: string[] | null;
  /** When the key was created. */
  createdAt?: string;
}

export interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  entityTypes: Array<{ type: string; count: number; sampleProperties: string[] }>;
  relationshipTypes: Array<{ type: string; count: number }>;
}

export interface GraphRAGStats {
  /** Loose shape — server response varies by orchestrator config. */
  cacheHitRate?: number;
  totalQueries?: number;
  averageLatencyMs?: number;
  [k: string]: unknown;
}

export interface CommunitySummary {
  id: string;
  name?: string;
  level?: number;
  summary?: string;
  keywords?: string[] | string;
  memberCount?: number;
  centralEntities?: string[] | string;
  parentCommunityId?: string | null;
  modularity?: number;
  cohesion?: number;
  separation?: number;
  density?: number;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export type LlmProvider =
  | 'openai' | 'anthropic' | 'gemini' | 'grok' | 'moonshot' | 'ollama' | 'openrouter';

export interface LlmRuntimeConfig {
  chatProvider?: LlmProvider;
  chatModel?: string;
  /** Server returns a masked preview ("sk-…abc") rather than the raw key. */
  chatApiKeyMasked?: string | null;
  chatBaseUrl?: string | null;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingApiKeyMasked?: string | null;
  useOwnChatKey?: boolean;
  useOwnEmbeddingKey?: boolean;
  [k: string]: unknown;
}

export interface LlmRuntimeConfigUpdate {
  chatProvider?: LlmProvider;
  chatModel?: string;
  chatApiKey?: string;
  chatBaseUrl?: string | null;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingApiKey?: string;
  useOwnChatKey?: boolean;
  useOwnEmbeddingKey?: boolean;
}

export interface LlmTestInput {
  provider: LlmProvider;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

export interface LlmTestResult {
  success: boolean;
  message?: string;
  latencyMs?: number;
  [k: string]: unknown;
}

export interface LlmProviderEntry {
  id: string;
  label: string;
  models: Array<{ id: string; label: string }>;
  [k: string]: unknown;
}

export type LlmModelRegistry = LlmProviderEntry[] | Record<string, LlmProviderEntry>;

export class CortexClient {
  constructor(private settings: CortexSettings) {}

  private async req<T>(path: string, init: Partial<RequestUrlParam> = {}): Promise<T> {
    // Build headers explicitly so empty values don't slip through and trip the
    // server's `if (rawWs)` truthy check (empty string is falsy in JS but
    // still serialises as a header on the wire — confusing to debug).
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.settings.apiKey) headers.Authorization = `Bearer ${this.settings.apiKey}`;
    if (this.settings.workspaceId) headers['x-workspace-id'] = this.settings.workspaceId;
    Object.assign(headers, init.headers ?? {});

    const res = await requestUrl({
      url: `${this.settings.apiUrl}${path}`,
      method: init.method ?? 'GET',
      headers,
      body: init.body,
      throw: false,
    });
    if (res.status >= 400) {
      // Include the host so you can tell at a glance whether this hit cloud
      // vs. local — the same 401 means very different things in each mode.
      let host = '';
      try { host = new URL(this.settings.apiUrl).host; } catch {}
      throw new Error(`Cortex [${host}] ${path} → ${res.status}: ${res.text}`);
    }
    return res.json as T;
  }

  /**
   * Upload a single markdown note via the JSON-body upload endpoint.
   *
   * `fastMode` raises the LLM context cap and harmonizer concurrency at the
   * cost of skipping post-ingest VDB indexing + community detection. Use it
   * for force re-ingest where the user will follow up with a maintenance run
   * (see ChatPanel "Rebuild communities + reindex" command). Regular sync
   * should leave it false so retrieval quality stays consistent.
   */
  async ingestNote(
    filePath: string,
    content: string,
    opts: { fastMode?: boolean; syncJobId?: string } = {},
  ): Promise<IngestResponse> {
    const res = await this.req<{ data: IngestResponse }>('/v1/ingest/files/upload-json', {
      method: 'POST',
      headers: opts.syncJobId ? { 'x-sync-job-id': opts.syncJobId } : undefined,
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype: 'text/markdown',
          contentText: content,
        },
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
        sourceType: 'md',
        fastMode: opts.fastMode === true,
      }),
    });
    return res.data;
  }

  /**
   * Upload a binary attachment (image, PDF, audio, video). The backend
   * decodes contentBase64; mimetype drives the right extraction pipeline.
   */
  async ingestBinary(
    filePath: string,
    mimetype: string,
    base64: string,
    opts: { syncJobId?: string } = {},
  ): Promise<IngestResponse> {
    const res = await this.req<{ data: IngestResponse }>('/v1/ingest/files/upload-json', {
      method: 'POST',
      headers: opts.syncJobId ? { 'x-sync-job-id': opts.syncJobId } : undefined,
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype,
          contentBase64: base64,
        },
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
        sourceType: mimetype.split('/')[0] || 'file',
        fastMode: false,
      }),
    });
    return res.data;
  }

  /**
   * Cancel an in-flight sync job. Sets a server-side flag that ingest workers
   * check at chunk boundaries — in-flight files bail out at the next safe
   * point, queued files don't start. Idempotent.
   */
  async cancelSyncJob(jobId: string): Promise<void> {
    if (!jobId) return;
    await this.req(`/v1/ingest/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' });
  }

  /**
   * Run community detection (Louvain by default) and persist results. Used
   * after a fastMode re-ingest to populate community-level retrieval which
   * the ingest path skipped. Workspace is taken from settings; the server
   * falls back to the request user's default if no workspace is set.
   */
  async detectCommunities(opts: {
    algorithm?: 'louvain' | 'leiden';
    resolution?: number;
    maxLevels?: number;
  } = {}): Promise<{ communitiesCreated: number; levels: number; modularity: number }> {
    const body = {
      ...opts,
      ...(this.settings.workspaceId ? { workspaceId: this.settings.workspaceId } : {}),
    };
    const res = await this.req<{ data: { communitiesCreated: number; levels: number; modularity: number } }>(
      '/v1/graph/communities/detect',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return res.data;
  }

  async listCommunities(opts: {
    level?: number;
    minMembers?: number;
    limit?: number;
  } = {}): Promise<CommunitySummary[]> {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set('workspaceId', this.settings.workspaceId);
    if (opts.level !== undefined) params.set('level', String(opts.level));
    if (opts.minMembers !== undefined) params.set('minMembers', String(opts.minMembers));
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    const res = await this.req<{ data: { communities: CommunitySummary[] } }>(
      `/v1/graph/communities?${params.toString()}`,
    );
    return res.data?.communities ?? [];
  }

  /**
   * Backfill embeddings on entities that were ingested without them (the
   * structured-entity VDB indexing that fastMode skips). Idempotent — safe to
   * run repeatedly; entities that already have embeddings are skipped.
   */
  async backfillEntityEmbeddings(): Promise<unknown> {
    const res = await this.req<{ data: unknown }>('/v1/search/vectors/backfill-entity-embeddings', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return res.data;
  }

  async deleteNote(filePath: string): Promise<void> {
    await this.req('/v1/ingest/documents/by-path/delete', {
      method: 'POST',
      body: JSON.stringify({
        filePath,
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
      }),
    });
  }

  /**
   * Ingest a URL — scrapes the page and extracts entities into the graph.
   */
  async ingestUrl(url: string, title?: string): Promise<{ documentId?: string; entityCount?: number }> {
    const res = await this.req<{ data: any }>('/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({
        url,
        title,
        workspaceId: this.settings.workspaceId,
        extractEntities: true,
      }),
    });
    return {
      documentId: res.data?.documentId,
      entityCount: res.data?.entitiesCreated ?? res.data?.entityCount ?? 0,
    };
  }

  /**
   * Get a diff of graph changes since a given timestamp.
   */
  async graphDiff(since: string): Promise<{ added: any[]; modified: any[]; removed: any[] }> {
    const params = new URLSearchParams({
      sinceTimestamp: since,
      workspaceId: this.settings.workspaceId,
    });
    const res = await this.req<{ data: any }>(`/v1/graph/diff?${params.toString()}`);
    return {
      added: res.data?.addedEntities ?? [],
      modified: res.data?.modifiedEntities ?? [],
      removed: res.data?.removedEntities ?? [],
    };
  }

  /**
   * Search the graph for entities by name fragment. Returns raw entity records
   * (with IDs) — used by the Related view to find the entity ID of the
   * currently-open note (which `related()` filters out).
   */
  async searchEntitiesByName(name: string, limit = 5): Promise<{ id: string; name: string; type?: string }[]> {
    const params = new URLSearchParams({
      q: name,
      type: 'Note',
      limit: String(limit),
      workspaceId: this.settings.workspaceId,
    });
    const res = await this.req<{ success: boolean; data: { entities: any[] } }>(
      `/v1/graph/search?${params.toString()}`,
    );
    return (res.data?.entities ?? []).map(e => ({ id: e.id, name: e.name, type: e.type }));
  }

  async related(noteName: string, limit = 10): Promise<RelatedNote[]> {
    const params = new URLSearchParams({
      q: noteName,
      type: 'Note',
      limit: String(limit),
      workspaceId: this.settings.workspaceId,
    });
    const res = await this.req<{ success: boolean; data: { entities: any[] } }>(
      `/v1/graph/search?${params.toString()}`,
    );
    return (res.data?.entities ?? [])
      .filter(e => e?.name && e.name !== noteName)
      .map(e => ({
        noteName: e.name,
        entityId: e.id,
        filePath: e.properties?.filePath,
        score: typeof e.score === 'number' ? e.score : (typeof e.relevance === 'number' ? e.relevance : 0),
        snippet: e.properties?.description,
        source: e.properties?.source === 'user' ? 'wikilink' : 'embedding',
      }));
  }

  /**
   * Find the shortest paths through the graph between two entities — used to
   * explain *why* two notes are related (e.g. "Note A → MENTIONS → X → CITED_IN → Note B").
   */
  async findPaths(fromEntityId: string, toEntityId: string, maxHops = 3): Promise<GraphPath[]> {
    const params = new URLSearchParams({
      from: fromEntityId,
      to: toEntityId,
      maxHops: String(maxHops),
      workspaceId: this.settings.workspaceId,
    });
    const res = await this.req<{ success: boolean; data: { paths: any[] } }>(
      `/v1/graph/explore/paths?${params.toString()}`,
    );
    return (res.data?.paths ?? []).map(p => {
      const nodes = p.nodes ?? [];
      const edges = p.edges ?? [];
      const steps: PathStep[] = edges.map((edge: any, i: number) => ({
        fromName: nodes[i]?.label ?? edge.source,
        fromType: nodes[i]?.type ?? '',
        toName: nodes[i + 1]?.label ?? edge.target,
        toType: nodes[i + 1]?.type ?? '',
        relType: edge.type,
      }));
      return { steps, length: typeof p.length === 'number' ? p.length : steps.length };
    });
  }

  /** Find contradicting claims across the workspace. */
  async findContradictions(limit = 25): Promise<Contradiction[]> {
    const params = new URLSearchParams({
      workspaceId: this.settings.workspaceId,
      limit: String(limit),
    });
    const res = await this.req<{ success: boolean; data: { contradictions: any[] } }>(
      `/v1/graph/claims/contradictions?${params.toString()}`,
    );
    return (res.data?.contradictions ?? []).map(c => ({
      conflictType: c.conflictType,
      conflictDescription: c.conflictDescription,
      confidence: c.confidence ?? 0,
      claim1: {
        id: c.claim1?.id,
        text: c.claim1?.text,
        subject: c.claim1?.subject,
        sourceName: c.claim1?.source?.sourceName,
      },
      claim2: {
        id: c.claim2?.id,
        text: c.claim2?.text,
        subject: c.claim2?.subject,
        sourceName: c.claim2?.source?.sourceName,
      },
    }));
  }

  /** Persist a memory item (e.g. user preference) for future chat sessions. */
  async remember(content: string, source: 'conversation' | 'user_feedback' = 'conversation'): Promise<void> {
    await this.req('/v1/memory/remember', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: this.settings.workspaceId,
        agentId: 'hangarx-obsidian',
        content,
        source,
        priority: 'normal',
      }),
    });
  }

  /** Retrieve memories relevant to a query — injected into the chat prompt. */
  async recall(query: string, limit = 5): Promise<MemoryItem[]> {
    const res = await this.req<{ success: boolean; data: { items: any[] } }>('/v1/memory/recall', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: this.settings.workspaceId,
        agentId: 'hangarx-obsidian',
        query,
        method: 'hybrid',
        limit,
      }),
    });
    return (res.data?.items ?? []).map(m => ({
      id: m.id,
      content: m.content,
      source: m.source,
      priority: m.priority,
      createdAt: m.createdAt,
    }));
  }

  async ask(query: string, _sessionId?: string): Promise<AskResponse> {
    // /chat/answer returns an LLM-synthesized response. expanded:true also
    // includes the structured `raw` context (entities, documents) and
    // suggestedFollowUps used to render the rich UI. sessionId is currently
    // a no-op server-side; kept in the signature for forward compatibility.
    const res = await this.req<{
      success: boolean;
      data: {
        answer: string;
        context?: string;
        suggestedFollowUps?: string[];
        raw?: {
          documents?: { recentDocuments?: any[] };
          entities?: any[];
          knowledgeGraph?: { entities?: any[]; relationships?: any[] };
        };
      };
      meta?: { confidence?: number } & Record<string, unknown>;
    }>('/v1/ask/chat/answer', {
      method: 'POST',
      body: JSON.stringify({
        message: query,
        workspaceId: this.settings.workspaceId,
        expanded: true,
      }),
    });

    const d = res.data;
    return {
      answer: d.answer,
      citations: extractCitations(d.raw),
      entities: extractEntities(d.raw),
      documents: extractDocuments(d.raw),
      confidence: typeof res.meta?.confidence === 'number' ? res.meta.confidence : 0,
      followUps: d.suggestedFollowUps ?? [],
      metadata: { ...(res.meta ?? {}) },
    };
  }

  async suggestLinks(noteName: string): Promise<SuggestedLink[]> {
    const res = await this.req<{ data: { suggestions: SuggestedLink[] } }>('/v1/graph/predict-links', {
      method: 'POST',
      body: JSON.stringify({
        entityName: noteName,
        entityType: 'Note',
        workspaceId: this.settings.workspaceId,
      }),
    });
    return res.data?.suggestions ?? [];
  }

  async exportSubgraph(seedNoteName: string, hops = 1): Promise<SubgraphExport> {
    const res = await this.req<{ data: SubgraphExport & { seedEntityId: string } }>('/v1/graph/export', {
      method: 'POST',
      body: JSON.stringify({
        seedEntity: seedNoteName,
        seedType: 'Note',
        hops,
        workspaceId: this.settings.workspaceId,
      }),
    });
    return res.data;
  }

  /**
   * Export a subgraph anchored at a known entity ID. More robust than the
   * by-name overload because it skips the server-side name+type lookup that
   * fails when the note was indexed under a non-`Note` type or with a slightly
   * different name (e.g. extracted entity normalisation).
   */
  async exportSubgraphById(seedEntityId: string, hops = 1): Promise<SubgraphExport> {
    const res = await this.req<{ data: SubgraphExport & { seedEntityId: string } }>('/v1/graph/export', {
      method: 'POST',
      body: JSON.stringify({
        seedEntityId,
        hops,
        workspaceId: this.settings.workspaceId,
      }),
    });
    return res.data;
  }

  /**
   * Resolve an Obsidian note to its graph entity ID. Tries strategies in order
   * of specificity so the most reliable signal wins:
   *   1. Exact filePath property match (Note entity created during ingest stores it)
   *   2. Same, but for type=Document (some flows create Document instead of Note)
   *   3. Substring search by basename (for legacy/edge cases)
   * Returns null if the note isn't in the graph yet.
   */
  async resolveEntityId(noteName: string, filePath?: string): Promise<string | null> {
    if (filePath) {
      for (const type of ['Note', 'Document']) {
        try {
          const res = await this.req<{ success: boolean; data: { entities: any[] } }>(
            '/v1/graph/entities/find',
            {
              method: 'POST',
              body: JSON.stringify({
                type,
                properties: { filePath },
                limit: 1,
              }),
            },
          );
          const hit = res.data?.entities?.[0];
          if (hit?.id) return hit.id;
        } catch {
          // Try the next type / fallback.
        }
      }
    }
    // Final fallback: substring name search (bumped to all types — no `type` filter).
    const params = new URLSearchParams({
      q: noteName,
      limit: '5',
      workspaceId: this.settings.workspaceId,
    });
    const res = await this.req<{ success: boolean; data: { entities: any[] } }>(
      `/v1/graph/search?${params.toString()}`,
    );
    const list = res.data?.entities ?? [];
    if (list.length === 0) return null;
    const exact = list.find((e: any) => e.name === noteName);
    return (exact ?? list[0])?.id ?? null;
  }

  /**
   * Paginated workspace-wide entity listing for the pull-sync feature.
   * Uses GET /v1/graph/entities which supports type, limit, offset filtering.
   */
  async exportGraphPage(opts: {
    entityTypes?: string[];
    limit?: number;
    offset?: number;
    includeRelationships?: boolean;
  } = {}): Promise<GraphExportPage> {
    const limit = opts.limit ?? 500;
    const offset = opts.offset ?? 0;

    // If specific entity types are requested, fetch for the first type
    // (the graph-pull service calls this per-type via fetchAll)
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (this.settings.workspaceId) params.set('workspaceId', this.settings.workspaceId);

    if (opts.entityTypes && opts.entityTypes.length === 1) {
      params.set('type', opts.entityTypes[0]);
    }

    const res = await this.req<{
      success?: boolean;
      data?: { entities: GraphEntity[] };
      nodes?: Array<{ id: string; name: string; type: string; properties: Record<string, unknown> }>;
      links?: Array<{ source: string; target: string; type: string; properties?: Record<string, unknown> }>;
    }>(`/v1/graph/entities?${params.toString()}`, {
      method: 'GET',
    });

    const entities: GraphEntity[] = (res.data?.entities ?? []).map(e => ({
      id: e.id,
      name: e.name ?? (e as any).properties?.name ?? 'Unknown',
      type: e.type ?? (e as any).properties?.type ?? 'Entity',
      properties: e.properties ?? {},
    }));

    // If relationships are requested, fetch them via the root graph endpoint
    let relationships: GraphRelationship[] = [];
    if (opts.includeRelationships !== false && entities.length > 0) {
      try {
        const graphParams = new URLSearchParams();
        graphParams.set('limit', String(Math.min(limit, 500)));
        if (this.settings.workspaceId) graphParams.set('workspaceId', this.settings.workspaceId);
        if (opts.entityTypes && opts.entityTypes.length === 1) {
          graphParams.set('type', opts.entityTypes[0]);
        }
        const graphRes = await this.req<{
          nodes?: Array<any>;
          links?: Array<{ source: string; target: string; type: string; properties?: Record<string, unknown> }>;
        }>(`/v1/graph?${graphParams.toString()}`, { method: 'GET' });

        relationships = (graphRes.links ?? []).map(l => ({
          from: l.source,
          to: l.target,
          type: l.type,
          properties: l.properties,
        }));
      } catch {
        // Relationships are optional — don't fail the whole pull
      }
    }

    return {
      entities,
      relationships,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate the configured API key and return its metadata. The settings
   * panel uses this to show "✓ logged in as <email>" instead of guessing.
   *
   * Throws structured errors the caller can react to:
   *   - status 404  → endpoint missing on this server build (cloud may not
   *                   have shipped /v1/api-keys/whoami yet). Caller should
   *                   fall back to a lighter probe.
   *   - status 401  → key is invalid or expired.
   *   - other       → network / server issue; surface verbatim.
   */
  async getWhoami(): Promise<WhoamiInfo> {
    const res = await this.req<{ data: WhoamiInfo }>('/v1/api-keys/whoami');
    if (!res.data) {
      throw new Error('whoami returned no data');
    }
    return res.data;
  }

  /**
   * Lightweight auth probe used as a fallback when whoami isn't available.
   * Calls a known authenticated endpoint (graph stats) and reports whether
   * the response indicated success. Doesn't reveal user identity, just
   * "the key works against this server."
   */
  async probeAuth(): Promise<boolean> {
    try {
      await this.getGraphStats();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch entity types with counts.
   * Uses GET /v1/graph/entity-types endpoint.
   */
  async getEntityTypeCounts(): Promise<EntityTypeCount[]> {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set('workspaceId', this.settings.workspaceId);

    const res = await this.req<{
      data?: { entityTypes: Array<{ type: string; count: number }> };
    }>(`/v1/graph/entity-types?${params.toString()}`, {
      method: 'GET',
    });
    return (res.data?.entityTypes ?? [])
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Comprehensive workspace graph stats — totals + per-type breakdown.
   * Backed by GET /v1/graph/stats which reuses the introspection pipeline.
   */
  async getGraphStats(): Promise<GraphStats> {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set('workspaceId', this.settings.workspaceId);
    const res = await this.req<{ data: GraphStats }>(`/v1/graph/stats?${params.toString()}`);
    return {
      totalEntities: res.data?.totalEntities ?? 0,
      totalRelationships: res.data?.totalRelationships ?? 0,
      entityTypes: (res.data?.entityTypes ?? []).slice().sort((a, b) => b.count - a.count),
      relationshipTypes: (res.data?.relationshipTypes ?? []).slice().sort((a, b) => b.count - a.count),
    };
  }

  /**
   * GraphRAG orchestrator stats — cache hit rate, query throughput, etc.
   * Optional companion to getGraphStats(); shape varies by orchestrator config.
   * Returns null on 404 (older container builds without the endpoint).
   */
  async getGraphRAGStats(): Promise<GraphRAGStats | null> {
    try {
      const res = await this.req<{ data: GraphRAGStats }>('/v1/graph/graphrag/stats');
      return res.data ?? null;
    } catch (e) {
      if (/→ 404/.test((e as Error).message)) return null;
      throw e;
    }
  }

  // ── Runtime LLM config ──────────────────────────────────────────────
  // The cortex-api stores per-org LLM configuration in Postgres (encrypted)
  // and reads from there at request time, so swapping providers/models or
  // updating an API key takes effect immediately — no container restart.
  // Mounted at /v1/ask/config/* (the inner aiConfigRouter has its own /config
  // and /test paths, hence the doubled segment).

  async getLlmConfig(): Promise<LlmRuntimeConfig> {
    const res = await this.req<{ data: LlmRuntimeConfig }>('/v1/ask/config/config');
    return res.data;
  }

  async updateLlmConfig(input: LlmRuntimeConfigUpdate): Promise<LlmRuntimeConfig> {
    const res = await this.req<{ data: LlmRuntimeConfig }>('/v1/ask/config/config', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async testLlmConfig(input: LlmTestInput): Promise<LlmTestResult> {
    const res = await this.req<{ success: boolean; data: LlmTestResult }>(
      '/v1/ask/config/test',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return res.data;
  }

  async getLlmModels(): Promise<LlmModelRegistry> {
    const res = await this.req<{ data: { providers: LlmModelRegistry } }>('/v1/ask/config/models');
    return res.data.providers;
  }


  /**
   * List Cortex-originated documents that should be projected into this vault.
   * Returns items the server believes have not yet been delivered (the server
   * tracks acks, so this is idempotent across devices).
   */
  async inboxList(): Promise<InboxItem[]> {
    const qs = new URLSearchParams({
      workspaceId: this.settings.workspaceId,
      vaultId: this.settings.vaultId,
    }).toString();
    const res = await this.req<{ data: { items: InboxItem[] } }>(`/v1/inbox/list?${qs}`);
    return res.data?.items ?? [];
  }

  async inboxAck(itemId: string, vaultPath: string): Promise<void> {
    await this.req('/v1/inbox/ack', {
      method: 'POST',
      body: JSON.stringify({
        itemId,
        vaultPath,
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
      }),
    });
  }
}

/**
 * Pull a best-effort citation list out of the chat response's `raw` context.
 * The shape varies (Notes from Obsidian, ingested docs, entities) — we look
 * at the most useful fields and de-duplicate by source name.
 */
function extractCitations(raw: any): AskCitation[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: AskCitation[] = [];
  const seen = new Set<string>();

  const push = (source: string | undefined, text: string | undefined, filePath?: string, url?: string) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    out.push({ source, text: text ?? '', filePath, url });
  };

  for (const doc of raw.documents?.recentDocuments ?? []) {
    push(
      doc?.name ?? doc?.filename ?? doc?.title,
      doc?.snippet ?? doc?.summary ?? doc?.description,
      doc?.filePath ?? doc?.path,
      doc?.url ?? doc?.youtubeurl,
    );
  }
  for (const ent of raw.knowledgeGraph?.entities ?? raw.entities ?? []) {
    if (ent?.type === 'Note' || ent?.type === 'Document') {
      push(ent?.name, ent?.properties?.description, ent?.properties?.filePath);
    }
  }
  return out.slice(0, 10);
}

function extractEntities(raw: any): AskEntity[] {
  if (!raw || typeof raw !== 'object') return [];
  const seen = new Set<string>();
  const out: AskEntity[] = [];
  const list = raw.knowledgeGraph?.entities ?? raw.entities ?? [];
  for (const e of list) {
    const name = e?.name;
    if (!name) continue;
    const key = `${name}::${e?.type ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      type: e?.type ?? 'Entity',
      description: e?.properties?.description ?? e?.description,
      score: typeof e?.score === 'number' ? e.score : (typeof e?.relevance === 'number' ? e.relevance : undefined),
    });
  }
  return out.slice(0, 25);
}

function extractDocuments(raw: any): AskDocument[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: AskDocument[] = [];
  const seen = new Set<string>();

  // 1. "Recent documents" — file-upload feature, not enabled on /chat/answer
  //    by default but populated on other endpoints. Keep checking it for
  //    backwards-compat.
  const recentList = raw.documents?.recentDocuments ?? raw.documents ?? [];
  for (const d of Array.isArray(recentList) ? recentList : []) {
    const title = d?.title ?? d?.name ?? d?.filename;
    if (!title || seen.has(title)) continue;
    seen.add(title);
    const matchRaw = d?.score ?? d?.match ?? d?.relevance;
    out.push({
      title,
      snippet: d?.snippet ?? d?.summary ?? d?.description,
      filePath: d?.filePath ?? d?.path,
      url: d?.url ?? d?.youtubeurl,
      matchPercent: typeof matchRaw === 'number' ? Math.round(matchRaw * 100) : undefined,
      publishDate: d?.publishdate ?? d?.publishDate ?? d?.publish_date,
      source: d?.guest ?? d?.author ?? d?.source,
    });
  }

  // 2. Vector chunks — the actual GraphRAG retrieval channel. The /chat/answer
  //    endpoint surfaces matched note text via `raw.vectorMemory.relevantChunks`
  //    rather than `raw.documents`. Without this branch, chunk-level matches
  //    never reached the UI's Documents panel and ask responses looked like
  //    they had no source material even when retrieval succeeded.
  const chunks = raw.vectorMemory?.relevantChunks ?? raw.relevantChunks ?? [];
  for (const c of Array.isArray(chunks) ? chunks : []) {
    // FalkorDB Chunk schema: meta_fileName is the source filename. Older
    // shape variants kept for forward-compat in case the server schema
    // changes again. Strip the .md extension for cleaner display.
    const rawTitle = c?.meta_fileName
      ?? c?.metadata?.documentName
      ?? c?.metadata?.source
      ?? c?.metadata?.fileName
      ?? c?.documentName
      ?? c?.source
      ?? c?.title
      ?? 'Vault chunk';
    const title = typeof rawTitle === 'string'
      ? rawTitle.replace(/\.(md|markdown|txt)$/i, '')
      : rawTitle;
    // De-dup by title — a single source note may produce multiple chunks;
    // keeping all of them clutters the UI. Take the highest-scoring one.
    if (seen.has(title)) continue;
    seen.add(title);
    out.push({
      title,
      snippet: c?.text ?? c?.content ?? c?.snippet,
      filePath: c?.metadata?.filePath ?? c?.filePath,
      matchPercent: typeof c?.score === 'number' ? Math.round(c.score * 100) : undefined,
      source: c?.metadata?.source,
    });
  }

  return out.slice(0, 10);
}
