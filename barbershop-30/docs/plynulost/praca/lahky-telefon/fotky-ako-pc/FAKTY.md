# Fakty: koľko fotky vidno na počítači a na telefóne (BARBERSHOP 30, ľahký telefón)

Požiadavka majiteľa (21. 10. 2026, iPhone): „Chcem, aby tie fotky bolo vidno tak dobre ako na PC.“

**Meraný strom:** čistý `git archive` vetvy `barbershop-lahky-telefon` @ `3346f80` (21. 10. 09:52) do
`fakty/src`. Ostrosti a výrezov sa od `f1f9c4d` nič nezmenilo, posledný commit mení len písmo, lesk a skrol.
- server: `python3 -m http.server 8680`;
- meranie: `node nastroje/meraj.mjs http://127.0.0.1:8680/barbershop-30/ fakty/raw`
  (Chromium z Playwrightu, `locale sk-SK`);
- výpočet: `python3 -I nastroje/rozbor.py fakty/src/barbershop-30 fakty`;
- obrázky: `python3 -I nastroje/porovnanie.py fakty`.

**Zariadenia:**
- počítač: 1440 × 900, `?film=off`, DPR 1 a DPR 2;
- telefón: 390 × 844 a 430 × 932 (majiteľov iPhone), DPR 3, `isMobile`, `hasTouch`, trieda `lite`
  (`karty lite world-off`).

Surové údaje sú v `fakty/raw/` (`meranie.json` s `currentSrc`, rámom a `object-position` každej karty;
`rozbor.json`; `tabulky.md`). Snímky sú v `fakty/raw/{pc1,pc1film,tel390,tel430}-*.png`. Rámy na pôvodných
fotkách sú v `fakty/ramy/*.jpg` a spolu v `fakty/ramy-vsetky-karty.jpg`.

## 0. Hlavné zistenie

1. **Na telefóne nechýba ostrosť, chýba scéna.**
   - Ostrosť: telefón dostane 3,05 px fotky na CSS px, teda 1,02 px na fyzický px. To je rovnako ako počítač
     pri DPR 2 (2,01 px na CSS px, 1,0 na fyzický px) a 2× viac ako počítač pri DPR 1 (1,51).
   - Scéna: z plochy, ktorú vidno na počítači, vidno na telefóne len **31 %**. Pri zábere Pracovné miesto je to
     **18 %**, pri Káve 21 %.
2. **Príčina je geometrická.**
   - Výrez `-m` má šírku 1536 z 4096 px, teda 37,5 % šírky pôvodnej fotky (`film.json`, `m.width`).
   - `object-fit: cover` na okno 390 × 844 z neho odreže ešte 18 % šírky (pomer okna 0,462, výrezu 0,562).
   - Spolu ostane 30,8 % pôvodnej fotky. Na počítači je to 93,7 %.
3. **Tri karty sú na telefóne podvzorkované.**
   - `stol-m-1448.avif` má len 1152 px, `kava-m-1448.avif` 1229 px. Výrez je menší ako 1448 a nezväčšoval sa.
   - Na telefóne to dáva 2,43 a 2,59 px na CSS px, teda 0,81 a 0,86 px na fyzický px.
   - Na 430 × 932 (majiteľov iPhone) je to 0,73 a 0,78. Pri ostatných kartách je to 0,92.
4. **Úvodná karta (rohožka) je na telefóne iná fotka** (`source/photos/foto-40.jpg`, nie `slider/3.jpg`).
   Sud s pumpou Route 66 a buldog, ktoré sú na počítači v strede, na telefóne vôbec nie sú.
5. **Počítač s filmom (WebGL) ukazuje menej ako `?film=off`.**
   - Rámovanie filmu má presah 1,24 (`style.css:495`), pri kotve preto vidno 56 % fotky (kreslo-stred 60 %).
   - Pri `?film=off` vidno 93,7 %.
   - Tvrdenie „?film=off = rovnaké rámovanie ako film“ teda neplatí pre plochu: `?film=off` je obyčajný cover.
     Modrý rám v `ramy/*.jpg` ukazuje film.
   - Aj tak je na telefóne len 31/56 = 55 % plochy, ktorú ukazuje počítač s filmom.

## 1. Viditeľná plocha pôvodnej fotky (cover, bez priblíženia 1,00)

