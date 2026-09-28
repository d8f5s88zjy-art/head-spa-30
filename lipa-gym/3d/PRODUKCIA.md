# GYM KLUB – prechádzka fitkom: produkčný dokument

Stránka `lipa-gym/3d/` je prechádzka celým fitkom GYM KLUB Nitra na skutočných záberoch
z prevádzky. Je to samostatná varianta vedľa existujúceho webu `lipa-gym/`, ktorý zostal
bez zmeny. Stránka má `noindex`, kým ju prevádzka neschváli.

Zadanie od klienta: žiadny úvod s padajúcou činkou, radšej prechádzka gymom „tak, aby ho
bolo vidno celý“, všetko skutočné a ostré, pocit prehliadky nehnuteľnosti.

Spustenie lokálne: v koreni repozitára `python3 -m http.server 8080` a otvoriť
`http://localhost:8080/lipa-gym/3d/`. Žiadne zostavovanie ani knižnice nie sú potrebné.

## 1. Register faktov

Overené na gymklub.sk 27. 9. 2026 (hlavná stránka, pätička, FAQ, rozvrh).

| Fakt | Hodnota | Stav | Na stránke |
|---|---|---|---|
| Názov | GYM KLUB / Gym Klub Fitness & Bodybuilding | overené | áno |
| Adresa | Výstavná 6 (Lipa Centrum), 949 01 Nitra | overené (pätička) | áno |
| Telefón | +421 944 800 394 | overené | áno |
| E-mail | info@gymklub.sk | overené | áno |
| Typy tréningov | fitness, bojové športy (MMA, Jiu Jitsu, Luta Livre), Krav Maga, Zdravý chrbát, Pilates | overené | áno, bez časov |
| Klimatizácia | „plne klimatizované“ | overené (text webu), na fotkách stropné kazetové jednotky | áno |
| Otváracie hodiny | FAQ: Po–Št 06:30–21:00, Pi 06:30–23:00, So–Ne 08:00–17:00. Pätička: So–Ne 08:30–18:00 | **KONFLIKT** (víkend) | nie |
| Ceny | vstup 6 €, permanentka 50 €/mesiac a ďalšie | neoverené s prevádzkou | nie |
| Platba | FAQ: „len v hotovosti“, cenník: Multisport, Upbalansea app | treba potvrdiť | nie |
| Tréneri | zoznam v menu sa líši od stránky trénerov | **KONFLIKT** | nie |

Pred zverejnením treba s prevádzkou potvrdiť hodiny, cenník, spôsob platby a zoznam
aktívnych trénerov. Potom doplniť sekciu `#hodiny` a zmazať `noindex`.

## 2. Médiá

Zdroj: 59 unikátnych fotografií (iPhone, ultraširoký objektív, 1932 × 2576 px na výšku)
a 13 videí (3840 × 2160 HEVC HDR HLG, otočené na výšku, 2,5 až 6,2 s) z 26. 9. 2026.
Duplikáty sú vyradené podľa kontrolného súčtu, poškodená fotka `907003c1` sa nepoužíva.
Originály sa do repozitára nekopírujú.

Spracovanie: fotky P3 → sRGB, export 1932 a 1280 px (AVIF 62 / WebP 84 / JPG 86);
videá HLG → SDR BT.709 (tonemapping hable), 1080 × 1920, 30 fps, bez zvuku (MP4 CRF 21,
WebM VP9 32) plus ostré snímky 2160 a 1280 px z prvej použitej snímky; náhľady 480 × 320 px
s orezom na bod záujmu. Všetko je v `media/` (275 súborov, 80 MB, z toho videá 7 MB);
každý súbor je odkazovaný z `tour-data.json` alebo `index.html`, žiadny odkazovaný nechýba.

Videoklipy sú dva: terasa (IMG_8989 od 0,1 s, 2,7 s, opakuje sa) a recepcia (IMG_8993 od
2,7 s do konca, 0,8 s, prehrá sa raz a ostane na poslednej snímke). Dvere zvonku existujú
len ako snímka z videa IMG_8990 (2,1 s): všetky zábery približovania k dverám sú buď mäkké
(IMG_8981–8984, 8990 pred 2 s), alebo majú v skle odraz človeka (IMG_8993 pred 2,2 s),
preto vstup nemá klip.

