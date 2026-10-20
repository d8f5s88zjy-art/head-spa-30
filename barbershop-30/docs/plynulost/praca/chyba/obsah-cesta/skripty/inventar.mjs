// Inventár obsahu a cesty zákazníka – BARBERSHOP 30 (telefón 390 × 844 DPR 3 a počítač 1440 × 900).
// Použitie: node inventar.mjs [port] ; výstup do ../snimky a ../data
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const PORT = process.argv[2] || '8610';
const BASE = `http://127.0.0.1:${PORT}/barbershop-30/`;
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SN = path.join(OUT, 'snimky'), DATA = path.join(OUT, 'data');
fs.mkdirSync(SN, { recursive: true }); fs.mkdirSync(DATA, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const KLUCE = ['#uvod', '#vstup-dnu', '#remeslo', '#cakaren', '#tim', '.band-team', '.team-note', '#sluzby', '.steps-wrap', '.price-list',
  '#g-strih', '#g-brada', '#g-balicky', '#g-doplnky', '.price-extra', '#galeria', '.band-gallery', '.recenzie', '.trust',
  '#rezervacia', '.band-contact', '.flap', '.contact-list', '.facts', '#kontakt', '.footer-bottom'];

async function polohy(page) {
  return page.evaluate((kluce) => {
    const vh = innerHeight, H = document.documentElement.scrollHeight, o = {};
    for (const k of kluce) {
      const el = document.querySelector(k); if (!el) { o[k] = null; continue; }
      const r = el.getBoundingClientRect(), y = r.top + scrollY;
      o[k] = { y: Math.round(y), obrazoviek: +(y / vh).toFixed(2), vyska: Math.round(r.height), skryty: el.hidden || getComputedStyle(el).display === 'none' };
    }
    return { vh, H, celkom_obrazoviek: +(H / vh).toFixed(1), o };
  }, KLUCE);
}

async function texty(page) {
  return page.evaluate(() => {
    const viditelny = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('[hidden]'); };
    const sekcie = [...document.querySelectorAll('main section.scene, footer')].map((s) => ({
      id: s.id,
      nadpisy: [...s.querySelectorAll('.kicker, h1, h2, h3, .eyebrow, .title-sub, .lead, .trust-text, .small, .price-group-title')]
        .filter(viditelny).map((e) => e.tagName + (e.className ? '.' + String(e.className).split(' ')[0] : '') + ': ' + e.innerText.replace(/\s+/g, ' ').trim()),
      odkazy: [...s.querySelectorAll('a[href]')].filter(viditelny).map((a) => a.innerText.replace(/\s+/g, ' ').trim() + ' → ' + a.getAttribute('href')),
    }));
    return sekcie;
  });
}

async function ctaStav(page, y) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await wait(450);
  return page.evaluate(() => {
    const c = document.querySelector('#mobile-cta');
    const r = c.getBoundingClientRect(), s = getComputedStyle(c);
    return { y: Math.round(scrollY), skryty: c.classList.contains('is-hidden'), opacity: s.opacity, visibility: s.visibility, dole: Math.round(innerHeight - r.bottom) };
  });
}

const vysledok = {};
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

