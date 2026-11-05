# Skeptik: BARBERSHOP 30 po zlepšeniach „Film, ktorý riadiš“, HEAD a24ec0c8 (5. 11. 2026)

Tvrdenie: „Web Barbershop 30 je filmovejší a hravý – zákazník má s čím pracovať (vyskúšaj každú novú interakciu na
telefóne aj počítači) a nič z toho ho nespomalí. Rezervácia z webu prejde: všetky tlačidlá vedú do funkčného
rezervačného systému podniku so správnymi službami, cenami a barbermi (bez skutočného odoslania); okno objednávky
funguje aj pri chybách siete. Opravy auditu platia a nič nové sa nepokazilo. Zlepšenia vizuálu a plynulosti sú
merateľne lepšie a nič sa nezhoršilo; žiadne čierne polia; Barber neuvádza zlé ceny; testy prechádzajú; commity bez podpisov.“

**Verdikt: tvrdenie v tejto podobe neplatí – poslat = false.** Väčšina sedí (testy, ceny, okno objednávky, pás
kapitol, Ďalej, čierne polia, commity). Neplatí však tri časti: (1) **živý rezervačný systém dnes neponúka barbera
Damiana**, ktorého web ukazuje s tlačidlom „Objednať sa“; (2) **Kino ▶ na počítači sa nedá zastaviť kolieskom,
kým je myš nad ▶** (čo je hneď po kliknutí) ani šípkou; (3) z hravých bodov plánu sú urobené len pás, ▶, Ďalej a
stlačenie tlačidiel – titulky, „Pozri bližšie“ a zvuk (B5–B7) nie. Plynulosť na skutočnom telefóne a Safari sa
v kontajneri overiť nedá.

Strom som nemenil (`git status --short` prázdny pred aj po). Pracovné súbory: `/dev/shm/skeptik-b30/` (disk `/` má
51–144 MB voľných, preto prehliadač a kópie v RAM). Logy, sondy a otvorené snímky som skopíroval do
`scratchpad/barber/senior/skeptik/` (`snimky/`). Porty: 9187 (kópia 791fb3db), 9188 (strom), 9180–9186 (testy
objednávky a asistenta), 9189 len ako adresa falošného API cez `page.route` (žiadny server). Testy si štartujú
statický server na náhodnom porte.

## Overené tvrdenia (20)

