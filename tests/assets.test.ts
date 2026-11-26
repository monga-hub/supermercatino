import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { CATEGORIES } from '../src/sim/config.ts';
import { SPRITES } from '../src/render/sprites.ts';

const kit = JSON.parse(readFileSync(new URL('../public/assets/kit.json', import.meta.url), 'utf8'));
const has = (frames: string[]) => { for (const f of frames) assert.ok(kit.frames[f], `missing frame ${f}`); };

test('every drawable has a frame: furniture', () => {
    has([SPRITES.porta, SPRITES.cassa, SPRITES.scaffale, ...CATEGORIES.map((c) => SPRITES.shelf(c))]);
});

// todo until art/sheets/personaggi.jpg exists (Gemini image generation overloaded on 2026-11-26)
test('every drawable has a frame: people', { todo: !existsSync(new URL('../art/sheets/personaggi.jpg', import.meta.url)) }, () => {
    has([SPRITES.cliente, SPRITES.clienteArrabbiato, SPRITES.cassiere, SPRITES.cassiereSeduto,
        SPRITES.magazziniere, SPRITES.magazziniereScatolone]);
});
