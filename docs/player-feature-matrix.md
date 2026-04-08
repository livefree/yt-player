# YTPlayer Feature Matrix

## Scope

这份矩阵描述"已确认的下一轮重建目标下，用户可见能力在不同终端上的预期表现"。  
终端维度按当前规划分为：

- `Desktop Pointer`
- `Tablet Touch`
- `Phone Touch`
- `Fullscreen Immersive`（细分 pointer fullscreen / touch fullscreen）

`Conditional` 表示依赖浏览器能力或内容数据。  
`Panel` 表示能力不一定常驻，但可通过 settings / speed 等面板访问。

## Planning Notes

- 这份文档承担"重建目标 contract"，不是对当前未提交 worktree 的逐行镜像。
- 重建阶段应以本矩阵为准回推 `useLayoutDecision`、`Player.tsx`、`SettingsPanel`、`SpeedPanel`、`EpisodesPanel` 与测试。
- 本次更新（2026-04-07）统一落档以下变更：
  - Speed 升级为全端一级按钮，SettingsPanel 不再含 Speed 入口
  - SpeedPanel 结构重建（无文案标题，slider 复用音量轨道，4 个固定预设）
  - SettingsPanel 一级项缩减为 Quality + Subtitles/CC
  - Volume 行为拆分为三个独立维度
  - Time display 在触屏端移至进度条左端上方
  - Touch 端布局统一（Tablet = Phone 同构）
  - Fullscreen Immersive 细分 pointer / touch 行为
  - EpisodesPanel 补充滚动条要求
  - 三类 Panel 统一 family contract
  - Phone top-right 优先级退化顺序明确为 settings > speed > airplay > pip

---

## Controls Visibility Matrix

| Feature | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Play / Pause | Bottom-left visible | Large center overlay | Large center overlay | Bottom-left visible | Large center overlay |
| Progress scrubber | Bottom controls visible | Bottom controls visible | Bottom controls visible | Bottom controls visible | Bottom controls visible |
| Time display | Bottom controls | Above progress rail, left-aligned | Above progress rail, left-aligned, smaller text | Bottom controls | Above progress rail, left-aligned |
| Volume button | Bottom-left visible | Hidden | Hidden | Bottom-left visible | Hidden |
| Volume slider | Hover-reveal right of volume button | Hidden | Hidden | Hover-reveal right of volume button | Hidden |
| Mute / Unmute (in-player) | Via volume button | Hidden; device hardware volume | Hidden; device hardware volume | Via volume button | Hidden; device hardware volume |
| Muted autoplay unmute prompt | Visible as independent overlay | Visible as independent overlay | Visible as independent overlay | Visible as independent overlay | Visible as independent overlay |
| Episodes entry | Bottom-left visible | Bottom-left visible | Bottom-left visible | Bottom-left visible | Bottom-left visible |
| Next button | Bottom-left visible when provided | Edge-right when provided | Edge-right when provided | Bottom-left visible when provided | Edge-right when provided |
| Subtitles direct button | Bottom-right visible when available | Hidden (access via Settings panel) | Hidden (access via Settings panel) | Bottom-right visible when available | Hidden (access via Settings panel) |
| Speed direct button | Bottom-right always visible | Top-right always visible | Top-right always visible | Bottom-right always visible | Top-right always visible |
| Settings button | Bottom-right visible | Top-right visible | Top-right visible | Bottom-right visible | Top-right visible |
| Theater mode | Bottom-right visible | Hidden | Hidden | Hidden | Hidden |
| PiP | Top-right conditional | Top-right conditional | Top-right conditional (space permitting) | Top-right conditional | Top-right conditional (space permitting) |
| AirPlay | Top-right conditional | Top-right conditional | Top-right conditional (space permitting) | Top-right conditional | Top-right conditional (space permitting) |
| Fullscreen button | Bottom-right visible | Bottom-right visible | Bottom-right visible | Bottom-right visible (exit action) | Bottom-right visible (exit action) |

---

## Layout / Navigation Matrix

