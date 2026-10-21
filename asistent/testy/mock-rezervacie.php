<?php
/* Falošný rezervačný systém pre testy (rovnaké rozhranie ako formulár na www.barbershop30.sk/rezervacia):
 * GET / = stránka s CSRF tokenom a cookie, POST /ajax = getEmployees, getCalendar, getTime. Bez tokenu a cookie
 * vráti 419 ako Laravel. Scenáre dní sú v súbore $MOCK_SCEN: {"YYYY-MM-DD": "ok"|"prazdne"|"chyba500"|"pomaly"}.
 * Každú požiadavku zapíše do $MOCK_LOG (test overí, že objednávka makeOrder nikdy neprišla). */
$tz = new DateTimeZone('Europe/Bratislava');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  header('Set-Cookie: laravel_session=sedenie42; path=/; httponly');
  echo '<html><head><meta name="csrf-token" content="token-abc"></head><body>rezervácia</body></html>';
  exit;
}
$req = json_decode(file_get_contents('php://input'), true) ?: [];
file_put_contents((string) getenv('MOCK_LOG'), json_encode(['metoda' => $req['ajax_method'] ?? '?', 'data' => $req]) . "\n", FILE_APPEND);
if (($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '') !== 'token-abc' || !str_contains($_SERVER['HTTP_COOKIE'] ?? '', 'laravel_session=sedenie42')) { http_response_code(419); exit; }
header('Content-Type: application/json');
$scen = json_decode((string) @file_get_contents((string) getenv('MOCK_SCEN')), true) ?: [];
$dnes = new DateTimeImmutable('today', $tz);
switch ($req['ajax_method'] ?? '') {
  case 'getEmployees':
    echo json_encode(['result' => ['services' => $req['services'], 'employees' => [
      ['name' => 'Nezáleží', 'title' => 'Barber', 'id' => 0],
      ['id' => 47, 'name' => 'Nikolas', 'title' => 'Barber', 'email' => null, 'phone' => null],
      ['id' => 42, 'name' => 'Adrian', 'title' => 'Barber', 'email' => null, 'phone' => null],
    ]]]);
    break;
  case 'getCalendar':
    echo json_encode(['result' => ['calendar' => ['limits' => ['min' => $dnes->format('j.n.Y'), 'max' => $dnes->modify('+30 days')->format('j.n.Y')],
      'disabled_days' => ['Ne'], 'disabled_dates' => ['24.12.2026', '25.12.2026', '1.1.2027']]]]);
    break;
  case 'getTime':
    $d = DateTimeImmutable::createFromFormat('d.m.Y', (string) $req['date'], $tz);
    $k = $d ? $d->format('Y-m-d') : '';
    $s = $scen[$k] ?? 'ok';
    if ($s === 'chyba500') { http_response_code(500); echo '{"message":"Server Error"}'; break; }
    if ($s === 'pomaly') { sleep(5); }
    if ($s === 'prazdne') { echo json_encode(['result' => ['times' => []]]); break; }
    // časy v skupinách ako vo formulári; „poznamka“ s menom zákazníka sa nesmie dostať von
    echo json_encode(['result' => ['times' => ['Doobeda' => ['09:00', '10:20'], 'Poobede' => ['14:00', '17:40'], 'poznamka' => 'Jana Nováková 11:00 obsadené']]]);
    break;
  case 'makeOrder':
    echo json_encode(['result' => true]);
    break;
  default:
    http_response_code(400);
}
