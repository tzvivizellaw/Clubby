import type { ReactNode } from 'react';
import type { CharacterColors, Expression } from '../model/types';
import { Face } from './Face';

/** Original character illustrations. All drawn in a 200×300 box, feet at the bottom center. */

const INK = '#2b2340';

export interface CharacterKind {
  id: string;
  label: string;
  defaultName: string;
  defaultColors: CharacterColors;
  colorLabels: { main: string; accent: string; hair: string };
  render: (colors: CharacterColors, expr: Expression) => ReactNode;
}

export const PALETTE = [
  '#7c5cc4', '#b79ce8', '#1f9e95', '#7fd1c7', '#e8866a', '#f6b89a',
  '#e2b23a', '#f5d97a', '#3d6fb6', '#8fb3e8', '#c75d8e', '#4f8a4b',
  '#9bc77f', '#8a5a3b', '#3b3355', '#f4efe6', '#d9534f', '#6b6b7b',
];

export const HAIR_PALETTE = ['#3b2a20', '#6b4227', '#a8683c', '#d9a25b', '#1f1a24', '#c2462f', '#8a8aa0', '#7c5cc4'];

interface HumanOpts {
  skin: string;
  colors: CharacterColors;
  expr: Expression;
  hair: 'ponytail' | 'braids' | 'cap' | 'short' | 'bun' | 'curly';
  bottom: 'skirt' | 'pants' | 'longskirt';
  extra?: ReactNode;
  glasses?: boolean;
  cardigan?: boolean;
  goggles?: boolean;
  holdBook?: boolean;
}

