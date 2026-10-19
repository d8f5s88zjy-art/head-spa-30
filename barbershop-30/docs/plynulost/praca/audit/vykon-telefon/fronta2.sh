#!/usr/bin/env bash
# Pokusy A/B na príčiny zaseknutí pokojnej verzie (film vypnutý) na telefóne CPU 4×: jeden mechanizmus sa vypne
# vloženým CSS/JS alebo parametrom adresy (repozitár sa nemení) a porovná sa CPU hlavného vlákna na snímku.
set -u
D="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$D/vysledky}"
URL="${URL:-http://127.0.0.1:8433/barbershop-30/}"
run() { echo "=== $(date +%T) záťaž $(cut -d' ' -f1-3 /proc/loadavg) | $*"; timeout 3600 node --max-old-space-size=8000 "$D/meraj.mjs" --url="$URL" --out="$OUT" "$@" 2>&1 | grep -E '^(skrol|práca|  CPU|chyby)' ; }
AB="--zariadenie=telefon --cpu=4 --film=off --fazy=skrol --skrol=stredne,svih"
# zápis --sp (prejazd zálohy 1 → 1,06 a posun dosky) ignorovaný
SP="(function(){var f=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(n){if(n==='--sp')return;return f.apply(this,arguments);};})();"
# zápis --o a --so (krytie titulných kariet a záloh) ignorovaný
OSO="(function(){var f=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(n){if(n==='--o'||n==='--so')return;return f.apply(this,arguments);};})();"
run $AB --meno=ab2-zaklad
run $AB --param=hudba=off --meno=ab2-bez-hudby
run $AB --js="$SP" --meno=ab2-bez-sp
run $AB --js="$OSO" --meno=ab2-bez-o-so
run $AB --css=".js-kin .kin .kw,.js-steps .steps li{transition:none!important;filter:none!important;opacity:1!important;transform:none!important}" --meno=ab2-bez-kin
run $AB --css="html.karty .film-shot.is-title .film-still{display:none!important}" --meno=ab2-bez-zaloh
run $AB --js="$SP" --param=hudba=off --css=".js-kin .kin .kw,.js-steps .steps li{transition:none!important;filter:none!important;opacity:1!important;transform:none!important}.btn-primary::after,.beam>.beam-line::before,.marquee-track{animation:none!important}" --meno=ab2-bez-vsetkeho
echo "=== $(date +%T) hotovo"
