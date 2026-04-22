// discipline_form.js
const DisciplineForm = {
    render: (container) => {
        container.innerHTML = `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <h3 style="color: var(--primary-dark); border-bottom: 2px solid var(--accent-color); padding-bottom: 10px; margin-bottom: 20px;">
                    Student Discipline Report Form
                </h3>
                
                <form id="disciplineReportForm">
                    <!-- Row 1: Student Details -->
                    <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div class="form-group" style="position: relative;">
                            <label>Student Name</label>
                            <input type="text" name="student_name" id="disciplineStudentName" required placeholder="Full Name" autocomplete="off">
                            <div id="disciplineStudentSuggestions" style="position: absolute; width: 100%; top: 100%; left: 0; background: white; border: 1px solid #ddd; z-index: 100; max-height: 200px; overflow-y: auto; display: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 4px;"></div>
                        </div>
                        <div class="form-group">
                            <label>Gender</label>
                            <select name="gender" required style="width: 100%; padding: 10px;">
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 2: Class Info -->
                    <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label>Class</label>
                            <select name="class_grade" required style="width: 100%; padding: 10px;">
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
                            <label>Stream</label>
                            <input type="text" name="stream" placeholder="e.g. North, South, A, B">
                        </div>
                    </div>

                    <!-- Row 3: Incident Details -->
                    <div class="form-group">
                        <label>Offence</label>
                        <select name="offence" required style="width: 100%; padding: 10px;">
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
                            <option value="Moving Out Card">Moving Out Without Permission Card</option>
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

                    <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" name="date_reported" required>
                        </div>
                        <div class="form-group">
                            <label>Phone Number (Staff)</label>
                            <input type="tel" name="staff_phone" placeholder="Your contact">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Department / Office</label>
                        <input type="text" name="department" placeholder="e.g. Girls Dorm, Main Block">
                    </div>

                    <!-- Row 4: Action & Forwarding -->
                    <div class="form-group">
                        <label>Disciplinary Measures Taken</label>
                        <textarea name="action_taken" rows="3" style="width: 100%"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Forward To</label>
                        <select name="forward_to" style="width: 100%; padding: 10px;">
                            <option value="None">None (Resolved)</option>
                            <option value="Discipline Master">Discipline Master</option>
                            <option value="Head Patron">Head Patron</option>
                            <option value="Head Matron">Head Matron</option>
                            <option value="Pastor">Pastor</option>
                            <option value="Counseling">Counseling Dept</option>
                            <option value="Principal">Principal</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">Submit Report</button>
                </form>
            </div>
        `;

        const form = document.getElementById('disciplineReportForm');
        if (form) {
            form.onsubmit = DisciplineForm.handleSubmit;

            // Handle Custom Offence Visibility
            const offenceSelect = form.querySelector('select[name="offence"]');
            const customContainer = document.getElementById('customOffenceContainer');

            offenceSelect.addEventListener('change', (e) => {
                if (e.target.value === 'Custom' || e.target.value === 'Other') {
                    customContainer.classList.remove('hidden');
                } else {
                    customContainer.classList.add('hidden');
                }
            });

            // Handle Autocomplete
            const nameInput = document.getElementById('disciplineStudentName');
            const sugBox = document.getElementById('disciplineStudentSuggestions');
            const classSelect = form.querySelector('select[name="class_grade"]');
            const genderSelect = form.querySelector('select[name="gender"]');
            const streamInput = form.querySelector('input[name="stream"]');

            nameInput.addEventListener('input', Utils.debounce(async (e) => {
                const query = e.target.value.toLowerCase();
                if (!query) { sugBox.style.display = 'none'; return; }
                
                try {
                    const res = await fetch('/api/students');
                    const data = await res.json();
                    if (data.success) {
                        const matches = data.students.filter(s => s.name.toLowerCase().includes(query));
                        if(matches.length > 0) {
                            sugBox.innerHTML = matches.map(s => `
                                <div class="suggestion-item" style="display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="DisciplineForm.selectStudent('${s.name.replace(/'/g, "\\'")}', '${s.class}', '${s.stream}', '${s.gender}')">
                                    <img src="${s.picture_data ? (s.picture_data.startsWith('http') ? s.picture_data : encodeURI(s.picture_data)) : 'img/default-avatar.png'}" onerror="this.src='img/default-avatar.png'" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                                    <div>
                                        <div style="font-weight:600; font-size:0.9rem;">${s.name}</div>
                                        <div style="font-size:0.75rem; color:#888;">Class ${s.class || 'N/A'}</div>
                                    </div>
                                </div>
                            `).join('');
                            sugBox.style.display = 'block';
                        } else {
                            sugBox.style.display = 'none';
                        }
                    }
                } catch(err) { console.error(err); }
            }, 300));
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!nameInput.contains(e.target) && !sugBox.contains(e.target)) {
                    sugBox.style.display = 'none';
                }
            });
        }
    },

    selectStudent: (name, sClass, stream, gender) => {
        document.getElementById('disciplineStudentName').value = name;
        document.getElementById('disciplineStudentSuggestions').style.display = 'none';
        
        const form = document.getElementById('disciplineReportForm');
        if (sClass) form.querySelector('select[name="class_grade"]').value = sClass;
        if (gender) form.querySelector('select[name="gender"]').value = gender;
        if (stream && stream !== 'null') form.querySelector('input[name="stream"]').value = stream;
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        // Enrich with current user ID
        const user = Auth.getUser();
        if (!user) return alert('Session expired. Please log in again.');
        data.staff_id = user.id;

        // Since our backend table for 'discipline_reports' is simple (student_name, offence, description...),
        // we will combine the extra fields into the 'description' field for storage in MVP.
        const descriptionJson = JSON.stringify({
            class: data.class_grade,
            stream: data.stream,
            gender: data.gender,
            phone: data.staff_phone,
            dept: data.department,
            forward: data.forward_to
        });

        const payload = {
            student_name: data.student_name,
            student_class: data.class_grade,
            offence: (data.offence === 'Custom' || data.offence === 'Other')
                ? (document.getElementById('customOffenceInput').value || data.offence)
                : data.offence,
            description: descriptionJson,
            staff_id: data.staff_id,
            date_reported: data.date_reported,
            action_taken: data.action_taken
        };

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Submitting...`;

        try {
            const res = await fetch('/api/discipline/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                alert('Report Submitted Successfully');
                e.target.reset();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            alert('Submission failed');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};
