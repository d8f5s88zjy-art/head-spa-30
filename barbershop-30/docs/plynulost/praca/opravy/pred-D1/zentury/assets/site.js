// ZENTURY – správanie stránky. Bez knižníc; 3D kladivko (kladivko.min.js, zostavené zo source/kladivko.js a three.js) sa načíta až po zobrazení stránky.
const d = document, html = d.documentElement;
const $ = (s, r = d) => r.querySelector(s);
const $$ = (s, r = d) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mq = (q) => window.matchMedia(q);
const pohyb = !mq('(prefers-reduced-motion: reduce)').matches;
const mys = mq('(hover: hover) and (pointer: fine)').matches;

// 1. úvod: nadpis sa preklopí do svetla (jediná orchestrálna animácia stránky)
requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('uvod-start')));

// 2. hlavička po posunutí stmavne
const hlavicka = $('.hlavicka');
const priPosune = () => hlavicka.classList.toggle('je-posunute', scrollY > 24);
addEventListener('scroll', priPosune, { passive: true }); priPosune();

// 3. menu na telefóne
(function menu() {
  const btn = $('.menu-prepinac'), nav = $('#menu');
  if (!btn) return;
  const nastav = (on) => {
    hlavicka.classList.toggle('menu-otvorene', on);
    btn.setAttribute('aria-expanded', String(on));
    btn.querySelector('.visually-hidden').textContent = on ? 'Zavrieť menu' : 'Menu';
    d.body.style.overflow = on ? 'hidden' : '';
  };
  btn.addEventListener('click', () => nastav(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) nastav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { nastav(false); btn.focus(); } });
  mq('(min-width: 901px)').addEventListener('change', (e) => e.matches && nastav(false));
})();

// 4. teplé svetlo za kurzorom (len myš; na dotyku by svietilo tam, kde už prst nie je)
const svetlo = $('.svetlo');
const kurzor = { x: innerWidth * 0.6, y: innerHeight * 0.4, sx: innerWidth * 0.6, sy: innerHeight * 0.4, beh: false };
if (mys && pohyb && svetlo) {
  const krok = () => {
    kurzor.sx += (kurzor.x - kurzor.sx) * 0.14; kurzor.sy += (kurzor.y - kurzor.sy) * 0.14;
    svetlo.style.setProperty('--x', `${kurzor.sx.toFixed(1)}px`); svetlo.style.setProperty('--y', `${kurzor.sy.toFixed(1)}px`);
    if (Math.abs(kurzor.x - kurzor.sx) + Math.abs(kurzor.y - kurzor.sy) > 0.5) requestAnimationFrame(krok); else kurzor.beh = false;
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    kurzor.x = e.clientX; kurzor.y = e.clientY;
    svetlo.classList.add('je-zapnute');
    if (!kurzor.beh) { kurzor.beh = true; requestAnimationFrame(krok); }
  }, { passive: true });
  d.addEventListener('pointerleave', () => svetlo.classList.remove('je-zapnute'));
}

// 5. obrazy, ktoré odhalí svetlo (stĺpy v sekcii O nás)
$$('.odhal').forEach((el) => {
  if (mys) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
  } else if (pohyb) {
    // na telefóne prejde svetlo po obraze, keď ním posúvate stránku
    const posun = () => {
      const r = el.getBoundingClientRect();
      const p = clamp(1 - (r.top + r.height / 2) / innerHeight, 0, 1);
      el.style.setProperty('--mx', `${(30 + p * 45).toFixed(1)}%`);
      el.style.setProperty('--my', `${(20 + p * 50).toFixed(1)}%`);
    };
    addEventListener('scroll', posun, { passive: true }); posun();
  }
});

