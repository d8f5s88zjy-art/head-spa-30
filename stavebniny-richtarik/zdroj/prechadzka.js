/* Prechádzka predajňou (Lajo 10. 11. 2026: „zachovaj to, čo Google, že sa tam vieš pohybovať“). Zdroj: zdroj/prechadzka.js;
   build.py pred neho vloží zoznam zastávok (var DATA = …, build.py PRECHADZKA) a zmenší ho do assets/prechadzka.js. site.js
   modul načíta (import) až po kliknutí na „Prejsť sa predajňou“ alebo na záložku pohľadu z ulice – dovtedy sa nesťahuje
   modul, fotky zastávok ani nič z Googlu.
   Zastávka je jedna skutočná fotka majiteľa (nič sa nedomýšľa ani negeneruje). V zastávke sa dá rozhliadať: fotka je väčšia
   než okno, ťahaním prstom alebo myšou sa posúva (zotrvačnosť, jemný náklon v perspektíve), dva prsty, tlačidlá + a −,
   klávesy + a − alebo koliesko (v stránke s Ctrl, na celej obrazovke samo) priblížia. Fotka sa nikdy neukáže väčšia než
   DATA.lim-násobok skutočného rozlíšenia zdroja (1 bod zdroja najviac DATA.lim CSS bodu, vrátane náklonu). Medzi zastávkami sa prechádza
   šípkami ukotvenými na zemi (poloha v % fotky), klávesmi ← → ↑, tlačidlami pri názve a pásom náhľadov; prechod je nájazd
   do smeru šípky s prelnutím (620 ms), pri „obmedziť pohyb“ len prelnutie. Šípky sa držia v zábere: keď je ich miesto na
   fotke po posune alebo priblížení mimo okna, ostanú pri najbližšom okraji javiska (drzSipky), takže na ďalšiu zastávku sa
   dá prejsť bez hľadania. Zastávka typu panoráma (súbor v img/panorama/) sa otvorí v prehliadači panorám
   assets/panorama.js (guľa alebo valec) a šípky sa ukotvia na smer (yaw, pitch).
   Druhá záložka „Pohľad z ulice (Google)“: rám Street View vytvorený až po kliknutí (data-panorama-src od majiteľa má
   prednosť pred data-ulica); ak sa do 8 s nenačíta, ukáže sa správa a vráti sa prechádzka. Obe časti sú prepojené
   (Lajo 10. 11. 2026: „nech to má taký istý princíp“): na zastávke s kľúčom 'g' (prvá) je na zemi šípka „Pohľad z ulice
   (Google)“, v pohľade z ulice je pod rámom tlačidlo „Vojsť do predajne“ (prvá zastávka prechádzky).
   Zdroj musí mať bodkočiarky všade a bez regulárnych výrazov a šablónových reťazcov (zmensi_js). */
