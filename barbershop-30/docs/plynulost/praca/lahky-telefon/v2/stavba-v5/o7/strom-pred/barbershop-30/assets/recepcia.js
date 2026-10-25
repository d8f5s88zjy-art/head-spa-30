export const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function dl(a, b) {
  let i = 0;
  while (a[i] && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
}
function dice(a, b) {
  const g = (s) => [...s].slice(1).map((c, i) => s[i] + c), A = g(a), B = g(b), l = A.length + B.length;
  let n = 0;
  if (10 * Math.min(A.length, B.length) < 3 * l) return 0;
  for (const x of A) { const i = B.indexOf(x); if (i >= 0) { n++; B.splice(i, 1); } }
  return a.length < 2 || b.length < 2 ? 0 : (2 * n) / l;
}
export function zhoda(w, k) {
  if (k[0] === '=') return +(w === k.slice(1));
  if (k[0] === '>') return +(+w > +k.slice(1));
  const e = w.length - k.length;
  if (k.length < 5) return e < 0 || e > 3 || !w.startsWith(k) ? 0 : e < (k.length > 3 ? 4 : 2) ? 1 : 0.6;
  return w.startsWith(k) ? 1 : w.includes(k) ? 0.9 : (w.length > 3 && k.startsWith(w)) || (e >= 0 && w[0] === k[0] && [-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k))) ? 0.6 : w[0] === k[0] && dice(w, k) >= 0.6 ? 0.5 : 0;
}
const dlhy = (k) => k.length > 4 && !'=>'.includes(k[0]), ista = (w, k) => (dlhy(k) ? w.includes(k) : zhoda(w, k) > 0.89), pred = (w, k) => (dlhy(k) ? w.startsWith(k) : zhoda(w, k) === 1);
const cen = (kb, w) => kb._cen.some((c) => w.startsWith(c)), zo = (l, f = ista) => (w) => l.some((k) => f(w, k));
const vysvetli = (kb, P, w) => P._g.some((g) => g.some(([k]) => pred(w, k) || (ista(w, k) && !kb._k.some((j) => { const i = w.indexOf(k); return i < j.length && j.length < i + k.length && pred(w, j); }))));
function skore(ws, q, p, kb) {
  const hit = new Set(), h1 = new Set(), kr = new Set(), n = p._g.length;
  const ex = p._n.some((x) => q.includes(x));
  let sh = ex;
  const m = ws.map((w, i) => { let b = 0; p._g.forEach((g, gi) => { for (const [k, st] of g) { const z = zhoda(w, k); if (z > 0.89) { hit.add(gi); sh |= st; } if (z === 1) { h1.add(gi); if (!kb._bez.has(k)) kr.add(i); } if (z) b = Math.max(b, st && z === 1 ? 2 : z); } }); return b; });
  let s = m.reduce((a, b) => a + b, 0);
  if (hit.size && p._c) ws.forEach((w, i) => { if (m[i] < 1 && cen(kb, w)) s += 1 - m[i]; });
  s += ex ? 0.5 : 0;
  if (n > 1) s *= p.odpoved || hit.size === n ? (1 + hit.size) / (1 + n) : 0;
  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, sh, ex || hit.size === n];
}
const veto = (ws, p) => p._g.some((g) => g.some(([k, st]) => st && ws.some((w) => ista(w, k)))) && p._g.every((g) => g.some(([k]) => ws.some((w) => ista(w, k))));
function priprav(kb) {
  if (kb._ok) return;
  [kb._stop, kb._cen, kb._vyp, kb._zdv, kb._sp] = [kb.stop, kb.cenove, kb.vypln, kb.zdvor, kb.spoj].map((s) => (s || '').split(' '));
  const n = {};
  (kb._a = [...kb.polozky, ...kb.nevieme]).forEach((p) => {
    p._v = p.otazky.map(norm); p._n = (p.odpoved || []).filter(Array.isArray).map((x) => norm(x[0]));
    p._g = p.kluc.split('|').map((g) => g.trim().split(/\s+/).filter(Boolean).map((t) => [t.replace('!', '').toLowerCase(), +(t.endsWith('!') || /[A-Z]/.test(t))])).filter((g) => g.length);
    new Set(p._g.flat().map(([x]) => x)).forEach((x) => { n[x] = (n[x] || 0) + (p.odpoved ? 1 : 0.01); });
    p._c = !!p.cena || JSON.stringify(p.odpoved || '').includes('€');
    p._s = /sluzby|booqme/.test(p.akcie);
  });
  kb._k = Object.keys(n); kb._d = kb._k.filter(dlhy); kb._bez = new Set(kb._k.filter((x) => n[x] > 2.5)); kb._ok = 1;
}
const R = (typ, x, o) => ({ typ, id: x[2].id, p: x[2], skore: x[0], ...o });
const F = (s) => ({ typ: 'fallback', skore: s });
const vyber = (a) => ({ typ: 'vyber', id: a[0][2].id, p: a.map((x) => x[2]), skore: a[0][0] });
const trvP = (p) => ({ ...p, otazky: [p.odpoved.find(Array.isArray)[0]], odpoved: p.odpoved.filter(Array.isArray).map((y, i) => [y[0], p.cas[i]]) });
function rozhodni(ws, q, kb, pol, sp, vol) {
  const top = (l) => l.map((p) => skore(ws, q, p, kb)).sort((a, b) => b[0] - a[0]);
  const c = kb.nevieme.find((x) => x.pravidlo === 'cena'), n = top(kb.nevieme), p = top(pol).filter((x) => x[0]), v = n.find((x) => veto(ws, x[2]));
  if (v) return R('nevieme', v);
  if (n[0] && n[0][0] >= 0.55 && n[0][0] >= (p[0] ? p[0][0] : 0) - 0.1) return R('nevieme', n[0]);
  const Q = ` ${q} `, nv = ws.filter((w) => !vol(w)), zn = zo(kb._k);
  const sv = ([, , X]) => (nv.length ? nv.reduce((a, w) => a + Math.max(...X._g.flat().map(([k, s], z) => ((z = zhoda(w, k)) && z < 0.9 && zn(w) ? 0 : z * (z > 0.5 ? s + 1 : 1)))), 0) / nv.length : 1);
  const plna = (x) => {
    const [, , X, sh, vs] = x, xs = X._n.filter((m) => Q.includes(` ${m} `)).join(' '), t = X._c || X._s, ok = (w) => xs.split(' ').includes(w) || vysvetli(kb, X, w);
    return vs && (sh || !t) && (sp || X.pravidlo !== 'spolu') && ws.some(ok) && sv(x) >= 0.55 && nv.every((w) => ok(w) || !(t || zn(w))) && !pol.some((Y) => Y !== X && Y._n.some((m) => Q.includes(` ${m} `) && !xs.includes(m))) && !(sp && X.ine?.split(' ').some((m) => Q.includes(` ${m} `)));
  };
  const a = p.filter(plna), b = a.filter((x) => x[1] === Math.max(...a.map((y) => y[1])));
  if (b[0]) return b[1] && b[0][0] - b[1][0] < 0.1 ? vyber(b.slice(0, 2)) : R('odpoved', b[0]);
  const ce = ws.some((w) => cen(kb, w)), k = p.map((x) => [sv(x), x]).filter((x) => nv.length && (x[0] >= 0.55 || ((ce || x[1][3]) && x[0] * nv.length >= 2))).sort((A, B) => B[0] - A[0] || B[1][4] - A[1][4] || B[1][0] - A[1][0]);
  if (k[0]) return vyber(k.slice(0, 4).map((x) => x[1]));
  return c && ce ? R('nevieme', [0, 0, c]) : F(0);
}
export function odpovedz(otazka, kb) {
  priprav(kb);
  const q = norm(String(otazka).slice(0, 200).replace(/\d+:\d\d|\d+ ?[ap]\.?m\b/gi, ' 0h ').replace(/(^|\D)\d\s?(cm|см)/gi, '$1')), st = (w) => kb._stop.includes(w),
    u = [...new Set(q.split(' '))], w0 = u.flatMap((w) => {
      const j = Math.max(0, ...kb._d.filter((k) => w.startsWith(k)).map((k) => k.length)), i = j && w.length - j > 7 ? j : Math.min(...kb._d.map((k) => w.indexOf(k)).filter((i) => i > 2)), p = [w.slice(0, i), w.slice(i)], r = p[0].replace(/^ne/, '');
      return i < 1e3 && r.length > 2 && !st(r) && !kb._k.some((k) => k.length > i && pred(w, k)) && !kb._a.some((P) => p.every((x) => P._n.join().includes(x) || P._g.flat().some(([k]) => ista(x, k) || (k.length > 3 && x.includes(k))))) ? p : [w];
    }).filter((w) => w.length > 1 && !st(w) && u.length < 31), zdv = zo(kb._zdv, pred), gr = (w) => zdv(u[u.indexOf(w) - 1] || ''), vyp = zo(kb._vyp, pred), zn = zo(kb._k), ce = (w) => cen(kb, w), sp = /[+&]/.test(otazka) || q.split(' ').some((w) => kb._sp.includes(w));
  if (w0.some(zdv) && w0.every((w) => zdv(w) || (vyp(w) && !zn(w)))) return { ...F(0), typ: 'zdvorilost' };
  const T = kb.polozky.find((p) => p.pravidlo === 'cas'), pol = kb.polozky.filter((p) => p !== T), e = [...pol, ...kb.nevieme].find((p) => p._v.includes(q));
  if (e) return R(e.odpoved ? 'odpoved' : 'nevieme', [9, 0, e]);
  const ws = w0.filter((w) => (zn(w) && !(zdv(w) && gr(w))) || ce(w) || !(vyp(w) || zdv(w)));
  if (!ws.length || ws.length > 12) return F(0);
  const G = T._g[0], Q = ` ${q} `, tw = (w) => G.some(([k]) => ista(w, k)), vol = (w) => ce(w) || vyp(w) || ((w.length < 3 || /^\d+$/.test(w)) && !zn(w));
  if (!G.some(([k, s]) => s && (Q.includes(` ${k.replace('_', ' ')} `) || ws.some((w) => pred(w, k))))) {
    const r = rozhodni(ws, q, kb, pol, sp, vol);
    if (r.typ === 'odpoved' || r.typ === 'nevieme' || !ws.some(tw)) return r;
  }
  const wt = ws.filter((w) => !tw(w) && !(ce(w) && !zn(w)));
  if (wt.every((w) => vol(w) && !zn(w))) return R('odpoved', [1, 0, T]);
  const r = rozhodni(wt, q, kb, pol, sp, vol), l = [].concat(r.p);
  if (r.typ === 'nevieme' || r.typ === 'fallback') return r;
  if (r.typ === 'odpoved' && r.p.cas) return R('odpoved', [r.skore, 0, trvP(r.p)], { id: T.id, sluzba: r.p.id });
  return { ...vyber(l.map((x) => [r.skore, 0, x])), ...(l.every((x) => x.cas) ? { id: T.id, cas: 1 } : { o: 1 }) };
}
const cenovy = (f) => Array.isArray(f) && /€$/.test(f[1]);
export function vyrez(p, kb) {
  const h = p.odpoved.filter(cenovy).map((f) => f[0]);
  for (const [n, ...ids] of h.length ? kb.cennik : []) {
    const r = ids.flatMap((s) => { const [id, i] = s.split(':'), P = kb.polozky.find((x) => x.id === id); return P.odpoved.filter(Array.isArray).map((f, j) => [f[0], P.cas[j], f[1], h.includes(f[0])]).filter((x, j) => !i || j == i); });
    if (r.some((y) => y[3])) return [n, r.filter((y, i) => y[3] || r[i - 1]?.[3] || r[i + 1]?.[3])];
  }
}

