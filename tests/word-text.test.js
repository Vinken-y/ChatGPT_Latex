"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getScriptToken,
  parseGeminiTextLatex,
  parseScientificLabelLatex,
  parseSimpleIonLatex,
  parseStandaloneTextScripts,
  parseWordTextLatex,
  splitUnicodeScripts
} = require("../src/word-text.js");

test("converts Gemini text notation while preserving genuine equations", () => {
  const cases = [
    [String.raw`\text{Me}_2\text{O}`, "Me<sub>2</sub>O"],
    [String.raw`\text{A}/\text{B}_2\text{N}`, "A/B<sub>2</sub>N"],
    [String.raw`\text{Ca}(\text{OH})_2`, "Ca(OH)<sub>2</sub>"],
    [String.raw`[\text{A}^+][\text{B}_2^-]`, "[A<sup>+</sup>][B<sub>2</sub><sup>−</sup>]"],
    [String.raw`{}^{2}\text{C}`, "<sup>2</sup>C"],
    [String.raw`^{12, 15}`, "<sup>12, 15</sup>"],
    [String.raw`\text{p}K_\text{a}`, "pK<sub>a</sub>"],
    [String.raw`2\text{ mA cm}^{-2}`, "2 mA cm<sup>−2</sup>"]
  ];
  for (const [latex, expected] of cases) {
    assert.equal(parseGeminiTextLatex(latex)?.html, "<span>" + expected + "</span>", latex);
  }
  for (const latex of [
    String.raw`x_i^2`, String.raw`\frac{\text{A}_2}{\text{B}_2}`,
    String.raw`\text{A}_2+\text{B}_2\to\text{C}`, String.raw`T\Delta S_\text{ref}`,
    String.raw`\text{A}_2<\text{B}_2`, String.raw`\text{Ca}(\text{OH}_2`, String.raw`\text{Na}__2`
  ]) {
    assert.equal(parseGeminiTextLatex(latex), null, latex);
  }
});

test("keeps Gemini chemical contacts in text and leaves multiplication as math", () => {
  const contact = "<span>\u2212OH \u22ef NH<sub>3</sub></span>";
  for (const latex of [
    String.raw`-\mathrm{OH}\cdots\mathrm{NH}_3`,
    String.raw`\text{-OH}\,\cdot\cdot\cdot\,\text{NH}_3`,
    "-OH \u22ef NH\u2083"
  ]) {
    assert.equal(parseGeminiTextLatex(latex)?.html, contact, latex);
  }
  assert.equal(parseGeminiTextLatex(String.raw`\mathrm{CaCl}_2\cdot\mathrm{NH}_3`)?.html,
    "<span>CaCl<sub>2</sub> \u00b7 NH<sub>3</sub></span>");
  assert.equal(parseGeminiTextLatex(String.raw`-\mathrm{OH}\cdots ABC`)?.html,
    "<span>\u2212OH \u22ef ABC</span>");
  for (const latex of [
    String.raw`a\cdot b`,
    String.raw`F_1\cdot F_2`,
    String.raw`A_1\cdots A_n`,
    String.raw`\mathrm{A}\cdot\mathrm{B}_2`,
    String.raw`-\mathrm{ABC}\cdots ABC`,
    String.raw`x=-\mathrm{OH}\cdots\mathrm{NH}_3`
  ]) {
    assert.equal(parseGeminiTextLatex(latex), null, latex);
  }
});

test("formats molecular formulas and charged labels as Word text", () => {
  assert.deepEqual(parseScientificLabelLatex(String.raw`\mathrm{C_2}`), {
    html: "<span>C<sub>2</sub></span>",
    plainText: "C2"
  });
  assert.deepEqual(parseScientificLabelLatex(String.raw`\mathrm{ABCD}^{+}`), {
    html: "<span>ABCD<sup>+</sup></span>",
    plainText: "ABCD+"
  });
  assert.deepEqual(parseScientificLabelLatex(String.raw`\mathrm{ABCD}`), {
    html: "<span>ABCD</span>",
    plainText: "ABCD"
  });
  assert.deepEqual(parseScientificLabelLatex(String.raw`\mathrm{C_2N^-}`), {
    html: "<span>C<sub>2</sub>N<sup>−</sup></span>",
    plainText: "C2N−"
  });
  assert.deepEqual(parseSimpleIonLatex(String.raw`\mathrm{ABCD}_{4}^{2-}`), {
    html: "<span>ABCD<sub>4</sub><sup>2−</sup></span>",
    plainText: "ABCD42−"
  });
  assert.deepEqual(parseSimpleIonLatex("AB^-"), {
    html: "<span>AB<sup>−</sup></span>",
    plainText: "AB−"
  });
  assert.deepEqual(parseSimpleIonLatex("AB₄²⁻"), {
    html: "<span>AB<sub>4</sub><sup>2−</sup></span>",
    plainText: "AB42−"
  });
});

