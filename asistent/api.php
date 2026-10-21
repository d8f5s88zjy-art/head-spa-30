<?php
/* ASISTENT 30 – odpovede na otázky návštevníkov webu (Claude Opus 5.5 cez oficiálnu knižnicu Anthropic).
 *   GET  api.php?a=stav    -> {"ok":true,"zapnute":bool}  (okno na webe sa ukáže, len keď je zapnuté)
 *   POST api.php?a=otazka  telo {"prevadzka":"barbershop","jazyk":"sk","spravy":[{"r":"u","t":"…"},…]}
 *        -> text/event-stream: udalosti "text" {"t":"…"}, "termin" {výsledok overenia kalendára, lib/kalendar.php},
 *           "tel" {} (odpoveď o termíne: okno ukáže Zavolať a potvrdiť termín), na konci "koniec" {},
 *           pri chybe "chyba" {"chyba":"…"}
 * Kľúč API je len v config.php (vytvorí ho nasadenie z tajomstva ANTHROPIC_API_KEY), nikdy v prehliadači. */
declare(strict_types=1);
const ASISTENT = true;
require __DIR__ . '/lib/jadro.php';
require __DIR__ . '/lib/kalendar.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
cors();
$o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($o !== '' && !povod_povoleny($o)) chyba('Zakázaný pôvod.', 403);
$a = (string) ($_GET['a'] ?? '');
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';

// zapnutý = kľúč, knižnica aj PHP aspoň 8.1 (knižnica Anthropic staršie PHP nespustí)
// kalendar: napojenie na voľné termíny je zapnuté (okno potom ponúkne otázku na voľný termín)
if ($a === 'stav') odpoved(['ok' => true, 'zapnute' => kluc_api() !== '' && is_file(__DIR__ . '/vendor/autoload.php') && PHP_VERSION_ID >= 80100, 'kalendar' => kal_konfig() !== null]);
if ($a !== 'otazka') chyba('Neznáma akcia.', 404);
if (!$post) chyba('POST', 405);
if (!str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) chyba('Očakávam JSON.', 415);
if (kluc_api() === '') chyba('Asistent je vypnutý.', 503);

$v = vstup();
$prevadzka = (string) ($v['prevadzka'] ?? '');
if (!isset(PREVADZKY[$prevadzka])) chyba('Neznáma prevádzka.');
$jazyk = in_array($v['jazyk'] ?? '', JAZYKY, true) ? (string) $v['jazyk'] : 'sk';
$spravy = rozhovor($v['spravy'] ?? null);
if (!limit_ok()) chyba('Veľa otázok naraz. Skús to o chvíľu alebo zavolaj na recepciu.', 429);

require __DIR__ . '/vendor/autoload.php';

use Anthropic\Beta\Messages\BetaRawContentBlockDeltaEvent;
use Anthropic\Beta\Messages\BetaTextDelta;
use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\RateLimitException;
use Anthropic\Lib\Streaming\MessageAccumulator;

/* odpoveď ide po kúskoch hneď, ako ich model napíše (bez vyrovnávania v PHP ani v Apache) */
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
$zly = 'Teraz neviem odpovedať. Zavolaj nám na 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.';
$otazka = (string) end($spravy)['content'];
$telefon = o_termine($otazka);
try {
  $client = new Client(apiKey: kluc_api(), requestOptions: ['maxRetries' => 1, 'timeout' => 60.0]);
  $odmietnute = false; $text = '';
  /* rozhovor s nástrojom: model sa môže opýtať kalendára (najviac 3 kolá); každé kolo ide prúdom a celá správa
     (aj premýšľanie s podpisom a volanie nástroja) sa vráti modelu nezmenená */
  for ($kolo = 0; $kolo < 3; $kolo++) {
    $stream = $client->beta->messages->createStream(
      model: (string) ($k['model'] ?? 'claude-opus-5-5'),
      maxTokens: 4000,
      system: [
        // pokyny a znalosti sa nemenia: vyrovnávacia pamäť na strane API (lacnejšie a rýchlejšie ďalšie otázky)
        ['type' => 'text', 'text' => pokyny($prevadzka), 'cacheControl' => ['type' => 'ephemeral']],
        ['type' => 'text', 'text' => dnes_text() . " Jazyk stránky návštevníka: $jazyk."],
      ],
      messages: $spravy,
      tools: nastroje(),
      // krátke odpovede na otázky o podniku: nízke úsilie stačí a odpoveď príde rýchlo (config.php 'usilie')
      outputConfig: ['effort' => (string) ($k['usilie'] ?? 'low')],
      fallbacks: 'default',
      betas: ['server-side-fallback-2026-07-01'],
    );
    $acc = MessageAccumulator::forBetaMessages();
    foreach ($stream as $e) {
      if (connection_aborted()) exit;
      $acc->accumulate($e);
      if ($e instanceof BetaRawContentBlockDeltaEvent && $e->delta instanceof BetaTextDelta) { $text .= $e->delta->text; udalost('text', ['t' => $e->delta->text]); }
    }
    $msg = $acc->message();
    if ($msg->stopReason === 'refusal') { $odmietnute = true; break; }
    if ($msg->stopReason !== 'tool_use') break;
    $vysledky = [];
    foreach ($msg->content as $b) {
      if ($b->type !== 'tool_use') continue;
      $in = is_array($b->input) ? $b->input : [];
      $r = $b->name === 'over_volne_terminy'
        ? volne_terminy((string) ($in['barber'] ?? ''), (string) ($in['datum'] ?? ''), (int) ($in['sluzba_id'] ?? 0))
        : ['stav' => 'chyba', 'dovod' => 'neznámy nástroj'];
      $telefon = true;
      udalost('termin', $r);
      $vysledky[] = ['type' => 'tool_result', 'toolUseID' => $b->id, 'content' => json_encode($r, JSON_UNESCAPED_UNICODE)];
    }
    $spravy[] = ['role' => 'assistant', 'content' => $msg->content];
    $spravy[] = ['role' => 'user', 'content' => $vysledky];
  }
  if ($odmietnute) { udalost('chyba', ['chyba' => 'Na toto neodpoviem. S Barbershopom 30 ti rád pomôžem.']); exit; }
  if ($telefon || o_termine($text)) udalost('tel', []);
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
