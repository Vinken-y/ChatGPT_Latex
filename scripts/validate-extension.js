"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function fail(message) {
  throw new Error(message);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
  }
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`Missing referenced file: ${relativePath}`);
  }
}

const manifest = readJson("manifest.json");
const packageJson = readJson("package.json");

if (manifest.manifest_version !== 3) {
  fail("manifest.json must use Manifest V3");
}
if (manifest.version !== packageJson.version) {
  fail(`Version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
}
if (manifest.name !== "__MSG_extensionName__" || !manifest.default_locale) {
  fail("Manifest name must use chrome.i18n with a default locale");
}

const allowedPermissions = new Set(["clipboardWrite", "storage"]);
for (const permission of manifest.permissions || []) {
  if (!allowedPermissions.has(permission)) {
    fail(`Unexpected permission: ${permission}`);
  }
}

requireFile(manifest.action.default_popup);
requireFile(manifest.background.service_worker);

for (const contentScript of manifest.content_scripts || []) {
  for (const match of contentScript.matches || []) {
    if (!match.startsWith("https://") || match.includes("<all_urls>")) {
      fail(`Content-script match is too broad: ${match}`);
    }
  }
  for (const referencedFile of [...(contentScript.js || []), ...(contentScript.css || [])]) {
    requireFile(referencedFile);
  }
}

for (const iconPath of Object.values(manifest.icons || {})) {
  requireFile(iconPath);
}

for (const assetGroup of manifest.web_accessible_resources || []) {
  for (const asset of assetGroup.resources) {
    requireFile(asset);
  }
}
for (const iconPath of Object.values(manifest.action?.default_icon || {})) {
  requireFile(iconPath);
}

const localesRoot = path.join(root, "_locales");
const locales = fs.readdirSync(localesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (!locales.includes(manifest.default_locale)) {
  fail(`Default locale directory is missing: ${manifest.default_locale}`);
}

let referenceKeys = null;
for (const locale of locales) {
  const messages = readJson(path.join("_locales", locale, "messages.json"));
  const keys = Object.keys(messages).sort();
  for (const key of keys) {
    if (!messages[key] || typeof messages[key].message !== "string" || !messages[key].message.trim()) {
      fail(`Invalid message: ${locale}.${key}`);
    }
  }
  if (referenceKeys && JSON.stringify(keys) !== JSON.stringify(referenceKeys)) {
    fail(`Locale keys differ in ${locale}`);
  }
  referenceKeys = referenceKeys || keys;
}

const bundledKatex = require(path.join(root, "src", "vendor", "katex.min.js"));
const declaredKatex = packageJson.dependencies?.katex;
if (!declaredKatex || declaredKatex !== bundledKatex.version) {
  fail(`Bundled KaTeX ${bundledKatex.version} must equal exact package dependency ${declaredKatex || "missing"}`);
}

console.log(`Validated ChatGPT for SCI ${manifest.version}: ${locales.length} locales, KaTeX ${bundledKatex.version}.`);
