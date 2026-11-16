#!/usr/bin/env bash
# Testy správy webu Barbershop 30 (plný balík pre www.barbershop30.sk):
#   1. kontrola balíka (barbershop-30/source/tools/balik-test.sh),
#   2. testy jednotiek PHP nad kópiou balíka (testy/jednotky.php),
#   3. test v prehliadači proti napodobenine hostingu (barbershop-30/source/tools/sprava-test.mjs).
#
#   bash barbershop-sprava/testy/spusti.sh [<priečinok s NAHRAT-NA-HOSTING>] [--port=9540] [--tmp=<dočasný priečinok>] [--bez-prehliadaca]
#
# Bez priečinka si balík postaví sám (balik-domena.sh, composer pre knižnicu asistenta) do dočasného priečinka.
# Porty: falošné API port, web port + 1, druhý web port + 2, jednotky port + 3. Nič nejde von: asistent hovorí
# s falošným API, voľné termíny sa čítajú z falošného rezervačného systému.
set -uo pipefail
R=$(cd "$(dirname "$0")/../.." && pwd)
BALIK=""; PORT=9540; TMP="${TMPDIR:-/tmp}"; PREHLIADAC=1
for a in "$@"; do case "$a" in --port=*) PORT="${a#--port=}";; --tmp=*) TMP="${a#--tmp=}";; --bez-prehliadaca) PREHLIADAC=0;; *) BALIK="$a";; esac; done
mkdir -p "$TMP"; VLASTNY=""
if [ -z "$BALIK" ]; then
  VLASTNY=$(mktemp -d "$TMP/b30-balik-XXXXXX")
  bash "$R/barbershop-30/source/tools/balik-domena.sh" --von="$VLASTNY" --bez-zip || { echo "FAIL balík sa nepostavil"; exit 1; }
  BALIK="$VLASTNY"
fi
[ -d "$BALIK/NAHRAT-NA-HOSTING" ] && BALIK="$BALIK/NAHRAT-NA-HOSTING"
trap '[ -n "$VLASTNY" ] && rm -rf "$VLASTNY"' EXIT
zle=0
echo "=== 1. kontrola balíka"; bash "$R/barbershop-30/source/tools/balik-test.sh" "$BALIK" || zle=$((zle+1))
echo "=== 2. jednotky PHP"; php "$R/barbershop-sprava/testy/jednotky.php" "$BALIK" "$TMP" "$((PORT+3))" || zle=$((zle+1))
if [ "$PREHLIADAC" = 1 ]; then
  echo "=== 3. prehliadač"; ( cd "$R/barbershop-30" && node source/tools/sprava-test.mjs --balik="$BALIK" --port="$PORT" --tmp="$TMP" ${SNIMKY:+--out="$SNIMKY"} ) || zle=$((zle+1))
fi
[ "$zle" = 0 ] && echo "VŠETKO V PORIADKU" || echo "ZLYHALO ČASTÍ: $zle"
[ "$zle" = 0 ]
