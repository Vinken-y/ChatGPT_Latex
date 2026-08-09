# Performance audit / 性能审查

Audit date: 2026-08-09. Measurements are intended to catch architectural regressions, not to promise identical timings on every page or device.

审查日期：2026-08-09。以下数据用于发现架构回退，不代表所有网页和设备都会得到完全相同的时间结果。

## Findings / 结论

- The previously loaded implementation injected one toolbar and two buttons into every recognized formula. In one existing long ChatGPT page with 109 recognized formulas, this produced **109 toolbar containers and 218 buttons**.
- 新实现不再向每个公式内部注入控件；整个页面固定为 **1 个工具栏、2 个按钮和常量数量的监听器**。
- A local Chrome fixture dynamically inserted 100 formulas. All 100 were recognized, the page still contained exactly one toolbar, and no formula contained an embedded toolbar.
- 本机 Chrome 测试确认悬停前后公式边界尺寸保持不变，鼠标从公式移动到工具栏时不会闪退，离开后正常隐藏。
- v1.1.0 adds one reusable text-selection action. It is created only after a completed, eligible selection and performs no background prose scan.
- v1.1.0 只新增一个可复用的文本选区按钮；仅在用户完成有效选区后创建，不在后台扫描普通正文。
- The formula observer watches added nodes plus six formula-source attributes. It does not watch generic class/style changes or character data.
- 公式观察器只监听新增节点和六个公式源码属性，不监听通用 class/style 变化或字符数据。

## Runtime design / 运行时设计

| Area | v1.1.0 behavior |
| --- | --- |
| Initial recognition | Scheduled during idle time; no synchronous whole-document startup scan. |
| Dynamic updates | One `MutationObserver` for child additions and formula-source attributes; roots are deduplicated and processed in approximately 8 ms slices. |
| Hover UI | One fixed-position toolbar is reused for every formula. |
| Text selection UI | One fixed-position button is created on demand after a completed non-formula selection. |
| Selection processing | DOM cloning, sanitization, and Unicode script conversion run only after the user clicks the text-copy action. |
| Position updates | Scroll and resize updates are coalesced through one `requestAnimationFrame`. |
| Editor checks | Word compatibility analysis is debounced by 120 ms. |
| Host layout | Recognition uses `outline`; no formula margin, padding, or positioning is changed. |
| Math rendering | KaTeX runs on demand in the extension service worker after a user copy action. |

## Script footprint / 脚本体积

Raw and gzip sizes from the v1.1.0 source tree:

| File | Raw | Gzip |
| --- | ---: | ---: |
| `src/content.js` | 36,948 B | 8,204 B |
| `src/content.css` | 12,165 B | 2,287 B |
| `src/latex-normalizer.js` | 5,206 B | 1,678 B |
| `src/word-mathml.js` | 2,945 B | 1,221 B |
| `src/word-text.js` | 7,217 B | 2,455 B |
| `src/vendor/katex.min.js` | 272,537 B | 75,808 B |

KaTeX is not listed as a content script. Its 272 KB runtime therefore is not parsed or executed in the page context during ordinary browsing. It is loaded by the extension service worker only when **Copy to Word** is requested.

KaTeX 未列入内容脚本，因此日常浏览时不会在网页上下文解析或执行这 272 KB 运行时；只有用户点击“复制到 Word”后，扩展 service worker 才会按需加载和执行。

## Residual cost / 剩余开销

The content script still queries formula selectors during its idle scan and observes added elements plus formula-source attributes on supported sites. Very large provider-side DOM replacements can temporarily enqueue additional scans, but duplicate roots and already recognized formulas are deduplicated. Selection listeners perform only collapsed/non-empty checks until the user completes a selection; rich-text conversion runs only on the copy click.

内容脚本仍需在空闲扫描中查询公式选择器，并在受支持站点观察新增元素和公式源码属性。服务商一次性替换超大 DOM 时可能暂时增加扫描任务，但重复根节点和已识别公式会被去重。文本选区监听在用户完成选择前只做折叠/非空判断；富文本转换仅在点击复制按钮后运行。
