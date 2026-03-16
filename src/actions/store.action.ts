import { storeConstants } from '@/constants';
import { StoreForm } from '@/types';

interface GetStoresAction {
  type: typeof storeConstants.GET_STORES;
  data?: { page?: number };
}

export interface CreateStoreAction {
  type: typeof storeConstants.CREATE_STORE;
  data: StoreForm;
}

export interface UpdateStoreAction {
  type: typeof storeConstants.UPDATE_STORE;
  data: StoreForm;
}

export interface SearchStoreAction {
  type: typeof storeConstants.SEARCH_STORE;
  data: { text: string };
}

const getStores = (data?: { page?: number }): GetStoresAction => ({
  type: storeConstants.GET_STORES,
  data,
});

const createStore = (data: StoreForm): CreateStoreAction => ({
  type: storeConstants.CREATE_STORE,
  data,
});

const updateStore = (data: StoreForm): UpdateStoreAction => ({
  type: storeConstants.UPDATE_STORE,
  data,
});

const searchStore = (data: { text: string }): SearchStoreAction => ({
  type: storeConstants.SEARCH_STORE,
  data,
});

export interface ActivateStoreAction {
  type: typeof storeConstants.ACTIVATE_STORE;
  data: { ids: number[] };
}

export interface DeactivateStoreAction {
  type: typeof storeConstants.DEACTIVATE_STORE;
  data: { ids: number[] };
}

const activateStore = (data: { ids: number[] }): ActivateStoreAction => ({
  type: storeConstants.ACTIVATE_STORE,
  data,
});

const deactivateStore = (data: { ids: number[] }): DeactivateStoreAction => ({
  type: storeConstants.DEACTIVATE_STORE,
  data,
});

export const storeActions = {
  getStores,
  createStore,
  updateStore,
  searchStore,
  activateStore,
  deactivateStore,
};
