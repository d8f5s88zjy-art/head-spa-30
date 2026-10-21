# Čistota behov: pre každý beh z behy.tsv (meno, začiatok, koniec v s) priemer a maximum záťaže a počet vzoriek s cudzím prehliadačom
# z vzorky.txt (epoch, záťaž 1 min, počet cudzích prehliadačov). Beh bez vzoriek = nepokrytý.   python3 -I cistota.py
import os, statistics as st
K = os.path.dirname(os.path.abspath(__file__))
vz = []
for l in open(f'{K}/vzorky.txt'):
    p = l.split()
    if len(p) == 3 and p[0].isdigit(): vz.append((int(p[0]), float(p[1]), int(p[2])))
print('| beh | trvanie s | vzoriek | záťaž priem | záťaž max | vzoriek s cudzím prehliadačom |'); print('|---|---|---|---|---|---|')
seen = {}
for l in open(f'{K}/behy.tsv'):
    m, a, b = l.rstrip('\n').split('\t'); a, b = int(a), int(b)
    seen[m] = (a, b)   # posledný záznam
for m, (a, b) in seen.items():
    w = [v for v in vz if a - 1 <= v[0] <= b + 1]
    if w: print(f'| {m} | {b-a} | {len(w)} | {st.mean(v[1] for v in w):.2f} | {max(v[1] for v in w):.2f} | {sum(1 for v in w if v[2]>0)} |')
    else: print(f'| {m} | {b-a} | 0 | – | – | – |')
