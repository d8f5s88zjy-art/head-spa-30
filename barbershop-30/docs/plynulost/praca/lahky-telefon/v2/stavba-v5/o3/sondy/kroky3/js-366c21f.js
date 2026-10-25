/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody 1–6 overuje source/tools/recepcia-test.mjs */
export const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function dl(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) ? 1 : 2;
}
function dice(a, b) {
  const g = (s) => [...s].slice(1).map((c, i) => s[i] + c), A = g(a), B = g(b), l = A.length + B.length;
  let n = 0;
  for (const x of A) { const i = B.indexOf(x); if (i >= 0) { n++; B.splice(i, 1); } }
  return a.length < 2 || b.length < 2 ? 0 : (2 * n) / l;
}
/* 1 istá, 0,9 vnútri, 0,6 neistá, 0,5 podobná (p. 1) */
export function zhoda(w, k) {
  if (k[0] === '=') return +(w === k.slice(1));
  const e = w.length - k.length;
  if (k.length < 5) return e < 0 || e > 3 || !w.startsWith(k) ? 0 : e < (k.length > 3 ? 4 : 2) ? 1 : 0.6;
  return w.startsWith(k) ? 1 : w.includes(k) ? 0.9 : (w.length > 3 && k.startsWith(w)) || (e >= 0 && w[0] === k[0] && [-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k) < 2)) ? 0.6 : dice(w, k) >= 0.6 ? 0.5 : 0;
}
const ista = (w, k) => zhoda(w, k) > 0.89, zo = (l, f = ista) => (w) => l.some((k) => f(w, k)), pred = (w, k) => zhoda(w, k) === 1;
/* [skóre, špecifickosť (p. 3), položka] */
function skore(ws, q, p, kb) {
  const hit = new Set(), h1 = new Set(), kr = new Set(), n = p._g.length;
  const m = ws.map((w, i) => { let b = 0; p._g.forEach((g, gi) => { for (const [k, st] of g) { const z = zhoda(w, k); if (z > 0.89) hit.add(gi); if (z === 1) { h1.add(gi); if (!kb._bez.has(k)) kr.add(i); } if (z) b = Math.max(b, st && z === 1 ? 2 : z); } }); return b; });
  let s = m.reduce((a, b) => a + b, 0);
  if (hit.size && p._c) ws.forEach((w, i) => { if (m[i] < 1 && kb._cen.some((c) => w.startsWith(c))) s += 1 - m[i]; });
  s += p._v.includes(q) ? 2 : p._v.some((v) => v.includes(' ') && q.includes(v)) ? 0.5 : 0;
  if (n > 1) s *= (1 + hit.size) / (1 + n);
  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p];
}
const silny = (p, f) => p._g.some((g) => g.some(([k, st]) => st && f(k)));
/* p. 4 */
const veto = (ws, p) => silny(p, (k) => ws.some((w) => ista(w, k))) && p._g.every((g) => g.some(([k]) => ws.some((w) => ista(w, k))));
function priprav(kb) {
  if (kb._ok) return;
  [kb._stop, kb._cen, kb._vyp, kb._zdv] = [kb.stop, kb.cenove, kb.vypln, kb.zdvor].map((s) => (s || '').split(' '));
  const n = {};
  [...kb.polozky, ...kb.nevieme].forEach((p) => {
    p._v = p.otazky.map(norm);
    p._g = p.kluc.split('|').map((g) => g.trim().split(/\s+/).filter(Boolean).map((t) => [t.replace('!', '').toLowerCase(), +(t.endsWith('!') || /[A-Z]/.test(t))])).filter((g) => g.length);
    new Set(p._g.flat().map(([x]) => x)).forEach((x) => { n[x] = (n[x] || 0) + (p.odpoved ? 1 : 0.01); });
    p._c = !!p.cena || JSON.stringify(p.odpoved || '').includes('€');
    p._s = /sluzby|booqme/.test(p.akcie);
  });
  kb._k = Object.keys(n); kb._bez = new Set(kb._k.filter((x) => n[x] > 2.5)); kb._ok = 1;
}
const R = (typ, x, o) => ({ typ, id: x[2].id, p: x[2], skore: x[0], ...o });
const F = (s) => ({ typ: 'fallback', id: null, skore: s });
const vyber = (a) => ({ typ: 'vyber', id: a[0][2].id, p: a.map((x) => x[2]), skore: a[0][0] });
function rozhodni(ws, q, kb, pol) {
  const t = kb.prah, top = (l) => l.map((p) => skore(ws, q, p, kb)).sort((a, b) => b[0] - a[0]);
  const c = kb.nevieme.find((x) => x.pravidlo === 'cena'), n = top(kb.nevieme), p = top(pol), v = n.find((x) => veto(ws, x[2]));
  if (v) return R('nevieme', v);
  if (n[0] && n[0][0] >= t.nevieme && n[0][0] >= (p[0] ? p[0][0] : 0) - t.blizko) return R('nevieme', n[0]);
  const a = p.filter((x) => x[0] >= t.odpoved), b = a.filter((x) => x[1] === Math.max(...a.map((y) => y[1])));
  if (b[0]) return b[1] && b[0][0] - b[1][0] < t.blizko ? vyber(b.slice(0, 2)) : R('odpoved', b[0]);
  if (c && ws.some((w) => kb._cen.some((k) => w.startsWith(k)))) {
    const tip = p.filter((x) => silny(x[2], (k) => k.length > 4 && ws.some((w) => zhoda(w, k) >= 0.6))).slice(0, 2);
    return tip.length ? vyber(tip) : R('nevieme', [0, 0, c]);
  }
  return F(p[0] ? p[0][0] : 0);
}
export function odpovedz(otazka, kb) {
  priprav(kb);
  const q = norm(String(otazka).slice(0, 200)), w0 = q.split(' ').filter((w) => w.length > 1 && !kb._stop.includes(w)), zdv = zo(kb._zdv, pred), vyp = zo(kb._vyp, pred), zn = zo(kb._k), cen = (w) => kb._cen.some((c) => w.startsWith(c));
  /* p. 5 */
  if (w0.some(zdv) && w0.every((w) => zdv(w) || vyp(w))) return { typ: 'zdvorilost', id: null, skore: 0 };
  const ws = w0.filter((w) => zn(w) || cen(w) || !(vyp(w) || zdv(w)));
  if (!ws.length) return F(0);
  /* p. 2 */
  const nez = ws.filter((w) => w.length > 3 && !/^\d+$/.test(w) && !cen(w) && !zn(w));
  /* p. 6 */
  const T = kb.polozky.find((p) => p.pravidlo === 'cas'), tr = T && T._g[0].some(([k, st]) => st && ws.some((w) => zhoda(w, k) === 1));
  if (!tr) {
    const r = rozhodni(ws, q, kb, kb.polozky);
    return r.typ === 'odpoved' && r.p._s && nez.length && !r.p._v.includes(q) ? (ws.some(zn) ? vyber([[r.skore, 0, r.p]]) : F(r.skore)) : r;
  }
  const wt = ws.filter((w) => !cen(w) && !zo(T._g[0].map(([k]) => k))(w)), r = wt.length ? rozhodni(wt, q, kb, kb.polozky.filter((p) => p !== T)) : R('odpoved', [1, 0, T]);
  if (r.typ === 'nevieme' || r.p === T) return r;
  const p = r.typ === 'odpoved' && r.p.cas && r.p, a = p && p.odpoved.filter(Array.isArray);
  if (nez.length || [].concat(r.p || []).some((x) => x._s && !x.cas)) return F(r.skore);
  return p ? R('odpoved', [r.skore, 0, { ...p, zoznam: 0, odpoved: a.map((y, i) => [y[0], p.cas[i]]) }], { id: T.id, sluzba: p.id }) : r.typ === 'vyber' ? F(r.skore) : R('odpoved', [r.skore, 0, T]);
}

