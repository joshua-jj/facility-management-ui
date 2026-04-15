export interface Permission {
   id: number;
   name: string;
   description?: string;
   status?: string;
   createdBy?: string;
   createdAt?: string;
   updatedAt?: string;
}

export interface PermissionForm {
   name: string;
   description?: string;
}

export interface PermissionUpdateForm {
   id: number;
   name: string;
   description?: string;
}

export interface CreatePermissionAction {
   type: string;
   data: PermissionForm;
}

export interface UpdatePermissionAction {
   type: string;
   data: PermissionUpdateForm;
}

export interface DeletePermissionAction {
   type: string;
   id: number;
}
