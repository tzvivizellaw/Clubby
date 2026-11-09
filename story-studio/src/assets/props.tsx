import type { ReactNode } from 'react';

/** Small original props, drawn in a 100×100 box with the base at the bottom center. */

const INK = '#2b2340';
const L = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export interface PropDef {
  id: string;
  label: string;
  art: ReactNode;
}

export const PROPS: PropDef[] = [
  {
    id: 'book',
    label: 'ספר',
    art: (
      <g {...L}>
        <path d="M12,80 L50,88 L88,80 L88,34 L50,42 L12,34 Z" fill="#f4efe6" />
        <path d="M50,42 L50,88" />
        <path d="M12,34 L50,42 L88,34 L88,28 L50,36 L12,28 Z" fill="#7c5cc4" />
        <path d="M20,48 L42,52 M20,58 L42,62 M58,52 L80,48 M58,62 L80,58" strokeWidth={2} opacity={0.5} />
      </g>
    ),
  },
  {
    id: 'key',
    label: 'מפתח',
    art: (
      <g {...L}>
        <circle cx={30} cy={60} r={16} fill="#e2b23a" />
        <circle cx={30} cy={60} r={6} fill="#fff8ec" />
        <path d="M46,60 L88,60 L88,72 M76,60 L76,70" fill="none" stroke="#e2b23a" strokeWidth={8} />
        <path d="M46,60 L88,60 L88,72 M76,60 L76,70" fill="none" strokeWidth={2} />
      </g>
    ),
  },
  {
    id: 'star',
    label: 'כוכב',
    art: (
      <g {...L}>
        <path d="M50,14 L60,40 L88,42 L66,60 L74,88 L50,72 L26,88 L34,60 L12,42 L40,40 Z" fill="#f5d97a" />
        <circle cx={44} cy={50} r={3} fill={INK} stroke="none" />
        <circle cx={56} cy={50} r={3} fill={INK} stroke="none" />
        <path d="M44,60 Q50,66 56,60" fill="none" strokeWidth={2.5} />
      </g>
    ),
  },
  {
    id: 'feather',
    label: 'נוצה',
    art: (
      <g {...L}>
        <path d="M26,90 Q30,40 78,12 Q82,52 34,78 Z" fill="#7fd1c7" />
        <path d="M22,94 L70,24" fill="none" strokeWidth={2.5} />
        <path d="M44,60 L56,58 M52,46 L64,42 M38,72 L48,72" strokeWidth={2} />
      </g>
    ),
  },
  {
    id: 'map',
    label: 'מפה',
    art: (
      <g {...L}>
        <path d="M10,30 L36,22 L64,30 L90,22 L90,80 L64,88 L36,80 L10,88 Z" fill="#f5deaa" />
        <path d="M36,22 L36,80 M64,30 L64,88" strokeWidth={2} />
        <path d="M18,70 Q34,50 48,60 T80,40" fill="none" stroke="#d9534f" strokeWidth={2.5} strokeDasharray="5 5" />
        <path d="M74,34 l8,8 M82,34 l-8,8" stroke="#d9534f" strokeWidth={3} />
      </g>
    ),
  },
  {
    id: 'lantern',
    label: 'פנס',
    art: (
      <g {...L}>
        <path d="M38,20 Q50,6 62,20" fill="none" />
        <rect x={32} y={20} width={36} height={10} rx={3} fill="#8a5a3b" />
        <rect x={34} y={30} width={32} height={50} rx={8} fill="#fff4b8" />
        <circle cx={50} cy={55} r={10} fill="#f5d97a" stroke="none" />
        <rect x={30} y={80} width={40} height={10} rx={3} fill="#8a5a3b" />
      </g>
    ),
  },
  {
    id: 'letter',
    label: 'מכתב',
    art: (
      <g {...L}>
        <rect x={12} y={30} width={76} height={52} rx={4} fill="#fff8ec" />
        <path d="M12,32 L50,60 L88,32" fill="none" />
        <circle cx={50} cy={62} r={8} fill="#d9534f" />
      </g>
    ),
  },
  {
    id: 'gift',
    label: 'מתנה',
    art: (
      <g {...L}>
        <rect x={18} y={44} width={64} height={46} rx={4} fill="#1f9e95" />
        <rect x={12} y={32} width={76} height={16} rx={4} fill="#7fd1c7" />
        <path d="M50,32 L50,90" stroke="#f5d97a" strokeWidth={8} />
        <path d="M50,32 Q30,8 26,26 Q30,34 50,32 Q70,8 74,26 Q70,34 50,32" fill="#f5d97a" />
      </g>
    ),
  },
  {
    id: 'magnifier',
    label: 'זכוכית מגדלת',
    art: (
      <g {...L}>
        <path d="M58,58 L86,86" stroke="#8a5a3b" strokeWidth={10} />
        <circle cx={42} cy={42} r={26} fill="#bfe6f5" strokeWidth={6} />
        <path d="M30,32 Q36,24 46,24" fill="none" stroke="#fff" strokeWidth={3} />
      </g>
    ),
  },
  {
    id: 'plant',
    label: 'עציץ',
    art: (
      <g {...L}>
        <path d="M30,62 L70,62 L64,92 L36,92 Z" fill="#e8866a" />
        <path d="M50,62 Q30,40 34,20 Q52,34 50,62 Q66,30 82,30 Q78,54 50,62" fill="#4f8a4b" />
      </g>
    ),
  },
  {
    id: 'secretDoor',
    label: 'דלת סודית',
    art: (
      <g {...L}>
        <path d="M18,96 L18,30 Q50,0 82,30 L82,96 Z" fill="#6b4227" />
        <path d="M26,96 L26,34 Q50,10 74,34 L74,96" fill="none" strokeWidth={2} opacity={0.6} />
        <path d="M50,26 l3,7 7,0 -5,5 2,7 -7,-4 -7,4 2,-7 -5,-5 7,0 z" fill="#f5d97a" strokeWidth={1.5} />
        <circle cx={38} cy={54} r={5} fill="#e2b23a" strokeWidth={1.5} />
        <path d="M42,54 L50,54" stroke="#e2b23a" strokeWidth={3} />
        <path d="M62,64 Q60,48 70,42 Q72,54 62,64 Z" fill="#7fd1c7" strokeWidth={1.5} />
        <circle cx={70} cy={74} r={3} fill="#e2b23a" />
      </g>
    ),
  },
  {
    id: 'spaceEgg',
    label: 'ביצה מהחלל',
    art: (
      <g {...L}>
        <ellipse cx={50} cy={58} rx={28} ry={36} fill="#b79ce8" />
        <path d="M30,50 l8,-6 8,6 8,-6 8,6 8,-6" fill="none" stroke="#fff" strokeWidth={3} />
        <circle cx={40} cy={70} r={4} fill="#f5d97a" stroke="none" />
        <circle cx={60} cy={76} r={3} fill="#7fd1c7" stroke="none" />
      </g>
    ),
  },
];

export function getProp(id: string): PropDef {
  return PROPS.find((p) => p.id === id) ?? PROPS[0];
}

export function PropArt({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      {getProp(id).art}
    </svg>
  );
}
