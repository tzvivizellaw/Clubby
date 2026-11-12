import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

interface Cookie {
  o: Living;
  vx: number;
  vy: number;
  done: boolean;
}

const PLATE = { x: 640, y: 230 };

/** E4 — drag the little running cookies onto the plate. */
export default class E4_RunawayCookies extends BaseMiniGame {
  cookies: Cookie[] = [];
  plate!: Phaser.GameObjects.Image;
  onPlate = 0;

  setup() {
    this.cookies = [];
    this.onPlate = 0;
    this.plate = this.add.image(PLATE.x, PLATE.y, 'plate').setScale(2.6).setDepth(5);
    this.addHero(1170, 710, 0.65);
    const n = this.n(10, 5);
    for (let i = 0; i < n; i++) {
      const o = new Living(this, this.rnd(150, 1050), this.rnd(420, 640), 'cookie', { scale: 1.6, legs: true }).setDepth(20);
      o.runLegs(true, 160);
      const c: Cookie = { o, vx: this.rnd(-60, 60) || 40, vy: this.rnd(-30, 30), done: false };
      this.cookies.push(c);
      this.draggable(o, (x, y) => (Phaser.Math.Distance.Between(x, y, PLATE.x, PLATE.y) < 200 ? (this.place(c), true) : false), {
        hit: new Phaser.Geom.Rectangle(-50, -50, 100, 100),
        onPick: () => o.setMood('shock'),
      });
    }
    this.setGoal(n, 'cookie');
  }

  place(c: Cookie) {
    if (c.done) return;
    c.done = true;
    c.o.runLegs(false).setMood('happy').disableInteractive();
    const k = this.onPlate++;
    this.tweens.add({ targets: c.o, x: PLATE.x - 120 + (k % 5) * 60, y: PLATE.y - 15 - Math.floor(k / 5) * 30, scale: 0.9, duration: 200 });
    Audio.sfx('ding');
    this.good(PLATE.x, PLATE.y - 60, 'יאמי!');
    this.addProgress(1);
  }

  tick(dt: number) {
    for (const c of this.cookies) {
      if (c.done || (c.o as any).input?.dragState > 0) continue;
      c.o.x += c.vx * dt * this.diff.speed * 1.4;
      c.o.y += c.vy * dt * this.diff.speed * 1.4;
      if (c.o.x < 100 || c.o.x > 1100) c.vx *= -1;
      if (c.o.y < 400 || c.o.y > 660) c.vy *= -1;
    }
  }

  hint() {
    const c = this.cookies.find((x) => !x.done);
    if (c) sparkle(this, c.o.x, c.o.y, 8);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.4;
    const c = this.cookies.find((x) => !x.done);
    if (c) this.place(c);
  }

  async winAnim() {
    Audio.say('esti.want_shoko');
    const sh = this.add.image(PLATE.x + 220, PLATE.y, 'shoko').setDepth(10).setScale(0);
    await tween(this, { targets: sh, scale: 1.4, duration: 300, ease: 'Back.easeOut' });
    confetti(this, PLATE.x, PLATE.y, 60);
    this.hero?.celebrate();
    await wait(this, 1300);
  }
}
