#!/usr/bin/env bash
# Nasadí hotový web (priečinok alebo jeho časť) do samostatného repozitára, z ktorého beží GitHub Pages
# (vetva main, koreň). Všeobecná verzia barbershop-30/source/tools/nasad-barbershop30.sh.
# Do cieľového repozitára ide len to, čo vymenuješ (web), pracovné podklady (source/, docs/) ostanú doma.
#
#   REMOTE=https://github.com/<účet>/<repozitár> bash nasad-do-repozitara.sh <priečinok-webu> "Správa commitu" index.html assets robots.txt sitemap.xml
#
# Obsah cieľa sa vytvorí nanovo, takže zmazané súbory zmiznú aj tam. Pridá sa .nojekyll (súbory sa
# servírujú tak, ako sú, bez Jekyllu). Bez zmien sa nič necommituje. Commit po slovensky, bez podpisov.
set -euo pipefail
SITE=$(cd "${1:?priečinok webu}" && pwd)
MSG=${2:?správa commitu}
shift 2
[ "$#" -gt 0 ] || { echo "vymenuj súbory a priečinky webu (napr. index.html assets)" >&2; exit 2; }
REMOTE=${REMOTE:?nastav REMOTE na adresu cieľového repozitára}
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT
if git ls-remote --exit-code "$REMOTE" main >/dev/null 2>&1; then
  git clone -q --depth 1 --branch main "$REMOTE" "$W"
else
  git init -q -b main "$W"; git -C "$W" remote add origin "$REMOTE"
fi
# obsah webu nanovo (zmazané súbory zmiznú aj v repozitári webu)
find "$W" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
for f in "$@"; do cp -a "$SITE/$f" "$W/"; done
touch "$W/.nojekyll"
cd "$W"
git add -A
if git diff --cached --quiet; then echo "bez zmien"; exit 0; fi
git commit -q -m "$MSG"
git push -q -u origin main
git log --oneline -1
