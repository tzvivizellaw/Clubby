/** Tiny synthesized sounds (no audio files). Only ever played after a user interaction. */

type Cue = 'tap' | 'choice' | 'scene' | 'ending' | 'add';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, vol = 0.06) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

export function playCue(cue: Cue, enabled: boolean): void {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  switch (cue) {
    case 'tap':
      tone(c, 660, 0, 0.08, 0.035);
      break;
    case 'add':
      tone(c, 523, 0, 0.1);
      tone(c, 784, 0.07, 0.12);
      break;
    case 'choice':
      tone(c, 587, 0, 0.1);
      tone(c, 880, 0.08, 0.14);
      break;
    case 'scene':
      tone(c, 440, 0, 0.18, 0.04);
      tone(c, 660, 0.1, 0.2, 0.04);
      break;
    case 'ending':
      [523, 659, 784, 1046].forEach((f, i) => tone(c, f, i * 0.12, 0.3, 0.05));
      break;
  }
}
