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
                    <div class="header-actions" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                        <div class="search-box">
                            <i class='bx bx-search'></i>
                            <input type="text" id="studentSearch" placeholder="Search students..." oninput="Students.handleSearch(this.value)">
                        </div>
                        <select id="batchUploadClassSelect" style="padding:10px 12px; border:1px solid #dbe4f0; border-radius:10px; background:#fff; color:#475569; min-width:150px;">
                            <option value="">Optional class for upload</option>
                            ${Students.classes.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
                        </select>
                        <button class="btn" style="background:#e0f2f1; color:var(--primary-dark);" onclick="document.getElementById('batchPhotoInput').click()">
                            <i class='bx bx-images'></i> Batch Upload
                        </button>
                        <button class="btn" style="background:#fef3c7; color:#92400e;" onclick="Students.showBatchClassAction('promote')">
                            <i class='bx bx-up-arrow-circle'></i> Promote Batch
                        </button>
                        <button class="btn" style="background:#ede9fe; color:#5b21b6;" onclick="Students.showBatchClassAction('reverse')">
                            <i class='bx bx-down-arrow-circle'></i> Reverse Batch
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
            <div class="table-container mobile-card-table fade-in">
                <table class="student-table" style="width: 100%; border-collapse: collapse;">
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
                                <td data-label="Student">
                                    <div class="student-profile">
                                        <img src="${student.picture_data ? (student.picture_data.startsWith('http') ? student.picture_data : encodeURI(student.picture_data)) : 'img/default-avatar.png'}" alt="${student.name}" onerror="this.src='img/default-avatar.png'">
                                        <div>
                                            <div style="font-weight: 600;">${student.name}</div>
                                            <div style="font-size: 0.8rem; color: #888;">${student.gender || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Class / Stream">
                                    <div style="font-weight: 500;">${student.class || 'Unassigned'}</div>
                                    <div style="font-size: 0.8rem; color: #888;">${student.stream || '-'}</div>
                                </td>
                                <td data-label="Contact">
                                    <div style="font-size: 0.85rem;"><i class='bx bx-phone' style="color:#888;"></i> ${student.parent_phone || '-'}</div>
                                    <div style="font-size: 0.85rem;"><i class='bx bx-envelope' style="color:#888;"></i> ${student.email || '-'}</div>
                                </td>
                                <td data-label="Actions">
                                    <div class="action-buttons" style="justify-content: flex-end;">
                                        <button class="btn-icon edit" data-tooltip="Edit Profile" onclick="Students.showForm(${JSON.stringify(student).replace(/"/g, '&quot;')})">
                                            <i class='bx bx-edit'></i>
                                        </button>
                                        <button class="btn-icon id" data-tooltip="Generate ID" onclick="Students.generateID(${student.id})">
                                            <i class='bx bx-id-card'></i>
                                        </button>
                                        <button class="btn-icon delete" data-tooltip="Delete Record" onclick="Students.deleteStudent(${student.id})">
                                            <i class='bx bx-trash'></i>
                                        </button>
                                    </div>
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


    showForm: (student = null) => {
        const isEdit = student && student.id;
        const defaultClass = isEdit ? student.class : (Students.selectedClass || '');

        const modalBody = `
            <div class="modal-overlay" id="globalEditorModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Student Profile' : 'Register New Student'}</h3>
                        <button class="modal-close" onclick="App.Editor.close()">&times;</button>
                    </div>
                    <div id="editorModalBody">
                        <form id="studentRegistrationForm">
                            <input type="hidden" name="id" value="${isEdit ? student.id : ''}">
                            <div class="photo-upload-wrapper">
                                <label style="font-size: 0.8rem; text-transform:uppercase; color:#888;">Student Photo</label>
                                <div class="photo-preview" id="photoPreview" onclick="document.getElementById('photoInput').click()">
                                    ${isEdit && student.picture_data ? `<img src="${student.picture_data.startsWith('http') ? student.picture_data : encodeURI(student.picture_data)}" onerror="this.src='img/default-avatar.png'" alt="Photo">` : `<i class='bx bx-camera'></i>`}
                                </div>
                                <input type="file" id="photoInput" accept="image/*" style="display:none;" onchange="Students.handlePhotoUpload(event)">
                                <input type="hidden" id="pictureData" name="picture_data" value="${isEdit ? (student.picture_data || '') : ''}">
                            </div>

                            <div class="layout-grid">
                                <div class="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" required placeholder="Enter student name" value="${isEdit ? student.name : ''}">
                                </div>
                                <div class="form-group">
                                    <label>Gender</label>
                                    <select name="gender" required>
                                        <option value="">Select Gender</option>
                                        <option value="Male" ${isEdit && student.gender === 'Male' ? 'selected' : ''}>Male</option>
                                        <option value="Female" ${isEdit && student.gender === 'Female' ? 'selected' : ''}>Female</option>
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
                                    <input type="text" name="stream" placeholder="e.g. A, Blue" value="${isEdit ? (student.stream || '') : ''}">
                                </div>
                            </div>

                            <div class="layout-grid">
                                <div class="form-group">
                                    <label>Parent Phone</label>
                                    <input type="tel" name="parent_phone" placeholder="Contact Number" value="${isEdit ? (student.parent_phone || '') : ''}">
                                </div>
                                <div class="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" placeholder="student@example.com" value="${isEdit ? (student.email || '') : ''}">
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="App.Editor.close()">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="saveStudentBtn">${isEdit ? 'Save Changes' : 'Register Student'}</button>
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

    getNextClass: (className) => {
        const classMap = {
            'YR8': 'YR9',
            'YR9': 'YR10',
            'YR10': 'YR11',
            'YR11': 'YR12',
            'YR12': 'YR13',
            'BTEC Y1': 'BTEC Y2',
            'BTEC Y2': 'BTEC Y2'
        };
        return classMap[className] || className;
    },

    getPreviousClass: (className) => {
        const classMap = {
            'YR9': 'YR8',
            'YR10': 'YR9',
            'YR11': 'YR10',
            'YR12': 'YR11',
            'YR13': 'YR12',
            'BTEC Y2': 'BTEC Y1',
            'BTEC Y1': 'BTEC Y1'
        };
        return classMap[className] || className;
    },

    showBatchClassAction: (direction) => {
        const isPromote = direction === 'promote';
        const actionText = isPromote ? 'Promote Batch' : 'Reverse Batch';
        const titleText = isPromote ? 'Promote all students by one year?' : 'Reverse all students by one year?';
        const descriptionText = isPromote
            ? 'This will move each student to the next year/class in the registry.'
            : 'This will move each student back to the previous year/class in the registry.';

        const modalBody = `
            <div class="modal-overlay" id="batchClassActionModal" style="display:flex;">
                <div class="modal-content" style="max-width: 440px; width: min(92vw, 440px); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);">
                    <div class="modal-header" style="padding: 22px 22px 16px; border-bottom: 1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
                        <h3 style="margin:0; color: var(--primary-dark); font-size: 1.2rem;">${actionText}</h3>
                        <button type="button" class="modal-close" id="closeBatchClassActionModal" style="font-size: 1.4rem;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 22px; background: #f8fafc;">
                        <div style="display:flex; align-items:flex-start; gap:14px; margin-bottom: 18px;">
                            <div style="width:52px; height:52px; border-radius:14px; background: ${isPromote ? 'rgba(34,197,94,0.12)' : 'rgba(168,85,247,0.12)'}; color:${isPromote ? '#15803d' : '#7c3aed'}; display:flex; align-items:center; justify-content:center; font-size:1.7rem; flex-shrink:0;">
                                <i class='bx ${isPromote ? 'bx-up-arrow-circle' : 'bx-down-arrow-circle'}'></i>
                            </div>
                            <div>
                                <p style="margin:0; font-size: 1.02rem; color: #0f172a; line-height:1.6;">${titleText}</p>
                                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #475569;">${descriptionText}</p>
                            </div>
                        </div>
                        <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                            <button type="button" class="btn" id="cancelBatchClassAction" style="background:#f1f5f9; color:#475569;">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmBatchClassAction" style="background:${isPromote ? '#16a34a' : '#7c3aed'}; border-color:${isPromote ? '#16a34a' : '#7c3aed'};">${actionText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalBody);
        const overlay = document.getElementById('batchClassActionModal');
        const closeModal = () => overlay.remove();

        document.getElementById('closeBatchClassActionModal').addEventListener('click', closeModal);
        document.getElementById('cancelBatchClassAction').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        document.getElementById('confirmBatchClassAction').addEventListener('click', async () => {
            const btn = document.getElementById('confirmBatchClassAction');
            btn.disabled = true;
            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Updating...";

            try {
                const changes = [];
                for (const student of Students.data) {
                    const nextClass = isPromote ? Students.getNextClass(student.class) : Students.getPreviousClass(student.class);
                    if (student.class !== nextClass) {
                        changes.push(fetch(`/api/students/${student.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...student,
                                student_class: nextClass,
                                class: nextClass,
                                name: student.name,
                                gender: student.gender || '',
                                stream: student.stream || '',
                                parent_phone: student.parent_phone || '',
                                email: student.email || '',
                                picture_data: student.picture_data || ''
                            })
                        }));
                    }
                }

                await Promise.all(changes);
                closeModal();
                Students.loadData();
                alert(isPromote ? 'Batch promotion completed successfully.' : 'Batch reversal completed successfully.');
            } catch (err) {
                console.error(err);
                alert('Unable to update student classes in batch.');
            }
        });
    },

    handleBatchUpload: async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const classSelect = document.getElementById('batchUploadClassSelect');
        const optionalClass = classSelect ? classSelect.value : '';

        const confirmed = await App.confirm({
            title: 'Batch Upload Photos',
            message: `Are you sure you want to upload ${files.length} photos? This will update existing students or create new ones based on the filename.${optionalClass ? `\nSelected class: ${optionalClass}` : ''}`,
            confirmText: 'Upload',
            kind: 'success'
        });

        if (!confirmed) {
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
            document.getElementById('batchProgress').style.width = `${(current / total) * 100}%`;
            document.getElementById('batchStatus').innerText = `${current} / ${total}`;
        };

        for (let i = 0; i < total; i++) {
            const file = files[i];
            const name = file.name.replace(/\.[^/.]+$/, "").trim();
            
            try {
                const base64Data = await Students.compressImage(file);

                const res = await fetch('/api/students/upload-photo-by-name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, picture_data: base64Data, class: optionalClass || undefined })
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
        
        alert(`Batch Upload Complete!\n\n✅ Successfully uploaded: ${successCount}\n❌ Failed: ${failCount}`);
    },

    handleSave: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        const studentId = payload.id;
        const isEdit = !!studentId;
        
        const btn = document.getElementById('saveStudentBtn');
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Saving...";
        btn.disabled = true;

        try {
            const endpoint = isEdit ? `/api/students/${studentId}` : '/api/students';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            if (result.success) {
                App.Editor.close();
                Students.loadData();
            } else {
                alert('Error: ' + result.error);
                btn.innerHTML = isEdit ? "Save Changes" : "Register Student";
                btn.disabled = false;
            }
        } catch (err) {
            alert('Connection failed');
            btn.innerHTML = isEdit ? "Save Changes" : "Register Student";
            btn.disabled = false;
        }
    },

    deleteStudent: (id) => {
        const student = Students.data.find(s => s.id === id);
        const studentName = student ? student.name : 'this student';

        const modalBody = `
            <div class="modal-overlay" id="deleteStudentModal" style="display:flex;">
                <div class="modal-content" style="max-width: 440px; width: min(92vw, 440px); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);">
                    <div class="modal-header" style="padding: 22px 22px 16px; border-bottom: 1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
                        <h3 style="margin:0; color: var(--primary-dark); font-size: 1.2rem;">Delete Student</h3>
                        <button type="button" class="modal-close" id="closeDeleteStudentModal" style="font-size: 1.4rem;">&times;</button>
                    </div>

                    <div class="modal-body" style="padding: 22px; background: #f8fafc;">
                        <div style="display:flex; align-items:flex-start; gap:14px; margin-bottom: 18px;">
                            <div style="width:52px; height:52px; border-radius:14px; background: rgba(239,68,68,0.12); color:#dc2626; display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
                                <i class='bx bx-trash'></i>
                            </div>
                            <div>
                                <p style="margin:0; font-size: 1.02rem; color: #0f172a; line-height:1.6;">
                                    Are you sure you want to delete this student record?
                                </p>
                                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #475569;">
                                    This action will permanently remove <strong>${studentName}</strong> from the registry.
                                </p>
                            </div>
                        </div>

                        <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                            <button type="button" class="btn" id="cancelDeleteStudent" style="background:#f1f5f9; color:#475569;">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmDeleteStudent" style="background:#dc2626; border-color:#dc2626;">Delete Record</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalBody);

        const overlay = document.getElementById('deleteStudentModal');
        const closeModal = () => overlay.remove();

        document.getElementById('closeDeleteStudentModal').addEventListener('click', closeModal);
        document.getElementById('cancelDeleteStudent').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        document.getElementById('confirmDeleteStudent').addEventListener('click', async () => {
            const confirmBtn = document.getElementById('confirmDeleteStudent');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Deleting...";

            try {
                const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) {
                    closeModal();
                    Students.loadData();
                } else {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = 'Delete Record';
                    alert('Error deleting student: ' + result.error);
                }
            } catch (e) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = 'Delete Record';
                alert('Connection error');
            }
        });
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
                                <div class="id-card-shell">
                                    <div class="id-card-header">
                                        <h3 class="id-card-title">Student ID Card</h3>
                                        <div class="id-school">Borcelle<br>University</div>
                                    </div>

                                    <div class="id-card-body">
                                        <div class="id-photo-panel">
                                            <div class="id-photo-container">
                                                <img src="${student.picture_data ? (student.picture_data.startsWith('http') ? student.picture_data : encodeURI(student.picture_data)) : 'img/default-avatar.png'}" onerror="this.src='img/default-avatar.png'" alt="${student.name}" class="id-photo">
                                            </div>
                                        </div>

                                        <div class="id-data-panel">
                                            <div class="id-info-label">Name</div>
                                            <div class="id-info-value">${student.name}</div>

                                            <div class="id-info-label">ID Number</div>
                                            <div class="id-info-value">${10000 + student.id}</div>

                                            <div class="id-info-label">Major</div>
                                            <div class="id-info-value major">${student.class || 'General Studies'}</div>
                                        </div>

                                        <div class="id-accent-panel">
                                            <div class="id-star"></div>
                                            <div class="id-barcode"></div>
                                            <div class="id-faint-shape"></div>
                                        </div>
                                    </div>
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
