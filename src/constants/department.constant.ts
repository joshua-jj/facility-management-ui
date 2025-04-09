import { DepartmentConstants } from '@/types';
import { appConstants } from './app.constant';

const department: string = 'department';

export const departmentConstants: DepartmentConstants = {
  REQUEST_GET_ALL_DEPARTMENTS: 'REQUEST_GET_ALL_DEPARTMENTS',
  GET_ALL_DEPARTMENTS_SUCCESS: 'GET_ALL_DEPARTMENTS_SUCCESS',
  GET_ALL_DEPARTMENTS_ERROR: 'GET_ALL_DEPARTMENTS_ERROR',

  GET_ALL_DEPARTMENTS: 'GET_ALL_DEPARTMENTS',

  DEPARTMENT_URI: `${appConstants.BASE_URI}${department}`,
};