// 6. aktívna sekcia: bodky vpravo a menu
(function sekcie() {
  const bodky = $$('.bodky a'), menu = $$('.menu ul a');
  const sekcie = bodky.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((zaznamy) => {
    zaznamy.forEach((z) => {
      if (!z.isIntersecting) return;
      const id = '#' + z.target.id;
      bodky.forEach((a) => a.classList.toggle('je-aktivna', a.getAttribute('href') === id));
      menu.forEach((a) => (a.getAttribute('href') === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sekcie.forEach((s) => io.observe(s));
})();

// 7. nadpisy sekcií sa zaostria, keď vojdú do svetla
(function ohnisko() {
  const io = new IntersectionObserver((zaznamy, o) => zaznamy.forEach((z) => {
    if (z.isIntersecting) { z.target.classList.add('v-ohnisku'); o.unobserve(z.target); }
  }), { threshold: 0.45 });
  $$('.nadpis').forEach((h) => io.observe(h));
})();

// 8. úvod: žiara za kladivkom ide za kurzorom, 3D kladivko sa načíta neskôr
(function uvod() {
  const sekcia = $('.uvod'), scena = $('.uvod-scena'), ziara = $('.uvod-ziara'), platno = $('.uvod-3d');
  if (!sekcia || !scena) return;
  let api = null, viditelne = true;
  const rozmer = { w: scena.clientWidth, h: scena.clientHeight };
  new ResizeObserver(() => { rozmer.w = scena.clientWidth; rozmer.h = scena.clientHeight; rozbeh(); }).observe(scena);
  const ciel = { x: 0.35, y: 0.25 }, stav = { x: 0.35, y: 0.25 };
  let beh = false, t = 0;

  const krok = () => {
    t += 0.016;
    if (!mys) { ciel.x = 0.25 + Math.sin(t * 0.45) * 0.45; ciel.y = 0.2 + Math.cos(t * 0.33) * 0.35; } // na dotyku svetlo pomaly krúži
    stav.x += (ciel.x - stav.x) * 0.08; stav.y += (ciel.y - stav.y) * 0.08;
    // len transform: bez prepočtu rozloženia v každom snímku
    ziara.style.transform = `translate3d(${(rozmer.w * (0.5 + stav.x * 0.38)).toFixed(1)}px, ${(rozmer.h * (0.48 - stav.y * 0.34)).toFixed(1)}px, 0)`;
    api && api.svetlo(stav.x, stav.y);
    if (viditelne && pohyb && (!mys || Math.abs(ciel.x - stav.x) + Math.abs(ciel.y - stav.y) > 0.002)) requestAnimationFrame(krok); else beh = false;
  };
  const rozbeh = () => { if (!beh) { beh = true; requestAnimationFrame(krok); } }; // pri obmedzenom pohybe len jeden snímok

  if (mys) {
    sekcia.addEventListener('pointermove', (e) => {
      const r = scena.getBoundingClientRect();
      ciel.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.3, 1.3);
      ciel.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1.3, 1.3);
      rozbeh();
    }, { passive: true });
  }
  new IntersectionObserver(([z]) => { viditelne = z.isIntersecting; api && api.viditelne(viditelne); viditelne && rozbeh(); }).observe(sekcia);
  addEventListener('scroll', () => api && api.posun(scrollY / Math.max(1, sekcia.offsetHeight)), { passive: true });
  rozbeh();

  // úder kladivkom: klik kamkoľvek do úvodu okrem odkazov
  sekcia.addEventListener('click', (e) => {
    if (e.target.closest('a, button') || !api) return;
    api.uder();
    sekcia.classList.remove('je-uder'); void sekcia.offsetWidth; sekcia.classList.add('je-uder');
  });

  // 3D len ak to zariadenie zvládne a návštevník nechce obmedzený pohyb
  const sporit = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
  if (!pohyb || sporit || !platno) return;
  // bez grafickej karty (softvérové WebGL: SwiftShader, llvmpipe) by 3D zahltilo procesor; ostane obrázok kladivka
  const gl = (() => {
    try {
      const c = d.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl');
      if (!g) return false;
      const ext = g.getExtension('WEBGL_debug_renderer_info');
      const r = String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
      const lose = g.getExtension('WEBGL_lose_context'); lose && lose.loseContext();
      return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
    } catch (e) { return false; }
  })();
  if (!gl && !/[?&]3d\b/.test(location.search)) return; // ?3d vynúti 3D aj pri softvérovom vykresľovaní (testy)
  const nacitaj = () => import('./kladivko.min.js').then((m) => {
    api = m.spusti(platno, { host: scena });
    if (!api) return;
    api.svetlo(stav.x, stav.y); api.viditelne(viditelne);
    api.posun(scrollY / Math.max(1, sekcia.offsetHeight));
    requestAnimationFrame(() => requestAnimationFrame(() => sekcia.classList.add('je-3d')));
  }).catch(() => {});
  const neskor = () => ('requestIdleCallback' in window ? requestIdleCallback(nacitaj, { timeout: 1800 }) : setTimeout(nacitaj, 600));
  if (d.readyState === 'complete') neskor(); else addEventListener('load', neskor, { once: true });
})();

// 9. polica s knihami: posúvanie, natočenie kníh k stredu, ťahanie myšou, šípky
(function polica() {
  const box = $('.polica'), rad = $('.polica-rad');
  if (!box) return;
  const knihy = $$('.kniha', box), tlacidla = $$('.kniha-tlacidlo', box), priecinky = $$('.priecinok', box);
  const sipky = $$('.sipka'), priebeh = $('.polica-priebeh span');
  let posl = box.scrollLeft, tah = 0, raf = 0;

  const prekresli = () => {
    raf = 0;
    const r = box.getBoundingClientRect(), stred = r.left + r.width / 2, pol = r.width / 2;
    knihy.forEach((k) => {
      const b = k.getBoundingClientRect();
      const off = clamp((b.left + b.width / 2 - stred) / pol, -1.4, 1.4);
      k.style.setProperty('--ry', `${(10 - off * 24).toFixed(2)}deg`);
    });
    // rýchlosť posunu nakloní knihy (zotrvačnosť ako vo videu)
    const v = box.scrollLeft - posl; posl = box.scrollLeft;
    tah = pohyb ? clamp(tah * 0.82 + v * 0.35, -22, 22) : 0;
    rad.style.setProperty('--tah', `${tah.toFixed(2)}deg`);
    const max = box.scrollWidth - box.clientWidth;
    const frac = max > 0 ? box.scrollLeft / max : 0;
    priebeh && priebeh.style.setProperty('--p', `${(frac * 400).toFixed(1)}%`);
    sipky.forEach((s) => (s.disabled = s.dataset.smer < 0 ? box.scrollLeft < 4 : box.scrollLeft > max - 4));
    if (Math.abs(tah) > 0.05) raf = requestAnimationFrame(prekresli);
  };
  const naplanuj = () => { if (!raf) raf = requestAnimationFrame(prekresli); };
  box.addEventListener('scroll', naplanuj, { passive: true });
  addEventListener('resize', naplanuj);
  prekresli();

  const krok = () => priecinky[0].getBoundingClientRect().width;
  sipky.forEach((s) => s.addEventListener('click', () => box.scrollBy({ left: +s.dataset.smer * krok() * (innerWidth > 1100 ? 2 : 1), behavior: pohyb ? 'smooth' : 'auto' })));

  // ťahanie myšou (dotyk posúva prirodzene)
  let start = null, bolTah = false;
  box.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    start = { x: e.clientX, s: box.scrollLeft }; bolTah = false;
  });
  addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    if (!bolTah && Math.abs(dx) > 6) { bolTah = true; box.classList.add('tahanie'); }
    if (bolTah) box.scrollLeft = start.s - dx;
  });
  addEventListener('pointerup', () => {
    if (!start) return;
    start = null;
    if (!bolTah) return;
    box.classList.remove('tahanie');
    // dotiahne na najbližší priečinok
    const r0 = box.getBoundingClientRect().left + parseFloat(getComputedStyle(box).scrollPaddingLeft || 0);
    let naj = priecinky[0], min = Infinity;
    priecinky.forEach((p) => { const dd = Math.abs(p.getBoundingClientRect().left - r0); if (dd < min) { min = dd; naj = p; } });
    box.scrollBy({ left: naj.getBoundingClientRect().left - r0, behavior: pohyb ? 'smooth' : 'auto' });
  });
  box.addEventListener('click', (e) => { if (bolTah) { e.preventDefault(); e.stopPropagation(); bolTah = false; } }, true);

  // šípky na klávesnici medzi knihami
  tlacidla.forEach((b, i) => b.addEventListener('keydown', (e) => {
    const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tlacidla.length - 1 : -2;
    if (j === -2 || !tlacidla[j]) return;
    e.preventDefault(); tlacidla[j].focus({ preventScroll: true });
    tlacidla[j].scrollIntoView({ inline: 'center', block: 'nearest', behavior: pohyb ? 'smooth' : 'auto' });
  }));
  tlacidla.forEach((b) => b.addEventListener('click', () => otvorKnihu(b)));
})();

