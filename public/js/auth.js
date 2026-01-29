// auth.js
const Auth = {
    getUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    check: () => {
        const user = Auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        // Update Sidebar Info
        const nameEl = document.getElementById('navUserName') || document.getElementById('userFullName');
        const roleEl = document.getElementById('navUserRole') || document.getElementById('userRole');

        if (nameEl) nameEl.textContent = user.full_name;
        if (roleEl) roleEl.textContent = user.role;

        // Role Based Visibility Logic
        const isAdmin = ['Director', 'Principal', 'Associate Principal', 'Dean of Students', 'Discipline Master', 'Assistant Discipline Master', 'QA', 'CIE'].includes(user.role);
        const isPatronMatron = ['Patron', 'Matron', 'Head Patron'].includes(user.role);

        document.querySelectorAll('[data-role]').forEach(el => {
            const roles = el.dataset.role.split(',').map(r => r.trim().toLowerCase());

            let show = false;
            if (roles.includes('admin') && isAdmin) show = true;
            if (roles.includes('patron') && user.role === 'Patron') show = true;
            if (roles.includes('matron') && user.role === 'Matron') show = true;
            if (roles.includes('patron-matron') && isPatronMatron) show = true;
            if (roles.includes('all')) show = true;

            if (show) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });
    },

    logout: () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
};

// Auto check on load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        Auth.check();

        const logoutBtn = document.getElementById('log_out');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', Auth.logout);
        }
    }
});
