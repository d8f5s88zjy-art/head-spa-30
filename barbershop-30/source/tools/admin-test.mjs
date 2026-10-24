#!/usr/bin/env node
// Test adminu webu (admin/index.html, admin/admin.js) s falošným GitHubom: nič sa neposiela von.
//   node source/tools/admin-test.mjs [--out=dir] [--zoznam]
// Falošný GitHub drží súbory repozitára v pamäti (začína z lokálnych súborov) a commit ich naozaj zmení, takže druhé
// načítanie po uložení vidí novú verziu. Kontroly: prihlásenie (zlý kľúč, kľúč len na čítanie, správny kľúč), záložky,
// zmena textu (index.html na mieste, preklad sa presunie na nový kľúč), cenník (index aj rezervacia.html, preklady,
// znalosti asistenta, odpovede so starou cenou na kontrolu a blok uloženia pri nesúlade), tím (popis, fotka WebP a JPEG,
// nový člen, odpovede asistenta o tíme), galéria (popis), commit do main jedným posunom vetvy, súbeh (web sa zmenil inde),
// telefón 390 px bez vodorovného pretekania.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOT = path.resolve(SITE, '..');
const { startStaticServer } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'admin'));
fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const NB = ' ';

/* ---------- falošný GitHub ---------- */
const API = 'https://api.github.com/repos/d8f5s88zjy-art/head-spa-30';
const repo = new Map();            // cesta -> Buffer (len súbory, ktoré admin číta alebo zapisuje)
const blobs = new Map();           // sha -> Buffer
const commits = new Map();         // sha -> { tree: Map, parents, message }
let head = 'c0', blobN = 0, treeN = 0, commitN = 0;
const log = [];
const precitaj = (c) => fs.readFileSync(path.join(ROOT, c));
const LANGS = ['en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const KONTAKT = ['barbershop-30/assets/app.js', 'barbershop-30/assets/asistent.js', 'barbershop-30/assets/objednavka.js', 'barbershop-30/assets/asistent-ukazka.js', 'barbershop-30/assets/karty.js',
  'barbershop-30/assets/barbershop30.vcf', 'barbershop-30/karta/index.html', 'barbershop-30/karta/karta.js', 'vernost/karta/karta.js', 'vernost/lib/jadro.php', 'vernost/ochrana-udajov.html',
  'asistent/lib/jadro.php', 'asistent/api.php', 'asistent/ochrana-udajov.html', 'CLAUDE.md'];
const CESTY = ['barbershop-30/index.html', 'barbershop-30/rezervacia.html', 'asistent/znalosti/barbershop.md', 'asistent/znalosti/barbershop-otazky.json', 'barbershop-30/assets/asistent-otazky.json', ...LANGS.map((l) => `barbershop-30/assets/i18n/${l}.json`), ...KONTAKT];
const stromy = new Map();
stromy.set('t0', new Map(CESTY.map((c) => [c, precitaj(c)])));
commits.set('c0', { tree: 't0', parents: [], message: 'začiatok' });
const subor = (c) => stromy.get(commits.get(head).tree).get(c);
let rezim = { pravo: true, kluc: 'github_pat_dobry' };

async function github(route) {
  const req = route.request(), u = new URL(req.url()), m = req.method();
  const auth = req.headers()['authorization'] || '';
  const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  log.push(`${m} ${u.pathname.replace('/repos/d8f5s88zjy-art/head-spa-30', '')}`);
  if (auth !== `Bearer ${rezim.kluc}`) return json(401, { message: 'Bad credentials' });
  const p = u.pathname.replace('/repos/d8f5s88zjy-art/head-spa-30', '');
  if (p === '' && m === 'GET') return json(200, { full_name: 'd8f5s88zjy-art/head-spa-30', permissions: { pull: true, push: rezim.pravo } });
  if (p === '/git/ref/heads/main') return json(200, { object: { sha: head } });
  if (p.startsWith('/contents/')) {
    const c = decodeURIComponent(p.slice('/contents/'.length)), ref = u.searchParams.get('ref');
    const t = stromy.get(commits.get(ref).tree).get(c);
    if (!t) return json(404, { message: 'Not Found' });
    return json(200, { sha: 'x', content: t.toString('base64').replace(/(.{60})/g, '$1\n') });
  }
  if (p.startsWith('/git/commits/') && m === 'GET') { const c = commits.get(p.split('/').pop()); return json(200, { sha: p.split('/').pop(), tree: { sha: c.tree } }); }
  if (p === '/git/blobs' && m === 'POST') {
    const b = JSON.parse(req.postData()); const sha = `b${++blobN}`;
    blobs.set(sha, Buffer.from(b.content, b.encoding === 'base64' ? 'base64' : 'utf8'));
    return json(201, { sha });
  }
  if (p === '/git/trees' && m === 'POST') {
    const b = JSON.parse(req.postData()); const t = new Map(stromy.get(b.base_tree));
    for (const e of b.tree) t.set(e.path, blobs.get(e.sha));
    const sha = `t${++treeN}`; stromy.set(sha, t); return json(201, { sha });
  }
  if (p === '/git/commits' && m === 'POST') {
    const b = JSON.parse(req.postData()); const sha = `c${++commitN}`;
    commits.set(sha, { tree: b.tree, parents: b.parents, message: b.message, zmenene: [...stromy.get(b.tree).keys()].filter((k) => stromy.get(b.tree).get(k) !== stromy.get(commits.get(b.parents[0]).tree).get(k)) });
    return json(201, { sha });
  }
  if (p === '/git/refs/heads/main' && m === 'PATCH') {
    const b = JSON.parse(req.postData());
    if (!commits.get(b.sha).parents.includes(head)) return json(422, { message: 'Update is not a fast forward' });
    head = b.sha; return json(200, { object: { sha: head } });
  }
  return json(404, { message: 'nepoznám ' + m + ' ' + p });
}

