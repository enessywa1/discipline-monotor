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
                        <div class="form-group">
                            <label>Student Name</label>
                            <input type="text" name="student_name" required placeholder="Full Name">
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
                            <option value="Demonstrations">Planning/Organizing Demonstrations</option>
                            <option value="Blasphemy">Blasphemous/Related Behavior</option>
                            <option value="Abusive Behavior">Abusive/Threatening Behavior</option>
                            <option value="Laptop Misuse">Laptop Misuse</option>
                            <option value="Dodging">Dodging Classes/Preps/Church</option>
                            <option value="Late Management">Late / Poor Time Management</option>
                            <option value="Exam Cheating">Cheating in Examinations</option>
                            <option value="Other">Other</option>
                        </select>
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
                            <option value="Counseling">Counseling Dept</option>
                            <option value="Principal">Principal</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">Submit Report</button>
                </form>
            </div>
        `;

        const form = document.getElementById('disciplineReportForm');
        if (form) form.onsubmit = DisciplineForm.handleSubmit;
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        // Enrich with current user ID
        data.staff_id = Auth.getUser().id;

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
            offence: data.offence,
            description: descriptionJson,
            staff_id: data.staff_id,
            date_reported: data.date_reported,
            action_taken: data.action_taken
        };

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
        }
    }
};
