// dashboard.js
const Dashboard = {
    render: async (container) => {
        const user = Auth.getUser();

        container.innerHTML = `
            <!-- Energetic Greeting Banner -->
            <div class="gradient-banner">
                <h3>Welcome back, ${user.full_name}! 👋</h3>
                <p>Role: ${user.role} | Area: ${user.allocation || 'General'}</p>
            </div>

            <!-- Quick Action Row -->
            <div class="quick-actions">
                <a href="#discipline_form" class="action-card fade-in" style="animation-delay: 0.1s;">
                    <i class='bx bx-edit-alt action-icon'></i>
                    Draft Report
                </a>
                <a href="#statements" class="action-card fade-in" style="animation-delay: 0.2s;">
                    <i class='bx bx-message-square-detail action-icon'></i>
                    Statements
                </a>
                <a href="#tasks" class="action-card fade-in" style="animation-delay: 0.3s;">
                    <i class='bx bx-task action-icon'></i>
                    Assign Task
                </a>
                <a href="#standings" class="action-card fade-in" style="animation-delay: 0.4s;">
                    <i class='bx bx-line-chart action-icon'></i>
                    View Standings
                </a>
            </div>

            <!-- Announcements Panel (Full Width at Top) -->
            <div class="glass-panel" style="margin-bottom: 25px;">
                <div class="panel-header">
                    <h4 class="panel-title"><i class='bx bx-bell' style="color:var(--accent-color)"></i> Latest Announcements</h4>
                    <a href="#announcements" class="btn btn-sm" style="background: rgba(0,0,0,0.05); color: var(--text-secondary); border-radius: 20px;">View All</a>
                </div>
                <div id="homeAnnouncements">
                    <p style="color: #888; font-size: 0.9rem;"><i class='bx bx-loader bx-spin'></i> Loading broadcasts...</p>
                </div>
            </div>

            <!-- Dashboard Grid Area (Stats & Staff Side-by-Side) -->
            <div class="layout-grid layout-grid-2">
                <!-- Left Column: Stats -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; grid-auto-rows: min-content;">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-title">Pending Tasks</span>
                            <div class="stat-icon warning"><i class='bx bx-time-five'></i></div>
                        </div>
                        <div class="stat-value warning" id="statPending">...</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-title">Cases Today</span>
                            <div class="stat-icon danger"><i class='bx bx-shield-quarter'></i></div>
                        </div>
                        <div class="stat-value danger" id="statCases">...</div>
                    </div>
                </div>

                <!-- Right Column: Active Staff -->
                <div class="glass-panel admin-only hidden" data-role="admin" style="margin-bottom: 0;">
                    <div class="panel-header">
                        <h4 class="panel-title"><i class='bx bx-radar' style="color:var(--primary-light)"></i> Live Staff Network</h4>
                        <span class="badge badge-success" style="font-size:0.8rem;"><span id="statActive">0</span> Online</span>
                    </div>
                    <div id="activeStaffList" class="staff-grid" style="min-height: 50px;">
                        <p style="color: #888; font-size: 0.9rem;"><i class='bx bx-loader bx-spin'></i> Scanning network...</p>
                    </div>
                </div>
            </div>
        `;

        // Load Data concurrently
        Dashboard.loadAnnouncements();
        Dashboard.loadStats();

        // Only load active staff if the user has access and it's visible.
        // Delayed slightly so that Auth.check() has a chance to remove .hidden class first.
        setTimeout(() => {
            const activeStaffList = document.getElementById('activeStaffList');
            if (activeStaffList && !activeStaffList.closest('.hidden')) {
                Dashboard.loadActiveStaff();
            }
        }, 50);

        Dashboard.startPolling();
    },

    refreshInterval: null,

    startPolling: () => {
        Dashboard.stopPolling();
        Dashboard.refreshInterval = setInterval(() => {
            Dashboard.loadAnnouncements();
            Dashboard.loadStats();

            const activeStaffList = document.getElementById('activeStaffList');
            if (activeStaffList && !activeStaffList.closest('.hidden')) {
                Dashboard.loadActiveStaff();
            }
        }, 60000); // 60 seconds (optimized from 30s)
    },

    stopPolling: () => {
        if (Dashboard.refreshInterval) {
            clearInterval(Dashboard.refreshInterval);
            Dashboard.refreshInterval = null;
        }
    },

    loadAnnouncements: async () => {
        try {
            const res = await fetch('/api/announcements');
            const data = await res.json();
            const el = document.getElementById('homeAnnouncements');

            if (data.success && data.announcements.length) {
                const recent = data.announcements.slice(0, 3); // Show top 3
                el.innerHTML = recent.map(a => `
                    <div class="announcement-item fade-in">
                        <div class="announcement-title">${a.title}</div>
                        <div class="announcement-text">${a.content}</div>
                        <div class="announcement-meta">
                            <i class='bx bx-calendar-event'></i> ${new Date(a.created_at).toLocaleDateString()}
                        </div>
                    </div>
                `).join('');
            } else {
                el.innerHTML = '<p style="color: #888; padding: 20px; text-align: center;"><i class="bx bx-info-circle"></i> No announcements right now.</p>';
            }
        } catch (e) { }
    },

    loadStats: async () => {
        try {
            // Stats from reports
            const res = await fetch('/api/reports/stats');
            const data = await res.json();
            if (data.success) {
                const pending = data.stats.tasks.find(t => t.status === 'Pending');
                document.getElementById('statPending').textContent = pending ? pending.count : 0;

                // Accurate todayCases from backend, or fallback to sum of all offence types
                const totalCases = data.stats.todayCases !== undefined ? data.stats.todayCases :
                    data.stats.offences.reduce((acc, curr) => acc + curr.count, 0);
                document.getElementById('statCases').textContent = totalCases;
            }
        } catch (e) { }
    },

    loadActiveStaff: async () => {
        try {
            const res = await fetch('/api/users/log/activity');
            if (!res.ok) throw new Error('API request failed');

            const data = await res.json();
            const el = document.getElementById('statActive');
            const list = document.getElementById('activeStaffList');

            if (data.success) {
                if (el) el.textContent = data.active.length;
                if (list) {
                    if (data.active.length) {
                        list.innerHTML = data.active.map((u, i) => `
                            <div class="staff-chip fade-in" style="animation-delay: ${0.1 * i}s">
                                <span class="pulse-dot"></span>
                                ${u.full_name} 
                                <span class="staff-role">${u.role}</span>
                            </div>
                        `).join('');
                    } else {
                        list.innerHTML = '<p style="color: #888; padding: 10px; text-align: center;">No activity recorded yet today.</p>';
                    }
                }
            } else {
                if (list) list.innerHTML = `<p style="color: var(--danger); padding: 10px;">Error: ${data.error || 'Failed to load staff activity'}</p>`;
            }
        } catch (e) {
            console.error("Dashboard staff load error:", e);
            const list = document.getElementById('activeStaffList');
            if (list) list.innerHTML = '<p style="color: var(--danger); padding: 10px;"><i class="bx bx-wifi-off"></i> Unable to connect to activity server.</p>';
        }
    }
};
