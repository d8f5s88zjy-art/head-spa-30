<?php
// Tok zmeny: koncept (web sa nemení) → náhľad (staging + kontroly) → zverejnenie (zámok, kontrola odtlačkov, záloha,
// denník prerušeného zápisu, atómové premenovanie, overenie) → História a Vrátiť späť.
// Všetko, čo je na webe odvodené z údajov (oblasti v stránkach, stránky akcií z kostry, index hľadania, sitemap), sa
// pri každom náhľade vykreslí znova z celých údajov – web je vždy v súlade s údajmi.
defined('SPRAVA') || exit;

final class Zmena
{
    const MENA = ['firma', 'cennik', 'akcie', 'caste', 'novinky', 'galeria', 'texty'];

    // ---------- zámok zverejnenia ----------
    // Jeden zámok (flock na zverejnenie.zamok) chráni koncept, staging, zverejnenie aj obnovu prerušeného zápisu: žiadna
    // iná požiadavka (ani anonymná) nesmie meniť staging ani vracať súbory, kým zverejnenie beží. V jednom procese sa dá
    // zamknúť viackrát (počítadlo), uvoľní sa pri poslednom odomknutí alebo pri skončení procesu.
    private static $zamokH = null;
    private static int $hlbka = 0;

    /** $cakaj: čaká najviac 20 s (náhľad, uloženie konceptu); inak hneď vráti false, ak zámok drží iná požiadavka. */
    public static function zamkni(bool $cakaj): bool
    {
        if (self::$hlbka > 0) { self::$hlbka++; return true; }
        $h = Ulozisko::zamok(Nastavenie::d('zverejnenie.zamok'));
        for ($i = 0; !$h && $cakaj && $i < 100; $i++) { usleep(200000); $h = Ulozisko::zamok(Nastavenie::d('zverejnenie.zamok')); }
        if (!$h) return false;
        self::$zamokH = $h; self::$hlbka = 1;
        return true;
    }

    public static function odomkni(): void
    {
        if (self::$hlbka > 0 && --self::$hlbka === 0) { Ulozisko::odomkni(self::$zamokH); self::$zamokH = null; }
    }

    /** Pri každej požiadavke: dokončí prerušený zápis, ale len ak práve nebeží iné zverejnenie (inak nerobí nič). */
    public static function obnovPrerusene(): void
    {
        if (!is_file(Nastavenie::d('zurnal.json')) || !self::zamkni(false)) return;
        try { self::dokonciPrerusene(); } finally { self::odomkni(); }
    }

    // ---------- údaje ----------
    public static function zive(): array { return Nastavenie::dataWebu(); }

    public static function sKonstantami(array $D): array
    {
        $D['k'] = Nastavenie::konstanty();
        return $D;
    }

    public static function koncept(): ?array
    {
        return Ulozisko::citajJson(Nastavenie::d('koncept/navrh.json'));
    }

    /** Pracovné údaje: koncept, ak je, inak živé údaje. */
    public static function pracovne(): array
    {
        $k = self::koncept();
        $zive = self::zive();
        if ($k) { $k['data']['verzia'] = $zive['verzia']; return $k['data']; }
        return $zive;
    }

    /** Uloží zmenu do konceptu (web sa nemení). Vráti null alebo vetu s chybou. */
    public static function ulozKoncept(array $data, string $popis, ?array $navrat = null): ?string
    {
        if (!self::zamkni(true)) return 'Práve sa ukladá iná zmena. Skúste to o chvíľu.';
        try { return self::ulozKonceptZamknuty($data, $popis, $navrat); } finally { self::odomkni(); }
    }

