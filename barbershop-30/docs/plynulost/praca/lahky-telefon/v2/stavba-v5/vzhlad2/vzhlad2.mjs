// Kontrola vzhľadu recepcie, kolo 2: telefón 390×844 @3 (dotyk) a počítač 1440×900.
// node vzhlad2.mjs <url> <priečinok snímok> <tag> <telefon|pocitac>
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out, tag, len] = process.argv.slice(2);
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const b = await chromium.launch({ headless: true, args: ARGS });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const V = { tag, url, len, snimkyChyby: [] };
const shot = async (p, path, o = {}) => {
  for (let i = 0; i < 4; i++) {
    try { await p.screenshot({ path, timeout: 20000, ...o, ...(i === 3 ? { scale: 'css' } : {}) }); if (i) V.snimkyChyby.push(path.split('/').pop() + ' pokus ' + (i + 1)); return; }
    catch (e) { V.snimkyChyby.push(path.split('/').pop() + ': ' + e.message.split('\n')[0]); await sleep(1200); }
  }
};
const mobil = len === 'telefon';
const vp = mobil ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const dpr = mobil ? 3 : 1;
const CLS_INIT = () => {
  window.__cls = 0; window.__shifts = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4) }); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) { /* */ }
};
const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', colorScheme: 'dark', reducedMotion: 'no-preference' });
await ctx.addInitScript(CLS_INIT);
const p = await ctx.newPage();
V.chyby = []; V.ziadosti = [];
p.on('console', (m) => { if (m.type() === 'error' && !/WebGL|GPU/i.test(m.text())) V.chyby.push(m.text()); });
p.on('pageerror', (e) => V.chyby.push(String(e)));
p.on('request', (r) => { const u = r.url(); if (/recepcia/.test(u) || !u.startsWith('http://127.0.0.1')) V.ziadosti.push(u.replace(/^http:\/\/127\.0\.0\.1:\d+\/(assets\/)?/, '')); });
await p.goto(url, { waitUntil: 'load' });
const tl = Date.now();
const ma = await p.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).then(() => true, () => false);
V.tlacidloPoLoadMs = ma ? Date.now() - tl : null;
await sleep(3500);
await p.evaluate(() => scrollTo(0, 0)); await sleep(400);
V.clsPokoj = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts }));
await shot(p, `${out}/${tag}-${len}-pokoj.png`);
await p.evaluate(() => { const s = document.querySelector('#sluzby'); scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.6); });
await sleep(1200);
await shot(p, `${out}/${tag}-${len}-tlacidlo.png`);
if (!ma) { await b.close(); console.log(JSON.stringify(V, null, 1)); process.exit(0); }

const R = `const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };`;
const ev = (fn, arg) => p.evaluate(`(() => { ${R} return (${fn})(${JSON.stringify(arg ?? null)}); })()`);
const dokonci = () => p.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) { /* */ } }));
V.btn = await ev(() => { const e = document.querySelector('.recepcia-btn'), s = getComputedStyle(e); return { ...R(e), z: s.zIndex, anim: s.animationName, label: e.getAttribute('aria-label') }; });

// otvorenie
const stav = () => ev(() => { const l = document.querySelector('.site-header a'); return { iw: innerWidth, cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, sy: Math.round(scrollY), lx: l && Math.round(l.getBoundingClientRect().x * 100) / 100, bodyOv: document.body.style.overflow, gutter: document.documentElement.style.scrollbarGutter }; });
V.predOtvorenim = await stav();
const otvor = async () => { if (mobil) await p.tap('.recepcia-btn'); else await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(350); await dokonci(); await sleep(100); };
await otvor();
V.poOtvoreni = await stav();
V.panel = await ev(() => { const d = document.querySelector('#rc-panel'), a = document.activeElement, btn = document.querySelector('.recepcia-btn'); return { panel: R(d), btn: R(btn), log: R(d.querySelector('.rc-log')), form: R(d.querySelector('.rc-form')), chipsBox: R(d.querySelector('.rc-chips')), fokus: a && (a.className + ' ' + a.textContent.trim().slice(0, 30)), fokusVis: a && a.matches(':focus-visible'), ob: [getComputedStyle(d).overscrollBehaviorY, getComputedStyle(d.querySelector('.rc-log')).overscrollBehaviorY], chips: [...d.querySelectorAll('.rc-chip')].map((c) => ({ t: c.textContent, ...R(c) })), lang: d.lang, noI18n: d.hasAttribute('data-no-i18n') }; });
V.clsPoOtvoreni = await p.evaluate(() => +window.__cls.toFixed(4));
await shot(p, `${out}/${tag}-${len}-panel.png`);

