<?php
/* ASISTENT 30 – voľné termíny z rezervačného systému Barbershopu 30 (www.barbershop30.sk/rezervacia).
 *
 * Číta to isté, čo vidí návštevník v rezervačnom formulári: pravidlá kalendára (rozsah dní, zatvorené dni,
 * sviatky) a voľné začiatky pre zvolenú službu a barbera. Nikdy neodosiela objednávku (makeOrder sa tu
 * nepoužíva) a z odpovede berie len časy v tvare HH:MM; mená ani poznámky iných zákazníkov sa sem nedostanú.
 * Zapína ho config.php ('kalendar' => ['url' => …]) až so súhlasom prevádzky; bez neho vráti stav nepripojene.
 *
 * Výsledok pre model aj okno na webe:
 *   stav: overene | ziadny_volny | zatvorene | mimo_rozsahu | minulost | neznamy_barber | neznama_sluzba |
 *         nepripojene | chyba
 *   overene_o (HH:MM, čas Bratislava), barber, datum (YYYY-MM-DD), sluzba, trvanie_min, casy [HH:MM, …] */
declare(strict_types=1);
if (!defined('ASISTENT')) { http_response_code(403); exit; }

use Symfony\Component\HttpClient\HttpClient;

const TZ = 'Europe/Bratislava';
const KAL_TTL = 120;            // voľné časy staršie ako 2 minúty sa nepoužijú (iný zákazník si medzitým mohol termín vziať)
const KAL_TTL_PRAVIDLA = 3600;  // barberi a pravidlá kalendára sa menia zriedka
const KAL_TIMEOUT = 6.0;        // sekúnd na celé overenie; potom poctivo „neviem overiť“

/* služby zo zoznamu rezervačného systému (id, názov, trvanie v minútach) – rovnaké ako cenník na webe */
const SLUZBY = [
  1 => ['Pánsky strih', 40], 18 => ['Pánsky strih a úprava brady', 60], 19 => ['Pánsky strih, dĺžka vlasov nad 10 cm', 60],
  5 => ['Strih pre malých gentlemanov', 45], 2 => ['Oholenie hlavy', 25], 3 => ['Úprava brady', 20],
  4 => ['Holenie do hladka Hot Towel', 30], 11 => ['Farbenie brady', 30], 14 => ['Balíček 1', 65],
  15 => ['Ultra inclusive Barbershop30', 80], 6 => ['Starostlivosť o pleť PREMIUM', 30], 7 => ['Úprava obočia', 5],
  8 => ['Depilácia uší a nosa voskom', 10], 10 => ['Kreatívny ornament na hlave', 10], 12 => ['Farbenie obočia', 10],
];

function kal_konfig(): ?array {
  $k = konfig()['kalendar'] ?? null;
  return is_array($k) && !empty($k['url']) ? $k : null;
}

function teraz(): DateTimeImmutable { return new DateTimeImmutable('now', new DateTimeZone(TZ)); }

/* bez diakritiky a malými písmenami (Adrián = adrian) */
function bez_diakritiky(string $s): string {
  $t = strtr(mb_strtolower(trim($s)), ['á' => 'a', 'ä' => 'a', 'č' => 'c', 'ď' => 'd', 'é' => 'e', 'í' => 'i', 'ĺ' => 'l', 'ľ' => 'l',
    'ň' => 'n', 'ó' => 'o', 'ô' => 'o', 'ŕ' => 'r', 'š' => 's', 'ť' => 't', 'ú' => 'u', 'ý' => 'y', 'ž' => 'z']);
  return preg_replace('/[^a-z0-9 ]/', '', $t) ?? '';
}

/* ---------- vyrovnávacia pamäť na disku (data/), nikdy nie s osobnými údajmi: len časy a pravidlá ---------- */
function kal_cache(string $kluc, int $ttl, callable $ziskaj): array {
  $dir = (string) (konfig()['cache_dir'] ?? __DIR__ . '/../data');
  $f = $dir . '/kal-' . hash('sha256', $kluc) . '.json';
  $c = is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
  if (is_array($c) && isset($c['t'], $c['v']) && time() - (int) $c['t'] < $ttl) return [$c['v'], (int) $c['t']];
  $v = $ziskaj();
  @file_put_contents($f, json_encode(['t' => time(), 'v' => $v]), LOCK_EX);
  if (mt_rand(1, 50) === 1) foreach (glob($dir . '/kal-*.json') ?: [] as $g) if (time() - (int) @filemtime($g) > 86400) @unlink($g);   // upratanie starých dní
  return [$v, time()];
}

