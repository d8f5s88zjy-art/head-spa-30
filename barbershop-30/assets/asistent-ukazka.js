/*
 * BARBERSHOP 30 – ukážka okna Barbera bez servera (asistent.js, spusti('ukazka'), ?asistent=ukazka): na kontrolu
 * vzhľadu a správania pred zapnutím skutočného asistenta. Neodpovedá AI ani server; odpovede sú vopred pripravené
 * po slovensky z overených údajov webu (cenník priamo zo stránky, hodiny, adresa, tím ako v
 * asistent/znalosti/barbershop.md). Voľné termíny ukážka neoveruje a nikdy ich nevymýšľa; čo nevie, posiela na
 * telefón. Okno to výrazne označuje (asistent.js, pas ukážky). Nič sa nikam neposiela.
 */
const TEL = '0951 267 203';
const REZ = 'https://www.barbershop30.sk/rezervacia';
const ZAVOLAJ = `Zavolaj nám, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme: ${TEL}.`;
const OBJEDNAJ = `Objednáš sa online kedykoľvek na ${REZ}, vyberieš službu, barbera aj čas.`;
const TIM = ['Nikolas', 'Kristián', 'Damian', 'Michal', 'Andy', 'Dominika', 'Kevin', 'Lajko', 'Jojo', 'Adrián'];

const bez = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* cenník tak, ako je na stránke (index aj rezervacia.html majú .price-row v .price-group) */
function cennik() {
  return [...document.querySelectorAll('.price-row')].map((r) => {
    const t = (q) => (r.querySelector(q) ? r.querySelector(q).textContent.trim() : '');
    const g = r.closest('.price-group');
    return { nazov: t('.price-name'), cas: t('.price-time'), cena: t('.price-amount'), skup: g ? g.getAttribute('aria-labelledby') : '' };
  }).filter((x) => x.nazov && x.cena);
}
// čas a cena sa nezalomia (pevná medzera pred min a €)
const riadky = (zoz) => zoz.map((x) => `- ${x.nazov}: ${x.cas.replace(/\s+(?=min)/, '\u00a0')}, ${x.cena.replace(/\s+(?=€)/, '\u00a0')}`).join('\n');
const zoSkupiny = (s) => cennik().filter((x) => x.skup === s);

