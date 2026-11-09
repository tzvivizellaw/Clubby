import type { ReactNode } from 'react';

/** Original illustrated backgrounds, 800×500. The center area is kept fairly calm for characters. */

const INK = '#2b2340';
const LINE = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export interface BackgroundDef {
  id: string;
  label: string;
  /** Text color that reads well on the upper area (for UI hints). */
  mood: 'light' | 'dark';
  art: ReactNode;
}

function Star({ x, y, r = 6, fill = '#f5d97a' }: { x: number; y: number; r?: number; fill?: string }) {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  }).join(' ');
  return <polygon points={p} fill={fill} />;
}

function Books({ x, y, w }: { x: number; y: number; w: number }) {
  const colors = ['#7c5cc4', '#1f9e95', '#e8866a', '#e2b23a', '#3d6fb6', '#c75d8e', '#4f8a4b'];
  const items: ReactNode[] = [];
  let cx = x;
  let i = 0;
  while (cx < x + w - 12) {
    const bw = 12 + ((i * 7) % 9);
    const bh = 40 + ((i * 13) % 18);
    items.push(<rect key={i} x={cx} y={y - bh} width={bw} height={bh} rx={2} fill={colors[i % colors.length]} {...LINE} strokeWidth={2} />);
    cx += bw + 2;
    i++;
  }
  return <g>{items}</g>;
}

