import type { PlayerId, SeriesId } from '../data/characters';
import type { SaveData } from './save';

export const STAGES_PER_SERIES = 8;

export interface Achievement {
  id: string;
  title: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'ניצחון ראשון!', icon: '🏅' },
  { id: 'streak_3', title: '3 ניצחונות ברצף', icon: '🔥' },
  { id: 'streak_6', title: '6 ניצחונות ברצף', icon: '🚀' },
  { id: 'family_done', title: 'סיימת את הסדרה המשפחתית', icon: '🏠' },
  { id: 'own_done', title: 'סיימת סדרה אישית', icon: '⭐' },
  { id: 'flawless', title: 'סדרה שלמה בלי לאבד לב', icon: '💖' },
  { id: 'collector_10', title: 'אספנית/ אספן: 10 פריטים', icon: '🎒' },
  { id: 'all_40', title: 'אלופי הבלגן: כל 40 המשחקונים', icon: '👑' },
  { id: 'game_over_laugh', title: 'נפלת? צחקת!', icon: '😂' },
];

export function canPlaySeries(player: PlayerId, series: SeriesId): boolean {
  return series === 'family' || series === player;
}

export function unlockedCount(save: SaveData, player: PlayerId, series: SeriesId): number {
  return Math.min(STAGES_PER_SERIES, Math.max(1, save.profiles[player].unlocked[series] ?? 1));
}

export function isUnlocked(save: SaveData, player: PlayerId, series: SeriesId, index: number): boolean {
  return canPlaySeries(player, series) && index < unlockedCount(save, player, series);
}

function award(save: SaveData, id: string, out: string[]) {
  if (!save.achievements.includes(id)) {
    save.achievements.push(id);
    out.push(id);
  }
}

/**
 * Apply the result of one mini-game to the save (mutates and returns newly earned achievement ids).
 */
export function recordResult(
  save: SaveData,
  p: {
    player: PlayerId;
    series: SeriesId;
    index: number;
    gameId: string;
    won: boolean;
    streak: number;
    item?: string;
  },
): string[] {
  const earned: string[] = [];
  const prof = save.profiles[p.player];
  prof.plays[p.gameId] = (prof.plays[p.gameId] ?? 0) + 1;
  if (!p.won) return earned;
  prof.wins[p.gameId] = (prof.wins[p.gameId] ?? 0) + 1;
  prof.totalWins += 1;
  prof.bestStreak = Math.max(prof.bestStreak, p.streak);
  const next = Math.min(STAGES_PER_SERIES, p.index + 2);
  prof.unlocked[p.series] = Math.max(prof.unlocked[p.series] ?? 1, next);
  if (p.item && !prof.items.includes(p.item)) prof.items.push(p.item);
  award(save, 'first_win', earned);
  if (p.streak >= 3) award(save, 'streak_3', earned);
  if (p.streak >= 6) award(save, 'streak_6', earned);
  const allItems = Object.values(save.profiles).reduce((n, pr) => n + pr.items.length, 0);
  if (allItems >= 10) award(save, 'collector_10', earned);
  const distinctWins = new Set(Object.values(save.profiles).flatMap((pr) => Object.keys(pr.wins)));
  if (distinctWins.size >= 40) award(save, 'all_40', earned);
  return earned;
}

export function recordSeriesComplete(
  save: SaveData,
  p: { player: PlayerId; series: SeriesId; cleared: number; flawless: boolean },
): string[] {
  const earned: string[] = [];
  const prof = save.profiles[p.player];
  prof.bestRun[p.series] = Math.max(prof.bestRun[p.series] ?? 0, p.cleared);
  if (!prof.seriesCompleted.includes(p.series)) prof.seriesCompleted.push(p.series);
  award(save, p.series === 'family' ? 'family_done' : 'own_done', earned);
  if (p.flawless) award(save, 'flawless', earned);
  return earned;
}

export function recordRunEnd(save: SaveData, p: { player: PlayerId; series: SeriesId; cleared: number; gameOver: boolean }): string[] {
  const earned: string[] = [];
  const prof = save.profiles[p.player];
  prof.bestRun[p.series] = Math.max(prof.bestRun[p.series] ?? 0, p.cleared);
  if (p.gameOver) award(save, 'game_over_laugh', earned);
  return earned;
}
