import { roleConstants } from '@/constants/role.constant';
import { RoleForm, RoleUpdateForm } from '@/types/role';

export interface GetRolesAction {
   type: typeof roleConstants.GET_ROLES;
   data?: { page?: number; limit?: number; append?: boolean };
}

export interface GetRoleAction {
   type: typeof roleConstants.GET_ROLE;
   id: number;
}

export interface CreateRoleAction {
   type: typeof roleConstants.CREATE_ROLE;
   data: RoleForm;
}

export interface UpdateRoleAction {
   type: typeof roleConstants.UPDATE_ROLE;
   data: RoleUpdateForm;
}

export interface DeleteRoleAction {
   type: typeof roleConstants.DELETE_ROLE;
   id: number;
}

export interface GetAvailablePermissionsAction {
   type: typeof roleConstants.GET_AVAILABLE_PERMISSIONS;
   roleId: number;
}

export interface GetAssignedPermissionsAction {
   type: typeof roleConstants.GET_ASSIGNED_PERMISSIONS;
   roleId: number;
}

export interface AddPermissionsToRoleAction {
   type: typeof roleConstants.ADD_PERMISSIONS_TO_ROLE;
   data: { roleId: number; permissionIds: number[] };
}

export interface RemovePermissionsFromRoleAction {
   type: typeof roleConstants.REMOVE_PERMISSIONS_FROM_ROLE;
   data: { roleId: number; permissionIds: number[] };
}

const getRoles = (data?: { page?: number; limit?: number; append?: boolean }): GetRolesAction => ({
   type: roleConstants.GET_ROLES,
   data,
});

const getRole = (id: number): GetRoleAction => ({
   type: roleConstants.GET_ROLE,
   id,
});

const createRole = (data: RoleForm): CreateRoleAction => ({
   type: roleConstants.CREATE_ROLE,
   data,
});

const updateRole = (data: RoleUpdateForm): UpdateRoleAction => ({
   type: roleConstants.UPDATE_ROLE,
   data,
});

const deleteRole = (id: number): DeleteRoleAction => ({
   type: roleConstants.DELETE_ROLE,
   id,
});

const getAvailablePermissions = (roleId: number): GetAvailablePermissionsAction => ({
   type: roleConstants.GET_AVAILABLE_PERMISSIONS,
   roleId,
});

const getAssignedPermissions = (roleId: number): GetAssignedPermissionsAction => ({
   type: roleConstants.GET_ASSIGNED_PERMISSIONS,
   roleId,
});

const addPermissionsToRole = (data: { roleId: number; permissionIds: number[] }): AddPermissionsToRoleAction => ({
   type: roleConstants.ADD_PERMISSIONS_TO_ROLE,
   data,
});

const removePermissionsFromRole = (data: { roleId: number; permissionIds: number[] }): RemovePermissionsFromRoleAction => ({
   type: roleConstants.REMOVE_PERMISSIONS_FROM_ROLE,
   data,
});

export const roleActions = {
   getRoles,
   getRole,
   createRole,
   updateRole,
   deleteRole,
   getAvailablePermissions,
   getAssignedPermissions,
   addPermissionsToRole,
   removePermissionsFromRole,
};
