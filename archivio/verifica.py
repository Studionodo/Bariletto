# -*- coding: utf-8 -*-
"""
Verifica di contenuto — non di sintassi.

Nasce da un bug preciso: uno script passato per heredoc bash si era
interrotto su un apostrofo mal protetto e non aveva scritto niente. I
controlli lanciati subito dopo erano passati tutti, perché controllavano
che i file non fossero rotti — non che contenessero l'aggiunta prevista.
Un controllo superficiale che passa non dimostra che il lavoro sia fatto
bene: dimostra solo che non è esploso niente.

Qui si controlla il contrario: che le cose che devono esserci ci siano
davvero, e che i numeri tornino.

Uso: python3 archivio/verifica.py
Esce con codice 1 se qualcosa non torna, così il rilascio si ferma.
"""
import json
import pathlib
import re
import sys

RADICE = pathlib.Path(__file__).parent.parent
CARTELLA = pathlib.Path(__file__).parent

sys.path.insert(0, str(CARTELLA))
from costruisci import ID_LOTTO1  # stessa mappa usata dal generatore, non una copia

errori = []
avvisi = []


def leggi(nome):
    p = RADICE / nome
    if not p.exists():
        errori.append(f"manca il file {nome}")
        return ""
    return p.read_text(encoding="utf-8")


# --- 1. l'archivio generato corrisponde alle schede sorgente -----------
# Se qualcuno modifica un .md e dimentica di rilanciare costruisci.py,
# movimenti.js resta indietro senza che niente lo segnali.

schede_md = 0
for f in sorted(CARTELLA.glob("*.md")):
    t = f.read_text(encoding="utf-8")
    ha_id = "<!-- id:" in t
    for blocco in re.split(r"\n---\n", t):
        blocco = blocco.strip()
        if not blocco.startswith("## "): continue
        titolo = blocco.split("\n")[0][3:].strip()
        if ha_id:
            # Stessa regola di costruisci.py: conta solo con un
            # <!-- id --> proprio e valido. Un blocco ## senza id — una
            # scheda scartata con motivazione, scritta apposta nello
            # stesso formato delle altre — non è una scheda mancata, è
            # un'esclusione dichiarata: SALTATA da costruisci.py, e non
            # deve contare qui.
            m = re.search(r'<!-- id: ([^|]+)\| paese: ([^|]+)\| marca: ([^>]+)-->', blocco)
            if m and m.group(1).strip() != "DA DEFINIRE":
                schede_md += 1
        elif titolo in ID_LOTTO1:
            # File senza id inline (oggi solo lotto-1.md): costruisci.py
            # risolve per titolo tramite ID_LOTTO1, importato qui sopra
            # dalla stessa fonte — non una copia che rischia di
            # disallinearsi.
            schede_md += 1
        # Se non è né l'uno né l'altro, costruisci.py stampa "SALTATA
        # (nessuna mappatura id)" e scarta: non contarlo nemmeno qui.

movimenti = leggi("movimenti.js")
schede_js = len(re.findall(r'^\s{4}id: "', movimenti, re.M))

if schede_md != schede_js:
    errori.append(
        f"l'archivio è disallineato: {schede_md} schede nei .md, "
        f"{schede_js} in movimenti.js. Rilancia archivio/costruisci.py"
    )

# Nessuna scheda deve arrivare in produzione con i blocchi italiani
# vuoti: quelli sono la base, mai opzionali.
for vuoto in re.findall(r'id: "([^"]+)",\n\s+nome: "[^"]*",\n\s+paese: "[^"]*",\n'
                        r'\s+paese_en: "[^"]*",\n\s+marca: "[^"]*",\n\s+fatto: "",', movimenti):
    errori.append(f'la scheda "{vuoto}" ha il blocco "Com\'è fatto" vuoto')

# paese_en viene da una tabella fissa di sei nomi, non da una traduzione
# manuale: non ha senso che sia vuoto, a differenza dei blocchi di prosa.
for vuoto in re.findall(r'id: "([^"]+)",\n\s+nome: "[^"]*",\n\s+paese: "[^"]*",\n\s+paese_en: "",', movimenti):
    errori.append(f'la scheda "{vuoto}" ha paese_en vuoto: manca dalla tabella PAESE_EN in costruisci.py')

# Ogni scheda deve citare almeno una fonte: è la regola fondativa
# dell'archivio, e vale la pena che sia una macchina a farla rispettare.
for senza in re.findall(r'id: "([^"]+)",(?:(?!id: ")[\s\S])*?fonti: \[\],', movimenti):
    errori.append(f'la scheda "{senza}" non cita nessuna fonte')

