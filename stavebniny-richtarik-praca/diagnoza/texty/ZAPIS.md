# Diagnóza textov a profesionality – zápis

**Rola:** senior diagnostik pre texty (copywriter B2C aj B2B, SEO). V strome som nič nemenil.
**Východisko:** `hs-richtarik-obnova`, vetva `richtarik-dokoncenie`, HEAD **4b2646bf**. Po práci `git status --short` nevypíše nič (strom je čistý).
**Výstupy:** priečinok `richtarik/profi/diagnoza/texty/`:

| Súbor | Obsah |
|---|---|
| `FAKTY.md` | úplný zoznam povolených faktov so zdrojom (pages.json kľúč a riadok, PDF strana, web súbor:riadok), sporné body ⚠, otvorené otázky ❓, zakázané |
| `STYL.md` | štýlová príručka (oslovenie, tón, dĺžky, nadpisy, CTA, typografia, názvy značiek, zakázané frázy, asistent, alt, SEO) a **10 prepisov pred/po** + tabuľka drobného textu |
| `ZAPIS.md` | tento zápis: zistenia s dôkazmi a poradie prác |
| `nastroje/vypis.py` | výpis všetkých textov zo 75 HTML (title, meta, JSON-LD, nadpisy, odseky, tlačidlá, alt, aria-label, placeholder) do `nastroje/texty-webu.txt` (9 855 riadkov) |
| `nastroje/pages_text.py` | pages.json → čistý text po kľúčoch `nastroje/povodny-web.txt` (2 744 riadkov). Riadky PW:N vo FAKTY.md sú z tohto súboru |
| `nastroje/audit.py` | počítadlo oslovenia, typografie, superlatívov a verzálok → `nastroje/audit-vystup.txt` |
| `nastroje/spolocne.txt`, `unikatne.txt` | texty spoločné pre ≥ 20 stránok (hlavička, päta, výzvy) oddelené od textov konkrétnych stránok |
| `nastroje/sluzby-auta-883-885.jpg` | zostrih troch skutočných fotiek áut z pôvodného webu (otvoril som ho) |

Spustenie (venv s lxml existuje): `richtarik/venv/bin/python -I nastroje/vypis.py <web> texty-webu.txt`, `python3 -I nastroje/audit.py texty-webu.txt`.
Prehliadač ani server som nespúšťal (porty 9610 – 9619 ostali nevyužité). Texty sú statické v HTML a texty písané skriptom som čítal priamo v `assets/site.js` (riadky 866 – 936).

## Čo som prečítal

- **Všetkých 75 stránok** cez `vypis.py`: úvod, akcie (prehľad + 15 akcií), katalóg (prehľad + 15 kategórií + 27 podstránok značiek a výrobkov), novinky (prehľad + 8), galéria, služby, o nás, kontakt, leták, 404. Kontrola: `grep -c '^====' texty-webu.txt` → **75**.
- Generátor: `build.py` (texty kategórií 79 – 93, akcie 101 – 131, ledy 181 – 195, opravy 202 – 208, šablóna 592 – 648, kontakt 1005 – 1020, starý úvod 1058 – 1110), `popisy.py` (49 popiskov značiek), `obsah.py` (viditeľné reťazce: „Podrobnosti a výrobky“, „Web výrobcu“, „Celý sortiment“, „neuvedené“, DOKUMENTY).
- `assets/site.js` (lightbox, hľadanie), `assets/index.json` (73 záznamov hľadania), `manifest.webmanifest`.
- Zdroj: `zdroj/pages.json` (83 stránok) a `pdf/662.pdf` (4 strany, cenník 28. 1. 2026, `pdftotext -layout`).
- Na Barbershope označenie asistenta: `git grep … origin/barbershop-oprava` → `barbershop-30/assets/asistent.js:31` (odznak „AI“, „Barber, AI asistent“) a `asistent/ochrana-udajov.html`.

## Zistenia

Priorita: **P1** treba pred ukážkou majiteľovi, **P2** robí rozdiel v profesionalite, **P3** je doladenie.

### T-01 (P1) Oslovenie je zmiešané, odporúčam vykanie

