import type { CastId } from '../data/characters';

/** Original character designs, drawn as separate SVG parts so every limb can be animated. */
export const OUT = '#2b1d3a';
const SW = 4;

export interface Look {
  skin: string;
  hair: string;
  top: string;
  accent: string;
  bottom: string;
  shoe: string;
  legs: string;
  skirt: boolean;
  kippa?: string;
  glasses?: boolean;
  beard?: boolean;
  cape?: string;
  scale: number;
  headScale: number;
}

export const LOOKS: Record<CastId, Look> = {
  father: { skin: '#f2c49b', hair: '#3b2a20', top: '#fdfdfd', accent: '#2f5fa7', bottom: '#2b2b3a', shoe: '#1d1d24', legs: '#2b2b3a', skirt: false, kippa: '#1d1d24', glasses: true, beard: true, scale: 1, headScale: 1 },
  mother: { skin: '#f5cfaa', hair: '#8e3b8f', top: '#3fa3a0', accent: '#f6d365', bottom: '#2d3f73', shoe: '#4a2c2a', legs: '#3b3346', skirt: true, scale: 0.96, headScale: 1 },
  avigail: { skin: '#f6d0ae', hair: '#6b3f22', top: '#ff7b54', accent: '#ffe66d', bottom: '#3a4a8c', shoe: '#7a3b2e', legs: '#e8e3f0', skirt: true, scale: 0.8, headScale: 1.12 },
  daniel: { skin: '#f0c095', hair: '#4a2e1c', top: '#f39c12', accent: '#ffffff', bottom: '#27365e', shoe: '#e74c3c', legs: '#27365e', skirt: false, kippa: '#1d1d24', scale: 0.78, headScale: 1.12 },
  yedidya: { skin: '#f7d4b4', hair: '#a8743f', top: '#3f7fe8', accent: '#ffd23f', bottom: '#27365e', shoe: '#2ecc71', legs: '#27365e', skirt: false, kippa: '#1d1d24', cape: '#e63946', scale: 0.64, headScale: 1.25 },
  esti: { skin: '#f9dcc0', hair: '#b07432', top: '#ffcf3f', accent: '#ff8fb1', bottom: '#ffcf3f', shoe: '#ff6b9a', legs: '#fff3f7', skirt: true, scale: 0.54, headScale: 1.38 },
};

export const PART_SIZE = {
  head: { w: 140, h: 150 },
  arm: { w: 30, h: 84 },
  leg: { w: 34, h: 72 },
  bodyPants: { w: 120, h: 100 },
  bodySkirt: { w: 120, h: 140 },
  cape: { w: 130, h: 140 },
};

const st = `stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"`;