export function vytvor(p, pre) {
  var d = document, win = window;
  var reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Z = DATA.z, N = Z.length, LIM = DATA.lim, TRVANIE = 620, KRIVKA = 'cubic-bezier(.33,0,.2,1)';
  function q(s) { return p.querySelector(s); }
  function el(znacka, trieda, text) { var e = d.createElement(znacka); if (trieda) e.className = trieda; if (text) e.textContent = text; return e; }
  var ram = q('.pp-ram'), javisko = q('.pp-javisko'), start = q('.pp-start'), lista = q('.pp-lista'), cela = q('.pp-cela'), zavri = q('.pp-zavri');
  var tab1 = q('.pp-t1'), tab2 = q('.pp-t2'), ulica = q('.pp-ulica'), pata = q('.pp-pata'), stav = q('.pp-stav');
  var nahlad = javisko.querySelector('picture img'), textStart = start.textContent;
  var ulicaSrc = p.getAttribute('data-panorama-src') || p.getAttribute('data-ulica') || '';
  var rezim = '', bezi = false, scena = null, zoomy = null, plus = null, minus = null, vr = null, cur = -1, zasoba = {}, sw = 0, sh = 0;
  var behPrechodu = false, nazov = null, pocet = null, bSpat = null, bDalej = null, pas = null, nahlady = [], ro = null;

  function idx(id) { for (var i = 0; i < N; i++) { if (Z[i].id === id) return i; } return -1; }
  function adresa(u) { return new URL(pre + u, location.href).href; }

  // ── fotka zastávky: najmenší súbor, ktorý stačí na zobrazenú šírku (hustota displeja najviac 2); zväčšený súbor (nad
  // z.m, skutočné rozlíšenie) len keď je fotka na obrazovke širšia než zdroj
  function subor(z, sirka) {
    var f = z.f, ciel = sirka * Math.min(2, win.devicePixelRatio || 1), i = 0;
    if (sirka <= z.m * 1.1) ciel = Math.min(ciel, z.m);
    while (i < f.length - 1 && f[i][0] < ciel) i++;
    return f[i];
  }
  function nastavSubor(o, sirka, vynut) {
    var f = vynut || subor(o.z, sirka);
    if (f[0] <= o.sirka || (o.drz && !vynut)) return;
    o.sirka = f[0]; o.src.srcset = pre + f[1]; o.img.src = pre + f[2];
  }
  function pripravena(o) {
    if (o.hotova) return o.hotova;
    var i = o.img;
    if (i.decode) return i.decode().catch(function () {});
    return new Promise(function (ok) { if (i.complete) ok(); else { i.onload = i.onerror = function () { ok(); }; } });
  }

  // ── vrstva zastávky: obal (animuje sa pri prechode) a plátno s fotkou a šípkami (posun, mierka, náklon)
  var ZNAK = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M24 41V19" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M24 5 38 23H10Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
  // šípka na zemi: s = [cieľ, x, y, smer]; pod znakom je stály popis (Ďalej, Späť, Pohľad z ulice), poradie p určuje, ktorá
  // má prednosť, keď sa pri okraji javiska stretnú (dopredu 0, späť 1, na ulicu 2)
  function pridajSipku(o, trieda, nazovPreCitacku, nazov, popis, s, p, klik) {
    var b = el('button', 'pp-sipka' + trieda), zn = el('span', 'pp-sipka-zn'), txt = el('span', 'pp-sipka-txt', popis);
    b.type = 'button';
    b.setAttribute('aria-label', nazovPreCitacku);
    if (nazov) b.setAttribute('data-nazov', nazov);
    zn.style.setProperty('--u', s[3] + 'deg');
    zn.innerHTML = ZNAK;
    b.appendChild(zn); b.appendChild(txt);
    b.addEventListener('click', klik);
    if (!o.platno) b.hidden = true;
    o.el.appendChild(b);
    // rozmery okolo stredu (polovica šírky a výšky): odhad podľa druhu, po vložení do stránky sa zmerajú (drzSipky)
    o.sipky.push({ b: b, txt: txt, s: s, p: p, hw: p === 2 ? 84 : p ? 28 : 38, hh: p ? 28 : 38, m: false, von: false, x: 0, y: 0, t: '' });
  }
  function sipka(o, s) {
    var ciel = idx(s[0]), spat = ciel < o.i;
    pridajSipku(o, spat ? ' pp-sipka-spat' : '', (spat ? 'Späť: ' : 'Ďalej: ') + Z[ciel].n, Z[ciel].n, spat ? 'Späť' : 'Ďalej', s, spat ? 1 : 0, function () { chod(ciel, s); });
  }
  function vrstva(i) {
    var z = Z[i], o = { i: i, z: z, W: z.w, H: z.h, el: el('div', 'pp-vrstva'), platno: null, img: null, src: null, sirka: 0, pan: null, sipky: [], s: 0, sL: 0, tx: 0, ty: 0, nx: 0, ny: 0, nak: false, hotova: null };
    if (z.p) {
      // zastávka typu panoráma: prehliadač panorám do obalu, šípky sa ukladajú na smer (yaw, pitch) po každom prekreslení
      o.el.className = 'pp-vrstva pp-vrstva-pan';
      o.hotova = import(adresa('assets/panorama.js')).then(function (m) {
        return new Promise(function (ok) {
          o.pan = m.spusti(o.el, adresa(z.p), function () { ok(); }, { uhol: z.u, yaw: z.c[0], pitch: z.c[1], klavesy: false, popis: z.a, kresli: function () { poloz(o); } });
        });
      }).catch(function () {});
    } else {
      o.platno = el('div', 'pp-platno');
      var pic = el('picture');
      o.src = el('source'); o.src.type = 'image/avif';
      o.img = el('img'); o.img.alt = z.a; o.img.decoding = 'async'; o.img.draggable = false;
      pic.appendChild(o.src); pic.appendChild(o.img); o.platno.appendChild(pic); o.el.appendChild(o.platno);
    }
    z.s.forEach(function (s) { sipka(o, s); });
    // zo zastávky pri ceste (kľúč g) vedie šípka von na ulicu: pohľad z ulice od Googlu v tom istom okne
    if (z.g && ulicaSrc) pridajSipku(o, ' pp-sipka-spat pp-sipka-ulica', 'Pohľad z ulice (Google) – načíta obsah z Google Máp', '', 'Pohľad z ulice (Google)', [null, z.g[0], z.g[1], z.g[2]], 2, function () { ukaz('ulica'); if (tab2) tab2.focus({ preventScroll: true }); });
    o.sipky.sort(function (a, b) { return a.p - b.p; });
    return o;
  }
  function poloz(o) { if (o.pan) drzSipky(o); }   // panoráma: po každom prekreslení

  // ── geometria pohľadu: s = mierka (CSS bod na bod zdroja), tx a ty = poloha ľavého horného rohu fotky v javisku
  var cipyW = 0;   // šírka čipov vpravo hore (Celá obrazovka, Zavrieť): šípka pri hornom okraji ostane pod nimi
  function meraj() { var r = javisko.getBoundingClientRect(); sw = r.width; sh = r.height; cipyW = lista.offsetWidth || 0; }
  // kde náklon plátna v perspektíve (uloz) ukáže bod javiska (X, Y) – šípka ostane presne na svojom mieste fotky
  function sNaklonom(o, X, Y) {
    if (!o.nak) return [X, Y];
    var cx = sw / 2, cy = sh / 2, P = Math.round(Math.max(sw, sh) * 1.25), a = 2.5 * o.nx * Math.PI / 180, b = -1.5 * o.ny * Math.PI / 180;
    var dx = X - cx, dy = Y - cy, y1 = dy * Math.cos(b), z1 = dy * Math.sin(b), x2 = dx * Math.cos(a) + z1 * Math.sin(a), k = P / (P + dx * Math.sin(a) - z1 * Math.cos(a));
    return [cx + x2 * k, cy + y1 * k];
  }
  // šípky: tlačidlá vo vrstve zastávky nad plátnom, polohu v javisku dostávajú tu pri každej zmene pohľadu
  // (transformácia vlastnej vrstvy, len kompozítor). Šípka leží na svojom mieste fotky; keď je to miesto po posune alebo
  // priblížení mimo okna, ostane pri najbližšom okraji javiska (pod čipmi, vedľa tlačidiel + a −) – na ďalšiu zastávku
  // sa dá prejsť bez hľadania. Dve šípky sa neprekryjú: tá s nižšou prednosťou uhne pod alebo nad druhú.
  // V panoráme leží šípka na svojom smere (yaw, pitch) a pri okraji okna sa drží rovnako; smer mimo pohľadu (za chrbtom
  // alebo ďaleko bokom) sa skryje ako v Street View – vtedy ostáva krok v päte.
  // Rozmery okolo stredu: do strán polovica širšieho z dvojice kotúč a popis, hore polovica štvorca, dole ešte popis (17 px).
  function drzSipky(o) {
    var i, j, a, c, m, x, y, xmin, xmax, ymin, ymax, pod, nad, dolu, hore, t;
    for (i = 0; i < o.sipky.length; i++) {
      a = o.sipky[i];
      if (o.pan) {
        m = o.pan.premietni(a.s[1], a.s[2]);
        a.von = !m.vid; a.b.hidden = a.von;
        if (a.von) continue;
        m = [m.x, m.y];
      } else if (o.platno) m = sNaklonom(o, o.tx + a.s[1] / 100 * o.W * o.s, o.ty + a.s[2] / 100 * o.H * o.s);
      else return;
      if (!a.m && a.b.offsetWidth) { a.hw = Math.max(a.b.offsetWidth, a.txt.offsetWidth) / 2; a.hh = a.b.offsetHeight / 2; a.m = true; }
      xmin = a.hw + 8; xmax = sw - a.hw - 8; ymin = a.hh + 8; ymax = sh - a.hh - 23;
      x = Math.min(xmax, Math.max(xmin, m[0]));
      if (x + a.hw > sw - 20 - cipyW) ymin = 64 + a.hh;                     // pod čipmi vpravo hore
      y = Math.min(ymax, Math.max(ymin, m[1]));
      if (y - a.hh < 172 && x + a.hw > sw - 64) x = sw - 64 - a.hw;         // vedľa tlačidiel + a −
      for (j = 0; j < i; j++) {
        c = o.sipky[j];
        if (c.von || Math.abs(x - c.x) >= a.hw + c.hw + 6) continue;
        pod = c.y + c.hh + 17 + a.hh + 4; nad = c.y - c.hh - a.hh - 17 - 4;
        if (y >= pod || y <= nad) continue;
        dolu = pod <= sh - a.hh - 19; hore = nad >= ymin;   // uhne na tú stranu, kde na fotke leží (pod: popis ešte celý v javisku)
        if (dolu && (m[1] >= c.y || !hore)) y = pod; else if (hore) y = nad; else x = c.x + (c.x < sw / 2 ? 1 : -1) * (a.hw + c.hw + 8);
      }
      a.x = x; a.y = y;
      t = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%)';
      if (a.t !== t) { a.t = t; a.b.style.transform = t; }
    }
  }
  // náklon v perspektíve zväčší bližší okraj fotky najviac o 2,9 % (2,5° a 1,5° pri perspektíve 1,25 × dlhšia strana okna):
  // strop mierky je o to nižší, aby ani pri náklone žiadna časť fotky neprekročila LIM
  var MT = reduce ? 1 : 1.03;
  function hranice(o) {
    var kryt = Math.max(sw / o.W, sh / o.H), lim = LIM / MT, sf;
    if (kryt * 1.06 >= lim) { o.smin = o.smax = o.s0 = lim; return; }   // okno väčšie než dovolené zväčšenie: fotka ostane menšia než okno
    o.smin = kryt * 1.06; o.smax = Math.min(lim, o.smin * 2.2);
    sf = Math.sqrt(sw * sh / (o.W * o.H * 0.42));   // východisko: presah 30 % do strán, no vidno aspoň 42 % plochy fotky
    o.s0 = Math.min(o.smax, Math.max(o.smin, Math.min(1.3 * sw / o.W, sf)));
  }
  function obmedz(o) {
    var dw = o.W * o.s, dh = o.H * o.s, mx = 0, my = 0, a, b;
    o.nak = !reduce && dw >= sw * 1.055 && dh >= sh * 1.055;   // náklon len keď fotka okno prekrýva s rezervou (roh by inak ukázal podklad)
    if (o.nak) { mx = sw * 0.0175 + 2; my = sh * 0.0175 + 2; }
    if (dw <= sw + 2 * mx) { o.tx = (sw - dw) / 2; o.nx = 0; } else { a = sw - dw + mx; b = -mx; o.tx = Math.min(b, Math.max(a, o.tx)); o.nx = 1 - 2 * (o.tx - a) / (b - a); }
    if (dh <= sh + 2 * my) { o.ty = (sh - dh) / 2; o.ny = 0; } else { a = sh - dh + my; b = -my; o.ty = Math.min(b, Math.max(a, o.ty)); o.ny = 1 - 2 * (o.ty - a) / (b - a); }
  }
  function uloz(o) {
    var k = o.s / o.sL, t, cx = sw / 2, cy = sh / 2;
    if (o.nak) t = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) perspective(' + (Math.max(sw, sh) * 1.25).toFixed(0) + 'px) rotateY(' + (2.5 * o.nx).toFixed(3) + 'deg) rotateX(' + (-1.5 * o.ny).toFixed(3) + 'deg) translate3d(' + (o.tx - cx).toFixed(2) + 'px,' + (o.ty - cy).toFixed(2) + 'px,0)';
    else t = 'translate3d(' + o.tx.toFixed(2) + 'px,' + o.ty.toFixed(2) + 'px,0)';
    if (Math.abs(k - 1) > 0.0005) t += ' scale(' + k.toFixed(4) + ')';
    o.platno.style.transform = t;
    drzSipky(o);
  }
  // po priblížení dostane plátno skutočný rozmer (ostrý raster, prípadne väčší súbor) a mierka transformácie sa vráti na 1
  function usad(o) {
    o.sL = o.s; o.platno.style.width = (o.W * o.s).toFixed(1) + 'px'; o.platno.style.height = (o.H * o.s).toFixed(1) + 'px';
    nastavSubor(o, o.W * o.s); uloz(o);
  }
  function postav(o, bod) {   // východiskový pohľad zastávky: bod fotky (v %) do stredu okna
    hranice(o);
    if (!o.platno) return;
    o.s = o.s0; o.tx = sw / 2 - bod[0] / 100 * o.W * o.s; o.ty = sh / 2 - bod[1] / 100 * o.H * o.s;
    obmedz(o); usad(o);
  }
  function mierka(o, ns, ax, ay) {   // nová mierka okolo bodu okna (ax, ay): bod fotky pod ním ostane na mieste
    ns = Math.min(o.smax, Math.max(o.smin, ns));
    var u = (ax - o.tx) / (o.W * o.s), v = (ay - o.ty) / (o.H * o.s);
    o.s = ns; o.tx = ax - u * o.W * ns; o.ty = ay - v * o.H * ns;
    obmedz(o); uloz(o); stavZoomu();
    clearTimeout(o.tUsad);
    o.tUsad = setTimeout(function () { if (vr === o && bezi) usad(o); }, 170);
  }
  function stavZoomu() {
    if (!vr || !plus) return;
    var pevna = vr.pan ? false : vr.smax - vr.smin < 0.001;
    plus.disabled = pevna || (!vr.pan && vr.s >= vr.smax - 0.001); minus.disabled = pevna || (!vr.pan && vr.s <= vr.smin + 0.001);
    // priblížená fotka: ťah prstom ju posúva všetkými smermi (v stránke inak zvislý ťah patrí stránke)
    scena.classList.toggle('pp-zoomnute', !vr.pan && vr.s > vr.s0 * 1.04);
  }
  function priblizKrok(von) {
    if (!vr) return;
    if (vr.pan) { var ph = vr.pan.pohlad(); vr.pan.nastav(undefined, undefined, ph.fov + (von ? 8 : -8)); return; }
    mierka(vr, vr.s * (von ? 1 / 1.25 : 1.25), sw / 2, sh / 2);
  }

  // ── zotrvačnosť a kreslenie: beží len, kým sa niečo mení
  var vx = 0, vyy = 0, tPred = 0, beh = false, zmena = false;
  function snimka(t) {
    if (!bezi || !vr || vr.pan) { beh = false; tPred = 0; return; }
    var dt = tPred ? Math.min(50, t - tPred) : 16, k;
    tPred = t;
    if (vx || vyy) {
      k = Math.exp(-dt / 320);
      var px = vr.tx, py = vr.ty;
      vr.tx += vx * dt; vr.ty += vyy * dt; vx *= k; vyy *= k;
      obmedz(vr);
      if (Math.abs(vr.tx - px) < 0.01) vx = 0;
      if (Math.abs(vr.ty - py) < 0.01) vyy = 0;
      if (Math.abs(vx) < 0.02) vx = 0;
      if (Math.abs(vyy) < 0.02) vyy = 0;
      zmena = true;
    }
    if (zmena) { uloz(vr); zmena = false; }
    if (vx || vyy) requestAnimationFrame(snimka); else { beh = false; tPred = 0; }
  }
  function ozivi() { if (!beh && bezi) { beh = true; requestAnimationFrame(snimka); } }

  // ── ťahanie (pointer events: myš aj prst), dva prsty = priblíženie, dvojité ťuknutie = priblíženie a späť
  var akt = {}, prsty = 0, posl = null, vzd0 = 0, s0 = 0, tuk = null, pohnute = 0;
  function vzd() { var k = Object.keys(akt), a = akt[k[0]], b = akt[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  function stred() { var k = Object.keys(akt), a = akt[k[0]], b = akt[k[1]], r = javisko.getBoundingClientRect(); return { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }; }
  function dolu(e) {
    if (!vr || vr.pan || behPrechodu || (e.button && e.button !== 0) || e.target.closest('button')) return;
    akt[e.pointerId] = { x: e.clientX, y: e.clientY };
    prsty = Object.keys(akt).length;
    if (scena.setPointerCapture) { try { scena.setPointerCapture(e.pointerId); } catch (x) {} }
    vx = vyy = 0; pohnute = 0;
    posl = { x: e.clientX, y: e.clientY, t: e.timeStamp, vx: 0, vy: 0 };
    if (prsty === 2) { vzd0 = vzd(); s0 = vr.s; }
    scena.classList.add('taha');
  }
  function pohyb(e) {
    var a = akt[e.pointerId];
    if (!a || !vr || vr.pan) return;
    a.x = e.clientX; a.y = e.clientY;
    if (prsty >= 2) { var m = stred(); mierka(vr, s0 * vzd() / vzd0, m.x, m.y); pohnute = 99; return; }
    var dx = e.clientX - posl.x, dy = e.clientY - posl.y, dt = Math.max(1, e.timeStamp - posl.t);
    vr.tx += dx; vr.ty += dy; pohnute += Math.abs(dx) + Math.abs(dy);
    posl.vx = posl.vx * 0.4 + dx / dt * 0.6; posl.vy = posl.vy * 0.4 + dy / dt * 0.6;
    posl.x = e.clientX; posl.y = e.clientY; posl.t = e.timeStamp;
    obmedz(vr); zmena = true; ozivi();
  }
  function hore(e) {
    if (!akt[e.pointerId]) return;
    delete akt[e.pointerId];
    prsty = Object.keys(akt).length;
    if (prsty === 0) {
      scena.classList.remove('taha');
      if (vr && !vr.pan && e.type === 'pointerup') {
        if (pohnute < 8) {   // ťuknutie bez pohybu: druhé do 320 ms na tom istom mieste priblíži alebo vráti
          var r = javisko.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
          if (tuk && e.timeStamp - tuk.t < 320 && Math.abs(x - tuk.x) < 28 && Math.abs(y - tuk.y) < 28) { tuk = null; mierka(vr, vr.s > vr.s0 * 1.15 ? vr.s0 : Math.min(vr.smax, vr.s0 * 1.6), x, y); }
          else tuk = { t: e.timeStamp, x: x, y: y };
        } else if (!reduce && posl && e.timeStamp - posl.t < 80) { vx = posl.vx; vyy = posl.vy; ozivi(); }
      }
      posl = null;
    } else if (prsty === 1) { var k = Object.keys(akt), z = akt[k[0]]; posl = { x: z.x, y: z.y, t: e.timeStamp, vx: 0, vy: 0 }; }
  }
  function koliesko(e) {   // v stránke koliesko posúva stránku (priblíži len s Ctrl alebo gestom na touchpade), na celej obrazovke priblíži samo
    if (!vr || vr.pan || !(jeCela() || e.ctrlKey)) return;
    e.preventDefault();
    var r = javisko.getBoundingClientRect();
    mierka(vr, vr.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top);
  }
  function klaves(e) {
    if (!bezi || !vr || e.altKey || e.metaKey || e.ctrlKey) return;
    var k = e.key, ok = true, krok = 70, ph;
    if (e.shiftKey && k.indexOf('Arrow') === 0) {   // so Shiftom sa posúva pohľad
      if (vr.pan) { ph = vr.pan.pohlad(); vr.pan.nastav(ph.yaw + (k === 'ArrowLeft' ? -8 : k === 'ArrowRight' ? 8 : 0), ph.pitch + (k === 'ArrowUp' ? 6 : k === 'ArrowDown' ? -6 : 0)); }
      else { vx = vyy = 0; vr.tx += k === 'ArrowLeft' ? krok : k === 'ArrowRight' ? -krok : 0; vr.ty += k === 'ArrowUp' ? krok : k === 'ArrowDown' ? -krok : 0; obmedz(vr); uloz(vr); }
    } else if (k === 'ArrowRight' || k === 'ArrowUp') chod(cur + 1);
    else if (k === 'ArrowLeft') chod(cur - 1);
    else if (k === 'Home') chod(0);
    else if (k === 'End') chod(N - 1);
    else if (k === '+' || k === '=') priblizKrok(false);
    else if (k === '-') priblizKrok(true);
    else ok = false;
    if (ok) e.preventDefault();
  }

  // ── prechod medzi zastávkami: nájazd do smeru šípky a prelnutie; pri „obmedziť pohyb“ len prelnutie
  function kotvaVOkne(o, s) {   // poloha šípky v javisku (stred, keď šípka nie je)
    if (!s) return [sw / 2, sh / 2];
    if (o.pan) { var m = o.pan.premietni(s[1], s[2]); return m.vid ? [m.x, m.y] : [sw / 2, sh * 0.7]; }
    for (var i = 0; i < o.sipky.length; i++) { if (o.sipky[i].s === s && o.sipky[i].t) return [o.sipky[i].x, o.sipky[i].y]; }
    return [Math.min(sw, Math.max(0, o.tx + s[1] / 100 * o.W * o.s)), Math.min(sh, Math.max(0, o.ty + s[2] / 100 * o.H * o.s))];
  }
  function sipkaNa(o, ciel) { for (var i = 0; i < o.z.s.length; i++) { if (idx(o.z.s[i][0]) === ciel) return o.z.s[i]; } return null; }
  function chod(ciel, s) {
    if (!bezi || behPrechodu || ciel === cur || ciel < 0 || ciel >= N) return;
    behPrechodu = true; scena.setAttribute('aria-busy', 'true');
    vx = vyy = 0;
    var stara = vr, nova = zasoba[ciel] || (zasoba[ciel] = vrstva(ciel)), dozadu = ciel < cur;
    clearTimeout(stara.tUsad);
    meraj(); postav(nova, nova.z.c);
    var cakaj = setTimeout(function () { scena.classList.add('pp-caka'); }, 250);
    pripravena(nova).then(function () {
      clearTimeout(cakaj); scena.classList.remove('pp-caka');
      if (!bezi || vr !== stara) { behPrechodu = false; return; }
      var vrch = dozadu ? nova : stara, k = kotvaVOkne(stara, s || sipkaNa(stara, ciel)), a1, a2;
      if (dozadu) scena.insertBefore(nova.el, zoomy); else scena.insertBefore(nova.el, stara.el);
      drzSipky(nova);
      if (dozadu) k = kotvaVOkne(nova, sipkaNa(nova, stara.i));
      if (nova.pan) { nova.pan.nastav(); poloz(nova); }
      stara.el.classList.add('pp-odchadza'); oznac(ciel);
      function koniec() {
        if (stara.el.parentNode) stara.el.parentNode.removeChild(stara.el);
        stara.el.style.transformOrigin = nova.el.style.transformOrigin = '';
        stara.el.classList.remove('pp-odchadza');
        vr = nova; cur = ciel; behPrechodu = false; scena.removeAttribute('aria-busy');
        stavZoomu(); dopredu();
      }
      if (!vrch.el.animate) { koniec(); return; }
      if (reduce) a1 = dozadu ? nova.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'linear' }) : stara.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear', fill: 'forwards' });
      else {
        vrch.el.style.transformOrigin = k[0].toFixed(1) + 'px ' + k[1].toFixed(1) + 'px';
        if (dozadu) {   // krok späť: nová zastávka prichádza z priblíženia k šípke, ktorou sa z nej ide dopredu
          a1 = nova.el.animate([{ transform: 'scale(1.32)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: TRVANIE, easing: KRIVKA });
        } else {        // krok dopredu: stará zastávka sa priblíži do smeru šípky a zmizne, nová pod ňou dosadne
          a1 = stara.el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.32)', opacity: 0 }], { duration: TRVANIE, easing: KRIVKA, fill: 'forwards' });
          a2 = nova.el.animate([{ transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: TRVANIE, easing: KRIVKA });
        }
      }
      a1.onfinish = a1.oncancel = function () { a1.onfinish = a1.oncancel = null; koniec(); a1.cancel(); if (a2) a2.cancel(); };
    });
  }
  // susedné zastávky sa pripravia vopred (fotka sa stiahne, kým sa návštevník rozhliada); ostatné sa uvoľnia
  function dopredu() {
    Object.keys(zasoba).forEach(function (k) {
      var i = +k;
      if (Math.abs(i - cur) > 1) { if (zasoba[k].pan) zasoba[k].pan.znic(); delete zasoba[k]; }
    });
    [cur + 1, cur - 1].forEach(function (i) {
      if (i < 0 || i >= N || zasoba[i] || Z[i].p) return;
      var o = vrstva(i);
      hranice(o); nastavSubor(o, o.W * o.s0); zasoba[i] = o;
    });
  }
  function oznac(c) {
    var z = Z[c];
    nazov.textContent = z.n; pocet.textContent = (c + 1) + ' z ' + N;
    bSpat.disabled = c === 0; bDalej.disabled = c === N - 1;
    scena.setAttribute('aria-label', 'Prechádzka predajňou, zastávka ' + (c + 1) + ' z ' + N + ': ' + z.n);
    nahlady.forEach(function (b, i) { if (i === c) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    var b = nahlady[c];
    if (b && pas.scrollTo) pas.scrollTo({ left: b.offsetLeft - (pas.clientWidth - b.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }

  // ── stavba javiska a päty (až pri prvom otvorení)
  function postavJavisko() {
    scena = el('div', 'pp-scena');
    scena.tabIndex = 0;
    scena.setAttribute('role', 'application');
    scena.setAttribute('aria-roledescription', 'prechádzka fotkami');
    scena.setAttribute('aria-describedby', 'pp-klavesy');
    var rada = el('p', 'vh', 'Šípkami vľavo a vpravo prejdete medzi zastávkami, šípkou hore o zastávku ďalej. So Shiftom šípky posúvajú pohľad, plus a mínus priblížia a oddialia.');
    rada.id = 'pp-klavesy';
    zoomy = el('div', 'pp-zoom');
    plus = el('button', '', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Priblížiť');
    minus = el('button', '', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Oddialiť');
    plus.addEventListener('click', function () { priblizKrok(false); });
    minus.addEventListener('click', function () { priblizKrok(true); });
    zoomy.appendChild(plus); zoomy.appendChild(minus);
    scena.appendChild(zoomy); scena.appendChild(rada);
    javisko.appendChild(scena);
    scena.addEventListener('pointerdown', dolu);
    scena.addEventListener('pointermove', pohyb);
    scena.addEventListener('pointerup', hore);
    scena.addEventListener('pointercancel', hore);
    scena.addEventListener('lostpointercapture', hore);
    scena.addEventListener('wheel', koliesko, { passive: false });
    scena.addEventListener('keydown', klaves);
    scena.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // päta: predchádzajúca a ďalšia zastávka, názov a poradie (číta sa pri zmene), pás náhľadov
    var nav = el('div', 'pp-nav'), stredok = el('p', 'pp-kde');
    bSpat = el('button', 'pp-krok'); bSpat.type = 'button'; bSpat.setAttribute('aria-label', 'Predchádzajúca zastávka');
    bDalej = el('button', 'pp-krok'); bDalej.type = 'button'; bDalej.setAttribute('aria-label', 'Ďalšia zastávka');
    bSpat.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    bDalej.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    bSpat.addEventListener('click', function () { chod(cur - 1); });
    bDalej.addEventListener('click', function () { chod(cur + 1); });
    nazov = el('b', 'pp-nazov'); pocet = el('span', 'pp-pocet');
    stredok.setAttribute('aria-live', 'polite'); stredok.setAttribute('aria-atomic', 'true');
    stredok.appendChild(nazov); stredok.appendChild(d.createTextNode(' ')); stredok.appendChild(pocet);
    nav.appendChild(bSpat); nav.appendChild(stredok); nav.appendChild(bDalej);
    pas = el('div', 'pp-pas');
    pas.setAttribute('role', 'group'); pas.setAttribute('aria-label', 'Zastávky prechádzky');
    Z.forEach(function (z, i) {
      var b = el('button', 'pp-nahlad'), pic = el('picture'), s = el('source'), im = el('img');
      b.type = 'button'; b.setAttribute('aria-label', 'Zastávka ' + (i + 1) + ': ' + z.n);
      s.type = 'image/avif'; s.srcset = pre + z.t[0];
      im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; im.width = 160; im.height = Math.round(160 * z.h / z.w); im.src = pre + z.t[1];
      pic.appendChild(s); pic.appendChild(im); b.appendChild(pic);
      b.addEventListener('click', function () { chod(i); });
      pas.appendChild(b); nahlady.push(b);
    });
    pata.appendChild(nav); pata.appendChild(pas);
    if (win.ResizeObserver) { ro = new ResizeObserver(zmenaRozmeru); ro.observe(javisko); } else win.addEventListener('resize', zmenaRozmeru);
  }
  function zmenaRozmeru() {
    if (!bezi || !vr || javisko.hidden) return;
    var psw = sw, psh = sh;
    meraj();
    if (Math.abs(psw - sw) < 0.5 && Math.abs(psh - sh) < 0.5) return;
    if (vr.pan) { poloz(vr); return; }
    var u = (psw / 2 - vr.tx) / (vr.W * vr.s), v = (psh / 2 - vr.ty) / (vr.H * vr.s), rel = vr.s / vr.s0;
    hranice(vr);
    vr.s = Math.min(vr.smax, Math.max(vr.smin, vr.s0 * rel)); vr.tx = sw / 2 - u * vr.W * vr.s; vr.ty = sh / 2 - v * vr.H * vr.s;
    obmedz(vr); usad(vr); stavZoomu();
  }

  // ── otvorenie prechádzky: prvá zastávka je fotka náhľadu (ak ju prehliadač už má, nič sa nesťahuje)
  function otvorPrechadzku() {
    if (bezi || start.disabled) return;
    start.disabled = true; start.setAttribute('aria-busy', 'true'); start.textContent = 'Načítava sa…';
    if (!scena) postavJavisko();
    meraj();
    var o = vrstva(0), mam = nahlad && nahlad.complete && nahlad.naturalWidth ? nahlad.currentSrc || '' : '', f = null;
    if (mam) o.z.f.forEach(function (x) { if (mam.slice(-x[1].length) === x[1] || mam.slice(-x[2].length) === x[2]) f = x; });
    zasoba = { 0: o };
    hranice(o);
    if (f) { nastavSubor(o, 0, f); o.drz = true; }   // náhľad je už stiahnutý: otvorí sa hneď, väčší súbor až potom
    postav(o, o.z.c);
    pripravena(o).then(function () {
      start.disabled = false; start.setAttribute('aria-busy', 'false'); start.textContent = textStart;
      if (rezim !== 'prechadzka' || bezi) return;
      bezi = true; vr = o; cur = 0;
      scena.insertBefore(o.el, zoomy);
      if (o.pan) { o.pan.nastav(); poloz(o); }
      p.classList.add('pp-on', 'pp-bezi'); start.hidden = true; lista.hidden = false; pata.hidden = false;
      meraj(); drzSipky(o);
      oznac(0); stavZoomu(); stav.textContent = '';
      scena.focus({ preventScroll: true });
      oznacOkno(); zarovnaj();
      o.drz = false;
      if (f && o.platno) usad(o);
      dopredu();
    });
  }

  // po otvorení sa okno prehliadky posunie do záberu (medzi lištu webu a spodnú lištu telefónu): keď sa zmestí celé, ukáže
  // sa celé (záložky, obraz, päta); keď nie, obraz ostane celý pod lištou webu a z päty je vidno, čo sa zmestí (na ďalšiu
  // zastávku vedie aj šípka na fotke). Posúva sa len o toľko, koľko treba; na celej obrazovke nič
  function zarovnaj() {
    if (jeCela()) return;
    var o = q('.pp-okno').getBoundingClientRect(), jv = (rezim === 'ulica' ? ulica : javisko).getBoundingClientRect(), hore = 0, dole = win.innerHeight, e, posun = 0;
    e = d.querySelector('.top');
    if (e) hore = Math.max(0, e.getBoundingClientRect().bottom);
    e = d.querySelector('.mbar');
    if (e && e.getClientRects().length && getComputedStyle(e).position === 'fixed') dole = e.getBoundingClientRect().top;
    hore += 4; dole -= 8;
    if (o.height <= dole - hore) { if (o.top < hore) posun = o.top - hore; else if (o.bottom > dole) posun = o.bottom - dole; }
    else if (jv.top < hore) posun = jv.top - hore;
    else if (o.bottom > dole) posun = Math.min(o.bottom - dole, jv.top - hore);
    if (Math.abs(posun) > 2) win.scrollBy({ top: posun, behavior: reduce ? 'auto' : 'smooth' });
  }
  // kým je otvorená prechádzka v okne prehliadača, ikona asistenta vpravo dole by zakrývala krok ďalej a náhľady:
  // trieda pp-vokne na <html> ju schová (assets/asistent.css)
  var vOkne = false;
  function oznacOkno() { d.documentElement.classList.toggle('pp-vokne', vOkne && p.classList.contains('pp-on')); }
  if (win.IntersectionObserver) new IntersectionObserver(function (z) { vOkne = z[z.length - 1].isIntersecting; oznacOkno(); }).observe(p);

  // ── pohľad z ulice (Google): rám až po kliknutí; bez načítania do 8 s správa a návrat na prechádzku
  var ramec = null, casovac = 0;
  function zrusUlicu() {
    clearTimeout(casovac);
    if (ramec && ramec.parentNode) ramec.parentNode.removeChild(ramec);
    ramec = null; ulica.classList.remove('pp-ulica-ok'); ulica.textContent = '';
  }
  function otvorUlicu() {
    if (ramec || !ulicaSrc) return;
    ulica.textContent = '';
    var veta = el('p', 'pp-ulica-veta', 'Načítava sa pohľad z ulice z Google Máp…');
    veta.setAttribute('role', 'status');
    ulica.appendChild(veta);
    ramec = el('iframe');
    ramec.title = 'Pohľad z ulice na predajňu Stavebniny Richtárik (Google Mapy)';
    ramec.allowFullscreen = true; ramec.setAttribute('allow', 'fullscreen'); ramec.referrerPolicy = 'no-referrer-when-downgrade';
    var moj = ramec;
    ramec.addEventListener('load', function () {
      if (ramec !== moj) return;
      clearTimeout(casovac); ulica.classList.add('pp-ulica-ok'); veta.textContent = '';
    }, { once: true });
    ramec.src = ulicaSrc;
    ulica.appendChild(ramec);
    casovac = setTimeout(function () {
      if (ramec !== moj || ulica.classList.contains('pp-ulica-ok')) return;
      zrusUlicu();
      stav.textContent = 'Pohľad z ulice sa nepodarilo načítať. Ostáva prechádzka predajňou.';
      if (jeCela() && !bezi) prepniCelu();
      ukaz('prechadzka', true);
      if (!bezi) { p.classList.remove('pp-on'); lista.hidden = true; }
      oznacOkno();
      (bezi ? tab1 : start).focus({ preventScroll: true });
    }, 8000);
  }

  // ── záložky
  function ukaz(r, bezOtvorenia) {
    var u = r === 'ulica';
    rezim = r;
    if (tab1 && tab2) {
      tab1.setAttribute('aria-selected', String(!u)); tab2.setAttribute('aria-selected', String(u));
      tab1.tabIndex = u ? -1 : 0; tab2.tabIndex = u ? 0 : -1;
    }
    javisko.hidden = u; ulica.hidden = !u; pata.hidden = u || !bezi;
    p.classList.toggle('pp-ulica-on', u);
    if (u) { stav.textContent = ''; p.classList.add('pp-on'); lista.hidden = false; otvorUlicu(); oznacOkno(); zarovnaj(); }
    else if (!bezOtvorenia) { if (!bezi) otvorPrechadzku(); else { zmenaRozmeru(); zarovnaj(); } }
  }
  // „Vojsť do predajne“ v páse pod pohľadom z ulice: prvá zastávka prechádzky (ak prechádzka beží inde, vráti sa na prvú)
  var vojdi = el('button', 'btn primary pp-vojdi');
  vojdi.type = 'button';
  vojdi.innerHTML = '<span>Vojsť do predajne</span>' + ZNAK;
  lista.insertBefore(vojdi, lista.firstChild);
  vojdi.addEventListener('click', function () {
    ukaz('prechadzka');
    if (!bezi) return;
    if (cur !== 0) chod(0);
    scena.focus({ preventScroll: true });
  });

  // ── celá obrazovka (requestFullscreen na celom komponente; kde nie je, pevná pozícia cez celé okno) a zatvorenie
  var sek = p.closest('main>section,main>div');
  function jeCela() { return d.fullscreenElement === p || p.classList.contains('pp-pevne'); }
  function pevne(z) { p.classList.toggle('pp-pevne', z); if (sek) sek.classList.toggle('pp-pevne-rodic', z); }
  function oznacCelu() {
    var c = jeCela();
    p.classList.toggle('pp-cela-on', c);
    cela.textContent = c ? 'Späť do stránky' : 'Celá obrazovka';
    if (vr && vr.pan) vr.pan.nastav();
  }
  function prepniCelu() {
    if (jeCela()) {
      if (d.fullscreenElement === p && d.exitFullscreen) d.exitFullscreen().catch(function () {});
      pevne(false); oznacCelu(); return;
    }
    var r = p.requestFullscreen ? p.requestFullscreen({ navigationUI: 'hide' }) : null;
    if (r && r.then) r.then(oznacCelu, function () { pevne(true); oznacCelu(); });
    else { pevne(true); oznacCelu(); }
  }
  function zavriVsetko() {
    if (jeCela()) prepniCelu();
    pevne(false); zrusUlicu();
    Object.keys(zasoba).forEach(function (k) { var o = zasoba[k]; clearTimeout(o.tUsad); if (o.pan) o.pan.znic(); if (o.el.parentNode) o.el.parentNode.removeChild(o.el); });
    zasoba = {}; vr = null; cur = -1; bezi = false; behPrechodu = false; vx = vyy = 0;
    p.classList.remove('pp-on', 'pp-bezi');
    if (scena) scena.classList.remove('pp-zoomnute');
    lista.hidden = true; start.hidden = false;
    ukaz('prechadzka', true);
    stav.textContent = ''; oznacOkno();
    start.focus({ preventScroll: true });
  }
  d.addEventListener('fullscreenchange', oznacCelu);
  cela.addEventListener('click', prepniCelu);
  zavri.addEventListener('click', zavriVsetko);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('pp-pevne')) prepniCelu(); });

  return {
    prepni: function (r) { if (r === 'ulica' && !ulicaSrc) r = 'prechadzka'; ukaz(r); },
    chod: chod,
    // stav pre skúšky: zastávka, mierka, poloha a rozmery
    pohlad: function () {
      return { rezim: rezim, bezi: bezi, i: cur, n: N, prechod: behPrechodu, sw: sw, sh: sh, s: vr ? vr.s : 0, s0: vr ? vr.s0 : 0, smin: vr ? vr.smin : 0, smax: vr ? vr.smax : 0, tx: vr ? vr.tx : 0, ty: vr ? vr.ty : 0, nx: vr ? vr.nx : 0, ny: vr ? vr.ny : 0, sirka: vr ? vr.sirka : 0, pan: vr && vr.pan ? vr.pan.pohlad() : null, lim: LIM };
    }
  };
}
