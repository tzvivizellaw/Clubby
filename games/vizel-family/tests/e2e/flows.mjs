/**
 * Flow tests: full series run to the end, game over + retry, save/reload persistence,
 * phone viewport with touch input, pause/mute, and missing voice files (no crash).
 * Usage: node tests/e2e/flows.mjs [--url http://localhost:4180/] [--shots dir]
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const { chromium, devices } = playwright;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg('--url', 'http://localhost:5180/');
const SHOTS = arg('--shots', '');
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };

async function ready(page) {
  await page.waitForFunction(() => window.__vizel && document.querySelector('[data-testid=game-host]')?.dataset.ready === '1', null, { timeout: 30000 });
}
async function clickGame(page, gx, gy) {
  const box = await page.locator('canvas').boundingBox();
  const s = Math.min(box.width / 1280, box.height / 720);
  const ox = box.x + (box.width - 1280 * s) / 2, oy = box.y + (box.height - 720 * s) / 2;
  await page.mouse.click(ox + gx * s, oy + gy * s);
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  // ---------------------------------------------------------------- desktop flows
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await ready(page);
    await page.click('.start-btn', { force: true });
    await page.click('[data-testid=pick-esti]', { force: true });
    await page.waitForSelector('[data-testid=run-esti]', { timeout: 10000 });
    check('title -> select -> map', true);
    // full Esti series with the bot, through real stories (fast mode)
    await page.evaluate(() => { const v = window.__vizel; v.director.bot = true; v.director.fastStories = true; });
    await page.click('[data-testid=run-esti]');
    const done = await page.waitForSelector('[data-testid=done-map]', { timeout: 400000 }).then(() => true).catch(() => false);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/flow-series-done.png` });
    check('complete a whole series (Esti) start to end', done);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vizel-family-save')));
    check('progress saved (8 wins, all unlocked, series completed)', Object.keys(saved.profiles.esti.wins).length === 8 && saved.profiles.esti.unlocked.esti === 8 && saved.profiles.esti.seriesCompleted.includes('esti'));
    await page.reload();
    await ready(page);
    const after = await page.evaluate(() => window.__vizel.store.getState().save.profiles.esti);
    check('progress survives reload', after.totalWins >= 8 && after.items.length === 8);
    // game over: Daniel, three forced failures
    await page.evaluate(() => { const v = window.__vizel; v.store.getState().setPlayer('daniel'); v.director.bot = false; v.director.fastStories = true; v.director.startRun('daniel', 0); });
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(() => window.__vizel.director.activeMiniGame()?.playing, null, { timeout: 30000, polling: 200 });
      await page.evaluate(() => window.__vizel.director.activeMiniGame().forceLose());
      await page.waitForFunction((n) => (window.__vizel.store.getState().run?.hearts ?? 0) === 2 - n, i, { timeout: 30000, polling: 200 });
    }
    const over = await page.waitForFunction(() => window.__vizel.game().scene.isActive('GameOver') && window.__vizel.game().registry.get('gameOverReady'), null, { timeout: 30000, polling: 200 }).then(() => true).catch(() => false);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/flow-gameover.png` });
    check('three failures -> funny Game Over screen', over);
    await clickGame(page, 470, 460); // "עוד ריצה!"
    const retried = await page.waitForFunction(() => window.__vizel.store.getState().run?.hearts === 3 && window.__vizel.store.getState().run?.index === 0, null, { timeout: 15000 }).then(() => true).catch(() => false);
    check('Game Over -> new run with 3 hearts (progress kept)', retried);
    const kept = await page.evaluate(() => window.__vizel.store.getState().save.profiles.esti.totalWins >= 8);
    check('overall progress kept after game over', kept);
    await page.evaluate(() => window.__vizel.director.quitToMap());
    // missing voices: nothing crashed and fallbacks were used
    const voiceLog = await page.evaluate(() => window.__vizel.audio.log.length);
    check('voice lines played with fallbacks (no recordings present)', voiceLog > 10, `(${voiceLog} lines)`);
    await ctx.close();
  }
  // ---------------------------------------------------------------- phone (touch) flow
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    await page.tap('.start-btn', { force: true });
    await page.tap('[data-testid=pick-yedidya]', { force: true });
    await page.waitForSelector('[data-testid=stage-Y1]', { timeout: 10000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/phone-map.png` });
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check('phone: no horizontal page scroll', noHScroll);
    await page.evaluate(() => (window.__vizel.director.fastStories = true));
    await page.tap('[data-testid=stage-Y5]').catch(async () => page.tap('[data-testid=stage-Y1]'));
    const playing = await page.waitForFunction(() => window.__vizel.director.activeMiniGame()?.playing, null, { timeout: 40000, polling: 200 }).then(() => true).catch(() => false);
    check('phone: tap starts a mini-game', playing);
    // tap a shoe via touch: find a game object position and tap it on the canvas
    const before = await page.evaluate(() => window.__vizel.director.activeMiniGame()?.sel);
    const pos = await page.evaluate(() => { const m = window.__vizel.director.activeMiniGame(); const s = m.shoes?.find((x) => !x.done); return s ? { x: s.o.x, y: s.o.y } : { x: 640, y: 360 }; });
    const box = await page.locator('canvas').boundingBox();
    const sc = Math.min(box.width / 1280, box.height / 720);
    await page.touchscreen.tap(box.x + (box.width - 1280 * sc) / 2 + pos.x * sc, box.y + (box.height - 720 * sc) / 2 + pos.y * sc);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => !!window.__vizel.director.activeMiniGame()?.sel);
    check('phone: touch input reaches game objects', !before && after);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/phone-game.png` });
    await page.tap('[data-testid=pause]');
    const paused = await page.waitForSelector('[data-testid=resume]', { timeout: 5000 }).then(() => true).catch(() => false);
    check('phone: pause menu', paused);
    await page.tap('[data-testid=resume]');
    await page.tap('[data-testid=mute]');
    const muted = await page.evaluate(() => window.__vizel.store.getState().save.settings.muted);
    check('phone: mute toggle', muted === true);
    await ctx.close();
  }
  await browser.close();
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} flow checks passed`);
  process.exit(failed ? 1 : 0);
})();
