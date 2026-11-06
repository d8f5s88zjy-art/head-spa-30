<?php
/* Vytvorí asistent/config.php pri príprave balíka na hosting (spúšťa ho správca webu na svojom počítači, nie v repozitári):
 *   KLUC=… php nasadenie/asistent-config.php > <balík>/web/asistent/config.php
 *   composer install -d <balík>/web/asistent --no-dev --prefer-dist --optimize-autoloader
 * Kľúč príde z premennej prostredia (nikdy z príkazového riadku do histórie, nikdy do repozitára ani do správ);
 * bez neho asistent ostane vypnutý (api.php?a=stav hlási zapnute: false a okno sa neukáže). */
$kluc = trim((string) getenv('KLUC'));
if ($kluc !== '' && !str_starts_with($kluc, 'sk-ant-')) { fwrite(STDERR, "Kľúč nevyzerá ako kľúč API, asistent ostane vypnutý.\n"); $kluc = ''; }
$k = [
  'kluc' => $kluc, 'model' => 'claude-opus-5-5', 'usilie' => 'low',
  'za_10_min' => 12, 'za_den' => 40, 'spolu_za_den' => (int) (getenv('SPOLU_ZA_DEN') ?: 400),
  'sol' => bin2hex(random_bytes(16)),
];
echo "<?php\n/* Vytvorené automaticky (nasadenie/asistent-config.php). Neupravovať ručne, do repozitára nepatrí. */\nreturn ", var_export($k, true), ";\n";
