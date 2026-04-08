# Tasks

## ⬜ PLAYER-71 — SpeedPanel 重建 + Speed 按钮格式统一

- **序列**：SEQ-20260407-38
- **状态**：⬜ 待开始
- **创建时间**：2026-04-07 20:18
- **计划开始**：PLAYER-73 之后

### 目标
按新矩阵合约重建 SpeedPanel：无标题文字、4 个预设（0.5x/1x/1.5x/2x）、格式统一为两位小数、SettingsPanel 移除 Speed 入口。

### 变更范围
- `src/player/components/SpeedPanel.tsx`：完整重建
- `src/player/components/SettingsPanel.tsx`：移除 Speed 入口
- `src/player/utils/format.ts`：`formatRateBadge` 统一为 2 位小数（0.50x、1.00x…）
- `src/player/Player.module.css`：补全 SpeedPanel 相关 CSS

### 验收标准
- [ ] SpeedPanel 无 header 标题文字
- [ ] 预设为 0.5x / 1x / 1.5x / 2x（4 个）
- [ ] 所有速率显示统一格式（`formatRateBadge`）
- [ ] SettingsPanel 不再含 Speed 行
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0
- [ ] `npm test` exit 0（86 tests pass）
