// Overenie K01 (navrhovaná oprava): @property --o/--so s initial-value 0 a inherits:false. Úvod má data-pro,
// jeho karta číta opacity: var(--o, 1) (style.css:998) a záloha opacity: var(--so, 1) (style.css:1101).
// Pri registrovanej vlastnosti sa záloha vo var() nepoužije, takže pred spustením app.js (a bez JS) bude
// úvod priehľadný. Meria sa stav pred app.js (app.js zdržaný o 3 s) a bez JavaScriptu, základ vs. zaplata.
//   node over-property.mjs  → snimky/property-*.jpg + výpis
import fs from 'fs';
import { launch, PHONE, BASE, sleep } from './spolocne.mjs';
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/pred-D1/barbershop-30/assets/';
const PROP = {
  zaklad: '',
  // návrh auditu K01: všetko initial-value 0
  premenne: "\n@property --sp { syntax: '<number>'; inherits: false; initial-value: 0; }\n@property --o { syntax: '<number>'; inherits: false; initial-value: 0; }\n@property --so { syntax: '<number>'; inherits: false; initial-value: 0; }\n",
  // opravený návrh: --o a --so začínajú na 1, skryté karty a zálohy dostanú 0 deklaráciou
  premenne2: "\n@property --sp { syntax: '<number>'; inherits: false; initial-value: 0; }\n@property --o { syntax: '<number>'; inherits: false; initial-value: 1; }\n@property --so { syntax: '<number>'; inherits: false; initial-value: 1; }\nhtml.karty .film-shot.is-title:not([data-pro]) .title-frame { --o: 0; }\nhtml.karty .film-shot.is-title:not([data-pro]) .film-still { --so: 0; }\n",
};
const browser = await launch();
const out = [];
for (const variant of ['zaklad', 'premenne', 'premenne2']) {
  for (const js of [true, false]) {
    const ctx = await browser.newContext({ ...PHONE, javaScriptEnabled: js });
    const page = await ctx.newPage();
    await page.route('**/assets/app.js', async (route) => { await sleep(3000); route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'app.js', 'utf8') }); });
    await page.route('**/assets/style.css', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(ROOT + 'style.css', 'utf8') + PROP[variant] }));
    await page.goto(BASE + '?uvod=off', { waitUntil: 'commit' });
    await sleep(2000); // HTML, CSS a obrázok úvodu sú načítané, app.js ešte nebeží (pri JS)
    const st = await page.evaluate(() => {
      const s = document.querySelector('.film-shot');
      const fr = s.querySelector('.title-frame'), still = s.querySelector('.film-still'), img = still && still.querySelector('img');
      const cs = (e) => (e ? getComputedStyle(e) : null);
      return {
        html: document.documentElement.className, appJs: !!window.__renderDone,
        uvod_titulok_opacity: cs(fr).opacity, uvod_zaloha_opacity: still ? cs(still).opacity : '-', uvod_zaloha_visibility: still ? cs(still).visibility : '-',
        obrazok_nacitany: img ? img.complete && img.naturalWidth > 0 : '-',
        ostatne_karty_opacity: [...document.querySelectorAll('.film-shot.is-title .title-frame')].slice(1, 5).map((f) => getComputedStyle(f).opacity).join(','),
      };
    });
    const name = `property-${variant}-${js ? 'pred-appjs' : 'bez-js'}`;
    await page.screenshot({ path: new URL(`./snimky/${name}.jpg`, import.meta.url).pathname, type: 'jpeg', quality: 55 });
    // priemerný jas okna (0–255) z PNG cez canvas v stránke nie je k dispozícii pri vypnutom JS – meria sa mimo (python)
    out.push({ variant, js: js ? 'JS, pred app.js' : 'bez JS', ...st });
    await ctx.close();
  }
}
await browser.close();
console.table(out);
