/*
 * BARBERSHOP 30 – vizitka a vernostná kartička v pásme pod kontaktom.
 * Vizitka: tá, ktorú Barbershop 30 už má a rozdáva na recepcii (fotka source/photos/foto-17.jpg), nie nový návrh:
 * na výšku, diagonálne pruhy barber pole (červená, biela, modrá), biely kruh s pôvodným logom „30 Barbershop
 * Holičstvo“ (vektor zo starého webu source/web-povodny/logo-vector-black.svg → assets/img/logo-30-barbershop.webp)
 * a pod ním kontakt. Na prednej strane len riadky, ktoré sa dajú z fotky prečítať a sedia s overenými údajmi;
 * zadná strana sú pruhy s kruhom a logom. Uložiť kontakt otvorí assets/barbershop30.vcf (iPhone ho rovno ponúkne
 * pridať do kontaktov, preto bez atribútu download).
 * Vernostná kartička: ukážka kartičky z vernostného systému (rovnaký vzhľad ako vernost/karta) a ako funguje.
 * Ukáže sa len so zapnutou prihláškou (vernost.js s atribútom data-zapnute, nasadenie ho pridá s heslom recepcie)
 * alebo keď má návštevník kartičku uloženú; tlačidlo otvorí prihlášku alebo uloženú kartičku (vernost.js, prvky
 * data-vernost-karta). ?vernost=ukazka ju ukáže na kontrolu s vypnutým tlačidlom.
 * Modul načíta app.js (časť 7b5) po načítaní stránky a zavolá spusti(pas kontaktu). Texty sú v 8 jazykoch tu (T);
 * vizitka je slovenská ako vytlačená.
 */
const html = document.documentElement;
const K_KARTA = 'v30.karta.barbershop';

