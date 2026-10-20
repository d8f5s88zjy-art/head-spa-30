// CO-7: kde je pätička a pás nad ňou; koľko plochy okna je mimo pásov (miesto zálohy) vo chvíli, keď footerIn
// (app.js:188, y + vh > footer.top) vypne všetky zálohy. Ak je pás nad pätičkou vyšší ako okno, nevidno nič.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
const cases = [[390, 844, 3, true], [360, 740, 3, true], [412, 915, 2.6, true], [1440, 900, 1, false], [1280, 720, 1, false], [1920, 1080, 1, false]];
for (const lang of ['', 'en']) for (const [w, h, dpr, mob] of cases) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:8310/barbershop-30/?film=off${lang ? '&lang=' + lang : ''}`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const f = document.querySelector('.site-footer'), y0 = scrollY;
    const ft = f.getBoundingClientRect().top + y0, vh = innerHeight;
    const bands = [...document.querySelectorAll('.band')].map((x) => { const q = x.getBoundingClientRect(); return [Math.round(q.top + y0), Math.round(q.bottom + y0)]; });
    const above = bands.filter((b) => b[1] <= ft + 1).pop();
    const yOn = ft - vh;                      // prvá poloha, kde footerIn = true
    const free = Math.max(0, above[0] - yOn); // px okna nad pásom (miesto zálohy), keď sa zálohy vypnú
    // skutočný stav pri yOn + 1
    scrollTo({ top: yOn + 1, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 400));
    const so = [...document.querySelectorAll('.film-shot.is-title')].map((e) => e.style.getPropertyValue('--so'));
    return { footerTop: Math.round(ft), vh, pasNad: above, volneNadPasom_px: Math.round(free), podiel: +(free / vh).toFixed(2), soPriVypnuti: so.filter((x) => +x > 0).length };
  });
  console.log(lang || 'sk', `${w}x${h}`, JSON.stringify(r));
  await ctx.close();
}
await b.close();
