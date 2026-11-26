// Browser checks. Needs the dev server running (`npm run dev-nolog`).
// Usage: node scripts/browser-test.mjs [url]   (default http://localhost:8080)
// Opens the game with ?manual (sim advances only via advanceTime) and runs named checks.
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:8080';
const errors = [];
const results = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(new URL('/?manual', base).href);
await page.waitForSelector('#game-container canvas', { timeout: 10000 });
await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 10000 });

const state = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const advance = (ms) => page.evaluate((m) => window.advanceTime(m), ms);

async function check(name, fn) {
    try {
        await fn();
        results.push(`ok   ${name}`);
    } catch (e) {
        results.push(`FAIL ${name}: ${e.message}`);
    }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

await check('hooks expose and advance state', async () => {
    const s0 = await state();
    for (const k of ['grid', 'day', 'clockSec', 'speed', 'paused']) expect(k in s0, `missing ${k}`);
    await advance(60000);
    const s1 = await state();
    expect(s1.clockSec > s0.clockSec || s1.day > s0.day, `clock did not move: ${s0.clockSec} -> ${s1.clockSec}`);
});

await check('keyboard speed controls', async () => {
    const delta = async () => {
        const a = (await state()).clockSec;
        await advance(1000);
        return (await state()).clockSec - a;
    };
    await page.keyboard.press('1');
    const d1 = await delta();
    await page.keyboard.press('3');
    const s3 = await state();
    expect(s3.speed === 3 && !s3.paused, `expected 3x running, got ${JSON.stringify(s3)}`);
    const d3 = await delta();
    expect(d3 === 3 * d1, `3x delta ${d3} != 3 * ${d1}`);
    await page.keyboard.press('Space');
    expect((await state()).paused, 'space did not pause');
    expect((await delta()) === 0, 'clock moved while paused');
    await page.keyboard.press('Space');
    expect(!(await state()).paused, 'space did not resume');
});

await page.waitForTimeout(10000); // let the game run a while
await check('no console errors', async () => {
    expect(errors.length === 0, errors.join(' | '));
});

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
