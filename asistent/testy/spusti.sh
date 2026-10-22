#!/bin/sh
# Testy asistenta proti falošnému API (testy/mock-api.php) a falošnému rezervačnému systému (testy/mock-rezervacie.php):
# stav, prúd odpovede po kúskoch, čo ide do API, nástroj na voľné termíny (overené, chyba, bez napojenia),
# tlačidlo Zavolať pri termínoch, objednávkové okno (barberi, dni, voľné časy), kontrola vstupu, pôvod, limit otázok, chyba a odmietnutie; potom testy/kalendar-test.php.
# Potrebuje php a curl, vendor/ (composer install).
#   sh asistent/testy/spusti.sh
set -u
cd "$(dirname "$0")/.."
T=$(mktemp -d); ok=0; zle=0
skus() { if eval "$2"; then ok=$((ok+1)); echo "OK   $1"; else zle=$((zle+1)); echo "FAIL $1"; fi; }
mkdir -p "$T/kal" "$T/kal2" "$T/kal3"
cat > "$T/config.php" <<PHP
<?php return ['kluc' => 'sk-ant-test', 'db' => '$T/a.sqlite', 'za_10_min' => 6, 'za_den' => 50, 'spolu_za_den' => 100, 'cache_dir' => '$T/kal2', 'kalendar' => ['url' => 'http://127.0.0.1:8903', 'timeout' => 2.0]];
PHP
cat > "$T/config-bez.php" <<PHP
<?php return ['kluc' => 'sk-ant-test', 'db' => '$T/b.sqlite', 'cache_dir' => '$T/kal3'];
PHP
echo '{}' > "$T/scen.json"
MOCK_LOG="$T/api.log" php -S 127.0.0.1:8901 testy/mock-api.php >/dev/null 2>&1 &
M=$!
MOCK_LOG="$T/rez.log" MOCK_SCEN="$T/scen.json" PHP_CLI_SERVER_WORKERS=4 php -S 127.0.0.1:8903 testy/mock-rezervacie.php >/dev/null 2>&1 &
R=$!
ANTHROPIC_BASE_URL=http://127.0.0.1:8901 ASISTENT_CONFIG="$T/config.php" php -S 127.0.0.1:8902 -t . >"$T/server.log" 2>&1 &
S=$!
ANTHROPIC_BASE_URL=http://127.0.0.1:8901 ASISTENT_CONFIG="$T/config-bez.php" php -S 127.0.0.1:8904 -t . >"$T/server2.log" 2>&1 &
S2=$!
trap 'kill $M $R $S $S2 2>/dev/null; rm -rf "$T"' EXIT
sleep 1
U=http://127.0.0.1:8902/api.php
O='Origin: https://d8f5s88zjy-art.github.io'
otazka() { curl -s -N -H "$O" -H 'Content-Type: application/json' --data "$1" "$U?a=otazka"; }

skus "stav: zapnutý s kľúčom aj kalendárom" '[ "$(curl -s "$U?a=stav")" = "{\"ok\":true,\"zapnute\":true,\"kalendar\":true}" ]'
skus "stav bez napojenia kalendára" '[ "$(curl -s "http://127.0.0.1:8904/api.php?a=stav")" = "{\"ok\":true,\"zapnute\":true,\"kalendar\":false}" ]'
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
skus "nástroj over_volne_terminy (strict) a dnešný deň v Bratislave" 'echo "$J" | grep -q "\"name\":\"over_volne_terminy\"" && echo "$J" | grep -q "\"strict\":true" && echo "$J" | grep -q "Europe/Bratislava"'
skus "pokyny: Barber, AI asistent, slovenčina, telefón pri termínoch" 'echo "$J" | grep -q "Si Barber, AI asistent" && echo "$J" | grep -q "telefón vždy zdvihneme"'

