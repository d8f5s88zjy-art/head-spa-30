# Úprava recepcia.js (oprava 3b): spojená služba so spojkou pokrýva celé názvy svojich častí (len slová iných služieb)
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
a = "((X.pravidlo === 'spolu' && !sp) || kn(y).some((n) => !xn.includes(n))\n"
b = "((X.pravidlo === 'spolu' ? !sp : kn(y).some((n) => !xn.includes(n)))\n"
assert s.count(a) == 1
s = s.replace(a, b)
a2 = "&& !xn.split(' ').includes(w))));\n"
assert s.count(a2) == 1
s = s.replace(a2, "&& !xn.split(' ').includes(w))));\n")
open(p, 'w', encoding='utf8').write(s)
print('ok')
