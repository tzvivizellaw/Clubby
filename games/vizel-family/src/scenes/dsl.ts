import type { BgKey } from '../assets/backgrounds';
import type { SfxName } from '../audio/sfx';
import type { Expr } from '../characters/face';
import type { CastId } from '../data/characters';
import type { ActName, StoryStep } from '../minigames/types';

/** Tiny DSL for writing story scripts compactly. */
export const S = {
  bg: (key: BgKey): StoryStep => ({ t: 'bg', key }),
  c: (who: CastId, x: number, from: 'left' | 'right' | 'top' | 'bottom' | 'none' = 'none', o: { y?: number; face?: 1 | -1; expr?: Expr; scale?: number } = {}): StoryStep => ({ t: 'char', who, x, from, ...o }),
  say: (who: CastId, text: string, voice?: string, expr?: Expr): StoryStep => ({ t: 'say', who, text, voice, expr }),
  p: (id: string, tex: string, x: number, y: number, o: { scale?: number; living?: boolean; legs?: boolean; from?: 'pop' | 'top' | 'none'; mood?: any } = {}): StoryStep => ({ t: 'prop', id, tex, x, y, ...o }),
  a: (target: string, a: ActName, o: { to?: [number, number]; wait?: boolean; ms?: number } = {}): StoryStep => ({ t: 'act', target, a, ...o }),
  zoom: (z: number, x?: number, y?: number): StoryStep => ({ t: 'zoom', z, x, y }),
  shake: (): StoryStep => ({ t: 'shake' }),
  confetti: (x?: number, y?: number): StoryStep => ({ t: 'confetti', x, y }),
  wait: (ms: number): StoryStep => ({ t: 'wait', ms }),
  cap: (text: string): StoryStep => ({ t: 'caption', text }),
  black: (): StoryStep => ({ t: 'black' }),
  sfx: (name: SfxName): StoryStep => ({ t: 'sfx', name }),
};
