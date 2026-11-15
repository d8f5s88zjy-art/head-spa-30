/* Správa webu: zmenšenie fotky v telefóne pred odoslaním (zmizne EXIF aj GPS, HEIC sa zmení na JPEG), potvrdenia,
   ďalší riadok ceny, počítadlá znakov. Bez knižníc; bez JS funguje všetko okrem zmenšenia fotky v telefóne. */
(function () {
  'use strict';
  var d = document;
  // potvrdenie pred nebezpečným úkonom
  d.addEventListener('submit', function (e) {
    var f = e.target, t = f.getAttribute('data-potvrdit');
    if (t && !window.confirm(t)) { e.preventDefault(); return; }
    var b = f.querySelector('button[type=submit]');
    if (b && !f.hasAttribute('data-odoslane')) { f.setAttribute('data-odoslane', '1'); setTimeout(function () { b.disabled = true; b.textContent = 'Čakajte…'; }, 0); }
    else if (b) e.preventDefault();
  });
  // ďalší riadok v tabuľke cien
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pridaj-riadok]');
    if (!b) return;
    var fs = b.closest('fieldset'), riadky = fs.querySelector('.riadky'), posl = riadky.lastElementChild;
    if (!posl) return;
    var novy = posl.cloneNode(true), n = riadky.children.length;
    Array.prototype.forEach.call(novy.querySelectorAll('input'), function (i) { i.value = ''; i.name = i.name.replace(/\[r\]\[\d+\]/, '[r][' + n + ']'); });
    riadky.appendChild(novy);
    novy.querySelector('input').focus();
  });
  // počítadlo znakov: text sa nikdy neoreže (S7); nad limitom počítadlo zčervená a povie, o koľko skrátiť
  Array.prototype.forEach.call(d.querySelectorAll('[data-pocitadlo]'), function (p) {
    var s = d.createElement('small'), max = +(p.getAttribute('data-max') || p.getAttribute('maxlength'));
    if (!max) return;
    s.className = 'pocet'; s.setAttribute('aria-live', 'polite');
    p.parentNode.appendChild(s);
    function obnov() {
      var n = p.value.length, nad = n - max;
      s.textContent = n + ' / ' + max + ' znakov' + (nad > 0 ? ' – skráťte o ' + nad : '');
      s.classList.toggle('prilis', nad > 0);
    }
    p.addEventListener('input', obnov); obnov();
  });
  // fotka: zmenšenie v telefóne na najviac 2400 px a JPEG 0,9
  Array.prototype.forEach.call(d.querySelectorAll('input[data-fotka]'), function (inp) {
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f || !window.createImageBitmap || !window.DataTransfer || f.size < 400000 && /jpe?g|png|webp/.test(f.type)) return;
      var stav = d.createElement('small'); stav.textContent = 'Pripravujem fotku…'; inp.parentNode.appendChild(stav);
      createImageBitmap(f, { imageOrientation: 'from-image' }).then(function (bmp) {
        var k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height)), c = d.createElement('canvas');
        c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        c.toBlob(function (blob) {
          if (!blob) { stav.textContent = ''; return; }
          var dt = new DataTransfer();
          dt.items.add(new File([blob], (f.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
          inp.files = dt.files;
          stav.textContent = 'Fotka je pripravená (' + Math.round(blob.size / 1024) + ' kB).';
        }, 'image/jpeg', 0.9);
      }).catch(function () { stav.textContent = ''; });
    });
  });
})();
