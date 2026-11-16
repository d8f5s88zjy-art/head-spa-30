<?php
// Jednotkové testy kľúčových funkcií správy (čistenie vstupov, šablóny, nahrávanie fotiek a PDF, zámky, zálohy,
// prerušený zápis, kódy a heslá). Spúšťa sa na KÓPII webu, nikdy nie na hostingu:
//   php sprava/testy/jednotky.php <koreň kópie webu> <priečinok so vstupnými súbormi>
// Priečinok údajov si správa vytvorí vedľa kópie (<rodič>/sprava-data). Vstupy: letak.jpg (4000 × 3000, EXIF orientácia 6
// a GPS), letak.pdf, zly.pdf (JavaScript), shell.jpg (PHP), polyglot.jpg, obr.svg, mala.png, bomba.png (12001 px).
const SPRAVA = 1;
const SPRAVA_TEST = 1;
// realpath('') vracia aktuálny priečinok – bez argumentov by testy bežali na repozitári, preto prázdne nepustiť
$WEB = ($argv[1] ?? '') !== '' ? realpath($argv[1]) : false; if (!$WEB) exit("Zadajte koreň kópie webu (nie repozitár).\n");
$VST = ($argv[2] ?? '') !== '' ? realpath($argv[2]) : false; if (!$VST) exit("Zadajte priečinok so vstupmi.\n");
if (is_dir("$WEB/nastroje") || is_file("$WEB/build.py")) exit("Toto je repozitár, nie kópia balíka. Testy spúšťajte na kópii (README, časť Správa webu).\n");
if (!is_file("$WEB/sprava/kostry/akcia.html")) exit("Toto nie je kópia webu so správou.\n");
require "$WEB/sprava/jadro/autoload.php";
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Bratislava');
$_SERVER['HTTP_HOST'] = 'localhost'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1'; $_SERVER['SCRIPT_NAME'] = '/sprava/index.php';
$ok = 0; $zle = 0;
function t(string $nazov, bool $podmienka, string $detail = ''): void
{
    global $ok, $zle;
    if ($podmienka) { $ok++; echo "  ok   $nazov\n"; } else { $zle++; echo "  ZLE  $nazov $detail\n"; }
}
function nahraj(string $subor, string $typ = 'image/jpeg'): array
{
    $tmp = tempnam(sys_get_temp_dir(), 'nahr');
    copy($subor, $tmp);
    return ['name' => basename($subor), 'type' => $typ, 'tmp_name' => $tmp, 'error' => UPLOAD_ERR_OK, 'size' => filesize($tmp)];
}

// izolované prostredie: vlastný priečinok údajov vedľa kópie webu
Nastavenie::init();
Nastavenie::zabezpecData();
echo "Údaje: " . Nastavenie::d() . "\n";
t('priečinok údajov je mimo koreňa webu', !str_starts_with(Nastavenie::d(), Nastavenie::w() . '/'));
t('ochranné súbory priečinka údajov', is_file(Nastavenie::d('.htaccess')) && is_file(Nastavenie::d('web.config')));

echo "Vstupy a čistenie\n";
t('text: riadiace znaky a medzery', Kontrola::text("  A\x00b\tc \u{200B}d  ") === 'A b c d');
t('text: neplatné UTF-8 → prázdne', Kontrola::text("\xC3\x28") === '');
t('text: dĺžka', mb_strlen(Kontrola::text(str_repeat('ž', 500), 50)) === 50);
t('chybaTextu: znaky < > { } odmietnuté', Kontrola::chybaTextu('<script>', 'X', 1, 50) !== null && Kontrola::chybaTextu('{{x}}', 'X', 1, 50) !== null);
t('chybaTextu: bežný text prejde', Kontrola::chybaTextu('Cement 325 R za 4,42 € – 25 kg', 'X', 3, 50) === null);
t('slug: diakritika', Kontrola::slug('Okná a schody Fakro – zľava 20 %') === 'okna-a-schody-fakro-zlava-20');
t('slug: prázdny', Kontrola::slug('!!!') === 'akcia');
t('cena: 4.42 → 4,42 €', Ulohy::normalizujCenu('4.42') === '4,42 €');
t('cena: 4,42 €/vrece ostáva', Ulohy::normalizujCenu('4,42 €/vrece') === '4,42 €/vrece');
t('cena: 40,10 €/vedro + pigmentácia ostáva', Ulohy::normalizujCenu('40,10 €/vedro + pigmentácia') === '40,10 €/vedro + pigmentácia');
t('cena: na dopyt', Ulohy::normalizujCenu('na dopyt') === 'na dopyt');
t('cena: nezmysel odmietnutý', Ulohy::normalizujCenu('4,42 €<script>') === null && Ulohy::normalizujCenu('12abc') === null);
$D = Zmena::zive();
$ceny = [];
foreach ($D['akcie']['akcie'] as $a) foreach ($a['ceny'] as $tb) foreach ($tb['riadky'] as $r) $ceny[] = $r[1];
t('všetkých ' . count($ceny) . ' cien z dát prejde normalizáciou bez zmeny', count(array_filter($ceny, fn($c) => Ulohy::normalizujCenu($c) !== $c)) === 0,
  implode(', ', array_slice(array_filter($ceny, fn($c) => Ulohy::normalizujCenu($c) !== $c), 0, 5)));
t('dátum: 2026-11-13 → 13. 11. 2026', Kontrola::datum('2026-11-13') === '13. 11. 2026' && Kontrola::datum('2026-02-30') === null);

echo "Šablóny a escapovanie\n";
t('šablóna escapuje ako Python', Sablona::vyplnit('{{x}}', ['x' => "<a href=\"x\">'&"]) === '&lt;a href=&quot;x&quot;&gt;&#x27;&amp;');
t('text z dát sa nevyhodnocuje ako šablóna', Sablona::vyplnit('{{x}}', ['x' => '{{y}}']) === '{{y}}');
t('falošná značka oblasti v texte sa escapuje', !str_contains(Sablona::vyplnit('{{x}}', ['x' => '<!--/s:meta--><script>']), '<!--'));
$X = $D; $X['akcie']['akcie'][1]['karta'] = 'Test <!--/s:akcia-telo--><script>alert(1)</script> "x" ]]> */';
$h = Vykreslenie::vykresli('akcia-telo', $X['akcie']['akcie'][1]['stranka'], Zmena::sKonstantami($X));
$h2 = Vykreslenie::vykresli('hlavicka', $X['akcie']['akcie'][1]['stranka'], Zmena::sKonstantami($X));
t('XSS v texte akcie je v hlavičke escapovaný', !str_contains($h2, '<script>') && str_contains($h2, '&lt;script&gt;') && !str_contains($h2, '<!--/s:'));

