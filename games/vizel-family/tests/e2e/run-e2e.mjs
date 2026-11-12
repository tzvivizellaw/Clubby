/**
 * End-to-end browser test: boots the game, and for every mini-game lets the built-in bot play it
 * through real game logic (win), then forces a loss to verify hearts / retry / game-over flow.
 * Usage: node tests/e2e/run-e2e.mjs [--url http://localhost:5180] [--only F1,F2] [--player daniel] [--shots dir]
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const { chromium, devices } = playwright;

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg('--url', 'http://localhost:5180/');
const ONLY = arg('--only', '');
const SHOTS = arg('--shots', '');
const SERIES_PLAYER = { family: arg('--player', 'daniel'), avigail: 'avigail', daniel: 'daniel', yedidya: 'yedidya', esti: 'esti' };

const results = [];
const errors = [];

async function setup(page) {
  await page.goto(URL);
  await page.waitForFunction(() => window.__vizel && document.querySelector('[data-testid=game-host]')?.dataset.ready === '1', null, { timeout: 30000 });
}

async function runGame(page, series, idx, id, player) {
  const t0 = Date.now();
  await page.evaluate(({ series, idx, player }) => {
    const v = window.__vizel;
    v.store.getState().setPlayer(player);
    v.director.bot = true;
    v.director.fastStories = true;
    v.director.startRun(series, idx);
  }, { series, idx, player });
  // win = run index advanced or series finished
  const ok = await page.waitForFunction(({ idx }) => {
    const s = window.__vizel.store.getState();
    return s.screen === 'seriesDone' || (s.run && s.run.index > idx) || (s.run && s.run.phase === 'over');
  }, { idx }, { timeout: 180000, polling: 250 }).then(() => true).catch(() => false);
  const state = await page.evaluate(() => { const s = window.__vizel.store.getState(); return { screen: s.screen, run: s.run }; });
  const won = ok && (state.screen === 'seriesDone' || (state.run && state.run.index > idx));
  const lostHearts = state.run ? 3 - state.run.hearts : 0;
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${id}-end.png` });
  return { won, ms: Date.now() - t0, lostHearts };
}

async function loseFlow(page, series, idx, player) {
  await page.evaluate(({ series, idx, player }) => {
    const v = window.__vizel;
    v.store.getState().setPlayer(player);
    v.director.bot = false;
    v.director.fastStories = true;
    v.director.startRun(series, idx);
  }, { series, idx, player });
  await page.waitForFunction(() => window.__vizel.director.activeMiniGame()?.playing, null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(1500);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${series}-${idx}-play.png` });
  await page.evaluate(() => window.__vizel.director.activeMiniGame().forceLose());
  const hardFail = await page.evaluate(() => window.__vizel.store.getState().run.hardFail);
  if (!hardFail) {
    // toddler: game restarts itself, no heart lost
    await page.waitForTimeout(3500);
    const st = await page.evaluate(() => ({ hearts: window.__vizel.store.getState().run.hearts, attempt: window.__vizel.director.activeMiniGame()?.attempt }));
    return { softRetry: st.attempt === 1 && st.hearts === 3 };
  }
  await page.waitForFunction(() => window.__vizel.store.getState().run?.hearts === 2, null, { timeout: 30000, polling: 200 });
  return { heartLost: true };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await setup(page);
  const ids = await page.evaluate(() => window.__vizel.games());
  const bySeries = { family: [], avigail: [], daniel: [], yedidya: [], esti: [] };
  for (const id of ids) bySeries[{ F: 'family', A: 'avigail', D: 'daniel', Y: 'yedidya', E: 'esti' }[id[0]]].push(id);
  for (const [series, list] of Object.entries(bySeries)) {
    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      if (ONLY && !ONLY.split(',').includes(id)) continue;
      const player = SERIES_PLAYER[series];
      const errBefore = errors.length;
      let r;
      try { r = await runGame(page, series, i, id, player); } catch (e) { r = { won: false, err: String(e) }; }
      let lf = {};
      try { lf = await loseFlow(page, series, i, player); } catch (e) { lf = { loseErr: String(e).slice(0, 120) }; }
      await page.evaluate(() => window.__vizel.director.quitToMap());
      const res = { id, series, player, ...r, ...lf, newErrors: errors.slice(errBefore) };
      results.push(res);
      console.log(`${id} ${player}: ${r.won ? 'WIN' : 'FAIL'} in ${(r.ms / 1000).toFixed(1)}s, heartsLostByBot=${r.lostHearts} lose:${JSON.stringify(lf)} errors=${res.newErrors.length}`);
      for (const e of res.newErrors.slice(0, 3)) console.log('   ', e.slice(0, 200));
    }
  }
  await browser.close();
  const failed = results.filter((r) => !r.won || r.newErrors.length || r.loseErr || (!r.heartLost && !r.softRetry));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
