const Suspensions = {
    render: async (container) => {
        container.innerHTML = `
            <div class="layout-grid" id="suspensionsViewContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                
                <!-- Column 1: Record New Suspension/Expulsion -->
                <div class="card">
                    <h3 style="margin-bottom: 0.5rem; color: var(--primary-dark);">Record Suspension/Expulsion</h3>
                    <p style="margin-bottom: 1rem; color: grey; font-size: 0.9rem;">Log a student suspension or expulsion.</p>
                    
                    <form id="suspensionForm">
                        <div class="form-group">
                            <label>Student Name</label>
                            <input type="text" name="student_name" id="suspensionStudentName" placeholder="Enter full name" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Class</label>
                            <select name="student_class" required style="width: 100%; padding: 10px;">
                                <option value="">Select Class...</option>
                                <option value="Y8">Y8</option>
                                <option value="Y9">Y9</option>
                                <option value="Y10">Y10</option>
                                <option value="Y11">Y11</option>
                                <option value="Y12">Y12</option>
                                <option value="Y13">Y13</option>
                                <option value="BTEC Y1 Business">BTEC Y1 Business</option>
                                <option value="BTEC Y2 Business">BTEC Y2 Business</option>
                                <option value="BTEC Y1 IT">BTEC Y1 IT</option>
                                <option value="BTEC Y2 IT">BTEC Y2 IT</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Type</label>
                            <select name="type" id="suspensionType" required style="width: 100%; padding: 10px;">
                                <option value="">Select Type...</option>
                                <option value="Suspension">Suspension</option>
                                <option value="Expulsion">Expulsion</option>
                            </select>
                        </div>

                        <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>Start Date</label>
                                <input type="date" name="start_date" required>
                            </div>
                            <div class="form-group" id="endDateGroup">
                                <label>End Date</label>
                                <input type="date" name="end_date">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Reason</label>
                            <textarea name="reason" rows="3" placeholder="Reason for suspension/expulsion..." style="width: 100%" required></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">Record</button>
                    </form>
                </div>

                <!-- Column 2: Suspension/Expulsion List -->
                <div class="card col-span-2">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                        <h3 style="margin: 0; color: var(--primary-dark);">Suspension & Expulsion Records</h3>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-sm" style="background: #2e7d32; color: white;" data-action="export">
                                <i class='bx bxs-download'></i> Export
                            </button>
                            <button class="btn btn-sm" style="background: var(--primary-color); color: white;" data-action="print">
                                <i class='bx bx-printer'></i> Print
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <input type="text" id="suspensionSearch" placeholder="Search student..." style="flex: 1;">
                    </div>

                    <div id="suspensionTableContainer" class="responsive-table-container">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 2px solid #eee;">
                                    <th style="padding: 12px; text-align: left;">Student</th>
                                    <th style="padding: 12px; text-align: left;">Class</th>
                                    <th style="padding: 12px; text-align: left;">Type</th>
                                    <th style="padding: 12px; text-align: left;">Start Date</th>
                                    <th style="padding: 12px; text-align: left;">End Date</th>
                                    <th style="padding: 12px; text-align: center;">Status</th>
                                    <th style="padding: 12px; text-align: center;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="suspensionTableBody">
                                <tr><td colspan="7" style="padding: 20px; text-align: center;">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        Suspensions.attachEventListeners(container);
        Suspensions.load();
    },

    attachEventListeners: (container) => {
        const form = document.getElementById('suspensionForm');
        if (form) form.onsubmit = Suspensions.handleSubmit;

        const searchInput = document.getElementById('suspensionSearch');
        if (searchInput) searchInput.oninput = () => Suspensions.load();

        const typeSelect = document.getElementById('suspensionType');
        const endDateGroup = document.getElementById('endDateGroup');
        if (typeSelect) {
            typeSelect.onchange = () => {
                if (typeSelect.value === 'Expulsion') {
                    endDateGroup.style.display = 'none';
                } else {
                    endDateGroup.style.display = 'block';
                }
            };
        }

        container.onclick = (e) => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            const action = el.dataset.action;
            if (action === 'export') Suspensions.exportExcel();
            if (action === 'print') Suspensions.printList();
        };
    },

    load: async () => {
        const search = document.getElementById('suspensionSearch')?.value || '';
        const tbody = document.getElementById('suspensionTableBody');
        if (!tbody) return;

        try {
            const res = await fetch(`/api/suspensions?student_name=${encodeURIComponent(search)}`);
            const data = await res.json();

            if (data.success && data.records.length) {
                tbody.innerHTML = data.records.map(r => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px;"><strong>${r.student_name}</strong></td>
                        <td style="padding: 12px;">${r.student_class}</td>
                        <td style="padding: 12px;">
                            <span class="badge ${r.type === 'Expulsion' ? 'badge-danger' : 'badge-warning'}">${r.type}</span>
                        </td>
                        <td style="padding: 12px;">${new Date(r.start_date).toLocaleDateString()}</td>
                        <td style="padding: 12px;">${r.end_date ? new Date(r.end_date).toLocaleDateString() : 'N/A'}</td>
                        <td style="padding: 12px; text-align: center;">
                            <span class="badge badge-${r.status === 'Active' ? 'pending' : r.status === 'Completed' ? 'success' : 'info'}">${r.status}</span>
                        </td>
                        <td style="padding: 12px; text-align: center;">
                            <button class="btn btn-sm" onclick="alert('Reason: ${r.reason.replace(/'/g, "\\'")}\\n\\nRecorded by: ${r.recorder_name || 'Unknown'}\\nDate: ${new Date(r.created_at).toLocaleString()}')" title="View Details">
                                <i class='bx bx-info-circle'></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">No records found.</td></tr>`;
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: var(--danger);">Error loading data.</td></tr>`;
        }
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.recorded_by = Auth.getUser().id;

        try {
            const res = await fetch('/api/suspensions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                alert('Record Created Successfully');
                e.target.reset();
                Suspensions.load();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            alert('Submission failed');
        }
    },

    exportExcel: async () => {
        try {
            const res = await fetch('/api/suspensions');
            const data = await res.json();

            if (data.success && data.records.length) {
                const ws = XLSX.utils.json_to_sheet(data.records);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Suspensions");
                XLSX.writeFile(wb, "Suspensions_Expulsions.xlsx");
            } else {
                alert("No records to export.");
            }
        } catch (e) {
            alert("Export failed.");
        }
    },

    printList: async () => {
        try {
            const res = await fetch('/api/suspensions');
            const data = await res.json();

            if (!data.success || !data.records.length) {
                return alert("No records to print.");
            }

            const rows = data.records.map(r => `
                <tr>
                    <td>${r.student_name}</td>
                    <td>${r.student_class}</td>
                    <td>${r.type}</td>
                    <td>${new Date(r.start_date).toLocaleDateString()}</td>
                    <td>${r.end_date ? new Date(r.end_date).toLocaleDateString() : 'N/A'}</td>
                    <td>${r.status}</td>
                </tr>
            `).join('');

            const printWindow = window.open('', '_blank');

            printWindow.document.write(`
            <html>
                <head>
                    <title>Suspensions & Expulsions - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f8f9fa; }
                        .header { text-align: center; margin-bottom: 30px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>School Discipline Department</h2>
                        <h3>Suspensions & Expulsions Report</h3>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Class</th>
                                <th>Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                    <div style="margin-top: 50px; display: flex; justify-content: center;">
                        <div>____________________<br>Discipline Master</div>
                    </div>
                </body>
            </html>
        `);
            printWindow.document.close();
            printWindow.print();
        } catch (e) {
            alert("Print failed.");
        }
    }
};
