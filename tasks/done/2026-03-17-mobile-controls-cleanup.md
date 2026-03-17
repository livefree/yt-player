# Task: Mobile Controls Cleanup

**Status**: in-progress
**Branch**: feat/mobile-controls-cleanup
**Created**: 2026-03-17

---

## Description

Mobile portrait screen is too crowded. Two targeted fixes:

1. **Hide volume area on touch devices** — on mobile the system handles volume via
   hardware buttons; the in-player slider is redundant and wastes horizontal space.
   Replace the fragile JS probe with a clean CSS `@media (pointer: coarse)` rule.

2. **Hide theater-mode button on touch devices** — theater mode toggles a layout
   aimed at wide-screen desktops; it has no meaning on a phone/tablet.

---

## Files Modified

- `task.md` — this file
- `src/player/Player.tsx`
  - Remove `volumeApiAvailable` state + iOS probe effect (CSS handles hiding now)
  - Add `className={s.ytpTheaterButton}` to the theater-mode YtpButton
- `src/player/Player.module.css`
  - `@media (pointer: coarse)` → `.ytpVolumeArea { display: none }`
  - `@media (pointer: coarse)` → `.ytpTheaterButton { display: none }`

---

## Acceptance Criteria

- [x] Touch devices: volume area not visible (controls bar visibly less crowded)
- [x] Touch devices: theater mode button not visible
- [x] Desktop (pointer: fine): volume area and theater button still visible
- [x] `npm run typecheck` → exit 0
- [x] `npm run lint` → exit 0
- [x] `npm test` → exit 0
- [x] `npm run build` → exit 0