// ---------- TELEFÓN ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load' });
  vysledok.telefon_load_ms = Date.now() - t0;
  await wait(2500);
  await page.screenshot({ path: path.join(SN, 't01-prvy-obraz.jpg'), quality: 70 });
  // čo je v prvom okne: viditeľné tlačidlá a odkazy
  vysledok.telefon_prve_okno = await page.evaluate(() => [...document.querySelectorAll('a, button')].filter((e) => {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && s.visibility !== 'hidden' && +s.opacity > 0.05 && !e.closest('[hidden]') && !e.closest('.is-hidden');
  }).map((e) => ({ text: e.innerText.replace(/\s+/g, ' ').trim() || e.getAttribute('aria-label'), href: e.getAttribute('href'), top: Math.round(e.getBoundingClientRect().top), h: Math.round(e.getBoundingClientRect().height) })));
  vysledok.telefon_polohy = await polohy(page);
  vysledok.telefon_texty = await texty(page);
  // spodné tlačidlo v rôznych miestach
  const P = vysledok.telefon_polohy.o, cta = [];
  for (const k of ['#uvod', '#vstup-dnu', '#cakaren', '.band-team', '#sluzby', '.price-list', '#g-doplnky', '.band-gallery', '#rezervacia', '.band-contact', '#kontakt']) {
    if (P[k]) cta.push({ kde: k, ...(await ctaStav(page, P[k].y + 40)) });
  }
  vysledok.telefon_cta = cta;
  // cenník na telefóne
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.price-list'].y - 60); await wait(700);
  await page.screenshot({ path: path.join(SN, 't02-cennik-1.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['#g-balicky'].y - 60); await wait(700);
  await page.screenshot({ path: path.join(SN, 't03-cennik-2.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.price-extra'].y - 300); await wait(700);
  await page.screenshot({ path: path.join(SN, 't04-cennik-3.jpg'), quality: 70 });
  // tím
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.band-team'].y); await wait(900);
  await page.screenshot({ path: path.join(SN, 't05-tim.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.team-note'].y - 500); await wait(900);
  await page.screenshot({ path: path.join(SN, 't06-tim-2.jpg'), quality: 70 });
  // kontakt
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.band-contact'].y - 20); await wait(1500);
  await page.screenshot({ path: path.join(SN, 't07-kontakt.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.facts'].y - 40); await wait(700);
  await page.screenshot({ path: path.join(SN, 't08-fakty.jpg'), quality: 70 });
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await wait(900);
  await page.screenshot({ path: path.join(SN, 't09-paticka.jpg'), quality: 70 });
  // galéria a dôvera
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.trust'].y - 300); await wait(1200);
  await page.screenshot({ path: path.join(SN, 't10-dovera.jpg'), quality: 70 });
  // rezervácia – titulná karta
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['#rezervacia'].y + 10); await wait(1200);
  await page.screenshot({ path: path.join(SN, 't11-rezervacia-karta.jpg'), quality: 70 });

  // cesta cez menu: hore → menu → Služby (počet ťuknutí a kam pristane)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await wait(800);
  await page.tap('.nav-toggle'); await wait(700);
  await page.screenshot({ path: path.join(SN, 't12-menu.jpg'), quality: 70 });
  vysledok.telefon_menu = await page.evaluate(() => [...document.querySelectorAll('#nav a, #nav button, .lang-switch button, .lang-switch a, [class*=lang] button')]
    .filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
  const tMenu = Date.now();
  await page.tap('#nav a[href="#sluzby"]'); await wait(1600);
  vysledok.telefon_menu_sluzby = await page.evaluate(() => ({ y: Math.round(scrollY), ms: 0 }));
  vysledok.telefon_menu_sluzby.ms = Date.now() - tMenu;
  await page.screenshot({ path: path.join(SN, 't13-menu-sluzby.jpg'), quality: 70 });
  // kontakt cez menu
  await page.tap('.nav-toggle'); await wait(600);
  await page.tap('#nav a[href="#kontakt"]'); await wait(1600);
  vysledok.telefon_menu_kontakt = await page.evaluate(() => ({ y: Math.round(scrollY), H: document.documentElement.scrollHeight, vh: innerHeight }));
  await page.screenshot({ path: path.join(SN, 't14-menu-kontakt.jpg'), quality: 70 });
  // vernostná kartička v pätičke: kam vedie
  const href = await page.getAttribute('[data-vernost-karta]', 'href');
  vysledok.vernost_href = href;
  const [nav] = await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => null),
    page.click('[data-vernost-karta]').catch((e) => vysledok.vernost_chyba = String(e)),
  ]);
  await wait(1500);
  vysledok.vernost_po_kliknuti = { url: page.url(), titul: await page.title().catch(() => ''), status: nav ? nav.status() : null };
  await page.screenshot({ path: path.join(SN, 't15-vernost-klik.jpg'), quality: 70 });
  await ctx.close();
}

// ---------- TELEFÓN PO ANGLICKY ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'en-GB' });
  const page = await ctx.newPage();
  await page.goto(BASE + '?uvod=off&hudba=off&lang=en', { waitUntil: 'load' });
  await wait(3500);
  await page.screenshot({ path: path.join(SN, 'e01-prvy-obraz-en.jpg'), quality: 70 });
  vysledok.en = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    hlavna_rez_title: [...document.querySelectorAll('a[href^="https://www.barbershop30.sk/rezervacia"]')].map((a) => a.getAttribute('title'))[0],
    rez_viditelna_poznamka: [...document.querySelectorAll('body *')].some((e) => e.children.length === 0 && /booking page is in Slovak/i.test(e.textContent || '')),
    booqme: [...document.querySelectorAll('a[href*="booqme"]')].map((a) => a.getAttribute('href')),
    tel_texty: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.innerText.replace(/\s+/g, ' ').trim() || a.getAttribute('aria-label')),
    sub_rez: (document.querySelector('#rezervacia .title-sub') || {}).innerText,
    nepreložené: [...document.querySelectorAll('main p, main h2, main h3, main h4, footer p, footer dt, footer dd')].map((e) => e.innerText.trim()).filter((t) => /[áäčďéíĺľňóôŕšťúýž]/i.test(t)).slice(0, 15),
  }));
  const p2 = await polohy(page);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), p2.o['.band-contact'].y - 20); await wait(1500);
  await page.screenshot({ path: path.join(SN, 'e02-kontakt-en.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), p2.o['.price-list'].y - 60); await wait(900);
  await page.screenshot({ path: path.join(SN, 'e03-cennik-en.jpg'), quality: 70 });
  await ctx.close();
}

// ---------- POČÍTAČ ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load' });
  await wait(2500);
  await page.screenshot({ path: path.join(SN, 'd01-prvy-obraz.jpg'), quality: 70 });
  vysledok.pocitac_polohy = await polohy(page);
  const P = vysledok.pocitac_polohy.o;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.price-list'].y - 80); await wait(1000);
  await page.screenshot({ path: path.join(SN, 'd02-cennik.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.band-contact'].y - 40); await wait(1500);
  await page.screenshot({ path: path.join(SN, 'd03-kontakt.jpg'), quality: 70 });
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await wait(900);
  await page.screenshot({ path: path.join(SN, 'd04-paticka.jpg'), quality: 70 });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), P['.band-team'].y - 40); await wait(1200);
  await page.screenshot({ path: path.join(SN, 'd05-tim.jpg'), quality: 70 });
  vysledok.pocitac_lista = await page.evaluate(() => [...document.querySelectorAll('.site-header a, .site-header button')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.innerText.replace(/\s+/g, ' ').trim() || e.getAttribute('aria-label')));
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(DATA, 'inventar.json'), JSON.stringify(vysledok, null, 1));
console.log(JSON.stringify({ load: vysledok.telefon_load_ms, H: vysledok.telefon_polohy.celkom_obrazoviek, menu: vysledok.telefon_menu, vernost: vysledok.vernost_po_kliknuti, en: vysledok.en }, null, 1));
