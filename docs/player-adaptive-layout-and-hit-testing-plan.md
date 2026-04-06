# YTPlayer Adaptive Layout And Hit-Testing Refactor Plan

## Purpose

本方案用于解决当前 `YTPlayer` 在跨设备交互适配上的根本问题，而不是继续通过局部补丁维持可用性。

目标不是“让几个按钮暂时能点”，而是将播放器从“固定布局 + 全屏手势层 + 分散 overlay”治理成一个具备如下特征的系统：

- 自适应布局不是 CSS 挪位置，而是布局决策层驱动
- 控件可点击性不依赖偶然的 `z-index` 和 `pointer-events` 组合
- 桌面 / 移动 / 窄宽度 / 全屏等模式的差异有明确架构承载
- bug 修复必须收敛回架构边界，而不是继续堆补丁

本方案同时用于约束后续开发，避免为了短期修 bug 而损害交互架构层级，加重未来开发难度。

---

## Problem Statement

当前播放器已经具备较完整功能，但交互架构仍与 YouTube 级播放器有本质差异。

### 当前实现的核心特征

- 以单个 `Player.tsx` 作为主要装配入口
- 使用 `data-layer` + CSS `z-index` 管理大部分层级
- 使用全屏 `gesture layer` 捕获主区域点击与触摸
- 控件大多假设自己位于底部 `chrome`
- 桌面与移动端差异主要通过 CSS 媒体查询和少量手势 hook 实现

### 已暴露的问题

- `Tap to unmute` 这类提示层在视觉上可见，但可能被手势层盖住，导致无法点击
- 控件挪到顶部或右侧后，命中规则仍然沿用旧布局假设，导致“看得到、点不到”
- loading、error、gesture、captions、menu 等 overlay 缺乏统一交互优先级
- 桌面与移动端输入模型混在一个体系里，补一个平台时容易影响另一个平台
- bug 修复容易滑向“局部抬 z-index / 临时关 pointer-events / 新增布尔状态”的补丁式做法

### 和 YouTube 的根本差异

YouTube 的成熟之处不在样式，而在交互架构层级：

- 先有布局系统，再决定控件渲染到哪里
- 先有命中路由，再决定谁接收点击/触摸/手势
- 先有 overlay 管理，再决定提示、菜单、spinner、captions 如何并存
- 先区分输入模式，再为桌面/移动/全屏配置不同交互策略

当前项目则更接近：

- 先渲染一套默认布局
- 再通过 CSS 调整位置
- 再通过 overlay 和事件绑定补交互

这会导致布局变化时，事件命中仍然留在旧世界模型里。

---

## Non-Goals

本方案明确不做以下事情：

- 不改变 `YTPlayer` 的公开 API 形状
- 不引入宿主级 Provider、Store、Router、设计系统
- 不将样式系统改成 Tailwind、CSS-in-JS 或其他非 CSS Modules 方案
- 不一次性重写播放器
- 不为了“代码看起来更碎”而拆文件

---

## Architectural Principles

### 1. Layout Is Data, Not CSS Accident

控件布局必须由明确的布局状态和 slot 映射驱动，而不是“先放在底部，再用 CSS 搬走”。

### 2. Hit-Testing Must Be Explicit

交互命中需要由输入路由规则定义，而不是依赖层叠上下文偶然成立。

### 3. Overlays Need a Manager, Not Ad Hoc Booleans

spinner、error、captions、unmute prompt、settings、episodes、gesture hints 需要统一优先级和交互模型。

### 4. Desktop And Mobile Are Different Interaction Systems

移动端不是桌面端的“缩小版”，必须承认它是不同输入模型。

### 5. Bug Fixes Must Converge Toward Architecture

任何 bug 修复都必须回答：

- 这个修复是否让布局层更清晰？
- 这个修复是否让命中规则更明确？
- 这个修复是否减少了状态分裂？
- 这个修复是否会让未来重构更难？

