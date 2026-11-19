# Contributing to ChatFacet / 贡献指南

## English

1. Fork the repository and branch from `main`.
2. Keep changes focused and do not add telemetry, remote code, broad host permissions, machine-specific paths, or private test data.
3. Use Conventional Commits such as `fix(word): preserve meaningful MathML spacing`.
4. Add or update focused tests for behavior changes.
5. Run `npm ci`, `npm run validate`, `npm run check`, and `npm test`.
6. Open a pull request using the template and describe browser/Word validation honestly.

UI changes must preserve the native selection action, support light and dark pages, and remain keyboard accessible. When changing selection controls, check both ChatGPT and Gemini, including the standalone fallback. New supported sites require the narrowest possible match pattern and representative fixtures.

KaTeX updates are manual because the extension vendors `src/vendor/katex.min.js`. Update the exact dependency and lockfile, copy the official distribution file and license, update `THIRD_PARTY_NOTICES.md`, then run the full security and Word-output regression suite.

## 中文

1. Fork 仓库并从 `main` 创建分支。
2. 保持改动聚焦，不得加入遥测、远程代码、宽泛站点权限、本机路径或私人测试数据。
3. 使用 Conventional Commits，例如 `fix(word): preserve meaningful MathML spacing`。
4. 行为发生变化时补充或更新对应测试。
5. 运行 `npm ci`、`npm run validate`、`npm run check` 和 `npm test`。
6. 按模板提交 Pull Request，并如实说明浏览器与 Word 验证范围。

UI 改动必须保留原生选区操作，支持浅色与深色页面，并可通过键盘操作。修改选区工具时，分别检查 ChatGPT、Gemini 及独立按钮回退。新增站点时应使用尽可能窄的匹配规则，并提供代表性测试页面。

KaTeX 更新必须人工完成，因为扩展会内置 `src/vendor/katex.min.js`。更新精确依赖与锁文件后，还需同步官方发行文件和许可证、更新 `THIRD_PARTY_NOTICES.md`，并重新运行完整安全与 Word 输出回归测试。
