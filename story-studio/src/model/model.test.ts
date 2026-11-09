import { describe, expect, it } from 'vitest';
import { getSampleStory } from '../content/sampleStory';
import { TEMPLATES, storyFromTemplate } from '../content/templates';
import { createEmptyStory, createScene } from './factory';
import { addScene, deleteScene, duplicateScene, findIncomingLinks, moveScene, removeCharacter, updateScene } from './ops';
import { canPlay, reachableFrom, validateStory } from './validate';
import type { Story } from './types';
import { buildStory } from '../content/builder';

function chain(): Story {
  // a -> (b | c), b end, c end
  return buildStory({
    title: 't', description: '', genre: 'adventure', color: '#7c5cc4',
    cast: [{ key: 'n', kind: 'curious' }],
    scenes: [
      { key: 'a', name: 'א', bg: 'library', lines: [['n', 'שלום']], next: { prompt: '?', options: [['ב', 'b'], ['ג', 'c']] } },
      { key: 'b', name: 'ב', bg: 'library', lines: [], next: { end: 'סוף 1' } },
      { key: 'c', name: 'ג', bg: 'library', lines: [], next: { end: 'סוף 2' } },
    ],
  });
}

describe('link checker', () => {
  it('sample story: every scene reachable, no problems, 3 endings', () => {
    const s = getSampleStory();
    expect(s.scenes.length).toBeGreaterThanOrEqual(8);
    expect(s.scenes.length).toBeLessThanOrEqual(10);
    const issues = validateStory(s);
    expect(issues).toEqual([]);
    expect(reachableFrom(s, s.startSceneId).size).toBe(s.scenes.length);
    expect(s.scenes.filter((x) => x.next.type === 'end')).toHaveLength(3);
    expect(s.scenes.filter((x) => x.next.type === 'choice').length).toBeGreaterThanOrEqual(3);
  });

  it('detects a choice without target', () => {
    const s = chain();
    const a = s.scenes[0];
    const broken = updateScene(s, a.id, (sc) => sc.next.type === 'choice'
      ? { ...sc, next: { ...sc.next, options: [{ ...sc.next.options[0], target: null }, sc.next.options[1]] } } : sc);
    const issues = validateStory(broken);
    const missing = issues.find((i) => i.code === 'missing-target');
    expect(missing?.severity).toBe('problem');
    expect(missing?.message).toContain('עוד אין המשך');
    expect(canPlay(issues)).toBe(true);
  });

  it('detects a target that was deleted', () => {
    const s = chain();
    const a = s.scenes[0];
    const bad = updateScene(s, a.id, (sc) => ({ ...sc, next: { type: 'goto', target: 'scene_gone' } }));
    expect(validateStory(bad).some((i) => i.code === 'broken-target')).toBe(true);
  });

  it('flags unreachable scenes as a tip, not a blocker', () => {
    const s = addScene(chain(), createScene('בודדה'));
    const issue = validateStory(s).find((i) => i.code === 'unreachable');
    expect(issue?.severity).toBe('tip');
    expect(canPlay(validateStory(s))).toBe(true);
  });

  it('detects a story with no reachable ending', () => {
    const s = createEmptyStory();
    const first = s.scenes[0];
    const second = createScene('שנייה');
    let st = addScene(s, second);
    st = updateScene(st, first.id, (sc) => ({ ...sc, next: { type: 'goto', target: second.id } }));
    st = updateScene(st, second.id, (sc) => ({ ...sc, next: { type: 'goto', target: first.id } }));
    const codes = validateStory(st).map((i) => i.code);
    expect(codes).toContain('no-reachable-ending');
  });

  it('detects a loop with no way out, while the rest of the story still ends', () => {
    const s = chain();
    const [a, b] = s.scenes;
    const x = createScene('מעגל 1');
    const y = createScene('מעגל 2');
    let st = addScene(addScene(s, x), y);
    st = updateScene(st, x.id, (sc) => ({ ...sc, next: { type: 'goto', target: y.id } }));
    st = updateScene(st, y.id, (sc) => ({ ...sc, next: { type: 'goto', target: x.id } }));
    st = updateScene(st, a.id, (sc) => sc.next.type === 'choice'
      ? { ...sc, next: { ...sc.next, options: [...sc.next.options.slice(0, 1), { ...sc.next.options[1], target: x.id }] } } : sc);
    void b;
    const loop = validateStory(st).find((i) => i.code === 'trap-cycle');
    expect(loop).toBeDefined();
    expect(loop!.message).toContain('מעגל');
  });

  it('a loop that has an exit is fine (sample riddle loop)', () => {
    expect(validateStory(getSampleStory()).some((i) => i.code === 'trap-cycle')).toBe(false);
  });

  it('all templates have no blockers', () => {
    for (const t of TEMPLATES) {
      const s = storyFromTemplate(t.id)!;
      expect(canPlay(validateStory(s))).toBe(true);
      expect(s.scenes.length).toBeGreaterThan(1);
    }
  });
});

