# Milestone 22: Livelli 4–7

## Status

planned

## Objective

Completare la campagna con le meccaniche che i livelli 1–3 non toccano, una o due per livello, fino a un negozio grande dove serve automatizzare. Così ogni meccanica del gioco ha un livello che la insegna.

## Scope

- 4. **Alimentari Fratelli Bonetti**: + banco salumi con bancone e banconiere, frigo per i Latticini. Arriva il Signor Ponzone.
- 5. **Supermercato del Corso**: + furbetti e tocco 👮, guardia, carrelli abbandonati. Arriva l'orso.
- 6. **Supermercato Primavera** (grande): + panetteria col forno, spogliatoio con armadietti e stanchezza, ispezione sanitaria.
- 7. **Ipermercato Stella** (enorme, molti clienti): + capo reparto; tutto sbloccato. Obiettivi alti: senza automazione non si regge.
- Mappe disegnate per insegnare: per esempio nel 5 la cassa è lontana dalla porta, così i furbetti hanno strada per scappare.
- Testi "Novità" per ogni meccanica nuova.
- Bilanciamento per livello con `output/balance.ts` (8 semi).

## Out of scope

- Meccaniche nuove: si usano solo quelle che ci sono già (milestone 03–19).
- Stelle, punteggi, livelli extra.

## Dependencies

- **Depends on:** 20 (sistema livelli), 21 (fumetti "Novità"), 21b (esterno e decorazioni per i negozi grandi)
- **Blocks:** nessuno

## Acceptance criteria

- [ ] Ogni meccanica del gioco è sbloccata da esattamente un livello — test: `tests/levels.test.ts`
- [ ] Mappe 4–7 valide: ogni arredo sbloccato ha la stanza giusta, la porta è sul bordo della sala — test: `tests/levels.test.ts`
- [ ] Livelli 4–6 vinti con i tocchi 8/8; il 7 vinto con capo reparto e guardia almeno 6/8, senza automazione al massimo 2/8 — `output/balance.ts`
- [ ] Il livello 7 dopo i primi 6 sembra una sfida, non un muro — verified by user playtest

## Exit condition

L'utente gioca la campagna dal 4 al 7, a ogni livello trova una novità spiegata dal fumetto, e all'Ipermercato capisce da solo che deve assumere il capo reparto.

## Test plan

- Test rossi: estendere `tests/levels.test.ts` (copertura degli sblocchi, mappe valide), poi bilanciamento.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Nomi dei negozi inventati, niente marchi veri (decisione utente 2026-11-27).
