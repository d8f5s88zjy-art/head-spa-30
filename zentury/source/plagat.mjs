// Vyrenderuje plagát 3D kladivka do assets/img/kladivko-{1200,800}.webp.
// Potrebuje bežiaci statický server nad koreňom repozitára: PORT=8761 node source/plagat.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
const req = createRequire(process.env.PW_DIR || '/opt/node22/lib/node_modules/');
const { chromium } = req('playwright');
const port = process.env.PORT || 8761;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1200, height: 1000 } });
await p.goto(`http://localhost:${port}/zentury/source/plagat.html`);
await p.waitForFunction(() => window.PNG, null, { timeout: 60000 });
const png = Buffer.from((await p.evaluate(() => window.PNG)).split(',')[1], 'base64');
await b.close();
const tmp = new URL('../source/.plagat.png', import.meta.url).pathname;
writeFileSync(tmp, png);
execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('${tmp}').convert('RGBA')
for w in (1200,800):
    r=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
    r.save('${new URL('../assets/img/', import.meta.url).pathname}kladivko-%d.webp'%w,quality=82,method=6)
`]);
console.log('hotovo');
