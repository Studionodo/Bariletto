"""
Genera le icone di Bariletto dal logo sorgente.

L'ingranaggio viene estratto dal fondo invece di essere ritagliato:
per ogni pixel l'opacita' e' quanto quel pixel si allontana dal viola
scurissimo del fondo originale. Cosi' l'oro e il viola dell'anello
restano pieni, il fondo sparisce, e i bordi antialiasati si fondono da
soli sul nuovo colore. Due conseguenze utili: il watermark di
generazione in basso a destra cade fuori dalla circonferenza e non
viene mai copiato, e gli angoli bianchi del sorgente spariscono senza
doverli mascherare.
"""
from PIL import Image
import math, os

SORGENTE = "logo-bariletto-fonte.png"
USCITA = "."

FONDO_VECCHIO = (12, 7, 39)
# Lo stesso background_color del manifest: sulla schermata di avvio
# l'icona non stacca, l'ingranaggio sembra posato sul fondo dell'app.
FONDO = (0x16, 0x11, 0x1F)
SOGLIA = 70.0

def estrai_ingranaggio():
    """Ritorna l'ingranaggio come RGBA su fondo trasparente, ritagliato al vivo."""
    im = Image.open(SORGENTE).convert("RGB")
    w, h = im.size
    px = im.load()
    fuori = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fp = fuori.load()
    cx = cy = (w - 1) / 2
    raggio = w / 2
    for y in range(h):
        for x in range(w):
            # tutto cio' che sta oltre la circonferenza non ci interessa:
            # e' li' che vive il watermark, ed e' li' che il sorgente ha
            # gli angoli bianchi della cornice arrotondata.
            if math.hypot(x - cx, y - cy) > raggio:
                continue
            p = px[x, y]
            if max(p) > 200 and min(p) > 200:      # residui di bianco
                continue
            d = sum(abs(a - b) for a, b in zip(p, FONDO_VECCHIO))
            a = int(min(255, d / SOGLIA * 255))
            if a:
                fp[x, y] = (p[0], p[1], p[2], a)
    return fuori.crop(fuori.getbbox())

def componi(ingranaggio, lato, quota, fondo=FONDO):
    """Ingranaggio centrato su un quadrato pieno, occupando 'quota' del lato."""
    tela = Image.new("RGB", (lato, lato), fondo)
    d = max(1, int(round(lato * quota)))
    g = ingranaggio.resize((d, d), Image.LANCZOS)
    tela.paste(g, ((lato - d) // 2, (lato - d) // 2), g)
    return tela

def main():
    ing = estrai_ingranaggio()
    print("ingranaggio estratto:", ing.size)

    # A pieno campo, angoli quadrati: la forma la mette il sistema
    # operativo, non l'immagine. 0.88 lascia un respiro senza che
    # l'ingranaggio galleggi in mezzo al vuoto.
    componi(ing, 512, 0.88).save(f"{USCITA}/icon-512.png")
    componi(ing, 192, 0.88).save(f"{USCITA}/icon-192.png")

    # Maskable: Android ritaglia in cerchio, goccia o squircle a seconda
    # del telefono, e garantisce solo il cerchio pari all'80% del lato.
    # 0.74 tiene tutta la dentatura dentro quella zona con un margine.
    componi(ing, 512, 0.74).save(f"{USCITA}/icon-512-maskable.png")

    # iOS ignora il manifest e prende questa: quadrata piena, opaca,
    # senza trasparenza (che iOS renderebbe nera).
    componi(ing, 180, 0.88).save(f"{USCITA}/apple-touch-icon.png")

    # Favicon: a 32px la dentatura diventa una frangia illeggibile.
    # Meglio l'ingranaggio piu' grande, che a quella misura si legge
    # come un anello d'oro pieno, forma riconoscibile anche minuscola.
    componi(ing, 32, 0.96).save(f"{USCITA}/favicon-32.png")

    for f in ["icon-512.png", "icon-192.png", "icon-512-maskable.png",
              "apple-touch-icon.png", "favicon-32.png"]:
        p = f"{USCITA}/{f}"
        print(f"{f:26} {Image.open(p).size}  {os.path.getsize(p)/1024:7.1f} kB")

if __name__ == "__main__":
    main()
