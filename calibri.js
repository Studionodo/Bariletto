/* ------------------------------------------------------------------
   Calibri — Seiko, Citizen, Miyota
   Da verificare sui libretti ufficiali prima di considerarli oro colato.
   Campi:
     tipo      automatico | manuale | cronografo | ecodrive | kinetic |
               springdrive | quarzo
     mano      si carica a corona
     arresto   i secondi si fermano tirando la corona (hacking)
     data      ha la data
     giorno    ha il giorno della settimana
     riserva   ore di autonomia a carica piena (per solare/kinetic: giorni*24)
     ah        alternanze/ora
     indiretti secondi a trascinamento indiretto (il piccolo scatto)
     giri      giri di corona per la carica completa, dove documentato
     finestra  [da, a] ore in cui NON toccare la data, se il calibro
               dichiara una finestra sua; altrimenti vale 21-3
     fonte     da dove viene il dato:
                 "ufficiale"  documentazione Seiko o Citizen
                 "comunita"   riferimenti di settore concordi
                 "derivato"   ereditato dalla famiglia, non verificato sul singolo
   Il campo fonte non è cosmetico: dice all'utente quanto fidarsi, e a noi
   cosa resta da fare. L'elenco delle verifiche aperte sta in VERIFICA.md.
   ------------------------------------------------------------------ */

