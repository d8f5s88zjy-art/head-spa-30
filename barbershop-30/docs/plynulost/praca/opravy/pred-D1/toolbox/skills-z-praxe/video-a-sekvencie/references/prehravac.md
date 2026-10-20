# Prehrávač: sekvencia, slučka a režim scroll v `film.js`

Zdroj: `barbershop-30/assets/film.js` (hlavička riadky 27 až 37, `videoOf` 238 až 245, `FRAG_SEQ` 354 až 356,
materiály 405 až 413, video 540 až 630, sekvencia 632 až 728, `shotT` 729, `drive` 730 až 752, `draw` 1077 až 1079,
gesto 1359 až 1369, `state` 1483 až 1493) a `barbershop-30/assets/app.js` (časť 11, `setupVideos`).
Riadky platia pre stav 2026-10-11; keď sa posunú, hľadaj mená funkcií.

## 1. Kotva v HTML

Video je záber filmu na kotve `.film-shot` (na počítači ostáva fotka z `data-shot`):

```html
<div class="film-shot is-title" data-shot="sala" … data-m="sala-m" …
     data-video="assets/seq/vstup-dnu" data-video-mode="seq" data-video-n="51" data-video-size="720x1280" data-video-f="0.56,0.5" data-video-poster="assets/seq/vstup-dnu/f025">
  <picture class="film-still" …>
    <source media="(max-width: 720px)" type="image/avif" srcset="assets/seq/vstup-dnu/f025.avif 720w" sizes="100vw">
    <source media="(max-width: 720px)" type="image/webp" srcset="assets/seq/vstup-dnu/f025.webp 720w" sizes="100vw">
    …
```

(`barbershop-30/index.html`, riadky 215 až 220.) Statická záloha na telefóne je tá istá snímka ako plagát, takže pri
nástupe filmu nič neposkočí. Takto to má len `#vstup-dnu`; `#remeslo` (sekvencia `okolo-kresla`, plagát `f022`) má
v zálohe pre telefón ešte fotku `stol-m`.

| atribút | význam | predvolené |
| --- | --- | --- |
| `data-video` | cesta bez prípony: pri `seq` priečinok so snímkami `f000.avif…`, inak súbor `.mp4` / `.webm` | (bez neho to nie je video) |
| `data-video-mode` | `seq`, `play` alebo `scroll` | `scroll`, ak chýba alebo je iný |
| `data-video-n` | počet snímok sekvencie; bez neho sa sekvencia nespustí (`if (s.sq \|\| !n) return;`) | 0 |
| `data-video-size` | rozmer zdroja `ŠxV`, z neho pomer strán roviny | pomer 0,5625 |
| `data-video-f` | bod záujmu `x,y` (0 až 1) | `0.5,0.5` |
| `data-video-poster` | plagát bez prípony, skúša sa `.avif`, potom `.webp` | bez plagátu je záber hneď „hotový“ |
| `data-video-t` | `od,do` sekundy súboru na celý pohyb záberu (len `scroll`) | celé video |
| `data-video-fps` | snímky za sekundu súboru (len `scroll`, posun po celých snímkach) | 30 |
| `data-video-mv` | pohyb kamery nad videom | `still` |
| `data-video-on` | `phone` alebo `all` | `phone` |

```js
const videoOf = (el) => {
  const x = el.dataset;
  if (!x.video || !(phone || x.videoOn === 'all')) return null;
  const mode = x.videoMode === 'play' || x.videoMode === 'seq' ? x.videoMode : 'scroll';
  return { src: x.video, mode, t: range(x.videoT), poster: x.videoPoster || '', fps: parseFloat(x.videoFps) || 30, n: parseInt(x.videoN, 10) || 0 };
};
```

Video nemá hĺbkovú mapu: je to rovina bez posunu popredia a presah za okraj je menší (`OVER_V = 0.06`, teda 1,12
namiesto 1,24 pri fotkách), lebo každý presah zdroj ďalej zväčšuje.

