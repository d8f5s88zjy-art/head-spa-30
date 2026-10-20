#!/usr/bin/env bash
# Zostaví assets/kladivko.min.js zo source/kladivko.js: three.js (source/vendor, verzia 0.169.0, MIT)
# sa pribalí len v rozsahu, ktorý kladivko používa (asi 137 kB po kompresii namiesto 170 kB celej knižnice).
# Licenčná hlavička three.js ostane na konci súboru.
set -euo pipefail
cd "$(dirname "$0")/.."
npx -y esbuild@0.24.0 source/kladivko.js --bundle --format=esm --minify --legal-comments=eof --target=es2020 --outfile=assets/kladivko.min.js
