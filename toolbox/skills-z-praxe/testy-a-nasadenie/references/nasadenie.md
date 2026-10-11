# Nasadenie: GitHub Pages, samostatný repozitár, FTP

## GitHub Pages cez GitHub Actions (`.github/workflows/pages.yml`)

Spúšťa sa pri pushi do `main` (a ručne `workflow_dispatch`), `concurrency: pages` s `cancel-in-progress: true`
(novší push zruší rozbehnuté nasadenie). Kroky: `actions/checkout@v4`, `actions/configure-pages@v5`
(`enablement: true`), príprava `_site`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.

```yaml
      - name: Pripraviť súbory webu
        run: mkdir -p _site && cp -r index.html 404.html pravne.html robots.txt sitemap.xml assets admin stavebniny-richtarik _site/
      - name: Pripraviť web BARBERSHOP 30 (podpriečinok /barbershop-30/)
        run: |
          mkdir -p _site/barbershop-30
          cp -r barbershop-30/index.html barbershop-30/robots.txt barbershop-30/sitemap.xml barbershop-30/assets _site/barbershop-30/
          sed -i 's#https://d8f5s88zjy-art.github.io/barbershop30/#https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/#g' _site/barbershop-30/index.html _site/barbershop-30/robots.txt _site/barbershop-30/sitemap.xml
      - name: Balík na FTP na stiahnutie (headspa30-ftp.zip)
        run: sh tools/ftp-balik.sh headspa30.sk "$PWD/_site/headspa30-ftp.zip"
      - name: Ten istý web v menších ZIPoch (do 19 MB)
        run: python3 tools/ftp-rozdel.py _site 18
```

Čo z toho plynie:
- **Nasadí sa len to, čo je vymenované.** Nová stránka alebo priečinok v koreni sa na web nedostane, kým ho
  nepridáš do `cp`. Pracovné veci (`docs/`, `tools/`, `toolbox/`, `barbershop-30/source/`) na web nejdú.
- BARBERSHOP 30 má v súboroch základnú adresu samostatného webu (`.../barbershop30/`); pri nasadení do
  podpriečinka ju krok `sed` prepíše. Pri vlastnej doméne nahraď základnú adresu v `index.html`, `robots.txt`
  a `sitemap.xml` jedným `sed` (miesta označuje komentár `DEPLOY STEP`, `barbershop-30/README.md`).
- HEAD SPA 30 pri vlastnej doméne: README (Nasadenie) spomína `canonical`, `og:url` a `og:image` a komentár
  `DEPLOY STEP`, ten však v koreňovom `index.html` nie je (overené 2026-10-11) a základná adresa je tam
  13-krát (aj `hreflang`, `twitter:image` a údaje pre Google v JSON-LD), ďalej v `pravne.html`, `robots.txt`
  a `sitemap.xml`. Prepíš všetky výskyty jedným `sed` ako `tools/ftp-balik.sh` a doménu zadaj v nastaveniach
  Pages. Repozitár musí byť verejný alebo účet s GitHub Pro (README, Nasadenie).
- Ten istý beh zverejní aj FTP balík `headspa30-ftp.zip` a jeho časti do 19 MB.

## Postup nasadenia z pracovnej vetvy (CLAUDE.md)

```bash
git fetch origin main && git merge origin/main            # 0. admin (admin/) ukladá priamo do main
node tools/build.mjs                                      # HEAD SPA 30: po zmene CSS/JS (*.min.* sú len výstup)
git add <súbory> && git commit -m "HEAD SPA 30: ..."      # commit na pracovnej vetve
git push -u origin <vetva>                                # 1.
git checkout main && git merge --ff-only <vetva> && git push origin main   # 2.
# 3. overiť naživo (Pages beží zhruba minútu)
```

- Admin ukladá jedným commitom priamo do `main` (bloby, strom, commit, posun vetvy; README, Admin). Bez kroku 0
  vetva nemá commity z adminu a zlúčenie do `main` nie je posun dopredu: `--ff-only` alebo `push` ho odmietne.
  To je zámer: na `main` nevznikne zlučovací commit ani sa neprepíše zmena z adminu. Keď odmietne, zopakuj
  krok 0 na vetve a pokračuj od kroku 1.