| Behavior | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Title in top chrome | Visible when provided | Visible when provided | Visible when provided | Visible when provided | Visible when provided |
| top-left | — | — | — | — | — |
| top-right | `airplay + pip` | `settings + speed + airplay + pip` | `settings + speed + airplay + pip` with priority fallback | `airplay + pip` | `settings + speed + airplay + pip` with priority fallback |
| bottom-left | `play + next-episodes-group + volume + time + chapter` | `episodes` | `episodes` | `play + next-episodes-group + volume + time + chapter` | `episodes` |
| bottom-right | `subtitles + speed + settings + theater + fullscreen` | `fullscreen` | `fullscreen` | `subtitles + speed + settings + fullscreen` | `fullscreen` |
| center-overlay | None | Large `play` | Large `play` + `next` (adjacent, right of play) | None | Large `play` + `next` (adjacent, right of play) |
| edge-right | — | — | — | — | — |
| Desktop compact / short top-right | `speed + settings + episodes` | N/A | N/A | N/A | N/A |
| Desktop compact / short bottom-right | `subtitles + theater + airplay + pip + fullscreen` | N/A | N/A | N/A | N/A |
| Next + Episodes adjacency | Must remain adjacent; relative order invariant | Episodes bottom-left only | Episodes bottom-left only | Must remain adjacent; relative order invariant | Episodes bottom-left only |
| Theater mode | Visible | Hidden | Hidden | Hidden | Hidden |
| Fullscreen reorders controls | No relative reorder; theater removed in fullscreen | N/A | N/A | No relative reorder | N/A |
| Narrow / short layout collapse | Enabled for desktop | N/A | N/A | N/A | N/A |
| Phone top-right priority (when space tight) | N/A | N/A | `settings > speed > airplay > pip` | N/A | `settings > speed > airplay > pip` |

---

## Panel Access Path Matrix

| Feature | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Speed panel | Direct speed button → SpeedPanel | Direct speed button → SpeedPanel | Direct speed button → SpeedPanel | Direct speed button → SpeedPanel | Direct speed button → SpeedPanel |
| Settings panel | Direct settings button → SettingsPanel | Direct settings button → SettingsPanel | Direct settings button → SettingsPanel | Direct settings button → SettingsPanel | Direct settings button → SettingsPanel |
| Quality submenu | SettingsPanel → quality item | SettingsPanel → quality item | SettingsPanel → quality item | SettingsPanel → quality item | SettingsPanel → quality item |
| Subtitles submenu | Direct button **or** SettingsPanel → subtitles item | SettingsPanel → subtitles item | SettingsPanel → subtitles item | Direct button **or** SettingsPanel | SettingsPanel → subtitles item |
| Episodes panel | Episodes button → EpisodesPanel | Episodes button → EpisodesPanel | Episodes button → EpisodesPanel | Episodes button → EpisodesPanel | Episodes button → EpisodesPanel |

### Panel Open State

- `openPanel` 单一状态：`null | "speed" | "settings" | "quality" | "subtitles"`
- Speed 和 Settings 互斥，不同时打开
- Episodes panel 独立状态，不与 openPanel 共享

---

## Speed Button Contract

| Dimension | Spec |
| --- | --- |
| Visibility | 所有终端一级常驻按钮 |
| Button text | 始终显示当前倍速，格式固定 `N.NNx`（保留两位小数，如 `1.00x`、`1.50x`） |
| Button tooltip | 桌面 hover：`Playback speed (1.00x)` 动态文案；触屏：无 tooltip |
| Active state | SpeedPanel 打开时高亮；关闭时恢复 |
| Icon | 桌面宽屏显示速度图标；compact / narrow / touch 仅显示数值文本 |
| Click action | 直接打开 / 关闭 SpeedPanel（toggle） |

---

## SpeedPanel Structure Contract

SpeedPanel 不包含任何文案标题（无 "Playback speed"、"Adjust speed"、最小/最大倍速提示）。

### 结构顺序（从上到下）

1. **当前倍速值**
   - 居中显示
   - 字号稍大，使用 tabular-nums
   - 隐藏条件：`compact | narrow | phone-portrait` viewportBand
   - 隐藏后由一级 speed 按钮承担实时数值展示，面板不重复显示

2. **Slider 行**：`- button | slider track | + button`
   - 范围：0.25 → 3.00，步进 0.05
   - clamp 到 [0.25, 3.00]
   - 视觉和交互完全复用现有音量横向 slider（轨道、fill、handle、hover/drag 手感）
   - `-` 按钮 tooltip（桌面 hover）：`[`
   - `+` 按钮 tooltip（桌面 hover）：`]`
   - slider track 本体 hover tooltip（桌面 hover）：`[ slower · faster ]`（紧凑单行，复用现有 tooltip 体系）

3. **预设按钮行**（固定 4 个）
   - `0.50x`、`1.00x`、`1.50x`、`2.00x`
   - 点击后直接设置对应倍速
   - 命中判定：`|current - preset| < 0.01`
   - 命中时：对应按钮文字变色（视觉选中感对齐 episodes 当前项；无需复用 episodes DOM 结构）
   - 非命中：无任何预设按钮高亮

---

## SettingsPanel Contract

