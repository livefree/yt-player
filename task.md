# Task: 按钮悬浮分层 + 音量滑动条修复

## Status
done

## Description

### 1. Play/Next 按钮悬浮与背景分层

Play/Next 按钮的 background（32px）和悬浮变色在同一图层，与右侧组内按钮视觉语言不一致。
使用 `box-shadow` 将视觉背景扩展为 40px（外环），内部 32px 仍响应悬浮变色。外环颜色不随悬浮改变。
音量区 / 右侧组内按钮重置为 `box-shadow: none`（组 pill 提供背景）。

### 2. 音量滑动条全面修复

- 水平条长度增加 20%：panel 60px → 72px，track 52px → 62px（margin: 0 5px）
- handle 定位修复：旧方案 `left: Xpx + margin-left: -6px` 在 0%/100% 溢出；
  新方案 `left: ${effectiveVolume * 100}%` + CSS `transform: translate(-50%, -50%)`，5px margin 留出 handle 4px 半径的空间，panel `overflow: hidden` 不裁剪
- handle 尺寸：12px → 8px（匹配进度条红点默认大小 13×0.6≈8px），去掉 margin-left: -6px
- 去掉悬浮放大规则

## Acceptance Criteria
- [ ] Play/Next 悬浮：外环 40px 背景，内圆 32px 变深
- [ ] 右侧组 / 音量区按钮：无 box-shadow，保持原有 hover 行为
- [ ] 静音时 handle 在最左侧，不溢出左边
- [ ] 100% 音量时 handle 在最右侧，不溢出右边
- [ ] 音量水平条长度约 72px
- [ ] handle 直径 8px，无悬浮放大
- [ ] `npm run typecheck` 和 `npm test` 全部通过
