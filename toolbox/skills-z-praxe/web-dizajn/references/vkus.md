# Vkus z referencií bez kopírovania

Video hovorí o skille „taste“: aby sa návrh inšpiroval skvelými webmi namiesto obvyklého generického dizajnu.
Tu je náš postup, ako na to: vkus je **výber**, nie výzdoba. Z mnohých možností vyberieš tú, ktorá sedí
k podniku, a zvyšok vynecháš. Repozitár „taste-skill“ z videa sme neotvárali; nič z neho tu nie je. Cesty
k súborom sú vzhľadom na priečinok skillu (`web-dizajn/`), cesty k webom vzhľadom na koreň repozitára.

## Tri zásady

1. **Pravidlá projektu majú prednosť pred každým vkusom.** Pred prvou referenciou si vypíš, čo je pevné:
   HEAD SPA 30 (`CLAUDE.md`, Technika): Lora a Manrope, tóny orecha so zlatou, zlatá len ako detail, rádius 2 px,
   vlasové linky, žiadne žiary, prechody farieb, efekty pod kurzorom, čiastočky ani poskakovanie, obsah sa pri
   skrole nevysúva, film len zo skutočných fotiek. BARBERSHOP 30 (`docs/ART_DIRECTION.md`, `docs/MASTER_BRIEF.md`):
   Fraunces a Manrope, jediný akcent oranžová lámp, žiadne častice, nič vymodelované, fotky bez tónovania.
   Referencia, ktorá ide proti tomu, sa nepoužije, aj keď je krásna.
2. **Prvá referencia je skutočná prevádzka.** Fotky priestoru, logo, materiály, svetlo. Z nich vznikla
   identita oboch webov: HEAD SPA 30 má farby odpísané z orecha, parkiet a svitu LED pásu (komentár v prvom
   `:root` v `assets/style.css`, README Identita z prevádzky), BARBERSHOP 30 paletu a rukopis zo 45 fotiek
   prevádzky (`ART_DIRECTION.md` časť 1: „retro-industriálne remeslo s humorom“).
3. **Z cudzích webov len princípy.** Nikdy obsah, texty, logá, obrázky, ikony ani kód.

## Kde hľadať referencie

Galérie inšpirácie (všeobecne známe zdroje, zoznam aj v `toolbox/ZDROJE.md`):

| Galéria | Adresa |
| --- | --- |
| Awwwards | https://www.awwwards.com |
| Godly | https://godly.website |
| SiteInspire | https://www.siteinspire.com |
| Land-book | https://land-book.com |
| minimal.gallery | https://minimal.gallery |

Ďalej weby podnikov z príbuzného odboru v iných mestách (spa, hotel, reštaurácia, barbershop, štúdio).
Hľadaj podľa nálady a odboru („hotel“, „spa“, „editorial“, „typography“), nie podľa „premium landing page“,
lebo tá vedie presne k priemeru. Ber **3 až 5** referencií; dvadsať sa zleje do priemeru.

Ku každej zapíš adresu, dátum pozretia a jednou vetou, prečo. Snímku si urob sám (Playwright, oblasť 22),
aby sa dala zmerať.

## Rozbor podľa design-dna

Skill `../../skills-animacie/design-dna/` delí dizajn na tri dimenzie: systém (merateľné tokeny), štýl
(nálada, kompozícia) a efekty. Na rozbor referencie stačí jeho fáza 2 (Analyze) a týchto päť otázok:

| Dimenzia | Čo zistiť | Ako |
| --- | --- | --- |
| Paleta | pozadie, text, akcent a ich pomer plôch | `design-dna/scripts/measure-colors.mjs` na snímke; hodnoty nie odhadom |
| Typografia | koľko rodín, patkové alebo nie, pomer nadpisu k textu, kurzíva, verzálky | zmerať veľkosti v prehliadači (`getComputedStyle`) alebo na snímke |
| Rozostupy | hustota, odstup častí pri 1440 px, šírka textu | snímka a nástroj na meranie, nie dojem |
| Kompozícia | mriežka, zarovnanie, striedanie obrazu a textu, čo je dominanta | drôtový model referencie v ASCII |
| Pohyb | čo sa hýbe, kedy, ako dlho, čo by u nás neprešlo | nahrávka alebo snímky po 0,25 s |

Zápis jednej referencie:

```
Referencia: <názov>, <adresa>, pozreté <dátum>
Prečo: <jedna veta>
Paleta: <hodnoty z merania, pomer plôch>
Typografia: <rodiny, pomer veľkostí, riadkovanie>
Rozostupy: <odstup častí, šírka textu>
Kompozícia: <mriežka, dominanta, rytmus>
Pohyb: <čo, kedy, ako dlho>
Berieme (princíp): <jedna až dve vety>
Neberieme: <čo z nej nechceme a prečo>
V rozpore s pravidlami projektu: <čo by porušilo CLAUDE.md alebo ART_DIRECTION>
```

