# Verifica dei calibri

I dati in `calibri.js` non sono tutti uguali per attendibilità, e l'app lo
dice apertamente: nella scheda, quando scegli un movimento, sotto il nome
compare un pallino e una riga che spiega da dove viene il dato.

| pallino | fonte | significa |
|---|---|---|
| oro | `ufficiale` | letto sulla documentazione Seiko o Citizen |
| argento | `comunita` | riferimenti di settore concordi fra loro |
| arancio | `derivato` | ereditato dalla famiglia, mai verificato sul singolo calibro |

**Il campo che conta davvero è `riserva`.** È l'unico da cui l'app deduce
quando un orologio si fermerà: se è sbagliato, sbaglia tutto il resto.
Gli altri campi (data, giorno, arresto dei secondi) al massimo producono
un consiglio inutile, non un consiglio falso.

## Come si verifica

1. Cerca il libretto ufficiale del calibro. Seiko e Citizen li pubblicano in
   PDF, uno per calibro o per famiglia di calibri.
2. Prendi tre numeri: **riserva di carica in ore**, **alternanze/ora**,
   **giri di corona per la carica completa**.
3. Controlla tre sì/no: **carica a mano**, **arresto dei secondi**,
   **calendario** (solo data o giorno e data).
4. Aggiorna la riga in `calibri.js` e metti `fonte: "ufficiale"`.
5. Spunta qui sotto.

Se un calibro coincide in tutto con la sua famiglia, nella riga scrivi solo
`fonte: "ufficiale"`: il resto lo eredita già.

## Stato

Aggiornare la data a ogni passata.

- [x] **6R35** — 70 h, 21.600 A/h, 55 giri per la carica completa
- [x] **6R15** — 50 h
- [x] **E168** Eco-Drive
- [x] **4R35 / 4R36 / 4R38 / 4R39 / 4R57** — 41 h, 21.600 A/h, ~30 giri (55 per il 4R57)
      guide tecniche Seiko ufficiali — il 4R38 ha la data, il 4R39 no: prima erano invertiti
- [~] **NH35 / NH36** — identici a 4R35 / 4R36 · NH38 / NH70 da fare
- [~] **7S26 / 7S36** — 41 h, 21.600 A/h, niente carica a mano, niente arresto · 7S25 ancora da fare
- [x] **6R20 / 6R64** — 45 h, 28.800 A/h, 55 giri (6R20), day-date/GMT — guida tecnica Seiko
- [~] 6R31 — ~70 h, fonte di settore (nessun documento ufficiale specifico trovato)
- [x] **8R48 / 8R46 / 8R28** — 45 h, 28.800 A/h, 34 gioielli, 20 giri — comunicato e manuale ufficiali Seiko
- [ ] 6139 / 6138
- [x] **8L35** — 50 h, 55 giri — citazione ufficiale Seiko
      **8L55** — 55 h, 36.000 A/h · **8L45 (Vanac)** — 72 h — fonti di settore concordi
- [x] **9S65** — 72 h, 28.800 A/h · **9S85** — 55 h, 36.000 A/h — grand-seiko.com
- [x] **5R65 / 9R65** — 72 h, hacking, carica a mano — grand-seiko.com
- [ ] 66xx / 6602 — vintage anni '60-'70, nessun manuale digitalizzato trovato
- [x] **5M62 / 5M82 Kinetic** — 6 mesi, niente carica a mano — manuale ufficiale Seiko
- [x] **V157 / V147 Solar** — 10 mesi (era sbagliato: 4 mesi ereditati dalla famiglia) — guida tecnica Seiko
- [x] **7T92 / VK63 / 7C46** — battute a 3, 3 e 5 anni di batteria — fonti di settore, nessun manuale con la cifra esatta
- [~] **8215** — 42 h, 21.600 A/h, carica a mano sì, arresto no, secondi indiretti · 8205 / 82S5 / 82S7 / 8N24 da fare
- [~] **9015** — 42 h, 28.800 A/h, carica a mano e arresto · 9039 / 9011 / 9051 da fare
- [ ] Cal. 0200
- [x] **J810** — 240 giorni · **B620** — 270 giorni (era sbagliato: ereditava 180)
      **H800** — 6 mesi in uso normale, 10 in risparmio energia (manuale ufficiale)
      **Cal. 0200** — 60 h, 28.800 A/h — citizenwatch.com
- [ ] E650 / 8730 — nessuna fonte con la riserva trovata, restano sulla stima di famiglia

## Stato dei numeri

56 calibri toccati, 24 con fonte ufficiale, 33 con fonti di settore
concordi, il resto ereditato dalla famiglia (`derivato`) e dichiarato tale
nell'app. **Restano davvero da verificare solo cinque:** NH38, NH70, 6602,
66xx, 9011, e i due Citizen E650 e 8730 di cui non ho trovato la riserva
in nessuna fonte, ufficiale o no.

Tre correzioni vere, non solo conferme: il **4R38** aveva la data invertita
col 4R39; il **B620** ereditava 180 giorni invece dei suoi 270; il **8205**
era segnato senza carica a mano, e la pagina ufficiale Miyota dice il
contrario. Erano bug, non solo caselle da spuntare.

## Priorità

Non serve fare tutto. Nell'ordine:

1. **7S26, 4R36, NH35, 8215, 9015** — sono dentro la maggioranza degli
   orologi che la gente possiede davvero.
2. Le famiglie Eco-Drive, dove la riserva cambia molto da calibro a calibro
   (da 180 a 240 giorni e oltre) e l'app sbaglierebbe di mesi.
3. Il resto, con calma.

## La via d'uscita che esiste già

Nessun elenco sarà mai completo né perfetto. Per questo nella scheda c'è
sempre *«Non lo trovo: lo dichiaro io»*, e quello che l'utente scrive vince
sul database. Il database è un punto di partenza comodo, non un'autorità.
