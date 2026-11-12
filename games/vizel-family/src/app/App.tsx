import { useEffect } from 'react';
import { Audio } from '../audio/AudioManager';
import { CharacterSelect } from '../components/CharacterSelect';
import { GameCanvas } from '../components/GameCanvas';
import { Collection, Hud, PauseMenu, RotateHint, SeriesDone, SettingsModal, Subtitles, Toasts, useAudioSettings } from '../components/Overlays';
import { SeriesMap } from '../components/SeriesMap';
import { TitleScreen } from '../components/TitleScreen';
import { director } from '../engine/RunDirector';
import { getGame } from '../engine/PhaserGame';
import { allGames } from '../minigames/registry';
import { useApp } from './store';

export function App() {
  const screen = useApp((s) => s.screen);
  const paused = useApp((s) => s.paused);
  useAudioSettings();

  useEffect(() => {
    Audio.setSubtitleSink((sp, t, ms) => useApp.getState().pushSubtitle(sp, t, ms));
    Audio.loadManifest();
    const unlock = () => Audio.unlock();
    window.addEventListener('pointerdown', unlock);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useApp.getState().run) director.pause(!useApp.getState().paused);
      if (e.key.toLowerCase() === 'm') {
        const s = useApp.getState();
        s.updateSettings({ muted: !s.save.settings.muted });
      }
    };
    window.addEventListener('keydown', onKey);
    const onVis = () => {
      if (document.hidden && useApp.getState().run && !useApp.getState().paused) director.pause(true);
    };
    document.addEventListener('visibilitychange', onVis);
    // Test / debug hooks (used by the automated browser tests)
    (window as any).__vizel = {
      director,
      store: useApp,
      game: () => getGame(),
      games: () => allGames().map((g) => g.id),
      audio: Audio,
    };
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className={`app screen-${screen}`}>
      <GameCanvas visible={screen === 'play'} />
      {screen === 'title' && <TitleScreen />}
      {screen === 'select' && <CharacterSelect />}
      {screen === 'map' && <SeriesMap />}
      {screen === 'seriesDone' && <SeriesDone />}
      {screen === 'collection' && <Collection />}
      {screen === 'play' && <Hud />}
      {paused && <PauseMenu />}
      <SettingsModal />
      <Subtitles />
      <Toasts />
      <RotateHint />
    </div>
  );
}
