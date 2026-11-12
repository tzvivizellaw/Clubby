import { useMemo } from 'react';
import { OBJ } from '../assets/objects';
import { characterSvg, type StaticPose } from '../characters/fullSvg';
import { svgDoc } from '../characters/parts';
import type { CastId } from '../data/characters';

export function CharacterArt({ id, pose, className, style }: { id: CastId; pose?: StaticPose; className?: string; style?: React.CSSProperties }) {
  const html = useMemo(() => characterSvg(id, pose), [id, JSON.stringify(pose)]);
  return <div className={`char-art ${className ?? ''}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ObjArt({ k, className, style }: { k: string; className?: string; style?: React.CSSProperties }) {
  const html = useMemo(() => {
    const o = OBJ[k];
    return o ? svgDoc(o.svg, o.w, o.h) : '';
  }, [k]);
  return <div className={`obj-art ${className ?? ''}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Heart({ full = true }: { full?: boolean }) {
  return (
    <svg viewBox="0 0 64 58" className={`heart ${full ? 'full' : 'empty'}`}>
      <path d="M32,54 Q4,34 6,18 Q8,4 22,4 Q30,4 32,14 Q34,4 42,4 Q56,4 58,18 Q60,34 32,54Z" fill={full ? '#ff4d6d' : '#5c4d6b'} stroke="#2b1d3a" strokeWidth="5" strokeLinejoin="round" />
      {full && <ellipse cx="20" cy="18" rx="6" ry="4" fill="#fff" opacity="0.6" />}
    </svg>
  );
}
