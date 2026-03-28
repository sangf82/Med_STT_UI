---
name: html-prototype
description: "Generate a quick HTML/CSS/JS prototype from a Pencil (.pen) design. Use when: exporting screens to code, creating a clickable prototype, scaffolding a static HTML mockup, building a browser-ready demo from a .pen file design, rapid prototyping from Pencil screens."
argument-hint: "Name the section or screen to prototype (e.g. 'Section A Login flow')"
---

# HTML Prototype Generator

Produces a self-contained, browser-ready static prototype from one or more Pencil screens. Output is saved in the `prototype/` folder at the workspace root using the structure below.

## Output Folder Structure

```
prototype/
├── index.html          ← Entry point; renders the first/main screen
├── assets/
│   ├── css/
│   │   └── styles.css  ← All shared styles (reset, tokens, layout, components)
│   ├── img/            ← Exported images (favicons, illustrations, logos)
│   │   └── favicon.png
│   └── js/
│       └── main.js     ← Interactivity: screen transitions, state, toggles
```

> Additional HTML pages for sub-screens follow the naming pattern `{section}{number}.html` (e.g., `a2.html`, `a3.html`) at the root of `prototype/`.

## When to Use

- After finishing a section in the `.pen` file and wanting a clickable browser demo
- To share a prototype with a teammate who does not have Pencil
- To validate responsive behavior (mobile 390px vs desktop 1440px)

## Procedure

### 1. Extract Design Data from Pencil

1. `get_editor_state()` — confirm the active `.pen` file.
2. `batch_get(patterns)` — retrieve all sub-screens in the requested section (e.g., all nodes matching `A*`). Note the node IDs of each frame.
3. `snapshot_layout({ parentId: "sectionFrameId", maxDepth: 4 })` — record positions, sizes, and hierarchy. **Always pass `parentId`** to scope the snapshot to the section; omitting it scans the entire document and returns huge output.
4. `get_screenshot({ nodeId: "frameId" })` — capture a visual reference for each sub-screen. **`nodeId` is required**; use the IDs from step 2.
5. `get_variables` — extract design tokens (colors, spacing, typography).
6. `export_nodes({ nodeIds: ["frameId"], format: "png", scale: 2, outputDir: "./prototype/assets/img" })` — export any images, icons, or illustrations from the design directly into the prototype assets folder.

### 2. Map Design Tokens → CSS Variables

Convert Pencil variables (from `get_variables`) to CSS custom properties in `styles.css`. For the MedMate design file, the verified token names are:

```css
:root {
  /* Backgrounds */
  --bg-page: #F9FAFB;
  --bg-card: #FFFFFF;
  --bg-card-2: #F3F4F6;
  --bg-subtle: #F5F5F5;

  /* Accent */
  --accent-blue: #219EBC;
  --accent-blue-bg: #EBF5F8;
  --accent-orange: #FB8A0A;
  --accent-orange-bg: #FFF7ED;
  --nav-active-bg: #FFF7ED;
  --nav-active-border: #FB8A0A;

  /* Text */
  --text-primary: #1A1A1A;
  --text-dark: #333333;
  --text-medium: #555555;
  --text-secondary: #6B7280;
  --text-muted: #999999;
  --text-on-accent: #FFFFFF;

  /* Borders & Dividers */
  --border: #E5E7EB;
  --border-light: #EEEEEE;
  --border-medium: #D1D5DB;
  --border-input: #CCCCCC;
  --divider: #D0D0D0;

  /* Status */
  --danger: #E63946;
  --success: #16A34A;
  --success-bg: #DCFCE7;
  --warning-bg: #FEF3C7;
  --warning-text: #D97706;

  /* Misc */
  --overlay: rgba(0,0,0,0.08);
  --avatar-bg: #1E3A5F;

  /* Layout */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  --font-sans: 'Inter', system-ui, sans-serif;
}

/* Dark mode — matches Pencil Variant-1 theme values */
[data-theme="dark"] {
  --bg-page: #0A0A0A;
  --bg-card: #1A1A1A;
  --bg-card-2: #111827;
  --bg-subtle: #1C1C1C;
  --accent-blue-bg: #0D2A33;
  --accent-orange-bg: #2A1500;
  --nav-active-bg: #2A1500;
  --text-primary: #F0F0F0;
  --text-dark: #CCCCCC;
  --text-medium: #AAAAAA;
  --text-secondary: #9CA3AF;
  --text-muted: #666666;
  --border: #2A2A2A;
  --border-light: #1F1F1F;
  --border-medium: #374151;
  --border-input: #3A3A3A;
  --divider: #2A2A2A;
  --success-bg: #052E16;
  --warning-bg: #1C1A00;
  --warning-text: #FBBF24;
  --overlay: rgba(0,0,0,0.25);
  --avatar-bg: #0D2233;
}
```

