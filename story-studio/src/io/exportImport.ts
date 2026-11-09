import type { Story } from '../model/types';
import { SCHEMA_VERSION } from '../model/types';
import { newId } from '../model/ids';
import { parseStoryText, type ParseResult } from './schema';

export const FILE_FORMAT = 'hasipur-story';

export function storyToJson(story: Story): string {
  return JSON.stringify({ format: FILE_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), story }, null, 2);
}

/**
 * Import a story file. If a story with the same ID already exists locally,
 * the import becomes a new copy — it never silently overwrites.
 */
export function importStory(text: string, idExists: (id: string) => boolean): ParseResult & { copied?: boolean } {
  const result = parseStoryText(text);
  if (!result.ok) return result;
  const now = Date.now();
  if (idExists(result.story.id)) {
    return {
      ...result,
      copied: true,
      story: { ...result.story, id: newId('story'), title: `${result.story.title} (עותק)`.slice(0, 80), createdAt: now, updatedAt: now },
    };
  }
  return { ...result, copied: false, story: { ...result.story, updatedAt: now } };
}

/** Safe file name: keep Hebrew/latin letters and digits. */
export function fileNameFor(story: Story, ext: string): string {
  const base = story.title.replace(/[^\p{L}\p{N}\- ]+/gu, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'sipur';
  return `${base}.${ext}`;
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
