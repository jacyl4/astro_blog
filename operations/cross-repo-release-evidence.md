# Cross-repository Release Evidence

日期：2026-07-29

## 1. 已验证契约

- 内容项目：`jacyl4/obsidian-digital`
- 应用项目：`jacyl4/astro_blog`
- 唯一发布目录：`Blog/`
- 内容输入以 40 位 `CONTENT_SHA` 稀疏检出，编译器不扫描 Vault 其他目录。
- 下游只接收 `CONTENT_PROJECT_PATH`、`CONTENT_REF`、`CONTENT_SUBDIR`、
  `CONTENT_SHA` 和 strict compiler mode。
- 应用和内容候选必须同时仍是各自 ref 的 HEAD；否则
  `tools/ci/verify-deploy-freshness.sh` 在 staging 前拒绝旧 Pipeline。
- production 使用不可中断的 `astro-blog-production` resource group，且只消费
  已通过 build/browser/staging 的不可变 release package。
- 内容 trigger 使用 `astro-blog-content-publish` resource group 和
  `strategy: mirror`；内容 Pipeline 名称展示完整 content SHA 与目标项目。
- staging 使用独立 `astro-blog-staging` resource group；非默认分支只能由
  manual job 部署，且 production job 不会出现在功能分支 Pipeline。
- unit/browser/staging/production evidence package 版本包含 `CI_JOB_ID`，
  job retry 保留独立证据，不覆盖旧尝试。

## 2. 同 SHA 新旧链路比较

内容提交：

`c925ad442b8389376728e792c4a8dc31bf365227`

比较结果：

| 项目 | 外部内容 strict 链路 | 应用仓 legacy 镜像 compat 链路 |
| --- | ---: | ---: |
| 文章数 | 11 | 11 |
| 编译错误 | 0 | 0 |
| 输出目录逐文件比较 | 相同 | 相同 |
| manifest hash | `678015d9529d28efd760bf0a56d90f82177e89ebea67777ac6516ce483a65f6d` | `0e9c51194d029655b528a879939c59d46e8f8553936a8a31c68f79e6ea0387ee` |

manifest hash 不同是预期结果：它包含不同的输入身份元数据；标准化 Markdown
输出逐文件相同，公开内容语义未变化。

## 3. 删除文章

`tests/unit/content-compiler.test.ts` 已覆盖 N 版本含两篇文章、N+1 删除其中一篇
的原子 swap。第二次编译后旧输出文件必须为 `ENOENT`，manifest 文章数必须从
2 变为 1，不允许残留镜像文件。

## 4. Deploy Token 兜底

正常链路只使用短期 `CI_JOB_TOKEN`。只有跨项目 allowlist 故障且无法及时恢复时，
才创建只读 repository Deploy Token：

1. scope 仅 `read_repository`；
2. 只配置到应用项目的 protected、masked、hidden 变量；
3. 不写入 clone URL、日志、release evidence 或仓库；
4. 验证精确 SHA 检出后记录到期日和所有者；
5. `CI_JOB_TOKEN` 恢复后立即撤销并执行变量零残留检查。

当前 `CI_JOB_TOKEN` 已由真实 prepare job 验证，因此不预先制造长期 token。

## 5. 尚未关闭的真实门

- 内容分支尚未合并到默认分支；默认分支仍运行旧 rsync/OAuth push job。
- 内容候选分支最新 commit 为 `9b2240c1`，已推送
  `refactor/astro-blog-openspec`；完整 SHA/目标项目和串行 mirrored trigger
  已通过本地 YAML contract。
- 必须在应用分支 CI 通过后再合并内容分支，避免 trigger 指向不兼容的 main。
- 下游桥接链接由 GitLab trigger graph 原生提供；两次快速内容提交、旧 Pipeline
  自动取消和最终部署顺序仍需在 GitLab 上演练。
- 三次成功内容发布和七天受控回退窗口不得用本地测试替代。
- GitLab Pipeline `#411` 因唯一 Runner `endure` 离线停在 pending；Runner
  恢复后必须触发新候选 Pipeline 和一次功能分支 manual staging。
