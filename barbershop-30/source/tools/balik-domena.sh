#!/usr/bin/env bash
# Plný balík pre www.barbershop30.sk: nový web + asistent Barber + voľné termíny + vernostná kartička + správa
# (prvé nastavenie a úpravy webu). Všetko, čo treba nahrať na hosting vedľa rezervačného systému, bez tajomstiev.
#
#   bash source/tools/balik-domena.sh [--von=<priečinok>] [--vendor=<priečinok s hotovým vendor/>] [--php=8.2] [--bez-zip]
#
# Výstup (predvolene <repozitár>/_balik-domena, nie je v gite):
#   NAHRAT-NA-HOSTING/   obsah patrí do koreňa domény (tam, kde je index.php rezervačného systému), len pridať
#   NAVOD.txt            návod pre majiteľa
#   barbershop30-plny.zip
# Čo v balíku zámerne NIE JE: rezervacia.html, admin/ (adresa /admin patrí rezervačnému systému), koreňový .htaccess,
# nič s menom index.php, css, js, images, fonts, storage, vendor v koreni, žiadne testy, žiadna konfigurácia s tajomstvom.
# Kľúč API, heslá a kód prvého nastavenia zadáva majiteľ sám v správe (https://www.barbershop30.sk/sprava/).
# Knižnica asistenta (asistent/vendor) sa zostaví cez composer mimo repozitára (vyrovnávací priečinok), alebo sa vezme
# hotová z --vendor. Kontrola balíka: bash source/tools/balik-test.sh <priečinok>.
set -euo pipefail
SITE=$(cd "$(dirname "$0")/../.." && pwd)
R=$(cd "$SITE/.." && pwd)
VON="$R/_balik-domena"; VENDOR=""; PHPV="8.2"; ZIP=1
for a in "$@"; do case "$a" in
  --von=*) VON="${a#--von=}";; --vendor=*) VENDOR="${a#--vendor=}";; --php=*) PHPV="${a#--php=}";; --bez-zip) ZIP=0;;
  *) echo "neznámy prepínač: $a"; exit 2;; esac; done
mkdir -p "$VON"; VON=$(cd "$VON" && pwd)
B="$VON/NAHRAT-NA-HOSTING"
case "$B" in */NAHRAT-NA-HOSTING) rm -rf "$B";; esac
mkdir -p "$B"
D="$SITE/source/domena"
kopiruj() { # kopiruj <priečinok v repozitári> <cieľ>: len súbory, ktoré sú v gite (žiadne pracovné súbory)
  ( cd "$R/$1" && git ls-files -z . | while IFS= read -r -d '' f; do [ -f "$f" ] || continue; mkdir -p "$2/$(dirname "$f")"; cp -p "$f" "$2/$f"; done )
}

# ---------- 1. web (ako statický balík zo 16. 11.) ----------
kopiruj barbershop-30/assets "$B/assets"
kopiruj barbershop-30/karta "$B/karta"

# ---------- 2. asistent Barber a voľné termíny ----------
mkdir -p "$B/asistent/data"
cp -p "$R/asistent/api.php" "$R/asistent/ochrana-udajov.html" "$B/asistent/"
kopiruj asistent/lib "$B/asistent/lib"
kopiruj asistent/znalosti "$B/asistent/znalosti"
cp -p "$R/asistent/data/.htaccess" "$B/asistent/data/.htaccess"
: > "$B/asistent/data/index.html"; : > "$B/asistent/index.html"
cp -p "$D/asistent-config.php" "$B/asistent/config.php"
cp -p "$D/asistent.htaccess" "$B/asistent/.htaccess"
cp -p "$D/asistent.web.config" "$B/asistent/web.config"
cp -p "$D/asistent.user.ini" "$B/asistent/.user.ini"
if [ -z "$VENDOR" ]; then
  # composer v priečinku mimo repozitára; verzia PHP hostingu určuje závislosti (8.1: symfony/http-client ^6.4)
  KL=$(cat "$R/asistent/composer.json" | sha256sum | cut -c1-12)
  CACHE="${B30_VENDOR_CACHE:-${TMPDIR:-/tmp}/b30-vendor}/$KL-php$PHPV"
  if [ ! -f "$CACHE/vendor/autoload.php" ]; then
    mkdir -p "$CACHE"; cp "$R/asistent/composer.json" "$CACHE/composer.json"
    ( cd "$CACHE" && composer config platform.php "$PHPV.0" >/dev/null
      [ "$PHPV" = "8.1" ] && composer require --no-update --no-interaction 'symfony/http-client:^6.4' >/dev/null || true
      composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader >/dev/null )
  fi
  VENDOR="$CACHE"
