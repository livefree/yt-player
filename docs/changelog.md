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

## 2026-04-06 15:16

- **任务**：PLAYER-08 — 制定播放器自适应布局与命中系统重构计划
- **所属序列**：SEQ-20260406-02
- **结果**：
  - 新增 `docs/player-adaptive-layout-and-hit-testing-plan.md`
  - 明确了当前播放器与 YouTube 级交互架构在布局层、输入路由层、overlay 管理层上的根本差异
  - 制定了目标架构、命中规则、响应式布局策略、分阶段迁移路线与文件结构方向
  - 显式写入“禁止补丁式修复”和“持续审查架构偏航”的工程约束
  - 本次为文档任务，未运行 `typecheck/lint/test/build`

## 2026-04-06 15:49

- **任务**：PLAYER-09 — 修复开发测试页样本媒体环境
- **所属序列**：SEQ-20260406-03
- **结果**：
  - 新增本地样本媒体资源：`public/samples/local-demo.mp4`、`public/samples/hls/local-demo.m3u8`、封面图与 4 张缩略图
  - 新增 `public/samples/local-demo-thumbnails.vtt`
  - `src/example.tsx` 的预览 playlist 切换为本地 MP4/HLS 样本，不再依赖外部公开视频
  - `dev/settings/App.tsx` 切换为本地样本资源
  - `vite.config.ts` 增加 `publicDir` 指向项目根 `public/`，修复 `dev` / `build:preview` 对本地样本资源的解析
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run build:preview`
