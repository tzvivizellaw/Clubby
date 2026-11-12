import type { CastId } from '../data/characters';
import { faceCmds, faceSvg, type Expr } from './face';
import { LOOKS, PART_SIZE, RIG, armMarkup, bodyMarkup, capeMarkup, headMarkup, legMarkup } from './parts';

export interface StaticPose {
  expr?: Expr;
  armL?: number; // degrees, positive = outward
  armR?: number;
  relative?: boolean; // apply per-character scale (family photo)
  prop?: string; // inner svg markup drawn at right hand
}

/** Assemble a full-body static SVG for React screens (each part wrapped for CSS animation). */
export function characterSvg(id: CastId, pose: StaticPose = {}): string {
  const L = LOOKS[id];
  const s = pose.relative ? L.scale : 1;
  const hs = L.headScale;
  const face = faceSvg(faceCmds(pose.expr ?? 'smile', { glasses: L.glasses }));
  const aL = pose.armL ?? 8;
  const aR = -(pose.armR ?? 8);
  const bodyH = L.skirt ? PART_SIZE.bodySkirt.h : PART_SIZE.bodyPants.h;
  const g = (cls: string, tr: string, inner: string) => `<g transform="${tr}"><g class="p-${cls}">${inner}</g></g>`;
  const parts = [
    L.cape ? g('cape', `translate(0,-150) translate(-65,0)`, capeMarkup(id)) : '',
    g('leg-l', `translate(${-RIG.legX},${RIG.legY}) translate(-17,0)`, legMarkup(id)),
    g('leg-r', `translate(${RIG.legX},${RIG.legY}) translate(-17,0)`, legMarkup(id)),
    g('body', `translate(0,${RIG.bodyTop}) translate(-60,0)`, bodyMarkup(id)),
    g('arm-l', `translate(${-RIG.armX},${RIG.armY}) rotate(${aL}) translate(-15,-5)`, armMarkup(id)),
    g('arm-r', `translate(${RIG.armX},${RIG.armY}) rotate(${aR}) translate(-15,-5)`, armMarkup(id) + (pose.prop ? `<g transform="translate(0,70)">${pose.prop}</g>` : '')),
    g('head', `translate(0,${RIG.neckY}) scale(${hs}) translate(${-RIG.headAnchor.x},${-RIG.headAnchor.y})`, headMarkup(id) + `<g class="p-face">${face}</g>`),
  ].join('');
  void bodyH;
  const top = -150 - 150 * 1.4;
  const H = 12 - top;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 ${top} 200 ${H}" class="char char-${id}"><g transform="translate(0,0) scale(${s})" style="transform-origin:0 0">${parts}</g></svg>`;
}
