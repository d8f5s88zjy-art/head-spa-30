# Výber médií pre scény

Zdroje: `source/photos/foto-NN.jpg` (majiteľ, na výšku 1932×2576 alebo 1200×1600),
`source/web-povodny/gallery/NN.jpg` (profesionálne fotky z aktuálneho webu, na šírku
4096×2731), `source/web-povodny/slider/N.jpg` (1920×1200), `source/web-povodny/team/NN.png`
(portréty 821×695). Slug = názov v `assets/img/`.

| slug | zdroj | scéna | desktop/mobil | focal (x,y %) | alt (sk) | ľudia |
|---|---|---|---|---|---|---|
| kreslo-slnko | gallery/28.jpg | 1 (poster bez WebGL), 6, OG | oba | 58,55 | Barberské kreslo s čiernou prešívanou kožou a zlatým rámom v rannom svetle | nie |
| naradie-nozince | slider/4.jpg | 2 | oba | 50,50 | Nožnice a hrebeň na barberskej podložke s logom | nie |
| detail-stol | gallery/39.jpg | 2, 6 | oba | 45,55 | Karafa, pomády a štetka na holenie na pracovnom stole | nie |
| kreslo-detail | foto-36.jpg | 2 (prelínanie s 3D) | mobil | 50,58 | Barberské kreslo s bronzovým rámom a prešívanou kožou zblízka | nie |
| sala-recepcia | gallery/35.jpg | 3 | desktop | 45,55 | Predná sála s recepciou, oranžovými lampami a barber pole | nie |
| sala-recepcia-m | foto-42.jpg | 3 | mobil | 50,58 | Predná sála s tmavým trámovým stropom smerom k vchodu | nie |
| sala-hlavna | gallery/38.jpg | 3 | desktop | 50,55 | Hlavná sála s radom kresiel, zrkadlami a Edisonovými lampami | nie |
| sala-hlavna-m | foto-41.jpg | 3 | mobil | 55,60 | Hlavná sála so zelenými obkladmi a bronzovými kreslami | nie |
| zadna-miestnost | gallery/31.jpg | 3 | desktop | 50,55 | Zadná miestnosť s čiernymi obkladmi, červeným kreslom a benzínovou pumpou | nie |
| zadna-miestnost-m | foto-20.jpg | 3 | mobil | 50,50 | Čakacia zóna so zelenými zamatovými sedačkami | nie (len zarámované fotky) |
| tim-NN (10×) | team/*.png | 4 | oba | 50,35 | Portrét: {meno}, {rola}, Barbershop 30 | áno – zamestnanci (zverejnené podnikom) |
| galeria-barberpole | foto-26.jpg | 6 | oba | 62,28 | Dva svietiace barber pole na stĺpe | nie |
| galeria-buldog | gallery/36.jpg | 6 | oba | 50,55 | Kreslá, farebná soška buldoga a retro benzínová pumpa | nie |
| galeria-kava | gallery/41.jpg | 6 | oba | 50,50 | Káva a voda na drevenom podnose v rannom slnku | nie |
| galeria-neon | foto-35.jpg | 6 | oba | 45,48 | Svietiaci nápis Barbershop 30 v machovom ráme na lamelovej stene | nie |
| galeria-zrkadlo | foto-45.jpg | 6 | oba | 45,55 | Pracovné miesto s dreveným rámom zrkadla a produktmi | nie |
| galeria-sud | gallery/30.jpg | 6 | oba | 50,55 | Predná sála so sudom, uterákmi a kruhovými svietidlami | nie |
| vstup-fasada | gallery/43.jpg | 7 (poster bez WebGL), kontakt | desktop | 55,50 | Fasáda Barbershop 30 na Mostnej ulici v Nitre | rozmazané auto, bez osôb |
| vstup-rohozka | foto-37.jpg | 7 | mobil | 48,55 | Vstup s rohožkou s logom 30 Barbershop Holičstvo | nie |

Nepoužité pre súkromie alebo práva: foto-43 (chodec na ulici), foto-03 (odraz muža
v zrkadle), foto-17 (figúrka Mickey Mouse, vizitka Salónu 30), foto-28 (plagát
s tvárou modelu), foto-07/19/25 (zarámované fotky cudzích osôb ako hlavný motív),
gallery/42 (chodci na chodníku), foto-39 (odraz fotografa v prilbe astronauta).

Šírky: 640, 1080, 1600, 2200 px (na šírku) / 640, 1080, 1600 (na výšku, strop = originál).
Formáty: AVIF (q 55) + WebP (q 78) + JPEG (q 82, progressive). Portréty: 640, 960.

## Film prehliadky (assets/img/film/, zoznam a pôvod v `film.json`, skript `source/tools/film.py`)

Zábery filmu s hĺbkovými mapami idú len z profesionálnych fotiek (gallery, slider), pretože
sa na obrazovke zväčšujú: 13 záberov podľa TOUR_DIRECTION a k nim `rohozka` (slider/3,
1920×1200, originál bez zväčšenia) ako záber úvodu hneď za dverami. Telefónne fotky
majiteľa (1200 px) sa vo filme nepoužívajú, iba v galérii. Prológ (úvod ako film) ide
z `vstup` (gallery/43, bod záujmu dvere 76,53) do `rohozka` (50,55; telefón 44,58).

## Videá (assets/video/, zdroj: 3 telefónne videá od majiteľa, `source/video/video-1..3.mp4`, 576×1024, 9–13 s)

| slug | zdroj | výrez | scéna | použitie | ľudia |
|---|---|---|---|---|---|
| remeslo-strojcek | video-3.mp4 | 0,5–7,5 s | 2 Remeslo | tichá slučka v portrétovom okne vedľa textu (desktop), na mobile cez celú šírku; nadväzuje na detail 3D opierky | barber (zamestnanec) pri práci, klient zozadu |
| tim-v-akcii | video-2.mp4 | 1–9 s | 4 Ľudia | tichá slučka „tím v akcii“ pri portrétoch (hlavná sála, traja barberi pri práci) | barberi, klienti zozadu, recepčná v pozadí |
| remeslo-styling | video-1.mp4 | 0–8 s | záloha / galéria | barber so sprejom pri stylingu | barber, klient zozadu |

Formáty: MP4 H.264 (crf 23, faststart) + WebM VP9 (crf 34), bez zvuku, poster AVIF/WebP/JPEG
576 px. Veľkosť 0,8–1,5 MB na slučku – načítavajú sa až pri priblížení sekcie
(`preload="none"`, `IntersectionObserver`), prehrávajú sa `muted playsinline loop`,
pri `prefers-reduced-motion` ostáva poster. Rozlíšenie 576 px stačí na portrétové
okno do ~430 px šírky; na desktope sa nepoužíva ako full‑bleed pozadie (bolo by
rozmazané). **Súhlas:** klienti sú zozadu, barberi sú zamestnanci – potvrdiť
u majiteľa pred zverejnením (poznámka v CONTENT_SOURCES.md).