const posledna = () => ev(() => {
  const d = document.querySelector('#rc-panel'), log = d.querySelector('.rc-log'), li = log.querySelector(':scope > li:last-child'), lr = log.getBoundingClientRect(), fr = d.querySelector('.rc-form').getBoundingClientRect();
  const cen = li.querySelector('.rc-cen');
  const o = { text: li.innerText, lang: li.lang, li: R(li), log: R(log), logScroll: { top: Math.round(log.scrollTop), max: log.scrollHeight - log.clientHeight, sw: log.scrollWidth, cw: log.clientWidth }, formTop: Math.round(fr.top), liCeleViditelne: li.getBoundingClientRect().top >= lr.top - 1 && li.getBoundingClientRect().bottom <= lr.bottom + 1, logNadFormularom: lr.bottom <= fr.top + 0.5, sw: document.documentElement.scrollWidth, iw: innerWidth, sy: Math.round(scrollY) };
  o.odkazy = [...li.querySelectorAll('a, button')].map((a) => ({ t: a.textContent.trim(), href: a.getAttribute('href'), tag: a.tagName, ...R(a) }));
  if (cen) {
    const cr = cen.getBoundingClientRect();
    o.cen = { box: R(cen), viditelny: cr.top >= lr.top - 1 && cr.bottom <= lr.bottom + 1, nadpis: cen.querySelector('.rc-sk')?.textContent, riadky: [...cen.querySelectorAll('p:not(.rc-sk)')].map((r) => { const s = getComputedStyle(r); const parts = [...r.children].map((c) => ({ t: c.textContent, ...R(c), ov: c.scrollWidth > c.clientWidth + 1 })); return { hl: r.classList.contains('rc-hl'), aria: r.getAttribute('aria-current'), fs: s.fontSize, color: s.color, border: s.borderLeftColor, ...R(r), pretek: r.scrollWidth > r.clientWidth + 1, parts }; }) };
  }
  return o;
});
const opytaj = async (q, nazov) => {
  if (mobil) await p.tap('#rc-q'); else await p.click('#rc-q');
  await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); await sleep(400);
  const t = await posledna();
  if (nazov) await shot(p, `${out}/${tag}-${len}-${nazov}.png`);
  return t;
};
V.odpovede = {};
V.odpovede.cena = await opytaj('koľko stojí strih', 'cena');
// zväčšený výrez bubliny s cenníkom
{ const bx = V.odpovede.cena.li; if (bx) await shot(p, `${out}/${tag}-${len}-cena-vyrez.png`, { clip: { x: Math.max(0, bx.x - 8), y: Math.max(0, bx.y - 8), width: Math.min(vp.width - Math.max(0, bx.x - 8), bx.w + 16), height: Math.min(vp.height - Math.max(0, bx.y - 8), bx.h + 16) } }); }

