/* Darčekové poukážky HEAD SPA 30 vo formáte DL (210 × 99 mm, so spadávkou 216 × 105 mm).
   Päť líc podľa kategórie rituálu a spoločný rub. Spustenie: node build.mjs
   Výstup: png/ (2592 × 1260 px, 305 dpi), pdf/ (jednotlivé aj spoločný súbor). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright/index.js');
const ROOT = path.dirname(new URL(import.meta.url).pathname);

// lotos zo značky: tri lístky, zlatý
const lotus = (cls = 'lotus') => `<svg class="${cls}" viewBox="0 0 64 50"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dc9f"/><stop offset=".6" stop-color="#d4ae62"/><stop offset="1" stop-color="#a8823f"/></linearGradient></defs><g fill="url(#lg)"><path d="M32 3c7 9 8 21 0 34c-8-13-7-25 0-34z"/><path d="M28.5 38c-10-2-17-10-18-21c9 1 16 8 18 21z"/><path d="M35.5 38c10-2 17-10 18-21c-9 1-16 8-18 21z"/></g></svg>`;

// oblúk zlatého kruhu okolo fotky: od vrchu cez ľavú stranu po spodok
const arc = (W, H, cx, cy, r) => {
  const p = (d) => { const t = d * Math.PI / 180; return `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`; };
  return `<svg class="arc" viewBox="0 0 ${W} ${H}" fill="none"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dc9f"/><stop offset=".5" stop-color="#d4ae62"/><stop offset="1" stop-color="#8f6d33"/></linearGradient></defs><path d="M${p(-112)} A${r} ${r} 0 0 0 ${p(98)}" stroke="url(#ga)" stroke-width="1.8"/></svg>`;
};

// zlatá olivová vetvička: stonka a lístky striedavo na oboch stranách
const branch = (() => {
  const P = [[8, 6], [70, 38], [118, 96], [182, 164]];
  const at = (t) => { const m = 1 - t; return [0, 1].map((k) => m * m * m * P[0][k] + 3 * m * m * t * P[1][k] + 3 * m * t * t * P[2][k] + t * t * t * P[3][k]); };
  const tan = (t) => { const a = at(Math.max(0, t - 0.01)), b = at(Math.min(1, t + 0.01)); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
  let leaves = '';
  for (let i = 0; i < 11; i++) {
    const t = 0.06 + i * 0.085, [x, y] = at(t), side = i % 2 ? 1 : -1, ang = tan(t) + side * 38 - 8, len = 30 - i * 0.9;
    leaves += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})"><path d="M0 0C${len * .3} ${-len * .2} ${len * .75} ${-len * .2} ${len} 0C${len * .75} ${len * .2} ${len * .3} ${len * .2} 0 0Z" fill="rgba(212,174,98,.16)"/><path d="M2 0L${len - 3} 0" stroke-width=".7" opacity=".7"/></g>`;
  }
  return `<svg class="branch" viewBox="0 0 190 170" fill="none" stroke="#d4ae62" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M${P[0]}C${P[1]} ${P[2]} ${P[3]}" stroke-width="1.5"/>${leaves}<path d="M${at(0.99)}l-3 6" /></svg>`;
})();

// pečať: zlatá minca, hore PRE KRAJŠÍ DEŇ, dole PRE TEBA, v strede lotos
const seal = (() => {
  const c = 62, p = (r, d) => { const t = d * Math.PI / 180; return `${(c + r * Math.cos(t)).toFixed(2)} ${(c + r * Math.sin(t)).toFixed(2)}`; };
  return `<div class="seal"><svg viewBox="0 0 124 124"><defs>
    <path id="st" d="M${p(43, 188)} A43 43 0 0 1 ${p(43, 352)}"/>
    <path id="sb" d="M${p(51, 162)} A51 51 0 0 0 ${p(51, 18)}"/></defs>
    <circle cx="62" cy="62" r="56.5" fill="none" stroke="#6b4f1f" stroke-opacity=".55" stroke-width="1"/>
    <circle cx="62" cy="62" r="31" fill="none" stroke="#6b4f1f" stroke-opacity=".5" stroke-width=".9"/>
    <circle cx="${p(44, 180).split(' ')[0]}" cy="62" r="1.6" fill="#5a4219"/><circle cx="${p(44, 0).split(' ')[0]}" cy="62" r="1.6" fill="#5a4219"/>
    <g font-family="Manrope,sans-serif" font-weight="700" font-size="9.2" letter-spacing="1.6" fill="#4d3914">
      <text text-anchor="middle"><textPath href="#st" startOffset="50%">PRE KRAJŠÍ DEŇ</textPath></text>
      <text text-anchor="middle"><textPath href="#sb" startOffset="50%">PRE TEBA</textPath></text></g>
    <g transform="translate(62 63) scale(.52) translate(-32 -22)" fill="none" stroke="#4d3914" stroke-width="2.4" stroke-linejoin="round"><path d="M32 3c7 9 8 21 0 34c-8-13-7-25 0-34z"/><path d="M28.5 38c-10-2-17-10-18-21c9 1 16 8 18 21z"/><path d="M35.5 38c10-2 17-10 18-21c-9 1-16 8-18 21z"/></g>
  </svg></div>`;
})();

// Prvé štyri Head Spa rituály (Classic, Relax, Harmony, Hĺbkový) majú spoločnú poukážku podľa vzoru
// majiteľa, ostatné rituály vlastnú s fotkou, ktorá ukazuje práve ten rituál.
const VARIANTY = [
  { id: 'head-spa', foto: 'foto/head-spa.jpg', pos: '50% 48%', rule: 'Head Spa', cat: 'Relax • Obnova • Harmónia',
    lede: 'Dopraj sebe alebo svojim blízkym chvíľu hlbokého relaxu a starostlivosti.' },
  { id: 'head-spa-beauty-ritual', foto: 'foto/head-spa-beauty-ritual.jpg', pos: '50% 30%', rule: 'Head Spa Beauty Ritual', cat: 'Head Spa rituály • 60 minút',
    lede: 'Head Spa a kozmetika v jednom rituáli, pre pokožku hlavy, tvár aj vlasy.' },
  { id: 'head-spa-fruit-fresh-ritual', foto: 'foto/head-spa-fruit-fresh-ritual.jpg', pos: '50% 55%', rule: 'Head Spa Fruit & Fresh Ritual', cat: 'Head Spa rituály • 75 minút',
    lede: 'Svieži rituál s čerstvým ovocím, vodou, vôňou a striedaním tepla a chladu.' },
  { id: 'head-spa-signature-ritual', foto: 'foto/head-spa-signature-ritual.jpg', pos: '42% 50%', rule: 'Head Spa Signature Ritual', cat: 'Head Spa rituály • 120 minút',
    lede: 'Najkompletnejší rituál, aký v HEAD SPA 30 máme. Dve hodiny od pokožky hlavy cez tvár až po vlasy.' },
  { id: 'gentlemen-head-spa', foto: 'foto/gentlemen-head-spa.jpg', pos: '45% 50%', rule: 'Gentlemen Head Spa', cat: 'Pánske rituály • 45 minút',
    lede: 'Štyridsaťpäť minút pokoja a starostlivosti pripravených pre mužov.' },
  { id: 'gentlemen-harmony-ritual', foto: 'foto/gentlemen-harmony-ritual.jpg', pos: '55% 40%', rule: 'Gentlemen Harmony Ritual', cat: 'Pánske rituály • 60 minút',
    lede: 'Hodina v drevitých a sviežich tónoch, s teplým uterákom, vodou a jemným dotykom.' },
  { id: 'gentlemen-deep-scalp-ritual', foto: 'foto/gentlemen-deep-scalp-ritual.jpg', pos: '45% 50%', rule: 'Gentlemen Deep Scalp Ritual', cat: 'Pánske rituály • 90 minút',
    lede: 'Deväťdesiat minút pre mužov, ktorým sa pokožka hlavy rýchlo mastí, svrbí alebo má sklon k lupinám.' },
  { id: 'gentlemen-signature-experience', foto: 'foto/gentlemen-signature-experience.jpg', pos: '40% 35%', rule: 'Gentlemen Signature Experience', cat: 'Pánske rituály • 120 minút',
    lede: 'Dve hodiny bez telefónov a zhonu, jeden plynulý zážitok pre pokožku hlavy, vlasy aj tvár.' },
  { id: 'little-fruit-head-spa', foto: 'foto/little-fruit-head-spa.jpg', pos: '40% 42%', rule: 'Little Fruit Head Spa', cat: 'Detské rituály • 50 minút',
    lede: 'Hravý a jemný rituál pripravený pre deti: voňavo, pomaly a s úsmevom.' },
  { id: 'spolocny-head-spa-ritual', foto: 'foto/spolocny-head-spa-ritual.jpg', pos: '50% 40%', rule: 'Spoločný Head Spa rituál', cat: 'Rituály pre dvoch • 65 minút',
    lede: 'Dva rituály vedľa seba pre partnerov, mamu s dcérou, sestry či kamarátky.' },
  { id: 'spolocny-ritual-pod-hviezdami', foto: 'foto/spolocny-ritual-pod-hviezdami.jpg', pos: '50% 62%', rule: 'Spoločný rituál pod hviezdami', cat: 'Rituály pre dvoch • 75 minút',
    lede: 'Rituál pre dvoch v tlmenom svetle, s hviezdnou oblohou, vôňou, teplom a pokojnými zvukmi.' },
  { id: 'klasicky-ritual-pre-chodidla', foto: 'foto/klasicky-ritual-pre-chodidla.jpg', pos: '50% 75%', rule: 'Klasický rituál pre chodidlá', cat: 'Rituály pre chodidlá • 40 minút',
    lede: 'Teplý kúpeľ, peeling, masky, teplo a reflexné tlakové techniky pre pocit ľahkosti chodidiel.' },
  { id: 'ovocny-a-bylinkovy-ritual-pre-chodidla', foto: 'foto/ovocny-a-bylinkovy-ritual-pre-chodidla.jpg', pos: '50% 66%', rule: 'Ovocný a bylinkový rituál pre chodidlá', cat: 'Rituály pre chodidlá • 60 minút',
    lede: 'Teplý bylinný kúpeľ s čerstvými citrusmi, ovocný peeling, obklad a hydratačná maska pre chodidlá.' },
  { id: 'zlaty-ritual-24k', foto: 'foto/zlaty-ritual-24k.jpg', pos: '50% 100%', rule: 'Zlatý rituál 24K', cat: 'Rituály pre chodidlá • 90 minút',
    lede: 'Kúpeľ, luxusný peeling, zlatá maska a 24K zábal na päty a chodidlá, so sérom s kozmetickým zlatom.' },
];

const front = (v, sq = false) => `<div class="card front${sq ? ' sq' : ''}" id="${sq ? 'sq' : 'front'}-${v.id}">
  <div class="bg"></div>
  <div class="photo" style="--pos:${v.pos}"><img src="${v.foto}" alt=""></div>
  ${sq ? arc(980, 700, 892, 350, 352) : arc(1080, 525, 835, 262, 275)}
  <div class="frame"></div>
  ${branch}
  ${seal}
  <div class="txt">
    ${lotus()}
    <b class="wm gold">HEAD SPA 30</b>
    <div class="city">NITRA</div>
    <div class="kind"><span class="a gold">Darčeková</span><span class="b">poukážka</span></div>
    <div class="orn"><i></i></div>
    <div class="rule gold${v.rule.length > 21 ? ' long' : ''}">${v.rule}</div>
    <div class="cat">${v.cat}</div>
    <p class="lede">${v.lede}</p>
  </div>
  <div class="fields">
    <div class="f">Rituál:<span></span></div>
    <div class="f">Pre:<span></span></div>
    <div class="f">Od:<span></span></div>
    <div class="f">Platnosť do:<span></span></div>
    <div class="f">Kód:<span></span></div>
  </div>
  <div class="foot"><span>Mostná 30 · Nitra</span></div>
  <img class="bow" src="stuha.png" alt="">
</div>`;

const back = () => `<div class="card back" id="back">
  <div class="bg"></div>
  <div class="frame"></div>
  <div class="txt">
    <div class="brand">${lotus()}<div><b class="wm gold">HEAD SPA 30</b><div class="city">NITRA</div></div></div>
    <h2 class="gold">Ako poukážku využiť</h2>
    <ol>
      <li>Zavolaj na 0911 153 136 alebo si vyber termín v online kalendári.</li>
      <li>Pri rezervácii uveď kód poukážky a rituál, ktorý je na nej napísaný.</li>
      <li>Poukážku prines so sebou, v salóne ju odovzdáš pri rituále.</li>
    </ol>
    <p class="list">Poukážka platí 365 dní od dátumu vystavenia na rituál, ktorý je na nej uvedený. Nevymieňa sa za hotovosť. Termín odporúčame dohodnúť aspoň týždeň vopred.</p>
  </div>
  <div class="qr"><img src="qr-kalendar.png" alt="QR kód: online kalendár"></div>
  <div class="qrl"><b>Online kalendár</b>booqme.app/sk/rezervacia/barbershop-30</div>
  <div class="foot"><span>Mostná 30 · Nitra · 0911 153 136</span></div>
</div>`;

const tpl = fs.readFileSync(path.join(ROOT, 'poukaz.html'), 'utf8');
const cards = VARIANTY.map((v) => front(v)).join('\n') + '\n' + back() + '\n' + VARIANTY.map((v) => front(v, true)).join('\n');
fs.writeFileSync(path.join(ROOT, 'index.html'), tpl.replace('<!--CARDS-->', cards));

for (const d of ['png', 'pdf', 'booqme']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
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
// užšia verzia pre Booqme (obchod ju oreže na takmer štvorec) a pre sociálne siete, 2352 × 1680 px
for (const v of VARIANTY) {
  const el = await page.$('#sq-' + v.id);
  await el.screenshot({ path: path.join(ROOT, 'booqme', `poukaz-${v.id}.png`), type: 'png' });
}
// PDF: jedna karta na stranu 216 × 105 mm (so spadávkou), pre tlačiareň
const pdfPage = await ctx.newPage();
const one = async (idsToPrint, file) => {
  const html = tpl.replace('<!--CARDS-->', idsToPrint.map((id) => id === 'back' ? back() : front(VARIANTY.find((v) => 'front-' + v.id === id))).join('\n'))
    .replace('html,body{background:#222}', 'html,body{background:#0b100d}@page{size:216mm 105mm;margin:0}.card{page-break-after:always;break-after:page;margin:0}'
      // v PDF je zlatý text plnou farbou: orezanie pozadia textom tlačiarne a prehliadače PDF kreslia ako rámčeky
      + '.gold{background:none!important;color:#dcb56a!important;-webkit-text-fill-color:#dcb56a}');
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
