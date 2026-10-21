/* PROTOTYP „fotky ako na PC“ (len ľahký telefón, trieda lite; ?foto=A|B|C, B má aj &rozmaz=css, C aj &c=2172).
   A = dnešný stav (výrez -m na výšku, pomalé priblíženie zo skrolu) – tento skript nič nemení.
   B = celá fotka na šírku displeja (súbor <meno>-1448), nad a pod ňou tá istá fotka rozmazaná a stmavená.
       Predvolene je rozmazanie predpočítané raz do plátna 36 px (žiadny filter pri kreslení);
       &rozmaz=css: druhý <img> s tým istým súborom a CSS filter: blur na statickej vrstve.
   C = fotka na šírku na výšku displeja, pomalý časový prejazd zľava doprava (CSS animácia transform).
   Skript je klasický a synchrónny: fotoFix() sa volá na šablónu úvodu pred vložením a na koniec tela pred
   app.js, teda skôr, než sa začne sťahovať ktorákoľvek záloha mimo úvodu (tie majú display: none a lazy). */
(function (w, d) {
  var h = d.documentElement;
  var B = h.classList.contains('foto-b'), C = h.classList.contains('foto-c');
  var cssBlur = B && /[?&]rozmaz=css\b/.test(location.search);
  var c2172 = C && /[?&]c=2172\b/.test(location.search);
  if (cssBlur) h.classList.add('foto-b-css');

  function paintBg(img, cv) {
    // rozmazané pozadie: obraz zmenšený na 36 px šírky okna (cover okolo bodu záujmu) + jemné rozmazanie
    // v plátne, stmavenie zapečené; v CSS sa len zväčší (bilineárne), filter sa pri kreslení nepočíta
    try {
      var vw = innerWidth, vh = innerHeight, W = 36, H = Math.max(2, Math.round(W * vh / vw));
      cv.width = W; cv.height = H;
      var x = cv.getContext('2d'), iw = img.naturalWidth, ih = img.naturalHeight;
      var s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
      var fx = parseFloat(img.parentNode.style.getPropertyValue('--fxn')) || 0.5;
      var dx = Math.min(0, Math.max(W - dw, W / 2 - fx * dw)), dy = (H - dh) / 2;
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      if ('filter' in x) x.filter = 'blur(1.2px)';
      x.drawImage(img, dx - 2, dy - 2, dw + 4, dh + 4);
      x.filter = 'none';
      x.fillStyle = 'rgba(14, 13, 12, 0.52)'; x.fillRect(0, 0, W, H);
      cv.classList.add('is-painted');
    } catch (e) {}
  }

  w.fotoFix = function (root) {
    if (!B && !C) return;
    var pics = root.querySelectorAll('.film-shot.is-title picture.film-still, picture.film-still');
    for (var i = 0; i < pics.length; i++) {
      var p = pics[i];
      if (p.__foto) continue; p.__foto = 1;
      // preč telefónny výrez na výšku (-m): ostáva fotka na šírku ako na počítači
      var ms = p.querySelectorAll('source[media]');
      for (var j = 0; j < ms.length; j++) ms[j].remove();
      var pa = parseFloat(p.style.getPropertyValue('--pa')) || 1.5;
      // B: fotka má šírku okna; C: výšku okna, teda šírku pa × výška okna
      var sizes = B ? '100vw' : Math.round(pa * 100) + 'vh';
      var els = p.querySelectorAll('source, img');
      for (var k = 0; k < els.length; k++) {
        var e = els[k];
        if (c2172) {
          var ss = e.getAttribute('srcset');
          if (ss) e.setAttribute('srcset', ss.split(',').filter(function (c) { return !/-(2896|4096)\./.test(c); }).join(','));
        }
        e.setAttribute('sizes', sizes);
      }
      var img = p.querySelector('img');
      if (!img) continue;
      img.classList.add('foto-main');
      if (B && cssBlur) {
        // druhý obrázok s tým istým súborom (rovnaké <source>, teda rovnaké currentSrc a cache), staticky rozmazaný
        var bg = img.cloneNode(false);
        bg.className = 'foto-bg'; bg.alt = ''; bg.setAttribute('aria-hidden', 'true'); bg.removeAttribute('fetchpriority');
        p.insertBefore(bg, img);
      } else if (B) {
        var cv = d.createElement('canvas');
        cv.className = 'foto-bg foto-bg-cv'; cv.setAttribute('aria-hidden', 'true');
        p.insertBefore(cv, img);
        (function (img, cv) {
          var go = function () {
            if (!(img.complete && img.naturalWidth)) return;
            (img.decode ? img.decode() : Promise.resolve()).then(function () { paintBg(img, cv); }, function () { paintBg(img, cv); });
          };
          img.addEventListener('load', go);
          go();
        })(img, cv);
      }
    }
  };
})(window, document);
