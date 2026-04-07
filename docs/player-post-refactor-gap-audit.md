# YTPlayer Post-Refactor Gap Audit

## Purpose

本文档用于回答一个更具体的问题：

在已经完成 `layout decision / overlay manager / input router / slot composition` 这四层重构后，当前播放器距离 YouTube 级桌面/移动交互还有哪些真实差距？

目标不是重新陈述历史问题，而是：

- 明确哪些核心架构差距已经被抹平
- 明确哪些差距仍然存在
- 判断每个差距应当走 `targeted bugfix` 还是 `下一阶段架构调整`
- 形成可直接拆任务的优先级清单

---

## What Has Been Closed

和最初方案相比，以下问题已经不再属于“根本架构缺口”：

- 布局不再完全依赖 CSS 偶然结果，已有 `useLayoutDecision`
- overlay 已有统一优先级与 gesture blocking 规则，已有 `useOverlayManager`
- 输入不再是单一整屏透明层，已有 `useInputRouter`
- 控件迁移已有 slot 模型，已有 `ControlSlot` 与 slot-driven view composition
- 顶部迁移控件命中、settings 二次点击关闭、next/episodes 组合交互、底部控件顺序、边缘 tooltip 裁切等已完成验收修复

因此，后续差距不能再笼统归因为“没有架构层”，而要聚焦在：

- 架构层虽然存在，但策略仍然不够成熟
- 某些交互仍停留在阶段性实现，而非 YouTube 级行为
- 移动端仍有若干输入模型没有被完整建模

---

## Remaining Gaps

### A. Layout And Control Strategy

#### A1. 控件迁移仍是固定预案，不是连续响应式策略

**现状**

- `useLayoutDecision` 只产出 5 个模式：`desktop-default / desktop-compact / mobile-portrait / mobile-landscape / fullscreen-immersive`
- 各模式的 slot 分配是硬编码预案，见 [`src/player/hooks/useLayoutDecision.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useLayoutDecision.ts)

**和 YouTube 的差距**

- YouTube 在窄宽度、低高度、全屏、小窗、触屏设备上的控件迁移是连续策略，不只是少量模式切换
- 当前模式粒度还不够表达“高度受限但宽度足够”“横屏但控件拥挤”“全屏但需保留更多底部信息”等场景

**根因**

- 布局层已经建立，但仍是 Phase 1 级别的 mode table，不是成熟的 constraint-based layout policy

**建议类型**

- `下一阶段架构调整`

**原因**

- 这不是单个按钮位置 bug，而是布局策略表达能力不够

#### A2. slot 只解决了“放哪”，还没解决“何时折叠 / 合并 / 优先显示”

**现状**

- slot 已决定控件区域
- 但缺少更细粒度的优先级，例如在空间进一步收紧时，哪些控件应该折叠、合并、降级显示

**和 YouTube 的差距**

- YouTube 会根据空间与输入模式动态调整控件密度和显示优先级
- 当前项目仍主要通过 `hiddenControls` 和少量 CSS `@container` 隐藏按钮

**建议类型**

- `下一阶段架构调整`

**原因**

- 这需要在 layout decision 层引入“control priority / collapse policy”，不适合继续用零散 CSS 修

---

### B. Input Routing And Gesture Semantics

#### B1. 输入路由还只有 zone 概念，没有 intent 路由

**现状**

- `useInputRouter` 目前只生成 `left / center / right` 三个 zone，见 [`src/player/hooks/useInputRouter.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useInputRouter.ts)
- 这已经比整屏 gesture layer 更好，但仍然只是“区域路由”

**和 YouTube 的差距**

- YouTube 更接近“输入意图路由”：单击、双击、拖动、面板交互、scrub、hover、keyboard、系统媒体键都进入统一优先级模型
- 当前系统还没有明确的 input intent graph

**风险**

- 一旦再增加新的 overlay 或新的可交互区域，zone 模型会再次出现竞争边界

**建议类型**

- `下一阶段架构调整`

**原因**

- 这已经不是修某个点击点不到的问题，而是输入系统成熟度问题

#### B2. 移动端 touch 手势仍然混合了 seek 和“伪音量”模型

**现状**

