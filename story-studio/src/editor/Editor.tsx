import { useEffect, useMemo, useState } from 'react';
import type { Scene, Story } from '../model/types';
import { LIMITS } from '../model/types';
import { addScene, deleteScene, duplicateScene, getScene, moveScene, updateScene as updateSceneIn } from '../model/ops';
import { createAppearance, createCharacter, createLine, createScene } from '../model/factory';
import { canPlay, validateStory, type Issue } from '../model/validate';
import { BackgroundArt } from '../assets/backgrounds';
import { Icon } from '../ui/icons';
import { Modal } from '../ui/Modal';
import { navigate } from '../ui/router';
import { useToast } from '../ui/Toast';
import { getStore } from '../storage/storage';
import { EditorStage, type Selection } from './EditorStage';
import { BackgroundPanel, CharactersPanel, NextPanel, TextPanel } from './panels';
import { DeleteSceneModal, DetailsModal, ShareModal } from './modals';
import { IssuesList, StoryMap } from './StoryMap';
import { useStoryEditor, type SaveStatus } from './useStoryEditor';
import { IdeaJar } from '../screens/IdeaJar';
import { newId } from '../model/ids';

type Tab = 'scenes' | 'bg' | 'chars' | 'text' | 'next';

const TABS: { id: Tab; label: string; icon: string; mobileOnly?: boolean }[] = [
  { id: 'scenes', label: 'סצנות', icon: 'book', mobileOnly: true },
  { id: 'bg', label: 'רקע', icon: 'image' },
  { id: 'chars', label: 'דמויות', icon: 'people' },
  { id: 'text', label: 'טקסט', icon: 'text' },
  { id: 'next', label: 'המשך', icon: 'branch' },
];

