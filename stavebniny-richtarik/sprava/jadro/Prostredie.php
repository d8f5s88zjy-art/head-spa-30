<?php
// Kontrola prostredia hostingu (Forpsi Linux aj Windows): pred prvým nastavením a v Nastaveniach. Povinné body zastavia
// správu s vetou, čo nastaviť. Pred prihlásením sa ukáže len súhrn, podrobnosti až po overení kódu alebo prihlásení.
// Sondy (súbory v priečinku dát, PHP v img/s a pdf/s) sa po overení hneď zmažú.
defined('SPRAVA') || exit;

final class Prostredie
{
    /** Priečinky webu, do ktorých správa zapisuje (súbory s oblasťami, nahrávky, index hľadania). */
    public static function priecinkyZapisu(): array
    {
        $p = ['', 'akcie', 'assets', 'img/s', 'pdf/s'];
        foreach (array_keys(Ulozisko::citajJson(Nastavenie::w('sprava/kostry/oblasti.json'), [])) as $s) $p[] = dirname($s) === '.' ? '' : dirname($s);
        return array_values(array_unique($p));
    }

    /** Adresa webu pre sondy – nikdy z hlavičky Host (tú môže podvrhnúť ktokoľvek). Poradie: lokálny test (php -S) →
     *  súbor adresa.txt v priečinku údajov (zapíše ho len ten, kto má FTP, napr. dočasná adresa pred presmerovaním domény)
     *  → doména webu z sprava/kostry/konstanty.json. Či adresa naozaj vedie na tento server, overí kontrolaAdresy(). */
    public static function zakladUrl(): string
    {
        $cesta = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/sprava/index.php'))), '/') . '/';
        if (Nastavenie::lokalne()) return 'http://127.0.0.1:' . (int)($_SERVER['SERVER_PORT'] ?? 80) . $cesta;
        $a = trim((string)@file_get_contents(Nastavenie::d('adresa.txt')));
        if (preg_match('#^https?://[a-z0-9.-]+(:\d{2,5})?/?$#i', $a)) return rtrim($a, '/') . $cesta;
        $d = (string)(Nastavenie::konstanty()['domena'] ?? '');
        return rtrim(preg_replace('#^(https://[^/]+).*$#', '$1', $d), '/') . $cesta;
    }

    private static ?bool $adresaOk = null;

    /** Kontrolná sonda: verejný súbor s náhodným obsahom v koreni webu musí prísť späť – adresa vedie na TENTO server.
     *  Inak sa ostatné sondy nedajú vyhodnotiť (napr. doména ešte vedie na starý web). */
    public static function kontrolaAdresy(): bool
    {
        if (self::$adresaOk !== null) return self::$adresaOk;
        $meno = 'sprava-sonda-' . bin2hex(random_bytes(8)) . '.txt';
        $tajne = bin2hex(random_bytes(12));
        if (@file_put_contents(Nastavenie::w($meno), $tajne) === false) return self::$adresaOk = false;
        $r = self::sonda(self::zakladUrl() . $meno);
        @unlink(Nastavenie::w($meno));
        return self::$adresaOk = ($r !== null && $r[0] === 200 && trim($r[1]) === $tajne);
    }

    /** GET na vlastný web; vráti [stav HTTP, telo, Content-Type] alebo null, ak sa server nevie spýtať sám seba. */
    public static function sonda(string $url, bool $typ = false): ?array
    {
        if (!ini_get('allow_url_fopen')) return null;
        $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 6, 'ignore_errors' => true, 'follow_location' => 0, 'header' => "Cache-Control: no-cache\r\n"],
                                      'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
        $telo = @file_get_contents($url, false, $ctx, 0, 4096);
        if (!isset($http_response_header) || !$http_response_header) return null;
        preg_match('#^HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m);
        $ct = '';
        foreach ($http_response_header as $hl) if (preg_match('#^content-type:\s*(.+)$#i', $hl, $mm)) $ct = trim($mm[1]);
        return [(int)($m[1] ?? 0), (string)$telo, $ct];
    }

    private static function bod(string $id, string $nazov, string $stav, string $detail, bool $povinne = true): array
    {
        return compact('id', 'nazov', 'stav', 'detail', 'povinne');
    }

    private static function bajty(string $v): int
    {
        $v = trim($v); $n = (int)$v;
        switch (strtolower(substr($v, -1))) { case 'g': $n *= 1024; case 'm': $n *= 1024; case 'k': $n *= 1024; }
        return $n;
    }