const T = {
  sk: { vEy: 'Naša vizitka', vH: 'Ulož si nás do telefónu', vcf: 'Uložiť kontakt', pred: 'Vizitka Barbershop 30, predná strana s logom a kontaktom', zad: 'Vizitka Barbershop 30, zadná strana s logom', kEy: 'Vernostná kartička', kH: 'Body za každú návštevu', kU: 'Zbieraj body za každú návštevu a vymeň ich za zľavu alebo produkt. Kartička je zadarmo a na tvoje meno.', k1: 'Založ si kartičku, stačí meno a telefón.', k2: 'Pri návšteve ukáž na recepcii QR kód.', k3: 'Body vymeníš za odmenu.', chcem: 'Chcem vernostnú kartičku', moja: 'Otvoriť moju kartičku', meno: 'Tvoje meno', body: 'bodov' },
  en: { vEy: 'Our business card', vH: 'Save us in your phone', vcf: 'Save contact', pred: 'Barbershop 30 business card, front with the logo and contact details', zad: 'Barbershop 30 business card, back with the logo', kEy: 'Loyalty card', kH: 'Points for every visit', kU: 'Collect points with every visit and swap them for a discount or a product. The card is free and in your name.', k1: 'Create your card, all it takes is your name and phone.', k2: 'Show the QR code at reception when you visit.', k3: 'Swap your points for a reward.', chcem: 'I want the loyalty card', moja: 'Open my card', meno: 'Your name', body: 'points' },
  uk: { vEy: 'Наша візитка', vH: 'Збережи нас у телефоні', vcf: 'Зберегти контакт', pred: 'Візитка Barbershop 30, лицьовий бік з логотипом і контактами', zad: 'Візитка Barbershop 30, зворотний бік з логотипом', kEy: 'Картка лояльності', kH: 'Бали за кожен візит', kU: 'Збирай бали за кожен візит і обмінюй їх на знижку або продукт. Картка безкоштовна й на твоє ім’я.', k1: 'Створи картку, вистачить імені й телефону.', k2: 'Під час візиту покажи на рецепції QR-код.', k3: 'Бали обміняєш на винагороду.', chcem: 'Хочу картку лояльності', moja: 'Відкрити мою картку', meno: 'Твоє ім’я', body: 'балів' },
  hu: { vEy: 'Névjegykártyánk', vH: 'Mentsd el a telefonodba', vcf: 'Névjegy mentése', pred: 'A Barbershop 30 névjegykártyája, előlap a logóval és elérhetőségekkel', zad: 'A Barbershop 30 névjegykártyája, hátlap a logóval', kEy: 'Hűségkártya', kH: 'Pontok minden látogatásért', kU: 'Gyűjts pontokat minden látogatással, és váltsd be őket kedvezményre vagy termékre. A kártya ingyenes és a te nevedre szól.', k1: 'Hozd létre a kártyád, elég a neved és a telefonszámod.', k2: 'Látogatáskor mutasd meg a QR-kódot a recepción.', k3: 'A pontokat jutalomra váltod.', chcem: 'Kérem a hűségkártyát', moja: 'A kártyám megnyitása', meno: 'A neved', body: 'pont' },
  sr: { vEy: 'Naša vizitkarta', vH: 'Sačuvaj nas u telefonu', vcf: 'Sačuvaj kontakt', pred: 'Vizitkarta Barbershop 30, prednja strana sa logom i kontaktom', zad: 'Vizitkarta Barbershop 30, zadnja strana sa logom', kEy: 'Kartica lojalnosti', kH: 'Bodovi za svaku posetu', kU: 'Skupljaj bodove za svaku posetu i zameni ih za popust ili proizvod. Kartica je besplatna i na tvoje ime.', k1: 'Napravi karticu, dovoljni su ime i telefon.', k2: 'Pri poseti pokaži QR kod na recepciji.', k3: 'Bodove zameniš za nagradu.', chcem: 'Želim karticu lojalnosti', moja: 'Otvori moju karticu', meno: 'Tvoje ime', body: 'bodova' },
  pl: { vEy: 'Nasza wizytówka', vH: 'Zapisz nas w telefonie', vcf: 'Zapisz kontakt', pred: 'Wizytówka Barbershop 30, przód z logo i kontaktem', zad: 'Wizytówka Barbershop 30, tył z logo', kEy: 'Karta lojalnościowa', kH: 'Punkty za każdą wizytę', kU: 'Zbieraj punkty za każdą wizytę i wymieniaj je na rabat lub produkt. Karta jest bezpłatna i na twoje imię.', k1: 'Załóż kartę, wystarczy imię i telefon.', k2: 'Podczas wizyty pokaż w recepcji kod QR.', k3: 'Punkty wymienisz na nagrodę.', chcem: 'Chcę kartę lojalnościową', moja: 'Otwórz moją kartę', meno: 'Twoje imię', body: 'punktów' },
  de: { vEy: 'Unsere Visitenkarte', vH: 'Speichere uns im Handy', vcf: 'Kontakt speichern', pred: 'Visitenkarte von Barbershop 30, Vorderseite mit Logo und Kontakt', zad: 'Visitenkarte von Barbershop 30, Rückseite mit Logo', kEy: 'Treuekarte', kH: 'Punkte für jeden Besuch', kU: 'Sammle Punkte bei jedem Besuch und tausche sie gegen einen Rabatt oder ein Produkt. Die Karte ist kostenlos und auf deinen Namen.', k1: 'Leg deine Karte an, Name und Telefon reichen.', k2: 'Zeig beim Besuch den QR-Code an der Rezeption.', k3: 'Die Punkte tauschst du gegen eine Prämie.', chcem: 'Ich möchte die Treuekarte', moja: 'Meine Karte öffnen', meno: 'Dein Name', body: 'Punkte' },
  cs: { vEy: 'Naše vizitka', vH: 'Ulož si nás do telefonu', vcf: 'Uložit kontakt', pred: 'Vizitka Barbershop 30, přední strana s logem a kontaktem', zad: 'Vizitka Barbershop 30, zadní strana s logem', kEy: 'Věrnostní kartička', kH: 'Body za každou návštěvu', kU: 'Sbírej body za každou návštěvu a vyměň je za slevu nebo produkt. Kartička je zdarma a na tvé jméno.', k1: 'Založ si kartičku, stačí jméno a telefon.', k2: 'Při návštěvě ukaž na recepci QR kód.', k3: 'Body vyměníš za odměnu.', chcem: 'Chci věrnostní kartičku', moja: 'Otevřít moji kartičku', meno: 'Tvé jméno', body: 'bodů' },
};
const tx = () => { const l = (html.lang || 'sk').slice(0, 2).toLowerCase(); return T[l] || T.sk; };

function el(tag, attrs = {}, deti = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== false && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  for (const d of deti) if (d != null) e.append(d);
  return e;
}

/* Vizitka (obe strany) podľa tej, ktorú prevádzka rozdáva. */
export function vizitka() {
  const kruh = () => el('div', { class: 'viz-kruh' }, [el('img', { src: new URL('img/logo-30-barbershop.webp', import.meta.url).href, alt: '', width: '480', height: '429', loading: 'lazy', decoding: 'async' })]);
  const pred = el('div', { class: 'viz-strana viz-pred' }, [
    el('div', { class: 'viz-pruhy', 'aria-hidden': 'true' }), kruh(),
    el('div', { class: 'viz-kontakt' }, [
      el('p', { class: 'viz-tel' }, ['0951 267 203']),
      el('p', {}, ['info@barbershop30.sk']),
      el('p', {}, ['Mostná 30, 949 01 Nitra']),
      el('p', {}, ['www.barbershop30.sk']),
    ]),
  ]);
  const zad = el('div', { class: 'viz-strana viz-zad' }, [el('div', { class: 'viz-pruhy', 'aria-hidden': 'true' }), kruh()]);
  return [pred, zad];
}

