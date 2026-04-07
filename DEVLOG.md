# DEVLOG — yt-player

## 2026-03-17 Phase 1：HLS 支持 + IIFE 构建

### 背景
LibreTV 项目需要将 YTPlayer 集成进其 Vanilla JS 播放器页面，替换原有的 ArtPlayer。
整合方式：IIFE bundle（含 React），通过 `<script>` 标签直接引用。

### 本阶段工作
- **HLS.js 支持**：YTPlayer 原先直接 `video.src = src`，不支持非 Safari 浏览器的 m3u8 流。
  需在 `Player.tsx` 的 src useEffect 中添加 HLS.js 回退逻辑。
- **IIFE 构建**：新增 `vite.iife.config.ts`，构建包含 React 的独立 bundle，
  供 Vanilla JS 页面通过全局变量 `window.YTPlayerLib` 使用。

### 关键决策
- HLS.js 使用动态 `import('hls.js')` 按需加载，避免增大非 m3u8 场景的 bundle 体积
- IIFE 入口使用独立的 `src/iife-entry.ts`，同时暴露 `React`、`ReactDOM`（来自 react-dom/client）和 `YTPlayer`
- 不修改现有 `tsup.config.ts`，两套构建互不干扰

### 完成情况（2026-03-17）
- `Player.tsx`：添加 `hlsRef`，src useEffect 改为 HLS-aware，cleanup useEffect 销毁 HLS 实例
- `src/iife-entry.ts`：新建，暴露 `{ YTPlayer, React, ReactDOM }`
- `vite.iife.config.ts`：新建，IIFE bundle 配置
- `package.json`：添加 `build:iife` 脚本，hls.js 进入 dependencies
- `README.md`：新增 HLS 特性说明、build:iife 命令、独立 bundle 使用章节

### 遗留问题
- HLS.js 广告过滤（LibreTV 原有功能）暂不在 YTPlayer 内实现，第二阶段再评估

## 2026-04-06 播放器治理规划：高移植优先

### 背景
- 当前 `Player.tsx` 同时承担媒体状态、源加载、平台适配、手势输入和视图渲染，后续继续叠加功能会放大回归风险。
- 新要求是确保播放器具备高移植性：`src/player/` 应能直接复制到其他 React 18 项目中使用，保持即插即用。

### 本次产出
- 新增 `docs/player-refactor-plan.md`
- 明确“可移植性优先”的治理原则、阶段划分、执行顺序和完成标准

### 关键决策
- 不做一次性重写，先补测试，再逐步抽离副作用
- 拆分依据是职责边界，不是文件体积
- 所有重构保持 `src/player/` 内部自闭合，不引入宿主项目依赖
- 移动端交互单独作为输入层治理，不再继续与桌面事件混写

### 下一步
- 先执行 Phase 0：补回归测试和支持矩阵
- 再执行 Phase 1：优先抽 `useSourceLoader`

## 2026-04-06 任务登记：播放器治理序列初始化

### 背景
- `task.md` 的规则已改为统一用“任务序列 + 任务列表”管理执行计划。
- 当前需要把播放器治理工作正式登记为可执行序列，避免后续实现脱离任务流。

### 本次变更
- 在 `task.md` 末尾追加 `SEQ-20260406-01`
- 将播放器治理路线拆分为 `PLAYER-01` 至 `PLAYER-06`
- 将已完成的规划文档登记为 `PLAYER-01`

### 说明
- 当前序列状态保持为 `🟡 规划中`
- 后续进入实际实现前，应将对应任务改为 `🔄` 并填写 `实际开始时间`

## 2026-04-06 任务启动：PLAYER-02 回归测试补强

### 本次变更
- 将 `SEQ-20260406-01` 状态更新为 `🔄 执行中`
- 将 `PLAYER-02` 更新为 `🔄`
- 新增 `docs/tasks.md` 作为单任务工作台
- 新增 `docs/changelog.md` 作为后续完成记录入口

### 当前目标
- 优先补 source loading、HLS/autoplay fallback、progress/gesture、cleanup 的回归测试
- 为后续 `useSourceLoader` 和输入层拆分建立稳定保护网

### 进行中发现
- `Screen Wake Lock` cleanup 存在空 sentinel 场景 bug：`wakeLockRef.current?.release().catch(...)` 在 `current` 为空时会落成 `undefined.catch(...)`
- 已在 `Player.tsx` 中修正为先取局部 sentinel，再安全调用 `release().catch(...)`

