#!/usr/bin/env bash
# Pokračovanie auditu (po prerušení relácie): diagnostika príčin, počítač CPU 4×, gestá synthesizeScrollGesture,
# pokusy A/B (vložené CSS, repozitár sa nemení) a opakovania telefónu (rozptyl). Výstup: vysledky/ a fronta.log
set -u
D="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$D/vysledky}"
URL="${URL:-http://127.0.0.1:8433/barbershop-30/}"
mkdir -p "$OUT"
run() { echo "=== $(date +%T) záťaž $(cut -d' ' -f1-3 /proc/loadavg) | $*"; timeout 3600 node --max-old-space-size=8000 "$D/meraj.mjs" --url="$URL" --out="$OUT" --vernost=1 "$@" 2>&1 | grep -v '^  vlákno' | tail -30; }
echo "=== $(date +%T) styl"; timeout 900 node --max-old-space-size=8000 "$D/styl.mjs" --url="$URL" --film=off --cpu=4 2>&1 | tail -45
echo "=== $(date +%T) nahravanie"; timeout 600 node "$D/nahravanie.mjs" --url="$URL" --cpu=4 2>&1 | tail -80
echo "=== $(date +%T) necinnost"; timeout 600 node "$D/necinnost.mjs" --url="$URL" --cpu=4 --sekund=15 2>&1 | tail -20
run --zariadenie=pocitac --cpu=4 --film=off
run --zariadenie=pocitac --cpu=4 --film=predvolene
run --zariadenie=pocitac --cpu=4 --film=on --maxPass=150
run --zariadenie=telefon --cpu=4 --film=off --fazy=skrol --gesto=synth --skrol=pomaly,stredne,svih,hore --meno=synth-telefon-cpu4-film-off
run --zariadenie=telefon --cpu=4 --film=on --fazy=skrol --gesto=synth --skrol=stredne,svih --maxPass=150 --meno=synth-telefon-cpu4-film-on
AB="--fazy=skrol --skrol=stredne,svih"
run --zariadenie=telefon --cpu=4 --film=off $AB --meno=ab-telefon-off-zaklad
run --zariadenie=telefon --cpu=4 --film=off $AB --css=".film-still img{transform:none!important;will-change:auto!important}" --meno=ab-telefon-off-bez-scale-zaloh
run --zariadenie=telefon --cpu=4 --film=off $AB --css=".hudba-eq i,.btn-primary::after,.beam>.beam-line::before,.marquee-track{animation:none!important}.js-kin .kin .kw,.js-steps .steps li{transition:none!important;filter:none!important;opacity:1!important;transform:none!important}" --meno=ab-telefon-off-bez-animacii
run --zariadenie=pocitac --cpu=1 --film=off $AB --meno=ab-pocitac-off-zaklad
run --zariadenie=pocitac --cpu=1 --film=off $AB --css="*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}" --meno=ab-pocitac-off-bez-backdrop
run --zariadenie=telefon --cpu=4 --film=off --meno=telefon-cpu4-film-off-fast4g-r2
run --zariadenie=telefon --cpu=4 --film=predvolene --meno=telefon-cpu4-film-predvolene-fast4g-r2
run --zariadenie=telefon --cpu=4 --film=on --maxPass=200 --meno=telefon-cpu4-film-on-fast4g-r2
echo "=== $(date +%T) hotovo"
