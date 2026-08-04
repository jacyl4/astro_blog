# Design

## Context

外部路由机制可能暴露 Astro page events、Swup hooks 或二者适配事件。业务控制器不应分别订阅所有外部事件，而应依赖一个内部运行时。

## Goals

- 单一生命周期入口。
- 控制器副作用完全可清理。
- 首次加载、切页和 history navigation 一致。
- 快速导航无竞态。

## Non-Goals

- 不替换现有页面导航方案。
- 不将静态 UI 改造成 SPA store。
- 不统一所有纯组件逻辑，只处理页面级副作用。

## Architecture and Boundaries

```text
src/client/runtime/
├── lifecycle.ts
├── controller.ts
├── registry.ts
└── controllers/
    ├── navigation-controller.ts
    ├── toc-controller.ts
    └── footnote-controller.ts
```

接口：

```ts
interface PageController {
  mount(context: PageContext): void | Promise<void>;
  destroy(): void | Promise<void>;
}
```

`PageContext` 包含 root、URL、pageId 和一个页面级 AbortSignal。controller 需要额外请求时可派生 signal。

## Data and Artifact Flow

```text
external router event
  → lifecycle.beforeSwap()
      → abort page signal
      → destroy controllers reverse order
  → DOM swap
  → lifecycle.pageReady()
      → create PageContext
      → mount controllers order
```

## Decisions

### 1. 外部事件只在 lifecycle.ts 绑定一次

其余模块不直接监听 `DOMContentLoaded`、Astro 或 Swup 页面事件。

### 2. destroy 逆序执行

后挂载、依赖更上层 DOM 的 controller 先清理，行为接近资源栈。

### 3. 每次页面创建新的 PageContext

禁止模块级可变 current page state，避免跨导航泄漏。

### 4. resize 使用单一节流 dispatcher

controller 可订阅内部 viewport event，回调只做同步布局计算或安排动画帧，不触发数据 fetch。

## Alternatives Considered

- 每个脚本自行防重：无法统一取消和验证资源数量。
- 全局 event bus：增加另一套状态系统，当前规模不需要。
- 重写为框架 island：会扩大变更和 bundle，非必要。

## Failure Modes

- 首次 load 事件遗漏 → 启动函数显式处理 `document.readyState`，但只通过 lifecycle 调用一次。
- destroy 异常阻断后续清理 → 每个 destroy 独立 try/finally，汇总错误。
- controller mount 重入 → registry 维护 active generation 并在开发环境断言。
- Observer 目标 DOM 已删除 → destroy 对不存在目标安全幂等。

## Security and Integrity

客户端运行时不拼接不可信 HTML。任何 controller 写 DOM 的内容来自 Astro 已渲染结构或经过安全策略的数据。

## Observability

开发模式暴露只读 debug snapshot：generation、active controllers、listener counters、observer counters、active requests。生产只在异常时结构化记录。

## Test Strategy

- Controller unit test：mount/destroy 幂等、监听器和 Observer 清理。
- Integration：模拟 lifecycle event 顺序。
- Playwright：直接加载、点击切页、后退/前进、快速连点和 resize。
- 浏览器性能 trace：20 次切页后资源数量稳定。

## Migration Plan

1. 建立接口和 lifecycle adapter，但旧脚本仍运行。
2. 逐个迁移 Navigation、TOC、脚注。
3. 每迁移一个就删除对应旧事件绑定。
4. 移除全局标记和重复初始化逻辑。

## Rollback Design

每个 controller 独立迁移提交。出现退化时回滚该 controller，保留 lifecycle 基础并暂时调用旧初始化函数。

## Risks and Mitigations

- [实际事件模型与报告不同] → 第一任务从源码和浏览器 trace 确定权威事件。
- [debug counter 本身干扰] → 仅开发构建开启，测试以网络和 DOM 结果为主。

## Open Questions

权威外部事件名称在实施时按当前 `@swup/astro` 和 Astro 配置确认，设计只固定内部接口。
