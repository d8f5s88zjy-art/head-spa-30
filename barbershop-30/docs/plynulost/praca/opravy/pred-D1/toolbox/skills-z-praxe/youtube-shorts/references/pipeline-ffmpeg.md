# Skripty: short.py, strihy.sh, schvalenie.py (a doplnky z 2026-10-19)

Tri základné skripty skillu `youtube-shorts`; doplnky z rozborov V4 až V10 (`titulok_16x9.py`,
`strih_podla_referencie.py`, `tvrdenia.py`, štítky v `short.py`) sú v časti „Doplnky 2026-10-19“ na konci. Všetky bežia bez siete, nič neuverejňujú a nikam sa neprihlasujú.
Stavané a overené 2026-10-17 na ffmpeg 7.0.2 (statická zostava s libzimg, libass 0.17.3, libx264), Python 3,
Pillow, fontTools, numpy. ffprobe netreba, skripty čítajú výpis `ffmpeg -i`.

## short.py: od záberov po súbor na nahratie

```bash
S=toolbox/skills-z-praxe/youtube-shorts/scripts
python3 -I $S/short.py strih.json                 # celý short, kontrola, test synchronizácie, náhľad so zónami
python3 -I $S/short.py strih.json --len-titulky   # len titulky.ass a titulky.srt (doladenie časov), vypíše dĺžku
python3 -I $S/short.py hotovy.mp4 --kontrola      # kontrola ľubovoľného MP4 proti odporúčaniam YouTube
python3 -I $S/short.py --test-sync [priečinok]    # synchronizácia obrazu a zvuku pri nastaveniach exportu
```

Výstup: `<vystup>.mp4`, `<vystup>-kontrola.json`, `<vystup>-nahlad.jpg` (snímky s červenou zónou YouTube a modrým
pásom titulkov) a pracovný priečinok `<vystup>-prac/` (medzisúbory záberov, `zmes.wav`, `titulky.ass`,
`titulky.srt`, kópia písma). Nič z toho sa necommituje. Návratový kód 0 = všetkých 11 bodov kontroly a
synchronizácia v poriadku, 1 = niečo nesedí (pozri `-kontrola.json`) alebo chyba vstupu.

### Čo robí, krok za krokom

| Krok | Čo | Ako (ffmpeg) | Prečo takto |
| --- | --- | --- | --- |
| 1 | zábery | `-ss od -t dĺžka` pred `-i`, otočenie podľa telefónu robí ffmpeg sám | presný strih pri prekódovaní, rýchle hľadanie |
| 1 | orez 9:16 | `crop` okolo bodu `stred` (0 až 1), potom zmenšenie na 1080×1920 | YouTube radí nepridávať čierne pásy (answer/6375112) |
| 1 | HLG na SDR | `zscale=w=1080:h=1920` (ešte v HLG), `zscale=t=linear:npl=203`, `tonemap=hable:desat=0:peak=4`, `zscale=t=bt709:m=bt709:r=tv` | reťazec z renderu reelu GYM KLUB (`reel/tonemap.sh`); zmenšenie pred tónovaním je 1,7× rýchlejšie, rozdiel priemerne 1,65 z 255 |
| 1 | PQ na SDR | to isté s `npl=100` bez `peak` | bežný recept, na našich záberoch neoverený (iPhone točí HLG) |
| 1 | rýchlosť | `setpts=(PTS-STARTPTS)/r`, zvuk `atempo` | spomalenie 60 fps záberu (0,8×) ostane plynulé |
| 1 | priblíženie | `perspective` s `eval=frame`, `interpolation=cubic`, nábeh a dobeh | presnosť pod pixel; `crop` alebo `zoompan` posúvajú po celých pixeloch a pri pomalom nájazde trasú |
| 1 | snímky | `fps=30`, `tpad` (rezerva), `-frames:v N` | každý záber má presne N snímok, strih sedí na snímku |
| 2 | strih | `concat` (strih) alebo `xfade` + `acrossfade` (`prelinanie`, `cez_ciernu`, `cez_bielu`) | pred `xfade` treba `fps=30`, výstup `concat` nemá stálu frekvenciu a `xfade` ho odmietne |
| 3 | titulky | `ass` z vygenerovaného `titulky.ass`, písmo z priečinka `pisma/` | slovo po slove: každé slovo je udalosť s celou frázou, aktuálne slovo inou farbou (`\1c&HBBGGRR&`); štýl `karaoke` cez `\k` |
| 3 | podklad titulkov | `BorderStyle 4` (jeden obdĺžnik pod frázou), obrys priehľadný | `BorderStyle 3` kreslí box pod každý úsek zvlášť, pri krytí 85 % sú prekryvy tmavšie pruhy |
| 4 | zvuk | zvuk záberov (`klipy_db`) + hudba (`hudba.db`, nábeh, dobeh), `amix normalize=0` | na strihoch nábeh a dobeh 15 ms, žiadne lupnutia |
| 4 | hlasitosť | meranie `ebur128=peak=true`, lineárne zosilnenie na -14 LUFS; ak by špička prekročila strop, limiter na 4× vzorkovaní (192 kHz) a doladenie | `loudnorm` meral na 8 s zmesi o 0,5 LU tichšie než `ebur128` a pri prekročení špičky prešiel do dynamického režimu |
| 4 | rezerva na AAC | špička pred kódovaním -2 dBTP (`rezerva_aac_db` 1,0) | AAC v skúške zdvihol skutočnú špičku o 0,5 až 1,0 dB |
| 5 | export | H.264 High, CRF 18, `maxrate 16M`, `bufsize 32M`, `-g 15`, `-bf 2`, `+cgop`, 4:2:0, značky BT.709, 30 fps CFR; AAC-LC 384 kb/s, 48 kHz stereo | answer/1722171: uzavretý GOP s polovicou snímkovej frekvencie, 2 B-snímky, AAC-LC 48 kHz, stereo 384 kb/s |
| 5 | kontajner | `+faststart`, bez edit listu (`-use_editlist 0`, `+negative_cts_offsets`), odstrihnutých prvých 1024 vzoriek zmesi | YouTube: „No Edit Lists“ a moov na začiatku; bez kompenzácie by zvuk predbiehal obraz o 42,7 ms |
| 5 | metadáta | `-map_metadata -1`, `-map_chapters -1` | zo zdroja z iPhonu ide preč model, softvér, dátum a prípadná poloha |
| 6 | kontrola | boxy MP4, kódek, farby, GOP a B-snímky (`showinfo`), EBU R128, dĺžka a pomer strán | 11 bodov, `-kontrola.json` |

