(function initWordMathml(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.WordMathml = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createApi() {
  "use strict";

  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const RENDER_LIMITS = Object.freeze({
    maxLatexLength: 100000,
    maxExpand: 1000,
    maxSize: 100
  });
  const MATHML_TEXT_SPACE_WIDTHS = new Map([
    ["\u00a0", "0.3333em"],
    ["\u2009", "0.1667em"],
    ["\u2005", "0.2222em"],
    ["\u2005\u200a", "0.2778em"]
  ]);

  function normalizeMathmlTextSpace(match, content) {
    if (/[\u2061-\u2064]/.test(content)) {
      return "";
    }

    const compact = content.replace(/[\t\n\r ]/g, "");
    const width = MATHML_TEXT_SPACE_WIDTHS.get(compact);
    if (width) {
      return `<mspace width="${width}"/>`;
    }

    return compact ? match : '<mspace width="0.3333em"/>';
  }

  function validateLatexInput(latex) {
    if (typeof latex !== "string") {
      throw new TypeError("LaTeX input must be a string");
    }

    if (latex.length > RENDER_LIMITS.maxLatexLength) {
      throw new RangeError(
        `LaTeX input exceeds the ${RENDER_LIMITS.maxLatexLength}-character limit`
      );
    }

    return latex;
  }

  function latexToMathml(latex, katexApi) {
    if (!katexApi || typeof katexApi.renderToString !== "function") {
      throw new Error("KaTeX is unavailable");
    }

    validateLatexInput(latex);

    const rendered = katexApi.renderToString(latex, {
      displayMode: true,
      output: "mathml",
      throwOnError: true,
      strict: "ignore",
      trust: false,
      maxExpand: RENDER_LIMITS.maxExpand,
      maxSize: RENDER_LIMITS.maxSize
    });
    const match = rendered.match(/<math[^>]*>[\s\S]*<\/math>/i);

    if (!match) {
      throw new Error("KaTeX did not produce MathML");
    }

    let mathml = match[0]
      .replace(/\s*stretchy="false"/gi, "")
      .replace(/\s*separator="true"/gi, "")
      .replace(/\s*display="[^"]*"/gi, "")
      .replace(/<semantics>([\s\S]*?)<annotation[^>]*>[\s\S]*?<\/annotation><\/semantics>/i, "$1")
      .replace(
        /<mtext[^>]*>([\s\u00a0\u2000-\u200b\u2061-\u2064]*)<\/mtext>/gi,
        normalizeMathmlTextSpace
      )
      .replace(/&#x206[1-4];/gi, "")
      .replace(/[\u2061-\u2064]/g, "")
      .replace(/<mspace\b(?=[^>]*\bwidth="\s*-)[^>]*(?:\/>|>\s*<\/mspace>)/gi, "")
      .replace(/<mo[^>]*>\s*<\/mo>/gi, "");

    if (!/\sxmlns=/.test(mathml)) {
      mathml = mathml.replace(/^<math/, `<math xmlns="${MATHML_NAMESPACE}"`);
    }

    return mathml;
  }

  function buildWordHtml(mathml) {
    return [
      "<html>",
      '<head><meta charset="utf-8"></head>',
      "<body>",
      mathml,
      "</body>",
      "</html>"
    ].join("");
  }

  return {
    MATHML_NAMESPACE,
    RENDER_LIMITS,
    buildWordHtml,
    latexToMathml,
    validateLatexInput
  };
});
