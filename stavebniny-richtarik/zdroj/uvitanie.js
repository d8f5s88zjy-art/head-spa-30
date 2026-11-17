/* Uvítanie „Brána“ pred úvodom (len index.html, skript pred <main>; build.py:uvitanie_bloky() ho zmenší, kontrola_uvodu()
   overí zhodu). Prekryv .br je v HTML ako prvý prvok <body>, takže pozdrav je v prvom vykreslení (CSS ho ukáže len pri
   triede br-ide). Bez triedy br-ide skript prekryv odstráni.
   Úvod je od 17. 11. 2026 v štýle pôvodného webu (tmavá fotka cez celú prvú obrazovku, veľký nadpis vľavo dole): čierne
   krídla brány sa rozídu rovno nad úvodom (otvor), fotka úvodu dosadne (1,06 → 1), riadok nad nadpisom a slová nadpisu
   vyjdú, až keď ich krídla odkryjú (KZ-01: nikdy nie sú prerezané hranou krídla), potom ponuka. Brána drží zatvorená,
   kým sa dá prečítať pozdrav (DRZ od prvého vykreslenia) a kým nie je dekódovaná prvá fotka úvodu (žiadne bajty navyše).
   Koniec určujú prísľuby finished, nie časovače; na konci sa prekryv odstráni a vyšle sa udalosť br-koniec
   {preskocene, rychlo, t} (striedanie fotiek úvodu a asistent v site.js čakajú na ňu). Triedy na <html> sa nemenia.
   Ťuk, klik, koliesko, kláves (aj Tab), posun, zmena šírky okna alebo skrytie karty uvítanie hneď ukončí: úvod je
   v konečnom stave a prekryv sa prelne za --dlzka-pusti. Pomalá sieť (prvé vykreslenie po POMALE) alebo fotka
   nepripravená včas: brána len pozdraví a otvorí sa kratšie (rýchla cesta). Poistky: CSS skryje prekryv 4,8 s
   po prvom vykreslení, skript ho odstráni najneskôr po 9 s.
   Tempo (majiteľ 9. 11. 2026: pomalšie animácie): dĺžky a oneskorenia násobí M = 1,5 (funkcia T), pozdrav drží 1,5×
   dlhšie; odozva na ťuk (preskočenie, --dlzka-pusti) a rýchla cesta sa nespomaľujú. */
