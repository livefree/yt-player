# CLAUDE.md — Project Instructions for Claude Code

## 当前阶段：Phase 1 — HLS 支持 + IIFE 构建（为 LibreTV 集成）

### Phase 1 约束
- HLS 修改仅在 `Player.tsx` 的 `src` useEffect（第 ~454 行），不得改动其他播放逻辑
- IIFE 构建为独立 `vite.iife.config.ts`，不修改现有 `tsup.config.ts`
- 新增 `src/iife-entry.ts` 作为 IIFE 入口，暴露 `React`、`ReactDOM`、`YTPlayer`
- 允许新增 `hls.js` 作为 runtime 依赖（仅此一项例外）
- 每次有实质性改动，必须在 `DEVLOG.md` 末尾追加记录

---

## 每次会话首先执行

读取 `task.md`。若 Status 为 `done` 或文件不存在，停止并告知用户当前无活跃任务。

---

## 项目概览

这是一个 React 视频播放器组件库。

**首要目标**：可移植的网络播放器，嵌入其他视频网站
**次要目标**：独立网络播放器，提供视频链接或 API 即可播放

| 文件                           | 用途                      |
| ------------------------------ | ------------------------- |
| `src/player/Player.tsx`        | 主组件（精简 JSX 组合层） |
| `src/player/types.ts`          | 所有导出接口              |
| `src/player/Player.module.css` | 全部样式（CSS Modules）   |
| `src/player/utils/format.ts`   | 纯工具函数 + 常量         |
| `src/player/components/`       | 子组件（图标、按钮等）    |
| `src/player/hooks/`            | 自定义 hooks              |
| `src/index.ts`                 | 公开 API barrel export    |

---

## 任务执行流程

1. **读取 task.md** → 确认 Status 为 `pending` 或 `in-progress`
2. 将 Status 改为 `in-progress`
3. 创建 feature branch：`git checkout -b feat/<task-slug>`
4. 实现代码变更
5. 逐一验证（见下方命令），全部 exit 0
6. 在 task.md 中勾选所有 Acceptance Criteria
7. **Commit（必须）**：`feat/fix/chore/test(<scope>): <描述>`
8. 将 task.md 归档至 `tasks/done/YYYY-MM-DD-<slug>.md`
9. 合并回 master，删除 feature branch

---

## Git Commit 规范（强制）

**任何任务对项目文件的改动，在任务完成后必须立即 commit，不得遗漏。**

### 适用范围

以下类型的改动均需独立 commit，不可跳过：

| 改动类型    | scope 示例               | 示例 message                                             |
| ----------- | ------------------------ | -------------------------------------------------------- |
| 功能实现    | `player`、`hooks`、`css` | `feat(player): add touch scrub on progress bar`          |
| Bug 修复    | `player`、`css`、`build` | `fix(css): correct z-index for top-right chrome buttons` |
| 重构        | `player`、`types`        | `refactor(types): rename internal Panel type`            |
| 文档        | `readme`、`docs`         | `docs(readme): add integration guide`                    |
| 配置 / 工具 | `build`、`lint`、`test`  | `chore(build): update tsup target to es2020`             |
| 测试        | `test`                   | `test(player): add seek behavior test cases`             |
| 任务归档    | _(无 scope)_             | `chore: archive mobile-ux-enhancements task`             |

### Commit 时机

- **任务流程中**：步骤 7（验证全部通过后立即 commit）
- **任务流程外的临时改动**（如修复 bug、更新文档、调整配置）：改动完成后**当场 commit**，不积压到下一个任务

### Commit Message 格式

```
<type>(<scope>): <简短描述（中英均可，50 字符内）>

[可选正文：说明 why，不是 what]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### 禁止行为

- ❌ 改动文件后不 commit 就结束会话
- ❌ 将多个无关改动堆进同一个 commit
- ❌ 用 `--no-verify` 跳过 pre-commit hook
- ❌ 在验证命令未全部通过时 commit 源码文件（文档类改动除外）

---

## 验证命令（全部必须 exit 0）

```bash
npm run typecheck   # tsc --noEmit，检查类型错误
npm run lint        # eslint，0 warnings
npm test            # vitest run，所有测试通过
npm run build       # tsup，生成 dist/
```

---

## 文件规范

### TypeScript

- 公开类型用 `export interface`（不用 `type`）
- 内部类型用 `type`（如 `type Panel = ...`）
- 禁止 `any`；类型断言须加注释说明原因
- 函数组件返回类型由 TS 推断，无需标注

### React

- 仅使用函数组件
- Hooks 在组件体最顶部声明，先于所有派生值
- 子组件定义在 `Player.tsx` 之外的各自文件
- 内部子组件（Tooltip、Spinner 等）不从 `src/index.ts` 导出

### CSS Modules

- 导入：`import s from "./Player.module.css"`（或 `"../Player.module.css"`）
- 引用：`s.ytpSomething`（camelCase）
- 多类：`` `${s.classA} ${condition ? s.classB : ""}` ``
- 禁止内联样式，动态值除外（如 `transform: scaleX(progress)`）
- 新 CSS 变量遵循 `--ytp-*` 命名

### 常量

- 所有魔法数字在文件顶部 `// ─── Constants ────` 块中命名
- 不在 JSX 中内联数字

---

## 禁止事项

- ❌ 增加 runtime 依赖（仅 React 18+ 作为 peer dep）
- ❌ 删除 `"use client"` 第一行（Next.js App Router 兼容性）
- ❌ 使用 CSS-in-JS、Tailwind 或任何非 CSS Modules 方案
- ❌ 破坏 `src/index.ts` 的导出形状（`YTPlayer` 及四个类型）
- ❌ 将 `src/player/` 内部子组件添加到公开 API
- ❌ 拆分 `Player.module.css`（样式系统高度耦合）
- ❌ 提交时跳过验证命令

---

## Dev Preview

手动在浏览器中测试组件：

```bash
npm run dev
```

启动 Vite 服务 `dev/index.html`（端口 5173），直接从源码导入组件，无需构建。

---

## 公开 API（src/index.ts）

```typescript
export { YTPlayer } from "./player/Player";
export type {
  PlayerProps,
  SubtitleTrack,
  QualityLevel,
  Chapter,
} from "./player/types";
```

改变导出形状需要在 task.md 的 Constraints 中明确说明。
