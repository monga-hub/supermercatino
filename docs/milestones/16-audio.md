# Milestone 16: Audio

## Status

implemented (in attesa di playtest)

## Objective

Il supermercato si sente: musichetta anni '80 in sottofondo, bip della cassa, yogurt che cade e annunci comici all'altoparlante.

## Scope

- Muzak in loop, SFX (bip cassa, incasso, rovescio, carrello, orso contento), annunci all'altoparlante su eventi (cassa aperta, ispettore, chiusura).
- Tasto audio sì/no nell'HUD (ricordato nel salvataggio delle preferenze). Sul telefono l'audio parte al primo tocco (regola dei browser).
- Fonte dei suoni (decisa con l'utente il 2026-11-26): tutto sintetizzato, nessun file. Effetti e muzak con Web Audio, annunci con la voce italiana del telefono (`speechSynthesis`) preceduti da un din-don.

## Out of scope

- Musica diversa per livello, doppiaggio dei personaggi.

## Dependencies

- **Depends on:** 11 (menu), 12–14 (eventi da far suonare)
- **Blocks:** nessuno

## Acceptance criteria

- [x] Gli eventi del sim fanno partire il suono giusto — test: `tests/audio.test.ts` (mappa evento → suono, pura)
- [x] Il tasto audio spegne e riaccende tutto e resta dopo il ricaricamento — test: `scripts/browser-test.mjs`
- [x] L'audio parte al primo tocco senza errori in console (niente file da caricare) — test: `scripts/browser-test.mjs`
- [ ] L'atmosfera è da supermercato anni '80 — verified by user playtest

## Exit condition

L'utente gioca sul telefono e sente la musichetta, il bip a ogni incasso e un annuncio comico; con il tasto spegne tutto.

## Test plan

- Test rossi: `tests/audio.test.ts`, poi browser.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- `src/audio/cues.ts` (puro): confronta due istantanee del sim e dà suoni (`bip` vendita, `splat` macchia, `carrello`, `orso`, `fischio` furbetto beccato, `vittoria`/`sconfitta`) e al massimo un annuncio: esito ispezione, furbetto scappato, nuova cassa aperta, apertura (con avviso ispettore il giorno 3), chiusura tra mezz'ora, offerte comiche alle 11 e alle 17.
- `src/audio/synth.ts`: muzak bossa in Do (Cmaj7–Am7–Dm7–G7, 96 bpm) con accordi, basso e melodia; la musica si abbassa mentre parla l'altoparlante. Un annuncio alla volta. Audio sospeso quando la pagina è in background.
- Tasto "Audio" nell'HUD; la preferenza è in localStorage (`supermercatino-audio`), separata dal salvataggio della partita.
- La voce dipende dal telefono: su iPhone/Android c'è quasi sempre una voce italiana; se manca, il browser usa quella di default.

