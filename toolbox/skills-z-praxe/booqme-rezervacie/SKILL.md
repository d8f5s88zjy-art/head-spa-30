---
name: booqme-rezervacie
description: Web podniku napojený na rezervačný systém Booqme (online booking, reservation, gift voucher, e-shop s poukazmi). Tlačidlá Rezervovať a Kúpiť poukaz sú priame odkazy do kalendára a obchodu Booqme, na webe nie sú formuláre; odkazy v jazyku návštevníka, ReserveAction v JSON-LD, poukaz na konkrétnu službu, platba kartou cez Stripe Connect. Použi pri zmene cien, dĺžok alebo služieb v Booqme (zosúladenie webu, kontrola booqme-kontrola.mjs), pri zmene adresy prevádzky v Booqme a pri napojení nového webu na Booqme.
---

# Rezervácie a poukazy cez Booqme

Postup z webu HEAD SPA 30: všetky rezervácie a darčekové poukazy idú do Booqme, web nič neukladá
a nemá žiadny formulár. **Booqme je zdroj pravdy** pre názvy, ceny, dĺžky a obsah služieb (podnik ich
mení tam); web sa po zmene zosúladí a kontrola musí hlásiť, že kalendár sedí (`CLAUDE.md`, časť Booqme).

## Kedy použiť

- Podnik zmenil v Booqme cenu, dĺžku, názov alebo obsah služby, pridal alebo zrušil službu.
- Podnik zmenil adresu prevádzky v Booqme (tlačidlá zrazu vedú na chybu 404).
- Napájaš nový web na Booqme alebo meníš tlačidlá Rezervovať, Kúpiť poukaz, Darovať ako poukaz.
- Treba overiť, či web a Booqme sedia (pred nasadením, po upozornení majiteľa, pravidelne).

Na texty a preklady okolo cenníka je skill `obsah-a-texty`.

## Ako je to postavené

| Časť | Adresa alebo prvok |
| --- | --- |
| online kalendár | `https://booqme.app/sk/rezervacia/<adresa-prevádzky>` |
| obchod s poukazmi | `https://booqme.app/sk/eshop/<adresa-prevádzky>` |
| krátka adresa profilu | `https://booqme.app/<adresa-prevádzky>` (presmeruje 301 na kalendár) |
| tlačidlá Rezervovať | `<a href="…/rezervacia/…" target="_blank" rel="noopener" data-booking-link>`, pri službe aj `data-book="<id služby>"` (HEAD SPA 30: 25 odkazov) |
| Darovať ako poukaz pri službe | `<a class="card-gift" href="…/eshop/…" data-gift="<id služby>">` |
| pás ukážok poukážok | `<a class="vch" href="…/eshop/…" data-gift="<id služby>">` |
| cenník (služby s poukazom) | `<article data-min="60" data-price="67" ... id="<id>">` (`data-min` a `data-price` hneď za `<article`, celé čísla) s `<h3>` = názov v Booqme |
| služby bez poukazu | `<li data-booqme="<názov v Booqme>" data-min="30" data-price="28">` |
| dáta pre vyhľadávače | `ReserveAction` s `EntryPoint` na kalendár (JSON-LD v `<head>`) |
| podklady | `docs/booqme-sluzby.csv`, `docs/booqme-poukazy.csv`, úlohy v Booqme `docs/booqme-opravy.md` |
| kontrola | `node tools/booqme-kontrola.mjs` |

V HEAD SPA 30 je adresa prevádzky `salon-30-head-spa`. Rituál si zákazník pri poukaze vyberá priamo
v obchode Booqme; poukaz je vždy na konkrétnu službu, nikdy na sumu (17 typov, platnosť 365 dní).

## 1. Napojenie webu na Booqme

1. **Over adresy.** Kalendár aj obchod musia vrátiť 200:
   `curl -s -o /dev/null -w "%{http_code}\n" https://booqme.app/sk/rezervacia/<adresa>`.
