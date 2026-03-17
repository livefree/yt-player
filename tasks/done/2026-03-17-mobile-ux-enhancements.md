# Task: Mobile UX Enhancements (①②③④)

**Status**: done
**Branch**: feat/mobile-ux-enhancements

## Description

Implement four mobile UX enhancements:

1. **① Progress bar touch scrubbing** — touch drag on progress rail to seek
2. **② Media Session API** — lock screen controls (play/pause/seek/next)
3. **③ Screen Wake Lock** — keep screen on while playing
4. **④ AirPlay support** — AirPlay button for iOS Safari

## Acceptance Criteria

- [x] ① Touch scrub on progress bar: drag updates position, commits seek on touch end
- [x] ① Progress bar visually expands (scrubbing state) during touch drag
- [x] ② `navigator.mediaSession.metadata` set with title/artist/artwork from props
- [x] ② Play/pause/seekforward/seekbackward/seekto action handlers registered
- [x] ② `setPositionState` updated on timeupdate
- [x] ③ `wakeLock.request("screen")` acquired when playing, released when paused/unmounted
- [x] ③ Wake lock re-acquired on `visibilitychange` when playing
- [x] ④ AirPlay button shown only on Safari with `webkitShowPlaybackTargetPicker` support
- [x] ④ `x-webkit-airplay="allow"` attribute on video element
- [x] All: `npm run typecheck` passes (0 errors)
- [x] All: `npm run lint` passes (0 warnings)
- [x] All: `npm test` passes
- [x] All: `npm run build` succeeds

## Constraints

- No new runtime dependencies
- CSS Modules only; no inline styles for static values
- All new CSS variables follow `--ytp-*` prefix
