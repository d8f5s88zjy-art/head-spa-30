# Strihy medzi zábermi

Zdroj: `barbershop-30/assets/film.js` (časti „strihy“ riadky 165 až 214, `CK` a post shader 795 až 927,
`place()` 989 až 1046, `draw()` 1066 až 1161). Pôvodná verzia bez strihov: `assets/world.js`.

## Pravidlá, ktoré platia pre všetky strihy

- Všetko sú strihy **pohybom kamery**, jeden vkus a jedna farebnosť: fotky sa netónujú, nikde záblesk,
  zrno ani farebný efekt. Pri `mix` 0 a 1 je obraz presne pôvodný a ostrý.
- Strih je **funkcia polohy v prechode** (skrol, v prológu čas), nie času. Ide preto rovnako plynulo
  dopredu aj dozadu a dá sa zastaviť (`BS30_FILM.cutFreeze`).
- Strih platí len medzi **susednými** zábermi v ceste. Po skoku cez menu alebo pri čakaní na fotku
  je vždy obyčajné `prelinanie`.
- Okno prechodu: `span = clamp(0,55 × výška okna / medzera kotiev, 0,16, 0,3)` cesty medzi kotvami,
  okolo stredu (pri titulnej karte okolo miesta, kde sa mení text). Priebeh `smoothstep`, v pokoji
  (0,6 s) sa dokončí na bližší záber.
- Pri strihu sa oba zábery kreslia do textúr `rtA`, `rtB` (mipmapy, zrkadlový okraj, takže rozmazanie
  nikdy neukáže tvrdú hranu) a skladajú v jednom post shaderi. Mimo strihu ide jeden záber rovno na
  obrazovku s vinetáciou v tom istom prechode (jeden prechod namiesto dvoch).
- Hĺbka sa pri prechode „otvorí“: `uAmt` odchádzajúceho záberu `AMT + amp × mix`, prichádzajúceho
  `AMT + amp − amp × mix`; `amp` 0,1, pri `popredie` `CK.amp` (telefón 0,12, počítač 0,16).
- V strede strihu krátke šero `dip` a užšia vinetácia (`vs = 0,34 + CK.vs × sin(π·mix)`); `dip` sa podľa
  druhu zmenšuje (pohyb × 0,5, švih × 0,4, nájazd × 0,5, popredie × 0,2).

## Zápis

Atribút `data-cut` na kotve **prichádzajúceho** záberu, inak tabuľka `CUTS` podľa dvojice `odkiaľ>kam`
(mená z `data-shot`, nie výrezov):

```
druh [smer] [a:x,y] [b:x,y] [m:druh] [m:smer] [ma:x,y] [mb:x,y]
```

- `smer`: kam ide kamera. `right` [1, 0], `left` [−1, 0], `rise` aj `up` [0, 1], `down` [0, −1], `in` [0, 0] (krok dopredu).
- `a:` bod na odchádzajúcej fotke, `b:` na prichádzajúcej (0 až 1 zľava a zhora).
- `m…` platí len pre telefón (výrez na výšku má predmety inde); údaje telefónu prepíšu spoločné bez
  ohľadu na poradie v zápise.
- **Strih odzadu** (`rev`): `odjazd` a `popredie` s bodom `b:` (predmet patrí prichádzajúcemu záberu).
  Shader ho kreslí ako opačný strih: zábery vymenené, čas naspäť, smer opačný.
- `popredie` potrebuje hĺbkovú mapu záberu, ktorému predmet patrí. Záber bez nej (video) dostane
  automaticky `pohyb` s tým istým smerom.

## Druhy

