# YTPlayer Refactor Plan

## Goal

在不破坏现有公开 API 的前提下，逐步将 `YTPlayer` 从“高耦合的大组件”治理为“高移植、可维护、可测试的播放器模块”。

本计划的首要目标不是“把大文件拆小”，而是同时做到：

- 保持高移植性：`src/player/` 可直接复制到其他 React 18 项目中使用
- 降低改动风险：每一步都能单独验证和回滚
- 提升移动端稳定性：将 touch / gesture 视为独立输入系统治理
- 维持即插即用：宿主只需传入 props，不需要额外上下文或全局设施

## Portability Contract

后续所有重构都必须满足以下约束：

- `YTPlayer` 继续作为唯一公开组件入口
- 不引入 React / ReactDOM 之外的新宿主依赖
- 不依赖 Next.js、Vite、Router、Store、Tailwind、i18n 或设计系统
- 不读取项目级 Provider、全局单例、业务上下文
- 所有宿主集成点仅通过 props / callback 暴露
- `src/player/` 内部逻辑、样式、hooks、组件尽量保持自闭合
- 平台能力全部基于 capability detection，宿主环境不支持时优雅降级
- IIFE 构建能力继续保留，保证非 React 页面嵌入能力

## Current Problems

当前 [`src/player/Player.tsx`](/Users/livefree/projects/yt-player-worktree/src/player/Player.tsx) 同时承担了多种职责：

- 媒体状态：播放、暂停、seek、buffer、duration、volume、rate
- 源加载：普通直链、HLS、autoplay fallback、error retry、cleanup
- 平台适配：Fullscreen、Media Session、Wake Lock、AirPlay
- 输入系统：键盘、鼠标、pointer、touch、双击手势、进度条 scrub
- 视图渲染：播放器层级、面板、控制栏、字幕、overlay

这会导致：

- 改一处交互时容易误伤其他行为
- 移动端问题很难局部修复
- 副作用分散，难以验证 cleanup 是否完整
- 组件难以在其他项目中做定制和局部裁剪

## Refactor Principles

### 1. Stabilize Behavior Before Structural Changes

先补关键行为测试，再做结构拆分。避免“边拆边猜”。

### 2. Extract Side Effects Before Extracting JSX

优先把源加载、系统能力、timer、gesture 这类副作用逻辑移出 `Player.tsx`。不要先做纯 UI 拆分。

### 3. Split by Responsibility, Not by File Size

拆分依据应是职责边界，而不是为了让 `Player.tsx` 变短。

### 4. Keep the Player Self-Contained

hooks 和子组件可以拆，但必须继续留在 `src/player/` 内部，保证整个播放器目录可复制。

### 5. Mobile Is a First-Class Input Layer

移动端触摸交互必须被视为独立输入层，而不是桌面事件的补丁。

## Phased Roadmap

## Phase 0 — Regression Safety Net

目标：给当前行为建立保护网，冻结已知能力边界。

工作内容：

- 为现有关键交互补充测试
- 为已知 bug 编写回归测试
- 明确浏览器/平台支持矩阵
- 标记哪些行为属于“必须保持”，哪些允许后续调整

重点覆盖：

- 普通 `src` 与 HLS `.m3u8` 加载/切换
- `autoplay` 被拦截后的 muted fallback
- 进度条 hover、pointer scrub、touch scrub
- 单击/双击、横向 seek、右侧纵向音量
- settings / subtitles / episodes 面板开关
- fullscreen / picture-in-picture / media session / wake lock 的降级行为
- unmount cleanup 和 source 切换 cleanup

交付物：

- 测试用例补强
- 已知问题清单
- 简短支持矩阵文档

完成标准：

- 关键行为有稳定测试覆盖
- 后续重构可以依赖测试发现回归

## Phase 1 — Extract Source Loading

目标：先拆最危险的副作用，降低媒体链路修改风险。

建议新增：

- `src/player/hooks/useSourceLoader.ts`

职责：

- 处理普通视频源与 HLS 源加载
- 管理 HLS 实例生命周期
- 处理 `autoplay` 和 muted fallback
- 管理 source 切换时的 reset / cleanup
- 向 `Player.tsx` 暴露最小必要状态和事件

原因：

- 这是当前副作用最重、最容易出错的一段
- HLS 和 autoplay 是高移植场景下的核心能力
- 抽离后更容易单独验证不同浏览器的退化行为

完成标准：

- `Player.tsx` 不再直接持有 HLS 初始化和销毁细节
- `src` 切换逻辑集中在单一 hook 中

## Phase 2 — Extract Progress And Gesture Input

目标：把移动端和进度条交互从主组件中隔离出来。

建议新增：

- `src/player/hooks/useProgressInteractions.ts`
- `src/player/hooks/useGestureControls.ts`

