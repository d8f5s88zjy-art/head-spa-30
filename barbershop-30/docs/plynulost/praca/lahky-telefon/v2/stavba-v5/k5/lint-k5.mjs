// Vlastný lint dát (P5): slová iného významu × silné kmene služieb s cenou; krátke výplňové predpony × slovník stránky
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(process.argv[2]);
const { zhoda } = await import(path.join(ROOT, 'assets/recepcia.js'));
const N = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const J = ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const INY = { // moje slová iného významu: časová príslovka, príplatok, šediny, odfarbenie, dni, osoba-žena, dĺžka „do/pod“
  sk: 'dlho dlhodobo príplatok doplatok šediny šedín odfarbenie zosvetlenie pondelok stredu sobotu nedeľu víkend večer ráno ňu jej dcéra manželka pod do menej kratšie oboch',
  cs: 'dlouho příplatek šediny šedin odbarvení pondělí středu sobotu neděli víkend večer ráno ni její dcera manželka pod do méně kratší oba',
  en: 'long longer surcharge extra grey gray bleaching monday saturday sunday weekend evening morning her she daughter wife under up less shorter both',
  de: 'lange länger Aufpreis Zuschlag grau graue Blondierung Montag Samstag Sonntag Wochenende abends morgens sie ihr Tochter Frau bis unter weniger kürzer beide',
  pl: 'długo dłużej dopłata siwe siwych rozjaśnianie poniedziałek sobotę niedzielę weekend wieczorem rano jej niej córka żona pod do poniżej mniej krótsze oboje',
  hu: 'sokáig meddig felár pótdíj ősz szőkítés hétfőn szombaton vasárnap hétvégén este reggel neki lánya felesége alatt rövidebb kevesebb mindkettő',
  sr: 'dugo duže doplata sede sedu izbeljivanje ponedeljak subotu nedelju vikend uveče ujutru nju njoj ćerka žena pod do ispod manje kraće oboje',
  uk: 'довго довше доплата сивина сиве освітлення понеділок суботу неділю вихідні увечері вранці неї її донька дружина під до менше коротше обидва',
};
const out = [];
for (const l of J) {
  const kb = JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8'));
  const cen = kb.polozky.filter((p) => (p.odpoved || []).some((f) => Array.isArray(f) && /€$/.test(f[1])));
  const zach = [];
  for (const w of N(INY[l]).split(' ')) for (const P of cen) for (const t of P.kluc.split(/[\s|]+/).filter(Boolean)) {
    const silny = /^=?[A-ZА-ЯІЇЄҐ]/.test(t) || t.endsWith('!'); const k = t.replace('!', '').toLowerCase();
    if (k[0] === '>') continue;
    const z = zhoda(w, k);
    if (z >= 0.9) zach.push(`${w}→${P.id}:${t}${silny ? '(silný)' : ''}`);
  }
  out.push(`${l} slová iného významu zachytené kmeňom služby s cenou (${zach.length}): ${zach.join(' ')}`);
  // krátke výplňové a zdvorilé predpony (≤ 3 znaky) – ktoré slová stránky pohltia
  const slov = new Set();
  const walk = (o) => { for (const [k, v] of Object.entries(o)) { if (typeof v === 'string') { N(l === 'sk' ? k : v).split(' ').forEach((x) => slov.add(x)); } else if (v && typeof v === 'object') walk(v); } };
  walk(JSON.parse(fs.readFileSync(path.join(ROOT, `assets/i18n/${l === 'sk' ? 'en' : l}.json`), 'utf8')));
  const kr = [];
  for (const [nazov, zoz] of [['vypln', kb.vypln], ['zdvor', kb.zdvor], ['cenove', kb.cenove]]) for (const t of (zoz || '').split(' ').filter((x) => x && x.length <= 3 && x[0] !== '=')) {
    const hit = [...slov].filter((x) => x !== t && x.length > t.length && zhoda(x, t) === 1);
    if (hit.length) kr.push(`${nazov}:${t}→${hit.slice(0, 8).join(',')}`);
  }
  out.push(`${l} krátke výplňové predpony a čo pohltia zo slovníka stránky: ${kr.join(' | ') || '–'}`);
}
console.log(out.join('\n'));
