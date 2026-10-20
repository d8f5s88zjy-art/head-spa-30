# Šablóna: príspevok (Post Writer, Hook Extractor)

## Stavba popisu

1. **Úvodná veta (hook):** jeden riadok. Jasný sľub, obraz miesta alebo otázka.
2. **Telo:** jedna až dve krátke vety, každá s overeným faktom.
3. **Výzva:** ako si rezervovať (odkaz na rezerváciu alebo telefón zo zdroja).
4. **Hashtagy:** len tie, ktoré majiteľ schváli; nič nesľubujú.

## Vzorce úvodnej vety (z vlastných overených textov webu)

| Vzorec | Príklad | Zdroj |
| --- | --- | --- |
| sľub v dvoch slovách | „Vypni hlavu.“ | `index.html` (HEAD SPA 30) |
| obraz miesta | „Vzadu ťa čaká káva.“ | `barbershop-30/index.html` |
| otázka na rozhodnutie | „Kedy si sadneš?“ / „Komu zveríš hlavu?“ | `barbershop-30/index.html` |
| premena (pred a po) | „Vstúpiš s hlavou plnou chaosu. Odídeš s čistou hlavou.“ | `index.html` |
| oprava predstavy | „Nie umytie vlasov. Rituál pre hlavu.“ | `index.html` |
| vlastníctvo | „Tvoj strih. Tvoje miesto.“ | `barbershop-30/index.html` |

Hook Extractor: z cudzích úvodných viet (titulky, popisy, snímky, ktoré dodá majiteľ) vypíš
vzorec, nie znenie, a naplň ho faktom podniku. Video nategold.ai ukazuje príklad „I started with
zero experience. Here's what I learned…“ (vzorec: začiatočník a čo sa naučil); pre salón sa hodí
len vtedy, keď za ním stojí skutočný príbeh od majiteľa.

## Výstup

```
Podnik: <Barbershop 30 | HEAD SPA 30 | …>
Režim: Post Writer
Materiál: <čo je na fotke alebo videe, ktoré poslal majiteľ>

Variant A
<úvodná veta>
<telo>
<výzva>

Variant B
…

Zdroje: <veta → súbor, časť>
Treba potvrdiť: <neoverené alebo „nič“>
```

## Príklady (len overené fakty)

Barbershop 30, fotka čakárne:

```
Vzadu ťa čaká káva.
Kreslá, retro pumpa a farebný buldog. Káva aj minerálka sú zdarma.
Termín si rezervuj online 24/7: barbershop30.sk/rezervacia
```

Zdroje: `barbershop-30/index.html` (karta Čakáreň), `CONTENT_SOURCES.md` (kapacita, kde sa podáva káva, rezervácia).

HEAD SPA 30, fotka zelených dverí:

```
Za týmito dverami.
Zelené dvere so zlatými kruhmi, za nimi teplo, voda a ticho.
Termín si vyberieš online kedykoľvek, odkaz je v profile.
```

Zdroje: `index.html` (galéria, Ako si rezervujem termín?). „Odkaz je v profile“ len ak tam naozaj je (pozri `sablona-bio.md`).
