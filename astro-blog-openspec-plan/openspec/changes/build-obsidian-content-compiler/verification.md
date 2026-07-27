# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 源输入只读 | Git diff | 编译前后执行 `git -C <content> status --porcelain` | 两次均为空 | CI log | Planned |
| 标准 Markdown | Golden test | `npm run test:unit -- content-compiler` | fixtures 全通过 | test report | Planned |
| Wikilink | Integration | 编译普通/别名/heading fixture | permalink 正确 | fixture output | Planned |
| 歧义失败 | Integration | 编译同名笔记 fixture | strict 模式失败并列出候选 | diagnostics.json | Planned |
| 发布边界 | Integration | `Blog/` 文章链接 Vault 其他目录 | 构建失败且不读取目标 | diagnostics.json | Planned |
| 本地附件拒绝 | Integration | 本地图片/音频/PDF fixture | 构建失败并提示独立能力 change | diagnostics.json | Planned |
| 确定性 | Rebuild | 两个干净目录编译同一 SHA | manifest hash 一致 | determinism report | Planned |
| URL 稳定 | Route diff | 编译全量后 `npm run routes:verify` | 无未批准变化 | route diff | Planned |
| Astro 兼容 | Static build | `npm run build && npm run smoke:static` | 成功，页面数一致 | build report | Planned |

## Blocking Checks

- strict 模式仍有 error 诊断。
- 任何公开文章无稳定 id/slug。
- 输出目录包含源仓库之外的越界文件。
- 同一输入 hash 不稳定。
- 页面或 URL 数量异常减少。

## Manual Checks

抽样范围至少包括：中文 wikilink、别名、heading、GFM 表格、任务列表、代码块、脚注、NOTE/WARNING callout 和本地附件拒绝。

## Actual Results

实施后填写 content SHA、编译器版本、文章数、链接数、耗时、hash 和异常清单。

## Exceptions

不支持的 Obsidian 语法必须记录为 warning/error；禁止静默删除节点。
