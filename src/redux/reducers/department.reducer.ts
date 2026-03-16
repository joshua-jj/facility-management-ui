import { combineReducers } from 'redux';
import { departmentConstants } from '@/constants';
import { Action, Department, LoadingState, PaginationState } from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

interface DepartmentsAction extends Action {
  departments: {
    items: Department[];
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

type DepartmentsListState = Department[];

const IsRequestingDepartments = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case departmentConstants.REQUEST_GET_ALL_DEPARTMENTS:
      return true;
    case departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS:
    case departmentConstants.GET_ALL_DEPARTMENTS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsCreatingDepartment = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case departmentConstants.REQUEST_CREATE_DEPARTMENT:
      return true;
    case departmentConstants.CREATE_DEPARTMENT_SUCCESS:
    case departmentConstants.CREATE_DEPARTMENT_ERROR:
      return false;
    default:
      return state;
  }
};

const allDepartmentsList = (
  state: DepartmentsListState = [],
  action: DepartmentsAction,
): DepartmentsListState => {
  switch (action.type) {
    case departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS:
      return action.departments?.items ?? state;
    default:
      return state;
  }
};

const pagination = (
  state: PaginationState = {
    links: { first: null, last: null, next: null, previous: null },
    meta: { currentPage: 0, itemCount: 0, itemsPerPage: 0, totalItems: 0, totalPages: 0 },
  },
  action: DepartmentsAction,
): PaginationState => {
  switch (action.type) {
    case departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS: {
      if (!action.departments?.meta) return state;
      return updateObject(state, {
        links: action.departments.links,
        meta: action.departments.meta,
      });
    }
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  IsRequestingDepartments,
  IsCreatingDepartment,
  allDepartmentsList,
  pagination,
});

export default rootReducer;
