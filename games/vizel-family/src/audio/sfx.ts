import { midi, noise, tone } from './synth';

/** Original synthesized sound effects. */
export const SFX = {
  click: () => tone(880, 0.06, { type: 'square', vol: 0.08 }),
  pop: () => {
    tone(600, 0.08, { type: 'sine', slide: 1400, vol: 0.25 });
    noise(0.05, { freq: 3000, vol: 0.15 });
  },
  boing: () => tone(180, 0.35, { type: 'triangle', slide: 520, vibrato: 30, vol: 0.25 }),
  whoosh: () => noise(0.35, { freq: 400, slide: 2500, q: 0.8, vol: 0.2 }),
  ding: () => {
    tone(midi(84), 0.25, { type: 'triangle', vol: 0.2 });
    tone(midi(91), 0.35, { type: 'triangle', vol: 0.18, delay: 0.08 });
  },
  good: () => {
    tone(midi(76), 0.1, { type: 'square', vol: 0.1 });
    tone(midi(81), 0.15, { type: 'square', vol: 0.1, delay: 0.07 });
  },
  wrong: () => {
    tone(220, 0.18, { type: 'sawtooth', vol: 0.12, slide: 150 });
    tone(160, 0.25, { type: 'sawtooth', vol: 0.12, slide: 110, delay: 0.14 });
  },
  splash: () => noise(0.5, { freq: 900, slide: 300, q: 0.5, vol: 0.3 }),
  drip: () => tone(1200, 0.08, { type: 'sine', slide: 500, vol: 0.18 }),
  crash: () => {
    noise(0.6, { freq: 500, q: 0.3, vol: 0.4, type: 'lowpass', slide: 100 });
    tone(90, 0.4, { type: 'square', vol: 0.15, slide: 40 });
  },
  confetti: () => {
    for (let i = 0; i < 6; i++) tone(midi(72 + Math.floor(Math.random() * 24)), 0.07, { type: 'square', vol: 0.06, delay: i * 0.04 });
    noise(0.3, { freq: 5000, vol: 0.1 });
  },
  jump: () => tone(300, 0.2, { type: 'square', slide: 800, vol: 0.12 }),
  land: () => noise(0.12, { freq: 200, vol: 0.3, type: 'lowpass' }),
  sneeze: () => {
    tone(500, 0.3, { type: 'sawtooth', slide: 900, vol: 0.06 });
    noise(0.35, { freq: 3000, q: 0.6, vol: 0.4, delay: 0.32 });
  },
  laugh: () => {
    for (let i = 0; i < 5; i++) tone(520 - i * 30, 0.09, { type: 'triangle', vol: 0.14, delay: i * 0.11, vibrato: 15 });
  },
  heartLost: () => {
    tone(midi(64), 0.15, { type: 'square', vol: 0.12 });
    tone(midi(60), 0.15, { type: 'square', vol: 0.12, delay: 0.15 });
    tone(midi(55), 0.4, { type: 'square', vol: 0.12, delay: 0.3, slide: midi(50) });
  },
  win: () => {
    [72, 76, 79, 84].forEach((n, i) => tone(midi(n), 0.18, { type: 'square', vol: 0.11, delay: i * 0.1 }));
    tone(midi(88), 0.5, { type: 'triangle', vol: 0.15, delay: 0.42 });
  },
  lose: () => {
    [67, 66, 65].forEach((n, i) => tone(midi(n), 0.28, { type: 'sawtooth', vol: 0.09, delay: i * 0.3 }));
    tone(midi(64), 0.9, { type: 'sawtooth', vol: 0.09, delay: 0.9, vibrato: 8 });
  },
  drumroll: () => {
    for (let i = 0; i < 14; i++) noise(0.05, { freq: 1800, vol: 0.12, delay: i * 0.05 });
  },
  coin: () => {
    tone(midi(83), 0.07, { type: 'square', vol: 0.1 });
    tone(midi(88), 0.2, { type: 'square', vol: 0.1, delay: 0.07 });
  },
  honk: () => {
    tone(330, 0.25, { type: 'square', vol: 0.12 });
    tone(415, 0.25, { type: 'square', vol: 0.1 });
  },
  ring: () => {
    for (let i = 0; i < 6; i++) tone(i % 2 ? 1300 : 1600, 0.06, { type: 'square', vol: 0.07, delay: i * 0.07 });
  },
  shoot: () => tone(700, 0.12, { type: 'triangle', slide: 250, vol: 0.18 }),
  hit: () => {
    noise(0.1, { freq: 800, vol: 0.3 });
    tone(150, 0.12, { type: 'square', vol: 0.12, slide: 80 });
  },
  stretch: () => tone(200, 0.4, { type: 'sawtooth', slide: 600, vol: 0.06 }),
  tick: () => tone(1800, 0.03, { type: 'square', vol: 0.05 }),
  zap: () => tone(1500, 0.2, { type: 'sawtooth', slide: 100, vol: 0.1 }),
  snore: () => noise(0.8, { freq: 150, slide: 400, q: 2, vol: 0.25 }),
  printer: () => {
    for (let i = 0; i < 4; i++) noise(0.08, { freq: 2200, q: 3, vol: 0.12, delay: i * 0.09 });
  },
  // Animal voices (stylised synth approximations)
  moo: () => tone(130, 1.0, { type: 'sawtooth', slide: 95, vibrato: 4, vol: 0.18, attack: 0.15 }),
  meow: () => {
    tone(700, 0.25, { type: 'triangle', slide: 1100, vol: 0.16 });
    tone(1100, 0.35, { type: 'triangle', slide: 600, vol: 0.16, delay: 0.24 });
  },
  woof: () => {
    tone(300, 0.12, { type: 'sawtooth', slide: 180, vol: 0.2 });
    noise(0.1, { freq: 600, vol: 0.2 });
    tone(320, 0.12, { type: 'sawtooth', slide: 190, vol: 0.2, delay: 0.25 });
    noise(0.1, { freq: 600, vol: 0.2, delay: 0.25 });
  },
  baa: () => tone(420, 0.8, { type: 'sawtooth', vibrato: 40, vol: 0.12 }),
  quack: () => {
    tone(500, 0.12, { type: 'square', slide: 380, vol: 0.12 });
    tone(500, 0.12, { type: 'square', slide: 380, vol: 0.12, delay: 0.18 });
  },
  roar: () => {
    noise(0.9, { freq: 250, q: 1.5, vol: 0.45, slide: 120 });
    tone(110, 0.9, { type: 'sawtooth', vol: 0.12, slide: 70, vibrato: 10 });
  },
  tweet: () => {
    for (let i = 0; i < 3; i++) tone(2600, 0.08, { type: 'sine', slide: 3600, vol: 0.12, delay: i * 0.12 });
  },
  ribbit: () => {
    tone(180, 0.1, { type: 'square', slide: 140, vol: 0.15 });
    tone(220, 0.15, { type: 'square', slide: 160, vol: 0.15, delay: 0.14 });
  },
  neigh: () => tone(900, 0.9, { type: 'sawtooth', slide: 500, vibrato: 60, vol: 0.1 }),
  trumpet: () => tone(330, 0.8, { type: 'sawtooth', slide: 520, vibrato: 12, vol: 0.14, attack: 0.05 }),
  cluck: () => {
    for (let i = 0; i < 4; i++) tone(700, 0.06, { type: 'square', slide: 500, vol: 0.1, delay: i * 0.12 });
  },
  buzz: () => tone(220, 0.7, { type: 'sawtooth', vibrato: 30, vol: 0.06 }),
  note: (n: number) => tone(midi(n), 0.35, { type: 'triangle', vol: 0.2 }),
};

export type SfxName = Exclude<keyof typeof SFX, 'note'>;
