#!/usr/bin/env bash
# Celá matica meraní (telefón CPU 4× a 6×, počítač CPU 1× a 4×, film on/off/predvolene, Fast 4G) + čierne okná.
# Spúšťať pred aj po opravách: OUT=<priečinok> URL=<adresa> ./matica.sh
set -u
D="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$D/vysledky}"
URL="${URL:-http://127.0.0.1:8433/barbershop-30/}"
mkdir -p "$OUT"
run() { echo "=== $(date +%T) $*"; timeout 3600 node --max-old-space-size=8000 "$D/meraj.mjs" --url="$URL" --out="$OUT" --vernost=1 "$@" 2>&1 | tail -40; }
cie() { echo "=== $(date +%T) cierne $*"; timeout 1800 node "$D/cierne.mjs" --url="$URL" --out="$OUT" "$@" 2>&1 | tail -60; }
CAST="${1:-vsetko}"   # telefon | pocitac | cierne | vsetko (časti sa dajú pustiť osobitne)
if [ "$CAST" = telefon ] || [ "$CAST" = vsetko ]; then
run --zariadenie=telefon --cpu=4 --film=off
run --zariadenie=telefon --cpu=4 --film=predvolene
run --zariadenie=telefon --cpu=4 --film=on --maxPass=200
run --zariadenie=telefon --cpu=6 --film=off
run --zariadenie=telefon --cpu=6 --film=predvolene
run --zariadenie=telefon --cpu=6 --film=on --maxPass=200
fi
if [ "$CAST" = pocitac ] || [ "$CAST" = vsetko ]; then
run --zariadenie=pocitac --cpu=1 --film=off
run --zariadenie=pocitac --cpu=1 --film=predvolene
run --zariadenie=pocitac --cpu=1 --film=on --maxPass=150
run --zariadenie=pocitac --cpu=4 --film=off
run --zariadenie=pocitac --cpu=4 --film=predvolene
run --zariadenie=pocitac --cpu=4 --film=on --maxPass=150
fi
if [ "$CAST" = cierne ] || [ "$CAST" = vsetko ]; then
cie --zariadenie=telefon --cpu=4 --film=off
cie --zariadenie=telefon --cpu=4 --film=predvolene
cie --zariadenie=telefon --cpu=4 --film=on
cie --zariadenie=telefon --cpu=4 --film=off --siet=slow4g
cie --zariadenie=pocitac --cpu=1 --film=on
fi
echo "=== $(date +%T) hotovo"
