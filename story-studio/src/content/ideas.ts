/** Local idea generator — no network, no AI. Each part carries hints for starting a story. */

export interface Hero {
  text: string;
  kind: string;
}
export interface Place {
  text: string;
  bg: string;
}
export interface IdeaEvent {
  verb: string;
  obj: string;
  prop?: string;
}

export const HEROES: Hero[] = [
  { text: 'ילדה שמבינה את שפת החיות', kind: 'curious' },
  { text: 'ממציאה צעירה עם תיק מלא ברגים', kind: 'inventor' },
  { text: 'שחקנית כדורגל שלא מוותרת אף פעם', kind: 'sporty' },
  { text: 'ציירת שהציורים שלה מתעוררים לחיים', kind: 'artist' },
  { text: 'ילד שזוכר כל ספר שקרא', kind: 'bookworm' },
  { text: 'ספרנית שיודעת לשמור סודות', kind: 'librarian' },
  { text: 'רובוט קטן שמנסה להבין בדיחות', kind: 'robot' },
  { text: 'חתול שובב שחולם להיות בלש', kind: 'cat' },
  { text: 'יצור קסום שמפחד מהחושך', kind: 'creature' },
  { text: 'ילדה שיכולה לשמוע מה הכוכבים לוחשים', kind: 'curious' },
  { text: 'תלמידה חדשה שאף אחד עוד לא מכיר', kind: 'artist' },
  { text: 'אלופת חידות שפותרת הכול — חוץ מחידה אחת', kind: 'inventor' },
  { text: 'רצה מהירה שתמיד מגיעה רגע לפני כולם', kind: 'sporty' },
];

export const PLACES: Place[] = [
  { text: 'בספרייה', bg: 'library' },
  { text: 'בחדר שלה', bg: 'bedroom' },
  { text: 'בכיתה הריקה אחרי הצלצול', bg: 'classroom' },
  { text: 'בחצר בית הספר', bg: 'schoolyard' },
  { text: 'ביער קסום', bg: 'forest' },
  { text: 'בבית העץ הסודי', bg: 'treehouse' },
  { text: 'על חוף הים', bg: 'beach' },
  { text: 'בחללית קטנה', bg: 'spaceship' },
  { text: 'בטירה שמרחפת בעננים', bg: 'castle' },
  { text: 'בבית הקפה של השכונה', bg: 'cafe' },
  { text: 'מתחת לשולחן בכיתה', bg: 'classroom' },
  { text: 'על החול, ליד מגדל המציל', bg: 'beach' },
  { text: 'בפינה הכי שקטה של היער', bg: 'forest' },
];

export const EVENTS: IdeaEvent[] = [
  { verb: 'מוצאת', obj: 'מפה שמשתנה בכל לילה', prop: 'map' },
  { verb: 'מוצאת', obj: 'מפתח זהב בלי דלת', prop: 'key' },
  { verb: 'פוגשת', obj: 'כוכב קטן שנפל מהשמיים', prop: 'star' },
  { verb: 'מקבלת', obj: 'מכתב ממישהו שעוד לא נולד', prop: 'letter' },
  { verb: 'מגלה', obj: 'ספר שכותב את עצמו', prop: 'book' },
  { verb: 'שומעת', obj: 'שיר שאף אחד אחר לא שומע' },
  { verb: 'מוצאת', obj: 'ביצה זוהרת שמזמזמת', prop: 'spaceEgg' },
  { verb: 'מגלה', obj: 'דלת קטנה שלא הייתה שם אתמול', prop: 'secretDoor' },
  { verb: 'מוצאת', obj: 'נוצה שכותבת באוויר', prop: 'feather' },
  { verb: 'מקבלת', obj: 'מתנה עם פתק: ״לא לפתוח עד השקיעה״', prop: 'gift' },
  { verb: 'פוגשת', obj: 'צל שמתנהג קצת אחרת ממנה' },
  { verb: 'מוצאת', obj: 'פנס שמאיר רק דברים שהלכו לאיבוד', prop: 'lantern' },
  { verb: 'מגלה', obj: 'זכוכית מגדלת שמראה מחשבות', prop: 'magnifier' },
];

