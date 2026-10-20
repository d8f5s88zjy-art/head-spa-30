#!/bin/bash
# Hárok jedného webu: 3 snímky počítača + 3 snímky telefónu v jednom obrázku.
P=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/chyba/porovnanie
for k in "$@"; do
  cd $P/snimky
  python3 -I $P/skripty/hárok.py $P/snimky/_$k-d.jpg 560 3 $k-d-0.jpg $k-d-1.jpg $k-d-2.jpg >/dev/null
  python3 -I $P/skripty/hárok.py $P/snimky/_$k-m.jpg 260 3 $k-m-0.jpg $k-m-1.jpg $k-m-2.jpg >/dev/null
  python3 -I - $P/snimky/_$k-d.jpg $P/snimky/_$k-m.jpg $P/snimky/_$k.jpg <<'PY'
import sys
from PIL import Image
a=Image.open(sys.argv[1]); b=Image.open(sys.argv[2])
W=a.width+b.width+10; H=max(a.height,b.height)
s=Image.new('RGB',(W,H),(40,40,40)); s.paste(a,(0,0)); s.paste(b,(a.width+10,0)); s.save(sys.argv[3],quality=80)
PY
  rm -f $P/snimky/_$k-d.jpg $P/snimky/_$k-m.jpg
  echo $P/snimky/_$k.jpg
done
