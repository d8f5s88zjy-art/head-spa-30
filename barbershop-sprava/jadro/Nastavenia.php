<?php
// Nastavenie štyroch funkcií: kľúč API asistenta (len v údaje/tajne.php, nikdy sa nevracia späť), voľné termíny,
// heslo recepcie do adminu vernostnej kartičky (len odtlačok) a súhlasy (kto, kedy). Z nastavenia a z kontrol sa
// počíta cieľový stav prepínačov na webe (Prepinace).
defined('B30S') || exit;

final class Nastavenia
{
    const STROP = [100, 5000, 1500];   // denný strop otázok asistenta: najmenej, najviac, predvolene
    const RE_KLUC = '/^sk-ant-[A-Za-z0-9_-]{16,300}$/';

    public static function n(): array { return Ulozisko::citaj(Miesto::u('nastavenie.php'), []); }
    private static function tajne(): array { return Ulozisko::citaj(Miesto::u('tajne.php'), []); }

    /** Soľ limitov vznikne pri prvom čítaní (nie je to tajomstvo majiteľa, len náhodná hodnota inštalácie). */
    public static function sol(): string
    {
        $t = self::tajne();
        if (!empty($t['sol'])) return $t['sol'];
        return Ulozisko::uprav(Miesto::u('tajne.php'), function ($d) { $d['sol'] = $d['sol'] ?? bin2hex(random_bytes(16)); return $d; })['sol'];
    }

    // ---------- asistent ----------
    public static function maKluc(): bool { return !empty(self::tajne()['kluc']); }
    public static function klucOd(): int { return (int) (self::tajne()['kluc_od'] ?? 0); }
    public static function strop(): int { return max(self::STROP[0], min(self::STROP[1], (int) (self::n()['asistent']['strop'] ?? self::STROP[2]))); }
    public static function suhlasAsistent(): ?array { return self::n()['asistent']['suhlas'] ?? null; }

