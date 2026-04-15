import { put, takeLatest, all } from 'typed-redux-saga';
import { userConstants } from '@/constants';
import { SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateUserAction,
  GetUsersAction,
  GetUsersByRoleAction,
  SearchUserAction,
  UpdateUserRoleAction,
  UserStatusAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getUsers({ data }: GetUsersAction) {
  yield put({ type: userConstants.REQUEST_GET_USERS });

  try {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 10;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (data?.search) params.set('search', data.search);
    if (data?.status) params.set('status', data.status);
    if (data?.roleId) params.set('roleId', String(data.roleId));
    if (data?.departmentId) params.set('departmentId', String(data.departmentId));
    if (data?.gender) params.set('gender', data.gender);

    const userUri = `${userConstants.USER_URI}?${params.toString()}`;

    const jsonResponse = yield* authenticatedRequest(userUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: userConstants.GET_USERS_SUCCESS,
      users: jsonResponse.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.GET_USERS_ERROR, false);
  }
}

function* searchUser({ data }: SearchUserAction) {
  yield put({ type: userConstants.REQUEST_SEARCH_USER });

  try {
    const userUri = `${userConstants.USER_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(userUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: userConstants.SEARCH_USER_SUCCESS,
      user: jsonResponse.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.SEARCH_USER_ERROR, false);
  }
}

function* getUsersByRole({ data }: GetUsersByRoleAction) {
  yield put({ type: userConstants.REQUEST_GET_USERS_BY_ROLE });

  try {
    const userUri = `${userConstants.USER_URI}/role/${data.roleId}`;

    const jsonResponse = yield* authenticatedRequest(userUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: userConstants.GET_USERS_BY_ROLE_SUCCESS,
      user: jsonResponse.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.GET_USERS_BY_ROLE_ERROR, false);
  }
}

function* createUser({ data }: CreateUserAction) {
  yield put({ type: userConstants.REQUEST_CREATE_USER });

  try {
    if (data) {
      const userUri = `${userConstants.USER_URI}/initiate`;

      const jsonResponse = yield* authenticatedRequest(userUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: userConstants.CREATE_USER_SUCCESS,
        user: jsonResponse.data,
      });

      yield put({ type: userConstants.GET_USERS });

      AppEmitter.emit(userConstants.CREATE_USER_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse.message as string) ?? 'User created successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.CREATE_USER_ERROR);
  }
}

function* updateUserRole({ data }: UpdateUserRoleAction) {
  yield put({ type: userConstants.REQUEST_UPDATE_USER_ROLE });

  try {
    if (data) {
      const { userId, ...restData } = data;
      const userUri = `${userConstants.USER_URI}/${userId}/role`;

      const jsonResponse = yield* authenticatedRequest(userUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: userConstants.UPDATE_USER_ROLE_SUCCESS,
        user: jsonResponse.data,
      });

      yield put({ type: userConstants.GET_USERS });

      AppEmitter.emit(userConstants.UPDATE_USER_ROLE_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse.message as string) ?? 'User role updated successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.UPDATE_USER_ROLE_ERROR);
  }
}

function* activateUser({ data }: UserStatusAction) {
  yield put({ type: userConstants.REQUEST_ACTIVATE_USER });

  try {
    if (data) {
      const userUri = `${userConstants.USER_URI}/activate`;

      const jsonResponse = yield* authenticatedRequest(userUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: userConstants.ACTIVATE_USER_SUCCESS,
        user: jsonResponse.data,
      });

      yield put({ type: userConstants.GET_USERS });

      AppEmitter.emit(userConstants.ACTIVATE_USER_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse.message as string) ?? 'User activated successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.ACTIVATE_USER_ERROR);
  }
}

function* deactivateUser({ data }: UserStatusAction) {
  yield put({ type: userConstants.REQUEST_DEACTIVATE_USER });

  try {
    if (data) {
      const userUri = `${userConstants.USER_URI}/deactivate`;

      const jsonResponse = yield* authenticatedRequest(userUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: userConstants.DEACTIVATE_USER_SUCCESS,
        user: jsonResponse.data,
      });

      yield put({ type: userConstants.GET_USERS });

      AppEmitter.emit(userConstants.DEACTIVATE_USER_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse.message as string) ?? 'User deactivated successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, userConstants.DEACTIVATE_USER_ERROR);
  }
}

function* getUsersWatcher() {
  yield takeLatest(userConstants.GET_USERS, getUsers);
}

function* searchUserWatcher() {
  yield takeLatest(userConstants.SEARCH_USER, searchUser);
}
function* getUsersByRoleWatcher() {
  yield takeLatest(userConstants.GET_USERS_BY_ROLE, getUsersByRole);
}

function* createUserWatcher() {
  yield takeLatest(userConstants.CREATE_USER, createUser);
}

function* updateUserRoleWatcher() {
  yield takeLatest(userConstants.UPDATE_USER_ROLE, updateUserRole);
}

function* activateUserWatcher() {
  yield takeLatest(userConstants.ACTIVATE_USER, activateUser);
}

function* deactivateUserWatcher() {
  yield takeLatest(userConstants.DEACTIVATE_USER, deactivateUser);
}

export default function* rootSaga() {
  yield all([
    getUsersWatcher(),
    searchUserWatcher(),
    getUsersByRoleWatcher(),
    createUserWatcher(),
    updateUserRoleWatcher(),
    activateUserWatcher(),
    deactivateUserWatcher(),
  ]);
}
