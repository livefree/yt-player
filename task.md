# Task: 控制栏按钮组合背景与音量展开 pill 效果

## Status
done

## Description

参考截图进一步分析，三处需调整：

1. **右侧按钮组 pill** — `.ytpRightControls` 内所有按钮共用一个长条形 pill 背景（`rgba(0,0,0,0.15)` + `border-radius: 20px`）。按钮本身背景透明，悬停时显示略亮的白色半透明圆形（`rgba(255,255,255,0.12)`），视觉上半径小于 pill 端部的半圆，符合「略小一点的悬浮效果」。

2. **时间显示 pill** — `.ytpTimeDisplay` 作为可点击按钮，应有一个独立的 pill 背景（`rgba(0,0,0,0.15)` + `border-radius: 16px`），横向 padding 扩展到 `10px`，使文字有足够呼吸空间。

3. **音量区域动态 pill** — `.ytpVolumeArea` 始终有 `rgba(0,0,0,0.15)` 背景 + `border-radius: 20px`。折叠时宽度 ≈ 40px，外观与圆形按钮相同；展开时随 `.ytpVolumePanel` 宽度增长变形为 pill，视觉上音量条被包含在同一个 pill 内。`.ytpVolumeArea` 内的 `.ytpButton` 背景设为透明，避免圆形与 pill 叠加。

## Acceptance Criteria
- [ ] 右侧按钮组有统一 pill 背景，单按钮悬停显示较小的亮色圆
- [ ] 时间显示有独立 pill 背景
- [ ] 音量展开时 pill 背景自然延伸包含水平条
- [ ] 左侧播放/下一曲按钮保持独立圆形背景不变
- [ ] `npm run typecheck` 退出码为 0
- [ ] `npm test` 退出码为 0

## Constraints
- 仅修改 `src/player/Player.module.css`，不改动 JSX
