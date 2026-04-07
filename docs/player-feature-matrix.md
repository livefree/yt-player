# YTPlayer Feature Matrix

## Scope

这份矩阵描述“当前支线实现下，用户可见能力在不同终端上的预期表现”。  
这里的终端维度按当前实现与策略文档分为：

- `Desktop Pointer`
- `Tablet Touch`
- `Phone Touch`

`Conditional` 表示依赖浏览器能力或内容数据。  
`Panel` 表示能力不一定常驻，但可通过 settings / episodes 等面板访问。

## Controls Visibility Matrix

| Feature | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| Play / Pause | Visible | Visible | Visible |
| Progress scrubber | Visible | Visible | Visible |
| Time display | Visible | Visible | Hidden |
| Volume slider | Visible | Hidden | Hidden |
| Episodes entry | Visible | Visible | Visible |
| Next button | Visible when provided | Hidden | Hidden |
| Subtitles direct button | Visible when available | Visible when available | Panel |
| Settings button | Visible | Visible | Visible |
| Theater mode | Visible | Hidden | Hidden |
| PiP | Conditional visible | Hidden | Hidden |
| AirPlay | Conditional visible | Hidden | Hidden |
| Fullscreen button | Visible | Visible | Visible |

## Layout / Navigation Matrix

| Behavior | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| Title in top chrome | Visible when provided | Visible when provided | Visible when provided |
| Top-right controls | Compact migration / desktop actions | `episodes + settings + subtitles` | `settings` |
| Bottom-right primary actions | Player/system controls | `fullscreen` | `episodes + fullscreen` |
| Episodes panel placement | `bottom-left` or `top-right` depending on layout | `top-right` | `bottom-right` |
| Settings panel placement | `bottom-right` or `top-right` depending on layout | `top-right` | `top-right` |
| Narrow/short layout collapse | Enabled | N/A | N/A |

## Input Behavior Matrix

| Interaction | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| Hover reveal chrome | Yes | No | No |
| Pointer move reveal chrome | Yes | N/A | N/A |
| Tap reveal chrome | N/A | Yes | Yes |
| Double-tap seek left/right | Yes via gesture zones | Yes | Yes |
| Touch scrub on progress bar | N/A | Yes | Yes |
| In-player volume gesture | No | No | No |
| Keyboard shortcuts | Yes | Limited by attached keyboard | Limited by attached keyboard |

## Chrome Visibility Matrix

| Behavior | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| Policy id | `hover-autohide` | `touch-autohide` | `touch-persistent-paused` |
| Pause state | Can autohide | Can autohide | Stays visible |
| Playback state | Autohide | Autohide | Autohide |
| Hide delay | 2000ms | 3200ms | 2000ms when applicable |
| Immersive/theater override | Yes | Yes when immersive | Yes when immersive |

## Overlay Behavior Matrix

| Overlay | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| Spinner | Visible during loading / buffering | Visible | Visible |
| Error banner | Blocking overlay | Blocking overlay | Blocking overlay |
| Captions | Visible above chrome or raised | Visible above chrome | Raised when bottom panel occupies space |
| Unmute prompt | Top edge or below top chrome | Below top chrome; left if top-right panel open | Below top chrome; left if top-right panel open |
| Seek feedback overlay | Visible when allowed | Visible when allowed | Visible when allowed |
| Touch seek indicator | N/A | Visible when active | Visible when active |
| Panel suppresses prompt | Yes | Yes | Yes |
| Fatal error suppresses spinner / captions / prompt | Yes | Yes | Yes |

## Media / System Behavior Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| MP4 / direct source playback | Yes | Yes | Yes |
| HLS native playback | Conditional | Conditional | Conditional |
| HLS via `hls.js` fallback | Conditional | Conditional | Conditional |
| Media Session | Conditional | Conditional | Conditional |
| Wake Lock | Conditional | Conditional | Conditional |
| AirPlay trigger | Conditional | Typically hidden in current layout | Hidden in current layout |
| Picture in Picture | Conditional | Hidden in current layout | Hidden in current layout |

## Accessibility / Keyboard Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch |
| --- | --- | --- | --- |
| Focus-visible feedback | Yes | Yes when focusable | Yes when focusable |
| Settings panel focus trap | Yes | Yes | Yes |
| Episodes panel focus handoff | Yes | Yes | Yes |
| Escape closes panel | Yes | Yes with keyboard | Yes with keyboard |
| Arrow/Home/End traversal in settings | Yes | Yes with keyboard | Yes with keyboard |

## Current Validation Status

这些行为当前主要通过两类方式被验证：

- 自动化回归测试
- 内部策略 / contract 数据属性

真实设备验证仍然必要，特别是：

- iPhone Safari
- iPad Safari
- Android Chrome
- 桌面 Safari / Chromium

## Notes

- 这份矩阵描述的是“当前实现的预期表现”，不是长期最终形态。
- 一些系统能力在当前布局中被有意隐藏，不代表底层代码完全不支持。
- 平台能力的更细支持边界，应结合 [`/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md`](/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md) 一起看。
