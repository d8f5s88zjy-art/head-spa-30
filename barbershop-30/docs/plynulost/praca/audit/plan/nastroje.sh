#!/usr/bin/env bash
# Pripraví čistú kópiu overených meracích nástrojov auditu (len kód, bez výsledkov) pre meranie pred/po.
# Nástroje majú v kóde predvolený port svojho auditu; tu sa všetky prepíšu na <port> (gzip server = <port>+1)
# a cesta k stromu webu (zaplaty.mjs, over-property.mjs, over-galeria.mjs) na <koreň-stromu>.
#
#   bash nastroje.sh <cieľ> <port> [<koreň-stromu>]
#     <cieľ>         nový priečinok, napr. .../barber/opravy/D1/meranie/nastroje-po
#     <port>         port, na ktorom beží `python3 -m http.server <port>` v <koreň-stromu>
#     <koreň-stromu> pracovný strom (predvolene .../scratchpad/hs2); pre „pred“ worktree z commitu pred dávkou
#
# Výsledky nástroje píšu do vlastného priečinka (napr. <cieľ>/overenie-kod-stranka/ab-…/), takže audit ostane netknutý.
set -euo pipefail
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
A=$SP/barber/audit
CIEL=${1:?cieľ}; PORT=${2:?port}; STROM=${3:-$SP/hs2}
GZ=$((PORT + 1))
SADY="cierne-okna overenie-cierne-okna overenie-kod-film overenie-kod-stranka overenie-vykon-telefon overenie-vzhlad-zhoda"
mkdir -p "$CIEL"
for d in $SADY; do
  ( cd "$A/$d" && find . -maxdepth 3 -type f \( -name '*.mjs' -o -name '*.js' -o -name '*.py' -o -name '*.sh' -o -name 'zamena-*.json' -o -name 'matica*.txt' \) -size -300k \
      -not -path './runs/*' -not -path './dokazy*' -not -path './stopy/*' -not -path './vysledky/*' -not -path './snimky/*' \
      -not -path './tmp/*' -not -path './merania/*' -not -path './lighthouse/*' -not -path './beh1/*' -not -path './skok1/*' \
      -not -path './kf02*' -not -path './beh-*' -not -path './ab-*/*' -not -path './dekod/*' -not -path './beh2/merania/*' -not -path './beh2/snimky/*' ) \
  | while read -r f; do mkdir -p "$CIEL/$d/$(dirname "$f")"; cp -f "$A/$d/$f" "$CIEL/$d/$f"; done
done
# port a strom
find "$CIEL" -type f \( -name '*.mjs' -o -name '*.js' -o -name '*.py' -o -name '*.sh' \) -print0 | xargs -0 sed -i -E \
  -e "s/\b(8174|8211|8248|8285|8359|8433|8470|8507|8544)\b/$PORT/g" -e "s/\b8545\b/$GZ/g" \
  -e "s#$SP/hs2/#$STROM/#g"
# kontrola syntaxe JS modulov (nič nespúšťa)
bad=0
while IFS= read -r -d '' f; do node --check "$f" 2>/dev/null || { echo "syntax: $f"; bad=1; }; done < <(find "$CIEL" -name '*.mjs' -print0)
echo "nástroje: $CIEL (port $PORT, gzip $GZ, strom $STROM)$([ $bad = 1 ] && echo ' – POZOR: chyby syntaxe vyššie')"