// voľby „Myslíš toto?“
V.odpovede.volby = await opytaj('strih a melír', 'volby');
{ const bx = V.odpovede.volby.li; if (bx) await shot(p, `${out}/${tag}-${len}-volby-vyrez.png`, { clip: { x: Math.max(0, bx.x - 8), y: Math.max(0, bx.y - 8), width: Math.min(vp.width - Math.max(0, bx.x - 8), bx.w + 16), height: Math.min(vp.height - Math.max(0, bx.y - 8), bx.h + 16) } }); }
// klávesnica: zo vstupu Shift+Tab späť do volieb
const fk = [];
await p.focus('#rc-q');
for (let i = 0; i < 8; i++) {
  await p.keyboard.press('Shift+Tab');
  fk.push(await ev(() => { const a = document.activeElement, l = document.querySelector('.rc-log').getBoundingClientRect(), r = a.getBoundingClientRect(), s = getComputedStyle(a); return { t: (a.textContent || a.id || a.tagName).trim().slice(0, 40), tag: a.tagName, vPaneli: !!a.closest('#rc-panel'), vis: a.matches(':focus-visible'), outline: s.outlineStyle + ' ' + s.outlineWidth + ' off ' + s.outlineOffset, vidno: r.top >= l.top - 1 && r.bottom <= l.bottom + 1 || !a.closest('.rc-log'), y: Math.round(r.y) }; }));
}
V.volbyShiftTab = fk;
// fokus na prvú voľbu (button v poslednom li) a snímka
const prvaVolba = await ev(() => { const li = document.querySelector('.rc-log > li:last-child'), b = li.querySelector('button'); if (!b) return null; b.focus(); return b.textContent; });
if (prvaVolba) { await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await sleep(200);
  V.volbaFokus = await ev(() => { const a = document.activeElement, s = getComputedStyle(a); return { t: a.textContent, vis: a.matches(':focus-visible'), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor }; });
  const bx = V.odpovede.volby.li; await shot(p, `${out}/${tag}-${len}-volby-fokus.png`, { clip: { x: Math.max(0, bx.x - 8), y: Math.max(0, bx.y - 8), width: Math.min(vp.width - Math.max(0, bx.x - 8), bx.w + 16), height: Math.min(vp.height - Math.max(0, bx.y - 8), bx.h + 16) } });
  // ťuknutie na prvú voľbu
  const sel = '.rc-log > li:last-child button';
  if (mobil) await p.locator(sel).first().tap(); else await p.locator(sel).first().click();
  await sleep(400);
  V.poVolbe = await posledna();
  V.poVolbeOtazka = await p.evaluate(() => document.querySelector('.rc-log > li:nth-last-child(2)').textContent);
  await shot(p, `${out}/${tag}-${len}-po-volbe.png`);
}
V.odpovede.damy = await opytaj('strihate aj damy', 'damy');

