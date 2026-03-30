# MedMate — UX Flow Documentation

> Mobile medical Speech-to-Text app. All screens are 390 × 844 px.
> Theme switching (Light/Dark) and language switching (English/Vietnamese) via Pencil Variables.

---

## Section A — Authentication

| Screen | Name | Description |
|--------|------|-------------|
| A1 | Mobile Login | Email + password fields, "Sign In" button, "Sign Up" link, language switcher |
| A2 | Login Error Password | Same as A1 with inline error on password field |
| A3 | Login Error Username | Same as A1 with inline error on email field |
| A4 | Sign Up | Back arrow → A1, name/email/password/confirm fields, password strength indicator |
| A5 | Sign Up Error | Same as A4 with field validation errors |
| A6 | Sign Up Mismatch | Same as A4 with password mismatch error |

**Flow:**
- A1 → tap "Sign In" (success) → B1 Dashboard
- A1 → tap "Sign In" (wrong password) → A2
- A1 → tap "Sign In" (wrong email) → A3
- A1 → tap "Sign Up" link → A4
- A4 → validation error → A5 or A6
- A4 → tap "Create Account" (success) → B1 Dashboard

---

## Section B — Dashboard & Settings

| Screen | Name | Description |
|--------|------|-------------|
| B1 | Dashboard Expanded | Full header with greeting, 3 sections: To Do List, Patients, Unassigned — each with "View all >" link, FAB record button |
| B2 | Dashboard Collapsed | Compact header variant of B1, same 3-section layout |
| B2b | Processing Single | Dashboard showing 1 file processing under a patient folder |
| B2c | Processing Multi | Dashboard showing multiple files processing across patient folders |
| B3 | Sidebar | Slide-out menu with nav items: Dashboard, To Do List, Patients, Unassigned, Settings; dark overlay on content |
| B4 | Settings | Back arrow → B1, rows: Theme toggle, Language, Notifications, Account, About, Log Out |
| B5 | Profile | Back arrow → B4, avatar, editable name/email/phone/specialty fields |
| B6 | All To Do | Back arrow → B1, day picker (chevron nav), card list of all tasks with Pending/Done badges and patient info |
| B7 | All Patients | Back arrow → B1, search bar, patient list with folder icons, visit date, record count |
| B8 | All Unassigned | Back arrow → B1, search bar, record cards with Synced/Processing badges and "Assign to patient" action |

**Flow:**
- B1/B2 → tap hamburger menu → B3 Sidebar
- B3 → tap "Dashboard" → B1
- B3 → tap "To Do List" → B6 All To Do
- B3 → tap "Patients" → B7 All Patients
- B3 → tap "Unassigned" → B8 All Unassigned
- B3 → tap "Settings" → B4 Settings
- B1/B2 → tap "View all >" on To Do section → B6
- B1/B2 → tap "View all >" on Patients section → B7
- B1/B2 → tap "View all >" on Unassigned section → B8
- B1/B2 → tap patient card → E1 Patient Records (filtered to that patient)
- B1/B2 → tap unassigned record card → D1 Audio Detail
- B1/B2 → tap FAB (microphone) → C1 Recording
- B4 → tap Profile row → B5
- B4 → tap "Log Out" → A1
- After recording saved → B2b/B2c (processing indicators appear on dashboard)

---

## Section C — Recording

| Screen | Name | Description |
|--------|------|-------------|
| C1 | Recording | Timer, live waveform, pause + stop buttons |
| C2 | Recording Paused | Timer frozen, waveform static, resume + stop buttons |
| C3 | Continue Recording | Resume from paused state, timer continues |
| C4 | Save Dialog | Overlay card with: file name input, output format selector (SOAP / EHR / Free Text), patient assignment dropdown, Save + Cancel buttons |

**Flow:**
- C1 → tap pause → C2
- C2 → tap resume → C3
- C3 → tap pause → C2 (cycle)
- C1/C2/C3 → tap stop → C4 Save Dialog
- C4 → tap "Save" → B2b (dashboard with processing status)
- C4 → tap "Cancel" / back → discard, return to B1
- If recording started from inside a patient folder, the patient is pre-filled in C4

---

## Section D — Record Detail & Editing

| Screen | Name | Description |
|--------|------|-------------|
| D1 | Audio Detail | Header (back, title, saving status, triple-dot menu), tab bar (Formatted / Raw), editor toolbar (bold, italic, font size, align), transcript content with audio player |
| D2 | EHR Summary | Same header + editor toolbar, structured EHR output (Chief Complaint, HPI, Assessment, Plan sections) |
| D3 | Free Text | Same header + editor toolbar, plain text transcript |
| D4 | Menu Popup | D1 with edit icon menu open — options: Rename, Convert, Delete |
| D5 | Rename Dialog | D1 with rename overlay card — text input + Save/Cancel |
| D6 | Convert Dialog | D1 with convert overlay card — dropdown to pick output format (like C4), Cancel/Convert buttons |

**Flow:**
- B1/B2/E1 → tap any record card → D1 (or D2/D3 depending on output format)
- D1 → tap tab "Formatted" / "Raw" → switch content view
- D1 → edit text → saving status appears in header ("Saving..." → "Saved")
- D1 → tap edit icon (✏️) → D4 Menu Popup
- D4 → tap "Rename" → D5 Rename Dialog
- D4 → tap "Convert" → D6 Convert Dialog
- D4 → tap "Delete" → confirm deletion → B1
- D5 → tap "Save" → D1 (title updated)
- D6 → select format from dropdown → tap "Convert" → D1/D2/D3 (converted)
- D6 → tap "Cancel" → D4
- D1 → back → previous screen (B1/E1)

---

## Section E — Patient Detail

| Screen | Name | Description |
|--------|------|-------------|
| E1 | Patient Records | Header (back, patient name), search bar, tab bar (SOAP Note / EHR / To Do), record list with date labels, bottom nav bar |
| E2 | Patient Info | Back arrow → E1, patient details: name, DOB, ID, phone, email, notes |

**Flow:**
- B1/B2/B7 → tap patient card → E1
- E1 → tap tab to filter records by type (SOAP Note, EHR Summary, To Do)
- E1 → tap record card → D1/D2/D3 (based on record type)
- E1 → tap patient info icon → E2
- E1 → tap FAB → C1 Recording (patient pre-filled in save dialog)
- E2 → back → E1

---

## Section F — To Do (Day View with Editor)

| Screen | Name | Description |
|--------|------|-------------|
| F1 | To Do Day View | Header (back, "To Do List"), day picker, editor toolbar, markdown-style task list grouped by patient with checkboxes |
| F2 | To Do Dropdown | F1 with date picker dropdown overlay (absolute positioned), semi-transparent backdrop |
| F3 | To Do Empty | Header + centered empty state: "All tasks completed!" message |

**Flow:**
- B6 / B3 sidebar → tap into day view → F1
- F1 → tap date in day bar → F2 (dropdown opens)
- F2 → select a date → F1 (content updates for that day)
- F2 → tap backdrop → F1 (dropdown closes)
- F1 → check all tasks → F3 (empty state)
- F1 → back → B1/B6

---

## Global Patterns

- **FAB (Floating Action Button):** Present on B1, B2, E1 — always opens C1 Recording
- **Bottom Bar:** Present on E1 with nav tabs
- **Sidebar (B3):** Accessible from hamburger icon on B1/B2 header
- **Theme / Language:** Toggle in B4 Settings; affects all screens via design tokens
- **Processing States:** After saving a recording (C4), the dashboard (B2b/B2c) and patient record list (E1) show processing badges ("Processing" / "In Progress") until complete ("Synced" / "Done")