    private static function ulozKonceptZamknuty(array $data, string $popis, ?array $navrat): ?string
    {
        $zive = self::zive();
        $k = self::koncept();
        if ($k && ($k['zaklad'] ?? -1) !== $zive['verzia']['revizia']) return 'Medzitým niekto zverejnil inú zmenu. Rozpracovanú zmenu zahoďte a urobte ju znova.';
        if ($k && $k['ucet'] !== Pristup::ucet() && time() - ($k['aktivita'] ?? 0) < 1200) return 'Na zmene práve pracuje ' . $k['ucet'] . '. Skúste to o chvíľu.';
        $popisy = $k['popis'] ?? [];
        if (!in_array($popis, $popisy, true)) $popisy[] = $popis;
        $d = [];
        foreach (self::MENA as $m) $d[$m] = $data[$m];
        Ulozisko::zapisJson(Nastavenie::d('koncept/navrh.json'), ['data' => $d, 'popis' => $popisy, 'zaklad' => $zive['verzia']['revizia'],
            'ucet' => Pristup::ucet(), 'cas' => $k['cas'] ?? time(), 'aktivita' => time(), 'navrat' => $navrat ?? ($k['navrat'] ?? null)]);
        Ulozisko::zmazStrom(Nastavenie::d('staging'));
        @mkdir(Nastavenie::d('staging'), 0700);
        return null;
    }

    /** S3: kam vedie Späť a „Upraviť ďalej“ z náhľadu: formulár, z ktorého zmena prišla (inak Domov). */
    public static function navrat(?array $k): array
    {
        $n = $k['navrat'] ?? null;
        $povolene = ['hodiny', 'akcia', 'akcie', 'cennik', 'novinka', 'novinky', 'galeria', 'texty', 'kontakt', 'historia'];
        if (!is_array($n) || !in_array($n[0] ?? '', $povolene, true)) return ['', []];
        $q = is_array($n[1] ?? null) ? array_filter($n[1], fn($v, $kl) => $kl === 'id' && is_string($v) && preg_match('/^[a-z0-9-]{1,60}$/', $v), ARRAY_FILTER_USE_BOTH) : [];
        return [$n[0], $q];
    }

    public static function zahodKoncept(): ?string
    {
        if (!self::zamkni(true)) return 'Práve sa ukladá iná zmena. Skúste to o chvíľu.';
        try {
            $k = self::koncept();
            @unlink(Nastavenie::d('koncept/navrh.json'));
            Ulozisko::zmazStrom(Nastavenie::d('staging'));
            @mkdir(Nastavenie::d('staging'), 0700);
            // fotky a PDF nahraté k zahodenej zmene (na ktoré nič neodkazuje) zmiznú aj z webu
            $n = $k ? Subory::upratNepouzite((int)($k['cas'] ?? time()) - 600) : 0;
            Dennik::zapis('koncept-zahodeny', $n ? ['zmazane_nahravky' => $n] : []);
            return null;
        } finally { self::odomkni(); }
    }

    // ---------- súbory s oblasťami ----------
    /** Stránky, v ktorých sú oblasti: z oblasti.json (build.py) a stránky akcií z údajov. */
    public static function subory(array $D): array
    {
        $s = array_keys(Ulozisko::citajJson(Nastavenie::w('sprava/kostry/oblasti.json'), []));
        foreach ($D['akcie']['akcie'] as $a) if ($a['stranka']) $s[] = $a['stranka'];
        foreach ($D['novinky']['novinky'] as $n) $s[] = $n['stranka'];
        $s = array_values(array_unique($s));
        sort($s, SORT_STRING);
        return $s;
    }

    /** Kostra novej stránky: akcia alebo novinka (sprava/kostry, vyrába build.py). */
    public static function kostra(string $p = 'akcie/x.html'): string
    {
        return file_get_contents(Nastavenie::w(str_starts_with($p, 'novinky/') ? 'sprava/kostry/novinka.html' : 'sprava/kostry/akcia.html'));
    }

    /** Stránka, ktorú celú vyrába správa (akcia, novinka); nie prehľad akcií a noviniek. */
    public static function spravovana(string $p): bool
    {
        return (str_starts_with($p, 'akcie/') && $p !== 'akcie/index.html') || (str_starts_with($p, 'novinky/') && $p !== 'novinky/index.html');
    }

