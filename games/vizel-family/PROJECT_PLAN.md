# PROJECT_PLAN — משפחת ויזל – הבלגן מתחיל! / The Vizel Family: Total Chaos

Location: `games/vizel-family/` (standalone Vite project, outside the Clubby npm workspaces).

## Architecture
| Layer | Folder | Notes |
|---|---|---|
| UI shell (menus, HUD, pause, settings) | `src/app`, `src/components` | React 18 + Zustand, RTL |
| Game engine glue | `src/engine` | Phaser 3 game, `RunDirector` (run/hearts flow), `BaseMiniGame`, comedy events |
| Story scenes | `src/scenes/StoryScene.ts` | Script DSL interpreter (intro / win / lose), skippable |
| Characters | `src/characters` | Original SVG parts + `CharacterRig` (eyes/mouth/limbs animated), photo-override manifest |
| Objects & backgrounds | `src/assets` | Original SVG objects, Phaser-Graphics parallax backgrounds (12) |
| Animations | `src/animations` | Confetti, shake, zoom, squash/stretch, living objects (eyes, legs, tongue) |
| Audio | `src/audio` | Web Audio synth SFX + procedural original music + Voice Registry with fallbacks |
| Progression | `src/progression` | Versioned localStorage save, unlocks, bests, items, achievements |
| Data | `src/data`, `src/minigames/*/index.ts` | Characters, difficulty profiles, 40 mini-game definitions + scripts |
| Tests | `src/tests` (vitest), `tests/e2e` (Playwright bot run) |

## Stages
- [x] A. Infrastructure: project, title, character select, hearts, stages, save, audio, story scenes
- [x] B. Family series F1–F8
- [x] C. Personal series: Avigail A1–A8, Daniel D1–D8, Yedidya Y1–Y8, Esti E1–E8
- [x] D. Visual polish: rigs, expressions, comedy events, music
- [x] E. QA: tsc, build, unit tests, e2e bot run of all 40 games (win + lose), mobile viewport, touch, save/load, missing voices

## Resume notes
If work is interrupted: check boxes above, run `npm run typecheck && npm test && npm run test:e2e`, continue with the first unchecked item.
