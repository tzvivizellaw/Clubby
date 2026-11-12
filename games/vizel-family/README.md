# משפחת ויזל – הבלגן מתחיל! · The Vizel Family: Total Chaos

> **EN** — An original, browser-based family comedy game: 40 short mini-games, a continuous cartoon story, animated SVG characters, hearts, stages, sound and saved progress. Works on desktop, tablet and phone (mouse, touch and keyboard), full Hebrew RTL.
>
> **HE** — משחק משפחתי מקורי בדפדפן: 40 משחקונים קצרים, סיפור מצויר מתמשך, דמויות SVG מונפשות, לבבות, שלבים, קולות ושמירת התקדמות. עובד במחשב, בטאבלט ובטלפון (עכבר, מגע ומקלדת), עברית מלאה מימין לשמאל.

---

## Run / הרצה

```bash
cd games/vizel-family
npm install
npm run dev          # http://localhost:5180
npm run build        # production build -> dist/
npm run preview      # serve the build on http://localhost:4173
```

**HE:** `npm install` ואז `npm run dev` ופותחים את הכתובת בדפדפן. לבנייה לפרסום: `npm run build` (התוצאה בתיקייה `dist/`, אפשר להעלות לכל אחסון סטטי).

## Tests / בדיקות

```bash
npm run typecheck    # TypeScript (0 errors)
npm test             # unit tests (vitest): save/load + migration, hearts, unlocks, registry, voice fallbacks, puzzle generators, Mishna content
npm run preview &    # then, in another terminal:
npm run test:e2e     # browser: a built-in bot plays all 40 mini-games to a WIN, then forces a LOSS (heart lost / toddler retry)
npm run test:flows   # browser: full series run, game over + retry, save/reload, phone viewport + touch, pause, mute, missing voices
```

The e2e tests use Playwright's Chromium (`require('playwright')`). The bot uses the same entry points as player input, so a WIN proves each stage is completable.

---

## How to play / איך משחקים

1. **מסך פתיחה** → "יאללה, מתחילים!"
2. **בחירת שחקן**: אביגיל (10, מתקדם), דניאל (9, בינוני־מתקדם), ידידיה (5, קל), אסתי (3, פעוטות). כל דמות נכנסת באנימציה משלה.
3. **מפה**: הסדרה האישית של הילד + הסדרה המשפחתית (8 שלבים כל אחת). שלב נפתח אחרי ניצחון בשלב הקודם.
4. **ריצה**: 3 לבבות. כישלון = לב אחד פחות וניסיון חוזר באותו שלב. 3 ניצחונות ברצף = לב בונוס (פעם אחת בריצה). אחרי 3 פסילות — Game Over מצחיק, ואפשר להתחיל ריצה מחדש; ההתקדמות הכללית נשמרת.
5. **אסתי**: מצב פעוטות — אין Game Over, אין לחץ זמן, טעות מקבלת עזרה וניסיון נוסף, הוראות קוליות וכפתורים גדולים.

Each mini-game = intro scene (skippable, "דלג") → funny line → instruction card → gameplay → unique win/fail animation → punch line → next stage.

**Controls:** tap / click, drag, swipe; keyboard arrows + Space where it makes sense; `Esc` = pause, `M` = mute.

## The 40 mini-games / 40 המשחקונים

