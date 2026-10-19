# Sťahovanie referenčných videí: zásada, právo a podmienky (stav 2026-10-19)

Pre `../SKILL.md` (zásada 6) a pre každý rozbor cudzieho videa (`tiktok.sh`, yt-dlp, `../../youtube-shorts/scripts/strihy.sh`).
Vzniklo pri rozbore videa nateherkai „Unethical GitHub projects“ (`naucene-z-videi.md`, záznam 13), ktoré medzi
„neetické“ zaradilo aj sťahovanie videí z platforiem. Primárne zdroje prečítané 2026-10-19, ak nie je uvedené inak.
Nie je to právne poradenstvo; pri spore alebo pred zverejnením čohokoľvek cudzieho nech rozhodne právnik.

## Zásada v skratke

**Stiahnuté video je len na rozbor.** Nič z neho nezverejníme, nevložíme do vlastného videa, webu ani
príspevku, nenahráme do cudzej služby (ani do AI editora, prepisu či „analýzy virality“) a nepošleme ďalej.
Sťahujeme len verejné video, ktoré poslal majiteľ, po jednom, bez prihlásenia a bez obchádzania ochrany.
Po zápise rozboru video zmažeme a necháme si merania a poznámky.

## Poradie ciest (od najčistejšej)

| # | Cesta | Kedy | Poznámka |
| --- | --- | --- | --- |
| 1 | majiteľ uloží video funkciou aplikácie a pošle súbor (TikTok „Uložiť video“, Instagram „Stiahnuť“ pri verejnom reeli) | vždy, keď sa dá | funkcia platformy podľa nastavenia autora (TikTok Terms 4.9); súbor má vodoznak a meno autora, to rozboru nevadí. Ak tlačidlo chýba, autor sťahovanie vypol: ideme cestou 2, nie nástrojom |
| 2 | pozeranie v prehliadači alebo aplikácii, krokovanie po snímkach, pomalé prehrávanie, pár snímok obrazovky na poznámky | **YouTube vždy**; inde, keď autor sťahovanie vypol alebo nástroj narazí na odmietnutie | YouTube: pozastaviť, `,` a `.` = snímka späť a dopredu, `<` a `>` = rýchlosť (support.google.com/youtube/answer/7631406). Strihy počítame ručne s časom |
| 3 | `tiktok.sh`, záložne yt-dlp, podľa pravidiel nižšie | TikTok a Instagram, keď majiteľ poslal len odkaz a cesta 1 nie je praktická | nástroj mimo aplikácie je proti podmienkam TikToku a Mety (nižšie); preto len verejné video, po jednom, s vedomím rizika |

Na YouTube neťaháme ani shorty: podmienky to zakazujú výslovne a na YouTube majiteľ sám uverejňuje, chceme tam
mať čistý štít.

## Červené čiary (nikdy, ani „len na rozbor“)

- **Prihlásenie a cookies účtu:** `--cookies-from-browser`, `--cookies` so súborom z prihláseného prehliadača,
  `--username`, `--password`, `--netrc`. Cookies anonymnej relácie, ktoré si `tiktok.sh` vytvorí sám, áno, a po
  behu sa mažú.
- **Neverejný obsah:** súkromné účty, platené, členské alebo predplatené videá, vekovo obmedzené videá, obsah za
  registráciou.
- **Ochrana:** DRM a šifrovaný obsah (`--allow-unplayable-formats` je vývojárska voľba „not intended to be used by
  the end-user“), obchádzanie geoblokovania (`--geo-bypass`, `--geo-bypass-country`, `--xff`, proxy alebo VPN do
  inej krajiny), doplnky na tokeny a iné obchádzanie ochrany proti robotom. Obchádzanie „účinných technologických
  opatrení“ je zásah do autorského práva (autorský zákon § 60 ods. 1 a 3).
- **Objem:** celý kanál, playlist, `--batch-file`, slučky cez zoznam odkazov, opakovanie po zablokovaní.
- **Pirátske služby:** stránky a nástroje určené na porušovanie autorských práv (yt-dlp ich zámerne nepodporuje,
  CONTRIBUTING.md). Do toolboxu nepíšeme ich názvy ani odkazy.
- **Pri prvom „nie“ platformy končíme:** výzva na prihlásenie, captcha, HTTP 403, vekové overenie, „video nie je
  dostupné“. Neskúšame iný klient, proxy ani cookies; ideme cestou 2.
