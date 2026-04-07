# YTPlayer System Integration Matrix

## Purpose

This document defines the actual browser and platform integration boundary for `YTPlayer`.

It is meant to answer three concrete questions:

1. Which system capability the player tries to use
2. How that capability is detected in the current implementation
3. What the visible downgrade path is when the capability is absent, rejected, or partial

This is a portability and QA contract, not a marketing support claim.

## Scope

Current matrix coverage:

- Fullscreen
- Picture-in-Picture
- Media Session
- Wake Lock
- AirPlay
- HLS playback
- Orientation lock coupled to fullscreen

Out of scope:

- DRM / EME
- Chromecast / Cast
- generic Remote Playback API coverage
- native wrapper integrations
- telemetry / analytics

## Integration Principles

### 1. Capability detection first

All platform integrations must remain optional. Playback cannot depend on a browser exposing a specific media capability.

### 2. Playback path must survive feature loss

If a system capability is absent, rejected, or flaky, these flows must still work:

- source loading
- play / pause
- seek
- subtitles
- episodes navigation

### 3. Support claims must match current code

Accurate wording is:

- “attempts to integrate when available”
- “degrades gracefully when unavailable”

Inaccurate wording is:

- “fully supported everywhere”
- “works identically on all browsers”

### 4. Host apps should not need browser API polyfills

The host should only need to provide normal media URLs and browser context.

The player currently depends on `hls.js` only for managed `.m3u8` playback on non-native HLS browsers.

## Integration Matrix

| Capability | Detection in current code | Expected primary environments | Behavior when supported | Downgrade when unsupported |
| --- | --- | --- | --- | --- |
| Fullscreen | `requestFullscreen`, `document.fullscreenElement`, WebKit fullscreen checks | Desktop Chromium, desktop Safari, iPad Safari, some mobile WebKit variants | Enters immersive fullscreen and syncs internal fullscreen state | Remains inline; on iOS-like environments attempts `webkitEnterFullscreen()` on the video element |
| Picture-in-Picture | `"pictureInPictureEnabled" in document`, `video.requestPictureInPicture?.()` | Desktop Chromium / Safari variants with PiP | PiP button opens or exits picture-in-picture | PiP button is hidden or inert; playback remains inline |
| Media Session | `"mediaSession" in navigator` | Modern mobile and desktop browsers with system media UI | Sets metadata, playback state, seek/play/pause handlers, and next-track when available | No system media integration; in-player controls remain authoritative |
| Wake Lock | `"wakeLock" in navigator`, `navigator.wakeLock.request("screen")` | Browsers exposing Screen Wake Lock API | Requests screen wake lock while playing and retries on visibility restore | No wake lock; playback continues and device sleep behavior falls back to browser / OS policy |
| AirPlay | `webkitShowPlaybackTargetPicker` on the video element | Safari / WebKit environments with AirPlay support | Shows AirPlay button and opens native playback target picker | AirPlay button is omitted entirely |
| Native HLS | `video.canPlayType("application/vnd.apple.mpegurl")` | Safari / Apple platforms with native HLS | `.m3u8` plays through native media stack | Falls through to managed HLS path |
| Managed HLS | dynamic `import("hls.js")` + `Hls.isSupported()` | Chromium / Firefox-like browsers without native HLS | `.m3u8` plays through `hls.js` lifecycle | Falls back to direct source load attempt; fatal failures surface a generic load error |
| Orientation lock | `screen.orientation.lock` / `unlock` during fullscreen transitions | Browsers exposing orientation API | Attempts landscape lock while fullscreen is active | Fullscreen still works where available; orientation remains unmanaged |

## Detailed Contract

## 1. Fullscreen

### Detection

The current code attempts:

- standard `Element.requestFullscreen()`
- standard `document.exitFullscreen()`
- WebKit fullscreen state checks
- iOS-style fallback through `video.webkitEnterFullscreen()`

### Current behavior

- desktop fullscreen prefers the standard document fullscreen path
- iOS Safari-like environments may reject standard fullscreen and then fall back to native video fullscreen
- internal `isFullscreen` state listens to both document fullscreen events and WebKit video fullscreen events

### Downgrade contract

If fullscreen APIs are absent or rejected:

- playback remains inline
- controls remain available
- no blocking error is shown

## 2. Picture-in-Picture

### Detection

The UI path is exposed only when:

- `pictureInPictureEnabled` exists on `document`
- `requestPictureInPicture()` exists on the video element

