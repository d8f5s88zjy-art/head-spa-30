# V5 etapa 1 – Recepcia: skeptik (25. 10. 2026, 08:45 UTC)

Strom `hs-recepcia`, vetva `barbershop-recepcia`, HEAD **6f8c47c** (posledný commit 07:51), `git status --short` prázdny.
V strome som nič nemenil. Moje súbory: `stavba-v5/skeptik/otazky.txt`, `otazky2.txt`, `vystup.txt`, `vystup2.txt`.
Prehliadač som nespúšťal (vzhľad beriem z `kontrola-vzhlad-v5.md` a overujem len v zdrojovom kóde).

Tvrdenie: „Recepcia na HEAD už nedáva nesprávnu cenu ani trvanie, pri neistote poctivo odovzdá, je bezpečná, ľahká
a na telefóne aj počítači vyzerá dobre.“

## Verdikt: NEPOTVRDENÉ → neposielať

Bezpečnosť, váha, index.html 0 B a testy sú v poriadku. **Vážna trieda chýb ale stále trvá:** zo 77 mojich otázok
v 8 jazykoch dostalo **18 nesprávnu cenu alebo trvanie inej služby**. Po oprave 4 už nepribudol žiaden commit:
`kontrola-kod-4.md` (08:10) našla na tom istom HEAD nálezy V1–V5 a S1, nikto ich neopravil. Slepé hodnotenie 2
(0 chýb v 924 otázkach) je pravdivé pre svoje sady, ale tie neobsahovali „služba + Romanina služba“ ani „trvanie +
niečo bez trvania“. Test 23/23 prechádza, pretože tieto triedy nepokrýva.

## 1. Otázky (77, 8 jazykov) – `node k1-skusaj.mjs <strom>/barbershop-30 < skeptik/otazky*.txt`

Výsledok: 18 vážnych chýb, 2 odchýlky bez vážnej chyby a 57 v poriadku alebo bezpečne odovzdaných
(téma „nevieme“, „Myslíš toto?“, fallback). Približne 11 otázok má rovnaké alebo takmer rovnaké znenie ako sondy
v `kontrola-kod-4.md`. Tie som zámerne zopakoval, aby som overil, že na HEAD stále platia. Ostatných 66 otázok je nových.

### Vážne chyby (cena alebo trvanie inej služby)

| # | otázka | odpoveď na HEAD | správne podľa stránky | nové / K4 |
|---|---|---|---|---|
| 1 | sk „Koľko stojí strih a melír?“ | Pánsky strih **18 €** | melír robí Romana, cenu web neuvádza → odovzdanie/výber | K4 V1 |
| 2 | sk „Koľko stojí holenie a melír?“ | Holenie Hot Towel **15 €** | to isté | **nové** |
| 3 | sk „Koľko stojí úprava obočia a trvalá?“ | Úprava obočia **3 €** / Farbenie obočia **5 €** | trvalú robí Romana | **nové** |
| 4 | sk „Koľko stojí odfarbenie fúzov?“ | Farbenie brady **10 €** | odfarbenie stránka neponúka (`index.html:577` „Farbenie profesionálnymi farbami“) | K4 S1 |
| 5 | sk „Koľko stojí zafarbenie šedín **na hlave**?“ | Farbenie brady **10 €** | farbenie vlasov = Romana; otázka výslovne hovorí „na hlave“ | **nové** (tvar K4 V5) |
| 6 | cs „Kolik stojí stříhání vousů a melír?“ | Pánský střih a úprava vousů **28 €** | zákazník chce bradu + melír, dostane cenu strihu s bradou | **nové** |
| 7 | hu „Mennyibe kerül a hajvágás és a melír?“ | Férfi hajvágás **18 €** | Romana | K4 V1 |
| 8 | hu „Mennyibe kerül a szakáll és dauer?“ | Szakálligazítás **15 €** | Romana (trvalá) | **nové** |
| 9 | pl „Ile kosztuje strzyżenie i pasemka?“ | Strzyżenie męskie **18 €** | Romana | K4 V1 |
| 10 | uk „Скільки коштує стрижка і мелірування?“ | Чоловіча стрижка **18 €** | Romana | K4 V1 |
| 11 | sr „Koliko košta šišanje i trajna?“ | Muško šišanje **18 €** | Romana | K4 V1 |
| 12 | hu „Mennyi ideig kell várni?“ | strih **40 perc** + brada **20 perc** | čakaciu dobu web neuvádza → odovzdanie | K4 V2 |
| 13 | pl „Jak długo trwa rezerwacja?“ | **40 / 20 min** | rezervácia nemá trvanie | K4 V2 |
| 14 | cs „Jak dlouho trvá rezervace?“ | **40 / 20 min** | to isté | K4 V2 |
| 15 | uk „Скільки хвилин чекати?“ | **40 / 20 хв** | čakacia doba – odovzdanie | K4 V2 |
| 16 | sr „Koliko traje rezervacija?“ | **40 / 20 min** | rezervácia nemá trvanie | **nové** (iný tvar ako K4) |
| 17 | sr „Koliko dugo se čeka?“ | Muško šišanje nad 10 cm **22 €** | čakanie, nie dlhé vlasy | K4 V3 |
| 18 | sr „Koliko je doplata za subotu?“ | **22 €** (zákazník to prečíta ako príplatok za sobotu) | príplatok web neuvádza | K4 V4 |

