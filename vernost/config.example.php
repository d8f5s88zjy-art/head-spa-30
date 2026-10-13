<?php
/* Vzor konfigurácie. Skutočný config.php vytvorí nasadenie (GitHub Actions, .github/workflows/ftp.yml) z tajomstiev
 * repozitára a do repozitára NIKDY nepatrí. Heslá sú len ako odtlačky password_hash(), nie čitateľne. */
return [
  'hesla' => [
    'barbershop' => '$2y$10$...odtlačok hesla...',   // php -r 'echo password_hash("heslo", PASSWORD_DEFAULT), "\n";'
    'headspa' => '$2y$10$...odtlačok hesla...',
  ],
  'email_od' => 'vernost@headspa30.sk',     // odosielateľ e‑mailov s odkazom na kartičku; prázdne = e‑maily vypnuté
  'zaklad' => 'https://www.headspa30.sk/vernost/',
  'kontakt_push' => 'mailto:info@salon30.sk', // kontakt pre služby upozornení (VAPID)
];
