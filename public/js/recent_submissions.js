const RecentSubmissions = {
    allData: [],

    render: async (container) => {
        container.innerHTML = `
            <div class="card" id="recentSubmissionsContainer">
                <!-- Search & Filters Toolbar -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; align-items: end;">
                        
                        <!-- Search Box -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Search Student / Offense</label>
                            <div style="position: relative;">
                                <i class='bx bx-search' style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #aaa;"></i>
                                <input type="text" id="subSearch" placeholder="Filter by keyword..." style="padding-left: 35px; margin-bottom: 0;">
                            </div>
                        </div>

                        <!-- Type Filter -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Submission Type</label>
                            <select id="filterType">
                                <option value="all">All Types</option>
                                <option value="statements">Statements Only</option>
                                <option value="reports">Discipline Reports Only</option>
                            </select>
                        </div>

                        <!-- Class Filter -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Class Filter</label>
                            <select id="filterClass">
                                <option value="all">All Classes</option>
                                <option value="Y8">Y8</option><option value="Y9">Y9</option><option value="Y10">Y10</option>
                                <option value="Y11">Y11</option><option value="Y12">Y12</option><option value="Y13">Y13</option>
                                <option value="BTEC">BTEC (All)</option>
                            </select>
                        </div>

                        <!-- Date Filter -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Date Filter</label>
                            <input type="date" id="filterDate" style="margin-bottom: 0;">
                        </div>

                        <!-- Sort By -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Sort By</label>
                            <select id="subSort">
                                <option value="dateDesc">Date (Newest First)</option>
                                <option value="dateAsc">Date (Oldest First)</option>
                                <option value="submitter">Submitter Name</option>
                                <option value="student">Student Name</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-primary" id="resetFilters" style="flex: 1; padding: 10px;">
                                <i class='bx bx-reset'></i> Reset
                            </button>
                            <button class="btn" data-action="refresh" style="background: white; border: 1px solid #ccc; padding: 10px;">
                                <i class='bx bx-refresh'></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="submissionsContainer">
                    <p style="text-align: center; padding: 40px; color: grey;">Initializing submission board...</p>
                </div>
            </div>
        `;

        // Event Listeners for Filters
        const searchInput = document.getElementById('subSearch');
        const filterType = document.getElementById('filterType');
        const filterClass = document.getElementById('filterClass');
        const filterDate = document.getElementById('filterDate');
        const sortSelect = document.getElementById('subSort');
        const resetBtn = document.getElementById('resetFilters');

        const applyFilters = Utils.debounce(() => RecentSubmissions.applyFilters(), 300);

        [searchInput, filterType, filterClass, filterDate, sortSelect].forEach(el => {
            if (el) el.addEventListener('change', () => RecentSubmissions.applyFilters());
            if (el && el.tagName === 'INPUT') el.addEventListener('input', applyFilters);
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterType.value = 'all';
                filterClass.value = 'all';
                filterDate.value = '';
                sortSelect.value = 'dateDesc';
                RecentSubmissions.applyFilters();
            });
        }

        // Global Action Listener for Edit/Delete/Refresh
        const mainContainer = document.getElementById('recentSubmissionsContainer');
        if (mainContainer) {
            mainContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                const name = btn.dataset.name;

                if (action === 'refresh') RecentSubmissions.loadSubmissions();
                if (action === 'delete-submission') {
                    e.stopPropagation();
                    RecentSubmissions.deleteSubmission(id, type, name);
                }
                if (action === 'edit-submission') {
                    e.stopPropagation();
                    RecentSubmissions.editSubmission(id, type);
                }
            });

            // Card Click Listener for details
            mainContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.submission-card');
                const btn = e.target.closest('button');
                if (card && !btn) {
                    const id = card.dataset.id;
                    const type = card.dataset.type;
                    RecentSubmissions.editSubmission(id, type);
                }
            });
        }

        RecentSubmissions.loadSubmissions();
        RecentSubmissions.startPolling();
    },

    refreshInterval: null,
    startPolling: () => {
        RecentSubmissions.stopPolling();
        RecentSubmissions.refreshInterval = setInterval(() => {
            RecentSubmissions.loadSubmissions(true);
        }, 60000);
    },
    stopPolling: () => {
        if (RecentSubmissions.refreshInterval) {
            clearInterval(RecentSubmissions.refreshInterval);
            RecentSubmissions.refreshInterval = null;
        }
    },

    loadSubmissions: async (isQuiet = false) => {
        const container = document.getElementById('submissionsContainer');
        if (!container) return;
        if (!isQuiet) container.innerHTML = '<p style="text-align: center; padding: 40px; color: grey;">Loading data...</p>';

        try {
            const [statementsRes, reportsRes] = await Promise.all([
                fetch('/api/discipline/statements'),
                fetch('/api/discipline/reports')
            ]);

            const statementsData = await statementsRes.json();
            const reportsData = await reportsRes.json();

            let items = [];
            const statements = statementsData.statements || [];
            items = items.concat(statements.map(s => ({
                id: s.id,
                type: 'statement',
                date: s.created_at || s.incident_date,
                student: s.student_name,
                student_class: s.student_class,
                offence: s.offence_type,
                description: s.description,
                action: s.punitive_measure,
                recorder: s.recorder_name || 'Unknown'
            })));

            const reports = reportsData.reports || [];
            items = items.concat(reports.map(r => ({
                id: r.id,
                type: 'report',
                date: r.date_reported,
                student: r.student_name,
                student_class: r.student_class,
                offence: r.offence,
                description: r.description,
                action: r.action_taken,
                recorder: r.staff_name || 'Unknown'
            })));

            RecentSubmissions.allData = items.sort((a, b) => new Date(b.date) - new Date(a.date));
            RecentSubmissions.applyFilters();
        } catch (e) {
            console.error('Submission sync error:', e);
            container.innerHTML = '<p style="text-align: center; color: red;">Error synchronizing submissions.</p>';
        }
    },

    applyFilters: () => {
        const container = document.getElementById('submissionsContainer');
        if (!container) return;

        const query = document.getElementById('subSearch').value.toLowerCase();
        const type = document.getElementById('filterType').value;
        const classVal = document.getElementById('filterClass').value;
        const dateVal = document.getElementById('filterDate').value;
        const sortVal = document.getElementById('subSort').value;

        const filtered = RecentSubmissions.allData.filter(item => {
            // Type Filter
            if (type !== 'all' && item.type !== (type === 'statements' ? 'statement' : 'report')) return false;

            // Class Filter
            if (classVal !== 'all') {
                if (classVal === 'BTEC') {
                    if (!item.student_class?.includes('BTEC')) return false;
                } else if (item.student_class !== classVal) return false;
            }

            // Date Filter
            if (dateVal) {
                const itemDate = new Date(item.date).toISOString().split('T')[0];
                if (itemDate !== dateVal) return false;
            }

            // Search Query
            if (query) {
                const content = `${item.student} ${item.offence} ${item.description || ''}`.toLowerCase();
                if (!content.includes(query)) return false;
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortVal === 'dateDesc') return new Date(b.date) - new Date(a.date);
            if (sortVal === 'dateAsc') return new Date(a.date) - new Date(b.date);
            if (sortVal === 'submitter') return (a.recorder || '').localeCompare(b.recorder || '');
            if (sortVal === 'student') return (a.student || '').localeCompare(b.student || '');
            return 0;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: grey;">No submissions found matching filters.</p>';
            return;
        }

        container.innerHTML = `
            <div class="submissions-list">
                ${filtered.map(item => {
            const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
            const isDM = user && (user.role || '').toLowerCase() === 'discipline master';

            return `
                    <div class="submission-card type-${item.type}" data-id="${item.id}" data-type="${item.type}" style="cursor: pointer;">
                        <div class="submission-header">
                            <div class="submission-meta">
                                <span class="submission-badge">${item.type === 'statement' ? 'Statement' : 'Discipline Report'}</span>
                                <span class="submission-date"><i class='bx bx-calendar'></i> ${new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                <span class="submission-list-student" style="font-weight: 700; font-size: 1.1rem; color: var(--primary-dark);">${item.student} <span style="font-weight: 400; color: #666; font-size: 0.8em;">- ${item.student_class || 'N/A'}</span></span>
                                <div class="submission-recorder">by: <strong>${item.recorder}</strong></div>
                            </div>
                        </div>
                        <div class="submission-details">
                            <div class="submission-offence"><label>Offence:</label> <span>${item.offence}</span></div>
                            <div class="submission-description">${item.description ? `<div class="submission-description-text">${App.formatDescription(item.description)}</div>` : ''}</div>
                            <div class="submission-action"><label>Outcome:</label> <span>${item.action || 'Pending'}</span></div>
                        </div>
                        ${isDM ? `
                        <div class="submission-actions" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="btn-icon" data-action="edit-submission" data-id="${item.id}" data-type="${item.type}" title="Edit">
                                <i class='bx bx-edit'></i>
                            </button>
                            <button class="btn-icon delete" data-action="delete-submission" data-id="${item.id}" data-type="${item.type}" data-name="${item.student}" title="Delete">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `}).join('')}
            </div>
        `;
    },

    deleteSubmission: async (id, type, name) => {
        if (!confirm(`Are you sure you want to delete this ${type} for ${name}? This action cannot be undone.`)) return;

        try {
            const endpoint = `/api/discipline/${type}s/${id}`;
            const res = await fetch(endpoint, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                RecentSubmissions.loadSubmissions(true);
            } else {
                alert('Error deleting record: ' + data.error);
            }
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    },

    editSubmission: (id, type) => {
        App.Editor.open(id, type);
    }
};
