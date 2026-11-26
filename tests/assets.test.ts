import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATEGORIES } from '../src/sim/config.ts';
import { SPRITES, PEOPLE_FRAMES, WALL_FRAMES, ICON_FRAMES, SPILL_FRAMES } from '../src/render/sprites.ts';

const kit = JSON.parse(readFileSync(new URL('../public/assets/kit.json', import.meta.url), 'utf8'));
const has = (frames: string[]) => { for (const f of frames) assert.ok(kit.frames[f], `missing frame ${f}`); };

test('every drawable has a frame: furniture', () => {
    has([...WALL_FRAMES, ...ICON_FRAMES, ...SPILL_FRAMES, SPRITES.cestino, SPRITES.bancone, SPRITES.banconeVuoto, SPRITES.cassa, SPRITES.scaffale, ...CATEGORIES.map((c) => SPRITES.shelf(c))]);
});

test('every drawable has a frame: people', () => {
    has(PEOPLE_FRAMES);
});
