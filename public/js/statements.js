const Statements = {
    render: async (container) => {
        container.innerHTML = `
            <div class="layout-grid" id="statementsViewContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                
                <!-- Column 1: Record New Statement -->
                <div class="card">
                    <h3 style="margin-bottom: 0.5rem; color: var(--primary-dark);">Record New Statement</h3>
                    <p style="margin-bottom: 1rem; color: grey; font-size: 0.9rem;">Fill this form to log a new discipline case.</p>
                    
                    <form id="stepStatementForm">
                        <div class="form-group">
                            <label>Student Name</label>
                            <input type="text" name="student_name" id="formStudentName" placeholder="Enter full name" required autocomplete="off">
                            <input type="hidden" name="student_id" id="formStudentId">
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
                            <label>Date of Incident</label>
                            <input type="date" name="incident_date" required>
                        </div>

                        <div class="form-group">
                            <label>Offence</label>
                            <select name="offence_type" required style="width: 100%; padding: 10px;">
                                <option value="">Select Offence...</option>
                                <option value="Bullying">Bullying</option>
                                <option value="Theft">Theft</option>
                                <option value="Vandalism">Vandalism (School/Private Property)</option>
                                <option value="Fighting">Fighting</option>
                                <option value="Disrespect">Disrespecting Staff/Teachers</option>
                                <option value="Drug Abuse">Drug Abuse / Possession</option>
                                <option value="Phone Possession">Possession/Use of Mobile Phones</option>
                                <option value="Noise Making">Noise Making / Disorder in Preps</option>
                                <option value="Graffiti">Graffiti</option>
                                <option value="Leaving School">Leaving School Without Permission</option>
                                <option value="Moving Out Card">Moving Out Of Class Without Permission Card</option>
                                <option value="Bathroom Pass">Going To The Bathroom Without Restroom Permission Pass</option>
                                <option value="Demonstrations">Planning/Organizing Demonstrations</option>
                                <option value="Blasphemy">Blasphemous/Related Behavior</option>
                                <option value="Abusive Behavior">Abusive/Threatening Behavior</option>
                                <option value="Laptop Misuse">Laptop Misuse</option>
                                <option value="Dodging">Dodging Classes/Preps/Church</option>
                                <option value="Poor Hygiene/ Unclean">Poor Hygiene/ Unclean</option>
                                <option value="Late Management">Late / Poor Time Management</option>
                                <option value="Exam Cheating">Cheating in Examinations</option>
                                <option value="Custom">Custom Offence...</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div id="customOffenceContainer" class="hidden" style="margin-bottom: 15px;">
                            <label>Specify Offence</label>
                            <input type="text" id="customOffenceInput" placeholder="Enter custom offence details">
                        </div>

                        <div class="form-group">
                            <label>Description of Incident</label>
                            <textarea name="description" rows="3" placeholder="Describe what happened..." style="width: 100%"></textarea>
                        </div>

                        <div class="form-group">
                            <label>Punitive Measure</label>
                            <textarea name="punitive_measure" rows="2" placeholder="e.g. Suspension, Warning letter..." style="width: 100%"></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">Submit Statement</button>
                    </form>
                </div>

                <!-- Column 2: Search & History -->
                <div class="card" style="background-color: #f9f9f9; border: 1px dashed var(--border-color);">
                    <h4>Student History Lookup</h4>
                    <p style="color: grey; font-size: 0.9rem; margin-bottom: 1rem;">Search to view past records or autofill the form.</p>

                    <div class="form-group" style="position: relative;">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="studentSearch" placeholder="Search name..." autocomplete="off">
                            <button class="btn btn-primary" data-action="search">Search</button>
                        </div>
                    </div>

                    <div id="searchResults" style="margin-top: 10px; display: none; border: 1px solid #ddd; border-radius: 4px; padding: 10px; background: #fff;"></div>

                    <div id="historySection" class="fade-in" style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 id="selectedStudentName" style="margin: 0;">Recent Statements (All)</h4>
                            <button class="btn btn-sm" style="background: #2e7d32; color: white;" data-action="export">
                                <i class='bx bxs-download'></i> Export
                            </button>
                        </div>
                        <div id="historyList" style="margin-top: 10px;"></div>
                    </div>
                </div>
            </div>
        `;

        // Delegated Event Listener
        const viewWrapper = document.getElementById('statementsViewContainer');
        if (viewWrapper) {
            viewWrapper.addEventListener('click', (e) => {
                const el = e.target.closest('[data-action]');
                if (!el) return;

                const action = el.dataset.action;
                if (action === 'search') Statements.search();
                if (action === 'export') Statements.downloadExcel();
                if (action === 'select-student') {
                    Statements.selectStudent(el.dataset.id, el.dataset.name, el.dataset.class);
                }
                if (action === 'quick-detention') {
                    Statements.triggerDetention(el.dataset.name, el.dataset.class, el.dataset.offense);
                }
            });
        }

        const form = document.getElementById('stepStatementForm');
        if (form) {
            form.addEventListener('submit', Statements.handleSubmit);

            // Handle Custom Offence Visibility
            const offenceSelect = form.querySelector('select[name="offence_type"]');
            const customContainer = document.getElementById('customOffenceContainer');

            if (offenceSelect && customContainer) {
                offenceSelect.addEventListener('change', (e) => {
                    if (e.target.value === 'Custom' || e.target.value === 'Other') {
                        customContainer.classList.remove('hidden');
                    } else {
                        customContainer.classList.add('hidden');
                    }
                });
            }
        }

        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            searchInput.oninput = Utils.debounce(() => Statements.search(), 500);
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') Statements.search();
            });
        }

        Statements.loadHistory();
    },

    downloadExcel: async () => {
        try {
            const res = await fetch('/api/discipline/statements');
            const data = await res.json();

            if (data.success && data.statements.length) {
                const ws = XLSX.utils.json_to_sheet(data.statements);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Statements");
                XLSX.writeFile(wb, "Discipline_Statements.xlsx");
            } else {
                alert("No statements found to export.");
            }
        } catch (e) {
            alert("Export failed.");
        }
    },

    search: async () => {
        const query = document.getElementById('studentSearch').value;
        const resDiv = document.getElementById('searchResults');

        if (!query) return;

        resDiv.style.display = 'block';
        resDiv.innerHTML = 'Searching...';

        try {
            const res = await fetch(`/api/discipline/students?search=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.success && data.students.length > 0) {
                resDiv.innerHTML = `
                    <p style="font-size: 0.9rem; color: grey;">Select a student to autofill:</p>
                    <ul style="list-style: none; padding: 0;">
                        ${data.students.map(s => `
                            <li>
                                <button class="btn" style="width: 100%; text-align: left; background: white; border: 1px solid #eee; margin-bottom: 5px;" 
                                data-action="select-student" data-id="${s.id}" data-name="${s.name.replace(/"/g, '&quot;')}" data-class="${s.class || ''}">
                                    <strong>${s.name}</strong> - ${s.class}
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                `;
            } else {
                resDiv.innerHTML = `<p>No students found matching "${query}".</p>`;
            }
        } catch (e) {
            resDiv.innerHTML = '<p>Search failed.</p>';
        }
    },

    selectStudent: (id, name, studentClass) => {
        document.getElementById('searchResults').style.display = 'none';

        const nameInput = document.getElementById('formStudentName');
        const idInput = document.getElementById('formStudentId');
        const classSelect = document.querySelector('select[name="student_class"]');

        if (nameInput) nameInput.value = name;
        if (idInput) idInput.value = id;
        if (classSelect && studentClass) classSelect.value = studentClass;

        document.getElementById('historySection').classList.remove('hidden');
        document.getElementById('selectedStudentName').textContent = `History: ${name} (${studentClass || 'N/A'})`;

        Statements.loadHistory(name);
    },

    loadHistory: async (studentName) => {
        const container = document.getElementById('historyList');
        if (!container) return;
        container.innerHTML = '<p>Loading history...</p>';

        try {
            const sName = studentName || '';
            const [statementsRes, reportsRes] = await Promise.all([
                fetch(`/api/discipline/statements?student_name=${encodeURIComponent(sName)}`),
                fetch(`/api/discipline/reports?student_name=${encodeURIComponent(sName)}`)
            ]);

            const statementsData = await statementsRes.json();
            const reportsData = await reportsRes.json();

            let incidents = [];

            if (statementsData.success) {
                incidents = incidents.concat(statementsData.statements.map(s => ({
                    ...s,
                    type: 'Statement',
                    date: s.incident_date,
                    color: 'var(--primary-color)'
                })));
            }

            if (reportsData.success) {
                incidents = incidents.concat(reportsData.reports.map(r => ({
                    ...r,
                    type: 'Discipline Report',
                    date: r.date_reported,
                    color: 'var(--accent-color)',
                    offence_type: r.offence,
                    punitive_measure: r.action_taken
                })));
            }

            incidents.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (incidents.length > 0) {
                container.innerHTML = incidents.map(inc => `
                    <div style="border-left: 4px solid ${inc.color}; padding: 12px; margin-bottom: 15px; background: white; border-radius: 4px; box-shadow: var(--shadow-sm);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                            <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: ${inc.color}; letter-spacing: 0.5px;">${inc.type}</span>
                            <div style="text-align: right;">
                                <div style="font-size: 0.75rem; color: #999;">${new Date(inc.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div style="font-weight: 700; color: var(--text-primary); display: flex; justify-content: space-between;">
                            <span>${inc.student_name} <span style="font-weight: 400; color: #666; font-size: 0.9em;">- ${inc.student_class || 'Unknown Class'}</span></span>
                        </div>
                        <div style="font-weight: 600; color: var(--primary-dark); margin-top: 5px;">${inc.offence_type}</div>
                        <div style="margin: 8px 0;">${typeof App !== 'undefined' ? App.formatDescription(inc.description) : inc.description}</div>
                        <div style="font-size: 0.75rem; color: #666; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                            <div><strong>Outcome:</strong> ${inc.punitive_measure || 'Pending'}</div>
                            <button class="btn btn-sm" style="background: var(--danger); color: white; padding: 2px 6px; font-size: 0.65rem;" 
                                data-action="quick-detention" 
                                data-name="${inc.student_name.replace(/"/g, '&quot;')}" 
                                data-class="${inc.student_class || ''}" 
                                data-offense="${inc.offence_type.replace(/"/g, '&quot;')}">
                                Send to Detention
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No incidents found.</p>';
            }
        } catch (e) {
            container.innerHTML = '<p>Error loading history.</p>';
        }
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.recorded_by = Auth.getUser().id;

        const payload = {
            student_name: data.student_name,
            student_class: data.student_class,
            incident_date: data.incident_date,
            offence_type: (data.offence_type === 'Custom' || data.offence_type === 'Other')
                ? (document.getElementById('customOffenceInput').value || data.offence_type)
                : data.offence_type,
            punitive_measure: data.punitive_measure,
            recorded_by: data.recorded_by,
            description: data.description
        };

        try {
            const res = await fetch('/api/discipline/statements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                alert('Statement Recorded Successfully');
                e.target.reset();

                const nameSubmitted = data.student_name;
                if (nameSubmitted) {
                    document.getElementById('historySection').classList.remove('hidden');
                    document.getElementById('selectedStudentName').textContent = `History: ${nameSubmitted}`;
                    Statements.loadHistory(nameSubmitted);
                }
            } else {
                alert('Error: ' + result.error);
            }
        } catch (e) {
            alert('Submission failed');
        }
    },

    triggerDetention: (name, studentClass, offense) => {
        window.location.hash = '#detentions';
        // Wait for render
        setTimeout(() => {
            const nameInput = document.getElementById('detentionStudentName');
            const classSelect = document.querySelector('select[name="student_class"]');
            const offenseInput = document.querySelector('input[name="offense"]');

            if (nameInput) nameInput.value = name;
            if (classSelect && studentClass) classSelect.value = studentClass;
            if (offenseInput) offenseInput.value = offense;
        }, 300);
    }
};
