<?php
/* Falošné Messages API pre testy: odpovedá prúdom udalostí ako skutočné API, každých 300 ms jeden kúsok textu.
 * Telo požiadavky a hlavičky uloží do $MOCK_LOG (testy ich kontrolujú). Spúšťa testy/spusti.sh.
 * Otázka s „TERMIN <barber> <YYYY-MM-DD>“: prvé kolo vráti premýšľanie s podpisom a volanie nástroja over_volne_terminy,
 * druhé kolo (po výsledku nástroja) skontroluje, že server vrátil premýšľanie aj volanie nezmenené, a odpovie
 * textom s výsledkom nástroja („VYSLEDOK <stav> <časy>“). */
$telo = file_get_contents('php://input');
file_put_contents((string) getenv('MOCK_LOG'), json_encode(['uri' => $_SERVER['REQUEST_URI'], 'beta' => $_SERVER['HTTP_ANTHROPIC_BETA'] ?? '', 'kluc' => $_SERVER['HTTP_X_API_KEY'] ?? '', 'telo' => json_decode($telo, true)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND);
$req = json_decode($telo, true);
$posledna = end($req['messages']);
$prvaOtazka = '';
foreach ($req['messages'] as $m) if ($m['role'] === 'user' && is_string($m['content'])) $prvaOtazka = $m['content'];
$text = is_string($posledna['content']) ? $posledna['content'] : '';
if (str_contains($text, 'CHYBA500')) { http_response_code(500); header('Content-Type: application/json'); echo '{"type":"error","error":{"type":"api_error","message":"skúšobná chyba"}}'; exit; }
header('Content-Type: text/event-stream');
while (ob_get_level()) ob_end_clean();
function ev($typ, $data) { echo "event: $typ\ndata: " . json_encode(['type' => $typ] + $data, JSON_UNESCAPED_UNICODE) . "\n\n"; flush(); }
function start($model) { ev('message_start', ['message' => ['id' => 'msg_test', 'type' => 'message', 'role' => 'assistant', 'model' => $model, 'content' => [], 'stop_reason' => null, 'stop_sequence' => null, 'usage' => ['input_tokens' => 10, 'output_tokens' => 1]]]); }
function textovo($kusy, $stop = 'end_turn', $od = 0) {
  ev('content_block_start', ['index' => $od, 'content_block' => ['type' => 'text', 'text' => '']]);
  foreach ($kusy as $kus) { usleep(300000); ev('content_block_delta', ['index' => $od, 'delta' => ['type' => 'text_delta', 'text' => $kus]]); }
  ev('content_block_stop', ['index' => $od]);
  ev('message_delta', ['delta' => ['stop_reason' => $stop, 'stop_sequence' => null], 'usage' => ['output_tokens' => 12]]);
  ev('message_stop', []);
}
start($req['model']);
// druhé kolo: posledná správa sú výsledky nástroja
if (is_array($posledna['content']) && ($posledna['content'][0]['type'] ?? '') === 'tool_result') {
  $asist = $req['messages'][count($req['messages']) - 2];
  $typy = array_map(fn ($b) => $b['type'] ?? '?', (array) $asist['content']);
  $podpis = ($asist['content'][0]['signature'] ?? '') === 'podpis-123' && ($asist['content'][0]['thinking'] ?? null) === 'Pozriem kalendár.';
  $volanie = ($asist['content'][1]['id'] ?? '') === 'toolu_1' && $posledna['content'][0]['tool_use_id'] === 'toolu_1';
  $r = json_decode((string) $posledna['content'][0]['content'], true);
  textovo([($podpis && $volanie ? 'CELE ' : 'ZMENENE ' . implode(',', $typy) . ' '), 'VYSLEDOK ' . ($r['stav'] ?? '?') . ' ' . implode(',', $r['casy'] ?? []) . '.']);
  exit;
}
if (preg_match('/TERMIN (\S+) (\d{4}-\d{2}-\d{2})/u', $text, $m)) {
  ev('content_block_start', ['index' => 0, 'content_block' => ['type' => 'thinking', 'thinking' => '', 'signature' => '']]);
  ev('content_block_delta', ['index' => 0, 'delta' => ['type' => 'thinking_delta', 'thinking' => 'Pozriem kalendár.']]);
  ev('content_block_delta', ['index' => 0, 'delta' => ['type' => 'signature_delta', 'signature' => 'podpis-123']]);
  ev('content_block_stop', ['index' => 0]);
  ev('content_block_start', ['index' => 1, 'content_block' => ['type' => 'tool_use', 'id' => 'toolu_1', 'name' => 'over_volne_terminy', 'input' => new stdClass()]]);
  $json = json_encode(['barber' => $m[1], 'datum' => $m[2], 'sluzba_id' => 1], JSON_UNESCAPED_UNICODE);
  foreach (str_split($json, 12) as $kus) ev('content_block_delta', ['index' => 1, 'delta' => ['type' => 'input_json_delta', 'partial_json' => $kus]]);
  ev('content_block_stop', ['index' => 1]);
  ev('message_delta', ['delta' => ['stop_reason' => 'tool_use', 'stop_sequence' => null], 'usage' => ['output_tokens' => 30]]);
  ev('message_stop', []);
  exit;
}
textovo(['Pánsky strih ', 'stojí 18 € ', 'a trvá 40 min.', "\n- Objednaj sa na https://www.barbershop30.sk/rezervacia", "\n- alebo volaj 0951 267 203."], str_contains($text, 'ODMIETNI') ? 'refusal' : 'end_turn');
