// notifications.js
const Notifications = {
    lastCount: 0,
    currentNotifications: [],
    openedNotifications: null,

    init: () => {
        const bell = document.getElementById('notifBell');
        if (bell) {
            bell.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (e.target.closest('#notifDropdown')) return;

                // Request Browser Permission on first interaction
                Notifications.requestPermission();

                const dropdown = document.getElementById('notifDropdown');
                dropdown.classList.toggle('show');

                if (dropdown.classList.contains('show')) {
                    const notifications = await Notifications.load(true);
                    Notifications.openedNotifications = notifications;
                    Notifications.renderList(notifications);
                    await Notifications.clearAll(notifications);
                } else {
                    Notifications.openedNotifications = null;
                    Notifications.load();
                }
            });

            // Close when clicking outside
            document.addEventListener('click', () => {
                const drop = document.getElementById('notifDropdown');
                if (drop && drop.classList.contains('show')) {
                    drop.classList.remove('show');
                    Notifications.openedNotifications = null;
                }
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

            if (res.ok && data.success) {
                const dismissedAt = Number(localStorage.getItem(`notifications-dismissed-at-${user.id}`) || 0);
                const notifications = data.notifications || [];
                const visibleNotifications = notifications.filter((notification) => {
                    if (notification.persistent) return true;
                    const createdAt = new Date(notification.date).getTime();
                    return !dismissedAt || !Number.isFinite(createdAt) || createdAt > dismissedAt;
                });
                Notifications.currentNotifications = visibleNotifications;

                const list = document.getElementById('notifList');
                const badge = document.getElementById('notifBadge');
                if (!list || !badge) return;

                // Browser Notification Logic
                // Only notify if not initial load AND count increased
                if (!isInitial && visibleNotifications.length > Notifications.lastCount) {
                    Notifications.notifyUser(visibleNotifications[0]); // Notify latest
                    Notifications.showToast(visibleNotifications[0]);
                }

                // CRITICAL: Always sync count regardless of initial/background load
                Notifications.lastCount = visibleNotifications.length;
                badge.style.display = visibleNotifications.length ? 'flex' : 'none';
                badge.textContent = visibleNotifications.length;
                badge.dataset.count = visibleNotifications.length;

                if (Notifications.openedNotifications) {
                    const openedKeys = new Set(Notifications.openedNotifications.map(Notifications.notificationKey));
                    const newNotifications = visibleNotifications.filter((note) => !openedKeys.has(Notifications.notificationKey(note)));
                    Notifications.openedNotifications = [...Notifications.openedNotifications, ...newNotifications];
                    Notifications.renderList(Notifications.openedNotifications);
                } else {
                    Notifications.renderList(visibleNotifications);
                }
                return visibleNotifications;
            } else {
                console.error('Unable to load notifications:', data.error || res.statusText);
                const badge = document.getElementById('notifBadge');
                if (badge) badge.style.display = 'none';
                Notifications.lastCount = 0;
                Notifications.currentNotifications = [];
                return [];
            }
        } catch (e) {
            console.error('Notif error', e);
            return [];
        }
    },

    notificationKey: (notification) =>
        `${notification.persistent ? 'persistent' : notification.type}-${notification.id || notification.date + notification.message}`,

    renderList: (notifications) => {
        const list = document.getElementById('notifList');
        if (!list) return;
        list.innerHTML = notifications.length ? notifications.slice(0, 5).map(n => `
                    <a href="${n.link}" class="notification-item" onclick="Notifications.handleClick(event, '${n.link}', ${n.id}, ${n.persistent})">
                        <i class='bx ${n.type === 'task' ? 'bx-task' : 'bx-info-circle'}' style="margin-right: 5px; color: var(--primary-color);"></i>
                        <div>
                            <div style="font-weight: 600; font-size: 0.85rem;">${n.message} ${n.persistent ? '<span style="color:var(--accent-color)">●</span>' : ''}</div>
                            <div style="font-size: 0.75rem; color: #999; margin-top: 2px;">${new Date(n.date).toLocaleDateString()}</div>
                        </div>
                    </a>
                `).join('') : '<div style="padding: 20px; text-align: center; color: #999;">No notifications</div>';
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

    showToast: (note) => {
        const previousToast = document.getElementById('liveNotificationToast');
        if (previousToast) previousToast.remove();

        const toast = document.createElement('div');
        toast.id = 'liveNotificationToast';
        toast.setAttribute('role', 'status');
        Object.assign(toast.style, {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            zIndex: '10000',
            width: 'min(360px, calc(100vw - 40px))',
            padding: '16px 18px',
            background: '#fff',
            color: '#1f2937',
            borderLeft: '4px solid #00695c',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            cursor: 'pointer'
        });

        const title = document.createElement('strong');
        title.textContent = note.title || 'New notification';
        const message = document.createElement('div');
        message.textContent = note.message;
        message.style.marginTop = '5px';
        toast.append(title, message);
        toast.addEventListener('click', () => {
            toast.remove();
            if (note.link) window.location.href = note.link;
        });
        document.body.appendChild(toast);
        window.setTimeout(() => toast.remove(), 8000);
    },

    requestPermission: () => {
        if (!("Notification" in window)) return;

        const enablePush = () => {
            const user = Auth.getUser();
            if (user && 'serviceWorker' in navigator && typeof PWA !== 'undefined') {
                navigator.serviceWorker.ready
                    .then(registration => PWA.subscribeToPush(registration, user.id))
                    .catch(error => console.error('Unable to enable push notifications:', error));
            }
        };
        if (Notification.permission === 'granted') enablePush();
        else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') enablePush();
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

    clearAll: async (notifications = Notifications.currentNotifications) => {
        const user = Auth.getUser();
        if (!user) return;

        const persistentIds = notifications
            .filter((notification) => notification.persistent && notification.id)
            .map((notification) => notification.id);

        localStorage.setItem(`notifications-dismissed-at-${user.id}`, String(Date.now()));
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
            badge.dataset.count = '0';
        }

        if (persistentIds.length) {
            try {
                const response = await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: persistentIds })
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to clear notifications.');
                }
            } catch (error) {
                console.error('Error clearing notifications:', error);
                localStorage.removeItem(`notifications-dismissed-at-${user.id}`);
                Notifications.load();
            }
        }
        Notifications.lastCount = 0;
    },

    bindBroadcastForm: (container) => {
        const form = container.querySelector('#popupNotificationForm');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            const status = form.querySelector('#popupNotificationStatus');
            const formData = new FormData(form);
            button.disabled = true;
            status.textContent = 'Sending...';

            try {
                const response = await fetch('/api/notifications/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: formData.get('title'),
                        message: formData.get('message'),
                        link: '#dashboard'
                    })
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to send the notification.');
                }

                form.reset();
                status.textContent = `Sent to ${result.recipients} user(s).`;
            } catch (error) {
                status.textContent = error.message || 'Unable to send the notification.';
            } finally {
                button.disabled = false;
            }
        });
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
