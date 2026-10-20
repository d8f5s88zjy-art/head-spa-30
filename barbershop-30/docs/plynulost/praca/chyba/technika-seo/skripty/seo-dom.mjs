// Zber SEO a prístupnostných údajov z DOM: titulok, popis, kanonická adresa, OG, nadpisy, obrázky, odkazy, úložisko, siete.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8641/head-spa-30/barbershop-30/';
const OUT = process.argv[3] || '.';
const LANGS = ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const res = {};
for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const url = BASE + (lang === 'sk' ? '?uvod=off' : `?lang=${lang}&uvod=off`);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  res[lang] = await page.evaluate(() => {
    const m = (s) => { const e = document.querySelector(s); return e ? (e.content ?? e.href ?? e.textContent) : null; };
    return {
      htmlLang: document.documentElement.lang,
      title: document.title,
      titleLen: document.title.length,
      description: m('meta[name="description"]'),
      descLen: (m('meta[name="description"]') || '').length,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogLocale: m('meta[property="og:locale"]'),
      ogTitle: m('meta[property="og:title"]'),
      ogUrl: m('meta[property="og:url"]'),
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()),
      hreflangInHtml: document.querySelectorAll('link[hreflang]').length,
      url: location.href,
    };
  });
  await ctx.close();
}
fs.writeFileSync(OUT + '/jazyky.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