fi
[ -f "$VENDOR/vendor/autoload.php" ] || { echo "chýba $VENDOR/vendor/autoload.php"; exit 1; }
cp -a "$VENDOR/vendor" "$B/asistent/vendor"
# z knižníc len to, čo beží: bez histórie, testov, príkladov a skriptov
find "$B/asistent/vendor" \( -name .git -o -name .github -o -name tests -o -name Tests -o -name test -o -name fixtures -o -name examples -o -name scripts -o -name docs \) -type d -prune -exec rm -rf {} +
find "$B/asistent/vendor" -type f \( -name '*.md' -o -name '*.dist' -o -name '.gitignore' -o -name '.gitattributes' -o -name 'phpunit.xml*' -o -name '.php-cs-fixer*' -o -name 'composer.lock' -o -name 'composer.json' \) -delete
# zdroje knižníc v iných jazykoch (standard-webhooks/libraries: Go, Rust, Ruby, Python, Java, C#, Elixir, JS) a nástroje
# vývoja (phpstan, psalm, editorconfig, yml, hlavičky C) PHP nepotrebuje
find "$B/asistent/vendor" -path '*/standard-webhooks/standard-webhooks/libraries' -type d -prune -exec rm -rf {} +
find "$B/asistent/vendor" -type f \( -name '*.neon' -o -name 'psalm*.xml' -o -name '.editorconfig' -o -name '*.yml' -o -name '*.yaml' -o -name '*.h' \) -delete

# ---------- 3. vernostná kartička ----------
mkdir -p "$B/vernost/data"
for p in api lib admin karta web pisma; do kopiruj "vernost/$p" "$B/vernost/$p"; done
cp -p "$R/vernost/index.html" "$B/vernost/index.html"
cp -p "$R/vernost/data/.htaccess" "$R/vernost/data/index.html" "$B/vernost/data/"
cp -p "$D/vernost-ochrana-udajov.html" "$B/vernost/ochrana-udajov.html"
cp -p "$D/vernost-config.php" "$B/vernost/config.php"
cp -p "$D/vernost.htaccess" "$B/vernost/.htaccess"
cp -p "$D/vernost.web.config" "$B/vernost/web.config"

# ---------- 4. správa ----------
kopiruj barbershop-sprava "$B/sprava"
rm -rf "$B/sprava/testy"
cp -p "$D/ciel.json" "$B/sprava/jadro/ciel.json"
# pôvodné súbory v tvare repozitára (semeno): zoznam je pevná tabuľka správy; prípona .txt, aby sa nikdy nespustili
php -r 'define("B30S", 1); require $argv[1] . "/jadro/Mapa.php"; echo implode("\n", array_keys(Mapa::tabulka())), "\n";' "$R/barbershop-sprava" | while IFS= read -r c; do
  [ -f "$R/$c" ] || { echo "chýba súbor semena: $c" >&2; exit 1; }
  mkdir -p "$B/sprava/semeno/$(dirname "$c")"; cp -p "$R/$c" "$B/sprava/semeno/$c.txt"
done
COMMIT=$(git -C "$R" rev-parse HEAD); CAS=$(git -C "$R" log -1 --format=%cI)
[ -z "$(git -C "$R" status --porcelain -- barbershop-30 asistent vernost barbershop-sprava)" ] || COMMIT="$COMMIT-upravene"
printf '{"commit":"%s","cas":"%s"}\n' "$COMMIT" "$CAS" > "$B/sprava/semeno/verzia.json"

# ---------- 5. verejné súbory webu a rozhranie úprav (ten istý kód ako správa na hostingu) ----------
node "$SITE/source/tools/balik-zostav.mjs" "$B"

# ---------- 6. zoznamy odtlačkov (kontrola úplnosti po nahratí cez FTP) ----------
# súbory, ktoré správa sama mení (znalosti, ochrana údajov, tri súbory s kódom), v zoznamoch nie sú
( cd "$B/asistent" && find . -type f ! -name subory.sha256 ! -name config.php ! -path './znalosti/*' ! -path './lib/jadro.php' ! -path './api.php' ! -path './ochrana-udajov.html' | sed 's#^\./##' | LC_ALL=C sort | xargs -d '\n' sha256sum > "$B/asistent/subory.sha256" )
( cd "$B" && find sprava vernost -type f ! -path 'sprava/semeno/subory.sha256' ! -path 'vernost/ochrana-udajov.html' ! -path 'vernost/karta/karta.js' ! -path 'vernost/lib/jadro.php' | LC_ALL=C sort | xargs -d '\n' sha256sum > "$B/sprava/semeno/subory.sha256" )

# ---------- 7. poistky ----------
for z in $(php -r 'echo implode(" ", json_decode(file_get_contents($argv[1]), true)["zakazane_v_koreni"]);' "$D/ciel.json"); do
  [ ! -e "$B/$z" ] || { echo "CHYBA: v koreni balíka je zakázané meno: $z"; exit 1; }
done
find "$B" -name '.DS_Store' -delete
find "$B" -type d -exec chmod 755 {} +; find "$B" -type f -exec chmod 644 {} +

# ---------- 8. návod a ZIP ----------
POCET=$(find "$B" -type f | wc -l); MB=$(du -sm --apparent-size "$B" | cut -f1); KNIZ=$(find "$B/asistent/vendor" -type f | wc -l)
sed "s/{COMMIT}/${COMMIT:0:8}/g; s/{SUBOROV}/$POCET/g; s/{MB}/$MB/g; s/{KNIZNICA}/$KNIZ/g" "$D/NAVOD.txt" > "$VON/NAVOD.txt"
if [ "$ZIP" = 1 ]; then rm -f "$VON/barbershop30-plny.zip"; ( cd "$VON" && zip -q -r -X barbershop30-plny.zip NAHRAT-NA-HOSTING NAVOD.txt ); fi
echo "Hotovo: $B ($POCET súborov, $MB MB, knižnica asistenta $KNIZ súborov, commit ${COMMIT:0:8})$([ "$ZIP" = 1 ] && echo " a $VON/barbershop30-plny.zip")"
