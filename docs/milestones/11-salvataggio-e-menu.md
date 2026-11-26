# Milestone 11: Salvataggio e menu

## Status

implemented — in attesa del playtest dell'utente

## Objective

Il livello dura 15–20 minuti e l'utente gioca dal telefono: ricaricare la pagina o chiudere il browser non deve far perdere la partita. Il gioco si salva da solo; all'apertura un menu iniziale offre "Continua" o "Nuova partita", e una nuova partita mostra prima un briefing con gli obiettivi del livello.

## Scope

- **Salvataggio:** `src/sim/save.ts` puro: `saveGame(s)` → stringa JSON con versione, `loadGame(text)` → stato o `null` se corrotto o di un'altra versione. Lo stato sim è già serializzabile (ADR-0001).
- **Quando:** `Game` salva in `localStorage` ogni pochi secondi reali e quando la pagina va in background (`visibilitychange`/`pagehide`). A livello finito (vinto o perso) il salvataggio si cancella.
- **Ripresa:** caricata una partita, il gioco riparte in pausa.
- **Menu iniziale:** titolo "Il Supermercatino", bottoni "Continua" (solo se c'è un salvataggio) e "Nuova partita". Nuova partita sovrascrive il salvataggio.
- **Briefing:** card con gli obiettivi del livello (soldi, reputazione, clienti serviti, giorni) e un bottone "Inizia".
- `?manual` (test browser) salta menu e briefing e non legge né scrive il salvataggio, tranne con `?manual&save`.

## Out of scope

- Più slot di salvataggio, cloud, più livelli/campagna.

## Dependencies

- **Depends on:** 06, 08
- **Blocks:** nessuno

## Acceptance criteria

- [x] Salvare e ricaricare dà lo stesso stato, e la simulazione prosegue identica — test: `tests/save.test.ts`
- [x] Un salvataggio corrotto o di un'altra versione viene ignorato — test: `tests/save.test.ts`
- [x] Ricaricando la pagina il negozio torna com'era (stanze, soldi, ora) — test browser `save survives reload`
- [x] Il menu mostra "Continua" solo se c'è un salvataggio; "Nuova partita" riparte da zero col briefing — test browser `menu continue and new game`
- [ ] Menu e briefing leggibili su telefono — verified by user playtest

## Exit condition

L'utente gioca mezza giornata, chiude la pagina, la riapre: tocca "Continua" e ritrova il negozio com'era, in pausa. Con "Nuova partita" vede gli obiettivi e riparte da un lotto vuoto.

## Test plan

- Test rossi: `tests/save.test.ts`, poi i test browser.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Salvataggio ogni 3 s reali, dopo ogni comando riuscito e quando la pagina va in background; mai mentre il menu iniziale offre ancora la partita vecchia.
- `loadGame` rifiuta anche un salvataggio a cui manca un campo di `createState()`: aggiungere campi allo stato invalida i salvataggi vecchi senza dover cambiare versione.
- Screenshot: `output/shots-11.mjs`.
