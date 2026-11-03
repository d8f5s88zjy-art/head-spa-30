#!/bin/bash
# Kontrola domény pred prepnutím na nový web a po ňom (nálezy REZ-01, REZ-05, REZ-08, kontrola rezervácie 2. 11. 2026).
# Koreň www.barbershop30.sk obsluhuje Laravel: rezervačný systém je na /rezervacia (komponent v-order-component),
# jeho štýly a skripty v css/ a js/, objednávka ide na /rezervacia/ajax. Samotný kód 200 nestačí: keby na /rezervacia
# ležala naša statická stránka (rezervacia.html cez MultiViews), vráti tiež 200, ale objednať sa nedá.
#
#   bash source/tools/domena-kontrola.sh https://www.barbershop30.sk [--web=https://www.barbershop30.sk/]
#
# 1. /rezervacia vráti 200 a obsahuje v-order-component            (kritické)
# 2. css/app.css a js/app.js z tej stránky vrátia 200               (kritické)
# 3. /rezervacia/ajax na GET vráti 405 (endpoint žije, chce POST)    (kritické)
# 4. http://…/rezervacia presmeruje na https                         (upozornenie, REZ-08)
# 5. https://…/rezervacia/ nepresmeruje na http                      (kritické, REZ-08: meno a telefón by išli nešifrovane)
# 6. --web: <základ webu>assets/tema-rezervacia.css vráti 200        (upozornenie, REZ-05)
# Návratový kód 0 len vtedy, keď prejdú všetky kritické kontroly.
D="${1%/}"
WEB=""
for a in "$@"; do case "$a" in --web=*) WEB="${a#--web=}"; WEB="${WEB%/}/";; esac; done
if [ -z "$D" ] || [[ "$D" != http* ]]; then echo "použitie: $0 <https://doména> [--web=<základ webu>]"; exit 2; fi
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
kriticke=0
ok() { echo "OK    $*"; }
zle() { echo "CHYBA $*"; kriticke=$((kriticke + 1)); }
poz() { echo "POZOR $*"; }
kod() { curl -s -o "${2:-/dev/null}" -w '%{http_code}' --max-time 20 "$1"; }
presmer() { curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 20 "$1"; }

# 1
k=$(kod "$D/rezervacia" "$T/rez.html")
if [ "$k" = 200 ] && grep -q 'v-order-component' "$T/rez.html"; then ok "1 /rezervacia: 200 a rezervačný systém (v-order-component)"
elif [ "$k" = 200 ]; then zle "1 /rezervacia: 200, ale chýba v-order-component (na adrese nie je rezervačný systém, REZ-01)"
else zle "1 /rezervacia: kód $k, čakám 200 s v-order-component (REZ-01)"; fi

# 2
for vzor in 'href="[^"]*css/app\.css[^"]*"' 'src="[^"]*js/app\.js[^"]*"'; do
  ref=$(grep -o "$vzor" "$T/rez.html" 2>/dev/null | head -n 1 | sed -E 's/^(href|src)="//; s/"$//')
  meno=$([[ "$vzor" == href* ]] && echo css/app.css || echo js/app.js)
  if [ -z "$ref" ]; then zle "2 $meno: stránka /rezervacia naň neodkazuje"; continue; fi
  case "$ref" in http*) u="$ref";; /*) u="$(echo "$D" | grep -oE '^https?://[^/]+')$ref";; *) u="$D/$ref";; esac
  k=$(kod "$u"); [ "$k" = 200 ] && ok "2 $meno: 200 ($u)" || zle "2 $meno: kód $k ($u), štýly alebo skripty rezervácie chýbajú (REZ-01)"
done

# 3
k=$(kod "$D/rezervacia/ajax")
[ "$k" = 405 ] && ok "3 /rezervacia/ajax: 405 na GET (endpoint objednávky žije)" || zle "3 /rezervacia/ajax: kód $k, čakám 405 (endpoint objednávky chýba?)"

# 4 a 5 (len pri https doméne)
if [[ "$D" == https://* ]]; then
  H="http://${D#https://}"
  read -r k loc <<< "$(presmer "$H/rezervacia")"
  if [[ "$k" =~ ^30[1278]$ && "$loc" == https://* ]]; then ok "4 http://…/rezervacia presmeruje na https"
  else poz "4 http://…/rezervacia: kód $k ${loc:-bez presmerovania}, HTTP nepresmeruje na HTTPS (REZ-08, úloha hostingu)"; fi
  read -r k loc <<< "$(presmer "$D/rezervacia/")"
  if [[ "$loc" == http://* ]]; then zle "5 https://…/rezervacia/: kód $k na $loc, presmeruje na nešifrované HTTP (REZ-08)"
  else ok "5 https://…/rezervacia/: kód $k${loc:+ na $loc}, nepresmeruje na http"; fi
else
  poz "4 a 5 preskočené: adresa nie je https"
fi

# 6
if [ -n "$WEB" ]; then
  k=$(kod "${WEB}assets/tema-rezervacia.css")
  [ "$k" = 200 ] && ok "6 ${WEB}assets/tema-rezervacia.css: 200" || poz "6 ${WEB}assets/tema-rezervacia.css: kód $k, štýl pre rezerváciu nie je nasadený, riadok správcovi zatiaľ neposielať (REZ-05)"
fi

if [ "$kriticke" = 0 ]; then echo "VÝSLEDOK: kritické kontroly prešli"; exit 0; fi
echo "VÝSLEDOK: kritické chyby: $kriticke"; exit 1