```
$ python3 (počítanie z audit.py nad texty-webu.txt)
stránok s tykaním: 75 / 75
s vykaním: 21
s oboma (zmiešané): 21   napr. sluzby.html ty 1 vy 7, kontakt.html ty 4 vy 2, index.html ty 20 vy 2, o-nas.html ty 1 vy 1
tykacie tvary: Pošli 76, Zavolaj 60, napíš 58, Chceš 57, klikni 15, potrebuješ 6, hľadáš 5, Vyber 5 …
vykacie tvary: môžete 12, Vám 8, vám 7, váš 6, vás 4, máte 3, Vašu 3 …
```
Príklady na jednej stránke: kontakt.html:46 H1 „Príď k nám do Horných Krškán“ a hneď lede „Pozývame vás…“. Úvod index.html:88 „Na tehlu vám spravím“ a index.html:93 „pre teba“. o-nas.html:50 „Vám… VAŠA SPOKOJNOSŤ“ a index.html:115 „tvoja spokojnosť“.
Pôvodný web vyká (PW:4–8 „Vítame Vás“, „PRÍDTE“, „DOSTANETE“). Predchádzajúci zápis to nechal otvorené (`dokoncenie/zapisovatel1.md:72`).
**Odporúčanie:** vykanie malými písmenami, firma hovorí „my“, tlačidlá ostávajú v neurčitku. Zdôvodnenie a prevodová tabuľka sú v STYL.md §1. Najväčší prínos má jeden riadok `build.py:634` (výzva pred pätou na 75 stránkach, 76 tvarov „Pošli“). Spolu s `build.py:760` a `800` (57× „Chceš“, 58× „napíš“, 60× „Zavolaj“) to odstráni zhruba 250 z 301 tykaní.

### T-02 (P1) Na webe sú tvrdenia bez opory

Úplný zoznam s návrhmi je vo FAKTY.md, časť I (I-01 až I-12). Najvážnejšie:
- **I-01:** alt hero index.html:49 „Nákladné auto IVECO … odbočuje z ulice do dvora“ opisuje vygenerovaný film.
- **I-04 a I-12:** „zložíme presne tam, kde ho … potrebuješ“ 4× (index.html:84, 96, 98, 100). Zdroj hovorí „na miesto stavby, ktoré určíte“ (PW:9), a vykládka sa pri niektorých akciách platí (PDF s.1 „vykládka za poplatok“, s.2 „Vykládka tovaru – 40 € s DPH“).
- **I-05:** „Zavolaj, poradíme hneď“ (index.html:118). Slovo „hneď“ zdroj nemá.
- **I-09:** „Značky, ktoré máme na sklade alebo objednáme“ (index.html:77). Na objednávku je doložené len pri Masonite (PW:326) a Chemolaku (PW:333).
- **I-08:** popisy.py:55 „Najväčší výrobca cementu na Slovensku“ je tvrdenie výrobcu (PW:1914) podané ako naše.

### T-03 (P1) og:image a JSON-LD ukazujú auto z filmu

Na všetkých 75 stránkach je `og:image = img/uvod/og.jpg` (`spolocne.txt`: „75 META og:image …/img/uvod/og.jpg“) a JSON-LD `image` (index.html:27).
Súbor `img/uvod/og.jpg` som **otvoril**. Je na ňom vygenerované nákladné auto pred dvorom s vymysleným nápisom „PREDAJ STAVEBNÉHO MATERIÁLU / AUTODOPRAVA“. Komentár `build.py:24` („skutočný záber auta firmy z úvodného filmu“) je nepravdivý.
Nahradenie obrázka patrí úlohe o obrázkoch. Textová časť: opraviť komentár a pri novom og obrázku napísať pravdivý `og:image:alt`.
Pre porovnanie som otvoril aj **skutočné** fotky áut z pôvodného webu (`nastroje/sluzby-auta-883-885.jpg`: červená Avia a modré nákladné auto s hydraulickou rukou na dvore). Sú pravé, takže alt „Vlastné autá s mechanickou rukou“ na sluzby.html:51 sedí. Skutočné auto by šlo použiť namiesto vygenerovaného, ak to návrh úvodu dovolí. Značku modrého auta (LIAZ alebo Iveco) **nerozhodujem** ❓.

