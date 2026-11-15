<?php
// Cesty správy. Priečinok dát sa vyberá v pevnom poradí, nikdy podľa vstupu:
//  1. <nad koreňom webu>/sprava-data (Forpsi Linux: /<doména>/sprava-data, mimo www – z webu nedostupné),
//  2. existujúci <koreň webu>/sprava-data-<32 hex> (Forpsi Windows: priečinok mimo webu nie je; chránia ho web.config
//     a .htaccess a kontrola prostredia overí sondou, že je z webu nedostupný),
//  3. nový <koreň webu>/sprava-data-<32 hex>.
defined('SPRAVA') || exit;

final class Nastavenie
{
    /** Súbory údajov webu (data/*.json); rovnaký zoznam má data_sprava.SUBORY a nasadenie/balik.sh (semeno). */
    const DATA = ['firma', 'cennik', 'akcie', 'caste', 'novinky', 'galeria', 'texty', 'verzia'];

    public static string $web = '';     // koreň webu (priečinok s index.html)
    public static string $data = '';    // priečinok dát správy
    public static bool $vnutriWebu = false;

    public static function init(): void
    {
        self::$web = realpath(dirname(__DIR__, 2));
        $hore = dirname(self::$web) . '/sprava-data';
        if (is_dir($hore) || (is_writable(dirname(self::$web)) && @mkdir($hore, 0700))) {
            self::$data = realpath($hore);
            self::$vnutriWebu = false;
        } else {
            $kand = glob(self::$web . '/sprava-data-*', GLOB_ONLYDIR) ?: [];
            $kand = array_values(array_filter($kand, fn($d) => preg_match('/\/sprava-data-[0-9a-f]{32}$/', $d)));
            if ($kand) self::$data = realpath($kand[0]);
            else {
                $d = self::$web . '/sprava-data-' . bin2hex(random_bytes(16));
                if (!@mkdir($d, 0700)) throw new RuntimeException('Priečinok pre údaje správy sa nedá vytvoriť.');
                self::$data = realpath($d);
            }
            self::$vnutriWebu = true;
        }
        self::ochranData();
        foreach (['data', 'koncept', 'staging', 'zalohy', 'relacie', 'export', 'log'] as $p) if (!is_dir(self::$data . '/' . $p)) @mkdir(self::$data . '/' . $p, 0700);
    }

    /** Ochranné súbory priečinka dát (zakážu prístup z webu na Apache aj IIS). */
    public static function ochranData(): void
    {
        $h = self::$data . '/.htaccess';
        if (!is_file($h)) @file_put_contents($h, "# Správa webu: údaje – z webu nedostupné\nRequire all denied\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
        $w = self::$data . '/web.config';
        if (!is_file($w)) @file_put_contents($w, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<configuration>\n  <system.webServer>\n    <security>\n      <authorization>\n        <remove users=\"*\" roles=\"\" verbs=\"\" />\n        <add accessType=\"Deny\" users=\"*\" />\n      </authorization>\n      <requestFiltering>\n        <hiddenSegments>\n          <add segment=\"" . basename(self::$data) . "\" />\n        </hiddenSegments>\n      </requestFiltering>\n    </security>\n  </system.webServer>\n</configuration>\n");
    }

    public static function d(string $rel = ''): string { return self::$data . ($rel === '' ? '' : '/' . $rel); }
    public static function w(string $rel = ''): string { return self::$web . ($rel === '' ? '' : '/' . $rel); }

    /** Živé dáta webu; pri prvom spustení sa skopírujú zo sprava/semeno (balík) alebo z data/ (repozitár). Súbor, ktorý
     *  pribudol v novšej verzii správy (napr. novinky.json), sa doplní zo semena; existujúce údaje sa nikdy neprepíšu. */
    public static function zabezpecData(): void
    {
        $chyba = array_values(array_filter(self::DATA, fn($m) => !is_file(self::d("data/$m.json"))));
        if (!$chyba) return;
        foreach ([self::w('sprava/semeno'), self::w('data')] as $zdroj) {
            if (is_file($zdroj . '/akcie.json')) {
                foreach ($chyba as $m) if (is_file("$zdroj/$m.json")) copy("$zdroj/$m.json", self::d("data/$m.json"));
                if (array_filter(self::DATA, fn($m) => !is_file(self::d("data/$m.json")))) break;
                return;
            }
        }
        throw new RuntimeException('Chýbajú údaje webu (sprava/semeno).');
    }

    public static function dataWebu(): array
    {
        $D = [];
        foreach (self::DATA as $m) {
            $D[$m] = Ulozisko::citajJson(self::d("data/$m.json"));
            if (!is_array($D[$m])) throw new RuntimeException("Údaje $m.json sa nedajú prečítať.");
        }
        return $D;
    }

    public static function konstanty(): array
    {
        static $k = null;
        if ($k === null) $k = json_decode(file_get_contents(self::w('sprava/kostry/konstanty.json')), true, 512, JSON_THROW_ON_ERROR);
        return $k;
    }

    /** Lokálny test (php -S): HTTPS sa nevyžaduje. Nikdy podľa IP adresy. */
    public static function lokalne(): bool { return PHP_SAPI === 'cli-server'; }

    public static function https(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') || ((int)($_SERVER['SERVER_PORT'] ?? 0) === 443);
    }
}