let dlg, kb, lang = '', btn, log, chips, inp, ov;
const d = globalThis.document;
const jazyk = () => (d.documentElement.lang || 'sk').slice(0, 2).toLowerCase();
const el = (tag, cls, text) => { const e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const nacitaj = (c) => fetch(new URL(`recepcia/${/^(en|uk|hu|sr|pl|de|cs)$/.test(c) ? c : 'sk'}.json`, import.meta.url)).then((r) => r.json()).catch(() => (c === 'sk' ? null : nacitaj('sk')));
function odkaz(a, k) {
  const h = kb.kontakt[k];
  a.href = h;
  if (h[0] === '#') a.onclick = () => dlg.close(); else if (h[0] === 'h') { a.target = '_blank'; a.rel = 'noopener'; }
  return a;
}
const tlac = (cls, text, f) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = f; return b; };
const akcie = (z) => { const box = el('div', 'rc-akcie'); (z || []).forEach((k) => kb.kontakt[k] && box.append(odkaz(el('a', 'rc-btn', kb.panel.akcie[k]), k))); return box; };
const pridaj = (li) => { li.lang = lang; log.append(li); log.scrollTop = log.scrollHeight; };
const veta = (t, cls) => el('p', cls, t);
function tabulka([n, r]) {
  const b = el('div', 'rc-cen');
  b.append(el('p', 'rc-sk', n));
  r.forEach(([a, t, c, h]) => { const p = el('p', h && 'rc-hl'); if (h) p.setAttribute('aria-current', 'true'); p.append(el('span', '', a), el('small', '', t), el('b', '', c)); b.append(p); });
  return b;
}
function odpoved(p) {
  const li = el('li', 'rc-a'), v = vyrez(p, kb);
  p.odpoved.forEach((f) => (v && cenovy(f) ? li.querySelector('.rc-cen') || li.append(tabulka(v)) : li.append(veta([].concat(f).join(' ')))));
  if (p.zoznam) { const ul = el('ul', 'rc-zoznam'); p.zoznam.forEach((z) => ul.append(el('li', null, z))); li.append(ul); }
  li.append(el('small', 'rc-zdroj', kb.panel.zdroj));
  const L = lang !== 'sk' && p.akcie?.includes('rezervacia') && window.B30_LANG?.langs.find((l) => l.code === lang);
  if (L && L.rez) li.append(veta(L.rez, 'rc-pozn'));
  li.append(akcie(p.akcie));
  return li;
}
const polozka = (p) => { pridaj(el('li', 'rc-q', p.otazky[0])); pridaj(odpoved(p)); };
function spytaj(q) {
  q = q.replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!q || !kb) return;
  pridaj(el('li', 'rc-q', q));
  const r = odpovedz(q, kb), li = el('li', 'rc-a'), o = r.p && r.p.odovzdanie;
  if (r.typ === 'odpoved') return pridaj(odpoved(r.p));
  const box = el('div', 'rc-akcie');
  if (r.typ === 'vyber') { r.p.forEach((p) => { const t = r.cas ? trvP(p) : p; box.append(tlac('rc-btn', t.otazky[0], () => polozka(t))); }); li.append(veta(r.o ? kb.fallback : kb.panel.mysli), box, akcie(r.o ? ['tel', 'email', 'rezervacia'] : ['sluzby', 'tel'])); }
  else if (r.typ === 'zdvorilost') { box.append(...volby()); li.append(veta(kb.panel.uvod), box); }
  else if (o) li.append(veta(`${o.endsWith('.') ? o : `${kb.panel.nepotvrdene} ${o}.`} ${kb.odovzdanie}`), akcie(r.p.akcie));
  else li.append(veta(kb.fallback), akcie(['tel', 'email', 'rezervacia']));
  pridaj(li);
}
const volby = () => Object.entries(kb.panel.volby).map(([k, t]) => {
  const p = !kb.kontakt[k] && kb.polozky.find((x) => x.id === k);
  return p ? tlac('rc-chip', t, () => polozka(p)) : odkaz(el('a', 'rc-chip', t), k);
});
function texty() {
  const P = kb.panel;
  dlg.lang = lang;
  dlg.querySelectorAll('[data-t]').forEach((e) => { e.textContent = P[e.dataset.t]; });
  dlg.querySelector('.rc-x').setAttribute('aria-label', P.zavriet); inp.placeholder = P.vstup;
  chips.replaceChildren(...volby());
}
function zamkni(z) {
  const s = d.body.style;
  if (z) ov = s.overflow;
  d.documentElement.style.scrollbarGutter = z && innerWidth > d.documentElement.clientWidth ? 'stable' : '';
  s.overflow = z ? 'hidden' : ov;
}
async function prepni(code) {
  if (code === lang && kb) return;
  const data = await nacitaj(code);
  if (data) { kb = data; lang = data.jazyk; if (dlg) texty(); }
}
const KOSTRA = '<div class=rc-in><div class=rc-head><h2 id=rc-h data-t=nadpis></h2><button class=rc-x type=button>×</button></div><div class=rc-chips></div>'
  + '<ol class=rc-log role=log aria-live=polite><li class=rc-a data-t=uvod></li></ol><form class=rc-form><label class=visually-hidden for=rc-q data-t=vstup></label>'
  + '<input id=rc-q maxlength=200 enterkeyhint=send autocomplete=off><button class="rc-btn rc-send" data-t=odoslat></button></form><p class=rc-sukromie data-t=sukromie></p></div>';
