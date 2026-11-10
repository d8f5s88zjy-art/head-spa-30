/* Uvítanie „Brána“ pred úvodom (len index.html, skript pred <main>; build.py:uvitanie_bloky() ho zmenší, kontrola_uvodu()
   overí zhodu). Prekryv .br je v HTML ako prvý prvok <body>, takže pozdrav je v prvom vykreslení (CSS ho ukáže len pri
   triede br-ide). Bez triedy br-ide skript prekryv odstráni.
   Brána drží zatvorená, kým sa dá prečítať pozdrav (DRZ od prvého vykreslenia) a kým nie je dekódovaná fotka predajne (tá
   istá ako v úvode, žiadne bajty navyše). Celý scenár sa vopred v nečinnom čase vytvorí pozastavený (WAAPI
   s oneskoreniami, beží v kompozítore) a v prvej snímke po t0 sa spustí naraz: krídla sa rozídu do strán, kamera vojde
   dnu, objaví sa odznak a štítky, okno s fotkou sa usadí presne do rámu úvodu (.uv-ram), vyjde nadpis a ponuka úvodu,
   prekryv sa prelne a štítok „Naša predajňa“ sa vrazí. Koniec určujú prísľuby finished, nie časovače; na konci sa prekryv
   odstráni a vyšle sa udalosť br-koniec {preskocene, rychlo, t} (strih zásob a asistent v site.js čakajú na ňu).
   Triedy na <html> sa nemenia.
   Ťuk, klik, koliesko, kláves (aj Tab), posun, zmena šírky okna alebo skrytie karty uvítanie hneď ukončí: úvod je
   v konečnom stave a prekryv sa prelne za --dlzka-pusti. Pomalá sieť (prvé vykreslenie po POMALE) alebo fotka
   nepripravená včas: brána len pozdraví a otvorí sa rovno na úvod (rýchla cesta). Poistky: CSS skryje prekryv 4,8 s
   po prvom vykreslení, skript ho odstráni najneskôr po 9 s. Scenár po desatinách sekundy: README, časť Úvod.
   Tempo (majiteľ 9. 11. 2026: pomalšie animácie): všetky dĺžky a oneskorenia scenára násobí M = 1,5 (funkcia T),
   pozdrav drží 1,5× dlhšie; odozva na ťuk (preskočenie, --dlzka-pusti) a rýchla cesta sa nespomaľujú. */
