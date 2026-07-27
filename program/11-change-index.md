# OpenSpec Change 索引

| Change | 类型 | 主要交付物 | 完成后得到什么 |
|---|---|---|---|
| `establish-refactor-baseline` | 行为与工具 | URL 基线、manifest、评论完整退役契约、最小测试 | 后续重构拥有可信比较面且不继承评论债务 |
| `build-obsidian-content-compiler` | 新能力 | Unified/Remark 编译器、链接/发布边界校验、稳定身份 | Obsidian 方言与 Astro 解耦 |
| `modularize-blog-domain` | 纯重构 | domain/application/infrastructure、公共入口 | BlogService 热点被拆开，行为保持一致 |
| `replace-obsidian-sync-pipeline` | 交付能力 | 双仓 trigger、CONTENT_SHA、artifact、串行部署 | 删除 rsync 后提交/推送链路，发布可复现 |
| `migrate-cloudflare-static-deployment` | 平台迁移 | Wrangler Static Assets、staging、生产回滚 | Cloudflare 发布单元统一 |
| `unify-client-page-lifecycle` | 浏览器能力 | lifecycle adapter、controllers、取消和清理 | 连续导航无增长性副作用 |
| `harden-quality-and-operations` | 持续治理 | CI 门禁、资产/性能、观测、依赖和演练 | 施工成果长期保持有效 |

## 操作命令

```bash
openspec status --change <change-id>
openspec validate <change-id> --strict
```

Agent 会话中：

```text
/opsx:apply <change-id>
/opsx:verify <change-id>
/opsx:archive <change-id>
```
