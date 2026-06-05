import { all, put, takeLatest } from 'typed-redux-saga';
import { categoryConstants } from '@/constants';
import {
  appActions,
  ActivateCategoryAction,
  CreateCategoryAction,
  DeactivateCategoryAction,
  DeleteCategoryAction,
  GetCategoriesAction,
  UpdateCategoryAction,
} from '@/actions';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';

function* getCategories({ data }: GetCategoriesAction) {
  yield put({ type: categoryConstants.REQUEST_GET_CATEGORIES });
  try {
    const query = data?.includeInactive ? '?includeInactive=true' : '';
    const uri = `${categoryConstants.CATEGORY_URI}${query}`;
    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;
    yield put({
      type: categoryConstants.GET_CATEGORIES_SUCCESS,
      categories: jsonResponse?.data ?? [],
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, categoryConstants.GET_CATEGORIES_ERROR);
  }
}

function* createCategory({ data }: CreateCategoryAction) {
  yield put({ type: categoryConstants.REQUEST_CREATE_CATEGORY });
  try {
    const jsonResponse = yield* authenticatedRequest(
      categoryConstants.CATEGORY_URI,
      { method: 'POST', body: JSON.stringify(data) },
    );
    if (!jsonResponse) return;
    yield put({
      type: categoryConstants.CREATE_CATEGORY_SUCCESS,
      category: jsonResponse?.data,
    });
    AppEmitter.emit(categoryConstants.CREATE_CATEGORY_SUCCESS, jsonResponse?.data);
    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ?? 'Category created successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, categoryConstants.CREATE_CATEGORY_ERROR);
  }
}

function* updateCategory({ data }: UpdateCategoryAction) {
  yield put({ type: categoryConstants.REQUEST_UPDATE_CATEGORY });
  try {
    const { id, ...rest } = data;
    const jsonResponse = yield* authenticatedRequest(
      `${categoryConstants.CATEGORY_URI}/${id}`,
      { method: 'PATCH', body: JSON.stringify(rest) },
    );
    if (!jsonResponse) return;
    yield put({
      type: categoryConstants.UPDATE_CATEGORY_SUCCESS,
      category: jsonResponse?.data,
    });
    AppEmitter.emit(categoryConstants.UPDATE_CATEGORY_SUCCESS, jsonResponse?.data);
    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ?? 'Category updated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, categoryConstants.UPDATE_CATEGORY_ERROR);
  }
}

function* deleteCategory({ data }: DeleteCategoryAction) {
  yield put({ type: categoryConstants.REQUEST_DELETE_CATEGORY });
  try {
    const jsonResponse = yield* authenticatedRequest(
      `${categoryConstants.CATEGORY_URI}/${data.id}`,
      { method: 'DELETE' },
    );
    if (!jsonResponse) return;
    yield put({ type: categoryConstants.DELETE_CATEGORY_SUCCESS, id: data.id });
    AppEmitter.emit(categoryConstants.DELETE_CATEGORY_SUCCESS, data.id);
    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ?? 'Category deleted successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, categoryConstants.DELETE_CATEGORY_ERROR);
  }
}

function* activateCategory({ data }: ActivateCategoryAction) {
  yield put({ type: categoryConstants.REQUEST_SET_CATEGORY_STATUS });
  try {
    const jsonResponse = yield* authenticatedRequest(
      `${categoryConstants.CATEGORY_URI}/${data.id}/activate`,
      { method: 'PATCH' },
    );
    if (!jsonResponse) return;
    yield put({
      type: categoryConstants.SET_CATEGORY_STATUS_SUCCESS,
      category: jsonResponse?.data,
    });
    AppEmitter.emit(categoryConstants.SET_CATEGORY_STATUS_SUCCESS, jsonResponse?.data);
    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Category activated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, categoryConstants.SET_CATEGORY_STATUS_ERROR);
  }
}

function* deactivateCategory({ data }: DeactivateCategoryAction) {
  yield put({ type: categoryConstants.REQUEST_SET_CATEGORY_STATUS });
  try {
    const jsonResponse = yield* authenticatedRequest(
      `${categoryConstants.CATEGORY_URI}/${data.id}/deactivate`,
      { method: 'PATCH' },
    );
    if (!jsonResponse) return;
    yield put({
      type: categoryConstants.SET_CATEGORY_STATUS_SUCCESS,
      category: jsonResponse?.data,
    });
    AppEmitter.emit(categoryConstants.SET_CATEGORY_STATUS_SUCCESS, jsonResponse?.data);
    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Category deactivated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, categoryConstants.SET_CATEGORY_STATUS_ERROR);
  }
}

function* getCategoriesWatcher() {
  yield takeLatest(categoryConstants.GET_CATEGORIES, getCategories);
}
function* createCategoryWatcher() {
  yield takeLatest(categoryConstants.CREATE_CATEGORY, createCategory);
}
function* updateCategoryWatcher() {
  yield takeLatest(categoryConstants.UPDATE_CATEGORY, updateCategory);
}
function* deleteCategoryWatcher() {
  yield takeLatest(categoryConstants.DELETE_CATEGORY, deleteCategory);
}
function* activateCategoryWatcher() {
  yield takeLatest(categoryConstants.ACTIVATE_CATEGORY, activateCategory);
}
function* deactivateCategoryWatcher() {
  yield takeLatest(categoryConstants.DEACTIVATE_CATEGORY, deactivateCategory);
}

export default function* rootSaga() {
  yield all([
    getCategoriesWatcher(),
    createCategoryWatcher(),
    updateCategoryWatcher(),
    deleteCategoryWatcher(),
    activateCategoryWatcher(),
    deactivateCategoryWatcher(),
  ]);
}
