import type { Story } from '../model/types';
import { buildStory, type StoryDef } from './builder';
import { sampleStoryDef } from './sampleStory';

export interface Template {
  id: string;
  title: string;
  blurb: string;
  def: StoryDef;
}

const pajamaMystery: StoryDef = {
  title: 'תעלומה במסיבת פיג׳מות',
  description: 'באמצע מסיבת הפיג׳מות נעלמה עוגת השוקולד. מי לקח אותה?',
  genre: 'mystery',
  color: '#3d6fb6',
  coverScene: 'start',
  cast: [
    { key: 'maya', kind: 'sporty', name: 'מאיה' },
    { key: 'lia', kind: 'artist', name: 'ליה' },
    { key: 'cat', kind: 'cat', name: 'פלפל' },
  ],
  scenes: [
    {
      key: 'start',
      name: 'העוגה נעלמה',
      bg: 'bedroom',
      cast: [
        ['maya', 0.25, 'surprised'],
        ['lia', 0.72, 'thinking', true],
      ],
      props: [['lantern', 0.5, 0.95, 0.8]],
      lines: [
        ['n', 'השעה תשע בערב. השקים מסודרים, הפנסים דולקים, והעוגה… נעלמה!'],
        ['maya', 'רק לפני דקה היא הייתה פה, על הצלחת!'],
        ['lia', 'יש פירורים על השטיח. והם מובילים… לשני כיוונים.', 'thought'],
      ],
      next: {
        prompt: 'לאן הולכים בעקבות הפירורים?',
        options: [
          ['אל מתחת למיטה', 'bed'],
          ['אל המטבח', 'kitchen'],
        ],
      },
    },
    {
      key: 'bed',
      name: 'מתחת למיטה',
      bg: 'bedroom',
      cast: [
        ['cat', 0.5, 'happy'],
        ['maya', 0.2, 'surprised'],
      ],
      lines: [
        ['n', 'מתחת למיטה מציצות שתי עיניים צהובות.'],
        ['cat', 'מיאו? אני רק שמרתי על הפירורים. בשבילכן, כמובן.'],
      ],
      next: { goto: null },
    },
    {
      key: 'kitchen',
      name: 'רמז במטבח',
      bg: 'cafe',
      cast: [['lia', 0.5, 'thinking']],
      props: [['magnifier', 0.75, 0.9, 0.9]],
      lines: [
        ['n', 'במטבח המקרר פתוח מעט, ועל הדלת תלוי פתק חדש.'],
        ['lia', 'מה כתוב בפתק? כתבי כאן את הרמז הבא…'],
      ],
      next: { goto: null },
    },
  ],
};

const powersSchool: StoryDef = {
  title: 'בית הספר לכוחות מיוחדים',
  description: 'ביום הראשון בבית הספר החדש מתברר שלכל ילד יש כוח מיוחד. ומה הכוח שלך?',
  genre: 'magic',
  color: '#1f9e95',
  coverScene: 'start',
  cast: [
    { key: 'noa', kind: 'curious', name: 'יעל' },
    { key: 'ori', kind: 'bookworm', name: 'אורי' },
    { key: 'ruth', kind: 'librarian', name: 'המורה דליה' },
  ],
  scenes: [
    {
      key: 'start',
      name: 'יום ראשון בבית הספר',
      bg: 'classroom',
      cast: [
        ['ruth', 0.5, 'happy'],
        ['noa', 0.18, 'surprised'],
        ['ori', 0.82, 'happy', true],
      ],
      lines: [
        ['ruth', 'ברוכים הבאים לבית הספר לכוחות מיוחדים! כאן כל אחד מגלה מה הכוח שלו.'],
        ['ori', 'הכוח שלי הוא לקרוא ספר שלם בדקה. וגם לזכור הכול.'],
        ['noa', 'ואני… עוד לא יודעת מה הכוח שלי.', 'thought'],
      ],
      next: {
        prompt: 'איזה כוח יעל תגלה?',
        options: [
          ['לדבר עם צמחים', 'plants'],
          ['להפוך לבלתי נראית לרגע', 'invisible'],
        ],
      },
    },
    {
      key: 'plants',
      name: 'העציץ המדבר',
      bg: 'classroom',
      cast: [['noa', 0.35, 'surprised']],
      props: [['plant', 0.65, 0.9, 1.3]],
      lines: [
        ['n', 'העציץ שעל אדן החלון מתחיל לרשרש.'],
        ['n', '״סוף סוף מישהי שמבינה אותי! תקשיבי, יש לי סוד על בית הספר הזה…״'],
      ],
      next: { goto: null },
    },
    {
      key: 'invisible',
      name: 'רגע של היעלמות',
      bg: 'schoolyard',
      cast: [['ori', 0.6, 'surprised', true]],
      lines: [
        ['ori', 'יעל? לאן נעלמת? רק השרוך שלך נשאר באוויר!'],
        ['n', 'יעל מגלה שכשהיא נעלמת, היא שומעת דברים שאף אחד אחר לא שומע…'],
      ],
      next: { goto: null },
    },
  ],
};

