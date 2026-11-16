<?php
// Kde správa beží: koreň webu, priečinok údajov a adresy cieľa (ciel.json). Ľahká trieda bez relácie – číta ju aj
// asistent a vernostná kartička (jadro/pre-asistenta.php, pre-vernost.php) pri každej požiadavke návštevníka.
//
// Priečinok údajov sa vyberá v pevnom poradí, nikdy podľa vstupu z požiadavky:
//  1. <nad koreňom webu>/barbershop30-udaje (z webu nedostupné),
//  2. existujúci <koreň webu>/b30-udaje-<32 hex>,
//  3. nový <koreň webu>/b30-udaje-<32 hex> (128 bitov náhody v mene; chránia ho .htaccess, web.config, prázdne
//     index.html a to, že tajné údaje sú len v súboroch .php, ktoré pri priamej požiadavke nič nevypíšu).
defined('B30S') || exit;

final class Miesto
{
    public static string $web = '';      // koreň webu (priečinok s index.html a sprava/)
    public static string $udaje = '';    // priečinok údajov
    public static bool $voWebe = false;  // údaje ležia v koreni webu (variant 2 a 3)
    private static ?array $ciel = null;

    const PODPRIECINKY = ['zdroj', 'zalohy', 'nahrate', 'relacie', 'dennik', 'export', 'asistent', 'vernost'];

    /** Lokálny test (php -S). Nikdy podľa adresy IP ani hlavičky. */
    public static function lokalne(): bool { return PHP_SAPI === 'cli-server'; }

    /** Len pre testy z príkazového riadka: iný koreň webu (napodobenina hostingu), voliteľne údaje len vnútri webu. */
    private static bool $pokusVoWebe = false;
    public static function prePokus(string $web, bool $lenVoWebe = false): void
    {
        if (PHP_SAPI !== 'cli') throw new RuntimeException('len pre testy');
        self::$web = rtrim($web, '/'); self::$udaje = ''; self::$voWebe = false; self::$ciel = null; self::$pokusVoWebe = $lenVoWebe;
    }

    public static function ciel(): array
    {
        if (self::$ciel !== null) return self::$ciel;
        foreach ([__DIR__ . '/ciel.json', dirname(__DIR__, 2) . '/barbershop-30/source/domena/ciel.json'] as $f) {
            if (is_file($f)) { $c = json_decode((string) file_get_contents($f), true); if (is_array($c) && !empty($c['zaklad'])) return self::$ciel = $c; }
        }
        throw new RuntimeException('Chýba súbor sprava/jadro/ciel.json.');
    }

    /** Základná adresa webu s lomkou na konci – nikdy z hlavičky Host. Pod php -S adresa lokálneho servera. */
    public static function zaklad(): string
    {
        if (self::lokalne()) return 'http://127.0.0.1:' . (int) ($_SERVER['SERVER_PORT'] ?? 80) . '/';
        return rtrim((string) self::ciel()['zaklad'], '/') . '/';
    }

    /** Pôvod (schéma a hostiteľ) základnej adresy. */
    public static function povod(): string { return (string) preg_replace('#^(https?://[^/]+).*$#', '$1', self::zaklad()); }

    /** Nájde (a pri $vytvor aj založí) priečinok údajov. Vráti false, keď neexistuje a nemá sa alebo nedá vytvoriť. */
    public static function init(bool $vytvor = true): bool
    {
        if (self::$udaje !== '') return true;
        if (self::$web === '') self::$web = (string) realpath(dirname(__DIR__, 2));
        $c = self::ciel();
        $meno = (string) ($c['udaje'] ?? 'barbershop30-udaje'); $pred = (string) ($c['udaje_vo_webe'] ?? 'b30-udaje-');
        $nutit = (self::lokalne() && getenv('B30_TEST_UDAJE_VO_WEBE') === '1') || (PHP_SAPI === 'cli' && self::$pokusVoWebe);   // len test: variant vnútri webu
        $hore = dirname(self::$web) . '/' . $meno;
        if (!$nutit && (is_dir($hore) || ($vytvor && is_writable(dirname(self::$web)) && self::vytvor($hore)))) {
            self::$udaje = (string) realpath($hore); self::$voWebe = false;
        } else {
            $d = self::najdiVoWebe($pred);
            if ($d === null && $vytvor) {
                // súbeh dvoch prvých požiadaviek: druhá počká na zámok a nájde priečinok prvej
                $z = @fopen(__FILE__, 'r');
                if ($z) flock($z, LOCK_EX);
                try {
                    $d = self::najdiVoWebe($pred);
                    if ($d === null) { $n = self::$web . '/' . $pred . bin2hex(random_bytes(16)); if (self::vytvor($n)) $d = $n; }
                } finally { if ($z) { flock($z, LOCK_UN); fclose($z); } }
            }
            if ($d === null) return false;
            self::$udaje = (string) realpath($d); self::$voWebe = true;
        }
        if ($vytvor) self::ochran();
        return true;
    }

    private static function vytvor(string $d): bool { return @mkdir($d, 0700) || is_dir($d); }

    private static function najdiVoWebe(string $pred): ?string
    {
        $kand = glob(self::$web . '/' . $pred . '*', GLOB_ONLYDIR) ?: [];
        sort($kand);
        foreach ($kand as $d) if (preg_match('/\/' . preg_quote($pred, '/') . '[0-9a-f]{32}$/', $d)) return $d;
        return null;
    }

    /** Podpriečinky a ochranné súbory priečinka údajov (Apache aj IIS, žiadny výpis priečinka). */
    public static function ochran(): void
    {
        $u = self::$udaje;
        foreach (array_merge([''], self::PODPRIECINKY) as $p) {
            $d = $u . ($p === '' ? '' : '/' . $p);
            if (!is_dir($d)) @mkdir($d, 0700, true);
            if (!is_file($d . '/index.html')) @file_put_contents($d . '/index.html', '');
        }
        if (!is_file($u . '/.htaccess')) @file_put_contents($u . '/.htaccess', "# Barbershop 30: údaje správy – z webu nedostupné\n<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
        if (!is_file($u . '/web.config')) @file_put_contents($u . '/web.config', "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<configuration>\n  <system.webServer>\n    <security>\n      <authorization>\n        <remove users=\"*\" roles=\"\" verbs=\"\" />\n        <add accessType=\"Deny\" users=\"*\" />\n      </authorization>\n    </security>\n  </system.webServer>\n</configuration>\n");
    }

    public static function u(string $rel = ''): string { return self::$udaje . ($rel === '' ? '' : '/' . $rel); }
    public static function w(string $rel = ''): string { return self::$web . ($rel === '' ? '' : '/' . $rel); }

    /** Kde majiteľ nájde priečinok údajov cez FTP (veta pre obrazovku s kódom). */
    public static function kdeUdaje(): string
    {
        return self::$voWebe
            ? 'v priečinku webu (tam, kde je index.html) priečinok, ktorého meno začína „' . (self::ciel()['udaje_vo_webe'] ?? 'b30-udaje-') . '“'
            : 'priečinok „' . basename(self::$udaje) . '“ vedľa priečinka webu (o úroveň vyššie, než je index.html)';
    }
}
