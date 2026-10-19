// Pokusné úpravy pre meranie A/B bez zmeny repozitára: súbory sa podvrhnú cez page.route (len v meraní).
//  premenne: app.js píše --sp na img zálohy, --o na .title-frame, --so na .film-still (namiesto na kotvu, odkiaľ sa
//            dedia do celej kotvy); premenné registrované @property s inherits: false (nededia sa ďalej)
//  bezanim:  nekonečné animácie ekvalizéra Hudba a lesku tlačidla vypnuté (na porovnanie ich ceny pri skrole)
//  bezfontface: i18n.css bez @font-face Manrope s cyrilikou (overenie, či pridanie písma spôsobí rozloženie celej stránky)
//  bezkinfilter: slová kinetických nadpisov (.kw) bez rozmazania (filter), len posun a krytie
//  bezflap:  tabuľa hodín bez vynúteného rozloženia (void offsetWidth) – preklopenie cez Web Animations API
import fs from 'fs';
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs2/barbershop-30/assets/';
export async function patch(page, which) {
  await page.route('**/assets/app.js', (route) => {
    let s = fs.readFileSync(ROOT + 'app.js', 'utf8');
    if (which.includes('premenne')) {
      const r = [
        ["return { el, top, height: Math.max(1, r.height), items, title, free, first: title && top < 1 };", "return { el, top, height: Math.max(1, r.height), items, title, free, first: title && top < 1, img: el.querySelector('.film-still img'), fr: el.querySelector('.title-frame'), st: el.querySelector('.film-still') };"],
        ["setVar('--sp', t, s.el);", "if (s.img) setVar('--sp', t, s.img);"],
        ["setVar('--o', o, s.el);", "setVar('--o', o, s.fr || s.el);"],
        ["setVar('--so', so, s.el);", "setVar('--so', so, s.st || s.el);"],
      ];
      for (const [a, b] of r) { if (!s.includes(a)) throw new Error('zaplata nesedi: ' + a); s = s.replace(a, b); }
    }
    if (which.includes('bezflap')) {
      const a = "const tick = () => { b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip');";
      if (!s.includes(a)) throw new Error('zaplata flap nesedi');
      s = s.replace(a, "const tick = () => { b.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.2)' }, { transform: 'scaleY(1)' }], { duration: 90 });");
    }
    route.fulfill({ status: 200, contentType: 'text/javascript', body: s });
  });
  await page.route('**/assets/style.css', (route) => {
    let s = fs.readFileSync(ROOT + 'style.css', 'utf8');
    if (which.includes('premenne')) s += "\n@property --sp { syntax: '<number>'; inherits: false; initial-value: 0; }\n@property --o { syntax: '<number>'; inherits: false; initial-value: 0; }\n@property --so { syntax: '<number>'; inherits: false; initial-value: 0; }\n";
    if (which.includes('bezkinfilter')) s += "\n.js-kin .kin .kw { filter: none !important; transition-property: transform, opacity !important; }\n";
    if (which.includes('bezanim')) s += "\n.hudba-eq i, .btn-primary::after { animation: none !important; }\n";
    route.fulfill({ status: 200, contentType: 'text/css', body: s });
  });
  if (which.includes('bezfontface')) await page.route('**/assets/i18n.css', (route) => {
    const s = fs.readFileSync(ROOT + 'i18n.css', 'utf8').replace(/@font-face[^}]*}/g, '');
    route.fulfill({ status: 200, contentType: 'text/css', body: s });
  });
}
