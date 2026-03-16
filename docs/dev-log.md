# Development Log

## 2026-03-16 — Cursor + Autohide Consistency Fixes

**Task:** Two follow-up detail adjustments.

### Fix 1: Video area cursor should remain arrow, not pointer

- **File:** `src/player/Player.module.css`
- **Fix:** Changed `.ytpGestureLayer { cursor: pointer }` → `cursor: default`.
- Buttons, progress bar, and interactive controls already have their own `cursor: pointer` declarations, so interactive areas are unaffected. The video/gesture area now shows the default arrow.

### Fix 2: Controls autohide consistent in both play and pause states

- **File:** `src/player/Player.tsx`
- **Fix:** Removed `if (!isPlaying) return;` early-exit from `revealChrome`. Removed `isPlaying` from `useCallback` dependency array.
- Previously: controls only auto-hid during playback; stayed visible indefinitely when paused.
- Now: the 2-second hide timer fires on every mouse movement regardless of play state, making pause and play behavior identical.

---


## 2026-03-16 — UI Bug Fixes: Progress Bar, Scrubber, Time Display

**Task:** Fix 4 UI bugs reported after initial framework setup.

### Bug 1 & 2: Progress bar asymmetric expansion + no transition

- **File:** `src/player/Player.module.css`
- **Fix:** Added `transition: height 0.15s ease, margin-top 0.15s ease` to `.ytpProgressBar`.
- The existing `margin-top: -1px` on hover already provided symmetric expansion (1px up + 1px down); the issue was the lack of animation.

### Bug 3: Scrubber dot fixed at origin

- **Root cause:** JSX used `style={{ transform: 'translateX(X%)' }}`. `translateX(%)` uses the *element's own width* as the percentage reference — the container was essentially 0-wide, so the dot never moved. Additionally, this overrode the CSS `transform: translate(0, -50%)`, breaking vertical centering.
- **Files:** `src/player/Player.module.css`, `src/player/Player.tsx`
- **CSS fix:** Removed `transform` and `transform-origin` from `.ytpScrubberContainer`. Vertical positioning is now handled by `top: 50%` + button's `margin-top: -6px`.
- **JSX fix:** Changed inline style from `transform: translateX(X%)` to `left: X%`. `left` uses the *parent container's width*, which is the full progress bar — correct behavior.

### Bug 4: Time display text-selectable, no toggle

- **Files:** `src/player/Player.module.css`, `src/player/Player.tsx`
- **CSS fix:** Added `user-select: none; cursor: pointer` to `.ytpTimeDisplay`.
- **JSX fix:** Added `showRemaining` state (boolean). Clicking the time display toggles between:
  - `currentTime / duration` (elapsed mode, default)
  - `-remaining / duration` (remaining mode, shows negative prefix)
