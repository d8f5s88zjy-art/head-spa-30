# Technika `reel.py` a merania

Všetko merané 2026-10-11 v kontajneri (ffmpeg 6.1.1 s libass, Pillow 12.3.0, fontTools 4.66.1,
4 jadrá). Ukážky boli v scratchpade, nie v repozitári.

## Ako beží render

1. **Kontrola** (`kontrola`): súbory, úseky videí, zakázané tvrdenia (všeobecné + značky
   z `znacky.json`), `licencia` pri hudbe, `povod` pri hlase, `zdroj` a `ludia` pri záberoch.
   Chyba zastaví beh, upozornenie nie. `--kontrola` skončí tu (a ešte rozloží text).
2. **Písma** (`priprav_pisma`): woff2/ttf/otf značky → TTF s jedinečným menom rodiny
   („R30 Nadpis“, „R30 Kurziva“, „R30 Stitok“, „R30 Riadok“) do `prac/pisma`; kontrola všetkých
   slovenských znakov (aj veľkých) a znakov textov, inak náhrada (fc-match DejaVu) s upozornením.
3. **Rozvrh** (`rozvrh`): dĺžky v snímkach, začiatok záberu
   `start_k = start_{k-1} + n_{k-1} - prelínanie_k`, celková dĺžka `start_last + n_last`.
4. **Zábery** každý do medzivýsledku `prac/zNN.mp4` (H.264 crf 6, veryfast, BT.709, 1080 × 1920):
   fotka cez Pillow (snímka po snímke do ffmpeg), video cez ffmpeg.
5. **Titulky** (`titulky`): ASS s presnými polohami každého riadka + SRT.
6. **Zvuk** (`priprav_zvuk`), len ak je hlas alebo hudba.
7. **Zloženie** (`zloz`): `xfade` (prelínanie) alebo `concat` (strih) v reťazi, prekrytia,
   `ass` (titulky navrchu), H.264 High, AAC, faststart; potom titulná snímka a SRT.

Čas: ukážka BARBERSHOP 30 (12 s, dve fotky a jedno video) asi 65 s; HEAD SPA 30 (11,6 s, tri
fotky) podobne. Najdlhšie trvá kódovanie `preset slow` a lanczos pri fotkách.

## Fotka: pohyb bez trasenia

Výrez sa počíta v desatinných pixeloch a každá snímka je
`im.resize((W, H), LANCZOS, box=(x0, y0, x1, y1))` (Pillow berie desatinný `box`). Nájazd mení mierku
rovnomerne v logaritme (`w = w0 * (w1 / w0) ** t`) a okraje sa hýbu úmerne, takže jeden bod obrazu
stojí (cieľ nájazdu). Posun drží mierku a celú dráhu posunie dovnútra fotky; keď sa nezmestí,
priblíži presne toľko, koľko treba. Pred pohybom sa fotka raz zmenší tak, aby najmenší výrez mal
ešte 1,5-násobok výstupu (rýchlosť, lanczos stále vyhladzuje). Zväčšenie nad 1,02 hlási upozornenie.

Porovnanie (rovnaký výrez gallery/36.jpg, nájazd 1,00 → 1,07 za 4 s, `scripts/plynulost.py`,
stredný štvorec 480 px, 0,2 až 3,8 s):

| spôsob | priemerný rozdiel snímok | CV | skoky | výsledok |
| --- | --- | --- | --- | --- |
| ffmpeg `zoompan`, vstup 1536 × 2731 | 5,66 | 0,36 | 4 | trasie sa, výrez skáče po celých pixeloch vstupu a mihoce |
| ffmpeg `zoompan`, vstup zväčšený na 4320 × 7680 | 2,13 | 0,27 | 0 | lepšie, stále nerovnomerné, 30 MB na snímku v pamäti |
| Pillow `resize(box=...)` (náš) | 0,93 | 0,03 | 0 | plynulé |

Priebeh rozdielov (snímky 31 až 44): zoompan `6,83 8,84 5,32 3,90 4,16 6,85 8,88 3,85 …`,
Pillow `0,93 0,93 0,97 0,91 0,94 0,93 0,97 0,91 …`.

## Kľúčové snímky len na hraniciach záberov

