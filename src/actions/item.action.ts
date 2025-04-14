import { itemConstants } from '@/constants';

interface GetDepartmentItemsAction {
  type: typeof itemConstants.GET_DEPARTMENT_ITEMS;
  data: number;
}
export interface GetAllItemsAction {
  type: typeof itemConstants.GET_ALL_ITEMS;
  data?: { page: number };
}

export interface SearchItemAction {
  type: typeof itemConstants.SEARCH_ITEM;
  data: { text: string };
}

const getDepartmentItems = (id: number): GetDepartmentItemsAction => ({
  type: itemConstants.GET_DEPARTMENT_ITEMS,
  data: id,
});

const getAllItems = (data?: { page: number }): GetAllItemsAction => ({
  type: itemConstants.GET_ALL_ITEMS,
  data,
});

const searchItem = (data: { text: string }): SearchItemAction => ({
  type: itemConstants.SEARCH_ITEM,
  data,
});

export const itemActions = {
  getDepartmentItems,
  getAllItems,
  searchItem,
};
