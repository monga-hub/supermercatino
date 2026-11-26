// Browser smoke test. Needs the dev server running (`npm run dev-nolog`).
// Usage: node scripts/browser-test.mjs [url]   (default http://localhost:8080)
// Fails on any console error / page error, or if no game canvas renders.
// ponytail: single smoke check; grow into per-milestone checks via render_game_to_text()/advanceTime() once they exist.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:8080';
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url);
await page.waitForSelector('#game-container canvas', { timeout: 10000 });
await page.waitForTimeout(1000);

const state = await page.evaluate(() => window.render_game_to_text?.() ?? null);
await browser.close();

if (state) console.log('state:', state);
if (errors.length) {
    console.error('FAIL console errors:\n' + errors.join('\n'));
    process.exit(1);
}
console.log('OK canvas rendered, no console errors');
