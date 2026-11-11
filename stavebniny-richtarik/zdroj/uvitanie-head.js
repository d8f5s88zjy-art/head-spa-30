/* Uvítanie „Brána“: rozhodnutie pred prvým vykreslením (skript v <head> úvodu pred skriptom uv-ide; build.py ho zmenší,
   kontrola_uvodu() overí zhodu). Trieda br-ide na <html> sa pridá len pri prvej návšteve v relácii (sessionStorage
   br-videne), pri príchode zvonka (nie z inej stránky webu, nie Späť, Vpred ani obnovenie), bez kotvy v adrese, bez
   šetrenia dát, bez predvykreslenia, pri okne aspoň 300 × 420 px a bez „obmedziť pohyb“.
   ?uvitanie v adrese ho vynúti aj pri ďalšej návšteve (nie pri „obmedziť pohyb“). VYP = 1 uvítanie vypne celé.
   Výnimka zo sessionStorage (rám bez allow-same-origin) uvítanie nezablokuje. Bez JS nič.
   Úvod sa otvára hore (Lajko 11. 11. 2026: „Nech sa stránka otvára na úvode“): pri otvorení zvonka (odkaz z WhatsAppu,
   e-mailu alebo vyhľadávača, napísaná adresa) aj pri obnovení stránky sa kotva v adrese (#prehliadka …) zahodí ešte
   pred rozhodnutím o uvítaní a stránka začne hore na úvode; prehliadač vtedy neobnovuje ani starú polohu posunu.
   Späť a Vpred vracajú polohu ako doteraz (sekundu po načítaní a pred odchodom sa obnova polohy vráti na auto) a kotva
   v odkaze vnútri webu funguje. HORE = 0 správanie vypne. */
(function (h, w, d) {
  var VYP = 0, HORE = 1;
  try {
    var q = /[?&]uvitanie\b/.test(location.search), c = navigator.connection, r = d.referrer, s;
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (HORE && !(n && n.type === 'back_forward')) {
      var von = true;
      try { von = !(r && new URL(r).origin === location.origin); } catch (e) {}
      if (von || (n && n.type === 'reload')) {
        var hr = history, kot = location.hash;
        if ('scrollRestoration' in hr) {
          hr.scrollRestoration = 'manual';
          // len počas načítania: potom zase auto, aby Späť a Vpred (aj v rámci stránky po kotve) vracali polohu
          var auto = function () { hr.scrollRestoration = 'auto'; };
          w.addEventListener('pagehide', auto);
          w.addEventListener('load', function () { setTimeout(auto, 1000); });
        }
        if (kot) {
          hr.replaceState(hr.state, '', location.pathname + location.search);
          // prehliadač si kotvu z pôvodnej adresy pamätá: kým sa stránka nenačíta, poloha ostáva hore. Keď sa však
          // návštevník medzitým posunul sám (koliesko, ťah prstom, klávesy posunu), jeho polohu nemeníme – okrem prípadu,
          // keď je stránka presne tam, kam ju posunul prehliadač kvôli kotve (KZ-05, pomalá sieť). Ťuk bez ťahu sa nepočíta.
          var sam = 0, ja = function (e) { if (e.type !== 'keydown' || /^(Page|Arrow(Up|Down)|Home|End|\s)/.test(e.key)) sam = 1; };
          ['wheel', 'touchmove', 'keydown'].forEach(function (u) { w.addEventListener(u, ja, { capture: true, passive: true }); });
          var naKotve = function () {
            try {
              var el = d.getElementById(decodeURIComponent(kot.slice(1)));
              return !!el && Math.abs(el.getBoundingClientRect().top - (parseFloat(getComputedStyle(h).scrollPaddingTop) || 0) - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)) < 3;
            } catch (e) { return false; }
          };
          var hore = function () { if (w.scrollY && (!sam || naKotve())) w.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
          d.addEventListener('DOMContentLoaded', hore);
          w.addEventListener('load', function () { hore(); setTimeout(function () { hore(); ['wheel', 'touchmove', 'keydown'].forEach(function (u) { w.removeEventListener(u, ja, true); }); }, 0); });
        }
      }
    }
    if (VYP || !matchMedia('(prefers-reduced-motion: no-preference)').matches || location.hash || d.prerendering) return;
    if (w.innerWidth < 300 || w.innerHeight < 420) return;
    // Späť a Vpred bránu neukážu ani s ?uvitanie (odkazy pre Laja ho majú): návštevník sa vracia na miesto, kde bol,
    // a brána by sa pri prechode na chvíľu mihla cez sekciu (postreh videa 11. 11. 2026)
    if (n && n.type === 'back_forward') return;
    if (!q) {
      if (c && c.saveData) return;
      if (n && n.type && n.type !== 'navigate') return;
      try { if (r && new URL(r).origin === location.origin) return; } catch (e) {}
    }
    try { s = w.sessionStorage; if (!q && s.getItem('br-videne')) return; s.setItem('br-videne', '1'); } catch (e) {}
    h.classList.add('br-ide');
  } catch (e) {}
})(document.documentElement, window, document);
