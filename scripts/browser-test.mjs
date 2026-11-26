// Browser checks. Needs the dev server running (`npm run dev-nolog`).
// Usage: node scripts/browser-test.mjs [url]   (default http://localhost:8080)
// Opens the game with ?manual (sim advances only via advanceTime) and runs named checks.
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:8080';
const errors = [];
const results = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(new URL('?manual', base).href);
await page.waitForSelector('#game-container canvas', { timeout: 10000 });
await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 10000 });

const state = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const advance = (ms) => page.evaluate((m) => window.advanceTime(m), ms);
// Phaser handles keys on its next frame: wait two frames after each press
const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const press = async (k) => { await page.keyboard.press(k); await frames(); };

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
    await press('1');
    const d1 = await delta();
    await press('3');
    const s3 = await state();
    expect(s3.speed === 3 && !s3.paused, `expected 3x running, got ${JSON.stringify(s3)}`);
    const d3 = await delta();
    expect(d3 === 3 * d1, `3x delta ${d3} != 3 * ${d1}`);
    await press('Space');
    expect((await state()).paused, 'space did not pause');
    expect((await delta()) === 0, 'clock moved while paused');
    await press('Space');
    expect(!(await state()).paused, 'space did not resume');
});

await check('build while paused', async () => {
    const s0 = await state();
    if (!s0.paused) await press('Space');
    const run = (cmd) => page.evaluate((c) => window.dispatch(c), cmd);
    const r1 = await run({ type: 'buildRoom', room: 'sala_vendita', x: 0, y: 0, w: 4, h: 4 });
    const r2 = await run({ type: 'placeObject', object: 'scaffale', x: 1, y: 1, category: 'Pasta' });
    expect(r1.ok && r2.ok, `commands failed: ${JSON.stringify([r1, r2])}`);
    await advance(5000);
    const s1 = await state();
    expect(s1.rooms.length === 1 && s1.objects.length === 1, 'room/object missing');
    expect(s1.money < s0.money, 'money not charged');
    expect(s1.clockSec === s0.clockSec, 'clock moved while paused');
    expect(s1.paused, 'not paused');
});

await check('build with mouse', async () => {
    // fresh page: camera centred, toolbar at the bottom-left starting with "Sala vendita"
    const p2 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p2.goto(new URL('?manual', base).href);
    await p2.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await p2.waitForTimeout(300);
    const st = async () => JSON.parse(await p2.evaluate(() => window.render_game_to_text()));
    await p2.mouse.click(60, 578); // Sala vendita
    await p2.mouse.move(400, 100);
    await p2.mouse.down();
    await p2.mouse.move(400, 200, { steps: 8 });
    await p2.mouse.up();
    const s1 = await st();
    expect(s1.rooms.length === 1 && s1.rooms[0].type === 'sala_vendita', `room not built: ${JSON.stringify(s1.rooms)}`);
    // toolbar widths depend on fonts, so pick the object tool through the hook
    await p2.evaluate(() => window.selectTool({ kind: 'object', object: 'scaffale', category: 'Pasta' }));
    await p2.mouse.click(400, 150); // inside the room
    const s2 = await st();
    expect(s2.objects.length === 1 && s2.objects[0].category === 'Pasta', `shelf not placed: ${JSON.stringify(s2.objects)}`);
    expect(s2.money < s1.money, 'shelf not charged');
    await p2.close();
});

await page.waitForTimeout(10000); // let the game run a while
await check('no console errors', async () => {
    expect(errors.length === 0, errors.join(' | '));
});

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