# La copertura inglese è arrivata al 100% il 16 agosto 2026, e da quel
# giorno è una regola permanente: ogni scheda nuova porta la traduzione
# fin dall'inizio, non "dopo". Da qui in avanti un campo _en vuoto non è
# più uno stato atteso in attesa del prossimo blocco di traduzione —
# è un errore che blocca il rilascio, esattamente come un blocco
# italiano vuoto. Se emerge un errore qui, la scheda nuova non ha
# rispettato la regola fissata in quella sessione.
BLOCCHI = [("fatto_en", "Com'è fatto (EN)"), ("cura_en", "Come si cura (EN)"),
           ("normale_en", "Cosa è normale (EN)")]
for campo, nome_blocco in BLOCCHI:
    for vuoto in re.findall(r'id: "([^"]+)",(?:(?!id: ")[\s\S])*?' + campo + r': "",', movimenti):
        errori.append(f'la scheda "{vuoto}" ha il blocco "{nome_blocco}" vuoto — '
                       f'regola permanente dal 16/08/2026: ogni scheda nuova porta la sua traduzione')

tradotte = len(re.findall(r'fatto_en: "(?!")', movimenti))


# --- 2. i due dizionari sono allineati ---------------------------------
# Una chiave presente in italiano e assente in inglese non rompe niente:
# t() ripiega sull'italiano. Ma l'utente inglese vede una frase italiana
# in mezzo alle sue, e nessun controllo di sintassi se ne accorge.

lingua = leggi("lingua.js")

# Il blocco inglese è l'ultimo: senza tagliarlo alla chiusura di VOCI,
# le funzioni in coda al file (t, plurale, cambiaLingua) finivano dentro
# e portavano con sé chiavi inesistenti come "chiave" e "valore".
corpo_voci = lingua.split("const VOCI = {", 1)[-1].split("\n};", 1)[0]
blocchi = re.split(r"\n  (it|en): \{", corpo_voci)
chiavi = {}
for i in range(1, len(blocchi) - 1, 2):
    nome, corpo = blocchi[i], blocchi[i + 1]
    # Due forme: "chiave.composta": ... e chiaveNuda: ...
    trovate = set(re.findall(r'"([^"]+)":\s', corpo))
    trovate |= set(re.findall(r'(?:^|[{,])\s*([A-Za-z_][A-Za-z0-9_]*):\s', corpo, re.M))
    chiavi[nome] = trovate

if "it" in chiavi and "en" in chiavi:
    manca_en = chiavi["it"] - chiavi["en"]
    manca_it = chiavi["en"] - chiavi["it"]
    if manca_en:
        errori.append("chiavi senza traduzione inglese: " + ", ".join(sorted(manca_en)))
    if manca_it:
        errori.append("chiavi senza originale italiano: " + ", ".join(sorted(manca_it)))
else:
    errori.append("non riesco a leggere i due blocchi di lingua.js")


# --- 3. ogni t("chiave") usata esiste davvero --------------------------
# t() su una chiave inesistente restituisce la chiave stessa: in pagina
# compare "bak.esporta" invece della frase. Non è un errore, è peggio.

# Il confine davanti alla t è obbligatorio: senza, createElement("a")
# finiva letto come t("a") e l'elenco si riempiva di chiavi fantasma che
# non erano mai state cercate da nessuno.
usate = set()
for nome in ("oggi.js", "altro.js", "foglio.js", "cornice.js", "dominio.js", "archivio.js"):
    usate |= set(re.findall(r'(?<![A-Za-z0-9_.])t\("([^"]+)"', leggi(nome)))
# Le chiavi composte per concatenazione — t("stato." + s) — arrivano qui
# come prefisso spezzato: si scartano, i loro valori stanno in DINAMICHE.
usate = {k for k in usate if not k.endswith(".")}

# Le chiavi composte a runtime (t("stato." + s), t(v.azione)) non si
# possono verificare staticamente: si elencano qui una volta sola.
DINAMICHE = {"stato.moto", "stato.riserva", "stato.fermo", "stato.scarico",
             "stato.azionare", "reg.portato", "reg.caricato", "crono.segnato",
             "t.automatico", "t.manuale", "t.cronografo", "t.ecodrive",
             "t.kinetic", "t.springdrive", "t.quarzo",
             "fonte.ufficiale", "fonte.comunita", "fonte.derivato",
             "g.data.24h", "g.data.90min"}

if "it" in chiavi:
    fantasma = {k for k in usate if k not in chiavi["it"]} - DINAMICHE
    if fantasma:
        errori.append("chiavi usate ma mai definite: " + ", ".join(sorted(fantasma)))


