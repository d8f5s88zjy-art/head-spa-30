// Červený tím – texty stránky ako jediný zdroj: skupiny cenníka z index.html, preklady z assets/i18n/*.json.
// Číta len index.html, assets/i18n/<jazyk>.json a z assets/recepcia/sk.json iba polia `id` (kontrola mien tém).
// Nečíta recepcia.js ani kmene recepcie.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const JAZYKY = ['sk', 'cs', 'en', 'de', 'pl', 'hu', 'sr', 'uk'];
export const STROM = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30';

// Normalizácia podľa P7 (b): bez diakritiky, malé písmená, všetko okrem písmen a číslic je medzera.
export const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const text = (s) => s.replace(/<span class="visually-hidden">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function nacitajStranku(strom = STROM) {
  const html = readFileSync(join(strom, 'index.html'), 'utf8');
  const riadokZ = (idx) => html.slice(0, idx).split('\n').length;
  const skupiny = [];
  const reSk = /<section class="price-group" aria-labelledby="(g-[a-z]+)">([\s\S]*?)<\/section>/g;
  for (let m; (m = reSk.exec(html));) {
    const [, id, telo] = m;
    const nadpis = text(/<h3 class="price-group-title"[^>]*>([\s\S]*?)<\/h3>/.exec(telo)[1]);
    const riadky = [];
    const reR = /<li class="price-row">([\s\S]*?)<\/li>/g;
    for (let r; (r = reR.exec(telo));) {
      const t = r[1];
      const pos = m.index + m[0].indexOf(r[0]);
      riadky.push({
        nazov: text(/<h4 class="price-name">([\s\S]*?)<\/h4>/.exec(t)[1]),
        cas: text(/<p class="price-time">([\s\S]*?)<\/p>/.exec(t)[1]),
        cena: text(/<p class="price-amount">([\s\S]*?)<\/p>/.exec(t)[1]),
        riadok: riadokZ(pos) + 1,
      });
    }
    skupiny.push({ id, nadpis, riadok: riadokZ(m.index), riadky });
  }
  if (skupiny.length !== 4) throw new Error(`index.html: čakal som 4 skupiny cenníka, je ${skupiny.length}`);

  const adresaM = /<address>([^<]+)<\/address>/.exec(html);
  const adresa = { text: adresaM[1].trim(), riadok: riadokZ(adresaM.index) };
  const navM = /href="(https:\/\/www\.google\.com\/maps\/dir\/[^"]+)"[^>]*>Navigovať<\/a>/.exec(html);
  const mapa = { href: navM[1].replace(/&amp;/g, '&'), riadok: riadokZ(navM.index) };
  const komuM = /<p class="small">(Pánske strihy, brada a holenie[^<]*)<\/p>/.exec(html);
  const komu = { text: komuM[1], riadok: riadokZ(komuM.index) };
  const tim = 'Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek. Svojho človeka si vyberieš v rezervácii.';
  if (!html.replace(/\u00a0/g, ' ').includes(tim)) throw new Error('index.html: chýba veta o tíme');

  const slovnik = { sk: null };
  for (const j of JAZYKY.slice(1)) slovnik[j] = JSON.parse(readFileSync(join(strom, 'assets/i18n', `${j}.json`), 'utf8'));
  const t = (j, k) => {
    if (j === 'sk') return k;
    const v = slovnik[j][k];
    if (typeof v !== 'string') throw new Error(`i18n/${j}.json: chýba kľúč ${JSON.stringify(k)}`);
    return v.replace(/­/g, '');
  };

  // Riadky cenníka: slovenský názov je kľúč, k nemu názvy v 8 jazykoch.
  const riadky = {};
  for (const g of skupiny) {
    g.nadpisy = Object.fromEntries(JAZYKY.map((j) => [j, t(j, g.nadpis)]));
    for (const r of g.riadky) {
      r.skupina = g.id;
      r.nazvy = Object.fromEntries(JAZYKY.map((j) => [j, t(j, r.nazov)]));
      r.casy = Object.fromEntries(JAZYKY.map((j) => [j, t(j, r.cas)]));
      riadky[r.nazov] = r;
    }
  }
  const komuJ = Object.fromEntries(JAZYKY.map((j) => [j, t(j, komu.text)]));
  const detiVeta = 'Klasický strih alebo fade, prípadne kreatívny ornament, umytie a styling – pre chlapcov do 10 rokov.';
  const detiJ = Object.fromEntries(JAZYKY.map((j) => [j, t(j, detiVeta)]));
  const adresaJ = Object.fromEntries(JAZYKY.map((j) => [j, t(j, adresa.text)]));
  const navJ = Object.fromEntries(JAZYKY.map((j) => [j, t(j, 'Navigovať')]));

  // Mená tém recepcie (len `id`, nič iné z dát recepcie).
  let idTem = null;
  try {
    const kb = JSON.parse(readFileSync(join(strom, 'assets/recepcia/sk.json'), 'utf8'));
    idTem = {
      polozky: (kb.polozky || []).map((p) => p.id),
      nevieme: (kb.nevieme || []).map((p) => p.id),
    };
  } catch { /* bez dát recepcie generátor beží ďalej, len neoverí mená tém */ }

  // Celé názvy služieb pre P7 (b): normalizované názvy riadkov vo všetkých 8 jazykoch.
  const celeNazvy = [];
  for (const r of Object.values(riadky)) {
    for (const j of JAZYKY) celeNazvy.push({ row: r.nazov, n: norm(r.nazvy[j]) });
  }

  return { skupiny, riadky, adresa, adresaJ, mapa, navJ, komu, komuJ, detiJ, tim, idTem, celeNazvy, t };
}

// P7 (b): riadok smie byť zvýraznený len vtedy, keď otázka obsahuje celý názov služby (po normalizácii)
// a nič, čo by ho menilo. `meniace` určuje trieda (osoba, dĺžka, iná služba, zápor, téma nevieme).
// Pri viacerých nezávislých celých názvoch v otázke (dve služby) nie je dovolené nič.
export function prisneZvyraznenie(stranka, otazka, meniace) {
  if (meniace) return [];
  const q = ` ${norm(otazka)} `;
  const vyskyty = [];
  for (const { row, n } of stranka.celeNazvy) {
    const ihla = ` ${n} `;
    let od = 0;
    for (let i; (i = q.indexOf(ihla, od)) !== -1; od = i + 1) vyskyty.push({ row, a: i, b: i + ihla.length });
  }
  const max = vyskyty.filter((v) => !vyskyty.some((w) => w !== v && w.a <= v.a && w.b >= v.b && (w.b - w.a) > (v.b - v.a)));
  const rows = [...new Set(max.map((v) => v.row))];
  return rows.length === 1 ? rows : [];
}