/* ---------- rozhranie rezervačného formulára (POST JSON s CSRF tokenom stránky, ako prehliadač) ---------- */
final class Rezervacie {
  private $http; private string $url; private ?string $token = null; private array $cookies = [];
  public function __construct(string $url, float $timeout) {
    $this->url = rtrim($url, '/');
    $this->http = HttpClient::create(['timeout' => $timeout, 'max_duration' => $timeout, 'headers' => ['User-Agent' => 'Barbershop30-asistent/1.0']]);
  }
  private function prihlas(): void {
    if ($this->token !== null) return;
    $r = $this->http->request('GET', $this->url);
    $html = $r->getContent();
    if (!preg_match('/name="csrf-token" content="([^"]+)"/', $html, $m)) throw new RuntimeException('chýba CSRF token');
    $this->token = $m[1];
    foreach ($r->getHeaders()['set-cookie'] ?? [] as $c) { $kv = explode(';', $c, 2)[0]; [$n, $v] = array_pad(explode('=', $kv, 2), 2, ''); $this->cookies[$n] = $v; }
  }
  public function volaj(string $metoda, array $data): array {
    if ($metoda === 'makeOrder') throw new LogicException('objednávku asistent nikdy neodosiela');
    $this->prihlas();
    $cookie = implode('; ', array_map(fn ($n, $v) => "$n=$v", array_keys($this->cookies), $this->cookies));
    $r = $this->http->request('POST', $this->url . '/ajax', [
      'headers' => ['X-CSRF-TOKEN' => $this->token, 'X-Requested-With' => 'XMLHttpRequest', 'Accept' => 'application/json', 'Cookie' => $cookie],
      'json' => ['ajax' => true, 'ajax_method' => $metoda] + $data,
    ]);
    $j = $r->toArray();
    if (!isset($j['result']) || !is_array($j['result'])) throw new RuntimeException('neočakávaná odpoveď');
    return $j['result'];
  }
}

