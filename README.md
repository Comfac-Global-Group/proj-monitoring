# Plant Operations Meeting Monitor (POMM)

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

## Data Model

Projects contain actions, which can have comments. All timestamps use `yymmdd-hhmmss` format.

```json
{
  "id": "uuid",
  "title": "Project Name",
  "status": "open",
  "details": "Description",
  "notes": "Rich text notes",
  "actions": [
    {
      "id": "uuid",
      "text": "Action description",
      "due_date": "YYYY-MM-DD",
      "comments": []
    }
  ]
}
```

## Deployment

The app is a static PWA. Deploy to any web server (Nginx, Apache, GitHub Pages, etc.).

**GitHub Pages (active):** Deployed automatically from the `main` branch root. Includes `.nojekyll` to disable Jekyll processing.
`https://comfac-global-group.github.io/proj-monitoring/`

For self-hosted HTTPS (required for PWA installation):
- Use Let's Encrypt with Nginx Proxy Manager
- Serve from `bp.comfac-it.com` or similar domain

## Development

- Vanilla JavaScript (ES6 modules)
- No frameworks or build tools required
- Follow the FRD (`frd.md`) for requirements
- See `roadmap.md` for planned features

## License

See `LICENSE` file. Note: `package.json` currently declares MIT but the `LICENSE` file contains GNU GPL v3 — this mismatch needs to be resolved (tracked as Q-026).