# --- 4. i calibri agganciano l'archivio come previsto ------------------
# Il numero di calibri che trovano una scheda è il dato che descrive la
# copertura reale. Se cala fra un rilascio e l'altro, qualcosa si è
# scollegato in silenzio: un id cambiato, una famiglia rinominata.

calibri = leggi("calibri.js")
n_calibri = len(re.findall(r'\{ id: "[^"]+", fam: "', calibri))
n_famiglie = len(re.findall(r'\{ id: "[^"]+",\s*marca: "', calibri))

# Ogni fam citata da un calibro deve esistere come id dichiarato.
tutti_id = set(re.findall(r'\{\s*id: "([^"]+)"', calibri))
for fam in set(re.findall(r'fam: "([^"]+)"', calibri)):
    if fam not in tutti_id:
        errori.append(f'il calibro punta alla famiglia "{fam}", che non esiste')

# Ogni scheda: "..." deve puntare a una voce vera dell'archivio.
id_archivio = set(re.findall(r'^\s{4}id: "([^"]+)"', movimenti, re.M))
for sch in set(re.findall(r'scheda: "([^"]+)"', calibri)):
    if sch not in id_archivio:
        errori.append(f'un calibro rimanda alla scheda "{sch}", che non è in archivio')

# Nessun calibro orfano: stessa regola di trovaVoceArchivio() in
# dominio.js, non un'approssimazione. Fissata dopo che i due contatori
# della pagina Registro ("Archivio dei movimenti" e "Cerca nel
# catalogo") si erano scollegati per mesi senza che niente lo segnalasse
# — quattro calibri Grand Seiko e uno La Joux-Perret con scheda scritta
# ma mai raggiungibile dall'app, scoperti solo con un audit manuale.
# Da qui in poi il rilascio si ferma da solo, non serve ricordarselo.
def pulisci(s):
    return re.sub(r"-", "", s.upper())

righe_calibro = re.findall(r'\{ id: "([^"]+)", fam: "([^"]+)"(.*?)\}', calibri)
for cid, cfam, resto in righe_calibro:
    nudo = pulisci(cid)
    # 1. scheda: esplicita, già verificata sopra come esistente
    m_scheda = re.search(r'scheda: "([^"]+)"', resto)
    if m_scheda:
        continue
    # 2. id diretto o marca-composta: prova a tagliare a ogni trattino
    trovato = False
    for aid in id_archivio:
        if pulisci(aid) == nudo:
            trovato = True
            break
        parti = aid.split("-")
        if any(pulisci("-".join(parti[i:])) == nudo for i in range(1, len(parti))):
            trovato = True
            break
    if trovato:
        continue
    # 3. fallback sulla famiglia: l'id della famiglia esiste in archivio?
    if cfam in id_archivio:
        continue
    errori.append(
        f'il calibro "{cid}" non risolve nessuna scheda d\'archivio '
        f'(né diretta, né tramite scheda:, né tramite la famiglia "{cfam}") — '
        f'toglilo dal catalogo o collegalo con scheda: "..."'
    )


# --- 5. il service worker è stato incrementato -------------------------
# Dimenticarlo significa che l'aggiornamento non parte e nessuno se ne
# accorge finché non manca una cosa che dovrebbe esserci.

sw = leggi("sw.js")
m = re.search(r'const CACHE = "([^"]+)"', sw)
cache = m.group(1) if m else None
if not cache:
    errori.append("non trovo la versione della cache in sw.js")

# Tutti i file citati nel guscio esistono sul disco.
indice = leggi("index.html")
for src in re.findall(r'(?:src|href)="\./([^"]+)"', indice):
    if not (RADICE / src).exists():
        errori.append(f"index.html cita {src}, che non esiste")

# Ogni file caricato dal guscio deve stare anche nel guscio del service
# worker, altrimenti offline manca.
guscio = set(re.findall(r'"\./([^"]+)"', sw))
for src in re.findall(r'(?:src|href)="\./([^"]+)"', indice):
    if src not in guscio and not src.endswith(".webmanifest"):
        avvisi.append(f"{src} non è nel guscio di sw.js: offline potrebbe mancare")


# --- resoconto ---------------------------------------------------------
print()
print(f"  schede in archivio     {schede_js}")
print(f"  tradotte in inglese    {tradotte} / {schede_js}")
print(f"  calibri selezionabili  {n_calibri}")
print(f"  famiglie               {n_famiglie}")
print(f"  chiavi di lingua       {len(chiavi.get('it', []))} it / {len(chiavi.get('en', []))} en")
print(f"  cache                  {cache}")
print()

for a in avvisi:
    print(f"  ~ {a}")
if avvisi:
    print()

if errori:
    for e in errori:
        print(f"  ERRORE  {e}")
    print()
    sys.exit(1)

print("  tutto torna.")
print()
