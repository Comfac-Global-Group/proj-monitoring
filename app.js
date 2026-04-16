// Project Monitoring Log (PML) - Main Application
import { store, formatDisplayDate, yymmddToIso, isoToYymmdd } from './store.js';

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
let currentUser = null;
let currentProjectId = null;
let currentActionId = null;
let isPhoneLayout = false;
const collapsedProjects = new Set();
const collapsedLogs = new Set();
const collapsedDoneActions = new Set();
const collapsedNotes = new Set();
let collapseDefaultsInitialized = false;

function initializeCollapseDefaults(projects) {
    if (collapseDefaultsInitialized) return;
    if (projects.length === 0) return;
    // Add all project IDs to collapsed sets
    projects.forEach(p => {
        collapsedProjects.add(p.id);
        collapsedDoneActions.add(p.id);
    });
    console.log(`Default collapse: ${projects.length} projects collapsed`);
    collapseDefaultsInitialized = true;
}

let closedSectionCollapsed = store.getSettings().closedSectionCollapsed || false;
let commentContext = { projectId: null, actionId: null };
let syncIntervalId = null;
let lastSyncResult = { status: 'idle', message: '' };

// Filter / sort state
let filterState = {
    query: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    owner: ''
};
let sortValue = 'default';

// ------------------------------------------------------------
// DOM Elements
// ------------------------------------------------------------
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const themeToggle = document.getElementById('theme-toggle');
const layoutToggle = document.getElementById('layout-toggle');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const settingsClose = document.getElementById('settings-close');
const addProjectBtn = document.getElementById('add-project-btn');
const projectsList = document.getElementById('projects-list');
const projectModal = document.getElementById('project-modal');
const projectForm = document.getElementById('project-form');
const projectTitleInput = document.getElementById('project-title');
const projectDetailsInput = document.getElementById('project-details');
const projectNotesInput = document.getElementById('project-notes');
const projectDueDateInput = document.getElementById('project-due-date');
const projectStatusInput = document.getElementById('project-status');
const projectCancelBtn = document.getElementById('project-cancel');
const actionModal = document.getElementById('action-modal');
const actionForm = document.getElementById('action-form');
const actionTextInput = document.getElementById('action-text');
const actionDueDateInput = document.getElementById('action-due-date');
const actionOwnerInput = document.getElementById('action-owner');
const actionIssueInput = document.getElementById('action-issue');
const actionDoneInput = document.getElementById('action-done');
const actionCancelBtn = document.getElementById('action-cancel');
const overlay = document.getElementById('overlay');
const commentModal = document.getElementById('comment-modal');
const commentModalTitle = document.getElementById('comment-modal-title');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentTextInput = document.getElementById('comment-text');
const commentCloseBtn = document.getElementById('comment-close');
const exportBtn = document.getElementById('export-btn');
const saveAsBtn = document.getElementById('save-as-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file');
const saveVersionBtn = document.getElementById('save-version-btn');
const versionsList = document.getElementById('versions-list');
const usersList = document.getElementById('users-list');
const addUserFormContainer = document.getElementById('add-user-form-container');
const addUserForm = document.getElementById('add-user-form');
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const newRoleInput = document.getElementById('new-role');

// Filters / search / sort
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const filterDateFrom = document.getElementById('filter-date-from');
const filterDateTo = document.getElementById('filter-date-to');
const filterOwner = document.getElementById('filter-owner');
const sortSelect = document.getElementById('sort-select');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

// Sync
const syncStatus = document.getElementById('sync-status');
const cloudProviderSelect = document.getElementById('cloud-provider');
const cloudConfigPanel = document.getElementById('cloud-config');
const googleConfigPanel = document.getElementById('google-config');
const webdavConfigPanel = document.getElementById('webdav-config');
const googleTokenInput = document.getElementById('google-token');
const googleFileIdInput = document.getElementById('google-file-id');
const webdavUrlInput = document.getElementById('webdav-url');
const webdavUsernameInput = document.getElementById('webdav-username');
const webdavPasswordInput = document.getElementById('webdav-password');
const syncIntervalInput = document.getElementById('sync-interval');
const saveCloudBtn = document.getElementById('save-cloud-btn');
const syncNowBtn = document.getElementById('sync-now-btn');
const pullNowBtn = document.getElementById('pull-now-btn');

// Changelog
const changelogProjectSelect = document.getElementById('changelog-project-select');
const changelogList = document.getElementById('changelog-list');
const exportChangelogBtn = document.getElementById('export-changelog-btn');