Po stavbe porovnaj výsledok s nameranou paletou: `design-dna/scripts/verify.mjs` vráti odchýlku ΔE pre každú
farbu s výsledkom PASS alebo FAIL (`design-dna/SKILL.md`, fáza 3, krok 9).

## Čo prevziať a čo nie

| Prevziať (princíp) | Neprevziať (obsah) |
| --- | --- |
| pomer veľkosti nadpisu k textu | texty, nadpisy, slogany |
| koľko priestoru dostane jedna myšlienka | logá, značky, mená |
| striedanie veľkého obrazu a pokojného textu | fotky, ilustrácie, ikony, videá |
| jeden akcent a kde sa smie objaviť | presnú skladbu celej stránky |
| druh prechodu a jeho tempo | kód, CSS, animácie skopírované z cudzieho webu |
| spôsob, ako sa ukáže cena alebo ponuka | písma bez licencie pre náš web |

Test blízkosti: polož náš návrh vedľa referencie. Ak by niekto poznal, z ktorého webu je, je príliš blízko.

## Znaky generického dizajnu

Zoznam typických predvolieb je v `../../skills/frontend-design/SKILL.md` (časť Process: krémové pozadie
s terakotovým akcentom, takmer čierne pozadie s jedným kyslým akcentom, novinová mriežka s vlasovými linkami,
súprava rovnakých zaoblených kariet s rovnakým tieňom, štítok verzálkami nad každým nadpisom a ďalšie). Nie sú
zakázané, sú to predvoľby: ak ich zvolil majiteľ (HEAD SPA 30 má vlasové linky, rádius 2 px a štítky verzálkami
podľa `CLAUDE.md`), platia; ak ich nikto nezvolil, nemíňaj na ne slobodu návrhu.

Z našej praxe navyše:

- **Vrstva V9 na HEAD SPA 30** (README, Vrstva V9): číslovanie sekcií 01 až 11 bez skutočného sledu, linka
  priebehu skrolu, svetlo pod kurzorom, odlesk na kartách, magnetické tlačidlá. Majiteľ ju vypol, „jej efekty
  pôsobili lacno“ (`CLAUDE.md`). Prémiový dojem robí priestor, písmo a zdržanlivosť.
- **Štatistiky v úvode, ikonky a čísla na kartách, vzor listov, naklonený lístok** (README, Luxusná vrstva):
  odstránené pri prechode na pokojný jazyk.
- **Žiary, čiastočky, prechody farieb, poskakovanie, efekty pod kurzorom**: zakázané v `CLAUDE.md` a v
  `ART_DIRECTION.md` časť 8.
- **Fotobanka a vymodelovaný priestor** namiesto skutočnej prevádzky.
- **Prázdne prídavné mená** („moderný“, „prémiový“, „jedinečný“) namiesto faktu zo zdroja.
- **Vzor zadania z videa** („jemné modré prechody, plynulé animácie“) je presne predvolený vzhľad; na našich
  weboch by porušil pravidlá. Preto zadanie (`zadanie.md`) začína pravidlami projektu, nie vzhľadom.

Kontrola plánu (podľa `frontend-design`): predstav si podobné zadanie pre iný podnik. Ak by si dospel
k rovnakému návrhu, nie je to vkus pre tento podnik; zmeň tú časť a napíš prečo.

## Postup (krok 2 v SKILL.md)

1. Vypíš pevné pravidlá projektu (zásada 1).
2. Prevádzka: 3 až 5 fotiek priestoru, `measure-colors.mjs` na každej, zapíš paletu z prevádzky.
3. 3 až 5 cudzích referencií, každú rozober a zapíš podľa vzoru vyššie.
4. Spoločné princípy do dvoch až štyroch viet; čo je v rozpore s pravidlami, vyškrtni.
5. Plán dizajnového systému (SKILL.md, krok 3) a kontrola proti znakom generického dizajnu.
6. Rozhodnutia zapíš do dokumentu projektu (README, `ART_DIRECTION.md`, `CHECKS.md`), inak sa o mesiac nebude
   vedieť, prečo je web taký, aký je (`../referencie-z-videi/references/naucene-z-videi.md`, Spoločné lekcie).

## Ako to dopadlo u nás

- **HEAD SPA 30.** Princíp z luxusného spa a hotelového filmu, obsah vlastný: „Rytmus ako v hotelovom filme:
  veľký záber cez celú obrazovku, potom pokojný plný pás s veľkým písmom“ (Luxusná kompozícia v `assets/style.css`)
  a cenník „ako menu v dobrej reštaurácii“ (Luxusná vrstva). Zábery sú skutočné fotky salónu, dvere v úvode sú
  skutočné dvere salónu.
- **BARBERSHOP 30.** Princíp z referenčného videa s filmovým úvodom (kamera pomaly letí, veľký nadpis), obsah
  vlastný: „s našimi dverami a našou miestnosťou“ (`MASTER_BRIEF.md` časť 2b); titulné karty priamo na zábere
  podľa rozhodnutia majiteľa 2026-10-10 (časť 3).
