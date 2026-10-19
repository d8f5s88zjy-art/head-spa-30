# Hudba k shortu „ČO NEVIDÍŠ V ZÁBERE“ (30 s, 9:16, bez hlasu)

Vyrobené 19. 10. 2026 podľa `prompty/co-nevidis-v-zabere.md` (časť 7 Zvuk, časť 12 Rozhodnutia majiteľa).
Všetko v tomto adresári je **vlastná syntéza v Pythone** (`hudba.py`, numpy 2.4 + scipy 1.17). Finálny mix
s obrazom a normalizáciu na -14 LUFS / -1 dBTP robí `short.py`; tieto súbory sú hudobná stopa pod obraz.

## Súbory

| Súbor | Čo |
| --- | --- |
| `hudba.py` | skript syntézy (slovenské komentáre, deterministický seed 20261019, vlastný merač LUFS podľa ITU-R BS.1770-4) |
| `hudba.wav` | **odporúčaný** základný variant – 48 kHz, stereo, 32-bit float, 32,000 s |
| `hudba-tmavsia.wav` | variant: perkusie len náznakom (25 %), tmavší filter plochy (do 0,65 kHz), vyšší hlas na 50 %, tep +10 % |
| `hudba-hustejsia.wav` | variant: viac perkusií (160 %), otvorenejší filter (do 2,4 kHz), vyšší hlas na 140 % |
| `zmeraj.sh` | meranie cez ffmpeg (`ebur128=peak=sample+true`) + obrázky; `priebeh.py` kreslí priebeh hlasitosti M/S |
| `*-hlasitost.png` | priebeh hlasitosti (tenká = momentálna M 400 ms, hrubá = krátkodobá S 3 s) s hranicami oblúka |
| `*-vlna.png`, `*-spektrogram.png` | priebeh vlny (showwavespic) a spektrogram 25 Hz – 8 kHz (showspectrumpic) |
| `*.ebur128.txt` | úplný výpis ffmpeg ebur128 (po 100 ms M/S/I/LRA + súhrn) |

## Charakter a stavba

Vážna, dokumentárna, napätá, nie akčná. Tónina G mol. Nič, čo by znelo ako skutočný zvuk udalosti: žiadne sirény,
výstrely, krik, dav, žiadne „trap“ hi-haty (perkusie nemajú nič nad 2 kHz).

| Vrstva | Ako je urobená |
| --- | --- |
| tep (subbas) | sínus s poklesom výšky z ~91 Hz na **49 Hz (G1)** za 30 ms, mäkká saturácia tanh (2.–3. harmonická, aby pulz bolo cítiť aj na telefóne); „lub-dub“: hlavný úder + slabší o ~190 ms; **~84 BPM, každá doba ±2,5 % iná**, medzi 12 a 16 s zrýchli na ~88 BPM; 30 úderov od 1,5 s do 22 s |
| plocha | rozladené píly (±0,4 %) + sínus na základnej frekvencii, akordy Gm → Ebmaj7 → Gm → Cm9 → Dsus4 → Gm s prelínaním (nábeh 0,6 s / dobeh 0,9 s), dolná priepusť 2. rádu, ktorá sa otvára z 300 Hz na 1,4 kHz a po 22 s zatvára na 400 Hz, chorus 7 ± 1,4 ms pri 0,21 Hz (iná fáza vľavo/vpravo), syntetický dozvuk 2,6 s |
| perkusie | mäkký tlmený úder (šum 120–500 Hz + sínus 160 → 110 Hz, ako dlaň na kartón) a tlmený tik (šum 600–1800 Hz, 20 ms); od 6 s zriedkavo, od 12 s údery na 2. a 4. dobe, občas „3 a“, tiky na osminách; humanizácia ±6 ms a ±10 % sily; 21 úderov |
| vyšší hlas | 12–22 s: sínus + 2. a 3. harmonická, jemné vibrato, legato D4–Eb4–D4–C4–Bb3–C4–A3 (A3 nad Dsus4 = nerozvedené napätie pred stíšením) |
| nádychy | filtrovaný šum s otvárajúcim sa pásmom: na hook (0,02–0,52 s), pred 12 s a pred 19,8 s |

### Oblúk (zadanie → realizácia → zmerané, krátkodobá hlasitosť S z ffmpeg pre `hudba.wav`)

| Čas | Zadanie | Realizácia | Zmerané |
| --- | --- | --- | --- |
| 0–1,5 s | takmer ticho, jediný úder/nádych | nádych → jeden hlboký úder (0,45 s) s dozvukom, plocha takmer nepočuteľná | M max -19 LUFS (o 3 dB pod hustou časťou), potom ticho |
| 1,5–12 s | napätie rastie | nastúpi tep (55 → 100 % sily) a plocha (filter 300 → 900 Hz), od 6 s prvé údery | S -23 → -19 LUFS, monotónny rast |
| 12–22 s | najhustejšie | perkusie, vyšší hlas, zmeny akordov, filter do 1,4 kHz, tempo 84 → 88 BPM | S -18,4 → -17,0 LUFS (maximum skladby) |
| 22–24 s | prudké stíšenie o ~10 dB, ostane plocha | tep a perkusie končia, plocha klesne kosínusovou rampou o 4 dB (22,0–22,8 s), filter sa zatvára | M -16 (22,0 s) → -28 LUFS (23,3 s); S 16–22 s **-17,2** vs. 24–29 s **-27,5 LUFS = pokles 10,3 dB** |
| 24–29 s | ticho s plochou | len plocha Gm | S -27 až -28 LUFS |
| 29–32 s | dobeh do ticha | kosínusový fade 29,0–31,8 s, od 31,79 s digitálne ticho | S -28 → -∞ |

