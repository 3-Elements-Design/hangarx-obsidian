import { Plugin } from 'obsidian';

export interface ChatTurn {
  role: 'user' | 'ai';
  content: string;
  /** Serialized AskResponse for ai turns, so we can re-render entities/citations on rehydrate. */
  payload?: unknown;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: ChatTurn[];
  /** User-flagged as a useful query worth re-running. Surfaces in the
   *  history popover and feeds the onboarding "star a useful query"
   *  milestone. */
  starred?: boolean;
}

const FILENAME = 'conversations.json';
const MAX_CONVERSATIONS = 50;

/**
 * Persists chat conversations in a dedicated JSON file inside the plugin's
 * config directory. Kept separate from `data.json` so `saveSettings()` can't
 * accidentally wipe history. Capped at MAX_CONVERSATIONS — oldest are pruned.
 */
export class ConversationStore {
  private cache: Record<string, ChatConversation> = {};
  private loaded = false;

  constructor(private plugin: Plugin) {}

  private get filePath(): string {
    const dir = this.plugin.manifest.dir ?? `.obsidian/plugins/${this.plugin.manifest.id}`;
    return `${dir}/${FILENAME}`;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const adapter = this.plugin.app.vault.adapter;
    if (await adapter.exists(this.filePath)) {
      try {
        const raw = await adapter.read(this.filePath);
        this.cache = JSON.parse(raw) as Record<string, ChatConversation>;
      } catch (e) {
        console.warn('[Cortex] Failed to read conversations:', e);
        this.cache = {};
      }
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    const adapter = this.plugin.app.vault.adapter;
    await adapter.write(this.filePath, JSON.stringify(this.cache));
  }

  async list(): Promise<ChatConversation[]> {
    await this.ensureLoaded();
    return Object.values(this.cache).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(id: string): Promise<ChatConversation | undefined> {
    await this.ensureLoaded();
    return this.cache[id];
  }

  async upsert(conversation: ChatConversation): Promise<void> {
    await this.ensureLoaded();
    this.cache[conversation.id] = conversation;
    this.pruneIfNeeded();
    await this.persist();
  }

  async delete(id: string): Promise<void> {
    await this.ensureLoaded();
    delete this.cache[id];
    await this.persist();
  }

  async clear(): Promise<void> {
    await this.ensureLoaded();
    this.cache = {};
    await this.persist();
  }

  private pruneIfNeeded(): void {
    const ids = Object.keys(this.cache);
    if (ids.length <= MAX_CONVERSATIONS) return;
    const sorted = ids
      .map(id => ({ id, updatedAt: this.cache[id].updatedAt }))
      .sort((a, b) => a.updatedAt - b.updatedAt);
    const drop = sorted.length - MAX_CONVERSATIONS;
    for (let i = 0; i < drop; i++) delete this.cache[sorted[i].id];
  }
}

/** Build a short title from the first user message. */
export function deriveConversationTitle(firstUserMessage: string): string {
  const stripped = firstUserMessage.replace(/\s+/g, ' ').trim();
  return stripped.length > 60 ? stripped.slice(0, 57) + '…' : stripped;
}

/** Format a timestamp as "2m ago", "3h ago", "Apr 25", etc. */
export function relativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