const srv = await startStaticServer(SITE);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.route('https://api.github.com/**', github);
// náhľady fotiek z raw.githubusercontent.com: z lokálnych súborov
await ctx.route('https://raw.githubusercontent.com/**', (route) => {
  const c = new URL(route.request().url()).pathname.split('/').slice(4).join('/');
  const abs = path.join(ROOT, c);
  return fs.existsSync(abs) ? route.fulfill({ status: 200, body: fs.readFileSync(abs), contentType: c.endsWith('.webp') ? 'image/webp' : 'image/jpeg' }) : route.fulfill({ status: 404, body: '' });
});
const page = await ctx.newPage();
const chyby = [];
page.on('pageerror', (e) => chyby.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) chyby.push(m.text()); });
page.on('dialog', (d) => d.accept());
const URL0 = `${srv.origin}/admin/`;
await page.goto(URL0);

/* ---------- prihlásenie ---------- */
console.log('\nprihlásenie');
await page.fill('#token', 'github_pat_zly');
await page.click('#prihlasit');
await page.waitForFunction(() => /platný/.test(document.querySelector('#loginMsg').textContent));
ok(true, 'zlý kľúč: správa o neplatnom kľúči');
rezim.pravo = false;
await page.fill('#token', 'github_pat_dobry');
await page.click('#prihlasit');
await page.waitForFunction(() => /len právo čítať/.test(document.querySelector('#loginMsg').textContent));
ok(true, 'kľúč len na čítanie: správa o práve zapisovať');
rezim.pravo = true;
// web ešte nie je v main: chýba rezervacia.html
const rezSubor = stromy.get('t0').get('barbershop-30/rezervacia.html');
stromy.get('t0').delete('barbershop-30/rezervacia.html');
await page.fill('#token', 'github_pat_dobry');
await page.click('#prihlasit');
await page.waitForFunction(() => /nie je zverejnený/.test(document.querySelector('#loginMsg').textContent));
ok(await page.evaluate(() => localStorage.getItem('b30.admin')) === 'github_pat_dobry', 'web ešte nie je v main: správa, kľúč ostal');
stromy.get('t0').set('barbershop-30/rezervacia.html', rezSubor);
await page.fill('#token', 'github_pat_dobry');
await page.click('#prihlasit');
await page.waitForSelector('#app:not([hidden]) .tab[data-tab="texty"] .blk');
ok(await page.isHidden('#login'), 'správny kľúč: prihlásený, texty načítané');
ok(await page.evaluate(() => localStorage.getItem('b30.admin')) === 'github_pat_dobry', 'kľúč zapamätaný v prehliadači');
const taby = await page.$$eval('#tabs button', (b) => b.map((x) => x.textContent));
ok(taby.join('|') === 'Texty|Cenník|Tím|Galéria|Kontakt a hodiny|Odpovede asistenta|Kartička', 'záložky', taby.join(', '));
await page.screenshot({ path: path.join(OUT, 'admin-texty-390.png') });

