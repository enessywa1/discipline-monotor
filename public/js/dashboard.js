// dashboard.js
const Dashboard = {
    render: async (container) => {
        const user = Auth.getUser();

        container.innerHTML = `
            <div class="welcome-banner" style="margin-bottom: 20px;">
                <h3>Hello, ${user.full_name} 👋</h3>
                <p style="color: var(--text-secondary);">Role: ${user.role} | ${user.allocation || 'General'}</p>
            </div>

            <!-- 1. Announcements (First Priority) -->
            <div class="card" style="margin-bottom: 30px; border-left: 5px solid var(--accent-color);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/logo.png" style="width: 25px; height: 25px; border-radius: 50%;">
                        <h3 style="margin: 0;">Announcements</h3>
                    </div>
                    <a href="#announcements" style="font-size: 0.9rem;">View All</a>
                </div>
                <div id="homeAnnouncements" style="margin-top: 15px;">
                    <p>Loading...</p>
                </div>
            </div>

            <!-- 2. Statistics Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="card">
                    <h4 style="color: var(--text-secondary); font-size: 0.9rem;">Pending Tasks</h4>
                    <div id="statPending" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">...</div>
                </div>
                <div class="card">
                    <h4 style="color: var(--text-secondary); font-size: 0.9rem;">Cases (Today)</h4>
                    <div id="statCases" style="font-size: 2rem; font-weight: bold; color: #d32f2f;">...</div>
                </div>
                <div class="card admin-only hidden" data-role="admin">
                    <h4 style="color: var(--text-secondary); font-size: 0.9rem;">Staff Active Today</h4>
                    <div id="statActive" style="font-size: 2rem; font-weight: bold; color: var(--accent-color);">...</div>
                </div>
                <div class="card" data-role="all" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--primary-color);">
                    <div>
                        <h4 style="color: var(--text-secondary); font-size: 0.9rem;">Detention Records</h4>
                        <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">Manage student detentions</p>
                    </div>
                    <a href="#detentions" class="btn btn-sm" style="background: var(--primary-color); color: white; margin-top: 15px; text-align: center;">Open Page</a>
                </div>
            </div>

            <div class="layout-grid admin-only hidden" data-role="admin" style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                <div class="card">
                    <h4>Active Staff Today</h4>
                    <div id="activeStaffList" style="font-size: 0.9rem; max-height: 300px; overflow-y: auto;">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        `;

        // Load Data concurrently
        // Load Data concurrently
        Dashboard.loadAnnouncements();
        Dashboard.loadStats();
        Dashboard.loadActiveStaff();

        Dashboard.startPolling();
    },

    refreshInterval: null,

    startPolling: () => {
        Dashboard.stopPolling();
        Dashboard.refreshInterval = setInterval(() => {
            Dashboard.loadAnnouncements();
            Dashboard.loadStats();
            Dashboard.loadActiveStaff();
        }, 30000); // 30 seconds
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
                const recent = data.announcements.slice(0, 2); // Show top 2
                el.innerHTML = recent.map(a => `
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                        <strong>${a.title}</strong>
                        <p style="font-size: 0.9rem; color: #444; margin-top: 4px;">${a.content}</p>
                        <small style="color: #999;">${new Date(a.created_at).toLocaleDateString()}</small>
                    </div>
                `).join('');
            } else {
                el.innerHTML = '<p style="color: #888;">No recent announcements.</p>';
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
            const data = await res.json();
            const el = document.getElementById('statActive');
            const list = document.getElementById('activeStaffList');

            if (data.success) {
                el.textContent = data.active.length;
                if (data.active.length) {
                    list.innerHTML = data.active.map(u => `
                        <div style="padding: 5px 0; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                            <div style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; margin-right: 8px;"></div>
                            ${u.full_name} <span style="font-size: 0.8rem; color: #888; margin-left: 5px;">(${u.role})</span>
                        </div>
                    `).join('');
                } else {
                    list.innerHTML = '<p>No activity recorded yet today.</p>';
                }
            }
        } catch (e) { }
    }
};
