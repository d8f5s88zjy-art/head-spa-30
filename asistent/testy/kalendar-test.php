<?php
/* Test overenia voľných termínov (lib/kalendar.php) proti falošnému rezervačnému systému (testy/mock-rezervacie.php).
 * Spúšťa testy/spusti.sh: php testy/kalendar-test.php <url falošného systému> <priečinok>. */
declare(strict_types=1);
const ASISTENT = true;
[$_, $url, $dir] = $argv;
$cfgOn = "$dir/kal-on.php"; $cfgOff = "$dir/kal-off.php";
file_put_contents($cfgOn, "<?php return ['kluc' => 'sk-ant-test', 'cache_dir' => '$dir', 'kalendar' => ['url' => '$url', 'timeout' => 2.0]];");
file_put_contents($cfgOff, "<?php return ['kluc' => 'sk-ant-test', 'cache_dir' => '$dir'];");
putenv("ASISTENT_CONFIG=$cfgOn");
require __DIR__ . '/../lib/jadro.php';
require __DIR__ . '/../lib/kalendar.php';
require __DIR__ . '/../vendor/autoload.php';

$ok = 0; $zle = 0;
function skus(string $m, bool $c, string $x = ''): void { global $ok, $zle; if ($c) { $ok++; echo "OK   $m\n"; } else { $zle++; echo "FAIL $m  $x\n"; } }
$tz = new DateTimeZone('Europe/Bratislava');
$d = new DateTimeImmutable('tomorrow', $tz);
$pracovne = function (DateTimeImmutable $x) { while ((int) $x->format('N') === 7) $x = $x->modify('+1 day'); return $x; };
$d1 = $pracovne($d); $d2 = $pracovne($d1->modify('+1 day')); $d3 = $pracovne($d2->modify('+1 day')); $d4 = $pracovne($d3->modify('+1 day'));
$ned = $d; while ((int) $ned->format('N') !== 7) $ned = $ned->modify('+1 day');
file_put_contents(getenv('MOCK_SCEN'), json_encode([$d2->format('Y-m-d') => 'prazdne', $d3->format('Y-m-d') => 'chyba500', $d4->format('Y-m-d') => 'pomaly']));

$r = volne_terminy('Adrián', $d1->format('Y-m-d'), 1);
skus('overené: Adrián (Adrian v systéme) má voľné časy', $r['stav'] === 'overene' && $r['casy'] === ['09:00', '10:20', '14:00', '17:40'], json_encode($r, JSON_UNESCAPED_UNICODE));
skus('overené: služba a trvanie, čas overenia', $r['sluzba'] === 'Pánsky strih' && $r['trvanie_min'] === 40 && preg_match('/^\d\d:\d\d$/', $r['overene_o']) === 1);
skus('súkromie: poznámka s menom zákazníka sa nedostane von', !str_contains(json_encode($r, JSON_UNESCAPED_UNICODE), 'Jana') && !in_array('11:00', $r['casy'], true));
skus('žiadny voľný termín', volne_terminy('Adrian', $d2->format('Y-m-d'), 1)['stav'] === 'ziadny_volny');
skus('chyba rezervačného systému (500) = chyba, nie vymyslené časy', ($x = volne_terminy('Adrián', $d3->format('Y-m-d'), 18))['stav'] === 'chyba' && !isset($x['casy']));
$t0 = microtime(true); $x = volne_terminy('Adrián', $d4->format('Y-m-d'), 1);
skus('pomalý systém: po časovom limite chyba', $x['stav'] === 'chyba' && microtime(true) - $t0 < 4.5, json_encode($x, JSON_UNESCAPED_UNICODE));
skus('nedeľa = zatvorené (pravidlo kalendára)', volne_terminy('Adrián', $ned->format('Y-m-d'), 1)['stav'] === 'zatvorene');
skus('mimo rozsahu rezervácie (o 40 dní)', volne_terminy('Adrián', $d->modify('+40 days')->format('Y-m-d'), 1)['stav'] === 'mimo_rozsahu');
skus('minulosť', volne_terminy('Adrián', $d->modify('-3 days')->format('Y-m-d'), 1)['stav'] === 'minulost');
$x = volne_terminy('Peter', $d1->format('Y-m-d'), 1);
skus('neznámy barber: zoznam skutočných barberov', $x['stav'] === 'neznamy_barber' && in_array('Adrian', $x['barberi'], true));
skus('ktokoľvek', volne_terminy('ktokoľvek', $d1->format('Y-m-d'), 1)['stav'] === 'overene');
skus('neznáma služba', volne_terminy('Adrián', $d1->format('Y-m-d'), 999)['stav'] === 'neznama_sluzba');
skus('neplatný dátum', volne_terminy('Adrián', '2026-02-30', 1)['stav'] === 'chyba');
$log = (string) file_get_contents(getenv('MOCK_LOG'));
skus('objednávka (makeOrder) sa nikdy neodoslala', !str_contains($log, 'makeOrder'));
$pred = substr_count($log, '"metoda":"getTime"');
volne_terminy('Adrián', $d1->format('Y-m-d'), 1);
skus('časy sa 2 minúty berú z vyrovnávacej pamäte (žiadna nová požiadavka)', substr_count((string) file_get_contents(getenv('MOCK_LOG')), '"metoda":"getTime"') === $pred);
// zastarané časy (staršie ako 2 minúty) sa nepoužijú, ale overia znova
foreach (glob("$dir/kal-*.json") as $f) { $c = json_decode(file_get_contents($f), true); $c['t'] -= 600; file_put_contents($f, json_encode($c)); }
volne_terminy('Adrián', $d1->format('Y-m-d'), 1);
skus('staré časy sa overia znova', ($po = substr_count((string) file_get_contents(getenv('MOCK_LOG')), '"metoda":"getTime"')) === $pred + 1, "pred $pred po $po");

// bez napojenia: poctivé „nepripojene“
putenv("ASISTENT_CONFIG=$cfgOff");
$k = (new ReflectionFunction('konfig'));
skus('bez napojenia (config bez kalendar): stav nepripojene', (function () use ($cfgOff, $d1) {
  // konfig() si pamätá prvý súbor, preto samostatný proces
  $kod = "const ASISTENT = true; require '" . __DIR__ . "/../lib/jadro.php'; require '" . __DIR__ . "/../lib/kalendar.php'; echo volne_terminy('Adrián', '" . $d1->format('Y-m-d') . "', 1)['stav'];";
  return trim((string) shell_exec('ASISTENT_CONFIG=' . escapeshellarg($cfgOff) . ' php -r ' . escapeshellarg($kod))) === 'nepripojene';
})());
echo "$ok OK, $zle FAIL\n";
exit($zle ? 1 : 0);