function darker(hex: string, k = 0.82) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function headMarkup(id: CastId): string {
  const L = LOOKS[id];
  const back: string[] = [];
  const front: string[] = [];
  switch (id) {
    case 'father':
      front.push(`<path d="M20,74 Q20,22 70,20 Q120,22 120,74 Q104,46 70,44 Q36,46 20,74Z" fill="${L.hair}" ${st}/>`);
      front.push(`<ellipse cx="70" cy="26" rx="30" ry="11" fill="${L.kippa}" ${st}/>`);
      break;
    case 'mother':
      back.push(`<ellipse cx="122" cy="70" rx="16" ry="22" fill="${darker(L.hair)}" ${st}/>`);
      back.push(`<path d="M112,74 Q138,104 128,128 Q118,110 108,92Z" fill="${darker(L.hair)}" ${st}/>`);
      front.push(`<path d="M12,96 Q6,16 70,14 Q134,16 128,96 Q120,50 70,46 Q20,50 12,96Z" fill="${L.hair}" ${st}/>`);
      front.push(`<path d="M18,60 Q70,30 122,60" fill="none" stroke="${L.accent}" stroke-width="7"/>`);
      front.push(`<circle cx="44" cy="30" r="4" fill="${L.accent}"/><circle cx="70" cy="24" r="4" fill="${L.accent}"/><circle cx="96" cy="30" r="4" fill="${L.accent}"/>`);
      break;
    case 'avigail':
      back.push(`<ellipse cx="70" cy="80" rx="62" ry="62" fill="${L.hair}" ${st}/>`);
      back.push(`<path d="M118,50 Q148,70 138,120 Q126,104 116,80Z" fill="${L.hair}" ${st}/>`);
      front.push(`<path d="M18,78 Q18,24 70,22 Q122,24 122,78 Q104,48 84,56 Q72,44 58,56 Q36,48 18,78Z" fill="${L.hair}" ${st}/>`);
      front.push(`<path d="M22,58 Q70,14 118,58" fill="none" stroke="${L.top}" stroke-width="8" stroke-linecap="round"/>`);
      break;
    case 'daniel':
      front.push(`<path d="M18,76 L22,40 L34,48 L40,24 L54,38 L64,16 L76,36 L90,20 L96,42 L110,30 L114,54 L122,76 Q100,52 70,50 Q40,52 18,76Z" fill="${L.hair}" ${st}/>`);
      front.push(`<ellipse cx="74" cy="26" rx="26" ry="10" fill="${L.kippa}" ${st}/>`);
      break;
    case 'yedidya':
      front.push(`<path d="M18,80 Q16,26 70,22 Q124,26 122,80 Q110,50 92,58 Q80,40 66,56 Q48,44 30,60Z" fill="${L.hair}" ${st}/>`);
      front.push(`<ellipse cx="70" cy="26" rx="26" ry="10" fill="${L.kippa}" ${st}/>`);
      front.push(`<path d="M20,92 q-8,8 0,14 q8,6 0,14" fill="none" stroke="${L.hair}" stroke-width="6" stroke-linecap="round"/>`);
      front.push(`<path d="M120,92 q8,8 0,14 q-8,6 0,14" fill="none" stroke="${L.hair}" stroke-width="6" stroke-linecap="round"/>`);
      break;
    case 'esti':
      back.push(`<circle cx="14" cy="56" r="20" fill="${L.hair}" ${st}/><circle cx="126" cy="56" r="20" fill="${L.hair}" ${st}/>`);
      front.push(`<path d="M20,78 Q20,26 70,24 Q120,26 120,78 Q98,52 70,58 Q42,52 20,78Z" fill="${L.hair}" ${st}/>`);
      front.push(`<path d="M2,36 L18,44 L2,52Z M34,36 L18,44 L34,52Z" fill="${L.accent}" ${st}/><circle cx="18" cy="44" r="5" fill="${L.accent}" ${st}/>`);
      front.push(`<path d="M106,36 L122,44 L106,52Z M138,36 L122,44 L138,52Z" fill="${L.accent}" ${st}/><circle cx="122" cy="44" r="5" fill="${L.accent}" ${st}/>`);
      break;
  }
  const ears = `<circle cx="18" cy="88" r="11" fill="${L.skin}" ${st}/><circle cx="122" cy="88" r="11" fill="${L.skin}" ${st}/>`;
  const face = `<ellipse cx="70" cy="86" rx="52" ry="56" fill="${L.skin}" ${st}/>`;
  const beard = L.beard
    ? `<path d="M20,92 Q22,142 70,146 Q118,142 120,92 Q110,124 70,126 Q30,124 20,92Z" fill="${L.hair}" ${st}/>`
    : '';
  const nose = `<ellipse cx="70" cy="98" rx="7" ry="5" fill="${darker(L.skin, 0.88)}"/>`;
  const cheeks = `<ellipse cx="40" cy="106" rx="9" ry="6" fill="#ff8a8a" opacity="0.45"/><ellipse cx="100" cy="106" rx="9" ry="6" fill="#ff8a8a" opacity="0.45"/>`;
  return back.join('') + ears + face + beard + nose + cheeks + front.join('');
}

