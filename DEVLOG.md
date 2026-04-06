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
