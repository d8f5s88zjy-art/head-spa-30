/* Zostavenie verejných súborov webu pre vlastnú doménu (www.barbershop30.sk) – čisté funkcie bez Node aj bez DOM.
 * Ten istý kód beží pri stavbe balíka (source/tools/balik-domena.sh) aj v prehliadači pri uložení zo správy na hostingu
 * (ulozisko-hosting.js), takže verejné súbory balíka = zostav(pôvodné súbory) a anglická stránka je vždy podľa slovenskej.
 * Kroky sú tie isté ako pri nasadení na GitHub Pages (pages.yml): doména → lastmod → en/ (en-stranka) → zmenšenie.
 * Prepínače funkcií (data-asistent, data-objednavka, data-zapnute) tu nie sú: dopĺňa ich vždy server podľa nastavenia
 * (barbershop-sprava/jadro/Prepinace.php).
 *
 *   zostav(zdroj, ciel, { lastmod }) → { verejná cesta: text }
 *   zdroj: { 'barbershop-30/index.html': text, 'barbershop-30/assets/i18n/en.json': text, 'barbershop-30/404.html', 'robots.txt',
 *            'sitemap.xml', 'karta/index.html' } – stačí časť, zostaví sa len to, na čo sú podklady
 *   ciel:  source/domena/ciel.json (zaklad, povodna, vernost) */
import { enStranka } from './lib/en-stranka-jadro.js';
import { bezKomentarovHtml, bezKomentarovCss } from './lib/zmensi-jadro.js';

const P = 'barbershop-30/';

/* základná adresa GitHub Pages → adresa domény (canonical, og:url, og:image, JSON-LD, 404, robots, sitemap) */
export const naDomenu = (text, ciel) => text.split(ciel.povodna).join(ciel.zaklad);

/* prihláška ku kartičke hovorí so serverom kartičiek na tej istej doméne (adresa od koreňa webu platí aj v en/) */
export function vernostApi(html, ciel) {
  const re = /<script src="assets\/vernost\.js" data-prevadzka="barbershop"(?! data-api)/g;
  if ((html.match(re) || []).length !== 1) throw new Error('zostav: v index.html chýba značka skriptu assets/vernost.js (alebo je tam viackrát)');
  return html.replace(re, (m) => `${m} data-api="${ciel.vernost}"`);
}

/* stránka kartičky (karta/index.html): API na tej istej doméne, žiadne spojenie inam */
export function kartaStranka(html, ciel) {
  const a = /(<html [^>]*data-api=")[^"]*(")/, c = /connect-src 'self' https:\/\/www\.headspa30\.sk;/;
  if (!a.test(html) || !c.test(html)) throw new Error('zostav: karta/index.html nemá očakávané data-api alebo connect-src');
  return html.replace(a, `$1${ciel.vernost}$2`).replace(c, "connect-src 'self';");
}

export const lastmod = (xml, datum) => (datum ? xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${datum}</lastmod>`) : xml);

export { bezKomentarovHtml, bezKomentarovCss };

export function zostav(zdroj, ciel, opts = {}) {
  const von = {};
  const ix = zdroj[P + 'index.html'], en = zdroj[P + 'assets/i18n/en.json'];
  if (ix != null) {
    const sk = vernostApi(naDomenu(ix, ciel), ciel);
    if (en != null) von['en/index.html'] = bezKomentarovHtml(enStranka(sk, JSON.parse(en)).html);
    von['index.html'] = bezKomentarovHtml(sk);
  }
  if (zdroj[P + '404.html'] != null) von['404.html'] = bezKomentarovHtml(naDomenu(zdroj[P + '404.html'], ciel));
  if (zdroj[P + 'robots.txt'] != null) von['robots.txt'] = naDomenu(zdroj[P + 'robots.txt'], ciel);
  if (zdroj[P + 'sitemap.xml'] != null) von['sitemap.xml'] = lastmod(naDomenu(zdroj[P + 'sitemap.xml'], ciel), opts.lastmod);
  if (zdroj[P + 'karta/index.html'] != null) von['karta/index.html'] = kartaStranka(zdroj[P + 'karta/index.html'], ciel);
  return von;
}
