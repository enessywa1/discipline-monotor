// notifications.js
const Notifications = {
    lastCount: 0,

    init: () => {
        const bell = document.getElementById('notifBell');
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();

                // Request Browser Permission on first interaction
                Notifications.requestPermission();

                const dropdown = document.getElementById('notifDropdown');
                dropdown.classList.toggle('show');

                // Clear badge when opening
                if (dropdown.classList.contains('show')) {
                    const badge = document.getElementById('notifBadge');
                    if (badge) {
                        badge.style.display = 'none';
                        badge.textContent = '0';
                    }
                    // Reset count to current length so next new one triggers correctly
                    Notifications.lastCount = parseInt(badge.dataset.count || '0');
                }
            });

            // Close when clicking outside
            document.addEventListener('click', () => {
                const drop = document.getElementById('notifDropdown');
                if (drop) drop.classList.remove('show');
            });

            Notifications.load(true); // Param to indicate initial load
            // Poll every 60s
            setInterval(Notifications.load, 60000);
        }
    },

    load: async (isInitial = false) => {
        const user = Auth.getUser();
        if (!user) return;

        try {
            const res = await fetch(`/api/notifications?user_id=${user.id}&role=${user.role}`);
            const data = await res.json();

            if (data.success && data.notifications.length) {
                const list = document.getElementById('notifList');
                const badge = document.getElementById('notifBadge');

                // Badge Logic
                badge.style.display = 'flex';
                badge.textContent = data.notifications.length;
                badge.dataset.count = data.notifications.length;

                // Browser Notification Logic
                // Only notify if not initial load AND count increased
                if (!isInitial && data.notifications.length > Notifications.lastCount) {
                    Notifications.notifyUser(data.notifications[0]); // Notify latest
                }

                // CRITICAL: Always sync count regardless of initial/background load
                Notifications.lastCount = data.notifications.length;

                // Render Dropdown
                list.innerHTML = data.notifications.slice(0, 5).map(n => `
                    <a href="${n.link}" class="notification-item" onclick="Notifications.handleClick(event, '${n.link}', ${n.id}, ${n.persistent})">
                        <i class='bx ${n.type === 'task' ? 'bx-task' : 'bx-info-circle'}' style="margin-right: 5px; color: var(--primary-color);"></i>
                        <div>
                            <div style="font-weight: 600; font-size: 0.85rem;">${n.message} ${n.persistent ? '<span style="color:var(--accent-color)">●</span>' : ''}</div>
                            <div style="font-size: 0.75rem; color: #999; margin-top: 2px;">${new Date(n.date).toLocaleDateString()}</div>
                        </div>
                    </a>
                `).join('');
            } else {
                document.getElementById('notifBadge').style.display = 'none';
                Notifications.lastCount = 0;
            }
        } catch (e) {
            console.error('Notif error', e);
        }
    },

    notifyUser: (note) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            try {
                const n = new Notification("School Discipline System", {
                    body: note.message,
                    icon: '/img/logo.png',
                    tag: 'discipline-notif-' + note.id
                });
                n.onclick = () => {
                    window.focus();
                    if (note.link) window.location.hash = note.link.replace('#', '');
                };
            } catch (e) {
                console.warn("Notification error (might be mobile/background constraint):", e);
            }
        }
    },

    requestPermission: () => {
        if (!("Notification" in window)) return;
        
        if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log('✅ Notification permission granted.');
                }
            });
        }
    },

    handleClick: async (e, link, id, isPersistent) => {
        e.preventDefault(); // Prevent immediate navigation

        if (isPersistent && id) {
            await Notifications.markAsRead(id, true);
        }

        window.location.href = link; // Navigate after marking read
    },

    markAsRead: async (id, isPersistent) => {
        if (!isPersistent || !id) return;
        try {
            await fetch(`/api/notifications/read/${id}`, { method: 'PUT' });
            Notifications.load(); // Refresh
        } catch (e) {
            console.error('Error marking as read', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', Notifications.init);
