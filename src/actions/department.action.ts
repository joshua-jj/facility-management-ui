import { departmentConstants } from '@/constants';
import { DepartmentForm } from '@/types';

interface GetAllDepartmentsAction {
  type: typeof departmentConstants.GET_ALL_DEPARTMENTS;
  data?: { page?: number; limit?: number; search?: string; status?: string; hasHod?: string };
}
export interface CreateDepartmentAction {
  type: typeof departmentConstants.CREATE_DEPARTMENT;
  data: DepartmentForm;
}

const getAllDepartments = (data?: { page?: number; limit?: number; search?: string; status?: string; hasHod?: string }): GetAllDepartmentsAction => ({
  type: departmentConstants.GET_ALL_DEPARTMENTS,
  data,
});

const createDepartment = (data: DepartmentForm): CreateDepartmentAction => ({
  type: departmentConstants.CREATE_DEPARTMENT,
  data,
});

export const departmentActions = {
  getAllDepartments,
  createDepartment,
};