export function bodyMarkup(id: CastId): string {
  const L = LOOKS[id];
  const H = L.skirt ? 140 : 100;
  const torso = `<path d="M16,22 Q18,6 40,4 L80,4 Q102,6 104,22 L108,92 L12,92Z" fill="${L.top}" ${st}/>`;
  const parts: string[] = [];
  if (!L.skirt) parts.push(`<path d="M14,84 L106,84 L108,${H - 2} L12,${H - 2}Z" fill="${L.bottom}" ${st}/>`);
  parts.push(torso);
  switch (id) {
    case 'father':
      parts.push(`<path d="M40,6 L60,30 L80,6" fill="#fff" ${st}/>`);
      parts.push(`<path d="M60,22 L52,34 L60,74 L68,34Z" fill="${L.accent}" ${st}/>`);
      parts.push(`<path d="M16,22 Q18,8 38,6 L46,92 L12,92Z" fill="#30323d" ${st}/><path d="M104,22 Q102,8 82,6 L74,92 L108,92Z" fill="#30323d" ${st}/>`);
      parts.push(`<rect x="12" y="84" width="96" height="10" fill="#1d1d24" ${st}/>`);
      parts.push(`<path d="M36,92 l-3,8 M44,92 l-1,8 M76,92 l1,8 M84,92 l3,8" stroke="#fff" stroke-width="2.5"/>`);
      break;
    case 'mother':
      parts.push(`<path d="M42,6 Q60,24 78,6" fill="none" ${st}/>`);
      parts.push(`<circle cx="60" cy="40" r="4" fill="${L.accent}"/><circle cx="60" cy="58" r="4" fill="${L.accent}"/>`);
      break;
    case 'avigail':
      parts.push(`<path d="M40,6 L60,22 L80,6 L76,0 L44,0Z" fill="#fff" ${st}/>`);
      parts.push(`<rect x="36" y="34" width="48" height="10" rx="3" fill="${L.accent}" ${st}/>`);
      break;
    case 'daniel':
      parts.push(`<path d="M34,4 Q60,24 86,4" fill="${L.accent}" ${st}/>`);
      parts.push(`<text x="60" y="68" font-family="Arial Black, Arial" font-weight="900" font-size="34" text-anchor="middle" fill="${L.accent}" stroke="${OUT}" stroke-width="2">9</text>`);
      break;
    case 'yedidya':
      parts.push(`<path d="M60,24 L66,38 L82,38 L69,47 L74,62 L60,53 L46,62 L51,47 L38,38 L54,38Z" fill="${L.accent}" ${st}/>`);
      parts.push(`<rect x="12" y="80" width="96" height="10" fill="${L.accent}" ${st}/>`);
      break;
    case 'esti':
      parts.push(`<path d="M42,4 Q60,20 78,4" fill="#fff" ${st}/>`);
      break;
  }
  if (L.skirt) {
    const sk = id === 'esti' ? L.top : L.bottom;
    parts.push(`<path d="M14,84 L106,84 L116,${H - 4} Q60,${H + 2} 4,${H - 4}Z" fill="${sk}" ${st}/>`);
    if (id === 'esti') {
      for (const [x, y] of [[30, 100], [60, 112], [88, 98], [44, 126], [80, 126], [60, 92]]) parts.push(`<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`);
    } else {
      parts.push(`<path d="M30,92 L24,${H - 8} M60,92 L60,${H - 4} M90,92 L96,${H - 8}" stroke="${darker(sk, 0.75)}" stroke-width="3"/>`);
    }
  }
  return parts.join('');
}

export function armMarkup(id: CastId): string {
  const L = LOOKS[id];
  const sleeve = id === 'daniel' ? L.accent : L.top;
  return `<rect x="3" y="2" width="24" height="62" rx="11" fill="${sleeve}" ${st}/><circle cx="15" cy="70" r="11" fill="${L.skin}" ${st}/>`;
}

export function legMarkup(id: CastId): string {
  const L = LOOKS[id];
  return `<rect x="6" y="0" width="22" height="58" rx="6" fill="${L.legs}" ${st}/><ellipse cx="20" cy="62" rx="15" ry="8" fill="${L.shoe}" ${st}/>`;
}

export function capeMarkup(id: CastId): string {
  const L = LOOKS[id];
  return `<path d="M32,4 L98,4 L126,130 Q65,116 4,130Z" fill="${L.cape}" ${st}/><path d="M40,20 L20,120 M90,20 L110,120" stroke="${darker(L.cape!, 0.7)}" stroke-width="3"/>`;
}

export function svgDoc(inner: string, w: number, h: number, pad = 4): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2}" viewBox="${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}">${inner}</svg>`;
}

export function svgUri(svg: string): string {
  // base64 (Phaser's loader decodes data URIs with atob); utf-8 safe
  const bytes = new TextEncoder().encode(svg);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:image/svg+xml;base64,' + btoa(bin);
}

/** Layout of the rig in unscaled units (feet at 0,0). Shared by Phaser rig and the static SVG. */
export const RIG = {
  legY: -64,
  legX: 15,
  bodyTop: -154,
  armX: 50,
  armY: -148,
  neckY: -146,
  // head image anchor: bottom-center of the neck (70,148) inside the 140x150 head
  headAnchor: { x: 70, y: 148 },
  eyeL: { x: 52, y: 82 },
  eyeR: { x: 88, y: 82 },
  mouth: { x: 70, y: 114 },
};
