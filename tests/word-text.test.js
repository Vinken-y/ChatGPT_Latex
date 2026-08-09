"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getScriptToken,
  splitUnicodeScripts
} = require("../src/word-text.js");

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
