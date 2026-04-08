# Player Settings IA Plan

## Goal

Redefine the `settings` panel after playback speed moves out to a first-level control.

This plan keeps `settings` as a low-frequency configuration surface, not a dumping
ground for every leftover action. The panel should hold controls that are:

- useful but not needed every few seconds
- stable across desktop, tablet, and phone
- compatible with the player's portability goal
- defensible as player-level behavior rather than host-app business logic

## Design Principles

### 1. Keep first-level controls for high-frequency actions

The following controls should stay outside `settings`:

- playback speed
- play / pause
- next
- episodes
- fullscreen
- subtitles on/off when the layout has enough room

### 2. Keep `settings` focused on configuration, not navigation

`settings` should not become a second episodes launcher, nor a backup chrome.

### 3. Prefer portable features over host-specific features

Anything that depends on app routing, account state, recommendation logic, or
server policy should stay outside the core player module.

### 4. Separate “playback behavior” from “caption appearance”

These are different mental models and should not be mixed into one flat list.

## Recommended IA

### Level 1

The root `settings` panel should expose four top-level groups:

1. `Playback`
2. `Captions`
3. `Quality`
4. `Audio / Language` (only when the host later provides alternate audio tracks)

If the player has no quality list, no subtitle tracks, and no alternate audio,
those entries should disappear rather than render disabled placeholders.

## Group Details

### Playback

This is the main replacement for the current empty settings shell.

Recommended items:

- `Loop current video`
- `Autoplay next episode`
- `Sleep timer`

#### Loop current video

- Player-level feature
- portable
- should be a simple toggle

#### Autoplay next episode

- only show when `episodes` or `onNext` is available
- this is still player-level behavior, because it controls what happens at the
  end of playback, not what content exists
- should be a toggle

#### Sleep timer

- useful on mobile / tablet and TV-style viewing
- should open a small sub-panel with preset durations:
  - `Off`
  - `10 min`
  - `20 min`
  - `30 min`
  - `45 min`
  - `60 min`
  - `End of video`

Implementation note:

- this should be planned now, but can be implemented later because it introduces
  timer lifecycle, pause/resume semantics, and interaction with next-episode flow

### Captions

The root item should remain `Subtitles/CC`, but once opened, the panel should
separate track selection from style settings.

Recommended structure:

1. `Subtitle track`
2. `Text size`
3. `Text color`
4. `Background color`
5. `Background opacity`

This keeps the first implementation scoped to style primitives that map cleanly
to CSS and WebVTT rendering.

Avoid adding a fully YouTube-sized caption studio immediately. The player does
not yet need line spacing, font family, edge style, window color, and every
advanced caption option in the same round.

### Quality

Keep this as a direct quality selection panel when `qualities` is available.

No change in role; only keep it under `settings` because it is comparatively
low-frequency and source-dependent.

### Audio / Language

Not for immediate implementation.

Reserve this group for a future stage where the player supports alternate audio
tracks or dubbed language tracks. Do not add a placeholder now.

## Platform Guidance

### Desktop Pointer

- `settings` can keep a richer root list
- quality and captions can remain visible root entries
- playback group is still appropriate here

### Tablet Touch

- keep the same IA as desktop
- prefer slightly shorter labels
- avoid deep nesting beyond one sub-panel layer where possible

### Phone Touch

- keep the same information architecture
- but reduce visible root items when the feature is unavailable
- speed remains outside the panel
- captions styling can stay one layer deeper to avoid overloading the root

## What Should Not Go Into Settings

The following should stay out unless a later product requirement clearly demands
them:

- episodes / playlist navigation
- theater mode
- PiP
- AirPlay
- fullscreen
- debug toggles
- host-site recommendation behavior
- account or personalization settings

These either belong to first-level controls, capability-specific entry points, or
the host application.

## Suggested Implementation Order

### Phase A

- keep current `Quality`
- keep current `Subtitles/CC`
- add new `Playback` root group
- add `Loop current video`
- add `Autoplay next episode`

### Phase B

- add `Sleep timer`
- split captions into track selection plus style settings
- add caption style primitives

### Phase C

- add future `Audio / Language` only if alternate audio tracks exist

## Non-Goals For This Round

- no implementation of sleep timer yet
- no full YouTube-equivalent caption studio yet
- no host-specific business settings
- no persistence API design in this document

Persistence can be added later through a small player preference contract once
the settings surface itself is stable.
