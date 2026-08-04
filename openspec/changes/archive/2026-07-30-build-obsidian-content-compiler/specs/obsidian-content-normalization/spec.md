## Purpose

将 Obsidian 笔记语法确定性转换为 Astro 可消费的标准内容，使博客渲染层不再理解内容仓库的编辑器方言。

## ADDED Requirements

### Requirement: 编译器使用不可变源输入
系统 MUST 将内容仓库目录作为只读输入，并将全部生成内容写入独立构建目录。

#### Scenario: 编译成功
- **WHEN** 编译器处理内容源目录
- **THEN** 源目录的文件内容、时间戳和 Git 状态保持不变

### Requirement: 支持标准 Markdown 与 GFM
系统 SHALL 保留标题、段落、列表、表格、任务列表、删除线、代码块、引用、脚注和外部链接的语义。

#### Scenario: GFM fixture 编译
- **WHEN** 输入包含表格、任务列表和 fenced code block
- **THEN** 输出经过 Astro 渲染后保持对应结构和代码语言信息

### Requirement: 转换 Obsidian wikilink
系统 SHALL 将可唯一解析的 wikilink 转换为目标文章的公开 permalink，并保留别名和 heading fragment。

#### Scenario: 普通短链接
- **WHEN** 文章包含 `[[目标文章]]`
- **THEN** 输出链接指向目标文章的永久 URL

#### Scenario: 带别名和标题
- **WHEN** 文章包含 `[[目标文章#章节|显示文字]]`
- **THEN** 输出链接使用显示文字并指向目标永久 URL 的章节 fragment

### Requirement: 转换 Obsidian callout
系统 SHALL 将受支持的 Obsidian callout 转换为稳定、可访问的标准结构。

#### Scenario: NOTE callout
- **WHEN** 输入包含 `> [!NOTE]` callout
- **THEN** 输出包含可由统一 Astro 组件或 CSS 渲染的 callout 类型和正文

### Requirement: 输出确定性
系统 MUST 对相同的源提交、编译器版本和配置生成字节一致的标准内容与 manifest，构建时间字段除外。

#### Scenario: 重复编译
- **WHEN** 在两个干净目录中编译同一个 content SHA
- **THEN** 内容文件 hash、路由和 content manifest hash 完全一致
