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

### Screen Inventory (frame naming convention: `{Group}{Number} · {Description} {Theme} [{Locale}]`)

| Group | Screens |
|-------|---------|
| **A** | Login, Login Error (Password/Username), Sign Up, Sign Up Error, Sign Up Mismatch |
| **B** | Dashboard (Expanded/Collapsed), Sidebar, Settings, Profile |
| **C** | Recording, Recording Paused, Continue Recording, Save Dialog |
| **D** | Audio Detail, EHR Summary, Free Text, Menu Popup, Rename Dialog |
| **E** | Patients List |

- **Themes:** Light (`fill: #F9FAFB` or `#FFFFFF`) / Dark (`fill: #0A0A0A`)
- **Locales:** English (no suffix) / Vietnamese (`(VN)` suffix)
- **Canvas size:** 390 × 844 px (mobile)
- **Component Library frame:** `📦 Component Library` at `x: 4948`

### Layout Spacing Conventions

- Screen padding: typically `padding: 16` on content areas
- Gap between sections: `gap: 12` or `gap: 16`
- Header height: ~56 px; Bottom bar height: ~80 px
- Status bar placeholder at top: `height: 24`

### Design System Tokens (inferred)

| Role | Light | Dark |
|------|-------|------|
| Background | `#F9FAFB` / `#FFFFFF` | `#0A0A0A` |
| Primary accent | `#2563EB` (blue-600) | `#3B82F6` (blue-500) |
| Destructive | `#EF4444` | `#F87171` |
| Text primary | `#111827` | `#F9FAFB` |
| Text secondary | `#6B7280` | `#9CA3AF` |
| Border | `#E5E7EB` | `#1F2937` |
| Card surface | `#FFFFFF` | `#111827` |

## Workflow for New Screens

1. `find_empty_space_on_canvas` — find placement for the new frame
2. `get_guidelines("mobile-app")` — load design rules
3. `get_style_guide_tags` → `get_style_guide(tags, name)` — pick a style
4. Copy the closest existing frame with `batch_design` `C()` operation as a base
5. Modify content with `U()` / `R()` operations
6. `get_screenshot` to validate
7. Name the frame following the convention above

## Workflow for Editing Existing Screens

1. `batch_get(patterns)` — locate the target node(s)
2. `snapshot_layout` — understand current layout before touching it
3. Use `batch_design` with `U()` or `R()` to apply changes
4. `get_screenshot` to confirm result

## Parity Rule

When adding or modifying a screen, **always maintain Light + Dark parity**, and **English + VN parity** if localized text is involved. Create or update all 2–4 variants together.

## Component Library

Before creating a new component from scratch, search the `📦 Component Library` frame (`id: 6KYph`) with `batch_get` to check if it already exists. Copy with `C()` rather than rebuilding.
