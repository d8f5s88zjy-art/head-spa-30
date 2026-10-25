
/* ---- 6.–11. triedy podľa pravidiel zhody (ZASADY-ZHODY.md) ----
   Otázky sa skladajú z dát (názvy služieb z cenníka, kmene) a zo šablón; nie sú to otázky z nálezov kontroly. */
const KB = Object.fromEntries(['sk', ...JAZYKY].map((l) => [l, l === 'sk' ? sk : citaj(`assets/recepcia/${l}.json`)]));
const cena = (r) => r.typ === 'odpoved' && /€|\d (min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved));
const popis = (r) => `${r.typ} ${r.id ?? ''}${r.sluzba ? ':' + r.sluzba : ''}${Array.isArray(r.p) ? ' [' + r.p.map((x) => x.id) + ']' : ''}`;
/* pseudonáhodné nezmyselné slovo (bez samohlások na začiatku kmeňov), rovnaké pri každom behu */
let semienko = 30;
const nahodne = () => { let w = 'zq'; for (let i = 0; i < 5; i++) { semienko = (semienko * 1103515245 + 12345) % 2147483648; w += 'bcdfghjklmnprstvxz'[semienko % 18]; } return w; };
const cenove = (p) => p.odpoved.filter(Array.isArray).length && JSON.stringify(p.odpoved).includes('€');
const nazov = (p) => p.odpoved.filter(Array.isArray)[0][0];
const FRAZA = {
  cena: { sk: 'Koľko stojí', en: 'How much is', de: 'Was kostet', cs: 'Kolik stojí', pl: 'Ile kosztuje', hu: 'Mennyibe kerül', sr: 'Koliko košta', uk: 'Скільки коштує' },
  cas: { sk: 'Ako dlho trvá', en: 'How long does it take:', de: 'Wie lange dauert', cs: 'Jak dlouho trvá', pl: 'Jak długo trwa', hu: 'Meddig tart', sr: 'Koliko traje', uk: 'Скільки триває' },
};

test('6. pravidlo 1: kmeň do 4 znakov len presne alebo s koncovkou najviac +3; preklep len pri kmeni od 5 znakov', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of [...kb.polozky, ...kb.nevieme]) for (const t of p.kluc.split(/[\s|]+/).filter(Boolean)) {
    if (t[0] === '=') continue;
    const k = t.replace('!', '').toLowerCase();
    n++;
    assert.equal(zhoda(k, k), 1, `${l} ${k}: presná zhoda`);
    if (k.length < 5) {
      assert.equal(zhoda(k + 'qxzv', k), 0, `${l} ${k}: slovo dlhšie o 4 znaky nesmie mať zhodu`);
      assert.ok(zhoda(k + 'qxz', k) > 0, `${l} ${k}: koncovka +3 má zhodu`);
      if (k.length < 4) assert.equal(zhoda(k + 'qx', k), 0.6, `${l} ${k}: krátky kmeň s dlhou koncovkou je neistý`);
      if (k.length > 2) assert.equal(zhoda(k[0] + k[2] + k[1] + k.slice(3) + 'a', k), 0, `${l} ${k}: preklep v krátkom kmeni sa nehádá`);
    } else assert.ok(zhoda(k[0] + k[2] + k[1] + k.slice(3) + 'a', k) >= 0.6, `${l} ${k}: prehodené písmená v kmeni od 5 znakov sú preklep`);
  }
  console.log(`kmeňov skontrolovaných: ${n}`);
});

test('7. pravidlo 2: neznáme slovo pri službe nedostane holú cenu ani trvanie', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) {
    for (const q of [`${FRAZA.cena[l]} ${nazov(p)} ${nahodne()}`, `${nahodne()} ${nazov(p)}`]) {
      const r = odpovedz(q, kb); n++;
      assert.ok(!cena(r), `${l} „${q}“ → ${popis(r)}: holá cena pri neznámom slove`);
      if (r.typ === 'vyber') assert.ok(r.p.length >= 1, 'Myslíš toto? s kandidátom');
    }
  }
  // kmeň do 3 znakov s cudzou koncovkou (det-ox, syn-tetika) nie je istá zhoda
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) for (const t of p.kluc.split(/[\s|]+/)) {
    const k = t.replace(/[=!]/g, '').toLowerCase();
    if (k.length !== 3 || t[0] === '=') continue;
    const q = `${FRAZA.cena[l]} ${k}oxa`, r = odpovedz(q, kb); n++;
    assert.ok(!cena(r), `${l} „${q}“ → ${popis(r)}`);
  }
  console.log(`otázok s neznámym slovom: ${n}`);
});

