// Ktoré písmo prehliadač naozaj použije na tlačidlo a nadpisok (CSS.getPlatformFontsForNode) pred načítaním i18n.css a po ňom.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const [strom, port] of [['pred', 8310], ['po', 8312]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto(`http://127.0.0.1:${port}/barbershop-30/?film=off&uvod=off&hudba=off`, { waitUntil: 'load' });
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const fonty = async () => {
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const out = {};
    for (const [nm, sel] of [['tlačidlo', '#uvod .title-actions .btn-primary'], ['nadpisok', '#vstup-dnu .kicker'], ['text', '#uvod .title-sub']]) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
      const { nodes } = await cdp.send('DOM.describeNode', { nodeId, depth: 1 }).then(() => cdp.send('DOM.requestChildNodes', { nodeId })).then(() => ({ nodes: [] })).catch(() => ({ nodes: [] }));
      const r = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }).catch((e) => ({ fonts: [{ familyName: 'chyba ' + e.message }] }));
      out[nm] = r.fonts.map((f) => `${f.familyName}${f.isCustomFont ? '' : ' (systém)'} ×${f.glyphCount}`).join(', ');
    }
    return out;
  };
  console.log(strom, 'po načítaní', JSON.stringify(await fonty()));
  await p.waitForTimeout(6000);   // i18n.js + i18n.css (3,5 s po load)
  const css = await p.evaluate(() => [...document.styleSheets].map((s) => (s.href || 'inline').split('/').pop()));
  console.log(strom, 'po 6 s', JSON.stringify(await fonty()), css.join(','));
  await ctx.close();
}
await b.close();
