import { audioCtx, midi, noise, tone } from './synth';

/** Original procedural background tunes (composed for this game). One step = an 8th note. */
export interface Theme {
  bpm: number;
  lead: (number | null)[];
  bass: (number | null)[];
  drums: string; // k=kick s=snare h=hat .=rest
  leadType?: OscillatorType;
  leadVol?: number;
}

const _ = null;

export const THEMES: Record<string, Theme> = {
  menu: {
    bpm: 132,
    lead: [72, _, 76, 79, 81, 79, 76, _, 74, _, 77, 81, 79, _, 74, _, 72, _, 76, 79, 84, 83, 81, 79, 77, 76, 74, 76, 72, _, _, _],
    bass: [48, _, 48, _, 53, _, 53, _, 50, _, 50, _, 55, _, 55, _, 48, _, 48, _, 53, _, 53, _, 55, _, 55, _, 48, _, 43, _],
    drums: 'k.h.s.h.k.k.s.h.',
  },
  play: {
    bpm: 150,
    lead: [79, 79, _, 76, 77, 79, _, 72, 74, 76, 77, _, 76, 74, 72, _, 79, 79, _, 81, 83, 84, _, 79, 77, 76, 74, 72, 74, _, _, _],
    bass: [48, _, 55, _, 48, _, 55, _, 53, _, 60, _, 53, _, 60, _, 48, _, 55, _, 52, _, 55, _, 50, _, 55, _, 43, _, 47, _],
    drums: 'k.hsk.hsk.hsk.ss',
  },
  boss: {
    bpm: 160,
    lead: [69, 72, 76, 72, 69, 72, 76, 77, 76, 72, 69, _, 68, 71, 74, 71, 69, 72, 76, 72, 81, 79, 77, 76, 74, 76, 77, 76, 71, _, 68, _],
    bass: [45, 45, _, 45, 45, _, 45, 47, 48, 48, _, 48, 44, 44, _, 44, 45, 45, _, 45, 45, _, 45, 47, 50, 50, _, 50, 40, _, 44, _],
    drums: 'kkhskkhskkhskshs',
    leadType: 'sawtooth',
    leadVol: 0.05,
  },
  toddler: {
    bpm: 100,
    lead: [72, _, 74, _, 76, _, 72, _, 79, _, _, _, 77, 76, 74, _, 72, _, 74, _, 76, _, 77, _, 76, _, 74, _, 72, _, _, _],
    bass: [48, _, _, _, 55, _, _, _, 53, _, _, _, 55, _, _, _, 48, _, _, _, 55, _, _, _, 53, _, 55, _, 48, _, _, _],
    drums: 'k...h...k...h...',
    leadType: 'triangle',
    leadVol: 0.1,
  },
  fridge: {
    bpm: 120,
    lead: [76, 76, 76, _, 72, _, 79, _, 77, 76, 74, _, 72, _, _, _, 74, 74, 74, _, 71, _, 77, _, 76, 74, 72, _, 72, _, _, _],
    bass: [48, _, 52, _, 55, _, 52, _, 53, _, 57, _, 55, _, 52, _, 50, _, 53, _, 55, _, 53, _, 48, _, 52, _, 48, _, _, _],
    drums: 'k.s.k.s.k.s.kks.',
    leadType: 'triangle',
    leadVol: 0.12,
  },
  party: {
    bpm: 140,
    lead: [72, 76, 79, 76, 72, 76, 79, 84, 81, 77, 74, 77, 81, 77, 74, 71, 72, 76, 79, 76, 84, 83, 81, 79, 77, 79, 81, 79, 76, _, 72, _],
    bass: [48, _, 48, 55, 48, _, 48, 55, 53, _, 53, 50, 53, _, 55, _, 48, _, 48, 55, 45, _, 45, 52, 53, _, 55, _, 48, _, 48, _],
    drums: 'k.hsk.hskkhsk.hs',
  },
  sleepy: {
    bpm: 84,
    lead: [76, _, _, 79, 76, _, 72, _, 74, _, _, 77, 74, _, 71, _, 72, _, _, 76, 79, _, 77, 76, 74, _, _, _, 72, _, _, _],
    bass: [48, _, _, _, 52, _, _, _, 50, _, _, _, 55, _, _, _, 48, _, _, _, 53, _, _, _, 55, _, _, _, 48, _, _, _],
    drums: '................',
    leadType: 'sine',
    leadVol: 0.12,
  },
};

class MusicPlayer {
  current: string | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;

  play(name: string) {
    if (this.current === name) return;
    this.stop();
    const c = audioCtx();
    const theme = THEMES[name];
    if (!c || !theme) return;
    this.current = name;
    this.step = 0;
    this.nextTime = c.currentTime + 0.08;
    const stepDur = 60 / theme.bpm / 2;
    const tick = () => {
      while (this.nextTime < c.currentTime + 0.15) {
        this.schedule(theme, this.step, this.nextTime, stepDur);
        this.step++;
        this.nextTime += stepDur;
      }
    };
    tick();
    this.timer = window.setInterval(tick, 40);
  }

  private schedule(t: Theme, step: number, at: number, d: number) {
    const L = t.lead[step % t.lead.length];
    if (L != null) tone(midi(L), d * 0.95, { type: t.leadType ?? 'square', vol: t.leadVol ?? 0.06, bus: 'music', at });
    const B = t.bass[step % t.bass.length];
    if (B != null) tone(midi(B), d * 1.6, { type: 'triangle', vol: 0.14, bus: 'music', at });
    const D = t.drums[(step * 2) % t.drums.length];
    const D2 = t.drums[(step * 2 + 1) % t.drums.length];
    const hit = (ch: string, when: number) => {
      if (ch === 'k') tone(110, 0.12, { type: 'sine', slide: 40, vol: 0.3, bus: 'music', at: when });
      if (ch === 's') noise(0.1, { freq: 1500, vol: 0.12, bus: 'music', at: when });
      if (ch === 'h') noise(0.03, { freq: 7000, vol: 0.05, type: 'highpass', bus: 'music', at: when });
    };
    hit(D, at);
    hit(D2, at + d / 2);
  }

  stop() {
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = null;
    this.current = null;
  }
}

export const music = new MusicPlayer();
