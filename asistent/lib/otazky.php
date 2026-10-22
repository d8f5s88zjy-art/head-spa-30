<?php
/* ASISTENT 30 – časté otázky: overené odpovede (znalosti/<prevadzka>-otazky.json) a hľadanie podobnej otázky,
 * rovnaké ako v prehliadači (barbershop-30/assets/asistent-otazky.js); barbershop-30/source/tools/otazky.mjs stráži,
 * že obe vrátia rovnaké poradie. K poslednej otázke návštevníka server pridá modelu najviac 6 najpodobnejších
 * (mimo časti v cache, aby sa pokyny nemenili a celý zoznam sa neplatil pri každej otázke). */
declare(strict_types=1);
if (!defined('ASISTENT')) { http_response_code(403); exit; }

const OTAZKY_DIAKRITIKA = ['á' => 'a', 'ä' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'å' => 'a', 'ā' => 'a', 'ă' => 'a', 'ą' => 'a',
  'č' => 'c', 'ć' => 'c', 'ç' => 'c', 'ď' => 'd', 'é' => 'e', 'ě' => 'e', 'ë' => 'e', 'è' => 'e', 'ê' => 'e', 'ē' => 'e', 'ę' => 'e',
  'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i', 'ĺ' => 'l', 'ľ' => 'l', 'ł' => 'l', 'ň' => 'n', 'ń' => 'n', 'ñ' => 'n',
  'ó' => 'o', 'ô' => 'o', 'ö' => 'o', 'ò' => 'o', 'õ' => 'o', 'ő' => 'o', 'ø' => 'o', 'ŕ' => 'r', 'ř' => 'r', 'š' => 's', 'ś' => 's',
  'ş' => 's', 'ť' => 't', 'ú' => 'u', 'ů' => 'u', 'ü' => 'u', 'ù' => 'u', 'û' => 'u', 'ű' => 'u', 'ý' => 'y', 'ÿ' => 'y', 'ž' => 'z',
  'ź' => 'z', 'ż' => 'z', 'ß' => 'ss'];
const OTAZKY_STOP = 'a aj ale alebo ako aka ake aki aky ani by bol bola bude budem co ci ho i ja je jeho jej ju k ku ' .
  'ma mam mame mate mat mi mna mne mnou moj moja moze mozem mozno my na nam nas ne nie o po pod pre pri s sa si ' .
  'som so su ta tak tam te to toho ten tu tvoj u uz v vam vas vo vy z za ze zo prosim vobec';
const OTAZKY_KONCOVKY = ['ovia', 'ami', 'ach', 'och', 'ych', 'ymi', 'imi', 'eho', 'emu', 'ovi', 'ich', 'ou', 'om', 'ov', 'ej',
  'ia', 'ie', 'iu', 'ii', 'ym', 'a', 'e', 'i', 'o', 'u', 'y'];

/* kmene slov: bez diakritiky a výplňových slov, koncovka preč, najviac 5 znakov (čísla celé) */
function otazky_kmene(string $text): array {
  static $stop = null;
  $stop ??= array_flip(explode(' ', OTAZKY_STOP));
  $t = preg_replace('/[^a-z0-9]+/', ' ', strtr(mb_strtolower($text, 'UTF-8'), OTAZKY_DIAKRITIKA));
  $out = [];
  foreach (explode(' ', (string) $t) as $w) {
    if ($w === '' || isset($stop[$w])) continue;
    $k = $w;
    if (!ctype_digit($w)) {
      foreach (OTAZKY_KONCOVKY as $s) if (strlen($k) - strlen($s) >= 3 && str_ends_with($k, $s)) { $k = substr($k, 0, -strlen($s)); break; }
      $k = substr($k, 0, 5);
    }
    $out['_' . $k] = $k;               // predpona: kľúč z číslic by PHP zmenilo na číslo
  }
  return array_values($out);
}

/* otázky s kmeňmi každého znenia a počtom otázok, v ktorých je slovo (váha slova) */
function otazky_db(string $prevadzka): ?array {
  static $c = [];
  if (array_key_exists($prevadzka, $c)) return $c[$prevadzka];
  $f = __DIR__ . "/../znalosti/$prevadzka-otazky.json";
  $d = is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
  if (!is_array($d) || !is_array($d['otazky'] ?? null)) return $c[$prevadzka] = null;
  $ot = []; $df = [];
  foreach ($d['otazky'] as $o) {
    $zn = [];
    foreach (array_merge([$o['q']], $o['v'] ?? []) as $z) { $k = otazky_kmene((string) $z); if ($k) $zn[] = $k; }
    $o['znenia'] = $zn;
    $ot[] = $o;
    $vsetky = [];
    foreach ($zn as $z) foreach ($z as $k) $vsetky['_' . $k] = $k;
    foreach ($vsetky as $kk => $k) $df[$kk] = ($df[$kk] ?? 0) + 1;
  }
  return $c[$prevadzka] = ['ot' => $ot, 'df' => $df, 'n' => count($ot)];
}

function otazky_idf(array $db, string $k): float { return log(1 + $db['n'] / ($db['df']['_' . $k] ?? 0.5)); }

/* zoradené otázky podľa podobnosti (Dice s váhami slov, najlepšie znenie), ako hladaj() v asistent-otazky.js */
function otazky_hladaj(array $db, string $text, int $kolko = 5): array {
  $q = otazky_kmene($text);
  if (!$q) return [];
  $wq = 0.0;
  foreach ($q as $k) $wq += otazky_idf($db, $k);
  $qs = [];
  foreach ($q as $k) $qs['_' . $k] = true;
  $vys = [];
  foreach ($db['ot'] as $o) {
    $naj = 0.0;
    foreach ($o['znenia'] as $z) {
      $m = 0.0; $wz = 0.0;
      foreach ($z as $k) { $w = otazky_idf($db, $k); $wz += $w; if (isset($qs['_' . $k])) $m += $w; }
      $s = round((2 * $m) / ($wq + $wz) * 1e6) / 1e6;
      if ($s > $naj) $naj = $s;
    }
    if ($naj > 0) $vys[] = ['o' => $o, 'skore' => $naj];
  }
  usort($vys, fn($a, $b) => ($b['skore'] <=> $a['skore']) ?: strcmp($a['o']['id'], $b['o']['id']));
  return array_slice($vys, 0, $kolko);
}

/* časť pre model: overené odpovede na otázky podobné poslednej otázke návštevníka (prázdne, keď nič nesedí) */
function otazky_pre_model(string $prevadzka, string $otazka): string {
  $db = otazky_db($prevadzka);
  if (!$db) return '';
  $h = array_filter(otazky_hladaj($db, $otazka, 6), fn($x) => $x['skore'] >= 0.3);
  if (!$h) return '';
  $t = 'ČASTÉ OTÁZKY podobné poslednej otázke návštevníka (overené odpovede):';
  foreach ($h as $x) $t .= "\n- " . $x['o']['q'] . "\n  " . $x['o']['a'];
  return $t;
}
