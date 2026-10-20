// A/B T3: app.js nezapisuje --sp (prejazd zálohy a posun dosky stoja)
(() => { const o = CSSStyleDeclaration.prototype.setProperty; CSSStyleDeclaration.prototype.setProperty = function (n, v, p) { if (n === '--sp') return; return o.call(this, n, v, p); }; })();
