# Repo Analysis — proj-monitoring (POMM)
<!-- AI-optimized reference. Dense, structured, machine-readable. -->

## Identity

| Field | Value |
|---|---|
| App name | Plant Operations Meeting Monitor (POMM) |
| Purpose | Replace Google Sheets "OTHER MATTERS" workflow for plant operations meetings |
| Stack | Vanilla HTML5 + ES6 modules + plain CSS — no framework, no build tool |
| Persistence | localStorage (`pomm-data`, `pomm-config`, `pomm-versions`) |
| PWA | manifest.json + service-worker.js (cache-first, offline-first) |
| Remote | `https://github.com/Comfac-Global-Group/proj-monitoring` |
| Pages URL | `https://comfac-global-group.github.io/proj-monitoring/` |
| License | Mismatch: package.json says MIT, LICENSE file is GNU GPL v3 |

## File Map

| Path | Role | Lines |
|---|---|---|
| `index.html` | DOM structure — login, project list, settings panel, modals | 154 |
| `app.js` | UI rendering, event handling, auth, theme/layout, import/export | 725 |
| `store.js` | Data model, CRUD, RBAC, versioning, localStorage persistence | 609 |
| `styles.css` | CSS variables (light/dark), layout modes, component styles | 611 |
| `manifest.json` | PWA manifest — name, icons, start_url, shortcuts | 30 |
| `service-worker.js` | Cache-first app shell caching, offline support | 80 |
| `test-store.js` | Manual unit tests for store (not wired to `npm test`) | 176 |
| `package.json` | live-server dev server, `type: "module"`, no prod deps | 21 |
| `README.md` | Setup, default creds, project structure, data model example | 88 |
| `frd.md` | Functional requirements, data model, RBAC, FRD instructions | 255 |
| `qa.md` | 24 open issues (P0–P3), known constraints, source data mapping | 82 |
| `roadmap.md` | Post-MVP features | 139 |

## Architecture

```
index.html  →  app.js (UI layer)
                  ↕
               store.js (data layer)
                  ↕
            localStorage
            pomm-data     → { projects: Project[] }
            pomm-config   → { users: User[], settings: {} }
            pomm-versions → VersionSnapshot[]
```

No backend. No network calls except optional cloud sync (unimplemented). Session stored in `sessionStorage` (key: `pomm-session` — user + role).

## Data Model

```javascript
Project {
  id:         string,          // generateId() — random, not crypto
  title:      string,
  status:     "open" | "closed",
  details:    string,
  notes:      string,
  actions:    Action[],
  notesComments: Comment[],    // separate from action comments
  created_at: string,          // "yymmdd-hhmmss"
  updated_at: string
}

Action {
  id:         string,
  text:       string,          // cumulative log entries (yymmdd prefix convention)
  due_date:   string,          // "YYYY-MM-DD" (format mismatch with timestamps — Q-007)
  comments:   Comment[],
  created_at: string,
  updated_at: string
}

Comment {
  id:         string,
  author:     string,
  text:       string,
  created_at: string
}

User {
  username:   string,
  password:   string,          // plain text — MVP only (security risk)
  role:       "editor" | "commenter" | "viewer"
}

VersionSnapshot {
  id:         string,
  label:      string,
  timestamp:  string,
  data:       deep clone of pomm-data
}
// Max 20 versions kept
```

## Default Users (store.js lines 173–178)

| Username | Password | Role |
|---|---|---|
| admin | admin | editor |
| viewer | viewer | viewer |
| commenter | commenter | commenter |

## RBAC Matrix (store.hasPermission)

| Role | view | comment | edit |
|---|---|---|---|
| editor | ✓ | ✓ | ✓ |
| commenter | ✓ | ✓ | — |
| viewer | ✓ | — | — |

RBAC enforced at UI level only (DOM show/hide). No server-side enforcement (no server).

## App Init Sequence (app.js)

```
DOMContentLoaded
  initTheme()       — load from settings or matchMedia, set data-theme on <html>
  initLayout()      — phone vs desktop, set body class
  initAuth()        — check sessionStorage → show login or render app
    if authenticated:
      renderProjects()
      renderVersions()
      renderUsers()
  service worker registration (lines 50–69)
```

## Rendering Pattern (app.js renderProjects, lines 192–270)

Pure innerHTML re-render — no virtual DOM, no diffing. Full rerender on every data change. XSS-safe via `escapeHtml()` on all user-supplied text.

Template pattern:
```javascript
const html = store.getProjects().map(p => `
  <div class="project-card ${p.status}">
    ...${escapeHtml(p.title)}...
    <div class="actions-list">${renderActions(p)}</div>
  </div>
`).join('');
projectsList.innerHTML = html;
```

## Event Routing (app.js lines 529–598)

