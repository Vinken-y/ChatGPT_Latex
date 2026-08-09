(function initializePopup() {
  "use strict";

  const DEFAULTS = {
    closeAfterCopy: true,
    formulaRecognition: true,
    textRecognition: true,
    removeBoldFormatting: true,
    matchWordFormatting: true,
    showLatexCopy: false
  };
  const settingInputs = Array.from(document.querySelectorAll("input[data-setting]"));
  const status = document.getElementById("status");
  let statusTimer = null;

  function translate(key, fallback) {
    return chrome.i18n?.getMessage(key) || fallback;
  }

  function localizePopup() {
    document.documentElement.lang = chrome.i18n?.getUILanguage?.() || "en";
    document.title = translate("extensionName", "ChatGPT_Latex");
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n, element.textContent);
    });
  }

  function showSaved() {
    window.clearTimeout(statusTimer);
    status.classList.add("is-visible");
    statusTimer = window.setTimeout(() => status.classList.remove("is-visible"), 1200);
  }

  function save(event) {
    const input = event.currentTarget;
    chrome.storage.local.set(
      {
        [input.dataset.setting]: input.checked
      },
      showSaved
    );
  }

  localizePopup();

  chrome.storage.local.get(DEFAULTS, (settings) => {
    settingInputs.forEach((input) => {
      input.checked = Boolean(settings[input.dataset.setting]);
    });
  });

  settingInputs.forEach((input) => input.addEventListener("change", save));
})();