### Formát EDL (JSON)

Vzor: `../assets/strih-priklad.json`. Cesty sú relatívne k súboru EDL.

| Pole | Význam |
| --- | --- |
| `vystup` | cesta k výslednému MP4 (predvolené `short.mp4`) |
| `fps` | snímková frekvencia výsledku (predvolené 30) |
| `klipy[].zdroj` | video z telefónu alebo klip; obrázok najprv preveď na klip (nižšie) |
| `klipy[].od`, `do` | úsek v čase zdroja v sekundách; bez `do` do konca súboru |
| `klipy[].rychlost` | 0,8 = spomalenie; zvuk sa spomalí cez `atempo` |
| `klipy[].stred` | `[x, y]` 0 až 1, okolo čoho sa reže 9:16 (predvolene stred) |
| `klipy[].zoom`, `zoom_stred` | plynulé priblíženie `[od, do]`, napr. `[1.0, 1.06]` |
| `klipy[].prechod` | k záberu, pred ktorým je: `{"typ": "strih" \| "prelinanie" \| "cez_ciernu" \| "cez_bielu", "dlzka": 0.25}`; prelínanie skracuje short o svoju dĺžku |
| `klipy[].zvuk` | `false` vypne zvuk záberu (napr. hlasy cudzích ľudí v pozadí) |
| `titulky.pismo` | TTF s celou diakritikou (`../assets/pisma/ManropeTitulky-700.ttf`) |
| `titulky.styl` | `aktualne` (zvýraznené práve vyslovené slovo), `karaoke` (slová sa postupne zafarbujú), `bez` (celá fráza naraz) |
| `titulky.velkost`, `farba`, `zvyraznenie`, `podklad`, `podklad_kryt` | 76 px, #FFFFFF, akcent značky, #161616, 0,85 |
| `titulky.podklad_tvar` | `jeden` (BorderStyle 4, libass 0.17 a novší) alebo `po_usekoch` (BorderStyle 3; vtedy krytie 1.0) |
| `titulky.spodok`, `okraj` | spodný okraj podkladu (1240 px), ľavý a pravý okraj (195 px, text najviac 690 px) |
| `titulky.frazy[]` | `{"od", "do", "text"}` v čase shortu; voliteľne `"slova": [[od, do, "slovo"], …]` pri hovorenom shorte |
| `titulky.stitky[]` | štítky hore (od 2026-10-19): `{"od", "do", "text"}`, napr. „NEPOTVRDENÉ · stav k 22. 8. 2026“ alebo „Zdroj: …“; do `titulky.srt` nejdú |
| `titulky.stitok` | vzhľad štítkov: `{"velkost": 44, "hore": 312, "podklad": "#F2C14E", "podklad_kryt": 0.95, "farba": "#161616", "okraj_boxu": 14}` (predvolené); `hore` = horný okraj podkladu v px, pod 288 px a pri šírke nad 840 px skript upozorní |
| `zvuk.klipy_db`, `zvuk.hudba` | hlasitosť zvuku záberov; hudba `{"zdroj", "od", "db", "nabeh", "dobeh"}` |
| `zvuk.lufs`, `true_peak`, `rezerva_aac_db`, `metoda` | -14, -1.0, 1.0, `ebur128` (alebo `loudnorm`) |
| `export` | `crf`, `maxrate`, `bufsize`, `preset`, `audio_kbps`, `gop`, `bez_editlistu` (predvolene `true`) |
| `nahlad_casy` | časy snímok do náhľadu (predvolene 10, 40, 70 a 95 % dĺžky) |

