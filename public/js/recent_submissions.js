const RecentSubmissions = {
    render: async (container) => {
        container.innerHTML = `
            <div class="card" id="recentSubmissionsContainer">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Recent Submissions</h3>
                    <div style="display: flex; gap: 10px;">
                        <select id="filterType" style="padding: 8px; border-radius: 6px; border: 2px solid #e0e0e0;">
                            <option value="all">All Types</option>
                            <option value="statements">Statements Only</option>
                            <option value="reports">Discipline Reports Only</option>
                        </select>
                        <button class="btn btn-sm btn-primary" data-action="refresh">
                            <i class='bx bx-refresh'></i> Refresh
                        </button>
                    </div>
                </div>

                <div id="submissionsContainer">
                    <p style="text-align: center; padding: 40px; color: grey;">Loading submissions...</p>
                </div>
            </div>
        `;

        // Delegated Event Listener
        container.addEventListener('click', (e) => {
            const refreshBtn = e.target.closest('[data-action="refresh"]');
            if (refreshBtn) {
                RecentSubmissions.refresh();
                return;
            }

            const card = e.target.closest('.submission-card');
            if (card) {
                card.classList.toggle('expanded');
            }
        });

        const filter = document.getElementById('filterType');
        if (filter) filter.addEventListener('change', () => RecentSubmissions.loadSubmissions());

        RecentSubmissions.loadSubmissions();
        RecentSubmissions.startPolling();
    },

    refreshInterval: null,

    startPolling: () => {
        RecentSubmissions.stopPolling();
        RecentSubmissions.refreshInterval = setInterval(() => {
            RecentSubmissions.loadSubmissions(true);
        }, 30000);
    },

    stopPolling: () => {
        if (RecentSubmissions.refreshInterval) {
            clearInterval(RecentSubmissions.refreshInterval);
            RecentSubmissions.refreshInterval = null;
        }
    },

    refresh: () => {
        RecentSubmissions.loadSubmissions();
    },

    loadSubmissions: async (isQuiet = false) => {
        const container = document.getElementById('submissionsContainer');
        if (!container) return;

        const filterEl = document.getElementById('filterType');
        const filterType = filterEl ? filterEl.value : 'all';

        if (!isQuiet) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: grey;">Loading...</p>';
        }

        try {
            const [statementsRes, reportsRes] = await Promise.all([
                fetch('/api/discipline/statements'),
                fetch('/api/discipline/reports')
            ]);

            const statementsData = await statementsRes.json();
            const reportsData = await reportsRes.json();

            let items = [];

            if (filterType === 'all' || filterType === 'statements') {
                const statements = statementsData.statements || [];
                items = items.concat(statements.map(s => ({
                    type: 'statement',
                    date: s.created_at || s.incident_date,
                    student: s.student_name,
                    student_class: s.student_class,
                    offence: s.offence_type,
                    description: s.description,
                    action: s.punitive_measure,
                    recorder: s.recorder_name || 'Unknown'
                })));
            }

            if (filterType === 'all' || filterType === 'reports') {
                const reports = reportsData.reports || [];
                items = items.concat(reports.map(r => ({
                    type: 'report',
                    date: r.date_reported,
                    student: r.student_name,
                    student_class: r.student_class,
                    offence: r.offence,
                    description: r.description,
                    action: r.action_taken,
                    recorder: r.staff_name || 'Unknown'
                })));
            }

            items.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (items.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: grey;">No submissions found.</p>';
                return;
            }

            container.innerHTML = `
                <div class="submissions-list">
                    ${items.map(item => `
                        <div class="submission-card type-${item.type}" style="cursor: pointer;">
                            <div class="submission-header">
                                <div class="submission-meta">
                                    <span class="submission-badge">
                                        ${item.type === 'statement' ? 'Statement' : 'Discipline Report'}
                                    </span>
                                    <span class="submission-date">
                                        <i class='bx bx-calendar'></i> ${new Date(item.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                    <span class="submission-list-student" style="font-weight: 700; font-size: 1.1rem; color: var(--primary-dark);">${item.student} ${item.student_class ? `<span style="font-weight: 400; color: #666; font-size: 0.8em; margin-left: 5px;">- ${item.student_class}</span>` : ''}</span>
                                    <div class="submission-recorder">
                                        by: <strong>${item.recorder}</strong>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="submission-details">
                                <div class="submission-offence">
                                    <label>Offence:</label> <span>${item.offence}</span>
                                </div>
                                ${item.description ? `
                                    <div class="submission-description">
                                        <div class="submission-description-text">${typeof App !== 'undefined' ? App.formatDescription(item.description) : item.description}</div>
                                    </div>
                                ` : ''}
                                <div class="submission-action">
                                    <label>Action:</label> <span>${item.action || 'Pending'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            container.innerHTML = '<p style="text-align: center; color: red;">Error loading data.</p>';
        }
    }
};
