#!/usr/bin/env python3
"""Nastavenie hostingu: presmerovania starých adries pôvodného webu (…/sk/….aspx a files/N.pdf) na nové (301),
vlastná stránka 404, kompresia a cache.
Použitie (v priečinku webu): python3 -I nasadenie/presmerovania.py . nasadenie [--kanonicke]
Vyrobí presmerovania.tsv, htaccess.txt (Apache, na hostingu premenovať na .htaccess) a web.config.txt (IIS,
pôvodný hosting beží na IIS 10 / ASP.NET; na hostingu premenovať na web.config).
Pravidlá cesty sú rovnaké ako path_for() v build.py; stránky vynechané v build.py idú na najbližšiu rodičovskú stránku.

Poradie pravidiel (README, časť HTTPS a presmerovania):
1. Kanonická adresa: schéma a host podľa DOMENA v build.py (dnes https://www.). Pravidlo je pripravené, ale vypnuté
   (zakomentované v htaccess.txt, enabled="false" vo web.config.txt), kým hosting nemá funkčné HTTPS (otvorená otázka).
   S prepínačom --kanonicke sa vyrobí zapnuté. Staré adresy .aspx a files/ ho obchádzajú.
2. Staré adresy pôvodného webu (…/sk/….aspx) a súbory files/N rovno na absolútny cieľ na kanonickej adrese, takže aj
   z http:// alebo bez www je to jedno presmerovanie (bez reťaze).
Na konci skript vypíše kontrolu: stránky zdroja, chýbajúce, neexistujúce ciele a reťaze."""
import sys, os, json, re
from urllib.parse import urlparse

ROOT, OUT = sys.argv[1], sys.argv[2]
KANONICKE = '--kanonicke' in sys.argv[3:]
SRC = json.load(open(os.path.join(ROOT, 'zdroj/pages.json'), encoding='utf-8'))
# DOMENA z build.py (bez importu generátora): https://www.stavebninyrichtarik.sk/
DOMENA = re.search(r"^DOMENA = '([^']+)'", open(os.path.join(ROOT, 'build.py'), encoding='utf-8').read(), re.M).group(1)
SCHEMA, HOST = urlparse(DOMENA).scheme, urlparse(DOMENA).netloc
absolutna = lambda cesta: DOMENA + cesta.lstrip('/')   # cieľ presmerovania na kanonickej adrese
# staré adresy, ktoré kanonické pravidlo obchádza (idú rovno na cieľ pravidlami starých adries)
STARE = r'sk\.aspx$|sk/.+\.aspx$|files/'

nice = lambda s: re.sub(r'-{2,}', '-', s)


def path_for(slug):
    parts = slug.split('__')
    if slug == 'uvod': return ''
    if parts[0] == 'katalog-roduktov':
        return 'katalog/index.html' if len(parts) == 1 else 'katalog/' + '/'.join(nice(p) for p in parts[1:]) + '.html'
    if parts[0] in ('akcie', 'novinky'):
        return parts[0] + '/index.html' if len(parts) == 1 else parts[0] + '/' + nice(parts[1]) + '.html'
    if parts[0] == 'fotogaleria':
        return 'galeria/index.html'   # albumy sú v lightboxe na jednej stránke
    return {'o-nas': 'o-nas.html', 'sluzby': 'sluzby.html', 'kontakt': 'kontakt.html', 'akciovy-letak': 'letak.html'}.get(slug)


rows, chyby = [], []
for slug, v in sorted(SRC.items()):
    old = urlparse(v['url']).path
    new = path_for(slug)
    s = slug
    while (new is None or (new and not os.path.exists(os.path.join(ROOT, new)))) and '__' in s:
        s = s.rsplit('__', 1)[0]; new = path_for(s)   # vynechaná stránka → rodič
    if new is None or (new and not os.path.exists(os.path.join(ROOT, new))):
        new = ''   # napr. error-page, mapa → úvod
    rows.append((old, '/' + new))