### T-04 (P1, SEO) Meta popisy sú skladané automaticky a 26 je skrátených

```
$ python3 (kontrola titulkov a popisov nad 75 HTML)
duplicitné titulky: []      titulky >60 znakov: []      počet h1 na stránku: {1: 75}
popisy končiace …: 26 z 75
```
Vzor `build.py:762` „{názov}. Stavebniny Richtárik Nitra, {všetky značky kategórie}. {prvá veta zdroja}“ vyrába popisy, ktoré vo výsledkoch vyhľadávania pôsobia ako chyba:
- katalog/murovaci-material/pezinske-tehelne/stropny-system.html „…Betonárka Nadlice. Knpv 3/19/400.“
- …/blachotrapez/plech-vzor-skridla.html „…Diament plus. diament plus bok mat.“
- katalog/kominove-systemy/qatro.html „…Najlacnejší certifikovaný komínový systém na Slovensku. 1.“
- katalog/stresne-kritiny/onduline.html „…ASFALTOVÁ VLNITÁ KRYTINA.“
- katalog/sypke-zmesy/baumit.html „Baumit je top značka…“
- akcie/stresne-okna-rooflite.html „Akcia, super ceny. Stavebniny Richtárik Nitra. Super ceny Zľava z akciových cien… v…“

Novinky začínajú vždy rovnako („X. Novinka v ponuke Stavebniny Richtárik Nitra.“). Vzory na nahradenie sú v STYL.md §11.
Titulky, počet H1 a 404 noindex (`404.html:7`) sú v poriadku.

### T-05 (P2) Slabé alebo nejednotné nadpisy

- novinky/topstone…: H1 a titulok sú „Stone“, ale stránka je o kamennom koberci Bianka (PW: titulok zdroja „STONE“).
- katalog/kominove-systemy/qatro.html má H1 „Stadreko“, karta na kategórii má H3 „Qatro“ a akcia hovorí „Komín Stadreko“. Pre zákazníka sú to tri rôzne mená jednej veci.
- „Stropný systém + preklady“, „Fakro schody“ (stránka je aj o výlezoch), „Priečky“.
- Úvod: „Rodinná firma, ktorá stavbám rozumie“ je klišé. „Z akciových cien dostaneš ešte ďalšiu zľavu“ a „Stačí spôsob platby“ zamlčujú, že zľava je viazaná na kartu (PDF s.1).
- Odkaz na podstránku spája dva texty bez medzery a s verzálkami: „Komín Stadreko nerezovýPOSTUP MONTÁŽE KOMÍNA QATRO S NER…“ (`grep -c 'ýPOSTUP' telo.txt` → 2, katalog/kominove-systemy/qatro.html).

### T-06 (P2) Názvy značiek nie sú jednotné

```
$ grep -o -E "<varianty>" telo.txt | sort | uniq -c
Rooflite 21 (zdroj RoofLITE) · Icopal 16 / Ico Pal 1 · Knauf Insulation 2 / Knaufinsulation 1 ·
Pezinské tehelne 12 / Pezinské Tehelne 1 / Pezinska 1 · Magic Floor 8 / Magicfloor 6 · Qatro 7 / QATRO 2 ·
Ekostyrén 12 / ekostyren 3 / EKOSTYREN 1 / Ekostyren 1 · VÚB 1 / VUB 1 · DS Haco 3 / Haco 1 · Transform Recykling 2 / Recykling 1
```
Karty značiek (riadok 51 každej kategórie) vypisujú „Pezinské Tehelne, Stavebné Profily, Km Beta, Ico Pal, Knaufinsulation, Haco, Recykling, Dlažby - City Stone Design“. Príčina je `obsah.py:120` `name.title() if name.isupper()` nad verzálkami zdroja (PW:486 „PEZINSKÉ TEHELNE“, PW:942 „STAVEBNÉ PROFILY“, PW:964 „KM BETA“). Pomôže tabuľka presných názvov (STYL.md §7).
TermoBRIK je v texte stránok jednotný (49×), „TermoBrik“ ostal len v `popisy.py:31` a `build.py:182`.