### 完成情况（2026-04-06 01:44）
- `src/test/Player.test.tsx` 扩展到 28 个回归测试
- 覆盖 source loading、HLS 生命周期、autoplay fallback、progress click / touch scrub、gesture seek、settings / episodes 面板
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-03 抽离 source loading

### 本次变更
- 将 `PLAYER-03` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-03` 单任务工作台

### 当前目标
- 将 `src` 加载、HLS 生命周期、autoplay fallback、retry、cleanup 抽离到独立 hook
- 保持 `YTPlayer` 对外 API 和回归测试行为不变

### 完成情况（2026-04-06 01:48）
- 新增 `src/player/hooks/useSourceLoader.ts`
- `Player.tsx` 不再直接持有 HLS 初始化、source 切换 reset、autoplay fallback 和 retry 细节
- `retry` 按钮改为调用 hook 暴露的方法，保持行为不变
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-04 抽离 progress 与 gesture 输入层

### 本次变更
- 将 `PLAYER-04` 更新为 `🔄`

### 当前目标
- 抽离 progress hover / scrub 与移动端 gesture / double-tap 输入层
- 保持现有 UI、公开 API 和回归测试行为不变

### 完成情况（2026-04-06 02:03）
- 新增 `src/player/hooks/useProgressInteractions.ts`
- 新增 `src/player/hooks/useGestureControls.ts`
- `Player.tsx` 不再直接持有 progress hover/scrub、touch seek、touch volume、double-tap seek 的核心状态机
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-05 抽离系统集成层

### 本次变更
- 将 `PLAYER-05` 更新为 `🔄`

### 当前目标
- 抽离 chrome visibility、keyboard shortcut 和系统平台集成层
- 保持现有 UI、公开 API 和回归测试行为不变

### 完成情况（2026-04-06 02:12）
- 新增 `src/player/hooks/useChromeVisibility.ts`
- 新增 `src/player/hooks/useKeyboardShortcuts.ts`
- 新增 `src/player/hooks/useSystemIntegrations.ts`
- `Player.tsx` 不再直接持有 chrome visibility、keyboard shortcut、Fullscreen、Media Session、Wake Lock、AirPlay 的核心副作用
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-06 薄组装层与移植性验收

### 本次变更
- 将 `PLAYER-06` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-06` 单任务工作台

### 当前目标
- 将 `Player.tsx` 里最重的视图块抽成内部组件，压缩为更清晰的组装层
- 补充 README 的移植性契约，明确复制 `src/player/` 到其他 React 18 项目的最小集成要求

### 完成情况（2026-04-06 02:33）
- 新增 `src/player/components/EpisodesPanel.tsx`
- 新增 `src/player/components/SettingsPanel.tsx`
- 新增 `src/player/components/ProgressBar.tsx`
- `Player.tsx` 行数由 1437 降到 1010，职责进一步收敛为 props 解析、hook 组合和视图组装
- `README.md` 补充“可移植性契约”和最小复制集成说明，明确宿主只需 React 18 + CSS Modules
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-07 静音提示与加载状态回归修复

### 本次变更
- 追加 `SEQ-20260406-02`
- 将 `PLAYER-07` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-07` 单任务工作台

### 当前目标
- 修复 `showUnmute` 与真实音频状态不同步的问题
- 修复 `Tap to unmute` 提示层与 gesture layer 的命中冲突
- 修复切集后误静音，以及 loading / error 层误切换
- 补齐对应回归测试

### 完成情况（2026-04-06 14:59）
- `showUnmute` 改为在真实 `volumechange` 上同步清理，并在手动音量/静音操作时立即失效
- `Tap to unmute` 提示层提升到高于 gesture layer 的可交互 overlay 层级
- 选集切换引入 user-initiated autoplay context，避免 autoplay block 走静音 fallback
- 非原生 HLS 源在 loading 阶段忽略 `<video onError>` 的 generic error banner 分支，由 HLS fatal error 路径接管
- `src/test/Player.test.tsx` 扩展到 33 个回归测试
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-08 自适应布局与命中系统重构计划

### 本次变更
- 将 `PLAYER-08` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-08` 单任务工作台

### 当前目标
- 单独编写“自适应布局与命中系统”重构方案文档
- 细化与 YouTube 的交互架构层级差异
- 明确禁止补丁式修复、架构偏航审查与阶段性落地原则

