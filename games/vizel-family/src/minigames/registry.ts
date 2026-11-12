import type { SeriesId } from '../data/characters';
import { AVIGAIL } from './avigail/index';
import { DANIEL } from './daniel/index';
import { ESTI } from './esti/index';
import { FAMILY } from './family/index';
import type { MiniGameDef, MiniGameMeta } from './types';
import { YEDIDYA } from './yedidya/index';

/** Lazy code-split loaders: every mini-game lives in its own file named <ID>_<Name>.ts */
const modules = import.meta.glob('./*/[AFDYE][0-9]_*.ts');

export const LOADERS: Record<string, () => Promise<any>> = {};
for (const [path, load] of Object.entries(modules)) {
  const id = path.split('/').pop()!.split('_')[0];
  LOADERS[id] = load;
}

const ALL_META: Record<SeriesId, MiniGameMeta[]> = {
  family: FAMILY,
  avigail: AVIGAIL,
  daniel: DANIEL,
  yedidya: YEDIDYA,
  esti: ESTI,
};

function build(list: MiniGameMeta[]): MiniGameDef[] {
  return list.map((m, i) => ({
    ...m,
    nextStage: list[i + 1]?.id ?? null,
    load: () => {
      const l = LOADERS[m.id];
      if (!l) return Promise.reject(new Error(`mini-game ${m.id} has no implementation file`));
      return l();
    },
  }));
}

export const REGISTRY: Record<SeriesId, MiniGameDef[]> = {
  family: build(FAMILY),
  avigail: build(AVIGAIL),
  daniel: build(DANIEL),
  yedidya: build(YEDIDYA),
  esti: build(ESTI),
};

export function seriesGames(s: SeriesId): MiniGameDef[] {
  return REGISTRY[s];
}

export function allGames(): MiniGameDef[] {
  return Object.values(REGISTRY).flat();
}

export function gameById(id: string): MiniGameDef | undefined {
  return allGames().find((g) => g.id === id);
}