### 一级项（固定，仅两项）

| 项目 | 显示条件 |
| --- | --- |
| Quality | `qualities.length > 0` |
| Subtitles/CC | `subtitles.length > 0` |

- Speed 入口**不再出现**在 SettingsPanel
- 如果 Quality 和 Subtitles/CC 都不存在，Settings 按钮按当前策略决定禁用或隐藏

---

## Panel Family Contract（三类面板统一）

EpisodesPanel、SettingsPanel、SpeedPanel 必须在以下维度统一：

| 维度 | 要求 |
| --- | --- |
| 外层圆角 | 统一 `--ytp-panel-radius` |
| 背景材质 | 统一 `--ytp-panel-bg`（含 backdrop-filter blur） |
| 边框 | 统一 `--ytp-panel-border` |
| 阴影 | 统一 `--ytp-panel-shadow` |
| 出场动画 | 统一 `ytpPanelIn` keyframes |
| 最大高度策略 | 统一 compact / stable sizing mode |
| Tooltip 遮挡策略 | panel 打开时同级 tooltip 不遮挡 panel |
| 打开后 focus | 进入首个可交互项 |
| Escape 关闭 | 统一支持 |
| 关闭后 focus | 回到触发按钮 |
| Outside-click close | 统一支持 |
| `aria-haspopup` | `"dialog"` |
| `aria-expanded` | 反映 panel 开关状态 |
| `aria-controls` | 指向对应 panel id |

### EpisodesPanel 补充要求

- 增加滚动条，不破坏 panel 圆角视觉
- 滚动所有权：内层 scroller（`overflow-y: auto`）；外层继续 `overflow: hidden`
- 滚动条样式：细且低干扰（`scrollbar-width: thin`）
- EpisodesPanel 的视觉基准将反向约束 SettingsPanel / SpeedPanel

---

## Volume Behavior Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Volume button | Visible, bottom-left | Hidden | Hidden | Visible, bottom-left | Hidden |
| Volume slider | Hover-reveal on right of volume button | Hidden | Hidden | Hover-reveal on right of volume button | Hidden |
| Mute / Unmute (in-player) | Via volume button | Not provided | Not provided | Via volume button | Not provided |
| Muted autoplay unmute prompt | Visible as independent overlay | Visible as independent overlay | Visible as independent overlay | Visible as independent overlay | Visible as independent overlay |

---

## Input Behavior Matrix

| Interaction | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Hover reveal chrome | Yes | No | No | Yes | No |
| Pointer move reveal chrome | Yes | N/A | N/A | Yes | N/A |
| Tap reveal chrome | N/A | Yes | Yes | N/A | Yes |
| Double-tap seek left/right | Yes via gesture zones | Yes | Yes | Yes | Yes |
| Touch scrub on progress bar | N/A | Yes | Yes | N/A | Yes |
| In-player volume gesture | No | No | No | No | No |
| Keyboard shortcuts | Yes | Limited by attached keyboard | Limited by attached keyboard | Yes | Limited by attached keyboard |

---

## Chrome Visibility Matrix

| Behavior | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Policy id | `hover-autohide` | `touch-autohide` | `touch-persistent-paused` | `hover-autohide` (immersive) | `touch-autohide` (immersive) |
| Pause state | Can autohide | Can autohide | Stays visible | May autohide | Follows touch policy |
| Playback state | Autohide | Autohide | Autohide | Autohide | Autohide |
| Hide delay | 2000ms | 3200ms | 2000ms when applicable | Immersive delay override | Immersive delay override |
| Cursor hide on autohide | No | N/A | N/A | Yes | N/A |

---

## Overlay Behavior Matrix

| Overlay | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Spinner | Visible during loading / buffering | Visible | Visible | Visible | Visible |
| Error banner | Blocking overlay | Blocking overlay | Blocking overlay | Blocking overlay | Blocking overlay |
| Captions | Visible above chrome or raised | Visible above chrome | Raised when bottom panel occupies space | Visible above chrome or raised | Raised when bottom panel occupies space |
| Unmute prompt | Top edge or below top chrome | Below top chrome; shift left only when real top-right panel is open | Below top chrome; shift left only when real top-right panel is open | Same rule as desktop | Same rule as touch |
| Seek feedback overlay | Visible when allowed | Visible when allowed | Visible when allowed | Visible when allowed | Visible when allowed |
| Touch seek indicator | N/A | Visible when active | Visible when active | N/A | Visible when active |
| Panel suppresses prompt | Yes | Yes | Yes | Yes | Yes |
| Fatal error suppresses spinner / captions / prompt | Yes | Yes | Yes | Yes | Yes |

