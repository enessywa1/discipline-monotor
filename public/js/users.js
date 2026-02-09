const Users = {
    render: async (container) => {
        container.innerHTML = `
            <div class="card" id="usersViewContainer">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Staff Management</h3>
                    <button class="btn btn-primary" data-action="toggle-form">+ Add New Staff</button>
                </div>
                
                <!-- Add User Form (Hidden) -->
                <div id="addUserFormContainer" class="hidden" style="background: #fafafa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px dashed #ccc;">
                    <h4 style="margin-bottom: 15px;">Create New Account</h4>
                    <form id="addUserForm">
                        <div class="layout-grid layout-grid-2" style="gap: 15px;">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" name="full_name" placeholder="e.g. John Doe" required>
                            </div>
                            <div class="form-group">
                                <label>Role</label>
                                <select name="role" required>
                                    <option value="Patron">Patron</option>
                                    <option value="Matron">Matron</option>
                                    <option value="Head Patron">Head Patron</option>
                                    <option value="Head Matron">Head Matron</option>
                                    <option value="Pastor">Pastor</option>
                                    <option value="Discipline Master">Discipline Master</option>
                                    <option value="Assistant Discipline Master">Assistant Discipline Master</option>
                                    <option value="Director">Director</option>
                                    <option value="Director Administration and Public Relations">Director Administration and Public Relations</option>
                                    <option value="Principal">Principal</option>
                                    <option value="Associate Principal">Associate Principal</option>
                                    <option value="Dean of Students">Dean of Students</option>
                                    <option value="QA">QA</option>
                                    <option value="CIE">CIE</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Allocation</label>
                                <input type="text" name="allocation" placeholder="e.g. Boys Dorm A">
                            </div>
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="tel" name="phone_number" placeholder="e.g. 0771234567">
                            </div>
                            <div class="form-group">
                                <label>Username</label>
                                <input type="text" name="username" placeholder="Login username" required>
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" name="password" placeholder="Login password" required>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button type="submit" class="btn btn-primary">Save User</button>
                            <button type="button" class="btn" data-action="toggle-form" style="background: #eee; color: #333;">Cancel</button>
                        </div>
                    </form>
                </div>

                <div class="table-container" style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: #f5f5f5; text-align: left; border-bottom: 2px solid #eee;">
                                <th style="padding: 12px;">Name</th>
                                <th style="padding: 12px;">Role</th>
                                <th style="padding: 12px;">Allocation</th>
                                <th style="padding: 12px;">Phone</th>
                                <th style="padding: 12px;">Username</th>
                                <th style="padding: 12px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Delegated Event Listener
        container.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (!el) return;

            const action = el.dataset.action;
            if (action === 'toggle-form') Users.toggleAddForm();
            if (action === 'edit') Users.prepareEdit(parseInt(el.dataset.id));
            if (action === 'delete') Users.delete(parseInt(el.dataset.id));
        });

        document.getElementById('addUserForm').addEventListener('submit', Users.handleSubmit);
        Users.load();
    },

    toggleAddForm: () => {
        const container = document.getElementById('addUserFormContainer');
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
        } else {
            Users.resetForm();
        }
    },

    load: async () => {
        const tbody = document.getElementById('userTableBody');
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.success) {
                Users.allUsers = data.users;
                tbody.innerHTML = data.users.map(u => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; font-weight: 500;">${u.full_name}</td>
                        <td style="padding: 12px;">
                            <span class="badge badge-progress" style="background: #e0f2f1; color: #00695c;">
                                ${u.role}
                            </span>
                        </td>
                        <td style="padding: 12px;">${u.allocation || '-'}</td>
                        <td style="padding: 12px; color: var(--text-secondary);">${u.phone_number || 'N/A'}</td>
                        <td style="padding: 12px;">${u.username}</td>
                        <td style="padding: 12px; display: flex; gap: 10px;">
                            <button data-action="edit" data-id="${u.id}" style="color: var(--primary-color); background: none; border: none; cursor: pointer; font-weight: 600;">Edit</button>
                            ${u.username !== 'admin' ? `<button data-action="delete" data-id="${u.id}" style="color: #c62828; background: none; border: none; cursor: pointer; font-weight: 600;">Delete</button>` : ''}
                        </td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center;">Error loading users.</td></tr>';
        }
    },

    currentEditId: null,

    prepareEdit: (id) => {
        const user = Users.allUsers.find(u => u.id === id);
        if (!user) return;

        Users.currentEditId = id;
        const container = document.getElementById('addUserFormContainer');
        container.classList.remove('hidden');
        container.querySelector('h4').textContent = 'Edit Staff Member';

        const form = document.getElementById('addUserForm');
        form.full_name.value = user.full_name;
        form.role.value = user.role;
        form.allocation.value = user.allocation || '';
        form.phone_number.value = user.phone_number || '';
        form.username.value = user.username;
        form.password.placeholder = "Leave blank to keep current";
        form.password.required = false;

        form.querySelector('button[type="submit"]').textContent = 'Update User';
        container.scrollIntoView({ behavior: 'smooth' });
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        if (Users.currentEditId) {
            await Users.update(e);
        } else {
            await Users.create(e);
        }
    },

    create: async (e) => {
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                Users.resetForm();
                Users.load();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (e) {
            alert('Failed to create user');
        }
    },

    update: async (e) => {
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        if (!data.password || data.password.trim() === '') {
            delete data.password;
        }

        try {
            const res = await fetch(`/api/users/${Users.currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                Users.resetForm();
                Users.load();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (e) {
            alert('Failed to update user');
        }
    },

    resetForm: () => {
        const container = document.getElementById('addUserFormContainer');
        const form = document.getElementById('addUserForm');
        if (form) form.reset();
        if (form && form.password) {
            form.password.placeholder = "Login password";
            form.password.required = true;
        }
        const btn = form ? form.querySelector('button[type="submit"]') : null;
        if (btn) btn.textContent = 'Create User';
        const h4 = container.querySelector('h4');
        if (h4) h4.textContent = 'Create New Account';
        container.classList.add('hidden');
        Users.currentEditId = null;
    },

    delete: async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            Users.load();
        } catch (e) {
            alert('Delete failed');
        }
    }
};