    /** Nový obsah stránky z údajov (pre neexistujúcu stránku akcie alebo novinky z kostry). */
    public static function vykresliSubor(string $p, array $DK, ?string $sucasny): string
    {
        if ($sucasny === null) {
            $t = str_replace('@@ADRESA@@', $DK['k']['domena'] . $p, self::kostra($p));
            // kostru vyrobil build.py s kontaktom z času balíka; po zmene telefónu alebo e-mailu v správe má mať nová
            // stránka (lišta, päta, tlačidlá mimo oblastí) už nový kontakt
            $sem = Ulozisko::citajJson(Nastavenie::w('sprava/semeno/firma.json')) ?? Ulozisko::citajJson(Nastavenie::w('data/firma.json'));
            if (is_array($sem) && ($pary = Kontakt::pary($sem, $DK['firma']))) $t = Kontakt::nahrad($t, $pary);
            return Vykreslenie::prepis($t, $p, $DK);
        }
        return Vykreslenie::prepis($sucasny, $p, $DK);
    }

    /** Kontrola webu proti živým údajom (kontrola prostredia, zmena zvonka). */
    public static function stavWebu(): array
    {
        $D = self::sKonstantami(self::zive());
        $ocak = Ulozisko::citajJson(Nastavenie::w('sprava/kostry/oblasti.json'), []);
        $chyb = []; $rozd = []; $n = 0;
        foreach (self::subory($D) as $p) {
            $f = Nastavenie::w($p);
            if (!is_file($f)) { $chyb[] = $p; continue; }
            $t = file_get_contents($f);
            $ids = array_column(Vykreslenie::oblasti_v($t), 0);
            $n += count($ids);
            if (isset($ocak[$p]) && $ids !== $ocak[$p]) $chyb[] = $p;
            if (Vykreslenie::prepis($t, $p, $D) !== $t) $rozd[] = $p;
        }
        return ['oblasti' => $n, 'chybajuce' => $chyb, 'rozdielne' => $rozd];
    }

    // ---------- náhľad ----------
    /** Pripraví zmenu do stagingu; vráti ['zmenene', 'nove', 'chyby', 'varovania']. */
    public static function priprav(): array
    {
        if (!self::zamkni(true)) return ['zmenene' => [], 'nove' => [], 'chyby' => ['Práve sa ukladá iná zmena. Obnovte náhľad o chvíľu.'], 'varovania' => []];
        try { return self::pripravZamknuty(); } finally { self::odomkni(); }
    }

