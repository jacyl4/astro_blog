## ADDED Requirements

### Requirement: Blog 模块提供唯一公共入口
系统 SHALL 通过 `src/modules/blog/index.ts` 暴露页面与组件所需的 Blog 能力，并禁止模块外代码深层导入 Blog 模块内部实现。

#### Scenario: 页面只依赖公共入口
- **WHEN** CI 扫描 `src/pages/**`、`src/components/**` 和其他模块的 Blog import
- **THEN** 所有 Blog import 只指向 `src/modules/blog` 公共入口，且不存在对 `domain`、`application` 或 `infrastructure` 子目录的深层导入

### Requirement: Blog 领域层与 Astro 框架隔离
系统 MUST 保持 `src/modules/blog/domain/**` 为纯 TypeScript 领域逻辑，不依赖 Astro runtime、浏览器全局、文件系统或网络。

#### Scenario: 领域测试脱离 Astro 运行
- **WHEN** 在未启动 Astro runtime 的测试进程中执行 Blog 领域单元测试和 import boundary 检查
- **THEN** 测试成功，且领域目录不存在 `astro:*`、浏览器全局、文件系统或网络依赖

### Requirement: Content Collection 访问集中于适配器
系统 SHALL 仅通过 Blog infrastructure adapter 访问 `astro:content`，应用服务和领域逻辑不得直接调用 `getCollection()`。

#### Scenario: 框架访问边界唯一
- **WHEN** CI 扫描 Blog 模块与页面中的 `astro:content` 和 `getCollection()` 使用
- **THEN** Blog 内容集合访问只存在于指定 infrastructure adapter，页面与应用服务中不存在直接访问

### Requirement: 模块化重构保持外部行为
系统 MUST 保持基线中的公开 URL、文章顺序、分类、标签、归档以及页面可见数据不变，任何差异均阻断该 change。

#### Scenario: 新旧实现特征对比
- **WHEN** 使用相同内容输入分别执行旧 BlogService characterization tests 与新 Blog 模块测试，并比较 route manifest 和抽样页面
- **THEN** selector 结果、排序、公开 URL 与抽样页面可见数据完全一致
