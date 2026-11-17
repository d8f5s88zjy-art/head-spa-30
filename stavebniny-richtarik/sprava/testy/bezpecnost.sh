#!/usr/bin/env bash
# Útoky na správu cez HTTP (zoznam 7.2 vo VYBER.md) na KÓPII webu v /dev/shm, nikdy nie na hostingu.
#   bash sprava/testy/bezpecnost.sh [port, predvolene 9412]
# Každý útok musí zlyhať. Na konci server ukončí a kópiu zmaže.
set -uo pipefail
R="$(cd "$(dirname "$0")/../.." && pwd)"; PORT="${1:-9412}"; B="http://127.0.0.1:$PORT"
T=/dev/shm/rs-sprava-bez; rm -rf "$T"; mkdir -p "$T"
python3 "$R/sprava/testy/vstupy.py" "$T/vstupy" > /dev/null
REV=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["revizia"])' "$R/data/verzia.json")
SPRAVA=1 SPRAVA_REVIZIA=$REV bash "$R/nasadenie/balik.sh" "$R" "$T/balik" > /dev/null
mkdir -p "$T/host"; cp -r "$T/balik/web" "$T/host/www"
start() { (cd "$T/host/www" && PHP_CLI_SERVER_WORKERS=4 env ${1:-} php -d upload_max_filesize=32M -d post_max_size=34M -S 127.0.0.1:$PORT -t "$T/host/www" "$R/sprava/testy/router.php" > "$T/server.log" 2>&1 &); sleep 1; }
stop() { pkill -f "php .* -S 127.0.0.1:$PORT" > /dev/null 2>&1; wait 2>/dev/null; sleep 0.5; }
OK=0; ZLE=0
# grep číta celú odpoveď (nie grep -q): pri dlhej stránke grep -q skončí skôr, curl dostane SIGPIPE a pipefail z toho urobí
# chybu, hoci odpoveď je správna (stránka Texty, 17. 11. 2026)
t() { if [ "$2" = "1" ]; then OK=$((OK+1)); echo "  ok   $1"; else ZLE=$((ZLE+1)); echo "  ZLE  $1 ${3:-}"; fi; }
kod() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
C="$T/c.txt"; C2="$T/c2.txt"
tok() { curl -s -b "$1" -c "$1" "$B/sprava/index.php${2:-}" | grep -o 'name="_t" value="[^"]*"' | head -1 | sed 's/.*value="//;s/"//'; }
start