## 2. Životný cyklus záberu s videom

1. `load(s)` → `loadClip(s)`: plagát sa nahrá ako fotka (bez hĺbky), záber je tým hotový a prelína sa ako každý iný.
2. `attach(s)` až po prvom skutočnom pohybe návštevníka (`pointerdown`, `touchstart`, `wheel`, `keydown`) a len
   pre zábery v okolí (`keepAround`: aktuálny, susedia, ďalší v smere skrolu). Meranie stránky bez pohybu
   (Lighthouse) videá nestiahne.
3. `seq` → `seqStart(s)`; `play` / `scroll` → `clipBlob(s)` (celý súbor ako blob) → `attachUrl(s, url)`.
4. Mimo okolia `drop(s)` → `detach(s)` → `seqStop(s)` alebo vyprázdnenie `<video>`. Stiahnuté snímky sekvencie
   (`s.sqBlobs`) sa nemažú, návrat k scéne už nesťahuje.

## 3. Sekvencia snímok (`data-video-mode="seq"`)

### Shader: dve snímky a ich zmes

```js
const FRAG_SEQ = FRAG.replace('uniform sampler2D uMap;', 'uniform sampler2D uMap; uniform sampler2D uMap2; uniform float uMix;')
  .replace('vec3 c = texture2D(uMap, vUv).rgb;', 'vec3 c = mix(texture2D(uMap, vUv).rgb, texture2D(uMap2, vUv).rgb, uMix);');
```

Materiál sekvencie dostane navyše `uMap2` a `uMix`; ostatné zábery majú obyčajný `FRAG`.

### Poloha v sekvencii

```js
const shotT = (s) => (s.pi == null ? 0.5 : s.pi === 0 ? clamp(S / 0.66, 0, 1) : clamp((S - s.pi + 0.66) / 1.32, 0, 1));
// v seqDrive:
const ft = clamp(shotT(s), 0, 1) * (n - 1)
```

`S` je poloha kamery vo filme (kotvy 0, 1, 2…), ktorá ide za skrolom cez tlmenú pružinu. Záber pokrýva
S od `pi − 0,66` po `pi + 0,66`, teda celý čas, keď je vidieť. Keď film stojí presne na kotve záberu (`S = pi`),
je `shotT = 0,5`, preto je plagát stredná snímka. Kotva pri titulnej karte (`.is-title`) nie je horný okraj prvku,
ale stred jej pripnutia (`measure`: `top + free / 2`); pri hornom okraji prvku je záber ešte na začiatku pohybu
(v teste `#remeslo`: `S = pi − 0,5`, `shotT` 0,121). Pri párnom počte snímok (44) je `ft` na kotve 21,5 a obraz dosadne na `f021` alebo `f022`.
`ft` je desatinné číslo snímky (napr. 29,15).

### Sťahovanie od hrubých k jemným

```js
const SEQ_TEX = 6, SEQ_NET = 4;
// poradie sťahovania: najprv každá 8. snímka (pohyb funguje hneď), potom 4., 2. a nakoniec zvyšné
const order = [], seen = new Set();
for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!seen.has(i)) { seen.add(i); order.push(i); }
if (!seen.has(n - 1)) order.splice(1, 0, n - 1);
```

- Najviac 4 požiadavky naraz, `fetch(…, { priority: 'low' })`, výsledok ako `Blob` v `s.sqBlobs[i]`
  (súbory ostávajú v pamäti, asi 40 kB na snímku).
- Posledná snímka ide hneď za prvou, aby celý rozsah pohybu fungoval od začiatku.
- Keď AVIF zlyhá, prepne sa prípona na `.webp` a snímka sa zaradí znova:
  `() => { if (q.ext === '.avif') { q.ext = '.webp'; q.order.push(i); } }`.

### Rozbalenie mimo hlavného vlákna a LRU textúr

