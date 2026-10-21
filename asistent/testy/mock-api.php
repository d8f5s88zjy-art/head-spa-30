<?php
/* Falošné Messages API pre testy: odpovedá prúdom udalostí ako skutočné API, každých 300 ms jeden kúsok textu.
 * Telo požiadavky a hlavičky uloží do $MOCK_LOG (testy ich kontrolujú). Spúšťa testy/spusti.sh. */
$telo = file_get_contents('php://input');
file_put_contents((string) getenv('MOCK_LOG'), json_encode(['uri' => $_SERVER['REQUEST_URI'], 'beta' => $_SERVER['HTTP_ANTHROPIC_BETA'] ?? '', 'kluc' => $_SERVER['HTTP_X_API_KEY'] ?? '', 'telo' => json_decode($telo, true)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND);
$req = json_decode($telo, true);
$posledna = end($req['messages'])['content'];
if (str_contains($posledna, 'CHYBA500')) { http_response_code(500); header('Content-Type: application/json'); echo '{"type":"error","error":{"type":"api_error","message":"skúšobná chyba"}}'; exit; }
$odmietni = str_contains($posledna, 'ODMIETNI');
header('Content-Type: text/event-stream');
while (ob_get_level()) ob_end_clean();
function ev($typ, $data) { echo "event: $typ\ndata: " . json_encode(['type' => $typ] + $data) . "\n\n"; flush(); }
ev('message_start', ['message' => ['id' => 'msg_test', 'type' => 'message', 'role' => 'assistant', 'model' => $req['model'], 'content' => [], 'stop_reason' => null, 'stop_sequence' => null, 'usage' => ['input_tokens' => 10, 'output_tokens' => 1]]]);
ev('content_block_start', ['index' => 0, 'content_block' => ['type' => 'text', 'text' => '']]);
foreach (['Pánsky strih ', 'stojí 18 € ', 'a trvá 40 min.', "\n- Rezervuj na https://www.barbershop30.sk/rezervacia", "\n- alebo volaj 0951 267 203."] as $kus) { usleep(300000); ev('content_block_delta', ['index' => 0, 'delta' => ['type' => 'text_delta', 'text' => $kus]]); }
ev('content_block_stop', ['index' => 0]);
ev('message_delta', ['delta' => ['stop_reason' => $odmietni ? 'refusal' : 'end_turn', 'stop_sequence' => null], 'usage' => ['output_tokens' => 12]]);
ev('message_stop', []);
