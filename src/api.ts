/**
 * Public plugin API exposed at `app.plugins.plugins['hangarx-obsidian'].api`.
 *
 * Stable surface for Templater snippets, Dataview JS queries, and other plugins.
 * Methods return plain JSON-friendly values (no DOM, no Obsidian types) so they
 * compose naturally inside template strings and dataview tables.
 *
 * Usage in a Dataview JS block:
 *
 *   const cortex = app.plugins.plugins['hangarx-obsidian'].api;
 *   const related = await cortex.related(dv.current().file.name, 5);
 *   dv.list(related.map(r => `[[${r.noteName}]] (${r.score.toFixed(2)})`));
 *
 * Usage in a Templater template:
 *
 *   <% const cortex = app.plugins.plugins['hangarx-obsidian'].api; %>
 *   <% const answer = await cortex.ask("Summarize my notes from this week"); %>
 *   <%- answer %>
 */
import type { CortexClient } from './cortex-client';

export interface CortexPublicApi {
  /** Semantic + graph-based related notes for a given note name. */
  related: (noteName: string, limit?: number) => Promise<{
    noteName: string;
    score: number;
    snippet?: string;
    source: string;
  }[]>;

  /** Ask the vault. Returns the synthesized answer string only — for full payload use askExpanded. */
  ask: (query: string) => Promise<string>;

  /** Ask the vault and get the full structured response (entities, documents, citations, follow-ups). */
  askExpanded: (query: string) => Promise<{
    answer: string;
    confidence: number;
    entities: { name: string; type: string }[];
    documents: { title: string; url?: string; matchPercent?: number }[];
    citations: { source: string; url?: string }[];
    followUps: string[];
  }>;

  /** Suggested wikilinks for a note (entity-extraction driven). */
  suggestLinks: (noteName: string) => Promise<{
    targetNote: string;
    reason: string;
    confidence: number;
  }[]>;

  /** Detected contradictions across the workspace. */
  contradictions: (limit?: number) => Promise<{
    conflictType: string;
    conflictDescription: string;
    confidence: number;
    claim1: { text: string; sourceName?: string };
    claim2: { text: string; sourceName?: string };
  }[]>;

  /** Search graph entities by name fragment. Returns IDs + names. */
  searchEntities: (name: string, limit?: number) => Promise<{ id: string; name: string; type?: string }[]>;

  /** Trace shortest paths between two notes by name. Useful for "why are these related". */
  pathsBetween: (fromNoteName: string, toNoteName: string, maxHops?: number) => Promise<{
    steps: { fromName: string; toName: string; relType: string }[];
    length: number;
  }[]>;

  /** Recall persistent agent memories matching a query. */
  recall: (query: string, limit?: number) => Promise<{ id: string; content: string; createdAt?: string }[]>;

  /** Persist a memory item that future chats can recall. */
  remember: (content: string) => Promise<void>;
}

export function buildPublicApi(client: CortexClient): CortexPublicApi {
  return {
    async related(noteName, limit = 10) {
      const items = await client.related(noteName, limit);
      return items.map(r => ({
        noteName: r.noteName,
        score: r.score,
        snippet: r.snippet,
        source: r.source,
      }));
    },

    async ask(query) {
      const res = await client.ask(query);
      return res.answer;
    },

    async askExpanded(query) {
      const res = await client.ask(query);
      return {
        answer: res.answer,
        confidence: res.confidence,
        entities: res.entities.map(e => ({ name: e.name, type: e.type })),
        documents: res.documents.map(d => ({ title: d.title, url: d.url, matchPercent: d.matchPercent })),
        citations: res.citations.map(c => ({ source: c.source, url: c.url })),
        followUps: res.followUps,
      };
    },

    async suggestLinks(noteName) {
      const items = await client.suggestLinks(noteName);
      return items.map(s => ({
        targetNote: s.targetNote,
        reason: s.reason,
        confidence: s.confidence,
      }));
    },

    async contradictions(limit = 25) {
      const items = await client.findContradictions(limit);
      return items.map(c => ({
        conflictType: c.conflictType,
        conflictDescription: c.conflictDescription,
        confidence: c.confidence,
        claim1: { text: c.claim1.text, sourceName: c.claim1.sourceName },
        claim2: { text: c.claim2.text, sourceName: c.claim2.sourceName },
      }));
    },

    async searchEntities(name, limit = 5) {
      return client.searchEntitiesByName(name, limit);
    },

    async pathsBetween(fromNoteName, toNoteName, maxHops = 3) {
      const [fromHits, toHits] = await Promise.all([
        client.searchEntitiesByName(fromNoteName, 5),
        client.searchEntitiesByName(toNoteName, 5),
      ]);
      const from = fromHits.find(h => h.name === fromNoteName) ?? fromHits[0];
      const to = toHits.find(h => h.name === toNoteName) ?? toHits[0];
      if (!from || !to) return [];
      const paths = await client.findPaths(from.id, to.id, maxHops);
      return paths.map(p => ({
        steps: p.steps.map(s => ({ fromName: s.fromName, toName: s.toName, relType: s.relType })),
        length: p.length,
      }));
    },

    async recall(query, limit = 5) {
      const items = await client.recall(query, limit);
      return items.map(m => ({ id: m.id, content: m.content, createdAt: m.createdAt }));
    },

    async remember(content) {
      await client.remember(content);
    },
  };
}
