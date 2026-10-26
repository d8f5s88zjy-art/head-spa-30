#!/usr/bin/env node
// A3 SEO – statická kontrola webu BARBERSHOP 30 (HTML, JSON-LD, robots.txt, sitemap.xml, manifest, obrázky OG a ikon).
// Nič nemení, číta len súbory webu; prehliadač ani server nepotrebuje (rýchlosť a vykreslenie: a3-rychlost.mjs).
//
//   node a3-seo.mjs [priečinok webu] [--schema=schemaorg-current-https.jsonld] [--json=vystup.json] [--git]
//
//   priečinok webu  predvolene .../hs-skvrny/barbershop-30
//   --schema        slovník schema.org (https://schema.org/version/latest/schemaorg-current-https.jsonld); s ním sa
//                   overí, že každý @type a každá vlastnosť v JSON-LD existuje a že typ podniku je LocalBusiness
//   --json          celý výsledok aj ako JSON
//   --git           lastmod v sitemap.xml porovná s dátumom posledného commitu stránky (git log)
//
// Výstup: riadky „VAZNA / STREDNA / DROBNA / OK / INFO  [kód] text  (súbor:riadok)“, na konci súhrn.
// Kód ukončenia 1, ak je aspoň jeden nález VAZNA.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const SITE = path.resolve(args.find((a) => !a.startsWith('--')) || '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny/barbershop-30');

// Stránky webu a čo od nich čakáme (index = má byť v Google; noindex = nemá)
const PAGES = [
  { file: 'index.html', lang: 'sk', index: true, url: '' },
  { file: 'en/index.html', lang: 'en', index: true, url: 'en/' },
  { file: 'rezervacia.html', lang: 'sk', index: 'volitelne', url: 'rezervacia.html' },   // noindex, kým nie je pripojený kalendár
  { file: 'karta/index.html', lang: 'sk', index: false, url: 'karta/' },
  { file: 'admin/index.html', lang: 'sk', index: false, url: 'admin/' },
  { file: '404.html', lang: 'sk', index: false, url: '404.html', volitelna: false },
];

// ---------------------------------------------------------------- výstup
const nalezy = [];
const out = (lvl, kod, text, kde = '') => { nalezy.push({ lvl, kod, text, kde }); console.log(`${lvl.padEnd(7)} [${kod}] ${text}${kde ? '  (' + kde + ')' : ''}`); };
const VAZNA = (k, t, w) => out('VAZNA', k, t, w), STREDNA = (k, t, w) => out('STREDNA', k, t, w), DROBNA = (k, t, w) => out('DROBNA', k, t, w);
const OK = (k, t, w) => out('OK', k, t, w), INFO = (k, t, w) => out('INFO', k, t, w);
const rel = (f) => path.relative(SITE, f) || f;

// ---------------------------------------------------------------- rozbor HTML (tokenizer ako source/tools/en-stranka.mjs)
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const NB = '\u00a0';
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: NB, ndash: '–', mdash: '—', hellip: '…', copy: '©' };
const dec = (s) => String(s).replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : (ENT[e.toLowerCase()] ?? m)));
const norm = (s) => String(s).replace(/[\s\u00a0]+/g, ' ').trim();

function parseHTML(src) {
  const nl = []; for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) nl.push(i);
  const lineOf = (pos) => { let lo = 0, hi = nl.length; while (lo < hi) { const m = (lo + hi) >> 1; if (nl[m] < pos) lo = m + 1; else hi = m; } return lo + 1; };
  const root = { tag: '#root', attrs: {}, children: [], parent: null, line: 1 };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)|(<)/gi;
  let m;
  while ((m = re.exec(src))) {
    const [cely, zav, meno, atr, text, lt] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined || lt !== undefined) { top.children.push({ tag: '#text', text: dec(text ?? lt), line: lineOf(m.index), parent: top }); continue; }
    if (!meno) continue;   // komentár, doctype
    const tag = meno.toLowerCase();
    if (zav) {
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
      continue;
    }
    const attrs = {};
    const ar = /([^\s=\/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
    let a; while ((a = ar.exec(atr))) attrs[a[1].toLowerCase()] = dec(a[2] ?? a[3] ?? a[4] ?? '');
    const el = { tag, attrs, children: [], parent: top, line: lineOf(m.index), pos: m.index, raw: cely };
    top.children.push(el);
    if (RAW.has(tag)) {
      const k = src.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
      const obsah = src.slice(re.lastIndex, k < 0 ? src.length : k);
      el.children.push({ tag: '#text', text: tag === 'title' || tag === 'textarea' ? dec(obsah) : obsah, line: lineOf(re.lastIndex), parent: el });
      el.textLine = lineOf(re.lastIndex);
      const kon = k < 0 ? src.length : src.indexOf('>', k) + 1;
      re.lastIndex = kon;
      continue;
    }
    if (!VOID.has(tag) && !/\/\s*$/.test(atr)) stack.push(el);
  }
  return root;
}
function* walk(n) { for (const c of n.children || []) { yield c; if (c.children) yield* walk(c); } }
const all = (root, pred) => [...walk(root)].filter((n) => n.tag !== '#text' && pred(n));
const byTag = (root, ...tags) => all(root, (n) => tags.includes(n.tag));
const anc = (n, pred) => { for (let p = n.parent; p; p = p.parent) if (pred(p)) return p; return null; };
const inTemplate = (n) => !!anc(n, (p) => p.tag === 'template');
const isHidden = (n) => !!(('hidden' in (n.attrs || {})) || anc(n, (p) => p.attrs && 'hidden' in p.attrs));
const SKIPTXT = new Set(['script', 'style', 'template', 'svg', 'noscript', 'head', 'title']);
function textOf(n, { skipHidden = true } = {}) {
  let s = '';
  for (const c of n.children || []) {
    if (c.tag === '#text') { s += c.text; continue; }
    if (SKIPTXT.has(c.tag)) continue;
    if (skipHidden && c.attrs && 'hidden' in c.attrs) continue;
    if (c.tag === 'br') { s += ' '; continue; }
    s += ' ' + textOf(c, { skipHidden }) + ' ';
  }
  return s;
}
const textInline = (n) => norm(textOf(n));
const meta = (root, key) => all(root, (n) => n.tag === 'meta' && (n.attrs.name === key || n.attrs.property === key));
const links = (root, relv) => all(root, (n) => n.tag === 'link' && String(n.attrs.rel || '').toLowerCase().split(/\s+/).includes(relv));

