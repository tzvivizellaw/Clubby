import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, shake, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

// walls bits per cell: N=1 E=2 S=4 W=8 (set = wall present)
const DIR: Record<string, { bit: number; dx: number; dy: number; opp: number }> = {
  up: { bit: 1, dx: 0, dy: -1, opp: 4 },
  right: { bit: 2, dx: 1, dy: 0, opp: 8 },
  down: { bit: 4, dx: 0, dy: 1, opp: 1 },
  left: { bit: 8, dx: -1, dy: 0, opp: 2 },
};
type Dir = keyof typeof DIR;

export function makeMaze(cols: number, rows: number, rnd: () => number): number[] {
  const walls = new Array(cols * rows).fill(15);
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const c = cur % cols, r = Math.floor(cur / cols);
    const opts = (Object.keys(DIR) as Dir[]).filter((d) => {
      const nc = c + DIR[d].dx, nr = r + DIR[d].dy;
      return nc >= 0 && nr >= 0 && nc < cols && nr < rows && !seen.has(nr * cols + nc);
    });
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const d = opts[Math.floor(rnd() * opts.length)];
    const n = (r + DIR[d].dy) * cols + c + DIR[d].dx;
    walls[cur] &= ~DIR[d].bit;
    walls[n] &= ~DIR[d].opp;
    seen.add(n);
    stack.push(n);
  }
  // a few extra openings make loops (so vacuums can be avoided)
  for (let k = 0; k < Math.floor(cols * rows * 0.12); k++) {
    const i = Math.floor(rnd() * cols * rows);
    const c = i % cols;
    if (c < cols - 1) {
      walls[i] &= ~2;
      walls[i + 1] &= ~8;
    }
  }
  return walls;
}

