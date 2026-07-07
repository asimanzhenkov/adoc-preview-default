# AsciiDoc Default Preview

A VS Code extension that opens `.adoc` / `.asciidoc` / `.ad` files in a **live preview** by default,
with a single **✎ Edit** button in the toolbar to instantly switch back to the text editor.

## Features

- **Preview by default** — `.adoc` files open in rendered HTML preview instead of raw text
- **✎ Edit button** — one click to reopen the file in the standard text editor
- **Live reload** — preview updates as you type (debounced, configurable)
- **VS Code theme-aware** — uses VS Code CSS variables for colors (dark/light/high-contrast)
- **Asciidoctor.js** — rendered locally, no external CLI required

## Requirements

No external dependencies needed. The extension bundles `@asciidoctor/core`.

## Settings

| Setting | Default | Description |
|---|---|---|
| `adocPreview.openPreviewByDefault` | `true` | Open .adoc files in preview by default |
| `adocPreview.liveReload` | `true` | Update preview while typing |
| `adocPreview.liveReloadDebounceMs` | `300` | Debounce delay (ms) for live reload |

## Usage

1. Open any `.adoc` file — it will automatically open in preview mode
2. Click **✎ Edit** in the editor toolbar to switch to text editing
3. While editing, click the **👁 Preview** icon in the toolbar to return to preview

## Installation

```bash
# From VSIX (download from Releases)
code --install-extension adoc-preview-default-*.vsix
```

## Build locally

```bash
npm install
npm run compile
npm run package   # produces .vsix
```
