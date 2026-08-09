(function initWordTextClipboard(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.WordTextClipboard = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createApi() {
  "use strict";

  const SCRIPT_CHARACTERS = new Map([
    ["⁰", ["sup", "0"]], ["¹", ["sup", "1"]], ["²", ["sup", "2"]],
    ["³", ["sup", "3"]], ["⁴", ["sup", "4"]], ["⁵", ["sup", "5"]],
    ["⁶", ["sup", "6"]], ["⁷", ["sup", "7"]], ["⁸", ["sup", "8"]],
    ["⁹", ["sup", "9"]], ["⁺", ["sup", "+"]], ["⁻", ["sup", "−"]],
    ["⁼", ["sup", "="]], ["⁽", ["sup", "("]], ["⁾", ["sup", ")"]],
    ["ⁱ", ["sup", "i"]], ["ⁿ", ["sup", "n"]],
    ["₀", ["sub", "0"]], ["₁", ["sub", "1"]], ["₂", ["sub", "2"]],
    ["₃", ["sub", "3"]], ["₄", ["sub", "4"]], ["₅", ["sub", "5"]],
    ["₆", ["sub", "6"]], ["₇", ["sub", "7"]], ["₈", ["sub", "8"]],
    ["₉", ["sub", "9"]], ["₊", ["sub", "+"]], ["₋", ["sub", "−"]],
    ["₌", ["sub", "="]], ["₍", ["sub", "("]], ["₎", ["sub", ")"]],
    ["ₐ", ["sub", "a"]], ["ₑ", ["sub", "e"]], ["ₕ", ["sub", "h"]],
    ["ᵢ", ["sub", "i"]], ["ⱼ", ["sub", "j"]], ["ₖ", ["sub", "k"]],
    ["ₗ", ["sub", "l"]], ["ₘ", ["sub", "m"]], ["ₙ", ["sub", "n"]],
    ["ₒ", ["sub", "o"]], ["ₚ", ["sub", "p"]], ["ᵣ", ["sub", "r"]],
    ["ₛ", ["sub", "s"]], ["ₜ", ["sub", "t"]], ["ₓ", ["sub", "x"]]
  ]);

  const ALLOWED_TAGS = new Set([
    "A", "B", "BLOCKQUOTE", "BR", "CODE", "DEL", "DIV", "EM", "H1", "H2",
    "H3", "H4", "H5", "H6", "HR", "I", "KBD", "LI", "MARK", "OL", "P",
    "PRE", "S", "SAMP", "SMALL", "SPAN", "STRIKE", "STRONG", "SUB", "SUP",
    "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "U", "UL"
  ]);
  const REMOVE_TAGS = new Set([
    "APPLET", "AUDIO", "BUTTON", "CANVAS", "EMBED", "FORM", "IFRAME", "IMG",
    "INPUT", "OBJECT", "SCRIPT", "SELECT", "STYLE", "TEXTAREA", "VIDEO"
  ]);
  const ALLOWED_STYLE_PROPERTIES = new Set([
    "background-color", "color", "font-style", "font-weight", "text-align",
    "text-decoration", "vertical-align", "white-space"
  ]);
  const SAFE_HREF = /^(?:https?:|mailto:|tel:|#|\/)/i;

  function getScriptToken(character) {
    const value = SCRIPT_CHARACTERS.get(character);
    return value ? { mode: value[0], text: value[1] } : { mode: null, text: character };
  }

  function splitUnicodeScripts(value) {
    const tokens = [];
    let current = null;

    for (const character of String(value || "")) {
      const token = getScriptToken(character);
      if (current && current.mode === token.mode) {
        current.text += token.text;
      } else {
        current = { mode: token.mode, text: token.text };
        tokens.push(current);
      }
    }

    return tokens;
  }

  function replaceTextNode(node, documentRef) {
    const parent = node.parentElement;
    const existingScript = parent?.closest("sup, sub");
    const existingMode = existingScript?.tagName === "SUP" ? "sup" :
      existingScript?.tagName === "SUB" ? "sub" : null;
    const tokens = splitUnicodeScripts(node.nodeValue || "");
    if (!tokens.some((token) => token.mode)) {
      return;
    }

    const fragment = documentRef.createDocumentFragment();
    for (const token of tokens) {
      if (!token.mode || (existingMode && token.mode !== existingMode)) {
        fragment.appendChild(documentRef.createTextNode(token.text));
        continue;
      }

      if (existingMode) {
        fragment.appendChild(documentRef.createTextNode(token.text));
        continue;
      }

      const script = documentRef.createElement(token.mode);
      script.textContent = token.text;
      fragment.appendChild(script);
    }

    node.replaceWith(fragment);
  }

  function convertUnicodeScripts(container, documentRef) {
    const nodeFilter = documentRef.defaultView?.NodeFilter || globalThis.NodeFilter;
    const walker = documentRef.createTreeWalker(
      container,
      nodeFilter ? nodeFilter.SHOW_TEXT : 4
    );
    const textNodes = [];
    let node = walker.nextNode();
    while (node) {
      textNodes.push(node);
      node = walker.nextNode();
    }

    textNodes.forEach((textNode) => replaceTextNode(textNode, documentRef));
    return container;
  }

  function sanitizeStyle(element) {
    const style = element.getAttribute("style");
    if (!style) {
      return;
    }

    const source = element.style;
    const safe = [];
    for (const property of ALLOWED_STYLE_PROPERTIES) {
      const value = source.getPropertyValue(property).trim();
      if (value && !/url\s*\(|expression\s*\(|javascript\s*:/i.test(value)) {
        safe.push(`${property}: ${value}`);
      }
    }

    if (safe.length > 0) {
      element.setAttribute("style", safe.join("; "));
    } else {
      element.removeAttribute("style");
    }
  }

  function sanitizeElement(element) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name === "style") {
        continue;
      }

      const keepHref = element.tagName === "A" && name === "href" && SAFE_HREF.test(attribute.value.trim());
      const keepTableSpan = (element.tagName === "TD" || element.tagName === "TH") &&
        (name === "colspan" || name === "rowspan") && /^\d+$/.test(attribute.value);
      const keepListStart = element.tagName === "OL" && name === "start" && /^\d+$/.test(attribute.value);
      if (!keepHref && !keepTableSpan && !keepListStart) {
        element.removeAttribute(attribute.name);
      }
    }
    sanitizeStyle(element);

    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 1) {
        const tag = child.tagName.toUpperCase();
        if (REMOVE_TAGS.has(tag)) {
          child.remove();
          continue;
        }

        sanitizeElement(child);
        if (!ALLOWED_TAGS.has(tag)) {
          while (child.firstChild) {
            element.insertBefore(child.firstChild, child);
          }
          child.remove();
        }
      } else if (child.nodeType === 8) {
        child.remove();
      }
    }

    return element;
  }

  function buildWordHtml(fragment, documentRef) {
    const container = documentRef.createElement("div");
    container.appendChild(fragment);
    sanitizeElement(container);
    convertUnicodeScripts(container, documentRef);

    return [
      "<!doctype html>",
      '<html><head><meta charset="utf-8"><style>',
      "sup { vertical-align: super; } sub { vertical-align: sub; }",
      "</style></head><body>",
      container.innerHTML,
      "</body></html>"
    ].join("");
  }

  function buildSelectionPayload(range, documentRef) {
    if (!range || !documentRef) {
      throw new TypeError("A DOM range and document are required");
    }

    const plainText = range.toString();
    if (!plainText.trim()) {
      throw new Error("Selection is empty");
    }

    return {
      html: buildWordHtml(range.cloneContents(), documentRef),
      plainText
    };
  }

  return {
    buildSelectionPayload,
    buildWordHtml,
    convertUnicodeScripts,
    getScriptToken,
    sanitizeElement,
    splitUnicodeScripts
  };
});
