import { useState } from 'react';
import type { Expression, Line, LineKind, Scene, SceneNext, Story } from '../model/types';
import { EXPRESSIONS, LIMITS } from '../model/types';
import { BACKGROUNDS, BackgroundArt } from '../assets/backgrounds';
import { CHARACTER_KINDS, CharacterArt, HAIR_PALETTE, PALETTE, getCharacterKind } from '../assets/characterLibrary';
import { PROPS, PropArt, getProp } from '../assets/props';
import { createAppearance, createCharacter, createLine, createScene } from '../model/factory';
import { addScene, moveInArray, removeCharacter, updateScene as updateSceneIn } from '../model/ops';
import { newId } from '../model/ids';
import { Icon } from '../ui/icons';
import { ItemControls, Swatches, type UpdateScene, type UpdateStory } from './common';
import type { Selection } from './EditorStage';
import { playCue } from '../player/sound';
import { loadSettings } from '../player/settings';

const cue = (c: 'add' | 'tap') => playCue(c, loadSettings().sound);

/* ------------------------------------------------------------------ */
/* Background + props                                                   */
/* ------------------------------------------------------------------ */

export function BackgroundPanel({
  scene,
  updateScene,
  selection,
  onSelect,
}: {
  scene: Scene;
  updateScene: UpdateScene;
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const selectedProp = selection?.kind === 'prop' ? scene.props.find((p) => p.id === selection.id) : undefined;
  return (
    <div className="panel">
      <h3 className="panel__title">איפה זה קורה?</h3>
      <div className="thumbs" role="radiogroup" aria-label="רקע">
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={scene.backgroundId === b.id}
            className={`thumb ${scene.backgroundId === b.id ? 'is-on' : ''}`}
            onClick={() => updateScene((s) => ({ ...s, backgroundId: b.id }))}
          >
            <span className="thumb__art thumb__art--wide">
              <BackgroundArt id={b.id} />
            </span>
            <span className="thumb__label">{b.label}</span>
          </button>
        ))}
      </div>

      <h3 className="panel__title">אביזרים</h3>
      {selectedProp && (
        <div className="selected-box">
          <div className="selected-box__head">
            <span className="mini-art"><PropArt id={selectedProp.kind} /></span>
            <strong>{getProp(selectedProp.kind).label}</strong>
            <button
              type="button"
              className="hs-btn hs-btn--sm hs-btn--danger"
              onClick={() => {
                updateScene((s) => ({ ...s, props: s.props.filter((p) => p.id !== selectedProp.id) }));
                onSelect(null);
              }}
            >
              <Icon name="trash" size={18} /> הסירי
            </button>
          </div>
          <ItemControls scene={scene} selection={selection!} updateScene={updateScene} />
        </div>
      )}
      <p className="hint">לחצי על אביזר כדי להוסיף אותו לסצנה. אפשר לגרור אותו על הבמה.</p>
      <div className="thumbs thumbs--small">
        {PROPS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="thumb"
            disabled={scene.props.length >= LIMITS.maxPropsPerScene}
            onClick={() => {
              const id = newId('prop');
              const offset = (scene.props.length % 4) * 0.08;
              updateScene((s) => ({ ...s, props: [...s.props, { id, kind: p.id, x: 0.38 + offset, y: 0.9, scale: 1 }] }));
              onSelect({ kind: 'prop', id });
              cue('add');
            }}
          >
            <span className="thumb__art thumb__art--square">
              <PropArt id={p.id} />
            </span>
            <span className="thumb__label">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Characters                                                           */
/* ------------------------------------------------------------------ */

export function CharactersPanel({
  story,
  scene,
  update,
  updateScene,
  selection,
  onSelect,
}: {
  story: Story;
  scene: Scene;
  update: UpdateStory;
  updateScene: UpdateScene;
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const [showLibrary, setShowLibrary] = useState(story.characters.length === 0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openColors, setOpenColors] = useState<string | null>(null);
  const selectedApp = selection?.kind === 'appearance' ? scene.appearances.find((a) => a.id === selection.id) : undefined;
  const selectedChar = selectedApp ? story.characters.find((c) => c.id === selectedApp.characterId) : undefined;
  const full = scene.appearances.length >= LIMITS.maxAppearancesPerScene;

  const addToScene = (characterId: string) => {
    const xs = [0.5, 0.25, 0.75, 0.38, 0.62, 0.15, 0.85, 0.5];
    const app = createAppearance(characterId, xs[scene.appearances.length % xs.length]);
    updateScene((s) => ({ ...s, appearances: [...s.appearances, app] }));
    onSelect({ kind: 'appearance', id: app.id });
    cue('add');
  };

  const setExpression = (expression: Expression) =>
    updateScene((s) => ({ ...s, appearances: s.appearances.map((a) => (a.id === selectedApp!.id ? { ...a, expression } : a)) }));

  return (
    <div className="panel">
      {selectedApp && selectedChar && (
        <div className="selected-box">
          <div className="selected-box__head">
            <span className="mini-art"><CharacterArt kind={selectedChar.kind} colors={selectedChar.colors} expression={selectedApp.expression} /></span>
            <strong>{selectedChar.name}</strong>
            <span className="hint">בסצנה הזאת</span>
          </div>
          <div className="ctl__group">
            <span className="ctl__label">הבעה</span>
            <div className="seg seg--wrap">
              {EXPRESSIONS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`seg__btn ${selectedApp.expression === e.id ? 'is-on' : ''}`}
                  aria-pressed={selectedApp.expression === e.id}
                  onClick={() => setExpression(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <ItemControls scene={scene} selection={selection!} updateScene={updateScene} />
          <div className="hs-row">
            <button
              type="button"
              className="hs-btn hs-btn--sm"
              aria-pressed={selectedApp.flip}
              onClick={() => updateScene((s) => ({ ...s, appearances: s.appearances.map((a) => (a.id === selectedApp.id ? { ...a, flip: !a.flip } : a)) }))}
            >
              <Icon name="flip" size={18} /> היפוך כיוון
            </button>
            <button
              type="button"
              className="hs-btn hs-btn--sm hs-btn--danger"
              onClick={() => {
                updateScene((s) => ({ ...s, appearances: s.appearances.filter((a) => a.id !== selectedApp.id) }));
                onSelect(null);
              }}
            >
              <Icon name="close" size={18} /> הוצאה מהסצנה
            </button>
          </div>
        </div>
      )}

      <h3 className="panel__title">הדמויות של הסיפור</h3>
      {story.characters.length === 0 && <p className="hint">עוד אין דמויות. בחרי דמות ראשונה מהרשימה למטה.</p>}
      <ul className="char-list">
        {story.characters.map((c) => {
          const inScene = scene.appearances.filter((a) => a.characterId === c.id);
          const def = getCharacterKind(c.kind);
          return (
            <li key={c.id} className="char-card">
              <div className="char-card__row">
                <span className="mini-art"><CharacterArt kind={c.kind} colors={c.colors} expression="happy" /></span>
                <label className="field field--inline">
                  <span className="hs-sr-only">שם הדמות</span>
                  <input
                    className="input"
                    value={c.name}
                    maxLength={LIMITS.maxNameLength}
                    aria-label={`שם הדמות (${def.label})`}
                    onChange={(e) => {
                      const name = e.target.value;
                      update((s) => ({ ...s, characters: s.characters.map((x) => (x.id === c.id ? { ...x, name } : x)) }), `name:${c.id}`);
                    }}
                  />
                </label>
              </div>
              <div className="hs-row">
                {inScene.length > 0 ? (
                  <button type="button" className="hs-btn hs-btn--sm" onClick={() => onSelect({ kind: 'appearance', id: inScene[0].id })}>
                    <Icon name="check" size={18} /> בסצנה — בחרי
                  </button>
                ) : (
                  <button type="button" className="hs-btn hs-btn--sm hs-btn--teal" disabled={full} onClick={() => addToScene(c.id)}>
                    <Icon name="plus" size={18} /> הוסיפי לסצנה
                  </button>
                )}
                <button type="button" className="hs-btn hs-btn--sm" aria-expanded={openColors === c.id} onClick={() => setOpenColors(openColors === c.id ? null : c.id)}>
                  צבעים
                </button>
                <button type="button" className="hs-iconbtn" aria-label={`מחיקת הדמות ${c.name}`} onClick={() => setConfirmDelete(c.id)}>
                  <Icon name="trash" />
                </button>
              </div>
              {openColors === c.id && (
                <div className="colors">
                  {(['main', 'accent', 'hair'] as const).map((slot) => (
                    <div key={slot} className="colors__row">
                      <span className="ctl__label">{def.colorLabels[slot]}</span>
                      <Swatches
                        label={def.colorLabels[slot]}
                        colors={slot === 'hair' && !['robot', 'cat', 'creature'].includes(c.kind) ? HAIR_PALETTE : PALETTE}
                        value={c.colors[slot]}
                        onPick={(col) => update((s) => ({ ...s, characters: s.characters.map((x) => (x.id === c.id ? { ...x, colors: { ...x.colors, [slot]: col } } : x)) }))}
                      />
                    </div>
                  ))}
                </div>
              )}
              {confirmDelete === c.id && (
                <div className="confirm" role="alertdialog" aria-label="אישור מחיקה">
                  <p>למחוק את {c.name} מכל הסיפור? הדמות תצא מכל הסצנות, והמשפטים שלה יהפכו לטקסט של המספרת.</p>
                  <div className="hs-row">
                    <button
                      type="button"
                      className="hs-btn hs-btn--sm hs-btn--danger"
                      onClick={() => {
                        update((s) => removeCharacter(s, c.id));
                        setConfirmDelete(null);
                        onSelect(null);
                      }}
                    >
                      כן, למחוק
                    </button>
                    <button type="button" className="hs-btn hs-btn--sm" onClick={() => setConfirmDelete(null)} autoFocus>
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button type="button" className="hs-btn hs-btn--primary panel__wide" aria-expanded={showLibrary} onClick={() => setShowLibrary((v) => !v)} disabled={story.characters.length >= LIMITS.maxCharacters}>
        <Icon name="plus" /> דמות חדשה
      </button>
      {showLibrary && (
        <div className="thumbs thumbs--chars">
          {CHARACTER_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className="thumb"
              onClick={() => {
                const ch = createCharacter(k.id);
                const xs = [0.5, 0.25, 0.75, 0.38, 0.62, 0.15, 0.85, 0.5];
                const app = full ? null : createAppearance(ch.id, xs[scene.appearances.length % xs.length]);
                update((s) => {
                  const next = { ...s, characters: [...s.characters, ch] };
                  return app ? updateSceneIn(next, scene.id, (sc) => ({ ...sc, appearances: [...sc.appearances, app] })) : next;
                });
                if (app) onSelect({ kind: 'appearance', id: app.id });
                cue('add');
                setShowLibrary(false);
              }}
            >
              <span className="thumb__art thumb__art--tall">
                <CharacterArt kind={k.id} colors={k.defaultColors} expression="happy" />
              </span>
              <span className="thumb__label">{k.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Text & dialogue                                                      */
/* ------------------------------------------------------------------ */

const PLACEHOLDERS: Record<LineKind, string> = {
  speech: 'למשל: ״תראי! הדלת זזה בעצמה!״',
  thought: 'למשל: ״אולי יש כאן רמז שאף אחד לא שם לב אליו…״',
  narration: 'למשל: באותו לילה, הירח נראה קצת יותר קרוב מהרגיל.',
};

export function TextPanel({
  story,
  scene,
  updateScene,
  selectedLineId,
  onSelectLine,
}: {
  story: Story;
  scene: Scene;
  updateScene: UpdateScene;
  selectedLineId: string | null;
  onSelectLine: (id: string | null) => void;
}) {
  const sceneCharIds = scene.appearances.map((a) => a.characterId);
  const speakers = [...story.characters].sort((a, b) => Number(sceneCharIds.includes(b.id)) - Number(sceneCharIds.includes(a.id)));
  const defaultSpeaker = sceneCharIds[0] ?? story.characters[0]?.id ?? null;

  const patchLine = (id: string, p: Partial<Line>, key?: string) =>
    updateScene((s) => ({ ...s, lines: s.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) }), key);

  const add = (kind: LineKind) => {
    const speaker = kind === 'narration' ? null : defaultSpeaker;
    const line = createLine(speaker || kind === 'narration' ? kind : 'narration', speaker);
    updateScene((s) => ({ ...s, lines: [...s.lines, line] }));
    onSelectLine(line.id);
    setTimeout(() => document.getElementById(`line-text-${line.id}`)?.focus(), 30);
  };

  const full = scene.lines.length >= LIMITS.maxLinesPerScene;

  return (
    <div className="panel">
      <h3 className="panel__title">מה אומרים בסצנה?</h3>
      {scene.lines.length === 0 && <p className="hint">עוד אין טקסט. הוסיפי בועה ראשונה — הקוראת תראה אותן אחת אחרי השנייה.</p>}
      <ol className="lines">
        {scene.lines.map((l, i) => {
          const selected = selectedLineId === l.id;
          return (
            <li key={l.id} className={`line-card line-card--${l.kind} ${selected ? 'is-selected' : ''}`} onFocusCapture={() => onSelectLine(l.id)}>
              <div className="line-card__top">
                <span className="line-card__num" aria-hidden="true">{i + 1}</span>
                <label className="hs-sr-only" htmlFor={`line-kind-${l.id}`}>סוג הבועה</label>
                <select
                  id={`line-kind-${l.id}`}
                  className="select"
                  value={l.kind}
                  onChange={(e) => {
                    const kind = e.target.value as LineKind;
                    const characterId = kind === 'narration' ? null : (l.characterId ?? defaultSpeaker);
                    patchLine(l.id, { kind: characterId || kind === 'narration' ? kind : 'narration', characterId });
                  }}
                >
                  <option value="speech" disabled={!story.characters.length}>בועת דיבור</option>
                  <option value="thought" disabled={!story.characters.length}>בועת מחשבה</option>
                  <option value="narration">תיבת מספרת</option>
                </select>
                {l.kind !== 'narration' && (
                  <>
                    <label className="hs-sr-only" htmlFor={`line-who-${l.id}`}>מי מדברת</label>
                    <select id={`line-who-${l.id}`} className="select" value={l.characterId ?? ''} onChange={(e) => patchLine(l.id, { characterId: e.target.value })}>
                      {speakers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {sceneCharIds.includes(c.id) ? '' : ' (לא בסצנה)'}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <label className="hs-sr-only" htmlFor={`line-text-${l.id}`}>טקסט מספר {i + 1}</label>
              <textarea
                id={`line-text-${l.id}`}
                className="textarea"
                dir="auto"
                rows={2}
                value={l.text}
                maxLength={LIMITS.maxTextLength}
                placeholder={PLACEHOLDERS[l.kind]}
                onChange={(e) => patchLine(l.id, { text: e.target.value }, `text:${l.id}`)}
              />
              {l.text.length > LIMITS.longLineHint && (
                <p className="hint hint--soft">
                  <Icon name="info" size={16} /> טקסט ארוך ({l.text.length} תווים). אפשר לפצל לשתי בועות כדי שיהיה קל יותר לקרוא.
                </p>
              )}
              <div className="line-card__actions">
                <button type="button" className="hs-iconbtn" aria-label="הזזה למעלה" disabled={i === 0} onClick={() => updateScene((s) => ({ ...s, lines: moveInArray(s.lines, i, -1) }))}>
                  <Icon name="up" />
                </button>
                <button type="button" className="hs-iconbtn" aria-label="הזזה למטה" disabled={i === scene.lines.length - 1} onClick={() => updateScene((s) => ({ ...s, lines: moveInArray(s.lines, i, 1) }))}>
                  <Icon name="down" />
                </button>
                <button
                  type="button"
                  className="hs-iconbtn"
                  aria-label={`מחיקת טקסט מספר ${i + 1}`}
                  onClick={() => {
                    updateScene((s) => ({ ...s, lines: s.lines.filter((x) => x.id !== l.id) }));
                    if (selected) onSelectLine(null);
                  }}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="add-row">
        <button type="button" className="hs-btn hs-btn--sm" onClick={() => add('speech')} disabled={full || !story.characters.length}>
          <Icon name="plus" size={18} /> בועת דיבור
        </button>
        <button type="button" className="hs-btn hs-btn--sm" onClick={() => add('thought')} disabled={full || !story.characters.length}>
          <Icon name="plus" size={18} /> בועת מחשבה
        </button>
        <button type="button" className="hs-btn hs-btn--sm" onClick={() => add('narration')} disabled={full}>
          <Icon name="plus" size={18} /> מספרת
        </button>
      </div>
      {!story.characters.length && <p className="hint">כדי להוסיף בועת דיבור, קודם הוסיפי דמות בלשונית ״דמויות״.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* What happens next                                                    */
/* ------------------------------------------------------------------ */

const ENDING_SUGGESTIONS = ['סוף של חברות', 'סוף מפתיע', 'הסוד הגדול נחשף', 'סוף שמח', 'סוף מצחיק', 'ההרפתקה רק מתחילה'];

function TargetPicker({
  story,
  scene,
  value,
  onChange,
  onCreate,
  onOpen,
  label,
  id,
}: {
  story: Story;
  scene: Scene;
  value: string | null;
  onChange: (v: string | null) => void;
  onCreate: () => void;
  onOpen: (id: string) => void;
  label: string;
  id: string;
}) {
  const exists = !!value && story.scenes.some((s) => s.id === value);
  return (
    <div className="target">
      <label className="field">
        <span className="field__label">{label}</span>
        <select id={id} className={`select ${!exists ? 'select--warn' : ''}`} value={exists ? value! : ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">— עוד לא נבחרה סצנה —</option>
          {story.scenes
            .filter((s) => s.id !== scene.id)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
      {!exists && (
        <p className="warn-line">
          <Icon name="warning" size={16} /> {value ? 'הסצנה שנבחרה נמחקה. לאן נמשיך?' : 'לבחירה הזאת עוד אין המשך. לאיזו סצנה היא תיקח אותנו?'}
        </p>
      )}
      <div className="hs-row">
        <button type="button" className="hs-btn hs-btn--sm hs-btn--teal" onClick={onCreate}>
          <Icon name="plus" size={18} /> צרי סצנה חדשה לזה
        </button>
        {exists && (
          <button type="button" className="hs-btn hs-btn--sm" onClick={() => onOpen(value!)}>
            <Icon name="edit" size={18} /> פתחי את הסצנה
          </button>
        )}
      </div>
    </div>
  );
}

export function NextPanel({
  story,
  scene,
  update,
  updateScene,
  onOpenScene,
}: {
  story: Story;
  scene: Scene;
  update: UpdateStory;
  updateScene: UpdateScene;
  onOpenScene: (id: string) => void;
}) {
  const n = scene.next;
  const setNext = (next: SceneNext, key?: string) => updateScene((s) => ({ ...s, next }), key);

  const switchType = (type: SceneNext['type']) => {
    if (type === n.type) return;
    if (type === 'goto') setNext({ type: 'goto', target: n.type === 'choice' ? (n.options.find((o) => o.target)?.target ?? null) : null });
    if (type === 'end') setNext({ type: 'end', endingName: '' });
    if (type === 'choice')
      setNext({
        type: 'choice',
        prompt: 'מה תעשי עכשיו?',
        options: [
          { id: newId('opt'), text: '', target: n.type === 'goto' ? n.target : null },
          { id: newId('opt'), text: '', target: null },
        ],
      });
  };

  /** Create a new scene right after this one and link it — in one undo step. */
  const createLinked = (name: string, link: (s: Scene, newId: string) => Scene) => {
    const fresh = createScene(name.slice(0, LIMITS.maxNameLength) || 'סצנה חדשה', scene.backgroundId);
    update((st) => updateSceneIn(addScene(st, fresh, scene.id), scene.id, (sc) => link(sc, fresh.id)));
    cue('add');
    return fresh.id;
  };

  return (
    <div className="panel">
      <h3 className="panel__title">מה קורה בסוף הסצנה?</h3>
      <div className="seg seg--big" role="radiogroup" aria-label="סוג ההמשך">
        {(
          [
            ['goto', 'ממשיכים לסצנה'],
            ['choice', 'הקוראת בוחרת'],
            ['end', 'סוף הסיפור'],
          ] as const
        ).map(([t, label]) => (
          <button key={t} type="button" role="radio" aria-checked={n.type === t} className={`seg__btn ${n.type === t ? 'is-on' : ''}`} onClick={() => switchType(t)}>
            {label}
          </button>
        ))}
      </div>

      {n.type === 'goto' && (
        <TargetPicker
          id="goto-target"
          story={story}
          scene={scene}
          label="לאיזו סצנה ממשיכים?"
          value={n.target}
          onChange={(target) => setNext({ type: 'goto', target })}
          onCreate={() => createLinked('הסצנה הבאה', (sc, fid) => ({ ...sc, next: { type: 'goto', target: fid } }))}
          onOpen={onOpenScene}
        />
      )}

      {n.type === 'choice' && (
        <div className="choices-edit">
          <label className="field">
            <span className="field__label">השאלה לקוראת</span>
            <input
              className="input"
              dir="auto"
              value={n.prompt}
              maxLength={LIMITS.maxTextLength}
              placeholder="למשל: שמעת רשרוש מאחורי המדף. מה תעשי?"
              onChange={(e) => setNext({ ...n, prompt: e.target.value }, `prompt:${scene.id}`)}
            />
          </label>
          {n.options.map((o, i) => (
            <fieldset key={o.id} className="option-card">
              <legend>בחירה {i + 1}</legend>
              <label className="field">
                <span className="field__label">מה כתוב על הכפתור?</span>
                <input
                  className="input"
                  dir="auto"
                  value={o.text}
                  maxLength={LIMITS.maxNameLength * 2}
                  placeholder={['למשל: אבדוק מאחורי המדף', 'למשל: אקרא לחברה שלי', 'למשל: אחפש רמז על השולחן'][i]}
                  onChange={(e) => setNext({ ...n, options: n.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) }, `opt:${o.id}`)}
                />
              </label>
              <TargetPicker
                id={`target-${o.id}`}
                story={story}
                scene={scene}
                label="לאן הבחירה הזאת לוקחת?"
                value={o.target}
                onChange={(target) => setNext({ ...n, options: n.options.map((x) => (x.id === o.id ? { ...x, target } : x)) })}
                onCreate={() =>
                  createLinked(o.text || `בחירה ${i + 1}`, (sc, fid) =>
                    sc.next.type === 'choice' ? { ...sc, next: { ...sc.next, options: sc.next.options.map((x) => (x.id === o.id ? { ...x, target: fid } : x)) } } : sc,
                  )
                }
                onOpen={onOpenScene}
              />
              {n.options.length > 2 && (
                <button type="button" className="hs-btn hs-btn--sm hs-btn--danger" onClick={() => setNext({ ...n, options: n.options.filter((x) => x.id !== o.id) })}>
                  <Icon name="trash" size={18} /> הסירי בחירה
                </button>
              )}
            </fieldset>
          ))}
          {n.options.length < LIMITS.maxOptions && (
            <button type="button" className="hs-btn hs-btn--sm" onClick={() => setNext({ ...n, options: [...n.options, { id: newId('opt'), text: '', target: null }] })}>
              <Icon name="plus" size={18} /> בחירה שלישית
            </button>
          )}
        </div>
      )}

      {n.type === 'end' && (
        <div>
          <label className="field">
            <span className="field__label">איך נקרא לסוף הזה?</span>
            <input
              className="input"
              dir="auto"
              value={n.endingName}
              maxLength={LIMITS.maxNameLength}
              placeholder="למשל: סוף של חברות"
              onChange={(e) => setNext({ type: 'end', endingName: e.target.value }, `end:${scene.id}`)}
            />
          </label>
          <div className="chips">
            {ENDING_SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setNext({ type: 'end', endingName: s })}>
                {s}
              </button>
            ))}
          </div>
          <p className="hint">כל סוף הוא סוף אמיתי — אין סוף ״נכון״ ואין סוף ״לא נכון״.</p>
        </div>
      )}
    </div>
  );
}