test('8. pravidlo 3: názov služby z cenníka vedie na tú službu (špecifickejšia vyhrá)', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) for (const q of [nazov(p), `${FRAZA.cena[l]} ${nazov(p)}?`]) {
    const r = odpovedz(q, kb); n++;
    const ok = (r.typ === 'odpoved' && r.id === p.id) || (r.typ === 'vyber' && r.p[0].id === p.id);
    assert.ok(ok, `${l} „${q}“ → ${popis(r)}, čakané ${p.id}`);
  }
  console.log(`názvov služieb: ${n}`);
});

const TRIEDY = {
  osoba: {
    sk: [['Ostriháte aj {}?', 'Koľko stojí strih pre {}?'], ['mamu', 'mamičku', 'babku', 'babičku', 'sestru', 'tetu', 'kamarátku', 'svokru', 'dcéru', 'manželku', 'priateľku', 'susedku', 'neter', 'krstnú mamu', 'švagrinú', 'kolegyňu']],
    en: [["Can you cut my {}'s hair?", 'How much is a haircut for my {}?'], ['mom', 'mum', 'mother', 'grandma', 'sister', 'aunt', 'daughter', 'wife', 'girlfriend', 'niece', 'stepmother', 'godmother']],
    de: [['Schneidet ihr auch meine {}?', 'Was kostet ein Haarschnitt für meine {}?'], ['Mutter', 'Mama', 'Oma', 'Schwester', 'Tante', 'Tochter', 'Frau', 'Freundin', 'Nichte', 'Schwiegermutter', 'Patentante']],
    cs: [['Ostříháte i {}?', 'Kolik stojí střih pro {}?'], ['mámu', 'maminku', 'babičku', 'sestru', 'tetu', 'dceru', 'manželku', 'přítelkyni', 'tchyni', 'kamarádku', 'sousedku', 'neteř']],
    pl: [['Czy ostrzyżecie moją {}?', 'Ile kosztuje strzyżenie, chodzi o {}?'], ['mamę', 'babcię', 'siostrę', 'ciocię', 'córkę', 'żonę', 'dziewczynę', 'koleżankę', 'teściową', 'sąsiadkę']],
    hu: [['{} is megnyírjátok?', 'Mennyibe kerül a hajvágás, {} jönne?'], ['anyukámat', 'anyámat', 'nagymamámat', 'húgomat', 'nővéremet', 'feleségemet', 'barátnőmet', 'lányomat', 'nagynénémet']],
    sr: [['Šišate li moju {}?', 'Koliko košta šišanje za moju {}?'], ['mamu', 'baku', 'sestru', 'tetku', 'ćerku', 'suprugu', 'devojku', 'drugaricu', 'svekrvu', 'komšinicu']],
    uk: [['Чи підстрижете мою {}?', 'Скільки коштує стрижка, це для {}?'], ['маму', 'бабусю', 'сестру', 'тітку', 'доньку', 'дружину', 'дівчину', 'подругу', 'свекруху', 'сусідку']],
  },
  miesto: {
    sk: [['Strihate aj {}?', 'Koľko stojí strih {}?'], ['doma', 'v nemocnici', 'v domove dôchodcov', 'na svadbe', 'v hoteli', 'u mňa doma', 'vo firme', 'na chate']],
    en: [['Do you cut hair {}?', 'How much is a haircut {}?'], ['at home', 'in hospital', 'at a wedding', 'in a hotel', 'in a nursing home', 'at my office']],
    de: [['Schneidet ihr auch {}?', 'Was kostet ein Haarschnitt {}?'], ['zu Hause', 'im Krankenhaus', 'im Altenheim', 'auf einer Hochzeit', 'im Hotel', 'im Büro']],
    cs: [['Stříháte i {}?', 'Kolik stojí střih {}?'], ['doma', 'v nemocnici', 'v domově důchodců', 'na svatbě', 'v hotelu']],
    pl: [['Czy strzyżecie {}?', 'Ile kosztuje strzyżenie {}?'], ['w domu', 'w szpitalu', 'na weselu', 'w hotelu', 'z dojazdem']],
    hu: [['Vágtok hajat {}?', 'Mennyibe kerül a hajvágás {}?'], ['otthon', 'kórházban', 'esküvőn', 'szállodában', 'házhoz']],
    sr: [['Šišate li {}?', 'Koliko košta šišanje {}?'], ['kod kuće', 'u bolnici', 'na venčanju', 'u hotelu']],
    uk: [['Чи стрижете {}?', 'Скільки коштує стрижка {}?'], ['вдома', 'у лікарні', 'на весіллі', 'в готелі', 'з виїздом']],
  },
  vek: {
    sk: [['Syn má {} rokov, koľko stojí strih?', 'Strihate aj {}-ročných?'], ['11', '12', '13', '14', '15', '16', '17']],
    en: [['My son is {} years old, how much is a haircut?'], ['11', '12', '13', '14', '15', '16', '17']],
    de: [['Mein Sohn ist {} Jahre alt, was kostet ein Haarschnitt?'], ['11', '12', '13', '14', '15', '16', '17']],
    cs: [['Syn má {} let, kolik stojí střih?'], ['11', '12', '13', '14', '15', '16', '17']],
    pl: [['Syn ma {} lat, ile kosztuje strzyżenie?'], ['11', '12', '13', '14', '15', '16', '17']],
    hu: [['A fiam {} éves, mennyibe kerül a hajvágás?'], ['11', '12', '13', '14', '15', '16', '17']],
    sr: [['Sin ima {} godina, koliko košta šišanje?'], ['11', '12', '13', '14', '15', '16', '17']],
    uk: [['Синові {} років, скільки коштує стрижка?'], ['11', '12', '13', '14', '15', '16', '17']],
  },
  produkt: {
    sk: [['Koľko stojí {} na bradu?', 'Koľko stojí {} na vlasy?', 'Predávate {}?'], ['balzam', 'olej', 'vosk', 'pomádu', 'gél', 'šampón', 'hrebeň', 'kefu', 'sérum', 'sprej', 'kondicionér', 'krém']],
    en: [['How much is beard {}?', 'How much is hair {}?', 'Do you sell {}?'], ['balm', 'oil', 'wax', 'pomade', 'gel', 'shampoo', 'comb', 'brush', 'serum', 'spray', 'conditioner', 'cream']],
    de: [['Was kostet {}?', 'Verkauft ihr {}?'], ['Bartbalsam', 'Bartöl', 'Bartwachs', 'Haarwachs', 'Pomade', 'Haargel', 'Shampoo', 'Kamm', 'Bürste', 'Haarspray']],
    cs: [['Kolik stojí {} na vousy?', 'Prodáváte {}?'], ['balzám', 'olej', 'vosk', 'pomádu', 'gel', 'šampon', 'hřeben', 'kartáč', 'sérum']],
    pl: [['Ile kosztuje {} do brody?', 'Sprzedajecie {}?'], ['balsam', 'olejek', 'wosk', 'pomadę', 'żel', 'szampon', 'grzebień', 'szczotkę']],
    hu: [['Mennyibe kerül a {}?', 'Árultok {}?'], ['szakállolaj', 'szakállbalzsam', 'hajwax', 'pomádé', 'sampon', 'fésű', 'kefe', 'szakállviasz']],
    sr: [['Koliko košta {} za bradu?', 'Prodajete li {}?'], ['balzam', 'ulje', 'vosak', 'pomadu', 'gel', 'šampon', 'češalj', 'četku']],
    uk: [['Скільки коштує {} для бороди?', 'Чи продаєте {}?'], ['бальзам', 'олію', 'віск', 'помаду', 'гель', 'шампунь', 'гребінець', 'щітку']],
  },
};