Bod záujmu:
- počítač: `data-f` (`object-position`);
- telefón: `data-fm` na výreze `-m` (`data-m-size`, posun `m.left`/`m.top` z `film.json`).

Percentá sú z plochy pôvodného zdroja (4096 × 2731, rohožka 1920 × 1200).

| karta (`data-shot`) | miesto | PC 1440×900 `?film=off` | PC s filmom (presah 1,24) | tel 390×844 | tel 430×932 | z plochy PC vidno na tel | chýba z šírky PC vľavo / vpravo |
|---|---|---|---|---|---|---|---|
| rohozka | Úvod | 100,0 % | 59,9 % | 61,6 % **inej fotky** | 61,5 % | – (iná fotka) | – |
| sala | Hlavná sála | 93,7 % | 56,2 % | 30,8 % | 30,8 % | 31 % | 35 % / 35 % |
| stol | Pracovné miesto | 93,7 % | 56,2 % | **17,3 %** | 17,3 % | **18 %** | 26 % / **50 %** |
| cakaren | Kútik s pumpou Route 66 | 93,7 % | 56,2 % | 30,8 % | 30,8 % | 31 % | **57 %** / 13 % |
| sala-rano | Sála ráno | 93,7 % | 56,2 % | 30,8 % | 30,8 % | 31 % | 35 % / 35 % |
| kreslo-stred | Kreslo uprostred sály | 93,7 % | 60,4 % | 30,8 % | 30,8 % | 31 % | 35 % / 35 % |
| kava | Káva pre hostí | 93,7 % | 56,2 % | **19,7 %** | 19,7 % | 21 % | 38 % / 38 % (+ spodok) |
| sud | Predná sála so sudom | 93,7 % | 56,2 % | 30,8 % | 30,8 % | 31 % | **63 %** / 7 % |
| vstup | Vstup z Mostnej ulice | 93,7 % | 56,2 % | 30,8 % | 30,8 % | 31 % | **61 %** / 9 % |

**Titulné karty v `index.html`:** je ich 9 (`grep -o 'data-shot="[^"]*"' index.html | sort | uniq -c`).
`recepcia`, `zadna`, `naradie` a `kreslo` sú v `film.json`, ale nie sú titulné karty, preto tu nie sú.

**Telefón 390 a 430 sa takmer nelíšia.** Obe okná majú pomer 0,462, takže cover odreže to isté.

**Priblíženie** (`style.css:470`, `transform: scale(1 + 0,06 · --sp)`) je rovnaké na počítači aj na telefóne.
Pri snímke v polovici karty (zmerané `getBoundingClientRect` / `offsetWidth`) dáva tieto plochy:

| priblíženie | PC | telefón |
|---|---|---|
| 1,06 (sala, stol, cakaren, sud) | 83,4 % | 27,4 % (stol 15,4 %) |
| 1,03 (ostatné) | 88,4 % | 29,1 % (kava 18,6 %) |

## 2. Čo konkrétne na telefóne chýba (pohľad na `ramy/*.jpg` a snímky `raw/tel390-*.png`)

**cakaren**
- Chýba ľavých 57 % záberu: rad kožených kresiel, hĺbka sály, kruhové svetlá pod stropom.
- Z buldoga so slúchadlami ostane na ľavom okraji len kus hlavy so slúchadlami a bok tela. Pri priblížení 1,06
  je odrezaný skoro celý (`raw/tel390-cakaren.png`).
- Ostane len pumpa Route 66. Text karty pritom sľubuje „Kreslá, retro pumpa a farebný buldog“.

**stol**
- Vľavo chýba zrkadlo s obkladom a lampou (26 %).
- Vpravo chýba celá polovica (50 %): druhé zrkadlo, kruhové svetlo, okno, únikové značenie a kožené kreslo
  v popredí.
- Výrez začína až v 25 % výšky (`m.top` 683), takže chýbajú aj stropné lampy.
- Televízor je len napoly. Ostane karafa, kozmetika a zásuvky.

**sala**
- Vľavo chýba rozmazané koženkové kreslo v popredí a priechod do zadnej časti.
- Vpravo chýbajú kruhové svetlá, zrkadlá s pultom a televízor.
- Ostane rad kresiel a holičský stĺp.

