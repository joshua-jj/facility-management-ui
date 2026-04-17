import { departmentConstants } from '@/constants';
import { DepartmentForm } from '@/types';

interface GetAllDepartmentsAction {
  type: typeof departmentConstants.GET_ALL_DEPARTMENTS;
  data?: { page?: number; limit?: number; search?: string; status?: string; hasHod?: string };
}

export interface GetUnpaginatedDepartmentsAction {
  type: typeof departmentConstants.GET_UNPAGINATED_DEPARTMENTS;
}
export interface CreateDepartmentAction {
  type: typeof departmentConstants.CREATE_DEPARTMENT;
  data: DepartmentForm;
}
export interface UpdateDepartmentAction {
  type: typeof departmentConstants.UPDATE_DEPARTMENT;
  data: DepartmentForm & { id: number };
}
export interface ActivateDepartmentAction {
  type: typeof departmentConstants.ACTIVATE_DEPARTMENT;
  id: number;
}
export interface DeactivateDepartmentAction {
  type: typeof departmentConstants.DEACTIVATE_DEPARTMENT;
  id: number;
}

const getAllDepartments = (data?: { page?: number; limit?: number; search?: string; status?: string; hasHod?: string }): GetAllDepartmentsAction => ({
  type: departmentConstants.GET_ALL_DEPARTMENTS,
  data,
});

const getUnpaginatedDepartments = (): GetUnpaginatedDepartmentsAction => ({
  type: departmentConstants.GET_UNPAGINATED_DEPARTMENTS,
});

const createDepartment = (data: DepartmentForm): CreateDepartmentAction => ({
  type: departmentConstants.CREATE_DEPARTMENT,
  data,
});

const updateDepartment = (data: DepartmentForm & { id: number }): UpdateDepartmentAction => ({
  type: departmentConstants.UPDATE_DEPARTMENT,
  data,
});

const activateDepartment = (id: number): ActivateDepartmentAction => ({
  type: departmentConstants.ACTIVATE_DEPARTMENT,
  id,
});

const deactivateDepartment = (id: number): DeactivateDepartmentAction => ({
  type: departmentConstants.DEACTIVATE_DEPARTMENT,
  id,
});

export const departmentActions = {
  getAllDepartments,
  getUnpaginatedDepartments,
  createDepartment,
  updateDepartment,
  activateDepartment,
  deactivateDepartment,
};
