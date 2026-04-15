# Roadmap — Post-MVP Features
**Project:** Plant Operations Meeting Monitor (POMM)
**Repo:** https://github.com/Comfac-Global-Group/proj-monitoring
**Status:** OPEN
**Created:** 260415-120000
**Last Updated:** 260415-120000

---

> Everything in this file is **out of scope for the current sprint**.
> Items here should not be built until MVP (see `frd.md`) is shipped and validated.
> Each item has a datetime stamp and status: `PLANNED` | `IN PROGRESS` | `DEFERRED` | `CANCELLED`

---

## Phase 2 — Post-MVP (next 2–4 weeks)

### R-001 | 260415-120000 | PLANNED
**XLSX Migration Script**
Write a one-time Python or Node.js script to convert `OTHER MATTERS` sheet from `PLANT_OPERATIONS_MEETING_NEW__2024__2026.xlsx` into the app's JSON format. Fields to map: `DONE → status`, `ITEMS/PROJ → title`, `DETAILS → description`, `ACTION TO BE TAKEN → actions[].text`, `ACTION DUE DATE → actions[].due_date`, `REMARKS/LINK → notes`.

---

### R-002 | 260415-120000 | PLANNED
**Action Log Parsing**
The action text field contains entries prefixed with `yymmdd - ` (e.g. `260415 - for follow up`). Parse these into a structured timeline/log view within each action. Render as dated entries, expandable/collapsible. Preserves the weekly-update-log style of the original spreadsheet.

---

### R-003 | 260415-120000 | PLANNED
**Owner / Assignee Field**
Add `owner` field to Actions (maps to `OWNER (OF ACTION IN THE PLANT)` column in source spreadsheet). Displayed inline with the action. Filter by owner.

---

### R-004 | 260415-120000 | PLANNED
**Search & Filter**
Text search across all project titles and action text. Filter by: status (open/closed), due date range, owner. Filter state persists in URL hash for shareability.

---

### R-005 | 260415-120000 | PLANNED
**Sort Controls**
User-configurable sort: by due date (soonest first), by status (open first), by last updated, by project name alphabetically. Default: open first, soonest due date.

---

### R-006 | 260415-120000 | PLANNED
**Auto-Sync (Polling)**
Periodic background sync to configured cloud path (Google Drive / Nextcloud / Seafile). Configurable interval (e.g. every 5 min). Show sync status in header. Detect if remote file is newer and prompt user to pull.

---

### R-007 | 260415-120000 | PLANNED
**Conflict Resolution**
When two users sync to the same cloud file: detect timestamp conflict, show diff, let user choose which version to keep or merge. For now: last-write-wins with a warning.

---

## Phase 3 — Medium Term

### R-008 | 260415-120000 | PLANNED
**Audit Trail / Change Log**
Every edit appends a log entry: `{ user, datetime, field, old_value, new_value }`. Viewable in a "History" panel per project. Exportable as CSV.

---

### R-009 | 260415-120000 | PLANNED
**Due Date Reminders / Badges**
Visual indicators: red badge on overdue actions, yellow on due within 3 days. No push notifications for MVP — just visual states in the UI.

---

### R-010 | 260415-120000 | PLANNED
**Print / Export to PDF**
Clean print stylesheet or PDF export of all open projects and their actions. Suitable for meeting handouts.

---

### R-011 | 260415-120000 | PLANNED
**Keyboard Shortcuts**
`Ctrl+S` = save/sync, `Ctrl+N` = new project, `Escape` = deselect/collapse, `Tab` = move to next action field. Document in a help overlay (`?` key).

---

### R-012 | 260415-120000 | PLANNED
**Advanced File Attachments**
For Notes field: support attaching files > 1MB by storing them directly in the cloud sync folder (Google Drive / Nextcloud / Seafile) and saving only the URL reference in the JSON. Preview images inline.

---

### R-013 | 260415-120000 | PLANNED
**ISSUE / CAUSE OF DELAY Field**
Map `ISSUE / CAUSE OF DELAY` column from source spreadsheet. Add as optional field on Actions. Used to tag recurring delay types (e.g. "waiting for quotation", "pending approval").

---

### R-014 | 260415-120000 | PLANNED
**PROJ DUE DATE (Project-level deadline)**
Separate from Action due dates. Shown on the project header row. Visual indicator when project is overdue.

---

## Phase 4 — Long Term / Research

### R-015 | 260415-120000 | PLANNED
**Real-Time Collaboration**
Move to a backend (lightweight: PocketBase, Supabase, or self-hosted Firebase alternative) for real-time multi-user editing. Out of scope until cloud sync is validated and team adoption is confirmed.

---

### R-016 | 260415-120000 | PLANNED
**ERP Integration (ERPNext)**
Read-only links from Actions to ERPNext tasks/PRs/POs (the team already references ERPNext URLs in notes). Render as clickable chips. Optionally fetch status from ERPNext API.

---

### R-017 | 260415-120000 | PLANNED
**Mobile Native App (Capacitor)**
Wrap the PWA in Capacitor for Android/iOS distribution. Adds: native file picker for attachments, push notifications for due dates, biometric login.

---

### R-018 | 260415-120000 | DEFERRED
**AI Summary of Action Logs**
Use an LLM API to auto-summarize the cumulative action text (the `yymmdd - ...` log entries) into a one-line project status. Useful for meeting prep. Deferred: requires API key management and adds complexity.

---

### R-019 | 260415-120000 | PLANNED
**Multi-Project Dashboard / Summary View**
High-level view: count of open projects, actions overdue, actions due this week, by owner. Replaces the need to scroll through all projects to get a status snapshot.

---

### R-020 | 260415-120000 | PLANNED
**Theming / Branding**
Custom accent color per organization. Logo in header. Suitable for deploying multiple instances (Cabuyao Plant, Mandaluyong, Makati) with distinct branding.
