import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const exe = process.argv[2] || undefined;
const b = await chromium.launch({ executablePath: exe, proxy: { server: process.env.HTTPS_PROXY }, args: ['--ignore-certificate-errors-spki-list=' + process.env.SPKI] });
const p = await b.newPage();
for (const u of ['https://example.com/', 'https://www.barbershop30.sk/']) {
  try { const r = await p.goto(u, { timeout: 30000 }); console.log(u, r.status(), await p.title()); } catch (e) { console.log(u, String(e).split('\n')[0]); }
}
await b.close();