Hotové video s kľúčovou snímkou každé 2 s (`-g 60`) malo v strede nájazdu jednu snímku s rozdielom
2,27 pri bežných 0,9: kódovač pri kľúčovej snímke obnoví jemnú textúru, ktorú predtým vyhladil
(viditeľné „cuknutie“). Nižšie CRF to len zmenšuje (max/medián 2,52 pri crf 18, 2,30 pri 16,
1,92 pri 12; `ipratio`, `-tune film`, `aq-mode` nepomohli). Riešenie: `-force_key_frames` na
začiatku videa a v strede každého prelínania (alebo na strihu), `-g` = 10 s. Výsledok na ukážke:
CV 0,22 → 0,065 (záber 1) a 0,068 (záber 3), bez skokov; kľúčové snímky 0; 3,8; 7,6 s.

## Video záber

- `-ss od` pred vstupom, `fps=30`, presne `n` snímok (`-frames:v`); zvuk z videa sa zahodí
  (hlasy klientov, hluk prevádzky).
- Výrez na pomer výstupu okolo `stred`; zväčšenie `scale=...:flags=lanczos+accurate_rnd+full_chroma_int`
  a pri zväčšení nad 1,05 `cas=strength=0.5` (ako `barbershop-30/source/tools/videa.sh`). Zdroj
  576 × 1024 → 1080 × 1920 je zväčšenie 1,875; pri 16 : 9 by orez dal 5,9, preto `vypln: pas`.
- `stabilizuj`: vid.stab v dvoch prechodoch (`shakiness=5:accuracy=15`, `smoothing=15:optzoom=1`).
- HDR (prenos `arib-std-b67` alebo `smpte2084`, iPhone): `zscale` + `tonemap=hable` na BT.709 SDR,
  s upozornením. Overené na syntetickom klipe HLG (beží), na skutočnom zábere z iPhonu nie.
- Otočenie z metadát videa ffmpeg robí sám; rozmery sa pri 90° prehodia (`sonda`).

## Fotka zo súboru

`ImageOps.exif_transpose` (fotka z telefónu na výšku s EXIF orientáciou 6 vyšla správne), ICC
profil (napr. Display P3) → sRGB cez ImageCms. Netónuje sa nič. AVIF a WebP číta Pillow; HEIC nie
(nástroj povie, nech sa prevedie na JPG).

## Text (libass)

- **Veľkosť písma v ASS nie je em.** libass berie `Fontsize` ako výšku riadka podľa OS/2
  `usWinAscent + usWinDescent` (ako GDI). Nástroj preto zadáva `Fontsize = em × (winA + winD) / upem`
  a riadok kladie `\an1\pos(x, základná_čiara + em × winD / upem)`. Overené: H v Fraunces 800 pri
  em 200 px má spodok presne na základnej čiare 600 a výšku verzálky 140 px (sCapHeight 1400/2000).
  Pomery: Fraunces 1,474, Manrope 1,366, Lora 1,500.
- **Jedinečné mená rodín.** Manrope vo woff2 webov má v tabuľke mien pri všetkých hrúbkach rodinu
  „Manrope ExtraLight“; pri pôvodných menách by libass mohol vybrať zlú hrúbku alebo systémové písmo.
- **Zalomenie** ako `text-wrap: balance`: najmenej riadkov a z nich najkratší najdlhší riadok,
  šírky z `hmtx` (bez kerningu, teda o chlp širšie). Nadpis najviac 2 riadky: ak sa nezmestí,
  zmenší sa po krokoch až na 76 %, potom až 3 riadky s upozornením.
- **Bezpečná zóna** (podiel obrazu): 9 : 16 hore 0,12, dole 0,20, vľavo 0,06, vpravo 0,12;
  16 : 9 0,08 / 0,12 / 0,06 / 0,06; 1 : 1 0,07 / 0,10 / 0,07 / 0,07. Blok textu: `poloha` dole
  (spodok bloku 1,2 % nad zónou), stred alebo hore.
- **Čitateľnosť** ako na weboch: mäkký tmavý lem písmen (obrys 2,6 px farby tieňa, krytie asi 56 %,
  `\blur4`, výplň ostáva ostrá) a za blokom elipsa farby tieňa s rozostrením (krytie `stmavenie`,
  BARBERSHOP 0,62, HEAD SPA 0,62). Web BARBERSHOP 30 má za kartou radiálny prechod s krytím 0,7.
  Fotka sa netónuje, stmaví sa len miesto za textom.
- Nábeh a odchod textu `\fad(300,250)`; text sa objaví 0,12 s po začiatku záberu (pri prelínaní od
  jeho stredu) a zmizne v strede ďalšieho prelínania. Susedné zábery s rovnakým textom sa spoja.

