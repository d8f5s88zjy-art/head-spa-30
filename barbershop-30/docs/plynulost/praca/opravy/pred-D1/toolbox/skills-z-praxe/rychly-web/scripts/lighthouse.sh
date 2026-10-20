#!/usr/bin/env bash
# Niekoľko behov Lighthouse (telefón aj počítač) do jedného priečinka a súhrn.
# Použitie:
#   lighthouse.sh <adresa> [behy_telefon=5] [behy_pocitac=2] [priecinok=./lh]
# Meraj naživo (alebo na serveri s gzipom ako GitHub Pages); lokálny server bez kompresie dá na telefóne
# oveľa horšie LCP. Chromium: CHROME_PATH, inak /opt/pw-browsers/chromium (Playwright).
set -euo pipefail

URL=${1:?použitie: lighthouse.sh <adresa> [behy_telefon] [behy_pocitac] [priecinok]}
NM=${2:-5}
ND=${3:-2}
OUT=${4:-./lh}
LH=${LH:-lighthouse@12.8.2}
export CHROME_PATH=${CHROME_PATH:-/opt/pw-browsers/chromium}
[ -x "$CHROME_PATH" ] || { echo "chyba: Chromium nenájdené ($CHROME_PATH), nastav CHROME_PATH" >&2; exit 1; }
mkdir -p "$OUT"
FLAGS=(--quiet --output=json --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox")

# behy jeden po druhom: súbežné testy na tom istom stroji menia výsledok (rozptyl)
for i in $(seq 1 "$NM"); do
  npx -y "$LH" "$URL" "${FLAGS[@]}" --output-path="$OUT/m$i.json" || echo "beh m$i zlyhal" >&2
done
for i in $(seq 1 "$ND"); do
  npx -y "$LH" "$URL" "${FLAGS[@]}" --preset=desktop --output-path="$OUT/d$i.json" || echo "beh d$i zlyhal" >&2
done
node "$(dirname "$0")/lh-suhrn.mjs" "$OUT"