echo "Otváracie hodiny\n";
$post = ['den' => []];
foreach ([1, 2, 3, 4, 5] as $d) $post['den'][$d] = ['otvorene' => 1, 'od' => '07:00', 'do' => '16:00'];
$post['den'][6] = ['otvorene' => 1, 'od' => '07:00', 'do' => '11:00'];
[$H, $e] = Ulohy::hodiny($D, $post);
t('hodiny: dve skupiny Po–Pi a So', $e === null && count($H['firma']['hodiny']) === 2 && $H['firma']['hodiny'][0]['dni'] === [1, 2, 3, 4, 5]);
t('hodiny: veta', Vykreslenie::hodiny_veta($H) === 'pondelok – piatok 7:00 – 16:00, sobota 7:00 – 11:00');
$post['den'][3] = ['otvorene' => 1, 'od' => '08:00', 'do' => '16:00'];
[$H, $e] = Ulohy::hodiny($D, $post);
t('hodiny: rôzny čas v stredu rozdelí skupiny', $e === null && count($H['firma']['hodiny']) === 4, (string)$e);
t('hodiny: dlhý popis Kontaktu prejde na kratšiu vetu bez hodín', $e === null && !str_contains(Vykreslenie::kontakt_popis($H), 'Otvorené'));
[$H, $e] = Ulohy::hodiny($D, ['den' => [1 => ['otvorene' => 1, 'od' => '16:00', 'do' => '07:00']]]);
t('hodiny: zatvorenie pred otvorením odmietnuté', $e !== null);
[$H, $e] = Ulohy::hodiny($D, ['den' => []]);
t('hodiny: aspoň jeden deň', $e !== null);
[$H, $e] = Ulohy::hodiny($D, ['den' => [1 => ['otvorene' => 1, 'od' => '7:00<b>', 'do' => '16:00']]]);
t('hodiny: zlý čas odmietnutý', $e !== null);

echo "Fotky\n";
$f = Subory::fotka(nahraj("$VST/letak.jpg"), 'Skúšobný leták');
t('fotka 4000 × 3000 s EXIF prijatá', is_array($f), is_string($f) ? $f : '');
if (is_array($f)) {
    t('šírky sady 600 a 1200 (nikdy väčšie ako originál)', array_column($f['sirky'], 0) === [600, 1200]);
    $info = getimagesize(Nastavenie::w($f['src']));
    t('otočená podľa EXIF (na výšku)', $info[1] > $info[0], "{$info[0]}×{$info[1]}");
    t('výstup je WebP', $info['mime'] === 'image/webp');
    $obsah = file_get_contents(Nastavenie::w($f['src']));
    t('bez EXIF a GPS', !str_contains($obsah, 'Exif') && !str_contains($obsah, 'GPS'));
    t('meno vyrobil server', (bool)preg_match('#^img/s/\d{4}/\d{2}/skusobny-letak-[0-9a-f]{8}-1200\.webp$#', $f['src']));
}
$f = Subory::fotka(nahraj("$VST/mala.png", 'image/png'), 'malá');
t('malá fotka 300 px: jedna šírka = originál', is_array($f) && array_column($f['sirky'], 0) === [300]);
foreach (['shell.jpg' => 'PHP premenované na .jpg', 'obr.svg' => 'SVG', 'letak.pdf' => 'PDF ako fotka', 'bomba.png' => 'príliš veľa bodov'] as $s => $n) {
    $r = Subory::fotka(nahraj("$VST/$s"), 'test');
    t("fotka: $n odmietnutá", is_string($r), is_array($r) ? 'prijaté' : '');
}
$r = Subory::fotka(nahraj("$VST/polyglot.jpg"), 'test');
t('polyglot JPEG+PHP: prekódovaný, PHP kód zmizne', is_string($r) || !str_contains(file_get_contents(Nastavenie::w($r['src'])), '<?php'));
t('v img/s nevznikol žiadny .php', !array_filter(iterator_to_array(new RecursiveIteratorIterator(new RecursiveDirectoryIterator(Nastavenie::w('img/s'), FilesystemIterator::SKIP_DOTS))), fn($x) => preg_match('/\.(php|phtml|phar)$/i', $x->getFilename())));

echo "PDF\n";
$p = Subory::pdf(nahraj("$VST/letak.pdf", 'application/pdf'), 'Leták test');
t('platné PDF prijaté', is_array($p) && preg_match('#^pdf/s/\d{4}/\d{2}/letak-test-[0-9a-f]{8}\.pdf$#', $p['subor']), is_string($p) ? $p : '');
t('PDF s JavaScriptom odmietnuté', is_string(Subory::pdf(nahraj("$VST/zly.pdf", 'application/pdf'), 'x')));
t('fotka ako PDF odmietnutá', is_string(Subory::pdf(nahraj("$VST/letak.jpg", 'application/pdf'), 'x')));
$prazdne = ['name' => '', 'type' => '', 'tmp_name' => '', 'error' => UPLOAD_ERR_NO_FILE, 'size' => 0];
t('chýbajúci súbor', Subory::pdf($prazdne, 'x') === 'Nevybrali ste súbor.');

echo "Zámky\n";
$z1 = Ulozisko::zamok(Nastavenie::d('test.zamok'));
$z2 = Ulozisko::zamok(Nastavenie::d('test.zamok'));
t('druhý zámok sa nedá získať', $z1 !== null && $z2 === null);
Ulozisko::odomkni($z1);
$z3 = Ulozisko::zamok(Nastavenie::d('test.zamok'));
t('po odomknutí sa dá', $z3 !== null);
Ulozisko::odomkni($z3);

