/** Tiny Web Audio helpers. Everything is generated at runtime — no copyrighted samples. */

let ctx: AudioContext | null = null;
export const buses: { master?: GainNode; music?: GainNode; sfx?: GainNode; voice?: GainNode } = {};

export function audioCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC: typeof AudioContext | undefined =
    typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : undefined;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  buses.master = ctx.createGain();
  buses.master.connect(ctx.destination);
  for (const k of ['music', 'sfx', 'voice'] as const) {
    const g = ctx.createGain();
    g.connect(buses.master);
    buses[k] = g;
  }
  return ctx;
}

export function unlockAudio() {
  const c = audioCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

let noiseBuf: AudioBuffer | null = null;
function noiseBuffer(c: AudioContext) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

export interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  slide?: number; // target freq
  delay?: number;
  attack?: number;
  vibrato?: number; // Hz depth
  bus?: 'sfx' | 'music' | 'voice';
  at?: number; // absolute time
}

export function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const c = audioCtx();
  if (!c) return;
  const bus = buses[o.bus ?? 'sfx']!;
  const t0 = o.at ?? c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
  if (o.vibrato) {
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = 7;
    lg.gain.value = o.vibrato;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  const v = o.vol ?? 0.2;
  const a = o.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function noise(dur: number, o: { freq?: number; q?: number; vol?: number; delay?: number; type?: BiquadFilterType; slide?: number; bus?: 'sfx' | 'music'; at?: number } = {}) {
  const c = audioCtx();
  if (!c) return;
  const t0 = o.at ?? c.currentTime + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq ?? 1200, t0);
  if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.25, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(buses[o.bus ?? 'sfx']!);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
