/* Prechody medzi stránkami (View Transitions medzi dokumentmi). Zdroj skriptu, ktorý build.py zmenší a vloží do <head>
   každej stránky (index.html ručne, kontrola_uvodu() overí zhodu). Musí bežať pred prvým vykreslením (udalosť pagereveal).
   Bez podpory (Firefox, staršie prehliadače) sa nič nestane a navigácia je okamžitá. Mená sú krátke, lebo skript ide
   do každej stránky (rozpočet 1,9 kB gzip):
     P(u)  cesta adresy bez index.html
     E(s, k, z) hrana k pevnej lišty s (z, keď lišta nie je viditeľná)
     V(el) prvok je medzi hornou a spodnou lištou viditeľný aspoň zo 60 % (RP2-03: zdieľaný prvok nevzlietne spod lišty)
     R(el) nadpis v jednom riadku a verzálkami (inak by mal na dlaždici a v hlavičke iný pomer strán a deformoval sa)
     T(el) text nadpisu                        F(el) meno fotky bez veľkosti a prípony (rovnaká fotka = bez prelínania)
     D(u)  dlaždica s odkazom na adresu u: {f: fotka, n: nadpis, s: štítok}   H() hlavička stránky: {f: fotka, n: H1, s: štítok}
     N(el, meno, vt) pomenuje prvok pre tento prechod                 Y(vt, typ) pridá typ prechodu
   Typy (README, časť Pohyb a prechody): dalej (bežný odkaz, Vpred), spat (Späť, drobčeky, odkaz Späť), strih (menu,
   päta, spodná lišta a tlačidlá úvodu), strih-spat (Späť zo stránky, na ktorú sa prišlo strihom: list odíde nadol,
   RP2-02), prelnutie (na dlaždici je iná fotka ako v hlavičke), zmenu (prechod z otvoreného menu na telefóne: panel
   odíde doprava ako opona a pod ním už stojí nová stránka, RP2-05).
   Zdieľané prvky: foto (fotka dlaždice katalógu, zásob, noviniek alebo karty značky ↔ fotka hlavičky), nadpis (názov
   dlaždice ↔ H1, len rovnaký text a len od 701 px, kde je nadpis na dlaždici aj v hlavičke pod fotkou, RP2-04), stitok
   (štítok karty akcie ↔ štítok akcie, od 701 px, RP2-12), ciara (podčiarknutie aktívnej položky menu na počítači),
   menu (otvorený panel menu). Lišta a spodná lišta stoja (CSS).
   data-vt na <html>: typ, ktorým stránka prišla (CSS podľa neho pridá vstup H1 z drážky); trieda vt: stránka prišla
   prechodom. sessionStorage vt:<kľúč položky histórie>: typ príchodu na položku (zrkadlo pri Späť, zopakovanie pri Vpred).
   vtBeh: prechod tejto stránky (alebo null) pre site.js, ktorý odloží prácu až po prechode.
   Ľahká verzia (RP1-09): keď prechod na zariadení dvakrát v relácii seká (meria site.js, sessionStorage vt-lahke ≥ 2),
   ďalšie prechody idú bez zdieľaných prvkov a bez strihu. */
