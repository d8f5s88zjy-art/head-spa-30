// Snímka stránky na telefóne (dôkaz).
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })).newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
await p.screenshot({ path: out, type: 'jpeg', quality: 70 });
await b.close();