Single delegated `handleClick(e)` on `document`. Routes via `data-action` attribute:

| data-action | Handler |
|---|---|
| `add-project` | `openProjectModal(null)` |
| `edit-project` | `openProjectModal(id)` |
| `delete-project` | `store.deleteProject(id)` + re-render |
| `toggle-project` | **no-op** (expand/collapse unimplemented) |
| `add-action` | `openActionModal(projectId, null)` |
| `edit-action` | `openActionModal(projectId, actionId)` |
| `delete-action` | `store.deleteAction(projectId, actionId)` + re-render |
| `save-version` | `store.saveVersion(label)` + re-render |
| `restore-version` | confirm() → `store.restoreVersion(id)` + re-render |
| `delete-version` | `store.deleteVersion(id)` + re-render |
| `delete-user` | `store.deleteUser(username)` + re-render |
| `add-notes-comment` | **stub** → alert('coming soon') |
| `view-comments` | **stub** → alert('coming soon') |

## localStorage Keys

| Key | Contents | Size concern |
|---|---|---|
| `pomm-data` | `{ projects: Project[] }` | Main data — can grow large |
| `pomm-config` | `{ users: User[], settings: {} }` | Small |
| `pomm-versions` | `VersionSnapshot[]` (max 20) | Can be large (20 deep clones of pomm-data) |

No quota monitoring. Q-003 is open.

## Service Worker (service-worker.js)

```
CACHE_NAME = 'pomm-v1'   ← hardcoded, no version hash
Strategy: cache-first
Cached: ./, ./index.html, ./styles.css, ./app.js, ./store.js, ./manifest.json, ./service-worker.js
Install: self.skipWaiting()
Activate: deletes caches !== CACHE_NAME
Fetch: cache hit → return; miss → network fetch + cache store
```

Cache busting not implemented (Q-005). Stale cache will serve old app after updates.

## PWA Manifest Issues

```json
"start_url": "/"           // WRONG for GitHub Pages subpath
"shortcuts[].url": "/?new=true"   // WRONG — resolves to root domain
```

**GitHub Pages subpath:** `https://comfac-global-group.github.io/proj-monitoring/`

Required fixes:
```json
"start_url": "/proj-monitoring/"
"scope": "/proj-monitoring/"
"shortcuts[0].url": "/proj-monitoring/?new=true"
"shortcuts[1].url": "/proj-monitoring/?filter=open"
```

## Incomplete / Stubbed Features

| Feature | Status | Location |
|---|---|---|
| Comment UI (actions + notes) | Stubbed — `alert('coming soon')` | app.js:579–581 |
| Project expand/collapse toggle | No-op | app.js:560–561 |
| Cloud sync (Google Drive, Nextcloud, Seafile) | UI exists, zero implementation | app.js, store.js |
| Add new user (UI) | No form — can only delete users | app.js renderUsers() |
| File attachments on notes | No UI, no storage logic | — |
| localStorage quota warning (>4MB) | Not implemented | Q-003 |
| Service worker version/cache bust | Not implemented | Q-005 |
| Action text as dated log timeline | Plain textarea only | Q-017 |
| Search / filter | Not implemented | Q-019 |
| Sort controls | Not implemented | Q-020 |

## Known Bugs / Issues

| ID | Summary | Priority |
|---|---|---|
| Q-001 | UI quality guidance for AI code generation | P0 |
| Q-002 | Google Drive OAuth CORS handling | P0 |
| Q-003 | localStorage 5MB overflow — no warning | P0 |
| Q-004 | WebDAV CORS blocked | P0 |
| Q-005 | Stale service worker cache after updates | P0 |
| Q-007 | Date format mismatch: `yymmdd` vs `YYYY-MM-DD` | P1 |
| Q-008 | Open/closed gray-out must work in both themes | P1 |
| Q-009 | File attachment base64 bloat | P1 |
| Q-012 | Version restore confirm dialog (actually implemented — can close) | P1 |
| — | manifest.json start_url breaks GitHub Pages | **NEW / BLOCKER** |
| — | License mismatch (MIT vs GPL v3) | Admin |

## MVP Completion Estimate

| Area | Done | Missing |
|---|---|---|
| Project CRUD | ✓ | Sort, filter |
| Action CRUD | ✓ | Date log parsing |
| Auth + RBAC | ✓ | Password hashing |
| Theme + layout | ✓ | — |
| Offline / PWA | ✓ | Cache busting |
| Version snapshots | ✓ | — |
| Comments | store methods only | UI (modal, display) |
| Cloud sync | UI only | Full implementation |
| User management | View + delete | Add user form |
| Import / Export | ✓ | Validation |

Overall: ~70% complete. Core CRUD and PWA shell work. Comments, cloud sync, search, and filter are missing.
