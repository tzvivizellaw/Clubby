import { useState } from 'react';
import { ideaText, randomIdea, randomTwist, type Idea, type IdeaPart } from '../content/ideas';
import { Icon } from '../ui/icons';
import { playCue } from '../player/sound';
import { loadSettings, prefersReducedMotion } from '../player/settings';

const PARTS: { key: IdeaPart; label: string }[] = [
  { key: 'hero', label: 'גיבורה' },
  { key: 'place', label: 'מקום' },
  { key: 'event', label: 'אירוע מפתיע' },
  { key: 'mission', label: 'משימה' },
];

function partText(idea: Idea, key: IdeaPart): string {
  if (key === 'hero') return idea.hero.text;
  if (key === 'place') return idea.place.text;
  if (key === 'event') return idea.event.obj;
  return idea.mission;
}

function Jar({ shaking }: { shaking: boolean }) {
  return (
    <svg viewBox="0 0 160 190" className={`jar ${shaking ? 'jar--shake' : ''}`} aria-hidden="true">
      <rect x={44} y={10} width={72} height={22} rx={8} fill="#8a5a3b" stroke="#2b2340" strokeWidth={3} />
      <path d="M40,34 L120,34 Q140,40 140,70 L140,160 Q140,182 116,182 L44,182 Q20,182 20,160 L20,70 Q20,40 40,34 Z" fill="#dcf3f0" stroke="#2b2340" strokeWidth={3} />
      <path d="M34,70 Q34,52 50,48" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      {[
        [56, 150, '#7c5cc4'],
        [90, 160, '#e8866a'],
        [110, 132, '#e2b23a'],
        [64, 118, '#1f9e95'],
        [96, 104, '#c75d8e'],
        [50, 90, '#f5d97a'],
      ].map(([x, y, c], i) => (
        <rect key={i} x={Number(x) - 14} y={Number(y) - 9} width={28} height={18} rx={4} fill={String(c)} stroke="#2b2340" strokeWidth={2} transform={`rotate(${(i * 23) % 40 - 20} ${x} ${y})`} />
      ))}
      <path d="M116,60 l4,8 8,2 -8,3 -3,8 -3,-8 -8,-3 8,-2z" fill="#f5d97a" stroke="#2b2340" strokeWidth={1.5} />
    </svg>
  );
}

/** The idea jar: local random ideas with lockable parts, plus twist suggestions. */
export function IdeaJar({ onUse, useLabel }: { onUse: (idea: Idea, text: string) => void; useLabel: string }) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [locked, setLocked] = useState<Partial<Record<IdeaPart, boolean>>>({});
  const [shaking, setShaking] = useState(false);
  const [twist, setTwist] = useState<string | null>(null);

  const draw = () => {
    playCue('tap', loadSettings().sound);
    if (!prefersReducedMotion()) {
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
    }
    setIdea((prev) => randomIdea(prev ?? undefined, locked));
  };

  return (
    <div className="ideajar">
      <button type="button" className="ideajar__jar" onClick={draw} aria-label={idea ? 'עוד רעיון מהצנצנת' : 'שלפי רעיון מהצנצנת'}>
        <Jar shaking={shaking} />
        <span className="ideajar__cta">{idea ? 'עוד רעיון' : 'לחצי על הצנצנת!'}</span>
      </button>

      {idea && (
        <div className="idea-card" aria-live="polite">
          <p className="idea-card__text">{ideaText(idea)}</p>
          <ul className="idea-parts">
            {PARTS.map((p) => (
              <li key={p.key} className={`idea-part ${locked[p.key] ? 'is-locked' : ''}`}>
                <span className="idea-part__label">{p.label}</span>
                <span className="idea-part__text">{partText(idea, p.key)}</span>
                <button
                  type="button"
                  className="hs-btn hs-btn--sm"
                  aria-pressed={!!locked[p.key]}
                  onClick={() => setLocked((l) => ({ ...l, [p.key]: !l[p.key] }))}
                >
                  <Icon name={locked[p.key] ? 'lock' : 'pin'} size={16} /> {locked[p.key] ? 'נשמר' : 'שמרי'}
                </button>
              </li>
            ))}
          </ul>
          <p className="hint">שמרי את מה שאהבת, ולחצי ״עוד רעיון״ כדי להגריל רק את השאר.</p>
          <div className="hs-row">
            <button type="button" className="hs-btn" onClick={draw}>
              <Icon name="dice" /> עוד רעיון
            </button>
            <button type="button" className="hs-btn hs-btn--primary" onClick={() => onUse(idea, ideaText(idea))}>
              <Icon name="sparkle" /> {useLabel}
            </button>
          </div>
        </div>
      )}

      <div className="twist">
        <button type="button" className="hs-btn hs-btn--teal" onClick={() => setTwist((t) => randomTwist(t ?? undefined))}>
          <Icon name="sparkle" /> צריכה טוויסט?
        </button>
        {twist && (
          <p className="twist__text" aria-live="polite">
            {twist}
          </p>
        )}
      </div>
    </div>
  );
}