## Prekrytia (rozhranie s motion-grafika)

- Vstup: ProRes 4444 `.mov` (`yuva444p10le`, dekóduje sa ako `yuva444p12le`) alebo WebM VP9
  s alfou (`yuva420p`, značka `alpha_mode=1`).
- **WebM musí dekódovať `libvpx-vp9`** (`-c:v libvpx-vp9` pred `-i`). Natívny dekodér ffmpeg alfu
  zahodí: v teste dal alfu 255 (prekrytie by zakrylo celý obraz), `libvpx-vp9` správne 153 (0,6).
- Reťaz: `fps=30,scale=W:H:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuva420p|yuva444p,
  trim=duration=<dĺžka záberu>,setpts=PTS-STARTPTS+<začiatok záberu>/TB`, potom
  `overlay=eof_action=pass:format=auto`. Pred začiatkom záberu a po konci prekrytia ostáva podklad.
- Prevod do BT.709: bez neho bola farba prekrytia ProRes odchýlená o 9 úrovní (prekrytie bez značky
  farieb ffmpeg berie ako BT.601), s ním 1.
- Overené pixelmi (ukážka bez textu): ProRes s krytím 0,8 odchýlka 1, WebM 540 × 960 / 25 snímok/s
  s krytím 0,6 zväčšené na 1080 × 1920 odchýlka 2, mimo prekrytia 0; začiatok presne v 3,6 s
  (začiatok záberu 2), koniec po 2 s (dĺžka prekrytia).
- Titulky a stmavenie za nimi idú nad prekrytie. Keď prekrytie nesie vlastný text, daj záberu bez
  `text`, inak sa prekryjú.
- Testovacie prekrytie z ffmpeg: `drawbox` na snímke s alfou zapíše alfu len s `replace=1`, inak je
  box neviditeľný (stalo sa pri prvom teste).

## Zvuk

- Hlas: `adelay` na `od`, hudba: `volume` (−18 dB pod hlasom, −6 dB bez hlasu), nábeh 0,4 s,
  dobeh 1,5 s; pod hlasom `sidechaincompress` (threshold 0,03, ratio 6, attack 20, release 400).
- Hlasitosť: `loudnorm` v dvoch prechodoch, cieľ `I=-14:TP=-1.5:LRA=11`, druhý prechod s nameranými
  hodnotami a `linear=true`; AAC 192 kb/s, 48 kHz, stereo. Test (tóny + ružový šum): −14,13 LUFS,
  špička −3,0 dBTP.
- Bez hlasu a hudby nemá MP4 zvukovú stopu.
- `--casy-hlasu`: `volumedetect` → prah ticha 12 dB pod priemerom (−25 až −60 dB), `silencedetect`
  s minimom 0,35 s. Test (tri tóny s pauzami): 0,00 až 1,60; 2,40 až 4,20; 5,10 až 6,60 s presne.

## Kódovanie výstupu

`libx264 -preset slow -crf 18 -profile:v high -level:v 4.1 -pix_fmt yuv420p -bf 2 -maxrate 16M
-bufsize 32M`, značky BT.709 (`-color_primaries/-color_trc/-colorspace bt709 -color_range tv`),
`-r 30`, kľúčové snímky podľa záberov, `-map_metadata -1`, `-movflags +faststart` (overuje sa poradie
`moov` pred `mdat`). Ukážky: 10,6 MB / 12 s (BARBERSHOP), 6,8 MB / 11,6 s (HEAD SPA). Platformy
video prekódujú; posielame kvalitný originál.

## Overenie výsledku

```bash
python3 -I scripts/prehlad.py reel.mp4 -o prehlad.jpg --zona          # 1 snímka/s, červená = ovládanie aplikácií
python3 -I scripts/prehlad.py reel.mp4 --detail 1.5 -o detail.png     # plné rozlíšenie: ostrosť, diakritika
python3 -I scripts/plynulost.py reel.mp4 --od 0.6 --do 3.4 --vyrez 400 # úsek fotky bez prelínania
ffprobe -v error -show_entries stream=codec_name,profile,pix_fmt,r_frame_rate,width,height -of compact reel.mp4
ffprobe -v error -select_streams v -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 reel.mp4
```

Pri `plynulost.py` meraj úsek bez prelínania a bez nábehu textu (aj elipsa stmavenia zasahuje do
stredu obrazu, keď je text dole).
