# Rollout

## Preconditions

- 当前重构、内容 pipeline 和 Static Assets staging 已稳定。
- 目标版本与官方迁移说明已评审。
- 上一个稳定 artifact/version 可恢复。

## Staging

发布升级候选的同一 artifact，执行全路由、PWA、生命周期、静态 404 与缓存验证，
随后回滚并再次核对 manifest。

## Production

使用受保护 manual job 发布已通过 staging 的同一 artifact；记录 app/content SHA、
deployment ID 和 audit 差异。

## Observation

观察至少一个正常内容发布周期；检查 404、PWA 更新和客户端控制台错误。

## Rollback

恢复升级前 Cloudflare version；若不可用则恢复保留的稳定平台入口。
