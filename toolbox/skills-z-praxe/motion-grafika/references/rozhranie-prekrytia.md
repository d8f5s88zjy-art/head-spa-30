# Rozhranie: prekrytie s alfou pre kratke-video

Dohoda medzi dvoma nástrojmi (motion-grafika vyrába, `kratke-video/scripts/reel.py` kladie):

- motion-grafika dodá prekrytie s priehľadnosťou ako **ProRes 4444 `.mov`** (`yuva444p10le`) a **WebM VP9
  s alfou** (`yuva420p`), predvolene 1080 × 1920, 30 snímok/s, rovnaký rozmer ako výstup reelu pri 9:16.
- reel.py má v scenári pri každom zábere pole `"overlay"`: cesta k takému súboru. Prekrytie sa položí cez celý
  obraz od začiatku záberu: `scale` na rozmer výstupu, `format=yuva420p` alebo `yuva444p`, `overlay`.

## Čo presne súbory obsahujú (overené ffprobe)

| súbor | kódovanie | čo ukáže ffprobe | poznámka |
| --- | --- | --- | --- |
| `<meno>.mov` | `prores_ks -profile:v 4444 -alpha_bits 16 -pix_fmt yuva444p10le` | `prores`, profil 4444, `yuva444p12le` | dekodér ProRes 4444 vydáva vždy 12 bitov; kódované je z 10 bitov |
| `<meno>.webm` | `libvpx-vp9 -pix_fmt yuva420p -crf 18 -b:v 0 -auto-alt-ref 0` | `vp9`, `yuv420p`, `tag:alpha_mode=1` | alfa je v samostatnej vrstve; ffprobe ju v `pix_fmt` neukáže |
| obe | `-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv`, prevod `scale=out_color_matrix=bt709` | `bt709` | zábery z telefónu sú tiež bt709, prekrytie v YUV teda farby neposunie |

Alfa je **rovná** (straight, nenásobená farbou): v priehľadných miestach je farba nula, na okrajoch plná farba
s čiastočnou alfou. Takto ju čaká `overlay` vo ffmpeg (predvolené `alpha=straight`) aj prehliadač. V After
Effects alebo Premiere: Interpret Footage, Alpha: Straight, keby sa na okrajoch ukázal lem.

## Pasca: WebM s alfou treba dekódovať cez libvpx-vp9

Vstavaný dekodér VP9 vo ffmpeg alfu zahodí a priehľadné miesta vyjdú **čierne** (overené 2026-10-11 na
ffmpeg 6.1.1: alfa sa líšila o 136 z 255, obraz bol čierny). Pred vstup s WebM patrí `-c:v libvpx-vp9`:

```bash
ffmpeg -c:v libvpx-vp9 -i prekrytie.webm ...      # správne
ffmpeg -i prekrytie.webm ...                       # zle: bez alfy
```

ProRes 4444 `.mov` sa dekóduje s alfou bez ničoho navyše, preto je pre reel.py bezpečnejší. WebM je menší
(lower third 0,14 MB proti 14 MB) a hodí sa do prehliadača.

## Overený príkaz (tak, ako to robí reel.py)

```bash
# záber 6 s, prekrytie 4 s od začiatku záberu; po skončení prekrytia už nič nekreslí (eof_action=pass)
ffmpeg -ss 1 -t 6 -i zaber.mp4 -i bs30-lower-third.mov -filter_complex \
 "[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=30,format=yuv420p[z];[1:v]scale=1080:1920,format=yuva444p[o];[z][o]overlay=0:0:eof_action=pass:format=auto,format=yuv420p" \
 -c:v libx264 -crf 18 -pix_fmt yuv420p reel.mp4
# to isté s WebM: pred -i prekrytie.webm pridaj -c:v libvpx-vp9 a format=yuva420p
# iný rozmer výstupu (720 x 1280): scale=720:1280:flags=lanczos na zábere aj na prekrytí
```

Vyskúšané 2026-10-11 na `video-3.mp4`: `.mov` aj `.webm` (s `-c:v libvpx-vp9`) dávajú rovnaký obraz, rozmer
720 × 1280 tiež; bez `-c:v libvpx-vp9` je obraz čierny s lower third.

## Dĺžka a koniec prekrytia

- `eof_action=repeat` (predvolené vo ffmpeg): po konci prekrytia ostane jeho posledná snímka. Lower third,
  titulná karta a priebeh končia priehľadnou snímkou (render to vypíše: „posledná priehľadná“), takže to nevadí.
  Značka na konci končí hotovou kartou a tá by pri dlhšom zábere ostala.
- `eof_action=pass`: po konci prekrytia sa kreslí len záber. Tak to robí `kratke-video/scripts/reel.py`
  (prečítané 2026-10-11: `trim=duration` na dĺžku záberu, `overlay=eof_action=pass`, WebM cez `-c:v libvpx-vp9`,
  prevod `scale=...:out_color_matrix=bt709`). Značku na konci preto renderuj s `--dlzka` rovnou dĺžke záberu.
  Farby cez túto cestu sedia: tlačidlo `#e0601c` (224, 96, 28) vyšlo (222, 94, 26) z `.mov`, (223, 95, 27) z `.webm`.
- Prekrytie dlhšie ako záber sa odreže; dĺžku nastav `--dlzka` podľa záberu v scenári.
- Snímková frekvencia: render predvolene 30 snímok/s. Pri inom fps reelu daj `--fps` rovnaké, inak `overlay`
  páruje snímky podľa času (funguje, ale pohyb grafiky dostane fps reelu).

## Kontrola, ktorú robí render sám

Snímku v čase detailu položí ffmpeg z `.mov` aj z `.webm` (cez libvpx-vp9) na bielu a na čiernu. Z dvoch podkladov
sa alfa dá vypočítať späť (`a = 255 - (biela - čierna)`) a porovná sa s alfou pôvodnej PNG snímky; zloženie na
bielej sa porovná so zložením pôvodnej snímky v Pillow (tmavý lem) a na čiernej (svetlý lem). Namerané na
ukážke BARBERSHOP 30: `.mov` alfa ±0,11 až 0,14 z 255, `.webm` ±0,12 až 0,8, lem 0 %, farba tlačidla
`#e0601c` po ceste cez `.mov` a záber (224, 96, 28) → (222, 93, 28).
