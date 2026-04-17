const Students = {
    data: [],
    classes: ['YR8', 'YR9', 'YR10', 'YR11', 'YR12', 'YR13', 'BTEC Y1', 'BTEC Y2'],
    selectedClass: null,
    
    render: (container) => {
        container.innerHTML = `
            <div class="students-container">
                <div class="students-header">
                    <div id="studentsTitleArea">
                        <h2 style="margin: 0; color: var(--primary-dark);">Student Registry</h2>
                        <p style="color: var(--text-secondary); margin: 5px 0 0; font-size: 0.9rem;">Manage and organize student records by class.</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-primary" onclick="Students.showForm()">
                            <i class='bx bx-user-plus'></i> Register Student
                        </button>
                    </div>
                </div>

                <div id="studentsContent">
                    <div style="text-align:center; padding: 40px;">
                        <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: var(--primary-color);"></i>
                        <p>Loading directory...</p>
                    </div>
                </div>
            </div>
        `;
        Students.loadData();
    },

    loadData: async () => {
        try {
            const res = await fetch('/api/students');
            const data = await res.json();
            if (data.success) {
                Students.data = data.students || [];
                // Stay in same view if refreshing
                if (Students.selectedClass) {
                    Students.renderTable(Students.selectedClass);
                } else {
                    Students.renderFolders();
                }
            }
        } catch (e) {
            console.error(e);
            document.getElementById('studentsContent').innerHTML = `<p style="text-align:center; color:red; padding:20px;">Failed to load data.</p>`;
        }
    },

    renderFolders: () => {
        Students.selectedClass = null;
        const content = document.getElementById('studentsContent');
        if (!content) return;

        // Group counts
        const counts = {};
        Students.data.forEach(s => {
            counts[s.class] = (counts[s.class] || 0) + 1;
        });

        content.innerHTML = `
            <div class="folder-grid">
                ${Students.classes.map(cls => `
                    <div class="folder-card ${counts[cls] ? 'active' : 'empty'}" onclick="Students.renderTable('${cls}')">
                        <div class="folder-icon-wrapper">
                            <i class='bx ${counts[cls] ? 'bxs-folder' : 'bx-folder'}'></i>
                            ${counts[cls] ? `<span class="folder-badge">${counts[cls]}</span>` : ''}
                        </div>
                        <div class="folder-info">
                            <span class="folder-name">${cls.startsWith('BTEC') ? cls : 'YEAR ' + cls.replace('YR', '')}</span>
                            <span class="folder-meta">${counts[cls] || 0} Students</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Update title/breadcrumb
        document.getElementById('studentsTitleArea').innerHTML = `
            <h2 style="margin: 0; color: var(--primary-dark);">Student Registry</h2>
            <div class="breadcrumb">Directory / All Classes</div>
        `;
    },

    renderTable: (className) => {
        Students.selectedClass = className;
        const content = document.getElementById('studentsContent');
        if (!content) return;

        const filtered = Students.data.filter(s => s.class === className);

        content.innerHTML = `
            <div class="view-header" style="margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                <button class="btn" style="background: #f1f5f9; color: #475569;" onclick="Students.renderFolders()">
                    <i class='bx bx-left-arrow-alt'></i> Back to Classes
                </button>
            </div>
            
            <div class="table-container fade-in">
                <table class="student-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Stream</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `
                            <tr><td colspan="4" style="text-align:center; padding:40px; color:#888;">No students registered in ${className} yet.</td></tr>
                        ` : filtered.map(student => `
                            <tr>
                                <td>
                                    <div class="student-profile">
                                        <img src="${student.picture_data || 'img/default-avatar.png'}" alt="${student.name}">
                                        <div>
                                            <div style="font-weight: 600;">${student.name}</div>
                                            <div style="font-size: 0.8rem; color: #888;">${student.gender || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style="font-weight: 500;">${student.stream || '-'}</div>
                                </td>
                                <td>
                                    <div style="font-size: 0.85rem;"><i class='bx bx-phone' style="color:#888;"></i> ${student.parent_phone || '-'}</div>
                                    <div style="font-size: 0.85rem;"><i class='bx bx-envelope' style="color:#888;"></i> ${student.email || '-'}</div>
                                </td>
                                <td>
                                    <button class="btn btn-sm" style="background:#e0f2f1; color:var(--primary-dark); padding:6px 12px; border-radius:6px; cursor:pointer; border:none; margin-right:5px;" onclick="Students.generateID(${student.id})">
                                        <i class='bx bx-id-card'></i> ID Card
                                    </button>
                                    <button class="btn btn-sm" style="background:#ffebee; color:#d32f2f; padding:6px 12px; border-radius:6px; cursor:pointer; border:none;" onclick="Students.deleteStudent(${student.id})">
                                        <i class='bx bx-trash'></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Update title/breadcrumb
        document.getElementById('studentsTitleArea').innerHTML = `
            <h2 style="margin: 0; color: var(--primary-dark);">Class Registry</h2>
            <div class="breadcrumb">Directory / <strong>${className}</strong></div>
        `;
    },

    showForm: (prefillClass = null) => {
        const defaultClass = prefillClass || Students.selectedClass || '';

        const modalBody = `
            <div class="modal-overlay" id="globalEditorModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Register New Student</h3>
                        <button class="modal-close" onclick="App.Editor.close()">&times;</button>
                    </div>
                    <div id="editorModalBody">
                        <form id="studentRegistrationForm">
                            <div class="photo-upload-wrapper">
                                <label style="font-size: 0.8rem; text-transform:uppercase; color:#888;">Student Photo</label>
                                <div class="photo-preview" id="photoPreview" onclick="document.getElementById('photoInput').click()">
                                    <i class='bx bx-camera'></i>
                                </div>
                                <input type="file" id="photoInput" accept="image/*" style="display:none;" onchange="Students.handlePhotoUpload(event)">
                                <input type="hidden" id="pictureData" name="picture_data">
                            </div>

                            <div class="layout-grid">
                                <div class="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" required placeholder="Enter student name">
                                </div>
                                <div class="form-group">
                                    <label>Gender</label>
                                    <select name="gender" required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div class="layout-grid">
                                <div class="form-group">
                                    <label>Class</label>
                                    <select name="student_class" required>
                                        <option value="">Select Class</option>
                                        ${Students.classes.map(cls => `<option value="${cls}" ${cls === defaultClass ? 'selected' : ''}>${cls}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Stream / Section</label>
                                    <input type="text" name="stream" placeholder="e.g. A, Blue">
                                </div>
                            </div>

                            <div class="layout-grid">
                                <div class="form-group">
                                    <label>Parent Phone</label>
                                    <input type="tel" name="parent_phone" placeholder="Contact Number">
                                </div>
                                <div class="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" placeholder="student@example.com">
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="App.Editor.close()">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="saveStudentBtn">Register Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalBody);
        document.getElementById('studentRegistrationForm').onsubmit = Students.handleSave;
    },

    handlePhotoUpload: (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = event.target.result;
            document.getElementById('pictureData').value = base64Str;
            document.getElementById('photoPreview').innerHTML = `<img src="${base64Str}" alt="Photo Preview">`;
        };
        reader.readAsDataURL(file);
    },

    handleSave: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        const btn = document.getElementById('saveStudentBtn');
        
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Saving...";
        btn.disabled = true;

        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            if (result.success) {
                App.Editor.close();
                Students.loadData();
            } else {
                alert('Error: ' + result.error);
                btn.innerHTML = "Register Student";
                btn.disabled = false;
            }
        } catch (err) {
            alert('Connection failed');
            btn.innerHTML = "Register Student";
            btn.disabled = false;
        }
    },

    deleteStudent: async (id) => {
        if (!confirm('Are you sure you want to delete this student record?')) return;
        try {
            const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                Students.loadData();
            } else {
                alert('Error deleting student: ' + result.error);
            }
        } catch (e) {
            alert('Connection error');
        }
    },

    generateID: (id) => {
        const student = Students.data.find(s => s.id === id);
        if (!student) return;

        const modalBody = `
            <div class="modal-overlay" id="globalEditorModal">
                <div class="modal-content" style="width: auto; max-width: 90vw;">
                    <div class="modal-header">
                        <h3>Student Identification Card</h3>
                        <button class="modal-close" onclick="App.Editor.close()">&times;</button>
                    </div>
                    <div id="editorModalBody" style="display: flex; flex-direction: column; align-items: center; padding-bottom: 20px;">
                        
                        <div id="idCardContainer">
                            <div class="id-header">
                                <img src="img/logo.png" alt="Logo" class="id-logo">
                                <h3 class="id-title">Student Elite Pass</h3>
                                <div class="id-subtitle">Excellence in Discipline & Education</div>
                            </div>
                            
                            <div class="id-photo-container">
                                <img src="${student.picture_data || 'img/default-avatar.png'}" alt="${student.name}" class="id-photo">
                            </div>
                            
                            <div class="id-details">
                                <div class="id-name">${student.name}</div>
                                <div class="id-class">${student.class} ${student.stream ? '- ' + student.stream : ''}</div>
                                
                                <div class="id-info-grid">
                                    <div class="id-info-row">
                                        <div class="id-info-label">ID N°</div>
                                        <div class="id-info-value">ST-${10000 + student.id}</div>
                                    </div>
                                    <div class="id-info-row">
                                        <div class="id-info-label">Gender</div>
                                        <div class="id-info-value">${student.gender || 'N/A'}</div>
                                    </div>
                                    <div class="id-info-row">
                                        <div class="id-info-label">Contact</div>
                                        <div class="id-info-value">${student.parent_phone || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="id-footer">
                                Official Valid Scholar
                            </div>
                        </div>

                        <div class="modal-footer" style="width: 100%; border: none; margin-top: 20px;">
                            <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="App.Editor.close()">Close</button>
                            <button type="button" class="btn btn-primary" onclick="window.print()"><i class='bx bx-printer'></i> Print ID Card</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalBody);
    }
};
