#!/usr/bin/env node
// Ikony na plochu telefónu (assets/manifest.webmanifest, apple-touch-icon): rovnaký motív ako favicon (30 písmom
// Fraunces na atramente, oranžová linka), vykreslené písmom webu v prehliadači. Plocha cez celý štvorec (telefón
// si rohy zaoblí sám), maskovateľná ikona má motív v bezpečnej zóne (80 % stredu).
//   node source/tools/ikony.mjs
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const OUT = path.join(SITE, 'assets', 'img', 'ikona');
fs.mkdirSync(OUT, { recursive: true });
const font = (f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(SITE, 'assets', 'fonts', f)).toString('base64')})`;
const IKONY = [
  ['apple-touch-icon.png', 180, 1], ['ikona-192.png', 192, 1], ['ikona-512.png', 512, 1], ['ikona-maskovatelna-512.png', 512, 0.72],
];
const b = await chromium.launch();
for (const [meno, px, k] of IKONY) {
  const p = await b.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><style>
    @font-face { font-family: F; font-weight: 800; src: ${font('Fraunces-800.woff2')} format("woff2"); }
    html, body { margin: 0; width: ${px}px; height: ${px}px; background: #0E0D0C; }
    .m { position: absolute; inset: 0; display: grid; place-items: center; transform: scale(${k}); }
    .t { font: 800 ${px * 0.53}px/1 F; color: #F1E9DD; letter-spacing: -0.02em; transform: translateY(-${px * 0.03}px); }
    .l { position: absolute; left: 50%; top: ${px * 0.765}px; width: ${px * 0.375}px; height: ${px * 0.047}px; margin-left: -${px * 0.1875}px; border-radius: ${px * 0.0235}px; background: #E0601C; }
  </style><div class="m"><span class="t">30</span><i class="l"></i></div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(OUT, meno) });
  await p.close();
  console.log(meno, px);
}
await b.close();
