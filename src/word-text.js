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
  const CHEMICAL_ELEMENTS = new Set([
    "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg",
    "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr",
    "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr",
    "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd",
    "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
    "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf",
    "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po",
    "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm",
    "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs",
    "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"
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
  const WORD_NORMAL_BLOCK_TAGS = new Set(["BLOCKQUOTE", "DIV", "LI", "P"]);

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

  function findClosingBrace(value, openingIndex) {
    let depth = 0;
    for (let index = openingIndex; index < value.length; index += 1) {
      if (value[index] === "{") {
        depth += 1;
      } else if (value[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          return index;
        }
      }
    }
    return -1;
  }

  function unwrapIonFormatting(value) {
    let result = value;
    const commandPattern = /\\(?:mathrm|text|operatorname|mathsf|mathbf)\s*\{/g;
    let match = commandPattern.exec(result);

    while (match) {
      const openingIndex = result.indexOf("{", match.index);
      const closingIndex = findClosingBrace(result, openingIndex);
      if (closingIndex < 0) {
        return result;
      }

      result = result.slice(0, match.index) +
        result.slice(openingIndex + 1, closingIndex) +
        result.slice(closingIndex + 1);
      commandPattern.lastIndex = 0;
      match = commandPattern.exec(result);
    }

    return result.replace(/\\rm\b/g, "");
  }

  function unicodeScriptsToLatex(value) {
    return splitUnicodeScripts(value).map((token) => {
      if (!token.mode) {
        return token.text;
      }

      const marker = token.mode === "sub" ? "_" : "^";
      return `${marker}{${token.text.replace(/−/g, "-")}}`;
    }).join("");
  }

  function splitTerminalCharge(value) {
    const match = value.match(/\^(?:\{([^{}]+)\}|([+\-−]))$/);
    if (!match) {
      return { body: value, charge: "" };
    }

    const source = match[1] ?? match[2];
    const magnitudeFirst = source.match(/^(\d*)([+\-−])$/);
    const signFirst = source.match(/^([+\-−])(\d*)$/);
    if (!magnitudeFirst && !signFirst) {
      return null;
    }

    const magnitude = magnitudeFirst ? magnitudeFirst[1] : signFirst[2];
    const sign = (magnitudeFirst ? magnitudeFirst[2] : signFirst[1]).replace("-", "−");
    return {
      body: value.slice(0, match.index),
      charge: `${magnitude}${sign}`
    };
  }

  function readLabelSubscript(value, position) {
    if (value[position] === "_") {
      position += 1;
      if (value[position] === "{") {
        const closingIndex = findClosingBrace(value, position);
        if (closingIndex < 0) {
          return null;
        }
        const subscript = value.slice(position + 1, closingIndex);
        return /^\d+$/.test(subscript)
          ? { position: closingIndex + 1, subscript }
          : null;
      }

      const match = value.slice(position).match(/^(\d+)/);
      return match
        ? { position: position + match[1].length, subscript: match[1] }
        : null;
    }

    const match = value.slice(position).match(/^(\d+)/);
    return match
      ? { position: position + match[1].length, subscript: match[1] }
      : { position, subscript: "" };
  }

  function parseLabelRuns(body, tokenPattern, isValidToken) {
    const runs = [];
    let position = 0;

    while (position < body.length) {
      const tokenMatch = body.slice(position).match(tokenPattern);
      if (!tokenMatch || !isValidToken(tokenMatch[1])) {
        return null;
      }

      const text = tokenMatch[1];
      position += text.length;
      const script = readLabelSubscript(body, position);
      if (!script) {
        return null;
      }
      position = script.position;
      runs.push({ text, subscript: script.subscript });
    }

    return runs.length > 0 ? runs : null;
  }

  function buildScientificLabel(runs, charge) {
    const bodyHtml = runs.map((run) =>
      run.text + (run.subscript ? `<sub>${run.subscript}</sub>` : "")
    ).join("");
    const bodyText = runs.map((run) => run.text + run.subscript).join("");
    const chargeHtml = charge ? `<sup>${charge}</sup>` : "";

    return {
      html: `<span>${bodyHtml}${chargeHtml}</span>`,
      plainText: `${bodyText}${charge}`
    };
  }

  function readStandaloneScript(value, position) {
    if (value[position] === "{") {
      const closingIndex = findClosingBrace(value, position);
      if (closingIndex < 0) {
        return null;
      }
      const text = value.slice(position + 1, closingIndex);
      return /^[A-Za-z0-9+\-−=()]+$/.test(text)
        ? { position: closingIndex + 1, text }
        : null;
    }

    const text = value[position];
    return text && /^[A-Za-z0-9+\-−=()]$/.test(text)
      ? { position: position + 1, text }
      : null;
  }

  function parseStandaloneTextScripts(value) {
    if (!value || !/^[\^_]/.test(value)) {
      return null;
    }

    const runs = [];
    let position = 0;
    while (position < value.length) {
      const marker = value[position];
      if (marker !== "^" && marker !== "_") {
        return null;
      }
      const script = readStandaloneScript(value, position + 1);
      if (!script) {
        return null;
      }
      runs.push({
        mode: marker === "^" ? "sup" : "sub",
        text: script.text.replace(/-/g, "−")
      });
      position = script.position;
    }

    return {
      html: `<span>${runs.map((run) => `<${run.mode}>${run.text}</${run.mode}>`).join("")}</span>`,
      plainText: runs.map((run) => run.text).join("")
    };
  }

  function parseScientificLabelLatex(input) {
    const source = String(input || "");
    const usesTextFormatting = /\\(?:mathrm|text)\s*\{|\\rm\b/.test(source);
    let value = unicodeScriptsToLatex(source)
      .replace(/\\(?:!|,|:|;|quad|qquad)/g, "")
      .replace(/\s+/g, "");
    value = unwrapIonFormatting(value);

    while (value.startsWith("{") && findClosingBrace(value, 0) === value.length - 1) {
      value = value.slice(1, -1);
    }

    const standaloneScripts = parseStandaloneTextScripts(value);
    if (standaloneScripts) {
      return standaloneScripts;
    }

    const terminal = splitTerminalCharge(value);
    if (!terminal || !terminal.body) {
      return null;
    }

    const chemicalRuns = parseLabelRuns(
      terminal.body,
      /^([A-Z][a-z]?)/,
      (token) => CHEMICAL_ELEMENTS.has(token)
    );
    if (
      chemicalRuns &&
      (
        terminal.charge ||
        chemicalRuns.length > 1 ||
        (usesTextFormatting && chemicalRuns.some((run) => run.subscript))
      )
    ) {
      return buildScientificLabel(chemicalRuns, terminal.charge);
    }

    const acronymRuns = parseLabelRuns(terminal.body, /^([A-Z])/, () => true);
    const acronymLength = acronymRuns?.reduce((total, run) => total + run.text.length, 0) || 0;
    if (acronymRuns && acronymLength >= 2 && (terminal.charge || usesTextFormatting)) {
      return buildScientificLabel(acronymRuns, terminal.charge);
    }

    return null;
  }

  function parseSimpleIonLatex(input) {
    return parseScientificLabelLatex(input);
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

  function replaceElementTag(element, tagName, documentRef) {
    const replacement = documentRef.createElement(tagName);
    for (const attribute of Array.from(element.attributes)) {
      replacement.setAttribute(attribute.name, attribute.value);
    }
    while (element.firstChild) {
      replacement.appendChild(element.firstChild);
    }
    element.replaceWith(replacement);
    return replacement;
  }

  function removeSourceBold(container) {
    container.querySelectorAll("b, strong").forEach((emphasis) => {
      while (emphasis.firstChild) {
        emphasis.parentNode.insertBefore(emphasis.firstChild, emphasis);
      }
      emphasis.remove();
    });
    container.querySelectorAll("[style]").forEach((element) => {
      element.style.removeProperty("font-weight");
      if (!element.getAttribute("style")?.trim()) {
        element.removeAttribute("style");
      }
    });
    return container;
  }

  function normalizeForWordDestination(container, documentRef, options) {
    const settings = { preserveBold: true, ...(options || {}) };
    container.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      replaceElementTag(heading, "p", documentRef);
    });
    container.querySelectorAll("th").forEach((headerCell) => {
      replaceElementTag(headerCell, "td", documentRef);
    });
    container.querySelectorAll("*").forEach((element) => {
      const fontWeight = settings.preserveBold
        ? element.style.getPropertyValue("font-weight")
        : "";
      const fontWeightPriority = settings.preserveBold
        ? element.style.getPropertyPriority("font-weight")
        : "";
      element.removeAttribute("style");
      if (fontWeight) {
        element.style.setProperty("font-weight", fontWeight, fontWeightPriority);
      }
      if (WORD_NORMAL_BLOCK_TAGS.has(element.tagName)) {
        element.setAttribute("class", "MsoNormal");
      }
    });
    return container;
  }

  function buildWordHtml(fragment, documentRef, options) {
    const settings = {
      matchWordFormatting: false,
      removeBoldFormatting: false,
      ...(options || {})
    };
    const container = documentRef.createElement("div");
    container.appendChild(fragment);
    sanitizeElement(container);
    convertUnicodeScripts(container, documentRef);
    if (settings.removeBoldFormatting) {
      removeSourceBold(container);
    }
    if (settings.matchWordFormatting) {
      normalizeForWordDestination(container, documentRef, {
        preserveBold: !settings.removeBoldFormatting
      });
    }

    const normalStyle = settings.matchWordFormatting
      ? '.MsoNormal { mso-style-name: "Normal"; }'
      : "";
    const bodyOpen = settings.matchWordFormatting
      ? '<body class="MsoNormal">'
      : "<body>";

    return [
      "<!doctype html>",
      '<html><head><meta charset="utf-8"><style>',
      "sup { vertical-align: super; } sub { vertical-align: sub; }",
      normalStyle,
      "</style></head>",
      bodyOpen,
      container.innerHTML,
      "</body></html>"
    ].join("");
  }

  function buildSelectionPayload(range, documentRef, options) {
    if (!range || !documentRef) {
      throw new TypeError("A DOM range and document are required");
    }

    const plainText = range.toString();
    if (!plainText.trim()) {
      throw new Error("Selection is empty");
    }

    return {
      html: buildWordHtml(range.cloneContents(), documentRef, options),
      plainText
    };
  }

  return {
    buildSelectionPayload,
    buildWordHtml,
    convertUnicodeScripts,
    getScriptToken,
    normalizeForWordDestination,
    parseScientificLabelLatex,
    parseSimpleIonLatex,
    parseStandaloneTextScripts,
    removeSourceBold,
    sanitizeElement,
    splitUnicodeScripts
  };
});
