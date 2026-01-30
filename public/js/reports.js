const Reports = {
    render: async (container) => {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="noprint">
                <h3>Weekly Discipline Report</h3>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" id="printBtn" style="cursor: pointer;">
                        <i class='bx bx-printer'></i> Print PDF
                    </button>
                    <a href="/api/reports/export" target="_blank" class="btn" style="background: #2e7d32; color: white;">
                        <i class='bx bx-spreadsheet'></i> Excel Full Data
                    </a>
                </div>
            </div>

            <!-- Report Sheet (A4-ish look) -->
            <div class="report-sheet" id="reportContent">
                
                <!-- Report Header -->
                <div class="report-header">
                    <div class="report-logo">
                        <img src="img/logo.png" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--primary-color);">
                    </div>
                    <div class="report-title-section">
                        <h2>DISCIPLINE DEPARTMENT</h2>
                        <h3>PERFORMANCE & INCIDENT REPORT</h3>
                        <p id="reportDateRange" style="color: grey; margin-top: 5px;">Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <hr style="border: 0; border-top: 2px solid var(--primary-color); margin: 20px 0;">

                <!-- 1. Executive Summary -->
                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-bar-chart-alt-2'></i> Executive Summary</h4>
                    <div class="stats-grid-wide">
                        <div class="stat-box">
                            <div class="stat-number" id="totalOffences">0</div>
                            <div class="stat-label">Total Offences</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="pendingTasks">0</div>
                            <div class="stat-label">Pending Tasks</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgDiscipline">0%</div>
                            <div class="stat-label">Avg Discipline</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h5 style="margin-bottom: 10px; color: #666; font-size: 0.9rem; text-transform: uppercase;">Incident Category Summary</h5>
                        <div id="incidentSummaryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;">
                            <!-- Categorized counts go here -->
                        </div>
                    </div>

                    <div class="stats-grid-wide" style="margin-top: 20px;">
                        <div class="stat-box">
                            <div class="stat-number" id="avgHygiene">0%</div>
                            <div class="stat-label">Avg Hygiene</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgTimeManagement">0%</div>
                            <div class="stat-label">Avg Time Mgmt</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgSupervision">0%</div>
                            <div class="stat-label">Avg Supervision</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgPreps">0%</div>
                            <div class="stat-label">Avg Preps</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgDressCode">0%</div>
                            <div class="stat-label">Avg Dress Code</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgChurchOrder">0%</div>
                            <div class="stat-label">Avg Church Order</div>
                        </div>
                    </div>
                </div>

                <!-- 2. Detailed Discipline Cases -->
                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-error-circle'></i> Recorded Incidents (Last 7 Days)</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Student</th>
                                <th>Offence</th>
                                <th>Description</th>
                                <th>Action Taken</th>
                            </tr>
                        </thead>
                        <tbody id="incidentsTableBody">
                            <tr><td colspan="5" style="text-align: center;">Loading data...</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 3. Staff Performance Highlights -->
                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-user-check'></i> Staff Performance Highlights</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Role</th>
                                <th>Discipline %</th>
                                <th>Hygiene %</th>
                                <th>Week Grade</th>
                            </tr>
                        </thead>
                        <tbody id="performanceTableBody">
                            <tr><td colspan="5" style="text-align: center;">Loading data...</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 4. Tasks Overview -->
                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-task'></i> Key Task Updates</h4>
                    <ul id="taskList" style="font-size: 0.9rem; padding-left: 20px; color: var(--text-primary);">
                        <li>Loading tasks...</li>
                    </ul>
                </div>

                <!-- 5. Staff Remarks & Comments -->
                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-comment-detail'></i> Patron & Matron Remarks</h4>
                    <div id="staffRemarksList" style="font-size: 0.9rem; color: var(--text-primary);">
                        <p style="color: grey; font-style: italic;">No remarks recorded for this period.</p>
                    </div>
                </div>

                <!-- Signature -->
                <div class="signature-area">
                    <div class="signature-line"></div>
                    <div class="signature-label">Approved By</div>
                </div>

                <div class="footer-note">
                    <p>This document is an official record of the School Discipline Department. Verify authenticity with the administration.</p>
                </div>
            </div>
        `;

        // Delegated Event Listener for Print
        container.addEventListener('click', (e) => {
            if (e.target.closest('#printBtn')) {
                window.print();
            }
        });

        // Inject Styles specifically for this report
        const style = document.createElement('style');
        style.innerHTML = `
            .report-sheet {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                max-width: 900px;
                margin: 0 auto;
                font-family: 'Inter', sans-serif;
            }
            .report-header { display: flex; align-items: center; gap: 20px; justify-content: center; text-align: center; }
            .report-title-section h2 { font-size: 1.4rem; color: var(--primary-dark); margin: 0; text-transform: uppercase; }
            .report-title-section h3 { font-size: 1rem; color: var(--text-secondary); margin: 5px 0 0 0; font-weight: 500; }
            
            .section-title {
                margin: 25px 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #eee;
                color: var(--primary-color);
                font-size: 1.1rem;
                display: flex; align-items: center; gap: 8px;
            }

            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
            .stats-grid-wide { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            @media (max-width: 768px) {
                .stats-grid-wide { grid-template-columns: repeat(2, 1fr); }
            }
            .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #eee; }
            .stat-number { font-size: 1.8rem; font-weight: 700; color: var(--primary-dark); }
            .stat-label { font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }

            .report-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 20px; }
            .report-table th { background: var(--primary-color); color: white; padding: 10px; text-align: left; font-weight: 500; }
            .report-table td { padding: 8px 10px; border-bottom: 1px solid #eee; color: #333; vertical-align: top; }
            .report-table tr:nth-child(even) { background-color: #fcfcfc; }

            .signature-area { margin-top: 80px; text-align: center; page-break-before: auto; }
            .signature-line { border-bottom: 2px solid #000; width: 300px; margin: 0 auto 10px auto; height: 40px; }
            .signature-label { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
            
            /* Page break for detailed sections */
            .report-section:nth-child(3) { page-break-before: auto; }

            .footer-note { text-align: center; margin-top: 40px; font-size: 0.75rem; color: #999; font-style: italic; }

            @media print {
                /* Hide navigation and UI elements */
                .sidebar, .top-bar, .noprint, #sidebarOverlay { 
                    display: none !important; 
                }
                
                /* Reset layout containers for full page use */
                body, .home-content, #view-container { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    left: 0 !important; 
                    width: 100% !important;
                    background: white !important;
                }

                .home-content {
                    width: 100% !important;
                }
                
                /* Ensure report content is visible and fills the page */
                #reportContent { 
                    display: block !important;
                    visibility: visible !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 10mm !important; /* Standard margins for A4 */
                    box-shadow: none !important;
                    border: none !important;
                }

                .report-table { 
                    width: 100% !important; 
                    border: 1px solid #000;
                }

                /* Standard printer fonts */
                body { font-size: 11pt; }
            }
        `;
        document.head.appendChild(style);

        Reports.loadData();
    },

    loadData: async () => {
        try {
            const res = await fetch('/api/reports/detailed');
            const result = await res.json();

            if (result.success) {
                const { statements, tasks, standings, disciplineReports } = result.data;

                // 1. Executive Stats
                const allIncidents = [
                    ...statements.map(s => ({ ...s, type: 'Statement', date: s.incident_date, offence: s.offence_type, action: s.punitive_measure })),
                    ...disciplineReports.map(r => ({ ...r, type: 'Report', date: r.date_reported, offence: r.offence, action: r.action_taken }))
                ];

                // Sort by date newest first
                allIncidents.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Incident Category Summary Calculation
                const summaryMap = {};
                allIncidents.forEach(inc => {
                    const type = inc.offence || 'Other';
                    summaryMap[type] = (summaryMap[type] || 0) + 1;
                });

                const summaryGrid = document.getElementById('incidentSummaryGrid');
                if (summaryGrid) {
                    summaryGrid.innerHTML = Object.entries(summaryMap).map(([offence, count]) => `
                        <div style="background: #fff; padding: 10px; border: 1px solid #eee; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; font-weight: 600; color: #555;">${offence}</span>
                            <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">${count}</span>
                        </div>
                    `).join('');
                }

                document.getElementById('totalOffences').textContent = allIncidents.length;
                const pending = tasks.filter(t => t.status !== 'Completed').length;
                document.getElementById('pendingTasks').textContent = pending;

                // Calculate all averages from standings
                if (standings.length > 0) {
                    const calcAvg = (field) => {
                        const total = standings.reduce((acc, curr) => acc + (curr[field] || 0), 0);
                        return Math.round(total / standings.length);
                    };

                    document.getElementById('avgDiscipline').textContent = calcAvg('discipline_pct') + '%';
                    document.getElementById('avgHygiene').textContent = calcAvg('hygiene_pct') + '%';
                    document.getElementById('avgTimeManagement').textContent = calcAvg('time_mgmt_pct') + '%';
                    document.getElementById('avgSupervision').textContent = calcAvg('supervision_pct') + '%';
                    document.getElementById('avgPreps').textContent = calcAvg('preps_pct') + '%';
                    document.getElementById('avgDressCode').textContent = calcAvg('dress_code_pct') + '%';
                    document.getElementById('avgChurchOrder').textContent = calcAvg('church_order_pct') + '%';
                } else {
                    ['avgDiscipline', 'avgHygiene', 'avgTimeManagement', 'avgSupervision',
                        'avgPreps', 'avgDressCode', 'avgChurchOrder'].forEach(id => {
                            if (document.getElementById(id)) document.getElementById(id).textContent = '0%';
                        });
                }


                // 2. Incident Table
                const incidentBody = document.getElementById('incidentsTableBody');
                if (allIncidents.length === 0) {
                    incidentBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: grey;">No incidents recorded this week.</td></tr>';
                } else {
                    incidentBody.innerHTML = allIncidents.map(inc => `
                        <tr style="font-size: 0.85rem;">
                            <td style="white-space: nowrap;">
                                <strong>${new Date(inc.date).toLocaleDateString()}</strong>
                                <div style="font-size: 0.65rem; color: #999;">${inc.type}</div>
                            </td>
                            <td><strong>${inc.student_name}</strong></td>
                            <td style="color: #c62828;">${inc.offence}</td>
                            <td style="max-width: 250px; font-size: 0.8rem; line-height: 1.2;">
                                ${inc.description && inc.description.startsWith('{') ? 'Form Details Recorded' : (inc.description || '-')}
                            </td>
                            <td><small>${inc.action || 'Pending'}</small></td>
                        </tr>
                    `).join('');
                }

                // 3. Performance Table
                const perfBody = document.getElementById('performanceTableBody');
                if (standings.length === 0) {
                    perfBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: grey;">No performance data this week.</td></tr>';
                } else {
                    perfBody.innerHTML = standings.slice(0, 5).map(st => `
                        <tr>
                            <td>${st.staff_name}</td>
                            <td><small>${st.role}</small></td>
                            <td>${st.discipline_pct}%</td>
                            <td>${st.hygiene_pct}%</td>
                            <td><strong>${(st.discipline_pct + st.hygiene_pct) / 2 > 80 ? 'A' : 'B'}</strong></td>
                        </tr>
                    `).join('');
                }

                // 4. Tasks List
                const taskList = document.getElementById('taskList');
                if (tasks.length === 0) {
                    taskList.innerHTML = '<li style="color: grey;">No tasks assigned this week.</li>';
                } else {
                    taskList.innerHTML = tasks.slice(0, 8).map(t => {
                        const icon = t.status === 'Completed' ? 'bx-check-circle' : (t.status === 'In Progress' ? 'bx-loader' : 'bx-time');
                        const color = t.status === 'Completed' ? 'green' : (t.status === 'In Progress' ? 'orange' : 'grey');
                        return `<li style="margin-bottom: 8px; list-style: none;">
                            <i class='bx ${icon}' style="color: ${color}; margin-right: 5px;"></i>
                            <strong>${t.title}</strong>: ${t.status} <small>(${t.assigned_to_name})</small>
                        </li>`;
                    }).join('');
                }

                // 5. Staff Remarks
                const remarksList = document.getElementById('staffRemarksList');
                const remarks = standings.filter(st => st.explanation && st.explanation.trim() !== '');

                if (remarks.length === 0) {
                    remarksList.innerHTML = '<p style="color: grey; font-style: italic; padding: 10px;">No specific remarks or explanations provided by staff this week.</p>';
                } else {
                    remarksList.innerHTML = remarks.map(st => `
                        <div style="margin-bottom: 15px; padding: 12px; background: #f9f9f9; border-left: 4px solid var(--primary-color); border-radius: 0 6px 6px 0;">
                            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 5px; color: var(--primary-dark);">
                                ${st.staff_name} <span style="font-weight: 400; color: #777;">(${st.role})</span>
                            </div>
                            <div style="line-height: 1.4; font-style: italic;">"${st.explanation}"</div>
                        </div>
                    `).join('');
                }
            } else {
                this.showError(result.error || 'Unknown error occurred');
            }
        } catch (e) {
            console.error('Reports Error:', e);
            this.showError('Check your internet connection or server logs.');
        }
    },

    showError: (msg) => {
        const ids = ['incidentsTableBody', 'performanceTableBody', 'taskList'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'TBODY') {
                    el.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">
                        <i class='bx bx-error-circle'></i> Error: ${msg}
                    </td></tr>`;
                } else {
                    el.innerHTML = `<li style="color: var(--danger); list-style: none;">Error: ${msg}</li>`;
                }
            }
        });
    }
};
