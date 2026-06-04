import { combineReducers } from 'redux';
import { categoryConstants } from '@/constants';
import { Action, Category, LoadingState } from '@/types';

interface CategoriesAction extends Action {
  categories: Category[];
}

const IsRequestingCategories = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case categoryConstants.REQUEST_GET_CATEGORIES:
      return true;
    case categoryConstants.GET_CATEGORIES_SUCCESS:
    case categoryConstants.GET_CATEGORIES_ERROR:
      return false;
    default:
      return state;
  }
};

const IsMutatingCategory = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case categoryConstants.REQUEST_CREATE_CATEGORY:
    case categoryConstants.REQUEST_UPDATE_CATEGORY:
    case categoryConstants.REQUEST_DELETE_CATEGORY:
      return true;
    case categoryConstants.CREATE_CATEGORY_SUCCESS:
    case categoryConstants.CREATE_CATEGORY_ERROR:
    case categoryConstants.UPDATE_CATEGORY_SUCCESS:
    case categoryConstants.UPDATE_CATEGORY_ERROR:
    case categoryConstants.DELETE_CATEGORY_SUCCESS:
    case categoryConstants.DELETE_CATEGORY_ERROR:
      return false;
    default:
      return state;
  }
};

const allCategoriesList = (
  state: Category[] = [],
  action: CategoriesAction,
): Category[] => {
  switch (action.type) {
    case categoryConstants.GET_CATEGORIES_SUCCESS:
      return action.categories ?? [];
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  IsRequestingCategories,
  IsMutatingCategory,
  allCategoriesList,
});

export default rootReducer;
