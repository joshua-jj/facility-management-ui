import { combineReducers } from 'redux';
import { departmentConstants } from '../../constants';
import { Action, LoadingState } from '@/types';

export interface Department {
  id: string;
  hodEmail: string;
  hodName: string;
  hodPhone: string;
  name: string;
  status: string;
}

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

// const pagination = (
//   state: PaginationState = null,
//   action: Action
// ): PaginationState => {
//   switch (action.type) {
//     case eventConstants.GET_ALL_EVENTS_SUCCESS:
//       return action.pagination ?? state;
//     default:
//       return state;
//   }
// };

export interface RootState {
  IsRequestingDepartments: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  //   pagination: PaginationState;
  allDepartmentsList: (
    state: DepartmentsListState | undefined,
    action: DepartmentsAction
  ) => DepartmentsListState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingDepartments,
  //   pagination,
  allDepartmentsList,
});

export default rootReducer;
