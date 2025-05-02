import { storeConstants } from '@/constants';
import { StoreForm } from '@/types';

interface GetStoresAction {
  type: typeof storeConstants.GET_STORES;
}

export interface CreateStoreAction {
  type: typeof storeConstants.CREATE_STORE;
  data: StoreForm;
}

export interface SearchStoreAction {
  type: typeof storeConstants.SEARCH_STORE;
  data: { text: string };
}

const getStores = (): GetStoresAction => ({
  type: storeConstants.GET_STORES,
});

const createStore = (data: StoreForm): CreateStoreAction => ({
  type: storeConstants.CREATE_STORE,
  data,
});

const searchStore = (data: { text: string }): SearchStoreAction => ({
  type: storeConstants.SEARCH_STORE,
  data,
});

export const storeActions = {
  getStores,
  createStore,
  searchStore,
};
