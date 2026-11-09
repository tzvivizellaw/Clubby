# הסיפור שלי — Interactive Story & Comic Studio

A Hebrew (RTL) browser game where a 10-year-old creates branching comic stories — picks backgrounds and characters, writes speech/thought/narration, adds choices that lead to different endings — then plays them and shares them as a single HTML file.

Standalone project inside the Clubby repo (not part of the npm workspaces). No server, no API keys, no accounts, no analytics.

## Run

```bash
cd story-studio
npm install
npm run dev        # http://localhost:5180
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ on http://localhost:4180
npm test           # unit tests (Vitest)
npm run e2e        # end-to-end flow on desktop + phone (needs `npm run build` and `npm run preview` running)
```

`npm run dev` / `build` first build the standalone player (`vite.player.config.ts` → `src/generated/player-bundle.js`), which the HTML export embeds.

## Features

- Home screen, skippable 3-step intro, "continue creating", sample story, idea jar.
- 5 editable templates + blank story; story details (title, pen name, description, genre, cover color/scene).
- Scene editor (desktop: scenes right / stage center / tools left; phone: stage on top + bottom tab bar). Add, duplicate, rename, reorder, delete-with-link-repair, set start scene, undo/redo.
- 10 original SVG backgrounds, 9 characters (4 expressions, palette colors, size, flip, layers, drag by mouse/touch, position buttons, arrow keys), 12 props.
- Speech / thought / narration with live preview and a gentle long-text hint.
- Continuations: go to scene, 2–3 choices, or a named ending. "Create a new scene for this choice".
- Story map (SVG map + accessible list) and a link checker: missing/deleted targets, unreachable scenes, no reachable ending, loops with no exit. Blockers vs. fixes vs. tips.
- Player: cover, one line at a time, typing animation (skippable, can be turned off), big choice buttons, real back-history, restart, endings counter, gentle celebration.
- Autosave to localStorage with a real status (saving / saved / quota / unavailable), damaged-data handling, library with duplicate/delete.
- Export: JSON (re-import always as a copy if the ID exists, validated, size-limited) and a self-contained offline HTML game (no CDN/fonts/external files).
- Sounds (off by default, only after interaction), reduced-motion support, keyboard + focus rings, labeled icon buttons.

## Structure

| Path | Purpose |
|---|---|
| `src/model` | data model (`schemaVersion` 1), ops, link checker |
| `src/player` | engine (pure state machine), `StoryPlayer`, stage, dialogue — shared by app and export |
| `src/editor` | editor, panels, story map, modals, undo/autosave hook |
| `src/storage` | local storage store |
| `src/io` | strict parser/validator, JSON + HTML export |
| `src/assets` | original SVG characters, backgrounds, props |
| `src/content` | sample story, templates, idea jar |
| `e2e/run.cjs` | Playwright acceptance flow |

## Known limitations

- Stories live only in this browser on this device (no cloud, no sync). Download backups.
- Opening an HTML file received in a chat app on a phone may not work; a desktop browser is the safest.
- Map layout is simple (columns by distance from start); very large stories need scrolling.
- Day/night background variants were not added.

---

# הסיפור שלי — סטודיו לסיפורים וקומיקס אינטראקטיבי

משחק דפדפן בעברית שבו יוצרים סיפור מסתעף: בוחרים רקעים ודמויות, כותבים בועות דיבור, מחשבה ומספרת, מוסיפים בחירות שמובילות לסופים שונים — ואז משחקים בסיפור ומשתפים אותו כקובץ HTML אחד.

## הפעלה

```bash
cd story-studio
npm install
npm run dev     # http://localhost:5180
```

## איך יוצרים סיפור ראשון

1. במסך הבית לוחצים ״צרי סיפור חדש״, נותנים שם ובוחרים ״דף חלק״ או תבנית.
2. בלשונית ״רקע״ בוחרים מקום.
3. בלשונית ״דמויות״ מוסיפים דמויות, וגוררים אותן על הבמה (או משתמשים בכפתורי ימין/מרכז/שמאל).
4. בלשונית ״טקסט״ מוסיפים בועות דיבור, מחשבה או מספרת.
5. בלשונית ״המשך״ בוחרים ״הקוראת בוחרת״, כותבים את הבחירות ולוחצים ״צרי סצנה חדשה לזה״.
6. בכל סצנת סיום בוחרים ״סוף הסיפור״ ונותנים לסוף שם.
7. לוחצים ״שחקי בסיפור״!
8. ב״שמירה ושיתוף״ אפשר להוריד קובץ משחק (HTML) לחברות ולמשפחה, או קובץ גיבוי לעריכה (JSON).

הסיפורים נשמרים אוטומטית רק במכשיר ובדפדפן הזה. הם לא עוברים לבד למכשיר אחר, וניקוי נתוני הדפדפן עלול למחוק אותם — לכן כדאי להוריד גיבוי.

## בדיקות

`npm test` — בדיקות יחידה (מנוע הנגן והיסטוריית בחירות, קישורים שבורים, סצנות לא נגישות, לולאות, שמירה וטעינה, נתונים פגומים, מכסת אחסון, ייבוא לא תקין, ייצוא בטוח של עברית ותווים מיוחדים).
`npm run e2e` — בדיקת קצה לקצה במחשב ובטלפון.
