# YouTube Shorts: fakty, pravidlá a zákony (overené 2026-10-17)

Každý údaj je z uvedenej stránky prečítanej 2026-10-17. Stránky pomocníka YouTube sa sťahovali priamo (curl),
nie cez súhrn; kópie ostali v scratchpade relácie (`shorts-nauka/youtube/zdroje/`, 29 MB, necommitujú sa). Kde sa
jazykové verzie tej istej stránky líšia, je to napísané. YouTube mení pravidlá často: pred väčšou zmenou postupu
over aktuálne znenie a dátum zapíš sem. Zákony sú citované podľa časovej verzie na slov-lex.sk; nie je to právne
poradenstvo.

Skratky zdrojov: `answer/N` = https://support.google.com/youtube/answer/N, `blog` = https://blog.youtube/…

## 1. Čo je Short: dĺžka a pomer strán

| Pravidlo | Znenie | Zdroj |
| --- | --- | --- |
| Najviac 3 minúty | „Select a short-video file: Up to 3 minutes. With a square or vertical aspect ratio.“ | answer/12779649 (Upload YouTube Shorts) |
| Od kedy | bežné kanály: videá nahraté po 15. 10. 2024 („after October 15, 2024“), štvorcové alebo zvislé, do 3 min sú Shorts; staršie ostávajú dlhé videá | answer/15424877 |
| Oficiálne kanály umelcov | to isté pre videá od 8. 12. 2025 | answer/15424877 |
| Ako sa vyhnúť zaradeniu medzi Shorts | „use a wider aspect ratio such as 16:9 for long-form videos“ | answer/15424877 |
| Hashtag #Shorts | oficiálne stránky ho ako podmienku neuvádzajú; o zaradení rozhoduje dĺžka a pomer strán | answer/12779649, answer/15424877 |

**Pre nás:** 1080×1920 (9:16), 30 až 45 s (recept v `../SKILL.md`); nad 60 s nikdy s cudzou hudbou (časť 4).

## 2. Súbor: rozlíšenie, kódek, bitová rýchlosť

Stránka „YouTube recommended upload encoding settings“, answer/1722171 (hlavička stránky hovorí o partneroch
so Studio Content Manager, odporúčania sú však všeobecné a odkazuje na ne aj pomocník k nahrávaniu):

| Časť | Odporúčanie |
| --- | --- |
| kontajner | MP4, **bez edit listov** („or the video might not get processed correctly“), moov na začiatku (Fast Start) |
| zvuk | AAC-LC alebo Opus (alebo Eclipsa Audio), stereo alebo stereo + 5.1, **48 kHz**; stereo **384 kb/s**, mono 128 kb/s, 5.1 512 kb/s |
| video | H.264, progresívne, **High Profile**, **2 B-snímky za sebou**, **uzavretý GOP s polovicou snímkovej frekvencie**, CABAC, premenlivá bitová rýchlosť (limit netreba), 4:2:0 |
| snímková frekvencia | taká, v akej sa natáčalo (24, 25, 30, 48, 50, 60 aj iné); prekladané video najprv odprekladať |
| bitová rýchlosť SDR | 1080p **8 Mb/s** pri 24 až 30 fps, 12 Mb/s pri 48 až 60 fps; 1440p 16/24; 2160p 35 až 45 / 53 až 68; 720p 5/7,5 |
| bitová rýchlosť HDR | 1080p 10/15 Mb/s; 480p a 360p HDR nepodporuje |
| farby SDR | BT.709 (prenosová charakteristika, primárne farby aj matica); neoznačené video YouTube berie ako BT.709 |

| Ďalšie | Znenie | Zdroj |
| --- | --- | --- |
| rozlíšenie Shorts | „You can upload Short videos with a maximum resolution of 1080p.“ (v postupe tvorby v aplikácii) | answer/10343433 |
| pomer strán | zvislé video prehrávač prispôsobí sám; „avoid adding padding or black bars directly to your video“ | answer/6375112 |

**Pre nás:** export v `../scripts/short.py` dodržiava všetko vyššie (overené kontrolou v skripte). Jediná
odchýlka je bitová rýchlosť nad 8 Mb/s (CRF 18, strop 16 Mb/s), čo YouTube dovoľuje.

## 3. Nahratie: počítač alebo telefón

