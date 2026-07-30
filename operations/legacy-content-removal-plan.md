# Legacy 内容适配层清理计划

## 目标

在新的 Obsidian 内容触发链路连续完成三次真实生产发布后，删除应用仓库内
`src/content/blog` 镜像和 `BLOG_CONTENT_SOURCE=legacy` 回退开关。此后 Astro
只消费内容编译器生成的 `.build/content/blog`，应用提交不再承载文章镜像。

## 行为锁

删除前先用回归测试固定以下契约：

1. 未显式提供 `--source` 或 `CONTENT_SOURCE_PATH` 时，内容编译器拒绝隐式读取
   仓库内目录。
2. Astro collection 的 blog loader 固定读取 `.build/content/blog`。
3. 仓库中不存在 `src/content/blog`，源码和 npm scripts 中不存在
   `BLOG_CONTENT_SOURCE`。
4. 本地 `dev`、`build`、`check` 通过 `content:prepare` 获取 lock 文件指定的
   不可变内容提交；CI 继续使用已有 `prepare-content` job。
5. 内容编译、路由、静态 HTML、浏览器和生产 HTTP 契约保持不变。

## 删除步骤

1. 记录三次内容生产发布的 content SHA、上下游 pipeline 和 production job。
2. 将 `content-source.lock.json` 更新到第三次成功发布的 content SHA。
3. 添加并运行上述回归测试，确认其在 legacy 代码仍存在时失败。
4. 固定 `src/content.config.ts` 的 blog loader 输入为 `.build/content/blog`。
5. 删除编译器对 `src/content/blog` 的隐式默认值，缺少源输入时明确失败。
6. 增加 `content:prepare`，让本地入口和 CI 使用同一只读 prepare 边界。
7. 删除 `src/content/blog` 及全部 legacy 文档说明。
8. 运行 unit、Astro check、完整 build、静态验证、浏览器测试和 OpenSpec strict
   校验。
9. 通过 GitLab staging 与 production 发布最终应用提交，并核对线上双 SHA。

## 回滚

清理后不恢复仓库内容镜像。发布故障时：

1. 重新发布上一稳定 app SHA 与已验证 content SHA 的不可变组合；
2. 若新内容提交有问题，修复内容仓库后重新触发；
3. 若内容编译器有问题，回退应用提交，不在应用仓库重新建立文章同步 job。

## 完成判据

- 三次新触发链路的生产发布均成功；
- `src/content/blog` 和 `BLOG_CONTENT_SOURCE` 零残留；
- 本地与 CI 全量门禁通过；
- 最终生产 manifest 的 app/content SHA 与预期一致；
- 旧 rsync job 和其长期 OAuth token 已删除。
