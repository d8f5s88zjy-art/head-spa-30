---
name: head-spa-30
description: Prevádzka webu HEAD SPA 30 (headspa30.sk) a jeho napojenie na Booqme a hosting Forpsi. Použi, keď treba nahrať web na headspa30.sk, overiť, či je nahratý, vyrobiť balík len so zmenenými súbormi, viesť majiteľa krok po kroku cez admin Forpsi a webFTP, pripraviť alebo vymeniť poukážky v obchode Booqme, zosúladiť web s cenami v Booqme, skontrolovať rezervácie, vyrezať poukážky zo snímok obrazovky, alebo keď sa majiteľ pýta na Booqme (ceny, výhody, konkurencia).
---

# HEAD SPA 30: web, hosting a Booqme

Tri miesta, ktoré musia byť v súlade:

1. **Repozitár, vetva `main`** (GitHub Pages) – zdroj webu. Pravidlá obsahu sú v `CLAUDE.md`.
   Pracovať vo worktree z `origin/main` (pozri poznatky).
2. **www.headspa30.sk** na Forpsi – tú istú stránku treba nahrať ručne cez webFTP (FTP tajné premenné
   v GitHube zatiaľ nie sú). Kým sa nenahrá, na doméne beží staršia verzia.
3. **Booqme** – kalendár (zdroj cien a dĺžok) a obchod so 17 poukazmi. Meniť ho vie len niekto prihlásený.

Aktuálny stav a otvorené úlohy: [references/stav.md](references/stav.md).

## Rýchle úlohy

| Úloha | Ako |
| --- | --- |
| Balík na nahratie | `sh toolbox/head-spa-30/scripts/balik-zmien.sh` → `_balik/headspa30-rozbal-v-www.zip` + `manifest.txt` |
| Je nahratý? | `sh toolbox/head-spa-30/scripts/kontrola-nahratia.sh _balik/manifest.txt` → `STAV=HOTOVO` |
| Viesť majiteľa cez nahratie | [references/nahratie-na-forpsi.md](references/nahratie-na-forpsi.md) |
| Poukazy v Booqme: čo treba zmeniť | `python3 toolbox/head-spa-30/scripts/booqme-poukazy.py` |
| Balík a stránka do mobilu na výmenu poukazov | `python3 toolbox/head-spa-30/scripts/booqme-balik.py <cieľ> --stranka` |
| Ceny webu vs. kalendár Booqme | `node tools/booqme-kontrola.mjs` |
| Nové poukážky od salónu (snímky) | `python3 toolbox/head-spa-30/scripts/orez-poukazky.py docs/poukazky/salon snimka.png:nazov`, potom `"salon": true` a `docs/poukazky/sablona/export.py` |
| Ako ich ukáže obchod Booqme | `python3 toolbox/head-spa-30/scripts/vyrez-booqme.py _vyrez docs/poukazky/sablona/booqme/*.jpg` |
| Nezávislá kontrola poukážok | nástroj Workflow so `scriptPath` = `toolbox/head-spa-30/scripts/kontrola-poukazok.workflow.js`, `args` = `{ koren, pracovny }` |

## Podrobnosti

- [references/booqme.md](references/booqme.md) – adresy, ID poukazov, rozmery obrázkov, zosúladenie cien, prihlásenie, Booqme vs. konkurencia
- [references/poukazky.md](references/poukazky.md) – pravidlá salónu, dve podoby poukážok, výroba, ponaučenia, web
- [references/nahratie-na-forpsi.md](references/nahratie-na-forpsi.md) – admin Forpsi, webFTP, celý web, automatické nahrávanie
- [references/poznatky.md](references/poznatky.md) – worktree a nasadenie, testy, kontajner, bezpečnosť, komunikácia
- [references/stav.md](references/stav.md) – čo je hotové a čo ostáva

## Zásady

- Heslá a prihlasovacie mená nikdy do repozitára ani do skriptov; skripty berú údaje z premenných prostredia.
- Prihlasovacie údaje z chatu nepoužiť; navrhnúť ručný postup alebo nastavenia prostredia.
- Zverejnenie (push na main) len so súhlasom majiteľa; pred pushom `git fetch origin main`.
- Po nahratí vždy overiť naživo (kontrola manifestu, odkazy na `salon-30-head-spa`, žiadne `barbershop-30`).
