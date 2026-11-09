import type {
  Appearance,
  ChoiceOption,
  Expression,
  GenreId,
  Line,
  LineKind,
  PropPlacement,
  Scene,
  SceneNext,
  Story,
  StoryCharacter,
} from '../model/types';
import { GENRES, LIMITS, SCHEMA_VERSION } from '../model/types';
import { CHARACTER_KINDS } from '../assets/characterLibrary';
import { BACKGROUNDS } from '../assets/backgrounds';
import { PROPS } from '../assets/props';
import { clamp } from '../model/ops';

/**
 * Strict parser for story data coming from outside (imported files, local storage, exported HTML).
 * Never trusts the input: checks types, clamps numbers, trims strings, drops unknown fields.
 */

export type ParseResult = { ok: true; story: Story; warnings: string[] } | { ok: false; error: string };

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const EXPRESSIONS: Expression[] = ['happy', 'surprised', 'thinking', 'sad'];
const LINE_KINDS: LineKind[] = ['speech', 'thought', 'narration'];

class Invalid extends Error {}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  // Drop control characters except newline and tab; keep Hebrew, emoji and bidi text intact.
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback;
}

function id(v: unknown): string {
  if (typeof v !== 'string' || !ID_RE.test(v)) throw new Invalid('מזהה לא תקין');
  return v;
}

function optId(v: unknown): string | null {
  return typeof v === 'string' && ID_RE.test(v) ? v : null;
}

function color(v: unknown, fallback: string): string {
  return typeof v === 'string' && COLOR_RE.test(v) ? v : fallback;
}

function arr(v: unknown, max: number, what: string): unknown[] {
  if (!Array.isArray(v)) throw new Invalid(`חסר מידע על ${what}`);
  if (v.length > max) throw new Invalid(`יש יותר מדי ${what} בקובץ`);
  return v;
}

function parseCharacter(v: unknown): StoryCharacter {
  if (!isObj(v)) throw new Invalid('דמות לא תקינה');
  const kind = CHARACTER_KINDS.find((k) => k.id === v.kind) ?? CHARACTER_KINDS[0];
  const colors = isObj(v.colors) ? v.colors : {};
  return {
    id: id(v.id),
    kind: kind.id,
    name: str(v.name, LIMITS.maxNameLength, kind.defaultName) || kind.defaultName,
    colors: {
      main: color(colors.main, kind.defaultColors.main),
      accent: color(colors.accent, kind.defaultColors.accent),
      hair: color(colors.hair, kind.defaultColors.hair),
    },
  };
}

function parseAppearance(v: unknown, charIds: Set<string>): Appearance | null {
  if (!isObj(v)) return null;
  const characterId = optId(v.characterId);
  if (!characterId || !charIds.has(characterId)) return null;
  return {
    id: id(v.id),
    characterId,
    x: num(v.x, 0, 1, 0.5),
    y: num(v.y, 0, 1, 0.92),
    scale: num(v.scale, LIMITS.minScale, LIMITS.maxScale, 1),
    flip: v.flip === true,
    expression: EXPRESSIONS.includes(v.expression as Expression) ? (v.expression as Expression) : 'happy',
  };
}

function parseProp(v: unknown): PropPlacement | null {
  if (!isObj(v)) return null;
  const kind = PROPS.find((p) => p.id === v.kind);
  if (!kind) return null;
  return {
    id: id(v.id),
    kind: kind.id,
    x: num(v.x, 0, 1, 0.5),
    y: num(v.y, 0, 1, 0.9),
    scale: num(v.scale, LIMITS.minScale, LIMITS.maxScale, 1),
  };
}

function parseLine(v: unknown, charIds: Set<string>): Line {
  if (!isObj(v)) throw new Invalid('שורת דיאלוג לא תקינה');
  const kind = LINE_KINDS.includes(v.kind as LineKind) ? (v.kind as LineKind) : 'narration';
  const characterId = optId(v.characterId);
  const validSpeaker = characterId && charIds.has(characterId) ? characterId : null;
  return {
    id: id(v.id),
    kind: kind !== 'narration' && !validSpeaker ? 'narration' : kind,
    characterId: kind === 'narration' ? null : validSpeaker,
    text: str(v.text, LIMITS.maxTextLength),
  };
}

function parseNext(v: unknown): SceneNext {
  if (!isObj(v)) return { type: 'end', endingName: '' };
  if (v.type === 'goto') return { type: 'goto', target: optId(v.target) };
  if (v.type === 'choice') {
    const options: ChoiceOption[] = arr(v.options ?? [], LIMITS.maxOptions, 'אפשרויות בחירה').map((o) => {
      if (!isObj(o)) throw new Invalid('בחירה לא תקינה');
      return { id: id(o.id), text: str(o.text, LIMITS.maxNameLength * 2), target: optId(o.target) };
    });
    return { type: 'choice', prompt: str(v.prompt, LIMITS.maxTextLength), options };
  }
  return { type: 'end', endingName: str(v.endingName, LIMITS.maxNameLength) };
}

