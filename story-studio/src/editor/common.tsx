import type { Scene, Story } from '../model/types';
import { LIMITS } from '../model/types';
import { clamp, clampPosition, moveInArray } from '../model/ops';
import { Icon } from '../ui/icons';
import type { Selection } from './EditorStage';

export type UpdateStory = (fn: (s: Story) => Story, coalesce?: string) => void;
export type UpdateScene = (fn: (s: Scene) => Scene, coalesce?: string) => void;

/** Position / size / layer controls shared by characters and props — everything works without dragging. */
export function ItemControls({ scene, selection, updateScene }: { scene: Scene; selection: NonNullable<Selection>; updateScene: UpdateScene }) {
  const list = selection.kind === 'appearance' ? scene.appearances : scene.props;
  const index = list.findIndex((i) => i.id === selection.id);
  const item = list[index];
  if (!item) return null;

  const patch = (p: Partial<{ x: number; y: number; scale: number }>, key?: string) =>
    updateScene((s) => {
      const fix = <T extends { id: string; x: number; y: number; scale: number }>(arr: T[]) =>
        arr.map((a) => {
          if (a.id !== selection.id) return a;
          const merged = { ...a, ...p };
          const pos = clampPosition(merged.x, merged.y);
          return { ...merged, ...pos, scale: clamp(merged.scale, LIMITS.minScale, LIMITS.maxScale) };
        });
      return selection.kind === 'appearance' ? { ...s, appearances: fix(s.appearances) } : { ...s, props: fix(s.props) };
    }, key);

  const layer = (delta: number) =>
    updateScene((s) =>
      selection.kind === 'appearance'
        ? { ...s, appearances: moveInArray(s.appearances, index, delta) }
        : { ...s, props: moveInArray(s.props, index, delta) },
    );

  const step = 0.04;
  return (
    <div className="ctl">
      <div className="ctl__group" role="group" aria-label="מיקום">
        <span className="ctl__label">מיקום</span>
        <div className="seg">
          <button type="button" className={`seg__btn ${item.x > 0.66 ? 'is-on' : ''}`} onClick={() => patch({ x: 0.78 })}>ימין</button>
          <button type="button" className={`seg__btn ${item.x >= 0.34 && item.x <= 0.66 ? 'is-on' : ''}`} onClick={() => patch({ x: 0.5 })}>מרכז</button>
          <button type="button" className={`seg__btn ${item.x < 0.34 ? 'is-on' : ''}`} onClick={() => patch({ x: 0.22 })}>שמאל</button>
        </div>
      </div>
      <div className="ctl__group">
        <span className="ctl__label">הזזה עדינה</span>
        <div className="nudge">
          <button type="button" className="hs-iconbtn" aria-label="הזזה למעלה" onClick={() => patch({ y: item.y - step }, `nudge:${item.id}`)}>
            <Icon name="up" />
          </button>
          <button type="button" className="hs-iconbtn" aria-label="הזזה ימינה" onClick={() => patch({ x: item.x + step }, `nudge:${item.id}`)}>
            <Icon name="back" />
          </button>
          <button type="button" className="hs-iconbtn" aria-label="הזזה שמאלה" onClick={() => patch({ x: item.x - step }, `nudge:${item.id}`)}>
            <Icon name="forward" />
          </button>
          <button type="button" className="hs-iconbtn" aria-label="הזזה למטה" onClick={() => patch({ y: item.y + step }, `nudge:${item.id}`)}>
            <Icon name="down" />
          </button>
        </div>
      </div>
      <div className="ctl__group">
        <span className="ctl__label">גודל</span>
        <div className="hs-row">
          <button type="button" className="hs-btn hs-btn--sm" aria-label="הקטנה" onClick={() => patch({ scale: item.scale - 0.1 }, `size:${item.id}`)} disabled={item.scale <= LIMITS.minScale + 0.001}>
            −
          </button>
          <span className="ctl__value" aria-live="polite">{Math.round(item.scale * 100)}%</span>
          <button type="button" className="hs-btn hs-btn--sm" aria-label="הגדלה" onClick={() => patch({ scale: item.scale + 0.1 }, `size:${item.id}`)} disabled={item.scale >= LIMITS.maxScale - 0.001}>
            +
          </button>
        </div>
      </div>
      <div className="ctl__group">
        <span className="ctl__label">שכבות</span>
        <div className="hs-row">
          <button type="button" className="hs-btn hs-btn--sm" onClick={() => layer(1)} disabled={index >= list.length - 1}>
            <Icon name="front" size={18} /> קדימה
          </button>
          <button type="button" className="hs-btn hs-btn--sm" onClick={() => layer(-1)} disabled={index <= 0}>
            <Icon name="backLayer" size={18} /> אחורה
          </button>
        </div>
      </div>
    </div>
  );
}

export function Swatches({ colors, value, onPick, label }: { colors: string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {colors.map((c, i) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === c.toLowerCase()}
          aria-label={`${label}: צבע ${i + 1}`}
          className="swatch"
          style={{ background: c }}
          onClick={() => onPick(c)}
        >
          {value.toLowerCase() === c.toLowerCase() && <Icon name="check" size={16} />}
        </button>
      ))}
    </div>
  );
}
