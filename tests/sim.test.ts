import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createState, advance, setSpeed, togglePause } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { DAY_OPEN_MIN, DAY_CLOSE_MIN, GAME_MIN_PER_SEC } from '../src/sim/config.ts';

test('state is JSON-serializable', () => {
    const s = createState();
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('level starts paused', () => {
    const s = createState();
    assert.equal(s.paused, true);
    const t0 = s.clockSec;
    advance(s, 10_000);
    assert.equal(s.clockSec, t0, 'time stands still while building');
    setSpeed(s, 1);
    assert.equal(s.paused, false);
});

test('clock advances with speed and stops on pause', () => {
    const s = createState();
    setSpeed(s, 1);
    const t0 = s.clockSec;
    advance(s, 10_000); // 10 real seconds at 1x
    assert.equal(s.clockSec - t0, 10 * GAME_MIN_PER_SEC * 60);

    setSpeed(s, 2);
    const t1 = s.clockSec;
    advance(s, 10_000);
    assert.equal(s.clockSec - t1, 20 * GAME_MIN_PER_SEC * 60);

    setSpeed(s, 3);
    const t2 = s.clockSec;
    advance(s, 10_000);
    assert.equal(s.clockSec - t2, 30 * GAME_MIN_PER_SEC * 60);

    togglePause(s);
    const t3 = s.clockSec;
    advance(s, 10_000);
    assert.equal(s.clockSec, t3);
    assert.equal(s.paused, true);

    setSpeed(s, 1); // choosing a speed resumes
    assert.equal(s.paused, false);
});

test('day rolls over at closing time', () => {
    const s = createState();
    setSpeed(s, 1);
    assert.equal(s.day, 1);
    assert.equal(s.clockSec, DAY_OPEN_MIN * 60);
    const dayRealMs = ((DAY_CLOSE_MIN - DAY_OPEN_MIN) / GAME_MIN_PER_SEC) * 1000;
    advance(s, dayRealMs);
    assert.ok(s.summary, 'closing summary'); // milestone 06: the day waits for the player
    assert.equal(apply(s, { type: 'continue' }).ok, true);
    assert.equal(s.day, 2);
    assert.equal(s.clockSec, DAY_OPEN_MIN * 60);
});

test('sim does not import phaser', () => {
    const dir = new URL('../src/sim/', import.meta.url);
    for (const f of readdirSync(dir)) {
        const src = readFileSync(new URL(f, dir), 'utf8');
        assert.doesNotMatch(src, /from\s+['"]phaser/, `${f} imports phaser`);
    }
});
