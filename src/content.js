(function initializeChatGptLatex() {
  "use strict";

  const normalizer = globalThis.WordLatexNormalizer;
  const wordMathml = globalThis.WordMathml;
  const wordText = globalThis.WordTextClipboard;
  const ROOT_ID = "chatgpt-latex-root";
  const QUICK_ACTIONS_ID = "chatgpt-latex-quick-actions";
  const SELECTION_ACTIONS_ID = "chatgpt-latex-selection-actions";
  const TOAST_ID = "chatgpt-latex-toast";
  const FORMULA_SELECTOR = [
    ".katex-display",
    ".katex",
    ".math-block[data-math]",
    ".math-inline[data-math]",
    "[data-math-source]",
    "[data-latex]",
    "[data-tex]",
    "[data-formula]",
    "[data-equation]",
    "[data-testid='math-renderer']",
    "[data-testid='math-inline']",
    "[data-testid='math-block']",
    "[role='math']",
    "script[type^='math/tex']",
    "mjx-container",
    "math"
  ].join(",");
  const DEFAULT_SETTINGS = {
    closeAfterCopy: true,
    formulaRecognition: true,
    textRecognition: true,
    removeBoldFormatting: true,
    matchWordFormatting: true,
    showLatexCopy: false
  };
  const SCAN_IDLE_TIMEOUT_MS = 350;
  const SCAN_SLICE_BUDGET_MS = 8;
  const QUICK_ACTIONS_HIDE_DELAY_MS = 140;
  const COMPATIBILITY_DEBOUNCE_MS = 120;
  const SELECTION_SETTLE_DELAY_MS = 48;
  const FORMULA_SLOT_PREFIX = "\uE000WLC_FORMULA_";
  const FORMULA_SLOT_SUFFIX = "_WLC\uE001";
  const PLAIN_TEXT_BLOCK_TAGS = new Set([
    "ADDRESS", "BLOCKQUOTE", "DIV", "H1", "H2", "H3", "H4", "H5", "H6",
    "LI", "OL", "P", "PRE", "TABLE", "TBODY", "TFOOT", "THEAD", "TR", "UL"
  ]);

  let currentDialog = null;
  let activeFormula = null;
  let quickActions = null;
  let quickActionsHideTimer = null;
  let quickActionsPositionFrame = null;
  let selectionActions = null;
  let selectionRange = null;
  let selectionUpdateTimer = null;
  let selectionPositionFrame = null;
  let pointerSelecting = false;
  let scanScheduled = false;
  let currentSettings = { ...DEFAULT_SETTINGS };
  const pendingScanRoots = new Set();
  const formulaClassifications = new WeakMap();

  function translate(key, fallback, substitutions) {
    try {
      return chrome.i18n?.getMessage(key, substitutions) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function canonicalFormula(formula) {
    if (!(formula instanceof Element) || formula.closest(`#${ROOT_ID}`)) {
      return null;
    }

    const sourceContainer = formula.closest(
      "[data-math], [data-math-source], [data-latex], [data-tex], [data-formula], " +
      "[data-equation], [role='math']"
    );
    if (sourceContainer) {
      return sourceContainer;
    }

    const display = formula.closest(".katex-display");
    if (display) {
      return display;
    }

    const container = formula.closest(
      ".katex, .math-block[data-math], .math-inline[data-math], [data-math-source], " +
      "[data-latex], [data-tex], [data-formula], [data-equation], " +
      "[data-testid='math-renderer'], [data-testid='math-inline'], [data-testid='math-block'], " +
      "[role='math'], mjx-container"
    );
    if (container) {
      return container;
    }

    if (formula.matches("math, annotation[encoding], script[type^='math/tex']")) {
      return formula.parentElement || formula;
    }

    return formula;
  }

  function findFormula(target) {
    if (
      !(target instanceof Element) ||
      target.closest(`#${ROOT_ID}, #${QUICK_ACTIONS_ID}, #${SELECTION_ACTIONS_ID}, #${TOAST_ID}`)
    ) {
      return null;
    }

    const display = target.closest(".katex-display");
    if (display) {
      return display;
    }

    return target.closest(FORMULA_SELECTOR);
  }

  function findFormulaFromEvent(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
    for (const target of path) {
      const formula = markRecognizedFormula(findFormula(target));
      if (formula) {
        return formula;
      }
    }

    return null;
  }

  function findTexAnnotation(formula) {
    const selectors = [
      'annotation[encoding="application/x-tex"]',
      'annotation[encoding="application/x-latex"]',
      'script[type^="math/tex"]'
    ].join(",");

    const ownAnnotation = formula.querySelector(selectors);
    if (ownAnnotation) {
      return ownAnnotation;
    }

    const siblingCandidates = [formula.previousElementSibling, formula.nextElementSibling];
    return siblingCandidates.find((sibling) => sibling?.matches?.(selectors)) || null;
  }

  function extractLatex(formula) {
    const sourceAttributes = [
      "data-math",
      "data-math-source",
      "data-latex",
      "data-tex",
      "data-formula",
      "data-equation"
    ];
    const sourceSelector = sourceAttributes.map((attribute) => `[${attribute}]`).join(",");
    const sourceNodes = [
      formula,
      formula.closest(sourceSelector),
      formula.querySelector(sourceSelector)
    ];
    for (const node of sourceNodes) {
      if (!node) {
        continue;
      }
      for (const attribute of sourceAttributes) {
        const value = node.getAttribute(attribute);
        if (value?.trim()) {
          return value;
        }
      }
    }

    const annotation = findTexAnnotation(formula);
    if (annotation?.textContent) {
      return annotation.textContent;
    }

    const math = formula.matches("math") ? formula : formula.querySelector("math");
    const altText = math?.getAttribute("alttext") || math?.getAttribute("aria-label");
    if (altText) {
      return altText;
    }

    const rendererLabel = formula.getAttribute("aria-label");
    if (rendererLabel && !/^math(?:ematical)?(?: formula| expression)?$/i.test(rendererLabel.trim())) {
      return rendererLabel;
    }

    return "";
  }

  function classifyFormula(formula) {
    const latex = normalizer.normalizeLatexSource(extractLatex(formula));
    const cached = formulaClassifications.get(formula);
    if (cached?.latex === latex) {
      return cached;
    }

    const classification = {
      label: latex ? wordText.parseScientificLabelLatex(latex) : null,
      latex
    };
    formulaClassifications.set(formula, classification);
    return classification;
  }

  function markRecognizedFormula(candidate) {
    const formula = canonicalFormula(candidate);
    if (!formula) {
      return null;
    }

    const classification = classifyFormula(formula);
    if (!classification.latex) {
      formula.removeAttribute("data-wlc-recognized");
      formula.removeAttribute("data-wlc-text-label");
      return null;
    }

    if (classification.label) {
      formula.removeAttribute("data-wlc-recognized");
      formula.removeAttribute("data-wlc-active");
      formula.setAttribute("data-wlc-text-label", "");
      if (activeFormula === formula) {
        hideQuickActions();
      }
      return null;
    }

    formula.removeAttribute("data-wlc-text-label");
    if (!formula.hasAttribute("data-wlc-recognized")) {
      const display =
        formula.classList.contains("katex-display") ||
        formula.classList.contains("math-block") ||
        formula.getAttribute("data-testid") === "math-block" ||
        formula.getAttribute("data-display") === "block" ||
        formula.style.display === "block" ||
        formula.matches('math[display="block"]');
      formula.setAttribute("data-wlc-recognized", display ? "display" : "inline");
    }

    return formula;
  }

  function scanFormulas(root) {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }

    const formulas = new Set();
    const addFormula = (candidate) => {
      const formula = canonicalFormula(candidate);
      if (formula) {
        formulas.add(formula);
      }
    };

    if (root instanceof Element && root.matches(FORMULA_SELECTOR)) {
      addFormula(root);
    }

    root.querySelectorAll(FORMULA_SELECTOR).forEach(addFormula);
    formulas.forEach(markRecognizedFormula);
  }

  function requestScanFlush() {
    if (scanScheduled) {
      return;
    }

    scanScheduled = true;
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(flushPendingScans, { timeout: SCAN_IDLE_TIMEOUT_MS });
    } else {
      window.setTimeout(() => flushPendingScans(null), 48);
    }
  }

  function flushPendingScans(deadline) {
    scanScheduled = false;
    const startedAt = performance.now();

    while (pendingScanRoots.size > 0) {
      const root = pendingScanRoots.values().next().value;
      pendingScanRoots.delete(root);

      if (root instanceof Document || root.isConnected) {
        scanFormulas(root);
      }

      const elapsed = performance.now() - startedAt;
      const idleBudgetExhausted = deadline && !deadline.didTimeout && deadline.timeRemaining() < 1;
      if (elapsed >= SCAN_SLICE_BUDGET_MS || idleBudgetExhausted) {
        break;
      }
    }

    if (pendingScanRoots.size > 0) {
      requestScanFlush();
    }
  }

  function scheduleScan(root) {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }

    if (
      root instanceof Element &&
      root.closest(`#${ROOT_ID}, #${QUICK_ACTIONS_ID}, #${SELECTION_ACTIONS_ID}, #${TOAST_ID}`)
    ) {
      return;
    }

    pendingScanRoots.add(root);
    requestScanFlush();
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(DEFAULT_SETTINGS, (value) => {
        if (chrome.runtime.lastError) {
          resolve(DEFAULT_SETTINGS);
          return;
        }

        resolve({ ...DEFAULT_SETTINGS, ...value });
      });
    });
  }

  function syncLatexCopyVisibility() {
    const quickLatex = quickActions?.querySelector('[data-copy-mode="latex"]');
    if (quickLatex) {
      quickLatex.hidden = !currentSettings.showLatexCopy;
    }

    const dialogLatex = currentDialog?.querySelector('[data-copy-mode="latex"]');
    if (dialogLatex) {
      dialogLatex.hidden = !currentSettings.showLatexCopy;
    }
    scheduleQuickActionsPosition();
  }

  function applySettings(settings) {
    currentSettings = { ...DEFAULT_SETTINGS, ...settings };
    document.documentElement.toggleAttribute(
      "data-wlc-formula-recognition-disabled",
      !currentSettings.formulaRecognition
    );
    syncLatexCopyVisibility();

    if (!currentSettings.formulaRecognition) {
      hideQuickActions();
      closeDialog();
    } else {
      scheduleScan(document);
    }

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      scheduleSelectionActionsUpdate(0);
    } else {
      hideSelectionActions();
    }
  }

  function copyText(value) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(value);
    }

    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();

    return copied ? Promise.resolve() : Promise.reject(new Error("Clipboard write failed"));
  }

  function renderFormulaMathml(latex) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "chatgpt-latex:render-mathml", latex },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response?.ok || !response.mathml) {
            reject(new Error(response?.error || "MathML conversion failed"));
            return;
          }
          resolve(response.mathml);
        }
      );
    });
  }

  async function writeWordClipboard(html, plainText) {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      throw new Error("Rich clipboard writing is unavailable");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" })
      })
    ]);
  }

  function buildInlineWordHtml(markup) {
    const fragment = document.createRange().createContextualFragment(markup);
    return wordText.buildWordHtml(fragment, document, {
      removeBoldFormatting: currentSettings.removeBoldFormatting,
      matchWordFormatting: currentSettings.matchWordFormatting
    });
  }

  async function copyFormulaToWord(latex, plainTextFallback) {
    const label = wordText.parseScientificLabelLatex(latex);
    if (label) {
      await writeWordClipboard(buildInlineWordHtml(label.html), label.plainText);
      return;
    }

    const mathml = await renderFormulaMathml(latex);
    const html = wordMathml.buildWordHtml(mathml);
    await writeWordClipboard(html, plainTextFallback);
  }

  async function copyLatexValue(input, forWord) {
    const sourceLatex = normalizer.normalizeLatexSource(input);
    if (!sourceLatex) {
      throw new Error("No LaTeX source found");
    }

    if (forWord) {
      const wordResult = normalizer.convertLatexForWord(sourceLatex);
      await copyFormulaToWord(sourceLatex, wordResult.latex);
      return { message: translate("copiedWord", "Copied to Word"), value: wordResult.latex };
    }

    await copyText(sourceLatex);
    return { message: translate("copiedLatex", "LaTeX copied"), value: sourceLatex };
  }

  function createButton(label, className, type) {
    const button = document.createElement("button");
    button.type = type || "button";
    button.className = className;
    button.textContent = label;
    return button;
  }

  function showPageToast(message, error) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      toast.className = "wlc-page-toast";
      toast.setAttribute("role", "status");
      document.documentElement.appendChild(toast);
    }

    window.clearTimeout(toast._hideTimer);
    toast.textContent = message;
    toast.classList.toggle("is-error", Boolean(error));
    toast.classList.add("is-visible");
    toast._hideTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1500);
  }

  function elementFromNode(node) {
    if (node instanceof Element) {
      return node;
    }

    return node?.parentElement || null;
  }

  function orderedTopLevelFormulas(formulas) {
    const candidates = Array.from(new Set(formulas));
    const roots = candidates.filter((formula) =>
      !candidates.some((other) => other !== formula && other.contains(formula))
    );

    return roots.sort((first, second) => {
      if (first === second) {
        return 0;
      }

      const position = first.compareDocumentPosition(second);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  function formulaRootsInContainer(container) {
    const formulas = [];
    const addFormula = (candidate) => {
      const formula = canonicalFormula(candidate);
      if (formula && classifyFormula(formula).latex) {
        formulas.push(formula);
      }
    };

    if (container instanceof Element && container.matches(FORMULA_SELECTOR)) {
      addFormula(container);
    }

    container?.querySelectorAll?.(FORMULA_SELECTOR)?.forEach(addFormula);
    return orderedTopLevelFormulas(formulas);
  }

  function formulaRootsInRange(range) {
    const formulas = [];
    const addIfIntersecting = (candidate) => {
      const formula = canonicalFormula(candidate);
      if (!formula || !classifyFormula(formula).latex) {
        return;
      }

      try {
        if (range.intersectsNode(formula)) {
          formulas.push(formula);
        }
      } catch (error) {
        // Streaming responses can detach a formula during selection handling.
      }
    };

    const start = elementFromNode(range.startContainer);
    const end = elementFromNode(range.endContainer);
    addIfIntersecting(start?.closest(FORMULA_SELECTOR));
    addIfIntersecting(end?.closest(FORMULA_SELECTOR));

    const common = elementFromNode(range.commonAncestorContainer);
    if (!common) {
      return [];
    }
    if (common.matches(FORMULA_SELECTOR)) {
      addIfIntersecting(common);
    }

    common.querySelectorAll(FORMULA_SELECTOR).forEach(addIfIntersecting);
    return orderedTopLevelFormulas(formulas);
  }

  function rangeContainsNonFormulaText(range) {
    const common = elementFromNode(range.commonAncestorContainer);
    if (!common) {
      return false;
    }

    const walker = document.createTreeWalker(common, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      const formula = canonicalFormula(parent?.closest(FORMULA_SELECTOR));
      const insideEquation = formula && !classifyFormula(formula).label;
      if (!insideEquation) {
        try {
          if (range.intersectsNode(node)) {
            let start = 0;
            let end = node.nodeValue?.length || 0;
            if (node === range.startContainer) {
              start = range.startOffset;
            }
            if (node === range.endContainer) {
              end = range.endOffset;
            }
            if (end > start && node.nodeValue.slice(start, end).trim()) {
              return true;
            }
          }
        } catch (error) {
          // Ignore text nodes detached by a streaming response.
        }
      }

      node = walker.nextNode();
    }

    return false;
  }

  function expandTextLabelBoundaries(range) {
    const expanded = range.cloneRange();
    const startLabel = elementFromNode(range.startContainer)?.closest("[data-wlc-text-label]");
    const endLabel = elementFromNode(range.endContainer)?.closest("[data-wlc-text-label]");
    if (startLabel) {
      expanded.setStartBefore(startLabel);
    }
    if (endLabel) {
      expanded.setEndAfter(endLabel);
    }
    return expanded;
  }

  function fragmentToPlainText(fragment) {
    const chunks = [];
    const visit = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        chunks.push(node.nodeValue || "");
        return;
      }

      if (!(node instanceof Element || node instanceof DocumentFragment)) {
        return;
      }

      const tag = node instanceof Element ? node.tagName : "";
      if (tag === "BR") {
        chunks.push("\n");
        return;
      }

      node.childNodes.forEach(visit);
      if (tag === "TD" || tag === "TH") {
        chunks.push("\t");
      } else if (PLAIN_TEXT_BLOCK_TAGS.has(tag)) {
        chunks.push("\n");
      }
    };

    visit(fragment);
    return chunks.join("")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function formulaSlot(index) {
    return `${FORMULA_SLOT_PREFIX}${index}${FORMULA_SLOT_SUFFIX}`;
  }

  function replaceFormulaSlots(html, replacements) {
    let result = html;
    replacements.forEach((replacement, index) => {
      result = result.split(formulaSlot(index)).join(replacement);
    });
    return result;
  }

  async function buildMixedSelectionPayload(range, formulas) {
    const htmlFragment = range.cloneContents();
    const plainFragment = range.cloneContents();
    const htmlFormulas = formulaRootsInContainer(htmlFragment);
    const plainFormulas = formulaRootsInContainer(plainFragment);

    if (htmlFormulas.length !== formulas.length || plainFormulas.length !== formulas.length) {
      throw new Error("Formula selection boundaries could not be preserved");
    }

    const formulaValues = formulas.map((formula) => {
      const classification = classifyFormula(formula);
      const latex = classification.latex;
      if (!latex) {
        throw new Error("No LaTeX source found");
      }

      return {
        latex,
        label: classification.label,
        wordLatex: classification.label
          ? classification.label.plainText
          : normalizer.convertLatexForWord(latex).latex
      };
    });

    htmlFormulas.forEach((formula, index) => {
      formula.replaceWith(document.createTextNode(formulaSlot(index)));
    });
    plainFormulas.forEach((formula, index) => {
      formula.replaceWith(document.createTextNode(formulaValues[index].wordLatex));
    });

    const formulaHtmlValues = await Promise.all(
      formulaValues.map((formula) => formula.label
        ? formula.label.html
        : renderFormulaMathml(formula.latex))
    );

    return {
      html: replaceFormulaSlots(wordText.buildWordHtml(htmlFragment, document, {
        removeBoldFormatting: currentSettings.removeBoldFormatting,
        matchWordFormatting: currentSettings.matchWordFormatting
      }), formulaHtmlValues),
      plainText: fragmentToPlainText(plainFragment)
    };
  }

  async function copySelectionToWord(range) {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      throw new Error("Rich clipboard writing is unavailable");
    }

    const copyRange = expandTextLabelBoundaries(range);
    const formulas = formulaRootsInRange(copyRange);
    const payload = formulas.length > 0
      ? await buildMixedSelectionPayload(copyRange, formulas)
      : wordText.buildSelectionPayload(copyRange, document, {
        removeBoldFormatting: currentSettings.removeBoldFormatting,
        matchWordFormatting: currentSettings.matchWordFormatting
      });
    await writeWordClipboard(payload.html, payload.plainText);
  }

  function rangeIsEligibleForSelectionCopy(range) {
    const start = elementFromNode(range.startContainer);
    const end = elementFromNode(range.endContainer);
    if (!start || !end || !range.toString().trim()) {
      return false;
    }

    const blockedSelector = [
      "input",
      "textarea",
      "select",
      "[contenteditable]:not([contenteditable='false'])",
      `[id='${ROOT_ID}']`,
      `[id='${QUICK_ACTIONS_ID}']`,
      `[id='${SELECTION_ACTIONS_ID}']`,
      `[id='${TOAST_ID}']`
    ].join(",");
    if (start.closest(blockedSelector) || end.closest(blockedSelector)) {
      return false;
    }

    const formulas = formulaRootsInRange(range);
    if (!rangeContainsNonFormulaText(range)) {
      return false;
    }

    const containsEquation = formulas.some((formula) => !classifyFormula(formula).label);
    return containsEquation
      ? currentSettings.formulaRecognition && currentSettings.textRecognition
      : currentSettings.textRecognition;
  }

  function hideSelectionActions() {
    window.clearTimeout(selectionUpdateTimer);
    selectionUpdateTimer = null;
    if (selectionPositionFrame !== null) {
      window.cancelAnimationFrame(selectionPositionFrame);
      selectionPositionFrame = null;
    }

    selectionRange = null;
    selectionActions?.classList.remove("is-visible");
  }

  function visibleSelectionRects(range) {
    return Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  }

  function expandedRect(rect, amount) {
    return {
      left: rect.left - amount,
      right: rect.right + amount,
      top: rect.top - amount,
      bottom: rect.bottom + amount,
      width: rect.width + amount * 2,
      height: rect.height + amount * 2
    };
  }

  function rectsOverlap(first, second) {
    return first.left < second.right && first.right > second.left &&
      first.top < second.bottom && first.bottom > second.top;
  }

  function nearbyNativeFloatingRects(selectionBounds) {
    const selectors = [
      '[role="menu"]',
      '[role="toolbar"]',
      "[data-radix-popper-content-wrapper]",
      "[data-floating-ui-portal]"
    ].join(",");
    const nearby = expandedRect(selectionBounds, 180);
    const results = [];

    for (const element of document.querySelectorAll(selectors)) {
      if (element.closest(`#${ROOT_ID}, #${QUICK_ACTIONS_ID}, #${SELECTION_ACTIONS_ID}, #${TOAST_ID}`)) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      if (
        rect.width <= 0 || rect.height <= 0 || rect.width > 600 || rect.height > 240 ||
        !rectsOverlap(rect, nearby)
      ) {
        continue;
      }

      const style = window.getComputedStyle(element);
      if (style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity || 1) > 0) {
        results.push(rect);
      }
    }

    return results;
  }

  function candidateRect(left, top, width, height) {
    return { left, top, right: left + width, bottom: top + height, width, height };
  }

  function positionSelectionActions() {
    selectionPositionFrame = null;
    if (!selectionActions || !selectionRange) {
      hideSelectionActions();
      return;
    }

    const rects = visibleSelectionRects(selectionRange);
    if (rects.length === 0) {
      hideSelectionActions();
      return;
    }

    const first = rects[0];
    const last = rects[rects.length - 1];
    const bounds = selectionRange.getBoundingClientRect();
    const width = selectionActions.offsetWidth;
    const height = selectionActions.offsetHeight;
    const gap = 8;
    const padding = 8;
    const avoid = [
      ...rects.map((rect) => expandedRect(rect, 3)),
      ...nearbyNativeFloatingRects(bounds).map((rect) => expandedRect(rect, 4))
    ];
    const candidates = [
      candidateRect(last.left, last.bottom + gap, width, height),
      candidateRect(last.right - width, last.bottom + gap, width, height),
      candidateRect(last.right + gap, last.top + (last.height - height) / 2, width, height),
      candidateRect(last.left - width - gap, last.top + (last.height - height) / 2, width, height),
      candidateRect(first.left, first.top - height - gap, width, height)
    ];
    const fits = (candidate) =>
      candidate.left >= padding && candidate.top >= padding &&
      candidate.right <= window.innerWidth - padding &&
      candidate.bottom <= window.innerHeight - padding &&
      !avoid.some((rect) => rectsOverlap(candidate, rect));
    let selected = candidates.find(fits);

    if (!selected) {
      const left = Math.min(
        Math.max(padding, last.left),
        Math.max(padding, window.innerWidth - width - padding)
      );
      const top = Math.min(
        Math.max(padding, last.bottom + gap),
        Math.max(padding, window.innerHeight - height - padding)
      );
      selected = candidateRect(left, top, width, height);
    }

    selectionActions.style.left = `${Math.round(selected.left)}px`;
    selectionActions.style.top = `${Math.round(selected.top)}px`;
  }

  function scheduleSelectionActionsPosition() {
    if (!selectionRange || selectionPositionFrame !== null) {
      return;
    }

    selectionPositionFrame = window.requestAnimationFrame(positionSelectionActions);
  }

  function ensureSelectionActions() {
    if (selectionActions?.isConnected) {
      return selectionActions;
    }

    const actions = document.createElement("div");
    actions.id = SELECTION_ACTIONS_ID;
    actions.className = "wlc-selection-actions";
    actions.setAttribute("role", "group");
    actions.setAttribute("aria-label", translate("textQuickActions", "Text copy actions"));

    const copyWord = createButton(
      translate("copyWord", "Copy to Word"),
      "wlc-selection-button"
    );
    actions.appendChild(copyWord);
    actions.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    actions.addEventListener("click", async (event) => {
      if (!copyWord.contains(event.target) || !selectionRange) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const range = selectionRange.cloneRange();
      try {
        await copySelectionToWord(range);
        showPageToast(translate("copiedWord", "Copied to Word"), false);
        hideSelectionActions();
      } catch (error) {
        showPageToast(translate("copyWordFailed", "Word conversion or copy failed"), true);
      }
    });

    document.documentElement.appendChild(actions);
    selectionActions = actions;
    return actions;
  }

  function updateSelectionActions() {
    selectionUpdateTimer = null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      hideSelectionActions();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!rangeIsEligibleForSelectionCopy(range)) {
      hideSelectionActions();
      return;
    }

    selectionRange = range.cloneRange();
    hideQuickActions();
    const actions = ensureSelectionActions();
    positionSelectionActions();
    actions.classList.add("is-visible");
    window.setTimeout(scheduleSelectionActionsPosition, 80);
  }

  function scheduleSelectionActionsUpdate(delay) {
    window.clearTimeout(selectionUpdateTimer);
    selectionUpdateTimer = window.setTimeout(
      updateSelectionActions,
      typeof delay === "number" ? delay : SELECTION_SETTLE_DELAY_MS
    );
  }

  function selectionActionsVisible() {
    return Boolean(selectionActions?.classList.contains("is-visible"));
  }

  function cancelQuickActionsHide() {
    window.clearTimeout(quickActionsHideTimer);
    quickActionsHideTimer = null;
  }

  function hideQuickActions() {
    cancelQuickActionsHide();
    if (quickActionsPositionFrame !== null) {
      window.cancelAnimationFrame(quickActionsPositionFrame);
      quickActionsPositionFrame = null;
    }

    activeFormula?.removeAttribute("data-wlc-active");
    activeFormula = null;
    quickActions?.classList.remove("is-visible");
  }

  function scheduleQuickActionsHide() {
    cancelQuickActionsHide();
    quickActionsHideTimer = window.setTimeout(hideQuickActions, QUICK_ACTIONS_HIDE_DELAY_MS);
  }

  function positionQuickActions() {
    quickActionsPositionFrame = null;
    if (!activeFormula?.isConnected || !quickActions) {
      hideQuickActions();
      return;
    }

    const formulaRect = activeFormula.getBoundingClientRect();
    const outsideViewport =
      formulaRect.bottom < 0 ||
      formulaRect.top > window.innerHeight ||
      formulaRect.right < 0 ||
      formulaRect.left > window.innerWidth;
    if ((formulaRect.width <= 0 && formulaRect.height <= 0) || outsideViewport) {
      hideQuickActions();
      return;
    }

    const toolbarWidth = quickActions.offsetWidth;
    const toolbarHeight = quickActions.offsetHeight;
    const viewportPadding = 8;
    const isDisplay = activeFormula.getAttribute("data-wlc-recognized") === "display";
    let left = isDisplay
      ? formulaRect.right - toolbarWidth
      : formulaRect.left + (formulaRect.width - toolbarWidth) / 2;
    let top = isDisplay
      ? formulaRect.top - toolbarHeight / 2
      : formulaRect.bottom + viewportPadding;

    if (!isDisplay && top + toolbarHeight > window.innerHeight - viewportPadding) {
      top = formulaRect.top - toolbarHeight - viewportPadding;
    }

    left = Math.min(
      Math.max(viewportPadding, left),
      Math.max(viewportPadding, window.innerWidth - toolbarWidth - viewportPadding)
    );
    top = Math.min(
      Math.max(viewportPadding, top),
      Math.max(viewportPadding, window.innerHeight - toolbarHeight - viewportPadding)
    );

    quickActions.style.left = `${Math.round(left)}px`;
    quickActions.style.top = `${Math.round(top)}px`;
  }

  function scheduleQuickActionsPosition() {
    if (!activeFormula || quickActionsPositionFrame !== null) {
      return;
    }

    quickActionsPositionFrame = window.requestAnimationFrame(positionQuickActions);
  }

  function ensureQuickActions() {
    if (quickActions?.isConnected) {
      return quickActions;
    }

    const actions = document.createElement("div");
    actions.id = QUICK_ACTIONS_ID;
    actions.className = "wlc-quick-actions";
    actions.setAttribute("role", "group");
    actions.setAttribute("aria-label", translate("quickActions", "Formula quick actions"));

    const copyLatex = createButton(translate("copyLatex", "Copy LaTeX"), "wlc-quick-button");
    copyLatex.dataset.copyMode = "latex";
    copyLatex.hidden = !currentSettings.showLatexCopy;
    const copyWord = createButton(translate("copyWord", "Copy to Word"), "wlc-quick-button");
    copyWord.dataset.copyMode = "word";
    actions.append(copyLatex, copyWord);

    actions.addEventListener("pointerenter", cancelQuickActionsHide);
    actions.addEventListener("pointerleave", scheduleQuickActionsHide);
    actions.addEventListener("focusin", cancelQuickActionsHide);
    actions.addEventListener("focusout", (event) => {
      if (!actions.contains(event.relatedTarget)) {
        scheduleQuickActionsHide();
      }
    });
    actions.addEventListener("click", async (event) => {
      const button = event.target instanceof Element
        ? event.target.closest("button[data-copy-mode]")
        : null;
      if (!button || !activeFormula) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const forWord = button.dataset.copyMode === "word";
      try {
        const result = await copyLatexValue(extractLatex(activeFormula), forWord);
        showPageToast(result.message, false);
      } catch (error) {
        showPageToast(
          forWord
            ? translate("copyWordFailed", "Word conversion or copy failed")
            : translate("copyLatexFailed", "LaTeX copy failed"),
          true
        );
      }
    });

    document.documentElement.appendChild(actions);
    quickActions = actions;
    return actions;
  }

  function showQuickActions(candidate) {
    if (!currentSettings.formulaRecognition) {
      return;
    }

    const selection = window.getSelection();
    if (selectionActionsVisible() || (selection && !selection.isCollapsed && selection.toString().trim())) {
      return;
    }

    const formula = markRecognizedFormula(candidate);
    if (!formula) {
      return;
    }

    cancelQuickActionsHide();
    if (activeFormula !== formula) {
      activeFormula?.removeAttribute("data-wlc-active");
      activeFormula = formula;
      activeFormula.setAttribute("data-wlc-active", "");
    }

    const actions = ensureQuickActions();
    actions.dataset.layout = formula.getAttribute("data-wlc-recognized") || "inline";
    positionQuickActions();
    actions.classList.add("is-visible");
  }

  function createPreview(formula) {
    const preview = document.createElement("div");
    preview.className = "wlc-preview";
    preview.setAttribute("aria-label", translate("formulaPreview", "Formula preview"));

    const math = formula.matches("math") ? formula : formula.querySelector("math");
    const visual = formula.querySelector(".katex-html");
    const source = math || visual;

    if (source) {
      const clone = source.cloneNode(true);
      clone.removeAttribute?.("aria-hidden");
      preview.appendChild(clone);
    } else {
      preview.textContent = "LaTeX";
      preview.classList.add("wlc-preview-empty");
    }

    return preview;
  }

  function closeDialog() {
    if (!currentDialog) {
      return;
    }

    currentDialog._wlcCleanup?.();
    currentDialog.remove();
    currentDialog = null;
  }

  function setStatus(status, text, error) {
    status.textContent = text;
    status.classList.toggle("is-error", Boolean(error));
    status.classList.add("is-visible");
  }

  async function openDialog(formula) {
    if (!currentSettings.formulaRecognition) {
      return;
    }

    hideSelectionActions();
    hideQuickActions();
    closeDialog();

    const rawLatex = extractLatex(formula);
    if (!rawLatex.trim()) {
      return;
    }

    const previouslyFocused = document.activeElement;
    const initialLatex = normalizer.normalizeLatexSource(rawLatex);

    const root = document.createElement("div");
    root.id = ROOT_ID;

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "wlc-backdrop";
    backdrop.tabIndex = -1;
    backdrop.setAttribute("aria-label", translate("closeEditor", "Close formula editor"));

    const dialog = document.createElement("section");
    dialog.className = "wlc-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "wlc-title");

    const header = document.createElement("header");
    header.className = "wlc-header";

    const heading = document.createElement("div");
    const title = document.createElement("h2");
    title.id = "wlc-title";
    title.textContent = "ChatGPT_Latex";
    const subtitle = document.createElement("p");
    subtitle.textContent = translate("editorSubtitle", "Normalized LaTeX with Word-ready copy");
    heading.append(title, subtitle);

    const close = createButton(translate("close", "Close"), "wlc-close");
    header.append(heading, close);

    const body = document.createElement("div");
    body.className = "wlc-body";
    body.appendChild(createPreview(formula));

    const field = document.createElement("div");
    field.className = "wlc-field";
    const label = document.createElement("label");
    label.htmlFor = "wlc-source";
    label.textContent = translate("latexSource", "LaTeX source");
    const textarea = document.createElement("textarea");
    textarea.id = "wlc-source";
    textarea.value = initialLatex;
    textarea.spellcheck = false;
    textarea.autocomplete = "off";
    textarea.rows = 5;

    const fieldMeta = document.createElement("div");
    fieldMeta.className = "wlc-field-meta";
    const status = document.createElement("span");
    status.className = "wlc-status";
    status.setAttribute("role", "status");
    const count = document.createElement("span");
    count.textContent = translate("characterCount", `${textarea.value.length} characters`, String(textarea.value.length));
    fieldMeta.append(status, count);
    const compatibility = document.createElement("p");
    compatibility.className = "wlc-compatibility";
    let compatibilityTimer = null;

    const updateCompatibility = () => {
      compatibilityTimer = null;
      const result = normalizer.convertLatexForWord(textarea.value);
      if (result.compatible) {
        compatibility.textContent = result.changes.length > 0
          ? translate("wordCompatibleConverted", "Word compatibility passed; unsupported environments will be converted")
          : translate("wordCompatible", "Word compatibility check passed");
        compatibility.classList.remove("has-warning");
      } else {
        compatibility.textContent = `${translate("wordCompatibilityWarning", "Word compatibility warning")}: ${result.issues.map((issue) => issue.detail).join("; ")}`;
        compatibility.classList.add("has-warning");
      }
    };
    const scheduleCompatibilityUpdate = () => {
      window.clearTimeout(compatibilityTimer);
      compatibilityTimer = window.setTimeout(updateCompatibility, COMPATIBILITY_DEBOUNCE_MS);
    };

    updateCompatibility();
    field.append(label, textarea, fieldMeta, compatibility);
    body.appendChild(field);

    const footer = document.createElement("footer");
    footer.className = "wlc-footer";
    const copySource = createButton(translate("copyLatex", "Copy LaTeX"), "wlc-button wlc-button-secondary");
    copySource.dataset.copyMode = "latex";
    copySource.hidden = !currentSettings.showLatexCopy;
    const copyWord = createButton(translate("copyWord", "Copy to Word"), "wlc-button wlc-button-secondary");
    footer.append(copySource, copyWord);

    dialog.append(header, body, footer);
    root.append(backdrop, dialog);
    document.documentElement.appendChild(root);
    root._wlcCleanup = () => {
      window.clearTimeout(compatibilityTimer);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    currentDialog = root;

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    textarea.addEventListener("input", () => {
      count.textContent = translate("characterCount", `${textarea.value.length} characters`, String(textarea.value.length));
      status.classList.remove("is-visible");
      scheduleCompatibilityUpdate();
    });

    const handleCopy = async (forWord) => {
      if (!normalizer.normalizeLatexSource(textarea.value)) {
        setStatus(status, translate("noFormula", "No formula to copy"), true);
        return;
      }

      try {
        const result = await copyLatexValue(textarea.value, forWord);
        setStatus(status, result.message, false);
        if (currentSettings.closeAfterCopy) {
          window.setTimeout(closeDialog, 280);
        }
      } catch (error) {
        setStatus(
          status,
          forWord
            ? translate("copyWordFailed", "Word conversion or copy failed")
            : translate("clipboardFailed", "Clipboard write failed"),
          true
        );
      }
    };

    copySource.addEventListener("click", () => handleCopy(false));
    copyWord.addEventListener("click", () => handleCopy(true));
    close.addEventListener("click", closeDialog);
    backdrop.addEventListener("click", closeDialog);

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(
          root.querySelectorAll('button:not([tabindex="-1"]):not([hidden]), textarea, [tabindex]:not([tabindex="-1"]):not([hidden])')
        ).filter((element) => !element.disabled && element.getAttribute("aria-hidden") !== "true");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
  }

  document.addEventListener("pointerover", (event) => {
    if (quickActions?.contains(event.target)) {
      cancelQuickActionsHide();
      return;
    }

    const formula = findFormulaFromEvent(event);
    if (formula) {
      showQuickActions(formula);
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    if (selectionActions?.contains(event.target)) {
      return;
    }

    pointerSelecting = true;
    hideSelectionActions();
  }, true);

  document.addEventListener("pointerup", () => {
    pointerSelecting = false;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      scheduleSelectionActionsUpdate();
    }
  }, true);

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideSelectionActions();
      return;
    }

    if (!pointerSelecting) {
      scheduleSelectionActionsUpdate(80);
    }
  });

  document.addEventListener("keyup", (event) => {
    if (
      event.shiftKey || event.key.startsWith("Arrow") || event.key === "Home" ||
      event.key === "End" || (event.key.toLowerCase() === "a" && (event.ctrlKey || event.metaKey))
    ) {
      scheduleSelectionActionsUpdate();
    }
  }, true);

  document.addEventListener("pointerout", (event) => {
    if (!activeFormula) {
      return;
    }

    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Node &&
      (activeFormula.contains(relatedTarget) || quickActions?.contains(relatedTarget))
    ) {
      return;
    }

    const formula = canonicalFormula(findFormulaFromEvent(event));
    if (formula === activeFormula) {
      scheduleQuickActionsHide();
    }
  }, true);

  document.addEventListener("focusin", (event) => {
    if (quickActions?.contains(event.target)) {
      cancelQuickActionsHide();
      return;
    }

    const formula = findFormulaFromEvent(event);
    if (formula) {
      showQuickActions(formula);
    }
  }, true);

  document.addEventListener("focusout", (event) => {
    if (!activeFormula) {
      return;
    }

    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Node &&
      (activeFormula.contains(relatedTarget) || quickActions?.contains(relatedTarget))
    ) {
      return;
    }

    scheduleQuickActionsHide();
  }, true);

  document.addEventListener("dblclick", (event) => {
    const formula = markRecognizedFormula(findFormulaFromEvent(event));
    if (!formula) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    hideSelectionActions();
    openDialog(formula);
  }, true);

  window.addEventListener("scroll", scheduleQuickActionsPosition, { capture: true, passive: true });
  window.addEventListener("scroll", hideSelectionActions, { capture: true, passive: true });
  window.addEventListener("resize", scheduleQuickActionsPosition, { passive: true });
  window.addEventListener("resize", hideSelectionActions, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hideQuickActions();
      hideSelectionActions();
    }
  });

  getSettings().then(applySettings);

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    const nextSettings = { ...currentSettings };
    let changed = false;
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        nextSettings[key] = changes[key].newValue;
        changed = true;
      }
    }
    if (changed) {
      applySettings(nextSettings);
    }
  });

  const formulaObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target instanceof Element) {
        scheduleScan(mutation.target);
        continue;
      }

      const containsPageElement = Array.from(mutation.addedNodes).some((node) =>
        node instanceof Element &&
        !node.closest(`#${ROOT_ID}, #${QUICK_ACTIONS_ID}, #${SELECTION_ACTIONS_ID}, #${TOAST_ID}`)
      );
      if (containsPageElement) {
        scheduleScan(mutation.target instanceof Element ? mutation.target : document);
      }
    }

    if (activeFormula && !activeFormula.isConnected) {
      hideQuickActions();
    }

    if (
      selectionRange &&
      (!selectionRange.startContainer.isConnected || !selectionRange.endContainer.isConnected)
    ) {
      hideSelectionActions();
    }
  });

  formulaObserver.observe(document.documentElement, {
    attributeFilter: [
      "data-equation",
      "data-formula",
      "data-latex",
      "data-math",
      "data-math-source",
      "data-tex"
    ],
    attributes: true,
    childList: true,
    subtree: true
  });
})();
