import { beforeEach, describe, expect, it } from 'vitest';
import { applyResult, MAX_HEARTS } from '../engine/RunDirector';
import { isUnlocked, recordResult, recordSeriesComplete, unlockedCount } from '../progression/progression';
import { defaultSave, loadSave, migrate, SAVE_KEY, SAVE_VERSION, writeSave } from '../progression/save';

describe('save / load', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through localStorage', () => {
    const s = defaultSave();
    s.playerName = 'בדיקה';
    s.profiles.daniel.totalWins = 7;
    s.settings.music = 0.2;
    expect(writeSave(s)).toBe(true);
    const back = loadSave();
    expect(back.playerName).toBe('בדיקה');
    expect(back.profiles.daniel.totalWins).toBe(7);
    expect(back.settings.music).toBe(0.2);
    expect(back.version).toBe(SAVE_VERSION);
  });

  it('survives corrupt data', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    const s = loadSave();
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.profiles.esti.items).toEqual([]);
  });

  it('migrates a v1 save (flat unlocked number)', () => {
    const old = { version: 1, playerName: 'x', profiles: { yedidya: { unlocked: 4, wins: { Y1: 2 } } }, settings: { music: 0.1 } };
    const m = migrate(old);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.profiles.yedidya.unlocked.yedidya).toBe(4);
    expect(m.profiles.yedidya.wins.Y1).toBe(2);
    expect(m.settings.music).toBe(0.1);
    expect(m.settings.sfx).toBeGreaterThan(0); // defaults filled in
    expect(m.profiles.avigail.totalWins).toBe(0);
  });
});

describe('progression', () => {
  it('unlocks the next stage on a win and keeps it after losses', () => {
    const s = defaultSave();
    expect(unlockedCount(s, 'daniel', 'daniel')).toBe(1);
    recordResult(s, { player: 'daniel', series: 'daniel', index: 0, gameId: 'D1', won: true, streak: 1, item: 'x' });
    expect(unlockedCount(s, 'daniel', 'daniel')).toBe(2);
    recordResult(s, { player: 'daniel', series: 'daniel', index: 1, gameId: 'D2', won: false, streak: 0 });
    expect(unlockedCount(s, 'daniel', 'daniel')).toBe(2);
    expect(s.profiles.daniel.items).toContain('x');
    expect(s.achievements).toContain('first_win');
  });

  it('only lets a child play their own series + the family series', () => {
    const s = defaultSave();
    expect(isUnlocked(s, 'esti', 'esti', 0)).toBe(true);
    expect(isUnlocked(s, 'esti', 'family', 0)).toBe(true);
    expect(isUnlocked(s, 'esti', 'daniel', 0)).toBe(false);
    expect(isUnlocked(s, 'esti', 'esti', 1)).toBe(false);
  });

  it('records series completion achievements', () => {
    const s = defaultSave();
    const e = recordSeriesComplete(s, { player: 'avigail', series: 'family', cleared: 8, flawless: true });
    expect(e).toEqual(expect.arrayContaining(['family_done', 'flawless']));
    expect(s.profiles.avigail.seriesCompleted).toContain('family');
  });
});

describe('hearts', () => {
  it('loses a heart per failure and ends at zero', () => {
    const r = { hearts: MAX_HEARTS, streak: 0, bonusUsed: false, lostAny: false };
    expect(applyResult(r, false, true).gameOver).toBe(false);
    expect(applyResult(r, false, true).gameOver).toBe(false);
    expect(applyResult(r, false, true).gameOver).toBe(true);
    expect(r.hearts).toBe(0);
  });

  it('toddler mode never loses hearts', () => {
    const r = { hearts: MAX_HEARTS, streak: 0, bonusUsed: false, lostAny: false };
    for (let i = 0; i < 5; i++) applyResult(r, false, false);
    expect(r.hearts).toBe(MAX_HEARTS);
  });

  it('gives one bonus heart for a 3-win streak (not above max, once per run)', () => {
    const r = { hearts: 2, streak: 0, bonusUsed: false, lostAny: false };
    applyResult(r, true, true);
    applyResult(r, true, true);
    expect(applyResult(r, true, true).bonus).toBe(true);
    expect(r.hearts).toBe(3);
    r.hearts = 1;
    for (let i = 0; i < 3; i++) applyResult(r, true, true);
    expect(r.hearts).toBe(1); // already used this run
  });
});
