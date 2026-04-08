# YTPlayer Feature Matrix

## Scope

这份矩阵描述“已确认的下一轮重建目标下，用户可见能力在不同终端上的预期表现”。  
这里的终端维度按当前规划分为：

- `Desktop Pointer`
- `Tablet Touch`
- `Phone Touch`
- `Fullscreen Immersive`

`Conditional` 表示依赖浏览器能力或内容数据。  
`Panel` 表示能力不一定常驻，但可通过 settings / episodes 等面板访问。

## Planning Notes

- 这份文档现在承担的是“重建目标 contract”，不是对当前未提交 worktree 的逐行镜像。
- 当前支线和本矩阵的主要差异集中在：
  - `speed` / `settings` 面板已被拆除，待按新布局重建
  - fullscreen 维度尚未单列建模
  - `AirPlay / PiP` 仍未按“优先固定右上”完成布局收口
  - `episodes` 面板滚动条缺失，后续需要补上，同时不能破坏容器圆角视觉
- 重建阶段应以本矩阵为准回推 `useLayoutDecision`、`Player.tsx`、`SettingsPanel`、`SpeedPanel` 与测试。

## Controls Visibility Matrix

| Feature | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| Play / Pause | Visible | Visible | Large center button | Visible |
| Progress scrubber | Visible | Visible | Visible | Visible |
| Time display | Visible in bottom controls | Above progress rail, left-aligned | Above progress rail, left-aligned, smaller text | Pointer fullscreen: bottom controls; touch fullscreen: above progress rail, left-aligned |
| Volume button | Visible | Hidden | Hidden | Visible |
| Volume slider | Hover-reveal on the right of volume button | Hidden | Hidden | Hover-reveal on the right of volume button |
| In-player mute / unmute | Via volume button | Hidden; device controls volume | Hidden; device controls volume | Via volume button |
| Episodes entry | Visible, adjacent to `Next` when present | Visible | Visible at bottom-left | Visible, remains adjacent to `Next` when present |
| Next button | Visible when provided, adjacent to `Episodes` | Visible on right side when provided | Visible on right side when provided | Visible when provided, adjacent to `Episodes` |
| Subtitles direct button | Visible when available | Visible when available | Panel | Visible when available |
| Speed direct button | Visible | Panel | Panel | Visible |
| Settings button | Visible | Visible | Visible | Visible |
| Theater mode | Visible | Hidden | Hidden | Hidden |
| PiP | Conditional visible, top-right priority | Conditional visible, top-right priority | Conditional visible only when top-right space allows | Conditional visible, top-right priority |
| AirPlay | Conditional visible, top-right priority | Conditional visible, top-right priority | Conditional visible only when top-right space allows | Conditional visible, top-right priority |
| Fullscreen button | Visible | Visible | Visible | Visible as exit action |

## Layout / Navigation Matrix

| Behavior | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| Title in top chrome | Visible when provided | Visible when provided | Visible when provided | Visible when provided |
| Top-right controls | `airplay + pip` first; compact layouts may also host `speed + settings` | `settings + speed + airplay + pip` | `settings + speed + airplay + pip` with priority fallback | `airplay + pip` first |
| Bottom-left primary actions | `play + next + episodes + volume + time + chapter` | `episodes` | `episodes` | `play + next + episodes + time + chapter` |
| Bottom-right primary actions | `speed + subtitles + settings + theater + fullscreen` when space allows | `fullscreen` | `fullscreen` | `speed + subtitles + settings + fullscreen` |
| Center overlay controls | None | Large `play` | Large `play` | None |
| Right-side touch action rail | N/A | `next` when provided | `next` when provided | N/A |
| Episodes / Next adjacency | Must remain adjacent when both exist | N/A | N/A | Must remain adjacent when both exist |
| Fullscreen reorders controls | No special rule | N/A | N/A | No relative reorder for `next + episodes`; only `theater` is removed |
| Episodes panel placement | `bottom-left` or `top-right` depending on final slot | `top-right` | `bottom-left` | Mirrors visible `episodes` trigger side |
| Settings panel placement | `bottom-right` or `top-right` depending on trigger placement | `bottom-right` | `top-right` | `bottom-right` or `top-right` depending on trigger placement |
| Speed panel placement | Follows `speed` trigger placement | Reached through `SettingsPanel` | Reached through `SettingsPanel` | Follows `speed` trigger placement |
| Narrow/short layout collapse | Enabled | N/A | N/A | N/A |

## Input Behavior Matrix

| Interaction | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| Hover reveal chrome | Yes | No | No | Pointer fullscreen: yes; touch fullscreen: no |
| Pointer move reveal chrome | Yes | N/A | N/A | Pointer fullscreen: yes |
| Tap reveal chrome | N/A | Yes | Yes | Touch fullscreen: yes |
| Double-tap seek left/right | Yes via gesture zones | Yes | Yes | Yes |
| Touch scrub on progress bar | N/A | Yes | Yes | Touch fullscreen: yes |
| In-player volume gesture | No | No | No | No |
| Keyboard shortcuts | Yes | Limited by attached keyboard | Limited by attached keyboard | Yes when keyboard exists |

