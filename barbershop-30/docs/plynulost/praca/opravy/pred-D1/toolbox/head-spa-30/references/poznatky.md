# Poznatky z práce na HEAD SPA 30 (október 2026)

## Repozitár a nasadenie

- Web HEAD SPA 30 je `main` (GitHub Pages: https://d8f5s88zjy-art.github.io/head-spa-30/). Hlavný checkout
  relácie môže byť na inej vetve (napríklad projekt GYM KLUB), preto HEAD SPA robiť vo worktree:
  `git fetch origin main && git worktree add -B claude/head-spa-30-page-uil3m0 <dočasný-priečinok>/hs origin/main`.
- Na main commitujú aj iné relácie (BARBERSHOP 30) a admin webu. Pred zverejnením
  `git fetch origin main`, overiť `git merge-base --is-ancestor origin/main HEAD` (inak najprv zlúčiť),
  potom podľa CLAUDE.md fast-forward main a push.
- Commity po slovensky, bez podpisov a odkazov na nástroje (CLAUDE.md má prednosť).
- Zverejnenie (push na main) len so súhlasom majiteľa: buď výslovná žiadosť („nahraj“, „zverejni“),
  alebo otázka s možnosťou na potvrdenie pred pushom.
- Pages beží zhruba minútu; workflow „Web na FTP“ je zelený, aj keď FTP nie je nastavené.
- Minifikácia: `node tools/build.mjs` s esbuild 0.23.1 (`npm i esbuild@0.23.1` do dočasného priečinka,
  `ESBUILD=…/node_modules/.bin/esbuild`) dáva bajtovo rovnaké app.min.js a style.min.css.
  `premium-v9.min.css` vyjde inak, ale web ho nenačítava: vrátiť `git checkout assets/premium-v9.min.css`.

## Lokálne testy

- Server: `python3 -m http.server 8765 --bind 127.0.0.1` v koreni worktree; jazyk `?lang=en|cs|de|hu|pl|uk`
  (i18n.js si ho pamätá v localStorage).
- Playwright: `/opt/node22/lib/node_modules/playwright/index.mjs`, Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  (nikdy `playwright install`). Živé stránky cez proxy: `ignoreHTTPSErrors: true`.
- Čo sa overuje: šírky 1366, 1024, 768, 390; `reducedMotion`; chyby stránky a konzoly; odpovede 4xx;
  žiadne vodorovné pretečenie (`scrollWidth`); viditeľnosť šípok pásu poukážok.
- Snímky Playwrightu ukladať s absolútnou cestou mimo repozitára, inak skončia v commite.
- i18n: kľúč = normalizovaný slovenský text (zlúčené medzery, bez NBSP); zápis
  `json.dump(..., ensure_ascii=False, indent=1)` a nový riadok na konci. NBSP podľa admin `fixNb`:
  po jednopísmenových predložkách a spojkách, medzi číslom a jednotkou, v „Head Spa“.

## Kontajner

- `pkill -f` s celým vzorom zabije aj vlastný shell (exit 144); vzor písať s hranatými zátvorkami
  (`pkill -f 'http.server 876[5]'`) alebo zabíjať podľa PID.
- Python a súbory s CRLF: `open(..., newline='')`, inak sa konce riadkov potichu zmenia.
- `curl` na Forpsi občas vráti 000; pomáha `--retry 3 --retry-all-errors` a menej paralelných spojení.
- webftp.forpsi.com je z kontajnera nedostupné, majiteľovi funguje.

## Bezpečnosť

- Heslá ani prihlasovacie mená do repozitára (je verejný), ani do workflow súborov; workflow ich berie
  len z GitHub Secrets.
- Prihlasovacie údaje sa neposielajú do chatu. Prihlásenie do Booqme alebo na FTP robí majiteľ sám podľa
  návodu, alebo uloží údaje do nastavení prostredia či GitHub Secrets.
- Ak sa heslo niekde zdieľalo (chat, správa), odporučiť jeho zmenu.

## Komunikácia s majiteľom

- Po slovensky a stručne; „bookio“ v správach znamená Booqme. Výsledok a odkaz, bez dlhého vysvetľovania.
- Zákazníkom a verejnosti posielať adresu GitHub Pages alebo headspa30.sk, nie odkazy na claude.ai.
- Pri ručných krokoch (Forpsi, webFTP, Booqme) viesť po jednom kroku podľa snímok obrazovky; heslo na snímke zakryť.
- ZIP z chatu sa v iPhone uloží cez Zdieľať, Uložiť do Súborov.
- Na webe HEAD SPA 30 nespomínať „barber“; Salón 30 len ako miesto, nie ako značka.
