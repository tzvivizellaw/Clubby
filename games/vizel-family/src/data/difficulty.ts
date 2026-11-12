import type { PlayerId } from './characters';

export type Tier = 'toddler' | 'easy' | 'medium' | 'hard';
export type ParentDifficulty = 'auto' | 'easier' | 'harder';

export interface Difficulty {
  tier: Tier;
  /** multiplier for moving things */
  speed: number;
  /** multiplier for timers */
  time: number;
  /** can a timer cause failure */
  timed: boolean;
  /** multiplier for goal counts */
  goal: number;
  /** number of options in choice tasks */
  choices: number;
  /** multiplier for target sizes */
  size: number;
  /** mistakes allowed before failing */
  mistakes: number;
  /** a failure costs a heart / can lead to game over */
  hardFail: boolean;
  /** automatic help after mistakes */
  hints: boolean;
  /** how much text to show */
  text: 'icons' | 'short' | 'full';
}

export const TIERS: Record<Tier, Difficulty> = {
  toddler: { tier: 'toddler', speed: 0.5, time: 3, timed: false, goal: 0.5, choices: 3, size: 1.45, mistakes: Infinity, hardFail: false, hints: true, text: 'icons' },
  easy: { tier: 'easy', speed: 0.72, time: 1.45, timed: true, goal: 0.7, choices: 3, size: 1.22, mistakes: 4, hardFail: true, hints: true, text: 'short' },
  medium: { tier: 'medium', speed: 1, time: 1.1, timed: true, goal: 1, choices: 4, size: 1, mistakes: 3, hardFail: true, hints: false, text: 'full' },
  hard: { tier: 'hard', speed: 1.15, time: 1, timed: true, goal: 1.2, choices: 4, size: 0.92, mistakes: 3, hardFail: true, hints: false, text: 'full' },
};

export const PLAYER_TIER: Record<PlayerId, Tier> = {
  esti: 'toddler',
  yedidya: 'easy',
  daniel: 'medium',
  avigail: 'hard',
};

const ORDER: Tier[] = ['toddler', 'easy', 'medium', 'hard'];

export function difficultyFor(player: PlayerId, parent: ParentDifficulty = 'auto'): Difficulty {
  let idx = ORDER.indexOf(PLAYER_TIER[player]);
  if (parent === 'easier') idx = Math.max(0, idx - 1);
  if (parent === 'harder') idx = Math.min(ORDER.length - 1, idx + 1);
  const d = { ...TIERS[ORDER[idx]] };
  // Esti always keeps the gentle "no hard game over" mode, whatever the parent setting.
  if (player === 'esti') {
    d.hardFail = false;
    d.mistakes = Infinity;
    d.hints = true;
    d.timed = false;
  }
  return d;
}

/** scale a base goal count by difficulty, never below 1 */
export function goalCount(d: Difficulty, base: number, min = 1): number {
  return Math.max(min, Math.round(base * d.goal));
}
