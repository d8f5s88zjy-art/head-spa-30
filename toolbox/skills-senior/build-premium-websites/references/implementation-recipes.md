# 051 — Implementačné recepty pohybu

## Obsah

1. Rozhodovací strom
2. Native základ
3. GSAP a scroll
4. Motion, Rive, Lottie
5. Priložené príklady

## 1. Rozhodovací strom

Jednoduchá zmena vizuálneho stavu → CSS transition. Zrušiteľná sekvencia prvku → WAAPI. Elementárny scroll efekt → podporované CSS scroll timelines s fallbackom. Riadené viacvrstvové scény/pinning → GSAP ScrollTrigger. React layout/gestá → Motion. Vizuálna state machine → Rive. Exportovaná vektorová animácia → Lottie po kontrole podporovaných vlastností. Skutočný priestor/model → Three.js/R3F. Zachovaj existujúci stack, ak úlohu zvláda.

Každý projekt môže mať viac médií, ale každá animovaná vlastnosť má jedného vlastníka. Nepridávaj viacero knižníc na ten istý jednoduchý fade. Runtime, licencie, build a kompatibilitu over pred inštaláciou. Katalóg nepreukazuje dostupnosť pluginu ani predplatné.

## 2. Native základ

Východiskový HTML obsah je viditeľný a použiteľný. Až úspešne inicializovaný efekt môže pridať dekoráciu. CSS `@supports` a media query obmedzia efekt na podporované prostredie; fallback nemá nechať prvok neviditeľný. `animation-timeline` nastav po prípadnej animation shorthand, ktorá môže resetovať súvisiace hodnoty. S007.

WAAPI poskytuje ovládanie animácií vrátane zrušenia; pri cancel môže promise `finished` odmietnuť. Obslúž očakávané zrušenie bez neobslúženého rejection. Zrušenie dekorácie nesmie zrušiť už potvrdenú biznis operáciu. S008.

View Transition API používaj ako progresívne vylepšenie. Zachovaj update presne raz, ošetri odmietnuté `ready` a oddeľ chybu callbacku od preskočenia efektu. V ukážke `createViewSwitcher` je update synchrónny vizuálny DOM commit; nesmie obsahovať sieťové side effects. Router a React potrebujú vlastné oficiálne integračné pravidlá. S006.

Ak navigácia najprv pripravuje dáta, maj samostatný request/epoch identifikátor a AbortController. Nový zámer zruší staré načítanie a výsledok sa prijme iba pri zhode aktuálneho requestu. Zhodu over znovu v synchrónnom DOM callbacku, lebo medzi načítaním a commitom môže prísť ďalšia navigácia. Titel, fokus a scroll nastav v príslušnom router commite, nie po čakaní na koniec animácie, keď už môže byť aktuálna iná trasa. `popstate` nemá vytvoriť ďalší history entry. Konkrétnu stratégiu fokusu a obnovy scrollu nech vlastní router a neprepisuj ju druhou paralelnou logikou.

## 3. GSAP a scroll

Scope selektory na komponentu. `gsap.matchMedia()` umožňuje vytvoriť a pri zmene podmienok revertovať vlastné animácie/ScrollTriggers. Vlastné listenery a observery však uprac sám. Handler udalosti vytvorený neskôr musí byť tiež zahrnutý do príslušného lifecycle. S002.

Nastav čitateľný DOM základ a vytvor dekoratívny timeline iba pri no-preference. Pinuj len primerane vysokú kompozíciu; na mobile alebo pri veľkom zoome radšej normálny tok. `scrub` je prepojenie progresu, nie záruka FPS. Pri numeric scrub synchronizuj ostatné vizuály so skutočným animovaným progresom. S001.

Priložený `mountScrollScene` očakáva dependency injection, nemení globálnu konfiguráciu tickeru a vracia cleanup. Nepridáva router ani framework; dĺžku a rozsah urč podľa obsahu. V produkcii napoj refresh na stabilizáciu fontov/médií a relevantné layout zmeny.

Lenis je voliteľný. Jeho oficiálny príklad prepája scroll update a GSAP ticker a prevádza sekundy na milisekundy. Ak ho použiješ, nesmie ho zároveň poháňať druhý RAF. Globálne `lagSmoothing` nastavenie môže ovplyvniť ostatné animácie; neupravuj ho bez vlastníctva app-level konfigurácie. Odregistruj callbacky a znič vlastnú inštanciu. Over anchors, focus, history a nested scroll. S009.

## 4. Motion, Rive, Lottie

Motion layout a `layoutId` riešia zmenu geometrie a zdieľané prvky; stabilné kľúče a správny layout stav sú zásadné. `useReducedMotion` umožňuje reagovať na preference. Skontroluj správanie vlastných opacity/farieb a médií tiež; jedna voľba knižnice nevyrieši všetku prístupnosť. S004–S005.

Rive sa hodí pre riadené animované UI alebo ilustráciu so stavmi. Dohodni vstupy, udalosti, artboard, layout a vlastníctvo. Canvas nenahrádza semantiku formulára. Pri unmount zavolaj vhodný cleanup a zastav offscreen prácu. S018.

Lottie sa hodí pre podporovaný export vektorového pohybu. Over renderovací backend, podporované vlastnosti exportu, fonty, externé assety a veľkosť dát. Zastav/destroy pri ukončení; synchronizuj stav s UI. Neoznačuj každý After Effects efekt za exportovateľný. S019.

## 5. Priložené príklady

`motion-core.mjs` obsahuje čistý výpočet rozsahov, damping a kamerových kľúčov. Testy overujú hranice, neprípustné vstupy, časovú nezávislosť a opakovateľnosť pri spätnom posune. `native-motion.mjs` ukazuje cancel bezpečné animácie, presun layoutu a synchronný same-document switcher. `gsap-scroll.mjs` je adapter; overenie s test double nepotvrdzuje skutočný výkon GSAP v prehliadači.

`assets/motion-lab/index.html` demonštruje fade, masku, presun, zdieľanú reprezentáciu a scroll transform bez externých médií. Je to technický tréning, nie hotová stránka pre podnik. Aktuálny rozsah vykonaných kontrol uvádza `assets/evidence/motion-evidence.md`.

Po prenose receptu do projektu over komponentový lifecycle, súbežné vstupy, preference, router a skutočné zariadenia. Kódové príklady majú jasne definovaný obmedzený rozsah; nie sú univerzálnou certifikovanou implementáciou.

Pri FLIP nesmieš viewport rozdiel z `getBoundingClientRect()` považovať za lokálny pixelový rozdiel pod scale/rotation/zoom predkom. Priložený jednoduchý helper pri takom layoute alebo vnorených vybraných cieľoch vynechá animáciu. Pre zložitejšiu geometriu použi vhodnú matrix-aware implementáciu a over ju. Štvrtý argument helpera je injekcia geometrickej kontroly pre testy/špecializovanú integráciu; v produkcii ho nenastavuj slepo na `()=>true`.

Odliš same-document `popstate` od návratu dokumentu cez BFCache. Pri `pagehide` s `persisted=true` môže dokument neskôr pokračovať s rovnakými listeners; bez podmieneného lifecycle by obnovená stránka mala odpojené ovládanie. Ukážka zachováva obsluhu pri tomto návrate a po `pageshow` aktualizuje scroll kompozíciu. Skutočný router/test browsera over samostatne.

## Senior decision gate

- **Decision:** Use a scoped mechanism compatible with the current stack.
- **Deliverable:** An integrated effect with lifecycle and fallback.
- **Verification:** Distinguish utility test results from browser rendering evidence.
