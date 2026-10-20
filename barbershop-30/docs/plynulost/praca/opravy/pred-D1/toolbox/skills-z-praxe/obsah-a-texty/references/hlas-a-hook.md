# Hlas, hook a stavba textov

## Vzorce viet, ktoré na weboch fungujú

| Vzorec | Príklad (súbor) |
| --- | --- |
| sľub v dvoch slovách | „Vypni hlavu.“ (`index.html`, úvod) |
| dve paralelné vety | „Tvoj strih. Tvoje miesto.“ (`barbershop-30/index.html`) |
| kontrast: čo to nie je, čo to je | „Nie umytie vlasov. Rituál pre hlavu.“ (Ako to prebieha) |
| číslo a zjednodušenie | „17 rituálov. Jedna adresa.“ (Rituály a ceny) |
| výzva k daru | „Daruj chvíľu pokoja.“ (Poukazy) |
| otázka zákazníka | „Komu zveríš hlavu?“ (Ľudia) |
| obraz miesta | „Vzadu ťa čaká káva.“, „Za týmito dverami.“ (Galéria) |
| zmysly po jednom slove | „Teplo. Vôňa. Dotyk. Relax.“ (krátky popis rituálu pre chodidlá) |
| pokyn s istotou | „Povedz, ako to chceš.“, „Poď ďalej.“ |

Pod nadpisom je jeden riadok s overeným faktom alebo s tým, čo návštevník spraví:
„Osem kresiel pod oranžovými lampami. Jedno z nich je tvoje.“ (8 kresiel je v `CONTENT_SOURCES.md`),
„Poukaz na ktorýkoľvek zo 17 rituálov kúpiš online.“, „Teplo, voda a ticho na Mostnej 30. Rezervuj online alebo nám zavolaj.“

## Hook v poradí

1. **Sľub** (nadpis): čo dostaneš, bez prívlastkov.
2. **Obraz miesta**: skutočná vec z prevádzky (dvere, káva vzadu, voda, lampy).
3. **Čo dostaneš**: fakt zo zdroja (počet, čas, čo je v cene).
4. **Ako rezervovať**: jedno tlačidlo, ktoré vedie rovno do cieľa.

Pôvod: rozbor referenčných videí (BARBERSHOP 30, `barbershop-30/docs/CHECKS.md`, časť 10) a video
o Instagrame (skill `instagram-salon`, štítok „Clear opening promise“). Cudzie vety len ako vzorec,
nikdy doslovne.

## Titulná karta (BARBERSHOP 30)

Nadpisok (miesto v prevádzke), veľký nadpis, jeden riadok. Text je priamo na zábere, bez dosky,
pod ním len mäkké stmavenie; kontrast aspoň 4,5 : 1 pre text a 3 : 1 pre veľké nadpisy
(`MASTER_BRIEF.md`, časť 3). Odsek najviac 62 znakov na riadok, nadpisy `text-wrap: balance`,
žiadne osamotené slovo na poslednom riadku H1 a H2 (kontrola pri 390 px).

## Texty pri službe (HEAD SPA 30)

Karta rituálu má tri vrstvy textu a kroky (README, „Texty pri rituáloch“). Tag, popis a kroky majú
stĺpec v `docs/booqme-sluzby.csv`, odseky „O rituále“ nie:

| Vrstva v HTML | Stĺpec podkladu | Úloha |
| --- | --- | --- |
| `p.tag` | Krátky popis | jedna veta nad názvom |
| `p.desc` | Popis do Booqme | čo služba je (web môže mať kratšiu verziu) |
| `<ol>` v paneli | Obsah rituálu (oddelené ` · `) | kroky z ponuky, neprepisujú sa |
| odseky „O rituále“ | nie je v CSV; podklady salónu (README, „Ponuka“: maily s obsahom rituálov) | ako prebieha |

Všeobecné texty, ktoré obsah zhŕňajú, musia nasledovať ponuku. Keď salón v Booqme odobral záverečné
vysušenie, zmenil sa aj krok 05 v časti Ako to prebieha („Ošetrenie vlasov, pri vybraných rituáloch
aj vysušenie. Fúkanú alebo žehlenie si môžeš objednať zvlášť.“) a odpoveď v otázkach (commit 4770ed3).

## Poradie a opakovanie

- Poradie sekcií HEAD SPA 30: úvod, Ako to prebieha, Rituály a ceny, Poukazy, Tím, Galéria, Otázky,
  Kontakt; rovnaké v bočnej lište, mobilnom menu aj pätičke (horná lišta na počítači Tím vynecháva).
- Ten istý zoznam služieb je na stránke raz. Rezervovať vedie z úvodu, z kariet služieb, z kontaktu
  a zo spodnej lišty na telefóne.
- Prvý krok pre váhajúceho: „Prvýkrát u nás? Začni rituálom Head Spa Classic.“ (odkaz na kartu).

## Tlačidlá a odkazy

- Sloveso, ktoré sa stane: „Rezervovať online“, „Kúpiť poukaz“, „Darovať ako poukaz“, „Zavolať“.
- Odkaz do externého systému: `target="_blank" rel="noopener"` a funguje aj bez JavaScriptu (adresa je priamo v HTML).
- Tlačidlo, ktorého text je len „Objednať“, dostane skrytý doplnok pre čítačky
  (`<span class="visually-hidden"> ... názov služby</span>`, `barbershop-30/index.html`).

## Meta a zdieľanie

- Titulok HEAD SPA 30 má 55 znakov: „HEAD SPA 30 Nitra | Head Spa rituály, ceny a rezervácia“.
- Meta popis, `og:description`, `og:image:alt` a `twitter:*` prekladá `assets/i18n.js` ako ostatné texty;
  každý potrebuje kľúč v jazykových súboroch.
- Meta popis obsahuje rozpätie (minúty, ceny); pri zmene ponuky sa mení tiež.

## Tlač

`@media print` v `assets/style.css` skryje navigáciu, film a ostatné sekcie a vytlačí hlavičku so
značkou, karty rituálov v jednom stĺpci (názov, trvanie, cena, krátky popis) bez tlačidiel a pätičku
(README, „Tlač“: dve strany A4). Text karty preto musí dávať zmysel aj bez rozbaleného panela.