echo "Zverejnenie, zálohy, prerušený zápis\n";
$_SESSION = ['ucet' => 'Test'];
if (Zmena::koncept()) Zmena::zahodKoncept();
$pred = hash_file('sha256', Nastavenie::w('kontakt.html'));
$D = Zmena::zive();
[$H, $e] = Ulohy::hodiny($D, ['den' => [1 => ['otvorene' => 1, 'od' => '07:00', 'do' => '15:00'], 2 => ['otvorene' => 1, 'od' => '07:00', 'do' => '15:00'], 3 => ['otvorene' => 1, 'od' => '07:00', 'do' => '15:00'], 4 => ['otvorene' => 1, 'od' => '07:00', 'do' => '15:00'], 5 => ['otvorene' => 1, 'od' => '07:00', 'do' => '15:00']]]);
t('koncept uložený', Zmena::ulozKoncept($H, 'Test hodín') === null && hash_file('sha256', Nastavenie::w('kontakt.html')) === $pred);
$r = Zmena::priprav();
t('náhľad bez chýb a zmení stránky', !$r['chyby'] && count($r['zmenene']) > 70, implode(' | ', $r['chyby']));
// zlyhanie premenovania pri 40. súbore → web ostane ako pred zmenou
$odtlacky = [];
foreach ($r['zmenene'] as $p) $odtlacky[$p] = is_file(Nastavenie::w($p)) ? hash_file('sha256', Nastavenie::w($p)) : null;
Ulozisko::$zlyhajPri = 40;
$e = Zmena::zverejni();
Ulozisko::$zlyhajPri = 0;
$rovnake = count(array_filter(array_keys($odtlacky), fn($p) => (is_file(Nastavenie::w($p)) ? hash_file('sha256', Nastavenie::w($p)) : null) === $odtlacky[$p]));
t('zlyhanie pri 40. súbore: chybová veta', is_string($e) && str_contains($e, 'Web ostal bez zmeny'), (string)$e);
t('zlyhanie pri 40. súbore: všetkých ' . count($odtlacky) . ' súborov ako pred zmenou', $rovnake === count($odtlacky), "$rovnake");
t('žiadne dočasné súbory nezostali', !glob(Nastavenie::w('*.tmp-*')) && !glob(Nastavenie::w('akcie/*.tmp-*')) && !is_file(Nastavenie::d('zurnal.json')));
// zmena zvonka medzi náhľadom a zverejnením
Zmena::priprav();
file_put_contents(Nastavenie::w('kontakt.html'), file_get_contents(Nastavenie::w('kontakt.html')) . ' ');
$e = Zmena::zverejni();
t('zmena zvonka medzi náhľadom a zverejnením odmietnutá', is_string($e) && str_contains($e, 'Medzitým sa web zmenil'), (string)$e);
file_put_contents(Nastavenie::w('kontakt.html'), substr(file_get_contents(Nastavenie::w('kontakt.html')), 0, -1));
// dve zverejnenia naraz
Zmena::priprav();
$drz = Ulozisko::zamok(Nastavenie::d('zverejnenie.zamok'));
$e = Zmena::zverejni();
Ulozisko::odomkni($drz);
t('druhé zverejnenie naraz odmietnuté', is_string($e) && str_contains($e, 'Práve sa ukladá'), (string)$e);
// riadne zverejnenie
$e = Zmena::zverejni();
t('zverejnenie prešlo', $e === null, (string)$e);
t('Kontakt má nové hodiny', str_contains(file_get_contents(Nastavenie::w('kontakt.html')), '7:00 – 15:00'));
$zal = Zmena::zalohy();
t('záloha so súbormi a údajmi', $zal && count($zal[0]['subory']) > 70 && is_dir(Nastavenie::d('zalohy/' . $zal[0]['id'] . '/subory')));
// prerušenie medzi premenovaniami: denník s cieľmi → pri ďalšej požiadavke návrat zo zálohy
$po = hash_file('sha256', Nastavenie::w('kontakt.html'));
$id = $zal[0]['id'];
copy(Nastavenie::w('kontakt.html'), Nastavenie::w('kontakt.html') . '.kopia');
file_put_contents(Nastavenie::w('kontakt.html'), 'POLOVICA ZÁPISU');
Ulozisko::zapisJson(Nastavenie::d('zurnal.json'), ['zaloha' => $id, 'ciele' => ['w:kontakt.html' => ['ciel' => Nastavenie::w('kontakt.html'), 'tmp' => Nastavenie::w('kontakt.html') . '.tmp-x']]]);
Zmena::dokonciPrerusene();
t('prerušený zápis: súbor vrátený zo zálohy (stav pred zmenou)', hash_file('sha256', Nastavenie::w('kontakt.html')) === $pred);
rename(Nastavenie::w('kontakt.html') . '.kopia', Nastavenie::w('kontakt.html'));
// Vrátiť späť
t('vrátenie vytvorí koncept', Zmena::vratit($id) === null && Zmena::koncept() !== null);
$r = Zmena::priprav();
t('vrátenie: náhľad bez chýb', !$r['chyby'], implode(' | ', $r['chyby']));
t('vrátenie zverejnené', Zmena::zverejni() === null);
t('po vrátení je Kontakt ako pred zmenou', hash_file('sha256', Nastavenie::w('kontakt.html')) === $pred);
t('web = údaje (žiadna rozdielna stránka)', !Zmena::stavWebu()['rozdielne']);

echo "Súbeh a staging (B-1, B-2)\n";
$D = Zmena::zive();
[$H, $e] = Ulohy::hodiny($D, ['den' => [1 => ['otvorene' => 1, 'od' => '07:00', 'do' => '14:00'], 2 => ['otvorene' => 1, 'od' => '07:00', 'do' => '14:00']]]);
Zmena::ulozKoncept($H, 'Test súbehu');
Zmena::priprav();
$pred2 = hash_file('sha256', Nastavenie::w('kontakt.html'));
@unlink(Nastavenie::d('staging/w/kontakt.html'));
$e = Zmena::zverejni();
t('chýbajúci súbor v stagingu: nič sa nezverejní', is_string($e) && str_contains($e, 'Pozrite si náhľad znova') && hash_file('sha256', Nastavenie::w('kontakt.html')) === $pred2, (string)$e);
Zmena::priprav();
file_put_contents(Nastavenie::d('staging/w/kontakt.html'), '');
$e = Zmena::zverejni();
t('prázdny súbor v stagingu: nič sa nezverejní', is_string($e) && filesize(Nastavenie::w('kontakt.html')) > 1000, (string)$e);
Zmena::priprav();
$k = Zmena::koncept(); $k['data']['firma']['hodiny'][0]['do'] = '13:00'; Ulozisko::zapisJson(Nastavenie::d('koncept/navrh.json'), $k);
$e = Zmena::zverejni();
t('koncept zmenený po náhľade: nič sa nezverejní', is_string($e) && str_contains($e, 'náhľad znova'), (string)$e);
Zmena::zahodKoncept();
// cudzia požiadavka počas zverejnenia (zámok drží zverejnenie) nesmie vracať súbory
$drz = Ulozisko::zamok(Nastavenie::d('zverejnenie.zamok'));
$zal = Zmena::zalohy();
copy(Nastavenie::w('kontakt.html'), Nastavenie::w('kontakt.html') . '.kopia');
file_put_contents(Nastavenie::w('kontakt.html'), 'NOVÝ OBSAH POČAS ZVEREJNENIA');
Ulozisko::zapisJson(Nastavenie::d('zurnal.json'), ['zaloha' => $zal[0]['id'], 'ciele' => ['w:kontakt.html' => ['ciel' => Nastavenie::w('kontakt.html'), 'tmp' => Nastavenie::w('kontakt.html') . '.tmp-x']]]);
Zmena::obnovPrerusene();
t('počas zverejnenia cudzia požiadavka nič nevráti', file_get_contents(Nastavenie::w('kontakt.html')) === 'NOVÝ OBSAH POČAS ZVEREJNENIA' && is_file(Nastavenie::d('zurnal.json')));
Ulozisko::odomkni($drz);
Zmena::obnovPrerusene();
t('po skončení (zámok voľný) sa prerušený zápis dokončí', file_get_contents(Nastavenie::w('kontakt.html')) !== 'NOVÝ OBSAH POČAS ZVEREJNENIA' && !is_file(Nastavenie::d('zurnal.json')));
rename(Nastavenie::w('kontakt.html') . '.kopia', Nastavenie::w('kontakt.html'));

