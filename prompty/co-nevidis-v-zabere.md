# Prompt: „ČO NEVIDÍŠ V ZÁBERE“ – 30 s vertikálny dokumentárny short

Verzia 2 (19. 10. 2026), prispôsobená na náš toolbox, skills a pripojené nástroje. Faktické vety sú pracovné.
Pred výrobou ich musí potvrdiť krok 1.

---

## 0. Rola a tím

Pracuj ako vedúci produkcie s tímom rolí podľa `toolbox/skills-z-praxe/tim-roly`. Každá rola odovzdá výstup
ďalšej. Ďalší krok sa začne až po splnení brány.

| Rola | Zodpovedá za | Brána |
| --- | --- | --- |
| Editor faktov (štandardy spravodajstva) | každé tvrdenie, dátum, miesto, zdroj, rozlíšenie „žiada“ a „platí“ | každá veta má aspoň 2 nezávislé zdroje, inak sa prepíše alebo vypustí |
| Práva a označovanie | licencia každého záberu a hudby, označenie AI, pravidlá YouTube a AI Act | nič bez licencie, AI ilustrácia označená celý čas |
| Scenárista a režisér | koncept, oblúk napätie → pochopenie → dopad → poznanie, hook | scenár prejde `tvrdenia.py` bez nálezov |
| Kameraman (AI ilustrácia) | obrazový jazyk, kontinuita postavy, prompty | storyboard schválený pred generovaním |
| Strihač a zvukový dizajnér | strih podľa skutočnej dĺžky hlasu, zvuk, titulky | `short.py` 11/11 bodov |
| QA | čitateľnosť bez zvuku na telefóne, bezpečné zóny, hlasitosť, kontinuita | kontrolný zoznam v časti 9 |

Pracuj ako senior: najprv over, potom tvor. Každé rozhodnutie zdôvodni jednou vetou. Virálnosť nesľubuj.

## 1. Fakty (krok 1, pred akoukoľvek tvorbou)

1. Nájdi aktuálny stav udalostí vo Francúzsku k dátumu výroby. Použi WebSearch/WebFetch. Primárne zdroje sú
   Reuters a AP, ďalší nezávislý zdroj je napríklad AFP, Le Monde alebo France 24. Oficiálne opatrenia over
   priamo na webe vlády alebo prefektúry.
2. Pre každú vetu voiceoveru a každú kartu vyplň tabuľku: tvrdenie, zdroj 1, zdroj 2, dátum zverejnenia,
   miesto, istota, poznámka. Rozlišuj **požadované / navrhnuté** opatrenia od **platných / vyhlásených**.
   Rozlišuj aj **pokojný protest** od **násilia a rabovania** (iní ľudia, iné miesto, iný čas).
3. Pracovné vety nižšie sú hypotézy, nie fakty. Ak sa niečo nepotvrdí, prepíš vetu tak, aby zostal oblúk
   a dĺžka, alebo ju vypusti. Žiadne neoverené počty, príčiny ani obvinenia.
4. Scenár prežeň cez `toolbox/skills-z-praxe/youtube-shorts/scripts/tvrdenia.py`
   (`python3 -I tvrdenia.py scenar-tvrdenia.json --dnes RRRR-MM-DD`). Nepotvrdené veci dostanú štítok
   NEPOTVRDENÉ, alebo vypadnú.
5. Dej filmu Athena nepoužívaj ako vysvetlenie skutočných udalostí. Je len štýlovou referenciou. Jeho zábery,
   hudbu ani dialógy nepoužívaj.

## 2. Zámer a formát

- Názov: „ČO NEVIDÍŠ V ZÁBERE“. 30 s (±1 s), 9:16, 1080 × 1920, slovenský voiceover a titulky do obrazu.
  Video musí byť zrozumiteľné aj bez zvuku.
- Oblúk: napätie (0–3 s) → pochopenie (3–17 s) → ľudský dopad (17–24 s) → užitočné poznanie (24–30 s).
- Hook (pracovný): „Film sa skončí. Oni tu zostanú.“ Začni priamo scénou, bez loga a titulnej karty.
  Silu hooku over cez `toolbox/skills-z-praxe/instagram-salon/scripts/hook_skore.py`. Výsledok je len orientačný.

## 3. Pracovný voiceover (po kroku 1 aktualizuj)

