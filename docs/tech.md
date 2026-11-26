# Tech stack

## Engine / runtime

- **Engine:** Phaser **4.0.0** (pin del template ufficiale `phaserjs/template-vite-ts`, variante Minimal, scelto via `npm create @phaserjs/game@latest`). Ultima su npm al 2026-11-26: 4.2.1 — aggiornare solo con un motivo.
- **Language(s):** TypeScript
- **Target platforms:** Web (desktop + mobile/touch). Build statica caricabile su itch.io.

## Libraries / frameworks

| Library | Version | Purpose |
|---------|---------|---------|
| Phaser | 4.0.0 | Rendering sprite iso, scene, camera (pan/zoom), input mouse+touch, tween, audio |
| Vite | 6.3.x (TypeScript 5.7) | Dev server + build statica |
| Playwright | 1.65 (Chromium headless) | Test browser: avvia il gioco, avanza il tempo, legge lo stato |

Nessun'altra dipendenza prevista. Pathfinding A* su griglia scritto in casa (piccolo, testabile).

## Tooling

- **Package manager:** npm
- **Build:** Vite. `npm run dev` / `npm run build` (gli script del template lanciano anche `log.js`, ping anonimo a Phaser); `npm run dev-nolog` / `npm run build-nolog` senza ping. Dev server su http://localhost:8080.
- **Testing:** `npm test` (= `node --test`, logica pura: simulazione, economia, pathfinding; file `tests/*.test.ts`) + `npm run test:browser` (Playwright, `scripts/browser-test.mjs`, richiede dev server attivo) che usa gli hook `window.render_game_to_text()` e `window.advanceTime(ms)`. Oggi lo script browser fa solo smoke (canvas presente, zero errori console).
- **Linting / formatting:** il template non ne fornisce; type-check con `npx tsc --noEmit`.
- **Asset / binary storage:** Git LFS no (per ora). Sprite AI in `public/assets/`.

## Project layout

Stato dopo lo scaffold: `src/main.ts` → `src/game/main.ts` (config Phaser) → `src/game/scenes/Game.ts` (scena del template, da sostituire). `vite/config.{dev,prod}.mjs`, `index.html`, `public/`. Le cartelle sotto nascono quando servono:

```
src/
  game/       # entry Phaser (main.ts) + scenes/
  sim/        # simulazione pura TS, niente Phaser: griglia, stanze, clienti, staff, economia, tick
  render/     # conversione coordinate griglia↔iso, sprite, camera
public/assets # sprite dipinti, audio
tests/      # node --test (sim)
scripts/    # browser-test.mjs (Playwright)
docs/
```

## Conventions

- **Separazione sim/render (vincolante, ADR-0001):** `src/sim` non importa Phaser. Stato = oggetto serializzabile in JSON. Avanza con `tick(state, dt)` a passo fisso. Phaser legge lo stato e disegna.
- **Hook per agenti/test (obbligatori dal milestone 01):** `window.render_game_to_text()` restituisce lo stato sim in JSON; `window.advanceTime(ms)` avanza la sim di tick fissi in modo deterministico. Sono la base del loop live-iterate e di `scripts/browser-test.mjs`.
- **Code naming:** camelCase variabili/funzioni, PascalCase classi/tipi, kebab-case file asset.
- **Termini di dominio in italiano** nei dati di gioco (categorie, ruoli, tipi cliente); codice in inglese.
- **Numeri di bilanciamento** (prezzi, stipendi, velocità, soglie) in un unico modulo `src/sim/config.ts`, mai sparsi nella logica: si tarano in playtest.
- **State machines:** clienti e staff come piccola macchina a stati con campo `state` stringa nello stato sim.
- **Asset naming:** `<tipo>-<nome>[-<direzione>].png` (es. `obj-scaffale-ne.png`, `npc-nonna-sw.png`).

## Out-of-scope dependencies

- Nessuna libreria ECS: la sim è semplice abbastanza con array di entità.
- Nessun plugin isometrico Phaser: conversione griglia→iso è una formula.
- Nessun framework UI (React ecc.): HUD in Phaser.
- Nessun backend/rete per ora: "online più avanti" si appoggia allo stato serializzabile.
