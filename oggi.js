/* ------------------------------------------------------------------
   Pagina uno — Oggi

   Qui sta una cosa sola: quale orologio chiede attenzione, perché, e il
   gesto per rispondergli. La collezione le sta sotto ma scorre di lato,
   così non allunga la pagina di una riga per ogni orologio: prima era
   quello a rendere la schermata interminabile.
   ------------------------------------------------------------------ */

const QUADRANTE = "<svg class=\"quadrante\" viewBox=\"0 0 200 200\" aria-hidden=\"true\"><circle cx=\"100\" cy=\"100\" r=\"86.5\" fill=\"none\" stroke=\"rgba(10,6,32,.30)\" stroke-width=\"17\"/><g stroke=\"rgba(255,255,255,.075)\" stroke-width=\".8\"><path d=\"M103.4,21.1L104.1,6.1\"/><path d=\"M110.3,21.7L112.3,6.8\"/><path d=\"M117.1,22.9L120.3,8.2\"/><path d=\"M123.8,24.7L128.3,10.4\"/><path d=\"M130.2,27.0L136.0,13.2\"/><path d=\"M136.5,29.9L143.4,16.6\"/><path d=\"M142.4,33.4L150.5,20.7\"/><path d=\"M148.1,37.3L157.2,25.4\"/><path d=\"M153.4,41.8L163.5,30.7\"/><path d=\"M158.2,46.6L169.3,36.5\"/><path d=\"M162.7,51.9L174.6,42.8\"/><path d=\"M166.6,57.6L179.3,49.5\"/><path d=\"M170.1,63.5L183.4,56.6\"/><path d=\"M173.0,69.8L186.8,64.0\"/><path d=\"M175.3,76.2L189.6,71.7\"/><path d=\"M177.1,82.9L191.8,79.7\"/><path d=\"M178.3,89.7L193.2,87.7\"/><path d=\"M178.9,96.6L193.9,95.9\"/><path d=\"M178.9,103.4L193.9,104.1\"/><path d=\"M178.3,110.3L193.2,112.3\"/><path d=\"M177.1,117.1L191.8,120.3\"/><path d=\"M175.3,123.8L189.6,128.3\"/><path d=\"M173.0,130.2L186.8,136.0\"/><path d=\"M170.1,136.5L183.4,143.4\"/><path d=\"M166.6,142.4L179.3,150.5\"/><path d=\"M162.7,148.1L174.6,157.2\"/><path d=\"M158.2,153.4L169.3,163.5\"/><path d=\"M153.4,158.2L163.5,169.3\"/><path d=\"M148.1,162.7L157.2,174.6\"/><path d=\"M142.4,166.6L150.5,179.3\"/><path d=\"M136.5,170.1L143.4,183.4\"/><path d=\"M130.2,173.0L136.0,186.8\"/><path d=\"M123.8,175.3L128.3,189.6\"/><path d=\"M117.1,177.1L120.3,191.8\"/><path d=\"M110.3,178.3L112.3,193.2\"/><path d=\"M103.4,178.9L104.1,193.9\"/><path d=\"M96.6,178.9L95.9,193.9\"/><path d=\"M89.7,178.3L87.7,193.2\"/><path d=\"M82.9,177.1L79.7,191.8\"/><path d=\"M76.2,175.3L71.7,189.6\"/><path d=\"M69.8,173.0L64.0,186.8\"/><path d=\"M63.5,170.1L56.6,183.4\"/><path d=\"M57.6,166.6L49.5,179.3\"/><path d=\"M51.9,162.7L42.8,174.6\"/><path d=\"M46.6,158.2L36.5,169.3\"/><path d=\"M41.8,153.4L30.7,163.5\"/><path d=\"M37.3,148.1L25.4,157.2\"/><path d=\"M33.4,142.4L20.7,150.5\"/><path d=\"M29.9,136.5L16.6,143.4\"/><path d=\"M27.0,130.2L13.2,136.0\"/><path d=\"M24.7,123.8L10.4,128.3\"/><path d=\"M22.9,117.1L8.2,120.3\"/><path d=\"M21.7,110.3L6.8,112.3\"/><path d=\"M21.1,103.4L6.1,104.1\"/><path d=\"M21.1,96.6L6.1,95.9\"/><path d=\"M21.7,89.7L6.8,87.7\"/><path d=\"M22.9,82.9L8.2,79.7\"/><path d=\"M24.7,76.2L10.4,71.7\"/><path d=\"M27.0,69.8L13.2,64.0\"/><path d=\"M29.9,63.5L16.6,56.6\"/><path d=\"M33.4,57.6L20.7,49.5\"/><path d=\"M37.3,51.9L25.4,42.8\"/><path d=\"M41.8,46.6L30.7,36.5\"/><path d=\"M46.6,41.8L36.5,30.7\"/><path d=\"M51.9,37.3L42.8,25.4\"/><path d=\"M57.6,33.4L49.5,20.7\"/><path d=\"M63.5,29.9L56.6,16.6\"/><path d=\"M69.8,27.0L64.0,13.2\"/><path d=\"M76.2,24.7L71.7,10.4\"/><path d=\"M82.9,22.9L79.7,8.2\"/><path d=\"M89.7,21.7L87.7,6.8\"/><path d=\"M96.6,21.1L95.9,6.1\"/></g><g fill=\"rgba(255,255,255,.10)\"><path d=\"M103.5,20.0L103.5,8.0L96.5,8.0L96.5,20.0Z\"/><path d=\"M141.9,31.8L147.9,21.4L144.1,19.2L138.1,29.6Z\"/><path d=\"M170.4,61.9L180.8,55.9L178.6,52.1L168.2,58.1Z\"/><path d=\"M180.0,102.2L192.0,102.2L192.0,97.8L180.0,97.8Z\"/><path d=\"M168.2,141.9L178.6,147.9L180.8,144.1L170.4,138.1Z\"/><path d=\"M138.1,170.4L144.1,180.8L147.9,178.6L141.9,168.2Z\"/><path d=\"M97.8,180.0L97.8,192.0L102.2,192.0L102.2,180.0Z\"/><path d=\"M58.1,168.2L52.1,178.6L55.9,180.8L61.9,170.4Z\"/><path d=\"M29.6,138.1L19.2,144.1L21.4,147.9L31.8,141.9Z\"/><path d=\"M20.0,97.8L8.0,97.8L8.0,102.2L20.0,102.2Z\"/><path d=\"M31.8,58.1L21.4,52.1L19.2,55.9L29.6,61.9Z\"/><path d=\"M61.9,29.6L55.9,19.2L52.1,21.4L58.1,31.8Z\"/></g><circle cx=\"100\" cy=\"100\" r=\"75\" fill=\"none\" stroke=\"rgba(201,169,106,.32)\" stroke-width=\"1.6\"/><circle cx=\"100\" cy=\"100\" r=\"78\" fill=\"none\" stroke=\"rgba(232,232,236,.20)\" stroke-width=\".7\"/></svg>";