const spacePet: StoryDef = {
  title: 'החיה הקטנה שהגיעה מהחלל',
  description: 'ביצה זוהרת נוחתת בחצר בית הספר. מה יבקע ממנה?',
  genre: 'space',
  color: '#3b3355',
  coverScene: 'start',
  cast: [
    { key: 'tamar', kind: 'inventor', name: 'תמר' },
    { key: 'bubu', kind: 'creature', name: 'בּוּבּוּ' },
  ],
  scenes: [
    {
      key: 'start',
      name: 'ביצה בחצר',
      bg: 'schoolyard',
      cast: [['tamar', 0.3, 'surprised']],
      props: [['spaceEgg', 0.62, 0.95, 1.2]],
      lines: [
        ['n', 'בהפסקה הגדולה נוחתת בחצר ביצה סגולה עם נקודות זוהרות.'],
        ['tamar', 'היא חמימה… ונדמה לי שהיא מזמזמת שיר!'],
        ['n', 'קרק. קרק־קרק. משהו בתוכה זז.'],
      ],
      next: { goto: 'hatch' },
    },
    {
      key: 'hatch',
      name: 'בּוּבּוּ בוקע',
      bg: 'schoolyard',
      cast: [
        ['tamar', 0.28, 'happy'],
        ['bubu', 0.66, 'surprised', true, 0.9],
      ],
      lines: [
        ['bubu', 'בּוּ? בּוּבּוּ!'],
        ['tamar', 'שלום, בּוּבּוּ. נראה לי שהלכת לאיבוד ממש רחוק מהבית.'],
      ],
      next: {
        prompt: 'איך עוזרים לבּוּבּוּ?',
        options: [
          ['לבנות לו חללית מקרטונים', 'ship'],
          ['להחביא אותו בתיק עד אחרי הצלצול', null],
        ],
      },
    },
    {
      key: 'ship',
      name: 'החללית מקרטון',
      bg: 'spaceship',
      cast: [
        ['tamar', 0.3, 'thinking'],
        ['bubu', 0.7, 'happy', true, 0.9],
      ],
      lines: [
        ['n', 'החללית מקרטון התעוררה לחיים. מסביב — כוכבים.'],
        ['tamar', 'לאן ממשיכים, נווט ראשי?'],
      ],
      next: { goto: null },
    },
  ],
};

const rhymeDay: StoryDef = {
  title: 'היום שבו כולם דיברו בחרוזים',
  description: 'יום אחד כולם מתעוררים ומגלים שהם מדברים רק בחרוזים. איך מחזירים את המילים לקדמותן?',
  genre: 'funny',
  color: '#e2b23a',
  coverScene: 'start',
  cast: [
    { key: 'lia', kind: 'artist', name: 'ליה' },
    { key: 'ori', kind: 'bookworm', name: 'אורי' },
    { key: 'cat', kind: 'cat', name: 'פלפל' },
  ],
  scenes: [
    {
      key: 'start',
      name: 'בוקר מחורז',
      bg: 'cafe',
      cast: [
        ['lia', 0.25, 'surprised'],
        ['ori', 0.75, 'happy', true],
      ],
      lines: [
        ['lia', 'בוקר טוב, אורי, מה שלומך? אמרתי את זה… בחרוז? אין לי מושג איך!'],
        ['ori', 'גם אני מדבר כך, כמו שיר. נראה לי שכל העיר!'],
        ['n', 'אפילו החתול של בית הקפה מגרגר בחריזה.'],
      ],
      next: { goto: 'cat' },
    },
    {
      key: 'cat',
      name: 'החתול יודע משהו',
      bg: 'cafe',
      cast: [
        ['cat', 0.5, 'thinking'],
        ['lia', 0.18, 'thinking'],
      ],
      lines: [
        ['cat', 'מיאו, אני יודע מאיפה זה בא — מהשיר שנשכח על הספה.'],
        ['lia', 'שיר שנשכח? אז צריך למצוא אותו!'],
      ],
      next: {
        prompt: 'איפה מחפשים את השיר?',
        options: [
          ['על הספה בבית הקפה', null],
          ['בספרייה העירונית', null],
        ],
      },
    },
  ],
};

export const TEMPLATES: Template[] = [
  { id: 'pajama', title: pajamaMystery.title, blurb: 'תעלומה מצחיקה עם פירורים וחתול חשוד', def: pajamaMystery },
  { id: 'library', title: 'הדלת הסודית בספרייה', blurb: 'הסיפור לדוגמה המלא — לשנות ולהמשיך', def: sampleStoryDef },
  { id: 'powers', title: powersSchool.title, blurb: 'יום ראשון בבית ספר שבו לכולם יש כוח מיוחד', def: powersSchool },
  { id: 'space', title: spacePet.title, blurb: 'ביצה זוהרת, יצור חמוד וחללית מקרטון', def: spacePet },
  { id: 'rhymes', title: rhymeDay.title, blurb: 'כל העיר מדברת בחרוזים. למה?', def: rhymeDay },
];

/** A fresh, editable copy of a template with new IDs. */
export function storyFromTemplate(templateId: string): Story | null {
  const t = TEMPLATES.find((x) => x.id === templateId);
  return t ? buildStory(t.def) : null;
}
