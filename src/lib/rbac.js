export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  SCHOOL_STAFF: 'SCHOOL_STAFF',
  JADELC_STAFF: 'JADELC_STAFF',
});

export const ROLE_GROUPS = Object.freeze({
  SCHOOL_USERS: [ROLES.SCHOOL_ADMIN, ROLES.SCHOOL_STAFF],
  SCHOOL_ADMINS: [ROLES.SCHOOL_ADMIN],
  STAFF_USERS: [ROLES.JADELC_STAFF, ROLES.SCHOOL_STAFF],
  JADELC: [ROLES.JADELC_STAFF],
});

export function hasRole(role, roles) {
  return Array.isArray(roles) && roles.includes(role);
}