**sala-rano**
- Vľavo chýba lampa a zrkadlá s pultom.
- Vpravo chýba svietiaci nápis Barbershop 30 na drevenej stene, detské autíčko a sud.

**kreslo-stred**
- Chýbajú obe bočné pracovné miesta so zrkadlami, kruhové svetlá vľavo aj vpravo a pravý televízor.
- Symetria sály sa stratí, ostane jedno kreslo.

**kava**
- Výrez je posunutý hore (`m.top` 55, výška 2185 z 2731), takže chýba spodok podnosu.
- Na bokoch chýba ľavá polovica šálky kávy, karafa s lampou a pravá časť pohára a sud.

**sud**
- Chýba ľavých 63 %: okno s rastlinou, holičské kreslo, obraz mačky, červené kreslo a pumpa v pozadí, kruhové
  svetlá.
- Buldog na sude je prerezaný. Ostane sud s uterákmi, orchidea a televízor.

**vstup**
- Chýba ľavých 61 %: rozmazané auto v pohybe, Salón 30, EK, stĺp a väčšina ulice.
- Vpravo chýba 9 % (chodec, susedný dom). Ostane výklad Barbershop s dverami.

**rohozka**
- Telefón ukazuje inú fotku: rohožku s logom zhora, strop s lampami a kreslá v diaľke.
- Na počítači je v strede sud s pumpou Route 66, buldogom a holičským stĺpom. Tie na telefóne nie sú.

## 3. Ostrosť: px fotky na CSS px podľa súboru, ktorý prehliadač naozaj stiahol

Súbor je `img.currentSrc` z `meranie.json`. Pravidlá výberu:
- srcset `-{1086,1448,2172,2896[,4096]}` a `sizes="(max-width: 720px) 93vw, 124vw"`;
- pre telefón `<source media="(max-width: 720px)">` s `-m-1086`, `-m-1448`.

Rozmery súborov sú z `film.json` (`tiers.*.w`). Hodnoty v tabuľke platia pri priblížení 1,00. Pri 1,06 ich
treba deliť 1,06 (telefón 3,05 → 2,88; PC DPR 2 2,01 → 1,90).

| karta | PC DPR 1: súbor | px/CSS | PC DPR 2: súbor | px/CSS (na fyz. px) | tel 390 DPR 3: súbor | px/CSS (na fyz. px) | tel 430 DPR 3 px/CSS (na fyz. px) |
|---|---|---|---|---|---|---|---|
| rohozka | rohozka-2172.avif (1920×1200) | 1,33 | rohozka-2172.avif (1920×1200) | **1,33 (0,67)** | rohozka-m-1448.avif (1448×2574) | 3,05 (1,02) | 2,76 (0,92) |
| sala | sala-2172 (2172×1448) | 1,51 | sala-2896 (2896×1931) | 2,01 (1,01) | sala-m-1448 (1448×2575) | 3,05 (1,02) | 2,76 (0,92) |
| stol | stol-2172 | 1,51 | stol-2896 | 2,01 (1,01) | stol-m-1448 (**1152×2048**) | **2,43 (0,81)** | **2,20 (0,73)** |
| cakaren | cakaren-2172 | 1,51 | cakaren-2896 | 2,01 (1,01) | cakaren-m-1448 (1448×2575) | 3,05 (1,02) | 2,76 (0,92) |
| sala-rano | sala-rano-2172 | 1,51 | sala-rano-2896 | 2,01 (1,01) | sala-rano-m-1448 | 3,05 (1,02) | 2,76 (0,92) |
| kreslo-stred | kreslo-stred-2172 | 1,51 | kreslo-stred-2896 | 2,01 (1,01) | kreslo-stred-m-1448 | 3,05 (1,02) | 2,76 (0,92) |
| kava | kava-2172 | 1,51 | kava-2896 | 2,01 (1,01) | kava-m-1448 (**1229×2185**) | **2,59 (0,86)** | **2,34 (0,78)** |
| sud | sud-2172 | 1,51 | sud-2896 | 2,01 (1,01) | sud-m-1448 | 3,05 (1,02) | 2,76 (0,92) |
| vstup | vstup-2172 | 1,51 | vstup-4096 (4096×2731) | 2,84 (1,42) | vstup-m-1448 | 3,05 (1,02) | 2,76 (0,92) |