- Skript vypíše začiatky záberov vo výsledku (napr. `0.00, 3.30, 5.05, 7.65 s`); podľa nich sa píšu titulky.
- Bez prepisu reči skript odhadne časy slov podľa ich dĺžky a upozorní na to. Pri reči zadaj `slova` ručne.
- Upozorní aj na frázu širšiu ako dva riadky po 690 px (odhad šírky sedí asi na ±5 %) a na frázu za koncom videa.
- Písmo musí mať celú slovenskú diakritiku v jednom súbore. Webové písma rozdelené na `latin` a `latin-ext`
  polovicu nemajú a libass potichu siahne po inom písme; skript hlási každé `Glyph … not found` a náhradu písma.
- Karta z obrázka (číslo, adresa na konci): obrázok 1080×1920, potom
  `ffmpeg -loop 1 -i karta.png -t 1.8 -r 30 -pix_fmt yuv420p -c:v libx264 karta.mp4` a klip do EDL bez `od` a `do`.

## Skúšky 2026-10-17

Všetky výstupy sú v scratchpade relácie (`shorts-nauka/youtube/test/` a `shorts-nauka/zapis-test/`), necommitujú sa.
Zábery GYM KLUB z úsekov bez ľudí a odrazov, hudba vlastná (syntéza z renderu reelu), texty len skúšobné.

| Skúška | Vstup | Výsledok |
| --- | --- | --- |
| A (rozbor YouTube) | 3 klipy SDR 1080×1920 bez zvuku, prelínanie, priblíženie 1,00 až 1,06, spomalenie 0,8× | 7,97 s, 239 snímok, 17,8 MB; -16,1 až -14,0 LUFS, -2,1 dBTP; 11/11; sync +2,7 ms; 42 s behu |
| B (rozbor YouTube) | tie isté zábery z originálov iPhonu (HEVC 10 bit, HLG BT.2020, Dolby Vision 8.4, 3840×2160 otočené, AAC) | to isté, -1,8 dBTP; 11/11; 57 s behu; od A sa líši priemerne o 1,8 až 2,5 z 255 |
| C (zápis do toolboxu) | 4 zábery: 3 SDR a 1 originál HLG so zvukom prostredia, spomalenie, priblíženie, prelínanie 0,25 s, cez čiernu 0,3 s, 5 fráz (jedna s ručnými časmi slov), hudba | 9,17 s, 275 snímok, 20,3 MB, 17,4 Mb/s; zmes -16,3 LUFS a -1,0 dBTP, limiter, výsledok -14,0 LUFS a -2,1 dBTP; 11/11; sync +2,7 ms; 54 s behu; náhľad: titulky v páse, diakritika ďťňľ ôäé úíý ŕĺ bez náhrady písma |
| D (zápis do toolboxu) | záber SDR + karta z PNG (príkaz vyššie), cez bielu 0,2 s, titulky `karaoke`, `metoda: loudnorm`, `bez_editlistu: false` | 3,60 s; loudnorm prešiel do dynamického režimu, výsledok -14,4 LUFS a -1,0 dBTP; 11/11 (edit list zámerne ponechaný); sync +2,7 ms |
| `--kontrola` | staršie `gymklub-reel-v1.mp4` | 7/11: edit list, GOP 109, 3 B-snímky za sebou, -16,2 LUFS; kód 1 |
| zlý EDL | `do` 99 s pri 2,77 s zábere | „úsek 0.1 až 99 s mimo dĺžky 2.77 s“, kód 1 |
| `--len-titulky` | `../assets/strih-priklad.json` s písmom vedľa | titulky.ass a .srt, dĺžka 7,95 s, kód 0 |

