(function exposeFontSettings(root) {
  "use strict";

  const CHINESE_RANGE = "U+2E80-2FFF, U+3000-303F, U+3100-312F, U+31A0-33FF, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FE10-FE1F, U+FE30-FE4F, U+FF00-FFEF, U+20000-323AF";
  const legacyKeys = ["chatgptReplyFont", "chatgptPromptFont", "chatgptInterfaceFont"];
  const appearanceKeys = ["chatgptEnglishFont", "chatgptChineseFont", "chatgptBoldColorEnabled", "chatgptBoldColor"];
  const siteMessage = "sci-appearance-site";
  const english = {
    default: [],
    "times-new-roman": ["Times New Roman", "SCI Tinos"],
    arial: ["Arial", "SCI Arimo"],
    calibri: ["Calibri", "SCI Source Sans"],
    cambria: ["Cambria", "SCI Source Serif"],
    georgia: ["Georgia", "SCI Source Serif"],
    "source-sans": ["SCI Source Sans"],
    "source-serif": ["SCI Source Serif"]
  };
  const chinese = {
    default: [],
    "noto-sans": ["Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC"],
    "noto-serif": ["Noto Serif SC", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun"],
    simsun: ["SimSun", "Songti SC", "Noto Serif SC", "Noto Serif CJK SC"],
    yahei: ["Microsoft YaHei", "Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", "Noto Sans CJK SC"],
    kaiti: ["KaiTi", "STKaiti", "Kaiti SC", "Noto Serif SC", "SimSun"]
  };
  const bundled = {
    "SCI Source Sans": [
      ["SourceSans3-Regular.woff2", "200 900", "normal"],
      ["SourceSans3-Italic.woff2", "200 900", "italic"]
    ],
    "SCI Source Serif": [
      ["SourceSerif4-Regular.woff2", "200 900", "normal"],
      ["SourceSerif4-Italic.woff2", "200 900", "italic"]
    ],
    "SCI Arimo": [
      ["arimo-latin-wght-normal.woff2", "400 700", "normal"],
      ["arimo-latin-wght-italic.woff2", "400 700", "italic"]
    ],
    "SCI Tinos": [
      ["tinos-latin-400-normal.woff2", "400", "normal"],
      ["tinos-latin-400-italic.woff2", "400", "italic"],
      ["tinos-latin-700-normal.woff2", "700", "normal"],
      ["tinos-latin-700-italic.woff2", "700", "italic"]
    ]
  };
  const registered = new Set();

  function resolve(settings = {}) {
    const old = legacyKeys.map((key) => settings[key]).find((value) => value === "serif" || value === "sans");
    const savedEnglish = settings.chatgptEnglishFont;
    const latin = savedEnglish === "claude-serif" || savedEnglish === "claude-sans"
      ? savedEnglish.replace("claude-", "source-")
      : savedEnglish ?? (old ? "source-" + old : "default");
    const cjk = settings.chatgptChineseFont ?? (old ? "noto-" + old : "default");
    return {
      chatgptEnglishFont: Object.hasOwn(english, latin) ? latin : "default",
      chatgptChineseFont: Object.hasOwn(chinese, cjk) ? cjk : "default"
    };
  }

  function siteForHost(host) {
    if (host === "gemini.google.com") return "gemini";
    if (host === "chatgpt.com" || host === "chat.openai.com") return "chatgpt";
    return null;
  }

  function storageKey(site, key) {
    return site === "gemini" && appearanceKeys.includes(key)
      ? key.replace(/^chatgpt/, "gemini")
      : key;
  }

  function keysForSite(site) {
    const keys = appearanceKeys.map((key) => storageKey(site, key));
    return site === "chatgpt" ? [...keys, ...legacyKeys] : keys;
  }

  function appearanceForSite(site, stored = {}) {
    const settings = Object.fromEntries(appearanceKeys.map((key) => [key, stored[storageKey(site, key)]]));
    return { ...settings, ...resolve(site === "chatgpt" ? stored : settings) };
  }

  function addFont(name, faces) {
    if (registered.has(name)) {
      return;
    }
    for (const [source, descriptors] of faces) {
      document.fonts.add(new FontFace(name, source, descriptors));
    }
    registered.add(name);
  }

  function fontStack(settings) {
    const { chatgptEnglishFont, chatgptChineseFont } = resolve(settings);
    const families = [];
    if (chatgptChineseFont !== "default") {
      const alias = "SCI Chinese " + chatgptChineseFont;
      const localSources = chinese[chatgptChineseFont].map((name) => "local(" + JSON.stringify(name) + ")").join(", ");
      addFont(alias, [[localSources, { unicodeRange: CHINESE_RANGE }]]);
      families.push(alias);
    }
    for (const family of english[chatgptEnglishFont]) {
      if (Object.hasOwn(bundled, family)) {
        addFont(family, bundled[family].map(([file, weight, style]) => [
          "url(" + JSON.stringify(chrome.runtime.getURL("fonts/" + file)) + ") format('woff2')",
          { weight, style, display: "swap" }
        ]));
      }
      families.push(family);
    }
    return families.map((name) => JSON.stringify(name)).join(", ");
  }

  root.SciFontSettings = { appearanceKeys, siteMessage, siteForHost, keysForSite, storageKey, appearanceForSite, fontStack };
})(globalThis);
