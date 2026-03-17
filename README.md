# @livefree/yt-player

YouTube 风格的 React 视频播放器组件库。可移植嵌入其他视频网站，也可作为独立播放器使用。

---

## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [Props 接口](#props-接口)
- [类型定义](#类型定义)
- [主题定制（CSS 变量）](#主题定制css-变量)
- [键盘快捷键](#键盘快捷键)
- [播放列表示例](#播放列表示例)
- [开发](#开发)
- [构建](#构建)
- [项目结构](#项目结构)

---

## 特性

- **零运行时依赖**：仅 React 18+ 作为 peer dependency
- **CSS Modules 样式隔离**：所有样式作用域限于播放器容器，不污染宿主页面
- **完整键盘控制**：空格 / K、← →、↑ ↓、M、F、T、C、Shift+N、[ ]
- **字幕支持**：WebVTT 多轨，可循环切换；无字幕时按钮自动隐藏
- **章节标记**：进度条上显示分段标记与弹出标题
- **画质切换**：自定义画质列表，支持 HLS
- **三层按钮视觉模型**：背景层（`::before`）/ 悬浮层（`::after`）/ 图标层，独立尺寸与颜色控制
- **Theater / 全屏 / 画中画**：三种观看模式；全屏时 Theater 按钮自动隐藏
- **播放列表集成**：`onNext` / `onEnded` / `onTheaterChange` 回调支持外部状态控制
- **主题注入**：通过 `style` prop 传入 CSS 自定义属性覆盖任意设计 token
- **ESM + CJS 双格式**：兼容 Next.js App Router（保留 `"use client"`）
- **TypeScript**：完整类型定义，随包附带

---

## 快速开始

```bash
npm install @livefree/yt-player
```

```tsx
import { YTPlayer } from "@livefree/yt-player";
import "@livefree/yt-player/dist/index.css";

export default function Page() {
  return (
    <YTPlayer
      src="https://example.com/video.mp4"
      title="我的视频"
      author="作者名"
      poster="https://example.com/poster.jpg"
    />
  );
}
```

---

## Props 接口

```typescript
interface PlayerProps {
  // ── 视频源 ────────────────────────────────────────────────────────────────
  src?: string;               // 直链 MP4 或 HLS .m3u8
  poster?: string;            // 封面图 URL

  // ── 元数据 ───────────────────────────────────────────────────────────────
  title?: string;             // 显示在顶部 chrome 和沉浸层
  author?: string;            // 频道 / 作者名
  chapters?: Chapter[];       // 进度条章节标记

  // ── 字幕 ─────────────────────────────────────────────────────────────────
  subtitles?: SubtitleTrack[]; // 字幕轨道列表；为空时按钮自动隐藏

  // ── 画质 ─────────────────────────────────────────────────────────────────
  qualities?: QualityLevel[];  // 可选画质列表（显示在设置菜单）
  activeQualityId?: string;    // 当前激活的画质 id
  onQualityChange?: (id: string) => void;

  // ── 播放行为 ──────────────────────────────────────────────────────────────
  startTime?: number;          // 从指定秒数开始播放
  autoplay?: boolean;          // 挂载时自动播放（默认 false）
  initialVolume?: number;      // 初始音量 0–1（默认 1）
  defaultTheaterMode?: boolean; // 默认进入剧院模式（默认 false）

  // ── 回调 ──────────────────────────────────────────────────────────────────
  onEnded?: () => void;        // 视频播放结束
  onNext?: () => void;         // 点击下一集按钮 / 按 Shift+N；未传时按钮隐藏
  onTheaterChange?: (isTheater: boolean) => void; // 剧院模式切换时触发
  onTimeUpdate?: (currentTime: number, duration: number) => void; // 时间更新（~4Hz）

  // ── 外观 ──────────────────────────────────────────────────────────────────
  style?: CSSProperties & { [key: `--${string}`]: string }; // CSS 变量主题注入

  // ── 开发辅助 ──────────────────────────────────────────────────────────────
  keepControlsVisible?: boolean; // 保持控制栏常显（禁用自动隐藏计时器）
}
```

---

## 类型定义

### `SubtitleTrack`

```typescript
interface SubtitleTrack {
  id: string;        // 轨道唯一标识
  label: string;     // 显示名称，如 "中文"、"English"
  srclang: string;   // BCP 47 语言代码，如 "zh"、"en"
  src: string;       // WebVTT 文件 URL
  default?: boolean; // 是否默认激活
}
```

### `QualityLevel`

```typescript
interface QualityLevel {
  id: string;       // 画质唯一标识
  label: string;    // 显示名称，如 "1080p"、"720p"、"Auto"
  src: string;      // 该画质的视频 URL
  isHls?: boolean;  // 是否为 HLS 流（.m3u8）
}
```

### `Chapter`

```typescript
interface Chapter {
  title: string;     // 章节名称
  startTime: number; // 起始时间（秒）
}
```

---

## 主题定制（CSS 变量）

所有设计 token 均通过 `--ytp-*` CSS 自定义属性控制，作用域限于播放器根元素，不影响宿主页面。

通过 `style` prop 覆盖任意变量：

```tsx
<YTPlayer
  src="..."
  style={{
    "--ytp-brand-color": "#1a73e8",          // 蓝色进度条
    "--ytp-bg-color": "rgba(0,0,0,0.3)",     // 加深背景层
    "--ytp-btn-gap": "8px",                  // 缩小按钮间距
  }}
/>
```

### 完整变量列表

#### 全局 / 布局

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-btn-size` | `32px` | 按钮点击区域（hitbox）宽高 |
| `--ytp-btn-gap` | `12px` | 左侧控制栏按钮间距 |
| `--ytp-right-bg-px` | `6px` | 右侧控制组胶囊左右内边距 |

#### 图标层

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-icon-color` | `#ffffff` | 所有按钮图标颜色 + 时间文字颜色 |

#### 背景层（`::before`，始终可见）

三层视觉模型中最底层，作为对比遮罩确保图标在任何视频画面上清晰可见。
尺寸略大于 hitbox：`bg-height (36px) > btn-size (32px) > hover-height (28px)`。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-bg-height` | `36px` | 背景高度（全局统一） |
| `--ytp-bg-color` | `rgba(0,0,0,0.15)` | 背景填充色 |
| `--ytp-play-bg-width` | `var(--ytp-bg-height)` | 播放按钮背景宽度（默认圆形） |
| `--ytp-next-bg-width` | `var(--ytp-bg-height)` | 下一集按钮背景宽度 |
| `--ytp-vol-bg-px` | `4px` | 音量区背景向两侧延伸量 |
| `--ytp-time-bg-px` | `4px` | 时间显示背景向两侧延伸量 |

#### 悬浮层（`::after`，悬停时显现）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-hover-height` | `28px` | 悬浮层高度（小于背景层，视觉内嵌） |
| `--ytp-hover-color` | `rgba(255,255,255,0.12)` | 鼠标悬停填充色 |
| `--ytp-active-color` | `rgba(255,255,255,0.22)` | 鼠标按下填充色 |
| `--ytp-play-hover-width` | `var(--ytp-hover-height)` | 播放按钮悬浮宽度 |
| `--ytp-next-hover-width` | `var(--ytp-hover-height)` | 下一集按钮悬浮宽度 |

#### 进度条

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-brand-color` | `#ff0000` | 进度填充色 + 滑块颜色 |
| `--ytp-progress-track-bg` | `rgba(255,255,255,0.20)` | 未播放轨道颜色 |
| `--ytp-progress-buffered-bg` | `rgba(255,255,255,0.40)` | 已缓冲区颜色 |
| `--ytp-progress-hover-bg` | `rgba(255,255,255,0.50)` | 悬停预览颜色 |
| `--ytp-scrubber-size` | `13px` | 滑块圆点直径 |

#### 音量滑块

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-vol-width` | `72px` | 展开时滑动条面板宽度 |
| `--ytp-vol-track-color` | `rgba(255,255,255,0.30)` | 轨道背景色 |
| `--ytp-vol-fill-color` | `#ffffff` | 填充段及手柄颜色 |
| `--ytp-vol-handle-size` | `8px` | 手柄圆点直径 |

#### Tooltip

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--ytp-tooltip-bg` | `#1c1c1c` | Tooltip 背景色（独立控制透明度） |
| `--ytp-tooltip-bg-opacity` | `0.90` | 背景透明度 0–1（不影响文字透明度） |
| `--ytp-tooltip-color` | `#ffffff` | Tooltip 文字颜色 |

---

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `Space` / `K` | 播放 / 暂停 |
| `←` | 后退 5 秒 |
| `→` | 前进 5 秒 |
| `↑` | 音量 +10% |
| `↓` | 音量 -10% |
| `M` | 静音 / 取消静音 |
| `F` | 全屏 / 退出全屏 |
| `T` | 剧院模式 / 默认视图 |
| `C` | 循环切换字幕轨道（无字幕时无效） |
| `Shift+N` | 下一集（需传入 `onNext`，否则静默忽略） |
| `[` | 减速播放（步长 0.25） |
| `]` | 加速播放（步长 0.25） |

---

## 播放列表示例

```tsx
import { useState } from "react";
import { YTPlayer } from "@livefree/yt-player";

const PLAYLIST = [
  { src: "https://example.com/ep1.mp4", title: "第一集" },
  { src: "https://example.com/ep2.mp4", title: "第二集" },
  { src: "https://example.com/ep3.mp4", title: "第三集" },
];

export function PlaylistPlayer() {
  const [index, setIndex] = useState(0);
  const [isTheater, setIsTheater] = useState(false);
  const video = PLAYLIST[index]!;
  const hasNext = index < PLAYLIST.length - 1;
  const goNext = () => setIndex(i => i + 1);

  return (
    <div style={{ display: "flex", flexDirection: isTheater ? "column" : "row" }}>
      {/* 播放器 */}
      <YTPlayer
        key={index}                       // 切集时强制重建，确保状态干净
        src={video.src}
        title={`${index + 1} / ${PLAYLIST.length} — ${video.title}`}
        autoplay={index > 0}              // 第一集不自动播，之后自动播
        onNext={hasNext ? goNext : undefined}  // 最后一集时自动隐藏 Next 按钮
        onEnded={() => { if (hasNext) goNext(); }}
        onTheaterChange={setIsTheater}    // 父组件响应模式切换，调整布局
      />

      {/* 播放列表 UI（自定义实现） */}
      <ul>
        {PLAYLIST.map((item, i) => (
          <li key={i} onClick={() => setIndex(i)}
              style={{ fontWeight: i === index ? "bold" : "normal" }}>
            {i + 1}. {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**关键模式说明：**

| 模式 | 说明 |
|------|------|
| `key={index}` | 切集时强制重建播放器，确保进度、字幕等内部状态干净 |
| `onNext={hasNext ? fn : undefined}` | `undefined` 时 Next 按钮自动隐藏（最后一集） |
| `autoplay={index > 0}` | 第一集手动播放，后续集自动播放 |
| `onTheaterChange` | 父组件感知模式切换，可据此调整播放器周边布局 |

---

## 开发

```bash
# 安装依赖
npm install

# 启动开发预览（http://localhost:5173）
npm run dev

# 设计调试工具（http://localhost:5173/settings.html）
npm run dev   # 手动访问 /settings.html
```

开发预览（`dev/index.html`）直接从源码导入组件，无需构建，修改即时生效。

**设计调试工具**（`dev/settings.html`）功能：

- 点击播放器任意区域 → 切换到该区域的参数面板
- 实时拖动调整所有 `--ytp-*` CSS 变量，即时预览
- 导出当前配置为 JSON / 导入 JSON 还原配置
- 保存到 `localStorage`，刷新页面后配置保持

---

## 构建

```bash
npm run build       # 生成 dist/（ESM + CJS + 类型定义）
npm run typecheck   # TypeScript 类型检查（tsc --noEmit）
npm run lint        # ESLint 检查（0 warnings）
npm test            # Vitest 单元测试
```

输出文件：

| 文件 | 格式 | 说明 |
|------|------|------|
| `dist/index.js` | ESM | 主要格式，供 bundler 使用 |
| `dist/index.cjs` | CJS | CommonJS 兼容 |
| `dist/index.d.ts` | TypeScript | 类型定义（ESM） |
| `dist/index.d.cts` | TypeScript | 类型定义（CJS） |
| `dist/index.css` | CSS | 样式文件（需宿主手动导入） |

---

## 项目结构

```
yt-player/
├── src/
│   ├── index.ts                    # 公开 API barrel export
│   ├── example.tsx                 # 示例组件（含 10 集播放列表）
│   └── player/
│       ├── Player.tsx              # 主组件（精简 JSX 组合层）
│       ├── Player.module.css       # 全部样式（CSS Modules，禁止拆分）
│       ├── types.ts                # 所有公开接口定义
│       ├── components/
│       │   ├── Button.tsx          # YtpButton 通用按钮（含 Tooltip）
│       │   └── icons.tsx           # SVG 图标组件（stroke="currentColor"）
│       ├── hooks/
│       │   └── useHls.ts           # HLS 流加载 hook
│       └── utils/
│           └── format.ts           # 纯工具函数与常量
├── dev/
│   ├── index.html                  # 开发预览入口
│   ├── preview.tsx                 # 预览 React root
│   ├── settings.html               # 设计调试工具入口
│   ├── settings.tsx                # 调试工具 React root
│   └── settings/
│       ├── App.tsx                 # 调试工具主布局与控件
│       └── registry.ts             # 组件 → CSS 变量映射表
├── tasks/
│   └── done/                       # 已完成任务开发日志归档
├── dist/                           # 构建输出（gitignored）
├── CLAUDE.md                       # Claude Code 项目指令
└── README.md
```

### 公开 API

```typescript
// 组件
export { YTPlayer } from "@livefree/yt-player";

// 类型
export type {
  PlayerProps,
  SubtitleTrack,
  QualityLevel,
  Chapter,
} from "@livefree/yt-player";
```

所有内部子组件（`Button`、图标等）均不从包导出。

---

## 兼容性

| 环境 | 要求 |
|------|------|
| React | 18+ |
| 浏览器 | Chrome 90+ / Firefox 88+ / Safari 14+ |
| Next.js | 13+ App Router（组件顶部保留 `"use client"`） |
| HLS 流 | 需宿主自行集成 [hls.js](https://github.com/video-dev/hls.js)，通过 `qualities` prop 传入流地址 |
