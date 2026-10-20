# HEAD SPA 30: čo smieš a nesmieš tvrdiť

Zdroj pravdy: `CLAUDE.md` (pravidlá obsahu od majiteľa), `docs/booqme-sluzby.csv` (rituály),
`docs/booqme-poukazy.csv` (poukazy) a texty webu `index.html`. Ceny, dĺžky a obsah rituálov sa
riadia online kalendárom Booqme; salón ich mení tam. Tento súbor ich preto neobsahuje, len hovorí,
kde sú. Keď sa líši od zdroja, platí zdroj.

Instagram: https://www.instagram.com/headspa.salon30/
Rezervácia: https://booqme.app/sk/rezervacia/salon-30-head-spa · Poukazy: https://booqme.app/sk/eshop/salon-30-head-spa

## Smieš (overené, so zdrojom)

| Tvrdenie | Kde je zdroj | Pozor |
| --- | --- | --- |
| HEAD SPA 30, Head Spa rituály v Nitre | `CLAUDE.md` | vždy tento názov |
| samostatná časť s vlastným tímom v priestoroch Salónu 30 | `CLAUDE.md`, `index.html` (otázka Ako súvisí HEAD SPA 30 so Salónom 30?) | Salón 30 len ako miesto, odkaz www.salon30.sk |
| Mostná 30, Nitra, za zelenými dverami so zlatými kruhmi | `CLAUDE.md`, `index.html` (Kde vás nájdem?, galéria) | presná adresa v štruktúrovaných dátach `index.html` |
| 17 rituálov: 12 Head Spa (vrátane pánskych Gentlemen a detského), 2 pre dvoch, 3 pre chodidlá | `CLAUDE.md`, `docs/booqme-sluzby.csv` (stĺpec Kategória) | názvy presne podľa CSV |
| trvanie, cena, krátky popis a obsah rituálu | `docs/booqme-sluzby.csv` | čítaj v ten deň; po zmene v Booqme musí `node tools/booqme-kontrola.mjs` hlásiť zhodu |
| pri rituáloch pre dvoch je cena za oboch, dve lôžka vedľa seba | `index.html` (Môžeme prísť vo dvojici?) | |
| poukaz vždy na konkrétny rituál, platí 365 dní, kúpa online | `CLAUDE.md`, `docs/booqme-poukazy.csv`, `index.html` (Môžem Head Spa darovať?) | nikdy na sumu |
| termín si vyberieš online kedykoľvek | `index.html` (Ako si rezervujem termín?) | |
| telefón 0911 153 136 | `CLAUDE.md` | web ho uvádza ako linku 24/7 na pochvalu aj výhradu |
| otváracie hodiny | `index.html` (štruktúrované dáta, openingHoursSpecification) | over pred uverejnením |
| fúkaná a žehlenie sú v online kalendári | `CLAUDE.md`, `docs/booqme-sluzby.csv` (Kadernícke služby) | nie sú to rituály, poukaz na ne nie je |
| tehotenstvo, citlivá pokožka, farbené alebo predĺžené vlasy | `index.html` (otázky a odpovede) | odpovedaj ako web: povedz nám vopred, zavolaj |

## Nesmieš

- „Barber shop 30“ ani „salón 30“ ako názov HEAD SPA 30; HEAD SPA 30 nie je súčasť ani značka Salónu 30.
- Nič o majiteľovi.
- Služby Salónu 30 (kaderníctvo, kozmetika).
- Strieborný alebo zlatý Head Spa rituál (neexistujú; Zlatý rituál 24K je rituál pre chodidlá).
- Rituál, ktorý nie je v `docs/booqme-sluzby.csv`; poukaz na sumu; poukaz na fúkanú alebo žehlenie.
- Hodnotenie alebo počet recenzií (profil v Booqme recenzie zatiaľ nemal, `docs/booqme-opravy.md`,
  stav 23. 9. 2026).
- Platba kartou online, kým ju majiteľ nepotvrdí (funguje až po prepojení Stripe Connect, `CLAUDE.md`).
- Prepojenie s Barbershop 30.
- Liečebné sľuby a účinky, ktoré web neuvádza.
- Čokoľvek o AI.

## Overené vety z webu (dajú sa použiť alebo obmeniť)

Z `index.html`:

- „Vypni hlavu.“ / „Hlboký relax a regenerácia vlasov v jednom rituáli.“ / „Začína teplou vodou a končí tichom.“
- „Nie umytie vlasov. Rituál pre hlavu.“
- „Vstúpiš s hlavou plnou chaosu. Odídeš s čistou hlavou.“
- „Daruj chvíľu pokoja.“
- „Za týmito dverami.“ / „Zelené dvere so zlatými kruhmi, za nimi teplo, voda a ticho.“
- „Postaráme sa o tvoju hlavu.“ / „Pochvalu aj výhradu nám povedz kedykoľvek, vo dne aj v noci.“

Krátke popisy rituálov (stĺpec Krátky popis v `docs/booqme-sluzby.csv`) sú tiež overené texty.

## Vizuál pre mriežku a reels

`CLAUDE.md`: elegantný a zdržanlivý štýl, tóny orecha so zlatou (zlatá len ako detail), písma Lora
a Manrope, skutočné fotky bez tónovania, bez ozdôb navyše. Zoznam záberov a pravidlá fotenia
(na výšku 9 : 16, bez textu v obraze, tvár klienta mimo alebo v tieni, dieťa so súhlasom rodičov):
`docs/fotenie.md`.
