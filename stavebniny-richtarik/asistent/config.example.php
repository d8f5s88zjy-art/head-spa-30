<?php
/* Vzor konfigurácie. Skutočný config.php vytvorí nasadenie (nasadenie/asistent-config.php) z kľúča, ktorý majiteľ
 * zadá pri nasadení; do repozitára ani do správ NIKDY nepatrí (.gitignore). Bez kľúča je asistent vypnutý. */
return [
  'kluc' => 'sk-ant-...',          // kľúč API z platform.claude.com (účet majiteľa, platí sa za použitie)
  'model' => 'claude-opus-5-5',
  'usilie' => 'low',               // low = rýchle krátke odpovede
  'za_10_min' => 12,               // otázok od jedného návštevníka za 10 minút
  'za_den' => 40,                  // otázok od jedného návštevníka za deň
  'spolu_za_den' => 400,           // otázok za deň na celom webe (strop nákladov)
  'sol' => '…náhodných 32 znakov…', // soľ pre odtlačok IP (vyrobí nasadenie)
  // 'povody' => ['https://nahlad.example'],   // ďalšie adresy webu, z ktorých sa smie pýtať
];
