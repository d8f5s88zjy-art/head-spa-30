// Variant B 1:1 – fotka ako štvorec cez šírku (cover okolo bodu záujmu), zvyšok ako B; len na ukážku majiteľovi
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const p = await c.newPage(); p.setDefaultTimeout(120000);
const CSS = `html.lite .film-shot.is-title .film-still > img { height: 100vw !important; object-fit: cover !important; object-position: var(--fx, 50%) var(--fy, 50%) !important;
  top: calc(var(--nav-h) + 8px) !important; }`;
for (const shot of ['cakaren', 'sala', 'stol']) {
  await p.goto(url + '?foto=B', { waitUntil: 'load' }); await p.addStyleTag({ content: CSS }); await p.waitForTimeout(1500);
  await p.evaluate((s) => { const k = document.querySelector(`.film-shot[data-shot="${s}"]`); window.scrollTo(0, k.getBoundingClientRect().top + scrollY + innerHeight * 0.35); }, shot);
  await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/B11-${shot}.png` });
}
await b.close();
