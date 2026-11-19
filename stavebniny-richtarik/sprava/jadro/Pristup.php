<?php
// Prístup do správy: jednorazový kód zo súboru na hostingu (dôkaz prístupu k FTP), heslo, relácia, zapamätané
// zariadenie, CSRF, obmedzenie pokusov a hlavičky. Žiadne predvolené heslo ani účet – kým neexistuje ucty.json,
// dá sa urobiť len prvé nastavenie s kódom zo súboru.
defined('SPRAVA') || exit;

final class Pristup
{
    const ABECEDA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const KOD_PLATNOST = ['prvy' => 86400, 'obnova' => 3600];
    const KOD_SUBOR = ['prvy' => 'PRVY-KOD.txt', 'obnova' => 'OBNOVA-KOD.txt'];
    const NECINNOST = 7200, NAJDLHSIE = 43200, ZARIADENIE_DNI = 30;
    const COOKIE_Z = 'rs_zariadenie';

    // ---------- tajomstvo inštalácie ----------
    public static function nastavenie(): array
    {
        $n = Ulozisko::citajJson(Nastavenie::d('nastavenie.json'), []);
        if (empty($n['tajomstvo'])) {
            $n = Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($d) {
                if (empty($d['tajomstvo'])) { $d['tajomstvo'] = bin2hex(random_bytes(32)); $d['vytvorene'] = time(); }
                return $d;
            }, []);
        }
        return $n;
    }

    /** Odtlačok náhodného hesla tým istým algoritmom: neznáme meno trvá rovnako dlho ako zlé heslo. */
    private static function atrapa(): string
    {
        $n = self::nastavenie();
        if (!empty($n['atrapa'])) return $n['atrapa'];
        $h = self::hashHesla(bin2hex(random_bytes(16)));
        Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($d) use ($h) { $d['atrapa'] = $d['atrapa'] ?? $h; return $d; });
        return $h;
    }

    private static function hmac(string $s): string
    {
        return hash_hmac('sha256', $s, self::nastavenie()['tajomstvo']);
    }

    public static function maUcet(): bool
    {
        $u = Ulozisko::citajJson(Nastavenie::d('ucty.json'), []);
        return !empty($u['ucty']);
    }

    // ---------- jednorazový kód ----------
    public static function normalizujKod(string $k): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper($k));
    }

    // Pokusy o kód sa počítajú podľa adresy (5 z jednej adresy, IPv6 po /64), spolu najviac 200: cudzí človek tak kód
    // majiteľa nespáli. Kód má 80 bitov, hádanie nemá zmysel ani pri 200 pokusoch.
    const KOD_POKUSY_IP = 5, KOD_POKUSY_SPOLU = 200;

    /** Stav kódu: null alebo ['druh', 'cas', 'pokusy', 'platne' (pre túto adresu), 'subor' (súbor s kódom existuje)] */
    public static function stavKodu(): ?array
    {
        $n = self::nastavenie();
        if (empty($n['kod'])) return null;
        $k = $n['kod'];
        $k['subor'] = is_file(Nastavenie::d(self::KOD_SUBOR[$k['druh']]));
        $k['pokusy_ip'] = (int)($k['ip'][self::klucIp()] ?? 0);
        $k['platne'] = time() - $k['cas'] < self::KOD_PLATNOST[$k['druh']] && $k['pokusy'] < self::KOD_POKUSY_SPOLU
                       && $k['pokusy_ip'] < self::KOD_POKUSY_IP && $k['subor'];
        return $k;
    }

    /** Vytvorí kód a zapíše ho do súboru v priečinku dát. Vráti null alebo vetu, prečo sa nedá. */
    public static function vytvorKod(string $druh): ?string
    {
        if (!isset(self::KOD_PLATNOST[$druh])) return 'Neznámy druh kódu.';
        if ($druh === 'prvy' && self::maUcet()) return 'Správa už je nastavená. Prihláste sa.';
        $k = self::stavKodu();
        if ($k && $k['platne'] && $k['druh'] === $druh) return null;   // platný kód už je v súbore
        // Kým súbor s kódom existuje, nový kód najskôr o 15 min. Kto súbor zmaže cez FTP (dôkaz prístupu k hostingu),
        // dostane nový kód hneď – preto majiteľa nezdrží ani cudzí človek, ani zatvorený prehliadač.
        if ($k && $k['subor'] && time() - $k['cas'] < 900)
            return 'Nový kód sa dá vytvoriť najskôr o ' . ceil((900 - (time() - $k['cas'])) / 60) . ' min.' . (Nastavenie::cudziVlastnik() ? '' : ' Ak ho potrebujete hneď, zmažte cez FTP (FileZilla alebo webftp.forpsi.com) súbor ' . self::KOD_SUBOR[$k['druh']] . ' a ťuknite znova.');
        $kod = '';
        for ($i = 0; $i < 16; $i++) $kod .= self::ABECEDA[random_int(0, strlen(self::ABECEDA) - 1)];
        $pekny = implode('-', str_split($kod, 4));
        $do = date('j. n. Y H:i', time() + self::KOD_PLATNOST[$druh]);
        foreach (self::KOD_SUBOR as $s) @unlink(Nastavenie::d($s));
        $text = "Overovací kód pre správu webu Stavebniny Richtárik\r\n\r\nKód: $pekny\r\n\r\n"
              . "Platí do: $do. Kód opíšte do správy webu. Po použití sa tento súbor sám zmaže.\r\n"
              . "Ak ste kód nežiadali, tento súbor zmažte.\r\n";
        Ulozisko::zapis(Nastavenie::d(self::KOD_SUBOR[$druh]), $text);
        @chmod(Nastavenie::d(self::KOD_SUBOR[$druh]), Nastavenie::cudziVlastnik() ? 0604 : 0600);
        Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($n) use ($kod, $druh) {
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
        Ulozisko::upravJson(Nastavenie::d('nastavenie.json'), function ($n) use ($druh, $zadany, $ip, &$ok, &$platny) {
            $k = $n['kod'] ?? null;
            if (!$k || $k['druh'] !== $druh || time() - $k['cas'] >= self::KOD_PLATNOST[$druh] || $k['pokusy'] >= self::KOD_POKUSY_SPOLU) return $n;
            if ((int)($k['ip'][$ip] ?? 0) >= self::KOD_POKUSY_IP) return $n;
            if (!is_file(Nastavenie::d(self::KOD_SUBOR[$druh]))) return $n;
            $platny = true;
            if (strlen($zadany) === 16 && hash_equals($k['hash'], hash_hmac('sha256', $zadany, $n['tajomstvo']))) {
                $ok = true; unset($n['kod']);
            } else {
                $n['kod']['pokusy']++;
                $n['kod']['ip'] = array_slice((array)($k['ip'] ?? []), -500, null, true);   // najviac 500 adries
                $n['kod']['ip'][$ip] = (int)($k['ip'][$ip] ?? 0) + 1;
            }
            return $n;
        });
        if ($ok) { @unlink(Nastavenie::d(self::KOD_SUBOR[$druh])); Dennik::zapis('kod-overeny', ['druh' => $druh]); }
        else {
            if ($platny) Dennik::zapis('kod-zly', ['druh' => $druh]);   // pokus bez platného kódu sa nezapisuje (denník nerastie)
            usleep(random_int(300000, 700000));
        }
        return $ok;
    }

    // ---------- heslo ----------
    public static function chybaHesla(string $h, string $h2, string $meno): ?string
    {
        if ($h !== $h2) return 'Heslá sa nezhodujú. Napíšte ho dvakrát rovnako.';
        if (mb_strlen($h) < 10) return 'Heslo musí mať aspoň 10 znakov. Pomôžu tri slová, napríklad „palety-cement-krškany“.';
        if (mb_strlen($h) > 200) return 'Heslo je príliš dlhé.';
        $m = mb_strtolower($h);
        $host = strtolower(preg_replace('/^www\./', '', explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]));
        foreach (['richtarik', 'richtárik', 'stavebniny', 'heslo', 'password', '12345', 'qwert'] as $z) if (str_contains($m, $z)) return 'Heslo nesmie obsahovať názov firmy ani slovo „heslo“.';
        if ($host !== '' && str_contains($m, explode('.', $host)[0])) return 'Heslo nesmie obsahovať adresu webu.';
        if ($meno !== '' && str_contains($m, mb_strtolower($meno))) return 'Heslo nesmie obsahovať vaše meno.';
        $caste = @file(__DIR__ . '/caste-hesla.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        if (in_array($m, $caste, true)) return 'Toto heslo je príliš známe. Zvoľte iné.';
        if (count(array_unique(mb_str_split($m))) < 5) return 'Heslo je príliš jednoduché.';
        return null;
    }

    private static function hashHesla(string $h): string
    {
        return password_hash($h, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
    }

    /** Meno pri porovnaní: bez ohľadu na veľké písmená, diakritiku a medzery navyše („mario“ = „Mário“). */
    public static function klucMena(string $meno): string
    {
        return Kontrola::slug(trim($meno) . ' x', 90);   // „ x“: prázdne meno nikdy nesplynie s náhradným slugom
    }

    public static function chybaMena(string $meno): ?string
    {
        if (!preg_match('/^[\p{L}0-9 ._-]{2,40}$/u', $meno)) return 'Meno musí mať 2 až 40 písmen alebo číslic.';
        return null;
    }

    /** Prvé nastavenie alebo obnova: nastaví účet (pri obnove prepíše heslo a odhlási všetky zariadenia). */
    public static function nastavUcet(string $meno, string $heslo, bool $obnova): void
    {
        Ulozisko::upravJson(Nastavenie::d('ucty.json'), function ($u) use ($meno, $heslo, $obnova) {
            $u['ucty'] = $u['ucty'] ?? [];
            $najdeny = false;
            foreach ($u['ucty'] as &$x) if (self::klucMena($x['meno']) === self::klucMena($meno) || ($obnova && count($u['ucty']) === 1)) {
                $x['meno'] = $meno; $x['hash'] = self::hashHesla($heslo); $x['heslo_zmenene'] = time(); $najdeny = true;
            }
            unset($x);
            if (!$najdeny) {
                if (!$obnova && count($u['ucty']) >= 3) throw new RuntimeException('Najviac 3 osoby.');
                $u['ucty'][] = ['meno' => $meno, 'hash' => self::hashHesla($heslo), 'vytvorene' => time(), 'heslo_zmenene' => time()];
            }
            return $u;
        }, []);
        if ($obnova) self::odhlasVsetko();
        self::atrapa();   // pripraví odtlačok pre neznáme mená (rovnaký čas odpovede)
        Dennik::zapis($obnova ? 'heslo-obnovene' : 'ucet-vytvoreny', ['meno' => $meno]);
    }

    public static function zmenHeslo(string $meno, string $stare, string $nove, string $nove2): ?string
    {
        if (!self::overHeslo($meno, $stare)) return 'Súčasné heslo nie je správne.';
        if ($e = self::chybaHesla($nove, $nove2, $meno)) return $e;
        self::nastavUcet($meno, $nove, false);
        self::odhlasVsetko($meno);
        Dennik::zapis('heslo-zmenene', ['meno' => $meno]);
        return null;
    }

    public static function overHeslo(string $meno, string $heslo): bool
    {
        $u = Ulozisko::citajJson(Nastavenie::d('ucty.json'), []);
        $hash = null;
        foreach ($u['ucty'] ?? [] as $x) if (self::klucMena($x['meno']) === self::klucMena($meno)) { $hash = $x['hash']; $meno = $x['meno']; }
        if ($hash === null) { password_verify($heslo, self::atrapa()); return false; }
        $ok = password_verify($heslo, $hash);
        if ($ok && password_needs_rehash($hash, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT))
            Ulozisko::upravJson(Nastavenie::d('ucty.json'), function ($u) use ($meno, $heslo) {
                foreach ($u['ucty'] as &$x) if ($x['meno'] === $meno) $x['hash'] = self::hashHesla($heslo);
                return $u;
            });
        return $ok;
    }

    public static function menoUctu(string $meno): string
    {
        $u = Ulozisko::citajJson(Nastavenie::d('ucty.json'), []);
        foreach ($u['ucty'] ?? [] as $x) if (self::klucMena($x['meno']) === self::klucMena($meno)) return $x['meno'];
        return trim($meno);
    }

    // ---------- pokusy ----------
    private static function klucIp(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        if (str_contains($ip, ':')) { $b = @inet_pton($ip); if ($b !== false) $ip = bin2hex(substr($b, 0, 8)); }
        return substr(self::hmac('ip:' . $ip), 0, 32);
    }

    /** Null alebo veta, prečo sa teraz nedá prihlásiť heslom. */
    public static function blokovane(): ?string
    {
        $p = Ulozisko::citajJson(Nastavenie::d('pokusy.json'), []);
        $k = $p[self::klucIp()] ?? null;
        if ($k && ($k['do'] ?? 0) > time()) return 'Príliš veľa nesprávnych pokusov z tohto pripojenia. Skúste to znova o ' . ceil(($k['do'] - time()) / 60) . ' min.';
        // Celkový zákaz pre všetkých už nie je: pokusy z cudzích adries nesmú zamknúť majiteľa. Proti hádaniu chránia
        // limit podľa adresy, spomalenie každého zlého pokusu a heslo aspoň 10 znakov mimo zoznamu známych hesiel.
        return null;
    }

    public static function zlyPokus(): void
    {
        $kl = self::klucIp();
        Ulozisko::upravJson(Nastavenie::d('pokusy.json'), function ($p) use ($kl) {
            $t = time();
            $k = $p[$kl] ?? ['n' => 0, 'do' => 0];
            $k['n']++; $k['t'] = $t;
            if ($k['n'] >= 10) $k['do'] = $t + 3600; elseif ($k['n'] >= 5) $k['do'] = $t + 900;
            $p[$kl] = $k;
            unset($p['_hodina'], $p['_globalne_do']);
            foreach ($p as $kk => $v) if (is_array($v) && max((int)($v['do'] ?? 0), (int)($v['t'] ?? 0)) < $t - 86400 && $kk !== $kl) unset($p[$kk]);   // staré adresy preč
            $p['_od_prihlasenia'] = min(100000, ($p['_od_prihlasenia'] ?? 0) + 1);
            return $p;
        }, []);
        usleep(random_int(300000, 700000));
    }

    public static function dobryPokus(): int
    {
        $kl = self::klucIp(); $n = 0;
        Ulozisko::upravJson(Nastavenie::d('pokusy.json'), function ($p) use ($kl, &$n) {
            unset($p[$kl]);
            $n = (int)($p['_od_prihlasenia'] ?? 0);
            $p['_od_prihlasenia'] = 0;
            return $p;
        }, []);
        return $n;
    }

    // ---------- relácia ----------
    public static function cestaCookie(): string
    {
        $s = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/sprava/index.php'));
        return rtrim($s, '/') . '/';
    }

    public static function startRelacie(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) return;
        $https = Nastavenie::https();
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_trans_sid', '0');
        ini_set('session.sid_length', '48');
        ini_set('session.sid_bits_per_character', '6');
        ini_set('session.gc_maxlifetime', (string)self::NECINNOST);
        ini_set('session.gc_probability', '1');   // vlastný priečinok relácií upratuje PHP (1 % požiadaviek), aj keď je
        ini_set('session.gc_divisor', '100');     // v nastavení servera upratovanie vypnuté (gc_probability = 0)
        session_save_path(Nastavenie::d('relacie'));
        session_name($https ? '__Secure-rs_sprava' : 'rs_sprava');
        session_set_cookie_params(['lifetime' => 0, 'path' => self::cestaCookie(), 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
        session_start();
        $t = time();
        if (!empty($_SESSION['ucet'])) {
            if ($t - ($_SESSION['aktivita'] ?? 0) > self::NECINNOST || $t - ($_SESSION['od'] ?? 0) > self::NAJDLHSIE || ($_SESSION['heslo_v'] ?? 0) < self::verziaHesla($_SESSION['ucet'])) {
                $_SESSION = []; session_regenerate_id(true);
            } else $_SESSION['aktivita'] = $t;
        }
        if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
        if (empty($_SESSION['ucet'])) self::prihlasZariadenim();
    }

    private static function verziaHesla(string $meno): int
    {
        $u = Ulozisko::citajJson(Nastavenie::d('ucty.json'), []);
        foreach ($u['ucty'] ?? [] as $x) if ($x['meno'] === $meno) return (int)($x['heslo_zmenene'] ?? 0);
        return PHP_INT_MAX;   // účet neexistuje → relácia neplatí
    }

    public static function prihlas(string $meno, bool $zapamatat): int
    {
        session_regenerate_id(true);
        $_SESSION['ucet'] = $meno; $_SESSION['od'] = time(); $_SESSION['aktivita'] = time();
        $_SESSION['heslo_v'] = self::verziaHesla($meno);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        if ($zapamatat) self::noveZariadenie($meno);
        Dennik::zapis('prihlasenie', ['meno' => $meno]);
        return self::dobryPokus();
    }

    public static function ucet(): ?string { return $_SESSION['ucet'] ?? null; }

    public static function odhlas(): void
    {
        $z = $_COOKIE[self::COOKIE_Z] ?? '';
        if ($z !== '') { [$id] = explode('.', $z . '.'); self::zmazZariadenie($id); }
        self::cookie(self::COOKIE_Z, '', time() - 3600);
        Dennik::zapis('odhlasenie', []);
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }

    private static function cookie(string $meno, string $hodnota, int $do): void
    {
        setcookie($meno, $hodnota, ['expires' => $do, 'path' => self::cestaCookie(), 'secure' => Nastavenie::https(), 'httponly' => true, 'samesite' => 'Strict']);
    }

    // ---------- zapamätané zariadenie ----------
    private static function noveZariadenie(string $meno, ?string $id = null): void
    {
        $id = $id ?? bin2hex(random_bytes(8));
        $tajne = bin2hex(random_bytes(32));
        $ua = substr(preg_replace('/[^\w .;:\/()-]/u', '', $_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 120);
        Ulozisko::upravJson(Nastavenie::d('zariadenia.json'), function ($z) use ($id, $tajne, $meno, $ua) {
            $z = array_values(array_filter($z ?: [], fn($x) => $x['do'] > time()));
            $najdene = false;
            foreach ($z as &$x) if ($x['id'] === $id) {
                $x['stare'] = array_slice(array_merge([$x['hash']], $x['stare'] ?? []), 0, 5);
                $x['hash'] = hash('sha256', $tajne); $x['do'] = time() + self::ZARIADENIE_DNI * 86400; $x['pouzite'] = time(); $najdene = true;
            }
            unset($x);
            if (!$najdene) $z[] = ['id' => $id, 'ucet' => $meno, 'hash' => hash('sha256', $tajne), 'stare' => [], 'od' => time(), 'pouzite' => time(), 'do' => time() + self::ZARIADENIE_DNI * 86400, 'popis' => $ua];
            return $z;
        }, []);
        self::cookie(self::COOKIE_Z, $id . '.' . $tajne, time() + self::ZARIADENIE_DNI * 86400);
    }

    private static function prihlasZariadenim(): void
    {
        $c = $_COOKIE[self::COOKIE_Z] ?? '';
        if (!preg_match('/^([0-9a-f]{16})\.([0-9a-f]{64})$/', $c, $m)) return;
        $z = Ulozisko::citajJson(Nastavenie::d('zariadenia.json'), []);
        foreach ($z as $x) {
            if ($x['id'] !== $m[1]) continue;
            $h = hash('sha256', $m[2]);
            if ($x['do'] > time() && hash_equals($x['hash'], $h) && self::verziaHesla($x['ucet']) < PHP_INT_MAX) {
                session_regenerate_id(true);
                $_SESSION['ucet'] = $x['ucet']; $_SESSION['od'] = time(); $_SESSION['aktivita'] = time();
                $_SESSION['heslo_v'] = self::verziaHesla($x['ucet']);
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
                $_SESSION['zariadenie'] = 1;
                self::noveZariadenie($x['ucet'], $x['id']);   // rotácia tokenu
                return;
            }
            foreach ($x['stare'] ?? [] as $s) if (hash_equals($s, $h)) {   // už vymenený token = možná krádež
                self::zmazZariadenie($x['id']);
                Dennik::zapis('zariadenie-zneuzitie', ['id' => $x['id']]);
            }
        }
        self::cookie(self::COOKIE_Z, '', time() - 3600);
    }

    public static function zariadenia(string $meno): array
    {
        return array_values(array_filter(Ulozisko::citajJson(Nastavenie::d('zariadenia.json'), []), fn($x) => $x['ucet'] === $meno && $x['do'] > time()));
    }

    public static function zmazZariadenie(string $id): void
    {
        Ulozisko::upravJson(Nastavenie::d('zariadenia.json'), fn($z) => array_values(array_filter($z ?: [], fn($x) => $x['id'] !== $id)), []);
    }

    public static function odhlasVsetko(?string $meno = null): void
    {
        Ulozisko::upravJson(Nastavenie::d('zariadenia.json'), fn($z) => $meno === null ? [] : array_values(array_filter($z ?: [], fn($x) => $x['ucet'] !== $meno)), []);
        $moja = session_id();
        foreach (glob(Nastavenie::d('relacie/sess_*')) ?: [] as $f) if ($moja === '' || basename($f) !== 'sess_' . $moja) @unlink($f);
    }

    // ---------- CSRF a hlavičky ----------
    public static function csrf(): string { return $_SESSION['csrf'] ?? ''; }

    public static function overPost(): bool
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') return false;
        $t = $_POST['_t'] ?? '';
        if (!is_string($t) || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) return false;
        $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
        if ($site !== '' && !in_array($site, ['same-origin', 'none'], true)) return false;
        $o = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($o !== '' && $o !== 'null') {
            $host = $_SERVER['HTTP_HOST'] ?? '';
            if (parse_url($o, PHP_URL_HOST) . (parse_url($o, PHP_URL_PORT) ? ':' . parse_url($o, PHP_URL_PORT) : '') !== $host) return false;
        }
        return true;
    }

    public static function hlavicky(string $csp = ''): void
    {
        header('Cache-Control: no-store, max-age=0');
        header('X-Robots-Tag: noindex, nofollow');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: same-origin');
        header('X-Content-Type-Options: nosniff');
        header('Permissions-Policy: camera=(self), geolocation=(), microphone=()');
        header('Content-Security-Policy: ' . ($csp ?: "default-src 'self'; img-src 'self' blob: data:; script-src 'self'; style-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"));
        header_remove('X-Powered-By');
    }
}
