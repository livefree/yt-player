# YTPlayer Device Interaction Strategy

## Purpose

本文档用于定义 `YTPlayer` 在不同终端上的目标交互策略。

它不是差距清单，也不是实现任务拆分，而是产品与工程共同使用的策略基线。

回答的问题是：

- 桌面、大尺寸平板、小尺寸手机三类终端应当分别如何交互
- 哪些控件在不同终端是核心能力，哪些应当折叠
- `episodes` 在连续剧 / 片单场景中，应该处于什么导航地位
- 工程上应当如何区分“共用媒体核心”和“终端专属交互策略”

---

## Core Principle

播放器不是“同一套桌面 UI 缩放到不同屏幕”。

更合理的工程思路是：

1. 共用一个媒体核心
2. 为不同终端定义不同的输入策略
3. 再由布局策略决定控件如何呈现

也就是说，应当先区分：

- pointer-first 还是 touch-first
- 沉浸观看还是高频操作
- 单视频还是带强导航需求的连续剧 / 片单

然后才谈按钮放在哪。

---

## Product Positioning

当前播放器不是纯 YouTube clone。

它的产品方向更准确地说是：

- 保留 YouTube 风格的主观看体验
- 在此基础上强化连续剧 / 片单的 `episodes` 导航能力

这意味着：

- `episodes` 不是一个普通附加按钮
- 在部分终端上，`episodes` 的优先级应当高于 `theater / pip / airplay`
- 尤其在手机端，`episodes` 应视为核心内容导航入口，而不是底部控制栏里的附属动作

---

## Device Classes

建议在策略层明确区分 3 类终端：

### 1. Desktop Pointer

典型环境：

- 桌面浏览器
- 鼠标 / 触控板为主
- hover 可用
- 屏幕空间较充裕

### 2. Tablet Touch

典型环境：

- 大尺寸平板
- 主要输入为触摸
- 视觉空间接近桌面
- 不能依赖 hover 作为唯一交互路径

### 3. Phone Touch

典型环境：

- 小尺寸手机
- 触摸优先
- 控件密度必须收缩
- 主目标是保证高频路径清晰，而不是保留所有桌面按钮

---

## Shared Media Core

以下能力跨终端共用，不应按终端分叉实现：

- play / pause
- seek / scrub
- currentTime / duration / buffered
- source loading / HLS lifecycle
- subtitle activation
- playback rate
- mute / volume state
- fullscreen / system integration capability detection

差异应该落在：

- 输入策略
- 控件优先级
- 布局与折叠策略
- overlay 呈现策略

---

## Control Priority Model

后续工程建议为控件定义终端无关的优先级，再由各终端策略决定如何呈现。

### P0 — 必须高可见

- `play`
- `seek / progress`
- `fullscreen`
- `episodes`

### P1 — 高频但可折叠

- `subtitles`
- `settings`
- `time`

### P2 — 场景相关

- `chapter`
- `next`
- `playback rate`

### P3 — 低频 / 平台相关

- `pip`
- `theater`
- `airplay`

注意：

- `episodes` 在本项目中应提升到 `P0`
- 这是和原始 YouTube 思路的一个关键差异，因为你的播放器承担了连续剧/片单导航职责

---

## Desktop Strategy

### Interaction Goal

桌面端目标是：

- 保持 YouTube 风格完整控制栏
- 允许更丰富的 hover 和 tooltip
- 提供完整的高频与中频控制
- 强化 `episodes` 入口，但不破坏原有观看节奏

### Input Model

- `hover` 是一等能力
- `click` 是主操作
- `keyboard shortcuts` 必须完整
- progress hover 预览、tooltip、reveal 行为都可以保留

### Control Strategy

建议桌面端常驻：

- `play`
- `next`
- `episodes`
- `volume`
- `time`
- `chapter`
- `subtitles`
- `settings`
- `fullscreen`

按空间或场景显示：

- `theater`
- `pip`
- `airplay`

### Episodes Placement

桌面端 `episodes` 可继续作为控制栏显式入口。

如果存在 `next`，允许保留 `next + episodes` 的组合关系，因为桌面有 hover 条件和足够精细的命中。

### Engineering Guidance

- 桌面端可以保留更多 hover-based affordance
- 但 hover 不能成为未来平板端的唯一交互来源

---

## Tablet Strategy

### Interaction Goal

大尺寸平板目标是：

- 视觉上接近桌面
- 交互上坚持 touch-first
- 不依赖 hover
- 保留较完整控制集，但入口要更直接、更易点

### Input Model

- `tap` 是主操作
- `double tap seek` 建议保留
- progress touch scrub 必须稳定
- hover reveal 不应作为唯一入口

### Control Strategy

建议平板端常驻：

- `play`
- `episodes`
- `time`
- `subtitles`
- `settings`
- `fullscreen`

按场景显示：

- `next`
- `chapter`

建议折叠进设置或二级面板：

- `pip`
- `theater`
- `airplay`

### Episodes Placement

平板端 `episodes` 应当是显式入口。

