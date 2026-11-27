# Milestone 26: Piazzamento con conferma

## Status

implementato, in attesa di playtest (2026-11-27)

## Objective

Dal playtest: quando metti un mobile non si compra subito. Prima lo provi: lo sposti, lo giri, poi confermi con ✓.

## Scope

- Tocco con un arredo scelto: il mobile appare "in prova" (caselle verdi se va bene, rosse se no), niente soldi spesi.
- Altro tocco: si sposta lì. 🔄 lo gira, ✓ lo compra, ✕ lo toglie. Cambiare arredo lo annulla.
- La freccia della guida punta al ✓ mentre un mobile è in prova.
- Solo interfaccia (`Game.pending`), la sim non cambia: `placeObject` aveva già `rot`.

## Acceptance criteria

- [x] Il primo tocco non compra; un secondo tocco sposta; 🔄 e ✓ comprano il mobile girato dove l'hai lasciato — test: `scripts/browser-test.mjs` "build with mouse"
- [x] Livello 1 sul telefono: tocco + ✓ mette lo scaffale — test: `scripts/browser-test.mjs` "phone …"
- [ ] Mettere i mobili è comodo sul telefono — verified by user playtest

## Exit condition

L'utente mette uno scaffale, lo sposta e lo gira prima di comprarlo, poi tocca ✓.