function Human({ skin, colors, expr, hair, bottom, extra, glasses, cardigan, goggles, holdBook }: HumanOpts) {
  const shade = 'rgba(43,35,64,0.14)';
  return (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
      {/* back hair */}
      {hair === 'ponytail' && (
        <path d="M138,58 C170,62 176,100 162,128 C156,112 150,98 140,90 Z" fill={colors.hair} />
      )}
      {hair === 'braids' && (
        <g fill={colors.hair}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <circle cx={58} cy={100 + i * 15} r={8 - i * 0.6} />
              <circle cx={142} cy={100 + i * 15} r={8 - i * 0.6} />
            </g>
          ))}
          <circle cx={58} cy={160} r={4} fill={colors.accent} />
          <circle cx={142} cy={160} r={4} fill={colors.accent} />
        </g>
      )}
      {hair === 'bun' && <path d="M56,92 C50,50 72,32 100,32 C128,32 150,50 144,92 Z" fill={colors.hair} />}
      {hair === 'curly' && (
        <g fill={colors.hair}>
          {[[60, 70], [66, 48], [84, 36], [100, 32], [116, 36], [134, 48], [140, 70], [146, 92], [54, 92]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={15} />
          ))}
        </g>
      )}

      {/* legs & shoes */}
      {bottom === 'pants' ? (
        <>
          <rect x={72} y={196} width={26} height={84} rx={9} fill={colors.accent} />
          <rect x={102} y={196} width={26} height={84} rx={9} fill={colors.accent} />
        </>
      ) : (
        <>
          <rect x={80} y={240} width={14} height={42} rx={6} fill="#4a4060" />
          <rect x={106} y={240} width={14} height={42} rx={6} fill="#4a4060" />
        </>
      )}
      <ellipse cx={84} cy={286} rx={18} ry={8} fill={INK} />
      <ellipse cx={116} cy={286} rx={18} ry={8} fill={INK} />

      {/* skirt */}
      {bottom === 'skirt' && <path d="M68,190 L132,190 L148,262 Q100,272 52,262 Z" fill={colors.accent} />}
      {bottom === 'longskirt' && <path d="M68,190 L132,190 L150,278 Q100,288 50,278 Z" fill={colors.accent} />}

      {/* arms */}
      <path d="M70,128 Q50,150 52,196" fill="none" stroke={INK} strokeWidth={19} />
      <path d="M70,128 Q50,150 52,196" fill="none" stroke={colors.main} strokeWidth={14} />
      <path d="M130,128 Q150,150 148,196" fill="none" stroke={INK} strokeWidth={19} />
      <path d="M130,128 Q150,150 148,196" fill="none" stroke={colors.main} strokeWidth={14} />
      <circle cx={52} cy={202} r={9} fill={skin} />
      <circle cx={148} cy={202} r={9} fill={skin} />

      {/* torso */}
      <rect x={66} y={116} width={68} height={86} rx={22} fill={colors.main} />
      {cardigan && (
        <>
          <path d="M66,138 Q66,116 88,116 L92,202 L78,202 Q66,200 66,186 Z" fill={colors.accent} />
          <path d="M134,138 Q134,116 112,116 L108,202 L122,202 Q134,200 134,186 Z" fill={colors.accent} />
          <path d="M100,150 l4,8 9,1 -7,6 2,9 -8,-5 -8,5 2,-9 -7,-6 9,-1 z" fill="#f5d97a" strokeWidth={1.5} />
        </>
      )}
      <path d="M78,120 Q100,134 122,120" fill="none" stroke={shade} strokeWidth={3} />
      {holdBook && (
        <g>
          <rect x={120} y={170} width={36} height={44} rx={4} fill={colors.hair === '#1f1a24' ? '#e8866a' : '#1f9e95'} transform="rotate(-10 138 192)" />
          <path d="M126,178 l22,-4" stroke="#fff" strokeWidth={2} transform="rotate(-10 138 192)" />
        </g>
      )}

      {/* neck & head */}
      <rect x={91} y={104} width={18} height={18} fill={skin} />
      <circle cx={58} cy={84} r={9} fill={skin} />
      <circle cx={142} cy={84} r={9} fill={skin} />
      <circle cx={100} cy={78} r={42} fill={skin} />

      {/* front hair */}
      {(hair === 'ponytail' || hair === 'braids') && (
        <path d="M58,80 Q56,34 100,34 Q144,34 142,80 Q134,60 116,56 Q108,66 92,60 Q72,58 58,80 Z" fill={colors.hair} />
      )}
      {hair === 'ponytail' && <circle cx={140} cy={60} r={7} fill={colors.accent} />}
      {hair === 'bun' && (
        <>
          <path d="M58,78 Q60,38 100,38 Q140,38 142,78 Q120,52 100,56 Q80,52 58,78 Z" fill={colors.hair} />
          <circle cx={100} cy={30} r={17} fill={colors.hair} />
        </>
      )}
      {hair === 'short' && (
        <path d="M58,76 Q56,34 100,34 Q146,34 142,76 Q138,62 128,58 Q118,50 104,56 Q96,48 86,56 Q70,58 58,76 Z" fill={colors.hair} />
      )}
      {hair === 'curly' && (
        <g fill={colors.hair}>
          <circle cx={78} cy={48} r={13} />
          <circle cx={100} cy={44} r={14} />
          <circle cx={122} cy={48} r={13} />
        </g>
      )}
      {hair === 'cap' && (
        <>
          <path d="M58,84 Q56,58 64,50 L136,50 Q144,58 142,84 Q140,70 136,66 L64,66 Q60,70 58,84 Z" fill={colors.hair} />
          <path d="M58,62 Q60,30 100,30 Q140,30 142,62 Z" fill={colors.accent} />
          <path d="M136,58 Q160,56 170,64 Q150,68 136,66 Z" fill={colors.accent} />
          <circle cx={100} cy={30} r={4} fill={colors.main} />
        </>
      )}
      {goggles && (
        <g>
          <path d="M58,54 L142,54" stroke="#6b4227" strokeWidth={6} />
          <circle cx={84} cy={52} r={11} fill="#8fd6e8" />
          <circle cx={116} cy={52} r={11} fill="#8fd6e8" />
          <path d="M80,48 l4,-3" stroke="#fff" strokeWidth={2} />
          <path d="M112,48 l4,-3" stroke="#fff" strokeWidth={2} />
        </g>
      )}

      <g stroke="none">
        <Face cx={100} cy={84} spread={16} expr={expr} ink={INK} />
      </g>
      {glasses && (
        <g fill="rgba(255,255,255,0.18)" strokeWidth={2.4}>
          <circle cx={84} cy={84} r={11} />
          <circle cx={116} cy={84} r={11} />
          <path d="M95,84 L105,84" />
        </g>
      )}
      {extra}
    </g>
  );
}

