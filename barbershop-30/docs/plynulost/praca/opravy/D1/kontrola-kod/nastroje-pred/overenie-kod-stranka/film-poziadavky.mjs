// S filmom (?film=on): ktoré súbory sa stiahnu pri prechode stránkou – či zálohy (img) a film (textúry) nesťahujú
// to isté dvakrát v inom stupni (iná šírka = iný súbor)
import { BASE, launch, open, sleep, swipe } from './spolocne.mjs';
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
const reqs = [];
page.on('request', (r) => { const u = r.url(); if (/\.(avif|webp|jpg|png|mp4|webm)(\?|$)/.test(u)) reqs.push({ u: u.split('/assets/')[1], typ: r.resourceType(), init: r.frame() ? '' : '' }); });
await page.goto(BASE + '?film=on&uvod=off', { waitUntil: 'load' });
await sleep(3000);
for (let i = 0; i < 30; i++) { await swipe(cdp, { dy: 500, speed: 1500 }); await sleep(250); }
await sleep(2000);
const cls = await page.evaluate(() => document.documentElement.className);
console.log('html:', cls);
const by = new Map();
for (const r of reqs) { const m = r.u.match(/img\/film\/([a-z-]+?)(-m)?-(\d+)\.(avif|webp)/); if (!m) continue; const k = m[1] + (m[2] || ''); if (!by.has(k)) by.set(k, new Set()); by.get(k).add(`${m[3]}.${m[4]} (${r.typ})`); }
for (const [k, v] of by) console.log(k.padEnd(18), [...v].join(', '));
console.log('spolu požiadaviek na obrázky/médiá:', reqs.length);
await ctx.close(); await browser.close();
