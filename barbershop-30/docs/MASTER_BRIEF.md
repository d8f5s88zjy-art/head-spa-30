# BARBERSHOP 30 – hlavný brief: realistická 3D prehliadka priestoru

Záväzný dokument pre každého, kto na webe pracuje (stavba, integrácia, kontrola,
opravy). Dopĺňa TOUR_DIRECTION.md (poradie záberov) a ART_DIRECTION.md (paleta,
typografia, pohyb). Pri rozpore platí tento brief.

## 1. Zámer v jednej vete

Návštevník prejde scrollovaním našou prevádzkou tak, ako keby vošiel dverami z Mostnej
ulice: každá časť stránky mu odhalí ďalšiu skutočnú miestnosť, kamera sa v nej pohne
ako v reálnom priestore a text mu pri tom povie len to, čo potrebuje vedieť, aby si
rezervoval termín.

## 2. Čo znamená „realistická 3D prehliadka“

- Priestor je **skutočný**: iba fotografie prevádzky (profesionálne zábery z
  `source/web-povodny/gallery`, slider a fotky majiteľa) a videá barberov pri práci.
  Nič vymodelované, nič generované, nič cudzie. Farby fotiek sa nemenia (žiadne
  tónovanie, filtre, zrno); dovolená je len vinetácia na okrajoch a krátke stmavnutie
  pri prelínaní.
- **Hĺbka**: každý záber má hĺbkovú mapu; kamera robí pomalý nájazd a oblúk okolo bodu
  záujmu, popredie (pult, sud, kreslo) sa posúva voči stene. Pohyb je jemný – oblúk
  4 % šírky na desktope, 2,6 % na mobile; nikdy nie „Ken Burns“ zoom bez hĺbky.
- **Kontinuita**: zábery idú v poradí, v akom človek prevádzkou prejde (vstup →
  recepcia → hlavná sála → kreslo → pracovný stôl → zadná miestnosť → čakáreň → tím →
  služby → galéria → späť k dverám). Smer pohybu kamery nadväzuje: ak sa kamera
  v zábere pohybuje doprava, ďalší záber začína z ľavej strany bodu záujmu.
- **Prelínanie** medzi zábermi trvá presne po dĺžke pásu s textom medzi nimi; v jeho
  strede je na obrazovke doska s textom, takže strih nikdy nevidno „nahý“.
- **Pokoj**: scroll vždy funguje natívne, nič ho nezamyká ani nespomaľuje; v pokoji
  kamera dýcha (30 snímok/s) a po 25 s sa zastaví.

## 3. Detail, na ktorom sa nepoľaví (kontrolný zoznam)

Každý bod sa overuje screenshotom alebo meraním, nie odhadom.

**Obraz**
- [ ] Bod záujmu každého záberu (dvere, pult, kreslo, stôl, pumpa) je v zábere celý
      na desktope aj na mobile (390×844: presah 1,24, `f` drží).
- [ ] Okraje hĺbky bez viditeľného trhania (> 3 px) na hranách kresiel a lámp pri
      maximálnom oblúku; ak trhá, zmenší sa oblúk pre daný záber (`data-arc`).
- [ ] Žiadny záber nemá rozmazané alebo zväčšené pixely: šírka súboru ≥ šírka
      viewportu × DPR (do 2×); AVIF s návratom na WebP.
- [ ] Žiadne čierne/prázdne plochy pri načítavaní: pod filmom je vždy statická
      fotografia záberu (`.film-still`), film sa nad ňu len prelína.
- [ ] Video (barber pri práci) hrá len vo svojom okne, potichu, bez skoku pri štarte
      (poster = prvý snímok), bez prehrávania mimo obrazovky.

**Typografia a text**
- [ ] Fraunces 800 pre nadpisy, Manrope pre text; žiadne iné písma, žiadne faux‑bold.
- [ ] Text výlučne na doske (`.board`, rgba(14,13,12,.72)); kontrast ≥ 4,5:1 pre
      text, ≥ 3:1 pre veľké nadpisy, overené výpočtom nad najsvetlejším miestom fotky.
- [ ] Odsek najviac 62 znakov na riadok, nadpisy `text-wrap: balance`, žiadne
      osamotené slovo na poslednom riadku v H1/H2 (ručne skontrolovať pri 390 px).
- [ ] Slovenčina s diakritikou, tykanie, bez marketingových fráz, bez superlatívov
      bez dôkazu. Každý údaj len z CONTENT_SOURCES.md.
- [ ] Žiadna pravopisná chyba: každý odsek prečítaný nahlas; názvy služieb podľa
      rezervačného systému (oprava preklepov v zdroji je poznačená v CONTENT_SOURCES).

