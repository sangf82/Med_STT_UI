---
name: pencil-pen-to-nextjs
description: Read Pencil .pen designs and implement production-ready Next.js screens/components integrated into this repository's architecture and conventions.
---

# Pencil .pen to Next.js Implementation Skill

## Outcome

Convert a Pencil `.pen` design into production-ready, maintainable Next.js UI that is fully integrated with this codebase's routing, component patterns, state model, i18n, and styling conventions.

## Use This Skill When

- The user asks to implement or convert a `.pen` design into code.
- New screens/components must be integrated into `mvp-app/`.
- Work must preserve existing architecture and conventions.

## Do Not Use This Skill When

- The task is only documentation or prompt writing.
- The task is backend-only and does not touch UI.

## Repository Scope and Rules

- Primary app is `mvp-app/`.
- Follow `.github/copilot-instructions.md` first.
- Preserve route groups: `(auth)`, `(dashboard)`, `(recording)`, `(review)`.
- Prefer `apiClient` and endpoint functions in `lib/api/sttMetrics.ts`.
- Keep global state in `context/AppContext.tsx`; keep page-local state local.
- Update both locales when adding UI copy: `messages/en.json` and `messages/vi.json`.
- Keep edits minimal and consistent with existing patterns.

## Mandatory .pen Handling

- Never read `.pen` files via generic file tools.
- Use Pencil MCP tools only for `.pen` analysis and edits.
- Always start with editor context (`get_editor_state`).
- Use `batch_get` to inspect design nodes/components.
- Use screenshots as needed to validate visual interpretation.

## Required Workflow

### 1. Repository Understanding (Before Coding)

1. Read `.github/copilot-instructions.md` and relevant docs.
2. Inspect key app files before edits:
   - `mvp-app/app/layout.tsx`
   - `mvp-app/context/AppContext.tsx`
   - `mvp-app/lib/api/sttMetrics.ts`
   - `mvp-app/components/*` related to target UI
3. Identify existing reusable components to avoid duplication.

Completion check:

- Can explain target route/layout, state touchpoints, styling approach, and i18n pattern.

### 2. Design Interpretation from .pen

1. Use Pencil tools to parse structure, spacing, hierarchy, and reusable elements.
2. Extract:
   - Screen sections (header/content/footer/nav)
   - Repeated element patterns
   - Interaction hints (buttons, tabs, forms)
3. Convert the visual structure into a component tree.

Completion check:

- Component breakdown is clear and mapped to file locations.

### 3. Architecture Decisions (Branching)

Decision A: Reuse vs Create

- Reuse existing components when behavior/visuals are close enough.
- Create new components only when reuse causes complexity or mismatch.

Decision B: Route placement

- Add within current route groups when feature matches existing domain.
- Add new route only if required by user flow.

Decision C: State location

- Put cross-route/shared state in `AppContext` only when necessary.
- Keep local interaction state inside page/component.

Decision D: Data source

- Use existing APIs/services when available.
- Use mock data only when backend linkage is unavailable; clearly mark assumptions.

### 4. Implementation

1. Create/update files in `mvp-app/` using existing naming/style patterns.
2. Build modular functional components with TypeScript types.
3. Wire routing/navigation and layout integration.
4. Add i18n keys to both locale files when text is introduced.
5. Connect behavior to existing APIs when relevant.

### 5. Quality Gates

Run and fix issues (when feasible):

1. `npm run lint` in `mvp-app/`
2. Build sanity (`npm run build`) when changes are broad
3. Verify responsive behavior for mobile + desktop
4. Verify no route-group boundary regressions
5. Verify no duplication of existing components

### 6. Delivery Format (Always)

Provide all of the following:

1. Component breakdown (what was created/reused and why)
2. File structure (exact files added/updated)
3. Full code changes per file
4. Integration notes (routes, layout, state, APIs)
5. Assumptions/uncertainties and follow-up options

## Implementation Checklist

- Read and followed `.github/copilot-instructions.md`
- Parsed `.pen` with Pencil tools only
- Reused existing components first
- Added new components in correct folders
- Preserved route group architecture
- Updated both `en.json` and `vi.json` for any new copy
- Kept state in proper scope (local vs context)
- Lint/build checked (or explained if not run)
- Documented assumptions

## Ambiguity Handling

If the design is incomplete:

1. Make reasonable assumptions based on nearby patterns/components.
2. Prioritize consistency with current app behavior.
3. Explicitly list what was inferred and what needs confirmation.

## Example Prompts

- "Use the Pencil design in the active editor to implement a new review summary screen in `(review)` by reusing existing cards and tab patterns."
- "Convert this `.pen` frame into a dashboard widget set, integrate with existing `Card` and `Badge` components, and add locale keys in both languages."
- "Implement this `.pen` mobile form into `(auth)` with existing `Input`, `Button`, and validation patterns, then wire navigation."
