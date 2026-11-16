// Nasadenie bez komentárov – čisté jadro bez Node (source/tools/zmensi.mjs pri nasadení, admin/zostav.js pri uložení zo
// správy webu na vlastnej doméne). Pravidlá sú opísané v source/tools/zmensi.mjs.

/* HTML bez komentárov a bez odsadenia riadkov; časti v <script>, <style>, <textarea>, <pre> ostanú nedotknuté */
export function bezKomentarovHtml(html) {
  const chran = /<(script|style|textarea|pre)\b[\s\S]*?<\/\1\s*>/gi;
  const cisti = (t) => t.replace(/^[ \t]*<!--(?!\[if)[\s\S]*?-->[ \t]*\r?\n/gm, '').replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/\n[ \t]+/g, '\n');
  let out = '', i = 0, m;
  while ((m = chran.exec(html))) { out += cisti(html.slice(i, m.index)) + m[0]; i = m.index + m[0].length; }
  return out + cisti(html.slice(i));
}

/* CSS bez komentárov, alebo null, keď súbor má url( alebo /* v reťazci (ponechá sa celý) */
export function bezKomentarovCss(css) {
  if (/url\(/.test(css) || /(["'])[^"'\n]*\/\*[^"'\n]*\1/.test(css)) return null;
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n');
}
