#!/bin/sh
# Overí, či sú súbory z manifestu (balik-zmien.sh) naozaj nahraté na webe.
# Použitie: sh kontrola-nahratia.sh <manifest.txt> [adresa-webu]
# Vypíše jeden riadok: STAV=HOTOVO|CIASTOCNE|NIC|ZLY_PRIECINOK|CHYBA_SIETE sedi=X/N siet=S chyba=...
#   NIC / CIASTOCNE: nič alebo len časť súborov sedí; nahratý starší ZIP alebo ZIP rozbalený
#                    do nesprávneho priečinka (napríklad /headspa30.sk namiesto /headspa30.sk/www)
#   ZLY_PRIECINOK:   na webe je /NAHRAJ-NA-WEB/index.html (starý balík s obalovým priečinkom)
#   CHYBA_SIETE:     veľa súborov sa nedalo stiahnuť, stav sa nedá určiť (skúsiť neskôr)
M=$1; Z=${2:-https://www.headspa30.sk}
[ -f "$M" ] || { echo "chýba manifest: $M"; exit 2; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
CR=$(printf '\r')
k=$(date +%s); ok=0; n=0; chyba=""; siet=0
while read -r h f; do
  f=${f%"$CR"}
  [ -n "$f" ] || continue
  n=$((n+1))
  u=$(printf '%s' "$f" | sed 's/%/%25/g; s/ /%20/g; s/#/%23/g; s/?/%3F/g')
  for pokus in 1 2 3; do
    rm -f "$T/x"
    c=$(curl -s -g -o "$T/x" -w '%{http_code}' --max-time 60 --retry 2 --retry-all-errors --retry-delay 2 "$Z/$u?k=$k")
    [ "$c" = 000 ] || break
    [ "$pokus" = 3 ] || sleep 5
  done
  [ "$c" = 000 ] && siet=$((siet+1))
  # manifest môže mať plný md5 (32 znakov) aj skrátený; porovnáva sa jeho dĺžka
  d=${#h}
  if [ "$c" = 200 ] && [ "$(md5sum < "$T/x" | cut -c1-"$d")" = "$h" ]; then ok=$((ok+1)); else chyba="$chyba
$f"; fi
done < "$M"
zp=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$Z/NAHRAJ-NA-WEB/index.html?k=$k")
if [ "$siet" -gt 10 ] || { [ "$siet" -gt 0 ] && [ $((ok+siet)) = "$n" ]; }; then s=CHYBA_SIETE
elif [ "$ok" = "$n" ]; then s=HOTOVO
elif [ "$zp" = 200 ]; then s=ZLY_PRIECINOK
elif [ "$ok" = 0 ]; then s=NIC
else s=CIASTOCNE; fi
chyba=$(printf '%s\n' "$chyba" | sed '/^$/d' | head -8 | tr '\n' ' ')
echo "STAV=$s sedi=$ok/$n siet=$siet chyba=$chyba"
