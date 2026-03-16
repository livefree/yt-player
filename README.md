# YTPlayer Component

A React video player component built by reverse-engineering YT's DOM architecture.

## Architecture

### Layer System (mirrors `data-layer="N"`)

YT uses a `data-layer` attribute instead of raw CSS z-index numbers. This prevents z-index conflicts in multi-developer environments and makes the stacking order self-documenting.

| Layer | z-index | Contents                                                   |
| ----- | ------- | ---------------------------------------------------------- |
| 0     | 0       | `<video>` element (html5-video-container)                  |
| 1     | 10      | Gradient top + chrome top (title bar)                      |
| 2     | 20      | Unmute popup (reserved)                                    |
| 3     | 30      | Gesture layer (click / touch)                              |
| 4     | 40      | Overlays: spinner, seek animation, bezel, error, subtitles |
| 5     | 50      | Popup panels: settings, quality, subtitles, speed          |
| 9     | 90      | Gradient bottom + chrome bottom (progress + controls)      |

### Control Groups (mirrors ytp-left-controls / ytp-right-controls)

```
[Left]                          [Right-Left]  [Right-Right]
Play | Next | Volume | Time | Chapter    Subtitles | Settings    Theater | PiP | Fullscreen
```

YT's exact split:

- `ytp-left-controls`: play, next, mute+volume slider, time display, chapter title
- `ytp-right-controls-left`: autoplay toggle, subtitles, settings
- `ytp-right-controls-right`: theater, PiP, fullscreen

### Progress Bar (3-layer system)

```
[ytp-load-progress]   buffered indicator (rgba white ~40%)
[ytp-play-progress]   played indicator (YT red #f00)
[ytp-hover-progress]  hover ghost (rgba white ~50%)
[ytp-scrubber-button] circular thumb (scales in on hover)
```

### Tooltip System (global singleton)

YT uses a **single** `.ytp-tooltip` div driven by `data-tooltip-title` attributes, not per-button pseudo-elements. This component implements tooltips via CSS `::after` on `.ytpButton` using `content: attr(data-tooltip)`, which achieves the same single-source-of-truth pattern without JS.

### Seek Animation (ytp-seek-overlay)

Two independent animation divs (back / forward) sit in layer 4. Each has its own chevron arrows and duration label. They activate independently on left/right seek, not toggling a single element.

### Bezel (center flash)

A circular overlay that scales in and fades out on every play/pause toggle. Uses CSS animation, not JS opacity manipulation.

### Auto-hide System

The `.ytpAutohide` class is added to the root when controls should hide. All chrome elements respond via CSS selectors — no JS visibility toggling. Timer logic lives in `revealChrome()`.

## Props

| Prop                 | Type                       | Default | Description                       |
| -------------------- | -------------------------- | ------- | --------------------------------- |
| `src`                | `string`                   | —       | Video URL (.mp4 or .m3u8)         |
| `qualities`          | `QualityLevel[]`           | `[]`    | Quality options for Settings menu |
| `activeQualityId`    | `string`                   | —       | Currently active quality          |
| `onQualityChange`    | `(id: string) => void`     | —       | Called when user picks quality    |
| `subtitles`          | `SubtitleTrack[]`          | `[]`    | WebVTT subtitle tracks            |
| `poster`             | `string`                   | —       | Poster image URL                  |
| `title`              | `string`                   | —       | Video title (chrome top)          |
| `author`             | `string`                   | —       | Channel name (chrome top)         |
| `chapters`           | `Chapter[]`                | `[]`    | Chapter markers on progress bar   |
| `onEnded`            | `() => void`               | —       | Playback ended callback           |
| `onTimeUpdate`       | `(time, duration) => void` | —       | Time update callback              |
| `startTime`          | `number`                   | `0`     | Resume from this timestamp        |
| `autoplay`           | `boolean`                  | `false` | Autoplay on mount                 |
| `initialVolume`      | `number`                   | `1`     | Initial volume 0–1                |
| `defaultTheaterMode` | `boolean`                  | `false` | Start in theater mode             |

## Keyboard Shortcuts

| Key           | Action              |
| ------------- | ------------------- |
| `Space` / `K` | Play / Pause        |
| `←` / `→`     | Seek ±10s           |
| `↑` / `↓`     | Volume ±5%          |
| `M`           | Toggle mute         |
| `F`           | Toggle fullscreen   |
| `T`           | Toggle theater mode |
| `C`           | Cycle subtitles     |
| `[` / `]`     | Speed ±0.05x        |

## Mobile Gestures

| Gesture                    | Action              |
| -------------------------- | ------------------- |
| Single tap                 | Play / Pause        |
| Double tap left            | Seek −10s           |
| Double tap right           | Seek +10s           |
| Swipe left/right           | Seek (proportional) |
| Swipe up/down (right half) | Volume              |

## CSS Custom Properties

You can theme the player by overriding these CSS variables on `.moviePlayer`:

```css
.myPlayer {
  --ytp-red: #f00; /* Progress bar and scrubber color */
  --ytp-bg: #000; /* Player background */
}
```

## Files

```
src/
  YTPlayer.tsx        — Main component (all logic + JSX)
  YTPlayer.module.css — Full CSS module (ytp-* class system)
  example.tsx              — Usage examples
README.md                  — This file
```

## Engineering Decisions Derived from YT's DOM

1. **`data-layer` z-index** — declarative, conflict-free stacking
2. **Global tooltip via `::after`** — single source, no React state for tooltips
3. **CSS autohide** — `.ytpAutohide` drives all visibility via selectors, not JS
4. **Separate seek overlay divs** — back/forward animate independently
5. **Volume panel width transition** — `width: 0 → 60px` CSS transition, no mount/unmount
6. **Settings as sub-panel navigation** — one `<div>` swaps content via state, not multiple portals
7. **Container queries** — `@container` replaces media queries for responsive controls
8. **`context-stroke` not used** — pure CSS approach without SVG filters
