const Tracking = {
    render: async (container) => {
        container.innerHTML = `
            <div class="tracking-container">
                <div class="header-section">
                    <h3>Student Tracking</h3>
                    <p>Monitor students with multiple cases and track those showing improvement.</p>
                </div>

                <div class="tracking-grid">
                    <!-- Watchlist Section -->
                    <div class="tracking-card">
                        <div class="card-header">
                            <i class='bx bx-error-alt' style="color: var(--danger-color);"></i>
                            <h4>Discipline Watchlist</h4>
                        </div>
                        <form id="watchlistForm" class="input-form">
                            <div class="form-row">
                                <input type="text" id="watchName" placeholder="Student Name" required>
                                <input type="text" id="watchClass" placeholder="Class" required>
                            </div>
                            <textarea id="watchReason" placeholder="Reason for Watchlist (e.g., 3 cases this week)" required></textarea>
                            <button type="submit" class="btn btn-primary">Add to Watchlist</button>
                        </form>
                        <div class="list-container">
                            <table class="tracking-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th>Reason</th>
                                        <th class="dm-only hidden">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="watchlistBody">
                                    <tr><td colspan="4" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Improvement Section -->
                    <div class="tracking-card">
                        <div class="card-header">
                            <i class='bx bx-trending-up' style="color: var(--success-color);"></i>
                            <h4>Improved Students</h4>
                        </div>
                        <form id="improvementForm" class="input-form">
                            <div class="form-row">
                                <input type="text" id="impName" placeholder="Student Name" required>
                                <input type="text" id="impClass" placeholder="Class" required>
                            </div>
                            <textarea id="impNotes" placeholder="Improvement Notes (e.g., Conduct markedly improved)" required></textarea>
                            <button type="submit" class="btn btn-primary">Record Improvement</button>
                        </form>
                        <div class="list-container">
                            <table class="tracking-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th>Notes</th>
                                        <th class="dm-only hidden">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="improvementBody">
                                    <tr><td colspan="4" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .tracking-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .tracking-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .card-header i { font-size: 1.5rem; }
                .input-form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 10px;
                }
                .input-form input, .input-form textarea {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                .input-form textarea { height: 60px; resize: vertical; }
                .tracking-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                }
                .tracking-table th {
                    text-align: left;
                    background: #f8f9fa;
                    padding: 10px;
                    color: var(--text-secondary);
                }
                .tracking-table td {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .loading { text-align: center; color: #999; padding: 20px !important; }
                .btn-delete {
                    background: none;
                    border: none;
                    color: var(--danger-color);
                    cursor: pointer;
                    font-size: 1.1rem;
                }
            </style>
        `;

        Tracking.setupListeners();
        Tracking.loadData();
        Tracking.checkPermissions();
    },

    checkPermissions: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const isDM = user && user.role === 'Discipline Master';

        if (isDM) {
            document.querySelectorAll('.dm-only').forEach(el => el.classList.remove('hidden'));
        }
    },

    setupListeners: () => {
        const user = JSON.parse(localStorage.getItem('user'));

        document.getElementById('watchlistForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                student_name: document.getElementById('watchName').value,
                student_class: document.getElementById('watchClass').value,
                reason: document.getElementById('watchReason').value,
                recorded_by: user.id
            };

            const res = await fetch('/api/discipline/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                e.target.reset();
                Tracking.loadWatchlist();
            }
        });

        document.getElementById('improvementForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                student_name: document.getElementById('impName').value,
                student_class: document.getElementById('impClass').value,
                improvement_notes: document.getElementById('impNotes').value,
                recorded_by: user.id
            };

            const res = await fetch('/api/discipline/improved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                e.target.reset();
                Tracking.loadImproved();
            }
        });
    },

    loadData: () => {
        Tracking.loadWatchlist();
        Tracking.loadImproved();
    },

    loadWatchlist: async () => {
        const res = await fetch('/api/discipline/watchlist');
        const data = await res.json();
        const body = document.getElementById('watchlistBody');

        if (data.success && data.watchlist.length > 0) {
            const user = JSON.parse(localStorage.getItem('user'));
            const isDM = user && user.role === 'Discipline Master';

            body.innerHTML = data.watchlist.map(item => `
                <tr>
                    <td><strong>${item.student_name}</strong></td>
                    <td>${item.student_class}</td>
                    <td>${item.reason}</td>
                    <td class="dm-only ${isDM ? '' : 'hidden'}">
                        <button class="btn-delete" onclick="Tracking.deleteEntry('watchlist', ${item.id})">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            body.innerHTML = '<tr><td colspan="5" class="loading">No students on watchlist</td></tr>';
        }
    },

    loadImproved: async () => {
        const res = await fetch('/api/discipline/improved');
        const data = await res.json();
        const body = document.getElementById('improvementBody');

        if (data.success && data.students.length > 0) {
            const user = JSON.parse(localStorage.getItem('user'));
            const isDM = user && user.role === 'Discipline Master';

            body.innerHTML = data.students.map(item => `
                <tr>
                    <td><strong>${item.student_name}</strong></td>
                    <td>${item.student_class}</td>
                    <td>${item.improvement_notes}</td>
                    <td class="dm-only ${isDM ? '' : 'hidden'}">
                        <button class="btn-delete" onclick="Tracking.deleteEntry('improved', ${item.id})">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            body.innerHTML = '<tr><td colspan="5" class="loading">No improvement records yet</td></tr>';
        }
    },

    deleteEntry: async (type, id) => {
        if (!confirm('Are you sure you want to remove this record?')) return;

        const endpoint = type === 'watchlist' ? `/api/discipline/watchlist/${id}` : `/api/discipline/improved/${id}`;
        const res = await fetch(endpoint, { method: 'DELETE' });

        if (res.ok) {
            if (type === 'watchlist') Tracking.loadWatchlist();
            else Tracking.loadImproved();
        }
    }
};