如果答案偏负面，说明修复方案正在偏离设计路线。

---

## Mandatory Engineering Constraint

后续开发必须遵守以下硬约束：

### 禁止补丁式修复

以下类型的改动默认视为风险操作，需要明确论证：

- 为解决局部点击问题临时提高某个元素 `z-index`
- 通过新增布尔状态绕开 overlay 冲突
- 为特定设备单独加一段条件判断但不回收进统一布局/输入模型
- 通过 `pointer-events: none/auto` 局部切换掩盖命中路由问题
- 通过“某处点击时顺手关闭所有提示层”回避状态设计

这些手法不是绝对禁止，但必须满足两个条件：

- 有明确过渡性质
- 已在文档中登记其后续收敛计划

否则一律视为架构退化。

### 必须持续审查是否偏离路线

不要等到严重偏离才发现问题。每完成一个与交互架构相关的任务，都必须检查：

- 新状态是否可由现有状态推导
- 新层级是否进入 overlay 管理模型
- 新布局是否通过 slot/placement 表达
- 新输入规则是否落入输入路由层

如果没有，就意味着开发已经开始偏航。

---

## Target Architecture

最终播放器建议分为 5 层。

## 1. Media Core Layer

负责纯媒体状态和命令，不关心 UI 布局。

职责：

- play / pause / seek / volume / mute / rate
- duration / currentTime / buffered / ended
- source loading / HLS lifecycle / retry / autoplay policy
- subtitle track activation

代表模块：

- `useSourceLoader`
- 后续可演进出的 `useMediaController`

要求：

- 对外提供明确命令接口与只读状态
- 不直接决定按钮位置和 overlay 展示

## 2. Layout Decision Layer

负责“当前哪些控件应该出现在什么区域”。

职责：

- 根据 viewport、fullscreen、theater、pointer type、panel state 计算布局模式
- 决定 controls 分布到哪些 slots
- 决定哪些控件在当前模式被隐藏、折叠、转移位置

建议概念：

```ts
type LayoutMode =
  | "desktop-default"
  | "desktop-compact"
  | "mobile-portrait"
  | "mobile-landscape"
  | "fullscreen-immersive";

type ControlSlot =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center-overlay"
  | "edge-left"
  | "edge-right";
```

输出示例：

```ts
interface LayoutDecision {
  mode: LayoutMode;
  slots: Record<ControlSlot, string[]>;
  hiddenControls: string[];
  compactPanels: boolean;
}
```

这层的意义在于：

- 让按钮迁移位置成为数据决策，而不是 CSS 偏移
- 支持小屏把按钮从底部迁到顶部或侧边时，命中仍然正确

## 3. Input Routing Layer

负责定义“谁接收输入”，这是当前和 YouTube 差异最大的层。

职责：

- 将点击、双击、拖动、touch、keyboard 归类为统一的输入意图
- 根据当前 overlay / layout / focus 状态决定事件目标
- 管理 gesture capture 的有效区域，而不是整屏无差别兜底

建议拆分：

- `useInputRouter`
- `useGestureControls`
- `useKeyboardShortcuts`

核心规则：

- 空白视频区接收 play/pause 与双击 seek
- 控件区永远优先于 gesture 区
- popup / prompt / menu 显示时，其命中区域必须从 gesture capture 中剔除
- progress bar 拥有独立 scrub capture 区
- captions / spinner 等非交互 overlay 不参与事件路由

建议把当前整屏 `gesture layer` 改造成：

- 主视频手势区
- 左右 seek 区
- 可交互 overlay 排除区

而不是一个全屏绝对定位透明层。

## 4. Overlay Manager Layer

负责所有 overlay 的可见性、优先级与交互属性。

当前 overlay 大致包括：

- loading spinner
- error banner
- bezel
- seek overlay
- touch seek hint
- captions
- unmute prompt
- settings panel
- episodes panel

建议统一数据结构：

