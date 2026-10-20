// Fixná réžia jedného prepočtu štýlu na tejto stránke: zápis premennej na prázdny prvok bez potomkov
// (nič ju nečíta) vs. na kotvu záberu vs. na <html>; to isté na prázdnej stránke pre porovnanie.
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const cpu = Number(opt.cpu || 4), N = 80;
const browser = await launch();
const out = [];
for (const url of [BASE + '?uvod=off&film=off', 'about:blank']) {
  const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
  await page.goto(url, { waitUntil: 'load' });
  if (url !== 'about:blank') { await sleep(4500); await page.evaluate(() => { const s = document.querySelector('#remeslo .film-shot'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY + 40, behavior: 'instant' }); }); await sleep(800); }
  else await page.setContent('<div id="d"></div><div class="film-shot"><p>x</p></div>');
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  for (let rep = 0; rep < 3; rep++) {
    const r = await page.evaluate((N) => {
      const d = document.createElement('div'); document.body.append(d);
      const shot = document.querySelector('#remeslo .film-shot') || document.querySelector('.film-shot');
      const run = (el, v) => { let s = 0; for (let i = 0; i < N; i++) { el.style.setProperty(v, ((i % 20) / 20 + 0.01).toFixed(4)); const t = performance.now(); void document.body.offsetTop; s += performance.now() - t; } return +(s / N).toFixed(3); };
      const nic = (() => { let s = 0; for (let i = 0; i < N; i++) { const t = performance.now(); void document.body.offsetTop; s += performance.now() - t; } return +(s / N).toFixed(3); })();
      return { prvkov: document.getElementsByTagName('*').length, bez_zapisu: nic, prazdny_div: run(d, '--x'), kotva_sp: run(shot, '--sp'), html_x: run(document.documentElement, '--x') };
    }, N);
    out.push({ url: url.replace(BASE, ''), rep, ...r });
  }
  await ctx.close();
}
await browser.close();
console.log(`CPU ${cpu}×, ms na zápis + vynútený prepočet (priemer z ${N})`);
console.table(out);
