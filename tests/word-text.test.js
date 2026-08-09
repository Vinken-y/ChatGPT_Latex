"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getScriptToken,
  parseSimpleIonLatex,
  splitUnicodeScripts
} = require("../src/word-text.js");

test("formats a charged chemical label as Word text", () => {
  assert.deepEqual(parseSimpleIonLatex(String.raw`\mathrm{SO}_{4}^{2-}`), {
    html: "<span>SO<sub>4</sub><sup>2−</sup></span>",
    plainText: "SO42−"
  });
  assert.deepEqual(parseSimpleIonLatex("Cl^-"), {
    html: "<span>Cl<sup>−</sup></span>",
    plainText: "Cl−"
  });
  assert.deepEqual(parseSimpleIonLatex("SO₄²⁻"), {
    html: "<span>SO<sub>4</sub><sup>2−</sup></span>",
    plainText: "SO42−"
  });
});

test("does not classify an ordinary equation as a chemical label", () => {
  assert.equal(parseSimpleIonLatex(String.raw`x_1^2`), null);
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
