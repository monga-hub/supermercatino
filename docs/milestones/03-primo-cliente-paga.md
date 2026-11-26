# Milestone 03: Primo cliente paga

## Status

done (2026-11-26) — utente ha dato l'ok passando al punto successivo

## Objective

Chiudere il primo loop giocabile: costruisco → i clienti entrano, comprano, fanno la fila, pagano → la cassa sale; se il negozio è fatto male se ne vanno arrabbiati. È il punto da cui tutto il resto (staff, rifornimento, reputazione, tipi cliente) diventa raffinamento. Un solo tipo cliente generico, stock fisso, cassa che lavora da sola: sono semplificazioni temporanee per vedere il loop girare prima di aggiungere i sistemi.

## Scope

- Pathfinding A* su griglia scritto in casa (`src/sim/path.ts`): celle camminabili = pavimento delle stanze, oggetti bloccano, si entra/esce dalla porta.
- Cliente come macchina a stati (`entering → shopping → queueing → paying → leaving` / `leaving_angry`) con campo `state` stringa nello stato sim.
- Arrivi: un cliente ogni N secondi di gioco durante l'orario di apertura (da `config.ts`), solo se esistono porta e cassa raggiungibili.
- Lista spesa: 1–3 categorie casuali tra quelle presenti nel gioco (RNG con seed nello stato, deterministico).
- Scaffali con stock iniziale fisso (da `config.ts`); prendere un articolo scala lo stock. Nessun rifornimento.
- Fila alla cassa: celle di coda davanti alla cassa, servizio a tempo fisso. **Cassa automatica senza cassiere** (temporaneo, sostituito dal milestone staff).
- Pagamento: prezzo per categoria da `config.ts` → soldi del negozio.
- Pazienza: barra che cala attendendo in fila e trovando categoria mancante o scaffale vuoto; a zero il cliente esce senza comprare (`leaving_angry`).
- Render placeholder: omino iso colorato, barra pazienza sopra la testa, colore diverso se arrabbiato. HUD: clienti serviti / persi oggi.

## Out of scope

- Staff (cassiere, magazziniere, pulizie, banconiere) e assunzioni.
- Rifornimento, ordini merce, magazzino funzionante.
- Reputazione e afflusso variabile; 4 tipi cliente (Nonna, Studente, Mamma, Furbetto).
- Sporco, imprevisti, costi giornalieri (affitto, stipendi), obiettivi del livello.

## Dependencies

- **Depends on:** milestone 01, milestone 02
- **Blocks:** milestone 04, milestone 05

## Acceptance criteria

- [x] A* trova il percorso più breve tra due celle, aggira gli oggetti, restituisce `null` se irraggiungibile — test: `tests/path.test.ts::astar shortest, blocked, unreachable`
- [x] Con negozio valido e tempo che scorre arrivano clienti; senza porta o cassa raggiungibile non ne arriva nessuno — test: `tests/customers.test.ts::spawn only with door and reachable till`
- [x] Un cliente con lista soddisfabile percorre tutti gli stati fino a `leaving`, lo stock cala e i soldi aumentano del prezzo atteso — test: `tests/customers.test.ts::happy path pays`
- [x] Con lo scaffale della sua categoria vuoto o assente la pazienza cala; a zero esce `leaving_angry` senza pagare — test: `tests/customers.test.ts::empty shelf makes customer leave angry`
- [x] La fila serve un cliente alla volta in ordine di arrivo — test: `tests/customers.test.ts::queue is FIFO`
- [x] Stessa seed + stessi comandi → stesso stato dopo N tick (determinismo) — test: `tests/customers.test.ts::deterministic with seed`
- [x] Nel browser, dopo `advanceTime` di un'ora di gioco su un negozio costruito via comandi, `render_game_to_text()` mostra clienti serviti > 0 e soldi aumentati — test: `scripts/browser-test.mjs::hired cashier serves` (dal 04 serve un cassiere)
- [x] Movimento dei clienti leggibile, barra pazienza visibile da zoom medio — verified by user playtest

## Exit condition

L'utente costruisce un negozio minimo (sala vendita, area casse, porta, scaffale "Pasta", cassa) e avvia il tempo → i clienti entrano, prendono la pasta, fanno la fila e pagano, i soldi salgono; quando lo scaffale si svuota i nuovi clienti diventano rossi ed escono senza pagare.

## Test plan

- Test rossi per primi: `tests/path.test.ts`, `tests/customers.test.ts` (`npm test`), poi `scripts/browser-test.mjs::customers buy and pay`.
- Playtest utente: costruire, guardare 2–3 minuti a 3x, svuotare lo scaffale.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Cassa automatica e stock fisso sono temporanei: il milestone staff/rifornimento li sostituisce (vedi `docs/backlog.md`).
- Tutti i tempi, prezzi e tassi in `src/sim/config.ts`.
- Implementazione: `src/sim/path.ts` (A*), `src/sim/customers.ts` (arrivi, stati, fila, pagamento, pazienza), chiamati da `tick`. RNG mulberry32 con stato in `state.rng`.
- I clienti camminano su sala vendita e area casse (non magazzino); gli oggetti bloccano tranne la porta. Arrivano e spariscono sulla cella della porta. Si fermano su una cella libera accanto a scaffale/cassa.
- Lista spesa: 1–3 categorie diverse tra tutte e 6, anche quelle che il negozio non ha (è la pressione del gioco). Ogni voce mancante o scaffale vuoto: −35 pazienza. Cesto vuoto a fine giro → esce arrabbiato.
- Fila: si sceglie la cassa raggiungibile con meno gente; serve in ordine di arrivo (`queuedAt`). Per ora chi è in fila sta sulla stessa cella (si sovrappongono nel disegno).
- Disegno: strato pavimento ridisegnato solo con i comandi; oggetti e clienti in uno strato unico ordinato per profondità ogni frame.
- Test: `state.spawnAcc` molto negativo blocca gli arrivi automatici, così il test controlla chi entra.
