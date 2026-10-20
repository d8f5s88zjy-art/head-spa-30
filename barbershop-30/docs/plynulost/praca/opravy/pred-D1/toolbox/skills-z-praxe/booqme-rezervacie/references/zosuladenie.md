# Zosúladenie webu s Booqme: všetky miesta

Platí pre HEAD SPA 30 (`index.html` v koreni repozitára); na inom webe si zoznam urob rovnakým
`grep` a ulož ho k projektu.

## Kde je cena, dĺžka a názov jednej služby

| Miesto | Príklad (Head Spa Relax) | Mení admin? |
| --- | --- | --- |
| karta: atribúty | `<article data-min="60" data-price="67" ... id="relaxacny-head-spa">` | áno |
| karta: zobrazenie | `<div class="meta"><span>60 min</span><strong>67 €</strong></div>` | áno |
| karta: názov | `<h3>Head Spa Relax</h3>` a `data-name="HEAD SPA RELAX"` | áno |
| karta: texty | `p.tag`, `p.desc`, odseky „O rituále“, kroky `<ol>` | áno |
| pás ukážok poukážok | `<span class="vch-t"><b>názov</b><span>90 min</span>` (len rituály s ukážkou) | áno (názov, dĺžka) |
| JSON-LD ponuka | `"name":"Head Spa Relax"`, `"duration":"PT60M"`, `"price":"67"`, `"url":"...#relaxacny-head-spa"` | áno |
| preklady | kľúče s názvom a textami karty v `assets/i18n/*.json` | áno |
| podklad služieb | riadok v `docs/booqme-sluzby.csv` | nie |
| podklad poukazov | riadok `Poukaz: Head Spa Relax` v `docs/booqme-poukazy.csv` | nie |
| obrázok poukážky | `docs/poukazky/sablona/ritualy.json` (`cena`, `min`), `booqme/NN-*.jpg`, `assets/img/poukaz/*` | nie, `ceny.py` |

## Kde je počet a rozpätie (mení sa, keď sa zmení najlacnejšia, najdrahšia, najkratšia alebo najdlhšia služba alebo ich počet)

| Miesto | Text dnes |
| --- | --- |
| `<meta name="description">` | „Sedemnásť rituálov od 40 do 120 minút, ceny 45 až 135 €“ |
| `og:description`, `twitter:description` | „Sedemnásť rituálov v centre Nitry...“ |
| hlavička cenníka | „17 rituálov. Jedna adresa.“, „Sedemnásť rituálov v piatich kategóriách.“ |
| úvod | tlačidlo „17 rituálov a ceny“ |
| Ako to prebieha | „17 rituálov, od 40 minút po dve hodiny“ |
| poukazy | „Poukaz na ktorýkoľvek zo 17 rituálov kúpiš online.“, „Poukážky na všetkých 17 rituálov...“ |
| otázky (text aj `FAQPage`) | „Od 40 do 120 minút a od 45 do 135 €. Pri rituáloch pre dvoch je cena za oboch.“ |
| JSON-LD | `"priceRange":"45 € až 135 €"` |
| preklady | rovnaké vety v šiestich jazykoch |
| `CLAUDE.md`, README | počty rituálov a kategórií |

Admin prepočíta len tri vzory rozpätí: „od X do Y minút, ceny A až B €“, „Od X do Y minút a od A do B €“
a „od X minút po dve hodiny“ (tu len najkratšiu dĺžku), v HTML aj v prekladoch, a `priceRange`. Počíta
z kariet rituálov, nie z `li[data-booqme]`. Počet slovom („Sedemnásť“) a číslom („17“) mení človek.
Ak najdlhšia služba už nemá 120 minút, admin na to upozorní; text „po dve hodiny“ treba upraviť ručne.

## Príkazy na vyhľadanie

Pevná medzera je v `index.html` raz ako znak U+00A0, raz ako `&nbsp;`; obyčajný `grep '67 €'` ju nenájde.
Preto `grep -P` v UTF-8:

```
# všetky výskyty ceny alebo dĺžky, ktorá sa mení (príklad 67 €)
LC_ALL=C.UTF-8 grep -nP '67(\x{a0}| |&nbsp;)€|data-price="67"|"price":"67"' index.html
# rozpätia a počty
LC_ALL=C.UTF-8 grep -nP -o '.{0,40}(Sedemnásť|17(\x{a0}| |&nbsp;)rituál|45(\x{a0}| )až|až(\x{a0}| )135|do(\x{a0}| )135).{0,30}' index.html
LC_ALL=C.UTF-8 grep -nP '135|Sedemnásť|17(\x{a0}| )' assets/i18n/*.json
# všetky odkazy do Booqme (pri zmene adresy prevádzky)
grep -rn 'booqme.app' --include=*.html --include=*.js --include=*.mjs --include=*.md . | grep -v '\.min\.'
```

## Texty, ktoré zhŕňajú obsah služieb

Pri zmene **obsahu** (nie len ceny) prečítaj aj vety, ktoré hovoria o všetkých službách naraz.
Keď salón v Booqme odobral záverečné vysušenie, museli sa zmeniť (commit 4770ed3):

- krok 05 v časti Ako to prebieha: z „Záver a vysušenie“ na „Záver“ s textom „Ošetrenie vlasov,
  pri vybraných rituáloch aj vysušenie. Fúkanú alebo žehlenie si môžeš objednať zvlášť.“;
- odpoveď „Mám si pred rituálom umyť vlasy?“: vymenované rituály, pri ktorých vysušenie ostalo;
- karty rituálov pre dvoch: veta „Cena platí za dve osoby.“ (aj v podklade).

## Obrázky poukážok, keď sa zmení cena

Z koreňa repozitára (`docs/poukazky/sablona/README.md`, „Keď sa zmenia ceny“):

```
python3 docs/poukazky/sablona/ceny.py      # ceny z index.html do ritualy.json
node docs/poukazky/sablona/vyrob.mjs       # vykreslí poukážky (Playwright a Chromium)
python3 docs/poukazky/sablona/export.py    # booqme/*.jpg a ukážky na web assets/img/poukaz/<rituál>-*.{avif,webp,jpg}
```

`ceny.py` skončí s chybou, keď sa zmenil názov (riadkovanie názvu v `ritualy.json` treba upraviť ručne)
alebo keď rituál z cenníka zmizol, a vypíše rituály na webe bez poukážky. Poukážky so `"salon": true`
sú hotové od salónu a cenu nemajú; pri zmene dĺžky alebo názvu treba od salónu novú. Hotové obrázky
z `docs/poukazky/sablona/booqme/` nahrá majiteľ k poukazom v obchode Booqme (Poukazy, upraviť, fotka).

## Poradie práce, ktoré sa osvedčilo

1. Kontrola proti Booqme (zoznam nezhôd je zadanie).
2. Podklad CSV (jediný zdroj pre ďalšie kroky a pre budúcu kontrolu).
3. Karty a ponuky (admin alebo ručne), potom rozpätia a počty, potom vety, ktoré zhŕňajú obsah.
4. Preklady (kľúč je slovenský text, takže každá zmenená veta je nový kľúč vo všetkých šiestich súboroch).
5. Obrázky poukážok.
6. Všetky kontroly znova, potom build, commit, nasadenie a pohľad naživo.
