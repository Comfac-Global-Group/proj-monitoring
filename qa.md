# QA / Problems / Backlog
**Project:** Project Monitoring Log (PML)
**Repo:** https://github.com/Comfac-Global-Group/proj-monitoring
**Status:** OPEN
**Created:** 260415-120000
**Last Updated:** 260415-213300

---

## First-Use Guide: Account Creation & Login

### How Login Works
- App uses **browser localStorage** (not a server) — all user data is stored locally in the browser.
- On first load the app shows a login screen with Username and Password fields.
- Session is stored in `sessionStorage` — it clears when the browser tab/window is closed.

### Default Credentials (First-Time Use)
Three accounts are pre-loaded on first use:

| Username | Password | Role | What they can do |
|----------|----------|------|-----------------|
| `admin` | `admin` | editor | Full access: add/edit/delete projects and actions |
| `commenter` | `commenter` | commenter | View everything + add comments |
| `viewer` | `viewer` | viewer | Read-only |

> **Login with `admin` / `admin` to get started.**

### How to Add a New User (No UI Yet — Q-027)
There is currently no Add User button. New users must be added via the browser console:
1. Open the app in Chrome/Firefox
2. Press `F12` → go to **Console** tab
3. Run:
```javascript
store.addUser({ username: 'yourname', password: 'yourpassword', role: 'editor' });
```
Roles: `editor`, `commenter`, `viewer`

### How to Change a Password
Same method — use `store.updateUser()` in the console, or export the data JSON, edit the password field, and re-import.

### How to Delete a User
Settings (⚙️) → User Management → click Delete next to the user. The `admin` account cannot be deleted.

### Security Notes
- Passwords are stored in **plain text** in localStorage (MVP limitation — see Q-028).
- Anyone with access to the browser's DevTools can read all credentials.
- This is acceptable for internal use on a trusted PC. Do not deploy publicly without adding password hashing.

---

## How to Use This File

- Each issue has a datetime stamp `yymmdd-hhmmss` and a status: `OPEN` | `IN PROGRESS` | `CLOSED`
- Add new issues at the top of the relevant section.
- Close issues by changing status and adding a resolution note.

---

## P0 — Blockers (must fix before MVP ships)

| ID | datetime | Status | Issue | Notes |
|----|----------|--------|-------|-------|
| Q-025 | 260415-120000 | CLOSED | `manifest.json` `start_url: "/"` breaks PWA install on GitHub Pages subpath | **Fixed 260415**: changed to `/proj-monitoring/`, added `scope`, fixed shortcut URLs. |
| Q-027 | 260415-213300 | CLOSED | No UI to add new users — only way is browser console `store.addUser()` | **Fixed 260416**: Added Add User form in Settings → User Management, visible only to admin. |
| Q-028 | 260415-213300 | OPEN | App name still shown as "POMM" in browser tab on cached PWA installs | Renamed to PML in code — users who installed the PWA must uninstall and reinstall to pick up new name. |
| Q-001 | 260415-120000 | OPEN | DeepSeek tends to produce visually poor UIs by default | Must include explicit UI instructions in FRD. Reference a clean app (Linear, Notion lite). Do not accept default form styling. |
| Q-002 | 260415-120000 | OPEN | Google Drive OAuth in a static PWA requires careful CORS and token handling | Use `gapi` JS client. Test on actual low-spec PC. Token must be stored in `localStorage` securely. |
| Q-003 | 260415-120000 | CLOSED | localStorage has ~5MB limit — large project histories may overflow | **Fixed 260416**: Added `store.checkStorageSize()` and UI warning notification when usage exceeds 4MB. |
| Q-004 | 260415-120000 | OPEN | WebDAV (Nextcloud/Seafile) Basic Auth via browser fetch may be blocked by CORS on some servers | Must test against actual Nextcloud/Seafile instance. Document workaround (proxy or CORS headers on server). |
| Q-005 | 260415-120000 | CLOSED | PWA service worker caching stale app shell after updates | **Fixed 260416**: Cache name now includes `APP_VERSION`. Update banner includes a Reload button that triggers `SKIP_WAITING`. |
| Q-026 | 260415-120000 | CLOSED | License mismatch: `package.json` declares MIT but `LICENSE` file is GNU GPL v3 | **Fixed 260416**: `package.json` and `README.md` updated to GPL-3.0 to match `LICENSE`. |
| Q-029 | 260416-1028 | CLOSED | Cannot save new or edited actions in v0.3.0 | **Fixed 260416**: `parseActionLog()` used `logPattern.match(line)` instead of `line.match(logPattern)`, causing a TypeError on every action save. |

---

## P1 — High Priority Issues

