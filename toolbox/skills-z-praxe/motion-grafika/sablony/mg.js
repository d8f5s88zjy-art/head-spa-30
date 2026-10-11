/* mg.js: beh kompozície pohyblivej grafiky (motion-grafika).
 *
 * Kompozícia = HTML s prvkom #kompozicia. Každá vrstva je prvok s data-layer="Meno" a časom
 * data-in, data-out v sekundách (záporné číslo = od konca, "koniec" = dĺžka). Vrstva je viditeľná
 * v čase in <= t < out. Nástup a odchod: data-vstup (fade, hore, zlava, stierka, stierka-hore,
 * linka, nic) a data-odchod (fade, dole, stierka, nic); odchod končí presne v čase out.
 * Vlastné animácie môžu byť CSS keyframes alebo el.animate(); všetky sa riadia časom kompozície.
 *
 * Texty a farby prichádzajú ako JSON (window.MG_PARAMETRE, doplní render.mjs; inak predvolené
 * z <script id="predvolene">). data-text="kluc" vloží texty.kluc (*slovo* = zvýraznenie, \n = nový
 * riadok); prázdny text vrstvu vynechá. Hodnota atribútu "@kluc" sa berie z nastavenia.kluc.
 *
 * Renderovanie je deterministické: MG.seek(t) pozastaví všetky animácie a nastaví im currentTime,
 * nič nebeží v reálnom čase. Rozhranie: window.MG = { ready, seek, vrstvy, kontrola, ramec, info }.
 */