Príčina v kóde je stále tá, ktorú opísala kontrola 4:
- `assets/recepcia.js:60`: druhá služba v otázke (`Y`) sa hľadá len medzi položkami s cenou (`y._c`). Melír, trvalá,
  pasemka, trajna, dauer, sobota a rezervácia sú pre modul „známe slovo položky bez ceny“, takže ich nestráži ani pravidlo 2.
- `assets/recepcia.js:91`: ak otázka na trvanie trafí položku bez služby (rezervácia, čakanie, káva), vráti sa
  východiskové trvanie strihu a brady (`R('odpoved', [r.skore, 0, T])`), nie odovzdanie.
- Dáta: `Dlh`/`Dug` (dlho, dugo) a `Priplat`/`Doplat` sú silné kmene dlhých vlasov. Šediny sú v skupine brady pri
  farbení brady (rad 5 to dokazuje aj pri slovách „na hlave“).

### Odchýlky bez vážnej chyby

- en „How long is a beard trim?“ → strih 40 min **a** brada 20 min. Správne číslo tam je, ale otázka menuje len bradu.
- sk „Ako dlho trvá čakanie na voľné miesto?“ → téma „školenia a voľné miesta“, sk „Robíte aj predĺženie vlasov?“ →
  „značky produktov“: nesprávny štítok, ale bez ceny.

### Čo funguje (výber)

- Bežné otázky: sk/en/de/pl/sr cena strihu, brady, oholenia hlavy – 18 €, 15 €, 13 € zo správneho riadku (`index.html:531`, `:567`, `:555`).
  Trvanie oholenia hlavy 25 min (`:554`).
- Poukážky, platba kartou, parkovanie, dámske strihy (dcéra, manželka, Tochter, córka, női), 14-ročný, produkty
  (šampón, Bartöl), alergia → vždy téma „nevieme“ s odovzdaním. „Strih v nedeľu“ → otváracie hodiny „Ne zatvorené“.
- en/de „haircut and highlights / perm“, cs „střih a barvení vlasů“, pl a uk šediny → Romana alebo „nevieme“ (správne).
  **Tá istá trieda teda funguje len pri niektorých slovách a jazykoch.** Presne tak vyzerá chyba, ktorá sa vracia
  v nových tvaroch.

## 2. Ďalšie tvrdenia (overené príkazom)

| tvrdenie | výsledok | dôkaz |
|---|---|---|
| testy prechádzajú | **áno**, 23/23, `# fail 0`, 8,7 s | `node source/tools/recepcia-test.mjs` |
| index.html 0 B | **áno** | `git diff f624ee8..HEAD -- index.html \| wc -c` → 0 |
| váha po ťuknutí (gzip -9, js + css + jazyk) | **áno**: sk 11 049 ≤ 11 264, najťažší uk 12 221 ≤ 12 800 (en 11 089, cs 11 473, de 11 263, hu 11 479, pl 11 611, sr 11 180). Kontrola 4 v Node zlib nameriala sk 11 246 B, rezerva je teda len **18 B** a každá oprava musí byť úsporná | `cat … \| gzip -9c \| wc -c` |
| prvé okno ≤ 500 B | **áno**: app.js +297, style.css +181 = **+478 B** (gzip -9) | `git show f624ee8:… \| gzip -9c` |
| bezpečnosť | **áno**: `innerHTML` len pri statickej kostre (`recepcia.js:154`), jediný `fetch` je JSON jazyka z bieleho zoznamu (`:98`), žiadny localStorage, sessionStorage, IndexedDB ani cookie, žiadne eval | `grep -nE 'innerHTML\|fetch\(\|localStorage\|cookie\|eval\(' assets/recepcia.js` |
| žiadna zmienka o AI | **áno**: v recepcia.js, recepcia.css ani v JSON nie je AI, umelá inteligencia, chatbot ani asistent | `grep -rniE` → 0 |
| vyzerá dobre na telefóne aj počítači | **len čiastočne**: vzhľad v pokoji je pixelovo nezmenený (`kontrola-vzhlad-v5.md`), ale interakcia NEPREŠLA a nič z nálezov nie je opravené. Pri otvorenom paneli sa posúva stránka (S7: `overscroll` sa v `recepcia.css` nevyskytuje, `grep -c` → 0). Pás filmu na počítači zakrýva tlačidlo z 48 z 56 px (S3). Film reaguje na klávesy pri otvorenom paneli (S2: `film.js` nepozná `dialog`). Rad volieb sa pri ďalšom otvorení nevráti na začiatok (V1: v recepcia.js nie je `scrollLeft`, fokus má `preventScroll: true`) | grep v `assets/recepcia.css`, `recepcia.js`, `film.js` |

## 3. Čo treba pred odoslaním

1. Kód: `recepcia.js:60` – za druhú vec v otázke brať aj položku bez ceny so silnou zhodou (Romana, hodiny, rezervácia).
   `recepcia.js:91` – trvanie len pri položke s `cas`, inak odovzdanie.
2. Dáta: dlho/dugo/dlouho/długo ako spúšťač trvania, nie kmeň dlhých vlasov. Príplatok nie ako silný kmeň dlhých vlasov.
   Šediny preč zo skupiny brady.
3. Testy z dát všetkých 8 jazykov: „služba s cenou × položka bez ceny“, „trvanie × položka bez trvania“,
   „cenové slovo + časová príslovka“. Potom znova `node stavba-v5/k4/trieda-k4.mjs <strom>` (kontrola 4: 571 + 195 chýb) a moje
   `skeptik/otazky*.txt`.
4. Vzhľad: S7 (zamknúť skrol stránky pri otvorenom paneli), S3 (tlačidlo pod pásom filmu), V1 (`scrollLeft = 0`).
