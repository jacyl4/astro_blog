## Purpose

确保页面切换时旧页面的异步任务和网络请求被可靠取消，并通过页面身份校验避免资源浪费、竞态以及旧状态覆盖新页面内容。

## ADDED Requirements

### Requirement: 页面请求可取消
系统 SHALL 将页面作用域网络请求绑定到 controller 的 AbortController。

#### Scenario: 请求期间切换文章
- **WHEN** 页面 A 的请求尚未完成而用户切换到页面 B
- **THEN** A 的请求被取消且其结果不能更新 B 的 DOM

### Requirement: 异步结果验证当前页面身份
系统 MUST 在应用异步结果前验证 controller 仍处于活动状态并且结果属于当前页面。

#### Scenario: 取消信号延迟生效
- **WHEN** 旧请求在切页边界附近完成
- **THEN** 旧 controller 不会修改新页面
