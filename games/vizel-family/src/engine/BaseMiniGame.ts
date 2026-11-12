import Phaser from 'phaser';
import { Audio } from '../audio/AudioManager';
import { REACTIONS } from '../audio/VoiceRegistry';
import { confetti, popText, shake, sparkle, tween, wait } from '../animations/effects';
import { drawBackground, type BgHandle } from '../assets/backgrounds';
import { CharacterRig } from '../characters/CharacterRig';
import type { PlayerId } from '../data/characters';
import { goalCount, type Difficulty } from '../data/difficulty';
import type { MiniGameDef } from '../minigames/types';
import { ComedyDirector } from './ComedyEvents';
import { TXT, bubble, button, text } from './ui';

export interface MiniGameData {
  def: MiniGameDef;
  player: PlayerId;
  diff: Difficulty;
  attempt: number;
  bot?: boolean;
  onEnd: (won: boolean) => void;
}

export const W = 1280;
export const H = 720;

/**
 * Base for all 40 mini-games: instruction banner, timer, goal counter, mistakes,
 * hero reactions, comedy events, soft-fail for toddlers, win/lose flow and a test bot hook.
 */
export abstract class BaseMiniGame extends Phaser.Scene {
  def!: MiniGameDef;
  player!: PlayerId;
  diff!: Difficulty;
  attempt = 0;
  botOn = false;
  playing = false;
  ended = false;
  mistakes = 0;
  goal = 0;
  progress = 0;
  hero?: CharacterRig;
  comedy!: ComedyDirector;
  bg!: BgHandle;
  protected timeLeft = 0;
  protected timeTotal = 0;
  protected timerOutcome: 'win' | 'lose' | null = null;
  private timerG?: Phaser.GameObjects.Graphics;
  private goalText?: Phaser.GameObjects.Text;
  private goalIcon?: Phaser.GameObjects.Image;
  private mistakeMarks: Phaser.GameObjects.Text[] = [];
  private lastTick = 99;
  private onEnd!: (won: boolean) => void;
  protected botTimer = 0;
  /** extra state for subclasses */
  elapsed = 0;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  init(data: MiniGameData) {
    this.def = data.def;
    this.player = data.player;
    this.diff = data.diff;
    this.attempt = data.attempt ?? 0;
    this.botOn = !!data.bot;
    this.onEnd = data.onEnd;
    this.playing = false;
    this.ended = false;
    this.mistakes = 0;
    this.goal = 0;
    this.progress = 0;
    this.timeLeft = 0;
    this.timeTotal = 0;
    this.timerOutcome = null;
    this.mistakeMarks = [];
    this.lastTick = 99;
    this.elapsed = 0;
    this.botTimer = 0;
    this.hero = undefined;
    this.timerG = undefined;
    this.goalText = undefined;
    this.goalIcon = undefined;
  }

  /** build the play field */
  abstract setup(): void;
  /** per-frame logic while playing (dt in seconds) */
  tick?(dt: number): void;
  /** called once the instruction banner closes */
  onStart?(): void;
  /** automated player used by the e2e test-suite; must use the same entry points as input */
  bot?(dt: number): void;
  /** help for young players after mistakes */
  hint?(): void;

  get isToddler() {
    return this.diff.tier === 'toddler';
  }
  get isEasy() {
    return this.diff.tier === 'toddler' || this.diff.tier === 'easy';
  }

  n(base: number, min = 1) {
    return goalCount(this.diff, base, min);
  }
  /** seconds scaled by difficulty */
  t(sec: number) {
    return sec * this.diff.time;
  }
  /** speed scaled */
  s(v: number) {
    return v * this.diff.speed;
  }
  rnd(a: number, b: number) {
    return Phaser.Math.Between(a, b);
  }
  pick<T>(arr: T[]): T {
    return Phaser.Utils.Array.GetRandom(arr);
  }