// ---------------------------------------------------------------- rozmery obrázkov (PNG, JPEG, WebP, SVG)
function imgSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), typ: 'png', bajty: b.length };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const mk = b[i + 1], len = b.readUInt16BE(i + 2);
        if ((mk >= 0xc0 && mk <= 0xc3) || (mk >= 0xc5 && mk <= 0xc7) || (mk >= 0xc9 && mk <= 0xcb) || (mk >= 0xcd && mk <= 0xcf)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), typ: 'jpeg', bajty: b.length };
        i += 2 + len;
      }
    }
    if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
      const t = b.slice(12, 16).toString();
      if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), typ: 'webp', bajty: b.length };
      if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, typ: 'webp', bajty: b.length };
      if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1, typ: 'webp', bajty: b.length }; }
    }
    if (/\.svg$/i.test(file)) { const s = b.toString(); const vb = /viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/.exec(s); return { w: vb ? +vb[1] : null, h: vb ? +vb[2] : null, typ: 'svg', bajty: b.length }; }
    return { typ: '?', bajty: b.length };
  } catch (e) { return null; }
}

// ---------------------------------------------------------------- načítanie stránok
const pages = [];
for (const p of PAGES) {
  const f = path.join(SITE, p.file);
  if (!fs.existsSync(f)) { pages.push({ ...p, chyba: true }); continue; }
  const src = fs.readFileSync(f, 'utf8');
  pages.push({ ...p, path: f, src, root: parseHTML(src) });
}
const home = pages.find((p) => p.file === 'index.html');
const canonHome = links(home.root, 'canonical')[0]?.attrs.href || '';
const BASE = opt.base || canonHome;
INFO('BASE', `základná adresa z canonical index.html: ${BASE}`, 'index.html:' + (links(home.root, 'canonical')[0]?.line || '?'));

