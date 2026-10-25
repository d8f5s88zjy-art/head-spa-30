// Kontrola vzhľadu recepcie: telefón 390×844 @3 (dotyk) a počítač 1440×900.
// node vzhlad.mjs <url index.html> <priečinok snímok> <pred|po> [telefon|pocitac]
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out, tag, len] = process.argv.slice(2);
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const b = await chromium.launch({ headless: true, args: ARGS });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vysl = { tag, url, zariadenia: {}, snimkyChyby: [] };
const shot = async (p, path, o = {}) => {
  for (let i = 0; i < 4; i++) {
    try { await p.screenshot({ path, timeout: 20000, ...o, ...(i === 3 ? { scale: 'css' } : {}) }); if (i) vysl.snimkyChyby.push(path.split('/').pop() + ' pokus ' + (i + 1)); return; }
    catch (e) { vysl.snimkyChyby.push(path.split('/').pop() + ': ' + e.message.split('\n')[0]); await sleep(1200); }
  }
};
const ZAR = [['telefon', { width: 390, height: 844 }, 3, true], ['pocitac', { width: 1440, height: 900 }, 1, false]].filter((z) => !len || z[0] === len);

const CLS_INIT = () => {
  window.__cls = 0; window.__shifts = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ t: Math.round(e.startTime), v: e.value, src: (e.sources || []).map((s) => s.node && (s.node.className || s.node.nodeName)).join('|') }); } } }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) { /* */ }
};

// čo leží pod tlačidlom (body vzorkovania) a čo sa s ním prekrýva
const POD = () => {
  const btn = document.querySelector('.recepcia-btn');
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const inter = (a, c) => a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && e.getClientRects().length; };
  const o = { scrollY: Math.round(scrollY) };
  const box = btn ? R(btn) : (innerWidth > 900 ? { x: innerWidth - 40 - 56, y: innerHeight - 24 - 56, w: 56, h: 56 } : { x: 16, y: innerHeight - 16 - 46, w: 46, h: 46 });
  o.btn = box; o.btnJe = !!btn;
  if (btn) { const cx = box.x + box.w / 2, cy = box.y + box.h / 2; const top = document.elementFromPoint(cx, cy); o.navrchuStred = top === btn || btn.contains(top) ? 'tlačidlo' : (top ? (top.className || top.nodeName) + '' : null); o.btnVis = getComputedStyle(btn).visibility; }
  // interaktívne prvky stránky pod tlačidlom (tlačidlo ich zakrýva)
  const pod = new Set();
  for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) {
    for (const e of document.elementsFromPoint(box.x + box.w * fx, box.y + box.h * fy)) {
      if (btn && (e === btn || btn.contains(e))) continue;
      const i = e.closest('a, button, input, select, textarea, [role="button"], summary');
      if (i && vis(i)) { pod.add(i); }
    }
  }
  o.podTlacidlom = [...pod].map((i) => ({ el: i.tagName.toLowerCase() + (i.className ? '.' + String(i.className).trim().split(/\s+/).join('.') : ''), text: (i.getAttribute('aria-label') || i.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), r: R(i) }));
  // menované spodné prvky
  const sp = [];
  for (const sel of ['.mobile-cta .btn', '.lang-offer', '.film-place', '.film-bars i:last-child', '.scroll-hint', '.cookie, .toast']) {
    document.querySelectorAll(sel).forEach((e) => { if (!vis(e)) return; const r = R(e); if (r.w && r.h) sp.push({ sel, r, kolizia: inter(r, box), z: getComputedStyle(e.closest('.mobile-cta, .lang-offer, .film-place, .film-bars') || e).zIndex }); });
  }
  o.spodne = sp;
  return o;
};

