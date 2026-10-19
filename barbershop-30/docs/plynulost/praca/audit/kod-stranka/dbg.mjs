import { opt, BASE, launch, open, swipe, sleep } from './spolocne.mjs';
const browser = await launch();
const { page, cdp } = await open(browser, { cpu: 1, net: 'fast4g' });
await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
await sleep(3000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const H = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
console.log('H', H, await page.evaluate(() => document.documentElement.className));
for (let i = 0; i < 5; i++) { const t = Date.now(); await swipe(cdp, { dy: 600, speed: 1300 }); console.log(i, Date.now() - t, await page.evaluate(() => scrollY)); }
await browser.close();
