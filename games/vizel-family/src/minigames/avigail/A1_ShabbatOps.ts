import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT, text } from '../../engine/ui';

const SETS: { title: string; steps: [string, string][] }[] = [
  { title: 'הכנות לשבת', steps: [['קניות בסופר', 'basket'], ['בישול האוכל', 'soup'], ['ניקיון הבית', 'vacuum'], ['מקלחת לילדים', 'duck'], ['הדלקת נרות', 'candles']] },
  { title: 'אופים עוגה', steps: [['מוציאים מצרכים', 'milk'], ['שוברים ביצים', 'egg'], ['אופים בתנור', 'cake'], ['מקשטים', 'star'], ['אוכלים!', 'plate']] },
  { title: 'בוקר בבית', steps: [['מתעוררים', 'clock'], ['נטילת ידיים', 'cup'], ['מתלבשים', 'shirt_b'], ['ארוחת בוקר', 'cheese'], ['יוצאים לבית הספר', 'bag']] },
];

interface Card {
  c: Phaser.GameObjects.Container;
  step: number;
  placed: boolean;
  vx: number;
  vy: number;
  eyes: Phaser.GameObjects.Graphics;
}

/** A1 — order the living task cards (they keep trying to escape). */
export default class A1_ShabbatOps extends BaseMiniGame {
  round = 0;
  rounds = 2;
  cards: Card[] = [];
  slots: { x: number; y: number; g: Phaser.GameObjects.Graphics }[] = [];
  next = 0;
  roundObjs: Phaser.GameObjects.GameObject[] = [];
  sets: typeof SETS = [];

  setup() {
    this.round = 0;
    this.rounds = this.isEasy ? 1 : 2;
    this.sets = Phaser.Utils.Array.Shuffle([...SETS]);
    this.setGoal(this.rounds, 'notebook');
    this.setTimer(this.t(this.rounds * 30 + 6));
    this.useMistakes();
    this.addHero(1190, 700, 0.55);
    this.buildRound();
  }

  buildRound() {
    this.roundObjs.forEach((o) => o.destroy());
    this.roundObjs = [];
    this.cards = [];
    this.slots = [];
    this.next = 0;
    const set = this.sets[this.round % this.sets.length];
    const steps = set.steps.slice(0, this.isEasy ? 4 : 5);
    this.roundObjs.push(text(this, 640, 140, set.title, 40, '#ffe14d', 8).setDepth(5));
    const n = steps.length;
    const gap = 220;
    for (let i = 0; i < n; i++) {
      const x = 640 + ((n - 1) / 2) * gap - i * gap; // RTL: step 1 on the right
      const y = 270;
      const g = this.add.graphics().setDepth(4);
      g.fillStyle(0xffffff, 0.35).fillRoundedRect(x - 95, y - 60, 190, 120, 20);
      g.lineStyle(4, 0x2b1d3a, 0.6).strokeRoundedRect(x - 95, y - 60, 190, 120, 20);
      const num = text(this, x, y, String(i + 1), 56, '#2b1d3a55', 0).setDepth(4);
      this.roundObjs.push(g, num);
      this.slots.push({ x, y, g });
    }
    const order = Phaser.Utils.Array.Shuffle(steps.map((_, i) => i));
    order.forEach((step, k) => {
      const [label, icon] = steps[step];
      const bg = this.add.graphics();
      bg.fillStyle(0xfff6e0).fillRoundedRect(-90, -55, 180, 110, 18);
      bg.lineStyle(5, 0x2b1d3a).strokeRoundedRect(-90, -55, 180, 110, 18);
      const ic = this.add.image(-48, -4, icon);
      ic.setScale(Math.min(64 / ic.width, 64 / ic.height));
      const t = this.add.text(30, 0, label, { ...TXT(20, '#2b1d3a', 0), wordWrap: { width: 100, useAdvancedWrap: true } } as any).setOrigin(0.5);
      const eyes = this.add.graphics();
      const c = this.add.container(180 + k * 210, 470 + (k % 2) * 110, [bg, ic, t, eyes]).setDepth(30).setSize(180, 110);
      const card: Card = { c, step, placed: false, vx: this.rnd(-60, 60) * this.diff.speed, vy: this.rnd(-40, 40) * this.diff.speed, eyes };
      this.drawEyes(card, 0, 0);
      this.cards.push(card);
      this.roundObjs.push(c);
      this.draggable(c, (x, y) => this.drop(card, x, y), { hit: new Phaser.Geom.Rectangle(-90, -55, 180, 110) });
    });
  }

