<?php
// Prístup do správy: jednorazový kód zo súboru na hostingu (dôkaz prístupu k FTP alebo správcovi súborov), heslo,
// relácia, CSRF, obmedzenie pokusov, dôkaz HTTPS a hlavičky. Žiadne predvolené heslo ani účet – kým neexistuje
// ucty.php, dá sa urobiť len prvé nastavenie s kódom zo súboru.
defined('B30S') || exit;

final class Pristup
{
    const ABECEDA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const KOD_PLATNOST = ['prvy' => 86400, 'obnova' => 3600];
    const KOD_SUBOR = ['prvy' => 'PRVY-KOD.txt', 'obnova' => 'OBNOVA-KOD.txt'];
    const KOD_POKUSY_IP = 5, KOD_POKUSY_SPOLU = 200, KOD_ZNOVA = 900;
    const NECINNOST = 7200, NAJDLHSIE = 43200, PO_KODE = 1800;
    const COOKIE = 'b30s', COOKIE_HTTPS = '__Secure-b30h';

    // ---------- tajomstvo inštalácie ----------
    public static function stav(): array
    {
        $n = Ulozisko::citaj(Miesto::u('pristup.php'), []);
        if (empty($n['tajomstvo'])) {
            $n = Ulozisko::uprav(Miesto::u('pristup.php'), function ($d) {
                if (empty($d['tajomstvo'])) { $d['tajomstvo'] = bin2hex(random_bytes(32)); $d['vytvorene'] = time(); }
                return $d;
            });
        }
        return $n;
    }

    /** Odtlačok náhodného hesla tým istým algoritmom: neznáme meno trvá rovnako dlho ako zlé heslo. */
    private static function atrapa(): string
    {
        $n = self::stav();
        if (!empty($n['atrapa'])) return $n['atrapa'];
        $h = self::hashHesla(bin2hex(random_bytes(16)));
        Ulozisko::uprav(Miesto::u('pristup.php'), function ($d) use ($h) { $d['atrapa'] = $d['atrapa'] ?? $h; return $d; });
        return $h;
    }

    private static function hmac(string $s): string { return hash_hmac('sha256', $s, self::stav()['tajomstvo']); }

    public static function ucty(): array { return (array) (Ulozisko::citaj(Miesto::u('ucty.php'), [])['ucty'] ?? []); }
    public static function maUcet(): bool { return (bool) self::ucty(); }

    // ---------- adresa návštevníka (len ako odtlačok) ----------
    /** Adresa pre počítadlá pokusov; IPv6 po /64. Hlavičke X-Forwarded-For sa verí len od proxy z nastavenia. */
    public static function ip(): string
    {
        $r = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        $proxy = (array) (Ulozisko::citaj(Miesto::u('nastavenie.php'), [])['proxy'] ?? []);
        $xff = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
        if ($xff !== '' && in_array($r, $proxy, true)) { $c = array_map('trim', explode(',', $xff)); $p = end($c); if (filter_var($p, FILTER_VALIDATE_IP)) $r = $p; }
        if (str_contains($r, ':')) { $b = @inet_pton($r); if ($b !== false) $r = bin2hex(substr($b, 0, 8)); }
        return $r;
    }
    private static function klucIp(): string { return substr(self::hmac('ip:' . self::ip()), 0, 32); }
    public static function odtlacokIp(): string { return Miesto::$udaje === '' ? '' : substr(self::klucIp(), 0, 12); }

    // ---------- jednorazový kód ----------
    public static function normalizujKod(string $k): string { return (string) preg_replace('/[^A-Z0-9]/', '', strtoupper($k)); }

    /** Stav kódu: null alebo ['druh', 'cas', 'pokusy', 'pokusy_ip', 'subor', 'platne' (pre túto adresu)] */
    public static function stavKodu(): ?array
    {
        $n = self::stav();
        if (empty($n['kod'])) return null;
        $k = $n['kod'];
        $k['subor'] = is_file(Miesto::u(self::KOD_SUBOR[$k['druh']]));
        $k['pokusy_ip'] = (int) ($k['ip'][self::klucIp()] ?? 0);
        $k['platne'] = time() - $k['cas'] < self::KOD_PLATNOST[$k['druh']] && $k['pokusy'] < self::KOD_POKUSY_SPOLU
                       && $k['pokusy_ip'] < self::KOD_POKUSY_IP && $k['subor'];
        return $k;
    }

