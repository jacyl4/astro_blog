# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| mount 一次 | Integration | 触发首次加载/切页事件 | 每 generation 每 controller 一次 | unit/integration report | Planned |
| destroy 清理 | Unit | mock listener/observer/timer | 全部释放且可幂等调用 | test report | Planned |
| 直接/切页一致 | Browser | direct URL 与站内点击 | 导航、TOC、脚注一致 | screenshots/trace | Planned |
| history 一致 | Browser | 前进/后退 | 状态正确 | Playwright trace | Planned |
| 无增长泄漏 | Browser | 连续导航 20 次 | counters/requests 有界 | lifecycle report | Planned |
| 取消旧请求 | Browser | 慢请求时快速切页 | 旧请求 aborted 且不改新 DOM | network trace | Planned |
| resize 无请求 | Browser | 连续 resize | 数据请求数量不变 | network trace | Planned |

## Blocking Checks

- 首次加载或任一 history 场景初始化缺失。
- controller 数量随导航线性增长。
- 旧页面异步结果修改新 DOM。
- resize 发起数据请求。
- 键盘焦点恢复或导航可访问性明显退化。

## Manual Checks

桌面/移动宽度下抽查目录折叠、导航高亮、长文章、无标题文章和快速滚动。

## Actual Results

填写浏览器版本、导航次数、请求数、debug counters、trace 链接和已知异常。

## Exceptions

测试环境无法直接计算浏览器原生 listener 总量时，使用 controller 自有 counters、network trace 和重复行为断言组合证明。
