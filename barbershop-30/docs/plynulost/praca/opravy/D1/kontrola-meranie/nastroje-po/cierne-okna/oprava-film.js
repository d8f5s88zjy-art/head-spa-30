// Skúška opravy F-TEX (film beží, cieľový záber nemá textúru): namiesto vymazaného plátna sa ukáže statická záloha
// tej istej karty (je v DOM nad plátnom, film aj záloha na telefóne sťahujú ten istý súbor -m-1448.avif), kým film
// záber nenahrá; potom záloha zmizne prelínaním. Zálohy v okolí sa vopred dekódujú (ako oprava-dekod.js).
// Vkladá sa cez rec.mjs --inject=oprava-film.js, repozitár sa nemení.
addEventListener('DOMContentLoaded', () => {
  const st = document.createElement('style');
  st.textContent = 'html.world-in .film-shot.f-wait .film-still{display:block!important;opacity:1!important;visibility:visible!important;transition:none!important}' +
    'html.world-in .film-shot.f-wait .film-still img{transform:none}';
  document.head.appendChild(st);
  const shots = [...document.querySelectorAll('.film-shot')];
  const done = new WeakSet();
  const dec = (shot) => {
    const im = shot.querySelector('.film-still img');
    if (!im || done.has(im)) return;
    done.add(im);
    const go = () => im.decode().catch(() => {});
    if (im.complete && im.naturalWidth) go(); else im.addEventListener('load', go, { once: true });
  };
  const mo = new MutationObserver((ms) => ms.forEach((m) => { if (m.target.classList.contains('is-near')) dec(m.target); }));
  shots.forEach((el) => { mo.observe(el, { attributes: true, attributeFilter: ['class'] }); if (el.classList.contains('is-near')) dec(el); });
  let waitEl = null, readyAt = 0;
  const loop = () => {
    const f = window.BS30_FILM;
    if (f && f.state && f.state.on && document.documentElement.classList.contains('world-in')) {
      const s = f.state, N = s.ready.length - 1, ci = Math.max(0, Math.min(N, Math.round(s.S)));
      const el = ci >= 1 ? shots[ci - 1] : null;      // cesta filmu: index 0 je prológ (fasáda), potom kotvy v poradí
      const ok = !s.ready[ci] || s.ready[ci].ready;
      if (!ok && el) {
        if (waitEl && waitEl !== el) waitEl.classList.remove('f-wait');
        waitEl = el; el.classList.add('f-wait'); readyAt = 0; dec(el);
      } else if (waitEl) {
        if (!readyAt) readyAt = performance.now();
        if (performance.now() - readyAt > 500) { waitEl.classList.remove('f-wait'); waitEl = null; }   // film už nabehol
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