/* odpoveď na otázku: { t: text, tel: či pod ňu patrí Zavolať a Objednať sa } */
export function odpoved(otazka) {
  const q = bez(otazka);
  const ma = (re) => re.test(q);
  if (ma(/\b(ahoj|cau|cauko|dobry den|zdravim|servus)\b/) && q.length < 25) return { t: 'Ahoj! Spýtaj sa ma na ceny, služby, otváracie hodiny alebo objednanie.' };
  if (ma(/dakuj|vdaka|diky/)) return { t: 'Rado sa stalo. Ak ťa ešte niečo zaujíma, pýtaj sa.' };
  if (ma(/\bdet|dieta|decko|chlapc|syn|malych|gentleman|10 rok/)) {
    const d = cennik().find((x) => /gentleman/i.test(bez(x.nazov)));
    return { t: `Áno, strihá sa aj chlapcom do 10 rokov: ${d ? `${d.nazov}, ${d.cas}, ${d.cena}` : 'strih pre malých gentlemanov'}. Klasický strih alebo fade, prípadne ornament, umytie a styling.\n${OBJEDNAJ}` };
  }
  if (ma(/farb(?!.*(brad|obo))|melir|trval|romana/)) return { t: 'Farbenie, melír a trvalú robí Romana. Objednáš sa u nej samostatne na https://booqme.app/sk/rezervacia/barbershop30, tam sú aj ceny.' };
  if (ma(/termin|voln|zajtra|dnes|objedn|rezerv|zapis|miesto|cas na/)) {
    const volno = ma(/termin|voln|zajtra|dnes|miesto|cas na/) && !ma(/ako sa|kde sa/);
    return { tel: true, t: (volno ? 'V tejto ukážke voľné termíny neoverujem. Naostro ich Barber pozrie v rezervačnom kalendári, vždy ako predbežné.\n' : '') + `${OBJEDNAJ}\nAlebo zavolaj na recepciu ${TEL}, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.` };
  }
  if (ma(/otvor|otvaraci|hodin|zatvor|sobot|nedel|vikend|kedy mate|kedy ste/)) return { t: 'Otvorené máme:\n- pondelok až piatok 9:00 až 19:00\n- sobota 9:00 až 14:00\n- nedeľa zatvorené\n' + `Recepcia telefonuje v pracovné dni od 9:00 do 19:00 na ${TEL}.` };
  if (ma(/park/)) return { tel: true, t: `O parkovaní web nič neuvádza. ${ZAVOLAJ}` };
  if (ma(/kde|adres|cest|navig|mostn|najdem|trafim/)) return { t: 'Nájdeš nás na Mostnej 30, 949 01 Nitra.\nNavigácia: https://www.google.com/maps/dir/?api=1&destination=Mostn%C3%A1+30%2C+949+01+Nitra' };
  if (ma(/plat|kart|hotovost|poukaz|zlav|akci/)) return { tel: true, t: `Na toto ti z údajov webu presne neodpoviem. ${ZAVOLAJ}` };
  if (ma(/kav|caka|piti|mineral|whisk/) && !ma(/cen|kolko|stoji/)) return { t: 'Vzadu je čakáreň s kreslami, káva aj minerálka sú zdarma. Pohárik whisky je súčasťou balíčka Ultra inclusive.' };
  const meno = TIM.find((m) => q.includes(bez(m)));
  if (meno || (ma(/\btim\b|v time|barber(?!shop)|kto .*strih|strihaci/) && !ma(/cen|kolko|stoji/))) {
    const mena = [...document.querySelectorAll('.team-card .team-name')].map((n) => n.textContent.trim());
    return { t: (meno ? `${meno} je v našom tíme. ` : '') + `V tíme sú ${(mena.length ? mena : TIM).join(', ')}. Svojho človeka si vyberieš pri objednaní na ${REZ}.` };
  }
  const cen = ma(/cen|kolko|stoji|cennik|eur|€|plati sa/);
  if (ma(/brad|holen|hot towel|britv/)) return { t: `Brada a holenie:\n${riadky([...zoSkupiny('g-brada'), ...zoSkupiny('g-strih').filter((x) => /holen/.test(bez(x.nazov)))])}\nCeny sú konečné. ${OBJEDNAJ}` };
  if (ma(/balic|ultra|inclusive|vsetko/)) return { t: `Balíčky:\n${riadky(zoSkupiny('g-balicky'))}\nCeny sú konečné. ${OBJEDNAJ}` };
  if (ma(/obo|depil|\busi\b|\bnos|plet|mask|ornament|doplnk/)) return { t: `Doplnky:\n${riadky(zoSkupiny('g-doplnky'))}\nCeny sú konečné. ${OBJEDNAJ}` };
  if (cen || ma(/strih|fade|vlas|sluzb|ponuk/)) return { t: `Strih:\n${riadky(zoSkupiny('g-strih'))}\nCeny sú konečné. Bradu, balíčky a doplnky nájdeš v cenníku na stránke. ${OBJEDNAJ}` };
  return { tel: true, t: `Na toto ti z údajov webu neodpoviem. ${ZAVOLAJ}` };
}

/* odpoveď po kúskoch ako pri skutočnom asistentovi; pri obmedzenom pohybe naraz */
export async function opytaj(otazka, onText, onTel) {
  const o = odpoved(otazka);
  const pokoj = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pauza = (ms) => new Promise((r) => setTimeout(r, ms));
  await pauza(pokoj ? 150 : 450);
  if (pokoj) onText(o.t);
  else for (const kus of o.t.match(/\S+\s*/g) || []) { onText(kus); await pauza(28); }
  if (o.tel) onTel();
}
