/* Stavebniny Richtárik: menu na telefóne, objavovanie pri skrolovaní, vyhľadávanie v katalógu, lightbox s listovaním. */
(function () {
  var d = document;
  var scr = d.querySelector('script[src$="assets/site.js"]');
  var pre = scr ? scr.getAttribute('src').replace('assets/site.js', '') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    dr.inert = !dr.classList.contains('open');
    b.addEventListener('click', function () { open(!dr.classList.contains('open')); });
    dr.querySelector('.close').addEventListener('click', function () { open(false); });
    dr.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { open(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Tab' && dr.classList.contains('open')) pasca(dr, e); });
  }
  var r = d.getElementById('rok'); if (r) r.textContent = new Date().getFullYear();

  // päta: na telefóne (do 700 px) sú Stránky a Katalóg zbalené, na širšej obrazovke vždy otvorené (nadpis sa nedá zbaliť,
  // nie je ani zastávkou Tab). Bez JS ostanú otvorené.
  var fzb = d.querySelectorAll('footer details.f-zb');
  if (fzb.length && window.matchMedia) {
    var fmq = window.matchMedia('(max-width:700px)');
    var fnastav = function () { fzb.forEach(function (x) { x.open = !fmq.matches; x.querySelector('summary').tabIndex = fmq.matches ? 0 : -1; }); };
    fnastav();
    if (fmq.addEventListener) fmq.addEventListener('change', fnastav); else if (fmq.addListener) fmq.addListener(fnastav);
    fzb.forEach(function (x) { x.querySelector('summary').addEventListener('click', function (e) { if (!fmq.matches) e.preventDefault(); }); });
  }

  // tieň lišty po odskrolovaní
  var top = d.querySelector('.top');
  var topHranica = 8;   // úvodný film ju posunie na svoj koniec (počas filmu je lišta priehľadná)
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > topHranica); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // objavovanie blokov pri skrolovaní, so stupňovaním v mriežkach
  var rv = Array.prototype.slice.call(d.querySelectorAll('.rv, .rvimg, .head, .deals > *, .cats > *, .novs > *, .grid3 > *, .sub-grid > *'));
  rv.forEach(function (el) { if (!el.classList.contains('rv') && !el.classList.contains('rvimg') && !el.classList.contains('head')) el.classList.add('rv'); });
  if (!('IntersectionObserver' in window) || reduce) {
    rv.forEach(function (el) { el.classList.add('now'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(sib % 6, 5) * 70 + 'ms';
        el.classList.add('in'); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
    rv.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) el.classList.add('now'); else io.observe(el);
    });
  }

  window.addEventListener('beforeprint', function () { rv.forEach(function (el) { el.classList.add('now'); }); });

  // paralaxa: fotky v úvode, v hlavičke a v páse sa posúvajú pomalšie než stránka; len počítač s myšou
  var desk = window.matchMedia && window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)').matches;
  var pars = desk && !reduce ? Array.prototype.slice.call(d.querySelectorAll('[data-parallax]')) : [];
  var prog = d.createElement('div'); prog.className = 'progress'; d.body.appendChild(prog);
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
    if (w !== lastW) { prog.style.transform = 'scaleX(' + (w / 100) + ')'; lastW = w; }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  window.addEventListener('resize', function () { measure(); move(); });
  window.addEventListener('load', measure);
  measure(); move();

  // 3D náklon kariet a zákazníckej karty za kurzorom je vypnutý (pokojnejší web); ostáva len jemná hĺbka textu úvodu
  if (!reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    // hĺbka v úvode: text sa hýbe jemne proti fotke
    var hero = d.querySelector('.hero'), hw = hero && hero.querySelector('.wrap'), hraf = 0, hx = 0, hy = 0;
    if (hero && hw && desk) hero.addEventListener('mousemove', function (e) {
      hx = e.clientX / window.innerWidth - 0.5; hy = e.clientY / window.innerHeight - 0.5;
      if (!hraf) hraf = requestAnimationFrame(function () {
        hraf = 0; hw.style.transform = 'translate3d(' + (-hx * 14).toFixed(1) + 'px,' + (-hy * 10).toFixed(1) + 'px,0)';
      });
    });
  }

  // úvod: film ovládaný skrolovaním (.hero.film). Sekcia je dráha, .pin sa na nej prilepí a canvas kreslí snímku podľa
  // polohy v dráhe: jemný dobeh (exponenciálne priblíženie k cieľu, tau 0,11 s) a prelínanie dvoch susedných snímok, takže
  // pohyb je plynulý aj pri pomalom skrolovaní aj pri trhavom kolieskom myši. Snímky sú v AVIF balíkoch img/film/<sada>-*:
  // najprv kľúčové (každá 8. snímka v polovičnom rozlíšení v jednom súbore, celý film je hneď prechodný), potom bloky po
  // 8 snímkach, vždy najbližšie k miestu, kde zákazník je. Sťahovanie, dekódovanie, delenie balíka na snímky aj samotné
  // kreslenie robí pracovné vlákno (Worker s OffscreenCanvas): hlavné vlákno posiela len príkaz „túto snímku sem“, takže
  // kreslenie a odovzdávanie obrazu kompozítoru nikdy nezdrží skrolovanie, text ani zvyšok stránky (bez grafického čipu
  // to bola najdrahšia časť každej snímky: 13–45 ms, pri zmene rozlíšenia a kvalitnom zmenšení 150–300 ms). Prehliadač
  // bez OffscreenCanvas kreslí na hlavnom vlákne ako predtým.
  // Dva canvasy: canvas pohybu (rozlíšenie podľa výkonu, rýchle zmenšenie) a nad ním pokojový canvas, ktorý sa po 0,3 s
  // pokoja nakreslí raz v plnom rozlíšení a pri ďalšom pohybe sa len skryje (žiadna zmena rozlíšenia na začiatku pohybu).
  // Na konci filmu je ostrý posledný záber (img .posl z 4K zdroja, doostrený), prelína sa nad canvas, keď film dobehne.
  // Dekódujú sa bloky tam, kde obraz o chvíľu bude (poloha + rýchlosť) a kde sa zastaví; dekódované bloky ostávajú len
  // okolo aktuálnej polohy (pamäť telefónu), ak snímka ešte nie je, kreslí sa najbližšia načítaná. Snímka 0 je ostrý prvý
  // obraz (img v <picture>). Keď kreslenie nestíha, canvas pohybu zníži rozlíšenie (72 %, potom 55 % bez prelínania);
  // po pauze skúsi o úroveň lepšie. Telefón bez grafického čipu kreslí pohyb stále v jednom rozlíšení.
  // Po otočení telefónu kreslí staré kľúčové snímky (výrez cover), kým nová sada nemá vlastné; nikdy prázdny canvas.
  // Bez JS, pri obmedzení pohybu a v prehliadači bez AVIF ostáva ostrý prvý obraz a nič sa nepripína.
  var film = d.querySelector('.hero.film'), fdata = d.getElementById('film-data');
  // pripnutie (trieda film-ide) zapína skript v <head> ešte pred vykreslením; keď film nemôže bežať, zruší sa
  var bezFilmu = function () { d.documentElement.classList.remove('film-ide'); };
  // skok bez plynulého skrolovania (html má scroll-behavior: smooth; staršie Safari nepozná 'instant')
  var skoc = function (y) { try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } };
  if (!(film && fdata && !reduce && window.createImageBitmap && window.Promise && window.requestAnimationFrame)) bezFilmu();
  else (function () {
    var D; try { D = JSON.parse(fdata.textContent); } catch (e) { bezFilmu(); return; }
    var pin = film.querySelector('.pin'), cv = film.querySelector('.platno'), prvy = film.querySelector('.prvy img');
    var posl = film.querySelector('.posl'), poslImg = posl && posl.querySelector('img');
    if (!D || !D.n || !cv || !prvy) { bezFilmu(); return; }
    // film končí na snímke D.koniec (pôvodná snímka klipu, ostrejšia než posledná sekunda, kde kamera nízko zrýchľuje);
    // ďalšie snímky sa nekreslia ani nesťahujú
    var N = Math.min(D.n, (D.koniec || D.n - 1) + 1), BL = D.blok, NB = Math.ceil(N / BL), NK = Math.ceil(N / BL);
    var text = film.querySelector('.text'), zatm = film.querySelector('.zatm'), vin = film.querySelector('.vin'), cue = film.querySelector('.cue'), bgEl = film.querySelector('.bg'), cta = film.querySelector('.text .cta');
    var SADY = { t960: [960, 2080], t720: [720, 1560], t540: [540, 1170], p1920: [1920, 1080], p1280: [1280, 720] };
    var conn = navigator.connection || {}, dm = navigator.deviceMemory || 4;
    var base = new URL(pre + 'img/film/', location.href).href;
    var TAU = 0.11;
    var UZKE = '(max-aspect-ratio: 2/3)';   // telefón na výšku: výrez 9 : 19,5 (rovnaké pravidlo ako <picture> a CSS)
    // kreslenie vo vlákne, ak to prehliadač vie (OffscreenCanvas s 2D kontextom)
    var ofs = false;
    try { ofs = !!(window.Worker && window.OffscreenCanvas && cv.transferControlToOffscreen && new OffscreenCanvas(1, 1).getContext('2d')); } catch (e) { ofs = false; }
    // pokojový canvas nad canvasom pohybu (pod ostrým posledným záberom)
    var cv2 = d.createElement('canvas'); cv2.className = 'platno pokoj'; cv2.setAttribute('aria-hidden', 'true');
    cv.parentNode.insertBefore(cv2, cv.nextSibling);
    var ctx = null, ctx2 = null;
    d.documentElement.classList.add('film-ide');

    // pracovné vlákno: n = stiahni balík (drží ho skomprimovaný, druhýkrát sa nesťahuje), d = dekóduj a rozdeľ na snímky
    // (pri kreslení vo vlákne tam snímky aj ostanú, hlavné vlákno dostane len ich čísla), p = prevezmi bitmapy (prvý obraz),
    // z = zavri snímky, c = prevezmi oba canvasy, k = nakresli snímku (alebo prelínanie dvoch) do canvasu,
    // v = stiahni obrázky pod filmom do vyrovnávacej pamäte prehliadača (po jednom, hlavné vlákno pri tom nepracuje)
    var KOD = [
      'var B={},F={},id=0,C=null,X=null;',
      'function zavri(f){for(var i=0;i<f.length;i++)if(F[f[i]]){F[f[i]].close();delete F[f[i]]}}',
      'function obraz(x,c,f,ox,oy){var b=F[f[0]],m=f[1],fw=f[2],fh=f[3],s=Math.max(c.width/fw,c.height/fh),sw=c.width/s,sh=c.height/s;',
      'x.drawImage(b,(fw-sw)*ox*m,(fh-sh)*oy*m,sw*m,sh*m,0,0,c.width,c.height)}',
      'onmessage=function(e){var m=e.data;',
      'if(m.t==="n"){if(B[m.id]){postMessage({t:"n",id:m.id,ok:1,b:0});return}fetch(m.u).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){B[m.id]=b;postMessage({t:"n",id:m.id,ok:1,b:b.size})},function(){postMessage({t:"n",id:m.id,ok:0})})}',
      'else if(m.t==="d"){var s;try{createImageBitmap(B[m.id]).then(function(x){s=x;var p=[];for(var i=0;i<m.n;i++)p.push(createImageBitmap(s,(i%m.c)*m.w,((i/m.c)|0)*m.h,m.w,m.h));return Promise.all(p)})',
      '.then(function(o){s.close();if(m.drz)postMessage({t:"d",id:m.id,ok:1,f:o.map(function(b){F[++id]=b;return id})});else postMessage({t:"d",id:m.id,ok:1,f:o},o)},function(){postMessage({t:"d",id:m.id,ok:0})})}catch(x){postMessage({t:"d",id:m.id,ok:0})}}',
      'else if(m.t==="p")postMessage({t:"p",id:m.id,ok:1,f:m.b.map(function(b){F[++id]=b;return id})});',
      'else if(m.t==="z")zavri(m.f);',
      'else if(m.t==="v"){var q=m.u.slice(),dalsi=function(){var u=q.shift();if(!u)return;fetch(u).then(function(r){return r.blob()}).then(function(){postMessage({t:"v",u:u})},function(){postMessage({t:"v",u:u})}).then(dalsi)};dalsi()}',
      'else if(m.t==="c"){C=m.c;X=C.map(function(c){return c.getContext("2d",{alpha:false})});if(!X[0]||!X[1])postMessage({t:"x"})}',
      // snímka, ktorá už nie je, sa nekreslí (canvas by sa zmenou rozmeru vymazal); rozmer a kreslenie v jednej úlohe
      'else if(m.t==="k"){var t0=performance.now(),c=C&&C[m.c],x=X&&X[m.c];if(!x||!F[m.F[0]]||(m.G&&!F[m.G[0]])){postMessage({t:"k",id:m.id,ok:0});return}',
      'if(c.width!==m.w||c.height!==m.h){c.width=m.w;c.height=m.h}x.imageSmoothingQuality=m.q;x.globalAlpha=1;obraz(x,c,m.F,m.ox,m.oy);',
      'if(m.G){x.globalAlpha=m.al;obraz(x,c,m.G,m.ox,m.oy);x.globalAlpha=1}postMessage({t:"k",id:m.id,ok:1,ms:performance.now()-t0})}};'
    ].join('');
    function hlavne() {   // náhrada bez Workeru (rovnaké rozhranie, dekódovanie createImageBitmap je aj tak mimo hlavného vlákna)
      var B = {};
      return {
        n: function (id, u) { if (B[id]) return Promise.resolve({ b: 0 }); return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) { B[id] = b; return { b: b.size }; }); },
        d: function (id, n, c, w, h) {
          var s; return createImageBitmap(B[id]).then(function (x) { s = x; var p = []; for (var i = 0; i < n; i++) p.push(createImageBitmap(s, (i % c) * w, ((i / c) | 0) * h, w, h)); return Promise.all(p); })
            .then(function (o) { s.close(); return o; });
        },
        p: function (bm) { return Promise.resolve(bm); }
      };
    }
    function vlakno() {
      var w, cak = {}, kid = 0;
      try { w = new Worker(URL.createObjectURL(new Blob([KOD], { type: 'text/javascript' }))); } catch (e) { return hlavne(); }
      var zal = hlavne(), zle = false;
      w.onmessage = function (e) {
        var m = e.data;
        if (m.t === 'x') { nejdeFilm(); return; }   // vlákno nemá 2D kontext (nemalo by nastať, overené vopred)
        if (m.t === 'v') { vopredHotove(m.u); return; }
        var c = cak[m.t + m.id]; if (c) { delete cak[m.t + m.id]; if (m.ok) c[0](m); else c[1](m); }
      };
      w.onerror = function () { zle = true; for (var k in cak) cak[k][1](); cak = {}; if (ofs) nejdeFilm(); };
      var posli = function (m, tr) { return new Promise(function (ok, chyba) { cak[m.t + m.id] = [ok, chyba]; w.postMessage(m, tr || []); }); };
      // bitmapy dekódované na hlavnom vlákne (náhrada) sa pri kreslení vo vlákne odovzdajú vláknu
      var prenes = function (o) { return ofs ? posli({ t: 'p', id: ++kid, b: o }, o).then(function (m) { return m.f; }) : o; };
      return {
        w: w,
        n: function (id, u) { return zle ? zal.n(id, u) : posli({ t: 'n', id: id, u: u }); },
        // keď vlákno nevie dekódovať (starší prehliadač), balík sa stiahne znova z vyrovnávacej pamäte a dekóduje tu
        d: function (id, n, c, fw2, fh2, u) {
          var tu = function () { return zal.n(id, u).then(function () { return zal.d(id, n, c, fw2, fh2); }).then(prenes); };
          if (zle) return tu();
          return posli({ t: 'd', id: id, n: n, c: c, w: fw2, h: fh2, drz: ofs ? 1 : 0 }).then(function (m) { return m.f; }, function () { zle = true; return tu(); });
        },
        p: function (bm) { return ofs ? prenes([bm]).then(function (f) { return f[0]; }) : Promise.resolve(bm); },
        z: function (f) { w.postMessage({ t: 'z', f: f }); },
        v: function (u) { w.postMessage({ t: 'v', u: u }); },
        k: function (m, cb) { m.t = 'k'; m.id = ++kid; cak['k' + m.id] = [cb, cb]; w.postMessage(m); }
      };
    }
    var src = vlakno();
    if (!src.w) ofs = false;   // vlákno sa nevytvorilo: všetko na hlavnom vlákne
    if (ofs) {
      try { var oc = [cv.transferControlToOffscreen(), cv2.transferControlToOffscreen()]; src.w.postMessage({ t: 'c', c: oc }, oc); }
      catch (e) { bezFilmu(); return; }
    } else {
      ctx = cv.getContext('2d', { alpha: false }); ctx2 = cv2.getContext('2d', { alpha: false });
      if (!ctx || !ctx2) { bezFilmu(); return; }
    }

    // sady snímok: A je aktívna (podľa orientácie a veľkosti okna), Z predchádzajúca, ktorej kľúčové snímky sa kreslia,
    // kým A nemá vlastné (po otočení telefónu). Skomprimované balíky ostávajú vo vlákne, návrat na sadu nič nesťahuje.
    // Snímka je „žetón“: číslo bitmapy vo vlákne (kreslenie vo vlákne) alebo samotná bitmapa (kreslenie na hlavnom vlákne).
    function novaSada(m) { return { m: m, fw: SADY[m][0], fh: SADY[m][1], kluc: [], kStav: 0, stiah: {}, bloky: {}, dek: {}, prvy: null, prvyM: 1, prvyPx: 0, chyby: 0 }; }
    function zavri(o) {
      if (!o) return; var f = o.filter(function (x) { return x; }); if (!f.length) return;
      if (ofs) src.z(f); else f.forEach(function (x) { x.close(); });
    }
    function zavriBloky(S) { for (var b in S.bloky) zavri(S.bloky[b]); S.bloky = {}; }
    function zavriKluc(S) { zavri(S.kluc); S.kluc = []; if (S.kStav === 2) S.kStav = 0; }
    var sady = {}, A = null, Z = null, port = false, okno = false, nejde = false;
    var siet = 0, dek = 0, maxBlokov = 2, bajty = 0;
    var top0 = 0, len = 1, pinH = 0, cil = 0, fi = 0, smer = 1, rych = 0, beh = false, tPrev = 0, znova = true, posl0 = '';
    var sFull = 1, sZaklad = 1, uroven = 0, ints = [], per = 40, medPosl = 0, W = 0, H = 0, tPohyb = 0, oyPosun = 0, ostr = 1;
    var cwM = 0, chM = 0, cwF = 0, chF = 0;   // rozmer canvasu pohybu a pokojového canvasu (mení ho až kreslenie)
    // úrovne kreslenia počas pohybu: rozlíšenie snímky, 72 %, 55 % a 42 % (bez prelínania); pokojový canvas vždy plné
    // (sFull, na telefóne až po rozlíšenie displeja s kvalitným zmenšením)
    function sk(u) { return Math.max(0.5, sZaklad * [1, 0.72, 0.55, 0.42][u]); }
    // začiatočná úroveň v pohybe: s grafickým čipom plná (sada t960 o úroveň nižšie, zvyšuje sa po plynulom pohybe),
    // bez neho (softvérové skladanie obrazu: každá snímka canvasu sa kopíruje do kompozítora) telefón 42 % a bez zmien,
    // lebo každá zmena rozlíšenia je nové plátno
    var softver = false;
    function urovenStart() { return A.m.charAt(0) === 't' ? (softver ? 3 : A.m === 't960' ? 1 : 0) : 0; }

    function pad(b) { return (b < 10 ? '0' : '') + b; }
    function vyberSadu() {
      port = window.matchMedia(UZKE).matches;
      var mobil = port || window.matchMedia('(pointer: coarse)').matches;   // telefón aj otočený na šírku
      // potrebná šírka snímky pri pokrytí plochy; telefón na výšku do hustoty 3 (najmenšia sada, ktorá stačí, ako vyberá
      // srcset prvého obrazu: hustota 3 aj 2 od 390 px → t960), na šírku najviac 1,5 × (telefón otočený na šírku nedostane 1920)
      var dpr = Math.min(window.devicePixelRatio || 1, port ? 3 : 1.5), w = pin.clientWidth * dpr, h = pin.clientHeight * dpr;
      // pomalá sieť (2g/3g, odhad pod 2 Mb/s, napr. Slow 4G): telefón najmenšia sada t540, aby prvý prejazd mal skôr
      // plné snímky (bloky t540 sú o 40 % menšie než t720); kým nie sú, prelínajú sa kľúčové snímky (kresli)
      var slabe = conn.saveData || /2g|3g/.test(conn.effectiveType || '') || (conn.downlink > 0 && conn.downlink < 2), tw = Math.max(w, h * 9 / 19.5);
      var nova = port ? (slabe || tw <= 540 ? 't540' : tw <= 720 ? 't720' : 't960') : (!slabe && Math.max(w, h * 16 / 9) > 1400 ? 'p1920' : 'p1280');
      // telefón na šírku: bloky len okolo miesta, kde zákazník je (nie celý film druhýkrát)
      okno = mobil && !port;
      // pamäť na dekódované bloky: telefón do 130 MB (t960: 2 bloky, t720: 3) (pri 2 GB a menej polovica), počítač do 240 MB; kľúčové snímky navyše
      var rozpocet = (mobil ? 130e6 : 240e6) * (dm <= 2 ? 0.5 : 1);
      if (A && nova === A.m) return false;
      var S = sady[nova] || (sady[nova] = novaSada(nova));
      if (A) {
        // stará sada: dekódované bloky preč, jej kľúčové snímky sa kreslia, kým nová sada nemá vlastné
        zavriBloky(A);
        var nz = A.kluc.length ? A : Z;
        if (Z && Z !== nz && Z !== S) zavriKluc(Z);
        Z = nz === S ? null : nz;
      }
      A = S;
      maxBlokov = Math.max(2, Math.min(4, Math.floor(rozpocet / (A.fw * A.fh * 4 * BL))));
      return true;
    }
    function zmeraj() {
      var r = film.getBoundingClientRect();
      pinH = pin.offsetHeight; top0 = r.top + window.scrollY; len = Math.max(1, film.offsetHeight - pinH);
      var w = pin.clientWidth, h = pin.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
      var pokr = Math.max(w / A.fw, h / A.fh);             // css px na pixel snímky pri pokrytí
      sZaklad = Math.max(1, Math.min(dpr, 1 / pokr));      // v pohybe canvas nemá viac pixelov, než dá snímka
      // pokojový canvas až po hustotu displeja, ak snímka chýba najviac 30 % (t960 na 1170 px): zväčšenie robí canvas kvalitne
      // (imageSmoothingQuality high) namiesto bilineárneho zväčšenia celého canvasu v kompozítore. Bez grafického čipu
      // najviac 1,15 Mpx (canvas sa kopíruje do kompozítora)
      sFull = softver ? Math.max(1, Math.min(sZaklad, Math.sqrt(1.15e6 / (w * h)))) : Math.max(1, Math.min(dpr, 1.3 / pokr));
      W = w; H = h; cwF = Math.round(W * sFull); chF = Math.round(H * sFull); nastavRozlisenie(sk(uroven));
      // nízky telefón: CSS posunie prvý obraz (--oy), aby auto nebolo pod textom; canvas na začiatku rovnako, po odchode textu späť
      var oyCss = parseFloat(getComputedStyle(bgEl).getPropertyValue('--oy'));
      oyPosun = isNaN(oyCss) ? 0 : oyCss / 100 - (A.m.charAt(0) === 't' ? D.oyP[0] : D.oyL[0]);
      if (Math.abs(oyPosun) < 0.002) oyPosun = 0;
      // lišta stmavne, až keď k nej dorazí svetlý pás pod filmom (biele logo by na ňom nebolo vidieť)
      var dalsi = film.nextElementSibling;
      topHranica = (dalsi ? dalsi.getBoundingClientRect().top + window.scrollY : top0 + len + pinH) - (top ? top.offsetHeight : 80);
      zmerajSekcie();
      onScroll();
    }
    // rozmer canvasu pohybu; canvas sa zmení až pri najbližšom kreslení (rozmer aj snímka v jednej úlohe, nikdy prázdny)
    function nastavRozlisenie(s) {
      var cw = Math.round(W * s), ch = Math.round(H * s);
      if (cw !== cwM || ch !== chM) { cwM = cw; chM = ch; posl0 = ''; znova = true; }
    }

    // kde obraz je, kde sa zastaví (cieľ skrolovania) a kde bude o 0,2 s (rýchlosť obrazu)
    function blok(i) { return Math.min(NB - 1, Math.max(0, Math.round(i) / BL | 0)); }
    function blokTeraz() { return blok(fi); }
    function blokCiel() { return blok(cil * (N - 1)); }
    function blokPred() { return blok(fi + rych * 0.2); }
    // poradie dekódovania: kam obraz dorazí, kde sa zastaví, kde je teraz, ďalší v smere; dĺžka = koľko blokov sa zmestí
    function poradie() {
      var o = [], c = blokTeraz(), t = blokCiel(), p = blokPred();
      [p, t, c, p + smer, t + smer].forEach(function (b) { if (b >= 0 && b < NB && o.indexOf(b) < 0) o.push(b); });
      return o.slice(0, maxBlokov);
    }
    function najblizsi(podm) {
      var c = blokCiel(), best = -1, bs = 1e9;
      for (var b = 0; b < NB; b++) {
        if (!podm(b)) continue;
        var dd = Math.abs(b - c) * 2 + ((b - c) * smer < 0 ? 1 : 0);
        if (dd < bs) { bs = dd; best = b; }
      }
      return best;
    }
    function url(S, b) { return base + S.m + '-' + (b === 'k' ? 'k' : pad(b)) + '.avif'; }
    // sťahovanie: najprv kľúčové snímky, potom bloky od cieľa (dopredu v smere skrolovania), dva naraz
    function planuj() {
      if (nejde) return;
      var S = A;
      if (!S.kStav) {
        S.kStav = 1;
        var uk = url(S, 'k');
        src.n(uk, uk).then(function (m) {
          bajty += m.b || 0;
          src.d(uk, NK, 6, S.fw / 2, S.fh / 2, uk).then(function (o) {
            if (S !== A || nejde) { zavri(o); S.kStav = 0; return; }
            S.kluc = o; S.kStav = 2;
            if (Z) { zavriKluc(Z); Z = null; }
            znova = true; pohni(); planuj();
          }, function () { if (S === A) nejdeFilm(); else S.kStav = 0; });   // stiahnuté, ale nedá sa dekódovať: prehliadač bez AVIF
        }, function () { S.kStav = 0; if (S === A && ++S.chyby < 4) setTimeout(planuj, 1500 * S.chyby); });
      }
      var t = blokCiel(), p = blokPred();
      while (siet < 2 && S.kStav >= 2) {
        var b = najblizsi(function (x) { return !S.stiah[x] && (!okno || Math.abs(x - t) <= 2 || Math.abs(x - p) <= 1); });
        if (b < 0) break;
        S.stiah[b] = 1; siet++;
        (function (b, u) {
          src.n(u, u).then(function (m) { siet--; S.stiah[b] = 2; bajty += m.b || 0; planuj(); },
            function () { siet--; S.stiah[b] = -1; planuj(); });
        })(b, url(S, b));
      }
      if (S.kStav < 2) return;
      var chc = poradie(), c = blokTeraz();
      // telefón dekóduje jeden blok naraz (dekódovanie veľkého AVIF berie jadrá, ktoré potrebuje kreslenie), počítač dva
      for (var i = 0; i < chc.length && dek < (S.m.charAt(0) === 't' ? 1 : 2); i++) {
        var bb = chc[i];
        if (S.bloky[bb] || S.dek[bb] || S.stiah[bb] !== 2) continue;
        // miesto v pamäti: preč bloky, ktoré už nie sú v poradí (najvzdialenejší prvý)
        var ks = Object.keys(S.bloky).map(Number).filter(function (x) { return chc.indexOf(x) < 0; })
          .sort(function (x, y) { return Math.abs(y - c) - Math.abs(x - c); });
        while (ks.length && Object.keys(S.bloky).length + dek >= maxBlokov) { var x = ks.shift(); zavri(S.bloky[x]); delete S.bloky[x]; }
        if (Object.keys(S.bloky).length + dek >= maxBlokov) break;
        dekoduj(S, bb);
      }
    }
    function dekoduj(S, b) {
      var n = Math.min(BL, N - b * BL), u = url(S, b);
      S.dek[b] = 1; dek++;
      src.d(u, n, 4, S.fw, S.fh, u).then(function (o) {
        dek--; delete S.dek[b];
        if (S !== A || S.bloky[b] || nejde) { zavri(o); planuj(); return; }
        S.bloky[b] = o; uprac(); znova = true; pohni(); planuj();
      }, function () { dek--; delete S.dek[b]; S.stiah[b] = -1; planuj(); });
    }
    function uprac(vsetko) {
      var S = A, chc = poradie(), c = blokTeraz();
      var sk2 = function (b) { var i = chc.indexOf(b); return i >= 0 ? i : 10 + Math.abs(b - c); };
      var ks = Object.keys(S.bloky).map(Number).sort(function (a, b) { return sk2(b) - sk2(a); });
      while (ks.length && (vsetko || ks.length > maxBlokov)) { var b = ks.shift(); zavri(S.bloky[b]); delete S.bloky[b]; }
    }

    // snímka i: [žetón, pixely bitmapy na pixel snímky, sada]; ak nie je, najbližšia načítaná (plná pred kľúčovou)
    function zSady(S, i) {
      if (i === 0 && S.prvy) return [S.prvy, S.prvyM, S];
      var b = i / BL | 0, bl = S.bloky[b];
      if (bl && bl[i - b * BL]) return [bl[i - b * BL], 1, S];
      var best = null, bd = 1e9;
      for (var k in S.bloky) {
        var o = +k * BL, j = Math.min(S.bloky[k].length - 1, Math.max(0, i - o)), dd = Math.abs(o + j - i);
        if (dd < bd) { bd = dd; best = [S.bloky[k][j], 1, S]; }
      }
      for (var q = 0; q < S.kluc.length; q++) {
        var dk = Math.abs(q * BL - i);
        if (dk < bd) { bd = dk; best = [S.kluc[q], 0.5, S]; }
      }
      if (S.prvy && i < bd) best = [S.prvy, S.prvyM, S];
      return best;
    }
    function snimka(i) {
      // nová sada bez snímok (po otočení): radšej staré kľúčové snímky na správnom mieste než stojaci prvý obraz
      if (!A.kluc.length && !Object.keys(A.bloky).length && Z && Z.kluc.length) return zSady(Z, i);
      return zSady(A, i);
    }
    // príkaz na kreslenie do canvasu c (0 = pohyb, 1 = pokoj): rozmer, kvalita zmenšenia, snímka F (a G prelínaná s al),
    // ohnisko výrezu; hotovo(ok) sa zavolá po nakreslení posledného príkazu daného canvasu
    var kSeq = [0, 0], leti = 0, kMs = [], kStat = { n: 0, max: 0, sum: 0 };
    function obraz(x, c, f, ox, oy) {
      var m = f[1], fw = f[2], fh = f[3], s = Math.max(c.width / fw, c.height / fh), sw = c.width / s, sh = c.height / s;
      x.drawImage(f[0], (fw - sw) * ox * m, (fh - sh) * oy * m, sw * m, sh * m, 0, 0, c.width, c.height);
    }
    function prikaz(c, w, h, q, F, G, al, ox, oy, hotovo) {
      var f1 = [F[0], F[1], F[2].fw, F[2].fh], g1 = G ? [G[0], G[1], G[2].fw, G[2].fh] : null, sq = ++kSeq[c];
      if (!c) leti++;
      var cb = function (r) {
        if (!c) leti--;
        if (r && r.ok && r.ms != null) { if (!c) { kMs.push(r.ms); if (kMs.length > 16) kMs.shift(); } kStat.n++; kStat.sum += r.ms; kStat.max = Math.max(kStat.max, r.ms); }
        if (sq === kSeq[c]) hotovo(!!(r && r.ok));
      };
      if (ofs) { src.k({ c: c, w: w, h: h, q: q, F: f1, G: g1, al: al, ox: ox, oy: oy }, cb); return; }
      var el = c ? cv2 : cv, x = c ? ctx2 : ctx, t0 = performance.now();
      if (!f1[0] || (g1 && !g1[0])) { cb({ ok: 0 }); return; }
      if (el.width !== w || el.height !== h) { el.width = w; el.height = h; }   // zmena rozmeru canvas vymaže, hneď sa kreslí
      x.imageSmoothingQuality = q; x.globalAlpha = 1; obraz(x, el, f1, ox, oy);
      if (g1) { x.globalAlpha = al; obraz(x, el, g1, ox, oy); x.globalAlpha = 1; }
      cb({ ok: 1, ms: performance.now() - t0 });
    }
    // fi je ideálny (rovnomerný) index; cez ideálne časy hi prejde na čas T a ten na skutočné snímky h (prelínanie)
    function poloha() {
      var j = Math.min(N - 2, Math.floor(fi)), T = D.hi[j] + (D.hi[j + 1] - D.hi[j]) * (fi - j);
      var a = 0; while (a < N - 2 && D.h[a + 1] <= T) a++;
      return [a, Math.min(1, Math.max(0, (T - D.h[a]) / (D.h[a + 1] - D.h[a])))];
    }
    // výrez telefónu má auto v strede; na šírku ohnisko auta zo záberu 16 : 9
    function ohnisko(S, a, b1, al) {
      var tS = S.m.charAt(0) === 't';
      var ox = tS ? 0.5 : D.oxL[a] + (D.oxL[b1] - D.oxL[a]) * al, oyA = tS ? D.oyP : D.oyL, oy = oyA[a] + (oyA[b1] - oyA[a]) * al;
      if (oyPosun) oy = Math.min(1, Math.max(0, oy + oyPosun * (1 - sst((fi / (N - 1) - 0.06) / 0.08))));   // späť až keď text odchádza (6–14 %)
      return [ox, oy];
    }
    var odlozene = false;
    function kresli(moving) {
      odlozene = false;
      var pa = poloha(), a = pa[0], al = pa[1];
      // v pokoji sa prelínanie dotiahne na jednu celú snímku (ostrá, bez dvojitých hrán dvoch snímok)
      if (!moving && ostr > 0 && al) al += ((al < 0.5 ? 0 : 1) - al) * sst(ostr);
      if (al > 0.97) { a++; al = 0; } else if (al < 0.03) al = 0;
      // najnižšia úroveň v pohybe: bez prelínania (canvas sa mení len pri novej snímke, nie v každej snímke displeja)
      if (moving && uroven >= 3) al = al < 0.5 ? 0 : (a++, 0);
      if (fi < 0.002) { if (cv.classList.contains('zap')) cv.classList.remove('zap'); posl0 = ''; return true; }   // ostrý prvý obraz
      var F = snimka(a), G = al ? snimka(Math.min(N - 1, a + 1)) : null;
      if (!F) return false;
      var b1 = Math.min(N - 1, a + 1), KS = F[2];
      // v pohybe a bez plného bloku (pomalá sieť): prelínanie dvoch susedných kľúčových snímok podľa polohy namiesto
      // skokov po 8 snímkach; v pokoji ostáva najbližšia celá snímka
      if (moving && uroven < 3 && KS.kluc.length > 1 && KS.kluc.indexOf(F[0]) >= 0) {
        var kq = Math.min(KS.kluc.length - 2, Math.floor(fi / BL));
        al = Math.min(1, Math.max(0, (fi - kq * BL) / BL)); if (al < 0.03) al = 0;
        F = [KS.kluc[kq], 0.5, KS]; G = al ? [KS.kluc[kq + 1], 0.5, KS] : null; a = kq * BL; b1 = Math.min(N - 1, (kq + 1) * BL);
      }
      if (G && G[0] === F[0]) G = null;
      var S = F[2], oh = ohnisko(S, a, b1, al);
      var sig = a + ':' + al.toFixed(3) + ':' + oh[1].toFixed(4) + ':' + S.m + ':' + F[1] + ':' + (G ? G[1] : '') + ':' + cwM + ':' + chM + ':' + S.kluc.length + ':' + (S.bloky[a / BL | 0] ? 1 : 0) + ':' + (S.bloky[b1 / BL | 0] ? 1 : 0);
      if (sig !== posl0) {
        // vlákno ešte kreslí dve predchádzajúce snímky: táto počká na ďalšiu snímku displeja (žiadny rad príkazov)
        if (ofs && leti >= 2) { odlozene = true; return true; }
        posl0 = sig;
        // canvas pohybu sa ukáže, až keď je na ňom snímka (nikdy prázdny ani starý obraz cez prvý obraz)
        prikaz(0, cwM, chM, 'low', F, G, al, oh[0], oh[1], function (ok) { if (ok && fi >= 0.002 && !cv.classList.contains('zap')) cv.classList.add('zap'); });
      }
      return true;
    }
    // canvas je viditeľný, len keď naň niečo nakreslil; inak je vidieť ostrý prvý obraz (img) a pod ním náhľad
    function kresliAleboImg(moving) { var ok = kresli(moving); if (!ok && cv.classList.contains('zap')) cv.classList.remove('zap'); return ok; }

    // pokojová snímka: jedna celá snímka z bloku v plnom rozlíšení na pokojovom canvase; ukáže sa po nakreslení, pri
    // pohybe sa len skryje (canvas pohybu pod ňou má tú istú snímku)
    var pokojSig = '', pokojPosl = '', pokojHotovo = '', pokojT = 0;
    function kresliPokoj() {
      var pa = poloha(), a = pa[0] + (pa[1] >= 0.5 ? 1 : 0), S = A, b = a / BL | 0;
      var bl = S.bloky[b], tok = bl && bl[a - b * BL];
      if (!tok) return;   // len plná snímka z bloku (kľúčová v polovičnom rozlíšení by ostrejšia nebola)
      var oh = ohnisko(S, a, a, 0), sig = a + ':' + oh[1].toFixed(4) + ':' + S.m + ':' + cwF + 'x' + chF;
      pokojSig = sig;
      if (pokojHotovo === sig) { if (!cv2.classList.contains('zap')) cv2.classList.add('zap'); return; }
      if (pokojPosl === sig) return;   // práve sa kreslí
      pokojPosl = sig;
      prikaz(1, cwF, chF, softver ? 'low' : 'high', [tok, 1, S], null, 0, oh[0], oh[1], function (ok) {
        pokojPosl = '';
        if (!ok) return;
        pokojHotovo = sig;
        if (pokojSig === sig && !poslViditelny && !cv2.classList.contains('zap')) cv2.classList.add('zap');
      });
    }
    function skryPokoj() { pokojSig = ''; if (pokojT) { clearTimeout(pokojT); pokojT = 0; } if (cv2.classList.contains('zap')) cv2.classList.remove('zap'); }
    function skusPokoj() {
      pokojT = 0;
      if (nejde || poslViditelny || fi < 0.002 || Math.abs(cil * (N - 1) - fi) > 0.002) return;
      var t = performance.now();
      if (t - tSkrol < 300 || t - tPohyb < 300) { pokojT = setTimeout(skusPokoj, 150); return; }   // stránka sa ešte hýbe
      if (window.scrollY >= top0 + len + pinH * 0.5) return;   // úvod je viac než z polovice preč
      kresliPokoj();
    }

    // ostrý posledný záber (img .posl): sťahuje sa od polovice filmu, ukáže sa (prelínanie 0,35 s), keď film dobehne
    // na poslednú snímku; geometria výrezu je rovnaká ako v canvase (object-position = ohnisko poslednej snímky)
    var poslStav = 0, poslViditelny = false;
    if (posl) {
      posl.style.setProperty('--poy-t', (D.oyP[N - 1] * 100).toFixed(1) + '%');
      posl.style.setProperty('--pox-p', (D.oxL[N - 1] * 100).toFixed(1) + '%');
      posl.style.setProperty('--poy-p', (D.oyL[N - 1] * 100).toFixed(1) + '%');
      poslImg.addEventListener('load', function () { poslKontrola(); });
    }
    function poslNacitaj() {
      if (!posl || poslStav) return; poslStav = 1;
      Array.prototype.forEach.call(posl.querySelectorAll('[data-srcset]'), function (el) { el.setAttribute('srcset', el.getAttribute('data-srcset')); });
      if (poslImg.getAttribute('data-src')) poslImg.setAttribute('src', poslImg.getAttribute('data-src'));
    }
    // obrázok zodpovedá aktívnej sade (po otočení telefónu sa <picture> prepne a načíta iný): dekódovať a pripraviť
    function poslKontrola() {
      if (!posl || !poslStav || nejde) return;
      var ok = poslImg.complete && poslImg.naturalWidth && Math.abs(poslImg.naturalWidth / poslImg.naturalHeight - A.fw / A.fh) < 0.02;
      if (!ok) { poslStav = 1; return; }
      var u = poslImg.currentSrc;
      var hotovo = function () { if (poslImg.currentSrc !== u) return; poslStav = 2; posl.classList.add('pripr'); znova = true; pohni(); };
      if (poslImg.decode) poslImg.decode().then(hotovo, hotovo); else hotovo();
    }
    function poslTeraz() {
      if (!posl) return;
      var chce = poslStav === 2 && fi >= N - 1.03 && cil * (N - 1) >= N - 1.03;
      if (chce !== poslViditelny) { poslViditelny = chce; posl.classList.toggle('zap', chce); if (chce) skryPokoj(); }
    }

    // text, stmavenie, vineta, titulky a nápoveda podľa polohy p (0–1) vo filme; zapisuje sa len zmena
    var tit = Array.prototype.slice.call(film.querySelectorAll('.titulky p')).map(function (el) {
      var p = function (sek) { var h = sek * 48, k = 0; while (k < N - 2 && D.hi[k + 1] < h) k++; return (k + Math.min(1, Math.max(0, (h - D.hi[k]) / (D.hi[k + 1] - D.hi[k])))) / (N - 1); };
      return { el: el, a: p(+el.getAttribute('data-od')), b: p(+el.getAttribute('data-do')), v: '' };
    });
    var pKon = Math.min(0.97, tit.length ? tit[tit.length - 1].b : 0.9);   // koniec posledného titulku
    var stav = {};
    function zapis(el, kluc2, hod, fn) { if (stav[kluc2] !== hod) { stav[kluc2] = hod; fn(el, hod); } }
    function sst(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
    function vrstvy(p) {
      var e = sst(p / 0.08), vh = H / 100;   // text ustúpi v prvých 8 % filmu (asi 1,4 s klipu)
      // text ostáva v strome prístupnosti aj v poradí Tab (len priehľadnosť, nie visibility); kliky prepustí ďalej
      zapis(text, 'tx', e.toFixed(3), function (el) {
        el.style.opacity = (1 - e).toFixed(3);
        el.style.transform = e ? 'translate3d(0,' + (-e * 7 * vh).toFixed(1) + 'px,0) scale(' + (1 - 0.035 * e).toFixed(4) + ')' : '';
        el.classList.toggle('pryc', e > 0.5);
        // telefón na výšku: tlačidlá pod autom idú pri odchode dole (k lište), nie hore cez auto
        // (vlastnosť translate, lebo transform tlačidiel drží animácia nábehu rise)
        if (cta) cta.style.translate = e && port ? '0 ' + (e * 15 * vh).toFixed(1) + 'px' : '';
      });
      // stmavenie pod textom odíde celé a skryje sa (o vrstvu menej pri skladaní obrazu), vineta .vin ostáva
      zapis(zatm, 'za', (1 - e).toFixed(3), function (el, v) { el.style.opacity = v; el.style.visibility = +v ? '' : 'hidden'; });
      if (cue) zapis(cue, 'cu', (1 - sst(p / 0.05)).toFixed(3), function (el, v) { el.style.opacity = v; el.style.visibility = +v ? '' : 'hidden'; });
      // koniec bez stmavnutia: po poslednom titulku vineta zoslabne na 20 %, posledná snímka ostane v plnom jase
      zapis(vin, 'vi', (1 - 0.8 * sst((p - pKon) / (1 - pKon))).toFixed(3), function (el, v) { el.style.opacity = v; });
      // titulky až s filmom: kým nie sú kľúčové snímky, nebežia nad stojacim obrazom
      var ma = A.kluc.length || Object.keys(A.bloky).length || (Z && Z.kluc.length) ? 1 : 0;
      tit.forEach(function (t, i) {
        var dl = 0.03, o = ma * Math.min(sst((p - t.a) / dl), sst((t.b - p) / dl)), y = p < (t.a + t.b) / 2 ? (1 - o) * 26 : -(1 - o) * 26;
        zapis(t.el, 'ti' + i, o.toFixed(3) + y.toFixed(1), function (el) {
          el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.001 ? 'visible' : '';
          el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
        });
      });
    }
    // fokus v texte úvodu (Shift+Tab z vyhľadávania): stránka sa vráti na začiatok filmu, aby bol text vidieť
    text.addEventListener('focusin', function () {
      if (nejde || window.scrollY <= top0 + 2) return;
      skoc(top0); cil = 0; fi = 0; znova = true; vrstvy(0); pohni();   // hneď, bez dobehu (fokus musí byť vidieť)
    });

    function ciel() { return Math.min(1, Math.max(0, (window.scrollY - top0) / len)); }
    function median(a) { if (!a.length) return 0; var s = a.slice().sort(function (x, y) { return x - y; }); return s[s.length >> 1]; }
    function tik(now) {
      var dt = Math.min(0.1, Math.max(0.001, (now - tPrev) / 1000)); tPrev = now;
      var target = cil * (N - 1), moving = Math.abs(target - fi) > 0.002;
      if (moving) {
        skryPokoj();
        // meranie plynulosti počas pohybu: perióda displeja = najkratší bežný interval (60 Hz → 16,7 ms, úsporný režim
        // 30 Hz → 33 ms); kreslenie nestíha, keď medián trvania kreslenia vo vlákne prekročí 0,9 periódy (pri kreslení na
        // hlavnom vlákne medián intervalu snímok 1,5 periódy). Bez grafického čipu sa úroveň nemení.
        ints.push(dt * 1000); if (ints.length > 16) ints.shift();
        if (ints.length === 16) {
          var s = ints.slice().sort(function (x, y) { return x - y; });
          per = Math.min(per, Math.max(6.5, s[1]));
          medPosl = ofs ? median(kMs) : s[8];
          if (!softver && uroven < 3 && medPosl > per * (ofs ? 0.9 : 1.5)) { uroven++; ints = []; kMs = []; medPosl = 0; }
        }
        nastavRozlisenie(sk(uroven));
        var f0 = fi;
        fi += (target - fi) * (1 - Math.exp(-dt / TAU));
        if (Math.abs(target - fi) < 0.002) fi = target;
        rych = rych * 0.6 + 0.4 * (fi - f0) / dt;
        var nb = blokTeraz() + ':' + blokPred(); if (nb !== tik.b) { tik.b = nb; planuj(); }
        tPohyb = now;
      } else rych = 0;
      var still = Math.abs(target - fi) <= 0.002, dotiahni = still && ostr < 1;
      ostr = still ? Math.min(1, ostr + dt / 0.2) : 0;   // za 0,2 s pokoja jedna celá snímka
      // kreslí sa aj v snímke, v ktorej obraz dobehol (návrat na 0 → ostrý prvý obraz)
      if (moving || !still || znova || dotiahni) { if (kresliAleboImg(!still)) znova = odlozene; vrstvy(fi / (N - 1)); }
      poslTeraz();
      if (fi < 0.002) skryPokoj();
      else if (still && ostr >= 1 && !pokojT && !poslViditelny && !cv2.classList.contains('zap')) pokojT = setTimeout(skusPokoj, 320);
      if (!still || ostr < 1 || znova) requestAnimationFrame(tik);
      else { beh = false; ints = []; }
    }
    function pohni() {
      if (nejde) return;
      var c = ciel(); if (c !== cil) smer = c > cil ? 1 : -1; cil = c;
      if (!beh) {
        beh = true; tPrev = performance.now();
        // po pauze o úroveň lepšie, ak bolo kreslenie plynulé (rezerva); inak by kvalita len skákala hore-dole
        if (!softver && uroven && tPrev - tPohyb > 800 && medPosl && medPosl <= per * (ofs ? 0.45 : 1.15)) { uroven--; medPosl = 0; }
        requestAnimationFrame(tik);
      }
    }
    // prehliadač nevie dekódovať snímky (napr. Safari bez AVIF): bez filmu, nič sa nesťahuje, nič sa nepripína
    function nejdeFilm() {
      if (nejde) return; nejde = true;
      var y = window.scrollY - top0;
      zavriBloky(A); zavriKluc(A); if (Z) zavriKluc(Z);
      cv.classList.remove('zap'); cv2.classList.remove('zap'); if (posl) posl.classList.remove('zap', 'pripr');
      [text, zatm, vin, cue, bgEl, cta].concat(tit.map(function (t) { return t.el; })).forEach(function (el) { if (el) { el.removeAttribute('style'); el.classList.remove('pryc'); } });
      clearTimeout(odkrT); if (animIO) animIO.disconnect(); if (odkrIO) odkrIO.disconnect(); skryte.forEach(function (el) { el.classList.remove('skryte', 'bezanim'); });
      bezFilmu(); topHranica = 8; onScroll();
      if (y > 0) skoc(top0 + Math.max(0, y - len));
    }

    // ďaleko za filmom: dekódované bloky preč (ostanú kľúčové snímky a skomprimované balíky)
    function zaFilmom() { return window.scrollY > top0 + len + 2 * pinH; }   // bez čítania rozloženia (skrolovanie)
    // odchod úvodu (koniec filmu): obraz ide pomalšie než stránka, svetlý pás sa vysunie nad neho; v CSS cez
    // animation-timeline, tu len náhrada pre prehliadače bez nej
    var odchodJS = !(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')), odchodPosl = '';
    function odchod() {
      var d = Math.min(pinH, Math.max(0, window.scrollY - top0 - len)), v = d ? 'translate3d(0,' + (d * 0.42).toFixed(1) + 'px,0)' : '';
      if (v !== odchodPosl) { odchodPosl = v; bgEl.style.transform = v; }
    }
    // obsah pod pásom Plná zásoba sa počas filmu nevykresľuje (trieda skryte na každej sekcii, content-visibility: hidden,
    // site.css): jeho obrázky by sa inak načítali a prekreslili uprostred filmu. Sekcie sa skryjú po prvom vykreslení
    // stránky (veľkosti ostanú zapamätané, contain-intrinsic-size auto), ak je obsah aspoň 600 px pod oknom. Každá sekcia
    // sa odkryje sama, keď je 1,5 obrazovky od okna (IntersectionObserver), takže práca s jej vykreslením je rozložená po
    // ceste a nikdy nevidno prázdne miesto; pri rýchlom prejazde sa sekcia do 300 px pod oknom odkryje hneď. Odkrytá
    // sekcia sa už neskrýva a trieda sa nemení na <html> (to prepočítalo štýly celej stránky).
    // Nekonečné animácie v sekcii (pás značiek, živé fotky) sa pred skrytím zastavia (bezanim) a bežia len vtedy, keď je
    // sekcia do pol obrazovky od okna: spustená v skrytom obsahu by ostala na hlavnom vlákne a každé spustenie pridáva
    // vrstvy kompozítora.
    var tSkrol = 0, skryteJe = false, hranica = 0, sekTop = [], ostava = 0, odkrT = 0;
    var skryte = Array.prototype.slice.call(d.querySelectorAll('body.home main>.zasoba~*'));
    function zmerajSekcie() {
      var y = window.scrollY;
      sekTop = skryte.map(function (el) { return el.getBoundingClientRect().top + y; });
      hranica = sekTop.length ? sekTop[0] - window.innerHeight - 600 : top0 + len;
    }
    var maIO = 'IntersectionObserver' in window;
    var animIO = maIO ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.target.__odk) e.target.classList.toggle('bezanim', !e.isIntersecting); });
    }, { rootMargin: '50% 0px 50% 0px' }) : null;
    var odkrIO = maIO ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) odkry(e.target); });
    }, { rootMargin: '150% 0px 150% 0px' }) : null;
    // najprv sa zastavia animácie (bezanim), o dve snímky neskôr sa sekcie skryjú
    function skryNaZaciatku() {
      if (nejde || skryteJe || !skryte.length || window.scrollY >= hranica) return;
      skryteJe = true; ostava = skryte.length;
      skryte.forEach(function (el) { el.classList.add('bezanim'); });
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (nejde) return;
        skryte.forEach(function (el) { if (!el.__odk) { el.classList.add('skryte'); if (odkrIO) odkrIO.observe(el); } });
      }); });
    }
    function odkry(el) {
      if (el.__odk) return; el.__odk = 1; ostava--;
      if (odkrIO) odkrIO.unobserve(el);
      el.classList.remove('skryte');
      if (animIO) animIO.observe(el); else requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('bezanim'); }); });
    }
    // náhrada bez IntersectionObserver: na konci filmu po jednej sekcii každých 140 ms
    function krokOdkrytia() { odkrT = 0; for (var i = 0; i < skryte.length; i++) if (!skryte[i].__odk) { odkry(skryte[i]); odkrT = setTimeout(krokOdkrytia, 140); return; } }
    // obrázky prvých skrytých sekcií (logá značiek, fotky kategórií, fotka pásu Sklad a doprava) a ostrý posledný záber
    // sa pripravia počas filmu, kým je obsah ešte skrytý, aby sa pri odkrytí nič nesťahovalo ani nespracúvalo naraz
    // (27 lôg a 16 fotiek v jednej snímke dávalo na konci filmu snímky 67–117 ms). Najprv ich vlákno stiahne do
    // vyrovnávacej pamäte prehliadača (hlavné vlákno nepracuje); potom sa po jednom každých 50 ms načítajú z pamäte ako
    // obrázok a dekódujú (z pamäte je to krátka práca). Začne sa pri prvom skrolovaní vo filme, keď je
    // film stiahnutý (na pomalej sieti až v polovici filmu, aby nebral pásmo filmu).
    var poslNeskor = false, vopred = [], vopredZac = false, vopredRad = [], vopredBezi = false, vopredUrl = {};
    // poradie podľa odkrývania: posledný záber, logá (pás značiek), fotky kategórií, fotka pásu Sklad a doprava
    [1, 2].forEach(function (i) { if (skryte[i]) Array.prototype.forEach.call(skryte[i].querySelectorAll('img[loading="lazy"]'), function (im) { var u = im.getAttribute('src'); if (u && vopred.indexOf(u) < 0) vopred.push(u); }); });
    // obrázok z <picture>: kandidát podľa media a srcset (AVIF, film beží len s AVIF) pre potrebnú šírku v pixeloch
    function kandidat(pic, potreba) {
      var kand = null;
      Array.prototype.some.call(pic.querySelectorAll('source[type="image/avif"]'), function (s) {
        var m = s.getAttribute('media'); if (m && !window.matchMedia(m).matches) return false;
        var c = (s.getAttribute('srcset') || s.getAttribute('data-srcset')).split(',').map(function (x) { var p = x.trim().split(/\s+/); return [p[0], parseInt(p[1], 10)]; }).sort(function (a, b) { return a[1] - b[1]; });
        kand = (c.filter(function (x) { return x[1] >= potreba; })[0] || c[c.length - 1])[0]; return true;
      });
      return kand;
    }
    var pasPic = d.querySelector('body.home .band picture'), vw = window.innerWidth, hus = window.devicePixelRatio || 1;
    var kPas = pasPic && kandidat(pasPic, (vw <= 540 ? Math.max(1.04 * vw, 485) : vw <= 700 ? 1013 : vw) * hus);
    if (kPas) vopred.push(kPas);
    // posledný záber: srcset podľa šírky (telefón na výšku max(100vw, 46,2vh), inak max(100vw, 177,8vh)); bez <source> img
    var kPosl = null;
    if (posl) {
      var ps = posl.querySelector('source'), vys = window.innerHeight;
      kPosl = ps && window.matchMedia(ps.getAttribute('media')).matches ? kandidat(posl, Math.max(vw, 0.462 * vys) * hus) : null;
      if (!kPosl) { var pi = poslImg.getAttribute('data-srcset').split(',').map(function (x) { var p = x.trim().split(/\s+/); return [p[0], parseInt(p[1], 10)]; }); kPosl = (pi.filter(function (x) { return x[1] >= Math.max(vw, 1.778 * vys) * Math.min(hus, 1.5); })[0] || pi[pi.length - 1])[0]; }
      vopred.unshift(kPosl);
    }
    // úplné adresy (vlákno má adresu blob:, relatívna adresa by v ňom neplatila)
    vopred = vopred.map(function (u) { return new URL(u, location.href).href; }); if (kPosl) kPosl = vopred[0];
    function vopredZacni() {
      if (vopredZac || nejde) return; vopredZac = true;
      if (src.v) src.v(vopred); else vopred.forEach(vopredHotove);
    }
    function vopredHotove(u) {
      // srcset posledného záberu (<picture> ho vezme z pamäte), ale až od tretiny filmu: na začiatku by spracovanie
      // obrázka padlo na prvé snímky pohybu
      if (u === kPosl) { if (fi >= 0.33 * (N - 1)) poslNacitaj(); else poslNeskor = true; return; }
      vopredRad.push(u); if (!vopredBezi) vopredDalsi();
    }
    function vopredDalsi() {
      var u = vopredRad.shift(); vopredBezi = !!u; if (!u) return;
      if (!vopredUrl[u]) {
        // samostatný obrázok s tou istou adresou (skrytý obsah lenivé obrázky nesťahuje); <img> ho potom vezme z pamäte
        var x = new Image(); x.decoding = 'async'; x.src = u; vopredUrl[u] = x;
        if (x.decode) x.decode().catch(function () {});   // dekódovanie mimo hlavného vlákna teraz, nie pri prvom vykreslení
      }
      setTimeout(vopredDalsi, 50);
    }
    function filmStiahnuty() { for (var b = 0; b < NB; b++) if (A.stiah[b] !== 2) return false; return A.kStav === 2; }
    function pohybVoFilme() {
      var y = window.scrollY;
      if (!vopredZac && y > top0 + 2 && (filmStiahnuty() || y > top0 + 0.5 * len)) vopredZacni();
      if (poslNeskor && y > top0 + 0.33 * len) { poslNeskor = false; poslNacitaj(); }
      if (!skryteJe) skryNaZaciatku();
      if (!skryteJe || ostava <= 0 || y < hranica) return;
      // poistka pri rýchlom prejazde: sekcia do 300 px pod oknom sa odkryje hneď (prázdne miesto nikdy nie je vidieť)
      var dole = y + window.innerHeight + 300;
      for (var i = 0; i < skryte.length; i++) if (!skryte[i].__odk && sekTop[i] < dole) odkry(skryte[i]);
      if (!odkrIO && !odkrT) krokOdkrytia();
    }
    window.addEventListener('scroll', function () { if (nejde) return; tSkrol = performance.now(); pohybVoFilme(); if (odchodJS) odchod(); if (zaFilmom()) { if (Object.keys(A.bloky).length) uprac(true); return; } pohni(); }, { passive: true });
    var lw = window.innerWidth, lo = window.matchMedia(UZKE).matches;
    window.addEventListener('resize', function () {
      if (nejde) return;
      var o = window.matchMedia(UZKE).matches;
      if (o === lo && Math.abs(window.innerWidth - lw) < 2 && Math.abs(cv.clientHeight - H) < 2) { zmeraj(); return; }   // lišta prehliadača
      lw = window.innerWidth; lo = o;
      // po otočení ostane rovnaké miesto vo filme (dráha má inú dĺžku, preto sa posunie aj skrolovanie)
      var pStare = fi / (N - 1), vnutri = window.scrollY > top0 && window.scrollY < top0 + len;
      var zmena = vyberSadu();
      if (zmena && softver) uroven = urovenStart();   // bez grafického čipu sa úroveň inak nemení
      zmeraj(); posl0 = ''; znova = true; skryPokoj(); pokojHotovo = '';
      if (vnutri) { skoc(Math.round(top0 + pStare * len)); cil = pStare; }
      if (zmena) { pripravPrvy(); planuj(); }
      // ostrý posledný záber: <picture> si po otočení vyberie iný obrázok, pripraví sa znova
      if (poslStav) { poslStav = 1; poslViditelny = false; posl.classList.remove('zap', 'pripr'); setTimeout(poslKontrola, 0); }
      // hneď v tejto snímke: stará sada alebo prvý obraz, nikdy čierna plocha (canvas sa zmení až s novou snímkou)
      if (kresliAleboImg(false)) znova = odlozene;
      stav = {}; vrstvy(fi / (N - 1));
      pohni();
    });

    // prvý obraz ako snímka 0 (rovnaký výrez), dekódovaný vopred, aby prvé kreslenie nečakalo
    function pripravPrvy() {
      var S = A;
      var hotovo = function () {
        if (S !== A || S.prvy || S.prvyCaka || !prvy.naturalWidth || Math.abs(prvy.naturalWidth / prvy.naturalHeight - S.fw / S.fh) > 0.02) return;
        // mierka podľa skutočných pixelov bitmapy (naturalWidth obrázka zo srcset je prepočítaný na hustotu, napr. 390 namiesto 720)
        S.prvyCaka = 1;
        createImageBitmap(prvy).then(function (bm) {
          var m = bm.width / S.fw, px = bm.width * bm.height;
          return src.p(bm).then(function (tok) { S.prvyCaka = 0; if (S.prvy) { zavri([tok]); return; } S.prvy = tok; S.prvyM = m; S.prvyPx = px; znova = true; pohni(); });
        }).catch(function () { S.prvyCaka = 0; });
      };
      if (prvy.complete) hotovo();
      prvy.addEventListener('load', hotovo, { once: true });
    }

    vyberSadu(); uroven = urovenStart(); zmeraj();
    // grafický čip: WebGPU adaptér (bez neho alebo náhradný softvérový = softvérové kreslenie); bez WebGPU sa predpokladá čip
    if (navigator.gpu && navigator.gpu.requestAdapter) navigator.gpu.requestAdapter().then(function (a) {
      softver = !a || !!a.isFallbackAdapter || !!(a.info && a.info.isFallbackAdapter);
      if (!tPohyb) uroven = urovenStart();
      if (softver && !nejde) { zmeraj(); znova = true; pohni(); }   // menšie plátno
    }, function () {});
    fi = cil = ciel();  fi *= N - 1;   // po návrate na stránku v polovici filmu bez prejazdu od začiatku
    cil = fi / (N - 1); vrstvy(cil);
    if (cil > 0.5) vopredZacni();
    pripravPrvy();
    // film sa začne sťahovať po prvom obraze (ten má celú linku), najneskôr po 4 s
    var start = function () { if (start.r) return; start.r = 1; planuj(); };
    if (prvy.complete) start(); else { prvy.addEventListener('load', start, { once: true }); prvy.addEventListener('error', start, { once: true }); }
    setTimeout(start, 4000);
    // po načítaní: znova rozmery a obsah pod filmom skrytý (po dvoch snímkach, aby boli veľkosti sekcií zapamätané)
    window.addEventListener('load', function () { if (nejde) return; zmeraj(); pohni(); requestAnimationFrame(function () { requestAnimationFrame(skryNaZaciatku); }); });
    pohni();
    // stav pre meranie (sada, stiahnuté bajty, dekódované bloky, pamäť a kreslenie)
    function pamat() {
      var s = 0;
      for (var k in sady) { var S = sady[k]; s += S.kluc.length * S.fw * S.fh; for (var b in S.bloky) s += S.bloky[b].length * S.fw * S.fh * 4; if (S.prvy) s += S.prvyPx * 4; }
      return s;
    }
    window.richtarikFilm = function () {
      return { sada: A.m, softver: softver, vlakno: ofs, z: Z ? Z.m + ':' + Z.kluc.length : '', kluc: A.kluc.length, bloky: Object.keys(A.bloky).map(Number), stiahnute: Object.keys(A.stiah).filter(function (b) { return A.stiah[b] === 2; }).length, bajty: bajty, pamat: pamat(), uroven: uroven, perioda: +per.toFixed(1),
        canvas: [cwM, chM], pokoj: pokojHotovo && cv2.classList.contains('zap') ? [cwF, chF] : null, posl: poslStav + (poslViditelny ? '+' : ''), kreslenie: { n: kStat.n, max: +kStat.max.toFixed(1), priemer: kStat.n ? +(kStat.sum / kStat.n).toFixed(1) : 0 }, skryte: skryteJe ? ostava : 0, fi: fi, koniec: N - 1, nejde: nejde };
    };
  })();

  // prechod pri preklikávaní, kde prehliadač nevie prechod medzi dokumentmi (bez udalosti pagereveal alebo bez View
  // Transitions): stránka 0,2 s zmizne do svetlého podkladu, potom sa načíta nová
  if (!('onpagereveal' in window && 'startViewTransition' in d) && !reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]'); if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-lb')) return;
      var href = a.getAttribute('href'); if (!href || /^(#|mailto:|tel:|javascript:)/.test(href) || !/\.html(#|$)|\/$/.test(href)) return;
      e.preventDefault(); d.body.classList.add('leaving');
      setTimeout(function () { location.href = href; }, 200);
    });
    window.addEventListener('pageshow', function () { d.body.classList.remove('leaving'); });
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
    function show(i) {
      cur = (i + links.length) % links.length; var a = links[cur];
      img.src = a.getAttribute('href'); img.alt = caption(a) || 'Fotografia';
      cap.textContent = caption(a); cnt.textContent = links.length > 1 ? (cur + 1) + ' / ' + links.length : '';
      prev.hidden = next.hidden = links.length < 2;
    }
    // každý odkaz na zväčšenie má meno pre čítačku: popisok fotky, inak „Zväčšiť fotografiu“
    all().forEach(function (a) { if (!a.getAttribute('aria-label')) { var c = caption(a); a.setAttribute('aria-label', c ? 'Zväčšiť: ' + c : 'Zväčšiť fotografiu'); } });
    function openLb(a) { links = all(); spat = a; lb.hidden = false; d.body.style.overflow = 'hidden'; show(links.indexOf(a)); lb.querySelector('.lb-x').focus(); }
    function close() { lb.hidden = true; img.src = ''; d.body.style.overflow = ''; if (spat) { spat.focus({ preventScroll: true }); spat = null; } }
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lb]'); if (!a) return;
      e.preventDefault(); openLb(a);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    prev.addEventListener('click', function () { show(cur - 1); });
    next.addEventListener('click', function () { show(cur + 1); });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50 && links.length > 1) show(cur + (dx < 0 ? 1 : -1)); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Tab') pasca(lb, e);
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr && dr.classList.contains('open')) open(false); });

  // vyhľadávanie: index sa stiahne pri prvom písaní, hľadá sa bez diakritiky
  var q = d.getElementById('q'), res = d.getElementById('res');
  if (!q || !res) return;
  var idx = null, loading = false, stav = d.getElementById('res-stav');
  if (!q.getAttribute('aria-controls')) q.setAttribute('aria-controls', 'res');
  function ukaz(v, text) { res.hidden = !v; q.setAttribute('aria-expanded', String(v)); if (stav && text !== undefined) stav.textContent = text; }
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
    if (v.length < 2) { res.innerHTML = ''; ukaz(false, ''); return; }
    var words = v.split(/\s+/);
    var hits = idx.filter(function (it) { return words.every(function (w) { return it.n.indexOf(w) >= 0; }); });
    hits.sort(function (a, b) { var ta = norm(a.t).indexOf(words[0]) >= 0 ? 0 : 1, tb = norm(b.t).indexOf(words[0]) >= 0 ? 0 : 1; return ta - tb; });
    hits = hits.slice(0, 8);
    if (!hits.length) { res.innerHTML = '<div class="none">Nič sme nenašli. Zavolaj 0905 622 223, poradíme.</div>'; ukaz(true, 'Nič sme nenašli.'); return; }
    res.innerHTML = hits.map(function (it) {
      var i = it.n.indexOf(words[0]), s = Math.max(0, i - 40), frag = (it.t + ' ' + it.k + ' ' + it.x).slice(s, s + 120);
      return '<a href="' + pre + it.p + '"><small>' + esc(it.k) + '</small><b>' + esc(it.t) + '</b><span>' + (s ? '…' : '') + esc(frag) + '…</span></a>';
    }).join('');
    ukaz(true, 'Výsledky hľadania: ' + hits.length + (hits.length === 1 ? ' stránka' : hits.length < 5 ? ' stránky' : ' stránok'));
  }
  q.addEventListener('input', function () { load(render); if (idx) render(); });
  q.addEventListener('focus', function () { load(render); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var f = res.querySelector('a'); if (f) location.href = f.href; }
    if (e.key === 'Escape') { ukaz(false); }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.search')) ukaz(false); });
})();
