#!/usr/bin/env bash
# Spustí maticu nahrávok (rec.mjs) a hneď ich analyzuje (ana.py). Riadok: meno dev net cpu film cache scen [voľby]
#   bash batch.sh matica.txt
cd "$(dirname "$0")"
while read -r name dev net cpu film cache scen extra; do
  [ -z "$name" ] && continue; [[ "$name" == \#* ]] && continue
  if [ -f "runs/$name/ana.json" ] && [ -z "$FORCE" ]; then echo "== $name (hotové)"; continue; fi
  echo "== $name  $(date +%T)"
  timeout 600 node rec.mjs --name="$name" --dev="$dev" --net="$net" --cpu="$cpu" --film="$film" --cache="$cache" --scen="$scen" $extra > "runs_$name.log" 2>&1 || echo "   rec zlyhal: $(tail -3 runs_$name.log)"
  mkdir -p "runs/$name"; mv "runs_$name.log" "runs/$name/rec.log" 2>/dev/null
  python3 ana.py "runs/$name" 2>&1 | head -40
done < "$1"
echo "== hotovo $(date +%T)"
