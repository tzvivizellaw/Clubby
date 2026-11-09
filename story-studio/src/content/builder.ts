import type { Expression, GenreId, Line, Scene, SceneNext, Story, StoryCharacter } from '../model/types';
import { SCHEMA_VERSION } from '../model/types';
import { newId } from '../model/ids';
import { getCharacterKind } from '../assets/characterLibrary';

/** Compact way to write built-in stories (sample + templates). */

export interface CastDef {
  key: string;
  kind: string;
  name?: string;
}

/** [characterKey, x, expression?, flip?, scale?] */
export type CastPlacement = [string, number, Expression?, boolean?, number?];
/** ['n', text] = narration, [charKey, text] = speech, [charKey, text, 'thought'] = thought */
export type LineDef = [string, string, ('thought' | 'speech')?];

export interface SceneDef {
  key: string;
  name: string;
  bg: string;
  cast?: CastPlacement[];
  props?: [string, number, number, number?][];
  lines: LineDef[];
  next: { goto: string | null } | { prompt: string; options: [string, string | null][] } | { end: string };
}

export interface StoryDef {
  title: string;
  description: string;
  genre: GenreId;
  color: string;
  penName?: string;
  cast: CastDef[];
  scenes: SceneDef[];
  coverScene?: string;
}

export function buildStory(def: StoryDef, opts: { storyId?: string; stableIds?: string } = {}): Story {
  const mk = (prefix: string, key: string) => (opts.stableIds ? `${opts.stableIds}-${prefix}-${key}` : newId(prefix));
  const charIds = new Map<string, string>();
  const characters: StoryCharacter[] = def.cast.map((c) => {
    const kind = getCharacterKind(c.kind);
    const id = mk('char', c.key);
    charIds.set(c.key, id);
    return { id, kind: kind.id, name: c.name ?? kind.defaultName, colors: { ...kind.defaultColors } };
  });
  const sceneIds = new Map(def.scenes.map((s) => [s.key, mk('scene', s.key)]));
  const sid = (key: string | null) => (key ? (sceneIds.get(key) ?? null) : null);

  const scenes: Scene[] = def.scenes.map((s) => {
    let lineN = 0;
    let optN = 0;
    const lines: Line[] = s.lines.map(([who, text, kind]) => {
      lineN++;
      const lineId = mk('line', `${s.key}-${lineN}`);
      if (who === 'n' || !charIds.has(who)) return { id: lineId, kind: 'narration', characterId: null, text };
      return { id: lineId, kind: kind === 'thought' ? 'thought' : 'speech', characterId: charIds.get(who)!, text };
    });
    let next: SceneNext;
    if ('goto' in s.next) next = { type: 'goto', target: sid(s.next.goto) };
    else if ('end' in s.next) next = { type: 'end', endingName: s.next.end };
    else
      next = {
        type: 'choice',
        prompt: s.next.prompt,
        options: s.next.options.map(([text, target]) => ({ id: mk('opt', `${s.key}-${++optN}`), text, target: sid(target) })),
      };
    return {
      id: sceneIds.get(s.key)!,
      name: s.name,
      backgroundId: s.bg,
      appearances: (s.cast ?? []).map(([key, x, expression, flip, scale], i) => ({
        id: mk('app', `${s.key}-${i}`),
        characterId: charIds.get(key)!,
        x,
        y: 0.94,
        scale: scale ?? 1,
        flip: flip ?? false,
        expression: expression ?? 'happy',
      })),
      props: (s.props ?? []).map(([kind, x, y, scale], i) => ({ id: mk('prop', `${s.key}-${i}`), kind, x, y, scale: scale ?? 1 })),
      lines,
      next,
    };
  });

  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: opts.storyId ?? newId('story'),
    title: def.title,
    penName: def.penName ?? '',
    description: def.description,
    genre: def.genre,
    cover: { color: def.color, sceneId: def.coverScene ? sid(def.coverScene) : null },
    createdAt: now,
    updatedAt: now,
    startSceneId: scenes[0].id,
    characters,
    scenes,
  };
}
