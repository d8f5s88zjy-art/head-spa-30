<?php
// Brána zhody Python = PHP (spúšťa nastroje/sprava_zhoda.py): php sprava/testy/zhoda.php <koreň webu> [prípady.json]
// 1. všetky oblasti vo všetkých súboroch z sprava/kostry/oblasti.json vykreslené v PHP z data/*.json = obsah súborov,
// 2. ak je zadaný súbor prípadov z Pythonu: typografia, opravy, šablóny, SEO a hľadanie na tých istých vstupoch.
const SPRAVA = 1;
require __DIR__ . '/../jadro/autoload.php';
$R = rtrim($argv[1] ?? dirname(__DIR__, 2), '/');
$D = [];
foreach (['firma', 'cennik', 'akcie', 'caste', 'novinky', 'galeria', 'texty'] as $m) $D[$m] = json_decode(file_get_contents("$R/data/$m.json"), true, 512, JSON_THROW_ON_ERROR);
$D['k'] = json_decode(file_get_contents("$R/sprava/kostry/konstanty.json"), true, 512, JSON_THROW_ON_ERROR);
$obl = json_decode(file_get_contents("$R/sprava/kostry/oblasti.json"), true, 512, JSON_THROW_ON_ERROR);
$chyby = 0; $n = 0;
foreach ($obl as $p => $ids) {
    $t = file_get_contents("$R/$p");
    foreach (Vykreslenie::oblasti_v($t) as [$id, $obsah]) {
        $n++;
        $nove = Vykreslenie::vykresli($id, $p, $D);
        if ($nove !== $obsah) {
            $chyby++;
            if ($chyby <= 8) {
                $i = 0; while ($i < min(strlen($nove), strlen($obsah)) && $nove[$i] === $obsah[$i]) $i++;
                fwrite(STDERR, "ROZDIEL $p [$id] pri bajte $i:\n  py: " . substr($obsah, max(0, $i - 80), 200) . "\n  php: " . substr($nove, max(0, $i - 80), 200) . "\n");
            }
        }
    }
}
echo "oblasti: $n, rozdielov $chyby\n";
if (isset($argv[2])) {
    $P = json_decode(file_get_contents($argv[2]), true, 512, JSON_THROW_ON_ERROR);
    if (isset($P['oblasti'])) {   // oblasti z pozmenených dát (ako po úkonoch v správe)
        [$zoz, $X] = $P['oblasti']; $z = 0;
        foreach ($zoz as [$oid, $c, $ocak]) {
            $v = Vykreslenie::vykresli($oid, $c, $X);
            if ($v !== $ocak) { $z++; if ($z <= 5) fwrite(STDERR, "ROZDIEL oblasť $oid ($c):\n  py:  " . substr($ocak, 0, 400) . "\n  php: " . substr($v, 0, 400) . "\n"); }
        }
        echo 'oblasti z pozmenených dát: ' . count($zoz) . " prípadov, rozdielov $z\n";
        $chyby += $z;
        unset($P['oblasti']);
    }
    if (isset($P['asistent'])) {   // znalosti a okno asistenta po zmene hodín (R-1)
        [$zoz, $X] = $P['asistent']; $z = 0;
        foreach ($zoz as [$c, $t, $ocak]) {
            $v = str_ends_with($c, '.md') ? Vykreslenie::asistent_znalosti($X, $t) : (str_ends_with($c, '.js') ? Vykreslenie::asistent_js($X, $t) : Vykreslenie::asistent_otazky($X, $t));
            if ($v !== $ocak || $v === $t) { $z++; if ($z <= 5) fwrite(STDERR, "ROZDIEL asistent $c\n"); }
        }
        echo 'asistent po zmene hodín: ' . count($zoz) . " súborov, rozdielov $z\n";
        $chyby += $z;
        unset($P['asistent']);
    }
    foreach ($P as $druh => $pripady) {
        $z = 0; $k = 0;
        foreach ($pripady as $c) {
            $k++;
            switch ($druh) {
                case 'typografia': $v = Typografia::typografia($c[0]); break;
                case 'txt': $v = Typografia::txt($c[0]); break;
                case 'sablona': $v = Sablona::vyplnit($c[0], $c[1]); $c = [$c[0], $c[2]]; break;
                case 'popis': $v = Seo::popis($c[0], $c[1], $c[2], $c[3]); $c = [$c[0], $c[4]]; break;
                case 'hladanie': $v = Typografia::opravy(Pomocne::jsonPy(Hladanie::zaznam($R, $c[0]), true)); break;
                case 'json': $v = Pomocne::jsonPy($c[0], (bool)$c[2]); $c = [$c[0], $c[1]]; break;
                case 'quote': $v = Pomocne::quote($c[0]); break;
                case 'oblasti': break;
                default: $v = null;
            }
            if ($v !== $c[1]) { $z++; if ($z <= 5) fwrite(STDERR, "ROZDIEL $druh: " . json_encode($c[0], JSON_UNESCAPED_UNICODE) . "\n  py:  " . json_encode($c[1], JSON_UNESCAPED_UNICODE) . "\n  php: " . json_encode($v, JSON_UNESCAPED_UNICODE) . "\n"); }
        }
        echo "$druh: $k prípadov, rozdielov $z\n";
        $chyby += $z;
    }
}
exit($chyby ? 1 : 0);
