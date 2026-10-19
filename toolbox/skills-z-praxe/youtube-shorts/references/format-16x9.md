# Formát „stály titulok + pás 16:9“ (z rozboru V4)

Odvodené z V4 (billyfx, God's Eye View, 66 s; merania 2026-10-17, rozbor v [anatomia-referencii.md](anatomia-referencii.md),
časť V4, a v `../../referencie-z-videi/references/naucene-z-videi.md`, záznam 11). Pravidlá praxe z `../SKILL.md`
platia ďalej: fakty len zo zdrojov prevádzky, súhlasy ľudí, titulky reči po celý čas reči, 30 až 45 s,
schvaľuje a uverejňuje majiteľ. Zapísané do toolboxu a znova overené 2026-10-19.

## Kedy tento formát

Na **recykláciu vodorovného materiálu** bez preklápania na výšku:

- nahrávky obrazovky webu (360° prehliadka, galéria, cesta k rezervácii bez osobných údajov), ktoré sú 16:9;
- vodorovné videá z fotoaparátu alebo staršie vodorovné videá prevádzky;
- úvod (prvých 30 až 45 s) dlhšieho vodorovného videa na YouTube, ako to s veľkou pravdepodobnosťou robí V4
  (short ako upútavka, prepojenie cez Related video, `youtube-fakty.md`, časť 7).

Zo zvislého klipu z telefónu formát zahodí 68 % obrazu (ostane 608 z 1920 riadkov), preto zvislé zábery strihaj
radšej na celú obrazovku podľa receptu v `../SKILL.md`. Skúšky nižšie sú zo zvislých klipov GYM KLUB len preto,
že vodorovné klipy prevádzok v podkladoch nie sú.

## Čo prevziať

| Z V4 (namerané) | U nás |
| --- | --- |
| Titulok 3 riadky, celých 66 s, 17 slov: čo, dôkaz, otvorená slučka | 3 riadky po najviac ~26 znakoch, celý short. Veta 1 čo to je, veta 2 overený fakt, veta 3 dôvod pozerať ďalej. Všetko zo zdroja (napr. HEAD SPA 30: „Nie umytie vlasov. / Rituál pre hlavu. / Začína teplou vodou.“ z nadpisu a podnadpisu v `index.html`, overené 2026-10-19) |
| Titulok je nadpis, nie prepis reči; reč nemá titulky | ak short má hlas, titulky reči ostávajú (naše pravidlo). Náš pás titulkov 1040 až 1240 px leží v dolnej tretine pásu 16:9; pridá ich `short.py` (skúška nižšie). Bez hlasu (len zvuk prevádzky) nesie správu titulok + písací stroj |
| Pás 656 až 1263, spodných 15 px v dolnom páse YouTube | pás **640 až 1247**: celý vnútri zóny Google, spodný čierny pás 1248 až 1919 je presne miesto pre názov a kanál |
| Pravých 192 px pásu je pod tlačidlami | dôležité veci v páse držať v x 48 až 888 (písací stroj vľavo, dôkaz v strede alebo vľavo) |
| Hook: 4 zábery za 3 s (0,67 až 0,87 s) pod jedným slovom, ktoré rastie („OPEN“ → „OPEN SOURCED“) | Barbershop 30 a GYM KLUB: 3 až 4 zábery po 0,7 až 0,9 s, slovo rastie („GYM“ → „GYM KLUB“). HEAD SPA 30: 2 zábery po 1,5 s, slovo len krytím |
| Reč od 0,1 s, hlas pred obrazom (J-strih 0,27 s), skokové strihy hlavy skryté záberom dôkazu | to isté pri hovoriacej hlave majiteľa alebo personálu (so súhlasom) |
| Písací stroj ~25 znakov/s v rytme reči, kurzor bliká ~2 Hz, verzálky s rozostupom | štítky zón, rituálov, služieb, najviac 3 až 4 slová; 20 až 25 znakov/s, HEAD SPA 30 ~12. Kurzor zúžený a vo farbe akcentu (plné „\|“ v Manrope sa číta ako „I“, chyba prvej skúšky). Na svetlom zábere tmavá žiara, nie biela |
| Dôkaz = snímka skutočnej stránky, jedno zvýraznenie, ostatné stlmené (rámik, žltý zvýrazňovač, rozmazanie, tma) | len **naše skutočné** dôkazy: hodnotenie a recenzie z vlastného profilu Google, počet rituálov z Booqme, rok otvorenia zo zdroja. Dátum snímky viditeľný, číslo overené v deň uverejnenia. Mená a fotky recenzentov rozmazať, ak nemáme súhlas |
| Short je upútavka na dlhé video: otázky = program dlhého videa, „So today…“, koncová karta s náhľadom | short môže viesť na dlhšie video kanála (napr. 2 až 4 min prehliadka prevádzky). Na YouTube cez **Related video** (support.google.com/youtube/answer/14075157); odkaz v popise Shorts klikateľný nie je (answer/13748639). Ak dlhé video nie je, výzva ostáva rezervácia |
| Basový podklad pod hlasom, efekty len na 3 až 4 prechodoch | podklad 18 až 22 dB pod hlasom (náš recept); úder len v hooku a pri koncovej karte. HEAD SPA 30 bez úderov |

