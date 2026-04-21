import { PermissionAction } from '@/constants/rbac-modules.constant';

export interface Permission {
   id: number;
   module: string;
   action: PermissionAction;
   description: string | null;
   status: string;
   createdBy: string | null;
   createdAt: string;
   updatedAt: string;
}

export interface PermissionState {
   permissions: Permission[];
   availablePermissions: Permission[];
   assignedPermissions: Permission[];
   loading: boolean;
   error: string | null;
   success: boolean;
   message: string | null;
}

export interface PermissionReduxAction {
   type: string;
   permissions?: Permission[];
   availablePermissions?: Permission[];
   assignedPermissions?: Permission[];
   roleId?: number;
   message?: string;
   error?: string;
   loading?: boolean;
   success?: boolean;
}
