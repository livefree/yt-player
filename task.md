# Task: 按钮高度对齐 + M 键静音/取消静音修复

## Status
done

## Description

### 1. 按钮高度对齐

`.ytpButton` 当前 `width/height: 40px`，时间显示 pill 为 `height: 32px`，导致视觉高度不一致。
修复：将 `.ytpButton` 改为 `32px × 32px`；同步将 `.ytpVolumeArea` 的 `height` 改为 `32px`。
`border-radius` 保持不变（20px 在 32px 高度下被自动 cap 到 16px，仍为完整圆形/pill）。

### 2. M 键取消静音无效（stale closure）

`Player.tsx` 中键盘 `useEffect` 的依赖数组为 `[volume, subtitles, activeSubId]`，缺少 `isMuted` 和 `prevVolume`。

当按 M 键静音后：`isMuted` 变为 `true`，但因其不在依赖数组中，`useEffect` 不重新注册。再次按 M 时，键盘处理函数调用的 `toggleMute` 仍然捕获旧的 `isMuted = false`，因此再次进入 else 分支（再次静音），而非取消静音。

修复：在依赖数组中加入 `isMuted` 和 `prevVolume`，使 handler 在静音状态变化时重新注册，始终持有最新状态。

## Acceptance Criteria
- [ ] 控制栏所有按钮背景高度与时间显示 pill 高度一致（32px）
- [ ] 按 M 键静音后，再按 M 键能正确取消静音并恢复之前的音量
- [ ] `npm run typecheck` 退出码为 0
- [ ] `npm test` 退出码为 0

## Constraints
- CSS 修改：`src/player/Player.module.css`
- JSX 修改：`src/player/Player.tsx`（仅 useEffect 依赖数组）
