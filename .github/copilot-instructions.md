---
applyTo: "**/*.pen"
---

# Med STT UI — Pencil Design Instructions

This file is **personal-use only**. It instructs GitHub Copilot how to assist with designing in `med-stt-design.pen` using the Pencil MCP tools.

## Golden Rules

- **NEVER** read or grep `.pen` files directly — they are encrypted. Always use Pencil MCP tools.
- Always call `get_editor_state()` first if unsure what is currently active/selected.
- Always call `get_guidelines(topic)` before designing a new screen type (e.g. `mobile-app`, `web-app`).
- Validate visually with `get_screenshot` after significant changes.
- Aim for ≤ 25 operations per `batch_design` call.

## Project Context

**File:** `med-stt-design.pen`
**App:** MedMate — a mobile medical Speech-to-Text UI

### Screen Inventory (frame naming convention: `{Group}{Number} · {Description}`)

| Group | Screens |
|-------|---------|
| **A** | Login, Login Error (Password/Username), Sign Up, Sign Up Error, Sign Up Mismatch |
| **B** | Dashboard (Expanded/Collapsed), Sidebar, Settings, Profile |
| **C** | Recording, Recording Paused, Continue Recording, Save Dialog |
| **D** | Audio Detail, EHR Summary, Free Text, Menu Popup, Rename Dialog |
| **E** | Patients List |

- **Theme switching:** via Pencil Variables panel — `Theme` group has `Default` (Light) and `Variant-1` (Dark)
- **Language switching:** via Pencil Variables panel — `Language` group has `Default` (English) and `Variant-1` (Vietnamese)
- **Canvas sizes:** Mobile `390 × 844 px` · Desktop `1440 × 900 px` (design both unless platform is specified)
- **Component Library frame:** `📦 Component Library` at `x: 4948`

### Layout Spacing Conventions

- Screen padding: typically `padding: 16` on content areas
- Gap between sections: `gap: 12` or `gap: 16`
- Header height: ~56 px; Bottom bar height: ~80 px
- Status bar placeholder at top: `height: 24`

### Design System Tokens (defined as Pencil variables — use `$token-name` in batch_design)

| Variable | Light value | Dark value (set in Pencil UI) |
|----------|-------------|-------------------------------|
| `$bg-page` | `#F9FAFB` | `#0A0A0A` |
| `$bg-card` | `#FFFFFF` | `#1A1A1A` |
| `$bg-card-2` | `#F3F4F6` | `#111827` |
| `$bg-subtle` | `#F5F5F5` | `#1C1C1C` |
| `$accent-blue` | `#219EBC` | `#219EBC` |
| `$accent-blue-bg` | `#EBF5F8` | `#0D2A33` |
| `$accent-orange` | `#FB8A0A` | `#FB8A0A` |
| `$accent-orange-bg` | `#FFF7ED` | `#2A1500` |
| `$nav-active-bg` | `#FFF7ED` | `#2A1500` |
| `$nav-active-border` | `#FB8A0A` | `#FB8A0A` |
| `$text-primary` | `#1A1A1A` | `#F0F0F0` |
| `$text-dark` | `#333333` | `#CCCCCC` |
| `$text-medium` | `#555555` | `#AAAAAA` |
| `$text-secondary` | `#6B7280` | `#9CA3AF` |
| `$text-muted` | `#999999` | `#666666` |
| `$text-dim` | `#888888` | `#777777` |
| `$text-light` | `#AAAAAA` | `#555555` |
| `$text-lighter` | `#BBBBBB` | `#444444` |
| `$text-on-accent` | `#FFFFFF` | `#FFFFFF` |
| `$section-label` | `#374151` | `#9CA3AF` |
| `$border` | `#E5E7EB` | `#2A2A2A` |
| `$border-light` | `#EEEEEE` | `#1F1F1F` |
| `$border-medium` | `#D1D5DB` | `#374151` |
| `$border-input` | `#CCCCCC` | `#3A3A3A` |
| `$divider` | `#D0D0D0` | `#2A2A2A` |
| `$danger` | `#E63946` | `#E63946` |
| `$danger-2` | `#EF4444` | `#EF4444` |
| `$success` | `#16A34A` | `#16A34A` |
| `$success-bg` | `#DCFCE7` | `#052E16` |
| `$warning-bg` | `#FEF3C7` | `#1C1A00` |
| `$warning-text` | `#D97706` | `#FBBF24` |
| `$overlay` | `#00000014` | `#00000040` |
| `$avatar-bg` | `#1E3A5F` | `#0D2233` |

> Dark-mode variant values must be set manually in the Pencil **Variables panel** (the API only writes the default/light value).

## Variables — API Rules (MUST follow to avoid errors)

### set_variables — correct format

```json
{
  "variables": {
    "bg-page": { "type": "color", "value": "#F9FAFB" },
    "text-primary": { "type": "color", "value": "#1A1A1A" }
  }
}
```

**Hard rules (violations cause API errors the hook will block):**
- `type` must be `"color"` for color tokens — `"text"` is NOT a valid type (the spec uses `"string"`). Only `"color"` is **verified** to work via MCP API. `"number"`, `"boolean"`, `"string"` are valid in the `.pen` format spec but untested via MCP API.
- `value` must be a plain scalar (hex string for color, number for numeric) — passing an object is rejected
- Per-theme variant values (Light vs Dark) **cannot be set via API** — open the Pencil Variables panel manually and set values in column 2 (`Variant-1` = Dark)

### replace_all_matching_properties — correct format

