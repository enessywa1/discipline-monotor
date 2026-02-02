const Detentions = {
    render: async (container) => {
        container.innerHTML = `
            <div class="layout-grid" id="detentionsViewContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                
                <!-- Column 1: Record New Detention -->
                <div class="card">
                    <h3 style="margin-bottom: 0.5rem; color: var(--primary-dark);">Record New Detention</h3>
                    <p style="margin-bottom: 1rem; color: grey; font-size: 0.9rem;">Manually log a student for detention.</p>
                    
                    <form id="detentionForm">
                        <div class="form-group">
                            <label>Student Name</label>
                            <input type="text" name="student_name" id="detentionStudentName" placeholder="Enter full name" required>
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
                            <label>Offense / Case</label>
                            <input type="text" name="offense" placeholder="e.g. Repeated Noise Making" required>
                        </div>

                        <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>Detention Date</label>
                                <input type="date" name="detention_date" required>
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select name="detention_type" required style="width: 100%; padding: 10px;">
                                    <option value="Standard">Standard</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Principal">Principal's</option>
                                    <option value="Internal">Internal</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Remarks</label>
                            <textarea name="remarks" rows="2" placeholder="Additional notes..." style="width: 100%"></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">Record Detention</button>
                    </form>
                </div>

                <!-- Column 2: Detention List -->
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: var(--primary-dark);">Detention List</h3>
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
                        <input type="text" id="detentionSearch" placeholder="Search student..." style="flex: 1;">
                        <select id="typeFilter" style="width: 120px;">
                            <option value="All">All Types</option>
                            <option value="Standard">Standard</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Principal">Principal's</option>
                        </select>
                    </div>

                    <div id="detentionTableContainer" style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 2px solid #eee;">
                                    <th style="padding: 12px; text-align: left;">Student</th>
                                    <th style="padding: 12px; text-align: left;">Class</th>
                                    <th style="padding: 12px; text-align: left;">Date</th>
                                    <th style="padding: 12px; text-align: left;">Type</th>
                                    <th style="padding: 12px; text-align: center;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="detentionTableBody">
                                <tr><td colspan="5" style="padding: 20px; text-align: center;">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        Detentions.attachEventListeners(container);
        Detentions.load();
    },

    attachEventListeners: (container) => {
        const form = document.getElementById('detentionForm');
        if (form) form.onsubmit = Detentions.handleSubmit;

        const searchInput = document.getElementById('detentionSearch');
        const typeFilter = document.getElementById('typeFilter');

        if (searchInput) searchInput.oninput = Detentions.load;
        if (typeFilter) typeFilter.onchange = Detentions.load;

        container.onclick = (e) => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            const action = el.dataset.action;
            if (action === 'export') Detentions.exportExcel();
            if (action === 'print') Detentions.printList();
        };
    },

    load: async () => {
        const search = document.getElementById('detentionSearch')?.value || '';
        const type = document.getElementById('typeFilter')?.value || 'All';
        const tbody = document.getElementById('detentionTableBody');
        if (!tbody) return;

        try {
            const res = await fetch(`/api/detentions?student_name=${encodeURIComponent(search)}&detention_type=${type}`);
            const data = await res.json();

            if (data.success && data.detentions.length) {
                tbody.innerHTML = data.detentions.map(d => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px;"><strong>${d.student_name}</strong></td>
                        <td style="padding: 12px;">${d.student_class}</td>
                        <td style="padding: 12px;">${new Date(d.detention_date).toLocaleDateString()}</td>
                        <td style="padding: 12px;"><span class="badge badge-pending">${d.detention_type}</span></td>
                        <td style="padding: 12px; text-align: center;">
                            <button class="btn btn-sm" onclick="alert('Remarks: ${d.remarks || 'None'}')" style="background: none; color: var(--primary-color); padding: 5px;">
                                <i class='bx bx-info-circle'></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">No records found.</td></tr>`;
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--danger);">Error loading data.</td></tr>`;
        }
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.recorded_by = Auth.getUser().id;

        try {
            const res = await fetch('/api/detentions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                alert('Detention Recorded Successfully');
                e.target.reset();
                Detentions.load();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            alert('Submission failed');
        }
    },

    exportExcel: async () => {
        try {
            const res = await fetch('/api/detentions');
            const data = await res.json();

            if (data.success && data.detentions.length) {
                const ws = XLSX.utils.json_to_sheet(data.detentions);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Detentions");
                XLSX.writeFile(wb, "Detention_Records.xlsx");
            } else {
                alert("No records to export.");
            }
        } catch (e) {
            alert("Export failed.");
        }
    },

    printList: () => {
        const printWindow = window.open('', '_blank');
        const rows = document.getElementById('detentionTableBody').innerHTML;

        printWindow.document.write(\`
            <html>
                <head>
                    <title>Detention List - \${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f8f9fa; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .badge { background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>School Discipline Department</h2>
                        <h3>Daily Detention List</h3>
                        <p>Date: \${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${rows}
                        </tbody>
                    </table>
                    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                        <div>____________________<br>Discipline Master</div>
                        <div>____________________<br>Duty Officer Signature</div>
                    </div>
                </body>
            </html>
        \`);
        printWindow.document.close();
        printWindow.print();
    }
};