2. **Tlačidlo je obyčajný odkaz** s plnou adresou v HTML, bez medzikroku a bez závislosti od skriptu
   (funguje aj bez JavaScriptu). Nová karta: `target="_blank" rel="noopener"`.
3. **Pri každej službe s poukazom dve cesty**: Rezervovať (kalendár) a Darovať ako poukaz (obchod). Telefón ostáva
   na každom mieste ako druhá cesta pre toho, kto váha.
4. **Jazyk návštevníka.** HTML má slovenské adresy; skript ich pri zmene jazyka prepíše
   (`assets/app.js`):
   ```js
   const BQ_BOOK = { sk: 'rezervacia', cs: 'rezervace', hu: 'foglalas', en: 'reservation', de: 'reservation', pl: 'reservation', uk: 'reservation' };
   const BQ_RE = /^https:\/\/booqme\.app\/[a-z]{2}\/(rezervacia|rezervace|foglalas|reservation|eshop)\//;
   ...
   const to = h.replace(BQ_RE, `https://booqme.app/${L}/${m[1] === 'eshop' ? 'eshop' : BQ_BOOK[L]}/`);
   ```
   Spúšťa sa pri načítaní a na udalosť `langchange` z `assets/i18n.js`. Všetkých sedem jazykových
   ciest vracalo 2026-10-11 stav 200.
5. **Cenník strojovo čitateľný**: `data-min`, `data-price` a názov v `<h3>` presne ako služba v Booqme.
   Služba, ktorá je v kalendári, ale poukaz sa na ňu nepredáva (fúkaná, žehlenie), ide do
   `li[data-booqme]` s presným názvom z Booqme; zobrazený názov môže byť pekší
   (`data-booqme="Fúkana - krátke vlasy"`, na webe „Fúkaná na krátke vlasy“).
6. **JSON-LD**: `potentialAction` typu `ReserveAction` s `urlTemplate` kalendára; ponuky s cenou
   a dĺžkou (`PT60M`) ako karty.
7. **Podklady** ako CSV oddelené bodkočiarkou: služby (`Č.;Kategória;Názov služby;Trvanie (min);Cena (€);
   Počet osôb;Krátky popis;Popis do Booqme;Obsah rituálu`) a poukazy (`Typ poukážky v Booqme;Cena (€);
   Druh;Platnosť (dní);Popis`, typ sa volá `Poukaz: <názov služby>`).
8. **Meranie bez cookies** (ak ho majiteľ zapne): klik na kalendár je udalosť `reservation_click`,
   na obchod `voucher_click` (`assets/app.js`, `track`).
9. **Platba kartou** v obchode Booqme funguje až po prepojení Stripe Connect (robí majiteľ v Booqme,
   Nastavenia, Stripe Connect). Overenie: nákup najlacnejšieho poukazu, kontrola e-mailu s poukazom,
   zrušenie a vrátenie v administrácii (`docs/booqme-opravy.md`, bod 8). Alternatíva bez Booqme:
   admin webu vie pri službe uložiť odkaz na platbu (Stripe Payment Links, SumUp, brána banky,
   len `https://`); `assets/app.js` potom zmení „Darovať ako poukaz“ na „Kúpiť poukaz kartou“.
10. **Právna stránka** uvedie Booqme ako systém s vlastnými obchodnými podmienkami a ako príjemcu
    údajov (`pravne.html`).

## 2. Zosúladenie webu po zmene v Booqme

0. `git fetch origin main && git merge origin/main` (admin ukladá priamo do `main`).
1. **Kontrola**: `NODE_USE_ENV_PROXY=1 node tools/booqme-kontrola.mjs` (proxy premenná len za proxy).
   Vypíše, čo nesedí: `<služba>: kalendár 67 €, web 70 €`, `kalendár 60 min, web 75 min`,
   `je v kalendári, ale nie na webe`, `v online kalendári chýba`, `poukaz 70 €, web 67 €`.
