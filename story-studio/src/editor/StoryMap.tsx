import { useMemo, useState } from 'react';
import type { Scene, Story } from '../model/types';
import { outgoing, reachableFrom, type Issue } from '../model/validate';
import { Icon } from '../ui/icons';

interface Node {
  scene: Scene;
  col: number;
  row: number;
  reachable: boolean;
}

const W = 168;
const H = 70;
const GX = 80;
const GY = 26;

/** Columns by distance from the start scene; unreachable scenes go in a separate last column. */
export function layoutMap(story: Story): { nodes: Node[]; cols: number; rows: number } {
  const byId = new Map(story.scenes.map((s) => [s.id, s]));
  const depth = new Map<string, number>();
  if (byId.has(story.startSceneId)) {
    const queue = [story.startSceneId];
    depth.set(story.startSceneId, 0);
    while (queue.length) {
      const id = queue.shift()!;
      for (const t of outgoing(byId.get(id)!)) {
        if (t && byId.has(t) && !depth.has(t)) {
          depth.set(t, depth.get(id)! + 1);
          queue.push(t);
        }
      }
    }
  }
  const reachable = reachableFrom(story, story.startSceneId);
  const maxDepth = Math.max(0, ...depth.values());
  const rowsPerCol = new Map<number, number>();
  const nodes: Node[] = story.scenes.map((scene) => {
    const col = depth.has(scene.id) ? depth.get(scene.id)! : maxDepth + 1;
    const row = rowsPerCol.get(col) ?? 0;
    rowsPerCol.set(col, row + 1);
    return { scene, col, row, reachable: reachable.has(scene.id) };
  });
  return { nodes, cols: Math.max(...nodes.map((n) => n.col)) + 1, rows: Math.max(...rowsPerCol.values()) };
}

function SeverityBadge({ s }: { s: Issue['severity'] }) {
  const map = {
    blocker: ['חוסם משחק', 'warning'],
    problem: ['כדאי לתקן', 'warning'],
    tip: ['רעיון לשיפור', 'info'],
  } as const;
  return (
    <span className={`sev sev--${s}`}>
      <Icon name={map[s][1]} size={16} /> {map[s][0]}
    </span>
  );
}

