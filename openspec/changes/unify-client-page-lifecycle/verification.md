# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| mount 一次 | Integration | 触发首次加载/切页事件 | 每 generation 每 controller 一次 | unit/integration report | Passed |
| destroy 清理 | Unit | mock listener/observer/timer | 全部释放且可幂等调用 | test report | Passed |
| 直接/切页一致 | Browser | direct URL 与站内点击 | 导航、TOC、脚注一致 | screenshots/trace | Passed locally and staging |
| history 一致 | Browser | 前进/后退 | 状态正确 | Playwright trace | Passed locally and staging |
| 无增长泄漏 | Browser | 连续导航 20 次 | counters/requests 有界 | lifecycle report | Passed locally and staging |
| 取消旧请求 | Unit/Browser | destroy 期间 Promise 完成 | 旧结果不改新 DOM | test/trace | Passed; controllers have no page fetch |
| resize 无请求 | Browser | 连续 resize | 数据请求数量不变 | network trace | Passed locally and staging |
| 响应式抽样 | Browser | 1440×1000 与 390×844 | 导航可达、无横向溢出、文章切页成功 | screenshots/trace | Passed locally and staging |

## Blocking Checks

- 首次加载或任一 history 场景初始化缺失。
- controller 数量随导航线性增长。
- 旧页面异步结果修改新 DOM。
- resize 发起数据请求。
- 键盘焦点恢复或导航可访问性明显退化。

## Manual Checks

桌面/移动宽度下抽查目录折叠、导航高亮、长文章、无标题文章和快速滚动。

## Actual Results

- Chromium：20 次 Swup 导航后 signal listener 与 IntersectionObserver 计数不增长
- history、keyboard、resize、评论零请求和 PWA 离线场景通过
- 桌面与移动响应式证据由 `responsive.spec.ts` 生成
- Pipeline `#421` / Job `#699` 在真实 staging 域名通过 Playwright `11/11`；
  包括 debug snapshot、20 次导航、history、resize、PWA 和桌面/移动抽样
- production 错误观察仍未完成

## Exceptions

测试环境无法直接计算浏览器原生 listener 总量时，使用 controller 自有 counters、network trace 和重复行为断言组合证明。