```
Film sa skončí. Oni tu zostanú.
Vo Francúzsku ľudia protestovali proti drahému životu a podmienkam v školách.   ← overiť dôvody a dátum
Pokojný protest a rabovanie však nie sú to isté.
Vláda žiada miestne zákazy vychádzania.                                       ← overiť: žiada / platí / kde
Za rozbitými výkladmi zostávajú ľudia, ktorí tu musia žiť ďalej.
Jeden záber nie je celý príbeh.
Over dátum, miesto a zdroj.
```

Hlas má byť prirodzený, pokojný a empatický, s krátkymi pauzami.

- Prednosť má skutočný ľudský hlas, nahraný na telefón v tichej miestnosti. Pauzy uprav cez
  `instagram-salon/scripts/pauzy.py` a hlas vyčisti (napr. Adobe `media_enhance_speech`, ak je pripojené).
- Syntetický hlas (napr. Higgsfield `generate_audio` / `create_voice`) len so súhlasom majiteľa. Vtedy
  ho označ v popise a v YouTube Studio nastav AI use = Yes. Cudzí hlas nikdy neklonuj.
- **Zmeraj skutočnú dĺžku nahrávky** (`ffprobe`) a časy viet. Strih sa robí podľa hlasu, nie naopak.

## 4. Réžia po sekundách (doladiť podľa dĺžky hlasu)

| Čas | Obraz | Zvuk | Text v obraze |
| --- | --- | --- | --- |
| 0–3 s | AI ilustrácia: detail ruky obchodníka s kľúčom pri zatvorenej rolete, v skle odraz ulice, pomalý dolly hore k tvári (50 mm detail → 35 mm) | krátky kovový cvak, prejde do tlmeného pulzu | „FILM SA SKONČÍ.“ + štítok „AI ILUSTRÁCIA“ |
| 3–9 s | **overený záber pokojnej demonštrácie s licenciou**; inak faktická karta | pulz, hlas 2 | miesto · dátum · zdroj; „ŽIVOTNÉ NÁKLADY • ŠKOLY“ (len ak to potvrdí krok 1) |
| 9–13 s | **samostatný** overený záber násilia alebo následkov (rozbité výklady, bez zranených a bez tvárí); inak karta | tichšie, bez pridaných výstrelov a kriku | miesto · dátum · zdroj, iné ako v predošlom zábere |
| 13–17 s | čistá informačná karta o reakcii vlády | pulz ustupuje | presne „žiada“ alebo „platí“, kde, od kedy, zdroj |
| 17–24 s | návrat k obchodníkovi: rovnaká tvár, oblečenie, výklad a svetlo; pomalšie tempo | hudba ustupuje ruchu ulice | „AI ILUSTRÁCIA“ |
| 24–30 s | obchodník sa pozrie do ulice, roleta, posledný záber | hudba stíchne pred poslednou vetou | „DÁTUM. MIESTO. ZDROJ.“ aspoň 3 s, čitateľné |

Pravidlá strihu:
- Strih medzi 3–9 s a 9–13 s nesmie naznačovať, že ľudia z demonštrácie spáchali násilie. Medzi nimi je
  oddeľovač (karta alebo čierna 4–6 snímok s textom miesta) a iné miesto aj čas v popiske.
- Každý strih prinesie informáciu alebo emóciu. Bez glitch prechodov, prehnaného spomalenia a samoúčelných efektov.
- Rytmus strihu môže sledovať referenciu cez `youtube-shorts/scripts/strih_podla_referencie.py`. Referenciou je
  len rytmus, cudzí materiál nikdy nepoužívaj.

## 5. Reportážne zábery a práva

- Zábery Reuters a AP sú licencované. Bez licencie ich nepoužívame (ani z YouTube, TikToku či X). Platí
  `toolbox/skills-z-praxe/referencie-z-videi/references/stahovanie-a-pravo.md`.
- Možnosti v poradí:
  1. licencovaný záber (cena a podmienky predloží majiteľovi);
  2. voľne licencovaný záber s overenou licenciou a autorom (napr. Wikimedia Commons CC BY/BY-SA, uvedenie
     autora v popise);
  3. oficiálny materiál vlády alebo prefektúry s podmienkami použitia;
  4. **ilustrovaná esej**: AI ilustrácia obchodníka + faktické karty, bez reportážnych záberov.