echo "Vstupy formulára a PDF (B-6, B-9)\n";
$r = null;
try { $r = Ulohy::akcia(Zmena::zive(), null, ['nazov' => 'Skúška polí', 'stitok' => 'Akciová cena', 'karta' => 'Skúšobná akcia na overenie, že zlé polia formulára nezhodia správu.', 'ceny' => ['abc', ['r' => 'x'], ['r' => ['s', ['polozka' => 'Cement', 'cena' => '4,42']]]]], []); } catch (Throwable $ex) { $r = $ex->getMessage(); }
t('polia namiesto reťazcov v cenách: bez chyby, platný riadok ostane', is_array($r) && $r[1] === null && $r[0]['akcie']['akcie'][0]['ceny'][0]['riadky'] === [['Cement', '4,42 €']], is_array($r) ? (string)$r[1] : (string)$r);
$pdf0 = file_get_contents("$VST/letak.pdf");
$tmpf = fn($obsah) => (function ($o) { $t = tempnam(sys_get_temp_dir(), 'pdf'); file_put_contents($t, $o); return ['name' => 'x.pdf', 'type' => 'application/pdf', 'tmp_name' => $t, 'error' => UPLOAD_ERR_OK, 'size' => strlen($o)]; })($obsah);
$vlozit = fn($kusok) => preg_replace('/%%EOF\s*$/', $kusok . "\n%%EOF\n", $pdf0);
t('PDF s /J#61vaScript (zápis cez #xx) odmietnuté', is_string(Subory::pdf($tmpf($vlozit("9 0 obj << /S /J#61vaScript /J#53 (app.alert(1)) >> endobj")), 'x')));
$z = gzcompress('<< /S /JavaScript /JS (app.alert(1)) >>');
t('PDF s JavaScriptom v komprimovanom prúde odmietnuté', is_string(Subory::pdf($tmpf($vlozit("9 0 obj << /Type /ObjStm /Filter /FlateDecode /Length " . strlen($z) . " >>\nstream\n$z\nendstream endobj")), 'x')));
t('obyčajné PDF ďalej prejde', is_array(Subory::pdf($tmpf($pdf0), 'Leták test 2')));
$vsetky = glob(Nastavenie::w('pdf/*.pdf')) ?: [];
t('PDF z webu (' . count($vsetky) . '): rovnaké výsledky ako predtým (žiadne nové odmietnutie)', count(array_filter($vsetky, fn($f) => Subory::pdfSProgramom(file_get_contents($f)))) <= 19);

echo "Prístup bez zamknutia majiteľa (B-3, S6)\n";
Ulozisko::zapisJson(Nastavenie::d('pokusy.json'), []);
for ($i = 2; $i <= 9; $i++) { $_SERVER['REMOTE_ADDR'] = "10.0.0.$i"; for ($j = 0; $j < 5; $j++) Pristup::zlyPokus(); }   // 40 zlých hesiel z 8 adries
$_SERVER['REMOTE_ADDR'] = '10.0.0.200';
t('40 zlých hesiel z 8 cudzích adries: majiteľ z inej adresy nie je zablokovaný', Pristup::blokovane() === null);
$_SERVER['REMOTE_ADDR'] = '10.0.0.2';
t('adresa s 5 zlými pokusmi je zablokovaná', is_string(Pristup::blokovane()));
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
echo "Kódy a heslá\n";
@unlink(Nastavenie::d('ucty.json'));
t('prvý kód sa vytvorí', Pristup::vytvorKod('prvy') === null && is_file(Nastavenie::d('PRVY-KOD.txt')));
preg_match('/Kód: ([A-Z0-9-]+)/', file_get_contents(Nastavenie::d('PRVY-KOD.txt')), $m);
t('kód má 16 znakov bez zameniteľných', strlen(str_replace('-', '', $m[1])) === 16 && !preg_match('/[01IO]/', $m[1]));
$nas = file_get_contents(Nastavenie::d('nastavenie.json'));
t('kód nie je v nastavení v čitateľnej podobe', !str_contains($nas, str_replace('-', '', $m[1])) && !str_contains($nas, $m[1]));
t('nový kód hneď znova nevznikne (platný ostáva)', Pristup::vytvorKod('prvy') === null && str_contains(file_get_contents(Nastavenie::d('PRVY-KOD.txt')), $m[1]));
for ($i = 0; $i < 5; $i++) Pristup::overKod('prvy', 'AAAA-BBBB-CCCC-DDDD');
t('po 5 zlých pokusoch neplatí ani správny kód', Pristup::overKod('prvy', $m[1]) === false);
t('nový kód skôr ako o 15 min nevznikne', is_string(Pristup::vytvorKod('prvy')) || !is_file(Nastavenie::d('PRVY-KOD.txt')));
Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($n) { unset($n['kod']); return $n; });
Pristup::vytvorKod('prvy');
preg_match('/Kód: ([A-Z0-9-]+)/', file_get_contents(Nastavenie::d('PRVY-KOD.txt')), $m);
t('správny kód (malými písmenami, s medzerami) prejde a súbor sa zmaže', Pristup::overKod('prvy', strtolower(str_replace('-', ' ', $m[1]))) && !is_file(Nastavenie::d('PRVY-KOD.txt')));
t('použitý kód druhýkrát neprejde', Pristup::overKod('prvy', $m[1]) === false);
Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($n) { unset($n['kod']); return $n; });
@unlink(Nastavenie::d('ucty.json'));
Pristup::vytvorKod('prvy');
preg_match('/Kód: ([A-Z0-9-]+)/', file_get_contents(Nastavenie::d('PRVY-KOD.txt')), $m);
$_SERVER['REMOTE_ADDR'] = '10.9.9.9';
for ($i = 0; $i < 5; $i++) Pristup::overKod('prvy', 'AAAA-BBBB-CCCC-DDDD');
t('cudzia adresa po 5 zlých pokusoch: kód pre ňu neplatí', Pristup::overKod('prvy', $m[1]) === false);
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
t('majiteľ z inej adresy: ten istý kód ďalej platí (cudzí ho nespáli)', Pristup::overKod('prvy', $m[1]) === true);
Pristup::vytvorKod('prvy');
@unlink(Nastavenie::d('PRVY-KOD.txt'));
t('majiteľ zmazal súbor cez FTP: nový kód vznikne hneď', Pristup::vytvorKod('prvy') === null && is_file(Nastavenie::d('PRVY-KOD.txt')));
$riadky = count(file(Nastavenie::d('dennik.jsonl')));
Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($n) { unset($n['kod']); return $n; });
for ($i = 0; $i < 20; $i++) Pristup::overKod('obnova', 'AAAA-BBBB-CCCC-DDDD');
t('pokusy bez platného kódu sa nezapisujú do denníka (B-7)', count(file(Nastavenie::d('dennik.jsonl'))) === $riadky);
foreach (['krátke' => 'abc', 'richtarik2026' => 'richtarik2026', 'heslo12345' => 'heslo12345', 'známe' => '1q2w3e4r5t', 'aaaaaaaaaaaa' => 'aaaaaaaaaaaa'] as $n => $h)
    t("slabé heslo „{$n}“ odmietnuté", Pristup::chybaHesla($h, $h, 'Mário') !== null);
t('rôzne heslá odmietnuté', Pristup::chybaHesla('palety-cement-krskany', 'palety-cement-krskanx', 'Mário') !== null);
t('dobré heslo prijaté', Pristup::chybaHesla('palety-cement-krskany', 'palety-cement-krskany', 'Mário') === null);
Pristup::nastavUcet('Test', 'palety-cement-krskany', false);
$u = file_get_contents(Nastavenie::d('ucty.json'));
t('heslo uložené len ako odtlačok', !str_contains($u, 'palety-cement-krskany') && preg_match('/\$(argon2id|2y)\$/', $u));
t('správne heslo', Pristup::overHeslo('test', 'palety-cement-krskany'));
t('zlé heslo', !Pristup::overHeslo('Test', 'palety-cement-krskanx'));
$t0 = microtime(true); Pristup::overHeslo('Neexistuje', 'x'); $t1 = microtime(true); Pristup::overHeslo('Test', 'x'); $t2 = microtime(true);
t('meno bez dĺžňa a malými písmenami prejde (S6)', Pristup::overHeslo('  TEST ', 'palety-cement-krskany'));
Pristup::nastavUcet('Mário', 'palety-cement-krskany', false);
t('„mario“ = „Mário“ (S6)', Pristup::overHeslo('mario', 'palety-cement-krskany') && Pristup::menoUctu('MARIO') === 'Mário');
t('neznáme meno trvá ako zlé heslo (±50 ms)', abs(($t1 - $t0) - ($t2 - $t1)) < 0.05, sprintf('%.0f ms vs %.0f ms', ($t1 - $t0) * 1000, ($t2 - $t1) * 1000));

