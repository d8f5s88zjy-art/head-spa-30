<?php
// Index hľadania assets/index.json – prenos build_search_index (build.py) cez DOMDocument (ten istý parser libxml2 ako lxml).
defined('SPRAVA') || exit;

final class Hladanie
{
    private static function norm(string $s): string
    {
        return trim(preg_replace('/\s+/u', ' ', $s), ' ');
    }

    public static function dom(string $html): DOMDocument
    {
        $d = new DOMDocument();
        $stare = libxml_use_internal_errors(true);
        $d->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($stare);
        return $d;
    }

    /** Záznam {t, k, p, x} pre stránku p (relatívna cesta) z koreňa webu R. */
    public static function zaznam(string $R, string $p, ?array $K = null): array
    {
        $K = $K ?? json_decode(file_get_contents($R . '/sprava/kostry/konstanty.json'), true);
        return self::zaznamZTextu($p, file_get_contents($R . '/' . $p), $K);
    }

    public static function zaznamZTextu(string $p, string $html, array $K): array
    {
        $doc = self::dom($html);
        $xp = new DOMXPath($doc);
        $h1 = $xp->query('//h1');
        $t = $h1->length ? self::norm($h1->item(0)->textContent) : $p;
        $lede = [];
        foreach ($xp->query('//section[contains(@class,"page-head")]//p[contains(@class,"lede")]') as $e) $lede[] = self::norm($e->textContent);
        $lede = implode(' ', $lede);
        $main = $xp->query('//main');
        $txt = '';
        if ($main->length) {
            $m = $main->item(0);
            $zmaz = [];
            foreach ($xp->query('.//aside|.//nav|.//script|.//*[contains(@class,"search")]|.//*[contains(@class,"kat-cta")]|.//section[contains(@class,"page-head")]', $m) as $e) $zmaz[] = $e;
            foreach ($zmaz as $e) {
                // lxml pri remove() zmaže aj text za prvkom (tail)
                $n = $e->nextSibling;
                if ($n instanceof DOMText && !($n instanceof DOMCdataSection)) $n->parentNode->removeChild($n);
                if ($e->parentNode) $e->parentNode->removeChild($e);
            }
            $casti = [];
            foreach ($xp->query('.//text()', $m) as $x) if (!($x->parentNode instanceof DOMComment)) $casti[] = $x->nodeValue;
            $txt = self::norm(implode(' ', $casti));
        }
        $info = $K['hladanie'][$p] ?? null;
        if ($info) { $k = $info['k']; $ponuka = $info['ponuka']; }
        else { $k = ['akcie' => 'Akcie', 'novinky' => 'Novinky', 'galeria' => 'Galéria'][explode('/', $p)[0]] ?? 'Stránka'; $ponuka = ''; }
        $x = mb_substr(self::norm(implode(' ', [$lede, $ponuka, $txt])), 0, 1600);
        return ['t' => $t, 'k' => $k, 'p' => $p, 'x' => $x];
    }

    /** Celý obsah assets/index.json pre zoznam stránok (zoradený ako v Pythone). */
    public static function index(string $R, array $stranky): string
    {
        sort($stranky, SORT_STRING);
        $K = json_decode(file_get_contents($R . '/sprava/kostry/konstanty.json'), true);
        $idx = [];
        foreach ($stranky as $p) if ($p !== 'index.html') $idx[] = self::zaznam($R, $p, $K);
        return Typografia::opravy(Pomocne::jsonPy($idx, true));
    }
}
