import { useState } from 'react';
import type { Story } from '../model/types';
import { COVER_COLORS, GENRES, LIMITS } from '../model/types';
import { findIncomingLinks } from '../model/ops';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/icons';
import type { UpdateStory } from './common';
import { downloadText, fileNameFor, storyToJson } from '../io/exportImport';
import { buildStandaloneHtml } from '../io/exportHtml';
import { useToast } from '../ui/Toast';
import { Swatches } from './common';

export function DetailsModal({ open, onClose, story, update }: { open: boolean; onClose: () => void; story: Story; update: UpdateStory }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="פרטי הסיפור"
      footer={
        <button type="button" className="hs-btn hs-btn--primary" onClick={onClose}>
          <Icon name="check" /> סיימתי
        </button>
      }
    >
      <div className="form">
        <label className="field">
          <span className="field__label">שם הסיפור</span>
          <input className="input" dir="auto" value={story.title} maxLength={LIMITS.maxTitleLength} onChange={(e) => update((s) => ({ ...s, title: e.target.value }), 'title')} />
        </label>
        <label className="field">
          <span className="field__label">שם עט (לא חובה)</span>
          <input className="input" dir="auto" value={story.penName} maxLength={LIMITS.maxNameLength} placeholder="למשל: הסופרת המסתורית" onChange={(e) => update((s) => ({ ...s, penName: e.target.value }), 'pen')} />
          <span className="hint">אין צורך בשם אמיתי. אפשר להמציא שם עט!</span>
        </label>
        <label className="field">
          <span className="field__label">תיאור קצר (לא חובה)</span>
          <textarea className="textarea" dir="auto" rows={2} value={story.description} maxLength={LIMITS.maxDescriptionLength} placeholder="על מה הסיפור?" onChange={(e) => update((s) => ({ ...s, description: e.target.value }), 'desc')} />
        </label>
        <label className="field">
          <span className="field__label">ז׳אנר</span>
          <select className="select" value={story.genre} onChange={(e) => update((s) => ({ ...s, genre: e.target.value as Story['genre'] }))}>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span className="field__label">צבע הכריכה</span>
          <Swatches label="צבע הכריכה" colors={COVER_COLORS} value={story.cover.color} onPick={(color) => update((s) => ({ ...s, cover: { ...s.cover, color } }))} />
        </div>
        <label className="field">
          <span className="field__label">תמונת הכריכה</span>
          <select className="select" value={story.cover.sceneId ?? ''} onChange={(e) => update((s) => ({ ...s, cover: { ...s.cover, sceneId: e.target.value || null } }))}>
            <option value="">סצנת הפתיחה</option>
            {story.scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}

export function DeleteSceneModal({
  open,
  onClose,
  story,
  sceneId,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  story: Story;
  sceneId: string | null;
  onDelete: (replacement: string | null) => void;
}) {
  const [replacement, setReplacement] = useState('');
  const scene = story.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;
  const incoming = findIncomingLinks(story, scene.id);
  const others = story.scenes.filter((s) => s.id !== scene.id);
  const isStart = story.startSceneId === scene.id;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`למחוק את ״${scene.name}״?`}
      size="sm"
      footer={
        <>
          <button type="button" className="hs-btn hs-btn--danger" onClick={() => onDelete(replacement || null)}>
            <Icon name="trash" /> כן, למחוק
          </button>
          <button type="button" className="hs-btn" onClick={onClose} autoFocus>
            ביטול
          </button>
        </>
      }
    >
      <p>הסצנה, הדמויות שמופיעות בה והטקסטים שלה יימחקו. אפשר לבטל עם ״ביטול פעולה״ מיד אחרי.</p>
      {isStart && <p className="warn-line"><Icon name="warning" size={16} /> זו סצנת הפתיחה. אחרי המחיקה הסיפור יתחיל מהסצנה שתבחרי למטה (או מהסצנה הראשונה ברשימה).</p>}
      {incoming.length > 0 && (
        <div className="incoming">
          <p className="warn-line">
            <Icon name="warning" size={16} /> {incoming.length === 1 ? 'יש מקום אחד בסיפור שמוביל' : `יש ${incoming.length} מקומות בסיפור שמובילים`} לסצנה הזאת:
          </p>
          <ul>
            {incoming.map((l) => (
              <li key={`${l.fromSceneId}-${l.optionId}`}>
                בסצנה ״{l.fromSceneName}״ — {l.optionId ? `הבחירה ״${l.label}״` : l.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(incoming.length > 0 || isStart) && (
        <label className="field">
          <span className="field__label">לאן הם יובילו מעכשיו?</span>
          <select className="select" value={replacement} onChange={(e) => setReplacement(e.target.value)}>
            <option value="">להשאיר בלי המשך (אתקן אחר כך)</option>
            {others.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {!replacement && incoming.length > 0 && <span className="hint">בדיקת הסיפור תזכיר לך אילו בחירות צריך לחבר מחדש.</span>}
        </label>
      )}
    </Modal>
  );
}

export function ShareModal({ open, onClose, story }: { open: boolean; onClose: () => void; story: Story }) {
  const toast = useToast();
  return (
    <Modal open={open} onClose={onClose} title="שמירה ושיתוף">
      <div className="share">
        <section className="share__card">
          <h3>
            <Icon name="play" /> משחק לשיתוף (קובץ HTML)
          </h3>
          <p>קובץ אחד שאפשר לשלוח לחברות ולמשפחה. פותחים אותו בדפדפן במחשב ומשחקים — בלי התקנה ובלי אינטרנט.</p>
          <button
            type="button"
            className="hs-btn hs-btn--primary"
            onClick={async () => {
              try {
                // The player bundle is large, so it's only loaded when needed.
                const { playerBundle } = await import('../io/playerBundle');
                downloadText(fileNameFor(story, 'html'), buildStandaloneHtml(story, playerBundle), 'text/html');
                toast('קובץ המשחק ירד למכשיר', 'success');
              } catch {
                toast('לא הצלחנו ליצור את הקובץ. נסי שוב.', 'error');
              }
            }}
          >
            <Icon name="download" /> הורדת קובץ משחק
          </button>
          <p className="hint">שימי לב: בטלפונים, פתיחת קובץ HTML שהתקבל בהודעה לא תמיד עובדת. הכי בטוח לפתוח אותו במחשב.</p>
        </section>
        <section className="share__card">
          <h3>
            <Icon name="download" /> גיבוי לעריכה (קובץ סיפור)
          </h3>
          <p>קובץ ששומר את כל הסיפור. אפשר לייבא אותו שוב ב״הסיפורים שלי״ ולהמשיך לערוך — גם במחשב אחר.</p>
          <button
            type="button"
            className="hs-btn"
            onClick={() => {
              downloadText(fileNameFor(story, 'json'), storyToJson(story), 'application/json');
              toast('קובץ הגיבוי ירד למכשיר', 'success');
            }}
          >
            <Icon name="download" /> הורדת קובץ סיפור
          </button>
        </section>
        <p className="hint">
          <Icon name="info" size={16} /> הסיפור נשמר רק במכשיר הזה ובדפדפן הזה. הוא לא עובר לבד למכשיר אחר, וניקוי נתוני הדפדפן עלול למחוק אותו — לכן כדאי להוריד גיבוי מדי פעם.
        </p>
      </div>
    </Modal>
  );
}
