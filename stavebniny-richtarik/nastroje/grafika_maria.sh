#!/usr/bin/env bash
# Webové veľkosti propagačných grafík majiteľa (Ing. Mário Richtárik, e-maily zo 16. 11. 2026: „nova zakaznicka karta“
# a druhá zásielka s ilustráciou Podhľady).
# Zdroj: zdroj/grafika-maria/*.webp – 38 výrezov zo snímok obrazovky iPhonu bez rozhrania telefónu (bezstratové WebP, pixely
# presne zo snímky; odkiaľ je ktorý výrez, je v zdroj/grafika-maria/vyrezy.tsv). Pôvod a použitie: img/FOTKY.md.
# Spracovanie: len orez, zmenšenie (Lanczos), jemné doostrenie po zmenšení a prevod do AVIF a WebP. Tón, farby ani obsah
# sa nemenia a nič sa nezväčšuje: snímky nesú skutočný detail len ≈ 530–1320 px, preto séria končí na 480 px, ikony
# Kontaktu a zliav na 480 px, hodiny na 288 px, auto na 905 px a „Zdarma výpočet“ na 1080 px; veľké obrázky albumov majú
# najviac šírku skutočného detailu svojho výrezu (tabuľka nižšie).
# Výstup (nové mená, obrázky majú na hostingu cache na rok):
#   img/ilu/ séria skupín tovaru (štvorec zo stredu výrezu, strana = kratšia strana zdroja) <názov>-200|400|480.avif|webp
#   img/ilu/ Kontakt: orez 800 × 600 + 260 + 50 (celý rám ikony, menej prázdneho pozadia) kontakt-zavolajte|napiste-288|480
#   img/ilu/ Kontakt: hodiny, orez 710 × 533 + 300 + 95 kontakt-hodiny-144|288
#   img/ilu/ Služby: celý výrez 1320 × 720 zdarma-vypocet-480|790|1080; zľavy, orez 800 × 600 + 236 + 12 zlavy-288|480
#   img/ilu/ Doprava: auto bez nápisu, výrez je mnohouholník (roh s nápisom je priehľadný) rozvoz-452|905
#   img/grafika/ albumy „Letáky a bannery“ a „Logo a firemná grafika“: <výrez>-n.avif|webp (náhľad, dlhšia strana najviac
#                480 px) a <výrez>-v.webp (veľký po kliknutí)
# Použitie (v priečinku webu): bash nastroje/grafika_maria.sh   (ImageMagick a ffmpeg s libaom-av1 a libwebp)
set -euo pipefail
cd "$(dirname "$0")/.."
Z=zdroj/grafika-maria; O=img/ilu; G=img/grafika
mkdir -p "$O" "$G"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

kod() {   # kod <png> <cieľ bez prípony>: WebP a AVIF (WebP cez ffmpeg, ImageMagick 6 pri WebP kvalitu ignoruje)
  ffmpeg -v error -y -i "$1" -c:v libwebp -quality 82 -compression_level 6 "$2.webp"
  ffmpeg -v error -y -i "$1" -vf "scale=out_color_matrix=bt601:out_range=full,format=yuv420p" -c:v libaom-av1 \
    -still-picture 1 -crf 30 -cpu-used 3 -row-mt 1 -color_range pc -colorspace smpte170m "$2.avif"
  echo "$2: $(identify -format '%wx%h' "$2.webp"), webp $(stat -c %s "$2.webp") B, avif $(stat -c %s "$2.avif") B"
}

urob() {   # urob <výrez> <cieľ> <orez WxH+X+Y alebo „stvorec“ alebo „cely“> <šírky…>
  local src=$Z/$1.webp out=$O/$2 orez=$3; shift 3
  local w h s
  read -r w h < <(identify -format '%w %h\n' "$src")
  case $orez in
    stvorec) s=$(( w < h ? w : h )); orez="${s}x${s}+$(( (w - s) / 2 ))+$(( (h - s) / 2 ))" ;;
    cely) orez="${w}x${h}+0+0" ;;
  esac
  for sir in "$@"; do
    # zmenšenie Lanczos v pôvodnom priestore farieb, potom jemné doostrenie (len hrany, priemerná farba sa nemení)
    convert "$src" -crop "$orez" +repage -filter Lanczos -resize "${sir}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/x.png"
    kod "$TMP/x.png" "$out-$sir"
  done
}

vyrez() {   # vyrez <výrez> <cieľ> <orez WxH+X+Y>: len orez a prevod formátu (1 : 1, bez zmenšenia a doostrenia)
  convert "$Z/$1.webp" -crop "$3" +repage -strip "$TMP/x.png"
  kod "$TMP/x.png" "$O/$2"
}

if [[ ${1:-} == 17-11 ]]; then
  source <(sed -n '/^cast_17_11() {/,/^}/p' "$0"); cast_17_11; exit 0
fi
if [[ ${1:-} == 18-11 ]]; then
  source <(sed -n '/^cast_18_11() {/,/^}/p' "$0"); cast_18_11; exit 0
