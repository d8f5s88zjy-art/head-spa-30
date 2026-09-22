/* Darčekové poukážky HEAD SPA 30 vo formáte DL (210 × 99 mm, so spadávkou 216 × 105 mm).
   Päť líc podľa kategórie rituálu a spoločný rub. Spustenie: node build.mjs
   Výstup: png/ (2592 × 1260 px, 305 dpi), pdf/ (jednotlivé aj spoločný súbor). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright/index.js');
const ROOT = path.dirname(new URL(import.meta.url).pathname);

const mark = `<svg class="mark" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="none" stroke="#d9b56a" stroke-width="1.5"/><path d="M14 40c6-9 12-9 18 0s12 9 18 0" fill="none" stroke="#8cc3b6" stroke-width="1.6" stroke-linecap="round"/><text x="32" y="30" text-anchor="middle" font-family="Lora,Georgia,serif" font-size="19" fill="#f2ede2">30</text></svg>`;

// mašľa: dve slučky, uzol a dva konce stuhy, zlatý prechod
const bow = `<svg class="bow" viewBox="0 0 150 150" fill="none">
  <defs>
    <linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5dc9b"/><stop offset=".5" stop-color="#d9b56a"/><stop offset="1" stop-color="#8d6c2e"/></linearGradient>
    <linearGradient id="gb2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c97c"/><stop offset="1" stop-color="#7f5f26"/></linearGradient>
  </defs>
  <!-- stuha pozdĺž horného a ľavého okraja -->
  <path d="M0 22 H190 V44 H0 Z" fill="url(#gb)"/>
  <path d="M22 0 V190 H44 V0 Z" fill="url(#gb2)"/>
  <path d="M0 42 H190 V44 H0 Z" fill="#6f531f" opacity=".5"/>
  <path d="M42 0 V190 H44 V0 Z" fill="#6f531f" opacity=".5"/>
  <!-- mašľa v rohu: dve slučky, dva konce, uzol -->
  <path d="M33 33 C18 6 62 -2 60 22 C59 34 44 36 33 33Z" fill="url(#gb)" stroke="#6f531f" stroke-width=".8"/>
  <path d="M33 33 C6 18 -2 62 22 60 C34 59 36 44 33 33Z" fill="url(#gb2)" stroke="#6f531f" stroke-width=".8"/>
  <path d="M33 33 L64 50 L58 60 L30 42 Z" fill="url(#gb)" stroke="#6f531f" stroke-width=".6"/>
  <path d="M33 33 L50 64 L60 58 L42 30 Z" fill="url(#gb2)" stroke="#6f531f" stroke-width=".6"/>
  <circle cx="33" cy="33" r="7.5" fill="url(#gb)" stroke="#6f531f" stroke-width="1"/>
</svg>`;

const seal = `<div class="seal"><svg viewBox="0 0 118 118"><defs><path id="c" d="M59 59 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs><circle cx="59" cy="59" r="50" fill="none" stroke="#2a2110" stroke-opacity=".45" stroke-width=".8"/><text font-family="Manrope,sans-serif" font-weight="700" font-size="8.2" letter-spacing="2.6" fill="#2a2110"><textPath href="#c" startOffset="2%">PRE KRAJŠÍ DEŇ · HEAD SPA 30 · PRE TEBA ·</textPath></text></svg><div class="num">30<small>Salón 30</small></div></div>`;

const VARIANTY = [
  { id: 'head-spa', foto: 'foto/head-spa.jpg', pos: '50% 45%', rule: 'Head Spa 30', cat: 'Relax · Obnova · Harmónia',
    lede: 'Dopraj sebe alebo svojim blízkym chvíľu hlbokého relaxu a starostlivosti o pokožku hlavy.' },
  { id: 'pansky', foto: 'foto/pansky.jpg', pos: '55% 60%', rule: 'Gentlemen Head Spa', cat: 'Pokoj · Starostlivosť · Elegancia',
    lede: 'Rituály pripravené pre mužov: teplá voda, hĺbkové čistenie a masáž bez zhonu.' },
  { id: 'detsky', foto: 'foto/detsky.jpg', pos: '60% 40%', rule: 'Little Fruit Head Spa', cat: 'Hravo · Jemne · S úsmevom',
    lede: 'Hravý a jemný rituál pripravený pre deti: voňavo, pomaly a s úsmevom.' },
  { id: 'pre-dvoch', foto: 'foto/pre-dvoch.jpg', pos: '50% 35%', rule: 'Rituál pre dvoch', cat: 'Spolu · Teplo · Ticho',
    lede: 'Niektoré chvíle sú krajšie, keď ich prežívame spolu. Dva rituály vedľa seba.' },
  { id: 'chodidla', foto: 'foto/chodidla.jpg', pos: '50% 55%', rule: 'Rituál pre chodidlá', cat: 'Teplo · Vôňa · Dotyk',
    lede: 'Teplý kúpeľ, peeling, maska a masáž chodidiel pre pocit ľahkosti a pokoja.' },
];

const front = (v) => `<div class="card front" id="front-${v.id}">
  <div class="bg"></div><div class="grain"></div>
  <div class="frame"></div><div class="frame2"></div>
  <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
  <div class="photo" style="--pos:${v.pos}"><img src="${v.foto}" alt=""></div>
  ${seal}
  <div class="txt">
    <div class="brand">${mark}<div><b>Salón 30</b><small>Head Spa 30 · Nitra</small></div></div>
    <div class="kind"><span class="a">Darčeková</span><span class="b">poukážka</span></div>
    <div class="rule">${v.rule}</div>
    <div class="cat">${v.cat}</div>
    <p class="lede">${v.lede}</p>
  </div>
  <div class="fields">
    <div class="f">Rituál<span></span></div>
    <div class="f">Pre<span></span></div>
    <div class="f">Od<span></span></div>
    <div class="f">Platnosť do<span></span></div>
    <div class="f">Kód<span></span></div>
  </div>
  <div class="foot"><span>Mostná 30 · Nitra</span><span>0911 153 136</span><span>www.salon30.sk</span></div>
  ${bow}
</div>`;

const back = () => `<div class="card back" id="back">
  <div class="bg"></div><div class="grain"></div>
  <div class="frame"></div><div class="frame2"></div>
  <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
  <div class="txt">
    <div class="brand">${mark}<div><b>Salón 30</b><small>Head Spa 30 · Nitra</small></div></div>
    <h2>Ako poukážku využiť</h2>
    <ol>
      <li>Zavolaj na 0911 153 136 alebo si vyber termín v online kalendári.</li>
      <li>Pri rezervácii uveď kód poukážky a rituál, ktorý je na nej napísaný.</li>
      <li>Poukážku prines so sebou, v salóne ju odovzdáš pri rituále.</li>
    </ol>
    <p class="list">Poukážka platí 365 dní od dátumu vystavenia na rituál, ktorý je na nej uvedený. Nevymieňa sa za hotovosť. Termín odporúčame dohodnúť aspoň týždeň vopred.</p>
  </div>
  <div class="qr"><img src="qr-kalendar.png" alt="QR kód: online kalendár"></div>
  <div class="qrl"><b>Online kalendár</b>booqme.app/sk/rezervacia/barbershop-30</div>
  <div class="foot"><span>Mostná 30 · Nitra</span><span>0911 153 136</span><span>www.salon30.sk</span></div>
</div>`;

const tpl = fs.readFileSync(path.join(ROOT, 'poukaz.html'), 'utf8');
const cards = VARIANTY.map(front).join('\n') + '\n' + back();
fs.writeFileSync(path.join(ROOT, 'index.html'), tpl.replace('<!--CARDS-->', cards));

for (const d of ['png', 'pdf']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1080, height: 525 }, deviceScaleFactor: 2.4 });
const page = await ctx.newPage();
await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const ids = [...VARIANTY.map((v) => 'front-' + v.id), 'back'];
for (const id of ids) {
  const el = await page.$('#' + id);
  await el.screenshot({ path: path.join(ROOT, 'png', `poukaz-${id.replace('front-', '')}.png`), type: 'png' });
}
// PDF: jedna karta na stranu 216 × 105 mm (so spadávkou), pre tlačiareň
const pdfPage = await ctx.newPage();
const one = async (idsToPrint, file) => {
  const html = tpl.replace('<!--CARDS-->', idsToPrint.map((id) => id === 'back' ? back() : front(VARIANTY.find((v) => 'front-' + v.id === id))).join('\n'))
    .replace('html,body{background:#222}', 'html,body{background:#0b100d}@page{size:216mm 105mm;margin:0}.card{page-break-after:always;break-after:page;margin:0}');
  fs.writeFileSync(path.join(ROOT, '_print.html'), html);
  await pdfPage.goto('file://' + path.join(ROOT, '_print.html'), { waitUntil: 'load' });
  await pdfPage.evaluate(() => document.fonts.ready);
  await pdfPage.pdf({ path: path.join(ROOT, 'pdf', file), width: '216mm', height: '105mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, scale: 0.7556, preferCSSPageSize: true });
};
for (const v of VARIANTY) await one(['front-' + v.id, 'back'], `poukaz-${v.id}.pdf`);
await one([...VARIANTY.map((v) => 'front-' + v.id), 'back'], 'poukaz-vsetky.pdf');
fs.unlinkSync(path.join(ROOT, '_print.html'));
await browser.close();
console.log('hotovo:', ids.join(', '));
