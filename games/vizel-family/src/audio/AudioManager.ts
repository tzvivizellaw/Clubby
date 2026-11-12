import { CHARACTERS, type CastId } from '../data/characters';
import type { Settings } from '../progression/save';
import { music } from './music';
import { SFX, type SfxName } from './sfx';
import { audioCtx, buses, tone, unlockAudio } from './synth';
import { getVoice, pickFile } from './VoiceRegistry';

type SubtitleSink = (speaker: CastId | 'narrator', text: string, ms: number) => void;

class AudioManagerImpl {
  private settings: Settings | null = null;
  private available = new Set<string>();
  private buffers = new Map<string, AudioBuffer | null>();
  private manifestLoaded = false;
  private subtitleSink: SubtitleSink = () => {};
  private currentVoice: AudioBufferSourceNode | null = null;
  /** for tests / debugging */
  readonly log: string[] = [];

  setSubtitleSink(fn: SubtitleSink) {
    this.subtitleSink = fn;
  }

  async loadManifest(url = './audio/voices/manifest.json') {
    if (this.manifestLoaded) return;
    this.manifestLoaded = true;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return;
      const j = await res.json();
      for (const f of j.files ?? []) this.available.add(String(f));
    } catch {
      /* no manifest: everything uses fallbacks */
    }
  }

  apply(s: Settings) {
    this.settings = s;
    const c = audioCtx();
    if (!c) return;
    const m = s.muted ? 0 : 1;
    buses.master!.gain.value = m;
    buses.music!.gain.value = s.music;
    buses.sfx!.gain.value = s.sfx;
    buses.voice!.gain.value = s.voice;
  }

  unlock() {
    unlockAudio();
    if (this.settings) this.apply(this.settings);
  }

  sfx(name: SfxName) {
    try {
      SFX[name]();
    } catch {
      /* audio unavailable */
    }
  }

  note(n: number) {
    try {
      SFX.note(n);
    } catch {
      /* ignore */
    }
  }

  private lastTheme: string | null = null;
  private pausedTheme: string | null = null;

  pauseMusic() {
    this.pausedTheme = this.lastTheme;
    this.music(null);
  }

  resumeMusic() {
    if (this.pausedTheme) this.music(this.pausedTheme);
    this.pausedTheme = null;
  }

  music(theme: string | null) {
    this.lastTheme = theme;
    try {
      if (!theme) music.stop();
      else music.play(theme);
    } catch {
      /* ignore */
    }
  }

  private async buffer(file: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(file)) return this.buffers.get(file)!;
    const c = audioCtx();
    if (!c) return null;
    try {
      const res = await fetch(`./audio/voices/${file}`);
      if (!res.ok) throw new Error('missing');
      const buf = await c.decodeAudioData(await res.arrayBuffer());
      this.buffers.set(file, buf);
      return buf;
    } catch {
      this.buffers.set(file, null);
      this.available.delete(file);
      return null;
    }
  }

  /**
   * Speak a line: a registered voice id (e.g. "father.where_are_keys") or free text with a speaker.
   * Order: real recording -> TTS (if chosen) -> babble synth. Subtitles shown when enabled.
   * Returns the approximate duration in ms. Never throws.
   */
  say(idOrSpeaker: string, text?: string, opts: { subtitle?: boolean; instruction?: boolean } = {}): number {
    const line = getVoice(idOrSpeaker);
    const speaker = (line?.speaker ?? idOrSpeaker) as CastId | 'narrator';
    const body = text ?? line?.text ?? '';
    const ms = Math.min(3400, Math.max(1100, body.length * 58));
    this.log.push(`${speaker}:${body}`);
    const s = this.settings;
    if (opts.subtitle !== false && (s?.subtitles ?? true) && body) this.subtitleSink(speaker, body, ms + 300);
    if (s?.muted) return ms;
    const file = line ? pickFile(line, this.available) : null;
    if (file) {
      this.buffer(file).then((buf) => {
        if (buf) this.playBuffer(buf);
        else this.fallback(speaker, body, opts.instruction);
      });
      return Math.max(ms, 1000);
    }
    this.fallback(speaker, body, opts.instruction);
    return ms;
  }

  private playBuffer(buf: AudioBuffer) {
    const c = audioCtx();
    if (!c) return;
    try {
      this.currentVoice?.stop();
    } catch {
      /* ignore */
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(buses.voice!);
    src.start();
    this.currentVoice = src;
  }

  private fallback(speaker: CastId | 'narrator', text: string, instruction?: boolean) {
    const mode = this.settings?.voiceFallback ?? 'babble';
    if (mode === 'silent') return;
    if ((mode === 'tts' || instruction) && this.tts(speaker, text)) return;
    this.babble(speaker, text);
  }

  private tts(speaker: CastId | 'narrator', text: string): boolean {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return false;
      const voices = synth.getVoices();
      const he = voices.find((v) => v.lang?.toLowerCase().startsWith('he') || v.lang?.toLowerCase().startsWith('iw'));
      if (!he) return false;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = he;
      u.lang = he.lang;
      const kid = speaker === 'esti' || speaker === 'yedidya';
      u.pitch = speaker === 'father' ? 0.8 : kid ? 1.6 : 1.2;
      u.rate = 1.05;
      u.volume = this.settings?.voice ?? 1;
      synth.speak(u);
      return true;
    } catch {
      return false;
    }
  }

  /** Cartoon gibberish voice: syllables at the character's pitch (placeholder until recordings exist). */
  private babble(speaker: CastId | 'narrator', text: string) {
    const c = audioCtx();
    if (!c) return;
    const pitch = speaker === 'narrator' ? 300 : CHARACTERS[speaker]?.voicePitch ?? 300;
    const syll = Math.min(9, Math.max(2, Math.round(text.replace(/\s/g, '').length / 3)));
    const excited = /[!?]/.test(text);
    for (let i = 0; i < syll; i++) {
      const f = pitch * (0.85 + Math.random() * 0.35) * (excited && i === syll - 1 ? 1.3 : 1);
      tone(f, 0.11, { type: 'triangle', vol: 0.12, delay: i * 0.12, slide: f * (Math.random() > 0.5 ? 1.15 : 0.9), bus: 'voice' });
    }
  }
}

export const Audio = new AudioManagerImpl();