| | Počítač (YouTube Studio) | Telefón (aplikácia YouTube) | Zdroj |
| --- | --- | --- | --- |
| postup | CREATE → Upload videos; naraz až 15 súborov, každý dokončiť cez EDIT DRAFT | Create → Short; nahrávanie po úsekoch, alebo výber z galérie | answer/12779649, answer/10343433 |
| názov | | najviac 100 znakov | answer/10343433 |
| miniatúra | **nedá sa upraviť zo Studia** | snímka zo shortu pred nahratím aj po ňom, dá sa pridať text a filter | answer/10343433 |
| hudba z knižnice Shorts | nie | áno, väčšina skladieb do 90 s v 3-min shorte, niektoré len 60 alebo 30 s | answer/10343433, answer/15424877 |
| „Get feedback“ | | rozbor úvodu (hook) a tempa pred uverejnením | answer/10343433 |
| publikum | | povinná voľba „made for kids“ áno/nie | answer/10343433 |
| súkromie | | od 18 rokov predvolene verejné, 13 až 17 súkromné | answer/10343433, answer/12779649 |
| „Edit with AI“ | | „up to 3 minutes in total assets with a minimum of 5 seconds“, nie vo všetkých krajinách; pre nás nie (generuje strih a efekty) | answer/10343433 |

**Pre nás:** hotový súbor z `../scripts/short.py` nahrá majiteľ v Studiu ako **súkromný** alebo s plánovaným
uverejnením, miniatúru (snímku) vyberie v aplikácii. Na telefóne ostávajú koncepty len v zariadení
(„drafts are saved to your device“, answer/10343433).

## 4. Hudba a autorské práva

| Pravidlo | Znenie | Zdroj |
| --- | --- | --- |
| short do 1 min | bez zmien obmedzení | answer/15424877 |
| short nad 1 min s nárokom Content ID, **staršie znenie** | „will be blocked globally on YouTube … not be eligible for monetization“ | answer/15424877?hl=en (stav 2026-10-17) |
| short nad 1 min s nárokom Content ID, **novšie znenie** | „Starting on 24 September 2026, new Shorts longer than one minute (but under three minutes) with an active Content ID claim will no longer be automatically blocked and may remain playable on YouTube.“ | answer/15424877?hl=en-GB; to isté „no longer be automatically blocked“ v answer/10343433 |
| monetizácia pri nároku | stránka o monetizácii stále píše, že shorty nad 1 min s nárokovaným obsahom sú blokované a nezarábajú | answer/12504220 |
| knižnica zvukov YouTube | „The royalty-free music won't receive a Content ID claim.“ | answer/15424877 |
| hudba z knižnice Shorts | väčšinu skladieb do 90 s, niektoré len 60 alebo 30 s | answer/15424877 |

Jazykové verzie si odporujú (americká stále „blocked globally“, britská a stránka o tvorbe „no longer
automatically blocked“ od 24. 9. 2026). **Pre nás sa nič nemení:** do shortu dávame len vlastnú hudbu
(napr. vlastnú syntézu, ako pri reeli GYM KLUB), hudbu z knižnice YouTube alebo licencovanú hudbu, prípadne len zvuk prevádzky.
Nárok Content ID aj tak znamená, že výnos alebo blokovanie určuje vlastník práv.

## 5. Titulky

| Údaj | Znenie | Zdroj |
| --- | --- | --- |
| automatické titulky v slovenčine | áno, pre dlhé videá aj Shorts („Automatic captions on long-form videos and Shorts … Slovak …“) | answer/6373554 |
| presnosť | „automatic captions might misrepresent the spoken content … always review“ | answer/6373554 |
| kedy nevzniknú | jazyk nepodporovaný, zlý zvuk, dlhé ticho na začiatku, viac hlasov naraz | answer/6373554 |
| vplyv na dosah | YouTube nič nezverejňuje | (žiadny oficiálny zdroj) |

**Pre nás:** titulky napálené do obrazu (prehrávanie bez zvuku, rovnaký vzhľad všade) a automatické
titulky YouTube v Studiu skontrolovať a opraviť. Súbor `titulky.srt` zo `short.py` sa dá nahrať ako
titulková stopa; pri napálených titulkoch by sa pri zapnutých CC zobrazili dvakrát, preto ho používame
len pri variante bez napálených titulkov. Netvrdíme, že titulky zvyšujú dosah.

## 6. Názov, popis, hashtagy

| Pravidlo | Znenie | Zdroj |
| --- | --- | --- |
| kde | hashtagy v názve alebo popise | answer/6390658 |
| pri názve | „up to three hashtags that are considered most engaging will appear by your video title“ (z popisu) | answer/6390658 |
| priveľa | „more than 60 hashtags, we'll ignore each hashtag on that content“; preťaženie môže video odstrániť z vyhľadávania | answer/6390658 |
| zavádzajúce | nesúvisiace hashtagy môžu viesť k odstráneniu videa | answer/6390658 |
| bežné značky | „adding ordinary descriptive tags or repetitive sentences in the description is (still) prohibited“ | answer/6390658 |
| dĺžka názvu | najviac 100 znakov | answer/10343433 |