echo "Nové úkony: oznamy, novinky, galéria, texty, kontakt (V1–V4)\n";
$_SESSION = ['ucet' => 'Mário'];
if (Zmena::koncept()) Zmena::zahodKoncept();
$D = Zmena::zive();
$rok = (int)date('Y') + 1;
[$X, $e] = Obsah::vynimkaPridat($D, ['od' => "$rok-12-24", 'do' => "$rok-12-26", 'druh' => 'zatvorene', 'nazov' => 'Vianoce']);
t('oznam: pridaný bez zmeny bežných hodín (V2)', $e === null && count($X['firma']['vynimky']) === 1 && $X['firma']['hodiny'] === $D['firma']['hodiny'], (string)$e);
$h = Vykreslenie::vykresli('hodiny-pata', 'kontakt.html', Zmena::sKonstantami($X));
t('oznam: v päte s dátumom konca pre skrytie', str_contains($h, 'data-do="' . $rok . '-12-26"') && str_contains(str_replace("\u{a0}", ' ', $h), "Vianoce 24. 12. – 26. 12. $rok: zatvorené"));
t('oznam: v údajoch pre Google', str_contains(Vykreslenie::firma_ld(Zmena::sKonstantami($X)), '"specialOpeningHoursSpecification"'));
t('oznam: koniec pred začiatkom odmietnutý', Obsah::vynimkaPridat($D, ['od' => "$rok-12-26", 'do' => "$rok-12-24"])[1] !== null);
t('oznam: minulý termín odmietnutý', Obsah::vynimkaPridat($D, ['od' => '2020-01-01', 'do' => '2020-01-02'])[1] !== null);
t('oznam: dlhší ako 3 mesiace odmietnutý', Obsah::vynimkaPridat($D, ['od' => "$rok-01-01", 'do' => "$rok-06-01"])[1] !== null);
t('oznam: iné hodiny vyžadujú čas', Obsah::vynimkaPridat($D, ['od' => "$rok-12-31", 'druh' => 'otvorene', 'cas_od' => '12:00', 'cas_do' => '08:00'])[1] !== null);
$Y = $X; $Y['firma']['vynimky'][] = ['od' => '2020-01-01', 'do' => '2020-01-02', 'nazov' => '', 'zatvorene' => true];
t('oznam: skončené sa pri ďalšej zmene vynechajú', count(Obsah::bezStarychVynimiek($Y)['firma']['vynimky']) === 1);

[$X, $e, $var, $nid] = Obsah::novinka($D, null, ['nazov' => 'Skúšobná novinka dlažba', 'popis' => 'Nová skúšobná dlažba v ponuke predajne, len na overenie správy webu.', 'text' => "Prvý odsek.\n\nDruhý odsek novinky."], []);
$n = $X['novinky']['novinky'][0];
t('novinka: nová so stránkou a SEO (V1)', $e === null && $nid === 'skusobna-novinka-dlazba' && $n['stranka'] === 'novinky/skusobna-novinka-dlazba.html' && count($n['odseky']) === 2 && $n['seo']['h1'] === 'Skúšobná novinka dlažba', (string)$e);
t('novinka: dlhý názov sa neoreže, hlásenie povie o koľko (S7)', str_contains((string)Obsah::novinka($D, null, ['nazov' => str_repeat('Dlhý názov ', 6), 'popis' => str_repeat('x', 40), 'text' => 'Odsek textu.'], [])[1], 'teraz má'));
t('novinka: bez textu odmietnutá', Obsah::novinka($D, null, ['nazov' => 'Iná novinka', 'popis' => str_repeat('Popis novinky. ', 3), 'text' => ''], [])[1] !== null);
[$Z] = Obsah::novinkaViditelnost($X, $nid, false);
t('novinka: skrytá má noindex a nie je v zozname', Vykreslenie::meta_vm(Zmena::sKonstantami($Z), $n['stranka'])['noindex'] && !str_contains(Vykreslenie::vykresli('novinky-index', 'novinky/index.html', Zmena::sKonstantami($Z)), 'Skúšobná novinka'));
// celý cyklus: koncept → náhľad → zverejnenie → stránka z kostry
t('novinka: koncept', Zmena::ulozKoncept($X, 'Nová novinka', ['novinka', ['id' => 'nova']]) === null);
$r = Zmena::priprav();
t('novinka: náhľad bez chýb, 1 nová stránka', !$r['chyby'] && $r['nove'] === [$n['stranka']], implode(' | ', $r['chyby']));
t('novinka: Späť z náhľadu do formulára (S3)', Zmena::navrat(Zmena::koncept()) === ['novinka', ['id' => 'nova']]);
t('novinka: zverejnená', Zmena::zverejni() === null);
$st = (string)@file_get_contents(Nastavenie::w($n['stranka']));
t('novinka: stránka na webe bez noindex, v sitemap', str_contains($st, 'Druhý odsek novinky.') && !str_contains($st, 'noindex') && str_contains(file_get_contents(Nastavenie::w('sitemap.xml')), $n['stranka']));
$z = Zmena::zalohy()[0];
t('História: zverejnenie si pamätá, čo sa zmenilo (S8)', in_array('Nová novinka „Skúšobná novinka dlažba“', $z['zmeny'] ?? [], true));
t('vrátenie: novinka pridaná po zálohe ostane skrytá', Zmena::vratit($z['id']) === null && !array_values(array_filter(Zmena::koncept()['data']['novinky']['novinky'], fn($x) => $x['id'] === $nid))[0]['viditelna']);
Zmena::priprav(); t('vrátenie novinky zverejnené', Zmena::zverejni() === null);
t('po vrátení stránka novinky má noindex', str_contains(file_get_contents(Nastavenie::w($n['stranka'])), 'noindex'));

$D = Zmena::zive();
[$X, $e] = Obsah::galeria($D, 'pridat', ['album' => 'dvor', 'popis' => 'Skúšobná fotka paliet v areáli'], ['foto' => nahraj("$VST/letak.jpg")]);
t('galéria: nová fotka na začiatku albumu (V3)', $e === null && $X['galeria']['albumy'][1]['fotky'][0]['popis'] === 'Skúšobná fotka paliet v areáli' && str_starts_with($X['galeria']['albumy'][1]['fotky'][0]['src'], 'img/s/'), (string)$e);
$fid = $X['galeria']['albumy'][1]['fotky'][1]['id'];
[$Y, $e] = Obsah::galeria($X, 'nahradit', ['album' => 'dvor', 'foto' => $fid], ['foto' => nahraj("$VST/letak.jpg")]);
t('galéria: nahradená fotka si nechá popis', $e === null && $Y['galeria']['albumy'][1]['fotky'][1]['popis'] === $X['galeria']['albumy'][1]['fotky'][1]['popis'] && $Y['galeria']['albumy'][1]['fotky'][1]['src'] !== $X['galeria']['albumy'][1]['fotky'][1]['src']);
[$Y, $e] = Obsah::galeria($X, 'skryt', ['album' => 'dvor', 'foto' => $fid], []);
t('galéria: skrytá fotka zmizne z albumu', $e === null && !str_contains(Vykreslenie::vykresli('galeria-dvor', 'galeria/index.html', Zmena::sKonstantami($Y)), $X['galeria']['albumy'][1]['fotky'][1]['src']));
t('galéria: krátky popis odmietnutý', Obsah::galeria($D, 'pridat', ['album' => 'dvor', 'popis' => 'x'], [])[1] !== null);
t('galéria: neznámy album odmietnutý', Obsah::galeria($D, 'pridat', ['album' => '../x', 'popis' => 'Skúšobná fotka'], [])[1] !== null);

