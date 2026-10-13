<?php
/* Vytvorí vernost/config.php pri nasadení na FTP (GitHub Actions). Heslá admina prídu z tajomstiev repozitára
 * a do súboru sa zapíšu len ako odtlačky password_hash(). Bez hesla sa admin prevádzky neotvorí. */
$domena = trim((string) getenv('DOMENA')) ?: 'headspa30.sk';
if (!str_starts_with($domena, 'www.')) $domena = 'www.' . $domena;
$hesla = [];
foreach (['barbershop' => 'HESLO_B', 'headspa' => 'HESLO_H'] as $p => $env) {
  $h = (string) getenv($env);
  if (strlen($h) >= 10) $hesla[$p] = password_hash($h, PASSWORD_DEFAULT);
  elseif ($h !== '') fwrite(STDERR, "Heslo pre $p je kratšie ako 10 znakov, admin ostane zamknutý.\n");
}
$email = trim((string) getenv('EMAIL_OD'));
echo "<?php\n/* Vytvorené automaticky pri nasadení (tools/vernost-config.php). Neupravovať ručne. */\nreturn ",
  var_export(['hesla' => $hesla, 'email_od' => filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '', 'zaklad' => "https://$domena/vernost/",
    'kontakt_push' => 'mailto:info@salon30.sk'], true), ";\n";
