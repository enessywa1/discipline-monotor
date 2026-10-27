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
                                <label>Number of Days</label>
                                <input type="number" name="days" value="1" min="1" required>
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
                <div class="card col-span-2">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <div>
                            <strong>Import detention records</strong>
                            <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">
                                Upload an Excel workbook (.xlsx, .xls) or Excel XML (.xml), up to 500 records.
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <a class="btn" href="templates/detention_import_template.xlsx" download
                                style="background: #e0f2f1; color: var(--primary-dark); text-decoration: none;">
                                <i class='bx bx-download'></i> Excel Template
                            </a>
                            <a class="btn" href="templates/detention_import_template.xml" download
                                style="background: #f1f5f9; color: #334155; text-decoration: none;">
                                <i class='bx bx-code-alt'></i> XML Template
                            </a>
                            <button class="btn btn-primary" type="button" data-action="choose-import">
                                <i class='bx bx-upload'></i> Upload Spreadsheet
                            </button>
                            <input type="file" id="detentionImportFile" accept=".xlsx,.xls,.xml"
                                style="display: none;">
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                        <div style="display: flex; gap: 20px;">
                            <h3 id="tabCurrent" class="active-tab" style="margin: 0; cursor: pointer; color: var(--primary-color);">Current Detentions</h3>
                            <h3 id="tabCleared" style="margin: 0; cursor: pointer; color: #999;">Cleared History</h3>
                        </div>
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
                    </div>

                    <div id="detentionTableContainer" class="responsive-table-container">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 2px solid #eee;">
                                    <th style="padding: 12px; text-align: left;">Student</th>
                                    <th style="padding: 12px; text-align: left;">Class</th>
                                    <th style="padding: 12px; text-align: left;">Date</th>
                                    <th style="padding: 12px; text-align: center;">Days Left</th>
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
            <style>
                .active-tab { border-bottom: 2px solid var(--primary-color); color: var(--primary-dark) !important; padding-bottom: 5px; }
                .clear-btn:hover { background: #e8f5e9 !important; color: #2e7d32 !important; }
            </style>
        `;

        Detentions.attachEventListeners(container);
        Detentions.load();
    },

    currentStatusFilter: 'Uncleared',

    attachEventListeners: (container) => {
        const form = document.getElementById('detentionForm');
        if (form) form.onsubmit = Detentions.handleSubmit;

        const searchInput = document.getElementById('detentionSearch');
        if (searchInput) searchInput.oninput = Utils.debounce(() => Detentions.load(), 500);

        const importFile = document.getElementById('detentionImportFile');
        const chooseImport = container.querySelector('[data-action="choose-import"]');
        if (chooseImport && importFile) {
            chooseImport.onclick = () => importFile.click();
            importFile.onchange = () => {
                if (importFile.files[0]) Detentions.importSpreadsheet(importFile.files[0]);
                importFile.value = '';
            };
        }

        const tabCurrent = document.getElementById('tabCurrent');
        const tabCleared = document.getElementById('tabCleared');

        if (tabCurrent) tabCurrent.onclick = () => {
            Detentions.currentStatusFilter = 'Uncleared';
            tabCurrent.classList.add('active-tab');
            tabCleared.classList.remove('active-tab');
            tabCurrent.style.color = 'var(--primary-color)';
            tabCleared.style.color = '#999';
            Detentions.load();
        };

        if (tabCleared) tabCleared.onclick = () => {
            Detentions.currentStatusFilter = 'Cleared';
            tabCleared.classList.add('active-tab');
            tabCurrent.classList.remove('active-tab');
            tabCleared.style.color = 'var(--primary-color)';
            tabCurrent.style.color = '#999';
            Detentions.load();
        };

        container.onclick = (e) => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            const action = el.dataset.action;
            if (action === 'export') Detentions.exportExcel();
            if (action === 'print') Detentions.printList();
            if (action === 'clear-day') Detentions.clearOneDay(el.dataset.id);
        };
    },

    load: async () => {
        const search = document.getElementById('detentionSearch')?.value || '';
        const tbody = document.getElementById('detentionTableBody');
        if (!tbody) return;

        try {
            const res = await fetch(`/api/detentions?student_name=${encodeURIComponent(search)}&status=${Detentions.currentStatusFilter}`);
            const data = await res.json();

            if (data.success && data.detentions.length) {
                tbody.innerHTML = data.detentions.map(d => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${d.picture_data || 'img/default-avatar.png'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                                <strong>${d.student_name}</strong>
                            </div>
                        </td>
                        <td style="padding: 12px;">${d.student_class}</td>
                        <td style="padding: 12px;">${new Date(d.detention_date).toLocaleDateString()}</td>
                        <td style="padding: 12px; text-align: center;">
                            <span class="badge ${d.days > 0 ? 'badge-pending' : 'badge-success'}">${d.days} Day(s)</span>
                        </td>
                        <td style="padding: 12px; text-align: center;">
                            <div style="display: flex; justify-content: center; gap: 5px;">
                                <button class="btn btn-sm" onclick="alert('Remarks: ${d.remarks || 'None'}\\nDuration: ${d.days || 1} day(s)')" title="View Info">
                                    <i class='bx bx-info-circle'></i>
                                </button>
                                 ${d.status === 'Uncleared' && (Auth.getUser()?.role || '').toLowerCase() !== 'teacher' ? `
                                    <button class="btn btn-sm clear-btn" data-action="clear-day" data-id="${d.id}" style="background: none; color: #4caf50;" title="Clear 1 Day">
                                        <i class='bx bx-check-circle'></i>
                                    </button>
                                ` : ''}
                            </div>
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

    importSpreadsheet: async (file) => {
        if (file.size > 5 * 1024 * 1024) {
            return alert('Spreadsheet must be 5 MB or smaller.');
        }

        try {
            const isXml = file.name.toLowerCase().endsWith('.xml');
            const contents = isXml ? await file.text() : await file.arrayBuffer();
            const workbook = XLSX.read(contents, { type: isXml ? 'string' : 'array', cellDates: true });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            if (!firstSheet) return alert('The spreadsheet does not contain a worksheet.');

            const values = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: true, defval: '' });
            if (values.length < 2) return alert('The worksheet has a header row but no detention records.');

            const normalizeHeader = (value) => String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const headers = values[0].map(normalizeHeader);
            const columns = {
                student_name: ['studentname', 'name'],
                student_class: ['class', 'studentclass'],
                offense: ['offense', 'offensecase', 'case'],
                detention_date: ['detentiondate', 'date'],
                days: ['days', 'numberofdays'],
                remarks: ['remarks', 'notes']
            };
            const indexes = {};
            for (const [field, acceptedHeaders] of Object.entries(columns)) {
                indexes[field] = headers.findIndex((header) => acceptedHeaders.includes(header));
            }
            const missingHeaders = Object.entries(columns)
                .filter(([field]) => indexes[field] < 0 && field !== 'remarks')
                .map(([field]) => field.replace(/_/g, ' '));
            if (missingHeaders.length) {
                return alert(`Missing required columns: ${missingHeaders.join(', ')}. Download the template for the correct column names.`);
            }

            const dateToIso = (value) => {
                if (value instanceof Date && !Number.isNaN(value.getTime())) {
                    return value.toISOString().slice(0, 10);
                }
                if (typeof value === 'number') {
                    const date = XLSX.SSF.parse_date_code(value);
                    if (date) {
                        return `${String(date.y).padStart(4, '0')}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                    }
                }
                const text = String(value).trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
                return '';
            };

            const rows = values.slice(1)
                .filter((cells) => cells.some((value) => String(value).trim() !== ''))
                .map((cells) => ({
                    student_name: String(cells[indexes.student_name] ?? '').trim(),
                    student_class: String(cells[indexes.student_class] ?? '').trim(),
                    offense: String(cells[indexes.offense] ?? '').trim(),
                    detention_date: dateToIso(cells[indexes.detention_date]),
                    days: Number(cells[indexes.days]),
                    remarks: indexes.remarks >= 0 ? String(cells[indexes.remarks] ?? '').trim() : ''
                }));

            if (rows.length === 0) return alert('The worksheet contains no detention records.');
            if (rows.length > 500) return alert('Import no more than 500 detention records at a time.');

            const invalidRow = rows.findIndex((row) =>
                !row.student_name || !row.student_class || !row.offense ||
                !row.detention_date || !Number.isInteger(row.days) || row.days < 1 || row.days > 365
            );
            if (invalidRow >= 0) {
                return alert(`Spreadsheet row ${invalidRow + 2} has missing or invalid values. Check the required columns and use a date in YYYY-MM-DD format.`);
            }

            const response = await fetch('/api/detentions/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                return alert(result.error || 'Unable to import detention records.');
            }

            alert(`Successfully imported ${result.imported} detention record(s).`);
            Detentions.load();
        } catch (error) {
            console.error('Detention spreadsheet import failed:', error);
            alert('Could not read the spreadsheet. Use the provided template and try again.');
        }
    },

    clearOneDay: async (id) => {
        const confirmed = await App.confirm({
            title: 'Clear One Day',
            message: 'Clear one day for this student?',
            confirmText: 'Clear',
            kind: 'success'
        });

        if (!confirmed) return;
        
        // Find the button if it exists in the DOM to disable it
        const btn = document.querySelector(`.clear-btn[data-id="${id}"]`);
        let originalContent = '';
        if (btn) {
            btn.disabled = true;
            originalContent = btn.innerHTML;
            btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i>`;
        }

        try {
            const res = await fetch(`/api/detentions/${id}/clear`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                Detentions.load();
            } else {
                alert('Error: ' + data.error);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }
            }
        } catch (e) {
            alert('Operation failed');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        }
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        const user = Auth.getUser();
        if (!user) return alert('Session expired. Please log in again.');
        data.recorded_by = user.id;

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Recording...`;

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
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    exportExcel: async () => {
        try {
            const res = await fetch('/api/detentions?status=Uncleared');
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

    printList: async () => {
        try {
            const res = await fetch('/api/detentions?status=Uncleared');
            const data = await res.json();

            if (!data.success || !data.detentions.length) {
                return alert("No uncleared records to print.");
            }

            const rows = data.detentions.map(d => `
                <tr>
                    <td>${d.student_name}</td>
                    <td>${d.student_class}</td>
                    <td>${new Date(d.detention_date).toLocaleDateString()}</td>
                    <td>${d.days} Day(s)</td>
                </tr>
            `).join('');

            const printWindow = window.open('', '_blank');

            printWindow.document.write(`
            <html>
                <head>
                    <title>Detention List - ${new Date().toLocaleDateString()}</title>
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
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Days</th>
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