    public static function limitNahravania(): int
    {
        return min(self::bajty(ini_get('upload_max_filesize') ?: '2M'), self::bajty(ini_get('post_max_size') ?: '8M'));
    }

    public static function avif(): bool
    {
        if (!function_exists('imageavif')) return false;
        $im = @imagecreatetruecolor(8, 8);
        if (!$im) return false;
        ob_start(); $ok = @imageavif($im, null, 60); $b = ob_get_clean();
        imagedestroy($im);
        return $ok && strlen($b) > 20;
    }

    public static function webp(): bool
    {
        return function_exists('imagewebp') && function_exists('imagecreatefromjpeg') && (gd_info()['WebP Support'] ?? false);
    }

    /** Všetky kontroly. $sondy: aj požiadavky na vlastný web (pomalšie). */
    public static function kontroly(bool $sondy = true): array
    {
        $b = [];
        $https = Nastavenie::https() || Nastavenie::lokalne();
        $b[] = self::bod('https', 'Zabezpečené pripojenie (HTTPS)', $https ? 'ok' : 'chyba', $https ? 'Správa ide cez https://.' : 'Zapnite certifikát SSL pre doménu v zákazníckom účte Forpsi a otvorte správu cez https://.');
        $v = version_compare(PHP_VERSION, '8.1.0', '>=');
        $b[] = self::bod('php', 'Verzia PHP', $v ? 'ok' : 'chyba', $v ? 'PHP ' . PHP_VERSION : 'Je PHP ' . PHP_VERSION . '. V zákazníckom účte Forpsi nastavte PHP 8.1 alebo novšie (odporúčané 8.3).');
        $chyba = array_values(array_filter(['session', 'json', 'hash', 'fileinfo', 'dom', 'libxml', 'mbstring', 'pcre'], fn($e) => !extension_loaded($e)));
        $b[] = self::bod('rozsirenia', 'Potrebné rozšírenia PHP', $chyba ? 'chyba' : 'ok', $chyba ? 'Chýba: ' . implode(', ', $chyba) . '. Zapnite ich v nastavení PHP v zákazníckom účte.' : 'session, json, hash, fileinfo, dom, mbstring');
        $w = self::webp();
        $b[] = self::bod('fotky', 'Úprava fotiek (GD s WebP)', $w ? 'ok' : 'upozornenie', $w ? 'Fotky sa uložia vo formáte WebP' . (self::avif() ? ' a AVIF.' : ' (AVIF tento server nevie, stačí WebP).') : 'Bez GD s WebP sa nedajú nahrávať fotky. Ostatné funguje.', false);
        $lim = self::limitNahravania();
        $b[] = self::bod('limity', 'Veľkosť nahrávaných súborov', $lim >= 8 << 20 ? 'ok' : 'upozornenie', 'Najviac ' . round($lim / 1048576) . ' MB naraz, pamäť ' . ini_get('memory_limit') . ', čas ' . ini_get('max_execution_time') . ' s.', false);
        // priečinok dát
        $zap = is_writable(Nastavenie::d()) && is_writable(Nastavenie::d('data'));
        $b[] = self::bod('data', 'Priečinok údajov správy', $zap ? 'ok' : 'chyba', $zap ? (Nastavenie::$vnutriWebu ? 'V priečinku webu ' . basename(Nastavenie::d()) . ' (chránený).' : 'Mimo verejného webu.') : 'Do priečinka údajov sa nedá zapisovať. Nastavte mu práva 757 (FTP: pravé tlačidlo, Práva).');
        if ($sondy) {
            $b[] = self::sondaDat();
            $b[] = self::sondaSpustania();
            $b[] = self::sondaJadra();
            $b[] = self::sondaSuborov();
        }
        $nezap = [];
        foreach (self::priecinkyZapisu() as $p) {
            $d = Nastavenie::w($p);
            if (!is_dir($d)) { if (in_array($p, ['img/s', 'pdf/s'], true)) @mkdir($d, 0755, true); }
            $t = $d . '/.sprava-test-' . bin2hex(random_bytes(4));
            $ok = @file_put_contents($t, 'x') === 1 && @rename($t, $t . 'b') && @unlink($t . 'b');
            @unlink($t);
            if (!$ok) $nezap[] = $p === '' ? 'koreň webu' : $p;
        }
        $b[] = self::bod('zapis', 'Zápis do súborov webu', $nezap ? 'chyba' : 'ok', $nezap ? 'Nedá sa zapisovať do: ' . implode(', ', $nezap) . '. Na Linuxe im nastavte práva 757 (Forpsi, Midnight Commander alebo FTP).' : 'Správa vie bezpečne prepisovať stránky.');
        $rel = is_writable(Nastavenie::d('relacie'));
        $b[] = self::bod('relacia', 'Prihlásenie (relácie)', $rel ? 'ok' : 'chyba', $rel ? 'V poriadku.' : 'Priečinok relácií nie je zapisovateľný.');
        $volne = @disk_free_space(Nastavenie::d());
        $b[] = self::bod('miesto', 'Voľné miesto na hostingu', $volne === false || $volne > 200 << 20 ? 'ok' : 'upozornenie', $volne === false ? 'Nedá sa zistiť.' : round($volne / 1073741824, 1) . ' GB', false);
        $koren = is_file(Nastavenie::w('index.html')) && is_file(Nastavenie::w('assets/site.js')) && is_file(Nastavenie::w('sprava/kostry/akcia.html'));
        $b[] = self::bod('web', 'Web Stavebniny Richtárik v tom istom priečinku', $koren ? 'ok' : 'chyba', $koren ? 'Nájdený.' : 'Správa musí byť v priečinku sprava/ priamo vo webe (vedľa index.html).');
        if ($koren) {
            try {
                $st = Zmena::stavWebu();
                $b[] = self::bod('znacky', 'Označené miesta v stránkach', $st['chybajuce'] ? 'chyba' : 'ok', $st['chybajuce'] ? 'Chýbajú značky v: ' . implode(', ', array_slice($st['chybajuce'], 0, 5)) . '. Stránky upravil niekto mimo správy; zavolajte programátora.' : 'Všetkých ' . $st['oblasti'] . ' miest je na svojom mieste.');
                $b[] = self::bod('zhoda', 'Web zodpovedá uloženým údajom', $st['rozdielne'] ? 'upozornenie' : 'ok', $st['rozdielne'] ? 'Líši sa ' . count($st['rozdielne']) . ' stránok (napr. ' . implode(', ', array_slice($st['rozdielne'], 0, 3)) . '). Ak sa nahrával nový web, použite v Nastaveniach „Vrátiť na web moje zmeny“.' : 'V poriadku.', false);
            } catch (Throwable $e) {
                Dennik::chyba($e);
                $b[] = self::bod('znacky', 'Označené miesta v stránkach', 'chyba', 'Stránky sa nedajú prečítať.');
            }
        }
        Ulozisko::zapisJson(Nastavenie::d('prostredie.json'), ['cas' => time(), 'body' => $b]);
        return $b;
    }

