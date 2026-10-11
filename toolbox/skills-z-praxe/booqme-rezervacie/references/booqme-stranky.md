# Stránky Booqme a čo sa robí v jeho administrácii

## Verejné adresy (overené 2026-10-11 na `salon-30-head-spa`)

| Účel | Adresa | Stav |
| --- | --- | --- |
| profil (krátka) | `https://booqme.app/<adresa>` | 301 na kalendár v slovenčine |
| kalendár sk | `https://booqme.app/sk/rezervacia/<adresa>` | 200 |
| kalendár cs | `https://booqme.app/cs/rezervace/<adresa>` | 200 |
| kalendár hu | `https://booqme.app/hu/foglalas/<adresa>` | 200 |
| kalendár en, de, pl, uk | `https://booqme.app/<jazyk>/reservation/<adresa>` | 200 |
| obchod s poukazmi | `https://booqme.app/<jazyk>/eshop/<adresa>` | 200 (sk, en overené) |

Titulok stránky kalendára nesie názov prevádzky z Booqme (dnes „Salon 30 - Head Spa“), takže sa podľa
neho dá overiť, či majiteľ názov už zmenil.

## Čo z verejnej stránky prečíta kontrola

Kalendár (jedna služba, skrátené):

```html
data-service_name="Head Spa Relax" data-price-pointer="Cena" data-price-raw="67.00"
data-price="67.00&nbsp;&euro;" data-discount="0" ... data-group-size-from="1" data-group-size-to="1"
```

Dĺžku kontrola berie ako prvé `<číslo> min` do 3000 znakov za službou. Obchod (jeden poukaz, skrátené):

```html
<img src=".../gift_cards/.../....png" ... alt="Poukaz: Head Spa Classic" ...>
<h3 ...>Poukaz: Head Spa Classic</h3>
<span class="text-muted me-1">Cena:</span><span class="fw-medium">50.00&nbsp;&euro;</span>
<p>Darčekový poukaz na rituál Head Spa Classic, 40 minút. ...</p>
```

Toto je vnútorná stavba stránky Booqme, nie zmluva; keď ju Booqme zmení, kontrola prestane nachádzať
služby (hlási 0) a regulárne výrazy v `tools/booqme-kontrola.mjs` treba prispôsobiť podľa novej stránky.

## Administrácia Booqme (robí majiteľ, web sa nemení)

Podľa `README.md` a `docs/booqme-opravy.md`:

| Kde v Booqme | Čo |
| --- | --- |
| služby | názov, kategória, trvanie, cena, popis; web sa riadi týmito hodnotami |
| Poukážky, Typy poukážok | jeden typ na službu: `Poukaz: <názov služby>`, cena služby, druh Predplatený kredit, platnosť 365 dní, popis, obrázok (1600 × 1200, 4 : 3, aby obchod ukázal celú poukážku) |
| Nastavenia, Stripe Connect | prepojenie platby kartou; bez neho platba v obchode nefunguje |
| profil prevádzky | názov, logo, adresa profilu, kategória poukážok, hodnotenie |

Úlohy pre majiteľa sa píšu do `docs/booqme-opravy.md` tak, aby ich mohol skopírovať: aktuálny stav,
nový text v bloku kódu, kde ho vložiť. Ukážka z bodu 6 (popis poukazu):

```
Poukaz na Head Spa Classic, 40 minút. Prvé zoznámenie s Head Spa. Platí 365 dní od kúpy.
```

## Popis služby v Booqme

Jednotný tvar pre všetky služby (`docs/booqme-opravy.md`, bod 5): jedna veta, potom `Obsah rituálu:`
a kroky oddelené ` · `, presne ako stĺpce `Popis do Booqme` a `Obsah rituálu` v `docs/booqme-sluzby.csv`.

## Právna stránka

`pravne.html` uvádza, že rezervácie a nákup poukazov bežia cez Booqme s vlastnými obchodnými podmienkami,
a Booqme je medzi príjemcami údajov. Pri napojení iného webu na Booqme to treba doplniť tiež.
