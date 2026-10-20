# 090 — Inžinierstvo a odovzdanie

## Obsah

1. Architektúra podľa úlohy
2. Komponenty a dáta
3. Integrácie a bezpečnosť
4. SEO, meranie a obsah
5. Kontroly, release a údržba

## 1. Architektúra podľa úlohy

Rozlišuj marketingový web, obsahový portál, obchod, konfigurátor a transakčnú aplikáciu. Použi existujúci framework, build a hosting, ak sú vhodné. Nový stack odôvodni konkrétnym obmedzením. Jednoduchý lokálny web nepotrebuje architektúru enterprise platformy.

Pre content web rozhodni renderovanie a CMS podľa editorov, aktualizácií, SEO a cache. Pre aplikáciu najprv urč doménový model, hranice server/client, oprávnenia, transakcie a zodpovednosť za dáta. Dekoratívna scéna nemá riadiť obchodnú logiku.

Pred zmenou prečítaj AGENTS.md, lockfile, package scripts, stav branch a rozpracované úpravy. Zachovaj cudzie zmeny. Nové dependency prever podľa oficiálnej dokumentácie a licencie. Reprodukovateľný build má väčšiu hodnotu než neprenositeľný screenshot.

## 2. Komponenty a dáta

Oddeľ obsah, tokeny, komponenty, doménový stav a efekty. Komponentu pomenuj podľa zodpovednosti; neukladaj do jednej hero komponenty formulár, auth, shader aj analytiku. Neabstrahuj každé dva riadky — vyčleň opakovanú alebo zložito riadenú zodpovednosť.

Kontrakty obsahujú vstupy, výstupy, chybové stavy, vlastníctvo resources a cleanup. Typy overia statický kód; externé dáta potrebujú runtime validáciu. Stav rozlišuje idle/loading/success/empty/error, nie len boolean `done`.

CMS schéma má mať validáciu, náhľad, publikovanie, oprávnenia a dokumentovanú editáciu. Nenúť editora zadávať surové CSS alebo časovať animáciu pre každý príspevok. Názov služby, cena a rezervačný odkaz patria do jedného autoritatívneho zdroja podľa dohodnutej integrácie.

## 3. Integrácie a bezpečnosť

Skutočný formulár potrebuje serverové spracovanie, validáciu, ochranu pred zneužitím podľa rizika, dostupné chyby a potvrdenie až po úspechu. Klientské `alert('Odoslané')` nie je funkčný lead flow. Externú komunikáciu alebo testy nad reálnymi zákazníkmi vykonávaj iba v autorizovanom rozsahu.

Pre rezervácie a nákup rieš stav dostupnosti, súbeh, retry a idempotenciu. Kritické ceny a oprávnenia overuje server. Payment webhook sa overuje podľa konkrétneho poskytovateľa; animácia "úspech" nesmie predbiehať potvrdenie systému. Používaj testovacie prostredie, keď je to primerané a dostupné.

Tajomstvá nepatria do frontendu ani klientských environment premenných. Kontroluj autorizáciu každého chráneného serverového prístupu, bezpečné spracovanie používateľského obsahu, session a logovanie bez citlivých hodnôt. OWASP ASVS je zdroj pre primerané overovacie požiadavky, nie automatický certifikát po prečítaní checklistu. S029.

Pre vyššie riziko urč threat model, zálohy, obnovu, audit a vlastníka incidentov. Právne/odvetvové požiadavky posúď pre konkrétny projekt z aktuálnych oficiálnych zdrojov; tento skill nedáva právnu certifikáciu.

## 4. SEO, meranie a obsah

Zmysluplná informačná architektúra, indexovateľný obsah, skutočné odkazy a opisné titulky pomáhajú porozumeniu stránky. Over stavové kódy, canonical, sitemap podľa potreby, jazykové verzie a redirect mapu pri migrácii. Štruktúrované dáta musia opisovať reálny viditeľný obsah. Nesľubuj pozície vo vyhľadávači. S028.

Zadefinuj merateľnú akciu: napríklad prechod do rezervácie, úspešná rezervácia potvrdená dostupnou integráciou alebo odoslaný dopyt. Kliknutie nie je automaticky predaj. Zapisuj analytické eventy jednotne, bez duplikácií a zbytočných osobných údajov. Súhlas a právny základ rieš podľa reálneho použitia a jurisdikcie.

Experiment potrebuje hypotézu, primárnu metriku, ochranné metriky, plán vyhodnotenia a dostatok dát. Nedávaj vymyslené percento zvýšenia konverzie ku každému efektu. Pre malú lokálnu návštevnosť môže byť užitočnejší rozhovor a kontrola používateľskej cesty.

## 5. Kontroly, release a údržba

Použi skutočné projektové build/type/lint príkazy a cielené behavior testy. Test má zachytiť dôležitú chybu: dvojité odoslanie, nesprávne oprávnenie, nedostupnú rezerváciu, únik listenerov alebo rozbitú históriu. Nepridávaj testy, ktoré iba kopírujú implementáciu drobného reverzibilného štýlu.

Pred release odovzdaj diff, preview, výsledky kontrol a otvorené riziká. Pri autorizovanom publikovaní over cieľové prostredie, migrácie, cache, monitoring a rollback. Nemaž obsah ani neobchádzaj schválenia kvôli rýchlejšiemu launchu; využívaj už udelené oprávnenie.

Developer handoff: repozitár a lockfile, lokálny štart, environment premenné bez tajomstiev, tokeny, komponenty, CMS model, asset credits, API zmluvy, motion specs, testy, známe obmedzenia, release/rollback postup, zodpovednosť za údržbu. Rozdeľ vlastné zdroje od externých služieb a opakovaných nákladov.

## Senior decision gate

- **Decision:** Separate presentation, domain authority and operating responsibility.
- **Deliverable:** Editable sources, contracts and reproducible delivery.
- **Verification:** Verify actual commands, integrations and the receiving maintainer's needs.