| ID | datetime | Status | Issue | Notes |
|----|----------|--------|-------|-------|
| Q-006 | 260415-120000 | OPEN | Rich text editing in Action field: contenteditable vs textarea — which to use | contenteditable is richer but harder to sanitize. textarea with markdown-lite is safer for MVP. Decide before implementation. |
| Q-007 | 260415-120000 | OPEN | Date format mismatch: spreadsheet uses `yymmdd` prefix in notes text (e.g. `260415 - ...`) but due dates are `YYYY-MM-DD` | App must parse both. Display consistently as `DD MMM YYYY` in UI. Store as ISO internally. |
| Q-008 | 260415-120000 | CLOSED | OPEN/CLOSED toggle must gray out entire project row — CSS state needs to be reliable across themes | **Fixed 260416**: Added `.project-card.closed` styles for details, notes, actions, and due dates across both Day and Night themes. |
| Q-009 | 260415-120000 | OPEN | File attachments in Notes: local file upload stores base64 in JSON — large files will bloat the JSON | For MVP: store filename + file as base64 only if < 1MB. Warn user for larger files. Cloud sync path is the real solution (post-MVP). |
| Q-010 | 260415-120000 | OPEN | Action column width is user-adjustable — must persist per session | Save column widths to `localStorage` under `settings.columnWidths`. |
| Q-011 | 260415-120000 | OPEN | Phone mode vs Desktop mode: toggling mid-session must not lose unsaved edits | Autosave on every change (debounced 500ms). Toggle is purely a layout switch. |
| Q-012 | 260415-120000 | CLOSED | Version snapshot restore: no confirmation dialog — user may accidentally overwrite current state | **Implemented**: `confirm()` dialog exists in app.js. |

---

## P2 — Medium Priority / UX Issues

| ID | datetime | Status | Issue | Notes |
|----|----------|--------|-------|-------|
| Q-013 | 260415-120000 | OPEN | No visual indicator when cloud sync fails | Show a sync status icon (✓ synced / ⚠ sync failed / ↻ syncing) in the header. |
| Q-014 | 260415-120000 | OPEN | Commenter role: comment bubble on Notes field — it is not obvious that Notes comments are separate from Action comments | Use distinct styling: Notes comment bubble should be a different color or icon. |
| Q-015 | 260415-120000 | OPEN | Login screen: no "forgot password" or account recovery flow | Acceptable for MVP (low-stakes). Document that password reset = edit `config.json` directly. |
| Q-016 | 260415-120000 | OPEN | Calendar date picker: native `<input type="date">` is ugly on older browsers/PCs | Use native for MVP. If it breaks on target PCs, swap to a lightweight picker (e.g. Pikaday). |
| Q-017 | 260415-120000 | OPEN | Action text entries in the spreadsheet use `yymmdd - text` format (e.g. `260415 - for follow up`) — app should render these as a timeline/log, not a blob of text | Nice-to-have parse: detect `yymmdd - ` prefix and render as dated log entries. Post-MVP. |
| Q-018 | 260415-120000 | OPEN | No keyboard shortcuts (add action, save, close project) | Post-MVP. Document common shortcuts (Ctrl+S = save, Escape = deselect). |

---

## P3 — Low Priority / Backlog

| ID | datetime | Status | Issue | Notes |
|----|----------|--------|-------|-------|
| Q-019 | 260415-120000 | OPEN | No search or filter on projects | Post-MVP. Add text search bar filtering by PROJECT title or ACTION text. |
| Q-020 | 260415-120000 | OPEN | No sort order control (e.g. sort by due date, sort by status) | Post-MVP. Default sort: open first, then by soonest due date. |
| Q-021 | 260415-120000 | OPEN | No print / export to PDF view | Post-MVP. |
| Q-022 | 260415-120000 | OPEN | Import from existing `.xlsx` (OTHER MATTERS sheet) | Post-MVP. Write a one-time migration script (Python or Node) to convert XLSX to app JSON format. |
| Q-023 | 260415-120000 | OPEN | No audit trail of who changed what | Post-MVP. Each save could append a `change_log[]` entry with user + datetime + field. |
| Q-024 | 260415-120000 | OPEN | Multi-device conflict resolution when two users edit and sync JSON to the same cloud path | Post-MVP. For now: last-write-wins. Document this clearly. |

---

## Closed Issues

| ID | datetime | Resolved | Issue | Resolution |
|----|----------|----------|-------|------------|
| Q-025 | 260415-120000 | 260415 | `manifest.json` `start_url: "/"` breaks PWA on GitHub Pages | Fixed: `/proj-monitoring/`, `scope`, shortcut URLs updated |
| Q-012 | 260415-120000 | 260415 | Version restore confirm dialog missing | Implemented via `confirm()` in app.js |

---

## Known Constraints (from source data)

- Source: `PLANT_OPERATIONS_MEETING_NEW__2024__2026.xlsx`, sheet `OTHER MATTERS`
- Columns mapped: `DONE` (open/closed), `ITEMS/PROJ` (project title), `DETAILS` (description), `ACTION TO BE TAKEN` (action text with embedded yymmdd log), `ACTION DUE DATE` (due date), `REMARKS` (notes), `LINK` (notes links)
- The "action" field in the spreadsheet is a cumulative log (one cell = many dated entries). The app treats this as rich text for MVP, not parsed entries.
- `OWNER` column exists in source data — not in MVP scope. Add to roadmap.
