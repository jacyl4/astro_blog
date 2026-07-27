# Astro Blog OpenSpec 全套施工计划

本包用于将现有 Astro 静态博客改造为一个边界清晰、可重复构建、可原子发布、可逐阶段回滚的模块化系统。

它已经按 OpenSpec 的 brownfield / delta-first 思路拆成多个独立 change。每个 change 都包含：

- `proposal.md`：为什么做、改什么、影响范围；
- `specs/**/spec.md`：可验证的行为要求；
- `design.md`：技术设计、边界、迁移和风险；
- `tasks.md`：可被 `/opsx:apply` 跟踪的施工任务；
- `verification.md`：验证证据和验收表；
- `rollout.md`：上线、灰度与回滚步骤。

## 目录

```text
.
├── START_HERE.md
├── VALIDATION_REPORT.md             # OpenSpec 与实际仓库核验结论
├── program/                         # 总施工纲领与跨 change 管理
├── openspec/
│   ├── config.yaml
│   ├── schemas/astro-engineering-change/
│   └── changes/
├── templates/                       # GitLab CI、Wrangler、Manifest 模板
├── scripts/                         # 安装和结构校验脚本
└── references/                      # 原始架构报告与来源说明
```

## 建议使用方式

1. 先完整阅读 `START_HERE.md` 与 `program/03-execution-sequence.md`。
2. 在 Astro Blog 仓库根目录安装 OpenSpec：

   ```bash
   npm install -g @fission-ai/openspec@latest
   openspec init --tools codex,hermes
   ```

3. 将本包中的 `openspec/`、`templates/`、`program/` 合并到仓库根目录。
4. 更新 Agent 指令并验证：

   ```bash
   openspec update
   openspec schema validate astro-engineering-change
   openspec validate --all --strict
   ```

5. 从第一个 change 开始：

   ```text
   /opsx:apply establish-refactor-baseline
   /opsx:verify establish-refactor-baseline
   /opsx:archive establish-refactor-baseline
   ```

6. 每个 change 通过验收并归档后，再进入下一个 change。

## 关键施工原则

- 当前生产评论能力按已批准决定完整退役；不保留 No-op adapter、future gateway 或其他预设计接缝。
- 未来若重新建设评论系统，必须从新的需求、威胁模型和 OpenSpec change 开始。
- 文章的永久身份、公开 URL 和展示标题分离。
- Obsidian 内容以精确 Git SHA 作为不可变构建输入。
- Astro 源码目录不再作为外部同步落点。
- 每个阶段保持行为可比较、发布可回滚、部署可追溯。
- Astro 大版本升级、视觉改版和架构拆分分开提交。

## 预计施工量

按单人全栈/SRE 执行估算，核心改造约为 **15～26 人日**。该估算包含现有评论能力退役、测试、迁移和上线验证，不包含大规模视觉改版、历史文章人工修复以及下一代评论系统。
