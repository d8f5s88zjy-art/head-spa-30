# Kontrola textov a faktov – kolo 1 (27. 10. 2026)

Kontrolované: strom `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny`
(vetva `barbershop-skvrny`), diff `bdabff7..HEAD` (commity db896f33, c88d29a1), odovzdávka
`/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/texty/odovzdavka.md`.
Nič som nemenil. Cesty nižšie sú relatívne k `hs-skvrny/barbershop-30/`, ak nie je uvedené inak.

## Verdikt

**Prechádza s výhradami.** Žiadny vážny nález. Každé nové tvrdenie má oporu v texte webu alebo na živom webe
prevádzky, garancia na webe nie je, otázka o recepcii je jasná, preklady v siedmich jazykoch sú verné, odkazy vedú na
adresy s odpoveďou 200, žiadna zmienka o AI v nových textoch, commity bez podpisových riadkov, i18n-test a en-test prechádzajú.
Tri stredné nálezy (hodnotenie číslom v pilieri pri otvorenej otázke 18, gzip nad limitom plánu, jeden riadok barbera, ktorý
znie nelogicky) a niekoľko drobných (poľské „cięcie“, anglické „Our places“, poznámka o garancii v komentári HTML).

## 1. Fakty – každé nové tvrdenie a jeho opora

| nový text | kde | opora (súbor:riadok) | stav |
|---|---|---|---|
| „Tím barberov a barberiek pod jednou značkou. …“ | `index.html:304` | `index.html:293` „Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek.“; „aj o týždeň“ = pôvodný riadok Kevina; „konzultácia“ = `index.html:504` | OK |
| „Striháme na Mostnej 30 od roku 2019.“ | `index.html:316` | `index.html:748` „Na Mostnej 30 striháme od roku 2019.“, `index.html:64` `foundingDate 2019`, `docs/CONTENT_SOURCES.md:20` | OK |
| „Hodnotenie 5,0 na Google …“ | `index.html:316` | `index.html:193` „5,0 na Google · 945 recenzií“, `docs/CONTENT_SOURCES.md:155–158` (overené na profile 13. 10.) | OK, ale pozri nález S1 |
| „Konzultácia pred prvým ťahom strojčeka, britva pri brade, styling a kolínska na záver“ | `index.html:317` | `index.html:247` „Konzultácia, strojček, nožnice, fade. Pri brade horúci uterák a britva.“, `index.html:504–508`, `:770` „Na záver styling a kolínska.“ | OK |
| „Pri dverách recepčná, v čakárni káva a minerálka zdarma.“ | `index.html:318` | `index.html:224` „Pri dverách ťa privíta recepčná.“, `index.html:270` „Káva aj minerálka sú zdarma.“ | OK |
| „Vždy recepcii: 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.“ | `index.html:837` | `index.html:793` (karta Rezervácia), `index.html:836` (otázka „Ako sa objednám?“) | OK |
| „Recepčná sa stará o tvoj termín a pohodlie, barber o tvoj výsledok. Keď má v kresle zákazníka, venuje sa jemu, nie telefónu.“ | `index.html:837` | slová majiteľa z 27. 10. (zadanie), bez čísel a lehôt | OK |
| „zmenu či zrušenie jej daj vedieť čo najskôr“ | `index.html:837` | `index.html:843` „Daj nám vedieť čo najskôr“; storno (OTAZKY otázka 3, riadok 11) sa neuvádza | OK |
| „Vzadu v čakárni máš kávu alebo minerálku zdarma. … strojček, nožnice a fade, pri brade horúci uterák a britva. Na záver styling a kolínska.“ | `index.html:844` | `index.html:269–270` „Vzadu ťa čaká káva.“, `:247`, `:770` | OK |
| HEAD SPA 30 „Head Spa rituály pre relax a regeneráciu vlasov.“ | `index.html:894` | živý web: `curl https://www.headspa30.sk/` → `<meta name="description" content="Head Spa rituály pre relax a regeneráciu vlasov v centre Nitry …">` | OK |
| Salón 30 „Kaderníctvo a wellness pre vlasy: strihy, farbenie a koloristika, trichologické vyšetrenie.“ | `index.html:895` | živý web `https://www.salon30.sk/` (curl 27. 10.): „Wellness pre vaše vlasy“ 1×, „Farbenie“ 5×, „koloristika“ 3×, „Trichologické vyšetrenie vlasov“ 2×, „Kaderni…“ 8×, „Mostná 30“ 1× | OK |
| Barbershop 30 „Pánske strihy, brada a holenie britvou. Si tu.“ | `index.html:896` | `index.html:862` pätička, cenník (holenie britvou) | OK |
| Riadky desiatich barberov | `index.html:332–467`, `rezervacia.html:268–403`, `../asistent/znalosti/barbershop-otazky.json` (`tim-*`) | žiadne fakty o osobe (roky, ocenenia, špecializácie) – len dojem; `docs/CONTENT_SOURCES.md:189` | OK |