### Current behavior

- the button requests PiP when inactive
- it exits PiP when a PiP session is already active

### Downgrade contract

If PiP is unavailable:

- the player does not depend on PiP for any core flow
- no PiP failure UI is surfaced

## 3. Media Session

### Detection

The player checks `"mediaSession" in navigator`.

### Current integration

When supported, the player sets:

- metadata: `title`, `artist`, `artwork`
- playback state
- action handlers for:
  - `play`
  - `pause`
  - `seekforward`
  - `seekbackward`
  - `seekto`
  - `nexttrack` when `onNext` exists
- position state when duration is known

### Downgrade contract

If Media Session or any individual action handler is unsupported:

- the player ignores the unsupported path silently
- in-player controls remain the source of truth

## 4. Wake Lock

### Detection

The player checks `"wakeLock" in navigator`.

### Current behavior

- requests a screen wake lock while playback is active
- releases it when playback stops
- retries after visibility resumes if playback is still active

### Downgrade contract

If unavailable or denied:

- playback is unaffected
- the only loss is that the device may sleep normally

This should be treated as best-effort behavior, not guaranteed keep-screen-on support.

## 5. AirPlay

### Detection

The current code:

- sets `x-webkit-airplay="allow"` on the video element
- treats `webkitShowPlaybackTargetPicker` as the availability signal

### Current behavior

When supported:

- the AirPlay button is shown
- clicking it opens the native playback target picker

### Downgrade contract

When unsupported:

- the AirPlay button is not rendered
- local playback remains unchanged

This is Safari / WebKit specific and should not be described as generic cast support.

## 6. HLS

### Path selection

For `.m3u8` sources, the player currently chooses between:

1. native HLS
2. managed HLS through `hls.js`
3. direct source load fallback

### Detection

- if the source contains `.m3u8`
- and `canPlayType("application/vnd.apple.mpegurl")` reports native support
  - use native HLS
- otherwise dynamically import `hls.js`
- if `Hls.isSupported()` is false
  - attempt direct source load

### Current behavior

- Safari-like environments should typically use native HLS
- Chromium-like environments should typically use managed HLS
- fatal managed HLS errors surface the generic retryable load failure path

### Downgrade contract

If native HLS and managed HLS are both unavailable or fail:

- playback does not proceed
- the player surfaces a generic load failure state
- retry remains available

## 7. Orientation Lock

### Detection

During fullscreen transitions, the player checks for:

- `screen.orientation.lock`
- `screen.orientation.unlock`

### Current behavior

- when fullscreen starts, the player attempts `lock("landscape")`
- when fullscreen ends, the player attempts `unlock()`

### Downgrade contract

If orientation APIs are absent or rejected:

- fullscreen still works if the browser supports fullscreen
- layout remains controlled by the normal responsive UI

Orientation lock is an enhancement layered on top of fullscreen, not a separate guarantee.

## Recommended QA Matrix

At minimum, QA should validate these environment classes:

### Desktop Chromium

- direct MP4 playback
- managed HLS playback
- PiP
- Media Session
- Wake Lock
- fullscreen

### Desktop Safari

- direct MP4 playback
- native HLS playback
- AirPlay button behavior
- fullscreen
- PiP behavior

### iPhone Safari

- inline playback
- native fullscreen fallback
- native HLS playback
- autoplay muted fallback

### iPad Safari

- inline playback
- fullscreen transitions
- top-right panel positioning
- native HLS playback

### Android Chrome

- direct MP4 playback
- managed HLS playback
- fullscreen
- Media Session
- wake lock best-effort behavior

## Host App Guidance

Safe assumptions for host applications:

- direct MP4 playback is the baseline
- HLS is best-effort through native support or `hls.js`
- Fullscreen, PiP, AirPlay, Media Session, and Wake Lock are opportunistic enhancements
- unsupported capabilities should never be surfaced as blocking integration errors

Recommended wording for external documentation:

- “integrates with platform playback features where available”
- “degrades gracefully when a browser does not expose a media capability”

Avoid wording like:

- “supports all browsers equally”
- “works with fullscreen / PiP / AirPlay everywhere”

## Future Follow-ups

This matrix should be revisited if any of the following lands:

- Chromecast / Remote Playback integration
- DRM / EME
- mobile PiP policy changes
- mode-aware fullscreen / orientation policy
- more granular HLS retryable vs fatal error differentiation
