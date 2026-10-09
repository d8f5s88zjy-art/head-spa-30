#!/usr/bin/env python3
"""Vytvorí AVIF/WebP/JPEG varianty vybraných fotiek podľa docs/MEDIA_SELECTION.md a zapíše assets/img/manifest.json.
Spustenie: python3 source/tools/build_images.py  (z koreňa barbershop-30)"""
import json, os, sys, re
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC_PHOTOS = os.path.join(ROOT, 'source', 'photos')
SRC_WEB = os.path.join(ROOT, 'source', 'web-povodny')
OUT = os.path.join(ROOT, 'assets', 'img')
os.makedirs(OUT, exist_ok=True)

TEAM = [('47','Nikolas','Barber'),('50','Kristián','Barber'),('49','Damian','Barber'),('40','Michal','Barber'),
        ('48','Andy','Barber'),('41','Dominika','Barberka'),('38','Kevin','Barber'),('18','Lajko','Barber'),
        ('2','Jojo','Barber'),('42','Adrian','Barber')]

# slug: (source, focal(x,y), alt, scenes, people, widths)
SEL = {
 'kreslo-slnko':      ('gallery/28.jpg',(58,55),'Barberské kreslo s čiernou prešívanou kožou a zlatým rámom v rannom svetle',[1,6],'nie',[640,1080,1600,2200]),
 'naradie-noznice':   ('slider/4.jpg',(50,50),'Nožnice a hrebeň na barberskej podložke s logom',[2],'nie',[640,1080,1600,1920]),
 'detail-stol':       ('gallery/39.jpg',(45,55),'Karafa, pomády a štetka na holenie na pracovnom stole',[2,6],'nie',[640,1080,1600,2200]),
 'kreslo-detail':     ('photos/foto-36.jpg',(50,58),'Barberské kreslo s bronzovým rámom a prešívanou kožou zblízka',[2],'nie',[640,1080,1600]),
 'sala-recepcia':     ('gallery/35.jpg',(45,55),'Predná sála s recepciou, oranžovými lampami a barber pole',[3],'nie',[640,1080,1600,2200]),
 'sala-recepcia-m':   ('photos/foto-42.jpg',(50,58),'Predná sála s tmavým trámovým stropom smerom k vchodu',[3],'nie',[640,1080,1600]),
 'sala-hlavna':       ('gallery/38.jpg',(50,55),'Hlavná sála s radom kresiel, zrkadlami a Edisonovými lampami',[3],'nie',[640,1080,1600,2200]),
 'sala-hlavna-m':     ('photos/foto-41.jpg',(55,60),'Hlavná sála so zelenými obkladmi a bronzovými kreslami',[3],'nie',[640,1080,1600]),
 'zadna-miestnost':   ('gallery/31.jpg',(50,55),'Zadná miestnosť s čiernymi obkladmi, červeným kreslom a benzínovou pumpou',[3],'nie',[640,1080,1600,2200]),
 'zadna-miestnost-m': ('photos/foto-20.jpg',(50,50),'Čakacia zóna so zelenými zamatovými sedačkami',[3],'nie',[640,1080,1600]),
 'galeria-barberpole':('photos/foto-26.jpg',(62,28),'Dva svietiace barber pole na stĺpe',[6],'nie',[640,1080,1600]),
 'galeria-buldog':    ('gallery/36.jpg',(50,55),'Kreslá, farebná soška buldoga a retro benzínová pumpa',[6],'nie',[640,1080,1600,2200]),
 'galeria-kava':      ('gallery/41.jpg',(50,50),'Káva a voda na drevenom podnose v rannom slnku',[6],'nie',[640,1080,1600,2200]),
 'galeria-neon':      ('photos/foto-35.jpg',(45,48),'Svietiaci nápis Barbershop 30 v machovom ráme na lamelovej stene',[6],'nie',[640,1080]),
 'galeria-zrkadlo':   ('photos/foto-45.jpg',(45,55),'Pracovné miesto s dreveným rámom zrkadla a produktmi',[6],'nie',[640,1080,1600]),
 'galeria-sud':       ('gallery/30.jpg',(50,55),'Predná sála so sudom, uterákmi a kruhovými svietidlami',[6],'nie',[640,1080,1600,2200]),
 'vstup-fasada':      ('gallery/43.jpg',(55,50),'Fasáda Barbershop 30 na Mostnej ulici v Nitre',[7],'nie (rozmazané auto)',[640,1080,1600,2200]),
 'vstup-rohozka':     ('photos/foto-37.jpg',(48,55),'Vstup s rohožkou s logom 30 Barbershop Holičstvo',[7],'nie',[640,1080]),
}
for n,name,role in TEAM:
    SEL['tim-'+name.lower().replace('á','a').replace('š','s').replace('č','c')] = ('team/%s.png'%n,(50,35),'%s, %s v Barbershop 30'%(name,role),[4],'áno – zamestnanec',[480,820])

def src_path(rel):
    return os.path.join(SRC_PHOTOS, rel.split('/',1)[1]) if rel.startswith('photos/') else os.path.join(SRC_WEB, rel)

manifest = {'images': {}, 'team': [{'slug':'tim-'+name.lower().replace('á','a').replace('š','s').replace('č','c'),'name':name,'role':role} for n,name,role in TEAM]}
only = sys.argv[1:]  # voliteľne len niektoré slugy
for slug,(rel,focal,alt,scenes,people,widths) in SEL.items():
    if only and slug not in only: continue
    p = src_path(rel)
    im = ImageOps.exif_transpose(Image.open(p))
    has_alpha = im.mode in ('RGBA','LA')
    im = im.convert('RGBA' if has_alpha else 'RGB')
    W,H = im.size
    out_widths = [w for w in widths if w <= W] or [W]
    entry = {'source': rel, 'alt': alt, 'focal': list(focal), 'scenes': scenes, 'people': people,
             'width': W, 'height': H, 'aspect': [W,H], 'widths': out_widths, 'formats': ['avif','webp','jpg'] if not has_alpha else ['avif','webp','png'], 'files': {}}
    for w in out_widths:
        h = round(H * w / W)
        r = im if w == W else im.resize((w,h), Image.LANCZOS)
        base = os.path.join(OUT, '%s-%d' % (slug,w))
        r.save(base+'.avif', quality=55, speed=6)
        r.save(base+'.webp', quality=78, method=5)
        if has_alpha: r.save(base+'.png', optimize=True)
        else: r.save(base+'.jpg', quality=82, optimize=True, progressive=True)
        entry['files'][w] = {f: os.path.getsize('%s.%s'%(base,f)) for f in entry['formats']}
        print(slug, w, {f: round(entry['files'][w][f]/1024) for f in entry['formats']}, flush=True)
    manifest['images'][slug] = entry
if not only:
    json.dump(manifest, open(os.path.join(OUT,'manifest.json'),'w'), ensure_ascii=False, indent=1)
else:
    m = json.load(open(os.path.join(OUT,'manifest.json'))) if os.path.exists(os.path.join(OUT,'manifest.json')) else manifest
    m['images'].update(manifest['images']); json.dump(m, open(os.path.join(OUT,'manifest.json'),'w'), ensure_ascii=False, indent=1)
print('done', len(manifest['images']))