**Ľudia:** klip IMG_8993 (vchod) má počas prvých asi 2,2 s v skle dverí odraz človeka,
ktorý natáčal, preto sa používa až od 2,7 s (všetkých 25 snímok klipu skontrolovaných, bez
osôb). Klip IMG_8995 (odraz osoby v zrkadle) sa nepoužíva vôbec. Vyradené fotky s jasne
odrazenými ľuďmi v zrkadlách: ae931f9a, b0ed9981, 67413462, e77dd2bd, de7727af, 0031fb81.
Na použitých fotkách sú nanajvýš drobné, neidentifikovateľné odrazy; sklo dverí (snímka
IMG_8990) a presklená stena na fotke f3cad8ed boli skontrolované v plnom rozlíšení.

### Zastávky (30, v poradí chôdze)

| # | id | zóna | zdroj |
|---|---|---|---|
| 01 | terasa-1 (video) | terasa | IMG_8989 od 0,1 s |
| 02 | vstup-1 | vstup | IMG_8990, snímka 2,1 s (dvere zvonku) |
| 03 | recepcia-1 (video) | recepcia | IMG_8993 od 2,7 s do konca (0,8 s, bez opakovania) |
| 04–09 | hlavna-sala-1, -2, -4, -5, -3, -6 | hlavná sála | ded57978, 9a523572, 1a601891, 82585127, e604ab34, 81d98737 |
| 10–13 | stroje-4, -1, -2, -3 | sála so strojmi | 4c899013, 50b58cdb, 30d967db, 31539524 |
| 14–16 | kardio-3, -1, -2 | kardio | 7729db43, ca5cd7a4, 39186e4d |
| 17–19 | volne-vahy-1, -2, -3 | voľné váhy | ea0dcc02, 750d9d90, b57b28e1 |
| 20 | jednorucky-1 | jednoručky | 4a8527d5 |
| 21–27 | funkcna-zona-4, -1, -2, -5, -3, -6, -7 | funkčná zóna | a08cf80a, 335ed77e, 751e5e8a, 101780bb, f3cad8ed, 92861a6f, 4f66d594 |
| 28–30 | tatami-1, -2, -3 | tatami | 38aed571, f56a3d44, b95c2f9e |

Ostrosť (Laplacián pri 1000 px) je pri fotkách 635 až 1589. Pod prahom 350 sú len tatami-1
(232) a tatami-2 (278): miestnosť je plochá biela, všetkých šesť fotiek tatami meria 152 až
411, tieto sú jediné široké pohľady. Snímky z videí: terasa 448, vstup 606, recepcia 695.
Pôvodný klip vstupu (IMG_8990 od 0,9 s, snímka 224, tvrdý strih na IMG_8993) a klip dráhy
(IMG_8998, dvojitý obraz lavice) boli nahradené: vstup ostrou snímkou dverí, dráha fotkou
f3cad8ed (1183). Pri 540 px merajú nové zábery 1143 / 1092 / 1926 oproti 1800 pri ostatných
fotkách a 330 pri starom vstupe; snímky klipu recepcie 699 až 1126.

`assets/tour-data.json` (verzia 2) je jediný zdroj údajov: zóny s opisom (`blurb`), zastávky
s poradím, názvom, alt textom, bodom záujmu (`focus`), bodmi s popiskom (`pins`), bodom
chôdze (`walk`) a odkazom na ďalšiu zastávku (`hotspot`, `next`), plus `zonesLayout`
(10 obdĺžnikov v mriežke 100 × 100, „schéma zón, nie pôdorys“).

`media/og.jpg` (1200 × 630) je výrez z ostrej snímky terasy (`tour-terasa-1-2160.jpg`).

## 3. Štruktúra stránky