const FAMIGLIE = [
  { id: "seiko-7s",  marca: "Seiko",   nome: "Seiko 7S",           tipo: "automatico",  mano: false, arresto: false, data: true,  giorno: true,  riserva: 41,   ah: 21600, fonte: "comunita" },
  { id: "seiko-4r",  marca: "Seiko",   nome: "Seiko 4R / NH",      tipo: "automatico",  mano: true,  arresto: true,  data: true,  giorno: false, riserva: 41,   ah: 21600, giri: 30, finestra: [21, 1], fonte: "comunita" },
  { id: "seiko-6r",  marca: "Seiko",   nome: "Seiko 6R",           tipo: "automatico",  mano: true,  arresto: true,  data: true,  giorno: false, riserva: 70,   ah: 21600, fonte: "comunita" },
  { id: "seiko-8r",  marca: "Seiko",   nome: "Seiko 8R cronografi",tipo: "cronografo",  mano: true,  arresto: true,  data: true,  giorno: false, riserva: 45,   ah: 28800, fonte: "comunita" },
  { id: "seiko-8l",  marca: "Seiko",   nome: "Seiko 8L",           tipo: "automatico",  mano: true, arresto: true, data: true,  giorno: false, riserva: 50,   ah: 28800, fonte: "comunita" },
  { id: "seiko-9s",  marca: "Seiko",   nome: "Grand Seiko 9S",     tipo: "automatico",  mano: true,  arresto: true,  data: true,  giorno: false, riserva: 72,   ah: 28800, fonte: "comunita" },
  { id: "seiko-5r",  marca: "Seiko",   nome: "Spring Drive 5R/9R", tipo: "springdrive", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 72,   ah: 0, fonte: "comunita" },
  { id: "seiko-vint",marca: "Seiko",   nome: "Seiko manuali d'epoca", tipo: "manuale",  mano: true,  arresto: false, data: true,  giorno: false, riserva: 45,   ah: 18000, fonte: "derivato" },
  { id: "seiko-chr-v", marca: "Seiko", nome: "Seiko 6138 / 6139",  tipo: "cronografo",  mano: false, arresto: false, data: true,  giorno: true,  riserva: 45,   ah: 21600, fonte: "comunita" },
  { id: "seiko-kin", marca: "Seiko",   nome: "Seiko Kinetic",      tipo: "kinetic",     mano: false, arresto: true,  data: true,  giorno: false, riserva: 4320, ah: 0, fonte: "comunita" },
  { id: "seiko-sol", marca: "Seiko",   nome: "Seiko Solar",        tipo: "ecodrive",    mano: false, arresto: true,  data: true,  giorno: false, riserva: 2880, ah: 0, fonte: "comunita" },
  { id: "seiko-q",   marca: "Seiko",   nome: "Seiko quarzo",       tipo: "quarzo",      mano: false, arresto: true,  data: true,  giorno: false, riserva: 26280,ah: 0, fonte: "comunita" },
  /* Miyota quarzo: a differenza di seiko-q, la base NON ha la data —
     0S10 e 0S20 non ce l'hanno, solo 0S60/JS15/JS25 la aggiungono, e la
     sovrascrivono singolarmente. Stesso motivo per cui data:false qui
     e non ereditato dal pattern Seiko. */
  { id: "miyota-q", marca: "Miyota", nome: "Miyota quarzo", tipo: "quarzo", mano: false, arresto: true, data: false, giorno: false, riserva: 43800, ah: 0, fonte: "comunita" },
  /* Ronda: un solo calibro per ora, famiglia comunque creata per
     coerenza con lo schema del resto del file e in vista di eventuali
     aggiunte future della stessa casa. */
  { id: "ronda-mecaquarzo", marca: "Ronda", nome: "Ronda mecaquarzo", tipo: "quarzo", mano: false, arresto: true, data: true, giorno: false, riserva: 39420, ah: 0, fonte: "comunita" },
  { id: "eta-2824",  marca: "ETA",     nome: "ETA 2824 / Sellita SW200", tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 38,   ah: 28800, finestra: [21, 3], fonte: "comunita" },
  /* Lotto 14: movimenti francesi. Yema e Pequignet sono manifatture
     vere, non basi ETA — famiglie proprie, non agganciate a nessuna
     esistente. Il Lip R184 resta fuori dal picker: è un movimento
     elettrico (motore a bilanciere, batteria+bobina), un tipo che
     l'app non modella — stesso limite già visto per il tourbillon, e
     comunque un pezzo fuori produzione da decenni dove "carica" e
     "riserva" nel senso in cui l'app li conta non si applicano allo
     stesso modo. */
  { id: "yema-fam", marca: "Yema", nome: "Yema manifattura (CMM)", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 70, ah: 28800, fonte: "comunita" },
  { id: "pequignet-fam", marca: "Pequignet", nome: "Pequignet manifattura", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 42, ah: 28800, fonte: "comunita" },
  { id: "eta-7750",  marca: "ETA",     nome: "ETA 7750 / Sellita SW500", tipo: "cronografo", mano: true,  arresto: true,  data: true,  giorno: true,  riserva: 48,   ah: 28800, finestra: [20, 2], fonte: "comunita" },
  { id: "eta-2892",  marca: "ETA",     nome: "ETA 2892",             tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 42,   ah: 28800, finestra: [21, 3], fonte: "comunita" },
  /* Lotto 15. Tudor: una sola famiglia per MT56 e MT54 — diametro
     diverso ma stesso comportamento funzionale (l'app non traccia le
     dimensioni), data:false di base perché MT5602 e MT5402 non ce
     l'hanno, MT5612 la sovrascrive. I tre microbrand: nessuno dei tre
     ha una fonte sul proprio dominio (il PDF STP è su un mirror terzo,
     G100 e A10 su FHS/Caliber Corner) — fonte "comunita" su tutti e
     tre per coerenza, anche dove il documento sembra originare dal
     produttore. */
  { id: "tudor-fam", marca: "Tudor", nome: "Tudor manifattura (MT5x)", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 70, ah: 28800, fonte: "comunita" },
  { id: "stp-fam", marca: "STP", nome: "STP", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 44, ah: 28800, fonte: "comunita" },
  { id: "ljp-fam", marca: "La Joux-Perret", nome: "La Joux-Perret", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 68, ah: 28800, fonte: "comunita" },
  { id: "soprod-fam", marca: "Soprod", nome: "Soprod", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 42, ah: 28800, fonte: "comunita" },
  /* Lotto 16. Panerai: P.9000 automatico e P.5000 manuale nella stessa
     famiglia con override profondi, dato quanto sono diversi (tipo,
     riserva, frequenza). Weiss: DUE famiglie per la stessa marca, non
     una — 1003 è manifattura vera con fonte sul dominio proprio,
     2100/2120/2130 sono basi svizzere assemblate, con fonte diretta
     solo dove weisswatchcompany.com compare davvero fra i link (2120,
     2130), non per il 2100 dove le uniche fonti sono terze parti. */
  { id: "panerai-fam", marca: "Panerai", nome: "Panerai manifattura", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 72, ah: 28800, fonte: "comunita" },
  { id: "weiss-1003-fam", marca: "Weiss", nome: "Weiss manifattura", tipo: "manuale", mano: true, arresto: true, data: false, giorno: false, riserva: 46, ah: 21600, fonte: "comunita" },
  { id: "weiss-assemblato-fam", marca: "Weiss", nome: "Weiss (base svizzera assemblata)", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 42, ah: 28800, fonte: "comunita" },
  /* Lotto 17. Omega: data non ridichiarata dalle due schede — non
     assunta, resta data:false di famiglia finché non emerge una
     conferma diretta. Breitling: cronografo vero, tipo dedicato.
     IWC: manuale a lunga riserva, 192h = la cifra garantita degli
     otto giorni dichiarati, non il margine tecnico interno a nove. */
  { id: "omega-fam", marca: "Omega", nome: "Omega Co-Axial Master Chronometer", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 55, ah: 25200, fonte: "comunita" },
  { id: "breitling-fam", marca: "Breitling", nome: "Breitling manifattura", tipo: "cronografo", crono: true, mano: true, arresto: true, data: true, giorno: false, riserva: 70, ah: 28800, fonte: "comunita" },
  { id: "iwc-fam", marca: "IWC", nome: "IWC Pellaton", tipo: "manuale", mano: true, arresto: true, data: false, giorno: false, riserva: 192, ah: 28800, fonte: "comunita" },
  /* Lotto 18. TAG Heuer: manifattura vera, nessuna parentela con
     Zenith nonostante lo stesso gruppo LVMH. Longines: base ETA
     A31.L11 dichiarata come tale, non manifattura pura — ma qui la
     finestra data non è la solita prudenza di default: il manuale
     Longines la dà per iscritto, 20:00-03:00, e per questo è l'unica
     voce di questo lotto con "finestra" impostata esplicitamente
     invece di ereditare il default generico. */
  { id: "tagheuer-fam", marca: "TAG Heuer", nome: "TAG Heuer manifattura", tipo: "cronografo", crono: true, mano: true, arresto: true, data: true, giorno: false, riserva: 80, ah: 28800, fonte: "comunita" },
  { id: "longines-fam", marca: "Longines", nome: "Longines (base ETA A31.L11)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 72, ah: 25200, finestra: [20, 3], fonte: "comunita" },
  /* Lotto 23: tre marchi, stessa famiglia ETA C07 — 80 ore di riserva,
     21.600 A/H (non 28.800: la frequenza abbassata è proprio ciò che
     rende possibile la riserva lunga). Fonte diversa per ciascuno:
     Certina la dichiara apertamente sul proprio sito, Tissot e
     Hamilton no — nessuna delle due arriva a "ufficiale". */
  { id: "tissot-c07-fam", marca: "Tissot", nome: "Tissot Powermatic 80 (ETA C07)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 80, ah: 21600, fonte: "comunita" },
  { id: "hamilton-c07-fam", marca: "Hamilton", nome: "Hamilton H-10 (ETA C07)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 80, ah: 21600, fonte: "comunita" },
  { id: "certina-c07-fam", marca: "Certina", nome: "Certina Powermatic 80 (ETA C07)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 80, ah: 21600, fonte: "comunita" },
  /* Lotto 24: Mido chiude il quartetto C07 (fonte ufficiale stavolta —
     è il più esplicito dei quattro marchi, non Certina come si pensava
     dopo il lotto 23). Frederique Constant è tutt'altra famiglia:
     stessa sigla FC-303 ha coperto nel tempo sia ETA 2824-2 sia
     Sellita SW200-1 — riserva standard 38h, non gonfiata a 80. */
  { id: "mido-c07-fam", marca: "Mido", nome: "Mido Caliber 80 (ETA C07)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 80, ah: 21600, fonte: "ufficiale" },
  { id: "fc-fam", marca: "Frederique Constant", nome: "Frederique Constant (base ETA/Sellita)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 38, ah: 28800, fonte: "ufficiale" },
  /* Lotto 25: Rado è il quinto marchio C07 (fonte ufficiale, come
     Mido e Certina). Maurice Lacroix ha la stessa base SW200 di
     Frederique Constant ma è un marchio diverso — famiglia propria,
     non condivisa, per tenere corretta la marca in ogni scheda. */
  { id: "rado-c07-fam", marca: "Rado", nome: "Rado (ETA C07)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 80, ah: 21600, fonte: "ufficiale" },
  { id: "ml-fam", marca: "Maurice Lacroix", nome: "Maurice Lacroix (base Sellita SW200-1)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 38, ah: 28800, fonte: "ufficiale" },
  /* Lotto 26: Victorinox copre solo la linea I.N.O.X. Automatic
     (Sellita SW200-1) — le altre due basi trovate (ETA 2824-2 su
     I.N.O.X. Mechanical, ETA 2892 su Alliance) restano solo nella
     prosa della scheda, non hanno una voce propria nel picker.
     Bulgari BVL 138: manifattura vera, niente data, arresto non
     confermato da nessuna fonte — resta false, non un'assunzione. */
  { id: "victorinox-fam", marca: "Victorinox Swiss Army", nome: "Victorinox I.N.O.X. (Sellita SW200-1)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 40, ah: 28800, fonte: "ufficiale" },
  { id: "bulgari-fam", marca: "Bulgari", nome: "Bulgari Octo Finissimo", tipo: "automatico", mano: true, arresto: false, data: false, giorno: false, riserva: 55, ah: 21600, fonte: "ufficiale" },
  /* Lotto 27: Piaget manuale, riserva 40h — scelta prudente fra le
     due cifre in contraddizione dichiarate dalla stessa Piaget (40 o
     44), la scheda riporta entrambe senza sciogliere il dubbio, qui
     serve un numero solo e prendo il più basso. Ulysse Nardin UN-118:
     arresto e data non confermati come base, restano false. */
  { id: "piaget-fam", marca: "Piaget", nome: "Piaget Altiplano Ultimate", tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 40, ah: 28800, fonte: "ufficiale" },
  { id: "un-fam", marca: "Ulysse Nardin", nome: "Ulysse Nardin Marine (UN-118)", tipo: "automatico", mano: true, arresto: false, data: false, giorno: false, riserva: 60, ah: 28800, fonte: "ufficiale" },
  /* Lotto 28: Breguet 777A, automatico con data standard. Blancpain
     1315: tre bariletti in serie, 120 ore — la riserva più lunga di
     tutto l'archivio finora. Correzione data bidirezionale non ha un
     campo dedicato nello schema attuale, resta solo in prosa nella
     scheda. */
  { id: "breguet-fam", marca: "Breguet", nome: "Breguet Marine (777A)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 55, ah: 28800, fonte: "ufficiale" },
  { id: "blancpain-fam", marca: "Blancpain", nome: "Blancpain Fifty Fathoms (1315)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 120, ah: 28800, fonte: "ufficiale" },
  /* Lotto 29: Bell & Ross condivide la base Sellita SW300-1, riserva
     40h scelta prudente fra i tre numeri diversi (38/40/54) trovati
     a seconda del modello — la scheda spiega perché divergono.
     Glashütte Original 92-14: 100 ore, arresto true confermato. */
  { id: "bellross-fam", marca: "Bell & Ross", nome: "Bell & Ross (base Sellita SW300-1)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 40, ah: 28800, fonte: "comunita" },
  { id: "glashutte-fam", marca: "Glashütte Original", nome: "Glashütte Original Pano (92-14)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 100, ah: 28800, fonte: "ufficiale" },
  /* Lotto 30: Doxa condivide la base Sellita SW200-1 (stessa
     architettura di Certina/Maurice Lacroix/Frederique Constant, ma
     marca diversa). Girard-Perregaux GP01800: arresto false, nessuna
     fonte conferma un dispositivo di arresto per questa versione. */
  { id: "doxa-fam", marca: "Doxa", nome: "Doxa SUB (Sellita SW200-1)", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 38, ah: 28800, fonte: "comunita" },
  { id: "gp-fam", marca: "Girard-Perregaux", nome: "Girard-Perregaux Laureato (GP01800)", tipo: "automatico", mano: true, arresto: false, data: true, giorno: false, riserva: 54, ah: 28800, fonte: "ufficiale" },
  /* Lotto 31: Vulcain V-10, manuale, 18.000 A/H — la sveglia meccanica
     con bariletto separato non ha un campo dedicato nello schema
     attuale, resta solo in prosa nella scheda. Casio (modulo 3495)
     NON entra nel picker: la scheda stessa dichiara riserva/A-H/arresto
     incompatibili col formato meccanico di questo schema — resta solo
     in ARCHIVIO come voce di consultazione, non selezionabile. */
  { id: "vulcain-fam", marca: "Vulcain", nome: "Vulcain Cricket (V-10)", tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 42, ah: 18000, fonte: "ufficiale" },
  /* Lotto 32: JLC 953 riserva 48h — NON nella scheda consegnata (vuoto
     segnalato), trovata con una ricerca mirata separata e confermata
     su fonte ufficiale JLC + più fonti indipendenti convergenti.
     Patek 240 HU: automatico (rotore in oro decentrato, non manuale),
     niente arresto — la scheda dice esplicitamente che gran parte
     delle varianti 240 non hanno nemmeno la lancetta dei secondi. */
  { id: "jlc-mr-fam", marca: "Jaeger-LeCoultre", nome: "Jaeger-LeCoultre Reverso (953, ripetizione minuti)", tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 48, ah: 28800, fonte: "ufficiale" },
  { id: "patek-hu-fam", marca: "Patek Philippe", nome: "Patek Philippe 240 HU (worldtimer)", tipo: "automatico", mano: true, arresto: false, data: false, giorno: false, riserva: 48, ah: 21600, fonte: "ufficiale" },
  /* Lotto 19. Bremont ENG300 entra: manifattura vera (80% del calibro
     ridisegnato e prodotto in Inghilterra, non solo assemblato).
     L'Accutron NON entra qui — è un diapason elettronico a 360 Hz,
     un quarto tipo di calibro (dopo tourbillon, elettrico a bilanciere,
     ora diapason) che l'app non modella. Resta archivio, non picker —
     stessa scelta già fatta per SL5200/SL5812, Cartier 9452 MC, Lip
     R184. */
  { id: "bremont-fam", marca: "Bremont", nome: "Bremont ENG300", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 65, ah: 25200, fonte: "comunita" },
  /* Lotto 20. Oris e Christopher Ward: due bariletti in serie, la
     stessa architettura per la riserva lunga — coincidenza dichiarata
     in entrambe le schede, non un'invenzione mia nel raggrupparle.
     Chopard: alta orologeria, niente data su questa configurazione,
     coerente con Cartier 9452 MC e Panerai P.5000 già in archivio. */
  { id: "oris-fam", marca: "Oris", nome: "Oris manifattura (Calibre 400)", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 120, ah: 28800, fonte: "comunita" },
  { id: "chopard-fam", marca: "Chopard", nome: "Chopard L.U.C", tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 65, ah: 28800, fonte: "comunita" },
  { id: "christopherward-fam", marca: "Christopher Ward", nome: "Christopher Ward SH21", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 120, ah: 28800, fonte: "comunita" },
  /* Lotto 21, ultimo di questa fase. Venezianico: manifattura vera,
     calibro presentato nel 2025 — il più recente dell'intero archivio.
     Baltic non ha una voce qui: nessun calibro proprio, solo basi
     Miyota/Sellita/Soprod/Sea-Gull già coperte altrove sotto il loro
     nome originale — aggiungerlo avrebbe voluto dire duplicare una
     famiglia esistente con un marchio diverso sopra, non descrivere
     qualcosa di realmente nuovo. */
  { id: "venezianico-fam", marca: "Venezianico", nome: "Venezianico", tipo: "manuale", mano: true, arresto: true, data: false, giorno: false, riserva: 60, ah: 25200, fonte: "comunita" },
  { id: "eta-unitas",marca: "ETA",     nome: "ETA 6497 / 6498 (Unitas)", tipo: "manuale", mano: true,  arresto: false, data: false, giorno: false, riserva: 46,   ah: 18000, fonte: "comunita" },
  { id: "ronda-q",   marca: "Ronda",   nome: "Ronda quarzo",         tipo: "quarzo",     mano: false, arresto: true,  data: true,  giorno: false, riserva: 43800, ah: 0, fonte: "comunita" },
  { id: "orient-f6",  marca: "Orient",  nome: "Orient F6",           tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 40,   ah: 21600, fonte: "comunita" },
  /* Lotto 22: due famiglie Orient nuove, non una sola — F7F44 (Orient
     Star, alta gamma) e 46943 (storico) sono meccanicamente troppo
     diverse fra loro e da F6 per condividerla. Il 46943 in particolare
     non ha alcuna carica manuale: mano:false qui non è un dato mancante,
     è confermato dalla scheda. */
  { id: "orient-star-fam", marca: "Orient", nome: "Orient Star", tipo: "automatico", mano: true, arresto: false, data: false, giorno: false, riserva: 50, ah: 21600, fonte: "comunita" },
  { id: "orient-46-fam", marca: "Orient", nome: "Orient 46xx (storico)", tipo: "automatico", mano: false, arresto: false, data: true, giorno: true, riserva: 42, ah: 21600, fonte: "comunita" },
  { id: "seagull-st",  marca: "Sea-Gull", nome: "Sea-Gull ST",   tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 42,   ah: 21600, fonte: "comunita" },
  { id: "seagull-vm",  marca: "Sea-Gull", nome: "Sea-Gull cronografo manuale", tipo: "cronografo", mano: true, arresto: false, data: false, giorno: false, riserva: 45, ah: 21600, fonte: "comunita" },
  { id: "generic-2813", marca: "Vari",     nome: "Cloni generici cinesi", tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 40,   ah: 21600, fonte: "comunita" },
  { id: "pt-fam",      marca: "PT",       nome: "PT (clone 2824-2)",     tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 38,   ah: 28800, fonte: "comunita" },
  { id: "hangzhou-fam",marca: "Hangzhou", nome: "Hangzhou",              tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 42,   ah: 21600, fonte: "comunita" },
  { id: "vostok-a",   marca: "Vostok",  nome: "Vostok automatico", tipo: "automatico", mano: true,  arresto: false, data: true,  giorno: false, riserva: 31,   ah: 19800, fonte: "comunita" },
  { id: "vostok-m",   marca: "Vostok",  nome: "Vostok manuale",    tipo: "manuale",    mano: true,  arresto: false, data: false, giorno: false, riserva: 38,   ah: 19800, fonte: "comunita" },
  { id: "raketa-m",   marca: "Raketa",  nome: "Raketa manuale",    tipo: "manuale",    mano: true,  arresto: false, data: false, giorno: false, riserva: 40,   ah: 18000, fonte: "comunita" },
  { id: "raketa-a",   marca: "Raketa",  nome: "Raketa Avtomat",    tipo: "automatico", mano: true,  arresto: false, data: true,  giorno: false, riserva: 40,   ah: 21600, fonte: "comunita" },
  { id: "slava-m",    marca: "Slava",   nome: "Slava manuale",     tipo: "manuale",    mano: true,  arresto: false, data: true,  giorno: false, riserva: 40,   ah: 18000, fonte: "comunita" },
  { id: "poljot-cr",  marca: "Poljot",  nome: "Poljot cronografo", tipo: "cronografo", mano: true,  arresto: false, data: true,  giorno: false, riserva: 42,   ah: 21600, fonte: "comunita" },
  { id: "hamilton-r",  marca: "Hamilton", nome: "Hamilton ferroviario",  tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 42, ah: 18000, fonte: "comunita" },
  { id: "waltham-m",   marca: "Waltham",  nome: "Waltham manuale",       tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 36, ah: 18000, fonte: "comunita" },
  { id: "elgin-m",     marca: "Elgin",    nome: "Elgin manuale",         tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 36, ah: 18000, fonte: "comunita" },
  { id: "rgm-m",       marca: "RGM",      nome: "RGM manuale",           tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, riserva: 42, ah: 18000, fonte: "comunita" },
  { id: "nomos-m",  marca: "Nomos",  nome: "Nomos manuale",     tipo: "manuale",    mano: true, arresto: true, data: false, giorno: false, riserva: 43,  ah: 21600, fonte: "comunita" },
  { id: "nomos-a",  marca: "Nomos",  nome: "Nomos Swing System", tipo: "automatico", mano: true, arresto: true, data: true,  giorno: false, riserva: 42,  ah: 21600, fonte: "comunita" },
  { id: "muehle-a", marca: "M\u00fchle Glash\u00fctte", nome: "M\u00fchle automatico", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 42, ah: 28800, fonte: "comunita" },
  { id: "sinn-a",   marca: "Sinn",   nome: "Sinn automatico",   tipo: "automatico", mano: true, arresto: true, data: true,  giorno: false, riserva: 38,  ah: 28800, fonte: "comunita" },
  { id: "lange-m",  marca: "A. Lange & S\u00f6hne", nome: "Lange manuale", tipo: "manuale", mano: true, arresto: true, data: true, giorno: false, riserva: 72, ah: 21600, fonte: "comunita" },
  { id: "rolex-a",   marca: "Rolex",    nome: "Rolex automatico",       tipo: "automatico", mano: true, arresto: true, data: true,  giorno: false, riserva: 48,  ah: 28800, fonte: "comunita" },
  { id: "rolex-cr",  marca: "Rolex",    nome: "Rolex cronografo",       tipo: "cronografo", mano: true, arresto: true, data: true,  giorno: false, riserva: 72,  ah: 28800, fonte: "comunita" },
  { id: "ap-a",      marca: "Audemars Piguet", nome: "AP automatico",   tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 60,  ah: 21600, fonte: "comunita" },
  { id: "patek-a",   marca: "Patek Philippe",  nome: "Patek automatico",tipo: "automatico", mano: true, arresto: true, data: false, giorno: false, riserva: 45,  ah: 21600, fonte: "comunita" },
  { id: "vacheron-a",marca: "Vacheron Constantin", nome: "Vacheron automatico", tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, riserva: 40, ah: 28800, fonte: "comunita" },
  { id: "jlc-a",     marca: "Jaeger-LeCoultre", nome: "JLC automatico",  tipo: "automatico", mano: true, arresto: true, data: true,  giorno: false, riserva: 43,  ah: 28800, fonte: "comunita" },
  { id: "zenith-cr", marca: "Zenith",   nome: "Zenith El Primero",       tipo: "cronografo", mano: true, arresto: true, data: true,  giorno: false, riserva: 50,  ah: 36000, fonte: "comunita" },
  { id: "journe-m",  marca: "F.P.Journe", nome: "F.P.Journe manuale",    tipo: "manuale",    mano: true, arresto: true, data: false, giorno: false, riserva: 56,  ah: 21600, fonte: "comunita" },
  { id: "peacock-fam", marca: "Peacock",  nome: "Peacock",               tipo: "automatico", mano: true,  arresto: true,  data: true,  giorno: false, riserva: 42,   ah: 21600, fonte: "comunita" },
  /* Sblocco dei tre tipi costruiti in questa sessione: tourbillon,
     elettrico, diapason. I due tourbillon Peacock non entrano nella
     famiglia automatica sopra — meccanica troppo diversa (manuale,
     niente data, arresto non confermato) per condividerla con i
     cloni 2824-2 del resto della linea. Stessa logica per Cartier:
     famiglia a sé, un solo calibro dentro per ora. */
  { id: "peacock-tourbillon-fam", marca: "Peacock", nome: "Peacock tourbillon", tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, tourbillon: true, riserva: 48, ah: 21600, fonte: "comunita" },
  { id: "cartier-fam", marca: "Cartier", nome: "Cartier tourbillon", tipo: "manuale", mano: true, arresto: false, data: false, giorno: false, tourbillon: true, riserva: 50, ah: 21600, fonte: "comunita" },
  { id: "lip-fam", marca: "Lip", nome: "Lip elettrico", tipo: "elettrico", mano: false, arresto: false, data: true, giorno: false, riserva: 17520, ah: 18000, fonte: "comunita" },
  { id: "bulova-fam", marca: "Bulova", nome: "Bulova Accutron", tipo: "diapason", mano: false, arresto: false, data: false, giorno: false, riserva: 17520, ah: 0, fonte: "comunita" },
  { id: "miyota-82", marca: "Citizen", nome: "Miyota 8200",        tipo: "automatico",  mano: true,  arresto: false, data: true,  giorno: false, riserva: 42,   ah: 21600, indiretti: true, fonte: "comunita" },
  { id: "miyota-90", marca: "Citizen", nome: "Miyota 9000",        tipo: "automatico",  mano: true,  arresto: true,  data: true,  giorno: false, riserva: 42,   ah: 28800, fonte: "comunita" },
  { id: "citizen-eco", marca: "Citizen", nome: "Citizen Eco-Drive",tipo: "ecodrive",    mano: false, arresto: true,  data: true,  giorno: false, riserva: 4320, ah: 0, fonte: "comunita" },
];

/* Le eccezioni: solo dove la famiglia mente. */
const CALIBRI = [
  /* Seiko 7S — niente corona, niente arresto. La base degli SKX. */
  { id: "7S26", fam: "seiko-7s", nome: "Seiko 7S26", fonte: "comunita" },
  { id: "7S36", fam: "seiko-7s", nome: "Seiko 7S36", fonte: "comunita" },
  { id: "7S25", fam: "seiko-7s", nome: "Seiko 7S25", giorno: false, scheda: "seiko-7s26" }, // stessa base del 7S26, senza giorno della settimana — nessuna scheda propria necessaria

  /* Seiko 4R / NH — la differenza è solo nel calendario. */
  { id: "4R34", fam: "seiko-4r", nome: "Seiko 4R34 (24 ore)", notaData: "g.data.24h", fonte: "ufficiale" }, // il manuale ancora il divieto alla lancetta delle 24 ore
  { id: "6R55", fam: "seiko-6r", nome: "Seiko 6R55", riserva: 72, finestra: [21, 1], fonte: "ufficiale" }, // guida tecnica Seiko 6R55/6R5J: finestra 21-01, non il 21-3 di famiglia
  { id: "4R35", fam: "seiko-4r", nome: "Seiko 4R35", fonte: "ufficiale" }, // pagina istruzioni Seiko: finestra 21-1, quella di famiglia
  { id: "4R36", fam: "seiko-4r", nome: "Seiko 4R36", giorno: true, finestra: [21, 4], scheda: "seiko-4r35", fonte: "ufficiale" }, // pagina istruzioni Seiko: col giorno della settimana la finestra proibita è 21-4, non 21-1 come il 4R35. La scheda d'archivio si intitola «4R35 / 4R36» e copre entrambi
  { id: "NH35", fam: "seiko-4r", nome: "Seiko NH35 (SII)", fonte: "comunita" },
  { id: "NH36", fam: "seiko-4r", nome: "Seiko NH36 (SII)", giorno: true, finestra: [21, 4], fonte: "comunita" }, // stesso calibro del 4R36

  /* Seiko 6R — qui cambia la riserva, ed è il campo che conta. */
  { id: "6R35", fam: "seiko-6r", nome: "Seiko 6R35", riserva: 70, giri: 55, fonte: "ufficiale" },

  /* Cronografi meccanici. */
  { id: "8R48", fam: "seiko-8r", nome: "Seiko 8R48" },

  /* Seiko alta gamma. */
  { id: "9S65", fam: "seiko-9s", nome: "Grand Seiko 9S65", giri: 55, fonte: "ufficiale" }, // grand-seiko.com
  { id: "8L35", fam: "seiko-8l", nome: "Seiko 8L35", fonte: "ufficiale" }, // stessa ossatura del Grand Seiko 9S55, costruito nello stesso stabilimento ma senza il nome Grand Seiko
  { id: "6139", fam: "seiko-chr-v", nome: "Seiko 6139 (Pogue)", fonte: "comunita" }, // niente carica manuale — eredita mano:false dalla famiglia, confermato dalla scheda, non un dato mancante
  { id: "6138", fam: "seiko-chr-v", nome: "Seiko 6138 (Bullhead)", mano: true, fonte: "comunita" }, // a differenza del 6139, questo HA la carica manuale
  { id: "9S85", fam: "seiko-9s", nome: "Grand Seiko 9S85", ah: 36000, riserva: 55, fonte: "ufficiale" }, // grand-seiko.com
  { id: "5R65", fam: "seiko-5r", nome: "Spring Drive 5R65", fonte: "ufficiale" }, // grand-seiko.com: stesse specifiche del 9R65
  { id: "9R65", fam: "seiko-5r", nome: "Spring Drive 9R65", fonte: "ufficiale" }, // grand-seiko.com

  /* Seiko manuali e a batteria. */
  { id: "5M62", fam: "seiko-kin", nome: "Seiko Kinetic 5M62", fonte: "ufficiale" }, // manuale ufficiale Seiko
  { id: "5M82", fam: "seiko-kin", nome: "Seiko Kinetic 5M82", fonte: "ufficiale" },
  /* Lotto 12 dell'archivio: quarzo puro (VD53) e mecaquarzo (VK64,
     VK67) nella stessa famiglia seiko-q di VK63 — crono:true su tutti,
     è il campo che fa comparire l'avviso sui pulsanti indipendentemente
     dal tipo di comando sotto. VK64 eredita l'autonomia di famiglia
     (26280h = 3 anni): la scheda non la ridichiara per questo modello
     specifico, ma VK67 (stessa base) la conferma esplicitamente. */
  { id: "VD53", fam: "seiko-q", nome: "Seiko VD53 (crono quarzo)", tipo: "quarzo", crono: true, riserva: 17520, fonte: "ufficiale" }, // quarzo puro, non mecaquarzo — secondo centrale dell'orologio, cronografo su quadrantino a ore 6
  { id: "VK64", fam: "seiko-q", nome: "Seiko VK64 (mecaquarzo)", crono: true, fonte: "ufficiale" }, // contatori a ore 3 e 9, diverso dal VK63 e dal VK67
  { id: "VK67", fam: "seiko-q", nome: "Seiko VK67 (mecaquarzo)", crono: true, riserva: 26280, fonte: "ufficiale" }, // stesso layout contatori del VK63, diverso dal VK64

  /* Miyota 8200 — carica a mano sì, arresto no, secondi indiretti. */
  /* --- Svizzera: dal lotto 2 dell'archivio ---------------------------- */
  { id: "2824-2", fam: "eta-2824", nome: "ETA 2824-2", fonte: "comunita" },
  { id: "2836-2", fam: "eta-2824", nome: "ETA 2836-2", giorno: true, finestra: [20, 3], fonte: "comunita" }, // col giorno la finestra si allarga, come per il 4R36
  { id: "SW200-1", fam: "eta-2824", nome: "Sellita SW200-1", riserva: 41, giri: 27, fonte: "ufficiale" }, // scheda tecnica Sellita DocTec_SW200-1_7: 27 giri minimo, con l'automatismo montato; nessuna finestra oraria vietata pubblicata (quella usata prima era importata dal 2824-2)
  { id: "7750", fam: "eta-7750", nome: "ETA 7750 (Valjoux)", riserva: 54, fonte: "ufficiale" }, // eta.ch/shopb2b.eta.ch, pagina di calibro diretta: "Typical power reserve: 54 hours" — più alta dei 42-48 che circolavano da fonti di settore
  { id: "SW500", fam: "eta-7750", nome: "Sellita SW500", riserva: 62, fonte: "ufficiale" }, // sellita.ch DocTec 2023: min 56, tipica 62
  { id: "2892-A2", fam: "eta-2892", nome: "ETA 2892-A2", fonte: "comunita" },
  { id: "MT5602", fam: "tudor-fam", nome: "Tudor MT5602 (senza data)", fonte: "ufficiale" }, // tudorwatch.com — primo automatico interamente Tudor, 2015
  { id: "MT5612", fam: "tudor-fam", nome: "Tudor MT5612", data: true, fonte: "ufficiale" }, // tudorwatch.com — versione con data, sostituisce l'ETA 2824-2 sul Pelagos
  { id: "MT5402", fam: "tudor-fam", nome: "Tudor MT5402", fonte: "ufficiale" }, // famiglia distinta da MT56, non una variante — 26mm per il Black Bay Fifty-Eight
  { id: "STP111", fam: "stp-fam", nome: "STP 1-11", fonte: "comunita" }, // STP ha chiuso le operazioni gen. 2025 secondo fonti di settore — verificare disponibilità prima di contare sul calibro
  { id: "G100", fam: "ljp-fam", nome: "La Joux-Perret G100", fonte: "comunita" }, // derivazione dal Miyota serie 9 dichiarata apertamente dal produttore, non solo sospettata
  { id: "A10", fam: "soprod-fam", nome: "Soprod A10", fonte: "comunita" }, // rinominato M100 dal produttore; su orologi recenti la sigla commerciale può non corrispondere al nome tecnico attuale
  { id: "P9000", fam: "panerai-fam", nome: "Panerai P.9000", fonte: "ufficiale" }, // panerai.com — due bariletti, 3 giorni di riserva
  { id: "P5000", fam: "panerai-fam", nome: "Panerai P.5000", tipo: "manuale", riserva: 192, ah: 21600, fonte: "ufficiale" }, // panerai.com — manuale, 8 giorni di riserva, niente data
  { id: "WEISS1003", fam: "weiss-1003-fam", nome: "Weiss Caliber 1003", fonte: "ufficiale" }, // weisswatchcompany.com — unica vera manifattura della gamma, gli altri sono basi svizzere assemblate
  { id: "WEISS2100", fam: "weiss-assemblato-fam", nome: "Weiss Caliber 2100 (base Eterna 39)", riserva: 65, fonte: "comunita" }, // nessuna fonte sul dominio Weiss trovata per questo specifico calibro
  { id: "WEISS2120", fam: "weiss-assemblato-fam", nome: "Weiss Caliber 2120 (base Soprod M100)", fonte: "ufficiale" },
  { id: "WEISS2130", fam: "weiss-assemblato-fam", nome: "Weiss Caliber 2130 (base contesa: Soprod o ETA)", data: true, fonte: "ufficiale" }, // il sito Weiss si contraddice sulla base fra pagine diverse, riportato come tale nella scheda
  { id: "OMEGA8800", fam: "omega-fam", nome: "Omega 8800", fonte: "ufficiale" }, // omegawatches.com — bariletto singolo, 55h
  { id: "OMEGA8900", fam: "omega-fam", nome: "Omega 8900", riserva: 60, fonte: "ufficiale" }, // omegawatches.com — doppio bariletto in serie, 60h di riserva
  { id: "B01", fam: "breitling-fam", nome: "Breitling B01", fonte: "ufficiale" }, // breitling.com/about/madebybreitling — manifattura propria, non Kenissi
  { id: "IWC59000", fam: "iwc-fam", nome: "IWC Calibre 59000", fonte: "ufficiale" }, // iwc.com — sistema Pellaton, non riconducibile a base ETA
  { id: "HEUER02", fam: "tagheuer-fam", nome: "TAG Heuer Heuer 02", fonte: "ufficiale" }, // tagheuer.com — nessuna parentela con lo Zenith El Primero nonostante lo stesso gruppo LVMH
  { id: "L888", fam: "longines-fam", nome: "Longines L888", fonte: "ufficiale" }, // manuale ufficiale longines.com — finestra data 20:00-03:00 dichiarata esplicitamente
  { id: "L888-5", fam: "longines-fam", nome: "Longines L888.5 (silicio, COSC)", fonte: "ufficiale" }, // stessa base del L888, spirale in silicio e certificazione COSC
  { id: "TISSOTC07", fam: "tissot-c07-fam", nome: "Tissot Powermatic 80", scheda: "tissot-powermatic-80", fonte: "comunita" }, // Tissot non dichiara la sigla ETA sul proprio sito, le immagini ufficiali evitano di inquadrare l'incisione C07
  { id: "H10", fam: "hamilton-c07-fam", nome: "Hamilton H-10", fonte: "comunita" }, // stessa base C07.611 di Certina, non dichiarata esplicitamente sulle pagine Hamilton
  { id: "CERTINAC07", fam: "certina-c07-fam", nome: "Certina Powermatic 80", scheda: "certina-powermatic-80", fonte: "ufficiale" }, // certina.com — l'unico dei tre marchi che dichiara apertamente la sigla ETA e la tecnologia Nivachron
  { id: "MIDOC07", fam: "mido-c07-fam", nome: "Mido Caliber 80", scheda: "mido-caliber-80", fonte: "ufficiale" }, // midowatches.com cita direttamente "ETA C07.621 base" nei propri comunicati — il più esplicito dei quattro marchi C07
  { id: "FC303", fam: "fc-fam", nome: "Frederique Constant FC-303", scheda: "frederiqueconstant-fc-303", fonte: "ufficiale" }, // us.frederiqueconstant.com dichiara apertamente la base Sellita SW200-1; versioni più vecchie della stessa sigla montavano ETA 2824-2
  { id: "RADOR763", fam: "rado-c07-fam", nome: "Rado R763", scheda: "rado-r763", fonte: "ufficiale" }, // rado.com/comunicati ufficiali citano "based on ETA C07.611" esplicitamente
  { id: "ML115", fam: "ml-fam", nome: "Maurice Lacroix ML115", scheda: "mauricelacroix-ml115", fonte: "ufficiale" }, // base Sellita SW200-1 dichiarata apertamente; antiurto Incabloc invece del Novodiac standard del grado Special, motivo non chiarito da nessuna fonte
  { id: "INOXAUTO", fam: "victorinox-fam", nome: "Victorinox I.N.O.X. Automatic", scheda: "victorinox-inox-automatic", fonte: "ufficiale" }, // victorinox.com dichiara "Sellita caliber SW200-1" per esteso; le linee gemelle Mechanical e Alliance montano basi ETA diverse, non coperte qui
  { id: "BVL138", fam: "bulgari-fam", nome: "Bulgari BVL 138 Finissimo", scheda: "bulgari-bvl-138", fonte: "ufficiale" }, // manifattura vera, 2,23mm — record di sottigliezza automatico del 2017, superato pochi mesi dopo da Piaget
  { id: "P900PUC", fam: "piaget-fam", nome: "Piaget 900P-UC (Altiplano Ultimate Concept)", scheda: "piaget-900p-uc", fonte: "ufficiale" }, // 2,00mm l'orologio intero, non solo il movimento — record diverso da quello Bulgari, misura diversa
  { id: "UN118", fam: "un-fam", nome: "Ulysse Nardin UN-118", scheda: "ulyssenardin-un-118", fonte: "ufficiale" }, // scappamento DIAMonSIL senza lubrificazione — la gamma Diver più economica monta invece l'UN-816, base Sellita SW300
  { id: "BREGUET777A", fam: "breguet-fam", nome: "Breguet 777A", scheda: "breguet-777a", fonte: "ufficiale" }, // dichiarato in-house ma nato come architettura Lemania, oggi gruppo Swatch — non ebauche esterno comprato oggi, ma nemmeno progetto Breguet puro dal principio
  { id: "BLANCPAIN1315", fam: "blancpain-fam", nome: "Blancpain 1315", scheda: "blancpain-1315", fonte: "ufficiale" }, // 120 ore da tre bariletti in serie — la riserva più lunga di questo archivio; pagina di calibro dedicata blancpain.com/en/caliber/1315
  { id: "BRCAL302", fam: "bellross-fam", nome: "Bell & Ross BR-CAL.302", scheda: "bellross-br-cal-302", fonte: "comunita" }, // base Sellita SW300-1, trasparenza a metà — dichiarata in comunicati e riviste ma non nel marketing standard del marchio
  { id: "GO9214", fam: "glashutte-fam", nome: "Glashütte Original 92-14", scheda: "glashuetteoriginal-92-14", fonte: "ufficiale" }, // 2025, sostituisce il 90-02 con un salto da 42 a 100 ore di riserva; spirale in silicio ma produzione interna non confermata
  { id: "DOXASUB", fam: "doxa-fam", nome: "Doxa SUB", scheda: "doxa-sub", fonte: "comunita" }, // uno dei marchi più opachi incontrati in archivio — "Swiss mechanical automatic" senza sigla nei materiali standard
  { id: "GP01800", fam: "gp-fam", nome: "Girard-Perregaux GP01800", scheda: "girardperregaux-gp01800", fonte: "ufficiale" }, // manifattura verticale confermata su fonte diretta, non solo rivendicata; dati di marcia posizionali pubblicati
  { id: "VULCAINV10", fam: "vulcain-fam", nome: "Vulcain V-10 (Cricket)", scheda: "vulcain-v-10", fonte: "ufficiale" }, // unico calibro dell'archivio con sveglia meccanica, bariletto separato per l'allarme — la doppia riserva resta solo in prosa, nessun campo dedicato
  { id: "JLC953", fam: "jlc-mr-fam", nome: "Jaeger-LeCoultre 953", scheda: "jaegerlecoultre-953", fonte: "ufficiale" }, // prima ripetizione minuti vera dell'archivio — gong in cristallo saldati allo zaffiro, martelletto a trabucco
  { id: "PATEK240HU", fam: "patek-hu-fam", nome: "Patek Philippe 240 HU", scheda: "patek-240-hu", fonte: "ufficiale" }, // primo worldtimer vero dell'archivio con corona delle città rotante — non un GMT travestito
  { id: "ENG376", fam: "bremont-fam", nome: "Bremont ENG376", scheda: "bremont-eng300", fonte: "ufficiale" }, // bremont.com — base K1 svizzera (THE+), diritti acquistati e 80% ridisegnato in Inghilterra. Scheda d'archivio sotto il nome di famiglia ENG300, non ENG376: senza questo override i due id non si sarebbero mai agganciati
  { id: "ORIS400", fam: "oris-fam", nome: "Oris Calibre 400", fonte: "ufficiale" }, // oris.ch — resistenza magnetica 2.250 gauss e riserva 5 giorni, entrambi dati tecnici veri
  { id: "LUC9640L", fam: "chopard-fam", nome: "Chopard L.U.C 96.40-L", fonte: "ufficiale" }, // chopard.com — micro-rotore oro 22kt, Poinçon de Genève
  { id: "SH21", fam: "christopherward-fam", nome: "Christopher Ward SH21", fonte: "ufficiale" }, // christopherward.com — solo sull'edizione Twelve X, il Twelve standard monta Sellita SW300-1/SW330
  { id: "V5000", fam: "venezianico-fam", nome: "Venezianico V5000", fonte: "ufficiale" }, // venezianico.com — sviluppato con OISA 1937, il calibro più recente dell'archivio (2025)
  { id: "6497-1", fam: "eta-unitas", nome: "ETA 6497-1", fonte: "comunita" },
  { id: "6498-1", fam: "eta-unitas", nome: "ETA 6498-1", scheda: "eta-6497-1", fonte: "comunita" }, // stesso movimento del 6497, piccoli secondi a ore 6 invece che a ore 9: una scheda sola per entrambi, che dichiara la differenza
  { id: "715", fam: "ronda-q", nome: "Ronda 715", fonte: "comunita" },
  /* --- Cina: dal lotto 4 dell'archivio -------------------------------- */
  { id: "ST3600", fam: "eta-unitas", nome: "Sea-Gull ST3600", ah: 21600, fonte: "ufficiale" }, // clone dichiarato del 6497 — riserva 46h coincide col default famiglia, ah 21.600 diverge dal 6497 originale (18.000): calibro cinese a frequenza diversa dal modello ETA
  { id: "ST1901", fam: "seagull-vm", nome: "Sea-Gull ST1901 (cronografo)", fonte: "comunita" }, // NON è un clone del 6497: ruota a colonne, deriva dal Venus 175
  { id: "ST2130", fam: "eta-2824", nome: "Sea-Gull ST2130", fonte: "comunita" },
  { id: "PT5000", fam: "pt-fam", nome: "PT5000", riserva: 38, fonte: "comunita" }, // nato 2015 da Chongqing Watch Co. + HK Precision Technology (casa madre): non produttori in lite, stesso gruppo da due nomi. Hangzhou è un'attribuzione errata che circola
  { id: "6300", fam: "hangzhou-fam", nome: "Hangzhou 6300", riserva: 38, ah: 28800, fonte: "ufficiale" }, // pagina produttore hzwatch.com, variante 6300A-3: 28 rubini, 26,00mm, 4,92mm — ATTENZIONE: alcune fonti lo descrivono come manuale a 18.000 A/h — descrizione che non regge, vedi archivio
  { id: "SL3000", fam: "peacock-fam", nome: "Peacock SL3000", riserva: 41, ah: 28800, fonte: "ufficiale" },
  /* Lotto 11 dell'archivio, aggiunti nella stessa sessione per regola
     permanente — non un giro a parte. SL3006/3032 condividono la base
     2824-2 di peacock-fam. SL3034 deriva dal 2834-2 (giorno+data):
     giorno:true sovrascrive la famiglia, che non ce l'ha. SL4609/4801
     sono cronografi veri, non varianti della linea SL3 — tipo e riserva
     dichiarati per intero, non ereditati da peacock-fam. */
  { id: "SL3006", fam: "peacock-fam", nome: "Peacock SL3006", riserva: 41, ah: 28800, fonte: "ufficiale" }, // piccoli secondi a ore 6, non al centro
  { id: "SL3032", fam: "peacock-fam", nome: "Peacock SL3032 (GMT)", ah: 28800, fonte: "ufficiale" }, // riserva non ridichiarata dalla fonte per questo modello specifico: eredita i 42h di famiglia, non confermati
  { id: "SL3034", fam: "peacock-fam", nome: "Peacock SL3034 (giorno-data)", giorno: true, riserva: 41, ah: 28800, fonte: "comunita" }, // deriva dal 2834-2, non dal 2824-2 come gli altri SL3 — due calendari armati, finestra prudente più ampia
  { id: "SL4609", fam: "peacock-fam", nome: "Peacock SL4609 (cronografo)", tipo: "cronografo", crono: true, riserva: 42, ah: 28800, fonte: "comunita" }, // base 7750, camma non ruota a colonne — scatto secco all'avvio, non confondere col gemello
  { id: "SL4801", fam: "peacock-fam", nome: "Peacock SL4801 (cronografo)", tipo: "cronografo", crono: true, riserva: 42, ah: 28800, fonte: "ufficiale" }, // ruota a colonne vera, colpo pieno dei pulsanti — non è un clone stretto del Rolex 4130
  { id: "SL5200", fam: "peacock-tourbillon-fam", nome: "Peacock SL5200 (tourbillon)", fonte: "ufficiale" }, // peacock1957.com — riserva ≥48h dichiarata per intero
  { id: "SL5812", fam: "peacock-tourbillon-fam", nome: "Peacock SL5812 (tourbillon)", ah: 28800, fonte: "ufficiale" }, // peacock1957.com — riserva NON dichiarata dalla fonte: eredita la stima di famiglia (48h), non confermata per questo modello specifico
  { id: "9452MC", fam: "cartier-fam", nome: "Cartier 9452 MC (tourbillon)", fonte: "ufficiale" }, // cartier.com — riserva dichiarata "attorno alle cinquanta ore"
  { id: "R184", fam: "lip-fam", nome: "Lip R184 (Datolip)", fonte: "comunita" }, // fonti collezionistiche — riserva 17.520h (2 anni) è una STIMA per la batteria adattatore moderna, non un dato dichiarato: il pezzo è fuori produzione dal 1977
  { id: "ACCUTRON214", fam: "bulova-fam", nome: "Bulova Accutron 214", fonte: "comunita" }, // fonti collezionistiche — riserva stimata, non dichiarata: stesso motivo del Lip R184
  { id: "ACCUTRON218", fam: "bulova-fam", nome: "Bulova Accutron 218", fonte: "comunita" }, // fonti collezionistiche — riserva stimata, non dichiarata
  { id: "6460", fam: "hangzhou-fam", nome: "Hangzhou 6460 (GMT)", fonte: "comunita" },
  { id: "DG2813", fam: "generic-2813", nome: "DG2813 (progetto multi-fabbrica)", fonte: "comunita" }, // "2813" non è un calibro solo: più fabbriche lo costruiscono, verificare il marchio sotto il bilanciere
  { id: "5030-D", fam: "ronda-mecaquarzo", nome: "Ronda 5030.D (mecaquarzo)", crono: true, riserva: 39420, finestra: [21, 0], fonte: "ufficiale" }, // manuale ufficiale ronda.ch: finestra data 21:00-mezzanotte, procedura di azzeramento a tre passaggi dopo cambio batteria
  { id: "CMM10", fam: "yema-fam", nome: "Yema CMM.10", fonte: "ufficiale" }, // primo automatico interamente francese da 70 anni, secondo Yema; bariletto unico Générale Ressorts, 70h a 28.800 A/h
  { id: "CALIBRE-ROYAL", fam: "pequignet-fam", nome: "Pequignet Calibre Royal", riserva: 88, ah: 21600, fonte: "ufficiale" }, // manifattura vera, non base ETA — 318 componenti, sviluppo documentato su pequignet.com
  /* --- Russia ed ex-URSS: dal lotto 5 dell'archivio -------------------- */
  { id: "2409", fam: "vostok-m", nome: "Vostok 2409", fonte: "comunita" },
  { id: "2414", fam: "vostok-m", nome: "Vostok 2414 (data)", data: true, fonte: "comunita" }, // manovra di correzione diversa dal 2409, non la stessa scheda
  { id: "2416B", fam: "vostok-a", nome: "Vostok 2416B", finestra: [22, 2], fonte: "ufficiale" }, // online.vostokinc.ru/uxod-za-chasami, pagina di cura ufficiale (generale, non specifica del calibro ma applicabile: stesso meccanismo di calendario descritto in scheda). Fonti in disaccordo sulla correzione rapida della data: la scheda consiglia il metodo con le lancette
  { id: "2609", fam: "raketa-m", nome: "Raketa 2609.\u041d\u0410", fonte: "comunita" }, // fonti interne al produttore in disaccordo su rubini e riserva, riportate entrambe nella scheda
  { id: "2623", fam: "raketa-m", nome: "Raketa 2623.\u041d", fonte: "comunita" },
  { id: "2615", fam: "raketa-a", nome: "Raketa Avtomat 2615", fonte: "comunita" }, // l'automatico moderno di Petrodvorec, dal 2014; non esiste un "2432"
  { id: "2427", fam: "slava-m", nome: "Slava 2427", fonte: "ufficiale" }, // slava.su, articolo del produttore attuale: precisione di targa -25/+60 s/giorno e repassage completo dichiarato prima del montaggio. Rubini/alternanze/riserva restano contraddittori, non sciolti da questa fonte
  { id: "3133", fam: "poljot-cr", nome: "Poljot 3133 (cronografo)", riserva: 42, fonte: "comunita" }, // fuori produzione dal 2011 (chiusura MakTime)
  /* --- Stati Uniti: dal lotto 6 dell'archivio --------------------------
     Storici (Hamilton, Elgin, Waltham) fuori produzione: il blocco «Come
     si cura» dell'archivio per questi parla di conservazione, non di
     manutenzione ordinaria. RGM è manifattura attiva. */
  { id: "992B", fam: "hamilton-r", nome: "Hamilton 992B", fonte: "comunita" }, // fuori produzione, fine linea ferroviaria Hamilton
  { id: "1857", fam: "waltham-m", nome: "Waltham Model 1857", fonte: "comunita" }, // fuori produzione, azienda originale non più esistente in questa forma
  { id: "571", fam: "elgin-m", nome: "Elgin 571", fonte: "comunita" }, // fuori produzione, Elgin ha chiuso nel 1968
  { id: "4992B", fam: "hamilton-r", nome: "Hamilton 4992B (navigatore)", arresto: true, fonte: "comunita" }, // fuori produzione; deriva dal 992B con l'arresto dei secondi in più
  { id: "770", fam: "hamilton-r", nome: "Hamilton 770", fonte: "comunita" }, // fuori produzione
  { id: "921", fam: "hamilton-r", nome: "Hamilton 921", fonte: "comunita" }, // fuori produzione, anno di fine dichiarato in modo discorde fra le fonti (1954 o 1957)
  { id: "RGM801", fam: "rgm-m", nome: "RGM Caliber 801", riserva: 42, fonte: "ufficiale" }, // rgmwatches.com: riserva 40-44h, qui il valore medio
  { id: "RGM20", fam: "rgm-m", nome: "RGM Caliber 20", fonte: "comunita" }, // RGM non pubblica la riserva per questo calibro specifico: le 40-44h che circolano sono dell'801, non sue
  /* --- Germania: dal lotto 7 dell'archivio ------------------------------
     Il DUW 6101 è l'unico calibro dell'archivio con correzione della data
     nei due sensi: la finestra proibita esiste comunque (90 minuti), ma è
     Nomos stessa a dichiararla. Glashütte Original e Union restano fuori:
     nessuna scheda tecnica pubblica, solo pagine di prodotto. */
  { id: "ALPHA", fam: "nomos-m", nome: "Nomos Alpha", fonte: "comunita" },
  { id: "DUW-3001", fam: "nomos-a", nome: "Nomos DUW 3001", fonte: "comunita" },
  { id: "DUW-6101", fam: "nomos-a", nome: "Nomos DUW 6101", giorno: false, notaData: "g.data.90min", fonte: "ufficiale" }, // nomos-glashuette.com: correzione data nei due sensi, finestra 90 minuti
  { id: "MU-9413", fam: "muehle-a", nome: "M\u00fchle MU 9413", fonte: "comunita" },
  { id: "SZ01", fam: "sinn-a", nome: "Sinn SZ01", fonte: "comunita" },
  { id: "L1211", fam: "lange-m", nome: "A. Lange & S\u00f6hne L121.1", riserva: 72, fonte: "comunita" }, // specifiche da pagine di prodotto, non da scheda tecnica di calibro dedicata
  /* --- Alta orologeria: dal lotto 9 dell'archivio -----------------------
     Nessuna delle quattro case pubblica un intervallo di revisione: le
     schede lo dichiarano di fonte di settore, non del produttore. Sul
     3135 il perno del rotore su bronzina (non a sfere) è la ragione
     tecnica per cui qui la revisione conta più che sulla media. */
  { id: "3135", fam: "rolex-a", nome: "Rolex 3135", fonte: "comunita" }, // rotore su bronzina, non cuscinetti a sfere
  { id: "3235", fam: "rolex-a", nome: "Rolex 3235", riserva: 70, fonte: "comunita" },
  { id: "4130", fam: "rolex-cr", nome: "Rolex 4130 (Daytona)", fonte: "comunita" },
  { id: "AP3120", fam: "ap-a", nome: "AP 3120", fonte: "comunita" },
  { id: "AP4302", fam: "ap-a", nome: "AP 4302", data: true, fonte: "comunita" },
  { id: "324", fam: "patek-a", nome: "Patek 324", fonte: "comunita" }, // superato in produzione corrente dal 26-330, tenuto perché ancora il più diffuso sui polsi
  { id: "240", fam: "patek-a", nome: "Patek 240 (ultrapiatto)", riserva: 48, fonte: "comunita" },
  { id: "2460", fam: "vacheron-a", nome: "Vacheron 2460", fonte: "comunita" },
  /* --- Alta orologeria 2: dal lotto 10 dell'archivio -------------------
     L'899 ha una contraddizione che tocca direttamente questo campo: JLC
     chiama "899" sia il calibro pre-2020 (43h) sia l'aggiornamento 899AC
     (70h), e dal nome non si distingue quale hai. Tenuta la cifra
     prudente: chi ha in realtà l'899AC lo scoprirà caricato prima del
     previsto, non a corto di riserva. */
  { id: "899", fam: "jlc-a", nome: "JLC 899 (o 899AC — stessa sigla, due calibri)", fonte: "comunita" },
  { id: "896", fam: "jlc-a", nome: "JLC 896 (Master Ultra Thin)", data: false, fonte: "comunita" }, // riserva specifica non trovata: quella dell'899 non va estesa per deduzione
  { id: "381", fam: "jlc-a", nome: "JLC 381 (Duomètre, Dual-Wing)", mano: true, riserva: 50, ah: 21600, fonte: "comunita" }, // due bariletti indipendenti, 50h ciascuno
  { id: "ELPRIMERO400", fam: "zenith-cr", nome: "Zenith El Primero 400", fonte: "comunita" },
  { id: "ELPRIMERO410", fam: "zenith-cr", nome: "Zenith El Primero 410 (calendario completo)", fonte: "comunita" },
  { id: "L0931", fam: "lange-m", nome: "Lange L093.1 (Saxonia Thin)", ah: 21600, riserva: 72, fonte: "comunita" },
  { id: "L9515", fam: "lange-m", nome: "Lange L951.5 (1815 Chronograph)", ah: 18000, riserva: 60, fonte: "comunita" }, // cronografo a ruota a colonne, non l'automatico entry-level come si pensava all'inizio
  { id: "1304", fam: "journe-m", nome: "F.P.Journe 1304 (Chronomètre Souverain)", fonte: "comunita" },
  { id: "F6922", fam: "orient-f6", nome: "Orient F6922", finestra: [20, 4], fonte: "comunita" }, // calibercorner (già in bibliografia, non letta fino in fondo la prima volta): 20-4, più larga dei calibri Orient con la sola data perché qui c'è anche il giorno
  { id: "F6724", fam: "orient-f6", nome: "Orient F6724", fonte: "comunita" },
  { id: "F7F44", fam: "orient-star-fam", nome: "Orient Star F7F44", fonte: "ufficiale" }, // orient-watch.com — non ha il Poinçon de Genève, solo finiture Côtes de Genève decorative
  { id: "46943", fam: "orient-46-fam", nome: "Orient 46943", fonte: "comunita" }, // nessuna carica manuale: la corona non arma mai la molla su questo calibro
  { id: "9075", fam: "miyota-90", nome: "Miyota 9075 (GMT)", fonte: "ufficiale" }, // senso di carica: la scheda spec Miyota (uploads/product, non la pagina prodotto) dà la serie 90/91/6T in senso orario, opposto all'82/8N
  { id: "8215", fam: "miyota-82", nome: "Miyota 8215", giri: 40, fonte: "comunita" },
  { id: "8205", fam: "miyota-82", nome: "Miyota 8205", giorno: true, finestra: [21, 1], finestraGiorno: [1, 4.5], fonte: "ufficiale" }, // scheda tecnica Miyota 8205/8215/820A/821A: due finestre distinte, data 21-1 e giorno 1-4:30
  { id: "82S5", fam: "miyota-82", nome: "Miyota 82S5 (open heart)", fonte: "ufficiale" }, // finestra sul bilanciere, secondi decentrati — arresto incerto secondo l'epoca di produzione, eredita false di famiglia
  { id: "82S7", fam: "miyota-82", nome: "Miyota 82S7 (open heart, 24h)", fonte: "ufficiale" }, // come 82S5 con indicatore 24 ore aggiuntivo

  /* Miyota 9000 — la serie buona. */
  { id: "9015", fam: "miyota-90", nome: "Miyota 9015", fonte: "ufficiale" }, // senso di carica orario: stessa scheda spec Miyota trovata per il 9075, già fra le fonti di questa scheda e non letta fino in fondo
  { id: "9039", fam: "miyota-90", nome: "Miyota 9039 (senza data)", data: false, fonte: "ufficiale" }, // il 9015 senza data, non la variante open-heart come si pensava all'inizio — quella è la famiglia 82S
  /* Lotto 12: cronografi al quarzo. 0S10/0S20/0S60 con lo zero, non la
     lettera O — sigla corretta contro l'errore diffuso fra i
     rivenditori. 0S20 eredita l'autonomia della famiglia (stessa
     batteria dell'0S10, 5 anni non ridichiarati per questo modello
     specifico). JS15/JS25 idem sulla batteria — mai dichiarata negli
     anni nella fonte, resta l'autonomia di famiglia. */
  { id: "0S10", fam: "miyota-q", nome: "Miyota 0S10 (crono quarzo)", crono: true, fonte: "ufficiale" },
  { id: "0S20", fam: "miyota-q", nome: "Miyota 0S20 (crono quarzo, 24h)", crono: true, fonte: "ufficiale" },
  { id: "0S60", fam: "miyota-q", nome: "Miyota 0S60 (crono quarzo, 1/20s)", crono: true, data: true, riserva: 17520, fonte: "ufficiale" },
  { id: "JS15", fam: "miyota-q", nome: "Miyota JS15 (crono quarzo)", crono: true, data: true, fonte: "ufficiale" }, // pulsante descritto dal produttore stesso come "satisfying click feel"
  { id: "JS25", fam: "miyota-q", nome: "Miyota JS25 (crono quarzo)", crono: true, data: true, fonte: "ufficiale" },

  /* Citizen. */
  { id: "E168", fam: "citizen-eco", nome: "Citizen Eco-Drive E168", fonte: "ufficiale" }, // dati di carica Citizen
  { id: "J810", fam: "citizen-eco", nome: "Citizen Eco-Drive J810", riserva: 5760, fonte: "comunita" },
  { id: "B620", fam: "citizen-eco", nome: "Citizen Eco-Drive B620", riserva: 6480, fonte: "comunita" }, // 270 giorni, non il default di famiglia
  { id: "H800", fam: "citizen-eco", nome: "Citizen Eco-Drive H800 (radiocontrollato)", riserva: 4320, fonte: "ufficiale" }, // manuale ufficiale: 6 mesi in uso normale, 10 in risparmio energia — uso il primo
  { id: "E650", fam: "citizen-eco", nome: "Citizen Eco-Drive E650 (crono)", crono: true },
  { id: "8730", fam: "citizen-eco", nome: "Citizen Eco-Drive 8730" },
];

/* Un calibro eredita dalla famiglia: nel database sta solo ciò che differisce. */
function risolviCalibro(id) {
  const c = CALIBRI.find((x) => x.id === id);
  if (!c) return null;
  const f = FAMIGLIE.find((x) => x.id === c.fam);
  /* Se il singolo calibro non dichiara una fonte, il dato arriva dalla
     famiglia: è "derivato", e va detto. */
  return { ...f, ...c, id: c.id, nome: c.nome, famiglia: f.nome, marca: f.marca,
           fonte: c.fonte || "derivato" };
}

function risolviFamiglia(id) {
  const f = FAMIGLIE.find((x) => x.id === id);
  return f ? { ...f, famiglia: f.nome } : null;
}

function cercaCalibri(testo) {
  const t = testo.trim().toLowerCase();
  const tutti = [
    ...CALIBRI.map((c) => ({ id: c.id, nome: c.nome, sotto: risolviCalibro(c.id).famiglia, fam: false })),
    ...FAMIGLIE.map((f) => ({ id: f.id, nome: f.nome, sotto: "tutta la famiglia", fam: true })),
  ];
  if (!t) return tutti.slice(0, 40);
  return tutti.filter((x) => (x.nome + " " + x.sotto).toLowerCase().includes(t)).slice(0, 40);
}
