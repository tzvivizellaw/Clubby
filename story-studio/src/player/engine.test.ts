import { describe, expect, it } from 'vitest';
import { getSampleStory } from '../content/sampleStory';
import { advance, back, choose, initialState, isAtChoices, restart, start, type PlayerState } from './engine';
import type { Story } from '../model/types';
import { buildStory } from '../content/builder';

const story: Story = buildStory({
  title: 't', description: '', genre: 'adventure', color: '#7c5cc4',
  cast: [{ key: 'n', kind: 'curious' }],
  scenes: [
    { key: 'a', name: 'א', bg: 'library', lines: [['n', 'שורה 1'], ['n', 'שורה 2']], next: { prompt: '?', options: [['לב', 'b'], ['לג', 'c'], ['לשום מקום', null]] } },
    { key: 'b', name: 'ב', bg: 'library', lines: [['n', 'בב']], next: { goto: 'd' } },
    { key: 'c', name: 'ג', bg: 'library', lines: [['n', 'גג']], next: { end: 'סוף ג' } },
    { key: 'd', name: 'ד', bg: 'library', lines: [], next: { end: 'סוף ד' } },
  ],
});
const [A, B, C, D] = story.scenes;
const opt = (i: number) => (A.next.type === 'choice' ? A.next.options[i].id : '');

function begin(): PlayerState {
  return start(story, initialState(story));
}

describe('player engine', () => {
  it('starts on the cover, then the first line of the start scene', () => {
    const s0 = initialState(story);
    expect(s0.phase).toBe('cover');
    const s1 = start(story, s0);
    expect(s1).toMatchObject({ phase: 'playing', sceneId: A.id, lineIndex: 0 });
  });

  it('shows one line at a time and then the choices', () => {
    let s = begin();
    expect(isAtChoices(story, s)).toBe(false);
    s = advance(story, s);
    expect(s.lineIndex).toBe(1);
    s = advance(story, s);
    expect(isAtChoices(story, s)).toBe(true);
    expect(advance(story, s)).toBe(s); // must choose
  });

  it('follows each branch to its own ending', () => {
    let s = advance(story, advance(story, begin()));
    const toB = choose(story, s, opt(0));
    expect(toB.sceneId).toBe(B.id);
    const toD = advance(story, toB); // goto
    expect(toD.sceneId).toBe(D.id);
    const endD = advance(story, toD);
    expect(endD.phase).toBe('ending');
    expect(endD.endingsFound).toEqual([D.id]);

    s = advance(story, advance(story, begin()));
    const endC = advance(story, choose(story, s, opt(1)));
    expect(endC.phase).toBe('ending');
    expect(endC.sceneId).toBe(C.id);
  });

  it('back returns along the real path that was chosen', () => {
    let s = advance(story, advance(story, begin()));
    s = choose(story, s, opt(1)); // -> C
    s = back(s);
    expect(isAtChoices(story, s)).toBe(true);
    expect(s.sceneId).toBe(A.id);
    s = choose(story, s, opt(0)); // -> B
    s = advance(story, s); // -> D
    s = back(back(s));
    expect(s.sceneId).toBe(A.id);
    s = back(back(s));
    expect(s).toMatchObject({ sceneId: A.id, lineIndex: 0, phase: 'playing' });
  });

  it('a choice without a target goes to a friendly "stuck" state, and back works', () => {
    let s = advance(story, advance(story, begin()));
    s = choose(story, s, opt(2));
    expect(s.phase).toBe('stuck');
    s = back(s);
    expect(isAtChoices(story, s)).toBe(true);
  });

  it('restart keeps the endings found', () => {
    let s = advance(story, advance(story, begin()));
    s = advance(story, choose(story, s, opt(1)));
    const r = restart(story, s);
    expect(r.phase).toBe('cover');
    expect(r.endingsFound).toEqual([C.id]);
  });

  it('every ending of the sample story is reachable by playing', () => {
    const sample = getSampleStory();
    const found = new Set<string>();
    const seen = new Set<string>();
    const walk = (s: PlayerState, depth: number) => {
      if (depth > 60) return;
      const key = `${s.sceneId}:${s.lineIndex}:${s.phase}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (s.phase === 'ending') { found.add(s.sceneId); return; }
      if (s.phase === 'stuck') throw new Error('stuck in sample story');
      if (isAtChoices(sample, s)) {
        const sc = sample.scenes.find((x) => x.id === s.sceneId)!;
        if (sc.next.type === 'choice') for (const o of sc.next.options) walk(choose(sample, s, o.id), depth + 1);
      } else walk(advance(sample, s), depth + 1);
    };
    walk(start(sample, initialState(sample)), 0);
    expect(found.size).toBe(3);
  });
});
