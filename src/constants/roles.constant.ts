export enum RoleId {
   USER = 1,
   ADMIN = 2,
   HOD = 3,
   MEMBER = 4,
   SUPER_ADMIN = 5,
   OFFICE = 6,
}

export type RoleIdValue = (typeof RoleId)[keyof typeof RoleId];

export const ADMIN_ROLES: RoleIdValue[] = [
   RoleId.ADMIN,
   RoleId.SUPER_ADMIN,
   RoleId.OFFICE,
];

export const ALL_DATA_ROLES: RoleIdValue[] = [
   RoleId.ADMIN,
   RoleId.SUPER_ADMIN,
   RoleId.OFFICE,
   RoleId.HOD,
];