```js
function seqTex(s, i) {
  const q = s.sq, t = q.tex.get(i);
  if (t) { q.tex.delete(i); q.tex.set(i, t); return t; }  // naposledy použitá ide na koniec (LRU)
  if (!q.dec.has(i) && s.sqBlobs[i]) {
    q.dec.add(i);
    createImageBitmap(s.sqBlobs[i]).then((b) => { if (q.dead) b.close(); else { q.up.push([i, b]); wake(); } }, () => {}).finally(() => q.dec.delete(i));
  }
  return undefined;
}
```

`Map` drží poradie vloženia, takže zmazanie a nové vloženie posunie snímku na koniec. Uvoľňuje sa od začiatku
(najdlhšie nepoužitá), nikdy nie práve kreslená:

```js
for (const [k, t] of q.tex) { if (q.tex.size <= SEQ_TEX) break; if (t !== u.uMap.value && t !== u.uMap2.value) { t.dispose(); q.tex.delete(k); } }
```

### Nahrávanie do grafiky: limit, poradie, zahadzovanie

```js
// rozbalené snímky ďaleko od polohy (rýchly skrol ich prebehol) sa zahodia, nenahrávajú sa
for (let k = q.up.length - 1; k >= 0; k--) if (Math.abs(q.up[k][0] - ft) > 4) { q.up[k][1].close(); q.up.splice(k, 1); }
// najviac dve nahratia do grafiky za snímku displeja (720 × 1280, po 1 až 3 ms), najbližšie k polohe prvé
q.up.sort((a, b) => Math.abs(a[0] - ft) - Math.abs(b[0] - ft));
for (let k = 0; k < 2 && q.up.length; k++) {
  const [i, b] = q.up.shift();
  if (q.tex.has(i)) { b.close(); continue; }
  const t = tex(b); renderer.initTexture(t); b.close();
  q.tex.set(i, t);
}
```

`renderer.initTexture` nahrá textúru hneď (nie až pri kreslení), potom sa `ImageBitmap` zavrie a pamäť sa uvoľní.
Textúry sekvencie sú bez mipmáp, lineárny filter (`tex()`).

### Výber dvojice a náhrada, keď presné snímky ešte nie sú

```js
let lo = Math.floor(ft), hi = Math.ceil(ft);
while (lo > 0 && !has(lo)) lo--;
while (hi < n - 1 && !has(hi)) hi++;
if (!has(lo)) lo = hi; if (!has(hi)) hi = lo;
if (!has(lo)) return q.net > 0;                           // ešte nič: ostáva plagát
```

Kým jemnejšie snímky chýbajú, prelína sa medzi najbližšími stiahnutými. Keď presné snímky ešte nie sú v grafike,
použijú sa najbližšie, ktoré tam už sú (`a ≤ ft ≤ z` z kľúčov `q.tex`), aby obraz nestál.
Susedia v smere pohybu sa rozbaľujú vopred, len keď sa nečaká na veľa iných:

```js
if (q.up.length + q.dec.size < 3) {
  const dir = V < 0 ? -1 : 1;
  for (const k of [hi + dir, lo - dir, hi + 2 * dir]) if (k >= 0 && k < n && has(k) && !q.tex.has(k)) seqTex(s, k);
}
```

### Prelínanie počas skrolu a dosadnutie v pokoji

```js
const now = performance.now(), dt = q.at ? Math.min(0.1, (now - q.at) / 1000) : 0; q.at = now;
const show = (a, z, ta2, tz2) => {
  const raw = z > a ? clamp((ft - a) / (z - a), 0, 1) : 0;
  const goal = still > 0.25 ? Math.round(raw) : smooth(0.33, 0.67, raw);
  if (a !== q.lo || z !== q.hi) q.m = goal;              // nová dvojica snímok: bez dobiehania
  else q.m += (goal - q.m) * (1 - Math.pow(0.0005, dt));
  u.uMap.value = ta2; u.uMap2.value = tz2; u.uMix.value = q.m; q.lo = a; q.hi = z;
};
```

