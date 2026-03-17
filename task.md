# Task: 修复进度条焦点边框、对称扩展与红点居中三个问题

## Status
done

## Description

1. **点击进度条出现白色边框** — `.ytpProgressBar` 有 `role="slider"` 和 `tabIndex=0`，点击后获得 focus，触发 `.moviePlayer:focus-within .ytpProgressBar:focus` 规则显示白色 outline。修复：将 `:focus` 改为 `:focus-visible`，仅在键盘导航时显示，鼠标点击不显示。

2. **进度条只向一侧扩展** — 当前用 `height: 3px → 5px` + `margin-top: -1px` 实现对称扩展，但 margin-top 补偿依赖 block 布局计算，在动画中可能出现不对称。YouTube 的正确做法：让 `.ytpProgressBar` 始终保持最终高度（5px），对内层 `.ytpProgressList` 用 `transform: scaleY(0.6)` 收缩至视觉 3px，悬停时 `scaleY(1)`。`transform` 从 `transform-origin: center` 扩展，天然对称，无需 margin 补偿。

3. **红点与进度条中轴未对齐** — 当前 `.ytpProgressBar` 高度为 3px，`top: 50%` = 1.5px；按钮 13px，`margin-top: -6px` 使按钮中心在 2px，偏离中轴 0.5px。改用固定 5px 高度后，`top: 50%` = 2.5px；`margin-top: -6.5px` 使按钮中心精确在 2.5px，完美居中。`margin-left` 同理改为 `-6.5px`。

## Acceptance Criteria
- [ ] 鼠标点击进度条后无白色边框；键盘 Tab 聚焦时仍显示 outline
- [ ] 悬停时进度条向两侧均匀扩展（对称动画）
- [ ] 红点中心与进度条视觉中轴精确对齐（静止和悬停状态均一致）
- [ ] `npm run typecheck` 退出码为 0
- [ ] `npm test` 退出码为 0

## Constraints
- 仅修改 `src/player/Player.module.css`，不改动 JSX

## Notes
- 容器总高度维持不变：`padding: 7px 0 3px` + 5px bar = 15px（原来 8px+3px+4px=15px）
- `scaleY(0.6)` 视觉高度 = 5px × 0.6 = 3px，与原始外观一致
- `scaleY` 使用 `transform-origin: center`，从中心扩展，天然对称
- scrubber 中心偏移：13px / 2 = 6.5px，CSS 支持小数 px