(function (d, w) {
  var h = d.documentElement, ov0 = d.querySelector('body>.br');
  if (!ov0) return;
  if (!h.classList.contains('br-ide')) return ov0.parentNode.removeChild(ov0);
  // časy v ms: DRZ pozdrav od prvého vykreslenia, CAKAJ najdlhšie čakanie na fotku (CAKAJP pri rýchlej ceste), POMALE
  // hranica pomalej siete, ďalej od otvorenia t0 (násobí ich k, aby bol úvod použiteľný do CIEL od navigácie; k ≥ KMIN).
  // M je tempo: časy scenára OTV, DOK, DOKD a všetky dĺžky v T() sú základné (pôvodné) hodnoty × M; DRZ, CAKAJ a CIEL
  // sú už vynásobené (380, 900 a 2450 × 1,5)
  var M = 1.5, DRZ = 570, CAKAJ = 1350, CAKAJP = 700, POMALE = 1500, CIEL = 3700, KMIN = 0.72, OTV = 500, DOK = 600, DOKD = 520, KONIEC = DOK + DOKD, ZMIZ = 90;
  var ov, okno, sc, zO, stav = 0, an = [], txt = [], f0 = 0, hotova = 0, vykr = 0, pomala = false, k = 1, tel, vw, cs = getComputedStyle(h), cas = [];
  var far = h.getAttribute('data-tema') === 'farebna';   // farebná téma (predvolená): krídla sa rozídu rovno nad úvodom (otvorF)
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
  // rýchla cesta: brána len pozdraví a otvorí sa rovno na úvod (bez celej fotky); otvára sa, keď je fotka úvodu
  // vykreslená (najneskôr CAKAJP od prvého vykreslenia), aby sa počas pohybu krídel nedekódovala a neodkryl sa prázdny rám
  function rychlo() {
    if (stav) return;
    an.concat(txt).forEach(function (a) { a.cancel(); }); an = []; txt = [];   // pripravený celý scenár sa zruší
    stav = 1; k = 1; znacka('br-otvor');
    w.brCas = { f: Math.round(f0), pr: Math.round(hotova), otvor: Math.round(performance.now()), rychlo: 1 };
    okno.style.visibility = zO.style.visibility = 'hidden';
    kridla(440);   // kratšie ako pri celom scenári: na pomalej sieti už pozdrav trval dosť dlho
    A(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: ZMIZ, delay: 350, fill: 'forwards' });
    hotovo({ rychlo: true });
  }
  // celý scenár sa pripraví vopred v nečinnom čase počas pozdravu: rozmery sa čítajú raz v jednej úlohe (prekryv, rám
  // úvodu, scéna, fotka úvodu aj s posunom pri odchode a oba odznaky) a všetky animácie sa vytvoria pozastavené (pod
  // zatvorenou bránou nič z nich nevidno); v snímke otvorenia sa už len spustia. Rozmery sa medzitým nemenia (výšky
  // rámu a hlavičky určuje CSS, nie písmo). k sa určí z plánovaného času otvorenia t0.
  var G = 0;
  function priprav(t0) {
    if (G || stav) return G;
    var ram = d.querySelector('.uv-ram'), hl = ram && ram.querySelector('.uv-dvor img');
    if (!ram || !hl) return 0;
    var V = ov.getBoundingClientRect(), R = ram.getBoundingClientRect(), L = sc.getBoundingClientRect(), B = hl.getBoundingClientRect();
    vw = w.innerWidth;
    var zH = ram.querySelector('.uv-znak'), zo = zO.getBoundingClientRect(), zh = zH ? zH.getBoundingClientRect() : zo;
    // cieľ: fotka v ráme úvodu (object-fit: cover a object-position ako v CSS úvodu)
    var a = L.width / L.height, op = getComputedStyle(hl).objectPosition.split(' ');
    var px = parseFloat(op[0]) / 100, py = parseFloat(op[1] || '50%') / 100;
    var fw = Math.max(B.width, B.height * a), F = { x: B.left + (B.width - fw) * px, y: B.top + (B.height - fw / a) * py, w: fw };
    var ZV = tel ? 1.3 : 1.8;   // odznak „Skutočná fotka…“ je počas uvítania väčší, pri usadení prejde na odznak úvodu
    // usadenie: okno (celý prekryv) sa zmenší na rám úvodu a scéna vo vnútri opačne, aby fotka ostala v pomere strán;
    // rozloženie sa nemení (len transform), takže nevzniká posun rozloženia (CLS); 13 kľúčových snímok krivky ease in-out
    var N = 12, ko = [], ks = [], kz = [], i, q, p, wx, wy, sx, sy, Dx, Dy, Dw;
    for (i = 0; i <= N; i++) {
      q = i / N; p = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(2 - 2 * q, 3) / 2;
      wx = (R.left - V.left) * p; wy = (R.top - V.top) * p;
      sx = 1 + (R.width / V.width - 1) * p; sy = 1 + (R.height / V.height - 1) * p;
      Dx = L.left + (F.x - L.left) * p - V.left; Dy = L.top + (F.y - L.top) * p - V.top; Dw = L.width + (F.w - L.width) * p;
      ko.push({ offset: q, transform: 'translate(' + wx + 'px,' + wy + 'px) scale(' + sx + ',' + sy + ')' });
      ks.push({ offset: q, transform: 'translate(' + ((Dx - wx) / sx - (L.left - V.left)) + 'px,' + ((Dy - wy) / sy - (L.top - V.top)) + 'px) scale(' + (Dw / (sx * L.width)) + ',' + (Dw / (sy * L.width)) + ')' });
      kz.push({ offset: q, transform: 'translate(' + (zh.left - zo.left) * p + 'px,' + (zh.top - zo.top) * p + 'px) scale(' + (ZV + (1 - ZV) * p) + ')' });
    }
    k = Math.min(1, Math.max(KMIN, (CIEL - t0) / ((KONIEC + 120) * M)));
    var vy = kr('vyjazd'), dok = { duration: T(DOKD), delay: T(DOK), easing: 'linear', fill: 'both' };
    kridla(T(OTV));
    // kamera vojde dnu (1 → 1,05) a pri usadení sa vráti
    A(ov.querySelector('.br-kam'), [{ offset: 0, transform: 'none', easing: kr('kamera') }, { offset: Math.min(600, DOK) / KONIEC, transform: 'scale(1.05)' },
      { offset: DOK / KONIEC, transform: 'scale(1.05)', easing: 'cubic-bezier(.65,0,.35,1)' }, { offset: 1, transform: 'none' }], { duration: T(KONIEC), fill: 'both' });
    // odznak sa objaví a pri usadení prejde presne na odznak úvodu
    A(zO, [{ opacity: 0 }, { opacity: 1 }], { duration: T(260), delay: T(150), fill: 'both' });
    A(zO, kz, dok);
    // štítky vyjdú za sebou (krúžok špendlíka sa raz rozvlní) a zhasnú, keď fotka ide do rámu (na počítači sa fotka
    // zmenší menej, štítky ostanú čitateľné dlhšie)
    [].forEach.call(ov.querySelectorAll('.br-st'), function (s, j) {
      var del = T(tel ? 100 + j * 50 : 120 + j * 60);   // štítok vyjde ešte za krídlom, krídlo ho odkryje
      A(s, [{ opacity: 0, transform: 'translateY(8px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: T(260), delay: del, easing: vy, fill: 'both' });
      A(s, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: .8, offset: .2 }, { opacity: 0, transform: 'scale(2.6)' }], { duration: T(650), delay: del, easing: vy, pseudoElement: '::before' });
      A(s, [{ opacity: 1 }, { opacity: 0 }], { duration: T(150), delay: T(tel ? 940 : 1000), fill: 'forwards' });
    });
    A(okno, ko, dok);
    A(sc, ks, dok);
    // od začiatku usadenia ťuk prechádza na úvod (napr. Zavolať), dovtedy ho zachytí brána
    A(ov, [{ pointerEvents: 'none' }, { pointerEvents: 'none' }], { duration: 1, delay: T(DOK), fill: 'forwards' });
    // nadpis a ponuka úvodu vyjdú, keď ich usádzajúca sa fotka odkryje (rovnako ako bez uvítania)
    [].forEach.call(d.querySelectorAll('.uv h1 .ln>span'), function (s, j) {
      A(s, [{ transform: 'translateY(112%)' }, { transform: 'none' }], { duration: T(440), delay: T(DOK + 140 + j * 60), easing: vy, fill: 'backwards' }, txt);
    });
    A(d.querySelector('.uv-b'), [{ opacity: .2, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: T(360), delay: T(DOK + 200), easing: vy, fill: 'backwards' }, txt);
    // prelnutie do skutočného úvodu (rovnaká poloha, krátke prelnutie skryje iné prevzorkovanie) a pečiatka „Naša predajňa“
    A(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: ZMIZ, delay: T(KONIEC), fill: 'forwards' });
    A(ram.querySelector('.uv-ram>.uv-stitok'), [{ opacity: 0, transform: 'scale(1.35)' }, { opacity: 1, transform: 'none' }], { duration: T(360), delay: T(KONIEC) + 90, easing: kr('pecat'), fill: 'backwards' }, txt);
    an.concat(txt).forEach(function (a) { a.pause(); });
    return (G = 1);
  }
  function beh() {
    if (stav) return;
    var t = performance.now();
    if (!priprav(t) || w.scrollY > 4) return rychlo();
    stav = 1; znacka('br-otvor'); znacka('br-usad', t + T(DOK));
    w.brCas = { f: Math.round(f0), pr: Math.round(hotova), otvor: Math.round(t), k: +k.toFixed(2) };
    an.concat(txt).forEach(function (a) { a.play(); });
    w.brCas.js = Math.round(performance.now() - t);   // práca na hlavnom vlákne v snímke otvorenia
    hotovo({});
  }

  // farebná téma: úvod je fotka cez celú výšku s červeným panelom a názvom, takže okno s fotkou, usadenie do rámu ani štítky
  // nie sú (CSS ich skryje): krídla s logom a názvom sa rozídu rovno nad hotovým úvodom, fotka úvodu dosadne (1,06 → 1),
  // heslo vyjde z drážky a štítok predajne sa vrazí. Ťuk prechádza na úvod od prvej snímky otvorenia (Zavolať).
  function otvorF() {
    if (stav) return;
    if (w.scrollY > 4) return rychlo();
    var t = performance.now(), vy = kr('vyjazd');
    stav = 1; k = 1; znacka('br-otvor'); znacka('br-usad', t);
    w.brCas = { f: Math.round(f0), pr: Math.round(hotova), otvor: Math.round(t), far: 1 };
    ov.style.pointerEvents = 'none';
    kridla(T(OTV));
    A(d.querySelector('.uv-dvor'), [{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: T(800), easing: kr('kamera'), fill: 'backwards' }, txt);
    [].forEach.call(d.querySelectorAll('.uv h1 .ln>span'), function (s, j) {
      A(s, [{ transform: 'translateY(112%)' }, { transform: 'none' }], { duration: T(440), delay: T(160 + j * 60), easing: vy, fill: 'backwards' }, txt);
    });
    A(d.querySelector('.uv-ram>.uv-stitok'), [{ opacity: 0, transform: 'scale(1.35)' }, { opacity: 1, transform: 'none' }], { duration: T(360), delay: T(OTV), easing: kr('pecat'), fill: 'backwards' }, txt);
    hotovo({});
  }

  try {
    ov = ov0;
    okno = ov.querySelector('.br-okno'); sc = ov.querySelector('.br-scena'); zO = ov.querySelector('.uv-znak');
    tel = w.matchMedia('(max-width:700px)').matches;   // rozmery sa tu nečítajú (vynútili by prepočet štýlov počas načítania)
    if (!tel) { DOK = 560; DOKD = 440; KONIEC = DOK + DOKD; }   // počítač: veľký rám, fotka sa usádza na kratšiu vzdialenosť
    ov.querySelector('.br-kam').style.transformOrigin = tel ? '48% 50%' : '82% 52%';   // úbežník cesty medzi paletami (fotka 11, v pomere k celej širokej fotke)
    [].forEach.call(ov.querySelectorAll('.br-st'), function (s) {
      var m = s.getAttribute(tel ? 'data-tel' : 'data-pc');
      if (!m) return s.remove();
      m = m.split(' '); s.style.left = m[0] * 100 + '%'; s.style.top = m[1] * 100 + '%';
    });
    zap(1);
    var img = ov.querySelector('.br-foto');
    // otvorí sa v prvej snímke po t0 = max(prvé vykreslenie + DRZ, fotka pripravená); fotka musí byť pripravená do
    // termínu (prvé vykreslenie + CAKAJ, najneskôr toľko, aby scenár s k = KMIN skončil do CIEL), inak rýchla cesta
    var skus = function () {
      if (stav || !f0 || !hotova) return;
      var z = DRZ - (performance.now() - f0);
      if (pomala) return vykr && po(z, function () { requestAnimationFrame(rychlo); });   // rýchla cesta až po vykreslení fotky
      if (far) return po(z, function () { requestAnimationFrame(otvorF); });
      var ric = w.requestIdleCallback || function (f) { return setTimeout(f, 1); };
      ric(function () { priprav(f0 + DRZ); }, { timeout: Math.max(1, z - 40) });
      po(z, function () { requestAnimationFrame(beh); });
    };
    var fcp = function (t) {
      if (f0) return;
      f0 = t || 1; znacka('br-f', f0);
      var termin = Math.min(f0 + CAKAJ, CIEL - KMIN * (KONIEC + 120) * M);
      pomala = f0 > POMALE || f0 + DRZ > termin;   // celý scenár by nestihol CIEL: len pozdrav a rýchla cesta
      po((pomala ? f0 + CAKAJP : termin) - performance.now(), rychlo); skus();
    };
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (e.name === 'first-contentful-paint') fcp(e.startTime); }); }).observe({ type: 'paint', buffered: true }); } catch (x) {}
    if (!w.PerformanceObserver || (PerformanceObserver.supportedEntryTypes || []).indexOf('paint') < 0) requestAnimationFrame(function () { requestAnimationFrame(function () { fcp(performance.now()); }); });
    var pripravena = function (p) { hotova = hotova || performance.now(); if (p) vykr = 1; skus(); };   // fotka dekódovaná, p: aj vykreslená
    // fotka je pripravená, keď ju prehliadač vykreslil (LCP úvodu alebo uvítania) alebo dekódoval
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { var el = e.element; if (el && (el === img || el.closest('.uv-dvor'))) pripravena(1); }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (x) {}
    if (img.decode) img.decode().then(function () { pripravena(); }, function () { if (img.complete && img.naturalWidth) pripravena(); });
    setTimeout(function () { if (stav < 3) koniec({ rychlo: true }); }, 9000);   // poistka
  } catch (e) {
    h.classList.remove('br-ide');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }
})(document, window);