- `useGestureControls` 仍支持右半屏纵向滑动改 volume，见 [`src/player/hooks/useGestureControls.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useGestureControls.ts)
- CSS 在 coarse pointer 下又把 `.ytpVolumeArea` 整体隐藏，见 [`src/player/Player.module.css`](/Users/livefree/projects/yt-player-worktree/src/player/Player.module.css)

**和 YouTube 的差距**

- YouTube 在移动网页端通常避免把“浏览器不稳定支持的音量控制”当成核心手势
- 当前实现仍然保留这条能力，但它跨平台稳定性有限

**建议类型**

- `下一阶段架构调整`

**原因**

- 这里不是简单删掉或保留的问题，而是要先定义“移动端音量控制是否属于产品级支持”
- 如果答案是否定的，应从输入模型中正式移除，而不是继续半支持

#### B3. 移动端 portrait 只保留 `center` zone，双击 seek 体验不足

**现状**

- `mobile-portrait` 下 `useInputRouter` 只保留 `center` zone

**和 YouTube 的差距**

- YouTube 移动端双击左右 seek 是非常稳定且核心的心智模型
- 当前 portrait 单区路由在体验上更保守，但也更弱

**建议类型**

- `targeted bugfix` 如果决定补左右双击 seek
- `架构调整` 如果要把它纳入完整移动输入策略

**建议判断**

- 如果目标是快速补齐常用行为，可先做 targeted improvement
- 如果目标是形成长期稳定移动输入系统，应在下一阶段统一定义 portrait zones 和 gesture affordance

---

### C. Overlay Behavior

#### C1. overlay manager 只解决了优先级，不负责空间避让和排布策略

**现状**

- `useOverlayManager` 已统一可见性、优先级、交互性和 gesture blocking
- 但它不负责 overlay 之间的空间避让和布局冲突

**和 YouTube 的差距**

- YouTube 的 captions、spinner、bezel、panel、prompt 不只是层级分清，还会根据 chrome 状态和场景做空间协调

**例子**

- captions 当前只在 `chromeVisible` 时抬高一点，但没有更细的 overlay-aware 避让
- panel、prompt、captions 仍然是各自布局，而不是统一 overlay placement policy

**建议类型**

- `下一阶段架构调整`

**原因**

- 需要从“overlay priority manager”升级到“overlay orchestration”

#### C2. loading / error / transitional states 仍然比较粗糙

**现状**

- 已修掉 HLS loading 阶段被误切成 generic error 的问题
- 但整体上，loading 仍更偏向二元状态：`loading` 或 `error`

**和 YouTube 的差距**

- YouTube 对初始加载、切源、短暂等待、网络抖动、fatal error 的视觉和交互差异更细

**建议类型**

- `targeted bugfix` 可先补更细的状态展示
- 若要系统化，则进入 `下一阶段架构调整`

**建议判断**

- 先做 targeted bugfix 就足够，因为根架构并不缺，只是状态分层还不够细

---

### D. Desktop Behavior

#### D1. 桌面 hover 体系仍然更像一组局部实现，不像统一 hover contract

**现状**

- progress hover、button tooltip、next/episodes reveal、volume hover 都能工作
- 但它们依然分散在局部 CSS 和局部交互实现里

**和 YouTube 的差距**

- YouTube 的桌面 hover 反馈更一致，尤其是 reveal 行为、tooltip 延迟、panel 打开时 hover suppression 的统一性

**建议类型**

- `targeted bugfix` 如果只是补几处不一致
- `下一阶段架构调整` 如果要建立统一 hover contract

**建议判断**

- 当前优先级不如移动端输入与布局策略，适合作为后续桌面 polish 包

#### D2. 键盘交互覆盖面尚可，但 focus navigation 仍然偏弱

**现状**

- `useKeyboardShortcuts` 已覆盖 play/seek/volume/mute/fullscreen/theater/subtitles/episodes 等
- 但按钮本身的 focus traversal、panel 内部 roving focus、ESC/Tab 流程仍不够完整

**和 YouTube 的差距**

- YouTube 的桌面可访问性和键盘控制更接近完整交互系统，而不是“有快捷键即可”

**建议类型**

- `targeted bugfix`

**原因**

- 这部分已经有架构承载，主要是补焦点与菜单键盘语义

---

### E. Mobile Behavior

#### E1. 移动端 still “usable”, not “first-class”

**现状**

- 现有移动端支持：单击、双击、横向 seek、touch scrub、系统 fullscreen/AirPlay 检测、基础控件迁移
- 但移动端仍然主要是从桌面模型裁剪和隐藏出来的

**和 YouTube 的差距**

- YouTube 移动端本身就是一套一等交互设计，不只是“桌面控件裁剪版”

**建议类型**

- `下一阶段架构调整`

**原因**

- 需要一个明确的 mobile interaction policy，而不是继续在 desktop-first 结构上追加条件

#### E2. safe-area / notch / orientation 策略还不完整

**现状**

- 当前只有 fullscreen bottom safe-area 处理，见 [`src/player/Player.module.css`](/Users/livefree/projects/yt-player-worktree/src/player/Player.module.css)
- top safe-area、landscape 左右安全区、panel 在异形屏中的避让尚未系统表达

**建议类型**

- `targeted bugfix`

**原因**

- 这是具体布局兼容问题，可以在现有架构上补，不需要先改层级模型

#### E3. 移动端控件显隐时机仍然比较桌面化

**现状**

- `useChromeVisibility` 主要是统一计时隐藏，见 [`src/player/hooks/useChromeVisibility.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useChromeVisibility.ts)