export function bfs(walls: number[], cols: number, rows: number, from: number, to: number, blocked = new Set<number>()): number[] | null {
  const prev = new Map<number, number>([[from, -1]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    const c = cur % cols, r = Math.floor(cur / cols);
    for (const d of Object.values(DIR)) {
      if (walls[cur] & d.bit) continue;
      const n = (r + d.dy) * cols + c + d.dx;
      if (prev.has(n) || (blocked.has(n) && n !== to)) continue;
      prev.set(n, cur);
      q.push(n);
    }
  }
  if (!prev.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return path;
}

interface Vac {
  o: Living;
  cells: number[];
  i: number;
  dir: number;
  t: number;
}

/** D6 — guide the runaway ball through a maze to the hoop; vacuums patrol; the ball sometimes rebels. */
export default class D6_RunawayBall extends BaseMiniGame {
  cols = 9;
  rows = 5;
  cs = 100;
  ox = 0;
  oy = 0;
  walls: number[] = [];
  ball!: Living;
  cell = 0;
  goalCell = 0;
  dir: Dir | null = null;
  want: Dir | null = null;
  moving = false;
  vacs: Vac[] = [];
  rebelT = 8;
  rebel = 0;
  hitCool = 0;

  setup() {
    this.cols = this.isEasy ? 7 : this.diff.tier === 'hard' ? 10 : 9;
    this.rows = this.isEasy ? 4 : 5;
    this.cs = Math.min(110, 1080 / this.cols, 520 / this.rows);
    this.ox = 640 - (this.cols * this.cs) / 2;
    this.oy = 175;
    this.walls = makeMaze(this.cols, this.rows, Math.random);
    this.cell = 0;
    this.goalCell = this.cols * this.rows - 1;
    this.dir = null;
    this.want = null;
    this.moving = false;
    this.vacs = [];
    this.rebel = 0;
    this.rebelT = 8;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xfff6e0, 0.9).fillRect(this.ox, this.oy, this.cols * this.cs, this.rows * this.cs);
    g.lineStyle(8, 0x6d4c41);
    this.walls.forEach((w, i) => {
      const x = this.ox + (i % this.cols) * this.cs, y = this.oy + Math.floor(i / this.cols) * this.cs;
      if (w & 1) g.lineBetween(x, y, x + this.cs, y);
      if (w & 2) g.lineBetween(x + this.cs, y, x + this.cs, y + this.cs);
      if (w & 4) g.lineBetween(x, y + this.cs, x + this.cs, y + this.cs);
      if (w & 8) g.lineBetween(x, y, x, y + this.cs);
    });
    const gp = this.center(this.goalCell);
    this.add.image(gp.x, gp.y, 'hoop').setScale((this.cs / 170) * 0.95).setDepth(4);
    const sp = this.center(0);
    this.ball = new Living(this, sp.x, sp.y, 'basketball', { scale: (this.cs / 66) * 0.6 }).setDepth(20);
    // patrolling vacuums on straight corridors
    const nv = this.isEasy ? 1 : this.diff.tier === 'hard' ? 3 : 2;
    for (let k = 0; k < nv; k++) {
      const route = this.corridor();
      if (!route) continue;
      const p = this.center(route[0]);
      const o = new Living(this, p.x, p.y, 'vacuum', { scale: (this.cs / 116) * 0.7, mood: 'angry' }).setDepth(15);
      this.vacs.push({ o, cells: route, i: 0, dir: 1, t: 0 });
    }
    this.setTimer(this.t(this.isEasy ? 55 : 48));
    this.useMistakes();
    // input: arrows, swipe, or tap relative to the ball
    const k = this.input.keyboard;
    k?.on('keydown-UP', () => this.steer('up'));
    k?.on('keydown-DOWN', () => this.steer('down'));
    k?.on('keydown-LEFT', () => this.steer('left'));
    k?.on('keydown-RIGHT', () => this.steer('right'));
    let sx = 0, sy = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => ((sx = p.x), (sy = p.y)));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      let dx = p.x - sx, dy = p.y - sy;
      if (Math.hypot(dx, dy) < 20) {
        dx = p.x - this.ball.x;
        dy = p.y - this.ball.y;
      }
      this.steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    });
  }

  corridor(): number[] | null {
    for (let tries = 0; tries < 60; tries++) {
      const start = this.rnd(this.cols, this.cols * this.rows - this.cols - 1);
      if (start === 0 || start === this.goalCell) continue;
      const route = [start];
      let cur = start;
      const d = this.pick(Object.values(DIR));
      while (route.length < 4 && !(this.walls[cur] & d.bit)) {
        cur = cur + d.dy * this.cols + d.dx;
        route.push(cur);
      }
      if (route.length >= 3 && !route.includes(0) && !route.includes(this.goalCell)) return route;
    }
    return null;
  }

  center(i: number) {
    return { x: this.ox + ((i % this.cols) + 0.5) * this.cs, y: this.oy + (Math.floor(i / this.cols) + 0.5) * this.cs };
  }

  open(i: number, d: Dir) {
    return !(this.walls[i] & DIR[d].bit);
  }

  steer(d: Dir) {
    if (!this.playing) return;
    this.want = d;
    if (!this.moving) this.step();
  }

  step() {
    if (!this.playing) return;
    let d: Dir | null = null;
    if (this.rebel > 0) {
      const opts = (Object.keys(DIR) as Dir[]).filter((k) => this.open(this.cell, k));
      d = this.pick(opts);
      this.rebel--;
    } else if (this.want && this.open(this.cell, this.want)) d = this.want;
    else if (this.dir && this.open(this.cell, this.dir)) d = this.dir;
    if (!d) {
      this.dir = null;
      this.moving = false;
      return;
    }
    this.dir = d;
    const next = this.cell + DIR[d].dy * this.cols + DIR[d].dx;
    const p = this.center(next);
    this.moving = true;
    this.ball.look(DIR[d].dx, DIR[d].dy);
    this.tweens.add({
      targets: this.ball, x: p.x, y: p.y, angle: this.ball.angle + (DIR[d].dx || DIR[d].dy) * 90,
      duration: 230 / this.diff.speed,
      onComplete: () => {
        this.cell = next;
        if (this.cell === this.goalCell) return void this.win();
        this.step();
      },
    });
  }

  tick(dt: number) {
    this.hitCool -= dt;
    for (const v of this.vacs) {
      v.t += dt * this.diff.speed;
      if (v.t >= 0.8) {
        v.t = 0;
        if (v.i + v.dir < 0 || v.i + v.dir >= v.cells.length) v.dir *= -1;
        v.i += v.dir;
        const p = this.center(v.cells[v.i]);
        this.tweens.add({ targets: v.o, x: p.x, y: p.y, duration: 700 / this.diff.speed });
      }
      if (this.hitCool <= 0 && Phaser.Math.Distance.Between(v.o.x, v.o.y, this.ball.x, this.ball.y) < this.cs * 0.45) {
        this.hitCool = 1.5;
        this.tweens.killTweensOf(this.ball);
        shake(this, 0.01, 200);
        this.ball.setMood('shock', 800);
        this.mistake(this.ball.x, this.ball.y - 40, 'שאב אותי!');
        // back to start
        this.cell = 0;
        this.dir = null;
        this.want = null;
        this.moving = false;
        const sp = this.center(0);
        this.tweens.add({ targets: this.ball, x: sp.x, y: sp.y, duration: 300 });
      }
    }
    // the ball rebels now and then
    if (!this.isEasy) {
      this.rebelT -= dt;
      if (this.rebelT <= 0) {
        this.rebelT = this.rnd(8, 12);
        popText(this, this.ball.x, this.ball.y - 50, '!', '#ff595e', 48);
        this.ball.setMood('smug', 1500);
        Audio.sfx('laugh');
        this.time.delayedCall(600, () => {
          this.rebel = 2;
          if (!this.moving) this.step();
        });
      }
    }
  }

  hint() {
    const path = bfs(this.walls, this.cols, this.rows, this.cell, this.goalCell);
    path?.slice(1, 5).forEach((c) => {
      const p = this.center(c);
      sparkle(this, p.x, p.y, 3);
    });
  }

  /** cells a vacuum occupies now or will move into next */
  vacCells() {
    const d = new Set<number>();
    for (const v of this.vacs) {
      d.add(v.cells[v.i]);
      const ni = v.i + v.dir < 0 || v.i + v.dir >= v.cells.length ? v.i - v.dir : v.i + v.dir;
      d.add(v.cells[ni]);
      // the cell it is currently gliding from/to (by position)
      const c = Math.floor((v.o.x - this.ox) / this.cs) + Math.floor((v.o.y - this.oy) / this.cs) * this.cols;
      d.add(c);
    }
    return d;
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0 || this.moving) return;
    this.botTimer = 0.05;
    const routes = new Set<number>();
    for (const v of this.vacs) for (const c of v.cells) routes.add(c);
    const now = this.vacCells();
    const path = bfs(this.walls, this.cols, this.rows, this.cell, this.goalCell, routes) ?? bfs(this.walls, this.cols, this.rows, this.cell, this.goalCell);
    if (!path || path.length < 2) return;
    let next = path[1];
    if (now.has(next) || (routes.has(next) && this.vacs.some((v) => v.cells.includes(next) && Math.abs(v.cells.indexOf(next) - v.i) <= 1))) {
      // unsafe: if we're standing in danger, retreat to any safe neighbour, else wait
      if (!now.has(this.cell)) return;
      const safe = (Object.keys(DIR) as Dir[]).map((k) => ({ k, n: this.cell + DIR[k].dy * this.cols + DIR[k].dx })).find((o) => this.open(this.cell, o.k) && !now.has(o.n));
      if (!safe) return;
      next = safe.n;
    }
    const d = (Object.keys(DIR) as Dir[]).find((k) => this.cell + DIR[k].dy * this.cols + DIR[k].dx === next && this.open(this.cell, k));
    if (d) {
      this.want = d;
      this.dir = null;
      this.step();
      this.want = null;
      this.dir = null;
    }
  }

  async winAnim() {
    confetti(this, this.ball.x, this.ball.y, 50);
    Audio.sfx('ding');
    this.ball.setMood('sleep');
    await tween(this, { targets: this.ball, y: this.ball.y - 60, duration: 250, yoyo: true });
    await wait(this, 1100);
  }

  async loseAnim() {
    this.ball.setMood('tongue');
    this.tweens.killTweensOf(this.ball);
    await tween(this, { targets: this.ball, x: 1400, y: 650, angle: 1080, duration: 1200 });
  }
}