Garancia: `grep -i garanc` v `index.html`, `rezervacia.html`, `en/index.html` a 7 slovníkoch → jediný výskyt je komentár HTML
`index.html:314` / `en/index.html:315` („garancia čaká na potvrdenie majiteľa“), nič viditeľné. Tri znenia G1–G3 sú
v `dennik/barbershop-30/docs/plynulost/OTAZKY-PRE-MAJITELA.md:122–126` označené ako otázka pre majiteľa. OK.

Tón: sebavedomý, tykanie, bez vulgarít, bez porovnávania konkurencie (grep „konkurenc“, „iní“, „lepší než“ v nových
riadkoch: nič), bez zdravotných sľubov („otvoríš ich ako nový“, „regenerácia vlasov“ z webu HEAD SPA 30 nie sú zdravotné
tvrdenia). Jediný riadok, ktorý škrípe, je Adrianov (nález S3).

Otázka o recepcii (`index.html:837`, snímka `scratchpad/barber/stavba/snimky/po-otazky-telefon.jpg` otvorená): druhá
v poradí hneď za „Ako sa objednám?“, odpoveď dáva číslo, hodiny, rozdelenie recepčná/barber a dôvod. Jasná.

Zmienka o AI: `git diff bdabff7..HEAD` pridané riadky v `index.html`, `rezervacia.html`, `en/index.html`, odpovede asistenta
– grep `\bAI\b|umelá inteligen|ChatGPT|Claude` → 0 nálezov. (Štítok „AI“ na ikone asistenta je z bdabff7, mimo tejto zmeny.)

## 2. Preklady (prečítané všetkých 27 nových kľúčov × 7 jazykov)

Skript `scratchpad/barber/texty/i18n-diff.py`: v každom z cs, de, en, hu, pl, sr, uk je 317 → 333 kľúčov
(27 pridaných, 11 odobraných = staré riadky barberov a starý úvod tímu), 0 zmenených starých hodnôt, sady kľúčov vo všetkých
siedmich rovnaké. Čísla (0951 267 203, 9:00–19:00, 2019, 5,0) sú vo všetkých prekladoch zhodné.

- cs: verný, prirodzený („Mám volat barberovi, nebo na recepci?“, „Hodnocení 5,0 na Googlu“). OK.
- de: verný; „Rezeptionistin“, „Eau de Cologne“, „Unsere Standorte“. OK.
- en: verný; „Our places“ je slabšie než „Our locations“ (nález D2); „Nothing done blind.“ znie strojovo (D2).
  „A team of barbers under one name“ vynecháva „barberiek“ – v angličtine je „barbers“ bez rodu, v poriadku.
- hu: verný („A barbert hívjam vagy a recepciót?“, „Üzleteink“). „A Mostná 30 alatt 2019 óta vágunk.“ je elipsa, zrozumiteľná. OK.
- pl: verný; štyri nové riadky používajú „cięcie“ pre strih, kým zvyšok slovníka 36× „strzyżenie/strzyżemy“ (nález D1).
- sr: verný („U ulici Mostná 30“ rovnako ako existujúci kľúč karty Dôvera, „Naši lokali“). OK.
- uk: verný („адміністраторка“ za recepčnú je bežné pre salóny; „Mostná 30“ latinkou ako existujúci kľúč). OK.