**Pre nás:** názov = hook shortu po slovensky; popis 1 až 2 vety s faktami prevádzky, adresa a 2 až 3
hashtagy, ktoré naozaj sedia (#nitra, názov prevádzky, odbor). Bez opakovania kľúčových slov.

## 7. Odkazy a súvisiace video

| Údaj | Znenie | Zdroj |
| --- | --- | --- |
| súvisiace video | po nahratí: Studio → Content → short → Related Video z vlastného kanála → SAVE; divák vidí klikateľný odkaz pod menom kanála | answer/14075157 |
| podmienky | len s prístupom k pokročilým funkciám; video musí byť verejné alebo neverejné (unlisted) a v súlade so zásadami | answer/14075157 |
| pokročilé funkcie | overenie telefónom a dostatočná história kanála, alebo overenie dokladom či videom | answer/9891124 |
| odkazy v popise a komentároch shortov | od 31. 8. 2023 nie sú klikateľné (proti spamu) | TechCrunch a Tubefilter, 2023-08-10 (sekundárne, oficiálny text som nenašiel; stav over v aplikácii) |

**Pre nás:** rezervácia sa nedá prekliknúť zo shortu. Adresa webu patrí do obrazu na konci (krátka, čitateľná),
odkaz na rezerváciu do odkazov kanála a súvisiace video na dlhšie video prevádzky, ak nejaké bude.

## 8. Metriky

| Metrika | Znenie | Zdroj |
| --- | --- | --- |
| pozretie (view) od 24. 8. 2026 | „views across YouTube are counted from the first frame … Shorts, Long Form, Podcasts, Live“ | blog „What are 'Engaged' Views on YouTube?“, 2026-08-19 |
| zapojené pozretie (engaged view) | „clicking to watch or watching past the initial seconds“; v Studio aplikácii „stayed to watch past the initial seconds, not including any loops“ | ten istý blog; youtubecreatorstudio answer/12220281 |
| počet sekúnd | YouTube ho nezverejňuje („initial seconds“) | tie isté zdroje |
| Stayed to watch | „The percentage of times viewers stayed to watch past the initial seconds of a Short.“ (hl=en, overené znova 2026-10-17; iná verzia tej istej stránky: „…viewed your Shorts versus swiped away“) | youtubecreatorstudio answer/12220281 |
| analytika a odporúčanie | „the vast majority of analytics remain anchored on engaged views“; CTR, priemerná dĺžka pozretia a udržanie sa počítajú ako predtým; algoritmus sa nemení | blog 2026-08-19 |
| priemerná dĺžka pozretia | počíta sa z engaged views | answer/12220281 |
| história | od 31. 3. 2025 sa pozretia Shorts počítali od spustenia, staré číslo ostalo ako engaged views | MediaPost, TechCrunch (sekundárne) |

**Pre nás:** porovnávame len **engaged views** a **Stayed to watch** (koľko ľudí neodpotiahlo), nie celkové
pozretia, ktoré od 24. 8. 2026 rastú aj z jedného okienka. Pri každom shorte zapíšeme engaged views a
Stayed to watch po 48 hodinách a po 7 dňoch; čísla dodá majiteľ zo Studia, nič neodhadujeme.

## 9. Monetizácia

| Údaj | Znenie | Zdroj |
| --- | --- | --- |
| vstup do YPP | 1 000 odberateľov a 4 000 kvalifikovaných hodín za 12 mesiacov, alebo 1 000 odberateľov a 10 mil. kvalifikovaných pozretí Shorts za 90 dní | answer/72851 |
| kvalifikované pozretie Shorts | z verejných shortov a len engaged views, bez slučiek | blog „What are qualified watch hours and Shorts views…“, 2026-08-12 (Rene Ritchie) |
| podiel | z Creator Pool tvorca dostane 45 % bez ohľadu na hudbu; hudba znižuje Creator Pool (1 skladba polovica, 2 skladby tretina) | answer/12504220 |
| od 1. 2. 2027 | na mesačný podiel z reklám a Premium treba 10 mil. kvalifikovaných pozretí Shorts za 90 dní | answer/12504220 |
| nečinnosť | monetizácia sa môže vypnúť po 6 mesiacoch bez videa alebo príspevku | answer/72851 |

**Pre nás:** prevádzky v Nitre na monetizáciu nemierime; cieľ shortu je rezervácia.

## 10. AI obsah a pôvod záberov

| Údaj | Znenie | Zdroj |
| --- | --- | --- |
| povinné označenie | realistický obsah vytvorený alebo podstatne zmenený AI: skutočná osoba hovorí či robí, čo nerobila; zmenený záznam skutočnej udalosti alebo miesta; realistická scéna, ktorá sa nestala; hudba ako hlavná zložka videa | answer/14328491 |
| kde | YouTube Studio → Attributes → „AI use“ → Yes | answer/14328491 |
| štítok | pri fotorealistickom obsahu môže byť priamo v prehrávači, inak v rozšírenom popise; označenie samo neznižuje dosah ani zárobok | answer/14328491 |
| automatický štítok | YouTube ho môže dať sám: obsah z nástrojov YouTube GenAI, súbory s metadátami C2PA, obsah, ktorý jeho systémy rozpoznajú | answer/14328491 |
| netreba označiť | farby a svetlo, filtre, rozmazanie pozadia, titulky, doostrenie a zväčšenie, oprava zvuku, AI pri scenári, názve, miniatúre, klonovanie **vlastného** hlasu | answer/14328491 |
| sankcie | opakované neoznačenie: štítok od YouTube, odstránenie obsahu alebo vylúčenie z YPP | answer/14328491 |
| „Captured with a camera“ | štítok pre zábery z kamery s C2PA 2.1+ bez úprav zvuku a obrazu | answer/15446725 |

**Pre nás:** naše shorty zo skutočných záberov s tónovaním HDR, strihom a titulkami sú „minor edits“, AI use =
No. AI obraz alebo hlas len so súhlasom majiteľa a vtedy AI use = Yes (aj keď by pravidlo pripúšťalo výnimku).
„Captured with a camera“ nedostaneme, lebo strihom upravujeme obraz aj zvuk.

## 11. Firmy: reklama a spolupráce

| Údaj | Znenie | Zdroj |
| --- | --- | --- |
| čo je branded content | obsah ovplyvnený partnerom značky za protihodnotu (peniaze, produkty, sponzorstvo); platí aj pre Shorts | answer/17596007 (YouTube Branded Content Policies) |
| povinnosť | ak video obsahuje branded content, treba zaškrtnúť paid promotion; YouTube pridá štítok na začiatok videa | answer/17596007, answer/154235 |
| kde | Studio → Content → video → Show More → „My video contains paid promotion like a product placement, sponsorship, or endorsement“ | answer/17596007 |
| zakázané a obmedzené | napr. zbrane, drogy; alkohol, financie, zdravie a lieky len s obmedzeniami | answer/17596007 |
| slovenský zákon | zákon č. 108/2024 Z. z., príloha č. 1 (praktiky vždy nekalé), znenie účinné od 27. 9. 2026: bod 16 redakčný priestor na podporu produktu, za ktorý obchodník zaplatil, bez jasného označenia (skrytá reklama); bod 31 tvrdiť, že hodnotenia sú od skutočných zákazníkov, bez primeraných krokov na overenie; bod 32 falošné spotrebiteľské hodnotenia alebo ich skresľovanie na sociálnych médiách. § 10 klamlivé konanie. V znení od 1. 7. 2024 do 31. 12. 2025 to boli body 11, 26 a 27 | static.slov-lex.sk/static/SK/ZZ/2024/108/20260927.html (a 20240701.html) |

**Pre nás:** short prevádzky na jej vlastnom kanáli je jej vlastná reklama (zjavný obchodník), paid promotion
sa nezaškrtáva. Zaškrtnúť ho treba, keď short o prevádzke uverejní iný kanál za protihodnotu (napr. tréner,
influencer, náš vlastný kanál za odmenu) alebo keď v shorte prevádzky je cudzia značka za protihodnotu
(dodávateľ kozmetiky, suplementov). Recenzie a hodnotenia do shortu len skutočné a so zdrojom (body 31 a 32).

## 12. Ľudia, hlas a AI v zábere (zákony)

| Pravidlo | Znenie | Zdroj |
| --- | --- | --- |
| podobizeň a záznam človeka | „Písomnosti osobnej povahy, podobizne, obrazové snímky a obrazové a zvukové záznamy týkajúce sa fyzickej osoby alebo jej prejavov osobnej povahy sa smú vyhotoviť alebo použiť len s jej privolením.“ | Občiansky zákonník (40/1964 Zb.) § 12 ods. 1, znenie účinné od 31. 7. 2026, static.slov-lex.sk/static/SK/ZZ/1964/40/20260731.html |
| deepfake a syntetický obsah | kto použije umelo vytvorený alebo upravený obraz, zvuk alebo video (deepfake), musí to oznámiť; informácia jasná, najneskôr pri prvom vystavení | nariadenie (EÚ) 2024/1689 (AI Act), čl. 50 ods. 4 a 5, platí od 2. 8. 2026, artificialintelligenceact.eu/article/50 |
| rozhovor s AI | pri systéme na priamu interakciu treba ľudí informovať, že komunikujú s AI | AI Act čl. 50 ods. 1 (týka sa hlasových a chatových agentov, nie shortu samotného) |
| bezpečná zóna zvislého videa | obrázok „YouTube \| Vertical Video Ads“: 288 px hore, 672 px dole, 48 px vľavo, 192 px vpravo pri 1080×1920 | support.google.com/google-ads/answer/9128498 (stiahnuté 2026-10-17); pre organické Shorts YouTube čísla nezverejňuje |

**Pre nás:** privolenie každého rozpoznateľného človeka v zábere (zamestnanec, klient, aj hlas); deti so súhlasom
rodiča. AI obraz alebo hlas len so súhlasom a s označením na platforme aj v obraze; pri HEAD SPA 30 nie.

## 13. Čo ostáva neoverené

- Či sú odkazy v popise a komentároch shortov dnes neklikateľné (len sekundárne zdroje z 2023, over v aplikácii).
- Ako YouTube spracuje MP4 bez edit listu so zápornými posunmi CTS (overí prvé súkromné nahratie).
- Počet sekúnd, po ktorých sa pozretie ráta ako engaged view (YouTube píše len „initial seconds“).
- Či titulky v obraze zvyšujú dosah (YouTube nič nezverejňuje; netvrdíme to).
- Rozpor jazykových verzií answer/15424877 o Content ID pri shortoch nad 1 min (pozri časť 4).

## Zoznam zdrojov (prečítané 2026-10-17)

| Stránka | Adresa |
| --- | --- |
| Understand three-minute YouTube Shorts | support.google.com/youtube/answer/15424877 (hl=en, hl=en-GB) |
| Create YouTube Shorts | support.google.com/youtube/answer/10343433 |
| Upload YouTube Shorts | support.google.com/youtube/answer/12779649 |
| YouTube recommended upload encoding settings | support.google.com/youtube/answer/1722171 |
| Video resolution & aspect ratios | support.google.com/youtube/answer/6375112 |
| Add a related video to your YouTube Shorts | support.google.com/youtube/answer/14075157 |
| Get access to intermediate and advanced features | support.google.com/youtube/answer/9891124 |
| Use automatic captioning | support.google.com/youtube/answer/6373554 |
| Hashtags | support.google.com/youtube/answer/6390658 |
| Understand your content performance (Studio app) | support.google.com/youtubecreatorstudio/answer/12220281 |
| What are 'Engaged' Views on YouTube? (2026-08-19) | blog.youtube/inside-youtube/engaged-views-youtube-explained/ |
| What are qualified watch hours and Shorts views… (2026-08-12) | blog.youtube/news-and-events/youtube-monetization-qualified-watch-hours-shorts-views/ |
| YouTube Partner Program overview & eligibility | support.google.com/youtube/answer/72851 |
| YouTube Shorts monetization policies | support.google.com/youtube/answer/12504220 |
| Disclosing use of GenAI content | support.google.com/youtube/answer/14328491 |
| 'Captured with a camera' disclosure | support.google.com/youtube/answer/15446725 |
| Add branded content restrictions & disclosure labels | support.google.com/youtube/answer/154235 |
| YouTube Branded Content Policies | support.google.com/youtube/answer/17596007 |
| Zákon č. 108/2024 Z. z. o ochrane spotrebiteľa, príloha č. 1 | static.slov-lex.sk/static/SK/ZZ/2024/108/20260927.html (staršie znenie 20240701.html) |
| Občiansky zákonník § 12 | static.slov-lex.sk/static/SK/ZZ/1964/40/20260731.html |
| AI Act, článok 50 | artificialintelligenceact.eu/article/50/ |
| Google Ads, vertikálne video (bezpečná zóna) | support.google.com/google-ads/answer/9128498 |
| Odkazy v Shorts (sekundárne) | techcrunch.com/2023/08/10/youtube-is-disabling-links-on-shorts-to-cut-down-on-spam, tubefilter.com/2023/08/10/youtube-shorts-comments-spam/ |
