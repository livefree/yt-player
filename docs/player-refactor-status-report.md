# YTPlayer Refactor Status Report

## Summary

截至当前支线 `codex/player-worktree`，播放器已经从“单一重组件 + 分散副作用 + 局部移动端补丁”的形态，推进到“媒体核心 / 布局决策 / 输入路由 / overlay orchestration / 视图组装”这几层开始成形的状态。

这轮重构的目标不是外观翻新，而是把播放器从“难改但能跑”推进到“可持续演进、可移植、可验证”的工程状态。公开 API 维持不变，主要变化集中在 `src/player/` 内部边界和回归测试网。

## Completed Work

### 1. 回归保护网

- 回归测试已扩展到 70 个用例
- 已覆盖 source loading、HLS、autoplay fallback、gesture seek、progress scrub、panel toggle、overlay contract、移动端 layout / chrome policy 等关键流
- 当前重构不是在“裸奔”状态下继续改，而是在测试保护下推进

### 2. 主组件减重

[`/Users/livefree/projects/yt-player-worktree/src/player/Player.tsx`](/Users/livefree/projects/yt-player-worktree/src/player/Player.tsx) 已从主要承担所有副作用和输入逻辑的重组件，转向更薄的组装层。核心副作用已拆分到 hooks：

- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useSourceLoader.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useSourceLoader.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useProgressInteractions.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useProgressInteractions.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useGestureControls.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useGestureControls.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useChromeVisibility.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useChromeVisibility.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useKeyboardShortcuts.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useKeyboardShortcuts.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useSystemIntegrations.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useSystemIntegrations.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useLayoutDecision.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useLayoutDecision.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useInputRouter.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useInputRouter.ts)
- [`/Users/livefree/projects/yt-player-worktree/src/player/hooks/useOverlayManager.ts`](/Users/livefree/projects/yt-player-worktree/src/player/hooks/useOverlayManager.ts)

### 3. 自适应布局层

布局系统已不再只是“桌面 DOM + CSS 媒体查询”。

已完成：

- `desktop / tablet-touch / phone-touch` 明确区分
- 桌面端 `default / short-height / medium-width / narrow-width` profile
- 控件从固定位置渲染，转向 slot 驱动渲染
- `episodes` 在手机端提升为主导航入口之一
- 平板与手机不再共享同一套 touch 控件入口

### 4. 输入路由层

输入系统已不再依赖单个整屏透明层去兜底所有点击。

已完成：

- gesture zones 显式化
- zone routing 升级为 intent routing
- `desktop-pointer / tablet-touch / phone-touch` 输入策略显式输出
- 手机端恢复左右双击 seek
- 移动端伪音量手势已被降级，不再作为正式能力路径

### 5. Chrome Visibility Policy

chrome 显隐已从局部计时器，升级为可扩展的策略模型。

已完成：

- `hover-autohide / touch-autohide / touch-persistent-paused`
- phone 与 tablet 的暂停态行为分离
- tablet-touch 独立 autohide delay
- `chromeVisibilityPolicy` 已成为显式 contract，而不是 hook 内自行推导

### 6. Overlay Orchestration

overlay 系统已从“按优先级排序的可见列表”推进到第一轮编排层。

已完成：

- fatal error 会抑制 spinner / captions / prompt / feedback overlays
- panel 打开会抑制 `bezel / seek-indicator / touch-seek / unmute prompt`
- captions 具备 placement policy
- unmute prompt 具备 placement policy
- top-right panel 打开时，prompt 会做横向避让
- `stackMode` 已显式化
- `overlayLayout` 已作为统一 contract 输出给视图层

### 7. 视图层与面板层

部分高复杂 JSX 已拆到独立组件：

- [`/Users/livefree/projects/yt-player-worktree/src/player/components/ProgressBar.tsx`](/Users/livefree/projects/yt-player-worktree/src/player/components/ProgressBar.tsx)
- [`/Users/livefree/projects/yt-player-worktree/src/player/components/SettingsPanel.tsx`](/Users/livefree/projects/yt-player-worktree/src/player/components/SettingsPanel.tsx)
- [`/Users/livefree/projects/yt-player-worktree/src/player/components/EpisodesPanel.tsx`](/Users/livefree/projects/yt-player-worktree/src/player/components/EpisodesPanel.tsx)
- [`/Users/livefree/projects/yt-player-worktree/src/player/components/ControlSlot.tsx`](/Users/livefree/projects/yt-player-worktree/src/player/components/ControlSlot.tsx)

### 8. 稳定性修复

已修复的一批关键问题包括：

- 切换选集后错误静音
- `Tap to unmute` 与真实音频状态脱节
- `Tap to unmute` 提示层命中异常
- loading 被误判为 generic error
- 顶部迁移按钮被 gesture 层覆盖
- settings 二次点击关闭不稳定
- 控制栏 `play / next / episodes` 顺序与 reveal 交互异常
- 边缘 tooltip 裁切

## Architecture State

当前可以认为播放器已有以下内部骨架：

- Media / source control
- Layout decision
- Input routing
- Chrome visibility policy
- Overlay orchestration
- Slot-based view composition

这意味着后续继续做移动端产品化、竖视频策略、hover contract 或更细的系统集成降级，不需要再回到“大组件里加条件”的旧模式。

## Remaining Gaps

当前仍未完成的，不应被误判为“已完全对齐 YouTube”：

- 竖视频 / 内容比例驱动布局策略尚未进入实现
- 更完整的 overlay layout orchestration 仍有深化空间
- 桌面 hover contract 还未统一
- 小屏手机端的产品化细节仍可继续打磨
- 移动端、平板端的视觉与操作细节还需要真实设备验证

## Current Assessment

如果按工程成熟度粗略判断：

- 架构分层：明显完成了一大轮，已经可持续维护
- 桌面端：进入稳定可维护阶段
- 平板端：已从桌面降级版，推进到独立 touch-first 策略
- 手机端：已从补丁式兼容，推进到有明确产品策略的实现阶段

当前更适合把这条支线看作：

“播放器架构和跨终端策略已经建立，接下来需要真实设备验证和第二轮产品化收敛。”

## Related Docs

- [`/Users/livefree/projects/yt-player-worktree/docs/player-refactor-plan.md`](/Users/livefree/projects/yt-player-worktree/docs/player-refactor-plan.md)
- [`/Users/livefree/projects/yt-player-worktree/docs/player-adaptive-layout-and-hit-testing-plan.md`](/Users/livefree/projects/yt-player-worktree/docs/player-adaptive-layout-and-hit-testing-plan.md)
- [`/Users/livefree/projects/yt-player-worktree/docs/player-post-refactor-gap-audit.md`](/Users/livefree/projects/yt-player-worktree/docs/player-post-refactor-gap-audit.md)
- [`/Users/livefree/projects/yt-player-worktree/docs/player-device-interaction-strategy.md`](/Users/livefree/projects/yt-player-worktree/docs/player-device-interaction-strategy.md)
- [`/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md`](/Users/livefree/projects/yt-player-worktree/docs/player-system-integration-matrix.md)
