# Tasks

## ⬜ PLAYER-74 — 布局系统重建

- **序列**：SEQ-20260407-38
- **状态**：⬜ 待开始
- **创建时间**：2026-04-07 22:00
- **计划开始**：PLAYER-71 之后

### 目标
按新矩阵重建布局系统：全屏 pointer/touch 独立 slot 函数、touch 下 next 移到 edge-right、Phone top-right 按 viewportBand 静态降级。

### 变更范围
- `src/player/hooks/useLayoutDecision.ts`：fullscreen pointer/touch 拆分、touch next 位置、phone top-right 降级

### 验收标准
- [ ] 全屏 pointer 与 touch 使用独立 slot 逻辑
- [ ] touch 模式下 next 按钮在 edge-right
- [ ] phone-portrait top-right 按 viewportBand 降级
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0
- [ ] `npm test` exit 0（86 tests pass）
