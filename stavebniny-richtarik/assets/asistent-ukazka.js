/*
 * STAVEBNINY RICHTÁRIK – ukážka okna asistenta bez servera (asistent.js, spusti('ukazka')): na kontrolu vzhľadu
 * a správania v náhľade, kým na hostingu nie je server s kľúčom. Neodpovedá model ani server; odpoveď je vopred
 * pripravená overená odpoveď na najpodobnejšiu častú otázku (asistent-otazky.js). Keď žiadna dosť nesedí, ukážka to
 * povie a dá telefón; ceny ani nič iné nevymýšľa. Okno to výrazne označuje (pás ukážky, popis pri každej odpovedi).
 * Nič sa nikam neposiela.
 */
import { nacitaj, hladaj } from './asistent-otazky.js';

const PRAH = 0.6;   // pod touto zhodou je odpoveď neistá, radšej telefón a návrhy podobných otázok
const NEVIEM = 'Na toto v pripravených odpovediach nič nemám. Zavolajte nám na 0905 622 223 (pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00) alebo napíšte na info@stavebninyrichtarik.sk.';

/* odpoveď na otázku: { t: text, tel: pod ňou Zavolať, id: ktorá častá otázka (null = nevie) } */
export async function odpoved(otazka) {
  let db = null;
  try { db = await nacitaj(); } catch (e) { /* bez súboru ostane telefón */ }
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
