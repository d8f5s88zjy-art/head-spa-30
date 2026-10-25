// Kontrola kódu 5 – vlastný generátor tried z dát (nezávislý od testov staviteľa).
//   node trieda-k5.mjs <koreň barbershop-30> [výstup.txt]
// Otázky sa skladajú z vložených častí so známym pôvodom (položka JSON, alebo moje zoznamy slov v 8 jazykoch).
// Orákulum: holá odpoveď (cena € alebo trvanie min/perc/хв, aj s nedeliteľnou medzerou) je chyba, ak niektoré
// obsahové slovo vloženej časti nevysvetlí víťazná položka (pri trvaní služba). „Vysvetlí“ = moje prísne pravidlo:
// kmeň od začiatku slova (kmeň do 3 znakov len s koncovkou ≤ 3), „=slovo“ presne, slovo názvu z cenníka alebo
// otázok položky. Zoznamy stop/vypln/zdvor z JSON orákulum NEPOUŽÍVA (len na zaradenie nálezu).
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = path.resolve(process.argv[2]);
const OUT = process.argv[3] || null;
const M = await import(path.join(ROOT, 'assets/recepcia.js'));
const { odpovedz, vyrez, zhoda } = M;
const J = ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const KB = Object.fromEntries(J.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8'))]));
const RAW = Object.fromEntries(J.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8'))]));
// vlastná normalizácia (rovnaký význam ako stránka: bez diakritiky, malé písmená, nepísmená = medzera)
const N = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const W = (s) => N(s).split(' ').filter(Boolean);

/* ---------- moje zoznamy (nie z JSON) ---------- */
const FUNC = {
  sk: 'a aj alebo ale ani ako aky aka ake ano az by bol bola bude ci co do je jeho ich ja k ku kde kedy kto ktory ktora ktore ma mam mate mi mna mne moj moze mozem na nam nas nieco o od po pre pri s sa si so som ste su sme ta tak ten to tu u uz v vam vas vo vy za ze zo robite robit robi da dat chodite viete mozete prosim dakujem',
  cs: 'a i ale nebo ani jak jaky jaka jake ano az by byl bude co do je jeho jeji jich ja k ke kde kdy kdo ktery ktera ktere ma mam mate mi me mne muj muze muzu na nam nas neco o od po pro pri s se si jsem jste jsou ta tak ten to tu u uz v vam vas ve vy za ze z delate delat prosim dekuji',
  en: 'a an the and or but do does did you your i me my we us our is are am be can could have has had of for to in on at with by from it this that these those there what which who when where how much many please thanks hello hi any some offer get',
  de: 'der die das den dem des ein eine einen einem einer und oder aber ich mich mir du dich dir wir uns es ist sind bin hast habt haben hat kann konnen mit fur von zu zum zur in im am an auf bei aus wie was wer wo wann welche welcher welches bitte danke hallo ja nein auch man gibt',
  pl: 'a i lub albo ale czy jak jaki jaka jakie tak do na o od po dla przy z ze w we u za jest sa jestem mam macie moge mozna sie to ten ta te co kto gdzie kiedy ktory ktora ktore ja mi my nas nam wy was wam prosze dziekuje robicie',
  hu: 'a az es vagy de is meg igen hogy mi mit ki kit hol mikor melyik milyen van vannak vagyok lehet tudok tudtok csinaltok en te ti ok ez egy kerem koszonom szia nalatok',
  sr: 'i a ili ali da li je su sam smo ste imate imam mogu moze se si to taj ta te sto ko gde kada koji koja koje ja mi nas nama vi vas vama za na u o od do po pri sa s kod molim hvala zdravo radite',
  uk: 'і й та а або але чи як який яка яке так до на про від по для при з із у в за є маєте можу можна це той ті що хто де коли котрий я ми нас нам ви вас вам будь ласка дякую робите',
};
const PRICEW = {
  sk: 'kolko stoji stoja cena cenu ceny eur zaplatim', cs: 'kolik stoji cena cenu ceny eur zaplatim', en: 'how much price cost costs charge what pay',
  de: 'was kostet kosten preis viel wie', pl: 'ile kosztuje cena cene ceny zaplace jaka', hu: 'mennyibe kerul mennyi ar ara arat fizetek',
  sr: 'koliko kosta cena cenu placam koja', uk: 'скільки коштує ціна ціну заплачу яка',
};
const TIMEW = {
  sk: 'ako dlho trva minut kolko', cs: 'jak dlouho trva minut kolik', en: 'how long does it take minutes is many', de: 'wie lange dauert minuten viele braucht',
  pl: 'jak dlugo trwa minut ile', hu: 'mennyi ideig tart hany percig meddig', sr: 'koliko traje dugo minuta', uk: 'скільки триває як довго хвилин',
};
const PRICE = {
  sk: ['Koľko stojí', 'Aká je cena za'], cs: ['Kolik stojí', 'Jaká je cena za'], en: ['How much is', 'What is the price of'], de: ['Was kostet', 'Wie viel kostet'],
  pl: ['Ile kosztuje', 'Jaka jest cena za'], hu: ['Mennyibe kerül', 'Mennyi az ára'], sr: ['Koliko košta', 'Koja je cena za'], uk: ['Скільки коштує', 'Яка ціна за'],
};
const DUR = {
  sk: ['Ako dlho trvá', 'Koľko minút trvá'], cs: ['Jak dlouho trvá', 'Kolik minut trvá'], en: ['How long does it take:', 'How many minutes is'], de: ['Wie lange dauert', 'Wie viele Minuten dauert'],
  pl: ['Jak długo trwa', 'Ile minut trwa'], hu: ['Mennyi ideig tart', 'Hány percig tart'], sr: ['Koliko traje', 'Koliko dugo traje'], uk: ['Скільки триває', 'Як довго триває'],
};
const CONJ = { sk: 'a', cs: 'a', en: 'and', de: 'und', pl: 'i', hu: 'és', sr: 'i', uk: 'і' };
const ADV = { sk: ['Koľko dlho', 'Ako dlho'], cs: ['Jak dlouho', 'Kolik dlouho'], en: ['How long'], de: ['Wie lange'], pl: ['Jak długo', 'Ile długo'],
  hu: ['Mennyi ideig', 'Meddig', 'Milyen sokáig'], sr: ['Koliko dugo'], uk: ['Як довго', 'Скільки довго'] };
const WAIT = { sk: 'sa čaká na', cs: 'se čeká na', en: 'do I wait for', de: 'wartet man auf', pl: 'się czeka na', hu: 'kell várni a', sr: 'se čeka na', uk: 'чекати на' };
const WAIT0 = { sk: 'sa čaká', cs: 'se čeká', en: 'is the wait', de: 'wartet man', pl: 'się czeka', hu: 'kell várni', sr: 'se čeka', uk: 'чекати' };
const SUR = { sk: ['príplatok', 'doplatok', 'prirážka'], cs: ['příplatek', 'přirážka'], en: ['surcharge', 'extra charge', 'extra fee'], de: ['Aufpreis', 'Zuschlag', 'Aufschlag'],
  pl: ['dopłata', 'dopłatę'], hu: ['felár', 'pótdíj'], sr: ['doplata', 'doplatu'], uk: ['доплата', 'надбавка'] };
const SURP = { sk: 'za', cs: 'za', en: 'for', de: 'für', pl: 'za', hu: '', sr: 'za', uk: 'за' };
const KEDY = {
  sk: ['v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu', 'v nedeľu', 'cez víkend', 'zajtra', 'pozajtra', 'dnes', 'večer', 'ráno', 'cez obed', 'poobede', 'na Vianoce', 'vo sviatok'],
  cs: ['v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu', 'v neděli', 'o víkendu', 'zítra', 'dnes', 'večer', 'ráno', 'odpoledne', 'o svátcích'],
  en: ['on Monday', 'on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday', 'on Saturday', 'on Sunday', 'at the weekend', 'tomorrow', 'today', 'in the evening', 'in the morning', 'at lunchtime', 'on holidays'],
  de: ['am Montag', 'am Dienstag', 'am Mittwoch', 'am Donnerstag', 'am Freitag', 'am Samstag', 'am Sonntag', 'am Wochenende', 'morgen', 'heute', 'abends', 'morgens', 'mittags', 'an Feiertagen'],
  pl: ['w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę', 'w niedzielę', 'w weekend', 'jutro', 'dzisiaj', 'wieczorem', 'rano', 'po południu', 'w święta'],
  hu: ['hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton', 'vasárnap', 'hétvégén', 'holnap', 'ma', 'este', 'reggel', 'délután', 'ünnepnapon'],
  sr: ['u ponedeljak', 'u utorak', 'u sredu', 'u četvrtak', 'u petak', 'u subotu', 'u nedelju', 'vikendom', 'sutra', 'danas', 'uveče', 'ujutru', 'popodne', 'praznikom'],
  uk: ['у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у п’ятницю', 'у суботу', 'у неділю', 'на вихідних', 'завтра', 'сьогодні', 'увечері', 'вранці', 'вдень', 'у свята'],
};
const CAS = { sk: ['o 9:30', 'o 17 h', 'o 18:00', 'o 9'], cs: ['v 9:30', 'v 17 hodin', 'v 18:00', 'v 9'], en: ['at 9:30', 'at 5 pm', 'at 18:00', 'at 9'],
  de: ['um 9:30', 'um 17 Uhr', 'um 18:00', 'um 9'], pl: ['o 9:30', 'o 17', 'o 18:00', 'o 9'], hu: ['9:30-kor', '17 órakor', '18:00-kor', '9-kor'],
  sr: ['u 9:30', 'u 17h', 'u 18:00', 'u 9'], uk: ['о 9:30', 'о 17 годині', 'о 18:00', 'о 9'] };
// osoby: [s predložkou, je dieťa?]; JA = ja s predložkou
const OSOBY = {
  sk: [['pre syna', 1], ['pre dcéru', 0], ['pre manželku', 0], ['pre manžela', 0], ['pre otca', 0], ['pre brata', 0], ['pre kamaráta', 0], ['pre vnuka', 1], ['pre malého', 1], ['pre chlapca', 1], ['pre dvoch', 0], ['pre celú rodinu', 0], ['pre ňu', 0], ['pre neho', 0], ['pre nich', 0], ['pre nás', 0]],
  cs: [['pro syna', 1], ['pro dceru', 0], ['pro manželku', 0], ['pro manžela', 0], ['pro tátu', 0], ['pro bratra', 0], ['pro kamaráda', 0], ['pro vnuka', 1], ['pro malého', 1], ['pro kluka', 1], ['pro dva', 0], ['pro celou rodinu', 0], ['pro ni', 0], ['pro něj', 0], ['pro ně', 0], ['pro nás', 0]],
  en: [['for my son', 1], ['for my daughter', 0], ['for my wife', 0], ['for my husband', 0], ['for my dad', 0], ['for my brother', 0], ['for my friend', 0], ['for my grandson', 1], ['for a little one', 1], ['for a boy', 1], ['for two people', 0], ['for the whole family', 0], ['for her', 0], ['for him', 0], ['for them', 0], ['for all of us', 0]],
  de: [['für meinen Sohn', 1], ['für meine Tochter', 0], ['für meine Frau', 0], ['für meinen Mann', 0], ['für meinen Vater', 0], ['für meinen Bruder', 0], ['für einen Freund', 0], ['für meinen Enkel', 1], ['für den Kleinen', 1], ['für einen Jungen', 1], ['für zwei Personen', 0], ['für die ganze Familie', 0], ['für sie', 0], ['für ihn', 0], ['für uns', 0], ['für uns beide', 0]],
  pl: [['dla syna', 1], ['dla córki', 0], ['dla żony', 0], ['dla męża', 0], ['dla taty', 0], ['dla brata', 0], ['dla kolegi', 0], ['dla wnuka', 1], ['dla małego', 1], ['dla chłopca', 1], ['dla dwóch osób', 0], ['dla całej rodziny', 0], ['dla niej', 0], ['dla niego', 0], ['dla nich', 0], ['dla nas', 0]],
  hu: [['a fiamnak', 1], ['a lányomnak', 0], ['a feleségemnek', 0], ['a férjemnek', 0], ['apámnak', 0], ['a bátyámnak', 0], ['a barátomnak', 0], ['az unokámnak', 1], ['a kicsinek', 1], ['egy fiúnak', 1], ['két főnek', 0], ['az egész családnak', 0], ['neki', 0], ['nekik', 0], ['nekünk', 0], ['két embernek', 0]],
  sr: [['za sina', 1], ['za ćerku', 0], ['za ženu', 0], ['za muža', 0], ['za oca', 0], ['za brata', 0], ['za druga', 0], ['za unuka', 1], ['za malog', 1], ['za dečaka', 1], ['za dve osobe', 0], ['za celu porodicu', 0], ['za nju', 0], ['za njega', 0], ['za njih', 0], ['za nas', 0]],
  uk: [['для сина', 1], ['для доньки', 0], ['для дружини', 0], ['для чоловіка', 0], ['для батька', 0], ['для брата', 0], ['для друга', 0], ['для онука', 1], ['для малого', 1], ['для хлопчика', 1], ['для двох', 0], ['для всієї родини', 0], ['для неї', 0], ['для нього', 0], ['для них', 0], ['для нас', 0]],
};
const JA = { sk: 'pre mňa', cs: 'pro mě', en: 'for me', de: 'für mich', pl: 'dla mnie', hu: 'nekem', sr: 'za mene', uk: 'для мене' };
const ZENA = { sk: ['pre ňu', 'jej strih', 'pre dcéru', 'pre manželku'], cs: ['pro ni', 'pro dceru'], en: ['for her', 'her haircut', 'for my daughter'], de: ['für sie', 'ihr Haarschnitt', 'für meine Tochter'],
  pl: ['dla niej', 'jej strzyżenie', 'dla córki'], hu: ['a lányomnak'], sr: ['za nju', 'za ćerku'], uk: ['для неї', 'для доньки'] };
// dĺžka a množstvo – zmysel opačný alebo iný než riadok cenníka
const DLZKA = { sk: ['do 10 cm', 'pod 10 cm', 'menej ako 10 cm', 'max 10 cm', 'kratšie než 10 cm'], cs: ['do 10 cm', 'pod 10 cm', 'méně než 10 cm', 'max 10 cm'],
  en: ['up to 10 cm', 'under 10 cm', 'less than 10 cm', 'below 10 cm', 'max 10 cm'], de: ['bis 10 cm', 'unter 10 cm', 'weniger als 10 cm', 'max 10 cm'],
  pl: ['do 10 cm', 'pod 10 cm', 'poniżej 10 cm', 'mniej niż 10 cm'], hu: ['10 cm-ig', '10 cm alatt', '10 cm-nél rövidebb', 'max 10 cm'],
  sr: ['do 10 cm', 'pod 10 cm', 'ispod 10 cm', 'manje od 10 cm'], uk: ['до 10 см', 'під 10 см', 'менше 10 см', 'нижче 10 см'] };
const POCET = { sk: ['dva', 'dvoch', 'tri', '2x', 'dvakrát'], cs: ['dva', 'dvou', 'tři', '2x', 'dvakrát'], en: ['two', 'three', '2x', 'twice', 'all of us'], de: ['zwei', 'drei', '2x', 'zweimal', 'beide'],
  pl: ['dwa', 'dwóch', 'trzy', '2x', 'dwa razy'], hu: ['két', 'három', '2x', 'kétszer'], sr: ['dva', 'dvoje', 'tri', '2x', 'dvaput'], uk: ['два', 'двох', 'три', '2x', 'двічі'] };
const NIE = { sk: ['bez umytia', 'bez brady', 'nie strih', 'len nie strih'], cs: ['bez mytí', 'bez vousů', 'ne střih'], en: ['without washing', 'without beard', 'not a haircut', 'no haircut'],
  de: ['ohne Waschen', 'ohne Bart', 'nicht Haarschnitt', 'kein Haarschnitt'], pl: ['bez mycia', 'bez brody', 'nie strzyżenie'], hu: ['mosás nélkül', 'szakáll nélkül', 'nem hajvágás'],
  sr: ['bez pranja', 'bez brade', 'ne šišanje'], uk: ['без миття', 'без бороди', 'не стрижка'] };
// farby a slová iného významu (P5)
const SED = { sk: ['šediny', 'šedín', 'šedivých vlasov', 'odfarbenie', 'zosvetlenie', 'melír', 'trvalá', 'tónovanie', 'prefarbenie', 'blond', 'farbenie vlasov'],
  cs: ['šediny', 'šedin', 'šedivých vlasů', 'odbarvení', 'zesvětlení', 'melír', 'trvalá', 'tónování', 'přebarvení', 'blond', 'barvení vlasů'],
  en: ['grey hair', 'gray hair', 'bleaching', 'lightening', 'highlights', 'perm', 'toning', 'blonde', 'hair colouring', 'hair dye'],
  de: ['graue Haare', 'Blondierung', 'Aufhellung', 'Strähnchen', 'Dauerwelle', 'Tönung', 'blond', 'Haarfärbung', 'Haare färben'],
  pl: ['siwe włosy', 'siwych włosów', 'rozjaśnianie', 'pasemka', 'trwała', 'tonowanie', 'blond', 'farbowanie włosów'],
  hu: ['ősz haj', 'ősz hajszálak', 'szőkítés', 'világosítás', 'melír', 'dauer', 'tónusozás', 'szőke', 'hajfestés'],
  sr: ['sedu kosu', 'sede kose', 'izbeljivanje', 'posvetljivanje', 'pramenovi', 'trajna', 'toniranje', 'plava', 'farbanje kose'],
  uk: ['сивину', 'сивого волосся', 'освітлення', 'знебарвлення', 'мелірування', 'хімічна завивка', 'тонування', 'блонд', 'фарбування волосся'] };
const CAST = { sk: ['brady', 'fúzov', 'obočia', 'hlavy', 'vlasov na hlave'], cs: ['vousů', 'knírku', 'obočí', 'hlavy'], en: ['beard', 'moustache', 'eyebrows', 'head'],
  de: ['Bart', 'Schnurrbart', 'Augenbrauen', 'Kopf'], pl: ['brody', 'wąsów', 'brwi', 'głowy'], hu: ['szakáll', 'bajusz', 'szemöldök', 'fej'],
  sr: ['brade', 'brkova', 'obrva', 'glave'], uk: ['бороди', 'вусів', 'брів', 'голови'] };

/* ---------- pomocné ---------- */
const fn = (l) => new Set(W(FUNC[l]));
const pw = (l) => new Set(W(PRICEW[l]));
const tw = (l) => new Set(W(TIMEW[l]));
const tokens = (p) => (p.kluc || '').split('|').map((g) => g.trim().split(/\s+/).filter(Boolean));
const priced = (p) => (p.odpoved || []).some((f) => Array.isArray(f) && /€$/.test(f[1]));
const names = (p) => (p.odpoved || []).filter(Array.isArray).map((f) => f[0]);
const cenaRe = /€/; const casRe = /\d[\s ]?(min|хв|perc|Min)/;
const holaCena = (r) => r.typ === 'odpoved' && cenaRe.test(JSON.stringify(r.p.odpoved));
const holeTrvanie = (r) => r.typ === 'odpoved' && casRe.test(JSON.stringify(r.p.odpoved)) && !cenaRe.test(JSON.stringify(r.p.odpoved));
const hola = (r) => holaCena(r) || holeTrvanie(r);
// prísne „vysvetlí“
function explains(P, w) {
  for (const g of tokens(P)) for (const t0 of g) {
    const t = t0.replace(/!/g, '');
    if (t[0] === '>') { if (/^\d+$/.test(w) && +w > +t.slice(1)) return true; continue; }
    if (t[0] === '=') { if (w === N(t.slice(1))) return true; continue; }
    if (t.includes('_')) { if (N(t.replace(/_/g, ' ')).split(' ').includes(w)) return true; continue; }
    const k = N(t);
    if (k && w.startsWith(k) && (k.length >= 4 || w.length - k.length <= 3)) return true;
  }
  if (names(P).some((n) => W(n).includes(w))) return true;
  if ((P.otazky || []).some((q) => W(q).includes(w))) return true;
  return false;
}
// obsahové slová vloženej časti
const content = (l, text, typ) => W(text).filter((w) => w.length > 1 && !fn(l).has(w) && !(/^\d+$/.test(w) && typ !== 'cas' && typ !== 'pocet') && !(typ !== 'cas' && pw(l).has(w)));

const stats = {}; const chyby = []; const casy = [];
const P3 = { holeCeny: 0, bezVyrezu: [], vetaSCenou: {} }; const P4 = { trvania: 0, chyby: [] };
function ask(trieda, l, q, casti, extra = {}) {
  const kb = KB[l];
  const t0 = performance.now(); const r = odpovedz(q, kb); const dt = performance.now() - t0;
  casy.push([dt, l, q]);
  const s = (stats[trieda] ||= {}); const sl = (s[l] ||= { n: 0, hole: 0, chyby: 0, vyber: 0, nevieme: 0, fallback: 0 });
  sl.n++; if (r.typ === 'vyber') sl.vyber++; else if (r.typ === 'nevieme') sl.nevieme++; else if (r.typ === 'fallback' || r.typ === 'zdvorilost') sl.fallback++;
  if (!hola(r)) return r;
  sl.hole++;
  const T = kb.polozky.find((p) => p.pravidlo === 'cas');
  let vin = r.p, druh = 'cena';
  if (r.id === T.id) { druh = 'trvanie'; vin = r.sluzba ? kb.polozky.find((p) => p.id === r.sluzba) : null; }
  // P3 a P4 nad každou holou odpoveďou
  if (druh === 'cena') {
    P3.holeCeny++;
    const v = vyrez(r.p, kb);
    const ceny = r.p.odpoved.filter((f) => Array.isArray(f) && /€$/.test(f[1])).map((f) => f[0]);
    if (ceny.length && (!v || !ceny.some((c) => v[1].some((row) => row[0] === c && row[3])))) P3.bezVyrezu.push(`${l} „${q}“ → ${r.id}`);
    for (const f of r.p.odpoved) if (!Array.isArray(f) && /€/.test(f)) P3.vetaSCenou[`${l} ${r.id}`] = (P3.vetaSCenou[`${l} ${r.id}`] || 0) + 1;
  } else {
    P4.trvania++;
    if (vin) {
      if (!vin.cas) P4.chyby.push(`${l} „${q}“ → trvanie služby bez cas ${vin.id}`);
      const exp = vin.odpoved.filter(Array.isArray).map((f, i) => [f[0], vin.cas[i]]);
      if (JSON.stringify(exp) !== JSON.stringify(r.p.odpoved)) P4.chyby.push(`${l} „${q}“ → trvanie ${JSON.stringify(r.p.odpoved)} ≠ price-time ${JSON.stringify(exp)}`);
    }
  }
  // P1 orákulum
  const zle = [];
  const dvaja = extra.dvaja;
  for (const [text, typ] of casti) {
    for (const w of content(l, text, typ)) {
      if (druh === 'trvanie' && (tw(l).has(w) || typ === 'tw')) continue;
      if (druh === 'trvanie' && !vin) { zle.push(w); continue; }
      if (!explains(vin, w)) zle.push(w);
    }
  }
  if (dvaja) zle.push('(dve osoby)');
  if (zle.length) {
    sl.chyby++;
    chyby.push({ trieda, l, q, r: `${druh} ${r.id}${r.sluzba ? ':' + r.sluzba : ''} ${JSON.stringify(r.p.odpoved.filter(Array.isArray)).slice(0, 70)}`, zle });
  }
  return r;
}
const T_ = (l) => KB[l].polozky.find((p) => p.pravidlo === 'cas');
// slová položky: kmene ako slová + slová otázok + slová názvov
function slova(l, P) {
  const s = new Set();
  for (const g of tokens(P)) for (const t0 of g) { const t = t0.replace(/[!=]/g, ''); if (t[0] === '>' || t.includes('_')) continue; const w = N(t); if (w.length > 2 && !/^\d+$/.test(w)) s.add(w); }
  for (const q of P.otazky || []) for (const w of W(q)) if (w.length > 2 && !fn(l).has(w) && !pw(l).has(w) && !tw(l).has(w)) s.add(w);
  for (const n of names(P)) for (const w of W(n)) if (w.length > 2 && !fn(l).has(w) && !/^\d+$/.test(w)) s.add(w);
  return [...s];
}

/* ---------- K1 dvojice: služba s cenou × každá iná položka (všetky jej slová) ---------- */
for (const l of J) {
  const kb = KB[l], T = T_(l), [P0, P1] = PRICE[l], c = CONJ[l];
  const svc = kb.polozky.filter(priced);
  for (const A of svc) {
    const formy = [names(A)[0]];
    const s1 = tokens(A)[0].find((t) => /^[A-ZА-ЯІЇЄҐ]/.test(t.replace('=', '')) || t.endsWith('!'));
    if (s1) { const w = N(s1.replace(/[!=]/g, '')); if (w.length >= 4) formy.push(w); }
    for (const B of [...kb.polozky, ...kb.nevieme]) {
      if (B === A || B === T) continue;
      for (const w of slova(l, B)) {
        if (explains(A, w)) continue;
        for (const a of formy) {
          ask('K1 dvojice', l, `${P0} ${a} ${c} ${w}?`, [[a, 'vec'], [w, 'vec']]);
          ask('K1 dvojice', l, `${P0} ${w} ${a}?`, [[a, 'vec'], [w, 'vec']]);
          ask('K1 dvojice', l, `${a} ${w}, ${P1}?`, [[a, 'vec'], [w, 'vec']]);
        }
      }
      if (priced(B)) { const b = names(B)[0]; ask('K1 dvojice', l, `${P0} ${names(A)[0]} ${c} ${b}?`, [[names(A)[0], 'vec'], [b, 'vec']]); }
    }
  }
}
/* ---------- K2 trvanie × každá položka ---------- */
for (const l of J) {
  const kb = KB[l], T = T_(l), c = CONJ[l];
  const svc = kb.polozky.filter(priced);
  for (const B of [...kb.polozky, ...kb.nevieme]) {
    if (B === T) continue;
    for (const w of slova(l, B)) {
      for (const d of DUR[l]) ask('K2 trvanie', l, `${d} ${w}?`, [[w, 'vec']]);
      for (const A of svc) if (!explains(A, w)) ask('K2 trvanie', l, `${DUR[l][0]} ${names(A)[0]} ${c} ${w}?`, [[names(A)[0], 'vec'], [w, 'vec']]);
    }
  }
}
/* ---------- K3 časová príslovka (koľko dlho) × čakanie × položka ---------- */
for (const l of J) {
  const kb = KB[l], T = T_(l);
  for (const h of ADV[l]) {
    ask('K3 príslovka', l, `${h} ${WAIT0[l]}?`, [[WAIT0[l], 'vec']]);
    for (const P of kb.polozky.filter(priced)) {
      ask('K3 príslovka', l, `${h} ${WAIT[l]} ${names(P)[0]}?`, [[WAIT[l], 'vec'], [names(P)[0], 'vec']]);
      ask('K3 príslovka', l, `${h} ${names(P)[0]}?`, [[h, 'tw'], [names(P)[0], 'vec']]);
    }
    for (const B of [...kb.polozky, ...kb.nevieme]) if (B !== T) for (const w of slova(l, B)) ask('K3 príslovka', l, `${h} ${w}?`, [[h, 'tw'], [w, 'vec']]);
  }
  // cenová otázka s príslovkou: príslovka nesmie dať cenu (V3)
  for (const h of ADV[l]) for (const P of kb.polozky.filter(priced)) ask('K3 príslovka', l, `${PRICE[l][0]} ${h} ${names(P)[0]}?`, [[h, 'cas'], [names(P)[0], 'vec']]);
}
/* ---------- K4 príplatok × deň/čas/služba ---------- */
for (const l of J) {
  const kb = KB[l];
  for (const s of SUR[l]) {
    ask('K4 príplatok', l, `${PRICE[l][0]} ${s}?`, [[s, 'vec']]);
    for (const k of KEDY[l]) { ask('K4 príplatok', l, `${PRICE[l][0]} ${s} ${SURP[l]} ${k}?`.replace(/\s+/g, ' '), [[s, 'vec'], [k, 'cas']]); ask('K4 príplatok', l, `${s} ${k}?`, [[s, 'vec'], [k, 'cas']]); }
    for (const P of kb.polozky.filter(priced)) { ask('K4 príplatok', l, `${PRICE[l][0]} ${s} ${SURP[l]} ${names(P)[0]}?`.replace(/\s+/g, ' '), [[s, 'vec'], [names(P)[0], 'vec']]); }
  }
}
/* ---------- K5 farby a slová iného významu × časť tela × služba ---------- */
for (const l of J) {
  for (const s of SED[l]) {
    ask('K5 farby', l, `${PRICE[l][0]} ${s}?`, [[s, 'vec']]);
    ask('K5 farby', l, `${DUR[l][0]} ${s}?`, [[s, 'vec']]);
    for (const b of CAST[l]) { ask('K5 farby', l, `${PRICE[l][0]} ${s} ${b}?`, [[s, 'vec'], [b, 'vec']]); ask('K5 farby', l, `${PRICE[l][0]} ${b} ${s}?`, [[s, 'vec'], [b, 'vec']]); ask('K5 farby', l, `${DUR[l][0]} ${s} ${b}?`, [[s, 'vec'], [b, 'vec']]); }
  }
}
/* ---------- K6 deň, časť dňa, čas × služba (cena aj trvanie) ---------- */
for (const l of J) {
  const kb = KB[l];
  for (const P of kb.polozky.filter(priced)) {
    const a = names(P)[0];
    for (const k of [...KEDY[l], ...CAS[l]]) {
      const typ = 'cas';
      ask('K6 deň a čas', l, `${PRICE[l][0]} ${a} ${k}?`, [[a, 'vec'], [k, typ]]);
      ask('K6 deň a čas', l, `${k} ${a}?`, [[a, 'vec'], [k, typ]]);
      ask('K6 deň a čas', l, `${DUR[l][0]} ${a} ${k}?`, [[a, 'vec'], [k, typ]]);
    }
  }
}
/* ---------- K7 osoby (D, M, ženy, dvaja) ---------- */
for (const l of J) {
  const kb = KB[l];
  for (const P of kb.polozky.filter((p) => ['cena-strih', 'cena-brada', 'cena-strih-brada', 'holenie', 'hlava'].includes(p.id))) {
    const a = names(P)[0], krat = W(a).slice(-1)[0];
    for (const [o, dieta] of OSOBY[l]) {
      for (const x of [a, krat]) {
        ask('K7 osoby', l, `${PRICE[l][0]} ${x} ${o}?`, [[x, 'vec'], [o, 'osoba']]);
        ask('K7 osoby', l, `${PRICE[l][0]} ${x} ${o} ${CONJ[l]} ${JA[l]}?`, [[x, 'vec'], [o, 'osoba']], { dvaja: 1 });
        ask('K7 osoby', l, `${PRICE[l][0]} ${x} ${JA[l]} ${CONJ[l]} ${o}?`, [[x, 'vec'], [o, 'osoba']], { dvaja: 1 });
      }
    }
    for (const z of ZENA[l]) ask('K7 osoby', l, `${PRICE[l][0]} ${a} ${z}?`, [[a, 'vec'], [z, 'osoba']]);
  }
  for (const z of ZENA[l]) ask('K7 osoby', l, `${PRICE[l][0]} ${z}?`, [[z, 'osoba']]);
}
/* ---------- K8 dĺžka, počet, zápor × služba ---------- */
for (const l of J) {
  const kb = KB[l];
  for (const P of kb.polozky.filter(priced)) {
    const a = names(P)[0], krat = W(a).slice(-1)[0];
    for (const x of [a, krat]) {
      for (const d of DLZKA[l]) ask('K8 dĺžka/počet/zápor', l, `${PRICE[l][0]} ${x} ${d}?`, [[x, 'vec'], [d.replace(/\d+/g, ' '), 'vec']]);
      for (const n of POCET[l]) ask('K8 dĺžka/počet/zápor', l, `${PRICE[l][0]} ${n} ${x}?`, [[x, 'vec'], [n, 'pocet']]);
      for (const n of NIE[l]) ask('K8 dĺžka/počet/zápor', l, `${PRICE[l][0]} ${x} ${n}?`, [[x, 'vec'], [n, 'vec']]);
    }
  }
}
/* ---------- K9 slovník stránky × služba (slovo, ktoré modul zahodí alebo prisúdi) ---------- */
const slovnik = {};
{
  const sk = new Set();
  for (const l of J.filter((x) => x !== 'sk')) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, `assets/i18n/${l}.json`), 'utf8'));
    const s = new Set();
    const walk = (o) => { for (const [k, v] of Object.entries(o)) { if (typeof v === 'string') { W(v).forEach((w) => s.add(w)); W(k).forEach((w) => sk.add(w)); } else if (v && typeof v === 'object') walk(v); } };
    walk(d); slovnik[l] = s;
  }
  slovnik.sk = sk;
}
const K9 = {};
for (const l of J) {
  const kb = KB[l], raw = RAW[l];
  const stop = new Set((raw.stop || '').split(' ')), L = (s) => (s || '').split(' ').filter(Boolean);
  const vyp = L(raw.vypln), zdv = L(raw.zdvor), cen = L(raw.cenove);
  const svc = kb.polozky.filter((p) => ['cena-strih', 'cena-brada', 'holenie', 'plet'].includes(p.id));
  const out = (K9[l] = {});
  for (const x of slovnik[l]) {
    if (x.length < 3 || /\d/.test(x) || fn(l).has(x) || pw(l).has(x)) continue;
    for (const P of svc) {
      const q = `${PRICE[l][0]} ${names(P)[0]} ${x}?`;
      const kb2 = kb; const t0 = performance.now(); const r = odpovedz(q, kb2); casy.push([performance.now() - t0, l, q]);
      const s = (stats['K9 slovník stránky'] ||= {}); const sl = (s[l] ||= { n: 0, hole: 0, chyby: 0, vyber: 0, nevieme: 0, fallback: 0 }); sl.n++;
      if (!holaCena(r)) continue; sl.hole++;
      if (explains(r.p, x)) continue;
      sl.chyby++;
      const pr = r.p;
      const why = stop.has(x) ? 'stop' : vyp.some((k) => k[0] === '=' ? x === k.slice(1) : x.startsWith(k)) ? 'vypln' : zdv.some((k) => x.startsWith(k)) ? 'zdvor' : cen.some((k) => x.startsWith(k)) ? 'cenove'
        : tokens(pr).flat().some((t) => { const k = N(t.replace(/[!=]/g, '')); return k.length > 4 && x.includes(k); }) ? 'kmeň vnútri slova'
          : tokens(pr).flat().some((t) => zhoda(x, N(t.replace(/[!=]/g, ''))) > 0) ? 'preklep/podobnosť' : 'iné';
      (out[why] ||= new Map()).set(x, `${pr.id}`);
    }
  }
}
/* ---------- výstup ---------- */
const lines = [];
const P = (s) => lines.push(s);
P(`# trieda-k5 nad ${ROOT}, ${new Date().toISOString()}`);
P('\n## Súhrn (n otázok, holé odpovede, chyby orákula P1/P4, vyber, nevieme, fallback)');
let spolu = { n: 0, hole: 0, chyby: 0 };
for (const [t, s] of Object.entries(stats)) {
  const sum = Object.values(s).reduce((a, b) => ({ n: a.n + b.n, hole: a.hole + b.hole, chyby: a.chyby + b.chyby }), { n: 0, hole: 0, chyby: 0 });
  if (!t.startsWith('K9')) { spolu.n += sum.n; spolu.hole += sum.hole; spolu.chyby += sum.chyby; }
  P(`${t}: n ${sum.n}, holé ${sum.hole}, chyby ${sum.chyby} | ` + J.map((l) => `${l} ${s[l]?.chyby ?? 0}/${s[l]?.n ?? 0}`).join(', '));
}
P(`SPOLU K1–K8: n ${spolu.n}, holé ${spolu.hole}, chyby ${spolu.chyby}`);
P(`\n## P3: holých cien ${P3.holeCeny}, bez výrezu so zvýrazneným riadkom ${P3.bezVyrezu.length}`);
P3.bezVyrezu.slice(0, 20).forEach((x) => P('  ' + x));
P(`  veta s cenou mimo výrezu (položka: počet): ${JSON.stringify(P3.vetaSCenou)}`);
P(`\n## P4: holých trvaní ${P4.trvania}, rozpor s price-time ${P4.chyby.length}`);
P4.chyby.slice(0, 20).forEach((x) => P('  ' + x));
casy.sort((a, b) => b[0] - a[0]);
P(`\n## Čas zhody (1 beh, ${casy.length} otázok): max ${casy[0][0].toFixed(2)} ms, p99 ${casy[Math.floor(casy.length / 100)][0].toFixed(2)} ms, > 5 ms: ${casy.filter((x) => x[0] > 5).length}`);
casy.slice(0, 5).forEach((x) => P(`  ${x[0].toFixed(2)} ms ${x[1]} „${x[2]}“`));
P('\n## Chyby P1/P4 podľa triedy (všetky)');
const byT = {};
for (const c of chyby) (byT[c.trieda] ||= []).push(c);
for (const [t, cs] of Object.entries(byT)) { P(`\n### ${t} (${cs.length})`); for (const c of cs) P(`  ${c.l} „${c.q}“ → ${c.r} | nevysvetlí: ${c.zle.join(', ')}`); }
P('\n## K9 slovník stránky: slovo, ktoré nevysvetlí víťaz, a predsa holá cena (zaradenie podľa JSON)');
for (const l of J) for (const [why, m] of Object.entries(K9[l])) P(`  ${l} ${why} (${m.size}): ${[...m.entries()].slice(0, 60).map(([x, id]) => `${x}→${id}`).join(' ')}`);
const txt = lines.join('\n') + '\n';
if (OUT) fs.writeFileSync(OUT, txt); else process.stdout.write(txt);
// najpomalšie otázky na opakované meranie
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'najpomalsie.json'), JSON.stringify(casy.slice(0, 40).map((x) => [x[1], x[2]])));
console.error(`hotovo: ${casy.length} otázok, chyby K1–K8 ${spolu.chyby}`);
