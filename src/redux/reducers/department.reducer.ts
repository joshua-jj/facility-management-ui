import { combineReducers } from 'redux';
import { departmentConstants } from '@/constants';
import { Action, Department, LoadingState } from '@/types';

interface DepartmentsAction extends Action {
  departments: Department[];
}

type DepartmentsListState = Department[];

const IsRequestingDepartments = (
  state: LoadingState = false,
  action: Action
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
  action: Action
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
  action: DepartmentsAction
): DepartmentsListState => {
  switch (action.type) {
    case departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS:
      return action.departments ?? state;
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingDepartments: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsCreatingDepartment: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  allDepartmentsList: (
    state: DepartmentsListState | undefined,
    action: DepartmentsAction
  ) => DepartmentsListState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingDepartments,
  IsCreatingDepartment,
  allDepartmentsList,
});

export default rootReducer;
