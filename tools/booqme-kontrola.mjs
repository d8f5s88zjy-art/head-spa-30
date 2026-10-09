/* Kontrola Booqme oproti webu: ceny a dĺžky rituálov v online kalendári a ceny poukazov v obchode
   musia sedieť s cenníkom na webe. Číta len verejné stránky Booqme, nič nemení.
   Spustenie: node tools/booqme-kontrola.mjs  (ak je sieť za proxy: NODE_USE_ENV_PROXY=1) */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const KALENDAR = 'https://booqme.app/sk/rezervacia/barbershop-30';
const OBCHOD = 'https://booqme.app/sk/eshop/barbershop-30';
const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&euro;/g, '€').replace(/&#039;/g, "'").replace(/&quot;/g, '"');

// web: rituály z cenníka
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const web = [];
for (const m of html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)) {
  const a = m[1]; if (!/data-price="/.test(a)) continue;
  const name = dec((m[2].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '').trim();
  web.push({ name, min: +(a.match(/data-min="(\d+)"/) || [])[1], price: +(a.match(/data-price="(\d+)"/) || [])[1] });
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'HEAD SPA 30 kontrola' } });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}
const [kal, obch] = await Promise.all([get(KALENDAR), get(OBCHOD)]);

// Booqme kalendár: služby s cenou a dĺžkou
const sluzby = new Map();
for (const m of kal.matchAll(/data-service_name="([^"]+)"[^>]*data-price-raw="([\d.]+)"([\s\S]{0,3000}?)(\d+)\s*min/g)) {
  const n = dec(m[1]).trim();
  if (!sluzby.has(n)) sluzby.set(n, { price: Math.round(+m[2]), min: +m[4] });
}
// Booqme obchod: poukazy s cenou a obrázkom
const poukazy = new Map();
for (const m of obch.matchAll(/<img[^>]*src="([^"]+)"[^>]*alt="Poukaz: ([^"]+)"[\s\S]*?Cena:<\/span><span class="fw-medium">([\d.,]+)/g)) {
  poukazy.set(dec(m[2]).trim(), { price: Math.round(+m[3].replace(',', '.')), img: m[1] });
}

const chyby = [];
for (const r of web) {
  const s = sluzby.get(r.name), p = poukazy.get(r.name);
  if (!s) chyby.push(`${r.name}: v online kalendári chýba`);
  else {
    if (s.price !== r.price) chyby.push(`${r.name}: kalendár ${s.price} €, web ${r.price} €`);
    if (s.min !== r.min) chyby.push(`${r.name}: kalendár ${s.min} min, web ${r.min} min`);
  }
  if (!p) chyby.push(`${r.name}: v obchode chýba poukaz`);
  else if (p.price !== r.price) chyby.push(`${r.name}: poukaz ${p.price} €, web ${r.price} €`);
}
for (const n of sluzby.keys()) if (!web.find((r) => r.name === n)) chyby.push(`${n}: je v kalendári, ale nie na webe`);

console.log(`Web: ${web.length} rituálov · Booqme kalendár: ${sluzby.size} služieb · obchod: ${poukazy.size} poukazov`);
if (chyby.length) { console.log('\nNesedí:'); chyby.forEach((c) => console.log(' - ' + c)); process.exitCode = 1; }
else console.log('Všetko sedí: ceny a dĺžky v Booqme sú rovnaké ako na webe.');