### 完成情况（2026-04-06 15:16）
- 新增 `docs/player-adaptive-layout-and-hit-testing-plan.md`
- 文档从布局决策层、输入路由层、overlay 管理层、状态模型、响应式策略和迁移阶段等角度，明确了后续重构目标
- 明确写入：不可为了修 bug 走补丁路线、不可通过散装 z-index / pointer-events / 布尔状态继续侵蚀架构
- 增加了未来每次交互改动都必须执行的架构偏航检查清单

## 2026-04-06 任务启动：PLAYER-09 本地测试样本环境修复

### 本次变更
- 追加 `SEQ-20260406-03`
- 将 `PLAYER-09` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-09` 单任务工作台

### 当前目标
- 生成本地可播放的 MP4/HLS/封面/缩略图样本
- 让 `dev/preview` 与 `dev/settings` 默认脱离外部视频源
- 确保后续播放器调试不再受网络与第三方样本可用性影响

### 完成情况（2026-04-06 15:49）
- 生成本地样本资源：`public/samples/local-demo.mp4`、`public/samples/hls/local-demo.m3u8`、封面图与 4 张缩略图
- 新增 `public/samples/local-demo-thumbnails.vtt`
- `src/example.tsx` 和 `dev/settings/App.tsx` 已切换到本地资源
- `vite.config.ts` 已接入根目录 `public/`，确保 `dev` 与 `build:preview` 都能解析样本资源
- `dist-preview/samples/` 已确认包含本地样本媒体
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run build:preview` 全部通过

## 2026-04-06 任务启动：PLAYER-10 扩展预览样本资源

### 本次变更
- 将 `PLAYER-10` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-10` 单任务工作台

### 当前目标
- 将开发预览 playlist 扩展为“本地样本 + 在线公共视频资源”
- 保留本地资源作为网络异常时的兜底样本
- 移除开发预览对 thumbnails 的必要依赖

### 完成情况（2026-04-06 15:57）
- `src/example.tsx` 的 playlist 已扩展为“本地 MP4、本地 HLS、在线公共 MP4”混合样本
- 预览页不再要求 `thumbnailTrack` 才能正常使用
- `dev/settings/App.tsx` 继续使用最稳定的本地 MP4 样本，避免在线资源影响样式调试
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run build:preview` 全部通过

## 2026-04-06 任务启动：PLAYER-11 替换预览公共样本源

### 本次变更
- 将 `PLAYER-11` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-11` 单任务工作台

### 当前目标
- 将开发预览中的公共样本视频源替换为用户提供的 `mediaJSON` 列表
- 保留本地 MP4 / HLS 作为兜底样本
- 继续保持预览页不依赖 thumbnails

### 完成情况（2026-04-06 16:05）
- `src/example.tsx` 的在线公共样本源已替换为用户指定的 `commondatastorage.googleapis.com` 媒体列表
- 继续保留本地 MP4、本地 HLS 与本地 fallback 资源，避免外网样本不可用时完全失去测试能力
- 开发预览页仍然不依赖 `thumbnailTrack`
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run build:preview` 全部通过

## 2026-04-06 任务启动：PLAYER-12 布局决策层与布局契约测试

