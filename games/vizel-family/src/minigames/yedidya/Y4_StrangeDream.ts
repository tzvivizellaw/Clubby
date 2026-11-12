import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

type Shape = 'star' | 'circle' | 'triangle' | 'square' | 'moon';
const SHAPES: Shape[] = ['star', 'circle', 'triangle', 'square', 'moon'];
const COLS = [0xff595e, 0x1982c4, 0x8ac926, 0xffca3a, 0x9b5de5];
const PRIZES = ['rainbow', 'lollipop', 'teddy', 'cake', 'trophy'];

export function drawShape(g: Phaser.GameObjects.Graphics, s: Shape, x: number, y: number, r: number, fill: number) {
  g.fillStyle(fill);
  g.lineStyle(4, 0x2b1d3a);
  if (s === 'circle') g.fillCircle(x, y, r).strokeCircle(x, y, r);
  if (s === 'square') g.fillRect(x - r, y - r, r * 2, r * 2).strokeRect(x - r, y - r, r * 2, r * 2);
  if (s === 'triangle') {
    const pts = [new Phaser.Math.Vector2(x, y - r), new Phaser.Math.Vector2(x + r, y + r * 0.8), new Phaser.Math.Vector2(x - r, y + r * 0.8)];
    g.fillPoints(pts, true).strokePoints(pts, true);
  }
  if (s === 'star') {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
    }
    g.fillPoints(pts, true).strokePoints(pts, true);
  }
  if (s === 'moon') {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = -Math.PI / 2 + (i / 20) * Math.PI * 1.0 + Math.PI;
      pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * r, y + Math.sin(a) * r));
    }
    for (let i = 20; i >= 0; i--) {
      const a = -Math.PI / 2 + (i / 20) * Math.PI + Math.PI;
      pts.push(new Phaser.Math.Vector2(x + r * 0.35 + Math.cos(a) * r * 0.55, y + Math.sin(a) * r));
    }
    g.fillPoints(pts, true).strokePoints(pts, true);
  }
}

interface Door {
  c: Phaser.GameObjects.Container;
  shape: Shape;
  color: number;
}

/** Y4 — dream doors: pick the door whose sign matches the clue (later: only the silhouette). */
export default class Y4_StrangeDream extends BaseMiniGame {
  doors: Door[] = [];
  answer = 0;
  clue?: Phaser.GameObjects.Container;
  locked = true;
  round = 0;
  yed!: CharacterRig;

  setup() {
    this.round = 0;
    this.yed = new CharacterRig(this, 120, 710, 'yedidya', 0.55).setDepth(30);
    this.setGoal(this.n(4, 3), 'door');
    this.setTimer(this.t(28));
    this.useMistakes();
  }

  onStart() {
    this.newRound();
  }

  newRound() {
    this.doors.forEach((d) => d.c.destroy());
    this.clue?.destroy();
    this.doors = [];
    const n = this.diff.choices;
    const shapes = Phaser.Utils.Array.Shuffle([...SHAPES]).slice(0, n);
    const cols = Phaser.Utils.Array.Shuffle([...COLS]);
    const silhouette = this.round >= 2;
    this.answer = this.rnd(0, n - 1);
    const gap = 900 / n;
    shapes.forEach((sh, i) => {
      const x = 240 + gap / 2 + i * gap;
      const img = this.add.image(0, 0, 'door').setScale(0.95 * this.diff.size);
      const g = this.add.graphics();
      drawShape(g, sh, 0, -40, 34, silhouette ? cols[(i + 1) % n] : cols[i]);
      const c = this.add.container(x, 460, [img, g]).setDepth(10).setSize(140, 230);
      c.setInteractive(new Phaser.Geom.Rectangle(-70, -115, 140, 230), Phaser.Geom.Rectangle.Contains);
      c.on('pointerdown', () => this.choose(i));
      this.doors.push({ c, shape: sh, color: silhouette ? cols[(i + 1) % n] : cols[i] });
    });
    const t = this.doors[this.answer];
    const cg = this.add.graphics();
    cg.fillStyle(0xfff6e0).fillRoundedRect(-110, -70, 220, 140, 20).lineStyle(5, 0x2b1d3a).strokeRoundedRect(-110, -70, 220, 140, 20);
    drawShape(cg, t.shape, 0, -5, 40, silhouette ? 0x2b1d3a : t.color);
    const lbl = this.add.text(0, 54, silhouette ? 'אותה צורה!' : 'אותו ציור!', TXT(20, '#2b1d3a', 0)).setOrigin(0.5);
    this.clue = this.add.container(640, 175, [cg, lbl]).setDepth(20);
    this.locked = false;
  }

  async choose(i: number) {
    if (!this.playing || this.locked) return;
    const d = this.doors[i];
    this.locked = true;
    // the door opens
    await tween(this, { targets: d.c.list[0], scaleX: 0.15, duration: 200 });
    if (i === this.answer) {
      const p = this.add.image(d.c.x, d.c.y, this.pick(PRIZES)).setDepth(9).setScale(0);
      this.tweens.add({ targets: p, scale: 0.8, duration: 300, ease: 'Back.easeOut' });
      Audio.sfx('ding');
      this.good(d.c.x, d.c.y - 160, 'מצאת!');
      this.round++;
      this.addProgress(1);
      await wait(this, 700);
      p.destroy();
      if (!this.ended) this.newRound();
    } else {
      // gag: an elephant trying to squeeze into an elevator
      const lift = this.add.image(d.c.x, d.c.y, 'elevator').setDepth(9).setScale(0.6);
      const el = this.add.image(d.c.x + 60, d.c.y + 20, 'elephant').setDepth(9).setScale(1.1);
      this.tweens.add({ targets: el, x: d.c.x, scaleX: 0.8, duration: 250, yoyo: true, repeat: 1 });
      Audio.sfx('trumpet');
      this.mistake(d.c.x, d.c.y - 160, 'פיל במעלית?!');
      await wait(this, 900);
      lift.destroy();
      el.destroy();
      this.tweens.add({ targets: d.c.list[0], scaleX: 0.95 * this.diff.size, duration: 200 });
      this.locked = false;
    }
  }

  hint() {
    const d = this.doors[this.answer];
    if (d) sparkle(this, d.c.x, d.c.y - 40, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0 || this.locked) return;
    this.botTimer = 0.5;
    this.choose(this.answer);
  }

  async winAnim() {
    const r = this.add.image(640, 380, 'rainbow').setDepth(40).setScale(0);
    await tween(this, { targets: r, scale: 3, duration: 500, ease: 'Back.easeOut' });
    confetti(this, 640, 300, 60);
    this.yed.celebrate();
    await wait(this, 1100);
  }

  async loseAnim() {
    const el = this.add.image(640, 460, 'elephant').setDepth(40).setScale(2);
    const lift = this.add.image(640, 440, 'elevator').setDepth(39).setScale(1.2);
    void lift;
    await tween(this, { targets: el, scaleX: 1.2, scaleY: 2.4, duration: 400, yoyo: true, repeat: 1 });
    Audio.sfx('trumpet');
    this.yed.setExpr('confused');
    await wait(this, 600);
  }
}
