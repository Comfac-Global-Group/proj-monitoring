// Test script for store.js
// Run with: node test-store.js

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem(key) {
            return store[key] || null;
        },
        setItem(key, value) {
            store[key] = String(value);
        },
        removeItem(key) {
            delete store[key];
        },
        clear() {
            store = {};
        }
    };
})();

global.localStorage = localStorageMock;

// Clear before tests
localStorage.clear();

async function runTests() {
    // Import store after mocking
    const { store, getTimestamp, isoToTimestamp, timestampToIso, formatDisplayDate } = await import('./store.js');
    
    console.log('Testing POMM Store...\n');
    
    let passed = 0;
    let failed = 0;
    
    function assert(condition, message) {
        if (condition) {
            console.log(`✓ ${message}`);
            passed++;
        } else {
            console.error(`✗ ${message}`);
            failed++;
        }
    }
    
    // Test utilities
    console.log('1. Testing utilities...');
    const timestamp = getTimestamp();
    assert(timestamp.length === 13, `Timestamp length should be 13 (got ${timestamp})`);
    assert(/^\d{6}-\d{6}$/.test(timestamp), `Timestamp format should be yymmdd-hhmmss (got ${timestamp})`);
    
    const iso = '2026-04-15T14:30:22';
    const convertedTimestamp = isoToTimestamp(iso);
    assert(convertedTimestamp === '260415-143022', `isoToTimestamp should convert correctly (got ${convertedTimestamp})`);
    
    const convertedIso = timestampToIso('260415-143022');
    assert(convertedIso.startsWith('2026-04-15T14:30:22'), `timestampToIso should convert correctly (got ${convertedIso})`);
    
    const displayDate = formatDisplayDate('2026-04-15');
    assert(displayDate === '15 Apr 2026', `formatDisplayDate should format correctly (got ${displayDate})`);
    
    // Test authentication
    console.log('\n2. Testing authentication...');
    const user = store.authenticate('admin', 'admin');
    assert(user !== null, 'Admin user should authenticate');
    assert(user.role === 'editor', 'Admin role should be editor');
    
    const invalidUser = store.authenticate('admin', 'wrong');
    assert(invalidUser === null, 'Invalid password should not authenticate');
    
    // Test RBAC permissions
    console.log('\n3. Testing RBAC permissions...');
    assert(store.hasPermission('editor', 'edit'), 'Editor should have edit permission');
    assert(store.hasPermission('editor', 'comment'), 'Editor should have comment permission');
    assert(store.hasPermission('commenter', 'comment'), 'Commenter should have comment permission');
    assert(!store.hasPermission('commenter', 'edit'), 'Commenter should not have edit permission');
    assert(store.hasPermission('viewer', 'view'), 'Viewer should have view permission');
    assert(!store.hasPermission('viewer', 'edit'), 'Viewer should not have edit permission');
    
    // Test project CRUD
    console.log('\n4. Testing project CRUD...');
    const initialCount = store.getProjects().length;
    const project = store.createProject({ title: 'Test Project', details: 'Test details' });
    assert(project.id, 'Project should have an ID');
    assert(project.title === 'Test Project', 'Project title should match');
    assert(project.status === 'open', 'New project should be open');
    assert(store.getProjects().length === initialCount + 1, 'Project count should increase');
    
    const fetchedProject = store.getProject(project.id);
    assert(fetchedProject !== null, 'Should retrieve project by ID');
    assert(fetchedProject.title === 'Test Project', 'Retrieved project title should match');
    
    store.updateProject(project.id, { title: 'Updated Title' });
    const updatedProject = store.getProject(project.id);
    assert(updatedProject.title === 'Updated Title', 'Project title should update');
    
    store.toggleProjectStatus(project.id);
    const toggledProject = store.getProject(project.id);
    assert(toggledProject.status === 'closed', 'Project status should toggle to closed');
    
    store.toggleProjectStatus(project.id);
    const reopenedProject = store.getProject(project.id);
    assert(reopenedProject.status === 'open', 'Project status should toggle back to open');
    
    // Test action CRUD
    console.log('\n5. Testing action CRUD...');
    const action = store.addAction(project.id, { text: 'Test action', due_date: '2026-12-31' });
    assert(action.id, 'Action should have an ID');
    assert(action.text === 'Test action', 'Action text should match');
    assert(action.due_date === '2026-12-31', 'Action due date should match');
    
    const projectWithAction = store.getProject(project.id);
    assert(projectWithAction.actions.length === 1, 'Project should have one action');
    
    store.updateAction(project.id, action.id, { text: 'Updated action' });
    const updatedAction = projectWithAction.actions.find(a => a.id === action.id);
    assert(updatedAction.text === 'Updated action', 'Action text should update');
    
    store.deleteAction(project.id, action.id);
    const projectAfterDelete = store.getProject(project.id);
    assert(projectAfterDelete.actions.length === 0, 'Action should be deleted');
    
    // Test comment CRUD
    console.log('\n6. Testing comment CRUD...');
    const action2 = store.addAction(project.id, { text: 'Action for comments' });
    const comment = store.addActionComment(project.id, action2.id, 'admin', 'Test comment');
    assert(comment.id, 'Comment should have an ID');
    assert(comment.author === 'admin', 'Comment author should match');
    assert(comment.text === 'Test comment', 'Comment text should match');
    
    const projectWithComment = store.getProject(project.id);
    const actionWithComment = projectWithComment.actions.find(a => a.id === action2.id);
    assert(actionWithComment.comments.length === 1, 'Action should have one comment');
    
    // Test version snapshots
    console.log('\n7. Testing version snapshots...');
    const versionsBefore = store.getVersions().length;
    store.saveVersion('Test version');
    const versionsAfter = store.getVersions().length;
    assert(versionsAfter === versionsBefore + 1, 'Version count should increase');
    
    const versions = store.getVersions();
    const latestVersion = versions[0];
    assert(latestVersion.label === 'Test version', 'Version label should match');
    assert(latestVersion.data.projects.length > 0, 'Version should contain projects');
    
    // Test import/export
    console.log('\n8. Testing import/export...');
    const exported = store.exportData();
    assert(typeof exported === 'string', 'Export should return string');
    assert(exported.includes('Updated Title'), 'Exported data should contain test project');
    
    // Clean up
    store.deleteProject(project.id);
    assert(store.getProjects().length === initialCount, 'Project count should return to initial after delete');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Tests passed: ${passed}`);
    console.log(`Tests failed: ${failed}`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
        console.log('All tests passed! 🎉');
        process.exit(0);
    } else {
        console.error('Some tests failed.');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});