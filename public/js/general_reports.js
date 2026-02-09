const GeneralReports = {
    render: async (container) => {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="noprint">
                <h3>General Overall Reports</h3>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" id="printGeneralBtn" style="cursor: pointer;">
                        <i class='bx bx-printer'></i> Print PDF
                    </button>
                </div>
            </div>

            <div class="report-sheet" id="generalReportContent">
                <div class="report-header">
                    <div class="report-logo">
                        <img src="img/logo.png" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--primary-color);">
                    </div>
                    <div class="report-title-section">
                        <h2>DISCIPLINE DEPARTMENT</h2>
                        <h3>OVERALL CUMULATIVE REPORT</h3>
                        <p id="reportDateRange" style="color: grey; margin-top: 5px;">All recorded history as of: ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <hr style="border: 0; border-top: 2px solid var(--primary-color); margin: 20px 0;">

                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-calculator'></i> Lifetime Totals</h4>
                    <div class="stats-grid-wide">
                        <div class="stat-box">
                            <div class="stat-number" id="totalOffencesAll">0</div>
                            <div class="stat-label">Total Offences Recorded</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="totalTasksAll">0</div>
                            <div class="stat-label">Total Tasks Managed</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="avgPerfAll">0%</div>
                            <div class="stat-label">All-Time Avg Performance</div>
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-history'></i> Complete Incident History</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Offence</th>
                                <th>Action Taken</th>
                            </tr>
                        </thead>
                        <tbody id="generalIncidentsTableBody">
                            <tr><td colspan="5" style="text-align: center;">Loading all records...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="report-section">
                    <h4 class="section-title"><i class='bx bx-group'></i> All Staff Performance History</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Role</th>
                                <th>Avg Discipline %</th>
                                <th>Avg Hygiene %</th>
                            </tr>
                        </thead>
                        <tbody id="generalPerformanceTableBody">
                            <tr><td colspan="4" style="text-align: center;">Loading performance data...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="footer-note">
                    <p>This document contains all historical records synchronized from the School Discipline System.</p>
                </div>
            </div>
        `;

        document.getElementById('printGeneralBtn').onclick = () => window.print();
        GeneralReports.loadData();
    },

    loadData: async () => {
        try {
            const res = await fetch('/api/reports/all-time');
            const result = await res.json();

            if (result.success) {
                const { statements, tasks, standings, disciplineReports } = result.data;

                const allIncidents = [
                    ...statements.map(s => ({ ...s, date: s.incident_date, offence: s.offence_type, action: s.punitive_measure })),
                    ...disciplineReports.map(r => ({ ...r, date: r.date_reported, offence: r.offence, action: r.action_taken }))
                ];
                allIncidents.sort((a, b) => new Date(b.date) - new Date(a.date));

                document.getElementById('totalOffencesAll').textContent = allIncidents.length;
                document.getElementById('totalTasksAll').textContent = tasks.length;

                if (standings.length > 0) {
                    const avg = standings.reduce((acc, curr) => acc + (curr.discipline_pct + curr.hygiene_pct) / 2, 0) / standings.length;
                    document.getElementById('avgPerfAll').textContent = Math.round(avg) + '%';

                    // Group by Staff
                    const staffMap = {};
                    standings.forEach(st => {
                        if (!staffMap[st.staff_name]) staffMap[st.staff_name] = { counts: 0, d: 0, h: 0, role: st.role };
                        staffMap[st.staff_name].counts++;
                        staffMap[st.staff_name].d += st.discipline_pct;
                        staffMap[st.staff_name].h += st.hygiene_pct;
                    });

                    document.getElementById('generalPerformanceTableBody').innerHTML = Object.entries(staffMap).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${data.role}</td>
                            <td>${Math.round(data.d / data.counts)}%</td>
                            <td>${Math.round(data.h / data.counts)}%</td>
                        </tr>
                    `).join('');
                } else {
                    document.getElementById('generalPerformanceTableBody').innerHTML = '<tr><td colspan="4" style="text-align:center;">No performance data found.</td></tr>';
                }

                document.getElementById('generalIncidentsTableBody').innerHTML = allIncidents.map(inc => `
                    <tr>
                        <td>${new Date(inc.date).toLocaleDateString()}</td>
                        <td>${inc.student_name}</td>
                        <td>${inc.student_class || '-'}</td>
                        <td>${inc.offence}</td>
                        <td>${inc.action || 'Pending'}</td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            console.error(e);
        }
    }
};