- **`--impersonate chrome`** (yt-dlp napodobní prehliadač pri požiadavkách) je šedá zóna: berieme ho len na
  verejnú stránku, ktorú bez prihlásenia dostane každý prehliadač (tak bežal pri V1 až V3), nikdy na prekonanie
  odmietnutia.

## Hygiena po stiahnutí

1. Každé video vo vlastnom prázdnom priečinku scratchpadu, nikdy v repozitári (už v `../SKILL.md`, zásada 5).
2. **Hneď vyčistiť metadáta:** yt-dlp 2026.08.19 zapisuje pri TikToku do `video.info.json` kľúč `cookies`
   (`ttwid`, `tt_csrf_token`, `tt_chain_token`) v koreni aj pri 7 až 11 formátoch, napriek predvolenému
   `--clean-info-json`; overené 2026-10-19 na všetkých siedmich TikTok súboroch v scratchpade, pri troch z Instagramu cookies neboli.
   Okrem toho sú tam podpísané adresy a hlavičky. Uložená `stranka.html` z `tiktok.sh` nesie identifikátory
   anonymnej relácie (`csrfToken`, `odinId`, `wid`, `tt_chain_token`), tú po rozbore zmaž. Príkaz pre info.json:

   ```bash
   python3 -I toolbox/skills-z-praxe/referencie-z-videi/scripts/vycisti_info.py <priečinok>/video.info.json
   ```

   Skript zmaže `cookies`, `url`, `thumbnail`, `manifest_url`, `fragment_base_url`, `http_headers` a `fragments`
   všade v súbore a nechá autora, dátum, počty, trvanie a popis (overené: TikTok 37 polí, Instagram 31 polí,
   druhý beh 0, kód 2 bez argumentov, kód 1 pri nečitateľnom súbore; pri zápise do toolboxu znova: TikTok V5
   31 polí s `cookies`, reel V10 35 polí bez cookies, druhý beh 0).
3. **Autor v zázname:** súbor z `tiktok.sh` aj z yt-dlp je bez vodoznaku, preto do záznamu vždy autor, adresa
   a dátum stiahnutia (`zapis-referencie.md`).
4. **Osobné údaje z obrazu neprepisujeme:** e-maily, telefóny, mená a profily súkromných osôb (V6 ukazuje
   profily dvoch vývojárov, pri jednom e-mail). Tvár a meno autora videa len v rozsahu „kto to povedal“.
5. **Po zápise rozboru** do `naucene-z-videi.md` (a do dokumentu projektu) zmaž `video.mp4`, `stranka.html`,
   titulky a snímky v plnej veľkosti. Ponechaj merania (`strihy.sh`, hlasitosť, súradnice titulkov) a najviac pár zmenšených
   snímok k poznámkam. Výnimka pre čerpanie údajov dovoľuje rozmnoženiny uchovávať, len kým sú na to potrebné
   (autorský zákon § 51c ods. 2).
6. Nič zo stiahnutého do commitu, do artefaktu ani do zdieľaného priečinka.

## Čo smieme s výsledkom

- Zapísať, čo video hovorí a ukazuje, s časmi a s krátkymi doslovnými citátmi textu z obrazu (citácia na účel
  recenzie a kritiky, autorský zákon § 37; rozsah len taký, aký účel odôvodňuje).
- Preniesť **postup**: stavbu, tempo, typ hooku, rozloženie titulkov, a to do vlastných videí zo skutočných
  záberov prevádzky (`../../youtube-shorts/`).
- Nie: prebrať scenár, vety, grafiku, hudbu, zábery alebo ich poradie ako kópiu; vložiť cudzí záber do
  vlastného shortu, ani „len na chvíľu“ alebo ako reakciu.

## Prečo (zdroje)

### Autorský zákon (č. 185/2015 Z. z., znenie od 1. 9. 2026)

https://static.slov-lex.sk/static/SK/ZZ/2015/185/20260901.html

- **§ 19 ods. 2 a ods. 4 písm. d):** dielo možno použiť iba so súhlasom autora, ak zákon neustanovuje inak;
  použitím je aj „vyhotovenie rozmnoženiny diela“. Stiahnutie videa je rozmnoženina.
