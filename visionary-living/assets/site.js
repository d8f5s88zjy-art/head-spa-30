// VISIONARY LIVING – správanie stránky. Bez knižníc. Čo sa hýbe, mení len transform a opacity;
// pri prefers-reduced-motion sa výkresy ukážu hneď nakreslené a nič sa nehýbe.
const d = document, html = d.documentElement;
const $ = (s, r = d) => r.querySelector(s);
const $$ = (s, r = d) => [...r.querySelectorAll(s)];
const pohyb = !matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator.connection && navigator.connection.saveData);
const NBSP = ' ';
const cena = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + NBSP + '€';
const plocha = (x) => Number(x).toFixed(2).replace('.', ',') + NBSP + 'm²';

// 1. lišta: menu na telefóne
(function lista() {
  const h = $('.lista'); if (!h) return;
  const btn = $('.menu-prepinac', h), nav = $('#menu', h);
  const nastav = (on) => {
    h.dataset.menu = on ? 'otvorene' : 'zatvorene';
    btn.setAttribute('aria-expanded', String(on));
    $('.menu-prepinac-text', btn).textContent = on ? 'Zavrieť' : 'Menu';
    d.body.classList.toggle('menu-otvorene', on);
  };
  btn.addEventListener('click', () => nastav(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) nastav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { nastav(false); btn.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && nastav(false));
})();

// 2. výkresy sa kreslia raz, keď prídu do okna (fasáda, kóty, časová os, cesta, pásy miestností)
(function kresli() {
  const els = $$('[data-kresli]');
  if (!els.length) return;
  if (!pohyb || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('je-nakreslene')); return; }
  const io = new IntersectionObserver((zs, o) => zs.forEach((z) => { if (z.isIntersecting) { z.target.classList.add('je-nakreslene'); o.unobserve(z.target); } }),
    { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
})();

// 3. výber bytu: fasáda z tlačidiel, filter typov, panel zvoleného bytu, tabuľka
(function vyber() {
  const sekcia = $('.vyber'); if (!sekcia) return;
  const data = JSON.parse($('#byty-data').textContent);
  const bunky = $$('.fasada .byt', sekcia), riadky = $$('.tabulka-bytov tbody tr', sekcia), filtre = $$('.filter [role=radio]', sekcia);
  const panel = $('.panel', sekcia), live = $('.panel-live', sekcia), pocet = $('.filter-pocet', sekcia);
  const uzky = () => matchMedia('(max-width: 1023px)').matches;
  let vybrany = null, filter = 'vsetky', casovac = 0;

  const prepis = (id) => {
    const b = data[id];
    $('.panel-byt', panel).textContent = `Byt ${id}`; $('.panel-byt', panel).href = b.url;
    const stav = $('.stav', panel); stav.textContent = b.stav; stav.className = `stav stav-${b.stav === 'voľný' ? 'volny' : 'iny'}`;
    $('.panel-typ', panel).textContent = `${b.nazov}, ${b.podlazie}. podlažie`;
    $('.panel-cena strong', panel).textContent = cena(b.cena);
    $('.panel-cena span', panel).textContent = `${plocha(b.plocha)} vrátane loggie`;
    const src = $('.panel-plan source', panel), img = $('.panel-plan img', panel);
    if (src && img && b.obr) { src.srcset = b.obr.avif; img.srcset = b.obr.webp; img.src = b.obr.src; img.width = b.obr.w; img.height = b.obr.h; img.alt = `Výrez z pôdorysu podlažia, byt ${id} vyznačený`; const fc = $('.panel-plan figcaption', panel); if (fc) fc.textContent = img.alt + '.'; }
    $('.panel-miestnosti', panel).innerHTML = b.miestnosti.map((m) => `<li><span>${m[0]}</span><span>${plocha(m[1])}</span></li>`).join('');
    $('.panel-spolu span:last-child', panel).textContent = `${plocha(b.plocha)} vrátane loggie`;
    const det = $('.panel-detail', panel); det.textContent = `Detail bytu ${id}`; det.href = b.url;
    $('.panel-zaujem', panel).href = $('.panel-zaujem', panel).href.replace(/byt=\w+/, `byt=${id}`);
  };
  const vyberByt = (id, oznam = true) => {
    if (!data[id] || id === vybrany) return;
    vybrany = id;
    bunky.forEach((c) => { const on = c.dataset.id === id; c.classList.toggle('je-on', on); c.setAttribute('aria-pressed', String(on)); });
    riadky.forEach((r) => r.classList.toggle('je-on', r.dataset.id === id));
    clearTimeout(casovac);
    if (pohyb) { panel.classList.add('je-prepis'); casovac = setTimeout(() => { prepis(id); panel.classList.remove('je-prepis'); }, 140); }
    else prepis(id);
    const b = data[id];
    if (oznam) live.textContent = `Byt ${id}, ${b.nazov.toLowerCase()}, ${b.podlazie}. podlažie, ${b.stav}, ${cena(b.cena)}, ${plocha(b.plocha)}`;
  };
  const sedi = (el) => filter === 'vsetky' || el.dataset.typ === filter[1];
  const filtruj = (f, zHash = false) => {
    filter = f;
    filtre.forEach((b) => { const on = b.dataset.filter === f; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    let n = 0;
    bunky.forEach((c) => { const ok = sedi(c); c.classList.toggle('je-off', !ok); c.tabIndex = ok ? 0 : -1; if (ok) n++; if (ok && pohyb && !zHash) { c.classList.add('je-pulz'); c.addEventListener('animationend', () => c.classList.remove('je-pulz'), { once: true }); } });
    riadky.forEach((r) => r.classList.toggle('je-off', !sedi(r)));
    pocet.textContent = n === 12 ? '12 bytov' : n === 1 ? '1 byt' : n < 5 ? `${n} byty` : `${n} bytov`;
    if (vybrany && !sedi(bunky.find((c) => c.dataset.id === vybrany))) { const prvy = Object.keys(data).find((id) => f === 'vsetky' || data[id].typ === f[1]); vyberByt(prvy); }
    const hash = { t2: '#dvojizbove', t3: '#trojizbove' }[f] || '';
    if (!zHash && history.replaceState) history.replaceState(null, '', location.pathname + location.search + (hash || '#byty'));
  };
  filtre.forEach((b) => {
    b.addEventListener('click', () => filtruj(b.dataset.filter));
    b.addEventListener('keydown', (e) => {                        // radiogroup: šípky prepínajú
      const i = filtre.indexOf(b), j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : -1;
      if (j < 0 || j >= filtre.length) return; e.preventDefault(); filtre[j].focus(); filtruj(filtre[j].dataset.filter);
    });
  });
  bunky.forEach((c) => {
    c.addEventListener('click', () => {
      const prve = c.dataset.id !== vybrany; vyberByt(c.dataset.id);
      if (uzky() && prve) panel.scrollIntoView({ block: 'start', behavior: pohyb ? 'smooth' : 'auto' });
    });
    c.addEventListener('keydown', (e) => {                        // šípky: ← → po podlaží, ↑ ↓ v stĺpci, Home/End
      const p = c.parentElement, vRade = $$('.byt', p).filter((x) => !x.classList.contains('je-off')), i = vRade.indexOf(c);
      let ciel = null;
      if (e.key === 'ArrowRight') ciel = vRade[i + 1]; else if (e.key === 'ArrowLeft') ciel = vRade[i - 1];
      else if (e.key === 'Home') ciel = vRade[0]; else if (e.key === 'End') ciel = vRade[vRade.length - 1];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const stlpec = [...p.children].indexOf(c), sused = e.key === 'ArrowUp' ? p.previousElementSibling : p.nextElementSibling;
        if (sused && sused.classList.contains('podlazie')) { const k = sused.children[stlpec]; if (k && !k.classList.contains('je-off')) ciel = k; }
      }
      if (ciel) { e.preventDefault(); ciel.focus(); }
    });
  });
  if (matchMedia('(hover: hover)').matches) riadky.forEach((r) => r.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') vyberByt(r.dataset.id, false); }));
  const zHash = { '#dvojizbove': 't2', '#trojizbove': 't3' }[location.hash];
  filtruj(zHash || 'vsetky', true);
  const prvy = Object.keys(data).find((id) => filter === 'vsetky' || data[id].typ === filter[1]);
  vyberByt(prvy, false);
})();

// 4. cesta na stránke Financovanie: čiara sa odvíja so skrolom (jediný skrolom riadený prvok webu)
(function cesta() {
  const c = $('.cesta-plna'); if (!c) return;
  const kroky = $$('.krok', c), ciara = $('.cesta-ciara', c), i = $('.cesta-ciara i', c), km = $('.krokomer', c);
  const hotovo = () => { i.style.setProperty('--p', '1'); kroky.forEach((k) => k.classList.add('je-on')); };
  if (!pohyb) { hotovo(); return; }
  let top = 0, vyska = 1, uzly = [], p = -1, akt = -1, raf = 0;
  const measure = () => {
    const r = ciara.getBoundingClientRect(); top = r.top + scrollY; vyska = Math.max(1, r.height);
    uzly = kroky.map((k) => $('.krok-uzol', k).getBoundingClientRect().top + scrollY + 7 - top);
    krok();
  };
  const krok = () => {
    raf = 0;
    const y = scrollY + innerHeight * 0.62;
    const np = Math.min(1, Math.max(0, (y - top) / vyska));
    if (Math.abs(np - p) > 0.002) { p = np; i.style.setProperty('--p', p.toFixed(3)); }
    let a = -1;
    kroky.forEach((k, j) => { const on = p * vyska >= uzly[j] - 1; k.classList.toggle('je-on', on); if (on) a = j; });
    if (a !== akt) { akt = a; const j = Math.max(0, a); kroky.forEach((k, x) => k.classList.toggle('je-aktualny', x === j));
      if (km) { $('.krokomer-cislo', km).textContent = j + 1; $('.krokomer-nazov', km).textContent = kroky[j].dataset.nazov || ''; $('.krokomer-z', km).textContent = `krok ${j + 1} z${NBSP}${kroky.length}`; } }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(krok); }, { passive: true });
  let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(measure, 150); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(measure);
  addEventListener('load', measure); measure();
})();

// 5. prezeranie obrázkov (galéria, pôdorys): natívny dialóg so šípkami, klávesnicou, potiahnutím a návratom fokusu
(function prezeranie() {
  const tlacidla = $$('[data-galeria]'); if (!tlacidla.length) return;
  const dlg = d.createElement('dialog'); dlg.className = 'prezeranie'; dlg.setAttribute('aria-label', 'Zväčšený obrázok');
  dlg.innerHTML = '<figure class="prezeranie-obsah"><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="prezeranie-tl prezeranie-pred" aria-label="Predchádzajúci obrázok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" class="prezeranie-tl prezeranie-dal" aria-label="Ďalší obrázok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" class="prezeranie-tl prezeranie-zavriet" aria-label="Zavrieť"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
    '<p class="prezeranie-pocet" aria-live="polite"></p>';
  d.body.append(dlg);
  const img = $('img', dlg), cap = $('figcaption', dlg), pocet = $('.prezeranie-pocet', dlg), pred = $('.prezeranie-pred', dlg), dal = $('.prezeranie-dal', dlg);
  let skupina = [], i = 0, otvaral = null;
  const popis = (b) => (b.getAttribute('aria-label') || '').replace(/^Zväčšiť: /, '');
  const ukaz = (n, prvy = false) => {
    i = (n + skupina.length) % skupina.length; const b = skupina[i];
    const nastav = () => { img.src = b.dataset.src; img.width = +b.dataset.w; img.height = +b.dataset.h; img.alt = popis(b); cap.textContent = img.alt; img.classList.remove('je-vymena'); };
    if (prvy || !pohyb) nastav(); else { img.classList.add('je-vymena'); setTimeout(nastav, 140); }
    const jeden = skupina.length < 2; pred.hidden = dal.hidden = jeden;
    pocet.textContent = jeden ? '' : `${i + 1} / ${skupina.length}`;
    if (!jeden) { new Image().src = skupina[(i + 1) % skupina.length].dataset.src; }
  };
  const otvor = (b) => { otvaral = b; skupina = tlacidla.filter((x) => x.dataset.galeria === b.dataset.galeria); ukaz(skupina.indexOf(b), true); dlg.showModal(); $('.prezeranie-zavriet', dlg).focus(); };
  dlg.addEventListener('close', () => { img.removeAttribute('src'); otvaral && otvaral.focus(); });
  tlacidla.forEach((b) => b.addEventListener('click', () => otvor(b)));
  pred.addEventListener('click', () => ukaz(i - 1)); dal.addEventListener('click', () => ukaz(i + 1));
  $('.prezeranie-zavriet', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ukaz(i + 1); if (e.key === 'ArrowLeft') ukaz(i - 1); });
  let x0 = null;
  dlg.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  dlg.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50 && skupina.length > 1) ukaz(dx < 0 ? i + 1 : i - 1); });
})();

