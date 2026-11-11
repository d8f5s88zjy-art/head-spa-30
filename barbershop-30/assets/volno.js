/*
 * BARBERSHOP 30 – je miesto voľné? Pre vrstvy nad stránkou (bublina Barbera, ponuka jazyka), ktoré nesmú ležať cez text
 * (Lajko 9. 11. 2026: „prekrývajúce sa texty sú neprofesionálne“). Rovnaké pravidlo ako „Ďalej“ v kino.js (volno()):
 * obdĺžnik r s rezervou z px nesmie pretínať žiadny viditeľný text stránky; texty vo vrstvách okrem sa nerátajú.
 * Viditeľný = nie display:none ani visibility:hidden a účinné krytie aspoň 0,02, alebo práve nastupuje (bežiaci
 * prechod či animácia). Bežiaci pás služieb sa ráta celý. Volá sa len v pokoji (nie počas skrolu): číta rozloženie.
 */
export function volno(r, okrem = [], z = 8) {
  if (!r || !r.width || !r.height) return false;
  const L = r.left - z, T = r.top - z, R = r.right + z, B = r.bottom + z;
  const cez = (q) => q.width > 1 && q.height > 1 && q.right > L && q.left < R && q.bottom > T && q.top < B;
  const vidno = new Map();
  const viditelny = (el) => {
    if (vidno.has(el)) return vidno.get(el);
    let o = 1, v;
    const nizke = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') { v = false; break; }
      const op = +s.opacity;
      if (op < 1) { o *= op; if (op < 0.5) nizke.push(e); }
    }
    if (v === undefined) v = o >= 0.02 || (nizke.length > 0 && nizke.every((e) => !!e.getAnimations && e.getAnimations().some((a) => a.playState === 'running')));
    vidno.set(el, v); return v;
  };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rg = document.createRange();
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const p = n.parentElement;
    if (!p || !n.nodeValue.trim() || okrem.some((x) => x && x.contains(p))) continue;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TITLE|OPTION)$/.test(p.tagName)) continue;
    const pas = p.closest('.marquee');
    if (!cez((pas || p).getBoundingClientRect())) continue;
    if (!pas) { rg.selectNodeContents(n); if (![...rg.getClientRects()].some(cez)) continue; }
    if (viditelny(pas || p)) return false;
  }
  return true;
}