function Cat({ colors, expr }: { colors: CharacterColors; expr: Expression }) {
  return (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M150,262 C190,250 196,200 172,182" fill="none" stroke={INK} strokeWidth={17} />
      <path d="M150,262 C190,250 196,200 172,182" fill="none" stroke={colors.main} strokeWidth={12} />
      <path d="M62,288 C52,236 66,196 100,194 C134,196 148,236 138,288 Z" fill={colors.main} />
      <path d="M82,288 C78,250 86,222 100,220 C114,222 122,250 118,288 Z" fill={colors.accent} stroke="none" />
      <ellipse cx={80} cy={288} rx={14} ry={7} fill={colors.main} />
      <ellipse cx={120} cy={288} rx={14} ry={7} fill={colors.main} />
      <path d="M56,170 L52,116 L84,140 Z" fill={colors.main} />
      <path d="M144,170 L148,116 L116,140 Z" fill={colors.main} />
      <path d="M60,158 L58,128 L76,142 Z" fill="#f4a6b4" stroke="none" />
      <path d="M140,158 L142,128 L124,142 Z" fill="#f4a6b4" stroke="none" />
      <ellipse cx={100} cy={170} rx={50} ry={40} fill={colors.main} />
      <path d="M86,204 Q100,214 114,204" fill="none" stroke={colors.hair} strokeWidth={6} />
      <circle cx={100} cy={214} r={6} fill="#f5d97a" />
      <g stroke="none">
        <Face cx={100} cy={164} spread={18} expr={expr} ink={INK} size={0.9} />
      </g>
      <path d="M97,176 L103,176 L100,180 Z" fill="#e8707a" strokeWidth={1.5} />
      <g strokeWidth={1.6} opacity={0.8}>
        <path d="M66,178 L44,174 M66,184 L46,188" />
        <path d="M134,178 L156,174 M134,184 L154,188" />
      </g>
    </g>
  );
}

function Robot({ colors, expr }: { colors: CharacterColors; expr: Expression }) {
  const glow = colors.hair;
  return (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M100,98 L100,76" />
      <circle cx={100} cy={70} r={8} fill={colors.accent} />
      <rect x={70} y={254} width={22} height={30} rx={6} fill="#8a8aa0" />
      <rect x={108} y={254} width={22} height={30} rx={6} fill="#8a8aa0" />
      <ellipse cx={81} cy={286} rx={16} ry={6} fill={INK} />
      <ellipse cx={119} cy={286} rx={16} ry={6} fill={INK} />
      <path d="M62,200 Q42,214 44,240" fill="none" stroke={INK} strokeWidth={15} />
      <path d="M62,200 Q42,214 44,240" fill="none" stroke="#b9b9cc" strokeWidth={10} />
      <path d="M138,200 Q158,214 156,240" fill="none" stroke={INK} strokeWidth={15} />
      <path d="M138,200 Q158,214 156,240" fill="none" stroke="#b9b9cc" strokeWidth={10} />
      <circle cx={44} cy={244} r={8} fill={colors.accent} />
      <circle cx={156} cy={244} r={8} fill={colors.accent} />
      <rect x={60} y={184} width={80} height={76} rx={18} fill={colors.main} />
      <rect x={80} y={202} width={40} height={30} rx={6} fill={colors.accent} />
      <circle cx={92} cy={217} r={4} fill={glow} />
      <circle cx={108} cy={217} r={4} fill="#fff" />
      <rect x={52} y={98} width={96} height={80} rx={22} fill={colors.main} />
      <rect x={64} y={110} width={72} height={56} rx={14} fill="#2b2a44" />
      <g stroke="none">
        <Face cx={100} cy={132} spread={16} expr={expr} ink={glow} blush={false} size={0.85} />
      </g>
      <circle cx={52} cy={138} r={7} fill={colors.accent} />
      <circle cx={148} cy={138} r={7} fill={colors.accent} />
    </g>
  );
}

function Creature({ colors, expr }: { colors: CharacterColors; expr: Expression }) {
  return (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M76,150 Q64,118 76,104 Q84,128 90,142 Z" fill={colors.hair} />
      <path d="M124,150 Q136,118 124,104 Q116,128 110,142 Z" fill={colors.hair} />
      <path d="M50,236 Q34,216 44,200" fill="none" stroke={INK} strokeWidth={16} />
      <path d="M50,236 Q34,216 44,200" fill="none" stroke={colors.main} strokeWidth={11} />
      <path d="M150,236 Q166,216 156,200" fill="none" stroke={INK} strokeWidth={16} />
      <path d="M150,236 Q166,216 156,200" fill="none" stroke={colors.main} strokeWidth={11} />
      <path
        d="M100,140 C70,140 56,160 54,188 C42,196 44,214 52,222 C50,250 62,278 100,282 C138,278 150,250 148,222 C156,214 158,196 146,188 C144,160 130,140 100,140 Z"
        fill={colors.main}
      />
      <ellipse cx={100} cy={240} rx={30} ry={30} fill={colors.accent} stroke="none" />
      <ellipse cx={82} cy={286} rx={14} ry={6} fill={colors.main} />
      <ellipse cx={118} cy={286} rx={14} ry={6} fill={colors.main} />
      <path d="M100,230 l4,8 9,1 -7,6 2,9 -8,-5 -8,5 2,-9 -7,-6 9,-1 z" fill="#f5d97a" strokeWidth={1.5} />
      <g stroke="none">
        <Face cx={100} cy={188} spread={20} expr={expr} ink={INK} size={1.1} />
      </g>
    </g>
  );
}

