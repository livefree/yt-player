# Task: 修复鼠标指针形状与控制栏自动隐藏一致性

## Status
done

## Description

修复两个交互细节问题：

1. **鼠标指针形状错误** — 当前整个视频画面区域的鼠标指针均为"手形"（`cursor: pointer`），应当只在控制按钮和进度条上方显示手形，视频画面区域保持"箭头"形态。根本原因：`.ytpGestureLayer` 设置了 `cursor: pointer`。

2. **控制栏自动隐藏行为不一致** — 播放状态下控制栏会在鼠标静止后自动隐藏，但暂停状态下控制栏永久显示。根本原因：`revealChrome` 函数中有 `if (!isPlaying) return;` 提前返回，导致暂停时不会设置隐藏计时器。

## Acceptance Criteria
- [x] 鼠标在视频画面上方时显示"箭头"指针
- [x] 鼠标在控制按钮、进度条上方时显示"手形"指针（原有行为保持）
- [x] 暂停时控制栏在鼠标静止 2 秒后自动隐藏（与播放状态一致）
- [x] `npm run typecheck` 退出码为 0
- [x] `npm test` 退出码为 0

## Constraints
- 不增加新的 runtime 依赖
- 仅修改 `src/player/Player.module.css` 和 `src/player/Player.tsx`

## Notes
- `.ytpGestureLayer` 的 `cursor: pointer` 改为 `cursor: default`；各控制元素自身的 `cursor: pointer` 不变
- 从 `revealChrome` 中移除 `if (!isPlaying) return;`，并从 `useCallback` 依赖数组中移除 `isPlaying`
