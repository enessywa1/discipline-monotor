// app.js

const Utils = {
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
};

const App = {
    init: () => {
        App.setupNavigation();
        App.setupSidebar();
        App.loadViewFromHash();

        // Initialize Socket.io
        if (typeof io !== 'undefined') {
            window.socket = io();
            window.socket.on('connect', () => console.log('🟢 Connected to real-time server'));

            // Handle Live Reload
            // Handle Live Reload - DISABLED
            // window.socket.on('server_init', (data) => { ... });


            window.socket.on('dashboard_update', (data) => {
                App.handleUpdate(data);
            });
        }
    },

    handleUpdate: (data) => {
        // Refresh Notification Badge
        if (typeof Notifications !== 'undefined' && Notifications.load) {
            Notifications.load();
        }

        // Refresh current view if applicable
        const view = window.location.hash.substring(1) || 'dashboard';

        if (view === 'dashboard' && typeof Dashboard !== 'undefined') {
            // Dashboard updates are selective if data.type exists
            if (!data.type || ['task', 'report', 'statement', 'announcement', 'standings'].includes(data.type)) {
                Dashboard.loadStats();
                Dashboard.loadAnnouncements();
            }
        }

        if (view === 'tasks' && typeof Tasks !== 'undefined' && data.type === 'task') {
            if (Tasks.loadTasks) Tasks.loadTasks(true);
        }

        if (view === 'recent_submissions' && typeof RecentSubmissions !== 'undefined' && data.type === 'report') {
            if (RecentSubmissions.load) RecentSubmissions.load();
        }

        if (view === 'statements' && typeof Statements !== 'undefined' && data.type === 'statement') {
            if (Statements.load) Statements.load();
        }

        if (view === 'detentions' && typeof Detentions !== 'undefined' && data.type === 'detention') {
            if (Detentions.load) Detentions.load();
        }

        if (view === 'suspensions' && typeof Suspensions !== 'undefined' && data.type === 'suspension') {
            if (Suspensions.load) Suspensions.load();
        }
    },

    setupNavigation: () => {
        // Handle hash changes
        window.addEventListener('hashchange', App.loadViewFromHash);

        // Handle nav clicks to update active state
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                // Mobile: close sidebar on click
                if (window.innerWidth <= 768) {
                    App.toggleSidebar(false);
                }
            });
        });
    },

    setupSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        // Matches the ID in dashboard.html
        const openBtn = document.getElementById('menu-btn');

        if (openBtn) openBtn.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('open');
            App.toggleSidebar(!isOpen);
        });

        if (overlay) overlay.addEventListener('click', () => App.toggleSidebar(false));
    },

    toggleSidebar: (show) => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const closeBtn = document.getElementById('sidebarClose');

        if (show) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            if (closeBtn) closeBtn.style.display = 'block';
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            if (closeBtn) closeBtn.style.display = 'none';
        }
    },

    loadViewFromHash: () => {
        const hash = window.location.hash.substring(1) || 'dashboard';
        App.renderView(hash);

        // Update Active Nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.view === hash) el.classList.add('active');
        });
    },

    renderView: (viewName) => {
        App.cleanup();
        const container = document.getElementById('view-container');
        const title = document.getElementById('pageTitle');

        container.innerHTML = '<p>Loading...</p>';
        container.classList.remove('fade-in');
        void container.offsetWidth; // trigger reflow
        container.classList.add('fade-in');

        // Simple Router
        switch (viewName) {
            case 'dashboard':
                title.textContent = 'Dashboard';
                Dashboard.render(container);
                break;
            case 'tasks':
                title.textContent = 'Task Management';
                Tasks.render(container);
                break;
            case 'statements':
                title.textContent = 'Discipline Statements';
                Statements.render(container);
                break;
            case 'reports':
                title.textContent = 'Weekly Reports';
                Reports.render(container);
                break;
            case 'general_reports':
                title.textContent = 'General Overall Reports';
                GeneralReports.render(container);
                break;
            case 'discipline_form':
                title.textContent = 'Discipline Form';
                DisciplineForm.render(container);
                break;
            case 'standings':
                title.textContent = 'Performance Standings';
                Standings.render(container);
                break;
            case 'announcements':
                title.textContent = 'Announcements';
                Announcements.render(container);
                break;
            case 'users':
                title.textContent = 'Staff Management';
                Users.render(container);
                break;
            case 'recent_submissions':
                title.textContent = 'All Submissions';
                RecentSubmissions.render(container);
                break;
            case 'tracking':
                title.textContent = 'Student Tracking';
                Tracking.render(container);
                break;
            case 'detentions':
                title.textContent = 'Detention Records';
                Detentions.render(container);
                break;
            case 'suspensions':
                title.textContent = 'Suspensions & Expulsions';
                Suspensions.render(container);
                break;
            case 'about':
                title.textContent = 'About System';
                About.render(container);
                break;
            default:
                title.textContent = 'Page Not Found';
                container.innerHTML = '<p>The requested view does not exist.</p>';
        }

        // Always check role-based visibility after rendering a view
        if (typeof Auth !== 'undefined' && Auth.check) {
            Auth.check();
        }
    },

    cleanup: () => {
        if (typeof Dashboard !== 'undefined' && Dashboard.stopPolling) Dashboard.stopPolling();
        if (typeof Tasks !== 'undefined' && Tasks.stopPolling) Tasks.stopPolling();
        if (typeof RecentSubmissions !== 'undefined' && RecentSubmissions.stopPolling) RecentSubmissions.stopPolling();
    },

    formatDescription: (raw) => {
        if (!raw) return 'No description provided.';
        try {
            const data = JSON.parse(raw);
            if (typeof data !== 'object') return raw;

            // Define labels for keys
            const labels = {
                class: 'Class',
                stream: 'Stream',
                gender: 'Gender',
                phone: 'Staff Phone',
                dept: 'Department',
                forward: 'Forwarded To'
            };

            return `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 5px;">
                    ${Object.entries(data).map(([key, val]) => `
                        <div style="font-size: 0.8rem; line-height: 1.4;">
                            <strong style="color: #666; text-transform: uppercase; font-size: 0.7rem;">${labels[key] || key}:</strong><br>
                            <span style="color: var(--text-primary); font-weight: 500;">${val || '-'}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            return raw;
        }
    },

    Editor: {
        open: async (id, type) => {
            const user = Auth.getUser();
            if (!user || (user.role || '').toLowerCase() !== 'discipline master') {
                alert('Unauthorized: Discipline Master role required to edit.');
                return;
            }

            // Show global loader if needed, or just loading in modal
            const modalBody = `
                <div class="modal-overlay" id="globalEditorModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit ${type === 'statement' ? 'Statement' : 'Discipline Report'}</h3>
                            <button class="modal-close" onclick="App.Editor.close()">&times;</button>
                        </div>
                        <div id="editorModalBody">
                            <p style="text-align: center; padding: 20px;">Fetching record details...</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalBody);

            try {
                const endpoint = `/api/discipline/${type}s`;
                const res = await fetch(endpoint);
                const data = await res.json();

                const list = type === 'statement' ? data.statements : data.reports;
                const item = list.find(it => it.id == id);

                if (!item) throw new Error('Record not found.');

                App.Editor.renderForm(item, type);
            } catch (err) {
                document.getElementById('editorModalBody').innerHTML = `<p style="color:red; text-align:center;">${err.message}</p>`;
            }
        },

        renderForm: (item, type) => {
            const container = document.getElementById('editorModalBody');

            // For reports, description is often structured JSON
            let isStructured = false;
            let details = {};
            let rawDescription = item.description || '';

            if (type === 'report' && rawDescription.trim().startsWith('{')) {
                try {
                    details = JSON.parse(rawDescription);
                    isStructured = true;
                } catch (e) {
                    console.warn('Failed to parse description JSON', e);
                }
            }

            container.innerHTML = `
                <form id="globalEditorForm">
                    <input type="hidden" name="id" value="${item.id}">
                    <input type="hidden" name="type" value="${type}">
                    <input type="hidden" name="is_structured" value="${isStructured}">
                    
                    <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Student Name</label>
                            <input type="text" name="student_name" value="${item.student_name}" required>
                        </div>
                        <div class="form-group">
                            <label>Class</label>
                            <input type="text" name="student_class" value="${item.student_class || ''}">
                        </div>
                    </div>

                    <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" name="date" value="${new Date(item.incident_date || item.date_reported).toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>Offence</label>
                            <input type="text" name="offence" value="${item.offence_type || item.offence}" required>
                        </div>
                    </div>

                    ${isStructured ? `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee;">
                            <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #888; margin-bottom: 10px;">Structured Details</h4>
                            <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="form-group" style="margin-bottom: 5px;">
                                    <label style="font-size: 0.7rem;">Stream</label>
                                    <input type="text" name="detail_stream" value="${details.stream || ''}" style="padding: 5px; font-size: 0.85rem;">
                                </div>
                                <div class="form-group" style="margin-bottom: 5px;">
                                    <label style="font-size: 0.7rem;">Gender</label>
                                    <input type="text" name="detail_gender" value="${details.gender || ''}" style="padding: 5px; font-size: 0.85rem;">
                                </div>
                                <div class="form-group" style="margin-bottom: 5px;">
                                    <label style="font-size: 0.7rem;">Staff Phone</label>
                                    <input type="text" name="detail_phone" value="${details.phone || ''}" style="padding: 5px; font-size: 0.85rem;">
                                </div>
                                <div class="form-group" style="margin-bottom: 5px;">
                                    <label style="font-size: 0.7rem;">Department</label>
                                    <input type="text" name="detail_dept" value="${details.dept || ''}" style="padding: 5px; font-size: 0.85rem;">
                                </div>
                                <div class="form-group" style="margin-bottom: 5px;">
                                    <label style="font-size: 0.7rem;">Forward To</label>
                                    <select name="detail_forward" style="padding: 5px; font-size: 0.85rem; width: 100%;">
                                        ${['None', 'Discipline Master', 'Head Patron', 'Head Matron', 'Pastor', 'Counseling', 'Principal'].map(opt => `
                                            <option value="${opt}" ${details.forward === opt ? 'selected' : ''}>${opt}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" name="description" value=""> <!-- Placeholder if structured -->
                    ` : `
                        <div class="form-group">
                            <label>Description / Details</label>
                            <textarea name="description" rows="4" style="width:100%">${rawDescription}</textarea>
                        </div>
                    `}

                    <div class="form-group">
                        <label>Action / Punitive Measure</label>
                        <textarea name="action" rows="3" style="width:100%">${item.punitive_measure || item.action_taken || ''}</textarea>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="App.Editor.close()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `;

            document.getElementById('globalEditorForm').onsubmit = App.Editor.handleSave;
        },

        handleSave: async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            const btn = e.target.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Saving...";

            let finalDescription = data.description;
            if (data.is_structured === 'true') {
                const details = {
                    class: data.student_class,
                    stream: data.detail_stream,
                    gender: data.detail_gender,
                    phone: data.detail_phone,
                    dept: data.detail_dept,
                    forward: data.detail_forward
                };
                finalDescription = JSON.stringify(details);
            }

            const payload = {
                student_name: data.student_name,
                student_class: data.student_class,
                offence: data.offence, // handles both
                offence_type: data.offence,
                description: finalDescription,
                date_reported: data.date,
                incident_date: data.date,
                action_taken: data.action,
                punitive_measure: data.action
            };

            try {
                const res = await fetch(`/api/discipline/${data.type}s/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.success) {
                    App.Editor.close();

                    // Trigger global refresh
                    if (window.socket && window.socket.emit) {
                        // Notify others if needed, though handleUpdate will catch own updates usually
                    }

                    // Force refresh current view
                    const hash = window.location.hash.substring(1) || 'dashboard';
                    App.renderView(hash);

                    // Simple Toast if exists or alert
                    alert('Record updated successfully');
                } else {
                    alert('Error: ' + result.error);
                    btn.disabled = false;
                    btn.innerHTML = "Save Changes";
                }
            } catch (err) {
                alert('Connection failed');
                btn.disabled = false;
                btn.innerHTML = "Save Changes";
            }
        },

        close: () => {
            const modal = document.getElementById('globalEditorModal');
            if (modal) modal.remove();
        }
    }
};

document.addEventListener('DOMContentLoaded', App.init);
