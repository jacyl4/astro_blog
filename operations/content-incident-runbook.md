# 内容故障手册

## 诊断入口

1. 查看 `.build/diagnostics/content.json` 的错误代码、源路径与行列。
2. 核对 `.build/evidence/content-head.txt` 是否等于请求的 `CONTENT_SHA`。
3. 核对 content manifest 的文章数、permalink、source/output hash。
4. 只检查 `Blog/` 的结构与 frontmatter；故障报告不得复制文章正文。

## 常见故障

| 现象 | 处理 |
| --- | --- |
| 缺少 `id`/`slug` | 在源仓库补齐稳定字段并提交；不得让 CI 自动写回 |
| 重复 id/slug | 由作者选择唯一稳定身份；已发布 slug 变更需 redirect |
| wikilink 歧义/缺失 | 改为可唯一解析的目标或普通公网链接 |
| 本地附件/transclusion/block ref | 移除或迁移为公网静态资源 |
| SHA 不匹配 | 终止 pipeline；检查 job token clone/fetch，不得退回分支 HEAD |
| 删除文章仍出现在产物 | 清空候选 `.build/content` 后重新 prepare；验证 atomic swap |

修复必须产生新的内容 SHA。不要修改 Astro 仓库里的 legacy 镜像来绕过编译失败。
