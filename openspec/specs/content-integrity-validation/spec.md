# content-integrity-validation Specification

## Purpose
TBD - created by archiving change build-obsidian-content-compiler. Update Purpose after archive.
## Requirements
### Requirement: 歧义 wikilink 阻断严格构建
系统 MUST 在短链接匹配多个公开笔记时报告所有候选并在严格模式失败。

#### Scenario: 两个目录存在同名笔记
- **WHEN** `[[同名笔记]]` 可匹配两个目标
- **THEN** 诊断列出源文件、链接文本和全部候选路径

### Requirement: 不存在的内部链接被诊断
系统 SHALL 将无法解析的内部链接标记为错误，而不是生成静默失效的公开链接。

#### Scenario: 目标文件不存在
- **WHEN** 公开文章引用不存在的笔记
- **THEN** 严格模式失败并指出源文章和链接位置

### Requirement: Vault 私有目录不会被发布
系统 MUST 只扫描 `jacyl4/obsidian-digital:Blog/`，不得将 Vault 其他目录作为候选文章或链接目标。

#### Scenario: Blog 文章链接 Vault 其他目录
- **WHEN** wikilink 目标不在 `Blog/` 发布树
- **THEN** 编译失败且输出发布边界诊断，不读取或复制目标内容

### Requirement: 当前版本拒绝本地附件
系统 MUST 将本地图片、音频、视频或 PDF 引用视为不支持输入，不得猜测路径、复制文件或静默生成失效 URL。

#### Scenario: 文章引用本地图片
- **WHEN** `Blog/` 文章包含本地附件引用
- **THEN** 编译失败并显示引用位置，提示通过独立 change 定义附件发布契约

### Requirement: 诊断可定位
系统 SHALL 为内容错误提供机器可读代码、严重级别、源文件和尽可能精确的位置。

#### Scenario: CI 输出错误
- **WHEN** 内容验证失败
- **THEN** 人类日志和 JSON 报告使用相同诊断代码并可定位到源笔记

