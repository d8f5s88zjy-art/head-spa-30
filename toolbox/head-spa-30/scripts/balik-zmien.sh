#!/bin/sh
# Zabalí na nahratie na www.headspa30.sk len tie súbory, ktoré sa líšia od toho, čo je teraz naživo.
# Použitie:  sh toolbox/head-spa-30/scripts/balik-zmien.sh [cieľový-priečinok]
# Výstup v cieľovom priečinku (predvolene <repozitár>/_balik/):
#   headspa30-rozbal-v-www.zip  rozbaliť priamo v /headspa30.sk/www (webFTP: Nahrát, časť Archivy)
#   manifest.txt                md5 a cesta každého súboru v ZIPe, vstup pre kontrola-nahratia.sh
# .htaccess sa do ručného balíka nedáva: na serveri ostáva tak, ako je.
# Ak sa niektorý súbor nedá z webu stiahnuť, skript skončí bez ZIPu (inak by zabalil celý web).
set -e
if [ "$1" = "--jeden" ]; then
  # interný režim pre xargs: porovná jeden súbor s webom (k, web, súbor)
  k=$2; web=$3; f=$4
  u=$(printf '%s' "$f" | sed 's/%/%25/g; s/ /%20/g; s/#/%23/g; s/?/%3F/g')
  t=$(mktemp)
  if curl -s -g -f -L --max-time 60 --retry 3 --retry-all-errors --retry-delay 2 -o "$t" "$web/$u?k=$k"; then
    [ "$(md5sum < "_ftp/$f" | cut -c1-32)" = "$(md5sum < "$t" | cut -c1-32)" ] || echo "$(md5sum < "_ftp/$f" | cut -c1-32) $f"
  else
    # 404 = súbor na webe ešte nie je, patrí do balíka; iná chyba = sieť, zapíše sa na stderr
    c=$(curl -s -g -o /dev/null -w '%{http_code}' --max-time 30 "$web/$u?k=$k" || true)
    if [ "$c" = 404 ]; then echo "$(md5sum < "_ftp/$f" | cut -c1-32) $f"; else echo "NEDOSTUPNE $c $f" >&2; fi
  fi
  rm -f "$t"
  exit 0
fi
TU=$(cd "$(dirname "$0")" && pwd)
KOREN=$(git rev-parse --show-toplevel)
mkdir -p "${1:-$KOREN/_balik}"
CIEL=$(cd "${1:-$KOREN/_balik}" && pwd)
WEB=${WEB:-https://www.headspa30.sk}
cd "$KOREN"
trap 'rm -rf "$KOREN/_ftp" "$CIEL/subory"' EXIT
sh tools/ftp-balik.sh headspa30.sk >/dev/null
k=$(date +%s)
rm -f "$CIEL/manifest.txt" "$CIEL/headspa30-rozbal-v-www.zip" "$CIEL/nedostupne.txt"
(cd _ftp && find . -type f | sed 's|^\./||' | grep -v '^\.htaccess$' | sort) | tr '\n' '\0' \
  | xargs -0 -n 1 -P 6 sh "$TU/balik-zmien.sh" --jeden "$k" "$WEB" 2>"$CIEL/nedostupne.txt" | sort -k2 > "$CIEL/manifest.txt"
if [ -s "$CIEL/nedostupne.txt" ]; then
  echo "Web sa nedal celý stiahnuť ($(wc -l < "$CIEL/nedostupne.txt") súborov, zoznam v $CIEL/nedostupne.txt). Skús neskôr."
  rm -f "$CIEL/manifest.txt"; exit 3
fi
rm -f "$CIEL/nedostupne.txt"
n=$(wc -l < "$CIEL/manifest.txt")
if [ "$n" -eq 0 ]; then echo "Na webe je všetko aktuálne, nie je čo nahrať."; rm -f "$CIEL/manifest.txt"; exit 0; fi
while read -r h f; do mkdir -p "$CIEL/subory/$(dirname "$f")"; cp "_ftp/$f" "$CIEL/subory/$f"; done < "$CIEL/manifest.txt"
(cd "$CIEL/subory" && zip -q -X -9 -r ../headspa30-rozbal-v-www.zip .)
echo "Súborov na nahratie: $n"
echo "ZIP: $CIEL/headspa30-rozbal-v-www.zip ($(du -h "$CIEL/headspa30-rozbal-v-www.zip" | cut -f1))"
echo "Kontrola po nahratí: sh \"$TU/kontrola-nahratia.sh\" \"$CIEL/manifest.txt\""