test('9. pravidlo 4: osoba, miesto, vek a produkt mimo ponuky nedostanú cenu ani trvanie', () => {
  const stat = {};
  for (const [trieda, J] of Object.entries(TRIEDY)) for (const [l, [sablony, slova]] of Object.entries(J)) {
    if (!KB[l]) continue;
    for (const s of sablony) for (const w of slova) {
      const q = s.replace('{}', w), r = odpovedz(q, KB[l]);
      stat[trieda] = stat[trieda] || { n: 0, nevieme: 0 }; stat[trieda].n++; if (r.typ === 'nevieme') stat[trieda].nevieme++;
      assert.ok(!cena(r), `${trieda} ${l} „${q}“ → ${popis(r)}`);
    }
  }
  console.log('triedy (otázok / z toho téma nevieme): ' + Object.entries(stat).map(([k, v]) => `${k} ${v.n}/${v.nevieme}`).join(', '));
  // vek, ktorý stránka uvádza (do 10 rokov), ostáva detským strihom
  for (const q of ['Syn má 8 rokov, koľko stojí strih?', 'Strihate aj 5-ročných?']) {
    const r = odpovedz(q, sk);
    assert.ok((r.typ === 'odpoved' && r.id === 'deti') || (r.typ === 'vyber' && r.p[0].id === 'deti'), `„${q}“ → ${popis(r)}`);
  }
});

