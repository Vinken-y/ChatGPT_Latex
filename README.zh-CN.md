# ChatGPT_Latex

ChatGPT_Latex 是一个轻量级 Chrome Manifest V3 扩展，用于将 AI 聊天页面中的科学内容复制到 Microsoft Word。鼠标悬停公式后可复制规范化的 LaTeX 或完整 Word 公式；选中普通正文后可复制具有真正上下标格式的 Word 富文本。

[English](README.md) | [隐私说明](PRIVACY.md) | [安全政策](SECURITY.md) | [性能审查](docs/PERFORMANCE.md) | [更新日志](CHANGELOG.md)

## 主要功能

- 识别 KaTeX、MathJax、原生 MathML、`data-math` 和新版 ChatGPT 的 `data-math-source` 公式。
- 全页面只复用一个悬浮工具栏，“复制 LaTeX”和“复制到 Word”两个按钮具有相同视觉层级。
- 仅在用户选中非公式正文后显示“复制文本到 Word”，不会在后台扫描普通正文。
- 将 `CTPP⁺`、`H₂O`、`I₃⁻`、`g⁻¹`、`cm⁻²` 等 Unicode 科学符号转换为 Word 的真正上标/下标，同时保留正文富文本结构。
- 公式和文本流程相互独立：选区与已渲染公式相交时，不显示文本复制入口。
- 清理物理回车、缩进、注释、零宽字符和最外层数学分隔符，同时保留矩阵中的 LaTeX 换行命令 `\\`。
- 将完整公式以 MathML 富剪贴板格式复制，并同时提供规范化的 Word 线性 LaTeX 纯文本回退。
- 将常见矩阵和对齐环境转换为 Word 回退语法可接受的形式。
- 支持浅色与深色页面，识别效果不会改变网页原有公式布局。
- MathML 转换只在扩展 service worker 中按需运行，不把 KaTeX 加载到每个网页。
- 提供英文与简体中文界面。

## 支持页面

- ChatGPT：`chatgpt.com`、`chat.openai.com`
- Claude：`claude.ai`
- DeepSeek：`chat.deepseek.com`
- Gemini：`gemini.google.com`
- Microsoft Copilot：`copilot.microsoft.com`

扩展只在这些明确列出的站点读取公式相关 DOM。普通正文仅在用户完成文本选择并点击“复制文本到 Word”后克隆处理。服务商修改页面结构后，可能需要更新兼容逻辑。

## 安装

### GitHub 正式版

1. 从 [v1.0.0 Release](https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.0.0) 下载 `ChatGPT_Latex-v1.0.0.zip`。
2. 解压该文件。
3. 打开 `chrome://extensions` 或 `edge://extensions`。
4. 开启“开发者模式”。
5. 点击“加载已解压的扩展程序”，选择解压后的 `ChatGPT_Latex-v1.0.0` 目录。

### 源码安装

```powershell
git clone https://github.com/Vinken-y/ChatGPT_Latex.git
```

将克隆目录作为已解压扩展加载即可，无需构建。

## 使用方式

1. 在支持的 AI 聊天页面打开一段含已渲染公式的内容。
2. 将鼠标移到公式上。
3. 点击“复制 LaTeX”或“复制到 Word”。两个操作是平行关系。
4. 需要检查或编辑源码时，双击公式打开编辑器。

复制普通科学正文时：

1. 选中不与已渲染公式相交的文字。
2. 点击选区旁的小型“复制文本到 Word”按钮。
3. 在 Word 中正常粘贴。Unicode 上下标会通过语义化 `<sup>`/`<sub>` 富文本转换为 Word 的真正上下标。

文本按钮默认位于选区下方，并避让附近的原生 `menu/toolbar` 窗格；公式悬浮按钮保持独立。

### “复制到 Word”的实际逻辑

“复制到 Word”复制的是整个公式，而不是公式的可见字符。主要剪贴板格式为 `text/html` 中的 MathML；受支持的 Windows 桌面版 Word 可在正文中直接粘贴为专业公式。剪贴板中还会同时写入规范化后的 Word 线性 LaTeX，作为 `text/plain` 回退内容。

若某个 Word 配置没有采用富剪贴板格式，可按 `Alt` + `=` 插入公式，确认输入模式为 LaTeX，再粘贴并选择“专业”转换。该人工流程仅是回退方案，正常目标是一键复制后直接粘贴为完整公式。

## 兼容范围

- 浏览器目标：Windows 10/11 上的当前版 Chrome 与 Microsoft Edge。
- Word 目标：当前 Microsoft 365/Windows 桌面版 Word。
- 尚未验证 Word Online、macOS 版 Word、LibreOffice、Firefox 和 Safari。
- 企业策略、受保护页面、远程桌面或剪贴板软件可能拦截富剪贴板写入。

Word 支持的是 LaTeX 子集，而不是完整 TeX 引擎。编辑器会提示不支持的关键字与环境。MathML 由随扩展打包的 KaTeX 生成，并设置显式的输入长度、宏展开和尺寸限制。

## 权限与隐私

| 权限/范围 | 用途 |
| --- | --- |
| `clipboardWrite` | 仅在用户点击复制按钮后写入剪贴板。 |
| `storage` | 在本机保存“复制后关闭”设置；不保存公式。 |
| 支持站点内容脚本 | 识别公式 DOM、响应用户主动文本选择，并显示本地控件。 |

聊天内容和公式不会发送到服务器，不会记录、分析，也不包含遥测。完整说明见 [PRIVACY.md](PRIVACY.md)。

## 开发与验证

要求 Node.js 20 或更新版本。

```powershell
npm ci
npm run validate
npm run check
npm test
```

扩展运行时为原生 HTML、CSS 和 JavaScript，无需构建。单元测试覆盖回车规范化、Word 回退转换、MathML 生成、Unicode 上下标转换、富剪贴板 HTML、依赖限制和间距行为；本机无头 Chrome 测试覆盖新版 ChatGPT 公式结构、动态源码属性、选区菜单定位及公式/文本边界。

## 性能设计

- 只使用一个 `MutationObserver`，观察新增节点和有限的公式源码属性；扫描在浏览器空闲时以有限批次执行。
- 所有公式复用一个浮动工具栏和两个点击监听器。
- 文本功能复用一个按钮，仅在选区完成后响应，不连续扫描正文。
- 识别样式使用不参与布局的轮廓/覆盖效果，不增加公式的 margin 或 padding。
- KaTeX 只在扩展 service worker 中按需运行，不进入网页内容脚本。
- 编辑时的 Word 兼容性检查采用防抖处理。

## 项目规范

贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)，安全问题请按 [SECURITY.md](SECURITY.md) 私下报告，版本记录见 [CHANGELOG.md](CHANGELOG.md)，第三方许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 商标与关联声明

ChatGPT、OpenAI、Microsoft Word、Claude、DeepSeek、Gemini、Copilot、Chrome、Edge、KaTeX 和 Revolut 均为各自权利人的商标或产品名称。ChatGPT_Latex 是独立项目，与上述权利人不存在关联，也未获得其认可或赞助。

## 许可证

ChatGPT_Latex 使用 [MIT License](LICENSE) 开源。