    private static function pripravZamknuty(): array
    {
        $k = self::koncept();
        if (!$k) return ['zmenene' => [], 'nove' => [], 'chyby' => ['Nie je čo zverejniť.'], 'varovania' => []];
        $D = $k['data'];
        $DK = self::sKonstantami($D);
        $vystup = [];   // cesta => obsah
        $nove = [];
        foreach (self::subory($D) as $p) {
            $f = Nastavenie::w($p);
            $sucasny = is_file($f) ? file_get_contents($f) : null;
            $novy = self::vykresliSubor($p, $DK, $sucasny);
            if ($novy !== $sucasny) { $vystup[$p] = $novy; if ($sucasny === null) $nove[] = $p; }
        }
        // zmena telefónu alebo e-mailu: staré podoby sa nahradia vo všetkých verejných textových súboroch (Kontakt.php)
        $pary = Kontakt::pary(self::zive()['firma'], $D['firma']);
        if ($pary) foreach (Kontakt::subory() as $p) {
            $t = $vystup[$p] ?? (string)file_get_contents(Nastavenie::w($p));
            $n = Kontakt::nahrad($t, $pary);
            if ($n !== $t) $vystup[$p] = $n;
        }
        // znalosti asistenta (ak je na hostingu): odpovede na časté otázky a hodiny z tých istých údajov ako web
        foreach (array_merge(Vykreslenie::ASISTENT_OTAZKY, [Vykreslenie::ASISTENT_ZNALOSTI], Vykreslenie::ASISTENT_JS) as $p) {
            if (!isset($vystup[$p]) && !is_file(Nastavenie::w($p))) continue;
            $t = $vystup[$p] ?? (string)file_get_contents(Nastavenie::w($p));
            try { $n = str_ends_with($p, '.md') ? Vykreslenie::asistent_znalosti($DK, $t) : (str_ends_with($p, '.js') ? Vykreslenie::asistent_js($DK, $t) : Vykreslenie::asistent_otazky($DK, $t)); }
            catch (Throwable $e) { Dennik::chyba($e); continue; }
            if ($n !== (is_file(Nastavenie::w($p)) ? file_get_contents(Nastavenie::w($p)) : null)) $vystup[$p] = $n; else unset($vystup[$p]);
        }
        // index hľadania a sitemap z celého webu (staging + živé súbory)
        $citaj = fn($p) => $vystup[$p] ?? (is_file(Nastavenie::w($p)) ? file_get_contents(Nastavenie::w($p)) : '');
        $domena = $DK['k']['domena'];
        $sm = Sitemap::nacitaj((string)@file_get_contents(Nastavenie::w('sitemap.xml')), $domena);
        $stranky = [];
        foreach ($sm as $p => $d) if (!self::spravovana($p)) $stranky[$p] = $d;
        $dnes = (new DateTime('now', new DateTimeZone('Europe/Bratislava')))->format('Y-m-d');
        foreach ($D['akcie']['akcie'] as $a) if ($a['stranka'] && $a['viditelna']) $stranky[$a['stranka']] = $sm[$a['stranka']] ?? $dnes;
        foreach ($D['novinky']['novinky'] as $n) if ($n['viditelna']) $stranky[$n['stranka']] = $sm[$n['stranka']] ?? $dnes;
        foreach (array_keys($vystup) as $p) if (isset($stranky[$p])) $stranky[$p] = $dnes;
        $index = self::index(array_keys($stranky), $citaj, $DK['k']);
        if ($index !== (string)@file_get_contents(Nastavenie::w('assets/index.json'))) $vystup['assets/index.json'] = $index;
        $smx = Sitemap::zostav($stranky, $domena);
        if ($smx !== (string)@file_get_contents(Nastavenie::w('sitemap.xml'))) $vystup['sitemap.xml'] = $smx;
        [$chyby, $varovania] = Kontrola::vystup($vystup, $nove, $citaj, $DK);
        // staging
        $st = Nastavenie::d('staging');
        Ulozisko::zmazStrom($st); @mkdir($st, 0700);
        $man = ['cas' => time(), 'subory' => [], 'koncept' => self::odtlacokKonceptu($k)];
        foreach ($vystup as $p => $t) {
            Ulozisko::zapis("$st/w/$p", $t);
            $f = Nastavenie::w($p);
            $man['subory'][$p] = ['pred' => is_file($f) ? hash_file('sha256', $f) : null, 'po' => hash('sha256', $t)];
        }
        $man['data_pred'] = [];
        foreach (self::MENA as $m) $man['data_pred'][$m] = hash_file('sha256', Nastavenie::d("data/$m.json"));
        $man['chyby'] = $chyby;
        Ulozisko::zapisJson("$st/navrh.json", $man);
        return ['zmenene' => array_keys($vystup), 'nove' => $nove, 'chyby' => $chyby, 'varovania' => $varovania];
    }

    /** Odtlačok konceptu: zverejní sa len ten koncept, z ktorého bol pripravený náhľad. */
    private static function odtlacokKonceptu(array $k): string
    {
        return hash('sha256', json_encode([$k['data'], $k['popis'], $k['zaklad'] ?? null], JSON_UNESCAPED_UNICODE));
    }

    private static function index(array $stranky, callable $citaj, array $K): string
    {
        sort($stranky, SORT_STRING);
        $idx = [];
        foreach ($stranky as $p) {
            if ($p === 'index.html') continue;
            $idx[] = Hladanie::zaznamZTextu($p, $citaj($p), $K);
        }
        return Typografia::opravy(Pomocne::jsonPy($idx, true));
    }

    public static function stagingSubor(string $p): ?string
    {
        $man = Ulozisko::citajJson(Nastavenie::d('staging/navrh.json'));
        if (!$man || !isset($man['subory'][$p])) return null;
        $f = Nastavenie::d('staging/w/' . $p);
        return is_file($f) ? file_get_contents($f) : null;
    }