**Výpočet pre telefón** (cover výrezu 1536 × 2731 na 390 × 844):
- nakreslená šírka je 844 · 1536/2731 = 474,7 CSS px;
- 1448 / 474,7 = 3,05 px na CSS px a 3,05 / 3 = 1,02 px na fyzický px;
- na 430 × 932: 932 · 0,5624 = 524,2 CSS px, takže 1448 / 524,2 = 2,76.

**Výpočet pre počítač:** cover fotky 3:2 na 1440 × 900 má šírku 1440 CSS px, takže 2172 / 1440 = 1,51 a
2896 / 1440 = 2,01.

**Výber súboru:**
- Na telefóne `sizes` hovorí 93vw (362,7 CSS px pri 390), ale nakreslená šírka je 474,7.
- Prehliadač potrebuje 362,7 · 3 = 1088 px > 1086, preto vždy vezme `-m-1448`. Na 430: 1200 px, tiež 1448.
- Výber teda sedí len vďaka tomu, že 1086 je o 2 px pod hranicou.
- V7 zo SKEPTIK.md platí: s `-m-1086` by bolo 2,29 / 2,07 px na CSS px (390 / 430), o 25 % menej.

**Počítač je pri rohožke horší ako telefón.** Zdroj `slider/3.jpg` má len 1920 px, takže aj DPR 2 dostane
1,33 px na CSS px (0,67 na fyzický px).

## 4. Čo z toho vyplýva pre „vidno tak dobre ako na PC“ (len čísla, bez návrhu)

**Celý PC záber na šírku telefónu (contain):**
- fotka by mala 390 × 260 CSS px, teda 30,8 % výšky okna 844 (na 430 × 932: 430 × 287, tiež 30,8 %);
- plocha scény by bola 100 % namiesto 30,8 %;
- ostrosť z existujúcich súborov na šírku:

| súbor | 390 px/CSS (na fyz. px) | 430 px/CSS (na fyz. px) |
|---|---|---|
| `-1086` | 2,78 (0,93) | 2,53 (0,84) |
| `-1448` | 3,71 (1,24) | 3,37 (1,12) |
| `-2172` | 5,57 (1,86) | 5,05 (1,68) |

  `-1448` na šírku je teda na telefóne ostrejší ako dnešný výrez `-m-1448` (3,05).

**Na výšku okna (dnešná výška 844 CSS px):**
- celú šírku záberu by bolo treba ukázať na 844 · 1,5 = 1266 CSS px, teda 3,2 šírky displeja;
- jeden pohľad ukáže 390 / 1266 = 31 % šírky. To je presne dnešný stav, len s možnosťou posúvať.

**Žiadna z týchto možností nevyžaduje nové súbory.** Na šírku stačia existujúce `-{1086,1448,2172}.avif`
(`film.json` `tiers`).

## 5. Porovnávacie obrázky (vľavo počítač 1440 × 900 zmenšený na 69 %, vpravo telefón 390 × 844 DPR 3)

Každý obrázok má aj rám na pôvodnej fotke a zoznam toho, čo chýba.

| súbor | veľkosť | rozmer |
|---|---|---|
| `fakty/porovnanie-cakaren.jpg` | 302 kB | 1534 × 1184 |
| `fakty/porovnanie-sala.jpg` | 261 kB | 1534 × 1184 |
| `fakty/porovnanie-stol.jpg` | 283 kB | 1534 × 1184 |
| `fakty/porovnanie-rohozka.jpg` | 280 kB | 1534 × 1184 |
| `fakty/porovnanie-vstup.jpg` (navyše) | 324 kB | 1534 × 1184 |

**Ako vznikli snímky:**
- karta je posunutá do polovice svojej dĺžky (rohožka na začiatok);
- snímka sa urobila až keď `img.complete` a `opacity` zálohy = 1, plus 1,6 s;
- priblíženie v čase snímky bolo 1,03 alebo 1,06, takže snímka ukazuje o niečo menej ako tabuľka v časti 1.

**Poriadok po práci:** server na porte 8680 je ukončený. Dočasná kópia `fakty/src` (230 MB) a staré
`fakty/raw-old` sú zmazané. Strom `hs-lahky` sa nemenil (len `git archive`).
