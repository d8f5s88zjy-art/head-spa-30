#!/usr/bin/env node
// Test pásu kapitol a Kina (KF-01..03): ťah myšou na počítači, ťuk na kapitolu, popis ▶ pre čítačku v jazyku stránky,
// „Ďalej“ v poradí Tab hneď za pásom a nikdy na texte karty (ani na ležiacom telefóne), pás nad pásmi s textom schovaný,
// kým svieti ponuka jazyka, pás počká; koliesko a klávesy Kino zastavia aj s myšou či fokusom na ▶.
//   node source/tools/kino-test.mjs
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const srv = await startStaticServer(SITE);
const b = await chromium.launch();
const URL = `${srv.origin}/index.html?film=off&hudba=off`;
async function stranka(w, h, mob, url = URL) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, locale: 'sk-SK' });
  const p = await ctx.newPage(); const chyby = [];
  p.on('pageerror', (e) => chyby.push(String(e).slice(0, 160)));
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => !!window.BS30_KINO, null, { timeout: 20000 }).catch(() => chyby.push('kino.js sa nenačítal'));
  return { ctx, p, chyby };
}
const stav = (p) => p.evaluate(() => ({ y: Math.round(scrollY), sc: +document.documentElement.dataset.sceneActive }));
// riadky viditeľného textu (Range) mimo pásu a Ďalej; viditeľný = súčin opacity predkov > 0,3
const TEXT = () => {
  const vis = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; } return o; };
  const out = []; const w = document.createTreeWalker(document.querySelector('.site') || document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!/\p{L}/u.test(n.nodeValue)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const q of r.getClientRects()) if (q.width > 2 && q.bottom > 0 && q.top < innerHeight && vis(n.parentElement) > 0.3) out.push({ x: q.left, y: q.top, r: q.right, b: q.bottom, t: n.nodeValue.trim().slice(0, 24) });
  }
  return out;
};
const prekryv = (a, list) => list.filter((q) => Math.min(a.r, q.r) - Math.max(a.x, q.x) > 1 && Math.min(a.b, q.b) - Math.max(a.y, q.y) > 1).map((q) => q.t);

