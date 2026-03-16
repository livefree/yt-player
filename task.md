# Task: 框架初始化验证

## Status
pending

## Description
这是框架搭建后的第一个验证任务。

确认所有工程配置正确、模块结构可以正常编译，以及 dev preview 可以在浏览器中运行。

## Acceptance Criteria
- [ ] `npm run typecheck` 退出码为 0（无 TypeScript 错误）
- [ ] `npm run lint` 退出码为 0（无 ESLint warnings）
- [ ] `npm test` 退出码为 0（所有基础测试通过）
- [ ] `npm run build` 退出码为 0，`dist/` 目录生成 `index.js`、`index.cjs`、`index.d.ts`
- [ ] `npm run dev` 启动后浏览器可以看到播放器界面

## Constraints
- 不修改 `src/player/` 中的业务逻辑
- 仅修复编译/类型错误，不做功能改动

## Notes
若有 TypeScript 错误，优先修复类型定义，不要使用 `@ts-ignore` 抑制错误。