echo "1. bez prihlásenia"
P=$(curl -s $B/sprava/); t "Domov bez účtu = prvé nastavenie, žiadny formulár hesla" "$(echo "$P" | grep -q '<h1>Prvé nastavenie</h1>' && ! echo "$P" | grep -q 'name="heslo"' && echo 1)"
t "zverejnenie bez prihlásenia a bez tokenu → 403" "$([ "$(kod -d 'a=zverejnit' $B/sprava/index.php)" = 403 ] && echo 1)"
echo "2. prvý kód"
T1=$(tok "$C"); curl -s -b "$C" -c "$C" -o /dev/null -d "_t=$T1&a=prvy-kod" "$B/sprava/index.php"
KOD=$(grep -o 'Kód: [A-Z0-9-]*' "$T/host/sprava-data/PRVY-KOD.txt" | cut -c6-)
t "kód je len v súbore v priečinku údajov mimo webu" "$([ -n "$KOD" ] && ! grep -rqs "$KOD" "$T/host/www" && echo 1)"
t "súbor s kódom z webu nedostupný" "$([ "$(kod $B/../sprava-data/PRVY-KOD.txt)" != 200 ] && [ "$(kod "$B/sprava-data/PRVY-KOD.txt")" != 200 ] && echo 1)"
for i in 1 2 3 4 5 6; do T1=$(tok "$C"); curl -s -b "$C" -c "$C" -o /dev/null -d "_t=$T1&a=prvy-over&kod=AAAA-BBBB-CCCC-DDD$i" "$B/sprava/index.php"; done
T1=$(tok "$C"); curl -s -b "$C" -c "$C" -o /dev/null -d "_t=$T1&a=prvy-over&kod=$KOD" "$B/sprava/index.php"
t "po 6 zlých pokusoch neplatí ani správny kód" "$(curl -s -b "$C" $B/sprava/ | grep -q 'name="heslo2"' || echo 1)"
T1=$(tok "$C"); t "nový kód hneď znova nevznikne" "$(curl -s -L -b "$C" -c "$C" -d "_t=$T1&a=prvy-kod" "$B/sprava/index.php" | grep -q 'najskôr o' && echo 1)"
# odomknutie pre ďalšie testy (len v teste: zmazanie stavu kódu cez súbor, ako by to urobil majiteľ cez FTP)
python3 -c "import json,sys; p=sys.argv[1]; d=json.load(open(p)); d.pop('kod',None); json.dump(d,open(p,'w'))" "$T/host/sprava-data/nastavenie.json"
T1=$(tok "$C"); curl -s -b "$C" -c "$C" -o /dev/null -d "_t=$T1&a=prvy-kod" "$B/sprava/index.php"
KOD=$(grep -o 'Kód: [A-Z0-9-]*' "$T/host/sprava-data/PRVY-KOD.txt" | cut -c6-)
T1=$(tok "$C"); curl -s -b "$C" -c "$C" -o /dev/null -d "_t=$T1&a=prvy-over&kod=$KOD" "$B/sprava/index.php"
HESLO="tri-slova-$RANDOM-$RANDOM"
T1=$(tok "$C"); curl -s -b "$C" -c "$C" -o /dev/null --data-urlencode "meno=Mário" --data-urlencode "heslo=$HESLO" --data-urlencode "heslo2=$HESLO" -d "_t=$T1&a=prvy-ucet" "$B/sprava/index.php"
t "účet vytvorený po správnom kóde" "$(curl -s -b "$C" $B/sprava/ | grep -q 'Všetko je na webe' && echo 1)"
echo "5. CSRF a 6. relácia"
t "POST bez tokenu → 403" "$([ "$(kod -b "$C" -d 'a=zahodit' $B/sprava/index.php)" = 403 ] && echo 1)"
T1=$(tok "$C"); t "POST s cudzím Origin → 403" "$([ "$(kod -b "$C" -H 'Origin: https://zly.example' -d "_t=$T1&a=zahodit" $B/sprava/index.php)" = 403 ] && echo 1)"
t "POST z cudzej stránky (Sec-Fetch-Site: cross-site) → 403" "$([ "$(kod -b "$C" -H 'Sec-Fetch-Site: cross-site' -d "_t=$T1&a=zahodit" $B/sprava/index.php)" = 403 ] && echo 1)"
t "zmena cez GET nič nerobí (odhlásenie)" "$(curl -s -b "$C" "$B/sprava/index.php?a=odhlasit&s=domov" > /dev/null; curl -s -b "$C" $B/sprava/ | grep -q 'Všetko je na webe' && echo 1)"
t "podsunutá relácia sa neprijme (strict mode)" "$(curl -s -c "$C2" -b 'rs_sprava=podsunuta1234567890podsunuta1234567890ab' $B/sprava/ > /dev/null; grep -q podsunuta "$C2" && echo 0 || echo 1)"
echo "3. hrubá sila hesla"
for i in 1 2 3 4 5 6; do T2=$(tok "$C2"); curl -s -b "$C2" -c "$C2" -o /dev/null -d "_t=$T2&a=prihlasit&meno=Mário&heslo=zle$i" "$B/sprava/index.php"; done
T2=$(tok "$C2"); t "po 6 zlých heslách aj správne zablokované na 15 min" "$(curl -s -L -b "$C2" -c "$C2" --data-urlencode "heslo=$HESLO" -d "_t=$T2&a=prihlasit&meno=Mário" "$B/sprava/index.php" | grep -q 'Príliš veľa nesprávnych pokusov' && echo 1)"
echo "8. XSS"
T1=$(tok "$C" '?s=akcia&id=nova')
curl -s -L -b "$C" -c "$C" -o "$T/xss.html" -d "_t=$T1&a=akcia&id=nova&verzia=0&stitok=Akciová cena" --data-urlencode 'nazov=Test <script>alert(1)</script>' --data-urlencode 'karta=Text akcie s "><img src=x onerror=alert(1)> a dlhším textom na kartu akcie.' "$B/sprava/index.php?s=akcia&id=nova"
t "značky v názve odmietnuté vetou" "$(grep -q 'nepoužívajte znaky' "$T/xss.html" && echo 1)"
echo "8b. nové úkony (novinky, galéria, texty, kontakt)"
T1=$(tok "$C" '?s=novinka&id=nova')
t "novinka: značky v názve odmietnuté" "$(curl -s -L -b "$C" -c "$C" -d "_t=$T1&a=novinka&id=nova&verzia=0" --data-urlencode 'nazov=Novinka <img src=x onerror=alert(1)>' --data-urlencode 'popis=Popis novinky dostatočne dlhý na kontrolu dĺžky textu.' --data-urlencode 'text=Odsek.' "$B/sprava/index.php?s=novinka&id=nova" | grep -q 'nepoužívajte znaky' && echo 1)"
T1=$(tok "$C" '?s=galeria')
t "galéria: album mimo zoznamu odmietnutý" "$(curl -s -L -b "$C" -c "$C" -d "_t=$T1&a=galeria-popis&album=../../sprava-data&foto=x" --data-urlencode 'popis=Skúšobný popis fotky' "$B/sprava/index.php?s=galeria" | grep -q 'Album neexistuje' && echo 1)"
T1=$(tok "$C" '?s=texty')
t "texty: šablónové značky {{ }} odmietnuté" "$(curl -s -L -b "$C" -c "$C" -d "_t=$T1&a=texty" --data-urlencode 'uvod_lede={{#x}}Veta na úvode, ktorá je dosť dlhá na kontrolu{{/x}}' "$B/sprava/index.php?s=texty" | grep 'nepoužívajte znaky' > /dev/null && echo 1)"
F0=$(sha256sum "$T/host/sprava-data/data/firma.json" | cut -c1-64)
C3="$T/c3.txt"; T3=$(tok "$C3")
curl -s -b "$C3" -c "$C3" -o /dev/null -d "_t=$T3&a=kontakt&mobil=0911000000&pevna=037%20651%2017%2077&email=zly@example.com" "$B/sprava/index.php"
t "kontakt bez prihlásenia (s platným tokenom) nič nezmení" "$([ "$(sha256sum "$T/host/sprava-data/data/firma.json" | cut -c1-64)" = "$F0" ] && [ ! -f "$T/host/sprava-data/koncept/navrh.json" ] && echo 1)"
echo "12. prechod cestou v náhľade"
for p in '../../sprava-data/ucty.json' '%2e%2e%2fsprava-data%2fucty.json' '/etc/passwd' 'kontakt.html%00.html' '../index.php'; do
  t "náhľad p=$p → 404" "$([ "$(kod -b "$C" "$B/sprava/index.php?s=stranka&p=$p")" = 404 ] && echo 1)"