# voľné termíny: model zavolá nástroj, server overí kalendár a vráti výsledok; premýšľanie s podpisom ide späť nezmenené
D1=$(php -r '$d=new DateTimeImmutable("tomorrow", new DateTimeZone("Europe/Bratislava")); while($d->format("N")==7)$d=$d->modify("+1 day"); echo $d->format("Y-m-d");')
D3=$(php -r '$d=(new DateTimeImmutable("tomorrow", new DateTimeZone("Europe/Bratislava")))->modify("+3 days"); while($d->format("N")==7)$d=$d->modify("+1 day"); echo $d->format("Y-m-d");')
echo "{\"$D3\":\"chyba500\"}" > "$T/scen.json"
otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"TERMIN Adrián $D1\"}]}" > "$T/t1.txt"
skus "termín overený: udalosť termin so stavom overene a časmi" 'grep -A1 "event: termin" "$T/t1.txt" | grep -q "\"stav\":\"overene\".*\"casy\":\[\"09:00\",\"10:20\",\"14:00\",\"17:40\"\]"'
skus "termín overený: model dostal výsledok a celú svoju správu späť (podpis premýšľania)" 'grep -q "CELE " "$T/t1.txt" && grep -q "VYSLEDOK overene 09:00,10:20,14:00,17:40" "$T/t1.txt"'
skus "termín overený: tlačidlo Zavolať (udalosť tel) a koniec" 'grep -q "event: tel" "$T/t1.txt" && grep -q "event: koniec" "$T/t1.txt"'
skus "súkromie: meno iného zákazníka sa nedostane do odpovede" '! grep -q "Jana" "$T/t1.txt"'
otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"TERMIN Adrián $D3\"}]}" > "$T/t3.txt"
skus "výpadok rezervačného systému: stav chyba, žiadne časy, tlačidlo Zavolať" 'grep -A1 "event: termin" "$T/t3.txt" | grep -q "\"stav\":\"chyba\"" && ! grep -A1 "event: termin" "$T/t3.txt" | grep -q casy && grep -q "event: tel" "$T/t3.txt"'
curl -s -N -H "$O" -H 'Content-Type: application/json' --data "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"TERMIN Adrián $D1\"}]}" "http://127.0.0.1:8904/api.php?a=otazka" > "$T/t2.txt"
skus "bez napojenia na kalendár: stav nepripojene, tlačidlo Zavolať" 'grep -A1 "event: termin" "$T/t2.txt" | grep -q "\"stav\":\"nepripojene\"" && grep -q "event: tel" "$T/t2.txt"'
skus "otázka na termín bez nástroja: tlačidlo Zavolať" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"Máte zajtra voľný termín?\"}]}" | grep -q "event: tel"'
# objednávkové okno na webe: barberi, dni a voľné časy (len čítanie, vlastný limit)
skus "objednávka: barberi pre službu (len mená, bez Nezáleží)" '[ "$(curl -s -H "$O" "$U?a=barberi&sluzba=1")" = "{\"ok\":true,\"stav\":\"ok\",\"barberi\":[\"Nikolas\",\"Adrian\"]}" ]'
skus "objednávka: dni kalendára (rozsah, nedeľa zatvorená, sviatky)" 'curl -s -H "$O" "$U?a=dni&sluzba=1&barber=Adri%C3%A1n" | grep -q "\"stav\":\"ok\",\"barber\":\"Adrian\".*\"zatvorene\":\[\"Ne\"\],\"sviatky\":\[\"2026-12-24\""'
skus "objednávka: voľné časy bez mien iných zákazníkov" 'curl -s -H "$O" "$U?a=terminy&sluzba=1&barber=Adrian&datum=$D1" > "$T/o1.txt"; grep -q "\"stav\":\"overene\".*\"casy\":\[\"09:00\",\"10:20\",\"14:00\",\"17:40\"\]" "$T/o1.txt" && ! grep -q Jana "$T/o1.txt"'
skus "objednávka: výpadok systému = chyba, žiadne časy" 'curl -s "$U?a=terminy&sluzba=1&barber=Adrian&datum=$D3" | grep -v casy | grep -q "\"stav\":\"chyba\""'
skus "objednávka: neznáma služba a barber" 'curl -s "$U?a=barberi&sluzba=999" | grep -q neznama_sluzba && curl -s "$U?a=dni&sluzba=1&barber=Peter" | grep -q neznamy_barber'
skus "objednávka bez napojenia kalendára: 503" '[ "$(curl -s -o /dev/null -w %{http_code} "http://127.0.0.1:8904/api.php?a=barberi&sluzba=1")" = 503 ]'
skus "objednávka: cudzí pôvod odmietnutý" '[ "$(curl -s -o /dev/null -w %{http_code} -H "Origin: https://zly.example" "$U?a=barberi&sluzba=1")" = 403 ]'
skus "objednávka sa nikdy neodoslala" '! grep -q makeOrder "$T/rez.log"'

