# -*- coding: utf-8 -*-
"""
Rilascio — un comando solo.

Prima erano quattro passi a memoria, ognuno dimenticabile in silenzio:
rigenerare l'archivio dai markdown, incrementare la cache del service
worker, controllare che non si fosse rotto niente, pubblicare. Chi ne
saltava uno non se ne accorgeva: l'app andava online lo stesso, solo con
l'archivio vecchio o senza far partire l'aggiornamento.

Adesso il passo manuale non c'è più. Se un controllo non torna, il
rilascio si ferma prima di pubblicare.

Uso:  python3 rilascia.py           rigenera, verifica, incrementa, pubblica
      python3 rilascia.py --prova   fa tutto tranne pubblicare
"""
import pathlib
import re
import subprocess
import sys

RADICE = pathlib.Path(__file__).parent
PROVA = "--prova" in sys.argv


def passo(titolo):
    print()
    print("\u2500" * 58)
    print("  " + titolo)
    print("\u2500" * 58)


def esegui(comando, dove=None):
    e = subprocess.run(comando, cwd=dove or RADICE, shell=False)
    if e.returncode != 0:
        print()
        print(f"  fermo qui: «{' '.join(comando)}» è uscito con {e.returncode}.")
        print("  Niente è stato pubblicato.")
        sys.exit(e.returncode)


# --- 1. l'archivio si rigenera da solo ---------------------------------
passo("Rigenero l'archivio dai markdown")
esegui([sys.executable, "archivio/costruisci.py"])


# --- 2. la sintassi -----------------------------------------------------
passo("Controllo la sintassi")
falliti = []
for f in sorted(RADICE.glob("*.js")):
    e = subprocess.run(["node", "--check", f.name], cwd=RADICE,
                       capture_output=True, text=True)
    if e.returncode != 0:
        falliti.append((f.name, e.stderr.strip()))
    else:
        print(f"  ok  {f.name}")
if falliti:
    print()
    for nome, errore in falliti:
        print(f"  ROTTO  {nome}\n{errore}")
    sys.exit(1)


# --- 3. il contenuto ----------------------------------------------------
# La sintassi dice solo che il file non è rotto. Questo dice che contiene
# quello che deve contenere: è il controllo che mancava.
passo("Verifico il contenuto")
esegui([sys.executable, "archivio/verifica.py"])


# --- 4. la cache del service worker ------------------------------------
# Dimenticarlo significa che l'aggiornamento non parte: chi ha già l'app
# installata continua a vedere la versione di prima senza saperlo.
passo("Incremento la cache")
sw = RADICE / "sw.js"
testo = sw.read_text(encoding="utf-8")
m = re.search(r'const CACHE = "bariletto-v(\d+)"', testo)
if not m:
    print("  non trovo la versione della cache in sw.js")
    sys.exit(1)
vecchia = int(m.group(1))
nuova = vecchia + 1
if not PROVA:
    sw.write_text(testo.replace(f'"bariletto-v{vecchia}"', f'"bariletto-v{nuova}"'),
                  encoding="utf-8")
    print(f"  bariletto-v{vecchia}  \u2192  bariletto-v{nuova}")
else:
    print(f"  bariletto-v{vecchia}  \u2192  bariletto-v{nuova}   (prova: non scritto)")


# --- 5. pubblicazione ---------------------------------------------------
if PROVA:
    passo("Prova: mi fermo prima di pubblicare")
    print("  Tutto torna. Rilancia senza --prova per pubblicare davvero.")
    print()
    sys.exit(0)

passo("Pubblico")
esegui(["vercel", "--prod"])

print()
print(f"  Fatto: bariletto-v{nuova} è online.")
print()