| Druh | `uKind` | Čo vidno | Kamera (`place()`) |
| --- | --- | --- | --- |
| `prelinanie` | 0 | každý bod sa prelína vo vlastnom čase podľa bližšej z dvoch hĺbok: ďaleký koniec miestností prvý, blízke veci posledné (`smoothstep(o·0,55, o·0,55 + 0,45, mix)`, `o` = vyššia z dvoch hodnôt hĺbkovej mapy, teda bližší bod) | odchádzajúca zrýchli dopredu (`mix^1,6 × 0,25` vzdialenosti), prichádzajúca dobieha zozadu (`(1−mix)^1,3 × 0,1`, video 0,04) |
| `pohyb` | 1 | pokračovanie pohybu: nová miestnosť prichádza zo strany, kam kamera ide (pri `in` zo stredu), vzdialené body skôr; oba zábery ľahko rozmazané pohybom (`mbx`, `mby`, pri `in` zoomom `mz`) | bokom `lat[1]` šírky so zrýchlením `x²` von a brzdením `(1−x)²` dnu, natočenie navyše `yaw[1]` a malý krok dopredu (`x^1,6 × 0,06`, dobeh `(1−x)^1,3 × 0,04`); pri `in` krok dopredu `walk × x²` a dobeh `walkB × (1−x)²` |
| `svih` | 2 | švih: obraz ide v smere švihu, rýchlosť `sin³`, rozmazanie podľa rýchlosti; výmena záberov len v najväčšom rozmazaní (`smoothstep(0,45, 0,55, mix)`), mimo nej jeden záber s dvojnásobkom vzoriek | ako pohyb, `lat[2]`, `yaw[2]` 0,6 |
| `najazd` | 3 | kamera vletí k bodu `a:`, starý záber sa zväčšuje (`1 + za·x²`) s rozmazaním zoomom okolo bodu (bod ostáva ostrý), nový sa rozvinie z toho istého miesta a dobehne k bodu `b:` | odchádzajúca letí dopredu (`nz × x^1,6` vzdialenosti) a k bodu `a:` (váha 0,85); prichádzajúca začína o `0,12 × (1−x)^1,3` vzdialenosti vzadu, posunutá k bodu `b:` (váha 0,6), a dobehne na svoje miesto |
| `odjazd` | 3 (rev) | nájazd pustený odzadu: kamera vycúva a starý záber sa stiahne do bodu `b:` (dvere) | odchádzajúca cúva (`0,12 × x^1,3`); prichádzajúca začína tesne pri bode `b:` (`nz`, váha 0,85) a vzďaľuje sa od neho |
| `popredie` | 4 | kamera ide tesne popri blízkom predmete z hĺbkovej mapy; predmet (hrana `a:`) sa naťahuje k objektívu, neostrý (`pf`) a v tieni (`pd`), oblý (`bow`), za ním je už nová miestnosť; s `b:` predmet prichádzajúceho záberu prejde a usadí sa | bokom `lat[4]`, `yaw[4]` |

Bočný posun pri strihu nikdy neodhalí okraj fotky: ohraničí sa podľa presahu a s rezervou na
paralaxu hĺbky (`uAmt × 0,6`). Body strihu (`a:`, `b:`) sa premietnu kamerou, ktorou sa práve
kreslilo (`screenOf(ptOf(...))`), takže shader dostane ich skutočnú polohu na obrazovke.

## Parametre `CK` (telefón / počítač)

Rozmery v podieloch obrazu. Telefón má menej vzoriek a slabšie efekty.

| Kľúč | Význam | Telefón | Počítač |
| --- | --- | --- | --- |
| `dip` | šero v strede strihu | 0,1 | 0,18 |
| `vs` | zúženie vinetácie v strede | 0,1 | 0,16 |
| `mbx`, `mby` | rozmazanie pohybom vodorovne, zvislo | 0,07, 0,035 | 0,05, 0,06 |
| `mz` | rozmazanie zoomom pri kroku dopredu | 0,08 | 0,08 |
| `nt` | vzorky rozmazania na jeden záber; počas strihu spolu 2 × `nt` na pixel (pri výmene `nt` z každého záberu, mimo nej 2 × `nt` z jedného) | 6 | 8 |
| `sx`, `sy` | posun obrazu pri švihu | 0,24, 0,12 | 0,16, 0,2 |
| `bx`, `by` | rozmazanie švihu | 0,24, 0,12 | 0,11, 0,15 |
| `za` | zväčšenie pri nájazde | 0,3 | 0,35 |
| `kz` | dĺžka stopy zoomu | 0,13 | 0,15 |
| `pe` | presah predmetu popredia za okraj | 0,3 | 0,25 |
| `pw` | šírka neostrej hrany predmetu | 0,085 | 0,05 |
| `pd` | tieň predmetu | 0,35 | 0,35 |
| `pf` | neostrosť predmetu (úroveň mipmapy) | 3,5 | 4,0 |
| `bow` | vypuklosť hrany predmetu | 0,1 | 0,08 |
| `lat` | bočný posun kamery podľa druhu `[0, pohyb, švih, 0, popredie]` | 0, 0,07, 0,07, 0, 0,08 | 0, 0,1, 0,08, 0, 0,1 |
| `yaw` | natočenie navyše v smere posunu | 0, 0,3, 0,6, 0, 0,3 | rovnako |
| `nz` | nájazd kamery pri `najazd` | 0,34 | 0,4 |
| `walk`, `walkB` | krok dopredu von, dobeh dnu | 0,2, 0,1 | 0,24, 0,12 |
| `amp` | otvorenie hĺbky pri `popredie` | 0,12 | 0,16 |

Cena strihu v post shaderi: na telefóne 12, na počítači 16 vzoriek textúry na pixel počas strihu,
mimo strihu 1 (`barbershop-30/docs/CHECKS.md`, časť 10); navyše sa počas každého prechodu kreslia oba zábery
do cieľov `rtA`, `rtB` s mipmapami. Úroveň mipmapy sa volí podľa rozostupu vzoriek, takže aj veľké
rozmazanie je hladké z mála vzoriek.

