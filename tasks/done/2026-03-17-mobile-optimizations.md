# Task: Mobile Optimizations

**Status**: in-progress
**Branch**: feat/mobile-optimizations
**Created**: 2026-03-17

---

## Description

Implement all mobile web player optimizations to ensure a first-class experience on iOS Safari and Android Chrome. These cover fullscreen handling, volume API quirks, autoplay policies, safe area insets, touch UX, and orientation lock.

---

## Items

| # | Priority | Description |
|---|----------|-------------|
| ① | P0 | iOS fullscreen: use `video.webkitEnterFullscreen()` fallback when `requestFullscreen` fails |
| ② | P0 | iOS volume API: detect unavailability → conditionally hide VolumeArea |
| ③ | P0 | Autoplay failure: catch `.play()` Promise → retry with `muted=true` → show unmute UI |
| ④ | P1 | Safe area insets: `env(safe-area-inset-bottom)` on fullscreen chrome bottom |
| ⑤ | P1 | Orientation lock: `screen.orientation.lock("landscape")` on fullscreen entry |
| ⑥ | P1 | Touch targets: `@media (pointer: coarse)` → `--ytp-btn-size: 44px` |
| ⑦ | P1 | Controls reveal-only: first tap when hidden should reveal chrome, not toggle play |
| ⑧ | P2 | Double-tap zoom prevention: `touch-action: manipulation` on gesture layer + buttons |

---

## Files Modified

- `task.md` — this file
- `dev/index.html` — `viewport-fit=cover`
- `src/player/Player.tsx` — items ①②③⑤⑦
- `src/player/Player.module.css` — items ④⑥⑧

---

## Acceptance Criteria

- [x] iOS Safari: tapping fullscreen enters native video fullscreen (does not silently fail)
- [x] iOS Safari: volume slider hidden when volume API is not available
- [x] Autoplay with sound blocked: player auto-retries muted, shows unmute button overlay
- [x] Fullscreen on iPhone: controls clear of Home Bar (safe area applied)
- [x] Fullscreen on mobile: landscape orientation lock attempted (fails gracefully if unsupported)
- [x] Touch devices: all button hit targets ≥ 44px
- [x] Mobile: tapping while controls are hidden reveals controls without toggling play
- [x] No double-tap browser zoom on gesture layer or control buttons
- [x] `npm run typecheck` → exit 0
- [x] `npm run lint` → exit 0
- [x] `npm test` → exit 0
- [x] `npm run build` → exit 0
