# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 外部行为一致 | Characterization | `npm run test:unit` | 新旧实现结果一致 | test report | Passed, 6 domain tests |
| URL 一致 | Route diff | `npm run routes:verify` | 零未批准变化 | route diff | Passed, 86 routes |
| 页面结果一致 | Snapshot/smoke | 构建并抽样首页、详情、分类、标签、归档 | 列表和内容一致 | smoke report | Passed |
| 纯领域无 Astro | Import check | `npm run boundaries:verify` | 无 `astro:*` | boundary report | Passed |
| 公共入口 | Import check | `npm run boundaries:verify` | 只引用公开模块入口 | boundary report | Passed |
| 无循环依赖 | Dependency check | `npm run boundaries:verify` | 零 cycle | report | Passed, 36 source files |

## Blocking Checks

- 任何 route manifest 变化。
- 任何 selector 结果或顺序差异。
- domain 引用 Astro runtime、浏览器或文件系统。
- 页面仍直接调用 `getCollection()`。

## Manual Checks

- 阅读模块 API，确认新人能够从 `index.ts` 发现全部入口。
- 检查 façade 已有明确删除提交，不形成第二套长期 API。

## Actual Results

- domain tests：6 passed
- module boundary：36 source files passed
- route/static：86 routes，HTML baseline 无未批准变化
- Pipeline `#423` / Job `#709` 的真实 staging `86 + 3`、Playwright `11/11`
  通过；`/opsx:verify` 等价的 strict validation、证据矩阵和全量回归通过，
  可归档

## Exceptions

本 change 不接受“顺便优化”输出行为；行为改善应创建后续独立 change。
