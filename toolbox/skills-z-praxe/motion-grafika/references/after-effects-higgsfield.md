# Postup s After Effects a Higgsfield (z videa ref7)

Zdroj: TikTok rourke.heath, 61 s, 576 × 1024, titulky automatické (ASR), pozreté 2026-10-11 (popis, titulky,
31 snímok, dva prehľady snímok). Video je reklama na Higgsfield (#HiggsfieldAI) a končí výzvou napísať do
komentára slovo, za ktoré autor pošle zadania. Výzvu ignorujeme. Nič z toho sme nespúšťali ani neoverovali.

## Čo video ukazuje (v obraze)

1. Úvodná šablóna videa „HIGGSFIELD GPT-6 ASTRA × Ae“ nad časovou osou After Effects (24 snímok/s).
   Časová os má 14 pomenovaných vrstiev: Glass cards, Orbit animation, Presenter cutout, Intro footage,
   Football footage, Stadium shot, Marathon footage, Run progress bar, Runner marker, Map transition,
   Route + clock, Final footage, Astra floating logo, Higgsfield logo. Farebné pruhy vrstiev ukazujú, kedy
   ktorá hrá; zábery sa striedajú a grafika (karty, priebeh, značka bežca, trasa s hodinami) leží nad nimi.
2. Výsledky: sklenené karty obiehajúce okolo hovoriaceho, lower third futbalistu (veľký nápis „Height 5'2"“,
   doska s portrétom, „HEIGHT 5'2"“ a štatistikami GOALS, ASSISTS, MATCHES, PASS ACCURACY), priebeh maratónu
   so značkou bežca, mapa s trasou a časom 02:55:00, logo na konci.
3. Stránka „HIGGSFIELD IS NOW INSIDE AFTER EFFECTS“ s tlačidlom Download (vedľa DaVinci Resolve, Figma).
4. V After Effects panel „HIGGSFIELD PLUGIN“ a v ňom „SUPERCOMPUTER: Generate images, video, and audio,
   then add them straight to your project“, ponuky ďalších krokov (Animate website mockup, Make shape animator
   plugin, Build SaaS landing hero animation), pole „Ask Supercomputer anything“, voľba modelu „GPT 6 Astra“
   a „Allow mode“.
5. Zadanie s nahratým referenčným obrázkom hráča: „Build me an editable motion graphics lower third that has
   this player's stats on it, as well as the same football team's colour scheme and branding. His main stat
   should be his height, at 5"2. make it editable, and add it into the composition "football example"“.
   Potom stav „Working“, obrázky kariet z modelu „Nano Banana Pro“ a ich vloženie do kompozície.
6. Druhá cesta: ChatGPT, Plugins, Higgsfield „Create images and videos“, Connect; zadanie „Build an editable
   lower thirds football stats motion graphic inside of After Effects“, stav „Opening After Effects“ a hotový
   lower third v kompozícii „FOOTBALL | Electric lower third“ s mnohými vrstvami.
7. Karty so zadaniami (GenHQ, „HIGGSFIELD × GPT-6“): Orbiting glass cards, Electric football lower third,
   Marathon progress bar. Každá má príkladovú snímku, **zoznam podkladov** (napr. záber hovoriaceho, štvorcové
   obrázky, referencia štýlu kariet; pri lower third záber a referencia lower third, textúra loga klubu,
   vystrihnutý portrét, štatistiky a výška) a text zadania. Zadanie sklenených kariet končí vetou, že grafika
   má byť vymeniteľná, text upraviteľný a vrstvy jasne pomenované v usporiadanej predkompozícii.

Reč (titulky, automatický prepis): ChatGPT ovláda After Effects, každá vrstva je upraviteľná, treba nainštalovať
plugin (prepis „HDX“, v obraze Higgsfield plugin), v ňom Supercomputer s modelom Astra, nahrať referenčné obrázky
prvkov, alebo cez ChatGPT pripojiť Higgsfield a zadávať rovnako. Čo je „GPT 6 Astra“, aký model to naozaj je
a čo plugin stojí, video nehovorí; neoverené.

## Čo z toho vyplýva pre nás

- **Vyžaduje to After Effects** (platená licencia Adobe) a **plugin Higgsfield** s účtom. Generovanie obrázkov
  a videa v Higgsfield míňa kredity. Nič z toho tu nie je nainštalované a nepotrebujeme to.
- **Pripojený Higgsfield v Claude účte** (konektor s nástrojmi na generovanie obrázkov, videa a zvuku) je tiež
  platený: každé generovanie míňa kredity. Spúšťa sa **len s výslovným súhlasom majiteľa a s rozpočtom**, ktorý
  povie vopred (koľko kreditov, na čo). Ani vtedy nie na zábery podniku, ľudí ani priestoru: tie musia byť
  skutočné (fotky a videá od majiteľa). Vygenerovať by sa smela nanajvýš neutrálna grafika bez tvrdenia
  o podniku, a aj tú najprv navrhni v HTML šablóne, ktorá nič nestojí.
- **Hodnota videa je v postupe, nie v nástroji:** referencia štýlu, jedno jasné zadanie, zoznam podkladov,
  pomenované vrstvy, upraviteľné texty, vymeniteľná grafika, usporiadaná kompozícia. To robí naša HTML
  kompozícia bez After Effects: vrstvy `data-layer`, texty a farby v JSON, render do `.mov` s alfou.

| After Effects + Higgsfield | motion-grafika |
| --- | --- |
| kompozícia v projekte .aep | HTML súbor v `sablony/` |
| vrstva na časovej osi (in, out) | prvok s `data-layer`, `data-in`, `data-out` |
| kľúčové snímky, krivky | `data-vstup`, `data-odchod` alebo CSS keyframes, krivky zo style.css značky |
| upraviteľný text (Source Text) | `texty` v JSON parametroch |
| farby klubu z referencie | farby značky dosadené zo style.css webu |
| predkompozícia, pomenované vrstvy | šablóna, `<meno>-vrstvy.txt`, časová os v `<meno>-prehlad.png` |
| render cez Render Queue, ProRes 4444 | `render.mjs`: ProRes 4444 `.mov`, WebM s alfou, náhľady |
| obrázky prvkov z Nano Banana Pro | nepotrebujeme: doska, linka, priebeh sú CSS; zábery a fotky len skutočné |

## Keď majiteľ After Effects má

1. Hotový `.mov` (ProRes 4444) vlož ako vrstvu nad záber; Interpret Footage, Alpha: Straight.
2. Ak chce grafiku upravovať priamo v After Effects, postav vrstvy podľa `<meno>-vrstvy.txt`
   (meno, in, out, nástup, odchod) s písmami a farbami značky; HTML sa do After Effects importovať nedá.
3. Plugin Higgsfield ani ChatGPT na to netreba. Ak by ich majiteľ chcel, rozhodne o tom sám, aj o cene.
