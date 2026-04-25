# Med STT UI Workspace Instructions

## Scope

This workspace contains:

- Product docs and prompts at repository root (`doc/`, `prompts/`, `output/`, `med-stt-design.pen`).
- Main runnable app in `mvp-app/` (Next.js App Router).

Treat `mvp-app/` as the primary codebase for implementation tasks unless the user explicitly asks for design/doc updates.

## Quick Start

Run commands from `mvp-app/`:

```bash
npm install
npm run dev
npm run lint
npm run build
npm start
```

## Architecture At A Glance

- App type: single Next.js 16 frontend (monolith web app) with App Router.
- Route groups: `(auth)`, `(dashboard)`, `(recording)`, `(review)`.
- Global providers in root layout: i18n provider, theme provider, app context provider, background uploader, global survey.
- Auth gate: middleware checks `auth_token` cookie for protected paths (`/dashboard`, `/recording`, `/review`).
- Data/API layer: `lib/apiClient.ts` + domain endpoints in `lib/api/sttMetrics.ts`.
- Local persistence: Dexie IndexedDB (`lib/db.ts`) for upload recovery.

## Core Conventions

- Use `apiClient` for authenticated JSON APIs whenever possible.
- Keep backend endpoint functions in `lib/api/sttMetrics.ts`.
- Use `AppContext` for cross-route app state; keep page-local UI state in component state.
- Persist auth token with `setAuthToken` (localStorage + cookie) so middleware and client remain aligned.
- For recording/upload changes, preserve the background recovery path (`BackgroundUploader` + IndexedDB metadata/chunks).
- Use `next-intl` keys from `messages/en.json` and `messages/vi.json`; update both locale files together.

## High-Risk Areas

- Upload flow race conditions: recording page sends streaming chunks while fallback recovery reads IndexedDB.
- Polling/retry logic in review layout: avoid duplicate intervals and ensure cleanup on unmount.
- Auth token source mismatch (cookie vs localStorage): any auth changes must consider both middleware and client fetches.

## Working Rules For Agents

- Prefer minimal, surgical edits over broad refactors.
- Keep route-group boundaries intact when adding screens/logic.
- Do not move API contracts/types out of `lib/api/sttMetrics.ts` unless requested.
- Validate changes with `npm run lint` in `mvp-app/` when feasible.

## Useful References (Link, Do Not Duplicate)

- `doc/AUTH_API_DOCUMENTATION.md`
- `mvp-app/AI_DATA_CONVERSION_GUIDE.md`
- `mvp-app/lib/api/sttMetrics.ts`
- `mvp-app/context/AppContext.tsx`
- `mvp-app/components/BackgroundUploader.tsx`
- `mvp-app/app/(recording)/recording/page.tsx`
- `mvp-app/app/(review)/layout.tsx`
