#!/usr/bin/env python3
"""Rozbor výstupu rozklad.mjs po skokoch: kedy skrol dobehol, kedy sa stiahla a rozbalila fotka cieľového záberu,
kedy bola textúra hotová (ready), koľko snímok trvalo nahrávanie po pásoch a kedy sa obraz rozsvietil (mix/ready).
Odhad pre telefón s grafikou: sieť + rozbalenie + pásy (1 pás na snímku 16,7 ms; 1448 × 2575 = 11 pásov + hĺbka 6) + polovica nábehu.
  python3 rozklad2.py rozklad-<meno>.json"""
import json, sys
d = json.load(open(sys.argv[1])); raw = d['raw']; J = raw['jumps']
raf = raw['raf'] if 'raf' in raw else []
rows = []
for (h, t0), nxt in zip(J, J[1:] + [[None, 1e15]]):
    t1 = nxt[1]
    st = [x for x in raw['st'] if t0 - 100 <= x[0] < t1]
    if not st: continue
    fin = st[-1]; yF = fin[1]; cur = fin[2]; ci = round(fin[4])
    t_scroll = next((x[0] for x in st if abs(x[1] - yF) < 2), None)
    t_ready = next((x[0] for x in st if x[0] >= (t_scroll or t0) and len(x[5]) > ci and x[5][ci] in '13' and x[2] == cur), None)
    was = st[0][5][ci] in '13' if len(st[0][5]) > ci else False
    base = cur
    res = [r for r in raw['res'] if t0 - 100 <= r[1] < t1 and ('/' + base + '-') in '/' + r[0].split('/')[-1]]
    bmp = [b for b in raw['bmp'] if t0 - 100 <= b[1] < t1 and ('/' + base + '-') in '/' + b[0].split('/')[-1]]
    net_end = max([r[2] for r in res], default=None); kb = sum(r[3] for r in res) // 1024
    dec = max([b[2] for b in bmp], default=0); dec_end = max([b[1] + b[2] for b in bmp], default=None)
    rows.append(dict(kotva=h, zaber=cur, uz_bol=was, skrol_ms=(t_scroll - t0) if t_scroll else None,
                     siet_koniec_ms=(net_end - t0) if net_end else None, kB=kb, rozbalenie_ms=dec,
                     ready_ms=(t_ready - t0) if t_ready else None,
                     nahratie_ms=(t_ready - dec_end) if (t_ready and dec_end) else None))
for r in rows:
    est = None
    if not r['uz_bol']:
        # na telefóne s grafikou: sieť (rovnaká), rozbalenie (rovnaké pri CPU 1×), 17 pásov po 16,7 ms, polovica nábehu 225 ms
        start = r['skrol_ms'] or 0
        est = round(max(start, r['siet_koniec_ms'] or 0) + r['rozbalenie_ms'] + 17 * 16.7 + 225 - start)
    r['odhad_cierneho_platna_po_dobehnuti_skrolu_ms'] = est
    print(json.dumps(r, ensure_ascii=False))
