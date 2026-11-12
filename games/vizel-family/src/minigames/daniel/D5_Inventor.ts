import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, flash, popText, shake, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

// direction bits: N=1 E=2 S=4 W=8
export const N = 1, E = 2, S = 4, Wd = 8;
export const rot = (m: number, r: number) => {
  let x = m;
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) x = ((x << 1) | (x >> 3)) & 15;
  return x;
};
const DIRS: [number, number, number, number][] = [
  [N, 0, -1, S],
  [E, 1, 0, Wd],
  [S, 0, 1, N],
  [Wd, -1, 0, E],
];

export interface Puzzle {
  cols: number;
  rows: number;
  start: number; // row of the inlet (enters from W at col 0)
  end: number; // row of the outlet (exits E at last col)
  base: number[]; // tile base mask (rotation 0)
  path: Set<number>;
  solution: number[]; // required mask per path cell
}

/** Random path from left to right through a grid, turned into straight/corner tiles. */
export function makePuzzle(cols: number, rows: number, rnd: () => number): Puzzle {
  const start = Math.floor(rnd() * rows);
  // random walk that only moves right / up / down without revisiting
  let path: [number, number][] = [];
  for (let attempt = 0; attempt < 200; attempt++) {
    path = [[0, start]];
    const seen = new Set([`0,${start}`]);
    let ok = true;
    while (path[path.length - 1][0] < cols - 1) {
      const [c, r] = path[path.length - 1];
      const opts: [number, number][] = [[c + 1, r]];
      if (r > 0 && !seen.has(`${c},${r - 1}`)) opts.push([c, r - 1]);
      if (r < rows - 1 && !seen.has(`${c},${r + 1}`)) opts.push([c, r + 1]);
      const n = opts[Math.floor(rnd() * opts.length)];
      if (seen.has(`${n[0]},${n[1]}`)) {
        ok = false;
        break;
      }
      seen.add(`${n[0]},${n[1]}`);
      path.push(n);
      if (path.length > cols * rows) {
        ok = false;
        break;
      }
    }
    if (ok && path.length >= cols + 1) break;
  }
  const idx = (c: number, r: number) => r * cols + c;
  const base: number[] = new Array(cols * rows).fill(0);
  const solution: number[] = new Array(cols * rows).fill(0);
  const pset = new Set<number>();
  path.forEach(([c, r], i) => {
    const prev = i === 0 ? [c - 1, r] : path[i - 1];
    const next = i === path.length - 1 ? [c + 1, r] : path[i + 1];
    let m = 0;
    for (const [bit, dx, dy] of DIRS) {
      if (prev[0] === c + dx && prev[1] === r + dy) m |= bit;
      if (next[0] === c + dx && next[1] === r + dy) m |= bit;
    }
    solution[idx(c, r)] = m;
    pset.add(idx(c, r));
  });
  for (let i = 0; i < cols * rows; i++) {
    const m = solution[i] || (rnd() < 0.5 ? N | S : N | E);
    base[i] = m === (N | S) || m === (E | Wd) ? N | S : N | E;
  }
  return { cols, rows, start, end: path[path.length - 1][1], base, path: pset, solution };
}

/** Is there a connected flow from the inlet to the outlet with the given rotations? */
export function flows(p: Puzzle, rots: number[]): boolean {
  const mask = (i: number) => rot(p.base[i], rots[i]);
  let c = 0, r = p.start, from = Wd;
  const seen = new Set<number>();
  for (let steps = 0; steps < p.cols * p.rows + 2; steps++) {
    const i = r * p.cols + c;
    const m = mask(i);
    if (!(m & from) || seen.has(i)) return false;
    seen.add(i);
    const out = m & ~from;
    const d = DIRS.find(([bit]) => bit === out);
    if (!d) return false;
    const nc = c + d[1], nr = r + d[2];
    if (nc === p.cols && nr === p.end && out === E) return true;
    if (nc < 0 || nr < 0 || nc >= p.cols || nr >= p.rows) return false;
    c = nc;
    r = nr;
    from = d[3];
  }
  return false;
}

/** D5 — rotate pipe tiles to connect the boiler to dad's cup. The machine makes soup. */
export default class D5_Inventor extends BaseMiniGame {
  pz!: Puzzle;
  rots: number[] = [];
  tiles: Phaser.GameObjects.Container[] = [];
  size = 110;
  ox = 0;
  oy = 0;
  solvedFlag = false;
  dad!: CharacterRig;