function kartaUlozena() {
  try { const u = localStorage.getItem(K_KARTA); return u && /^https?:\/\/[^\s]+\/karta\/\?k=[A-Za-z0-9_-]{22}$/.test(u) ? u : ''; } catch (e) { return ''; }
}

export function spusti(kontakt) {
  const ukazka = new URLSearchParams(location.search).get('vernost') === 'ukazka';
  const zapnuta = !!document.querySelector('script[data-prevadzka="barbershop"][data-zapnute]');
  const vernost = zapnuta || ukazka || !!kartaUlozena();
  const css = el('link', { rel: 'stylesheet', href: new URL('karty.css', import.meta.url).href });

  const [pred, zad] = vizitka();
  const figPred = el('figure', { class: 'viz', lang: 'sk' }, [pred]);
  const figZad = el('figure', { class: 'viz', lang: 'sk' }, [zad]);
  const vcf = el('a', { class: 'btn btn-secondary', href: new URL('barbershop30.vcf', import.meta.url).href });
  const vEy = el('p', { class: 'eyebrow' }), vH = el('h3', { class: 'h3', id: 'h-vizitka' });
  const castV = el('section', { class: 'karty-vizitka', 'aria-labelledby': 'h-vizitka' }, [
    vEy, vH, el('div', { class: 'viz-par' }, [figPred, figZad]), el('div', { class: 'cluster karty-akcie' }, [vcf])]);

  const kEy = el('p', { class: 'eyebrow' }), kH = el('h3', { class: 'h3', id: 'h-vernost' }), kU = el('p', { class: 'karty-text' });
  const kMeno = el('span', { class: 'vk-meno' }), kBody = el('span');
  const kroky = el('ol', { class: 'vk-kroky' }, [el('li'), el('li'), el('li')]);
  const tl = el('a', { class: 'btn btn-primary', href: new URL('../karta/', import.meta.url).href, 'data-vernost-karta': ukazka && !zapnuta && !kartaUlozena() ? null : true });
  if (ukazka && !zapnuta && !kartaUlozena()) { tl.setAttribute('aria-disabled', 'true'); tl.removeAttribute('href'); tl.classList.add('je-ukazka'); }
  const castK = vernost ? el('section', { class: 'karty-vernost', 'aria-labelledby': 'h-vernost' }, [
    kEy, kH,
    el('div', { class: 'vk-obal', 'aria-hidden': 'true' }, [el('div', { class: 'vk' }, [
      el('p', { class: 'vk-hore' }, [el('strong', {}, ['Barbershop 30']), el('span', { class: 'vk-typ' })]),
      el('p', { class: 'vk-body' }, [el('b', {}, ['0']), kBody]),
      el('p', { class: 'vk-dole' }, [kMeno]),
    ])]),
    kU, kroky, el('div', { class: 'karty-akcie' }, [tl]),
    ukazka && !zapnuta ? el('p', { class: 'karty-ukazka' }, ['Ukážka na kontrolu: prihláška sa zapne po nasadení s heslom recepcie.']) : null,
  ]) : null;

  const pas = el('div', { class: 'band band-karty' + (castK ? '' : ' bez-vernosti'), 'data-no-i18n': true }, [
    el('div', { class: 'container karty-grid' }, [castV, castK])]);

  const texty = () => {
    const L = tx();
    vEy.textContent = L.vEy; vH.textContent = L.vH;
    vcf.textContent = L.vcf;
    figPred.setAttribute('aria-label', L.pred); figZad.setAttribute('aria-label', L.zad);
    figPred.setAttribute('role', 'img'); figZad.setAttribute('role', 'img');
    if (!castK) return;
    kEy.textContent = L.kEy; kH.textContent = L.kH; kU.textContent = L.kU;
    castK.querySelector('.vk-typ').textContent = L.kEy;
    kMeno.textContent = L.meno; kBody.textContent = L.body;
    [L.k1, L.k2, L.k3].forEach((t, i) => { kroky.children[i].textContent = t; });
    tl.textContent = kartaUlozena() ? L.moja : L.chcem;
  };
  texty();
  new MutationObserver(texty).observe(html, { attributes: true, attributeFilter: ['lang'] });
  // pás sa vloží až so štýlom, aby sa neukázal nenaštýlovaný
  css.addEventListener('load', () => kontakt.after(pas), { once: true });
  document.head.append(css);
}
