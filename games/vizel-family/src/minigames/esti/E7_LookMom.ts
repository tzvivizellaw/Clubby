import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

type Slot = 'head' | 'eyes' | 'neck' | 'feet';
const ITEMS: { tex: string; slot: Slot }[] = [
  { tex: 'tophat', slot: 'head' },
  { tex: 'crown', slot: 'head' },
  { tex: 'bigglasses', slot: 'eyes' },
  { tex: 'bowtie', slot: 'neck' },
  { tex: 'scarf', slot: 'neck' },
  { tex: 'boots', slot: 'feet' },
];
const POS: Record<Slot, { x: number; y: number; s: number }> = {
  head: { x: 0, y: -330, s: 1.2 },
  eyes: { x: 0, y: -248, s: 0.75 },
  neck: { x: 0, y: -150, s: 0.85 },
  feet: { x: 0, y: -10, s: 1.2 },
};

/** E7 — dress dad in silly clothes (one per body slot), then he walks a fashion parade. */
export default class E7_LookMom extends BaseMiniGame {
  dad!: CharacterRig;
  worn = new Map<Slot, Phaser.GameObjects.Image>();
  buttons: Phaser.GameObjects.Image[] = [];

  setup() {
    this.worn = new Map();
    this.buttons = [];
    this.dad = new CharacterRig(this, 640, 640, 'father', 1).setDepth(10);
    this.addHero(1170, 710, 0.6);
    ITEMS.forEach((it, i) => {
      const x = i < 3 ? 160 : 1120;
      const y = 230 + (i % 3) * 150;
      const bg = this.add.circle(x, y, 65, 0xfff6e0).setStrokeStyle(5, 0x2b1d3a).setDepth(20);
      void bg;
      const b = this.add.image(x, y, it.tex).setDepth(21).setInteractive();
      b.setScale(Math.min(100 / b.width, 90 / b.height));
      b.on('pointerdown', () => this.wear(it.tex, it.slot, b));
      this.buttons.push(b);
    });
    this.setGoal(4, 'tophat');
  }

  wear(tex: string, slot: Slot, from: Phaser.GameObjects.Image) {
    if (!this.playing) return;
    const p = POS[slot];
    const old = this.worn.get(slot);
    const isNewSlot = !old;
    old?.destroy();
    const s = this.dad.baseScale;
    const im = this.add.image(from.x, from.y, tex).setDepth(30).setScale(0.4);
    this.worn.set(slot, im);
    Audio.sfx('boing');
    this.tweens.add({ targets: im, x: this.dad.x + p.x * s, y: this.dad.y + p.y * s, scale: p.s * s, angle: { from: -40, to: 0 }, duration: 350, ease: 'Back.easeOut' });
    this.dad.setExpr(this.pick(['shock', 'laugh', 'confused']), 700);
    if (isNewSlot) {
      this.good(this.dad.x, 200, this.pick(['יפה!', 'וואו!', 'חחח!']));
      this.addProgress(1);
    }
  }

  hint() {
    const free = ITEMS.find((it) => !this.worn.has(it.slot));
    const b = free && this.buttons[ITEMS.indexOf(free)];
    if (b) sparkle(this, b.x, b.y, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.5;
    const it = ITEMS.find((x) => !this.worn.has(x.slot));
    if (it) this.wear(it.tex, it.slot, this.buttons[ITEMS.indexOf(it)]);
  }

  async winAnim() {
    // fashion parade!
    Audio.music('party');
    this.buttons.forEach((b) => b.setVisible(false));
    const parts = [...this.worn.values()];
    const dx = (x: number) => [this.dad, ...parts].forEach((o) => (o.x += x));
    this.dad.walk(false);
    const start = this.dad.x;
    const prog = { v: 0 };
    await tween(this, {
      targets: prog, v: 1, duration: 1400,
      onUpdate: () => {
        const v = prog.v;
        const target = start - 350 + Math.sin(v * Math.PI * 2) * 350;
        dx(target - this.dad.x);
      },
    });
    this.dad.idle();
    confetti(this, 640, 250, 80);
    this.hero?.celebrate();
    await wait(this, 800);
  }
}