/* L'architettura del quadrante Vanac, misurata sulla foto: campo piatto
   fino a 0,74 del raggio, cerchio d'oro a 0,75, filo d'argento a 0,78,
   corona scanalata con dodici indici da 0,80 a 0,95. */
function anelloOrologio(o, b) {
  const a = el("div", "anello");
  a.insertAdjacentHTML("afterbegin", QUADRANTE);
  a.append(infoTocco(t("info.anello.titolo"),
    [t("info.anello.testo1"), t("info.anello.testo2"), t("info.anello.testo3")], "info-anello"));
  const st = el("span", "etichetta stato-anello", nomeStato(b.stato));
  st.style.color = COLORE[b.stato];
  a.append(st, el("h1", "nome", o.nome));
  if (o.linea) a.append(el("span", "linea", o.linea));
  a.append(el("div", "filo"),
           el("span", "etichetta mini dato-anello", etichettaCalibro(o)),
           el("span", "etichetta mini dato-anello secondario", etichettaRiserva(o)));
  return a;
}

/* Una carta del carosello. Dice le stesse tre cose della vecchia riga —
   chi sei, che movimento monti, come stai — ma in verticale, perché in
   una fila che scorre l'altezza è libera e la larghezza no. */
function cartaOrologio(o, b, alPolso) {
  const c = el("button", "carta" + (alPolso ? " al-polso" : ""));
  const pallino = el("span", "pallino");
  pallino.style.background = COLORE[b.stato];

  const stato = el("span", "carta-dato carta-stato");
  if (alPolso) { stato.textContent = t("oggi.giaMesso"); stato.style.color = "var(--oro)"; }
  else if (Number.isFinite(b.restanti) && b.restanti > 0) {
    stato.textContent = t("oggi.restano", { q: durata(b.restanti) });
    stato.style.color = COLORE[b.stato];
  } else { stato.textContent = nomeStato(b.stato); stato.style.color = COLORE[b.stato]; }

  c.append(pallino,
           el("div", "carta-nome", o.nome),
           el("div", "filo"),
           el("span", "carta-dato", nomeCorto(o.calibroNome)),
           stato);
  c.setAttribute("aria-label", o.nome);
  c.onclick = () => apriScheda(o, "dettaglio");
  return c;
}