skus "rozhovor musí končiť otázkou" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"a\"},{\"r\":\"a\",\"t\":\"b\"}]}" | grep -q "Neplatný rozhovor"'
skus "neznáma prevádzka" 'otazka "{\"prevadzka\":\"x\",\"spravy\":[{\"r\":\"u\",\"t\":\"a\"}]}" | grep -q "Neznáma prevádzka"'
skus "dlhý rozhovor odmietnutý" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[$(for i in $(seq 1 17); do [ $((i%2)) = 1 ] && printf "{\"r\":\"u\",\"t\":\"x\"}," || printf "{\"r\":\"a\",\"t\":\"y\"},"; done | sed "s/,$//")]}" | grep -q "príliš dlhý"'
skus "otázka sa skráti na 800 znakov" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"$(head -c 2000 /dev/zero | tr "\0" "a")\"}]}" >/dev/null; tail -1 "$T/api.log" | python3 -c "import sys,json; m=json.loads(sys.stdin.read())[\"telo\"][\"messages\"][-1][\"content\"]; sys.exit(0 if len(m)==800 else 1)"'
skus "chyba API: zdvorilá správa" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"CHYBA500\"}]}" | grep -q "event: chyba"'
skus "limit: ďalšia otázka za 10 minút odmietnutá (limit 6 v teste)" 'for i in 1 2 3; do otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"ahoj\"}]}" >/dev/null; done; otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"ahoj\"}]}" | grep -q "Veľa otázok"'
rm -f "$T/a.sqlite"*
# (až po teste limitu otázok, ten počíta s jednou databázou) súbežné prvé požiadavky na novú databázu limitov (okno pýta barberov a dni naraz): žiadna chyba 500;
# wait len na tieto curl (bez zoznamu by čakal aj na servery spustené vyššie)
skus "súbežné požiadavky na novú databázu bez chyby (database is locked)" 'zle=0; for i in 1 2 3 4 5 6 7 8; do rm -f "$T"/a.sqlite*; p=""; for j in 1 2 3; do curl -s -o "$T/sub$j.txt" -w "%{http_code}" "$U?a=barberi&sluzba=1" > "$T/kod$j.txt" & p="$p $!"; done; curl -s -o "$T/sub4.txt" -w "%{http_code}" "$U?a=dni&sluzba=1&barber=ktokolvek" > "$T/kod4.txt" & p="$p $!"; wait $p; for j in 1 2 3 4; do [ "$(cat "$T/kod$j.txt")" = 200 ] || zle=$((zle+1)); done; done; [ $zle = 0 ]'
skus "odmietnutie modelu: správa namiesto konca" 'otazka "{\"prevadzka\":\"barbershop\",\"spravy\":[{\"r\":\"u\",\"t\":\"ODMIETNI\"}]}" | grep -q "Na toto neodpoviem"'
skus "bez varovaní PHP" '! grep -qi "warning\|fatal\|deprecated" "$T/server.log" "$T/server2.log"'
echo "$ok OK, $zle FAIL"
echo "--- overenie kalendára (lib/kalendar.php)"
rm -f "$T/rez.log"; echo '{}' > "$T/scen.json"
MOCK_LOG="$T/rez.log" MOCK_SCEN="$T/scen.json" php testy/kalendar-test.php http://127.0.0.1:8903 "$T/kal" || zle=$((zle+1))
[ "$zle" = 0 ]