```ts
type OverlayKind =
  | "spinner"
  | "error"
  | "bezel"
  | "seek-indicator"
  | "captions"
  | "unmute-prompt"
  | "settings"
  | "episodes";

interface OverlayEntry {
  kind: OverlayKind;
  visible: boolean;
  interactive: boolean;
  priority: number;
  blocksGestures: boolean;
}
```

作用：

- 控制谁盖在谁上面
- 控制谁可以接收事件
- 控制显示时是否冻结部分手势捕获
- 避免继续靠散落的 `showXxx`、`isXxxOpen`、`error`、`isLoading` 自己互相抢层

## 5. View Composition Layer

负责纯渲染。

组件只消费：

- media state
- layout decision
- input bindings
- overlay entries

建议视图组件：

- `PlayerSurface`
- `TopChrome`
- `BottomChrome`
- `ControlSlot`
- `ProgressBar`
- `OverlayStack`
- `SettingsPanel`
- `EpisodesPanel`
- `CaptionOverlay`

这层不应该再决定：

- autoplay fallback
- gesture capture 规则
- overlay priority
- 哪个按钮现在应该出现在什么区域

---

## State Model Cleanup

当前需要重点治理的是“平行状态源”。

### 典型问题

- `showUnmute` 不是从真实 media state 推导，而是独立布尔值
- `isMuted`、`volume`、`video.muted` 之间存在同步成本
- `isLoading` 和 `error` 并列，但未被统一视为加载态机的一部分

### 建议方向

把部分 UI 状态改成 derived state 或 event-backed state：

- `showUnmute` 来自：
  - 最近一次 autoplay fallback 是否成功
  - 当前是否已经恢复有声
  - 用户是否已主动 dismiss
- `loading / ready / fatalError` 收敛到统一 source status
- overlay 显示不再由每个布尔值单独决定，而是通过 overlay manager 统一推导

建议媒体与 overlay 状态机至少具备以下状态：

```ts
type SourceStatus =
  | "idle"
  | "loading"
  | "ready"
  | "recoverable-error"
  | "fatal-error";
```

这样 loading spinner 和 error banner 不会继续彼此抢层。

---

## Responsive Layout Strategy

不要再把响应式理解成“屏幕小时隐藏几个按钮”。

建议显式定义 4 类布局模式：

### 1. Desktop Default

- controls 主要位于底部
- hover、tooltip、volume slider 全功能开启
- episodes / settings panel 使用常规 popup

### 2. Desktop Compact

- 当宽度不足时，将非核心按钮迁移到顶部或右侧 slot
- time / chapter / subtitle / pip 的显示优先级根据布局规则裁剪
- 不允许仅通过 `display: none` 破坏关键功能入口

### 3. Mobile Portrait

- controls 更稀疏
- volume slider 不作为主要入口
- settings / episodes / more-actions 可以转为顶部或侧边 sheet
- gesture 优先级高于 hover 概念

### 4. Mobile Landscape / Fullscreen Immersive

- 双击 seek、横向 scrub、最小化 chrome 优先
- 安全区与边缘手势需要显式考虑
- overlay 出现时必须冻结对应区域的 gesture capture

布局模式切换建议由 hook 统一决定，例如：

```ts
function useLayoutDecision(params): LayoutDecision
```

而不是散落在 CSS 媒体查询和 JSX 条件中。

---

## Hit-Testing Rules

这是本次重构必须补上的核心规则集。

### Rule 1

任何可交互 overlay 必须天然高于 gesture capture 区，而不是通过局部修补抬层。

### Rule 2

gesture capture 只负责没有更高优先级交互目标的区域。

### Rule 3

控件迁移位置时，命中区随 slot 迁移，不允许视觉和命中分离。

### Rule 4

popup 打开时，需要显式标记：

- 是否阻断 gesture
- 是否阻断 keyboard
- 是否锁定 chrome visibility

### Rule 5

