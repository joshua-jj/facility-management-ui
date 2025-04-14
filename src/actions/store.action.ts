import { storeConstants } from '@/constants';

interface GetStoresAction {
  type: typeof storeConstants.GET_STORES;
}

export interface SearchStoreAction {
  type: typeof storeConstants.SEARCH_STORE;
  data: { text: string };
}

const getStores = (): GetStoresAction => ({
  type: storeConstants.GET_STORES,
});

const searchStore = (data: { text: string }): SearchStoreAction => ({
  type: storeConstants.SEARCH_STORE,
  data,
});

export const storeActions = {
  getStores,
  searchStore,
};
