import type { Line, Scene, Story } from '../model/types';
import { clamp } from '../model/ops';

export type DialogueMode = 'overlay' | 'card';

/** Short lines on wide stages become comic bubbles; everything else a readable card under the stage. */
export function chooseDialogueMode(stageWidth: number, text: string): DialogueMode {
  if (stageWidth < 560) return 'card';
  if (text.length > 120) return 'card';
  return 'overlay';
}

export function speakerName(story: Story, line: Line): string | null {
  if (line.kind === 'narration' || !line.characterId) return null;
  return story.characters.find((c) => c.id === line.characterId)?.name ?? null;
}

function speakerX(scene: Scene, line: Line): number | null {
  if (!line.characterId) return null;
  const a = scene.appearances.find((ap) => ap.characterId === line.characterId);
  return a ? a.x : null;
}

interface DialogueProps {
  story: Story;
  scene: Scene;
  line: Line;
  /** Number of visible characters (typing effect). Undefined = all. */
  visibleChars?: number;
  mode: DialogueMode;
  placeholder?: string;
}

/** Renders user text strictly as text (React escapes it) — never as HTML. */
function TypedText({ text, visibleChars }: { text: string; visibleChars?: number }) {
  const shown = visibleChars === undefined ? text : text.slice(0, visibleChars);
  const rest = visibleChars === undefined ? '' : text.slice(visibleChars);
  return (
    <p className="hs-dialogue__text">
      {shown}
      {rest && <span className="hs-ghost" aria-hidden="true">{rest}</span>}
    </p>
  );
}

export function Dialogue({ story, scene, line, visibleChars, mode, placeholder }: DialogueProps) {
  const name = speakerName(story, line);
  const x = speakerX(scene, line);
  const text = line.text || placeholder || '';
  const kindClass = `hs-dialogue--${line.kind}`;

  if (mode === 'overlay') {
    const anchor = x ?? 0.5;
    const left = line.kind === 'narration' ? 0.5 : clamp(anchor, 0.27, 0.73);
    const tailOffset = clamp((anchor - left) * 100, -18, 18);
    return (
      <div
        className={`hs-dialogue hs-dialogue--overlay ${kindClass}`}
        style={{ left: `${left * 100}%`, ['--tail' as string]: `${50 + tailOffset * 2}%` }}
      >
        {name && <span className="hs-dialogue__name">{name}</span>}
        <TypedText text={text} visibleChars={visibleChars} />
        {line.kind !== 'narration' && x !== null && <span className="hs-dialogue__tail" aria-hidden="true" />}
      </div>
    );
  }

  return (
    <div
      className={`hs-dialogue hs-dialogue--card ${kindClass}`}
      style={x !== null && line.kind !== 'narration' ? { ['--tail' as string]: `${x * 100}%` } : undefined}
    >
      {line.kind !== 'narration' && x !== null && <span className="hs-dialogue__tail" aria-hidden="true" />}
      {name && <span className="hs-dialogue__name">{name}{line.kind === 'thought' ? ' · מחשבה' : ''}</span>}
      {line.kind === 'narration' && <span className="hs-dialogue__name hs-dialogue__name--narrator">המספרת</span>}
      <TypedText text={text} visibleChars={visibleChars} />
    </div>
  );
}
