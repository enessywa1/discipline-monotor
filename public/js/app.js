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
            window.socket.on('server_init', (data) => {
                const lastBootTime = sessionStorage.getItem('server_boot_time');
                if (lastBootTime && lastBootTime !== data.bootTime.toString()) {
                    console.log('🔄 Server restarted, reloading page...');
                    window.location.reload();
                } else {
                    sessionStorage.setItem('server_boot_time', data.bootTime);
                }
            });

            window.socket.on('dashboard_update', (data) => {
                App.handleUpdate(data);
            });
        }
    },

    handleUpdate: (data) => {
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
    }
};

document.addEventListener('DOMContentLoaded', App.init);