    private static function sondaDat(): array
    {
        if (!Nastavenie::$vnutriWebu) return self::bod('sonda-data', 'Údaje správy nie sú dostupné z webu', 'ok', 'Priečinok je mimo verejného webu.');
        $meno = 'sonda-' . bin2hex(random_bytes(8)) . '.txt';
        $tajne = bin2hex(random_bytes(8));
        if (!self::kontrolaAdresy()) return self::bod('sonda-data', 'Údaje správy nie sú dostupné z webu', 'chyba', 'Server nevie overiť ochranu priečinka údajov: adresa ' . self::zakladUrl() . ' nevedie na tento hosting. Zavolajte programátora (README, časť Správa webu, adresa.txt).');
        file_put_contents(Nastavenie::d($meno), $tajne);
        $r = self::sonda(self::zakladUrl() . basename(Nastavenie::d()) . '/' . $meno);
        @unlink(Nastavenie::d($meno));
        if ($r === null) return self::bod('sonda-data', 'Údaje správy nie sú dostupné z webu', 'chyba', 'Server nevie overiť ochranu priečinka údajov. Zavolajte programátora.');
        $ok = !str_contains($r[1], $tajne);
        return self::bod('sonda-data', 'Údaje správy nie sú dostupné z webu', $ok ? 'ok' : 'chyba', $ok ? 'Overené (odpoveď ' . $r[0] . ').' : 'Priečinok údajov sa dá otvoriť z internetu! Nahrajte súbory .htaccess a web.config z balíka alebo presuňte web na Linux hosting.');
    }

