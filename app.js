// Project Monitoring Log (PML) - Main Application
import { store, formatDisplayDate } from './store.js';

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
let currentUser = null;
let currentProjectId = null;
let currentActionId = null;
let isPhoneLayout = false;
const collapsedProjects = new Set();
let commentContext = { projectId: null, actionId: null };

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
const projectStatusInput = document.getElementById('project-status');
const projectCancelBtn = document.getElementById('project-cancel');
const actionModal = document.getElementById('action-modal');
const actionForm = document.getElementById('action-form');
const actionTextInput = document.getElementById('action-text');
const actionDueDateInput = document.getElementById('action-due-date');
const actionCancelBtn = document.getElementById('action-cancel');
const overlay = document.getElementById('overlay');
const commentModal = document.getElementById('comment-modal');
const commentModalTitle = document.getElementById('comment-modal-title');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentTextInput = document.getElementById('comment-text');
const commentCloseBtn = document.getElementById('comment-close');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file');
const saveVersionBtn = document.getElementById('save-version-btn');
const versionsList = document.getElementById('versions-list');
const usersList = document.getElementById('users-list');

// ------------------------------------------------------------
// Service Worker Registration
// ------------------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showNotification('New version available. Refresh to update.');
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
    // Check if user is already logged in (from sessionStorage)
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
    renderProjects();
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
    
    // Clear form
    usernameInput.value = '';
    passwordInput.value = '';
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('pomm-user');
    showLogin();
}

