#!/usr/bin/env bash
# Nasadenie na samostatnú adresu https://d8f5s88zjy-art.github.io/barbershop30/ (repozitár d8f5s88zjy-art/barbershop30,
# GitHub Pages z vetvy main, koreň). Do repozitára ide len web: index.html, rezervacia.html, assets/, karta/, en/ (vygenerovaná), robots.txt, sitemap.xml a .nojekyll,
# bez source/ a docs/ (pracovné podklady ostávajú v head-spa-30).
# Spustenie z koreňa barbershop-30 po nasadení do main v head-spa-30:
#   bash source/tools/nasad-barbershop30.sh "BARBERSHOP 30: čo sa zmenilo"
set -euo pipefail
SITE=$(cd "$(dirname "$0")/../.." && pwd)
REMOTE=${REMOTE:-https://github.com/d8f5s88zjy-art/barbershop30}
MSG=${1:-"BARBERSHOP 30: aktualizácia webu"}
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT
if git ls-remote --exit-code "$REMOTE" main >/dev/null 2>&1; then
  git clone -q --depth 1 --branch main "$REMOTE" "$W"
else
  git init -q -b main "$W"; git -C "$W" remote add origin "$REMOTE"
fi
# obsah webu nanovo (zmazané súbory zmiznú aj v repozitári webu)
find "$W" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$SITE/index.html" "$SITE/rezervacia.html" "$SITE/robots.txt" "$SITE/sitemap.xml" "$W/"
cp -a "$SITE/assets" "$W/assets"
cp -a "$SITE/karta" "$W/karta"
node "$SITE/source/tools/en-stranka.mjs" "$W"          # anglická stránka en/ z práve skopírovanej index.html
touch "$W/.nojekyll"                                   # súbory sa servírujú tak, ako sú (bez Jekyllu)
cd "$W"
git add -A
if git diff --cached --quiet; then echo "bez zmien"; exit 0; fi
git commit -q -m "$MSG"
git push -q -u origin main
git log --oneline -1
