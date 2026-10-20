// Siete (hostitelia mimo webu), cookies, úložisko a štruktúra DOM (nadpisy, obrázky, odkazy, ovládacie prvky).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2];
const OUT = process.argv[3];
const DEV = process.argv[4] || 'mobil';
const QS = process.argv[5] || '';
const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const opt = DEV === 'mobil' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const ctx = await browser.newContext(opt);
const page = await ctx.newPage();
const req = [];
const errs = [];
page.on('request', (r) => req.push({ url: r.url(), type: r.resourceType() }));
page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push('console.' + m.type() + ': ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto(BASE + QS, { waitUntil: 'load' });
await page.waitForTimeout(3000);
// klik (spustí hudbu a strih na počítači), potom skrol celou stránkou
await page.mouse.click(200, 400).catch(() => {});
const H = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 600) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
await page.waitForTimeout(1500);
// jazyk
await page.evaluate(() => document.querySelector('.lang-btn')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-lang-pick="en"]')?.click());
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('[data-lang-pick="sk"]')?.click() || document.querySelector('.lang-btn')?.click());
await page.waitForTimeout(500);
const cookies = await ctx.cookies();
const dom = await page.evaluate(() => {
  const vis = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && (r.width > 0 || r.height > 0); };
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ l: +h.tagName[1], t: h.textContent.replace(/\s+/g, ' ').trim().slice(0, 80), hid: h.closest('[hidden],[aria-hidden="true"]') ? 1 : 0, vis: vis(h) ? 1 : 0 }));
  const imgs = [...document.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.getAttribute('src') || '').split('/').pop().slice(0, 50), alt: i.getAttribute('alt'), ah: i.closest('[aria-hidden="true"]') ? 1 : 0, role: i.getAttribute('role') }));
  const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, t: (a.getAttribute('aria-label') || a.textContent).replace(/\s+/g, ' ').trim().slice(0, 60), target: a.target, rel: a.rel }));
  const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
  const dupIds = Object.entries(ids).filter(([, n]) => n > 1);
  const noName = [...document.querySelectorAll('button, a[href], [role="button"], input, select, textarea')].filter((e) => !e.closest('[aria-hidden="true"]') && !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.textContent.trim() || e.getAttribute('title') || (e.labels && e.labels.length))).map((e) => e.outerHTML.slice(0, 120));
  const videos = [...document.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || '').split('/').pop(), aria: v.getAttribute('aria-hidden') || v.getAttribute('aria-label') || '', tracks: v.querySelectorAll('track').length, controls: v.controls }));
  const landmarks = { main: document.querySelectorAll('main').length, header: document.querySelectorAll('header').length, footer: document.querySelectorAll('footer').length, nav: document.querySelectorAll('nav').length };
  let ls = {}, ss = {};
  try { for (let i = 0; i < localStorage.length; i++) ls[localStorage.key(i)] = (localStorage.getItem(localStorage.key(i)) || '').slice(0, 40); } catch (e) {}
  try { for (let i = 0; i < sessionStorage.length; i++) ss[sessionStorage.key(i)] = (sessionStorage.getItem(sessionStorage.key(i)) || '').slice(0, 40); } catch (e) {}
  return { htmlClass: document.documentElement.className, heads, imgs, links, dupIds, noName, videos, landmarks, ls, ss, lang: document.documentElement.lang };
});
const hosts = {};
for (const r of req) { try { const h = new URL(r.url).host; hosts[h] = (hosts[h] || 0) + 1; } catch (e) {} }
const res = { DEV, QS, hosts, nReq: req.length, cookies, errs: [...new Set(errs)].slice(0, 40), ...dom };
fs.writeFileSync(`${OUT}/dom-${DEV}${QS.replace(/[^a-z0-9]+/gi, '-')}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ DEV, QS, hosts, nReq: req.length, cookies: cookies.length, errs: res.errs, ls: dom.ls, ss: dom.ss, htmlClass: dom.htmlClass, landmarks: dom.landmarks, dupIds: dom.dupIds, noName: dom.noName }, null, 1));
await browser.close();
