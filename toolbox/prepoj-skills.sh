#!/usr/bin/env bash
# Prepojí skills z toolboxu do .claude/skills/, aby ich Claude Code v tomto repozitári ponúkal sám
# (symbolické odkazy na priečinky, Claude Code ich načíta ako bežné skills; zdroj ostáva v toolboxe).
# Nový skill: pridaj riadok do ZOZNAM a spusti z koreňa repozitára: bash toolbox/prepoj-skills.sh
# Vynechané zámerne: brand-guidelines (farby Anthropicu), algorithmic-art a mcp-builder (s webmi nesúvisia),
# skill-creator, theme-factory a web-artifacts-builder (Claude ich má zabudované), gsap-react a gsap-frameworks
# (weby nepoužívajú React ani iný framework), čiastkové skills genjutsu pre Android, iOS a React.
set -euo pipefail
KOREN=$(cd "$(dirname "$0")/.." && pwd)
CIEL="$KOREN/.claude/skills"
ZOZNAM=(
  # naše postupy z praxe
  toolbox/skills-z-praxe/booqme-rezervacie
  toolbox/skills-z-praxe/film-z-fotiek
  toolbox/skills-z-praxe/instagram-salon
  toolbox/skills-z-praxe/kratke-video
  toolbox/skills-z-praxe/motion-grafika
  toolbox/skills-z-praxe/obsah-a-texty
  toolbox/skills-z-praxe/referencie-z-videi
  toolbox/skills-z-praxe/rychly-web
  toolbox/skills-z-praxe/testy-a-nasadenie
  toolbox/skills-z-praxe/video-a-sekvencie
  toolbox/skills-z-praxe/web-dizajn
  toolbox/skills-z-praxe/workflowy
  toolbox/head-spa-30
  # Anthropic (Apache 2.0)
  toolbox/skills/frontend-design
  toolbox/skills/webapp-testing
  toolbox/skills/canvas-design
  # pohyb, 3D a vizuálna identita (MIT)
  toolbox/skills-animacie/design-dna
  toolbox/skills-animacie/motion-design/skills/motion-design
  toolbox/skills-animacie/gsap/skills/gsap-core
  toolbox/skills-animacie/gsap/skills/gsap-scrolltrigger
  toolbox/skills-animacie/gsap/skills/gsap-timeline
  toolbox/skills-animacie/gsap/skills/gsap-performance
  toolbox/skills-animacie/gsap/skills/gsap-plugins
  toolbox/skills-animacie/gsap/skills/gsap-utils
  toolbox/skills-animacie/genjutsu/skills/cast
  toolbox/skills-animacie/genjutsu/skills/paint
  toolbox/skills-animacie/genjutsu/skills/_jutsu/css-native
  toolbox/skills-animacie/genjutsu/skills/_jutsu/motion-principles
  toolbox/skills-animacie/genjutsu/skills/_jutsu/mobile-principles
  toolbox/skills-animacie/genjutsu/skills/_jutsu/design-audit
  toolbox/skills-animacie/genjutsu/skills/_jutsu/ui-ux-pro-max
)
mkdir -p "$CIEL"
# staré odkazy preč (len odkazy, nič iné sa nemaže)
find "$CIEL" -maxdepth 1 -type l -delete
for zdroj in "${ZOZNAM[@]}"; do
  [ -f "$KOREN/$zdroj/SKILL.md" ] || { echo "chýba $zdroj/SKILL.md" >&2; exit 1; }
  # meno odkazu = pole name zo SKILL.md (Claude Code ho tak zobrazuje)
  meno=$(awk '/^---$/{c++; next} c==1 && /^name:/{sub(/^name:[ ]*/,""); gsub(/["\047]/,""); print; exit}' "$KOREN/$zdroj/SKILL.md")
  [ -n "$meno" ] || { echo "bez mena: $zdroj" >&2; exit 1; }
  [ -e "$CIEL/$meno" ] && { echo "dvakrát to isté meno: $meno" >&2; exit 1; }
  ln -s "../../$zdroj" "$CIEL/$meno"
done
echo "prepojených skills: $(find "$CIEL" -maxdepth 1 -type l | wc -l) v .claude/skills/"
