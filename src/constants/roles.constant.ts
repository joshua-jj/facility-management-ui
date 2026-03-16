/**
 * Role IDs matching the backend Role entity.
 * Use these instead of hardcoding numeric IDs.
 */
export const RoleId = {
  ADMIN: 1,
  USER: 2,
  HOD: 3,
  MEMBER: 4,
  SUPER_ADMIN: 5,
} as const;

export type RoleIdValue = (typeof RoleId)[keyof typeof RoleId];

/** Roles with administrative privileges (store/department/user management) */
export const ADMIN_ROLES: RoleIdValue[] = [
  RoleId.ADMIN,
  RoleId.MEMBER,
  RoleId.SUPER_ADMIN,
];

/** Roles that can view all data */
export const ALL_DATA_ROLES: RoleIdValue[] = [
  RoleId.ADMIN,
  RoleId.USER,
  RoleId.HOD,
  RoleId.MEMBER,
  RoleId.SUPER_ADMIN,
];
