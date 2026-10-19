#!/usr/bin/env bash
# Doplnenie času CPU vlákna (tdur) pre behy matice, ktoré ho ešte nemali (telefón CPU 6×, počítač CPU 1×), a Lighthouse.
set -u
D="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$D/vysledky}"
URL="${URL:-http://127.0.0.1:8433/barbershop-30/}"
LH="${LH:-/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/lh-tool/node_modules/.bin/lighthouse}"
run() { echo "=== $(date +%T) záťaž $(cut -d' ' -f1-3 /proc/loadavg) | $*"; timeout 3600 node --max-old-space-size=8000 "$D/meraj.mjs" --url="$URL" --out="$OUT" "$@" 2>&1 | grep -E '^(skrol|práca|chyby)'; }
run --zariadenie=telefon --cpu=6 --film=off --fazy=skrol --meno=cpu-telefon-cpu6-film-off
run --zariadenie=telefon --cpu=6 --film=on --fazy=skrol --skrol=stredne,svih --maxPass=200 --meno=cpu-telefon-cpu6-film-on
run --zariadenie=pocitac --cpu=1 --film=off --fazy=skrol --meno=cpu-pocitac-cpu1-film-off
run --zariadenie=pocitac --cpu=1 --film=on --fazy=skrol --skrol=stredne,svih --maxPass=150 --meno=cpu-pocitac-cpu1-film-on
lh() { echo "=== $(date +%T) lighthouse $1 záťaž $(cut -d' ' -f1-3 /proc/loadavg)"; CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome timeout 300 "$LH" "$2" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance $3 --output=json --output-path="$D/lighthouse/$1.json" >/dev/null 2>&1; node -e 'const r=require(process.argv[1]); const a=r.audits; console.log(process.argv[2], "skóre", Math.round(r.categories.performance.score*100), "FCP", a["first-contentful-paint"].displayValue, "LCP", a["largest-contentful-paint"].displayValue, "TBT", a["total-blocking-time"].displayValue, "CLS", a["cumulative-layout-shift"].displayValue, "SI", a["speed-index"].displayValue, "benchmarkIndex", r.environment.benchmarkIndex)' "$D/lighthouse/$1.json" "$1"; }
mkdir -p "$D/lighthouse"
for i in 1 2; do lh "mobil-predvolene-r$i" "$URL" ""; lh "mobil-film-off-r$i" "${URL}?film=off" ""; done
lh "pocitac-predvolene" "$URL" "--preset=desktop"
echo "=== $(date +%T) hotovo"