fi

# séria ilustrácií skupín tovaru: dlaždice skupín na úvode a v Katalógu (do 480 px) a výzva „Potrebujete cenu…“ na
# stránkach kategórií (200 a 400 px); Dlažby sú zatiaľ z obrázka iného štýlu (alt-dlazby), kým Mário nepošle sériový
for p in sypke-zmesi murovaci-material stresne-krytiny izolacny-material kominovy-system stresne-okna hutny-material \
         okna-dvere rezivo stavebne-naradie podhlady sadrokarton fasadny-system farby-laky; do
  urob "kategoria-$p" "$p" stvorec 200 400 480
done
urob alt-dlazby dlazby stvorec 200 400 480
# Poradenstvo: výzva „Nenašli ste…“ v Katalógu
urob kategoria-poradenstvo poradenstvo stvorec 200 400
# Kontakt: karty Zavolajte nám a Napíšte nám (obrázok len pri údajoch, ktoré ukazuje – sprava/sablony/kontakt-karty.html)
urob ikona-zavolajte kontakt-zavolajte 800x600+260+50 288 480
urob ikona-napiste-nam kontakt-napiste 800x600+260+50 288 480
# Služby: výzva pred pätou
urob ikona-zdarma-vypocet zdarma-vypocet cely 480 790 1080
# Služby: karta zliav (obrázok len pri zľave 5 % a 3,3 % – sprava/sablony/sluzby-zlavy.html)
urob ikona-zlavy zlavy 800x600+236+12 288 480
# Kontakt: hodiny v karte Otváracie hodiny (obrázok len pri hodinách, ktoré ukazuje – sprava/sablony/hodiny-kontakt.html)
urob ikona-otvaracie-hodiny kontakt-hodiny 710x533+300+95 144 288

# Doprava: auto z obrázka „Rozvoz stavebného materiálu“ bez nápisu (druhý riadok nápisu má nosnosť „AVIA 3t“, web a majiteľ
# hovoria 3,5 t – README). Nápis leží šikmo tesne pod autom, obdĺžnik s celým autom bez nápisu neexistuje, preto je výrez
# mnohouholník: obdĺžnik 905 × 598 + 205 + 12 bez rohu pod lomenou čiarou 3 – 4 px nad písmenami. Roh je priehľadný (maska =
# orez, okraj 1 px), farba pod priehľadnou časťou je zjednotená na farbu pozadia; pixely auta sa nemenia. Rámik na stránke
# má farbu pozadia obrázka (site.css .rozvoz).
CIARA="300,598 316,586 350,578 395,567 495,541 595,517 645,493 695,492 735,484 835,458 865,439 905,434 905,598"
for sir in 452 905; do
  convert "$Z/auto-rozvoz.webp" -crop 905x598+205+12 +repage \
    \( -size 905x598 xc:white -fill black -draw "polygon $CIARA" -blur 0x1 -level 50%,100% \) -alpha off -compose CopyOpacity -composite \
    -background '#e3e5e7' -alpha background -filter Lanczos -resize "${sir}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/r.png"
  ffmpeg -v error -y -i "$TMP/r.png" -c:v libwebp -quality 84 -compression_level 6 "$O/rozvoz-$sir.webp"
  ffmpeg -v error -y -i "$TMP/r.png" -filter_complex "[0:v]scale=out_color_matrix=bt601:out_range=full,format=yuva420p,split[a][b];[b]alphaextract[al]" \
    -map "[a]" -map "[al]" -c:v libaom-av1 -still-picture 1 -crf 30 -cpu-used 3 -row-mt 1 -color_range pc -colorspace smpte170m "$O/rozvoz-$sir.avif"
  echo "$O/rozvoz-$sir: $(identify -format '%wx%h' "$O/rozvoz-$sir.webp"), webp $(stat -c %s "$O/rozvoz-$sir.webp") B, avif $(stat -c %s "$O/rozvoz-$sir.avif") B"
done

