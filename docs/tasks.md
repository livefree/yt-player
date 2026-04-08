# Tasks

## 🔄 PLAYER-72 — Player.tsx 解构：提取 actions 与 ControlRenderer

- **序列**：SEQ-20260407-38
- **状态**：🔄 进行中
- **创建时间**：2026-04-07 22:00
- **实际开始**：2026-04-07 22:00

### 目标
将 Player.tsx（1391 行）中的两个最大模块提取为独立文件，纯平移不改行为。

### 变更范围
- 新增 `src/player/hooks/usePlayerActions.ts`：所有 action 函数
- 新增 `src/player/controls/ControlRenderer.tsx`：renderControl switch
- 修改 `src/player/Player.tsx`：导入上述两个文件，删除被提取的代码

### 验收标准
- [ ] `usePlayerActions` 包含全部 action 函数（togglePlay / doSeek / changeVolume / toggleMute / revealVolumeSlider / toggleFullscreen / toggleTheater / cycleSubtitles / seekToPercent / handleProgressClick / togglePip / triggerAirPlay / handleEpisodeChange）
- [ ] `ControlRenderer.tsx` 包含完整的 renderControl 函数，所有 14 个 control case
- [ ] Player.tsx 行数 ≤ 650
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0
- [ ] `npm test` exit 0（86 tests pass）
- [ ] 播放器行为无任何变化