// 10. otvorená kniha (dialóg)
const citaren = $('.citaren');
let aktivnaKniha = null;
function otvorKnihu(btn) {
  if (!citaren || typeof citaren.showModal !== 'function') return;
  const obsah = $('#kniha-' + btn.dataset.kniha);
  if (!obsah) return;
  aktivnaKniha = btn;
  const kniha = $('.kniha', btn), otvorena = $('.otvorena', citaren);
  otvorena.style.setProperty('--koza', kniha.style.getPropertyValue('--koza'));
  const nazov = $('h3', obsah).textContent;
  $('.predsadka', citaren).dataset.titul = nazov;
  const ciel = $('.list-obsah', citaren);
  ciel.replaceChildren(...obsah.cloneNode(true).childNodes);
  const h = $('h3', ciel); h.id = 'citaren-nadpis'; h.tabIndex = -1;
  $('[data-opytat]', citaren).dataset.sluzba = nazov;
  citaren.classList.remove('zatvara', 'otvara');
  citaren.showModal();
  void citaren.offsetWidth; citaren.classList.add('otvara');
  citaren.scrollTop = 0; $('.list-pravy', citaren).scrollTop = 0;
  h.focus({ preventScroll: true });
}
function zavriKnihu(potom) {
  if (!citaren.open) return;
  citaren.classList.add('zatvara');
  setTimeout(() => { citaren.close(); citaren.classList.remove('zatvara', 'otvara'); potom && potom(); }, pohyb ? 280 : 0);
}
if (citaren) {
  citaren.addEventListener('cancel', (e) => { e.preventDefault(); zavriKnihu(); });
  citaren.addEventListener('click', (e) => {
    if (e.target === citaren || e.target.closest('[data-zavriet]')) zavriKnihu();
    const opytat = e.target.closest('[data-opytat]');
    if (opytat) {
      e.preventDefault();
      const sluzba = opytat.dataset.sluzba;
      zavriKnihu(() => {
        const sprava = $('#formular textarea');
        if (sprava && !sprava.value.trim()) sprava.value = `Mám záujem o službu ${sluzba}. `;
        $('#kontakt').scrollIntoView({ behavior: pohyb ? 'smooth' : 'auto' });
        setTimeout(() => sprava && sprava.focus({ preventScroll: true }), pohyb ? 700 : 0);
      });
    }
  });
}

// 11. formulár: pripraví e-mail (web nemá server, správu odošle váš e-mailový program)
(function formular() {
  const f = $('#formular');
  if (!f) return;
  const pozn = $('#formular-pozn');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const zle = $$('[required]', f).filter((el) => !el.value.trim());
    $$('.pole', f).forEach((p) => p.removeAttribute('data-chyba'));
    if (zle.length) {
      zle.forEach((el) => el.closest('.pole').setAttribute('data-chyba', ''));
      pozn.textContent = 'Vyplňte, prosím, meno, kontakt a s čím vám pomôžeme.';
      zle[0].focus();
      return;
    }
    const v = Object.fromEntries(new FormData(f));
    const predmet = `Konzultácia: ${v.forma}`;
    const telo = `Meno: ${v.meno}\nKontakt: ${v.spojenie}\nForma poradenstva: ${v.forma}\n\n${v.sprava}\n`;
    pozn.textContent = 'Otvárame váš e-mailový program s pripravenou správou.';
    location.href = `mailto:info@zentury.sk?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(telo)}`;
  });
  f.addEventListener('input', (e) => { const p = e.target.closest('.pole'); if (p && e.target.value.trim()) p.removeAttribute('data-chyba'); });
})();
