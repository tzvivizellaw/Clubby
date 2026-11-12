import type { BgKey } from '../assets/backgrounds';
import type { SfxName } from '../audio/sfx';
import type { CastId, SeriesId } from '../data/characters';
import type { Expr } from '../characters/face';

export type ActName =
  | 'run' | 'jump' | 'shake' | 'spin' | 'dance' | 'fall' | 'shock' | 'celebrate' | 'cry' | 'laugh'
  | 'fly' | 'land' | 'grow' | 'shrink' | 'explode' | 'legs' | 'tongue' | 'peek' | 'squash' | 'stretch' | 'sleep' | 'wake'
  | 'wave' | 'hips' | 'rollEyes' | 'exit' | 'moveTo' | 'hide' | 'show' | 'bounce' | 'angry' | 'throw' | 'flip';

export type StoryStep =
  | { t: 'bg'; key: BgKey }
  | { t: 'char'; who: CastId; x: number; y?: number; from?: 'left' | 'right' | 'top' | 'bottom' | 'none'; face?: 1 | -1; expr?: Expr; scale?: number }
  | { t: 'say'; who: CastId; text: string; voice?: string; expr?: Expr; ms?: number }
  | { t: 'prop'; id: string; tex: string; x: number; y: number; scale?: number; living?: boolean; legs?: boolean; from?: 'pop' | 'top' | 'none'; mood?: 'happy' | 'angry' | 'shock' | 'sleep' | 'tongue' | 'smug' }
  | { t: 'act'; target: string; a: ActName; to?: [number, number]; wait?: boolean; ms?: number }
  | { t: 'zoom'; z: number; x?: number; y?: number }
  | { t: 'shake' }
  | { t: 'confetti'; x?: number; y?: number }
  | { t: 'wait'; ms: number }
  | { t: 'caption'; text: string }
  | { t: 'black' }
  | { t: 'sfx'; name: SfxName };

export interface MiniGameMeta {
  id: string;
  series: SeriesId;
  index: number;
  title: string;
  icon: string; // object texture key
  bg: BgKey;
  music?: string;
  /** full instruction (ages 9-10) */
  instructions: string;
  /** short instruction for young kids / voice */
  short: string;
  duration: string;
  mechanic: string;
  winCondition: string;
  loseCondition: string;
  winAnimation: string;
  loseAnimation: string;
  intro: StoryStep[];
  win: StoryStep[];
  lose: StoryStep[];
  voiceEvents: string[];
  item: string; // collectible awarded on first win
}

export interface MiniGameDef extends MiniGameMeta {
  nextStage: string | null;
  load: () => Promise<{ default: new (...args: any[]) => Phaser.Scene }>;
}