---

## Media / System Behavior Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| MP4 / direct source playback | Yes | Yes | Yes | Yes | Yes |
| HLS native playback | Conditional | Conditional | Conditional | Conditional | Conditional |
| HLS via `hls.js` fallback | Conditional | Conditional | Conditional | Conditional | Conditional |
| Media Session | Conditional | Conditional | Conditional | Conditional | Conditional |
| Wake Lock | Conditional | Conditional | Conditional | Conditional | Conditional |
| AirPlay trigger | Conditional, top-right | Conditional, top-right | Conditional, top-right space permitting | Conditional, top-right | Conditional, top-right space permitting |
| Picture in Picture | Conditional, top-right | Conditional, top-right | Conditional, top-right space permitting | Conditional, top-right | Conditional, top-right space permitting |

---

## Accessibility / Keyboard Matrix

| Capability | Desktop Pointer | Tablet Touch | Phone Touch | Fullscreen Pointer | Fullscreen Touch |
| --- | --- | --- | --- | --- | --- |
| Focus-visible feedback | Yes | Yes when focusable | Yes when focusable | Yes | Yes when focusable |
| Settings panel focus trap | Yes | Yes | Yes | Yes | Yes |
| Speed panel focus trap | Yes | Yes | Yes | Yes | Yes |
| Episodes panel focus handoff | Yes | Yes | Yes | Yes | Yes |
| Escape closes panel | Yes | Yes with keyboard | Yes with keyboard | Yes | Yes with keyboard |
| Arrow / Home / End traversal | Yes | Yes with keyboard | Yes with keyboard | Yes | Yes with keyboard |
| Focus return target | Trigger button | Trigger button | Trigger button | Trigger button | Trigger button |

---

## Terminology Glossary

| 术语 | 定义 |
| --- | --- |
| Speed direct button | 所有终端一级常驻按钮，始终显示当前倍速 |
| Speed access path | 所有终端：Direct button → SpeedPanel |
| Speed panel header value | compact / narrow / phone-portrait 下隐藏 |
| Phone top-right priority | `settings > speed > airplay > pip` |
| Episodes scroll ownership | inner scroller only（外层 `overflow: hidden`） |
| Panel family | EpisodesPanel + SettingsPanel + SpeedPanel 统一视觉/行为契约 |
| next-episodes-group | 底部 DOM 中 next + episodes 的相邻分组，桌面/fullscreen pointer 下保持不变 |
| center-overlay-group | 触屏端 center-overlay 中 play + next 的相邻分组，next 始终在 play 右侧 |

---

## Current Validation Status

在本轮重建前，当前支线存在以下未对齐项（按优先级排列）：

**P0 — 阻塞核心体验**
- [x] Speed 在 Phone Touch / Tablet Touch 渲染为独立 top-right 按钮，格式 `1.00x`，SpeedPanel 无标题（PLAYER-71/73）
- [x] SettingsPanel 不含 Speed 入口，Quality / Subtitles 导航完整（已验证）
- [x] Fullscreen pointer / touch 独立建模（PLAYER-74）
- [x] 移动端首帧即用正确布局（同步初始化 isCoarsePointer + viewport）

**P1 — 布局正确性**
- [x] Next 按钮在 Phone / Fullscreen Touch 下在 center-overlay（play 右侧），Tablet Touch 在 edge-right（未实现，待定）
- [x] Time display 在 Phone Touch 下移至进度条左端上方，字号缩小（PLAYER-75）
- [ ] AirPlay / PiP 动态退化逻辑（基于 top-right 可用空间）尚未实现
- [x] Desktop compact 模式 speed + settings + episodes 提升到 top-right（applyDesktopCollapsePolicy）

**P2 — Panel family 统一**
- [x] SpeedPanel 重建：无标题、HorizontalSlider、4 个预设（PLAYER-71/73）
- [x] 面板滚动修复：ytpPanelSurface flex 列，scroller flex:1/min-height:0（今日修复）
- [x] EpisodesPanel 滚动条：scrollbar-width thin + scrollbar-color（PLAYER-75）
- [ ] 三类 panel 统一 outside-click close / aria contract / focus return（待实现）

**P3 — 视觉细节**
- [x] Speed 按钮格式统一为两位小数（`formatRateBadge` 已对齐）
- [ ] Speed preset 命中高亮（对齐 episodes 选中态色值）
- [ ] Subtitles 在触屏端从直接按钮改为 panel 入口

真实设备验证仍然必要：
- iPhone Safari
- iPad Safari
- Android Chrome
- 桌面 Safari / Chromium
