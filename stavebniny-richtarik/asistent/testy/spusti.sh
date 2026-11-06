#!/bin/sh
# Testy asistenta Stavebnín Richtárik proti falošnému API (testy/mock-api.php): stav, CORS a pôvod, prúd odpovede
# po kúskoch, čo ide do API (model, úsilie, záložný model, pokyny so znalosťami v cache, časté otázky mimo cache),
# kľúč len do API, tlačidlo Zavolať pri cene, kontrola vstupu, limit otázok, chyba a odmietnutie, vypnutý bez kľúča.
# Potrebuje php a curl, vendor/ (composer install). Použitie: sh asistent/testy/spusti.sh
set -u
cd "$(dirname "$0")/.."
T=$(mktemp -d); ok=0; zle=0
skus() { if eval "$2"; then ok=$((ok+1)); echo "OK   $1"; else zle=$((zle+1)); echo "FAIL $1"; fi; }
P1=${PORT_API:-9631}; P2=${PORT_SRV:-9632}; P3=${PORT_BEZ:-9633}
cat > "$T/config.php" <<PHP
<?php return ['kluc' => 'sk-ant-test', 'db' => '$T/a.sqlite', 'za_10_min' => 8, 'za_den' => 50, 'spolu_za_den' => 100, 'povody' => ['http://127.0.0.1:9630']];
PHP
cat > "$T/config-bez.php" <<PHP
<?php return ['kluc' => '', 'db' => '$T/b.sqlite'];
PHP
MOCK_LOG="$T/api.log" php -S 127.0.0.1:$P1 testy/mock-api.php >/dev/null 2>&1 &
M=$!
ANTHROPIC_BASE_URL=http://127.0.0.1:$P1 ASISTENT_CONFIG="$T/config.php" php -S 127.0.0.1:$P2 -t . >"$T/server.log" 2>&1 &
S=$!
ANTHROPIC_BASE_URL=http://127.0.0.1:$P1 ASISTENT_CONFIG="$T/config-bez.php" php -S 127.0.0.1:$P3 -t . >/dev/null 2>&1 &
S2=$!
trap 'kill $M $S $S2 2>/dev/null; rm -rf "$T"' EXIT
sleep 1
U=http://127.0.0.1:$P2/api.php
O='Origin: https://www.stavebninyrichtarik.sk'
otazka() { curl -s -N -H "$O" -H 'Content-Type: application/json' --data "$1" "$U?a=otazka"; }

skus "stav: zapnutý s kľúčom a knižnicou" '[ "$(curl -s "$U?a=stav")" = "{\"ok\":true,\"zapnute\":true}" ]'
skus "stav bez kľúča: vypnutý" '[ "$(curl -s "http://127.0.0.1:$P3/api.php?a=stav")" = "{\"ok\":true,\"zapnute\":false}" ]'
skus "otázka bez kľúča: 503, nič nejde do API" '[ "$(curl -s -o /dev/null -w %{http_code} -H "Content-Type: application/json" --data "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"x\"}]}" "http://127.0.0.1:$P3/api.php?a=otazka")" = 503 ] && [ ! -s "$T/api.log" ]'
skus "CORS pre ostrý web" 'curl -s -i -X OPTIONS -H "$O" "$U?a=otazka" | grep -qi "access-control-allow-origin: https://www.stavebninyrichtarik.sk"'
skus "CORS pre pôvod z config.php (náhľad)" 'curl -s -i -X OPTIONS -H "Origin: http://127.0.0.1:9630" "$U?a=otazka" | grep -qi "access-control-allow-origin: http://127.0.0.1:9630"'
skus "cudzí pôvod odmietnutý (403)" '[ "$(curl -s -o /dev/null -w %{http_code} -H "Origin: https://zly.example" "$U?a=stav")" = 403 ]'
skus "neznáma akcia 404, GET otázky 405, iný typ 415" '[ "$(curl -s -o /dev/null -w %{http_code} "$U?a=x")" = 404 ] && [ "$(curl -s -o /dev/null -w %{http_code} "$U?a=otazka")" = 405 ] && [ "$(curl -s -o /dev/null -w %{http_code} --data x "$U?a=otazka")" = 415 ]'

