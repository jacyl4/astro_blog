## Purpose

为所有页面级浏览器增强提供统一、可重复、可清理的生命周期，使首次加载、客户端导航和历史导航具有一致行为。

## ADDED Requirements

### Requirement: 页面控制器拥有统一接口
系统 SHALL 让每个页面增强控制器提供 `mount` 和 `destroy` 行为，并由单一运行时入口调用。

#### Scenario: 首次页面加载
- **WHEN** 页面首次完成加载
- **THEN** 每个启用控制器恰好 mount 一次

#### Scenario: 客户端切换页面
- **WHEN** 路由开始替换当前页面
- **THEN** 旧控制器先 destroy，并在新页面稳定后各 mount 一次

### Requirement: destroy 清理全部副作用
系统 MUST 在 controller destroy 时移除自身事件监听器、Observer、timer 和待处理异步工作。

#### Scenario: 连续导航二十次
- **WHEN** 用户在不同文章间连续导航二十次
- **THEN** 活跃监听器、Observer 和 controller 实例数量保持在固定上限

### Requirement: 首次加载与客户端导航行为一致
系统 SHALL 在直接打开文章、站内点击进入、浏览器前进和后退时提供相同的导航高亮、目录和页面增强行为。

#### Scenario: 浏览器后退
- **WHEN** 用户从文章 B 后退到文章 A
- **THEN** A 的导航状态和目录与直接加载 A 一致

### Requirement: resize 只执行布局更新
系统 MUST 将窗口尺寸变化限制为可见性、尺寸和布局更新，不重新执行内容或会话数据加载。

#### Scenario: 连续调整窗口大小
- **WHEN** 用户多次 resize
- **THEN** 不产生页面作用域数据网络请求
