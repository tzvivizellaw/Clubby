import { describe, expect, it } from 'vitest';
import { getSampleStory } from '../content/sampleStory';
import { parseStory, parseStoryText } from './schema';
import { importStory, storyToJson } from './exportImport';
import { buildStandaloneHtml, escapeHtml, jsonForScript } from './exportHtml';
import { MemoryKV, StoryStore } from '../storage/storage';
import { createEmptyStory } from '../model/factory';

describe('JSON export / import', () => {
  it('round-trips a story exactly', () => {
    const s = getSampleStory();
    const res = parseStoryText(storyToJson(s));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.story).toEqual(s);
  });

  it('importing an existing ID creates a new copy, not an overwrite', () => {
    const s = getSampleStory();
    const res = importStory(storyToJson(s), (id) => id === s.id);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.copied).toBe(true);
      expect(res.story.id).not.toBe(s.id);
      expect(res.story.title).toContain('(עותק)');
    }
  });

  it('rejects invalid data with a friendly Hebrew message', () => {
    const bad = ['not json', '[]', '{}', JSON.stringify({ schemaVersion: 1, id: 'x', scenes: [] }), JSON.stringify({ schemaVersion: 99, id: 'x', scenes: [] })];
    for (const text of bad) {
      const r = parseStoryText(text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/[א-ת]/);
    }
    expect(parseStoryText('x'.repeat(3 * 1024 * 1024)).ok).toBe(false);
  });

  it('rejects bad IDs and too many scenes', () => {
    const s = getSampleStory();
    const evilId = JSON.parse(storyToJson(s));
    evilId.story.scenes[0].id = '"><script>';
    expect(parseStory(evilId).ok).toBe(false);
    const many = JSON.parse(storyToJson(s));
    many.story.scenes = Array.from({ length: 500 }, () => many.story.scenes[0]);
    expect(parseStory(many).ok).toBe(false);
  });

  it('cleans up unknown values instead of trusting them', () => {
    const s = getSampleStory();
    const data = JSON.parse(storyToJson(s));
    data.story.scenes[0].backgroundId = 'javascript:alert(1)';
    data.story.cover.color = 'red;background:url(x)';
    data.story.scenes[0].appearances[0].x = 999;
    data.story.title = 'א'.repeat(1000);
    data.story.startSceneId = 'missing';
    const r = parseStory(data);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.story.scenes[0].backgroundId).toBe('bedroom');
      expect(r.story.cover.color).toBe('#7c5cc4');
      expect(r.story.scenes[0].appearances[0].x).toBe(1);
      expect(r.story.title.length).toBeLessThanOrEqual(80);
      expect(r.story.startSceneId).toBe(r.story.scenes[0].id);
      expect(r.warnings.length).toBe(1);
    }
  });
});

describe('HTML export safety', () => {
  const nasty = 'שלום </script><script>alert("x")</script> & <!-- ' + String.fromCharCode(0x2028) + ' English 123 ״מרכאות״';

  it('embeds Hebrew and special characters without breaking out of the script tag', () => {
    const s = createEmptyStory(nasty);
    s.scenes[0].lines.push({ id: 'line_1', kind: 'narration', characterId: null, text: nasty });
    const html = buildStandaloneHtml(s, 'console.log("player")');
    // exactly one closing tag per script element: the JSON + the player script
    expect(html.match(/<\/script>/g)!.length).toBe(2);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain(`<title>${escapeHtml(nasty)}</title>`);
    const json = html.split('id="hasipur-story" data-schema="1">')[1].split('</script>')[0];
    const back = JSON.parse(json);
    expect(back.title).toBe(nasty);
    expect(back.scenes[0].lines[0].text).toBe(nasty);
  });

  it('jsonForScript escapes HTML-significant characters', () => {
    const out = jsonForScript({ a: '<>&' + String.fromCharCode(0x2028) });
    expect(/[<>&]/.test(out)).toBe(false);
    expect(out.includes(String.fromCharCode(0x2028))).toBe(false);
    expect(JSON.parse(out).a).toBe('<>&' + String.fromCharCode(0x2028));
  });

  it('escapes a player bundle that contains a closing script tag', () => {
    const html = buildStandaloneHtml(createEmptyStory(), 'var s="</script>";');
    expect(html).toContain('var s="<\\/script>";');
  });
});

describe('local storage', () => {
  it('saves and loads stories, newest first', () => {
    const store = new StoryStore(new MemoryKV());
    const a = { ...createEmptyStory('א'), updatedAt: 1 };
    const b = { ...createEmptyStory('ב'), updatedAt: 2 };
    expect(store.save(a)).toEqual({ ok: true });
    store.save(b);
    expect(store.load(a.id)).toEqual(a);
    expect(store.list().stories.map((s) => s.title)).toEqual(['ב', 'א']);
    store.remove(a.id);
    expect(store.load(a.id)).toBeNull();
  });

  it('survives damaged data and counts it', () => {
    const kv = new MemoryKV();
    kv.setItem('hasipur.story.bad1', '{not json');
    kv.setItem('hasipur.story.bad2', JSON.stringify({ hello: 1 }));
    const store = new StoryStore(kv);
    store.save(createEmptyStory());
    const { stories, damaged } = store.list();
    expect(stories).toHaveLength(1);
    expect(damaged).toBe(2);
    expect(store.removeDamaged()).toBe(2);
    expect(store.list().damaged).toBe(0);
  });

  it('reports a full storage quota instead of throwing', () => {
    const store = new StoryStore(new MemoryKV(500));
    expect(store.save(getSampleStory())).toEqual({ ok: false, reason: 'quota' });
  });

  it('reports unavailable storage', () => {
    const store = new StoryStore(null);
    expect(store.save(createEmptyStory())).toEqual({ ok: false, reason: 'unavailable' });
    expect(store.list()).toEqual({ stories: [], damaged: 0 });
  });
});
