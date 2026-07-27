# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 外部行为一致 | Characterization | `npm run test:unit -- blog` | 新旧实现结果一致 | test report | Planned |
| URL 一致 | Route diff | `npm run routes:verify` | 零未批准变化 | route diff | Planned |
| 页面结果一致 | Snapshot/smoke | 构建并抽样首页、详情、分类、标签、归档 | 列表和内容一致 | smoke report | Planned |
| 纯领域无 Astro | Import check | 扫描 domain imports | 无 `astro:*` | boundary report | Planned |
| 公共入口 | Import check | 扫描模块外 imports | 只引用 `modules/blog` 入口 | boundary report | Planned |
| 无循环依赖 | Dependency check | `npm run architecture:check` | 零 cycle | report | Planned |

## Blocking Checks

- 任何 route manifest 变化。
- 任何 selector 结果或顺序差异。
- domain 引用 Astro runtime、浏览器或文件系统。
- 页面仍直接调用 `getCollection()`。

## Manual Checks

- 阅读模块 API，确认新人能够从 `index.ts` 发现全部入口。
- 检查 façade 已有明确删除提交，不形成第二套长期 API。

## Actual Results

实施后填写测试数、边界检查结果、页面数量和构建时间对比。

## Exceptions

本 change 不接受“顺便优化”输出行为；行为改善应创建后续独立 change。
