# Pilot 108 — design-first E2E matrix

Source of truth: `medmate-bdd/design/docs/screen-map-108.md`, `medmate-bdd/design/docs/DESIGN.md`, pen `medmate-bdd/design/pen-stt-108.pen` (node IDs in `medmate-bdd/design/CLAUDE.md`).

## Playwright golden snapshots (automated expected UI)

Regression compares the **running app** to committed PNGs from [pilot108-design.spec.ts](pilot108-design.spec.ts). Paths follow `playwright.config.js` → `snapshotPathTemplate`:

`e2e/__screenshots__/{projectName}/pilot108-design.spec.ts-snapshots/{filename}.png`

Typical local CI project: **`chromium-local`**. BrowserStack uses **`browserstack-chrome`** (same filenames, separate folders — refresh BS baselines with `npm run test:e2e:bs:design -- --update-snapshots` if you treat cloud as canonical).

| Screen (matrix) | Hook | Golden file (`…-snapshots/`) |
| --- | --- | --- |
| G1 · Welcome | `p108-g1-screen` | `g1-welcome.png` |
| G2 · Method selection | `p108-g2-screen` | `g2-team-method.png` |
| G3a · Bulk input | `p108-g3a-screen` | `g3a-bulk-input.png` |
| G3b · Manual add | `p108-g3b-screen` | `g3b-manual-add.png` |
| G4 · Roster preview | `p108-g4-screen` | `g4-roster-preview.png` |
| H1 · Quick Capture Home | `p108-h1-home` | `h1-quick-capture-home.png` |
| H1 · FAB | `p108-h1-record-fab` | `h1-record-fab.png` |
| H2 · STT capture stub | `p108-h2-stt-root` | `h2-stt-capture.png` |
| H3 · Uploading | `p108-h3-upload-screen` | `h3-uploading.png` |
| H3 · Transcribing | `p108-h3-transcribing-screen` | `h3-transcribing.png` |
| H3 · Identifying | `p108-h3-identifying-screen` | `h3-identifying.png` |
| H3 · Formatting | `p108-h3-formatting-screen` | `h3-formatting.png` |
| H3 · Success | `p108-h3-success-screen` | `h3-success.png` |
| H4 · Draft checklist panel | `p108-h4-checklist-panel` | `h4-draft-panel.png` |
| H5 · Share dialog | `p108-bdd-share-dialog` | `h5-share-dialog.png` |
| H6 · Finalized checklist panel | `p108-h4-checklist-panel` (`?designMockFinalized=1`) | `h6-finalized-panel.png` |
| S1 · Team management | `p108-s1-team-screen` | `s1-team-management.png` |
| E1 · Silence toast | `p108-h3-silence-screen` | `e1-silence-toast.png` |
| E2 · Transcription error | `p108-h3-error-screen` | `e2-transcription-error.png` |
| E3 · No tasks | `p108-h3-notasks-screen` | `e3-no-tasks.png` |
| E4 · Offline queue | `p108-h3-offline-screen` | `e4-offline-queue.png` |

**Pen exports** under `e2e/baselines/pen/*.png` are **design reference only** (human review vs Pencil); they are not asserted pixel-for-pixel in Playwright (fonts/rendering differ from the browser).

**Design-only query (no backend draft):** `?designMockFinalized=1` on `/pilot108/individual` hydrates a local finalized draft + pen strip rows for H6 goldens and screenshots.

## G1-G4 · Team Onboarding

| Screen-map | Automatable check | Hook |
| --- | --- | --- |
| G1 welcome | `toHaveScreenshot` → `g1-welcome.png` | `p108-g1-screen` |
| G2 method selection | `toHaveScreenshot` → `g2-team-method.png` | `p108-g2-screen` |
| G3a bulk input | `toHaveScreenshot` → `g3a-bulk-input.png` | `p108-g3a-screen` |
| G3b manual add | `toHaveScreenshot` → `g3b-manual-add.png` | `p108-g3b-screen` |
| G4 roster preview | `toHaveScreenshot` → `g4-roster-preview.png` | `p108-g4-screen` |

Route: `/pilot108/team-setup?step=g1|g2|g3a|g3b|g4`.

## H1 · Quick Capture Home