    /** Vytvorí kód a zapíše ho do súboru v priečinku údajov. Vráti null alebo vetu, prečo sa nedá. */
    public static function vytvorKod(string $druh): ?string
    {
        if (!isset(self::KOD_PLATNOST[$druh])) return 'Neznámy druh kódu.';
        if ($druh === 'prvy' && self::maUcet()) return 'Správa už je nastavená. Prihlás sa.';
        if ($druh === 'obnova' && !self::maUcet()) return 'Správa ešte nie je nastavená.';
        $k = self::stavKodu();
        if ($k && $k['platne'] && $k['druh'] === $druh) return null;   // platný kód už je v súbore
        // Kým súbor s kódom existuje, nový kód najskôr o 15 minút. Kto súbor zmaže cez FTP (dôkaz prístupu k hostingu),
        // dostane nový kód hneď – majiteľa tak nezdrží ani cudzí človek, ktorý minul pokusy.
        if ($k && $k['subor'] && time() - $k['cas'] < self::KOD_ZNOVA)
            return 'Nový kód sa dá vytvoriť najskôr o ' . ceil((self::KOD_ZNOVA - (time() - $k['cas'])) / 60) . ' min. Ak ho potrebuješ hneď, zmaž cez FTP súbor ' . self::KOD_SUBOR[$k['druh']] . ' a ťukni znova.';
        $kod = '';
        for ($i = 0; $i < 16; $i++) $kod .= self::ABECEDA[random_int(0, strlen(self::ABECEDA) - 1)];
        $pekny = implode('-', str_split($kod, 4));
        $do = date('j. n. Y H:i', time() + self::KOD_PLATNOST[$druh]);
        foreach (self::KOD_SUBOR as $s) @unlink(Miesto::u($s));
        $text = "Overovací kód pre správu webu Barbershop 30\r\n\r\nKód: $pekny\r\n\r\n"
              . "Platí do: $do. Kód opíš do správy webu. Po použití sa tento súbor sám zmaže.\r\n"
              . "Kód nikomu neposielaj. Ak si ho nežiadal, tento súbor zmaž.\r\n";
        Ulozisko::zapis(Miesto::u(self::KOD_SUBOR[$druh]), $text);
        @chmod(Miesto::u(self::KOD_SUBOR[$druh]), 0600);
        Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) use ($kod, $druh) {
            $n['kod'] = ['druh' => $druh, 'hash' => hash_hmac('sha256', $kod, $n['tajomstvo']), 'cas' => time(), 'pokusy' => 0, 'ip' => []];
            return $n;
        });
        Dennik::zapis('kod-vytvoreny', ['druh' => $druh]);
        return null;
    }

    /** Overí kód; pri úspechu kód zneplatní a súbor zmaže. */
    public static function overKod(string $druh, string $zadany): bool
    {
        $ok = false; $platny = false;
        $zadany = self::normalizujKod($zadany);
        $ip = self::klucIp();
        Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) use ($druh, $zadany, $ip, &$ok, &$platny) {
            $k = $n['kod'] ?? null;
            if (!$k || $k['druh'] !== $druh || time() - $k['cas'] >= self::KOD_PLATNOST[$druh] || $k['pokusy'] >= self::KOD_POKUSY_SPOLU) return $n;
            if ((int) ($k['ip'][$ip] ?? 0) >= self::KOD_POKUSY_IP) return $n;
            if (!is_file(Miesto::u(self::KOD_SUBOR[$druh]))) return $n;
            $platny = true;
            if (strlen($zadany) === 16 && hash_equals($k['hash'], hash_hmac('sha256', $zadany, $n['tajomstvo']))) {
                $ok = true; unset($n['kod']);
            } else {
                $n['kod']['pokusy']++;
                $n['kod']['ip'] = array_slice((array) ($k['ip'] ?? []), -500, null, true);   // najviac 500 adries
                $n['kod']['ip'][$ip] = (int) ($k['ip'][$ip] ?? 0) + 1;
            }
            return $n;
        });
        if ($ok) { @unlink(Miesto::u(self::KOD_SUBOR[$druh])); Dennik::zapis('kod-overeny', ['druh' => $druh]); }
        else {
            if ($platny) Dennik::zapis('kod-zly', ['druh' => $druh]);   // pokus bez platného kódu sa nezapisuje (denník nerastie)
            self::zdrz();
        }
        return $ok;
    }

    /** Náhodné zdržanie po chybe (v testoch z príkazového riadka sa nečaká). */
    private static function zdrz(): void { if (PHP_SAPI !== 'cli') usleep(random_int(300000, 700000)); }

    // ---------- heslo ----------
    public static function chybaHesla(string $h, string $h2, string $meno = ''): ?string
    {
        if ($h !== $h2) return 'Heslá sa nezhodujú. Napíš ho dvakrát rovnako.';
        if (mb_strlen($h) < 10) return 'Heslo musí mať aspoň 10 znakov. Pomôžu tri slová, napríklad „noznice-hreben-mostna“.';
        if (mb_strlen($h) > 200) return 'Heslo je príliš dlhé.';
        $m = mb_strtolower($h);
        foreach (['barbershop', 'barber30', 'lajko', 'heslo', 'password', '12345', 'qwert'] as $z) if (str_contains($m, $z)) return 'Heslo nesmie obsahovať názov podniku ani slovo „heslo“.';
        $host = strtolower((string) preg_replace('/^www\./', '', (string) parse_url((string) Miesto::ciel()['zaklad'], PHP_URL_HOST)));
        if ($host !== '' && str_contains($m, explode('.', $host)[0])) return 'Heslo nesmie obsahovať adresu webu.';
        if ($meno !== '' && mb_strlen($meno) >= 3 && str_contains($m, mb_strtolower($meno))) return 'Heslo nesmie obsahovať tvoje meno.';
        $caste = @file(__DIR__ . '/caste-hesla.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        if (in_array($m, $caste, true)) return 'Toto heslo je príliš známe. Zvoľ iné.';
        if (count(array_unique(mb_str_split($m))) < 5) return 'Heslo je príliš jednoduché.';
        return null;
    }

    public static function hashHesla(string $h): string
    {
        return password_hash($h, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
    }

    /** Meno pri porovnaní: bez ohľadu na veľké písmená a medzery navyše. */
    public static function klucMena(string $meno): string { return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', $meno))); }

    public static function chybaMena(string $meno): ?string
    {
        return preg_match('/^[\p{L}0-9 ._-]{2,40}$/u', $meno) ? null : 'Meno musí mať 2 až 40 písmen alebo číslic.';
    }

    /** Prvé nastavenie alebo obnova: nastaví účet (pri obnove prepíše heslo a odhlási všetky zariadenia). */
    public static function nastavUcet(string $meno, string $heslo, bool $obnova): void
    {
        Ulozisko::uprav(Miesto::u('ucty.php'), function ($u) use ($meno, $heslo, $obnova) {
            $u['ucty'] = $u['ucty'] ?? [];
            $najdeny = false;
            foreach ($u['ucty'] as &$x) if (self::klucMena($x['meno']) === self::klucMena($meno) || ($obnova && count($u['ucty']) === 1)) {
                $x['meno'] = $meno; $x['hash'] = self::hashHesla($heslo); $x['heslo_zmenene'] = time(); $najdeny = true;
            }
            unset($x);
            if (!$najdeny) {
                if (count($u['ucty']) >= 3) throw new RuntimeException('Najviac 3 osoby.');
                $u['ucty'][] = ['meno' => $meno, 'hash' => self::hashHesla($heslo), 'vytvorene' => time(), 'heslo_zmenene' => time()];
            }
            return $u;
        });
        if ($obnova) self::odhlasVsetko();
        self::atrapa();   // pripraví odtlačok pre neznáme mená (rovnaký čas odpovede)
        Dennik::zapis($obnova ? 'heslo-obnovene' : 'ucet-vytvoreny', ['meno' => $meno]);
    }

    public static function zmenHeslo(string $meno, string $stare, string $nove, string $nove2): ?string
    {
        if (!self::overHeslo($meno, $stare)) return 'Súčasné heslo nie je správne.';
        if ($e = self::chybaHesla($nove, $nove2, $meno)) return $e;
        self::nastavUcet($meno, $nove, false);
        self::odhlasVsetko();
        $_SESSION['heslo_v'] = self::verziaHesla($meno);
        Dennik::zapis('heslo-zmenene', ['meno' => $meno]);
        return null;
    }

    public static function overHeslo(string $meno, string $heslo): bool
    {
        $hash = null;
        foreach (self::ucty() as $x) if (self::klucMena($x['meno']) === self::klucMena($meno)) { $hash = $x['hash']; $meno = $x['meno']; }
        if ($hash === null) { password_verify($heslo, self::atrapa()); return false; }
        $ok = password_verify($heslo, $hash);
        if ($ok && password_needs_rehash($hash, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT))
            Ulozisko::uprav(Miesto::u('ucty.php'), function ($u) use ($meno, $heslo) {
                foreach ($u['ucty'] as &$x) if ($x['meno'] === $meno) $x['hash'] = self::hashHesla($heslo);
                return $u;
            });
        return $ok;
    }

    public static function menoUctu(string $meno): string
    {
        foreach (self::ucty() as $x) if (self::klucMena($x['meno']) === self::klucMena($meno)) return $x['meno'];
        return trim($meno);
    }

    // ---------- pokusy o prihlásenie (5 zlých za 15 minút na adresu, 10 = hodina) ----------
    /** Null alebo veta, prečo sa teraz nedá prihlásiť heslom. */
    public static function blokovane(): ?string
    {
        $k = (self::stav()['pokusy'] ?? [])[self::klucIp()] ?? null;
        if ($k && ($k['do'] ?? 0) > time()) return 'Príliš veľa nesprávnych pokusov z tohto pripojenia. Skús to znova o ' . ceil(($k['do'] - time()) / 60) . ' min.';
        // Celkový zákaz pre všetkých nie je: pokusy z cudzích adries nesmú zamknúť majiteľa. Proti hádaniu chránia limit
        // podľa adresy, zdržanie každého zlého pokusu a heslo aspoň 10 znakov mimo zoznamu známych hesiel.
        return null;
    }

    public static function zlyPokus(): void
    {
        $kl = self::klucIp();
        Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) use ($kl) {
            $t = time(); $p = (array) ($n['pokusy'] ?? []);
            $k = $p[$kl] ?? ['n' => 0, 'do' => 0];
            if ($t - (int) ($k['t'] ?? $t) > 900 && ($k['do'] ?? 0) < $t) $k = ['n' => 0, 'do' => 0];   // okno 15 minút
            $k['n']++; $k['t'] = $t;
            if ($k['n'] >= 10) $k['do'] = $t + 3600; elseif ($k['n'] >= 5) $k['do'] = $t + 900;
            $p[$kl] = $k;
            foreach ($p as $kk => $v) if (max((int) ($v['do'] ?? 0), (int) ($v['t'] ?? 0)) < $t - 86400 && $kk !== $kl) unset($p[$kk]);
            $n['pokusy'] = array_slice($p, -2000, null, true);
            $n['od_prihlasenia'] = min(100000, (int) ($n['od_prihlasenia'] ?? 0) + 1);
            return $n;
        });
        Dennik::zapis('prihlasenie-zle');
        self::zdrz();
    }

    /** Vymaže počítadlo adresy; vráti počet zlých pokusov od posledného prihlásenia (ukáže sa majiteľovi). */
    public static function dobryPokus(): int
    {
        $kl = self::klucIp(); $pocet = 0;
        Ulozisko::uprav(Miesto::u('pristup.php'), function ($n) use ($kl, &$pocet) {
            unset($n['pokusy'][$kl]);
            $pocet = (int) ($n['od_prihlasenia'] ?? 0);
            $n['od_prihlasenia'] = 0;
            return $n;
        });
        return $pocet;
    }

    // ---------- HTTPS ----------
    /** Dôkaz HTTPS: cookie s príznakom Secure prehliadač cez nešifrované spojenie neprijme ani nepošle. Pod php -S sa
     *  HTTPS nevyžaduje. Hlavičkám (HTTPS, X-Forwarded-Proto) sa neverí samým – za proxy ich server nemusí vidieť. */
    public static function https(): bool
    {
        if (Miesto::lokalne() && getenv('B30_TEST_HTTPS') !== '1') return true;   // B30_TEST_HTTPS=1: test brány aj pod php -S
        return isset($_COOKIE[self::COOKIE_HTTPS]);
    }

    public static function posliDokazHttps(): void
    {
        setcookie(self::COOKIE_HTTPS, '1', ['expires' => time() + 86400 * 30, 'path' => '/sprava/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
    }

    // ---------- relácia ----------
    public static function startRelacie(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) return;
        $secure = !Miesto::lokalne();
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_trans_sid', '0');
        ini_set('session.sid_length', '48');
        ini_set('session.sid_bits_per_character', '6');
        ini_set('session.gc_maxlifetime', (string) self::NECINNOST);
        ini_set('session.gc_probability', '1');   // vlastný priečinok relácií upratuje PHP, aj keď to server má vypnuté
        ini_set('session.gc_divisor', '100');
        session_save_path(Miesto::u('relacie'));
        session_name(self::COOKIE);
        session_set_cookie_params(['lifetime' => 0, 'path' => '/sprava/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
        session_start();
        $t = time();
        if (!empty($_SESSION['ucet'])) {
            if ($t - ($_SESSION['aktivita'] ?? 0) > self::NECINNOST || $t - ($_SESSION['od'] ?? 0) > self::NAJDLHSIE || ($_SESSION['heslo_v'] ?? 0) < self::verziaHesla($_SESSION['ucet'])) {
                $_SESSION = []; session_regenerate_id(true);
            } else $_SESSION['aktivita'] = $t;
        }
        if (!empty($_SESSION['kod_overeny']) && $t - (int) $_SESSION['kod_overeny']['cas'] > self::PO_KODE) unset($_SESSION['kod_overeny']);
        if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }

    private static function verziaHesla(string $meno): int
    {
        foreach (self::ucty() as $x) if ($x['meno'] === $meno) return (int) ($x['heslo_zmenene'] ?? 0);
        return PHP_INT_MAX;   // účet neexistuje → relácia neplatí
    }

    public static function prihlas(string $meno): int
    {
        session_regenerate_id(true);
        unset($_SESSION['kod_overeny']);
        $_SESSION['ucet'] = $meno; $_SESSION['od'] = time(); $_SESSION['aktivita'] = time();
        $_SESSION['heslo_v'] = self::verziaHesla($meno);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        Dennik::zapis('prihlasenie', ['meno' => $meno]);
        return self::dobryPokus();
    }

    /** Po overení kódu zo súboru má relácia 30 minút na nastavenie mena a hesla. */
    public static function poKode(string $druh): void
    {
        session_regenerate_id(true);
        $_SESSION['kod_overeny'] = ['druh' => $druh, 'cas' => time()];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    public static function kodOvereny(string $druh): bool { return ($_SESSION['kod_overeny']['druh'] ?? '') === $druh; }

    public static function ucet(): ?string { return $_SESSION['ucet'] ?? null; }

    public static function odhlas(): void
    {
        Dennik::zapis('odhlasenie');
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }

    /** Odhlási všetky zariadenia okrem tejto relácie. */
    public static function odhlasVsetko(): void
    {
        $moja = session_id();
        foreach (glob(Miesto::u('relacie/sess_*')) ?: [] as $f) if ($moja === '' || basename($f) !== 'sess_' . $moja) @unlink($f);
    }

    // ---------- CSRF, pôvod a hlavičky ----------
    public static function csrf(): string { return $_SESSION['csrf'] ?? ''; }

    /** Pôvod požiadavky: prázdny (staršie prehliadače pri vlastnom formulári) alebo presne adresa z ciel.json
     *  (pod php -S adresa lokálneho servera). Nikdy sa neporovnáva s hlavičkou Host. */
    public static function povodOk(): bool
    {
        $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
        if ($site !== '' && !in_array($site, ['same-origin', 'none'], true)) return false;
        $o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
        if ($o === '') return true;
        return hash_equals(Miesto::povod(), $o);
    }

    /** Formulár stránok správy: metóda POST, token relácie v poli _t, vlastný pôvod. */
    public static function overPost(): bool
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') return false;
        $t = $_POST['_t'] ?? '';
        if (!is_string($t) || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) return false;
        return self::povodOk();
    }

    /** Koncový bod api.php: token relácie v hlavičke X-B30-CSRF, vlastný pôvod. */
    public static function overApi(): bool
    {
        $t = (string) ($_SERVER['HTTP_X_B30_CSRF'] ?? '');
        if ($t === '' || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) return false;
        return self::povodOk();
    }

    public static function hlavicky(string $csp = ''): void
    {
        header('Cache-Control: no-store, max-age=0');
        header('X-Robots-Tag: noindex, nofollow');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: same-origin');   // „no-referrer“ by z formulárov spravil Origin: null a pôvod by sa nedal overiť
        header('X-Content-Type-Options: nosniff');
        header('Permissions-Policy: camera=(), geolocation=(), microphone=()');
        header('Content-Security-Policy: ' . ($csp ?: "default-src 'self'; img-src 'self' data:; script-src 'none'; style-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"));
        header_remove('X-Powered-By');
    }
}
