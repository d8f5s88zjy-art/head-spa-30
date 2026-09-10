/* BARBERSHOP 30 — jediný obsahový súbor stránky.
 *
 * Všetko, čo sa dá zmeniť bez zásahu do kódu, je tu. Položky označené
 * REQUIRED_REAL_DATA zatiaľ nemáme potvrdené od prevádzky. Stránka ich vedome
 * nevymýšľa: kým nie sú vyplnené, na stránke sa buď nezobrazia, alebo sa
 * zobrazia s viditeľnou poznámkou. Nikdy sem nedopĺňaj údaj, ktorý si
 * neoveril priamo v Barbershope 30.
 */
window.BS30 = {

  /* ---------- prevádzka ---------- */
  business: {
    name: 'BARBERSHOP 30',
    // Overené: adresa, telefón, e-mail a Instagram sú prevzaté zo živých
    // kontaktov značky 30 na Mostnej.
    street: 'Mostná 226/30',
    city: 'Nitra',
    zip: '949 01',
    phone: '+421951267203',
    phoneText: '0951 267 203',
    email: 'info@barbershop30.sk',
    instagram: 'https://www.instagram.com/barbershop30_nitra/',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Mostn%C3%A1+226%2F30+Nitra',
    // Overené načítaním: toto je rezervačný kalendár, v ktorom sú služby
    // prevádzky. Druhý profil (salon-30) služby neobsahuje.
    bookingUrl: 'https://booqme.app/sk/rezervacia/barbershop-30',
    bookingName: 'Booqme',
  },

  /* ---------- otváracie hodiny ----------
   * REQUIRED_REAL_DATA: hodiny nižšie sú hodiny salónu na Mostnej 30.
   * Ak má barbershop iné, prepíš ich tu. Kým `confirmed` nie je true,
   * stránka pri hodinách zobrazuje poznámku a nepočíta stav otvorené/zatvorené.
   */
  hours: {
    confirmed: false,
    // deň v týždni: [otvorené, zatvorené] v hodinách, null = zatvorené
    week: { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 14], 0: null },
    note: 'Otváracie hodiny čakajú na potvrdenie prevádzkou.',
  },

  /* ---------- strihy ----------
   * REQUIRED_REAL_DATA: toto je ponuka strihov pripravená ako štruktúra.
   * Doplň `price` a `duration` podľa skutočného cenníka a prehoď
   * `offered` na false pri všetkom, čo barbershop nerobí. Fotky sú zatiaľ
   * ilustračné ukážky, stránka ich tak aj označuje. Po nafotení nahraď
   * súbory v assets/img a `illustrative` prepni na false.
   */
  pricesConfirmed: false,
  cuts: [
    {
      id: 'skin-fade', title: 'Skin fade', offered: true, illustrative: true,
      img: 'assets/img/strih-skin-fade.jpg',
      short: 'Prechod až na holú pokožku, najostrejší kontrast.',
      length: 'kratke', fade: 'high', texture: 'rovne', upkeep: 'vysoka', finish: 'texturovany', beard: false,
      about: 'Strojček ide na stranách až na nulu a odtiaľ sa prechod plynulo zosvetľuje nahor. Navrchu ostáva krátka textúra. Najčistejší a najostrejší tvar, aký sa dá spraviť.',
      tell: 'Povedz barberovi, ako vysoko má prechod siahať a či chceš ostrú alebo mäkkú hranu na čele.',
      upkeepText: 'Ostré to vyzerá dva až tri týždne, potom prechod zarastie.',
      price: null, duration: null,
    },
    {
      id: 'low-fade', title: 'Low fade', offered: true, illustrative: true,
      img: 'assets/img/strih-low-fade.jpg',
      short: 'Prechod začína nízko nad uchom, decentný tvar.',
      length: 'stredne', fade: 'low', texture: 'rovne', upkeep: 'stredna', finish: 'prirodzeny', beard: false,
      about: 'Prechod sa drží nízko nad uchom a v zátylku. Zvrchu ostáva dĺžka na učesanie. Sedí do práce aj na bežné nosenie, nie je nápadný.',
      tell: 'Povedz, koľko dĺžky chceš nechať navrchu a či vlasy nosíš prehodené na stranu.',
      upkeepText: 'Drží tvar tri až štyri týždne.',
      price: null, duration: null,
    },
    {
      id: 'mid-fade', title: 'Mid fade', offered: true, illustrative: true,
      img: 'assets/img/strih-mid-fade.jpg',
      short: 'Prechod v úrovni spánkov, najuniverzálnejšia voľba.',
      length: 'stredne', fade: 'mid', texture: 'rovne', upkeep: 'stredna', finish: 'texturovany', beard: false,
      about: 'Zlatá stredná cesta medzi low a high fade. Prechod začína v úrovni spánkov a rovnomerne sa rozsvecuje. Funguje takmer na každý tvar hlavy.',
      tell: 'Ak si nie si istý výškou prechodu, toto je bezpečná voľba.',
      upkeepText: 'Drží tvar dva až štyri týždne.',
      price: null, duration: null,
    },
    {
      id: 'high-fade', title: 'High fade', offered: true, illustrative: true,
      img: 'assets/img/strih-high-fade.jpg',
      short: 'Vysoký prechod, výrazný kontrast s vrchom.',
      length: 'kratke', fade: 'high', texture: 'rovne', upkeep: 'vysoka', finish: 'texturovany', beard: false,
      about: 'Prechod ide vysoko k temenu, takže vrch pôsobí plnšie a tvar je výraznejší. Strih, ktorý je vidieť.',
      tell: 'Povedz, či chceš vrch ponechať dlhší, kontrast bude tým väčší.',
      upkeepText: 'Ostré to vyzerá dva až tri týždne.',
      price: null, duration: null,
    },
    {
      id: 'taper', title: 'Taper', offered: true, illustrative: true,
      img: 'assets/img/strih-taper.jpg',
      short: 'Upravené len okolo uší a v zátylku, dĺžka ostáva.',
      length: 'dlhsie', fade: 'taper', texture: 'rovne', upkeep: 'nizka', finish: 'prirodzeny', beard: false,
      about: 'Najjemnejší zásah. Skracujú sa len kotlety a zátylok, boky si nechávajú dĺžku. Vlasy vyzerajú upravene, ale zmena nie je drastická.',
      tell: 'Dobré, keď si necháváš rásť vlasy a chceš ich len udržať v tvare.',
      upkeepText: 'Vydrží štyri až šesť týždňov.',
      price: null, duration: null,
    },
    {
      id: 'textured-crop', title: 'Textúrovaný crop', offered: true, illustrative: true,
      img: 'assets/img/strih-crop.jpg',
      short: 'Krátka ofina dopredu, textúra navrchu.',
      length: 'kratke', fade: 'mid', texture: 'vlnite', upkeep: 'nizka', finish: 'texturovany', beard: false,
      about: 'Vrch sa strihá do textúry a padá dopredu ako krátka ofina. Boky sú krátke. Sedí na hustejšie aj vlnité vlasy a ráno sa s tým nemusíš trápiť.',
      tell: 'Povedz, či ofinu chceš rovnú alebo rozbitú do špičiek.',
      upkeepText: 'Drží tvar tri až päť týždňov.',
      price: null, duration: null,
    },
    {
      id: 'klasicky', title: 'Klasický strih nožnicami', offered: true, illustrative: true,
      img: 'assets/img/strih-klasicky.jpg',
      short: 'Bez strojčeka, mäkký prirodzený tvar.',
      length: 'dlhsie', fade: 'ziadny', texture: 'rovne', upkeep: 'nizka', finish: 'uhladeny', beard: false,
      about: 'Celý strih iba nožnicami, bez prechodu. Tvar je mäkký a nadčasový, dá sa učesať na stranu aj dozadu. Voľba, ktorá nezostarne.',
      tell: 'Povedz, či vlasy nosíš prehodené na stranu a na ktorú.',
      upkeepText: 'Vydrží štyri až šesť týždňov.',
      price: null, duration: null,
    },
    {
      id: 'brada', title: 'Úprava brady', offered: true, illustrative: true,
      img: 'assets/img/strih-brada.jpg',
      short: 'Tvarovanie, ostrá linka líc a krku.',
      length: 'brada', fade: 'ziadny', texture: 'rovne', upkeep: 'stredna', finish: 'uhladeny', beard: true,
      about: 'Skrátenie do tvaru, ostrá linka na lícach a čistý krk. Dá sa objednať samostatne alebo k strihu.',
      tell: 'Povedz, či chceš bradu skrátiť alebo len vyčistiť linky.',
      upkeepText: 'Linky držia dva až tri týždne.',
      price: null, duration: null,
    },
  ],

  /* ---------- filtre nad ponukou strihov ---------- */
  filters: [
    { key: 'length', label: 'Dĺžka', options: [
      { v: 'kratke', l: 'Krátke' }, { v: 'stredne', l: 'Stredné' }, { v: 'dlhsie', l: 'Dlhšie' }, { v: 'brada', l: 'Brada' } ] },
    { key: 'fade', label: 'Prechod', options: [
      { v: 'ziadny', l: 'Bez prechodu' }, { v: 'taper', l: 'Taper' }, { v: 'low', l: 'Nízky' }, { v: 'mid', l: 'Stredný' }, { v: 'high', l: 'Vysoký' } ] },
    { key: 'upkeep', label: 'Údržba', options: [
      { v: 'nizka', l: 'Nízka' }, { v: 'stredna', l: 'Stredná' }, { v: 'vysoka', l: 'Vysoká' } ] },
    { key: 'finish', label: 'Finiš', options: [
      { v: 'prirodzeny', l: 'Prirodzený' }, { v: 'texturovany', l: 'Textúrovaný' }, { v: 'uhladeny', l: 'Uhladený' } ] },
  ],

  /* ---------- barberi ----------
   * REQUIRED_REAL_DATA: prázdne pole = sekcia sa vôbec nevykreslí.
   * Doplň len skutočných ľudí: { name, role, note, img }.
   */
  barbers: [],

  /* ---------- referencie zákazníkov ----------
   * REQUIRED_REAL_DATA: prázdne pole = sekcia sa nevykreslí.
   * Nikdy sem nedávaj vymyslené hodnotenie.
   */
  reviews: [],

  /* ---------- galéria ----------
   * illustrative: true znamená, že záber je ilustračný a stránka ho tak označí.
   */
  gallery: [
    { img: 'assets/img/interier.jpg', alt: 'Kreslo, zrkadlo a machová stena v priestore barbershopu', cap: 'Kreslo a zrkadlo', illustrative: true },
    { img: 'assets/img/remeslo.jpg', alt: 'Detail strihania nožnicami cez hrebeň', cap: 'Nožnice cez hrebeň', illustrative: true },
    { img: 'assets/img/moss-16x9.jpg', alt: 'Detail machovej steny s mosadzným svetlom za ňou', cap: 'Machová stena', illustrative: true },
    { img: '../assets/img/dvere.jpg', alt: 'Zelené vstupné dvere s mosadznými kruhmi na Mostnej 30', cap: 'Vstup na Mostnej 30', illustrative: false },
  ],
};
