# Roadmap — Post-MVP Features
**Project:** Plant Operations Meeting Monitor (POMM)  
**Repo:** https://github.com/Comfac-Global-Group/proj-monitoring  
**Status:** OPEN  
**Created:** 260415-120000  
**Last Updated:** 260416-100000

---

> Items here are being built after MVP.  
> Each item has a datetime stamp and status: `PLANNED` | `IN PROGRESS` | `DONE` | `DEFERRED` | `CANCELLED` | `OUT OF SCOPE`

---

## Phase 2 — In Progress

### R-001 | 260415-120000 | DONE
**XLSX Migration Script**  
One-time Python script (`scripts/xlsx-to-json.py`) converts the `OTHER MATTERS` sheet into the app's JSON format.  
Fields mapped: `DONE → status`, `ITEMS/PROJ → title`, `DETAILS → details`, `OWNER → actions[].owner`, `ACTION TO BE TAKEN → actions[].text`, `ACTION DUE DATE → actions[].due_date`, `PROJ DUE DATE → project_due_date`, `ISSUE/CAUSE OF DELAY → actions[].issue`, `REMARKS/LINK → notes`.

---

### R-002 | 260415-120000 | IN PROGRESS
**Action Log Parsing**  
The action text field contains entries prefixed with `yymmdd - `. These are parsed into a structured `log_entries` array and rendered as an expandable timeline within each action.

---

### R-003 | 260415-120000 | IN PROGRESS
**Owner / Assignee Field**  
`owner` field on Actions, displayed inline. Filterable by owner.

---

### R-004 | 260415-120000 | IN PROGRESS
**Search & Filter**  
Text search across project titles and action text. Filter by status, due date range, and owner. Filter state persists in URL hash.

---

### R-005 | 260415-120000 | IN PROGRESS
**Sort Controls**  
Sort by due date, status, last updated, or project name. Default: open first, soonest due date.

---

### R-006 | 260415-120000 | IN PROGRESS
**Auto-Sync (Polling)**  
Periodic background sync to Google Drive (via pasted OAuth token) or Nextcloud/Seafile (via WebDAV). Configurable interval. Sync status icon in header.

---

### R-007 | 260415-120000 | IN PROGRESS
**Conflict Resolution**  
Detects timestamp conflicts on sync. Shows a diff/prompt; defaults to last-write-wins with a warning.

---

## Phase 3 — Viable Only

### R-008 | 260415-120000 | PLANNED
**Audit Trail / Change Log**  
Every edit appends a log entry: `{ user, datetime, field, old_value, new_value }`. Viewable in a "History" panel per project. Exportable as CSV. Treated as an audit/debug view.

---

### R-013 | 260415-120000 | PLANNED
**ISSUE / CAUSE OF DELAY Field**  
Maps the `ISSUE / CAUSE OF DELAY` spreadsheet column. Added as an optional field on Actions.

---

### R-009 | 260415-120000 | OUT OF SCOPE
Due Date Reminders / Badges — basic overdue/due-soon visual indicators already exist in the UI.

---

### R-010 | 260415-120000 | OUT OF SCOPE
Print / Export to PDF.

---

### R-011 | 260415-120000 | OUT OF SCOPE
Keyboard shortcuts and help overlay.

---

### R-012 | 260415-120000 | OUT OF SCOPE
Advanced File Attachments via cloud sync folder.

---

### R-014 | 260415-120000 | OUT OF SCOPE
Project-level due date (`project_due_date`) is stored in the data model for import compatibility but full UI treatment is out of scope.

---

## Phase 4 — Out of Scope

All Phase 4 items are **out of scope** to avoid bloating the app:

- **R-015** — Real-Time Collaboration backend
- **R-016** — ERP Integration (ERPNext)
- **R-017** — Mobile Native App (Capacitor)
- **R-018** — AI Summary of Action Logs
- **R-019** — Multi-Project Dashboard / Summary View
- **R-020** — Theming / Branding
