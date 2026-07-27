# 资产故障手册

## 自动门禁

`npm run assets:verify` 检查：

- 所有产物非空；
- PWA PNG 签名与 192/512 尺寸；
- HTML/CSS 引用存在；
- preload 在 HTML 或 CSS 中确实使用；
- 单 JS、单 CSS、单文件和 `dist` 总量预算；
- WOFF2 字体存在，旧 TTF 不得回归。

预算定义在 `asset-budgets.json`。预算变化必须在 merge request 中说明基线、原因和
可回滚方案，不得只为让 CI 变绿而提高阈值。

## 故障处置

1. 从失败输出定位引用页面和资产路径。
2. 比较 `.build/manifests/assets.json` 与最近稳定版本的 path/size/hash。
3. 空图标或损坏图片：从原始可信资产重新生成，验证签名和像素尺寸。
4. 断链：优先修复引用路径；不要添加无意义占位文件。
5. 体积退化：确认是否重复打包、格式回退或引入整套字体；优先删除与转换。
6. Service Worker 缓存问题：先确认新 artifact 正确，再处理缓存更新。

生产事故处理完成后，把失败样本固化为测试 fixture 或预算规则。
