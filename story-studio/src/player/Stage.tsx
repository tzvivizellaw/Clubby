import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { Appearance, PropPlacement, Scene, Story } from '../model/types';
import { BackgroundArt } from '../assets/backgrounds';
import { CharacterArt } from '../assets/characterLibrary';
import { PropArt } from '../assets/props';

/** Character box width as a fraction of the stage width (before per-appearance scale). */
export const CHAR_WIDTH = 0.24;
export const PROP_WIDTH = 0.11;

export interface StageProps {
  story: Story;
  scene: Scene;
  /** Highlight a selected appearance/prop (editor). */
  selectedId?: string | null;
  /** Speaker that is currently talking (gets a soft spotlight). */
  speakingCharacterId?: string | null;
  onPointerDownItem?: (e: ReactPointerEvent, kind: 'appearance' | 'prop', id: string) => void;
  onSelectItem?: (kind: 'appearance' | 'prop', id: string) => void;
  overlay?: ReactNode;
  className?: string;
  label?: string;
  /** Stage key for scene-change animation. */
  animate?: boolean;
}

export function itemStyle(x: number, y: number, width: number, aspect: number, z: number): CSSProperties {
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    aspectRatio: `${1 / aspect}`,
    zIndex: z,
  };
}

export function Stage({
  story,
  scene,
  selectedId,
  speakingCharacterId,
  onPointerDownItem,
  onSelectItem,
  overlay,
  className,
  label,
  animate,
}: StageProps) {
  const interactive = !!onPointerDownItem;
  const charById = new Map(story.characters.map((c) => [c.id, c]));
  return (
    <div
      className={`hs-stage ${animate ? 'hs-stage--enter' : ''} ${className ?? ''}`}
      role="img"
      aria-label={label ?? `סצנה: ${scene.name}`}
    >
      <div className="hs-stage__bg">
        <BackgroundArt id={scene.backgroundId} />
      </div>
      {scene.props.map((p: PropPlacement, i) => (
        <div
          key={p.id}
          className={`hs-stage__item hs-stage__prop ${selectedId === p.id ? 'is-selected' : ''} ${interactive ? 'is-interactive' : ''}`}
          style={itemStyle(p.x, p.y, PROP_WIDTH * p.scale, 1, 1 + i)}
          onPointerDown={interactive ? (e) => onPointerDownItem!(e, 'prop', p.id) : undefined}
          onClick={onSelectItem ? () => onSelectItem('prop', p.id) : undefined}
        >
          <PropArt id={p.kind} />
        </div>
      ))}
      {scene.appearances.map((a: Appearance, i) => {
        const ch = charById.get(a.characterId);
        if (!ch) return null;
        const speaking = speakingCharacterId === a.characterId;
        return (
          <div
            key={a.id}
            className={`hs-stage__item hs-stage__char ${selectedId === a.id ? 'is-selected' : ''} ${interactive ? 'is-interactive' : ''} ${speaking ? 'is-speaking' : ''}`}
            style={itemStyle(a.x, a.y, CHAR_WIDTH * a.scale, 1.5, 20 + i)}
            onPointerDown={interactive ? (e) => onPointerDownItem!(e, 'appearance', a.id) : undefined}
            onClick={onSelectItem ? () => onSelectItem('appearance', a.id) : undefined}
          >
            <div className="hs-stage__flip" style={{ transform: a.flip ? 'scaleX(-1)' : undefined }}>
              <CharacterArt kind={ch.kind} colors={ch.colors} expression={a.expression} />
            </div>
          </div>
        );
      })}
      {overlay}
    </div>
  );
}
