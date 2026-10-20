# 013 — Metódy odvodené z referencií

## Contents

- Five primary case studies
- Ten composition families
- Prompting methods
- Applying the findings

## Five primary case studies

These are short paraphrases of creator-authored accounts. They are stronger evidence of process than promotional price captions. Details describe the cited project at publication, not every future version.

### Immersive Garden: simplify the visible interface, optimize the hidden workload

The studio describes a restrained interface around tactile 3D bas-relief and detailed project case studies. Its technical account discusses compressed GPU textures, channel packing and an automated export workflow with glTF Transform and custom scripts. Transfer the principle: a quiet surface may require careful asset engineering; evaluate both together. Do not copy the actual artwork or assume its stack is mandatory.

Source: https://www.awwwards.com/case-study-immersive-gardens-new-website.html

### David Whyte Experience: preserve the original medium

The creators explain collaboration with a watercolor painter and interactive effects intended to retain that medium's character. They describe a simulation atlas and pre-baked noise to limit runtime work. Transfer the principle: start from authentic artistic material and optimize the specific effect, rather than replacing the material with a generic shader.

Source: https://www.awwwards.com/case-study-david-whyte-experience-by-immersive-garden.html

### Zajno's seven-year journey: return control to the visitor

The studio reports changing its initial time-controlled sequence because visitors had to wait. It moved animation control to scrolling and iterated model detail and scene activation for different devices. Transfer the principle: choreography must remain interruptible and navigable. A beautiful animation that blocks progress fails the visitor's task.

Source: https://www.awwwards.com/case-study-7-year-journey-by-zajno.html

### Studio Freight's DeSo: divide explanation into purposeful chapters

The account describes restructuring a large amount of content into chapters, each with its own narrative pacing. Transfer the principle: design the order of understanding before the effects. Give each chapter a question, a proof and an exit; do not use scrolling merely to stretch a short message into a long page.

Source: https://www.awwwards.com/case-study-deso-by-studio-freight.html

### Unseen's Superlist: make the visual metaphor communicate

The studio describes a pre-launch site using custom 3D visual metaphors to introduce product concepts without showing unreleased features. Transfer the principle: a scene should explain an idea. Treat fictional interface details as illustration, not proof of features that exist.

Source: https://unseen.co/projects/superlist/

## Ten composition families

The following are original design interpretations of the reviewed static submission previews. They do not assert the current live interaction of those sites.

| Family | Example IDs | Transfer | Failure to avoid |
|---|---|---|---|
| One iconic object | W001, W020, W100 | Direct attention through scale, lighting and negative space | Attractive object with no offer or action |
| Product in real human scale | W005, W017, W040 | Explain size or usage through a concrete scene | Misleading stock or invented capability |
| Typographic poster | W010, W061, W084 | Let type carry identity and hierarchy | Unreadable cropped words on mobile |
| Editorial image system | W057, W063, W097 | Use image rhythm and clear authorship | Random grid with no meaningful ordering |
| Illustrated brand world | W004, W008, W039 | Coordinate copy, color and illustration | Decorative clutter or copied characters |
| Miniature spatial world | W002, W018, W037 | Make discovery memorable | Requiring game controls to reach contact |
| Quiet material atmosphere | W003, W033, W049 | Communicate through texture, light and restraint | Low contrast and excessive GPU effects |
| Curated exhibition | W041, W079, W081 | Organize subjects into meaningful rooms or exhibits | Hidden navigation and no linear fallback |
| Layered visual archive | W019, W042, W073 | Show relationships, sequence and depth | Inaccessible information in a canvas alone |
| Image in image / framed canvas | W006, W038, W076 | Separate stable UI from the expressive region | Doubled assets and confusing nested scroll |

## Prompting methods

Vercel's official prompting guide emphasizes the concrete product surface, use context and constraints. Bolt's guide describes focused incremental work and precise design vocabulary. Lovable publishes bounded prompts for recurring features and style directions. Adopt the common principle: specify the actual task, inputs, behavior and acceptance checks; inspect the output before the next phase.

Sources:

- https://vercel.com/blog/how-to-prompt-v0
- https://bolt.new/blog/prompt-engineering-tips-for-bolt
- https://docs.lovable.dev/prompting/prompting-library

The 100 reproduced public prompts provide examples of detailed art direction and implementation instructions. They also contain weaknesses: invented business statistics, external assets, assumed dependencies and automatic deployment instructions. Their inclusion is not endorsement of every line. Adapt them through `prompt-adaptation.md`.

## Applying the findings

Turn an observation into a decision with four fields: intended visitor benefit, actual implementation mechanism, cost or failure mode and verification. Prefer a small number of well-implemented decisions to a large list of named effects. Revisit the research when the actual design fails its intended task; do not endlessly accumulate tools instead of correcting the result.

## Senior decision gate

- **Decision:** Transfer a principle that serves the actual visitor rather than copying a whole identity.
- **Deliverable:** An original application tied to the content.
- **Verification:** Inspect whether the selected method fits available media and interaction constraints.
