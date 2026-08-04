# Pages 平台回退验证记录

日期：2026-07-30（状态复核：2026-08-04）

## 目标

验证 Workers Static Assets 版本回滚不可用时，保留的 Cloudflare Pages 项目
`blog` 能作为静态源站，并把生产域名恢复步骤固化为可安全执行的应急流程。

## 实际演练

1. 对 `https://blog-4la.pages.dev` 执行完整 HTTP sweep，86 条公开路由与 3 条
   静态 404 检查全部通过，证明冻结 Pages deployment 可继续提供稳定静态站点。
2. 解除 Worker 自定义域名并尝试把 `blog.seso.icu` 加入 Pages 项目。
3. Pages 返回 `CNAME record not set`，域名保持 pending。检查发现当前 Wrangler
   OAuth 凭据只有 Pages/Workers 写权限与 zone 读取权限，没有 DNS 写权限；演练
   因而没有伪造 DNS 成功，也没有绕过最小权限边界。
4. 立即删除 pending Pages 域名，重新部署 Worker 自定义域名；由于 Pages 删除与
   Worker 绑定存在异步竞态，又执行了一次幂等的 Worker 域名重绑和同一 release
   包重部署。
5. 等待 HTML、公开 build manifest 与 runtime asset 身份连续收敛后，对
   `https://blog.seso.icu` 再次执行 86 + 3 HTTP sweep，全部通过。

## 契约结论

- Pages 静态源站与完整路由已验证可用。
- 域名回退必须在任何解除 Worker 绑定之前完成 DNS Write 权限预检；没有该权限时
  应安全中止，不得先切断生产 Worker。
- 真正的应急切换顺序是：记录 Worker version/DNS → 确认 DNS Write → 验证 Pages
  直连 sweep → 创建 `blog.seso.icu` Pages custom domain → 将 CNAME 指向
  `blog-4la.pages.dev` → 等待 active → 执行身份和全路由 smoke。
- 当前 Pages 项目没有 Git source（`Git Provider: No`），仅保留冻结 deployment；
  不存在自动部署入口。2026-08-04 复核 Project Domains 仅为
  `blog-4la.pages.dev`，生产域名仍由 Worker `astro-blog` 提供。

## 验收边界

本次验证覆盖了回退源站、生产故障恢复、权限前置条件和安全中止路径。为避免为了
演练再次主动中断健康生产，不在没有 DNS Write 凭据时强行完成 CNAME 激活；真实
故障时只有持有受批准 DNS Write 凭据的操作者可以执行最终域名切换。
