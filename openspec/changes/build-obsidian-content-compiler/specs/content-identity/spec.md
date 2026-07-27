## Purpose

将文章永久身份、公开 URL 和展示标题分离，确保重命名文件、调整目录或修改标题时不会无意改变外部链接。

## ADDED Requirements

### Requirement: 公开文章具有永久身份
系统 SHALL 为每篇公开文章读取稳定且唯一的 `id`，该值不从可变标题动态重新生成。

#### Scenario: 修改文章标题
- **WHEN** 已发布文章只修改 `title`
- **THEN** 文章 `id` 和公开 URL 保持不变

### Requirement: 公开 slug 显式且唯一
系统 MUST 在严格模式要求公开文章具有显式 `slug`，并验证全站唯一性。

#### Scenario: 发布文章缺少 slug
- **WHEN** 严格模式处理缺少 `slug` 的公开文章
- **THEN** 编译失败并提示添加永久 slug

### Requirement: 兼容模式支持历史迁移
系统 SHALL 在迁移期允许从现有 URL 映射生成临时身份字段，同时输出待修复清单。

#### Scenario: 历史文章缺少 id
- **WHEN** 兼容模式处理已存在 URL 映射但缺少 id 的文章
- **THEN** 编译继续并在迁移报告中生成稳定补录建议

### Requirement: slug 冲突不自动分配后缀
系统 MUST 在发现重复 slug 时失败，不得依据文件遍历顺序自动追加序号。

#### Scenario: 重复 slug
- **WHEN** 两篇公开文章声明相同 slug
- **THEN** 编译失败并要求作者显式修改其中一篇
