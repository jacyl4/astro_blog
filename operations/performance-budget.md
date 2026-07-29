# Performance and Network Budget

基线日期：2026-07-29  
采集工具：`npm run performance:collect`  
视口：1440 × 1000，Chromium cold context，禁用缓存与 Service Worker

## 1. 基线

| 环境 | LCP | CLS | 交互代理 | 请求数 | 编码传输量 | 最大资源 | 阻断结果 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| staging 当前生产版本 | 1860 ms | 0.000029 | 845 ms | 24 | 1,865,639 B | 455,249 B | 通过 |
| production 当前版本 | 1508 ms | 0.000029 | 1046 ms | 24 | 1,864,816 B | 455,255 B | 通过；交互代理趋势告警 |
| 本地候选响应式图片 | 408 ms | 0.000029 | 888 ms | 25 | 1,483,934 B | 309,356 B | 通过 |
| Pipeline #421 staging 候选 | 1932 ms | 0.000029 | 1446 ms | 26 | 1,465,471 B | 309,798 B | 通过；交互代理趋势告警 |

网络基线不记录文章正文、Cookie、请求体或认证头。最大资源和关键请求链只保存
URL、类型与编码字节数。

## 2. 预算

阻断预算位于 `performance-budgets.json`：

- 失败请求：0；
- 请求数：最多 80；
- cold navigation 总编码传输：最多 4 MiB；
- 单个网络资源：最多 1 MiB。

趋势阈值不直接阻断单次发布：

- LCP：2500 ms；
- CLS：0.1；
- 点击到文章主体可见的交互代理：1000 ms。

高确定性的资源缺失、失败请求和静态尺寸越界直接阻断；LCP、CLS 与交互代理受
网络和执行环境波动影响，单次超限只产生 `trendWarnings`。连续三次同环境超限
才升级为回归调查。

## 3. 响应式图片决策

- header：768w / 1536w；
- wallpaper：1280w / 2560w；
- `<link rel="preload">` 使用 `imagesrcset`；
- avatar 只在 `min-width: 768px` 预加载；
- WebP 单文件预算为 320 KiB。

候选 cold transfer 相对线上旧图减少约 380 KiB；公开路由和 `<main>` HTML
基线保持不变。

## 4. 更新审批

预算只能在合并请求中更新，并必须同时提供：

1. production、staging 与候选三组同视口 cold report；
2. 至少三次采样的中位数与最大值；
3. route、HTML、asset manifest 差异；
4. 放宽预算的业务理由和回退方式；
5. 审阅者明确批准。

不得用提高预算掩盖断链、空资源、评论残留、动态 binding 或错误 artifact。

## 5. 候选采样说明

Pipeline `#421` / Job `#699` 在发布身份连续三次收敛、全路由和浏览器测试通过后
采集。LCP、CLS、请求数、总传输量和最大资源均满足硬预算；交互代理单次超过
1000 ms，只登记趋势告警，不作为单次发布阻断。后续需累计同环境三次样本才能
升级为回归调查。
