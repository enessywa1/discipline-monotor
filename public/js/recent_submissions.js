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

            <!-- Edit Submission Modal -->
            <div id="editSubmissionModal" class="modal-overlay hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: none; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: white; padding: 25px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);">
                    <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--primary-dark);">Edit Submission</h3>
                    <form id="editSubmissionForm">
                        <input type="hidden" id="editId">
                        <input type="hidden" id="editType">
                        
                        <div class="form-group">
                            <label>Student Name</label>
                            <input type="text" id="editStudent" required>
                        </div>
                        <div class="form-group">
                            <label>Class</label>
                            <select id="editClass" required>
                                <option value="Y8">Y8</option><option value="Y9">Y9</option><option value="Y10">Y10</option>
                                <option value="Y11">Y11</option><option value="Y12">Y12</option><option value="Y13">Y13</option>
                                <option value="BTEC">BTEC</option>
                            </select>
                        </div>
                         <div class="form-group">
                            <label>Offence / Type</label>
                            <input type="text" id="editOffence" required>
                        </div>
                        <div class="form-group">
                            <label>Date</label>
                            <input type="datetime-local" id="editDate" required>
                        </div>
                        <div class="form-group">
                            <label>Action Taken / Punitive Measure</label>
                            <input type="text" id="editAction">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="editDescription" rows="3"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn" style="background: #eee; color: #333;" onclick="RecentSubmissions.closeEditModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Attach Event Listeners
        const searchInput = document.getElementById('subSearch');
        if (searchInput) searchInput.oninput = Utils.debounce(() => RecentSubmissions.applyFilters(), 300);

        const typeFilter = document.getElementById('filterType');
        const classFilter = document.getElementById('filterClass');
        const dateFilter = document.getElementById('filterDate');
        const sortSelect = document.getElementById('subSort');

        [typeFilter, classFilter, dateFilter, sortSelect].forEach(el => {
            if (el) el.onchange = () => RecentSubmissions.applyFilters();
        });

        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (searchInput) searchInput.value = '';
                if (typeFilter) typeFilter.value = 'all';
                if (classFilter) classFilter.value = 'all';
                if (dateFilter) dateFilter.value = '';
                if (sortSelect) sortSelect.value = 'dateDesc';
                RecentSubmissions.applyFilters();
            };
        }

        const viewWrapper = document.getElementById('recentSubmissionsContainer');
        if (viewWrapper) {
            viewWrapper.addEventListener('click', (e) => {
                const refreshBtn = e.target.closest('[data-action="refresh"]');
                if (refreshBtn) { RecentSubmissions.loadSubmissions(); return; }

                const editBtn = e.target.closest('[data-action="edit-submission"]');
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    const type = editBtn.dataset.type;
                    RecentSubmissions.editSubmission(id, type);
                    e.stopPropagation();
                    return;
                }

                const deleteBtn = e.target.closest('[data-action="delete-submission"]');
                if (deleteBtn) {
                    const id = deleteBtn.dataset.id;
                    const type = deleteBtn.dataset.type;
                    const name = deleteBtn.dataset.name;
                    RecentSubmissions.deleteSubmission(id, type, name);
                    e.stopPropagation();
                    return;
                }

                const card = e.target.closest('.submission-card');
                if (card) card.classList.toggle('expanded');
            });
        }

        const editForm = document.getElementById('editSubmissionForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                RecentSubmissions.saveEdit();
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
                const content = `${item.student} ${item.offence} ${item.description}`.toLowerCase();
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

        // DOM optimization: Build fragment
        container.innerHTML = `
            <div class="submissions-list">
                ${filtered.map(item => {
            const user = Auth.getUser();
            const isDM = user && (user.role || '').toLowerCase() === 'discipline master';

            return `
                    <div class="submission-card type-${item.type}" style="cursor: pointer;">
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
            const endpoint = `/api/discipline/${type}s/${id}`; // Note: type is 'report' or 'statement', endpoint expects plural
            const res = await fetch(endpoint, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                // Optimistic UI update or reload
                RecentSubmissions.loadSubmissions(true);
                // alert('Record deleted successfully');
            } else {
                alert('Error deleting record: ' + data.error);
            }
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    },

    editSubmission: (id, type) => {
        // Find data
        const item = RecentSubmissions.allData.find(d => d.id == id && d.type === type);
        if (!item) return;

        // Create Modal HTML
        const modalHtml = `
            <div class="modal-overlay" id="editModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit ${type === 'statement' ? 'Statement' : 'Report'}</h3>
                        <button class="modal-close" onclick="document.getElementById('editModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editSubmissionForm">
                            <input type="hidden" name="id" value="${id}">
                            <input type="hidden" name="type" value="${type}">
                            
                            <div class="form-group">
                                <label>Student Name</label>
                                <input type="text" name="student_name" value="${item.student}" required>
                            </div>

                            <div class="form-group">
                                <label>Date</label>
                                <input type="date" name="date" value="${new Date(item.date).toISOString().split('T')[0]}" required>
                            </div>

                            <div class="form-group">
                                <label>Offence</label>
                                <input type="text" name="offence" value="${item.offence}" required>
                            </div>

                            <div class="form-group">
                                <label>Description/Details</label>
                                <textarea name="description" rows="4">${item.description || ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Action/Outcome</label>
                                <input type="text" name="action" value="${item.action || ''}" placeholder="e.g. Suspended, Warning...">
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn" style="background:#ddd; color:#333;" onclick="document.getElementById('editModal').remove()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Inject Modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Handle Submit
        document.getElementById('editSubmissionForm').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const formData = Object.fromEntries(fd.entries());
            const endpoint = `/api/discipline/${type}s/${id}`;

            const payload = {
                student_name: formData.student_name,
                student_class: item.student_class, // Keep class same for now as it makes sense
                offence: formData.offence, // For report
                offence_type: formData.offence, // For statement
                description: formData.description,
                date_reported: formData.date, // For report
                incident_date: formData.date, // For statement
                action_taken: formData.action, // For report
                punitive_measure: formData.action // For statement
            };

            try {
                const btn = e.target.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Saving...';

                const res = await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const resData = await res.json();

                if (resData.success) {
                    document.getElementById('editModal').remove();
                    RecentSubmissions.loadSubmissions(true);
                } else {
                    alert('Error saving changes: ' + resData.error);
                    btn.disabled = false;
                    btn.textContent = 'Save Changes';
                }
            } catch (err) {
                alert('Save failed: ' + err.message);
            }
        };
    }
};
