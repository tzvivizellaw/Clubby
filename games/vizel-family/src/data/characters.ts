export type PlayerId = 'avigail' | 'daniel' | 'yedidya' | 'esti';
export type CastId = PlayerId | 'father' | 'mother';
export type SeriesId = PlayerId | 'family';

export interface CharacterInfo {
  id: CastId;
  name: string;
  age?: number;
  role: string;
  blurb: string;
  color: string; // UI accent
  voicePitch: number; // babble fallback pitch (Hz)
  tier?: 'toddler' | 'easy' | 'medium' | 'hard';
}

export const CHARACTERS: Record<CastId, CharacterInfo> = {
  avigail: {
    id: 'avigail', name: 'אביגיל', age: 10, role: 'המפקדת של הבית',
    blurb: 'חכמה, אחראית וזריזה. בטוחה שרק היא יכולה להציל את המשפחה.',
    color: '#ff7b54', voicePitch: 330, tier: 'hard',
  },
  daniel: {
    id: 'daniel', name: 'דניאל', age: 9, role: 'הספורטאי והממציא',
    blurb: 'תחרותי, אנרגטי, אוהב כדורסל — ומשוכנע שהוא גאון.',
    color: '#f39c12', voicePitch: 260, tier: 'medium',
  },
  yedidya: {
    id: 'yedidya', name: 'ידידיה', age: 5, role: 'גיבור העל המבולבל',
    blurb: 'סקרן, שואל המון שאלות ובטוח שהוא יכול להציל את העולם.',
    color: '#3f7fe8', voicePitch: 380, tier: 'easy',
  },
  esti: {
    id: 'esti', name: 'אסתי', age: 3, role: 'מלכת החיות והשטויות',
    blurb: 'שובבה, אוהבת חיות ושוקו, ומתלהבת מכל דבר.',
    color: '#f7b731', voicePitch: 470, tier: 'toddler',
  },
  father: {
    id: 'father', name: 'אבא', role: 'עורך דין, תובע צבאי במילואים',
    blurb: 'מחפש מפתחות, טלפון, וחמש דקות של שקט.',
    color: '#2f5fa7', voicePitch: 140,
  },
  mother: {
    id: 'mother', name: 'אמא', role: 'מחזיקה את הבית שפוי',
    blurb: 'מנהלת את הבלגן — ולפעמים גורמת לטוויסט הכי מטורף.',
    color: '#8e3b8f', voicePitch: 230,
  },
};

export const PLAYERS: PlayerId[] = ['avigail', 'daniel', 'yedidya', 'esti'];
export const SERIES: SeriesId[] = ['family', 'avigail', 'daniel', 'yedidya', 'esti'];

export const SERIES_TITLE: Record<SeriesId, string> = {
  family: 'הסדרה המשפחתית',
  avigail: 'הסדרה של אביגיל',
  daniel: 'הסדרה של דניאל',
  yedidya: 'הסדרה של ידידיה',
  esti: 'הסדרה של אסתי',
};
