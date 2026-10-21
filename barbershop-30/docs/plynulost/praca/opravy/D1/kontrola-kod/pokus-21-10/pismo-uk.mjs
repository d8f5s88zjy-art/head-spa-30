// K02: písmo, ktorým sa kreslí „Українська“ v ponuke jazykov (telefón: menu, počítač: ponuka), a počet sťahovaní cyrilických rezov
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const port = opt.port || 8400;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
async function pismo(page, ctx, sel) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
  if (!nodeId) return 'nenájdené';
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  await cdp.detach();
  return fonts.map((f) => `${f.familyName}${f.isCustomFont ? '(vlastné)' : '(systém)'}×${f.glyphCount}`).join(', ');
}
for (const zar of ['tel', 'pc']) {
  const ctx = await browser.newContext(zar === 'tel' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' } : { viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  const req = []; page.on('request', (r) => { if (/Manrope-cyr/.test(r.url())) req.push(r.url().split('/').pop()); });
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__renderDone !== false);
  await page.waitForTimeout(600);
  if (zar === 'tel') { await page.tap('.nav-toggle'); } else { await page.mouse.move(700, 300); await page.waitForSelector('.lang-btn', { state: 'attached', timeout: 12000 }); await page.click('.lang-btn'); }
  await page.waitForSelector('.lang-opt', { state: 'visible', timeout: 12000 });
  await page.waitForTimeout(1200);
  const uk = await pismo(page, ctx, '.lang-opt[data-lang-pick="uk"] span');
  console.log(zar, 'port', port, '| Українська v ponuke:', uk, '| požiadavky Manrope-cyr:', JSON.stringify(req));
  await ctx.close();
}
// ?lang=uk: počet požiadaviek na cyrilické rezy
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const req = []; page.on('requestfinished', async (r) => { if (/Manrope-cyr/.test(r.url())) { const resp = await r.response(); req.push({ f: r.url().split('/').pop(), fromCache: resp ? resp.fromServiceWorker() : null }); } });
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off&lang=uk`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  console.log('?lang=uk požiadavky na cyr. rezy:', JSON.stringify(req));
  await ctx.close();
}
await browser.close();