  setup() {
    const cols = this.isEasy ? 4 : this.diff.tier === 'hard' ? 6 : 5;
    const rows = this.isEasy ? 3 : 4;
    this.pz = makePuzzle(cols, rows, Math.random);
    this.size = Math.min(110, 760 / cols);
    this.ox = 640 - (cols * this.size) / 2 + this.size / 2;
    this.oy = 410 - (rows * this.size) / 2 + this.size / 2;
    this.solvedFlag = false;
    // randomise rotations, making sure it doesn't start solved
    do {
      this.rots = this.pz.base.map(() => Phaser.Math.Between(0, 3));
    } while (flows(this.pz, this.rots));
    const board = this.add.graphics().setDepth(3);
    board.fillStyle(0x2b1d3a, 0.25).fillRoundedRect(this.ox - this.size / 2 - 10, this.oy - this.size / 2 - 10, cols * this.size + 20, rows * this.size + 20, 16);
    this.tiles = this.pz.base.map((m, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const g = this.add.graphics();
      const s = this.size;
      g.fillStyle(0xdee2e6).fillRoundedRect(-s / 2 + 3, -s / 2 + 3, s - 6, s - 6, 10).lineStyle(3, 0x2b1d3a).strokeRoundedRect(-s / 2 + 3, -s / 2 + 3, s - 6, s - 6, 10);
      g.lineStyle(s * 0.22, 0x8d99ae);
      for (const [bit, dx, dy] of DIRS) if (m & bit) g.lineBetween(0, 0, (dx * s) / 2, (dy * s) / 2);
      g.fillStyle(0x8d99ae).fillCircle(0, 0, s * 0.11);
      const bolt = this.add.circle(-s / 2 + 14, -s / 2 + 14, 4, 0x495057);
      const cont = this.add.container(this.ox + c * s, this.oy + r * s, [g, bolt]).setDepth(5).setSize(s, s);
      cont.setAngle(this.rots[i] * 90);
      cont.setInteractive(new Phaser.Geom.Rectangle(-s / 2, -s / 2, s, s), Phaser.Geom.Rectangle.Contains);
      cont.on('pointerdown', () => this.turn(i));
      return cont;
    });
    // boiler & cup
    const boiler = new Living(this, this.ox - this.size - 40, this.oy + this.pz.start * this.size, 'soup', { scale: 0.9 }).setDepth(6);
    void boiler;
    this.add.rectangle(this.ox - this.size / 2 - 30, this.oy + this.pz.start * this.size, 60, this.size * 0.22, 0x8d99ae).setDepth(4);
    this.add.rectangle(this.ox + (cols - 0.5) * this.size + 30, this.oy + this.pz.end * this.size, 60, this.size * 0.22, 0x8d99ae).setDepth(4);
    this.add.image(this.ox + cols * this.size + 50, this.oy + this.pz.end * this.size, 'coffee').setDepth(6).setScale(1.1);
    this.dad = new CharacterRig(this, 1170, 700, 'father', 0.55).setDepth(4).face2(-1);
    this.addHero(110, 700, 0.55);
    this.setTimer(this.t(this.isEasy ? 55 : 45));
  }

  turn(i: number) {
    if (!this.playing || this.solvedFlag) return;
    this.rots[i] = (this.rots[i] + 1) % 4;
    Audio.sfx('click');
    this.tweens.add({ targets: this.tiles[i], angle: this.tiles[i].angle + 90, duration: 120 });
    if (flows(this.pz, this.rots)) {
      this.solvedFlag = true;
      this.time.delayedCall(200, () => this.win());
    }
  }

  hint() {
    const wrong = [...this.pz.path].find((i) => rot(this.pz.base[i], this.rots[i]) !== this.pz.solution[i]);
    if (wrong != null) sparkle(this, this.tiles[wrong].x, this.tiles[wrong].y, 8);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.2;
    const wrong = [...this.pz.path].find((i) => rot(this.pz.base[i], this.rots[i]) !== this.pz.solution[i]);
    if (wrong != null) this.turn(wrong);
  }

  async winAnim() {
    Audio.sfx('drumroll');
    for (const i of this.pz.path) {
      this.tiles[i].list.forEach((o: any) => o.setTint?.(0xff7b54));
      const blob = this.add.circle(this.tiles[i].x, this.tiles[i].y, this.size * 0.14, 0xff7b54).setDepth(7);
      this.tweens.add({ targets: blob, scale: 1.4, duration: 150, yoyo: true });
      await wait(this, 60);
    }
    const soup = this.add.image(this.ox + this.pz.cols * this.size + 50, this.oy + this.pz.end * this.size - 20, 'soup').setDepth(8).setScale(0);
    await tween(this, { targets: soup, scale: 1, duration: 300, ease: 'Back.easeOut' });
    popText(this, 900, 200, 'מרק?!', '#ff7b54', 56);
    this.dad.shock();
    confetti(this, 640, 300, 40);
    this.hero?.celebrate();
    await wait(this, 900);
  }

  async loseAnim() {
    flash(this, 0xffffff);
    shake(this, 0.03, 600);
    Audio.sfx('crash');
    this.tiles.forEach((t) => this.tweens.add({ targets: t, x: t.x + this.rnd(-300, 300), y: t.y + this.rnd(-300, 300), angle: this.rnd(-720, 720), alpha: 0, duration: 700 }));
    this.hero?.setExpr('shock');
    if (this.hero) this.hero.face.setAlpha(1);
    const soot = this.add.circle(this.hero?.x ?? 110, (this.hero?.y ?? 700) - 140, 60, 0x2b1d3a, 0.4).setDepth(50);
    void soot;
    await wait(this, 1400);
  }
}
