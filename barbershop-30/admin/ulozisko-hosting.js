/* Admin Barbershop 30 – vrstva ukladania: hosting (správa na vlastnej doméne www.barbershop30.sk, sprava/upravy/).
 * Rovnaké rozhranie ako ulozisko-github.js. Prihlásenie je na stránke správy (../), tu sa len overí relácia. Číta a ukladá
 * cez sprava/api.php: súbory v tvare repozitára („zdroj“), jedno uloženie = záloha, zápis a denník na serveri; súbeh hlási
 * rovnako ako GitHub ({ stale }). Verejné stránky (slovenská, anglická, sitemap, stránka kartičky) zostaví prehliadač
 * tým istým kódom ako nasadenie (zostav.js) a pošle ich spolu so zdrojom; prepínače funkcií dopĺňa server. */
import { zostav } from './zostav.js';

const API = '../api.php';
const P = 'barbershop-30/';
let csrf = '', ciel = null, vernost = false;
const nacitane = new Map();   // cesta → text vo verzii `verzia` (to, čo admin naposledy načítal)

async function api(a, telo) {
  let r;
  try {
    r = await fetch(`${API}?a=${a}`, { method: telo === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'same-origin',
      headers: { ...(csrf ? { 'X-B30-CSRF': csrf } : {}), ...(telo === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: telo === undefined ? undefined : JSON.stringify(telo) });
  } catch (e) { throw Object.assign(new Error('sieť'), { net: true }); }
  let j = null; try { j = await r.json(); } catch (e) { /* nie je JSON */ }
  if (r.status === 401) { location.href = '../'; throw Object.assign(new Error('Prihlás sa, prosím.'), { user: true }); }
  if (r.status === 409 && j && j.stale) throw Object.assign(new Error('stale'), { stale: true });
  if (!r.ok || !j || !j.ok) throw Object.assign(new Error((j && j.chyba) || `Server odpovedal ${r.status}.`), { status: r.status, user: !!(j && j.chyba) });
  return j;
}
const dnes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default {
  meno: 'hosting',
  zive: '../../',
  nedostupne: ['CLAUDE.md'],                                               // na hostingu nie je; pri prevzatí exportu ho upraví tvorca webu
  kontaktNavyse: [P + 'source/domena/vernost-ochrana-udajov.html'],         // ochrana údajov kartičky pre túto doménu
  automaticky: () => true,

  async prihlas() {
    const s = await api('stav');
    csrf = s.csrf; ciel = s.ciel; vernost = !!s.vernost;
    if (!vernost) this.texty.kartickaPoznamka = 'Vernostná kartička ešte nie je zapnutá. Zapneš ju v správe: Nastavenia → Vernostná kartička (heslo recepcie). Odkazy začnú fungovať potom.';
  },
  zlyhalo() { /* relácia je na serveri, v prehliadači nie je čo zabudnúť */ },
  async odhlas() { try { await api('odhlas', {}); } catch (e) { /* aj tak späť na správu */ } location.href = '../'; },

  async hlava() { const s = await api('stav'); csrf = s.csrf; nacitane.clear(); return s.verzia; },
  /* súbory sa čítajú po dávkach (admin ich pýta naraz), odpoveď jednej dávky poslúži všetkým */
  async citaj(cesta, verzia) {
    if (!this._davka) {
      this._davka = { cesty: new Set(), hotovo: null };
      const d = this._davka;
      d.hotovo = new Promise((ok, zle) => setTimeout(async () => {
        this._davka = null;
        try {
          const r = await api('citaj', { cesty: [...d.cesty] });
          if (r.verzia !== verzia) throw Object.assign(new Error('stale'), { stale: true });
          ok(r.subory);
        } catch (e) { zle(e); }
      }, 0));
    }
    const d = this._davka; d.cesty.add(cesta);
    const subory = await d.hotovo;
    if (subory[cesta] == null) throw Object.assign(new Error(`Na hostingu chýba súbor ${cesta}. Nahraj znova priečinok sprava z balíka.`), { user: true, chyba: true });
    nacitane.set(cesta, subory[cesta]);
    return subory[cesta];
  },
  /* jedno uloženie: nové fotky (server ich prekóduje), zdroj a zostavené verejné stránky */
  async zapis(files, sprava, postup, verzia, zmeny = []) {
    const subory = {}, fotky = {};
    const obrazky = Object.entries(files).filter(([, f]) => f.b64 != null);
    let i = 0;
    for (const [cesta, f] of obrazky) {
      i++; postup(`Nahrávam fotku ${i} z ${obrazky.length}…`);
      fotky[cesta] = (await api('fotka', { cesta, b64: f.b64 })).znacka;
    }
    for (const [cesta, f] of Object.entries(files)) if (f.b64 == null) subory[cesta] = f.text;
    // verejné súbory: zostavia sa z nového zdroja (zmenené súbory + to, čo admin načítal), len keď sa ich podklady menia
    const text = (c) => (c in subory ? subory[c] : nacitane.get(c));
    const zdroj = {};
    if ((P + 'index.html') in subory || (P + 'assets/i18n/en.json') in subory) {
      zdroj[P + 'index.html'] = text(P + 'index.html'); zdroj[P + 'assets/i18n/en.json'] = text(P + 'assets/i18n/en.json');
      const sm = await api('citaj', { cesty: [P + 'sitemap.xml'] });
      if (sm.subory[P + 'sitemap.xml'] != null) zdroj[P + 'sitemap.xml'] = sm.subory[P + 'sitemap.xml'];
    }
    if ((P + 'karta/index.html') in subory) zdroj[P + 'karta/index.html'] = subory[P + 'karta/index.html'];
    const verejne = zostav(zdroj, ciel, { lastmod: dnes() });
    postup('Ukladám na web…');
    const r = await api('uloz', { verzia, sprava, zmeny, subory, fotky, verejne });
    return r.verzia;
  },
  /* náhľad fotky: verejný súbor webu na tej istej doméne */
  urlSuboru: (cesta) => '../../' + cesta.replace(P, ''),

  human(e) {
    if (e.user) return e.message;
    if (e.net) return 'Nepodarilo sa spojiť so serverom. Skontroluj internet a skús to znova, zmeny tu ostávajú.';
    if (e.status === 403) return 'Server požiadavku odmietol. Obnov stránku a skús to znova.';
    if (e.status >= 500) return 'Server práve neodpovedá. Skús to o pár minút, zmeny tu ostávajú.';
    return `Niečo sa nepodarilo (${e.status || e.message}). Skús to o chvíľu znova.`;
  },
  texty: {
    overujem: 'Načítavam web…',
    ulozene: 'Uložené. Na webe je to hneď. ',
    kartickaUvod: 'Odmeny, akcie, správy zákazníkom a zápis návštev sú v admine kartičky. Prihlasuje sa heslom recepcie (nie heslom správy).',
    kartickaPoznamka: 'Admin kartičky beží na tejto doméne. Heslo recepcie nastavíš a zmeníš v správe: Nastavenia → Vernostná kartička.',
    vernostAdmin: '../../vernost/admin/',
  },
};
