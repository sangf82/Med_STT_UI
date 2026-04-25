---
name: pen-to-nextjs-medstt
description: "Convert Pencil .pen designs into production-ready Next.js App Router screens and reusable components for Med STT UI. Use when implementing screens from med-stt-design.pen while enforcing copilot-instructions.md, app-flow.md, existing component reuse, AppContext/apiClient patterns, i18n parity, and lint-ready integration."
argument-hint: "Describe the target .pen screen/node and route(s) to implement"
user-invocable: true
---

# Pencil to Next.js Med STT Implementation

## What This Skill Produces

- Production-ready Next.js screen implementations in `mvp-app/` derived from `.pen` design nodes.
- Reuse-first component composition aligned with existing architecture and route groups.
- Integration-ready changes (routing, state, data, i18n, and styling) that fit current app flow.
- Structured delivery output with five sections:

1. Component Breakdown
2. File Structure
3. Full Code
4. Integration Steps
5. Assumptions & Notes

## Use When

- The request is to translate a Pencil `.pen` design into real Next.js UI.
- The implementation must match existing patterns in this repository.
- You need architecture-safe integration, not isolated mock UI.

## Mandatory Inputs

- Target `.pen` file and relevant screen/node IDs or user-selected canvas context.
- Current repository state in `mvp-app/`.
- `copilot-instructions.md` and `app-flow.md`.

## Workflow

### 1. Pre-Execution Repository Analysis (Mandatory)

1. Analyze repository structure with focus on `mvp-app/` routes, components, context, hooks, and `lib/` APIs.
2. Read and follow `.github/copilot-instructions.md` before code generation.
3. Read and understand `app-flow.md` to map user journeys, navigation transitions, and screen relationships.
4. Read repository memory notes if present (especially patient folder and picker behavior constraints).

Decision checks:

- If requested behavior conflicts with `copilot-instructions.md`, follow instructions and document the assumption.
- If app flow naming differs (`app_flow.md` vs `app-flow.md`), use the existing file path in the workspace.

### 2. Pencil Design Interpretation (Mandatory)

1. Use Pencil MCP tools only for `.pen` content (`get_editor_state`, `batch_get`, `get_screenshot`, etc.).
2. Extract hierarchy, spacing, alignment, and component intent from the target design nodes.
3. Convert visual structure into a logical React component tree.

Decision checks:

- If design details are missing or ambiguous, infer behavior from nearby screens and `app-flow.md`.
- If a UI element has no clear behavior, choose the safest default and record it in Assumptions.

### 3. Reuse-First Component Architecture

1. Audit existing components in `mvp-app/components/` before creating anything new.
2. Reuse matching primitives/composites whenever possible.
3. Only create new components when no existing component fits with minor adaptation.

Decision checks:

- Reuse existing component: if shape/behavior can be matched via props and composition.
- Create new component: if repeated design pattern has no suitable reusable equivalent.
- Place new files in convention-aligned locations and keep route-group boundaries intact.

### 4. Code Generation and Integration

1. Use TypeScript functional components and repository naming/style conventions.
2. Keep page-local state in component state; use `AppContext` only for cross-route shared state.
3. Use `apiClient` and `lib/api/sttMetrics.ts` for data access patterns.
4. Preserve auth alignment (`setAuthToken`, cookie + localStorage expectations) and middleware assumptions.
5. Respect recording/review high-risk areas (background uploader recovery, polling cleanup).
6. Keep styling consistent with existing app patterns (`globals.css` and current component styling approach).
7. Update `messages/en.json` and `messages/vi.json` together for any new UI copy.

Decision checks:

- If route exists: integrate into existing layout/group.
- If route is new: add within correct App Router group (`(auth)`, `(dashboard)`, `(recording)`, `(review)`) based on app flow.
- If API not available: use clearly labeled mock data temporarily and document migration notes.

### 5. Quality Gates and Completion Criteria

Run these checks before finalizing:

1. Navigation and transitions align with `app-flow.md` user journeys.
2. No duplicate component creation where existing component already fits.
3. Output is responsive and consistent with surrounding screens.
4. i18n keys added in both locales.
5. Changes are lint-clean when feasible (`npm run lint` in `mvp-app/`).
6. No broad refactors; edits are minimal and surgical.

### 6. Required Output Contract

Always produce results in this exact order:

1. **Component Breakdown**

- List reused components.
- List newly created components.
- Explain structural reasoning.

2. **File Structure**

- Show each touched/created file and why it belongs there.

3. **Full Code**

- Provide complete production-ready code per file.

4. **Integration Steps**

- Explain route/layout/state/data integration and cite relevant app-flow behavior.

5. **Assumptions & Notes**

- Document missing design details, inferred behaviors, and uncertainties.

## Handling Incomplete Input

- Make reasonable assumptions instead of blocking.
- Prefer consistency with existing screens and app flow.
- Explicitly document each assumption in the final section.

## Anti-Patterns to Avoid

- Reading `.pen` files via non-Pencil tools.
- Ignoring route-group boundaries or moving API contracts out of `lib/api/sttMetrics.ts` without request.
- Hardcoding data where dynamic behavior is expected.
- Updating only one locale file.
- Creating duplicate components with overlapping responsibilities.

## Quick Prompt Starters

- `/pen-to-nextjs-medstt Implement the Dashboard processing-state variant from med-stt-design.pen and integrate with existing dashboard route.`
- `/pen-to-nextjs-medstt Convert the patient records screen node into app/(patients)/[folderName]/records/page.tsx using existing components first.`
- `/pen-to-nextjs-medstt Build the save dialog from Pencil into reusable components and wire behavior to recording flow and app context.`
