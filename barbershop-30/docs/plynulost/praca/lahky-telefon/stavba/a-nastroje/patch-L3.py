import sys
root=sys.argv[1]
p=root+'/assets/app.js'; s=open(p).read()
old="""  // zábery bez filmu (pokojná verzia, záloha kým film nebeží): stoja cez celé okno; ďalší sa prelína navrch
  // počas nábehu svojej karty a predchádzajúci zmizne, až keď je nový celý (nikdy nevyjde zdola cez text)
  const footerIn = !!footerBox && y + vh > footerBox.top;
  // aktuálna karta podľa poradia (posledná, ktorej horný okraj je nad stredom okna); okolie sa ráta v kartách,
  // nie v pixeloch, aby ho neobišlo rozloženie, ktoré sa pri načítaní ešte dopočítava (inak by sa naraz
  // začali sťahovať zálohy celej stránky)
  let cur = 0;
  for (let i = 0; i < titles.length; i++) if (titles[i].top <= y + vh * 0.5) cur = i;
  for (let i = 0; i < titles.length; i++) {
    const s = titles[i], n = titles[i + 1];
    const fin = s.first ? 1 : ease01((y - s.top) / s.free / CARD_IN);
    const nextIn = n ? ease01((y - n.top) / n.free / CARD_IN) : 0;
    const so = footerIn || nextIn >= 1 ? 0 : fin;
    setVar('--so', so, s.st || s.el);
    setClass(s.el, 'is-shown', so > 0.001);
    // okolie: záloha sa načíta (display) len pri aktuálnej karte, dvoch ďalších a jednej predchádzajúcej;
    // kým sa stránka nenačíta celá, len aktuálna karta a predchádzajúca (tá je na obrazovke, kým aktuálna nastupuje)
    // a úvod: aj pri obnovenej polohe, kotve (#tim, #kontakt) či návrate späť je aktuálna karta vždy načítaná
    // (inak by pred načítaním stránky ostal len čistý ink, V1)
    setClass(s.el, 'is-near', document.readyState === 'complete' ? i >= cur - 1 && i <= cur + 2 : i === 0 || i === cur || i === cur - 1);
  }
"""
new="""  zabery(y);
"""
assert s.count(old)==1; s=s.replace(old,new)