- Počas skrolu `smoothstep(0,33; 0,67)`: v prvej a poslednej tretine intervalu je obraz jedna ostrá snímka,
  zmes len v strednej tretine. Trvalé prelínanie by pri rýchlom pohybe kamery zdvojovalo hrany.
- `still` je čas, keď rýchlosť kamery `|V| < 0,03`. Po 0,25 s pokoja je cieľ zaokrúhlený na celú snímku.
  `uMix` dobieha exponenciálne: zvyšok `0,0005^t`, po 0,2 s asi 22 %, po 0,5 s asi 2 % (komentár v kóde hovorí
  „do 0,2 s“). Bez dosadnutia ostane v pokoji duch dvoch snímok.
- Pri novej dvojici sa `uMix` nastaví hneď (bez dobiehania), inak by preskočil cez celú zmes.

### Hlavná slučka

```js
for (const s of path) if (s.vel) vbusy = drive(s, now) || vbusy; else if (s.sq) vbusy = seqDrive(s) || vbusy;
```

`seqDrive` vracia `true`, kým sa niečo sťahuje, rozbaľuje alebo čaká na nahratie; `draw` to vráti ako „zaneprázdnený“
a film kreslí ďalšiu snímku aj bez skrolu. Bez toho film kreslí plnou frekvenciou 3 minúty po poslednom pohybe
(`BREATH_MS`), potom dýchanie kamery do 3 s doznie a kreslenie sa zastaví (batéria); `busy` ho drží v chode aj potom.

## 4. Slučka v čase (`data-video-mode="play"`)

```js
v.muted = v.defaultMuted = true; v.playsInline = true;
['muted', 'playsinline', 'webkit-playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach((a) => v.setAttribute(a, ''));
v.loop = c.mode === 'play'; v.preload = 'auto'; v.className = 'film-video';
v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
const vt = new THREE.VideoTexture(v);
…
s.at.appendChild(v);                                      // v stránke: Safari nemusí dodávať snímky videu mimo dokumentu
```

- Súbor sa stiahne celý ako blob (`clipBlob`): návrat k scéne ho nesťahuje znova (prehliadač žiadosti s rozsahom
  bajtov často nevezme z cache). Komentár uvádza 1 až 2 MB; `tim-slucka-864.mp4` má dnes 3,4 MB.
- Nová snímka videa: `requestVideoFrameCallback` (ak existuje), inak udalosti `seeked`, `playing`, `loadeddata`
  nastavia `vt.needsUpdate = true` a zobudia kreslenie. Plagát nahradí video až prvá snímka, keď video naozaj hrá
  (`readyState >= 2` a `!v.paused`).
- Hrá len záber, ktorý je naozaj vidieť, a nie po 3 minútach bez pohybu:
  `const vis = onScreen.has(s) && Math.abs(s.pi - S) < 1 && now - lastInput < BREATH_MS;` (`BREATH_MS = 180000`).
- Chyba videa (`error`) → `detach(s, true)`, ostáva plagát; ten dostane bežný nájazd kamery, aby záber nestál
  (`MOVES[… s.vblock || s.vfail || s.vneterr ? 'in' : s.mv]`). Výpadok siete sa skúsi znova o 10 s.

### Úsporný režim iPhonu a odomknutie gestom

```js
// úsporný režim (iPhone) nedovolí video spustiť samo, ťuknutie je však gesto: skúsi sa znova v ňom;
// video riadené skrolovaním sa pri prvom geste raz pustí a zastaví (Safari potom dodáva snímky aj pri posune)
const gesture = () => SHOTS.forEach((s) => {
  const v = s.vel; if (!v) return;
  if (s.video.mode === 'play' && s.vblock && onScreen.has(s)) { s.vblock = false; v.play().catch(() => { s.vblock = true; }); }
  else if (s.video.mode === 'play' && !s.vunlock && !onScreen.has(s)) { s.vunlock = true; v.play().then(() => { s.vblock = false; if (!onScreen.has(s)) v.pause(); }, () => {}); }
  else if (s.video.mode === 'scroll' && !s.vunlock && v.readyState < 2) { s.vunlock = true; v.play().then(() => { v.pause(); s.vwant = -1; wake(); }, () => {}); }
});
on(window, 'touchend', gesture); on(window, 'click', gesture);
```