// ------------------------------------------------------------
// Service Worker Registration
// ------------------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification(newWorker);
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// ------------------------------------------------------------
// Theme Management
// ------------------------------------------------------------
function initTheme() {
    const settings = store.getSettings();
    const savedTheme = settings.theme || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : savedTheme;
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    store.updateSettings({ theme: newTheme });
    updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ------------------------------------------------------------
// Layout Management
// ------------------------------------------------------------
function initLayout() {
    const settings = store.getSettings();
    const savedLayout = settings.layout || 'desktop';
    isPhoneLayout = savedLayout === 'phone';
    updateLayout();
}

function toggleLayout() {
    isPhoneLayout = !isPhoneLayout;
    const layout = isPhoneLayout ? 'phone' : 'desktop';
    store.updateSettings({ layout });
    updateLayout();
}

function updateLayout() {
    if (isPhoneLayout) {
        document.body.classList.add('layout-phone');
        document.body.classList.remove('layout-desktop');
        layoutToggle.textContent = '🖥️';
    } else {
        document.body.classList.add('layout-desktop');
        document.body.classList.remove('layout-phone');
        layoutToggle.textContent = '📱';
    }
    renderProjects();
}

// ------------------------------------------------------------
// Authentication
// ------------------------------------------------------------
function initAuth() {
    const savedUser = sessionStorage.getItem('pomm-user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (store.getUser(user.username)) {
            currentUser = user;
            showApp();
            return;
        }
    }
    showLogin();
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');
    settingsPanel.classList.remove('open');
    settingsPanel.classList.add('hidden');
}

function showApp() {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    initFiltersFromHash();
    renderProjects();
    initSyncPolling();
}

function handleLogin(event) {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    const user = store.authenticate(username, password);
    if (!user) {
        alert('Invalid username or password');
        return;
    }
    currentUser = user;
    sessionStorage.setItem('pomm-user', JSON.stringify(user));
    showApp();
    usernameInput.value = '';
    passwordInput.value = '';
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('pomm-user');
    stopSyncPolling();
    showLogin();
}

// ------------------------------------------------------------
// Filters / Sort / URL Hash
// ------------------------------------------------------------
function initFiltersFromHash() {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    filterState.query = params.get('q') || '';
    filterState.status = params.get('status') || 'all';
    filterState.dateFrom = params.get('from') || '';
    filterState.dateTo = params.get('to') || '';
    filterState.owner = params.get('owner') || '';
    sortValue = params.get('sort') || 'default';

    searchInput.value = filterState.query;
    filterStatus.value = filterState.status;
    filterDateFrom.value = filterState.dateFrom;
    filterDateTo.value = filterState.dateTo;
    filterOwner.value = filterState.owner;
    sortSelect.value = sortValue;
}

function updateHashFromFilters() {
    const params = new URLSearchParams();
    if (filterState.query) params.set('q', filterState.query);
    if (filterState.status && filterState.status !== 'all') params.set('status', filterState.status);
    if (filterState.dateFrom) params.set('from', filterState.dateFrom);
    if (filterState.dateTo) params.set('to', filterState.dateTo);
    if (filterState.owner) params.set('owner', filterState.owner);
    if (sortValue && sortValue !== 'default') params.set('sort', sortValue);
    window.location.hash = params.toString();
}

function applyFilters(projects) {
    const q = filterState.query.toLowerCase();
    return projects.filter(p => {
        if (filterState.status !== 'all' && p.status !== filterState.status) return false;
        if (q && !p.title.toLowerCase().includes(q)) {
            const actionMatch = (p.actions || []).some(a =>
                (a.text || '').toLowerCase().includes(q) ||
                (a.owner || '').toLowerCase().includes(q) ||
                (a.issue || '').toLowerCase().includes(q)
            );
            if (!actionMatch) return false;
        }
        if (filterState.owner) {
            const ownerLower = filterState.owner.toLowerCase();
            const actionOwnerMatch = (p.actions || []).some(a =>
                (a.owner || '').toLowerCase().includes(ownerLower)
            );
            if (!actionOwnerMatch && !p.title.toLowerCase().includes(ownerLower)) return false;
        }
        if (filterState.dateFrom || filterState.dateTo) {
            const from = isoToYymmdd(filterState.dateFrom);
            const to = isoToYymmdd(filterState.dateTo);
            const dateMatch = (p.actions || []).some(a => {
                const d = isoToYymmdd(a.due_date);
                if (!d) return false;
                if (from && d < from) return false;
                if (to && d > to) return false;
                return true;
            });
            if (!dateMatch) return false;
        }
        return true;
    });
}

function applySort(projects) {
    const list = [...projects];
    list.sort((a, b) => {
        // Always sort open first as base
        if (a.status !== b.status) {
            return a.status === 'open' ? -1 : 1;
        }
        switch (sortValue) {
            case 'due_date': {
                const ad = (a.actions || []).map(x => isoToYymmdd(x.due_date)).filter(Boolean).sort()[0] || '999999';
                const bd = (b.actions || []).map(x => isoToYymmdd(x.due_date)).filter(Boolean).sort()[0] || '999999';
                return ad.localeCompare(bd);
            }
            case 'updated':
                return (b.updated_at || '').localeCompare(a.updated_at || '');
            case 'name':
                return (a.title || '').localeCompare(b.title || '');
            case 'status':
                return (a.status || '').localeCompare(b.status || '');
            default: {
                // Default: open first, soonest due date
                const ad = (a.actions || []).map(x => isoToYymmdd(x.due_date)).filter(Boolean).sort()[0] || '999999';
                const bd = (b.actions || []).map(x => isoToYymmdd(x.due_date)).filter(Boolean).sort()[0] || '999999';
                return ad.localeCompare(bd);
            }
        }
    });
    return list;
}