// S7: skrol pri otvorenom paneli
for (const q of ['parkovanie', 'otváracie hodiny', 'kde ste', 'platba kartou']) await opytaj(q);
const info = () => ev(() => { const l = document.querySelector('.rc-log'), r = l.getBoundingClientRect(); return { sy: Math.round(scrollY), lt: Math.round(l.scrollTop), lmax: l.scrollHeight - l.clientHeight, r: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, bodyOv: document.body.style.overflow }; });
const s7 = { pred: await info() };
const L = s7.pred.r;
if (mobil) {
  const cdp = await ctx.newCDPSession(p);
  const drag = async (x0, y0, x1, y1) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] }); for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 12, y: y0 + (y1 - y0) * i / 12 }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(600); };
  V._drag = true;
  await drag(L.x + L.w / 2, L.y + L.h - 40, L.x + L.w / 2, L.y + L.h - 240); s7.tahLogKoniec = await info();
  for (let i = 0; i < 6; i++) await drag(L.x + L.w / 2, L.y + 40, L.x + L.w / 2, L.y + 340);
  s7.tahyLogZaciatok = await info();
  const pz = await p.evaluate(() => Math.round(document.querySelector('#rc-panel').getBoundingClientRect().y));
  s7.pozadieY = Math.round(pz / 2);
  if (pz > 100) { await drag(195, s7.pozadieY + 60, 195, s7.pozadieY - 60); s7.tahPozadieNahor = await info(); await drag(195, s7.pozadieY - 60, 195, s7.pozadieY + 60); s7.tahPozadieNadol = await info(); }
  // V1: vodorovný ťah v rade volieb
  const cb = await ev(() => R(document.querySelector('.rc-chips')));
  await drag(cb.x + cb.w - 30, cb.y + cb.h / 2, cb.x + 30, cb.y + cb.h / 2);
  s7.chipsPoTahu = await p.evaluate(() => Math.round(document.querySelector('.rc-chips').scrollLeft));
  await cdp.detach();
} else {
  await p.mouse.move(L.x + L.w / 2, L.y + L.h / 2);
  await p.mouse.wheel(0, 600); await sleep(500); s7.kolieskoLogKoniec = await info();
  await p.mouse.wheel(0, -3000); await sleep(500); s7.kolieskoLogZaciatok = await info();
  await p.mouse.move(300, 300); await p.mouse.wheel(0, 500); await sleep(500); s7.kolieskoPozadie = await info();
  await p.mouse.wheel(0, -500); await sleep(500); s7.kolieskoPozadieNahor = await info();
  // V1: posun radu volieb kolieskom so Shift (vodorovne)
  const cb = await ev(() => R(document.querySelector('.rc-chips')));
  await p.mouse.move(cb.x + cb.w / 2, cb.y + cb.h / 2); await p.mouse.wheel(300, 0); await sleep(400);
  s7.chipsPoKolesku = await p.evaluate(() => Math.round(document.querySelector('.rc-chips').scrollLeft));
}
await shot(p, `${out}/${tag}-${len}-panel-dlhy.png`);
// zatvorenie krížikom (V1 po ťahu / koliesku)
if (mobil) await p.tap('.rc-x'); else await p.click('.rc-x');
await sleep(400);
s7.poZatvoreni = { ...(await stav()), open: await p.evaluate(() => !!document.querySelector('#rc-panel[open]')), fokus: await p.evaluate(() => document.activeElement.className) };
V.S7 = s7;
// V1 a: po ťahu/koliesku nové otvorenie
await otvor();
V.V1 = { poPosuneZnova: await ev(() => { const c = document.querySelector('.rc-chips'), a = document.activeElement; return { scrollLeft: Math.round(c.scrollLeft), fokus: a.textContent.trim(), fx: Math.round(a.getBoundingClientRect().x), fr: Math.round(a.getBoundingClientRect().right), iw: innerWidth }; }) };
// V1 b: Tab na poslednú voľbu, Esc, nové otvorenie
for (let i = 0; i < 4; i++) await p.keyboard.press('Tab');
V.V1.po4Tab = await ev(() => { const c = document.querySelector('.rc-chips'), a = document.activeElement; return { scrollLeft: Math.round(c.scrollLeft), fokus: a.textContent.trim() }; });
await p.keyboard.press('Escape'); await sleep(400);
V.V1.poEsc = { ...(await stav()), fokus: await p.evaluate(() => document.activeElement.className) };
await otvor();
V.V1.znova = await ev(() => { const c = document.querySelector('.rc-chips'), a = document.activeElement; return { scrollLeft: Math.round(c.scrollLeft), fokus: a.textContent.trim(), fx: Math.round(a.getBoundingClientRect().x), fr: Math.round(a.getBoundingClientRect().right), iw: innerWidth }; });
{ const cb = await ev(() => R(document.querySelector('.rc-chips'))); await shot(p, `${out}/${tag}-${len}-volby-znova.png`, { clip: { x: Math.max(0, cb.x - 8), y: cb.y - 8, width: Math.min(vp.width - Math.max(0, cb.x - 8), cb.w + 16), height: cb.h + 16 } }); }
await p.keyboard.press('Escape'); await sleep(400);

