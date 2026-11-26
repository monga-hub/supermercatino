# Milestone 06: Fine giornata e obiettivi

## Status

in-progress — automated AC green; waiting for user playtest (a full level on phone)

## Objective

Trasformare la sandbox in un livello vincibile e perdibile da 15–20 minuti. La giornata ha un'apertura e una chiusura vere, a fine giornata si pagano affitto e stipendi e compare un riepilogo; la reputazione decide quanti clienti arrivano; il livello ha obiettivi, vittoria e sconfitta. Chiude il loop del gameplan (Costruisci → Assumi → Rifornisci → Servi → Reagisci → Espandi) con numeri leggibili.

## Scope

- Chiusura: poco prima dell'orario di chiusura smettono gli arrivi; alla chiusura chi è dentro finisce o esce; poi si passa al giorno dopo.
- Fine giornata: affitto giornaliero + stipendi scalati; riepilogo (incasso, spese merce, stipendi, affitto, saldo, serviti, persi, reputazione) che mette in pausa finché il giocatore non tocca *Continua*.
- Reputazione 0–100%: sale per ogni cliente servito, scende per ogni cliente perso; l'intervallo tra arrivi dipende dalla reputazione.
- Livello 1 in `config.ts`: soldi iniziali, durata in giornate, soglie (cassa ≥ €X, reputazione ≥ Y%, clienti serviti ≥ Z). HUD con obiettivi e giorno N/M.
- Vittoria: tutte le soglie raggiunte entro l'ultima giornata. Sconfitta: cassa sotto −€N per K giornate di fila, o reputazione sotto il minimo.
- Schermate di vittoria/sconfitta con *Ricomincia*.

## Out of scope

- Menu iniziale, più livelli/campagna, salvataggio.
- Tipi cliente, imprevisti, audio, sprite AI.

## Dependencies

- **Depends on:** milestone 04, milestone 05
- **Blocks:** milestone sprite AI (da scrivere)

## Acceptance criteria

- [x] Gli arrivi si fermano prima della chiusura e alla chiusura il negozio si svuota — test: `tests/day.test.ts::shop closes at closing time`
- [x] A fine giornata affitto e stipendi sono scalati e il riepilogo riporta i numeri giusti — test: `tests/day.test.ts::day summary adds up`
- [x] Reputazione sale/scende con serviti/persi e cambia la frequenza degli arrivi — test: `tests/day.test.ts::reputation drives arrivals`
- [x] Vittoria quando le soglie sono raggiunte; sconfitta per bancarotta o reputazione minima — test: `tests/day.test.ts::win and lose conditions`
- [x] Nel browser, il riepilogo appare a fine giornata e *Continua* riparte — test: `scripts/browser-test.mjs::day summary and continue`
- [ ] Un livello si gioca in 15–20 minuti ed è vincibile con un negozio ragionevole — verified by user playtest

## Exit condition

L'utente gioca il livello 1 dall'inizio: a ogni chiusura vede il riepilogo della giornata, gestisce soldi e reputazione e arriva alla schermata di vittoria (o di sconfitta se lascia andare la cassa in rosso).

## Test plan

- Test rossi: `tests/day.test.ts`, poi `scripts/browser-test.mjs::day summary and continue`.
- Playtest completo di un livello da telefono; taratura numeri in `config.ts`.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Promuove dal backlog: "Economia giornaliera", "Reputazione → afflusso", "Obiettivi livello, vittoria e sconfitta".
- Numeri (affitto, soglie, durata) provvisori: si tarano col playtest dell'utente.
- Implementato (`config.ts`): livello 5 giornate, soldi iniziali €5.000, affitto €150, obiettivi cassa ≥ €4.000 + reputazione ≥ 70% + 300→350 serviti totali; prezzi di vendita raddoppiati (margine sulla merce). Arrivi ogni 16 min a reputazione 0% → 6 min a 100%; stop arrivi nell'ultima ora. Reputazione +1 servito, −4 perso.
- Simulazione headless (`output/balance.ts`, non versionato): 2 casse + tocchi vince al 4° giorno; 1 cassa senza tocchi perde; 1 cassa con tocchi o 2 casse senza tocchi arrivano vicino ma perdono. Obiettivo cassa sceso da €6.000 a €4.000 perché costruire costa ~€3.000.
- Cambio rispetto allo scope: la sconfitta per reputazione richiede 2 chiusure di fila sotto il 15% (come la bancarotta), altrimenti un negozio minimo perdeva già al primo giorno. Il riepilogo avvisa dopo la prima chiusura brutta.
- Test extra: `scripts/browser-test.mjs::restart after the level ends`.
