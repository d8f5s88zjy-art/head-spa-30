<?php
/* Testy jednotiek správy webu Barbershop 30 (plný balík pre www.barbershop30.sk). Bežia z príkazového riadka nad kópiou
 * zostaveného balíka (bez veľkých súborov webu a bez knižnice asistenta), nič neposielajú von.
 *   php barbershop-sprava/testy/jednotky.php <NAHRAT-NA-HOSTING> [<dočasný priečinok>] [<port pre php -S, predvolene 9543>]
 * Spúšťa ich testy/spusti.sh. */
[$ja, $BALIK, $TMP, $PORT] = $argv + [null, null, sys_get_temp_dir(), 9543];
if (!$BALIK || !is_file("$BALIK/sprava/index.php")) { fwrite(STDERR, "použitie: php jednotky.php <NAHRAT-NA-HOSTING> [dočasný priečinok] [port]\n"); exit(2); }
$T = rtrim((string) $TMP, '/') . '/b30-jednotky-' . bin2hex(random_bytes(4));
$ok = 0; $zle = 0;
function over($podm, string $popis, string $detail = ''): void { global $ok, $zle; if ($podm) { $ok++; echo "OK   $popis\n"; } else { $zle++; echo "FAIL $popis" . ($detail !== '' ? "  $detail" : '') . "\n"; } }
function kopia(string $z, string $do, array $vynechaj): void {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($z, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
    foreach ($it as $f) {
        $rel = substr($f->getPathname(), strlen($z) + 1);
        foreach ($vynechaj as $v) if (str_starts_with($rel, $v)) continue 2;
        if ($f->isDir()) @mkdir("$do/$rel", 0755, true); else { @mkdir(dirname("$do/$rel"), 0755, true); copy($f->getPathname(), "$do/$rel"); }
    }
}
function zmaz(string $d): void { if (!is_dir($d)) { @unlink($d); return; } foreach (scandir($d) as $f) if ($f !== '.' && $f !== '..') zmaz("$d/$f"); @rmdir($d); }
function novyWeb(string $meno): string {
    global $T, $BALIK;
    $w = "$T/$meno/web"; mkdir($w, 0755, true);
    kopia($BALIK, $w, ['assets/video', 'assets/seq', 'assets/audio', 'assets/fonts', 'assets/vendor', 'assets/img/', 'asistent/vendor']);
    @mkdir("$w/assets/img", 0755, true);
    return $w;
}
$hlavny = getmypid();
register_shutdown_function(function () use ($T, $hlavny) { if (getmypid() === $hlavny) zmaz($T); });

$W = novyWeb('a');
define('B30S', 1);
require "$W/sprava/jadro/autoload.php";
date_default_timezone_set('Europe/Bratislava');
$_SERVER['REMOTE_ADDR'] = '203.0.113.7';

/* ---------- Miesto ---------- */
echo "Miesto\n";
Miesto::prePokus($W);
over(Miesto::init(false) === false && !is_dir("$T/a/barbershop30-udaje"), 'bez zakladania: priečinok údajov nevznikne');
over(Miesto::init(true) && Miesto::$udaje === realpath("$T/a/barbershop30-udaje") && !Miesto::$voWebe, '1. voľba: priečinok nad koreňom webu');
over(is_file(Miesto::u('.htaccess')) && is_file(Miesto::u('web.config')) && is_file(Miesto::u('relacie/index.html')) && (fileperms(Miesto::u()) & 0777) === 0700, 'ochranné súbory a práva 0700');
$W2 = novyWeb('b');
Miesto::prePokus($W2, true);
over(Miesto::init(false) === false, 'vnútri webu, bez zakladania: nič');
// súbeh: šesť prvých požiadaviek naraz založí jediný priečinok
$deti = [];
for ($i = 0; $i < 6; $i++) { $pid = pcntl_fork(); if ($pid === 0) { Miesto::prePokus($W2, true); Miesto::init(true); exit(0); } $deti[] = $pid; }
foreach ($deti as $pid) pcntl_waitpid($pid, $st);
$dirs = glob("$W2/b30-udaje-*", GLOB_ONLYDIR);
over(count($dirs) === 1 && preg_match('#/b30-udaje-[0-9a-f]{32}$#', $dirs[0]), '3. voľba: súbeh prvých požiadaviek založí jediný priečinok s náhodným menom', implode(', ', array_map('basename', $dirs)));
Miesto::prePokus($W2, true);
over(Miesto::init(true) && Miesto::$udaje === realpath($dirs[0]) && Miesto::$voWebe, '2. voľba: existujúci priečinok vo webe sa použije znova');
mkdir("$W2/b30-udaje-podvrh"); Miesto::prePokus($W2, true); Miesto::init(true);
over(Miesto::$udaje === realpath($dirs[0]), 'priečinok s iným tvarom mena sa nepoužije');
over(Miesto::zaklad() === 'https://www.barbershop30.sk/' && Miesto::povod() === 'https://www.barbershop30.sk', 'adresa webu je z ciel.json, nie z požiadavky');
Miesto::prePokus($W); Miesto::init(true);

/* ---------- Ulozisko ---------- */
echo "Ulozisko\n";
Ulozisko::zapisUdaje(Miesto::u('skuska.php'), ['tajne' => 'hodnota-123']);
over(Ulozisko::citaj(Miesto::u('skuska.php'))['tajne'] === 'hodnota-123' && (fileperms(Miesto::u('skuska.php')) & 0777) === 0600, 'súbor údajov: zápis, čítanie, práva 0600');
over(trim((string) shell_exec('php ' . escapeshellarg(Miesto::u('skuska.php')))) === '', 'súbor údajov spustený priamo nič nevypíše');
over(!glob(Miesto::u('skuska.php.tmp-*')), 'atómový zápis nenechá dočasný súbor');
$z1 = Ulozisko::zamok(Miesto::u('zamok-skuska')); $z2 = Ulozisko::zamok(Miesto::u('zamok-skuska'));
over($z1 && $z2 === null, 'zámok: druhý záujemca ho nedostane'); Ulozisko::odomkni($z1);
$z3 = Ulozisko::zamok(Miesto::u('zamok-skuska')); over((bool) $z3, 'zámok: po odomknutí voľný'); Ulozisko::odomkni($z3);
unlink(Miesto::u('skuska.php'));

/* ---------- Pristup ---------- */
echo "Pristup\n";
over(Pristup::maUcet() === false && Pristup::vytvorKod('obnova') !== null, 'bez účtu sa dá vytvoriť len prvý kód');
over(Pristup::vytvorKod('prvy') === null && is_file(Miesto::u('PRVY-KOD.txt')), 'prvý kód vytvorený v súbore');
$kod = preg_match('/Kód: ([A-Z0-9-]+)/', file_get_contents(Miesto::u('PRVY-KOD.txt')), $m) ? $m[1] : '';
over(strlen(Pristup::normalizujKod($kod)) === 16 && !str_contains(file_get_contents(Miesto::u('pristup.php')), Pristup::normalizujKod($kod)), 'kód má 16 znakov, v údajoch je len odtlačok');
for ($i = 0; $i < 5; $i++) Pristup::overKod('prvy', 'AAAABBBBCCCCDDD' . $i);
over(Pristup::overKod('prvy', $kod) === false, 'po 5 zlých pokusoch z jednej adresy neprejde ani správny kód');
$_SERVER['REMOTE_ADDR'] = '203.0.113.8';
over(Pristup::stavKodu()['platne'] === true, 'z inej adresy kód stále platí (cudzí človek ho majiteľovi nespáli)');
over(str_contains((string) Pristup::vytvorKod('prvy'), '') && Pristup::vytvorKod('prvy') === null, 'platný kód sa nevymieňa');
$_SERVER['REMOTE_ADDR'] = '203.0.113.7';
over(str_contains((string) Pristup::vytvorKod('prvy'), 'najskôr o'), 'nový kód skôr než o 15 minút len po zmazaní súboru');
unlink(Miesto::u('PRVY-KOD.txt'));
over(Pristup::overKod('prvy', $kod) === false, 'bez súboru kód neplatí');
over(Pristup::vytvorKod('prvy') === null, 'po zmazaní súboru cez FTP je nový kód hneď');
$kod = preg_match('/Kód: ([A-Z0-9-]+)/', file_get_contents(Miesto::u('PRVY-KOD.txt')), $m) ? $m[1] : '';
Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) { $n['kod']['pokusy'] = 200; return $n; });
over(Pristup::overKod('prvy', $kod) === false, 'po 200 pokusoch spolu kód neplatí');
Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) { $n['kod']['pokusy'] = 0; $n['kod']['cas'] = time() - 86401; return $n; });
over(Pristup::overKod('prvy', $kod) === false, 'po 24 hodinách kód neplatí');
Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) { $n['kod']['cas'] = time(); return $n; });
over(Pristup::overKod('prvy', strtolower(str_replace('-', ' ', $kod))) === true && !is_file(Miesto::u('PRVY-KOD.txt')), 'správny kód (aj malými písmenami a s medzerami) prejde, súbor sa zmaže');
over(Pristup::overKod('prvy', $kod) === false, 'kód je jednorazový');
foreach ([['kratke', 'kratke'], ['barbershop-heslo', 'barbershop-heslo'], ['heslo12345', 'heslo12345'], ['aaaaaaaaaaaa', 'aaaaaaaaaaaa'], ['nitranitra', 'nitranitra'], ['lajko-je-tu-doma', 'lajko-je-tu-doma'], ['dobre-heslo-tri', 'ine-heslo-tri-x']] as [$a, $b]) over(Pristup::chybaHesla($a, $b, 'Lajko') !== null, "slabé alebo nezhodné heslo odmietnuté: $a");
over(Pristup::chybaHesla('noznice-hreben-mostna', 'noznice-hreben-mostna', 'Lajko') === null && Pristup::chybaMena('L') !== null && Pristup::chybaMena('Lajko') === null, 'dobré heslo a meno prejdú');
Pristup::nastavUcet('Lajko', 'noznice-hreben-mostna', false);
$ucty = file_get_contents(Miesto::u('ucty.php'));
over(Pristup::maUcet() && !str_contains($ucty, 'noznice') && preg_match('/\$(argon2id|2y)\$/', $ucty), 'účet: heslo len ako odtlačok');
over(Pristup::overHeslo('lajko', 'noznice-hreben-mostna') && !Pristup::overHeslo('Lajko', 'zle') && !Pristup::overHeslo('niekto', 'noznice-hreben-mostna'), 'prihlásenie: meno bez ohľadu na veľkosť písmen, zlé heslo a neznáme meno nie');
over(Pristup::vytvorKod('prvy') !== null, 'po vytvorení účtu sa prvý kód už vytvoriť nedá');
for ($i = 0; $i < 4; $i++) { over(Pristup::zacniPokus() === null, 'pokus ' . ($i + 1) . ' sa smie overiť'); Pristup::zlyPokus(); }
over(Pristup::blokovane() === null, '4 zlé pokusy: ešte bez zámku');
over(Pristup::zacniPokus() === null, 'piaty pokus sa ešte overí (započítaný pred overením hesla)'); Pristup::zlyPokus();
over(Pristup::blokovane() !== null && Pristup::zacniPokus() !== null, '5 zlých pokusov z adresy: zámok, šiesty sa už vôbec neoveruje (D-2: počítadlo pred overením)');
$_SERVER['REMOTE_ADDR'] = '2001:db8:1:2:aaaa::1'; $a1 = Pristup::odtlacokIp(); $_SERVER['REMOTE_ADDR'] = '2001:db8:1:2:bbbb::9'; $a2 = Pristup::odtlacokIp(); $_SERVER['REMOTE_ADDR'] = '2001:db8:1:3::1'; $a3 = Pristup::odtlacokIp();
over($a1 === $a2 && $a1 !== $a3 && Pristup::blokovane() === null, 'IPv6 sa počíta po /64; iná adresa nie je zamknutá');
$_SERVER['REMOTE_ADDR'] = '203.0.113.7';
over(Pristup::dobryPokus() === 5 && Pristup::blokovane() === null, 'úspešné prihlásenie zámok zruší a vráti počet zlých pokusov');
$_SERVER['REQUEST_METHOD'] = 'POST'; $_SESSION = ['csrf' => 'abc123']; $_POST = ['_t' => 'abc123'];
$_SERVER['HTTP_ORIGIN'] = 'https://www.barbershop30.sk'; $s1 = Pristup::overPost();
$_SERVER['HTTP_ORIGIN'] = 'https://zly.example'; $s2 = Pristup::overPost();
$_SERVER['HTTP_ORIGIN'] = 'null'; $s2b = Pristup::overPost();
$_SERVER['HTTP_ORIGIN'] = 'https://www.barbershop30.sk'; $_SERVER['HTTP_HOST'] = 'zly.example'; $s3 = Pristup::overPost();
$_POST = ['_t' => 'zly']; $s4 = Pristup::overPost();
$_POST = ['_t' => 'abc123']; $_SERVER['HTTP_SEC_FETCH_SITE'] = 'cross-site'; $s5 = Pristup::overPost(); unset($_SERVER['HTTP_SEC_FETCH_SITE']);
over($s1 && !$s2 && !$s2b && $s3 && !$s4 && !$s5, 'CSRF a pôvod: vlastný pôvod s tokenom áno; cudzí pôvod, null, zlý token, cross-site nie; hlavička Host nerozhoduje');
$_SERVER['HTTP_X_B30_CSRF'] = 'abc123'; $x1 = Pristup::overApi(); $_SERVER['HTTP_X_B30_CSRF'] = ''; $x2 = Pristup::overApi();
over($x1 && !$x2, 'api: token v hlavičke X-B30-CSRF');
$_SESSION = []; $_POST = []; unset($_SERVER['HTTP_ORIGIN'], $_SERVER['HTTP_HOST'], $_SERVER['REQUEST_METHOD']);

