# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 源输入只读 | Git diff | 编译前后执行 `git -C <content> status --porcelain` | 两次均为空 | CI log | Passed locally |
| 标准 Markdown | Golden test | `npm run test:unit -- content-compiler` | fixtures 全通过 | test report | Passed |
| Wikilink | Integration | 编译普通/别名/heading fixture | permalink 正确 | fixture output | Passed |
| 歧义失败 | Integration | 编译同名笔记 fixture | strict 模式失败并列出候选 | diagnostics.json | Passed |
| 发布边界 | Integration | `Blog/` 文章链接 Vault 其他目录 | 构建失败且不读取目标 | diagnostics.json | Passed |
| 本地附件拒绝 | Integration | 本地图片/音频/PDF fixture | 构建失败并提示独立能力 change | diagnostics.json | Passed |
| 确定性 | Rebuild | 两个干净目录编译同一 SHA | manifest hash 一致 | determinism report | Passed |
| URL 稳定 | Route diff | 编译全量后 `npm run routes:verify` | 无未批准变化 | route diff | Passed, 86 routes |
| Astro 兼容 | Static build | `npm run build && npm run smoke:static` | 成功，页面数一致 | build report | Passed on Astro 7 |

## Blocking Checks

- strict 模式仍有 error 诊断。
- 任何公开文章无稳定 id/slug。
- 输出目录包含源仓库之外的越界文件。
- 同一输入 hash 不稳定。
- 页面或 URL 数量异常减少。

## Manual Checks

抽样范围至少包括：中文 wikilink、别名、heading、GFM 表格、任务列表、代码块、脚注、NOTE/WARNING callout 和本地附件拒绝。

## Actual Results

- content SHA：`c925ad442b8389376728e792c4a8dc31bf365227`
- strict compile：11 articles，0 warning，0 error
- manifest hash：`678015d9529d28efd760bf0a56d90f82177e89ebea67777ac6516ce483a65f6d`
- unit：Content Compiler 8 tests passed
- route/static：86 routes，static smoke passed
- 时间门：三次真实内容提交后删除 legacy adapter 尚未满足

## Exceptions

不支持的 Obsidian 语法必须记录为 warning/error；禁止静默删除节点。