  create() {
    this.cameras.main.setBackgroundColor('#2b1d3a');
    this.bg = drawBackground(this, this.def.bg);
    this.cameras.main.fadeIn(250);
    Audio.music(this.def.music ?? (this.isToddler ? 'toddler' : 'play'));
    this.comedy = new ComedyDirector(this, this.isToddler ? 0.7 : 1);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.bg.update(p.x));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.comedy.stop());
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.setup();
    this.showInstructions();
  }

  // ------------------------------------------------------------------ flow
  private showInstructions() {
    const short = this.attempt > 0 || this.diff.text !== 'full';
    const msg = this.attempt > 0 ? 'עוד ניסיון! ' + this.def.short : short ? this.def.short : this.def.instructions;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(980);
    const panel = this.add.container(W / 2, H / 2).setDepth(981);
    const g = this.add.graphics();
    g.fillStyle(0xfff6e0).fillRoundedRect(-400, -200, 800, 400, 36);
    g.lineStyle(7, 0x2b1d3a).strokeRoundedRect(-400, -200, 800, 400, 36);
    const icon = this.add.image(0, -125, this.def.icon);
    icon.setScale(Math.min(110 / icon.width, 100 / icon.height));
    const title = this.add.text(0, -55, this.def.title, TXT(38, '#ff595e', 7)).setOrigin(0.5);
    const body = this.add
      .text(0, 30, msg, { ...TXT(this.diff.text === 'icons' ? 34 : 26, '#2b1d3a', 0), fontStyle: '700', wordWrap: { width: 700, useAdvancedWrap: true } } as any)
      .setOrigin(0.5);
    panel.add([g, icon, title, body]);
    panel.setScale(0.2);
    this.tweens.add({ targets: panel, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icon, angle: { from: -8, to: 8 }, duration: 400, yoyo: true, repeat: -1 });
    Audio.say('narrator', this.def.short, { subtitle: false, instruction: true });
    let closed = false;
    const go = () => {
      if (closed) return;
      closed = true;
      this.tweens.add({ targets: [panel, dim], alpha: 0, duration: 200, onComplete: () => (panel.destroy(), dim.destroy()) });
      const goTxt = text(this, W / 2, H / 2, 'יאללה!', 90, '#ffbe0b', 12).setDepth(990).setScale(0.2);
      this.tweens.add({ targets: goTxt, scale: 1.2, duration: 260, ease: 'Back.easeOut', yoyo: true, hold: 200, onComplete: () => goTxt.destroy() });
      Audio.sfx('whoosh');
      this.playing = true;
      this.comedy.start();
      this.onStart?.();
    };
    const btn = button(this, 0, 150, 'יאללה!', go, { w: 220, h: 66, size: 30 });
    panel.add(btn);
    const autoMs = this.botOn ? 300 : this.attempt > 0 ? 1600 : short ? 2600 : 4200;
    this.time.delayedCall(autoMs, go);
    dim.setInteractive().on('pointerdown', go);
  }

  update(_t: number, dtMs: number) {
    if (!this.playing) return;
    // (the test bot tolerates bigger steps so slow headless browsers still finish quickly)
    const dt = Math.min(this.botOn ? 0.1 : 0.05, dtMs / 1000);
    this.elapsed += dt;
    if (this.timerOutcome) {
      this.timeLeft -= dt;
      this.drawTimer();
      const sec = Math.ceil(this.timeLeft);
      if (sec <= 3 && sec !== this.lastTick && this.timerOutcome === 'lose') {
        this.lastTick = sec;
        Audio.sfx('tick');
      }
      if (this.timeLeft <= 0) {
        const o = this.timerOutcome;
        this.timerOutcome = null;
        if (o === 'win') this.win();
        else this.lose();
        return;
      }
    }
    this.tick?.(dt);
    if (this.botOn && this.playing) this.bot?.(dt);
  }

  // ------------------------------------------------------------------ HUD helpers
  /** Start a countdown. 'lose' timers are skipped for toddlers; 'win' (survive) timers always run. */
  setTimer(sec: number, outcome: 'win' | 'lose' = 'lose') {
    if (outcome === 'lose' && !this.diff.timed) return;
    this.timeTotal = this.timeLeft = sec;
    this.timerOutcome = outcome;
    if (!this.timerG) this.timerG = this.add.graphics().setDepth(970);
    this.drawTimer();
  }

  addTime(sec: number) {
    if (this.timerOutcome) this.timeLeft = Math.min(this.timeTotal, this.timeLeft + sec);
  }

  private drawTimer() {
    const g = this.timerG;
    if (!g) return;
    const f = Phaser.Math.Clamp(this.timeLeft / this.timeTotal, 0, 1);
    g.clear();
    g.fillStyle(0x2b1d3a, 0.6).fillRoundedRect(340, 66, 600, 26, 13);
    const col = this.timerOutcome === 'win' ? 0x4cc9f0 : f > 0.5 ? 0x8ac926 : f > 0.25 ? 0xffca3a : 0xff595e;
    g.fillStyle(col).fillRoundedRect(344, 70, 592 * f, 18, 9);
    g.lineStyle(4, 0x2b1d3a).strokeRoundedRect(340, 66, 600, 26, 13);
  }

  /** Show a goal counter (icon + "x/n"). Reaching it wins unless autoWin=false. */
  setGoal(n: number, icon?: string, autoWin = true) {
    this.goal = n;
    this.progress = 0;
    (this as any)._autoWin = autoWin;
    if (icon) this.goalIcon = this.add.image(1220, 110, icon).setDepth(970);
    this.goalIcon?.setScale(Math.min(50 / this.goalIcon.width, 50 / this.goalIcon.height));
    this.goalText = this.add.text(1160, 110, '', TXT(32, '#ffffff', 7)).setOrigin(0.5).setDepth(970);
    this.updateGoal();
  }

  private updateGoal() {
    this.goalText?.setText(`${this.progress}/${this.goal}`);
  }

  addProgress(k = 1) {
    if (this.ended) return;
    this.progress = Math.min(this.goal, this.progress + k);
    this.updateGoal();
    if (this.goalText) this.tweens.add({ targets: this.goalText, scale: 1.4, duration: 100, yoyo: true });
    if ((this as any)._autoWin !== false && this.goal > 0 && this.progress >= this.goal) this.win();
  }

  private drawMistakes() {
    if (!Number.isFinite(this.diff.mistakes)) return;
    this.mistakeMarks.forEach((m) => m.destroy());
    this.mistakeMarks = [];
    for (let i = 0; i < this.diff.mistakes; i++) {
      const used = i < this.mistakes;
      this.mistakeMarks.push(this.add.text(40 + i * 40, 110, '✖', TXT(30, used ? '#ff595e' : '#ffffff55', 5)).setOrigin(0.5).setDepth(970));
    }
  }

  /** show allowed-mistake markers (call in setup for games that count mistakes) */
  useMistakes() {
    this.drawMistakes();
  }

  addHero(x = 1120, y = 690, scale = 0.8) {
    this.hero = new CharacterRig(this, x, y, this.player, scale).setDepth(20);
    return this.hero;
  }

  // ------------------------------------------------------------------ feedback
  good(x?: number, y?: number, label?: string) {
    Audio.sfx('good');
    if (x != null && y != null) {
      sparkle(this, x, y);
      if (label) popText(this, x, y - 30, label, '#ffe14d', 34);
    }
    if (this.hero && Math.random() < 0.35) this.hero.setExpr('happy', 600);
  }

  mistake(x?: number, y?: number, label = 'אופס!') {
    if (this.ended || !this.playing) return;
    this.mistakes++;
    Audio.sfx('wrong');
    if (x != null && y != null) popText(this, x, y - 30, label, '#ff595e', 36);
    shake(this, 0.006, 160);
    this.hero?.shock();
    this.drawMistakes();
    if (this.diff.hints && this.mistakes % 2 === 0) this.hint?.();
    if (this.diff.hardFail && this.mistakes >= this.diff.mistakes) this.lose();
    else if (!this.diff.hardFail && Number.isFinite(this.diff.mistakes) && this.mistakes >= this.diff.mistakes) this.lose();
  }

  // ------------------------------------------------------------------ outcomes
  /** default unique-ish win animation; games override for their own punchline */
  async winAnim() {
    confetti(this, W / 2, H / 2 - 100, 70);
    Audio.sfx('confetti');
    this.hero?.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    shake(this, 0.02, 400);
    this.hero?.fall();
    await wait(this, 1500);
  }

  async win() {
    if (this.ended) return;
    this.ended = true;
    this.playing = false;
    this.timerOutcome = null;
    this.comedy.stop();
    Audio.sfx('win');
    const r = REACTIONS[this.player];
    if (r) Audio.say(this.pick(r.win));
    const t = text(this, W / 2, 130, this.pick(['כל הכבוד!', 'אלופים!', 'יש!!!', 'מדהים!']), 72, '#ffe14d', 12).setDepth(985).setScale(0.2);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    try {
      await this.winAnim();
    } catch {
      /* animation errors must never block flow */
    }
    this.endRun(true);
  }

  async lose() {
    if (this.ended) return;
    this.ended = true;
    this.playing = false;
    this.timerOutcome = null;
    this.comedy.stop();
    Audio.sfx('lose');
    const r = REACTIONS[this.player];
    if (r) Audio.say(this.pick(r.lose));
    try {
      await this.loseAnim();
    } catch {
      /* ignore */
    }
    if (!this.diff.hardFail) {
      // Toddler mode: no punishment — a helper bubble and another try with extra help.
      const b = bubble(this, W / 2, H / 2, 'לא נורא! ננסה שוב 💪', { size: 40, tail: 'none' });
      b.setDepth(995);
      await wait(this, 1200);
      this.scene.restart({ def: this.def, player: this.player, diff: { ...this.diff, goal: Math.max(0.3, this.diff.goal * 0.8), speed: this.diff.speed * 0.85 }, attempt: this.attempt + 1, bot: this.botOn, onEnd: this.onEnd });
      return;
    }
    this.endRun(false);
  }

  private endRun(won: boolean) {
    this.cameras.main.fadeOut(220);
    this.time.delayedCall(240, () => this.onEnd(won));
  }

  /** test hooks */
  forceWin() {
    if (!this.playing) this.playing = true;
    this.win();
  }
  forceLose() {
    if (!this.playing) this.playing = true;
    this.lose();
  }

  // ------------------------------------------------------------------ drag helper
  /** make a game object draggable; onDrop returns true to accept (else it snaps back) */
  draggable(obj: Phaser.GameObjects.GameObject & { x: number; y: number }, onDrop: (x: number, y: number) => boolean, o: { onPick?: () => void; hit?: Phaser.Geom.Rectangle } = {}) {
    const any = obj as any;
    if (o.hit) any.setInteractive(o.hit, Phaser.Geom.Rectangle.Contains);
    else if (!any.input) any.setInteractive();
    this.input.setDraggable(obj);
    let home = { x: obj.x, y: obj.y };
    obj.on('dragstart', () => {
      if (!this.playing) return;
      home = { x: obj.x, y: obj.y };
      any.setDepth?.(500);
      this.tweens.add({ targets: obj, scale: (any.scale ?? 1) * 1.1, duration: 80 });
      o.onPick?.();
      Audio.sfx('pop');
    });
    obj.on('drag', (_p: any, x: number, y: number) => {
      if (!this.playing) return;
      obj.x = x;
      obj.y = y;
    });
    obj.on('dragend', () => {
      if (!this.playing) return;
      this.tweens.add({ targets: obj, scale: (any.scale ?? 1) / 1.1, duration: 80 });
      const ok = onDrop(obj.x, obj.y);
      if (!ok && any.active) this.tweens.add({ targets: obj, x: home.x, y: home.y, duration: 250, ease: 'Back.easeOut' });
      any.setDepth?.(50);
    });
  }
}

export { tween, wait };
