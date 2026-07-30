# 内容 Trigger 迁移与连续发布证据

日期：2026-07-30  
应用 commit：`8bc4dbae14d3605520d9ae009a88498e0cd89132`

## 切换结果

- 内容默认分支已从旧 rsync/commit/push job 切换为 GitLab
  `strategy: mirror` 下游 trigger。
- 内容流水线只传递不可变 content SHA；应用流水线从该 SHA 稀疏检出
  `Blog/` 并在 staging 前重新检查 app/content ref HEAD。
- 旧内容同步变量 `GITLAB_TOKEN` 已从内容项目删除，复查剩余数量为 0。
- 内容分支与默认分支最终指向相同提交，临时 release probe 已从内容树删除。

## 快速连续提交与顺序门禁

| 候选 | Content SHA | Content pipeline | App pipeline | 结果 |
| --- | --- | ---: | ---: | --- |
| C | `58dfcfb1d08d16ae89b05937a0a495d09bd89d30` | `#431` | `#432` | 候选运行期间推送 D；staging Job `#735` 以“candidate is not current content ref HEAD”拒绝，production `#736` 未运行 |
| D | `67b346b33bc3b87585fd8f793efc48ccf72d007f` | `#433` | `#434` | 最新候选继续完成发布 |

这证明旧候选即使已进入下游，也不能覆盖更新的内容 HEAD；最终生产只接受 D。

## 三次真实生产发布

| 次数 | Content SHA | Content pipeline | App pipeline | Staging | Production | 线上 manifest |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | `67b346b33bc3b87585fd8f793efc48ccf72d007f` | `#433` | `#434` | `#746` success | `#744` success | app `8bc4dba` / content `67b346b` |
| 2 | `6b31c85a324e16b485d94760d0a137aa1261c7cc` | `#436` | `#437` | `#754` success | `#755` success | app `8bc4dba` / content `6b31c85` |
| 3 | `7a5b1257016953877aaf62409db75f981469f7fe` | `#438` | `#440` | `#763` success | `#764` success | app `8bc4dba` / content `7a5b125` |

每个 staging job 都运行部署身份等待、`86 + 3` HTTP sweep 和 Playwright；每个
production job 都运行部署身份等待、完整 HTTP sweep 和性能预算。

## Runner 重启处置

第一次发布的 staging 原尝试 `#743` 因 runner 被系统终止而失败，重试 `#745`
又在 runner 主机重启期间卡在本地 cache restore。该 job 被强制取消后，同一
不可变 app/content 候选通过 `#746` 成功；没有重新构建或替换候选 SHA。

## Legacy 清理门

第三次生产成功后才执行以下动作：

1. 将 `content-source.lock.json` 固定到 `7a5b125…`；
2. 为“禁止隐式仓库镜像”添加先失败后通过的回归测试；
3. 删除 `src/content/blog`、`BLOG_CONTENT_SOURCE` 和编译器的隐式旧目录；
4. 让本地 `dev`、`build`、`check` 与 CI 共用 `content:prepare` 边界；
5. 删除旧内容同步长期变量。

最终应用提交仍需通过独立 GitLab staging/production 后，才算 legacy 清理上线。