**Rozloženie**
- [ ] Rytmus: celoobrazovkový záber → pás s textom → záber; dve susedné sekcie nikdy
      nemajú rovnakú kostru.
- [ ] Lišta: priehľadná v úvode (s horným prechodom pre čitateľnosť), po 80 px
      scrollu s podkladom; na mobile menu cez celú obrazovku + spodné tlačidlo
      „Rezervovať termín“ (nezakrýva obsah, safe‑area).
- [ ] Linka kapitol (desktop vľavo) ukazuje, kde v prevádzke návštevník je; popis
      miesta vľavo dole („Prehliadka podniku · Recepcia“) len mimo dosiek.
- [ ] Cenník: tabulárne číslice, cena a trvanie zarovnané, „Objednať“ pri každej
      položke, mobil jeden stĺpec; 15 služieb, ceny na cent presne.
- [ ] Tím: 10 portrétov v rovnakom výreze (4:5, ohnisko 50 % 35 %), mená a roly
      presne; žiadne vymyslené špecializácie.
- [ ] Mobil 375/390/430 px: žiadne horizontálne pretekanie, dotykové ciele ≥ 44 px,
      text v dolnej polovici záberu.

**Pohyb**
- [ ] Jediný zdroj pravdy: scroll. Kamera, prelínania, dosky a lišta čítajú to isté
      číslo v jednom `requestAnimationFrame`; zápisy do DOM len pri zmene.
- [ ] Spätný scroll, skok cez menu (bez jazdy cez iné miestnosti), zmena rozmerov a
      obnovenie stránky uprostred – všetko bez skoku.
- [ ] `prefers-reduced-motion`, `saveData`, bez WebGL2, slabý telefón: pokojná verzia
      s tými istými fotkami, rovnaké rozloženie, nič neskočí.
- [ ] Žiadne blikanie, žiadne častice, žiadny kurzor s efektom, žiadne rozmazanie textu.

**Výkon (ciele, nie garancie – merať a zapísať)**
- [ ] Prvý čitateľný obraz ≤ 1,5 MB prenesených dát (bez filmu a videa); three.js a
      prvý záber až po pohybe návštevníka.
- [ ] LCP ≤ 2,5 s, CLS ≤ 0,1 (Slow 4G, 4× CPU, 390×844); INP ≤ 200 ms.
- [ ] Jeden aktívny záber v pamäti navyše k susedom (max 4), uvoľňovanie textúr.

**Dôvera a pravda**
- [ ] Rezervácia vedie na https://www.barbershop30.sk/rezervacia; žiadne fiktívne
      termíny ani potvrdenia.
- [ ] Hodnotenie na Google len ako odkaz, bez čísla hviezdičiek; žiadne vymyslené recenzie.
- [ ] Na webe nie je zmienka o 3D modeli, AI ani o nástrojoch; len „prehliadka podniku“.
- [ ] Súhlasy: portréty a videá zamestnancov potvrdiť u majiteľa pred ostrým spustením.

## 4. Postup práce (aby to neprišlo s chybami)

1. **Stavba** podľa TOUR_DIRECTION: film (hĺbka) a stránka oddelene, so záväzným
   rozhraním (`.film-shot[data-shot][data-f][data-mv]` + `.film-still` + `.board`).
2. **Integrácia**: spojiť, screenshoty všetkých 9 scén na desktope aj mobile, pri
   prelínaní aj v polovici; každý screenshot otvoriť a posúdiť; min. 3 kolá opráv.
3. **Štyri nezávislé kontroly** (prístupnosť a odolnosť, pravdivosť a SEO, výkon,
   kreatívny posudok proti pôvodnému webu) – každá s dôkazmi.
4. **Opravy** všetkých nálezov blocker/high/medium, overené rovnakým meraním.
5. **Záznam**: CHECKS.md (čo, ako, výsledok, čísla), COMPARISON.md (pôvodný vs nový),
   INTEGRATION_LOG.md, screenshoty úvodu, stredu a záveru (desktop + mobil).
6. **Nasadenie** až po bode 5; po nasadení kontrola naživo (curl na všetky hlavné
   súbory, screenshot z verejnej adresy).

## 5. Čo je hotové, keď

- Úvod je silná kompozícia aj bez filmu; H1 a tlačidlá čitateľné do 1 s.
- Scroll zmysluplne mení priestor – návštevník vie, v ktorej miestnosti je.
- Všetky body z časti 3 sú odškrtnuté s dôkazom.
- Web naživo zodpovedá screenshotom v `docs/screenshots/`.
