# ChatGPT_Latex

![ChatGPT_Latex icon](icons/128.png)

[![CI](https://github.com/Vinken-y/ChatGPT_Latex/actions/workflows/ci.yml/badge.svg)](https://github.com/Vinken-y/ChatGPT_Latex/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Vinken-y/ChatGPT_Latex)](https://github.com/Vinken-y/ChatGPT_Latex/releases/latest)
[![License](https://img.shields.io/github/license/Vinken-y/ChatGPT_Latex)](LICENSE)

ChatGPT_Latex is a lightweight Manifest V3 extension for moving scientific content from supported AI chat pages into Microsoft Word. Hover a recognized formula to copy the complete Word equation; select prose, formulas, or both to copy a Word-ready rich selection with real superscript and subscript formatting.

[简体中文](README.zh-CN.md) | [Privacy](PRIVACY.md) | [Security](SECURITY.md) | [Performance](docs/PERFORMANCE.md) | [Changelog](CHANGELOG.md)

## Features

- Detects KaTeX, MathJax, native MathML, `data-math`, and current ChatGPT `data-math-source` formulas.
- Shows one shared hover toolbar with **Copy to Word** as the primary action. **Copy LaTeX** can be enabled from the extension settings.
- Copies a selection containing both prose and formulas in one Word-ready rich clipboard payload; it does not scan prose in the background.
- Converts generic Unicode scientific notation such as `A⁺`, `B₂`, `C₃⁻`, `x⁻¹`, and `y⁻²` into real Word superscript/subscript runs while preserving semantic rich-text structure.
- Treats simple molecular formulas and charged scientific labels as Word text with semantic `<sub>`/`<sup>` scripts and excludes them from formula hover/edit controls, while equations and mathematical expressions remain MathML.
- Keeps formula-only and mixed-selection workflows separate: formula-only selections use the formula toolbar, while mixed selections use **Copy to Word**.
- Removes physical line breaks, indentation, comments, zero-width characters, and outer math delimiters without removing LaTeX row separators such as `\\`.
- Copies a complete equation to Word as MathML-rich clipboard data, with normalized Word-linear LaTeX as the plain-text fallback.
- Converts common matrix and alignment environments for Word's LaTeX fallback syntax.
- Supports light and dark pages without changing the host formula's layout.
- Runs MathML rendering in the extension service worker rather than loading KaTeX into every page.
- Includes English and Simplified Chinese interfaces.

## Supported pages

- ChatGPT: `chatgpt.com` and `chat.openai.com`
- Claude: `claude.ai`
- DeepSeek: `chat.deepseek.com`
- Gemini: `gemini.google.com`
- Microsoft Copilot: `copilot.microsoft.com`

The extension reads formula-related DOM on these explicitly matched sites. Selected content is cloned only after the user makes a text selection and activates **Copy to Word**. Page changes by a provider can require a compatibility update.

## Install

### GitHub release

1. Download `ChatGPT_Latex-v1.1.2.zip` from the [v1.1.2 release](https://github.com/Vinken-y/ChatGPT_Latex/releases/tag/v1.1.2).
2. Extract the archive.
3. Open `chrome://extensions` or `edge://extensions`.
4. Enable **Developer mode**.
5. Select **Load unpacked** and choose the extracted `ChatGPT_Latex-v1.1.2` directory.

### Source checkout

```powershell
git clone https://github.com/Vinken-y/ChatGPT_Latex.git
```

Load the cloned directory as an unpacked extension. No build step is required.

## Use

1. Open a supported AI chat page containing a rendered formula.
2. Move the pointer over the formula.
3. Choose **Copy to Word**. Enable **Copy LaTeX** in the extension settings when the source text action is needed.
4. Double-click the formula when you need to review or edit the normalized source.

For prose and mixed selections:

1. Select ordinary text, a formula, or a passage containing both.
2. Choose **Copy to Word** from the small action shown beside the selection. Formula-only selections use the formula hover toolbar.
3. Paste normally in Word. Text structure, Unicode superscripts/subscripts, and inline equations are emitted in one rich HTML payload.

The selection action is positioned below the selection by default and avoids nearby native `menu`/`toolbar` surfaces. Formula hover controls remain a separate interaction.

### Settings

The popup applies changes immediately. **Formula recognition** controls formula hover boxes and the editor, while **Text recognition** controls prose selection actions. Enabling both automatically enables mixed text-and-formula selection copying. **Remove source bold** is on by default and only changes source bold text to regular weight. **Match Word body formatting** is independently enabled by default; it removes web style overrides, marks copied blocks as Word Normal text, and leaves font and line spacing to the destination document where possible. **Show Copy LaTeX** adds the LaTeX action back to formula controls; it is off by default.

A browser extension cannot inspect the font or paragraph spacing before the insertion point inside Word. Exact destination-style matching would require a Word add-in or macro; this option provides the closest clipboard-only behavior.

### What Copy to Word does

**Copy to Word** copies the entire equation, not only its displayed characters. The primary clipboard format is MathML inside `text/html`; supported desktop versions of Word can consume this rich format and create a professional equation when pasted into the document body. In a mixed selection, each full equation is placed at its original text position, while simple molecular formulas and charged scientific labels use semantic `<sub>`/`<sup>` text runs instead of equation markup. Normalized Word-linear LaTeX is included as `text/plain` fallback data.

If a Word configuration ignores the rich clipboard format, press `Alt` + `=` to insert an equation, ensure the equation input mode is LaTeX, paste, and choose **Professional** conversion. That manual sequence is a fallback, not the intended one-click path.

## Compatibility

- Browser target: current Chrome and Microsoft Edge releases on Windows 10/11.
- Word target: current Microsoft 365/Word desktop for Windows.
- Word Online, Word for macOS, LibreOffice, Firefox, and Safari are not currently validated.
- Clipboard policies, protected pages, remote desktop software, or enterprise settings can block rich clipboard writes.

Word supports a subset of LaTeX rather than a complete TeX engine. The editor reports unsupported keywords and environments. MathML is generated with bundled KaTeX under explicit expansion, input-length, and size limits.

## Permissions and privacy

| Permission/scope | Purpose |
| --- | --- |
| `clipboardWrite` | Writes only after the user clicks a copy action. |
| `storage` | Stores recognition and copy preferences locally; formulas are never stored. |
| Supported-site content scripts | Detects formula DOM, reacts to explicit text selections, and displays local controls. |

Chat content and formulas are not sent to a server, logged, analyzed, or used for telemetry. See [PRIVACY.md](PRIVACY.md) for the complete disclosure.

## Development

Requirements: Node.js 20 or newer.

```powershell
npm ci
npm run validate
npm run check
npm test
```

The shipped extension is plain HTML, CSS, and JavaScript. Unit tests cover newline normalization, Word fallback conversion, MathML generation, Unicode script conversion, clipboard HTML, dependency limits, and spacing behavior. Local headless Chrome tests cover current ChatGPT formula recognition, dynamic source attributes, selection-menu positioning, and the formula/text boundary.

## Performance design

- A single `MutationObserver` watches added nodes and a narrow set of formula-source attributes; scans are deferred to idle time and processed in bounded chunks.
- One floating toolbar and two click listeners are reused across all formulas.
- The text action uses one shared button and reacts only to completed selections; it performs no continuous prose scan.
- Recognition styling uses outline/overlay effects and does not add formula margin or padding.
- KaTeX runs on demand in the extension service worker and is absent from the page content-script bundle.
- Input compatibility checks are debounced while editing.

## Project policy

Contributions are welcome through [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues privately as described in [SECURITY.md](SECURITY.md). Release history is in [CHANGELOG.md](CHANGELOG.md), and third-party licensing is recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Trademark notice

ChatGPT, OpenAI, Microsoft Word, Claude, DeepSeek, Gemini, Copilot, Chrome, Edge, KaTeX, and Revolut are trademarks or product names of their respective owners. ChatGPT_Latex is an independent project and is not affiliated with, endorsed by, or sponsored by those owners.

## License

ChatGPT_Latex is released under the [MIT License](LICENSE).
