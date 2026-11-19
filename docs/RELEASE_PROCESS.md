# ChatFacet release process / 发布流程

1. Confirm `manifest.json`, `package.json`, `package-lock.json`, changelog, tag, release title, and archive name use the same version.
2. Run `npm ci`, `npm run validate`, `npm run check`, and `npm test`.
3. Load the unpacked extension in Chrome and Edge. Check appearance settings separately on ChatGPT and Gemini, selection toolbar docking and fallback, hover recognition, copying, editing, and light/dark pages.
4. Verify **Copy to Word** with representative fractions, matrices, delimiters, accents, and spacing in current Word desktop for Windows.
5. Audit for credentials, personal paths, remote code, generated files, and unnecessary permissions.
6. Build `ChatFacet-vX.Y.Z.zip` from a clean distribution directory that excludes `.git`, tests, development metadata, and caches. Generate `SHA256SUMS.txt` and check the extracted extension.
7. Push the commit to `main` and wait for CI. Tag the validated commit with an annotated `vX.Y.Z` tag and push it.
8. Publish bilingual release notes and immutable archive/checksum assets to [ChatFacet Releases](https://github.com/Vinken-y/ChatFacet/releases).
9. Verify public visibility, branch/tag commit equality, workflow result, release asset digest, and clean local status.

中文要求：版本号必须在 Manifest、package、更新日志、Git 标签、Release 标题和压缩包名中完全一致；发布前必须完成 Chrome/Edge、Word、隐私权限、依赖安全和压缩包哈希验证。发现问题后发布新补丁版本，不替换已发布资产来隐藏变更。