$T = $D['texty'];
$post = ['uvod_lede' => $T['uvod_lede'], 'sluzby_uvod' => 'Skúšobná veta pod nadpisom Služieb, poradenstvo je zadarmo.', 'uvod_onas' => implode("\n\n", $T['uvod_onas']), 'onas' => implode("\n\n", $T['onas']),
         'sluzby' => array_map(fn($x) => ['nazov' => $x[0], 'text' => $x[1]], $T['sluzby']), 'doprava' => array_map(fn($x) => ['nazov' => $x[0], 'text' => $x[1]], $T['doprava'])];
[$X, $e] = Obsah::texty($D, $post);
t('texty: zmenená veta Služieb, ostatné rovnaké (V4)', $e === null && $X['texty']['sluzby_uvod'] === $post['sluzby_uvod'] && $X['texty']['sluzby'] === $T['sluzby'] && $X['texty']['doprava'] === $T['doprava'], (string)$e);
t('texty: značky odmietnuté', Obsah::texty($D, ['sluzby_uvod' => '<script>alert(1)</script> a ďalší text vety'] + $post)[1] !== null);
t('texty: prázdny zoznam služieb odmietnutý', Obsah::texty($D, ['sluzby' => []] + $post)[1] !== null);
t('texty: {telefon} v Doprave je odkaz', str_contains(Vykreslenie::vykresli('doprava-polozky', 'doprava.html', Zmena::sKonstantami($D)), 'href="tel:'));

t('kontakt: telefón v medzinárodnom tvare', Obsah::telefon('+421 905 111 222', true) === ['0905 111 222', '+421905111222'] && Obsah::telefon('037/651 17 77', false) === ['037 651 17 77', '+421376511777']);
t('kontakt: pevná linka ako mobil odmietnutá', Obsah::telefon('037 651 17 77', true) === null);
t('kontakt: bez zmeny odmietnuté', Obsah::kontakt($D, ['mobil' => $D['firma']['mobil'], 'pevna' => $D['firma']['pevna'], 'email' => $D['firma']['email']])[1] !== null);
[$X, $e] = Obsah::kontakt($D, ['mobil' => '0905 111 222', 'pevna' => $D['firma']['pevna'], 'email' => $D['firma']['email']]);
t('kontakt: nový mobil v údajoch aj textoch (V4)', $e === null && $X['firma']['mobil_tel'] === '+421905111222' && !str_contains(json_encode($X, JSON_UNESCAPED_UNICODE), '0905 622 223'), (string)$e);
$DK = Zmena::sKonstantami($X);
$kostra = Zmena::vykresliSubor('akcie/porfix.html', $DK, null);   // kostra (ako pre novú stránku), oblasti z údajov
t('kontakt: nová stránka z kostry má nový mobil aj mimo oblastí', !str_contains($kostra, '622 223') && !str_contains($kostra, '905622223'));
// karty Kontaktu s Máriovými grafikami: obrázok len pri údajoch, ktoré ukazuje (konštanty kontakt_obr), karta vždy z údajov
$kk0 = Vykreslenie::vykresli('kontakt-karty', 'kontakt.html', Zmena::sKonstantami($D));
t('kontakt: s pôvodnými údajmi majú obe karty obrázok', str_contains($kk0, 'kontakt-zavolajte-480') && str_contains($kk0, 'kontakt-napiste-480') && !str_contains($kk0, 'bez-obr'));
$kk = Vykreslenie::vykresli('kontakt-karty', 'kontakt.html', $DK);
t('kontakt: zmena mobilu skryje obrázok Zavolajte nám, karta ostane s novým číslom', !str_contains($kk, 'kontakt-zavolajte') && str_contains($kk, 'kontakt-napiste-480') && str_contains($kk, 'href="tel:+421905111222">0905 111 222</a>') && str_contains($kk, 'Zavolajte nám'));
[$Y, $e] = Obsah::kontakt($D, ['mobil' => $D['firma']['mobil'], 'pevna' => '037 777 88 99', 'email' => $D['firma']['email']]);
t('kontakt: zmena pevnej linky skryje obrázok Zavolajte nám', $e === null && !str_contains(Vykreslenie::vykresli('kontakt-karty', 'kontakt.html', Zmena::sKonstantami($Y)), 'kontakt-zavolajte'), (string)$e);
[$Y, $e] = Obsah::kontakt($D, ['mobil' => $D['firma']['mobil'], 'pevna' => $D['firma']['pevna'], 'email' => 'predajna@stavebniny-test.sk']);
$kk = Vykreslenie::vykresli('kontakt-karty', 'kontakt.html', Zmena::sKonstantami($Y));
t('kontakt: zmena e-mailu skryje obrázok Napíšte nám, Zavolajte nám ostane', $e === null && str_contains($kk, 'kontakt-zavolajte-480') && !str_contains($kk, 'kontakt-napiste') && str_contains($kk, 'mailto:predajna@stavebniny-test.sk'), (string)$e);
t('kontakt: údaje obrázkov v konštantách zmena kontaktu nenahradí', Zmena::sKonstantami($Y)['k']['kontakt_obr']['zavolajte']['mobil'] === '0905622223');

echo "Grafiky s údajom v obrázku: na webe len pri zhode s údajmi (udaje_platia, plati_pri)\n";
$D = Zmena::zive(); $DK0 = Zmena::sKonstantami($D);
$obl = fn(string $oid, string $c, array $DK) => Vykreslenie::vykresli($oid, $c, $DK);
$hk = $obl('hodiny-kontakt', 'kontakt.html', $DK0); $gl = $obl('galeria-letaky', 'letak.html', $DK0); $gg = $obl('galeria-grafika', 'galeria/index.html', $DK0); $sz = $obl('sluzby-zlavy', 'sluzby.html', $DK0);
t('grafiky: s pôvodnými údajmi sú všetky na webe (hodiny, zľavy, 4 letáky a bannery, 12 obrázkov albumu)',
  str_contains($hk, 'kontakt-hodiny-288') && str_contains($sz, 'zlavy-480') && substr_count($gl, '<figure') === 4 && substr_count($gg, '<figure') === 12 && str_contains($gg, '12 obrázkov'));
t('grafiky: všetky kľúče údajov platia, neznámy kľúč neplatí, prázdny zoznam platí',
  Vykreslenie::udaje_platia($DK0, ['hodiny', 'mobil', 'pevna', 'email', 'ulica', 'psc', 'majitel', 'zlava']) && !Vykreslenie::udaje_platia($DK0, ['nieco']) && Vykreslenie::udaje_platia($DK0, []));
