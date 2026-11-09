/** Story data model — the single source of truth for editor, player, storage and export. */

export const SCHEMA_VERSION = 1 as const;

export type Expression = 'happy' | 'surprised' | 'thinking' | 'sad';
export type LineKind = 'speech' | 'thought' | 'narration';
export type GenreId = 'adventure' | 'mystery' | 'friendship' | 'space' | 'animals' | 'magic' | 'funny';

export interface CharacterColors {
  main: string;
  accent: string;
  hair: string;
}

/** A character's identity in the story (shared across all scenes). */
export interface StoryCharacter {
  id: string;
  /** Which illustration from the character library. */
  kind: string;
  name: string;
  colors: CharacterColors;
}

/** How a character appears in one particular scene. */
export interface Appearance {
  id: string;
  characterId: string;
  /** Relative position of the character's feet, 0..1 of the stage width/height. */
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  expression: Expression;
}

export interface PropPlacement {
  id: string;
  kind: string;
  x: number;
  y: number;
  scale: number;
}

export interface Line {
  id: string;
  kind: LineKind;
  /** Speaker for speech/thought. Narration has no speaker. */
  characterId: string | null;
  text: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  target: string | null;
}

export type SceneNext =
  | { type: 'goto'; target: string | null }
  | { type: 'choice'; prompt: string; options: ChoiceOption[] }
  | { type: 'end'; endingName: string };

export interface Scene {
  id: string;
  name: string;
  backgroundId: string;
  /** Rendered in array order: later = in front. */
  appearances: Appearance[];
  props: PropPlacement[];
  lines: Line[];
  next: SceneNext;
}

export interface Story {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  title: string;
  penName: string;
  description: string;
  genre: GenreId;
  cover: { color: string; sceneId: string | null };
  createdAt: number;
  updatedAt: number;
  startSceneId: string;
  characters: StoryCharacter[];
  scenes: Scene[];
}

export const GENRES: { id: GenreId; label: string }[] = [
  { id: 'adventure', label: 'הרפתקה' },
  { id: 'mystery', label: 'תעלומה' },
  { id: 'friendship', label: 'חברות' },
  { id: 'space', label: 'חלל' },
  { id: 'animals', label: 'חיות' },
  { id: 'magic', label: 'קסם ודמיון' },
  { id: 'funny', label: 'מצחיק' },
];

export const COVER_COLORS = ['#7c5cc4', '#1f9e95', '#e8866a', '#e2b23a', '#3d6fb6', '#c75d8e', '#4f8a4b', '#3b3355'];

export const EXPRESSIONS: { id: Expression; label: string }[] = [
  { id: 'happy', label: 'שמחה' },
  { id: 'surprised', label: 'מופתעת' },
  { id: 'thinking', label: 'חושבת' },
  { id: 'sad', label: 'עצובה' },
];

export const LINE_KINDS: { id: LineKind; label: string }[] = [
  { id: 'speech', label: 'בועת דיבור' },
  { id: 'thought', label: 'בועת מחשבה' },
  { id: 'narration', label: 'תיבת מספרת' },
];

export const LIMITS = {
  maxScenes: 120,
  maxCharacters: 30,
  maxAppearancesPerScene: 8,
  maxPropsPerScene: 10,
  maxLinesPerScene: 40,
  maxOptions: 3,
  maxTextLength: 600,
  maxNameLength: 60,
  maxTitleLength: 80,
  maxDescriptionLength: 300,
  maxImportBytes: 2 * 1024 * 1024,
  longLineHint: 140,
  minScale: 0.6,
  maxScale: 1.6,
};
