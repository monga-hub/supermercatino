# Milestone 19: Guardia e capo reparto

## Status

implemented (in attesa di playtest)

## Objective

Completare la curva di ADR-0002: all'inizio si tocca tutto, poi si paga per automatizzare. La guardia ferma i furbetti da sola, il capo reparto fa i tocchi su scaffali, casse, macchie e carrelli.

## Scope

- Ruolo `guardia`: sta vicino alle casse e becca da sola i furbetti in un raggio (stessa resa del tocco, senza mancia di reputazione extra o con metà bonus: da tarare).
- Ruolo `capo reparto` (caro): ogni pochi secondi fa da solo il tocco più urgente (scaffale quasi vuoto, conto pronto, macchia, carrello). I tocchi del giocatore restano possibili e più rapidi.
- Pannello Staff: i nuovi ruoli tra i candidati.
- Sprite Gemini: guardia (divisa anni '80, cappello) e capo reparto (camicia, cravatta, cartellina), 3×2 come gli altri.

## Out of scope

- Telecamere, potenziamenti acquistabili, alberi di abilità.

## Dependencies

- **Depends on:** 15 (furbetto), 05b (tocchi), 18 (pause dello staff)
- **Blocks:** nessuno

## Acceptance criteria

- [x] La guardia vicino alle casse becca il furbetto senza tocco — test: `tests/automation.test.ts`
- [x] Il capo reparto mette in coda scaffali, conti, macchie e carrelli come i tocchi — test: `tests/automation.test.ts`
- [x] Senza tocchi ma con guardia e capo reparto il livello si vince entro 5 giorni (con i tocchi prima) — `output/balance.ts`
- [x] Frame dei due nuovi ruoli nel kit — test: `tests/assets.test.ts`
- [ ] Assumere il capo reparto si sente come un sollievo, non come un obbligo — verified by user playtest

## Exit condition

L'utente assume guardia e capo reparto, smette di toccare e vede il negozio andare avanti da solo, un po' peggio che con i suoi tocchi.

## Test plan

- Test rossi: `tests/automation.test.ts`, poi assets.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Guardia (`guardia`): si mette accanto alla cassa più vicina e becca i furbetti entro 3 celle (`GUARD_RADIUS`). Il furbetto paga, ma la reputazione sale di 1 invece di `FURB_REP_GAIN` (3): il tocco resta più conveniente. Costa 15 €/giorno meno del suo tratto.
- Capo reparto (`capo`): accanto alla cassa, ogni `BOSS_EVERY_SEC` (1,5 s reali, diviso il ritmo: più lento se stanco o chiacchierone) fa un tocco con `bossTap`: conto pronto (con la mancia), macchia, scaffale sotto 5 (il più vuoto), carrello. Usa `check`/`apply` come il giocatore, quindi le stesse regole (serve il magazziniere per scaffali e carrelli, l'addetto per le macchie). Costa 20 €/giorno più del suo tratto.
- Sprite Gemini `guardia.jpg` e `capo.jpg` 3×2 (chat nuove): camminata ×3; guardia ferma / fischia / alt col braccio; capo fermo / scrive / indica. Il capo indica appena ha fatto un tocco, la guardia fa alt e poi fischia dopo una cattura.
- Salvataggi vecchi: `loadGame` riempie i candidati dei nuovi ruoli.
- Bilanciamento (`output/balance.ts`, ora 8 semi per configurazione): l'obiettivo del livello 1 a €2800/70%/350 era tarato su un solo seme fortunato e con altri semi nessuna configurazione vinceva. Nuovi obiettivi: **€1500, reputazione 60%, 270 serviti**. Risultati: tocchi con banco salumi 8/8 (giorno 4–5); tocchi con tutto e 2 cestini 8/8 (giorno 3–4); senza tocchi ma con guardia e capo 5/8 (giorno 5); senza tocchi né automazione 0/8.
