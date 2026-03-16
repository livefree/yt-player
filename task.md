# Task: 进度条与控制按钮之间增加间距

## Status
done

## Description

进度条（`.ytpProgressBarContainer`）与下方控制按钮栏（`.ytpChromeControls`）当前紧靠在一起，鼠标容易在拖动进度条时误触控制按钮。

在两者之间增加少量间距（约 4px），提升操作精准度，避免误操作。

## Acceptance Criteria
- [ ] 进度条底部与控制按钮之间有可见的小间隙
- [ ] 控制栏整体外观不破坏（对齐、高度合理）
- [ ] `npm run typecheck` 退出码为 0
- [ ] `npm test` 退出码为 0

## Constraints
- 仅修改 `src/player/Player.module.css`，不改动 JSX
- 不增加新依赖

## Notes
- 修改 `.ytpProgressBarContainer` 的 `padding-bottom`，或在 `.ytpChromeControls` 添加 `margin-top`
- 间距不宜过大，4px 为宜（控制栏空间有限）
