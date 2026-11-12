import type { SfxName } from '../../audio/sfx';

/** Animal sound data shared by Y1 (Yedidya) and E1 (Esti). */
export interface AnimalSound {
  tex: string;
  sfx: SfxName;
  he: string; // what the animal says
  name: string;
}

export const ANIMALS: AnimalSound[] = [
  { tex: 'cow', sfx: 'moo', he: 'מווו', name: 'פרה' },
  { tex: 'cat', sfx: 'meow', he: 'מיאו', name: 'חתול' },
  { tex: 'dog', sfx: 'woof', he: 'הב הב', name: 'כלב' },
  { tex: 'sheep', sfx: 'baa', he: 'מֶההה', name: 'כבשה' },
  { tex: 'duckA', sfx: 'quack', he: 'גע גע', name: 'ברווז' },
  { tex: 'lion', sfx: 'roar', he: 'גררר', name: 'אריה' },
  { tex: 'horse', sfx: 'neigh', he: 'היהההה', name: 'סוס' },
  { tex: 'chick', sfx: 'cluck', he: 'קוקוריקו', name: 'תרנגול' },
  { tex: 'frog', sfx: 'ribbit', he: 'קווה קווה', name: 'צפרדע' },
  { tex: 'bird', sfx: 'tweet', he: 'ציוץ ציוץ', name: 'ציפור' },
  { tex: 'elephant', sfx: 'trumpet', he: 'טרררו', name: 'פיל' },
];
