# Ako napísať zadanie po vrstvách

Vo videu ref7 má každé zadanie tri časti: **referencia štýlu** (nahratý obrázok), **jedna veta, čo postaviť**
(lower third so štatistikami, vo farbách a značke klubu, hlavný údaj výška), a **požiadavky na hotovú vec**
(upraviteľné, vložené do konkrétnej kompozície). Karty so zadaniami k tomu pridávajú **zoznam podkladov**
a vetu o poriadku (vymeniteľná grafika, upraviteľný text, jasne pomenované vrstvy). U nás rovnako, len
referenciou štýlu je web značky a podklady sú skutočné zábery a overené fakty.

## Vzor z videa preložený na náš prípad

Vo videu (doslovne z obrazovky):

> Build me an editable motion graphics lower third that has this player's stats on it, as well as the same
> football team's colour scheme and branding. His main stat should be his height, at 5"2. make it editable,
> and add it into the composition "football example"

U nás (BARBERSHOP 30, ukážka v tomto skille):

> Sprav upraviteľný lower third pre BARBERSHOP 30 vo farbách a písmach webu (barbershop-30/assets/style.css,
> ART_DIRECTION.md). Hlavný text: Barbershop 30, jedna informácia: Mostná 30, Nitra (CONTENT_SOURCES.md,
> Identita a kontakt). Vrstvy Doska, Linka, Meno, Info, každá s nástupom, texty a farby v JSON. 9:16, 4 s,
> polož na záber barbershop-30/source/video/video-3.mp4 od 1 s. Výstup .mov a .webm s alfou do scratchpadu.

Rozdiely, ktoré sú zámerné:

- **Žiadne číslo bez zdroja.** Vo videu je hlavným údajom výška hráča. U nás môže byť údajom len to, čo je
  v zdroji faktov (adresa, otváracie hodiny, služba z cenníka v ten deň), nikdy počet zákazníkov, hodnotenie
  bez odkazu ani roky praxe barbera.
- **Referencia štýlu je web značky**, nie cudzí obrázok. Farby a písma idú zo style.css, nie z odhadu.
- **Podklady sú skutočné:** záber od majiteľa, žiadny vystrihnutý portrét z generátora, žiadna textúra loga
  vymyslená modelom (vektorové logo BARBERSHOP 30 zatiaľ nemáme, značka je sadzaná písmom).

## Šablóna zadania (vyplň a drž sa jej)

```
Podnik a značka:   BARBERSHOP 30 / HEAD SPA 30 / iný (zdroj faktov: ...)
Čo postaviť:       lower third | titulná karta | priebeh / odpočet | značka na konci | nová šablóna
Texty:             meno = "..."        zdroj: súbor, časť
                   info = "..."        zdroj: súbor, časť
Rozmer a dĺžka:    1080 x 1920, 30 snímok/s, 4 s (podľa záberu v scenári reelu)
Poloha:            vľavo dole v bezpečnej zóne / na strede
Vrstvy:            Doska (stierka zľava), Linka (rastie), Meno (hore), Info (hore), odchod pred koncom
Záber pod tým:     cesta k záberu od majiteľa, od koľkej sekundy; ľudia v zábere: súhlas áno/nie
Výstup:            .mov ProRes 4444 + .webm s alfou + náhľad; kam (mimo repozitára)
Podklady:          [ ] záber od majiteľa  [ ] fakty so zdrojom  [ ] súhlas ľudí v zábere
                   [ ] písmo značky so slovenskými znakmi  [ ] farby zo style.css
Nie:               žiary, sklo, čiastočky, poskakovanie, rozmazanie textu, zmienka o AI, vymyslené čísla
```

Z toho sú priamo parametre (`priklady/bs30-lower-third.json`):

```json
{
  "sablona": "lower-third", "znacka": "barbershop-30",
  "sirka": 1080, "vyska": 1920, "fps": 30, "dlzka": 4,
  "texty": { "meno": "Barbershop 30", "info": "Mostná 30, Nitra" },
  "nastavenia": { "zarovnanie": "vlavo", "zvisle": "dole" },
  "zdroje_faktov": { "meno": "CONTENT_SOURCES.md, Identita a kontakt", "info": "CONTENT_SOURCES.md, Identita a kontakt" }
}
```

## Keď treba novú šablónu

Opíš ju najprv ako tabuľku vrstiev (meno, in, out, nástup, odchod, čo robí, parameter), presne ako
v `vrstvy-sablon.md`. Až potom HTML podľa `kompozicia.md`. Každá vrstva má jednu úlohu a meno, ktoré povie,
čo to je (Doska, Meno, Výplň, Bod), nie „div 3“. Nový text v šablóne je vždy parameter, nikdy napísaný v HTML.

Príklady, ktoré sa dajú zadať rovnako: odpočet do otvorenia s časom zo zdroja (otváracie hodiny), priebeh
krokov služby z opisu v cenníku (`priklady/bs30-priebeh.json`), titulná karta s vetou z webu
(`priklady/hs30-titulna-karta.json`), značka na konci s výzvou z webu (`priklady/bs30-znacka.json`).
