# Changelog / 更新日志

All notable changes to ChatFacet (formerly ChatGPT for SCI) are documented here. Dates use ISO 8601.

本文件记录 ChatFacet（原 ChatGPT for SCI）的重要变更，日期使用 ISO 8601 格式。

## Repository maintenance / 仓库维护

- Renamed the GitHub repository to ChatFacet and updated project links and templates without changing the extension or existing releases.
- GitHub 仓库更名为 ChatFacet，并同步项目链接和模板；扩展功能和历史发布保持不变。

## [1.7.1] - 2026-11-19

- Updated the ChatFacet visual identity with a two-tone conversation mark and a coordinated popup header. Extension permissions and existing settings are unchanged.
- 更新 ChatFacet 品牌识别：采用双色分面对话图标，并统一弹窗页眉。扩展权限和已有设置不变。

## [1.7.0] - 2026-11-19

- Renamed the extension to ChatFacet to reflect its focus on visual and interaction enhancements for web AI chats. Existing preferences carry over in the same unpacked directory.
- 扩展更名为 ChatFacet，定位为网页版 AI 聊天的视觉与交互增强工具。沿用原加载目录时保留已有设置。
- Dock Copy to Word beside supported ChatGPT and Gemini selection actions when space allows, with placement that avoids the NextAI Translator selection icon when possible.
- 空间足够时将「复制到 Word」与 ChatGPT、Gemini 的原生选区操作并排显示，并尽量避开 NextAI Translator 的划词图标。
- Match the visible ChatGPT selection panel and highlight the entire docked Word segment on hover.
- 适配 ChatGPT「向 ChatGPT 提问」选区工具条，统一合并按钮的悬停样式。

## [1.6.0] - 2026-11-19

- Added independent font and bold color settings for ChatGPT and Gemini, with automatic detection of the current site. Existing ChatGPT preferences carry over.
- ChatGPT 和 Gemini 分别保存中英文字体与加粗颜色。弹窗自动识别当前网站，保留已有 ChatGPT 设置。
- Choosing a bold text color enables it for the selected site. Gemini's rich-text draft also follows the color setting.
- 选定加粗颜色时立即为所选网站开启着色，Gemini 输入框中已加粗的文字也会跟随设置。
- Treat inline Gemini chemical contact notation as Word text with subscripts, not as an equation.
- Gemini 行内化学接触记号按 Word 正文复制并保留下标，不再显示公式控件。

## [1.5.2] - 2026-11-19

### Changed / 变更

- Removed the font style shortcut and list the bundled Source fonts by their family names. Existing selections carry over.
- 删除字体风格快捷按钮，下拉菜单显示实际字体名，保留已有选择。

## 1.5.1 - 2026-11-19

### Changed / 变更

- Simplified the Typography panel with a new tab icon, compact settings rows, and the Claude preset beside the preview.
- 更新字体标签图标，移除重复标题，调整设置行间距，并将 Claude 风格快捷按钮移至预览区。

## 1.5.0 - 2026-11-19

### Changed / 变更

- Replaced per-area font preferences with independent page-wide Chinese and English fonts and a bilingual preview.
- 将分区域字体设置合并为整页中文和英文字体，并新增中英文预览。
- Added common system fonts and bundled Arimo and Tinos as offline substitutes for Arial and Times New Roman.
- 新增常见系统字体，内置 Arimo 和 Tinos 作为 Arial 和 Times New Roman 的离线后备。

## 1.4.1 - 2026-11-19

### Changed / 变更

- Restyled the popup, menus, and formula editor with a monochrome Ollama-inspired palette.
- 弹窗、展开菜单和公式编辑器改用 Ollama 风格的黑白灰配色。

### Fixed / 修复

- Give the browser action popup an intrinsic width of 384 CSS pixels so labels and controls have room on one line.
- 将原生扩展弹窗的内容宽度设为 384 CSS 像素，防止标题、设置名称和选项被挤成多行。

## 1.4.0 - 2026-11-19

### Changed / 变更

- Renamed the extension to ChatGPT for SCI and reorganized the popup into separate Typography and Copy tabs with system light and dark themes.
- 扩展更名为 ChatGPT for SCI，弹窗拆分为「字体」和「复制」两个页面，并随系统切换明暗主题。
- Added a live preview of message fonts and bold text color. Existing preferences carry over.
- 新增消息字体和加粗颜色的即时预览，保留现有偏好设置。
- Updated the opened font menus, the color panel with presets and HEX entry, and the formula editor to use the same visual style.
- 字体下拉菜单、带预设色和 HEX 输入的颜色面板、公式编辑器采用统一视觉样式。

## 1.3.4 - 2026-11-19

### Added / 新增

- Added an optional custom color for bold text in ChatGPT messages and writing panels.
- 新增 ChatGPT 对话与写作面板的加粗文字颜色，可单独开启和自定义。

## 1.3.3 - 2026-11-19

### Fixed / 修复

- Let sent messages and live input follow the reply font by default, and offer a separate choice for both user-facing text areas.
- 已发送消息和实时输入默认跟随回复字体，也支持单独设置这两处的字体。
- Apply the selected text font to rich editor content and placeholder text.
- 将所选字体应用于富文本输入和占位文字。

## 1.3.2 - 2026-11-19

### Fixed / 修复

- Apply the selected fonts to newly sent user messages and to assistant replies during streaming and after completion.
- 新发送的用户消息即时应用界面字体，ChatGPT 回复在生成中和生成完成后统一使用回复字体。

## 1.3.1 - 2026-11-19

### Fixed / 修复

- Apply reply typography to ChatGPT's current response renderer, including lists and tables, and use installed Noto Serif SC for Chinese text in the serif preset.
- 将回复字体应用于 ChatGPT 新版正文、列表和表格，并在衬线预设中优先使用系统已安装的思源宋体系列中文字体。

## 1.3.0 - 2026-11-19

### Added / 新增

- Added separate ChatGPT interface and reply fonts with a Claude-style preset and offline Source Sans 3 and Source Serif 4 fonts.
- 新增独立的 ChatGPT 界面与回复字体设置，提供 Claude 风格预设，离线内置 Source Sans 3 和 Source Serif 4。

## 1.2.1 - 2026-11-19

### Fixed / 修复

- Preserve Gemini's text-like chemical labels, unit exponents, and superscript references as Word text while retaining genuine equations as MathML.
- 将 Gemini 的文本型化学记号、单位指数和上标引用转换为 Word 文本，真正的公式仍使用 MathML。
- Preserve the complete math node at a selection boundary, use Gemini's rendered LaTeX annotation when available, and keep unrendered tokens as text so they cannot block mixed copying.
- 选区边界保留完整公式节点，优先读取 Gemini 渲染后的 LaTeX 注释，并将渲染失败的片段作为文本保留，避免整段复制失败。

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

[1.7.1]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.7.1
[1.7.0]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.7.0
[1.6.0]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.6.0
[1.5.2]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.5.2
[1.2.0]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.2.0
[1.1.2]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.1.2
[1.1.1]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.1.1
[1.1.0]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.1.0
[1.0.0]: https://github.com/Vinken-y/ChatFacet/releases/tag/v1.0.0
