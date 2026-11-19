(function initializeChatGptFonts() {
  "use strict";

  const fonts = globalThis.SciFontSettings;
  const keys = [...fonts.keys, "chatgptBoldColorEnabled", "chatgptBoldColor"];
  const settings = {};

  function applyAppearance() {
    const root = document.documentElement;
    const fontStack = fonts.fontStack(settings);
    if (fontStack) {
      root.style.setProperty("--wlc-page-font", fontStack);
    } else {
      root.style.removeProperty("--wlc-page-font");
    }
    root.toggleAttribute("data-wlc-page-font", Boolean(fontStack));
    const boldColor = settings.chatgptBoldColor ?? "#a54b31";
    const useBoldColor = settings.chatgptBoldColorEnabled === true &&
      typeof boldColor === "string" && /^#[0-9a-f]{6}$/i.test(boldColor);
    if (useBoldColor) {
      root.style.setProperty("--wlc-bold-text-color", boldColor);
    } else {
      root.style.removeProperty("--wlc-bold-text-color");
    }
    root.toggleAttribute("data-wlc-bold-color", useBoldColor);
  }

  function initialize() {
    const pendingKeys = new Set(keys);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") {
        return;
      }
      const changedKeys = keys.filter((key) => Object.prototype.hasOwnProperty.call(changes, key));
      if (!changedKeys.length) {
        return;
      }
      for (const key of changedKeys) {
        pendingKeys.delete(key);
        settings[key] = changes[key].newValue;
      }
      applyAppearance();
    });
    chrome.storage.local.get(keys, (stored) => {
      for (const key of pendingKeys) {
        settings[key] = stored?.[key];
      }
      pendingKeys.clear();
      applyAppearance();
    });
  }

  if (document.documentElement) {
    initialize();
  } else {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  }
})();
