# Task: 图标重设计 + 按钮可见性逻辑 + 播放列表

## Status
done

## Description

### 1. Theater / Default View 图标重设计

用双箭头图标替代原矩形布局图，两个状态为镜像对称：

- **进入 Theater 模式**（`active=false`）：`< >` 向外展开的双 chevron
- **退出 Theater / Default view**（`active=true`）：`> <` 向内收拢的双 chevron

使用 `stroke="currentColor"` 继承 `--ytp-icon-color`，与按钮颜色主题联动。

### 2. 全屏图标重设计

原 Enter / Exit Fullscreen 用了不对称的角落位置（Enter：右上+左下；Exit：左上+右下），视觉不一致。

重设计为**同一对角线（右上 ↔ 左下）+ 折角位置翻转**：

- **Enter fullscreen**（`active=false`）：L 型折角在角落端 → 箭头指向角落（相背）
- **Exit fullscreen**（`active=true`）：L 型折角在内侧端 → 箭头指向中心（相对）

同样使用 `stroke="currentColor"`。

### 3. 按钮可见性逻辑

| 按钮 | 条件 | 说明 |
|------|------|------|
| 字幕按钮 | `subtitles.length > 0` | 原已实现，无需修改 |
| Theater 按钮 | `!isFullscreen` | 全屏时隐藏，全屏下 Theater 无意义 |
| Next 按钮 | 调用方传入 `onNext` prop | 未传入时按钮不渲染 |

`onNext` 同时接入 `Shift+N` 键盘快捷键，未传时快捷键也静默失效。

### 4. 播放列表 + 布局自适应

新增 `onTheaterChange?: (isTheater: boolean) => void` 到 `PlayerProps`，
在 `toggleTheater()` 时触发，供父组件感知当前模式。

`src/example.tsx` 的 `FullExample` 重构为带播放列表的示例：

**布局**：
- Default view（`≥ ~860px`）：播放器左侧 + 播放列表右侧，flex 自动折叠
- Theater mode：播放器顶部全宽 + 横向滚动卡片列表底部

**播放列表**（10 个公开 MP4）：
Big Buck Bunny、Elephants Dream、Sintel、Tears of Steel（前 4 个带章节标记）
+ ForBiggerBlazes / Escapes / Fun / Joyrides、Subaru Outback、Volkswagen GTI

**行为**：
- 点击任意项直接跳集，`autoplay: true`
- 视频结束自动播下一集（`onEnded`）
- 最后一集 Next 按钮自动消失（`onNext = undefined`）
- 当前集高亮（红色序号圆点 + 加粗标题）

### 5. 左侧按钮间距调整

`--ytp-btn-gap` 默认值从 `4px` → `12px`，registry 滑块上限扩展到 `24`。

## 变量体系变化

新增 prop：
- `PlayerProps.onNext?: () => void`
- `PlayerProps.onTheaterChange?: (isTheater: boolean) => void`

## 文件变更

| 文件 | 操作 |
|------|------|
| `src/player/components/icons.tsx` | TheaterIcon、FullscreenIcon 完全重写为 stroke 风格 |
| `src/player/Player.tsx` | Theater 按钮条件渲染；Next 按钮条件渲染 + onClick；Shift+N 快捷键；onTheaterChange 触发；onNext/onTheaterChange 解构 |
| `src/player/types.ts` | 新增 `onNext`、`onTheaterChange` prop |
| `src/player/Player.module.css` | `--ytp-btn-gap` 默认值改为 `12px` |
| `dev/settings/registry.ts` | `--ytp-btn-gap` 默认值同步，上限 `24` |
| `src/example.tsx` | FullExample 重构：播放列表状态、PlaylistItem 组件、双模式布局 |

## Acceptance Criteria
- [x] Theater / Default view 图标：`< >` / `> <` 双 chevron，stroke 风格
- [x] Fullscreen 图标：同对角线折角翻转，相背 / 相对箭头
- [x] 全屏时 Theater 按钮不渲染
- [x] 未传 `onNext` 时 Next 按钮不渲染；Shift+N 快捷键同步失效
- [x] `onTheaterChange` 回调在切换 theater 时触发
- [x] 播放列表在 Default view 显示于右侧，Theater mode 显示于下方
- [x] 最后一集时 Next 按钮消失；视频结束自动跳下一集
- [x] `--ytp-btn-gap` 默认 `12px`
- [x] `npm run typecheck` 通过
- [x] `npm run lint` 0 warnings
- [x] `npm test` 全部通过
- [x] `npm run build` 构建无报错
