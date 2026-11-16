/* Admin Barbershop 30 – vrstva ukladania: GitHub (web na GitHub Pages).
 * Číta súbory repozitára cez GitHub API a uloženie je jeden commit priamo do main (bloby, strom, commit, posun vetvy
 * bez prepísania). Kľúč (fine-grained, Contents: Read and write) ostáva v prehliadači. Rovnaké rozhranie má
 * ulozisko-hosting.js (správa na vlastnej doméne); admin.js si vyberie podľa <html data-ulozisko>. */
const OWNER = 'd8f5s88zjy-art', REPO = 'head-spa-30', BRANCH = 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const P = 'barbershop-30/';
const K_KLUC = 'b30.admin';

let token = '';
try { token = localStorage.getItem(K_KLUC) || sessionStorage.getItem(K_KLUC) || ''; } catch (e) { /* súkromné okno */ }
const zabudni = () => { token = ''; try { localStorage.removeItem(K_KLUC); sessionStorage.removeItem(K_KLUC); } catch (x) { /* nič */ } };

async function gh(path, opts = {}) {
  let r;
  try {
    r = await fetch(path.startsWith('http') ? path : API + path, { ...opts, cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) } });
  } catch (e) { throw Object.assign(new Error('sieť'), { net: true }); }
  if (!r.ok) { let t = ''; try { t = await r.text(); } catch (e) { /* nič */ } throw Object.assign(new Error(`${r.status} ${t.slice(0, 160)}`), { status: r.status }); }
  return r.status === 204 ? null : r.json();
}
const b64dec = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
function b64enc(str) { const bytes = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }

export default {
  meno: 'github',
  zive: `https://${OWNER}.github.io/${REPO}/${P}`,
  nedostupne: [],          // cesty zoznamu KONTAKT, ktoré tento cieľ nemá
  kontaktNavyse: [],       // cesty, ktoré tento cieľ pridáva do zoznamu KONTAKT
  automaticky: () => token !== '',

  /* overí kľúč (prístup a právo zapisovať) a zapamätá ho v prehliadači */
  async prihlas(zadany, zapamatat) {
    const t = zadany || token;
    if (!t) throw Object.assign(new Error('Vlož kľúč.'), { user: true });
    token = t;
    const repo = await gh('');
    if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error('Kľúč má len právo čítať. Pri kľúči nastav Contents: Read and write.'), { user: true });
    try { (zapamatat ? localStorage : sessionStorage).setItem(K_KLUC, token); } catch (e) { /* súkromné okno */ }
  },
  /* po zlyhanom prihlásení: neplatný kľúč sa v prehliadači nedrží */
  zlyhalo(e) { if (e.status === 401 || e.status === 404 || (e.user && !e.chyba)) zabudni(); },
  async odhlas() { zabudni(); location.reload(); },

  async hlava() { const ref = await gh(`/git/ref/heads/${BRANCH}`); return ref.object.sha; },
  async citaj(path, ref) {
    // kľúč prístup má (overené pri prihlásení), takže 404 znamená, že súbor v main ešte nie je (web nezverejnený)
    const j = await gh(`/contents/${path}?ref=${ref}`).catch((e) => { throw e.status === 404 ? Object.assign(new Error(`Na webe chýba súbor ${path}. Web Barbershopu ešte asi nie je zverejnený, admin sa dá použiť až potom.`), { user: true, chyba: true }) : e; });
    if (j.content) return b64dec(j.content);
    const blob = await gh(`/git/blobs/${j.sha}`); return b64dec(blob.content);
  },
  /* jeden commit do main; sha = verzia, z ktorej admin vychádzal (keď sa web medzitým zmenil, chyba { stale }) */
  async zapis(files, message, progress, sha) {
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    if (ref.object.sha !== sha) throw Object.assign(new Error('stale'), { stale: true });
    const head = await gh(`/git/commits/${sha}`);
    const tree = [], list = Object.entries(files);
    let i = 0;
    for (const [path, f] of list) {
      i++;
      progress(`Ukladám ${i} z ${list.length}…`);
      const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.b64 != null ? f.b64 : b64enc(f.text), encoding: 'base64' }) });
      tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const t = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
    const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: t.sha, parents: [sha] }) });
    try { await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha, force: false }) }); }
    catch (e) { if (e.status === 422 || e.status === 409) throw Object.assign(new Error('stale'), { stale: true }); throw e; }
    return c.sha;
  },
  /* adresa súboru vo verzii sha (náhľad fotky) */
  urlSuboru: (cesta, sha) => `https://raw.githubusercontent.com/${OWNER}/${REPO}/${sha}/${cesta}`,

  human(e) {
    if (e.user) return e.message;
    if (e.net) return 'Nepodarilo sa spojiť s GitHubom. Skontroluj internet a skús to znova.';
    if (e.status === 401) return 'Kľúč nie je platný alebo mu vypršala platnosť. Odhlás sa a prihlás sa novým kľúčom.';
    if (e.status === 403) return 'Kľúč nemá právo zapisovať (Contents: Read and write), alebo GitHub dočasne obmedzil požiadavky. Skús to o chvíľu.';
    if (e.status === 404) return 'Kľúč nemá prístup k súborom webu. Pri kľúči vyber repozitár webu.';
    if (e.status >= 500) return 'GitHub práve neodpovedá. Skús to o pár minút, zmeny tu ostávajú.';
    return `Niečo sa nepodarilo (${e.status || e.message}). Skús to o chvíľu znova.`;
  },
  texty: {
    overujem: 'Overujem kľúč a načítavam web…',
    ulozene: 'Uložené. Na webe to bude o minútu. ',
    kartickaUvod: 'Odmeny, akcie, správy zákazníkom a zápis návštev sú v admine kartičky. Prihlasuje sa heslom Barbershopu (nie týmto kľúčom).',
    kartickaPoznamka: 'Admin kartičky beží na serveri kartičiek (headspa30.sk). Odkazy začnú fungovať, keď bude server kartičiek spustený.',
    vernostAdmin: 'https://www.headspa30.sk/vernost/admin/',
  },
};