let dlg, kb, lang = '', btn, log, chips, inp;
const d = typeof document === 'undefined' ? null : document;
const jazyk = () => (d.documentElement.lang || 'sk').slice(0, 2).toLowerCase();
const el = (tag, cls, text) => { const e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const nacitaj = (c) => fetch(new URL(`recepcia/${/^(en|uk|hu|sr|pl|de|cs)$/.test(c) ? c : 'sk'}.json`, import.meta.url)).then((r) => r.json()).catch(() => (c === 'sk' ? null : nacitaj('sk')));
function odkaz(a, k) {
  const h = kb.kontakt[k];
  a.href = k === 'tel' ? 'tel:' + h : k === 'email' ? 'mailto:' + h : h;
  if (h[0] === '#') a.onclick = () => dlg.close(); else if (h[0] === 'h') { a.target = '_blank'; a.rel = 'noopener'; }
  return a;
}
const tlac = (cls, text, f) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = f; return b; };
const akcie = (z) => { const box = el('div', 'rc-akcie'); (z || []).forEach((k) => kb.kontakt[k] && box.append(odkaz(el('a', 'rc-btn', kb.panel.akcie[k]), k))); return box; };
const pridaj = (li) => { li.lang = lang; log.append(li); log.scrollTop = log.scrollHeight; };
const veta = (t, cls) => el('p', cls, t);
function odpoved(p) {
  const li = el('li', 'rc-a');
  p.odpoved.forEach((f) => li.append(veta([].concat(f).join(' '))));
  if (p.zoznam) { const ul = el('ul', 'rc-zoznam'); p.zoznam.forEach((z) => ul.append(el('li', null, z))); li.append(ul); }
  li.append(el('small', 'rc-zdroj', kb.panel.zdroj));
  const L = lang !== 'sk' && (p.akcie || []).includes('rezervacia') && window.B30_LANG && window.B30_LANG.langs.find((l) => l.code === lang);
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
  if (r.typ === 'vyber') { r.p.forEach((p) => box.append(tlac('rc-btn', p.otazky[0], () => polozka(p)))); li.append(veta(kb.panel.mysli), box, akcie(['sluzby', 'tel', 'email'])); }
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
async function prepni(code) {
  if (code === lang && kb) return;
  const data = await nacitaj(code);
  if (data) { kb = data; lang = data.jazyk; if (dlg) texty(); }
}
/* kostra bez textu návštevníka */
const KOSTRA = '<div class="rc-in"><div class="rc-head"><h2 id="rc-h" data-t="nadpis"></h2><button class="rc-x" type="button">×</button></div><div class="rc-chips"></div>'
  + '<ol class="rc-log" role="log" aria-live="polite"><li class="rc-a" data-t="uvod"></li></ol><form class="rc-form"><label class="visually-hidden" for="rc-q" data-t="vstup"></label>'
  + '<input id="rc-q" maxlength="200" enterkeyhint="send" autocomplete="off"><button class="rc-btn rc-send" data-t="odoslat"></button></form><p class="rc-sukromie" data-t="sukromie"></p></div>';
function postav() {
  const link = el('link'); link.rel = 'stylesheet'; link.href = new URL('recepcia.css', import.meta.url); d.head.append(link);
  dlg = el('dialog'); dlg.id = 'rc-panel'; dlg.setAttribute('data-no-i18n', ''); dlg.setAttribute('aria-labelledby', 'rc-h'); dlg.innerHTML = KOSTRA;
  [chips, log, inp] = ['.rc-chips', '.rc-log', '#rc-q'].map((s) => dlg.querySelector(s));
  dlg.querySelector('.rc-x').onclick = () => dlg.close();
  dlg.querySelector('form').onsubmit = (e) => { e.preventDefault(); spytaj(inp.value); inp.value = ''; };
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  dlg.onclose = () => { btn.setAttribute('aria-expanded', 'false'); btn.focus({ preventScroll: true }); };
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
  dlg.showModal();
  btn.setAttribute('aria-expanded', 'true');
  chips.firstChild.focus({ preventScroll: true });
}
