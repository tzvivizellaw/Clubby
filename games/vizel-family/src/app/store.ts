import { create } from 'zustand';
import type { CastId, PlayerId, SeriesId } from '../data/characters';
import { loadSave, writeSave, type SaveData, type Settings } from '../progression/save';

export type Screen = 'title' | 'select' | 'map' | 'play' | 'seriesDone' | 'collection';

export interface RunHud {
  series: SeriesId;
  index: number;
  total: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  hardFail: boolean;
  title: string;
  phase: 'story' | 'game' | 'over' | 'idle';
}

export interface Subtitle {
  id: number;
  speaker: CastId | 'narrator';
  text: string;
  until: number;
}

export interface SeriesSummary {
  series: SeriesId;
  cleared: number;
  total: number;
  completed: boolean;
  gameOver: boolean;
  newAchievements: string[];
}

interface AppState {
  screen: Screen;
  player: PlayerId | null;
  save: SaveData;
  run: RunHud | null;
  paused: boolean;
  settingsOpen: boolean;
  subtitles: Subtitle[];
  toasts: { id: number; text: string; icon: string }[];
  summary: SeriesSummary | null;
  setScreen: (s: Screen) => void;
  setPlayer: (p: PlayerId) => void;
  updateSave: (fn: (s: SaveData) => void) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setRun: (r: RunHud | null) => void;
  patchRun: (patch: Partial<RunHud>) => void;
  setPaused: (p: boolean) => void;
  setSettingsOpen: (o: boolean) => void;
  pushSubtitle: (speaker: Subtitle['speaker'], text: string, ms: number) => void;
  toast: (text: string, icon?: string) => void;
  setSummary: (s: SeriesSummary | null) => void;
}

let subId = 1;

export const useApp = create<AppState>((set, get) => ({
  screen: 'title',
  player: loadSave().lastPlayer,
  save: loadSave(),
  run: null,
  paused: false,
  settingsOpen: false,
  subtitles: [],
  toasts: [],
  summary: null,
  setScreen: (screen) => set({ screen }),
  setPlayer: (player) => {
    get().updateSave((s) => {
      s.lastPlayer = player;
    });
    set({ player });
  },
  updateSave: (fn) => {
    const copy: SaveData = JSON.parse(JSON.stringify(get().save));
    fn(copy);
    writeSave(copy);
    set({ save: copy });
  },
  updateSettings: (patch) =>
    get().updateSave((s) => {
      s.settings = { ...s.settings, ...patch };
    }),
  setRun: (run) => set({ run }),
  patchRun: (patch) => {
    const r = get().run;
    if (r) set({ run: { ...r, ...patch } });
  },
  setPaused: (paused) => set({ paused }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  pushSubtitle: (speaker, text, ms) => {
    const id = subId++;
    const until = Date.now() + ms;
    set({ subtitles: [...get().subtitles.filter((s) => s.until > Date.now()).slice(-1), { id, speaker, text, until }] });
    setTimeout(() => set({ subtitles: get().subtitles.filter((s) => s.id !== id) }), ms);
  },
  toast: (text, icon = '⭐') => {
    const id = subId++;
    set({ toasts: [...get().toasts, { id, text, icon }] });
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 3200);
  },
  setSummary: (summary) => set({ summary }),
}));
