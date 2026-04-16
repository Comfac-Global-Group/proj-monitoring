// Project Monitoring Log (PML) - Data Store
// All data reads/writes go through this module

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------

/**
 * Generate a UUID (simple version)
 */
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get current timestamp in yymmdd-hhmmss format
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Convert ISO date to yymmdd-hhmmss
 */
function isoToTimestamp(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Convert yymmdd-hhmmss to ISO string
 */
function timestampToIso(timestamp) {
    const [datePart, timePart] = timestamp.split('-');
    const year = '20' + datePart.slice(0, 2);
    const month = datePart.slice(2, 4);
    const day = datePart.slice(4, 6);
    const hours = timePart.slice(0, 2);
    const minutes = timePart.slice(2, 4);
    const seconds = timePart.slice(4, 6);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Format date for display: DD MMM YYYY
 */
function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

/**
 * Parse yymmdd-prefixed log entries from action text
 * @param {string} text
 * @returns {{date: string, text: string}[]}
 */
function parseActionLog(text) {
    if (!text) return [];
    const entries = [];
    const logPattern = /^(\d{6})\s*[-–]?\s*(.*)$/;
    text.split('\n').forEach(line => {
        line = line.trim();
        if (!line) return;
        const m = line.match(logPattern);
        if (m) {
            entries.push({ date: m[1], text: m[2].trim() });
        }
    });
    return entries;
}

// ------------------------------------------------------------
// Data Model (as per FRD Section 4)
// ------------------------------------------------------------

/**
 * Project (top-level item)
 * @typedef {Object} Project
 * @property {string} id - uuid
 * @property {string} title - PROJECT NAME
 * @property {'open'|'closed'} status - open or closed
 * @property {string} details - short description / details
 * @property {string} notes - rich text / links / file refs
 * @property {Action[]} actions - array of Action objects
 * @property {Comment[]} notesComments
 * @property {ChangeLogEntry[]} change_log
 * @property {string} project_due_date - YYYY-MM-DD
 * @property {string} created_at - yymmdd-hhmmss
 * @property {string} updated_at - yymmdd-hhmmss
 */

/**
 * Action (child of Project)
 * @typedef {Object} Action
 * @property {string} id - uuid
 * @property {string} text - rich text action description
 * @property {string} due_date - YYYY-MM-DD
 * @property {string} owner - assignee name
 * @property {string} issue - cause of delay
 * @property {Comment[]} comments - array of Comment objects
 * @property {{date: string, text: string}[]} log_entries - parsed from text
 * @property {string} created_at - yymmdd-hhmmss
 * @property {string} updated_at - yymmdd-hhmmss
 */

/**
 * Comment
 * @typedef {Object} Comment
 * @property {string} id - uuid
 * @property {string} author - username
 * @property {string} text - comment body
 * @property {string} created_at - yymmdd-hhmmss
 */

/**
 * Notes (on Project)
 * @typedef {Object} Notes
 * @property {string} text - rich text, links
 * @property {Array<{filename: string, url: string}>} attachments
 * @property {Comment[]} comments
 */

/**
 * User configuration
 * @typedef {Object} User
 * @property {string} username
 * @property {string} password (hashed or plain for MVP)
 * @property {'editor'|'commenter'|'viewer'} role
 */

// ------------------------------------------------------------
// Store Implementation
// ------------------------------------------------------------

const STORAGE_KEY = 'pomm-data';
const CONFIG_KEY = 'pomm-config';
const VERSIONS_KEY = 'pomm-versions';

class Store {
    constructor() {
        this._loadData();
        this._loadConfig();
        this._loadVersions();
    }

    // --------------------------------------------------------
    // Data persistence
    // --------------------------------------------------------

    _loadData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                this.data = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse stored data, initializing empty');
                this.data = { projects: [] };
            }
        } else {
            this.data = { projects: [] };
        }
    }

    _saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    _loadConfig() {
        const config = localStorage.getItem(CONFIG_KEY);
        if (config) {
            try {
                this.config = JSON.parse(config);
            } catch (e) {
                console.error('Failed to parse config, loading default');
                this._loadDefaultConfig();
            }
        } else {
            this._loadDefaultConfig();
        }
    }

    _loadDefaultConfig() {
        // Default config with an admin user
        this.config = {
            users: [
                {
                    username: 'admin',
                    password: 'admin', // Plain text for MVP
                    role: 'editor'
                },
                {
                    username: 'viewer',
                    password: 'viewer',
                    role: 'viewer'
                },
                {
                    username: 'commenter',
                    password: 'commenter',
                    role: 'commenter'
                }
            ],
            settings: {
                theme: 'light',
                layout: 'desktop',
                cloudProvider: 'none',
                cloudConfig: {}
            }
        };
        this._saveConfig();
    }

    _saveConfig() {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    }

    _loadVersions() {
        const versions = localStorage.getItem(VERSIONS_KEY);
        this.versions = versions ? JSON.parse(versions) : [];
    }

    _saveVersions() {
        localStorage.setItem(VERSIONS_KEY, JSON.stringify(this.versions));
    }

    // --------------------------------------------------------
    // Project CRUD
    // --------------------------------------------------------

    /**
     * Get all projects
     * @returns {Project[]}
     */
    getProjects() {
        return this.data.projects || [];
    }

    /**
     * Get project by ID
     * @param {string} projectId
     * @returns {Project|null}
     */
    getProject(projectId) {
        return this.data.projects.find(p => p.id === projectId) || null;
    }

    /**
     * Create a new project
     * @param {Object} projectData
     * @param {string} projectData.title
     * @param {string} projectData.details
     * @param {string} projectData.notes
     * @returns {Project}
     */
    createProject(projectData) {
        const timestamp = getTimestamp();
        const project = {
            id: generateId(),
            title: projectData.title || 'Untitled Project',
            status: 'open',
            details: projectData.details || '',
            notes: projectData.notes || '',
            project_due_date: projectData.project_due_date || '',
            actions: [],
            notesComments: [],
            change_log: [],
            created_at: timestamp,
            updated_at: timestamp
        };
        this.data.projects.push(project);
        this._saveData();
        return project;
    }

    /**
     * Update project
     * @param {string} projectId
     * @param {Object} updates
     */
    updateProject(projectId, updates, user = 'system') {
        const project = this.getProject(projectId);
        if (!project) return null;

        const timestamp = getTimestamp();
        // Append change log for tracked fields
        ['title', 'status', 'details', 'notes', 'project_due_date'].forEach(field => {
            if (updates.hasOwnProperty(field) && project[field] !== updates[field]) {
                this._appendChangeLog(project, user, field, project[field], updates[field], timestamp);
            }
        });

        Object.assign(project, updates, {
            updated_at: timestamp
        });
        this._saveData();
        return project;
    }

    _appendChangeLog(project, user, field, oldValue, newValue, timestamp) {
        if (!project.change_log) project.change_log = [];
        project.change_log.push({
            user,
            datetime: timestamp,
            field,
            old_value: String(oldValue ?? ''),
            new_value: String(newValue ?? '')
        });
    }

    getChangeLog(projectId) {
        const project = this.getProject(projectId);
        return project?.change_log || [];
    }

    /**
     * Delete project
     * @param {string} projectId
     */
    deleteProject(projectId) {
        const index = this.data.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            this.data.projects.splice(index, 1);
            this._saveData();
            return true;
        }
        return false;
    }

    /**
     * Toggle project status (open/closed)
     * @param {string} projectId
     */
    toggleProjectStatus(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;

        project.status = project.status === 'open' ? 'closed' : 'open';
        project.updated_at = getTimestamp();
        this._saveData();
        return project;
    }

    // --------------------------------------------------------
    // Action CRUD
    // --------------------------------------------------------

    /**
     * Add action to project
     * @param {string} projectId
     * @param {Object} actionData
     * @param {string} actionData.text
     * @param {string} actionData.due_date
     * @returns {Action|null}
     */
    addAction(projectId, actionData) {
        const project = this.getProject(projectId);
        if (!project) return null;

        const timestamp = getTimestamp();
        const text = actionData.text || '';
        const action = {
            id: generateId(),
            text,
            due_date: actionData.due_date || '',
            owner: actionData.owner || '',
            issue: actionData.issue || '',
            comments: [],
            log_entries: parseActionLog(text),
            created_at: timestamp,
            updated_at: timestamp
        };
        project.actions.push(action);
        project.updated_at = timestamp;
        this._saveData();
        return action;
    }

    /**
     * Update action
     * @param {string} projectId
     * @param {string} actionId
     * @param {Object} updates
     */
    updateAction(projectId, actionId, updates, user = 'system') {
        const project = this.getProject(projectId);
        if (!project) return null;

        const action = project.actions.find(a => a.id === actionId);
        if (!action) return null;

        const timestamp = getTimestamp();
        if (updates.hasOwnProperty('text') && action.text !== updates.text) {
            updates.log_entries = parseActionLog(updates.text);
        }
        ['text', 'due_date', 'owner', 'issue'].forEach(field => {
            if (updates.hasOwnProperty(field) && action[field] !== updates[field]) {
                this._appendChangeLog(project, user, `action.${field}`, action[field], updates[field], timestamp);
            }
        });

        Object.assign(action, updates, {
            updated_at: timestamp
        });
        project.updated_at = timestamp;
        this._saveData();
        return action;
    }

    /**
     * Delete action
     * @param {string} projectId
     * @param {string} actionId
     */
    deleteAction(projectId, actionId) {
        const project = this.getProject(projectId);
        if (!project) return false;

        const index = project.actions.findIndex(a => a.id === actionId);
        if (index !== -1) {
            project.actions.splice(index, 1);
            project.updated_at = getTimestamp();
            this._saveData();
            return true;
        }
        return false;
    }

    // --------------------------------------------------------
    // Comment CRUD
    // --------------------------------------------------------

    /**
     * Add comment to action
     * @param {string} projectId
     * @param {string} actionId
     * @param {string} author
     * @param {string} text
     * @returns {Comment|null}
     */
    addActionComment(projectId, actionId, author, text) {
        const project = this.getProject(projectId);
        if (!project) return null;

        const action = project.actions.find(a => a.id === actionId);
        if (!action) return null;

        const comment = {
            id: generateId(),
            author,
            text,
            created_at: getTimestamp()
        };
        action.comments.push(comment);
        action.updated_at = getTimestamp();
        project.updated_at = getTimestamp();
        this._saveData();
        return comment;
    }

    /**
     * Add comment to project notes
     * @param {string} projectId
     * @param {string} author
     * @param {string} text
     * @returns {Comment|null}
     */
    addNotesComment(projectId, author, text) {
        const project = this.getProject(projectId);
        if (!project) return null;

        // For MVP, we'll store notes comments in a separate array
        if (!project.notesComments) {
            project.notesComments = [];
        }
        const comment = {
            id: generateId(),
            author,
            text,
            created_at: getTimestamp()
        };
        project.notesComments.push(comment);
        project.updated_at = getTimestamp();
        this._saveData();
        return comment;
    }

    // --------------------------------------------------------
    // User authentication and RBAC
    // --------------------------------------------------------

    /**
     * Authenticate user
     * @param {string} username
     * @param {string} password
     * @returns {User|null}
     */
    authenticate(username, password) {
        const user = this.config.users.find(u => 
            u.username === username && u.password === password
        );
        return user || null;
    }

    /**
     * Get user by username
     * @param {string} username
     * @returns {User|null}
     */
    getUser(username) {
        return this.config.users.find(u => u.username === username) || null;
    }

    /**
     * Add user
     * @param {Object} userData
     */
    addUser(userData) {
        this.config.users.push({
            username: userData.username,
            password: userData.password,
            role: userData.role || 'viewer'
        });
        this._saveConfig();
    }

    /**
     * Update user
     * @param {string} username
     * @param {Object} updates
     */
    updateUser(username, updates) {
        const user = this.getUser(username);
        if (!user) return false;
        Object.assign(user, updates);
        this._saveConfig();
        return true;
    }

    /**
     * Delete user
     * @param {string} username
     */
    deleteUser(username) {
        const index = this.config.users.findIndex(u => u.username === username);
        if (index !== -1) {
            this.config.users.splice(index, 1);
            this._saveConfig();
            return true;
        }
        return false;
    }

    /**
     * Check if user has permission for action
     * @param {string} role
     * @param {string} action - 'edit', 'comment', 'view'
     */
    hasPermission(role, action) {
        const permissions = {
            editor: ['view', 'comment', 'edit'],
            commenter: ['view', 'comment'],
            viewer: ['view']
        };
        return permissions[role]?.includes(action) || false;
    }

    // --------------------------------------------------------
    // Settings
    // --------------------------------------------------------

    getSettings() {
        return this.config.settings;
    }

    updateSettings(updates) {
        Object.assign(this.config.settings, updates);
        this._saveConfig();
        return this.config.settings;
    }

    // --------------------------------------------------------
    // Cloud Sync (R-006 / R-007)
    // --------------------------------------------------------

    getCloudConfig() {
        return this.config.settings.cloudConfig || {};
    }

    async syncPush() {
        const cfg = this.getCloudConfig();
        const provider = this.config.settings.cloudProvider;
        if (!provider || provider === 'none') return { ok: false, error: 'No provider configured' };
        const payload = this.exportData();
        try {
            if (provider === 'google') {
                return await this._pushGoogleDrive(cfg, payload);
            }
            if (provider === 'nextcloud') {
                return await this._pushWebDAV(cfg, payload);
            }
        } catch (e) {
            return { ok: false, error: e.message };
        }
        return { ok: false, error: 'Unknown provider' };
    }

    async syncPull() {
        const cfg = this.getCloudConfig();
        const provider = this.config.settings.cloudProvider;
        if (!provider || provider === 'none') return { ok: false, error: 'No provider configured' };
        try {
            let remoteText;
            if (provider === 'google') {
                const res = await this._pullGoogleDrive(cfg);
                if (!res.ok) return res;
                remoteText = res.data;
            } else if (provider === 'nextcloud') {
                const res = await this._pullWebDAV(cfg);
                if (!res.ok) return res;
                remoteText = res.data;
            }
            const remoteData = JSON.parse(remoteText);
            const conflict = this._detectConflict(remoteData);
            if (conflict) {
                return { ok: true, data: remoteData, conflict: true, remoteUpdatedAt: remoteData.projects?.[0]?.updated_at || '' };
            }
            this.data = remoteData;
            this._saveData();
            return { ok: true, data: remoteData, conflict: false };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    _detectConflict(remoteData) {
        const localUpdated = this.getProjects().reduce((max, p) => p.updated_at > max ? p.updated_at : max, '');
        const remoteProjects = remoteData?.projects || [];
        const remoteUpdated = remoteProjects.reduce((max, p) => p.updated_at > max ? p.updated_at : max, '');
        return localUpdated && remoteUpdated && localUpdated !== remoteUpdated;
    }

    resolveSyncConflict(keepRemote) {
        // If keepRemote is false, we already have local data; just push later.
        // This method is a hook for the UI to decide.
        return { resolved: true, strategy: keepRemote ? 'remote' : 'local' };
    }

    async _pushGoogleDrive(cfg, payload) {
        const url = `https://www.googleapis.com/upload/drive/v3/files/${cfg.fileId}?uploadType=media`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Content-Type': 'application/json'
            },
            body: payload
        });
        if (!res.ok) throw new Error(`Google Drive push failed: ${res.status}`);
        return { ok: true };
    }

    async _pullGoogleDrive(cfg) {
        const url = `https://www.googleapis.com/drive/v3/files/${cfg.fileId}?alt=media`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${cfg.token}` }
        });
        if (!res.ok) throw new Error(`Google Drive pull failed: ${res.status}`);
        const text = await res.text();
        return { ok: true, data: text };
    }

    async _pushWebDAV(cfg, payload) {
        const res = await fetch(cfg.url, {
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + btoa(cfg.username + ':' + cfg.password),
                'Content-Type': 'application/json'
            },
            body: payload
        });
        if (!res.ok) throw new Error(`WebDAV push failed: ${res.status}`);
        return { ok: true };
    }

    async _pullWebDAV(cfg) {
        const res = await fetch(cfg.url, {
            headers: {
                'Authorization': 'Basic ' + btoa(cfg.username + ':' + cfg.password)
            }
        });
        if (!res.ok) throw new Error(`WebDAV pull failed: ${res.status}`);
        const text = await res.text();
        return { ok: true, data: text };
    }

    // --------------------------------------------------------
    // Version snapshots
    // --------------------------------------------------------

    /**
     * Save current state as a version snapshot
     * @param {string} label
     */
    saveVersion(label = '') {
        const timestamp = getTimestamp();
        const version = {
            id: generateId(),
            timestamp,
            label: label || `Snapshot ${timestamp}`,
            data: JSON.parse(JSON.stringify(this.data)) // deep clone
        };
        this.versions.unshift(version);
        // Keep only last 20 versions
        if (this.versions.length > 20) {
            this.versions.pop();
        }
        this._saveVersions();
        return version;
    }

    /**
     * Get all versions
     */
    getVersions() {
        return this.versions;
    }

    /**
     * Restore version by ID
     * @param {string} versionId
     */
    restoreVersion(versionId) {
        const version = this.versions.find(v => v.id === versionId);
        if (!version) return false;
        this.data = JSON.parse(JSON.stringify(version.data));
        this._saveData();
        return true;
    }

    // --------------------------------------------------------
    // Import/Export
    // --------------------------------------------------------

    /**
     * Export all data as JSON string
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Check approximate localStorage usage for this app's keys
     * @returns {{sizeBytes: number, sizeMb: number, warning: boolean}}
     */
    checkStorageSize() {
        const keys = [STORAGE_KEY, CONFIG_KEY, VERSIONS_KEY];
        let sizeBytes = 0;
        keys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) sizeBytes += item.length * 2; // UTF-16
        });
        const sizeMb = sizeBytes / (1024 * 1024);
        return {
            sizeBytes,
            sizeMb,
            warning: sizeMb > 4
        };
    }

    /**
     * Import data from JSON string
     * @param {string} jsonString
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // Basic validation
            if (!data.projects || !Array.isArray(data.projects)) {
                throw new Error('Invalid data format: missing projects array');
            }
            this.data = data;
            this._saveData();
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const store = new Store();

// Export store and utilities
export { store, generateId, getTimestamp, isoToTimestamp, timestampToIso, formatDisplayDate, parseActionLog };