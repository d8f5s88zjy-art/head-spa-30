/* Lokálny test vernostnej kartičky: API (bezpečnosť, body, odmeny, push), prihláška na oboch weboch, kartička, admin.
   Spúšťa testy/spusti.sh (php -S s routerom, napodobenina push služby, dočasná databáza a config.php). */
import { createRequire } from 'module';
import fs from 'node:fs';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');

const Z = 'http://127.0.0.1:8077', API = `${Z}/vernost/api/`, PUSH = 'http://127.0.0.1:8078';
const SNIMKY = process.env.SNIMKY || '/tmp/vernost-snimky';
fs.mkdirSync(SNIMKY, { recursive: true });
let ok = 0, zle = 0;
const over = (podm, popis, detail = '') => { if (podm) ok++; else { zle++; console.log('  ZLYHALO:', popis, detail); } };
let cookie = '';
async function api(akcia, telo, { admin = false, origin, params = '' } = {}) {
  const h = {};
  if (telo) h['Content-Type'] = 'application/json';
  if (admin) { h['X-Vernost-Admin'] = '1'; if (cookie) h.Cookie = cookie; }
  if (origin) h.Origin = origin;
  const r = await fetch(`${API}?a=${akcia}${params}`, { method: telo ? 'POST' : 'GET', headers: h, body: telo ? JSON.stringify(telo) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && admin) cookie = sc.split(';')[0];
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* CSV */ }
  return { s: r.status, j, t, h: r.headers, sc };
}

const KOREN = new URL('../../', import.meta.url).pathname;
over(fs.readFileSync(`${KOREN}vernost/web/prihlaska.js`, 'utf8') === fs.readFileSync(`${KOREN}barbershop-30/assets/vernost.js`, 'utf8'), 'kópia prihlášky v barbershop-30/assets/vernost.js je aktuálna (cp vernost/web/prihlaska.js barbershop-30/assets/vernost.js)');
console.log('API');
let r = await api('stav');
over(r.j?.ok && r.j.sqlite && r.j.openssl && r.j.admin.barbershop && r.j.admin.headspa, 'stav', r.t);
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Ján Test', telefon: '0951 123 456' });
over(r.s === 400, 'registrácia bez súhlasu sa odmietne', r.t);
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Robot', telefon: '0951 000 000', suhlas_karta: true, web: 'spam' });
over(r.j?.ok && r.j.karta === '', 'pasca na roboty');
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Ján Test', telefon: '0951 12', suhlas_karta: true });
over(r.s === 400, 'zlé číslo');
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Ján Test', telefon: '0951 123 456', suhlas_karta: true }, { origin: 'https://zly.example' });
over(r.s === 403, 'cudzí pôvod sa odmietne');
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Ján Test', telefon: '0951 123 456', email: 'jan@example.sk', suhlas_karta: true, suhlas_spravy: false }, { origin: 'https://d8f5s88zjy-art.github.io' });
over(r.j?.ok && !r.j.existuje && /\/vernost\/karta\/\?k=[A-Za-z0-9_-]{22}$/.test(r.j.karta), 'registrácia z GitHub Pages', r.t);
over(r.h.get('access-control-allow-origin') === 'https://d8f5s88zjy-art.github.io', 'CORS hlavička pre povolený pôvod');
const karta = r.j.karta, token = karta.split('k=')[1];
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Iný', telefon: '+421 951 123 456', suhlas_karta: true });
over(r.j?.ok && r.j.existuje === true && !r.j.karta, 'rovnaké číslo neprezradí kartičku');
r = await api('karta', null, { params: `&k=${token}` });
over(r.j?.meno === 'Ján Test' && r.j.body === 0 && r.j.prevadzka === 'barbershop' && r.j.vapid?.length > 80 && /^[A-HJKMNP-Z2-9]{8}$/.test(r.j.kod) && /T.*Z$/.test(r.j.od), 'kartička', r.t);
const kod = r.j.kod;
r = await api('registracia', { prevadzka: 'barbershop', meno: 'Ten istý', telefon: '+421 0951 123 456', suhlas_karta: true });
over(r.j?.existuje === true, '+421 0951… je to isté číslo ako 0951…');
r = await api('karta', null, { params: '&k=neexistujeneexistuje00' });
over(r.s === 404, 'neexistujúca kartička 404');
r = await fetch(`${API}?a=manifest&k=${token}`);
const man = await r.json();
over(r.headers.get('content-type').startsWith('application/manifest+json') && man.start_url === karta && man.icons.length === 2, 'manifest');

