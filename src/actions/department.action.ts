import { departmentConstants } from '../constants';

interface GetAllDepartmentsAction {
  type: typeof departmentConstants.GET_ALL_DEPARTMENTS;
}

const getAllDepartments = (): GetAllDepartmentsAction => ({
  type: departmentConstants.GET_ALL_DEPARTMENTS,
});

export const departmentActions = {
    getAllDepartments,
};
