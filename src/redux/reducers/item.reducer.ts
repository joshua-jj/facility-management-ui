import { combineReducers } from 'redux';
import { itemConstants } from '@/constants';
import { Action, Item, LoadingState } from '@/types';

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
interface AllItemsAction extends Action {
  items: {
    items: Item[];
  };
  item: Item[];
}

type DepartmentItemsListState = Items[];
type AllItemsListState = Item[];

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

const IsRequestingAllItems = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case itemConstants.REQUEST_GET_ALL_ITEMS:
      return true;
    case itemConstants.GET_ALL_ITEMS_SUCCESS:
    case itemConstants.GET_ALL_ITEMS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSearchingItem = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case itemConstants.REQUEST_SEARCH_ITEM:
      return true;
    case itemConstants.SEARCH_ITEM_SUCCESS:
    case itemConstants.SEARCH_ITEM_ERROR:
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
const allItemsList = (
  state: AllItemsListState = [],
  action: AllItemsAction
): AllItemsListState => {
  switch (action.type) {
    case itemConstants.GET_ALL_ITEMS_SUCCESS:
      return action.items?.items ?? state;
    case itemConstants.SEARCH_ITEM_SUCCESS:
      return action.item ?? state;
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
  IsRequestingAllItems: (state: LoadingState, action: Action) => LoadingState;
  IsSearchingItem: (state: LoadingState, action: Action) => LoadingState;
  //   pagination: PaginationState;
  allDepartmentItemsList: (
    state: DepartmentItemsListState | undefined,
    action: DepartmentItemsAction
  ) => DepartmentItemsListState;
  allItemsList: (
    state: AllItemsListState | undefined,
    action: AllItemsAction
  ) => AllItemsListState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingDepartmentItems,
  IsRequestingAllItems,
  IsSearchingItem,
  //   pagination,
  allDepartmentItemsList,
  allItemsList,
});

export default rootReducer;