### T-07 (P2) Superlatívy a „super ceny“

- `audit.py`: **superlatív 36× na 18 stránkach**, **„super ceny“ 100× na 19 stránkach**, výkričník 31× na 8 stránkach.
- Vlastné superlatívy majiteľa sú „Najlacnejší komínový systém na Slovensku“ (index.html:88, akcie) a „Najlacnejšie garáže na slovensku“ (novinky/garaze…:50). Zdroj ich má (PW:45, PW:2423, PDF s.1), ale sú neoveriteľné a rizikové. Rozhodnutie nechávam majiteľovi. Návrh je nahradiť ich cenou z cenníka (STYL.md P9).
- Superlatívy výrobcov (Holcim, Schiedel, Tondach, Magic Floor) sú v texte výrobcov prijateľné, v meta popisoch a našich popiskoch nie (FAKTY.md G).

### T-08 (P2) Typografia a jednotky

```
$ python3 -I nastroje/audit.py nastroje/texty-webu.txt
spojovník ako pomlčka „x - y“: 334 / 75 stránok   (aj päta „Ing. Mário Richtárik - Stavebniny“, odkazy „Akcia - cement“)
m2 / m3 bez horného indexu:      96 / 11 stránok   (baumit 27, pezinske-tehelne 16, icopal 13)
číslo+jednotka bez medzery:      27 / 8            („2-4mm“, „16ks“, „1000mm“)
% bez medzery:                    7 / 5            („95%“, „±5%“)
Eur / Dph:                        4 / 2            (novinky/topstone:50–51 „od 22.80 Eur/m2“, „31,- Eur/m2 s Dph“)
VERZÁLKY (≥5 písmen):           210 / 27           (STONE 25, BOBROVKA 6, SENDWIX 5, BIANKA 5…)
medzera pred čiarkou/bodkou:     30 / 11           (dvere-okna „60, 70 , 80 , 90“)
lomky namiesto zátvoriek:         3                („HOME /do domácnosti/“, „COMMERCIAL /priemyselné/“, „/plech/“)
```
Väčšina je v textoch zdroja a výrobcov. Opraviť ich treba strojovo, opravnou tabuľkou v `build.py:202–208`, nie ručne.
Názov v päte „Ing. Mário Richtárik - Stavebniny“ je obchodný názov. Spojovník nemeňte, kým nebude overený zápis v registri (zdroj má „Richtárik-STAVEBNINY“, PW:1937).

### T-09 (P2) Diakritika a preklepy (zdroj prenesený na web)

`audit.py` „bez diakritiky / preklep“ našiel 14 výskytov na 6 stránkach, ďalšie som našiel pri čítaní:
- novinky/betonove-vyrobky.html: „Počet kusok na palete“ (2×, správne „kusov“), „Betónove poklopy“, „Žľaboka“, „Barierový plot“.
- novinky/delap…:54–56: „niekolko“, „nei na veľkú plochu“, „Lepísa“, „zvchu“, „zvyslé“, „+ 5oC“, „V baleni sú 4m2“, „gumenným“.
- novinky/garaze…:53–54: „vrámci Slovenska ZDARMA !“, „Druhy garáži“ (správne „garáží“), „ľubovolnou“.
- novinky/topstone…:52: „starši aj nové!“, „betonové“, „voči vonkajšom vplyvom“.
- novinky/magic-floor…:52: „vynilové“ (správne „vinylové“), „dobíjať“ (správne „dobýjať“), „zapezbečené“, „Nieje“, „vyplíva“.
- katalog/stresne-kritiny/tondach.html: „vášu strechu“ (riadok 6540 v texty-webu.txt), „porovnateľný betónových“.
- katalog/stavebne-rezivo.html:51 „mame v ponuke“, akcie/pezinska-tehla-termobrik.html:52 „Tehla Pezinska“.
- katalog/sadrokartonovy…:51 „Konštukčné“, „sadroartón“.

