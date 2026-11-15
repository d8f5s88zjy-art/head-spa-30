#!/usr/bin/env bash
# End-to-end test správy na kópii webu v /dev/shm (nikdy nie na hostingu): balík so správou → kópia → php -S → Playwright.
#   bash sprava/testy/e2e.sh <priečinok snímok> [port, predvolene 9411]
# Beží dvakrát (390 × 844 telefón, 1440 × 900 počítač), zakaždým na čistej kópii. Na konci server ukončí a kópiu zmaže.
set -euo pipefail
R="$(cd "$(dirname "$0")/../.." && pwd)"; SNIMKY="$(mkdir -p "$1" && cd "$1" && pwd)"; PORT="${2:-9411}"
T=/dev/shm/rs-sprava-e2e; rm -rf "$T"; mkdir -p "$T"
python3 "$R/sprava/testy/vstupy.py" "$T/vstupy" > /dev/null
REV=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["revizia"])' "$R/data/verzia.json")
SPRAVA=1 SPRAVA_REVIZIA=$REV bash "$R/nasadenie/balik.sh" "$R" "$T/balik" > "$T/balik.log"
VYSLEDOK=0
for V in "390 844" "1440 900"; do
  set -- $V
  rm -rf "$T/host"; mkdir -p "$T/host"; cp -r "$T/balik/web" "$T/host/www"
  (cd "$T/host/www" && PHP_CLI_SERVER_WORKERS=4 php -d upload_max_filesize=32M -d post_max_size=34M -d memory_limit=256M -S 127.0.0.1:$PORT -t "$T/host/www" "$R/sprava/testy/router.php" > "$T/server-$1.log" 2>&1 & echo $! > "$T/server.pid")
  sleep 1
  node "$R/sprava/testy/e2e.mjs" "http://127.0.0.1:$PORT/" "$T/host/sprava-data" "$T/vstupy" "$1" "$2" "$SNIMKY" || VYSLEDOK=1
  kill "$(cat "$T/server.pid")" 2>/dev/null || true; pkill -f "php .* -S 127.0.0.1:$PORT" 2>/dev/null || true
  sleep 0.5
done
rm -rf "$T"
exit $VYSLEDOK
