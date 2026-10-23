# V5 etapa 1 – Recepcia: oprava po kontrole, kolo 2 (23. 10. 2026)

`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Strom `$SP/hs-recepcia`, vetva `barbershop-recepcia`. Pred opravou bol HEAD `0cdfdd4`, po oprave je `d4657b7`.
`git status --short` je po oprave prázdny. Nič sa nepushovalo, nemergovalo ani nenasadzovalo.

- `kontrola-kod-2.md` vážny nález nemá (riadok 10: „Vážny nález v kóde nie je: bezpečnosť, váha, `index.html` aj i18n
  prechádzajú.“). V kóde preto nebolo čo opraviť.
- Opravené sú oba vážne nálezy z `kontrola-obsah-2.md`, teda V4 a V5. Pred opravou som oba zopakoval
  (`o2/pred.txt`) a oba sú skutočné.
- Stredné a drobné nálezy (S1–S8, N1–N3, D1–D13) som nemenil.
- `recepcia.js`, `recepcia.css` ani `index.html` sa nezmenili. Overenie: `git diff 0cdfdd4 -- barbershop-30/assets/recepcia.js barbershop-30/index.html | wc -c` → `0`.
  Zmenili sa iba dáta (`assets/recepcia/*.json`) a test.

## Commity

| commit | nález | čo sa zmenilo |
|---|---|---|
| `c1b4a48` | V4 | téma `damske`: nové silné kmene v sk, cs a pl; 9 nových otázok v teste |
| `d4657b7` | V5 | `depilacia`: vosk je slabý kmeň (7 jazykov), `produkty` má `cena: 1`; 19 nových otázok v teste |

- Preklady sú vygenerované z `stavba-v5/jazyky_data.py` (`jazyky-gen.py`). Stav pred opravou je zálohovaný
  v `stavba-v5/jazyky_data.pred-o2.py`.
- Po každom commite som spustil `python3 -I jazyky-gen.py <strom>/barbershop-30` a hneď potom `git status --short`.
  Výstup bol prázdny, takže JSON v strome zodpovedá generátoru.

## V4 – strih pre ženu dostal cenu pánskeho strihu (`c1b4a48`)

**Reprodukcia pri `0cdfdd4`** (`node k1-skusaj.mjs … < o2/otazky.txt`, výstup `o2/pred.txt`):
```
sk | strihate aj damy? → odpoved cena-strih | [["Pánsky strih","18 €"]]
sk | ostrihate aj babu? / ostrihate aj moju frajerku / strihate aj slecny / kolko stoji strih pre damy → to isté
cs | stříháte i dámy? / kolik stojí střih pro dámy → odpoved cena-strih | [["Pánský střih","18 €"]]
pl | czy strzyżecie panie / strzyżenie dla pań → odpoved cena-strih | [["Strzyżenie męskie","18 €"]]
```

**Oprava.** V téme `damske` pribudli silné kmene. Silný kmeň „nevieme“ s presnou zhodou vetuje každú odpoveď
(`recepcia.js:36`, `veto`, použité na `:55`).

| jazyk | pridané kmene |
|---|---|
| sk | `=Damy Frajerk Slecn =Baba =Babu =Baby` (`sk.json:82`) |
| cs | `=Dámy` (výsledok v `cs.json`: `=Damy`) |
| pl | `=Panie =Pan` |

**Odchýlky od návrhu kontroly (s dôkazom):**
- **Bez `=Dam` (sk, cs).** „dám“ je aj sloveso. Napríklad „dám si ostrihať bradu“ a cs „dám si střih a vousy“ sa normalizujú
  na „dam“ a veto by ich poslalo na odovzdanie. Po oprave ostávajú odpoveďou (`o2/kolizie.txt`):
  `sk | dam si ostrihat bradu → odpoved cena-strih-brada`, `cs | kolik dám za střih → odpoved cena-strih`.
- **`=Baba =Babu =Baby` namiesto prefixu `Bab`.** Prefix chytil aj bábätká. Pri prvom pokuse bolo
  `sk | strihate aj babatka → nevieme damske`, teraz je to `odpoved cena-strih`, rovnako ako pred opravou.
- **pl `=Pan` namiesto `Pań`.** Generátor by z `Pań` urobil prefix `Pan`, ktorý chytí aj „panów“ (páni). Preto je tu
  presná zhoda `=Pan`, na ktorú sa normalizuje „pań“ (`norm` odstráni diakritiku, `recepcia.js:2`).
  - `pl | strzyżenie dla panów → odpoved cena-strih` ostáva odpoveďou.
  - **Daň:** „pan“ ako oslovenie muža teraz vedie na odovzdanie:
    `pl | ile pan bierze za strzyżenie → nevieme damske`, `pl | czy pan jest wolny jutro → nevieme damske`
    (predtým 18 € a fallback).
  - Ide o bezpečnú, hoci nepresnú odpoveď: odovzdanie na telefón a e-mail nič netvrdí. Opačná chyba (cena pánskeho
    strihu žene) je v návrhu časť 7 vedená ako riziko, ktoré nesmie nastať.
  - **`=Pani` som nepridal.** Oslovenie recepčnej („czy pani wie ile kosztuje strzyżenie“) by sa inak odovzdávalo.
    Výsledok: `→ odpoved cena-strih`.

**Po oprave** (`o2/v4-vystup.txt`):
- Všetkých 6 otázok zo sk, 3 z cs a 3 z pl vedie na `nevieme damske`, napr.
  „Dámske strihy na webe neuvádzame.“ a „Strzyżeń damskich nie podajemy na stronie.“
- Kontrolné otázky en, de, hu, sr a uk ostali na `damske`.

**Regresie.** Spustil som 240 otázok: `k2-otazky.txt`, `k2-otazky-b.txt`, `o1-otazky.txt` a `o2/otazky.txt`.
Porovnanie `diff o2/head-vystup.txt o2/v4-vystup.txt` ukázalo 19 zmenených riadkov. Všetky sú otázky V4 (ženy) a všetky
zmeny sú z `cena-strih` na `nevieme damske`. Iný riadok sa nezmenil.

**Test.** Pribudli negatívne otázky:
- sk: dámy, strih pre dámy, baba, frajerka, slečny,
- cs: dámy, strih pro dámy,
- pl: panie, dla pań.

Kontrola proti kolíziám: „dám si ostrihať bradu“ musí ostať `cena-strih-brada` a „strzyżenie dla panów“ musí ostať
`cena-strih`.

## V5 – vosk na vlasy dostal cenu depilácie (`d4657b7`)

**Reprodukcia pri `0cdfdd4`:**
```
sk | kolko stoji vosk na vlasy → odpoved depilacia | [["Depilácia uší a nosa voskom","5,50 €"]]
sk | cena vosku na vlasy → odpoved depilacia | …
en | how much is hair wax → odpoved depilacia | [["Ear and nose waxing","5,50 €"]]
de | was kostet Haarwachs / was kostet Wachs für die Haare → odpoved depilacia
cs | kolik stojí vosk na vlasy, pl | ile kosztuje wosk do włosów, sr | koliko košta vosak za kosu → odpoved depilacia
hu | mennyibe kerül a hajwax, uk | скільки коштує віск для волосся → nevieme romana-ceny
```

**Návrh kontroly som nepoužil a toto je dôkaz.** Pomocná skúška `o2/o2-navrh.mjs` mení dáta len v pamäti.
Silný `Vosk` v `produkty` spustí veto pri každom slove „vosk“, a teda aj pri depilácii voskom:
```
vosk usi a nos → návrh: nevieme produkty | oprava: odpoved depilacia
depilacia voskom → návrh: nevieme produkty | oprava: odpoved depilacia
kolko stoji depilacia usi voskom → návrh: nevieme produkty | oprava: odpoved depilacia
```
Otázka `['vosk usi a nos', 'depilacia']` je v teste (`recepcia-test.mjs:64`), takže návrh by ho rozbil.

**Oprava** (iba dáta):
1. **`depilacia`: vosk je slabý kmeň.** sk `vosk` (`sk.json:50`), de `wachs`, cs `vosk`, pl `wosk`, sr `vosak vosk`,
   uk `воск`. V en bol `wax` slabý už predtým.
   - Depiláciu ďalej nesú silné kmene uší, nosa a depilácie: `Depil Usi Usn Chlp =Nos`, en `Waxing =Ear =Nose`,
     de `Ohr Nase Waxing`.
2. **`produkty` dostala `"cena": 1`** (`sk.json:75`, generátor ju prenesie do všetkých jazykov, `jazyky-gen.py:87`).
   - Cenové slová tak dvíhajú skóre aj tejto téme, rovnako ako pri `romana-ceny` (`recepcia.js:30`, `p._c` z `:43`).
   - Pri rovnakom skóre vyhrá téma „nevieme“ (`recepcia.js:56`, `n[0][0] >= p[0][0] - t.blizko`).
   - Príklad „kolko stoji vosk na vlasy“: `depilacia` 1,00 a `produkty` 1,00, výsledok `produkty`.
   - Príklad „kolko stoji depilacia usi voskom“: depilácia má navyše silné `Depil` a `Usi`, takže vyhrá.

**Po oprave** (`o2/v5-vystup.txt`): všetky otázky z reprodukcie, teda sk, en, de, cs, pl, sr, hu a uk, vedú na
`nevieme produkty`. Ide o odovzdanie „Na webe zatiaľ nemáme potvrdené: značky produktov.“ s akciami tel a e-mail.
Žiadna z nich už neukazuje cenu.

**Depilácia ostala odpoveďou** (`o2/depilacia.txt`, výstup pred opravou aj po nej je zhodný):
```
sk | vosk usi a nos / depilacia voskom / kolko stoji depilacia usi voskom → odpoved depilacia 5,50 €
en | how much is ear waxing / nose wax price → odpoved depilacia
de | was kostet Ohrenwachs / Nasenhaare wachsen Preis → odpoved depilacia
cs, pl, sr, uk (depilácia uší voskom), hu (fülgyantázás) → odpoved depilacia
sk | kolko stoji uprava brady → cena-brada 15 €; cena brady → cena-brada; strih na dlhe vlasy → cena-dlhe 22 €
sk | kolko stoji farbenie vlasov → nevieme romana-ceny (bez zmeny)
```

**Regresie** (`diff o2/v4-vystup.txt o2/v5-vystup.txt`, 240 otázok). Zmenili sa len otázky na vosk na vlasy a jedna ďalšia:
- `sk | kolko stoji umytie vlasov`: predtým `nevieme romana-ceny`, teraz `nevieme produkty`.
- Nejde o nepravdu ani o cenu. Je to stále zlá téma odovzdania, teda stredný nález S5, ktorý ostáva otvorený.
  Správne by bolo `co-je-v-strihu`.

**Test.** Pribudli tieto otázky:
- sk: vosk na vlasy (2×) čaká `?produkty`, depilácia voskom (2×) čaká `depilacia`.
- en, de, cs, pl, sr, hu, uk: vosk na vlasy čaká `?produkty`.
- en, de, cs, pl, sr, uk: depilácia voskom čaká `depilacia`.

## Testy a kontroly (HEAD `d4657b7`)

```
node --test barbershop-30/source/tools/recepcia-test.mjs
# otázok: 294 (z toho nevieme 85), správne 100.0 %, falošné na nevieme 0, fallback 0 (0.0 %), ponuka „Myslíš toto?“ 3
# en 23/23, uk 20/20, hu 19/19, sr 20/20, pl 23/23, de 23/23, cs 23/23; viet so slovníkovým prekladom 48 v každom
# gzip: recepcia.js 3597 B, recepcia.css 998 B, sk.json 5635 B, spolu 10230 B   (limit 10 240 B, rezerva 10 B)
# gzip: uk.json 6544 B, spolu s modulom 11139 B (najťažší jazyk, limit 12 288 B)
# tests 11 / pass 11 / fail 0
```

- `node stavba-v5/dom-skuska.mjs <strom>/barbershop-30` skončila „hotovo“ a bez chyby.
- `git diff 0cdfdd4 | grep '^+' | grep -i -E '\bAI\b|umel[áa] inteligenc|artificial|chatbot|asistent|assistant|GPT|Claude'`
  nič nenašiel (exit 1). Rovnaký grep nad správami oboch commitov tiež nič nenašiel (exit 1).
- Commity sú bez podpisov podľa `CLAUDE.md:50`.

**Prehliadač: ODLOŽENÉ (nie prejdené).** O 11:14 UTC `pgrep -f "http.server 86[01]"` nič nenašiel, ale
`pgrep -c -f "headless_shell|chrome-linux/chrome"` = **8**. Zmeny sú len v dátach JSON, takže vzhľad ani DOM sa nemenia.
Overil som ich v Node.

## Čo ostáva

- **Rezerva váhy sk je 10 B.** Pred opravou bola 33 B. Ďalšia zmena v `sk.json` si vyžiada úsporu inde.
- **pl „pan“.** Oslovenie muža vedie na odovzdanie `damske` (pozri V4, daň). Rozlíšiť „dla pań“ od „pan“ dátami
  nejde, pretože normalizácia odstraňuje diakritiku.
- **S8 (odložená sada) stále neexistuje.** Nové otázky som pridal do sady autora, ako žiadalo zadanie. Ich správanie
  na nevidených tvaroch preto treba znova overiť v kole 3.
- Stredné nálezy S1–S8, N1–N3, drobné nálezy a úprava `asistent.md` (trvanie) ostávajú mimo tohto kola.

## Pomocné súbory (mimo stromu, v `stavba-v5/`)

- `o2/otazky.txt`: reprodukcia V4 a V5 v 8 jazykoch.
- `o2/pred.txt`: výstup pri `0cdfdd4`.
- `o2/kolizie.txt`: tvary „dám“, „bab“ a „pan“.
- `o2/depilacia.txt`: depilácia, ktorá musí ostať odpoveďou.
- `o2/vsetky.txt` (240 otázok): regresia s výstupmi `o2/head-vystup.txt` (pri `0cdfdd4`, kópia dát v `o2/head/`),
  `o2/v4-vystup.txt` a `o2/v5-vystup.txt`.
- `o2/o2-navrh.mjs`: porovnanie návrhu kontroly s opravou, len v pamäti.
- `jazyky_data.pred-o2.py`: dáta prekladov pred opravou.