// 6. formulár: predvyplní byt z adresy (?byt=A1), overí polia (chyba pod poľom) a pripraví e-mail
(function formular() {
  const f = $('#formular'); if (!f) return;
  const byt = (new URLSearchParams(location.search).get('byt') || '').toUpperCase();
  const sel = f.elements.byt;
  if (byt && sel && [...sel.options].some((o) => o.value === byt)) { sel.value = byt; if (!f.elements.sprava.value) f.elements.sprava.value = `Mám záujem o byt ${byt}. `; }
  const SPRAVY = { meno: 'Zadajte meno a priezvisko.', email: 'Zadajte e-mail v tvare meno@domena.sk.', sprava: 'Napíšte správu, na ktorú máme odpovedať.' };
  const chyba = (el, text) => {
    const pole = el.closest('.pole'), p = $('.pole-chyba', pole);
    if (text) { pole.setAttribute('data-chyba', ''); p.textContent = text; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', p.id); }
    else { pole.removeAttribute('data-chyba'); p.textContent = ''; el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  };
  const over = (el) => { const zle = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)); chyba(el, zle ? SPRAVY[el.name] : ''); return !zle; };
  const pozn = $('#formular-pozn');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const zle = $$('[required]', f).filter((el) => !over(el));
    if (zle.length) { pozn.textContent = 'Doplňte, prosím, označené polia.'; zle[0].focus(); return; }
    const v = Object.fromEntries(new FormData(f));
    const predmet = v.byt ? `Záujem o byt ${v.byt} – Visionary Living` : 'Dopyt – Visionary Living';
    const telo = `Meno: ${v.meno}\nTelefón: ${v.telefon || ''}\nE-mail: ${v.email}\nByt: ${v.byt || 'zatiaľ neviem'}\n\n${v.sprava}\n`;
    pozn.textContent = 'Otvárame váš e-mailový program s pripravenou správou.';
    location.href = `mailto:${f.getAttribute('action').replace('mailto:', '')}?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(telo)}`;
  });
  f.addEventListener('input', (e) => { if (e.target.closest('.pole') && e.target.closest('.pole').hasAttribute('data-chyba')) over(e.target); });
})();