os.makedirs(OUT, exist_ok=True)
rows.append(('/sk.aspx', '/'))
rows = sorted(set(rows))
# súbory pôvodného webu (files/N.pdf, .doc, .wmv), ktoré sú stiahnuté v pdf/ a subory/
PDF = sorted((f[:-4] for f in os.listdir(os.path.join(ROOT, 'pdf')) if re.fullmatch(r'\d+\.pdf', f)), key=int)
DOC = sorted((f[:-4] for f in os.listdir(os.path.join(ROOT, 'subory')) if re.fullmatch(r'\d+\.doc', f)), key=int)
VIDEO = [('233.wmv', 'subory/233-onduvilla-montaz.mp4')] if os.path.exists(os.path.join(ROOT, 'subory/233-onduvilla-montaz.mp4')) else []
subory = [(f'/files/{n}.pdf', f'/pdf/{n}.pdf') for n in PDF] + [(f'/files/{n}.doc', f'/subory/{n}.doc') for n in DOC] + [(f'/files/{a}', '/' + b) for a, b in VIDEO]
open(os.path.join(OUT, 'presmerovania.tsv'), 'w').write(''.join(f'{a}\t{b}\n' for a, b in rows + subory))
DLHA = 'avif|webp|jpg|jpeg|png|gif|svg|ico|woff2|pdf|mp4|doc'   # img/, pdf/, subory/, písma: rok
KRATKA = 'html|css|js|json|xml|txt|webmanifest'                 # názvy bez verzie: 10 minút a overenie
ht = ['# Stavebniny Richtárik – nastavenie pre Apache (na hostingu premenovať na .htaccess). Vyrobené: nasadenie/presmerovania.py',
      'ErrorDocument 404 /404.html', 'AddType image/avif .avif', 'AddType image/webp .webp', 'AddType font/woff2 .woff2',
      'AddType application/manifest+json .webmanifest', '',
      '<IfModule mod_brotli.c>', '  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/plain text/xml application/javascript application/json application/manifest+json image/svg+xml', '</IfModule>',
      '<IfModule mod_deflate.c>', '  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json application/manifest+json image/svg+xml', '</IfModule>',
      '<IfModule mod_headers.c>', f'  <FilesMatch "\\.({DLHA})$">', '    Header set Cache-Control "max-age=31536000, immutable"', '  </FilesMatch>',
      f'  <FilesMatch "\\.({KRATKA})$">', '    Header set Cache-Control "max-age=600, must-revalidate"', '  </FilesMatch>',
      '  # písma aj pre stránku v ráme bez allow-same-origin (pôvod null, napr. náhľad): bez hlavičky prehliadač písmo odmietne',
      '  <FilesMatch "\\.woff2$">', '    Header set Access-Control-Allow-Origin "*"', '  </FilesMatch>', '</IfModule>', '',
      'RewriteEngine On', '',
      f'# 1. Kanonická adresa {DOMENA} (schéma a host). ' + ('ZAPNUTÉ.' if KANONICKE else
      'VYPNUTÉ: odkomentovať až keď ' + DOMENA + ' na hostingu funguje (README, HTTPS a presmerovania).'),
      '#    Staré adresy (.aspx, files/) ho obchádzajú a idú rovno na cieľ v časti 2 (jedno presmerovanie, bez reťaze).',
      '#    Za proxy, ktorá ukončuje HTTPS, namiesto %{HTTPS} použiť %{HTTP:X-Forwarded-Proto} (README).']
kom = '' if KANONICKE else '#'
ht += [f'{kom}RewriteCond %{{HTTPS}} {"off" if SCHEMA == "https" else "on"} [OR]',
       f'{kom}RewriteCond %{{HTTP_HOST}} !^{re.escape(HOST)}$ [NC]',
       f'{kom}RewriteRule ^(?!{STARE})(.*)$ {DOMENA}$1 [R=301,L,NE,NC]', '',
       '# 2. 301 zo starých adries pôvodného webu (vyrobené zo zdroj/pages.json) a zo starých súborov files/N, rovno na',
       f'#    kanonickú adresu {DOMENA}']
for a, b in rows:
    ht.append(f'RewriteRule ^{re.escape(a.lstrip("/"))}$ {absolutna(b)} [R=301,L,NC]')
ht.append(f'RewriteRule ^files/({"|".join(PDF)})\\.pdf$ {absolutna("pdf/")}$1.pdf [R=301,L,NC]')
if DOC: ht.append(f'RewriteRule ^files/({"|".join(DOC)})\\.doc$ {absolutna("subory/")}$1.doc [R=301,L,NC]')
for a, b in VIDEO: ht.append(f'RewriteRule ^files/{re.escape(a)}$ {absolutna(b)} [R=301,L,NC]')
open(os.path.join(OUT, 'htaccess.txt'), 'w').write('\n'.join(ht) + '\n')
wc = ['<?xml version="1.0" encoding="UTF-8"?>', '<!-- Stavebniny Richtárik – nastavenie pre IIS (na hostingu premenovať na web.config). Vyrobené: nasadenie/presmerovania.py -->',
      '<configuration><system.webServer>', '<rewrite><rewriteMaps><rewriteMap name="stare">']
