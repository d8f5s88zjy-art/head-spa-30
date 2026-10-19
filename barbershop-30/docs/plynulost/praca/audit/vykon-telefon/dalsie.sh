#!/usr/bin/env bash
# Doplnky k matici: opakovania telefónu (rozptyl), načítanie zo servera s gzipom (ako GitHub Pages), film v pokoji,
# cena nahrávania textúr, štýl pri skrole. Výstupy do vysledky/ a dalsie.log.
set -u
D="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$D/vysledky}"
URL="${URL:-http://127.0.0.1:8433/barbershop-30/}"
# server s gzipom (serve, port 8470) – živý web cez proxy kontajnera má oneskorenie desiatok sekúnd, čísla by neboli porovnateľné
GZ="${GZ:-http://127.0.0.1:8470/barbershop-30/}"
mkdir -p "$OUT"
run() { echo "=== $(date +%T) $*"; timeout 3600 node --max-old-space-size=8000 "$D/meraj.mjs" --out="$OUT" --vernost=1 "$@" 2>&1 | tail -40; }
run --url="$URL" --zariadenie=telefon --cpu=4 --film=off --meno=telefon-cpu4-film-off-fast4g-r2
run --url="$URL" --zariadenie=telefon --cpu=4 --film=predvolene --meno=telefon-cpu4-film-predvolene-fast4g-r2
for i in 1 2 3; do run --url="$GZ" --zariadenie=telefon --cpu=4 --film=predvolene --fazy=nacitanie --meno=gzip-telefon-cpu4-predvolene-r$i; done
for i in 1 2; do run --url="$GZ" --zariadenie=telefon --cpu=4 --film=on --fazy=nacitanie,uvod --meno=gzip-telefon-cpu4-on-r$i; done
for i in 1 2; do run --url="$GZ" --zariadenie=pocitac --cpu=1 --film=predvolene --fazy=nacitanie --meno=gzip-pocitac-cpu1-predvolene-r$i; done
echo "=== $(date +%T) necinnost"; timeout 600 node "$D/necinnost.mjs" --url="$URL" --cpu=4 --sekund=15 2>&1 | tail -20
echo "=== $(date +%T) nahravanie"; timeout 600 node "$D/nahravanie.mjs" --url="$URL" --cpu=4 2>&1 | tail -80
echo "=== $(date +%T) styl"; timeout 600 node --max-old-space-size=8000 "$D/styl.mjs" --url="$URL" --film=off --cpu=4 2>&1 | tail -45
echo "=== $(date +%T) hotovo"