- **§ 42:** bez súhlasu smie len „fyzická osoba“, „pre svoju súkromnú potrebu na účel, ktorý nie je priamo ani
  nepriamo obchodný“. Práca pre prevádzky je obchodný účel, takže sa o § 42 **neopierame**.
- **§ 51c ods. 1:** „Do autorského práva nezasahuje osoba, ktorá bez súhlasu autora použije vyhotovením
  rozmnoženiny dielo pri čerpaní údajov, ak takéto použitie nie je výslovne vyhradené.“ Čerpanie údajov je
  „akákoľvek automatizovaná analytická technika zameraná na analýzu údajov v digitálnej forme s cieľom získať
  vzory, trendy, korelácie a podobné výsledky“ (§ 51b ods. 2). Naše meranie strihov, hlasitosti, tempa a polohy
  titulkov je takáto technika; **ods. 2:** rozmnoženiny len po dobu potrebnú na čerpanie údajov. Výhradu autora
  (vypnuté sťahovanie, výslovný zákaz) rešpektujeme.
- **§ 37:** citácia zverejneného diela alebo jeho časti „najmä na účel recenzie alebo kritiky“, v súlade so
  zvyklosťami a v rozsahu odôvodnenom účelom.
- **§ 60 ods. 1 a 3:** neoprávnene zasahuje, kto vedome obchádza účinné technologické opatrenia; je ním aj
  „šifrovanie, kódovanie alebo iná úprava diela alebo uplatnenie iného kontrolného mechanizmu použitia diela“.
- **§ 26 ods. 2:** technické predvedenie diela (obraz alebo zvuk cez zariadenie) verejnosti prítomnej na mieste
  je verejné vykonanie, teda použitie so súhlasom (dôležité pre televízory a hudbu v prevádzke).

### Trestný zákon (č. 300/2005 Z. z., znenie 18. 8. 2026), § 283

https://static.slov-lex.sk/static/SK/ZZ/2005/300/20260818.html

- „Kto neoprávnene zasiahne do zákonom chránených práv k dielu … potrestá sa odňatím slobody až na jeden rok“;
  ods. 2 písm. d): až dva roky, ak čin spácha „prostredníctvom počítačového systému“.

### Súdny dvor EÚ, C-435/12 ACI Adam (10. 4. 2014)

- Tlačová správa č. 58/14: vnútroštátna úprava, ktorá nerozlišuje súkromné kópie z legálnych a z falšovaných
  alebo pirátskych zdrojov, sa nedá tolerovať („cannot be tolerated“). Výnimka pre súkromnú kópiu teda
  nepokrýva kópie z nelegálneho zdroja (curia.europa.eu, cp140058en.pdf).

### Podmienky platforiem

- **YouTube** (Terms of Service, účinné 15. 12. 2023, Permissions and Restrictions, bod 1): nesmieš „access,
  reproduce, download, distribute …“ obsah okrem prípadov „(a) as expressly authorized by the Service; or (b)
  with prior written permission from YouTube and, if applicable, the respective rights holders“.
  https://www.youtube.com/static?template=terms
- **TikTok** (Terms of Service EEA, aktualizované júl 2026): bod 4.5 zakazuje „extract any data or content from
  the Platform using any automated system or software that is not provided by TikTok“ (ak to TikTok písomne
  neschváli); bod 4.9: licencia ostatným používateľom je „subject to your Platform settings“ a na používanie
  platformy „for entertainment purposes“, s odkazom na funkcie Duet, Stitch, download a share.
  https://www.tiktok.com/legal/page/eea/terms-of-service/en
- **Meta (Instagram, Facebook):** „Platform APIs are the only allowable means to access data programmatically,
  unless you have our prior written permission.“
  https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection/ (citované
  v `../../instagram-salon/references/pravne-hranice.md`). Pomocník Instagramu k sťahovaniu reels podľa výpisu
  vyhľadávača (stránku help.instagram.com/520831036611383 sme 2026-10-19 priamo nenačítali, HTTP 400): pri
  verejnom účte môže reel stiahnuť ktokoľvek, ak to autor nevypol; stiahnutie má vodoznak, meno autora a údaj
  o zvuku; stiahnuté reels sa nesmú použiť na komerčné účely.
- **Netflix** (Terms of Use, 10. 4. 2026, body 1.4 a 1.8(i)): „for your personal, non-commercial use only“;
  zakázané „use the service for commercial purposes or public performances“. Rovnaká logika platí pre ostatné
  domáce predplatné: televízor v prevádzke nie je domácnosť. https://help.netflix.com/legal/termsofuse