### 3. Scaffold Files

Create (or overwrite) files in `prototype/` using the structure above:

| File | Contents |
|------|----------|
| `index.html` | First sub-screen (happy path); links to `assets/css/styles.css` and `assets/js/main.js` |
| `{s}{n}.html` | Each additional sub-screen (e.g., `a2.html` for wrong-password state) |
| `assets/css/styles.css` | CSS reset + token variables + all component styles |
| `assets/js/main.js` | Navigation between screens, form validation stubs, toggle/accordion logic |

### 4. Build HTML Structure

Follow this base template for every HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{ScreenName} — MedMate Prototype</title>
  <link rel="icon" href="assets/img/favicon.png" />
  <link rel="stylesheet" href="assets/css/styles.css" />
</head>
<body>
  <!-- screen content here -->
  <script src="assets/js/main.js"></script>
</body>
</html>
```

> For screens in subfolders (none by default), adjust relative paths accordingly.

### 5. Implement Interactivity in `main.js`

- Screen transitions: clicking a CTA button navigates to the next sub-screen HTML file.
- Error states: form submission with empty/invalid fields swaps to the error-state screen.
- Theme toggle: if both Light and Dark variants exist, wire a toggle button to swap a `data-theme="dark"` attribute on `<html>`. The CSS `:root` / `[data-theme="dark"]` variable overrides in `styles.css` do the rest.
- Language toggle: if both EN and VN variants exist, use a `data-lang` attribute and `data-en`/`data-vn` attributes on text nodes that differ between locales.
- All navigation must be client-side only (no server required).
- Persist theme/language preference in `localStorage` so page reloads remember the choice.

### 6. Responsive Breakpoints

Apply these breakpoints in `styles.css` to match Pencil canvas sizes:

```css
/* Mobile-first default: 390px */
/* Desktop */
@media (min-width: 1024px) { … }
```

### 7. Validate

- Open `prototype/index.html` in a browser (or run a local static server).
- Click through all sub-screen links and verify the happy path and error states work.
- Check mobile (390px) and desktop (1440px) widths in browser DevTools.
- Toggle dark mode via the theme button and verify all CSS variables switch correctly.
- Verify exported images from `export_nodes` are referenced correctly and load without 404s.

## Constraints

- DO NOT use any build tools, bundlers, or frameworks — output must be plain HTML/CSS/JS.
- DO NOT inline styles in HTML; all styles go in `assets/css/styles.css`.
- DO NOT use external CDN links — prototype must work fully offline.
- Keep `main.js` simple: no classes, no modules, just plain functions and `addEventListener`.
- Images: use `export_nodes` to get real images where possible. For images that cannot be exported, use a `<div>` placeholder with background color and a descriptive `aria-label`.
- When calling `snapshot_layout`, always pass `parentId` — never call it without a scope on a large document.
- When calling `get_screenshot`, always pass `nodeId` — it is required.
- DO NOT call `replace_all_matching_properties` with only the 3 color keys — it also supports `strokeThickness`, `cornerRadius`, `padding`, `gap`, `fontSize`, `fontFamily`, `fontWeight`. Use all relevant keys when tokenizing.
