#!/bin/sh
# Zbalí 3D scénu (src/intro.js + použité časti three.js) do assets/intro.js.
# Potrebuje Node 18+. three a esbuild sa stiahnu len do dočasného priečinka, repozitár zostane bez node_modules.
set -e
cd "$(dirname "$0")"
TMP="${TMPDIR:-/tmp}/gymklub-3d-build"
mkdir -p "$TMP"
[ -d "$TMP/node_modules/three" ] || (cd "$TMP" && npm init -y >/dev/null && npm i --no-audit --no-fund three@0.186.1 esbuild@0.25 >/dev/null)
NODE_PATH="$TMP/node_modules" "$TMP/node_modules/.bin/esbuild" src/intro.js --bundle --format=esm --minify --target=es2020 \
  --legal-comments=eof --outfile=assets/intro.js
ls -la assets/intro.js
