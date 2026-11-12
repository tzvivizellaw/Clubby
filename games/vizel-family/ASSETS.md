# Assets — what is original, temporary or missing / נכסים — מקוריים, זמניים וחסרים

All art and audio in the game were created for this project in code. No third-party characters, art, sounds, scripts or screens are used.
כל האיורים והקולות במשחק נוצרו במיוחד לפרויקט, בקוד. לא נעשה שימוש בנכסים של משחקים אחרים.

## Original (in code)
| Asset | Where | Notes |
|---|---|---|
| 6 family characters (separate SVG parts: head, body, arms, legs, cape) | `src/characters/parts.ts` | Animated live by `CharacterRig` (eyes, brows and mouth drawn per expression) |
| ~130 objects, animals, creatures (incl. the original yellow "Pupi") | `src/assets/objects.ts` | SVG, rasterised at boot |
| 12 parallax backgrounds | `src/assets/backgrounds.ts` | Vector graphics, baked to textures per scene |
| Sound effects incl. animal sounds | `src/audio/sfx.ts` | Web Audio synthesis |
| 7 background tunes (menu, play, boss, toddler, fridge song, party, sleepy) | `src/audio/music.ts` | Original melodies, procedural |
| Fonts | `@fontsource/rubik` (SIL Open Font License) | Bundled locally |

## Temporary (placeholders, ready to replace without code changes)
| Placeholder | How to replace |
|---|---|
| **Voice lines** — cartoon "babble" or browser TTS + subtitles | Add `public/audio/voices/<speaker>/<speaker>_<event>_01.mp3`, run `npm run voices:scan`. Full list: `public/audio/voices/README.md` |
| **Character heads** drawn in SVG | Add a photo-based head (PNG with transparent background) to `public/assets/characters/<id>/head.png` and register it in `public/assets/characters/manifest.json`: `{ "father": { "head": "father/head.png", "hideFace": true } }` (ids: father, mother, avigail, daniel, yedidya, esti) |
| Animal sounds are synthesized approximations | Optional: real recordings could be added to `public/audio/sfx/` (would need a small hook in `sfx.ts`) |
| Music is chiptune-style synthesis | Optional: real music files in `public/audio/music/` |

## Missing / not done
- No real family recordings yet (by design: they will only be used after you add them to the project).
- No photo-based character art yet (the replacement system is ready, see above).
- Hebrew TTS fallback depends on the device having a Hebrew voice; otherwise the babble voice + subtitles are used.
