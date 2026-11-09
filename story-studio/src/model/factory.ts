import { newId } from './ids';
import type { Scene, Story, StoryCharacter, Appearance, Line, LineKind } from './types';
import { SCHEMA_VERSION } from './types';
import { getCharacterKind } from '../assets/characterLibrary';

export function createScene(name: string, backgroundId = 'library'): Scene {
  return {
    id: newId('scene'),
    name,
    backgroundId,
    appearances: [],
    props: [],
    lines: [],
    next: { type: 'end', endingName: '' },
  };
}

export function createEmptyStory(title = 'הסיפור החדש שלי'): Story {
  const first = createScene('ההתחלה', 'bedroom');
  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId('story'),
    title,
    penName: '',
    description: '',
    genre: 'adventure',
    cover: { color: '#7c5cc4', sceneId: null },
    createdAt: now,
    updatedAt: now,
    startSceneId: first.id,
    characters: [],
    scenes: [first],
  };
}

export function createCharacter(kind: string, name?: string): StoryCharacter {
  const def = getCharacterKind(kind);
  return {
    id: newId('char'),
    kind: def.id,
    name: name ?? def.defaultName,
    colors: { ...def.defaultColors },
  };
}

export function createAppearance(characterId: string, x = 0.5): Appearance {
  return { id: newId('app'), characterId, x, y: 0.92, scale: 1, flip: false, expression: 'happy' };
}

export function createLine(kind: LineKind, characterId: string | null, text = ''): Line {
  return { id: newId('line'), kind, characterId: kind === 'narration' ? null : characterId, text };
}