### T-10 (P2) Výzvy k akcii

- Rovnaká výzva sa opakuje na 42 kategóriách a podstránkach („Chceš cenu na konkrétne množstvo?“) aj na 16 akciách. Je v poriadku, ak vyká (STYL.md, drobný text).
- Tlačidlo „Cenová ponuka“ v mobilnej lište (build.py:647) vedie na kontakt.html, nie na formulár. Lepšie je „Kontakt a ponuka“ alebo mailto ako na „Poslať dopyt e-mailom“.
- „Ako to funguje“ (index.html:84) nehovorí, kam odkaz vedie.
- Odkazy na letáky: „Akcia - cement“, „Akcia-komín Stadreko“, „Akcia - Lepidlá, omietky Univerbau.“ (bodka na konci), „Stiahnuť PDF“ bez názvu.

### T-11 (P3) Alt texty a prístupnosť textov

- Galéria: 28× „Predajňa a sklad, fotografia N“ a výstavy „…, fotografia N“ (galeria/index.html:50). Fotky dvora (6) majú dobré alty (galeria/index.html:49).
- Pás log na úvode: všetky logá majú `alt=""` a `aria-label` na `div` bez roly sa nepoužije (index.html:77). Názvy značiek tak nevidí čítačka ani vyhľadávač.
- Vyhľadávanie má dva rôzne placeholdery („Čo hľadáš? Cement…“ na index.html:65, „Hľadaj: cement…“ na build.py:727 a 994).

### T-12 (overené, v poriadku)

- „15 kategórií“: `grep -c '^##### katalog-roduktov__[a-z-]* ' povodny-web.txt` → **15**.
- „Viac ako 40 značiek“: počet unikátnych H3 kariet značiek v `katalog/*.html` → **46** (príkaz `grep -o '<article class="znacka rv">.*' | grep -o '<h3>…'` vypísal „UNIKATNE: 46“).
- Kontakty, IČO/DIČ, hodiny, 1997, 5 % a 3,3 %, Quatro, VÚB (kontakt), výhradný predajca Transform Recykling, palivové drevo agát a Masonite v 7 dekoroch sedia so zdrojom (FAKTY.md A – F).
- Superlatív Holcim má zdroj (PW:1914), ale je to tvrdenie výrobcu (T-02, I-08).

## Odporúčané poradie prác (pre vykonávateľa)

1. **T-03 a I-01:** nový úvod bez auta. Texty filmu podľa STYL.md P1 (titulky nad skutočnými zábermi; konečný stav viditeľný bez JS a pri obmedzení pohybu).
2. **T-01:** vykanie. Najprv spoločné šablóny `build.py:634, 727, 730, 760, 793, 800, 993–996, 1012, 1019`, `assets/site.js:931`, potom ručne index.html (build.py ho neprepisuje).
3. **T-02:** I-04, I-05, I-09, I-12 podľa STYL.md P5, P7 a tabuľky drobného textu.
4. **T-04:** generátor meta popisov podľa STYL.md §11. Kontrola: 0 popisov končiacich „…“, všetky 120 – 155 znakov.
5. **T-06:** tabuľka presných názvov značiek v `obsah.py` (namiesto `title()`), RoofLITE a ďalšie v build.py a popisy.py.
6. **T-08 a T-09:** rozšíriť opravnú tabuľku `build.py:202–208` (m², pomlčky, preklepy) a opäť spustiť `audit.py`. Cieľ: m2 0, Eur/Dph 0, preklepy 0.
7. **T-05, T-07, T-10, T-11:** nadpisy, štítky „Akciová cena“, alty galérie a log.
8. **Asistent:** označenie a tón podľa STYL.md §9, odpovede len z FAKTY.md.

**Nemeniť bez majiteľa:** staré akcie bez dátumu, LIAZ alebo Iveco, znenie 5 % / 3,3 %, Nero Ebono, superlatív pri komíne a garážach.

## Overenie, že som nič nezmenil

```
$ git -C hs-richtarik-obnova status --short     → (prázdne)
$ git -C hs-richtarik-obnova rev-parse --short HEAD → 4b2646bf
```
