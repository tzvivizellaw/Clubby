import { OUT, RIG } from './parts';

export type Expr =
  | 'smile' | 'happy' | 'laugh' | 'shock' | 'sad' | 'cry' | 'angry'
  | 'sleep' | 'dizzy' | 'smug' | 'confused' | 'tongue' | 'determined' | 'shout';

/** Face drawing commands, renderer-agnostic (used by Phaser Graphics and React SVG). */
export type FaceCmd =
  | { k: 'circle'; x: number; y: number; r: number; fill?: string; stroke?: number }
  | { k: 'ellipse'; x: number; y: number; rx: number; ry: number; fill?: string; stroke?: number }
  | { k: 'path'; pts: [number, number][]; stroke: number; fill?: string; close?: boolean; color?: string };

function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 10): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export function faceCmds(expr: Expr, opts: { blink?: boolean; lookX?: number; lookY?: number; glasses?: boolean } = {}): FaceCmd[] {
  const c: FaceCmd[] = [];
  const lx = (opts.lookX ?? 0) * 4;
  const ly = (opts.lookY ?? 0) * 3;
  const eyes = [RIG.eyeL, RIG.eyeR];
  const closed = opts.blink || expr === 'sleep';
  eyes.forEach((e, i) => {
    if (closed) {
      c.push({ k: 'path', pts: arcPts(e.x, e.y, 10, 5, 0, Math.PI), stroke: 4 });
    } else if (expr === 'happy' || expr === 'laugh' || expr === 'smug') {
      c.push({ k: 'path', pts: arcPts(e.x, e.y + 4, 10, 9, Math.PI, Math.PI * 2), stroke: 4 });
    } else if (expr === 'dizzy') {
      c.push({ k: 'path', pts: [[e.x - 8, e.y - 8], [e.x + 8, e.y + 8]], stroke: 4 });
      c.push({ k: 'path', pts: [[e.x + 8, e.y - 8], [e.x - 8, e.y + 8]], stroke: 4 });
    } else {
      const big = expr === 'shock' || expr === 'shout';
      const r = big ? 15 : expr === 'confused' && i === 0 ? 8 : 11;
      c.push({ k: 'circle', x: e.x, y: e.y, r, fill: '#ffffff', stroke: 3 });
      const py = expr === 'sad' || expr === 'cry' ? 3 : 0;
      c.push({ k: 'circle', x: e.x + lx, y: e.y + ly + py, r: big ? 4 : 5.5, fill: OUT });
      c.push({ k: 'circle', x: e.x + lx + 2, y: e.y + ly + py - 2, r: 1.6, fill: '#ffffff' });
    }
    // brows
    const dir = i === 0 ? 1 : -1;
    if (expr === 'angry' || expr === 'determined' || expr === 'shout')
      c.push({ k: 'path', pts: [[e.x - 12 * dir, e.y - 20], [e.x + 10 * dir, e.y - (expr === 'determined' ? 15 : 12)]], stroke: 5 });
    else if (expr === 'sad' || expr === 'cry')
      c.push({ k: 'path', pts: [[e.x - 12 * dir, e.y - 14], [e.x + 10 * dir, e.y - 21]], stroke: 4 });
    else if (expr === 'shock') c.push({ k: 'path', pts: arcPts(e.x, e.y - 22, 10, 5, Math.PI, Math.PI * 2, 6), stroke: 4 });
    else if (expr === 'confused' && i === 1) c.push({ k: 'path', pts: [[e.x - 10, e.y - 24], [e.x + 10, e.y - 18]], stroke: 4 });
    else if (expr === 'smug' && i === 0) c.push({ k: 'path', pts: [[e.x - 10, e.y - 16], [e.x + 10, e.y - 22]], stroke: 4 });
  });
  if (opts.glasses) {
    eyes.forEach((e) => c.push({ k: 'circle', x: e.x, y: e.y, r: 17, stroke: 3.5 }));
    c.push({ k: 'path', pts: [[RIG.eyeL.x + 17, RIG.eyeL.y], [RIG.eyeR.x - 17, RIG.eyeR.y]], stroke: 3.5 });
  }
  const m = RIG.mouth;
  switch (expr) {
    case 'smile':
    case 'smug':
      c.push({ k: 'path', pts: arcPts(m.x + (expr === 'smug' ? 4 : 0), m.y - 6, 14, 9, 0.2, Math.PI - 0.2), stroke: 4 });
      break;
    case 'happy':
    case 'laugh':
      c.push({ k: 'path', pts: [[m.x - 18, m.y - 6], ...arcPts(m.x, m.y - 6, 18, expr === 'laugh' ? 18 : 14, 0, Math.PI).reverse(), [m.x + 18, m.y - 6]], stroke: 4, fill: '#7a1f2b', close: true });
      c.push({ k: 'ellipse', x: m.x, y: m.y + (expr === 'laugh' ? 6 : 3), rx: 8, ry: 4, fill: '#ff7a8a' });
      break;
    case 'shock':
    case 'shout':
      c.push({ k: 'ellipse', x: m.x, y: m.y, rx: expr === 'shout' ? 16 : 10, ry: expr === 'shout' ? 14 : 13, fill: '#7a1f2b', stroke: 4 });
      break;
    case 'sad':
    case 'cry':
      c.push({ k: 'path', pts: arcPts(m.x, m.y + 6, 13, 8, Math.PI + 0.2, Math.PI * 2 - 0.2), stroke: 4 });
      if (expr === 'cry') {
        c.push({ k: 'ellipse', x: RIG.eyeL.x - 4, y: RIG.eyeL.y + 22, rx: 4, ry: 8, fill: '#6ec6ff' });
        c.push({ k: 'ellipse', x: RIG.eyeR.x + 4, y: RIG.eyeR.y + 22, rx: 4, ry: 8, fill: '#6ec6ff' });
      }
      break;
    case 'angry':
    case 'determined':
      c.push({ k: 'path', pts: [[m.x - 12, m.y], [m.x + 12, m.y - 2]], stroke: 5 });
      break;
    case 'sleep':
      c.push({ k: 'ellipse', x: m.x, y: m.y, rx: 5, ry: 4, fill: '#7a1f2b', stroke: 3 });
      break;
    case 'dizzy':
    case 'confused':
      c.push({ k: 'path', pts: [[m.x - 12, m.y], [m.x - 4, m.y - 4], [m.x + 4, m.y + 2], [m.x + 12, m.y - 3]], stroke: 4 });
      break;
    case 'tongue':
      c.push({ k: 'path', pts: arcPts(m.x, m.y - 6, 14, 8, 0.2, Math.PI - 0.2), stroke: 4 });
      c.push({ k: 'ellipse', x: m.x + 4, y: m.y + 6, rx: 8, ry: 10, fill: '#ff6b81', stroke: 3 });
      break;
  }
  return c;
}

export function faceSvg(cmds: FaceCmd[]): string {
  return cmds
    .map((d) => {
      const s = (w?: number) => (w ? `stroke="${OUT}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"` : '');
      if (d.k === 'circle') return `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${d.fill ?? 'none'}" ${s(d.stroke)}/>`;
      if (d.k === 'ellipse') return `<ellipse cx="${d.x}" cy="${d.y}" rx="${d.rx}" ry="${d.ry}" fill="${d.fill ?? 'none'}" ${s(d.stroke)}/>`;
      const pts = d.pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      return d.close
        ? `<polygon points="${pts}" fill="${d.fill ?? 'none'}" ${s(d.stroke)}/>`
        : `<polyline points="${pts}" fill="none" ${s(d.stroke)}/>`;
    })
    .join('');
}