`en/index.html` pregenerovaná: diff ukazuje presne anglické hodnoty z `en.json` v tíme, pilieroch, otázkach a pätičke
(`en/index.html:893` „Our places“). `node source/tools/i18n-test.mjs` → „Všetky kontroly prešli“;
`node source/tools/en-test.mjs` → „VÝSLEDOK: všetko v poriadku“ (časté otázky 10). Odpovede asistenta: kópia
`assets/asistent-otazky.json` je sémanticky zhodná so zdrojom (porovnanie JSON: True), `node source/tools/otazky.mjs` →
„všetko OK: 251 otázok, 11 tém“.

## 3. Odkazy na prevádzky (curl 27. 10. 2026, `-L -w '%{http_code} final=%{url_effective}'`)

| adresa | kód | konečná |
|---|---|---|
| https://www.headspa30.sk/ (`index.html:894`) | 200 | rovnaká; titulok „HEAD SPA 30 Nitra \| Head Spa rituály, ceny a rezervácia“, `canonical https://headspa30.sk/` |
| https://headspa30.sk/ | 200 | https://www.headspa30.sk/ |
| https://www.salon30.sk/ (`index.html:895`) | 200 | rovnaká; titulok „Salón 30“, prevádzkovateľ „Facepalm s.r.o.“ na stránke |
| https://salon30.sk/ | 200 | https://www.salon30.sk/ |
| https://d8f5s88zjy-art.github.io/head-spa-30/ (canonical koreňového `index.html:30`) | 200 | rovnaká |
| https://www.headspa30.sk/en/ | 404 | – (anglická stránka Barbershopu odkazuje na slovenský web HEAD SPA 30; iná adresa nie je) |

Barbershop 30 → `#uvod` s `aria-current="page"` (`index.html:896`), snímka `po-paticka-pocitac.jpg` otvorená: tretí
odkaz zvýraznený v tóne lampy, blok medzi stĺpcami a riadkom prevádzkovateľa, nadpis `<h2 class="footer-title">` ako ostatné
tri (`index.html:865,873,881,892`). Odchýlka od canonical (github.io → doména) je zdôvodnená (`tools/ftp-balik.sh:26`
prepisuje canonical na doménu pri nahratí; živý web má canonical headspa30.sk) a zapísaná ako otázka 27. OK.

## 4. Commity a strom

`git log --format=%B bdabff7..HEAD | grep -i -E "co-authored|claude|session"` → 0 nálezov; správy po slovensky
(„Barbershop 30: údernejšie texty tímu, recepcia v častých otázkach a odkazy na prevádzky“, „Barbershop 30: preklady nových
textov do siedmich jazykov a anglická stránka“). `git status --short` prázdny, vetva `barbershop-skvrny`. Autor v metadátach
je „Claude <noreply@anthropic.com>“ rovnako ako pri bdabff7 a starších (nastavenie prostredia, nie podpisový riadok). Film.js
nie je v diffe. Vzhľad ostatných častí: diff v `style.css` pridáva len `.team-pillars`, `.footer-shops*` a jednu ťukaciu plochu.

## 5. Nálezy

### S1 (stredná) – hodnotenie číslom v pilieri pri otvorenej otázke 18
`index.html:316` „Hodnotenie 5,0 na Google sa za týždeň nastrihať nedá.“ Pravidlo v
`OTAZKY-PRE-MAJITELA.md:114` znie „Nezaradiť nepotvrdené údaje (… hodnotenie číslom) ako viditeľný text“ a otázka 18
(riadok 26) je stále otvorená. Číslo už je v úvode (`index.html:193`), takže nejde o nový fakt, ale pilier ho zdvojuje
v 8 jazykoch; staviteľ to priznáva (otázka 31). Návrh: pripraviť záložné znenie bez čísla („Hodnotenie na Google sa za týždeň
nastrihať nedá.“ alebo variant poroty pravdy) a prepnúť naň, ak majiteľ na otázku 18 odpovie nie; inak ostáva.

### S2 (stredná) – gzip index.html nad limitom pravidla
`gzip -9 -c index.html | wc -c` → 15 758 B (bdabff7: 14 833 B), pravidlo `OTAZKY-PRE-MAJITELA.md:109` „Neprekročiť 14 600 B“.
Limit bol prekročený už pred zmenou, zmena pridáva ďalších 925 B. Staviteľ to uvádza v odovzdávke aj v CHECKS 32.
Návrh: rozhodnúť, či limit ešte platí; ak áno, riešiť samostatne (napr. odpovede otázok sú najdlhšie texty mimo prvého okna).

