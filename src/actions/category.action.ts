import { categoryConstants } from '@/constants';
import { CategoryForm } from '@/types';

export interface GetCategoriesAction {
  type: typeof categoryConstants.GET_CATEGORIES;
  data?: { includeInactive?: boolean };
}

export interface CreateCategoryAction {
  type: typeof categoryConstants.CREATE_CATEGORY;
  data: CategoryForm;
}

export interface UpdateCategoryAction {
  type: typeof categoryConstants.UPDATE_CATEGORY;
  data: CategoryForm & { id: number };
}

export interface DeleteCategoryAction {
  type: typeof categoryConstants.DELETE_CATEGORY;
  data: { id: number };
}

export interface ActivateCategoryAction {
  type: typeof categoryConstants.ACTIVATE_CATEGORY;
  data: { id: number };
}

export interface DeactivateCategoryAction {
  type: typeof categoryConstants.DEACTIVATE_CATEGORY;
  data: { id: number };
}

const getCategories = (data?: {
  includeInactive?: boolean;
}): GetCategoriesAction => ({
  type: categoryConstants.GET_CATEGORIES,
  data,
});

const createCategory = (data: CategoryForm): CreateCategoryAction => ({
  type: categoryConstants.CREATE_CATEGORY,
  data,
});

const updateCategory = (
  data: CategoryForm & { id: number },
): UpdateCategoryAction => ({
  type: categoryConstants.UPDATE_CATEGORY,
  data,
});

const deleteCategory = (data: { id: number }): DeleteCategoryAction => ({
  type: categoryConstants.DELETE_CATEGORY,
  data,
});

const activateCategory = (data: { id: number }): ActivateCategoryAction => ({
  type: categoryConstants.ACTIVATE_CATEGORY,
  data,
});

const deactivateCategory = (data: { id: number }): DeactivateCategoryAction => ({
  type: categoryConstants.DEACTIVATE_CATEGORY,
  data,
});

export const categoryActions = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
};