| Screen-map / DESIGN | Automatable check | Hook |
| --- | --- | --- |
| H1.0 MedMate header, record entry (`screen-map` §H1) | Header present; session title visible | `p108-header`, `p108-session-title` |
| H1 mobile home frame | `toHaveScreenshot` → `h1-quick-capture-home.png` | `p108-h1-home` |
| FAB **56px** circle, **#FB8A0A** fill, **fixed bottom-right 24px** inset (`DESIGN.md` §Floating Action Button) | `getComputedStyle` + `boundingBox` + `toHaveScreenshot` → `h1-record-fab.png` | `p108-h1-record-fab` |
| Background page `#F8FAFC` (`DESIGN.md` · Background) | Token is `--background` on `:root` (Tailwind may resolve to `oklch`); pixel-compare shell only if needed | `p108-shell` |

Pen reference exports: `e2e/baselines/pen/aySV0.png` (Recording/FAB component in pen).

## H2 · Recording Active (stub)

| Screen-map | Automatable check | Hook |
| --- | --- | --- |
| H2 stream / capture entry | Root visible; “Start” control + `toHaveScreenshot` → `h2-stt-capture.png` | `p108-h2-stt-root` |

Pen baseline: `e2e/baselines/pen/9Jw8L.png` (H2.0 · Recording Active).

## H3 · AI Processing

| Screen-map | Automatable check | Hook |
| --- | --- | --- |
| H3.0-H3.4 step states | `toHaveScreenshot` → `h3-uploading.png`, `h3-transcribing.png`, `h3-identifying.png`, `h3-formatting.png`, `h3-success.png` | `p108-h3-{state}-screen` |

## H4 · Draft To-Do List

| Screen-map / DESIGN | Automatable check | Hook |
| --- | --- | --- |
| H4 draft vs finalized copy | Title + **DRAFT** / **FINALIZED** chip text | `p108-h4-checklist-title`, `p108-h4-status-chip` |
| Chips **12px / 500 / uppercase** (`DESIGN.md` §Chips) | `getComputedStyle` fontSize, fontWeight | `p108-h4-status-chip` |
| List / table shell | `toHaveScreenshot` → `h4-draft-panel.png` (threshold in `playwright.config.ts`) | `p108-h4-checklist-panel` |

Pen baseline: `e2e/baselines/pen/VtdW0.png` (H4.0 · Draft To-Do List).

## H5 · Share Selection

| Screen-map | Automatable check | Hook |
| --- | --- | --- |
| Modal pattern (BDD copy) | Open via QA **Preview share dialog**; `toHaveScreenshot` → `h5-share-dialog.png` | `p108-bdd-share-dialog` (`IndividualShareDialog`) |

## H6 · Finalized List

Same panel as H4 with `isFinalized`; chip **FINALIZED**; `toHaveScreenshot` → `h6-finalized-panel.png` on `p108-h4-checklist-panel` with `?designMockFinalized=1`. Tick/cross behaviour vs BDD: see `GAP_BACKEND_FRONTEND.md`.

## S1 · Team Management

| Screen-map | Automatable check | Hook |
| --- | --- | --- |
| S1 roster settings | `toHaveScreenshot` → `s1-team-management.png` | `p108-s1-team-screen` |

Route: `/pilot108/team`.

## E1-E4 · Edge States

| Screen-map | Automatable check | Hook |
| --- | --- | --- |
| E1 silence toast | `toHaveScreenshot` → `e1-silence-toast.png` | `p108-h3-silence-screen` |
| E2 transcription error | `toHaveScreenshot` → `e2-transcription-error.png` | `p108-h3-error-screen` |
| E3 no tasks found | `toHaveScreenshot` → `e3-no-tasks.png` | `p108-h3-notasks-screen` |
| E4 offline queue | `toHaveScreenshot` → `e4-offline-queue.png` | `p108-h3-offline-screen` |

Route: `/pilot108/processing?state=silence|error|notasks|offline`.

## Glossary

- **Token asserts**: `getComputedStyle` vs `DESIGN.md` hex/spacing/typography.
- **Playwright golden / visual contract**: `toHaveScreenshot` files listed above; committed under `e2e/__screenshots__/{project}/pilot108-design.spec.ts-snapshots/`. After intentional UI changes: `npm run test:e2e -- e2e/pilot108-design.spec.ts --update-snapshots` (or full `npm run test:e2e -- --update-snapshots`), then commit the updated PNGs.
- **Pen PNGs**: `e2e/baselines/pen/*.png` — design reference from pen export; not the same bytes as browser goldens; use for manual alignment reviews.
