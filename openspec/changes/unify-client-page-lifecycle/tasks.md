## 1. 事件和副作用盘点

- [x] 1.1 搜索全部 DOMContentLoaded、Astro、Swup、resize 和立即执行入口
- [x] 1.2 记录 Navigation、TOC 和脚注脚本的监听、Observer、timer 和请求
- [ ] 1.3 使用浏览器 trace 确定首次加载、切页、before swap、after swap 和 history 的真实顺序
- [x] 1.4 选择一个权威外部事件适配方案并记录 ADR

## 2. Lifecycle Runtime

- [x] 2.1 定义 PageController、PageContext 和 registry 类型
- [x] 2.2 实现单一 lifecycle adapter
- [x] 2.3 实现页面 generation 和 AbortController
- [x] 2.4 实现逆序 destroy、异常隔离和幂等保护
- [x] 2.5 实现开发模式 debug snapshot
- [x] 2.6 实现单一 resize/viewport dispatcher

## 3. 控制器迁移

- [x] 3.1 将 Navigation active state 迁移为 controller
- [x] 3.2 删除 Navigation 旧事件绑定和全局标记
- [x] 3.3 将 TOC render、IntersectionObserver 和 responsive visibility 迁移为 controller
- [x] 3.4 确保 TOC destroy disconnect Observer 并清理 DOM 状态
- [x] 3.5 将 footnote normalization 或其他页面增强迁移为 controller

## 4. 异步与竞态

- [ ] 4.1 将页面作用域请求接入 PageContext signal
- [x] 4.2 对应用异步结果增加 generation/active 校验
- [x] 4.3 确认 resize 不调用 session/content fetch
- [x] 4.4 为 destroy 期间完成的 Promise 增加测试

## 5. 测试

- [x] 5.1 为 controller mount/destroy 编写 unit tests
- [x] 5.2 为 lifecycle 事件顺序和重复事件编写 integration tests
- [x] 5.3 Playwright 测试直接加载和站内切页
- [x] 5.4 Playwright 测试浏览器后退/前进
- [x] 5.5 Playwright 连续快速导航 20 次并检查请求/监听/Observer 上限
- [x] 5.6 Playwright 连续 resize 并确认无数据请求
- [x] 5.7 检查键盘焦点和可访问性没有退化

## 6. 发布

- [ ] 6.1 staging 开启 debug snapshot 并记录基线/候选对比
- [ ] 6.2 抽样桌面和移动视口
- [ ] 6.3 生产发布后观察控制台和错误日志
- [x] 6.4 删除旧脚本、重复事件和临时兼容调用
- [ ] 6.5 执行 `/opsx:verify unify-client-page-lifecycle` 并归档
