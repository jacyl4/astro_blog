## 1. 内容语料盘点

- [ ] 1.1 以 `jacyl4/obsidian-digital:Blog/` 为唯一发布根，统计 Markdown 特性、frontmatter 字段、wikilink 和 callout
- [ ] 1.2 建立包含典型和异常内容的脱敏 fixture 集
- [ ] 1.3 记录当前每篇文章的源路径、URL、标题、分类和标签
- [ ] 1.4 将 `Blog/` 目录成员资格固化为公开规则，并加入禁止扫描 Vault 其他目录的测试

## 2. 编译器基础

- [ ] 2.1 创建 `tools/content-compiler` 模块与类型化 CLI
- [ ] 2.2 添加 Unified、remark-parse、remark-gfm、remark-frontmatter、remark-stringify 和 wikilink 插件依赖
- [ ] 2.3 实现配置加载、路径规范化和只读输入保护
- [ ] 2.4 实现结构化 diagnostics 类型、错误代码和 JSON 输出
- [ ] 2.5 实现临时输出目录与成功后的原子 swap

## 3. Inventory Pass

- [ ] 3.1 只扫描 `Blog/` 中的 Markdown/MDX 文件
- [ ] 3.2 解析 frontmatter 并拒绝越出 `Blog/` 的引用
- [ ] 3.3 建立 source/id/slug/permalink 多索引
- [ ] 3.4 检测重复 id、slug 和 basename 歧义
- [ ] 3.5 检测本地附件引用并以不支持诊断阻断
- [ ] 3.6 输出 compat 迁移报告

## 4. Transform Pass

- [ ] 4.1 实现标准 Markdown/GFM round-trip fixture
- [ ] 4.2 封装 wikilink parser adapter 并接入 permalink resolver
- [ ] 4.3 支持普通、别名、heading wikilink
- [ ] 4.4 为图片、音频、视频和 PDF 本地引用输出可定位的不支持诊断
- [ ] 4.5 实现 Obsidian callout AST transformer
- [ ] 4.6 对不支持的 transclusion、block reference 和插件语法输出明确诊断
- [ ] 4.7 实现规范化 Markdown 写出和内容 hash

## 5. 身份与 schema 迁移

- [ ] 5.1 定义公开文章 id、slug、title、created、updated、tags 和 category schema；公开性由 `Blog/` 目录决定
- [ ] 5.2 从现有 URL 映射生成历史 id/slug 补录建议
- [ ] 5.3 为内容仓库提供一次性迁移脚本或报告，不在 CI 自动写回源文件
- [ ] 5.4 逐批修复重复 slug、歧义链接和不支持的本地附件引用
- [ ] 5.5 将生产模式从 compat 切换为 strict

## 6. Astro 集成

- [ ] 6.1 将 `.build/content` 接入 Astro Content Collections
- [ ] 6.2 保留 legacy adapter 作为观察期回退开关
- [ ] 6.3 确认 Astro 页面只消费标准化 frontmatter 和 Markdown
- [ ] 6.4 生成 content manifest
- [ ] 6.5 将 manifest hash 接入 build manifest

## 7. 测试和性能

- [ ] 7.1 为每种 wikilink、callout、本地附件拒绝和错误情况编写单测
- [ ] 7.2 为 `Blog/` 发布边界、歧义和重复身份编写集成测试
- [ ] 7.3 执行两目录重复编译并比较所有 hash
- [ ] 7.4 编译全部现有内容并与基线路由和 HTML 抽样比较
- [ ] 7.5 记录全部内容的编译时间、峰值内存和输出大小

## 8. 文档和上线

- [ ] 8.1 编写内容作者 frontmatter 和链接规范
- [ ] 8.2 编写本地 preview、validate 和 compile 使用说明
- [ ] 8.3 在 staging 切换到新内容输出并完成抽样
- [ ] 8.4 观察至少三次内容提交后删除 legacy adapter
- [ ] 8.5 执行 `/opsx:verify build-obsidian-content-compiler` 并归档
