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

export interface SearchItemAction {
  type: typeof itemConstants.SEARCH_ITEM;
  data: { text: string };
}

export interface CreateItemAction {
  type: typeof itemConstants.CREATE_ITEM;
  data: ItemForm;
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

const searchItem = (data: { text: string }): SearchItemAction => ({
  type: itemConstants.SEARCH_ITEM,
  data,
});

const createItem = (data: ItemForm): CreateItemAction => ({
  type: itemConstants.CREATE_ITEM,
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
  searchItem,
  createItem,
  updateItem,
};
