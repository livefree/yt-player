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

## 2026-04-06 17:49

- **任务**：PLAYER-22 — 补强 panel keyboard focus 与可访问性语义
- **所属序列**：SEQ-20260406-09
- **结果**：
  - `src/player/components/Button.tsx` 已改为 `forwardRef`，`Player.tsx` 能在 settings / episodes 面板关闭后把焦点稳定还给触发按钮
  - `src/player/components/SettingsPanel.tsx` 与 `src/player/components/EpisodesPanel.tsx` 在打开后会主动把焦点送入面板内容，并支持 `Escape` 关闭
  - settings 菜单项与面板头部返回项已补齐 `Space` 键激活，episodes 项在聚焦时会同步当前焦点态，形成更完整的键盘交互路径
  - `src/test/Player.test.tsx` 扩展到 50 个回归测试，新增 settings / episodes 的焦点进入、`Escape` 关闭和焦点回落覆盖
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 19:09

- **任务**：PLAYER-23 — 细化 loading / buffering / fatal error 状态
- **所属序列**：SEQ-20260406-09
- **结果**：
  - `src/player/Player.tsx` 已将播放器 loading 表达从单一布尔值收敛为 `initial / buffering / idle` 三态，并通过 `data-loading-state` 暴露给视图和测试
  - `src/player/hooks/useSourceLoader.ts` 在切源、重试和 HLS fatal error 路径上同步更新 loading state，避免把 fatal error 和过渡态混在一起
  - `src/player/hooks/useOverlayManager.ts` 与 `src/player/components/Spinner.tsx` 已接入三态 loading；spinner 在 initial/buffering 下会给出不同的可访问性标签和提示文案
  - `src/test/Player.test.tsx` 扩展到 51 个回归测试，新增 initial -> buffering -> idle 状态流验证，并覆盖 direct source error 会从 buffering 回落到 idle + error banner
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 19:16

- **任务**：PLAYER-24 — 补齐 controls / panel 语义与 focus-visible 反馈
- **所属序列**：SEQ-20260406-09
- **结果**：
  - `src/player/Player.tsx` 已为 settings / episodes 触发器补齐 `aria-haspopup="dialog"`、`aria-expanded` 和 `aria-controls`，并为对应 panel 分配稳定 id
  - `src/player/components/SettingsPanel.tsx` 与 `src/player/components/EpisodesPanel.tsx` 已接入 `panelId`，dialog 语义现在和触发器形成明确关系
  - `src/player/Player.module.css` 已为 menu header、menu item、episode item 和 unmute button 补充 `focus-visible` 视觉反馈，键盘导航时的命中位置更清晰
  - `src/test/Player.test.tsx` 扩展到 53 个回归测试，新增 settings / episodes trigger 与 panel 的 aria 关系覆盖
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 19:32

- **任务**：PLAYER-25 — 补全 panel 内 keyboard traversal 与 roving focus
- **所属序列**：SEQ-20260406-09
- **结果**：
  - `src/player/components/SettingsPanel.tsx` 已为 panel 内 menu items 建立本地 keyboard traversal：支持 `ArrowUp/ArrowDown/Home/End/Tab`，并通过 focus trap 保持面板内循环
  - `src/player/components/EpisodesPanel.tsx` 已补充本地 `Tab` 循环和 button 级 `Home/End/Enter/Space` 处理，为 episodes 面板提供更完整的键盘入口
  - `src/test/Player.test.tsx` 现在包含 settings panel traversal 回归，整体测试数为 54
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 19:47

- **任务**：PLAYER-26 — 输出系统集成支持矩阵与降级契约
- **所属序列**：SEQ-20260406-10
- **结果**：
  - 新增 [`docs/player-system-integration-matrix.md`](/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md)，系统整理 Fullscreen / PiP / Media Session / Wake Lock / AirPlay / HLS / Orientation lock 的当前支持边界
  - 文档明确了每项能力的检测方式、预期环境、可见行为、降级契约和宿主应用表述建议
  - 文档额外给出推荐 QA 矩阵，便于后续在桌面 Chromium / Safari、iPhone Safari、iPad Safari、Android Chrome 下统一验证
  - 本次为纯文档任务，未运行 `typecheck/lint/test/build`

## 2026-04-06 19:46