职责划分：

- `useProgressInteractions`
  - hover 时间计算
  - pointer scrub
  - touch scrub
  - tooltip / preview 位置
- `useGestureControls`
  - 单击/双击逻辑
  - 横向拖动 seek
  - 纵向拖动音量
  - 移动端交互状态

原因：

- 目前最可能继续出 bug 的区域就是 progress 和 gesture
- 桌面与移动端输入混写，会放大回归风险
- 抽离后可针对输入系统单独补测试

完成标准：

- `Player.tsx` 内不再直接维护 touch / scrub 的细节状态机
- 移动端行为具备可单独调试和回归验证的边界

## Phase 3 — Extract System Integrations

目标：把宿主环境相关能力统一收口。

建议新增：

- `src/player/hooks/useSystemIntegration.ts`
- `src/player/hooks/useChromeVisibility.ts`
- `src/player/hooks/useKeyboardShortcuts.ts`

职责：

- `useSystemIntegration`
  - fullscreen sync
  - Media Session metadata / actions / playbackState / positionState
  - Wake Lock acquire / release / visibility re-acquire
  - AirPlay detect / trigger
- `useChromeVisibility`
  - chrome visible / hidden
  - cursor hidden
  - immersive 模式计时器
  - panel 打开时的 pin 行为
- `useKeyboardShortcuts`
  - 键盘事件监听
  - 面板打开时的输入拦截
  - 快捷键映射

原因：

- 这些逻辑与渲染关系弱，但和平台兼容关系强
- 抽出来后更利于宿主环境差异下的降级控制

完成标准：

- 平台相关副作用集中在明确的适配层
- 主组件只消费状态和命令，不直接管理浏览器 API 细节

## Phase 4 — Thin Player Composition Layer

目标：让 `Player.tsx` 变成“组装器”，而不是“实现体”。

建议拆分的视图组件：

- `PlayerSurface`
- `TopChrome`
- `BottomChrome`
- `ProgressBar`
- `SettingsPanel`
- `EpisodesPanel`
- `CaptionOverlay`

要求：

- 子组件继续留在 `src/player/components/`
- 只接收显式 props，不读取外部上下文
- 不改变现有公开 API 形状

完成标准：

- `Player.tsx` 主要职责变为 props 解析、hook 组合、JSX 拼装
- UI 拆分不影响模块可复制性

## Target Directory Shape

最终目录可以逐步演进为：

```text
src/player/
  Player.tsx
  Player.module.css
  types.ts
  utils/
    format.ts
    media.ts
    gestures.ts
  hooks/
    useSourceLoader.ts
    useProgressInteractions.ts
    useGestureControls.ts
    useSystemIntegration.ts
    useChromeVisibility.ts
    useKeyboardShortcuts.ts
    useThumbnails.ts
  components/
    Button.tsx
    Spinner.tsx
    Bezel.tsx
    SeekOverlay.tsx
    PlayerSurface.tsx
    TopChrome.tsx
    BottomChrome.tsx
    ProgressBar.tsx
    SettingsPanel.tsx
    EpisodesPanel.tsx
    CaptionOverlay.tsx
    icons.tsx
```

## Non-Goals

以下内容不在本轮治理范围内：

- 重做视觉设计或替换 YouTube 风格 DOM 分层
- 修改 `src/index.ts` 的公开导出形状
- 引入外部状态管理或事件总线
- 为宿主业务增加 playlist / analytics / ad 逻辑
- 一次性重写为完全不同的播放器架构

## Execution Order

建议实际执行顺序：

1. 补测试和回归样例
2. 抽 `useSourceLoader`
3. 抽 `useProgressInteractions`
4. 抽 `useGestureControls`
5. 抽 `useSystemIntegration`
6. 抽 `useChromeVisibility`
7. 抽 `useKeyboardShortcuts`
8. 最后再拆视图组件

这个顺序的目标是：

- 每一步收益明确
- 每一步都能局部验证
- 出问题时容易回滚
- 在达到“可维护”之前，不先牺牲“可用”

## Definition Of Done

当以下条件同时成立时，可认为播放器模块完成第一轮治理：

- `Player.tsx` 不再承载主要副作用实现
- 移动端输入逻辑与桌面交互有清晰边界
- HLS / autoplay / system API 有集中适配层
- `src/player/` 可整体复制到其他 React 18 项目中使用
- README 能清楚描述最小集成方式与降级行为
- 关键用户流有回归测试保护

## Next Step

第一刀应从 Phase 0 和 Phase 1 开始：

- 先补 source loading / HLS / autoplay / progress / gesture 的回归测试
- 再抽 `useSourceLoader`

这是当前风险最低、收益最高的切入点，也最符合“高移植 + 即插即用”的目标。
