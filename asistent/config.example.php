<?php
/* Vzor konfigurácie. Skutočný config.php vytvorí nasadenie (GitHub Actions, .github/workflows/ftp.yml) z tajomstva
 * ANTHROPIC_API_KEY a do repozitára NIKDY nepatrí. Bez kľúča je asistent vypnutý a okno na webe sa neukáže. */
return [
  'kluc' => 'sk-ant-...',          // kľúč API z platform.claude.com
  'model' => 'claude-opus-5-5',    // najschopnejší model Opus
  'usilie' => 'low',               // low = rýchle krátke odpovede; medium alebo high = viac premýšľania, pomalšie a drahšie
  'za_10_min' => 15,               // otázok od jedného návštevníka za 10 minút
  'za_den' => 60,                  // otázok od jedného návštevníka za deň
  'spolu_za_den' => 300,           // otázok za deň na celom webe (strop nákladov; návštevník = adresa IPv4 alebo blok IPv6 /64)
  'max_tokens' => 1500,            // strop jednej odpovede vrátane premýšľania (512 až 4000)
  // voľné termíny z rezervačného systému (lib/kalendar.php); len so súhlasom prevádzky, inak asistent povie, že overiť nevie
  'kalendar' => ['url' => 'https://www.barbershop30.sk/rezervacia'],
];