- **任务**：PLAYER-27 — 为布局决策引入约束驱动和基础 collapse policy
- **所属序列**：SEQ-20260406-11
- **结果**：
  - `src/player/hooks/useLayoutDecision.ts` 已新增 `constraints` 与 `density` 输出，把布局决策从离散 `layout mode` 扩展为宽度/高度约束驱动
  - 桌面端已建立第一层基础 collapse policy：在 `condensed/collapsed` 下收起 `chapter/theater`，并把 `settings/episodes` 提升到 `top-right`
  - `src/player/Player.tsx` 已通过 `data-layout-density`、`data-layout-width`、`data-layout-height` 暴露当前布局约束，便于视图层和测试消费
  - `src/test/Player.test.tsx` 已补充 desktop short-height / narrow-width 布局契约测试，当前回归测试总数为 56
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 20:09

- **任务**：PLAYER-28 — 扩展桌面端 control priority / collapse policy
- **所属序列**：SEQ-20260406-12
- **结果**：
  - `src/player/hooks/useLayoutDecision.ts` 已新增 `profile` 输出，并将桌面端布局收口从单一 `density` 升级为 `default / short-height / medium-width / narrow-width` 四类 profile
  - 桌面端现在统一从同一组基础 slots 出发，再按尺寸特化策略应用差异化优先级：`short-height` 保留音量但移除 `theater`，`medium-width` 收起音量但保留 `theater`，`narrow-width` 再进一步收起 `airplay/pip`
  - `src/player/Player.tsx` 已通过 `data-layout-profile` 暴露当前布局 profile，便于视图层和测试消费
  - `src/test/Player.test.tsx` 已补充 `medium-width / short-height` 差异契约测试，当前回归测试总数为 57
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 20:19

- **任务**：PLAYER-29 — 为 gesture surface 引入显式 input intent
- **所属序列**：SEQ-20260406-13
- **结果**：
  - `src/player/hooks/useInputRouter.ts` 已从纯 zone 生成器升级为显式输入路由，当前会输出 `intent` 与 `devicePolicy`
  - `src/player/hooks/useGestureControls.ts` 已改为直接消费 route `intent`，手势点击不再依赖 zone 自行推断 reveal / seek / toggle
  - `src/player/Player.tsx` 已将 route 元数据暴露为 `data-input-intent`、`data-input-device-policy`，便于测试和后续 intent graph 扩展
  - `src/test/Player.test.tsx` 已补充 desktop/mobile device policy、三区 intent、chrome hidden -> reveal intent 的契约测试，当前回归测试总数为 58
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 21:36

- **任务**：PLAYER-30 — 引入 mobile-first interaction / chrome policy
- **所属序列**：SEQ-20260406-14
- **结果**：
  - `src/player/hooks/useLayoutDecision.ts` 已新增 `interactionPolicy` 与 `chromePolicy` 输出，把 `desktop-pointer / tablet-touch / phone-touch` 与 `hover-autohide / touch-persistent-paused` 收口为显式策略
  - `src/player/hooks/useChromeVisibility.ts` 已接入 `chromePolicy` 与 `isPlaying`，手机端暂停态会保持 chrome 可见，播放后再进入自动隐藏
  - `src/player/hooks/useInputRouter.ts` 已改为消费 `interactionPolicy`，不再继续从 `layoutMode` 间接推断触摸设备策略
  - `src/player/Player.tsx` 已通过 `data-interaction-policy` 与 `data-chrome-policy` 暴露移动端策略元数据
  - `src/test/Player.test.tsx` 已补充 phone-touch policy 与暂停态 chrome 可见的契约测试，当前回归测试总数为 59
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 21:45

- **任务**：PLAYER-31 — 分化 tablet / phone 的 touch 控件入口
- **所属序列**：SEQ-20260406-15
- **结果**：
  - `src/player/hooks/useLayoutDecision.ts` 已拆分 `createTabletTouchSlots` 与 `createPhoneTouchSlots`，让平板与手机不再共享同一组 touch 控件入口
  - 平板端现在显式保留 `episodes/settings/subtitles` 顶部入口和 `time` 底部展示；手机端则收缩为 `episodes/settings` 顶部入口，把字幕切回设置面板二级入口
  - `src/test/Player.test.tsx` 已补充 phone-touch 与 tablet-touch 的差异契约测试，当前回归测试总数为 60
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-06 23:44

