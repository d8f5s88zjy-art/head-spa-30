# Toolbox: skills a zdroje na tvorbu webu a obsahu

Priečinok nie je súčasťou webu (na GitHub Pages sa nenasadzuje). Je to sada
nástrojov, ktoré sa dajú použiť s Claude Code alebo s Claude.ai pri ďalšej práci na
HEAD SPA 30 aj na iných projektoch.

## Čo je vnútri

`skills/` – skills od Anthropicu z verejného repozitára anthropics/skills, všetky pod
licenciou Apache 2.0 (licencia je v každom priečinku):

| Skill | Na čo je |
| --- | --- |
| `frontend-design` | dizajn webových rozhraní, ktoré nevyzerajú ako šablóna |
| `web-artifacts-builder` | zložitejšie webové aplikácie (React, Tailwind, shadcn/ui) |
| `theme-factory` | farebné a písmové témy pre stránky, prezentácie a dokumenty |
| `brand-guidelines` | držanie sa vizuálnej identity značky |
| `canvas-design` | vizuály, plagáty a grafika (obsahuje písma, preto je väčší) |
| `algorithmic-art` | generatívna grafika (p5.js) |
| `webapp-testing` | testovanie webu v prehliadači cez Playwright |
| `skill-creator` | tvorba vlastných skills a ich meranie |
| `mcp-builder` | tvorba MCP serverov (prepojenie na iné služby) |

`sablona-skillu/` – šablóna nového skillu, `specifikacia/` – špecifikácia formátu
Agent Skills. `ZDROJE.md` – vybrané bezplatné zdroje (písma, ikony, fotky, šablóny,
nástroje) s licenciami.

Skills na dokumenty (docx, pptx, xlsx, pdf) tu nie sú, lebo Anthropic ich dáva pod
inou licenciou. V Claude Code ich dostaneš celé jedným príkazom:

```
/plugin marketplace add anthropics/skills
```

## Ako to použiť

- **Claude Code:** skill sa načíta sám, keď je v `.claude/skills/` projektu alebo
  v `~/.claude/skills/`. Stačí skopírovať priečinok, napríklad
  `cp -r toolbox/skills/frontend-design .claude/skills/`.
- **Claude.ai:** v nastaveniach (Settings, Capabilities, Skills) nahraj priečinok
  skillu ako zip.
- Vlastný skill pre salón (texty na Instagram, odpovede na recenzie, správy
  zákazníkom v šiestich jazykoch) sa dá spraviť zo `sablona-skillu/`.
