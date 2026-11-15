<?php
// Export zmien pre programátora: richtarik-obsah-<dátum>-r<revízia>.zip s data/*.json, img/s/**, pdf/s/**,
// odtlacky.json (sha256 spravovaných verejných súborov), profil.json a verzia.json. Bez účtov, relácií, kódov, pokusov,
// denníka a záloh. Do repozitára ho prenesie nastroje/sprava_import.py (README, Správa webu). Správa nič neposiela.
defined('SPRAVA') || exit;

final class Export
{
    public static function subory(): array
    {
        $D = Zmena::zive();
        $f = [];
        foreach (Nastavenie::DATA as $m) $f["data/$m.json"] = Nastavenie::d("data/$m.json");
        foreach (['img/s', 'pdf/s'] as $p) {
            $d = Nastavenie::w($p);
            if (!is_dir($d)) continue;
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($d, FilesystemIterator::SKIP_DOTS));
            foreach ($it as $x) {
                $rel = $p . '/' . str_replace('\\', '/', substr($x->getPathname(), strlen($d) + 1));
                if ($x->isFile() && preg_match('#^(img/s/\d{4}/\d{2}/[a-z0-9-]+\.(webp|avif)|pdf/s/\d{4}/\d{2}/[a-z0-9-]+\.pdf)$#', $rel)) $f[$rel] = $x->getPathname();
            }
        }
        $odt = [];
        foreach (array_merge(Zmena::subory($D), ['assets/index.json', 'sitemap.xml']) as $p) {
            if (!is_file(Nastavenie::w($p))) continue;
            $t = file_get_contents(Nastavenie::w($p));
            if ($p === 'sitemap.xml') $t = preg_replace('#<lastmod>[^<]*</lastmod>#', '', $t);   // dátum zmeny sa pri porovnaní neráta
            $odt[$p] = hash('sha256', $t);
        }
        return [$f, $odt, $D['verzia']];
    }

    public static function stiahnut(): void
    {
        [$f, $odt, $verzia] = self::subory();
        preg_match('#<html[^>]*\sdata-asistent="([^"]*)"#', (string)@file_get_contents(Nastavenie::w('index.html')), $m);
        $profil = ['asistent_api' => $m[1] ?? null];   // null = asistent vypnutý (balík bez ASISTENT_API), 'ukazka' = náhľad
        $meno = 'richtarik-obsah-' . date('Y-m-d') . '-r' . (int)$verzia['revizia'];
        $tmp = Nastavenie::d('export/' . $meno . '-' . bin2hex(random_bytes(4)));
        $doplnky = ['odtlacky.json' => json_encode($odt, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), 'profil.json' => json_encode($profil),
                    'verzia.json' => json_encode($verzia + ['export' => date('c')], JSON_UNESCAPED_SLASHES)];
        foreach (glob(Nastavenie::d('export/*')) ?: [] as $stary) if (filemtime($stary) < time() - 3600) @unlink($stary);
        if (class_exists('ZipArchive')) {
            $zip = new ZipArchive();
            if ($zip->open($tmp . '.zip', ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) Ui::chyba('Zálohu sa nepodarilo vytvoriť.');
            foreach ($f as $rel => $abs) $zip->addFile($abs, $rel);
            foreach ($doplnky as $rel => $t) $zip->addFromString($rel, $t);
            $zip->close();
            $subor = $tmp . '.zip'; $typ = 'application/zip'; $pripona = '.zip';
        } else {
            $tar = new PharData($tmp . '.tar');
            foreach ($f as $rel => $abs) $tar->addFile($abs, $rel);
            foreach ($doplnky as $rel => $t) $tar->addFromString($rel, $t);
            $subor = $tmp . '.tar'; $typ = 'application/x-tar'; $pripona = '.tar';
        }
        Dennik::zapis('export', ['suborov' => count($f)]);
        Pristup::hlavicky();
        header('Content-Type: ' . $typ);
        header('Content-Disposition: attachment; filename="' . $meno . $pripona . '"');
        header('Content-Length: ' . filesize($subor));
        readfile($subor);
        @unlink($subor);
        exit;
    }
}
