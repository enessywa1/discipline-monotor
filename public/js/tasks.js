const Tasks = {
    render: async (container) => {
        const user = Auth.getUser();
        const isAdmin = ['Director', 'Principal', 'Discipline Master', 'Assistant Discipline Master', 'Head Patron'].includes(user.role);

        container.innerHTML = `
            <div class="card" id="tasksViewContainer">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Task Management</h3>
                    ${isAdmin ? '<button class="btn btn-primary" data-action="open-modal"><i class="bx bx-plus"></i> Assign Task</button>' : ''}
                </div>

                <div class="tabs" style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button class="tab-btn active" data-action="filter" data-status="pending" style="flex: 1; min-width: 120px; padding: 10px 20px; border: 2px solid var(--primary-color); background: var(--primary-color); color: white; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s;">Pending</button>
                    <button class="tab-btn" data-action="filter" data-status="progress" style="flex: 1; min-width: 120px; padding: 10px 20px; border: 2px solid #e0e0e0; background: white; color: var(--text-primary); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s;">In Progress</button>
                    <button class="tab-btn" data-action="filter" data-status="completed" style="flex: 1; min-width: 120px; padding: 10px 20px; border: 2px solid #e0e0e0; background: white; color: var(--text-primary); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s;">Completed</button>
                </div>

                <div id="tasksList" style="display: grid; gap: 15px;">
                    <p>Loading tasks...</p>
                </div>
            </div>

            <!-- Modal for New Task -->
            <div id="taskModal" class="sidebar-overlay" style="z-index: 2000; display: none;">
                <div class="card" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 500px;">
                    <h3>Assign New Task</h3>
                    <form id="assignTaskForm">
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" name="title" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" rows="3" style="width: 100%; border: 1px solid var(--border-color); border-radius: 4px; padding: 8px;"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Assign To</label>
                            <select name="assigned_to" id="userSelect" style="width: 100%; padding: 10px;" required>
                                <option value="">Loading users...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" name="due_date" required>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                            <button type="button" class="btn" data-action="close-modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Assign</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Delegated Event Listener
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            if (action === 'open-modal') Tasks.openAssignModal();
            if (action === 'close-modal') Tasks.closeModal();
            if (action === 'filter') {
                Tasks.filter(btn.dataset.status, btn);
            }
            if (action === 'update-status') {
                Tasks.updateStatus(btn.dataset.id, btn.dataset.newStatus);
            }
        });

        // Fetch Data
        await Tasks.loadTasks();
        if (isAdmin) await Tasks.loadUsers();

        // Bind Form
        const form = document.getElementById('assignTaskForm');
        if (form) {
            form.onsubmit = Tasks.handleAssign;
        }

        Tasks.startPolling();
    },

    refreshInterval: null,

    startPolling: () => {
        Tasks.stopPolling();
        Tasks.refreshInterval = setInterval(() => {
            Tasks.loadTasks(true); // true = quiet reload
        }, 15000); // 15 seconds
    },

    stopPolling: () => {
        if (Tasks.refreshInterval) {
            clearInterval(Tasks.refreshInterval);
            Tasks.refreshInterval = null;
        }
    },

    loadTasks: async (isQuiet = false) => {
        try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            if (data.success) {
                Tasks.allTasks = data.tasks;
                // Keep current filter if possible, else default to Pending
                const activeTab = document.querySelector('.tab-btn.active');
                const currentStatus = activeTab ? activeTab.dataset.status : 'pending';
                const map = { 'pending': 'Pending', 'progress': 'In Progress', 'completed': 'Completed' };
                Tasks.renderList(map[currentStatus] || 'Pending');
            }
        } catch (e) {
            if (!isQuiet) {
                document.getElementById('tasksList').innerHTML = '<p style="color:red">Failed to load tasks.</p>';
            }
        }
    },

    loadUsers: async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            const select = document.getElementById('userSelect');
            if (select && data.success) {
                select.innerHTML = data.users.map(u => `<option value="${u.id}">${u.full_name} (${u.role})</option>`).join('');
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderList: (statusFilter) => {
        const list = document.getElementById('tasksList');
        const tasks = Tasks.allTasks || [];

        const filtered = tasks.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());

        if (filtered.length === 0) {
            list.innerHTML = `<p style="text-align:center; color: var(--text-secondary); padding: 20px;">No ${statusFilter} tasks found.</p>`;
            return;
        }

        list.innerHTML = filtered.map(t => {
            const isAssignedToMe = t.assigned_to === Auth.getUser().id;
            const statusColors = {
                'Pending': { bg: '#fff3e0', color: '#e65100', border: '#ffb74d' },
                'In Progress': { bg: '#e3f2fd', color: '#0d47a1', border: '#42a5f5' },
                'Completed': { bg: '#e8f5e9', color: '#1b5e20', border: '#66bb6a' }
            };
            const statusStyle = statusColors[t.status] || { bg: '#f5f5f5', color: '#666', border: '#ddd' };

            return `
            <div style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: white;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <h4 style="margin:0;">${t.title}</h4>
                    <span style="font-size: 0.75rem; font-weight: 600; background: ${statusStyle.bg}; color: ${statusStyle.color}; border: 1px solid ${statusStyle.border}; padding: 4px 12px; border-radius: 12px; white-space: nowrap;">${t.status}</span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">${t.description || 'No description'}</p>
                <div style="font-size: 0.8rem; color: #666; display: flex; justify-content: space-between; align-items: center;">
                    <span>Assigned to: <strong>${t.assignee_name}</strong> by ${t.assigner_name}</span>
                    <span>Due: ${t.due_date || 'No date'}</span>
                </div>
                
                ${isAssignedToMe && t.status !== 'Completed' ? `
                    <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                        ${t.status === 'Pending' ?
                        `<button class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 10px;" data-action="update-status" data-id="${t.id}" data-new-status="In Progress">Start Task</button>` :
                        `<button class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 10px; background-color: var(--primary-dark);" data-action="update-status" data-id="${t.id}" data-new-status="Completed">Mark Complete</button>`
                    }
                    </div>
                ` : ''}
            </div>
        `}).join('');
    },

    filter: (status, btn) => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'white';
            b.style.color = 'var(--text-primary)';
            b.style.borderColor = '#e0e0e0';
        });

        if (btn) {
            btn.classList.add('active');
            btn.style.background = 'var(--primary-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--primary-color)';
        }

        const map = { 'pending': 'Pending', 'progress': 'In Progress', 'completed': 'Completed' };
        Tasks.renderList(map[status]);
    },

    openAssignModal: () => {
        document.getElementById('taskModal').style.display = 'block';
    },

    closeModal: () => {
        document.getElementById('taskModal').style.display = 'none';
    },

    handleAssign: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.assigned_by = Auth.getUser().id;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                Tasks.closeModal();
                e.target.reset();
                Tasks.loadTasks(); // Refresh
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            alert('Network error');
        }
    },

    updateStatus: async (id, newStatus) => {
        try {
            await fetch(`/api/tasks/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            Tasks.loadTasks();
        } catch (e) {
            alert('Failed to update status');
        }
    }
};