/* ---------- Mapa a pravidlo kódu ---------- */
echo "Mapa\n";
foreach (['../index.php', 'barbershop-30/../index.php', '/etc/passwd', "barbershop-30/index.html\0.php", 'Barbershop-30/index.html', 'barbershop-30/INDEX.HTML', 'index.php', '.htaccess', 'sprava/jadro/Pristup.php', 'asistent/lib/kalendar.php', 'vernost/api/index.php', 'barbershop-30/assets/film.js', 'barbershop-30/assets/img/x.php', 'barbershop-30\\index.html', 'CLAUDE.md'] as $c)
    over(Mapa::zdroj($c) === null && Mapa::kontrola($c, 'x') !== null && Mapa::fotka($c) === null, 'cesta mimo tabuľky odmietnutá: ' . addcslashes($c, "\0"));
$php = array_keys(array_filter(Mapa::tabulka(), fn($z, $c) => str_ends_with($c, '.php'), ARRAY_FILTER_USE_BOTH));
sort($php);
over($php === ['asistent/api.php', 'asistent/lib/jadro.php', 'vernost/lib/jadro.php'], 'v tabuľke sú len tri súbory .php, všetky s pravidlom kódu', implode(', ', $php));
over(!array_filter(Mapa::tabulka(), fn($z, $c) => preg_match('/\.(php|js)$/', $c) && $z[1] !== 'kod', ARRAY_FILTER_USE_BOTH), 'každý súbor .js a .php má pravidlo kódu');
over(Mapa::kontrola('barbershop-30/rezervacia.html', '<html><?php echo 1; ?></html>') !== null && Mapa::kontrola('barbershop-30/rezervacia.html', '<html><?= 1 ?></html>') !== null, 'značka programu v HTML odmietnutá');
over(Mapa::kontrola('barbershop-30/assets/i18n/en.json', '{zle') !== null && Mapa::kontrola('barbershop-30/assets/i18n/en.json', '{"a":"b"}') === null, 'neplatný JSON odmietnutý, platný prijatý');
over(Mapa::kontrola('barbershop-30/404.html', '<html></html>') !== null, 'súbor len na čítanie sa nedá uložiť');
over(Mapa::kontrola('barbershop-30/index.html', '<html>krátke</html>') !== null, 'podozrivo krátka stránka odmietnutá');
over(Mapa::fotka('barbershop-30/assets/img/tim-adrian-abc123-480.webp') === 'assets/img/tim-adrian-abc123-480.webp' && Mapa::fotka('barbershop-30/assets/img/x-480.svg') === null && Mapa::fotka('barbershop-30/assets/img/sub/x-480.jpg') === null && Mapa::fotka('barbershop-30/assets/img/x.jpg') === null, 'fotka: len meno podľa vzoru, WebP alebo JPEG, priamo v assets/img');
$app = file_get_contents("$W/assets/app.js"); $api = file_get_contents("$W/asistent/api.php");
$tel = str_replace(['0951 267 203', '+421951267203', '+421 951 267 203'], ['0911 222 333', '+421911222333', '+421 911 222 333'], $api);
over($tel !== $api && Mapa::kodOk($api, $tel), 'pravidlo kódu: zmena telefónu v asistent/api.php prejde');
$hod = preg_replace('/const HOURS = \{[^}]*\};/', 'const HOURS = { 1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 20], 6: [8, 12], 0: null };', $app);
over($hod !== $app && Mapa::kodOk($app, $hod), 'pravidlo kódu: zmena hodín v app.js prejde');
over(Mapa::kodOk("a 'info@barbershop30.sk' b", "a 'recepcia@salon-nitra.sk' b"), 'pravidlo kódu: zmena e‑mailu prejde');
// D-3: v PHP sa číslice smú meniť len v textoch, nie v číselných hodnotách (limity a stropy asistenta)
$jad = file_get_contents("$W/asistent/lib/jadro.php");
over(Mapa::kodOk($api, $tel, true) && Mapa::kontrola('asistent/api.php', $tel, $api) === null, 'pravidlo kódu PHP: telefón v texte asistent/api.php prejde');
over(Mapa::kontrola('asistent/api.php', str_replace('$kolo < 3', '$kolo < 300', $api), $api) !== null && Mapa::kontrola('asistent/api.php', str_replace('?? 1500)))', '?? 64000)))', $api), $api) !== null
     && Mapa::kontrola('asistent/lib/jadro.php', str_replace([', 600, ', ', 86400, '], [', 0, ', ', 0, '], $jad), $jad) !== null, 'pravidlo kódu PHP: okná limitov, max_tokens a počet kôl sa zmeniť nedajú');
