import { Permission } from './permission';

export interface Role {
   id: number;
   name: string;
   description?: string;
   status: string | number;
   preset: boolean;
   createdAt?: string;
   updatedAt?: string;
   createdBy?: string;
   updatedBy?: string;
   permissions?: Permission[];
}

export interface RoleForm {
   name: string;
   description?: string;
}

export interface RoleUpdateForm {
   id: number;
   name: string;
   description?: string;
}

export interface GetRolesAction {
   type: string;
   data?: { page?: number; limit?: number; append?: boolean };
}

export interface GetRoleAction {
   type: string;
   id: number;
}

export interface CreateRoleAction {
   type: string;
   data: RoleForm;
}

export interface UpdateRoleAction {
   type: string;
   data: RoleUpdateForm;
}

export interface DeleteRoleAction {
   type: string;
   id: number;
}

export interface GetAvailablePermissionsAction {
   type: string;
   roleId: number;
}

export interface GetAssignedPermissionsAction {
   type: string;
   roleId: number;
}

export interface AddPermissionsToRoleAction {
   type: string;
   data: { roleId: number; permissionIds: number[] };
}

export interface RemovePermissionsFromRoleAction {
   type: string;
   data: { roleId: number; permissionIds: number[] };
}

export interface ReplaceRolePermissionsAction {
   type: string;
   data: {
      roleId: number;
      permissionIds: number[];
   };
}
