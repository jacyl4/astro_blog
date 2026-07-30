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

## 5. 默认分支切换结果

- 内容默认分支已切换到 mirrored trigger，旧 rsync/commit/push job 不再存在。
- 快速候选 C/D 已在 GitLab 实测：旧候选 app Pipeline `#432` 的 staging
  `#735` 被 freshness 拒绝，production `#736` 未运行。
- 内容 Pipeline `#433/#436/#438` 已分别完成三次下游 staging 与 production；
  最终 content SHA 为 `7a5b1257016953877aaf62409db75f981469f7fe`。
- 临时 release probe 已清除，内容 main 与迁移分支指向相同提交。
- 旧长期 `GITLAB_TOKEN` 已删除；详细 job 表见
  `content-trigger-migration-evidence-2026-07-30.md`。
- 七天回退说明继续保留，但不恢复旧 job 或旧凭据。

## 6. 功能分支候选实证

- 应用 commit：`cd94bda91d33e3f0fe8973d9452cb6a9174f4d05`
- 内容 commit：`c925ad442b8389376728e792c4a8dc31bf365227`
- GitLab Pipeline：`#423`
- prepare / verify / build / browser：Jobs `#705` / `#706` / `#707` / `#708`
- manual staging：Job `#709`，成功
- Cloudflare staging version：`05193450-0648-4e68-8850-93e46eb93419`
- staging evidence package：
  `astro-blog-staging-evidence/423-cd94bda91d33e3f0fe8973d9452cb6a9174f4d05-709/staging-evidence.tar.gz`
- 发布后身份探测在第 14～16 次连续确认 HTML、manifest 和 runtime asset
  一致；门禁在收敛前没有运行 smoke。
- 收敛后全路由 `86 + 3`、Playwright `11/11` 和性能硬预算通过。
- staging 随后在 `05193450-… → cc7a9a1e-… → 05193450-…` 间完成真实
  N→N−1→N；两端 `86 + 3` 通过，恢复后 Playwright `11/11` 通过。

该候选之后，默认分支 mirrored trigger、失败传播、快速提交顺序和三次生产发布
均已完成。剩余发布门是 legacy 删除提交自身的 staging/production 验证。
