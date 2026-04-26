# Pilot 108 BDD → E2E coverage (`pilot108-bdd.spec.ts`)

Sources under `medmate-bdd/pilot_108/` (see `README.md` for named feature docs). Individual feature `.md` files may live outside this repo clone; strings in code match **Personal Productivity**, **Quick Edit**, and **Team Configuration** as implemented in `app/(pilot108)/pilot108/individual/page.tsx`.

| BDD area | Scenario / intent | Playwright / notes |
|----------|-------------------|-------------------|
| **Personal Productivity** | Record → processing status copy | `processing overlay lists all BDD step labels` (QA overlay; same strings as auto STT path when wired). |
| | Empty recording feedback | `empty-recording toast shows BDD string`. |
| | Transcription failure UX | `transcription error screen shows BDD copy and back action`. |
| | No actionable tasks from transcript | `no actionable tasks shows raw strip + BDD prompt`. |
| | Finalize / share scope choice | `share finalize dialog shows BDD title and scope labels` (QA opens dialog; real finalize still uses API). |
| | Offline / sync waiting | `offline banner shows BDD waiting copy` (QA toggle). |
| **Team Configuration** | Comma-separated roster bulk + roster UI | `team roster details, bulk save, assignee-empty BDD when roster empty` (empty roster → assignee column BDD string). |
| **Quick Edit** | Edit row text, delete row | `mock checklist rows: edit task text and remove row` (`?mockChecklist=1`). |
| | Pen-backed checklist rows | `fill table from pen checklist QA matches design mock rows`. |
| **STT / capture** | Navigate to capture surface | `STT upload stub visible from pilot flow`; pixel goldens for G1-G4, H1-H6, S1, E1-E4 in `pilot108-design.spec.ts` / `design-matrix.md`. |
| **Admin / HITL-adjacent** | Admin live stream monitor + snapshot | `snapshot card after mocked live meta` (`/admin/stt-stream/...` + mocked `/ai/stt/live/**`). |
| **Multi-user** | `feature-[BDD] Team 108 Roles & Assigned Time Filter.md` | **N/A in mvp-app** — no dedicated team board route; matrix row only. Integrate when `/pilot108/…` multi-user UI exists. |

Shared BDD strings: `lib/bdd/pilot108IndividualBdd.ts` (`PILOT108_INDIVIDUAL_BDD`), imported by the individual page and by Playwright for drift-free asserts.
