import { itemConstants } from '../constants';

interface GetDepartmentItemsAction {
  type: typeof itemConstants.GET_DEPARTMENT_ITEMS;
  data: string;
}

const getDepartmentItems = (id: string): GetDepartmentItemsAction => ({
  type: itemConstants.GET_DEPARTMENT_ITEMS,
  data: id
});

export const itemActions = {
    getDepartmentItems,
};