console.log('admin');
r = await api('klienti', null);
over(r.s === 403, 'admin bez hlavičky 403');
r = await api('klienti', null, { admin: true });
over(r.s === 401, 'admin bez prihlásenia 401');
r = await api('prihlasenie', { prevadzka: 'barbershop', heslo: 'zle-heslo' }, { admin: true });
over(r.s === 401, 'zlé heslo');
r = await api('prihlasenie', { prevadzka: 'barbershop', heslo: 'test-heslo-barber' }, { admin: true, origin: Z });
over(r.j?.ok && /HttpOnly/i.test(r.sc) && /SameSite=Strict/i.test(r.sc) && /path=\/vernost\//i.test(r.sc), 'prihlásenie a bezpečná cookie', r.sc);
r = await api('klienti', null, { admin: true, origin: 'https://d8f5s88zjy-art.github.io' });
over(r.s === 403, 'admin z iného (aj povoleného) pôvodu 403');
r = await api('odmena_uloz', { nazov: 'Puder na vlasy zdarma', popis: 'Z ponuky na recepcii.', body: 3 }, { admin: true });
over(r.j?.ok, 'odmena');
await api('odmena_uloz', { nazov: 'Zľava 5 € na strih', body: 8 }, { admin: true });
r = await api('akcia_uloz', { nazov: 'Mesiac študentov', popis: 'Ostrihaj sa a styling máš za polovicu.', od: '2026-10-01', do: '2099-11-30' }, { admin: true });
over(r.j?.ok, 'akcia');
r = await api('akcia_uloz', { nazov: 'Zlé dátumy', od: '2026-10-10', do: '2026-10-01' }, { admin: true });
over(r.s === 400, 'akcia s koncom pred začiatkom');
r = await api('nastavenia_uloz', { body_za_navstevu: 2 }, { admin: true });
const kl = (await api('klienti', null, { admin: true, params: `&q=${encodeURIComponent(karta)}` })).j;
over(kl?.klienti.length === 1 && kl.klienti[0].meno === 'Ján Test', 'hľadanie podľa naskenovaného QR');
const id = kl.klienti[0].id;
over((await api('klienti', null, { admin: true, params: '&q=0951123' })).j.klienti.length === 1, 'hľadanie podľa telefónu');
over((await api('klienti', null, { admin: true, params: '&q=%25' })).j.klienti.length === 0, 'znak % v hľadaní nič nerozbije');
over((await api('klienti', null, { admin: true, params: '&q=jan%20test' })).j.klienti.length === 1, 'hľadanie bez diakritiky a malými písmenami');
over((await api('klienti', null, { admin: true, params: '&q=J%C3%81N' })).j.klienti.length === 1, 'hľadanie veľkými písmenami s diakritikou');
over((await api('klienti', null, { admin: true, params: `&q=${encodeURIComponent('V30:' + kod)}` })).j.klienti[0]?.id === id, 'hľadanie podľa QR kódu recepcie');
over((await api('klienti', null, { admin: true, params: `&q=${kod.slice(0, 4).toLowerCase()}-${kod.slice(4).toLowerCase()}` })).j.klienti[0]?.id === id, 'kód recepcie prepísaný ručne');
r = await api('navsteva', { id }, { admin: true });
over(r.j?.pripisane === 2 && r.j.body === 2, 'návšteva +2', r.t);
r = await api('navsteva', { id }, { admin: true });
over(r.s === 409, 'druhá návšteva do 30 minút sa opýta');
r = await api('navsteva', { id, aj_tak: true }, { admin: true });
over(r.j?.body === 4, 'návšteva aj tak');
const puder = (await api('odmeny', null, { admin: true })).j.polozky.find((o) => o.nazov.startsWith('Puder'));
r = await api('uplatnit', { id, odmena_id: puder.id, body: 2 }, { admin: true });
over(r.s === 409, 'stará cena odmeny sa odmietne');
r = await api('uplatnit', { id, odmena_id: puder.id, body: 3 }, { admin: true });
over(r.j?.body === 1, 'uplatnenie odmeny', r.t);
r = await api('uplatnit', { id, odmena_id: puder.id }, { admin: true });
over(r.s === 409, 'málo bodov na odmenu');
r = await api('body', { id, body: -5, popis: 'test' }, { admin: true });
over(r.s === 409, 'body nejdú do mínusu');
r = await api('body', { id, body: 3 }, { admin: true });
over(r.s === 400, 'úprava bodov bez dôvodu');
r = await api('body', { id, body: 3, popis: 'Kúpa pudru' }, { admin: true });
over(r.j?.body === 4, 'ručné pripísanie');
r = await api('klient_novy', { meno: 'Eva Recepcia', telefon: '0905 111 222', suhlas_karta: true, suhlas_spravy: true }, { admin: true });
over(r.j?.ok && r.j.karta, 'nový klient na recepcii');
r = await api('klient_novy', { meno: 'Duplicitná', telefon: '+421905111222', suhlas_karta: true }, { admin: true });
over(r.s === 409, 'duplicitné číslo na recepcii');

console.log('karta a push');
r = await api('karta', null, { params: `&k=${token}` });
over(r.j.body === 4 && r.j.odmeny.length === 2 && r.j.akcie.length === 1 && r.j.historia.length === 4 && r.j.body_za_navstevu === 2, 'kartička po návštevách', JSON.stringify(r.j).slice(0, 300));
r = await api('odber', { k: token, endpoint: 'https://zly.example/push' });
over(r.s === 400, 'cudzia služba upozornení sa odmietne');
r = await api('odber', { k: token, endpoint: `${PUSH}/push/ok-1` });
over(r.j?.ok, 'odber upozornení');
await api('odber', { k: token, endpoint: `${PUSH}/push/410/zaniknuty` });
r = await api('sprava_posli', { nadpis: 'Mesiac študentov', text: 'Celý november styling za polovicu.', aj_email: false }, { admin: true });
over(r.j?.push === 1, 'správa: 1 doručené upozornenie (zaniknutý odber sa nepočíta)', r.t);
const prijate = await (await fetch(`${PUSH}/prijate`)).json();
over(prijate.length === 2 && prijate.every((p) => p.ok && p.ttl), 'VAPID podpis platný', JSON.stringify(prijate));
r = await api('novinka', { endpoint: `${PUSH}/push/ok-1` });
over(r.j?.sprava?.nadpis === 'Barbershop 30: Mesiac študentov' && r.j.sprava.url === `${Z}/vernost/karta/` && !r.t.includes(token), 'novinka bez prístupu ku kartičke', r.t);
over((await api('odber_stav', { k: token, endpoint: `${PUSH}/push/ok-1` })).j?.aktivny === true, 'stav odberu pre kartičku');
r = await api('odber', { k: token, endpoint: `${PUSH}/push/410/zaniknuty` });
r = await api('sprava_posli', { nadpis: 'Druhá', text: 'Test zaniknutého odberu.' }, { admin: true });
over(r.j?.push === 1, 'zaniknutý odber sa po 410 zmazal');
r = await fetch(`${API}?a=export`, { headers: { 'X-Vernost-Admin': '1', Cookie: cookie } });
const surove = Buffer.from(await r.arrayBuffer()), csv = surove.toString('utf8');
over(surove.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) && csv.includes("'+421951123456") && csv.includes('Ján Test'), 'export CSV', csv.slice(0, 300));
r = await api('karta_spravy', { k: token, suhlas: false });
over(r.j?.suhlas_spravy === false, 'odvolanie súhlasu na kartičke');
r = await api('novinka', { endpoint: `${PUSH}/push/ok-1` });
over(r.j?.sprava === null, 'po odvolaní sa odber zmazal');