/* 1. počítač: ťah myšou po páse prejde kapitoly dopredu aj späť, ťuk skočí, štítok hneď ukáže cieľ */
for (const [w, h] of [[1440, 900], [1024, 768]]) {
  const { ctx, p, chyby } = await stranka(w, h, false);
  await p.evaluate(() => scrollTo({ top: window.BS30_PAS.ciel(3), behavior: 'instant' })); await p.waitForTimeout(1200);
  const L = await p.evaluate(() => [...document.querySelectorAll('.story-line a[data-chapter]')].map((a) => { const r = a.getBoundingClientRect(); return { x: r.x, r: r.right, y: r.y + r.height / 2, d: a.draggable }; }));
  ok(L.every((a) => a.d === false), `${w}: odkazy pásu nie sú ťahateľné (draggable = false)`);
  const tah = async (x0, x1) => {
    const t = [await stav(p)]; await p.mouse.move(x0, L[0].y); await p.mouse.down();
    for (let k = 1; k <= 8; k++) { await p.mouse.move(x0 + (x1 - x0) * k / 8, L[0].y, { steps: 2 }); await p.waitForTimeout(100); t.push(await stav(p)); }
    await p.mouse.up(); await p.waitForTimeout(300); return t;
  };
  const dopredu = await tah(L[3].x + 3, L[7].r - 3);
  const ys = dopredu.map((s) => s.y);
  ok(ys.every((y, i) => !i || y >= ys[i - 1]) && dopredu.at(-1).sc === 8, `${w}: ťah myšou doprava ide len dopredu a dôjde na Rezerváciu`, dopredu.map((s) => `${s.y}/${s.sc}`).join(' '));
  const spat = await tah(L[7].r - 3, L[1].x + 3);
  ok(spat.at(-1).sc <= 2 && spat.at(-1).y < dopredu.at(-1).y, `${w}: ťah myšou doľava sa vráti na začiatok`, spat.map((s) => `${s.y}/${s.sc}`).join(' '));
  // ťuk po ťahu: skok na kapitolu 6, štítok hneď ukáže cieľ
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await p.waitForTimeout(1200);
  await p.click('.story-line a[data-chapter="3"]');
  const hned = await p.evaluate(() => document.querySelector('.kino-label').textContent);
  await p.waitForTimeout(1800);
  const s = await stav(p);
  ok(s.sc === 3 && /^03 /.test(hned), `${w}: ťuk na Remeslo skočí a štítok hneď ukáže cieľ`, `${hned} → ${JSON.stringify(s)}`);
  ok(!chyby.length, `${w}: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}

/* 2. popis ▶ pre čítačku v jazyku stránky pred Kinom, počas neho aj po zastavení; en/ stránka */
for (const [jazyk, url, hraj, stoj] of [['sk', URL, 'Prehrať prehliadku', 'Zastaviť prehliadku'], ['en', URL + '&lang=en', 'Play the tour', 'Stop the tour'],
  ['de', URL + '&lang=de', 'Rundgang abspielen', 'Rundgang anhalten'], ['en/', `${srv.origin}/en/index.html?film=off&hudba=off`, 'Play the tour', 'Stop the tour']]) {
  const { ctx, p, chyby } = await stranka(1440, 900, false, url);
  await p.waitForTimeout(1500);
  const a1 = await p.getAttribute('.kino-play', 'aria-label');
  await p.click('.kino-play'); await p.waitForTimeout(500);
  const a2 = await p.getAttribute('.kino-play', 'aria-label');
  await p.click('.kino-play'); await p.waitForTimeout(300);
  const a3 = await p.getAttribute('.kino-play', 'aria-label');
  ok(a1 === hraj && a2 === stoj && a3 === hraj && !chyby.length, `${jazyk}: ▶ pre čítačku „${hraj}“ → „${stoj}“ → „${hraj}“`, [a1, a2, a3].join(' → '));
  await ctx.close();
}

/* 3. „Ďalej“: v poradí Tab hneď za pásom; pri zastavení nikdy na texte karty; na ležiacom telefóne sa neukáže */
for (const [w, h, mob] of [[390, 844, true], [360, 640, true], [1440, 900, false], [1280, 720, false], [844, 390, true], [932, 430, true], [568, 320, true]]) {
  const { ctx, p, chyby } = await stranka(w, h, mob);
  const poradie = await p.evaluate(() => { const n = document.querySelector('.kino-next'); return n && n.previousElementSibling === document.querySelector('.story-line'); });
  const ciele = await p.evaluate(() => window.BS30_KINO.state.ciele);
  let videl = 0; const zle = [];
  for (let i = 1; i < ciele.length - 1; i++) {
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), ciele[i]); await p.waitForTimeout(2300);
    const r = await p.evaluate((T) => {
      const n = document.querySelector('.kino-next'); if (!n || n.hidden || getComputedStyle(n).display === 'none' || +getComputedStyle(n).opacity < 0.5) return null;
      const q = n.getBoundingClientRect(); return { a: { x: q.left, y: q.top, r: q.right, b: q.bottom }, txt: (0, eval)('(' + T + ')')() };
    }, TEXT.toString());
    if (!r) continue; videl++;
    const k = prekryv(r.a, r.txt); if (k.length) zle.push(`kap. ${i + 1}: ${k.slice(0, 2).join(', ')}`);
  }
  if (h <= 500) ok(videl === 0 && !zle.length, `${w}×${h}: Ďalej sa na nízkom okne neukáže`, `ukázal sa ${videl}×`);
  else ok(poradie && videl >= 4 && !zle.length, `${w}×${h}: Ďalej za pásom v poradí Tab, ukázal sa ${videl}× a nikdy na texte karty`, zle.join(' | '));
  ok(!chyby.length, `${w}×${h}: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}

/* 4. pás nad pásmi s textom (tím, cenník, galéria) je schovaný a nekryje text; mimo nich svieti */
for (const [w, h, mob] of [[390, 844, true], [1440, 900, false]]) {
  const { ctx, p } = await stranka(w, h, mob);
  const pasy = await p.evaluate(() => [...document.querySelectorAll('.band')].map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.bottom + scrollY]; }));
  const vysledok = [];
  for (const [t, bot] of pasy) {
    if (bot - t < h * 1.2) continue;
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round((t + bot) / 2 - h / 2)); await p.waitForTimeout(800);
    vysledok.push(await p.evaluate(() => ({ tenky: document.documentElement.classList.contains('kino-tenky'), op: +getComputedStyle(document.querySelector('.story-line')).opacity })));
  }
  ok(vysledok.length >= 2 && vysledok.every((v) => v.tenky && v.op === 0), `${w}: nad pásmi s textom je pás schovaný`, JSON.stringify(vysledok));
  await p.evaluate(() => scrollTo({ top: window.BS30_PAS.ciel(2), behavior: 'instant' })); await p.waitForTimeout(800);
  const mimo = await p.evaluate(() => +getComputedStyle(document.querySelector('.story-line')).opacity);
  ok(mimo === 1, `${w}: nad kartou Remesla pás svieti`, String(mimo));
  // klávesnica: fokus na kapitolu pás ukáže aj nad pásom s textom
  const [t, bot] = pasy.find(([t, bot]) => bot - t >= h * 1.2) || pasy[0];
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round((t + bot) / 2 - h / 2)); await p.waitForTimeout(600);
  await p.focus('.story-line a[data-chapter="5"]'); await p.waitForTimeout(500);
  const fokus = await p.evaluate(() => +getComputedStyle(document.querySelector('.story-line')).opacity);
  ok(fokus === 1, `${w}: fokus klávesnice pás nad textom ukáže`, String(fokus));
  await ctx.close();
}
/* 5. ponuka jazyka (prehliadač v inom jazyku): kým svieti, pás a Ďalej sa schovajú, po zavretí sa vrátia
   (trieda html.lang-ponuka z i18n.js; html:has() by pri každej zmene stránky prepočítaval štýl celého dokumentu) */