## Chrome Visibility Matrix

| Behavior | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| Policy id | `hover-autohide` | `touch-autohide` | `touch-persistent-paused` | Immersive variant of active pointer/touch policy |
| Pause state | Can autohide | Can autohide | Stays visible | Pointer fullscreen may autohide; touch fullscreen follows touch policy |
| Playback state | Autohide | Autohide | Autohide | Autohide |
| Hide delay | 2000ms | 3200ms | 2000ms when applicable | Immersive delay override |
| Immersive/theater override | Yes | Yes when immersive | Yes when immersive | Always immersive |

## Overlay Behavior Matrix

| Overlay | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| Spinner | Visible during loading / buffering | Visible | Visible | Visible |
| Error banner | Blocking overlay | Blocking overlay | Blocking overlay | Blocking overlay |
| Captions | Visible above chrome or raised | Visible above chrome | Raised when bottom panel occupies space | Visible above chrome or raised |
| Unmute prompt | Top edge or below top chrome | Below top chrome; shift left only when a real top-right panel is open | Below top chrome; shift left only when a real top-right panel is open | Same rule as active pointer/touch mode |
| Seek feedback overlay | Visible when allowed | Visible when allowed | Visible when allowed | Visible when allowed |
| Touch seek indicator | N/A | Visible when active | Visible when active | Touch fullscreen: visible when active |
| Panel suppresses prompt | Yes | Yes | Yes | Yes |
| Fatal error suppresses spinner / captions / prompt | Yes | Yes | Yes | Yes |

## Media / System Behavior Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| MP4 / direct source playback | Yes | Yes | Yes | Yes |
| HLS native playback | Conditional | Conditional | Conditional | Conditional |
| HLS via `hls.js` fallback | Conditional | Conditional | Conditional | Conditional |
| Media Session | Conditional | Conditional | Conditional | Conditional |
| Wake Lock | Conditional | Conditional | Conditional | Conditional |
| AirPlay trigger | Conditional, top-right priority | Conditional, top-right priority | Conditional only when top-right space allows | Conditional, top-right priority |
| Picture in Picture | Conditional, top-right priority | Conditional, top-right priority | Conditional only when top-right space allows | Conditional, top-right priority |

## Accessibility / Keyboard Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Immersive |
| --- | --- | --- | --- | --- |
| Focus-visible feedback | Yes | Yes when focusable | Yes when focusable | Yes |
| Settings panel focus trap | Yes | Yes | Yes | Yes |
| Speed panel focus trap | Yes | Yes | Yes | Yes |
| Episodes panel focus handoff | Yes | Yes | Yes | Yes |
| Escape closes panel | Yes | Yes with keyboard | Yes with keyboard | Yes |
| Arrow/Home/End traversal in settings | Yes | Yes with keyboard | Yes with keyboard | Yes |
| Focus return target | Trigger button | Trigger button | Trigger button | Trigger button |

## Current Validation Status

这些行为后续应通过两类方式被验证：

- 自动化回归测试
- 内部策略 / contract 数据属性

在本轮重建前，当前支线仍存在以下未对齐项：

- `SettingsPanel` / `SpeedPanel` 已删除，尚未按新方案重建
- `episodes` 面板尚未补可见滚动条
- `AirPlay / PiP` 尚未按“尽可能固定右上”落位
- fullscreen 维度尚未在代码和测试中显式验证

真实设备验证仍然必要，特别是：

- iPhone Safari
- iPad Safari
- Android Chrome
- 桌面 Safari / Chromium

## Notes

- `Phone Touch` 顶部空间不足时，top-right 优先级按 `settings > airplay > pip` 退化。
- `Tablet Touch` 与 `Phone Touch` 共享核心触屏布局：中央大 `play`、右侧 `next`、左下 `episodes`。
- `Phone Touch` 顶部空间不足时，top-right 优先级按 `settings > speed > airplay > pip` 退化。
- `Volume button` 与 `volume slider` 仅在桌面与桌面 fullscreen 保留；移动端完全交给设备音量控制。
- `Time display` 在触屏布局中移至进度条左端上方；手机端字号需要进一步收小。
- `episodes` 面板后续需要补滚动条，但滚动条不能破坏 panel 圆角边缘。
- 桌面与 fullscreen 下，`next + episodes` 必须保持相邻且相对顺序不变。
- 一些系统能力在当前布局中被有意延后重建，不代表底层代码完全不支持。
- 平台能力的更细支持边界，应结合 [`/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md`](/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md) 一起看。
