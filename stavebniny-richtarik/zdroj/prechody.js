/* Prechody medzi stránkami (View Transitions medzi dokumentmi). Zdroj skriptu, ktorý build.py zmenší a vloží do <head>
   každej stránky (index.html ručne, kontrola_uvodu() overí zhodu). Musí bežať pred prvým vykreslením (udalosť pagereveal).
   Bez podpory (Firefox, staršie prehliadače) sa nič nestane a navigácia je okamžitá. Mená sú krátke, lebo skript ide
   do každej stránky (rozpočet 1,5 kB gzip):
     P(u)  cesta adresy bez index.html        V(el) prvok je v okne
     R(el) nadpis v jednom riadku a verzálkami (inak by mal na dlaždici a v hlavičke iný pomer strán a deformoval sa)
     T(el) text nadpisu                        F(el) meno fotky bez veľkosti a prípony (rovnaká fotka = bez prelínania)
     D(u)  dlaždica s odkazom na adresu u: {f: fotka, n: nadpis}     H() hlavička stránky: {f: fotka, n: H1}
     N(el, meno, vt) pomenuje prvok pre tento prechod                 Y(vt, typ) pridá typ prechodu
   Typy (README, časť Pohyb a prechody): dalej (bežný odkaz, Vpred), spat (Späť, drobčeky, odkaz Späť), strih (menu,
   päta, spodná lišta a tlačidlá úvodu), prelnutie (na dlaždici je iná fotka ako v hlavičke).
   Zdieľané prvky: foto (fotka dlaždice ↔ fotka hlavičky), nadpis (názov dlaždice ↔ H1, len rovnaký text), ciara
   (podčiarknutie aktívnej položky menu na počítači). Lišta a spodná lišta stoja (CSS). */
(function (w, d) {
  if (!('onpagereveal' in w)) return;
  var K = 'vt', ss = null, klik = null, h = d.documentElement;
  try { ss = w.sessionStorage; ss.getItem(K); } catch (e) { ss = null; }
  function P(u) { try { return new URL(u, location.href).pathname.replace(/index\.html$/, ''); } catch (e) { return ''; } }
  function V(el) { var r = el && el.getBoundingClientRect(); return !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight; }
  function R(el) { var s = getComputedStyle(el); return s.textTransform == 'uppercase' && el.offsetHeight < parseFloat(s.fontSize) * 1.6; }
  function T(el) { return el.textContent.trim().toLowerCase().replace(/\s+/g, ' '); }
  function I(el) { return el.tagName == 'IMG' ? el : el.querySelector('img'); }
  function F(el) { var i = I(el); return i ? (i.currentSrc || i.src).split('/').pop().replace(/(-\d+)?\.\w+$/, '') : ''; }
  function D(u) {
    var c = P(u), a = d.querySelectorAll('a.cat,a.zt,a.nov,a.deal'), i, x, f, n;
    for (i = 0; i < a.length; i++) if (P(a[i].href) == c) {
      x = a[i]; f = x.matches('.zt') ? x : x.querySelector('.ph'); n = x.matches('.cat') && x.querySelector('h2,h3');
      if (f && !I(f)) f = 0;
      if (V(f) || V(n)) return { f: V(f) && f, n: V(n) && n };
    }
    return {};
  }
  function H() { var f = d.querySelector('.ph-foto'), n = d.querySelector('.page-head h1'); return { f: V(f) && f, n: V(n) && n }; }
  function C() { var c = d.querySelector('.nav-ciara'); return V(c) && c; }   // je len pri aktívnej položke menu
  function N(el, m, vt) { if (!el) return; el.style.viewTransitionName = m; var z = function () { el.style.viewTransitionName = ''; }; vt.finished.then(z, z); }
  function Y(vt, t) { vt.types && vt.types.add(t); }
  d.addEventListener('click', function (e) { klik = e.target.closest && e.target.closest('a[href]'); }, true);

  // stará stránka: typ prechodu, pomenovanie zdieľaných prvkov, odkaz pre novú stránku (sessionStorage)
  w.addEventListener('pageswap', function (e) {
    var vt = e.viewTransition, a = e.activation, n = w.navigation;
    if (!vt || !a || !a.entry) return;
    var tr = a.navigationType == 'traverse', t = 'dalej', p;
    if (tr ? n && n.currentEntry && a.entry.index < n.currentEntry.index : klik && klik.closest('.crumbs,.back')) t = 'spat';
    p = t == 'spat' ? H() : D(a.entry.url);
    if (t == 'dalej' && !p.f && !p.n && !tr && klik && klik.closest('.nav,.drawer,footer,.mbar,.uv .cta,.uv-odkazy')) t = 'strih';
    if (p.n && !R(p.n)) p.n = 0;
    N(p.f, 'foto', vt); N(p.n, 'nadpis', vt); N(C(), 'ciara', vt); Y(vt, t);
    if (ss) try { ss.setItem(K, JSON.stringify({ u: P(a.entry.url), t: t, f: p.f ? F(p.f) || '-' : '', n: p.n ? T(p.n) : '' })); } catch (x) {}
  });

  // nová stránka: ten istý typ a zdieľané prvky (len hotová fotka: nenačítaná by letela ako prázdny rám).
  // Triedy vt-foto a vt-nadpis: fotka a H1 hlavičky prileteli z dlaždice, ich vlastný vstup (CSS) sa nespustí.
  w.addEventListener('pagereveal', function (e) {
    var vt = e.viewTransition, a = w.navigation && w.navigation.activation, z = null, t, p, i;
    if (!vt) return;
    if (!a || a.navigationType == 'reload' || matchMedia('(prefers-reduced-motion: reduce)').matches) return vt.skipTransition();
    if (ss) try { z = JSON.parse(ss.getItem(K)); ss.removeItem(K); } catch (x) {}
    if (z && z.u != P(location.href)) z = null;
    t = z ? z.t : a.navigationType == 'traverse' && a.from && a.entry && a.entry.index < a.from.index ? 'spat' : 'dalej';
    Y(vt, t);
    h.classList.remove('vt-foto', 'vt-nadpis');
    if (z) {
      p = t != 'spat' ? H() : a.from ? D(a.from.url) : {};
      i = p.f && I(p.f);
      if (z.f && i && i.complete && i.naturalWidth) { N(p.f, 'foto', vt); if (t != 'spat') h.classList.add('vt-foto'); if (F(p.f) != z.f) Y(vt, 'prelnutie'); }
      if (z.n && p.n && T(p.n) == z.n && R(p.n)) { N(p.n, 'nadpis', vt); if (t != 'spat') h.classList.add('vt-nadpis'); }
    }
    N(C(), 'ciara', vt);
    // ťuknutie alebo kláves počas prechodu ho hneď ukončí (prechod nesmie zdržať interakciu)
    var s = function () { vt.skipTransition(); }, o = { once: true, capture: true };
    w.addEventListener('pointerdown', s, o); w.addEventListener('keydown', s, o);
    var k = function () { w.removeEventListener('pointerdown', s, true); w.removeEventListener('keydown', s, true); };
    vt.finished.then(k, k);
  });
})(window, document);
