import type { CastId } from '../data/characters';

/**
 * Central map: voice event id -> speaker, subtitle text, and candidate recording files.
 * Recordings live in public/audio/voices/<speaker>/<file>.mp3 and are only used once
 * they are listed in public/audio/voices/manifest.json (run `npm run voices:scan`).
 * Adding a recording never requires touching mini-game code.
 */
export interface VoiceLine {
  id: string;
  speaker: CastId;
  text: string;
  files: string[]; // relative to /audio/voices/
}

const REG: Record<string, VoiceLine> = {};

function v(speaker: CastId, slug: string, text: string, variants = 3) {
  const id = `${speaker}.${slug}`;
  const files: string[] = [];
  for (let i = 1; i <= variants; i++) files.push(`${speaker}/${speaker}_${slug}_${String(i).padStart(2, '0')}.mp3`);
  REG[id] = { id, speaker, text, files };
}

// אבא
v('father', 'where_are_keys', 'נו, מי ראה את המפתחות שלי?!');
v('father', 'late_for_reserves', 'אני מאחר למילואים!');
v('father', 'who_touched_computer', 'מי נגע לי במחשב?!');
v('father', 'not_what_i_meant', 'רגע, רגע, זה לא מה שהתכוונתי!');
v('father', 'champion', 'איזה אלוף!');
v('father', 'what_is_going_on', 'מה הולך פה?!');
v('father', 'five_minutes_quiet', 'אני רק רציתי חמש דקות שקט!');
v('father', 'where_is_phone', 'יופי. עכשיו איפה הטלפון שלי?');
// אמא
v('mother', 'five_minutes_shabbat', 'ילדים, עוד חמש דקות שבת!');
v('mother', 'who_left_toys', 'מי השאיר את כל הצעצועים בסלון?!');
v('mother', 'count_to_three', 'אני סופרת עד שלוש!');
v('mother', 'well_done', 'כל הכבוד, אלופים שלי!');
v('mother', 'who_wants_shoko', 'מי רוצה שוקו?');
v('mother', 'what_did_you_do_kitchen', 'מה עשיתם למטבח?!');
// אביגיל
v('avigail', 'i_will_fix_it', 'תנו לי, אני כבר אסדר את זה!');
v('avigail', 'told_you', 'אמרתי לכם שזה מה שיקרה!');
v('avigail', 'oh_no_again', 'אוי לא, שוב?!');
v('avigail', 'yes_did_it', 'יש! הצלחתי!');
// דניאל
v('daniel', 'three_pointer', 'שלשההה!');
v('daniel', 'best_at_this', 'אני הכי טוב במשחק הזה!');
v('daniel', 'not_fair', 'זה בכלל לא פייר!');
v('daniel', 'genius_idea', 'רגע, יש לי רעיון גאוני!');
// ידידיה
v('yedidya', 'i_am_superhero', 'אני גיבור על!');
v('yedidya', 'but_why', 'אבל אבא, למה?');
v('yedidya', 'i_won', 'אני ניצחתי!');
v('yedidya', 'one_more_story', 'עוד סיפור אחד ודי!');
// אסתי
v('esti', 'moo', 'מוווו!');
v('esti', 'again', 'עוד פעם!');
v('esti', 'where_is_teddy', 'איפה הדובי שלי?');
v('esti', 'abba', 'אבאאא!');
v('esti', 'want_shoko', 'אני רוצה שוקו!');

export const VOICE_REGISTRY: Readonly<Record<string, VoiceLine>> = REG;

/** reaction lines used on generic win/lose for each player */
export const REACTIONS: Record<string, { win: string[]; lose: string[] }> = {
  avigail: { win: ['avigail.yes_did_it', 'avigail.i_will_fix_it'], lose: ['avigail.oh_no_again', 'avigail.told_you'] },
  daniel: { win: ['daniel.best_at_this', 'daniel.three_pointer'], lose: ['daniel.not_fair'] },
  yedidya: { win: ['yedidya.i_won', 'yedidya.i_am_superhero'], lose: ['yedidya.but_why'] },
  esti: { win: ['esti.again', 'esti.moo'], lose: ['esti.abba'] },
};

export function getVoice(id: string): VoiceLine | undefined {
  return REG[id];
}

/** pick an available file for a line (round-robin to avoid repetition) */
const rr: Record<string, number> = {};
export function pickFile(line: VoiceLine, available: Set<string>): string | null {
  const have = line.files.filter((f) => available.has(f));
  if (!have.length) return null;
  const i = (rr[line.id] = ((rr[line.id] ?? -1) + 1) % have.length);
  return have[i];
}