2. **Prečítaj zmenu na verejnej stránke kalendára** (názov, cena, dĺžka, popis, obsah služby).
   Čo sa z verejnej stránky nedá zistiť, si vypýtaj od majiteľa; nehádaj.
3. **Podklad**: uprav `docs/booqme-sluzby.csv` (a cenu v `docs/booqme-poukazy.csv`).
4. **Web** (ručne alebo cez admin, ktorý naraz prepíše kartu, ponuku v JSON-LD, pás poukážok a rozpätia;
   podklad CSV, obrázky poukážok a riadky `li[data-booqme]` nie, tie sa menia ručne):
   karta (`data-min`, `data-price`, `.meta`, `<h3>`, `p.tag`, `p.desc`, kroky v `<ol>`), ponuka
   v JSON-LD, rozpätia slovom aj číslom (meta popis, `priceRange`, odpoveď „Ako dlho rituál trvá a aká
   je jeho cena?“), všeobecné texty, ktoré obsah zhŕňajú, a preklady v šiestich jazykoch.
   Zoznam miest a príkazy `grep`: `references/zosuladenie.md`.
5. **Nová služba bez poukazu** do `li[data-booqme]`, nový rituál ako karta, poukaz a ponuka.
6. **Obrázky poukážok** s cenou: `python3 docs/poukazky/sablona/ceny.py`,
   `node docs/poukazky/sablona/vyrob.mjs`, `python3 docs/poukazky/sablona/export.py`, potom ich majiteľ
   nahrá k poukazom v obchode Booqme.
7. **Kontroly**: `booqme-kontrola.mjs` musí hlásiť, že kalendár sedí; `python3 -I toolbox/skills-z-praxe/booqme-rezervacie/scripts/podklad-zhoda.py
   index.html docs/booqme-sluzby.csv docs/booqme-poukazy.csv` (z koreňa projektu, podklad proti webu, bez siete);
   z `obsah-a-texty` `ld-zhoda.py` a `i18n-kontrola.mjs`.
8. **Ceny poukazov v obchode** mení majiteľ v Booqme (Poukážky, Typy poukážok), web sa kvôli nim nemení.
   Čo má v Booqme opraviť, zapíš do `docs/booqme-opravy.md` s presným textom na vloženie.
9. Po zmene JS alebo CSS `node tools/build.mjs`, commit po slovensky, nasadenie podľa `CLAUDE.md`,
   kontrola naživo.

Skutočný príklad: commit 4770ed3 (2026-10-10) zosúladil ceny 13 rituálov s kalendárom, odobral kroky,
ktoré salón v Booqme zrušil (najmä vysušenie vlasov), opravil texty, ktoré po zmene neplatili, aj
v šiestich jazykoch, zmenil rozpätie na 45 až 135 €, pridal časť Fúkaná a žehlenie so štyrmi službami
z kalendára a rozšíril kontrolu o `li[data-booqme]`. Zmenené súbory: `index.html`, `assets/i18n/*.json`,
`assets/style.css` (+ `.min`), oba CSV, `tools/booqme-kontrola.mjs`, `CLAUDE.md`.

## 3. Zmena adresy prevádzky v Booqme

Pôvodná adresa (`.../rezervacia/salon-30`) v septembri prestala existovať a vracala 404, takže všetky
tlačidlá aj nákup poukazu viedli do prázdna (README, „Kam vedú tlačidlá“). Neskôr sa adresa zmenila
z `barbershop-30` na `salon-30-head-spa` (commit 0efe439). Postup:

1. `grep -rln "booqme.app" --include=*.html --include=*.js --include=*.mjs --include=*.md .`
2. Nahraď adresu vo všetkých odkazoch, v `ReserveAction`, v `404.html`, v admine, v kontrole
   a v dokumentoch (`CLAUDE.md`, README, `docs/`).