- Naivný prevod HLG bez tónovania (len `scale` do BT.709) má o 38 % nižšiu sýtosť (16,5 oproti 26,7) a vyšší jas.
- Zdroj z iPhonu niesol `com.apple.quicktime.make/model/software/creationdate`; výstup len značky kodéra.
- Synchronizácia (záblesk a pípnutie v 1,0 s): edit list +2,7 ms; bez edit listu -42,7 ms (B-snímky mínus 1024
  vzoriek AAC); `+negative_cts_offsets` +24,0 ms; s odstrihnutím 1024 vzoriek +2,7 ms. Zdroj sám meria +2,7 ms
  (prah detekcie tónu), preto je to správny výsledok.
- `loudnorm` je pre krátke zmesi menej presný ako `ebur128`; predvolená metóda ostáva `ebur128`.
- Nezávislá recenzia 2026-10-17 (5 záberov, 2 originály HLG so zvukom, 11,6 s): 11/11, -14,0 LUFS (`ebur128` aj
  `loudnorm` meranie -14,2), sync +2,7 ms. Opravené: upozornenie na priširokú frázu mlčalo, keď EDL nemal
  `titulky.velkost`; návratový kód 1 teraz aj pri zlyhanom teste synchronizácie; `--kontrola` bez súboru vráti 2.
  Natívny kodér AAC dal pri jednoduchej zmesi 240 až 345 kb/s namiesto žiadaných 384 (kontrola to nemeria).

## strihy.sh: strihy a hustota záberov

```bash
bash $S/strihy.sh video.mp4 [priečinok] [--prah 0.25] [--zlucit 0.3] [--okno 5] [--harok]
```

Výstup (predvolene `<meno>-strihy/` vedľa videa): `detekcie.txt` (čas a skóre každej detekcie), `zabery.csv`
(`číslo;od;do;dĺžka`), `suhrn.txt` a voliteľne `harok.jpg` (prostredná snímka každého záberu, 8 v riadku).
Kódy: 0 v poriadku, 1 video sa nedá prečítať alebo chýba ffmpeg, 2 zlé argumenty.

Overenie 2026-10-17 proti ručnému rozboru (`select='gt(scene,…)',showinfo`):

| Video | Prah | strihy.sh | Rozbor formátu |
| --- | --- | --- | --- |
| V1 (44,78 s) | 0,25 | 14 detekcií, 13 strihov: 3.67 4.43 8.23 9.43 17.13 18.93 20.43 21.33 22.53 25.00 33.07 34.83 41.93 | tie isté časy (+ detekcia 0,03 s, ktorú skript nepočíta) |
| V1 | 0,12 | 19 detekcií, 18 strihov, prvá zmena 1,43 s | 19 detekcií; ručne 23 záberov, prvá zmena 1,43 s |
| V2 (54,22 s) | 0,25 | 36 detekcií, 22 udalostí po zlúčení do 0,3 s, medián 2,03 s | 36 detekcií, 23 udalostí; ručne 27 záberov, medián 1,57 s |
| V3 (97,58 s) | 0,25 | 10 strihov: 9.60 13.27 14.27 15.90 19.47 21.57 52.73 64.60 67.07 83.53 | tie isté časy; ručne 14 záberov, 36 krokov |
| short C (9,17 s) | 0,12 | strihy 3,30 a 7,70 s; prelínanie v 5,05 s nenašiel | strihy v 3,30 a 7,65 s (cez čiernu 0,3 s) |

Rozdiel medzi skriptom a ručným rozborom je vždy na strane skriptu (menej záberov): zmenu len v časti obrazu,
prelínanie a krok v animácii ffmpeg pri celom obraze nevidí. Hárok preto treba pozrieť.

## schvalenie.py: majiteľ schvaľuje presný súbor

```bash
python3 -I $S/schvalenie.py zapis --kniha schvalenia.jsonl --kto "majiteľ" --ako "správa 17.10. 14:05" short.mp4 popis.txt
python3 -I $S/schvalenie.py over --kniha schvalenia.jsonl short.mp4 popis.txt
python3 -I $S/schvalenie.py zoznam --kniha schvalenia.jsonl
```