### yt-dlp

- Licencia Unlicense (zostavené spustiteľné súbory GPLv3+), README.
- CONTRIBUTING.md: projekt nepodporuje služby „primarily used for infringing copyright“ ani služby, ktoré
  ponúkajú len obsah s DRM. `--allow-unplayable-formats` je v časti „Developer options … not intended to be
  used by the end-user“. https://github.com/yt-dlp/yt-dlp (README a CONTRIBUTING stiahnuté 2026-10-19)

## Hodnotenie nášho doterajšieho postupu (V1 až V10, október 2026)

V číslovaní videí v `naucene-z-videi.md`: V1 až V3 = záznamy 8 až 10, V4 až V10 = záznamy 11 až 17.

| Čo sme robili | Hodnotenie | Zmena |
| --- | --- | --- |
| `tiktok.sh` a yt-dlp na verejné videá bez prihlásenia, po jednom, poslané majiteľom | autorské právo: nízke riziko pri internom automatizovanom rozbore (§ 51c), nie pri zverejnení; podmienky TikToku (4.5) a Mety porušuje každý nástroj mimo aplikácie | poradie ciest vyššie; nástroj až tretí |
| `--impersonate chrome` pri V1 až V3 | šedá zóna (obchádza rozpoznanie robotov), ale len na verejnú stránku | ponechať len na verejnú stránku, nikdy po odmietnutí |
| videá v scratchpade, nič v repozitári, nič nezverejnené | v poriadku | bez zmeny |
| `cj.txt` zmazaný skriptom | v poriadku | bez zmeny |
| `stranka.html` z `tiktok.sh` ostáva v priečinku | nesie identifikátory anonymnej relácie | po rozbore zmazať |
| `video.info.json` z yt-dlp s cookies relácie a podpísanými adresami | nedostatok: tokeny relácie ostali v súboroch | `scripts/vycisti_info.py` hneď po stiahnutí |
| súbor bez vodoznaku (formát `bytevc1_1080p`, hoci bol k dispozícii aj „download … watermarked“) | rozbor je presnejší, ale súbor nenesie autora | autor, adresa a dátum vždy v zázname |
| videá a snímky ostávajú v scratchpade aj po rozbore | rozmnoženiny dlhšie, ako treba | po zápise rozboru zmazať video, nechať merania |
| prepis textu z obrazu do záznamov | citácia na účel rozboru, v poriadku | bez osobných údajov tretích osôb |
| žiadne AI služby tretích strán na cudzie videá | v poriadku | zapísané ako pravidlo |
| YouTube referencie (zatiaľ žiadne stiahnuté) | podmienky YouTube sťahovanie výslovne zakazujú | YouTube len cestou 2 |

## Otázka majiteľovi (formát D1 zo `../../tim-roly/`)

```
D1 · Ako budeme brať referenčné videá
O čom to je: Videá, ktoré mi posielaš, si sťahujem a meriam (strihy, tempo, hlasitosť). Podľa autorského zákona
je interný automatizovaný rozbor v poriadku, kým nič nezverejníme a video potom zmažeme. Podmienky TikToku
a Instagramu však sťahovanie inými nástrojmi ako ich aplikáciou zakazujú; YouTube výslovne.
Čo sa pokazí pri zlej voľbe: v horšom prípade platforma zablokuje prístup z nášho pripojenia; pri zverejnení
cudzieho videa by išlo o porušenie autorského práva.
Odporúčanie: A, keď sa dá, inak B pri TikToku a Instagrame; pri YouTube vždy C.
A) Video uložíš v aplikácii (Uložiť video, Stiahnuť) a pošleš mi súbor. Plus: podľa pravidiel platformy a voľby
   autora. Mínus: pár ťuknutí navyše; ak autor sťahovanie vypol, nejde to.
B) Pošleš odkaz, stiahnem ho nástrojom podľa zásady. Plus: rýchle, presné merania. Mínus: proti podmienkam
   TikToku a Instagramu (nie proti zákonu pri internom rozbore), malé riziko zablokovania.
C) Len pozeranie a snímky obrazovky. Plus: najčistejšie. Mínus: strihy a hlasitosť len odhadom.
Úplnosť: A=10/10, B=9/10, C=6/10
```