## Čo neprevziať

- **Preklepy v stálom titulku** (V4: „Tending“, „Then then“ na očiach 66 s). Titulok prečítajú dvaja ľudia
  a kontroluje sa pravopis a diakritika pred napálením.
- Anglický titulok a anglicizmy; titulok musí sedieť s tým, čo short ukazuje.
- Cudzie videá, tváre a mená bez písomného súhlasu (V4: 10 s cudzích TikTokov).
- Zábery z Google Earth, Google 3D alebo nástrojov s Google podkladom: obsah Google Earth „may not be used for any
  commercial or promotional purposes“ (Google geo-guidelines, čítané 2026-10-17).
- Mém so zásahovou jednotkou, „FBI, open up!“, čierna obrazovka, farebné pruhy s tónom 1 kHz, záblesky.
- Napodobnené UI (animovaný kurzor klikajúci páči sa mi a Odoberať), štítky autority bez overenia.
- Takmer stojaci záber 8,34 s (otázky); u nás zmena do 3,5 s.
- 66 s dĺžka: u nás 30 až 45 s (nad 60 s riziko Content ID blokovania, `youtube-fakty.md`, časť 4).
- Glitch prechody pri HEAD SPA 30; pri Barbershop 30 a GYM KLUB najviac jeden.
- Hlasitosť -20,8 LUFS: náš cieľ ostáva -14 LUFS, špička -1 dBTP.

## Rozmery (1080×1920)

| Prvok | V4 namerané | Náš recept |
| --- | --- | --- |
| čierna hore | 0–655 | 0–639 |
| titulok | 3 riadky, horné okraje 428/490/552, rozostup 62, verzálka 37 px (~52 px písmo), šírka do 744 px | 3 riadky, spodky 450/520/590 (`\an2\pos(540,y)`), rozostup 70, Manrope 700 veľkosť ASS 68 = verzálka 36 px, šírka do 690 px (x 195–885) |
| medzera titulok → pás | 55 px | 50 px |
| pás 16:9 | 656–1263 (608 px) | **640–1247** (608 px) |
| písací stroj | verzálka 31 až 43 px, vedľa karty | ASS 60 = verzálka ~36 px, `\an7\pos(64,1100)`, rozostup +3; ak short má aj titulky reči (pás 1040–1240), písací stroj hore vľavo v páse, `\pos(64,684)` |
| kinetické slovo | ~135 px verzálky, na šírku pásu | Bebas Titulky 230, stred pásu (540, 944) |
| čierna dole | 1264–1919 | 1248–1919 (= dolná zóna YouTube) |
| čierna | RGB 0 | RGB 0 |

## Ako to vyrobiť

Text kreslí libass (filter `ass`), `drawtext` netreba. Písma sú v `../assets/pisma/`: `ManropeTitulky-700.ttf`
(Manrope 700, SIL OFL 1.1, `OFL.txt`) a pre kinetické slovo `BebasTitulky.ttf` (Bebas Neue, SIL OFL 1.1,
Copyright 2019 The Bebas Neue Project Authors, `OFL-Bebas.txt`; latin a latin-ext zlúčené do jedného súboru
a premenované, aby libass našiel slovenské znaky; písmená ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ veľké aj malé overené
cez fontTools 2026-10-19).

**1. Jedno vodorovné video + stály titulok** (šablóna `../assets/sablona-16x9.ass`; priečinok `pisma/` = kópia
`assets/pisma`):

```bash
ffmpeg -i vodorovne.mp4 -vf "fps=30,scale=1080:608:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:608,setsar=1,pad=1080:1920:0:640:black,ass=sablona-16x9.ass:fontsdir=pisma,format=yuv420p" -c:v libx264 -crf 18 -c:a aac -b:a 160k -movflags +faststart short-16x9.mp4
```

**2. Viac záberov, hook so slovom, písací stroj** (skript generuje ASS aj príkaz; vzor konfigurácie
`../assets/format-16x9-priklad.json`, relatívne cesty od konfigurácie, písma predvolene z `assets/pisma`):

```bash
S=toolbox/skills-z-praxe/youtube-shorts/scripts
python3 -I $S/titulok_16x9.py konfig.json             # MP4 s tichou stopou + rovnomenné .ass
python3 -I $S/titulok_16x9.py konfig.json --len-ass   # len ASS na kontrolu
```

Na jeden záber: `scale=1080:608:force_original_aspect_ratio=increase,crop=1080:608:(iw-1080)/2:(ih-608)*fy`
(fy 0 až 1 = poloha výrezu na výšku), voliteľne pomalé priblíženie `priblizenie` (zoompan na 2× väčšom vstupe,
menej skákania zaokrúhľovaním), potom `concat`, `pad=1080:1920:0:640:black`, `ass=…`. Písací stroj = jedna udalosť
ASS na znak, potom blikanie po 0,25 s; skrytý kurzor má `\alpha&HFF&`, aby text neposkakoval.

