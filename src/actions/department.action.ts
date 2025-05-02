import { departmentConstants } from '@/constants';
import { DepartmentForm } from '@/types';

interface GetAllDepartmentsAction {
  type: typeof departmentConstants.GET_ALL_DEPARTMENTS;
}
export interface CreateDepartmentAction {
  type: typeof departmentConstants.CREATE_DEPARTMENT;
  data: DepartmentForm;
}

const getAllDepartments = (): GetAllDepartmentsAction => ({
  type: departmentConstants.GET_ALL_DEPARTMENTS,
});

const createDepartment = (data: DepartmentForm): CreateDepartmentAction => ({
  type: departmentConstants.CREATE_DEPARTMENT,
  data,
});

export const departmentActions = {
  getAllDepartments,
  createDepartment,
};
