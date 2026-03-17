# Task: 调整按钮背景配色，适配亮色与暗色背景

## Status
done

## Description

当前 `.ytpButton` 默认背景为完全透明，悬停时为 `rgba(255,255,255,0.1)`（白色透明）。在亮色背景下按钮几乎不可见，在暗色背景下悬停效果也较弱。

参考截图分析：按钮使用**深色半透明背景**（`rgba(0,0,0,0.2)` 量级），在亮色页面背景下显示为灰色圆形，在暗色视频背景下几乎不可见。这使得按钮在两种背景下均表现良好。

修复方案：
- `.ytpButton` 默认：`background: rgba(0, 0, 0, 0.15)` — 在亮色背景下显示为可见的灰色圆形
- `.ytpButton:hover`：`background: rgba(0, 0, 0, 0.35)` — 悬停时加深
- 同时保留 `border-radius: 2px`（原有，与圆形形态一致）

## Acceptance Criteria
- [ ] 按钮在亮色背景下有可见的灰色圆形背景
- [ ] 按钮悬停时灰色加深
- [ ] 暗色背景下按钮背景几乎不可见，与现有视觉风格兼容
- [ ] `npm run typecheck` 退出码为 0
- [ ] `npm test` 退出码为 0

## Constraints
- 仅修改 `src/player/Player.module.css`，不改动 JSX