function postav() {
  const link = el('link'); link.rel = 'stylesheet'; link.href = new URL('recepcia.css', import.meta.url); d.head.append(link);
  dlg = el('dialog'); dlg.id = 'rc-panel'; dlg.setAttribute('data-no-i18n', ''); dlg.setAttribute('aria-labelledby', 'rc-h'); dlg.innerHTML = KOSTRA;
  [chips, log, inp] = ['.rc-chips', '.rc-log', '#rc-q'].map((s) => dlg.querySelector(s));
  dlg.querySelector('.rc-x').onclick = () => dlg.close();
  dlg.querySelector('form').onsubmit = (e) => { e.preventDefault(); spytaj(inp.value); inp.value = ''; };
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  dlg.onclose = () => { zamkni(0); btn.setAttribute('aria-expanded', 'false'); btn.focus({ preventScroll: true }); };
  d.body.append(dlg);
  btn.setAttribute('aria-controls', dlg.id);
  d.addEventListener('langchange', () => prepni(jazyk()));
}
export async function spusti(tlacidlo) {
  btn = tlacidlo;
  if (!dlg) postav();
  await prepni(jazyk());
  if (!kb || dlg.open) return;
  texty();
  zamkni(1);
  dlg.showModal();
  btn.setAttribute('aria-expanded', 'true');
  chips.scrollLeft = 0;
  chips.firstChild.focus({ preventScroll: true });
}