1. **Úvod = zastávka 01 (terasa).** Ostrá snímka na celú obrazovku, po nej sa (ak to
   prehliadač dovolí) prehrá klip terasy bez zvuku. Kompaktná lišta (logo, Prehliadka,
   Kontakt), jeden `h1` „GYM KLUB · prechádzka fitkom“, riadok s adresou a tlačidlo
   „Vstúpiť“, ktoré prejde k videu vchodu. Žiadna načítavacia obrazovka, nič nezávisí od
   automatického prehrávania.
2. **Prechádzka (celá stránka).** Lepiaca sa scéna na celú obrazovku; výška sekcie je
   30 zastávok × 85 % výšky okna, poloha skrolovania vyberá zastávku (dopredu aj dozadu,
   rovnako po obnovení stránky aj z priameho odkazu `#id-zastavky`). Kliknutia (disk,
   šípky, pás, zoznam) len nastavia polohu skrolovania, takže existuje jediný stav.
   - Každá zastávka: ostrý záber pokrývajúci okno so stredom v bode záujmu (srcset 1932/1280
     alebo 2160/1280 px, `decoding="async"`, nikdy rozmazaný), nasledujúca zastávka sa
     načítava dopredu. Na šírku sa záber zväčší až o 18 % (nikdy nad natívne rozlíšenie
     v CSS px), aby mal vodorovný ťah priestor; úvodný obrázok dostane rovnaké zväčšenie.
   - Rozhliadanie: ťahanie myšou (oboma smermi, so zotrvačnosťou) alebo prstom vodorovne;
     zvislý ťah prstom je presne jeden krok na ďalšiu/predchádzajúcu zastávku (žiadne
     zotrvačné preskakovanie); jemné priblíženie 1 až 1,25× štipnutím, kolieskom s Ctrl
     alebo dvojklikom; na dotykových zariadeniach tlačidlo „Povoliť pohyb“ (naklonenie
     telefónu, na iOS s vyžiadaním súhlasu); jemná paralaxa rozhrania voči obrazu.
   - Videozastávky (01, 03): `muted`, `playsinline`, zdroje sa priradia až aktívnej
     a nasledujúcej zastávke, hrá len aktívna, do prehrania je vidno ostrú snímku; terasa sa
     opakuje, krátky klip recepcie sa prehrá raz a ostane na poslednej snímke; pri Save-Data
     a obmedzenom pohybe sa videá nespúšťajú (ostáva snímka).
   - Prechod = krok: aktuálny záber sa zväčší 1,0 → 1,28 smerom k disku chôdze a zároveň
     mizne, nasledujúci sa usadí z 1,08 na 1,0 (650 ms). Krok späť zmenšuje. Pri obmedzenom
     pohybe je to prelínanie (350 ms).
   - Rozhranie: vľavo hore zóna, názov zastávky a počítadlo; vpravo hore kompas (otáča sa
     podľa vodorovného rozhliadania, kde záber nemá vodorovný priestor, podľa zvislého)
     a celá obrazovka; v obraze body s popiskom (tlačidlá, popis pri prejdení, zameraní
     alebo ťuknutí; bod mimo okna nie je v poradí klávesu Tab, kým sa naň nerozhliadne)
     a disk chôdze so šípkou a popisom
     „Ďalej: …“ / „Do hlavnej sály“ (na poslednej zastávke „Koniec prechádzky“, vedie na
     parametre); dole vľavo minimapa zo `zonesLayout` s popisom „schéma zón“, pás zón
     s náhľadmi všetkých zastávok (aktuálna zvýraznená, posúvateľný), šípky späť/ďalej
     a „Zoznam zón“ (dialóg so všetkými zónami a zastávkami, slúži aj čítačkám). Klávesy
     ←/→, ↑/↓, PageUp/PageDown, Home/End. Odkaz „Preskočiť na kontakt“ na začiatku.
   - Disk chôdze sa drží v okne (na šírku býva podlaha pod dolným okrajom), body ostávajú
     na svojich miestach a možno ich nájsť rozhliadaním. Po kroku z klávesnice prechádza
     zameranie na disk novej zastávky.
