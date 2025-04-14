import { StoreConstants } from '@/types';
import { appConstants } from './app.constant';

const store: string = 'store';

export const storeConstants: StoreConstants = {
  REQUEST_GET_STORES: 'REQUEST_GET_STORES',
  GET_STORES_SUCCESS: 'GET_STORES_SUCCESS',
  GET_STORES_ERROR: 'GET_STORES_ERROR',

  REQUEST_SEARCH_STORE: 'REQUEST_SEARCH_STORE',
  SEARCH_STORE_SUCCESS: 'SEARCH_STORE_SUCCESS',
  SEARCH_STORE_ERROR: 'SEARCH_STORE_ERROR',

  GET_STORES: 'GET_STORES',
  SEARCH_STORE: 'SEARCH_STORE',

  STORE_URI: `${appConstants.BASE_URI}${store}`,
};