- **任务**：PLAYER-32 — 提升 phone-touch 的 episodes 到底部主控区
- **所属序列**：SEQ-20260406-16
- **结果**：
  - `src/player/hooks/useLayoutDecision.ts` 已将 `phone-touch` 的 `episodes` 从顶部动作区迁到底部右侧主控区，同时保留顶部 `settings`
  - `src/player/hooks/useLayoutDecision.ts` 已让 phone-touch 下的 `episodesPanel` placement 跟随入口切换到 `bottom-right`
  - `src/player/Player.module.css` 已补充 `ytpEpisodesPanel[data-placement="bottom-right"]`，确保手机端选集面板从右下方弹出
  - `src/test/Player.test.tsx` 已补充 phone-touch 下 `episodes` 入口位置与 panel placement 的契约验证，当前回归测试总数保持 60
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-07 00:06

- **任务**：PLAYER-33 — 分化 tablet / phone 的 chrome visibility policy
- **所属序列**：SEQ-20260406-17
- **结果**：
  - `src/player/hooks/useLayoutDecision.ts` 已将 `tablet-touch` 的 chrome 策略切到 `touch-autohide`，同时保持 `phone-touch` 为 `touch-persistent-paused`
  - `src/player/hooks/useChromeVisibility.ts` 继续复用统一策略入口，但现在会按终端策略区分平板与手机暂停态行为
  - `src/test/Player.test.tsx` 已补充 tablet-touch 的 `touch-autohide` 契约，并验证暂停态下平板可进入 `ytpAutohide`，当前回归测试总数为 61
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`

## 2026-04-07 00:23

- **任务**：PLAYER-34 — 为 tablet-touch 引入更长的 autohide delay
- **所属序列**：SEQ-20260406-18
- **结果**：
  - `src/player/utils/format.ts` 已新增 `TOUCH_CHROME_HIDE_DELAY`，为触摸自动隐藏策略提供独立时序常量
  - `src/player/hooks/useChromeVisibility.ts` 已让 `touch-autohide` 使用更长的自动隐藏延迟，不再与桌面的 2s 节奏完全一致
  - `src/test/Player.test.tsx` 已补充 tablet-touch 延迟契约，并增加 desktop pointer 的对照测试，当前回归测试总数为 62
  - 验证通过：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`
# 2026-04-07 04:40

- 完成 `SEQ-20260407-26 / PLAYER-43`
- 顶部 chrome 改为明确的 top row，新增 `tooltipPlacement` contract 与 `data-top-controls-anchor / data-top-tooltip-placement`
- top slot controls 的 tooltip 现在默认向下展开，适配小窗口和过渡宽度

# 2026-04-07 04:43

- 完成 `SEQ-20260407-26 / PLAYER-44`
- episodes panel 现在按 `viewportBand` 调整列数、最大高度和底部偏移，在 phone-portrait / narrow 下成为更稳定的滚动窗口
- 新增 `data-viewport-band` 与对应 contract 测试，回归测试扩到 73 个

# 2026-04-07 04:32

- 完成 `SEQ-20260407-26 / PLAYER-42`
- 布局层新增连续 `viewportBand` contract，覆盖 `wide / medium / compact / narrow / phone-portrait`
- 新增 `compact-width` profile 与 `data-layout-band` 观察点，为后续 responsive 收口提供统一基线
- 回归测试扩到 71 个，补充了连续宽度带的布局契约

# 2026-04-07 02:02

- 新增 `SEQ-20260407-26`，将最新实机反馈整理为新的连续响应式任务序列
- 当前序列覆盖：顶部按钮贴顶与 tooltip、自适应 episodes panel、一级 speed control、panel 视觉 token、手机竖屏主控重排，以及 settings 面板信息架构规划
- 本次为任务规划，未改代码

# 2026-04-07 01:53

- 完成 `SEQ-20260407-25 / PLAYER-41`
- 新增 `docs/player-refactor-status-report.md`，汇总当前支线的重构完成度、架构状态、已修问题与剩余差距
- 新增 `docs/player-feature-matrix.md`，整理 Desktop Pointer / Tablet Touch / Phone Touch 下的预期功能表现矩阵

# 2026-04-07 01:51

- 完成 `SEQ-20260407-24 / PLAYER-40`
- overlay orchestration 新增统一 `overlayLayout` contract，将 `stackMode / captionPlacement / promptPlacement` 收口为单个布局对象
- `Player` 已改为消费 `overlayLayout`，并新增统一 `data-overlay-layout` 观察点
- 回归测试维持 70 个，新增了 `data-overlay-layout` 契约覆盖