export function IssuesList({ issues, onFix, story }: { issues: Issue[]; onFix: (i: Issue) => void; story: Story }) {
  if (!issues.length) {
    return (
      <p className="all-good">
        <Icon name="check" /> כל המסלולים מחוברים, ויש סוף שאפשר להגיע אליו. מעולה!
      </p>
    );
  }
  return (
    <ul className="issues">
      {issues.map((i) => (
        <li key={i.key} className={`issue issue--${i.severity}`}>
          <SeverityBadge s={i.severity} />
          <span className="issue__text">{i.message}</span>
          {i.sceneId && story.scenes.some((s) => s.id === i.sceneId) && (
            <button type="button" className="hs-btn hs-btn--sm" onClick={() => onFix(i)}>
              {i.code === 'unreachable' ? 'פתחי' : 'לתיקון'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StoryMap({ story, issues, onOpenScene }: { story: Story; issues: Issue[]; onOpenScene: (id: string) => void }) {
  const [view, setView] = useState<'map' | 'list'>(() => (typeof window !== 'undefined' && window.innerWidth < 720 ? 'list' : 'map'));
  const { nodes, cols, rows } = useMemo(() => layoutMap(story), [story]);
  const byId = new Map(nodes.map((n) => [n.scene.id, n]));
  const issueScenes = new Set(issues.filter((i) => i.severity !== 'tip' || i.code === 'unreachable').map((i) => i.sceneId));
  const width = cols * (W + GX);
  const height = rows * (H + GY) + 40;
  // RTL: column 0 on the right.
  const pos = (n: Node) => ({ x: width - GX / 2 - W - n.col * (W + GX), y: 20 + n.row * (H + GY) });
  const sceneName = (id: string | null) => (id ? (story.scenes.find((s) => s.id === id)?.name ?? 'סצנה שנמחקה') : null);

  return (
    <div className="map">
      <div className="seg map__toggle" role="radiogroup" aria-label="תצוגה">
        <button type="button" role="radio" aria-checked={view === 'map'} className={`seg__btn ${view === 'map' ? 'is-on' : ''}`} onClick={() => setView('map')}>
          מפה
        </button>
        <button type="button" role="radio" aria-checked={view === 'list'} className={`seg__btn ${view === 'list' ? 'is-on' : ''}`} onClick={() => setView('list')}>
          רשימת קשרים
        </button>
      </div>

      {view === 'map' ? (
        <div className="map__scroll" dir="ltr">
          <div className="map__canvas" style={{ width, height }}>
            <svg width={width} height={height} className="map__edges" aria-hidden="true">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="#5a5272" />
                </marker>
                <marker id="arrow-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="#b3362f" />
                </marker>
              </defs>
              {nodes.flatMap((n) => {
                const p = pos(n);
                const sx = p.x;
                const outs = n.scene.next.type === 'goto' ? [{ key: 'g', target: n.scene.next.target, label: '' }] : n.scene.next.type === 'choice' ? n.scene.next.options.map((o) => ({ key: o.id, target: o.target, label: o.text })) : [];
                return outs.map((o, i) => {
                  const sy = p.y + H / 2 + (outs.length > 1 ? (i - (outs.length - 1) / 2) * 16 : 0);
                  const t = o.target ? byId.get(o.target) : undefined;
                  if (!t) {
                    return (
                      <g key={`${n.scene.id}-${o.key}`}>
                        <path d={`M${sx},${sy} l-34,0`} stroke="#b3362f" strokeWidth={2.5} strokeDasharray="5 4" fill="none" markerEnd="url(#arrow-warn)" />
                        <text x={sx - 46} y={sy + 5} fill="#b3362f" fontSize={16} fontWeight={700}>?</text>
                      </g>
                    );
                  }
                  const tp = pos(t);
                  const forward = t.col > n.col;
                  const tx = forward ? tp.x + W : tp.x + W / 2;
                  const ty = forward ? tp.y + H / 2 : tp.y + H;
                  const d = forward
                    ? `M${sx},${sy} C${sx - GX / 1.6},${sy} ${tx + GX / 1.6},${ty} ${tx},${ty}`
                    : `M${sx + W / 2},${p.y + H} C${sx + W / 2},${p.y + H + 50} ${tx},${ty + 50} ${tx},${ty + 4}`;
                  return (
                    <g key={`${n.scene.id}-${o.key}`}>
                      <path d={d} stroke="#5a5272" strokeWidth={2.2} fill="none" markerEnd="url(#arrow)" opacity={forward ? 1 : 0.65} />
                      {o.label && forward && (
                        <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 6} textAnchor="middle" fontSize={12} fill="#2b2340" className="map__edge-label" direction="rtl">
                          {o.label.length > 16 ? o.label.slice(0, 15) + '…' : o.label}
                        </text>
                      )}
                    </g>
                  );
                });
              })}
            </svg>
            {nodes.map((n) => {
              const p = pos(n);
              const isStart = n.scene.id === story.startSceneId;
              const isEnd = n.scene.next.type === 'end';
              return (
                <button
                  key={n.scene.id}
                  type="button"
                  dir="rtl"
                  className={`map-node ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''} ${!n.reachable ? 'is-unreachable' : ''}`}
                  style={{ left: p.x, top: p.y, width: W, height: H }}
                  onClick={() => onOpenScene(n.scene.id)}
                  aria-label={`${n.scene.name}${isStart ? ', סצנת הפתיחה' : ''}${isEnd ? ', סיום' : ''}${!n.reachable ? ', אי אפשר להגיע אליה' : ''}. פתיחה לעריכה`}
                >
                  <span className="map-node__name">{n.scene.name}</span>
                  <span className="map-node__badges">
                    {isStart && (
                      <span className="badge badge--start">
                        <Icon name="play" size={14} /> פתיחה
                      </span>
                    )}
                    {isEnd && n.scene.next.type === 'end' && (
                      <span className="badge badge--end">
                        <Icon name="flag" size={14} /> {n.scene.next.endingName || 'סוף'}
                      </span>
                    )}
                    {issueScenes.has(n.scene.id) && (
                      <span className="badge badge--warn">
                        <Icon name="warning" size={14} /> בדיקה
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <ol className="map-list">
          {story.scenes.map((s) => {
            const isStart = s.id === story.startSceneId;
            return (
              <li key={s.id} className="map-list__item">
                <button type="button" className="map-list__name" onClick={() => onOpenScene(s.id)}>
                  {s.name}
                  {isStart && <span className="badge badge--start"><Icon name="play" size={14} /> פתיחה</span>}
                  {s.next.type === 'end' && <span className="badge badge--end"><Icon name="flag" size={14} /> {s.next.endingName || 'סוף'}</span>}
                </button>
                <ul className="map-list__links">
                  {s.next.type === 'goto' && <li>ממשיכה אל: {sceneName(s.next.target) ?? <strong className="warn-text">עוד אין המשך</strong>}</li>}
                  {s.next.type === 'choice' &&
                    s.next.options.map((o) => (
                      <li key={o.id}>
                        ״{o.text || 'בחירה ללא טקסט'}״ ← {sceneName(o.target) ?? <strong className="warn-text">עוד אין המשך</strong>}
                      </li>
                    ))}
                  {s.next.type === 'end' && <li>כאן הסיפור נגמר.</li>}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
