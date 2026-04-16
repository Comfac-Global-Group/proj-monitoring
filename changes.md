# Change Log — Project Monitoring Log (PML)

> All changes, commits, and version bumps are recorded here with datetime, agent, and status.  
> The **Current Version** is always the latest entry at the top.  
> The service worker cache name and the UI version badge should match this version.

---

## Current Version

**v0.3.6** — `260416-1859` — Agent: Kimi Code CLI — **DONE**

---

## Version History

### v0.3.6 | 260416-1859 | DONE
**Agent:** Kimi Code CLI  
**Changes:**
- Fixed overdue badge not appearing due to two bugs in `hasOverdueActions()`:
  - `getTodayYMD()` was returning `YYYY-MM-DD` instead of `yymmdd`, causing string comparison failure against `action.due_date`.
  - `hasOverdueActions()` checked `!action.done` while the codebase migrated to `action.status === 'open'`.
- Synced version badge and service-worker cache to v0.3.6.

**What you should see:**
- Version badge: `v0.3.6`
- Service worker cache: `pml-260416-1859`
- ~114 projects with open actions past their due date now correctly display the red "⚠️ Overdue" badge.

---

### v0.3.5 | 260416-1847 | DONE
**Agent:** deepseek-reasoner
**Changes:**
- QA: Added overdue alert badge to projects with open actions past due date.
- New `.overdue-badge` CSS style with danger color.
- Helper function `hasOverdueActions()` computes overdue status.

**What you should see:**
- Version badge: `v0.3.5`
- Service worker cache: `pml-260416-1847`
- Projects with open actions that have due dates in the past show a red "⚠️ Overdue" badge next to the title.
- Badge appears only when project is collapsed/expanded? Actually badge always visible in header.
- Overdue detection uses today's date (YYYY-MM-DD) vs action due_date.

---

### v0.3.4 | 260416-1830 | DONE
**Agent:** deepseek-reasoner
**Changes:**
- Default collapse state: All projects are collapsed by default.
- Default closed actions: All closed actions sections are collapsed by default.
- Added `initializeCollapseDefaults()` to set initial collapse states.
- Updated `renderProjects()` to apply defaults on first render.

**What you should see:**
- Version badge: `v0.3.4`
- Service worker cache: `pml-260416-1830`
- When you open the app, all project cards are collapsed (showing only headers).
- Closed actions sections within each project are collapsed by default.
- "Collapse All" button shows "Expand All" initially.
- Toggle individual projects/closed actions works as before.

---
### v0.3.3 | 260416-1715 | DONE
**Agent:** deepseek-reasoner
**Changes:**
- QA requirement: Changed action model from boolean `done` to status string `open`/`closed`.
- QA requirement: Added "Collapse/Expand All" button beside "Add Project" button (toggles project cards).
- QA requirement: Automatically close actions created prior to April 2026 (one‑time migration).
- Migration: Existing data with `done` field is automatically converted to `status` on load.
- Updated action modal checkbox label from "Done" to "Closed".
- Updated CSS class `.action-item.done` to `.action-item.closed`.
- Updated store.js `Action` typedef, `addAction()`, `updateAction()`, `_migrateData()`, `_closeActionsBeforeApril2026()`.

**What you should see:**
- Version badge: `v0.3.3`
- Service worker cache: `pml-260416-1715`
- Action modal checkbox labeled "Closed" (instead of "Done").
- New "Collapse All" / "Expand All" button next to "Add Project" that toggles all project cards.
- Actions created before April 2026 are automatically marked as closed (one‑time migration).
- All existing action features (due dates, owner, issue, comments, logs, edit, delete) work inside the closed section.

---

### v0.3.2 | 260416-1700 | DONE
**Agent:** deepseek-reasoner
**Changes:**
- PML v0.3.2 Feature 1: Collapsible Project Notes — Notes block inside each project is now collapsible with a Show/Hide toggle (collapsed by default).
- PML v0.3.2 Feature 2: Closed Actions Section — Done actions are now grouped into a dedicated "Closed Actions" sub‑header within each project, collapsible using the existing `collapsedDoneActions` state.
- Updated `renderActions()` to separate undone/done actions and render done actions in a dedicated section.
- Added CSS for `.closed-actions-section`, `.closed-actions-header`, `.closed-actions-list`.
- Added `collapsedNotes` Set and toggle‑notes handler.

**What you should see:**
- Version badge: `v0.3.2`
- Service worker cache: `pml-260416-1700`
- Project Notes have a "Notes" header with Show/Hide button (collapsed by default).
- Done actions appear under a "Closed Actions (N)" sub‑header inside each project, collapsible with a Show/Hide button.
- All existing action features (due dates, owner, issue, comments, logs, edit, delete) work inside the closed section.

---