const ZDVOR = {
  sk: ['ďakujem', 'Ďakujem pekne!', 'dakujeme', 'vďaka', 'prepáčte', 'ahoj', 'čau', 'dobrý deň', 'ok', 'okej', 'super', 'fajn', 'dovidenia', 'sorry', 'dekujem', 'zdravím', 'rozumiem, ďakujem', 'merci'],
  en: ['thanks', 'thank you', 'thx', 'sorry', 'hello', 'hi', 'hey', 'ok', 'okay', 'good morning', 'great, thanks', 'bye', 'cheers', 'cool'],
  de: ['danke', 'danke schön', 'vielen Dank', 'hallo', 'servus', 'tschüss', 'guten Tag', 'guten Morgen', 'ok', 'super', 'Entschuldigung', 'alles klar'],
  cs: ['děkuji', 'díky', 'děkujeme', 'promiňte', 'ahoj', 'čau', 'dobrý den', 'ok', 'super', 'nashledanou', 'sorry'],
  pl: ['dziękuję', 'dzięki', 'przepraszam', 'cześć', 'dzień dobry', 'ok', 'super', 'do widzenia', 'sorry'],
  hu: ['köszönöm', 'köszi', 'bocsánat', 'szia', 'jó napot', 'helló', 'ok', 'szuper', 'viszlát'],
  sr: ['hvala', 'izvinite', 'zdravo', 'ćao', 'dobar dan', 'ok', 'super', 'prijatno', 'sorry'],
  uk: ['дякую', 'спасибі', 'вибачте', 'привіт', 'добрий день', 'ок', 'супер', 'до побачення', 'sorry'],
};

test('10. pravidlo 5: zdvorilosť a krátka správa nikdy nedostane cenu ani ponuku služby', () => {
  let n = 0, z = 0;
  for (const [l, a] of Object.entries(ZDVOR)) for (const q of a) {
    if (!KB[l]) continue;
    const r = odpovedz(q, KB[l]); n++; if (r.typ === 'zdvorilost') z++;
    assert.ok(r.typ === 'zdvorilost' || r.typ === 'fallback', `${l} „${q}“ → ${popis(r)}`);
  }
  console.log(`zdvorilostí ${n}, z toho rozpoznaných ${z}`);
  assert.ok(z / n >= 0.85, 'aspoň 85 % zdvorilostí dostane zdvorilú odpoveď');
  // zdvorilosť s otázkou ostáva otázkou
  const r = odpovedz('Dobrý deň, koľko stojí pánsky strih?', sk);
  assert.equal(r.id, 'cena-strih');
});

test('11. pravidlo 6: trvanie je trvanie menovanej služby; bez služby strih a brada; neznáma služba = odovzdanie', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    for (const p of kb.polozky.filter((x) => x.cas)) {
      const q = `${FRAZA.cas[l]} ${nazov(p)}?`, r = odpovedz(q, kb); n++;
      assert.ok(r.typ === 'odpoved' && r.id === 'trvanie' && r.sluzba === p.id, `${l} „${q}“ → ${popis(r)}, čakané trvanie:${p.id}`);
      assert.ok(JSON.stringify(r.p.odpoved).includes(p.cas[0]) && !JSON.stringify(r.p.odpoved).includes('€'), `${l} „${q}“: trvanie ${p.cas[0]} bez ceny`);
    }
    const t = odpovedz(`${FRAZA.cas[l]} ${nahodne()}?`, kb);
    assert.ok(t.typ === 'fallback' || t.typ === 'nevieme', `${l}: trvanie neznámej služby → ${popis(t)}`);
  }
  const b = odpovedz('Ako dlho to trvá?', sk);
  assert.ok(b.typ === 'odpoved' && b.id === 'trvanie' && !b.sluzba, `bez služby → ${popis(b)}`);
  console.log(`otázok na trvanie služby: ${n}`);
});
