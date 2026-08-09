"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getScriptToken,
  splitUnicodeScripts
} = require("../src/word-text.js");

test("maps scientific Unicode superscripts and subscripts to Word script runs", () => {
  assert.deepEqual(splitUnicodeScripts("CTPP⁺ / H₂O / I₃⁻"), [
    { mode: null, text: "CTPP" },
    { mode: "sup", text: "+" },
    { mode: null, text: " / H" },
    { mode: "sub", text: "2" },
    { mode: null, text: "O / I" },
    { mode: "sub", text: "3" },
    { mode: "sup", text: "−" }
  ]);
});
test("groups adjacent exponents and supports scientific subscript letters", () => {
  assert.deepEqual(splitUnicodeScripts("g⁻¹ cm⁻² xₙ"), [
    { mode: null, text: "g" },
    { mode: "sup", text: "−1" },
    { mode: null, text: " cm" },
    { mode: "sup", text: "−2" },
    { mode: null, text: " x" },
    { mode: "sub", text: "n" }
  ]);
});

test("does not classify ordinary characters as script content", () => {
  assert.deepEqual(getScriptToken("2"), { mode: null, text: "2" });
  assert.deepEqual(getScriptToken("+"), { mode: null, text: "+" });
  assert.deepEqual(getScriptToken("−"), { mode: null, text: "−" });
});