// D8: obrys fokusu prvej voľby pri otvorení klávesom
await p.evaluate(() => document.querySelector('.recepcia-btn').focus());
await p.keyboard.press('Enter'); await sleep(450); await dokonci();
V.D8 = await ev(() => { const a = document.activeElement, c = a.closest('.rc-chips'), s = getComputedStyle(a), cs = getComputedStyle(c), ar = a.getBoundingClientRect(), cr = c.getBoundingClientRect(); const ow = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset); return { el: a.textContent.trim(), vis: a.matches(':focus-visible'), outline: s.outlineStyle + ' ' + s.outlineWidth + ' off ' + s.outlineOffset, obrysPx: ow, odLava: Math.round((ar.x - cr.x) * 10) / 10, odHora: Math.round((ar.y - cr.y) * 10) / 10, odDola: Math.round((cr.bottom - ar.bottom) * 10) / 10, padding: cs.padding, margin: cs.margin, chipsX: Math.round(cr.x), chipX: Math.round(ar.x), nadpisX: Math.round(document.querySelector('#rc-h').getBoundingClientRect().x), celyObrys: ar.x - cr.x >= ow && ar.y - cr.y >= ow && cr.bottom - ar.bottom >= ow }; });
{ const cb = await ev(() => R(document.querySelector('.rc-chips'))); await shot(p, `${out}/${tag}-${len}-fokus.png`, { clip: { x: Math.max(0, cb.x - 12), y: cb.y - 12, width: Math.min(260, vp.width - Math.max(0, cb.x - 12)), height: cb.h + 24 } }); }
const tab = [];
for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); tab.push(await p.evaluate(() => (document.activeElement.closest('#rc-panel') ? 'panel' : 'MIMO'))); }
V.D8.tabVPaneli = tab.filter((t) => t === 'panel').length + '/14';
await p.keyboard.press('Escape'); await sleep(300);
V.D8.poEsc = await p.evaluate(() => ({ fokus: document.activeElement.className, vis: document.activeElement.matches(':focus-visible'), expanded: document.querySelector('.recepcia-btn').getAttribute('aria-expanded') }));

// jazyk sk → en → uk → sk
const jazyky = {};
const prepni = async (code, q) => {
  if (mobil) {
    await p.tap('.nav-toggle'); await sleep(500);
    await p.tap(`.site-header [data-lang-pick="${code}"]`); await sleep(1200);
    if (await p.evaluate(() => document.querySelector('.site-header').dataset.menu === 'open')) { await p.tap('.nav-toggle'); await sleep(500); }
  } else { await p.click('.lang-btn'); await sleep(300); await p.click(`.lang-menu [data-lang-pick="${code}"]`); await sleep(1200); }
  const st = await p.evaluate(() => ({ lang: document.documentElement.lang, label: document.querySelector('.recepcia-btn').getAttribute('aria-label') }));
  await otvor();
  st.panel = await p.evaluate(() => { const d = document.querySelector('#rc-panel'); return { lang: d.lang, nadpis: d.querySelector('#rc-h').textContent, chips: [...d.querySelectorAll('.rc-chip')].map((c) => c.textContent), zavriet: d.querySelector('.rc-x').getAttribute('aria-label'), vstup: d.querySelector('#rc-q').placeholder, sukromie: d.querySelector('.rc-sukromie').textContent, bublinyInyJazyk: [...d.querySelectorAll('.rc-log > li[lang]')].filter((l) => l.lang !== d.lang).length, bublin: d.querySelectorAll('.rc-log > li').length }; });
  if (q) { st.odpoved = await opytaj(q, `jazyk-${code}`); }
  st.sirka = await stav();
  await p.keyboard.press('Escape'); await sleep(300);
  jazyky[code] = st;
};
await prepni('en', 'how much is a haircut');
await prepni('uk', 'скільки коштує стрижка');
await prepni('sk', null);
V.jazyky = jazyky;
V.clsKoniec = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts }));
await ctx.close();

// D1: ?motion=off a reduce
const pohyb = {};
for (const [k, rm, q] of [['reduce', 'reduce', ''], ['motionOff', 'no-preference', 'motion=off'], ['bezne', 'no-preference', '']]) {
  const c = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', reducedMotion: rm });
  const pp = await c.newPage();
  await pp.goto(url + (q ? (url.includes('?') ? '&' : '?') + q : ''), { waitUntil: 'load' });
  await pp.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  const o = await pp.evaluate(() => ({ dm: document.documentElement.dataset.motion || '', btnAnim: getComputedStyle(document.querySelector('.recepcia-btn')).animationName }));
  if (mobil) await pp.tap('.recepcia-btn'); else await pp.click('.recepcia-btn');
  await pp.locator('#rc-panel[open]').waitFor({ timeout: 5000 });
  o.panelAnim = await pp.evaluate(() => getComputedStyle(document.querySelector('#rc-panel')).animationName);
  pohyb[k] = o; await c.close();
}
V.pohyb = pohyb;
await b.close();
console.log(JSON.stringify(V, null, 1));