// (a) zmena hodín v správe: obrázok hodín, leták „Prečo nakupovať“ a tabuľa s otváracou dobou zmiznú, texty ostanú
$den = []; foreach ([1, 2, 3, 4, 5] as $d) $den[$d] = ['otvorene' => 1, 'od' => '07:00', 'do' => '16:30']; $den[6] = ['otvorene' => 1, 'od' => '07:00', 'do' => '12:00'];
[$H, $e] = Ulohy::hodiny($D, ['den' => $den]); $DKH = Zmena::sKonstantami($H);
$hk = $obl('hodiny-kontakt', 'kontakt.html', $DKH); $gl = $obl('galeria-letaky', 'letak.html', $DKH); $gg = $obl('galeria-grafika', 'galeria/index.html', $DKH);
t('grafiky: zmena hodín skryje obrázok hodín na Kontakte, tabuľka s novými hodinami ostane', $e === null && !str_contains($hk, '<picture') && !str_contains($hk, 'kontakt-hodiny') && str_contains($hk, '<table class="hours">') && str_contains($hk, '16:30'), (string)$e);
t('grafiky: zmena hodín skryje leták Prečo nakupovať, ostatné tri ostanú', !str_contains($gl, 'letak-preco-nakupovat') && substr_count($gl, '<figure') === 3 && str_contains($gl, 'letak-stavebniny-richtarik'));
t('grafiky: zmena hodín skryje tabuľu s otváracou dobou, vizitka a karta ostanú', !str_contains($gg, 'tabula-vysoka') && str_contains($gg, 'vizitka-n') && str_contains($gg, 'karta-n') && str_contains($gg, '11 obrázkov'));
t('grafiky: oznam k hodinám (sviatok) obrázok hodín neskryje', (function () use ($D, $obl) { $V = $D; $V['firma']['vynimky'] = [['od' => '2026-12-24', 'do' => '2026-12-26', 'zatvorene' => true, 'nazov' => 'Vianoce']];
  $h = $obl('hodiny-kontakt', 'kontakt.html', Zmena::sKonstantami($V)); return str_contains($h, 'kontakt-hodiny-288') && str_contains($h, 'Vianoce'); })());
// (b) zmena mobilu: tabuľa s kontaktom, vizitka, karta a leták so sortimentom zmiznú (aj obrázok Zavolajte nám – test vyššie)
[$M, $e] = Obsah::kontakt($D, ['mobil' => '0905 111 222', 'pevna' => $D['firma']['pevna'], 'email' => $D['firma']['email']]); $DKM = Zmena::sKonstantami($M);
$gl = $obl('galeria-letaky', 'letak.html', $DKM); $gg = $obl('galeria-grafika', 'galeria/index.html', $DKM);
t('grafiky: zmena mobilu skryje leták so sortimentom, leták Prečo nakupovať a bannery ostanú', $e === null && !str_contains($gl, 'letak-stavebniny-richtarik') && str_contains($gl, 'letak-preco-nakupovat') && substr_count($gl, '<figure') === 3, (string)$e);
t('grafiky: zmena mobilu skryje tabuľu s kontaktom, vizitku a kartu, logá a ilustrácie ostanú', !str_contains($gg, 'tabula-vysoka') && !str_contains($gg, 'vizitka') && !str_contains($gg, 'karta-n') && str_contains($gg, 'logo-rs-vodorovne') && str_contains($gg, 'tabula-siroka') && substr_count($gg, '<figure') === 9 && str_contains($gg, '9 obrázkov'));
t('grafiky: zmena mobilu obrázok hodín ani zliav neskryje', str_contains($obl('hodiny-kontakt', 'kontakt.html', $DKM), 'kontakt-hodiny-288') && str_contains($obl('sluzby-zlavy', 'sluzby.html', $DKM), 'zlavy-480'));
[$E, $e] = Obsah::kontakt($D, ['mobil' => $D['firma']['mobil'], 'pevna' => $D['firma']['pevna'], 'email' => 'predajna@stavebniny-test.sk']);
t('grafiky: zmena e-mailu skryje vizitku, kartu, tabuľu a leták so sortimentom', $e === null && substr_count($obl('galeria-grafika', 'galeria/index.html', Zmena::sKonstantami($E)), '<figure') === 9 && !str_contains($obl('galeria-letaky', 'letak.html', Zmena::sKonstantami($E)), 'letak-stavebniny-richtarik'), (string)$e);
t('grafiky: údaje obrázkov v konštantách zmena kontaktu nenahradí', Zmena::sKonstantami($M)['k']['grafika_udaje']['mobil'] === '0905622223' && Zmena::sKonstantami($E)['k']['grafika_udaje']['email'] === ['info', 'stavebninyrichtarik.sk']);
// (c) zľava bez 3,3 %: karta zliav na Službách bez obrázka, veta ostane
$Z = $D; $Z['cennik']['zlava'] = 'Zľava so zákazníckou kartou: 5 % pri platbe v hotovosti, 3 % pri platbe kartou. Cenník akcií ({datum}).';
$sz = $obl('sluzby-zlavy', 'sluzby.html', Zmena::sKonstantami($Z));
t('grafiky: zľava bez 3,3 % – karta zliav bez obrázka, veta a tlačidlo ostanú', !str_contains($sz, '<picture') && !str_contains($sz, ' ilu') && str_contains(str_replace("\u{a0}", ' ', $sz), '3 % pri platbe kartou') && str_contains($sz, 'href="akcie/index.html"'));
$Z['cennik']['zlava'] = 'Zľava so zákazníckou kartou: 15 % pri platbe v hotovosti, 3,3 % pri platbe kartou.';
t('grafiky: 15 % nie je 5 % (obrázok zliav sa neukáže)', !str_contains($obl('sluzby-zlavy', 'sluzby.html', Zmena::sKonstantami($Z)), '<picture'));
// (d) správa: nahradenie zruší podmienku, skrytie funguje aj na celý album grafiky
$al = fn(array $X, string $id) => array_values(array_filter($X['galeria']['albumy'], fn($a) => $a['id'] === $id))[0];
[$N, $e] = Obsah::galeria($M, 'nahradit', ['album' => 'grafika', 'foto' => 'vizitka'], ['foto' => nahraj("$VST/letak.jpg")]);
$nv = array_values(array_filter($al($N, 'grafika')['fotky'], fn($f) => str_starts_with($f['src'], 'img/s/')));
t('grafiky: nahradená vizitka nemá plati_pri, nechá si popis a je na webe aj s novým mobilom', $e === null && count($nv) === 1 && !isset($nv[0]['plati_pri']) && str_starts_with($nv[0]['popis'], 'Vizitka')
  && str_contains($obl('galeria-grafika', 'galeria/index.html', Zmena::sKonstantami($N)), $nv[0]['src']) && str_contains($obl('galeria-grafika', 'galeria/index.html', Zmena::sKonstantami($N)), '10 obrázkov'), (string)$e);
