# Change Log — Project Monitoring Log (PML)

> All changes, commits, and version bumps are recorded here with datetime, agent, and status.  
> The **Current Version** is always the latest entry at the top.  
> The service worker cache name and the UI version badge should match this version.

---

## Current Version

**v0.3.0-hotfix3** — `260416-1030` — Agent: Kimi Code CLI — **DONE**

---

## Version History

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
