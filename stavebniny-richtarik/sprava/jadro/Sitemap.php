<?php
// sitemap.xml – rovnaký tvar ako build_sitemap (build.py); dátum zmeny: pri zmenených stránkach dnešný, inak ostáva.
defined('SPRAVA') || exit;

final class Sitemap
{
    /** [cesta => lastmod] zo súboru sitemap.xml. */
    public static function nacitaj(string $xml, string $domena): array
    {
        preg_match_all('#<url><loc>([^<]+)</loc><lastmod>([^<]+)</lastmod></url>#', $xml, $m, PREG_SET_ORDER);
        $von = [];
        foreach ($m as $x) {
            $u = html_entity_decode($x[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if (strpos($u, $domena) !== 0) continue;
            $p = substr($u, strlen($domena));
            $von[$p === '' ? 'index.html' : $p] = $x[2];
        }
        return $von;
    }

    public static function zostav(array $lastmod, string $domena): string
    {
        $p = array_keys($lastmod);
        sort($p, SORT_STRING);
        $x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
        foreach ($p as $c) $x .= '  <url><loc>' . Pomocne::e($domena . ($c === 'index.html' ? '' : $c)) . '</loc><lastmod>' . $lastmod[$c] . "</lastmod></url>\n";
        return Typografia::opravy($x . "</urlset>\n");
    }
}
