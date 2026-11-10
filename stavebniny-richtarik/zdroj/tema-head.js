/* Téma podkladu. Predvolená je FAREBNÁ (Lajo 10. 11. 2026: majiteľ chce farebný podklad podľa svojho nového loga a karty:
   červená loga, antracit, biela): atribút data-tema="farebna" je priamo v HTML každej stránky (build.py šablóna, index.html,
   asistent/ochrana-udajov.html), takže web je farebný aj bez JavaScriptu a nič sa neprekresľuje. Tento skript beží pred
   štýlom (teda pred prvým vykreslením) a atribút len prepne pre porovnanie: ?tema=svetla (svetlý papier, bez atribútu) a
   ?tema=tmava (čierno-biela) sa zapamätajú (localStorage tema), ?tema=farebna voľbu zruší, bez parametra platí zapamätaná
   voľba. Prepne aj farbu lišty prehliadača (theme-color). V ráme bez úložiska (sandbox) alebo so zakázaným úložiskom platí
   len parameter v adrese. Zdroj skriptu, ktorý build.py:TEMA_HEAD zmenší a vloží do <head> každej stránky pred štýl
   (index.html cez zdroj/tema_vloz.py, asistent/ochrana-udajov.html medzi značky <!--tema-->; kontrola_uvodu() overí zhodu).
   Tokeny: site.css, časti „Tmavá téma“ a „Farebná téma“; zápis: richtarik/majitel/farebna/ZAPIS.md. */
(function (h, d) {
  try {
    var m = /[?&]tema=(farebna|svetla|tmava)\b/.exec(location.search), s = null, t = m ? m[1] : '';
    try { s = window.localStorage; } catch (e) { s = null; }
    if (t && s) { if (t === 'farebna') s.removeItem('tema'); else s.setItem('tema', t); }
    if (!t && s) t = s.getItem('tema') || '';
    if (t === 'tmava' || t === 'svetla') {
      if (t === 'tmava') h.setAttribute('data-tema', t); else h.removeAttribute('data-tema');
      var c = d.querySelector('meta[name="theme-color"]');
      if (c) c.setAttribute('content', t === 'tmava' ? '#121110' : '#faf8f4');
    }
  } catch (e) {}
})(document.documentElement, document);
