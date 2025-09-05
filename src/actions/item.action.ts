import { itemConstants } from '@/constants';
import { ItemForm, ItemUnitsForm } from '@/types';

export interface GetDepartmentItemsAction {
  type: typeof itemConstants.GET_DEPARTMENT_ITEMS;
  data: { departmentId: number; page?: number };
}

export interface GetAllDepartmentItemsAction {
  type: typeof itemConstants.GET_ALL_DEPARTMENT_ITEMS;
  data: number;
}

export interface GetAllItemsAction {
  type: typeof itemConstants.GET_ALL_ITEMS;
  data?: { page: number };
}
export interface GetAnItemAction {
  type: typeof itemConstants.GET_AN_ITEM;
  data: { id: number };
}

export interface SearchItemAction {
  type: typeof itemConstants.SEARCH_ITEM;
  data: { text: string };
}

export interface CreateItemAction {
  type: typeof itemConstants.CREATE_ITEM;
  data: ItemForm;
}
export interface CreateItemsAction {
  type: typeof itemConstants.CREATE_ITEMS;
  data: ItemForm[];
}

export interface UpdateItemAction {
  type: typeof itemConstants.UPDATE_ITEM;
  data: ItemUnitsForm;
}

const getDepartmentItems = (data: {
  departmentId: number;
  page?: number;
}): GetDepartmentItemsAction => ({
  type: itemConstants.GET_DEPARTMENT_ITEMS,
  data: data,
});

const getAllDepartmentItems = (id: number): GetAllDepartmentItemsAction => ({
  type: itemConstants.GET_ALL_DEPARTMENT_ITEMS,
  data: id,
});

const getAllItems = (data?: { page: number }): GetAllItemsAction => ({
  type: itemConstants.GET_ALL_ITEMS,
  data,
});

const getAnItem = (data: { id: number }): GetAnItemAction => ({
  type: itemConstants.GET_AN_ITEM,
  data,
});

const searchItem = (data: { text: string }): SearchItemAction => ({
  type: itemConstants.SEARCH_ITEM,
  data,
});

const createItem = (data: ItemForm): CreateItemAction => ({
  type: itemConstants.CREATE_ITEM,
  data,
});

const createItems = (data: ItemForm[]): CreateItemsAction => ({
  type: itemConstants.CREATE_ITEMS,
  data,
});

const updateItem = (data: ItemUnitsForm): UpdateItemAction => ({
  type: itemConstants.UPDATE_ITEM,
  data,
});

export const itemActions = {
  getDepartmentItems,
  getAllDepartmentItems,
  getAllItems,
  getAnItem,
  searchItem,
  createItem,
  createItems,
  updateItem,
};
