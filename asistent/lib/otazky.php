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
/* slová, ktorých skrátený kmeň by splynul s iným slovom (recept a recepcia, počasie a „počas“, instagram a inštalatér):
   kmeňom je celá predpona */
const OTAZKY_CELE = ['pocasi', 'recept', 'instagram'];

/* kmene slov: bez diakritiky a výplňových slov, koncovka preč, najviac 5 znakov (čísla celé, OTAZKY_CELE celé) */
function otazky_kmene(string $text): array {
  static $stop = null;
  $stop ??= array_flip(explode(' ', OTAZKY_STOP));
  $t = preg_replace('/[^a-z0-9]+/', ' ', strtr(mb_strtolower($text, 'UTF-8'), OTAZKY_DIAKRITIKA));
  $out = [];
  foreach (explode(' ', (string) $t) as $w) {
    if ($w === '' || isset($stop[$w])) continue;
    $k = $w;
    if (!ctype_digit($w)) {
      $cele = null;
      foreach (OTAZKY_CELE as $p) if (str_starts_with($w, $p)) { $cele = $p; break; }
      if ($cele !== null) $k = $cele;
      else {
        foreach (OTAZKY_KONCOVKY as $s) if (strlen($k) - strlen($s) >= 3 && str_ends_with($k, $s)) { $k = substr($k, 0, -strlen($s)); break; }
        $k = substr($k, 0, 5);
      }
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

/* Cenník: otázka na cenu alebo čas jednej služby z cenníka dostane jej overenú odpoveď (cena-<služba>, trvanie-<služba>),
   keď ju hľadanie samo nevyberie. Rovnaké pravidlá ako smeruj() a najdi() v asistent-otazky.js (popis tam);
   otazky.mjs stráži, že server a prehliadač vyberú to isté. */
const OTAZKY_SPOJ = '( a| aj| s| so| plus| spolu s| aj s| a aj)';
const OTAZKY_SLUZBY = [
  ['ultra-inclusive', '/ultra|balic\w*.{0,25}whisk|whisk\w*.{0,25}balic/', 'balicek-1 strih-a-brada pansky-strih uprava-brady hot-towel uprava-obocia depilacia plet-premium'],
  ['balicek-1', '/balic\w* (1|jedn|prv)|balik (1|jedn)|prv\w* balic|zakladn\w* balic/', 'strih-a-brada pansky-strih uprava-brady hot-towel uprava-obocia depilacia'],
  ['farbenie-brady', '/(farb|tonov|sedin|sediv)\w*.{0,20}(brad|fuz)|(brad|fuz)\w*.{0,20}(farb|tonov|sedin|sediv)/', 'uprava-brady'],
  ['farbenie-obocia', '/farb\w*.{0,20}oboc|oboc\w*.{0,20}farb/', 'uprava-obocia'],
  ['dlhe-vlasy', '/(\bo?strih\w* )?(dlh\w*|dlhs\w*) vlas\w*|vlas\w* (dlh\w*|dlhs\w*)( ako)?( 10)?|(nad|cez|viac ako|dlhs\w* ako) 10|po plec/', 'pansky-strih'],
  ['strih-a-brada', '/\b(strih|ostrih|vlas)\w*( \w+)?(' . OTAZKY_SPOJ . '( \w+){0,2}| (uprav|zastrih)\w*) (brad|fuz)\w*|\b(brad|fuz)\w*( \w+)?' . OTAZKY_SPOJ . '( \w+){0,2} (strih|ostrih|vlas)\w*/', 'uprava-brady pansky-strih hot-towel'],
  ['oholenie-hlavy', '/(hol|britv)\w*.{0,20}hlav|hlav\w*.{0,20}(hol|britv|hladk)/', 'hot-towel'],
  ['uprava-obocia', '/oboc/', ''],
  ['hot-towel', '/do hladka|na hladko|nahladko|\b(o|vy)?hol\w* (tvar|brad)\w*/', 'uprava-brady'],
  ['uprava-brady', '/\b(o|za)?strih\w* (brady|fuzov)\b|brad|fuz/', 'hot-towel'],
  ['male-gentlemany', '/\bo?strih\w* pre (\w+ )?(syn|chlapc|diet|deti|mal)\w*|detsk|\bsyn|dieta|\bdeti|chlapc|chlapec|gentleman|\bmal(eho|emu|ych|ym)\b/', 'pansky-strih ornament'],
  ['hot-towel', '/hot towel|do hladka|britv|ohol\w* tvar|holen/', ''],
  ['plet-premium', '/\bplet|peeling|\bmask|premium/', ''],
  ['depilacia', '/depil|vosk/', ''],
  ['ornament', '/ornament|vzor/', ''],
  ['pansky-strih', '/\b(o?strih|o?strihu|o?strihom|o?strihy|o?strihov|o?strihani[ea]|fade)\b/', ''],
];
const OTAZKY_CENA = '/\bcen[auy]?\b|\bcenn|\bstoj|\bstal\b|\b(bude|by|ma) stat\b|\bzaplat|\bkolko (sa )?plat|\bvyjde|\bza kolko\b|\bkolko (si )?(pytate|uctujete)|\bkolko dam\b|\bdam za\b|\beur/';
const OTAZKY_CAS = '/\bdlho\b|\btrva|\bkolko casu\b|\bzaberie|\bminut/';
const OTAZKY_INE = '/\b(pes|psa|psov|psovi|psik\w*|mack\w*|zviera\w*|konkurenc\w*|inde|damsk\w*|zensk\w*|zen[auye]?|zenou|baby|'
  . 'dievc\w*|dcer\w*|priatelk\w*|manzelk\w*|melir\w*|trval\w*|kadernic\w*|rocn\w*|rok|roky|rokov|tined\w*|teen\w*|vnuk\w*|vnuc\w*|'
  . 'kartou|karta|kartu|hotovost\w*|vydrz\w*|zavis\w*|rozdiel\w*|dokedy|rovnak\w*|cak\w*|oprav\w*|dolad\w*|posob\w*|necha\w*|'
  . 'lacnejs\w*|drahs\w*|rychlejs\w*)\b|\b(dlhsie|kratsie) ako\b(?! 10)|\bviac\b(?! ako \d)|\d+ ?(eur\w*|e|min\w*|hod\w*)\b|'
  . 'farb\w*.{0,15}vlas|vlas\w*.{0,15}farb/';

/* overené odpovede z cenníka pre otázku na jednu či viac služieb (smerujVsetky() v asistent-otazky.js) */
/* mimo témy (MIMO, RIADI, MIESTO, OTVOR v asistent-otazky.js): zviera, trávnik, plot či záhrada pri strihu alebo cene
   a otváracie hodiny iného miesta dostanú telefón */
const OTAZKY_MIMO = '/\b(pes|psa|psov|psovi|psik\w*|mack\w*|zviera\w*|travn\w*|plot\w*|krik\w*|krov\w*|strom\w*|zahrad\w*|ovc\w*|kon[ai]?)\b/';
const OTAZKY_RIADI = '/strih|holen|ohol|stoj|cen|trva|farb|zaplat/';
const OTAZKY_MIESTO = '/\b(posta|posty|postu|poste|lekar\w*|tesco\w*|plavar\w*|bank[ay]|banku|bankach|kaufland\w*|lidl\w*|billa\w*)\b/';
const OTAZKY_OTVOR = '/otvor|zatvor|zatvar|hodin|\bkedy\b/';

function otazky_smeruj_vsetky(array $db, string $text): array {
  $t = trim((string) preg_replace('/[^a-z0-9]+/', ' ', strtr(mb_strtolower($text, 'UTF-8'), OTAZKY_DIAKRITIKA)));
  if ($t === '' || count(explode(' ', $t)) > 16 || preg_match(OTAZKY_INE, $t)) return [];
  $druh = preg_match(OTAZKY_CAS, $t) ? 'trvanie' : (preg_match(OTAZKY_CENA, $t) ? 'cena' : null);
  if ($druh === null) return [];
  $t = (string) preg_replace('/\b(bez|okrem)( \w+)? (brad|fuz|strih|ostrih|vlas|holen|ohol)\w*/', ' ', $t);
  $cely = $t;
  $viacLudi = (bool) preg_match('/\bpre (mna|seba|mnou)\b|\b(ja|mne) a\b/', $t);
  $vybrane = [];
  foreach (OTAZKY_SLUZBY as [$s, $re, $zahrna]) {
    if (!preg_match($re, $t, $m, PREG_OFFSET_CAPTURE)) continue;
    if ($s === 'male-gentlemany' && !preg_match('/strih|fade|gentleman/', $cely)) continue;
    $t = substr($t, 0, $m[0][1]) . ' ' . substr($t, $m[0][1] + strlen($m[0][0]));
    $uz = false;
    foreach ($vybrane as [$x, $z]) if ($x === $s || (in_array($s, $z === '' ? [] : explode(' ', $z), true) && !($viacLudi && $x === 'male-gentlemany'))) { $uz = true; break; }
    if (!$uz) $vybrane[] = [$s, $zahrna];
  }
  $out = [];
  foreach ($vybrane as [$s]) foreach ($db['ot'] as $o) if ($o['id'] === "$druh-$s") { $out[] = $o; break; }
  return $out;
}

function otazky_smeruj(array $db, string $text): ?array {
  $v = otazky_smeruj_vsetky($db, $text);
  return count($v) === 1 ? $v[0] : null;
}

/* ako otazky_hladaj(), na prvom mieste smerovaná odpoveď z cenníka (najdi() v asistent-otazky.js) */
function otazky_najdi(array $db, string $text, int $kolko = 5, float $prah = 0.0): array {
  $t = trim((string) preg_replace('/[^a-z0-9]+/', ' ', strtr(mb_strtolower($text, 'UTF-8'), OTAZKY_DIAKRITIKA)));
  if ((preg_match(OTAZKY_MIMO, $t) && preg_match(OTAZKY_RIADI, $t)) || (preg_match(OTAZKY_MIESTO, $t) && preg_match(OTAZKY_OTVOR, $t))) return [];
  $h = otazky_hladaj($db, $text, $kolko);
  $v = otazky_smeruj_vsetky($db, $text);
  $top = $h[0] ?? null;
  $sluzba = (bool) preg_match('/^(cena|trvanie)-(' . implode('|', array_map(fn($x) => preg_quote($x[0], '/'), OTAZKY_SLUZBY)) . ')$/', $top['o']['id'] ?? '');
  // viac služieb (cennik-viac v asistent-otazky.js): prvé vety ich overených odpovedí za sebou, nič sa nesčítava
  if (count($v) > 1 && (!$top || $top['skore'] < $prah || $sluzba)) {
    $a = implode(' ', array_map(fn($x) => preg_split('/(?<=[.!?])\s/u', $x['a'])[0], $v)) . ' Ceny sú konečné.';
    return array_slice(array_merge([['o' => ['id' => 'cennik-viac', 'q' => $text, 'a' => $a, 'viac' => array_column($v, 'id')], 'skore' => 1]], $h), 0, $kolko);
  }
  $s = count($v) === 1 ? $v[0] : null;
  if (!$s) return $h;
  preg_match(str_starts_with($s['id'], 'cena-') ? '/\d+(?:,\d+)? €/u' : '/\d+ minút/u', $s['a'], $m);
  $c = $m[0] ?? '';
  if ($top && $top['skore'] >= $prah && ($top['o']['id'] === $s['id'] || (!$sluzba && ($top['skore'] >= 0.9
      || ($c !== '' && str_contains(preg_split('/(?<=[.!?])\s/u', $top['o']['a'])[0], $c)))))) return $h;
  $ine = array_values(array_filter($h, fn($x) => $x['o']['id'] !== $s['id']));
  return array_slice(array_merge([['o' => $s, 'skore' => 1]], $ine), 0, $kolko);
}

/* časť pre model: overené odpovede na otázky podobné poslednej otázke návštevníka (prázdne, keď nič nesedí);
   pri otázke na cenu alebo čas služby z cenníka je jej overená odpoveď prvá */
function otazky_pre_model(string $prevadzka, string $otazka): string {
  $db = otazky_db($prevadzka);
  if (!$db) return '';
  $h = array_filter(otazky_najdi($db, $otazka, 6), fn($x) => $x['skore'] >= 0.3);
  if (!$h) return '';
  // otázka na viac služieb: modelu ide na prvé miesta každá nájdená overená odpoveď zvlášť (nič sa nesčítava)
  $prva = reset($h);
  if ($prva['o']['id'] === 'cennik-viac') {
    $viac = array_values(array_filter($db['ot'], fn($o) => in_array($o['id'], $prva['o']['viac'], true)));
    usort($viac, fn($a, $b) => array_search($a['id'], $prva['o']['viac'], true) <=> array_search($b['id'], $prva['o']['viac'], true));
    $h = array_merge(array_map(fn($o) => ['o' => $o, 'skore' => 1], $viac), array_slice($h, 1));
  }
  $t = 'ČASTÉ OTÁZKY podobné poslednej otázke návštevníka (overené odpovede):';
  foreach ($h as $x) $t .= "\n- " . $x['o']['q'] . "\n  " . $x['o']['a'];
  return $t;
}
