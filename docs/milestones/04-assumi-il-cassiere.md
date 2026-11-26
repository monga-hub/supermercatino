# Milestone 04: Assumi il cassiere

## Status

in-progress

## Objective

Introdurre lo staff, secondo verbo del loop ("Assumi"). Il giocatore sceglie da una lista di candidati con stipendio, velocità e tratto comico, li assume e li licenzia. Il primo ruolo è il **Cassiere**: la cassa automatica del milestone 03 sparisce e una cassa serve solo se c'è un cassiere al suo posto. Si fa ora perché rifornimento (05) e il resto dello staff si appoggiano sullo stesso sistema (candidati, entità che camminano, stipendi).

## Scope

- Stato sim: `candidates` (generati con l'RNG del sim, 3 per ruolo, nome italiano, stipendio/giorno, velocità, tratto) e `staff` (entità con posizione, percorso, `state` stringa, cassa assegnata).
- Comandi: `{ type: 'hire', candidateId }` e `{ type: 'fire', staffId }`. Assumere rimpiazza il candidato con uno nuovo. Si può fare anche in pausa.
- Cassiere: entra dalla porta, va alla cassa libera più vicina, ci resta (`state: 'at_till'`). Una cassa senza cassiere non serve: i clienti in fila aspettano e perdono pazienza.
- Velocità del cassiere = tempo di pagamento (`PAY_SEC / speed`).
- Tratti v1: *Svelto* (più veloce), *Chiacchierone* (più lento ma chi paga recupera un po' di pazienza... per l'uscita contenta, conta per la reputazione nel 06), *Normale*. Numeri in `config.ts`.
- Stipendi: a fine giornata la cassa paga la somma degli stipendi (anticipo dell'economia giornaliera del 06).
- Staff camminano su sala vendita, area casse e magazzino.
- UI: pulsante **Staff** nell'HUD che apre un pannello: candidati (nome, ruolo, stipendio, tratto, *Assumi*) e staff assunto (*Licenzia*). Su telefono il pannello copre lo schermo e si chiude.
- Disegno placeholder: staff come omino con colore per ruolo (cassiere: grembiule rosso), distinguibile dai clienti.

## Out of scope

- Magazziniere e rifornimento (milestone 05), Addetto pulizie e Banconiere (dopo).
- Affitto, riepilogo di fine giornata, reputazione, obiettivi (milestone 06).
- Morale/stanchezza dello staff, spogliatoio, pause.

## Dependencies

- **Depends on:** milestone 03
- **Blocks:** milestone 05, milestone 06

## Acceptance criteria

- [ ] I candidati sono generati in modo deterministico dalla seed: 3 per ruolo, campi validi — test: `tests/staff.test.ts::candidates are seeded and valid`
- [ ] `hire` sposta il candidato nello staff e lo rimpiazza; `fire` lo rimuove; id inesistenti → errore senza cambiare lo stato — test: `tests/staff.test.ts::hire and fire`
- [ ] Senza cassiere la cassa non serve: il cliente aspetta e alla fine esce arrabbiato senza pagare — test: `tests/staff.test.ts::unstaffed till does not serve`
- [ ] Il cassiere entra, raggiunge la cassa e da lì i clienti pagano — test: `tests/staff.test.ts::cashier walks to till and serves`
- [ ] Un cassiere più veloce serve in meno tick — test: `tests/staff.test.ts::faster cashier serves faster`
- [ ] A fine giornata gli stipendi vengono scalati dalla cassa — test: `tests/staff.test.ts::wages paid at day end`
- [ ] Nel browser, assumere un cassiere via `dispatch` in un negozio costruito porta clienti serviti dopo un'ora di gioco — test: `scripts/browser-test.mjs::hired cashier serves`
- [ ] Pannello Staff leggibile e usabile su desktop e telefono — verified by user playtest

## Exit condition

L'utente costruisce il negozio, apre il pannello Staff, assume un cassiere → l'omino entra, va alla cassa e i clienti iniziano a pagare; licenziandolo i clienti restano in fila e diventano rossi.

## Test plan

- Test rossi per primi: `tests/staff.test.ts` (`npm test`), poi `scripts/browser-test.mjs::hired cashier serves`.
- Aggiornare i test del 03 che davano per scontata la cassa automatica (assumere un cassiere nel setup).
- Playtest utente da telefono via GitHub Pages.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Il sistema candidati/staff deve accogliere i ruoli futuri (Magazziniere nel 05) senza riscritture: ruolo come stringa, comportamento per ruolo in una funzione.
