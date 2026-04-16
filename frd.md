# Functional Requirements Document (FRD)
**Project:** Plant Operations Meeting Monitor (POMM)  
**Repo:** https://github.com/Comfac-Global-Group/proj-monitoring  
**Version:** 0.3.0  
**Status:** OPEN  
**Created:** 260415-120000  
**Last Updated:** 260416-150000

---

## 1. Overview

A lightweight, portable, PWA-capable project monitoring tool that replaces the Google Sheets "OTHER MATTERS" workflow. Optimized for low-spec PCs, mobile phones, and offline use. Data lives in JSON/CSV files synced to Google Drive, Nextcloud, or Seafile.

---

## 2. Scope (MVP — this week)

> Anything beyond this section belongs in `roadmap.md`.

### 2.1 Tech Stack (for DeepSeek)

```
- Clone: https://github.com/Comfac-Global-Group/proj-monitoring
- Framework: Vanilla HTML/CSS/JS or lightweight React (no heavy UI libs)
- Storage: localStorage + JSON file export/import
- PWA: manifest.json + service worker (offline-first)
- Style: CSS variables for theme switching; NO heavy frameworks
- DeepSeek note: UI must be clean and functional. Reference a senior frontend dev's output, not AI defaults. Use the design tokens in the repo's existing CSS if present.
```

---

## 3. Authentication (MVP — Simple RBAC)

| Role | Permissions |
|------|-------------|
| **Editor** | Full CRUD on Projects, Actions, Notes, Due Dates |
| **Commenter** | Add/edit comments on Actions and Notes only |
| **Viewer** | Read-only, no edits |

- On first load → Login screen is shown (username + password, stored in config JSON).
- Low-stakes app: credentials stored in a local `config.json` or `settings.json`.
- No backend required for MVP. Auth state held in `sessionStorage`.
- Role assigned per user entry in config.

---

## 4. Data Model

### 4.1 Project (top-level item)

```json
{
  "id": "uuid",
  "title": "PROJECT NAME",
  "status": "open" | "closed",
  "details": "short description / details",
  "notes": "rich text / links / file refs",
  "project_due_date": "yymmdd",
  "actions": [ ...Action[] ],
  "notesComments": [ ...Comment[] ],
  "change_log": [ ...ChangeLogEntry[] ],
  "created_at": "yymmdd-hhmmss",
  "updated_at": "yymmdd-hhmmss"
}
```

### 4.2 Action (child of Project)

```json
{
  "id": "uuid",
  "text": "rich text action description",
  "due_date": "yymmdd",
  "owner": "Owner Name",
  "issue": "Cause of delay",
  "comments": [ ...Comment[] ],
  "created_at": "yymmdd-hhmmss",
  "updated_at": "yymmdd-hhmmss"
}
```

> **Date standard:** All dates stored in the app use `yymmdd` (2-digit year, month, day). The UI translates to/from `YYYY-MM-DD` when binding to HTML `<input type="date">`.

> **Action splitting:** When importing from the "OTHER MATTERS" spreadsheet, each `yymmdd - text` line in the `ACTION TO BE TAKEN` column becomes its own Action. The `yymmdd` prefix becomes the Action's `created_at` and `updated_at` timestamp.

### 4.3 Comment

```json
{
  "id": "uuid",
  "author": "username",
  "text": "comment body",
  "created_at": "yymmdd-hhmmss"
}
```

### 4.4 ChangeLogEntry

```json
{
  "user": "username",
  "datetime": "yymmdd-hhmmss",
  "field": "title",
  "old_value": "old",
  "new_value": "new"
}
```

### 4.5 Notes (on Project)

```json
{
  "text": "rich text, links",
  "attachments": [
    { "filename": "file.pdf", "url": "local-or-remote-url" }
  ],
  "comments": [ ...Comment[] ]
}
```

---

## 5. UI Layout

### 5.1 Top Header Bar

- **App name / Version** (top-left). Shows badge if newer version available.
- **Theme toggle** (Day/Night) — top-right.
- **Phone/Desktop mode toggle** — top-right.
- **Settings icon** — top-right.
- Header row can expand to accommodate icons on small screens.

### 5.2 Project List (main view)

Open projects appear in the main list. Closed projects are accumulated in a separate **"Closed Projects"** section at the bottom.

**Main list (Open projects):**

```
[ ▶ ] PROJECT TITLE          [OPEN/CLOSED toggle]    NOTES (collapsed)
      └─ ACTION TEXT          DUE DATE 📅  💬
      └─ ACTION TEXT          DUE DATE 📅  💬
      [ + Add Action ]
```

- **PROJECT** row: shows title, open/closed toggle, collapsed notes.
- **OPEN/CLOSED toggle**: clicking closes/grays out the project and moves it to the Closed Projects section.
- **Expand/Collapse**: clicking the project row expands to show actions.
- **[+ Add Action]** button: adds a new Action + Due Date row inside the project.

**Closed Projects section:**
- Appears below the main project list.
- Has a sticky header with the count of closed projects and a **collapse/expand** toggle.
- When collapsed, only the header is visible.
- When expanded, closed projects render using the same card styling (grayed out).
- The collapse state is persisted in `localStorage` under `settings.closedSectionCollapsed`.

