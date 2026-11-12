import Phaser from 'phaser';
import { useApp } from '../app/store';
import { Audio } from '../audio/AudioManager';
import type { PlayerId, SeriesId } from '../data/characters';
import { difficultyFor } from '../data/difficulty';
import { seriesGames } from '../minigames/registry';
import type { MiniGameDef } from '../minigames/types';
import { recordResult, recordRunEnd, recordSeriesComplete } from '../progression/progression';
import type { MiniGameData } from './BaseMiniGame';

export const MAX_HEARTS = 3;

export interface RunState {
  series: SeriesId;
  player: PlayerId;
  order: MiniGameDef[];
  startIndex: number;
  index: number;
  hearts: number;
  streak: number;
  bonusUsed: boolean;
  lostAny: boolean;
  cleared: number;
  attempt: number;
}

/** Pure heart / streak rules (unit-tested). */
export function applyResult(r: Pick<RunState, 'hearts' | 'streak' | 'bonusUsed' | 'lostAny'>, won: boolean, hardFail: boolean) {
  let bonus = false;
  if (won) {
    r.streak += 1;
    if (r.streak % 3 === 0 && r.hearts < MAX_HEARTS && !r.bonusUsed) {
      r.hearts += 1;
      r.bonusUsed = true;
      bonus = true;
    }
  } else {
    r.streak = 0;
    if (hardFail) {
      r.hearts = Math.max(0, r.hearts - 1);
      r.lostAny = true;
    }
  }
  return { bonus, gameOver: r.hearts <= 0 };
}

/**
 * Orchestrates a run: intro story -> mini-game -> win/lose story -> next stage / retry / game over.
 */
export class RunDirector {
  game?: Phaser.Game;
  run?: RunState;
  bot = false;
  fastStories = false;
  private currentKey: string | null = null;

  attach(game: Phaser.Game) {
    this.game = game;
  }

  private get store() {
    return useApp.getState();
  }

  private diff() {
    const s = this.store.save.settings;
    return difficultyFor(this.run!.player, s.difficulty[this.run!.player]);
  }

  private stopAll() {
    if (!this.game) return;
    for (const sc of this.game.scene.getScenes(false)) {
      const k = sc.sys.settings.key;
      if (k !== 'Boot' && (sc.sys.isActive() || sc.sys.isPaused())) this.game.scene.stop(k);
    }
  }

  private hud(patch: Partial<NonNullable<ReturnType<typeof useApp.getState>['run']>> = {}) {
    const r = this.run!;
    const def = r.order[r.index];
    this.store.setRun({
      series: r.series,
      index: r.index,
      total: r.order.length,
      hearts: r.hearts,
      maxHearts: MAX_HEARTS,
      streak: r.streak,
      hardFail: this.diff().hardFail,
      title: def?.title ?? '',
      phase: 'story',
      ...patch,
    });
  }

  startRun(series: SeriesId, startIndex = 0) {
    const player = this.store.player;
    if (!player || !this.game) return;
    const order = seriesGames(series);
    this.run = { series, player, order, startIndex, index: startIndex, hearts: MAX_HEARTS, streak: 0, bonusUsed: false, lostAny: false, cleared: 0, attempt: 0 };
    this.store.setPaused(false);
    this.store.setScreen('play');
    this.playCurrent(true);
  }

  current(): MiniGameDef | undefined {
    return this.run?.order[this.run.index];
  }

  private story(def: MiniGameDef, kind: 'intro' | 'win' | 'lose', onDone: () => void) {
    const steps = def[kind];
    if (this.store.save.settings.skipStories && kind === 'intro') return onDone();
    this.stopAll();
    this.hud({ phase: 'story' });
    this.game!.scene.start('Story', { steps, bg: def.bg, kind, title: kind === 'intro' ? `${def.index + 1}. ${def.title}` : undefined, fast: this.fastStories, onDone });
  }

  playCurrent(withIntro = true) {
    const def = this.current();
    if (!def) return;
    if (withIntro) this.story(def, 'intro', () => this.startMiniGame(def));
    else this.startMiniGame(def);
  }

