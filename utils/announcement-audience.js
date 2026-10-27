const PATRON_MATRON_ROLES = ['patron', 'matron', 'head patron', 'head matron', 'pastor'];

const isVisibleToRole = (visibility, role) => {
    const audience = (visibility || 'All').trim().toLowerCase();
    const normalizedRole = (role || '').trim().toLowerCase();

    if (['all', 'everyone', 'staff'].includes(audience)) return true;
    if (audience === 'teachers') return normalizedRole === 'teacher';
    if (['patrons/matrons', 'patrons and matrons'].includes(audience)) {
        return PATRON_MATRON_ROLES.includes(normalizedRole);
    }

    return false;
};

const getPushRoleFilter = (visibility) => {
    const audience = (visibility || 'All').trim().toLowerCase();
    if (audience === 'teachers') return ['teacher'];
    if (['patrons/matrons', 'patrons and matrons'].includes(audience)) {
        return PATRON_MATRON_ROLES;
    }
    return null;
};

module.exports = { isVisibleToRole, getPushRoleFilter };
