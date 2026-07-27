# Design

## Context

该 change 只改变代码组织与依赖方向，不改变可观察行为。内容编译器将提供标准化文章输入，Blog 模块负责查询和派生视图。

## Goals

- 纯逻辑可脱离 Astro 进行测试。
- `astro:content` 只有一个 adapter 入口。
- 页面只依赖稳定公共 API。
- 消除 BlogService 单文件热点和深层导入。

## Non-Goals

- 不引入复杂 Repository class hierarchy。
- 不引入全局状态管理。
- 不改变缓存语义和业务输出。

## Architecture and Boundaries

```text
src/modules/blog/
├── domain/
│   ├── model.ts
│   ├── normalize.ts
│   ├── ordering.ts
│   ├── selectors.ts
│   └── errors.ts
├── application/
│   ├── ports.ts
│   └── blog-service.ts
├── infrastructure/
│   └── astro-content-repository.ts
└── index.ts
```

依赖规则：

```text
pages/components → modules/blog/index.ts
application → domain + ports
infrastructure → domain + astro:content
domain → no Astro, no browser, no filesystem
```

## Data and Artifact Flow

```text
AstroContentRepository.list()
  → NormalizedPost[]
  → application query functions
  → pages/components
```

## Decisions

### 1. 函数和小对象优先于层层 class

博客规模较小，使用 interface port + plain functions 提供可测试边界，避免形式化过度。

### 2. 模块 `index.ts` 是唯一外部入口

内部文件可自由重组，外部调用契约稳定。通过 lint/import test 阻止深层导入。

### 3. 兼容 façade 渐进迁移

旧 `BlogService` 在过渡期转发到新模块，逐页迁移后删除。每一步都保持构建成功。

### 4. 缓存归属 infrastructure/application composition

纯领域函数不持有缓存。一次构建内的 collection promise 或结果缓存位于 adapter/façade，避免测试状态污染。

## Alternatives Considered

- 继续扩展 BlogService：热点和隐含状态继续增长。
- DDD 完整聚合/仓储体系：对小型静态博客过重。
- 页面直接读取 collection：重复逻辑和 URL 契约会再次扩散。

## Failure Modes

- selector 顺序变化 → characterization tests 固定。
- cache 引起跨测试污染 → 无模块级可变状态，显式 reset 或 request/build scope。
- 循环依赖 → import boundary 检查。
- façade 永久残留 → tasks 明确最终删除条件。

## Security and Integrity

模块只处理已由内容编译器验证的标准模型；仍对不变量使用断言，异常不得静默返回空集合。

## Observability

构建日志只输出汇总和异常，不在领域函数中写日志。adapter 将错误附加源文件上下文。

## Test Strategy

- Characterization tests 覆盖当前标题、category、tags、排序和 selector。
- 纯领域单测不启动 Astro。
- 页面 route manifest 和抽样 HTML 做回归。
- import boundary 和循环依赖检查进入 CI。

## Migration Plan

1. 提取类型和纯函数，旧服务继续调用。
2. 创建 repository adapter。
3. 创建 application service 和公共入口。
4. 逐页迁移 imports。
5. 删除旧实现和 façade。

## Rollback Design

每一批提取保持旧 façade 可用。出现行为差异时回滚当前批次，无需恢复内容或基础设施。

## Risks and Mitigations

- [隐含契约未覆盖] → 先写 characterization tests，再移动代码。
- [目录层次增加阅读成本] → 只保留必要层，并提供 `index.ts` 和模块 README。

## Open Questions

无。具体函数命名以当前公开调用为准，避免无意义重命名。