done
echo "13. priamy prístup"
for u in sprava/jadro/Pristup.php sprava/kostry/konstanty.json sprava/sablony/meta.html sprava/semeno/akcie.json sprava/verzia.json sprava/.user.ini img/s/.htaccess pdf/s/web.config; do
  t "$u → zakázané" "$([ "$(kod $B/$u)" = 403 ] && echo 1)"
done
mkdir -p "$T/host/www/img/s/2026/11"; cp "$T/vstupy/sonda.php" "$T/host/www/img/s/2026/11/x.php"
t "PHP v img/s sa nespustí" "$(curl -s $B/img/s/2026/11/x.php | grep -q BEZI || echo 1)"
rm -f "$T/host/www/img/s/2026/11/x.php"
echo "14. hlavičky"
H=$(curl -s -D - -o /dev/null -b "$C" $B/sprava/)
t "zákaz vloženia do rámu (X-Frame-Options, frame-ancestors)" "$(echo "$H" | grep -qi 'X-Frame-Options: DENY' && echo "$H" | grep -qi "frame-ancestors 'none'" && echo 1)"
t "noindex a no-store" "$(echo "$H" | grep -qi 'X-Robots-Tag: noindex' && echo "$H" | grep -qi 'Cache-Control: no-store' && echo 1)"
t "cookie HttpOnly a SameSite=Strict" "$(curl -s -D - -o /dev/null $B/sprava/ | grep -i 'set-cookie' | grep -qi 'httponly.*samesite=strict' && echo 1)"
echo "21. chyba bez podrobností"
t "neznámy úkon: všeobecná veta" "$(T1=$(tok "$C"); curl -s -b "$C" -d "_t=$T1&a=neexistuje" $B/sprava/index.php | grep -q 'Neznámy úkon' && echo 1)"
echo "22. obrovský formulár"
T1=$(tok "$C" '?s=akcia&id=nova')
python3 -c "
import sys; r=['_t='+sys.argv[1],'a=akcia','id=nova','verzia=0','nazov=Velka akcia test','stitok=Akciová cena','karta='+'x'*1000000]
r+=['ceny[0][r][%d][polozka]=Vyrobok%%20%d&ceny[0][r][%d][cena]=1'%(i,i,i) for i in range(10000)]
open(sys.argv[2],'w').write('&'.join(r))" "$T1" "$T/velky.txt"
curl -s -L -b "$C" -c "$C" -o "$T/velky.html" --data @"$T/velky.txt" "$B/sprava/index.php?s=akcia&id=nova"
t "obrovský formulár odmietnutý, nič sa neuložilo" "$([ ! -f "$T/host/sprava-data/koncept/navrh.json" ] && echo 1)"
echo "7. HTTP bez HTTPS na hostingu"
t "kód vyžaduje HTTPS mimo php -S (nie podľa IP)" "$(grep -q "PHP_SAPI === 'cli-server'" "$R/sprava/jadro/Nastavenie.php" && ! grep -q 'REMOTE_ADDR.*127' "$R/sprava/jadro/Nastavenie.php" && echo 1)"
echo "Ochrana údajov bez .htaccess (údaje vo webe): správa sa zastaví"
stop
rm -rf "$T/host/sprava-data"; chmod 555 "$T/host"
start RS_BEZ_OCHRANY=1
curl -s $B/sprava/ > "$T/bez.html"
t "údaje vo webe bez ochrany: prvé nastavenie odmietnuté" "$(grep -q 'Server ešte nie je pripravený' "$T/bez.html" && echo 1)"
chmod 755 "$T/host"; stop
echo; echo "Spolu: $OK v poriadku, $ZLE zlých"
rm -rf "$T"
[ $ZLE -eq 0 ]