| # | Family / משפחה | Avigail / אביגיל | Daniel / דניאל | Yedidya / ידידיה | Esti / אסתי |
|---|---|---|---|---|---|
| 1 | אבא מאחר למילואים — catch gear, tap runaway keys | מבצע שבת — order living task cards | סל מהחלון — slingshot into a running hoop | מי עושה מו? — joke phase, then sound ID | הפרה אומרת — sound ID, 3 big animals |
| 2 | מי שאל מתי מגיעים?! — lanes + kids' requests | מי לקח לי?! — logic detective, one liar | ברול בבית — move/dodge, auto foam fire, vacuum boss | להציל את הדובי — timed pillow hops | איפה הדובי? — hide & seek |
| 3 | עוד חמש דקות שבת! — set the table, dancing challahs | המטבח השתגע — recipe catch, vegetable revolt | מבחן המשנה — ראש השנה פ"א, answer bubbles | גיבור המקרר — 3-lane colour catch, singing fridge | בלונים לאבא — pop by colour, giant balloon |
| 4 | אבא נגד המדפסת — tap important papers, robot printer | המבחן של דניאל — true/false + memory, arguing pencil | לא נוגעים ברצפה — lava auto-runner | החלום המוזר — door clues, silhouettes | העוגיות ברחו — drag cookies to plate |
| 5 | המזגן השתגע — buckets, empty, smash ice | מבצע כביסה — conveyor sorting, dancing socks | הממציא — pipe-rotation machine (makes soup) | איפה הנעל? — pairs of running shoes | מי ישן איפה? — animals to homes, elephant gag |
| 6 | הבורקס הענקי — timing cuts, runaway borekas | סוכנת חשאית — 4-symbol code breaking | הכדור ברח — maze with patrolling vacuums | היצורים הצהובים ברחו — catch + disguised Pupis | המקלחת המצחיקה — musical bubbles, sneezing duck |
| 7 | מבצע לילה טוב — kids, toys, lights, sleepy dad | מסיבת הפתעה — budget planning | מלחמת האחים — lane tower defense → robot | סופר ידידיה — aim & shoot, laundry boss = giant sock | אמא, תראי! — dress dad, fashion parade |
| 8 | אבא אלוף הכדורסל — 2-tap aim/power | מלכת הבלגן — 5-task boss | גמר האליפות — flick shots, changing obstacles, hoop boss | הצלת הבית — 3 tasks vs. flood | מסיבת החיות — make music |

## Architecture / ארכיטקטורה

| Layer | Folder |
|---|---|
| React UI shell (title, select, map, HUD, pause, settings, collection) + Zustand store | `src/app`, `src/components` |
| Phaser 3 engine glue: `RunDirector` (stories → game → result → hearts/next), `BaseMiniGame`, comedy events, UI helpers | `src/engine` |
| Story Director (script DSL interpreter, skippable) + Boot / Game Over scenes | `src/scenes` |
| Character system: SVG parts + `CharacterRig` (idle, walk/run, jump, fall, hit, celebrate, cry, laugh, shock, squash, stretch, spin, entrance/exit, fly, sleep, signature moves, expressions, blinking) | `src/characters` |
| Animation helpers (confetti, explode-into-confetti, screen shake, camera zoom, dust, stars, splash) + `Living` objects (googly eyes, mouths, tongue, running legs) | `src/animations` |
| Audio Manager, Voice Registry (recording → TTS → babble fallback, subtitles, variants), synth SFX, procedural music | `src/audio` |
| Progression (versioned localStorage save + migration, unlocks, bests, items, achievements) | `src/progression` |
| Data: characters, difficulty profiles (per child + parent override) | `src/data` |
| 40 mini-games: one file each, `index.ts` per series holds metadata + story scripts | `src/minigames/<series>` |

Every mini-game definition has: `id, title, series (character), difficulty, instructions, duration, intro (story), gameplay (lazy loader), winCondition, loseCondition, winAnimation, loseAnimation, voiceEvents, nextStage`.

### Adding family recordings / הוספת הקלטות
See `public/audio/voices/README.md` — drop files like `father/father_where_are_keys_01.mp3`, run `npm run voices:scan`. No code changes. Recordings are never uploaded anywhere.

### Using family photos for characters / תמונות של בני המשפחה
Put a transparent PNG head in `public/assets/characters/<id>/head.png` and register it in `public/assets/characters/manifest.json`. See `ASSETS.md`.

### Parent settings / הגדרות הורים
⚙️ on the map → sliders for music / effects / voices, mute, subtitles, temporary-voice mode, auto-skip stories, and (behind a small multiplication question) difficulty per child: easier / by age / harder.

## Status / מצב
See `PROJECT_PLAN.md` and `ASSETS.md` (temporary and missing assets).
