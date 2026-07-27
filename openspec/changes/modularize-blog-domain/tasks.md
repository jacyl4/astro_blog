## 1. Characterization Baseline

- [ ] 1.1 为现有 BlogService 的所有公开方法建立行为测试
- [x] 1.2 固定文章排序、标题优先级、category 推导、tag 清洗和 selector 输出
- [x] 1.3 使用当前 route manifest 验证所有文章 URL
- [ ] 1.4 记录当前缓存生命周期和错误处理

## 2. Domain 提取

- [x] 2.1 创建 `src/modules/blog/domain/model.ts`
- [x] 2.2 提取文章 normalize 纯函数
- [x] 2.3 提取排序和日期比较纯函数
- [x] 2.4 提取 category/tag/archive/by-slug selectors
- [x] 2.5 为所有纯函数迁移或新增单测

## 3. Application 与 Adapter

- [x] 3.1 定义最小 `BlogRepository` port
- [x] 3.2 创建唯一访问 `astro:content` 的 repository adapter
- [x] 3.3 创建 application blog service 并组合 repository 与 selectors
- [x] 3.4 将构建期缓存放入 adapter 或 composition scope
- [x] 3.5 为 collection 失败提供带源上下文的错误

## 4. 公共入口与兼容层

- [x] 4.1 创建 `src/modules/blog/index.ts` 并只导出页面需要的 API
- [ ] 4.2 将旧 BlogService 改为调用新模块的薄 façade
- [x] 4.3 逐页迁移首页、详情、分类、标签和归档 imports
- [x] 4.4 迁移侧边栏和其他组件 imports
- [x] 4.5 确认仓库无模块内部深层导入

## 5. 边界治理

- [x] 5.1 添加 no-restricted-imports 或等价模块边界检查
- [x] 5.2 添加循环依赖检测
- [x] 5.3 添加模块 README，说明入口、模型和依赖方向
- [x] 5.4 删除旧 BlogService 实现和无用类型

## 6. 回归与验收

- [x] 6.1 执行全部单测、Astro check 和 build
- [x] 6.2 比较 route manifest、文章顺序和页面抽样 HTML
- [x] 6.3 检查 bundle/构建时间没有显著退化
- [ ] 6.4 执行 `/opsx:verify modularize-blog-domain`
- [ ] 6.5 staging 通过后归档 change
