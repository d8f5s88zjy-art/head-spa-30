# 040 — Zvuk a ovládanie médií

Use when a site includes video, narration or optional sound design. Make audio an intentional user choice.

## Decide

Classify media as decorative, explanatory or essential content. Decide which information needs captions, a transcript or another accessible equivalent. A decorative loop should not become the only source of instructions or product facts.

## Execute

Show a useful poster and readable content before playback. Handle the promise returned by media playback and update controls from the actual result; autoplay may be denied. Keep mute/play/pause states truthful. Scope sound playback to a clear interaction and provide persistent control where needed.

Coordinate video time with UI only when a reliable clock and fallback exist. For scroll seeking, consider decode/keyframe constraints and offer a poster or simpler sequence on constrained devices. Pause unnecessary background/offscreen work without breaking user-controlled playback. Preserve captions and controls when changing presentation.

## Verify

Try rejected playback, network failure, tab suspension, sound disabled, keyboard controls and reduced motion. Check that captions are readable and do not cover the main action. An audio J/L cut is a film editing technique; a silent web overlap is an analogy, not proof of sound continuity.

## Deliver

Provide media purpose, source rights, formats, poster, controls, alternatives and observed playback checks. Consult the chosen provider's current implementation guidance for exact behavior. Do not promise universal autoplay or a cinematic audio experience without the user's explicit interaction.