Žiadny tvrdý strih: všetky zmeny úrovne sú kosínusové alebo vyhladené rampy, všetky údery majú nábeh ≥ 1 ms,
zmeny filtra prenášajú stav. Kontrola širokopásmových cvaknutí (>6 kHz, okná 50 ms): najsilnejšie sú len zámerné
nádychy (0,46 s, 11,93 s, 19,74 s; -56 až -60 dBFS RMS), inak nič nad -65 dBFS.

## Merania (ffmpeg 7.0.2, `-af ebur128=peak=sample+true`)

| Súbor | I | LRA | vzorková špička | true peak | S 16–22 s | S 24–29 s | pokles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hudba.wav` | **-20,0 LUFS** | 10,8 LU | -5,9 dBFS | -5,9 dBTP | -17,2 LUFS | -27,5 LUFS | 10,3 dB |
| `hudba-tmavsia.wav` | -20,0 LUFS | 10,6 LU | -6,5 dBFS | -6,5 dBTP | -17,3 LUFS | -27,4 LUFS | 10,1 dB |
| `hudba-hustejsia.wav` | -20,0 LUFS | 11,4 LU | -5,8 dBFS | -5,8 dBTP | -17,2 LUFS | -28,0 LUFS | 10,8 dB |

- Požiadavky: dĺžka 32,000 s ✓ (1 536 000 vzoriek), 48 kHz stereo float ✓, špička ≤ -3 dBFS ✓ (rezerva 2,9 dB),
  I ≈ -20 LUFS ✓ (vlastný merač v skripte dáva rovnakých -20,0 LUFS ako ffmpeg), DC ≈ 0 ✓.
- LRA ~11 LU je zámer (oblúk ticho → hustota → ticho); `short.py` normalizuje celok, nie úseky.
- Rozdiel variantov v hustej časti 12–22 s (energia pásma vzhľadom na celé pásmo, dB): 300 Hz–1 kHz:
  tmavšia -18,1 / základ -15,5 / hustejšia -14,2; 1–3 kHz: -32,0 / -26,5 / -24,6; 3–8 kHz: -50,4 / -45,8 / -39,9.
- Determinizmus: dva nezávislé behy `hudba.py` dali bit po bite rovnaký `hudba.wav`
  (SHA-256 `56955edecd38a274f9dda14dbf6f467879d8e20d5a96ab24a49a1ed2ba355661`).

## Odporúčanie

**Použiť `hudba.wav`.** Má plný oblúk zo zadania: hustá časť 12–22 s je počuteľne hustejšia (perkusie, pohyb
akordov a vyššieho hlasu), ale perkusie ostávajú tlmené a nič neznie ako trailer. `hudba-tmavsia.wav` je záloha,
ak by sa pri strihu ukázalo, že pod statickými faktickými kartami perkusie pôsobia „vyrobene“ – vtedy ostane
len tep a plocha s náznakom úderov. `hudba-hustejsia.wav` neodporúčam: otvorenejší filter a viac tikov posúvajú
charakter k akčnému, čo zadanie výslovne nechce.

Poznámky pre strih: záverečná veta / karta „DÁTUM. MIESTO. ZDROJ.“ patrí od 24 s (hudba je už len plocha
o ~10 dB tichšie); posledné 2 s (30–32 s) sú rezerva na dobeh pod čiernou alebo na orezanie v `short.py`.
Ruchy (kľúč, roleta, ulica) sú mimo tejto stopy.

## Licencia

Celá stopa je vlastná syntéza v `hudba.py` (numpy + scipy): generované sínusy, píly, filtrovaný šum, vlastný
syntetický dozvuk (exponenciálne doznievajúci šum). **Nepoužili sa žiadne cudzie vzorky, nahrávky, knižnice
zvukov, MIDI ani melódie iných diel.** Práva patria majiteľovi projektu; do popisu videa stačí „hudba: vlastná
syntéza“. Žiadny nárok Content ID z tejto stopy nehrozí.

## Ako spustiť znova

```sh
cd video/co-nevidis/zvuk
python3 -I hudba.py                   # hudba.wav (základný variant)
python3 -I hudba.py --variant tmavsia # hudba-tmavsia.wav  (alebo --variant hustejsia)
python3 -I hudba.py --vsetky          # všetky tri varianty (~25 s)
sh zmeraj.sh hudba.wav hudba-tmavsia.wav hudba-hustejsia.wav   # ebur128 + PNG (ffmpeg v /usr/local/bin, PIL)
```

Parametre na doladenie sú na začiatku `hudba.py`: časové body oblúka (`T_PULZ`, `T_HUSTE`, `T_POKLES`, `T_FADE`),
`POKLES_DB` (rampa plochy pri 22 s; celkový pokles = rampa + koniec tepu/perkusií ≈ +6 dB), `CIEL_LUFS`,
`MAX_SPICKA_DBFS`, tabuľky `VARIANTY`, `AKORDY`, `VYSSI_HLAS`. Zmena seedu `SEED` zmení humanizáciu a šumy,
nie stavbu.
