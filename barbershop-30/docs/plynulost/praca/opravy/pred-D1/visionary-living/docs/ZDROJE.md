# Zdroje obsahu (VISIONARY LIVING, Černík)

Zásada: každý údaj na webe má zdroj; čo v zdroji nie je, na webe nie je. Jediný zdroj je pôvodný web
https://www.visionaryliving.sk/ (WordPress + Elementor), stiahnutý 13. 10. 2026 (titulka, O projekte, Lokalita,
Dostupné byty, 12 stránok bytov, Financovanie, Galéria, Kontakt, Zásady ochrany osobných údajov, Cookies).
Stupeň: overené-oficiálne (web podniku). Údaje sú v `source/obsah.json`, stránky z nich skladá `source/zostav.py`.

| Údaj | Hodnota | Kde na pôvodnom webe | Poznámka |
| --- | --- | --- | --- |
| Značka a slogan | Visionary Living, „Bývanie s víziou“ | titulka (title), logo | |
| Prevádzkovateľ | Outlet, s.r.o. | Kontakt, Zásady ochrany OÚ | IČO web neuvádza |
| Zodpovedná osoba (GDPR) | Ing. Jakub Dobšinský | Zásady ochrany OÚ | len na stránke ochrany údajov |
| Telefón | 0908 545 096 | pätička, Kontakt | |
| E-mail | info@visionaryliving.sk | pätička, Kontakt | |
| Facebook, Instagram | facebook.com/visionaryliving.sk, instagram.com/visionary.living | pätička | |
| Projekt | dve dispozične rovnaké bytovky vedľa seba, 3 nadzemné podlažia | O projekte, stránky bytov | |
| Byty | 12 bytov A1 až L3, 4 na podlaží (2-izb., 3-izb., 3-izb., 2-izb.) | Dostupné byty, stránky bytov | či ide o jednu alebo obe bytovky, web neuvádza |
| Stav bytov | všetky „VOĽNÝ“ | Ponuka bytov (titulka) | stav k 13. 10. 2026, mení sa |
| 2-izbový byt | 114 900 €, 44,20 m² vrátane loggie; chodba 3,04, obytná kuchyňa 21,50, izba 12,00, kúpeľňa + WC 3,61, loggia 4,05 | O projekte, stránky bytov | |
| 3-izbový byt | 149 900 €, 68,67 m² vrátane loggie; chodba 3,58, WC 1,08, tech. miestnosť 1,79, obývačka + kuchyňa 27,51, predsieň 2,95, kúpeľňa + WC 3,71, izba 12,00, izba 12,00, loggia 4,05 | O projekte, stránky bytov | súčet miestností 68,67 sedí |
| Štandard | laminátové podlahy, plastové okná s izolačnými sklami, sanita, obklad, dlažba, bezpečnostné dvere, loggia, parkovacie miesto v cene | O projekte, stránky bytov | titulka píše „plávajúce podlahy“, O projekte „laminátové“: to isté |
| Technológie | tepelné čerpadlo (kúrenie aj ohrev vody), solárne kolektory, izolácia | titulka, O projekte | |
| Harmonogram | Jar 2025 zahájenie, Jar 2026 ukončenie výstavby | O projekte | pozri Neoverené |
| Vzdialenosti | Šurany 11 km, Podhájska 17 km, Vráble 18 km, Nitra 23 km | titulka, Lokalita | |
| Obec | okres Nové Zámky, Nitriansky kraj; susedia Mojzesovo, Vinodol, Komjatice, Maňa, Kmeťovo, Michal nad Žitavou; lesy 315 ha, poľnohospodárska pôda nad 900 ha, rozloha 1 339 ha; rybník a časť štrkoviska | Lokalita | |
| Vybavenie obce | obchody, materská škola, ZŠ Mojzesovo, pošta, reštaurácia, všeobecný lekár, zberový dvor, kultúrne podujatia | titulka | |
| Financovanie | rezervačný poplatok 5 000 €; 1. splátka 20 % do 30 pracovných dní od právoplatného stavebného povolenia (poplatok sa započíta); 2. splátka zvyšok do 30 dní od podpisu kúpnej zmluvy; 3. splátka zvyšok do 30 dní od podpisu kúpnej zmluvy po kolaudácii; sprostredkovanie hypotéky a poistenia | Financovanie | 2. a 3. splátka sú na pôvodnom webe opísané takmer rovnako |
| Obrázky | vizualizácie exteriéru 01 až 05 a dron, interiéry, pôdorysy a1 až l3 (2560 × 1440), logo | wp-content/uploads | materiály klienta; ďalšie obrázky z WordPress knižnice sú šablónové (placeholder, king-logo, banner) a nepoužili sa |
| Ochrana osobných údajov, cookies | texty podľa pôvodného webu, aktualizácia 31. 3. 2025 | podstránky | časť o cookies WordPressu pre statický web neplatí, upravené |

