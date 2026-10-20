// A/B T3 (navrhovaná oprava): namiesto --sp na kotvu sa transform zapíše priamo na img zálohy a .film-content
(() => { const o = CSSStyleDeclaration.prototype.setProperty; CSSStyleDeclaration.prototype.setProperty = function (n, v, p) {
  if (n === '--sp') { const el = this.__el; if (el) { const t = +v; const img = el.__img || (el.__img = el.querySelector(':scope > .film-still img')); const fc = el.__fc || (el.__fc = el.querySelector('.film-content'));
    if (img && !document.documentElement.classList.contains('world-frame')) img.style.transform = `scale(${(1 + 0.06 * t).toFixed(4)})`; if (fc) fc.style.transform = `translateY(${((0.5 - t) * 28).toFixed(2)}px)`; } return; }
  return o.call(this, n, v, p); };
  const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
  Object.defineProperty(HTMLElement.prototype, 'style', { get() { const s = d.get.call(this); if (!s.__el) s.__el = this; return s; }, configurable: true });
})();