    /** Malé skutočné súbory (WebP a PDF), aké nahráva správa: musia prísť s 200 a správnym typom. Ochranné súbory img/s
     *  a pdf/s môžu na hostingu, ktorý nepovolí niektoré pravidlá, vrátiť chybu 500 – fotky na webe by potom chýbali. */
    public static function sondaSuborov(): array
    {
        $nazov = 'Fotky a PDF zo správy sa na webe zobrazia';
        if (!self::kontrolaAdresy()) return self::bod('sonda-subory', $nazov, 'upozornenie', 'Server to nevie overiť sám.', false);
        $zle = [];
        $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
        $subory = [['pdf', 'pdf', 'application/pdf', $pdf]];
        if (self::webp()) { $im = imagecreatetruecolor(4, 4); ob_start(); imagewebp($im, null, 80); $subory[] = ['img', 'webp', 'image/webp', ob_get_clean()]; imagedestroy($im); }
        foreach ($subory as [$druh, $ext, $typ, $obsah]) {
            $rel = $druh . '/s/' . date('Y') . '/' . date('m');
            if (!is_dir(Nastavenie::w($rel)) && !@mkdir(Nastavenie::w($rel), 0755, true)) { $zle[] = "$druh/s (zápis)"; continue; }
            $meno = 'sonda-' . bin2hex(random_bytes(6)) . '.' . $ext;
            if (@file_put_contents(Nastavenie::w("$rel/$meno"), $obsah) === false) { $zle[] = "$druh/s (zápis)"; continue; }
            $r = self::sonda(self::zakladUrl() . "$rel/$meno", true);
            @unlink(Nastavenie::w("$rel/$meno"));
            if ($r === null || $r[0] !== 200 || !str_starts_with(strtolower($r[2] ?? ''), $typ)) $zle[] = "$druh/s (odpoveď " . ($r[0] ?? '–') . ')';
        }
        if ($zle) return self::bod('sonda-subory', $nazov, 'chyba', 'Nahraté súbory sa z webu nedajú otvoriť: ' . implode(', ', $zle) . '. Skontrolujte .htaccess a web.config v img/s a pdf/s (README, časť Správa webu) alebo zavolajte programátora.');
        return self::bod('sonda-subory', $nazov, 'ok', 'Overené (WebP a PDF prídu so správnym typom).');
    }

    private static function sondaSpustania(): array
    {
        if (!self::kontrolaAdresy()) return self::bod('sonda-php', 'V priečinkoch fotiek a PDF sa nespúšťajú programy', 'upozornenie', 'Server to nevie overiť sám; ochranné súbory sú nahraté s balíkom.', false);
        $zle = []; $neovereny = false;
        foreach (['img/s', 'pdf/s'] as $p) {
            $d = Nastavenie::w($p);
            if (!is_dir($d)) @mkdir($d, 0755, true);
            $meno = 'sonda-' . bin2hex(random_bytes(6)) . '.php';
            if (@file_put_contents("$d/$meno", "<?php echo 'BE'.'ZI';") === false) { $zle[] = $p; continue; }
            $r = self::sonda(self::zakladUrl() . "$p/$meno");
            @unlink("$d/$meno");
            if ($r === null) $neovereny = true;
            elseif (str_contains($r[1], 'BEZI')) $zle[] = $p;
        }
        if ($zle) return self::bod('sonda-php', 'V priečinkoch fotiek a PDF sa nespúšťajú programy', 'chyba', 'V ' . implode(', ', $zle) . ' sa spúšťa PHP. Nahrajte .htaccess a web.config z balíka do img/s a pdf/s.');
        if ($neovereny) return self::bod('sonda-php', 'V priečinkoch fotiek a PDF sa nespúšťajú programy', 'upozornenie', 'Server to nevie overiť sám; ochranné súbory sú nahraté s balíkom.', false);
        return self::bod('sonda-php', 'V priečinkoch fotiek a PDF sa nespúšťajú programy', 'ok', 'Overené.');
    }

    private static function sondaJadra(): array
    {
        if (!self::kontrolaAdresy()) return self::bod('sonda-jadro', 'Súbory správy sú z webu zakázané', 'upozornenie', 'Server to nevie overiť sám.', false);
        $r = self::sonda(self::zakladUrl() . 'sprava/kostry/konstanty.json');
        if ($r === null) return self::bod('sonda-jadro', 'Súbory správy sú z webu zakázané', 'upozornenie', 'Server to nevie overiť sám.', false);
        $ok = $r[0] >= 400;
        return self::bod('sonda-jadro', 'Súbory správy sú z webu zakázané', $ok ? 'ok' : 'chyba', $ok ? 'Overené.' : 'Súbory sprava/ sa dajú otvoriť z internetu. Nahrajte sprava/.htaccess a sprava/web.config z balíka.');
    }

    /** Súhrn pre neprihláseného: počet povinných chýb. */
    public static function suhrn(array $body): array
    {
        $chyby = array_values(array_filter($body, fn($x) => $x['povinne'] && $x['stav'] === 'chyba'));
        return ['pripravene' => !$chyby, 'pocet' => count($chyby)];
    }
}