所有 pointer-events 策略都必须从 overlay manager 或 input router 推导，而不是在 CSS 里临时试错。

---

## Migration Plan

建议按 4 个阶段推进，不要一次性重写。

## Stage A — Document And Instrument

目标：

- 明确当前命中问题清单
- 为关键层级行为补测试
- 建立 overlay priority 与 hit-testing 契约测试

新增测试建议：

- unmute prompt 在显示时必须高于 gesture 层
- settings / episodes 打开时不得触发 gesture click
- progress scrub 与 overlay 不互抢事件
- 小屏布局下控件迁移后仍可点击

完成标准：

- 新交互契约有自动化保护

## Stage B — Introduce Layout Decision Layer

目标：

- 先不大改视图，只先引入布局决策数据结构

工作内容：

- 新建 `useLayoutDecision`
- 把当前 scattered 的 `isFullscreen`、`isTheater`、`pointer: coarse`、container width 判定收敛到布局层
- 让现有控件开始消费 slot / visibility 决策

完成标准：

- 哪个控件显示在哪里，不再由 JSX 结构直接写死

## Stage C — Introduce Input Router And Overlay Manager

目标：

- 收回整屏 gesture layer 的粗暴设计
- 统一 overlay 优先级与命中阻断逻辑

工作内容：

- 新建 `useOverlayManager`
- 新建 `useInputRouter`
- 让 gesture controls 不再直接监听整屏透明层
- 让可交互 overlay 进入统一路由规则

完成标准：

- “按钮挪位置后点不到”这类问题从结构上被消灭

## Stage D — Recompose UI Around Slots

目标：

- 让视图层围绕 slot 渲染，而不是围绕固定 bottom chrome 渲染

工作内容：

- 新建 `ControlSlot`
- 把 controls 逐步改为按 slot 渲染
- desktop / mobile / compact / fullscreen 统一从布局决策层输出

完成标准：

- 控件迁移成为正常能力
- 不是每次改 UI 都要同时改命中与 overlay

---

## File Structure Direction

建议后续演进为：

```text
src/player/
  Player.tsx
  Player.module.css
  types.ts
  hooks/
    useMediaController.ts
    useSourceLoader.ts
    useLayoutDecision.ts
    useOverlayManager.ts
    useInputRouter.ts
    useGestureControls.ts
    useKeyboardShortcuts.ts
    useChromeVisibility.ts
    useSystemIntegrations.ts
    useProgressInteractions.ts
    useThumbnails.ts
  components/
    PlayerSurface.tsx
    OverlayStack.tsx
    ControlSlot.tsx
    TopChrome.tsx
    BottomChrome.tsx
    ProgressBar.tsx
    SettingsPanel.tsx
    EpisodesPanel.tsx
    CaptionOverlay.tsx
```

注意：

- 这不是一次性创建清单
- 只有当某层责任已经稳定时才拆文件

---

## Review Checklist For Every Future Change

后续任何涉及交互的改动，在合入前都必须自检以下问题：

1. 这个改动属于哪一层：media、layout、input、overlay、view？
2. 是否新增了无法推导的平行状态？
3. 是否通过临时 `z-index` 或 `pointer-events` 解决问题？
4. 是否把设备差异写成了新的散装条件分支？
5. 是否为新行为补了命中/层级回归测试？
6. 是否让后续 slot 化、overlay 管理或输入路由更难实现？

如果第 3、4、6 任一答案为“是”，必须重新评估设计。

---

## Definition Of Success

这轮重构真正完成，不是看文件数，而是看以下结果是否成立：

- 控件迁移位置后仍然天然可点击
- interactive overlay 不再被 gesture layer 误吞
- 桌面和移动端的差异由明确布局/输入策略承载
- 新 bug 修复不再通过堆状态和调层级完成
- 开发者能清楚回答“这次改动属于哪一层”

只有达到这些条件，才算真正抹平了和 YouTube 交互架构层级的差距。
