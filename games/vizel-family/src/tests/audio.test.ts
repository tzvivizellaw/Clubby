import { describe, expect, it, vi } from 'vitest';
import { Audio } from '../audio/AudioManager';
import { pickFile, getVoice } from '../audio/VoiceRegistry';
import { defaultSettings } from '../progression/save';

describe('audio fallbacks', () => {
  it('never throws when no AudioContext / recordings exist, and still shows subtitles', async () => {
    const subs: string[] = [];
    Audio.setSubtitleSink((_s, t) => subs.push(t));
    Audio.apply(defaultSettings());
    globalThis.fetch = vi.fn(async () => ({ ok: false, json: async () => ({}) })) as any;
    await Audio.loadManifest('/none.json');
    expect(() => Audio.say('father.where_are_keys')).not.toThrow();
    expect(() => Audio.say('esti', 'עוד פעם!')).not.toThrow();
    expect(() => Audio.sfx('moo')).not.toThrow();
    expect(() => Audio.music('play')).not.toThrow();
    expect(subs).toContain('נו, מי ראה את המפתחות שלי?!');
    const ms = Audio.say('daniel.three_pointer');
    expect(ms).toBeGreaterThan(500);
  });

  it('picks only recordings that exist, rotating variants', () => {
    const line = getVoice('esti.again')!;
    expect(pickFile(line, new Set())).toBeNull();
    const avail = new Set([line.files[0], line.files[1]]);
    const a = pickFile(line, avail), b = pickFile(line, avail);
    expect(a).not.toBe(b);
    expect([a, b].sort()).toEqual([line.files[0], line.files[1]].sort());
  });

  it('respects subtitles off', () => {
    const subs: string[] = [];
    Audio.setSubtitleSink((_s, t) => subs.push(t));
    Audio.apply({ ...defaultSettings(), subtitles: false });
    Audio.say('mother.well_done');
    expect(subs.length).toBe(0);
  });
});
