// Zápis na kotvu (dedí sa do celej kotvy) vs. priamo na prvok, ktorý hodnotu číta (img, .title-frame, .film-still).
// telefón 390×844 @3, CPU 4×, ?uvod=off&film=off (pokojná verzia), záber #remeslo; ms na zápis + vynútený prepočet.
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const cpu = Number(opt.cpu || 4), N = 80;
const browser = await launch();
const out = [];
const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
await page.goto(BASE + '?uvod=off&film=off', { waitUntil: 'load' });
await sleep(4500);
await page.evaluate(() => { const s = document.querySelector('#remeslo .film-shot'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY + 40, behavior: 'instant' }); });
await sleep(800);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
for (let rep = 0; rep < 4; rep++) {
  const r = await page.evaluate((N) => {
    const shot = document.querySelector('#remeslo .film-shot'), img = shot.querySelector('.film-still img'), fr = shot.querySelector('.title-frame'), still = shot.querySelector('.film-still');
    const run = (fn) => { let s = 0; for (let i = 0; i < N; i++) { const v = ((i % 20) / 20 + 0.01); fn(v); const t = performance.now(); void document.body.offsetTop; s += performance.now() - t; } return +(s / N).toFixed(3); };
    const res = {
      'sp na kotvu (dnes)': run((v) => shot.style.setProperty('--sp', v.toFixed(4))),
      'sp na img': run((v) => img.style.setProperty('--sp', v.toFixed(4))),
      'transform na img': run((v) => { img.style.transform = `scale(${(1 + 0.06 * v).toFixed(4)})`; }),
      'o na kotvu (dnes)': run((v) => shot.style.setProperty('--o', v.toFixed(4))),
      'o na .title-frame': run((v) => fr.style.setProperty('--o', v.toFixed(4))),
      'opacity na .title-frame': run((v) => { fr.style.opacity = v.toFixed(4); }),
      'so na kotvu (dnes)': run((v) => shot.style.setProperty('--so', v.toFixed(4))),
      'opacity na .film-still': run((v) => { still.style.opacity = v.toFixed(4); }),
    };
    img.style.transform = ''; fr.style.opacity = ''; still.style.opacity = ''; img.style.removeProperty('--sp'); fr.style.removeProperty('--o');
    return res;
  }, N);
  out.push(r);
}
await ctx.close(); await browser.close();
const keys = Object.keys(out[0]);
console.log(`CPU ${cpu}×, ms na jeden zápis + vynútený prepočet (priemer ${N} zápisov), 4 opakovania, medián:`);
console.table(keys.map((k) => { const v = out.map((o) => o[k]).sort((a, b) => a - b); return { zapis: k, median: +((v[1] + v[2]) / 2).toFixed(3), min: v[0], max: v[3] }; }));
