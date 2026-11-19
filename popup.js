(function initializePopup() {
  "use strict";

  const DEFAULTS = {
    closeAfterCopy: true,
    formulaRecognition: true,
    textRecognition: true,
    removeBoldFormatting: true,
    matchWordFormatting: true,
    showLatexCopy: false,
    chatgptEnglishFont: "default",
    chatgptChineseFont: "default",
    chatgptBoldColorEnabled: false,
    chatgptBoldColor: "#a54b31"
  };
  const fonts = globalThis.SciFontSettings;
  const settingInputs = Array.from(document.querySelectorAll("[data-setting]"));
  const controls = Object.fromEntries(settingInputs.map((input) => [input.dataset.setting, input]));
  const preview = document.getElementById("font-preview");
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const colorPanel = document.getElementById("color-panel");
  const colorTrigger = document.getElementById("color-trigger");
  const colorForm = document.getElementById("color-form");
  const colorHex = document.getElementById("color-hex");
  const colorError = document.getElementById("color-error");
  const swatches = Array.from(colorPanel.querySelectorAll("[data-color]"));
  const status = document.getElementById("status");
  let statusTimer = null;

  function translate(key, fallback) {
    return chrome.i18n?.getMessage(key) || fallback;
  }

  function localizePopup() {
    document.documentElement.lang = chrome.i18n?.getUILanguage?.() || "en";
    document.title = translate("extensionName", "ChatGPT for SCI");
    const version = chrome.runtime.getManifest().version;
    document.getElementById("version").textContent = `v${version}`;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n, element.textContent);
    });
  }

  function reportSave() {
    const failed = Boolean(chrome.runtime.lastError);
    window.clearTimeout(statusTimer);
    status.toggleAttribute("data-error", failed);
    status.textContent = failed
      ? translate("settingsSaveFailed", "Settings could not be saved")
      : translate("settingsSaved", "Settings saved");
    if (failed) {
      loadSettings();
    } else {
      statusTimer = window.setTimeout(() => { status.textContent = ""; }, 1600);
    }
  }

  function updatePreview() {
    const stack = fonts.fontStack({
      chatgptEnglishFont: controls.chatgptEnglishFont.value,
      chatgptChineseFont: controls.chatgptChineseFont.value
    });
    if (stack) {
      preview.style.setProperty("--preview-fonts", stack + ", system-ui, sans-serif");
    } else {
      preview.style.removeProperty("--preview-fonts");
    }
    preview.toggleAttribute("data-bold-color", controls.chatgptBoldColorEnabled.checked);
    const color = controls.chatgptBoldColor.value;
    preview.style.setProperty("--preview-bold-color", color);
    colorTrigger.style.setProperty("--current-swatch", color);
    colorHex.value = color.toUpperCase();
    for (const swatch of swatches) {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.color === color));
    }
  }

  function save(event) {
    const input = event.currentTarget;
    updatePreview();
    chrome.storage.local.set(
      {
        [input.dataset.setting]: input.type === "checkbox" ? input.checked : input.value
      },
      reportSave
    );
  }

  function selectTab(target) {
    if (target.id !== "fonts-tab" && colorPanel.matches(":popover-open")) {
      colorPanel.hidePopover();
    }
    for (const tab of tabs) {
      const selected = tab === target;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
    }
  }

  function showColorError(visible) {
    colorError.hidden = !visible;
    colorHex.setAttribute("aria-invalid", String(visible));
  }

  function chooseColor(color) {
    controls.chatgptBoldColor.value = color;
    controls.chatgptBoldColor.dispatchEvent(new Event("change"));
    colorPanel.hidePopover();
    colorTrigger.focus();
  }

  localizePopup();

  function showSettings(settings) {
    settingInputs.forEach((input) => {
      const key = input.dataset.setting;
      if (!Object.prototype.hasOwnProperty.call(settings, key)) {
        return;
      }
      if (input.type === "checkbox") {
        input.checked = Boolean(settings[key]);
      } else if (input.type === "color") {
        input.value = /^#[0-9a-f]{6}$/i.test(settings[key]) ? settings[key] : DEFAULTS[key];
      } else {
        input.value = Array.from(input.options).some((option) => option.value === settings[key])
          ? settings[key]
          : DEFAULTS[key];
      }
    });
    updatePreview();
  }

  function loadSettings() {
    chrome.storage.local.get([...Object.keys(DEFAULTS), ...fonts.keys], (stored) => {
      showSettings({ ...DEFAULTS, ...stored, ...fonts.resolve(stored) });
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex;
      switch (event.key) {
        case "ArrowLeft": nextIndex = (index + tabs.length - 1) % tabs.length; break;
        case "ArrowRight": nextIndex = (index + 1) % tabs.length; break;
        case "Home": nextIndex = 0; break;
        case "End": nextIndex = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectTab(tabs[nextIndex]);
      tabs[nextIndex].focus();
    });
  });

  loadSettings();
  settingInputs.forEach((input) => input.addEventListener("change", save));
  controls.chatgptBoldColor.addEventListener("input", updatePreview);
  for (const swatch of swatches) {
    swatch.style.setProperty("--swatch", swatch.dataset.color);
    swatch.addEventListener("click", () => chooseColor(swatch.dataset.color));
  }
  colorPanel.addEventListener("beforetoggle", (event) => {
    if (event.newState === "open") {
      colorHex.value = controls.chatgptBoldColor.value.toUpperCase();
      showColorError(false);
    }
  });
  colorHex.addEventListener("input", () => showColorError(false));
  colorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = colorHex.value.trim().replace(/^#/, "");
    if (!/^[0-9a-f]{6}$/i.test(value)) {
      showColorError(true);
      colorHex.focus();
      return;
    }
    chooseColor("#" + value.toLowerCase());
  });
})();
