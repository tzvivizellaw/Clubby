import { useEffect, useState } from 'react';
import { useApp } from '../app/store';
import { Audio } from '../audio/AudioManager';
import { CHARACTERS, PLAYERS, SERIES_TITLE } from '../data/characters';
import { director } from '../engine/RunDirector';
import { allGames } from '../minigames/registry';
import { ACHIEVEMENTS } from '../progression/progression';
import { Heart, ObjArt } from './Art';

export function Hud() {
  const { run, save, paused, updateSettings } = useApp();
  if (!run) return null;
  return (
    <div className="hud">
      <div className="hud-left">
        <button className="hud-btn" data-testid="pause" onClick={() => director.pause(!paused)} aria-label="השהיה">
          ⏸
        </button>
        <button className="hud-btn" data-testid="mute" onClick={() => updateSettings({ muted: !save.settings.muted })} aria-label="השתקה">
          {save.settings.muted ? '🔇' : '🔊'}
        </button>
      </div>
      <div className="hud-center">
        <span className="hud-stage">
          {SERIES_TITLE[run.series]} · שלב {run.index + 1}/{run.total}
        </span>
        {run.streak >= 2 && <span className="hud-streak">🔥 {run.streak}</span>}
      </div>
      <div className="hud-hearts" data-testid="hearts" data-hearts={run.hearts} title={run.hardFail ? 'לבבות' : 'מצב פעוטות — אין פסילות'}>
        {Array.from({ length: run.maxHearts }).map((_, i) => (
          <Heart key={i} full={!run.hardFail || i < run.hearts} />
        ))}
      </div>
    </div>
  );
}

export function PauseMenu() {
  const { paused, run, setSettingsOpen } = useApp();
  if (!paused || !run) return null;
  return (
    <div className="modal-back">
      <div className="modal pause-modal">
        <h2>הפסקה ⏸</h2>
        <button className="big-btn" data-testid="resume" onClick={() => director.pause(false)}>
          ממשיכים!
        </button>
        <button className="mid-btn" onClick={() => setSettingsOpen(true)}>
          הגדרות ⚙️
        </button>
        <button className="mid-btn alt" data-testid="quit" onClick={() => director.quitToMap()}>
          חזרה למפה
        </button>
      </div>
    </div>
  );
}

function ParentGate({ onPass }: { onPass: () => void }) {
  const [q] = useState(() => {
    const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 6);
    return { a, b };
  });
  const [v, setV] = useState('');
  return (
    <div className="parent-gate">
      <div>להורים בלבד: כמה זה {q.a} × {q.b}?</div>
      <input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} />
      <button className="small-btn" onClick={() => Number(v) === q.a * q.b && onPass()}>
        אישור
      </button>
    </div>
  );
}

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, save, updateSettings } = useApp();
  const [parentOk, setParentOk] = useState(false);
  if (!settingsOpen) return null;
  const s = save.settings;
  const slider = (k: 'music' | 'sfx' | 'voice', label: string) => (
    <label className="row">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={s[k]} onChange={(e) => updateSettings({ [k]: Number(e.target.value) } as any)} />
    </label>
  );
  return (
    <div className="modal-back" onClick={() => setSettingsOpen(false)}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>הגדרות</h2>
        {slider('music', 'מוזיקה')}
        {slider('sfx', 'אפקטים')}
        {slider('voice', 'קולות')}
        <label className="row">
          <span>השתקה מלאה</span>
          <input type="checkbox" checked={s.muted} onChange={(e) => updateSettings({ muted: e.target.checked })} />
        </label>
        <label className="row">
          <span>כתוביות</span>
          <input type="checkbox" checked={s.subtitles} onChange={(e) => updateSettings({ subtitles: e.target.checked })} />
        </label>
        <label className="row">
          <span>קול זמני (כשאין הקלטה)</span>
          <select value={s.voiceFallback} onChange={(e) => updateSettings({ voiceFallback: e.target.value as any })}>
            <option value="babble">ג'יבריש מצויר</option>
            <option value="tts">הקראה ממוחשבת</option>
            <option value="silent">שקט</option>
          </select>
        </label>
        <label className="row">
          <span>דילוג אוטומטי על סצנות פתיחה</span>
          <input type="checkbox" checked={s.skipStories} onChange={(e) => updateSettings({ skipStories: e.target.checked })} />
        </label>
        <h3>הגדרות הורים — רמת קושי</h3>
        {!parentOk ? (
          <ParentGate onPass={() => setParentOk(true)} />
        ) : (
          PLAYERS.map((p) => (
            <label className="row" key={p}>
              <span>{CHARACTERS[p].name}</span>
              <select
                data-testid={`diff-${p}`}
                value={s.difficulty[p]}
                onChange={(e) => updateSettings({ difficulty: { ...s.difficulty, [p]: e.target.value as any } })}
              >
                <option value="easier">קל יותר</option>
                <option value="auto">לפי הגיל</option>
                <option value="harder">קשה יותר</option>
              </select>
            </label>
          ))
        )}
        <button className="big-btn" onClick={() => setSettingsOpen(false)}>
          סגירה
        </button>
      </div>
    </div>
  );
}