function handleFilterChange() {
    filterState.query = searchInput.value.trim();
    filterState.status = filterStatus.value;
    filterState.dateFrom = filterDateFrom.value;
    filterState.dateTo = filterDateTo.value;
    filterState.owner = filterOwner.value.trim();
    sortValue = sortSelect.value;
    updateHashFromFilters();
    renderProjects();
}

function clearFilters() {
    searchInput.value = '';
    filterStatus.value = 'all';
    filterDateFrom.value = '';
    filterDateTo.value = '';
    filterOwner.value = '';
    sortSelect.value = 'default';
    handleFilterChange();
}

// ------------------------------------------------------------
// Project Rendering
// ------------------------------------------------------------
function renderProjects() {
    const allProjects = store.getProjects();
    initializeCollapseDefaults(allProjects);
    const filtered = applyFilters(allProjects);
    const sorted = applySort(filtered);
    const openProjects = sorted.filter(p => p.status === 'open');
    const closedProjects = sorted.filter(p => p.status === 'closed');

    if (openProjects.length === 0 && closedProjects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <p>No projects match your filters. <button class="btn btn-small btn-secondary" id="clear-filters-inline">Clear filters</button></p>
            </div>
        `;
        document.getElementById('clear-filters-inline')?.addEventListener('click', clearFilters);
        return;
    }

    let html = '';

    if (openProjects.length === 0) {
        html += `<div class="empty-state"><p>No open projects.</p></div>`;
    } else {
        html += '<div class="open-projects-list">';
        openProjects.forEach(project => {
            html += renderProjectCard(project);
        });
        html += '</div>';
    }

    if (closedProjects.length > 0) {
        html += `
            <div class="closed-projects-section">
                <div class="closed-projects-header" data-action="toggle-closed-section">
                    <h3>Closed Projects (${closedProjects.length})</h3>
                    <button class="btn btn-small btn-secondary">${closedSectionCollapsed ? '▶ Show' : '▼ Hide'}</button>
                </div>
                <div class="closed-projects-list ${closedSectionCollapsed ? 'hidden' : ''}">
                    ${closedProjects.map(project => renderProjectCard(project)).join('')}
                </div>
            </div>
        `;
    }

    projectsList.innerHTML = html;
    
    // Update collapse all button text
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    if (collapseAllBtn) {
        const projects = store.getProjects();
        const allCollapsed = projects.every(p => collapsedProjects.has(p.id));
        collapseAllBtn.textContent = allCollapsed ? 'Expand All' : 'Collapse All';
    }
}

function renderProjectCard(project) {
    const isClosed = project.status === 'closed';
    const isCollapsed = collapsedProjects.has(project.id);
    const isNotesCollapsed = collapsedNotes.has(project.id);
    const actionsHtml = renderActions(project);
    const hasOverdue = hasOverdueActions(project);

    return `
        <div class="project-card ${isClosed ? 'closed' : ''}" data-project-id="${project.id}">
            <div class="project-header">
                <div class="project-title-wrapper">
                    <button class="project-toggle" data-action="toggle-project" data-project-id="${project.id}">
                        ${isCollapsed ? '▶' : '▼'}
                    </button>
                    <h3 class="project-title">${escapeHtml(project.title)}</h3>
                    ${project.project_due_date ? `<span class="project-due-badge">Due ${formatDisplayDate(project.project_due_date)}</span>` : ''}${hasOverdue ? '<span class="overdue-badge">⚠️ Overdue</span>' : ''}
                </div>
                <div class="project-status-toggle">
                    <span class="status-badge ${isClosed ? 'closed' : 'open'}">${project.status.toUpperCase()}</span>
                    ${currentUser?.role === 'editor' ? `
                        <button class="btn btn-small" data-action="toggle-status" data-project-id="${project.id}">
                            ${isClosed ? 'Reopen' : 'Close'}
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="project-body ${isCollapsed ? 'hidden' : ''}">
                <div class="project-details">
                    ${escapeHtml(project.details)}
                </div>

                ${project.notes ? `
                    <div class="project-notes">
                        <div class="project-notes-header" data-action="toggle-notes" data-project-id="${project.id}">
                            <h4>Notes</h4>
                            <button class="btn btn-small btn-text">${isNotesCollapsed ? '▶ Show' : '▼ Hide'}</button>
                        </div>
                        <div class="project-notes-body ${isNotesCollapsed ? 'hidden' : ''}">
                            <div class="project-notes-content">${linkifyText(escapeHtml(project.notes))}</div>
                            ${currentUser?.role === 'commenter' || currentUser?.role === 'editor' ? `
                                <button class="action-comments" data-action="add-notes-comment" data-project-id="${project.id}">
                                    💬 Comment${project.notesComments?.length ? ` (${project.notesComments.length})` : ''}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="actions-list">
                    ${actionsHtml}
                    ${currentUser?.role === 'editor' ? `
                        <button class="btn btn-secondary add-action-btn" data-action="add-action" data-project-id="${project.id}">
                            + Add Action
                        </button>
                    ` : ''}
                </div>

                ${currentUser?.role === 'editor' ? `
                    <div class="project-actions" style="margin-top: 16px; display: flex; gap: 8px;">
                        <button class="btn btn-small" data-action="edit-project" data-project-id="${project.id}">
                            Edit
                        </button>
                        <button class="btn btn-small" data-action="delete-project" data-project-id="${project.id}">
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderActions(project) {
    if (!project.actions || project.actions.length === 0) {
        return '<p class="text-sm" style="color: var(--text-tertiary);">No actions yet</p>';
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const closedActions = project.actions.filter(a => a.status === 'closed');
    const openActions = project.actions.filter(a => a.status === 'open');
    const hideDone = collapsedDoneActions.has(project.id);

    let html = '';

    // Helper to render a single action
    function renderActionItem(action) {
        let dueDateClass = '';
        let dueDateText = '';
        if (action.due_date) {
            dueDateText = formatDisplayDate(action.due_date);
            const isoDue = yymmddToIso(action.due_date);
            if (isoDue && isoDue <= todayStr) {
                dueDateClass = 'overdue';
            } else if (isoDue) {
                const daysLeft = Math.ceil((new Date(isoDue) - today) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) dueDateClass = 'due-soon';
            }
        }
        const commentsCount = action.comments ? action.comments.length : 0;
        const hasLogs = action.log_entries && action.log_entries.length > 0;
        const logsCollapsed = collapsedLogs.has(action.id);
        return `
            <div class="action-item ${action.status === 'closed' ? 'closed' : ''}" data-action-id="${action.id}">
                <div class="action-main">
                    <div class="action-text">${escapeHtml(action.text)}</div>
                    <div class="action-meta-row">
                        ${action.due_date ? `<span class="action-due-date ${dueDateClass}">📅 ${dueDateText}</span>` : ''}
                        ${action.owner ? `<span class="action-owner">👤 ${escapeHtml(action.owner)}</span>` : ''}
                        ${action.issue ? `<span class="action-issue">⚠️ ${escapeHtml(action.issue)}</span>` : ''}
                        ${action.created_at ? `<span class="action-timestamp">🕒 ${escapeHtml(action.created_at.slice(0,6))}</span>` : ''}
                    </div>
                    ${hasLogs ? `
                        <div class="action-log">
                            <button class="btn btn-small btn-text" data-action="toggle-log" data-log-id="${action.id}">
                                ${logsCollapsed ? '▶ Show log (' + action.log_entries.length + ')' : '▼ Hide log'}
                            </button>
                            <div class="log-entries ${logsCollapsed ? 'hidden' : ''}">
                                ${action.log_entries.map(e => `
                                    <div class="log-entry">
                                        <span class="log-date">${escapeHtml(e.date)}</span>
                                        <span class="log-text">${escapeHtml(e.text)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="action-controls">
                    ${currentUser?.role === 'commenter' || currentUser?.role === 'editor' ? `
                        <button class="action-comments" data-action="view-comments" data-project-id="${project.id}" data-action-id="${action.id}">
                            💬 ${commentsCount}
                        </button>
                    ` : ''}
                    ${currentUser?.role === 'editor' ? `
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-small" data-action="edit-action" data-project-id="${project.id}" data-action-id="${action.id}">Edit</button>
                            <button class="btn btn-small" data-action="delete-action" data-project-id="${project.id}" data-action-id="${action.id}">Delete</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Active actions
    if (openActions.length === 0) {
        html += '<p class="text-sm" style="color: var(--text-tertiary);">No active actions</p>';
    } else {
        openActions.forEach(action => {
            html += renderActionItem(action);
        });
    }

    // Closed Actions section
    if (closedActions.length > 0) {
        html += `
            <div class="closed-actions-section">
                <div class="closed-actions-header" data-action="toggle-done-actions" data-project-id="${project.id}">
                    <h4>Closed Actions (${closedActions.length})</h4>
                    <button class="btn btn-small btn-text">${hideDone ? '▶ Show' : '▼ Hide'}</button>
                </div>
                <div class="closed-actions-list ${hideDone ? 'hidden' : ''}">
                    ${closedActions.map(action => renderActionItem(action)).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

function linkifyText(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

// ------------------------------------------------------------
// Project CRUD
// ------------------------------------------------------------
function openProjectModal(projectId = null) {
    currentProjectId = projectId;
    if (projectId) {
        const project = store.getProject(projectId);
        if (!project) return;
        projectTitleInput.value = project.title;
        projectDetailsInput.value = project.details;
        projectNotesInput.value = project.notes;
        projectDueDateInput.value = yymmddToIso(project.project_due_date) || '';
        projectStatusInput.checked = project.status === 'open';
    } else {
        projectTitleInput.value = '';
        projectDetailsInput.value = '';
        projectNotesInput.value = '';
        projectDueDateInput.value = '';
        projectStatusInput.checked = true;
    }
    projectModal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeProjectModal() {
    projectModal.classList.add('hidden');
    overlay.classList.add('hidden');
    currentProjectId = null;
}

function handleProjectSubmit(event) {
    event.preventDefault();
    const projectData = {
        title: projectTitleInput.value.trim(),
        details: projectDetailsInput.value.trim(),
        notes: projectNotesInput.value.trim(),
        project_due_date: isoToYymmdd(projectDueDateInput.value)
    };
    if (!projectData.title) {
        alert('Project title is required');
        return;
    }
    const user = currentUser?.username || 'system';
    if (currentProjectId) {
        store.updateProject(currentProjectId, projectData, user);
        store.updateProject(currentProjectId, { status: projectStatusInput.checked ? 'open' : 'closed' }, user);
    } else {
        store.createProject(projectData);
    }
    closeProjectModal();
    renderProjects();
    checkStorageWarning();
}

// ------------------------------------------------------------
// Action CRUD
// ------------------------------------------------------------
function openActionModal(projectId, actionId = null) {
    currentProjectId = projectId;
    currentActionId = actionId;
    if (actionId) {
        const project = store.getProject(projectId);
        if (!project) return;
        const action = project.actions.find(a => a.id === actionId);
        if (!action) return;
        actionTextInput.value = action.text;
        actionDueDateInput.value = yymmddToIso(action.due_date) || '';
        actionOwnerInput.value = action.owner || '';
        actionIssueInput.value = action.issue || '';
        actionDoneInput.checked = action.status === 'closed';
    } else {
        actionTextInput.value = '';
        actionDueDateInput.value = '';
        actionOwnerInput.value = '';
        actionIssueInput.value = '';
        actionDoneInput.checked = false;
    }
    actionModal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeActionModal() {
    actionModal.classList.add('hidden');
    overlay.classList.add('hidden');
    currentProjectId = null;
    currentActionId = null;
}

function handleActionSubmit(event) {
    event.preventDefault();
    const actionData = {
        text: actionTextInput.value.trim(),
        due_date: isoToYymmdd(actionDueDateInput.value),
        owner: actionOwnerInput.value.trim(),
        issue: actionIssueInput.value.trim(),
        status: actionDoneInput.checked ? 'closed' : 'open'
    };
    if (!actionData.text) {
        alert('Action text is required');
        return;
    }
    const user = currentUser?.username || 'system';
    if (currentActionId) {
        store.updateAction(currentProjectId, currentActionId, actionData, user);
    } else {
        store.addAction(currentProjectId, actionData);
    }
    closeActionModal();
    renderProjects();
    checkStorageWarning();
}

// ------------------------------------------------------------
// Settings
// ------------------------------------------------------------
function openSettings() {
    settingsPanel.classList.add('open');
    settingsPanel.classList.remove('hidden');
    overlay.classList.remove('hidden');
    renderSettings();
    renderChangelogProjects();
}

function closeSettings() {
    settingsPanel.classList.remove('open');
    settingsPanel.classList.add('hidden');
    overlay.classList.add('hidden');
}

function renderSettings() {
    renderVersions();
    renderUsers();
    renderCloudConfig();
}

function renderVersions() {
    const versions = store.getVersions();
    if (versions.length === 0) {
        versionsList.innerHTML = '<p class="text-sm">No saved versions yet.</p>';
        return;
    }
    let html = '<ul style="list-style: none; padding: 0; margin-top: 12px;">';
    versions.forEach(version => {
        html += `
            <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${version.label}</strong><br>
                        <span class="text-xs">${version.timestamp}</span>
                    </div>
                    <button class="btn btn-small" data-action="restore-version" data-version-id="${version.id}">
                        Restore
                    </button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    versionsList.innerHTML = html;
}

function renderUsers() {
    const users = store.config.users || [];
    if (currentUser?.username === 'admin') {
        addUserFormContainer.classList.remove('hidden');
    } else {
        addUserFormContainer.classList.add('hidden');
    }
    let html = '<ul style="list-style: none; padding: 0; margin-top: 12px;">';
    users.forEach(user => {
        html += `
            <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${user.username}</strong><br>
                        <span class="text-xs">Role: ${user.role}</span>
                    </div>
                    ${user.username !== 'admin' ? `
                        <button class="btn btn-small" data-action="delete-user" data-username="${user.username}">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </li>
        `;
    });
    html += '</ul>';
    usersList.innerHTML = html;
}

// ------------------------------------------------------------
// Cloud Sync UI
// ------------------------------------------------------------
function renderCloudConfig() {
    const cfg = store.getCloudConfig();
    const provider = store.getSettings().cloudProvider || 'none';
    cloudProviderSelect.value = provider;
    googleTokenInput.value = cfg.token || '';
    googleFileIdInput.value = cfg.fileId || '';
    webdavUrlInput.value = cfg.url || '';
    webdavUsernameInput.value = cfg.username || '';
    webdavPasswordInput.value = cfg.password || '';
    syncIntervalInput.value = cfg.interval || 5;
    updateCloudConfigVisibility();
}

function updateCloudConfigVisibility() {
    const provider = cloudProviderSelect.value;
    if (provider === 'none') {
        cloudConfigPanel.classList.add('hidden');
    } else {
        cloudConfigPanel.classList.remove('hidden');
    }
    googleConfigPanel.classList.toggle('hidden', provider !== 'google');
    webdavConfigPanel.classList.toggle('hidden', provider !== 'nextcloud');
}

function saveCloudConfig() {
    const provider = cloudProviderSelect.value;
    const cfg = {
        token: googleTokenInput.value.trim(),
        fileId: googleFileIdInput.value.trim(),
        url: webdavUrlInput.value.trim(),
        username: webdavUsernameInput.value.trim(),
        password: webdavPasswordInput.value,
        interval: parseInt(syncIntervalInput.value, 10) || 5
    };
    store.updateSettings({ cloudProvider: provider, cloudConfig: cfg });
    showNotification('Cloud config saved');
    initSyncPolling();
}

async function doSyncNow() {
    updateSyncStatus('syncing', 'Syncing...');
    const result = await store.syncPush();
    if (result.ok) {
        lastSyncResult = { status: 'ok', message: 'Synced' };
        updateSyncStatus('ok', '✓ Synced');
    } else {
        lastSyncResult = { status: 'error', message: result.error };
        updateSyncStatus('error', '⚠ ' + result.error);
    }
}

async function doPullNow() {
    updateSyncStatus('syncing', 'Pulling...');
    const result = await store.syncPull();
    if (result.ok) {
        if (result.conflict) {
            const keepRemote = confirm('Remote data is newer. Keep remote version? (Cancel keeps local)');
            store.resolveSyncConflict(keepRemote);
            if (keepRemote) {
                store.data = result.data;
                store._saveData();
                renderProjects();
                updateSyncStatus('ok', '✓ Pulled remote');
            } else {
                updateSyncStatus('ok', '✓ Kept local');
                // Optionally push local back
                await store.syncPush();
            }
        } else {
            renderProjects();
            updateSyncStatus('ok', '✓ Pulled');
        }
    } else {
        updateSyncStatus('error', '⚠ ' + result.error);
    }
}

function updateSyncStatus(status, text) {
    syncStatus.textContent = text;
    syncStatus.className = 'sync-status ' + status;
}

function initSyncPolling() {
    stopSyncPolling();
    const provider = store.getSettings().cloudProvider;
    if (!provider || provider === 'none') {
        updateSyncStatus('idle', '—');
        return;
    }
    const cfg = store.getCloudConfig();
    const minutes = cfg.interval || 5;
    // Immediate sync
    doSyncNow();
    syncIntervalId = setInterval(() => {
        doSyncNow();
    }, minutes * 60 * 1000);
}

function stopSyncPolling() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
}

// ------------------------------------------------------------
// Change Log
// ------------------------------------------------------------
function renderChangelogProjects() {
    const projects = store.getProjects();
    let html = '<option value="">— Select project —</option>';
    projects.forEach(p => {
        html += `<option value="${p.id}">${escapeHtml(p.title)}</option>`;
    });
    changelogProjectSelect.innerHTML = html;
}

function renderChangelog() {
    const projectId = changelogProjectSelect.value;
    if (!projectId) {
        changelogList.innerHTML = '<p class="text-sm">Select a project to view history.</p>';
        return;
    }
    const log = store.getChangeLog(projectId);
    if (!log.length) {
        changelogList.innerHTML = '<p class="text-sm">No changes recorded yet.</p>';
        return;
    }
    let html = '<ul style="list-style: none; padding: 0; margin-top: 8px;">';
    log.slice().reverse().forEach(entry => {
        html += `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
                <strong>${entry.datetime}</strong> — ${escapeHtml(entry.user)} changed <em>${entry.field}</em><br>
                <span style="color: var(--text-secondary);">From:</span> ${escapeHtml(entry.old_value)}<br>
                <span style="color: var(--text-secondary);">To:</span> ${escapeHtml(entry.new_value)}
            </li>
        `;
    });
    html += '</ul>';
    changelogList.innerHTML = html;
}

function exportChangelogCsv() {
    const projectId = changelogProjectSelect.value;
    if (!projectId) return;
    const project = store.getProject(projectId);
    const log = store.getChangeLog(projectId);
    if (!log.length) return;
    const rows = [
        ['datetime', 'user', 'field', 'old_value', 'new_value'],
        ...log.map(e => [e.datetime, e.user, e.field, e.old_value, e.new_value])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `changelog-${project.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ------------------------------------------------------------
// Event Delegation
// ------------------------------------------------------------
function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const projectId = target.getAttribute('data-project-id');
    const actionId = target.getAttribute('data-action-id');
    const versionId = target.getAttribute('data-version-id');
    const username = target.getAttribute('data-username');
    const logId = target.getAttribute('data-log-id');

    if (!action) return;
    event.preventDefault();

    switch (action) {
        case 'add-project':
            openProjectModal();
            break;
        case 'edit-project':
            openProjectModal(projectId);
            break;
        case 'delete-project':
            if (confirm('Delete this project?')) {
                store.deleteProject(projectId);
                renderProjects();
                checkStorageWarning();
            }
            break;
        case 'toggle-status':
            store.toggleProjectStatus(projectId);
            renderProjects();
            checkStorageWarning();
            break;
        case 'toggle-project':
            if (collapsedProjects.has(projectId)) {
                collapsedProjects.delete(projectId);
            } else {
                collapsedProjects.add(projectId);
            }
            renderProjects();
            break;
        case 'add-action':
            openActionModal(projectId);
            break;
        case 'edit-action':
            openActionModal(projectId, actionId);
            break;
        case 'delete-action':
            if (confirm('Delete this action?')) {
                store.deleteAction(projectId, actionId);
                renderProjects();
                checkStorageWarning();
            }
            break;
        case 'toggle-log':
            if (collapsedLogs.has(logId)) {
                collapsedLogs.delete(logId);
            } else {
                collapsedLogs.add(logId);
            }
            renderProjects();
            break;
        case 'toggle-closed-section':
            closedSectionCollapsed = !closedSectionCollapsed;
            store.updateSettings({ closedSectionCollapsed });
            renderProjects();
            break;
        case 'toggle-done-actions':
            if (collapsedDoneActions.has(projectId)) {
                collapsedDoneActions.delete(projectId);
            } else {
                collapsedDoneActions.add(projectId);
            }
            renderProjects();
            break;
        case 'toggle-notes':
            if (collapsedNotes.has(projectId)) {
                collapsedNotes.delete(projectId);
            } else {
                collapsedNotes.add(projectId);
            }
            renderProjects();
            break;
        case 'add-notes-comment':
            openCommentModal(projectId, null);
            break;
        case 'view-comments':
            openCommentModal(projectId, actionId);
            break;
        case 'restore-version':
            if (confirm('Restore this version? Current unsaved changes will be lost.')) {
                store.restoreVersion(versionId);
                renderProjects();
                closeSettings();
                checkStorageWarning();
            }
            break;
        case 'delete-user':
            if (confirm(`Delete user ${username}?`)) {
                store.deleteUser(username);
                renderUsers();
            }
            break;
    }
}

// ------------------------------------------------------------
// Comments
// ------------------------------------------------------------
function openCommentModal(projectId, actionId) {
    commentContext = { projectId, actionId };
    const project = store.getProject(projectId);
    let comments;
    if (actionId) {
        const action = project?.actions.find(a => a.id === actionId);
        comments = action?.comments || [];
        commentModalTitle.textContent = 'Action Comments';
    } else {
        comments = project?.notesComments || [];
        commentModalTitle.textContent = 'Notes Comments';
    }
    renderCommentsList(comments);
    commentModal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    commentTextInput.focus();
}

function closeCommentModal() {
    commentModal.classList.add('hidden');
    overlay.classList.add('hidden');
    commentForm.reset();
    commentContext = { projectId: null, actionId: null };
}

function renderCommentsList(comments) {
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet.</p>';
        return;
    }
    commentsList.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-meta">
                <span class="comment-author">${escapeHtml(c.author)}</span>
                <span class="comment-date">${c.created_at}</span>
            </div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
        </div>
    `).join('');
    commentsList.scrollTop = commentsList.scrollHeight;
}

function handleCommentSubmit(e) {
    e.preventDefault();
    const text = commentTextInput.value.trim();
    if (!text) return;
    const { projectId, actionId } = commentContext;
    if (actionId) {
        store.addActionComment(projectId, actionId, currentUser.username, text);
    } else {
        store.addNotesComment(projectId, currentUser.username, text);
    }
    commentForm.reset();
    const project = store.getProject(projectId);
    let comments;
    if (actionId) {
        const action = project?.actions.find(a => a.id === actionId);
        comments = action?.comments || [];
    } else {
        comments = project?.notesComments || [];
    }
    renderCommentsList(comments);
    renderProjects();
    checkStorageWarning();
}

// ------------------------------------------------------------
// Import/Export / Save-As
// ------------------------------------------------------------
function exportData() {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pml-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveAsData() {
    const label = prompt('File name (optional):', `pml-backup-${new Date().toISOString().split('T')[0]}`);
    if (label === null) return;
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label || 'pml-backup'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    importFileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        if (store.importData(content)) {
            alert('Data imported successfully!');
            renderProjects();
            checkStorageWarning();
        } else {
            alert('Failed to import data. Invalid format.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTodayYMD() {
    const d = new Date();
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function hasOverdueActions(project) {
    if (!project.actions || project.actions.length === 0) return false;
    const today = getTodayYMD();
    return project.actions.some(action =>
        action.status === 'open' &&
        action.due_date &&
        action.due_date <= today
    );
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 12px 16px;
        border-radius: var(--radius);
        z-index: 9999;
        box-shadow: var(--shadow-lg);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function checkStorageWarning() {
    const stats = store.checkStorageSize();
    if (stats.warning) {
        showNotification(`Warning: localStorage is ${stats.sizeMb.toFixed(2)} MB. Consider exporting and archiving old data.`);
    }
}

function showUpdateNotification(newWorker) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 16px 20px;
        border-radius: var(--radius);
        z-index: 9999;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    notification.innerHTML = `
        <span>New version available.</span>
        <button class="btn btn-small" style="background: white; color: var(--accent-color); border: none;">Reload</button>
    `;
    notification.querySelector('button').addEventListener('click', () => {
        if (newWorker && newWorker.state === 'installed') {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    });
    document.body.appendChild(notification);
}
function toggleCollapseAll() {
    const projects = store.getProjects();
    const allCollapsed = projects.every(p => collapsedProjects.has(p.id));
    if (allCollapsed) {
        // Expand all
        collapsedProjects.clear();
        document.getElementById('collapse-all-btn').textContent = 'Collapse All';
    } else {
        // Collapse all
        projects.forEach(p => collapsedProjects.add(p.id));
        document.getElementById('collapse-all-btn').textContent = 'Expand All';
    }
    renderProjects();
}

// ------------------------------------------------------------
// Event Listeners
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLayout();
    initAuth();

    loginForm.addEventListener('submit', handleLogin);
    themeToggle.addEventListener('click', toggleTheme);
    layoutToggle.addEventListener('click', toggleLayout);
    settingsToggle.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    addProjectBtn.addEventListener('click', () => openProjectModal());
    document.getElementById('collapse-all-btn').addEventListener('click', toggleCollapseAll);
    projectForm.addEventListener('submit', handleProjectSubmit);
    projectCancelBtn.addEventListener('click', closeProjectModal);
    actionForm.addEventListener('submit', handleActionSubmit);
    actionCancelBtn.addEventListener('click', closeActionModal);
    commentCloseBtn.addEventListener('click', closeCommentModal);
    commentForm.addEventListener('submit', handleCommentSubmit);
    overlay.addEventListener('click', () => {
        closeProjectModal();
        closeActionModal();
        closeCommentModal();
        closeSettings();
    });
    exportBtn.addEventListener('click', exportData);
    saveAsBtn.addEventListener('click', saveAsData);
    importBtn.addEventListener('click', importData);
    importFileInput.addEventListener('change', handleFileImport);
    saveVersionBtn.addEventListener('click', () => {
        const label = prompt('Version label (optional):');
        store.saveVersion(label);
        renderVersions();
        showNotification('Version saved!');
    });

    // Filters
    searchInput.addEventListener('input', handleFilterChange);
    filterStatus.addEventListener('change', handleFilterChange);
    filterDateFrom.addEventListener('change', handleFilterChange);
    filterDateTo.addEventListener('change', handleFilterChange);
    filterOwner.addEventListener('input', handleFilterChange);
    sortSelect.addEventListener('change', handleFilterChange);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Cloud sync
    cloudProviderSelect.addEventListener('change', updateCloudConfigVisibility);
    saveCloudBtn.addEventListener('click', saveCloudConfig);
    syncNowBtn.addEventListener('click', doSyncNow);
    pullNowBtn.addEventListener('click', doPullNow);

    // Changelog
    changelogProjectSelect.addEventListener('change', renderChangelog);
    exportChangelogBtn.addEventListener('click', exportChangelogCsv);

    // Event delegation
    document.addEventListener('click', handleClick);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeProjectModal();
            closeActionModal();
            closeCommentModal();
            closeSettings();
        }
    });

    addUserForm.addEventListener('submit', handleAddUserSubmit);
});

function handleAddUserSubmit(event) {
    event.preventDefault();
    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value;
    const role = newRoleInput.value;
    if (!username || !password) {
        alert('Username and password are required');
        return;
    }
    if (store.getUser(username)) {
        alert('User already exists');
        return;
    }
    store.addUser({ username, password, role });
    addUserForm.reset();
    renderUsers();
    showNotification('User added successfully');
}

// ------------------------------------------------------------
// Offline detection
// ------------------------------------------------------------
window.addEventListener('online', () => {
    showNotification('Back online');
    initSyncPolling();
});

window.addEventListener('offline', () => {
    showNotification('Working offline');
    stopSyncPolling();
});
