# PDF Exporter for Figma

A Figma plugin that exports selected frames from the current page as a single multi-page PDF, with configurable resolution and JPEG compression.

## Overview

`PDF Exporter` scans the current Figma page for top-level frames, lets you pick which ones to include and in what order, and generates a single PDF where each selected frame becomes one page at its native dimensions. Image compression and resolution are tunable from quality presets ("Best" through "Low") or via custom sliders. The estimated file size is shown live before you export.

PDF generation runs entirely client-side inside the plugin — nothing is uploaded.

## Features

- **Page-aware frame list** — automatically lists every top-level frame on the current page, sorted top-to-bottom then left-to-right, with live thumbnails.
- **Drag-and-drop reordering** — drag rows to set the page order in the final PDF.
- **Selection sync** — if frames are selected on the canvas when the plugin opens, only those are pre-checked; otherwise everything is selected by default.
- **Quality presets**:
  - Best (Print) — 2× scale, 95% JPEG
  - High (Presentation) — 2× scale, 85% JPEG *(default)*
  - Medium (Sharing) — 1.5× scale, 70% JPEG
  - Low (Draft) — 1× scale, 50% JPEG
  - Custom — fine-tune resolution (0.5×–3×) and JPEG quality (10%–100%) via sliders
- **Live size estimate** — predicted PDF size updates as you change selection or quality.
- **Persistent settings** — last-used quality preset is saved per user via Figma client storage.
- **Native page sizes** — each PDF page matches its source frame's pixel dimensions, preserving aspect ratio.
- **Cancellable export** — long exports can be aborted mid-run.
- **Memory-conscious export** — frames are exported, JPEG-compressed, and embedded one at a time; intermediate buffers are released between pages to avoid pressure on large documents.
- **Offline** — pdf-lib is bundled inside `ui.html`, no CDN dependency, no network access required at runtime.

## Installation (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/dorsch5000/figma-pdf-exporter.git
   cd figma-pdf-exporter
   ```
2. In the Figma desktop app, open **Plugins → Development → Import plugin from manifest…** and pick `manifest.json` at the project root.

That's it — `code.js` and `ui.html` are committed, no build step required for normal use.

## Usage

1. Open a Figma file with one or more top-level frames on a page.
2. Run **Plugins → Development → PDF Exporter**.
3. Tick the frames you want to include, optionally drag to reorder.
4. Pick a quality preset or adjust the sliders.
5. Edit the file name if needed (defaults to the Figma file's name).
6. Click **Export** — the PDF is downloaded by your browser.

## Project Structure

```
.
├── manifest.json    # Figma plugin manifest
├── code.ts          # Plugin sandbox source (Figma API)
├── code.js          # Compiled JS — committed, what Figma actually loads
├── ui.html          # Plugin UI (HTML/CSS/JS) with pdf-lib inlined
├── tsconfig.json
└── package.json
```

`ui.html` contains the pdf-lib bundle (~525 KB) inlined as a `<script>` block near the bottom of the file. This keeps the plugin entirely offline and avoids relying on a CDN. When editing the UI, ignore that block — everything plugin-specific is in the surrounding HTML/CSS/JS.

## Modifying the plugin

If you change `code.ts`, recompile:

```bash
npm install        # once
npm run build      # tsc → code.js
# or
npm run watch      # tsc --watch for iterative development
```

`ui.html` is edited directly — no build step.

To update pdf-lib to a newer version, download the new `pdf-lib.min.js` from npm/unpkg and replace the contents inside the `<!-- BEGIN pdf-lib -->` … `<!-- END pdf-lib -->` block in `ui.html`.

## Tech

- **TypeScript** for the plugin sandbox
- **pdf-lib** (1.17.1, MIT) for client-side PDF assembly, bundled inline
- **Figma Plugin API 1.0**, manifest API `1.0.0`

## License

[MIT](./LICENSE)