function costruisciOggi() {
  const d = el("div", "colonna");
  const classifica = ordinaPerBisogno(orologi);

  /* Collezione vuota: una frase e un solo gesto possibile, più — solo
     qui, solo quando non c'è ancora nulla — una presentazione sintetica
     di cosa fa l'app, per chi la apre la primissima volta. Il
     contenitore usa lo stesso spazio verticale reale già calcolato per
     il resto dell'app (testata + indice sottratti), non un'altezza
     indovinata: si adatta da solo a schermi di dimensioni diverse. */
  if (!classifica.length) {
    d.classList.add("vuoto-pieno");
    const gruppoAlto = el("div", "vuoto-gruppo-alto");
    gruppoAlto.append(el("p", "vuoto dopo", t("vuoto.oggi")));
    const agg = el("button", "azione secondaria dopo", t("aggiungi"));
    agg.onclick = () => apriScheda();
    gruppoAlto.append(agg);
    d.append(gruppoAlto, el("p", "presentazione-vuoto", t("vuoto.presentazione")));
    return d;
  }

  d.append(el("span", "etichetta data-oggi", new Date().toLocaleDateString(locale(),
    { weekday: "long", day: "numeric", month: "long" })));

  const eOggi = (o) => o.ultimoPolso && sameDay(o.ultimoPolso, Date.now());
  const liberi = classifica.filter(({ o }) => !eOggi(o));
  const proposto = liberi.length ? liberi[0] : null;
  const cala = [...classifica]
    .filter((x) => Number.isFinite(x.b.restanti) && x.b.restanti > 0)
    .sort((a, b) => a.b.restanti - b.b.restanti)[0];
  const primo = proposto || cala || classifica[0];

  /* L'anello apre la scheda del suo orologio: con un orologio solo non
     c'era nessuna riga da toccare per arrivare a Modifica ed Elimina. */
  const anello = anelloOrologio(primo.o, primo.b);
  anello.classList.add("tocca");
  anello.setAttribute("role", "button");
  anello.setAttribute("tabindex", "0");
  anello.setAttribute("aria-label", primo.o.nome);
  anello.addEventListener("click", () => apriScheda(primo.o, "dettaglio"));
  anello.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); apriScheda(primo.o, "dettaglio"); }
  });
  d.append(anello);

  const sotto = el("div", "sotto-anello");
  if (proposto) {
    sotto.append(el("p", "motivo", primo.b.motivo));
  } else {
    sotto.append(el("p", "titolo-quiete", t("oggi.nulla")));
    sotto.append(el("p", "motivo secondario",
      Number.isFinite(primo.b.restanti) && primo.b.restanti > 0
        ? primo.o.nome + " " + t("oggi.prossimoOra", { q: durata(primo.b.restanti) })
        : t("oggi.tuttiCarichi")));
  }
  d.append(sotto);

  if (proposto) {
    const rigaAz = el("div", "riga-azione-principale");
    const az = el("button", "azione dopo", t("messo"));
    az.onclick = () => segna(proposto.o);
    rigaAz.append(az, infoTocco(t("info.gesti.titolo"),
      [t("info.gesti.testo1"), t("info.gesti.testo2"), t("info.gesti.testo3"), t("info.gesti.testo4")], "info-azione"));
    d.append(rigaAz);
    if (proposto.o.mano || proposto.o.tipo === "manuale") {
      const car = el("button", "quieta dopo-corto", t("soloCaricato"));
      car.onclick = () => segnaCarica(proposto.o);
      d.append(car);
    }
  }

  /* Portare un cronografo non vuol dire averlo azionato: la frizione
     vuole girare. */
  const crono = orologi.filter((o) => o.tipo === "cronografo" && eOggi(o) &&
    !(o.ultimoCrono && sameDay(o.ultimoCrono, Date.now())));
  crono.forEach((o) => {
    const b = el("button", "quieta link-centro stretto",
      crono.length > 1 ? t("crono.fatto") + " \u00B7 " + o.nome : t("crono.fatto"));
    b.onclick = () => segnaCrono(o);
    d.append(b);
  });

  /* La collezione. Il carosello scorre di lato con solo gli orologi
     veri: prima c'era anche una carta tratteggiata "Aggiungi" in fondo
     alla fila, nello stesso linguaggio delle carte vere — ma è proprio
     quell'appartenenza alla fila a renderla goffa, non elegante. Il +
     accanto al titolo resta l'unico punto d'ingresso: sempre raggiungibile
     senza scorrere, e visivamente non è una carta, è un comando. */
  const capoRiga = el("div", "titolo-riga dopo");
  const capo = el("span", "titolo-sezione", t("coll.tutta"));
  const aggRapida = el("button", "agg-rapida");
  aggRapida.setAttribute("aria-label", t("agg.pieno"));
  aggRapida.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg><span>' + t("agg.breve") + '</span>';
  aggRapida.onclick = () => apriScheda();
  capoRiga.append(capo, aggRapida);
  d.append(capoRiga);

  const fila = el("div", "carosello");
  classifica.forEach(({ o, b }) => fila.append(cartaOrologio(o, b, eOggi(o))));
  d.append(fila);

  return d;
}

/* Date parlate: oggi, ieri, N giorni fa, poi la data piena. */
function quando(ts) {
  if (ts == null) return t("g.mai");
  const g = giorniDa(ts);
  if (g <= 0) return t("g.oggi");
  if (g === 1) return t("g.ieri");
  if (g < 60) return t("g.faGiorni", { g: plurale(g, "giorno_", "giorniPl") });
  return new Date(ts).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
}