test("formats standalone script fragments as Word text", () => {
  assert.deepEqual(parseStandaloneTextScripts("_2"), {
    html: "<span><sub>2</sub></span>",
    plainText: "2"
  });
  assert.deepEqual(parseStandaloneTextScripts("^+"), {
    html: "<span><sup>+</sup></span>",
    plainText: "+"
  });
  assert.deepEqual(parseStandaloneTextScripts("_3^-"), {
    html: "<span><sub>3</sub><sup>−</sup></span>",
    plainText: "3−"
  });
  assert.deepEqual(parseStandaloneTextScripts("^{-1}"), {
    html: "<span><sup>−1</sup></span>",
    plainText: "−1"
  });
  assert.equal(parseStandaloneTextScripts("x_2"), null);
  assert.equal(parseStandaloneTextScripts(String.raw`^\frac{1}{2}`), null);
});

test("formats narrowly scoped scalar notation as Word text", () => {
  assert.deepEqual(parseWordTextLatex(String.raw`\varepsilon=10^{-4}`), {
    html: "<span>ε = 10<sup>−4</sup></span>",
    plainText: "ε = 10⁻⁴"
  });
  assert.deepEqual(parseWordTextLatex(String.raw`\epsilon = 2.5^{+3}`), {
    html: "<span>ε = 2.5<sup>+3</sup></span>",
    plainText: "ε = 2.5⁺³"
  });
  assert.deepEqual(parseWordTextLatex(String.raw`\pm0.25`), {
    html: "<span>±0.25</span>",
    plainText: "±0.25"
  });
  assert.deepEqual(parseWordTextLatex(String.raw`\leq5.25`), {
    html: "<span>≤5.25</span>",
    plainText: "≤5.25"
  });
  assert.deepEqual(parseWordTextLatex(String.raw`\geq 0.75`), {
    html: "<span>≥0.75</span>",
    plainText: "≥0.75"
  });
  assert.equal(parseWordTextLatex(String.raw`N_s`), null);
  assert.equal(parseWordTextLatex(String.raw`x=10^{-4}`), null);
  assert.equal(parseWordTextLatex(String.raw`x\leq5.25`), null);
});

test("does not classify mathematical expressions as scientific labels", () => {
  assert.equal(parseScientificLabelLatex(String.raw`x_1^2`), null);
  assert.equal(parseScientificLabelLatex(String.raw`E=mc^2`), null);
  assert.equal(parseScientificLabelLatex(String.raw`\frac{1}{2}`), null);
  assert.equal(parseScientificLabelLatex(String.raw`A_1`), null);
  assert.equal(parseScientificLabelLatex(String.raw`C_2`), null);
  assert.equal(parseScientificLabelLatex(String.raw`\mathbf{ABC}`), null);
  assert.equal(parseScientificLabelLatex("ABC"), null);
});

test("maps generic Unicode superscripts and subscripts to Word script runs", () => {
  assert.deepEqual(splitUnicodeScripts("A⁺ / B₂ / C₃⁻"), [
    { mode: null, text: "A" },
    { mode: "sup", text: "+" },
    { mode: null, text: " / B" },
    { mode: "sub", text: "2" },
    { mode: null, text: " / C" },
    { mode: "sub", text: "3" },
    { mode: "sup", text: "−" }
  ]);
});
test("groups adjacent exponents and supports scientific subscript letters", () => {
  assert.deepEqual(splitUnicodeScripts("x⁻¹ y⁻² zₙ"), [
    { mode: null, text: "x" },
    { mode: "sup", text: "−1" },
    { mode: null, text: " y" },
    { mode: "sup", text: "−2" },
    { mode: null, text: " z" },
    { mode: "sub", text: "n" }
  ]);
});

test("does not classify ordinary characters as script content", () => {
  assert.deepEqual(getScriptToken("2"), { mode: null, text: "2" });
  assert.deepEqual(getScriptToken("+"), { mode: null, text: "+" });
  assert.deepEqual(getScriptToken("−"), { mode: null, text: "−" });
});