3. Over každú novú adresu (`curl`, kód 200) a jazykové varianty.
4. Obrázky s QR kódom, ktoré nesú starú adresu, treba vyrobiť znova (`docs/booqme-opravy.md`, bod 7).

## 4. Kontrola `booqme-kontrola.mjs`

- Číta **len verejné stránky** kalendára a obchodu, nič nemení, prihlásenie nepotrebuje.
- Z webu berie karty `<article>` s `data-price` (názov z `<h3>`) a riadky `li[data-booqme]`.
- Z kalendára: `data-service_name`, `data-price-raw` a prvé `<číslo> min` za nimi.
  Z obchodu: obrázok s `alt="Poukaz: <názov>"` a cenu za `Cena:`.
- Páruje **podľa presného názvu**, ceny porovnáva zaokrúhlené na celé eurá.
- Pri nezhode skončí s kódom 1. Ak hlási 0 služieb v kalendári, Booqme pravdepodobne zmenilo stránku
  a regulárne výrazy treba upraviť.
- Prenosná verzia pre iný projekt: `scripts/booqme-kontrola.mjs <index.html> <adresa-prevádzky>`;
  kalendár a obchod hlási zvlášť („Kalendár sedí“, „Obchod s poukazmi nesedí“).
- Ak by niekedy skript potreboval prihlásenie do administrácie Booqme, údaje berie len z premenných
  prostredia, nikdy ich nevypisuje, neukladá do súboru ani necommituje (`CLAUDE.md`).

Podrobnosti o stránkach Booqme a o tom, čo sa robí v jeho administrácii: `references/booqme-stranky.md`.

## BARBERSHOP 30: iný systém

BARBERSHOP 30 (`barbershop-30/`) **nemá rezervácie v Booqme**. Podľa `barbershop-30/docs/CONTENT_SOURCES.md`:

- strih a brada idú do vlastného rezervačného systému podniku `https://www.barbershop30.sk/rezervacia`
  (komponent s endpointom `/rezervacia/ajax`, nie Bookio); nový web naň len odkazuje, neembeduje ho,
  a službu ani barbera cez adresu nepredvolí (nie je to zdokumentované);
- Booqme `https://booqme.app/sk/rezervacia/barbershop30` je samostatná stránka len pre farbenie, melír
  a trvalú; na webe je iba ako odkaz („Rezervovať na Booqme“, poznámka pri tíme), jej ceny sa nezobrazujú,
  aby neboli dva cenníky na jednom mieste;
- `ReserveAction` v JSON-LD ukazuje na vlastný systém podniku.

Poučenie: pred napojením zisti, aký systém podnik naozaj používa a pre ktoré služby. Kontrola
`booqme-kontrola.mjs` sa na BARBERSHOP 30 nepoužíva.

## Pasce (lekcie)

- **Názov je kľúč.** Kontrola, admin aj `ceny.py` párujú podľa názvu alebo `id`. Pri premenovaní
  služby v Booqme zmeň `<h3>` a ponuku, `id` karty nechaj (odkazy zvonka, poukážky, ponuka v JSON-LD).
- **Poradie atribútov** `li data-booqme`, `data-min`, `data-price` drž presne tak, kontrola ho číta
  regulárnym výrazom; `ceny.py` čaká `<article data-min=".." data-price="..">` v tomto poradí a celé čísla.
- **Desatinné ceny**: v dátach bodka (`data-price="35.50"`), v texte čiarka (`35,50 €`). Dnes ich majú
  len riadky `li[data-booqme]`; kontrola ich zaokrúhľuje, rozdiel pod 0,50 € nezachytí. Karty `<article>`
  čítajú `tools/booqme-kontrola.mjs`, admin aj `ceny.py` len ako celé čísla.
- **Kalendár sedí, obchod nie.** Po zmene cien v kalendári ostávajú v obchode staré ceny poukazov, kým ich
  majiteľ neprepíše; web sa riadi kalendárom (stav 2026-10-11: `references/stav-head-spa-30.md`).
