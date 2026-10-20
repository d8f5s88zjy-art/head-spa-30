// Kontrola, že pokusná úprava (zaplaty.mjs) kreslí to isté: snímky na tých istých polohách so zaplátou a bez nej
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
import { patch } from './zaplaty.mjs';
const browser = await launch();
for (const p of ['', 'premenne']) {
  const { page, ctx } = await open(browser, { cpu: 1, net: 'none' });
  if (p) await patch(page, [p]);
  await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
  await sleep(3000);
  for (const f of [0.03, 0.12, 0.2, 0.45]) {
    await page.evaluate((f) => window.scrollTo({ top: Math.round(f * (document.scrollingElement.scrollHeight - innerHeight)), behavior: 'instant' }), f);
    await sleep(1500);
    await page.screenshot({ path: `snimky/zaplata-${p || 'zaklad'}-${f}.jpg`, type: 'jpeg', quality: 60, scale: 'css' });
  }
  await ctx.close();
}
await browser.close();