for (const [w, h, mob] of [[390, 844, true], [1440, 900, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, locale: 'de-DE' });
  const p = await ctx.newPage(); const chyby = [];
  p.on('pageerror', (e) => chyby.push(String(e).slice(0, 160)));
  await p.goto(URL, { waitUntil: 'load' });
  const op = () => p.evaluate(() => ({ pas: +getComputedStyle(document.querySelector('.story-line')).opacity, trieda: document.documentElement.classList.contains('lang-ponuka') }));
  const ma = await p.waitForSelector('.lang-offer.in', { timeout: 15000 }).then(() => true).catch(() => false);
  await p.waitForTimeout(500);
  const pocas = await op();
  await p.click('.lang-offer [data-no]'); await p.waitForTimeout(800);
  const po = await op();
  ok(ma && pocas.pas === 0 && pocas.trieda && po.pas === 1 && !po.trieda, `${w}: kým svieti ponuka jazyka, pás je schovaný, po zavretí sa vráti`, JSON.stringify({ ma, pocas, po }));
  ok(!chyby.length, `${w}: ponuka jazyka bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}
/* 6. zákazník má prednosť: Kino zastaví koliesko aj s myšou nad ▶, šípka ↓ a PageDown hneď po kliknutí na ▶ (fokus
   ostal na ▶), stránka potom stojí (posun ≤ 5 px za 1,5 s); medzerník a Enter na fokusovanom ▶ ostávajú prepínač;
   telefón: ťuk na ▶ pustí, ťuk do stránky zastaví */
{
  const { ctx, p, chyby } = await stranka(1440, 900, false);
  await p.waitForTimeout(1200);
  const kino = () => p.evaluate(() => window.BS30_KINO.state.playing);
  const zastavi = async (meno, akcia) => {
    await p.evaluate(() => { window.BS30_KINO.stop(); scrollTo({ top: 0, behavior: 'instant' }); }); await p.waitForTimeout(600);
    await p.mouse.move(720, 450); await p.click('.kino-play'); await p.waitForTimeout(3000);
    const pred = await kino();
    await akcia();
    await p.waitForTimeout(400); const y1 = await p.evaluate(() => scrollY); await p.waitForTimeout(1500);
    const s = await p.evaluate(() => ({ hra: window.BS30_KINO.state.playing, y: scrollY, fokus: document.activeElement && document.activeElement.className }));
    const posun = Math.round(Math.abs(s.y - y1));
    ok(pred && !s.hra && posun <= 5, `1440: ${meno} Kino zastaví a stránka stojí`, `hralo ${pred} → ${s.hra}, posun za 1,5 s ${posun} px, fokus ${s.fokus}`);
  };
  await zastavi('koliesko s myšou nad ▶', async () => { const bx = await p.locator('.kino-play').boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.wheel(0, 40); });
  await zastavi('šípka ↓ po kliknutí na ▶', () => p.keyboard.press('ArrowDown'));
  await zastavi('PageDown po kliknutí na ▶', () => p.keyboard.press('PageDown'));
  await zastavi('koliesko v strede stránky', async () => { await p.mouse.move(720, 450); await p.mouse.wheel(0, 40); });
  // medzerník a Enter na fokusovanom ▶: prepínač (pustí, zastaví), nie prerušenie
  await p.evaluate(() => { window.BS30_KINO.stop(); scrollTo({ top: 0, behavior: 'instant' }); }); await p.waitForTimeout(600);
  await p.focus('.kino-play'); await p.keyboard.press(' '); await p.waitForTimeout(800);
  const m1 = await kino(); await p.keyboard.press(' '); await p.waitForTimeout(300);
  const m2 = await kino(); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  const e1 = await kino(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const e2 = await kino();
  ok(m1 && !m2 && e1 && !e2, '1440: medzerník a Enter na ▶ Kino pustia aj zastavia', [m1, m2, e1, e2].join(' '));
  ok(!chyby.length, '1440: prerušenie bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
{
  const { ctx, p, chyby } = await stranka(390, 844, true);
  await p.waitForTimeout(1200);
  await p.tap('.kino-play'); await p.waitForTimeout(5000); // prvé 3,2 s Kino stojí na úvode (státie)
  const hra = await p.evaluate(() => ({ hra: window.BS30_KINO.state.playing, y: scrollY }));
  await p.touchscreen.tap(195, 600);
  await p.waitForTimeout(400); const y1 = await p.evaluate(() => scrollY); await p.waitForTimeout(1500);
  const s = await p.evaluate(() => ({ hra: window.BS30_KINO.state.playing, y: scrollY }));
  ok(hra.hra && hra.y > 0 && !s.hra && Math.abs(s.y - y1) <= 5, '390 dotyk: ťuk na ▶ Kino pustí, ťuk do stránky ho zastaví', `po 5 s y ${Math.round(hra.y)}, hrá ${hra.hra} → ${s.hra}, posun ${Math.round(Math.abs(s.y - y1))} px`);
  ok(!chyby.length, '390 dotyk: bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
await b.close(); srv.server.close();
console.log(`\nVÝSLEDOK: ${failed ? failed + ' zlyhalo' : 'všetko v poriadku'}`);
process.exit(failed ? 1 : 0);
