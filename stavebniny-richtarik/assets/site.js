/* Stavebniny Richtárik: menu na telefóne, objavovanie pri skrolovaní, vyhľadávanie v katalógu, lightbox s listovaním.
   Prechody medzi stránkami sú v skripte v <head> (zdroj/prechody.js), pohybový systém v site.css (README, Pohyb a prechody). */
(function () {
  var d = document;
  // RP2-15: Safari na iPhone ukáže stav :active (stlačenie dlaždice a tlačidla) len pri poslucháčovi touchstart; prázdny
  // a pasívny poslucháč nič nemení na posune ani na ťuknutí (overiť na skutočnom iPhone, README)
  d.addEventListener('touchstart', function () {}, { passive: true });
  var scr = d.querySelector('script[src$="assets/site.js"]');
  var pre = scr ? scr.getAttribute('src').replace('assets/site.js', '') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // fotky pri posune odhaľuje CSS (časová os posunu, beží v kompozítore); paralaxu a pruh priebehu robí skript len
  // v prehliadači bez nej
  var css_posun = !reduce && !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  var ric = window.requestIdleCallback || function (f) { return setTimeout(f, 1); };
  // RP1-05: práca, ktorá nemusí byť v prvej snímke (odhalenia, lightbox, pás značiek, služby, počítadlá), beží až po
  // prechode stránky (vtBeh uloží skript v <head> pri pagereveal), inak v nečinnom čase; na úvode s uvítaním až po ňom.
  // Prvá snímka novej stránky tak nesie len štýl, rozloženie a menu (meranie: dlhá snímka na začiatku prechodu).
  function poPrechode(f) {
    var ok = 0, g = function () { if (!ok) { ok = 1; f(); } };
    var cakaj = function (vt) {
      if (vt) { vt.finished.then(function () { setTimeout(g, 30); }, g); setTimeout(g, 1500); }
      else if (d.documentElement.classList.contains('br-ide') && !window.brKoniec) addEventListener('br-koniec', function () { ric(g, { timeout: 600 }); }, { once: true });
      else ric(g, { timeout: 600 });
    };
    if ('vtBeh' in window) cakaj(window.vtBeh);
    else if ('onpagereveal' in window) addEventListener('pagereveal', function (e) { cakaj(e.viewTransition); }, { once: true });
    else cakaj(null);
  }

  // menu: zatvorené je inert (mimo fokusu aj čítačky), otvorené je modálny dialóg – fokus na Zavrieť, Tab ostáva v menu,
  // po zatvorení sa fokus vráti na tlačidlo menu
  var b = d.querySelector('.menu-btn'), dr = d.getElementById('drawer');
  function fokusovatelne(el) { return Array.prototype.slice.call(el.querySelectorAll('a[href], button:not([hidden])')).filter(function (x) { return !x.hidden && x.offsetParent !== null; }); }
  function pasca(el, e) {   // Tab a Shift+Tab krúžia len v otvorenom dialógu
    var f = fokusovatelne(el); if (!f.length) return;
    var prvy = f[0], posl = f[f.length - 1], akt = d.activeElement;
    if (e.shiftKey && (akt === prvy || !el.contains(akt))) { e.preventDefault(); posl.focus(); }
    else if (!e.shiftKey && (akt === posl || !el.contains(akt))) { e.preventDefault(); prvy.focus(); }
  }
  function open(o) {
    var bolo = dr.classList.contains('open');
    dr.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); d.body.style.overflow = o ? 'hidden' : '';
    dr.inert = !o;
    if (o) dr.querySelector('.close').focus();
    else if (bolo) b.focus({ preventScroll: true });
  }
  if (b && dr) {
    if (dr.inert !== !dr.classList.contains('open')) dr.inert = !dr.classList.contains('open');   // v HTML už inert
    b.addEventListener('click', function () { open(!dr.classList.contains('open')); });
    dr.querySelector('.close').addEventListener('click', function () { open(false); });
    // RP1-13: odkaz na inú stránku pri prechode medzi stránkami menu nezatvorí (panel odíde v prechode doprava, skript
    // v <head> ho pomenuje), zatvorí sa pri návrate z vyrovnávacej pamäte; tel:, kotva a prehliadač bez prechodu hneď
    var vtOk = 'onpagereveal' in window && !reduce;
    dr.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var u = null; try { u = new URL(a.href, location.href); } catch (x) {}
        if (vtOk && u && u.origin === location.origin && u.pathname !== location.pathname && !(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) return;
        open(false);
      });
    });
    addEventListener('pageshow', function (e) { if (e.persisted && dr.classList.contains('open')) open(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Tab' && dr.classList.contains('open')) pasca(dr, e); });
  }
  // rok v päte, zbalenie päty a zvýraznenie dnešného dňa menia DOM: až po prechode (päta je pod oknom), aby počas
  // animácie prechodu nebolo treba znova štýlovať živú novú stránku (RP1-05, Späť na dlhý úvod)
  poPrechode(function () { var r = d.getElementById('rok'); if (r && r.textContent != new Date().getFullYear()) r.textContent = new Date().getFullYear(); });

  // päta: na telefóne (do 700 px) sú Stránky a Katalóg zbalené, na širšej obrazovke vždy otvorené (nadpis sa nedá zbaliť,
  // nie je ani zastávkou Tab). Bez JS ostanú otvorené.
  var fzb = d.querySelectorAll('footer details.f-zb');
  if (fzb.length && window.matchMedia) poPrechode(function () {
    var fmq = window.matchMedia('(max-width:700px)');
    var fnastav = function () { fzb.forEach(function (x) { x.open = !fmq.matches; x.querySelector('summary').tabIndex = fmq.matches ? 0 : -1; }); };
    fnastav();
    if (fmq.addEventListener) fmq.addEventListener('change', fnastav); else if (fmq.addListener) fmq.addListener(fnastav);
    fzb.forEach(function (x) { x.querySelector('summary').addEventListener('click', function (e) { if (!fmq.matches) e.preventDefault(); }); });
  });

  // tieň lišty po odskrolovaní
  var top = d.querySelector('.top');
  function onScroll() { var s = window.scrollY > 8; if (top && top.classList.contains('scrolled') !== s) top.classList.toggle('scrolled', s); }
  window.addEventListener('scroll', onScroll, { passive: true }); poPrechode(onScroll);

  // RP1-01: odhalenie textov, kariet a štítkov pri posune, spúšťané s časom (site.css, Pohybový systém časť 4A).
  // Prvok, ktorý je pri štarte v okne alebo nad ním (aj vo vodorovnom páse), ostane bez animácie a bez triedy; prvok pod
  // oknom dostane .c (čaká, skrytý) a pri vstupe do okna .v, odhalenie dobehne samo. Rozmery hlási IntersectionObserver
  // (žiadne čítanie rozloženia v skripte). Vnorené zhody (napr. .cta-pas .cta a jej tlačidlá) odhaľuje len vonkajší prvok.
  // Bez JS, pri „obmedziť pohyb“ a bez IntersectionObserver nič nečaká.
  var ODH = 'main .head .eyebrow,main .head h2,main .head .lede,main .head>.btn,main .head>div>.btn,.rv:not(.galeria):not(.karta):not(.facts),.karta,' +
    '.cats>.cat,.deals>.deal,.sub-grid>.sub,.kgrid>.kbox,.facts>div,.disc>div,.srvs>.srv,.cennik>.cen,.band .wrap>*,.onas .tx>*,' +
    '.kontakt-teaser .grid>div>*,.cta-pas .wrap>div>*,.cta-pas .cta,.zlavy .grid>div:first-child>:not(.disc),.sort-note,.akcia-tag,.novs>.nov,.zt span,.onas .year,' +
    '.galeria>a:nth-child(n+9)';   // RP2-09: fotky galérie od 9. v mriežke (prvých 8 odhaľuje časová os posunu v CSS)
  function odhalenia() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var vs = d.querySelectorAll(ODH), mn = new Set(), zoz = [];
    vs.forEach(function (el) { mn.add(el); });
    vs.forEach(function (el) {
      if (el.closest('.page-head,.uv,.br,.lb,.drawer')) return;
      for (var p = el.parentElement; p; p = p.parentElement) if (mn.has(p)) return;
      zoz.push(el);
    });
    // druhý pozorovateľ bez okraja: čo z čakajúcich je v okne aspoň okrajom (spodných 8 % okna); keď posun 180 ms stojí,
    // odhalí sa aj to, takže v pokoji nie je v okne nič skryté
    var kraj = new Set(), tp = 0;
    var io0 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) kraj.add(e.target); else kraj.delete(e.target); }); });
    function odhal(el) { el.classList.add('v'); io.unobserve(el); io0.unobserve(el); kraj.delete(el); }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var el = e.target, r = e.boundingClientRect;
        if (!el._odh) {
          el._odh = 1;
          if ((r.width || r.height) && r.top < innerHeight && r.left < innerWidth && r.right > 0) { io.unobserve(el); return; }
          el.classList.add('c'); io0.observe(el);
        }
        if (e.isIntersecting) odhal(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    zoz.forEach(function (el) { io.observe(el); });
    var pokoj = function () { kraj.forEach(odhal); };
    addEventListener('scroll', function () { clearTimeout(tp); tp = setTimeout(pokoj, 180); }, { passive: true });
  }
  poPrechode(odhalenia);

  // paralaxa: fotky v úvode, v hlavičke a v páse sa posúvajú pomalšie než stránka; len počítač s myšou
  var desk = window.matchMedia && window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)').matches;
  var pars = desk && !reduce && !css_posun ? Array.prototype.slice.call(d.querySelectorAll('[data-parallax]')) : [];
  var prog = d.createElement('div'); prog.className = 'progress'; poPrechode(function () { d.body.appendChild(prog); });
  var ticking = false, vh = window.innerHeight, maxY = 0, lastW = -1;
  function measure() { vh = window.innerHeight; maxY = d.documentElement.scrollHeight - vh; }
  function move() {
    var y = window.scrollY;
    // najprv všetky čítania, potom zápisy (žiadny vynútený prepočet rozloženia medzi nimi)
    var boxes = pars.map(function (el) { return el.parentElement.getBoundingClientRect(); });
    pars.forEach(function (el, i) {
      var box = boxes[i];
      if (box.bottom < -100 || box.top > vh + 100) return;
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.28;
      var rel = box.top + box.height / 2 - vh / 2;  // vzdialenosť stredu prvku od stredu okna
      el.style.transform = 'translate3d(0,' + (-rel * f).toFixed(1) + 'px,0)';
    });
    var w = maxY > 0 ? Math.min(100, Math.round(y / maxY * 200) / 2) : 0;
    // pruh priebehu cez transform (skladá ho kompozítor): zmena šírky by v každej snímke skrolovania prepočítala rozloženie
    // a prekreslila stránku
    if (w !== lastW && !css_posun) { prog.style.transform = 'scaleX(' + (w / 100) + ')'; lastW = w; }   // s časovou osou ho kreslí CSS
    ticking = false;
  }
  if (pars.length || !css_posun) {   // s časovou osou posunu netreba pri posune spúšťať nič
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    window.addEventListener('resize', function () { measure(); move(); });
    window.addEventListener('load', measure);
    measure(); move();
  }

  // 3D náklon kariet a zákazníckej karty za kurzorom je vypnutý (pokojnejší web)

  // otváracie hodiny: dnešný deň sa zvýrazní (data-dni="1-5" pondelok až piatok, "6" sobota); bez JS ostávajú hodiny
  // rovnaké, len bez zvýraznenia. Neuvádza sa „otvorené“ ani „zatvorené“ (sviatky web nepozná).
  poPrechode(function () {
    var den = new Date().getDay();
    Array.prototype.forEach.call(d.querySelectorAll('[data-dni]'), function (el) {
      var r = el.getAttribute('data-dni').split('-'), od = +r[0], po = +(r[1] || r[0]);
      if (den >= od && den <= po) el.classList.add('dnes');
    });
  });

  // úvod: strih zásob. Skutočné fotky tehál, pórobetónu (bez dokreslených paliet), dlažieb a reziva dopadnú ako výtlačky
  // (rovno, bez natočenia) na fotku predajne, potom odídu a štítok „Naša predajňa“ sa vrazí. Všetok pohyb robí CSS (kompozítor),
  // skript len pripraví zábery zo <template>, počká na ich dekódovanie a po 4,5 s ich odstráni (časy sú 1,5-násobok
  // pôvodných, rovnako ako v site.css; majiteľ 9. 11. 2026: pomalšie animácie). Sám sa spustí len pri prvej
  // návšteve bez uvítania (trieda uv-ide zo skriptu v <head>, „bez obmedzenia pohybu“), nie keď stránka prišla prechodom
  // (trieda vt, napr. Späť na úvod, RP1-08), nie pri šetrení dát, nie keď zákazník už posúva, ťuká, píše alebo je vo
  // vyhľadávaní, a len raz za reláciu. Po uvítaní (br-ide) sa nespustí sám (hook odovzdala brána, RP1-06): ostane len
  // tlačidlo „Prehrať úvod“ a zábery sa stiahnu až po jeho stlačení. Odchod zo stránky strih hneď ukončí (aj pre Späť).
  (function () {
    var h = d.documentElement, ram = d.querySelector('.uv-ram'), tpl = d.getElementById('uv-zabery');
    var brana = h.classList.contains('br-ide');
    // farebná téma (predvolená): úvod je fotka cez celú výšku s názvom a heslom v červenom paneli, strih zásob ani tlačidlo
    // Prehrať úvod sa nepoužívajú (zábery sa nesťahujú); svetlá a tmavá téma na porovnanie ich majú ako doteraz
    if (h.getAttribute('data-tema') === 'farebna') return;
    if (!ram || !tpl || !(brana || h.classList.contains('uv-ide'))) return;
    var box = ram.querySelector('.uv-zabery'), znova = ram.querySelector('.uv-znova'), hlavna = ram.querySelector('.uv-dvor img');
    var karty = null, pripravene = false, beh = 0, zastavene = false, tc = null, ss = null;
    try { ss = window.sessionStorage; } catch (e) { ss = null; }
    var setri = navigator.connection && navigator.connection.saveData;
    function uz() { try { return ss && ss.getItem('uv-videne') === '1'; } catch (e) { return false; } }
    function odober() { if (karty) karty.forEach(function (k) { if (k.parentNode) k.parentNode.removeChild(k); }); }
    function tlacidlo() { if (znova && !setri) znova.hidden = false; }
    function dokonci() {   // konečný stav: zábery preč, štítok stojí, tlačidlo na nové prehratie
      clearTimeout(beh); beh = 0;
      ram.classList.remove('uv-mont', 'uv-stop'); ram.classList.add('uv-hotovo');
      odober();
      if (tc && tc.parentNode) tc.parentNode.removeChild(tc);
      tc = null; tlacidlo();
    }
    function koniec(rychlo) {
      clearTimeout(beh); beh = 0;
      if (rychlo) ram.classList.add('uv-stop');
      setTimeout(dokonci, rychlo ? 200 : 0);
    }
    function spusti() {
      if (!karty || zastavene) return;
      if (znova) znova.hidden = true;
      ram.classList.remove('uv-hotovo');
      karty.forEach(function (k) { if (k.parentNode !== box) box.appendChild(k); });   // pri prvom štarte už čakajú skryté v ráme
      tc = d.createElement('span'); tc.className = 'uv-tc'; tc.setAttribute('aria-hidden', 'true'); tc.textContent = '01 / 04'; ram.appendChild(tc);
      var i = 1; [830, 1580, 2250].forEach(function (t) { setTimeout(function () { if (tc) tc.textContent = '0' + (++i) + ' / 04'; }, t); });
      void ram.offsetWidth;   // nový štart animácií pri „Prehrať úvod“
      ram.classList.add('uv-mont');
      try { if (ss) ss.setItem('uv-videne', '1'); } catch (e) {}
      beh = setTimeout(function () { koniec(false); }, 4530);
    }
    function stop() {
      zastavene = true;
      if (ram.classList.contains('uv-mont')) koniec(true);
      else if (pripravene) { odober(); tlacidlo(); }   // zastavené pred štartom: zábery preč, tlačidlo ostane
    }
    ['wheel', 'touchstart', 'keydown'].forEach(function (n) {
      window.addEventListener(n, function (e) { if (n !== 'keydown' || e.key !== 'Tab') stop(); }, { passive: true, capture: true, once: true });
    });
    window.addEventListener('scroll', function onS() { if (window.scrollY > 24) { stop(); window.removeEventListener('scroll', onS); } }, { passive: true });
    d.addEventListener('focusin', function (e) { if (e.target && e.target.id === 'q') stop(); });
    addEventListener('pagehide', function () { if (ram.classList.contains('uv-mont')) dokonci(); });
    // priprav(naZiadost): zábery sa stiahnu a dekódujú až po fotke predajne; naZiadost = tlačidlo, spustí sa hneď po dekódovaní
    function priprav(naZiadost) {
      if (karty || setri) return;
      var frag = tpl.content.cloneNode(true);
      karty = [].slice.call(frag.querySelectorAll('.uv-z'));
      karty.forEach(function (k) { box.appendChild(k); });   // skryté (visibility), sťahujú a dekódujú sa až teraz
      Promise.all(karty.map(function (k) { var im = k.querySelector('img'); return im.decode ? im.decode() : Promise.resolve(); })).then(function () {
        pripravene = true;
        if (naZiadost) { if (!zastavene) spusti(); return; }
        if (zastavene || uz() || h.classList.contains('vt') || window.scrollY > 24 || performance.now() > 3900) { odober(); tlacidlo(); return; }
        // zábery ostanú skryté v ráme a štart len prepne triedu: v prvej snímke strihu sa nič nevkladá ani nerozmiestňuje
        setTimeout(spusti, Math.max(0, 1500 - performance.now()));
      }, function () { odober(); karty = null; });
    }
    if (znova) znova.addEventListener('click', function () {
      zastavene = false;
      if (!karty) priprav(true); else if (!ram.classList.contains('uv-mont')) spusti();
    });
    if (brana) {   // po uvítaní len tlačidlo (bez sťahovania záberov); úvod je v tejto relácii videný (RP2-14: ďalšia
      // návšteva úvodu v tej istej relácii strih sama nespustí, ostane tlačidlo Prehrať úvod)
      try { if (ss) ss.setItem('uv-videne', '1'); } catch (e) {}
      if (window.brKoniec || !d.querySelector('body>.br')) tlacidlo(); else addEventListener('br-koniec', tlacidlo, { once: true });
      return;
    }
    if (hlavna && !hlavna.complete) { hlavna.addEventListener('load', function () { priprav(); }, { once: true }); setTimeout(priprav, 2500); }
    else priprav();
  })();

  // prechod medzi stránkami: skript v <head> (View Transitions); prehliadač bez podpory má okamžitú navigáciu bez čakania.
  // Späť na stránku, ktorá sa načítava znova (nie je vo vyrovnávacej pamäti prehliadača): fotka dlaždice, do ktorej sa
  // vracia hlavička, ešte nie je dekódovaná. Prelnutie do dlaždice počká na fotku (najviac 0,9 s), dovtedy je v dlaždici
  // fotka hlavičky, takže dlaždica sa nikdy neukáže ako prázdny rám (skript v <head> odovzdá prechod a fotku vo vtCakaj).
  // RP1-09: let a strih sú aj na počítači; keď prechod na zariadení seká (aspoň 2 snímky nad 50 ms po prvých 100 ms
  // animácie, prvá snímka novej stránky sa nepočíta) a stane sa to v relácii dvakrát, skript v <head> pustí ďalšie
  // prechody v ľahkej verzii bez zdieľaných prvkov a bez strihu (sessionStorage vt-lahke)
  (function () {
    var ss = null; try { ss = window.sessionStorage; if (ss.getItem('vt-lahke') > 1) return; } catch (e) { return; }
    function meraj(vt) {
      if (!vt) return;
      vt.ready.then(function () {
        var t0 = performance.now(), l = t0, n = 0, b = 1;
        var f = function (x) { if (!b) return; if (x - t0 > 100 && x - l > 50) n++; l = x; requestAnimationFrame(f); };
        requestAnimationFrame(f);
        vt.finished.then(function () { b = 0; if (n > 1) try { ss.setItem('vt-lahke', (+ss.getItem('vt-lahke') || 0) + 1); } catch (e) {} }, function () { b = 0; });
      }, function () {});
    }
    if ('vtBeh' in window) meraj(window.vtBeh); else if ('onpagereveal' in window) addEventListener('pagereveal', function (e) { meraj(e.viewTransition); }, { once: true });
  })();
  var vc = window.vtCakaj;
  if (vc && vc[0].ready) vc[0].ready.then(function () {
    var an = d.getAnimations().filter(function (a) { return a.effect && a.effect.pseudoElement === '::view-transition-new(foto)'; });
    var pusti = function () { an.forEach(function (a) { a.play(); }); };
    an.forEach(function (a) { a.pause(); });
    vc[1].loading = 'eager';
    (vc[1].decode ? vc[1].decode() : Promise.resolve()).then(pusti, pusti); setTimeout(pusti, 900);
  }, function () {});

  poPrechode(function () {
  // pás značiek: tlačidlo Zastaviť pohyb (pás sa hýbe len s JS a bez obmedzenia pohybu, pauza aj pod myšou a pri fokuse)
  var mq = d.querySelector('.marquee'), mqb = mq && mq.querySelector('.mq-stop');
  if (mqb && !reduce) {
    mqb.hidden = false;
    mqb.addEventListener('click', function () {
      var stoj = mqb.getAttribute('aria-pressed') !== 'true';
      mqb.setAttribute('aria-pressed', String(stoj)); mq.classList.toggle('stoj', stoj);
    });
  }

  // služby: aktívna položka podľa polohy v okne
  var srvs = d.querySelectorAll('.srvs .srv');
  if (srvs.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    srvs.forEach(function (el) { so.observe(el); });
  }

  // počítadlá: čísla nabehnú, keď sa dostanú do záberu
  var counters = d.querySelectorAll('[data-count]');
  if (counters.length) {
    function run(el) {
      var raw = el.getAttribute('data-count'), dec = raw.indexOf(',') >= 0 ? raw.split(',')[1].length : 0;
      var target = parseFloat(raw.replace(',', '.')), t0 = null, dur = 1400;
      function step(t) {
        if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        // hodnota existujúceho textového uzla (textContent by v každej snímke vymenil uzol: viac práce s rozložením)
        var t = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null, v = p < 1 ? (target * e).toFixed(dec).replace('.', ',') : raw;
        if (t) { if (t.nodeValue !== v) t.nodeValue = v; } else el.textContent = v;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window) || reduce) { /* čísla ostanú, ako sú */ }
    else {
      var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } }); }, { threshold: 0.4 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }
  });

  // lightbox: všetky fotky na stránke, šípky, popisok, počítadlo
  var lb = d.getElementById('lb');
  if (lb) {
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Fotografia');
    lb.innerHTML = '<button class="lb-x" type="button" aria-label="Zavrieť">&times;</button><button class="lb-n lb-p" type="button" aria-label="Predchádzajúca">&#8249;</button><figure><img src="" alt=""><figcaption><span></span><small></small></figcaption></figure><button class="lb-n lb-nx" type="button" aria-label="Ďalšia">&#8250;</button>';
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption span'), cnt = lb.querySelector('figcaption small');
    var prev = lb.querySelector('.lb-p'), next = lb.querySelector('.lb-nx');
    var links = [], cur = 0, spat = null;
    function all() { return Array.prototype.slice.call(d.querySelectorAll('a[data-lb]')); }
    function caption(a) {
      var c = a.getAttribute('data-cap'); if (c) return c;
      var f = a.closest('figure'); var fc = f && f.querySelector('figcaption'); if (fc && fc.textContent.trim() && !fc.closest('.lb')) return fc.textContent.trim();
      var card = a.closest('.prod, .art, .album, .nov, .cat'); var h = card && card.querySelector('h3, h2'); if (h) return h.textContent.trim();
      var im = a.querySelector('img'); return im && im.alt && !/fotografia/i.test(im.alt) ? im.alt : '';
    }
    // pohyb lightboxu (len bez obmedzenia pohybu): fotka sa pri otvorení prenesie z miesta náhľadu (FLIP, len transform
    // a opacity), pri zatvorení sa vráti, pri listovaní príde zo strany. RP1-03: nová fotka je skrytá, kým nie je
    // dekódovaná (najviac 250 ms), potom sa hneď spustí let s fill backwards, takže sa nikdy neukáže čiastočne načítaná
    // ani dvakrát; popisok sa objaví až po lete. Podklad sa medzitým prelína (CSS). Stránka pod lightboxom sa nezamyká
    // cez overflow (zmena posuvníka by prepočítala celé rozloženie): koliesko a posun prstom zachytí sám lightbox.
    var pohyb = !reduce && !!img.animate, KRIVKA = 'cubic-bezier(.3,0,.15,1)', fc = lb.querySelector('figcaption'), tok = 0;
    function nahlad(a) { var t = a && a.querySelector('img'), r = t && t.getBoundingClientRect(); return r && r.width && r.bottom > 0 && r.top < innerHeight ? r : null; }
    function hotova(cb) {   // fotka lightboxu dekódovaná, najviac 250 ms
      var ok = false, f = function (v) { if (!ok) { ok = true; cb(v); } };
      if (img.decode) img.decode().then(function () { f(true); }, function () { f(false); }); else f(img.complete);
      setTimeout(function () { f(false); }, 250);
    }
    function z(r, q) { var s = r.width / q.width; return 'translate(' + (r.left + r.width / 2 - q.left - q.width / 2) + 'px,' + (r.top + r.height / 2 - q.top - q.height / 2) + 'px) scale(' + s + ')'; }
    function nastav(i) {   // obsah fotky bez zobrazenia (skrytá do dekódovania)
      cur = (i + links.length) % links.length; var a = links[cur];
      img.style.opacity = 0;
      img.src = a.getAttribute('href'); img.alt = caption(a) || 'Fotografia';
      cap.textContent = caption(a); cnt.textContent = links.length > 1 ? (cur + 1) + ' / ' + links.length : '';
      prev.hidden = next.hidden = links.length < 2;
      return ++tok;
    }
    // RP2-08: listovanie bez prázdneho podkladu. Nová fotka sa stiahne a dekóduje mimo lightboxu (new Image), stará
    // ostáva viditeľná; až keď je nová hotová, stará odíde (120 ms lineárne k 0,25 a 20 px proti smeru) a v tej istej
    // snímke sa vymení za novú, ktorá príde zo strany (0,25 → 1, ±28 px, 260 ms). Kým nová nie je hotová, ostáva stará
    // (žiadna snímka bez fotky). Susedné fotky sa predčítajú po otvorení a po každom listovaní (nie pri šetrení dát).
    var setri = navigator.connection && navigator.connection.saveData, odch = null, pred = [];
    function predcitaj() {
      if (setri || links.length < 2) return;
      pred = [cur - 1, cur + 1].map(function (i) {
        var p = new Image(); p.src = links[(i + links.length) % links.length].getAttribute('href');
        if (p.decode) p.decode().catch(function () {});
        return p;
      });
    }
    function show(i, smer) {
      if (odch) { odch.cancel(); odch = null; }   // rýchle listovanie: stará fotka sa vráti, nová príde, až bude hotová
      cur = (i + links.length) % links.length;
      var a = links[cur], u = a.getAttribute('href'), t = ++tok, p = new Image(), hot = 0;
      var vymen = function () {
        if (t !== tok) return;   // medzitým ďalšie listovanie alebo zatvorenie
        if (odch) { odch.cancel(); odch = null; }
        img.src = u; img.alt = caption(a) || 'Fotografia'; img.style.opacity = ''; fc.style.opacity = '';
        cap.textContent = caption(a); cnt.textContent = links.length > 1 ? (cur + 1) + ' / ' + links.length : '';
        if (smer && pohyb) img.animate([{ opacity: .25, transform: 'translateX(' + (smer * 28) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: KRIVKA, fill: 'backwards' });
        predcitaj();
      };
      var hotovo = function () {
        if (hot || t !== tok) return; hot = 1;
        if (!smer || !pohyb) return vymen();
        odch = img.animate([{ opacity: 1, transform: 'none' }, { opacity: .25, transform: 'translateX(' + (-smer * 20) + 'px)' }], { duration: 120, easing: 'linear', fill: 'forwards' });
        odch.finished.then(vymen, function () {});
      };
      p.src = u;
      (p.decode ? p.decode() : Promise.reject()).then(hotovo, function () { if (p.complete) hotovo(); else p.onload = p.onerror = hotovo; });
    }
    // každý odkaz na zväčšenie má meno pre čítačku: popisok fotky, inak „Zväčšiť fotografiu“
    poPrechode(function () { all().forEach(function (a) { if (!a.getAttribute('aria-label')) { var c = caption(a); a.setAttribute('aria-label', c ? 'Zväčšiť: ' + c : 'Zväčšiť fotografiu'); } }); });
    function openLb(a) {
      var r = pohyb ? nahlad(a) : null;
      links = all(); spat = a;
      var t = nastav(links.indexOf(a));
      lb.hidden = false; lb.querySelector('.lb-x').focus();
      if (pohyb) fc.style.opacity = 0;
      hotova(function (ok) {
        if (t !== tok) return;
        var q = img.getBoundingClientRect();
        img.style.opacity = ''; fc.style.opacity = '';
        if (!pohyb) return;
        if (r && ok && q.width) img.animate([{ transform: z(r, q), opacity: .7 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: KRIVKA, fill: 'backwards' });
        else img.animate([{ opacity: .4, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: KRIVKA, fill: 'backwards' });
        fc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 300, fill: 'backwards' });   // popisok až po lete
      });
      predcitaj();
    }
    function zavri() { if (odch) { odch.cancel(); odch = null; } lb.hidden = true; tok++; img.src = ''; img.style.opacity = ''; fc.style.opacity = ''; if (spat) { spat.focus({ preventScroll: true }); spat = null; } }
    function close() {
      if (lb.hidden || lb.inert) return;   // počas zatvárania druhé zatvorenie nič nerobí
      var r = pohyb ? nahlad(links[cur]) : null, q = img.getBoundingClientRect();
      if (!pohyb) return zavri();
      var an = [lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear' })];
      if (r && q.width) an.push(img.animate([{ transform: 'none' }, { transform: z(r, q) }], { duration: 260, easing: KRIVKA }));
      lb.inert = true;
      an[0].finished.then(function () { lb.inert = false; zavri(); }, function () { lb.inert = false; zavri(); });
    }
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lb]'); if (!a) return;
      e.preventDefault(); openLb(a);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    prev.addEventListener('click', function () { show(cur - 1, -1); });
    next.addEventListener('click', function () { show(cur + 1, 1); });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });   // stránka pod lightboxom sa neposúva
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50 && links.length > 1) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Tab') pasca(lb, e);
      if (e.key === 'Escape') close();
      if (/^(PageUp|PageDown|Home|End|ArrowUp|ArrowDown)$/.test(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft') show(cur - 1, -1);
      if (e.key === 'ArrowRight') show(cur + 1, 1);
    });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr && dr.classList.contains('open')) open(false); });

  // prehliadka predajne 360° (.p360; build.py prehliadka_blok, zdroj/panorama.js): majiteľ chce otáčať sa po predajni priamo
  // na stránke, nikoho neposielať na Google. Pred kliknutím sa nič nenačíta (0 požiadaviek na Google, panoráma ani prehliadač
  // nie sú stiahnuté, tlačidlo je skryté, kým komponent nemá zdroj). Po kliknutí sa podľa data-panorama-src vloží rám Google
  // Máp, inak sa importuje assets/panorama.js a otvorí vlastná panoráma z data-panorama-obrazok; fotka sa prelne preč až po
  // načítaní (bez prázdneho rámu). Celá obrazovka: requestFullscreen na celom komponente, kde nie je (iPhone), pevná pozícia
  // cez celé okno (.p360-pevne, Esc ju ukončí). Zavrieť odstráni rám alebo panorámu, vráti fotku a fokus na tlačidlo.
  d.querySelectorAll('.p360').forEach(function (p) {
    var okno = p.querySelector('.p360-okno'), start = p.querySelector('.p360-start'), lista = p.querySelector('.p360-lista');
    var cela = p.querySelector('.p360-cela'), zavri = p.querySelector('.p360-zavri');
    var src = p.getAttribute('data-panorama-src') || '', obr = p.getAttribute('data-panorama-obrazok') || '';
    if (!start || !okno || !lista || !cela || !zavri || !(src || obr)) return;
    start.hidden = false;
    var ram = null, pan = null, beh = 0, text = start.textContent;
    function hotovo(ok) {
      if (!beh) return;
      beh = 0; start.setAttribute('aria-busy', 'false'); start.textContent = text; start.disabled = false;
      if (!ok) { if (ram && ram.parentNode) ram.parentNode.removeChild(ram); ram = null; if (pan) { pan.znic(); pan = null; } return; }
      p.classList.add('p360-on'); start.hidden = true; lista.hidden = false;
      (pan ? pan.plocha : zavri).focus({ preventScroll: true });
    }
    function otvor() {
      if (beh || p.classList.contains('p360-on')) return;
      beh = 1; start.setAttribute('aria-busy', 'true'); start.disabled = true; start.textContent = 'Načítava sa…';
      if (src) {
        ram = d.createElement('iframe');
        ram.title = 'Prehliadka predajne Stavebniny Richtárik v 360° (Google Mapy)';
        ram.loading = 'lazy'; ram.referrerPolicy = 'no-referrer-when-downgrade'; ram.allowFullscreen = true;
        ram.setAttribute('allow', 'fullscreen');
        ram.addEventListener('load', function () { hotovo(true); }, { once: true });
        ram.src = src; okno.appendChild(ram);
        setTimeout(function () { hotovo(true); }, 6000);   // keby udalosť load neprišla, rám sa aj tak ukáže
        return;
      }
      import(new URL(pre + 'assets/panorama.js', location.href).href).then(function (m) {
        if (!beh) return;
        pan = m.spusti(okno, new URL(obr, location.href).href, function (ok) { hotovo(ok); });
        p.panorama = pan;   // stav pohľadu pre skúšky (pohlad(), nastav())
      }).catch(function () { hotovo(false); });
    }
    function jeCela() { return d.fullscreenElement === p || p.classList.contains('p360-pevne'); }
    // pevná pozícia cez celé okno: sekcia s content-visibility:auto (site.css) je pre position:fixed obsahujúcim blokom, preto
    // dostane triedu, ktorá obmedzenie vypne (p360-pevne-rodic), kým je komponent cez celé okno
    var sek = p.closest('main>section,main>div');
    function pevne(z) { p.classList.toggle('p360-pevne', z); if (sek) sek.classList.toggle('p360-pevne-rodic', z); }
    function oznac() {
      var c = jeCela();
      p.classList.toggle('p360-cela-on', c); cela.setAttribute('aria-pressed', String(c));
      cela.textContent = c ? 'Ukončiť celú obrazovku' : 'Celá obrazovka';
      if (pan) pan.nastav();
    }
    function prepni() {
      if (jeCela()) {
        if (d.fullscreenElement === p && d.exitFullscreen) d.exitFullscreen().catch(function () {});
        pevne(false); oznac(); return;
      }
      var r = p.requestFullscreen ? p.requestFullscreen({ navigationUI: 'hide' }) : null;
      if (r && r.then) r.then(oznac, function () { pevne(true); oznac(); });
      else { pevne(true); oznac(); }
    }
    function zavriPrehliadku() {
      if (jeCela()) prepni();
      pevne(false); beh = 0; p.classList.remove('p360-on'); lista.hidden = true;
      if (ram) { if (ram.parentNode) ram.parentNode.removeChild(ram); ram = null; }
      if (pan) { pan.znic(); pan = null; }
      start.hidden = false; start.textContent = text; start.disabled = false; start.setAttribute('aria-busy', 'false');
      start.focus({ preventScroll: true });
    }
    d.addEventListener('fullscreenchange', oznac);
    cela.addEventListener('click', prepni);
    zavri.addEventListener('click', zavriPrehliadku);
    start.addEventListener('click', otvor);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('p360-pevne')) prepni(); });
  });

  // asistent na otázky (assets/asistent.js). Musí byť pred vyhľadávaním, lebo to končí skorým return na stránkach bez
  // poľa hľadania. Zapína ho atribút data-asistent na <html>: "ukazka" (náhľad, vopred pripravené odpovede, nič sa
  // neposiela) alebo adresa servera https://…/asistent/api.php (ostrý web, dopíše ju nasadenie/balik.sh len
  // s ASISTENT_API). Bez atribútu sa nič nesťahuje ani neposiela. ?asistent=off okno vypne, ?asistent=ukazka ukáže
  // ukážku, na localhost ?asistent=<adresa> skúšobný server. Modul sa načíta pri prvom ťuknutí alebo klávese, inak
  // 3,5 s po načítaní stránky a najskôr 5,5 s od začiatku načítania (po strihu úvodu), vždy v nečinnom čase a nikdy
  // počas posunu: preklad modulu a jeho štýl by inak dali pri CPU 4× snímku nad 50 ms práve v odhaleniach pri posune
  // (meranie pri zlúčení: posun-zf.mjs, import a LINK.onload 61–64 ms). Kým sa posúva, čaká sa 600 ms pokoja.
  (function asistent() {
    var qa = new URLSearchParams(location.search).get('asistent');
    var lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var api = qa === 'off' ? '' : qa === 'ukazka' ? qa : (lokal && qa) || d.documentElement.getAttribute('data-asistent') || '';
    if (api !== 'ukazka' && !/^https:\/\//.test(api) && !(lokal && /^http:\/\//.test(api))) return;
    // rám bez allow-same-origin (napr. náhľad v pieskovisku) má nepriehľadný pôvod: modul by neprešiel CORS, preto nič
    if (window.origin === 'null') return;
    var nacitane = false, posun = 0;
    addEventListener('scroll', function () { posun = performance.now(); }, { passive: true });
    function nacitaj() {
      if (nacitane) return;
      if (d.querySelector('.br')) return addEventListener('br-koniec', nacitaj, { once: true });   // nie počas uvítania
      var pokoj = performance.now() - posun;
      if (pokoj < 600) { setTimeout(nacitaj, 600 - pokoj); return; }   // posúva sa: počkať, kým posun stojí
      nacitane = true;
      var ric = window.requestIdleCallback || function (f) { return setTimeout(f, 1); };
      ric(function () {
        import(new URL(pre + 'assets/asistent.js', location.href).href).then(function (m) { m.spusti(api); }).catch(function () {});
      }, { timeout: 1500 });
    }
    // ťuknutie (click, nie pointerdown: ten je aj začiatok posunu prstom) a kláves (Tab k ikone); koliesko a posun nie
    ['click', 'keydown'].forEach(function (t) { addEventListener(t, nacitaj, { once: true, passive: true }); });
    function neskor() { setTimeout(nacitaj, Math.max(3500, 5500 - performance.now())); }
    if (d.readyState === 'complete') neskor(); else addEventListener('load', neskor, { once: true });
  })();

  // vyhľadávanie: index sa stiahne pri prvom písaní, hľadá sa bez diakritiky
  var q = d.getElementById('q'), res = d.getElementById('res');
  if (!q || !res) return;
  var idx = null, loading = false, stav = d.getElementById('res-stav');
  if (!q.getAttribute('aria-controls')) q.setAttribute('aria-controls', 'res');
  // RP2-11: panel výsledkov je nepriehľadný a pri otvorení sa rozvinie (CSS), riadky sa pri otvorení objavia postupne
  // (trieda otv na 300 ms, nie pri každom písmene); zatvorenie je prelnutie 120 ms a až potom hidden
  var zatv = null, otvT = 0;
  function ukaz(v, text) {
    q.setAttribute('aria-expanded', String(v)); if (stav && text !== undefined) stav.textContent = text;
    if (zatv) { zatv.cancel(); zatv = null; }
    if (v && res.hidden) { res.classList.add('otv'); clearTimeout(otvT); otvT = setTimeout(function () { res.classList.remove('otv'); }, 300); }
    if (v || res.hidden || reduce || !res.animate) { res.hidden = !v; return; }
    zatv = res.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'linear', fill: 'forwards' });
    zatv.finished.then(function () { var z = zatv; zatv = null; res.hidden = true; if (z) z.cancel(); }, function () {});
  }
  ukaz(false);
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var cakaj = null;   // posledná požiadavka počas sťahovania indexu (rýchle písanie alebo vložený text sa nestratí)
  function load(cb) {
    if (idx) return cb();
    cakaj = cb;
    if (loading) return; loading = true;
    fetch(pre + 'assets/index.json').then(function (x) { return x.json(); }).then(function (j) { idx = j.map(function (it) { it.n = norm(it.t + ' ' + it.k + ' ' + it.x); return it; }); if (cakaj) cakaj(); }).catch(function () { loading = false; });
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var v = norm(q.value.trim());
    if (v.length < 2) { ukaz(false, ''); return; }   // obsah ostáva, kým sa panel neprelne (potom je skrytý)
    var words = v.split(/\s+/);
    var hits = idx.filter(function (it) { return words.every(function (w) { return it.n.indexOf(w) >= 0; }); });
    hits.sort(function (a, b) { var ta = norm(a.t).indexOf(words[0]) >= 0 ? 0 : 1, tb = norm(b.t).indexOf(words[0]) >= 0 ? 0 : 1; return ta - tb; });
    hits = hits.slice(0, 8);
    if (!res.hidden && !zatv) res.classList.remove('otv');   // panel už je otvorený: ďalšie písmeno riadky nanovo neprelína
    if (!hits.length) { res.innerHTML = '<div class="none">Nič sme nenašli. Zavolajte 0905 622 223, poradíme vám.</div>'; ukaz(true, 'Nič sme nenašli.'); return; }
    res.innerHTML = hits.map(function (it) {
      var i = it.n.indexOf(words[0]), s = Math.max(0, i - 40), frag = (it.t + ' ' + it.k + ' ' + it.x).slice(s, s + 120);
      return '<a href="' + pre + it.p + '"><small>' + esc(it.k) + '</small><b>' + esc(it.t) + '</b><span>' + (s ? '…' : '') + esc(frag) + '…</span></a>';
    }).join('');
    ukaz(true, 'Výsledky hľadania: ' + hits.length + (hits.length === 1 ? ' stránka' : hits.length < 5 ? ' stránky' : ' stránok'));
  }
  q.addEventListener('input', function () { load(render); if (idx) render(); });
  q.addEventListener('focus', function () { load(render); });
  // RP1-11: na telefóne a tablete (do 1000 px) sa pole pri fokuse jedným posunom presunie pod lištu (88 px od vrchu),
  // aby výsledky boli nad spodnou lištou; ikona asistenta sa počas fokusu skryje (neprekryje krížik poľa). Jednorazový
  // posun na žiadosť zákazníka, posun sa nezamyká.
  var mqHl = window.matchMedia && window.matchMedia('(max-width:1000px)');
  q.addEventListener('focus', function () {
    d.documentElement.classList.add('hl-fokus');
    if (!mqHl || !mqHl.matches) return;
    var y = q.getBoundingClientRect().top;
    if (y < 70 || y > 120) window.scrollTo({ top: Math.max(0, y + window.scrollY - 88), behavior: reduce ? 'auto' : 'smooth' });
  });
  q.addEventListener('blur', function () { d.documentElement.classList.remove('hl-fokus'); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var f = res.querySelector('a'); if (f) location.href = f.href; }
    if (e.key === 'Escape') { ukaz(false); }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.search')) ukaz(false); });
})();
