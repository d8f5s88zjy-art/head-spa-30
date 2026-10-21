<?php
/* Vytvorí asistent/config.php pri nasadení na FTP (GitHub Actions). Kľúč API príde z tajomstva repozitára
 * ANTHROPIC_API_KEY; bez neho asistent ostane vypnutý (api.php?a=stav hlási zapnute: false). */
$kluc = trim((string) getenv('KLUC'));
if ($kluc !== '' && !str_starts_with($kluc, 'sk-ant-')) { fwrite(STDERR, "ANTHROPIC_API_KEY nevyzerá ako kľúč API, asistent ostane vypnutý.\n"); $kluc = ''; }
$k = ['kluc' => $kluc, 'model' => 'claude-opus-5-5', 'usilie' => trim((string) getenv('USILIE')) ?: 'low', 'sol' => bin2hex(random_bytes(16))];
// voľné termíny z rezervačného systému: len keď prevádzka napojenie povolí (premenná repozitára ASISTENT_KALENDAR_URL)
$kal = trim((string) getenv('KALENDAR_URL'));
if (preg_match('#^https://[^\s]+$#', $kal)) $k['kalendar'] = ['url' => $kal];
echo "<?php\n/* Vytvorené automaticky pri nasadení (tools/asistent-config.php). Neupravovať ručne. */\nreturn ", var_export($k, true), ";\n";
