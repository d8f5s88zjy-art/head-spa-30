/* Kontrola Booqme oproti webu, prenosná verzia tools/booqme-kontrola.mjs z repozitára HEAD SPA 30.
   Ceny a dĺžky služieb v online kalendári a ceny poukazov v obchode musia sedieť s cenníkom na webe.
   Číta len verejné stránky Booqme, nič nemení, prihlásenie nepotrebuje.
   Spustenie: node booqme-kontrola.mjs <index.html> <adresa-prevádzky-v-booqme>
   napr.      node booqme-kontrola.mjs index.html salon-30-head-spa
   Za proxy:  NODE_USE_ENV_PROXY=1 node booqme-kontrola.mjs …
   Web musí mať: <article data-min=".." data-price=".."> s názvom v <h3> presne ako služba v Booqme,
   alebo <li data-booqme="názov v Booqme" data-min=".." data-price=".."> pre služby bez poukazu. */
import fs from 'node:fs';

const [HTML, SLUG] = process.argv.slice(2);
if (!HTML || !SLUG) { console.log('Použitie: node booqme-kontrola.mjs <index.html> <adresa-prevádzky-v-booqme>'); process.exit(2); }
const KALENDAR = `https://booqme.app/sk/rezervacia/${SLUG}`;
const OBCHOD = `https://booqme.app/sk/eshop/${SLUG}`;
const dec = (s) => s.replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/&euro;/g, '€').replace(/&#039;/g, "'").replace(/&quot;/g, '"');

// web: služby z cenníka
const html = fs.readFileSync(HTML, 'utf8');
const web = [];
for (const m of html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)) {
  const a = m[1]; if (!/data-price="/.test(a)) continue;
  const name = dec((m[2].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '').trim();
  web.push({ name, min: +(a.match(/data-min="(\d+)"/) || [])[1], price: Math.round(+(a.match(/data-price="([\d.]+)"/) || [])[1]) });
}
// služby bez poukazu (napr. fúkaná): presný názov z Booqme v data-booqme, poradie atribútov ako tu
for (const m of html.matchAll(/<li data-booqme="([^"]+)" data-min="(\d+)" data-price="([\d.]+)"/g)) {
  web.push({ name: dec(m[1]).trim(), min: +m[2], price: Math.round(+m[3]), bezPoukazu: true });
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'kontrola cennika' } });
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
// Booqme obchod: poukazy s cenou (typ poukazu sa volá „Poukaz: <názov služby>“)
const poukazy = new Map();
for (const m of obch.matchAll(/<img[^>]*src="([^"]+)"[^>]*alt="Poukaz: ([^"]+)"[\s\S]*?Cena:<\/span><span class="fw-medium">([\d.,]+)/g)) {
  poukazy.set(dec(m[2]).trim(), { price: Math.round(+m[3].replace(',', '.')), img: m[1] });
}

// kalendár a obchod sa hlásia zvlášť: web sa riadi kalendárom, ceny poukazov opravuje majiteľ v obchode Booqme
const kalChyby = [], obchChyby = [];
for (const r of web) {
  const s = sluzby.get(r.name), p = poukazy.get(r.name);
  if (!s) kalChyby.push(`${r.name}: v online kalendári chýba`);
  else {
    if (s.price !== r.price) kalChyby.push(`${r.name}: kalendár ${s.price} €, web ${r.price} €`);
    if (s.min !== r.min) kalChyby.push(`${r.name}: kalendár ${s.min} min, web ${r.min} min`);
  }
  if (r.bezPoukazu) continue;
  if (!p) obchChyby.push(`${r.name}: v obchode chýba poukaz`);
  else if (p.price !== r.price) obchChyby.push(`${r.name}: poukaz ${p.price} €, web ${r.price} €`);
}
for (const n of sluzby.keys()) if (!web.find((r) => r.name === n)) kalChyby.push(`${n}: je v kalendári, ale nie na webe`);

console.log(`Web: ${web.length} služieb · Booqme kalendár: ${sluzby.size} služieb · obchod: ${poukazy.size} poukazov`);
if (!sluzby.size) console.log('Pozor: z kalendára sa nenačítala ani jedna služba, Booqme možno zmenilo stránku (uprav regulárne výrazy).');
console.log(kalChyby.length ? '\nKalendár nesedí s webom:' : '\nKalendár sedí: ceny a dĺžky sú rovnaké ako na webe.');
kalChyby.forEach((c) => console.log(' - ' + c));
console.log(obchChyby.length ? '\nObchod s poukazmi nesedí s webom:' : '\nObchod s poukazmi sedí.');
obchChyby.forEach((c) => console.log(' - ' + c));
process.exitCode = kalChyby.length || obchChyby.length ? 1 : 0;
