import { useRef, useState } from 'react';
import type { Story } from '../model/types';
import { LIMITS } from '../model/types';
import { getStore, type StorySummary } from '../storage/storage';
import { navigate } from '../ui/router';
import { Icon } from '../ui/icons';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Stage } from '../player/Stage';
import { StoryPlayer } from '../player/StoryPlayer';
import { CharacterArt } from '../assets/characterLibrary';
import { createEmptyStory, createAppearance, createCharacter, createLine } from '../model/factory';
import { cloneStoryAsNew, getScene } from '../model/ops';
import { TEMPLATES, storyFromTemplate } from '../content/templates';
import { SAMPLE_STORY_ID, getSampleStory } from '../content/sampleStory';
import { importStory } from '../io/exportImport';
import { newId } from '../model/ids';
import { IdeaJar } from './IdeaJar';
import { loadSettings, saveSettings } from '../player/settings';
import type { Idea } from '../content/ideas';

function saveAndOpen(story: Story, toast: (t: string, tone?: 'info' | 'success' | 'error') => void): void {
  const res = getStore().save(story);
  if (!res.ok) {
    toast(
      res.reason === 'quota'
        ? 'אין מספיק מקום במכשיר כדי לשמור סיפור חדש. אפשר למחוק סיפור ישן (אחרי שמורידים גיבוי).'
        : 'השמירה במכשיר לא זמינה בדפדפן הזה. אפשר לערוך, אבל כדאי להוריד גיבוי.',
      'error',
    );
    if (res.reason === 'quota') return;
  }
  getStore().setLastOpened(story.id);
  navigate(`/edit/${encodeURIComponent(story.id)}`);
}