### 本次变更
- 追加 `SEQ-20260406-04`
- 将 `PLAYER-12` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-12` 单任务工作台

### 当前目标
- 新增布局决策层，统一播放器布局模式、控件可见性与 slot 决策
- 让 `Player.tsx` 开始消费布局决策结果，而不是继续散落在 JSX 和局部条件里
- 补充布局模式与控件可见性的回归测试，为后续 overlay / input router 重构建立基线

### 完成情况（2026-04-06 16:22）
- 新增 `src/player/hooks/useLayoutDecision.ts`，统一生成 `layout mode / hiddenControls / slots / panel placements`
- `Player.tsx` 已开始消费布局决策：根节点输出 `data-layout-mode`，关键控件可见性和 panel placement 不再只由局部条件与 CSS 媒体查询决定
- `SettingsPanel`、`EpisodesPanel` 新增 placement 契约，并在 compact/mobile 模式下锚定到 `top-right`
- `src/test/Player.test.tsx` 扩展到 36 个测试，新增 desktop-default、desktop-compact、mobile-portrait 布局契约验证
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-13 overlay 管理层与命中优先级契约

### 本次变更
- 将 `PLAYER-13` 更新为 `🔄`
- 保持 `SEQ-20260406-04` 作为当前重构主序列

### 当前目标
- 新增 overlay 管理层，统一 spinner、error、prompt、panel、caption、bezel、seek indicator 的可见性、优先级和交互性
- 让 `Player.tsx` 与 gesture 层消费统一的 blocking overlay 规则，而不是继续依赖散落布尔值
- 为 overlay top priority 与 gesture 阻断行为补充回归测试

### 完成情况（2026-04-06 16:31）
- 新增 `src/player/hooks/useOverlayManager.ts`，统一生成 overlay entries、top overlay 和 gesture blocking 状态
- `Player.tsx` 已开始输出 `data-overlay-top` 与 `data-overlay-gestures-blocked`，gesture layer 也同步暴露阻断契约
- `useGestureControls` 已接入统一 blocking overlay 规则，在 settings / episodes / error 等 blocking overlay 存在时不再继续处理手势
- `src/test/Player.test.tsx` 扩展到 39 个测试，新增 settings / unmute prompt / error 的 overlay priority 与 gesture blocking 验证
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-14 输入路由层与手势分区

### 本次变更
- 将 `PLAYER-14` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-14` 单任务工作台

### 当前目标
- 新增输入路由层，显式定义 gesture zones 与命中范围
- 将播放器从整屏透明 gesture layer 收回到分区 gesture surface
- 补充 gesture zones、blocking overlay 和 layout mode 联动的回归测试

### 完成情况（2026-04-06 16:35）
- 新增 `src/player/hooks/useInputRouter.ts`，统一生成 gesture zones、gesture surface 是否禁用和路由元数据
- `Player.tsx` 已从单一整屏 `gesture layer` 切换为分区 `gesture surface`，根据 layout mode 渲染 `left / center / right` 或 `center` 单区
- `useGestureControls` 已改为消费显式 `zone`，seek 方向不再依赖整屏 `clientX` 推断
- `src/test/Player.test.tsx` 扩展到 41 个测试，新增 desktop/mobile input zones 契约与 right zone 双击 seek 覆盖
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-15 slot 视图层重组

### 本次变更
- 将 `PLAYER-15` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-15` 单任务工作台

### 当前目标
- 新增 `ControlSlot`，让视图层直接消费 `layoutDecision.slots`
- 将关键控件从固定 left/right chrome 结构迁移为按 slot 渲染
- 为 compact/mobile/fullscreen 下的控件迁移补充回归测试

### 完成情况（2026-04-06 16:49）
- 新增 `src/player/components/ControlSlot.tsx`，视图层开始以 slot 为中心组织控件容器
- `useLayoutDecision` 已导出 `ControlId` / `ControlSlot` 类型，`Player.tsx` 通过 `renderControl` 和 `layoutDecision.slots` 渲染顶部与底部控件
- 顶部 `top-right` 与底部 `bottom-left / bottom-right` 的控件迁移已经进入 slot 组合，而不是继续写死在固定 left/right chrome 结构中
- `src/test/Player.test.tsx` 扩展到 43 个测试，新增 desktop-default / desktop-compact 的 slot 组合契约
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-16 验收修复包

### 本次变更
- 追加 `SEQ-20260406-05`
- 将 `PLAYER-16` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-16` 单任务工作台

### 当前目标
- 修复 compact/mobile 下顶部迁移控件被手势面盖住的问题
- 修复 settings 按钮二次点击关闭不稳定的问题
- 补充真实点击命中回归测试

### 完成情况（2026-04-06 17:06）
- `Player.tsx` 已为顶部 slot 控件补充稳定交互边界：根节点输出 `data-top-controls-interactive`，gesture surface 在 top-right 控件存在时通过 `--ytp-gesture-top` 下移，确保 compact/mobile 下顶部控件优先命中
- settings outside-click 逻辑已排除 `settings-btn` 触发器自身，再次点击按钮现在可以稳定关闭面板
- 底部控件区已恢复 `next + episodes` 组合容器，并增加 `data-ytp-component="next-episodes-group"`，修复控制栏选集按钮在 slot 重组后失去组合交互的问题
- `src/test/Player.test.tsx` 扩展到 45 个测试，新增顶部交互契约、bottom-left next/episodes 组合存在性、settings 二次点击关闭的回归覆盖
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-17 底部控件顺序与边缘提示修复

