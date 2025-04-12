import { StoreConstants } from '@/types';
import { appConstants } from './app.constant';

const store: string = 'store';

export const storeConstants: StoreConstants = {
  REQUEST_GET_STORES: 'REQUEST_GET_STORES',
  GET_STORES_SUCCESS: 'GET_STORES_SUCCESS',
  GET_STORES_ERROR: 'GET_STORES_ERROR',

  GET_STORES: 'GET_STORES',

  STORE_URI: `${appConstants.BASE_URI}${store}`,
};
