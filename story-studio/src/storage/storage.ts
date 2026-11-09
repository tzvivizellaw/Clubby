import type { Story } from '../model/types';
import { parseStory } from '../io/schema';

/** Minimal key/value interface (window.localStorage in the app, a fake in tests). */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'unknown' };

export interface StorySummary {
  id: string;
  title: string;
  updatedAt: number;
  sceneCount: number;
  coverColor: string;
  story: Story;
}

const PREFIX = 'hasipur.story.';
const LAST_KEY = 'hasipur.lastOpened';
const ONBOARD_KEY = 'hasipur.onboarded';

export function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error) && !(typeof DOMException !== 'undefined' && e instanceof DOMException)) return false;
  const err = e as { name?: string; code?: number };
  return err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22 || err.code === 1014;
}

export function getDefaultKV(): KV | null {
  try {
    const kv = window.localStorage;
    const probe = '__hasipur_probe__';
    kv.setItem(probe, '1');
    kv.removeItem(probe);
    return kv;
  } catch {
    return null;
  }
}

export class StoryStore {
  constructor(private kv: KV | null) {}

  get available(): boolean {
    return this.kv !== null;
  }

  save(story: Story): SaveResult {
    if (!this.kv) return { ok: false, reason: 'unavailable' };
    try {
      this.kv.setItem(PREFIX + story.id, JSON.stringify(story));
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: isQuotaError(e) ? 'quota' : 'unknown' };
    }
  }

  load(id: string): Story | null {
    if (!this.kv) return null;
    try {
      const raw = this.kv.getItem(PREFIX + id);
      if (!raw) return null;
      const parsed = parseStory(JSON.parse(raw));
      return parsed.ok ? parsed.story : null;
    } catch {
      return null;
    }
  }

  /** All stored stories, newest first. Damaged entries are counted, never thrown. */
  list(): { stories: StorySummary[]; damaged: number } {
    const stories: StorySummary[] = [];
    let damaged = 0;
    if (!this.kv) return { stories, damaged };
    const keys: string[] = [];
    for (let i = 0; i < this.kv.length; i++) {
      const k = this.kv.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      try {
        const raw = this.kv.getItem(k);
        const parsed = raw ? parseStory(JSON.parse(raw)) : null;
        if (parsed && parsed.ok) {
          const s = parsed.story;
          stories.push({ id: s.id, title: s.title, updatedAt: s.updatedAt, sceneCount: s.scenes.length, coverColor: s.cover.color, story: s });
        } else {
          damaged++;
        }
      } catch {
        damaged++;
      }
    }
    stories.sort((a, b) => b.updatedAt - a.updatedAt);
    return { stories, damaged };
  }

  has(id: string): boolean {
    try {
      return !!this.kv?.getItem(PREFIX + id);
    } catch {
      return false;
    }
  }

  remove(id: string): void {
    try {
      this.kv?.removeItem(PREFIX + id);
      if (this.lastOpened() === id) this.kv?.removeItem(LAST_KEY);
    } catch {
      /* ignore */
    }
  }

  /** Remove entries that can't be read at all. */
  removeDamaged(): number {
    if (!this.kv) return 0;
    const bad: string[] = [];
    for (let i = 0; i < this.kv.length; i++) {
      const k = this.kv.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      try {
        const raw = this.kv.getItem(k);
        const parsed = raw ? parseStory(JSON.parse(raw)) : null;
        if (!parsed || !parsed.ok) bad.push(k);
      } catch {
        bad.push(k);
      }
    }
    bad.forEach((k) => this.kv!.removeItem(k));
    return bad.length;
  }

  lastOpened(): string | null {
    try {
      return this.kv?.getItem(LAST_KEY) ?? null;
    } catch {
      return null;
    }
  }

  setLastOpened(id: string): void {
    try {
      this.kv?.setItem(LAST_KEY, id);
    } catch {
      /* ignore */
    }
  }

  onboarded(): boolean {
    try {
      return this.kv?.getItem(ONBOARD_KEY) === '1';
    } catch {
      return true;
    }
  }

  setOnboarded(): void {
    try {
      this.kv?.setItem(ONBOARD_KEY, '1');
    } catch {
      /* ignore */
    }
  }
}

/** In-memory KV, used in tests and as a fallback. */
export class MemoryKV implements KV {
  private map = new Map<string, string>();
  constructor(private quotaBytes = Infinity) {}
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    let total = v.length;
    for (const [key, val] of this.map) if (key !== k) total += val.length;
    if (total > this.quotaBytes) {
      const err = new Error('quota');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

let defaultStore: StoryStore | null = null;
export function getStore(): StoryStore {
  if (!defaultStore) defaultStore = new StoryStore(getDefaultKV());
  return defaultStore;
}
