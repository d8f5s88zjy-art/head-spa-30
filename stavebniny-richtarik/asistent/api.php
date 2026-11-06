<?php
/* ASISTENT STAVEBNÍN RICHTÁRIK – odpovede na otázky návštevníkov webu (model Claude Opus 5.5 cez oficiálnu knižnicu
 * Anthropic pre PHP). Prevzaté z Barbershopu 30 (asistent/api.php) bez rezervačného kalendára a bez nástrojov.
 *   GET  api.php?a=stav    -> {"ok":true,"zapnute":bool}  (okno na webe sa ukáže, len keď je zapnuté)
 *   POST api.php?a=otazka  telo {"prevadzka":"richtarik","spravy":[{"r":"u","t":"…"},…]}
 *        -> text/event-stream: udalosti "text" {"t":"…"}, "tel" {} (pod odpoveď patrí Zavolať), na konci "koniec" {},
 *           pri chybe "chyba" {"chyba":"…"}
 * Kľúč API je len v config.php na serveri (mimo repozitára), nikdy v prehliadači. Rozhovory sa neukladajú. */
declare(strict_types=1);
const ASISTENT = true;
require __DIR__ . '/lib/jadro.php';
require __DIR__ . '/lib/otazky.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');
cors();
$o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($o !== '' && !povod_povoleny($o)) chyba('Zakázaný pôvod.', 403);
$a = (string) ($_GET['a'] ?? '');
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';

// zapnutý = kľúč, knižnica aj PHP aspoň 8.1 (knižnica Anthropic staršie PHP nespustí)
if ($a === 'stav') odpoved(['ok' => true, 'zapnute' => kluc_api() !== '' && is_file(__DIR__ . '/vendor/autoload.php') && PHP_VERSION_ID >= 80100]);
if ($a !== 'otazka') chyba('Neznáma akcia.', 404);
if (!$post) chyba('POST', 405);
if (!str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) chyba('Očakávam JSON.', 415);
if (kluc_api() === '' || !is_file(__DIR__ . '/vendor/autoload.php')) chyba('Asistent je vypnutý.', 503);

$v = vstup();
$prevadzka = (string) ($v['prevadzka'] ?? '');
if (!isset(PREVADZKY[$prevadzka])) chyba('Neznáma prevádzka.');
$spravy = rozhovor($v['spravy'] ?? null);
if (!limit_ok()) chyba('Veľa otázok naraz. Skúste to o chvíľu alebo zavolajte na 0905 622 223.', 429);

require __DIR__ . '/vendor/autoload.php';

use Anthropic\Beta\Messages\BetaRawContentBlockDeltaEvent;
use Anthropic\Beta\Messages\BetaTextDelta;
use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\RateLimitException;
use Anthropic\Lib\Streaming\MessageAccumulator;

/* odpoveď ide po kúskoch hneď, ako ich model napíše (bez vyrovnávania v PHP, Apache ani IIS) */
ignore_user_abort(false);
@ini_set('zlib.output_compression', '0');
@ini_set('output_buffering', '0');
while (ob_get_level() > 0) ob_end_clean();
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-store');
header('X-Accel-Buffering: no');
function udalost(string $meno, array $data): void {
  echo "event: $meno\ndata: " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
  flush();
}
echo ':' . str_repeat(' ', 2048) . "\n\n"; flush();   // niektoré proxy pošlú prvé bajty až po 2 kB

$k = konfig();
$zly = 'Teraz neviem odpovedať. Zavolajte nám na 0905 622 223 (pondelok až piatok 7:00 až 16:00, sobota 7:00 až 12:00).';
$otazka = (string) end($spravy)['content'];
// overené odpovede na podobné časté otázky (lib/otazky.php), mimo časti v cache
$caste = otazky_pre_model($prevadzka, $otazka);
try {
  $client = new Client(apiKey: kluc_api(), requestOptions: ['maxRetries' => 1, 'timeout' => 60.0]);
  $stream = $client->beta->messages->createStream(
    model: (string) ($k['model'] ?? 'claude-opus-5-5'),
    maxTokens: 4000,
    system: [
      // pokyny a znalosti sa nemenia: vyrovnávacia pamäť na strane API (lacnejšie a rýchlejšie ďalšie otázky)
      ['type' => 'text', 'text' => pokyny($prevadzka), 'cacheControl' => ['type' => 'ephemeral']],
      ['type' => 'text', 'text' => dnes_text() . ($caste !== '' ? "\n\n$caste" : '')],
    ],
    messages: $spravy,
    // krátke odpovede na otázky o firme: nízke úsilie stačí a odpoveď príde rýchlo (config.php 'usilie')
    outputConfig: ['effort' => (string) ($k['usilie'] ?? 'low')],
    fallbacks: 'default',
    betas: ['server-side-fallback-2026-07-01'],
  );
  $acc = MessageAccumulator::forBetaMessages();
  $text = '';
  foreach ($stream as $e) {
    if (connection_aborted()) exit;
    $acc->accumulate($e);
    if ($e instanceof BetaRawContentBlockDeltaEvent && $e->delta instanceof BetaTextDelta) { $text .= $e->delta->text; udalost('text', ['t' => $e->delta->text]); }
  }
  if ($acc->message()->stopReason === 'refusal') { udalost('chyba', ['chyba' => 'Na toto neodpoviem. So Stavebninami Richtárik vám radi pomôžeme.']); exit; }
  if (treba_volat($otazka) || treba_volat($text)) udalost('tel', []);
  udalost('koniec', []);
} catch (RateLimitException $e) {
  error_log('asistent: limit API ' . $e->getMessage());
  udalost('chyba', ['chyba' => $zly]);
} catch (APIStatusException $e) {
  error_log('asistent: API ' . $e->getMessage());
  udalost('chyba', ['chyba' => $zly]);
} catch (APIConnectionException $e) {
  error_log('asistent: spojenie ' . $e->getMessage());
  udalost('chyba', ['chyba' => $zly]);
}
