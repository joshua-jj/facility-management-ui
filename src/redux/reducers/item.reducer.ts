import { combineReducers } from 'redux';
import { itemConstants } from '@/constants';
import { Action, Item, ItemUnit, LoadingState, PaginationState } from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

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
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
  id: number;
  item: Item[];
  itemDetails: {
    itemUnits: ItemUnit[];
  };
}

type DepartmentItemsListState = Items[];
type AllItemsListState = Item[];
type allItemUnitsListState = ItemUnit[];

const IsRequestingAllDepartmentItems = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case itemConstants.REQUEST_GET_ALL_DEPARTMENT_ITEMS:
      return true;
    case itemConstants.GET_ALL_DEPARTMENT_ITEMS_SUCCESS:
    case itemConstants.GET_ALL_DEPARTMENT_ITEMS_ERROR:
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
    case itemConstants.REQUEST_GET_DEPARTMENT_ITEMS:
      return true;
    case itemConstants.GET_ALL_ITEMS_SUCCESS:
    case itemConstants.GET_ALL_ITEMS_ERROR:
    case itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS:
    case itemConstants.GET_DEPARTMENT_ITEMS_ERROR:
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

const IsCreatingItem = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case itemConstants.REQUEST_CREATE_ITEM:
      return true;
    case itemConstants.CREATE_ITEM_SUCCESS:
    case itemConstants.CREATE_ITEM_ERROR:
      return false;
    default:
      return state;
  }
};

const IsUpdatingItem = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case itemConstants.REQUEST_UPDATE_ITEM:
      return true;
    case itemConstants.UPDATE_ITEM_SUCCESS:
    case itemConstants.UPDATE_ITEM_ERROR:
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
    case itemConstants.GET_ALL_DEPARTMENT_ITEMS_SUCCESS:
      return action.items ?? state;
    default:
      return state;
  }
};

const departmentItemsList = (
  state: AllItemsListState = [],
  action: AllItemsAction
): AllItemsListState => {
  switch (action.type) {
    case itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS:
      return action.items?.items ?? state;
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
    case itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS:
      return action.items?.items ?? state;
    case itemConstants.SEARCH_ITEM_SUCCESS:
      return action.item ?? state;
    case itemConstants.DELETE_ITEM_SUCCESS:
      return state.filter((item: Item) => item?.id !== action?.id);
    default:
      return state;
  }
};

const allItemUnitsList = (
  state: allItemUnitsListState = [],
  action: AllItemsAction
): allItemUnitsListState => {
  switch (action.type) {
    case itemConstants.GET_AN_ITEM_SUCCESS:
      return action.itemDetails?.itemUnits ?? state;
    default:
      return state;
  }
};

const pagination = (
  state: PaginationState = {
    links: {
      first: null,
      last: null,
      next: null,
      previous: null,
    },
    meta: {
      currentPage: 0,
      itemCount: 0,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    },
  },
  action: AllItemsAction
): PaginationState => {
  switch (action.type) {
    case itemConstants.GET_ALL_ITEMS_SUCCESS: {
      const { links, meta } = action.items;
      const result = {
        links,
        meta,
      };

      return updateObject(state, result);
    }
    case itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS: {
      const { links, meta } = action.items;
      const result = {
        links,
        meta,
      };

      return updateObject(state, result);
    }
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingAllDepartmentItems: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsRequestingAllItems: (state: LoadingState, action: Action) => LoadingState;
  IsSearchingItem: (state: LoadingState, action: Action) => LoadingState;
  IsCreatingItem: (state: LoadingState, action: Action) => LoadingState;
  IsUpdatingItem: (state: LoadingState, action: Action) => LoadingState;
  allDepartmentItemsList: (
    state: DepartmentItemsListState | undefined,
    action: DepartmentItemsAction
  ) => DepartmentItemsListState;
  departmentItemsList: (
    state: AllItemsListState | undefined,
    action: AllItemsAction
  ) => AllItemsListState;
  allItemsList: (
    state: AllItemsListState | undefined,
    action: AllItemsAction
  ) => AllItemsListState;
  allItemUnitsList: (
    state: allItemUnitsListState | undefined,
    action: AllItemsAction
  ) => allItemUnitsListState;
  pagination: (
    state: PaginationState | undefined,
    action: AllItemsAction
  ) => PaginationState;
  // pagination: PaginationState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingAllDepartmentItems,
  IsRequestingAllItems,
  IsSearchingItem,
  IsCreatingItem,
  IsUpdatingItem,
  allDepartmentItemsList,
  departmentItemsList,
  allItemsList,
  allItemUnitsList,
  pagination,
});

export default rootReducer;