# 2026-04-07 01:25

- 完成 `SEQ-20260407-23 / PLAYER-39`
- overlay orchestration 新增显式 `stackMode`，统一输出 `idle / playback-feedback / loading / prompt / panel / error`
- panel 打开时 `unmute prompt` 现在会被 stack 规则抑制；loading stack 会抑制 `bezel / seek-indicator / touch-seek`
- 回归测试扩到 70 个，补充了 panel 抑制 prompt 与 loading stack 的契约

# 2026-04-07 01:10

- 完成 `SEQ-20260407-22 / PLAYER-38`
- overlay orchestration 将 `promptPlacement` 扩展为三态，top-right panel 打开时 unmute prompt 会切到左侧下方
- 这一步开始处理 top overlays 的横向编排，不再只做纵向下移
- 回归测试扩到 68 个，补充了 top-right panel 冲突下 prompt 切左的契约

# 2026-04-07 00:56

- 完成 `SEQ-20260407-21 / PLAYER-37`
- overlay orchestration 新增 `promptPlacement`，unmute prompt 会根据 top chrome / top panel 占位在 `top-edge` 与 `below-top-chrome` 间切换
- `Player` 已暴露 `data-overlay-prompt-placement`，phone-touch 等顶部空间紧张场景下会主动下移 prompt
- 回归测试扩到 67 个，补充了 desktop 默认 prompt placement 与 phone-touch 下移契约

# 2026-04-07 00:39

- 完成 `SEQ-20260407-20 / PLAYER-36`
- 将 overlay manager 推进到第一层 orchestration，新增 caption placement，并在 fatal error / blocking panel 场景下抑制瞬时 overlay
- `Player` 已暴露 `data-overlay-caption-placement`，字幕支持 `default / above-chrome / raised-for-bottom-overlay`
- 回归测试扩到 66 个，补充了 phone / tablet 的 caption placement 与 fatal error 抑制 spinner 契约

# 2026-04-07 00:31

- 完成 `SEQ-20260407-19 / PLAYER-35`
- 将 chrome visibility 从字符串分支升级为显式 policy object，布局层现在统一输出 `id / pausedBehavior / hideDelayMs / hideCursorOnAutohide`
- `useChromeVisibility` 已改为直接消费 policy object，`Player` 暴露 `data-chrome-pause-behavior` 与 `data-chrome-hide-delay`
- 回归测试扩到 63 个，补充了 desktop / tablet / phone / immersive 的 chrome policy 契约

# 2026-04-07 13:13

- 完成 `SEQ-20260407-26 / PLAYER-45`
- 将 speed 从 settings 二级菜单提升为一级控制，桌面与触摸布局都新增了显式 `speed-btn`
- 新增独立 `SpeedPanel`，提供 `0.25x-3x` 水平 slider、4 个常用 preset，以及 `[` / `]` 快捷键到 `3x` 的契约
- 回归测试扩到 76 个，补充了一级 speed control、touch layout 可见性与 slider / keyboard 速度调整的覆盖

# 2026-04-07 13:16

- 完成 `SEQ-20260407-26 / PLAYER-46`
- 新增共享 `ytpPanelSurface` 与 `--ytp-panel-*` token，统一 settings / speed / episodes 面板的背景、圆角、阴影、主次文本色与 hover / active surface
- 三类面板不再各自硬编码视觉参数，后续 panel 体系可在统一 token 上继续演进
- 回归测试扩到 77 个，补充了共享 panel surface contract

# 2026-04-07 13:19

- 完成 `SEQ-20260407-26 / PLAYER-47`
- `phone-touch` 布局已将 `play` / `next` 迁移到中央 `center-overlay` 主控区，底部左侧回归时间展示
- 中央主控区已接入 autohide 契约，手机竖屏最窄场景下会出现更强的播放主控和显式 next 入口
- 回归测试扩到 78 个，补充了 phone-touch 中央主控与 next 入口布局覆盖

# 2026-04-07 13:22

- 完成 `SEQ-20260407-26 / PLAYER-48`
- 新增 `docs/player-settings-ia-plan.md`，定义 speed 移出后的 settings 信息架构
- 文档已明确 `Playback / Captions / Quality / Audio-Language` 的建议分组，并把 `Loop / Autoplay next / Sleep timer / Caption styling` 定为后续优先项
- `SEQ-20260407-26` 至此整体完成

