import { itemConstants } from '../constants';

interface GetDepartmentItemsAction {
  type: typeof itemConstants.GET_DEPARTMENT_ITEMS;
  data: number;
}

const getDepartmentItems = (id: number): GetDepartmentItemsAction => ({
  type: itemConstants.GET_DEPARTMENT_ITEMS,
  data: id,
});

export const itemActions = {
  getDepartmentItems,
};