console.log('súbežnosť');
{
  const vysl = await Promise.all([
    ...Array.from({ length: 12 }, () => api('karta', null, { params: `&k=${token}` })),
    ...Array.from({ length: 6 }, () => api('novinka', { endpoint: `${PUSH}/push/ok-1` })),
    ...Array.from({ length: 4 }, () => api('navsteva', { id, aj_tak: true }, { admin: true })),
  ]);
  const zle = vysl.filter((x) => x.s >= 500);
  over(zle.length === 0, 'súbežné požiadavky bez „database is locked“', zle.map((x) => x.t).join(' | '));
  const po = (await api('karta', null, { params: `&k=${token}` })).j.body;
  await api('body', { id, body: -(po - 4), popis: 'vrátenie po teste súbežnosti' }, { admin: true });
}
console.log('oddelenie prevádzok');
const cookieB = cookie; cookie = '';
await api('prihlasenie', { prevadzka: 'headspa', heslo: 'test-heslo-headspa' }, { admin: true });
r = await api('klient', null, { admin: true, params: `&id=${id}` });
over(r.s === 404, 'HEAD SPA nevidí klienta Barbershopu');
r = await api('odmeny', null, { admin: true });
over(r.j?.polozky.length === 0, 'HEAD SPA má vlastné odmeny');
await api('odmena_uloz', { nazov: 'Mini balzam na pokožku hlavy', body: 5 }, { admin: true });
cookie = cookieB;