### 5.3 Action Row

- **Rich text** editable field; wraps text; column width adjustable in header.
- **Expands** when selected/active; **compresses** when deselected.
- **Due Date**: inline calendar picker. Stored as `yymmdd`; displayed via `DD MMM YYYY`.
- **💬 Comment bubble**: opens comment thread for this action (Commenter role can comment).
- **Owner badge**: displays assignee inline.
- **Issue badge**: displays cause of delay inline.
- **Done actions**: individual actions can be marked done and collapsed. Long-running projects may accumulate 50+ actions; done actions should be collapsible to reduce clutter.

### 5.4 Action Timeline & Collapsing

- Each Action displays its `created_at` date as a small timestamp badge.
- Done actions (those with `status === 'done'` or manually collapsed by the user) can be hidden behind a **"Show done actions (N)"** toggle inside the project card.
- The toggle state is per-project and resets on reload (or can be persisted in `sessionStorage` if implemented).

### 5.5 Notes Field (Project-level)

- Same line as PROJECT header, collapsed by default.
- Expands when selected.
- Accepts: plain text, pasted links, file upload (local reference stored).
- Uploaded docs: download links rendered inline.
- **💬 Comment bubble**: Commenter-only comments on notes.

### 5.6 Settings Panel

- Import / Export all projects as `.json`
- Save As (custom filename)
- Save / Load project state
- Save named versions (snapshots) with timestamp label
- Version selector: choose which saved version to load
- Sync target config: Google Drive / Nextcloud / Seafile credentials
- User management (add/edit roles for Editor/Commenter/Viewer)
- Audit / Change Log per project (exportable as CSV)

---

## 6. Phone / Desktop Mode

- **Desktop**: multi-column table layout (PROJECT | ACTIONS | DUE DATE | NOTES)
- **Phone**: stacked card layout, one project per card, tap to expand
- Toggle in header switches instantly; preference saved to `localStorage`

---

## 7. Theme

- Day theme: light background, dark text
- Night theme: dark background, light text
- Uses CSS variables (`--bg`, `--text`, `--accent`, etc.)
- Preference saved to `localStorage`

---

## 8. Data Persistence & Sync

### 8.1 Local (MVP)

- All data saved to `localStorage` on every change.
- Export/Import as `.json` (single file for all projects).
- PWA: works offline.

### 8.2 Cloud Sync (MVP — manual, no auto-sync)

- **Google Drive**: user pastes OAuth token or uses Picker API to choose folder. Save/load JSON to that folder.
- **Nextcloud / Seafile**: WebDAV URL + credentials in settings. Save/load JSON via WebDAV PUT/GET.
- Mirror behavior: every save writes to `localStorage` AND pushes to configured cloud path.
- Users without cloud credentials can only load from local or a shared exported file.

> **DeepSeek note:** Implement Google Drive via `gapi` (Google API JS client). Implement Nextcloud/Seafile via WebDAV (`fetch` with Basic Auth). Keep both optional — app works fine with local-only.

---

## 9. Version Control (Snapshots)

- User can "Save Version" → stores named snapshot (`yymmdd-hhmmss` + optional label) in `localStorage` and synced storage.
- Version list in Settings: click to preview / restore.
- Pull from cloud: re-fetches latest JSON from configured cloud path.

---

## 10. Datetime Convention

All timestamps use format: `yymmdd-hhmmss`  
Example: `260415-143022` = April 15, 2026, 14:30:22

All calendar dates use format: `yymmdd`  
Example: `260528` = May 28, 2026

> The UI translates `yymmdd` to `YYYY-MM-DD` when binding to native HTML date inputs, and converts back on save.

---

## 11. Instructions for DeepSeek

```markdown
### Setup
1. Clone the repo:
   git clone https://github.com/Comfac-Global-Group/proj-monitoring
   cd proj-monitoring

2. The app is a static PWA (HTML/CSS/JS). No build step required for MVP.
   If using React, use Vite with minimal config.

3. Do NOT use heavy UI component libraries (no MUI, no Ant Design).
   Use plain CSS with CSS variables for theming.
   You may use Tailwind only if it's already in the repo.

4. Your UI weakness: avoid default browser-looking forms.
   Reference a clean project management tool style (Linear, Notion lite).
   Keep it dense and functional — this is used on low-spec PCs.

5. Follow the data model in Section 4 exactly.
   All data reads/writes go through a single `store.js` module.

6. All datetime values use format yymmdd-hhmmss; all calendar dates use yymmdd.

7. RBAC: check role before rendering edit controls.
   Viewer sees no edit buttons. Commenter sees only comment bubbles.
   Editor sees all controls.

8. Cloud sync (Google Drive / Nextcloud / Seafile) is optional feature.
   It must not break the app if not configured.

9. PWA: add manifest.json and a basic service worker that caches the app shell.

10. Closed Projects must render in a separate collapsible section at the bottom.
    Done actions inside a project must be collapsible.

11. Start with the Project list view. Get that right first before anything else.
```

---

## 12. Out of Scope for MVP

See `roadmap.md` for:
- Multi-user real-time collaboration
- Backend / database
- Advanced theming / branding
- Import directly from `.xlsx` (use `scripts/xlsx-to-json.py` instead)
