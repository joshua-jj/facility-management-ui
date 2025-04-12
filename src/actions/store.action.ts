import { storeConstants } from '@/constants';

interface GetStoresAction {
  type: typeof storeConstants.GET_STORES;
}

const getStores = (): GetStoresAction => ({
  type: storeConstants.GET_STORES,
});

export const storeActions = {
  getStores,
};