for (const [meno, vp, dpr, mobil] of ZAR) {
  const Z = vysl.zariadenia[meno] = { chyby: [], ziadosti: [] };
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', colorScheme: 'dark', reducedMotion: 'no-preference' });
  await ctx.addInitScript(CLS_INIT);
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/WebGL|GPU/i.test(m.text())) Z.chyby.push(m.text()); });
  p.on('pageerror', (e) => Z.chyby.push(String(e)));
  p.on('request', (r) => { if (/recepcia/.test(r.url())) Z.ziadosti.push(r.url().replace(/^.*\/assets\//, '')); });
  const t0 = Date.now();
  await p.goto(url, { waitUntil: 'load' });
  Z.loadMs = Date.now() - t0;
  Z.html = await p.evaluate(() => document.documentElement.className);
  // tlačidlo: kedy sa objaví
  const tl = Date.now();
  try { await p.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }); Z.tlacidloPoLoadMs = Date.now() - tl; } catch { Z.tlacidloPoLoadMs = null; }
  const ma = Z.tlacidloPoLoadMs != null;
  await sleep(ma ? 3500 : 3500);
  await p.evaluate(() => scrollTo(0, 0)); await sleep(400);
  Z.pokoj = await p.evaluate(POD);
  Z.clsPokoj = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts }));
  await shot(p, `${out}/${tag}-${meno}-pokoj.png`);
  // tlačidlo: poloha v strede stránky (spodné tlačidlo rezervácie je vidieť)
  await p.evaluate(() => { const s = document.querySelector('#sluzby'); scrollTo(0, s ? s.getBoundingClientRect().top + scrollY + innerHeight * 0.6 : document.documentElement.scrollHeight / 2); });
  await sleep(1200);
  Z.tlacidlo = await p.evaluate(POD);
  await shot(p, `${out}/${tag}-${meno}-tlacidlo.png`);
  if (!ma) { await ctx.close();
  // zostup stránkou v novom kontexte: kolízie pri každej polohe
  {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  await sleep(600);
  // zostup stránkou: kolízie pri každej polohe
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const kroky = [];
  const krok = Math.round(vp.height * 0.5);
  for (let y = 0, n = 0; y <= H && n < 70; y += krok, n++) {
    await p.evaluate((yy) => scrollTo(0, yy), y); await sleep(160);
    kroky.push(await p.evaluate(POD));
  }
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(700);
  const koniec = await p.evaluate(POD); kroky.push(koniec);
  await shot(p, `${out}/${tag}-${meno}-koniec.png`);
  Z.vyskaStranky = H;
  Z.kolizie = kroky.filter((k) => k.podTlacidlom.length || k.spodne.some((s) => s.kolizia) || (k.navrchuStred && k.navrchuStred !== 'tlačidlo'));
  Z.krokov = kroky.length;
  Z.spodneVidene = [...new Set(kroky.flatMap((k) => k.spodne.map((s) => s.sel)))];
  await ctx.close();
  }
  continue; }

  // stav tlačidla
  Z.btnAttr = await p.evaluate(() => { const e = document.querySelector('.recepcia-btn'); const s = getComputedStyle(e); return { label: e.getAttribute('aria-label'), haspopup: e.getAttribute('aria-haspopup'), expanded: e.getAttribute('aria-expanded'), w: e.offsetWidth, h: e.offsetHeight, right: innerWidth - e.getBoundingClientRect().right, bottom: innerHeight - e.getBoundingClientRect().bottom, left: e.getBoundingClientRect().left, z: s.zIndex, anim: s.animationName }; });

  // otvorenie panela (ťuknutie / klik)
  const pred = await p.evaluate(() => { const h = document.querySelector('.site-header'), l = h && h.querySelector('a'); return { iw: innerWidth, cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, sy: Math.round(scrollY), hx: h && h.getBoundingClientRect().width, lx: l && Math.round(l.getBoundingClientRect().x * 100) / 100, bodyOv: getComputedStyle(document.body).overflow, htmlOv: getComputedStyle(document.documentElement).overflow }; });
  if (mobil) await p.tap('.recepcia-btn'); else await p.click('.recepcia-btn');
  await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 });
  await sleep(450);
  const po = await p.evaluate(() => { const h = document.querySelector('.site-header'), l = h && h.querySelector('a'); const d = document.querySelector('#rc-panel'), r = d.getBoundingClientRect(); const a = document.activeElement; return { iw: innerWidth, cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, sy: Math.round(scrollY), hx: h && h.getBoundingClientRect().width, lx: l && Math.round(l.getBoundingClientRect().x * 100) / 100, bodyOv: getComputedStyle(document.body).overflow, htmlOv: getComputedStyle(document.documentElement).overflow, panel: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, fokus: a && (a.className + ' ' + (a.textContent || '').trim().slice(0, 30)), fokusVis: a && a.matches(':focus-visible'), expanded: document.querySelector('.recepcia-btn').getAttribute('aria-expanded'), cssOk: getComputedStyle(d).position, nadpis: d.querySelector('#rc-h').textContent, chips: [...d.querySelectorAll('.rc-chip')].map((c) => c.textContent), noI18n: d.hasAttribute('data-no-i18n'), lang: d.lang, chipsOv: (() => { const c = d.querySelector('.rc-chips'); return { sw: c.scrollWidth, cw: c.clientWidth }; })() }; });
  Z.showModal = { pred, po };
  Z.clsPoOtvoreni = await p.evaluate(() => +window.__cls.toFixed(4));
  await shot(p, `${out}/${tag}-${meno}-panel.png`);

  const opytaj = async (q, nazov) => {
    if (mobil) await p.tap('#rc-q'); else await p.click('#rc-q');
    await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); await sleep(350);
    const t = await p.evaluate(() => { const li = document.querySelector('.rc-log > li:last-child'); return { text: li.innerText, odkazy: [...li.querySelectorAll('a, button')].map((a) => a.textContent.trim() + (a.href ? ' → ' + a.getAttribute('href') : '')) }; });
    if (nazov) await shot(p, `${out}/${tag}-${meno}-${nazov}.png`);
    return t;
  };
  Z.odpovede = {};
  Z.odpovede['koľko stojí strih'] = await opytaj('koľko stojí strih', 'cena');
  Z.odpovede['strihate aj damy'] = await opytaj('strihate aj damy', 'damy');
  Z.klavesnicaPoOdoslani = await p.evaluate(() => ({ fokus: document.activeElement && (document.activeElement.id || document.activeElement.className), iw: innerWidth, vvh: visualViewport && Math.round(visualViewport.height) }));
  // S7: skrol na konci logu a nad pozadím
  for (const q of ['parkovanie', 'otváracie hodiny', 'kde ste', 'platba kartou', 'darčeková poukážka']) await opytaj(q);
  const logInfo = async () => p.evaluate(() => { const l = document.querySelector('.rc-log'); const r = l.getBoundingClientRect(); return { sy: Math.round(scrollY), lt: Math.round(l.scrollTop), lmax: l.scrollHeight - l.clientHeight, r: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, ob: getComputedStyle(l).overscrollBehaviorY, obD: getComputedStyle(document.querySelector('#rc-panel')).overscrollBehaviorY }; });
  const s7 = {};
  s7.pred = await logInfo();
  const L = s7.pred.r;
  if (mobil) {
    const cdp = await ctx.newCDPSession(p);
    const drag = async (x, y0, y1) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] }); for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / 12 }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(700); };
    // log je na konci; ťah prstom nahor (ďalej nadol)
    await drag(L.x + L.w / 2, L.y + L.h - 40, L.y + L.h - 240); s7.poTahuLogKoniec = await logInfo();
    // ťahy nadol, kým log nie je na začiatku, a ešte jeden
    for (let i = 0; i < 6; i++) { await drag(L.x + L.w / 2, L.y + 40, L.y + 340); }
    s7.poTahochLogZaciatok = await logInfo();
    // ťah cez pozadie nad panelom
    const pz = await p.evaluate(() => Math.round(document.querySelector('#rc-panel').getBoundingClientRect().y));
    if (pz > 100) { await drag(195, Math.round(pz / 2) + 40, Math.round(pz / 2) - 40); s7.poTahuPozadie = await logInfo(); s7.pozadieY = Math.round(pz / 2); }
    await cdp.detach();
  } else {
    await p.mouse.move(L.x + L.w / 2, L.y + L.h / 2);
    await p.mouse.wheel(0, 600); await sleep(500); s7.poKoleskuLogKoniec = await logInfo();
    await p.mouse.wheel(0, -3000); await sleep(500); s7.poKoleskuLogZaciatok = await logInfo();
    await p.mouse.move(300, 300); await p.mouse.wheel(0, 500); await sleep(500); s7.poKoleskuPozadie = await logInfo();
  }
  Z.S7 = s7;
  await shot(p, `${out}/${tag}-${meno}-panel-dlhy.png`);
  // Esc
  const syPred = await p.evaluate(() => Math.round(scrollY));
  await p.keyboard.press('Escape'); await sleep(400);
  Z.esc = await p.evaluate((s) => { const a = document.activeElement; return { open: !!document.querySelector('#rc-panel[open]'), fokus: a && a.className, expanded: document.querySelector('.recepcia-btn').getAttribute('aria-expanded'), syPredEsc: s, sy: Math.round(scrollY) }; }, syPred);
  Z.esc.syPredOtvorenim = pred.sy;

  // klávesnica: fokus na tlačidlo, Enter, fokus v paneli, Tab ostáva v paneli
  await p.evaluate(() => document.querySelector('.recepcia-btn').focus());
  await p.keyboard.press('Enter'); await sleep(500);
  const fk = { prvy: await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(), c = a.closest('.rc-chips'), cr = c && c.getBoundingClientRect(); const s = getComputedStyle(a); return { el: a.className + ' ' + a.textContent.trim(), vis: a.matches(':focus-visible'), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor + ' off ' + s.outlineOffset, chipX: Math.round(r.x), chipsX: cr && Math.round(cr.x), chipY: Math.round(r.y), chipsY: cr && Math.round(cr.y), chipB: Math.round(r.bottom), chipsB: cr && Math.round(cr.bottom), chipsOverflowX: c && getComputedStyle(c).overflowX }; }) };
  const r1 = await p.evaluate(() => { const c = document.querySelector('.rc-chips').getBoundingClientRect(); return { x: Math.max(0, c.x - 12), y: Math.max(0, c.y - 12), width: Math.min(innerWidth - Math.max(0, c.x - 12), 260), height: c.height + 24 }; });
  await shot(p, `${out}/${tag}-${meno}-fokus.png`, { clip: r1 });
  const tab = [];
  for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); tab.push(await p.evaluate(() => { const a = document.activeElement; return (a.closest('#rc-panel') ? 'panel:' : 'MIMO:') + (a.className || a.tagName); })); }
  fk.tab = tab;
  await p.keyboard.press('Escape'); await sleep(300);
  fk.poEsc = await p.evaluate(() => ({ fokus: document.activeElement.className, vis: document.activeElement.matches(':focus-visible') }));
  Z.fokus = fk;

  // prepnutie jazyka sk → en → uk cez prepínač stránky
  const jazyky = {};
  const prepni = async (code) => {
    if (mobil) {
      await p.tap('.nav-toggle'); await sleep(500);
      jazyky['menuOtvorene_' + code] = await p.evaluate(() => ({ menu: document.querySelector('.site-header').dataset.menu, btnVis: getComputedStyle(document.querySelector('.recepcia-btn')).visibility }));
      await p.tap(`.site-header [data-lang-pick="${code}"]`); await sleep(1200);
      if (await p.evaluate(() => document.querySelector('.site-header').dataset.menu === 'open')) { await p.tap('.nav-toggle'); await sleep(500); }
    } else {
      await p.click('.lang-btn'); await sleep(300);
      await p.click(`.lang-menu [data-lang-pick="${code}"]`); await sleep(1200);
    }
    const st = await p.evaluate(() => ({ lang: document.documentElement.lang, label: document.querySelector('.recepcia-btn').getAttribute('aria-label'), btnVis: getComputedStyle(document.querySelector('.recepcia-btn')).visibility }));
    if (mobil) await p.tap('.recepcia-btn'); else await p.click('.recepcia-btn');
    await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(500);
    st.panel = await p.evaluate(() => { const d = document.querySelector('#rc-panel'); return { lang: d.lang, nadpis: d.querySelector('#rc-h').textContent, chips: [...d.querySelectorAll('.rc-chip')].map((c) => c.textContent), uvod: d.querySelector('.rc-log li').textContent.slice(0, 80), zavriet: d.querySelector('.rc-x').getAttribute('aria-label'), vstup: d.querySelector('#rc-q').placeholder, sukromie: d.querySelector('.rc-sukromie').textContent, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    st.odpoved = await opytaj(code === 'en' ? 'how much is a haircut' : 'скільки коштує стрижка', `jazyk-${code}`);
    await p.keyboard.press('Escape'); await sleep(300);
    jazyky[code] = st;
  };
  await prepni('en');
  await prepni('uk');
  await prepni('sk');
  Z.jazyky = jazyky;
  Z.sirkaKoniec = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  Z.clsKoniec = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts }));
  await ctx.close();

  // zostup stránkou v novom kontexte: kolízie pri každej polohe
  {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  await sleep(600);
  // zostup stránkou: kolízie pri každej polohe
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const kroky = [];
  const krok = Math.round(vp.height * 0.5);
  for (let y = 0, n = 0; y <= H && n < 70; y += krok, n++) {
    await p.evaluate((yy) => scrollTo(0, yy), y); await sleep(160);
    kroky.push(await p.evaluate(POD));
  }
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(700);
  const koniec = await p.evaluate(POD); kroky.push(koniec);
  await shot(p, `${out}/${tag}-${meno}-koniec.png`);
  Z.vyskaStranky = H;
  Z.kolizie = kroky.filter((k) => k.podTlacidlom.length || k.spodne.some((s) => s.kolizia) || (k.navrchuStred && k.navrchuStred !== 'tlačidlo'));
  Z.krokov = kroky.length;
  Z.spodneVidene = [...new Set(kroky.flatMap((k) => k.spodne.map((s) => s.sel)))];
  await ctx.close();
  }
  // ponuka jazyka (prehliadač v angličtine) súčasne s tlačidlom
  const c2 = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil, locale: 'en-US', colorScheme: 'dark' });
  const p2 = await c2.newPage();
  await p2.goto(url, { waitUntil: 'load' });
  await p2.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  const tOffer = Date.now();
  const offer = await p2.locator('.lang-offer.in').waitFor({ timeout: 9000 }).then(() => true, () => false); const offerMs = Date.now() - tOffer;
  await sleep(600);
  await shot(p2, `${out}/${tag}-${meno}-ponuka-jazyka-uvod.png`);
  Z.ponukaJazyka = await p2.evaluate(POD);
  Z.ponukaJazyka.offerIn = offer; Z.ponukaJazyka.offerPoTlacidleMs = offerMs;
  // aj v strede stránky (spodné tlačidlo rezervácie)
  await p2.evaluate(() => { const s = document.querySelector('#sluzby'); scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.6); }); await sleep(900);
  Z.ponukaJazykaStredOfferIn = await p2.evaluate(() => !!document.querySelector('.lang-offer.in'));
  Z.ponukaJazykaStred = await p2.evaluate(POD);
  await shot(p2, `${out}/${tag}-${meno}-ponuka-jazyka.png`);
  await c2.close();

  // obmedzený pohyb
  const c3 = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', reducedMotion: 'reduce' });
  const p3 = await c3.newPage();
  await p3.goto(url, { waitUntil: 'load' });
  await p3.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  const rm = { btnAnim: await p3.evaluate(() => getComputedStyle(document.querySelector('.recepcia-btn')).animationName) };
  if (mobil) await p3.tap('.recepcia-btn'); else await p3.click('.recepcia-btn');
  await p3.locator('#rc-panel[open]').waitFor({ timeout: 5000 });
  rm.panelAnim = await p3.evaluate(() => getComputedStyle(document.querySelector('#rc-panel')).animationName);
  await c3.close();
  // ?motion=off (D1)
  const c4 = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK' });
  const p4 = await c4.newPage();
  await p4.goto(url + (url.includes('?') ? '&' : '?') + 'motion=off', { waitUntil: 'load' });
  await p4.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  rm.motionOff = await p4.evaluate(() => ({ dm: document.documentElement.dataset.motion, btnAnim: getComputedStyle(document.querySelector('.recepcia-btn')).animationName }));
  await c4.close();
  Z.pohyb = rm;
}
await b.close();
console.log(JSON.stringify(vysl, null, 1));
