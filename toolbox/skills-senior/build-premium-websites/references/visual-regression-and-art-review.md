# 084 — Vizuálna kontrola a regresie

Use when implementation may drift from an approved composition or a change affects multiple layouts. Combine measurable regression checks with visual judgment.

## Decide

Select representative pages, states and viewports based on the changed risk. Distinguish unintended regression from an intentional redesign. A pixel difference is evidence of change, not automatically a defect; a similar screenshot is not proof of good design.

## Execute

Capture comparable states with stable content, loaded fonts and controlled animation progress. Review dominant hierarchy, crop, typography, spacing, action visibility and section rhythm. Inspect start, overlap and hold frames for motion. Keep references to the exact build and environment.

Prioritize observed defects by visitor impact. Fix clipping, hidden actions and broken hierarchy before decorative details. Compare the repaired state with the original and review affected neighboring states. Do not endlessly polish arbitrary pixels after the real scope is complete.

## Verify

Use the supported browser/design tools for actual capture. Keep blocked visual checks explicit; source reading or Node tests do not replace them. Inspect mobile and real-content variants instead of relying solely on an ideal desktop screenshot. Record what a human/agent actually observed.

## Deliver

Provide representative captures, concise findings, corrections and residual limitations. For designer critique use the detailed review prompt and require concrete locations, reasons and changes. Never invent a before score or claim a visual improvement was measured when no comparable baseline exists.
