// Koľko stojí jeden zápis premennej z app.js (--sp, --o, --so) na kotvu záberu: prepočet štýlu a rozloženia
// po zápise (CDP Performance.getMetrics: RecalcStyleDuration, LayoutDuration), N zápisov, telefón 390×844 @3, CPU 4×.
// Varianty vypínajú podozrivé časti CSS, aby sa ukázalo, ktorá z nich je drahá.
//   node cena-stylu.mjs [--q=uvod=off] [--cpu=4] [--n=60]
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const cpu = Number(opt.cpu || 4), N = Number(opt.n || 60);
const VARIANTY = {
  zaklad: '',
  'bez-ramovania-world': 'html.world:not(.world-off) .film-still img, html.world-frame .film-still img { position: static !important; width: 100% !important; height: 100% !important; left: auto !important; top: auto !important; --pw: 0px !important; --ph: 0px !important; --mx: 0px !important; --my: 0px !important; --ex: 0px !important; --ey: 0px !important; --k: 1 !important; }',
  'bez-text-shadow': '.kicker, .title, .title-sub, .title-frame * { text-shadow: none !important; }',
  'bez-kin-prechodov': '.js-kin .kin .kw { transition: none !important; filter: none !important; }',
  'bez-will-change': '.film-still img { will-change: auto !important; }',
  'bez-text-wrap-balance': 'h1, h2, h3, .title-sub, .title { text-wrap: wrap !important; }',
};
const browser = await launch();
const rows = [];
for (const q of (opt.q ? [opt.q] : ['uvod=off', 'uvod=off&film=off'])) {
  for (const [meno, css] of Object.entries(VARIANTY)) {
    const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
    await page.goto(BASE + '?' + q, { waitUntil: 'load' });
    await sleep(4500);
    // na záber Remeslo (tretia karta): je aktuálny, záloha zobrazená
    await page.evaluate(() => { const s = document.querySelector('#remeslo .film-shot'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY + 40, behavior: 'instant' }); });
    await sleep(800);
    if (css) await page.addStyleTag({ content: css });
    await sleep(300);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    const res = {};
    for (const v of ['--sp', '--o', '--so']) {
      const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
      const info = await page.evaluate(({ v, N }) => {
        const el = document.querySelector('#remeslo .film-shot');
        let sum = 0;
        for (let i = 0; i < N; i++) { el.style.setProperty(v, ((i % 20) / 20 + 0.01).toFixed(4)); const t = performance.now(); void document.body.offsetTop; sum += performance.now() - t; }
        return { ms: sum / N, sub: el.getElementsByTagName('*').length + 1, cls: document.documentElement.className };
      }, { v, N });
      const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
      res[v] = { spolu_ms: +info.ms.toFixed(2), styl_ms: +(((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000) / N).toFixed(2), layout_ms: +(((m1.LayoutDuration - m0.LayoutDuration) * 1000) / N).toFixed(2), prvkov_v_kotve: info.sub };
      res.cls = info.cls;
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    rows.push({ q, variant: meno, ...Object.fromEntries(['--sp', '--o', '--so'].map((v) => [v, `${res[v].spolu_ms} (štýl ${res[v].styl_ms}, layout ${res[v].layout_ms})`])), prvkov: res['--sp'].prvkov_v_kotve, html: res.cls });
    await ctx.close();
  }
}
await browser.close();
console.log(`telefón 390×844 @3, CPU ${cpu}×, ${N} zápisov na kotvu #remeslo .film-shot, ms na jeden zápis + vynútený prepočet`);
console.table(rows);