function parseScene(v: unknown, charIds: Set<string>): Scene {
  if (!isObj(v)) throw new Invalid('סצנה לא תקינה');
  const bg = BACKGROUNDS.find((b) => b.id === v.backgroundId) ?? BACKGROUNDS[0];
  return {
    id: id(v.id),
    name: str(v.name, LIMITS.maxNameLength, 'סצנה') || 'סצנה',
    backgroundId: bg.id,
    appearances: arr(v.appearances ?? [], LIMITS.maxAppearancesPerScene, 'דמויות בסצנה')
      .map((a) => parseAppearance(a, charIds))
      .filter((a): a is Appearance => !!a),
    props: arr(v.props ?? [], LIMITS.maxPropsPerScene, 'אביזרים')
      .map(parseProp)
      .filter((p): p is PropPlacement => !!p),
    lines: arr(v.lines ?? [], LIMITS.maxLinesPerScene, 'שורות דיאלוג').map((l) => parseLine(l, charIds)),
    next: parseNext(v.next),
  };
}

/** Accepts either a raw story object or the export wrapper `{ format, story }`. */
export function parseStory(input: unknown): ParseResult {
  try {
    let data = input;
    if (isObj(data) && data.format === 'hasipur-story' && 'story' in data) data = data.story;
    if (!isObj(data)) return { ok: false, error: 'זה לא נראה כמו קובץ סיפור.' };
    if (typeof data.schemaVersion !== 'number') return { ok: false, error: 'זה לא נראה כמו קובץ סיפור של ״הסיפור שלי״.' };
    if (data.schemaVersion > SCHEMA_VERSION) {
      return { ok: false, error: 'הקובץ נוצר בגרסה חדשה יותר של המשחק, ולכן אי אפשר לפתוח אותו כאן.' };
    }
    if (data.schemaVersion < 1) return { ok: false, error: 'גרסת הקובץ לא מוכרת.' };

    const warnings: string[] = [];
    const characters = arr(data.characters ?? [], LIMITS.maxCharacters, 'דמויות').map(parseCharacter);
    const charIds = new Set(characters.map((c) => c.id));
    if (charIds.size !== characters.length) throw new Invalid('יש דמויות עם אותו מזהה');

    const scenes = arr(data.scenes, LIMITS.maxScenes, 'סצנות').map((s) => parseScene(s, charIds));
    if (scenes.length === 0) throw new Invalid('בסיפור אין אף סצנה');
    const sceneIds = new Set(scenes.map((s) => s.id));
    if (sceneIds.size !== scenes.length) throw new Invalid('יש סצנות עם אותו מזהה');

    let startSceneId = optId(data.startSceneId);
    if (!startSceneId || !sceneIds.has(startSceneId)) {
      startSceneId = scenes[0].id;
      warnings.push('סצנת הפתיחה לא נמצאה, ולכן הסיפור יתחיל מהסצנה הראשונה.');
    }

    const cover = isObj(data.cover) ? data.cover : {};
    const coverScene = optId(cover.sceneId);
    const now = Date.now();
    const story: Story = {
      schemaVersion: SCHEMA_VERSION,
      id: id(data.id),
      title: str(data.title, LIMITS.maxTitleLength, 'סיפור ללא שם').trim() || 'סיפור ללא שם',
      penName: str(data.penName, LIMITS.maxNameLength),
      description: str(data.description, LIMITS.maxDescriptionLength),
      genre: GENRES.some((g) => g.id === data.genre) ? (data.genre as GenreId) : 'adventure',
      cover: { color: color(cover.color, '#7c5cc4'), sceneId: coverScene && sceneIds.has(coverScene) ? coverScene : null },
      createdAt: num(data.createdAt, 0, 8.64e15, now),
      updatedAt: num(data.updatedAt, 0, 8.64e15, now),
      startSceneId,
      characters,
      scenes,
    };
    return { ok: true, story, warnings };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: `הקובץ לא תקין: ${e.message}.` };
    return { ok: false, error: 'הקובץ לא תקין.' };
  }
}

/** Parse JSON text with a size limit. */
export function parseStoryText(text: string): ParseResult {
  if (text.length > LIMITS.maxImportBytes) return { ok: false, error: 'הקובץ גדול מדי בשביל סיפור.' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'לא הצלחנו לקרוא את הקובץ. ודאי שבחרת קובץ סיפור (‎.json‎) שהורד מ״הסיפור שלי״.' };
  }
  return parseStory(data);
}
