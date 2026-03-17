# Task: 修复进度条悬停时颜色、红点同步和尺寸比例三个问题

## Status
done

## Description

1. **悬停时已播放部分变浅红** — 悬停时 hover ghost（半透明白色）叠在红色已播放层之上，使其变成粉红色。根本原因：DOM 顺序导致 `.ytpHoverProgress` 渲染在 `.ytpPlayProgress` 之上。修复：给 `.ytpPlayProgress` 加 `z-index: 1`，使其始终在 hover ghost 之上。

2. **红点仅在悬停时出现，不跟随播放位置** — `.ytpScrubberButton` 默认 `transform: scale(0)` 完全隐藏。需改为默认可见（`scale(0.6)`），悬停时放大（`scale(1)`）。

3. **进度条变宽时红点不等比例增大** — 进度条从 3px → 5px（×5/3），红点应从 `scale(0.6)` → `scale(1)`（比例一致，`1 / 0.6 ≈ 1.67 ≈ 5/3`）。问题 2 和 3 同一修复解决。

## Acceptance Criteria
- [ ] 悬停时已播放区域保持纯红色，不变浅
- [ ] 红点在控制栏可见时始终显示（不只在悬停时出现）
- [ ] 悬停时红点尺寸增大，与进度条加粗比例一致
- [ ] `npm run typecheck` 退出码为 0
- [ ] `npm test` 退出码为 0

## Constraints
- 仅修改 `src/player/Player.module.css`，不改动 JSX

## Notes
- 进度条高度比：5/3 ≈ 1.667；红点 scale 比：1/0.6 ≈ 1.667 — 完全一致
