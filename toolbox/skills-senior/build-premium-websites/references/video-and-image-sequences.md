# 048 — Video a obrazové sekvencie

Use when a fixed cinematic shot can replace expensive runtime 3D or when a sequence explains a process. Choose the medium by control and resource needs.

## Decide

Compare video, stills, a bounded image sequence and interactive rendering. Video often suits timed playback; image sequences can support precise frame selection but consume decoded memory. Define the needed frame accuracy and fallback before choosing.

## Execute

Produce a coherent shot with safe text areas, mobile crop and a useful poster. Select dimensions, format and quality for the actual display. For image sequences bound the decode window and release unused frames; do not preload hundreds of full-resolution images by default. Keep total transfer and retained decoded payload separate.

Map progress to frames deterministically with clamped endpoints. When a requested frame is unavailable, use an explicit nearest-ready or poster strategy rather than a blank canvas. Cancel stale work, handle late decodes and preserve asset ownership. For video seeking, test keyframe/decode behavior rather than assuming every progress change paints immediately.

## Verify

Test cold load, rapid reverse, jump to the end, narrow crop, decode failure and memory pressure. Check the seam if looping and inspect the poster when playback never starts. Keep real copy and actions in DOM throughout.

## Deliver

Provide source/export settings, frame count, loading window, nominal memory inputs, progress mapping and fallback. State actual observed playback/device coverage. A beautiful MP4 export proves the shot's appearance, not the website's scroll performance.
