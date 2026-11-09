import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { Line, Scene, Story } from '../model/types';
import { clampPosition } from '../model/ops';
import { Stage } from '../player/Stage';
import { Dialogue, chooseDialogueMode } from '../player/Dialogue';
import { useElementWidth } from '../player/hooks';

export type Selection = { kind: 'appearance' | 'prop'; id: string } | null;

interface Props {
  story: Story;
  scene: Scene;
  selection: Selection;
  onSelect: (s: Selection) => void;
  updateScene: (fn: (s: Scene) => Scene, coalesce?: string) => void;
  previewLine: Line | null;
}

export function moveItem(scene: Scene, sel: NonNullable<Selection>, x: number, y: number): Scene {
  const p = clampPosition(x, y);
  if (sel.kind === 'appearance') {
    return { ...scene, appearances: scene.appearances.map((a) => (a.id === sel.id ? { ...a, x: p.x, y: p.y } : a)) };
  }
  return { ...scene, props: scene.props.map((a) => (a.id === sel.id ? { ...a, x: p.x, y: p.y } : a)) };
}

export function itemPos(scene: Scene, sel: NonNullable<Selection>) {
  const item = sel.kind === 'appearance' ? scene.appearances.find((a) => a.id === sel.id) : scene.props.find((p) => p.id === sel.id);
  return item ? { x: item.x, y: item.y } : null;
}

/** The editable stage: drag with mouse or touch, or move the selected item with arrow keys. */
export function EditorStage({ story, scene, selection, onSelect, updateScene, previewLine }: Props) {
  const [wrapCallbackRef, width, wrapRef] = useElementWidth<HTMLDivElement>();
  const drag = useRef<{ sel: NonNullable<Selection>; dx: number; dy: number } | null>(null);

  const relPoint = (e: ReactPointerEvent) => {
    const stage = wrapRef.current?.querySelector('.hs-stage');
    const rect = stage?.getBoundingClientRect();
    if (!rect || !rect.width) return null;
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const onPointerDownItem = (e: ReactPointerEvent, kind: 'appearance' | 'prop', id: string) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    const sel = { kind, id };
    onSelect(sel);
    const pt = relPoint(e);
    const pos = itemPos(scene, sel);
    if (!pt || !pos) return;
    drag.current = { sel, dx: pos.x - pt.x, dy: pos.y - pt.y };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* not critical */
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const pt = relPoint(e);
    if (!pt) return;
    e.preventDefault();
    updateScene((s) => moveItem(s, d.sel, pt.x + d.dx, pt.y + d.dy), `drag:${d.sel.id}`);
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!selection) return;
    const step = e.shiftKey ? 0.08 : 0.02;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const dlt = delta[e.key];
    if (!dlt) {
      if (e.key === 'Escape') onSelect(null);
      return;
    }
    e.preventDefault();
    const pos = itemPos(scene, selection);
    if (pos) updateScene((s) => moveItem(s, selection, pos.x + dlt[0], pos.y + dlt[1]), `key:${selection.id}`);
  };

  const mode = previewLine ? chooseDialogueMode(width, previewLine.text) : 'card';
  const overlay =
    previewLine && mode === 'overlay' ? (
      <Dialogue story={story} scene={scene} line={previewLine} mode="overlay" placeholder="(כאן יופיע הטקסט)" />
    ) : null;

  const selectedName = (() => {
    if (!selection) return null;
    if (selection.kind === 'prop') return 'אביזר';
    const a = scene.appearances.find((x) => x.id === selection.id);
    return story.characters.find((c) => c.id === a?.characterId)?.name ?? null;
  })();

  return (
    <div className="ed-stage" ref={wrapCallbackRef}>
      <div
        className="ed-stage__frame"
        tabIndex={0}
        role="application"
        aria-label={`הבמה של הסצנה ״${scene.name}״. ${selectedName ? `נבחרה: ${selectedName}. הזיזי בעזרת החיצים.` : 'לחצי על דמות כדי לבחור בה.'}`}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(e) => {
          if (!(e.target as Element).closest('.hs-stage__item')) onSelect(null);
        }}
        onKeyDown={onKeyDown}
      >
        <Stage
          story={story}
          scene={scene}
          selectedId={selection?.id}
          onPointerDownItem={onPointerDownItem}
          speakingCharacterId={previewLine?.characterId ?? null}
          overlay={overlay}
        />
      </div>
      {previewLine && mode === 'card' && (
        <Dialogue story={story} scene={scene} line={previewLine} mode="card" placeholder="(כאן יופיע הטקסט)" />
      )}
    </div>
  );
}