| # | tvrdenie | výsledok | dôkaz |
|---|---|---|---|
| 1 | Commity bez podpisov, autor Claude, nič nové nepushnuté | **platí** | `git rev-list --count c8febb66..HEAD` → 38; `git log --format=%B c8febb66..HEAD \| grep -ciE 'co-authored\|claude-session'` → 0; autor 38× `Claude <noreply@anthropic.com>`. `git branch -vv` → `ahead 29` voči `origin/barbershop-oprava`, ktorý je už **791fb3db** (reflog `update by push`), nie c8febb66 zo zadania. Odkaz majiteľa na githack c8febb66 ukazuje stav o 38 commitov starší |
| 2 | Testy prechádzajú | **platí s výhradou** | kópia HEAD (`git archive`), `skeptik/vysledky.txt`: otazky --kontrola 9/0 (778 otázok), kino-test 38/0, i18n 55/0, en 16/0, en-stranka aktuálna, vychytavky 27/0, objednavka 15/0, asistent 9/0, vaha OK 14 339 B, app-smoke 109/0, admin-test 101/0 (v kópii až po doplnení `vernost/` a `CLAUDE.md`). **Výhrada:** objednavka a asistent „časti so serverom PRESKOČENÉ“ – skutočný server Barbera a kalendára netestovaný; tma-test nespúšťaný (Pillow) |
| 3 | Kino ▶ na telefóne | **platí** | `out-kino-tel.log` 390×844 dotyk: ▶ viditeľné (36×36 px vľavo hore), ťuk → po 7 s `y 1055`, `playing true`, aria „Zastaviť prehliadku“; ťuk do stránky → `playing false`, posun za 1,5 s **0 px** |
| 4 | Kino ▶ na počítači | **čiastočne – nový nález** | `out-prerus.log` 1440×900: koliesko v strede stránky zastaví (posun 2 px), klik zastaví (0 px). **Koliesko s myšou nad ▶ nezastaví (jazda ďalej 1 084 px za 1,5 s), šípka ↓ po kliknutí na ▶ nezastaví (1 078 px).** Príčina `assets/kino.js:55–57`: prerušenie ignoruje udalosti s cieľom v `.kino-play` a kláves, keď má ▶ fokus. Zákazník, ktorý klikne ▶ a hneď skroluje kolieskom, sa so stránkou „bije“ |
| 5 | Ťuk na kapitolu v páse | **platí** | telefón: kapitola 6 → `y 4843` (cieľ 4801), štítok „06 · Služby a ceny“; počítač: `y 6342` (cieľ 6297) – `out-kino-*.log` |
| 6 | Ťah po páse (prst aj myš, nález V1) | **platí** | prst: `1900 → 2325 → 2749 → 3985 → 6033 → 8928`, kapitola 6; myš 1440: `2573 → 3610 → 6538 → 9912 → 13248 → 16594`, kapitola 7 |
| 7 | „Ďalej“ pri zastavení | **platí** | po 3,2 s na Čakárni: „Ďalej Tím ↓“, `href #tim`, opacity 1; ťuk → kapitola 4 (Tím). Snímka `snimky/kino-pc-3-dalej.png` (otvorená): Ďalej vľavo dole, pás v strede dole, nič neprekrýva nadpis ani text karty |
| 8 | Tlačidlá sa pri stlačení stlačia (B8) | **platí v kóde** | `style.css:1478` `.btn:active { transform: scale(0.97); transition-duration: 120ms }`, `:1479–1480` bez pohybu pri obmedzenom pohybe. INP som nemeral |
| 9 | Služby a ceny = živý systém | **platí** | GET `www.barbershop30.sk/rezervacia` → 200, `v-order-component`; z jeho `data` 15 služieb (`skeptik/zive-sluzby.json`). Cenník `index.html`, `en/index.html`, `rezervacia.html`: 15/15 `data-sluzba` id, cena aj trvanie zhodné, 0 nezhôd, 0 navyše |
| 10 | Barberi = živý systém | **NEPLATÍ (dáta podniku)** | web (`index.html:363` a ďalšie): 10 barberov vrátane **Damiana**, každý s „Objednať sa“. Živý systém dnes (len čítanie, stráž pustila 1× `getEmployees`, 0 zrušených): `Nezáleží, Kristián, Nikolas, Michal, Andy, Dominika, Kevin, Jojo, Lajko, Adrian` pre Pánsky strih, Úpravu brady aj detský strih – **Damian chýba** (`out-zivy.log`, `out-zivy2.log`, otvorená `snimky/zivy-barberi.png`). Audit rezervácie z 2. 11. ho v systéme ešte mal. Damian je aj v znalostiach Barbera (`asistent/znalosti/barbershop.md:71`) |
| 11 | Okno objednávky (ukážka) | **platí** | `?objednavka=ukazka`, 390×844: ťuk na Objednať pri „Pánsky strih a úprava brady“ otvorí okno rovno na krok 2; krok 4 „60 min · 28 €“, Dokončiť **736–786 px pri výške 844** (na očiach), odkaz `https://www.barbershop30.sk/rezervacia`, tel. Otvorená `snimky/okno-4.png` |
| 12 | Okno pri chybách siete | **platí** | (a) `stav` OK, ďalšie volania `internetdisconnected`: okno ukáže „Voľné časy teraz neviem overiť. Zavolaj nám…“ + „Dokončiť v rezervačnom systéme“ + 2× `tel:+421951267203`; (b) server neodpovie: okno sa nezapne, Objednať otvorí novú kartu `https://www.barbershop30.sk/rezervacia`; 0 chýb JS (`out-okno.log`) |
| 13 | Barber neuvádza zlé ceny | **platí s výhradou** | ukážka v prehliadači: 15/15 služieb správna cena aj čas (vrátane „kolko stoji strih a brada“ 28 €, pleť 21,50 €, depilácia 5,50 €, „strih pre syna, má 8 rokov“ 15 €) – `out-ceny.log`, `out-combo.log`. **Výhrada:** „strih pre syna a úpravu brady pre mňa“ → len „Úprava brady 15 €“ (detský strih chýba); „Koľko stojí strih a koľko úprava brady?“ → 28 € za kombináciu namiesto 18 € a 15 €. Zlé číslo to nie je, neúplné áno |
| 14 | Žiadne čierne polia | **platí (bez filmu)** | 10 polôh × telefón a počítač: čisto čierne body ≤ 3,8 % (telefón) a ≤ 5,8 % (počítač, poloha Tím – čierne tričká na fotkách, otvorená `snimky/tma-pc-030.png`). Tmavé bunky sú **rovnaké ako na 791fb3db** (rozdiel ≤ 0,5 bodu, `out-tma.log` vs `out-tma-pred.log`) – je to tmavý dizajn, nie diera (otvorené `tma-tel-012.png`, `tma-pc-045.png`). V headless Chromiu je film vypnutý (`world-off`), film s `?film=on` som sám nemeral – opieram sa o `kontrola-plynulost.md` (0 % čiernej v 54 + 10 strihoch) a `oprava2.md` (FIL-3, 0 čiernych snímok) |
| 15 | Bez pretečenia a chýb | **platí** | telefón aj počítač: pretečenie 0 px, 0 chýb konzoly, 0 odpovedí ≥ 400 (`out-kino-*.log`, `out-tma.log`) |
| 16 | SEO: JSON-LD = živý systém | **platí** | `index.html` aj `en/`: HairSalon, 15 ponúk `[3, 4, 5, 5.5, 10, 13, 15, 15, 15, 18, 21.5, 22, 28, 30, 40]` = živé ceny, Mostná 30, 949 01 Nitra, +421951267203 |
| 17 | Žiadna zmienka o AI v nových textoch | **platí** | `git diff c8febb66..HEAD` pridané riadky v index, en, rezervacia, i18n, kino.js, app.js, barbershop.md: 0 výskytov AI/KI/umelá/artificial |
| 18 | Telefón ľahší (bajty) | **čiastočne** | nasadený `index.html` 14 339 B gzip (vaha) proti zdroju c8febb66 15 899 B → **−1,6 kB**. Ale `app.js` 15 437 → 18 272 B gzip (**+2,8 kB**, nad rozpočtom +2,5 kB zo VYBER, hoci časť sú opravy A), `kino.js` +2,6 kB (až po načítaní), `objednavka.js` +2,3 kB (len pri zapnutom okne) |
| 19 | Plynulosť skrolu nezhoršená | **platí v rámci šumu (zlepšenie nie)** | `ab-skrol3.cjs` (prevzatý z oprava2, porty 9187/9188), telefón 390×844 DPR3 CPU4×, 3 + 3 behy striedavo: medián pred / po: p95 **33,4 / 33,4 ms**, snímky > 50 ms **10 / 10**, > 100 ms 0 / 0, prepočty štýlu 2 563 / 2 599×; snímky > 34 ms **26 / 45** (jednotlivé behy pred 59/26/24, po 45/36/75 – rozptyl väčší než rozdiel), max 67–83 / 83–100 ms. Zhoršenie z kontroly (KP-01) je po a24ec0c8 preč, merateľné zlepšenie plynulosti skrolu však nie je; záťaž 3,3–3,8 (súbežný audit), SwiftShader. `skeptik/ab-skrol.log` |
| 20 | „Filmovejší a hravý“ podľa plánu | **čiastočne** | hotové: pás kapitol, Kino ▶, Ďalej, stlačenie tlačidiel, krok 4 okna. Nehotové: B5 titulky, B6 bod „Pozri bližšie“, B7 zvuk (`grep -rl "Pozri bližšie" assets index.html` → 0, `BiquadFilter` v atmosfera.js 0), C4–C9 (plynulosť ťuknutí, prvý švih). Skladačka a body s cenami čakajú na majiteľa (VYBER „Pre majiteľa“ 6–9) |