### S3 (stredná) – Adrianov riadok je nelogický
`index.html:467`, `rezervacia.html:403`, asistent `tim-adrian`: „Vrátiš sa skôr, než ti stihnú dorásť vlasy.“ Zákazník sa
vracia práve preto, že mu vlasy dorástli; hyperbola pôsobí trápne a v prekladoch (en „before your hair has time to grow“)
ešte zvláštnejšie. Návrh: „Dôveru si získa skôr, než si sadneš. Ďalší termín si dáš skôr, než odídeš.“ (74 zn.) alebo
nechať pôvodnú druhú vetu „Rád sa k nemu vrátiš.“ Zmena = 1 kľúč v 7 slovníkoch + `en/` + asistent.

### D1 (drobná) – poľské „cięcie“ vs. „strzyżenie“
`assets/i18n/pl.json`: štyri nové hodnoty (úvod tímu, Nikolas, Kevin, Jojo) používajú „cięcie“, zvyšok slovníka 36×
„strzyżenie/strzyżemy“ (napr. „Kto cię ostrzyże“, „Strzyżenie męskie 18 €“). Zrozumiteľné, ale nejednotné.
Návrh: „fryzura“ („Fryzura, jakbyś nosił ją od zawsze.“, „Fryzura, która ucieszy cię także po tygodniu.“) alebo „strzyżenie“.

### D2 (drobná) – angličtina: dva výrazy
`en.json` / `en/index.html:893` „Our places“ → „Our locations“ (bežný výraz pre prevádzky); `en/index.html` pilier
„Nothing done blind.“ → „Nothing left to chance.“ (verné zmyslu „nič naslepo“, prirodzenejšie).

### D3 (drobná) – poznámka o garancii v zdrojovom HTML
`index.html:314` a `en/index.html:315` komentár „garancia čaká na potvrdenie majiteľa“ ide na server (aj keď neviditeľne).
Ak majiteľ garanciu nepotvrdí, ostane v kóde navždy. Návrh: komentár skrátiť na „tri piliere tímu, len overené fakty webu“;
stav garancie patrí do OTAZKY a CONTENT_SOURCES, kde už je.

### D4 (drobná) – opakovanie vety o telefóne
`index.html:837` opakuje doslovne vetu „0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme“ z otázky
hneď nad ňou (`:836`) a z `:843`. Zrozumiteľné a chcené (majiteľ: „vždy je lepšie kontaktovať recepciu“), len tri rovnaké
vety na 8 riadkoch. Voliteľne: „Vždy recepcii (0951 267 203, pracovné dni 9:00–19:00).“ – ušetrí ~40 znakov pre záver
z A „Termín si tiež spravíš online, kedykoľvek.“

### D5 (drobná) – názov vetvy v OTAZKY
`OTAZKY-PRE-MAJITELA.md:118` „Postavené na vetve `barbershop-oprava`“; lokálne je to `barbershop-skvrny`
(= `origin/barbershop-oprava`). Po pushnutí bude sedieť; dovtedy je presnejšie uviesť obe.

## 6. Čo som overil a prešlo bez výhrad

- Štepy porôt: obe poroty vyhlásili víťaza C (`porota-majitel.md:20`, `porota-pravda.md:13`), stavba na C je správna.
- Dĺžky riadkov barberov 66–80 znakov, piliere 74–111, odpovede 319 a 205 (prepočítané z HTML).
- `rezervacia.html` nemá vlastné časté otázky (`grep -c faq-item` → 0), takže nová otázka tam nechýba; riadky barberov sú
  v nej zhodné s `index.html`.
- Snímky `po-tim-pocitac.jpg`, `po-otazky-telefon.jpg`, `po-paticka-pocitac.jpg` otvorené: piliere s odstupom od portrétov,
  10 otázok, pätička s troma prevádzkami; text bez pretekania, diakritika správna.
- Odpovede asistenta `tim-*`: 10 zmenených, žiadne id pridané ani odobrané, Adrián/Adrian poznámka o rezervačnom systéme zachovaná.