function useMediaQuery(q: string) {
  const [m, setM] = useState(() => {
    try {
      return window.matchMedia(q).matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia(q);
    } catch {
      return;
    }
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

function SaveBadge({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'saving') return <span className="save save--saving" role="status">שומרת…</span>;
  if (status === 'saved')
    return (
      <span className="save save--ok" role="status">
        <Icon name="check" size={16} /> נשמר במכשיר הזה
      </span>
    );
  const msg =
    status === 'error-quota'
      ? 'השמירה נכשלה: אין מספיק מקום במכשיר. הורידי גיבוי או מחקי סיפור ישן.'
      : status === 'error-unavailable'
        ? 'השמירה לא זמינה בדפדפן הזה (אולי מצב גלישה פרטית). הורידי גיבוי כדי לא לאבד את הסיפור.'
        : 'השמירה נכשלה.';
  return (
    <span className="save save--error" role="alert">
      <Icon name="warning" size={16} /> {msg}
      <button type="button" className="hs-btn hs-btn--sm" onClick={onRetry}>
        לנסות שוב
      </button>
    </span>
  );
}

export function Editor({ initial }: { initial: Story }) {
  const ed = useStoryEditor(initial);
  const { story, update } = ed;
  const toast = useToast();
  const isMobile = useMediaQuery('(max-width: 899px)');
  const [sceneId, setSceneId] = useState(initial.startSceneId);
  const [selection, setSelection] = useState<Selection>(null);
  const [lineId, setLineId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initial.characters.length ? 'text' : 'chars');
  const [modal, setModal] = useState<null | 'details' | 'map' | 'share' | 'delete' | 'idea'>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const scene = getScene(story, sceneId) ?? story.scenes[0];
  const issues = useMemo(() => validateStory(story), [story]);
  const problemCount = issues.filter((i) => i.severity !== 'tip').length;

  useEffect(() => {
    getStore().setLastOpened(story.id);
  }, [story.id]);

  // Keep selections valid after undo/delete.
  const validSelection: Selection =
    selection && (selection.kind === 'appearance' ? scene.appearances : scene.props).some((i) => i.id === selection.id) ? selection : null;
  const previewLine = scene.lines.find((l) => l.id === lineId) ?? scene.lines[0] ?? null;

  const updateScene = (fn: (s: Scene) => Scene, coalesce?: string) => update((s) => updateSceneIn(s, scene.id, fn), coalesce);

  const openScene = (id: string, toTab?: Tab) => {
    setSceneId(id);
    setSelection(null);
    setLineId(null);
    setModal(null);
    if (toTab) setTab(toTab);
    else if (isMobile && tab === 'scenes') setTab('text');
    window.scrollTo({ top: 0 });
  };

  const onSelect = (s: Selection) => {
    setSelection(s);
    if (s?.kind === 'appearance' && tab !== 'chars') setTab('chars');
    if (s?.kind === 'prop' && tab !== 'bg') setTab('bg');
  };

  // Undo / redo shortcuts (text fields keep their own native undo).
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) ed.redo();
        else ed.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        ed.redo();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [ed]);

  const addNewScene = () => {
    if (story.scenes.length >= LIMITS.maxScenes) return;
    const s = createScene(`סצנה ${story.scenes.length + 1}`, scene.backgroundId);
    update((st) => addScene(st, s, scene.id));
    openScene(s.id, isMobile ? 'bg' : tab);
    toast('נוספה סצנה חדשה');
  };

  const play = () => {
    getStore().save(story);
    navigate(`/play/${encodeURIComponent(story.id)}?from=edit`);
  };

  const fixIssue = (i: Issue) => {
    if (!i.sceneId) return;
    openScene(i.sceneId, i.code === 'unreachable' ? undefined : 'next');
  };

  const sceneList = (
    <div className="scenes">
      <div className="scenes__head">
        <h2 className="scenes__title">סצנות</h2>
        <button type="button" className="hs-btn hs-btn--sm hs-btn--teal" onClick={addNewScene} disabled={story.scenes.length >= LIMITS.maxScenes}>
          <Icon name="plus" size={18} /> סצנה
        </button>
      </div>
      <ol className="scenes__list">
        {story.scenes.map((s, i) => {
          const isStart = s.id === story.startSceneId;
          const hasIssue = issues.some((x) => x.sceneId === s.id && x.severity !== 'tip');
          const current = s.id === scene.id;
          return (
            <li key={s.id} className={`scene-item ${current ? 'is-current' : ''}`}>
              <button type="button" className="scene-item__main" onClick={() => openScene(s.id)} aria-current={current ? 'true' : undefined}>
                <span className="scene-item__thumb">
                  <BackgroundArt id={s.backgroundId} />
                </span>
                <span className="scene-item__text">
                  <span className="scene-item__name">{s.name}</span>
                  <span className="scene-item__badges">
                    {isStart && (
                      <span className="badge badge--start">
                        <Icon name="play" size={12} /> פתיחה
                      </span>
                    )}
                    {s.next.type === 'end' && (
                      <span className="badge badge--end">
                        <Icon name="flag" size={12} /> סוף
                      </span>
                    )}
                    {s.next.type === 'choice' && (
                      <span className="badge">
                        <Icon name="branch" size={12} /> {s.next.options.length} בחירות
                      </span>
                    )}
                    {hasIssue && (
                      <span className="badge badge--warn">
                        <Icon name="warning" size={12} /> לבדיקה
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <span className="scene-item__move">
                <button type="button" className="hs-iconbtn" aria-label={`הזזת ״${s.name}״ למעלה ברשימה`} disabled={i === 0} onClick={() => update((st) => moveScene(st, s.id, -1))}>
                  <Icon name="up" size={18} />
                </button>
                <button type="button" className="hs-iconbtn" aria-label={`הזזת ״${s.name}״ למטה ברשימה`} disabled={i === story.scenes.length - 1} onClick={() => update((st) => moveScene(st, s.id, 1))}>
                  <Icon name="down" size={18} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="hint">הסדר ברשימה רק עוזר לך להתמצא. הסיפור מתקדם לפי הבחירות והקישורים.</p>
    </div>
  );

  const panel = (() => {
    switch (isMobile ? tab : tab === 'scenes' ? 'chars' : tab) {
      case 'scenes':
        return sceneList;
      case 'bg':
        return <BackgroundPanel scene={scene} updateScene={updateScene} selection={validSelection} onSelect={onSelect} />;
      case 'chars':
        return <CharactersPanel key={scene.id} story={story} scene={scene} update={update} updateScene={updateScene} selection={validSelection} onSelect={onSelect} />;
      case 'text':
        return <TextPanel story={story} scene={scene} updateScene={updateScene} selectedLineId={previewLine?.id ?? null} onSelectLine={setLineId} />;
      case 'next':
        return <NextPanel story={story} scene={scene} update={update} updateScene={updateScene} onOpenScene={(id) => openScene(id, 'next')} />;
    }
  })();

  const tabs = (
    <div className={isMobile ? 'tabbar' : 'tabs'} role="tablist" aria-label="כלי עריכה">
      {TABS.filter((t) => isMobile || !t.mobileOnly).map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={tab === t.id}
          aria-controls="tool-panel"
          className={`tab ${tab === t.id ? 'is-on' : ''}`}
          onClick={() => setTab(t.id)}
        >
          <Icon name={t.icon} size={20} />
          <span>{t.label}</span>
          {t.id === 'next' && issues.some((x) => x.sceneId === scene.id && x.severity !== 'tip') && <span className="tab__dot" aria-label="יש מה לבדוק" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`editor ${isMobile ? 'editor--mobile' : ''}`}>
      <header className="ed-top">
        <button type="button" className="hs-iconbtn" onClick={() => navigate('/')} aria-label="למסך הבית">
          <Icon name="home" />
        </button>
        <button type="button" className="ed-top__title" onClick={() => setModal('details')} aria-label={`פרטי הסיפור: ${story.title}`}>
          <span className="ed-top__cover" style={{ background: story.cover.color }} aria-hidden="true" />
          <span className="ed-top__name">{story.title || 'סיפור ללא שם'}</span>
          <Icon name="edit" size={16} />
        </button>
        <div className="ed-top__status">
          <SaveBadge status={ed.status} onRetry={ed.retrySave} />
        </div>
        <div className="ed-top__actions">
          <button type="button" className="hs-iconbtn" onClick={ed.undo} disabled={!ed.canUndo} aria-label="ביטול פעולה" title="ביטול פעולה (Ctrl+Z)">
            <Icon name="undo" />
          </button>
          <button type="button" className="hs-iconbtn" onClick={ed.redo} disabled={!ed.canRedo} aria-label="ביצוע מחדש" title="ביצוע מחדש (Ctrl+Y)">
            <Icon name="redo" />
          </button>
          <button type="button" className="hs-btn hs-btn--sm hs-btn--ghost" onClick={() => setModal('idea')} aria-label="צנצנת רעיונות">
            <Icon name="sparkle" size={18} /> <span className="hide-sm">רעיון</span>
          </button>
          <button type="button" className="hs-btn hs-btn--sm hs-btn--ghost" onClick={() => setModal('map')} aria-label={`מפת הסיפור${problemCount ? `, ${problemCount} דברים לבדיקה` : ''}`}>
            <Icon name="map" size={18} /> <span className="hide-sm">מפת הסיפור</span>
            {problemCount > 0 && <span className="count-badge" aria-hidden="true">{problemCount}</span>}
          </button>
          <button type="button" className="hs-btn hs-btn--sm hs-btn--ghost" onClick={() => setModal('share')} aria-label="שמירה ושיתוף">
            <Icon name="download" size={18} /> <span className="hide-sm">שמירה ושיתוף</span>
          </button>
        </div>
        <button type="button" className="hs-btn hs-btn--primary ed-top__play" onClick={play} disabled={!canPlay(issues)}>
          <Icon name="play" /> שחקי בסיפור
        </button>
      </header>

      <div className="ed-body">
        {!isMobile && <aside className="ed-side">{sceneList}</aside>}

        <main className="ed-center">
          <div className="ed-scenebar">
            <label className="field field--inline ed-scenebar__name">
              <span className="field__label">שם הסצנה</span>
              <input
                className="input"
                dir="auto"
                value={scene.name}
                maxLength={LIMITS.maxNameLength}
                onChange={(e) => updateScene((s) => ({ ...s, name: e.target.value }), `scene-name:${scene.id}`)}
              />
            </label>
            <div className="hs-row ed-scenebar__actions">
              {story.startSceneId !== scene.id ? (
                <button type="button" className="hs-btn hs-btn--sm" onClick={() => update((s) => ({ ...s, startSceneId: scene.id }))}>
                  <Icon name="play" size={18} /> <span className="hide-sm">קבעי </span>כפתיחה
                </button>
              ) : (
                <span className="badge badge--start badge--lg">
                  <Icon name="play" size={14} /> <span className="hide-sm">סצנת ה</span>פתיחה
                </span>
              )}
              <button
                type="button"
                className="hs-btn hs-btn--sm"
                aria-label="שכפול הסצנה"
                disabled={story.scenes.length >= LIMITS.maxScenes}
                onClick={() => {
                  const r = duplicateScene(story, scene.id);
                  if (r.newSceneId) {
                    update(() => r.story);
                    openScene(r.newSceneId);
                    toast('הסצנה שוכפלה');
                  }
                }}
              >
                <Icon name="copy" size={18} /> <span className="hide-sm">שכפול</span>
              </button>
              <button
                type="button"
                className="hs-btn hs-btn--sm hs-btn--danger"
                aria-label="מחיקת הסצנה"
                disabled={story.scenes.length <= 1}
                title={story.scenes.length <= 1 ? 'בסיפור חייבת להיות לפחות סצנה אחת' : undefined}
                onClick={() => {
                  setDeleteId(scene.id);
                  setModal('delete');
                }}
              >
                <Icon name="trash" size={18} /> <span className="hide-sm">מחיקה</span>
              </button>
            </div>
          </div>

          <EditorStage story={story} scene={scene} selection={validSelection} onSelect={onSelect} updateScene={updateScene} previewLine={isMobile && tab !== 'text' ? null : previewLine} />
          {!isMobile && <p className="hint ed-stage-hint">גררי דמויות ואביזרים על הבמה, או בחרי אחד והזיזי עם החיצים במקלדת.</p>}
        </main>

        <section className="ed-tools">
          {!isMobile && tabs}
          <div id="tool-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="ed-tools__panel">
            {panel}
          </div>
        </section>
      </div>

      <DetailsModal open={modal === 'details'} onClose={() => setModal(null)} story={story} update={update} />
      <ShareModal open={modal === 'share'} onClose={() => setModal(null)} story={story} />
      <DeleteSceneModal
        key={deleteId ?? 'none'}
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        story={story}
        sceneId={deleteId}
        onDelete={(replacement) => {
          if (!deleteId) return;
          const after = deleteScene(story, deleteId, replacement);
          update(() => after);
          setModal(null);
          const nextId = replacement ?? after.startSceneId;
          openScene(nextId);
          toast('הסצנה נמחקה. אפשר לבטל עם כפתור ״ביטול פעולה״.');
        }}
      />
      <Modal open={modal === 'map'} onClose={() => setModal(null)} title="מפת הסיפור" size="full">
        <section aria-labelledby="check-title" className="map-check">
          <h3 id="check-title">בדיקת הסיפור</h3>
          <IssuesList issues={issues} onFix={fixIssue} story={story} />
        </section>
        <StoryMap story={story} issues={issues} onOpenScene={(id) => openScene(id)} />
      </Modal>
      <Modal open={modal === 'idea'} onClose={() => setModal(null)} title="צנצנת רעיונות" size="lg">
        <IdeaJar
          useLabel="הוסיפי כסצנה חדשה"
          onUse={(idea, text) => {
            const s = createScene(idea.place.text.replace(/^ב/, '') || 'רעיון חדש', idea.place.bg);
            let ch = story.characters.find((c) => c.kind === idea.hero.kind);
            const addChar = !ch;
            if (!ch) ch = createCharacter(idea.hero.kind);
            const withContent: Scene = {
              ...s,
              appearances: [createAppearance(ch.id, 0.3)],
              props: idea.event.prop ? [{ id: newId('prop'), kind: idea.event.prop, x: 0.66, y: 0.92, scale: 1 }] : [],
              lines: [createLine('narration', null, text)],
            };
            const charToAdd = ch;
            update((st) => addScene(addChar ? { ...st, characters: [...st.characters, charToAdd] } : st, withContent, scene.id));
            openScene(withContent.id, 'text');
            toast('הרעיון נוסף כסצנה חדשה. שום דבר לא נמחק.', 'success');
          }}
        />
      </Modal>

      {isMobile && <nav className="ed-tabbar-wrap">{tabs}</nav>}
    </div>
  );
}

export function EditorScreen({ id }: { id: string }) {
  const [story] = useState(() => getStore().load(id));
  if (!story) {
    return (
      <div className="page page--center">
        <h1>לא מצאנו את הסיפור</h1>
        <p>אולי הוא נמחק, או שנשמר בדפדפן אחר. סיפורים נשמרים רק במכשיר ובדפדפן שבהם נוצרו.</p>
        <div className="hs-row hs-row--center">
          <button type="button" className="hs-btn hs-btn--primary" onClick={() => navigate('/library')}>
            הסיפורים שלי
          </button>
          <button type="button" className="hs-btn" onClick={() => navigate('/')}>
            מסך הבית
          </button>
        </div>
      </div>
    );
  }
  return <Editor initial={story} />;
}