- Pri každom zábere zapíš pôvod, autora, miesto, dátum nakrútenia, licenciu a odkaz. Archív označ dátumom
  priamo v obraze.

## 6. AI ilustrácia (len obchodník a jeho ulica)

Generovať sa smie **len fiktívny obchodník a jeho výklad**. Negeneruje sa demonštrácia, násilie, polícia,
politici, skutočné obchody, logá ani rozpoznateľné miesta, lebo by sa dali zameniť za skutočnosť. Štítok
„AI ILUSTRÁCIA“ je v obraze celý čas scény, v bezpečnej zóne a čitateľný.

Postup (Higgsfield cez pripojený server, alebo iný dostupný generátor):
1. `models_explore` (recommend) vyberie model obrazu a videa pre realistickú postavu a pomalý pohyb kamery.
2. **Kľúčový snímok postavy**: `generate_image` (portrét, celá postava, výklad) ako referencia kontinuity.
   Rovnaká referencia a seed sa použijú v každom klipe.
3. **Klipy**: `generate_video` z obrazu, jedna hlavná akcia a jeden pohyb kamery na klip, 3–6 s.
4. **Pred spustením** vyžiadaj cenu v kreditoch a súhlas majiteľa (`max_credits`). Bez súhlasu negeneruj.
5. Výsledky skontroluj po snímkach (ffmpeg, 2 snímky za sekundu, pozri si ich): ruky, tvár, oblečenie,
   architektúra, text v obraze. Chybný klip zahoď alebo pregeneruj, neopravuj ho zakrývaním.
6. Texty sa do obrazu pridávajú až pri strihu, nie v generovaní.

Šablóna anglického promptu (jeden na klip):
```
Subject: [same middle-aged shopkeeper, short dark hair with grey, navy work jacket over grey sweater,
          wedding ring, tired calm face]
Setting: [narrow street in a French city at dusk, closed metal roller shutter, shop window with reflection
          of the street, wet pavement, no readable signs or logos]
Composition: [eye-level, 35 mm feel (detail: 50 mm), subject on left third, shallow depth of field]
Light: [blue-grey ambient shadows, warm muted practical light from a street lamp, natural skin, subtle film grain]
Camera: [ONE move: slow dolly-in / slow tilt up from hand to face / static]
Action: [ONE action: turns the key in the shutter lock]
Duration: [4 s]
Negative: deformed hands, extra fingers, changing face, duplicated people, unstable architecture,
          plastic skin, readable text, logos, explosions, fire, police, crowds, video-game look, glitch
```

Pripraviť prompty: K1 ruka s kľúčom → tvár (0–3 s), K2 obchodník pred výkladom (17–21 s),
K3 pohľad do ulice (21–24 s), K4 posledný záber pri rolete (24–30 s).

## 7. Zvuk

- Hudba: vlastná (syntéza v Pythone ako `barbershop-30/source/tools/hudba.py` alebo `reel/synth.py`: nízky
  pulz, tlmené perkusie, atmosférická plocha) alebo licencovaná s dokladom. Pred záverečnou vetou stíšiť.
- Ruchy: kľúč, roleta a ulica z voľných knižníc s licenciou (napr. CC0) alebo vlastná nahrávka.
- Do autentických záznamov nepridávaj výstrely, krik ani iné zvuky, ktoré menia význam udalosti.
- Mix: hlas zrozumiteľný na telefóne, hudba pod hlasom -18 až -22 dB, výsledok -14 LUFS a true peak ≤ -1 dBTP
  (rieši `short.py`).

## 8. Strih, titulky a výstup

- Strih zapíš ako EDL JSON podľa `youtube-shorts/assets/strih-priklad.json` a urob ho cez
  `python3 -I youtube-shorts/scripts/short.py strih.json`. Výsledok je 1080 × 1920, titulky ASS (Manrope
  s diakritikou), bezpečné zóny YouTube (48/288/192/672 px), -14 LUFS, H.264 + AAC a kontrola 11 bodov.
- Titulky: najviac 2 riadky, krátke prirodzené frázy, vysoký kontrast, v páse titulkov mimo ovládacích prvkov
  (`youtube-shorts/assets/bezpecne-zony-1080x1920.png`). SRT cez `short.py strih.json --len-titulky`. Prvý návrh
  časov môže dať delphi.tools Auto Subtitle alebo Descript (prepis), potom ručná oprava.
