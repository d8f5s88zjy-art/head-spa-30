// Pohyb bez knižnice pre statické weby (vanilla JS, žiadna závislosť, žiadne CDN).
// Robí to isté, čo vo videu V9 robí Motion (Framer Motion) cez React: prvok sa pri skrolovaní
// plynulo objaví, s malým rozostupom a pružným dobehom. Postavené na IntersectionObserver
// a Web Animations API (el.animate), teda na tom istom, na čom stojí aj „mini“ verzia Motion.
//
// Pravidlá (rychly-web, genjutsu motion-principles):
// - len opacity a transform, nič, čo mení rozloženie (CLS 0);
// - data-pohyb nikdy na prvky prvej obrazovky (nadpis úvodu, prvý obraz): tie nesmú čakať na skript;
//   prvok, ktorý je v okne už pri štarte alebo sa objaví skokom (#kotva, švih), sa ukáže bez animácie;
// - prefers-reduced-motion: nič sa nehýbe, všetko je hneď viditeľné (rieši už pohyb.css);
// - obsah je viditeľný aj bez JS a aj keď tento súbor nepríde (záloha v pohyb.css po 3 s);
// - nekonečné animácie (svetlo) sa mimo obrazovky pauzujú (trieda is-off).
//
// Použitie v HTML (skript s defer, štýl pohyb.css):
//   <h2 data-pohyb>…</h2>              nástup len krytím (HEAD SPA 30: obsah sa nesmie vysúvať)
//   <li data-pohyb="vysun">…</li>      nástup krytím a posunom o 16 px (Barbershop 30, GYM KLUB)
//   <header class="svetlo" data-svetlo>  pomalé svetlo v pozadí, pauza mimo obrazovky
(() => {
  const d = document;
  const root = d.documentElement;

  // Svetlo v pozadí: mimo obrazovky pauza (Chrome inak nechá nekonečnú animáciu tikať v hlavnom vlákne).
  const svetla = d.querySelectorAll('[data-svetlo]');
  if (svetla.length && 'IntersectionObserver' in window) {
    const ioSvetlo = new IntersectionObserver((zaznamy) => {
      for (const z of zaznamy) z.target.classList.toggle('is-off', !z.isIntersecting);
    });
    svetla.forEach((el) => ioSvetlo.observe(el));
  }

  const prvky = [...d.querySelectorAll('[data-pohyb]')];
  const ukaz = (el) => el.classList.add('je-viditelny');
  const tiche = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Neskoro (záloha v CSS už prvky ukázala) alebo bez podpory: všetko ukázať bez animácie, nič neskrývať znova.
  if (tiche || performance.now() > 2800 || !('IntersectionObserver' in window) || !Element.prototype.animate) {
    prvky.forEach(ukaz);
    root.dataset.pohybBezi = '1';
    return;
  }

  // Pružný dobeh cez linear() (Baseline od decembra 2023), inak klasická krivka „ease-out-quint“.
  const PRUZINA = CSS.supports('animation-timing-function', 'linear(0, 1)')
    ? 'linear(0, 0.18 6%, 0.5 16%, 0.8 30%, 0.95 45%, 1.01 60%, 1.005 75%, 1)'
    : 'cubic-bezier(0.22, 1, 0.36, 1)';

  const vyska = innerHeight;
  const io = new IntersectionObserver((zaznamy) => {
    let poradie = 0;
    for (const z of zaznamy) {
      if (!z.isIntersecting) continue;
      const el = z.target;
      io.unobserve(el);
      ukaz(el); // konečný stav je bez skrývania; animácia beží „od“ neho (fill: backwards)
      // Skok (príchod cez #kotvu, rýchly švih, hľadanie na stránke): prvok je už v hornej polovici okna,
      // nevchádza zdola. Ukázať bez animácie, neskorý nábeh by pôsobil ako chyba.
      const okno = z.rootBounds ? z.rootBounds.height : vyska;
      if (z.boundingClientRect.top < okno * 0.5) continue;
      const vysun = el.dataset.pohyb === 'vysun';
      el.animate(
        [vysun ? { opacity: 0, transform: 'translateY(16px)' } : { opacity: 0 }, { opacity: 1, transform: 'none' }],
        { duration: vysun ? 620 : 480, delay: Math.min(poradie++, 5) * 50, easing: PRUZINA, fill: 'backwards' }
      );
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  // Najprv všetko prečítať, potom zapisovať (jeden prepočet rozloženia).
  const vOkne = prvky.map((el) => {
    const r = el.getBoundingClientRect();
    return r.top < vyska && r.bottom > 0;
  });
  prvky.forEach((el, i) => (vOkne[i] ? ukaz(el) : io.observe(el)));
  root.dataset.pohybBezi = '1'; // vypne zálohu v CSS; prvky mimo okna čakajú na IntersectionObserver
})();
