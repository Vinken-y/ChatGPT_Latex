# Privacy Policy / 隐私政策

Effective date: 2026-08-09

生效日期：2026-08-09

## English

ChatGPT_Latex processes formulas and user-selected text locally inside the browser extension.

- **Data read:** formula-related DOM content on the explicitly supported AI chat sites listed in `manifest.json`; the selected DOM range only after the user selects ordinary text.
- **Purpose:** detect formulas, show local controls, normalize LaTeX, convert selected Unicode scientific scripts to Word rich text, and create clipboard content requested by the user.
- **Data transfer:** no selected text, chat text, or formula is sent to the developer, an analytics service, or any external server. Formula conversion messages remain inside the extension between the content script and its service worker; selected text conversion stays in the content script.
- **Storage:** the extension stores only the close-after-copy preference in local browser extension storage. The extension does not sync that preference and does not store formulas or chat content.
- **Clipboard:** the extension writes to the clipboard only after the user activates a copy control. It does not read clipboard contents.
- **Telemetry and advertising:** none.
- **Remote code:** none. Runtime code and the KaTeX dependency are bundled with the extension.

Removing the extension deletes its extension storage according to the browser's normal behavior. Questions may be opened as a public GitHub issue only when they contain no private chat content. Security-sensitive reports must follow `SECURITY.md`.

## 中文

ChatGPT_Latex 仅在浏览器扩展内部本地处理公式和用户主动选择的文本。

- **读取的数据：** `manifest.json` 明确列出的受支持 AI 聊天站点中的公式相关 DOM；普通正文仅在用户完成文本选择后读取对应选区。
- **用途：** 识别公式、显示本地控件、规范化 LaTeX、将所选 Unicode 科学上下标转换为 Word 富文本，并生成用户主动请求的剪贴板内容。
- **数据传输：** 所选文本、聊天文本和公式都不会发送给开发者、分析服务或任何外部服务器。公式转换消息只在扩展内容脚本与自身 service worker 之间传递；所选文本转换完全留在内容脚本内。
- **数据存储：** 只在浏览器扩展的本地存储中保存“复制后关闭”设置；扩展不会同步该设置，也不保存公式或聊天内容。
- **剪贴板：** 仅在用户点击复制控件后写入剪贴板；扩展不读取剪贴板内容。
- **遥测与广告：** 无。
- **远程代码：** 无。运行时代码和 KaTeX 依赖均随扩展打包。

移除扩展后，浏览器会按自身正常机制删除扩展存储。一般问题可在不包含私人聊天内容的前提下提交 GitHub Issue；涉及安全的信息必须按 `SECURITY.md` 私下报告。
