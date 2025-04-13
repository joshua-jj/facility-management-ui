import { combineReducers } from 'redux';
import { storeConstants } from '@/constants';
import { LoadingState, Store, StoreAction } from '@/types';

type StoresListState = Store[];

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

const allStoresList = (
  state: StoresListState = [],
  action: StoreAction
): StoresListState => {
  switch (action.type) {
    case storeConstants.GET_STORES_SUCCESS:
      return action.stores ?? state;
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingStores: (
    state: LoadingState | undefined,
    action: StoreAction
  ) => LoadingState;
  allStoresList: (
    state: StoresListState | undefined,
    action: StoreAction
  ) => StoresListState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingStores,
  allStoresList,
});

export default rootReducer;
