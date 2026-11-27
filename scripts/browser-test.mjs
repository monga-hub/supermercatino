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
/** The level starts paused (milestone 08): press 1x like the player. */
const start = async (p) => {
    await p.keyboard.press('1');
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

await check('hooks expose and advance state', async () => {
    const s0 = await state();
    for (const k of ['grid', 'day', 'clockSec', 'speed', 'paused']) expect(k in s0, `missing ${k}`);
    expect(s0.paused, 'level should start paused');
    await advance(60000);
    expect((await state()).clockSec === s0.clockSec, 'clock moved before pressing 1x');
    await start(page);
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
    // fresh page: camera centred. Toolbar layout wraps with fonts/width, so tools are picked through the hook.
    const p2 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p2.goto(new URL('?manual', base).href);
    await p2.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await p2.waitForTimeout(300);
    const st = async () => JSON.parse(await p2.evaluate(() => window.render_game_to_text()));
    await p2.evaluate(() => window.selectTool({ kind: 'room', room: 'sala_vendita' }));
    const at = (x, y, lift) => p2.evaluate(([a, b, c]) => window.cellToScreen(a, b, c), [x, y, lift]);
    const [a, b] = [await at(8, 8), await at(12, 12)];
    await p2.mouse.move(a.x, a.y);
    await p2.mouse.down();
    await p2.mouse.move(b.x, b.y, { steps: 8 });
    await p2.mouse.up();
    const s1 = await st();
    expect(s1.rooms.length === 1 && s1.rooms[0].type === 'sala_vendita', `room not built: ${JSON.stringify(s1.rooms)}`);
    await p2.evaluate(() => window.selectTool({ kind: 'object', object: 'scaffale', category: 'Pasta' }));
    // playtest 2026-11-27: a tap only puts it there to try; another tap moves it, 🔄 turns it, ✓ buys it
    const hudTap = async (l) => { const x = (await p2.evaluate(() => window.hudButtons())).find((q) => q.label === l); expect(x, `no ${l} button`); await p2.mouse.click(x.x, x.y); await p2.waitForTimeout(50); };
    for (const [x, y] of [[10, 10], [11, 9]]) {
        const c = await at(x, y);
        await p2.mouse.click(c.x, c.y);
        await p2.waitForTimeout(50);
    }
    expect((await st()).objects.length === 0 && (await st()).money === s1.money, 'bought with the first tap');
    await hudTap('🔄');
    await hudTap('✓');
    const s2 = await st();
    const o = s2.objects[0];
    expect(s2.objects.length === 1 && o.category === 'Pasta' && o.x === 11 && o.y === 9 && o.rot === 1, `shelf not placed moved and turned: ${JSON.stringify(s2.objects)}`);
    expect(s2.money < s1.money, 'shelf not charged');
    await p2.close();
});

await check('hired cashier serves', async () => {
    const p3 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p3.goto(new URL('?manual', base).href);
    await p3.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await start(p3);
    const run = (c) => p3.evaluate((x) => window.dispatch(x), c);
    for (const c of [
        { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 6, h: 5 },
        { type: 'placeObject', object: 'scaffale', x: 5, y: 4, category: 'Pasta' },
        { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Frutta' },
        { type: 'placeObject', object: 'scaffale', x: 7, y: 4, category: 'Detersivi' },
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
    await p3.evaluate(() => window.advanceTime(40000)); // two game hours at 1x
    const s1 = await st();
    expect(s1.servedToday > 0, `nobody served: ${JSON.stringify({ served: s1.servedToday, lost: s1.lostToday, customers: s1.customers.length })}`);
    expect(s1.money > m0, 'money did not grow');
    await p3.close();
});

await check('shelves get restocked', async () => {
    const p4 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p4.goto(new URL('?manual', base).href);
    await p4.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await start(p4);
    const run = (c) => p4.evaluate((x) => window.dispatch(x), c);
    const st = async () => JSON.parse(await p4.evaluate(() => window.render_game_to_text()));
    const cats = ['Pasta', 'Frutta', 'Detersivi'];
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
    await p4.evaluate(() => window.advanceTime(180000)); // ~9 game hours at 1x
    const s1 = await st();
    const shelves = s1.objects.filter((o) => o.type === 'scaffale');
    expect(s1.servedToday > 10, `too few served: ${s1.servedToday}`); // nobody taps here: bills close alone (ADR-0002)
    expect(shelves.every((o) => o.stock > 0), `empty shelf: ${JSON.stringify(shelves)}`);
    expect(cats.some((c) => s1.warehouse[c] < 40), `warehouse untouched: ${JSON.stringify(s1.warehouse)}`);
    await p4.close();
});

await check('tap icon collects', async () => {
    const p5 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p5.goto(new URL('?manual', base).href);
    await p5.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await start(p5);
    const run = (c) => p5.evaluate((x) => window.dispatch(x), c);
    const st = async () => JSON.parse(await p5.evaluate(() => window.render_game_to_text()));
    for (const c of [
        { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 6, h: 5 },
        { type: 'placeObject', object: 'scaffale', x: 5, y: 4, category: 'Pasta' },
        { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Frutta' },
        { type: 'placeObject', object: 'scaffale', x: 7, y: 4, category: 'Detersivi' },
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
    const icon = await p5.evaluate(() => window.cellToScreen(4, 9, 58)); // ICON_LIFT.till: bottom of the 💰 badge
    await p5.mouse.click(icon.x, icon.y - 10); // the badge is ~21 screen px tall at any zoom
    const s1 = await st();
    expect(s1.servedToday === s0.servedToday + 1, `not collected: served ${s0.servedToday} -> ${s1.servedToday}`);
    expect(s1.money > s0.money, 'money did not grow');
    expect(s1.customers.find((c) => c.id === ready.id)?.state === 'leaving', 'customer did not leave');
    await p5.close();
    async function frames5() {
        await p5.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
});

await check('day summary and continue', async () => {
    const p6 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p6.goto(new URL('?manual', base).href);
    await p6.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await start(p6);
    const st = async () => JSON.parse(await p6.evaluate(() => window.render_game_to_text()));
    await p6.evaluate(() => window.advanceTime(240000)); // a whole day at 1x
    const s0 = await st();
    expect(s0.summary && s0.paused && s0.day === 1, `no summary at closing: ${JSON.stringify({ day: s0.day, summary: s0.summary })}`);
    // the card's layout depends on fonts: tap down the centre line until "Continua" answers
    for (let y = 590; y > 100 && (await st()).summary; y -= 8) {
        await p6.mouse.click(400, y);
        await p6.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    const s1 = await st();
    expect(!s1.summary && s1.day === 2 && !s1.paused, `continue failed: ${JSON.stringify({ day: s1.day, paused: s1.paused })}`);
    expect(s1.money === s0.money, 'tapping the card changed the shop');
    await p6.close();
});

await check('restart after the level ends', async () => {
    const p7 = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await p7.goto(new URL('?manual', base).href);
    await p7.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await start(p7);
    const st = async () => JSON.parse(await p7.evaluate(() => window.render_game_to_text()));
    await p7.evaluate(() => window.dispatch({ type: 'buildRoom', room: 'sala_vendita', x: 0, y: 0, w: 3, h: 3 }));
    for (let d = 0; d < 10 && !(await st()).outcome; d++) {
        await p7.evaluate(() => window.dispatch({ type: 'continue' }));
        await p7.evaluate(() => window.advanceTime(240000));
    }
    expect((await st()).outcome?.win === false, 'empty shop should lose when time is up');
    for (let y = 590; y > 100 && (await st()).outcome; y -= 8) {
        await p7.mouse.click(400, y);
        await p7.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    const s1 = await st();
    expect(!s1.outcome && s1.day === 1 && s1.rooms.length === 0, `not restarted: ${JSON.stringify({ day: s1.day, rooms: s1.rooms.length })}`);
    await p7.close();
});

// milestone 11: ?manual&save shows the menu and uses localStorage (plain ?manual skips both)
const ps = await browser.newPage({ viewport: { width: 800, height: 600 } });
const menuOf = () => ps.evaluate(() => window.menuState());
const stS = async () => JSON.parse(await ps.evaluate(() => window.render_game_to_text()));
/** Tap down the centre line (from the top or the bottom) until the menu changes. */
async function tapMenu(fromTop) {
    const m0 = await menuOf();
    for (let i = 0; i < 70 && (await menuOf()) === m0; i++) {
        await ps.mouse.click(400, fromTop ? 100 + i * 8 : 590 - i * 8);
        await ps.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    return menuOf();
}
const openSaved = async () => {
    await ps.goto(new URL('?manual&save', base).href);
    await ps.waitForFunction(() => typeof window.menuState === 'function');
    await ps.waitForTimeout(300);
};

const openLevel1 = async () => {
    expect((await tapMenu(false)) === 'levels', 'Campagna did not open the levels');
    expect((await tapMenu(true)) === 'briefing', 'level 1 did not open the briefing');
    expect((await tapMenu(false)) === null, 'Inizia did not close the briefing');
};

await check('save survives reload', async () => {
    await openSaved();
    expect((await menuOf()) === 'start', `no start menu: ${await menuOf()}`);
    await openLevel1();
    expect((await stS()).level === 1, 'not level 1');
    const r = await ps.evaluate(() => window.dispatch({ type: 'placeObject', object: 'scaffale', x: 5, y: 4, category: 'Pasta' }));
    expect(r.ok, `place failed: ${r.reason}`);
    await start(ps);
    await ps.evaluate(() => window.advanceTime(20000));
    await ps.waitForTimeout(3500); // autosave
    const s0 = await stS();
    await openSaved();
    expect((await menuOf()) === 'start', 'no start menu after reload');
    expect((await tapMenu(true)) === null, 'Continua did not close the menu');
    const s1 = await stS();
    expect(s1.level === 1 && s1.objects.length === 2 && s1.money === s0.money && s1.clockSec === s0.clockSec, `not restored: ${JSON.stringify([s1.objects.length, s1.money, s1.clockSec, s0.clockSec])}`);
    expect(s1.paused, 'a loaded game should start paused');
});

await check('menu continue and new game', async () => {
    await openSaved();
    await openLevel1();
    expect((await stS()).objects.length === 1, 'new level 1 is not just the door');
    await ps.waitForTimeout(3500);
    await openSaved();
    await tapMenu(true); // with a fresh save Continua is there again, and it is the bare shop
    expect((await stS()).objects.length === 1, 'the new level did not overwrite the save');
});

await check('campaign: a win opens the next level, the free shop after level 3', async () => {
    await openSaved();
    await openLevel1();
    // a saved level 1 a moment before closing, goals already met
    const s = { ...(await stS()), money: 9000, reputation: 90, servedTotal: 999, clockSec: 20 * 3600 - 18, paused: true };
    // written when the page is left, after the game's own autosave (pagehide, then visibilitychange)
    await ps.evaluate((j) => {
        const put = () => localStorage.setItem('supermercatino-save', j);
        addEventListener('pagehide', put);
        document.addEventListener('visibilitychange', put);
    }, JSON.stringify({ v: 1, s }));
    await openSaved();
    expect((await tapMenu(true)) === null, 'Continua did not close the menu');
    await start(ps);
    await ps.evaluate(() => window.advanceTime(1000));
    { const w = await stS(); expect(w.outcome?.win, `no win: ${JSON.stringify([w.outcome, w.summary, w.clockSec, w.paused, w.money])}`); }
    expect((await tapMenu(true)) === 'briefing', 'Livello successivo did not open the briefing');
    expect((await stS()).level === 2, 'not level 2');
    expect(JSON.parse(await ps.evaluate(() => localStorage.getItem('supermercatino-campagna'))).won.includes(1), 'win not saved');
    await ps.evaluate(() => localStorage.setItem('supermercatino-campagna', '{"won":[1,2,3]}'));
    await openSaved();
    expect((await tapMenu(false)) === 'briefing', 'Negozio libero did not open the briefing');
    const f = await stS();
    expect(f.level === 0 && f.rooms.length === 0, 'free shop is not the empty lot');
});
await ps.close();

await check('long press on an object: move, rotate, remove', async () => {
    const pl = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await pl.goto(new URL('?manual', base).href);
    await pl.waitForFunction(() => typeof window.hudButtons === 'function');
    await pl.waitForTimeout(200);
    const st = async () => JSON.parse(await pl.evaluate(() => window.render_game_to_text()));
    const run = (c) => pl.evaluate((x) => window.dispatch(x), c);
    expect((await run({ type: 'buildRoom', room: 'sala_vendita', x: 8, y: 8, w: 4, h: 4 })).ok, 'room');
    expect((await run({ type: 'placeObject', object: 'scaffale', x: 9, y: 9, category: 'Pasta' })).ok, 'shelf');
    const at = (x, y) => pl.evaluate(([a, b]) => window.cellToScreen(a, b), [x, y]);
    const frames = () => pl.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const hold = async (x, y) => {
        const p = await at(x, y);
        await pl.mouse.move(p.x, p.y);
        await pl.mouse.down();
        await pl.waitForTimeout(700);
        await pl.mouse.up();
        await frames();
    };
    const tap = async (label) => {
        const b = (await pl.evaluate(() => window.hudButtons())).find((x) => x.label === label);
        expect(b, `no ${label}: ${JSON.stringify(await pl.evaluate(() => window.hudButtons().map((x) => x.label)))}`);
        await pl.mouse.click(b.x, b.y);
        await frames();
    };
    // playtest 2026-11-27: a plain tap on furniture picks it up; taps move it, ✓ puts it down
    const click = async (x, y) => { const p = await at(x, y); await pl.mouse.click(p.x, p.y); await frames(); };
    await click(9, 9);
    await tap('🔄');
    expect((await st()).objects[0].rot === 1, 'not rotated');
    const money = (await st()).money;
    await click(10, 10);
    await click(10, 9);
    const s1 = await st();
    expect(s1.objects[0].x === 10 && s1.objects[0].y === 9 && s1.money === money, `not moved twice: ${JSON.stringify(s1.objects)}`);
    await tap('✓');
    expect(!(await pl.evaluate(() => window.hudButtons())).some((b) => b.label === '🗑'), 'editor still open after ✓');
    await click(10, 9);
    await tap('✓');
    expect((await st()).objects[0].x === 10, 'a tap and ✓ moved it');
    await hold(10, 9);
    await tap('🗑');
    expect((await st()).objects.length === 0, 'not removed');
    // free shop: an empty room's long press offers only 🗑
    await hold(9, 9);
    const labels = (await pl.evaluate(() => window.hudButtons())).map((b) => b.label);
    expect(labels.includes('🗑') && !labels.includes('✓') && !labels.includes('🔄'), `room editor: ${labels}`);
    await tap('🗑');
    expect((await st()).rooms.length === 0, 'room not removed');
    await pl.close();
});

await check('tap a worker: their card, fire from it', async () => {
    const pw = await browser.newPage({ viewport: { width: 800, height: 600 } });
    pw.on('pageerror', (e) => errors.push(e.message));
    await pw.goto(new URL('?manual', base).href);
    await pw.waitForFunction(() => typeof window.hudButtons === 'function');
    await pw.waitForTimeout(200);
    const st = async () => JSON.parse(await pw.evaluate(() => window.render_game_to_text()));
    const run = (c) => pw.evaluate((x) => window.dispatch(x), c);
    for (const c of [{ type: 'buildRoom', room: 'sala_vendita', x: 6, y: 6, w: 4, h: 4 }, { type: 'placeObject', object: 'porta', x: 9, y: 7 }])
        expect((await run(c)).ok, JSON.stringify(c));
    expect((await run({ type: 'hire', candidateId: (await st()).candidates.find((c) => c.role === 'magazziniere').id })).ok, 'hire');
    const m = (await st()).staff[0];
    const p = await pw.evaluate(([x, y]) => window.cellToScreen(x, y), [m.x, m.y]);
    await pw.mouse.click(p.x, p.y - 20 * p.zoom); // on the body, above the feet
    await pw.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const texts = await pw.evaluate(() => window.hudText());
    expect(texts.includes(m.name) && texts.includes('⚡ Energia'), `no card: ${texts}`);
    const fire = (await pw.evaluate(() => window.hudButtons())).find((b) => b.label.includes('Licenzia'));
    expect(fire, 'no Licenzia');
    await pw.mouse.click(fire.x, fire.y);
    await pw.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    expect((await st()).staff.length === 0, 'not fired');
    expect(!(await pw.evaluate(() => window.hudText())).includes('⚡ Energia'), 'card still open');
    await pw.close();
});

// milestone 21: grouped bottom bar on a phone, upright and sideways
for (const [w, h] of [[390, 844], [844, 390]]) await check(`phone ${w}x${h}: grouped bar on one row, level items only, goal bars`, async () => {
    const pp = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    pp.on('pageerror', (e) => errors.push(e.message));
    const btns = () => pp.evaluate(() => window.hudButtons());
    const tap = async (label) => {
        const b = (await btns()).find((x) => x.label.startsWith(label));
        expect(b, `no ${label} button`);
        await pp.mouse.click(b.x, b.y);
        await pp.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    const oneRow = async (labels) => {
        const g = (await btns()).filter((b) => labels.includes(b.label));
        expect(g.length === labels.length, `groups: ${JSON.stringify(g.map((b) => b.label))}`);
        expect(g.every((b) => b.y === g[0].y), `groups on more rows: ${JSON.stringify(g)}`);
        expect(g.every((b) => b.x + b.w / 2 <= w && b.x - b.w / 2 >= 0), `groups off screen: ${JSON.stringify(g)}`);
    };
    // free shop (plain ?manual): five groups
    await pp.goto(new URL('?manual', base).href);
    await pp.waitForFunction(() => typeof window.hudButtons === 'function');
    await pp.waitForTimeout(200);
    await oneRow(['Costruisci', 'Staff', 'Merce']);
    const gear = (await btns()).find((b) => b.label === '⚙');
    expect(gear && gear.x + gear.w / 2 <= w && gear.x > w * 0.8 && gear.y < 40, `gear not top right: ${JSON.stringify(gear)}`);
    // level 1: no Merce, Arredi holds only the shelf and the till
    await pp.goto(new URL('?manual&save', base).href);
    await pp.waitForFunction(() => typeof window.menuState === 'function');
    await pp.evaluate(() => localStorage.clear());
    await pp.reload();
    await pp.waitForFunction(() => typeof window.menuState === 'function');
    await pp.waitForTimeout(200);
    for (const [fromTop, want] of [[false, 'levels'], [true, 'briefing'], [false, null]]) {
        const m0 = await pp.evaluate(() => window.menuState());
        for (let i = 0; i < 100 && (await pp.evaluate(() => window.menuState())) === m0; i++) {
            await pp.mouse.click(fromTop ? w * 0.3 : w / 2, fromTop ? 60 + i * 6 : h - 10 - i * 6); // left column: levels go two-across in landscape
            await pp.waitForTimeout(20);
        }
        expect((await pp.evaluate(() => window.menuState())) === want, `menu ${want}`);
    }
    await oneRow(['Arredi', 'Staff']);
    expect(!(await btns()).some((b) => b.label === 'Merce'), 'Merce in level 1');
    await tap('Arredi');
    const items = (await btns()).filter((b) => b.label.includes('€')).map((b) => b.label);
    expect(JSON.stringify(items) === JSON.stringify(['Scaffale €150', 'Cassa €400']), `level 1 items: ${items}`);
    await tap('Scaffale');
    const s = JSON.parse(await pp.evaluate(() => window.render_game_to_text()));
    const sala = s.rooms.find((r) => r.type === 'sala_vendita');
    const at = await pp.evaluate(([x, y]) => window.cellToScreen(x, y), [sala.x + 2, sala.y + 2]);
    await pp.mouse.click(at.x, at.y);
    await pp.waitForTimeout(50);
    await tap('✓');
    const s1 = JSON.parse(await pp.evaluate(() => window.render_game_to_text()));
    expect(s1.objects.some((o) => o.type === 'scaffale'), 'shelf not placed with a tap and ✓');
    const texts = await pp.evaluate(() => window.hudText());
    const eur = (n) => `€${n.toLocaleString('it-IT')}`;
    expect(texts.includes(`${eur(s1.money)} / ${eur(700)}`), `money bar: ${texts}`);
    expect(texts.includes(`Serviti ${s1.servedTotal} / 30`) && texts.includes(`Rep ${s1.reputation}% / 45%`), `goal bars: ${texts}`);
    expect(texts.some((x) => x.startsWith('Metti un altro scaffale')), `guide did not move on: ${texts}`);
    const shot = await pp.screenshot({ path: `output/21-test-${w}x${h}.png` });
    // milestone 21b: no empty background left in the frame (the old dark brown #2b1d16)
    const empty = await pp.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height });
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 43) + Math.abs(d[i + 1] - 29) + Math.abs(d[i + 2] - 22) < 12) n++;
        return n / (d.length / 4);
    }, 'data:image/png;base64,' + shot.toString('base64'));
    expect(empty < 0.002, `empty background: ${(empty * 100).toFixed(2)}% of the screen`);
    await pp.close();
});

await page.waitForTimeout(10000); // let the game run a while
await check('audio starts on a tap and the mute button sticks', async () => {
    const pa = await browser.newPage({ viewport: { width: 800, height: 600 } });
    pa.on('pageerror', (e) => errors.push(e.message));
    const open = async () => {
        await pa.goto(new URL('?manual', base).href);
        await pa.waitForFunction(() => typeof window.audioState === 'function' && typeof window.render_game_to_text === 'function');
    };
    const audio = () => pa.evaluate(() => window.audioState());
    await open();
    expect(!(await audio()).started && !(await audio()).muted, 'audio should wait for a gesture, unmuted');
    // ⚙ menu: Audio, Continua, Nuova partita
    const menu = () => pa.evaluate(() => window.menuState());
    const paused = async () => JSON.parse(await pa.evaluate(() => window.render_game_to_text())).paused;
    const wasPaused = await paused();
    for (const label of ['⚙', 'Audio: sì']) {
        const b = (await pa.evaluate(() => window.hudButtons())).find((x) => x.label === label);
        expect(b, `no ${label} button`);
        await pa.mouse.click(b.x, b.y);
        await pa.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    expect((await audio()).started, 'no audio context after a tap');
    expect((await audio()).muted, 'Audio button not found');
    expect((await menu()) === 'pausa' && (await paused()), 'menu open, game paused');
    const tapL = async (label) => {
        const b = (await pa.evaluate(() => window.hudButtons())).find((x) => x.label === label);
        expect(b, `no ${label}`);
        await pa.mouse.click(b.x, b.y);
        await pa.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    await tapL('Continua');
    expect((await menu()) === null && (await paused()) === wasPaused, 'Continua: menu closed, pause restored');
    await tapL('⚙');
    await tapL('Nuova partita');
    expect((await menu()) === 'start', 'Nuova partita: start menu');
    await open();
    expect((await audio()).muted, 'mute forgotten after reload');
    await pa.evaluate(() => window.advanceTime(60000)); // events while muted: nothing breaks
    await pa.close();
});

await check('no console errors', async () => {
    expect(errors.length === 0, errors.join(' | '));
});

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
