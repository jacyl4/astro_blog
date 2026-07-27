# 开工入口

## 1. 施工目标

本轮改造形成六条稳定边界：

1. **内容来源边界**：Obsidian Vault / 内容仓库只提供不可变输入。
2. **内容编译边界**：独立 Content Compiler 将 Obsidian 方言转换为标准化内容。
3. **博客领域边界**：文章身份、slug、分类、标签、归档和查询逻辑集中在 Blog 模块。
4. **浏览器运行边界**：导航、目录等控制器统一 mount/destroy 生命周期。
5. **交付边界**：代码 SHA、内容 SHA、依赖锁和构建清单共同定义一个发布版本。
6. **Cloudflare 边界**：当前评论 Worker/D1/OAuth/DNS 完整退役，目标只发布 Wrangler 管理的静态站点。

## 2. 施工前必须确认

- [ ] 当前生产域名和 Cloudflare Pages 项目名称已记录。
- [ ] 当前可正常部署的 GitLab Pipeline 已保留。
- [ ] 当前 86 个静态路由已经导出并纳入快照。
- [ ] 当前生产构建的 `dist/` 已保留一份基线产物。
- [x] 已确认评论 UI、请求和 Worker 当前在线；已批准完整退役。
- [x] GitLab 项目已记录：`jacyl4/obsidian-digital` → `jacyl4/astro_blog`，发布目录为 `Blog/`。
- [ ] GitLab Runner 可使用 Node 24 和 Wrangler 4.x。
- [ ] Cloudflare API Token 仅具有目标 Workers/Pages 项目的必要权限。

## 3. 执行顺序

| 顺序 | OpenSpec change | 目标 | 前置条件 |
|---:|---|---|---|
| 1 | `establish-refactor-baseline` | 锁定 URL/构建基线并完整退役评论能力 | 无 |
| 2 | `build-obsidian-content-compiler` | 将 Obsidian 方言转成确定性标准内容 | 1 |
| 3 | `modularize-blog-domain` | 拆分 BlogService，建立模块边界 | 1、2 的契约稳定 |
| 4 | `replace-obsidian-sync-pipeline` | 使用内容 SHA 的双仓构建替代 rsync 后提交/推送同步 | 2 |
| 5 | `migrate-cloudflare-static-deployment` | 迁移到 Wrangler 管理的静态发布 | 1、4 |
| 6 | `unify-client-page-lifecycle` | 收敛导航和目录的生命周期 | 1 |
| 7 | `harden-quality-and-operations` | 将测试、性能、资产、观测固化为持续门禁 | 1～6 |

## 4. 每个 change 的固定闭环

```text
阅读 proposal/design/specs
        ↓
/opsx:apply <change>
        ↓
执行 verification.md
        ↓
预发布或灰度
        ↓
按 rollout.md 完成上线
        ↓
/opsx:verify <change>
        ↓
/opsx:archive <change>
```

## 5. 停工条件

出现以下任一情况，当前 change 停止上线并恢复上一稳定版本：

- 现有公开文章 URL 出现无迁移说明的删除或改变；
- 内容编译产生文章遗漏、错误链接或不支持的本地附件；
- 评论 UI、脚本、请求、Cookie、Worker、D1、OAuth、secret、DNS 或预留 adapter 存在残留；
- 构建无法通过干净工作区复现；
- 页面连续导航后监听器或请求数量持续增长；
- Cloudflare 404、缓存头或自定义域名行为与基线不一致；
- 回滚命令、旧版本或旧部署入口未被验证。
