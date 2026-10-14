# Changelog / 更新日志

All notable changes to ChatGPT_Latex are documented here. Dates use ISO 8601.

本文件记录 ChatGPT_Latex 的重要变更，日期使用 ISO 8601 格式。

## [1.2.0] - 2026-10-15

### Fixed / 修复

- Recognize the current ChatGPT writing panel's `chatgpt-writing-block` marker alongside the legacy layout and copy from a detached selection snapshot across editor transactions.
- 兼容新版 ChatGPT 的 `chatgpt-writing-block` 标识及旧版布局；使用脱离编辑器的选区快照，避免编辑器重建节点时丢失复制内容。

- Preserve an existing ordinary U+0020 space after an inline MathML equation with a Word spacer run only when prose follows; punctuation and paragraph endings remain unspaced.
- 行内 MathML 公式后接正文时，以 Word spacer run 保留原有的普通 U+0020 空格；公式后接标点或位于段尾时不增加空格。
- Remove non-essential MathML separator attributes from punctuation and normalize physical HTML line breaks around copied equations before Word paste.
- 移除标点 MathML 中非必要的 separator 属性，并在粘贴到 Word 前规范化公式周围的 HTML 物理换行。

### Added / 新增

- Support Word-ready copying from selections inside ChatGPT writing blocks while continuing to suppress the action in chat composers and ordinary editable controls.
- 支持从 ChatGPT 写作框选区复制 Word 富文本，同时继续屏蔽聊天输入框和普通可编辑控件中的插件操作。
- Capture and start writing-block selection copying on pointer press so ProseMirror cannot clear the live range before clipboard conversion begins.
- 在按钮按下瞬间捕获并开始复制写作框选区，避免 ProseMirror 在剪贴板转换前清除实时选区。
- Treat narrowly scoped epsilon assignments with numeric exponents, plus-minus numeric tolerances, and numeric comparison thresholds as semantic Word text instead of equations.
- 将受限形式的 epsilon 数值赋值、正负数值容差和数值比较阈值按语义化 Word 文本处理，不再识别为公式。

### Validation / 验证

- Added unit and isolated-browser coverage for formula-to-prose spaces, punctuation boundaries, and text-only scalar notation.
- 新增公式到正文空格、标点边界及纯文本短数值表达式的单元测试和隔离浏览器验证。
- Verified editable and read-only current writing panels, legacy panels, text-only copying, and selection snapshots after editor node replacement; all 32 unit tests passed.
- 验证新版可编辑/只读写作面板、旧版面板、纯文本复制，以及编辑器重建节点后的选区快照；32 项单元测试通过。

### Security / 安全

- Updated the bundled KaTeX runtime to 0.19.0 to address GHSA-238p-pmpm-9mq7; production dependency audit reports zero vulnerabilities.
- 内置 KaTeX 更新至 0.19.0，修复 GHSA-238p-pmpm-9mq7；生产依赖审计为 0 个漏洞。

## [1.1.2] - 2026-08-10

### Fixed / 修复

- Treat neutral molecular formulas, uppercase charged abbreviations, and standalone script fragments emitted by the current ChatGPT renderer as Word text with semantic scripts instead of MathML.
- 将中性分子式、带电大写缩写及新版 ChatGPT 拆分渲染的独立上下标片段按带语义上下标的 Word 文字处理，不再转为 MathML。
- Remove formula outlines, hover actions, and double-click editing from text-like script fragments while preserving formula controls for genuine mathematical expressions.
- 文本型上下标片段不再显示公式框、悬浮操作或双击编辑器，真正的数学表达式仍保留公式操作。
- Preserve standalone text scripts as `<sub>`/`<sup>` runs in both mixed selections and text-only selections so Word does not receive placeholder MathML boxes.
- 混合选区和纯文本选区均将独立上下标保留为 `<sub>`/`<sup>`，避免 Word 收到可能产生占位方框的 MathML。

### Performance / 性能

- Cache each formula element's normalized source classification and only reclassify it when the source changes; no additional prose scanning was introduced.
- 缓存每个公式元素的规范化源码分类，仅在源码变化时重新分类；未增加正文后台扫描。

### Security / 安全

- Audited tracked source and release files; no credentials, personal paths, browser data, experiment-specific identifiers, telemetry, or remote content-upload path are included.
- 审计受版本控制源码和发布文件；未包含凭据、个人路径、浏览器数据、实验专属标识、遥测或远程内容上传链路。

### Validation / 验证

- Passed 29 unit tests, extension validation, JavaScript syntax checks, dependency audit, and isolated browser coverage for `_2`, `^+`, and combined subscript/charge fragments.
- 通过 29 项单元测试、扩展校验、JavaScript 语法检查、依赖审计，以及 `_2`、`^+` 和下标/电荷组合片段的隔离浏览器验证。

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

[1.2.0]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.2.0
[1.1.2]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.1.2
[1.1.1]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.1.1
[1.1.0]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.1.0
[1.0.0]: https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.0.0
