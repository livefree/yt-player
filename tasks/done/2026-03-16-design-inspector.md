# Task: 播放器设计工具页面（Design Inspector）

## Status
done

## Description

构建一个独立的开发工具页面，用于可视化调整播放器外观参数。

### 前置：CSS 变量化重构

将 `Player.module.css` 中所有关键设计 token 提取为 `--ytp-*` CSS 自定义属性，定义在 `.ytpMoviePlayer` 上。所有 CSS 规则改为引用变量。变量层级不影响模块作为库导入（作用域限于播放器容器）。

同时为 `PlayerProps` 增加 `style` 属性，允许宿主（含设置页面）通过内联样式传入变量覆盖值，实现主题注入。

### Player.tsx 标记

为关键 DOM 元素添加 `data-ytp-component` 属性，供设置页面点击识别。

### 设置页面

位置：`dev/settings.html`（Vite multi-page，无需修改 vite.config.ts）

**布局**：
- 顶部工具栏：返回、页面标题、导出、导入、保存、重置
- 上半区域：播放器预览（带透明点击拦截层）
- 下半区域：设置面板（组件选择标签 + 参数控件 + 源码片段）

**交互**：
- 点击播放器中任意组件 → 切换到该组件的设置标签
- 每个参数有对应控件（颜色选择、滑动条）并实时预览
- 导出：下载当前 CSS 变量覆盖值为 JSON
- 导入：加载 JSON 并应用
- 保存：写入 localStorage，页面刷新后保持
- 重置：清除所有覆盖，恢复默认值

## 提取的 CSS 变量（20 个）

| 变量 | 默认值 | 含义 |
|------|--------|------|
| `--ytp-brand-color` | `#f00` | 进度条/滑块红色 |
| `--ytp-btn-size` | `32px` | 按钮尺寸 |
| `--ytp-btn-bg` | `rgba(0,0,0,.15)` | 按钮背景 |
| `--ytp-btn-hover-bg` | `rgba(0,0,0,.30)` | 按钮悬浮背景 |
| `--ytp-btn-ring-color` | `rgba(0,0,0,.10)` | 按钮外环颜色 |
| `--ytp-btn-ring-size` | `4px` | 按钮外环宽度 |
| `--ytp-pill-bg` | `rgba(0,0,0,.15)` | Pill 组背景 |
| `--ytp-pill-btn-hover-bg` | `rgba(255,255,255,.12)` | Pill 内按钮悬浮 |
| `--ytp-progress-height` | `3px` | 进度条默认高度 |
| `--ytp-progress-height-hover` | `5px` | 进度条悬浮高度 |
| `--ytp-progress-track-bg` | `rgba(255,255,255,.2)` | 进度轨道背景 |
| `--ytp-progress-buffered-bg` | `rgba(255,255,255,.4)` | 已缓冲背景 |
| `--ytp-progress-hover-bg` | `rgba(255,255,255,.5)` | 悬浮预览背景 |
| `--ytp-scrubber-size` | `13px` | 滑块圆点尺寸 |
| `--ytp-scrubber-scale` | `0.6` | 滑块默认缩放 |
| `--ytp-volume-panel-width` | `72px` | 音量面板展开宽度 |
| `--ytp-volume-track-bg` | `rgba(255,255,255,.3)` | 音量轨道背景 |
| `--ytp-volume-handle-size` | `8px` | 音量滑块圆点尺寸 |
| `--ytp-tooltip-bg` | `rgba(28,28,28,.9)` | Tooltip 背景 |
| `--ytp-tooltip-color` | `#fff` | Tooltip 文字颜色 |

## 文件变更

| 文件 | 操作 |
|------|------|
| `src/player/types.ts` | 新增 `style` 属性 |
| `src/player/Player.module.css` | 提取 CSS 变量，替换硬编码值 |
| `src/player/Player.tsx` | 传递 style prop，添加 data-ytp-component |
| `dev/settings.html` | 新建 |
| `dev/settings.tsx` | 新建（React root） |
| `dev/settings/App.tsx` | 新建（主布局） |
| `dev/settings/registry.ts` | 新建（组件→参数映射表） |

## Acceptance Criteria
- [x] CSS 变量定义正确，播放器外观不变
- [x] `npm run typecheck` 通过
- [x] `npm test` 通过
- [x] 设置页面在 `/settings.html` 可访问
- [x] 点击播放器组件可切换设置面板
- [x] 颜色/尺寸控件可实时预览
- [x] 导出/导入/保存/重置功能正常