## Chyby pôvodného webu, ktoré nová verzia nepreberá

- Byt G 2 má v nadpise „na prvom podlaží“, v údajoch „2. podlažie“; podľa písmena a susedných bytov je na 2. podlaží.
- Stránky bytov obsahujú nevyplnený text šablóny „Sample Subtitle“.
- Na stránke Dostupné byty chýba obrázok bytovky pod značkami bytov a v zozname bytov sú rozbité obrázky.
- Na titulke je rozbitý obrázok „03-1024x576“ pri sekcii Lokalita.
- Zoznam bytov je raz zoradený A → L, inde L → A.
- Server vracia pri načítaní 429 (príliš veľa požiadaviek), časť skriptov sa nenačíta (jQuery is not defined).

## Čo ostáva neoverené (na webe nie je alebo je označené)

- Harmonogram „ukončenie výstavby jar 2026“ je dnes (október 2026) minulosť; pôvodný web ho stále uvádza.
  Nový web ho uvádza tak, ako je, s poznámkou pre klienta, aby ho aktualizoval.
- Dostupnosť bytov: všetky „voľný“ podľa stavu z 13. 10. 2026.
- Adresa stavby (ulica, parcela), IČO, mená predajcov, otváracie hodiny kancelárie: web neuvádza, preto nie sú ani tu.
- Ceny: uvedené ako na webe; či sú s DPH a či ešte platia, web nehovorí.

## Texty odvodené zo zdroja (nie doslovné)

Nový web niektoré vety skladá z údajov vyššie; nič v nich nie je navyše oproti zdroju:

- „Dve dispozične rovnaké bytovky, 3 nadzemné podlažia, 4 byty na podlaží. Schéma, poradie bytov podľa pôdorysov.“ –
  popis nakreslenej fasády (projekt + pôdorysy; fasáda je schéma, nie fotka, lebo web neuvádza orientáciu).
- Filter „Všetky – 3 podlažia“, „Dvojizbové – 114 900 €, 44,20 m²“, „Trojizbové – 149 900 €, 68,67 m²“.
- „Vyberte si byt. Dvojizbový alebo trojizbový byt, všetky s loggiou a vlastným parkovacím miestom v cene.“ – prvý krok
  skrátenej cesty na úvode (typy bytov, loggia v zozname miestností, parkovanie v cene).
- „Vzorový interiér … vizualizácie nie sú priradené ku konkrétnemu bytu.“ – pôvodný web má sériu byt-a1 pri byte A1,
  ostatné interiéry bez priradenia.
- „Loggia a vlastné parkovacie miesto sú v cene bytu.“ – štandard + výhody.
- Pätka: „Ceny a dostupnosť bytov podľa stavu ponuky k 13. 10. 2026.“ – dátum stiahnutia zdroja.
- Názvy listov („List 1 – Titulný list“ … „List 7 – Kontakt“, „Príloha“) sú reč dizajnu (projektová dokumentácia),
  nie údaj o projekte.
- Pôdorysy: na webe sú výrezy z klientových pôdorysov (výkres bez pravého horného rohu, legenda, výrez bytu); pravý
  horný roh s cudzím označením projektu výrezy neobsahujú. Pred nasadením klient potvrdí, že pôdorysy možno zobraziť.
