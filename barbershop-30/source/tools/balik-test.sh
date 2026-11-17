#!/usr/bin/env bash
# Kontrola plného balíka pre www.barbershop30.sk (výstup balik-domena.sh) ešte pred odoslaním majiteľovi.
#
#   bash source/tools/balik-test.sh <NAHRAT-NA-HOSTING> [--stary=<NAHRAT-NA-HOSTING statického balíka zo 16. 11.>]
#
# 1. v koreni nie je nič, čo patrí rezervačnému systému (rezervacia.html, admin, .htaccess, index.php, css, js, …),
# 2. žiadne testy, README, composer.json, vzory konfigurácie, .git; žiadny kľúč API ani odtlačok hesla; config.php sú len zástupky,
# 3. verejné súbory = zostavenie pôvodných súborov (sprava/semeno) tým istým kódom, aký beží v správe na hostingu,
# 4. --stary: statická časť sa od balíka zo 16. 11. líši len v index.html, en/index.html a karta/index.html,
# 5. php -l na každý súbor .php; vstupy správy (index.php, api.php) bez syntaxe novšej než PHP 5.6 (kontrola vzorom –
#    staršie PHP na stroji nie je), vnútorné súbory správy so strážou proti priamemu spusteniu,
# 6. zoznamy odtlačkov (asistent/subory.sha256, sprava/semeno/subory.sha256) sedia.
set -uo pipefail
SITE=$(cd "$(dirname "$0")/../.." && pwd)
B=""; STARY=""
for a in "$@"; do case "$a" in --stary=*) STARY="${a#--stary=}";; *) B="$a";; esac; done
[ -n "$B" ] && [ -f "$B/sprava/index.php" ] || { echo "použitie: bash balik-test.sh <NAHRAT-NA-HOSTING> [--stary=<priečinok>]"; exit 2; }
B=$(cd "$B" && pwd)
ok=0; zle=0
skus() { if eval "$2"; then ok=$((ok+1)); echo "OK   $1"; else zle=$((zle+1)); echo "FAIL $1${3:+  $3}"; fi; }

# 1
ZAK=$(php -r 'echo implode(" ", json_decode(file_get_contents($argv[1]), true)["zakazane_v_koreni"]);' "$SITE/source/domena/ciel.json")
najdene=""; for z in $ZAK; do [ -e "$B/$z" ] && najdene="$najdene $z"; done
skus "v koreni nie je nič z rezervačného systému ($ZAK)" '[ -z "$najdene" ]' "$najdene"
skus "koreň má len: 404.html asistent assets en index.html karta robots.txt sitemap.xml sprava vernost" '[ "$(ls -A "$B" | LC_ALL=C sort | tr "\n" " ")" = "404.html asistent assets en index.html karta robots.txt sitemap.xml sprava vernost " ]' "$(ls -A "$B" | tr '\n' ' ')"
skus "žiadny súbor .php v koreni ani vo webe (assets, en, karta)" '[ -z "$(find "$B" -maxdepth 1 -name "*.php"; find "$B/assets" "$B/en" "$B/karta" -name "*.php")" ]'

# 2
skus "žiadne .git, testy, README.md, composer.json, config.example.php" '[ -z "$(find "$B" \( -name .git -o -name testy -o -name tests -o -name README.md -o -name composer.json -o -name composer.lock -o -name "config.example.php" -o -name "*.sqlite*" -o -name "meno.php" \) -not -path "*/asistent/vendor/composer/*" | head -5)" ]' "$(find "$B" \( -name .git -o -name testy -o -name tests -o -name README.md -o -name composer.json -o -name config.example.php \) | head -3 | tr '\n' ' ')"
skus "žiadny kľúč API (sk-ant-…) v balíku" '! grep -rIlE "sk-ant-[A-Za-z0-9_-]{20,}" "$B" --exclude-dir=vendor | grep -q .' "$(grep -rIlE 'sk-ant-[A-Za-z0-9_-]{20,}' "$B" --exclude-dir=vendor | head -3 | tr '\n' ' ')"
skus "žiadny odtlačok hesla (\$2y\$…, \$argon2…) v balíku" '! grep -rIlE "\\\$2y\\\$[0-9]{2}\\\$[./A-Za-z0-9]{53}|\\\$argon2(id|i|d)\\\$v=[0-9]+\\\$" "$B" --exclude-dir=vendor | grep -q .'
skus "asistent/config.php a vernost/config.php sú zástupky bez údajov" 'cmp -s "$B/asistent/config.php" "$SITE/source/domena/asistent-config.php" && cmp -s "$B/vernost/config.php" "$SITE/source/domena/vernost-config.php" && ! grep -qE "kluc|hesla|=>" "$B/asistent/config.php" "$B/vernost/config.php"'
skus "v balíku nie je priečinok údajov ani súbor s kódom" '[ -z "$(find "$B" \( -name "b30-udaje-*" -o -name "barbershop30-udaje" -o -name "*-KOD.txt" -o -name tajne.php -o -name ucty.php \) | head -1)" ]'
skus "pôvodné súbory (semeno) majú príponu .txt, žiadny sa nedá spustiť" '[ -z "$(find "$B/sprava/semeno" -type f ! -name "*.txt" ! -name verzia.json ! -name subory.sha256 | head -1)" ] && [ "$(find "$B/sprava/semeno" -name "*.txt" | wc -l)" -ge 30 ]'