**和 YouTube 的差距**

- 移动端 chrome 显隐通常更依赖触摸上下文、播放状态、手势后短期保留等逻辑
- 当前逻辑虽可用，但没有针对 mobile 模式做专门策略分支

**建议类型**

- `下一阶段架构调整`

**原因**

- 这里应进入“按 layout mode / input mode 生成 chrome visibility policy”的层级，而不是继续调几个 timer 常量

---

### F. System Integration And Portability

#### F1. 系统集成已基本独立，但行为降级策略仍需清单化

**现状**

- Fullscreen、Media Session、Wake Lock、AirPlay 已收口在 [`src/player/hooks/useSystemIntegrations.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useSystemIntegrations.ts)

**剩余差距**

- 还缺少一份明确的“支持矩阵 + 降级契约”
- 特别是移动端 fullscreen、AirPlay、wake lock 的行为差异，目前主要体现在实现中，而不是显式契约中

**建议类型**

- `targeted bugfix / 文档任务`

**原因**

- 这更像工程质量和集成契约问题，不需要再做一轮大架构调整

---

## Decision Matrix

### 适合先做 Targeted Bugfix / Narrow Improvement

这些问题已经有现成架构承载，不需要先扩层：

1. `safe-area` 与异形屏适配补强
2. loading / transitional state 视觉细分
3. 键盘 focus / 菜单可访问性补强
4. 移动端 portrait 下是否恢复左右双击 seek
5. 系统集成支持矩阵与降级契约文档

### 必须进入下一阶段架构调整

这些问题的根因不再是某个 bug，而是策略模型不足：

1. 连续响应式布局策略
2. control priority / collapse policy
3. input intent routing
4. 移动端一等输入模型
5. overlay orchestration
6. mode-aware chrome visibility policy

---

## Recommended Execution Order

### Phase A — Focused Hardening

先做一轮小而快的 targeted improvements：

1. 补 `safe-area / orientation` 兼容
2. 补 keyboard focus / menu accessibility
3. 明确移动端 portrait 双击 seek 策略并实现
4. 细化 loading / waiting / fatal error 展示
5. 输出系统集成支持矩阵

这样做的意义是：

- 不会打断当前架构节奏
- 能快速提升用户可感知质量
- 为下一阶段架构调整扫掉表层噪音

### Phase B — Next Architecture Iteration

在 Focused Hardening 之后，再开启下一阶段架构工作：

1. 扩展 `useLayoutDecision` 为连续布局策略
2. 为 controls 引入 priority / collapse policy
3. 将 `useInputRouter` 从 zone routing 升级为 intent routing
4. 建立 mobile-first interaction policy
5. 将 `useOverlayManager` 升级为 overlay orchestration
6. 将 `useChromeVisibility` 升级为 mode-aware policy engine

---

## Recommended Immediate Next Task

如果只选一个最值得开始的方向，建议先做：

`PLAYER-19 — 移动端与窄屏 Focused Hardening`

范围建议包括：

- safe-area / orientation 兼容
- portrait 双击 seek 策略
- mobile chrome visibility 细调
- keyboard / panel accessibility 的最小补强

原因是这几项：

- 用户可感知收益高
- 不需要立刻开启新一轮大重构
- 能更真实地暴露“下一阶段架构调整”还剩哪些必要工作

---

## Bottom Line

当前播放器已经不再处于“命中系统缺失”的阶段。

它现在更准确的状态是：

- **桌面端**：功能完整，交互主链路已稳定，但仍缺少更成熟的 hover / accessibility / transitional state 策略
- **移动端**：已经可用，但还不是一等输入系统，仍明显弱于 YouTube 的移动端行为成熟度

因此，下一步不建议直接继续大拆。

更合理的节奏是：

1. 先做一轮 `Focused Hardening`
2. 再进入 `Next Architecture Iteration`

这样既不会回到补丁式修 bug，也不会过早开启下一轮过大的架构工程。
