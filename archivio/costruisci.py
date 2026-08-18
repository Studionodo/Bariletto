# -*- coding: utf-8 -*-
"""
Rigenera movimenti.js dalle schede markdown in questa cartella.
Uso: python3 archivio/costruisci.py

Lotti da tre e in su: devono avere la riga
  <!-- id: seiko-4r36 | paese: Giappone | marca: Seiko -->
sotto il titolo. Il lotto 1 non ce l'ha (è precedente al requisito): i
suoi id sono mappati a mano qui sotto, in ID_LOTTO1.
"""
import re, json, pathlib

# ═══════════════════════════════════════════════════════════════════
# REGOLA PERMANENTE (fissata 16 ago 2026, sessione di localizzazione):
# ogni nuova scheda che entra nell'archivio porta la traduzione inglese
# fin dal primo momento — non è più un lavoro da fare "dopo, a blocchi".
# Un nuovo lotto si considera completo solo quando ogni scheda ha sia
# i tre blocchi italiani sia i tre "(EN)" corrispondenti, prima di
# essere rigenerato e rilasciato. Vale anche per le patch di verifica:
# se una patch riscrive un blocco italiano già tradotto, la traduzione
# inglese va aggiornata nella stessa patch, non lasciata indietro a
# raccontare una versione superata del testo.
#
# SECONDA REGOLA PERMANENTE (fissata stessa sessione, giro Peacock
# lotto 11): ogni nuova scheda d'archivio il cui calibro è di un tipo
# che l'app già sa gestire (automatico, manuale, cronografo, quarzo,
# ecodrive, kinetic, springdrive) diventa anche una voce selezionabile
# in calibri.js NELLA STESSA SESSIONE — non un giro a parte da fare
# "quando c'è tempo". L'archivio e il picker non sono la stessa cosa
# — l'archivio tiene la prosa e i disaccordi fra fonti, il picker vuole
# un numero solo, deciso secondo la regola SW500 — ma la voce nel
# picker si crea comunque subito, non in differita.
# Restano fuori solo i calibri di un tipo che l'app non modella ancora
# (oggi: tourbillon). Per quelli, la scheda entra nell'archivio come
# consultazione, e si segnala esplicitamente che manca il tipo prima
# di forzarli in una categoria che gli farebbe perdere l'avviso
# specifico che li rende diversi da un tre lancette qualsiasi.
# ═══════════════════════════════════════════════════════════════════

# I nomi dei sei paesi presenti nell'archivio non hanno bisogno di essere
# tradotti scheda per scheda: sono sempre gli stessi sei, quindi si traducono
# una volta sola qui invece che 70 volte nei markdown. Se un domani entra un
# settimo paese, questo dizionario avvisa (vedi sotto) invece di scrivere in
# silenzio un valore italiano dentro un'app in inglese.
PAESE_EN = {
    "Giappone": "Japan", "Cina": "China", "Germania": "Germany",
    "Russia": "Russia", "Stati Uniti": "United States", "Svizzera": "Switzerland",
    "Francia": "France", "Regno Unito": "United Kingdom", "Italia": "Italy",
}

# Alcuni id restano "DA DEFINIRE" nel file sorgente perché il produttore
# non è identificabile con certezza — la decisione si prende qui, non
# lasciando che l'id venga inventato in un lotto futuro senza discuterne.
#   generic-2813  il progetto "2813" nasce per essere prodotto da più
#                 fabbriche insieme (Dixmont Guangzhou, Nanning, Pechino,
#                 venduto anche come Mingzhu): non esiste un produttore
#                 attuale da mettere nel prefisso, quindi "generic" invece
#                 di sceglierne uno a caso
#   hkpt-pt5000   le fonti non concordano sul produttore (HK Precision
#                 Technology, Hangzhou, "China Tianma"), ma è un problema
#                 di certezza della fonte, non di struttura del prodotto:
#                 si va con l'attribuzione più circostanziata
ID_DA_DEFINIRE = {
    "DG2813": "generic-2813",
    "PT5000": "hkpt-pt5000",
}

ID_LOTTO1 = {
    "Seiko 7S26": ("seiko-7s26", "Giappone", "Seiko"),
    "Seiko 4R35 / 4R36": ("seiko-4r35", "Giappone", "Seiko"),
    "Seiko NH35": ("seiko-nh35", "Giappone", "Seiko"),
    "Seiko 6R35": ("seiko-6r35", "Giappone", "Seiko"),
    "Seiko 8R48": ("seiko-8r48", "Giappone", "Seiko"),
    "Miyota 8215": ("miyota-8215", "Giappone", "Miyota"),
    "Miyota 9015": ("miyota-9015", "Giappone", "Miyota"),
    "Citizen Eco-Drive": ("citizen-eco", "Giappone", "Citizen"),  # famiglia, non un calibro singolo
}

