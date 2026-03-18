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

### 遗留问题
- HLS.js 广告过滤（LibreTV 原有功能）暂不在 YTPlayer 内实现，第二阶段再评估
