<?php
/* Falošný rezervačný systém pre testy (rovnaké rozhranie ako formulár na www.barbershop30.sk/rezervacia):
 * GET / = stránka s CSRF tokenom a cookie, POST /ajax = getEmployees, getCalendar, getTime. Bez tokenu a cookie
 * vráti 419 ako Laravel. Scenáre dní sú v súbore $MOCK_SCEN: {"YYYY-MM-DD": "ok"|"prazdne"|"chyba500"|"pomaly"}.
 * Každú požiadavku zapíše do $MOCK_LOG (test overí, že objednávka makeOrder nikdy neprišla).
 * Tvar požiadaviek ako skutočný systém (overené 2026‑10‑25): barber je objekt zo zoznamu (číslo 0 = chyba, iné
 * číslo sa ticho ignoruje a vráti časy u kohokoľvek, objekt bez opening_hours = 500), dátum je objekt kalendára
 * so selectedDate (reťazec = 500). Konkrétny barber má iné voľné časy ako „Nezáleží“, aby test chybný tvar odhalil. */
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
// barber ako vo formulári: null = chýba, 0 = „Nezáleží“; nesprávny tvar ako skutočný systém
$barber = function () use ($req) {
  $e = $req['employee'] ?? null;
  if (is_int($e)) return $e === 0 ? null : 0;                              // číslo: 0 odmietne, iné ignoruje
  if (!is_array($e) || !array_key_exists('id', $e)) return null;
  if ((int) $e['id'] !== 0 && !array_key_exists('opening_hours', $e)) { http_response_code(500); echo '<!DOCTYPE html><html>Server Error</html>'; exit; }
  return (int) $e['id'];
};
switch ($req['ajax_method'] ?? '') {
  case 'getEmployees':
    echo json_encode(['result' => ['services' => $req['services'], 'employees' => [
      ['name' => 'Nezáleží', 'title' => 'Barber', 'id' => 0],
      ['id' => 47, 'name' => 'Nikolas', 'title' => 'Barber', 'email' => 'nikolas@example.invalid', 'phone' => '0900 000 047', 'opening_hours' => null, 'time_multiple' => null],
      ['id' => 42, 'name' => 'Adrian', 'title' => 'Barber', 'email' => 'adrian@example.invalid', 'phone' => '0900 000 042', 'opening_hours' => null, 'time_multiple' => null],
    ]]]);
    break;
  case 'getCalendar':
    if ($barber() === null) { echo json_encode(['result' => false, 'errors' => ['Nie je vybratá služba alebo pracovník']]); break; }
    echo json_encode(['result' => ['calendar' => ['limits' => ['min' => $dnes->format('j.n.Y'), 'max' => $dnes->modify('+30 days')->format('j.n.Y')],
      'disabled_days' => ['Ne'], 'disabled_dates' => ['24.12.2026', '25.12.2026', '1.1.2027']]]]);
    break;
  case 'getTime':
    $kto = $barber();
    if ($kto === null) { echo json_encode(['result' => false, 'errors' => ['Nie je vybratá služba, pracovník alebo dátum']]); break; }
    if (!is_array($req['date'] ?? null) || !isset($req['date']['selectedDate'])) { http_response_code(500); echo '<!DOCTYPE html><html>Server Error</html>'; break; }
    $d = DateTimeImmutable::createFromFormat('d.m.Y', (string) $req['date']['selectedDate'], $tz);
    $k = $d ? $d->format('Y-m-d') : '';
    $s = $scen[$k] ?? 'ok';
    if ($s === 'chyba500') { http_response_code(500); echo '{"message":"Server Error"}'; break; }
    if ($s === 'pomaly') { sleep(5); }
    if ($s === 'prazdne') { echo json_encode(['result' => ['times' => []]]); break; }
    // časy v skupinách ako vo formulári; „poznamka“ s menom zákazníka sa nesmie dostať von
    // u kohokoľvek je voľno aj o 12:00 (konkrétny barber vtedy strihá)
    $po = $kto === 0 ? ['12:00', '14:00', '17:40'] : ['14:00', '17:40'];
    echo json_encode(['result' => ['times' => ['Doobeda' => ['09:00', '10:20'], 'Poobede' => $po, 'poznamka' => 'Jana Nováková 11:00 obsadené']]]);
    break;
  case 'makeOrder':
    echo json_encode(['result' => true]);
    break;
  default:
    http_response_code(400);
}
