# Odovzdávka: Barbershop 30 – údernejšie texty tímu, recepcia v častých otázkach, odkazy na prevádzky (27. 10. 2026)

Strom: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny` (git worktree, vetva
`barbershop-skvrny`, východisko bdabff7). Všetko len lokálne, bez push, bez nasadenia. Cesty nižšie sú relatívne
k `hs-skvrny/barbershop-30/`, pokiaľ nie je uvedené inak.

## 1. Čo je postavené

Základ je návrh C (`scratchpad/barber/texty/texty-C.md`) so štepmi a škrtmi oboch porôt. Zadanie stavby síce píše „víťazný
návrh B“, ale obe poroty (`porota-majitel.md`, `porota-pravda.md`) vyhlásili za víťaza C a všetky vymenované štepy („Z A do C“,
„Z B do C“) aj škrty („C Michal → …“, „C Kristián → …“) sú úpravy textu C; preto je postavené C + štepy.

| časť | kde | text |
|---|---|---|
| Úvod tímu | `index.html:304` (`.lead.measure`) | „Tím barberov a barberiek pod jednou značkou. Každý má vlastný rukopis, všetci rovnaký štandard: konzultácia, poctivá práca a strih, ktorý vyzerá dobre aj o týždeň. Ty povieš, ako to chceš. Zvyšok je remeslo.“ (štep z A namiesto „Vyber si svojho človeka a objednaj sa.“) |
| Tri piliere | `index.html:315–319` (`ul.team-pillars`), CSS `assets/style.css:699–705` | Skúsenosti (103 zn.): „Striháme na Mostnej 30 od roku 2019. Hodnotenie 5,0 na Google sa za týždeň nastrihať nedá. Nič naslepo.“ · Precíznosť (111): „Konzultácia pred prvým ťahom strojčeka, britva pri brade, styling a kolínska na záver: nič sa tu nerobí od oka.“ · Pohodlie (74): „Pri dverách recepčná, v čakárni káva a minerálka zdarma. Ty si len sadneš.“ |
| Riadky barberov (≤ 90 zn.) | `index.html:332–467`, rovnako `rezervacia.html:268–418`, odpovede asistenta `tim-*` v `../asistent/znalosti/barbershop-otazky.json` (napr. r. 2007) a kópia `assets/asistent-otazky.json` | Nikolas 66, Kristián 70 („Ty sedíš, on pracuje.“ – škrt), Damian 69, Michal 72 („Horúci uterák, britva, ticho. Zavrieš oči unavený, otvoríš ich ako nový.“ – škrt A+B), Andy 73, Dominika 69, Kevin 72, Lajko 75, Jojo 78, Adrian 80 |
| Časté otázky | `index.html:837` (2. miesto) a `index.html:844` (9. miesto) | „Mám volať barberovi alebo recepcii?“ (319 zn.) a „Čo ma čaká, keď prídem?“ (205 zn.) – znenia nižšie |
| Pätička „Naše prevádzky“ | `index.html:891–898`, CSS `assets/style.css:948–957` a `:1628` (ťukacia plocha) | HEAD SPA 30 → https://www.headspa30.sk/ · Salón 30 → https://www.salon30.sk/ · Barbershop 30 → `#uvod`, `aria-current="page"` (`index.html:896`); externé odkazy `target="_blank" rel="noopener"` ako ostatné v pätičke |
| Jazyky | `assets/i18n/{cs,de,en,hu,pl,sr,uk}.json`: 309 → 325 kľúčov (27 pridaných, 11 starých odobraných, žiadna iná hodnota zmenená, `__tabula` bez zmeny); `en/index.html` pregenerovaná (`node source/tools/en-stranka.mjs`: 369 prekladov, bez prekladu 0) | preklady v `scratchpad/barber/stavba/preklady.json` |
| Testy a dokumentácia | `source/tools/en-test.mjs:65,101` (10 otázok namiesto 8), `README.md` (10 otázok, nová odrážka), `docs/CONTENT_SOURCES.md` (časť 2026‑10‑27 s oporou každej vety), `docs/CHECKS.md` 32, `docs/POSTUP.md` (denník), `dennik/barbershop-30/docs/plynulost/OTAZKY-PRE-MAJITELA.md` (otázky 25–34 + poznámka pri pravidle o Salóne 30 a HEAD SPA 30) | |