old="""// spodné tlačidlo: nie v úvode (titulná karta má vlastné tlačidlá), nie v rezervácii, nie pri menu"""
new="""/* ----------------------------------------------------------------------------
   5b. Zábery bez filmu (ľahký telefón, pokojná verzia, záloha kým film nebeží) – jeden model na jednom mieste:
   - fotky stoja cez celé okno (pevná vrstva), pohyb je len pomalé priblíženie 1 → 1,06 okolo bodu záujmu
     (--sp na img, transform) a prelínanie kariet (--so na .film-still, opacity); oboje riadi skrol, v pokoji sa
     nekreslí nič. Ďalší záber sa prelína navrch počas nábehu svojej karty, predchádzajúci zmizne, až keď je nový celý.
   - fotka sa nikdy neukáže neúplná: záber sa začne prelínať len keď je jeho fotka stiahnutá a dekódovaná
     (img.decode(), pri chybe dekódovania stačí stiahnutá); dovtedy ostáva na obrazovke posledná hotová fotka.
     Keď fotka dobehne neskôr, než ju skrol chcel, dobehne prelínaním 400 ms (trieda is-catch, jediný
     transition) a starú zakryje až potom.
   - poistka len pre úplne prvý obraz: kým nie je dekódovaná žiadna fotka, úvod (fotka z HTML, predčítaná
     v hlavičke) sa ukazuje bez čakania, aj ako záloha pod kartou pri obnovenej polohe či kotve.
   - okolie (display, sťahovanie): to, čo je na obrazovke, aktuálna karta a po dekódovaní prvého obrazu aj
     ďalšia a predchádzajúca (nie až po load, V2), ďalšie s fetchpriority low; najviac 3 zálohy bez display: none.
     Aktuálna karta je vždy v okolí (aj obnovená poloha, kotvy, späť, t-wait – V1).
   ---------------------------------------------------------------------------- */
let firstDone = false;   // prvý obraz je dekódovaný: od vtedy sa sťahuje aj okolie ±1
const CATCH_MS = 420;
addEventListener('load', () => { if (!firstDone) { firstDone = true; snapNow(0); } }, { once: true });
// fotka záberu: po stiahnutí dekódovať; príznak __dec platí len pre aktuálny pobyt v okolí (mimo okolia má
// záloha display: none a prehliadač smie dekódovaný obraz zahodiť, preto sa po návrate dekóduje znova)
function prepStill(s) {
  const img = s.img;
  if (!img || img.__dec || img.__busy) return;
  if (!img.__go) {
    img.__go = () => {
      if (!img.__near || img.__dec || img.__busy) return;
      img.__busy = true;
      const done = (ok) => {
        img.__busy = false;
        if (ok && img.__near && !img.__dec) { img.__dec = true; firstDone = true; snapNow(0); }
      };
      if (img.decode) img.decode().then(() => done(true), () => done(img.complete && img.naturalWidth > 0));
      else done(true);
    };
    // nová fotka (aj iný kandidát srcset po otočení): dekódovať; hotová fotka na obrazovke sa medzitým neskryje
    img.addEventListener('load', () => prepStill(s));
  }
  if (img.complete && img.naturalWidth > 0) img.__go();
}
function zabery(y) {
  const now = performance.now();
  const footerIn = !!footerBox && y + vh > footerBox.top;
  // aktuálna karta podľa poradia (posledná, ktorej horný okraj je nad stredom okna); okolie sa ráta v kartách,
  // nie v pixeloch, aby ho neobišlo rozloženie, ktoré sa pri načítaní ešte dopočítava
  let cur = 0;
  for (let i = 0; i < titles.length; i++) if (titles[i].top <= y + vh * 0.5) cur = i;
  // krytie od posledného záberu: záber zakryje všetky pod sebou, keď je celý, hotový a už nedobieha
  let covered = false;
  const so = new Array(titles.length), shown = [];
  for (let i = titles.length - 1; i >= 0; i--) {
    const s = titles[i], img = s.img;
    const want = s.first ? 1 : ease01((y - s.top) / s.free / CARD_IN);
    const ok = !!img && ((img.__near && img.__dec) || (s.first && !firstDone));
    // fotka práve dobehla, kým ju skrol už chcel: dobehne prelínaním (inak riadi krytie len skrol)
    if (ok && !s.ok && want > 0.001 && !s.first) { s.catchUntil = now + CATCH_MS; setTimeout(() => snapNow(0), CATCH_MS + 10); }
    s.ok = ok;
    const catching = s.catchUntil > now;
    setClass(s.el, 'is-catch', catching);
    so[i] = footerIn || covered || !ok ? 0 : want;
    if (so[i] > 0.001) shown.push(i);
    if (ok && want >= 1 && !catching) covered = true;
  }
  // okolie: na obrazovke (vždy), aktuálna karta, po prvom obraze ďalšia a predchádzajúca; najviac 3
  const near = new Set(shown);
  const add = (i) => { if (i >= 0 && i < titles.length && near.size < 3) near.add(i); };
  near.add(cur);
  if (firstDone) { add(cur + 1); add(cur - 1); }
  for (let i = 0; i < titles.length; i++) {
    const s = titles[i], img = s.img, on = near.has(i);
    if (img && on !== !!img.__near) {
      img.__near = on;
      img.__dec = false;
      // okolie mimo aktuálnej karty sa sťahuje s nízkou prioritou (účinné, kým požiadavka ešte nezačala)
      if (on && i !== cur && !img.complete) img.fetchPriority = 'low';
    }
    setClass(s.el, 'is-near', on);
    if (on) prepStill(s);
    setVar('--so', so[i], s.st || s.el);
    setClass(s.el, 'is-shown', so[i] > 0.001);
  }
}

// spodné tlačidlo: nie v úvode (titulná karta má vlastné tlačidlá), nie v rezervácii, nie pri menu"""
assert s.count(old)==1; s=s.replace(old,new)
open(p,'w').write(s)

p=root+'/assets/style.css'; s=open(p).read()
old="""html[data-motion="on"] .film-still img { will-change: transform; }"""
new="""/* vlastná vrstva len pre zálohy v okolí (is-near z app.js, najviac 3), nie pre všetkých 9 */
html[data-motion="on"] .film-shot.is-near .film-still img { will-change: transform; }"""
assert s.count(old)==1; s=s.replace(old,new)
old="""html.karty .film-shot.is-title:not(.is-near):not([data-pro]) .film-still { display: none; }"""
new=old+"""
/* po prvom výpočte app.js (data-scene-active) platí okolie aj pre úvod: mimo okolia display none, takže zálohy bez
   display: none sú najviac 3 (app.js, časť 5b); dovtedy je úvod prvý obraz stránky */
html.karty[data-scene-active] .film-shot.is-title[data-pro]:not(.is-near) .film-still { display: none; }
/* fotka dobehla neskôr, než ju skrol chcel (app.js is-catch): prelínanie 400 ms namiesto skoku */
html.karty .film-shot.is-title.is-catch .film-still { transition: opacity 400ms var(--ease-in-out); }"""
assert s.count(old)==1; s=s.replace(old,new)
open(p,'w').write(s)
print('ok')
