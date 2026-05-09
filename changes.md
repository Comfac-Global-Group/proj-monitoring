# Change Log — Project Monitoring Log (PML)

> All changes, commits, and version bumps are recorded here with datetime, agent, and status.  
> The **Current Version** is always the latest entry at the top.  
> The service worker cache name and the UI version badge should match this version.

---

## Field Testing Report | 260509 | RESOLVED in v0.4.0

**Date:** 2026-05-09  
**Reporter:** Justin Aquino  
**Device:** Phone (mobile browser / PWA installed)  
**Issues Found:**

1. **Browser console/DevTools overlaps Export and Save buttons** — When the browser developer console is open on a phone (e.g., for running `store.addUser()` as documented in qa.md), the console panel takes up the lower portion of the viewport. The Settings panel's Export and Save As buttons become inaccessible because the reduced viewport makes them scroll below the visible area or land behind the DevTools panel. The user cannot test export/download functionality while the console is open.

2. **Updated version (v0.3.9) not visible on phone** — The service worker is serving cached files from a previous version. The v0.3.9 mobile layout fixes are not rendering. The version badge does not show `v0.3.9`. The PWA standalone mode (no browser chrome) gives no easy way to force a reload.

3. **Settings panel and other views not opening** — The Settings panel and potentially other modal views are not rendering or not responding to button taps on the phone. If the service worker is serving an old `app.js` while `index.html` has been updated, event listeners may be mismatched (split-brain cache state).

**See:** Q-035, Q-036, Q-037 in `qa.md` for full RCA.

---

## Current Version

**v0.4.0** — `260509-0000` — Agent: Claude Code CLI — **DONE**

---

## Version History

### v0.4.0 | 260509-0000 | DONE
**Agent:** Claude Code CLI  
**Changes:**
- **Q-037 fix — CSS regression (critical):** The second `@media (max-width: 768px)` block in `styles.css` (line 1113) was overriding the v0.3.9 fix with `flex-direction: column` on `.project-header`, reverting the card header to full-viewport-height stacking. Changed to `flex-wrap: wrap` and updated `.project-title-wrapper` (uses `flex: 1 1 auto` instead of `width: 100%`) and `.project-status-toggle` (uses `margin-left: auto; flex-shrink: 0` so it aligns right in the same row) to match the v0.3.9 compact-header intent.
- **Q-035 fix — Settings panel safe-area padding:** Added `height: 100dvh` (dynamic viewport height, avoids browser toolbar overlap) and `padding-bottom: max(20px, env(safe-area-inset-bottom))` to `.settings-content` on mobile. Prevents Export/Save buttons from being hidden behind the system navigation bar or browser chrome.
- **Q-036 fix — Service worker auto-reload on update:** Added `controllerchange` listener in `app.js`. When the new SW activates and claims clients, the page auto-reloads — no "Reload" button tap required. Guard flag (`reloading`) prevents double-reload loops.
- **Q-036 fix — Update notification moved to bottom banner:** `showUpdateNotification()` now renders a full-width bottom banner (`position: fixed; bottom: 0`) with safe-area padding. Replaces the old `top: 20px; right: 20px` toast that was easy to miss on narrow phones. Deduplication guard (`id="update-banner"`) prevents multiple banners.

**What you should see:**
- Version badge: `v0.4.0`
- Service worker cache: `pml-260509-0000`
- Phone layout: project card header is compact (title + badges on one line, status toggle on the right), does NOT stack into a full-viewport-height column.
- Settings panel: fully scrollable on phone; bottom buttons not hidden behind navigation bar.
- When a new version is deployed, the page auto-reloads silently after the new SW installs. If for some reason the auto-reload doesn't fire, a bottom banner appears.

---

### v0.3.9 | 260422-1447 | DONE

### v0.3.9 | 260422-1447 | DONE
**Agent:** Kimi Code CLI  
**Changes:**
- **Mobile layout fixes (Q-034):**
  - Moved desktop grid from `.projects-list` to `.open-projects-list` and `.closed-projects-list`. This prevents open and closed project sections from appearing side-by-side as grid items.
  - Changed `.project-header` mobile behavior from `flex-direction: column` to `flex-wrap: wrap`. Title wrapper also wraps. This keeps the header compact instead of consuming the full viewport.
  - Added `border-bottom` to `.project-header` for visual separation from card body.
  - Removed `position: sticky; bottom: 0;` from `.closed-projects-header` to prevent overlap with project cards on mobile.

**What you should see:**
- Version badge: `v0.3.9`
- Service worker cache: `pml-260422-1447`
- Phone layout: single column project cards, compact card headers with a subtle border, no overlapping closed-projects bar.

---

## Version History

### v0.3.8 | 260422-1335 | DONE
**Agent:** Kimi Code CLI  
**Changes:**
- Per-action expand/collapse for closed (done) actions.
- Closed actions now render with a "▼ Collapse" / "▶ Expand" toggle on each action item.
- Collapsed closed actions show a compact view: action text, due date, and timestamp only.
- Expanded closed actions show full details: owner, issue, logs, comments, edit/delete controls.
- New `collapsedClosedActions` Set tracks per-action collapse state independently of the section-level Show/Hide toggle.
- New CSS class `.action-item.closed.collapsed` for compact styling.

**What you should see:**
- Version badge: `v0.3.8`
- Service worker cache: `pml-260422-1335`
- Open the "Closed Actions" section on any project with done actions.
- Each done action has a Collapse button; collapsed actions show an Expand button.
- Comments can still be opened from a collapsed closed action.

---

## Version History

### v0.3.7 | 260416-2029 | DONE
**Agent:** Kimi Code CLI  
**Changes:**
- Fixed broken collapse toggles for **Notes** and **Closed Projects** sections.
- Root cause: `handleClick()` read `data-action` directly from `event.target`, but clicks on inner `<button>` or `<h4>` elements missed the attribute.
- Fix: use `event.target.closest('[data-action]')` so nested clicks bubble correctly to the action wrapper.

**What you should see:**
- Version badge: `v0.3.7`
- Service worker cache: `pml-260416-2029`
- Clicking "Show / Hide" on Notes and Closed Projects now works reliably.

---

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
