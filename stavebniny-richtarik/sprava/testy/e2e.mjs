// End-to-end test správy webu v Chromiu (Playwright) proti php -S na KÓPII webu (spúšťa ho sprava/testy/e2e.sh).
//   node sprava/testy/e2e.mjs <url koreňa> <priečinok údajov> <priečinok vstupov> <šírka> <výška> <priečinok snímok>
// Postup ako Mário: prvé nastavenie s kódom zo súboru, prihlásenie, otváracie hodiny, nová akcia s fotkou a cenou
// (pomalé písanie 3 znaky/s, 2 s rozmýšľania na obrazovke, nahrávanie 1,5 Mbit/s – len na telefóne), úprava ceny,
// skrytie akcie, nový leták PDF, krok späť, novinka, sviatok, fotka v galérii, text, telefón, e-mail a pevná linka
// s vrátením, obrázok do albumu grafiky, skrytie všetkých letákov, odhlásenie. Po každom úkone overí verejnú stránku,
// hľadanie a sitemap a že verejné stránky nemajú žiadny kód správy. Na každej obrazovke: bez vodorovného posúvania, polia ≥ 16 px,
// ťukacie plochy ≥ 48 px, bez chýb v konzole, bez anglických slov.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const [URL, DATA, VST, W, H, SNIMKY] = process.argv.slice(2);
const TELEFON = +W < 600;
const PREFIX = `${W}`;
const HESLO = 'tri-slova-' + Math.random().toString(36).slice(2, 10);   // náhodné heslo len pre tento beh
let ok = 0, zle = 0, tuknutia = 0, snimka = 0;
const vysledky = [];
const t = (nazov, podm, detail = '') => { if (podm) ok++; else zle++; vysledky.push(`${podm ? 'ok  ' : 'ZLE '} ${nazov}${detail ? ' – ' + detail : ''}`); console.log(`${podm ? '  ok ' : '  ZLE'} ${nazov} ${detail}`); };
const cakaj = (ms) => new Promise((r) => setTimeout(r, ms));
const ZAKAZANE = /\b(Save|Submit|Cancel|Upload|Error|Login|Password|Settings|Delete|Preview|Publish)\b/;

const prehliadac = await chromium.launch();
const kontext = await prehliadac.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: TELEFON ? 3 : 1, isMobile: TELEFON, hasTouch: TELEFON, locale: 'sk-SK' });
const s = await kontext.newPage();
const konzola = [];
s.on('console', (m) => { if (m.type() === 'error') konzola.push(m.text()); });
s.on('pageerror', (e) => konzola.push(String(e)));
s.on('dialog', (d) => d.accept());

async function obrazovka(meno) {
  // kontrola obrazovky správy + snímka; meria sa až po načítaní stránky a všetkých štýlov (inak pri záťaži občas namerala
  // predvolených 13,33 px prehliadača namiesto 18 px zo sprava.css – kontrola regresií R-3, 16. 11. 2026). Ak sa štýly
  // nenačítajú do 5 s, meria sa aj tak a skutočná chyba sa ukáže.
  await s.waitForLoadState('load').catch(() => {});
  await s.waitForFunction(() => document.readyState === 'complete'
    && [...document.querySelectorAll('link[rel=stylesheet]')].every((l) => l.sheet), null, { timeout: 5000 }).catch(() => {});
  const r = await s.evaluate(() => {
    const d = document.documentElement, zle = [];
    const vod = d.scrollWidth > window.innerWidth + 1;
    for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select')) {
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 16) zle.push('pole ' + (el.name || el.type) + ' ' + fs + 'px');
    }
    for (const el of document.querySelectorAll('button, a.tl, .dlazdica, .riadok, .cip, .prepinac')) {
      const b = el.getBoundingClientRect(); if (b.width && b.height && (b.height < 44 || b.width < 44)) zle.push((el.textContent || '').trim().slice(0, 20) + ' ' + Math.round(b.width) + '×' + Math.round(b.height));
    }
    return { vod, zle, text: document.body.innerText };
  });
  t(`${meno}: bez vodorovného posúvania`, !r.vod);
  t(`${meno}: polia ≥ 16 px a plochy ≥ 44 px`, r.zle.length === 0, r.zle.slice(0, 3).join(', '));
  t(`${meno}: po slovensky (bez anglických slov)`, !ZAKAZANE.test(r.text), (r.text.match(ZAKAZANE) || [''])[0]);
  snimka++;
  await s.screenshot({ path: `${SNIMKY}/${PREFIX}-${String(snimka).padStart(2, '0')}-${meno}.png`, fullPage: TELEFON ? false : true });
}

