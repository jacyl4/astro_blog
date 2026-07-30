# 回滚手册

## 触发条件

- 公开 URL 出现未批准 404；
- build manifest 的 app/content SHA 与计划不一致；
- 静态资源、Service Worker 或核心页面大面积失败；
- 发布顺序倒置，旧内容覆盖新内容；
- production smoke 或错误观测超过既定阈值。

## 优先顺序

1. 暂停后续 production job，记录故障 deployment/version ID。
2. 使用 Cloudflare 版本历史回滚到发布前记录的稳定版本。
3. 等待根 HTML、build manifest 和根 HTML 引用的 runtime asset 连续三次指向
   目标 app SHA；在收敛前不得开始 smoke。
4. 重新执行关键路径和全路由 HTTP sweep。
5. 若 Worker 回滚不可用，将自定义域名恢复到保留的 Pages 项目。
6. 清理或更新 Service Worker 缓存只作为后续措施，不得用它掩盖错误 artifact。

## 数据与内容

静态发布不包含数据库迁移。若问题来自内容提交，创建新的内容仓库修复提交并触发
新 pipeline；不得 force-push 或重新使用错误 SHA。内容适配层清理后不再恢复
应用仓库镜像；若编译器故障，回退上一稳定 app SHA 与 content SHA 组合。

## 证据

记录触发时间、操作者、旧/新 deployment ID、app/content SHA、回滚命令输出、
DNS 状态和 smoke 结果。首次正式发布前必须在 staging 完成一次实际回滚演练。

## 命令

```bash
npx wrangler deployments list --env staging
npx wrangler rollback <STABLE_VERSION_ID> --env staging --yes \
  --message "rollback reason"
npm run deployment:wait -- \
  --base https://blog-staging.seso.icu \
  --app-sha <STABLE_APP_SHA>
npm run http:sweep -- \
  --base https://blog-staging.seso.icu \
  --output .build/evidence/staging-rollback-http-sweep.json
```

回滚演练执行 N → N+1 → N：每一步记录 version ID、route manifest hash 和完整
HTTP sweep。不得用固定 sleep 代替 `deployment:wait`：Cloudflare 版本切换期间，
不同请求可能短暂命中旧 HTML、旧 manifest 或不同 runtime asset。只有根 HTML 的
`build-app-sha`、公开 build manifest 的 `appSha` 和 runtime asset `HEAD 200`
连续三次一致，才视为已收敛。

身份门禁引入前的历史版本没有 `build-app-sha`，不能作为新门禁的最终演练目标；
迁移期若必须恢复该类版本，应先按 manifest 和人工资产清单完成应急恢复，再尽快
部署一个由不可变 Generic Package 恢复的身份完整版本。不得为了回滚重新构建旧
提交，也不得放宽当前发布门禁。

若 Wrangler rollback 失败，保留失败输出并按发布手册恢复 Pages 自定义域名，
不得用重新构建代替版本回滚。

## 维护周期

- 每季度至少演练一次 staging 回滚；
- Astro、Wrangler、PWA/Workbox 或域名交付模型发生关键升级时追加一次；
- 演练证据使用 Generic Package Registry 保存，不使用 Job Artifacts 传递。
