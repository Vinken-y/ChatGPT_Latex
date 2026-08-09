# Changelog / 更新日志

All notable changes to ChatGPT_Latex are documented here. Dates use ISO 8601.

本文件记录 ChatGPT_Latex 的重要变更，日期使用 ISO 8601 格式。

## [1.1.1] - 2026-08-10

### Added / 新增

- Added one-click Word copying for selections that combine ordinary text and rendered formulas, preserving their original order in one rich clipboard payload.
- 新增文字与公式混合选区的一键复制到 Word，文字和公式按原顺序写入同一个富剪贴板内容。
- Added immediate popup controls for formula recognition, text recognition, and optional LaTeX actions; enabling both recognition controls activates mixed selection copying.
- 新增公式识别、文本识别及可选 LaTeX 操作的即时设置开关；同时开启两个识别开关即可启用混合选区复制。
- Added separate default-on controls for removing source bold and matching Word body formatting; either behavior can now be disabled independently.
- 新增彼此独立且默认开启的“移除来源加粗”和“匹配 Word 正文格式”开关，可分别关闭任一行为。

### Changed / 变更

- Simple charged chemical labels are copied as Word text with element counts in `<sub>` and charges in `<sup>`; full equations continue to use MathML.
- 简单带电离子按 Word 文字处理，元素数量为 `<sub>` 下标，电荷为 `<sup>` 上标；完整方程仍使用 MathML。

### Performance / 性能

- Mixed selection conversion remains user-triggered, reuses one selection action, and does not add background prose scanning or per-formula controls.
- 混合选区转换仍仅由用户操作触发，复用一个选区按钮，不增加后台正文扫描或逐公式控件。

### Security / 安全

- Audited all tracked source files before release; no credentials, personal paths, private browser data, experiment-specific samples, telemetry, or remote content-upload path are included.
- 发布前审计全部受版本控制的源文件；未包含凭据、个人路径、浏览器隐私数据、实验专属样品、遥测或远程内容上传链路。

### Validation / 验证

- Passed 28 unit tests, extension manifest/localization validation, JavaScript syntax checks, and headless Chrome coverage for all four Word-formatting switch combinations.
- 通过 28 项单元测试、扩展清单与本地化校验、JavaScript 语法检查，以及四种 Word 格式开关组合的无头 Chrome 验证。

## [1.1.0] - 2026-08-09

### Added / 新增

- Added a selection-triggered **Copy text to Word** action for ordinary scientific prose.
- 新增仅由用户文本选区触发的“复制文本到 Word”操作。
- Converts Unicode superscripts/subscripts to semantic Word rich text while preserving safe headings, lists, emphasis, links, and table structure.
- 将 Unicode 上下标转换为 Word 可识别的语义化富文本，并保留安全的标题、列表、强调、链接和表格结构。
- Added collision-aware placement beside ChatGPT's native selection actions, with light/dark styling and formula-boundary suppression.
- 新增对 ChatGPT 原生选区窗格的碰撞避让、深浅色适配和公式边界抑制。

### Fixed / 修复

- Restored formula recognition on the current ChatGPT renderer, which exposes source through `span[role="math"][data-math-source]` instead of MathML annotations.
- 修复新版 ChatGPT 使用 `span[role="math"][data-math-source]` 取代 MathML 注释后导致的公式识别失效。
- Added narrowly filtered formula-source attribute observation so late renderer updates are recognized without watching unrelated page attributes.
- 新增仅限公式源码属性的动态观察，使后加载公式能够被识别，同时避免监听无关网页属性。

### Validation / 验证

- Added Unicode-script unit tests and headless Chrome fixtures for native-menu avoidance, current ChatGPT formula markup, dynamic formula updates, and formula/text interaction boundaries.
- 新增 Unicode 上下标单元测试，以及原生窗格避让、新版 ChatGPT 公式结构、动态公式更新和公式/文本交互边界的无头 Chrome 测试。

## [1.0.0] - 2026-07-15

### Added / 新增

- Added equal-priority **Copy LaTeX** and **Copy to Word** actions in both the hover toolbar and editor.
- 新增视觉层级相同的“复制 LaTeX”和“复制到 Word”操作，悬浮工具栏与编辑器保持一致。
- Added English and Simplified Chinese localization, privacy/security documentation, CI, and public release metadata.
- 新增英文/简体中文国际化、隐私与安全文档、CI 和公开发布元数据。

### Fixed / 修复

- Removed physical line breaks and indentation from copied LaTeX while preserving semantic LaTeX row separators.
- 清理复制内容中的物理回车和缩进，同时保留具有语义的 LaTeX 行分隔命令。
- Removed empty KaTeX spacing nodes that can appear as placeholder boxes in Word.
- 移除可能在 Word 中显示为方框的空白 KaTeX 节点。
- Preserved positive formula spacing while removing negative spacing controls from both MathML and Word text fallback output.
- 保留正向公式间距，同时从 MathML 与 Word 纯文本回退中移除可能产生方框的负间距控制符。

### Performance / 性能

- Moved KaTeX rendering from page content scripts to the extension service worker.
- 将 KaTeX 渲染从网页内容脚本迁移到扩展 service worker。
- Replaced per-formula buttons/listeners with one shared floating toolbar, idle scanning, bounded batches, and debounced compatibility checks.
- 使用单一共享悬浮工具栏、空闲扫描、有限批次和防抖兼容性检查，替代逐公式注入按钮与监听器。

### Compatibility / 兼容性

- Added detection for KaTeX, MathJax, native MathML, and common `data-math` containers.
- 增加 KaTeX、MathJax、原生 MathML 和常见 `data-math` 容器识别。
- Added rich MathML clipboard output with Word-linear LaTeX fallback.
- 增加 MathML 富剪贴板输出与 Word 线性 LaTeX 回退。

### Security / 安全

- Updated the bundled KaTeX dependency and added explicit input, macro-expansion, and render-size limits.
- 更新内置 KaTeX，并加入明确的输入长度、宏展开次数和渲染尺寸限制。
- Confirmed no telemetry, remote code, or formula upload path exists.
- 确认项目不包含遥测、远程代码或公式上传链路。

### Validation / 验证

- Added automated source checks, manifest/localization validation, unit tests, and extension fixtures.
- 新增源码语法检查、Manifest/本地化校验、单元测试和扩展测试页面。

[1.1.1]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.1.1
[1.1.0]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.1.0
[1.0.0]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.0.0
