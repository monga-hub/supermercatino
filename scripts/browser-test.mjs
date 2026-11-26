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

await check('hired cashier serves', async () => {
    const p3 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p3.goto(new URL('?manual', base).href);
    await p3.waitForFunction(() => typeof window.render_game_to_text === 'function');
    const run = (c) => p3.evaluate((x) => window.dispatch(x), c);
    for (const c of [
        { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 6, h: 5 },
        { type: 'placeObject', object: 'scaffale', x: 5, y: 4, category: 'Pasta' },
        { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Pane' },
        { type: 'placeObject', object: 'scaffale', x: 7, y: 4, category: 'Latticini' },
        { type: 'placeObject', object: 'porta', x: 8, y: 5 },
        { type: 'buildRoom', room: 'area_casse', x: 3, y: 8, w: 3, h: 2 },
        { type: 'placeObject', object: 'cassa', x: 4, y: 9 },
    ]) {
        const r = await run(c);
        expect(r.ok, `setup failed: ${JSON.stringify(c)} ${JSON.stringify(r)}`);
    }
    const st = async () => JSON.parse(await p3.evaluate(() => window.render_game_to_text()));
    const cand = (await st()).candidates.find((c) => c.role === 'cassiere');
    const h = await run({ type: 'hire', candidateId: cand.id });
    expect(h.ok, `hire failed: ${JSON.stringify(h)}`);
    const m0 = (await st()).money;
    await p3.evaluate(() => window.advanceTime(20000)); // one game hour at 1x
    const s1 = await st();
    expect(s1.servedToday > 0, `nobody served: ${JSON.stringify({ served: s1.servedToday, lost: s1.lostToday, customers: s1.customers.length })}`);
    expect(s1.money > m0, 'money did not grow');
    await p3.close();
});

await check('shelves get restocked', async () => {
    const p4 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p4.goto(new URL('?manual', base).href);
    await p4.waitForFunction(() => typeof window.render_game_to_text === 'function');
    const run = (c) => p4.evaluate((x) => window.dispatch(x), c);
    const st = async () => JSON.parse(await p4.evaluate(() => window.render_game_to_text()));
    const cats = ['Pasta', 'Pane', 'Latticini'];
    for (const c of [
        { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 6, h: 5 },
        ...cats.map((category, i) => ({ type: 'placeObject', object: 'scaffale', x: 5 + i, y: 4, category })),
        { type: 'placeObject', object: 'porta', x: 8, y: 5 },
        { type: 'buildRoom', room: 'area_casse', x: 3, y: 8, w: 3, h: 2 },
        { type: 'placeObject', object: 'cassa', x: 4, y: 9 },
        { type: 'buildRoom', room: 'magazzino', x: 0, y: 3, w: 3, h: 3 },
        ...cats.flatMap((category) => [{ type: 'order', category }, { type: 'order', category }]),
    ]) {
        const r = await run(c);
        expect(r.ok, `setup failed: ${JSON.stringify(c)} ${JSON.stringify(r)}`);
    }
    for (const role of ['cassiere', 'magazziniere']) {
        const cand = (await st()).candidates.find((c) => c.role === role);
        expect((await run({ type: 'hire', candidateId: cand.id })).ok, `hire ${role} failed`);
    }
    await p4.evaluate(() => window.advanceTime(120000)); // half a day at 1x
    const s1 = await st();
    const shelves = s1.objects.filter((o) => o.type === 'scaffale');
    expect(s1.servedToday > 10, `too few served: ${s1.servedToday}`); // nobody taps here: bills close alone (ADR-0002)
    expect(shelves.every((o) => o.stock > 0), `empty shelf: ${JSON.stringify(shelves)}`);
    expect(cats.some((c) => s1.warehouse[c] < 40), `warehouse untouched: ${JSON.stringify(s1.warehouse)}`);
    await p4.close();
});

await check('tap icon collects', async () => {
    // fresh page, camera centred on cell (10,10) at zoom 1: cell (x,y) centre is at
    // screen (400 + (x-y)*32, 300 + ((x+y)*16 + 16) - 336)
    const p5 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p5.goto(new URL('?manual', base).href);
    await p5.waitForFunction(() => typeof window.render_game_to_text === 'function');
    const run = (c) => p5.evaluate((x) => window.dispatch(x), c);
    const st = async () => JSON.parse(await p5.evaluate(() => window.render_game_to_text()));
    for (const c of [
        { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 6, h: 5 },
        { type: 'placeObject', object: 'scaffale', x: 5, y: 4, category: 'Pasta' },
        { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Pane' },
        { type: 'placeObject', object: 'scaffale', x: 7, y: 4, category: 'Latticini' },
        { type: 'placeObject', object: 'porta', x: 8, y: 5 },
        { type: 'buildRoom', room: 'area_casse', x: 3, y: 8, w: 3, h: 2 },
        { type: 'placeObject', object: 'cassa', x: 4, y: 9 },
    ]) expect((await run(c)).ok, `setup failed: ${JSON.stringify(c)}`);
    await run({ type: 'hire', candidateId: (await st()).candidates.find((c) => c.role === 'cassiere').id });
    let ready;
    for (let i = 0; i < 200 && !ready; i++) {
        await p5.evaluate(() => window.advanceTime(500));
        ready = (await st()).customers.find((c) => c.state === 'ready');
    }
    expect(ready, 'no customer reached a ready bill');
    await frames5();
    const s0 = await st();
    await p5.mouse.click(400 + (4 - 9) * 32, 300 + (13 * 16 + 16) - 336 - 45); // the 💰 icon over the till
    const s1 = await st();
    expect(s1.servedToday === s0.servedToday + 1, `not collected: served ${s0.servedToday} -> ${s1.servedToday}`);
    expect(s1.money > s0.money, 'money did not grow');
    expect(s1.customers.find((c) => c.id === ready.id)?.state === 'leaving', 'customer did not leave');
    await p5.close();
    async function frames5() {
        await p5.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
});

await page.waitForTimeout(10000); // let the game run a while
await check('no console errors', async () => {
    expect(errors.length === 0, errors.join(' | '));
});

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
