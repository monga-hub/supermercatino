# Il Supermercatino

## Pitch

Gestisci un supermercato di quartiere italiano anni '80-'90: costruisci reparti, assumi commessi e tieni a bada nonne con la lista, studenti squattrinati e furbetti che saltano la fila. Theme Hospital, ma tra il banco salumi e la cassa 3.

## Core gameplay loop

Un livello = un negozio vuoto con obiettivi. Tempo reale con pausa e 3 velocità.

1. **Costruisci** — disegni stanze sulla griglia isometrica (sala vendita, magazzino, banco salumi, forno, casse, spogliatoio staff) e ci piazzi dentro oggetti (scaffali, frighi, banconi, casse, cestini).
2. **Assumi** — scegli staff da una lista candidati (stipendio vs abilità/tratto) e li assegni a un ruolo.
3. **Rifornisci** — ordini merce per categoria; il magazziniere la porta dal magazzino agli scaffali.
4. **Servi** — i clienti entrano con una lista spesa, girano per i reparti, prendono la merce, fanno la fila e pagano.
5. **Reagisci** — scaffali vuoti, file lunghe, sporco, furbetti e imprevisti abbassano la soddisfazione; sistemi il layout, assumi, riordini.
6. **Espandi** — con gli incassi compri spazio/oggetti/reparti nuovi finché raggiungi gli obiettivi.

## Game rules

- **Griglia isometrica**: tutto si piazza su celle. Le stanze si disegnano trascinando un rettangolo; gli oggetti vanno dentro la stanza del tipo giusto (es. affettatrice solo nel banco salumi).
- **Merce per categoria, non per prodotto**: es. Pasta, Latticini, Salumi, Pane, Frutta, Detersivi. Ogni scaffale/frigo/bancone contiene una categoria e ha una capienza.
- **Clienti**: arrivano dalla porta con una lista di 1–N categorie. Per ogni voce cercano il reparto; se manca o è vuoto perdono pazienza. Poi vanno in fila alla cassa. Escono pagando (incasso) o arrabbiati (reputazione giù).
- **Pazienza**: ogni cliente ha una barra che cala con: attesa in fila, scaffale vuoto, sporco, percorso lungo. A zero se ne va senza comprare.
- **Tipi cliente v1** (gancio "supermercato italiano"):
  - *La Nonna con la lista* — lista lunga, lenta, paziente, vuole il banco salumi servito.
  - *Lo Studente fuori sede* — compra poco e cose economiche, passa veloce.
  - *La Mamma di fretta* — lista corta, pazienza bassissima in fila.
  - *Il Furbetto* — prova a saltare la fila / taccheggiare; serve personale vicino alle casse.
- **Staff v1**: *Cassiere* (serve la cassa), *Magazziniere* (porta merce dal magazzino agli scaffali), *Addetto pulizie* (pulisce sporco e rovesci), *Banconiere* (serve al banco salumi/forno). Ognuno ha stipendio, velocità e un tratto comico (es. "chiacchierone": lento ma alza il morale dei clienti).
- **Economia leggibile**: incasso = vendite; spese = merce ordinata + stipendi + affitto giornaliero + costruzione. Prezzi semplici, niente IVA o fornitori multipli.
- **Reputazione**: 0–100%, sale con clienti soddisfatti, scende con clienti arrabbiati. Determina quanti clienti arrivano.
- **Imprevisti** (pochi, comici): yogurt rovesciato (sporco), carrello incastrato (blocco corridoio), ispezione sanitaria (controlla pulizia).
- **Tempo**: giornate di negozio (apertura → chiusura). Pausa sempre disponibile; si può costruire in pausa.

## Win / lose conditions

- **Vittoria livello**: raggiungere tutte le soglie del livello (es. cassa ≥ €X, reputazione ≥ Y%, clienti serviti ≥ Z) entro un numero di giornate.
- **Sconfitta**: cassa in rosso oltre −€N per K giornate consecutive (bancarotta) oppure reputazione sotto una soglia minima.
- Durata target livello: **15–20 minuti**.

## Art style

- **Isometrica 2D**, sprite **dipinti/illustrati** (non pixel art), generati con AI. Fino al milestone 06 si usano placeholder geometrici (rombi e blocchi colorati in palette); gli sprite AI arrivano in un milestone dedicato dopo il 06, quando il loop del livello è completo (decisioni utente 2026-11-26, vedi `docs/backlog.md`).
- **Palette calda e saturata anni '80-'90**: neon dei banchi frigo, linoleum a scacchi, cartelli "OFFERTA" rosso/giallo, legno del banco salumi.
- Personaggi leggibili da lontano, silhouette caricaturali.
- Coerenza: unico foglio di stile/prompt per tutti gli sprite (stessa luce, stesso angolo iso, stesso contorno). Riferimento interno: esperimenti di `spesa-nonna` (moodboard, `super1-supercasa.jpg`).

## Audio direction

- **Muzak da supermercato** in loop (sottofondo leggero, anni '80).
- **Annunci comici all'altoparlante** ("Cassa 3 in apertura", "Signora Pina, il suo prosciutto è pronto").
- SFX: bip della cassa, carrello, rovescio. Fonte file audio da decidere (vedi Open questions).

## Player goals

- **Breve (livello)**: tenere clienti contenti e cassa positiva, raggiungere le soglie.
- **Lungo (campagna, dopo v1)**: superare livelli con negozi più grandi e difficili, sbloccare reparti e oggetti nuovi.

## Anti-goals

- **Non è un simulatore realistico**: niente supply chain vera, niente IVA, niente fogli Excel. Numeri pochi, leggibili, comici.
- Non è un city builder (un solo negozio per livello).
- Non è un idle/clicker.

## Scope v1 (vertical slice)

- **1 livello completo** con obiettivi.
- 6 tipi stanza (sala vendita, magazzino, banco salumi, forno, area casse, spogliatoio staff).
- ~8 oggetti (scaffale, frigo, bancone, affettatrice, forno, cassa, cestino, porta d'ingresso).
- 4 ruoli staff, 4 tipi cliente, 3 imprevisti.
- Desktop (mouse + tastiera) **e** touch (tablet/telefono): pan, pinch-zoom, tap per piazzare.
- Single player; salvataggio locale.

## References

- Theme Hospital (1997) — stanze, staff, pazienti con "malattie", umorismo.
- Two Point Hospital — modernizzazione dello stesso schema.
- Supermercati di quartiere italiani (Standa, Despar di paese, alimentari con banco salumi) — tono e ambientazione.

## Open questions (non bloccanti per lo scaffold)

- Strumento AI per gli sprite e formato del foglio (atlas) — da fissare nel primo milestone con asset.
- Fonte audio: muzak/annunci generati con AI, CC0, o sintesi vocale? Da decidere nel milestone audio.
- "Online più avanti": classifiche o condivisione negozi? Per ora solo vincolo architetturale (stato simulazione serializzabile, vedi ADR-0001).
- Prezzi regolabili dal giocatore o fissi? (Default v1: fissi.)
- Numeri economici esatti (soglie, stipendi, affitto): si tarano in playtest.