- Faktické karty: jednotná typografia a farby, zdroj a dátum v karte. Vyrob ich ako HTML a vyrenderuj
  Playwrightom do PNG 1080 × 1920 (alebo cez Canva / Adobe Express, ak sú pripojené). Text čitateľný aspoň 2,5 s.
- Ak výroba MP4 nie je možná (chýbajú zábery, hlas alebo súhlas s kreditmi), odovzdaj jasne označené
  **produkčné podklady**.

## 9. Kontrola pred odovzdaním (QA)

- [ ] Každé tvrdenie má 2 nezávislé zdroje s dátumom; „žiada“ a „platí“ sú presne rozlíšené; `tvrdenia.py` je bez nálezov.
- [ ] Každý záber má licenciu a pôvod; archív má dátum v obraze; strih neprepája demonštrantov s násilím.
- [ ] Štítok „AI ILUSTRÁCIA“ je viditeľný celý čas AI scén; v YouTube Studio je AI use = Yes; v popise je
      označenie AI (AI Act čl. 50, `youtube-fakty.md`).
- [ ] Kontinuita postavy (tvár, oblečenie, výklad, svetlo) medzi K1–K4; žiadne deformácie.
- [ ] Dĺžka 30 s ±1 s; strih sedí na skutočnú dĺžku hlasu; „DÁTUM. MIESTO. ZDROJ.“ je čitateľné ≥ 3 s.
- [ ] Test bez zvuku na telefóne (snímky 390 px šírky): pointa je zrozumiteľná z titulkov a kariet.
- [ ] `short.py --kontrola` dá 11/11 (rozlíšenie, kodek, -14 LUFS, true peak, synchronizácia, faststart).
- [ ] Bez grafického násilia, zranených a rozpoznateľných tvárí bez súhlasu (pravidlá YouTube pre citlivé udalosti).
- [ ] Schválenie majiteľa presného súboru cez `youtube-shorts/scripts/schvalenie.py`. Uverejňuje majiteľ.

## 10. Dodávka

1. Finálny koncept (5 viet) a zdôvodnené tvorivé rozhodnutia.
2. Tabuľka faktov so zdrojmi (krok 1).
3. Časovaný storyboard (tabuľka 4 s doplnenými zábermi a kartami).
4. Presný voiceover (po overení) a zmeraná dĺžka nahrávky.
5. Anglické prompty K1–K4 + kľúčový snímok postavy.
6. Plán zvuku (hudba, ruchy, mix, licencie).
7. Titulky SRT a ASS.
8. Popis videa: 2–3 vety, zdroje s odkazmi a dátumom, označenie AI ilustrácie, licencie záberov a hudby.
9. MP4 1080 × 1920 (ak sa dá) + náhľadový hárok snímok + výsledok kontroly 11 bodov.

## 11. Ukladanie

Po každom kroku ulož výstupy (texty, tabuľky, EDL, prompty, SRT, kontroly) do repozitára a pushni, aby sa dalo
pokračovať aj po strate prostredia. Veľké videá ostávajú mimo gitu; v repozitári je len postup, ako ich vyrobiť znova.

---

## 12. Rozhodnutia majiteľa (19. 10. 2026)

- **Kredity:** AI ilustrácia obchodníka sa smie generovať bez obmedzenia (zostatok 68 kreditov v Higgsfielde;
  cena: Soul 2.0 portrét ≈ 1 kredit, Kling 3.0 klip 4 s bez zvuku 6 kreditov).
- **Hlas:** vo videu nemusí byť. Video je bez hlasu: vety voiceoveru sa stanú textom v obraze (titulky a karty)
  s dlhším časom na prečítanie; hudba a ruchy ostávajú.
- **Zámer upresnený:** video má ukázať, že to, čo film Athena (2022, fikcia) zobrazuje, sa deje v skutočnosti.
  Rieši sa textom, nie zábermi z filmu (práva): karta „VO FILME“ (jedna veta o deji, označené FIKCIA, 2022)
  oproti karte „V SKUTOČNOSTI“ s overeným faktom, dátumom, miestom a zdrojom. Porovnanie len tam, kde to
  fakty naozaj potvrdzujú; žiadne tvrdenie, že film „predpovedal“ udalosti alebo že príčiny sú rovnaké.
