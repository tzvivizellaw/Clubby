import type { Scene, Story } from '../model/types';
import { getScene } from '../model/ops';

/** Pure state machine for playing a story. Shared by the in-app player and the HTML export. */

export type Phase = 'cover' | 'playing' | 'stuck' | 'ending';

export interface Position {
  phase: Phase;
  sceneId: string;
  /** Index of the line on screen. === lines.length means "after the dialogue" (choices). */
  lineIndex: number;
}

export interface PlayerState extends Position {
  history: Position[];
  endingsFound: string[];
}

export function initialState(story: Story): PlayerState {
  return { phase: 'cover', sceneId: story.startSceneId, lineIndex: 0, history: [], endingsFound: [] };
}

function pos(s: PlayerState): Position {
  return { phase: s.phase, sceneId: s.sceneId, lineIndex: s.lineIndex };
}

function push(s: PlayerState, next: Position): PlayerState {
  return { ...s, ...next, history: [...s.history, pos(s)] };
}

export function currentScene(story: Story, s: PlayerState): Scene | undefined {
  return getScene(story, s.sceneId);
}

export function isAtChoices(story: Story, s: PlayerState): boolean {
  const scene = currentScene(story, s);
  return !!scene && s.phase === 'playing' && scene.next.type === 'choice' && s.lineIndex >= scene.lines.length;
}

function enterScene(story: Story, s: PlayerState, target: string | null): PlayerState {
  if (!target || !getScene(story, target)) {
    return push(s, { phase: 'stuck', sceneId: s.sceneId, lineIndex: s.lineIndex });
  }
  return push(s, { phase: 'playing', sceneId: target, lineIndex: 0 });
}

export function start(story: Story, s: PlayerState): PlayerState {
  if (!getScene(story, story.startSceneId)) return s;
  return push(s, { phase: 'playing', sceneId: story.startSceneId, lineIndex: 0 });
}

/** "Next": advance the dialogue, or follow a direct link / reach the ending. */
export function advance(story: Story, s: PlayerState): PlayerState {
  if (s.phase !== 'playing') return s;
  const scene = currentScene(story, s);
  if (!scene) return s;
  const last = Math.max(0, scene.lines.length - 1);
  if (s.lineIndex < last) return push(s, { ...pos(s), lineIndex: s.lineIndex + 1 });

  switch (scene.next.type) {
    case 'choice':
      if (s.lineIndex >= scene.lines.length) return s; // waiting for a choice
      return push(s, { ...pos(s), lineIndex: scene.lines.length });
    case 'goto':
      return enterScene(story, s, scene.next.target);
    case 'end': {
      const endingsFound = s.endingsFound.includes(scene.id) ? s.endingsFound : [...s.endingsFound, scene.id];
      return { ...push(s, { ...pos(s), phase: 'ending' }), endingsFound };
    }
  }
}

export function choose(story: Story, s: PlayerState, optionId: string): PlayerState {
  if (!isAtChoices(story, s)) return s;
  const scene = currentScene(story, s)!;
  if (scene.next.type !== 'choice') return s;
  const option = scene.next.options.find((o) => o.id === optionId);
  if (!option) return s;
  return enterScene(story, s, option.target);
}

export function back(s: PlayerState): PlayerState {
  if (!s.history.length) return s;
  const prev = s.history[s.history.length - 1];
  return { ...s, ...prev, history: s.history.slice(0, -1) };
}

export function restart(story: Story, s: PlayerState): PlayerState {
  return { ...initialState(story), endingsFound: s.endingsFound };
}

export function canGoBack(s: PlayerState): boolean {
  return s.history.length > 0 && s.phase !== 'cover';
}

export function endingName(story: Story, s: PlayerState): string {
  const scene = currentScene(story, s);
  if (scene?.next.type === 'end') return scene.next.endingName.trim() || 'סוף הסיפור';
  return 'סוף הסיפור';
}

export function totalEndings(story: Story): number {
  return story.scenes.filter((s) => s.next.type === 'end').length;
}
