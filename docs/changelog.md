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

## 2026-04-06 15:57

- **任务**：PLAYER-10 — 扩展预览样本为本地 + 在线公共资源
- **所属序列**：SEQ-20260406-03
- **结果**：
  - `src/example.tsx` 的 playlist 改为“本地 MP4、本地 HLS、在线公共 MP4”混合样本
  - 保留本地样本作为网络异常时的稳定兜底
  - 移除开发预览对 `thumbnailTrack` 的必要依赖
  - `dev/settings/App.tsx` 保持使用最稳定的本地 MP4 样本
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run build:preview`

## 2026-04-06 16:05

- **任务**：PLAYER-11 — 替换预览公共样本源为指定媒体列表
- **所属序列**：SEQ-20260406-03
- **结果**：
  - `src/example.tsx` 的在线公共样本源替换为用户提供的 `mediaJSON` 视频列表
  - 保留本地 MP4、本地 HLS 与本地 fallback 资源作为稳定兜底
  - 继续保持开发预览不依赖 `thumbnailTrack`
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run build:preview`

## 2026-04-06 16:22

- **任务**：PLAYER-12 — 引入布局决策层与布局契约测试
- **所属序列**：SEQ-20260406-04
- **结果**：
  - 新增 `src/player/hooks/useLayoutDecision.ts`，统一输出布局模式、隐藏控件、slot 决策和 panel placement
  - `Player.tsx` 开始消费布局决策：根节点暴露 `data-layout-mode`，volume / episodes / theater / chapter / top chrome 不再只依赖散落条件和 CSS 媒体查询
  - `SettingsPanel` 与 `EpisodesPanel` 新增 placement 契约，compact/mobile 模式下切换到 top-right 锚点
  - `src/test/Player.test.tsx` 扩展到 36 个回归测试，覆盖 desktop-default、desktop-compact、mobile-portrait 的布局契约
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 16:31

- **任务**：PLAYER-13 — 引入 overlay 管理层与命中优先级契约
- **所属序列**：SEQ-20260406-04
- **结果**：
  - 新增 `src/player/hooks/useOverlayManager.ts`，统一生成 overlay 条目、优先级、交互性和 gesture 阻断规则
  - `Player.tsx` 开始消费 overlay manager：根节点输出 `data-overlay-top` / `data-overlay-gestures-blocked`，gesture layer 也暴露阻断状态
  - `useGestureControls` 接入统一的 gesture blocking 契约，不再在 blocking overlay 存在时继续响应点击和触摸
  - `src/test/Player.test.tsx` 扩展到 39 个回归测试，覆盖 settings / unmute prompt / error 的 overlay 优先级与手势阻断契约
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 16:35

- **任务**：PLAYER-14 — 引入输入路由层并收回整屏手势捕获
- **所属序列**：SEQ-20260406-04
- **结果**：
  - 新增 `src/player/hooks/useInputRouter.ts`，统一生成 gesture zones 与 gesture surface 配置
  - `Player.tsx` 已从整屏透明 `gesture layer` 过渡到分区 `gesture surface`，显式渲染 `left / center / right` 路由区域
  - `useGestureControls` 现在消费路由 zone，不再依赖整屏落点推断 seek 方向
  - `src/test/Player.test.tsx` 扩展到 41 个回归测试，覆盖 desktop/mobile 的 input zones 契约与右侧 zone 双击 seek
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 16:49

- **任务**：PLAYER-15 — 以 slot 为中心重组视图层
- **所属序列**：SEQ-20260406-04
- **结果**：
  - 新增 `src/player/components/ControlSlot.tsx`，让视图层按 `slot` 渲染控件容器
  - `useLayoutDecision` 导出 `ControlId` / `ControlSlot` 类型，`Player.tsx` 改为通过 `renderControl` 消费 `layoutDecision.slots`
  - 顶部与底部控件已从固定 left/right chrome 结构收敛为 `top-right / bottom-left / bottom-right` slot 组合
  - `src/test/Player.test.tsx` 扩展到 43 个回归测试，新增 default/compact 下的 slot 组合契约
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 17:06