> ⛔ **CRITICAL PITFALL — NEVER use `$token` as `to`:**
> The API escapes `$` into a broken escaped literal `\$token` (e.g. `\$bg-page`) which renders as no color. It does **not** create a real variable reference.
> - **`replace_all_matching_properties`** → use for **hex→hex corrections only**
> - **`batch_design U(nodeId, { fill: "$token" })`** → the **only** correct way to store variable references

```json
{
  "parents": ["frameId1", "frameId2"],
  "properties": {
    "fillColor":       [{ "from": "#E63946", "to": "#F9FAFB" }],
    "strokeColor":     [{ "from": "#FF0000", "to": "#E5E7EB" }],
    "textColor":       [{ "from": "#E63946", "to": "#1A1A1A" }],
    "fontSize":        [{ "from": 12, "to": 14 }],
    "fontFamily":      [{ "from": "Arial", "to": "Inter" }],
    "fontWeight":      [{ "from": "normal", "to": "600" }],
    "gap":             [{ "from": 4, "to": 8 }],
    "padding":         [{ "from": 8, "to": 16 }],
    "cornerRadius":    [{ "from": 4, "to": 8 }],
    "strokeThickness": [{ "from": 2, "to": 1 }]
  }
}
```

- `properties` must be an **object** — valid keys: `fillColor`, `strokeColor`, `textColor`, `strokeThickness`, `cornerRadius`, `padding`, `gap`, `fontSize`, `fontFamily`, `fontWeight`
- Each key's value is an **array** of `{from, to}` pairs — `to` MUST be a plain hex/scalar value, **NEVER** `$token`
- ⚠️ **Scope carefully**: use narrow `parents` arrays. Replacing `#FFFFFF` globally will also hit text-on-teal nodes and icon fills!

### search_all_unique_properties — correct format

```json
{
  "parents": ["frameId1"],
  "properties": ["fillColor", "strokeColor", "textColor", "fontSize", "fontFamily"]
}
```

- `properties` must be an **array of strings** — valid strings: `"fillColor"`, `"strokeColor"`, `"textColor"`, `"strokeThickness"`, `"cornerRadius"`, `"padding"`, `"gap"`, `"fontSize"`, `"fontFamily"`, `"fontWeight"`

### Reference variables in batch_design

```javascript
U("nodeId", { fill: "$bg-page" })
U("nodeId", { stroke: { align: "inside", fill: "$border", thickness: { bottom: 1 } } })
I("parent", { type: "text", fill: "$text-primary", content: "Hello" })
// Number variables also work for spacing/font:
I("parent", { type: "frame", gap: "$spacing.md", padding: "$spacing.lg" })
```

## Canvas Organization

- Each feature is a **section** with a letter ID (A, B, C, …). Sections run **left to right** across the canvas in UX flow order.
- Within a section, sub-screens are arranged **horizontally** (left to right) to show the UX flow of that feature.
  - Example — Section A (Login): `A1` happy path → `A2` wrong password → `A3` sign up → `A4` sign up error
- After placing sub-screens, add **UX flow note nodes** between them explaining what triggers each transition or branch.
- Each section contains **mobile screens first** (390 × 844), then **desktop screens** (1440 × 900) alongside.

## Workflow for a New Feature/Section

1. `get_editor_state()` — confirm active file and current state.
2. `batch_get` — check existing sections, identify the next section letter.
3. `get_variables` — check for an existing design system.
4. **If no design system found**: ask user for brand colors, light/dark preference, font, and whether to generate a style guide before proceeding.
5. `get_guidelines("mobile-app")` and `get_guidelines("web-app")` — load layout rules for both platforms.
6. `get_style_guide_tags` → `get_style_guide(tags, name)` — pick or confirm a style.
7. `find_empty_space_on_canvas` — find placement for the new section.
8. For each sub-screen (left to right): mobile first, then desktop. Copy nearest frame with `C()`, update with `U()` / `R()`. Use `$token-name` for all colors.
9. Add UX flow note nodes between sub-screens.
10. `get_screenshot` to validate.
11. Name frames following the convention above.

## Workflow for Editing Existing Screens

1. `batch_get(patterns)` — locate the target node(s)
2. `snapshot_layout` — understand current layout before touching it
3. Use `batch_design` with `U()` or `R()` to apply changes — use `$token-name` for all colors
4. `get_screenshot` to confirm result

## Workflow for Tokenizing Colors in Existing Screens

1. `search_all_unique_properties` with `properties: ["fillColor","strokeColor","textColor"]` to discover raw hex codes
2. **Map semantic roles carefully** — the same hex (e.g. `#FFFFFF`) may mean card-bg in one node but text-on-teal in another — assign DIFFERENT tokens to each
3. `set_variables` to define tokens (color only, plain hex values)
4. `replace_all_matching_properties` using **scoped `parents`** (individual frames, not entire canvas) to swap hex → `$token`
5. `get_screenshot` to confirm visuals are intact — check white text on colored headers especially
6. Open Pencil Variables panel → set Dark-mode values in the second column (`Variant-1`)

## Export / Handoff

To export frames as images or PDF:
```javascript
export_nodes({ nodeIds: ["frameId"], format: "png", scale: 2, outputDir: "./exports" })
// format: png | jpeg | webp | pdf
// Always provide outputDir — required field
```

To export a browser-ready HTML prototype, use the **`html-prototype`** skill. Output is saved in `prototype/` with the structure:
```
prototype/
├── index.html
└── assets/
    ├── css/styles.css
    ├── img/
    └── js/main.js
```
Plain HTML/CSS/JS only — no frameworks, no CDN, works offline.

## Component Library

Before creating a new component from scratch, search the `📦 Component Library` frame (`id: 6KYph`) with `batch_get` to check if it already exists. Copy with `C()` rather than rebuilding.