/* dátum z rezervačného systému (1.1.2026 aj 01.01.2026) na YYYY-MM-DD */
function kal_datum(string $d): ?string {
  if (!preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/', trim($d), $m)) return null;
  return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
}

/* Overí voľné začiatky. $volaj(metoda, data) je rozhranie systému (v testoch falošné). */
function volne_terminy(string $barber, string $datum, int $sluzba, ?callable $volaj = null): array {
  $teraz = teraz();
  $zaklad = ['overene_o' => $teraz->format('H:i'), 'datum' => $datum];
  if (!isset(SLUZBY[$sluzba])) return $zaklad + ['stav' => 'neznama_sluzba'];
  [$nazov, $trvanie] = SLUZBY[$sluzba];
  $zaklad += ['sluzba' => $nazov, 'trvanie_min' => $trvanie];
  $den = DateTimeImmutable::createFromFormat('!Y-m-d', $datum, new DateTimeZone(TZ));
  if (!$den || $den->format('Y-m-d') !== $datum) return $zaklad + ['stav' => 'chyba', 'dovod' => 'neplatný dátum'];
  if ($den < $teraz->setTime(0, 0)) return $zaklad + ['stav' => 'minulost'];
  $k = kal_konfig();
  if (!$k && !$volaj) return $zaklad + ['stav' => 'nepripojene'];
  $volaj ??= (function () use ($k) { $api = new Rezervacie((string) $k['url'], (float) ($k['timeout'] ?? KAL_TIMEOUT)); return fn (string $m, array $d) => $api->volaj($m, $d); })();
  try {
    // barber podľa mena (bez diakritiky); „ktokoľvek“ = 0 (Nezáleží v rezervačnom formulári)
    [$barberi] = kal_cache("barberi:$sluzba", KAL_TTL_PRAVIDLA, function () use ($volaj, $sluzba) {
      $r = $volaj('getEmployees', ['services' => [$sluzba]]);
      $out = [];
      foreach ((array) ($r['employees'] ?? []) as $e) if (isset($e['id'], $e['name'])) $out[] = ['id' => (int) $e['id'], 'meno' => (string) $e['name']];
      return $out;
    });
    $hladaj = bez_diakritiky($barber);
    $kto = null;
    if (in_array($hladaj, ['', 'ktokolvek', 'nezalezi', 'hocikto', 'akykolvek'], true)) $kto = ['id' => 0, 'meno' => 'ktokoľvek'];
    else foreach ($barberi as $b) if ($b['id'] !== 0 && bez_diakritiky($b['meno']) === $hladaj) $kto = $b;
    if (!$kto) return $zaklad + ['stav' => 'neznamy_barber', 'barber' => $barber, 'barberi' => array_values(array_filter(array_map(fn ($b) => $b['id'] ? $b['meno'] : null, $barberi)))];
    $zaklad['barber'] = $kto['meno'];

    // pravidlá kalendára: rozsah dní, zatvorené dni v týždni, sviatky
    [$pravidla] = kal_cache("kalendar:$sluzba:{$kto['id']}", KAL_TTL_PRAVIDLA, function () use ($volaj, $sluzba, $kto) {
      $c = (array) (($volaj('getCalendar', ['services' => [$sluzba], 'employee' => $kto['id']]))['calendar'] ?? []);
      return ['od' => kal_datum((string) ($c['limits']['min'] ?? '')), 'do' => kal_datum((string) ($c['limits']['max'] ?? '')),
        'dni' => array_values(array_map('strval', (array) ($c['disabled_days'] ?? []))),
        'sviatky' => array_values(array_filter(array_map(fn ($d) => kal_datum((string) $d), (array) ($c['disabled_dates'] ?? []))))];
    });
    if (!$pravidla['od'] || !$pravidla['do']) return $zaklad + ['stav' => 'chyba', 'dovod' => 'kalendár bez rozsahu'];
    if ($datum < $pravidla['od'] || $datum > $pravidla['do']) return $zaklad + ['stav' => 'mimo_rozsahu', 'od' => $pravidla['od'], 'do' => $pravidla['do']];
    $skratka = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'][(int) $den->format('N') - 1];
    if (in_array($skratka, $pravidla['dni'], true)) return $zaklad + ['stav' => 'zatvorene', 'dovod' => 'zatvorený deň v týždni'];
    if (in_array($datum, $pravidla['sviatky'], true)) return $zaklad + ['stav' => 'zatvorene', 'dovod' => 'sviatok'];

    // voľné začiatky: z odpovede len reťazce HH:MM, nič iné
    [$casy, $kedy] = kal_cache("casy:$sluzba:{$kto['id']}:$datum", KAL_TTL, function () use ($volaj, $sluzba, $kto, $den) {
      $r = $volaj('getTime', ['services' => [$sluzba], 'employee' => $kto['id'], 'date' => $den->format('d.m.Y')]);
      if (!array_key_exists('times', $r)) throw new RuntimeException('odpoveď bez časov');
      $out = [];
      if (is_array($r['times'])) array_walk_recursive($r['times'], function ($v) use (&$out) { if (is_string($v) && preg_match('/^([01]?\d|2[0-3]):[0-5]\d$/', trim($v))) $out[] = sprintf('%05s', trim($v)); });
      return $out;
    });
    if (time() - $kedy > KAL_TTL) return $zaklad + ['stav' => 'chyba', 'dovod' => 'zastarané údaje'];
    $casy = array_values(array_unique($casy)); sort($casy);
    // dnes len časy, ktoré ešte neprešli
    if ($datum === $teraz->format('Y-m-d')) $casy = array_values(array_filter($casy, fn ($c) => $c > $teraz->format('H:i')));
    $zaklad['overene_o'] = (new DateTimeImmutable('@' . $kedy))->setTimezone(new DateTimeZone(TZ))->format('H:i');
    return $zaklad + ($casy ? ['stav' => 'overene', 'casy' => $casy] : ['stav' => 'ziadny_volny']);
  } catch (Throwable $e) {
    error_log('asistent kalendar: ' . $e->getMessage());
    return $zaklad + ['stav' => 'chyba', 'dovod' => 'spojenie s rezervačným systémom zlyhalo'];
  }
}