# 3
VYS=$(node --input-type=module -e '
import fs from "node:fs"; import path from "node:path";
const [B, SITE] = process.argv.slice(1);
const { zostav, bezKomentarovCss } = await import(path.join(SITE, "admin/zostav.js"));
const { enStranka } = await import(path.join(SITE, "admin/lib/en-stranka-jadro.js"));
const { bezKomentarovHtml } = await import(path.join(SITE, "admin/lib/zmensi-jadro.js"));
const ciel = JSON.parse(fs.readFileSync(path.join(B, "sprava/jadro/ciel.json"), "utf8"));
const sem = (c) => fs.readFileSync(path.join(B, "sprava/semeno", c + ".txt"), "utf8");
const zdroj = {}; for (const c of ["index.html", "404.html", "robots.txt", "sitemap.xml", "karta/index.html", "assets/i18n/en.json"]) zdroj["barbershop-30/" + c] = sem("barbershop-30/" + c);
const von = zostav(zdroj, ciel); const zle = [];
for (const [c, t] of Object.entries(von)) if (fs.readFileSync(path.join(B, c), "utf8") !== t) zle.push(c);
// anglická stránka = en-stranka zo zostavenej slovenskej (pred zmenšením) a slovníka
const sk = zdroj["barbershop-30/index.html"].split(ciel.povodna).join(ciel.zaklad).replace(/(<script src="assets\/vernost\.js" data-prevadzka="barbershop")/, `$1 data-api="${ciel.vernost}"`);
if (bezKomentarovHtml(enStranka(sk, JSON.parse(zdroj["barbershop-30/assets/i18n/en.json"])).html) !== fs.readFileSync(path.join(B, "en/index.html"), "utf8")) zle.push("en/index.html (en-stranka)");
// súbory, ktoré správa kopíruje priamo: v balíku rovnaké ako pôvodné
for (const [s, v] of [["asistent/api.php", "asistent/api.php"], ["asistent/lib/jadro.php", "asistent/lib/jadro.php"], ["vernost/lib/jadro.php", "vernost/lib/jadro.php"], ["barbershop-30/assets/app.js", "assets/app.js"], ["barbershop-30/assets/i18n/de.json", "assets/i18n/de.json"], ["asistent/znalosti/barbershop.md", "asistent/znalosti/barbershop.md"], ["barbershop-30/source/domena/vernost-ochrana-udajov.html", "vernost/ochrana-udajov.html"], ["barbershop-30/karta/karta.js", "karta/karta.js"]]) if (sem(s) !== fs.readFileSync(path.join(B, v), "utf8")) zle.push(v);
for (const c of ["index.html", "en/index.html"]) { const h = fs.readFileSync(path.join(B, c), "utf8"); if (/data-asistent|data-objednavka| data-zapnute/.test(h.match(/<html[^>]*>/)[0] + (h.match(/<script src="[.\/]*assets\/vernost\.js"[^>]*>/) || [""])[0])) zle.push(c + " (prepínač)"); if (h.includes("github.io")) zle.push(c + " (adresa GitHub Pages)"); }
console.log(zle.length ? zle.join(", ") : "ZHODNE");
' "$B" "$SITE" 2>&1)
skus "verejné súbory = zostavenie pôvodných súborov; bez prepínačov, adresa domény" '[ "$VYS" = ZHODNE ]' "$VYS"

# 4
if [ -n "$STARY" ] && [ -d "$STARY" ]; then
  ROZ=$(cd "$STARY" && find . -type f | LC_ALL=C sort | while IFS= read -r f; do if [ ! -f "$B/$f" ]; then echo "chýba:$f"; elif ! cmp -s "$f" "$B/$f"; then echo "${f#./}"; fi; done | tr '\n' ' ')
  skus "statická časť oproti balíku zo 16. 11.: iné sú len index.html, en/index.html, karta/index.html" '[ "$ROZ" = "en/index.html index.html karta/index.html " ]' "$ROZ"
  NAVYSE=$(cd "$B" && find . -type f -not -path './asistent/*' -not -path './vernost/*' -not -path './sprava/*' | while IFS= read -r f; do [ -f "$STARY/$f" ] || echo "$f"; done | head -5 | tr '\n' ' ')
  skus "vo webe nepribudol žiadny súbor oproti balíku zo 16. 11." '[ -z "$NAVYSE" ]' "$NAVYSE"
fi

# 5
CH=$(find "$B" -name '*.php' -not -path '*/asistent/vendor/*' -print0 | xargs -0 -n 1 php -l 2>&1 | grep -v '^No syntax errors' | head -3)
skus "php -l: súbory balíka mimo knižnice ($(find "$B" -name '*.php' -not -path '*/asistent/vendor/*' | wc -l))" '[ -z "$CH" ]' "$CH"
CHV=$(find "$B/asistent/vendor" -name '*.php' -print0 | xargs -0 -n 300 -P 4 php -l 2>&1 | grep -v '^No syntax errors' | grep -v '^$' | head -3)
skus "php -l: knižnica asistenta ($(find "$B/asistent/vendor" -name '*.php' | wc -l) súborov)" '[ -z "$CHV" ]' "$CHV"
for f in sprava/index.php sprava/api.php; do
  skus "$f: brána verzie PHP bez syntaxe novšej než PHP 5.6" '! grep -nE "\?\?|\?->|\bfn ?\(|\bmatch ?\(|\): ?(\??[a-z]+|never)\b|\.\.\.|declare\(|#\[|\[[^]]*\] ?= ?|\buse function\b|yield from| static fn|<=>" "$B/$f" | grep -q . && grep -q "PHP_VERSION_ID < 80200" "$B/$f" && grep -q "dirname(__FILE__)" "$B/$f"' "$(grep -nE '\?\?|\?->|\bfn ?\(|\bmatch ?\(|\.\.\.|declare\(' "$B/$f" | head -2)"
done
BEZ=$(for f in "$B"/sprava/jadro/*.php "$B"/sprava/obrazovky/*.php; do head -12 "$f" | grep -qE "defined\('B30S'\) \|\| exit;|if \(!defined\('(ASISTENT|VERNOST)'\)\)" || echo "$(basename "$f")"; done | tr '\n' ' ')
skus "vnútorné súbory správy majú stráž proti priamemu spusteniu" '[ -z "$BEZ" ]' "$BEZ"
skus "ochrana priečinkov: .htaccess a web.config v asistent, vernost, sprava; RewriteEngine On" 'for p in asistent vernost sprava; do [ -f "$B/$p/.htaccess" ] && [ -f "$B/$p/web.config" ] && grep -q "RewriteEngine On" "$B/$p/.htaccess" && ! grep -qE "^\s*(Options|DirectoryIndex)" "$B/$p/.htaccess" || exit 1; done'

# 6
skus "odtlačky asistent/subory.sha256 sedia ($(wc -l < "$B/asistent/subory.sha256") súborov)" '( cd "$B/asistent" && sha256sum --quiet -c subory.sha256 >/dev/null 2>&1 )'
skus "odtlačky sprava/semeno/subory.sha256 sedia ($(wc -l < "$B/sprava/semeno/subory.sha256") súborov)" '( cd "$B" && sha256sum --quiet -c sprava/semeno/subory.sha256 >/dev/null 2>&1 )'
NAVYSE_V=$(find "$B/asistent/vendor" -type f \( -name '*.go' -o -name '*.rs' -o -name '*.rb' -o -name '*.py' -o -name '*.java' -o -name '*.cs' -o -name '*.ts' -o -name '*.exs' -o -name '*.neon' -o -name '*.yml' -o -name '*.h' -o -name 'psalm*.xml' -o -name '.editorconfig' \) | head -3)
skus "v knižnici asistenta nie sú zdroje iných jazykov ani nástroje vývoja" '[ -z "$NAVYSE_V" ]' "$NAVYSE_V"
skus "knižnica asistenta je úplná (autoload, SDK, HTTP klient)" '[ -f "$B/asistent/vendor/autoload.php" ] && [ -d "$B/asistent/vendor/anthropic-ai/sdk/src" ] && [ -d "$B/asistent/vendor/symfony/http-client" ]'
echo "súborov: $(find "$B" -type f | wc -l), veľkosť: $(du -sm "$B" | cut -f1) MB (web $(du -sm "$B/assets" | cut -f1) MB, knižnica asistenta $(du -sm "$B/asistent/vendor" | cut -f1) MB, $(find "$B/asistent/vendor" -type f | wc -l) súborov)"
echo "$ok OK, $zle FAIL"
[ "$zle" = 0 ]