### v0.3.1 | 260416-1532 | DONE
**Agent:** Kimi Code CLI
**Changes:**
- Q-031: XLSX action log splitting — each `yymmdd - ...` line in the `ACTION TO BE TAKEN` column now becomes its own Action object with `created_at = yymmdd-hhmmss`.
- Q-032: Closed Projects section — closed projects no longer gray out inline; they accumulate in a dedicated collapsible section at the bottom of the project list.
- Updated `scripts/xlsx-to-json.py` to split action lines and regenerated `other-matters-import.json`.
- Added `closedSectionCollapsed` setting persistence in `store.js`.
- Added CSS for closed-projects section and done-action toggles in `styles.css`.

**What you should see:**
- Version badge: `v0.3.1`
- Service worker cache: `pml-260416-1532`
- Imported legacy data shows individual Actions per weekly update line
- Closed projects render in a separate "Closed Projects" collapsible section below open projects

---

### v0.2.0 | 260416-0951 | DONE
**Agent:** Kimi Code CLI  
**Commit:** `05a14a8` — `Resolve remaining MVP blockers: Q-027, Q-003, Q-005, Q-008, Q-026`

**Changes:**
- Q-027: Added "Add User" UI in Settings → User Management (admin only).
- Q-003: Added `store.checkStorageSize()` and UI warning when localStorage exceeds 4 MB.
- Q-005: Implemented versioned service-worker cache (`pml-${APP_VERSION}`) and reload banner on updates.
- Q-008: Extended closed-project CSS gray-out for Day and Night themes.
- Q-026: Fixed license mismatch — aligned `package.json` and `README.md` with GPL-3.0.

**What you should see:**
- Version badge in header: `v0.2.0`
- Service worker cache: `pml-260416-0951`
- Settings panel shows an Add User form when logged in as `admin`.
- Closed projects are fully muted across both themes.

---

### v0.1.0 | 260415-120000 | DONE
**Agent:** DeepSeek / initial build  
**Commit:** Initial MVP

**Changes:**
- Basic project CRUD, action CRUD, comments (store layer), RBAC auth
- Theme toggle, phone/desktop layout toggle
- PWA manifest and service worker
- JSON import/export and version snapshots

**What you should see:**
- Login screen with default users: `admin` / `viewer` / `commenter`
- Project list with collapsible cards
- Settings panel with Export, Import, Version Snapshots, and User Management (delete only)

---

## Next Version

### v0.3.0 | 260416-1028 | DONE
**Agent:** Kimi Code CLI  
**Commit:** `Resolve Phase 2 + viable Phase 3 features`

**Changes:**
- R-001: XLSX migration script (`scripts/xlsx-to-json.py`) + generated `other-matters-import.json`
- R-002: Action log parsing (expandable timeline for `yymmdd - ` entries)
- R-003: Owner / assignee field on actions, displayed inline and filterable
- R-004: Search & filter with URL hash persistence (status, date range, owner)
- R-005: Sort controls (due date, status, updated, name; default open-first + soonest due)
- R-006: Auto-sync polling framework (Google Drive token / WebDAV) with status icon in header
- R-007: Conflict resolution on sync (last-write-wins with diff prompt)
- R-013: ISSUE / CAUSE OF DELAY field on actions
- R-008: Audit trail / change log per project, exportable as CSV
- Docs: JSON structure added to `README.md` and `repoanalysis.md`
- Admin: `changes.md` introduced for version tracking

**What you should see:**
- Version badge: `v0.3.0`
- Service worker cache: `pml-260416-1028`
- Search bar and sort dropdown above the project list
- Action modal includes Owner and Issue fields
- Cloud sync settings with status icon in header
- Expandable log timeline inside each action
- Import `other-matters-import.json` and see all legacy data with owners and issues populated

**Hotfix 1 (260416-1028):**
- Fixed `parseActionLog()` bug where `logPattern.match(line)` threw `TypeError` and blocked all action saves/edits. Now uses `line.match(logPattern)`.

**Hotfix 2 (260416-1029):**
- Fixed Settings panel being covered by the overlay (grayed out / unclickable). Raised `.settings-panel` z-index from 1000 to 1600 so it sits above `.overlay` (1500).

**Hotfix 3 (260416-1030):**
- Improved cloud sync error messaging for CORS issues.
- Added help text for Google Drive and WebDAV configuration.
- Closed Q-028 (app name) with documentation note.

---

## Versioning Rules

1. **Bump the version** in `index.html` (`#version-badge`) and `service-worker.js` (`APP_VERSION`) for every release.
2. **Prepend a new entry** to this file before committing.
3. **Use datetime stamp** `yymmdd-hhmmss` for build IDs.
4. **Status values:** `IN PROGRESS` | `DONE` | `DEFERRED` | `CANCELLED`
5. **Commit message** should reference the version and the key items changed.
