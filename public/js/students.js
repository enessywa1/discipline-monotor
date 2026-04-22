const Students = {
    data: [],
    searchTerm: '',
    classes: ['YR8', 'YR9', 'YR10', 'YR11', 'YR12', 'YR13', 'BTEC Y1', 'BTEC Y2'],

    render: (container) => {
        Students.searchTerm = '';
        container.innerHTML = `
            <div class="students-container">
                <div class="students-header">
                    <div id="studentsTitleArea">
                        <h2 style="margin: 0; color: var(--primary-dark);">Student Registry</h2>
                        <p style="color: var(--text-secondary); margin: 5px 0 0; font-size: 0.9rem;">Manage and organize student records.</p>
                    </div>
                    <div class="header-actions" style="display: flex; gap: 15px; align-items: center;">
                        <div class="search-box">
                            <i class='bx bx-search'></i>
                            <input type="text" id="studentSearch" placeholder="Search students..." oninput="Students.handleSearch(this.value)">
                        </div>
                        <button class="btn" style="background:#e0f2f1; color:var(--primary-dark);" onclick="document.getElementById('batchPhotoInput').click()">
                            <i class='bx bx-images'></i> Batch Upload
                        </button>
                        <input type="file" id="batchPhotoInput" multiple accept="image/*" style="display:none;" onchange="Students.handleBatchUpload(event)">
                        <button class="btn-primary" onclick="Students.showForm()">
                            <i class='bx bx-user-plus'></i> Register Student
                        </button>
                    </div>
                </div>

                <div id="studentsContent">
                    <div style="text-align:center; padding: 40px;">
                        <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: var(--primary-color);"></i>
                        <p>Loading registry...</p>
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
                Students.renderTable();
            }
        } catch (e) {
            console.error(e);
            document.getElementById('studentsContent').innerHTML = `<p style="text-align:center; color:red; padding:20px;">Failed to load data.</p>`;
        }
    },

    handleSearch: (val) => {
        Students.searchTerm = val.toLowerCase();
        Students.renderTable();
    },

    renderTable: () => {
        const content = document.getElementById('studentsContent');
        if (!content) return;

        const filtered = Students.data.filter(s => {
            const name = (s.name || '').toLowerCase();
            const cls = (s.class || '').toLowerCase();
            const stream = (s.stream || '').toLowerCase();
            const term = Students.searchTerm.toLowerCase();

            return name.includes(term) || cls.includes(term) || stream.includes(term);
        });

        content.innerHTML = `
            <div class="table-container fade-in">
                <table class="student-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Class / Stream</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `
                            <tr><td colspan="4" style="text-align:center; padding:40px; color:#888;">
                                ${Students.searchTerm ? `No students matching "${Students.searchTerm}"` : 'No students registered yet.'}
                            </td></tr>
                        ` : filtered.map(student => `
                            <tr>
                                <td>
                                    <div class="student-profile">
                                        <img src="${student.picture_data ? encodeURI(student.picture_data) : 'img/default-avatar.png'}" alt="${student.name}" onerror="this.src='img/default-avatar.png'">
                                        <div>
                                            <div style="font-weight: 600;">${student.name}</div>
                                            <div style="font-size: 0.8rem; color: #888;">${student.gender || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style="font-weight: 500;">${student.class || 'Unassigned'}</div>
                                    <div style="font-size: 0.8rem; color: #888;">${student.stream || '-'}</div>
                                </td>
                                <td>
                                    <div style="font-size: 0.85rem;"><i class='bx bx-phone' style="color:#888;"></i> ${student.parent_phone || '-'}</div>
                                    <div style="font-size: 0.85rem;"><i class='bx bx-envelope' style="color:#888;"></i> ${student.email || '-'}</div>
                                </td>
                                <td>
                                    <button class="btn btn-sm" style="background:#e0f2f1; color:var(--primary-dark); padding:6px 12px; border-radius:6px; cursor:pointer; border:none; margin-right:5px;" onclick="Students.generateID(${student.id})">
                                        <i class='bx bx-id-card'></i> ID
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

        // Update title stats
        const titleArea = document.getElementById('studentsTitleArea');
        if (titleArea) {
            titleArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <h2 style="margin: 0; color: var(--primary-dark);">Student Registry</h2>
                    <span style="background: var(--primary-color); color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">${filtered.length} Students</span>
                </div>
                <div class="breadcrumb">Directory / All Records</div>
            `;
        }
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

    compressImage: (file, maxSize = 800) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    },

    handleBatchUpload: async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!confirm(`Are you sure you want to batch upload ${files.length} photos?\nThis will update existing students or create new ones based on the filename.`)) {
            e.target.value = '';
            return;
        }

        const total = files.length;
        let successCount = 0;
        let failCount = 0;

        const overlay = document.createElement('div');
        overlay.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:var(--font-family);">
                <i class='bx bx-cloud-upload bx-flashing' style="font-size: 4rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                <h2 style="color:white; margin-bottom: 20px;">Uploading Batch Photos...</h2>
                <div style="width: 300px; height: 10px; background: #333; border-radius: 5px; overflow: hidden;">
                    <div id="batchProgress" style="width: 0%; height: 100%; background: var(--primary-color); transition: width 0.3s;"></div>
                </div>
                <p id="batchStatus" style="margin-top: 15px; font-weight: bold;">0 / ${total}</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #aaa;">Please do not close this window</p>
            </div>
        `;
        document.body.appendChild(overlay);

        const updateProgress = (current) => {
            document.getElementById('batchProgress').style.width = \`\${(current / total) * 100}%\`;
            document.getElementById('batchStatus').innerText = \`\${current} / \${total}\`;
        };

        for (let i = 0; i < total; i++) {
            const file = files[i];
            const name = file.name.replace(/\\.[^/.]+$/, "").trim();
            
            try {
                const base64Data = await Students.compressImage(file);

                const res = await fetch('/api/students/upload-photo-by-name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, picture_data: base64Data })
                });

                const result = await res.json();
                if (result.success) successCount++;
                else failCount++;

            } catch (err) {
                console.error("Failed to upload", name, err);
                failCount++;
            }
            updateProgress(i + 1);
        }

        document.body.removeChild(overlay);
        e.target.value = '';
        Students.loadData();
        
        alert(\`Batch Upload Complete!\\n\\n✅ Successfully uploaded: \${successCount}\\n❌ Failed: \${failCount}\`);
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
            const res = await fetch(`/ api / students / ${ id } `, { method: 'DELETE' });
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
                < div class="modal-overlay" id = "globalEditorModal" >
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
            </div >
    `;
        document.body.insertAdjacentHTML('beforeend', modalBody);
    }
};
 c