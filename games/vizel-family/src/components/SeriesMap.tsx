import { useApp } from '../app/store';
import { Audio } from '../audio/AudioManager';
import { CHARACTERS, SERIES_TITLE, type SeriesId } from '../data/characters';
import { director } from '../engine/RunDirector';
import { seriesGames } from '../minigames/registry';
import { isUnlocked, unlockedCount } from '../progression/progression';
import { CharacterArt, ObjArt } from './Art';

export function SeriesMap() {
  const { player, save, setScreen, setSettingsOpen } = useApp();
  if (!player) return null;
  const prof = save.profiles[player];
  const series: SeriesId[] = [player, 'family'];
  const go = (s: SeriesId, i: number) => {
    Audio.unlock();
    Audio.sfx('whoosh');
    director.startRun(s, i);
  };
  return (
    <div className="screen map-screen">
      <header className="map-header">
        <button className="icon-btn" onClick={() => setScreen('select')} title="החלפת שחקן">
          <CharacterArt id={player} pose={{ expr: 'happy' }} className="mini-avatar" />
        </button>
        <div className="map-hello">
          שלום {save.playerName || CHARACTERS[player].name}! <span className="muted">ניצחונות: {prof.totalWins} · רצף שיא: {prof.bestStreak}</span>
        </div>
        <button className="icon-btn" data-testid="open-collection" onClick={() => setScreen('collection')} title="אוסף">🎒</button>
        <button className="icon-btn" data-testid="open-settings" onClick={() => setSettingsOpen(true)} title="הגדרות">⚙️</button>
      </header>
      <div className="series-list">
        {series.map((s) => {
          const games = seriesGames(s);
          const unl = unlockedCount(save, player, s);
          return (
            <section key={s} className={`series series-${s}`}>
              <div className="series-head">
                <h3>{SERIES_TITLE[s]}</h3>
                <span className="muted">
                  {unl}/8 פתוחים · שיא ריצה: {prof.bestRun[s] ?? 0}
                  {prof.seriesCompleted.includes(s) ? ' · 🏆 הושלמה' : ''}
                </span>
                <button className="small-btn" data-testid={`run-${s}`} onClick={() => go(s, 0)}>▶ ריצה מההתחלה</button>
              </div>
              <div className="stages">
                {games.map((g, i) => {
                  const open = isUnlocked(save, player, s, i);
                  const wins = prof.wins[g.id] ?? 0;
                  return (
                    <button
                      key={g.id}
                      data-testid={`stage-${g.id}`}
                      className={`stage ${open ? 'open' : 'locked'} ${wins ? 'won' : ''}`}
                      disabled={!open}
                      onClick={() => go(s, i)}
                      title={g.title}
                    >
                      <span className="stage-num">{i + 1}</span>
                      <ObjArt k={g.icon} className="stage-icon" />
                      <span className="stage-title">{g.title}</span>
                      {!open && <span className="lock">🔒</span>}
                      {wins > 0 && <span className="stage-star">⭐{wins > 1 ? wins : ''}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