    /** Uloží kľúč (ak je zadaný), súhlas a denný strop. Vráti null alebo vetu chyby. Hodnota kľúča sa nikam nezapisuje okrem tajne.php. */
    public static function ulozAsistenta(string $kluc, bool $suhlas, int $strop, string $kto): ?string
    {
        $kluc = trim($kluc);
        if ($kluc !== '' && !preg_match(self::RE_KLUC, $kluc)) return 'Toto nevyzerá ako kľúč API (začína sa na sk-ant-). Skopíruj ho celý z účtu na platform.claude.com.';
        if ($kluc === '' && !self::maKluc() && $suhlas) return 'Najprv vlož kľúč API.';
        if (($kluc !== '' || self::maKluc()) && !$suhlas) return 'Asistent sa zapne len so súhlasom. Zaškrtni súhlas, alebo kľúč odstráň.';
        if ($strop < self::STROP[0] || $strop > self::STROP[1]) return 'Denný strop otázok musí byť od ' . self::STROP[0] . ' do ' . self::STROP[1] . '.';
        if ($kluc !== '') Ulozisko::uprav(Miesto::u('tajne.php'), function ($d) use ($kluc) { $d['kluc'] = $kluc; $d['kluc_od'] = time(); return $d; });
        Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) use ($suhlas, $strop, $kto) {
            $n['asistent']['strop'] = $strop;
            if ($suhlas && empty($n['asistent']['suhlas'])) $n['asistent']['suhlas'] = ['kto' => $kto, 'kedy' => date('c')];
            if (!$suhlas) unset($n['asistent']['suhlas']);
            return $n;
        });
        Dennik::zapis('asistent-nastaveny', ['novy_kluc' => $kluc !== '', 'suhlas' => $suhlas, 'strop' => $strop]);
        return null;
    }

    public static function odstranKluc(): void
    {
        Ulozisko::uprav(Miesto::u('tajne.php'), function ($d) { unset($d['kluc'], $d['kluc_od']); return $d; });
        Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) { unset($n['asistent']['suhlas']); return $n; });
        Dennik::zapis('asistent-kluc-odstraneny');
    }

    /** Dnešný počet otázok asistenta (z databázy limitov, len počet). */
    public static function otazokDnes(): ?int
    {
        $f = Miesto::u('asistent/limity.sqlite');
        if (!is_file($f) || !extension_loaded('pdo_sqlite')) return null;
        try {
            $pdo = new PDO('sqlite:' . $f, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 2]);
            $s = $pdo->prepare("SELECT COUNT(*) FROM limity WHERE kluc = 'spolu' AND cas >= ?");
            $s->execute([time() - 86400]);
            return (int) $s->fetchColumn();
        } catch (Throwable $e) { return null; }
    }

    // ---------- voľné termíny ----------
    public static function kalendarZapnuty(): bool { return !empty(self::n()['kalendar']['zapnute']); }
    public static function suhlasKalendar(): ?array { return self::n()['kalendar']['suhlas'] ?? null; }

    public static function ulozKalendar(bool $zapnut, bool $suhlas, string $kto): ?string
    {
        if ($zapnut && !$suhlas) return 'Voľné termíny sa zapnú len so súhlasom prevádzky. Zaškrtni súhlas.';
        Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) use ($zapnut, $kto) {
            $n['kalendar']['zapnute'] = $zapnut;
            if ($zapnut && empty($n['kalendar']['suhlas'])) $n['kalendar']['suhlas'] = ['kto' => $kto, 'kedy' => date('c')];
            if (!$zapnut) unset($n['kalendar']['suhlas']);
            return $n;
        });
        Dennik::zapis('kalendar-nastaveny', ['zapnute' => $zapnut]);
        return null;
    }

    /** Adresa rezervačného systému pre kalendár: pevná z ciel.json; pod php -S len z premennej B30_TEST_KALENDAR
     *  (falošný systém), takže z vývojového stroja sa na živý systém nedá dostať ani omylom. */
    public static function adresaKalendara(): string
    {
        if (Miesto::lokalne()) { $t = (string) getenv('B30_TEST_KALENDAR'); return preg_match('#^http://127\.0\.0\.1:\d{2,5}(/[A-Za-z0-9/_-]*)?$#', $t) ? $t : ''; }
        return (string) (Miesto::ciel()['kalendar'] ?? '');
    }

    /** Tlačidlo Vyskúšať: jedno čítanie barberov pre Pánsky strih cez vlastný server. Vráti ['ok' => bool, 'text' => veta]. */
    public static function skusKalendar(): array
    {
        $r = Prostredie::sonda(Miesto::zaklad() . 'asistent/api.php?a=barberi&sluzba=1', 12);
        if ($r === null) return ['ok' => false, 'text' => 'Server sa nevie spýtať sám seba. Vyskúšaj okno Objednať sa priamo na webe.'];
        $j = json_decode($r[1], true);
        if ($r[0] === 200 && is_array($j) && ($j['stav'] ?? '') === 'ok' && !empty($j['barberi']))
            return ['ok' => true, 'text' => 'Funguje. Rezervačný systém vrátil barberov: ' . implode(', ', array_map('strval', array_slice((array) $j['barberi'], 0, 8))) . '.'];
        $dovod = is_array($j) ? (string) ($j['chyba'] ?? $j['dovod'] ?? $j['stav'] ?? '') : '';
        Dennik::zapis('kalendar-skuska-zlyhala', ['kod' => $r[0]]);
        return ['ok' => false, 'text' => 'Čítanie voľných termínov sa nepodarilo (odpoveď ' . $r[0] . ($dovod !== '' ? ', ' . mb_substr($dovod, 0, 120) : '') . '). Odporúčame voľné termíny vypnúť a napísať tvorcovi webu; okno objednávky dovtedy ponúkne Zavolať a rezervačný systém.'];
    }

    // ---------- vernostná kartička ----------
    public static function vernostHeslo(): bool { return !empty(self::tajne()['vernost_hash']); }
    public static function vernostOd(): int { return (int) (self::tajne()['vernost_od'] ?? 0); }
    public static function vernostEmail(): string { return (string) (self::n()['vernost']['email_od'] ?? ''); }

    public static function ulozVernost(string $heslo, string $heslo2, string $email, string $kto): ?string
    {
        $email = trim($email);
        if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 120)) return 'E‑mail odosielateľa nevyzerá správne.';
        if ($heslo !== '' || !self::vernostHeslo()) {
            if ($heslo !== $heslo2) return 'Heslá recepcie sa nezhodujú. Napíš ho dvakrát rovnako.';
            if (mb_strlen($heslo) < 10) return 'Heslo recepcie musí mať aspoň 10 znakov.';
            if (mb_strlen($heslo) > 200) return 'Heslo recepcie je príliš dlhé.';
            if (count(array_unique(mb_str_split($heslo))) < 5) return 'Heslo recepcie je príliš jednoduché.';
            $hash = password_hash($heslo, PASSWORD_DEFAULT);
            Ulozisko::uprav(Miesto::u('tajne.php'), function ($d) use ($hash) { $d['vernost_hash'] = $hash; $d['vernost_od'] = time(); return $d; });
        }
        Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) use ($email) { $n['vernost']['email_od'] = $email; return $n; });
        Dennik::zapis('vernost-nastavena', ['nove_heslo' => $heslo !== '', 'email' => $email !== '']);
        return null;
    }

    public static function vypniVernost(): void
    {
        Ulozisko::uprav(Miesto::u('tajne.php'), function ($d) { unset($d['vernost_hash'], $d['vernost_od']); return $d; });
        Dennik::zapis('vernost-vypnuta');
    }

    // ---------- adresy proxy ----------
    public static function proxy(): array { return array_values((array) (self::n()['proxy'] ?? [])); }
    public static function ulozProxy(string $text): ?string
    {
        $a = array_values(array_filter(array_map('trim', preg_split('/[\s,;]+/', $text) ?: [])));
        foreach ($a as $x) if (!filter_var($x, FILTER_VALIDATE_IP)) return "„{$x}“ nie je adresa IP.";
        if (count($a) > 20) return 'Najviac 20 adries.';
        Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) use ($a) { $n['proxy'] = $a; return $n; });
        Dennik::zapis('proxy-nastavene', ['pocet' => count($a)]);
        return null;
    }

    // ---------- konfigurácia pre servery (jadro/pre-asistenta.php, pre-vernost.php) ----------
    public static function preAsistenta(): array
    {
        $t = self::tajne(); $n = self::n();
        $kluc = (!empty($t['kluc']) && !empty($n['asistent']['suhlas'])) ? (string) $t['kluc'] : '';
        // lokálna poistka: pod php -S bez falošného API (ANTHROPIC_BASE_URL) sa kľúč nevydá, skutočné API sa nezavolá ani omylom
        if (Miesto::lokalne() && !preg_match('#^http://127\.0\.0\.1:\d{2,5}/?$#', (string) getenv('ANTHROPIC_BASE_URL'))) $kluc = '';
        $k = ['kluc' => $kluc, 'model' => 'claude-opus-5-5', 'usilie' => 'low', 'sol' => self::sol(),
              'db' => Miesto::u('asistent/limity.sqlite'), 'cache_dir' => Miesto::u('asistent'),
              'spolu_za_den' => self::strop(), 'proxy' => self::proxy(), 'povody' => Miesto::lokalne() ? [Miesto::povod()] : []];
        $kal = self::adresaKalendara();
        if (!empty($n['kalendar']['zapnute']) && $kal !== '') $k['kalendar'] = ['url' => $kal];
        return $k;
    }

    public static function preVernost(): array
    {
        $t = self::tajne(); $z = Miesto::zaklad();
        return ['hesla' => !empty($t['vernost_hash']) ? ['barbershop' => (string) $t['vernost_hash']] : [], 'email_od' => self::vernostEmail(),
                'zaklad' => $z . 'vernost/', 'karty' => ['barbershop' => $z . 'karta/'], 'kontakt_push' => 'mailto:info@barbershop30.sk',
                'data' => Miesto::u('vernost'), 'prevadzky' => ['barbershop' => ['web' => $z, 'karta' => $z . 'karta/']],
                'len' => ['barbershop'], 'spustene' => !empty($t['vernost_hash']), 'proxy' => self::proxy(), 'povody' => []];
    }

    // ---------- cieľový stav prepínačov ----------
    /** ['asistent' => adresa|'', 'objednavka' => adresa|'', 'vernost' => bool, 'dovody' => [funkcia => veta, prečo je vypnutá]] */
    public static function cielovyStav(): array
    {
        $api = Miesto::zaklad() . 'asistent/api.php';
        $s = ['asistent' => '', 'objednavka' => '', 'vernost' => false, 'dovody' => []];
        $kniznica = is_file(Miesto::w('asistent/vendor/autoload.php'));
        $php = PHP_VERSION_ID >= 80200;
        $stav = null;
        $citajStav = function () use (&$stav, $api) { if ($stav === null) { $r = Prostredie::sonda($api . '?a=stav'); $stav = $r === null ? false : (json_decode($r[1], true) ?: []); } return $stav; };

        if (!self::maKluc()) $s['dovody']['asistent'] = 'Kľúč API nie je vložený.';
        elseif (!self::suhlasAsistent()) $s['dovody']['asistent'] = 'Chýba súhlas so zapnutím.';
        elseif (!$kniznica) $s['dovody']['asistent'] = 'Knižnica asistenta (asistent/vendor) nie je na hostingu celá.';
        elseif (!$php) $s['dovody']['asistent'] = 'Asistent potrebuje PHP 8.2 alebo novšie.';
        elseif (!is_file(Miesto::w('asistent/ochrana-udajov.html'))) $s['dovody']['asistent'] = 'Chýba stránka asistent/ochrana-udajov.html.';
        elseif (($st = $citajStav()) !== false && empty($st['zapnute'])) $s['dovody']['asistent'] = Miesto::lokalne() ? 'Server asistenta hlási vypnuté (lokálna poistka: bez falošného API sa kľúč nevydá).' : 'Server asistenta (asistent/api.php) neodpovedá, že je zapnutý.';
        else $s['asistent'] = $api;

        if (!self::kalendarZapnuty()) $s['dovody']['objednavka'] = 'Voľné termíny nie sú zapnuté.';
        elseif (!$kniznica || !$php) $s['dovody']['objednavka'] = 'Voľné termíny potrebujú knižnicu asistenta (asistent/vendor) a PHP 8.2 alebo novšie.';
        elseif (self::adresaKalendara() === '') $s['dovody']['objednavka'] = 'Adresa rezervačného systému nie je určená.';
        elseif (($st = $citajStav()) !== false && empty($st['kalendar'])) $s['dovody']['objednavka'] = 'Server (asistent/api.php) nehlási pripojený kalendár.';
        else $s['objednavka'] = $api;

        if (!self::vernostHeslo()) $s['dovody']['vernost'] = 'Heslo recepcie do adminu kartičiek nie je nastavené.';
        else {
            $r = Prostredie::sonda(Miesto::zaklad() . 'vernost/api/?a=stav');
            $j = $r === null ? null : json_decode($r[1], true);
            if ($r !== null && !(is_array($j) && !empty($j['databaza']) && !empty($j['admin']['barbershop']))) $s['dovody']['vernost'] = 'Server kartičiek (vernost/api/) nehlási databázu v poriadku.';
            else $s['vernost'] = true;
        }
        return $s;
    }
}