- **Skladanie popisov poukazov** z polí, ktoré končia bodkou, dáva „Žiadny zhon.. Platí 365 dní“
  (`docs/booqme-opravy.md`, bod 6). Pred vložením textu skontroluj dvojité bodky.
- **Zmena obsahu služby mení aj všeobecné texty** (krok Záver, odpoveď o umývaní vlasov), nielen kartu.
- **README zaostáva**: v tomto repozitári ešte opisuje formulár rezervácie, `data-booking` na `<html>`
  a rezerváciu na webe Salónu 30; nič z toho v kóde nie je. Riaď sa `index.html` a `CLAUDE.md`.
- **Zmeny profilu Booqme** (názov prevádzky, logo, kategória poukážok, popisy) sa robia v administrácii
  Booqme, web sa nemení; zoznam s textami na vloženie je `docs/booqme-opravy.md`.

## V tomto repozitári

| Čo | Kde |
| --- | --- |
| pravidlá (Booqme je zdroj pravdy, žiadne formuláre, fúkaná v `li[data-booqme]`) | `CLAUDE.md` |
| tlačidlá a cenník | `index.html` (`data-booking-link`, `.card-gift`, `.vch`, `article[data-price]`, `#fukana li[data-booqme]`) |
| odkazy v jazyku návštevníka, platba kartou z adminu, meranie | `assets/app.js` (`booqmeLang`, `PLATBY`, `track`) |
| kontrola webu proti Booqme | `tools/booqme-kontrola.mjs` |
| podklady | `docs/booqme-sluzby.csv`, `docs/booqme-poukazy.csv` |
| úlohy pre majiteľa v Booqme | `docs/booqme-opravy.md`, logo `docs/booqme/logo-head-spa-30.png` |
| obrázky poukážok | `docs/poukazky/sablona/` (`ritualy.json`, `ceny.py`, `vyrob.mjs`, `export.py`, `booqme/`) |
| admin: ceny, dĺžky, platby | `admin/index.html` (záložky Rituály, Poukazy a platby) |
| BARBERSHOP 30 rezervácie | `barbershop-30/docs/CONTENT_SOURCES.md`, `barbershop-30/index.html` |

Skripty skillu (z koreňa projektu):

```
NODE_USE_ENV_PROXY=1 node toolbox/skills-z-praxe/booqme-rezervacie/scripts/booqme-kontrola.mjs index.html salon-30-head-spa
python3 -I toolbox/skills-z-praxe/booqme-rezervacie/scripts/podklad-zhoda.py index.html docs/booqme-sluzby.csv docs/booqme-poukazy.csv
```

## Kontrolný zoznam

- [ ] Kalendár aj obchod vracajú 200, jazykové varianty tiež.
- [ ] Každé Rezervovať je priamy odkaz s plnou adresou (`data-booking-link`), žiadny formulár na webe.
- [ ] Pri každej službe s poukazom je Darovať ako poukaz do obchodu, poukaz je na službu, nie na sumu.
- [ ] Názvy v `<h3>` a `data-booqme` presne ako v Booqme; `id` kariet nezmenené.
- [ ] `booqme-kontrola.mjs`: kalendár sedí; nezhody obchodu zapísané majiteľovi do `docs/booqme-opravy.md`.
- [ ] `podklad-zhoda.py`: CSV sedí s webom.
- [ ] JSON-LD (`ReserveAction`, ponuky, `priceRange`) a rozpätia v texte a prekladoch zodpovedajú cenníku.
- [ ] Obrázky poukážok s cenou vyrobené znova, ak sa cena zmenila.
- [ ] Žiadne prihlasovacie údaje v repozitári ani vo výpise.
- [ ] Nasadené a overené naživo (tlačidlá vedú do Booqme v správnom jazyku).
