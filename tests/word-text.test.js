"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getScriptToken,
  parseScientificLabelLatex,
  parseSimpleIonLatex,
  parseStandaloneTextScripts,
  splitUnicodeScripts
} = require("../src/word-text.js");

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