## Nálezy (nové v tomto kole)

1. **Damian v rezervačnom systéme chýba (stredná, dáta podniku).** Web, okno objednávky v ukážke aj Barber ponúkajú
   Damiana; v živom systéme ho zákazník nenájde. Buď ho správca vrátil/skryl dočasne, alebo odišiel – rozhodne
   majiteľ. Ak odišiel: odstrániť kartu z `index.html`/`en/`/`rezervacia.html`, z `barbershop.md` a z otázok Barbera.
2. **Kino na počítači: koliesko nad ▶ a šípky po kliknutí ho nezastavia (stredná, kód).** `kino.js:55` zastaví len
   udalosti mimo `.kino-play`; `:57` kláves len bez fokusu na ▶. Návrh: pri `wheel` a pri klávesoch skrolu
   (šípky, PageUp/Down, Home/End, medzerník mimo ▶) zastaviť vždy; ▶ nech vyhodnocuje len `click`. Do `kino-test`
   pridať koliesko nad ▶.
3. **Barber pri dvoch službách naraz odpovie neúplne (drobná).** Pozri #13.
4. **Drobnosť:** text „Ďalej“ je v `kino.js:44` natvrdo po slovensky (preklad zabezpečí i18n – kino-test na en/
   prešiel), a v kino.js je predsa poslucháč skrolu (`:52`, len časovač), nie „0 poslucháčov“ ako v zlepsenia.md
   (to platí len pre app.js).

## Čo sa nedá overiť v kontajneri

Safari na iPhone a Macu (WebKit v `/opt/pw-browsers` nie je), plynulosť na skutočnom telefóne (SwiftShader), film
s grafickou kartou, server Barbera a kalendára naostro (chýba knižnica), doména a HTTPS (REZ-01, REZ-08 – hosting).

## Pre majiteľa

1. Potvrdiť, či Damian ešte pracuje – web ho ponúka, rezervačný systém nie.
2. Na iPhone a Macu 3 minúty: ťuknúť ▶, potom skúsiť skrolovať; na Macu kolieskom hneď po kliknutí na ▶.
3. Rozhodnúť skladačku návštevy a body s cenami (VYBER.md „Pre majiteľa“ 6–9) – bez toho hravosť ďalej nerastie.
4. Odkaz na githack s c8febb66 je starý; nový náhľad treba dať až po nasadení (push robí len majiteľ/hlavná relácia).

## Upratanie

Servery 9187 a 9188 zastavené podľa PID (`curl` → 000), A/B a testy dobehli. `git -C hs-skvrny status --short | wc -l` → 0.
Pracovné kópie zostali v `/dev/shm/skeptik-b30/` (RAM, mimo plného disku).
