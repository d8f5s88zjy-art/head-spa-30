import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const port of process.argv.slice(2)) { const ctx = await browser.newContext({ viewport: { width: 600, height: 900 } }); const page = await ctx.newPage(); const req = []; page.on('request', (r) => req.push(r.url()));
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/`, { waitUntil: 'load' }); await page.waitForTimeout(3000);
  console.log(port, req.filter((u) => /three|film\.js|film-worker|\/seq\/|hlbka/.test(u)).map((u) => u.split('/barbershop-30/')[1])); await ctx.close(); }
await browser.close();