## Tabuľka strihov BARBERSHOP 30

```js
const CUTS = {
  'vstup>rohozka': 'najazd a:0.76,0.53 ma:0.50,0.53',                         // prológ: cez dvere dnu (von je to isté odzadu)
  'rohozka>sala': 'pohyb in',                                                // krok z rohožky dopredu do sály (telefón: do videa Poď ďalej)
  'sala>stol': 'popredie left a:0.27,0.55 m:prelinanie',                     // za operadlom kresla k pracovnému miestu; telefón: obe videá
                                                                             // sú jeden súvislý záber (0 až 5 s a 5 až 9,3 s), stačí prelínanie
  'stol>cakaren': 'svih right',                                              // od kresla švihom dozadu do čakárne
  'cakaren>sala-rano': 'popredie right b:0.30,0.62 m:rise mb:0.5,0.78',       // popri operadle do rannej sály
  'sala-rano>kreslo-stred': 'najazd a:0.635,0.56 b:0.5,0.45 ma:0.52,0.45',    // do kresla v sále, z neho na kreslo uprostred
  'kreslo-stred>kava': 'svih down',                                          // švih nadol na stolík s kávou
  'kava>sud': 'popredie left b:0.88,0.45 mb:0.78,0.4',                        // popri stĺpe do prednej sály
  'sud>vstup': 'odjazd b:0.76,0.53 mb:0.50,0.53',                            // von cez dvere na Mostnú
};
```

(Prevzaté z `film.js`; v komentári pri `sala>stol` je rozsah času v zdroji zapísaný pomlčkou, tu slovom „až“.)

## Ako vybrať strih (podľa použitia v BARBERSHOP 30)

- Cez dvere dnu a von: `najazd` cez bod dverí (`vstup>rohozka`), späť `odjazd` do toho istého bodu (`sud>vstup`).
- Krok ďalej do priestoru pred kamerou: `pohyb in` (`rohozka>sala`).
- Do inej miestnosti alebo iným smerom pohľadu: `svih` (`stol>cakaren` dozadu do čakárne, `kreslo-stred>kava` nadol na stolík).
- Popri blízkom predmete (operadlo kresla, stĺp): `popredie` s bodom hrany predmetu (`sala>stol`, `kava>sud`);
  v `BS30_FILM.dbg(1)` alebo `dbg(2)` over, že predmet je v hĺbkovej mape svetlý.
- Z kresla na kreslo: `najazd` s `a:` na prvom a `b:` na druhom (`sala-rano>kreslo-stred`).
- Telefón má iný výrez: body zadaj zvlášť (`ma:`, `mb:`), alebo iný druh (`m:prelinanie`, keď obe strany
  strihu tvoria súvislé video).

Výber v BARBERSHOP 30: traja strihači (kamera, svetlo, tvar) navrhli strihy pre každý prechod, zvolený
bol slovník strihača „kamera“ (najbližšie k pohybu kamery v referenčnom videu), `CHECKS.md` časť 10.
Postup s viacerými agentmi popisuje skill `workflowy`.

## Kontrola

- `node barbershop-30/source/tools/strih-shot.mjs [--only=desktop|mobile] [--cuts=pro,rohozka] [--mixes=0,0.5,1]`:
  snímky zastavených strihov a prehľad `strihy-<zariadenie>.jpg`, chyby konzoly do `konzola.txt`.
- `node barbershop-30/source/tools/prechod-shot.mjs`: prechod zastavený na 0 / 0,25 / 0,5 / 0,75 / 1.
- Ručne: `BS30_FILM.cuts` (zoznam strihov v ceste), `BS30_FILM.cutFreeze('sala', 0.5)`, `BS30_FILM.dbg(1)`.
- Softvérové kreslenie v headless prehliadači ide asi 7 snímok za sekundu: strih zachytený pri krátkom
  čakaní je ešte v pohybe, zastavený strih sa dokreslí do 4 s.

## Pôvodná verzia (HEAD SPA 30, `assets/world.js`)

Jediný prechod cez krátke šero bez dvojexpozície:

```glsl
c = c * (1.0 - smoothstep(0.0, 0.6, uMix)) + texture2D(tB, vUv).rgb * smoothstep(0.4, 1.0, uMix);
```

Kamera odchádzajúceho záberu pokračuje dopredu (`push^1,4 × 0,2` vzdialenosti), prichádzajúca prichádza
zo vzdialenosti (`0,07`), prechod je v strede medzi kotvami (`smoothstep(0,35, 0,65)`). Na jednoduchý web
s pár zábermi stačí.