Znenia otázok:

- **Mám volať barberovi alebo recepcii?** „Vždy recepcii: 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.
  Recepčná sa stará o tvoj termín a pohodlie, barber o tvoj výsledok. Keď má v kresle zákazníka, venuje sa jemu, nie telefónu.
  Tak to bude, aj keď v kresle sedíš ty. Recepcia ti termín nájde, zmenu či zrušenie jej daj vedieť čo najskôr.“
- **Čo ma čaká, keď prídem?** „Pri dverách ťa privíta recepčná. Vzadu v čakárni máš kávu alebo minerálku zdarma. V kresle začína
  konzultácia, potom strojček, nožnice a fade, pri brade horúci uterák a britva. Na záver styling a kolínska.“

Riadky v pätičke: HEAD SPA 30 „Head Spa rituály pre relax a regeneráciu vlasov.“ · Salón 30 „Kaderníctvo a wellness pre vlasy:
strihy, farbenie a koloristika, trichologické vyšetrenie.“ · Barbershop 30 „Pánske strihy, brada a holenie britvou. Si tu.“

## 2. Rozhodnutia, kde sa štepy a škrty bili, alebo kde som sa odchýlil

1. **Garancia nie je na webe.** V textoch webu ani v `docs/` sa „garancia“ nevyskytuje (porota: grep 0 nálezov); majiteľ nič
   nepotvrdil. Tretí pilier je „Pohodlie“, otázka „Čo ak nebudem spokojný?“ sa neukazuje. Tri znenia (G1 C, G2 = A G3 namiesto
   C G2 so 7 dňami a „zadarmo“, G3 „strih neplatíš“ s výslovným varovaním o verejnom sľube) sú v OTAZKY otázka 25.
2. **Názov tretieho piliera.** Štep „náhradný pilier pomenovať Remeslo“ sa bije so škrtom, ktorý tomu istému pilieru predpisuje
   text o recepčnej a káve („Pri dverách recepčná, v čakárni káva a minerálka zdarma. Ty si len sadneš.“). Nad textom o pohodlí
   by nadpis „Remeslo“ klamal a remeslo už pokrýva pilier Precíznosť (a nadpisok scény 3). Preto Skúsenosti · Precíznosť ·
   Pohodlie; po potvrdení garancie sa Pohodlie vymení za Garanciu.
3. **Skúsenosti bez počtu recenzií.** Porota majiteľa chcela „Hodnotenie 5,0 na Google sa za týždeň nastrihať nedá“, porota
   pravdy variant bez čísla recenzií. Zvolené znenie poroty majiteľa: nemá počet recenzií (ten starne, otázka 18), hodnotenie
   5,0 je už v úvode webu (`index.html:193`, CONTENT_SOURCES „Úvod: hodnotenie a cena“). Variant poroty pravdy („Jeden postup:
   konzultácia, strojček, nožnice, fade“) by opakoval pilier Precíznosť. Majiteľovi je to otázka 31.
4. **Odpoveď o recepcii.** Štep z B „Recepcia ti termín nájde, presunie aj zruší.“ ide nad zdroj (storno = nepotvrdená otázka 3),
   preto podľa poroty pravdy „Recepcia ti termín nájde, zmenu či zrušenie jej daj vedieť čo najskôr.“ (opora `index.html`
   „Daj nám vedieť čo najskôr“). S celým C textom by odpoveď mala 326 znakov (> 320), preto „Presne tak to bude“ → „Tak to bude,
   aj keď v kresle sedíš ty.“ (319). Záver z A „Termín si tiež spravíš online, kedykoľvek.“ sa nevošiel; hovorí to otázka
   „Ako sa objednám?“ hneď nad ňou.