Prvé ťuknutie odomkne aj videá, ktoré ešte nie sú na obrazovke (pustia sa a hneď zastavia), aby sa neskôr rozbehli
samé. Sekvencia snímok nič z toho nepotrebuje, sú to obrázky.

## 5. Režim scroll (pretáčanie videa; web ho od 2026-10-11 nepoužíva)

```js
const r = c.t || [0, v.duration || 0], fr = 1 / c.fps;
// stred snímky (presný posun aj v prehliadačoch, ktoré zaokrúhľujú čas), nikdy nie za poslednou snímkou
const t = r[0] + (r[1] - r[0]) * shotT(s);
const want = Math.min(r[1] - fr * 0.5, (Math.floor(t / fr) + 0.5) * fr);
if (Math.abs(want - s.vwant) > fr * 0.25 && !v.seeking) {
  s.vwant = want;
  if (typeof v.fastSeek === 'function') v.fastSeek(want); else v.currentTime = want;
}
return v.seeking;
```

Každý posun je samostatné hľadanie v súbore a ďalšie sa pošle až po dokončení predošlého (`!v.seeking`). Obraz tak
skáče po celých snímkach videa a nikdy nie je rýchlejší ako dekodér. Toto je dôvod, prečo vznikla sekvencia.
Pozor: komentár v `film.js` hovorí o súbore „každú snímku kľúčovú (-g 1)“, posledná verzia skriptu však kódovala
s `-g 4` (pozri `ffmpeg-prikazy.md`, časť 7).

## 6. Video v okienku stránky (mimo filmu, `app.js`)

`<video muted playsinline loop preload="none" data-poster="…" data-video>` v páse tímu. Pravidlá v `setupVideos`:
- plagát sa nastaví až keď je okno do dvoch obrazoviek (`IntersectionObserver`, `rootMargin: '200% 0px'`);
- hrá pri viditeľnosti aspoň 35 %, naraz najviac jedno video, mimo obrazovky a pri skrytej karte pauza;
- pri `prefers-reduced-motion` a `?motion=off` sa nič nesťahuje ani neprehráva (ostáva plagát);
- odmietnuté automatické prehranie (`play()` zlyhá) nechá plagát.

Tieto súbory (`tim-v-akcii-576` a ďalšie) sú staršie, 576 px, H.264 crf 23 a VP9 crf 34 podľa `docs/MEDIA_SELECTION.md`;
skript, ktorý ich vyrobil, som v repozitári nenašiel (pridané commitom 07d20c5).

## 7. Ladiace API (`window.BS30_FILM.state`)

```js
seq: path.filter((s) => s.video && s.video.mode === 'seq').map((s) => ({ shot: s.photo, on: !!s.sq, got: …, n: s.video.n, lo: …, hi: …, mix: …, tex: …, up: …, dec: …, t: … })),
video: path.filter((s) => s.video).map((s) => ({ shot: s.photo, mode: s.video.mode, src: …, rs: …, t: …, want: …, seeking: …, paused: …, live: …, poster: …, blocked: …, fail: …, netErr: …, onScreen: … })),
```

| pole `seq[]` | význam |
| --- | --- |
| `on` | sekvencia je pripojená (`s.sq`) |
| `got` / `n` | stiahnuté snímky / všetky |
| `lo`, `hi`, `mix` | kreslená dvojica a ich zmes (v pokoji `mix` 0 alebo 1) |
| `tex` | čísla snímok v grafike (najviac 6) |
| `up`, `dec` | čakajúce nahratia a rozbaľovania |
| `t` | poloha v zábere 0 až 1 (`shotT`) |

Overenie v prehliadači: [../scripts/seq-stav.mjs](../scripts/seq-stav.mjs) v tomto skille.
