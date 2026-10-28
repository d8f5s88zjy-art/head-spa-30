/*
 * BARBERSHOP 30 – ukážka okna Barbera bez servera (asistent.js, spusti('ukazka'), ?asistent=ukazka): na kontrolu
 * vzhľadu a správania pred zapnutím skutočného asistenta. Neodpovedá AI ani server; odpoveď je vopred pripravená
 * overená odpoveď na najpodobnejšiu častú otázku (asistent-otazky.js, časté otázky z údajov webu). Keď žiadna
 * dosť nesedí, ukážka to povie a dá telefón; voľné termíny nikdy nevymýšľa. Okno to výrazne označuje (pás ukážky,
 * popis pri každej odpovedi). Nič sa nikam neposiela.
 */
import { nacitajHladanie, hladaj } from './asistent-otazky.js';

const PRAH = 0.6;   // pod touto zhodou je odpoveď neistá, radšej telefón a návrhy podobných otázok
const NEVIEM = 'Na toto v pripravených odpovediach nič nemám. Zavolaj nám na 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.';

/* odpoveď na otázku: { t: text, tel: Zavolať a Objednať sa pod ňou, id: ktorá častá otázka } */
export async function odpoved(otazka) {
  let db = null;
  try { db = await nacitajHladanie(); } catch (e) { /* bez súboru ostane telefón */ }
  const h = db && hladaj(db, otazka, 1)[0];
  if (h && h.skore >= PRAH) return { t: h.o.a, tel: !!h.o.tel, id: h.o.id };
  return { t: NEVIEM, tel: true, id: null };
}

/* odpoveď po kúskoch ako pri skutočnom asistentovi; pri obmedzenom pohybe naraz */
export async function opytaj(otazka, onText, onTel) {
  const o = await odpoved(otazka);
  const pokoj = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pauza = (ms) => new Promise((r) => setTimeout(r, ms));
  await pauza(pokoj ? 150 : 400);
  if (pokoj) onText(o.t);
  else for (const kus of o.t.match(/\S+\s*/g) || []) { onText(kus); await pauza(22); }
  if (o.tel) onTel();
  return o;
}
