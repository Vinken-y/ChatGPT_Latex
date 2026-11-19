"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
require("../src/font-settings.js");
const fonts = globalThis.SciFontSettings;

test("detects only supported sites, including the old ChatGPT host", () => {
  assert.equal(fonts.siteForHost("chatgpt.com"), "chatgpt");
  assert.equal(fonts.siteForHost("chat.openai.com"), "chatgpt");
  assert.equal(fonts.siteForHost("gemini.google.com"), "gemini");
  assert.equal(fonts.siteForHost("gemini.google.com.example.org"), null);
});

test("keeps old ChatGPT preferences and never uses them as Gemini defaults", () => {
  const stored = { chatgptReplyFont: "serif", chatgptBoldColorEnabled: true, chatgptBoldColor: "#112233" };
  assert.deepEqual(fonts.appearanceForSite("chatgpt", stored), {
    chatgptChineseFont: "noto-serif", chatgptEnglishFont: "source-serif",
    chatgptBoldColorEnabled: true, chatgptBoldColor: "#112233"
  });
  assert.deepEqual(fonts.appearanceForSite("gemini", stored), {
    chatgptChineseFont: "default", chatgptEnglishFont: "default",
    chatgptBoldColorEnabled: undefined, chatgptBoldColor: undefined
  });
});

test("saves disjoint appearance keys without changing shared copy keys", () => {
  const stored = {
    geminiEnglishFont: "arial", geminiChineseFont: "yahei",
    geminiBoldColorEnabled: true, geminiBoldColor: "#334455",
    chatgptEnglishFont: "times-new-roman", chatgptBoldColorEnabled: false
  };
  assert.deepEqual(fonts.appearanceForSite("gemini", stored), {
    chatgptChineseFont: "yahei", chatgptEnglishFont: "arial",
    chatgptBoldColorEnabled: true, chatgptBoldColor: "#334455"
  });
  assert.equal(fonts.appearanceForSite("chatgpt", stored).chatgptEnglishFont, "times-new-roman");
  assert.equal(fonts.appearanceForSite("chatgpt", stored).chatgptBoldColorEnabled, false);
  assert.equal(fonts.storageKey("gemini", "formulaRecognition"), "formulaRecognition");
  assert.equal(fonts.storageKey("gemini", "chatgptBoldColor"), "geminiBoldColor");
  assert.ok(fonts.keysForSite("gemini").every((key) => !fonts.keysForSite("chatgpt").includes(key)));
});