Zapisuje riadky JSON (čas, kto, ako, sha256 a veľkosť každého súboru). `over` vráti 0 len vtedy, keď je každý
súbor bajt po bajte schválený. Overené 2026-10-17: kópia schváleného videa prejde (SCHVÁLENÉ, kód 0), zmena
jedného znaku v popise dá NESCHVÁLENÉ a kód 1, chýbajúci súbor CHÝBA a kód 1, prázdne `--kto` kód 1, chýbajúce
`--kto` kód 2. Kniha patrí do scratchpadu alebo k súborom shortu, nie do repozitára (obsahuje mená a čas).
Myšlienka je z ECC, skill `operator-approval-loop` (github.com/affaan-m/ECC, MIT); kód je vlastný.

## Doplnky 2026-10-19 (z rozborov V4 až V10)

**Štítky hore v `short.py`** (V7, `titulky.stitky`): kreslia sa tým istým písmom ako titulky, vlastným štýlom
`Stitok` (zarovnanie hore na stred, jeden obdĺžnik pod textom), do `titulky.ass`. Viac štítkov naraz sa poukladá
pod seba. Farba podkladu: pri Barbershop 30 a GYM KLUB teplá žltá (#F2C14E) alebo akcent značky; pri HEAD SPA 30
tlmený tón webu, bez blikania. Štítok neprekrýva tvár ani pás titulkov 1040 až 1240 px. Skúška 2026-10-19
(syntetický záber testsrc2 6 s, 2 frázy a 2 štítky, výstupy v scratchpade `ref-nauka/zapis-test/stitky/`):
kontrola 11 z 11, synchronizácia +2,7 ms, diakritika („NEPOTVRDENÉ“) bez náhrady písma, štítky hore v zóne;
EDL bez štítkov dáva rovnaký `titulky.ass` ako pred zmenou (rozdiel len nepoužitý riadok `Style: Stitok`).

**`tvrdenia.py`** (V7): kontrola tvrdení scenára pred natáčaním a pred schválením. JSON (`--vzor` dá šablónu)
alebo voľný text (`--text`, rizikové riadky so značkou `[zdroj: …, RRRR-MM-DD]` alebo `[nepotvrdené: kto,
RRRR-MM-DD]`). Kontroluje stav (overené, pripísané, nepotvrdené, nepravdivé, názor), druh zdroja, dátum a vek
overenia (`max_vek_dni`, predvolene 7), číslo proti citátu a jednotke zo zdroja, štítok NEPOTVRDENÉ, superlatívy
a porovnania z fámy, otázky s tvrdením, zdravotné sľuby. Kód 0 bez chýb, 1 chyba, 2 zlé argumenty. Príklady
`../assets/tvrdenia/` (pri zápise znova: V7 ako ho povedal autor 12 chýb, správna verzia 0, test prevádzky 5,
textový režim 3; pyflakes bez nálezov). Len štandardná knižnica; nič neoveruje na webe, overenie robí človek.

**`titulok_16x9.py`** (V4): formát stály titulok + pás 16:9, recept a skúšky v [format-16x9.md](format-16x9.md).

**`strih_podla_referencie.py`** (V10): kostra EDL podľa rytmu strihov referencie a `--porovnaj`; postup,
nastavenia podľa značky a skúšky v [strih-podla-referencie.md](strih-podla-referencie.md).

## Čo skripty nerobia (zámerne)

- Neprepisujú reč (whisper tu nie je). Časy slov pri hovorenom shorte treba zadať.
- Nestabilizujú (`../../video-a-sekvencie/references/ffmpeg-prikazy.md`, vid.stab v dvoch prechodoch) a nerobia
  pohyb z fotiek ani karty s animovaným číslom (karta sa dá vložiť ako klip z obrázka).
- Nenahrávajú na YouTube a nič neuverejňujú. Negenerujú obraz ani hlas.

## Riziká a čo overiť pri prvom nahratí

- MP4 bez edit listu so zápornými posunmi CTS má značku `iso4`. Prehrávače aj ffmpeg ho čítajú správne; ako ho
  spracuje YouTube, overí prvé nahratie ako súkromné video. Ak by bol problém, `"bez_editlistu": false` vráti
  bežný MP4 s edit listom (synchronizácia je aj tak +2,7 ms, kontrola to vtedy berie ako zámer).
- Bitová rýchlosť okolo 17,5 Mb/s je nad odporúčaním 8 Mb/s pre 1080p30; YouTube píše, že limit netreba.
  60 s short bude mať asi 130 MB; na pomalom pripojení zníž `maxrate` na `12M`.
- Prevod PQ (HDR10 z Androidu) je bežný recept, na našich záberoch neoverený.