  private async startMiniGame(def: MiniGameDef) {
    const game = this.game!;
    if (!game.scene.getScene(def.id)) {
      const mod = await def.load();
      if (!game.scene.getScene(def.id)) game.scene.add(def.id, mod.default, false);
    }
    this.stopAll();
    this.currentKey = def.id;
    this.hud({ phase: 'game' });
    const data: MiniGameData = {
      def,
      player: this.run!.player,
      diff: this.diff(),
      attempt: this.run!.attempt,
      bot: this.bot,
      onEnd: (won) => this.miniGameEnded(won),
    };
    game.scene.start(def.id, data);
  }

  miniGameEnded(won: boolean) {
    const r = this.run;
    if (!r) return;
    const def = r.order[r.index];
    const hardFail = this.diff().hardFail;
    const { bonus, gameOver } = applyResult(r, won, hardFail);
    if (!won) Audio.sfx('heartLost');
    let earned: string[] = [];
    this.store.updateSave((s) => {
      earned = recordResult(s, { player: r.player, series: r.series, index: r.index, gameId: def.id, won, streak: r.streak, item: def.item });
    });
    for (const a of earned) this.store.toast('הישג חדש!', '🏆');
    if (bonus) this.store.toast('3 ברצף! קיבלת לב בונוס', '💖');
    if (won) {
      r.cleared += 1;
      r.attempt = 0;
    } else r.attempt += 1;
    this.hud({ phase: 'story' });
    this.story(def, won ? 'win' : 'lose', () => this.after(won, gameOver));
  }

  private after(won: boolean, gameOver: boolean) {
    const r = this.run!;
    if (gameOver) return this.gameOver();
    if (won) {
      r.index += 1;
      if (r.index >= r.order.length) return this.seriesComplete();
      return this.playCurrent(true);
    }
    // retry the same stage (short intro skipped)
    this.playCurrent(false);
  }

  private gameOver() {
    const r = this.run!;
    let earned: string[] = [];
    this.store.updateSave((s) => {
      earned = recordRunEnd(s, { player: r.player, series: r.series, cleared: r.cleared, gameOver: true });
    });
    for (const _ of earned) this.store.toast('הישג חדש!', '🏆');
    this.stopAll();
    this.hud({ phase: 'over', hearts: 0 });
    this.game!.scene.start('GameOver', {
      player: r.player,
      cleared: r.cleared,
      fast: this.fastStories,
      onRetry: () => this.startRun(r.series, r.startIndex),
      onMap: () => this.quitToMap(),
    });
  }

  private seriesComplete() {
    const r = this.run!;
    let earned: string[] = [];
    const completed = r.startIndex === 0;
    this.store.updateSave((s) => {
      earned = completed
        ? recordSeriesComplete(s, { player: r.player, series: r.series, cleared: r.cleared, flawless: !r.lostAny })
        : recordRunEnd(s, { player: r.player, series: r.series, cleared: r.cleared, gameOver: false });
    });
    this.stopAll();
    this.game!.scene.start('Idle');
    this.store.setSummary({ series: r.series, cleared: r.cleared, total: r.order.length, completed: true, gameOver: false, newAchievements: earned });
    this.store.setRun(null);
    this.store.setScreen('seriesDone');
    Audio.music('party');
  }

  quitToMap() {
    this.stopAll();
    this.game?.scene.start('Idle');
    this.run = undefined;
    this.store.setRun(null);
    this.store.setPaused(false);
    this.store.setScreen('map');
    Audio.music('menu');
  }

  pause(on: boolean) {
    if (!this.game) return;
    for (const sc of this.game.scene.getScenes(false)) {
      const k = sc.sys.settings.key;
      if (k === 'Boot' || k === 'Idle') continue;
      if (on && sc.sys.isActive()) this.game.scene.pause(k);
      if (!on && sc.sys.isPaused()) this.game.scene.resume(k);
    }
    this.store.setPaused(on);
  }

  /** test hooks */
  activeMiniGame(): any {
    if (!this.game || !this.currentKey) return null;
    const sc = this.game.scene.getScene(this.currentKey);
    return sc && sc.sys.isActive() ? sc : null;
  }
}

export const director = new RunDirector();