describe('scene operations', () => {
  it('delete clears incoming links (reported, not hidden) and keeps a start scene', () => {
    const s = chain();
    const [a, b] = s.scenes;
    expect(findIncomingLinks(s, b.id)).toHaveLength(1);
    const after = deleteScene(s, b.id);
    expect(after.scenes.find((x) => x.id === b.id)).toBeUndefined();
    expect(validateStory(after).some((i) => i.code === 'missing-target')).toBe(true);
    const deletedStart = deleteScene(s, a.id);
    expect(deletedStart.scenes.some((x) => x.id === deletedStart.startSceneId)).toBe(true);
  });

  it('delete can redirect incoming links to a replacement', () => {
    const s = chain();
    const [, b, c] = s.scenes;
    const after = deleteScene(s, b.id, c.id);
    expect(validateStory(after).some((i) => i.code === 'missing-target')).toBe(false);
    expect(findIncomingLinks(after, c.id)).toHaveLength(2);
  });

  it('duplicate makes a new ID and new inner IDs', () => {
    const s = chain();
    const { story, newSceneId } = duplicateScene(s, s.scenes[0].id);
    const copy = story.scenes.find((x) => x.id === newSceneId)!;
    expect(newSceneId).not.toBe(s.scenes[0].id);
    expect(copy.lines[0].id).not.toBe(s.scenes[0].lines[0].id);
    expect(story.scenes[1].id).toBe(newSceneId);
  });

  it('reordering does not change the flow', () => {
    const s = chain();
    const moved = moveScene(s, s.scenes[2].id, -2);
    expect(moved.scenes[0].id).toBe(s.scenes[2].id);
    expect(moved.startSceneId).toBe(s.startSceneId);
    expect(validateStory(moved)).toEqual(validateStory(s));
  });

  it('renaming a character updates every dialogue (lines reference by id)', () => {
    const s = getSampleStory();
    const fix = s.characters.find((c) => c.name === 'פיקס')!;
    const renamed = { ...s, characters: s.characters.map((c) => (c.id === fix.id ? { ...c, name: 'פיקסי' } : c)) };
    const lines = renamed.scenes.flatMap((sc) => sc.lines).filter((l) => l.characterId === fix.id);
    expect(lines.length).toBeGreaterThan(3);
    expect(renamed.characters.find((c) => c.id === lines[0].characterId)!.name).toBe('פיקסי');
  });

  it('removing a character turns its lines into narration', () => {
    const s = getSampleStory();
    const fix = s.characters.find((c) => c.name === 'פיקס')!;
    const after = removeCharacter(s, fix.id);
    const all = after.scenes.flatMap((sc) => [...sc.lines.map((l) => l.characterId), ...sc.appearances.map((a) => a.characterId)]);
    expect(all).not.toContain(fix.id);
  });
});
