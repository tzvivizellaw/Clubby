import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Story } from '../model/types';
import { getScene } from '../model/ops';
import { Icon } from '../ui/icons';
import {
  advance,
  back,
  canGoBack,
  choose,
  currentScene,
  endingName,
  initialState,
  isAtChoices,
  restart,
  start,
  totalEndings,
  type PlayerState,
} from './engine';
import { Stage } from './Stage';
import { Dialogue, chooseDialogueMode } from './Dialogue';
import { useElementWidth, useTypewriter } from './hooks';
import { loadSettings, prefersReducedMotion, saveSettings, type PlayerSettings } from './settings';
import { playCue } from './sound';

export interface StoryPlayerProps {
  story: Story;
  /** When set, shows "back to the editor" buttons. */
  onExit?: () => void;
  exitLabel?: string;
  /** Opens a specific scene in the editor (used to fix a missing link). */
  onEditScene?: (sceneId: string) => void;
  /** Start straight in the story, skipping the cover. */
  skipCover?: boolean;
}

export function StoryPlayer({ story, onExit, exitLabel = 'חזרה ליצירה', onEditScene, skipCover }: StoryPlayerProps) {
  const [state, setState] = useState<PlayerState>(() => {
    const s = initialState(story);
    return skipCover ? start(story, s) : s;
  });
  const [settings, setSettings] = useState<PlayerSettings>(loadSettings);
  const [stageRef, stageWidth] = useElementWidth<HTMLDivElement>();
  const mainRef = useRef<HTMLDivElement>(null);

  const scene = currentScene(story, state);
  const line = state.phase === 'playing' && scene ? scene.lines[state.lineIndex] : undefined;
  const atChoices = isAtChoices(story, state);
  const lineText = line?.text ?? '';
  const typing = useTypewriter(lineText, settings.typing && !!line, `${state.sceneId}:${state.lineIndex}`);

  const updateSettings = (patch: Partial<PlayerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const onNext = useCallback(() => {
    if (state.phase !== 'playing') return;
    if (line && !typing.done) {
      typing.finish();
      return;
    }
    const next = advance(story, state);
    if (next === state) return;
    if (next.phase === 'ending') playCue('ending', settings.sound);
    else if (next.sceneId !== state.sceneId) playCue('scene', settings.sound);
    else playCue('tap', settings.sound);
    setState(next);
  }, [state, line, typing, story, settings.sound]);

  const onChoose = (optionId: string) => {
    playCue('choice', settings.sound);
    setState((s) => choose(story, s, optionId));
  };

  const onBack = () => setState((s) => back(s));
  const onRestart = () => setState((s) => start(story, restart(story, s)));

  // Keyboard: Enter/Space/← = next (RTL), → = back.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (state.phase !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'Enter' || e.key === ' ') {
        if (!atChoices) {
          e.preventDefault();
          onNext();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setState((s) => back(s));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.phase, atChoices, onNext]);

  // Move focus to the main area when the scene changes, for keyboard and screen-reader users.
  useEffect(() => {
    if (state.phase === 'ending' || state.phase === 'stuck') mainRef.current?.focus();
  }, [state.phase]);

  const coverScene = getScene(story, story.cover.sceneId) ?? getScene(story, story.startSceneId) ?? story.scenes[0];
  const endings = totalEndings(story);
  const reduced = useMemo(prefersReducedMotion, []);

  const toolbar = (
    <div className="hs-player__bar">
      {onExit && (
        <button type="button" className="hs-btn hs-btn--ghost" onClick={onExit}>
          <Icon name="edit" /> <span>{exitLabel}</span>
        </button>
      )}
      <h1 className="hs-player__title">{story.title}</h1>
      <div className="hs-player__tools">
        <button
          type="button"
          className="hs-iconbtn"
          onClick={onBack}
          disabled={!canGoBack(state)}
          aria-label="חזרה לצעד הקודם"
          title="חזרה לצעד הקודם"
        >
          <Icon name="back" />
        </button>
        <button type="button" className="hs-iconbtn" onClick={onRestart} aria-label="התחלה מחדש" title="התחלה מחדש">
          <Icon name="restart" />
        </button>
        <button
          type="button"
          className="hs-iconbtn"
          onClick={() => updateSettings({ typing: !settings.typing })}
          aria-pressed={settings.typing}
          aria-label={settings.typing ? 'כיבוי אנימציית הקלדה' : 'הפעלת אנימציית הקלדה'}
          title={settings.typing ? 'הקלדה: פועלת' : 'הקלדה: כבויה'}
        >
          <Icon name="typing" />
        </button>
        <button
          type="button"
          className="hs-iconbtn"
          onClick={() => {
            const on = !settings.sound;
            updateSettings({ sound: on });
            playCue('tap', on);
          }}
          aria-pressed={settings.sound}
          aria-label={settings.sound ? 'כיבוי צלילים' : 'הפעלת צלילים'}
          title={settings.sound ? 'צלילים: פועלים' : 'צלילים: כבויים'}
        >
          <Icon name={settings.sound ? 'sound' : 'mute'} />
        </button>
      </div>
    </div>
  );

  if (state.phase === 'cover') {
    return (
      <div className="hs-player" dir="rtl">
        <div className="hs-cover" style={{ ['--cover' as string]: story.cover.color }}>
          {onExit && (
            <button type="button" className="hs-btn hs-btn--ghost hs-cover__exit" onClick={onExit}>
              <Icon name="edit" /> <span>{exitLabel}</span>
            </button>
          )}
          <div className="hs-cover__book">
            {coverScene && (
              <div className="hs-cover__art">
                <Stage story={story} scene={coverScene} label={`כריכה: ${story.title}`} />
              </div>
            )}
            <div className="hs-cover__text">
              <h1 className="hs-cover__title">{story.title}</h1>
              {story.penName && <p className="hs-cover__author">מאת {story.penName}</p>}
              {story.description && <p className="hs-cover__desc">{story.description}</p>}
              <button type="button" className="hs-btn hs-btn--primary hs-btn--xl" onClick={() => setState((s) => start(story, s))} autoFocus>
                <Icon name="play" /> מתחילים
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="hs-player" dir="rtl">
        {toolbar}
        <div className="hs-player__msg">
          <p>אופס, לא מצאנו את הסצנה. אפשר להתחיל מחדש.</p>
          <button type="button" className="hs-btn hs-btn--primary" onClick={onRestart}>התחלה מחדש</button>
        </div>
      </div>
    );
  }

  const mode = line ? chooseDialogueMode(stageWidth, line.text) : 'card';
  const overlay = line && mode === 'overlay' ? <Dialogue story={story} scene={scene} line={line} visibleChars={typing.visible} mode="overlay" /> : null;

  return (
    <div className="hs-player" dir="rtl">
      {toolbar}
      <div className="hs-player__main" ref={mainRef} tabIndex={-1}>
        <div
          className="hs-player__stagewrap"
          ref={stageRef}
          onClick={state.phase === 'playing' && !atChoices ? onNext : undefined}
        >
          <Stage
            key={scene.id}
            story={story}
            scene={scene}
            animate={!reduced}
            speakingCharacterId={line && line.kind !== 'narration' ? line.characterId : null}
            overlay={overlay}
          />
          {state.phase === 'ending' && <Celebration reduced={reduced} />}
        </div>

        <div className="hs-player__below">
          {line && mode === 'card' && (
            <div className="hs-player__cardwrap" onClick={!atChoices ? onNext : undefined}>
              <Dialogue story={story} scene={scene} line={line} visibleChars={typing.visible} mode="card" />
            </div>
          )}
          <div className="hs-sr-only" aria-live="polite">
            {line ? `${line.kind === 'narration' ? '' : (story.characters.find((c) => c.id === line.characterId)?.name ?? '') + ': '}${line.text}` : ''}
          </div>

          {state.phase === 'playing' && !atChoices && (
            <div className="hs-player__actions">
              <button type="button" className="hs-btn hs-btn--primary hs-btn--xl" onClick={onNext}>
                {line && !typing.done ? 'הצג הכול' : 'הבא'} <Icon name="forward" />
              </button>
            </div>
          )}

          {atChoices && scene.next.type === 'choice' && (
            <div className="hs-choices" role="group" aria-label="מה עושים עכשיו?">
              {scene.next.prompt && <p className="hs-choices__prompt">{scene.next.prompt}</p>}
              {scene.next.options.map((o, i) => (
                <button key={o.id} type="button" className="hs-choice" onClick={() => onChoose(o.id)} autoFocus={i === 0}>
                  <span className="hs-choice__num" aria-hidden="true">{i + 1}</span>
                  <span>{o.text || 'בחירה ללא טקסט'}</span>
                </button>
              ))}
              {scene.next.options.length === 0 && <p>כאן עוד אין אפשרויות לבחירה.</p>}
            </div>
          )}

          {state.phase === 'stuck' && (
            <div className="hs-player__msg" role="status">
              <p className="hs-player__msg-title">להמשך הזה עוד אין סצנה.</p>
              <p>הסיפור עוד נכתב! אפשר לחזור צעד אחורה ולבחור דרך אחרת.</p>
              <div className="hs-row">
                <button type="button" className="hs-btn hs-btn--primary" onClick={onBack}>
                  <Icon name="back" /> חזרה לצעד הקודם
                </button>
                {onEditScene && (
                  <button type="button" className="hs-btn" onClick={() => onEditScene(scene.id)}>
                    <Icon name="edit" /> לתקן בעורך
                  </button>
                )}
              </div>
            </div>
          )}

          {state.phase === 'ending' && (
            <div className="hs-ending" role="status">
              <p className="hs-ending__kicker">גילית סוף!</p>
              <h2 className="hs-ending__name">{endingName(story, state)}</h2>
              {endings > 1 && (
                <p className="hs-ending__count">
                  גילית {state.endingsFound.length} מתוך {endings} סופים. רוצה לגלות סוף אחר?
                </p>
              )}
              <div className="hs-row hs-row--center">
                <button type="button" className="hs-btn hs-btn--primary hs-btn--xl" onClick={onRestart} autoFocus>
                  <Icon name="restart" /> שחקי שוב
                </button>
                <button type="button" className="hs-btn" onClick={onBack}>
                  <Icon name="back" /> חזרה לצעד הקודם
                </button>
                {onExit && (
                  <button type="button" className="hs-btn" onClick={onExit}>
                    <Icon name="edit" /> {exitLabel}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Celebration({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  const colors = ['#7c5cc4', '#1f9e95', '#e8866a', '#e2b23a', '#7fd1c7'];
  return (
    <div className="hs-celebrate" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.12}s`,
            borderRadius: i % 3 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
