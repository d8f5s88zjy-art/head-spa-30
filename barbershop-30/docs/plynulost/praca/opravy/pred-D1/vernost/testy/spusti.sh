#!/bin/sh
# Lokálny test vernostnej kartičky: sh vernost/testy/spusti.sh  (potrebuje php 8.1+ s pdo_sqlite a openssl, node, playwright)
set -e
H=$(cd "$(dirname "$0")/../.." && pwd)
T=$(mktemp -d)
export VERNOST_DATA="$T" VERNOST_TEST_PUSH=http://127.0.0.1:8078/push/
[ -e "$H/vernost/config.php" ] && { echo "vernost/config.php už existuje, test ho neprepíše"; exit 1; }
php -r 'echo "<?php return ", var_export(["hesla" => ["barbershop" => password_hash("test-heslo-barber", PASSWORD_DEFAULT), "headspa" => password_hash("test-heslo-headspa", PASSWORD_DEFAULT)], "email_od" => "", "zaklad" => "http://127.0.0.1:8077/vernost/"], true), ";\n";' > "$H/vernost/config.php"
upratat() { kill $PHP $PUSH 2>/dev/null || true; cp "$T/php.log" "${SNIMKY:-/tmp}/php.log" 2>/dev/null || true; rm -f "$H/vernost/config.php" "$H/vernost/data/meno.php"; rm -rf "$T"; }
trap upratat EXIT INT TERM
PHP_CLI_SERVER_WORKERS=6 php -S 127.0.0.1:8077 -t "$H" "$H/vernost/testy/router.php" >"$T/php.log" 2>&1 & PHP=$!
node "$H/vernost/testy/push-mock.mjs" & PUSH=$!
sleep 1
node "$H/vernost/testy/e2e.mjs"
