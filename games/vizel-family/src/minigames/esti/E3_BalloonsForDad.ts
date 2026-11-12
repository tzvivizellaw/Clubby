import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, explodeIntoConfetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const COLS: Record<string, string> = { balloon_r: 'אדום', balloon_b: 'כחול', balloon_g: 'ירוק', balloon_y: 'צהוב' };

interface Bal {
  o: Living;
  tex: string;
  vy: number;
  sway: number;
  giant?: number;
}

/** E3 — pop balloons of dad's colour; one balloon inflates itself into a giant (tap it 5 times). */
export default class E3_BalloonsForDad extends BaseMiniGame {
  bals: Bal[] = [];
  want = 'balloon_r';
  icon!: Phaser.GameObjects.Image;
  spawnT = 0;
  giantDone = false;
  dad!: CharacterRig;

  setup() {
    this.bals = [];
    this.giantDone = false;
    this.dad = new CharacterRig(this, 1150, 700, 'father', 0.6).setDepth(5);
    this.addHero(110, 710, 0.65);
    this.icon = this.add.image(640, 150, 'balloon_r').setDepth(30).setScale(1.2);
    this.setGoal(this.n(10, 5), 'balloon_r');
  }

  onStart() {
    this.setWant(this.pick(Object.keys(COLS)));
  }

  setWant(t: string) {
    this.want = t;
    this.icon.setTexture(t);
    this.tweens.add({ targets: this.icon, scale: 1.6, duration: 200, yoyo: true });
    Audio.say('narrator', `${COLS[t]}!`, { instruction: true });
  }

  spawn() {
    const tex = Math.random() < 0.5 ? this.want : this.pick(Object.keys(COLS));
    const o = new Living(this, this.rnd(200, 1080), 780, tex, { scale: 1.5, eyeY: -0.2 }).setDepth(10);
    const b: Bal = { o, tex, vy: -this.rnd(60, 90), sway: Math.random() * 6 };
    o.tap(() => this.popIt(b), 1.2);
    this.bals.push(b);
  }

  popIt(b: Bal) {
    if (!this.playing || !b.o.active) return;
    if (b.giant != null) {
      b.giant--;
      Audio.sfx('boing');
      this.tweens.add({ targets: b.o, scale: b.o.scale * 0.9, duration: 80, yoyo: true });
      if (b.giant > 0) return;
      explodeIntoConfetti(this, b.o, 80);
      Audio.sfx('confetti');
      this.bals.splice(this.bals.indexOf(b), 1);
      this.addProgress(2);
      return;
    }
    if (b.tex !== this.want) {
      b.o.tongue(600).wobble();
      sparkle(this, this.icon.x, this.icon.y, 6);
      return;
    }
    Audio.sfx('pop');
    explodeIntoConfetti(this, b.o, 25);
    this.bals.splice(this.bals.indexOf(b), 1);
    this.good(b.o.x, b.o.y, '!פּוֹפּ');
    this.dad.setExpr('happy', 500);
    this.addProgress(1);
    if (this.progress % 4 === 0 && !this.ended) this.setWant(this.pick(Object.keys(COLS).filter((k) => k !== this.want)));
  }

  tick(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.bals.length < 6) {
      this.spawn();
      this.spawnT = 1.1;
    }
    // twist: a balloon inflates itself into a giant
    if (!this.giantDone && this.progress >= Math.floor(this.goal / 2)) {
      this.giantDone = true;
      const b = this.bals.find((x) => x.o.y < 600);
      if (b) {
        b.giant = 5;
        b.vy = -20;
        popText(this, b.o.x, b.o.y - 120, 'הבלון מנפח את עצמו!', '#ffe14d', 34);
        Audio.sfx('stretch');
        this.tweens.add({ targets: b.o, scale: 3.6, duration: 1200, ease: 'Sine.easeOut' });
      }
    }
    for (const b of [...this.bals]) {
      b.sway += dt * 2;
      b.o.y += b.vy * dt * this.diff.speed * 1.6;
      b.o.x += Math.sin(b.sway) * 20 * dt;
      if (b.giant != null) b.o.y = Math.max(b.o.y, 320);
      if (b.o.y < -120) {
        this.bals.splice(this.bals.indexOf(b), 1);
        b.o.destroy();
      }
    }
  }

  hint() {
    for (const b of this.bals) if (b.tex === this.want) sparkle(this, b.o.x, b.o.y, 5);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const b = this.bals.find((x) => x.giant != null && x.giant > 0) ?? this.bals.find((x) => x.tex === this.want && x.o.y < 680);
    if (b) {
      this.popIt(b);
      this.botTimer = 0.25;
    }
  }

  async winAnim() {
    const big = this.add.image(this.dad.x, this.dad.y - 330, 'balloon_p').setDepth(20).setScale(2.4);
    await wait(this, 300);
    this.dad.setExpr('shock');
    await tween(this, { targets: [big, this.dad], y: '-=520', duration: 1300, ease: 'Sine.easeIn' });
    confetti(this, 640, 250, 50);
  }
}