- Admin pri súbehu sám načíta novú verziu `main`, prenesie zmeny a uloží znova (README, Admin).
- Vetva: tú, ktorú určuje `CLAUDE.md` alebo zadanie práce. Názov vetvy ani commit nesmie spomínať AI.
- `node tools/build.mjs` volá `esbuild` z `PATH` (alebo z premennej `ESBUILD`) a pre každý zdroj vypíše
  veľkosť pred a po. Minifikuje `style.css`, `app.js`, `i18n.js`, `world.js` aj nenačítavané `premium-v9.*`.

## Overenie naživo

1. **Počkaj na nasadenie.** Zapísané časy: nová verzia na Pages po 61 s a po 41 s (CHECKS 6 a 8).
2. **Súbory odpovedajú 200 a sú nové.** CHECKS zapisuje `curl` hlavných súborov (index, štýl, skripty, prvé
   zábery). Zhodu s lokálnou verziou overíš odtlačkom:

```bash
curl -s https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/assets/app.js | md5sum
md5sum barbershop-30/assets/app.js
curl -sSI https://d8f5s88zjy-art.github.io/head-spa-30/assets/style.min.css | grep -i 'last-modified\|cache-control'
```

   Odtlačok sa nezhoduje pri `barbershop-30/index.html`, `robots.txt` a `sitemap.xml`: tie pri nasadení
   prepisuje `sed` v `pages.yml` (základná adresa). Porovnávaj skripty, štýly a obrázky.

   GitHub Pages posielal (2026-10-11) `cache-control: max-age=600` a `last-modified` z času nasadenia. Prehliadač
   a CDN teda môžu ešte 10 minút držať starú verziu: pri snímkach z verejnej adresy pridaj `?v=<niečo>`
   (CHECKS 5; `ostrost.mjs` pridáva `&v=` sám).
3. **Testy proti verejnej adrese.** Nástroje s `--url=` (`uvod-shot.mjs`, `uvod-meranie.mjs`, `karty-shot.mjs
   --wait=5000`, `prechod-shot.mjs`, `vaha.mjs`), `ostrost.mjs --a=<naživo>` a všeobecný
   `scripts/dymovy-test.mjs --url=<adresa>`. Lighthouse naživo (skill `rychly-web`).
4. **Zapíš výsledok** do kontrol s hashom commitu a dátumom, napr. „Naživo (5f45af8, 2026-10-11)“ v
   `barbershop-30/docs/CHECKS.md`, vrátane toho, čo sa nepodarilo a prečo.

## Samostatný repozitár (`barbershop-30/source/tools/nasad-barbershop30.sh`)

```bash
# z koreňa barbershop-30, po nasadení do main v head-spa-30
bash source/tools/nasad-barbershop30.sh "BARBERSHOP 30: čo sa zmenilo"
```

- Cieľ `REMOTE` (predvolene `https://github.com/d8f5s88zjy-art/barbershop30`), GitHub Pages z `main`, koreň,
  adresa `https://d8f5s88zjy-art.github.io/barbershop30/`. Podľa podkladu repozitár zatiaľ nevznikol.
- Ak vetva `main` v cieli existuje (`git ls-remote --exit-code`), naklonuje ju s `--depth 1`, inak založí nový
  repozitár s `origin`. Obsah cieľa zmaže okrem `.git` a skopíruje len web (`index.html`, `robots.txt`,
  `sitemap.xml`, `assets/`), takže zmazané súbory zmiznú aj v cieli. Pridá `.nojekyll` (bez Jekyllu).
- Bez zmien vypíše „bez zmien“ a nič necommituje; inak commit, `push -u origin main` a posledný commit.
- Dočasný priečinok `mktemp -d` sa zmaže pri skončení (`trap ... EXIT`), `set -euo pipefail`.

Všeobecná verzia: `../scripts/nasad-do-repozitara.sh` (priečinok webu, správa, zoznam súborov; `REMOTE` povinný).
Odskúšaná proti lokálnemu holému repozitáru (`git init --bare`): prvé nasadenie založí `main`, druhý beh bez
zmien nič necommituje, zmazaný súbor z cieľa zmizne, `source/` sa neprenesie. V lokálnom teste git vypisuje
varovanie `--depth is ignored in local clones`, beh to neovplyvní. Zoznam súborov sú položky v koreni webu
(kopírujú sa do koreňa cieľa).

