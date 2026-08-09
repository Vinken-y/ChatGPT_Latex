"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const katex = require("../src/vendor/katex.min.js");
const {
  RENDER_LIMITS,
  buildWordHtml,
  latexToMathml,
  validateLatexInput
} = require("../src/word-mathml.js");

test("uses the audited vendored KaTeX release", () => {
  assert.equal(katex.version, "0.16.47");
});

test("renders a fraction as MathML for Word", () => {
  const latex = String.raw`R=\frac{\overline{A}_{1}/A_{1}^{\mathrm{ref}}}{\overline{B}_{2}/B_{2}^{\mathrm{ref}}}`;
  const mathml = latexToMathml(latex, katex);

  assert.match(mathml, /^<math\s/);
  assert.match(mathml, /xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
  assert.match(mathml, /<mfrac>/);
  assert.doesNotMatch(mathml, /<annotation/);
  assert.doesNotMatch(mathml, /\\frac/);
});

test("renders standard LaTeX matrix environments before Word clipboard output", () => {
  const mathml = latexToMathml(String.raw`\begin{pmatrix}a & b \\ c & d\end{pmatrix}`, katex);
  assert.match(mathml, /<mtable\b/);
  assert.match(mathml, /<mtr>/);
});

test("removes KaTeX spacing nodes that Word displays as placeholder boxes", () => {
  const latex = String.raw`F(x;R)=\mathbf 1\!\left[x\leq R\right],`;
  const mathml = latexToMathml(latex, katex);

  assert.doesNotMatch(mathml, /<mtext[^>]*>[\s\u2000-\u200b]*<\/mtext>/);
  assert.doesNotMatch(mathml, /<mspace\b/);
  assert.match(mathml, /<mo fence="true">\[<\/mo>/);
  assert.match(mathml, /<mo fence="true">\]<\/mo>/);
});

test("preserves meaningful positive spacing without Word placeholder controls", () => {
  const latex = String.raw`a\,b\:c\;d\quad e\qquad f`;
  const mathml = latexToMathml(latex, katex);

  assert.match(mathml, /<mspace width="0\.1667em"\/>/);
  assert.match(mathml, /<mspace width="0\.2222em"\/>/);
  assert.match(mathml, /<mspace width="0\.2778em"\/>/);
  assert.match(mathml, /<mspace width="1em"\/>/);
  assert.match(mathml, /<mspace width="2em"\/>/);
  assert.doesNotMatch(mathml, /[\u2061-\u2064]/);
});

test("wraps MathML in an HTML clipboard document", () => {
  const html = buildWordHtml('<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn></math>');
  assert.match(html, /^<html>/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<math /);
});

test("passes bounded expansion and size settings to KaTeX", () => {
  let receivedOptions;
  const fakeKatex = {
    renderToString(_latex, options) {
      receivedOptions = options;
      return "<math><mi>x</mi></math>";
    }
  };

  latexToMathml("x", fakeKatex);

  assert.equal(receivedOptions.maxExpand, RENDER_LIMITS.maxExpand);
  assert.equal(receivedOptions.maxSize, RENDER_LIMITS.maxSize);
  assert.equal(receivedOptions.trust, false);
  assert.equal(receivedOptions.throwOnError, true);
});

test("rejects oversized formulas before invoking KaTeX", () => {
  let renderCalled = false;
  const fakeKatex = {
    renderToString() {
      renderCalled = true;
      return "<math><mi>x</mi></math>";
    }
  };
  const oversized = "x".repeat(RENDER_LIMITS.maxLatexLength + 1);

  assert.throws(
    () => latexToMathml(oversized, fakeKatex),
    new RegExp(`${RENDER_LIMITS.maxLatexLength}-character limit`)
  );
  assert.equal(renderCalled, false);
});

test("accepts long formulas up to the configured input limit", () => {
  const atLimit = "x".repeat(RENDER_LIMITS.maxLatexLength);
  assert.equal(validateLatexInput(atLimit), atLimit);
  assert.throws(() => validateLatexInput(null), /must be a string/);
});

test("stops recursive macro expansion", () => {
  assert.throws(
    () => latexToMathml(String.raw`\def\loop{\loop}\loop`, katex),
    /Too many expansions/
  );
});