export const MISSIONS: string[] = [
  'להחזיר כוכב קטן לשמיים לפני הזריחה',
  'לפתור את התעלומה עד סוף ההפסקה',
  'לעזור לחברה חדשה להרגיש בבית',
  'למצוא את מי שכתב את המכתב',
  'להציל את הסיפור האהוב עליה מהיעלמות',
  'ללמד רובוט מה זו חברות',
  'להחזיר את הצבעים לעיר',
  'למצוא דרך הביתה בלי מפה',
  'לגרום לכל הכיתה לעבוד ביחד',
  'לגלות למה כל השעונים עצרו',
  'לשמור על סוד — ובכל זאת לעזור לכולם',
  'לבנות משהו שעוד לא היה בעולם',
  'למצוא את החלק האחרון של החידה',
];

export const TWISTS: string[] = [
  'הדמות החשודה בעצם ניסתה לעזור.',
  'המפתח הוא משפט שאחת הדמויות כבר אמרה.',
  'כדי להתקדם, שתי דמויות צריכות לשתף פעולה.',
  'מה שנראה כמו טעות היה בדיוק מה שהיה צריך לקרות.',
  'החפץ הקטן ביותר בסצנה הוא החשוב ביותר.',
  'מישהו שתמיד שותק יודע את התשובה.',
  'המקום המוכר מסתיר חדר שאף אחד לא ראה.',
  'הגיבורה מגלה שהיא כבר פגשה את הדמות המסתורית — בגרסה אחרת.',
  'הבעיה נפתרת כשמסתכלים עליה מהצד השני.',
  'הרמז היה מצויר על הכריכה מההתחלה.',
];

export interface Idea {
  hero: Hero;
  place: Place;
  event: IdeaEvent;
  mission: string;
}

export type IdeaPart = keyof Idea;

function pick<T>(arr: T[], avoid?: T, rand: () => number = Math.random): T {
  if (arr.length < 2) return arr[0];
  let item = arr[Math.floor(rand() * arr.length)];
  if (item === avoid) item = arr[(arr.indexOf(item) + 1) % arr.length];
  return item;
}

export function randomIdea(prev?: Idea, locked: Partial<Record<IdeaPart, boolean>> = {}, rand: () => number = Math.random): Idea {
  return {
    hero: locked.hero && prev ? prev.hero : pick(HEROES, prev?.hero, rand),
    place: locked.place && prev ? prev.place : pick(PLACES, prev?.place, rand),
    event: locked.event && prev ? prev.event : pick(EVENTS, prev?.event, rand),
    mission: locked.mission && prev ? prev.mission : pick(MISSIONS, prev?.mission, rand),
  };
}

/** Verbs are feminine; adjust for a male/neutral hero (boy, cat, robot, creature). */
function verbFor(hero: Hero, verb: string): string {
  const male = ['bookworm', 'robot', 'cat', 'creature'].includes(hero.kind);
  if (!male) return verb;
  const map: Record<string, string> = { מוצאת: 'מוצא', פוגשת: 'פוגש', מקבלת: 'מקבל', מגלה: 'מגלה', שומעת: 'שומע' };
  return map[verb] ?? verb;
}

export function ideaText(idea: Idea): string {
  const male = ['bookworm', 'robot', 'cat', 'creature'].includes(idea.hero.kind);
  const mission = male ? idea.mission.replace('האהוב עליה', 'האהוב עליו') : idea.mission;
  return `${idea.hero.text} ${verbFor(idea.hero, idea.event.verb)} ${idea.place.text} ${idea.event.obj}. ${male ? 'עליו' : 'עליה'} ${mission}.`;
}

export function randomTwist(prev?: string): string {
  return pick(TWISTS, prev);
}
