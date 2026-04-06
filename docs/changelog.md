# Changelog

## 2026-04-06 01:44

- **任务**：PLAYER-02 — 补齐关键用户流回归测试
- **所属序列**：SEQ-20260406-01
- **结果**：
  - 扩展 `src/test/Player.test.tsx`，覆盖 source loading、HLS 生命周期、autoplay muted fallback、progress click/touch scrub、gesture seek、settings/episodes 面板等关键回归路径
  - 修复 `src/player/Player.tsx` 中 `Screen Wake Lock` cleanup 的空 sentinel 调用 bug
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 01:48

- **任务**：PLAYER-03 — 抽离 source loading 与 HLS 生命周期
- **所属序列**：SEQ-20260406-01
- **结果**：
  - 新增 `src/player/hooks/useSourceLoader.ts`
  - 将 `Player.tsx` 中 `src` 加载、HLS 生命周期、autoplay fallback、retry、cleanup 抽离到独立 hook
  - 保持公开 API 不变，现有 28 个回归测试继续通过
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 02:03

- **任务**：PLAYER-04 — 抽离 progress 与移动端 gesture 输入层
- **所属序列**：SEQ-20260406-01
- **结果**：
  - 新增 `src/player/hooks/useProgressInteractions.ts`
  - 新增 `src/player/hooks/useGestureControls.ts`
  - 将 progress hover/scrub、touch seek、touch volume、double-tap seek 从 `Player.tsx` 抽离到独立输入层 hook
  - 保持公开 API 不变，现有 28 个回归测试继续通过
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 02:12

- **任务**：PLAYER-05 — 抽离系统集成与可移植适配层
- **所属序列**：SEQ-20260406-01
- **结果**：
  - 新增 `src/player/hooks/useChromeVisibility.ts`
  - 新增 `src/player/hooks/useKeyboardShortcuts.ts`
  - 新增 `src/player/hooks/useSystemIntegrations.ts`
  - 将 chrome visibility、keyboard shortcuts、Fullscreen、Media Session、Wake Lock、AirPlay 从 `Player.tsx` 抽离到独立 hook
  - 保持公开 API 不变，现有 28 个回归测试继续通过
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 02:33

- **任务**：PLAYER-06 — 完成薄组装层与移植性验收
- **所属序列**：SEQ-20260406-01
- **结果**：
  - 新增 `src/player/components/EpisodesPanel.tsx`
  - 新增 `src/player/components/SettingsPanel.tsx`
  - 新增 `src/player/components/ProgressBar.tsx`
  - 将 `Player.tsx` 压缩为更薄的组装层，行数由 1437 降到 1010
  - 在 `README.md` 补充“可移植性契约”和最小复制集成清单，明确 React 18 + CSS Modules 即可直接接入
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 14:59

- **任务**：PLAYER-07 — 修复静音提示与加载状态回归
- **所属序列**：SEQ-20260406-02
- **结果**：
  - 修复 `showUnmute` 与真实音频状态不同步：增加 `volumechange` 同步，并在手动音量/静音操作时清理提示
  - 修复 `Tap to unmute` 被 gesture layer 遮挡：将提示层提升到可交互 overlay 层级
  - 修复用户手动切集后的 autoplay block 误静音：为选集切换引入 user-initiated autoplay context，阻止静音 fallback 误触发
  - 修复非原生 HLS 源 loading 期间被 `<video onError>` 误切到 generic error banner
  - `src/test/Player.test.tsx` 扩展到 33 个回归测试，覆盖静音提示同步、层级契约、切集静音、HLS loading/error 分支
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`
