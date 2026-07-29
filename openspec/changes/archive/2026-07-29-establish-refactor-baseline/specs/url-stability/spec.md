## Purpose

保护已经公开传播和被搜索引擎收录的文章地址，将 URL 视为外部永久契约，并在重构期间阻止无意漂移。

## ADDED Requirements

### Requirement: 未批准的 URL 改变阻断构建
系统 MUST 将当前基线路由与候选构建路由进行比较，并阻断未附带迁移说明的删除或改变。

#### Scenario: 新增文章路由
- **WHEN** 候选构建仅新增新的文章 URL
- **THEN** 路由检查通过并记录新增项

#### Scenario: 既有文章 URL 消失
- **WHEN** 基线中的文章 URL 不再出现在候选构建中且没有 redirect 迁移记录
- **THEN** 路由检查失败并列出缺失 URL

#### Scenario: 已批准的 URL 迁移
- **WHEN** URL 变化附带旧路径到新路径的显式迁移映射
- **THEN** 检查验证映射完整后允许继续

### Requirement: 重复 slug 立即失败
系统 SHALL 在构建期间检测所有公开文章 slug 的唯一性。

#### Scenario: 两篇文章使用相同 slug
- **WHEN** 内容集合中出现重复公开 slug
- **THEN** 构建失败并列出两个源文件
