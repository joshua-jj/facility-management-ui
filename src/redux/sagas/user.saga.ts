import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, userConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { SetSnackBarPayload, Users } from '@/types';
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

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}
interface ParsedResponse {
  message: string;
  error: string;
  data: {
    user: { [key: string]: unknown };
    id: string;
  };
  items: {
    user: { [key: string]: unknown };
    id: string;
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

function* getUsers({ data }: GetUsersAction) {
  yield put({ type: userConstants.REQUEST_GET_USERS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let userUri = `${userConstants.USER_URI}`;

    if (data?.page) {
      userUri = `${userUri}?page=${data.page}`;
    }

    const requestFn = () =>
      createRequestWithToken(userUri, { method: 'GET' })(user?.token as string);
    const userReq: Request = yield call(requestFn);

    const response: Users = yield call(fetch, userReq);
    if (response.status === 401) {
      yield call(clearObjectFromStorage, authConstants.USER_KEY);

      yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
      return;
    }
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: userConstants.GET_USERS_SUCCESS,
      users: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: userConstants.GET_USERS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: userConstants.GET_USERS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* searchUser({ data }: SearchUserAction) {
  yield put({ type: userConstants.REQUEST_SEARCH_USER });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const userUri = `${userConstants.USER_URI}/search?q=${data.text}`;

    const requestFn = () =>
      createRequestWithToken(userUri, { method: 'GET' })(user?.token as string);
    const userReq: Request = yield call(requestFn);

    const response: User = yield call(fetch, userReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: userConstants.SEARCH_USER_SUCCESS,
      user: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: userConstants.SEARCH_USER_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: userConstants.SEARCH_USER_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getUsersByRole({ data }: GetUsersByRoleAction) {
  yield put({ type: userConstants.REQUEST_GET_USERS_BY_ROLE });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const userUri = `${userConstants.USER_URI}/role/${data.roleId}`;

    const requestFn = () =>
      createRequestWithToken(userUri, { method: 'GET' })(user?.token as string);
    const userReq: Request = yield call(requestFn);

    const response: Users = yield call(fetch, userReq);
    if (response.status === 401) {
      yield call(clearObjectFromStorage, authConstants.USER_KEY);

      yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
      return;
    }
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: userConstants.GET_USERS_BY_ROLE_SUCCESS,
      user: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: userConstants.GET_USERS_BY_ROLE_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: userConstants.GET_USERS_BY_ROLE_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* createUser({ data }: CreateUserAction) {
  yield put({ type: userConstants.REQUEST_CREATE_USER });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${userConstants.USER_URI}/initiate`;
      const userReq = createRequestWithToken(userUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: Users = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: userConstants.CREATE_USER_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: userConstants.GET_USERS,
      });

      AppEmitter.emit(userConstants.CREATE_USER_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'User created successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      console.log('res', res);

      yield put({
        type: userConstants.CREATE_USER_ERROR,
        error:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
        // message: res?.message ?? res?.message?.[0] ?? 'Something went wrong',
        variant: 'error',
      };
      console.log('payload', payload);

      yield put(appActions.setSnackBar(payload));

      return;
    }
    // yield put({
    //   type: userConstants.CREATE_USER_ERROR,
    //   error:
    //     ((error as ApiError)?.error || (error as ApiError)?.message) ??
    //     'Something went wrong',
    // });
    // const payload: SetSnackBarPayload = {
    //   type: 'error',
    //   message:
    //     ((error as ApiError)?.error || (error as ApiError)?.message) ??
    //     'Something went wrong',
    //   variant: 'error',
    // };
    // yield put(appActions.setSnackBar(payload));
  }
}

function* updateUserRole({ data }: UpdateUserRoleAction) {
  yield put({ type: userConstants.REQUEST_UPDATE_USER_ROLE });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${userConstants.USER_URI}/user/${data.roleId}/role`;
      const userReq = createRequestWithToken(userUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: Users = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: userConstants.UPDATE_USER_ROLE_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: userConstants.GET_USERS,
      });

      AppEmitter.emit(userConstants.UPDATE_USER_ROLE_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'User role updated successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      console.log('res', res);

      yield put({
        type: userConstants.UPDATE_USER_ROLE_ERROR,
        error:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
        // message: res?.message ?? res?.message?.[0] ?? 'Something went wrong',
        variant: 'error',
      };
      console.log('payload', payload);

      yield put(appActions.setSnackBar(payload));

      return;
    }
  }
}

function* activateUser({ data }: UserStatusAction) {
  yield put({ type: userConstants.REQUEST_ACTIVATE_USER });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${userConstants.USER_URI}/activate`;
      const userReq = createRequestWithToken(userUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: Users = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: userConstants.ACTIVATE_USER_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: userConstants.GET_USERS,
      });

      AppEmitter.emit(userConstants.ACTIVATE_USER_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'User role updated successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      console.log('res', res);

      yield put({
        type: userConstants.ACTIVATE_USER_ERROR,
        error:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
        // message: res?.message ?? res?.message?.[0] ?? 'Something went wrong',
        variant: 'error',
      };
      console.log('payload', payload);

      yield put(appActions.setSnackBar(payload));

      return;
    }
  }
}

function* deactivateUser({ data }: UserStatusAction) {
  yield put({ type: userConstants.REQUEST_DEACTIVATE_USER });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${userConstants.USER_URI}/deactivate`;
      const userReq = createRequestWithToken(userUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: Users = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: userConstants.DEACTIVATE_USER_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: userConstants.GET_USERS,
      });

      AppEmitter.emit(userConstants.DEACTIVATE_USER_SUCCESS, jsonResponse);
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'User role updated successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      console.log('res', res);

      yield put({
        type: userConstants.DEACTIVATE_USER_ERROR,
        error:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
        // message: res?.message ?? res?.message?.[0] ?? 'Something went wrong',
        variant: 'error',
      };
      console.log('payload', payload);

      yield put(appActions.setSnackBar(payload));

      return;
    }
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
