// Porovnanie: snímky a inventár funkcií cudzích webov (len na rozbor princípov, nič sa nepreberá).
// Použitie: node snimaj.mjs <kľúč>=<url> [<kľúč>=<url> ...]
// Výstup: ../snimky/<kľúč>-{d,m}-{0,1,2}.jpg, ../snimky/<kľúč>-{d,m}-cela.jpg, ../data/<kľúč>.json
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SN = path.join(OUT, 'snimky'), DATA = path.join(OUT, 'data');
fs.mkdirSync(SN, { recursive: true }); fs.mkdirSync(DATA, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ciele = process.argv.slice(2).map((a) => { const i = a.indexOf('='); return { k: a.slice(0, i), url: a.slice(i + 1) }; });

// Proxy prostredia: Chromium nečíta aktuálnu CA proxy z NSS, preto dôveruje len kľúču CA proxy (SPKI z /root/.ccr/agent-proxy-ca.crt).
const PROXY = process.env.HTTPS_PROXY;
const SPKI = process.env.SPKI;
const browser = await chromium.launch({
  proxy: PROXY ? { server: PROXY, bypass: 'localhost,127.0.0.1' } : undefined,
  args: ['--autoplay-policy=no-user-gesture-required', ...(SPKI ? ['--ignore-certificate-errors-spki-list=' + SPKI] : [])],
});

// Skúsi zavrieť lištu súhlasu (len kliknutie na zjavné tlačidlo prijatia), aby bolo vidno obsah.
async function suhlas(page) {
  const re = /^(accept|accept all|allow all|agree|i agree|ok|got it|prijať|prijať všetko|súhlasím|povoliť všetko|rozumiem|souhlasím|přijmout|přijmout vše|povolit vše|akzeptieren|alle akzeptieren|accetta|accetto|accetta tutti|tout accepter|j'accepte)$/i;
  for (const fr of page.frames()) {
    try {
      const btns = await fr.$$('button, a[role=button], [role=button], input[type=button], input[type=submit]');
      for (const b of btns) {
        const t = ((await b.innerText().catch(() => '')) || (await b.getAttribute('value').catch(() => '')) || '').trim();
        if (re.test(t) && (await b.isVisible().catch(() => false))) { await b.click({ timeout: 2000 }).catch(() => {}); await wait(800); return t; }
      }
    } catch { /* rámec zmizol */ }
  }
  return null;
}

async function inventar(page) {
  return page.evaluate(() => {
    const T = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const txt = T(document.body ? document.body.innerText : '');
    const low = txt.toLowerCase();
    const links = [...document.querySelectorAll('a[href]')].map((a) => ({ t: T(a.innerText).slice(0, 60), h: a.href })).filter((l) => l.h && !l.h.startsWith('javascript'));
    const hrefs = links.map((l) => l.h.toLowerCase()).join(' ');
    const providers = ['booksy', 'fresha', 'squire', 'setmore', 'acuity', 'boulevard', 'mangomint', 'booqme', 'reservio', 'bookio', 'noona', 'treatwell', 'phorest', 'timely', 'vagaro', 'squareup', 'square.site', 'reenio', 'simplybook', 'calendly', 'getsquire', 'zenoti', 'shore.com', 'planity', 'salonized', 'kingbarber', 'barbershops.sk', 'anolla', 'mewo', 'dikidi', 'sumup']
      .filter((p) => hrefs.includes(p) || document.documentElement.innerHTML.toLowerCase().includes(p + '.'));
    const has = (re) => re.test(low);
    const feat = {
      cena: (txt.match(/(\d+[.,]?\d*\s?(€|eur|£|\$|kč|czk))|((€|£|\$)\s?\d+)/gi) || []).length,
      darcek_poukaz: has(/gift ?card|gift voucher|voucher|poukaz|poukážk|darčekov|dárkov|poukaz|gutschein/),
      eshop_produkty: has(/\bshop\b|e-?shop|products|produkty|kosik|košík|cart|add to bag|add to cart|do košíka/),
      faq: has(/\bfaq\b|frequently asked|časté otázky|často kladené|časté dotazy/),
      recenzie: has(/review|recenz|hodnoten|testimonial|google rating|★|stars/),
      clenstvo_vernost: has(/membership|member|loyalty|vernost|věrnost|predplat|subscription|club card|klubov/),
      kariera: has(/career|kariér|jobs|práca u nás|pridaj sa|join the team|join our team|hiring|we.re hiring|hľadáme/),
      akademia_kurzy: has(/academy|akadémi|akademi|kurz|course|education|training|školen/),
      pobocky: has(/locations|pobočk|pobočky|our shops|find a shop|find your|stores/),
      mapa: !!document.querySelector('iframe[src*="google.com/maps"], iframe[src*="maps.google"], iframe[src*="mapy.cz"], iframe[src*="openstreetmap"], [class*="map" i] canvas, .gm-style'),
      instagram: hrefs.includes('instagram.com'),
      tiktok: hrefs.includes('tiktok.com'),
      youtube: hrefs.includes('youtube.com') || !!document.querySelector('iframe[src*="youtube"]'),
      video: document.querySelectorAll('video').length,
      walk_in: has(/walk[- ]?in|bez objednania|bez rezervácie|bez objednávky|prídi rovno/),
      storno: has(/cancellation|cancel policy|storno|zrušenie|zrušit|no[- ]show|late arrival|meškanie/),
      parkovanie: has(/parking|parkovan|parkován/),
      deti: has(/kids|child|deti|detsk|dětsk|junior|gentlemen do|malých/),
      jazyky: [...document.querySelectorAll('a[hreflang], link[rel=alternate][hreflang]')].map((a) => a.getAttribute('hreflang')).filter(Boolean),
      tim: has(/our team|meet the|náš tím|team|tím|barberi|barbers/),
      otvaracie_hodiny: has(/opening hours|hours|otváracie|otevírací|po[–-]pi|mon[–-]fri|monday/),
      telefon: !!document.querySelector('a[href^="tel:"]'),
      whatsapp: hrefs.includes('wa.me') || hrefs.includes('whatsapp'),
      newsletter: has(/newsletter|subscribe|odoberať|odběr/) || !!document.querySelector('input[type=email]'),
      udalosti_blog: has(/\bblog\b|journal|news|novinky|články|magazine|stories/),
      cenova_pripomienka: has(/from £|from \$|od \d|from \d|starting at/),
    };
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { const j = JSON.parse(s.textContent); return (Array.isArray(j) ? j : [j]).map((x) => x['@type'] || (x['@graph'] || []).map((g) => g['@type'])).flat(); } catch { return ['(chyba)']; } }).flat();
    const nadpisy = [...document.querySelectorAll('h1, h2, h3')].filter(vis).map((h) => h.tagName + ': ' + T(h.innerText).slice(0, 90)).slice(0, 40);
    const nav = [...document.querySelectorAll('header a, nav a')].map((a) => T(a.innerText)).filter(Boolean).slice(0, 30);
    const booking = links.filter((l) => /book|rezerv|objedn|termín|appointment|reserve/i.test(l.t + ' ' + l.h)).slice(0, 12);
    // Prvky prilepené k dolnému okraju (napr. stále tlačidlo rezervácie na mobile).
    const fixed = [...document.querySelectorAll('body *')].filter((el) => { const s = getComputedStyle(el); return (s.position === 'fixed' || s.position === 'sticky') && vis(el); })
      .map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName, cls: String(el.className).slice(0, 50), t: T(el.innerText).slice(0, 60), top: Math.round(r.top), bottom: Math.round(innerHeight - r.bottom), h: Math.round(r.height) }; })
      .filter((f) => f.t).slice(0, 12);
    const fonts = [...new Set([...document.querySelectorAll('h1, h2, body, p, a')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '').trim()))].slice(0, 6);
    return {
      title: document.title, desc: (document.querySelector('meta[name=description]') || {}).content || '',
      lang: document.documentElement.lang, vyska_stranky: document.documentElement.scrollHeight, obrazoviek: +(document.documentElement.scrollHeight / innerHeight).toFixed(1),
      providers, feat, ld, nadpisy, nav, booking, fixed, fonts,
      text_zaciatok: txt.slice(0, 2500),
    };
  });
}

