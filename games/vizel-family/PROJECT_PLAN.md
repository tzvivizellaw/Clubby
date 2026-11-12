# PROJECT_PLAN — משפחת ויזל – הבלגן מתחיל! / The Vizel Family: Total Chaos

Location: `games/vizel-family/` (standalone Vite project, outside the Clubby npm workspaces).

## Architecture
| Layer | Folder | Notes |
|---|---|---|
| UI shell (menus, HUD, pause, settings, collection) | `src/app`, `src/components` | React 18 + Zustand, RTL |
| Game engine glue | `src/engine` | Phaser 3 game, `RunDirector` (run/hearts flow), `BaseMiniGame`, comedy events |
| Story scenes | `src/scenes/StoryScene.ts` | Script DSL interpreter (intro / win / lose), skippable |
| Characters | `src/characters` | Original SVG parts + `CharacterRig`, photo-override manifest |
| Objects & backgrounds | `src/assets` | Original SVG objects, 12 parallax backgrounds |
| Animations | `src/animations` | Confetti, shake, zoom, squash/stretch, living objects |
| Audio | `src/audio` | Synth SFX, procedural music, Voice Registry with fallbacks |
| Progression | `src/progression` | Versioned localStorage save, unlocks, bests, items, achievements |
| Data / mini-games | `src/data`, `src/minigames/*` | 40 mini-games, one file each + per-series metadata/scripts |
| Tests | `src/tests` (vitest), `tests/e2e` (Playwright bot + flows) |

## Stages
- [x] A. Infrastructure: project, title, character select, hearts, stages, save, audio, story scenes
- [x] B. Family series F1–F8
- [x] C. Personal series: Avigail A1–A8, Daniel D1–D8, Yedidya Y1–Y8, Esti E1–E8
- [x] D. Visual polish: rigs, expressions, comedy events, music, baked backgrounds
- [x] E. QA: tsc, build, unit tests, e2e bot (all 40 win + lose path), flow tests (full series, game over, reload, phone touch, pause, mute, missing voices)

## Possible next steps
- Real family voice recordings (drop-in, see `public/audio/voices/README.md`).
- Photo-based character heads (drop-in, see `ASSETS.md`).
- More hand-tuning of difficulty after real play-testing with the kids.

## Resume notes
Run `npm run typecheck && npm test && npm run build`, then `npm run preview` + `npm run test:e2e` + `npm run test:flows`.