3. **Po prechádzke:** „Parametre priestoru“ (adresa, zóny, klimatizácia áno, tréningy,
   kontakt) so statickou schémou zón; „Otváracie hodiny a cenník“ (zverejní sa po potvrdení
   prevádzkou; telefón, e-mail); „Dohodnite si prehliadku naživo“ (Zavolať, Napísať e-mail,
   Navigovať) s mapou načítanou až po kliknutí; pätička s odkazom na klasickú verziu.

Bez JavaScriptu sa namiesto scény zobrazí úvod s obrázkom terasy a pod ním zoznam všetkých
zón a 30 zastávok ako `figure` s obrázkom a popisom (vygenerované z `tour-data.json`,
v `index.html` medzi značkami `zoznam:start` a `zoznam:end`; pri zmene údajov treba tento
zoznam upraviť rovnako). Pri načítaní s JavaScriptom sa zoznam odstráni a nahradia ho
značky zastávok (`#id`) a dialóg so zoznamom.

## 4. Umelecký smer

- Skutočné zábery bez úprav, ostré. Tmavé, tenké, priesvitné rozhranie v štýle prehliadky
  nehnuteľnosti; akcent je jedna zelená (`#c6f24a`) z rámov strojov (aktuálna zóna, disk,
  hlavné tlačidlo, zvýraznené slová).
- Písmo: Bebas Neue na nadpisy, Manrope na text, obe lokálne (`../assets/fonts.css`),
  so slovenskou diakritikou.
- Texty krátke a vecné, bez superlatívov. Opisy vychádzajú z toho, čo je vidno na záberoch.
  Schéma zón je označená ako schéma, nie pôdorys.

## 5. Technické riešenie

- Čisté HTML, CSS a JS (`index.html`, `assets/style.css`, `assets/tour.js`,
  `assets/tour-data.json`), bez knižníc, bez zostavovania, bez cudzích požiadaviek
  (mapa až po kliknutí). Jeden `h1`, nadpisy sekcií, tabuľka parametrov, `dialog` pre
  zoznam, ciele dotyku aspoň 44 px, viditeľné zameranie.
- V pamäti sú naraz najviac tri zábery (predchádzajúci, aktuálny, nasledujúci); pri rýchlom
  skrolovaní sa predbehnuté zastávky uvoľnia hneď pri ďalšom kroku, prechod pokračuje vždy
  z toho záberu, ktorý je práve vidno. Pri skrytej karte sa video zastaví.
- Krok skrolovania sa počíta zo stabilnej výšky okna a prepočíta sa len pri otočení alebo
  veľkej zmene, aby skrývanie adresného riadka na mobile neposúvalo zastávky.
- Scéna a počas prechádzky aj horná lišta majú `touch-action: none` (pás zón `pan-x`):
  zvislý ťah prstom aspoň 40 px je jeden krok (na poslednej zastávke vedie na parametre),
  vodorovný rozhliada; zotrvačné skrolovanie telefónu teda nemôže preskočiť zastávku. Švih
  môže začať aj na bode alebo disku (ťuknutie ostáva kliknutím), nie na spodnej lište ani
  na odkazoch. Myš rozhliada len v zábere, koliesko skroluje.
  Dekoratívne časti disku nezachytávajú ukazovateľ (naklonený 3D kruh by inak zachytával
  kliknutia mimo seba).

## 6. Kontroly (28. 9. 2026)

Prehliadač: Chromium (Playwright). Na fyzickom zariadení ani v Safari či Firefoxe testované
**nebolo**.

- 1440 × 900 a 390 × 844 (dotyk): úvod, „Vstúpiť“ → dvere, ťahanie myšou aj dotykom (posun
  obrazu, otočenie kompasu), disk chôdze, body s popiskom, klávesy →/↓/←/End, skok v páse
  zón, koliesko, priblíženie kolieskom s Ctrl, dialóg „Zoznam zón“ a skok z neho, videá 01
  a 03 (recepcia sa prehrá raz, 0,8 s, a ostane stáť), posledná zastávka a disk na parametre,
  návrat hore (úvod sa vráti).
- Ostrosť: všetkých 30 zastávok sa na 1440 × 900, 1280 × 800 a 1024 × 768 (1×) kreslí
  v natívnom alebo menšom rozlíšení (žiadne zväčšovanie); nové zábery 02, 03, 25 merajú pri
  540 px 1143 / 1092 / 1926 (fotky 1800, starý vstup 330).
