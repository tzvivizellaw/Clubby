import type { PlayerId, SeriesId } from '../data/characters';
import type { ParentDifficulty } from '../data/difficulty';

export const SAVE_KEY = 'vizel-family-save';
export const SAVE_VERSION = 2;

export type VoiceFallback = 'babble' | 'tts' | 'silent';

export interface Settings {
  music: number; // 0..1
  sfx: number;
  voice: number;
  muted: boolean;
  subtitles: boolean;
  voiceFallback: VoiceFallback;
  skipStories: boolean;
  difficulty: Record<PlayerId, ParentDifficulty>;
}

export interface Profile {
  /** number of unlocked stages per series (>=1) */
  unlocked: Partial<Record<SeriesId, number>>;
  wins: Record<string, number>;
  plays: Record<string, number>;
  totalWins: number;
  bestStreak: number;
  bestRun: Partial<Record<SeriesId, number>>;
  items: string[];
  seriesCompleted: SeriesId[];
}

export interface SaveData {
  version: number;
  playerName: string;
  lastPlayer: PlayerId | null;
  profiles: Record<PlayerId, Profile>;
  settings: Settings;
  achievements: string[];
}

export function defaultSettings(): Settings {
  return {
    music: 0.5,
    sfx: 0.8,
    voice: 1,
    muted: false,
    subtitles: true,
    voiceFallback: 'babble',
    skipStories: false,
    difficulty: { avigail: 'auto', daniel: 'auto', yedidya: 'auto', esti: 'auto' },
  };
}

export function defaultProfile(): Profile {
  return { unlocked: {}, wins: {}, plays: {}, totalWins: 0, bestStreak: 0, bestRun: {}, items: [], seriesCompleted: [] };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    playerName: '',
    lastPlayer: null,
    profiles: { avigail: defaultProfile(), daniel: defaultProfile(), yedidya: defaultProfile(), esti: defaultProfile() },
    settings: defaultSettings(),
    achievements: [],
  };
}

/** Upgrade any older/partial save shape to the current version. Never throws. */
export function migrate(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as any;
  const out: SaveData = { ...base, ...r };
  // v1 stored one flat "unlocked" number per player. v2 stores per series.
  out.profiles = { ...base.profiles };
  for (const p of Object.keys(base.profiles) as PlayerId[]) {
    const src = r.profiles?.[p] ?? {};
    const prof: Profile = { ...defaultProfile(), ...src };
    if (typeof src.unlocked === 'number') prof.unlocked = { [p]: src.unlocked, family: 1 };
    if (!prof.unlocked || typeof prof.unlocked !== 'object') prof.unlocked = {};
    prof.items = Array.isArray(prof.items) ? prof.items : [];
    prof.seriesCompleted = Array.isArray(prof.seriesCompleted) ? prof.seriesCompleted : [];
    out.profiles[p] = prof;
  }
  out.settings = { ...base.settings, ...(r.settings ?? {}) };
  out.settings.difficulty = { ...base.settings.difficulty, ...(r.settings?.difficulty ?? {}) };
  out.achievements = Array.isArray(r.achievements) ? r.achievements : [];
  out.playerName = typeof r.playerName === 'string' ? r.playerName : '';
  out.version = SAVE_VERSION;
  return out;
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  const s = storage();
  if (!s) return defaultSave();
  try {
    const txt = s.getItem(SAVE_KEY);
    if (!txt) return defaultSave();
    return migrate(JSON.parse(txt));
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
