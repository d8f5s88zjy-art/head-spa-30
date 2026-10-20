import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true, args: ['--disable-gpu', '--disable-3d-apis'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', (m) => console.log('console', m.type(), m.text()));
await p.goto('http://127.0.0.1:8312/barbershop-30/index.html?film=on', { waitUntil: 'load' });
await p.waitForTimeout(1500);
const r = await p.evaluate(async () => {
  const c = document.documentElement.className;
  window.scrollTo({ top: document.documentElement.scrollHeight - innerHeight - 100, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 800));
  const img = document.querySelector('#rezervacia .film-still img');
  return { c, c2: document.documentElement.className, motion: document.documentElement.dataset.motion, sp: img.style.getPropertyValue('--sp'), tr: getComputedStyle(img).transform, gl2: 'WebGL2RenderingContext' in window };
});
console.log(JSON.stringify(r));
await b.close();
