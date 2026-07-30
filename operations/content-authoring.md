# 内容作者与编译规范

## 发布边界

- 唯一内容仓库：`jacyl4/obsidian-digital`
- 唯一发布根：`Blog/`
- 只处理 `.md` 与 `.mdx`
- 编译器不得扫描、复制或报告 Vault 的其他目录，也不得修改源文件

## 必填 frontmatter

生产 `strict` 模式要求每篇文章至少包含：

```yaml
---
id: blog-稳定标识
slug: public-url-segment
title: 页面标题
created: 2026-07-27
tags:
  - 示例
---
```

`id` 与 `slug` 在全部文章中必须唯一。发布后不得因为重命名文件而修改它们。
`slug` 的变更属于公开 URL 迁移，必须同步修改 redirect allowlist 并评审。

可选字段：`updated`、`category`。未填写 `category` 时由 `Blog/` 下的首层目录推导。

## 支持与拒绝

- 支持标准 Markdown、GFM、普通/别名/heading wikilink 和 Obsidian callout。
- 不支持本地图片、音频、视频、PDF、transclusion、block reference 和 Dataview
  等插件语法；编译器会给出源文件定位并阻断发布。
- 静态公网资源必须使用明确的公网 URL。

## 本地命令

```bash
export CONTENT_CLONE_URL=/path/to/obsidian-digital
npm run content:prepare
npm run check

# 仅调试编译器时也可显式指定已检出的源目录
CONTENT_SOURCE_PATH=/path/to/obsidian-digital \
CONTENT_SUBDIR=Blog \
CONTENT_COMPILER_MODE=strict \
npm run content:compile
```

输出位于 `.build/content/blog`、`.build/content-manifest.json` 和
`.build/diagnostics/`。缺少显式内容源时编译器会失败，不会回退到应用仓库。