# Albumy grafiky (Leták „Letáky a bannery“, Galéria „Logo a firemná grafika“; data/galeria.json): celý výrez bez orezu.
# Veľký obrázok = najviac skutočný detail výrezu (druhé číslo; zmerané z ostrosti snímok), náhľad = dlhšia strana 480 px.
# Mená sú stabilné: opravená verzia od Mária sa vymení 1 : 1 (nový výrez do zdroja pod tým istým menom a tento skript).
album() {   # album <výrez> <šírka veľkého>
  local src=$Z/$1.webp w h n
  read -r w h < <(identify -format '%w %h\n' "$src")
  n=$(( w >= h ? 480 : (480 * w + h / 2) / h )); (( n > $2 )) && n=$2
  convert "$src" -filter Lanczos -resize "${n}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/x.png"
  kod "$TMP/x.png" "$G/$1-n"
  convert "$src" -filter Lanczos -resize "${2}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/x.png"
  ffmpeg -v error -y -i "$TMP/x.png" -c:v libwebp -quality 80 -compression_level 6 "$G/$1-v.webp"
  echo "$G/$1-v: $(identify -format '%wx%h' "$G/$1-v.webp"), webp $(stat -c %s "$G/$1-v.webp") B"
}
album letak-preco-nakupovat 660
album letak-stavebniny-richtarik 659
album banner-kompletne-systemy 1320
album banner-super-ceny 1320
album logo-rs-vodorovne 1190
album logo-rs-pod-sebou 1190
album logo-rs-cierna-doska 1190
album tabula-siroka 1140
album tabula-vysoka 790
album vizitka 1190
# päta každej stránky (Mário 18. 11. 2026: „celkom dole moju vizitku dať v 3D prevedení“; oblasť pata-grafika): ten istý
# výrez vo väčších šírkach 720 a 960 px (telefón celá šírka, počítač 440 px pri DPR 2); 480 px je náhľad vizitka-n
for s in 720 960; do
  convert "$Z/vizitka.webp" -filter Lanczos -resize "${s}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/x.png"
  kod "$TMP/x.png" "$G/vizitka-p-$s"
done
album karta 1140
# päť piktogramov iného štýlu (alt-*) majiteľ 18. 11. 2026 dal z Galérie zmazať; ich súbory img/grafika/alt-* sa už nevyrábajú
# ani nepoužívajú (do balíka nejdú), výrezy ostávajú v zdroji (alt-auto-zlte je zdroj obrázka služby Doprava na stavbu)

# Pokyny majiteľa zo 17. 11. 2026 („služby – použiť všetky piktogramy 3D“, „použiť 3D zákaznícku kartu“, „naše tabule 3D“):
# rovnaké výrezy, len iný orez a veľkosti (najviac skutočný detail výrezu, nič sa nezväčšuje). Spustenie len tejto časti:
#   bash nastroje/grafika_maria.sh 17-11
# Služby, rámik 4 : 3 pri službe (oblasť sluzby-polozky): „Zdarma výpočet“ celý obrázok s nápisom (960 × 720 zo stredu)
# a Poradenstvo (1320 × 1000 okolo postavičiek a pultu, v rámiku 4 : 3 object-fit cover – o 0,7 % výšky menej); ikona zliav je hotová (zlavy-288|480)
# 3D zákaznícka karta (úvod a Služby): karta s tieňom bez prázdneho okraja, 915 × 714 → do 820 px (detail výrezu ≈ 0,9)
# tabule: vysoká (adresa, telefóny, e-mail, hodiny) na Kontakte 997 × 1617 → do 480 px, široká na O nás 935 × 480 → do 820 px
cast_17_11() {
  urob ikona-zdarma-vypocet sluzba-vypocet 960x720+187+0 240 480
  urob kategoria-poradenstvo sluzba-poradenstvo 1320x1000+0+190 240 480
  urob karta karta-3d 915x714+214+90 480 820
  urob tabula-vysoka tabula-vysoka-k 997x1617+175+81 240 480
  urob tabula-siroka tabula-siroka-o 935x480+173+22 480 820
}
cast_17_11

# Pokyny majiteľa z 18. 11. 2026 (e-mail „treba opravit“): „Služby – doplniť piktogramy, čo som Vám poslal, 3D: stavebný
# materiál v celom sortimente, Doprava na stavbu, platba platobnou kartou“. Samostatné obrázky týchto troch piktogramov
# v podkladoch nie sú, preto dočasne výrezy z jeho grafík (README Čaká na podklady), rámik 4 : 3 ako pri 02 – 04:
#   01 mriežka 12 ikon skupín tovaru z letáku so sortimentom (bez piateho stĺpca s druhým „Murovací materiál“) 508 × 381
#   05 jeho 3D žlté auto s paletami (do 18. 11. 2026 piktogram v Galérii) 900 × 675
#   07 ikona „VÚB BANKA – platby cez terminál“ z letáku „Prečo nakupovať u nás“ – v letáku má len 180 × 135, preto jediný
#      súbor 180 px bez zmenšenia a bez doostrenia (na telefóne rámik najviac 180 px, nič sa nezväčšuje)
# Spustenie len tejto časti: bash nastroje/grafika_maria.sh 18-11
cast_18_11() {
  urob letak-stavebniny-richtarik sluzba-sortiment 508x381+0+443 240 480
  urob alt-auto-zlte sluzba-doprava 900x675+202+36 240 480
  vyrez letak-preco-nakupovat sluzba-platba-180 180x135+312+431
  # úvod, pás faktov pod prvou obrazovkou (e-mail 10:38: „…pod ním je názov Zákaznícka karta, sú tam tie zľavy – tam treba dať
  # tiež obrázok 3D zákazníckej karty, miniatúra“): ten istý výrez ako karta-3d, len menší (84 / 104 px pri DPR 1 – 3)
  urob karta karta-3d-mini 915x714+214+90 208 312
}
cast_18_11