    // ---------- zverejnenie ----------
    /** Zverejní pripravený náhľad. Vráti null alebo vetu s chybou (web ostane bez zmeny). */
    public static function zverejni(): ?string
    {
        if (!self::zamkni(false)) return 'Práve sa ukladá iná zmena. Skúste to o chvíľu.';
        try {
            self::dokonciPrerusene();
            $k = self::koncept();
            $man = Ulozisko::citajJson(Nastavenie::d('staging/navrh.json'));
            if (!$k || !$man) return 'Najprv si pozrite náhľad.';
            if (($man['koncept'] ?? '') !== self::odtlacokKonceptu($k)) return 'Zmena sa po náhľade upravila. Pozrite si náhľad znova.';
            if (!empty($man['chyby'])) return 'Zmena má chyby, ktoré treba opraviť (pozrite náhľad).';
            $zive = self::zive();
            if (($k['zaklad'] ?? -1) !== $zive['verzia']['revizia']) return 'Medzitým niekto zverejnil inú zmenu. Rozpracovanú zmenu zahoďte a urobte ju znova.';
            foreach ($man['subory'] as $p => $h) {
                $f = Nastavenie::w($p);
                $teraz = is_file($f) ? hash_file('sha256', $f) : null;
                if ($teraz !== $h['pred']) return 'Medzitým sa web zmenil. Pozrite si náhľad znova.';
            }
            foreach (self::MENA as $m) if (hash_file('sha256', Nastavenie::d("data/$m.json")) !== $man['data_pred'][$m]) return 'Medzitým sa zmenili údaje. Pozrite si náhľad znova.';
            // ciele: súbory webu + údaje
            $ciele = [];
            foreach ($man['subory'] as $p => $h) {
                // obsah zo stagingu musí byť presne ten z náhľadu (odtlačok z manifestu), inak sa nič nezapíše
                $obsah = is_file(Nastavenie::d('staging/w/' . $p)) ? @file_get_contents(Nastavenie::d('staging/w/' . $p)) : false;
                if (!is_string($obsah) || !hash_equals((string)$h['po'], hash('sha256', $obsah))) return 'Náhľad sa medzitým zmenil. Pozrite si náhľad znova.';
                $ciele['w:' . $p] = ['ciel' => Nastavenie::w($p), 'obsah' => $obsah];
            }
            $nova = $k['data'];
            $nova['verzia'] = $zive['verzia'];
            $nova['verzia']['revizia'] = $zive['verzia']['revizia'] + 1;
            foreach (array_merge(self::MENA, ['verzia']) as $m)
                $ciele['d:data/' . $m . '.json'] = ['ciel' => Nastavenie::d("data/$m.json"), 'obsah' => json_encode($nova[$m], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n"];
            $spolu = array_sum(array_map(fn($c) => strlen($c['obsah']), $ciele));
            $volne = @disk_free_space(Nastavenie::d());
            if ($volne !== false && $volne < 3 * $spolu + (5 << 20)) return 'Na hostingu je málo miesta. Zmena sa nezverejnila.';
            // záloha
            $id = date('Ymd-His') . '-' . bin2hex(random_bytes(3));
            $zd = Nastavenie::d('zalohy/' . $id);
            @mkdir($zd . '/subory', 0700, true);
            $zmeny = [];
            try { $zmeny = Rozdiel::vety($zive, $k['data']); } catch (Throwable $e) { Dennik::chyba($e); }
            $zman = ['id' => $id, 'cas' => time(), 'poradie' => microtime(true), 'ucet' => Pristup::ucet(), 'popis' => $k['popis'], 'zmeny' => $zmeny, 'subory' => []];
            foreach ($ciele as $kl => $c) {
                $mal = is_file($c['ciel']);
                if ($mal && !copy($c['ciel'], $zd . '/subory/' . self::bezpecneMeno($kl))) return 'Záloha sa nepodarila. Zmena sa nezverejnila.';
                $zman['subory'][$kl] = ['novy' => !$mal, 'pred' => $mal ? hash_file('sha256', $c['ciel']) : null, 'po' => hash('sha256', $c['obsah'])];
            }
            Ulozisko::zapisJson($zd . '/manifest.json', $zman);
            // denník prerušeného zápisu a dočasné súbory vedľa cieľov
            $zurnal = ['zaloha' => $id, 'ciele' => []];
            foreach ($ciele as $kl => &$c) {
                $c['tmp'] = $c['ciel'] . '.tmp-' . bin2hex(random_bytes(6));
                $zurnal['ciele'][$kl] = ['ciel' => $c['ciel'], 'tmp' => $c['tmp']];
            }
            unset($c);
            Ulozisko::zapisJson(Nastavenie::d('zurnal.json'), $zurnal);
            try {
                foreach ($ciele as $c) {
                    if (!is_dir(dirname($c['ciel'])) && !@mkdir(dirname($c['ciel']), 0755, true)) throw new RuntimeException('priečinok');
                    if (@file_put_contents($c['tmp'], $c['obsah'], LOCK_EX) !== strlen($c['obsah'])) throw new RuntimeException('zápis');
                }
                Ulozisko::resetPocitadla();
                foreach ($ciele as $c) Ulozisko::premenuj($c['tmp'], $c['ciel']);
                foreach ($ciele as $kl => $c) if (hash_file('sha256', $c['ciel']) !== $zman['subory'][$kl]['po']) throw new RuntimeException('overenie');
            } catch (Throwable $e) {
                Dennik::chyba($e);
                self::dokonciPrerusene();
                Dennik::zapis('zverejnenie-zlyhalo', ['zaloha' => $id]);
                return 'Zmena sa nepodarila zapísať. Web ostal bez zmeny. Skúste to znova; ak sa to opakuje, zavolajte programátora.';
            }
            // denník zápisu sa maže až po overení; „Hotovo“ len vtedy, keď je naozaj zmazaný (inak by ho ďalšia požiadavka
            // vyhodnotila ako prerušený zápis a zmenu vrátila)
            if (!@unlink(Nastavenie::d('zurnal.json')) && is_file(Nastavenie::d('zurnal.json'))) {
                self::dokonciPrerusene();
                Dennik::zapis('zverejnenie-zlyhalo', ['zaloha' => $id, 'dovod' => 'zurnal']);
                return 'Zmena sa nepodarila zapísať. Web ostal bez zmeny. Skúste to znova; ak sa to opakuje, zavolajte programátora.';
            }
            @unlink(Nastavenie::d('koncept/navrh.json'));
            Ulozisko::zmazStrom(Nastavenie::d('staging')); @mkdir(Nastavenie::d('staging'), 0700);
            Dennik::zapis('zverejnenie', ['popis' => implode(', ', $k['popis']), 'zaloha' => $id, 'suborov' => count($man['subory'])]);
            return null;
        } finally {
            self::odomkni();
        }
    }

    private static function bezpecneMeno(string $kl): string
    {
        return str_replace(['/', ':'], ['__', '_'], $kl);
    }

    /** Ak zápis prerušilo zlyhanie, vráti súbory zo zálohy. Volať len pod zámkom (zverejni, obnovPrerusene). */
    public static function dokonciPrerusene(): bool
    {
        $z = Ulozisko::citajJson(Nastavenie::d('zurnal.json'));
        if (!$z) return false;
        $zd = Nastavenie::d('zalohy/' . basename($z['zaloha']));
        $man = Ulozisko::citajJson($zd . '/manifest.json', ['subory' => []]);
        foreach ($z['ciele'] as $kl => $c) {
            $ciel = self::cielZKluca($kl);
            if ($ciel === null) continue;
            @unlink($c['tmp']);
            $info = $man['subory'][$kl] ?? null;
            if (!$info) continue;
            if ($info['novy']) { @unlink($ciel); continue; }
            $zal = $zd . '/subory/' . self::bezpecneMeno($kl);
            if (is_file($zal) && (!is_file($ciel) || hash_file('sha256', $ciel) !== $info['pred'])) {
                $tmp = $ciel . '.obnova-' . bin2hex(random_bytes(4));
                copy($zal, $tmp);
                @rename($tmp, $ciel) || @unlink($tmp);
            }
        }
        @unlink(Nastavenie::d('zurnal.json'));
        Dennik::zapis('obnova-po-preruseni', ['zaloha' => $z['zaloha']]);
        return true;
    }

    /** Kľúč cieľa → cesta (len vo webe alebo v údajoch, nikdy mimo). */
    private static function cielZKluca(string $kl): ?string
    {
        if (str_starts_with($kl, 'w:')) { $p = substr($kl, 2); $koren = Nastavenie::w(); }
        elseif (str_starts_with($kl, 'd:')) { $p = substr($kl, 2); $koren = Nastavenie::d(); }
        else return null;
        if (!preg_match('#^[a-z0-9][a-z0-9._/-]*$#', $p) || str_contains($p, '..')) return null;
        return $koren . '/' . $p;
    }

    // ---------- história a vrátenie ----------
    public static function zalohy(): array
    {
        $z = [];
        foreach (glob(Nastavenie::d('zalohy/*/manifest.json')) ?: [] as $f) { $m = Ulozisko::citajJson($f); if ($m) $z[] = $m; }
        // najnovšie hore; dve zverejnenia v tej istej sekunde zoradí presný čas (id má na konci náhodnú časť)
        usort($z, fn($a, $b) => [($b['poradie'] ?? $b['cas']), $b['id']] <=> [($a['poradie'] ?? $a['cas']), $a['id']]);
        return $z;
    }

    /** Koncept, ktorý vráti web do stavu pred zálohou id (cez ten istý náhľad a zverejnenie). */
    public static function vratit(string $id): ?string
    {
        if (!preg_match('/^\d{8}-\d{6}-[0-9a-f]{6}$/', $id)) return 'Záznam neexistuje.';
        $zd = Nastavenie::d('zalohy/' . $id);
        $man = Ulozisko::citajJson($zd . '/manifest.json');
        if (!$man) return 'Záznam neexistuje.';
        $stare = [];
        $teraz = self::zive();
        foreach (self::MENA as $m) {
            $f = $zd . '/subory/' . self::bezpecneMeno('d:data/' . $m . '.json');
            $d = Ulozisko::citajJson($f);
            // záloha zo staršej verzie správy nemá novšie súbory údajov (novinky, galéria, texty): tie ostanú, ako sú teraz
            if (!is_array($d)) { if (in_array($m, ['firma', 'cennik', 'akcie', 'caste'], true)) return 'Táto záloha nemá uložené údaje.'; $d = $teraz[$m]; }
            $stare[$m] = $d;
        }
        // akcie a novinky pridané po zálohe ostanú ako skryté (stránka sa nemaže, len ukáže, že skončila)
        $ids = array_column($stare['akcie']['akcie'], 'id');
        foreach ($teraz['akcie']['akcie'] as $a) if (!in_array($a['id'], $ids, true) && $a['stranka']) { $a['viditelna'] = false; $a['na_uvode'] = false; $stare['akcie']['akcie'][] = $a; }
        $ids = array_column($stare['novinky']['novinky'], 'id');
        foreach ($teraz['novinky']['novinky'] as $n) if (!in_array($n['id'], $ids, true)) { $n['viditelna'] = false; $n['na_uvode'] = false; $stare['novinky']['novinky'][] = $n; }
        if (self::koncept()) self::zahodKoncept();
        return self::ulozKoncept($stare, 'Vrátenie zmeny z ' . date('j. n. Y H:i', $man['cas']), ['historia', []]);
    }

    /** Upratanie záloh: posledných 60 + jedna za mesiac 12 mesiacov, spolu najviac 300 MB. */
    public static function uprac(): void
    {
        $z = self::zalohy();
        $nechaj = []; $mesiace = [];
        foreach ($z as $i => $m) {
            $mes = date('Y-m', $m['cas']);
            if ($i < 60) $nechaj[$m['id']] = 1;
            elseif (!isset($mesiace[$mes]) && count($mesiace) < 12) { $mesiace[$mes] = 1; $nechaj[$m['id']] = 1; }
        }
        $spolu = 0;
        foreach ($z as $m) {
            $d = Nastavenie::d('zalohy/' . $m['id']);
            if (isset($nechaj[$m['id']])) { $spolu += Ulozisko::velkostStromu($d); if ($spolu <= 300 << 20) continue; }
            Ulozisko::zmazStrom($d);
        }
    }
}
