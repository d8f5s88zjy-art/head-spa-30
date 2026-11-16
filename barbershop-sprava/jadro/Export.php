<?php
// Export úprav pre tvorcu webu: ZIP so súbormi zdroja, ktoré sa líšia od pôvodných súborov balíka (na cestách repozitára),
// s novými fotkami, zoznamom zmien (ZMENY.json, bez adries IP a bez mien účtov) a s verziou balíka (BALIK.txt).
// Nikdy v ňom nie je nič iné z priečinka údajov: žiadne tajomstvo, účty, relácie ani databáza kartičiek.
defined('B30S') || exit;

final class Export
{
    /** Súbory exportu: [cesta v ZIP-e => absolútna cesta súboru]. Len zdroj z tabuľky a fotky z pevného vzoru. */
    public static function subory(): array
    {
        $von = [];
        foreach (Zmena::upravene() as $c) {
            $f = Miesto::u('zdroj/' . $c); $s = Zmena::semeno($c);
            if (!is_file($s) || sha1_file($s) !== sha1_file($f)) $von[$c] = $f;
        }
        foreach ((array) (Ulozisko::citaj(Miesto::u('fotky.php'), [])['fotky'] ?? []) as $c) {
            $ver = Mapa::fotka($c);
            if ($ver !== null && is_file(Miesto::w($ver))) $von[$c] = Miesto::w($ver);
        }
        ksort($von);
        return $von;
    }

    public static function zmeny(): array
    {
        $von = [];
        foreach (array_reverse(Zmena::zalohy()) as $p) $von[] = ['cas' => $p['cas'] ?? '', 'typ' => $p['typ'] ?? '', 'stav' => $p['stav'] ?? '', 'zmeny' => $p['zmeny'] ?? []];
        return $von;
    }

    /** Vytvorí ZIP v údaje/export a vráti jeho cestu (staršie exporty zmaže). */
    public static function vytvor(): string
    {
        if (!class_exists('ZipArchive')) throw new RuntimeException('Chýba rozšírenie zip.');
        foreach (glob(Miesto::u('export/*.zip')) ?: [] as $f) @unlink($f);
        $vb = Zmena::verziaBalika();
        $cesta = Miesto::u('export/barbershop30-upravy-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.zip');
        $zip = new ZipArchive();
        if ($zip->open($cesta, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) throw new RuntimeException('Export sa nedá vytvoriť.');
        $subory = self::subory();
        foreach ($subory as $c => $f) $zip->addFile($f, $c);
        $zip->addFromString('ZMENY.json', json_encode(self::zmeny(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n");
        $zip->addFromString('BALIK.txt', "Export úprav zo správy webu Barbershop 30 (www.barbershop30.sk)\ncommit: " . ($vb['commit'] ?? '') . "\nbalik: " . ($vb['cas'] ?? '') . "\nexport: " . date('c') . "\nsuborov: " . count($subory) . "\n\nPrevzatie do repozitára: node barbershop-30/source/tools/prevezmi-export.mjs <tento.zip>\n");
        $zip->close();
        Dennik::zapis('export', ['suborov' => count($subory)]);
        return $cesta;
    }
}