5. **Salón 30 bez „dámske strihy“.** Na www.salon30.sk je „Strih“, „klasické strihy“, „módne strihy“, nie doslovné „dámske
   strihy“ (curl + grep, 27. 10.), preto „strihy“. „Koloristika“ a „Trichologické vyšetrenie vlasov“ sú na stránke doslovne.
   „Mostná 30.“ som z riadkov vynechal (porota: trikrát v pätičke); podnadpis „Všetky tri na Mostnej 30 v Nitre.“ je otázka 30.
6. **Adresa HEAD SPA 30.** Kanonická adresa v koreňovom `index.html:30` je github.io, ale `tools/ftp-balik.sh:26` ju pri nahratí
   prepisuje na doménu a živý web na https://www.headspa30.sk/ má `canonical https://headspa30.sk/`. Odkaz vedie na doménu
   (konečná adresa po presmerovaní, 200); github.io ako alternatíva je otázka 27.
7. **Nadpis „Naše prevádzky“** sú slová majiteľa z 27. 10. („aby mohli klikať rovno na naše prevádzky“); ruší pravidlo
   OTAZKY:111, ktoré som v súbore označil ako zmenené a potvrdenie dal do otázky 26 (náhrada „Na Mostnej 30 nájdeš aj“).
8. **Riadky barberov aj v `rezervacia.html` a v odpovediach asistenta** – inak by po odobraní starých kľúčov ostali na
   rezervačnej stránke slovenské texty bez prekladu a asistent by hovoril staré vety (CLAUDE.md: po zmene tímu zmeň aj znalosti).
9. **CSS**: `ul.team-pillars`, lebo `ul[role="list"] { margin: 0 }` (`style.css:91`) má vyššiu špecifickosť a piliere sa lepili na
   portréty (prvá snímka PO to ukázala, opravené pred hárkom).
10. **en-test.mjs** očakáva 10 otázok (bolo 8) – jediná zmena testov.

## 3. Merania a dôkazy

- Dĺžky (`python3 -I`, skript v `scratchpad/barber/stavba/stavba.py` kontroluje limity pri stavbe): riadky barberov 66–80 (≤ 90),
  piliere 74–111 (≤ 140), odpovede 319 a 205 (≤ 320), úvod tímu 207.
- `index.html`: 84 851 → 87 429 B, gzip -9: **14 844 → 15 758 B** (hranica 14 600 B z plánu D6 bola prekročená už pred zmenou).
- Adresy (`curl -sS -o /dev/null -L -w '%{http_code} final=%{url_effective}'`, 27. 10. 2026):

| adresa | kód | konečná adresa |
|---|---|---|
| https://www.headspa30.sk/ | 200 | https://www.headspa30.sk/ |
| https://headspa30.sk/ | 200 | https://www.headspa30.sk/ |
| https://d8f5s88zjy-art.github.io/head-spa-30/ | 200 | rovnaká |
| https://www.salon30.sk/ | 200 | https://www.salon30.sk/ |
| https://salon30.sk/ | 200 | https://www.salon30.sk/ |
| https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/ | 200 | rovnaká |
| https://www.barbershop30.sk/ | 200 | rovnaká (starý web, neodkazujeme) |
| https://booqme.app/sk/rezervacia/salon-30-head-spa | 200 | rovnaká |

  Titulky: headspa30.sk „HEAD SPA 30 Nitra | Head Spa rituály, ceny a rezervácia“ (description „Head Spa rituály pre relax a
  regeneráciu vlasov …“), salon30.sk „Salón 30“ (na stránke „Mostná 30“, „Wellness pre vaše vlasy“, „koloristika“,
  „Trichologické vyšetrenie vlasov“).
- Testy (`scratchpad/barber/stavba/testy.sh`; PRED = export bdabff7 v `scratchpad/barber/pred-strom`, PO = tento strom;
  výpisy `scratchpad/barber/stavba/testy-pred/*.log` a `testy-po2/*.log`):

