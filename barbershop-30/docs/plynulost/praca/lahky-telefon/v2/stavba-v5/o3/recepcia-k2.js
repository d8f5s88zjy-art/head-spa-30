/* Recepcia: nič sa neposiela ani neukladá; test recepcia-test.mjs */
export const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const slova = (q, stop) => q.split(' ').filter((w) => w.length > 1 && !stop.includes(w));
function dl(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) ? 1 : 2;
}
const bigramy = (s) => { const r = []; for (let i = 1; i < s.length; i++) r.push(s[i - 1] + s[i]); return r; };
function dice(a, b) {
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigramy(a), B = bigramy(b); let n = 0;
  for (const x of A) { const i = B.indexOf(x); if (i >= 0) { n++; B.splice(i, 1); } }
  return (2 * n) / (A.length + B.length + n);
}
/* 1 istá, 0,9 vnútri, 0,6 neistá, 0,5 podobná (p. 1) */
export function zhoda(w, k) {
  if (k[0] === '=') return +(w === k.slice(1));
  const e = w.length - k.length;
  if (k.length < 5) return e < 0 || e > 3 || !w.startsWith(k) ? 0 : e < (k.length > 3 ? 4 : 2) ? 1 : 0.6;
  return w.startsWith(k) ? 1 : w.includes(k) ? 0.9 : (w.length > 3 && k.startsWith(w)) || (e >= 0 && w[0] === k[0] && [-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k) < 2)) ? 0.6 : dice(w, k) >= 0.6 ? 0.5 : 0;
}
function skore(ws, q, p, cen) {
  const hit = new Set();
  const m = ws.map((w) => { let b = 0; p._g.forEach((g, gi) => { for (const [k, st] of g) { const z = zhoda(w, k); if (z > 0.89) hit.add(gi); if (z) b = Math.max(b, st && z === 1 ? 2 : z); } }); return b; });
  let s = m.reduce((a, b) => a + b, 0);
  if (hit.size && p._c) ws.forEach((w, i) => { if (m[i] < 1 && cen.some((c) => w.startsWith(c))) s += 1 - m[i]; });
  if (p._v.includes(q)) s += 2; else if (p._v.some((v) => v.includes(' ') && q.includes(v))) s += 0.5;
  if (p._g.length > 1) s *= (1 + hit.size) / (1 + p._g.length);
  return s / ws.length;
}
const silny = (p, f) => p._g.some((g) => g.some(([k, st]) => st && f(k)));
const veto = (ws, p) => silny(p, (k) => ws.some((w) => zhoda(w, k) === 1));
function priprav(kb) {
  if (kb._ok) return;
  kb._stop = kb.stop.split(' '); kb._cen = kb.cenove.split(' ');
  [...kb.polozky, ...kb.nevieme].forEach((p) => {
    p._v = p.otazky.map(norm);
    p._g = p.kluc.split('|').map((g) => g.trim().split(/\s+/).filter(Boolean).map((t) => [t.replace('!', '').toLowerCase(), +(t.endsWith('!') || /[A-Z]/.test(t))])).filter((g) => g.length);
    p._c = !!p.cena || JSON.stringify(p.odpoved || '').includes('€');
  });
  kb._ok = true;
}
export function odpovedz(otazka, kb) {
  priprav(kb);
  const q = norm(String(otazka).slice(0, 200)), ws = slova(q, kb._stop), t = kb.prah;
  const R = (typ, x) => ({ typ, id: x[1].id, p: x[1], skore: x[0] });
  if (!ws.length) return { typ: 'fallback', id: null, skore: 0 };
  const top = (list) => list.map((p) => [skore(ws, q, p, kb._cen), p]).sort((a, b) => b[0] - a[0]);
  const c = kb.nevieme.find((x) => x.pravidlo === 'cena'), n = top(kb.nevieme), p = top(kb.polozky), v = n.find((x) => veto(ws, x[1]));
  const vyber = (a) => ({ typ: 'vyber', id: a[0][1].id, p: a.map((x) => x[1]), skore: a[0][0] });
  if (v) return R('nevieme', v);
  if (n[0] && n[0][0] >= t.nevieme && n[0][0] >= (p[0] ? p[0][0] : 0) - t.blizko) return R('nevieme', n[0]);
  if (p[0] && p[0][0] >= t.odpoved) return p[1] && p[0][0] - p[1][0] < t.blizko ? vyber(p.slice(0, 2)) : R('odpoved', p[0]);
  if (c && ws.some((w) => kb._cen.some((k) => w.startsWith(k)))) {
    const tip = p.filter((x) => silny(x[1], (k) => k.length > 4 && ws.some((w) => zhoda(w, k) >= 0.6))).slice(0, 2);
    return tip.length ? vyber(tip) : R('nevieme', [0, c]);
  }
  return { typ: 'fallback', id: null, skore: p[0] ? p[0][0] : 0 };
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
  if (r.typ === 'vyber') { const box = el('div', 'rc-akcie'); r.p.forEach((p) => box.append(tlac('rc-btn', p.otazky[0], () => polozka(p)))); li.append(veta(kb.panel.mysli), box); }
  else if (o) li.append(veta(`${o.endsWith('.') ? o : `${kb.panel.nepotvrdene} ${o}.`} ${kb.odovzdanie}`), akcie(r.p.akcie));
  else li.append(veta(kb.fallback), akcie(['tel', 'email', 'rezervacia']));
  pridaj(li);
}
function texty() {
  const P = kb.panel;
  dlg.lang = lang;
  dlg.querySelectorAll('[data-t]').forEach((e) => { e.textContent = P[e.dataset.t]; });
  dlg.querySelector('.rc-x').setAttribute('aria-label', P.zavriet); inp.placeholder = P.vstup;
  chips.replaceChildren(...Object.entries(P.volby).map(([k, t]) => {
    const p = !kb.kontakt[k] && kb.polozky.find((x) => x.id === k);
    return p ? tlac('rc-chip', t, () => polozka(p)) : odkaz(el('a', 'rc-chip', t), k);
  }));
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