## FTP hosting (HEAD SPA 30, napr. Forpsi)

```bash
sh tools/ftp-balik.sh headspa30.sk                          # priečinok _ftp (v .gitignore)
sh tools/ftp-balik.sh headspa30.sk /tmp/headspa30-ftp.zip    # aj ZIP
python3 tools/ftp-rozdel.py <cieľový-priečinok> 18           # časti ZIPu do 18 MB, z koreňa repozitára
```

`ftp-balik.sh`:
- prejde do koreňa repozitára (`cd "$(dirname "$0")/.."`) a ZIP balí príkazom `(cd _ftp && zip ... "$ZIP")`,
  preto cestu k ZIPu zadávaj absolútne (README `/tmp/...`, `pages.yml` `"$PWD/_site/..."`); relatívna by
  skončila vnútri `_ftp`;
- skopíruje `index.html 404.html pravne.html robots.txt sitemap.xml assets admin`, pridá `tools/ftp.htaccess`
  ako `.htaccess`, zmaže `assets/premium-v9.*` a `assets/i18n/README.txt`;
- prepíše `https://d8f5s88zjy-art.github.io/head-spa-30/` na `https://<doména>/` v HTML, `robots.txt` a `sitemap.xml`;
- v `404.html` zmení cesty `/head-spa-30/` na `/` (stránka 404 sa zobrazuje na ľubovoľnej adrese, preto má cesty
  od koreňa, nie relatívne);
- z `robots.txt` vyhodí riadky s `barbershop` (na doméne HEAD SPA ten priečinok nie je).

`ftp-rozdel.py`: každý ZIP má cesty od koreňa webu, rozbalenie všetkých do toho istého priečinka (`/www/`)
poskladá celý web. Prvý ZIP dostane stránky a malé súbory (stačí na spustenie webu), potom obrázky od
najväčších. Limit 18 MB je rezerva pod 19 MB. Názvy `headspa30-ftp-<i>-z-<n>.zip`. Číta priečinok `_ftp`
relatívne, preto sa spúšťa z koreňa repozitára.

Automaticky: `.github/workflows/ftp.yml` po každom pushi do `main` (aj z adminu), len keď je nastavené tajomstvo
`FTP_SERVER` (ďalej `FTP_USER`, `FTP_PASSWORD`, voliteľne `FTP_DIR` predvolene `/www/` a `FTP_DOMENA`
predvolene `headspa30.sk`). Nahráva `SamKirkland/FTP-Deploy-Action@v4.3.5` len zmenené súbory,
`concurrency: ftp` bez rušenia rozbehnutého behu. Heslá len v GitHub Secrets, nikdy v repozitári.

`.htaccess` (`tools/ftp.htaccess`), lekcie:
- `ErrorDocument 404 /404.html`; `AddType` pre `.avif`, `.webp`, `.woff2`, `.webmanifest` (staršie servery ich nepoznajú);
- presmerovanie na https je zakomentované, zapni ho **až keď má doména SSL certifikát**;
- **žiadne pravidlo www → bez www**: Forpsi sám presmerúva `headspa30.sk` na `www.headspa30.sk`, spolu by sa
  naháňali dokola (Safari: príliš veľa presmerovaní);
- `X-Robots-Tag: noindex, nofollow` pre `/admin/`, `mod_deflate` pre text, `mod_expires` (HTML 10 minút,
  CSS a JS 1 deň, obrázky 30 dní, písma 1 rok);
- po zmene `.htaccess` treba súbor na FTP nahrať znova.

## Commity

- Po slovensky, predmet s názvom projektu a dvojbodkou: „BARBERSHOP 30: …“, „HEAD SPA 30: …“, „Toolbox: …“.
- Telo vysvetľuje prečo, napr. `423fc24`: „Kontext WebGL v hlavičke oneskoroval prvý obraz telefónu asi o sekundu.
  … Dymový test kontroluje aj vetvu bez ?film=on, test kolieska čaká na vrchu 500 ms.“
- Bez podpisov a bez odkazov na nástroje (CLAUDE.md), žiadna zmienka o AI v správe ani v názve vetvy.
- Prihlasovacie údaje nikdy necommituj; skripty ich berú z premenných prostredia (CLAUDE.md, Booqme).
