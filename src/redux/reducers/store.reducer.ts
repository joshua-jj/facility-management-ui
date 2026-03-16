import { combineReducers } from 'redux';
import { storeConstants } from '@/constants';
import { Action, LoadingState, PaginationState, Store, StoreAction } from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

type StoresListState = Store[];

interface AllStoresAction extends Action {
  stores: {
    items: Store[];
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
  store: Store[];
}

const IsRequestingStores = (
  state: LoadingState = false,
  action: StoreAction
): LoadingState => {
  switch (action.type) {
    case storeConstants.REQUEST_GET_STORES:
      return true;
    case storeConstants.GET_STORES_SUCCESS:
    case storeConstants.GET_STORES_ERROR:
      return false;
    default:
      return state;
  }
};

const IsCreatingStore = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case storeConstants.REQUEST_CREATE_STORE:
    case storeConstants.REQUEST_UPDATE_STORE:
      return true;
    case storeConstants.CREATE_STORE_SUCCESS:
    case storeConstants.CREATE_STORE_ERROR:
    case storeConstants.UPDATE_STORE_SUCCESS:
    case storeConstants.UPDATE_STORE_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSearchingStore = (
  state: LoadingState = false,
  action: StoreAction
): LoadingState => {
  switch (action.type) {
    case storeConstants.REQUEST_SEARCH_STORE:
      return true;
    case storeConstants.SEARCH_STORE_SUCCESS:
    case storeConstants.SEARCH_STORE_ERROR:
      return false;
    default:
      return state;
  }
};

const allStoresList = (
  state: StoresListState = [],
  action: AllStoresAction
): StoresListState => {
  switch (action.type) {
    case storeConstants.GET_STORES_SUCCESS:
      return action.stores?.items ?? state;
    case storeConstants.SEARCH_STORE_SUCCESS:
      return action.store ?? state;
    default:
      return state;
  }
};

const pagination = (
  state: PaginationState = {
    links: { first: null, last: null, next: null, previous: null },
    meta: { currentPage: 0, itemCount: 0, itemsPerPage: 0, totalItems: 0, totalPages: 0 },
  },
  action: AllStoresAction,
): PaginationState => {
  switch (action.type) {
    case storeConstants.GET_STORES_SUCCESS: {
      if (!action.stores?.meta) return state;
      return updateObject(state, { links: action.stores.links, meta: action.stores.meta });
    }
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingStores: (
    state: LoadingState | undefined,
    action: StoreAction
  ) => LoadingState;
  IsCreatingStore: (
    state: LoadingState | undefined,
    action: StoreAction
  ) => LoadingState;
  IsSearchingStore: (
    state: LoadingState | undefined,
    action: StoreAction
  ) => LoadingState;
  allStoresList: (
    state: StoresListState | undefined,
    action: AllStoresAction
  ) => StoresListState;
}

const rootReducer = combineReducers({
  IsRequestingStores,
  IsCreatingStore,
  IsSearchingStore,
  allStoresList,
  pagination,
});

export default rootReducer;
