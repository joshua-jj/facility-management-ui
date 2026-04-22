import { permissionConstants } from '@/constants/permission.constant';

export interface GetPermissionsAction {
   type: typeof permissionConstants.GET_PERMISSIONS;
   data?: { page?: number; limit?: number; append?: boolean; search?: string; status?: string };
}

const getPermissions = (data?: { page?: number; limit?: number; append?: boolean; search?: string; status?: string }): GetPermissionsAction => ({
   type: permissionConstants.GET_PERMISSIONS,
   data,
});

export const permissionActions = {
   getPermissions,
};