// absolútna URL webu -> súbor na disku
function urlToFile(u, fromFile) {
  let s = String(u).trim();
  if (!s || /^(tel:|mailto:|javascript:|data:|#)/i.test(s)) return null;
  if (/^https?:\/\//i.test(s)) { if (!BASE || !s.startsWith(BASE)) return null; s = s.slice(BASE.length); return resolveLocal(s, SITE); }
  if (s.startsWith('//')) return null;
  if (s.startsWith('/')) return { abs: true, file: path.join(SITE, s.split(/[?#]/)[0]) };
  return resolveLocal(s, path.dirname(fromFile));
}
function resolveLocal(s, dir) {
  const clean = decodeURIComponent(s.split(/[?#]/)[0]);
  let f = path.join(dir, clean);
  if (clean === '' || clean.endsWith('/')) f = path.join(f, 'index.html');
  return { file: f, query: (s.match(/\?[^#]*/) || [''])[0], hash: (s.match(/#.*/) || [''])[0] };
}

// ---------------------------------------------------------------- kontrola jednej stránky
const LEN = { title: [30, 60], desc: [70, 160] };
const summary = {};
for (const p of pages) {
  console.log(`\n=== ${p.file}`);
  if (p.chyba) {
    if (p.file === '404.html') VAZNA('404-chyba', `${p.file} na webe Barbershopu nie je; zlá adresa ukáže cudziu chybovú stránku (pozri ZAPIS.md)`, p.file);
    else VAZNA('stranka-chyba', `${p.file} chýba`, p.file);
    continue;
  }
  const R = p.root, W = (n) => `${p.file}:${n?.line ?? '?'}`;
  const S = summary[p.file] = {};
  // jazyk, charset, viewport
  const htmlEl = byTag(R, 'html')[0];
  S.lang = htmlEl?.attrs.lang;
  if (!S.lang) VAZNA('lang', 'chýba atribút lang', W(htmlEl)); else if (S.lang.slice(0, 2) !== p.lang) VAZNA('lang', `lang="${S.lang}", čakal som ${p.lang}`, W(htmlEl)); else OK('lang', `lang="${S.lang}"`, W(htmlEl));
  const cs = byTag(R, 'meta').find((n) => 'charset' in n.attrs);
  if (!cs || cs.pos > 1024) STREDNA('charset', 'meta charset chýba alebo nie je v prvých 1024 bajtoch', W(cs));
  const vp = meta(R, 'viewport')[0];
  if (!vp) VAZNA('viewport', 'chýba meta viewport (mobil)', p.file);
  else if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(vp.attrs.content)) STREDNA('viewport', `viewport zakazuje priblíženie: ${vp.attrs.content}`, W(vp));
  else OK('viewport', vp.attrs.content, W(vp));
  // titulok a popis
  const tit = byTag(R, 'title').filter((n) => !anc(n, (a) => a.tag === 'svg'));
  S.title = tit[0] ? norm(textInline({ children: tit[0].children.map((c) => ({ ...c })) }) || tit[0].children[0]?.text || '') : '';
  if (tit[0]) S.title = norm(tit[0].children[0]?.text || '');
  if (tit.length !== 1) VAZNA('title', `počet <title>: ${tit.length}`, p.file);
  else {
    const L = [...S.title].length;
    const okL = L >= LEN.title[0] && L <= LEN.title[1];
    (okL ? OK : (p.index === true ? STREDNA : DROBNA))('title', `„${S.title}“ (${L} znakov, odporúčané ${LEN.title.join('–')})`, W(tit[0]));
  }
  const d = meta(R, 'description');
  S.desc = d[0]?.attrs.content || '';
  if (d.length !== 1) (p.index === true ? VAZNA : DROBNA)('description', `počet meta description: ${d.length}`, p.file);
  else {
    const L = [...S.desc].length;
    const okL = L >= LEN.desc[0] && L <= LEN.desc[1];
    (okL ? OK : (p.index === true ? STREDNA : DROBNA))('description', `${L} znakov (odporúčané ${LEN.desc.join('–')}): „${S.desc}“`, W(d[0]));
  }
  // robots
  const rb = meta(R, 'robots').concat(meta(R, 'googlebot'));
  S.robots = rb.map((n) => n.attrs.content).join(' | ');
  const noindex = /noindex/i.test(S.robots);
  S.noindex = noindex;
  if (p.index === true && noindex) VAZNA('robots', `stránka má byť v Google, ale má ${S.robots}`, W(rb[0]));
  else if (p.index === false && !noindex) STREDNA('robots', 'stránka nemá byť v Google, ale nemá noindex', p.file);
  else OK('robots', S.robots || '(bez meta robots = indexovať)', rb[0] ? W(rb[0]) : p.file);
  // canonical
  const can = links(R, 'canonical');
  S.canonical = can[0]?.attrs.href || '';
  if (p.index === false) { if (can.length) INFO('canonical', `${S.canonical}`, W(can[0])); }
  else if (can.length !== 1) VAZNA('canonical', `počet canonical: ${can.length}`, p.file);
  else if (!/^https:\/\//.test(S.canonical)) VAZNA('canonical', `canonical nie je absolútna https adresa: ${S.canonical}`, W(can[0]));
  else if (S.canonical !== BASE + p.url) STREDNA('canonical', `canonical ${S.canonical} ≠ očakávaná ${BASE + p.url}`, W(can[0]));
  else OK('canonical', S.canonical, W(can[0]));
  // hreflang v HTML
  const hl = links(R, 'alternate').filter((n) => n.attrs.hreflang);
  S.hreflangHTML = hl.map((n) => `${n.attrs.hreflang}=${n.attrs.href}`);
  if (p.index === true) (hl.length ? OK : INFO)('hreflang-html', hl.length ? S.hreflangHTML.join(', ') : 'v HTML nie je hreflang (je len v sitemap.xml)', p.file);
  // Open Graph a Twitter
  if (p.index !== false) {
    const og = (k) => meta(R, k)[0];
    const need = ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:site_name'];
    const chybaOG = need.filter((k) => !og(k));
    if (chybaOG.length) (p.index === true ? STREDNA : DROBNA)('og', `chýba ${chybaOG.join(', ')}`, p.file); else OK('og', 'og:type/title/description/url/image/locale/site_name sú', W(og('og:title')));
    const ogType = og('og:type')?.attrs.content;
    if (ogType === 'business.business') {
      const bc = all(R, (n) => n.tag === 'meta' && /^business:contact_data/.test(n.attrs.property || ''));
      if (!bc.length) DROBNA('og-type', 'og:type business.business bez povinných business:contact_data:* (street_address, locality, postal_code, country_name); jednoduchšie og:type website', W(og('og:type')));
    }
    const ogu = og('og:url')?.attrs.content;
    if (ogu && S.canonical && ogu !== S.canonical) STREDNA('og-url', `og:url ${ogu} ≠ canonical ${S.canonical}`, W(og('og:url')));
    const ogl = og('og:locale')?.attrs.content;
    if (ogl && S.lang && ogl.slice(0, 2) !== S.lang.slice(0, 2)) STREDNA('og-locale', `og:locale ${ogl} nesedí s lang ${S.lang}`, W(og('og:locale')));
    if (p.index === true && !meta(R, 'og:locale:alternate').length) DROBNA('og-locale-alt', 'chýba og:locale:alternate (druhá jazyková verzia)', p.file);
    const ogi = og('og:image');
    if (ogi) {
      const u = ogi.attrs.content;
      if (!/^https:\/\//.test(u)) STREDNA('og-image', `og:image nie je absolútna https adresa: ${u}`, W(ogi));
      const lf = urlToFile(u, p.path);
      const sz = lf && imgSize(lf.file);
      if (!lf) INFO('og-image', `og:image mimo základnej adresy: ${u}`, W(ogi));
      else if (!sz) VAZNA('og-image', `obrázok ${rel(lf.file)} neexistuje`, W(ogi));
      else {
        const dw = +(og('og:image:width')?.attrs.content || 0), dh = +(og('og:image:height')?.attrs.content || 0);
        const t = `${rel(lf.file)} ${sz.w}×${sz.h} ${sz.typ}, ${Math.round(sz.bajty / 1024)} kB`;
        if (sz.w < 1200 || sz.h < 600) STREDNA('og-image', `${t}: menší než 1200×630`, W(ogi));
        else if ((dw && dw !== sz.w) || (dh && dh !== sz.h)) STREDNA('og-image', `${t}: og:image:width/height ${dw}×${dh} nesedí`, W(ogi));
        else OK('og-image', `${t}${dw ? '' : ' (bez og:image:width/height)'}`, W(ogi));
        if (!og('og:image:alt') && p.index === true) DROBNA('og-image-alt', 'chýba og:image:alt', W(ogi));
        if (!og('og:image:width') && p.index !== false) DROBNA('og-image-wh', 'chýba og:image:width a og:image:height (Facebook pri prvom zdieľaní nemusí ukázať obrázok)', W(ogi));
      }
    }
    const tc = meta(R, 'twitter:card')[0];
    if (!tc) (p.index === true ? STREDNA : DROBNA)('twitter', 'chýba twitter:card', p.file);
    else OK('twitter', `twitter:card=${tc.attrs.content} (titulok, popis a obrázok berie X z og:*)`, W(tc));
  }
  // ikony a manifest
  const ic = links(R, 'icon');
  S.icons = ic.map((n) => (n.attrs.href.startsWith('data:') ? 'data:URI' : n.attrs.href));
  if (!ic.length) STREDNA('favicon', 'chýba rel=icon', p.file);
  else {
    for (const n of ic) {
      if (n.attrs.href.startsWith('data:')) continue;
      const lf = urlToFile(n.attrs.href, p.path); const sz = lf && imgSize(lf.file);
      if (!sz) VAZNA('favicon', `ikona ${n.attrs.href} neexistuje`, W(n));
    }
    if (ic.length > 1) DROBNA('favicon', `${ic.length}× rel=icon (${S.icons.join(', ')}); Google aj prehliadač berú len jednu, data:URI sa nedá prehľadať`, W(ic[0]));
    else OK('favicon', S.icons.join(', '), W(ic[0]));
  }
  for (const n of links(R, 'apple-touch-icon')) { const lf = urlToFile(n.attrs.href, p.path); const sz = lf && imgSize(lf.file); if (!sz) VAZNA('apple-touch-icon', `${n.attrs.href} neexistuje`, W(n)); else (sz.w === 180 && sz.h === 180 ? OK : DROBNA)('apple-touch-icon', `${n.attrs.href} ${sz.w}×${sz.h}`, W(n)); }
  for (const n of links(R, 'manifest')) {
    const lf = urlToFile(n.attrs.href, p.path);
    try {
      const mf = JSON.parse(fs.readFileSync(lf.file, 'utf8'));
      const prob = [];
      for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) if (!mf[k]) prob.push(`chýba ${k}`);
      for (const i of mf.icons || []) { const f = path.join(path.dirname(lf.file), i.src); const sz = imgSize(f); if (!sz) prob.push(`ikona ${i.src} neexistuje`); else if (i.sizes && i.sizes !== `${sz.w}x${sz.h}`) prob.push(`ikona ${i.src} má ${sz.w}x${sz.h}, uvedené ${i.sizes}`); }
      const sizes = (mf.icons || []).map((i) => i.sizes);
      if (!sizes.includes('192x192') || !sizes.includes('512x512')) prob.push('chýba ikona 192×192 alebo 512×512');
      (prob.length ? STREDNA : OK)('manifest', `${n.attrs.href}: ${prob.length ? prob.join('; ') : `${mf.name}, ${(mf.icons || []).length} ikony, lang ${mf.lang || '-'}`}`, W(n));
    } catch (e) { VAZNA('manifest', `${n.attrs.href} sa nedá prečítať: ${e.message}`, W(n)); }
  }
  // nadpisy
  const hs = byTag(R, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6').filter((n) => !inTemplate(n));
  S.nadpisy = hs.map((n) => ({ uroven: +n.tag[1], text: textInline(n), riadok: n.line, skryty: isHidden(n) }));
  const h1 = S.nadpisy.filter((h) => h.uroven === 1 && !h.skryty);
  if (p.index !== false) {
    if (h1.length !== 1) VAZNA('h1', `počet viditeľných H1: ${h1.length}`, p.file);
    else OK('h1', `„${h1[0].text}“`, `${p.file}:${h1[0].riadok}`);
    let prev = 0;
    for (const h of S.nadpisy.filter((x) => !x.skryty)) {
      if (!h.text) STREDNA('nadpis-prazdny', `prázdny H${h.uroven}`, `${p.file}:${h.riadok}`);
      if (prev && h.uroven > prev + 1) DROBNA('nadpis-poradie', `H${prev} → H${h.uroven} (preskočená úroveň): „${h.text}“`, `${p.file}:${h.riadok}`);
      prev = h.uroven;
    }
  }
  // obrázky
  const imgs = byTag(R, 'img');
  let bezAlt = 0, dlhyAlt = 0, bezRozmerov = 0;
  for (const n of imgs) {
    const dek = n.attrs['aria-hidden'] === 'true' || n.attrs.role === 'presentation' || anc(n, (a) => a.attrs && a.attrs['aria-hidden'] === 'true');
    if (!('alt' in n.attrs)) { bezAlt++; STREDNA('img-alt', `obrázok bez alt: ${n.attrs.src}`, W(n)); }
    else if (!n.attrs.alt.trim() && !dek && n.attrs.src) DROBNA('img-alt', `prázdny alt pri obsahovom obrázku ${n.attrs.src}`, W(n));
    else if (n.attrs.alt.length > 150) { dlhyAlt++; DROBNA('img-alt-dlhy', `alt ${n.attrs.alt.length} znakov: ${n.attrs.src}`, W(n)); }
    if ('src' in n.attrs && !n.attrs.src) DROBNA('img-src', 'img so src="" (neplatné HTML; doplniť až skriptom alebo vynechať atribút)', W(n));
    if (!n.attrs.width || !n.attrs.height) { bezRozmerov++; DROBNA('img-rozmery', `img bez width/height (posun rozloženia): ${n.attrs.src}`, W(n)); }
  }
  S.obrazky = { spolu: imgs.length, bezAlt, dlhyAlt, bezRozmerov };
  if (!bezAlt) OK('img-alt', `${imgs.length} obrázkov, všetky majú alt`, p.file);
  // súbory, na ktoré stránka odkazuje
  const ref = [];
  for (const n of all(R, () => true)) {
    for (const a of ['src', 'href', 'poster', 'data-poster', 'data-lightbox-src']) if (n.attrs[a] && !(n.tag === 'a' && a === 'href')) ref.push([n, n.attrs[a]]);
    for (const a of ['srcset', 'imagesrcset', 'data-lightbox-srcset']) if (n.attrs[a]) for (const part of n.attrs[a].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u) ref.push([n, u]); }
  }
  let chybaSub = 0;
  const videne = new Set();
  for (const [n, u] of ref) {
    if (/^(https?:|data:|blob:|tel:|mailto:|#)/.test(u) || !u) continue;
    const lf = urlToFile(u, p.path);
    if (!lf || videne.has(lf.file)) continue;
    videne.add(lf.file);
    if (lf.abs) STREDNA('cesta-abs', `absolútna cesta ${u} (pod podpriečinkom /barbershop-30/ nefunguje)`, W(n));
    if (!fs.existsSync(lf.file)) { chybaSub++; VAZNA('subor-chyba', `${n.tag} ${u} → ${rel(lf.file)} neexistuje`, W(n)); }
  }
  if (!chybaSub) OK('subory', `${videne.size} odkazovaných súborov existuje`, p.file);
  // odkazy a kotvy
  const ids = new Map();
  for (const n of all(R, (x) => x.attrs && x.attrs.id)) { const id = n.attrs.id; if (ids.has(id) && !inTemplate(n) && !inTemplate(ids.get(id))) STREDNA('id-duplicitne', `id="${id}" je viackrát`, W(n)); ids.set(id, n); }
  p.ids = ids;
  const as = byTag(R, 'a').filter((n) => !inTemplate(n));
  const ext = new Map(), interne = [];
  let blank = 0;
  for (const n of as) {
    const h = n.attrs.href;
    if (h === undefined) continue;
    if (!h.trim()) { STREDNA('odkaz-prazdny', 'a href="" ', W(n)); continue; }
    if (n.attrs.target === '_blank' && !/noopener|noreferrer/.test(n.attrs.rel || '')) blank++;
    if (/^http:\/\//.test(h)) STREDNA('odkaz-http', `nezabezpečený odkaz ${h}`, W(n));
    if (/^https?:\/\//.test(h) && !(BASE && h.startsWith(BASE))) { const host = new URL(h).host; ext.set(host, (ext.get(host) || 0) + 1); continue; }
    if (/^(tel|mailto):/.test(h)) continue;
    const txt = textInline(n) || n.attrs['aria-label'] || '';
    if (!txt && !byTag(n, 'img').some((i) => i.attrs.alt)) STREDNA('odkaz-text', `odkaz bez textu: ${h}`, W(n));
    interne.push([n, h]);
  }
  for (const [n, h] of interne) {
    if (h.startsWith('#')) { if (h.length > 1 && !ids.has(decodeURIComponent(h.slice(1)))) VAZNA('kotva', `kotva ${h} na stránke neexistuje`, W(n)); continue; }
    const lf = urlToFile(h, p.path);
    if (!lf) continue;
    if (!fs.existsSync(lf.file)) VAZNA('odkaz-chyba', `odkaz ${h} → ${rel(lf.file)} neexistuje`, W(n));
    else if (lf.hash) { const t = pages.find((q) => q.path === lf.file); if (t && t.root && !all(t.root, (x) => x.attrs && x.attrs.id === lf.hash.slice(1)).length) VAZNA('kotva', `${h}: kotva ${lf.hash} v ${rel(lf.file)} neexistuje`, W(n)); }
  }
  S.odkazy = { spolu: as.length, interne: interne.length, externe: Object.fromEntries(ext) };
  OK('odkazy', `${as.length} odkazov, interných ${interne.length}, externé domény: ${[...ext].map(([k, v]) => `${k} ${v}×`).join(', ') || '-'}`, p.file);
  if (blank) STREDNA('target-blank', `${blank} odkazov target=_blank bez rel=noopener`, p.file);
  // text bez skriptu a miestne slová
  const body = byTag(R, 'body')[0] || R;
  const txt = norm(textOf(body));
  const slova = txt.split(' ').filter((w) => /\p{L}/u.test(w));
  S.slov = slova.length;
  S.textBezJS = txt;
  if (p.index === true) (slova.length >= 300 ? OK : STREDNA)('text', `${slova.length} slov viditeľného textu v HTML bez skriptu`, p.file);
  if (p.index === true) {
    const KW = p.lang === 'sk'
      ? { 'Nitra/Nitre/Nitry': /nitr(a|e|y|u|ou|iansk)/gi, barbershop: /barbershop/gi, 'barber(i/ka)': /\bbarber(?!shop)/gi, 'holičstvo/holič': /holič/gi, 'Mostná/Mostnej': /mostn(á|ej|ou|ú)/gi, strih: /strih/gi, 'brada/brady': /brad(a|y|u|ou)\b/gi, holenie: /holeni/gi, fade: /\bfade\b/gi, 'cenník': /cenník/gi, 'centrum/centre': /centr(um|e)\b/gi, 'bez objednania': /bez objedn/gi, 'poukážka': /poukáž/gi, 'detský strih': /detsk|malých gentleman/gi }
      : { Nitra: /nitra/gi, barbershop: /barbershop/gi, barber: /\bbarber(?!shop)/gi, haircut: /haircut/gi, beard: /beard/gi, shave: /shav/gi, fade: /\bfade\b/gi, 'price list': /price list|prices/gi, 'Mostná': /mostn/gi, 'city centre': /cent(re|er)/gi, 'walk-in': /walk-?in|without (an )?appointment/gi, 'gift voucher': /voucher|gift card/gi };
    const kde = { titulok: S.title, popis: S.desc, h1: h1.map((h) => h.text).join(' '), h2: S.nadpisy.filter((h) => h.uroven === 2).map((h) => h.text).join(' | '), text: txt };
    S.slovaKluc = {};
    for (const [k, re] of Object.entries(KW)) S.slovaKluc[k] = Object.fromEntries(Object.entries(kde).map(([m, s]) => [m, (s.match(re) || []).length]));
    const riadky = Object.entries(S.slovaKluc).map(([k, v]) => `${k}: titulok ${v.titulok}, popis ${v.popis}, H1 ${v.h1}, H2 ${v.h2}, text ${v.text}`);
    INFO('slova', 'miestne a služobné slová\n          ' + riadky.join('\n          '), p.file);
  }
  // JSON-LD
  const lds = byTag(R, 'script').filter((n) => /ld\+json/i.test(n.attrs.type || ''));
  S.jsonld = [];
  for (const n of lds) {
    const raw = n.children[0]?.text || '';
    try { const j = JSON.parse(raw); S.jsonld.push({ j, line: n.line }); OK('jsonld-syntax', `JSON-LD sa dá prečítať (@type ${[].concat(j['@type']).join(',')})`, W(n)); }
    catch (e) { VAZNA('jsonld-syntax', `JSON-LD sa nedá prečítať: ${e.message}`, W(n)); }
  }
  if (p.index === true && !lds.length) STREDNA('jsonld', 'stránka nemá JSON-LD', p.file);
}

// ---------------------------------------------------------------- JSON-LD: slovník schema.org, pravidlá Google, súlad s textom
let vocab = null;
if (opt.schema && fs.existsSync(opt.schema)) {
  const g = JSON.parse(fs.readFileSync(opt.schema, 'utf8'))['@graph'];
  vocab = new Map(g.map((x) => [x['@id'], x]));
}
const isSubclass = (t, of) => { if (!vocab) return null; const seen = new Set(); const q = ['schema:' + t]; while (q.length) { const c = q.shift(); if (c === 'schema:' + of) return true; if (seen.has(c)) continue; seen.add(c); const x = vocab.get(c); for (const s of [].concat(x?.['rdfs:subClassOf'] || [])) q.push(s['@id']); } return false; };
const lineOfKey = (p, ld, key) => { const i = p.src.indexOf(`"${key}"`, p.src.indexOf('application/ld+json')); return i < 0 ? ld.line : p.src.slice(0, i).split('\n').length; };
function visitLD(o, fn, cesta = '') { if (Array.isArray(o)) return o.forEach((x, i) => visitLD(x, fn, `${cesta}[${i}]`)); if (o && typeof o === 'object') { fn(o, cesta); for (const [k, v] of Object.entries(o)) if (!k.startsWith('@')) visitLD(v, fn, cesta ? `${cesta}.${k}` : k); } }
const DNI = { Monday: 'Po', Tuesday: 'Ut', Wednesday: 'St', Thursday: 'Št', Friday: 'Pi', Saturday: 'So', Sunday: 'Ne' };
const parsePrice = (s) => { const m = /(\d+(?:[.,]\d+)?)\s*€/.exec(s); return m ? +m[1].replace(',', '.') : null; };
for (const p of pages.filter((x) => x.root && summary[x.file]?.jsonld?.length)) {
  console.log(`\n=== JSON-LD ${p.file}`);
  const S = summary[p.file];
  for (const ld of S.jsonld) {
    const j = ld.j, W = (k) => `${p.file}:${lineOfKey(p, ld, k)}`;
    // typy a vlastnosti podľa slovníka
    if (vocab) {
      const zle = new Set(), zleP = new Set();
      visitLD(j, (o) => { for (const t of [].concat(o['@type'] || [])) if (!vocab.has('schema:' + t)) zle.add(t); for (const k of Object.keys(o)) if (!k.startsWith('@') && !vocab.has('schema:' + k)) zleP.add(k); });
      for (const t of zle) VAZNA('jsonld-typ', `@type "${t}" v slovníku schema.org neexistuje (Google údaje nerozpozná ako firmu); existuje napr. HairSalon`, W('@type'));
      for (const k of zleP) STREDNA('jsonld-vlastnost', `vlastnosť "${k}" v schema.org neexistuje`, W(k));
      if (!zle.size && !zleP.size) OK('jsonld-slovnik', 'všetky @type a vlastnosti sú v schema.org', `${p.file}:${ld.line}`);
    } else INFO('jsonld-slovnik', 'bez --schema sa typy a vlastnosti neoverujú', p.file);
    const typ = [].concat(j['@type'])[0];
    const lb = vocab ? isSubclass(typ, 'LocalBusiness') : null;
    if (lb === false) VAZNA('jsonld-localbusiness', `@type ${typ} nie je podtyp LocalBusiness`, W('@type'));
    if (lb) OK('jsonld-localbusiness', `${typ} je podtyp LocalBusiness`, W('@type'));
    // povinné a odporúčané podľa Google (Local business structured data)
    for (const k of ['name', 'address']) if (!j[k]) VAZNA('jsonld-povinne', `chýba povinné ${k}`, `${p.file}:${ld.line}`);
    const odpor = ['url', 'telephone', 'openingHoursSpecification', 'geo', 'priceRange', 'image'];
    const chyba = odpor.filter((k) => !j[k]);
    (chyba.length ? DROBNA : OK)('jsonld-odporucane', chyba.length ? `chýba odporúčané podľa Google: ${chyba.join(', ')}` : 'odporúčané vlastnosti sú', `${p.file}:${ld.line}`);
    if (!j['@id']) DROBNA('jsonld-id', 'chýba @id (napr. BASE + "#firma"), podnik sa nedá prepojiť s inými údajmi', `${p.file}:${ld.line}`);
    if (j.aggregateRating || j.review) STREDNA('jsonld-recenzie', 'aggregateRating/review o sebe samom Google pre LocalBusiness nezobrazuje (pravidlá „self-serving reviews“) a podklady ich zakazujú', W(j.aggregateRating ? 'aggregateRating' : 'review'));
    else OK('jsonld-recenzie', 'bez aggregateRating a review (v súlade s pravidlami Google aj podkladmi)', `${p.file}:${ld.line}`);
    // URL
    for (const k of ['url', 'image']) {
      const u = j[k]; if (!u) continue;
      if (BASE && !String(u).startsWith(BASE)) INFO('jsonld-url', `${k} ${u} je mimo základnej adresy`, W(k));
      const lf = urlToFile(u, p.path);
      if (lf && !fs.existsSync(lf.file)) VAZNA('jsonld-url', `${k} ${u} → ${rel(lf.file)} neexistuje`, W(k));
    }
    if (j.url && p.file === 'index.html' && j.url !== S.canonical) STREDNA('jsonld-url', `url ${j.url} ≠ canonical ${S.canonical}`, W('url'));
    // telefón, e-mail, adresa, sociálne siete vs. stránka
    const tels = new Set(byTag(p.root, 'a').map((n) => n.attrs.href || '').filter((h) => h.startsWith('tel:')).map((h) => h.slice(4)));
    if (j.telephone) (tels.has(j.telephone) ? OK : STREDNA)('jsonld-telefon', `telephone ${j.telephone}; na stránke tel: ${[...tels].join(', ')}`, W('telephone'));
    const mails = new Set(byTag(p.root, 'a').map((n) => n.attrs.href || '').filter((h) => h.startsWith('mailto:')).map((h) => h.slice(7)));
    if (j.email) (mails.has(j.email) ? OK : STREDNA)('jsonld-email', `email ${j.email}; na stránke ${[...mails].join(', ')}`, W('email'));
    const txt = S.textBezJS;
    if (j.address) {
      const a = j.address, chybaA = ['streetAddress', 'postalCode', 'addressLocality'].filter((k) => a[k] && !txt.includes(a[k]));
      if (!a.addressCountry) DROBNA('jsonld-adresa', 'chýba addressCountry', W('address'));
      (chybaA.length ? STREDNA : OK)('jsonld-adresa', `${a.streetAddress}, ${a.postalCode} ${a.addressLocality}, ${a.addressCountry}${chybaA.length ? ' – v texte stránky chýba ' + chybaA.join(', ') : ' – zhoda s textom stránky'}`, W('address'));
    }
    const hrefs = new Set(byTag(p.root, 'a').map((n) => n.attrs.href));
    for (const s of [].concat(j.sameAs || [])) (hrefs.has(s) ? OK : DROBNA)('jsonld-sameAs', `${s}${hrefs.has(s) ? ' (odkaz je aj na stránke)' : ' (na stránke nie je)'}`, W('sameAs'));
    if (j.hasMap) (hrefs.has(j.hasMap) ? OK : DROBNA)('jsonld-hasMap', `${j.hasMap}`, W('hasMap'));
    // otváracie hodiny vs. pätička
    const hod = [].concat(j.openingHoursSpecification || []);
    if (hod.length) {
      const zle = [];
      const VALID = new Set(Object.keys(DNI));
      const ld2 = {};
      for (const h of hod) {
        for (const dname of [].concat(h.dayOfWeek)) { const dn = String(dname).replace('https://schema.org/', ''); if (!VALID.has(dn)) zle.push(`deň ${dname}`); ld2[dn] = `${h.opens}–${h.closes}`; }
        if (!/^\d\d:\d\d(:\d\d)?$/.test(h.opens) || !/^\d\d:\d\d(:\d\d)?$/.test(h.closes)) zle.push(`čas ${h.opens}–${h.closes}`);
      }
      // čas v texte stránky (9:00–19:00 aj 09:00–19:00)
      const tnorm = txt.replace(/\b(\d):/g, '0$1:').replace(/\s*[-–]\s*/g, '–');
      const casy = [...new Set(Object.values(ld2))].filter((c) => !tnorm.includes(c));
      if (zle.length) VAZNA('jsonld-hodiny', `neplatné hodnoty: ${zle.join(', ')}`, W('openingHoursSpecification'));
      (casy.length ? STREDNA : OK)('jsonld-hodiny', `${Object.entries(ld2).map(([d, c]) => DNI[d] + ' ' + c).join(', ')}${casy.length ? ' – v texte stránky chýba ' + casy.join(', ') : ' – časy sú aj v texte stránky'}`, W('openingHoursSpecification'));
    }
    // ponuky vs. cenník na stránke
    const cat = j.hasOfferCatalog?.itemListElement || [];
    if (cat.length) {
      const riadky = all(p.root, (n) => n.tag === 'li' && /\bprice-row\b/.test(n.attrs.class || '')).map((li) => ({
        meno: textInline(all(li, (x) => /\bprice-name\b/.test(x.attrs.class || ''))[0] || { children: [] }),
        cena: parsePrice(textInline(all(li, (x) => /\bprice-amount\b/.test(x.attrs.class || ''))[0] || { children: [] })),
        line: li.line,
      }));
      const mapa = new Map(riadky.map((r) => [norm(r.meno).toLowerCase(), r]));
      const zle = [];
      for (const o of cat) {
        const meno = norm(o.itemOffered?.name || o.name || '').toLowerCase();
        const r = mapa.get(meno);
        if (!o.priceCurrency) zle.push(`${meno}: chýba priceCurrency`);
        if (o.price === undefined || isNaN(+o.price)) zle.push(`${meno}: price „${o.price}“ nie je číslo`);
        if (!r) zle.push(`„${meno}“ nie je v cenníku na stránke`);
        else if (r.cena !== +o.price) zle.push(`„${meno}“: JSON-LD ${o.price} €, stránka ${r.cena} € (riadok ${r.line})`);
      }
      const navyse = riadky.filter((r) => !cat.some((o) => norm(o.itemOffered?.name || '').toLowerCase() === norm(r.meno).toLowerCase()));
      for (const r of navyse) zle.push(`v cenníku je „${r.meno}“ (riadok ${r.line}), v JSON-LD nie`);
      (zle.length ? STREDNA : OK)('jsonld-cennik', zle.length ? zle.join('; ') : `${cat.length} ponúk = ${riadky.length} riadkov cenníka, názvy aj ceny sedia`, W('hasOfferCatalog'));
    }
    if (j.potentialAction) {
      const t = j.potentialAction.target;
      INFO('jsonld-rezervacia', `${j.potentialAction['@type']} → ${typeof t === 'string' ? t : JSON.stringify(t)} (Google ho pri bežnom webe nezobrazuje, neškodí)`, W('potentialAction'));
    }
    if (j.foundingDate) INFO('jsonld-zalozenie', `foundingDate ${j.foundingDate}`, W('foundingDate'));
  }
}

// ---------------------------------------------------------------- jedinečnosť titulkov a popisov
console.log('\n=== Jedinečnosť');
const ind = pages.filter((p) => p.root && p.index !== false);
for (const k of ['title', 'desc']) {
  const m = new Map();
  for (const p of ind) { const v = summary[p.file][k]; if (!v) continue; m.set(v, [...(m.get(v) || []), p.file]); }
  const dup = [...m].filter(([, f]) => f.length > 1);
  (dup.length ? STREDNA : OK)(`jedinecny-${k}`, dup.length ? dup.map(([v, f]) => `„${v}“ na ${f.join(', ')}`).join('; ') : `${k === 'title' ? 'titulky' : 'popisy'} sú jedinečné (${ind.map((p) => p.file).join(', ')})`);
}

// ---------------------------------------------------------------- robots.txt
console.log('\n=== robots.txt');
const robotsF = path.join(SITE, 'robots.txt');
let disallow = [];
if (!fs.existsSync(robotsF)) VAZNA('robots-txt', 'robots.txt chýba', 'robots.txt');
else {
  const r = fs.readFileSync(robotsF, 'utf8').split('\n');
  let ua = null; const sm = [];
  r.forEach((l, i) => {
    const s = l.replace(/#.*/, '').trim(); if (!s) return;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(s);
    if (!m) { STREDNA('robots-syntax', `neznámy riadok „${s}“`, `robots.txt:${i + 1}`); return; }
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') ua = v; else if (k === 'disallow' && v) disallow.push({ v, line: i + 1, ua }); else if (k === 'sitemap') sm.push({ v, line: i + 1 });
  });
  OK('robots-syntax', `User-agent ${ua}, Disallow: ${disallow.map((d) => d.v).join(' ') || '-'}`, 'robots.txt');
  for (const s of sm) (s.v === BASE + 'sitemap.xml' ? OK : STREDNA)('robots-sitemap', `Sitemap: ${s.v}${s.v === BASE + 'sitemap.xml' ? '' : ' ≠ ' + BASE + 'sitemap.xml'}`, `robots.txt:${s.line}`);
  if (!sm.length) STREDNA('robots-sitemap', 'robots.txt neuvádza Sitemap', 'robots.txt');
  const basePath = BASE ? new URL(BASE).pathname : '/';
  if (basePath !== '/') DROBNA('robots-umiestnenie', `web je v podpriečinku ${basePath}: vyhľadávače čítajú len robots.txt v koreni domény, tento súbor platí až na vlastnej doméne (napr. www.barbershop30.sk)`, 'robots.txt');
  // blokuje robots niečo, čo má byť v Google, alebo CSS/JS/obrázky?
  for (const p of pages.filter((x) => x.root)) {
    const cesta = '/' + p.url;
    const blok = disallow.find((d) => cesta.startsWith(d.v));
    if (blok && p.index === true) VAZNA('robots-blok', `Disallow ${blok.v} blokuje indexovanú stránku ${p.file}`, `robots.txt:${blok.line}`);
    if (blok && p.index === false && summary[p.file]?.noindex) DROBNA('robots-noindex', `${p.file}: Disallow ${blok.v} a zároveň noindex – Google noindex neprečíta (pri odkaze zvonka môže adresu zaradiť bez obsahu); stačí jedno`, `robots.txt:${blok.line}`);
  }
  for (const d of disallow) if (/^\/assets/.test(d.v)) VAZNA('robots-blok', `Disallow ${d.v} blokuje CSS/JS/obrázky`, `robots.txt:${d.line}`);
}

// ---------------------------------------------------------------- sitemap.xml
console.log('\n=== sitemap.xml');
const smF = path.join(SITE, 'sitemap.xml');
if (!fs.existsSync(smF)) VAZNA('sitemap', 'sitemap.xml chýba', 'sitemap.xml');
else {
  const xml = fs.readFileSync(smF, 'utf8');
  try { execFileSync('python3', ['-I', '-c', 'import sys,xml.dom.minidom;xml.dom.minidom.parse(sys.argv[1])', smF], { stdio: 'pipe' }); OK('sitemap-xml', 'XML je platné', 'sitemap.xml'); }
  catch (e) { VAZNA('sitemap-xml', `XML nie je platné: ${String(e.stderr).split('\n').filter(Boolean).pop()}`, 'sitemap.xml'); }
  const lineAt = (i) => xml.slice(0, i).split('\n').length;
  const urls = [];
  const ure = /<url>([\s\S]*?)<\/url>/g; let m;
  while ((m = ure.exec(xml))) {
    const b = m[1];
    const loc = (/<loc>([^<]+)<\/loc>/.exec(b) || [])[1];
    const lastmod = (/<lastmod>([^<]+)<\/lastmod>/.exec(b) || [])[1];
    const alts = [...b.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)].map((x) => ({ hl: x[1], href: x[2] }));
    urls.push({ loc, lastmod, alts, line: lineAt(m.index + b.indexOf('<loc>') + 5) });
  }
  OK('sitemap-url', `${urls.length} adries: ${urls.map((u) => u.loc.replace(BASE, '/')).join(' ')}`, 'sitemap.xml');
  const HL = /^([a-z]{2,3})(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/;
  const today = new Date().toISOString().slice(0, 10);
  for (const u of urls) {
    const W = `sitemap.xml:${u.line}`;
    if (!u.loc || !u.loc.startsWith(BASE)) STREDNA('sitemap-loc', `loc ${u.loc} je mimo základnej adresy ${BASE}`, W);
    const lf = urlToFile(u.loc, path.join(SITE, 'x'));
    const pg = lf && pages.find((q) => q.path === lf.file);
    if (lf && !fs.existsSync(lf.file)) VAZNA('sitemap-loc', `${u.loc} → ${rel(lf.file)} neexistuje`, W);
    else if (pg && summary[pg.file]) {
      const S = summary[pg.file];
      if (S.noindex) VAZNA('sitemap-noindex', `${u.loc} má noindex, nemá byť v sitemap`, W);
      if (S.canonical && S.canonical !== u.loc) STREDNA('sitemap-kanonicka', `${u.loc}: stránka má canonical ${S.canonical}; do sitemap patria len kanonické adresy (Google túto adresu aj jej hreflang ignoruje)`, W);
    }
    if (!u.lastmod) DROBNA('sitemap-lastmod', `${u.loc} bez lastmod`, W);
    else if (!/^\d{4}-\d\d-\d\d(T[\d:.]+(Z|[+-]\d\d:\d\d))?$/.test(u.lastmod)) STREDNA('sitemap-lastmod', `lastmod ${u.lastmod} nie je W3C dátum`, W);
    else if (u.lastmod.slice(0, 10) > today) STREDNA('sitemap-lastmod', `lastmod ${u.lastmod} je v budúcnosti`, W);
    else if (opt.git && lf && fs.existsSync(lf.file)) {
      try { const g = execFileSync('git', ['-C', path.dirname(lf.file), 'log', '-1', '--format=%cs', '--', lf.file], { encoding: 'utf8' }).trim(); if (g && g > u.lastmod.slice(0, 10)) DROBNA('sitemap-lastmod', `${u.loc}: lastmod ${u.lastmod}, posledná zmena súboru ${g}`, W); else if (g) OK('sitemap-lastmod', `${u.loc.replace(BASE, '/')}: lastmod ${u.lastmod}, posledný commit súboru ${g}`, W); } catch (e) { /* mimo gitu */ }
    }
    const badHL = u.alts.filter((a) => a.hl !== 'x-default' && !HL.test(a.hl));
    if (badHL.length) VAZNA('hreflang-kod', `neplatný kód: ${badHL.map((a) => a.hl).join(', ')}`, W);
    if (u.alts.length && !u.alts.some((a) => a.href === u.loc)) STREDNA('hreflang-self', `${u.loc} neodkazuje sám na seba`, W);
    if (u.alts.length && !u.alts.some((a) => a.hl === 'x-default')) STREDNA('hreflang-xdefault', `${u.loc} bez x-default`, W);
  }
  // vzájomnosť: každá adresa v skupine má rovnakú sadu alternatív
  const sig = (u) => u.alts.map((a) => `${a.hl}=${a.href}`).sort().join('|');
  const groups = new Map(); for (const u of urls.filter((x) => x.alts.length)) groups.set(sig(u), [...(groups.get(sig(u)) || []), u.loc]);
  if (groups.size > 1) STREDNA('hreflang-vzajomnost', `adresy majú rôzne sady hreflang (${groups.size} skupiny)`, 'sitemap.xml');
  else if (groups.size === 1) {
    const alts = urls.find((x) => x.alts.length).alts;
    const chybaLoc = alts.filter((a) => a.hl !== 'x-default' && !urls.some((u) => u.loc === a.href));
    (chybaLoc.length ? STREDNA : OK)('hreflang-vzajomnost', chybaLoc.length ? `hreflang na adresy, ktoré nie sú v sitemap: ${chybaLoc.map((a) => a.href).join(', ')}` : `všetkých ${urls.length} adries má rovnakú sadu ${alts.length} hreflang (${alts.map((a) => a.hl).join(', ')}) – vzájomné`, 'sitemap.xml');
    // hreflang musí viesť na kanonické adresy
    const nekan = alts.filter((a) => { const lf = urlToFile(a.href, path.join(SITE, 'x')); const pg = lf && pages.find((q) => q.path === lf.file); return pg && summary[pg.file]?.canonical && summary[pg.file].canonical !== a.href; });
    if (nekan.length) STREDNA('hreflang-kanonicka', `${nekan.length} hreflang vedie na adresy s inou canonical (${nekan.map((a) => a.hl).join(', ')} → ${nekan[0].href} má canonical ${BASE}); Google také hreflang ignoruje a ?lang= stránky má za duplikát slovenskej`, 'sitemap.xml');
  }
  // sú v sitemap všetky stránky na indexovanie?
  for (const p of pages.filter((x) => x.root && x.index === true)) if (!urls.some((u) => u.loc === BASE + p.url)) STREDNA('sitemap-chyba-stranka', `${BASE + p.url} (${p.file}) nie je v sitemap`, 'sitemap.xml');
  // obrázky v sitemap
  for (const im of xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) { const lf = urlToFile(im[1], path.join(SITE, 'x')); if (lf && !fs.existsSync(lf.file)) VAZNA('sitemap-image', `${im[1]} neexistuje`, 'sitemap.xml'); }
}

// ---------------------------------------------------------------- súhrn
const pocty = nalezy.reduce((a, n) => ((a[n.lvl] = (a[n.lvl] || 0) + 1), a), {});
console.log(`\nSÚHRN: ${['VAZNA', 'STREDNA', 'DROBNA', 'OK', 'INFO'].map((k) => `${k} ${pocty[k] || 0}`).join(', ')}`);
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ site: SITE, base: BASE, datum: new Date().toISOString(), nalezy, summary: Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, { ...v, textBezJS: undefined, jsonld: v.jsonld?.map((x) => x.j) }])) }, null, 1));
process.exit(pocty.VAZNA ? 1 : 0);