[$S, $e] = Obsah::galeria($D, 'skryt', ['album' => 'letaky', 'foto' => 'banner-super-ceny'], []);
t('grafiky: skrytý banner zmizne zo stránky Leták', $e === null && !str_contains($obl('galeria-letaky', 'letak.html', Zmena::sKonstantami($S)), 'banner-super-ceny') && substr_count($obl('galeria-letaky', 'letak.html', Zmena::sKonstantami($S)), '<figure') === 3, (string)$e);
foreach (['letak-preco-nakupovat', 'letak-stavebniny-richtarik', 'banner-kompletne-systemy'] as $fid) [$S, $e] = Obsah::galeria($S, 'skryt', ['album' => 'letaky', 'foto' => $fid], []);
t('grafiky: album letákov smie ostať prázdny, časť Letáky a bannery potom zmizne celá', $e === null && $obl('galeria-letaky', 'letak.html', Zmena::sKonstantami($S)) === '', (string)$e);
[$S2, $e] = Obsah::galeria($S, 'zobrazit', ['album' => 'letaky', 'foto' => 'banner-super-ceny'], []);
t('grafiky: zobrazený banner je späť aj s nadpisom', $e === null && str_contains($obl('galeria-letaky', 'letak.html', Zmena::sKonstantami($S2)), 'Letáky a bannery') && substr_count($obl('galeria-letaky', 'letak.html', Zmena::sKonstantami($S2)), '<figure') === 1, (string)$e);
$dv = $D; foreach ($al($D, 'dvor')['fotky'] as $f) [$dv, $e] = Obsah::galeria($dv, 'skryt', ['album' => 'dvor', 'foto' => $f['id']], []);
t('grafiky: v albume fotiek musí ostať aspoň jedna fotka (pravidlo platí ďalej)', $e !== null);
[$P, $e] = Obsah::galeria($D, 'popis', ['album' => 'grafika', 'foto' => 'tabula-vysoka', 'popis' => 'Tabuľa pri vchode do predajne'], []);
t('grafiky: zmena popisu podmienku nechá', $e === null && array_values(array_filter($al($P, 'grafika')['fotky'], fn($f) => $f['id'] === 'tabula-vysoka'))[0]['plati_pri'] === ['ulica', 'psc', 'pevna', 'mobil', 'email', 'hodiny'], (string)$e);
$w = file_get_contents("$WEB/kontakt.html") . file_get_contents("$WEB/letak.html") . file_get_contents("$WEB/galeria/index.html") . file_get_contents("$WEB/sluzby.html");
$chyba = []; preg_match_all('~img/(?:ilu|grafika)/[a-z0-9-]+\.(?:webp|avif)~', $w, $m); foreach (array_unique($m[0]) as $c) if (!is_file("$WEB/$c")) $chyba[] = $c;
t('grafiky: súbory obrázkov z Kontaktu, Letáku, Galérie a Služieb sú v balíku (' . count(array_unique($m[0])) . ')', !$chyba && count(array_unique($m[0])) >= 40, implode(' ', $chyba));

echo "Akcie: ceny, hlavička, úvod (S1, S2, S4, S5, D8)\n";
$D = Zmena::zive();
$i = Ulohy::index($D, 'cement-325-r'); $a = $D['akcie']['akcie'][$i];
$post = ['nazov' => $a['nazov'], 'stitok' => 'vlastny', 'stitok_vlastny' => $a['stitok'], 'karta' => $a['karta'], 'verzia' => $a['verzia'], 'na_uvode' => $a['na_uvode'] ? 1 : '',
         'hlavicka' => (string)$a['hlavicka'], 'katalog' => $a['katalog'], 'seo_h1' => $a['seo']['h1'], 'seo_titulok' => $a['seo']['titulok'], 'seo_popis' => $a['seo']['popis'],
         'ceny' => [['nadpis' => $a['ceny'][0]['nadpis'], 'poznamka' => '', 'r' => [['polozka' => 'Cement R 325, 25 kg', 'cena' => '4,59 €/vrece'], ['polozka' => 'Cement R 425, 25 kg', 'cena' => '5,18 €/vrece']]]]];
unset($_SESSION['nahrady']);
[$X, $e, $var] = Ulohy::akcia($D, 'cement-325-r', $post, []);
$b = $X['akcie']['akcie'][$i];
t('S1: zmenená cena nemá dátum starého cenníka', $e === null && $b['cennik'] === null && !empty($b['ceny_zadane']), (string)$e);
t('SK-1: ceny zadané v správe nemajú upozornenie „zo starého cenníka“', !Ulohy::cenyStarehoCennika($b, $X));
$st = $b; unset($st['ceny_zadane']); $st['cennik'] = 'neaktualny-test';
t('SK-1: ceny zo starého cenníka upozornenie majú', Ulohy::cenyStarehoCennika($st, $X));
$h = Vykreslenie::vykresli('akcia-telo', $b['stranka'], Zmena::sKonstantami($X));
t('S1: nad cenami „Akciové ceny (zadané …)“', str_contains(str_replace("\u{a0}", ' ', $h), 'Akciové ceny (zadané ') && str_contains(str_replace("\u{a0}", ' ', $h), '4,59 €/vrece'));
t('S2: ponuka nahradiť starú cenu vo všetkých poliach', ($_SESSION['nahrady']['pary'][0]['stara'] ?? '') === '4,42' && count($_SESSION['nahrady']['pary'][0]['kde']) >= 3);
t('S2: upozornenie na fotku letáku', (bool)array_filter($var, fn($x) => str_contains($x, 'fotke letáku')));
[$Y, $e] = Ulohy::nahradCeny($X, 'cement-325-r', $_SESSION['nahrady']['pary']);
$c = $Y['akcie']['akcie'][$i];
t('S2: stará cena nahradená v texte, štítku a textoch pre Google', $e === null && !str_contains($c['karta'] . $c['stitok'] . $c['seo']['h1'] . $c['seo']['popis'], '4,42') && str_contains($c['karta'], '4,59'), (string)$e);
$nova = ['nazov' => 'Skúšobná akcia profily', 'stitok' => 'Znížené ceny', 'karta' => 'Profily na sadrokartón za znížené ceny priamo zo skladu v Nitre, ceny s DPH.', 'na_uvode' => 1];
[$X, $e, $var, $aid] = Ulohy::akcia($D, null, $nova, []);
$k = Ulohy::index($X, $aid);
t('S5: nová akcia bez výberu nemá cudziu hlavičkovú fotku', $e === null && $X['akcie']['akcie'][$k]['hlavicka'] === null, (string)$e);
$ust = array_values(array_filter($X['akcie']['akcie'], fn($x) => ($x['ustupila_pre'] ?? null) === $aid));
[$Y, $e, $var] = Ulohy::viditelnost($X, $aid, false);
$v = $ust ? $Y['akcie']['akcie'][Ulohy::index($Y, $ust[0]['id'])] : null;
t('S4: po skrytí sa na úvod vráti akcia, ktorá ustúpila', $ust && $v['na_uvode'] && (bool)array_filter($var, fn($x) => str_contains($x, 'vráti')));
[$X, $e] = Ulohy::akcia($D, null, $nova + ['nazov' => 'x'], []);
t('S7: názov nad 45 znakov sa neoreže', str_contains((string)Ulohy::akcia($D, null, ['nazov' => 'Veľká jesenná akcia na všetky sadrokartónové dosky a profily Rigips'] + $nova, [])[1], 'teraz má 67'));
t('D4: zariadenie zrozumiteľne', Ui::zariadenie('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1') === 'iPhone – Safari'
   && Ui::zariadenie('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36') === 'Počítač Windows – Chrome');

echo "\nSpolu: $ok v poriadku, $zle zlých\n";
exit($zle ? 1 : 0);