- Rozhliadanie na šírku: pri 1440 a 1280 px má vodorovný ťah 230 až 260 px priestoru
  a kompas sa otáča (−45° na okraji); pri 1920 px (1×) záber ostáva v natívnom rozlíšení,
  vodorovný priestor je 12 px a kompas ide podľa zvislého ťahu.
- Telefón: rýchly zvislý švih z úvodu → 02, ďalší → 03, švih nadol → 02, pohyb pod 40 px
  nič, švih na páse zón, na tlačidlách dole a z hornej lišty nič, švih z disku alebo bodu
  jeden krok (ťuknutie na disk/bod ďalej kliká), švih na poslednej zastávke → parametre,
  vodorovný ťah posúva obraz bez zmeny zastávky; každý švih presne jedna zastávka.
- Klávesnica: po priamom odkaze `#vstup-1` ide Tab celá obrazovka → viditeľný bod → disk →
  pás zón; body mimo okna (na 1440 × 900 napr. „Nápis GYM KLUB & caffee“, tatami-2,
  funkcna-zona-6, stroje-3) sa preskakujú a poloha skrolovania sa nemení; po kroku šípkou
  z disku je zameranie na novom disku.
- Zábery v pamäti: 12 rýchlych krokov kolieskom → hneď 3 zábery, po usadení 3; Home
  s plynulým skrolovaním z konca → 2; celá prechádzka šípkami najviac 3.
- Priamy odkaz `#stroje-2` a obnovenie stránky: rovnaká zastávka, rovnaká poloha.
- Obmedzený pohyb: prelínanie, bez zotrvačnosti, videá stoja.
- Bez JavaScriptu: úvod (bez zväčšenia) a zoznam 30 zastávok, jeden `h1`.
- Šírky 320, 768, 1024, 1920 (aj spodok stránky): bez vodorovného posúvania.
- Konzola bez chýb a varovaní, žiadne požiadavky mimo lokálneho servera; všetkých 275
  súborov v `media/` je použitých (plagáty `tour-*-poster.*`, ktoré sa nikdy nenačítali,
  boli zmazané) a žiadny odkazovaný nechýba.
- Snímky obrazovky sú v pracovnom priečinku relácie (`scratchpad/g4/shots/`), nie
  v repozitári.

## 7. Obmedzenia

- Nie sú to skutočné 360° panorámy: rozhliadanie je posun v rámci jedného ostrého záberu
  na výšku. Na obrazovke 1440 × 900 je naraz vidno asi 40 % výšky fotky (30 % pri snímkach
  z videa). Skutočné panorámy (360° kamera alebo séria záberov na statíve) by prehliadku
  výrazne zlepšili.
- Rozlíšenie zdrojov: fotky majú 1932 px na šírku. Na okne širokom 1920 CSS px (1×) sa
  kreslia 1 : 1, takže vodorovný ťah nemá priestor (kompas ide podľa zvislého). Na 2×
  displejoch (Retina, napr. 1920 × 1080 @ 2× = 3840 zariadenia px) sa fotky zväčšujú až
  2×, čo je limit zdroja, nie kódu. Originály v plnom rozlíšení (3024 × 4032) od klienta
  by umožnili pridať stupeň 2560 až 3024 px pre 2× monitory.
- Videá sú len dva krátke ručne natáčané klipy (terasa 2,7 s, recepcia 0,8 s); dvere zvonku
  a šprintérska dráha sú fotky, lebo ich klipy boli mäkké alebo s odrazom osoby.
- Zastávky tatami sú mäkšie než ostatné (biela plochá miestnosť).
- Dvere a recepcia existujú len ako snímky z videa (2160 px); poradie a susednosť zón sú
  prevzaté zo zadania, schéma nie je pôdorys.
- Testované len softvérovo v Chromium; treba overiť na iPhone (Safari, „Povoliť pohyb“),
  Androide a v Safari na Macu.
- Otváracie hodiny, cenník, platby a tréneri zámerne chýbajú, kým ich prevádzka nepotvrdí.