async function jedenBeh(t, typ) {
  const mob = typ === 'm';
  const ctx = await browser.newContext({
    viewport: mob ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob,
    locale: 'sk-SK',
    userAgent: mob ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' : undefined,
  });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  page.setDefaultTimeout(15000);
  const r = { url: t.url, typ, chyba: null };
  const t0 = Date.now();
  try {
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
    await wait(3500);
    r.suhlas = process.env.LITE ? null : await suhlas(page);
    await wait(1200);
    r.cas_nacitania_ms = Date.now() - t0;
    await page.screenshot({ path: path.join(SN, `${t.k}-${typ}-0.jpg`), type: 'jpeg', quality: 70 });
    // Prechod stránkou (spustí lenivé obrázky a animácie pri skrole), snímky v 1/3 a 2/3.
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = mob ? 844 : 900;
    if (!process.env.LITE) for (let y = 0; y < Math.min(H, 30000); y += Math.round(vh * 0.8)) { await page.evaluate((y) => window.scrollTo(0, y), y); await wait(180); }
    for (const [i, f] of [[1, 0.33], [2, 0.66]]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((H - vh) * f)); await wait(1300);
      await page.screenshot({ path: path.join(SN, `${t.k}-${typ}-${i}.jpg`), type: 'jpeg', quality: 70 });
    }
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(1200);
    r.inv = await inventar(page);
    // Celá stránka, výška obmedzená (kvôli pamäti), zmenší sa neskôr na prehľad.
    if (process.env.LITE) { await ctx.close(); return r; }
    const Hc = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), mob ? 16000 : 14000);
    await page.screenshot({ path: path.join(SN, `${t.k}-${typ}-cela.jpg`), type: 'jpeg', quality: 55, fullPage: true, clip: { x: 0, y: 0, width: mob ? 390 : 1440, height: Hc }, timeout: 60000 }).catch(async () => {
      await page.screenshot({ path: path.join(SN, `${t.k}-${typ}-cela.jpg`), type: 'jpeg', quality: 55, fullPage: true, timeout: 60000 }).catch((e) => { r.cela_chyba = String(e).slice(0, 200); });
    });
  } catch (e) { r.chyba = String(e).slice(0, 300); }
  await ctx.close();
  return r;
}

for (const t of ciele) {
  const out = { kluc: t.k, url: t.url, datum: new Date().toISOString() };
  for (const typ of ['d', 'm']) out[typ] = await jedenBeh(t, typ);
  fs.writeFileSync(path.join(DATA, `${t.k}.json`), JSON.stringify(out, null, 1));
  console.log(t.k, out.d.chyba || 'ok', out.m.chyba || 'ok', out.d.inv ? out.d.inv.obrazoviek : '-', out.m.inv ? out.m.inv.obrazoviek : '-');
}
await browser.close();
