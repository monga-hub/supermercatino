# ADR 0001: Engine, linguaggio, stile grafico e separazione sim/render

## Status

accepted

## Date

2026-11-26

## Context

Gestionale tipo Theme Hospital ambientato in un supermercato italiano. Requisiti emersi nella fase idea: gioco nel browser (itch.io), input mouse+tastiera e touch, vista isometrica 2D con sprite dipinti generati con AI, audio (muzak + annunci), livelli da 15–20 minuti, test automatici, possibile componente online in futuro. L'utente ha esperienza con simulatori HTML/JS a file singolo, non con motori di gioco.

## Decision

Phaser + Vite + TypeScript, creato con lo scaffolder ufficiale `npm create @phaserjs/game@latest`. Vista isometrica 2D con sprite dipinti (palette calda anni '80-'90). La simulazione vive in `src/sim` come TypeScript puro senza Phaser, con stato serializzabile in JSON e `tick(state, dt)` a passo fisso; Phaser fa solo rendering e input. Test: `node --test` sulla sim + test browser Playwright tramite `render_game_to_text()` / `advanceTime()`.

## Consequences

### Positive

- Phaser dà già camera, input touch/pointer, sprite, audio e scene: meno codice nostro.
- Sim pura = testabile senza browser, salvataggio locale gratis (JSON), base pronta per classifiche/online futuri.
- Isometria via formula, nessun plugin.

### Negative

- Sprite dipinti AI richiedono disciplina di coerenza (stesso angolo/luce) e ordinamento di profondità corretto.
- Separazione sim/render impone di non mettere logica nelle scene Phaser.
- TypeScript aggiunge un passo di build (gestito da Vite).

## Alternatives considered

- **PixiJS:** solo rendering; scene, input e UI da scrivere a mano. Più codice per lo stesso risultato.
- **Canvas puro in un file HTML:** coerente con i simulatori dell'utente, ma camera/input/sprite/audio tutti a mano; non scala per un gestionale.
- **3D low-poly / pixel art:** scartati dall'utente a favore di iso 2D dipinto.

## Related

- `docs/gameplan.md`, `docs/tech.md`