# 2026-04-07 13:30

- 新增 `SEQ-20260407-27`
- 第二轮收口聚焦 5 个问题：speed 按钮稳定宽度、speed panel 紧凑化、统一弹窗遮挡约束、顶部控件间距、phone-touch 的 `next` 右侧布局

# 2026-04-07 13:49

- 完成 `SEQ-20260407-27 / PLAYER-49`
- speed button 数值已统一为两位小数，按钮本体改为固定宽度并使用 tabular-nums，避免速度变化时宽度跳动
- 回归测试扩到 79 个，补充了 speed badge 固定格式契约

# 2026-04-07 13:50

- 完成 `SEQ-20260407-27 / PLAYER-50`
- speed panel 已压成更紧凑形态：去掉冗余标题/说明文案，当前倍速改为置顶居中显示
- speed slider 已切到与 volume slider 一致的轨道 / fill / handle 视觉语言，快捷键提示改为 hover tooltip
- 回归测试扩到 80 个，补充了 compact speed panel 契约

# 2026-04-07 13:53

- 完成 `SEQ-20260407-27 / PLAYER-51`
- settings / speed / episodes 已统一接入 compact / narrow / phone-portrait 的 popup 约束，包含底部抬升、顶部偏移和高度限制
- settings / speed 面板现在也具备稳定的内部滚动契约，不再只靠外层固定盒子
- 回归测试扩到 82 个，补充了 speed / settings 的 shared popup contract

# 2026-04-07 13:55

- 完成 `SEQ-20260407-27 / PLAYER-52 / PLAYER-53`
- top-right controls 在 compact / narrow / phone-portrait 下已收口到明确的间距与不收缩 contract，避免按钮命中区互相重叠
- phone-touch 的 `next` 已从中央主控区迁移到右侧 controls，中央保留放大的 `play` 主控
- `SEQ-20260407-27` 至此整体完成

# 2026-04-07 14:05

- 新增 `SEQ-20260407-28`
- 第三轮修正聚焦 4 个问题：speed panel 居中与紧凑度、统一弹窗滚动壳层与底部安全间隔、step 按钮替代旧快捷键气泡、小屏 speed 图标收敛

# 2026-04-07 14:13

- 完成 `SEQ-20260407-28 / PLAYER-54 / PLAYER-55 / PLAYER-56 / PLAYER-57`
- speed panel 已移除遮挡主值的旧快捷键气泡，改为 slider 两侧 `-` / `+` step 按钮，并继续收口主值与 slider 的居中布局
- settings / speed / episodes 统一切到 `panel shell + inner scroller` 契约，滚动条不再直接切掉圆角外观，小窗口下底边与控制栏/进度条保持更明确的安全间隔
- compact / narrow / phone-portrait 下的 speed button 已改为 numeric-only，避免小屏空间继续被图标挤占

# 2026-04-07 14:22

- 新增 `SEQ-20260407-29`
- 本轮继续收口两个问题：小屏 speed panel 去除主值标题，以及 PC 过渡宽度下 speed panel 的自适应尺寸防抖

# 2026-04-07 14:19

- 完成 `SEQ-20260407-29 / PLAYER-58 / PLAYER-59`
- `compact / narrow / phone-portrait` 下的 speed panel 已隐藏当前倍速标题，仅保留 slider 与 preset，进一步去除小屏冗余
- speed panel 宽度策略已改为优先固定宽度、仅在空间不足时收缩，避免 PC 过渡尺寸下随容器变宽出现明显空白膨胀

# 2026-04-07 14:32

- 新增 `SEQ-20260407-30`
- 本轮进入架构清债：收回 speed 展示策略到 layout decision，并把 panel 尺寸表达继续提升为显式契约

# 2026-04-07 14:33

- 完成 `SEQ-20260407-30 / PLAYER-60 / PLAYER-61`
- `speed` 图标显隐、speed panel 标题显隐，以及 episodes panel 列数/高度已并回 `useLayoutDecision`，视图层不再直接枚举 compact/narrow/phone-portrait
- settings / speed / episodes 已统一暴露 `data-panel-sizing`，panel 的小窗口间距与尺寸表达开始从局部 CSS 规则升级为显式契约
