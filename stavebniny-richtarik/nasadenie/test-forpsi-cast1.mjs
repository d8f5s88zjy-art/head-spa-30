// Samotná časť 1 balíka pre Forpsi v prehliadači: po nahratí prvej časti musí byť úvod úplný (žiadna odpoveď 404) a na
// ostatných stránkach smú chýbať len obrázky a PDF z ďalších častí – nikdy stránka, štýl, skript, písmo ani údaje hľadania.
//   node nasadenie/test-forpsi-cast1.mjs <http://127.0.0.1:port/> [priečinok snímok]
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire((process.env.NODE_PATH || execSync('npm root -g').toString().trim()) + '/');
const { chromium } = require('playwright');
const [base, snimky] = process.argv.slice(2);
const STRANKY = ['index.html', 'kontakt.html', 'o-nas.html', 'sluzby.html', 'doprava.html', 'caste-otazky.html', 'letak.html', 'akcie/index.html',
  'katalog/index.html', 'galeria/index.html', 'novinky/index.html', '404.html'];
let ok = 0, zle = 0;
const t = (n, p, d = '') => { if (p) { ok++; console.log('  ok  ', n); } else { zle++; console.log('  ZLE ', n, d); } };
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'sk-SK' });
  for (const s of STRANKY) {
    const p = await ctx.newPage(); const chyba = [], neskor = [], js = [];
    p.on('response', r => { if (r.status() >= 400) { const u = new URL(r.url()).pathname; (/^\/(img|pdf|subory)\//.test(u) ? neskor : chyba).push(r.status() + ' ' + u); } });
    p.on('pageerror', e => js.push(String(e)));
    const r = await p.goto(base + s, { waitUntil: 'load' });
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(f => setTimeout(f, 60)); } });
    await p.waitForTimeout(400);
    if (s === 'index.html') {
      t(`${w} px úvod: žiadna odpoveď 404 (ani obrázok)`, chyba.length + neskor.length === 0, [...chyba, ...neskor].slice(0, 5).join(' | '));
      const nenac = await p.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.currentSrc).map(i => i.currentSrc).slice(0, 5));
      t(`${w} px úvod: všetky obrázky sa načítali`, nenac.length === 0, nenac.join(' | '));
      if (snimky) await p.screenshot({ path: `${snimky}/cast1-uvod-${w}.png` });
    } else t(`${w} px ${s}: stránka ${r.status()}, štýly, skripty a písma bez 404 (obrázkov a PDF z ďalších častí chýba ${neskor.length})`, r.status() === 200 && chyba.length === 0, chyba.slice(0, 5).join(' | '));
    t(`${w} px ${s}: bez chyby skriptu`, js.length === 0, js.slice(0, 2).join(' | '));
    await p.close();
  }
  const p = await ctx.newPage();
  const j = await p.request.get(base + 'assets/index.json');
  t(`${w} px údaje hľadania assets/index.json sa načítajú`, j.status() === 200 && (await j.text()).includes('cement'));
  await ctx.close();
}
await b.close();
console.log(`Spolu: ${ok} v poriadku, ${zle} zlých`);
process.exit(zle ? 1 : 0);
