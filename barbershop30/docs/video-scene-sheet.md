# BARBERSHOP 30 — scénický list úvodného videa

Vyplnená šablóna `google-video-scene-sheet` z balíka Max Studio Ultra X 6.0.

Projekt: úvod na `/barbershop30/`
Verzia briefu: 1
Vybraný kód: **GV-19148** (Cinematic website hero / Cold open, reveal, proof, CTA / Tactile macro craft / Match-cut montage)
Verzia scenára: 1
Cieľová dĺžka a pomer: 7,0 s v 16:9 na počítači, 4,6 s v 9:16 na telefóne

| Scéna | Čas | Účel | Podklad | Záber a verzia | Text na obrazovke | Zvuk | Prechod | Stav |
|---|---|---|---|---|---|---|---|---|
| 1 | 0,0 až 4,0 s | studený štart, hmat a remeslo | záber A, machová stena | `shot-a`, v2, prvá snímka `moss-16x9`, cieľová `interier` | žiadny, hero text je v HTML | bez zvuku | rozostúpenie machu a prienik | hotové |
| 2 | 4,0 až 7,0 s | dôkaz remesla | záber B, nožnice cez hrebeň | `shot-b`, v1, prvá snímka `remeslo` | žiadny | bez zvuku | strihová spojka zo scény 1 | hotové, len 16:9 |
| 3 | od konca videa | výzva | hero rám stránky | statický plagát | nadpis a obe tlačidlá v HTML | bez zvuku | ustálenie | hotové |

Na telefóne beží iba scéna 1, machové rozostúpenie. Zvislý záber remesla bol vygenerovaný,
ale zamietnutý: deformované ucho, neprirodzené predlaktie a plastová koža, čo sú presne tie
vylúčenia, ktoré má brief napísané. Podľa pravidla balíka sa po prvom takom výsledku nemenil
viac než jeden parameter a produkcia sa zastavila namiesto míňania ďalších kreditov.
Vodorovná verzia toho istého záberu prešla, preto ostáva na počítači.

## Kniha nadväznosti

- Predmet: machová stena, jedny nožnice, jeden hrebeň, jedno kreslo so zrkadlom.
- Rekvizity a materiály: tmavá zelená, orech, mosadz, čierna pláštenka.
- Miesto, čas, svetlo: interiér, teplé žiarovkové svetlo spredu, chladnejší obrys zozadu.
- Smer pohybu: kamera ide stále dopredu, nikdy sa neotáča späť.
- Zakázané: text v obraze, vodoznak, ruky navyše, zdvojené nástroje, dotyk čepele s pokožkou,
  dym, iskry, trblietky, čierna posledná snímka.

## Ako je to zapojené na webe

- Video je dekoratívne, má `aria-hidden`, je stlmené, `playsinline` a nikdy nemá zvukovú stopu.
- Plagát nesie LCP. Video sa pripája až po ňom a nikdy neblokuje prvé vykreslenie.
- Tlačidlo Preskočiť úvod je použiteľné od prvej sekundy, rovnako celá navigácia.
- Pri obmedzenom pohybe, odmietnutom automatickom prehratí, pomalom pripojení, režime úspory dát
  alebo opakovanej návšteve v tej istej relácii sa video vôbec nenačíta a ostane plagát.
- Video sa pozastaví, keď nie je na obrazovke.
- Nadpis a obe tlačidlá sú v HTML, nikdy nie sú vypálené do obrazu.

## Záverečná kontrola

- [x] Každé tvrdenie sedí so zdrojom pravdy. Vo videu nie sú žiadne ceny, hodiny ani mená.
- [x] Generovaný obraz sa nevydáva za skutočný dôkaz. Galéria aj strihy sú označené ako ilustračné.
- [x] Práva: vo videu nie je žiadna skutočná osoba ani cudzí materiál.
- [x] Rozmery, dĺžka a prehrateľnosť overené priamo na súboroch.
- [x] Posledná snímka nie je čierna.
- [x] Nad každou snímkou je hero text čitateľný.