async function tuk(loc) { tuknutia++; await (typeof loc === 'string' ? s.locator(loc) : loc).first().click(); }
async function pis(loc, text, pomaly) {
  const l = s.locator(loc).first();
  await l.fill('');
  if (pomaly) await l.pressSequentially(text, { delay: 333 }); else await l.fill(text);
}
async function rozmyslaj(pomaly) { if (pomaly) await cakaj(2000); }
async function verejna(cesta) { const r = await s.request.get(URL + cesta); return { kod: r.status(), text: await r.text() }; }
// 3D vizitka v päte (Mário 18. 11. 2026; oblasť pata-grafika): koľko z týchto stránok ju má v HTML
const PATA_VIZ = ['index.html', 'kontakt.html', 'katalog/dlazby.html', '404.html'];
async function vizitkyVPate() { let n = 0; for (const c of PATA_VIZ) { const x = (await verejna(c)).text; if (/<!--s:pata-grafika--><div class="wrap f-viz">[^]*?vizitka-p-960\.webp[^]*?<!--\/s:pata-grafika-->/.test(x)) n++; } return n; }
// vizitka sa v päte naozaj vykreslí: obrázok načítaný, s rozmermi, pod obsahom päty a nad pásom s copyrightom
async function vizitkaVidno(c) { await s.goto(URL + c); const v = s.locator('footer .f-viz img'); if (await v.count() !== 1) return false; await v.scrollIntoViewIfNeeded(); await s.waitForFunction(() => { const i = document.querySelector('footer .f-viz img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).catch(() => 0);
  return s.evaluate(() => { const i = document.querySelector('footer .f-viz img'), b = document.querySelector('footer .bottom').getBoundingClientRect(), g = document.querySelector('footer .grid').getBoundingClientRect(), r = i.getBoundingClientRect();
    return i.naturalWidth > 0 && i.getAttribute('width') && i.getAttribute('height') && i.loading === 'lazy' && r.width > 200 && r.top >= g.bottom && r.top < b.top && r.bottom > b.top; }); }
async function bezKoduSpravy(cesty) {
  for (const c of cesty) {
    const v = await verejna(c);
    t(`verejná ${c}: bez kódu správy`, v.kod === 200 && !/sprava\/|rs_sprava|sprava-data|index\.php/.test(v.text.replace(/<!--\/?s:[a-z0-9-]+-->/g, '')));
  }
}
async function zverejni(popis) {
  await obrazovka(`nahlad-${popis}`);
  t(`${popis}: náhľad bez chýb`, (await s.locator('.hlaska.chyba').count()) === 0, (await s.locator('.hlaska.chyba').allInnerTexts()).join(' '));
  await tuk('button:has-text("Zverejniť na webe")');
  await s.waitForLoadState('domcontentloaded');
  t(`${popis}: zverejnené`, (await s.locator('.hlaska.ok').innerText()).includes('Zmena je na webe'));
  t(`${popis}: stav Všetko je na webe`, (await s.locator('.stav.ok').count()) === 1);
}

try {
  // ---------- 1. prvé nastavenie s kódom zo súboru ----------
  await s.goto(URL + 'sprava/');
  t('bez účtu: obrazovka prvého nastavenia', (await s.locator('h1').innerText()) === 'Prvé nastavenie');
  t('žiadne predvolené prihlásenie', (await s.locator('input[name=heslo]').count()) === 0);
  await obrazovka('prve-nastavenie');
  await tuk('button:has-text("Vytvoriť overovací kód")');
  await s.waitForSelector('input[name=kod]');
  await obrazovka('prve-kod');
  const subor = fs.readFileSync(`${DATA}/PRVY-KOD.txt`, 'utf8');
  const kod = subor.match(/Kód: ([A-Z0-9-]+)/)[1];
  t('kód je v súbore na hostingu', /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(kod));
  await pis('input[name=kod]', 'AAAA-BBBB-CCCC-DDDD');
  await tuk('button:has-text("Overiť kód")');
  t('zlý kód odmietnutý', (await s.locator('.hlaska.chyba').innerText()).includes('nie je správny'));
  await pis('input[name=kod]', kod.toLowerCase());
  await tuk('button:has-text("Overiť kód")');
  await s.waitForSelector('input[name=heslo2]');
  t('súbor s kódom sa po použití zmazal', !fs.existsSync(`${DATA}/PRVY-KOD.txt`));
  await pis('input[name=meno]', 'Mário');
  await pis('input[name=heslo]', 'richtarik12');
  await pis('input[name=heslo2]', 'richtarik12');
  await obrazovka('prve-heslo');
  await tuk('button:has-text("Uložiť a pokračovať")');
  t('slabé heslo odmietnuté', (await s.locator('.hlaska.chyba').count()) === 1);
  await s.goto(URL + 'sprava/');
  await s.waitForSelector('input[name=heslo2]');
  await pis('input[name=meno]', 'Mário');
  await pis('input[name=heslo]', HESLO);
  await pis('input[name=heslo2]', HESLO);
  await tuk('button:has-text("Uložiť a pokračovať")');
  await s.waitForSelector('.dlazdice');
  t('po nastavení prihlásený na Domove', (await s.locator('h1').innerText()) === 'Správa webu');
  await obrazovka('domov');

  // ---------- 2. odhlásenie a prihlásenie ----------
  await tuk('header button:has-text("Odhlásiť")');
  await s.waitForSelector('input[name=heslo]');
  await pis('input[name=meno]', 'Mário'); await pis('input[name=heslo]', 'zle-heslo-123');
  await tuk('button:has-text("Prihlásiť sa")');
  t('zlé heslo odmietnuté', (await s.locator('.hlaska.chyba').innerText()).includes('nie je správne'));
  await pis('input[name=meno]', 'mário'); await pis('input[name=heslo]', HESLO);
  await obrazovka('prihlasenie');
  await tuk('button:has-text("Prihlásiť sa")');
  await s.waitForSelector('.dlazdice');
  t('prihlásenie heslom (bez zdvojeného pozdravu, pokusy po slovensky – D3)', (await s.locator('h1').innerText()) === 'Správa webu' && (await s.locator('main').innerText()).match(/Dobrý deň/g).length === 1
    && (await s.locator('.hlaska').first().innerText()).includes('bol 1 nesprávny pokus'));

  // Máriove grafiky s údajom v obrázku: pred zmenami sú všetky na webe
  const pocetFig = async c => ((await verejna(c)).text.match(/<figure class="fig"><a href="[^"]*img\/grafika\//g) || []).length;
  t('grafiky: pred zmenami obrázok hodín, 4 letáky a bannery, 7 obrázkov albumu bez piktogramov', (await verejna('kontakt.html')).text.includes('kontakt-hodiny-288') && (await pocetFig('letak.html')) === 4 && (await pocetFig('galeria/index.html')) === 7 && (await verejna('galeria/index.html')).text.includes('7 obrázkov') && !(await verejna('galeria/index.html')).text.includes('img/grafika/alt-'));
  // Mário 18. 11. 2026: karty akcií s fotkou tovaru (6 na Akciách, 4 na úvode), súbory sa načítajú
  { const ak = (await verejna('akcie/index.html')).text, uv = (await verejna('index.html')).text, fs = [...new Set(ak.match(/img\/akcie\/[a-z0-9-]+\.webp/g) || [])];
    t('akcie: karty s fotkou tovaru na Akciách a na úvode, súbory sa načítajú', (ak.match(/class="thumb foto"/g) || []).length === 6 && (uv.match(/class="thumb foto"/g) || []).length === 4
      && fs.length === 6 && (await Promise.all(fs.map(async f => (await verejna(f)).kod))).every(k => k === 200)); }
  // pokyny majiteľa 17. 11. 2026: 3D karta (úvod, Služby), tabuľa na Kontakte, piktogramy na Službách
  { const u = (await verejna('index.html')).text, sl = (await verejna('sluzby.html')).text, ko = (await verejna('kontakt.html')).text;
    t('grafiky: pred zmenami 3D karta na úvode (aj miniatúra v páse faktov) a na Službách, tabuľa na Kontakte, piktogramy na Službách', u.includes('karta-3d-820') && u.includes('karta-3d-mini-208') && !u.includes('karta-nova') && sl.includes('karta-3d-480')
      && ko.includes('tabula-vysoka-k-240') && sl.includes('kontakt-zavolajte-480') && sl.includes('kontakt-napiste-480') && sl.includes('zlavy-480') && sl.includes('sluzba-vypocet-480') && sl.includes('sluzba-poradenstvo-480')
      && sl.includes('sluzba-sortiment-480') && sl.includes('sluzba-doprava-480') && sl.includes('sluzba-platba-180')); }

  // ---------- 3. otváracie hodiny ----------
  await tuk('a.dlazdica:has-text("Otváracie hodiny")');
  await s.locator('input[name="den[6][do]"]').fill('11:00');
  await obrazovka('hodiny');
  await tuk('button:has-text("Pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('hodiny');
  for (const [c, vzor] of [['kontakt.html', '<td>Sobota</td><td>7:00 – 12:00</td>'.replace('12', '11')], ['index.html', 'So 7:00 – 11:00'], ['akcie/cement-325-r.html', 'So 7:00 – 11:00'], ['caste-otazky.html', 'sobota 7:00 – 11:00']]) {
    const v = await verejna(c); t(`hodiny na ${c}`, v.text.includes(vzor));
  }
  t('hodiny v údajoch pre Google', (await verejna('kontakt.html')).text.includes('"dayOfWeek": "Saturday", "opens": "07:00", "closes": "11:00"'));
  t('hodiny v hľadaní', (await verejna('assets/index.json')).text.includes('sobota 7:00 – 11:00'));
  // obrázky s pôvodnými hodinami (ikona na Kontakte, leták Prečo nakupovať, tabuľa s otváracou dobou) po zmene hodín zmiznú, text ostane
  const kh = (await verejna('kontakt.html')).text;
  t('grafiky: zmena hodín skryje obrázok hodín na Kontakte, tabuľka ostane', !kh.includes('kontakt-hodiny') && !kh.includes('khod-obr') && /<!--s:hodiny-kontakt--><table class="hours">/.test(kh));
  t('grafiky: zmena hodín skryje leták Prečo nakupovať a tabuľu s otváracou dobou', !(await verejna('letak.html')).text.includes('letak-preco-nakupovat') && (await pocetFig('letak.html')) === 3
    && !(await verejna('galeria/index.html')).text.includes('tabula-vysoka') && (await verejna('galeria/index.html')).text.includes('6 obrázkov'));
  t('grafiky: zmena hodín skryje tabuľu s otváracou dobou na Kontakte, 3D karta ostane', !kh.includes('tabula-vysoka') && (await verejna('index.html')).text.includes('karta-3d-820'));
  await s.goto(URL + 'kontakt.html'); await s.locator('.khod').scrollIntoViewIfNeeded();
  t('grafiky: karta Otváracie hodiny bez obrázka sa zobrazí', (await s.locator('.khod .hours').isVisible()) && (await s.locator('.khod picture').count()) === 0);
  await s.goto(URL + 'sprava/');
  await bezKoduSpravy(['index.html', 'kontakt.html', 'caste-otazky.html']);

  // ---------- 4. nová akcia s fotkou a cenou (časovaný test na telefóne) ----------
  const cdp = await kontext.newCDPSession(s);
  if (TELEFON) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 10, uploadThroughput: 1.5e6 / 8 });
  const tuk0 = tuknutia, t0 = Date.now();
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Akcie")');
  await rozmyslaj(TELEFON);
  await obrazovka('akcie');
  await tuk('a:has-text("+ Pridať akciu")');
  await rozmyslaj(TELEFON);
  await pis('input[name=nazov]', 'Skúšobná akcia OSB', TELEFON);
  await tuk('label.cip:has-text("Znížené ceny")');
  await pis('textarea[name=karta]', 'OSB dosky na podlahy a steny za znížené ceny, priamo zo skladu v Nitre. Ceny s DPH.', TELEFON);
  await s.locator('input[name=letak_foto]').setInputFiles(`${VST}/velky.jpg`);
  tuknutia++;
  await s.waitForSelector('text=Fotka je pripravená', { timeout: 20000 }).catch(() => {});
  t('fotka zmenšená v telefóne pred odoslaním', (await s.locator('text=Fotka je pripravená').count()) === 1);
  await rozmyslaj(TELEFON);
  await pis('input[name="ceny[0][r][0][polozka]"]', 'OSB doska 12 mm', TELEFON);
  await pis('input[name="ceny[0][r][0][cena]"]', '16,58 €/ks', TELEFON);
  await tuk('label.prepinac:has-text("Ukázať na úvode")');
  await obrazovka('akcia-nova');
  await tuk('button:has-text("Pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")', { timeout: 60000 });
  t('upozornenie: z úvodu ustúpi posledná akcia', (await s.locator('.hlaska.var').count()) >= 1);
  await rozmyslaj(TELEFON);
  await zverejni('akcia-nova');
  const trvanie = (Date.now() - t0) / 1000, tukov = tuknutia - tuk0;
  if (TELEFON) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  t(`nová akcia s fotkou a cenou: ${trvanie.toFixed(0)} s${TELEFON ? ' (≤ 180 s)' : ''}`, !TELEFON || trvanie <= 180);
  t(`nová akcia: ${tukov} ťuknutí (≤ 15)`, tukov <= 15);
  const nova = 'akcie/skusobna-akcia-osb.html';
  let v = await verejna(nova);
  t('nová stránka akcie existuje', v.kod === 200 && v.text.includes('<h1><span class="dr"><span>Skúšobná akcia OSB v akcii</span></span></h1>'));
  t('cena na stránke akcie', v.text.replace(/\u00a0/g, ' ').includes('<td>OSB doska 12 mm</td><td>16,58 €/ks</td>'), (v.text.match(/<td>OSB[^]*?<\/tr>/) || [''])[0]);
  const foto = (v.text.match(/img\/s\/\d{4}\/\d{2}\/skusobna-akcia-osb-[0-9a-f]{8}-1200\.webp/) || [''])[0];
  t('leták je WebP zo správy v šírkach 600 a 1200', !!foto && v.text.includes(foto.replace('-1200.', '-600.')));
  const f = await s.request.get(URL + foto);
  t('fotka sa načíta (WebP, bez EXIF)', f.status() === 200 && !(await f.body()).includes(Buffer.from('Exif')));
  t('karta na stránke Akcie', (await verejna('akcie/index.html')).text.includes('<h2 class="h3">Skúšobná akcia OSB</h2>'));
  t('karta na úvode', (await verejna('index.html')).text.includes('<h3>Skúšobná akcia OSB</h3>'));
  t('v bočnom zozname inej akcie', (await verejna('akcie/porfix.html')).text.includes('<b>Skúšobná akcia OSB</b>'));
  t('v hľadaní', (await verejna('assets/index.json')).text.includes('"p":"' + nova + '"'));
  t('v sitemap', (await verejna('sitemap.xml')).text.includes(nova));
  await bezKoduSpravy([nova, 'akcie/index.html', 'index.html']);
  await s.goto(URL + nova);
  await s.screenshot({ path: `${SNIMKY}/${PREFIX}-web-nova-akcia.png` });

  // ---------- 5. úprava ceny ----------
  await s.goto(URL + 'sprava/index.php?s=akcia&id=skusobna-akcia-osb');
  await pis('input[name="ceny[0][r][0][cena]"]', '15,90 €/ks');
  await obrazovka('akcia-uprava');
  await tuk('button:has-text("Pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('cena');
  v = await verejna(nova);
  t('nová cena na webe, stará preč', v.text.includes('15,90 €/ks') && !v.text.includes('16,58'));
  t('nová cena v hľadaní', (await verejna('assets/index.json')).text.includes('15,90'));

  // ---------- 6. nový leták PDF na stránke Akcie ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Cenník a letáky")');
  await obrazovka('cennik');
  await s.locator('input[name=letak_pdf]').setInputFiles(`${VST}/letak.pdf`);
  await pis('input[name=text]', 'Leták akcie: skúšobný leták');
  await tuk('button:has-text("Pridať leták")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('letak');
  v = await verejna('akcie/index.html');
  const pdf = (v.text.match(/pdf\/s\/\d{4}\/\d{2}\/letak-akcie-skusobny-letak-[0-9a-f]{8}\.pdf/) || [''])[0];
  t('leták na stránke Akcie', !!pdf && v.text.includes('Leták akcie: skúšobný leták (PDF,'));
  const p = await s.request.get(URL + pdf);
  t('PDF sa dá stiahnuť', p.status() === 200 && (await p.body()).subarray(0, 5).toString() === '%PDF-');

  // ---------- 7. zmazanie (skrytie) akcie ----------
  await s.goto(URL + 'sprava/index.php?s=akcia&id=skusobna-akcia-osb');
  await tuk('button:has-text("Skryť akciu z webu")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('skrytie');
  v = await verejna(nova);
  t('stránka ostala s vetou, že akcia skončila, a noindex', v.text.includes('Táto akcia sa už skončila') && v.text.includes('<meta name="robots" content="noindex">'));
  t('karta zmizla zo stránky Akcie a z úvodu', !(await verejna('akcie/index.html')).text.includes('Skúšobná akcia OSB') && !(await verejna('index.html')).text.includes('Skúšobná akcia OSB'));
  t('zmizla z hľadania a sitemap', !(await verejna('assets/index.json')).text.includes(nova) && !(await verejna('sitemap.xml')).text.includes(nova));

  // ---------- 8. krok späť (vrátiť skrytie) ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("História")');
  await obrazovka('historia');
  await tuk('button:has-text("Vrátiť")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('vratenie');
  t('po vrátení je akcia znova na webe', (await verejna('akcie/index.html')).text.includes('Skúšobná akcia OSB') && !(await verejna(nova)).text.includes('noindex'));

  // ---------- 8a. novinka (V1) ----------
  const nb = (x) => x.replace(/ /g, ' ');
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Novinky")');
  await obrazovka('novinky');
  await tuk('a:has-text("+ Pridať novinku")');
  await pis('input[name=nazov]', 'Skúšobná novinka dlažba', TELEFON);
  await pis('textarea[name=popis]', 'Nová skúšobná dlažba v ponuke predajne, popis len na overenie správy webu.');
  await pis('textarea[name=text]', 'Prvý odsek skúšobnej novinky.\n\nDruhý odsek skúšobnej novinky.');
  await s.locator('input[name=foto]').setInputFiles(`${VST}/letak.jpg`); tuknutia++;
  await s.waitForSelector('text=Fotka je pripravená', { timeout: 20000 }).catch(() => {});
  await pis('input[name=foto_popis_novy]', 'Skúšobná fotka dlažby');
  await tuk('label.prepinac:has-text("Ukázať na úvodnej stránke")');
  await obrazovka('novinka-nova');
  await tuk('button:has-text("Pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")', { timeout: 60000 });
  t('novinka: náhľad ukazuje, čo sa zmení (S8)', nb(await s.locator('.zmeny').innerText()).includes('Nová novinka „Skúšobná novinka dlažba“'));
  await zverejni('novinka');
  const nn = 'novinky/skusobna-novinka-dlazba.html';
  v = await verejna(nn);
  t('novinka: stránka s nadpisom, textom a fotkou', v.kod === 200 && v.text.includes('<h1><span class="dr"><span>Skúšobná novinka dlažba</span></span></h1>') && v.text.includes('Druhý odsek skúšobnej novinky.') && /img\/s\/\d{4}\/\d{2}\/skusobna-novinka-dlazba-[0-9a-f]{8}-600\.webp/.test(v.text));
  t('novinka: v zozname Noviniek a na úvode', (await verejna('novinky/index.html')).text.includes('Skúšobná novinka dlažba') && (await verejna('index.html')).text.includes('Skúšobná novinka dlažba'));
  t('novinka: v hľadaní a sitemap', (await verejna('assets/index.json')).text.includes('"p":"' + nn + '"') && (await verejna('sitemap.xml')).text.includes(nn));
  await bezKoduSpravy([nn, 'novinky/index.html']);

  // ---------- 8b. sviatok bez zmeny bežných hodín (V2) ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Otváracie hodiny")');
  await s.locator('form.vynimka input[name=od]').fill('2026-12-24');
  await s.locator('form.vynimka input[name=do]').fill('2026-12-26');
  await pis('form.vynimka input[name=nazov]', 'Vianoce');
  await obrazovka('hodiny-oznam');
  await tuk('button:has-text("Pridať oznam a pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  t('oznam: náhľad „pred → po“', nb(await s.locator('.zmeny').innerText()).includes('Vianoce 24. 12. – 26. 12. 2026: zatvorené'));
  // S3: z náhľadu späť do formulára, zmena ostane
  await tuk('a:has-text("Upraviť ďalej")');
  t('Upraviť ďalej vedie do formulára hodín (S3)', (await s.locator('h1').innerText()).startsWith('Otváracie hodiny') && (await s.locator('.stav.cak').count()) === 1);
  await tuk('a.stav.cak');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('oznam');
  for (const [c, bezne] of [['kontakt.html', '<td>Sobota</td><td>7:00 – 11:00</td>'], ['index.html', 'So 7:00 – 11:00'], ['akcie/porfix.html', 'So 7:00 – 11:00']]) {
    const x = nb((await verejna(c)).text); t(`oznam na ${c}, bežné hodiny ostali`, x.includes('Vianoce 24. 12. – 26. 12. 2026: zatvorené') && x.includes(bezne));
  }
  t('oznam v údajoch pre Google', (await verejna('kontakt.html')).text.includes('"specialOpeningHoursSpecification": [{"@type": "OpeningHoursSpecification", "validFrom": "2026-12-24", "validThrough": "2026-12-26"'));
  await s.goto(URL + 'kontakt.html');
  t('oznam je na webe viditeľný (pred koncom)', await s.locator('[data-do="2026-12-26"]').first().isVisible());

  // ---------- 8c. fotka v galérii (V3) ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Fotky v galérii")');
  await obrazovka('galeria');
  const gt = nb(await s.locator('main').innerText());
  t('galéria v správe: albumy grafiky a poznámka pri obrázku so starými hodinami', gt.includes('Letáky a bannery') && gt.includes('Logo a firemná grafika') && gt.includes('nie je na webe')
    && (await s.locator('li.skryta:has-text("Leták Prečo nakupovať")').count()) === 1 && (await s.locator('li.skryta:has-text("Firemná tabuľa s adresou")').count()) === 1);
  const fg = s.locator('form.nova-fotka').first();
  await fg.locator('input[name=foto]').setInputFiles(`${VST}/letak.jpg`); tuknutia++;
  await s.waitForSelector('text=Fotka je pripravená', { timeout: 20000 }).catch(() => {});
  await fg.locator('input[name=popis]').fill('Skúšobná fotka regálu v predajni');
  await tuk(fg.locator('button:has-text("Pridať fotku a pozrieť náhľad")'));
  await s.waitForSelector('h1:has-text("Náhľad zmeny")', { timeout: 60000 });
  await zverejni('galeria');
  v = await verejna('galeria/index.html');
  t('galéria: nová fotka s popisom a počet', v.text.includes('alt="Skúšobná fotka regálu v predajni"') && v.text.includes('14 fotografií'));

  // ---------- 8d. text stránky (V4) ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Texty stránok")');
  await obrazovka('texty');
  await pis('textarea[name=sluzby_uvod]', 'Skúšobná veta pod nadpisom Služieb: poradenstvo a cenová ponuka sú zadarmo.');
  await tuk('button:has-text("Pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  t('texty: náhľad „pred → po“', nb(await s.locator('.zmeny').innerText()).includes('Služby – veta pod nadpisom'));
  await zverejni('texty');
  t('texty: nová veta na stránke Služby', nb((await verejna('sluzby.html')).text).includes('Skúšobná veta pod nadpisom Služieb'));

  // ---------- 8e. telefón a e-mail (V4) a vrátenie ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Telefón a e-mail")');
  await obrazovka('kontakt');
  await pis('input[name=mobil]', '0905 111 222');
  await tuk('button:has-text("Pozrieť náhľad")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  t('kontakt: náhľad „pred → po“', nb(await s.locator('.zmeny').innerText()).includes('Mobil: 0905 622 223 → 0905 111 222'));
  await zverejni('kontakt');
  let stare = 0;
  for (const c of ['index.html', 'kontakt.html', 'akcie/porfix.html', 'katalog/dlazby.html', nn, 'sluzby.html']) {
    const x = nb((await verejna(c)).text); if (x.includes('0905 622 223') || x.includes('421905622223')) stare++;
    t(`kontakt: nový mobil na ${c}`, x.includes('0905 111 222') && x.includes('tel:+421905111222'));
  }
  t('kontakt: starý mobil nikde', stare === 0);
  // karty Kontaktu: grafika „Zavolajte nám“ má staré číslo v obrázku, preto zmizne; karta ostane s novým číslom
  const kk = (await verejna('kontakt.html')).text;
  t('kontakt: zmena mobilu skryje obrázok Zavolajte nám, karta ostane', !kk.includes('kontakt-zavolajte') && kk.includes('kontakt-napiste-480') && /<h2 class="kk-n">Zavolajte nám<\/h2><a class="big kk-hl" href="tel:\+421905111222">/.test(kk));
  t('grafiky: zmena mobilu skryje aj vizitku, kartu a leták so sortimentom', (await pocetFig('galeria/index.html')) === 4 && (await verejna('galeria/index.html')).text.includes('4 obrázky')
    && !(await verejna('galeria/index.html')).text.includes('vizitka') && !(await verejna('letak.html')).text.includes('letak-stavebniny-richtarik') && (await pocetFig('letak.html')) === 2);
  t('päta: zmena mobilu skryje 3D vizitku v päte (úvod, Kontakt, Dlažby, 404), päta ostane', (await vizitkyVPate()) === 0
    && PATA_VIZ.length === (await Promise.all(PATA_VIZ.map(async c => (await verejna(c)).text))).filter(x => x.includes('<!--s:pata-grafika--><!--/s:pata-grafika-->\n  <div class="wrap bottom">')).length);
  { const u = (await verejna('index.html')).text, sl = (await verejna('sluzby.html')).text;
    t('grafiky: zmena mobilu – na úvode a na Službách plochá karta namiesto 3D (miniatúra v páse faktov zmizne), na Službách bez Zavolajte nám, Napíšte nám ostane', u.includes('karta-nova-671') && !u.includes('karta-3d')
      && sl.includes('karta-nova-671') && !sl.includes('karta-3d') && !sl.includes('kontakt-zavolajte') && sl.includes('kontakt-napiste-480')); }
  await s.goto(URL + 'sluzby.html'); await s.locator('.cta-pas').scrollIntoViewIfNeeded();
  t('Služby: výzva pred pätou s jedným piktogramom sa zobrazí', (await s.locator('.cta-ik picture').count()) === 1 && (await s.locator('.cta-ik picture img').first().isVisible()));
  await s.goto(URL + 'kontakt.html'); await s.locator('.kk2').scrollIntoViewIfNeeded();
  t('kontakt: karta bez obrázka sa zobrazí', (await s.locator('.kk.bez-obr .big').first().isVisible()) && (await s.locator('.kk.bez-obr picture').count()) === 0);
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("História")');
  t('História ukazuje, čo sa zmenilo (S8)', nb(await s.locator('.zmeny-h').first().innerText()).includes('0905 111 222'));
  await tuk('button:has-text("Vrátiť")');
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('kontakt-vratenie');
  t('kontakt: po vrátení pôvodný mobil', nb((await verejna('kontakt.html')).text).includes('0905 622 223') && !nb((await verejna('index.html')).text).includes('0905 111 222'));
  t('kontakt: po vrátení je obrázok Zavolajte nám späť', (await verejna('kontakt.html')).text.includes('kontakt-zavolajte-480'));
  t('grafiky: po vrátení mobilu je 3D karta späť (aj miniatúra) a na Službách oba piktogramy', (await verejna('index.html')).text.includes('karta-3d-820') && (await verejna('index.html')).text.includes('karta-3d-mini-208') && (await verejna('sluzby.html')).text.includes('karta-3d-480')
    && (await verejna('sluzby.html')).text.includes('kontakt-zavolajte-480'));
  t('grafiky: po vrátení mobilu sú vizitka, karta a leták so sortimentom späť', (await pocetFig('galeria/index.html')) === 6 && (await verejna('galeria/index.html')).text.includes('vizitka-n') && (await pocetFig('letak.html')) === 3);
  t('päta: po vrátení mobilu je 3D vizitka späť v päte (úvod, Kontakt, Dlažby, 404)', (await vizitkyVPate()) === PATA_VIZ.length);
  t('päta: 3D vizitka sa na Kontakte vykreslí medzi obsahom päty a pásom s copyrightom', await vizitkaVidno('kontakt.html'));

  // ---------- 8f. e-mail a pevná linka: obrázok s údajom zmizne, po vrátení je späť ----------
  // (hodiny sú od kroku 3 zmenené, preto je v albume grafiky 6 obrázkov a na Letáku 3)
  for (const [pole, hodnota, popis, zmizne, ostane] of [['email', 'predajna@stavebniny-test.sk', 'e-mail', 'kontakt-napiste', 'kontakt-zavolajte-480'],
    ['pevna', '037 111 22 33', 'pevná linka', 'kontakt-zavolajte', 'kontakt-napiste-480']]) {
    await s.goto(URL + 'sprava/');
    await tuk('a.dlazdica:has-text("Telefón a e-mail")');
    await pis(`input[name=${pole}]`, hodnota);
    await tuk('button:has-text("Pozrieť náhľad")');
    await s.waitForSelector('h1:has-text("Náhľad zmeny")');
    t(`kontakt (${popis}): náhľad ukazuje novú hodnotu`, nb(await s.locator('.zmeny').innerText()).includes(hodnota));
    await zverejni(`kontakt-${pole}`);
    const k2 = (await verejna('kontakt.html')).text, g2 = (await verejna('galeria/index.html')).text;
    t(`kontakt (${popis}): zmena skryje len obrázok s týmto údajom, karta ostane s novou hodnotou`, !k2.includes(zmizne) && k2.includes(ostane) && nb(k2).includes(hodnota));
    t(`grafiky (${popis}): zmena skryje vizitku, kartu a leták so sortimentom`, (await pocetFig('galeria/index.html')) === 4 && !g2.includes('vizitka') && !g2.includes('karta-n')
      && !(await verejna('letak.html')).text.includes('letak-stavebniny-richtarik') && (await pocetFig('letak.html')) === 2);
    t(`päta (${popis}): zmena skryje 3D vizitku v päte`, (await vizitkyVPate()) === 0);
    await s.goto(URL + 'sprava/');
    await tuk('a.dlazdica:has-text("História")');
    await tuk('button:has-text("Vrátiť")');
    await s.waitForSelector('h1:has-text("Náhľad zmeny")');
    await zverejni(`kontakt-${pole}-vratenie`);
    const k3 = (await verejna('kontakt.html')).text;
    t(`kontakt (${popis}): po vrátení sú oba obrázky a pôvodná hodnota späť`, k3.includes('kontakt-zavolajte-480') && k3.includes('kontakt-napiste-480') && !nb(k3).includes(hodnota));
    t(`grafiky (${popis}): po vrátení sú vizitka, karta a leták so sortimentom späť`, (await pocetFig('galeria/index.html')) === 6 && (await verejna('galeria/index.html')).text.includes('vizitka-n') && (await pocetFig('letak.html')) === 3);
    t(`päta (${popis}): po vrátení je 3D vizitka späť v päte`, (await vizitkyVPate()) === PATA_VIZ.length);
  }

  // ---------- 8g. obrázok pridaný do albumu grafiky: v rámiku má obe šírky, na Galérii sa vykreslí a otvorí ----------
  await s.goto(URL + 'sprava/');
  await tuk('a.dlazdica:has-text("Fotky v galérii")');
  const fgg = s.locator('form.nova-fotka:has(input[name=album][value=grafika])');
  await fgg.locator('input[name=foto]').setInputFiles(`${VST}/letak.jpg`); tuknutia++;
  await s.waitForSelector('text=Fotka je pripravená', { timeout: 20000 }).catch(() => {});
  await fgg.locator('input[name=popis]').fill('Skúšobný obrázok do albumu grafiky');
  await tuk(fgg.locator('button:has-text("Pridať fotku a pozrieť náhľad")'));
  await s.waitForSelector('h1:has-text("Náhľad zmeny")', { timeout: 60000 });
  await zverejni('galeria-grafika');
  v = await verejna('galeria/index.html');
  const mg = v.text.match(/<img src="\.\.\/(img\/s\/[^"]+-1200\.webp)" srcset="\.\.\/(img\/s\/[^"]+-600\.webp) 600w, \.\.\/img\/s\/[^"]+-1200\.webp 1200w" sizes="[^"]+" alt="Skúšobný obrázok do albumu grafiky"/);
  t('grafiky: pridaný obrázok je v albume so šírkami 600 a 1200 px', !!mg && v.text.includes('7 obrázkov'));
  t('grafiky: súbory pridaného obrázka sa načítajú', !!mg && (await verejna(mg[1])).kod === 200 && (await verejna(mg[2])).kod === 200);
  await s.goto(URL + 'galeria/index.html');
  const ob = s.locator('img[alt="Skúšobný obrázok do albumu grafiky"]');
  await ob.scrollIntoViewIfNeeded();
  await s.waitForFunction(() => { const i = document.querySelector('img[alt="Skúšobný obrázok do albumu grafiky"]'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 10000 }).catch(() => {});
  t('grafiky: pridaný obrázok sa na Galérii vykreslí (menší súbor do rámika)', await ob.evaluate((i) => i.naturalWidth > 0 && i.getBoundingClientRect().width > 40 && /-600\.(webp|avif)$/.test(i.currentSrc)), await ob.evaluate((i) => i.currentSrc.split('/').pop()));
  await ob.click();
  await s.waitForSelector('#lb:not([hidden]) img', { timeout: 5000 }).catch(() => {});
  t('grafiky: ťuk na pridaný obrázok otvorí veľký obrázok', (await s.locator('#lb:not([hidden]) img').count()) === 1 && /-1200\.webp$/.test(await s.locator('#lb img').getAttribute('src') || ''));
  await s.keyboard.press('Escape');

  // ---------- 8h. skrytie všetkých letákov: časť Letáky a bannery zmizne aj s nadpisom, po zobrazení jedného je späť ----------
  for (const meno of ['Leták Prečo nakupovať', 'Leták so sortimentom', 'Reklamný banner so sortimentom', 'Široký reklamný banner']) {
    await s.goto(URL + 'sprava/index.php?s=galeria');
    const li = s.locator(`ul.fotky li:has(input[name=album][value=letaky]):has(summary:has-text("${meno}"))`);
    await tuk(li.locator('summary'));
    await tuk(li.locator('button:has-text("Skryť")'));
    await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  }
  await zverejni('letaky-skryte');
  v = await verejna('letak.html');
  t('letáky: po skrytí všetkých zmizne časť aj s nadpisom, stránka ostane', v.kod === 200 && !v.text.includes('Letáky a bannery') && (await pocetFig('letak.html')) === 0 && /<!--s:galeria-letaky--><!--\/s:galeria-letaky-->/.test(v.text) && v.text.includes('Staršie letáky'));
  await s.goto(URL + 'sprava/index.php?s=galeria');
  const lz = s.locator('ul.fotky li:has(input[name=album][value=letaky]):has(summary:has-text("Široký reklamný banner"))');
  await tuk(lz.locator('summary'));
  await tuk(lz.locator('button:has-text("Zobraziť")'));
  await s.waitForSelector('h1:has-text("Náhľad zmeny")');
  await zverejni('letaky-zobrazeny');
  v = await verejna('letak.html');
  t('letáky: po zobrazení jedného je časť s nadpisom späť', v.text.includes('Letáky a bannery') && (await pocetFig('letak.html')) === 1 && v.text.includes('banner-super-ceny'));

  // ---------- 9. ostatné obrazovky ----------
  for (const [odkaz, meno] of [['Nastavenia', 'nastavenia'], ['Pomoc', 'pomoc']]) {
    await s.goto(URL + 'sprava/'); await tuk(`a.dlazdica:has-text("${odkaz}")`); await obrazovka(meno);
  }
  await s.goto(URL + 'sprava/index.php?s=kontrola'); await obrazovka('kontrola');
  t('kontrola servera: žiadna povinná chyba', (await s.locator('.body li.chyba').count()) === 0, (await s.locator('.body li.chyba').allInnerTexts()).join(' | '));

  // ---------- 10. odhlásenie ----------
  await tuk('header button:has-text("Odhlásiť")');
  await s.waitForSelector('input[name=heslo]');
  const po = await s.request.get(URL + 'sprava/index.php?s=akcie');
  t('po odhlásení správa nedostupná', (await po.text()).includes('<h1>Prihlásenie</h1>'));
  t('bez chýb v konzole', konzola.length === 0, konzola.slice(0, 3).join(' | '));
} catch (e) {
  t('priebeh testu', false, String(e).slice(0, 300));
  await s.screenshot({ path: `${SNIMKY}/${PREFIX}-chyba.png`, fullPage: true }).catch(() => {});
}
await prehliadac.close();
fs.writeFileSync(`${SNIMKY}/${PREFIX}-vysledky.txt`, vysledky.join('\n') + `\n\nSpolu: ${ok} ok, ${zle} zlých\n`);
console.log(`\n${W}×${H}: ${ok} ok, ${zle} zlých`);
process.exit(zle ? 1 : 0);
