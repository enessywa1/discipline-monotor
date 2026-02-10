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
                <!-- Report Header -->
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

                <!-- 1. Lifetime Totals -->
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

                    <div style="margin-top: 30px;" class="noprint">
                        <h5 style="margin-bottom: 15px; color: #666; font-size: 0.9rem; text-transform: uppercase;">Historical Offence Trend</h5>
                        <div style="height: 300px; background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                            <canvas id="historicalTrendChart"></canvas>
                        </div>
                        <p style="font-size: 0.75rem; color: grey; text-align: center; margin-top: 10px;">
                            <i class='bx bx-info-circle'></i> This chart shows cumulative growth of discipline records over time, highlighting system usage improvements.
                        </p>
                    </div>
                </div>

                <!-- 2. Complete Incident History -->
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

                <!-- 3. All Staff Performance History -->
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

                <!-- Signature -->
                <div class="signature-area">
                    <div class="signature-line"></div>
                    <div class="signature-label">Verified By</div>
                </div>

                <div class="footer-note">
                    <p>This document contains all historical records synchronized from the School Discipline System.</p>
                </div>
            </div>
        `;

        // Inject Styles specifically for this report (Synchronized with reports.js)
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

            .signature-area { margin-top: 80px; text-align: center; }
            .signature-line { border-bottom: 2px solid #000; width: 300px; margin: 0 auto 10px auto; height: 40px; }
            .signature-label { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
            
            .footer-note { text-align: center; margin-top: 40px; font-size: 0.75rem; color: #999; font-style: italic; }

            @media print {
                .sidebar, .top-bar, .noprint, #sidebarOverlay { 
                    display: none !important; 
                }
                body, .home-content, #view-container { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    left: 0 !important; 
                    width: 100% !important;
                    background: white !important;
                }
                .home-content { width: 100% !important; }
                #generalReportContent { 
                    display: block !important;
                    visibility: visible !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 10mm !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .report-table { width: 100% !important; border: 1px solid #000; }
                body { font-size: 11pt; }
            }
        `;
        document.head.appendChild(style);

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

                // Render Historical Trend
                if (window.Chart && allIncidents.length > 0) {
                    // Group by month/year
                    const monthlyMap = {};
                    allIncidents.forEach(inc => {
                        const d = new Date(inc.date);
                        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                        monthlyMap[key] = (monthlyMap[key] || 0) + 1;
                    });

                    // Sort keys chronologically
                    const sortedKeys = Object.keys(monthlyMap).sort((a, b) => new Date(a) - new Date(b));

                    const ctx = document.getElementById('historicalTrendChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: sortedKeys,
                            datasets: [{
                                label: 'Records Submitted',
                                data: sortedKeys.map(k => monthlyMap[k]),
                                borderColor: '#008080',
                                backgroundColor: 'rgba(0, 128, 128, 0.1)',
                                fill: true,
                                tension: 0.3,
                                pointRadius: 5,
                                pointHoverRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: { beginAtZero: true }
                            }
                        }
                    });
                }

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
                            <td><small>${data.role}</small></td>
                            <td>${Math.round(data.d / data.counts)}%</td>
                            <td>${Math.round(data.h / data.counts)}%</td>
                        </tr>
                    `).join('');
                } else {
                    document.getElementById('generalPerformanceTableBody').innerHTML = '<tr><td colspan="4" style="text-align:center;">No performance data found.</td></tr>';
                }

                document.getElementById('generalIncidentsTableBody').innerHTML = allIncidents.map(inc => `
                    <tr style="font-size: 0.85rem;">
                        <td style="white-space: nowrap;">
                            <strong>${new Date(inc.date).toLocaleDateString()}</strong>
                        </td>
                        <td><strong>${inc.student_name}</strong></td>
                        <td>${inc.student_class || '-'}</td>
                        <td style="color: #c62828;">${inc.offence}</td>
                        <td><small>${inc.action || 'Pending'}</small></td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            console.error('General Reports Error:', e);
            document.getElementById('generalIncidentsTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load data.</td></tr>';
        }
    }
};
