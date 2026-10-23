# V5 etapa 1 – Recepcia: oprava po kontrole, kolo 1 (23. 10. 2026)

`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Strom `$SP/hs-recepcia`, vetva `barbershop-recepcia`. Pred opravou bol HEAD `be841ed`, po oprave je `0cdfdd4`.
`git status --short` je po oprave prázdny. Nič sa nepushovalo ani nenasadzovalo.

Opravené sú všetky tri vážne nálezy z `kontrola-obsah-1.md` (V1, V2, V3). `kontrola-kod-1.md` vážny nález nemá
(riadok 7: „Treba však opraviť 5 stredných…“, sekcie len STREDNÉ a DROBNÉ), takže tam nebolo čo opraviť.
Stredné ani drobné nálezy som nemenil. Všetky tri vážne nálezy som pred opravou zopakoval (výstup nižšie) a považujem ich
za skutočné.

## Commity (každá oprava zvlášť, v poradí)

| commit | nález | čo sa zmenilo |
|---|---|---|
| `8dcfc57` | V3 | `recepcia.js` (cenové pravidlo), veta v 8 jazykoch, kmene hair/haar v en a de, test |
| `cfc7901` | V1 | položka `hlava` v 8 jazykoch, masáž/manikúra/pedikúra v `cena-ina-sluzba`, umytie hlavy do `co-je-v-strihu`, test |
| `0cdfdd4` | V2 | `trvanie` je položka so zdrojom v 8 jazykoch (už nie téma „nevieme“), test |

Preklady (`assets/recepcia/{en,uk,hu,sr,pl,de,cs}.json`) generuje `stavba-v5/jazyky-gen.py` z `stavba-v5/jazyky_data.py`.
Stav dát pred opravou je zálohovaný v `stavba-v5/jazyky_data.pred-o1.py`. Overenie, že JSON v strome zodpovedá generátoru:
`python3 -I jazyky-gen.py <strom>/barbershop-30` a hneď potom `git status --short` → prázdne.

## Stav pred opravou (HEAD `be841ed`)

Zopakoval som skúšku kontrolóra (`k1-skusaj.mjs`):

```
sk | kolko stoji masaz hlavy → odpoved hlava | [["Oholenie hlavy","13 €"]]
sk | kolko stoji umytie hlavy → odpoved hlava | [["Oholenie hlavy","13 €"]]
sk | kolko stoji strih na nulu strojcekom → odpoved hlava | [["Oholenie hlavy","13 €"]]
en | how much is a head massage → odpoved hlava | [["Head shave","13 €"]]
de | was kostet eine Kopfmassage → odpoved hlava | [["Kopfrasur","13 €"]]
uk | скільки коштує масаж голови → odpoved hlava | … hu, pl, sr rovnako
sk | ako dlho trva strih → nevieme trvanie | trvanie služieb
sk | kolko stoji strich → nevieme cena-ina-sluzba | Túto službu v cenníku nemáme; pozri si celý cenník.
cs | kolik stoji strich → nevieme cena-ina-sluzba | Tuto službu v ceníku nemáme; …
de | was kostet ein Haarschnit → nevieme romana-ceny | Romanas Preise und Tage …
```

## V3 – pri preklepe „strich“ tvrdil, že službu v cenníku nemáme (`8dcfc57`)

**Príčina.** Cenové pravidlo bolo v `recepcia.js:59–60` (pri `be841ed`). Spustilo sa vždy, keď otázka mala cenové slovo a žiadna
položka neprekročila prah. Preklep „strich“ dá kmeňu `Strih` zhodu len 0,6 (`recepcia.js:23`), a to nestačí.

**Oprava v kóde** (`assets/recepcia.js:53–61`):
- Cenové pravidlo najprv hľadá položky, v ktorých má otázka preklep **silného** kmeňa dlhšieho ako 4 znaky (zhoda ≥ 0,6).
- Ak také položky sú, panel ukáže „Myslíš toto?“ s jednou alebo dvoma najlepšími.
- Ak nie sú, ukáže odovzdanie `cena-ina-sluzba`.
- Kmene dlhšie ako 4 znaky a len silné som zvolil zámerne. Prah na skóre nefunguje, lebo skóre preklepu je rovnaké ako
  náhodná zhoda (meranie pomocným skriptom `o1-cena.mjs`): „kolko stoji strich“ 0,200 (cena-strih), ale aj
  „kolko stoji masaz“ 0,200 (adresa, lebo prefix „masa“ je preklep od „mapa“) a „kolko stoji keratin“ 0,200.
- Témy s pravidlom sa teraz zoraďujú a vetujú ako ostatné „nevieme“. Predtým ich `top()` vynechával, teraz majú kmene
  (využíva to V1). Téma `cena-ina-sluzba` mala dovtedy prázdny `kluc`, takže sa tým nič iné nezmenilo.

**Oprava vety** vo všetkých 8 jazykoch. Nová veta netvrdí nič o podniku:
- sk „Túto službu v cenníku neviem nájsť; pozri si celý cenník.“
- en „I can't find this service in the price list; …“
- de „Diese Leistung finde ich in der Preisliste nicht; …“
- cs „Tuto službu v ceníku nemůžu najít; …“
- pl „Nie mogę znaleźć tej usługi w cenniku; …“
- hu „Ezt a szolgáltatást nem találom az árlistában; …“
- sr „Ne mogu da nađem ovu uslugu u cenovniku; …“
- uk „Не можу знайти цю послугу в прайсі; …“

**Nemecký „Haarschnit“** zachytil slabý kmeň `haar` (prefix) v `romana-ceny`. Po jeho úprave ho zachytili `cena-dlhe`, `deti`,
`depilacia`, `ornament` a `farbenie-vlasov`, ktoré mali `haar` tiež ako prefix. V de sú preto `haar`/`haare` a v en `hair`
celé slová (`=`) v témach mimo strihu. Zložené slová sa chytia cez svoje vlastné kmene: `Nasenhaare` → depilacia 4,00,
`Haarwachs kaufen` → produkty, `hair tattoo` → ornament 2,50, `Haare färben` → farbenie-vlasov 3,00. Vedľajší účinok:
`Haarfarbe` a `haircolor` teraz idú na odovzdanie `romana-ceny` (ceny sú v jej rezervačnom systéme), nie na položku
`farbenie-vlasov`. Nejde o nepravdu, iba o slabšiu odpoveď.

**Po oprave:**
```
sk | kolko stoji strich → vyber cena-strih | cena-strih,cena-strih-brada
cs | kolik stoji strich → vyber cena-strih | cena-strih,cena-strih-brada
de | was kostet ein Haarschnit → vyber cena-strih | cena-strih,cena-strih-brada
en | how much is a haircit → vyber cena-strih,cena-strih-brada (0.20)
sk | kolko stoji pedikura / botox / masaz → nevieme cena-ina-sluzba | Túto službu v cenníku neviem nájsť; …
```

**Test** (`source/tools/recepcia-test.mjs`):
- Nové prípady: preklep strich (sk, cs), Haarschnit (de) a haircit (en) čakajú `cena-strih`. Pedikúra, botox a manicure
  čakajú odovzdanie.
- Kontrola „odovzdanie netvrdí nič nové“ pozná okrem „neuvádzame|nemáme|nevieme“ aj „neviem nájsť“.

## V1 – masáž hlavy, umytie hlavy a strih na nulu dostali cenu oholenia (`cfc7901`)

**Príčina.** Silný kmeň `Hlav` a variant „strih na nulu“ (`sk.json:45` pri `be841ed`), v jazykoch to isté (`Head`, `Kopf`,
`Fej`, `Głow`, `Glav`, `Голов`, buzz cut, na zero, šišanje na nulu, під нуль). K tomu cenový bonus v `skore()`
(`recepcia.js:30`): stačí slabý zásah, aby cenové slová dvihli skóre. Samotné „slabé Hlav“ by preto nestačilo, lebo
„kolko stoji masaz hlavy“ by malo stále 0,75.

**Oprava** (8 jazykov, návrh kontrolóra s jedným doplnkom):
- `hlava`: silné sú len kmene holenia v prvej skupine. Slovo „hlava“ je slabý kmeň v druhej skupine, takže skóre sa
  násobí počtom zasiahnutých skupín. Napr. sk `Ohol Dohola Holen | hlav ples dohola`, en `Shave Shaved Bald | head bald`,
  de `Kopfrasur Glatz Kahl Rasur Rasier | kopf glatz kahl`.
- Varianty strih na nulu, buzz cut, na zero, šišanje na nulu a під нуль sú preč. Strih strojčekom je podľa
  `index.html:529` súčasť pánskeho strihu („strih strojčekom aj nožnicami“).
- `cena-ina-sluzba` má silné kmene masáže, manikúry a pedikúry (de aj `Kopfmassag`, hu `Fejmassz`). Ide o odovzdanie
  „v cenníku neviem nájsť“ s akciami Celý cenník a Zavolať. Masáž sa na stránke nespomína:
  `grep -n -i -E 'masáž|masaz|head spa|massage' index.html` → bez výstupu.
- `co-je-v-strihu` má slabý kmeň hlava (head, kopf, hlav, głow, fej, glav, голов). „Umytie hlavy“ tak ukáže postup strihu
  s riadkom „Umytie vlasov a fénovanie“ (`index.html:517–521`).

**Po oprave** (`stavba-v5/o1-vystup.txt`):
```
sk | kolko stoji masaz hlavy → nevieme cena-ina-sluzba | Túto službu v cenníku neviem nájsť; …
sk | kolko stoji umytie hlavy → odpoved co-je-v-strihu | ["Pánsky strih krok za krokom"]
sk | kolko stoji strih na nulu strojcekom → odpoved cena-strih | [["Pánsky strih","18 €"]]
en | how much is a head massage → nevieme cena-ina-sluzba        (de, cs, uk, hu, pl, sr rovnako)
sk | oholenie hlavy / Oholíte mi hlavu? / dohola / holenie hlavy cena → odpoved hlava | Oholenie hlavy 13 €
```

**Regresie** (`o1-top.mjs`): holenie samotné stále vedie na `holenie`, napr. sk `holenie` 4,00, en `shave` 4,00,
de `Rasur` 4,00, cs `oholit vousy` 2,00. Oholenie hlavy vedie na `hlava` vo všetkých jazykoch, napr. de `Rasiert ihr den
Kopf?` 2,50, hu `Leborotváljátok a fejem?` 1,95, uk `Чи голите голову?` 2,50.

**Test:**
- `['strih na nulu','hlava']` je zmenené na `cena-strih`.
- Negatívne prípady: masáž hlavy (sk a všetkých 7 jazykov) čaká odovzdanie, umytie hlavy (2×) čaká `co-je-v-strihu`.

## V2 – „trvanie služieb nemáme potvrdené“ bola nepravda (`0cdfdd4`)

**Dôkaz, že stránka trvania má.**
- `index.html:529–530`: „Pánsky strih“ / „40 min“.
- `index.html:565–566`: „Úprava brady“ / „20 min“.
- `sed -n 525,635p index.html | grep price-time` vypíše 15 riadkov s trvaním.

**Oprava** (8 jazykov):
- `trvanie` je teraz položka so zdrojom, nie téma „nevieme“. Odpoveď je „Pánsky strih 40 min“ a „Úprava brady 20 min“,
  zdroj `index.html:529`, `:530`, `:565`, `:566`, overené 2026-10-23.
- Akcie sú Celý cenník (ostatné trvania) a Rezervovať termín.
- Preklady viet sú doslovne zo slovníkov stránky (test 4: „viet so slovníkovým prekladom“ 44 → 48 v každom jazyku).
- Kmene ostali, pribudol slabý kmeň brady.
- Spolu: položiek 31, tém „nevieme“ 19 (kritérium ≥ 19 platí).

**Po oprave:**
```
sk | ako dlho trva strih → odpoved trvanie | [["Pánsky strih","40 min"],["Úprava brady","20 min"]]
en | how long does a haircut take → odpoved trvanie | [["Men's haircut","40 min"],["Beard trim","20 min"]]
sk | kolko minut trva uprava brady → vyber trvanie | trvanie,cena-brada
sk | ako dlho fungujete → odpoved odkedy (bez zmeny)
```

**Test:** 9 výskytov `'?trvanie'` (sk a 7 jazykov) je zmenených na `'trvanie'`.

## Váha (kritérium 8.2: panel ≤ 10 240 B gzip)

Pred opravou bola váha 10 193 B, rezerva len 47 B. Nová logika a dáta pridali asi 130 B. Aby panel ostal v limite, skrátil
som tri komentáre v dodávaných súboroch. Kód ani pravidlá sa tým nezmenili:
- `recepcia.js:1` je teraz „Recepcia: nič sa neposiela ani neukladá; test recepcia-test.mjs“.
- komentár kostry panelu je teraz „kostra bez textu návštevníka“.
- `recepcia.css:1` je teraz „Recepcia (recepcia.js); farby zo style.css“.

Výsledok: `recepcia.js 3597 B, recepcia.css 998 B, sk.json 5612 B, spolu 10207 B`. S iným jazykom je najviac uk
11 134 B ≤ 12 288 B.

## Testy (HEAD `0cdfdd4`)

```
node --test barbershop-30/source/tools/recepcia-test.mjs
# otázok: 284 (z toho nevieme 78), správne 100.0 %, falošné na nevieme 0, fallback 0 (0.0 %), ponuka „Myslíš toto?“ 3
# položiek 31, tém nevieme 19, zdrojov 56
# en … cs: viet so slovníkovým prekladom 48, otázok 18–21, správne všetky
# gzip: … spolu 10207 B
# tests 11 / pass 11 / fail 0
```

Ďalšie kontroly:
- `node stavba-v5/dom-skuska.mjs <strom>/barbershop-30`: 20× OK, bez chyby.
- `eslint --no-config-lookup --rule '{"no-undef":"error","no-unused-vars":"error"}' --global window,document,fetch,URL assets/recepcia.js`:
  exit 0.
- `git diff be841ed HEAD | grep '^+' | grep -i -E '\bAI\b|umel[áa] inteligenc|artificial|chatbot|asistent|assistant|GPT|Claude'`:
  bez výstupu. Rovnaký grep nad správami troch commitov: bez výstupu.

**Prehliadač: ODLOŽENÉ.** Zmeny sú v dátach a v logike `odpovedz` a overil som ich v Node. Nový je len prípad „Myslíš toto?“
s jedným tlačidlom (`r.p.forEach` v `spytaj`, `recepcia.js:97`). Vizuálne som ho v prehliadači nevidel.

## Čo ostáva mimo tohto kola

- **Návrh a plán.** `asistent.md` časť 6 (riadok „trvanie“) a `PLAN-TELEFON-V2.md` („trvania“) stále uvádzajú trvanie ako
  tému „nevieme“. Sú mimo povolených priečinkov, preto som ich nemenil. Treba ich opraviť podľa V2.
- **Stredné a drobné nálezy** (S1–S8, D1–D10, stredné z kontroly kódu) som zámerne nemenil. Dve súvisiace pozorovania:
  - „pridem o 10 minut neskor“ je po V2 fallback, pred opravou bolo nepravdivé „trvanie nemáme potvrdené“ (S5).
  - „kolko stoji farbenie bardy“ a hu „hajvgas“ idú na `romana-ceny` rovnako ako pred opravou (trieda S5).
- **Rezerva váhy je 33 B.** Každá ďalšia položka v `sk.json` si vyžiada úsporu inde.

## Pomocné súbory (mimo stromu, v `stavba-v5/`)

- `o1-otazky.txt`: vstup reprodukcie.
- `o1-vystup.txt`: výstup po oprave.
- `o1-top.mjs`: najlepšia položka a skóre.
- `o1-cena.mjs`: skóre pri cenovom pravidle.
- `o1-vaha.mjs`: gzip ako test 5.
- `jazyky_data.pred-o1.py`: dáta pred opravou.