**3. Hudba, hlasitosť, titulky reči a kontrola:** výstup z kroku 1 alebo 2 daj ako jediný klip do EDL pre
`short.py` (pole `zvuk: false` pri tichej stope, `hudba` vlastná alebo licencovaná, `frazy` titulkov reči):

```json
{"vystup": "out/short.mp4", "fps": 30,
 "klipy": [{"zdroj": "out/short-16x9.mp4", "od": 0, "do": 11.2, "zvuk": false}],
 "titulky": {"pismo": "pisma/ManropeTitulky-700.ttf", "frazy": [{"od": 3.3, "do": 5.9, "text": "[fráza zo zdroja]"}]},
 "zvuk": {"hudba": {"zdroj": "hudba/podklad.wav", "od": 0, "db": 0}, "lufs": -14, "true_peak": -1.0}}
```

**4. Dôkaz zo snímky stránky** (V4: rámik, zvýrazňovač, rozmazané okolie, pomalé priblíženie; overené len
mechanicky na zástupnej snímke 2026-10-17):

```bash
ffmpeg -loop 1 -t 3 -i snimka.png -filter_complex "[0:v]scale=1080:608,split[a][b];[a]gblur=sigma=14[bl];[b]crop=W:H:X:Y[ost];[bl][ost]overlay=X:Y,drawbox=x=X-6:y=Y-6:w=W+12:h=H+12:color=0xE0262E@1:t=6,drawbox=x=…:y=…:w=…:h=…:color=0xFFE600@0.35:t=fill,scale=2160:1216,zoompan=z='1+0.06*on/90':d=1:x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':s=1080x608:fps=30,setsar=1,pad=1080:1920:0:640:black,format=yuv420p" -t 3 dokaz.mp4
```

Snímku stránky rob v rozlíšení aspoň 1920×1080; mená, fotky a kontakty iných ľudí rozmaž ešte pred strihom.

**Kontrola strihov na páse** (na celom obraze skóre scény zriedia čierne pásy a stály titulok):

```bash
ffmpeg -hide_banner -i short.mp4 -vf "crop=1080:608:0:640,select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
```

## Skúšky

**2026-10-17** (rozbor V4, nie na zverejnenie): klipy GYM KLUB (IMG_8990, 8986, 8996, 8998, 8984), hook 4 zábery
po 0,75 s so slovom „GYM“ → „GYM KLUB“, potom 3 zábery s písacím strojom „TERASA“, „SÁLA“ (priblíženie 5 %),
„KLIETKY NA DREP“. Skúšobný titulok „Toto je GYM KLUB v Nitre. / Terasa, sála aj klietky. / Pozri sa, kam ideš
cvičiť.“ (fakty GYM KLUB neoverené, len na skúšku). Prvá verzia: titulok 54 bol malý (verzálka 30 px) a kurzor
„|“ sa čítal ako „I“ („TERASAI“); opravené na 68 a zúžený farebný kurzor.

**2026-10-19** (pri zápise do toolboxu, z jeho umiestnenia; výstupy v scratchpade `ref-nauka/zapis-test/format-16x9/`):

- `titulok_16x9.py` s tou istou konfiguráciou: 11,2 s za 16 s; pás obsahu presne 640 až 1247, titulok riadky 399
  až 580 px; strihy na páse 0,77; 1,53; 2,30; 3,07; 6,07; 9,07 s (plán 0,75 … 9,0; +1 až 2 snímky zaokrúhlením);
  na celom obraze ten istý príkaz nenašiel **žiadny** strih, preto kontrola vždy s `crop`.
- Reťazenie do `short.py` (EDL s jedným klipom, hudba, dve frázy titulkov reči): kontrola 11 z 11, -14,1 LUFS,
  -1,9 dBTP, synchronizácia +2,7 ms. Písací stroj na `\pos(64,1100)` sa vodorovne dotýka titulkov reči v páse
  1040 až 1240: pri titulkoch reči ho daj hore (`y` 684), ako hovorí tabuľka rozmerov.
- Šablóna `sablona-16x9.ass` príkazom z kroku 1 na syntetickom zdroji 1920×1080: pás 640 až 1247, titulok 399 až
  586 px, libass našiel „Manrope Titulky“ bez náhrady písma, „TEPLÁ VODA“ s diakritikou.
- Vzor `format-16x9-priklad.json` so 5 klipmi: 8,5 s, 45 udalostí ASS. Chybné vstupy: bez argumentu a prázdna
  konfigurácia kód 2.

## Zdroje

- V4: tiktok.com/@billyfx/video/7683571519200578830 (stiahnuté 2026-10-17, `video.info.json`).
- Dlhé video: youtube.com/watch?v=o_FJ1NIH9yw, názov z YouTube oEmbed (2026-10-17).
- Related video v Shorts: support.google.com/youtube/answer/14075157; klikateľnosť odkazov:
  support.google.com/youtube/answer/13748639 (obe čítané 2026-10-17).
- Bezpečná zóna: Google Ads, support.google.com/google-ads/answer/9128498.
- Google geo-guidelines (Google Earth, Maps vo videách): about.google/brand-resource-center/products-and-services/geo-guidelines/
  (čítané 2026-10-17).
