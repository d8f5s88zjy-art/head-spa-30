// navod-pdf.cjs <html> <pdf>: PDF návodu z HTML (Chromium cez Playwright; veľkosť strany berie z CSS @page).
// Volá ho nasadenie/balik-forpsi.sh; ručne: NODE_PATH=$(npm root -g) node nasadenie/navod-pdf.cjs <html> <pdf>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [h, o] = process.argv.slice(2);
  if (!h || !o) { console.error('použitie: navod-pdf.cjs <html> <pdf>'); process.exit(2); }
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(h), { waitUntil: 'load' });
  await p.pdf({ path: o, printBackground: true, preferCSSPageSize: true });
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
