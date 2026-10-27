// Kurzor v tvare nožníc: tri stavy (pootvorené, otvorené nad odkazom, zatvorené pri kliknutí),
// SVG + PNG 32 a 64 px (1x a 2x). Hrot je vľavo hore v bode (2, 2) pri 32 px = horúci bod kurzora (CSS `2 2`).
// Farby z výtvarného smeru: čepele teplá biela --paper, krúžky oranžová lampa --lamp, tmavý obrys --ink
// (kurzor je viditeľný na tmavom aj svetlom podklade).
// PLAYWRIGHT_MODULE=/cesta/k/playwright/index.mjs PLAYWRIGHT_CHROMIUM=/cesta/k/chrome node source/tools/kurzor.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'img', 'kurzor');
mkdirSync(OUT, { recursive: true });
const INK = '#0e0d0c', PAPER = '#f1e9dd', LAMP = '#e0601c';

// jedna polovica nožníc v miestnom systéme: čap v (0,0), hrot smerom -x; dolná polovica je zrkadlo (s = -1)
const half = (s, ang) => `
  <g transform="rotate(${s * ang})">
    <path d="M2.4 ${-3.6 * s} L-30 ${-1.3 * s} Q-32.2 0 -30 ${0.6 * s} L1 ${3 * s} Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"/>
    <path d="M-27 ${-0.6 * s} L-2 ${-1.6 * s}" stroke="#ffffff" stroke-opacity=".55" stroke-width="0.9" stroke-linecap="round"/>
    <path d="M0 0 L10.4 ${5.6 * s}" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M0 0 L10.4 ${5.6 * s}" stroke="${PAPER}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="15.5" cy="${8.6 * s}" r="5.2" fill="none" stroke="${INK}" stroke-width="5.4"/>
    <circle cx="15.5" cy="${8.6 * s}" r="5.2" fill="none" stroke="${LAMP}" stroke-width="2.6"/>
  </g>`;

const svg = (ang) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs><filter id="t" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0.6" dy="1.2" stdDeviation="1.1" flood-color="#000" flood-opacity=".45"/></filter></defs>
  <g filter="url(#t)" transform="translate(29.5 29.5) rotate(45) scale(1.12)">
    ${half(-1, ang)}
    ${half(1, ang)}
    <circle r="2.3" fill="${INK}"/><circle r="1" fill="${LAMP}"/>
  </g>
</svg>`;

const STATES = { noznice: 9, 'noznice-otvorene': 16, 'noznice-zatvorene': 1.5 };
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, ang] of Object.entries(STATES)) {
  const s = svg(ang);
  writeFileSync(join(OUT, `${name}.svg`), s);
  for (const px of [32, 64]) {
    await page.setViewportSize({ width: px, height: px });
    await page.setContent(`<html><body style="margin:0;background:transparent">${s.replace('width="64" height="64"', `width="${px}" height="${px}"`)}</body></html>`);
    await page.screenshot({ path: join(OUT, `${name}-${px}.png`), omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
  }
}
await browser.close();
console.log('kurzory v', OUT);
