import { itemConstants } from '@/constants';

interface GetDepartmentItemsAction {
  type: typeof itemConstants.GET_DEPARTMENT_ITEMS;
  data: number;
}
interface GetAllItemsAction {
  type: typeof itemConstants.GET_ALL_ITEMS;
}

const getDepartmentItems = (id: number): GetDepartmentItemsAction => ({
  type: itemConstants.GET_DEPARTMENT_ITEMS,
  data: id,
});

const getAllItems = (): GetAllItemsAction => ({
  type: itemConstants.GET_ALL_ITEMS,
});

export const itemActions = {
  getDepartmentItems,
  getAllItems,
};
