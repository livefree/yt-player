# Changelog

## 2026-04-06 01:44

- **任务**：PLAYER-02 — 补齐关键用户流回归测试
- **所属序列**：SEQ-20260406-01
- **结果**：
  - 扩展 `src/test/Player.test.tsx`，覆盖 source loading、HLS 生命周期、autoplay muted fallback、progress click/touch scrub、gesture seek、settings/episodes 面板等关键回归路径
  - 修复 `src/player/Player.tsx` 中 `Screen Wake Lock` cleanup 的空 sentinel 调用 bug
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`