function StorageNote() {
  return (
    <p className="storage-note">
      <Icon name="info" size={16} /> הסיפורים נשמרים רק במכשיר ובדפדפן האלה — לא בענן. הם לא עוברים לבד למכשיר אחר, וניקוי נתוני הדפדפן עלול למחוק אותם. כדאי להוריד גיבוי מדי פעם.
    </p>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(() => loadSettings().sound);
  return (
    <button
      type="button"
      className="hs-iconbtn"
      aria-pressed={on}
      aria-label={on ? 'כיבוי צלילים' : 'הפעלת צלילים'}
      title={on ? 'צלילים: פועלים' : 'צלילים: כבויים'}
      onClick={() => {
        const s = loadSettings();
        saveSettings({ ...s, sound: !on });
        setOn(!on);
      }}
    >
      <Icon name={on ? 'sound' : 'mute'} />
    </button>
  );
}

/* ------------------------------------------------------------------ */

export function HomeScreen() {
  const store = getStore();
  const [showIntro, setShowIntro] = useState(() => !store.onboarded());
  const lastId = store.lastOpened();
  const last = lastId ? store.load(lastId) : null;
  const finishIntro = () => {
    store.setOnboarded();
    setShowIntro(false);
  };

  return (
    <div className="page home">
      <div className="home__corner">
        <SoundToggle />
      </div>
      <header className="home__hero">
        <div className="home__art" aria-hidden="true">
          <span className="home__blob" />
          <span className="home__char home__char--1"><CharacterArt kind="curious" colors={{ main: '#1f9e95', accent: '#7c5cc4', hair: '#6b4227' }} expression="happy" /></span>
          <span className="home__char home__char--2"><CharacterArt kind="robot" colors={{ main: '#8fb3e8', accent: '#e8866a', hair: '#7fffd4' }} expression="surprised" /></span>
          <span className="home__char home__char--3"><CharacterArt kind="inventor" colors={{ main: '#e2b23a', accent: '#3d6fb6', hair: '#1f1a24' }} expression="thinking" /></span>
        </div>
        <h1 className="home__title">הסיפור שלי</h1>
        <p className="home__sub">כל הרפתקה מתחילה בדמיון שלך</p>
      </header>

      {showIntro && (
        <section className="intro" aria-labelledby="intro-title">
          <h2 id="intro-title">איך יוצרים סיפור?</h2>
          <ol className="intro__steps">
            <li><span className="intro__num">1</span> בחרי מקום.</li>
            <li><span className="intro__num">2</span> הוסיפי דמויות.</li>
            <li><span className="intro__num">3</span> החליטי מה יקרה.</li>
          </ol>
          <div className="hs-row hs-row--center">
            <button type="button" className="hs-btn hs-btn--primary hs-btn--sm" onClick={finishIntro}>הבנתי!</button>
            <button type="button" className="hs-btn hs-btn--ghost hs-btn--sm" onClick={finishIntro}>דלגי</button>
          </div>
        </section>
      )}

      <nav className="home__menu" aria-label="תפריט ראשי">
        <button type="button" className="hs-btn hs-btn--primary hs-btn--xl home__main" onClick={() => navigate('/new')}>
          <Icon name="plus" /> צרי סיפור חדש
        </button>
        {last && (
          <button type="button" className="continue" onClick={() => navigate(`/edit/${encodeURIComponent(last.id)}`)}>
            <span className="continue__cover" style={{ background: last.cover.color }} aria-hidden="true" />
            <span className="continue__text">
              <span className="continue__kicker">המשיכי ליצור</span>
              <span className="continue__title">{last.title}</span>
            </span>
            <Icon name="forward" />
          </button>
        )}
        <div className="home__grid">
          <button type="button" className="hs-btn" onClick={() => navigate('/library')}>
            <Icon name="book" /> הסיפורים שלי
          </button>
          <button type="button" className="hs-btn" onClick={() => navigate('/sample')}>
            <Icon name="play" /> נסי סיפור לדוגמה
          </button>
          <button type="button" className="hs-btn" onClick={() => navigate('/ideas')}>
            <Icon name="sparkle" /> צנצנת רעיונות
          </button>
        </div>
      </nav>
      <StorageNote />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PageHeader({ title, back = '/' }: { title: string; back?: string }) {
  return (
    <header className="page__head">
      <button type="button" className="hs-btn hs-btn--ghost hs-btn--sm" onClick={() => navigate(back)}>
        <Icon name="back" size={18} /> חזרה
      </button>
      <h1 className="page__title">{title}</h1>
    </header>
  );
}

function CoverThumb({ story }: { story: Story }) {
  const scene = getScene(story, story.cover.sceneId) ?? getScene(story, story.startSceneId) ?? story.scenes[0];
  return (
    <span className="cover-thumb" style={{ background: story.cover.color }}>
      {scene && <Stage story={story} scene={scene} label={`כריכה: ${story.title}`} />}
    </span>
  );
}

const dateFmt = (t: number) => {
  try {
    return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(t));
  } catch {
    return new Date(t).toLocaleString();
  }
};

export function LibraryScreen() {
  const store = getStore();
  const toast = useToast();
  const [data, setData] = useState(() => store.list());
  const [toDelete, setToDelete] = useState<StorySummary | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => setData(store.list());

  const onImport = async (file: File) => {
    if (file.size > LIMITS.maxImportBytes) {
      toast('הקובץ גדול מדי בשביל סיפור.', 'error');
      return;
    }
    let text = '';
    try {
      text = await file.text();
    } catch {
      toast('לא הצלחנו לקרוא את הקובץ.', 'error');
      return;
    }
    const res = importStory(text, (id) => store.has(id));
    if (!res.ok) {
      toast(res.error, 'error');
      return;
    }
    const saved = store.save(res.story);
    if (!saved.ok) {
      toast(saved.reason === 'quota' ? 'אין מספיק מקום במכשיר כדי לייבא את הסיפור.' : 'לא הצלחנו לשמור את הסיפור במכשיר.', 'error');
      return;
    }
    refresh();
    toast(res.copied ? `הסיפור יובא כעותק חדש: ״${res.story.title}״` : `הסיפור ״${res.story.title}״ יובא בהצלחה`, 'success');
    res.warnings.forEach((w) => toast(w));
  };

  return (
    <div className="page">
      <PageHeader title="הסיפורים שלי" />
      <div className="hs-row lib-actions">
        <button type="button" className="hs-btn hs-btn--primary" onClick={() => navigate('/new')}>
          <Icon name="plus" /> סיפור חדש
        </button>
        <button type="button" className="hs-btn" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" /> ייבוא קובץ סיפור
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hs-sr-only"
          tabIndex={-1}
          aria-label="בחירת קובץ סיפור לייבוא"
          data-testid="import-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onImport(f);
          }}
        />
      </div>
      {!store.available && (
        <p className="warn-box" role="alert">
          <Icon name="warning" /> השמירה במכשיר לא זמינה בדפדפן הזה (אולי מצב גלישה פרטית). אפשר ליצור סיפור, אבל הוא לא יישמר אחרי סגירת הדף.
        </p>
      )}
      {data.damaged > 0 && (
        <p className="warn-box" role="alert">
          <Icon name="warning" /> {data.damaged === 1 ? 'סיפור אחד לא נטען' : `${data.damaged} סיפורים לא נטענו`} כי הנתונים שלו פגומים.
          <button type="button" className="hs-btn hs-btn--sm" onClick={() => { store.removeDamaged(); refresh(); }}>
            ניקוי
          </button>
        </p>
      )}
      {data.stories.length === 0 ? (
        <div className="empty">
          <p className="empty__title">עוד אין כאן סיפורים.</p>
          <p>כל סיפור שתיצרי יחכה לך כאן.</p>
          <div className="hs-row hs-row--center">
            <button type="button" className="hs-btn hs-btn--primary" onClick={() => navigate('/new')}>צרי סיפור ראשון</button>
            <button type="button" className="hs-btn" onClick={() => navigate('/sample')}>נסי סיפור לדוגמה</button>
          </div>
        </div>
      ) : (
        <ul className="lib-grid">
          {data.stories.map((s) => (
            <li key={s.id} className="lib-card">
              <CoverThumb story={s.story} />
              <div className="lib-card__body">
                <h2 className="lib-card__title">{s.title}</h2>
                <p className="lib-card__meta">
                  עודכן: {dateFmt(s.updatedAt)} · {s.sceneCount} סצנות
                </p>
                <div className="hs-row">
                  <button type="button" className="hs-btn hs-btn--sm hs-btn--primary" onClick={() => navigate(`/edit/${encodeURIComponent(s.id)}`)}>
                    <Icon name="edit" size={18} /> עריכה
                  </button>
                  <button type="button" className="hs-btn hs-btn--sm" onClick={() => navigate(`/play/${encodeURIComponent(s.id)}`)}>
                    <Icon name="play" size={18} /> משחק
                  </button>
                  <button
                    type="button"
                    className="hs-iconbtn"
                    aria-label={`שכפול ״${s.title}״`}
                    title="שכפול"
                    onClick={() => {
                      const copy = cloneStoryAsNew(s.story, ' (עותק)');
                      const r = store.save(copy);
                      if (r.ok) toast('הסיפור שוכפל', 'success');
                      else toast('אין מספיק מקום במכשיר לשכפול.', 'error');
                      refresh();
                    }}
                  >
                    <Icon name="copy" />
                  </button>
                  <button type="button" className="hs-iconbtn" aria-label={`מחיקת ״${s.title}״`} title="מחיקה" onClick={() => setToDelete(s)}>
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <StorageNote />
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={`למחוק את ״${toDelete?.title ?? ''}״?`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="hs-btn hs-btn--danger"
              onClick={() => {
                if (toDelete) store.remove(toDelete.id);
                setToDelete(null);
                refresh();
                toast('הסיפור נמחק');
              }}
            >
              <Icon name="trash" /> כן, למחוק לתמיד
            </button>
            <button type="button" className="hs-btn" onClick={() => setToDelete(null)} autoFocus>
              ביטול
            </button>
          </>
        }
      >
        <p>אי אפשר לבטל מחיקה של סיפור. אם תרצי לשמור עותק, הורידי קודם קובץ סיפור מתוך העורך (״שמירה ושיתוף״).</p>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function NewStoryScreen() {
  const toast = useToast();
  const [title, setTitle] = useState('הסיפור החדש שלי');
  const previews = TEMPLATES.map((t) => ({ t, story: storyFromTemplate(t.id)! }));

  return (
    <div className="page">
      <PageHeader title="סיפור חדש" />
      <label className="field new-title">
        <span className="field__label">איך יקראו לסיפור?</span>
        <input className="input input--big" dir="auto" value={title} maxLength={LIMITS.maxTitleLength} onChange={(e) => setTitle(e.target.value)} />
        <span className="hint">אפשר לשנות את השם גם אחר כך.</span>
      </label>
      <h2 className="section-title">איך מתחילים?</h2>
      <ul className="tpl-grid">
        <li>
          <button type="button" className="tpl-card tpl-card--blank" onClick={() => saveAndOpen(createEmptyStory(title.trim() || 'הסיפור החדש שלי'), toast)}>
            <span className="tpl-card__blank" aria-hidden="true">
              <Icon name="plus" size={40} />
            </span>
            <span className="tpl-card__title">דף חלק</span>
            <span className="tpl-card__blurb">מתחילות מאפס — הכול בידיים שלך</span>
          </button>
        </li>
        {previews.map(({ t, story }) => (
          <li key={t.id}>
            <button
              type="button"
              className="tpl-card"
              onClick={() => {
                const fresh = storyFromTemplate(t.id)!;
                const custom = title.trim() && title.trim() !== 'הסיפור החדש שלי' ? title.trim() : fresh.title;
                saveAndOpen({ ...fresh, title: custom }, toast);
              }}
            >
              <CoverThumb story={story} />
              <span className="tpl-card__title">{t.title}</span>
              <span className="tpl-card__blurb">{t.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="hint new-hint">
        אין רעיון?{' '}
        <button type="button" className="linkbtn" onClick={() => navigate('/ideas')}>
          נסי את צנצנת הרעיונות
        </button>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function storyFromIdea(idea: Idea, text: string): Story {
  const s = createEmptyStory(`הרפתקה ${idea.place.text}`.slice(0, LIMITS.maxTitleLength));
  const hero = createCharacter(idea.hero.kind);
  const first = s.scenes[0];
  return {
    ...s,
    description: text,
    characters: [hero],
    scenes: [
      {
        ...first,
        name: 'איך הכול התחיל',
        backgroundId: idea.place.bg,
        appearances: [createAppearance(hero.id, 0.3)],
        props: idea.event.prop ? [{ id: newId('prop'), kind: idea.event.prop, x: 0.66, y: 0.92, scale: 1 }] : [],
        lines: [createLine('narration', null, text)],
        next: {
          type: 'choice',
          prompt: 'מה עושים עכשיו?',
          options: [
            { id: newId('opt'), text: '', target: null },
            { id: newId('opt'), text: '', target: null },
          ],
        },
      },
    ],
  };
}

export function IdeasScreen() {
  const toast = useToast();
  return (
    <div className="page">
      <PageHeader title="צנצנת רעיונות" />
      <p className="lead">לחצי על הצנצנת ותקבלי גיבורה, מקום, אירוע מפתיע ומשימה. אהבת? מתחילים לכתוב!</p>
      <IdeaJar useLabel="אהבתי, מתחילים!" onUse={(idea, text) => saveAndOpen(storyFromIdea(idea, text), toast)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function PlayScreen({ id, fromEditor }: { id: string; fromEditor: boolean }) {
  const [story] = useState(() => (id === SAMPLE_STORY_ID ? getSampleStory() : getStore().load(id)));
  if (!story) {
    return (
      <div className="page page--center">
        <h1>לא מצאנו את הסיפור</h1>
        <button type="button" className="hs-btn hs-btn--primary" onClick={() => navigate('/library')}>הסיפורים שלי</button>
      </div>
    );
  }
  const editPath = `/edit/${encodeURIComponent(story.id)}`;
  return (
    <div className="play-page">
      <StoryPlayer
        story={story}
        onExit={() => navigate(fromEditor ? editPath : '/library')}
        exitLabel={fromEditor ? 'חזרה ליצירה' : 'לסיפורים שלי'}
        onEditScene={fromEditor ? () => navigate(editPath) : undefined}
      />
    </div>
  );
}

export function SampleScreen() {
  const toast = useToast();
  const [story] = useState(getSampleStory);
  return (
    <div className="play-page">
      <div className="sample-banner">
        <span>
          <Icon name="star" size={18} /> זה סיפור לדוגמה. אהבת?
        </span>
        <button
          type="button"
          className="hs-btn hs-btn--sm hs-btn--teal"
          onClick={() => saveAndOpen(cloneStoryAsNew(story, ' — הגרסה שלי'), toast)}
        >
          <Icon name="edit" size={18} /> ערכי גרסה משלך
        </button>
      </div>
      <StoryPlayer story={story} onExit={() => navigate('/')} exitLabel="למסך הבית" />
    </div>
  );
}