(function (w, d) {
  if (!('onpagereveal' in w)) return;
  var K = 'vt', L = 'vt-lahke', ss = null, klik = null, h = d.documentElement, lahke = 0;
  try { ss = w.sessionStorage; lahke = ss.getItem(L) > 1; } catch (e) { ss = null; }
  function P(u) { try { return new URL(u, location.href).pathname.replace(/index\.html$/, ''); } catch (e) { return ''; } }
  function E(s, k, z) { var r = (d.querySelector(s) || h).getBoundingClientRect(); return r.height && r.height < innerHeight ? r[k] : z; }
  function V(el) { var r = el && el.getBoundingClientRect(); return !!r && r.width > 0 && Math.min(r.bottom, E('.mbar', 'top', innerHeight)) - Math.max(r.top, E('.top', 'bottom', 0)) >= r.height * .6; }
  function R(el) { var s = getComputedStyle(el); return s.textTransform == 'uppercase' && el.offsetHeight < parseFloat(s.fontSize) * 1.6; }
  function T(el) { return el.textContent.trim().toLowerCase().replace(/\s+/g, ' '); }
  function I(el) { return el.tagName == 'IMG' ? el : el.querySelector('img'); }   // fotka v ráme dlaždice alebo hlavičky
  function F(el) { var i = I(el); return i ? (i.currentSrc || i.src).split('/').pop().replace(/(-\d+)?\.\w+$/, '') : ''; }
  function D(u) {
    var c = P(u), a = d.querySelectorAll('a.cat,a.zt,a.nov,a.deal,.znacka .zl a'), W = innerWidth > 700, i, x, f, n, s;
    for (i = 0; i < a.length; i++) if (P(a[i].href) == c) {
      x = a[i].closest('.znacka') || a[i];
      f = x.matches('.zt') ? x : x.querySelector('.ph,.zm'); n = W && x.matches('.cat') && x.querySelector('h2,h3'); s = W && x.matches('.deal') && x.querySelector('.tag');
      if (f && !I(f)) f = 0;
      if (V(f) || V(n) || V(s)) return { f: V(f) && f, n: V(n) && n, s: V(s) && s };
    }
    return {};
  }
  function H() { var W = innerWidth > 700, f = d.querySelector('.ph-foto'), n = W && d.querySelector('.page-head h1'), s = W && d.querySelector('.akcia-tag .tag'); return { f: V(f) && f, n: V(n) && n, s: V(s) && s }; }
  function C() { var c = innerWidth > 980 && d.querySelector('.nav-ciara'); return c && c.offsetWidth ? c : 0; }   // len pri aktívnej položke menu na počítači (lišta je vždy v okne)
  function N(el, m, vt) { if (!el) return; el.style.viewTransitionName = m; var z = function () { el.style.viewTransitionName = ''; }; vt.finished.then(z, z); }
  function Y(vt, t) { vt.types && vt.types.add(t); }
  d.addEventListener('click', function (e) { klik = e.target.closest && e.target.closest('a[href]'); }, true);

  // stará stránka: typ prechodu, pomenovanie zdieľaných prvkov, odkaz pre novú stránku (sessionStorage)
  w.addEventListener('pageswap', function (e) {
    var vt = e.viewTransition, a = e.activation, n = w.navigation, m = d.getElementById('drawer'), o, t = 'dalej', p, tr, sp;
    if (!vt || !a || !a.entry) return;
    tr = a.navigationType == 'traverse'; o = m && m.classList.contains('open');
    sp = tr ? n && n.currentEntry && a.entry.index < n.currentEntry.index : klik && klik.closest('.crumbs,.back');
    if (sp) t = 'spat';
    // RP2-02: Späť zo stránky, na ktorú sa prišlo strihom, je jeho zrkadlo (list odíde nadol); Vpred strih zopakuje
    if (tr && !lahke && ss && ss.getItem(K + ':' + (sp ? n.currentEntry : a.entry).key) == 'strih') t = sp ? 'strih-spat' : 'strih';
    p = lahke || o || /^st/.test(t) ? {} : t == 'spat' ? H() : D(a.entry.url);
    if (t == 'dalej' && !p.f && !p.n && !p.s && !tr && !lahke && !o && klik && klik.closest('.nav,.drawer,footer,.mbar,.uv .cta,.uv-odkazy')) t = 'strih';
    if (p.n && !R(p.n)) p.n = 0;
    N(p.f, 'foto', vt); N(p.n, 'nadpis', vt); N(p.s, 'stitok', vt); N(C(), 'ciara', vt); Y(vt, t);
    if (o) { N(m, 'menu', vt); Y(vt, 'zmenu'); }
    if (ss) ss.setItem(K, JSON.stringify({ u: P(a.entry.url), t: t, f: p.f ? F(p.f) || '-' : '', n: p.n ? T(p.n) : '', s: p.s ? 1 : 0, m: o ? 1 : 0 }));
  });

  // nová stránka: ten istý typ a zdieľané prvky (len hotová fotka: nenačítaná by letela ako prázdny rám).
  // Trieda vt: stránka prišla prechodom, vstup hlavičky aj úvodu (CSS) sa nespustí, aby sa naraz hýbal len prechod.
  w.addEventListener('pagereveal', function (e) {
    var vt = e.viewTransition, a = w.navigation && w.navigation.activation, z = null, t, p, i;
    w.vtBeh = vt;
    if (!vt) return;
    if (!a || a.navigationType == 'reload' || matchMedia('(prefers-reduced-motion:reduce)').matches) return vt.skipTransition();
    if (ss) try { z = JSON.parse(ss.getItem(K)); ss.removeItem(K); } catch (x) {}
    if (z && z.u != P(location.href)) z = null;
    t = z ? z.t : a.navigationType == 'traverse' && a.from && a.entry && a.entry.index < a.from.index ? 'spat' : 'dalej';
    Y(vt, t); if (z && z.m) Y(vt, 'zmenu');
    h.classList.add('vt'); h.dataset.vt = t;
    // typ príchodu na túto položku histórie (z otvoreného menu ako strih); prechod históriou ho neprepíše
    if (ss && a.navigationType != 'traverse' && a.entry) ss.setItem(K + ':' + a.entry.key, z && z.m ? 'strih' : t);
    if (z && (z.f || z.n || z.s)) {   // dlaždice a hlavička sa hľadajú len pri prechode so zdieľaným prvkom
      p = t != 'spat' ? H() : a.from ? D(a.from.url) : {};
      i = p.f && I(p.f);
      if (z.f && i && i.complete && i.naturalWidth) { N(p.f, 'foto', vt); if (F(p.f) != z.f) Y(vt, 'prelnutie'); }
      // Späť na stránku načítanú znova: fotka dlaždice ešte nie je hotová, hlavička v nej počká (site.js, vtCakaj)
      else if (z.f && i && t == 'spat') { N(p.f, 'foto', vt); w.vtCakaj = [vt, i]; }
      if (z.n && p.n && T(p.n) == z.n && R(p.n)) N(p.n, 'nadpis', vt);
      if (z.s && p.s) N(p.s, 'stitok', vt);
    }
    N(C(), 'ciara', vt);
    // ťuknutie alebo kláves počas prechodu ho hneď ukončí (prechod nesmie zdržať interakciu)
    var s = function () { vt.skipTransition(); }, o = { once: true, capture: true };
    w.addEventListener('pointerdown', s, o); w.addEventListener('keydown', s, o);
    var k = function () { w.removeEventListener('pointerdown', s, true); w.removeEventListener('keydown', s, true); };
    vt.finished.then(k, k);
  });
})(window, document);
