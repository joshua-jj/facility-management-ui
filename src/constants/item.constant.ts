import { ItemConstants } from '@/types';
import { appConstants } from './app.constant';

const item: string = 'item';

export const itemConstants: ItemConstants = {
    REQUEST_GET_DEPARTMENT_ITEMS: 'REQUEST_GET_DEPARTMENT_ITEMS',
    GET_DEPARTMENT_ITEMS_SUCCESS: 'GET_DEPARTMENT_ITEMS_SUCCESS',
    GET_DEPARTMENT_ITEMS_ERROR: 'GET_DEPARTMENT_ITEMS_ERROR',
  
    GET_DEPARTMENT_ITEMS: 'GET_DEPARTMENT_ITEMS',
  
  ITEM_URI: `${appConstants.BASE_URI}${item}`,
};