otazka '{"prevadzka":"richtarik","spravy":[{"r":"u","t":"Koľko stojí cement?"}]}' | while IFS= read -r r; do printf '%s %s\n' "$(date +%s%N)" "$r"; done > "$T/prud.txt"
skus "odpoveď prišla celá" 'grep -q "sobota 7:00" "$T/prud.txt" && grep -q "event: koniec" "$T/prud.txt"'
skus "odpoveď ide po kúskoch (prvý kúsok aspoň 0,4 s pred koncom)" 'a=$(grep "Otvorené" "$T/prud.txt" | head -1 | cut -d" " -f1); b=$(grep "event: koniec" "$T/prud.txt" | cut -d" " -f1); [ $(( (b - a) / 1000000 )) -ge 400 ]'
skus "otázka na cenu: tlačidlo Zavolať (udalosť tel)" 'grep -q "event: tel" "$T/prud.txt"'
J=$(tail -1 "$T/api.log")
skus "model claude-opus-5-5, prúd, úsilie low, záložný model" 'echo "$J" | grep -q "\"model\":\"claude-opus-5-5\"" && echo "$J" | grep -q "\"stream\":true" && echo "$J" | grep -q "\"effort\":\"low\"" && echo "$J" | grep -q "\"fallbacks\":\"default\"" && echo "$J" | grep -q "server-side-fallback-2026-07-01"'
skus "bez nástrojov (žiadne tools v požiadavke)" '! echo "$J" | grep -q "\"tools\""'
skus "pokyny so znalosťami v cache (adresa, cenník 28. 1. 2026)" 'echo "$J" | grep -q "cache_control" && echo "$J" | grep -q "Novozámocká 62/68" && echo "$J" | grep -q "28. 1. 2026"'
skus "pokyny: AI asistent, nie človek; ceny nevymýšľa; vykanie" 'echo "$J" | grep -q "Si AI asistent na webe Stavebniny Richtárik" && echo "$J" | grep -q "nie človek" && echo "$J" | grep -q "Ceny nikdy nepočítaj" && echo "$J" | grep -q "vykaj"'
skus "časté otázky mimo cache: overená odpoveď o cemente" 'printf "%s" "$J" | grep -q "cache_control.*ČASTÉ OTÁZKY podobné" && printf "%s" "$J" | grep -q "cement 325 R, 25 kg za 4,42"'
skus "dnešný deň v Bratislave mimo cache" 'echo "$J" | grep -q "Europe/Bratislava"'
skus "kľúč ide len do API, nie do odpovede" 'echo "$J" | grep -q "\"kluc\":\"sk-ant-test\"" && ! grep -q "sk-ant-test" "$T/prud.txt"'
skus "otázka na hodiny bez ceny: bez tlačidla" '! otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"Aké máte otváracie hodiny?\"}]}" | grep -q "event: tel"'

skus "rozhovor musí končiť otázkou" 'otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"a\"},{\"r\":\"a\",\"t\":\"b\"}]}" | grep -q "Neplatný rozhovor"'
skus "neznáma prevádzka (napr. barbershop)" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"a\"}]}" | grep -q "Neznáma prevádzka"'
skus "dlhý rozhovor odmietnutý" 'otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[$(for i in $(seq 1 17); do [ $((i%2)) = 1 ] && printf "{\"r\":\"u\",\"t\":\"x\"}," || printf "{\"r\":\"a\",\"t\":\"y\"},"; done | sed "s/,$//")]}" | grep -q "príliš dlhý"'
skus "otázka sa skráti na 800 znakov" 'otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"$(head -c 2000 /dev/zero | tr "\0" "a")\"}]}" >/dev/null; tail -1 "$T/api.log" | python3 -c "import sys,json; m=json.loads(sys.stdin.read())[\"telo\"][\"messages\"][-1][\"content\"]; sys.exit(0 if len(m)==800 else 1)"'
skus "chyba API: zdvorilá správa s telefónom" 'otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"CHYBA500\"}]}" | grep -A1 "event: chyba" | grep -q "0905 622 223"'
skus "odmietnutie modelom: udalosť chyba, bez koniec" 'otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"ODMIETNI\"}]}" > "$T/o.txt"; grep -q "event: chyba" "$T/o.txt" && ! grep -q "event: koniec" "$T/o.txt"'
skus "limit: ďalšia otázka za 10 minút odmietnutá (limit 8 v teste)" 'for i in 1 2 3; do otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"ahoj\"}]}" >/dev/null; done; otazka "{\"prevadzka\":\"richtarik\",\"spravy\":[{\"r\":\"u\",\"t\":\"ahoj\"}]}" | grep -q "Veľa otázok"'
skus "databáza limitov: len odtlačky a časy, žiadny text otázky" 'python3 -c "import sqlite3,sys; c=sqlite3.connect(\"$T/a.sqlite\"); r=c.execute(\"select kluc from limity\").fetchall(); sys.exit(0 if r and all(k[0]==\"spolu\" or (k[0].startswith(\"ip:\") and len(k[0])==67) for k in r) else 1)"'
skus "server nezapísal rozhovor do logu" '! grep -q "Koľko stojí cement" "$T/server.log"'
echo; echo "$ok OK, $zle FAIL"
[ $zle -eq 0 ]
