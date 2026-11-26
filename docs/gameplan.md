# Il Supermercatino

## Pitch

Gestisci un supermercato di quartiere italiano anni '80-'90: costruisci reparti, assumi commessi e tieni a bada nonne con la lista, studenti squattrinati e furbetti che saltano la fila. Theme Hospital, ma tra il banco salumi e la cassa 3.

## Core gameplay loop

Un livello = un negozio già costruito (stanze e porta fisse) con obiettivi; ogni livello sblocca una o due meccaniche nuove (campagna, ADR-0003). Tempo reale con pausa e 3 velocità. La modalità **Negozio libero** (lotto vuoto, tutto sbloccato) si apre dopo il livello 3.

1. **Costruisci** — nei livelli piazzi gli arredi nelle stanze già pronte; nel Negozio libero disegni stanze sulla griglia isometrica (sala vendita, magazzino, banco salumi, forno, casse, spogliatoio staff) e ci piazzi dentro oggetti (scaffali, frighi, banconi, casse, cestini).
2. **Assumi** — scegli staff da una lista candidati (stipendio vs abilità/tratto) e li assegni a un ruolo.
3. **Rifornisci** — ordini merce per categoria; il magazziniere la porta dal magazzino agli scaffali. Tocchi 📦 su uno scaffale che si svuota per metterlo in coda con priorità; senza tocco il magazziniere interviene solo quando è quasi vuoto (ADR-0002).
4. **Servi** — i clienti entrano con una lista spesa, girano per i reparti, prendono la merce, fanno la fila e pagano. Quando il conto è pronto compare 💰 sulla cassa: toccandola incassi subito con una mancia, altrimenti il cassiere chiude da solo dopo qualche secondo (ADR-0002).
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
- **Sconfitta**: cassa in rosso per K chiusure consecutive (bancarotta) oppure reputazione sotto una soglia minima per K chiusure consecutive (livello 1: K = 2, soglia 15%). Alla prima chiusura brutta il riepilogo avvisa.
- Durata target livello: **15–20 minuti**.

## Art style

- **Isometrica 2D**, sprite **dipinti/illustrati** (non pixel art), generati con **Gemini**. Fino al milestone 06 si usano placeholder geometrici (rombi e blocchi colorati in palette); gli sprite AI arrivano in un milestone dedicato dopo il 06, quando il loop del livello è completo (decisioni utente 2026-11-26, vedi `docs/backlog.md`).
- **Palette calda e saturata anni '80-'90**: neon dei banchi frigo, linoleum a scacchi, cartelli "OFFERTA" rosso/giallo, legno del banco salumi.
- Personaggi leggibili da lontano, silhouette caricaturali.
- Coerenza: unico foglio di stile/prompt per tutti gli sprite (stessa luce, stesso angolo iso, stesso contorno). Riferimento interno: esperimenti di `spesa-nonna` (moodboard, `super1-supercasa.jpg`).

## Audio direction

- **Muzak da supermercato** in loop (sottofondo leggero, anni '80).
- **Annunci comici all'altoparlante** ("Cassa 3 in apertura", "Signora Pina, il suo prosciutto è pronto").
- SFX: bip della cassa, carrello, rovescio. Tutto sintetizzato nel codice (Web Audio) e annunci con la voce del telefono: deciso nel milestone 16.

## Player goals

- **Breve (livello)**: tenere clienti contenti e cassa positiva, raggiungere le soglie.
- **Lungo (campagna)**: 7 negozi inventati tipici italiani, dall'Alimentari da Pina all'Ipermercato Stella; ogni livello insegna una o due meccaniche (milestone 20–22, ADR-0003).

## Anti-goals

- **Non è un simulatore realistico**: niente supply chain vera, niente IVA, niente fogli Excel. Numeri pochi, leggibili, comici.
- Non è un city builder (un solo negozio per livello).
- Non è un idle/clicker.

## Scope v1 (vertical slice)

- **Campagna di 7 livelli** a negozi prestabiliti + Negozio libero (ADR-0003).
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

- ~~Strumento AI per gli sprite e formato del foglio (atlas)~~ — Gemini + atlas PNG/JSON (milestone 07).
- ~~Fonte audio~~ → tutto sintetizzato, annunci con speechSynthesis (milestone 16).
- "Online più avanti": classifiche o condivisione negozi? Per ora solo vincolo architetturale (stato simulazione serializzabile, vedi ADR-0001).
- Prezzi regolabili dal giocatore o fissi? (Default v1: fissi.)
- Numeri economici esatti (soglie, stipendi, affitto): si tarano in playtest.
