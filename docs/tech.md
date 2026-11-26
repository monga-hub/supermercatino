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
- **Testing:** `npm test` (= `node --test`, logica pura: simulazione, economia, pathfinding; file `tests/*.test.ts`) + `npm run test:browser` (Playwright, `scripts/browser-test.mjs`, richiede dev server attivo) che usa gli hook `window.render_game_to_text()` e `window.advanceTime(ms)`. Lo script browser apre il gioco con `?manual` (la sim non avanza in tempo reale, solo con `advanceTime`) ed esegue controlli nominati; accetta un URL come argomento (es. build di produzione con `vite preview`).
- **Linting / formatting:** il template non ne fornisce; type-check con `npx tsc --noEmit`.
- **Deploy:** GitHub Actions `.github/workflows/deploy.yml`: a ogni push su `main` esegue `npm test`, `npm run build-nolog` e pubblica `dist/` su GitHub Pages (https://monga-hub.github.io/supermercatino/). `base: './'` in Vite rende i percorsi relativi.
- **Asset / binary storage:** Git LFS no (per ora). Sprite AI in `public/assets/`.

## Project layout

`src/main.ts` → `src/game/main.ts` (config Phaser, scala `RESIZE` a tutto schermo) → scene `Game` (pavimento iso, camera, guida la sim, hook) e `Hud` (overlay con camera propria: orologio, velocità). `vite/config.{dev,prod}.mjs`, `index.html`, `public/`. Le cartelle nascono quando servono:

```
src/
  game/       # entry Phaser (main.ts) + scenes/ (Game, Hud)
  sim/        # TS puro, niente Phaser: state.ts (stato, tick), config.ts, build.ts (comandi), path.ts (A*), customers.ts
  render/     # iso.ts (griglia↔iso), draw.ts (disegno placeholder: tile, box, colori)
public/assets # sprite dipinti, audio
tests/      # node --test (sim)
scripts/    # browser-test.mjs (Playwright)
docs/
```

## Conventions

- **Separazione sim/render (vincolante, ADR-0001):** `src/sim` non importa Phaser. Stato = oggetto serializzabile in JSON. Avanza con `tick(state)` a passo fisso (`STEP_MS`); la velocità esegue più passi, non passi più lunghi; `advance(state, realMs)` per avanzare di tempo reale. Phaser legge lo stato e disegna.
- **Hook per agenti/test (obbligatori dal milestone 01):** `window.render_game_to_text()` restituisce lo stato sim in JSON; `window.advanceTime(ms)` avanza la sim di tick fissi in modo deterministico. Sono la base del loop live-iterate e di `scripts/browser-test.mjs`. Dal milestone 02 anche `window.dispatch(cmd)` (esegue un comando sim, restituisce `{ ok, cost }` o `{ ok: false, reason }`) e `window.selectTool(tool)` (strumento di costruzione come dalla barra).
- **Comandi come dati:** ogni azione del giocatore sulla sim è un oggetto `Command` (`src/sim/build.ts`): `check` valida senza modificare, `apply` valida ed esegue. UI, test e agenti usano lo stesso ingresso.
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
