# Development Log

## 2026-03-16 — 按钮配色调整：适配亮色与暗色背景

**Task:** 参考截图分析，将按钮背景改为深色半透明，在亮色背景下呈灰色圆形，在暗色背景下几乎不可见。

### 调整：`.ytpButton` 默认背景与圆形形态

- **File:** `src/player/Player.module.css`
- **Fix 1:** `background: transparent` → `background: rgba(0, 0, 0, 0.15)`，按钮默认呈半透明深色圆形背景，亮色背景下清晰可见。
- **Fix 2:** `border-radius: 2px` → `border-radius: 50%`，按钮改为正圆形，与参考截图的视觉风格一致。
- **Fix 3:** `hover: rgba(255,255,255,0.1)` → `hover: rgba(0,0,0,0.35)`，悬停时加深，与默认背景同色系。
- 在亮色背景下：默认灰圆 → 悬停深灰圆；在暗色背景下：深色背景下几乎不可见（与暗色渐变融合）。

---

## 2026-03-16 — 进度条焦点边框、对称扩展与红点居中修复

**Task:** 修复进度条点击白色边框、扩展方向偏斜、红点轴线偏移三个问题。

### Fix 1: 点击进度条出现白色 outline

- **File:** `src/player/Player.module.css`
- **Root cause:** `.ytpProgressBar` 有 `role="slider"` 和 `tabIndex=0`，鼠标点击后获得 focus，触发 `:focus` 规则显示白色轮廓。
- **Fix:** 将 `.ytpProgressBar:focus` 改为 `.ytpProgressBar:focus-visible`。键盘 Tab 聚焦时仍显示轮廓，鼠标点击不显示。

### Fix 2: 进度条非对称扩展（YouTube 方案重构）

- **File:** `src/player/Player.module.css`
- **Root cause:** 原方案用 `height: 3px → 5px` + `margin-top: -1px` 补偿，依赖 block 布局计算，动画中两侧扩展量不精确对称。
- **Fix:** YouTube 标准做法：
  - `.ytpProgressBar` 固定 `height: 5px`（最终展开尺寸，不再变化）
  - `.ytpProgressList` 默认 `transform: scaleY(0.6)`（视觉 3px）+ `transform-origin: center`
  - 悬停时 `scaleY(1)`（视觉 5px）
  - `transform` 从中心点扩展，天然双向对称，无需 margin 补偿
  - 容器 `padding: 7px 0 3px`（原 8+4px）维持总高度 15px 不变

### Fix 3: 红点中心偏离进度条中轴

- **File:** `src/player/Player.module.css`
- **Root cause:** 原方案 `.ytpProgressBar` 高度 3px，`top: 50% = 1.5px`；`margin-top: -6px` 使按钮中心在 2px，偏离中轴 0.5px。
- **Fix:** 固定 5px 高度后 `top: 50% = 2.5px`；`margin-top: -6.5px`（精确半径 13px/2）使按钮中心精确在 2.5px。`margin-left` 同改为 `-6.5px` 修复水平居中。CSS 支持小数 px，两轴均精确对齐。

---

## 2026-03-16 — 进度条悬停颜色、红点同步与尺寸比例修复

**Task:** 修复进度条悬停时三个视觉问题。

### Fix 1: 悬停时已播放区域变浅红

- **File:** `src/player/Player.module.css`
- **Root cause:** `.ytpHoverProgress`（半透明白色）在 DOM 中位于 `.ytpPlayProgress` 之后，因此渲染在红色层之上，叠加后呈粉红色。
- **Fix:** 给 `.ytpPlayProgress` 添加 `z-index: 1`，使红色已播放层始终渲染在 hover ghost 之上。

### Fix 2 & 3: 红点仅悬停时出现 + 尺寸不随进度条等比增大

- **File:** `src/player/Player.module.css`
- **Root cause:** `.ytpScrubberButton` 默认 `transform: scale(0)` 完全隐藏，且悬停时直接跳至 `scale(1)`，与进度条从 3px → 5px（比例 5/3 ≈ 1.667）不匹配。
- **Fix:** 将默认值改为 `transform: scale(0.6)`（与 3px 基准匹配），悬停时改为 `scale(1)`（与 5px 粗细匹配）。比例 `1 / 0.6 ≈ 1.667 = 5/3`，完全对齐。同时添加 `transition: transform 0.15s ease` 使缩放平滑。
- 红点现在在控制栏可见时始终显示，仅尺寸随悬停状态变化。

---

## 2026-03-16 — 进度条与控制按钮之间增加间距

**Task:** 避免操作进度条时误触下方按钮。

### 调整：`.ytpChromeControls` 添加 `margin-top: 4px`

- **File:** `src/player/Player.module.css`
- **Fix:** 在 `.ytpChromeControls` 添加 `margin-top: 4px`，在进度条区域与控制按钮行之间制造 4px 的视觉与交互间隙。
- 选择 `margin-top` 而非修改 `padding-bottom`，是因为后者会扩大进度条的命中区域，可能反而增加误操作概率。

---

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