- **任务**：PLAYER-16 — 修复顶部迁移控件命中与 settings 切换契约
- **所属序列**：SEQ-20260406-05
- **结果**：
  - `Player.tsx` 为顶部 slot 控件引入显式交互契约：根节点输出 `data-top-controls-interactive`，gesture surface 在顶部控件存在时下移，避免 compact/mobile 下 top-right 控件被手势面覆盖
  - settings outside-click 逻辑已排除 settings 按钮自身，修复再次点击按钮时的关闭竞争
  - 恢复 bottom-left 的 `next + episodes` 组合容器，修复控制栏选集按钮在 slot 重组后失去 reveal / hover 交互的问题
  - `src/test/Player.test.tsx` 扩展到 45 个回归测试，新增顶部交互契约、next/episodes 组合存在性、settings 二次点击关闭验证
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 17:10

- **任务**：PLAYER-17 — 修复底部控件顺序与 tooltip 边缘裁切
- **所属序列**：SEQ-20260406-06
- **结果**：
  - `Player.tsx` 恢复 bottom-left 的真实渲染顺序为 `play -> next/episodes group -> trailing controls`，修复播放键与下一集键顺序颠倒
  - `Player.module.css` 将 tooltip 边缘钉住规则从 `play/fullscreen` 特例改为基于 `data-control-slot` 的左右槽位通用规则，避免边缘按钮提示被播放器边界裁切
  - `src/test/Player.test.tsx` 扩展到 46 个回归测试，新增 bottom-left 子元素顺序契约验证
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 17:14

- **任务**：PLAYER-18 — 输出重构后差距清单与决策矩阵
- **所属序列**：SEQ-20260406-07
- **结果**：
  - 新增 `docs/player-post-refactor-gap-audit.md`，系统盘点当前播放器在完成布局/overlay/input/slot 重构后，和 YouTube 级桌面/移动交互仍存在的差距
  - 将差距明确拆分为 `targeted bugfix / narrow improvement` 与 `下一阶段架构调整` 两类，避免已解决的架构问题重新混入下一轮决策
  - 输出建议执行顺序：先做 `Focused Hardening`，再进入 `Next Architecture Iteration`
  - 本次为纯文档任务，未运行 `typecheck/lint/test/build`

## 2026-04-06 17:18

- **任务**：PLAYER-19 — 输出多终端播放器交互策略草案
- **所属序列**：SEQ-20260406-08
- **结果**：
  - 新增 `docs/player-device-interaction-strategy.md`，定义桌面、大尺寸平板、小尺寸手机三类终端的交互目标、输入模型、控件优先级和折叠策略
  - 明确 `episodes` 在本项目中的产品地位高于普通附加按钮，尤其在手机端和平板端应作为核心内容导航入口处理
  - 给出面向后续开发的近期开产品决策建议，包括手机端 `next` 是否常驻、是否恢复双击左右 seek、是否保留移动端伪音量手势等
  - 本次为纯文档任务，未运行 `typecheck/lint/test/build`

## 2026-04-06 17:32

- **任务**：PLAYER-20 — 对齐手机端入口与手势策略
- **所属序列**：SEQ-20260406-09
- **结果**：
  - `useLayoutDecision` 已调整手机端 slot 策略：`episodes` 升入 `top-right` 显式入口，底部仅保留 `play` 与 `fullscreen` 作为主控制
  - `useInputRouter` 已为 `mobile-portrait` 恢复左右 gesture zones，使手机端支持左右双击 seek
  - `useGestureControls` 已新增移动端伪音量手势禁用逻辑，不再在 coarse pointer 模式下把右侧纵向滑动解释为音量控制
  - `src/test/Player.test.tsx` 扩展到 48 个回归测试，新增手机端 `episodes` 入口、portrait 三分区输入、portrait 右侧双击 seek 与移动端禁用伪音量手势验证
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 17:35

- **任务**：PLAYER-21 — 收口移动端 safe-area 与 panel/chrome 兼容
- **所属序列**：SEQ-20260406-09
- **结果**：
  - `Player.module.css` 已为 player root 增加统一的 `--ytp-safe-*` 变量，并将 top/bottom chrome 的 padding 与左右边距接入安全区避让
  - settings / episodes 面板已接入 top-right 安全区偏移，并增加基于可用高度的 `max-height` 约束，减少异形屏和 fullscreen 下贴边或过高的问题
  - fullscreen 下 panel 高度限制已统一收口，不再只对 bottom chrome 单独补 `safe-area-inset-bottom`
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`
