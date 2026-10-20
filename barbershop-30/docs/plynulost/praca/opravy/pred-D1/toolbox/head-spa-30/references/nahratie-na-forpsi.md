# Nahratie webu na www.headspa30.sk (Forpsi)

Overené 11. 10. 2026 z iPhonu, celé to trvá asi 10 minút. Heslá sa nikam neposielajú ani nezapisujú.

## Čo kde je

| Čo | Kde |
| --- | --- |
| Administrácia Forpsi | https://admin.forpsi.sk (zákaznícka zóna) |
| Webhosting | Správa účtu, Webhosting, do poľa Hľadať napísať `headspa30.sk`, Vyhľadávanie, otvoriť názov webhostingu |
| FTP údaje | v detaile webhostingu záložka **FTP**: login, server `ftpx.forpsi.com`, [zobraziť heslo], [WebFTP] |
| Webové FTP | https://webftp.forpsi.com (net2ftp, česky) |
| Priečinok webu | `/headspa30.sk/www` (index.html, 404.html, pravne.html, admin, assets, .htaccess) |

Login FTP nie je názov domény, ale technický názov webhostingu zo záložky FTP. Do repozitára ho nepíš.
FTP login vidí koreň webhostingu (`/headspa30.sk/...`), nie priamo `www`.

## Postup

1. Vyrob ZIP so zmenenými súbormi: `sh toolbox/head-spa-30/scripts/balik-zmien.sh`.
   V ZIPe sú cesty od koreňa webu (`index.html`, `assets/...`), žiadny obalový priečinok.
   ZIPy zo starších relácií boli len v dočasnom priečinku; vždy ho vyrob znova.
2. Pošli ZIP majiteľovi; v iPhone ho uloží cez Zdieľať, Uložiť do Súborov.
3. admin.forpsi.sk, Webhosting, vyhľadať headspa30.sk, otvoriť webhosting, záložka **FTP**,
   [zobraziť heslo] (skopírovať), [WebFTP].
4. Vo WebFTP prihlásenie loginom zo záložky FTP, heslom a serverom `ftpx.forpsi.com`.
5. Otvoriť `headspa30.sk`, potom `www`.
6. **Nahrát**. Stránka „Nahrát soubory a archivy“ má vľavo Soubory a vpravo **Archivy (zip, tar, tgz, gz)**.
   ZIP patrí do pravej časti: net2ftp ho rozbalí do aktuálneho priečinka a existujúce súbory prepíše
   („Pokud cílový soubor existuje, bude přepsán“). Potvrdiť zelenou fajkou.
7. Výpis „Could not create directory …“ pri admin, assets, assets/img … je v poriadku: priečinok už existuje.
   Dôležité sú riadky „Zkopírován soubor …“.
8. Kontrola: `sh toolbox/head-spa-30/scripts/kontrola-nahratia.sh _balik/manifest.txt` musí vypísať
   `STAV=HOTOVO`. Naživo: odkazy vedú na `booqme.app/sk/rezervacia/salon-30-head-spa`, žiadne `barbershop-30`.

Pri vedení majiteľa ísť po jednom kroku a pýtať si snímku obrazovky po každom (heslo na nej zakryť).

## Celý web naraz

Celý balík (`sh tools/ftp-balik.sh headspa30.sk` → `_ftp/`) má asi 285 súborov a 35 MB. Na nahratie
cez webFTP ho rozdeľ: `python3 tools/ftp-rozdel.py <cieľ> [limit-MB]` vyrobí `headspa30-ftp-N-z-M.zip`
po menej ako 19 MB, všetky sa rozbaľujú v `/headspa30.sk/www`. Súbor do chatu môže mať najviac 30 MB.

## Čo nerobiť

- Nenahrávať ZIP do časti Soubory bez rozbalenia a nerozbaľovať ho mimo `www`
  (napríklad do `/headspa30.sk`). Kontrola potom hlási `NIC` alebo `CIASTOCNE`.
- Pri ručnom nahrávaní nemeniť `.htaccess` na serveri. Presmerovanie na www robí Forpsi; v Safari
  „príliš veľa presmerovaní“ vyrieši vymazanie údajov stránky.
- Nekupovať SSL: na doméne je platný certifikát (Actalis, *.headspa30.sk a headspa30.sk, do 13. 4. 2027).
- V `/headspa30.sk` je súbor `.zip` (35 MB) zo staršieho pokusu. Nie je verejný (mimo www), dá sa zmazať.

## Automatické nahrávanie (zatiaľ nie je zapnuté)

`.github/workflows/ftp.yml` pri každom pushi do main spustí `tools/ftp-balik.sh` a nahrá zmenené súbory
na FTP, ale len keď sú v GitHube tajné premenné (Settings, Secrets and variables, Actions):
`FTP_SERVER` (`ftpx.forpsi.com`), `FTP_USER`, `FTP_PASSWORD` a pri tomto multi webhostingu aj
**`FTP_DIR` = `/headspa30.sk/www/`** (predvolené `/www/` je zlý priečinok), prípadne `FTP_DOMENA`.
Hodnoty zadáva majiteľ priamo v GitHube, nikdy nie do chatu ani do repozitára.

- Bez `FTP_SERVER` sa krok preskočí („FTP nie je nastavené“) a beh je aj tak zelený.
- Overenie z kontajnera: `gh api repos/<vlastník>/head-spa-30/actions/workflows/<id ftp.yml>/runs?per_page=1`
  a `.../actions/runs/<id>/jobs` (zoznam tajných premenných vrátiť nevie, 403).
- Automatické nahrávanie prepíše aj `.htaccess` súborom `tools/ftp.htaccess`; ten je bezpečný
  (nemá pravidlo www ani vynútené HTTPS).

## Upozornenie, keď je web nahratý

Keď majiteľ chce správu po nahratí: rutina (create_trigger, `CRON_TZ=Europe/Bratislava 0 8-21 * * *`)
spustí `kontrola-nahratia.sh`, pri `NIC` a `CHYBA_SIETE` mlčí, pri `HOTOVO` ešte overí curlom index.html,
pošle upozornenie a rutinu zmaže; pri `CIASTOCNE` a `ZLY_PRIECINOK` upozorní raz. Dočasný priečinok
po reštarte kontajnera zmizne, preto musí výzva rutiny obsahovať aj záložný postup (worktree konkrétneho
commitu, `sh tools/ftp-balik.sh headspa30.sk`, manifest z neho).
