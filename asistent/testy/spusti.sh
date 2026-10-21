#!/bin/sh
# Testy asistenta proti falošnému API (testy/mock-api.php): stav, prúd odpovede po kúskoch, čo ide do API,
# kontrola vstupu, pôvod, limit otázok, chyba a odmietnutie. Potrebuje php a curl, vendor/ (composer install).
#   sh asistent/testy/spusti.sh
set -u
cd "$(dirname "$0")/.."
T=$(mktemp -d); ok=0; zle=0
skus() { if eval "$2"; then ok=$((ok+1)); echo "OK   $1"; else zle=$((zle+1)); echo "FAIL $1"; fi; }
cat > "$T/config.php" <<PHP
<?php return ['kluc' => 'sk-ant-test', 'db' => '$T/a.sqlite', 'za_10_min' => 3, 'za_den' => 50, 'spolu_za_den' => 100];
PHP
MOCK_LOG="$T/api.log" php -S 127.0.0.1:8901 testy/mock-api.php >/dev/null 2>&1 &
M=$!
ANTHROPIC_BASE_URL=http://127.0.0.1:8901 ASISTENT_CONFIG="$T/config.php" php -S 127.0.0.1:8902 -t . >"$T/server.log" 2>&1 &
S=$!
trap 'kill $M $S 2>/dev/null; rm -rf "$T"' EXIT
sleep 1
U=http://127.0.0.1:8902/api.php
O='Origin: https://d8f5s88zjy-art.github.io'
otazka() { curl -s -N -H "$O" -H 'Content-Type: application/json' --data "$1" "$U?a=otazka"; }

skus "stav: zapnutý s kľúčom" '[ "$(curl -s "$U?a=stav")" = "{\"ok\":true,\"zapnute\":true}" ]'
skus "CORS pre web na GitHub Pages" 'curl -s -i -X OPTIONS -H "$O" "$U?a=otazka" | grep -qi "access-control-allow-origin: https://d8f5s88zjy-art.github.io"'
skus "cudzí pôvod odmietnutý" '[ "$(curl -s -o /dev/null -w %{http_code} -H "Origin: https://zly.example" "$U?a=stav")" = 403 ]'

# prúd: prvý kúsok príde skôr ako posledný (odpoveď sa neposiela až na konci)
otazka '{"prevadzka":"barbershop","jazyk":"en","spravy":[{"r":"u","t":"Koľko stojí strih?"}]}' | while IFS= read -r r; do printf '%s %s\n' "$(date +%s%N)" "$r"; done > "$T/prud.txt"
skus "odpoveď prišla celá" 'grep -q "stojí 18" "$T/prud.txt" && grep -q "event: koniec" "$T/prud.txt"'
skus "odpoveď ide po kúskoch (prvý kúsok aspoň 0,4 s pred koncom)" 'a=$(grep "Pánsky" "$T/prud.txt" | head -1 | cut -d" " -f1); b=$(grep "event: koniec" "$T/prud.txt" | cut -d" " -f1); [ $(( (b - a) / 1000000 )) -ge 400 ]'
J=$(tail -1 "$T/api.log")
skus "model Claude Opus 5.5" 'echo "$J" | grep -q "\"model\":\"claude-opus-5-5\""'
skus "prúd, úsilie low, záložný model" 'echo "$J" | grep -q "\"stream\":true" && echo "$J" | grep -q "\"effort\":\"low\"" && echo "$J" | grep -q "\"fallbacks\":\"default\"" && echo "$J" | grep -q "server-side-fallback-2026-07-01"'
skus "pokyny so znalosťami v cache, jazyk stránky zvlášť" 'echo "$J" | grep -q "cache_control" && echo "$J" | grep -q "Mostná 30" && echo "$J" | grep -q "Jazyk stránky návštevníka: en"'
skus "kľúč ide len do API" 'echo "$J" | grep -q "\"kluc\":\"sk-ant-test\"" && ! grep -q "sk-ant-test" "$T/prud.txt"'

skus "rozhovor musí končiť otázkou" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"a\"},{\"r\":\"a\",\"t\":\"b\"}]}" | grep -q "Neplatný rozhovor"'
skus "neznáma prevádzka" 'otazka "{\"prevadzka\":\"x\",\"spravy\":[{\"r\":\"u\",\"t\":\"a\"}]}" | grep -q "Neznáma prevádzka"'
skus "dlhý rozhovor odmietnutý" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[$(for i in $(seq 1 17); do [ $((i%2)) = 1 ] && printf "{\"r\":\"u\",\"t\":\"x\"}," || printf "{\"r\":\"a\",\"t\":\"y\"},"; done | sed "s/,$//")]}" | grep -q "príliš dlhý"'
skus "otázka sa skráti na 800 znakov" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"$(head -c 2000 /dev/zero | tr "\0" "a")\"}]}" >/dev/null; tail -1 "$T/api.log" | python3 -c "import sys,json; m=json.loads(sys.stdin.read())[\"telo\"][\"messages\"][-1][\"content\"]; sys.exit(0 if len(m)==800 else 1)"'
skus "chyba API: zdvorilá správa" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"CHYBA500\"}]}" | grep -q "event: chyba"'
skus "limit: štvrtá otázka za 10 minút odmietnutá (limit 3 v teste)" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"ahoj\"}]}" | grep -q "Veľa otázok"'
rm -f "$T/a.sqlite"*
skus "odmietnutie modelu: správa namiesto konca" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"ODMIETNI\"}]}" | grep -q "Na toto neodpoviem"'
skus "bez varovaní PHP" '! grep -qi "warning\|fatal\|deprecated" "$T/server.log"'
echo "$ok OK, $zle FAIL"
[ "$zle" = 0 ]
