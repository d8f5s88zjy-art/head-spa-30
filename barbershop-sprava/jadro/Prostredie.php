<?php
// Kontrola hostingu (K1 až K11): pred prvým nastavením a kedykoľvek v správe. Povinné body zastavia správu s vetou,
// čo urobiť. Neprihlásenému sa ukáže len súhrn, podrobnosti (cesty, čísla) až po overení kódu alebo prihlásení.
// Sondy sú požiadavky GET na vlastný web (adresa z ciel.json, nikdy z hlavičky Host); súbory sond sa hneď mažú.
defined('B30S') || exit;

final class Prostredie
{
    private static ?bool $adresaOk = null;

    /** GET na vlastný web; vráti [stav HTTP, telo (najviac 64 kB), Location] alebo null, keď sa server nevie spýtať sám seba. */
    public static function sonda(string $url, int $cas = 6): ?array
    {
        if (!ini_get('allow_url_fopen') || !str_starts_with($url, Miesto::zaklad())) return null;
        $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => $cas, 'ignore_errors' => true, 'follow_location' => 0, 'header' => "Cache-Control: no-cache\r\nUser-Agent: b30-sprava\r\n"],
                                      'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
        $telo = @file_get_contents($url, false, $ctx, 0, 65536);
        if (!isset($http_response_header) || !$http_response_header) return null;
        preg_match('#^HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m);
        $loc = '';
        foreach ($http_response_header as $hl) if (preg_match('#^location:\s*(.+)$#i', $hl, $mm)) $loc = trim($mm[1]);
        return [(int) ($m[1] ?? 0), (string) $telo, $loc];
    }

    /** Kontrolná sonda: náhodný súbor v koreni webu musí prísť späť – adresa z ciel.json vedie na TENTO server. */
    public static function adresaOk(): bool
    {
        if (self::$adresaOk !== null) return self::$adresaOk;
        $meno = 'b30-sonda-' . bin2hex(random_bytes(8)) . '.txt';
        $tajne = bin2hex(random_bytes(12));
        if (@file_put_contents(Miesto::w($meno), $tajne) === false) return self::$adresaOk = false;
        $r = self::sonda(Miesto::zaklad() . $meno);
        @unlink(Miesto::w($meno));
        return self::$adresaOk = ($r !== null && $r[0] === 200 && trim($r[1]) === $tajne);
    }

    private static function bod(string $id, string $nazov, string $stav, string $detail, bool $povinne = true): array
    {
        return compact('id', 'nazov', 'stav', 'detail', 'povinne');
    }

    private static function velke(string $s): string { return mb_strtoupper(mb_substr($s, 0, 1)) . mb_substr($s, 1); }

    private static function bajty(string $v): int
    {
        $v = trim($v); $n = (int) $v;
        switch (strtolower(substr($v, -1))) { case 'g': $n *= 1024; case 'm': $n *= 1024; case 'k': $n *= 1024; }
        return $n;
    }

    public static function webp(): bool { return function_exists('imagewebp') && function_exists('imagecreatefromstring') && !empty(gd_info()['WebP Support']); }

    /** Súbory a priečinky webu, do ktorých správa zapisuje. */
    public static function cieleZapisu(): array
    {
        $s = ['index.html', 'en/index.html', 'sitemap.xml', 'karta/index.html'];
        foreach (Mapa::tabulka() as $z) if ($z[0] !== null) $s[] = $z[0];
        $p = ['assets/img'];
        foreach ($s as $x) $p[] = dirname($x) === '.' ? '' : dirname($x);
        return ['subory' => array_values(array_unique($s)), 'priecinky' => array_values(array_unique($p))];
    }