不建议继续依赖桌面式 hover-reveal。

更适合的方式：

- 固定在顶部或底部可见位置
- 或与 `settings` 并列成为顶部动作入口

### Engineering Guidance

- 平板应当被视为独立策略层，而不是“桌面 CSS 缩小版”
- 允许布局接近桌面，但输入模型必须与手机共享 touch-first 规则

---

## Phone Strategy

### Interaction Goal

小尺寸手机目标是：

- 保证核心观看路径最清晰
- 减少控制栏拥挤
- 强化手势与少量核心按钮
- 把 `episodes` 提升为内容导航主入口

### Input Model

- `tap` 显示 / 隐藏 chrome
- `double tap` 左右 seek
- `drag / scrub` 用于进度控制
- 控件数量必须少，触摸目标必须大

### Control Strategy

建议手机端常驻：

- `play`
- `progress`
- `episodes`
- `fullscreen`

建议保留但放到次级入口：

- `subtitles`
- `settings`
- `time`

建议折叠或默认隐藏：

- `chapter`
- `next`
- `pip`
- `theater`
- `airplay`

### Episodes Placement

手机端 `episodes` 不能只是桌面控制栏遗留按钮。

建议它成为以下之一：

- 顶部主动作入口
- 底部主控制栏的高优先级按钮
- 或明显的抽屉 / sheet 入口

核心原则只有一个：

在连续剧 / 片单场景里，用户必须能在手机端快速找到并打开选集。

### Engineering Guidance

- 手机端布局不应追求桌面控件完整性
- 应追求“少量稳定入口 + 清晰手势心智模型”
- `episodes` 比 `theater / pip / airplay` 更值得争取常驻位置

---

## Strategy Difference Summary

### Desktop

- 完整控制栏
- hover 可作为一等路径
- `episodes` 是高可见增强入口

### Tablet

- 布局可接近桌面
- 交互必须 touch-first
- `episodes` 显式可见，不依赖 hover

### Phone

- 核心按钮最少化
- 手势优先
- `episodes` 升格为主导航入口

---

## Layout Policy Implications

这份策略文档对后续布局层有几个直接要求：

### 1. 不能只有 `mode -> fixed slots`

后续布局层需要同时表达：

- 终端类别
- 可用宽度
- 可用高度
- 是否全屏
- 是否连续剧 / 片单场景

### 2. 必须支持 control priority / collapse policy

不是所有控件都要争常驻。

布局层需要能回答：

- 当前终端哪些控件常驻
- 哪些控件进入二级面板
- 哪些控件在空间不足时被牺牲

### 3. `episodes` 不能再被当作普通可选按钮

对于连续剧 / 片单场景，布局层应当允许 `episodes` 拥有独立优先级，而不是仅仅跟随 `next` 或桌面控制栏结构

---

## Input Policy Implications

对输入层也有直接要求：

### Desktop Pointer

- hover feedback
- click precision
- keyboard completeness

### Tablet Touch

- touch-first routing
- no hover dependency
- direct access to key controls

### Phone Touch

- double-tap seek
- stable scrub behavior
- minimal persistent chrome
- `episodes` 快速入口

这意味着下一阶段的 `useInputRouter` 不应只产出 zone，还应产出更明确的 device/input policy。

---

## Recommended Near-Term Product Decisions

在真正进入下一轮架构开发前，建议先冻结以下产品决策：

1. 手机端是否保留 `next` 常驻按钮  
建议：不常驻，交由 `episodes` 面板承担连续导航。

2. 手机端是否支持双击左右 seek  
建议：支持，作为核心触摸心智模型。

3. 手机端是否保留 in-player volume 手势  
建议：默认不作为正式产品能力，避免跨浏览器不稳定。

4. 平板端 `episodes` 是否保持显式可见  
建议：保持，不依赖 hover。

5. 桌面端是否继续保留 `next + episodes` 组合关系  
建议：可以保留，但仅限 pointer-first 策略。

---

## Recommended Next Step

如果要把这份策略文档转成开发工作，建议下一步不是直接大改，而是先开一个小阶段：

`PLAYER-20 — Focused Hardening Strategy Alignment`

范围建议：

- 将 portrait phone 的 `episodes` 入口提升为更高优先级
- 明确是否恢复 phone 端双击左右 seek
- 去除或降级移动端伪音量手势
- 为 tablet touch 模式去掉 hover 依赖

这样做的好处是：

- 先让现有架构开始符合终端策略
- 再决定下一轮更大的布局和输入系统演进

---

## Bottom Line

YouTube 的成熟工程思路不是：

- 一套播放器适配所有屏幕

而是：

- 一套媒体核心
- 多套终端交互策略
- 再加一套布局与命中系统去承载这些策略

对你的播放器而言，最关键的战略差异是：

`episodes` 在手机端和平板端必须被当作核心内容导航能力，而不是桌面播放器遗留出来的普通按钮。

这会直接决定下一阶段的布局优先级、输入模型和控件取舍方向。
