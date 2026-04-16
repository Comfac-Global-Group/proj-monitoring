# Project Monitoring Log (PLM)

A lightweight, portable, PWA-capable project monitoring tool that replaces the Google Sheets "OTHER MATTERS" workflow. Optimized for low-spec PCs, mobile phones, and offline use.

## Features (MVP)

- **Role-Based Access Control (RBAC)**: Editor (full CRUD), Commenter (comments only), Viewer (read-only)
- **Project Management**: Create, read, update, delete projects with open/closed status
- **Action Tracking**: Add actions to projects with due dates and comments
- **Notes Field**: Rich text notes with file attachment support (planned)
- **Theme Support**: Day/Night theme toggle
- **Responsive Layout**: Phone/Desktop layout toggle
- **Offline-First**: PWA with service worker caching
- **Data Portability**: JSON import/export
- **Version Snapshots**: Save and restore project state versions
- **Local Storage**: All data stored in browser's localStorage

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/Comfac-Global-Group/proj-monitoring
   cd proj-monitoring
   ```

2. Serve the app (no build step required):
   ```bash
   npx live-server --port=8080
   ```
   > Note: ES6 modules require a server — opening `index.html` directly as a `file://` URL will fail with CORS errors.

3. Login with default credentials:
   - **Editor**: `admin` / `admin`
   - **Commenter**: `commenter` / `commenter`
   - **Viewer**: `viewer` / `viewer`

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - CSS with theme variables
- `app.js` - Main application logic
- `store.js` - Data store with localStorage persistence
- `manifest.json` - PWA manifest
- `service-worker.js` - Service worker for offline caching
- `frd.md` - Functional Requirements Document
- `roadmap.md` - Post-MVP feature roadmap
- `qa.md` - QA issues and backlog
- `repoanalysis.md` - AI-optimized codebase reference

## JSON Data Structure

The app stores all project data in localStorage and supports **Import**, **Export**, **Save Version**, and **Restore Version** via JSON.

### Top-level object
```json
{
  "projects": [Project]
}
```

### Project
```json
{
  "id": "uuid",
  "title": "Project Name",
  "status": "open",
  "details": "Description",
  "notes": "Rich text notes",
  "project_due_date": "YYYY-MM-DD",
  "actions": [Action],
  "notesComments": [Comment],
  "change_log": [ChangeLogEntry],
  "created_at": "yymmdd-hhmmss",
  "updated_at": "yymmdd-hhmmss"
}
```

### Action
```json
{
  "id": "uuid",
  "text": "Action description",
  "due_date": "YYYY-MM-DD",
  "owner": "Owner Name",
  "issue": "Cause of delay",
  "comments": [Comment],
  "log_entries": [
    { "date": "yymmdd", "text": "Log entry text" }
  ],
  "created_at": "yymmdd-hhmmss",
  "updated_at": "yymmdd-hhmmss"
}
```

### Comment
```json
{
  "id": "uuid",
  "author": "username",
  "text": "comment body",
  "created_at": "yymmdd-hhmmss"
}
```

### ChangeLogEntry
```json
{
  "user": "username",
  "datetime": "yymmdd-hhmmss",
  "field": "title",
  "old_value": "old",
  "new_value": "new"
}
```

### Import / Export / Save-As
- **Export** — Settings → Export All Data (`.json`)
- **Import** — Settings → Import Data (overwrites current localStorage)
- **Save Version** — Settings → Save Current Version (creates a named snapshot in localStorage)
- **Restore Version** — Settings → click Restore on any saved snapshot
- **XLSX Migration** — Use `scripts/xlsx-to-json.py` to convert the `OTHER MATTERS` spreadsheet sheet into the JSON format above, then import the resulting file.

### Version Snapshots
Snapshots are stored under the `pomm-versions` localStorage key. Each snapshot is a deep clone of the entire `projects` array at the time it was saved. You can keep up to 20 snapshots; older ones are automatically pruned.

## Deployment

The app is a static PWA. Deploy to any web server (Nginx, Apache, GitHub Pages, etc.).

**GitHub Pages (live):** ✅ Deployed automatically via GitHub Actions from the `main` branch root. Includes `.nojekyll` to disable Jekyll processing.
`https://comfac-global-group.github.io/proj-monitoring/`

**PWA Updates:** When the app is updated, existing PWA installations may still show the old app name ("POMM") until the user uninstalls and reinstalls the PWA. This is a browser caching limitation.

For self-hosted HTTPS (required for PWA installation):
- Use Let's Encrypt with Nginx Proxy Manager
- Serve from `bp.comfac-it.com` or similar domain

## Development

- Vanilla JavaScript (ES6 modules)
- No frameworks or build tools required
- Follow the FRD (`frd.md`) for requirements
- See `roadmap.md` for planned features

## License

See `LICENSE` file (GNU GPL v3).