wc += [f'  <add key="{a.lower()}" value="{absolutna(b)}" />' for a, b in rows]
wc += ['</rewriteMap></rewriteMaps><rules>',
       f'<!-- 1. Kanonická adresa {DOMENA}: ' + ('zapnuté' if KANONICKE else 'vypnuté (enabled="false"), zapnúť až keď ' + DOMENA + ' na hostingu funguje (README, HTTPS a presmerovania)') + '. Staré adresy ho obchádzajú. -->',
       f'<rule name="kanonicka adresa" enabled="{"true" if KANONICKE else "false"}" stopProcessing="true"><match url="^(?!{STARE})(.*)$" ignoreCase="true" />',
       '<conditions logicalGrouping="MatchAny">' + f'<add input="{{HTTPS}}" pattern="^{"OFF" if SCHEMA == "https" else "ON"}$" />'
       + f'<add input="{{HTTP_HOST}}" pattern="^{re.escape(HOST)}$" negate="true" /></conditions>',
       f'<action type="Redirect" url="{DOMENA}{{R:1}}" redirectType="Permanent" /></rule>',
       f'<!-- 2. Staré adresy rovno na kanonickú adresu {DOMENA} (jedno presmerovanie) -->',
       '<rule name="stare adresy" stopProcessing="true"><match url=".*" />',
       '<conditions><add input="{stare:{REQUEST_URI}}" pattern="(.+)" /></conditions>',
       '<action type="Redirect" url="{C:1}" redirectType="Permanent" /></rule>',
       f'<rule name="stare pdf" stopProcessing="true"><match url="^files/({"|".join(PDF)})\\.pdf$" ignoreCase="true" /><action type="Redirect" url="{absolutna("pdf/")}{{R:1}}.pdf" redirectType="Permanent" /></rule>']
if DOC: wc.append(f'<rule name="stare doc" stopProcessing="true"><match url="^files/({"|".join(DOC)})\\.doc$" ignoreCase="true" /><action type="Redirect" url="{absolutna("subory/")}{{R:1}}.doc" redirectType="Permanent" /></rule>')
for a, b in VIDEO: wc.append(f'<rule name="stare video" stopProcessing="true"><match url="^files/{re.escape(a)}$" ignoreCase="true" /><action type="Redirect" url="{absolutna(b)}" redirectType="Permanent" /></rule>')
wc += ['</rules></rewrite>',
       '<httpErrors errorMode="Custom" existingResponse="Replace"><remove statusCode="404" /><error statusCode="404" path="/404.html" responseMode="ExecuteURL" /></httpErrors>',
       '<urlCompression doStaticCompression="true" doDynamicCompression="false" />',
       '<staticContent>',
       '  <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="00:10:00" />',
       '  <remove fileExtension=".avif" /><mimeMap fileExtension=".avif" mimeType="image/avif" />',
       '  <remove fileExtension=".webp" /><mimeMap fileExtension=".webp" mimeType="image/webp" />',
       '  <remove fileExtension=".woff2" /><mimeMap fileExtension=".woff2" mimeType="font/woff2" />',
       '  <remove fileExtension=".webmanifest" /><mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />',
       '  <remove fileExtension=".mp4" /><mimeMap fileExtension=".mp4" mimeType="video/mp4" />',
       '</staticContent>',
       '</system.webServer>']
for loc in ('img', 'pdf', 'subory', 'assets/fonts'):   # súbory, ktorých obsah sa pod rovnakým názvom nemení: cache na rok
    # písma aj pre stránku v ráme bez allow-same-origin (pôvod null): hlavička CORS (do 13. 11. 2026 len ručne v súbore)
    cors = ('\n  <httpProtocol><customHeaders><add name="Access-Control-Allow-Origin" value="*" /></customHeaders></httpProtocol>'
            if loc == 'assets/fonts' else '')
    wc.append(f'<location path="{loc}"><system.webServer><staticContent><clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" /></staticContent>{cors}</system.webServer></location>')
wc += ['</configuration>']
open(os.path.join(OUT, 'web.config.txt'), 'w').write('\n'.join(wc) + '\n')
# kontrola: každá stránka zdroja má presmerovanie, cieľ existuje a nie je reťaz (cieľ je na kanonickej adrese, nie je
# to stará adresa a kanonické pravidlo ho nezachytí; staré adresy kanonické pravidlo obchádza)
stare_cesty = {a.lower() for a, b in rows} | {a.lower() for a, b in subory}
zdroj = {urlparse(v['url']).path.lower() for v in SRC.values()}
chyba_zdroj = sorted(zdroj - stare_cesty)
ciele = [b for a, b in rows + subory]
neexist = [b for b in ciele if b != '/' and not os.path.exists(os.path.join(ROOT, b.lstrip('/')))]
kan = re.compile(rf'^(?!{STARE})(.*)$', re.I)
retaze = [b for b in ciele if b.lower() in stare_cesty or b.lower().endswith('.aspx') or b.lower().startswith('/files/')]
retaze += [a for a in stare_cesty if kan.match(a.lstrip('/'))]   # stará adresa, ktorú by zachytilo kanonické pravidlo
retaze += [x for x in [absolutna(b) for b in ciele] if not x.startswith(DOMENA)]
print('kanonická adresa', DOMENA, '(pravidlo ' + ('zapnuté' if KANONICKE else 'pripravené, vypnuté') + ')')
print('v zdroji stránok', len(SRC), '| chýba', len(chyba_zdroj), chyba_zdroj[:5], '| presmerovaní', len(rows), '| súborov files/', len(subory),
      '| na úvod', sum(1 for a, b in rows if b == '/'), '| neexistujúci cieľ', len(neexist), neexist[:5], '| reťaze', len(retaze), retaze[:5])