foreach (['pridaný znak' => $api . 'x', 'pridaný riadok' => $api . "\nsystem(\$_GET['x']);", 'úvodzovka' => str_replace('0951 267 203', "0951' . phpinfo() . '267 203", $api), 'bodkočiarka' => str_replace('0951 267 203', '0951; 267 203', $api),
          'e‑mail s úvodzovkou' => "a 'x\"@b.sk' b", 'číslica v mene funkcie' => str_replace('sha256', 'sha1', "hash('sha256', \$x)"), 'zápis znaku' => 'echo "\x41";#\x42', 'odstránený riadok' => substr($api, 0, -40)] as $popis => $novy) {
    $stary = match ($popis) { 'e‑mail s úvodzovkou' => "a 'info@barbershop30.sk' b", 'číslica v mene funkcie' => "hash('sha256', \$x)", 'zápis znaku' => 'echo "\x41";#\x41', default => $api };
    over(!Mapa::kodOk($stary, $novy), "pravidlo kódu: neprejde $popis");
}

/* ---------- Fotky ---------- */
echo "Fotky\n";
$im = imagecreatetruecolor(640, 800); imagefill($im, 0, 0, imagecolorallocate($im, 120, 70, 40));
ob_start(); imagejpeg($im, null, 90); $jpg = ob_get_clean(); ob_start(); imagepng($im); $png = ob_get_clean(); ob_start(); imagewebp($im, null, 80); $webp = ob_get_clean(); ob_start(); imagegif($im); $gif = ob_get_clean();
// JPEG s EXIF (GPS) a komentárom: po prekódovaní nesmú ostať
$exif = "\xFF\xD8\xFF\xE1\x00\x1EExif\x00\x00II*\x00\x08\x00\x00\x00\x00\x00GPS-48.3-18.08\xFF\xFE\x00\x12tajna-poznamka!!" . substr($jpg, 2);
foreach (['JPEG' => [$jpg, 'a-480.webp'], 'PNG' => [$png, 'b-480.jpg'], 'WebP' => [$webp, 'c-480.webp'], 'JPEG s EXIF' => [$exif, 'd-480.jpg']] as $druh => [$b, $meno]) {
    $r = Fotky::prijmi("barbershop-30/assets/img/$meno", $b);
    $f = isset($r['znacka']) ? Fotky::cakajuca($r['znacka']) : null;
    $von = $f ? file_get_contents($f[1]) : '';
    $typ = $von !== '' ? getimagesizefromstring($von)[2] : 0;
    over($f && $typ === (str_ends_with($meno, '.webp') ? IMAGETYPE_WEBP : IMAGETYPE_JPEG) && !str_contains($von, 'GPS-48') && !str_contains($von, 'tajna-poznamka') && !str_contains($von, 'Exif'), "$druh sa prekóduje na " . pathinfo($meno, PATHINFO_EXTENSION) . ' bez metadát', $r['chyba'] ?? '');
}
$velky = imagecreatetruecolor(4200, 100); ob_start(); imagejpeg($velky, null, 50); $velkyJpg = ob_get_clean();
foreach (['SVG' => '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'GIF' => $gif, 'PHP s hlavičkou JPEG' => "\xFF\xD8\xFF\xE0<?php system(\$_GET[1]); ?>", 'PHP s hlavičkou GIF' => 'GIF89a<?php phpinfo(); ?>', 'PDF' => "%PDF-1.4\n", 'priveľký obrázok' => $velkyJpg, 'prázdny súbor' => ''] as $druh => $b)
    over(isset(Fotky::prijmi('barbershop-30/assets/img/zly-480.jpg', $b)['chyba']), "odmietnuté: $druh");
over(isset(Fotky::prijmi('barbershop-30/assets/app.js', $jpg)['chyba']) && isset(Fotky::prijmi('barbershop-30/assets/img/../x-480.jpg', $jpg)['chyba']) && isset(Fotky::prijmi('sprava/x-480.jpg', $jpg)['chyba']), 'fotka s menom mimo vzoru odmietnutá');
over(Fotky::cakajuca('../../tajne') === null && Fotky::cakajuca(str_repeat('0', 32)) === null, 'značka fotky: len 32 hex znakov a len existujúca');

/* ---------- Prepinace ---------- */
echo "Prepinace\n";
$A = 'https://www.barbershop30.sk/asistent/api.php';
foreach (['index.html' => false, 'en/index.html' => true] as $s => $en) {
    $h0 = file_get_contents("$W/$s");
    over(Prepinace::hlavaOk($h0, $en) && !Prepinace::hlavaOk($h0, !$en), "$s: hlavička a značka skriptu nájdené presne raz");
    $vsetky = true;
    foreach ([0, 1] as $a) foreach ([0, 1] as $o) foreach ([0, 1] as $v) {
        $stav = ['asistent' => $a ? $A : '', 'objednavka' => $o ? $A : '', 'vernost' => (bool) $v];
        $h = Prepinace::nastav($h0, $stav);
        $vsetky = $vsetky && Prepinace::precitaj($h) === $stav && Prepinace::nastav($h, $stav) === $h && Prepinace::nastav($h, ['asistent' => '', 'objednavka' => '', 'vernost' => false]) === $h0
            && substr_count($h, 'data-asistent=') === $a && substr_count($h, ' data-objednavka=') === $o && Prepinace::hlavaOk($h, $en);
    }
    over($vsetky, "$s: všetkých 8 kombinácií, idempotentne a späť na pôvodný súbor bajt po bajte");
}
$zdroj = file_get_contents("$W/sprava/semeno/barbershop-30/index.html.txt");
$nezm = str_replace('<script src="assets/vernost.js" data-prevadzka="barbershop"', '<script src="assets/vernost.js" data-prevadzka="barbershop" data-api="/vernost/api/"', $zdroj);
$h = Prepinace::nastav($nezm, ['asistent' => $A, 'objednavka' => '', 'vernost' => true]);
over(Prepinace::precitaj($h) === ['asistent' => $A, 'objednavka' => '', 'vernost' => true] && substr_count($h, '<html') === substr_count($nezm, '<html'), 'nezmenšené HTML s komentármi: mení sa len prvá značka <html> a značka skriptu');
$zle1 = false; try { Prepinace::nastav('<p>bez hlavičky</p>', ['asistent' => $A]); } catch (Throwable $e) { $zle1 = true; }
$zle2 = false; try { Prepinace::nastav(str_replace('</body>', '<script src="assets/vernost.js" data-prevadzka="barbershop" data-api="/x/"></script></body>', $nezm), ['vernost' => true]); } catch (Throwable $e) { $zle2 = true; }
over($zle1 && $zle2, 'bez hlavičky alebo s dvoma značkami skriptu nič nezapíše a ohlási chybu');
$pred = file_get_contents("$W/index.html");
$r = Prepinace::zapis(['asistent' => $A, 'objednavka' => $A, 'vernost' => true]);
over($r['zmenene'] === ['index.html', 'en/index.html'] && !$r['chyby'] && Prepinace::zapis(['asistent' => $A, 'objednavka' => $A, 'vernost' => true])['zmenene'] === [], 'zápis do oboch stránok, druhý zápis už nič nemení');
Prepinace::zapis(['asistent' => '', 'objednavka' => '', 'vernost' => false]);
over(file_get_contents("$W/index.html") === $pred, 'vypnutie vráti súbor bajt po bajte');

/* ---------- Zmena ---------- */
echo "Zmena\n";
$P = 'barbershop-30/';
$uprav = fn(string $t, string $slovo) => preg_replace('/(<h1[^>]*>.*?)(<\/h1>)/s', '$1 ' . $slovo . '$2', $t, 1);
$stavWebu = fn() => [md5_file("$W/index.html"), md5_file("$W/en/index.html"), md5_file("$W/assets/i18n/en.json")];
$v0 = Zmena::verzia(); $w0 = $stavWebu();
Prepinace::zapis(['asistent' => $A, 'objednavka' => '', 'vernost' => true]);
$w0 = $stavWebu();
$ulozenie = fn(string $slovo, ?string $verzia = null) => Zmena::uloz(['verzia' => $verzia ?? Zmena::verzia(), 'sprava' => "skúška $slovo", 'zmeny' => ["Text: $slovo"],
    'subory' => [$P . 'index.html' => $uprav(Zmena::citajZdroj($P . 'index.html'), $slovo)],
    'verejne' => ['index.html' => Prepinace::nastav($uprav(file_get_contents("$W/index.html"), $slovo), []), 'en/index.html' => Prepinace::nastav($uprav(file_get_contents("$W/en/index.html"), $slovo), [])]], 'Lajko');
$r1 = $ulozenie('PRVE');
over($r1['ok'] && $r1['verzia'] !== $v0 && str_contains(file_get_contents("$W/index.html"), ' PRVE</h1>') && str_contains(file_get_contents("$W/en/index.html"), ' PRVE</h1>') && str_contains(Zmena::citajZdroj($P . 'index.html'), ' PRVE</h1>'), 'uloženie: zdroj aj obe verejné stránky zmenené', $r1['chyba'] ?? '');
over(Prepinace::precitaj(file_get_contents("$W/index.html")) === ['asistent' => $A, 'objednavka' => '', 'vernost' => true] && Prepinace::precitaj(file_get_contents("$W/en/index.html"))['vernost'] === true, 'uloženie: prepínače z webu sa preniesli do novej stránky');
$z = glob(Miesto::u('zalohy/*'), GLOB_ONLYDIR);
over(count($z) === 1 && md5_file($z[0] . '/web/index.html') === $w0[0] && md5_file($z[0] . '/web/en/index.html') === $w0[1] && json_decode(file_get_contents($z[0] . '/plan.json'), true)['stav'] === 'hotove', 'záloha: doterajšie verejné stránky a hotový plán');
over(!is_file("$W/sprava/semeno/barbershop-30/index.html") && md5_file("$W/sprava/semeno/barbershop-30/index.html.txt") === md5($zdroj), 'pôvodné súbory balíka (semeno) sa nemenia');
$stare = $ulozenie('STARE', $v0);
over(!$stare['ok'] && ($stare['kod'] ?? 0) === 409 && !empty($stare['stale']) && !str_contains(file_get_contents("$W/index.html"), 'STARE'), 'uloženie zo starej verzie: 409, nič sa nezmení');
$w1 = $stavWebu();
$r2 = $ulozenie('DRUHE'); $w2 = $stavWebu();
$s = Zmena::spat('Lajko');
over($r2['ok'] && $s['ok'] && !$s['spat_spat'] && $stavWebu() === $w1 && !str_contains(Zmena::citajZdroj($P . 'index.html'), 'DRUHE') && str_contains(Zmena::citajZdroj($P . 'index.html'), 'PRVE'), 'krok späť: web aj zdroj ako pred posledným uložením', $s['chyba'] ?? '');
$s = Zmena::spat('Lajko');
over($s['ok'] && $s['spat_spat'] && $stavWebu() === $w2 && str_contains(Zmena::citajZdroj($P . 'index.html'), 'DRUHE'), 'krok späť späť: znova stav po poslednom uložení');
$s = Zmena::spat('Lajko');
over($s['ok'] && !$s['spat_spat'] && $stavWebu() === $w1, 'ďalší krok späť vráti to isté uloženie znova');
$s = Zmena::spat('Lajko');
over($s['ok'] && $s['spat_spat'] && $stavWebu() === $w2, 'krok späť je jedna úroveň: ďalšie ťuknutie vráti krok späť (stav po poslednom uložení)');
over(count(array_filter(Zmena::historia(30), fn($x) => $x['typ'] === 'spat')) === 4 && Zmena::daSaVratit() !== null, 'história drží uloženia aj kroky späť');
// prerušenie medzi dvoma premenovaniami: ďalšia požiadavka vráti stav zo zálohy
$pred = $stavWebu(); $vPred = Zmena::verzia();
Ulozisko::resetPocitadla(); Ulozisko::$zlyhajPri = 4; $padlo = false;
try { $ulozenie('PRERUSENE'); } catch (Throwable $e) { $padlo = true; }
Ulozisko::$zlyhajPri = 0;
$rozbite = $stavWebu() !== $pred || Zmena::verzia() !== $vPred;
$obnova = Zmena::obnovPrerusene();
over($padlo && $rozbite && $obnova && $stavWebu() === $pred && Zmena::verzia() === $vPred && !Zmena::obnovPrerusene(), 'prerušený zápis: stav sa vráti zo zálohy (web aj zdroj), druhá obnova už nič nerobí', json_encode([$padlo, $rozbite, $obnova, $stavWebu() === $pred]));
foreach ([['subory' => ['index.php' => '<?php']], ['subory' => [$P . 'assets/app.js' => $app . "\nalert(1)"]], ['subory' => [$P . 'index.html' => $uprav($zdroj, 'X')]], ['verejne' => ['index.html' => str_replace('www.barbershop30.sk', 'zly.example', file_get_contents("$W/index.html"))]], ['verejne' => ['asistent/api.php' => '<?php']], ['fotky' => [$P . 'assets/img/x-480.jpg' => str_repeat('a', 32)]], ['subory' => []]] as $i => $telo) {
    $r = Zmena::uloz(['verzia' => Zmena::verzia(), 'sprava' => 'x'] + $telo, 'Lajko');
    over(!$r['ok'] && $r['kod'] === 400, 'neplatné uloženie odmietnuté (' . ($i + 1) . '): ' . mb_substr($r['chyba'], 0, 70));
}
over($stavWebu() === $pred && Zmena::verzia() === $vPred, 'po odmietnutých uloženiach je web bez zmeny');
// fotka: nahratie, uloženie, existujúca sa neprepíše, krok späť ju nemaže
$f = Fotky::prijmi($P . 'assets/img/tim-novy-abc-480.webp', $jpg);
$r = Zmena::uloz(['verzia' => Zmena::verzia(), 'zmeny' => ['Tím: nová fotka'], 'fotky' => [$P . 'assets/img/tim-novy-abc-480.webp' => $f['znacka']], 'subory' => [$P . 'assets/barbershop30.vcf' => Zmena::citajZdroj($P . 'assets/barbershop30.vcf') . "NOTE:skúška\r\n"]], 'Lajko');
over($r['ok'] && is_file("$W/assets/img/tim-novy-abc-480.webp") && Fotky::cakajuca($f['znacka']) === null && str_contains(file_get_contents("$W/assets/barbershop30.vcf"), 'NOTE:skúška'), 'fotka a vizitka uložené na web');
over(isset(Fotky::prijmi($P . 'assets/img/tim-novy-abc-480.webp', $jpg)['chyba']), 'existujúca fotka sa neprepíše');
Zmena::spat('Lajko');
over(is_file("$W/assets/img/tim-novy-abc-480.webp") && !str_contains(file_get_contents("$W/assets/barbershop30.vcf"), 'NOTE:skúška'), 'krok späť vráti súbory, novú fotku nemaže');

/* ---------- Export ---------- */
echo "Export\n";
Ulozisko::zapisUdaje(Miesto::u('tajne.php'), ['kluc' => 'TAJNY-KLUC-SKUSKA', 'vernost_hash' => password_hash('recepcia-skuska', PASSWORD_DEFAULT), 'sol' => 'sol']);
$zip = Export::vytvor(); $za = new ZipArchive(); $za->open($zip);
$mena = []; $vsetko = '';
for ($i = 0; $i < $za->numFiles; $i++) { $mena[] = $za->getNameIndex($i); $vsetko .= $za->getFromIndex($i); }
sort($mena);
over($mena === ['BALIK.txt', 'ZMENY.json', $P . 'assets/img/tim-novy-abc-480.webp', $P . 'index.html'], 'export: len súbory zdroja líšiace sa od balíka, nové fotky, BALIK.txt a ZMENY.json', implode(', ', $mena));
$zm = $za->getFromName('ZMENY.json') . $za->getFromName('BALIK.txt');
over(!str_contains($vsetko, 'TAJNY-KLUC-SKUSKA') && !str_contains($vsetko, '$2y$') && !str_contains($zm, 'Lajko') && !str_contains($zm, '"kto"') && !str_contains($vsetko, '203.0.113') && str_contains($zm, 'commit: ') && str_contains($zm, 'Text: PRVE'), 'export: bez tajomstva, odtlačku hesla, mena účtu a adresy; zoznam zmien áno');

/* ---------- Nastavenia a konfigurácia pre servery ---------- */
echo "Nastavenia\n";
Ulozisko::zapisUdaje(Miesto::u('tajne.php'), ['sol' => 'sol']);
over(Nastavenia::preAsistenta()['kluc'] === '' && !isset(Nastavenia::preAsistenta()['kalendar']) && Nastavenia::preVernost()['spustene'] === false && Nastavenia::preVernost()['hesla'] === [], 'bez nastavenia: prázdny kľúč, žiadny kalendár, kartičky nespustené');
$kluc = 'sk-' . 'ant-' . 'skusobny-kluc-jednotky-0123456789';
over(Nastavenia::ulozAsistenta('zly-kluc', true, 1500, 'Lajko') !== null && Nastavenia::ulozAsistenta($kluc, false, 1500, 'Lajko') !== null && Nastavenia::ulozAsistenta($kluc, true, 50, 'Lajko') !== null && Nastavenia::ulozAsistenta('', true, 1500, 'Lajko') !== null, 'asistent: zlý kľúč, chýbajúci súhlas, strop mimo rozsahu a súhlas bez kľúča sa odmietnu');
over(Nastavenia::preAsistenta()['kluc'] === '', 'po odmietnutí nie je kľúč uložený');
over(Nastavenia::ulozAsistenta($kluc, true, 900, 'Lajko') === null && Nastavenia::preAsistenta()['kluc'] === $kluc && Nastavenia::preAsistenta()['spolu_za_den'] === 900 && Nastavenia::suhlasAsistent()['kto'] === 'Lajko', 'asistent: kľúč so súhlasom sa vydá serveru asistenta, strop a súhlas (kto, kedy) sú zapísané');
$d = file_get_contents(Miesto::u('dennik/dennik.jsonl')) . file_get_contents(Miesto::u('nastavenie.php'));
over(!str_contains($d, $kluc) && str_contains(file_get_contents(Miesto::u('tajne.php')), $kluc), 'kľúč je len v tajne.php, v denníku ani v nastavení nie');
Nastavenia::ulozKalendar(true, true, 'Lajko');
over(Nastavenia::preAsistenta()['kalendar']['url'] === 'https://www.barbershop30.sk/rezervacia' && Nastavenia::ulozKalendar(true, false, 'Lajko') !== null, 'kalendár: len so súhlasom, adresa pevná z ciel.json');
over(Nastavenia::ulozVernost('kratke', 'kratke', '', 'Lajko') !== null && Nastavenia::ulozVernost('recepcia-pult-kava', 'ine', '', 'Lajko') !== null && Nastavenia::ulozVernost('recepcia-pult-kava', 'recepcia-pult-kava', 'zly-email', 'Lajko') !== null, 'kartička: krátke heslo, nezhoda a zlý e‑mail sa odmietnu');
// S-2, KF-03: heslo recepcie má pravidlá hesla správy a nesmie byť rovnaké ako heslo správy (a naopak)
foreach (['1234567890', 'heslo12345', 'recepcia30', 'barbershop30', 'noznice-hreben-mostna'] as $slabe) over(Nastavenia::ulozVernost($slabe, $slabe, '', 'Lajko') !== null, "kartička: slabé alebo zhodné heslo recepcie odmietnuté: $slabe");
over(Nastavenia::ulozVernost('recepcia-pult-kava', 'recepcia-pult-kava', 'karta@barbershop30.sk', 'Lajko') === null, 'kartička: heslo recepcie a e‑mail uložené');
over(Pristup::chybaHesla('recepcia-pult-kava', 'recepcia-pult-kava', 'Lajko') !== null, 'heslo správy nesmie byť rovnaké ako heslo recepcie');
$kv = Nastavenia::preVernost();
over(password_verify('recepcia-pult-kava', $kv['hesla']['barbershop']) && $kv['spustene'] === true && $kv['len'] === ['barbershop'] && $kv['zaklad'] === 'https://www.barbershop30.sk/vernost/' && $kv['karty']['barbershop'] === 'https://www.barbershop30.sk/karta/' && $kv['data'] === Miesto::u('vernost') && !str_contains(file_get_contents(Miesto::u('tajne.php')), 'recepcia-pult-kava'), 'kartička: konfigurácia pre túto doménu, heslo len ako odtlačok');
Nastavenia::odstranKluc();
over(Nastavenia::preAsistenta()['kluc'] === '' && !str_contains(file_get_contents(Miesto::u('tajne.php')), $kluc) && Nastavenia::suhlasAsistent() === null, 'odstránenie kľúča: kľúč aj súhlas preč');
over(Nastavenia::ulozProxy("10.0.0.1\n10.0.0.2") === null && Nastavenia::proxy() === ['10.0.0.1', '10.0.0.2'] && Nastavenia::ulozProxy('nie-je-ip') !== null, 'adresy proxy: len adresy IP');
// zástupky: konfigurácia cez asistent/config.php a vernost/config.php (ako ju načítajú servery)
$zast = shell_exec('php -r ' . escapeshellarg('const ASISTENT = true; $k = require $argv[1]; echo json_encode([$k["kluc"], isset($k["kalendar"]), basename(dirname($k["db"]))]);') . ' ' . escapeshellarg("$W/asistent/config.php"));
over($zast === '["",true,"asistent"]', 'zástupka asistent/config.php: konfigurácia z údajov správy (bez kľúča prázdny kluc, databáza limitov v údajoch)', (string) $zast);
over(trim((string) shell_exec('php ' . escapeshellarg("$W/asistent/config.php") . ' 2>&1')) === '' && trim((string) shell_exec('php ' . escapeshellarg("$W/sprava/jadro/pre-asistenta.php") . ' 2>&1')) === '' && trim((string) shell_exec('php ' . escapeshellarg("$W/sprava/jadro/Nastavenia.php") . ' 2>&1')) === '', 'vnútorné súbory spustené priamo nič nevypíšu');

/* ---------- lokálna poistka: pod php -S bez premenných je API aj kalendár vypnutý ---------- */
echo "Lokálna poistka\n";
Nastavenia::ulozAsistenta($kluc, true, 900, 'Lajko');   // kľúč, súhlas aj kalendár sú v údajoch zapnuté
@mkdir("$W/asistent/vendor"); file_put_contents("$W/asistent/vendor/autoload.php", "<?php\n");   // v kópii nie je knižnica; stav sa pýta len na jej súbor
$stavServera = function (array $env) use ($W, $PORT, $T): ?array {
    $proc = proc_open(['php', '-S', "127.0.0.1:$PORT", '-t', $W], [1 => ['file', "$T/php-s.log", 'w'], 2 => ['file', "$T/php-s.log", 'w']], $rury, $W, ['PATH' => getenv('PATH')] + $env);
    usleep(700000);
    $stav = json_decode((string) @file_get_contents("http://127.0.0.1:$PORT/asistent/api.php?a=stav"), true);
    proc_terminate($proc); proc_close($proc); usleep(200000);
    return is_array($stav) ? $stav : null;
};
$bez = $stavServera([]);
over($bez && $bez['ok'] === true && $bez['zapnute'] === false && $bez['kalendar'] === false, 'php -S bez ANTHROPIC_BASE_URL a B30_TEST_KALENDAR: asistent aj kalendár vypnuté, hoci kľúč a súhlasy sú uložené', json_encode($bez));
$zla = $stavServera(['ANTHROPIC_BASE_URL' => 'https://api.anthropic.com', 'B30_TEST_KALENDAR' => 'https://www.barbershop30.sk/rezervacia']);
over($zla && $zla['zapnute'] === false && $zla['kalendar'] === false, 'php -S s adresou mimo tohto stroja: stále vypnuté (poistka prijme len 127.0.0.1)', json_encode($zla));
$s = $stavServera(['ANTHROPIC_BASE_URL' => "http://127.0.0.1:$PORT", 'B30_TEST_KALENDAR' => "http://127.0.0.1:$PORT/rezervacia"]);
over($s && $s['zapnute'] === true && $s['kalendar'] === true, 'php -S s falošným API a falošným rezervačným systémom na tomto stroji: zapnuté', json_encode($s));

/* ---------- brána HTTPS: bez dôkazu (cookie s príznakom Secure) sa správa neotvorí ---------- */
echo "Brána HTTPS\n";
$proc = proc_open(['php', '-S', "127.0.0.1:$PORT", '-t', $W], [1 => ['file', "$T/php-s.log", 'w'], 2 => ['file', "$T/php-s.log", 'w']], $rury, $W, ['PATH' => getenv('PATH'), 'B30_TEST_HTTPS' => '1']);
usleep(700000);
$ziadost = function (string $cesta, string $cookie = '') use ($PORT): array {
    $ctx = stream_context_create(['http' => ['follow_location' => 0, 'ignore_errors' => true, 'header' => $cookie !== '' ? "Cookie: $cookie\r\n" : '']]);
    $telo = (string) @file_get_contents("http://127.0.0.1:$PORT$cesta", false, $ctx);
    return [implode("\n", $http_response_header ?? []), $telo];
};
[$h1, $t1] = $ziadost('/sprava/index.php');
[$h2, $t2] = $ziadost('/sprava/index.php?h=1');
[$h3, $t3] = $ziadost('/sprava/index.php?h=1', '__Secure-b30h=1');
[$h4, $t4] = $ziadost('/sprava/api.php?a=stav');
proc_terminate($proc); proc_close($proc);
over(str_contains($h1, ' 303 ') && preg_match('/Set-Cookie: __Secure-b30h=1;.*secure/i', $h1) && preg_match('#Location: http://127\.0\.0\.1:\d+/sprava/\?h=1#', $h1), 'prvá požiadavka: cookie s príznakom Secure a presmerovanie na overenie');
over(str_contains($t2, 'Otvor správu cez zabezpečené pripojenie') && !str_contains($t2, 'name="_t"') && !str_contains($h2, 'b30s='), 'bez dôkazu HTTPS: len výzva s adresou https, žiadny formulár ani relácia');
over(str_contains($t3, 'Prihlásenie') && str_contains($h3, 'b30s='), 's dôkazom (cookie prišla späť): správa sa otvorí');
over(str_contains($h4, ' 401 ') && str_contains($t4, 'len cez https'), 'api.php bez dôkazu HTTPS: 401');

echo "\n$ok OK, $zle FAIL\n";
exit($zle ? 1 : 0);