(function () {
  'use strict';
  const P = window.MG_PARAMETRE || {};
  const html = document.documentElement;
  const komp = document.getElementById('kompozicia');
  const el0 = document.getElementById('predvolene');
  const pred = el0 ? JSON.parse(el0.textContent) : {};
  const texty = Object.assign({}, pred.texty, P.texty);
  const nast = Object.assign({}, pred.nastavenia, P.nastavenia);
  const zn = P.znacka || {};
  const num = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v) ? d : +v);
  const sirka = num(P.sirka, num(komp.dataset.sirka, 1080));
  const vyska = num(P.vyska, num(komp.dataset.vyska, 1920));
  const fps = num(P.fps, num(komp.dataset.fps, 30));
  const dlzka = num(P.dlzka, num(nast.dlzka, num(komp.dataset.dlzka, 4)));
  const j = Math.min(sirka, vyska) / 1080;
  const varovania = [];
  if (P.render) html.classList.add('mg-render');

  // hodnota atribútu: "@kluc" = z nastavení, inak priamo
  const attr = (el, meno, d) => {
    let v = el.getAttribute(meno);
    if (v === null) return d;
    if (v.startsWith('@')) v = nast[v.slice(1)];
    return v === undefined || v === null ? d : v;
  };
  const cas = (v, d) => {
    if (v === undefined || v === null || v === '') return d;
    if (v === 'koniec') return dlzka;
    const n = +v;
    if (isNaN(n)) { varovania.push(`neplatný čas "${v}"`); return d; }
    return n < 0 ? dlzka + n : n;
  };

  // ---------- rozmery, zóna, premenné značky ----------
  function zonaPredvolena(w, h) {
    // naša pracovná zóna, v každom formáte aspoň taká prísna ako ZONY v kratke-video/scripts/reel.py
    // (prekrytie a titulky reelu idú na ten istý obraz): na výšku hore meno účtu, vpravo ikony, dole popis;
    // na šírku ovládanie prehrávača dole; štvorec okraje feedu
    const p = h > w * 1.2 ? { hore: 0.12, dole: 0.24, vlavo: 0.06, vpravo: 0.14 }
      : w > h * 1.2 ? { hore: 0.08, dole: 0.12, vlavo: 0.06, vpravo: 0.06 }
        : { hore: 0.07, dole: 0.10, vlavo: 0.07, vpravo: 0.07 };
    return { hore: Math.round(h * p.hore), dole: Math.round(h * p.dole), vlavo: Math.round(w * p.vlavo), vpravo: Math.round(w * p.vpravo) };
  }
  const zona = Object.assign(zonaPredvolena(sirka, vyska), P.zona || {});
  zona.bok = Math.max(zona.vlavo, zona.vpravo);
  const css = (k, v) => html.style.setProperty(k, String(v));
  css('--sirka', sirka); css('--vyska', vyska); css('--j', j);
  for (const k of ['hore', 'dole', 'vlavo', 'vpravo', 'bok']) css('--zona-' + k, zona[k]);

  function rgb(farba) {
    const s = String(farba).trim();
    let m = s.match(/^#([0-9a-f]{3})$/i);
    if (m) return m[1].split('').map((c) => parseInt(c + c, 16)).join(', ');
    m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(', ');
    m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (m) return [m[1], m[2], m[3]].join(', ');
    return null;
  }
  const farby = Object.assign({ podklad: '#111111', plocha: '#1b1b1b', text: '#f2f2f2', 'text-2': '#cccccc', 'text-3': '#999999', akcent: '#d0a060', 'na-akcente': '#111111', linka: 'rgba(255,255,255,.14)', doska: 'rgba(17,17,17,.72)' }, zn.farby, P.farby);
  for (const [k, v] of Object.entries(farby)) {
    css('--f-' + k, v);
    const t = rgb(v);
    if (t) css('--f-' + k + '-rgb', t);
  }
  for (const [k, v] of Object.entries(zn.premenne || {})) css(k, v);
  const pohyb = Object.assign({ vstup: 'cubic-bezier(0.2, 0.7, 0.2, 1)', odchod: 'cubic-bezier(0.4, 0, 1, 1)', vstup_ms: 600, odchod_ms: 400 }, zn.pohyb, P.pohyb);
  css('--e-vstup', pohyb.vstup); css('--e-odchod', pohyb.odchod);
  if (nast.zarovnanie) komp.dataset.zarovnanie = nast.zarovnanie;
  if (nast.zvisle) komp.dataset.zvisle = nast.zvisle;
  if (nast.clona !== undefined) css('--clona', nast.clona);

  // ---------- texty ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const formatuj = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\\n|\n/g, '<br>');
  const vrstvaOd = (el) => el.closest('[data-layer]');
  for (const el of komp.querySelectorAll('[data-text]')) {
    const v = texty[el.dataset.text];
    if (v === undefined || v === null || String(v).trim() === '') {
      // krok priebehu vypadne sám, inak vypadne celá vrstva
      const vr = el.hasAttribute('data-prah') ? el : vrstvaOd(el);
      if (vr) vr.classList.add('mg-prazdna'); else el.remove();
    } else el.innerHTML = formatuj(v);
  }
  // data-ak="kluc": vrstva len vtedy, keď text kluc nie je prázdny (napr. linka pri nadpisku)
  // (data-ak="@kluc" = podľa nastavenia.kluc)
  for (const el of komp.querySelectorAll('[data-ak]')) {
    const k = el.dataset.ak;
    const v = k.startsWith('@') ? nast[k.slice(1)] : texty[k];
    if (v === undefined || v === null || String(v).trim() === '') (vrstvaOd(el) || el).classList.add('mg-prazdna');
  }
  // kroky priebehu: prázdne vypadnú, zvyšné dostanú rovnomerné prahy 0 až 1
  for (const box of komp.querySelectorAll('[data-kroky]')) {
    const k = [...box.querySelectorAll('[data-prah="auto"]')].filter((e) => !e.closest('.mg-prazdna'));
    if (!k.length) box.classList.add('mg-prazdna');
    k.forEach((e, i) => { const p = k.length > 1 ? i / (k.length - 1) : 1; e.dataset.prah = p; e.style.setProperty('--poloha', p); });
  }

  // ---------- vrstvy ----------
  const prepis = P.vrstvy || {};
  const vrstvy = [...komp.querySelectorAll('[data-layer]')].map((el, i) => {
    const meno = el.dataset.layer;
    const o = prepis[meno] || {};
    const v = {
      el, meno, poradie: i + 1,
      in: cas(o.in ?? attr(el, 'data-in'), 0),
      out: cas(o.out ?? attr(el, 'data-out'), dlzka),
      vstup: o.vstup ?? attr(el, 'data-vstup', 'nic'),
      odchod: o.odchod ?? attr(el, 'data-odchod', 'nic'),
      vstupMs: num(o.vstup_ms ?? attr(el, 'data-vstup-ms'), pohyb.vstup_ms),
      // krivka nástupu: "vstup" (predvolená, krivka značky), "odchod" (mäkký rozbeh značky, na clony cez celý
      // obraz, aby stmavenie nenaskočilo v prvých snímkach) alebo vlastná CSS krivka
      vstupKrivka: o.vstup_krivka ?? attr(el, 'data-vstup-krivka', 'vstup'),
      odchodMs: num(o.odchod_ms ?? attr(el, 'data-odchod-ms'), pohyb.odchod_ms),
      posun: num(attr(el, 'data-posun'), 18) * j,
      popis: el.dataset.popis || '',
      mimoZony: el.hasAttribute('data-mimo-zony'),
      prazdna: el.classList.contains('mg-prazdna') || o.skry === true,
    };
    if (o.skry === true) el.classList.add('mg-prazdna');
    // čas vrstvy pre vlastné CSS animácie: animation-delay: calc(var(--in) * 1s + 200ms)
    el.style.setProperty('--in', v.in); el.style.setProperty('--out', v.out);
    if (v.out > dlzka + 1e-9) { varovania.push(`vrstva ${meno}: out ${v.out} s je za koncom kompozície (${dlzka} s)`); v.out = dlzka; }
    if (v.out <= v.in) varovania.push(`vrstva ${meno}: out (${v.out} s) nie je za in (${v.in} s)`);
    if (v.odchod === 'nic') v.odchodMs = 0;
    if (v.vstup === 'nic') v.vstupMs = 0;
    return v;
  });
  for (const m of Object.keys(prepis)) if (!vrstvy.some((v) => v.meno === m)) varovania.push(`parameter vrstvy: kompozícia nemá vrstvu "${m}"`);

  const VSTUP = (v) => ({
    fade: [{ opacity: 0 }, { opacity: 1 }],
    hore: [{ opacity: 0, translate: `0 ${v.posun}px` }, { opacity: 1, translate: '0 0' }],
    zlava: [{ opacity: 0, translate: `${-v.posun}px 0` }, { opacity: 1, translate: '0 0' }],
    stierka: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
    'stierka-hore': [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }],
    linka: [{ scale: '0 1' }, { scale: '1 1' }],
  })[v.vstup];
  const ODCHOD = (v) => ({
    fade: [{ opacity: 1 }, { opacity: 0 }],
    dole: [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 ${v.posun / 2}px` }],
    stierka: [{ clipPath: 'inset(0 0 0 0%)' }, { clipPath: 'inset(0 0 0 100%)' }],
  })[v.odchod];

  // ---------- priebeh a počítadlo (jeden priebeh na kompozíciu) ----------
  const prOd = cas(attr(komp, 'data-priebeh-od'), null);
  const prDo = cas(attr(komp, 'data-priebeh-do'), null);
  const krivka = attr(komp, 'data-krivka', 'plynulo');
  const hladko = (x) => (krivka === 'linear' ? x : x * x * (3 - 2 * x));
  const priebeh = (t) => (prOd === null || prDo === null || prDo <= prOd ? 1 : hladko(Math.min(1, Math.max(0, (t - prOd) / (prDo - prOd)))));
  const pocitadla = [...komp.querySelectorAll('[data-pocitadlo]')].map((el) => ({
    el, od: num(attr(el, 'data-od'), 0), do: num(attr(el, 'data-do'), 100),
    format: attr(el, 'data-format', '{n}'), des: num(attr(el, 'data-desatinne'), 0),
  }));
  const prahy = [...komp.querySelectorAll('[data-prah]')].filter((e) => !e.classList.contains('mg-prazdna'));
  function cislo(c, t, p) {
    const x = c.od + (c.do - c.od) * p;
    const f = Math.pow(10, c.des);
    const r = (c.do < c.od ? Math.ceil(x * f - 1e-9) : Math.round(x * f)) / f;
    const s = Math.floor(Math.abs(r));
    return c.format
      .replace('{mm}', String(Math.floor(s / 60)).padStart(2, '0'))
      .replace('{ss}', String(s % 60).padStart(2, '0'))
      .replace('{n}', r.toFixed(c.des).replace('.', ','));
  }

  // ---------- čas ----------
  let animacie = [];
  function nastavCas(t) {
    for (const v of vrstvy) if (!v.prazdna) v.el.classList.toggle('mg-mimo', !(t >= v.in - 1e-6 && t < v.out - 1e-6));
    const p = priebeh(t);
    komp.style.setProperty('--p', p.toFixed(5));
    for (const c of pocitadla) c.el.textContent = cislo(c, t, p);
    for (const e of prahy) {
      // --hotovo 0 až 1: krok sa rozsvieti plynulo, kým k nemu výplň dobieha (bez prechodov CSS); okno končí
      // presne na kroku, inak by posledný krok (prah 1) ostal pri p = 1 rozsvietený len na 65 % (overené)
      const h = Math.min(1, Math.max(0, (p - (+e.dataset.prah - 0.05)) / 0.05));
      e.style.setProperty('--hotovo', (h * h * (3 - 2 * h)).toFixed(4));
      e.dataset.stav = p >= +e.dataset.prah - 1e-6 ? 'hotovo' : 'caka';
    }
    for (const a of document.getAnimations()) {
      if (a.playState !== 'paused') a.pause();
      a.currentTime = t * 1000;
    }
  }
  const dveSnimky = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  async function seek(t) { nastavCas(t); await dveSnimky(); return t; }

  // ---------- prispôsobenie dlhého textu šírke ----------
  function prisposob() {
    for (const el of komp.querySelectorAll('[data-prisposob]')) {
      if (el.closest('.mg-prazdna')) continue;
      const rodic = el.parentElement;
      const cs = getComputedStyle(rodic);
      const k = el.closest('.zona') || komp;
      const volne = () => Math.min(rodic.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), k.clientWidth);
      let size = parseFloat(getComputedStyle(el).fontSize);
      const min = size * num(el.dataset.prisposob, 0.6);
      let n = 0;
      while (el.scrollWidth > volne() + 0.5 && size > min && n++ < 60) { size *= 0.97; el.style.fontSize = size + 'px'; }
      if (el.scrollWidth > volne() + 0.5) varovania.push(`text "${el.textContent}" sa nezmestí ani po zmenšení na ${Math.round(size)} px`);
      else if (n) varovania.push(`text "${el.textContent}" zmenšený na ${Math.round(size)} px, aby sa zmestil`);
    }
    // kroky priebehu stoja na pevných miestach dráhy: dlhé názvy by sa prekryli (overené: "Strihanie strojčekom",
    // "Umytie vlasov" pri 1080 px), preto sa zmenšia všetky rovnako, najviac na data-prisposob (0,7)
    for (const box of komp.querySelectorAll('[data-kroky]')) {
      if (box.closest('.mg-prazdna')) continue;
      const kroky = viditelneKroky(box);
      if (kroky.length < 2) continue;
      let size = parseFloat(getComputedStyle(kroky[0]).fontSize);
      const min = size * num(box.dataset.prisposob, 0.7);
      let n = 0;
      while (prekryvKrokov(kroky) && size > min && n++ < 60) { size *= 0.97; for (const e of kroky) e.style.fontSize = size + 'px'; }
      if (prekryvKrokov(kroky)) varovania.push(`kroky sa prekrývajú ani po zmenšení na ${Math.round(size)} px: skráť ich (jedno, dve slová)`);
      else if (n) varovania.push(`kroky zmenšené na ${Math.round(size)} px, aby sa neprekrývali (kratšie názvy budú čitateľnejšie)`);
    }
  }
  function viditelneKroky(box) { return [...box.querySelectorAll('[data-prah]')].filter((e) => !e.classList.contains('mg-prazdna')); }
  function prekryvKrokov(kroky) {
    // susedné kroky potrebujú medzeru aspoň 20 px pri 1080
    const r = kroky.map((e) => e.getBoundingClientRect());
    return r.some((x, i) => i > 0 && r[i - 1].right + 20 * j > x.left);
  }

  // ---------- kontrola zóny a pretečenia (volá render.mjs) ----------
  function ramecVrstvy(el) {
    const k = komp.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - k.left, y: r.top - k.top, w: r.width, h: r.height };
  }
  function kontrola(t) {
    const chyby = [];
    const z = komp.dataset.zarovnanie === 'stred' ? { l: zona.bok, r: sirka - zona.bok } : { l: zona.vlavo, r: sirka - zona.vpravo };
    for (const v of vrstvy) {
      if (v.prazdna || v.mimoZony) continue;
      const pokoj = t >= v.in + v.vstupMs / 1000 - 1e-6 && t < v.out - v.odchodMs / 1000 - 1e-6;
      if (!pokoj) continue;
      const r = ramecVrstvy(v.el);
      if (r.w === 0 && r.h === 0) continue;
      const o = [];
      if (r.x < z.l - 0.5) o.push(`vľavo o ${Math.round(z.l - r.x)} px`);
      if (r.x + r.w > z.r + 0.5) o.push(`vpravo o ${Math.round(r.x + r.w - z.r)} px`);
      if (r.y < zona.hore - 0.5) o.push(`hore o ${Math.round(zona.hore - r.y)} px`);
      if (r.y + r.h > vyska - zona.dole + 0.5) o.push(`dole o ${Math.round(r.y + r.h - (vyska - zona.dole))} px`);
      if (o.length) chyby.push(`vrstva ${v.meno} je mimo bezpečnej zóny (${o.join(', ')})`);
      if (v.el.hasAttribute('data-kroky') && prekryvKrokov(viditelneKroky(v.el))) chyby.push(`vrstva ${v.meno}: kroky sa prekrývajú`);
      for (const e of [v.el, ...v.el.querySelectorAll('[data-text]')]) {
        if (e.hasAttribute('data-text') && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline') chyby.push(`vrstva ${v.meno}: text pretečie (${e.scrollWidth} > ${e.clientWidth} px)`);
      }
    }
    return chyby;
  }
  function ramec(t) {
    // spoločný rámik viditeľných vrstiev v pokoji (na výrez detailu)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const v of vrstvy) {
      if (v.prazdna || v.mimoZony || !(t >= v.in && t < v.out)) continue;
      const r = ramecVrstvy(v.el);
      if (!r.w || !r.h) continue;
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  // ---------- náhľad v prehliadači (bez render.mjs) ----------
  function nahlad() {
    html.classList.add('mg-nahlad');
    const ram = document.createElement('div');
    ram.className = 'mg-ram';
    komp.parentNode.insertBefore(ram, komp);
    ram.appendChild(komp);
    const mierka = Math.min((innerHeight * 0.66) / vyska, (innerWidth * 0.94) / sirka, 1);
    komp.style.transform = `scale(${mierka})`;
    ram.style.width = sirka * mierka + 'px'; ram.style.height = vyska * mierka + 'px';
    const ov = document.createElement('div');
    ov.className = 'mg-ovladanie';
    ov.innerHTML = '<div class="riadok"><button type="button">Pauza</button><input type="range" min="0" step="0.001"><span class="cas"></span></div><div class="mg-os"></div>';
    ram.after(ov);
    const [tl, sl, lb, os] = [ov.querySelector('button'), ov.querySelector('input'), ov.querySelector('.cas'), ov.querySelector('.mg-os')];
    sl.max = dlzka;
    const hlavy = [];
    for (const v of vrstvy) {
      if (v.prazdna) continue;
      os.insertAdjacentHTML('beforeend', `<span>${v.poradie}. ${esc(v.meno)}</span><span class="pas"><i style="left:${(v.in / dlzka) * 100}%;width:${((v.out - v.in) / dlzka) * 100}%"></i><b></b></span>`);
      hlavy.push(os.lastElementChild.querySelector('b'));
    }
    let hra = true, t0 = performance.now(), t = 0;
    tl.onclick = () => { hra = !hra; tl.textContent = hra ? 'Pauza' : 'Prehraj'; t0 = performance.now() - t * 1000; };
    sl.oninput = () => { hra = false; tl.textContent = 'Prehraj'; t = +sl.value; };
    (function krok() {
      if (hra) t = ((performance.now() - t0) / 1000) % dlzka;
      nastavCas(t);
      sl.value = t; lb.textContent = t.toFixed(2) + ' s';
      for (const h of hlavy) h.style.left = (t / dlzka) * 100 + '%';
      requestAnimationFrame(krok);
    })();
  }

  // ---------- štart ----------
  async function start() {
    const fonty = (zn.fonty || []).map((f) => new FontFace(f.rodina, `url("${f.url}")`, { weight: String(f.vaha || 400), style: f.styl || 'normal' }));
    const nacitane = await Promise.allSettled(fonty.map((f) => f.load()));
    nacitane.forEach((r, i) => {
      if (r.status === 'fulfilled') document.fonts.add(r.value);
      else throw new Error(`písmo ${zn.fonty[i].rodina} ${zn.fonty[i].vaha} sa nenačítalo (${zn.fonty[i].url})`);
    });
    await document.fonts.ready;
    prisposob();
    for (const v of vrstvy) {
      if (v.prazdna) continue;
      const kv = VSTUP(v);
      if (v.vstup !== 'nic' && !kv) varovania.push(`vrstva ${v.meno}: neznámy nástup "${v.vstup}"`);
      const krivka = v.vstupKrivka === 'odchod' ? pohyb.odchod : v.vstupKrivka === 'vstup' ? pohyb.vstup : v.vstupKrivka;
      if (kv) v.el.animate(kv, { duration: v.vstupMs, delay: v.in * 1000, fill: 'both', easing: krivka });
      const ko = ODCHOD(v);
      if (v.odchod !== 'nic' && !ko) varovania.push(`vrstva ${v.meno}: neznámy odchod "${v.odchod}"`);
      if (ko) v.el.animate(ko, { duration: v.odchodMs, delay: (v.out - v.odchodMs / 1000) * 1000, fill: 'forwards', easing: pohyb.odchod });
    }
    animacie = document.getAnimations();
    nastavCas(0);
    if (P.nahlad) nahlad();
    await dveSnimky();
    return true;
  }

  const ready = start();
  window.MG = {
    ready, seek, kontrola, ramec, varovania,
    vrstvy: () => vrstvy.map((v) => ({ poradie: v.poradie, meno: v.meno, in: v.in, out: v.out, vstup: v.vstup, vstupMs: v.vstupMs, odchod: v.odchod, odchodMs: v.odchodMs, popis: v.popis, prazdna: v.prazdna, mimoZony: v.mimoZony })),
    info: () => ({ sirka, vyska, fps, dlzka, zona, animacii: animacie.length, texty, nastavenia: nast }),
  };
  if (!P.render && !P.nahlad && !window.MG_PARAMETRE) {
    // otvorené priamo zo súboru: zahraj predvolené v slučke s ovládaním
    ready.then(() => { if (!html.classList.contains('mg-nahlad')) nahlad(); });
  }
})();