export function Subtitles() {
  const subs = useApp((s) => s.subtitles);
  const last = subs[subs.length - 1];
  if (!last) return null;
  const name = last.speaker === 'narrator' ? '' : CHARACTERS[last.speaker]?.name;
  return (
    <div className="subtitles" key={last.id}>
      {name && <b style={{ color: CHARACTERS[last.speaker as keyof typeof CHARACTERS]?.color }}>{name}: </b>}
      {last.text}
    </div>
  );
}

export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span>{t.icon}</span> {t.text}
        </div>
      ))}
    </div>
  );
}

export function SeriesDone() {
  const { summary, setScreen } = useApp();
  if (!summary) return null;
  return (
    <div className="screen done-screen">
      <div className="confetti-rain">{Array.from({ length: 40 }).map((_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.2}s` }} />)}</div>
      <ObjArt k="trophy" className="done-trophy" />
      <h2>סיימתם את {SERIES_TITLE[summary.series]}!</h2>
      <p>
        עברתם {summary.cleared} שלבים בריצה. {summary.newAchievements.length ? `הישגים חדשים: ${summary.newAchievements.length} 🏆` : ''}
      </p>
      <button className="big-btn" data-testid="done-map" onClick={() => setScreen('map')}>
        למפה
      </button>
    </div>
  );
}

export function Collection() {
  const { save, player, setScreen } = useApp();
  if (!player) return null;
  const games = allGames();
  const items = save.profiles[player].items;
  return (
    <div className="screen collection-screen">
      <h2 className="screen-title">האוסף של {CHARACTERS[player].name}</h2>
      <div className="collection-grid">
        {games.map((g) => {
          const has = items.includes(g.item);
          return (
            <div key={g.id} className={`coll-item ${has ? 'has' : ''}`} title={g.title}>
              <ObjArt k={g.icon} className="coll-icon" />
              <span>{has ? g.item : '???'}</span>
            </div>
          );
        })}
      </div>
      <h3>הישגים</h3>
      <div className="ach-list">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={`ach ${save.achievements.includes(a.id) ? 'has' : ''}`}>
            {a.icon} {a.title}
          </div>
        ))}
      </div>
      <button className="big-btn" onClick={() => setScreen('map')}>
        חזרה
      </button>
    </div>
  );
}

export function RotateHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => setShow(window.innerHeight > window.innerWidth * 1.15 && window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!show) return null;
  return (
    <div className="rotate-hint" onClick={() => setShow(false)}>
      📱↻ סובבו את המכשיר לרוחב בשביל מסך גדול יותר (אפשר גם לשחק כך)
    </div>
  );
}

export function useAudioSettings() {
  const settings = useApp((s) => s.save.settings);
  useEffect(() => {
    Audio.apply(settings);
  }, [settings]);
}
