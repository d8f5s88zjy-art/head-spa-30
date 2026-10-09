#!/usr/bin/env bash
# Kompresia GLB modelu kresla pre web: zjednodušenie siete, zmenšenie textúr, WebP, meshopt.
# Použitie: source/tools/glb-pipeline.sh <vstup.glb> <výstup.glb> [ratio=0.06] [tex=1024]
set -e
IN=$1; OUT=$2; RATIO=${3:-0.06}; TEX=${4:-1024}
G=/tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/gltf/node_modules/.bin/gltf-transform
TMP=$(mktemp -d)
$G simplify "$IN" $TMP/a.glb --ratio $RATIO --error 0.001
$G resize $TMP/a.glb $TMP/b.glb --width $TEX --height $TEX
$G webp $TMP/b.glb $TMP/c.glb --quality 82
$G meshopt $TMP/c.glb "$OUT" --level high
ls -la "$OUT"; rm -rf $TMP