/* ================= prehliadač ================= */
console.log('prehliadač');
const b = await chromium.launch();
const vonku = (ctx) => ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (rt) => (rt.request().resourceType() === 'document' ? rt.fulfill({ contentType: 'text/html', body: '<p>mimo testu</p>' }) : rt.abort()));
async function prihlaska(webUrl, cesta, nazov, jazyk, meno, tel) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  await vonku(ctx);
  await ctx.route(`${Z}${cesta}*`, async (rt) => { const res = await rt.fetch(); let t = await res.text(); t = t.replace(/((?:prihlaska|vernost)\.js" data-prevadzka="\w+")/, `$1 data-api="${API}" data-zapnute`); await rt.fulfill({ response: res, body: t }); });
  const p = await ctx.newPage();
  const chyby = []; p.on('pageerror', (e) => chyby.push(e.message));
  await p.goto(`${Z}${cesta}${jazyk ? `?lang=${jazyk}` : ''}`, { waitUntil: 'load' });
  await p.waitForTimeout(jazyk ? 1800 : 400);
  const sel = 'a[href*="barbershop30.sk/rezervacia"], a[href*="booqme.app/"][href*="rezerv"], a[data-booking-link]';
  await p.evaluate((s) => document.querySelector(s).click(), sel);
  await p.waitForSelector('#v30p[open]');
  over(!(await p.isVisible('#v30meno')) && !(await p.isChecked('#v30chcem')), `${nazov}: dialóg, nič nezaškrtnuté`);
  await p.waitForTimeout(550);                       // klik hneď po otvorení sa berie ako dvojklik
  const reg = []; p.on('request', (q) => { if (q.url().includes('registracia')) reg.push(q.url()); });
  const [popup] = await Promise.all([p.waitForEvent('popup'), p.click('#v30p .v30tl')]);
  over(/booqme|barbershop30/.test(popup.url()) && reg.length === 0, `${nazov}: bez súhlasu rovno rezervácia, nič neodoslané`, popup.url());
  await popup.close();
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  // dvojklik na Rezervovať: druhý klik nesmie zaškrtnúť súhlas ani zavrieť dialóg
  await p.evaluate((s) => { const a = document.querySelector(s); a.click(); setTimeout(() => document.querySelector('#v30chcem').click(), 120); }, sel);
  await p.waitForTimeout(400);
  over(await p.isVisible('#v30p[open]') && !(await p.isChecked('#v30chcem')), `${nazov}: dvojklik nič nezaškrtne`);
  await p.keyboard.press('Escape');
  const zastavene0 = await p.evaluate((s) => new Promise((hotovo) => { addEventListener('click', (e) => { const bolo = e.defaultPrevented; e.preventDefault(); hotovo(bolo); }, { once: true }); document.querySelector(s).click(); }), sel);
  over(!zastavene0 && !(await p.isVisible('#v30p[open]')), `${nazov}: po zatvorení bez voľby ide rezervácia rovno`);
  await p.evaluate(() => sessionStorage.clear());
  await p.evaluate((s) => document.querySelector(s).click(), sel);
  await p.waitForSelector('#v30p[open]');
  await p.waitForTimeout(550);
  await p.check('#v30chcem');
  await p.click('#v30p .v30tl');
  over(await p.isVisible('#v30p .v30chyba'), `${nazov}: chýbajúce meno`);
  await p.fill('#v30meno', meno); await p.fill('#v30tel', '602 123 456'); await p.click('#v30p .v30tl');
  over(/predvo|country|Vorwahl/i.test(await p.textContent('#v30p .v30chyba')), `${nazov}: zahraničné číslo bez predvoľby`, await p.textContent('#v30p .v30chyba'));
  await p.fill('#v30tel', tel); await p.fill('#v30mail', 'klient@example.sk');
  await p.screenshot({ path: `${SNIMKY}/prihlaska-${nazov}${jazyk ? '-' + jazyk : ''}.png` });
  await p.click('#v30p .v30tl');
  await p.waitForSelector('#v30p a.v30tl[href*="karta"]', { timeout: 8000 }).catch(async (e) => { console.log('  dialóg:', await p.textContent('#v30p')); throw e; });
  const nadpis = await p.textContent('#v30h');
  await p.screenshot({ path: `${SNIMKY}/prihlaska-${nazov}-hotovo${jazyk ? '-' + jazyk : ''}.png` });
  const ulozena = await p.evaluate((k) => localStorage.getItem(k), `v30.karta.${nazov}`);
  over(/\/karta\/\?k=/.test(ulozena || ''), `${nazov}: kartička uložená v prehliadači`);
  await p.keyboard.press('Escape');
  // syntetický klik nemá aktiváciu používateľa (prehliadač by okno zablokoval), preto len overíme, že prihláška klik nechá tak
  const zastavene = await p.evaluate((s) => new Promise((hotovo) => { addEventListener('click', (e) => { const bolo = e.defaultPrevented; e.preventDefault(); hotovo(bolo); }, { once: true }); document.querySelector(s).click(); }), sel);
  over(!zastavene && !(await p.isVisible('#v30p[open]')), `${nazov}: s kartičkou ide rezervácia rovno`);
  const [popup3] = await Promise.all([p.waitForEvent('popup'), p.locator('[data-vernost-karta]').click()]);
  over(popup3.url() === ulozena, `${nazov}: pätička otvorí uloženú kartičku`);
  over(chyby.length === 0, `${nazov}: bez chýb JS`, chyby.join(' | '));
  await ctx.close();
  return { nadpis, karta: ulozena };
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await vonku(ctx);
  const p = await ctx.newPage(); await p.goto(`${Z}/index.html`); await p.waitForTimeout(400);
  const zastavene = await p.evaluate(() => new Promise((hotovo) => { addEventListener('click', (e) => { const bolo = e.defaultPrevented; e.preventDefault(); hotovo(bolo); }, { once: true }); document.querySelector('a[data-booking-link]').click(); }));
  over(!zastavene && !(await p.isVisible('#v30p[open]')), 'bez data-zapnute prihláška mlčí a rezervácia ide rovno');
  await ctx.close();
}
const bs = await prihlaska(Z, '/barbershop-30/index.html', 'barbershop', '', 'Peter Novák', '0907 555 666');
over(/Kartička je pripravená, Peter!/.test(bs.nadpis), 'barbershop: potvrdenie po slovensky', bs.nadpis);
const bsEn = await prihlaska(Z, '/barbershop-30/index.html', 'barbershop', 'en', 'John Smith', '+44 7700 900123');
over(/Your card is ready, John!/.test(bsEn.nadpis), 'barbershop EN: dialóg po anglicky', bsEn.nadpis);
const hs = await prihlaska(Z, '/index.html', 'headspa', '', 'Jana Kováčová', '0911 222 333');
over(/Kartička je pripravená, Jana!/.test(hs.nadpis), 'headspa: potvrdenie', hs.nadpis);

/* kartička klienta */
for (const [nazov, url, sirka] of [['barbershop', karta, 390], ['headspa', hs.karta, 390], ['barbershop-desktop', karta, 1280]]) {
  const ctx = await b.newContext({ viewport: { width: sirka, height: 900 }, deviceScaleFactor: 2, isMobile: sirka < 500, hasTouch: sirka < 500 });
  await vonku(ctx);
  const p = await ctx.newPage(); const chyby = []; p.on('pageerror', (e) => chyby.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') chyby.push(m.text()); });
  await p.goto(url); await p.waitForSelector('.karta'); await p.waitForTimeout(1500);
  over(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `karta ${nazov}: bez vodorovného posunu`);
  over(chyby.length === 0, `karta ${nazov}: bez chýb`, chyby.join(' | '));
  await p.screenshot({ path: `${SNIMKY}/karta-${nazov}.png`, fullPage: true });
  await p.locator('.qr-obr').screenshot({ path: `${SNIMKY}/qr-${nazov}.png` });
  if (nazov === 'barbershop') {
    over((await p.textContent('.body-cislo b')) === '4', 'karta: 4 body');
    over((await p.textContent('.qr .kod')).replace(/\s/g, '') === `Kód${kod}`, 'karta: kód pre recepciu');
    over((await p.locator('.zoznam li.mozes').count()) === 1, 'karta: puder sa dá uplatniť');
    over(/Mesiac študentov/.test(await p.textContent('main')), 'karta: akcia');
    await ctx.setOffline(true); await p.reload(); await p.waitForSelector('.karta');
    over(await p.isVisible('.offline'), 'karta: bez signálu z pamäte');
    over((await p.textContent('.body-cislo b').catch(() => '')) !== '', 'karta: bez signálu ukáže body');
    await ctx.setOffline(false);
  }
  await ctx.close();
}

/* admin */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await vonku(ctx);
  const p = await ctx.newPage(); const chyby = []; p.on('pageerror', (e) => chyby.push(e.message));
  p.on('dialog', (d) => d.accept());
  await p.goto(`${Z}/vernost/admin/`); await p.waitForSelector('#h');
  await p.selectOption('#p', 'barbershop'); await p.fill('#h', 'test-heslo-barber'); await p.click('button[type=submit]');
  await p.waitForSelector('nav'); await p.waitForSelector('.zoznam .riadok');
  over((await p.locator('.zoznam .riadok').count()) >= 3, 'admin: zoznam klientov');
  await p.screenshot({ path: `${SNIMKY}/admin-klienti.png` });
  await p.fill('input[type=search]', 'Peter'); await p.waitForTimeout(600);
  await p.click('.zoznam .riadok'); await p.waitForSelector('text=Zapísať návštevu');
  await p.click('text=Zapísať návštevu'); await p.waitForSelector('.hlaska.ok');
  over(/\+2 body/.test(await p.textContent('.hlaska.ok')), 'admin: návšteva z detailu', await p.textContent('.hlaska.ok'));
  await p.click('text=Ukázať QR kód');
  await p.screenshot({ path: `${SNIMKY}/admin-detail.png`, fullPage: true });
  await p.click('nav >> text=Akcie'); await p.waitForSelector('text=Mesiac študentov');
  await p.click('nav >> text=Správy'); await p.waitForSelector('text=Nová správa klientom');
  await p.screenshot({ path: `${SNIMKY}/admin-spravy.png`, fullPage: true });
  await p.click('nav >> text=Nastavenia'); await p.waitForSelector('#s-body');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=Stiahnuť zoznam klientov (CSV)')]);
  over(/\.csv$/.test(dl.suggestedFilename()), 'admin: export CSV');
  await p.click('text=Odhlásiť'); await p.waitForSelector('#h');
  over(chyby.length === 0, 'admin: bez chýb JS', chyby.join(' | '));
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await vonku(m); const pm = await m.newPage();
  await pm.goto(`${Z}/vernost/admin/`); await pm.waitForSelector('#h');
  await pm.fill('#h', 'test-heslo-barber'); await pm.click('button[type=submit]'); await pm.waitForSelector('.zoznam .riadok');
  over(await pm.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'admin mobil: bez vodorovného posunu');
  await pm.screenshot({ path: `${SNIMKY}/admin-mobil.png` });
  await m.close(); await ctx.close();
}

/* zrušenie kartičky klientom (GDPR) */
r = await api('karta_zrus', { k: token, potvrdenie: 'nie' });
over(r.s === 400, 'zrušenie bez potvrdenia');
r = await api('karta_zrus', { k: token, potvrdenie: 'ZRUSIT' });
over(r.j?.ok && (await api('karta', null, { params: `&k=${token}` })).s === 404, 'zrušenie kartičky vymaže údaje');
await b.close();
console.log(`\nVÝSLEDOK: ${ok} v poriadku, ${zle} zlyhalo`);
process.exit(zle ? 1 : 0);
