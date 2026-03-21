const Announcements = {
    render: async (container) => {
        const user = Auth.getUser();
        const adminRoles = ['Developer', 'Director', 'Principal', 'Associate Principal', 'Dean of Students', 'Discipline Master', 'Assistant Discipline Master', 'QA', 'CIE', 'Head Patron', 'Head Matron'];
        const canPost = adminRoles.includes(user.role);

        container.innerHTML = `
            <div class="announcements-container">
                <div class="panel-header" style="margin-bottom: 30px; border-bottom: none;">
                    <div>
                        <h3 style="margin-bottom: 4px;">Announcements Board</h3>
                        <p style="color: grey; font-size: 0.95rem;">Important updates and broadcasts from administration.</p>
                    </div>
                </div>
                
                ${canPost ? `
                <div class="announcement-composer">
                    <div class="composer-header">
                        <i class='bx bx-megaphone'></i>
                        <h4>Create New Broadcast</h4>
                    </div>
                    <form id="announcementForm">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <input type="text" name="title" class="premium-input" placeholder="Give your announcement a clear title" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <textarea name="content" rows="4" class="premium-input" placeholder="What would you like to update the team on?" required style="font-family: inherit; resize: vertical;"></textarea>
                        </div>
                        
                        <div class="control-row">
                            <div style="display: flex; gap: 12px;">
                                <select name="visibility" class="premium-select">
                                    <option value="All">📢 Everyone</option>
                                    <option value="Staff">👥 Staff Only</option>
                                </select>
                                <select name="duration" class="premium-select">
                                    <option value="Permanent">♾️ Permanent</option>
                                    <option value="1">⏱️ Lasts 1 Day</option>
                                    <option value="3">⏱️ Lasts 3 Days</option>
                                    <option value="7">⏱️ Lasts 7 Days</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary" style="padding: 12px 25px; border-radius: 12px;">
                                <i class='bx bx-paper-plane'></i> Post Announcement
                            </button>
                        </div>
                    </form>
                </div>
                ` : ''}

                <div id="announcementFeed">
                    <div style="text-align: center; padding: 40px; color: #94a3b8;">
                        <i class='bx bx-loader-circle bx-spin' style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Loading latest transmissions...</p>
                    </div>
                </div>
            </div>
        `;

        // Delegated Event Listener
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="delete"]');
            if (btn) {
                Announcements.delete(parseInt(btn.dataset.id));
            }
        });

        if (canPost) {
            document.getElementById('announcementForm').addEventListener('submit', Announcements.post);
        }

        Announcements.load();
    },

    load: async () => {
        const feed = document.getElementById('announcementFeed');
        try {
            const res = await fetch('/api/announcements');
            const data = await res.json();

            if (data.success && data.announcements.length) {
                const user = Auth.getUser();
                const adminRoles = ['Developer', 'Director', 'Principal', 'Associate Principal', 'Dean of Students', 'Discipline Master', 'Assistant Discipline Master', 'QA', 'CIE', 'Head Patron', 'Head Matron'];
                const canDelete = adminRoles.includes(user.role);

                feed.innerHTML = data.announcements.map((a, i) => `
                    <div class="announcement-card-full fade-in" style="animation-delay: ${i * 0.1}s">
                        <div class="card-top">
                            <div>
                                <h3 class="card-title-full">${a.title}</h3>
                                <div class="announcement-meta" style="margin-top: 4px;">
                                    <i class='bx bx-user'></i> ${a.author} &bull; 
                                    <i class='bx bx-calendar'></i> ${new Date(a.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="badge-outline ${a.visibility === 'Staff' ? 'staff' : 'all'}">${a.visibility}</span>
                                ${canDelete ? `
                                    <button data-action="delete" data-id="${a.id}" class="delete-action">
                                        <i class='bx bx-trash'></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="card-body-full">
                            ${a.content}
                        </div>
                        <div class="card-footer-full">
                            <span style="font-size: 0.8rem; font-weight: 600; color: ${a.expires_at ? '#ef4444' : '#10b981'}; display: flex; align-items: center; gap: 5px;">
                                ${a.expires_at ? `<i class='bx bx-time-five'></i> Exp: ${new Date(a.expires_at).toLocaleDateString()}` : '<i class="bx bx-infinite"></i> Active Transmission'}
                            </span>
                            <i class='bx bx-check-double' style="color: #94a3b8;"></i>
                        </div>
                    </div>
                `).join('');
            } else {
                feed.innerHTML = `
                    <div style="text-align: center; padding: 60px; background: rgba(0,0,0,0.02); border-radius: 20px; border: 2px dashed rgba(0,0,0,0.05);">
                        <i class='bx bx-ghost' style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
                        <h4 style="color: #64748b;">No Announcements Yet</h4>
                        <p style="color: #94a3b8;">The bulletin board is quiet for now.</p>
                    </div>
                `;
            }
        } catch (e) {
            feed.innerHTML = '<p style="color: var(--danger); text-align: center; padding: 20px;">Error connecting to announcement server.</p>';
        }
    },

    post: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.posted_by = Auth.getUser().id;

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Posting...`;

        try {
            const res = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                e.target.reset();
                Announcements.load();
            } else {
                alert('Failed to post');
            }
        } catch (e) {
            alert('Error posting');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    delete: async (id) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const res = await fetch(`/api/announcements/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                Announcements.load();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Error deleting announcement');
        }
    }
};
