import { permissionConstants } from '@/constants/permission.constant';
import { PermissionForm, PermissionUpdateForm } from '@/types/permission';

export interface GetPermissionsAction {
   type: typeof permissionConstants.GET_PERMISSIONS;
   data?: { page?: number; limit?: number; append?: boolean };
}

export interface CreatePermissionAction {
   type: typeof permissionConstants.CREATE_PERMISSION;
   data: PermissionForm;
}

export interface UpdatePermissionAction {
   type: typeof permissionConstants.UPDATE_PERMISSION;
   data: PermissionUpdateForm;
}

export interface DeletePermissionAction {
   type: typeof permissionConstants.DELETE_PERMISSION;
   id: number;
}

const getPermissions = (data?: { page?: number; limit?: number; append?: boolean }): GetPermissionsAction => ({
   type: permissionConstants.GET_PERMISSIONS,
   data,
});

const createPermission = (data: PermissionForm): CreatePermissionAction => ({
   type: permissionConstants.CREATE_PERMISSION,
   data,
});

const updatePermission = (data: PermissionUpdateForm): UpdatePermissionAction => ({
   type: permissionConstants.UPDATE_PERMISSION,
   data,
});

const deletePermission = (id: number): DeletePermissionAction => ({
   type: permissionConstants.DELETE_PERMISSION,
   id,
});

export const permissionActions = {
   getPermissions,
   createPermission,
   updatePermission,
   deletePermission,
};
