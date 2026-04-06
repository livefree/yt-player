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
