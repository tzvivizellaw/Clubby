import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

interface Slot {
  tex: string;
  x: number;
  y: number;
  sil: Phaser.GameObjects.Image;
  filled: Item | null;
}
interface Item {
  o: Living;
  tex: string;
  slot: Slot | null;
  home: { x: number; y: number };
}

const LAYOUT: { tex: string; x: number; y: number; s: number }[] = [
  { tex: 'candles', x: 380, y: 250, s: 0.9 },
  { tex: 'challah', x: 640, y: 300, s: 0.9 },
  { tex: 'kiddush', x: 880, y: 250, s: 0.8 },
  { tex: 'plate', x: 470, y: 400, s: 0.8 },
  { tex: 'plate', x: 810, y: 400, s: 0.8 },
  { tex: 'challah', x: 640, y: 210, s: 0.9 },
  { tex: 'cup', x: 560, y: 390, s: 0.75 },
  { tex: 'salt', x: 730, y: 390, s: 0.75 },
  { tex: 'juice', x: 980, y: 330, s: 0.7 },
];

/** F3 — set the Shabbat table before the clock runs out; the challahs keep dancing off. */
export default class F3_ShabbatTable extends BaseMiniGame {
  slots: Slot[] = [];
  items: Item[] = [];
  table!: Phaser.GameObjects.Container;
  danceT = 8;

  setup() {
    this.slots = [];
    this.items = [];
    this.danceT = 7;
    const count = this.isToddler ? 4 : this.diff.tier === 'easy' ? 6 : this.diff.tier === 'medium' ? 8 : 9;
    const g = this.add.graphics();
    g.fillStyle(0x8d5524).fillRoundedRect(-420, -150, 840, 300, 40);
    g.fillStyle(0xffffff).fillRoundedRect(-400, -140, 800, 270, 34);
    g.lineStyle(6, 0x2b1d3a).strokeRoundedRect(-420, -150, 840, 300, 40);
    g.lineStyle(3, 0xdee2e6);
    for (let i = -380; i < 400; i += 40) g.lineBetween(i, -130, i, 120);
    this.table = this.add.container(680, 310, [g]).setDepth(2);
    for (const L of LAYOUT.slice(0, count)) {
      const sil = this.add.image(L.x, L.y, L.tex).setScale(L.s * this.diff.size).setTint(0x2b1d3a).setAlpha(0.22).setDepth(3);
      this.slots.push({ tex: L.tex, x: L.x, y: L.y, sil, filled: null });
    }
    const texs = Phaser.Utils.Array.Shuffle(this.slots.map((s) => s.tex));
    const gap = Math.min(130, 1100 / texs.length);
    texs.forEach((t, i) => {
      const x = 640 - ((texs.length - 1) * gap) / 2 + i * gap;
      const y = 600 + (i % 2) * 40;
      const o = new Living(this, x, y, t, { scale: 0.75 * this.diff.size, eyes: t === 'challah', mouth: t === 'challah' }).setDepth(50);
      const it: Item = { o, tex: t, slot: null, home: { x, y } };
      this.items.push(it);
      this.draggable(o, (px, py) => this.drop(it, px, py), { hit: new Phaser.Geom.Rectangle(-o.iw / 2, -o.ih / 2, o.iw, o.ih) });
    });
    this.add.text(150, 160, 'שבת נכנסת!', TXT(28, '#ff595e')).setOrigin(0.5).setDepth(5);
    this.setGoal(this.slots.length, 'challah');
    this.setTimer(this.t(this.slots.length * 5 + 12));
    this.addHero(1150, 700, 0.6);
  }

  drop(it: Item, x: number, y: number): boolean {
    if (!this.playing) return false;
    const slot = this.slots
      .filter((s) => !s.filled)
      .map((s) => ({ s, d: Phaser.Math.Distance.Between(x, y, s.x, s.y) }))
      .sort((a, b) => a.d - b.d)[0];
    if (!slot || slot.d > 110) return false;
    if (slot.s.tex !== it.tex) {
      this.mistake(x, y, it.tex === 'challah' ? 'זה לא המקום של החלה!' : 'לא כאן!');
      return false;
    }
    this.place(it, slot.s);
    return true;
  }

  place(it: Item, s: Slot) {
    s.filled = it;
    it.slot = s;
    this.tweens.add({ targets: it.o, x: s.x, y: s.y, duration: 120 });
    it.o.setDepth(10).disableInteractive();
    s.sil.setVisible(false);
    this.good(s.x, s.y, '✔');
    this.addProgress(1);
  }

  /** a placed challah jumps off the table and dances on the floor */
  danceAway() {
    const placed = this.items.filter((i) => i.slot && i.tex === 'challah');
    if (!placed.length || this.progress >= this.goal) return;
    const it = this.pick(placed);
    const s = it.slot!;
    s.filled = null;
    s.sil.setVisible(true);
    it.slot = null;
    this.progress -= 1;
    this.addProgress(0);
    Audio.sfx('boing');
    it.o.setMood('tongue', 1200).setDepth(50).setInteractive();
    const tx = this.rnd(150, 1100), ty = this.rnd(560, 650);
    this.tweens.add({ targets: it.o, x: tx, y: ty, duration: 600, ease: 'Sine.easeInOut', onComplete: () => it.o.wobble(150, 15) });
  }

  tick(dt: number) {
    // challahs bob happily
    for (const it of this.items) if (it.tex === 'challah' && Math.random() < dt * 0.6) it.o.hop(10, 120);
    if (this.isToddler || this.diff.tier === 'easy') return;
    this.danceT -= dt;
    if (this.danceT <= 0) {
      this.danceAway();
      this.danceT = this.rnd(7, 11) / this.diff.speed;
    }
  }

  hint() {
    const it = this.items.find((i) => !i.slot);
    const s = it && this.slots.find((sl) => !sl.filled && sl.tex === it.tex);
    if (s) {
      sparkle(this, s.x, s.y, 10);
      this.tweens.add({ targets: s.sil, alpha: 0.6, duration: 200, yoyo: true, repeat: 3 });
    }
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.45;
    const it = this.items.find((i) => !i.slot);
    const s = it && this.slots.find((sl) => !sl.filled && sl.tex === it.tex);
    if (it && s) this.place(it, s);
  }

  async winAnim() {
    const c = this.slots.find((s) => s.tex === 'candles');
    if (c) {
      const glow = this.add.circle(c.x, c.y - 40, 60, 0xffe066, 0.5).setDepth(1);
      this.tweens.add({ targets: glow, scale: 1.6, alpha: 0.2, duration: 500, yoyo: true, repeat: 2 });
    }
    confetti(this, W / 2, 200, 60);
    this.hero?.celebrate();
    Audio.say('mother.well_done');
    await wait(this, 1600);
  }

  async loseAnim() {
    Audio.sfx('drumroll');
    this.items.forEach((i) => i.slot && this.table.add(i.o.setPosition(i.o.x - 680, i.o.y - 310)));
    await tween(this, { targets: this.table, angle: 720, duration: 1600, ease: 'Cubic.easeIn' });
    this.hero?.fall();
    await wait(this, 500);
  }
}