### 本次变更
- 追加 `SEQ-20260406-06`
- 将 `PLAYER-17` 更新为 `🔄`

### 当前目标
- 修复 bottom-left 中播放键与下一集键顺序颠倒的问题
- 将 tooltip 边缘钉住规则从局部按钮特例收敛为 slot 级规则
- 补充控件顺序与边缘 tooltip 契约测试

### 完成情况（2026-04-06 17:10）
- `Player.tsx` 已恢复 bottom-left 的渲染顺序：`play` 先渲染，`next + episodes` 组合容器随后渲染，其余控件保持在后，修复播放键与下一集按钮位置反转
- `Player.module.css` 已将 tooltip 边缘钉住规则改为基于 `data-control-slot` 的通用左右槽位规则，不再依赖 `play/fullscreen` 的局部特例
- `src/test/Player.test.tsx` 扩展到 46 个测试，新增 bottom-left 控件顺序契约验证
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2026-04-06 任务启动：PLAYER-18 重构后差距清单与决策矩阵

### 本次变更
- 追加 `SEQ-20260406-07`
- 将 `PLAYER-18` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-18` 单任务工作台

### 当前目标
- 基于当前重构结果系统审计播放器与 YouTube 级桌面/移动交互仍存在的差距
- 区分哪些问题适合 targeted bugfix，哪些必须进入下一阶段架构调整
- 输出按优先级排序的建议执行顺序，避免下一轮开发重新失焦

### 完成情况（2026-04-06 17:14）
- 新增 `docs/player-post-refactor-gap-audit.md`，明确区分“已被抹平的架构差距”和“仍然存在的交互差距”
- 差距清单已按布局策略、输入路由、overlay 编排、桌面行为、移动端行为、系统集成契约六个维度展开
- 文档已为每类问题标注 `targeted bugfix / narrow improvement` 或 `下一阶段架构调整`，并给出建议执行顺序
- 本次为纯文档任务，未运行 `typecheck/lint/test/build`

## 2026-04-06 任务启动：PLAYER-19 多终端播放器交互策略草案

### 本次变更
- 追加 `SEQ-20260406-08`
- 将 `PLAYER-19` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-19` 单任务工作台

### 当前目标
- 定义桌面、大尺寸平板、小尺寸手机三类终端的交互目标和输入模型
- 明确 `episodes` 在不同终端中的导航地位与入口优先级
- 形成可直接指导下一阶段开发的控件优先级与折叠策略基线

### 完成情况（2026-04-06 17:18）
- 新增 `docs/player-device-interaction-strategy.md`，将播放器终端策略明确拆为 `Desktop Pointer / Tablet Touch / Phone Touch` 三类
- 文档已定义多终端共享媒体核心、控件优先级模型，以及 `episodes` 在本项目中高于普通附加按钮的产品定位
- 已为桌面、平板、手机分别给出交互目标、输入模型、控件常驻/折叠策略和 `episodes` 入口建议
- 文档已补充近期开产品决策建议，为下一阶段 `Focused Hardening` 和更大规模架构演进提供基线
- 本次为纯文档任务，未运行 `typecheck/lint/test/build`

## 2026-04-06 任务启动：PLAYER-20 Focused Hardening Strategy Alignment

### 本次变更
- 追加 `SEQ-20260406-09`
- 将 `PLAYER-20` 更新为 `🔄`
- `docs/tasks.md` 切换到 `PLAYER-20` 单任务工作台

### 当前目标
- 为手机端显式提供 `episodes` 入口
- 恢复 portrait 模式左右双击 seek 的基础能力
- 禁用移动端伪音量手势，让当前实现先对齐已确认的终端策略

### 完成情况（2026-04-06 17:32）
- `useLayoutDecision` 已调整手机端策略：`episodes` 进入 `top-right` 显式入口，手机端底部主控件收敛为 `play` 与 `fullscreen`
- `useInputRouter` 已为 `mobile-portrait` 恢复 `left / center / right` 三分区输入，手机端重新具备左右双击 seek 的基础能力
- `useGestureControls` 已新增 `allowVolumeGesture`，并在移动端禁用右侧纵向伪音量手势
- `src/test/Player.test.tsx` 扩展到 48 个测试，新增手机端 `episodes` 入口、portrait 三分区输入、portrait 右侧双击 seek、移动端禁用伪音量手势覆盖
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过