const info = await page.evaluate(() => ({
  texty: document.querySelectorAll('.tab[data-tab="texty"] .blk').length,
  sekcie: [...document.querySelectorAll('.tab[data-tab="texty"] [data-sekcia]')].map((s) => `${s.querySelector('h2').textContent} ${s.querySelectorAll('.blk').length}`),
  cennik: document.querySelectorAll('.tab[data-tab="cennik"] .card').length,
  tim: document.querySelectorAll('.tab[data-tab="tim"] .card').length,
  galeria: document.querySelectorAll('.tab[data-tab="galeria"] .card').length,
  odpovede: document.querySelectorAll('.tab[data-tab="odpovede"] .blk').length,
  bezPrekladu: [...document.querySelectorAll('.tab[data-tab="texty"] .blk')].filter((b) => !b.querySelector('details.tr')).map((b) => b.querySelector('input,textarea').value),
}));
ok(info.texty > 100, 'texty webu po častiach', `${info.texty} polí: ${info.sekcie.join(', ')}`);
ok(info.cennik === 15, 'cenník: 15 služieb', String(info.cennik));
ok(info.tim === 10, 'tím: 10 ľudí', String(info.tim));
ok(info.galeria > 0, 'galéria', String(info.galeria));
ok(info.odpovede >= 250, 'odpovede asistenta', String(info.odpovede));
if (opt.zoznam) console.log('bez prekladu:', JSON.stringify(info.bezPrekladu, null, 1), '\nostatné:', await page.$$eval('[data-sekcia="ine"] .blk, [data-sekcia="rez"] .blk', (b) => b.map((x) => x.querySelector('input,textarea').value).join(' | ')));
ok(info.bezPrekladu.filter((t) => /[a-záäčďéíĺľňóôŕšťúýž]{3}/i.test(t)).length < 15, 'takmer každý text má preklady', `${info.bezPrekladu.length} bez prekladu`);

/* ---------- uloženie 1: text, cena, popis tímu ---------- */
console.log('\nuloženie: text, cena, tím');
const idx0 = subor('barbershop-30/index.html').toString();
const rez0 = subor('barbershop-30/rezervacia.html').toString();
const en0 = JSON.parse(subor('barbershop-30/assets/i18n/en.json'));
// text: prvý odsek s „Objednať“ v úvode? vezmeme konkrétny nadpis z hookov
const hook = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.tab[data-tab="texty"] .blk')].find((x) => /háčik|Objednaj|Vyber si/.test(x.querySelector('input,textarea').value) && x.querySelector('details.tr'));
  const el = b.querySelector('input,textarea'); return el.value;
});
ok(!!hook, 'text s prekladom nájdený', hook);
const novyText = hook.replace(/\.?$/, ' dnes.').replace(/\s+dnes\. dnes\.$/, ' dnes.');
await page.evaluate(({ stary, novy }) => {
  const el = [...document.querySelectorAll('.tab[data-tab="texty"] .blk input, .tab[data-tab="texty"] .blk textarea')].find((x) => x.value === stary);
  el.value = novy; el.dispatchEvent(new Event('input'));
}, { stary: hook, novy: novyText });
ok((await page.textContent('#pocet')) === '1 zmena', 'lišta: 1 zmena', await page.textContent('#pocet'));

// cenník: Pánsky strih (data-sluzba 1)
await page.click('#tabs button[data-tab="cennik"]');
const kartaCena = page.locator('.tab[data-tab="cennik"] .card').first();
await kartaCena.locator(':scope > summary').click();
const staraCena = await kartaCena.locator('input[inputmode="decimal"]').inputValue();
const novaCena = String(Number(staraCena.replace(',', '.')) + 1).replace('.', ',');
await kartaCena.locator('input[inputmode="decimal"]').fill(novaCena);
const kontrola = await page.$$eval('.tab[data-tab="odpovede"] .note li', (l) => l.map((x) => x.textContent));
ok(kontrola.length > 0, 'odpovede so starou cenou na kontrolu', `${kontrola.length}: ${kontrola.slice(0, 2).join(' | ')}`);
await page.screenshot({ path: path.join(OUT, 'admin-cennik-390.png') });

