import { combineReducers } from 'redux';
import { itemConstants } from '@/constants';
import { Action, LoadingState } from '@/types';

export interface Items {
  id: number;
  availableQuantity: number;
  condition: string;
  fragile: boolean;
  name: string;
  storeId: number;
  storeName: string;
  requestedQuantity?: number;
}
interface DepartmentItemsAction extends Action {
  items: Items[];
}

type DepartmentItemsListState = Items[];

const IsRequestingDepartmentItems = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case itemConstants.REQUEST_GET_DEPARTMENT_ITEMS:
      return true;
    case itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS:
    case itemConstants.GET_DEPARTMENT_ITEMS_ERROR:
      return false;
    default:
      return state;
  }
};

const allDepartmentItemsList = (
  state: DepartmentItemsListState = [],
  action: DepartmentItemsAction
): DepartmentItemsListState => {
  switch (action.type) {
    case itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS:
      return action.items ?? state;
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
  IsRequestingDepartmentItems: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  //   pagination: PaginationState;
  allDepartmentItemsList: (
    state: DepartmentItemsListState | undefined,
    action: DepartmentItemsAction
  ) => DepartmentItemsListState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingDepartmentItems,
  //   pagination,
  allDepartmentItemsList,
});

export default rootReducer;