# Schede da tenere fuori finché non arrivano corrette. Chiave = id, valore
# = perché. Controllare a ogni rigenerazione se è ancora il caso.
ESCLUSE = {
    # sellita-sw500: corretto nella rev2 del lotto 2 — riporta la
    # contraddizione fra i due documenti Sellita invece di scioglierla.
    # Verificato riga per riga prima di reintegrarlo.
}

def leggi():
    schede = []
    for f in sorted(pathlib.Path(__file__).parent.glob("*.md")):
        t = f.read_text(encoding="utf-8")
        ha_id = "<!-- id:" in t
        for blocco in re.split(r'\n---\n', t):
            blocco = blocco.strip()
            if not blocco.startswith("## "): continue
            titolo = blocco.split("\n")[0][3:].strip()
            if ha_id:
                m = re.search(r'<!-- id: ([^|]+)\| paese: ([^|]+)\| marca: ([^>]+)-->', blocco)
                if not m:
                    print(f"  SALTATA (riga id malformata): {titolo} in {f.name}")
                    continue
                rid, paese, marca = [x.strip() for x in m.groups()]
                if rid == "DA DEFINIRE":
                    if titolo not in ID_DA_DEFINIRE:
                        print(f"  SALTATA (id da definire, nessuna decisione presa): {titolo}")
                        continue
                    rid = ID_DA_DEFINIRE[titolo]
            elif titolo in ID_LOTTO1:
                rid, paese, marca = ID_LOTTO1[titolo]
            else:
                print(f"  SALTATA (nessuna mappatura id): {titolo} in {f.name}")
                continue

            # Ogni blocco italiano ha un corrispondente inglese opzionale,
            # marcato "(EN)" subito dopo il titolo italiano. Finché nessuno
            # lo traduce resta vuoto, e l'app mostra l'italiano anche in
            # modalità inglese: non è un difetto silenzioso, è un fallback
            # dichiarato (vedi fogliaTesto() in foglio.js).
            parti = {}
            for bn in ["Com'è fatto", "Come si cura", "Cosa è normale"]:
                bm = re.search(r'### ' + re.escape(bn) + r'\n(.+?)(?=\n###|\n\*\*Fonti|\Z)', blocco, re.S)
                parti[bn] = bm.group(1).strip() if bm else ""
                bm_en = re.search(r'### ' + re.escape(bn) + r' \(EN\)\n(.+?)(?=\n###|\n\*\*Fonti|\Z)', blocco, re.S)
                parti[bn + " EN"] = bm_en.group(1).strip() if bm_en else ""
            fm = re.search(r'\*\*Fonti:\*\*\n(.+?)\Z', blocco, re.S)
            fonti = [u.strip() for u in fm.group(1).strip().split("\n") if u.strip()] if fm else []
            if paese not in PAESE_EN:
                print(f"  ATTENZIONE: paese \"{paese}\" senza traduzione in PAESE_EN ({titolo})")
            paese_en = PAESE_EN.get(paese, paese)
            schede.append(dict(id=rid, nome=titolo, paese=paese, paese_en=paese_en, marca=marca,
                                fatto=parti["Com'è fatto"], fatto_en=parti["Com'è fatto EN"],
                                cura=parti["Come si cura"], cura_en=parti["Come si cura EN"],
                                normale=parti["Cosa è normale"], normale_en=parti["Cosa è normale EN"],
                                fonti=fonti))
    return schede


def scrivi(schede):
    righe = ["/* ------------------------------------------------------------------",
             "   Archivio dei movimenti — generato da archivio/costruisci.py.",
             "   Non modificare a mano: rigenerare dal markdown sorgente.",
             "",
             "   I campi _en sono la traduzione inglese, dove esiste già — una",
             "   scheda non ancora tradotta ha semplicemente il campo vuoto, e",
             "   l'app mostra l'italiano come fallback (vedi fogliaTesto() in",
             "   foglio.js). paese_en è sempre pieno: viene da una tabella fissa",
             "   di sei nomi, non richiede traduzione manuale.",
             "   ------------------------------------------------------------------ */",
             "", "const ARCHIVIO = ["]
    for s in schede:
        righe.append("  {")
        for k in ("id", "nome", "paese", "paese_en", "marca",
                   "fatto", "fatto_en", "cura", "cura_en", "normale", "normale_en", "fonti"):
            righe.append(f"    {k}: {json.dumps(s[k], ensure_ascii=False)},")
        righe.append("  },")
    righe.append("];")
    out = pathlib.Path(__file__).parent.parent / "movimenti.js"
    out.write_text("\n".join(righe) + "\n", encoding="utf-8")
    return out


if __name__ == "__main__":
    schede = leggi()
    prima = len(schede)
    for id_escluso, perche in ESCLUSE.items():
        schede = [s for s in schede if s["id"] != id_escluso]
        print(f"  esclusa {id_escluso}: {perche}")
    out = scrivi(schede)
    print(f"\n{out}: {len(schede)} schede pubblicate su {prima} lette")
