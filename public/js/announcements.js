const Announcements = {
    render: async (container) => {
        const user = Auth.getUser();
        const adminRoles = ['Developer', 'Director', 'Principal', 'Associate Principal', 'Dean of Students', 'Discipline Master', 'Assistant Discipline Master', 'QA', 'CIE', 'Head Patron', 'Head Matron'];
        const canPost = adminRoles.includes(user.role);

        container.innerHTML = `
            <div class="card" id="announcementsViewContainer">
                <h3>Announcements Board</h3>
                <p style="color:grey; margin-bottom: 20px;">Important updates from the administration.</p>
                
                ${canPost ? `
                <div style="background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 2px solid var(--primary-color); box-shadow: 0 2px 8px rgba(0,121,107,0.1);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <i class='bx bx-megaphone' style="font-size: 1.5rem; color: var(--primary-color);"></i>
                        <h4 style="color: var(--primary-dark); margin: 0;">Post New Announcement</h4>
                    </div>
                    <form id="announcementForm">
                        <div class="form-group" style="margin-bottom: 12px;">
                            <input type="text" name="title" placeholder="Announcement Title" required style="width: 100%; padding: 12px 15px; border: 2px solid #b2dfdb; border-radius: 8px; font-size: 0.95rem; transition: border-color 0.3s; background: white;">
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <textarea name="content" rows="3" placeholder="Type your message here..." required style="width: 100%; padding: 12px 15px; border: 2px solid #b2dfdb; border-radius: 8px; font-size: 0.95rem; resize: vertical; transition: border-color 0.3s; background: white; font-family: inherit;"></textarea>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <select name="visibility" style="padding: 10px 15px; border: 2px solid #b2dfdb; border-radius: 8px; background: white; color: var(--text-primary); font-weight: 500; cursor: pointer; min-width: 150px;">
                                <option value="All">📢 Visible to All</option>
                                <option value="Staff">👥 Staff Only</option>
                            </select>
                            <select name="duration" style="padding: 10px 15px; border: 2px solid #b2dfdb; border-radius: 8px; background: white; color: var(--text-primary); font-weight: 500; cursor: pointer; min-width: 150px;">
                                <option value="Permanent">♾️ Permanent</option>
                                <option value="1">⏱️ Lasts 1 Day</option>
                                <option value="3">⏱️ Lasts 3 Days</option>
                                <option value="7">⏱️ Lasts 7 Days</option>
                                <option value="30">⏱️ Lasts 30 Days</option>
                            </select>
                            <button type="submit" class="btn btn-primary" style="padding: 10px 25px; display: flex; align-items: center; gap: 8px;">
                                <i class='bx bx-send'></i> Post Announcement
                            </button>
                        </div>
                    </form>
                </div>
                ` : ''}

                <div id="announcementFeed">
                    <p>Loading...</p>
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

                feed.innerHTML = data.announcements.map(a => `
                    <div style="border-bottom: 1px solid #eee; padding: 15px 0; position: relative;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; align-items: start;">
                            <strong style="color: var(--primary-dark); font-size: 1.1rem;">${a.title}</strong>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 0.8rem; color: #888;">${new Date(a.created_at).toLocaleDateString()}</span>
                                ${canDelete ? `
                                    <button data-action="delete" data-id="${a.id}" style="background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.2s;">
                                        <i class='bx bx-trash'></i> Delete
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p style="margin-bottom: 8px; line-height: 1.5;">${a.content}</p>
                        <div style="font-size: 0.8rem; color: #666; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span>Posted by: ${a.author}</span>
                            <span style="background: #eee; padding: 2px 6px; border-radius: 10px;">${a.visibility}</span>
                            ${a.expires_at ? `<span style="color: var(--danger); font-size: 0.75rem;"><i class='bx bx-time-five'></i> Expires: ${new Date(a.expires_at).toLocaleDateString()}</span>` : '<span style="color: #4db6ac; font-size: 0.75rem;"><i class="bx bx-infinite"></i> Permanent</span>'}
                        </div >
                    </div >
    `).join('');
            } else {
                feed.innerHTML = '<p>No announcements yet.</p>';
            }
        } catch (e) {
            feed.innerHTML = '<p>Error loading announcements.</p>';
        }
    },

    post: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.posted_by = Auth.getUser().id;

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
        }
    },

    delete: async (id) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const res = await fetch(`/ api / announcements / ${id} `, {
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
