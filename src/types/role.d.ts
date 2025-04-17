export interface RoleConstants {
    REQUEST_GET_ROLES: string;
    GET_ROLES_SUCCESS: string;
    GET_ROLES_ERROR: string;
  
    GET_ROLES: string;
  
    ROLE_URI: string;
  }
export interface Role {
    id: number;
    status: number | string;
    createdAt: string;
    updatedAt: null;
    createdBy: string;
    updatedBy: null;
    name: string;
    description: string;
  }
export interface RoleState {
    roles: Role[];
  }

  export interface RoleAction {
    type: string;
    roles?: Role[];
  }
  