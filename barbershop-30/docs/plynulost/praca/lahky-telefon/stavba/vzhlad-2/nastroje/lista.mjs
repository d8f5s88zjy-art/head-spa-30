// Lišta a pätička na telefóne: plné pozadie lišty pri skrole, text pod lištou nepresvitá, stránka končí pätičkou,
// spodné tlačidlo neprekrýva text pätičky. Snímky: koniec stránky a lišta nad textom pásu.
// node lista.mjs <port> <w>x<h> <outprefix> [query]
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, size, OUT, Q = ''] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${port}/barbershop-30/${Q}`, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
const go = async (y) => { await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(900); };
const merania = [];
// polohy: pás tímu (text pod lištou), cenník, galéria, koniec
const polohy = await page.evaluate(() => { const top = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : null; };
  return { tim: top('.band-team'), cennik: top('.price-group'), galeria: top('#galeria .band, #galeria'), kontakt: top('#kontakt'), koniec: document.documentElement.scrollHeight - innerHeight }; });
for (const [k, y0] of Object.entries(polohy)) {
  if (y0 == null) continue; const y = k === 'koniec' ? y0 : y0 + 30; await go(y);
  const m = await page.evaluate(() => {
    const h = document.querySelector('.site-header'); const cs = getComputedStyle(h); const hb = h.getBoundingClientRect();
    const pseudo = getComputedStyle(h, '::before');
    // text pod lištou: prvky s vlastným textom, ktorých obdĺžnik zasahuje do lišty
    const pod = []; const tw = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.height && b.top < hb.bottom && b.bottom > hb.top) { pod.push(n.textContent.trim().slice(0, 30)); if (pod.length > 3) break; } }
    const f = document.querySelector('.site-footer'); const fb = f.getBoundingClientRect();
    const cta = document.getElementById('mobile-cta'); const cb = cta.getBoundingClientRect(); const ctaVid = !cta.classList.contains('is-hidden') && getComputedStyle(cta).visibility !== 'hidden' && +getComputedStyle(cta).opacity > 0.05;
    const prekryva = []; if (ctaVid) { const tw2 = document.createTreeWalker(f, NodeFilter.SHOW_TEXT); for (let n = tw2.nextNode(); n; n = tw2.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.height && b.bottom > cb.top && b.top < cb.bottom && b.right > cb.left && b.left < cb.right) prekryva.push(n.textContent.trim().slice(0, 30)); } }
    const tv = document.querySelector('.team-video video');
    return { y: Math.round(scrollY), scrolled: h.classList.contains('is-scrolled'), bg: cs.backgroundColor, filter: cs.backdropFilter, lista: [Math.round(hb.top), Math.round(hb.bottom)], before: [pseudo.content, pseudo.backgroundImage.slice(0, 60), pseudo.top, pseudo.height],
      textPodListou: pod, footerBottomDoc: Math.round(fb.bottom + scrollY), scrollH: document.documentElement.scrollHeight, rezervaPodPatickou: Math.round(document.documentElement.scrollHeight - (fb.bottom + scrollY)),
      footerPb: getComputedStyle(f).paddingBottom, footerShadow: getComputedStyle(f).boxShadow.slice(0, 60), ctaVid, cta: [Math.round(cb.top), Math.round(cb.bottom)], ctaPrekryvaText: prekryva,
      timVideo: tv ? getComputedStyle(tv.closest('figure')).display : null };
  });
  merania.push({ k, ...m });
  if (k === 'tim' || k === 'koniec' || k === 'cennik') await page.screenshot({ path: `${OUT}-${k}.jpg`, type: 'jpeg', quality: 85, scale: 'css' });
}
// pretiahnutie za koniec (odraz): snímka hneď po ťahu nahor na konci stránky
const cdp = await ctx.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: W / 2, y: H * 0.8 }] });
for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: W / 2, y: H * 0.8 - 40 * i }] }); await page.waitForTimeout(16); }
await page.screenshot({ path: `${OUT}-pretiahnutie.jpg`, type: 'jpeg', quality: 85, scale: 'css' });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
fs.writeFileSync(`${OUT}.json`, JSON.stringify({ W, H, polohy, merania }, null, 1));
for (const m of merania) console.log(JSON.stringify(m));
await browser.close();