export const CHARACTER_KINDS: CharacterKind[] = [
  {
    id: 'curious',
    label: 'ילדה סקרנית',
    defaultName: 'נועה',
    defaultColors: { main: '#1f9e95', accent: '#7c5cc4', hair: '#6b4227' },
    colorLabels: { main: 'חולצה', accent: 'חצאית', hair: 'שיער' },
    render: (c, e) => <Human skin="#f2c9a5" colors={c} expr={e} hair="ponytail" bottom="skirt" />,
  },
  {
    id: 'inventor',
    label: 'ילדה ממציאה',
    defaultName: 'תמר',
    defaultColors: { main: '#e2b23a', accent: '#3d6fb6', hair: '#1f1a24' },
    colorLabels: { main: 'סרבל', accent: 'חצאית', hair: 'שיער' },
    render: (c, e) => <Human skin="#c98e62" colors={c} expr={e} hair="braids" bottom="longskirt" goggles />,
  },
  {
    id: 'sporty',
    label: 'ילדה ספורטיבית',
    defaultName: 'מאיה',
    defaultColors: { main: '#e8866a', accent: '#3b3355', hair: '#a8683c' },
    colorLabels: { main: 'קפוצ׳ון', accent: 'מכנסיים וכובע', hair: 'שיער' },
    render: (c, e) => <Human skin="#f6d3b5" colors={c} expr={e} hair="cap" bottom="pants" />,
  },
  {
    id: 'bookworm',
    label: 'ילד חובב ספרים',
    defaultName: 'אורי',
    defaultColors: { main: '#4f8a4b', accent: '#3d6fb6', hair: '#3b2a20' },
    colorLabels: { main: 'סוודר', accent: 'מכנסיים', hair: 'שיער' },
    render: (c, e) => <Human skin="#8d5a3b" colors={c} expr={e} hair="short" bottom="pants" glasses holdBook />,
  },
  {
    id: 'librarian',
    label: 'ספרנית מסתורית',
    defaultName: 'הספרנית רות',
    defaultColors: { main: '#f4efe6', accent: '#7c5cc4', hair: '#8a8aa0' },
    colorLabels: { main: 'חולצה', accent: 'קרדיגן וחצאית', hair: 'שיער' },
    render: (c, e) => <Human skin="#e9b994" colors={c} expr={e} hair="bun" bottom="longskirt" glasses cardigan />,
  },
  {
    id: 'artist',
    label: 'ילדה אמנית',
    defaultName: 'ליה',
    defaultColors: { main: '#c75d8e', accent: '#1f9e95', hair: '#1f1a24' },
    colorLabels: { main: 'שמלה', accent: 'שרוולים ונעליים', hair: 'שיער' },
    render: (c, e) => (
      <Human
        skin="#6e4630"
        colors={c}
        expr={e}
        hair="curly"
        bottom="longskirt"
        extra={<path d="M150,206 l16,-30" stroke="#e2b23a" strokeWidth={5} />}
      />
    ),
  },
  {
    id: 'cat',
    label: 'חתול שובב',
    defaultName: 'פלפל',
    defaultColors: { main: '#e8a25a', accent: '#f6e2c4', hair: '#7c5cc4' },
    colorLabels: { main: 'פרווה', accent: 'בטן', hair: 'קולר' },
    render: (c, e) => <Cat colors={c} expr={e} />,
  },
  {
    id: 'robot',
    label: 'רובוט קטן',
    defaultName: 'פיקס',
    defaultColors: { main: '#8fb3e8', accent: '#e8866a', hair: '#7fffd4' },
    colorLabels: { main: 'גוף', accent: 'כפתורים', hair: 'אור המסך' },
    render: (c, e) => <Robot colors={c} expr={e} />,
  },
  {
    id: 'creature',
    label: 'יצור קסום',
    defaultName: 'בּוּבּוּ',
    defaultColors: { main: '#b79ce8', accent: '#f4efe6', hair: '#e2b23a' },
    colorLabels: { main: 'פרווה', accent: 'בטן', hair: 'קרניים' },
    render: (c, e) => <Creature colors={c} expr={e} />,
  },
];

export function getCharacterKind(id: string): CharacterKind {
  return CHARACTER_KINDS.find((k) => k.id === id) ?? CHARACTER_KINDS[0];
}

export function CharacterArt({
  kind,
  colors,
  expression,
  title,
}: {
  kind: string;
  colors: CharacterColors;
  expression: Expression;
  title?: string;
}) {
  const def = getCharacterKind(kind);
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {def.render(colors, expression)}
    </svg>
  );
}