    /** Úplnosť balíka podľa zoznamu odtlačkov (riadky „sha256  cesta“). Vráti [chýbajúce, zmenené]. */
    public static function odtlacky(string $zoznam, string $koren, int $najviacChyb = 20): array
    {
        $chyba = []; $ine = [];
        foreach (@file($zoznam, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $r) {
            if (!preg_match('/^([0-9a-f]{64})  (.+)$/', $r, $m) || !Mapa::cestaOk($m[2])) continue;
            $f = $koren . '/' . $m[2];
            if (!is_file($f)) $chyba[] = $m[2]; elseif (hash_file('sha256', $f) !== $m[1]) $ine[] = $m[2];
            if (count($chyba) + count($ine) >= $najviacChyb) break;
        }
        return [$chyba, $ine];
    }

    /** Všetky kontroly. $sondy: aj požiadavky na vlastný web (pomalšie). Výsledok sa uloží do údaje/prostredie.json. */
    public static function kontroly(bool $sondy = true): array
    {
        $b = [];
        // K1 verzia PHP (staršie než 8.2 zachytí brána v index.php skôr; tu pre úplnosť a pre odporúčanie)
        $v = PHP_VERSION_ID >= 80200;
        $b[] = self::bod('php', 'Verzia PHP', $v ? 'ok' : 'chyba', $v ? 'PHP ' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . ' vyhovuje.' : 'Treba PHP 8.2 alebo novšie. Verziu neprepínaj bez dohody so správcom rezervačného systému, beží na tej istej doméne.');
        // K2 rozšírenia
        $chyba = array_values(array_filter(['json', 'mbstring', 'session', 'hash', 'pcre', 'fileinfo', 'pdo_sqlite', 'openssl', 'curl'], fn($e) => !extension_loaded($e)));
        $sqlite = extension_loaded('pdo_sqlite') ? (string) (new PDO('sqlite::memory:'))->query('SELECT sqlite_version()')->fetchColumn() : '';
        if ($sqlite !== '' && version_compare($sqlite, '3.24.0', '<')) $chyba[] = 'SQLite 3.24+ (je ' . $sqlite . ')';
        $b[] = self::bod('rozsirenia', 'Rozšírenia PHP', $chyba ? 'chyba' : 'ok', $chyba ? 'Chýba: ' . implode(', ', $chyba) . '. Zapni ich v nastavení PHP v zákazníckom účte hostingu.' : 'json, mbstring, session, hash, fileinfo, pdo_sqlite, openssl, curl');
        $b[] = self::bod('fotky', 'Úprava fotiek (GD s WebP)', self::webp() ? 'ok' : 'upozornenie', self::webp() ? 'Nové fotky tímu a galérie sa dajú nahrávať.' : 'Bez rozšírenia GD s WebP sa nedajú nahrávať nové fotky. Texty a cenník fungujú.', false);
        $b[] = self::bod('zip', 'Export (ZIP)', class_exists('ZipArchive') ? 'ok' : 'upozornenie', class_exists('ZipArchive') ? 'Export úprav pre tvorcu webu funguje.' : 'Bez rozšírenia zip sa nedá stiahnuť export úprav.', false);
        // K3 HTTPS
        $https = Pristup::https();
        $b[] = self::bod('https', 'Zabezpečené pripojenie (HTTPS)', $https ? 'ok' : 'chyba', $https ? (Miesto::lokalne() ? 'Lokálna skúška (bez HTTPS).' : 'Správa ide cez https://.') : 'Otvor správu cez ' . Miesto::zaklad() . 'sprava/ (s https na začiatku).');
        // K4 priečinok údajov
        $zap = is_writable(Miesto::u()) && is_writable(Miesto::u('zdroj')) && is_writable(Miesto::u('relacie'));
        $b[] = self::bod('udaje', 'Priečinok údajov', $zap ? 'ok' : 'chyba', $zap ? (Miesto::$voWebe ? 'V priečinku webu s náhodným menom (chránený).' : 'Mimo verejného webu.') : 'Do priečinka údajov sa nedá zapisovať. Nastav mu cez FTP práva na zápis.');
        if ($sondy) $b[] = self::sondaUdajov();
        // K5 zápis do súborov webu
        $c = self::cieleZapisu(); $nezap = [];
        foreach ($c['priecinky'] as $p) {
            $d = Miesto::w($p);
            if (!is_dir($d)) { $nezap[] = ($p === '' ? 'koreň webu' : $p) . ' (chýba)'; continue; }
            $t = $d . '/.b30-test-' . bin2hex(random_bytes(4));
            $ok = @file_put_contents($t, 'x') === 1 && @rename($t, $t . 'b') && @unlink($t . 'b');
            @unlink($t);
            if (!$ok) $nezap[] = $p === '' ? 'koreň webu' : $p;
        }
        foreach ($c['subory'] as $f) if (is_file(Miesto::w($f)) && !is_writable(Miesto::w($f))) $nezap[] = $f;
        $b[] = self::bod('zapis', 'Zápis do súborov webu', $nezap ? 'chyba' : 'ok', $nezap ? 'Nedá sa zapisovať do: ' . implode(', ', array_slice($nezap, 0, 12)) . '. Nastav im cez FTP práva na zápis (priečinkom 755 alebo 775, súborom 644 alebo 664 podľa hostingu); bez toho nejdú úpravy webu ani zapínanie funkcií.' : 'Správa vie prepisovať stránky a zapínať funkcie.');
        // K6 PHP v našich priečinkoch a zákazy
        if ($sondy) foreach (self::sondyPriecinkov() as $x) $b[] = $x;
        // K7 úplnosť balíka
        [$ch1, $in1] = self::odtlacky(Miesto::w('sprava/semeno/subory.sha256'), Miesto::w());
        [$ch2, $in2] = self::odtlacky(Miesto::w('asistent/subory.sha256'), Miesto::w('asistent'));
        $maZoznam = is_file(Miesto::w('sprava/semeno/subory.sha256'));
        $zle = array_merge($ch1, $in1, array_map(fn($x) => 'asistent/' . $x, array_merge($ch2, $in2)));
        $pr = array_values(array_unique(array_map(fn($x) => explode('/', $x)[0], $zle)));
        $b[] = self::bod('uplnost', 'Úplnosť balíka', !$maZoznam || $zle ? 'chyba' : 'ok', !$maZoznam ? 'Chýba zoznam súborov balíka (sprava/semeno). Nahraj priečinok sprava znova.' : ($zle ? 'Chýbajú alebo sú poškodené súbory, napr. ' . implode(', ', array_slice($zle, 0, 4)) . '. Nahraj znova priečinok: ' . implode(', ', $pr) . '.' : 'Všetky súbory balíka sú na mieste.'));
        // K8 rezervačný systém nedotknutý
        if ($sondy) $b[] = self::sondaRezervacie();
        // K10 adresa návštevníka
        $r = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        $sukr = $r !== '' && !filter_var($r, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
        $zaProxy = !Miesto::lokalne() && ($sukr || (!empty($_SERVER['HTTP_X_FORWARDED_FOR']) && !in_array($r, Nastavenia::proxy(), true)));
        $b[] = self::bod('adresa', 'Adresa návštevníka', $zaProxy ? 'upozornenie' : 'ok', $zaProxy ? 'Server vidí namiesto návštevníka adresu proxy hostingu. Limity by sa rátali všetkým spolu: napíš tvorcovi webu, doplní adresy proxy v časti Nastavenia.' : 'Server vidí adresu návštevníka, limity sa rátajú každému zvlášť.', false);
        // K11 limity PHP, voľné miesto, mail()
        $pam = self::bajty((string) ini_get('memory_limit')); $cas = (int) ini_get('max_execution_time');
        $volne = @disk_free_space(Miesto::u());
        $poz = [];
        if ($pam > 0 && $pam < 128 << 20) $poz[] = 'pamäť PHP je ' . ini_get('memory_limit') . ' (odporúčame aspoň 128M)';
        if ($cas > 0 && $cas < 60) $poz[] = 'čas behu je ' . $cas . ' s (odporúčame aspoň 60)';
        if ($volne !== false && $volne < 300 << 20) $poz[] = 'voľné miesto ' . round($volne / 1048576) . ' MB';
        if (!function_exists('mail')) $poz[] = 'funkcia mail() je vypnutá (e‑maily s kartičkou nepôjdu)';
        $b[] = self::bod('limity', 'Limity PHP a miesto', $poz ? 'upozornenie' : 'ok', $poz ? self::velke(implode('; ', $poz)) . '.' : 'Pamäť ' . ini_get('memory_limit') . ', čas ' . $cas . ' s' . ($volne !== false ? ', voľné miesto ' . round($volne / 1073741824, 1) . ' GB' : '') . '.', false);
        Ulozisko::zapis(Miesto::u('prostredie.json'), json_encode(['cas' => time(), 'body' => $b], JSON_UNESCAPED_UNICODE));
        return $b;
    }

    /** K4: súbor z priečinka údajov sa z webu nesmie dať prečítať. */
    private static function sondaUdajov(): array
    {
        $nazov = 'Údaje nie sú dostupné z webu';
        if (!Miesto::$voWebe) return self::bod('sonda-udaje', $nazov, 'ok', 'Priečinok je mimo verejného webu.');
        if (!self::adresaOk()) return self::bod('sonda-udaje', $nazov, 'chyba', 'Server nevie overiť ochranu priečinka údajov: adresa ' . Miesto::zaklad() . ' nevedie na tento hosting alebo sa server nevie spýtať sám seba. Napíš tvorcovi webu.');
        $meno = 'sonda-' . bin2hex(random_bytes(8)) . '.txt'; $tajne = bin2hex(random_bytes(8));
        file_put_contents(Miesto::u($meno), $tajne);
        $r = self::sonda(Miesto::zaklad() . basename(Miesto::u()) . '/' . $meno);
        $r2 = self::sonda(Miesto::zaklad() . basename(Miesto::u()) . '/tajne.php');
        @unlink(Miesto::u($meno));
        if ($r === null) return self::bod('sonda-udaje', $nazov, 'chyba', 'Server nevie overiť ochranu priečinka údajov. Napíš tvorcovi webu.');
        $ok = !str_contains($r[1], $tajne) && ($r2 === null || trim($r2[1]) === '' || $r2[0] >= 400);
        return self::bod('sonda-udaje', $nazov, $ok ? 'ok' : 'chyba', $ok ? 'Overené (odpoveď ' . $r[0] . ').' : 'Priečinok údajov sa dá otvoriť z internetu! Správu nepoužívaj a napíš tvorcovi webu.');
    }

    /** K6: api.php asistenta a kartičiek odpovedajú JSON; vnútorné súbory sú z webu zakázané. */
    private static function sondyPriecinkov(): array
    {
        if (!self::adresaOk()) return [self::bod('sonda-php', 'Servery asistenta a kartičiek', 'upozornenie', 'Server to nevie overiť sám (nevie sa spýtať sám seba).', false)];
        $z = Miesto::zaklad(); $von = [];
        $zle = [];
        foreach (['asistent/api.php?a=stav' => 'asistent', 'vernost/api/?a=stav' => 'vernost'] as $u => $p) {
            $r = self::sonda($z . $u); $j = $r ? json_decode($r[1], true) : null;
            if (!$r || $r[0] !== 200 || !is_array($j) || empty($j['ok'])) $zle[] = "$p (odpoveď " . ($r[0] ?? '–') . ')';
        }
        $von[] = self::bod('sonda-php', 'Servery asistenta a kartičiek', $zle ? 'chyba' : 'ok', $zle ? 'Neodpovedá: ' . implode(', ', $zle) . '. Skontroluj, či je priečinok nahratý celý a či v ňom hosting spúšťa PHP.' : 'asistent/api.php aj vernost/api/ odpovedajú.');
        $otvorene = [];
        foreach (['sprava/jadro/Miesto.php', 'sprava/jadro/ciel.json', 'sprava/semeno/verzia.json', 'asistent/lib/jadro.php', 'asistent/config.php', 'asistent/vendor/autoload.php', 'asistent/znalosti/barbershop.md', 'vernost/lib/jadro.php', 'vernost/config.php'] as $u) {
            $r = self::sonda($z . $u);
            if ($r !== null && $r[0] < 400 && trim($r[1]) !== '') $otvorene[] = $u;
        }
        $von[] = self::bod('sonda-zakazy', 'Vnútorné súbory sú z webu zakázané', $otvorene ? 'chyba' : 'ok', $otvorene ? 'Z internetu sa dá otvoriť: ' . implode(', ', $otvorene) . '. Nahraj znova súbory .htaccess z balíka (asistent, vernost, sprava) a napíš tvorcovi webu.' : 'Overené.');
        return $von;
    }

    /** K8: rezervačný systém a jeho admin sú na svojom mieste (len GET, nič sa neodosiela). */
    private static function sondaRezervacie(): array
    {
        $nazov = 'Rezervačný systém je na svojom mieste';
        if (!self::adresaOk()) return self::bod('rezervacia', $nazov, 'upozornenie', 'Server to nevie overiť sám. Vyskúšaj ' . Miesto::zaklad() . 'rezervacia v prehliadači.', false);
        $z = Miesto::zaklad(); $zle = [];
        $r = self::sonda($z . 'rezervacia', 10);
        if (!$r || $r[0] !== 200 || !str_contains($r[1], 'v-order-component')) $zle[] = '/rezervacia neukazuje rezervačný formulár (odpoveď ' . ($r[0] ?? '–') . ')';
        $a = self::sonda($z . 'admin', 10);
        if (!$a || !in_array($a[0], [301, 302, 303, 307], true) || !str_contains($a[2], '/admin/login')) $zle[] = '/admin nevedie na prihlásenie rezervačného systému';
        return self::bod('rezervacia', $nazov, $zle ? 'upozornenie' : 'ok', $zle ? self::velke(implode('; ', $zle)) . '. Over to v prehliadači a daj vedieť správcovi rezervačného systému.' : '/rezervacia aj /admin odpovedajú ako predtým.', false);
    }

    /** K9: spojenie s API (len pri zapínaní asistenta). Bez kľúča, stačí akákoľvek odpoveď HTTP. Pod php -S sa nevolá nič
     *  mimo tohto stroja. */
    public static function spojenieApi(): array
    {
        $nazov = 'Spojenie so službou asistenta';
        if (Miesto::lokalne()) return self::bod('api', $nazov, 'ok', 'Lokálna skúška: von sa nevolá.', false);
        if (!function_exists('curl_init')) return self::bod('api', $nazov, 'upozornenie', 'Chýba rozšírenie curl.', false);
        $c = curl_init('https://api.anthropic.com/');
        curl_setopt_array($c, [CURLOPT_NOBODY => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_FOLLOWLOCATION => false]);
        curl_exec($c); $kod = (int) curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
        return self::bod('api', $nazov, $kod > 0 ? 'ok' : 'upozornenie', $kod > 0 ? 'Hosting sa so službou spojí.' : 'Hosting sa nevie spojiť so službou asistenta (odchádzajúce HTTPS). Napíš podpore hostingu.', false);
    }

    /** Súhrn pre neprihláseného: počet povinných chýb. */
    public static function suhrn(array $body): array
    {
        $chyby = array_values(array_filter($body, fn($x) => $x['povinne'] && $x['stav'] === 'chyba'));
        return ['pripravene' => !$chyby, 'pocet' => count($chyby), 'upozornenia' => count(array_filter($body, fn($x) => $x['stav'] === 'upozornenie'))];
    }

    public static function posledne(): ?array
    {
        $j = json_decode((string) @file_get_contents(Miesto::u('prostredie.json')), true);
        return is_array($j) ? $j : null;
    }
}
