import { departmentConstants } from '@/constants';
import { DepartmentForm } from '@/types';

interface GetAllDepartmentsAction {
  type: typeof departmentConstants.GET_ALL_DEPARTMENTS;
  data?: { page?: number };
}

export interface GetUnpaginatedDepartmentsAction {
  type: typeof departmentConstants.GET_UNPAGINATED_DEPARTMENTS;
}
export interface CreateDepartmentAction {
  type: typeof departmentConstants.CREATE_DEPARTMENT;
  data: DepartmentForm;
}

const getAllDepartments = (data?: { page?: number }): GetAllDepartmentsAction => ({
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

export const departmentActions = {
  getAllDepartments,
  getUnpaginatedDepartments,
  createDepartment,
};
