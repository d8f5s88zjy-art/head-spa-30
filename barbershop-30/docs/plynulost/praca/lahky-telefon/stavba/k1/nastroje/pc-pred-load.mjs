// Kontrola (len čítanie): počítač 1440×900 (myš) – ktoré zálohy img/film sa stiahnu pred udalosťou load, čas load,
// počet volaní decode() na zálohách počas behu filmu. D1 vs HEAD tou istou metódou.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [HEAD, D1] = process.argv.slice(2);
const { startStaticServer, PRESETS } = await import(HEAD + '/source/shot.mjs');
const browser = await chromium.launch(PRESETS[0]);
for (const [name, root] of [['D1', D1], ['HEAD', HEAD]]) {
  for (const q of ['', '?film=on']) {
    const srv = await startStaticServer(root);
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    await ctx.addInitScript(() => { window.__dec = 0; const o = HTMLImageElement.prototype.decode; HTMLImageElement.prototype.decode = function () { if (this.closest && this.closest('.film-still')) window.__dec++; return o.call(this); }; });
    const page = await ctx.newPage();
    // pomalšia sieť, aby bolo poradie vidieť: každá fotka zálohy 300 ms navyše
    await page.route(/assets\/img\/film\/[a-z-]+-\d+\.(avif|webp)$/, async (r) => { await new Promise((s) => setTimeout(s, 300)); r.continue().catch(() => {}); });
    const reqs = []; let loaded = false;
    page.on('request', (r) => { const u = r.url(); if (/img\/film\/[a-z-]+-\d+\.(avif|webp)$/.test(u)) reqs.push((loaded ? 'po:' : 'pred:') + u.split('/').pop()); });
    const t0 = Date.now();
    await page.goto(srv.origin + '/index.html' + q, { waitUntil: 'load' });
    loaded = true;
    const tLoad = Date.now() - t0;
    await page.mouse.move(300, 300); await page.mouse.wheel(0, 2500); await page.waitForTimeout(2500); await page.mouse.wheel(0, 2500); await page.waitForTimeout(2500);
    const st = await page.evaluate(() => ({ cls: document.documentElement.className, dec: window.__dec, near: [...document.querySelectorAll('.film-shot.is-title')].map((e, i) => e.classList.contains('is-near') ? i : -1).filter((i) => i >= 0).join(',') }));
    console.log(JSON.stringify({ strom: name, q, tLoad, predLoad: reqs.filter((r) => r.startsWith('pred:')).map((r) => r.slice(5)), poLoad: reqs.filter((r) => r.startsWith('po:')).length, ...st }));
    await ctx.close(); srv.server.close();
  }
}
await browser.close();