function Bedroom() {
  return (
    <g>
      <rect width={800} height={500} fill="#efe4fb" />
      <g opacity={0.35}>
        {Array.from({ length: 9 }, (_, i) => (
          <Star key={i} x={60 + i * 90} y={40 + (i % 2) * 40} r={7} fill="#b79ce8" />
        ))}
      </g>
      <rect y={360} width={800} height={140} fill="#d7b98f" />
      <path d="M0,360 L800,360" {...LINE} />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 110},360 L${i * 110 - 40},500`} stroke="#c3a276" strokeWidth={3} />)}
      {/* window */}
      <rect x={560} y={70} width={170} height={150} rx={14} fill="#3b3a78" {...LINE} />
      <path d="M645,70 L645,220 M560,145 L730,145" {...LINE} />
      <circle cx={690} cy={110} r={18} fill="#f5d97a" />
      <Star x={590} y={100} r={6} />
      <Star x={610} y={190} r={5} />
      <Star x={700} y={180} r={5} />
      <path d="M548,60 Q600,120 560,240 L548,240 Z M742,60 Q690,120 730,240 L742,240 Z" fill="#7fd1c7" {...LINE} />
      {/* bed */}
      <rect x={20} y={280} width={210} height={90} rx={16} fill="#f4efe6" {...LINE} />
      <rect x={20} y={300} width={210} height={70} rx={14} fill="#b79ce8" {...LINE} />
      <rect x={10} y={220} width={26} height={160} rx={10} fill="#8a5a3b" {...LINE} />
      <ellipse cx={80} cy={286} rx={40} ry={16} fill="#fff" {...LINE} />
      {/* lamp & shelf */}
      <rect x={600} y={290} width={120} height={80} rx={8} fill="#e8866a" {...LINE} />
      <path d="M640,290 L640,240 M624,240 L656,240 L648,214 L632,214 Z" fill="#f5d97a" {...LINE} />
      <rect x={300} y={130} width={160} height={10} rx={4} fill="#8a5a3b" {...LINE} />
      <Books x={310} y={130} w={140} />
      <ellipse cx={400} cy={430} rx={170} ry={36} fill="#7fd1c7" opacity={0.7} />
    </g>
  );
}

function Library() {
  return (
    <g>
      <rect width={800} height={500} fill="#f3e3c8" />
      <rect y={370} width={800} height={130} fill="#a8683c" />
      <path d="M0,370 L800,370" {...LINE} />
      {[0, 1].map((side) => {
        const x0 = side === 0 ? 10 : 590;
        return (
          <g key={side}>
            <rect x={x0} y={40} width={200} height={330} fill="#8a5a3b" {...LINE} />
            {[110, 190, 270, 350].map((y) => (
              <g key={y}>
                <rect x={x0 + 10} y={y} width={180} height={8} fill="#6b4227" />
                <Books x={x0 + 14} y={y} w={172} />
              </g>
            ))}
          </g>
        );
      })}
      {/* arched window */}
      <path d="M330,250 L330,120 Q400,40 470,120 L470,250 Z" fill="#8fd6e8" {...LINE} />
      <path d="M400,70 L400,250 M330,170 L470,170" {...LINE} />
      <circle cx={440} cy={110} r={10} fill="#fff" opacity={0.8} />
      {/* rug */}
      <ellipse cx={400} cy={440} rx={190} ry={38} fill="#7c5cc4" opacity={0.55} />
      <ellipse cx={400} cy={440} rx={150} ry={26} fill="none" stroke="#f5d97a" strokeWidth={4} opacity={0.8} />
      {/* hanging lamps */}
      {[260, 540].map((x) => (
        <g key={x}>
          <path d={`M${x},0 L${x},40`} {...LINE} />
          <path d={`M${x - 18},62 L${x + 18},62 L${x + 8},40 L${x - 8},40 Z`} fill="#e2b23a" {...LINE} />
          <circle cx={x} cy={68} r={8} fill="#fff4b8" />
        </g>
      ))}
    </g>
  );
}

function Classroom() {
  return (
    <g>
      <rect width={800} height={500} fill="#e3f3ef" />
      <rect y={360} width={800} height={140} fill="#c7d6e8" />
      <path d="M0,360 L800,360" {...LINE} />
      {/* board */}
      <rect x={210} y={50} width={380} height={170} rx={10} fill="#2f6b5a" stroke="#8a5a3b" strokeWidth={10} />
      <path d="M250,110 Q290,80 330,110 T410,110" fill="none" stroke="#fff" strokeWidth={3} opacity={0.8} />
      <text x={520} y={120} fontSize={36} fill="#fff" opacity={0.85} fontFamily="sans-serif">א ב ג</text>
      <path d="M260,170 l40,0 M320,170 l70,0" stroke="#f5d97a" strokeWidth={3} />
      <rect x={380} y={222} width={60} height={8} rx={3} fill="#f4efe6" {...LINE} strokeWidth={2} />
      {/* desks */}
      {[40, 640].map((x) => (
        <g key={x}>
          <rect x={x} y={330} width={130} height={18} rx={4} fill="#e2b23a" {...LINE} />
          <path d={`M${x + 12},348 L${x + 12},420 M${x + 118},348 L${x + 118},420`} {...LINE} strokeWidth={5} />
          <rect x={x + 20} y={312} width={40} height={18} rx={3} fill="#e8866a" {...LINE} strokeWidth={2} />
        </g>
      ))}
      {/* clock & plant */}
      <circle cx={90} cy={110} r={40} fill="#fff" {...LINE} />
      <path d="M90,110 L90,84 M90,110 L108,118" {...LINE} />
      <rect x={705} y={250} width={50} height={50} rx={6} fill="#e8866a" {...LINE} />
      <path d="M730,250 Q700,200 720,180 Q735,220 730,250 Q760,200 770,210 Q750,240 730,250" fill="#4f8a4b" {...LINE} />
      <path d="M640,60 l0,90 M680,60 l0,90" stroke="#b79ce8" strokeWidth={4} opacity={0.6} />
    </g>
  );
}

function Schoolyard() {
  return (
    <g>
      <rect width={800} height={500} fill="#bfe6f5" />
      <circle cx={700} cy={80} r={44} fill="#f5d97a" />
      <g fill="#fff" opacity={0.9}>
        <ellipse cx={160} cy={80} rx={60} ry={22} />
        <ellipse cx={200} cy={66} rx={40} ry={22} />
        <ellipse cx={480} cy={60} rx={50} ry={18} />
      </g>
      <rect x={0} y={170} width={260} height={190} fill="#f6b89a" {...LINE} />
      <path d="M-10,175 L130,100 L270,175 Z" fill="#c75d8e" {...LINE} />
      {[30, 100, 170].map((x) => (
        <rect key={x} x={x} y={210} width={50} height={46} rx={4} fill="#8fd6e8" {...LINE} />
      ))}
      <rect x={100} y={290} width={60} height={70} rx={4} fill="#8a5a3b" {...LINE} />
      <rect y={340} width={800} height={160} fill="#9bc77f" />
      <path d="M0,340 L800,340" {...LINE} />
      <ellipse cx={420} cy={430} rx={210} ry={40} fill="#d9c29a" />
      {/* tree */}
      <rect x={640} y={220} width={30} height={130} fill="#8a5a3b" {...LINE} />
      <circle cx={655} cy={200} r={70} fill="#4f8a4b" {...LINE} />
      <circle cx={620} cy={180} r={10} fill="#e8866a" />
      <circle cx={690} cy={210} r={10} fill="#e8866a" />
      {/* hopscotch */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={360 + i * 44} y={420} width={40} height={30} fill="none" stroke="#fff" strokeWidth={3} />
      ))}
      <path d="M260,300 L800,300" stroke="#8a5a3b" strokeWidth={4} opacity={0.4} />
    </g>
  );
}

function MagicForest() {
  return (
    <g>
      <defs>
        <linearGradient id="bgForestSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3a78" />
          <stop offset="1" stopColor="#7c5cc4" />
        </linearGradient>
      </defs>
      <rect width={800} height={500} fill="url(#bgForestSky)" />
      <circle cx={400} cy={90} r={40} fill="#fff4b8" opacity={0.9} />
      {[[80, 60], [220, 40], [600, 50], [720, 110], [520, 120], [150, 140]].map(([x, y], i) => (
        <Star key={i} x={x} y={y} r={5} />
      ))}
      {[[-30, 140], [90, 180], [610, 170], [720, 130]].map(([x, h], i) => (
        <g key={i}>
          <rect x={x + 50} y={h + 100} width={34} height={300} fill="#3b3355" {...LINE} />
          <circle cx={x + 67} cy={h + 70} r={80} fill={i % 2 ? '#1f9e95' : '#2f7d77'} {...LINE} />
        </g>
      ))}
      <rect y={370} width={800} height={130} fill="#2f6b5a" />
      <path d="M0,370 Q200,350 400,370 T800,370" fill="none" {...LINE} />
      {/* glowing mushrooms */}
      {[[220, 380], [560, 390], [600, 372]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 6} y={y - 20} width={12} height={22} rx={4} fill="#f4efe6" {...LINE} strokeWidth={2} />
          <path d={`M${x - 22},${y - 18} Q${x},${y - 48} ${x + 22},${y - 18} Z`} fill="#e8866a" {...LINE} strokeWidth={2} />
          <circle cx={x - 6} cy={y - 28} r={3} fill="#fff" />
        </g>
      ))}
      {[[300, 260], [480, 230], [420, 300], [260, 200], [540, 300]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#f5d97a" opacity={0.8} />
      ))}
      <path d="M330,500 Q380,420 400,380 Q420,420 470,500 Z" fill="#9bc77f" opacity={0.35} />
    </g>
  );
}

function TreeHouse() {
  return (
    <g>
      <rect width={800} height={500} fill="#cfeee8" />
      <rect y={380} width={800} height={120} fill="#9bc77f" />
      <path d="M0,380 L800,380" {...LINE} />
      <path d="M0,0 L800,0 L800,30 Q400,60 0,30 Z" fill="#4f8a4b" />
      {/* inside planks */}
      <rect x={40} y={60} width={720} height={300} rx={20} fill="#d9a25b" {...LINE} />
      {[100, 160, 220, 280].map((y) => (
        <path key={y} d={`M40,${y} L760,${y}`} stroke="#b47c43" strokeWidth={3} />
      ))}
      <rect x={300} y={100} width={200} height={140} rx={70} fill="#8fd6e8" {...LINE} />
      <path d="M330,190 Q380,140 420,170 Q450,130 480,170" fill="none" stroke="#4f8a4b" strokeWidth={10} />
      <rect y={340} x={20} width={760} height={40} fill="#8a5a3b" {...LINE} />
      {/* rope ladder & lantern */}
      <path d="M90,60 L90,340 M120,60 L120,340" {...LINE} />
      {[100, 150, 200, 250, 300].map((y) => <path key={y} d={`M90,${y} L120,${y}`} {...LINE} />)}
      <path d="M680,60 L680,110" {...LINE} />
      <rect x={664} y={110} width={32} height={40} rx={8} fill="#f5d97a" {...LINE} />
      {/* bunting */}
      <path d="M180,80 Q400,130 620,80" fill="none" {...LINE} strokeWidth={2} />
      {[220, 280, 340, 400, 460, 520, 580].map((x, i) => (
        <path key={x} d={`M${x - 12},${92 + Math.sin(i) * 4} L${x + 12},${94 + Math.sin(i) * 4} L${x},${116}`} fill={['#e8866a', '#7c5cc4', '#1f9e95', '#e2b23a'][i % 4]} {...LINE} strokeWidth={2} />
      ))}
    </g>
  );
}

function Beach() {
  return (
    <g>
      <rect width={800} height={500} fill="#bfe6f5" />
      <circle cx={130} cy={90} r={50} fill="#f5d97a" />
      <rect y={240} width={800} height={120} fill="#3d9ec7" />
      <path d="M0,240 L800,240" {...LINE} />
      {[270, 300, 330].map((y, i) => (
        <path key={y} d={`M${-20 + i * 30},${y} q30,-12 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0`} fill="none" stroke="#fff" strokeWidth={3} opacity={0.6} />
      ))}
      <path d="M0,350 Q200,330 400,352 T800,346 L800,500 L0,500 Z" fill="#f5deaa" {...LINE} />
      {/* sailboat */}
      <path d="M560,230 L640,230 L626,248 L574,248 Z" fill="#e8866a" {...LINE} strokeWidth={2} />
      <path d="M600,230 L600,170 L636,222 Z" fill="#fff" {...LINE} strokeWidth={2} />
      {/* umbrella */}
      <path d="M690,470 L720,300" {...LINE} strokeWidth={5} />
      <path d="M630,320 Q700,230 800,290 Q720,280 630,320 Z" fill="#c75d8e" {...LINE} />
      <path d="M680,300 Q710,260 740,282" fill="none" stroke="#fff" strokeWidth={6} opacity={0.7} />
      {/* bucket & shells */}
      <path d="M80,420 L120,420 L114,460 L86,460 Z" fill="#1f9e95" {...LINE} />
      <path d="M84,420 Q100,390 116,420" fill="none" {...LINE} />
      <path d="M180,460 q10,-20 20,0 z" fill="#f6b89a" {...LINE} strokeWidth={2} />
      <Star x={240} y={440} r={12} fill="#e8866a" />
      <g fill="#fff" opacity={0.9}>
        <ellipse cx={400} cy={80} rx={60} ry={20} />
        <ellipse cx={440} cy={66} rx={40} ry={20} />
      </g>
    </g>
  );
}

function Spaceship() {
  return (
    <g>
      <rect width={800} height={500} fill="#2b2a44" />
      <rect x={20} y={30} width={760} height={330} rx={40} fill="#3e3d63" {...LINE} />
      <circle cx={400} cy={170} r={120} fill="#141330" {...LINE} strokeWidth={6} />
      <circle cx={400} cy={170} r={108} fill="none" stroke="#8fb3e8" strokeWidth={4} opacity={0.5} />
      <circle cx={450} cy={130} r={30} fill="#e8866a" />
      <ellipse cx={450} cy={130} rx={46} ry={10} fill="none" stroke="#f5d97a" strokeWidth={4} />
      {[[340, 100], [370, 230], [320, 180], [460, 220], [420, 90]].map(([x, y], i) => (
        <Star key={i} x={x} y={y} r={4} fill="#fff" />
      ))}
      {/* panels */}
      {[60, 640].map((x) => (
        <g key={x}>
          <rect x={x} y={90} width={100} height={150} rx={14} fill="#55547e" {...LINE} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <circle key={`${r}${c}`} cx={x + 25 + c * 25} cy={130 + r * 36} r={8} fill={['#7fd1c7', '#e2b23a', '#e8866a'][(r + c) % 3]} />
            )),
          )}
        </g>
      ))}
      <rect y={360} width={800} height={140} fill="#55547e" />
      <path d="M0,360 L800,360" {...LINE} />
      {[100, 250, 400, 550, 700].map((x) => <path key={x} d={`M${x},360 L${x - 30},500`} stroke="#45446b" strokeWidth={4} />)}
      <ellipse cx={400} cy={440} rx={160} ry={30} fill="#7fd1c7" opacity={0.25} />
    </g>
  );
}

function CloudCastle() {
  return (
    <g>
      <defs>
        <linearGradient id="bgCastleSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6b89a" />
          <stop offset="1" stopColor="#efe4fb" />
        </linearGradient>
      </defs>
      <rect width={800} height={500} fill="url(#bgCastleSky)" />
      {/* castle */}
      <g>
        {[[250, 140], [520, 120]].map(([x, top], i) => (
          <g key={i}>
            <rect x={x} y={top} width={60} height={240} fill="#f4efe6" {...LINE} />
            <path d={`M${x - 10},${top} L${x + 30},${top - 60} L${x + 70},${top} Z`} fill="#7c5cc4" {...LINE} />
            <path d={`M${x + 30},${top - 60} L${x + 30},${top - 84} L${x + 50},${top - 76} L${x + 30},${top - 70}`} fill="#e2b23a" {...LINE} strokeWidth={2} />
            <rect x={x + 20} y={top + 40} width={20} height={30} rx={10} fill="#8fb3e8" {...LINE} strokeWidth={2} />
          </g>
        ))}
        <rect x={310} y={200} width={210} height={180} fill="#fff8ec" {...LINE} />
        {[310, 352, 394, 436, 478].map((x) => <rect key={x} x={x} y={182} width={26} height={20} fill="#fff8ec" {...LINE} strokeWidth={2} />)}
        <path d="M385,380 L385,300 Q415,270 445,300 L445,380 Z" fill="#8a5a3b" {...LINE} />
      </g>
      {/* cloud floor */}
      <g fill="#fff" {...LINE}>
        <path d="M0,370 Q40,330 90,360 Q130,320 180,358 Q230,322 280,360 Q330,326 380,362 Q430,326 480,360 Q530,322 580,358 Q630,326 680,360 Q730,330 800,356 L800,500 L0,500 Z" />
      </g>
      <g fill="#fff" opacity={0.85}>
        <ellipse cx={100} cy={120} rx={70} ry={26} />
        <ellipse cx={700} cy={90} rx={60} ry={22} />
        <ellipse cx={690} cy={240} rx={50} ry={18} />
      </g>
      <path d="M40,260 Q120,170 200,260" fill="none" stroke="#7fd1c7" strokeWidth={8} opacity={0.6} />
      <path d="M50,262 Q120,184 190,262" fill="none" stroke="#f5d97a" strokeWidth={8} opacity={0.6} />
      <path d="M60,264 Q120,198 180,264" fill="none" stroke="#c75d8e" strokeWidth={8} opacity={0.5} />
    </g>
  );
}

function Cafe() {
  return (
    <g>
      <rect width={800} height={500} fill="#fbeedd" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={i * 50} y={0} width={25} height={360} fill="#f6dfc4" />
      ))}
      <rect y={360} width={800} height={140} fill="#8a5a3b" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 80} y={360 + (i % 2) * 0} width={40} height={140} fill="#7a4e33" />
      ))}
      <path d="M0,360 L800,360" {...LINE} />
      {/* awning window */}
      <rect x={290} y={90} width={220} height={150} rx={8} fill="#8fd6e8" {...LINE} />
      <path d="M400,90 L400,240" {...LINE} />
      <path d="M270,90 L530,90 L520,50 L280,50 Z" fill="#1f9e95" {...LINE} />
      {[300, 340, 380, 420, 460, 500].map((x) => (
        <path key={x} d={`M${x},90 q10,16 20,0`} fill="#fff" {...LINE} strokeWidth={2} />
      ))}
      {/* menu board */}
      <rect x={40} y={70} width={160} height={200} rx={10} fill="#3b3355" stroke="#8a5a3b" strokeWidth={8} />
      <path d="M70,110 l100,0 M70,150 l70,0 M70,190 l90,0 M70,230 l60,0" stroke="#fff" strokeWidth={4} opacity={0.75} />
      {/* counter with cups */}
      <rect x={600} y={260} width={190} height={110} rx={8} fill="#e8866a" {...LINE} />
      <rect x={590} y={250} width={210} height={16} rx={6} fill="#f4efe6" {...LINE} />
      {[630, 690].map((x) => (
        <g key={x}>
          <rect x={x} y={220} width={30} height={30} rx={4} fill="#fff" {...LINE} strokeWidth={2} />
          <path d={`M${x + 8},214 q4,-8 0,-16 M${x + 20},214 q4,-8 0,-16`} fill="none" stroke="#b9b9cc" strokeWidth={2} />
        </g>
      ))}
      <path d="M750,250 Q740,200 760,180 Q775,210 760,250" fill="#4f8a4b" {...LINE} strokeWidth={2} />
      {/* string lights */}
      <path d="M0,30 Q200,70 400,30 T800,30" fill="none" {...LINE} strokeWidth={2} />
      {[60, 160, 260, 340, 460, 560, 660, 740].map((x, i) => (
        <circle key={x} cx={x} cy={44 + (i % 2) * 6} r={6} fill={['#f5d97a', '#e8866a', '#7fd1c7'][i % 3]} />
      ))}
    </g>
  );
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: 'bedroom', label: 'חדר שינה', mood: 'light', art: <Bedroom /> },
  { id: 'library', label: 'ספרייה', mood: 'light', art: <Library /> },
  { id: 'classroom', label: 'כיתה', mood: 'light', art: <Classroom /> },
  { id: 'schoolyard', label: 'חצר בית הספר', mood: 'light', art: <Schoolyard /> },
  { id: 'forest', label: 'יער קסום', mood: 'dark', art: <MagicForest /> },
  { id: 'treehouse', label: 'בית עץ', mood: 'light', art: <TreeHouse /> },
  { id: 'beach', label: 'חוף ים', mood: 'light', art: <Beach /> },
  { id: 'spaceship', label: 'חללית', mood: 'dark', art: <Spaceship /> },
  { id: 'castle', label: 'טירה בעננים', mood: 'light', art: <CloudCastle /> },
  { id: 'cafe', label: 'בית קפה', mood: 'light', art: <Cafe /> },
];

export function getBackground(id: string): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

export function BackgroundArt({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      {getBackground(id).art}
    </svg>
  );
}
