// ?lang=en (uložený iný jazyk) na telefóne: do kedy je nadpis úvodu skrytý triedou t-wait (index.html hlavička, style.css:104)
import { BASE, launch, sleep, NET } from './spolocne.mjs';
const browser = await launch();
for (const net of ['fast4g', 'slow4g']) for (let i = 0; i < 2; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', NET[net]); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(BASE + '?uvod=off&lang=en', { waitUntil: 'commit' });
  const r = await page.evaluate(() => new Promise((res) => { let seen = 0; const f = () => { const on = document.documentElement.classList.contains('t-wait'); if (on) seen = 1; if (seen && !on) return res({ do: Math.round(performance.now()), fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0) }); if (performance.now() > 12000) return res({ do: -1 }); setTimeout(f, 20); }; f(); }));
  console.log(`?lang=en ${net} beh ${i + 1}: FCP ${r.fcp} ms, nadpis úvodu skrytý do ${r.do} ms (${r.do - r.fcp} ms po prvom obraze)`);
  await ctx.close();
}
await browser.close();
