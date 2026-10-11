#!/usr/bin/env bash
# Ukážka pre BARBERSHOP 30: lower third (názov a adresa) a značka na konci (názov, adresa, výzva), každá
# na 4 s záberu z barbershop-30/source/video/video-3.mp4 zväčšeného na 1080 x 1920, a obe za sebou (8 s).
# Fakty: barbershop-30/docs/CONTENT_SOURCES.md (Identita a kontakt). Video ukazuje zamestnanca spredu
# a klienta zozadu: pred uverejnením súhlas podľa barbershop-30/docs/CHECKS.md časť 5.
#
#   bash toolbox/skills-z-praxe/motion-grafika/scripts/ukazka.sh <výstupný-priečinok>
#
# Výstup do priečinka mimo repozitára: *.mov, *.webm, *-nahlad*.mp4, *-prehlad.png, *-detail.png,
# bs30-ukazka.mp4 (spojené) a bs30-lower-third-nahlad.html (samostatný náhľad s časovou osou).
set -euo pipefail
TU=$(cd "$(dirname "$0")" && pwd)
SKILL=$(dirname "$TU")
KOREN=$(cd "$SKILL/../../.." && pwd)
VON=${1:?použitie: ukazka.sh <výstupný-priečinok>}
V="$KOREN/barbershop-30/source/video/video-3.mp4"
[ -f "$V" ] || { echo "chýba záber $V"; exit 1; }
mkdir -p "$VON"
node "$TU/render.mjs" "$SKILL/priklady/bs30-lower-third.json" --von "$VON" --zaber "$V" --zaber-od 1 --html "$VON/bs30-lower-third-nahlad.html"
node "$TU/render.mjs" "$SKILL/priklady/bs30-znacka.json" --von "$VON" --zaber "$V" --zaber-od 9
# oba náhľady majú rovnaké kódovanie, spoja sa bez prekódovania
ZOZ=$(mktemp)
printf "file '%s'\nfile '%s'\n" "$VON/bs30-lower-third-nahlad-zaber.mp4" "$VON/bs30-znacka-nahlad-zaber.mp4" > "$ZOZ"
ffmpeg -hide_banner -v error -y -f concat -safe 0 -i "$ZOZ" -c copy -movflags +faststart "$VON/bs30-ukazka.mp4"
rm -f "$ZOZ"
echo "spojená ukážka: $VON/bs30-ukazka.mp4"
