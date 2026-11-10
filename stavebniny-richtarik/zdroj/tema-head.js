/* Téma podkladu (majiteľ 9. 11. 2026: aj čierno-biely podklad; tokeny v site.css, časť „Tmavá téma“). Zdroj skriptu, ktorý
   build.py:TEMA_HEAD zmenší a vloží do <head> každej stránky pred štýl (index.html ručne, asistent/ochrana-udajov.html medzi
   značky <!--tema-->; kontrola_uvodu() overí zhodu). Beží pred prvým vykreslením, takže sa nič neprekreslí zo svetlej na tmavú:
   ?tema=tmava zapne tmavý variant a zapamätá si ho (localStorage tema), ?tema=svetla voľbu zruší, bez parametra platí
   zapamätaná voľba. Nastaví len atribút data-tema="tmava" na <html> a farbu lišty prehliadača (theme-color). Bez JS,
   v ráme bez úložiska (sandbox) alebo so zakázaným úložiskom ostáva svetlý variant (parameter v adrese funguje aj tam).
   Skrytý prepínač v hlavičke zatiaľ nie je (rozhodne majiteľ); mechanizmus a zápis: richtarik/majitel/tema/ZAPIS.md. */
(function (h, d) {
  try {
    var m = /[?&]tema=(tmava|svetla)\b/.exec(location.search), s = null, t = m ? m[1] : '';
    try { s = window.localStorage; } catch (e) { s = null; }
    if (t && s) { if (t === 'tmava') s.setItem('tema', t); else s.removeItem('tema'); }
    if (!t && s) t = s.getItem('tema') || '';
    if (t === 'tmava') {
      h.setAttribute('data-tema', 'tmava');
      var c = d.querySelector('meta[name="theme-color"]');
      if (c) c.setAttribute('content', '#121110');
    }
  } catch (e) {}
})(document.documentElement, document);
