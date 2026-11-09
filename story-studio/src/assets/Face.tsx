import type { Expression } from '../model/types';

interface FaceProps {
  cx: number;
  cy: number;
  /** Half the distance between the eyes. */
  spread?: number;
  expr: Expression;
  ink?: string;
  blush?: boolean;
  size?: number;
}

/** Shared expressive face used by every character, so expressions feel consistent. */
export function Face({ cx, cy, spread = 16, expr, ink = '#2b2340', blush = true, size = 1 }: FaceProps) {
  const lx = cx - spread;
  const rx = cx + spread;
  const s = size;
  const mouthY = cy + 18 * s;
  const sw = 3 * s;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {blush && (
        <>
          <ellipse cx={lx - 6 * s} cy={cy + 12 * s} rx={7 * s} ry={4 * s} fill="#f08f8f" opacity={0.35} />
          <ellipse cx={rx + 6 * s} cy={cy + 12 * s} rx={7 * s} ry={4 * s} fill="#f08f8f" opacity={0.35} />
        </>
      )}
      {expr === 'happy' && (
        <>
          <ellipse cx={lx} cy={cy} rx={4.2 * s} ry={5.2 * s} fill={ink} />
          <ellipse cx={rx} cy={cy} rx={4.2 * s} ry={5.2 * s} fill={ink} />
          <circle cx={lx + 1.4 * s} cy={cy - 1.8 * s} r={1.4 * s} fill="#fff" />
          <circle cx={rx + 1.4 * s} cy={cy - 1.8 * s} r={1.4 * s} fill="#fff" />
          <path d={`M${cx - 9 * s},${mouthY - 2 * s} Q${cx},${mouthY + 8 * s} ${cx + 9 * s},${mouthY - 2 * s}`} fill="none" stroke={ink} strokeWidth={sw} />
          <path d={`M${lx - 5 * s},${cy - 11 * s} Q${lx},${cy - 14 * s} ${lx + 5 * s},${cy - 11 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
          <path d={`M${rx - 5 * s},${cy - 11 * s} Q${rx},${cy - 14 * s} ${rx + 5 * s},${cy - 11 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
        </>
      )}
      {expr === 'surprised' && (
        <>
          <circle cx={lx} cy={cy} r={6 * s} fill="#fff" stroke={ink} strokeWidth={2 * s} />
          <circle cx={rx} cy={cy} r={6 * s} fill="#fff" stroke={ink} strokeWidth={2 * s} />
          <circle cx={lx} cy={cy + 0.5 * s} r={3.2 * s} fill={ink} />
          <circle cx={rx} cy={cy + 0.5 * s} r={3.2 * s} fill={ink} />
          <ellipse cx={cx} cy={mouthY + 1 * s} rx={5 * s} ry={6.5 * s} fill={ink} />
          <ellipse cx={cx} cy={mouthY + 3.5 * s} rx={3 * s} ry={2.4 * s} fill="#e8707a" />
          <path d={`M${lx - 6 * s},${cy - 15 * s} Q${lx},${cy - 20 * s} ${lx + 6 * s},${cy - 15 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
          <path d={`M${rx - 6 * s},${cy - 15 * s} Q${rx},${cy - 20 * s} ${rx + 6 * s},${cy - 15 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
        </>
      )}
      {expr === 'thinking' && (
        <>
          <ellipse cx={lx + 2 * s} cy={cy - 1.5 * s} rx={4 * s} ry={5 * s} fill={ink} />
          <ellipse cx={rx + 2 * s} cy={cy - 1.5 * s} rx={4 * s} ry={5 * s} fill={ink} />
          <circle cx={lx + 3.4 * s} cy={cy - 3.6 * s} r={1.3 * s} fill="#fff" />
          <circle cx={rx + 3.4 * s} cy={cy - 3.6 * s} r={1.3 * s} fill="#fff" />
          <path d={`M${cx - 6 * s},${mouthY + 1 * s} L${cx + 7 * s},${mouthY - 1.5 * s}`} fill="none" stroke={ink} strokeWidth={sw} />
          <path d={`M${lx - 5 * s},${cy - 11 * s} L${lx + 5 * s},${cy - 12 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
          <path d={`M${rx - 5 * s},${cy - 14 * s} Q${rx},${cy - 18 * s} ${rx + 5 * s},${cy - 14 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
        </>
      )}
      {expr === 'sad' && (
        <>
          <path d={`M${lx - 4.5 * s},${cy + 1 * s} Q${lx},${cy + 5 * s} ${lx + 4.5 * s},${cy + 1 * s}`} fill="none" stroke={ink} strokeWidth={2.6 * s} />
          <path d={`M${rx - 4.5 * s},${cy + 1 * s} Q${rx},${cy + 5 * s} ${rx + 4.5 * s},${cy + 1 * s}`} fill="none" stroke={ink} strokeWidth={2.6 * s} />
          <path d={`M${cx - 8 * s},${mouthY + 4 * s} Q${cx},${mouthY - 3 * s} ${cx + 8 * s},${mouthY + 4 * s}`} fill="none" stroke={ink} strokeWidth={sw} />
          <path d={`M${lx - 5 * s},${cy - 9 * s} L${lx + 5 * s},${cy - 13 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
          <path d={`M${rx - 5 * s},${cy - 13 * s} L${rx + 5 * s},${cy - 9 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} />
        </>
      )}
    </g>
  );
}
