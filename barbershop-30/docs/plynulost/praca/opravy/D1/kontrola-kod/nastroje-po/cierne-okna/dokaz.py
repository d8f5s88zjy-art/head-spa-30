#!/usr/bin/env python3
"""Pás snímok čierneho okna z ana.json (začiatok, najhorší, koniec, po) do dokazy/: python3 dokaz.py run od_ms out.jpg"""
import sys, json, os, subprocess
run, od, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
a = json.load(open(os.path.join('runs', run, 'ana.json')))
r = json.load(open(os.path.join('runs', run, 'snimky.json')))
e = min(a['udalosti'], key=lambda e: abs(e['od_ms'] - od))
files = e['subory'][:]
idx = {x['file']: k for k, x in enumerate(r)}
k = idx[files[-1]]
if k + 1 < len(r): files.append(r[k + 1]['file'])
k0 = idx[files[0]]
if k0 > 0: files.insert(0, r[k0 - 1]['file'])
subprocess.run(['python3', 'strip.py', os.path.join('runs', run), out] + files, check=True)
print(out, e['od_ms'], e['trvanie_ms'], files)