// ------------------------------------------------------------
// Project Rendering
// ------------------------------------------------------------
function renderProjects() {
    const projects = store.getProjects();
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <p>No projects yet. Add your first project to get started.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    projects.forEach(project => {
        const isClosed = project.status === 'closed';
        const isCollapsed = collapsedProjects.has(project.id);
        const actionsHtml = renderActions(project);

        html += `
            <div class="project-card ${isClosed ? 'closed' : ''}" data-project-id="${project.id}">
                <div class="project-header">
                    <div class="project-title-wrapper">
                        <button class="project-toggle" data-action="toggle-project" data-project-id="${project.id}">
                            ${isCollapsed ? '▶' : '▼'}
                        </button>
                        <h3 class="project-title">${escapeHtml(project.title)}</h3>
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
                            <h4>Notes</h4>
                            <div class="project-notes-content">${escapeHtml(project.notes)}</div>
                            ${currentUser?.role === 'commenter' || currentUser?.role === 'editor' ? `
                                <button class="action-comments" data-action="add-notes-comment" data-project-id="${project.id}">
                                    💬 Comment${project.notesComments?.length ? ` (${project.notesComments.length})` : ''}
                                </button>
                            ` : ''}
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
    });
    
    projectsList.innerHTML = html;
}

function renderActions(project) {
    if (!project.actions || project.actions.length === 0) {
        return '<p class="text-sm" style="color: var(--text-tertiary);">No actions yet</p>';
    }
    
    let html = '';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    project.actions.forEach(action => {
        let dueDateClass = '';
        let dueDateText = '';

        if (action.due_date) {
            dueDateText = formatDisplayDate(action.due_date);
            if (action.due_date <= todayStr) {
                // On or past due date → overdue
                dueDateClass = 'overdue';
            } else {
                const daysLeft = Math.ceil((new Date(action.due_date) - today) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) {
                    dueDateClass = 'due-soon';
                }
            }
        }
        
        const commentsCount = action.comments ? action.comments.length : 0;
        
        html += `
            <div class="action-item" data-action-id="${action.id}">
                <div class="action-text">${escapeHtml(action.text)}</div>
                ${action.due_date ? `
                    <div class="action-due-date ${dueDateClass}">${dueDateText}</div>
                ` : ''}
                ${currentUser?.role === 'commenter' || currentUser?.role === 'editor' ? `
                    <button class="action-comments" data-action="view-comments" data-project-id="${project.id}" data-action-id="${action.id}">
                        💬 ${commentsCount}
                    </button>
                ` : ''}
                ${currentUser?.role === 'editor' ? `
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-small" data-action="edit-action" data-project-id="${project.id}" data-action-id="${action.id}">
                            Edit
                        </button>
                        <button class="btn btn-small" data-action="delete-action" data-project-id="${project.id}" data-action-id="${action.id}">
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    return html;
}

// ------------------------------------------------------------
// Project CRUD
// ------------------------------------------------------------
function openProjectModal(projectId = null) {
    currentProjectId = projectId;
    
    if (projectId) {
        // Edit mode
        const project = store.getProject(projectId);
        if (!project) return;
        
        projectTitleInput.value = project.title;
        projectDetailsInput.value = project.details;
        projectNotesInput.value = project.notes;
        projectStatusInput.checked = project.status === 'open';
    } else {
        // Create mode
        projectTitleInput.value = '';
        projectDetailsInput.value = '';
        projectNotesInput.value = '';
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
        notes: projectNotesInput.value.trim()
    };
    
    if (!projectData.title) {
        alert('Project title is required');
        return;
    }
    
    if (currentProjectId) {
        // Update existing project
        store.updateProject(currentProjectId, projectData);
        if (!projectStatusInput.checked) {
            store.updateProject(currentProjectId, { status: 'closed' });
        } else {
            store.updateProject(currentProjectId, { status: 'open' });
        }
    } else {
        // Create new project
        store.createProject(projectData);
    }
    
    closeProjectModal();
    renderProjects();
}

// ------------------------------------------------------------
// Action CRUD
// ------------------------------------------------------------
function openActionModal(projectId, actionId = null) {
    currentProjectId = projectId;
    currentActionId = actionId;
    
    if (actionId) {
        // Edit mode
        const project = store.getProject(projectId);
        if (!project) return;
        const action = project.actions.find(a => a.id === actionId);
        if (!action) return;
        
        actionTextInput.value = action.text;
        actionDueDateInput.value = action.due_date || '';
    } else {
        // Create mode
        actionTextInput.value = '';
        actionDueDateInput.value = '';
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
        due_date: actionDueDateInput.value
    };
    
    if (!actionData.text) {
        alert('Action text is required');
        return;
    }
    
    if (currentActionId) {
        // Update existing action
        store.updateAction(currentProjectId, currentActionId, actionData);
    } else {
        // Create new action
        store.addAction(currentProjectId, actionData);
    }
    
    closeActionModal();
    renderProjects();
}

// ------------------------------------------------------------
// Settings
// ------------------------------------------------------------
function openSettings() {
    settingsPanel.classList.add('open');
    settingsPanel.classList.remove('hidden');
    overlay.classList.remove('hidden');
    renderSettings();
}

function closeSettings() {
    settingsPanel.classList.remove('open');
    settingsPanel.classList.add('hidden');
    overlay.classList.add('hidden');
}

function renderSettings() {
    renderVersions();
    renderUsers();
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
// Event Delegation
// ------------------------------------------------------------
function handleClick(event) {
    const target = event.target;
    const action = target.getAttribute('data-action');
    const projectId = target.getAttribute('data-project-id');
    const actionId = target.getAttribute('data-action-id');
    const versionId = target.getAttribute('data-version-id');
    const username = target.getAttribute('data-username');
    
    if (!action) return;
    
    event.preventDefault();
    
    switch (action) {
        // Project actions
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
            }
            break;
        case 'toggle-status':
            store.toggleProjectStatus(projectId);
            renderProjects();
            break;
        case 'toggle-project':
            if (collapsedProjects.has(projectId)) {
                collapsedProjects.delete(projectId);
            } else {
                collapsedProjects.add(projectId);
            }
            renderProjects();
            break;
        
        // Action actions
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
            }
            break;
        
        // Comment actions
        case 'add-notes-comment':
            openCommentModal(projectId, null);
            break;
        case 'view-comments':
            openCommentModal(projectId, actionId);
            break;
        
        // Settings actions
        case 'restore-version':
            if (confirm('Restore this version? Current unsaved changes will be lost.')) {
                store.restoreVersion(versionId);
                renderProjects();
                closeSettings();
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
    // Scroll to bottom to show latest
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

    // Refresh comments list
    const project = store.getProject(projectId);
    let comments;
    if (actionId) {
        const action = project?.actions.find(a => a.id === actionId);
        comments = action?.comments || [];
    } else {
        comments = project?.notesComments || [];
    }
    renderCommentsList(comments);
    renderProjects(); // update comment count badges
}

// ------------------------------------------------------------
// Import/Export
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
        } else {
            alert('Failed to import data. Invalid format.');
        }
    };
    reader.readAsText(file);
    
    // Reset input
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

function showNotification(message) {
    // Simple notification for now
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

// ------------------------------------------------------------
// Event Listeners
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    initTheme();
    initLayout();
    initAuth();
    
    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    themeToggle.addEventListener('click', toggleTheme);
    layoutToggle.addEventListener('click', toggleLayout);
    settingsToggle.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    addProjectBtn.addEventListener('click', () => openProjectModal());
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
    importBtn.addEventListener('click', importData);
    importFileInput.addEventListener('change', handleFileImport);
    saveVersionBtn.addEventListener('click', () => {
        const label = prompt('Version label (optional):');
        store.saveVersion(label);
        renderVersions();
        showNotification('Version saved!');
    });
    
    // Event delegation
    document.addEventListener('click', handleClick);
    
    // Handle escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeProjectModal();
            closeActionModal();
            closeCommentModal();
            closeSettings();
        }
    });
});

// ------------------------------------------------------------
// Offline detection
// ------------------------------------------------------------
window.addEventListener('online', () => {
    showNotification('Back online');
});

window.addEventListener('offline', () => {
    showNotification('Working offline');
});