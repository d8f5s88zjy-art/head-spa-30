/* Uvítanie „Brána“: rozhodnutie pred prvým vykreslením (skript v <head> úvodu pred skriptom uv-ide; build.py ho zmenší,
   kontrola_uvodu() overí zhodu). Trieda br-ide na <html> sa pridá len pri prvej návšteve v relácii (sessionStorage
   br-videne), pri príchode zvonka (nie z inej stránky webu, nie Späť, Vpred ani obnovenie), bez kotvy v adrese, bez
   šetrenia dát, bez predvykreslenia, pri okne aspoň 300 × 420 px a bez „obmedziť pohyb“.
   ?uvitanie v adrese ho vynúti aj pri ďalšej návšteve (nie pri „obmedziť pohyb“). VYP = 1 uvítanie vypne celé.
   Výnimka zo sessionStorage (rám bez allow-same-origin) uvítanie nezablokuje. Bez JS nič. */
(function (h, w, d) {
  var VYP = 0;
  try {
    var q = /[?&]uvitanie\b/.test(location.search), c = navigator.connection, r = d.referrer, s;
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (VYP || !matchMedia('(prefers-reduced-motion: no-preference)').matches || location.hash || d.prerendering) return;
    if (w.innerWidth < 300 || w.innerHeight < 420) return;
    if (!q) {
      if (c && c.saveData) return;
      if (n && n.type && n.type !== 'navigate') return;
      try { if (r && new URL(r).origin === location.origin) return; } catch (e) {}
    }
    try { s = w.sessionStorage; if (!q && s.getItem('br-videne')) return; s.setItem('br-videne', '1'); } catch (e) {}
    h.classList.add('br-ide');
  } catch (e) {}
})(document.documentElement, window, document);