(function (d, w) {
  var h = d.documentElement, ov0 = d.querySelector('body>.br');
  if (!ov0) return;
  if (!h.classList.contains('br-ide')) return ov0.parentNode.removeChild(ov0);
  // časy v ms: DRZ pozdrav od prvého vykreslenia, CAKAJ najdlhšie čakanie na fotku (CAKAJP pri rýchlej ceste), POMALE
  // hranica pomalej siete, CIEL úvod použiteľný od navigácie. M je tempo: OTV (otvorenie krídel) a všetky dĺžky v T() sú
  // základné (pôvodné) hodnoty × M; DRZ, CAKAJ a CIEL sú už vynásobené (380, 900 a 2450 × 1,5)
  var M = 1.5, DRZ = 570, CAKAJ = 1350, CAKAJP = 700, POMALE = 1500, CIEL = 3700, OTV = 500, ZMIZ = 90;
  var ov, stav = 0, an = [], txt = [], f0 = 0, hotova = 0, vykr = 0, pomala = false, k = 1, tel, vw, cs = getComputedStyle(h), cas = [];
  function kr(n) { return cs.getPropertyValue('--krivka-' + n).trim() || 'ease'; }   // krivky pohybového systému (site.css)
  function T(ms) { return Math.round(ms * k * M); }
  function A(el, kf, o, zoz) { if (!el) return; var a = el.animate(kf, o); (zoz || an).push(a); }
  function znacka(n, t) { try { performance.mark(n, t ? { startTime: t } : undefined); } catch (e) {} }
  function po(ms, f) { cas.push(setTimeout(f, ms > 0 ? ms : 0)); }
  function koniec(o) {
    if (stav === 3) return;
    stav = 3; o = o || {};
    cas.forEach(clearTimeout); zap(0);
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    znacka('br-koniec');
    var e = { preskocene: !!o.preskocene, rychlo: !!o.rychlo, t: performance.now() };
    w.brKoniec = { detail: e };
    try { w.dispatchEvent(new CustomEvent('br-koniec', { detail: e })); } catch (x) {}
  }
  function hotovo(o) {   // koniec, keď dobehnú animácie prekryvu
    Promise.all(an.map(function (a) { return a.finished; })).then(function () { koniec(o); }, function () {});
  }
  function pusti(e) {   // preskočenie: text úvodu hneď na mieste, prekryv sa prelne do papiera úvodu
    if (stav > 1) return;
    stav = 2; ov.style.pointerEvents = 'none';
    // ťuk alebo klik na bránu: jeho klik (príde až po uvoľnení, keď už brána ťuk prepúšťa) nič pod ňou nestlačí;
    // hlavička a spodná lišta sú nad bránou, ich ťuk sa normálne vykoná
    if (e && e.target === ov && /^(pointerdown|touchstart)$/.test(e.type)) {
      var z = function (x) { x.preventDefault(); x.stopPropagation(); w.removeEventListener('click', z, true); };
      w.addEventListener('click', z, true); setTimeout(function () { w.removeEventListener('click', z, true); }, 700);
    }
    txt.forEach(function (a) { try { a.finish(); } catch (x) {} });
    // nadpis úvodu je už na mieste, pozdrav v krídlach hneď zhasne (nie dva nápisy cez seba počas prelnutia, KZ-01)
    [].forEach.call(ov.querySelectorAll('.br-tab'), function (x) { x.style.opacity = 0; });
    var v = cs.getPropertyValue('--dlzka-pusti').trim(), ms = parseFloat(v) * (/ms$/.test(v) ? 1 : 1000) || 160;
    var a = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' });
    a.finished.then(function () { koniec({ preskocene: true }); }, function () {});
  }
  function posun() { if (w.scrollY > 4) pusti(); }
  function otoc() { if (vw && w.innerWidth !== vw) pusti(); }   // otočenie telefónu alebo zmena šírky okna (nie lišta prehliadača)
  function skry() { if (d.hidden) koniec({ preskocene: true }); }
  function von() { koniec({ preskocene: true }); }
  function zap(x) {
    var f = x ? 'addEventListener' : 'removeEventListener';
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (n) { w[f](n, pusti, { capture: true, passive: true }); });
    w[f]('scroll', posun, { passive: true }); w[f]('resize', otoc); w[f]('pagehide', von); d[f]('visibilitychange', skry);
  }
  function kridla(ms) {   // krídla sa rozídu do strán ako posuvná brána (na telefóne hore a dole, RP2-07), slová pozdravu idú s nimi
    var o = { duration: ms, easing: kr('clona'), fill: 'both' }, x = tel ? 'translateY(' : 'translateX(';
    A(ov.querySelector('.br-l'), [{ transform: 'none' }, { transform: x + '-106%)' }], o);
    A(ov.querySelector('.br-p'), [{ transform: 'none' }, { transform: x + '106%)' }], o);
  }
  // rýchla cesta: brána len pozdraví a otvorí sa kratšie; otvára sa, keď je fotka úvodu
  // vykreslená (najneskôr CAKAJP od prvého vykreslenia), aby sa počas pohybu krídel nedekódovala a neodkryl sa prázdny rám
  function rychlo() {
    if (stav) return;
    an.concat(txt).forEach(function (a) { a.cancel(); }); an = []; txt = [];   // pripravený celý scenár sa zruší
    stav = 1; k = 1; znacka('br-otvor');
    w.brCas = { f: Math.round(f0), pr: Math.round(hotova), otvor: Math.round(performance.now()), rychlo: 1 };
    kridla(440);   // kratšie: na pomalej sieti už pozdrav trval dosť dlho
    odkry(440, kr('vyjazd'));   // ani tu nie sú naraz dva nápisy (KZ-01)
    A(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: ZMIZ, delay: 350, fill: 'forwards' });
    hotovo({ rychlo: true });
  }
  // KZ-01 (11. 11. 2026): nadpis úvodu leží pod švom krídel, preto ho škára medzi krídlami odkrývala po kúskoch a bol
  // vidieť prerezaný. Pozdrav v krídlach zhasne počas prvej časti otvárania (krídla sa vtedy ešte takmer nehýbu), riadok
  // nad nadpisom („Stavebniny Richtárik, Nitra. Od roku 1997“) a každé slovo nadpisu vyjdú až vtedy, keď sú krídla celkom
  // mimo nich. Kedy krídlo prejde okrajom prvku, sa vypočíta z rozmerov (jedno čítanie v snímke otvorenia) a z krivky
  // clony, takže to platí pri každej šírke okna.
  function krivka(n) {   // čas (0–1), kedy krivka clony dosiahne priebeh p (cubic-bezier, polením); bez krivky lineárne
    var m = /cubic-bezier\(([^)]+)\)/.exec(kr(n)), c = m && m[1].split(',').map(parseFloat);
    if (!c || c.length !== 4 || c.some(isNaN)) return function (p) { return p; };
    var B = function (a, b, s) { return 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s; };
    return function (p) {
      if (p <= 0) return 0; if (p >= 1) return 1;
      for (var lo = 0, hi = 1, s = .5, i = 0; i < 24; i++, s = (lo + hi) / 2) { if (B(c[1], c[3], s) < p) lo = s; else hi = s; }
      return B(c[0], c[2], s);
    };
  }
  function odkry(D, vy) {   // D: trvanie krídel v ms; vráti, kedy je odkrytý riadok nad nadpisom úvodu
    var V = ov.getBoundingClientRect(), cas = krivka('clona'), zn = d.querySelector('.uv-nad');
    var pol = tel ? (V.top + V.bottom) / 2 : (V.left + V.right) / 2, dr = 1.06 * (tel ? V.height : V.width) / 2;
    var volny = function (el) {   // ms od začiatku otvárania, keď už prvok nekryje žiadne krídlo
      if (!el) return 0;
      var r = el.getBoundingClientRect(), a = tel ? Math.max(r.top, V.top) : Math.max(r.left, V.left), b = tel ? Math.min(r.bottom, V.bottom) : Math.min(r.right, V.right);
      if (a >= b) return 0;
      return Math.round(D * cas(Math.min(1, Math.max(0, (pol - a) / dr, (b - pol) / dr) + .02)));
    };
    var tz = volny(zn), tf = Math.max(Math.min(tz, Math.round(D * .45)), 120);
    [].forEach.call(ov.querySelectorAll('.br-tab'), function (x) { A(x, [{ opacity: 1 }, { opacity: 0 }], { duration: tf, easing: 'linear', fill: 'forwards' }); });
    A(zn, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: T(300), delay: tz, easing: vy, fill: 'backwards' }, txt);
    // slová nadpisu nabiehajú postupne ako na pôvodnom webe (posun zdola a prelnutie, krok 47 ms × M)
    var pos = 0;
    [].forEach.call(d.querySelectorAll('.uv h1 .w'), function (s, j) {
      pos = Math.max(T(100 + j * 47), volny(s), tz + T(60 + j * 47));
      A(s, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { duration: T(600), delay: pos, easing: vy, fill: 'backwards' }, txt);
    });
    [].forEach.call(d.querySelectorAll('.uv-b,.uv-info'), function (s, j) {
      A(s, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: T(500), delay: Math.max(volny(s), pos + T(60 + j * 60)), easing: vy, fill: 'backwards' }, txt);
    });
    return tz;
  }
  function otvor() {
    if (stav) return;
    if (w.scrollY > 4) return rychlo();
    var t = performance.now(), vy = kr('vyjazd'), D = T(OTV);
    stav = 1; k = 1; znacka('br-otvor'); znacka('br-usad', t);
    w.brCas = { f: Math.round(f0), pr: Math.round(hotova), otvor: Math.round(t) };
    ov.style.pointerEvents = 'none';
    kridla(D);
    w.brCas.nazov = odkry(D, vy);
    A(d.querySelector('.uv-bg'), [{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: T(800), easing: kr('kamera'), fill: 'backwards' }, txt);
    hotovo({});
  }

  try {
    ov = ov0;
    tel = w.matchMedia('(max-width:700px)').matches;   // rozmery sa tu nečítajú (vynútili by prepočet štýlov počas načítania)
    zap(1);
    // otvorí sa v prvej snímke po t0 = max(prvé vykreslenie + DRZ, fotka pripravená); fotka musí byť pripravená do
    // termínu (prvé vykreslenie + CAKAJ, najneskôr toľko, aby otvorenie skončilo do CIEL), inak rýchla cesta
    var skus = function () {
      if (stav || !f0 || !hotova) return;
      var z = DRZ - (performance.now() - f0);
      if (pomala) return vykr && po(z, function () { requestAnimationFrame(rychlo); });   // rýchla cesta až po vykreslení fotky
      po(z, function () { requestAnimationFrame(otvor); });
    };
    var fcp = function (t) {
      if (f0) return;
      f0 = t || 1; znacka('br-f', f0);
      var termin = Math.min(f0 + CAKAJ, CIEL - (OTV * 2 + 120) * M);
      pomala = f0 > POMALE || f0 + DRZ > termin;   // otvorenie by nestihlo CIEL: len pozdrav a rýchla cesta
      po((pomala ? f0 + CAKAJP : termin) - performance.now(), rychlo); skus();
    };
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (e.name === 'first-contentful-paint') fcp(e.startTime); }); }).observe({ type: 'paint', buffered: true }); } catch (x) {}
    if (!w.PerformanceObserver || (PerformanceObserver.supportedEntryTypes || []).indexOf('paint') < 0) requestAnimationFrame(function () { requestAnimationFrame(function () { fcp(performance.now()); }); });
    var pripravena = function (p) { hotova = hotova || performance.now(); if (p) vykr = 1; skus(); };   // fotka dekódovaná, p: aj vykreslená
    // fotka je pripravená, keď ju prehliadač vykreslil (LCP úvodu) alebo dekódoval
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { var el = e.element; if (el && el.closest && el.closest('.uv-f0')) pripravena(1); }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (x) {}
    // skript stojí pred <main>: prvá fotka úvodu je v HTML až za ním, preto sa hľadá po rozobratí stránky
    var najdi = function () {
      var img = d.querySelector('.uv-f0 img');
      if (img && img.decode) img.decode().then(function () { pripravena(); }, function () { if (img.complete && img.naturalWidth) pripravena(); });
    };
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', najdi, { once: true }); else najdi();
    setTimeout(function () { if (stav < 3) koniec({ rychlo: true }); }, 9000);   // poistka
  } catch (e) {
    h.classList.remove('br-ide');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }
})(document, window);
