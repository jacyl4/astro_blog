# Design

## Context

后续所有改造都需要一个可信比较面。现有报告已经记录构建成功和约 86 个页面，但尚未形成仓库内可持续执行的契约。评论功能当前已在生产运行；用户已批准完整退役，未来重新设计时不继承当前接缝。

## Goals

- 建立 URL、页面、资产和构建身份基线。
- 在重构开始前完成评论能力零残留退役。
- 让内容错误和 slug 冲突在 CI 中明确失败。
- 为后续 change 提供统一的验证命令。

## Non-Goals

- 不改变文章 URL 生成算法。
- 不重写 BlogService。
- 不建设完整测试平台；只建最小保护层。

## Architecture and Boundaries

新增三个工具边界：

```text
tools/release/generate-route-manifest.ts
tools/release/generate-build-manifest.ts
tools/release/verify-route-manifest.ts
```

评论不保留 feature flag 或 No-op adapter。应用层删除所有评论装配、脚本、样式、文案和环境变量；仓库删除 `cloudflare/` 评论 Worker 实现。生产侧在完成可选数据导出和资源清单后删除 Worker、D1、OAuth、secret 与 DNS。

## Data and Artifact Flow

```text
Astro build
  → dist/
  → scan generated routes/assets
  → route-manifest.json
  → asset-manifest.json
  → build-manifest.json
  → CI artifacts + deployed static asset
```

## Decisions

### 1. 基线记录实际公开 URL，而非重新计算理论 URL

理由：当前 slug 行为存在隐含顺序，重新实现计算会在基线阶段引入变化。

### 2. 评论采用完整退役而非 feature flag

理由：CSS 隐藏仍会保留脚本、监听器和网络边界，不符合当前事实。

### 3. 构建异常采用 fail-fast

collection 整体读取失败不得返回空数组继续构建。开发环境可提供详细诊断，CI 与生产构建必须失败。

## Alternatives Considered

- 只依赖 Astro build 输出：无法识别 URL 和业务结果漂移。
- 保留评论脚本但不显示：仍然污染生命周期和网络测试。
- 首轮直接修正 slug：会混合基线与行为修改，回归来源不清晰。

## Failure Modes

- manifest 扫描遗漏特殊路由 → fixture 覆盖全部页面类型。
- 生产 URL 与本地生成路径存在差异 → 从当前生产 sitemap/部署产物交叉确认。
- feature config 被局部绕过 → 浏览器网络测试和代码搜索同时检查。

## Security and Integrity

退役前不再扩展当前评论实现。导出必要审计证据后，撤销 OAuth 凭据、删除 Worker secret/route/domain、删除 D1 和 DNS，避免不安全服务继续暴露。

## Observability

构建输出显示：页面总数、各类型数量、新增/删除 URL、内容 SHA、应用 SHA 和 manifest hash。

## Test Strategy

- 纯函数单测：manifest 规范化、hash、路由 diff、重复 slug。
- 静态 smoke：首页、随机文章、分类、标签、归档、404。
- 浏览器 smoke：DOM 无评论容器、网络无评论请求。

## Migration Plan

1. 捕获当前生产和本地构建基线。
2. 添加工具和测试，不改变生成逻辑。
3. 删除应用和仓库中的评论能力。
4. 按资源清单退役 Cloudflare、OAuth、secret 与 DNS。
5. CI 改用 `npm ci`。
6. 比较并提交首份正式基线。

## Rollback Design

该 change 包含不可逆的生产资源删除。删除前保存资源清单与可选 D1 导出；应用提交可回滚，但评论基础设施不会自动恢复，若误删必须作为事故按导出重建。首份基线文件保留用于后续调查。

## Risks and Mitigations

- [基线包含历史异常 URL] → 先保护现状，后续通过独立迁移 change 修正。
- [评论资源删除不完整] → 代码搜索、浏览器 trace、Cloudflare/API/OAuth/DNS 清单共同证明零残留。

## Open Questions

无。具体生产域名和当前页面数量在执行任务 1.1 时补录。