  drawEyes(card: Card, lx: number, ly: number) {
    const g = card.eyes;
    g.clear();
    if (card.placed) return;
    for (const ex of [-20, 0]) {
      g.fillStyle(0xffffff).fillCircle(60 + ex, -36, 8).lineStyle(2, 0x2b1d3a).strokeCircle(60 + ex, -36, 8);
      g.fillStyle(0x2b1d3a).fillCircle(60 + ex + lx * 3, -36 + ly * 3, 3.5);
    }
  }

  drop(card: Card, x: number, y: number): boolean {
    if (!this.playing || card.placed) return false;
    const s = this.slots[this.next];
    const near = this.slots.findIndex((sl) => Math.abs(sl.x - x) < 110 && Math.abs(sl.y - y) < 80);
    if (near < 0) return false;
    if (near !== this.next || card.step !== this.next) {
      this.mistake(x, y, near !== this.next ? `קודם משימה ${this.next + 1}!` : 'זה לא בסדר הנכון!');
      return false;
    }
    this.place(card, s);
    return true;
  }

  place(card: Card, s: { x: number; y: number }) {
    card.placed = true;
    card.c.disableInteractive();
    this.drawEyes(card, 0, 0);
    this.tweens.add({ targets: card.c, x: s.x, y: s.y, angle: 0, duration: 140 });
    card.c.setDepth(10);
    this.good(s.x, s.y - 70, '✔');
    this.next++;
    if (this.next >= this.slots.length) {
      confetti(this, 640, 270, 30);
      Audio.sfx('ding');
      this.round++;
      this.addProgress(1);
      if (!this.ended) this.time.delayedCall(700, () => this.playing && this.buildRound());
    }
  }

  tick(dt: number) {
    for (const k of this.cards) {
      if (k.placed || (k.c as any).input?.dragState > 0) continue;
      k.c.x += k.vx * dt;
      k.c.y += k.vy * dt;
      if (k.c.x < 110 || k.c.x > 1170) k.vx *= -1;
      if (k.c.y < 420 || k.c.y > 650) k.vy *= -1;
      k.c.x = Phaser.Math.Clamp(k.c.x, 110, 1170);
      k.c.y = Phaser.Math.Clamp(k.c.y, 420, 650);
      k.c.angle = Math.sin(this.elapsed * 6 + k.step) * 4;
      if (Math.random() < dt * 0.4) {
        // the card tries to escape: a sudden dash
        k.vx = this.rnd(-160, 160) * this.diff.speed;
        k.vy = this.rnd(-90, 90) * this.diff.speed;
        dust(this, k.c.x, k.c.y + 50, 3);
      }
      this.drawEyes(k, Math.sign(k.vx), Math.sign(k.vy));
    }
  }

  hint() {
    const c = this.cards.find((k) => !k.placed && k.step === this.next);
    if (c) sparkle(this, c.c.x, c.c.y, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.5;
    const c = this.cards.find((k) => !k.placed && k.step === this.next);
    if (c) this.place(c, this.slots[this.next]);
  }

  async winAnim() {
    confetti(this, 640, 300, 60);
    this.hero?.celebrate();
    const clk = new Living(this, 640, 520, 'clock', { legs: true, scale: 1.2 }).setDepth(60);
    clk.runLegs(true, 80);
    await tween(this, { targets: clk, angle: -720, duration: 1300 });
  }

  async loseAnim() {
    const pile = new Living(this, this.hero?.x ?? 1100, -200, 'laundrypile', { scale: 1.3, mood: 'tongue' }).setDepth(60);
    await tween(this, { targets: pile, y: 600, duration: 500, ease: 'Bounce.easeOut' });
    this.hero?.setVisible(false);
    dust(this, pile.x, 650, 10);
    Audio.sfx('crash');
    await wait(this, 1000);
  }
}
