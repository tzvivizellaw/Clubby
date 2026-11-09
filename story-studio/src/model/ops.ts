import { newId } from './ids';
import type { Scene, Story, SceneNext } from './types';
import { LIMITS } from './types';

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Keep a character at least partly visible inside the stage. */
export function clampPosition(x: number, y: number) {
  return { x: clamp(x, 0.1, 0.9), y: clamp(y, 0.35, 1) };
}

export function touch(story: Story): Story {
  return { ...story, updatedAt: Date.now() };
}

export function getScene(story: Story, sceneId: string | null | undefined): Scene | undefined {
  if (!sceneId) return undefined;
  return story.scenes.find((s) => s.id === sceneId);
}

export function updateScene(story: Story, sceneId: string, fn: (s: Scene) => Scene): Story {
  return { ...story, scenes: story.scenes.map((s) => (s.id === sceneId ? fn(s) : s)) };
}

export function addScene(story: Story, scene: Scene, afterId?: string): Story {
  const scenes = [...story.scenes];
  const idx = afterId ? scenes.findIndex((s) => s.id === afterId) : -1;
  if (idx >= 0) scenes.splice(idx + 1, 0, scene);
  else scenes.push(scene);
  return { ...story, scenes };
}

function cloneNext(next: SceneNext): SceneNext {
  if (next.type === 'choice') {
    return { ...next, options: next.options.map((o) => ({ ...o, id: newId('opt') })) };
  }
  return { ...next };
}

/** Duplicate a scene with a brand-new ID (and new IDs for its inner items). Links out are kept. */
export function duplicateScene(story: Story, sceneId: string): { story: Story; newSceneId: string | null } {
  const src = getScene(story, sceneId);
  if (!src) return { story, newSceneId: null };
  const copy: Scene = {
    ...src,
    id: newId('scene'),
    name: `${src.name} (עותק)`.slice(0, LIMITS.maxNameLength),
    appearances: src.appearances.map((a) => ({ ...a, id: newId('app') })),
    props: src.props.map((p) => ({ ...p, id: newId('prop') })),
    lines: src.lines.map((l) => ({ ...l, id: newId('line') })),
    next: cloneNext(src.next),
  };
  return { story: addScene(story, copy, sceneId), newSceneId: copy.id };
}

export interface IncomingLink {
  fromSceneId: string;
  fromSceneName: string;
  optionId: string | null;
  label: string;
}

/** Every place in the story that leads to `sceneId`. */
export function findIncomingLinks(story: Story, sceneId: string): IncomingLink[] {
  const result: IncomingLink[] = [];
  for (const s of story.scenes) {
    if (s.next.type === 'goto' && s.next.target === sceneId) {
      result.push({ fromSceneId: s.id, fromSceneName: s.name, optionId: null, label: 'מעבר ישיר' });
    } else if (s.next.type === 'choice') {
      for (const o of s.next.options) {
        if (o.target === sceneId) {
          result.push({ fromSceneId: s.id, fromSceneName: s.name, optionId: o.id, label: o.text || 'בחירה ללא טקסט' });
        }
      }
    }
  }
  return result;
}

/** Point every link aimed at `from` to `to` (or clear it when `to` is null). */
export function retargetLinks(story: Story, from: string, to: string | null): Story {
  return {
    ...story,
    scenes: story.scenes.map((s) => {
      if (s.next.type === 'goto' && s.next.target === from) return { ...s, next: { ...s.next, target: to } };
      if (s.next.type === 'choice' && s.next.options.some((o) => o.target === from)) {
        return {
          ...s,
          next: { ...s.next, options: s.next.options.map((o) => (o.target === from ? { ...o, target: to } : o)) },
        };
      }
      return s;
    }),
  };
}

/**
 * Delete a scene. Links that pointed at it are redirected to `replacement`
 * or cleared (and then reported by the link checker — never silently broken).
 */
export function deleteScene(story: Story, sceneId: string, replacement: string | null = null): Story {
  if (story.scenes.length <= 1) return story;
  const safeReplacement = replacement && replacement !== sceneId && getScene(story, replacement) ? replacement : null;
  let next = retargetLinks(story, sceneId, safeReplacement);
  const scenes = next.scenes.filter((s) => s.id !== sceneId);
  const startSceneId = next.startSceneId === sceneId ? (safeReplacement ?? scenes[0].id) : next.startSceneId;
  const cover = next.cover.sceneId === sceneId ? { ...next.cover, sceneId: null } : next.cover;
  next = { ...next, scenes, startSceneId, cover };
  return next;
}

export function moveScene(story: Story, sceneId: string, delta: number): Story {
  const idx = story.scenes.findIndex((s) => s.id === sceneId);
  const to = idx + delta;
  if (idx < 0 || to < 0 || to >= story.scenes.length) return story;
  const scenes = [...story.scenes];
  const [item] = scenes.splice(idx, 1);
  scenes.splice(to, 0, item);
  return { ...story, scenes };
}

export function moveInArray<T>(arr: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (index < 0 || to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(index, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Remove a character from the story: its appearances go, its lines become narration. */
export function removeCharacter(story: Story, characterId: string): Story {
  return {
    ...story,
    characters: story.characters.filter((c) => c.id !== characterId),
    scenes: story.scenes.map((s) => ({
      ...s,
      appearances: s.appearances.filter((a) => a.characterId !== characterId),
      lines: s.lines.map((l) => (l.characterId === characterId ? { ...l, characterId: null, kind: 'narration' as const } : l)),
    })),
  };
}

/** Deep copy of a story with a new story ID (scene IDs can stay — they are scoped to the story). */
export function cloneStoryAsNew(story: Story, titleSuffix = ''): Story {
  const now = Date.now();
  const copy: Story = JSON.parse(JSON.stringify(story));
  return {
    ...copy,
    id: newId('story'),
    title: `${story.title}${titleSuffix}`.slice(0, LIMITS.maxTitleLength),
    createdAt: now,
    updatedAt: now,
  };
}