// tím: popis prvého barbera
await page.click('#tabs button[data-tab="tim"]');
const kartaTim = page.locator('.tab[data-tab="tim"] .card').first();
await kartaTim.locator(':scope > summary').click();
const meno1 = (await kartaTim.locator('.nm').textContent()).trim();
const bio = kartaTim.locator('textarea');
const bio0 = await bio.inputValue();
await bio.fill(bio0.replace(/\.$/, '') + ' a s úsmevom.');
// fotka galérie a nová fotka člena tímu: vygenerovaná v prehliadači
const foto = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 1500;
  const g = c.getContext('2d'); g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, 1200, 1500); g.fillStyle = '#e0601c'; g.fillRect(300, 300, 600, 600);
  const b = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9));
  return [...new Uint8Array(await b.arrayBuffer())];
});
await kartaTim.locator('input[type=file]').setInputFiles({ name: 'foto.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(foto) });
await page.waitForFunction(() => /nová fotka/.test(document.querySelector('#zoznam').textContent));
ok(true, 'fotka člena tímu pripravená');
await page.screenshot({ path: path.join(OUT, 'admin-tim-390.png') });

const pocet = await page.textContent('#pocet');
ok(/^\d+ zm/.test(pocet), 'lišta so zmenami', pocet);
await page.click('#ulozit');
await page.waitForFunction(() => { const m = document.querySelector('#saveMsg'); return !m.hidden && /Uložené|Neuložené/.test(m.textContent); }, null, { timeout: 30000 });
const sprava = await page.textContent('#saveMsg');
ok(/^Uložené/.test(sprava), 'uloženie prešlo', sprava);

const c1 = commits.get(head);
ok(head === 'c1' && c1.parents[0] === 'c0', 'jeden commit, vetva posunutá', head);
ok(/^Barbershop 30, úprava webu: /.test(c1.message) && !/claude|ai\b|anthropic/i.test(c1.message), 'správa commitu', c1.message);
console.log('     zmenené súbory: ' + c1.zmenene.join(', '));
const idx1 = subor('barbershop-30/index.html').toString(), rez1 = subor('barbershop-30/rezervacia.html').toString();
const en1 = JSON.parse(subor('barbershop-30/assets/i18n/en.json'));
const md1 = subor('asistent/znalosti/barbershop.md').toString();
const faq1 = JSON.parse(subor('asistent/znalosti/barbershop-otazky.json'));
const faqWeb1 = JSON.parse(subor('barbershop-30/assets/asistent-otazky.json'));
const n = (s) => s.replace(/\s+/g, ' ').trim();
ok(n(idx1).includes(n(novyText)) && !n(idx1).includes(n(hook) + '<'), 'index.html: nový text na mieste', novyText);
ok(en1[n(novyText)] === en0[n(hook)] && !(n(hook) in en1), 'preklad presunutý na nový kľúč');
const cenaRe = (c) => new RegExp(`<p class="price-amount">${c}[\\s${NB}]€</p>`);
const riadok = (h, id) => { const i = h.indexOf(`data-sluzba="${id}"`); return h.slice(h.lastIndexOf('<li class="price-row"', i), i); };
ok(cenaRe(novaCena).test(riadok(idx1, 1)) && cenaRe(novaCena).test(riadok(rez1, 1)), 'cena v index.html aj rezervacia.html', novaCena);
ok(md1.includes(`– ${novaCena} €`) && md1.split('\n').some((r) => r.startsWith('- Pánsky strih –') && r.includes(`${novaCena} €`)), 'znalosti asistenta: nová cena');
const staraVOdp = faq1.otazky.filter((o) => new RegExp(`(^|[^\\d,])${staraCena}[\\s${NB}]€`).test(o.a));
ok(staraVOdp.length === 0 || staraVOdp.every((o) => /Pánsky strih/.test(o.a) === false), 'odpovede asistenta bez starej ceny Pánskeho strihu', staraVOdp.map((o) => o.id).join(','));
ok(JSON.stringify(faq1.otazky) === JSON.stringify(faqWeb1.otazky), 'kópia odpovedí pre web zhodná');
ok(faq1.otazky.length === JSON.parse(precitaj('asistent/znalosti/barbershop-otazky.json')).otazky.length, 'počet odpovedí rovnaký', String(faq1.otazky.length));
const timOdp = faq1.otazky.find((o) => o.id === `tim-${meno1.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`);
ok(timOdp && /s úsmevom/.test(timOdp.a), 'odpoveď o členovi tímu má nový popis', timOdp ? timOdp.a.slice(0, 90) : 'chýba');
ok(n(rez1).includes('a s úsmevom.') && n(idx1).includes('a s úsmevom.'), 'popis tímu v oboch súboroch');
const nove = c1.zmenene.filter((c) => /assets\/img\/tim-/.test(c));
ok(nove.some((c) => c.endsWith('.webp')) && nove.some((c) => c.endsWith('.jpg')), 'fotka tímu ako WebP aj JPEG', nove.join(', '));
for (const c of nove) {
  const b = subor(c);
  ok(b.length > 1000 && (c.endsWith('.webp') ? b.slice(8, 12).toString() === 'WEBP' : b[0] === 0xff && b[1] === 0xd8), `obrázok ${path.basename(c)}`, `${b.length} B`);
  ok(idx1.includes(c.replace('barbershop-30/', '')), `index.html odkazuje na ${path.basename(c)}`);
}
// zvyšok súborov bez nechcených zmien: rozdiel len v zmenených riadkoch
const rozdiel = (a, b) => { const x = a.split('\n'), y = b.split('\n'); let i = 0; while (i < x.length && x[i] === y[i]) i++; let j = 0; while (j < x.length - i && x[x.length - 1 - j] === y[y.length - 1 - j]) j++; return { od: i + 1, x: x.length - i - j, y: y.length - i - j }; };
console.log('     index.html rozdiel', JSON.stringify(rozdiel(idx0, idx1)), 'rezervacia.html', JSON.stringify(rozdiel(rez0, rez1)));
const pocty = (h) => ['<li class="team-card', '<li class="price-row', '<picture>', '</picture>', '<section', '</section>', '<li', '</li>'].map((x) => h.split(x).length).join(',');
ok(pocty(idx1) === pocty(idx0) && pocty(rez1) === pocty(rez0), 'štruktúra HTML rovnaká (karty, riadky, obrázky, sekcie)');
const karta1 = idx1.slice(idx1.indexOf('<li class="team-card'), idx1.indexOf('</li>', idx1.indexOf('<li class="team-card')));
ok(!/avif|tim-nikolas-480/.test(karta1) && /--focal: 50% 35%/.test(karta1), 'stará fotka nahradená celá, ohnisko zachované');

/* ---------- nová verzia po uložení ---------- */
await page.waitForSelector('.tab[data-tab="texty"] .blk', { state: 'attached' });
ok((await page.textContent('#pocet')) === 'Žiadne zmeny', 'po uložení načítaná nová verzia bez zmien');

/* ---------- blok pri nesúlade cien ---------- */
console.log('\nkontrola pred uložením');
await page.click('#tabs button[data-tab="cennik"]');
const k2 = page.locator('.tab[data-tab="cennik"] .card').nth(1);
await k2.locator(':scope > summary').click();
await k2.locator('input[inputmode="decimal"]').fill('abc');
await page.click('#ulozit');
await page.waitForFunction(() => /Neuložené/.test(document.querySelector('#saveMsg').textContent));
ok(/napr. 18 alebo 21,50/.test(await page.textContent('#saveMsg')), 'zlá cena zablokuje uloženie');
ok(head === 'c1', 'nič sa neuložilo');
await page.click('#zrusit');
await page.waitForFunction(() => document.querySelector('#pocet').textContent === 'Žiadne zmeny');
ok(true, 'zrušenie zmien');

/* ---------- súbeh: web sa medzitým zmenil ---------- */
console.log('\nsúbeh');
await page.click('#tabs button[data-tab="galeria"]');
const g1 = page.locator('.tab[data-tab="galeria"] .card').first();
await g1.locator(':scope > summary').click();
const alt0 = await g1.locator('textarea').inputValue();
await g1.locator('textarea').fill(alt0 + ' Detail.');
commits.set('cx', { tree: commits.get(head).tree, parents: [head], message: 'iné uloženie' }); head = 'cx';
await page.click('#ulozit');
await page.waitForFunction(() => /Neuložené|zmenil inde/.test(document.querySelector('#saveMsg').textContent));
ok(/zmenil inde/.test(await page.textContent('#saveMsg')), 'súbeh: správa, nič neprepísané');
ok(head === 'cx', 'vetva ostala na cudzom uložení');

/* ---------- galéria po obnovení ---------- */
await page.reload();
await page.waitForSelector('#app:not([hidden]) .tab .blk', { state: 'attached' });
ok(await page.isHidden('#login'), 'po obnovení prihlásený zapamätaným kľúčom');
await page.click('#tabs button[data-tab="galeria"]');
const g2 = page.locator('.tab[data-tab="galeria"] .card').first();
await g2.locator(':scope > summary').click();
await g2.locator('textarea').fill(alt0 + ' Detail.');
await page.click('#ulozit');
await page.waitForFunction(() => /Uložené|Neuložené/.test(document.querySelector('#saveMsg').textContent), null, { timeout: 30000 });
ok(/^Uložené/.test(await page.textContent('#saveMsg')), 'galéria uložená', await page.textContent('#saveMsg'));
const idx2 = subor('barbershop-30/index.html').toString();
ok(idx2.includes(`alt="${alt0} Detail."`) && idx2.includes(`data-lightbox-alt="${alt0} Detail."`), 'popis fotky aj zväčšenia');

/* ---------- nový člen tímu ---------- */
console.log('\nnový člen tímu');
await page.click('#tabs button[data-tab="tim"]');
await page.click('text=+ Pridať člena tímu');
const nk = page.locator('.tab[data-tab="tim"] .card').last();
const vstupy = nk.locator('input[type=text]');
await vstupy.nth(0).fill('Testovací');
await nk.locator('textarea').fill('Klasické strihy.');
await page.click('#ulozit');
await page.waitForFunction(() => /Neuložené|Uložené/.test(document.querySelector('#saveMsg').textContent));
ok(/potrebuje fotku/.test(await page.textContent('#saveMsg')), 'nový člen bez fotky: výzva na fotku');
await nk.locator('input[type=file]').setInputFiles({ name: 'novy.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(foto) });
await page.waitForFunction(() => [...document.querySelectorAll('.tab[data-tab="tim"] .card')].pop().querySelector('img').src.startsWith('blob:'));
await page.evaluate(() => { document.querySelector('#saveMsg').textContent = ''; });
await page.click('#ulozit');
await page.waitForFunction(() => /^(Uložené|Neuložené)/.test(document.querySelector('#saveMsg').textContent), null, { timeout: 30000 });
ok(/^Uložené/.test(await page.textContent('#saveMsg')), 'nový člen uložený', await page.textContent('#saveMsg'));
const idx3 = subor('barbershop-30/index.html').toString(), rez3 = subor('barbershop-30/rezervacia.html').toString();
const faq3 = JSON.parse(subor('asistent/znalosti/barbershop-otazky.json'));
ok((idx3.match(/class="team-card/g) || []).length === 11 && idx3.includes('<h3 class="team-name">Testovací</h3>'), 'karta v index.html');
const kartaRez = rez3.slice(rez3.lastIndexOf('<li class="team-card', rez3.indexOf('Testovací')), rez3.indexOf('</li>', rez3.indexOf('Testovací')) + 5);
ok(/fetchpriority="low"/.test(kartaRez) && /\n {16}<source type="image\/webp"/.test(kartaRez) && /\n {14}<\/picture>/.test(kartaRez), 'karta v rezervacia.html (odsadenie, fetchpriority)');
if (opt.zoznam) console.log(kartaRez);
ok(faq3.otazky.some((o) => o.id === 'tim-testovaci') && /Testovací/.test(faq3.otazky.find((o) => o.id === 'tim').a), 'odpovede asistenta o tíme');
ok(/Testovací/.test(subor('asistent/znalosti/barbershop.md').toString().match(/^Barberi: .*$/m)[0]), 'znalosti: zoznam barberov');
ok(JSON.parse(subor('barbershop-30/assets/i18n/en.json'))['Testovací'] === 'Testovací', 'meno v prekladoch');

/* ---------- kontakt a hodiny ---------- */
console.log('\nkontakt a hodiny');
await page.click('#tabs button[data-tab="kontakt"]');
const kon = page.locator('.tab[data-tab="kontakt"]');
ok(await kon.locator('input[type=tel]').inputValue() === '0951 267 203' && await kon.locator('input[type=email]').inputValue() === 'info@barbershop30.sk', 'kontakt načítaný z webu');
const selecty = kon.locator('select');
ok((await selecty.evaluateAll((s) => s.map((x) => x.value))).join(',') === '9,19,9,14', 'hodiny načítané z app.js (Po–Pi 9–19, So 9–14)');
await kon.locator('input[type=tel]').fill('0905 12 34 5');
await page.waitForFunction(() => /mobil v tvare/.test(document.querySelector('.tab[data-tab="kontakt"] .warn[role=status]').textContent));
ok(true, 'zlý telefón: upozornenie, nič sa nemení');
await kon.locator('input[type=tel]').fill('0905 123 456');
await kon.locator('input[type=email]').fill('rezervacie@barbershop30.sk');
await selecty.nth(1).selectOption('20');
await selecty.nth(2).selectOption('10');
await page.waitForFunction(() => /Zmení sa \d+/.test(document.querySelector('.tab[data-tab="kontakt"]').textContent));
const nahlad = await kon.textContent();
ok(/Zmení sa \d+ miest v \d+ súboroch/.test(nahlad), 'náhľad: počet miest a súborov', (nahlad.match(/Zmení sa [^.]+\./) || [''])[0]);
ok(/Na kontrolu/.test(nahlad) && /otvárame o 9:00/.test(nahlad), 'náhľad: vety s časom otvorenia bez dňa na kontrolu');
await page.screenshot({ path: path.join(OUT, 'admin-kontakt-390.png') });
ok((await page.textContent('#zoznam')).includes('Kontakt: telefón 0905 123 456'), 'zoznam zmien: telefón');
await page.evaluate(() => { document.querySelector('#saveMsg').textContent = ''; });
await page.click('#ulozit');
await page.waitForFunction(() => /^(Uložené|Neuložené)/.test(document.querySelector('#saveMsg').textContent), null, { timeout: 30000 });
ok(/^Uložené/.test(await page.textContent('#saveMsg')), 'kontakt a hodiny uložené', await page.textContent('#saveMsg'));
const kc = commits.get(head);
console.log('     zmenené: ' + kc.zmenene.map((c) => c.replace('barbershop-30/', '')).join(', '));
const vsetky = [...CESTY];
const obsahy = Object.fromEntries(vsetky.map((c) => [c, subor(c).toString()]));
const stare = vsetky.filter((c) => /0951[ \u00a0]267[ \u00a0]203|\+421 ?951 ?267 ?203|0951267203|info@barbershop30\.sk/.test(obsahy[c]));
ok(stare.length === 0, 'starý telefón a e‑mail nikde', stare.join(', '));
ok(obsahy['barbershop-30/index.html'].includes('href="tel:+421905123456"') && obsahy['barbershop-30/index.html'].includes('"telephone": "+421905123456"'), 'index.html: odkazy tel: a údaje pre Google');
ok(obsahy['barbershop-30/assets/barbershop30.vcf'].includes('TEL;TYPE=WORK,VOICE:+421 905 123 456'), 'vizitka: telefón');
ok(obsahy['vernost/lib/jadro.php'].includes("'tel' => '+421905123456', 'tel_text' => '0905 123 456'") && obsahy['vernost/lib/jadro.php'].includes('0911 153 136'), 'kartička na serveri: telefón Barbershopu nový, HEAD SPA nezmenený');
ok(obsahy['vernost/karta/karta.js'] === obsahy['barbershop-30/karta/karta.js'], 'kópie karta.js ostali rovnaké');
ok(/const HOURS = \{ 1: \[9, 20\], 2: \[9, 20\], 3: \[9, 20\], 4: \[9, 20\], 5: \[9, 20\], 6: \[10, 14\], 0: null \};/.test(obsahy['barbershop-30/assets/app.js']), 'app.js: hodiny pre živý stav');
const ix = obsahy['barbershop-30/index.html'];
ok(ix.includes('Po–Pi 9:00–20:00, So 10:00–14:00') && ix.includes('<dd>9:00–20:00</dd>') && ix.includes('<dd>10:00–14:00</dd>') && ix.includes('od 9:00 do 20:00'), 'index.html: hodiny v texte');
ok(ix.includes('"opens": "09:00", "closes": "20:00"') && ix.includes('"opens": "10:00", "closes": "14:00"'), 'index.html: hodiny pre Google');
const en2 = JSON.parse(obsahy['barbershop-30/assets/i18n/en.json']);
ok(en2['Po–Pi 9:00–20:00'] === 'Mon–Fri 9:00–20:00' && en2['So 10:00–14:00'] === 'Sat 10:00–14:00' && !('Po–Pi 9:00–19:00' in en2), 'preklady: kľúč aj preklad s novými hodinami');
ok(/9:00 és 20:00/.test(obsahy['barbershop-30/assets/i18n/hu.json']) && /von 9:00 bis 20:00/.test(obsahy['barbershop-30/assets/i18n/de.json']), 'preklady: maďarčina a nemčina');
const faqK = JSON.parse(obsahy['asistent/znalosti/barbershop-otazky.json']);
const faqT = JSON.stringify(faqK.otazky);
ok(!/\b19:00/.test(faqT) && /od 9:00 do 20:00/.test(faqT) && /sobota 10:00 až 14:00|sobotu (od )?10:00/.test(faqT + obsahy['asistent/znalosti/barbershop.md']), 'odpovede asistenta: nové hodiny');
ok(JSON.stringify(JSON.parse(obsahy['barbershop-30/assets/asistent-otazky.json']).otazky) === faqT, 'kópia odpovedí pre web zhodná');
ok(/pondelok až piatok 9:00 až 20:00, sobota 10:00 až 14:00/.test(obsahy['asistent/znalosti/barbershop.md']), 'znalosti asistenta: hodiny');
ok(obsahy['asistent/lib/jadro.php'].includes('od 9:00 do 20:00') && obsahy['asistent/lib/jadro.php'].includes('o 10:00 a 14:00'), 'pokyny asistenta: hodiny nové, príklad termínov nezmenený');
ok(obsahy['CLAUDE.md'].includes('v pracovné dni od 9:00 do 20:00') && obsahy['CLAUDE.md'].includes('0911 153 136'), 'CLAUDE.md: pravidlo s novými hodinami');
ok(/sobota do 14:00/.test(obsahy['barbershop-30/assets/objednavka.js']) && /'09:00', '09:40'/.test(obsahy['barbershop-30/assets/objednavka.js']), 'ukážka objednávky: termíny nezmenené');
const { execFileSync } = await import('node:child_process');
for (const c of ['vernost/lib/jadro.php', 'asistent/lib/jadro.php', 'asistent/api.php']) {
  const f = path.join(OUT, '..', `.php-${path.basename(c)}`); fs.writeFileSync(f, obsahy[c]);
  let okPhp = true; try { execFileSync('php', ['-l', f], { stdio: 'pipe' }); } catch (e) { okPhp = false; } fs.rmSync(f);
  ok(okPhp, `PHP bez chyby syntaxe: ${c}`);
}
for (const c of KONTAKT.filter((x) => x.endsWith('.js'))) {
  const f = path.join(OUT, '..', `.js-${path.basename(c)}.mjs`); fs.writeFileSync(f, obsahy[c]);
  let okJs = true; try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { okJs = !/SyntaxError/.test(String(e.stderr)); } fs.rmSync(f);
  ok(okJs, `JS bez chyby syntaxe: ${c}`);
}
await page.click('#tabs button[data-tab="kontakt"]');
ok(await page.locator('.tab[data-tab="kontakt"] input[type=tel]').inputValue() === '0905 123 456', 'po uložení načítaný nový telefón');

/* ---------- web po zmenách ---------- */
console.log('\nweb po zmenách');
const TMP = fs.mkdtempSync(path.join(SITE, '.admin-test-'));
try {
  fs.cpSync(path.join(SITE, 'assets'), path.join(TMP, 'assets'), { recursive: true });
  for (const [c, b] of stromy.get(commits.get(head).tree)) if (c.startsWith('barbershop-30/')) { fs.mkdirSync(path.dirname(path.join(TMP, c.slice(14))), { recursive: true }); fs.writeFileSync(path.join(TMP, c.slice(14)), b); }
  for (const [c] of stromy.get(commits.get(head).tree)) if (/assets\/img\/tim-testovaci/.test(c)) { /* nové fotky sú v strome */ }
  const s2 = await startStaticServer(TMP);
  const web = await ctx.newPage();
  const ch2 = [];
  web.on('pageerror', (e) => ch2.push(String(e)));
  await web.goto(`${s2.origin}/index.html`);
  await web.waitForTimeout(800);
  const v = await web.evaluate(() => ({ text: document.body.innerText, sirka: document.documentElement.scrollWidth, karty: document.querySelectorAll('.team-card').length }));
  ok(ch2.length === 0, 'web bez chýb skriptu', ch2.join(' | '));
  ok(v.karty === 11 && v.sirka <= 390, 'web: 11 kariet tímu, bez pretekania', `${v.karty}, ${v.sirka}px`);
  const obr = await web.evaluate(async () => { const i = [...document.querySelectorAll('.team-card img')].pop(); i.loading = 'eager'; i.scrollIntoView(); await new Promise((r) => setTimeout(r, 600)); return { w: i.naturalWidth, src: i.currentSrc }; });
  ok(obr.w > 0, 'fotka nového člena sa načíta', obr.src.split('/').pop());
  await web.goto(`${s2.origin}/index.html?lang=en`);
  await web.waitForTimeout(800);
  const en = await web.evaluate(() => document.body.innerText);
  ok(!en.includes(novyText), 'angličtina: zmenený text je preložený (nie slovensky)');
  ok(en.includes('Mon–Fri 9:00–20:00') && !/9:00–19:00/.test(en), 'angličtina: nové hodiny preložené');
  ok(await web.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')].every((a) => a.getAttribute('href') === 'tel:+421905123456')), 'web: všetky tlačidlá Zavolať na nové číslo');
  const tab = await web.evaluate(() => { const f = document.querySelector('[data-flap] .flap-cells'); return f ? f.textContent : ''; });
  // dnešný deň v Nitre: Po–Pi 9–20, So 10–14, Ne zatvorené
  const dnes = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short' }).format(new Date());
  const cakam = dnes === 'Sat' ? /10:00\s*–\s*14:00/ : dnes === 'Sun' ? /CLOSED|zatvoren/i : /9:00\s*–\s*20:00/;
  ok(cakam.test(tab), `tabuľa hodín: dnes (${dnes}) podľa nových hodín`, tab);
  await web.close(); s2.server.close();
} finally { fs.rmSync(TMP, { recursive: true, force: true }); }

/* ---------- telefón ---------- */
const sirka = await page.evaluate(() => document.documentElement.scrollWidth);
ok(sirka <= 390, 'admin na telefóne bez vodorovného pretekania', `${sirka}px`);
ok(chyby.length === 0, 'admin bez chýb v konzole', chyby.slice(0, 3).join(' | '));
ok(!log.some((l) => /^(PUT|DELETE)/.test(l)), 'žiadne iné zápisy ako blob, strom, commit, posun vetvy');

await browser.close(); srv.server.close();
console.log(`\nVÝSLEDOK: ${failed ? failed + ' zlyhalo' : 'všetko v poriadku'}`);
process.exit(failed ? 1 : 0);