| test | PRED (bdabff7) | PO |
|---|---|---|
| i18n-test | 55 OK | 55 OK |
| en-test | 16 OK | 16 OK |
| app-smoke | 108 OK, 1 FAIL („[softvér desktop] bez posunu rozloženia (CLS 0.0283)“) | prvý beh 109 OK; definitívny beh (`testy-po2`) 108 OK + ten istý FAIL s rovnakou hodnotou CLS 0.0283 (kolísavé meranie záložného úvodu bez filmu, mimo zmenených častí) |
| vychytavky-test | 27 OK | 27 OK |
| tma-test | padá: `ImportError: cannot import name '_imaging' from 'PIL'` (chybný Pillow v prostredí, test volá `python3 -c … from PIL import Image`) | rovnaká chyba |
| admin-test | 101 OK | 101 OK |

  Nič nové nepadá. `node source/tools/otazky.mjs`: „všetko OK: 251 otázok, 11 tém“.
- Snímky (Playwright, Chromium z `/opt/pw-browsers`, server `python3 -I -m http.server 8800` pre PO a `8801` pre export bdabff7,
  stránka `/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka&uvod=off`, bublina asistenta zavretá jej tlačidlom):
  `scratchpad/barber/stavba/snimky/{pred,po}-{tim,otazky,paticka}-{telefon,pocitac}.jpg` (telefón 390×844 DPR 3, počítač
  1440×900). Hárok **`scratchpad/barber/texty/pred-po.jpg`** (1800×6107 px, 0,98 MB, popisy po slovensky) – otvorený
  a skontrolovaný: piliere s odstupom od portrétov, 10 otázok, pätička s troma prevádzkami a zvýraznenou aktuálnou.
  Bez vodorovného pretekania (scrollWidth 390 / 1440), bez chýb skriptu.

## 4. Commity (lokálne, po slovensky, bez podpisov)

- `hs-skvrny` (vetva `barbershop-skvrny`, nad bdabff7):
  - `db896f33` Barbershop 30: údernejšie texty tímu, recepcia v častých otázkach a odkazy na prevádzky
    (index.html, rezervacia.html, style.css, odpovede asistenta + kópia, en-test.mjs, README, CHECKS, CONTENT_SOURCES, POSTUP)
  - `c88d29a1` Barbershop 30: preklady nových textov do siedmich jazykov a anglická stránka (7× i18n JSON, en/index.html)
- `dennik` (worktree toho istého repozitára, odpojená HEAD): moju úpravu `OTAZKY-PRE-MAJITELA.md` zachytil automatický
  zápis denníka ako `50e7c4d9` „Denník: check-in 27. 10. 14:46“ (spolu s PRIEBEH.md); strom je čistý.
- Nič sa nepushlo, nemergovalo ani nenasadilo. `git status` v oboch stromoch: čistý.

## 5. Na potvrdenie majiteľom (OTAZKY-PRE-MAJITELA.md, otázky 25–34)

Garancia (G1/G2/G3 + FAQ „Čo ak nebudem spokojný?“), nadpis „Naše prevádzky“ (náhrada „Na Mostnej 30 nájdeš aj“), adresa
HEAD SPA 30 (doména vs. github.io), riadok Salónu 30, odkaz Barbershopu po presune na doménu, podnadpis „Všetky tri na Mostnej
30 v Nitre.“, hodnotenie 5,0 v pilieri, „bez objednania“ (otázka 5), fakty o barberoch (otázka 17), e‑mail/WhatsApp pri „volaj
recepcii“ (otázka 12).

## 6. Nedokončené a upozornenia

- Garancia a otázka „Čo ak nebudem spokojný?“ nie sú na webe (čakajú na potvrdenie).
- gzip `index.html` 15 758 B je nad 14 600 B z plánu D6 (bolo 14 844 B už pred zmenou); ak má hranica platiť, treba ju riešiť
  samostatne (napr. odpovede otázok alebo piliere mimo prvého okna).
- tma-test sa v tomto prostredí nedá vyhodnotiť (Pillow bez `_imaging`), pred aj po zmene.
- Referenčný súbor `toolbox/skills-z-praxe/obsah-a-texty/references/popisy-ludi.md` cituje staré riadky barberov ako príklad;
  nemenil som ho (je to návod, nie web).
- `rezervacia.html` má vlastnú krátku pätičku bez stĺpcov; blok „Naše prevádzky“ je len na hlavnej stránke a v `en/`.
- Nasadenie, push, merge: nič z toho sa nerobilo.
