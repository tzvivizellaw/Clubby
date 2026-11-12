import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

type Cat = 'white' | 'color' | 'sock';
const ITEMS: [string, Cat][] = [
  ['shirt_w', 'white'], ['towel_w', 'white'], ['sock_w', 'sock'],
  ['shirt_r', 'color'], ['shirt_b', 'color'], ['shirt_g', 'color'], ['pants', 'color'],
  ['sock_r', 'sock'], ['sock_b', 'sock'], ['sock_g', 'sock'],
];
const BASKETS: { cat: Cat; x: number; label: string }[] = [
  { cat: 'white', x: 1000, label: 'לבנים' },
  { cat: 'color', x: 640, label: 'צבעוניים' },
  { cat: 'sock', x: 280, label: 'גרביים' },
];
const BELT_Y = 300;

interface Cloth {
  o: Living;
  cat: Cat;
  done: boolean;
  dancing: boolean;
}

/** A5 — sort laundry from a conveyor into baskets; socks dance and escape. */
export default class A5_Laundry extends BaseMiniGame {
  clothes: Cloth[] = [];
  spawnT = 0.5;
  belt!: Phaser.GameObjects.Graphics;
  scroll = 0;

  setup() {
    this.clothes = [];
    this.spawnT = 0.5;
    this.belt = this.add.graphics().setDepth(3);
    for (const b of BASKETS) {
      this.add.image(b.x, 600, 'basket').setScale(1.3 * this.diff.size).setDepth(4);
      this.add.text(b.x, 690, b.label, TXT(28)).setOrigin(0.5).setDepth(5);
      const ic = this.add.image(b.x, 560, b.cat === 'white' ? 'shirt_w' : b.cat === 'color' ? 'shirt_r' : 'sock_b').setScale(0.45).setDepth(5).setAlpha(0.8);
      void ic;
    }
    this.setGoal(this.n(10, 5), 'basket');
    this.setTimer(this.t(48));
    this.useMistakes();
  }

  spawn() {
    const [tex, cat] = this.pick(ITEMS);
    const o = new Living(this, W + 60, BELT_Y - 40, tex, { scale: 0.85 * this.diff.size, legs: cat === 'sock', eyeY: -0.15 }).setDepth(20);
    const c: Cloth = { o, cat, done: false, dancing: false };
    this.clothes.push(c);
    this.draggable(o, (x, y) => this.drop(c, x, y), { hit: new Phaser.Geom.Rectangle(-o.iw / 2, -o.ih / 2, o.iw, o.ih) });
    if (cat === 'sock' && !this.isEasy && Math.random() < 0.5) {
      // dancing sock: hops off the belt and runs on the floor
      this.time.delayedCall(this.rnd(500, 1500), () => {
        if (c.done || !o.active || (o as any).input?.dragState > 0) return;
        c.dancing = true;
        o.runLegs(true, 90).setMood('tongue', 800);
        Audio.sfx('boing');
        this.tweens.add({ targets: o, y: 430, duration: 300, ease: 'Quad.easeOut' });
      });
    }
  }

  drop(c: Cloth, x: number, y: number): boolean {
    if (!this.playing || c.done) return false;
    const b = BASKETS.find((bk) => Math.abs(bk.x - x) < 150 && y > 470);
    if (!b) return false;
    return this.sort(c, b.cat);
  }

  sort(c: Cloth, cat: Cat): boolean {
    const b = BASKETS.find((bk) => bk.cat === cat)!;
    c.done = true;
    this.tweens.killTweensOf(c.o);
    this.tweens.add({ targets: c.o, x: b.x, y: 580, scale: 0.3, duration: 200, onComplete: () => c.o.destroy() });
    if (cat === c.cat) {
      this.good(b.x, 500, '✔');
      this.addProgress(1);
      return true;
    }
    this.mistake(b.x, 500, c.cat === 'white' ? 'הלבן ייצבע ורוד!' : 'סל לא נכון!');
    return true;
  }

  tick(dt: number) {
    this.scroll += dt * 120 * this.diff.speed;
    const g = this.belt.clear();
    g.fillStyle(0x495057).fillRoundedRect(-20, BELT_Y, W + 40, 40, 20);
    g.lineStyle(5, 0x2b1d3a).strokeRoundedRect(-20, BELT_Y, W + 40, 40, 20);
    g.lineStyle(4, 0x868e96);
    for (let x = -(this.scroll % 60); x < W; x += 60) g.lineBetween(x, BELT_Y + 6, x + 20, BELT_Y + 34);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = (this.isEasy ? 2.0 : 1.35) / this.diff.speed;
    }
    const v = 140 * this.diff.speed;
    for (const c of [...this.clothes]) {
      if (c.done) {
        this.clothes.splice(this.clothes.indexOf(c), 1);
        continue;
      }
      if ((c.o as any).input?.dragState > 0) continue;
      c.o.x -= (c.dancing ? v * 1.5 : v) * dt;
      if (c.dancing) c.o.y = 430 + Math.sin(this.elapsed * 10) * 10;
      if (c.o.x < -40) {
        c.done = true;
        c.o.destroy();
        this.mistake(60, BELT_Y, c.dancing ? 'הגרב ברחה!' : 'נפל!');
      }
    }
  }

  hint() {
    const c = this.clothes.find((x) => !x.done);
    if (c) {
      const b = BASKETS.find((bk) => bk.cat === c.cat)!;
      sparkle(this, b.x, 580, 10);
    }
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const c = this.clothes.filter((x) => !x.done && x.o.x < 1150).sort((a, b) => a.o.x - b.o.x)[0];
    if (c) {
      this.sort(c, c.cat);
      this.botTimer = 0.35;
    }
  }

  async winAnim() {
    confetti(this, 640, 400, 60);
    popText(this, 640, 250, 'מקופל בשנייה!', '#ffe14d', 44);
    await wait(this, 1500);
  }

  async loseAnim() {
    const m = new Living(this, 640, -200, 'sockmonster', { scale: 1.3, mood: 'happy' }).setDepth(80);
    await tween(this, { targets: m, y: 430, duration: 600, ease: 'Bounce.easeOut' });
    Audio.sfx('roar');
    m.tongue(1200);
    await tween(this, { targets: m, scale: 1.6, duration: 300, yoyo: true });
    await wait(this, 600);
  }
}
